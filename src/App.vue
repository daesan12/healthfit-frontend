<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const isCheckingSession = ref(false)

const navItems = [
  { label: '식단', to: '/diet' },
  { label: '운동', to: '/workouts' },
  { label: '기록', to: '/body-records' },
  { label: '진행 현황', to: '/progress' },
  { label: '커뮤니티', to: '/community' },
  { label: 'AI 상담', to: '/ai-chat' },
]

onMounted(async () => {
  if (!authStore.isAuthenticated || authStore.user) return

  isCheckingSession.value = true

  try {
    await authStore.fetchMe()
  } catch {
    if (route.meta.requiresAuth) {
      router.replace({
        name: 'login',
        query: { redirect: route.fullPath },
      })
    }
  } finally {
    isCheckingSession.value = false
  }
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <header class="site-header">
      <RouterLink class="brand" to="/" aria-label="HealthFit home">
        <span class="brand-mark">HF</span>
        <span>
          <strong>HealthFit</strong>
          <small>AI 맞춤 건강 관리</small>
        </span>
      </RouterLink>

      <nav class="main-nav" aria-label="Main navigation">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="auth-actions">
        <template v-if="authStore.isAuthenticated">
          <span v-if="isCheckingSession" class="text-link">확인 중...</span>
          <RouterLink v-else class="text-link" to="/profile">
            {{ authStore.user?.username || '내 프로필' }}
          </RouterLink>
          <button class="primary-link nav-button" type="button" @click="handleLogout">로그아웃</button>
        </template>
        <template v-else>
          <RouterLink class="text-link" to="/login">로그인</RouterLink>
          <RouterLink class="primary-link" to="/signup">회원가입</RouterLink>
        </template>
      </div>
    </header>

    <RouterView />
  </div>
</template>
