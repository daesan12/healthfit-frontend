<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { getMealDashboard } from '@/api/diet'

const dashboard = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')
const selectedDate = ref(new Date().toISOString().slice(0, 10))

const metrics = computed(() => [
  {
    label: '하루 권장 칼로리',
    value: dashboard.value?.recommendedCalories
      ? `${formatNumber(dashboard.value.recommendedCalories, 0)} kcal`
      : '프로필 필요',
  },
  {
    label: '오늘 섭취 칼로리',
    value: `${formatNumber(dashboard.value?.totalCalories || 0, 0)} kcal`,
  },
  {
    label: '남은 칼로리',
    value: dashboard.value?.remainingCalories !== null && dashboard.value?.remainingCalories !== undefined
      ? `${formatNumber(dashboard.value.remainingCalories, 0)} kcal`
      : '계산 대기',
  },
])

const macroRows = computed(() => [
  {
    label: '탄수화물',
    value: dashboard.value?.totalCarbohydrate || 0,
    recommended: dashboard.value?.recommendedCarbohydrate || 0,
  },
  {
    label: '단백질',
    value: dashboard.value?.totalProtein || 0,
    recommended: dashboard.value?.recommendedProtein || 0,
  },
  {
    label: '지방',
    value: dashboard.value?.totalFat || 0,
    recommended: dashboard.value?.recommendedFat || 0,
  },
])

const mealTypeRows = computed(() => {
  const summary = dashboard.value?.mealTypeSummary || {}
  return [
    { label: '아침', value: 'breakfast' },
    { label: '점심', value: 'lunch' },
    { label: '저녁', value: 'dinner' },
    { label: '간식', value: 'snack' },
  ].map((type) => ({
    ...type,
    ...(summary[type.value] || {
      meal_count: 0,
      total_calories: 0,
      total_carbohydrate: 0,
      total_protein: 0,
      total_fat: 0,
    }),
  }))
})

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits)
}

function macroPercent(row) {
  if (!row.recommended) return 0
  return Math.min(Math.round((row.value / row.recommended) * 100), 100)
}

async function fetchDashboard() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    dashboard.value = await getMealDashboard({ date: selectedDate.value })
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDashboard)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet"
      title="식단 대시보드"
      description="권장 칼로리와 선택한 날짜의 섭취 상태를 한눈에 확인합니다."
    />

    <section class="surface-card filter-panel">
      <div class="field-group">
        <label for="dashboard-date">조회 날짜</label>
        <input id="dashboard-date" v-model="selectedDate" type="date" />
      </div>
      <button class="btn btn-primary" type="button" :disabled="isLoading" @click="fetchDashboard">
        {{ isLoading ? '조회 중...' : '조회' }}
      </button>
      <RouterLink class="btn btn-secondary" to="/diet/records">식단 기록</RouterLink>
      <RouterLink class="btn btn-secondary" to="/foods">음식 검색</RouterLink>
    </section>

    <StateBlock
      v-if="isLoading && !dashboard"
      type="loading"
      title="식단 대시보드를 불러오는 중입니다"
      message="선택한 날짜의 식단 기록과 권장 칼로리를 계산하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="식단 대시보드를 불러오지 못했습니다"
      :message="errorMessage"
    />

    <section v-else class="content-grid">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
        style="grid-column: span 4"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>

      <section class="surface-card" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Macros</p>
            <h2>오늘의 탄단지</h2>
          </div>
          <RouterLink class="text-link" to="/diet/records">기록 추가</RouterLink>
        </div>
        <div v-for="row in macroRows" :key="row.label" class="macro-row">
          <span>{{ row.label }}</span>
          <div class="meter"><i :style="{ width: `${macroPercent(row)}%` }"></i></div>
          <strong>{{ formatNumber(row.value) }}g</strong>
        </div>
      </section>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">빠른 이동</p>
        <div class="button-row">
          <RouterLink class="btn btn-secondary" to="/foods">음식 검색</RouterLink>
          <RouterLink class="btn btn-primary" to="/diet/records">식단 기록</RouterLink>
          <RouterLink class="btn btn-secondary" to="/diet/recommend">AI 추천</RouterLink>
          <RouterLink class="btn btn-secondary" to="/diet/evaluation">오늘 평가</RouterLink>
        </div>
      </aside>

      <section class="surface-card" style="grid-column: 1 / -1">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Meal Type</p>
            <h2>식사 유형별 요약</h2>
          </div>
          <span class="chip">{{ selectedDate }}</span>
        </div>
        <div class="meal-list">
          <article v-for="row in mealTypeRows" :key="row.value" class="meal-item">
            <div>
              <strong>{{ row.label }}</strong>
              <span>{{ row.meal_count }}개 기록</span>
            </div>
            <div>
              <strong>{{ formatNumber(row.total_calories, 0) }} kcal</strong>
              <span>단백질 {{ formatNumber(row.total_protein) }}g</span>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
