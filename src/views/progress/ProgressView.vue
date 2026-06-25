<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { getProgress } from '@/api/progress'

const today = new Date()
const weekAgo = new Date()
weekAgo.setDate(today.getDate() - 6)

const filters = reactive({
  startDate: weekAgo.toISOString().slice(0, 10),
  endDate: today.toISOString().slice(0, 10),
})

const progress = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const bodyRecords = computed(() => progress.value?.bodySummary.recentRecords || [])
const chartRows = computed(() => progress.value?.chartData || [])

const dailyRows = computed(() => {
  const mealDaily = progress.value?.mealSummary.daily || []
  const workoutDaily = progress.value?.workoutSummary.daily || []
  const dates = [...new Set([...mealDaily.map((item) => item.date), ...workoutDaily.map((item) => item.date)])].sort()

  return dates.map((date) => {
    const meal = mealDaily.find((item) => item.date === date) || {}
    const workout = workoutDaily.find((item) => item.date === date) || {}

    return {
      date,
      calories: Number(meal.total_calories || 0),
      protein: Number(meal.total_protein || 0),
      mealScore: meal.meal_score ?? null,
      workoutCount: Number(workout.workout_count || 0),
      workoutTime: Number(workout.total_workout_time || 0),
    }
  })
})

const maxCalories = computed(() => Math.max(...dailyRows.value.map((item) => item.calories), 1))
const maxWorkoutTime = computed(() => Math.max(...dailyRows.value.map((item) => item.workoutTime), 1))
const activeDays = computed(() => dailyRows.value.filter((item) => item.calories > 0 || item.workoutTime > 0).length)
const averageCalories = computed(() => {
  if (!dailyRows.value.length) return 0
  return dailyRows.value.reduce((sum, item) => sum + item.calories, 0) / dailyRows.value.length
})
const topCaloriesDay = computed(() =>
  dailyRows.value.reduce((top, item) => (item.calories > top.calories ? item : top), { calories: 0, date: '-' }),
)

const bodyTrendRows = computed(() =>
  bodyRecords.value
    .map((record) => ({
      id: record.id,
      date: recordDate(record),
      weight: Number(recordWeight(record) || 0),
      bodyFat: recordBodyFat(record),
      muscle: recordMuscle(record),
    }))
    .filter((record) => record.weight > 0)
    .slice()
    .reverse(),
)

const bodyTrendMax = computed(() => Math.max(...bodyTrendRows.value.map((item) => item.weight), 1))
const bodyTrendMin = computed(() => Math.min(...bodyTrendRows.value.map((item) => item.weight), bodyTrendMax.value))

const metrics = computed(() => [
  {
    label: '체중 변화',
    value: formatSigned(progress.value?.bodySummary.weightChange, 'kg'),
    hint: '기간 첫 기록과 마지막 기록 기준',
  },
  {
    label: '총 섭취 칼로리',
    value: `${formatNumber(progress.value?.mealSummary.totalCalories, 0)} kcal`,
    hint: `${progress.value?.mealSummary.mealCount || 0}개 식단 기록`,
  },
  {
    label: '운동 기록',
    value: `${progress.value?.workoutSummary.workoutCount || 0}개`,
    hint: `${progress.value?.workoutSummary.totalWorkoutTime || 0}분 운동`,
  },
])

const insightItems = computed(() => [
  { label: '기록된 날', value: `${activeDays.value}일` },
  { label: '평균 섭취', value: `${formatNumber(averageCalories.value, 0)} kcal` },
  { label: '최고 섭취일', value: topCaloriesDay.value.date === '-' ? '-' : topCaloriesDay.value.date.slice(5) },
])

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits)
}

function formatOptional(value, unit = '') {
  if (value === null || value === undefined || value === '') return '기록 없음'
  return `${formatNumber(value)}${unit}`
}

function formatSigned(value, unit) {
  if (value === null || value === undefined) return '기록 없음'
  const number = Number(value)
  const sign = number > 0 ? '+' : ''
  return `${sign}${formatNumber(number)}${unit}`
}

function recordDate(record) {
  return record.recordDate || record.record_date || '-'
}

function recordWeight(record) {
  return record.weight
}

function recordBodyFat(record) {
  return record.bodyFatPercentage ?? record.body_fat_percentage
}

function recordMuscle(record) {
  return record.skeletalMuscleMass ?? record.skeletal_muscle_mass
}

function calorieHeight(value) {
  return `${Math.max(Math.round((Number(value || 0) / maxCalories.value) * 100), 8)}%`
}

function workoutHeight(value) {
  return `${Math.max(Math.round((Number(value || 0) / maxWorkoutTime.value) * 100), 8)}%`
}

function weightPointHeight(value) {
  const range = Math.max(bodyTrendMax.value - bodyTrendMin.value, 1)
  const ratio = (Number(value || bodyTrendMin.value) - bodyTrendMin.value) / range
  return `${Math.max(Math.round(ratio * 100), 8)}%`
}

