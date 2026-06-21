<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import {
  createWorkoutLog,
  deleteWorkoutLog,
  getWorkoutLog,
  getWorkoutLogsPage,
  getWorkouts,
  updateWorkoutLog,
} from '@/api/workout'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const toastStore = useToastStore()
const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  workoutDate: today,
  exerciseId: route.query.exerciseId ? Number(route.query.exerciseId) : '',
  workoutTime: 30,
  setCount: 3,
  repetition: 10,
  weightKg: null,
  rpe: null,
  memo: '',
})

const editForm = reactive({
  id: null,
  workoutDate: today,
  exerciseId: '',
  routineId: null,
  workoutTime: 30,
  memo: '',
  sets: [],
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  count: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
})

const search = ref('')
const exercises = ref([])
const logs = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const isUpdating = ref(false)
const loadingLogId = ref(null)
const deletingId = ref(null)
const pendingDeleteId = ref(null)
const formMessage = ref('')
const errorMessage = ref('')

const selectedExercise = computed(() => exercises.value.find((exercise) => exercise.id === Number(form.exerciseId)))
const editingExercise = computed(() => exercises.value.find((exercise) => exercise.id === Number(editForm.exerciseId)))
const isEditing = computed(() => Boolean(editForm.id))
const logSummary = computed(() => ({
  count: pagination.count,
  totalTime: logs.value.reduce((sum, log) => sum + Number(log.workoutTime || 0), 0),
}))

