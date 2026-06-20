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

const metrics = computed(() => [
  {
    label: '체중 변화',
    value: formatSigned(progress.value?.bodySummary.weightChange, 'kg'),
  },
  {
    label: '총 섭취 칼로리',
    value: `${formatNumber(progress.value?.mealSummary.totalCalories, 0)} kcal`,
  },
  {
    label: '운동 횟수',
    value: `${progress.value?.workoutSummary.workoutCount || 0}회`,
  },
])

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
      workoutCount: workout.workout_count || 0,
      workoutTime: workout.total_workout_time || 0,
    }
  })
})

const maxCalories = computed(() => Math.max(...dailyRows.value.map((item) => item.calories), 1))

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits)
}

function formatSigned(value, unit) {
  if (value === null || value === undefined) return '기록 없음'
  const number = Number(value)
  const sign = number > 0 ? '+' : ''
  return `${sign}${formatNumber(number)}${unit}`
}

function barHeight(value) {
  return `${Math.max(Math.round((Number(value || 0) / maxCalories.value) * 100), 8)}%`
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
      description="기간별 체중, 식단, 운동 기록을 한 화면에서 확인합니다."
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
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
        style="grid-column: span 4"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>

      <article class="surface-card" style="grid-column: span 8">
        <p class="section-label">일별 섭취 칼로리</p>
        <div v-if="dailyRows.length" class="bar-chart" :style="{ gridTemplateColumns: `repeat(${dailyRows.length}, 1fr)` }">
          <div v-for="item in dailyRows" :key="item.date" class="bar-item">
            <span>{{ formatNumber(item.calories, 0) }}</span>
            <i :style="{ height: barHeight(item.calories) }"></i>
            <strong>{{ item.date.slice(5) }}</strong>
          </div>
        </div>
        <StateBlock
          v-else
          type="empty"
          title="기간 내 식단 또는 운동 기록이 없습니다"
          message="식단 기록을 저장하거나 운동 기록이 쌓이면 이곳에 표시됩니다."
        />
      </article>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">체중 요약</p>
        <div class="record-row">
          <span>시작 체중</span>
          <strong>{{ progress.bodySummary.startingWeight ?? '없음' }}</strong>
          <em>기간 첫 체중 기록</em>
        </div>
        <div class="record-row">
          <span>최근 체중</span>
          <strong>{{ progress.bodySummary.latestWeight ?? '없음' }}</strong>
          <em>기간 마지막 체중 기록</em>
        </div>
        <div class="record-row">
          <span>운동 시간</span>
          <strong>{{ progress.workoutSummary.totalWorkoutTime }}분</strong>
          <em>기간 내 총 운동 시간</em>
        </div>
      </aside>

      <section class="surface-card" style="grid-column: 1 / -1">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Daily Summary</p>
            <h2>일별 기록</h2>
          </div>
          <span class="chip">{{ dailyRows.length }}일</span>
        </div>

        <div class="meal-list">
          <article v-for="item in dailyRows" :key="item.date" class="meal-item">
            <div>
              <strong>{{ item.date }}</strong>
              <span>섭취 {{ formatNumber(item.calories, 0) }} kcal</span>
            </div>
            <div>
              <strong>{{ item.workoutCount }}회</strong>
              <span>{{ item.workoutTime }}분</span>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
