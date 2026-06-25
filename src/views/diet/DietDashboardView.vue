<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import DietCalendar from '@/components/diet/DietCalendar.vue'
import { normalizeCaughtError } from '@/api/client'
import { getDietFeedbacks, getMealDashboard } from '@/api/diet'
import { getWorkoutLogs } from '@/api/workout'

const dashboard = ref(null)
const calendarSummaries = ref({})
const isLoading = ref(false)
const isCalendarLoading = ref(false)
const errorMessage = ref('')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const currentMonth = ref(selectedDate.value.slice(0, 7))

const calorieSummary = computed(() => {
  const recommended = Number(dashboard.value?.recommendedCalories || 0)
  const consumed = Number(dashboard.value?.totalCalories || 0)
  const rawRemaining =
    dashboard.value?.remainingCalories !== null &&
    dashboard.value?.remainingCalories !== undefined
      ? Number(dashboard.value.remainingCalories)
      : recommended
        ? recommended - consumed
        : null

  const remaining = rawRemaining === null ? null : Math.max(rawRemaining, 0)
  const overCalories = recommended ? Math.max(consumed - recommended, 0) : 0
  const percent = recommended ? Math.round((consumed / recommended) * 100) : 0
  const progressWidth = Math.min(percent, 100)
  const isOver = recommended > 0 && consumed > recommended
  const isNear = !isOver && recommended > 0 && percent >= 85
  const isLow = recommended > 0 && percent < 50

  let statusText = '프로필 필요'
  let statusMessage = '마이프로필을 저장하면 권장 칼로리 기준으로 진행률을 볼 수 있습니다.'

  if (recommended) {
    if (isOver) {
      statusText = `${formatNumber(overCalories, 0)} kcal 초과`
      statusMessage = '권장 칼로리를 넘었습니다. 남은 식사는 가볍게 조절하는 게 좋습니다.'
    } else if (isNear) {
      statusText = '목표 근접'
      statusMessage = '권장 칼로리에 거의 도달했습니다. 남은 식사는 균형 위주로 맞춰보세요.'
    } else if (isLow) {
      statusText = '아직 여유 있음'
      statusMessage = '아직 권장 칼로리까지 여유가 있습니다. 필요한 영양소를 더 채워보세요.'
    } else {
      statusText = '적정 진행'
      statusMessage = '권장 칼로리 범위 안에서 섭취가 진행 중입니다.'
    }
  }

  return {
    recommended,
    consumed,
    remaining,
    overCalories,
    percent,
    progressWidth,
    isOver,
    isNear,
    isLow,
    statusText,
    statusMessage,
  }
})

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

const selectedDateSummary = computed(() => {
  return calendarSummaries.value[selectedDate.value] || buildCalendarSummary(selectedDate.value, dashboard.value)
})

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits)
}

function macroPercent(row) {
  if (!row.recommended) return 0
  return Math.min(Math.round((row.value / row.recommended) * 100), 100)
}

function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getMonthRange(monthText) {
  const [year, month] = monthText.split('-').map(Number)
  const startDate = toLocalDateString(new Date(year, month - 1, 1))
  const endDate = toLocalDateString(new Date(year, month, 0))

  return { startDate, endDate }
}

function getMonthDates(monthText) {
  const [year, month] = monthText.split('-').map(Number)
  const lastDate = new Date(year, month, 0)
  const dates = []

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    dates.push(toLocalDateString(new Date(year, month - 1, day)))
  }

  return dates
}

function getMealCount(data) {
  const summary = data?.mealTypeSummary || {}

  return Object.values(summary).reduce((total, item) => {
    return total + Number(item?.meal_count || 0)
  }, 0)
}

function normalizeDate(value) {
  if (!value) return ''

  if (typeof value === 'string') {
    return value.slice(0, 10)
  }

  if (value instanceof Date) {
    return toLocalDateString(value)
  }

  return String(value).slice(0, 10)
}

function getFeedbackDate(feedback) {
  return normalizeDate(
    feedback?.targetDate ??
      feedback?.date ??
      feedback?.intakeDate ??
      feedback?.createdAt ??
      feedback?.created_at,
  )
}

