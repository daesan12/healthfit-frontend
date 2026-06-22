<script setup>
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { createWorkoutLog, getWorkouts, recommendWorkoutProgression } from '@/api/workout'

const exercises = ref([])
const result = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const errorMessage = ref('')
const saveMessage = ref('')

const form = reactive({
  workoutId: '',
  targetDate: new Date().toISOString().slice(0, 10),
  goal: '',
  message: '다음 운동 목표를 추천해줘',
})

async function fetchExercises() {
  try {
    exercises.value = await getWorkouts({ page_size: 100 })
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  }
}

async function requestProgression() {
  errorMessage.value = ''
  saveMessage.value = ''
  result.value = null

  if (!form.workoutId) {
    errorMessage.value = '운동을 선택해주세요.'
    return
  }

  isLoading.value = true

  try {
    result.value = await recommendWorkoutProgression({
      workoutId: Number(form.workoutId),
      targetDate: form.targetDate,
      goal: form.goal || undefined,
      message: form.message,
    })
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

async function saveProgressionLog() {
  saveMessage.value = ''

  if (!result.value?.recommendation || !form.workoutId) {
    saveMessage.value = '먼저 AI 진행 추천을 받아주세요.'
    return
  }

  const recommendation = result.value.recommendation
  const setCount = Number(recommendation.set_count || 1)
  const repetition = Number(recommendation.repetition || 1)

  isSaving.value = true

  try {
    await createWorkoutLog({
      workoutId: Number(form.workoutId),
      routineId: null,
      workoutDate: result.value.target_date || form.targetDate,
      workoutTime: 30,
      memo: `AI 진행 추천 저장\n${result.value.reason || ''}\n${result.value.safety_note || ''}`.trim(),
      sets: Array.from({ length: setCount }, (_, index) => ({
        set_order: index + 1,
        weight_kg:
          recommendation.weight_kg === null || recommendation.weight_kg === undefined
            ? null
            : Number(recommendation.weight_kg),
        repetition,
        duration_seconds: null,
        rpe: null,
        is_warmup: false,
      })),
    })
    saveMessage.value = 'AI 진행 추천을 운동 기록으로 저장했습니다.'
  } catch (error) {
    saveMessage.value = normalizeCaughtError(error).message
  } finally {
    isSaving.value = false
  }
}

onMounted(fetchExercises)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout Progression"
      title="다음 운동 목표 추천"
      description="최근 세트 기록과 회복 상태를 기준으로 다음 세트·반복·중량을 추천합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4; align-self: start" @submit.prevent="requestProgression">
        <div class="field-group">
          <label for="progression-exercise">운동</label>
          <select id="progression-exercise" v-model="form.workoutId">
            <option value="">선택</option>
            <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">
              {{ exercise.name }}
            </option>
          </select>
        </div>
        <div class="field-group">
          <label for="progression-date">목표 날짜</label>
          <input id="progression-date" v-model="form.targetDate" type="date" />
        </div>
        <div class="field-group">
          <label for="progression-goal">목표</label>
          <input id="progression-goal" v-model="form.goal" type="text" placeholder="예: muscle_gain" />
        </div>
        <div class="field-group">
          <label for="progression-message">메시지</label>
          <textarea id="progression-message" v-model="form.message" />
        </div>
        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '추천 중...' : '진행 추천 받기' }}
        </button>
      </form>

      <section class="surface-card" style="grid-column: span 8">
        <StateBlock v-if="isLoading" type="loading" title="진행 추천 중" message="운동 기록과 회복 상태를 분석합니다." />
        <StateBlock v-else-if="errorMessage" type="error" title="추천 실패" :message="errorMessage" />

        <template v-else-if="result">
          <div class="section-heading-row">
            <div>
              <p class="section-label">{{ result.decision }}</p>
              <h2>{{ result.workout_name }}</h2>
            </div>
            <div class="button-row">
              <span class="chip">{{ result.target_date }}</span>
              <button class="btn btn-secondary" type="button" :disabled="isSaving" @click="saveProgressionLog">
                {{ isSaving ? '저장 중...' : '운동 기록으로 저장' }}
              </button>
            </div>
          </div>

          <p v-if="saveMessage" class="form-message">{{ saveMessage }}</p>

          <div class="totals-panel recommendation-totals">
            <article>
              <span>세트</span>
              <strong>{{ result.recommendation?.set_count }}</strong>
            </article>
            <article>
              <span>반복</span>
              <strong>{{ result.recommendation?.repetition }}</strong>
            </article>
            <article>
              <span>중량</span>
              <strong>{{ result.recommendation?.weight_kg ?? '-' }} kg</strong>
            </article>
            <article>
              <span>휴식</span>
              <strong>{{ result.recommendation?.rest_seconds }}초</strong>
            </article>
          </div>

          <p class="card-description">{{ result.reason }}</p>
          <aside class="caution-box">
            <p class="section-label">Safety</p>
            <p>{{ result.safety_note }}</p>
          </aside>
        </template>

        <StateBlock
          v-else
          type="empty"
          title="운동을 선택해보세요"
          message="운동 기록이 있으면 더 정확한 진행 추천을 받을 수 있습니다."
        />
      </section>
    </section>
  </main>
</template>
