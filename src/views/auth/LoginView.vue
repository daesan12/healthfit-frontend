<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
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
const redirectNotice = route.query.redirect ? '이 기능은 로그인 후 사용할 수 있습니다.' : ''

function validateLogin() {
  errors.loginId = form.loginId.trim() ? '' : '아이디 또는 이메일을 입력해주세요.'
  errors.password = form.password.trim() ? '' : '비밀번호를 입력해주세요.'

  return !errors.loginId && !errors.password
}

function handleLogin() {
  formMessage.value = ''

  if (!validateLogin()) return

  authStore.mockLogin()
  formMessage.value = '입력값 검증이 완료되었습니다. 백엔드 연결 후 로그인 요청을 보냅니다.'
  router.push(route.query.redirect?.toString() || '/profile')
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
          <button class="btn btn-primary" type="submit">로그인</button>
          <RouterLink class="btn btn-secondary" to="/signup">회원가입</RouterLink>
        </div>
      </form>

      <aside class="surface-card" style="grid-column: span 7">
        <p class="section-label">Next Step</p>
        <h2>백엔드 연동 전까지는 화면 흐름을 먼저 완성합니다.</h2>
        <p>
          나중에 로그인 API가 준비되면 이 폼에서 `/api/v1/auth/login/`으로 요청을 보내고
          access token을 저장하게 됩니다.
        </p>
      </aside>
    </section>
  </main>
</template>
