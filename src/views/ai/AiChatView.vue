<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { askAi, getAiChatsPage } from '@/api/ai'
import { normalizeCaughtError } from '@/api/client'

const question = ref('')
const chats = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const chatScroll = ref(null)
const messageEnd = ref(null)
const questionInput = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  count: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
})

const promptSuggestions = [
  '닭가슴살과 계란은 단백질 차이가 어떻게 돼?',
  '고구마 100g은 칼로리와 탄수화물이 어느 정도야?',
  '운동 전후에는 어떤 영양소를 챙기면 좋아?',
  '야식을 자주 먹을 때 건강하게 줄이는 방법 알려줘',
]

const resultSummary = computed(() => {
  if (!pagination.count) return '대화 0개'

  const start = (pagination.page - 1) * pagination.pageSize + 1
  const currentConversationCount = Math.ceil(chats.value.length / 2)
  const end = Math.min(start + currentConversationCount - 1, pagination.count)

  return `대화 ${pagination.count}개 중 ${start}-${end}`
})

function unwrapApiData(response) {
  if (response?.data?.success === true && response.data.data !== undefined) return response.data.data
  if (response?.success === true && response.data !== undefined) return response.data
  if (response?.data !== undefined) return response.data
  return response
}

function unwrapPageData(response) {
  const data = unwrapApiData(response)

  if (Array.isArray(data)) {
    return {
      count: data.length,
      page: 1,
      page_size: data.length || pagination.pageSize,
      total_pages: 1,
      has_next: false,
      has_previous: false,
      results: data,
    }
  }

  return {
    count: data?.count ?? 0,
    page: data?.page ?? 1,
    page_size: data?.pageSize ?? data?.page_size ?? pagination.pageSize,
    total_pages: data?.totalPages ?? data?.total_pages ?? 1,
    has_next: data?.hasNext ?? data?.has_next ?? false,
    has_previous: data?.hasPrevious ?? data?.has_previous ?? false,
    results: Array.isArray(data?.results) ? data.results : [],
  }
}

function syncPagination(data) {
  pagination.page = data?.page ?? 1
  pagination.pageSize = data?.pageSize ?? data?.page_size ?? pagination.pageSize
  pagination.count = data?.count ?? 0
  pagination.totalPages = data?.totalPages ?? data?.total_pages ?? 1
  pagination.hasNext = data?.hasNext ?? data?.has_next ?? false
  pagination.hasPrevious = data?.hasPrevious ?? data?.has_previous ?? false
}

function actionCardsFor() {
  // 이 페이지는 AI 채팅 API만 사용하는 상담 화면이다.
  // 식단 추천, 식단 평가, 운동 루틴 추천 같은 별도 기능 페이지로 유도하지 않는다.
  return []
}

function isScopeOrGuardrailBlocked(message) {
  const source = String(message || '').toLowerCase()

  return (
    source.includes('blocked') ||
    source.includes('guardrail') ||
    source.includes('policy') ||
    source.includes('unsafe') ||
    source.includes('out of scope') ||
    source.includes('unsupported') ||
    source.includes('healthfit is a service for diet') ||
    source.includes('please ask about meal plans') ||
    source.includes('meal plans, workout routines, nutrition') ||
    source.includes('유해') ||
    source.includes('부적절') ||
    source.includes('안전 기준') ||
    source.includes('지원하지 않는') ||
    source.includes('범위를 벗어난')
  )
}

function friendlyScopeMessage() {
  return [
    'HealthFit에서 답변할 수 있는 범위를 벗어난 질문입니다.',
    '음식의 영양성분, 탄단지, 칼로리, 운동 전후 영양, 건강한 식습관과 관련된 질문으로 다시 입력해주세요.',
    '예: "닭가슴살 100g 단백질 알려줘", "운동 전에 탄수화물 먹어도 돼?", "야식 줄이는 방법 알려줘"',
  ].join('\n')
}

