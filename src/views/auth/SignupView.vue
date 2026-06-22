<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import { mapFieldErrors, normalizeCaughtError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const authStore = useAuthStore()
const toastStore = useToastStore()
const router = useRouter()

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

function applyServerErrors(serverErrors) {
  const fieldErrors = mapFieldErrors(serverErrors)
  errors.username = fieldErrors.username || ''
  errors.email = fieldErrors.email || ''
  errors.password = fieldErrors.password || fieldErrors.non_field_errors || ''
}

async function handleSignup() {
  formMessage.value = ''

  if (!validateSignup()) return

  try {
    await authStore.signup({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
    })

    formMessage.value = '회원가입이 완료되었습니다. 로그인 화면으로 이동합니다.'
    toastStore.success('회원가입 완료', '이제 로그인해서 HealthFit을 시작할 수 있습니다.')
    setTimeout(() => {
      router.push('/login')
    }, 700)
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    applyServerErrors(apiError.errors)
    formMessage.value = apiError.message
  }
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Auth"
      title="회원가입"
      description="HealthFit에서 식단, 운동, 신체 변화를 한 계정으로 관리합니다."
    />

    <form class="form-card" style="max-width: 620px" @submit.prevent="handleSignup">
      <div class="field-group" :class="{ 'has-error': errors.username }">
        <label for="username">아이디</label>
        <input id="username" v-model="form.username" type="text" placeholder="user01" />
        <p v-if="errors.username" class="error-text">{{ errors.username }}</p>
      </div>

      <div class="field-group" :class="{ 'has-error': errors.email }">
        <label for="email">이메일</label>
        <input id="email" v-model="form.email" type="email" placeholder="user@example.com" />
        <p v-if="errors.email" class="error-text">{{ errors.email }}</p>
      </div>

      <div class="field-group" :class="{ 'has-error': errors.password }">
        <label for="password">비밀번호</label>
        <input id="password" v-model="form.password" type="password" placeholder="8자 이상" />
        <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
      </div>

      <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

      <button class="btn btn-primary" type="submit" :disabled="authStore.isLoading">
        {{ authStore.isLoading ? '가입 중...' : '회원가입' }}
      </button>
      <RouterLink class="btn btn-secondary" to="/login">이미 계정이 있어요</RouterLink>
    </form>
  </main>
</template>
