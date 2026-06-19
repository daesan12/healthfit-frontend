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
        '현재는 mock 답변입니다. 백엔드 연동 후 OpenAI API 응답을 이 위치에 표시합니다.',
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
      description="식단, 운동, 영양 정보에 대해 자유롭게 질문합니다."
    />

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
          title="AI가 답변을 준비하고 있습니다."
          message="백엔드 연동 후 실제 응답 대기 상태로 사용됩니다."
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
          title="질문을 보낼 수 없습니다."
          :message="errorMessage"
        />

        <button class="btn btn-primary" type="submit">AI에게 질문</button>
        <p class="meta-text">
          실제 연동 시 `/api/v1/ai/chats/`로 질문을 보내고 답변 기록을 다시 불러옵니다.
        </p>
      </form>
    </section>
  </main>
</template>
