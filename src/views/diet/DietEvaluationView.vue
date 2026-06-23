<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { evaluateDiet, getDietFeedbacks } from '@/api/diet'

const targetDate = ref(new Date().toISOString().slice(0, 10))
const feedback = ref(null)
const feedbackHistory = ref([])
const isLoading = ref(false)
const isHistoryLoading = ref(false)
const requestMessage = ref('')

const calorieRate = computed(() => {
  const total = Number(feedback.value?.totalCalories || 0)
  const recommended = Number(feedback.value?.recommendedCalories || 0)
  if (!recommended) return 0
  return Math.min(Math.round((total / recommended) * 100), 100)
})

const scoreDetails = computed(() => [
  { label: '칼로리', value: feedback.value?.calorieScore },
  { label: '탄단지', value: feedback.value?.macroScore },
  { label: '기록 충실도', value: feedback.value?.mealRecordScore },
].filter((item) => item.value !== null && item.value !== undefined))

function formatNumber(value, digits = 1) {
  if (value === null || value === undefined || value === '') return '-'
  return Number(value || 0).toFixed(digits)
}

async function loadFeedbackHistory() {
  requestMessage.value = ''
  isHistoryLoading.value = true

  try {
    feedbackHistory.value = await getDietFeedbacks({ date: targetDate.value })
    feedback.value = feedbackHistory.value[0] || null
  } catch (error) {
    requestMessage.value = normalizeCaughtError(error).message
  } finally {
    isHistoryLoading.value = false
  }
}

async function requestEvaluation() {
  requestMessage.value = ''
  isLoading.value = true

  try {
    feedback.value = await evaluateDiet({ target_date: targetDate.value })
    await loadFeedbackHistory()
  } catch (error) {
    requestMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

onMounted(loadFeedbackHistory)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet AI"
      title="오늘의 식단 평가"
      description="선택한 날짜의 식단 기록을 기준으로 점수, 근거, 권장 섭취량 대비 현재 섭취량을 확인합니다."
    />

    <section class="content-grid diet-evaluation-grid">
      <form class="form-card evaluation-control-card" @submit.prevent="requestEvaluation">
        <div class="field-group">
          <label for="evaluation-date">평가 날짜</label>
          <input id="evaluation-date" v-model="targetDate" type="date" @change="loadFeedbackHistory" />
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

        <!-- <section class="preview-panel">
          <p class="section-label">평가 기록</p>
          <strong>{{ feedbackHistory.length }}개</strong>
          <span v-if="feedbackHistory[0]">최근 평가 {{ feedbackHistory[0].score }}점 · {{ feedbackHistory[0].createdAt?.slice(0, 10) }}</span>
          <span v-else>{{ isHistoryLoading ? '조회 중...' : '선택 날짜에 저장된 평가가 없습니다.' }}</span>
        </section> -->
      </form>

      <section class="surface-card evaluation-panel">
        <StateBlock
          v-if="(isLoading || isHistoryLoading) && !feedback"
          type="loading"
          title="식단 평가 조회 중"
          message="선택한 날짜의 식단 평가와 기존 기록을 불러오고 있습니다."
        />

        <template v-else-if="feedback">
          <div class="section-heading-row">
            <div>
              <p class="section-label">Auto Saved</p>
              <h2>AI 평가 기록에 저장됨</h2>
            </div>
            <!-- <RouterLink class="btn btn-secondary" to="/diet/evaluation">평가 기록 보기</RouterLink> -->
          </div>

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
                <h2>{{ formatNumber(feedback.totalCalories, 0) }} / {{ formatNumber(feedback.recommendedCalories, 0) }} kcal</h2>
              </div>
              <span class="chip">{{ calorieRate }}%</span>
            </div>
            <div class="meter large-meter">
              <i :style="{ width: `${calorieRate}%` }"></i>
            </div>
          </div>

          <div class="totals-panel recommendation-totals">
            <article>
              <span>섭취 탄수화물</span>
              <strong>{{ formatNumber(feedback.carbohydrate) }}g</strong>
            </article>
            <article>
              <span>섭취 단백질</span>
              <strong>{{ formatNumber(feedback.protein) }}g</strong>
            </article>
            <article>
              <span>섭취 지방</span>
              <strong>{{ formatNumber(feedback.fat) }}g</strong>
            </article>
            <article>
              <span>평가 날짜</span>
              <strong>{{ feedback.date || targetDate }}</strong>
            </article>
          </div>

          <div class="totals-panel recommendation-totals">
            <article>
              <span>권장 탄수화물</span>
              <strong>{{ formatNumber(feedback.recommendedCarbohydrate) }}g</strong>
            </article>
            <article>
              <span>권장 단백질</span>
              <strong>{{ formatNumber(feedback.recommendedProtein) }}g</strong>
            </article>
            <article>
              <span>권장 지방</span>
              <strong>{{ formatNumber(feedback.recommendedFat) }}g</strong>
            </article>
            <article>
              <span>권장 칼로리</span>
              <strong>{{ formatNumber(feedback.recommendedCalories, 0) }} kcal</strong>
            </article>
          </div>

          <div v-if="scoreDetails.length" class="feedback-list">
            <article v-for="detail in scoreDetails" :key="detail.label">
              <span class="chip">{{ detail.value }}점</span>
              <div>
                <strong>{{ detail.label }} 점수</strong>
                <p>백엔드가 계산한 세부 점수입니다.</p>
              </div>
            </article>
          </div>

          <div v-if="feedback.reasons.length" class="feedback-list">
            <article v-for="reason in feedback.reasons" :key="reason">
              <span class="chip">근거</span>
              <div>
                <strong>점수 산정 근거</strong>
                <p>{{ reason }}</p>
              </div>
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
