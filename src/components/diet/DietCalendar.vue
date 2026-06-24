<script setup>
import { computed } from 'vue'

const props = defineProps({
  selectedDate: {
    type: String,
    required: true,
  },
  currentMonth: {
    type: String,
    required: true,
  },
  summaries: {
    type: Object,
    default: () => ({}),
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-date', 'change-month'])

const weekDays = ['일', '월', '화', '수', '목', '금', '토']

const monthLabel = computed(() => {
  const [year, month] = props.currentMonth.split('-').map(Number)
  return `${year}년 ${month}월`
})

const calendarDays = computed(() => {
  const [year, month] = props.currentMonth.split('-').map(Number)
  const firstDate = new Date(year, month - 1, 1)
  const lastDate = new Date(year, month, 0)
  const prevLastDate = new Date(year, month - 1, 0)
  const firstWeekDay = firstDate.getDay()
  const cells = []

  for (let index = firstWeekDay - 1; index >= 0; index -= 1) {
    const day = prevLastDate.getDate() - index
    const date = new Date(year, month - 2, day)

    cells.push({
      date: toLocalDateString(date),
      day,
      isCurrentMonth: false,
    })
  }

  for (let day = 1; day <= lastDate.getDate(); day += 1) {
    const date = new Date(year, month - 1, day)

    cells.push({
      date: toLocalDateString(date),
      day,
      isCurrentMonth: true,
    })
  }

  const nextCells = cells.length <= 35 ? 35 - cells.length : 42 - cells.length

  for (let day = 1; day <= nextCells; day += 1) {
    const date = new Date(year, month, day)

    cells.push({
      date: toLocalDateString(date),
      day,
      isCurrentMonth: false,
    })
  }

  return cells.map((cell) => ({
    ...cell,
    summary: getSummary(cell.date),
    isToday: cell.date === toLocalDateString(new Date()),
    isSelected: cell.date === props.selectedDate,
  }))
})

function toLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toMonthString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')

  return `${year}-${month}`
}

function getSummary(date) {
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
    ...(props.summaries?.[date] || {}),
  }
}

function hasSummary(summary) {
  return (
    summary.hasMeal ||
    summary.hasWorkout ||
    Number(summary.totalCalories || 0) > 0 ||
    Number(summary.mealCount || 0) > 0 ||
    summary.dietScore !== null
  )
}

function formatNumber(value, digits = 0) {
  return Number(value || 0).toFixed(digits)
}

function scoreText(score) {
  if (score === null || score === undefined || score === '') return '평가 전'
  return `${score}점`
}

function workoutText(summary) {
  if (summary.hasWorkout || Number(summary.workoutCount || 0) > 0) {
    return `운동 ${Number(summary.workoutCount || 1)}개`
  }

  return '운동 없음'
}

function changeMonth(offset) {
  const [year, month] = props.currentMonth.split('-').map(Number)
  const nextDate = new Date(year, month - 1 + offset, 1)

  emit('change-month', toMonthString(nextDate))
}

function selectDate(day) {
  const nextMonth = day.date.slice(0, 7)

  if (nextMonth !== props.currentMonth) {
    emit('change-month', nextMonth)
  }

  emit('select-date', day.date)
}
</script>

<template>
  <section class="diet-calendar">
    <header class="diet-calendar__toolbar">
      <button class="diet-calendar__nav" type="button" aria-label="이전 달" @click="changeMonth(-1)">
        ‹
      </button>

      <div class="diet-calendar__month">
        <strong>{{ monthLabel }}</strong>
        <span v-if="isLoading">월간 요약 불러오는 중...</span>
        <span v-else>날짜를 클릭하면 아래 상세가 바뀝니다</span>
      </div>

      <button class="diet-calendar__nav" type="button" aria-label="다음 달" @click="changeMonth(1)">
        ›
      </button>
    </header>

    <div class="diet-calendar__weekdays">
      <span v-for="day in weekDays" :key="day">{{ day }}</span>
    </div>

    <div class="diet-calendar__grid" :class="{ 'is-loading': isLoading }">
      <button
        v-for="day in calendarDays"
        :key="day.date"
        class="diet-calendar__day"
        type="button"
        :class="{
          'is-muted': !day.isCurrentMonth,
          'is-today': day.isToday,
          'is-selected': day.isSelected,
          'has-summary': hasSummary(day.summary),
          'has-workout': day.summary.hasWorkout,
          'has-score': day.summary.dietScore !== null && day.summary.dietScore !== undefined,
        }"
        @click="selectDate(day)"
      >
        <span class="diet-calendar__day-head">
          <strong>{{ day.day }}</strong>
          <i v-if="day.isToday">오늘</i>
        </span>

        <span v-if="hasSummary(day.summary)" class="diet-calendar__summary">
          <b>{{ formatNumber(day.summary.totalCalories, 0) }} kcal</b>

          <span
            v-if="day.summary.dietScore !== null && day.summary.dietScore !== undefined"
            class="diet-calendar__score-hero"
          >
            <strong>{{ day.summary.dietScore }}</strong>
            <em>점</em>
          </span>

          <span v-else class="diet-calendar__score-empty">
            평가 전
          </span>
        </span>

        <span v-else class="diet-calendar__empty">기록 없음</span>

        <span class="diet-calendar__tooltip">
          <strong>{{ day.date }}</strong>
          <span>섭취 {{ formatNumber(day.summary.totalCalories, 0) }} kcal</span>
          <span>
            탄 {{ formatNumber(day.summary.totalCarbohydrate, 1) }}g ·
            단 {{ formatNumber(day.summary.totalProtein, 1) }}g ·
            지 {{ formatNumber(day.summary.totalFat, 1) }}g
          </span>
          <span>식사 기록 {{ day.summary.mealCount || 0 }}개</span>
          <span>식단 점수 {{ scoreText(day.summary.dietScore) }}</span>
          <span>{{ workoutText(day.summary) }}</span>
        </span>
      </button>
    </div>

    <footer class="diet-calendar__legend">
      <span><i class="legend-dot meal"></i> 식단 기록</span>
      <span><i class="legend-dot workout"></i> 운동 기록</span>
      <span><i class="legend-dot score"></i> 식단 평가</span>
      <span><i class="legend-dot selected"></i> 선택 날짜</span>
    </footer>
  </section>
