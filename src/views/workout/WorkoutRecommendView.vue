<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { mockWorkoutRecommendation } from '@/data/mockData'
import { useSavedItemsStore } from '@/stores/savedItems'

const availableTime = ref(mockWorkoutRecommendation.availableTime)
const weeklyFrequency = ref(mockWorkoutRecommendation.weeklyFrequency)
const preference = ref('초보자용, 무릎 부담 적은 운동')
const recommendation = ref(mockWorkoutRecommendation)
const savedItemsStore = useSavedItemsStore()
const saveMessage = ref('')

function saveRoutine() {
  savedItemsStore.saveRoutine(recommendation.value)
  saveMessage.value = '운동 루틴을 임시 저장했습니다. 백엔드 연결 후 workout-routines API로 저장합니다.'
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout AI"
      title="AI 운동 추천"
      description="운동 경험, 목표, 가능 시간을 기준으로 루틴을 추천받습니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4">
        <div class="field-group">
          <label for="available-time">운동 가능 시간</label>
          <input id="available-time" v-model.number="availableTime" type="number" min="10" />
        </div>

        <div class="field-group">
          <label for="weekly-frequency">주간 운동 빈도</label>
          <select id="weekly-frequency" v-model.number="weeklyFrequency">
            <option :value="2">주 2회</option>
            <option :value="3">주 3회</option>
            <option :value="4">주 4회</option>
            <option :value="5">주 5회</option>
          </select>
        </div>

        <div class="field-group">
          <label for="workout-preference">선호 조건</label>
          <textarea id="workout-preference" v-model="preference" />
        </div>

        <button class="btn btn-primary" type="button">운동 추천 요청</button>
      </form>

      <section class="surface-card routine-panel" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Routine</p>
            <h2>{{ recommendation.title }}</h2>
          </div>
          <button class="btn btn-secondary" type="button" @click="saveRoutine">루틴 저장</button>
        </div>

        <p v-if="saveMessage" class="form-message">{{ saveMessage }}</p>

        <p class="card-description">{{ recommendation.reason }}</p>

        <div class="routine-list">
          <article v-for="item in recommendation.items" :key="item.order" class="routine-item">
            <span>{{ item.order }}</span>
            <div>
              <strong>{{ item.name }}</strong>
              <p>{{ item.sets }}세트 · {{ item.reps }}회 · {{ item.minutes }}분</p>
            </div>
          </article>
        </div>

        <aside class="caution-box">
          <p class="section-label">주의사항</p>
          <ul>
            <li v-for="caution in recommendation.cautions" :key="caution">{{ caution }}</li>
          </ul>
        </aside>
      </section>
    </section>
  </main>
</template>
