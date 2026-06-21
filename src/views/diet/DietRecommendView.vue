<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { mockDietRecommendation } from '@/data/mockData'
import { useSavedItemsStore } from '@/stores/savedItems'

const targetDate = ref(new Date().toISOString().slice(0, 10))
const mealCount = ref(4)
const preference = ref('고단백, 조리 간단한 식단')
const recommendation = ref(mockDietRecommendation)
const savedItemsStore = useSavedItemsStore()
const saveMessage = ref('')
const requestMessage = ref('')

function requestRecommendation() {
  requestMessage.value = 'AI 백엔드 연동 전까지는 예시 추천 식단을 표시합니다.'
}

function saveRecommendation() {
  savedItemsStore.saveMeal(recommendation.value)
  saveMessage.value = '추천 식단을 임시 저장했습니다. 저장 식단 API 연동 후 실제 저장으로 전환합니다.'
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet AI"
      title="AI 식단 추천"
      description="프로필과 권장 칼로리를 기준으로 하루 식단을 추천받는 화면입니다."
    />

    <div class="ai-status-banner">
      <span class="status-badge">AI 준비 중</span>
      <p>현재는 예시 식단을 보여줍니다. 백엔드 구현 후 `/api/v1/ai/diet/recommendations/`와 연결합니다.</p>
    </div>

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4" @submit.prevent="requestRecommendation">
        <div class="field-group">
          <label for="target-date">추천 기준 날짜</label>
          <input id="target-date" v-model="targetDate" type="date" />
        </div>

        <div class="field-group">
          <label for="meal-count">식사 구성</label>
          <select id="meal-count" v-model.number="mealCount">
            <option :value="3">아침, 점심, 저녁</option>
            <option :value="4">아침, 점심, 저녁, 간식</option>
          </select>
        </div>

        <div class="field-group">
          <label for="preference">선호 조건</label>
          <textarea id="preference" v-model="preference" />
        </div>

        <button class="btn btn-primary" type="submit">예시 추천 보기</button>
        <p v-if="requestMessage" class="form-message">{{ requestMessage }}</p>
      </form>

      <section class="surface-card recommendation-panel" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Recommendation</p>
            <h2>{{ recommendation.title }}</h2>
          </div>
          <button class="btn btn-secondary" type="button" @click="saveRecommendation">
            추천 식단 임시 저장
          </button>
        </div>

        <p v-if="saveMessage" class="form-message">{{ saveMessage }}</p>
        <p class="card-description">{{ recommendation.reason }}</p>

        <div class="totals-panel recommendation-totals">
          <article>
            <span>총 칼로리</span>
            <strong>{{ recommendation.totalCalories }} kcal</strong>
          </article>
          <article>
            <span>탄수화물</span>
            <strong>{{ recommendation.totalCarbohydrate }}g</strong>
          </article>
          <article>
            <span>단백질</span>
            <strong>{{ recommendation.totalProtein }}g</strong>
          </article>
          <article>
            <span>지방</span>
            <strong>{{ recommendation.totalFat }}g</strong>
          </article>
        </div>

        <div class="recommendation-meals">
          <article v-for="meal in recommendation.meals" :key="meal.mealType" class="meal-plan-card">
            <h3>{{ meal.mealType }}</h3>
            <ul>
              <li v-for="food in meal.foods" :key="`${meal.mealType}-${food.name}`">
                <span>{{ food.name }} {{ food.amount }}g</span>
                <strong>{{ food.calories }} kcal</strong>
              </li>
            </ul>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