const resultSummary = computed(() => {
  if (!pagination.count) return '0개'
  const start = (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(start + logs.value.length - 1, pagination.count)
  return `${pagination.count}개 중 ${start}-${end}`
})

function syncPagination(data) {
  pagination.page = data.page || 1
  pagination.pageSize = data.pageSize || pagination.pageSize
  pagination.count = data.count || 0
  pagination.totalPages = data.totalPages || 1
  pagination.hasNext = data.hasNext
  pagination.hasPrevious = data.hasPrevious
}

function normalizeSet(set, index) {
  return {
    id: set.id || `set-${Date.now()}-${index}`,
    setOrder: set.setOrder ?? index + 1,
    weightKg: set.weightKg ?? null,
    repetition: set.repetition ?? 10,
    durationSeconds: set.durationSeconds ?? null,
    rpe: set.rpe ?? null,
    isWarmup: Boolean(set.isWarmup),
  }
}

function toApiSet(set, index) {
  return {
    set_order: Number(set.setOrder || index + 1),
    weight_kg: set.weightKg === '' || set.weightKg === null ? null : Number(set.weightKg),
    repetition: set.repetition === '' || set.repetition === null ? null : Number(set.repetition),
    duration_seconds: set.durationSeconds === '' || set.durationSeconds === null ? null : Number(set.durationSeconds),
    rpe: set.rpe === '' || set.rpe === null ? null : Number(set.rpe),
    is_warmup: Boolean(set.isWarmup),
  }
}

function validateSets(sets) {
  if (!sets.length) return '세트를 1개 이상 입력해주세요.'

  const hasInvalidSet = sets.some((set) => {
    const hasRepetition = set.repetition !== '' && set.repetition !== null && Number(set.repetition) > 0
    const hasDuration = set.durationSeconds !== '' && set.durationSeconds !== null && Number(set.durationSeconds) > 0
    const invalidRpe = set.rpe !== '' && set.rpe !== null && (Number(set.rpe) < 1 || Number(set.rpe) > 10)
    return (!hasRepetition && !hasDuration) || invalidRpe
  })

  return hasInvalidSet ? '각 세트는 반복 수 또는 운동 시간(초)이 필요하고, RPE는 1부터 10 사이여야 합니다.' : ''
}

async function fetchExercises() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    exercises.value = await getWorkouts(search.value.trim() ? { search: search.value.trim(), page_size: 50 } : { page_size: 50 })
    if (route.query.exerciseId && exercises.value.some((exercise) => exercise.id === Number(route.query.exerciseId))) {
      form.exerciseId = Number(route.query.exerciseId)
    } else if (!form.exerciseId && exercises.value[0]) {
      form.exerciseId = exercises.value[0].id
    }
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

async function fetchLogs(page = pagination.page) {
  errorMessage.value = ''

  try {
    const data = await getWorkoutLogsPage({
      date: form.workoutDate,
      page,
      page_size: pagination.pageSize,
    })
    logs.value = data.results
    syncPagination(data)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  }
}

async function saveLog() {
  formMessage.value = ''
  pendingDeleteId.value = null

  if (!form.exerciseId) {
    formMessage.value = '기록할 운동을 선택해주세요.'
    return
  }

  if (form.workoutTime < 0 || form.setCount <= 0 || form.repetition <= 0) {
    formMessage.value = '운동 시간은 0 이상, 세트 수와 반복 수는 1 이상이어야 합니다.'
    return
  }

  if (form.rpe && (form.rpe < 1 || form.rpe > 10)) {
    formMessage.value = '운동 강도(RPE)는 1부터 10 사이로 입력해주세요.'
    return
  }

  isSaving.value = true

  try {
    await createWorkoutLog({
      workoutId: form.exerciseId,
      routineId: null,
      workoutDate: form.workoutDate,
      workoutTime: form.workoutTime,
      memo: form.memo,
      sets: Array.from({ length: Number(form.setCount) }, (_, index) => ({
        set_order: index + 1,
        weight_kg: form.weightKg === null || form.weightKg === '' ? null : Number(form.weightKg),
        repetition: Number(form.repetition),
        duration_seconds: null,
        rpe: form.rpe === null || form.rpe === '' ? null : Number(form.rpe),
        is_warmup: false,
      })),
    })
    form.memo = ''
    formMessage.value = '운동 기록이 저장되었습니다.'
    toastStore.success('운동 저장 완료', '운동 기록을 진행 현황에 반영했습니다.')
    await fetchLogs(1)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isSaving.value = false
  }
}

async function startEditLog(logId) {
  formMessage.value = ''
  loadingLogId.value = logId

  try {
    const log = await getWorkoutLog(logId)
    editForm.id = log.id
    editForm.workoutDate = log.workoutDate
    editForm.exerciseId = log.workoutId || log.exerciseId
    editForm.routineId = log.routineId || null
    editForm.workoutTime = log.workoutTime
    editForm.memo = log.memo || ''
    editForm.sets = (log.sets.length ? log.sets : Array.from({ length: log.setCount || 1 }, (_, index) => ({
      setOrder: index + 1,
      repetition: log.repetition || 10,
    }))).map(normalizeSet)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    loadingLogId.value = null
  }
}

function cancelEditLog() {
  editForm.id = null
  editForm.workoutDate = today
  editForm.exerciseId = ''
  editForm.routineId = null
  editForm.workoutTime = 30
  editForm.memo = ''
  editForm.sets = []
}

function addEditSet() {
  editForm.sets.push(normalizeSet({ setOrder: editForm.sets.length + 1, repetition: 10 }, editForm.sets.length))
}

function removeEditSet(index) {
  editForm.sets = editForm.sets
    .filter((_, setIndex) => setIndex !== index)
    .map((set, setIndex) => ({ ...set, setOrder: setIndex + 1 }))
}

async function submitEditLog() {
  formMessage.value = ''

  if (!editForm.id || !editForm.exerciseId) {
    formMessage.value = '수정할 운동 기록과 운동을 확인해주세요.'
    return
  }

  const setError = validateSets(editForm.sets)
  if (setError) {
    formMessage.value = setError
    return
  }

  isUpdating.value = true

  try {
    await updateWorkoutLog(editForm.id, {
      workoutId: editForm.exerciseId,
      routineId: editForm.routineId,
      workoutDate: editForm.workoutDate,
      workoutTime: editForm.workoutTime,
      memo: editForm.memo,
      sets: editForm.sets.map(toApiSet),
    })
    formMessage.value = '운동 기록을 수정했습니다.'
    cancelEditLog()
    await fetchLogs(pagination.page)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isUpdating.value = false
  }
}

async function removeLog(logId) {
  formMessage.value = ''

  if (pendingDeleteId.value !== logId) {
    pendingDeleteId.value = logId
    formMessage.value = '삭제하려면 같은 버튼을 한 번 더 눌러주세요.'
    return
  }

  deletingId.value = logId

  try {
    await deleteWorkoutLog(logId)
    if (editForm.id === logId) cancelEditLog()
    formMessage.value = '운동 기록을 삭제했습니다.'
    pendingDeleteId.value = null
    await fetchLogs(logs.value.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    deletingId.value = null
  }
}

function cancelDelete() {
  pendingDeleteId.value = null
  formMessage.value = ''
}

async function handleDateChange() {
  pendingDeleteId.value = null
  cancelEditLog()
  await fetchLogs(1)
}

onMounted(async () => {
  await fetchExercises()
  await fetchLogs(1)
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout"
      title="운동 기록"
      description="운동 기록을 저장하고, 저장된 로그의 세트 배열까지 수정합니다."
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
      <form class="form-card mobile-friendly-form" style="grid-column: span 5" @submit.prevent="saveLog">
        <div class="field-group">
          <label for="workout-date">운동 날짜</label>
          <input id="workout-date" v-model="form.workoutDate" type="date" @change="handleDateChange" />
        </div>

        <div class="field-group">
          <label for="exercise-search">운동 검색</label>
          <div class="inline-controls mobile-stack">
            <input id="exercise-search" v-model="search" type="text" placeholder="push up, squat" />
            <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="fetchExercises">검색</button>
          </div>
        </div>

        <div class="field-group">
          <label for="exercise">운동</label>
          <select id="exercise" v-model="form.exerciseId">
            <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">{{ exercise.name }}</option>
          </select>
        </div>

        <div class="content-grid compact-form-grid">
          <div class="field-group" style="grid-column: span 4">
            <label for="workout-time">시간(분)</label>
            <input id="workout-time" v-model.number="form.workoutTime" type="number" inputmode="numeric" min="0" />
          </div>
          <div class="field-group" style="grid-column: span 4">
            <label for="set-count">세트</label>
            <input id="set-count" v-model.number="form.setCount" type="number" inputmode="numeric" min="1" />
          </div>
          <div class="field-group" style="grid-column: span 4">
            <label for="repetition">반복</label>
            <input id="repetition" v-model.number="form.repetition" type="number" inputmode="numeric" min="1" />
          </div>
          <div class="field-group" style="grid-column: span 4">
            <label for="weight-kg">중량(kg)</label>
            <input id="weight-kg" v-model.number="form.weightKg" type="number" inputmode="decimal" min="0" step="0.5" placeholder="선택" />
          </div>
          <div class="field-group" style="grid-column: span 4">
            <label for="rpe">RPE</label>
            <input id="rpe" v-model.number="form.rpe" type="number" inputmode="decimal" min="1" max="10" step="0.5" placeholder="선택" />
          </div>
        </div>

        <div class="field-group">
          <label for="memo">메모</label>
          <textarea id="memo" v-model="form.memo" placeholder="운동 난이도, 컨디션, 자세 피드백을 남겨보세요." />
        </div>

        <div v-if="selectedExercise" class="nutrition-preview">
          <span>선택한 운동</span>
          <strong>{{ selectedExercise.name }}</strong>
          <p>{{ selectedExercise.bodyParts.join(', ') }} · {{ selectedExercise.equipments.join(', ') || '장비 없음' }}</p>
        </div>

        <div class="button-row form-actions">
          <button class="btn btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '저장 중...' : '운동 기록 저장' }}
          </button>
          <RouterLink class="btn btn-secondary" to="/workouts">운동 찾기</RouterLink>
        </div>
        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
        <div class="button-row">
          <RouterLink class="btn btn-secondary" to="/workout/progression">다음 운동 목표 추천</RouterLink>
          <RouterLink class="btn btn-secondary" to="/progress">진행 현황 보기</RouterLink>
          <RouterLink class="btn btn-secondary" to="/workout/routines">운동 루틴 관리</RouterLink>
        </div>
      </form>

      <section class="surface-card" style="grid-column: span 7">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Logs</p>
            <h2>{{ form.workoutDate }} 운동 기록</h2>
          </div>
          <span class="chip">{{ resultSummary }} · 현재 페이지 {{ logSummary.totalTime }}분</span>
        </div>

        <form v-if="isEditing" class="save-options-panel stacked-form" @submit.prevent="submitEditLog">
          <div class="section-heading-row">
            <div>
              <p class="section-label">기록 편집</p>
              <h2>운동 기록 상세 수정</h2>
            </div>
            <button class="btn btn-secondary" type="button" @click="cancelEditLog">닫기</button>
          </div>

          <div class="content-grid compact-form-grid">
            <div class="field-group" style="grid-column: span 6">
              <label for="edit-workout-date">운동 날짜</label>
              <input id="edit-workout-date" v-model="editForm.workoutDate" type="date" />
            </div>
            <div class="field-group" style="grid-column: span 6">
              <label for="edit-workout-time">시간(분)</label>
              <input id="edit-workout-time" v-model.number="editForm.workoutTime" type="number" min="0" />
            </div>
          </div>

          <div class="field-group">
            <label for="edit-exercise">운동</label>
            <select id="edit-exercise" v-model="editForm.exerciseId">
              <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">{{ exercise.name }}</option>
            </select>
            <span v-if="editingExercise" class="meta-text">{{ editingExercise.bodyParts.join(', ') }}</span>
          </div>

          <div class="field-group">
            <label for="edit-memo">메모</label>
            <textarea id="edit-memo" v-model="editForm.memo" />
          </div>

          <div class="section-heading-row">
            <div>
              <p class="section-label">세트</p>
              <h2>{{ editForm.sets.length }}세트</h2>
            </div>
            <button class="btn btn-secondary" type="button" @click="addEditSet">세트 추가</button>
          </div>

          <div class="routine-list">
            <article v-for="(set, index) in editForm.sets" :key="set.id" class="routine-item routine-item-manage">
              <span>{{ index + 1 }}</span>
              <div class="content-grid compact-form-grid">
                <div class="field-group" style="grid-column: span 3">
                  <label :for="`set-weight-${index}`">중량</label>
                  <input :id="`set-weight-${index}`" v-model.number="set.weightKg" type="number" min="0" step="0.5" placeholder="맨몸" />
                </div>
                <div class="field-group" style="grid-column: span 3">
                  <label :for="`set-reps-${index}`">반복</label>
                  <input :id="`set-reps-${index}`" v-model.number="set.repetition" type="number" min="1" placeholder="선택" />
                </div>
                <div class="field-group" style="grid-column: span 3">
                  <label :for="`set-duration-${index}`">시간(초)</label>
                  <input :id="`set-duration-${index}`" v-model.number="set.durationSeconds" type="number" min="1" placeholder="선택" />
                </div>
                <div class="field-group" style="grid-column: span 3">
                  <label :for="`set-rpe-${index}`">RPE</label>
                  <input :id="`set-rpe-${index}`" v-model.number="set.rpe" type="number" min="1" max="10" step="0.5" placeholder="선택" />
                </div>
                <label class="checkbox-row" style="grid-column: span 12">
                  <input v-model="set.isWarmup" type="checkbox" />
                  워밍업 세트
                </label>
              </div>
              <button class="btn btn-secondary" type="button" @click="removeEditSet(index)">삭제</button>
            </article>
          </div>

          <button class="btn btn-primary" type="submit" :disabled="isUpdating">
            {{ isUpdating ? '수정 중...' : '운동 기록 수정' }}
          </button>
        </form>

        <div class="meal-list">
          <article v-for="log in logs" :key="log.id" class="meal-item">
            <div>
              <strong>{{ log.exercise?.name || '운동' }}</strong>
              <span>{{ log.workoutTime }}분 · {{ log.setCount }}세트 · {{ log.repetition || '-' }}회</span>
              <span v-if="log.sets?.length">
                {{ log.sets.map((set) => `${set.setOrder}세트 ${set.weightKg ?? '맨몸'}kg ${set.repetition ?? '-'}회${set.rpe ? ` RPE ${set.rpe}` : ''}`).join(' · ') }}
              </span>
              <span v-if="log.memo">{{ log.memo }}</span>
            </div>
            <div class="delete-actions">
              <strong>{{ log.workoutDate }}</strong>
              <button type="button" :disabled="loadingLogId === log.id" @click="startEditLog(log.id)">
                {{ loadingLogId === log.id ? '조회 중...' : '상세 수정' }}
              </button>
              <button
                type="button"
                :class="{ 'is-danger': pendingDeleteId === log.id }"
                :disabled="deletingId === log.id"
                @click="removeLog(log.id)"
              >
                {{ deletingId === log.id ? '삭제 중...' : pendingDeleteId === log.id ? '확인 삭제' : '삭제' }}
              </button>
              <button v-if="pendingDeleteId === log.id" type="button" @click="cancelDelete">취소</button>
            </div>
          </article>

          <div v-if="pagination.totalPages > 1" class="pagination-panel">
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasPrevious" @click="fetchLogs(pagination.page - 1)">
              이전
            </button>
            <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasNext" @click="fetchLogs(pagination.page + 1)">
              다음
            </button>
          </div>

          <StateBlock
            v-if="logs.length === 0"
            type="empty"
            title="저장된 운동 기록이 없습니다"
            message="왼쪽에서 오늘 수행한 운동을 기록해보세요."
          >
            <a class="btn btn-primary" href="#exercise">운동 기록하기</a>
            <RouterLink class="btn btn-secondary" to="/workouts">운동 찾기</RouterLink>
          </StateBlock>
        </div>
      </section>
    </section>
  </main>
</template>
