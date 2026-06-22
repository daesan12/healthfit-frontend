<script setup>
import { computed, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { evaluateDiet } from '@/api/diet'

const targetDate = ref(new Date().toISOString().slice(0, 10))
const feedback = ref(null)
const isLoading = ref(false)
const requestMessage = ref('')

const calorieRate = computed(() => {
  const total = Number(feedback.value?.totalCalories || 0)
  const recommended = Number(feedback.value?.recommendedCalories || 0)
  if (!recommended) return 0
  return Math.min(Math.round((total / recommended) * 100), 100)
})

async function requestEvaluation() {
  requestMessage.value = ''
  isLoading.value = true

  try {
    feedback.value = await evaluateDiet({ target_date: targetDate.value })
  } catch (error) {
    requestMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet AI"
      title="오늘의 식단 평가"
      description="기록한 식단을 권장 칼로리와 영양 기준으로 분석합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4" @submit.prevent="requestEvaluation">
        <div class="field-group">
          <label for="evaluation-date">평가 날짜</label>
          <input id="evaluation-date" v-model="targetDate" type="date" />
        </div>

        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '평가 중...' : 'AI 평가 받기' }}
        </button>
        <RouterLink class="btn btn-secondary" to="/diet/records">식단 기록 수정</RouterLink>

        <StateBlock
          v-if="requestMessage"
          type="error"
          title="평가를 불러오지 못했습니다"
          :message="requestMessage"
        />
      </form>

      <section class="surface-card evaluation-panel" style="grid-column: span 8">
        <StateBlock
          v-if="isLoading && !feedback"
          type="loading"
          title="식단 평가 중"
          message="AI가 해당 날짜의 식단 기록을 분석하고 있습니다."
        />

        <template v-else-if="feedback">
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
            <article v-for="check in feedback.checks" :key="`${check.label}-${check.detail}`">
              <span class="chip">{{ check.status }}</span>
              <div>
                <strong>{{ check.label }}</strong>
                <p>{{ check.detail }}</p>
              </div>
            </article>
          </div>
        </template>

        <StateBlock
          v-else
          type="empty"
          title="식단 평가를 요청해보세요"
          message="선택한 날짜에 식단 기록이 있어야 평가할 수 있습니다."
        />
      </section>
    </section>
  </main>
</template>
