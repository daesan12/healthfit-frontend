<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import { mapFieldErrors, normalizeCaughtError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const form = reactive({
  loginId: '',
  password: '',
})

const errors = reactive({
  loginId: '',
  password: '',
})

const formMessage = ref('')
const redirectNotice = route.query.redirect ? '로그인이 필요한 기능입니다.' : ''

function validateLogin() {
  errors.loginId = form.loginId.trim() ? '' : '아이디 또는 이메일을 입력해주세요.'
  errors.password = form.password.trim() ? '' : '비밀번호를 입력해주세요.'

  return !errors.loginId && !errors.password
}

function applyServerErrors(serverErrors) {
  const fieldErrors = mapFieldErrors(serverErrors)
  errors.loginId = fieldErrors.login_id || fieldErrors.non_field_errors || ''
  errors.password = fieldErrors.password || ''
}

async function handleLogin() {
  formMessage.value = ''

  if (!validateLogin()) return

  try {
    await authStore.login({
      loginId: form.loginId.trim(),
      password: form.password,
    })

    router.push(route.query.redirect?.toString() || '/profile')
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
      title="로그인"
      description="아이디 또는 이메일로 로그인하고 HealthFit 기록을 이어갑니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 5" @submit.prevent="handleLogin">
        <p v-if="redirectNotice" class="form-message">{{ redirectNotice }}</p>

        <div class="field-group" :class="{ 'has-error': errors.loginId }">
          <label for="login-id">아이디 또는 이메일</label>
          <input id="login-id" v-model="form.loginId" type="text" placeholder="user01 또는 user01@example.com" />
          <p v-if="errors.loginId" class="error-text">{{ errors.loginId }}</p>
        </div>

        <div class="field-group" :class="{ 'has-error': errors.password }">
          <label for="password">비밀번호</label>
          <input id="password" v-model="form.password" type="password" placeholder="비밀번호 입력" />
          <p v-if="errors.password" class="error-text">{{ errors.password }}</p>
        </div>

        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

        <div class="button-row">
          <button class="btn btn-primary" type="submit" :disabled="authStore.isLoading">
            {{ authStore.isLoading ? '로그인 중...' : '로그인' }}
          </button>
          <RouterLink class="btn btn-secondary" to="/signup">회원가입</RouterLink>
        </div>
      </form>

      <aside class="surface-card" style="grid-column: span 7">
        <p class="section-label">Backend Ready</p>
        <h2>이제 실제 로그인 API와 연결됩니다.</h2>
        <p>
          입력값은 `/api/v1/auth/login/`으로 전송되고, 성공하면 access token과 refresh token을 저장합니다.
          이후 인증이 필요한 화면은 저장된 token을 사용합니다.
        </p>
      </aside>
    </section>
  </main>
</template>