function getFeedbackScore(feedback) {
  const score =
    feedback?.score ??
    feedback?.dietScore ??
    feedback?.evaluationScore ??
    feedback?.mealScore ??
    feedback?.totalScore ??
    feedback?.rating ??
    null

  if (score === null || score === undefined || score === '') return null

  const numericScore = Number(score)
  return Number.isNaN(numericScore) ? score : numericScore
}

function getDashboardDietScore(data) {
  const score =
    data?.dietScore ??
    data?.score ??
    data?.evaluationScore ??
    data?.mealScore ??
    data?.dailyScore ??
    null

  if (score === null || score === undefined || score === '') return null

  const numericScore = Number(score)
  return Number.isNaN(numericScore) ? score : numericScore
}

function getWorkoutDate(log) {
  return normalizeDate(
    log?.workoutDate ??
      log?.workout_date ??
      log?.date ??
      log?.createdAt ??
      log?.created_at,
  )
}

function buildCalendarSummary(date, data) {
  if (!data) {
    return {
      date,
      totalCalories: 0,
      totalCarbohydrate: 0,
      totalProtein: 0,
      totalFat: 0,
      mealCount: 0,
      dietScore: null,
      feedbackCount: 0,
      workoutCount: 0,
      hasMeal: false,
      hasWorkout: false,
    }
  }

  const mealCount = getMealCount(data)
  const totalCalories = Number(data?.totalCalories || 0)

  return {
    date,
    totalCalories,
    totalCarbohydrate: Number(data?.totalCarbohydrate || 0),
    totalProtein: Number(data?.totalProtein || 0),
    totalFat: Number(data?.totalFat || 0),
    mealCount,
    dietScore: getDashboardDietScore(data),
    feedbackCount: 0,
    workoutCount: 0,
    hasMeal: mealCount > 0 || totalCalories > 0,
    hasWorkout: false,
  }
}

function applyWorkoutLogsToSummaries(baseSummaries, workoutLogs = []) {
  const nextSummaries = { ...baseSummaries }

  workoutLogs.forEach((log) => {
    const date = getWorkoutDate(log)
    if (!date) return

    const current = nextSummaries[date] || buildCalendarSummary(date, null)

    nextSummaries[date] = {
      ...current,
      workoutCount: Number(current.workoutCount || 0) + 1,
      hasWorkout: true,
    }
  })

  return nextSummaries
}

function applyFeedbacksToSummaries(baseSummaries, feedbacks = []) {
  const nextSummaries = { ...baseSummaries }

  feedbacks.forEach((feedback) => {
    const date = getFeedbackDate(feedback)
    if (!date) return

    const current = nextSummaries[date] || buildCalendarSummary(date, null)
    const score = getFeedbackScore(feedback)

    nextSummaries[date] = {
      ...current,
      dietScore: score ?? current.dietScore,
      feedbackCount: Number(current.feedbackCount || 0) + 1,
    }
  })

  return nextSummaries
}

async function fetchDashboard() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getMealDashboard({ date: selectedDate.value })
    dashboard.value = data

    calendarSummaries.value = {
      ...calendarSummaries.value,
      [selectedDate.value]: {
        ...(calendarSummaries.value[selectedDate.value] || {}),
        ...buildCalendarSummary(selectedDate.value, data),
        workoutCount: calendarSummaries.value[selectedDate.value]?.workoutCount || 0,
        hasWorkout: calendarSummaries.value[selectedDate.value]?.hasWorkout || false,
        dietScore:
          calendarSummaries.value[selectedDate.value]?.dietScore ??
          getDashboardDietScore(data),
        feedbackCount: calendarSummaries.value[selectedDate.value]?.feedbackCount || 0,
      },
    }
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

async function fetchMonthDietSummaries(monthText) {
  const dates = getMonthDates(monthText)
  const missingDates = dates.filter((date) => !calendarSummaries.value[date])

  if (missingDates.length === 0) {
    return calendarSummaries.value
  }

  const results = await Promise.allSettled(
    missingDates.map(async (date) => {
      const data = await getMealDashboard({ date })
      return [date, buildCalendarSummary(date, data)]
    }),
  )

  const nextSummaries = { ...calendarSummaries.value }

  results.forEach((result) => {
    if (result.status !== 'fulfilled') return

    const [date, summary] = result.value
    nextSummaries[date] = {
      ...(nextSummaries[date] || {}),
      ...summary,
    }
  })

  return nextSummaries
}