async function fetchProgress() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    progress.value = await getProgress({
      start_date: filters.startDate,
      end_date: filters.endDate,
    })
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchProgress)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Progress"
      title="진행 현황"
      description="선택한 기간의 신체, 식단, 운동 기록을 한 화면에서 확인합니다."
    />

    <form class="surface-card filter-panel" @submit.prevent="fetchProgress">
      <div class="field-group">
        <label for="start-date">시작일</label>
        <input id="start-date" v-model="filters.startDate" type="date" />
      </div>
      <div class="field-group">
        <label for="end-date">종료일</label>
        <input id="end-date" v-model="filters.endDate" type="date" />
      </div>
      <button class="btn btn-primary" type="submit" :disabled="isLoading">
        {{ isLoading ? '조회 중...' : '조회' }}
      </button>
      <!-- <RouterLink class="btn btn-secondary" to="/body-records">신체 기록</RouterLink> -->
      <RouterLink class="btn btn-secondary" to="/workout/logs">운동 기록</RouterLink>
    </form>

    <StateBlock
      v-if="isLoading && !progress"
      type="loading"
      title="진행 현황을 불러오는 중입니다"
      message="선택한 기간의 체중, 식단, 운동 기록을 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="진행 현황을 불러오지 못했습니다"
      :message="errorMessage"
    />

    <section v-else-if="progress" class="content-grid">
      <article v-for="metric in metrics" :key="metric.label" class="metric-card" style="grid-column: span 4">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <p>{{ metric.hint }}</p>
      </article>

      <article class="surface-card progress-chart-card" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Daily Balance</p>
            <h2>일별 섭취와 운동</h2>
          </div>
          <div class="chart-legend" aria-label="그래프 범례">
            <span><i class="legend-calorie"></i>섭취 kcal</span>
            <span><i class="legend-workout"></i>운동 분</span>
          </div>
        </div>

        <div v-if="dailyRows.length" class="combo-chart" :style="{ gridTemplateColumns: `repeat(${dailyRows.length}, 1fr)` }">
          <div v-for="item in dailyRows" :key="item.date" class="combo-chart-item">
            <div class="combo-values">
              <span>{{ formatNumber(item.calories, 0) }}</span>
              <em>{{ item.workoutTime }}분</em>
            </div>
            <div class="combo-bars">
              <i class="calorie-bar" :style="{ height: calorieHeight(item.calories) }"></i>
              <i class="workout-bar" :style="{ height: workoutHeight(item.workoutTime) }"></i>
            </div>
            <strong>{{ item.date.slice(5) }}</strong>
          </div>
        </div>

        <StateBlock
          v-else
          type="empty"
          title="기간 내 식단 또는 운동 기록이 없습니다"
          message="식단 기록이나 운동 기록을 추가하면 이곳에 일별 요약이 표시됩니다."
        >
          <RouterLink class="btn btn-primary" to="/diet/records">식사 기록하기</RouterLink>
          <RouterLink class="btn btn-secondary" to="/workout/logs">운동 기록하기</RouterLink>
        </StateBlock>
      </article>

      <aside class="surface-card progress-insights" style="grid-column: span 4">
        <p class="section-label">Insights</p>
        <h2>기간 요약</h2>
        <div class="insight-stat-list">
          <article v-for="item in insightItems" :key="item.label">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </article>
        </div>
        <div class="record-row">
          <span>시작 체중</span>
          <strong>{{ formatOptional(progress.bodySummary.startingWeight, 'kg') }}</strong>
          <em>기간 내 가장 이른 체중 기록</em>
        </div>
        <div class="record-row">
          <span>최근 체중</span>
          <strong>{{ formatOptional(progress.bodySummary.latestWeight, 'kg') }}</strong>
          <em>기간 내 가장 최근 체중 기록</em>
        </div>
      </aside>

      <section class="surface-card" style="grid-column: span 6">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Body Trend</p>
            <h2>체중 변화 추이</h2>
          </div>
          <RouterLink class="text-link" to="/body-records">관리</RouterLink>
        </div>

        <div v-if="bodyTrendRows.length" class="weight-trend" :style="{ gridTemplateColumns: `repeat(${bodyTrendRows.length}, 1fr)` }">
          <div v-for="record in bodyTrendRows" :key="record.id" class="weight-trend-item">
            <span>{{ formatNumber(record.weight) }}kg</span>
            <i :style="{ height: weightPointHeight(record.weight) }"></i>
            <strong>{{ record.date.slice(5) }}</strong>
          </div>
        </div>

        <StateBlock
          v-else
          type="empty"
          title="신체 기록이 없습니다"
          message="몸무게, 체지방률, 골격근량을 기록하면 변화 추이를 확인할 수 있습니다."
        >
          <RouterLink class="btn btn-primary" to="/body-records">신체 기록하기</RouterLink>
        </StateBlock>
      </section>

      <section class="surface-card" style="grid-column: span 6">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Daily Summary</p>
            <h2>일별 기록 요약</h2>
          </div>
          <RouterLink class="text-link" to="/workout/logs">운동 기록</RouterLink>
        </div>

        <div v-if="dailyRows.length" class="meal-list">
          <article v-for="item in dailyRows" :key="item.date" class="meal-item">
            <div>
              <strong>{{ item.date }}</strong>
              <span v-if="item.mealScore !== null">식단 점수 {{ item.mealScore }}점</span>
              <span>섭취 {{ formatNumber(item.calories, 0) }} kcal · 단백질 {{ formatNumber(item.protein) }}g</span>
            </div>
            <div>
              <strong>{{ item.workoutCount }}개</strong>
              <span>{{ item.workoutTime }}분</span>
            </div>
          </article>
        </div>
        <StateBlock
          v-else
          type="empty"
          title="일별 요약 데이터가 없습니다"
          message="식단이나 운동 기록을 남기면 날짜별 요약이 표시됩니다."
        >
          <RouterLink class="btn btn-primary" to="/diet/records">식사 기록하기</RouterLink>
          <RouterLink class="btn btn-secondary" to="/workout/logs">운동 기록하기</RouterLink>
        </StateBlock>
      </section>
    </section>
  </main>
</template>
