<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { askAi, getAiChatsPage } from '@/api/ai'
import { normalizeCaughtError } from '@/api/client'

const question = ref('오늘 식단에서 부족한 점을 알려줘')
const chats = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const pagination = reactive({
  page: 1,
  pageSize: 10,
  count: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
})

const resultSummary = computed(() => {
  if (!pagination.count) return '대화 0개'
  const start = (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(start + Math.ceil(chats.value.length / 2) - 1, pagination.count)
  return `대화 ${pagination.count}개 중 ${start}-${end}`
})

function syncPagination(data) {
  pagination.page = data.page || 1
  pagination.pageSize = data.pageSize || pagination.pageSize
  pagination.count = data.count || 0
  pagination.totalPages = data.totalPages || 1
  pagination.hasNext = data.hasNext
  pagination.hasPrevious = data.hasPrevious
}

function actionCardsFor(text) {
  const source = String(text || '').toLowerCase()
  const actions = []

  if (source.includes('식단') || source.includes('영양') || source.includes('단백') || source.includes('칼로리') || source.includes('diet')) {
    actions.push({ label: '식단 추천 받기', to: '/diet/recommend' })
    actions.push({ label: '오늘 식단 평가', to: '/diet/evaluation' })
    actions.push({ label: '식단 기록하기', to: '/diet/records' })
  }

  if (source.includes('운동') || source.includes('루틴') || source.includes('중량') || source.includes('workout') || source.includes('exercise')) {
    actions.push({ label: '운동 루틴 추천', to: '/workout/recommend' })
    actions.push({ label: '진행 추천 받기', to: '/workout/progression' })
    actions.push({ label: '운동 기록하기', to: '/workout/logs' })
  }

  return actions.filter((action, index, list) => list.findIndex((item) => item.to === action.to) === index)
}

function isGuardrailBlocked(message) {
  const source = String(message || '').toLowerCase()
  return (
    source.includes('blocked') ||
    source.includes('guardrail') ||
    source.includes('policy') ||
    source.includes('unsafe') ||
    source.includes('유해') ||
    source.includes('부적절')
  )
}

function friendlyAiErrorMessage(message) {
  if (isGuardrailBlocked(message)) {
    return [
      '이 질문은 안전 기준에 걸려서 답변할 수 없습니다.',
      'HealthFit에서는 식단, 운동, 영양, 건강한 습관과 관련된 질문만 도와드릴 수 있어요.',
      '예: "다이어트 식단 작성해줘", "무릎 부담 적은 운동 추천해줘"처럼 다시 질문해보세요.',
    ].join('\n')
  }

  return 'AI 답변을 가져오지 못했습니다. 잠시 후 다시 질문해보세요.'
}

function toChatItems(apiChat) {
  const combinedText = `${apiChat.question || ''}\n${apiChat.answer || ''}`

  return [
    {
      id: `${apiChat.id}-q`,
      role: 'user',
      message: apiChat.question,
      actions: [],
    },
    {
      id: `${apiChat.id}-a`,
      role: 'assistant',
      message: apiChat.answer,
      actions: actionCardsFor(combinedText),
    },
  ]
}

async function loadChats(page = pagination.page) {
  errorMessage.value = ''

  try {
    const data = await getAiChatsPage({ page, page_size: pagination.pageSize })
    chats.value = data.results
      .slice()
      .reverse()
      .flatMap(toChatItems)
    syncPagination(data)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  }
}

async function askQuestion() {
  errorMessage.value = ''

  if (!question.value.trim()) {
    errorMessage.value = '질문 내용을 입력해주세요.'
    return
  }

  const currentQuestion = question.value.trim()
  chats.value.push({
    id: `pending-${Date.now()}`,
    role: 'user',
    message: currentQuestion,
    actions: [],
  })
  question.value = ''
  isLoading.value = true

  try {
    const answer = await askAi({ question: currentQuestion })
    chats.value.push(...toChatItems(answer).slice(1))
    await loadChats(1)
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    chats.value.push({
      id: `error-${Date.now()}`,
      role: 'assistant',
      message: friendlyAiErrorMessage(apiError.message),
      actions: [
        { label: '식단 추천 받기', to: '/diet/recommend' },
        { label: '운동 루틴 추천', to: '/workout/recommend' },
        { label: '진행 현황 보기', to: '/progress' },
      ],
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadChats(1))
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="AI Chat"
      title="AI 질문 답변"
      description="식단, 운동, 영양 질문을 HealthFit PT 코치에게 물어보고 관련 기록 화면으로 이어갑니다."
    />

    <section class="content-grid">
      <section class="surface-card chat-panel" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">History</p>
            <h2>최근 AI 대화</h2>
          </div>
          <span class="chip">{{ resultSummary }}</span>
        </div>

        <article
          v-for="chat in chats"
          :key="chat.id"
          class="chat-message"
          :class="{ 'is-user': chat.role === 'user' }"
        >
          <span>{{ chat.role === 'user' ? '나' : 'HealthFit AI' }}</span>
          <p>{{ chat.message }}</p>

          <div v-if="chat.actions.length" class="button-row routine-quick-actions">
            <RouterLink v-for="action in chat.actions" :key="action.to" class="btn btn-secondary" :to="action.to">
              {{ action.label }}
            </RouterLink>
          </div>
        </article>

        <div v-if="pagination.totalPages > 1" class="pagination-panel">
          <button class="btn btn-secondary" type="button" :disabled="!pagination.hasPrevious" @click="loadChats(pagination.page - 1)">
            이전
          </button>
          <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button class="btn btn-secondary" type="button" :disabled="!pagination.hasNext" @click="loadChats(pagination.page + 1)">
            다음
          </button>
        </div>

        <StateBlock
          v-if="isLoading"
          type="loading"
          title="AI 답변 준비 중"
          message="서버에서 PT 코치 답변을 생성하고 있습니다."
        />

        <StateBlock
          v-if="!isLoading && chats.length === 0"
          type="empty"
          title="아직 대화가 없습니다"
          message="오른쪽 입력창에서 첫 질문을 보내보세요."
        />
      </section>

      <form class="form-card" style="grid-column: span 4; align-self: start" @submit.prevent="askQuestion">
        <div class="ai-status-banner">
          <span class="status-badge">PT Coach</span>
          <p>백엔드 가드레일과 최근 대화 기록을 기반으로 답변합니다.</p>
        </div>

        <div class="field-group">
          <label for="question">질문</label>
          <textarea id="question" v-model="question" />
        </div>

        <StateBlock
          v-if="errorMessage"
          type="error"
          title="질문을 보낼 수 없습니다"
          :message="errorMessage"
        />

        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '답변 대기 중...' : 'AI에게 질문하기' }}
        </button>
      </form>
    </section>
  </main>
</template>
