<script setup>
import { computed, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { mockDietFeedback } from '@/data/mockData'

const targetDate = ref(mockDietFeedback.date)
const feedback = ref(mockDietFeedback)

const calorieRate = computed(() =>
  Math.min(Math.round((feedback.value.totalCalories / feedback.value.recommendedCalories) * 100), 100),
)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet AI"
      title="오늘의 식단 평가"
      description="기록한 식단을 권장 칼로리와 탄단지 기준으로 분석합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4">
        <div class="field-group">
          <label for="evaluation-date">평가 날짜</label>
          <input id="evaluation-date" v-model="targetDate" type="date" />
        </div>

        <button class="btn btn-primary" type="button">식단 평가 요청</button>
        <RouterLink class="btn btn-secondary" to="/diet/records">식단 기록 수정</RouterLink>
      </form>

      <section class="surface-card evaluation-panel" style="grid-column: span 8">
        <div class="score-summary">
          <div>
            <p class="section-label">Diet Score</p>
            <strong>{{ feedback.score }}</strong>
            <span>100점 만점</span>
          </div>
          <p>{{ feedback.feedback }}</p>
        </div>

        <div class="calorie-progress">
          <div class="section-heading-row">
            <div>
              <p class="section-label">Calories</p>
              <h2>{{ feedback.totalCalories }} / {{ feedback.recommendedCalories }} kcal</h2>
            </div>
            <span class="chip">{{ calorieRate }}%</span>
          </div>
          <div class="meter large-meter">
            <i :style="{ width: `${calorieRate}%` }"></i>
          </div>
        </div>

        <div class="totals-panel recommendation-totals">
          <article>
            <span>탄수화물</span>
            <strong>{{ feedback.carbohydrate }}g</strong>
          </article>
          <article>
            <span>단백질</span>
            <strong>{{ feedback.protein }}g</strong>
          </article>
          <article>
            <span>지방</span>
            <strong>{{ feedback.fat }}g</strong>
          </article>
          <article>
            <span>평가 날짜</span>
            <strong>{{ targetDate }}</strong>
          </article>
        </div>

        <div class="feedback-list">
          <article v-for="check in feedback.checks" :key="check.label">
            <span class="chip">{{ check.status }}</span>
            <div>
              <strong>{{ check.label }}</strong>
              <p>{{ check.detail }}</p>
            </div>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