function friendlyAiErrorMessage(message) {
  const source = String(message || '').toLowerCase()

  if (isScopeOrGuardrailBlocked(message)) {
    return friendlyScopeMessage()
  }

  if (
    source.includes('network') ||
    source.includes('timeout') ||
    source.includes('failed') ||
    source.includes('500') ||
    source.includes('502') ||
    source.includes('503') ||
    source.includes('server') ||
    source.includes('fetch')
  ) {
    return 'AI 서버 응답이 원활하지 않습니다. 잠시 후 다시 질문해주세요.'
  }

  if (
    source.includes('401') ||
    source.includes('unauthorized') ||
    source.includes('authentication') ||
    source.includes('token')
  ) {
    return '로그인 정보가 만료되었습니다. 다시 로그인한 뒤 이용해주세요.'
  }

  if (source.includes('403') || source.includes('forbidden')) {
    return '이 기능을 이용할 권한이 없습니다. 로그인 상태를 확인해주세요.'
  }

  if (source.includes('400') || source.includes('bad request')) {
    return '질문 형식이 올바르지 않습니다. 질문 내용을 조금 더 구체적으로 작성해주세요.'
  }

  if (source.includes('rate') || source.includes('quota') || source.includes('limit')) {
    return 'AI 요청량이 많아 잠시 대기 중입니다. 조금 뒤에 다시 질문해주세요.'
  }

  return 'AI 답변을 가져오지 못했습니다. 잠시 후 다시 질문해보세요.'
}

function normalizeChatMessage(message) {
  const text = String(message || '').trim()

  if (!text) {
    return '답변 내용이 비어 있습니다. 잠시 후 다시 질문해주세요.'
  }

  if (isScopeOrGuardrailBlocked(text)) {
    return friendlyScopeMessage()
  }

  return text
}

function toChatItems(apiChat) {
  const chat = unwrapApiData(apiChat)
  const combinedText = `${chat?.question || ''}\n${chat?.answer || ''}`
  const id = chat?.id ?? Date.now()

  return [
    {
      id: `${id}-q`,
      role: 'user',
      message: chat?.question || '',
      actions: [],
    },
    {
      id: `${id}-a`,
      role: 'assistant',
      message: normalizeChatMessage(chat?.answer),
      actions: actionCardsFor(combinedText),
    },
  ].filter((item) => item.message)
}

async function scrollToLatest({ focusInput = false, instant = false } = {}) {
  await nextTick()

  if (chatScroll.value) {
    chatScroll.value.scrollTo({
      top: chatScroll.value.scrollHeight,
      behavior: instant ? 'auto' : 'smooth',
    })
  } else {
    messageEnd.value?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth', block: 'end' })
  }

  if (focusInput) {
    questionInput.value?.focus()
  }
}

