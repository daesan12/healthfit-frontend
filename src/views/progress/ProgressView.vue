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
    value: `${progress.value?.workoutSummary.workoutCount || 0}회`,
    hint: `${progress.value?.workoutSummary.totalWorkoutTime || 0}분 운동`,
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
      protein: Number(meal.total_protein || 0),
      workoutCount: workout.workout_count || 0,
      workoutTime: workout.total_workout_time || 0,
    }
  })
})

const maxCalories = computed(() => Math.max(...dailyRows.value.map((item) => item.calories), 1))

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
      <RouterLink class="btn btn-secondary" to="/body-records">신체 기록</RouterLink>
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
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
        style="grid-column: span 4"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <p>{{ metric.hint }}</p>
      </article>

      <article class="surface-card" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Daily Calories</p>
            <h2>일별 섭취 칼로리</h2>
          </div>
          <span class="chip">{{ dailyRows.length }}일</span>
        </div>
        <div
          v-if="dailyRows.length"
          class="bar-chart"
          :style="{ gridTemplateColumns: `repeat(${dailyRows.length}, 1fr)` }"
        >
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
          message="식단 기록이나 운동 기록을 추가하면 이곳에 일별 요약이 표시됩니다."
        />
      </article>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">Body Summary</p>
        <h2>신체 변화 요약</h2>
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
        <div class="record-row">
          <span>총 운동 시간</span>
          <strong>{{ progress.workoutSummary.totalWorkoutTime }}분</strong>
          <em>기간 내 모든 운동 기록의 합계</em>
        </div>
      </aside>

      <section class="surface-card" style="grid-column: span 6">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Body Records</p>
            <h2>최근 신체 기록</h2>
          </div>
          <RouterLink class="text-link" to="/body-records">관리</RouterLink>
        </div>

        <div v-if="bodyRecords.length" class="meal-list">
          <article v-for="record in bodyRecords" :key="record.id" class="meal-item">
            <div>
              <strong>{{ record.record_date }}</strong>
              <span>
                체중 {{ formatOptional(record.weight, 'kg') }} · 체지방
                {{ formatOptional(record.body_fat_percentage, '%') }}
              </span>
            </div>
            <div>
              <strong>{{ formatOptional(record.skeletal_muscle_mass, 'kg') }}</strong>
              <span>골격근량</span>
            </div>
          </article>
        </div>
        <StateBlock
          v-else
          type="empty"
          title="신체 기록이 없습니다"
          message="몸무게, 체지방률, 골격근량을 기록하면 변화 추이를 확인할 수 있습니다."
        />
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
              <span>섭취 {{ formatNumber(item.calories, 0) }} kcal · 단백질 {{ formatNumber(item.protein) }}g</span>
            </div>
            <div>
              <strong>{{ item.workoutCount }}회</strong>
              <span>{{ item.workoutTime }}분</span>
            </div>
          </article>
        </div>
        <StateBlock
          v-else
          type="empty"
          title="일별 요약 데이터가 없습니다"
          message="식단이나 운동 기록을 남기면 날짜별 요약이 표시됩니다."
        />
      </section>
    </section>
  </main>
</template>