async function fetchMonthWorkoutLogs(monthText) {
  const { startDate, endDate } = getMonthRange(monthText)

  try {
    const logs = await getWorkoutLogs({
      start_date: startDate,
      end_date: endDate,
      page_size: 300,
    })

    return logs.filter((log) => {
      const date = getWorkoutDate(log)
      return date >= startDate && date <= endDate
    })
  } catch {
    return []
  }
}

async function fetchMonthDietFeedbacks(monthText) {
  const { startDate, endDate } = getMonthRange(monthText)

  try {
    const feedbacks = await getDietFeedbacks({
      start_date: startDate,
      end_date: endDate,
      page_size: 100,
    })

    return feedbacks.filter((feedback) => {
      const date = getFeedbackDate(feedback)
      return date >= startDate && date <= endDate
    })
  } catch {
    return []
  }
}

async function fetchCalendarSummaries(monthText = currentMonth.value) {
  isCalendarLoading.value = true

  try {
    const [dietSummaries, workoutLogs, dietFeedbacks] = await Promise.all([
      fetchMonthDietSummaries(monthText),
      fetchMonthWorkoutLogs(monthText),
      fetchMonthDietFeedbacks(monthText),
    ])

    let nextSummaries = applyWorkoutLogsToSummaries(dietSummaries, workoutLogs)
    nextSummaries = applyFeedbacksToSummaries(nextSummaries, dietFeedbacks)

    calendarSummaries.value = nextSummaries
  } catch {
    // 월간 캘린더 요약 실패는 페이지 전체 에러로 막지 않는다.
  } finally {
    isCalendarLoading.value = false
  }
}

async function handleSelectDate(date) {
  selectedDate.value = date
  currentMonth.value = date.slice(0, 7)

  await fetchDashboard()
}

async function handleChangeMonth(monthText) {
  currentMonth.value = monthText
  await fetchCalendarSummaries(monthText)
}

async function moveToToday() {
  const today = new Date().toISOString().slice(0, 10)
  selectedDate.value = today
  currentMonth.value = today.slice(0, 7)

  await Promise.all([
    fetchDashboard(),
    fetchCalendarSummaries(currentMonth.value),
  ])
}

