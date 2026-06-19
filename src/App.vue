<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const navItems = [
  { label: '식단', to: '/diet' },
  { label: '운동', to: '/workouts' },
  { label: '진행 현황', to: '/progress' },
  { label: '커뮤니티', to: '/community' },
  { label: 'AI 상담', to: '/ai-chat' },
]
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
          <RouterLink class="text-link" to="/profile">{{ authStore.user?.username || '내 프로필' }}</RouterLink>
          <button class="primary-link nav-button" type="button" @click="authStore.logout">로그아웃</button>
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
