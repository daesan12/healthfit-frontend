<script setup>
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { askAi, getAiChatsPage } from '@/api/ai'
import { normalizeCaughtError } from '@/api/client'

const route = useRoute()

const isOpen = ref(false)
const hasLoaded = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const question = ref('')
const chats = ref([])
const chatScroll = ref(null)
const questionInput = ref(null)

const promptSuggestions = [
  '닭가슴살과 계란 단백질 차이 알려줘',
  '운동 전에는 어떤 음식을 먹으면 좋아?',
  '고구마 100g 탄수화물이 어느 정도야?',
  '야식 줄이는 현실적인 방법 알려줘',
]

const hiddenPathPrefixes = [
  '/login',
  '/signup',
  '/auth',
]

const shouldShowWidget = computed(() => {
  return !hiddenPathPrefixes.some((prefix) => route.path.startsWith(prefix))
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
      page_size: 10,
      total_pages: 1,
      has_next: false,
      has_previous: false,
      results: data,
    }
  }

  return {
    count: data?.count ?? 0,
    page: data?.page ?? 1,
    page_size: data?.pageSize ?? data?.page_size ?? 10,
    total_pages: data?.totalPages ?? data?.total_pages ?? 1,
    has_next: data?.hasNext ?? data?.has_next ?? false,
    has_previous: data?.hasPrevious ?? data?.has_previous ?? false,
    results: Array.isArray(data?.results) ? data.results : [],
  }
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
    '예: "닭가슴살 100g 단백질 알려줘", "운동 전에 탄수화물 먹어도 돼?"',
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
  const id = chat?.id ?? Date.now()

  return [
    {
      id: `${id}-q`,
      role: 'user',
      message: String(chat?.question || '').trim(),
    },
    {
      id: `${id}-a`,
      role: 'assistant',
      message: normalizeChatMessage(chat?.answer),
    },
  ].filter((item) => item.message)
}

async function scrollToLatest({ instant = false } = {}) {
  await nextTick()

  if (!chatScroll.value) return

  chatScroll.value.scrollTo({
    top: chatScroll.value.scrollHeight,
    behavior: instant ? 'auto' : 'smooth',
  })
}