</template>

<style scoped>
.diet-calendar {
  width: 100%;
}

.diet-calendar__toolbar {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.diet-calendar__nav {
  width: 42px;
  height: 42px;
  border: 1px solid rgba(31, 107, 63, 0.14);
  border-radius: 16px;
  background: rgba(248, 252, 247, 0.86);
  color: #1f6b3f;
  font-size: 1.45rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    transform 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.diet-calendar__nav:hover {
  transform: translateY(-2px);
  background: white;
  box-shadow: 0 12px 24px rgba(31, 107, 63, 0.1);
}

.diet-calendar__month {
  text-align: center;
}

.diet-calendar__month strong {
  display: block;
  color: #14251b;
  font-size: 1.4rem;
  letter-spacing: -0.04em;
}

.diet-calendar__month span {
  display: block;
  margin-top: 0.25rem;
  color: rgba(23, 38, 29, 0.56);
  font-size: 0.82rem;
}

.diet-calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.diet-calendar__weekdays span {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(23, 38, 29, 0.58);
  font-size: 0.78rem;
  font-weight: 900;
}

.diet-calendar__weekdays span:first-child {
  color: #b44a4a;
}

.diet-calendar__weekdays span:last-child {
  color: #356eb7;
}

.diet-calendar__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 0.5rem;
  position: relative;
}

.diet-calendar__grid.is-loading {
  opacity: 0.72;
}

.diet-calendar__day {
  position: relative;
  min-height: 124px;
  padding: 0.75rem;
  border: 1px solid rgba(31, 107, 63, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  color: #17261d;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.diet-calendar__day:hover {
  z-index: 5;
  transform: translateY(-3px);
  border-color: rgba(31, 107, 63, 0.36);
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 36px rgba(31, 107, 63, 0.12);
}

.diet-calendar__day.is-muted {
  opacity: 0.46;
}

.diet-calendar__day.is-today {
  border-color: rgba(217, 165, 20, 0.48);
}

.diet-calendar__day.is-selected {
  border-color: rgba(31, 107, 63, 0.62);
  background:
    radial-gradient(circle at 100% 0%, rgba(255, 216, 104, 0.22), transparent 38%),
    rgba(31, 107, 63, 0.08);
  box-shadow: inset 0 0 0 1px rgba(31, 107, 63, 0.18);
}

.diet-calendar__day.has-summary::after {
  content: '';
  position: absolute;
  left: 0.75rem;
  right: 0.75rem;
  bottom: 0.55rem;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, #1f6b3f, rgba(31, 107, 63, 0.2));
}

.diet-calendar__day.has-workout .diet-calendar__day-head strong {
  position: relative;
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(217, 165, 20, 0.18);
  color: #8a660e;
  box-shadow:
    0 0 0 4px rgba(217, 165, 20, 0.08),
    inset 0 0 0 1px rgba(217, 165, 20, 0.24);
}

.diet-calendar__day.has-workout .diet-calendar__day-head strong::after {
  content: '';
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #d9a514;
  border: 2px solid rgba(255, 255, 255, 0.96);
  box-shadow: 0 2px 8px rgba(217, 165, 20, 0.3);
}

.diet-calendar__day.has-score {
  background:
    radial-gradient(circle at 100% 0%, rgba(31, 107, 63, 0.08), transparent 35%),
    rgba(255, 255, 255, 0.8);
}

.diet-calendar__day-head {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.diet-calendar__day-head strong {
  color: #14251b;
  font-size: 1rem;
}

.diet-calendar__day-head i {
  min-height: 22px;
  padding: 0 0.48rem;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(217, 165, 20, 0.13);
  color: #9a710c;
  font-size: 0.68rem;
  font-style: normal;
  font-weight: 900;
}

.diet-calendar__summary {
  display: flex;
  min-height: 72px;
  margin-top: auto;
  flex-direction: column;
  justify-content: flex-end;
  gap: 0.18rem;
  padding-bottom: 0.45rem;
}

.diet-calendar__summary b,
.diet-calendar__empty {
  display: block;
}

.diet-calendar__summary b {
  color: rgba(23, 38, 29, 0.72);
  font-size: 0.82rem;
  font-weight: 900;
}

.diet-calendar__score-hero {
  display: inline-flex;
  align-items: baseline;
  gap: 0.12rem;
  color: #1f6b3f;
  line-height: 0.95;
  letter-spacing: -0.06em;
}

.diet-calendar__score-hero strong {
  font-size: clamp(1.8rem, 2.4vw, 2.45rem);
  font-weight: 1000;
}

.diet-calendar__score-hero em {
  font-size: 0.9rem;
  font-style: normal;
  font-weight: 1000;
  letter-spacing: -0.02em;
}

.diet-calendar__score-empty,
.diet-calendar__empty {
  color: rgba(23, 38, 29, 0.48);
  font-size: 0.78rem;
  font-weight: 800;
  line-height: 1.35;
}

.diet-calendar__score-empty {
  margin-top: 0.45rem;
}

.diet-calendar__empty {
  margin-top: auto;
  padding-bottom: 0.4rem;
}

.diet-calendar__tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 0.6rem);
  width: 230px;
  transform: translateX(-50%) translateY(6px);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  padding: 0.8rem;
  border: 1px solid rgba(31, 107, 63, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 18px 40px rgba(31, 107, 63, 0.14);
  color: #17261d;
  z-index: 20;
  transition:
    opacity 0.16s ease,
    visibility 0.16s ease,
    transform 0.16s ease;
}

.diet-calendar__day:hover .diet-calendar__tooltip {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.diet-calendar__tooltip strong,
.diet-calendar__tooltip span {
  display: block;
}

.diet-calendar__tooltip strong {
  margin-bottom: 0.35rem;
  color: #1f6b3f;
  font-size: 0.82rem;
}

.diet-calendar__tooltip span {
  color: rgba(23, 38, 29, 0.68);
  font-size: 0.76rem;
  line-height: 1.55;
}

.diet-calendar__legend {
  margin-top: 0.85rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: rgba(23, 38, 29, 0.58);
  font-size: 0.78rem;
  font-weight: 800;
}

.diet-calendar__legend span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.legend-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  display: inline-block;
}

.legend-dot.meal {
  background: #1f6b3f;
}

.legend-dot.workout {
  background: #d9a514;
}

.legend-dot.score {
  background: #6aa985;
}

.legend-dot.selected {
  background: rgba(31, 107, 63, 0.22);
  border: 1px solid #1f6b3f;
}

@media (max-width: 980px) {
  .diet-calendar__day {
    min-height: 108px;
    padding: 0.65rem;
  }

  .diet-calendar__score-hero strong {
    font-size: 1.65rem;
  }
}

@media (max-width: 720px) {
  .diet-calendar__grid,
  .diet-calendar__weekdays {
    gap: 0.35rem;
  }

  .diet-calendar__day {
    min-height: 78px;
    border-radius: 16px;
  }

  .diet-calendar__summary b {
    font-size: 0.76rem;
  }

  .diet-calendar__empty,
  .diet-calendar__score-empty,
  .diet-calendar__tooltip {
    display: none;
  }

  .diet-calendar__score-hero strong {
    font-size: 1.05rem;
  }

  .diet-calendar__score-hero em {
    font-size: 0.68rem;
  }

  .diet-calendar__toolbar {
    grid-template-columns: auto 1fr auto;
  }

  .diet-calendar__month strong {
    font-size: 1.05rem;
  }

  .diet-calendar__month span {
    display: none;
  }
}
</style>