function autoResizeComposer() {
  const textarea = questionInput.value
  if (!textarea) return

  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`
}

function handleComposerKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey) return

  event.preventDefault()
  askQuestion()
}

function applySuggestion(text) {
  question.value = text
  nextTick(() => {
    autoResizeComposer()
    questionInput.value?.focus()
  })
}

async function loadChats(page = pagination.page) {
  errorMessage.value = ''

  try {
    const response = await getAiChatsPage({ page, page_size: pagination.pageSize })
    const pageData = unwrapPageData(response)

    chats.value = pageData.results
      .slice()
      .reverse()
      .flatMap(toChatItems)

    syncPagination(pageData)
    await scrollToLatest({ focusInput: true, instant: true })
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = friendlyAiErrorMessage(apiError.message)
  }
}

async function askQuestion() {
  errorMessage.value = ''

  if (!question.value.trim()) {
    errorMessage.value = '질문 내용을 입력해주세요.'
    return
  }

  const currentQuestion = question.value.trim()
  const pendingId = `pending-${Date.now()}`

  chats.value.push({
    id: `${pendingId}-q`,
    role: 'user',
    message: currentQuestion,
    actions: [],
  })

  question.value = ''
  autoResizeComposer()
  isLoading.value = true

  await scrollToLatest()

  try {
    const response = await askAi({ question: currentQuestion })
    const answer = unwrapApiData(response)
    const assistantItems = toChatItems(answer).filter((item) => item.role === 'assistant')

    if (assistantItems.length) {
      chats.value.push(...assistantItems)
    } else {
      chats.value.push({
        id: `${pendingId}-a`,
        role: 'assistant',
        message: '답변을 가져왔지만 표시할 내용이 없습니다. 잠시 후 다시 질문해주세요.',
        actions: [],
      })
    }

    await scrollToLatest({ focusInput: true })
    await loadChats(1)
  } catch (error) {
    const apiError = normalizeCaughtError(error)

    chats.value.push({
      id: `${pendingId}-error`,
      role: 'assistant',
      message: friendlyAiErrorMessage(apiError.message),
      actions: [],
    })

    await scrollToLatest({ focusInput: true })
  } finally {
    isLoading.value = false
    await scrollToLatest({ focusInput: true })
  }
}

onMounted(async () => {
  await loadChats(1)
  await scrollToLatest({ focusInput: true, instant: true })
})
</script>

<template>
  <main class="hf-ai-page">
    <section class="hf-ai-container">
      <div class="hf-ai-header">
        <PageHeader
          eyebrow="AI Chat"
          title="AI 상담"
          description="식단, 운동, 영양 질문을 HealthFit PT 코치에게 물어보세요."
        />
        <span class="chip">{{ resultSummary }}</span>
      </div>

      <section class="hf-ai-workspace">
        <aside class="hf-ai-side-panel">
          <div class="hf-coach-card">
            <span class="hf-coach-badge">PT 코치</span>
            <h2>HealthFit AI</h2>
            <p>
              음식의 영양성분, 탄단지, 칼로리, 운동 전후 영양처럼
              건강 관리에 필요한 기본 정보를 쉽게 설명합니다.
            </p>
          </div>

          <div class="hf-suggestion-panel">
            <p class="hf-panel-label">추천 질문</p>
            <button
              v-for="suggestion in promptSuggestions"
              :key="suggestion"
              class="hf-suggestion-button"
              type="button"
              @click="applySuggestion(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>

          <div class="hf-scope-panel">
            <p class="hf-panel-label">답변 가능 범위</p>
            <ul>
              <li>음식별 칼로리와 탄단지 정보</li>
              <li>단백질, 탄수화물, 지방 등 영양소 설명</li>
              <li>운동 전후 영양 섭취와 회복 관리</li>
              <li>건강한 식습관과 생활 습관 조언</li>
            </ul>
          </div>
        </aside>

        <section class="hf-chat-card">
          <section ref="chatScroll" class="hf-chat-thread" aria-live="polite">
            <div v-if="chats.length === 0 && !isLoading" class="hf-chat-empty">
              <span class="hf-empty-badge">HealthFit PT</span>
              <h2>상담을 시작해보세요</h2>
              <p>
                음식의 영양성분, 단백질 섭취량, 운동 전후 식사, 건강한 습관처럼
                상담형 질문을 입력하면 바로 답변을 받을 수 있습니다.
              </p>
            </div>

            <article
              v-for="chat in chats"
              :key="chat.id"
              class="hf-chat-message"
              :class="{ 'is-user': chat.role === 'user', 'is-assistant': chat.role === 'assistant' }"
            >
              <span>{{ chat.role === 'user' ? '나' : 'HealthFit AI' }}</span>
              <p>{{ chat.message }}</p>

              <div v-if="chat.actions.length" class="hf-chat-actions">
                <RouterLink v-for="action in chat.actions" :key="action.to" class="btn btn-secondary" :to="action.to">
                  {{ action.label }}
                </RouterLink>
              </div>
            </article>

            <div v-if="isLoading" class="hf-chat-message is-assistant is-thinking">
              <span>HealthFit AI</span>
              <p>
                <i></i>
                <i></i>
                <i></i>
              </p>
            </div>

            <StateBlock
              v-if="errorMessage"
              type="error"
              title="질문을 보낼 수 없습니다"
              :message="errorMessage"
            />

            <div v-if="pagination.totalPages > 1" class="pagination-panel hf-chat-pagination">
              <button class="btn btn-secondary" type="button" :disabled="!pagination.hasPrevious || isLoading" @click="loadChats(pagination.page - 1)">
                이전
              </button>
              <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
              <button class="btn btn-secondary" type="button" :disabled="!pagination.hasNext || isLoading" @click="loadChats(pagination.page + 1)">
                다음
              </button>
            </div>

            <div ref="messageEnd" class="hf-message-end" aria-hidden="true" />
          </section>

          <form class="hf-ai-composer" @submit.prevent="askQuestion">
            <div class="hf-composer-input-wrap">
              <textarea
                id="question"
                ref="questionInput"
                v-model="question"
                rows="1"
                placeholder="식단, 운동, 영양에 대해 질문해보세요"
                @input="autoResizeComposer"
                @keydown="handleComposerKeydown"
              />
              <span>Enter 전송 · Shift+Enter 줄바꿈</span>
            </div>

            <button class="hf-composer-send" type="submit" :disabled="isLoading || !question.trim()" aria-label="질문 보내기">
              {{ isLoading ? '...' : '전송' }}
            </button>
          </form>
        </section>
      </section>
    </section>
  </main>
</template>

<style scoped>
.hf-ai-page {
  min-height: calc(100vh - 72px);
  padding: 2rem 1.25rem 2.5rem;
}

.hf-ai-container {
  width: min(1320px, 100%);
  margin: 0 auto;
}

.hf-ai-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.hf-ai-header .chip {
  margin-top: 0.6rem;
  white-space: nowrap;
}

.hf-ai-workspace {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 1.25rem;
  align-items: stretch;
}

.hf-ai-side-panel {
  position: sticky;
  top: 92px;
  align-self: start;
  max-height: calc(100vh - 112px);
  overflow-y: auto;
  padding-right: 0.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.hf-ai-side-panel::-webkit-scrollbar {
  width: 6px;
}

.hf-ai-side-panel::-webkit-scrollbar-thumb {
  background: rgba(31, 107, 63, 0.24);
  border-radius: 999px;
}

.hf-ai-side-panel::-webkit-scrollbar-track {
  background: transparent;
}

.hf-coach-card,
.hf-suggestion-panel,
.hf-scope-panel,
.hf-chat-card {
  border: 1px solid rgba(31, 107, 63, 0.14);
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 50px rgba(31, 107, 63, 0.1);
  backdrop-filter: blur(18px);
}

.hf-coach-card {
  padding: 1.5rem;
  border-radius: 28px;
  background:
    radial-gradient(circle at 0% 0%, rgba(255, 216, 104, 0.26), transparent 38%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 252, 247, 0.86));
}

.hf-coach-badge,
.hf-empty-badge,
.hf-panel-label {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  min-height: 28px;
  padding: 0 0.75rem;
  border-radius: 999px;
  background: rgba(31, 107, 63, 0.1);
  color: #1f6b3f;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.hf-coach-card h2 {
  margin: 1rem 0 0.7rem;
  color: #15271c;
  font-size: 1.85rem;
  letter-spacing: -0.04em;
}

.hf-coach-card p,
.hf-chat-empty p,
.hf-scope-panel li {
  color: rgba(23, 38, 29, 0.68);
  line-height: 1.7;
}

.hf-suggestion-panel,
.hf-scope-panel {
  padding: 1.1rem;
  border-radius: 24px;
}

.hf-suggestion-panel {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.hf-suggestion-button {
  width: 100%;
  min-height: 52px;
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(31, 107, 63, 0.13);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.78);
  color: #192a20;
  text-align: left;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.hf-suggestion-button:hover {
  transform: translateY(-2px);
  border-color: rgba(31, 107, 63, 0.35);
  box-shadow: 0 14px 28px rgba(31, 107, 63, 0.1);
}

.hf-scope-panel ul {
  margin: 0.9rem 0 0;
  padding-left: 1.1rem;
}

.hf-chat-card {
  min-width: 0;
  height: calc(100vh - 220px);
  min-height: 640px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 30px;
}

.hf-chat-thread {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1.25rem;
  background:
    radial-gradient(circle at 0% 0%, rgba(255, 216, 104, 0.18), transparent 32%),
    radial-gradient(circle at 100% 12%, rgba(31, 107, 63, 0.09), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(248, 252, 247, 0.82));
  scroll-behavior: smooth;
}

.hf-chat-thread::-webkit-scrollbar {
  width: 8px;
}

.hf-chat-thread::-webkit-scrollbar-thumb {
  background: rgba(31, 107, 63, 0.3);
  border-radius: 999px;
}

.hf-chat-thread::-webkit-scrollbar-track {
  background: rgba(31, 107, 63, 0.06);
  border-radius: 999px;
}

.hf-chat-empty {
  min-height: 100%;
  max-width: 620px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.hf-chat-empty h2 {
  margin: 1rem 0 0.7rem;
  color: #14251b;
  font-size: clamp(2rem, 4vw, 3rem);
  letter-spacing: -0.05em;
}

.hf-chat-message {
  width: fit-content;
  max-width: min(76%, 720px);
  margin-bottom: 1rem;
  padding: 0.95rem 1.05rem;
  border-radius: 24px;
  line-height: 1.68;
  white-space: pre-wrap;
  word-break: keep-all;
}

.hf-chat-message > span {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  opacity: 0.72;
}

.hf-chat-message p {
  margin: 0;
}

.hf-chat-message.is-user {
  margin-left: auto;
  color: white;
  background: linear-gradient(135deg, #1f6b3f, #2f8f5b);
  border-bottom-right-radius: 8px;
  box-shadow: 0 18px 36px rgba(31, 107, 63, 0.2);
}

.hf-chat-message.is-assistant {
  margin-right: auto;
  color: #16251c;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(31, 107, 63, 0.12);
  border-bottom-left-radius: 8px;
  box-shadow: 0 16px 36px rgba(31, 107, 63, 0.08);
}

.hf-chat-message.is-thinking p {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 58px;
}

.hf-chat-message.is-thinking i {
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 50%;
  background: #1f6b3f;
  animation: hf-thinking-bounce 1s infinite ease-in-out;
}

.hf-chat-message.is-thinking i:nth-child(2) {
  animation-delay: 0.14s;
}

.hf-chat-message.is-thinking i:nth-child(3) {
  animation-delay: 0.28s;
}

@keyframes hf-thinking-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.35;
  }

  40% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

.hf-chat-actions {
  margin-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hf-chat-actions .btn {
  min-height: 34px;
  padding: 0.45rem 0.75rem;
}

.hf-chat-pagination {
  width: fit-content;
  margin: 1rem auto;
  background: rgba(255, 255, 255, 0.82);
}

.hf-message-end {
  height: 1px;
}

.hf-ai-composer {
  flex-shrink: 0;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: end;
  padding: 1rem;
  border-top: 1px solid rgba(31, 107, 63, 0.12);
  background: rgba(255, 255, 255, 0.96);
}

.hf-composer-input-wrap {
  min-width: 0;
  padding: 0.75rem 1rem 0.55rem;
  border: 1px solid rgba(31, 107, 63, 0.14);
  border-radius: 22px;
  background: rgba(248, 252, 247, 0.9);
}

.hf-composer-input-wrap textarea {
  width: 100%;
  max-height: 180px;
  min-height: 48px;
  resize: none;
  border: 0;
  outline: none;
  background: transparent;
  padding: 0;
  color: #17261d;
  font-size: 1rem;
  line-height: 1.5;
}

.hf-composer-input-wrap textarea::placeholder {
  color: rgba(23, 38, 29, 0.48);
}

.hf-composer-input-wrap span {
  display: block;
  margin-top: 0.35rem;
  color: rgba(23, 38, 29, 0.48);
  font-size: 0.74rem;
}

.hf-composer-send {
  min-width: 82px;
  height: 58px;
  border: 0;
  border-radius: 20px;
  background: linear-gradient(135deg, #1f6b3f, #2f8f5b);
  color: white;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 14px 28px rgba(31, 107, 63, 0.22);
}

.hf-composer-send:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

@media (max-width: 1100px) {
  .hf-ai-workspace {
    grid-template-columns: 1fr;
  }

  .hf-ai-side-panel {
    position: static;
    max-height: none;
    overflow: visible;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding-right: 0;
	  }

	  .hf-chat-card {
    height: calc(100vh - 260px);
  }
}

@media (max-width: 760px) {
  .hf-ai-page {
    padding: 1rem 0.5rem;
  }

  .hf-ai-header {
    flex-direction: column;
  }

	  .hf-ai-side-panel {
	    grid-template-columns: 1fr;
	  }

	  .hf-chat-card {
    height: calc(100vh - 110px);
    min-height: 560px;
    border-radius: 24px;
  }

  .hf-chat-thread {
    padding: 1rem;
  }

  .hf-chat-message {
    max-width: 90%;
  }

  .hf-ai-composer {
    grid-template-columns: 1fr;
  }

  .hf-composer-send {
    width: 100%;
  }

  .hf-composer-input-wrap span {
    display: none;
  }
}
</style>
