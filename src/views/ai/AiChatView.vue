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

function toChatItems(apiChat) {
  return [
    {
      id: `${apiChat.id}-q`,
      role: 'user',
      message: apiChat.question,
    },
    {
      id: `${apiChat.id}-a`,
      role: 'assistant',
      message: apiChat.answer,
    },
  ]
}

async function loadChats(page = pagination.page) {
  errorMessage.value = ''

  try {
    const data = await getAiChatsPage({ page, page_size: pagination.pageSize })
    chats.value = data.results.flatMap(toChatItems).reverse()
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
  })
  question.value = ''
  isLoading.value = true

  try {
    const answer = await askAi({ question: currentQuestion })
    chats.value.push(...toChatItems(answer).slice(1))
    await loadChats(1)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
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
      title="AI 질문 응답"
      description="식단, 운동, 영양 정보를 HealthFit AI에게 질문합니다."
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
          title="AI 응답을 준비하는 중입니다"
          message="서버에서 답변을 생성하고 있습니다."
        />

        <StateBlock
          v-if="!isLoading && chats.length === 0"
          type="empty"
          title="아직 대화가 없습니다"
          message="오른쪽 입력창에서 첫 질문을 보내보세요."
        />
      </section>

      <form class="form-card" style="grid-column: span 4" @submit.prevent="askQuestion">
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
          {{ isLoading ? '응답 대기 중...' : 'AI에게 질문하기' }}
        </button>
      </form>
    </section>
  </main>
</template>
