<script setup>
import { ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { recommendWorkout, saveWorkoutRecommendation } from '@/api/workout'

const availableTime = ref(40)
const weeklyFrequency = ref(3)
const targetBodyPart = ref('')
const preference = ref('초보자용, 무릎 부담이 적은 운동')
const recommendation = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const saveMessage = ref('')
const requestMessage = ref('')

function mapRecommendation(data) {
  return {
    id: data.recommendation_id || data.id,
    title: data.title || 'AI 추천 운동 루틴',
    reason: data.description || data.reason || '',
    items: (data.items || []).map((item, index) => ({
      order: item.order || index + 1,
      name: item.exercise_name || item.name,
      sets: item.sets,
      reps: item.reps,
      weight: item.weight,
      restSeconds: item.rest_seconds,
    })),
    cautions: data.cautions || data.safety_notes || [],
  }
}

async function requestRecommendation() {
  requestMessage.value = ''
  saveMessage.value = ''
  isLoading.value = true

  try {
    const data = await recommendWorkout({
      message: preference.value,
      preference: preference.value,
      available_time: availableTime.value,
      weekly_frequency: weeklyFrequency.value,
      target_body_part: targetBodyPart.value || undefined,
      exercise_source: 'all',
    })
    recommendation.value = mapRecommendation(data)
  } catch (error) {
    requestMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

async function saveRoutine() {
  if (!recommendation.value?.id) {
    saveMessage.value = '먼저 AI 추천을 생성해주세요.'
    return
  }

  isSaving.value = true
  saveMessage.value = ''

  try {
    await saveWorkoutRecommendation(recommendation.value.id, {
      name: recommendation.value.title,
      description: recommendation.value.reason,
    })
    saveMessage.value = '추천 운동 루틴을 저장했습니다.'
  } catch (error) {
    saveMessage.value = normalizeCaughtError(error).message
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout AI"
      title="AI 운동 추천"
      description="운동 경험, 목표, 가능한 시간을 기준으로 루틴을 추천받습니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4; align-self: start" @submit.prevent="requestRecommendation">
        <div class="field-group">
          <label for="available-time">운동 가능 시간(분)</label>
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
          <label for="target-body-part">목표 부위</label>
          <input id="target-body-part" v-model="targetBodyPart" type="text" placeholder="예: chest, legs" />
        </div>

        <div class="field-group">
          <label for="workout-preference">선호 조건</label>
          <textarea id="workout-preference" v-model="preference" />
        </div>

        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '추천 생성 중...' : 'AI 루틴 받기' }}
        </button>

      </form>

      <section class="surface-card routine-panel" style="grid-column: span 8">
        <StateBlock
          v-if="requestMessage"
          type="error"
          title="추천을 불러오지 못했습니다"
          message="조건을 조금 바꾸거나 잠시 후 다시 검색해보세요."
        >
          <p class="meta-text">{{ requestMessage }}</p>
          <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="requestRecommendation">
            다시 추천 받기
          </button>
        </StateBlock>

        <StateBlock
          v-else-if="isLoading && !recommendation"
          type="loading"
          title="운동 루틴 생성 중"
          message="AI가 조건에 맞는 운동 루틴을 구성하고 있습니다."
        />

        <template v-else-if="recommendation">
          <div class="section-heading-row">
            <div>
              <p class="section-label">Routine</p>
              <h2>{{ recommendation.title }}</h2>
            </div>
            <button class="btn btn-secondary" type="button" :disabled="isSaving" @click="saveRoutine">
              {{ isSaving ? '저장 중...' : '루틴 저장' }}
            </button>
          </div>

          <p v-if="saveMessage" class="form-message">{{ saveMessage }}</p>
          <div v-if="saveMessage" class="button-row">
            <RouterLink class="btn btn-secondary" to="/workout/routines">저장 루틴 보기</RouterLink>
            <RouterLink class="btn btn-secondary" to="/workout/logs">운동 기록으로 이동</RouterLink>
            <RouterLink class="btn btn-secondary" to="/community">커뮤니티에 공유</RouterLink>
          </div>
          <p class="card-description">{{ recommendation.reason }}</p>

          <div class="routine-list">
            <article v-for="item in recommendation.items" :key="item.order" class="routine-item">
              <span>{{ item.order }}</span>
              <div>
                <strong>{{ item.name }}</strong>
                <p>
                  {{ item.sets }}세트 · {{ item.reps }}회
                  <template v-if="item.weight"> · {{ item.weight }}kg</template>
                  <template v-if="item.restSeconds"> · 휴식 {{ item.restSeconds }}초</template>
                </p>
              </div>
            </article>
          </div>

          <aside v-if="recommendation.cautions.length" class="caution-box">
            <p class="section-label">주의사항</p>
            <ul>
              <li v-for="caution in recommendation.cautions" :key="caution">{{ caution }}</li>
            </ul>
          </aside>
        </template>

        <StateBlock
          v-else
          type="empty"
          title="AI 루틴을 생성해보세요"
          message="왼쪽 조건을 입력하고 추천을 요청하면 결과가 표시됩니다."
        />
      </section>
    </section>
  </main>
</template>
