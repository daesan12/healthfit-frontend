<script setup>
import { computed, onMounted, ref } from 'vue'
import { normalizeCaughtError } from '@/api/client'
import { getProgress } from '@/api/progress'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const today = new Date().toISOString().slice(0, 10)

const progress = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const highlights = [
  { value: '2,322', label: '음식 데이터', tone: 'diet' },
  { value: '415', label: '운동 데이터', tone: 'workout' },
  { value: 'AI', label: '맞춤 추천 엔진', tone: 'ai' },
]

const todayCards = computed(() => [
  {
    label: '오늘 식단',
    value: `${Math.round(progress.value?.mealSummary.totalCalories || 0)} kcal`,
    hint: `${progress.value?.mealSummary.mealCount || 0}개 식단 기록`,
    to: '/diet/records',
    action: '식단 기록',
    tone: 'diet',
  },
  {
    label: '오늘 운동',
    value: `${progress.value?.workoutSummary.totalWorkoutTime || 0}분`,
    hint: `${progress.value?.workoutSummary.workoutCount || 0}개 운동 기록`,
    to: '/workout/logs',
    action: '운동 기록',
    tone: 'workout',
  },
  {
    label: '체중 변화',
    value: formatWeightChange(progress.value?.bodySummary.weightChange),
    hint: progress.value?.bodySummary.latestWeight
      ? `최근 ${progress.value.bodySummary.latestWeight}kg`
      : '오늘 신체 기록을 남겨보세요.',
    to: '/body-records',
    action: '신체 기록',
    tone: 'body',
  },
])

function formatWeightChange(value) {
  if (value === null || value === undefined) return '기록 없음'
  const number = Number(value)
  const sign = number > 0 ? '+' : ''
  return `${sign}${number.toFixed(1)}kg`
}

async function fetchTodayProgress() {
  if (!authStore.isAuthenticated) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    progress.value = await getProgress({
      start_date: today,
      end_date: today,
    })
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchTodayProgress)
</script>

<template>
  <main class="home-page">
    <section class="hero-section home-dashboard-hero">
      <div class="hero-copy">
        <p class="section-label">Premium AI Health Dashboard</p>
        <h1>오늘의 기록으로 내 몸에 맞는 루틴을 설계하세요</h1>
        <p class="hero-description">
          식단, 운동, 신체 지표를 한 화면에서 관리하고 AI 추천으로 다음 선택을 더 선명하게 만드는 HealthFit입니다.
        </p>

        <div class="hero-actions">
          <RouterLink class="primary-link large" :to="authStore.isAuthenticated ? '/records' : '/signup'">
            {{ authStore.isAuthenticated ? '오늘 기록하기' : '시작하기' }}
          </RouterLink>
          <RouterLink class="secondary-link large" to="/progress">진행 현황 보기</RouterLink>
        </div>
      </div>

      <section class="today-panel dashboard-card" aria-label="Today dashboard">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Today</p>
            <h2>{{ authStore.isAuthenticated ? '오늘 요약' : '기록 시작 가이드' }}</h2>
          </div>
          <span class="chip">{{ today }}</span>
        </div>

        <p v-if="errorMessage" class="form-message">{{ errorMessage }}</p>

        <template v-if="authStore.isAuthenticated">
          <article v-for="card in todayCards" :key="card.label" class="today-card" :class="`is-${card.tone}`">
            <div>
              <span>{{ card.label }}</span>
              <strong>{{ isLoading ? '조회 중...' : card.value }}</strong>
              <p>{{ card.hint }}</p>
            </div>
            <RouterLink class="btn btn-secondary" :to="card.to">{{ card.action }}</RouterLink>
          </article>
        </template>

        <template v-else>
          <article class="today-card is-diet">
            <div>
              <span>1단계</span>
              <strong>프로필 입력</strong>
              <p>권장 칼로리와 추천 기준을 먼저 저장합니다.</p>
            </div>
            <RouterLink class="btn btn-secondary" to="/signup">회원가입</RouterLink>
          </article>
          <article class="today-card is-workout">
            <div>
              <span>2단계</span>
              <strong>기록 남기기</strong>
              <p>식단, 운동, 신체 기록을 날짜별로 쌓습니다.</p>
            </div>
            <RouterLink class="btn btn-secondary" to="/login">로그인</RouterLink>
          </article>
        </template>
      </section>
    </section>

    <section class="stats-grid" aria-label="Project data summary">
      <article v-for="item in highlights" :key="item.label" :class="`is-${item.tone}`">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </article>
    </section>

  </main>
</template>
