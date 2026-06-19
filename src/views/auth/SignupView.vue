<script setup>
import { reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'

const form = reactive({
  username: '',
  email: '',
  password: '',
})

const errors = reactive({
  username: '',
  email: '',
  password: '',
})

const formMessage = ref('')

function validateSignup() {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  errors.username = form.username.trim().length >= 3 ? '' : '아이디는 3자 이상 입력해주세요.'
  errors.email = emailPattern.test(form.email.trim()) ? '' : '올바른 이메일 형식으로 입력해주세요.'
  errors.password = form.password.length >= 8 ? '' : '비밀번호는 8자 이상 입력해주세요.'

  return !errors.username && !errors.email && !errors.password
}

function handleSignup() {
  formMessage.value = ''

  if (!validateSignup()) return

  formMessage.value = '입력값 검증이 완료되었습니다. 백엔드 연결 후 회원가입 요청을 보냅니다.'
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Auth"
      title="회원가입"
      description="AI 식단과 운동 추천에 사용할 개인 계정을 만듭니다."
    />

    <form class="form-card" style="max-width: 620px" @submit.prevent="handleSignup">
      <div class="field-group" :class="{ 'has-error': errors.username }">
        <label for="username">아이디</label>
        <input id="username" v-model="form.username" type="text" placeholder="user01" />
        <p v-if="errors.username" class="error-text">{{ errors.username }}</p>
      </div>

      <div class="field-group" :class="{ 'has-error': errors.email }">
        <label for="email">이메일</label>
        <input id="email" v-model="form.email" type="email" placeholder="user01@example.com" />
        <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
      </div>

      <div class="field-group" :class="{ 'has-error': errors.password }">
        <label for="signup-password">비밀번호</label>
        <input id="signup-password" v-model="form.password" type="password" placeholder="8자 이상 입력" />
        <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
      </div>

      <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

      <div class="button-row">
        <button class="btn btn-primary" type="submit">계정 만들기</button>
        <RouterLink class="btn btn-secondary" to="/login">로그인으로 이동</RouterLink>
      </div>
    </form>
  </main>
</template>