onMounted(async () => {
  await Promise.all([
    fetchDashboard(),
    fetchCalendarSummaries(currentMonth.value),
  ])
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet"
      title="식단 대시보드"
      description="캘린더에서 날짜별 섭취 칼로리와 영양 상태를 한눈에 확인합니다."
    />

    <section class="diet-dashboard-layout">
      <section class="surface-card diet-calendar-card">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Calendar</p>
            <h2>월간 식단 캘린더</h2>
          </div>

          <div class="button-row">
            <button class="btn btn-secondary" type="button" @click="moveToToday">
              오늘
            </button>
            <RouterLink class="btn btn-secondary" to="/diet/records">
              식단 기록
            </RouterLink>
            <RouterLink class="btn btn-secondary" to="/foods">
              음식 검색
            </RouterLink>
          </div>
        </div>

        <DietCalendar
          :selected-date="selectedDate"
          :current-month="currentMonth"
          :summaries="calendarSummaries"
          :is-loading="isCalendarLoading"
          @select-date="handleSelectDate"
          @change-month="handleChangeMonth"
        />
      </section>

      <aside class="surface-card selected-day-card">
        <p class="section-label">Selected Day</p>

        <div class="selected-day-head">
          <div>
            <h2>{{ selectedDate }}</h2>
            <p>선택한 날짜의 식단 요약</p>
          </div>

          <span
            class="day-status-chip"
            :class="{ 'is-active': selectedDateSummary.hasMeal }"
          >
            {{ selectedDateSummary.hasMeal ? '기록 있음' : '기록 없음' }}
          </span>
        </div>

        <section
          class="selected-score-hero"
          :class="{ 'is-empty': selectedDateSummary.dietScore === null }"
        >
          <span>식단 점수</span>

          <strong v-if="selectedDateSummary.dietScore !== null">
            {{ selectedDateSummary.dietScore }}<em>점</em>
          </strong>
          <strong v-else>
            평가 전
          </strong>

          <p>
            {{ selectedDateSummary.dietScore !== null ? 'AI 식단 평가가 완료된 날짜입니다.' : '오늘 평가를 진행하면 점수가 표시됩니다.' }}
          </p>
        </section>

        <div class="selected-day-stats">
          <article>
            <span>섭취 칼로리</span>
            <strong>{{ formatNumber(selectedDateSummary.totalCalories, 0) }} kcal</strong>
          </article>
          <article>
            <span>식사 기록</span>
            <strong>{{ selectedDateSummary.mealCount }}개</strong>
          </article>
          <article>
            <span>운동 여부</span>
            <strong>{{ selectedDateSummary.hasWorkout ? `운동 ${selectedDateSummary.workoutCount}개` : '기록 없음' }}</strong>
          </article>
        </div>

        <div class="selected-macro-mini">
          <div>
            <span>탄</span>
            <strong>{{ formatNumber(selectedDateSummary.totalCarbohydrate) }}g</strong>
          </div>
          <div>
            <span>단</span>
            <strong>{{ formatNumber(selectedDateSummary.totalProtein) }}g</strong>
          </div>
          <div>
            <span>지</span>
            <strong>{{ formatNumber(selectedDateSummary.totalFat) }}g</strong>
          </div>
        </div>

        <div class="selected-day-actions">
          <RouterLink class="btn btn-primary" to="/diet/records">식사 기록하기</RouterLink>
          <RouterLink class="btn btn-secondary" to="/workout/logs">운동 기록하기</RouterLink>
        </div>
      </aside>
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

    <section v-else class="content-grid dashboard-detail-grid">
      <section
        class="surface-card calorie-progress-card"
        style="grid-column: 1 / -1"
        :class="{
          'is-over': calorieSummary.isOver,
          'is-near': calorieSummary.isNear,
          'is-low': calorieSummary.isLow,
          'is-empty': !calorieSummary.recommended,
        }"
      >
        <div class="calorie-progress-head">
          <div>
            <p class="section-label">Calories</p>
            <h2>선택일 칼로리 진행률</h2>
          </div>

          <span class="calorie-status-chip">
            {{ calorieSummary.statusText }}
          </span>
        </div>

        <div class="calorie-progress-main">
          <div class="calorie-progress-copy">
            <strong>
              {{ calorieSummary.recommended ? `${calorieSummary.percent}%` : '--' }}
            </strong>
            <p>{{ calorieSummary.statusMessage }}</p>
          </div>

          <div class="calorie-progress-track" aria-label="칼로리 섭취 진행률">
            <i :style="{ width: `${calorieSummary.progressWidth}%` }"></i>
          </div>
        </div>

        <div class="calorie-stat-grid">
          <article>
            <span>하루 권장</span>
            <strong>
              {{ calorieSummary.recommended ? `${formatNumber(calorieSummary.recommended, 0)} kcal` : '프로필 필요' }}
            </strong>
          </article>

          <article>
            <span>선택일 섭취</span>
            <strong>{{ formatNumber(calorieSummary.consumed, 0) }} kcal</strong>
          </article>

          <article>
            <span>{{ calorieSummary.isOver ? '초과 칼로리' : '남은 칼로리' }}</span>
            <strong>
              {{
                calorieSummary.isOver
                  ? `${formatNumber(calorieSummary.overCalories, 0)} kcal`
                  : calorieSummary.remaining !== null
                    ? `${formatNumber(calorieSummary.remaining, 0)} kcal`
                    : '계산 대기'
              }}
            </strong>
          </article>
        </div>
      </section>

      <section class="surface-card" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Macros</p>
            <h2>선택일 영양소</h2>
          </div>
          <span class="chip">{{ selectedDate }}</span>
        </div>

        <div v-for="row in macroRows" :key="row.label" class="macro-row">
          <span>{{ row.label }}</span>
          <div class="meter">
            <i :style="{ width: `${macroPercent(row)}%` }"></i>
          </div>
          <strong>{{ formatNumber(row.value) }}g</strong>
        </div>
      </section>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">빠른 이동</p>
        <div class="button-row">
          <RouterLink class="btn btn-secondary" to="/diet/recommend">
            AI 추천
          </RouterLink>
          <RouterLink class="btn btn-secondary" to="/diet/evaluation">
            오늘 평가
          </RouterLink>
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
              <span>
                탄 {{ formatNumber(row.total_carbohydrate) }}g ·
                단 {{ formatNumber(row.total_protein) }}g ·
                지 {{ formatNumber(row.total_fat) }}g
              </span>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.diet-dashboard-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 1rem;
  align-items: stretch;
  margin-bottom: 1rem;
}