function autoResizeInput() {
  const textarea = questionInput.value
  if (!textarea) return

  textarea.style.height = 'auto'
  textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`
}

function focusInput() {
  nextTick(() => {
    questionInput.value?.focus()
    autoResizeInput()
  })
}

async function loadChats() {
  errorMessage.value = ''

  try {
    const response = await getAiChatsPage({ page: 1, page_size: 10 })
    const pageData = unwrapPageData(response)

    chats.value = pageData.results
      .slice()
      .reverse()
      .flatMap(toChatItems)

    hasLoaded.value = true
    await scrollToLatest({ instant: true })
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = friendlyAiErrorMessage(apiError.message)
  }
}

async function openWidget() {
  isOpen.value = true

  if (!hasLoaded.value) {
    await loadChats()
  }

  focusInput()
  await scrollToLatest({ instant: true })
}

function closeWidget() {
  isOpen.value = false
}

async function toggleWidget() {
  if (isOpen.value) {
    closeWidget()
    return
  }

  await openWidget()
}

function applySuggestion(text) {
  question.value = text
  focusInput()
}

function handleComposerKeydown(event) {
  if (event.key !== 'Enter' || event.shiftKey) return

  event.preventDefault()
  askQuestion()
}

async function askQuestion() {
  const currentQuestion = question.value.trim()

  errorMessage.value = ''

  if (!currentQuestion) {
    errorMessage.value = '질문 내용을 입력해주세요.'
    return
  }

  const pendingId = `widget-pending-${Date.now()}`

  chats.value.push({
    id: `${pendingId}-q`,
    role: 'user',
    message: currentQuestion,
  })

  question.value = ''
  autoResizeInput()
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
      })
    }

    hasLoaded.value = true
    await scrollToLatest()
  } catch (error) {
    const apiError = normalizeCaughtError(error)

    chats.value.push({
      id: `${pendingId}-error`,
      role: 'assistant',
      message: friendlyAiErrorMessage(apiError.message),
    })

    await scrollToLatest()
  } finally {
    isLoading.value = false
    focusInput()
    await scrollToLatest()
  }
}
</script>

<template>
  <Teleport to="body">
    <aside v-if="shouldShowWidget" class="hf-ai-widget" :class="{ 'is-open': isOpen }">
      <Transition name="hf-ai-panel">
        <section v-if="isOpen" class="hf-ai-widget-panel" aria-label="HealthFit AI 상담창">
          <header class="hf-ai-widget-header">
            <div class="hf-ai-widget-coach">
              <div class="hf-ai-widget-avatar" aria-hidden="true">
                <span>🏋️</span>
              </div>
              <div>
                <strong>HealthFit AI 코치</strong>
                <p>영양성분 · 탄단지 · 건강 습관 상담</p>
              </div>
            </div>

            <button class="hf-ai-widget-close" type="button" aria-label="AI 상담창 닫기" @click="closeWidget">
              ×
            </button>
          </header>

          <section ref="chatScroll" class="hf-ai-widget-thread" aria-live="polite">
            <div v-if="chats.length === 0 && !isLoading" class="hf-ai-widget-empty">
              <span>👋</span>
              <strong>궁금한 걸 물어보세요</strong>
              <p>음식 영양성분, 운동 전후 식사, 건강한 습관에 대해 답변할 수 있어요.</p>

              <div class="hf-ai-widget-suggestions">
                <button
                  v-for="suggestion in promptSuggestions"
                  :key="suggestion"
                  type="button"
                  @click="applySuggestion(suggestion)"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>

            <article
              v-for="chat in chats"
              :key="chat.id"
              class="hf-ai-widget-message"
              :class="{ 'is-user': chat.role === 'user', 'is-assistant': chat.role === 'assistant' }"
            >
              <span>{{ chat.role === 'user' ? '나' : 'AI 코치' }}</span>
              <p>{{ chat.message }}</p>
            </article>

            <div v-if="isLoading" class="hf-ai-widget-message is-assistant is-thinking">
              <span>AI 코치</span>
              <p>
                <i></i>
                <i></i>
                <i></i>
              </p>
            </div>

            <div v-if="errorMessage" class="hf-ai-widget-error">
              {{ errorMessage }}
            </div>
          </section>

          <form class="hf-ai-widget-composer" @submit.prevent="askQuestion">
            <textarea
              ref="questionInput"
              v-model="question"
              rows="1"
              placeholder="영양, 칼로리, 건강 습관을 물어보세요"
              @input="autoResizeInput"
              @keydown="handleComposerKeydown"
            />
            <button type="submit" :disabled="isLoading || !question.trim()">
              {{ isLoading ? '...' : '전송' }}
            </button>
          </form>
        </section>
      </Transition>

      <button
        class="hf-ai-widget-toggle"
        type="button"
        :aria-expanded="isOpen"
        aria-label="HealthFit AI 상담 열기"
        @click="toggleWidget"
      >
        <span class="hf-ai-widget-trainer" aria-hidden="true">
          <span class="trainer-emoji">🏋️‍♂️</span>
        </span>
        <span class="hf-ai-widget-toggle-text">
          <strong>AI 코치</strong>
          <small>{{ isOpen ? '상담 닫기' : '상담하기' }}</small>
        </span>
      </button>
    </aside>
  </Teleport>
</template>

<style scoped>
.hf-ai-widget {
  position: fixed;
  right: 1.25rem;
  bottom: 2rem;
  z-index: 880;
  pointer-events: none;
}

.hf-ai-widget * {
  box-sizing: border-box;
}

.hf-ai-widget-toggle,
.hf-ai-widget-panel {
  pointer-events: auto;
}

.hf-ai-widget-toggle {
  width: 86px;
  min-height: 112px;
  border: 1px solid rgba(31, 107, 63, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 216, 104, 0.35), transparent 42%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(238, 249, 241, 0.92));
  color: #1f6b3f;
  box-shadow: 0 18px 45px rgba(31, 107, 63, 0.2);
  cursor: pointer;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.hf-ai-widget-toggle:hover {
  transform: translateY(-4px);
  border-color: rgba(31, 107, 63, 0.38);
  box-shadow: 0 22px 54px rgba(31, 107, 63, 0.27);
}

.hf-ai-widget-trainer {
  width: 58px;
  height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background:
    radial-gradient(circle at 35% 25%, rgba(255, 255, 255, 0.85), transparent 28%),
    linear-gradient(135deg, rgba(31, 107, 63, 0.14), rgba(255, 216, 104, 0.32));
  box-shadow:
    inset 0 0 0 1px rgba(31, 107, 63, 0.12),
    0 10px 24px rgba(31, 107, 63, 0.14);
}

.trainer-emoji {
  display: inline-block;
  font-size: 2rem;
  line-height: 1;
  filter: drop-shadow(0 4px 6px rgba(31, 107, 63, 0.18));
}

.hf-ai-widget-toggle-text {
  text-align: center;
}

.hf-ai-widget-toggle-text strong,
.hf-ai-widget-toggle-text small {
  display: block;
}

.hf-ai-widget-toggle-text strong {
  color: #17351f;
  font-size: 0.83rem;
}

.hf-ai-widget-toggle-text small {
  margin-top: 0.12rem;
  color: rgba(23, 38, 29, 0.58);
  font-size: 0.68rem;
  font-weight: 800;
}

.hf-ai-widget-panel {
  position: absolute;
  right: 104px;
  bottom: 0;
  width: 430px;
  height: min(640px, calc(100vh - 120px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(31, 107, 63, 0.16);
  border-radius: 30px;
  background:
    radial-gradient(circle at 0% 0%, rgba(255, 216, 104, 0.22), transparent 35%),
    radial-gradient(circle at 100% 12%, rgba(31, 107, 63, 0.12), transparent 32%),
    rgba(255, 255, 255, 0.96);
  box-shadow: 0 28px 80px rgba(31, 107, 63, 0.24);
  backdrop-filter: blur(20px);
}

.hf-ai-widget-header {
  flex-shrink: 0;
  min-height: 78px;
  padding: 1rem;
  border-bottom: 1px solid rgba(31, 107, 63, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem;
}

.hf-ai-widget-coach {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.hf-ai-widget-avatar {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  border-radius: 17px;
  background: linear-gradient(135deg, #1f6b3f, #2f8f5b);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 24px rgba(31, 107, 63, 0.22);
}

.hf-ai-widget-avatar span {
  font-size: 1.35rem;
  line-height: 1;
}

.hf-ai-widget-coach strong {
  display: block;
  color: #14251b;
  font-size: 1rem;
}

.hf-ai-widget-coach p {
  margin: 0.18rem 0 0;
  color: rgba(23, 38, 29, 0.56);
  font-size: 0.78rem;
  line-height: 1.35;
}

.hf-ai-widget-close {
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: rgba(31, 107, 63, 0.08);
  color: #1f6b3f;
  font-size: 1.25rem;
  font-weight: 900;
  cursor: pointer;
}

.hf-ai-widget-thread {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 1rem;
}

.hf-ai-widget-thread::-webkit-scrollbar {
  width: 7px;
}

.hf-ai-widget-thread::-webkit-scrollbar-thumb {
  background: rgba(31, 107, 63, 0.28);
  border-radius: 999px;
}

.hf-ai-widget-thread::-webkit-scrollbar-track {
  background: rgba(31, 107, 63, 0.05);
  border-radius: 999px;
}

.hf-ai-widget-empty {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.hf-ai-widget-empty > span {
  font-size: 2rem;
}

.hf-ai-widget-empty strong {
  margin-top: 0.6rem;
  color: #14251b;
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}

.hf-ai-widget-empty p {
  width: min(300px, 100%);
  margin: 0.55rem auto 0;
  color: rgba(23, 38, 29, 0.62);
  font-size: 0.88rem;
  line-height: 1.62;
}

.hf-ai-widget-suggestions {
  width: min(320px, 100%);
  margin: 1rem auto 0;
  display: grid;
  gap: 0.5rem;
}

.hf-ai-widget-suggestions button {
  min-height: 42px;
  padding: 0.65rem 0.8rem;
  border: 1px solid rgba(31, 107, 63, 0.13);
  border-radius: 15px;
  background: rgba(248, 252, 247, 0.9);
  color: #17261d;
  text-align: left;
  font-weight: 800;
  cursor: pointer;
}

.hf-ai-widget-suggestions button:hover {
  border-color: rgba(31, 107, 63, 0.34);
  background: white;
}

.hf-ai-widget-message {
  width: fit-content;
  max-width: 88%;
  margin-bottom: 0.8rem;
  padding: 0.72rem 0.82rem;
  border-radius: 19px;
  line-height: 1.58;
  white-space: pre-wrap;
  word-break: keep-all;
}

.hf-ai-widget-message > span {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  opacity: 0.7;
}

.hf-ai-widget-message p {
  margin: 0;
  font-size: 0.9rem;
}

.hf-ai-widget-message.is-user {
  margin-left: auto;
  color: white;
  background: linear-gradient(135deg, #1f6b3f, #2f8f5b);
  border-bottom-right-radius: 7px;
  box-shadow: 0 14px 26px rgba(31, 107, 63, 0.18);
}

.hf-ai-widget-message.is-assistant {
  margin-right: auto;
  color: #16251c;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(31, 107, 63, 0.12);
  border-bottom-left-radius: 7px;
  box-shadow: 0 12px 24px rgba(31, 107, 63, 0.07);
}

.hf-ai-widget-message.is-thinking p {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 50px;
}

.hf-ai-widget-message.is-thinking i {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: #1f6b3f;
  animation: hf-ai-thinking 1s infinite ease-in-out;
}

.hf-ai-widget-message.is-thinking i:nth-child(2) {
  animation-delay: 0.14s;
}

.hf-ai-widget-message.is-thinking i:nth-child(3) {
  animation-delay: 0.28s;
}

@keyframes hf-ai-thinking {
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

.hf-ai-widget-error {
  margin: 0.75rem 0;
  padding: 0.75rem 0.85rem;
  border-radius: 16px;
  background: rgba(180, 54, 54, 0.08);
  color: #8f2d2d;
  font-size: 0.86rem;
  font-weight: 700;
  line-height: 1.55;
  white-space: pre-wrap;
}

.hf-ai-widget-composer {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: end;
  padding: 0.85rem;
  border-top: 1px solid rgba(31, 107, 63, 0.1);
  background: rgba(255, 255, 255, 0.96);
}

.hf-ai-widget-composer textarea {
  width: 100%;
  max-height: 132px;
  min-height: 44px;
  resize: none;
  border: 1px solid rgba(31, 107, 63, 0.14);
  outline: none;
  border-radius: 18px;
  background: rgba(248, 252, 247, 0.92);
  color: #17261d;
  padding: 0.78rem 0.85rem;
  font-size: 0.92rem;
  line-height: 1.45;
}

.hf-ai-widget-composer textarea:focus {
  border-color: rgba(31, 107, 63, 0.38);
  background: white;
}

.hf-ai-widget-composer button {
  min-width: 64px;
  height: 44px;
  border: 0;
  border-radius: 17px;
  background: linear-gradient(135deg, #1f6b3f, #2f8f5b);
  color: white;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(31, 107, 63, 0.2);
}

.hf-ai-widget-composer button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
  box-shadow: none;
}

.hf-ai-panel-enter-active,
.hf-ai-panel-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.hf-ai-panel-enter-from,
.hf-ai-panel-leave-to {
  opacity: 0;
  transform: translateX(18px) scale(0.98);
}

@media (max-width: 768px) {
  .hf-ai-widget {
    right: 0.75rem;
    bottom: 5.25rem;
  }

  .hf-ai-widget-toggle {
    width: 66px;
    min-height: 76px;
    border-radius: 22px;
  }

  .hf-ai-widget-trainer {
    width: 46px;
    height: 46px;
  }

  .trainer-emoji {
    font-size: 1.6rem;
  }

  .hf-ai-widget-toggle-text small {
    display: none;
  }

  .hf-ai-widget-panel {
    position: fixed;
    left: 0.75rem;
    right: 0.75rem;
    top: auto;
    bottom: 5.5rem;
    width: auto;
    height: min(72vh, 620px);
    transform: none;
    border-radius: 26px;
  }

  .hf-ai-panel-enter-from,
  .hf-ai-panel-leave-to {
    opacity: 0;
    transform: translateY(16px) scale(0.98);
  }
}

@media (max-width: 420px) {
  .hf-ai-widget-panel {
    left: 0.5rem;
    right: 0.5rem;
    bottom: 5rem;
  }

  .hf-ai-widget-composer {
    grid-template-columns: 1fr;
  }

  .hf-ai-widget-composer button {
    width: 100%;
  }
}
</style>
