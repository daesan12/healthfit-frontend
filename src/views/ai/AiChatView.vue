<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { mockAiChats } from '@/data/mockData'

const question = ref('오늘 식단에서 부족한 점을 알려줘')
const chats = ref(mockAiChats)
const isLoading = ref(false)
const errorMessage = ref('')

function askQuestion() {
  errorMessage.value = ''

  if (!question.value.trim()) {
    errorMessage.value = '질문 내용을 입력해주세요.'
    return
  }

  chats.value.push({
    id: Date.now(),
    role: 'user',
    message: question.value.trim(),
  })

  isLoading.value = true

  window.setTimeout(() => {
    chats.value.push({
      id: Date.now() + 1,
      role: 'assistant',
      message:
        '현재 AI 백엔드 연동 준비 중입니다. OpenAI API 연결 후 실제 답변이 이 영역에 표시됩니다.',
    })
    question.value = ''
    isLoading.value = false
  }, 500)
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="AI Chat"
      title="AI 질문 응답"
      description="식단, 운동, 영양 정보에 대해 자유롭게 질문하는 화면입니다."
    />

    <div class="ai-status-banner">
      <span class="status-badge">AI 준비 중</span>
      <p>현재 화면은 mock 응답으로 동작합니다. 백엔드 AI API가 완성되면 `/api/v1/ai/chats/`와 연결합니다.</p>
    </div>

    <section class="content-grid">
      <section class="surface-card chat-panel" style="grid-column: span 8">
        <article
          v-for="chat in chats"
          :key="chat.id"
          class="chat-message"
          :class="{ 'is-user': chat.role === 'user' }"
        >
          <span>{{ chat.role === 'user' ? '나' : 'HealthFit AI' }}</span>
          <p>{{ chat.message }}</p>
        </article>

        <StateBlock
          v-if="isLoading"
          type="loading"
          title="AI 응답을 준비하는 중입니다"
          message="현재는 임시 응답을 표시하며, 실제 연동 후에는 서버 응답을 기다립니다."
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

        <button class="btn btn-primary" type="submit">임시 AI 응답 보기</button>
        <p class="meta-text">
          실제 연동 시 질문은 `/api/v1/ai/chats/`로 전송하고 응답 기록을 다시 불러옵니다.
        </p>
      </form>
    </section>
  </main>
</template>