.diet-calendar-card,
.selected-day-card {
  min-width: 0;
}

.selected-day-card {
  align-self: stretch;
  min-height: 100%;
  display: flex;
  flex-direction: column;
}

.selected-day-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-top: 0.75rem;
}

.selected-day-head h2 {
  margin: 0;
  color: #14251b;
  font-size: 1.6rem;
  letter-spacing: -0.04em;
}

.selected-day-head p {
  margin: 0.35rem 0 0;
  color: rgba(23, 38, 29, 0.58);
}

.day-status-chip {
  flex: 0 0 auto;
  min-height: 30px;
  padding: 0 0.75rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(23, 38, 29, 0.07);
  color: rgba(23, 38, 29, 0.58);
  font-size: 0.76rem;
  font-weight: 900;
}

.day-status-chip.is-active {
  background: rgba(31, 107, 63, 0.12);
  color: #1f6b3f;
}

.selected-score-hero {
  flex: 1 1 auto;
  min-height: 220px;
  margin-top: 1.25rem;
  padding: 1.4rem 1.1rem;
  border: 1px solid rgba(31, 107, 63, 0.14);
  border-radius: 30px;
  background:
    radial-gradient(circle at 100% 0%, rgba(255, 216, 104, 0.28), transparent 42%),
    linear-gradient(135deg, rgba(31, 107, 63, 0.1), rgba(255, 255, 255, 0.9));
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
}

.selected-score-hero > span {
  color: #1f6b3f;
  font-size: 0.78rem;
  font-weight: 1000;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.selected-score-hero strong {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
  margin-top: 0.6rem;
  color: #12321f;
  font-size: clamp(4.3rem, 7vw, 6.2rem);
  font-weight: 1000;
  line-height: 0.92;
  letter-spacing: -0.09em;
}

.selected-score-hero strong em {
  color: #1f6b3f;
  font-size: clamp(1.3rem, 2vw, 1.8rem);
  font-style: normal;
  font-weight: 1000;
  letter-spacing: -0.04em;
}

.selected-score-hero p {
  margin: 0.9rem 0 0;
  color: rgba(23, 38, 29, 0.64);
  font-size: 0.86rem;
  font-weight: 800;
  line-height: 1.55;
}

.selected-score-hero.is-empty strong {
  color: rgba(23, 38, 29, 0.42);
  font-size: clamp(2.1rem, 3.2vw, 3rem);
  letter-spacing: -0.06em;
}

.selected-day-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.selected-day-stats article {
  padding: 0.85rem 0.95rem;
  border: 1px solid rgba(31, 107, 63, 0.12);
  border-radius: 18px;
  background: rgba(248, 252, 247, 0.72);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.selected-day-stats span,
.selected-macro-mini span {
  display: block;
  color: rgba(23, 38, 29, 0.58);
  font-size: 0.76rem;
  font-weight: 800;
}

.selected-day-stats strong {
  display: block;
  color: #14251b;
  font-size: 1rem;
  text-align: right;
}

.selected-macro-mini {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.65rem;
  margin-top: 0.85rem;
}

.selected-macro-mini div {
  padding: 0.85rem;
  border-radius: 18px;
  background: rgba(31, 107, 63, 0.08);
}

.selected-macro-mini strong {
  display: block;
  margin-top: 0.3rem;
  color: #1f6b3f;
}

.selected-day-actions {
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}


.calorie-progress-card {
  position: relative;
  overflow: hidden;
  border-color: rgba(31, 107, 63, 0.14);
  background:
    radial-gradient(circle at 0% 0%, rgba(31, 107, 63, 0.1), transparent 34%),
    radial-gradient(circle at 100% 0%, rgba(255, 216, 104, 0.22), transparent 36%),
    rgba(255, 255, 255, 0.94);
}

.calorie-progress-card::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background:
    radial-gradient(circle at 100% 0%, rgba(198, 63, 63, 0.22), transparent 42%),
    linear-gradient(135deg, rgba(198, 63, 63, 0.08), transparent 55%);
  transition: opacity 0.2s ease;
}

.calorie-progress-card.is-over {
  border-color: rgba(198, 63, 63, 0.28);
}

.calorie-progress-card.is-over::before {
  opacity: 1;
}

.calorie-progress-head,
.calorie-progress-main,
.calorie-stat-grid {
  position: relative;
  z-index: 1;
}

.calorie-progress-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.calorie-progress-head h2 {
  margin: 0.25rem 0 0;
}

.calorie-status-chip {
  min-height: 34px;
  padding: 0 0.9rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  background: rgba(31, 107, 63, 0.1);
  color: #1f6b3f;
  font-size: 0.78rem;
  font-weight: 1000;
  white-space: nowrap;
}

.calorie-progress-card.is-near .calorie-status-chip {
  background: rgba(217, 165, 20, 0.16);
  color: #8a660e;
}

.calorie-progress-card.is-over .calorie-status-chip {
  background: rgba(198, 63, 63, 0.12);
  color: #a33a3a;
}

.calorie-progress-main {
  margin-top: 1.25rem;
}

.calorie-progress-copy {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.25rem;
  margin-bottom: 0.85rem;
}

.calorie-progress-copy strong {
  color: #12321f;
  font-size: clamp(3rem, 6vw, 5.2rem);
  font-weight: 1000;
  line-height: 0.9;
  letter-spacing: -0.08em;
}

.calorie-progress-card.is-over .calorie-progress-copy strong {
  color: #a33a3a;
}

.calorie-progress-copy p {
  max-width: 520px;
  margin: 0;
  color: rgba(23, 38, 29, 0.64);
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.55;
  text-align: right;
}

.calorie-progress-track {
  position: relative;
  height: 24px;
  overflow: hidden;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(31, 107, 63, 0.08), rgba(31, 107, 63, 0.04)),
    rgba(23, 38, 29, 0.06);
  box-shadow:
    inset 0 0 0 1px rgba(31, 107, 63, 0.08),
    inset 0 2px 6px rgba(23, 38, 29, 0.08);
}

