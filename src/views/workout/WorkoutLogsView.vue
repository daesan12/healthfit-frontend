<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { createWorkoutLog, deleteWorkoutLog, getWorkoutLogs, getWorkouts } from '@/api/workout'

const route = useRoute()
const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  workoutDate: today,
  exerciseId: route.query.exerciseId ? Number(route.query.exerciseId) : '',
  workoutTime: 30,
  setCount: 3,
  repetition: 10,
  memo: '',
})

const search = ref('')
const exercises = ref([])
const logs = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const deletingId = ref(null)
const formMessage = ref('')
const errorMessage = ref('')

const selectedExercise = computed(() => exercises.value.find((exercise) => exercise.id === Number(form.exerciseId)))

const logSummary = computed(() => {
  const totalTime = logs.value.reduce((sum, log) => sum + Number(log.workoutTime || 0), 0)
  return {
    count: logs.value.length,
    totalTime,
  }
})

async function fetchExercises() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    exercises.value = await getWorkouts(search.value.trim() ? { search: search.value.trim() } : {})

    if (route.query.exerciseId && exercises.value.some((exercise) => exercise.id === Number(route.query.exerciseId))) {
      form.exerciseId = Number(route.query.exerciseId)
    } else if (!form.exerciseId && exercises.value[0]) {
      form.exerciseId = exercises.value[0].id
    }
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

async function fetchLogs() {
  try {
    logs.value = await getWorkoutLogs({ date: form.workoutDate })
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
  }
}

async function saveLog() {
  formMessage.value = ''

  if (!form.exerciseId) {
    formMessage.value = '기록할 운동을 선택해주세요.'
    return
  }

  if (form.workoutTime < 0 || form.setCount < 0 || form.repetition < 0) {
    formMessage.value = '운동 시간, 세트 수, 반복 수는 0 이상이어야 합니다.'
    return
  }

  isSaving.value = true

  try {
    await createWorkoutLog({ ...form })
    form.memo = ''
    formMessage.value = '운동 기록이 저장되었습니다.'
    await fetchLogs()
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    isSaving.value = false
  }
}

async function removeLog(logId) {
  deletingId.value = logId
  formMessage.value = ''

  try {
    await deleteWorkoutLog(logId)
    logs.value = logs.value.filter((log) => log.id !== logId)
    formMessage.value = '운동 기록이 삭제되었습니다.'
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    deletingId.value = null
  }
}

async function handleDateChange() {
  await fetchLogs()
}

onMounted(async () => {
  await fetchExercises()
  await fetchLogs()
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout"
      title="운동 기록"
      description="수행한 운동 시간, 세트 수, 반복 수를 저장해 진행 현황에 반영합니다."
    />

    <StateBlock
      v-if="isLoading && exercises.length === 0"
      type="loading"
      title="운동 목록을 불러오는 중입니다"
      message="기록에 사용할 운동 데이터를 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="운동 기록 데이터를 불러오지 못했습니다"
      :message="errorMessage"
    />

    <section v-else class="content-grid">
      <form class="form-card" style="grid-column: span 5" @submit.prevent="saveLog">
        <div class="field-group">
          <label for="workout-date">운동 날짜</label>
          <input id="workout-date" v-model="form.workoutDate" type="date" @change="handleDateChange" />
        </div>

        <div class="field-group">
          <label for="exercise-search">운동 검색</label>
          <div class="button-row">
            <input id="exercise-search" v-model="search" type="text" placeholder="push up, squat" />
            <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="fetchExercises">검색</button>
          </div>
        </div>

        <div class="field-group">
          <label for="exercise">운동</label>
          <select id="exercise" v-model="form.exerciseId">
            <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">
              {{ exercise.name }}
            </option>
          </select>
        </div>

        <div class="content-grid">
          <div class="field-group" style="grid-column: span 4">
            <label for="workout-time">시간(분)</label>
            <input id="workout-time" v-model.number="form.workoutTime" type="number" min="0" />
          </div>
          <div class="field-group" style="grid-column: span 4">
            <label for="set-count">세트</label>
            <input id="set-count" v-model.number="form.setCount" type="number" min="0" />
          </div>
          <div class="field-group" style="grid-column: span 4">
            <label for="repetition">반복</label>
            <input id="repetition" v-model.number="form.repetition" type="number" min="0" />
          </div>
        </div>

        <div class="field-group">
          <label for="memo">메모</label>
          <textarea id="memo" v-model="form.memo" placeholder="운동 난이도, 컨디션, 자세 느낌을 남겨보세요." />
        </div>

        <div v-if="selectedExercise" class="nutrition-preview">
          <span>선택한 운동</span>
          <strong>{{ selectedExercise.name }}</strong>
          <p>{{ selectedExercise.bodyParts.join(', ') }} · {{ selectedExercise.equipments.join(', ') || '장비 없음' }}</p>
        </div>

        <div class="button-row">
          <button class="btn btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '저장 중...' : '운동 기록 저장' }}
          </button>
          <RouterLink class="btn btn-secondary" to="/workouts">운동 찾기</RouterLink>
        </div>
        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
      </form>

      <section class="surface-card" style="grid-column: span 7">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Logs</p>
            <h2>{{ form.workoutDate }} 운동 기록</h2>
          </div>
          <span class="chip">{{ logSummary.count }}개 · {{ logSummary.totalTime }}분</span>
        </div>

        <div class="meal-list">
          <article v-for="log in logs" :key="log.id" class="meal-item">
            <div>
              <strong>{{ log.exercise?.name || '운동' }}</strong>
              <span>{{ log.workoutTime }}분 · {{ log.setCount }}세트 · {{ log.repetition }}회</span>
              <span v-if="log.memo">{{ log.memo }}</span>
            </div>
            <div>
              <strong>{{ log.workoutDate }}</strong>
              <button type="button" :disabled="deletingId === log.id" @click="removeLog(log.id)">
                {{ deletingId === log.id ? '삭제 중...' : '삭제' }}
              </button>
            </div>
          </article>

          <StateBlock
            v-if="logs.length === 0"
            type="empty"
            title="저장된 운동 기록이 없습니다"
            message="왼쪽 폼에서 오늘 수행한 운동을 기록해보세요."
          />
        </div>
      </section>
    </section>
  </main>
</template>