.calorie-progress-track i {
  display: block;
  height: 100%;
  min-width: 0;
  border-radius: inherit;
  background:
    linear-gradient(90deg, #1f6b3f, #3aad70),
    #1f6b3f;
  box-shadow: 0 8px 20px rgba(31, 107, 63, 0.22);
  transition: width 0.35s ease;
}

.calorie-progress-card.is-low .calorie-progress-track i {
  background: linear-gradient(90deg, #74a985, #1f6b3f);
}

.calorie-progress-card.is-near .calorie-progress-track i {
  background: linear-gradient(90deg, #1f6b3f, #d9a514);
}

.calorie-progress-card.is-over .calorie-progress-track {
  background:
    repeating-linear-gradient(
      45deg,
      rgba(198, 63, 63, 0.08) 0,
      rgba(198, 63, 63, 0.08) 8px,
      rgba(198, 63, 63, 0.03) 8px,
      rgba(198, 63, 63, 0.03) 16px
    ),
    rgba(198, 63, 63, 0.08);
}

.calorie-progress-card.is-over .calorie-progress-track i {
  background: linear-gradient(90deg, #d95f5f, #a33a3a);
  box-shadow: 0 8px 24px rgba(198, 63, 63, 0.28);
}

.calorie-stat-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}

.calorie-stat-grid article {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(31, 107, 63, 0.12);
  border-radius: 20px;
  background: rgba(248, 252, 247, 0.72);
}

.calorie-stat-grid span,
.calorie-stat-grid strong {
  display: block;
}

.calorie-stat-grid span {
  color: rgba(23, 38, 29, 0.58);
  font-size: 0.78rem;
  font-weight: 900;
}

.calorie-stat-grid strong {
  margin-top: 0.35rem;
  color: #14251b;
  font-size: 1.35rem;
  font-weight: 1000;
  letter-spacing: -0.04em;
}

.calorie-progress-card.is-over .calorie-stat-grid article:last-child strong {
  color: #a33a3a;
}


.dashboard-detail-grid {
  margin-top: 0;
}

@media (max-width: 1100px) {
  .diet-dashboard-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .selected-score-hero {
    min-height: 170px;
  }

  .selected-day-stats {
    grid-template-columns: 1fr;
  }

  .calorie-progress-copy {
    align-items: flex-start;
    flex-direction: column;
  }

  .calorie-progress-copy p {
    text-align: left;
  }

  .calorie-stat-grid {
    grid-template-columns: 1fr;
  }

  .calorie-progress-head {
    flex-direction: column;
  }
}
</style>
