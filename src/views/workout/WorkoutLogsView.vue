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
  getWorkoutRoutinesPage,
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

const routines = ref([])
const selectedRoutineId = ref('')
const routineEntries = ref([])
const isLoadingRoutines = ref(false)
const isSavingRoutines = ref(false)
const routineMessage = ref('')

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

function unwrapApiData(response) {
  if (response?.data?.success === true && response.data.data !== undefined) return response.data.data
  if (response?.success === true && response.data !== undefined) return response.data
  if (response?.data?.results || Array.isArray(response?.data)) return response.data
  return response
}

function unwrapPageData(response) {
  const data = unwrapApiData(response)

  if (Array.isArray(data)) {
    return {
      count: data.length,
      page: 1,
      page_size: data.length || pagination.pageSize,
      total_pages: 1,
      has_next: false,
      has_previous: false,
      results: data,
    }
  }

  return {
    count: data?.count ?? 0,
    page: data?.page ?? 1,
    page_size: data?.pageSize ?? data?.page_size ?? pagination.pageSize,
    total_pages: data?.totalPages ?? data?.total_pages ?? 1,
    has_next: data?.hasNext ?? data?.has_next ?? false,
    has_previous: data?.hasPrevious ?? data?.has_previous ?? false,
    results: Array.isArray(data?.results) ? data.results : [],
  }
}

function unwrapListData(response) {
  const data = unwrapApiData(response)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

function syncPagination(data) {
  pagination.page = data?.page ?? 1
  pagination.pageSize = data?.pageSize ?? data?.page_size ?? pagination.pageSize
  pagination.count = data?.count ?? 0
  pagination.totalPages = data?.totalPages ?? data?.total_pages ?? 1
  pagination.hasNext = data?.hasNext ?? data?.has_next ?? false
  pagination.hasPrevious = data?.hasPrevious ?? data?.has_previous ?? false
}

function getExerciseBodyParts(exercise) {
  return exercise?.bodyParts ?? exercise?.body_parts ?? []
}

function getExerciseEquipments(exercise) {
  return exercise?.equipments ?? []
}

function getLogWorkoutTime(log) {
  return log?.workoutTime ?? log?.workout_time ?? 0
}

function getLogSetCount(log) {
  return log?.setCount ?? log?.set_count ?? log?.sets?.length ?? 0
}

function getLogRepetition(log) {
  return log?.repetition ?? '-'
}

function getLogWorkoutDate(log) {
  return log?.workoutDate ?? log?.workout_date ?? ''
}

function getSetOrder(set, index) {
  return set?.setOrder ?? set?.set_order ?? index + 1
}

function getSetWeightKg(set) {
  return set?.weightKg ?? set?.weight_kg ?? null
}

function getSetRpe(set) {
  return set?.rpe ?? null
}

function normalizeSet(set, index) {
  return {
    id: set.id || `set-${Date.now()}-${index}`,
    setOrder: set.setOrder ?? set.set_order ?? index + 1,
    weightKg: set.weightKg ?? set.weight_kg ?? null,
    repetition: set.repetition ?? 10,
    durationSeconds: set.durationSeconds ?? set.duration_seconds ?? null,
    rpe: set.rpe ?? null,
    isWarmup: Boolean(set.isWarmup ?? set.is_warmup),
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

function extractExerciseId(routineItem) {
  const fromObject = routineItem?.exercise?.id
  if (fromObject !== undefined && fromObject !== null) return Number(fromObject)
  const directId = routineItem?.exerciseId ?? routineItem?.exercise_id
  if (directId !== undefined && directId !== null) return Number(directId)
  const workoutId = routineItem?.workoutId ?? routineItem?.workout_id
  if (workoutId !== undefined && workoutId !== null) return Number(workoutId)
  return null
}

function extractExerciseName(routineItem) {
  return (
    routineItem?.exercise?.name ||
    routineItem?.exerciseName ||
    routineItem?.exercise_name ||
    routineItem?.name ||
    ''
  )
}

function buildEntrySetsFromRoutineItem(routineItem) {
  const setCount = Math.max(1, Number(routineItem.sets) || 1)
  const repetition = Number(routineItem.reps) || 0
  const weightKg = Number(routineItem.weight) || 0
  const restSeconds = Number(routineItem.restSeconds ?? routineItem.rest_seconds) || null

  return Array.from({ length: setCount }, (_, index) => ({
    setOrder: index + 1,
    weightKg,
    repetition,
    durationSeconds: null,
    rpe: null,
    isWarmup: false,
    restSeconds,
  }))
}

async function fetchExercises() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await getWorkouts(search.value.trim() ? { search: search.value.trim(), page_size: 50 } : { page_size: 50 })
    exercises.value = unwrapListData(response)

    if (route.query.exerciseId && exercises.value.some((exercise) => exercise.id === Number(route.query.exerciseId))) {
      form.exerciseId = Number(route.query.exerciseId)
    } else if (!exercises.value.some((exercise) => exercise.id === Number(form.exerciseId))) {
      form.exerciseId = exercises.value[0]?.id || ''
    }

    if (editForm.exerciseId && !exercises.value.some((exercise) => exercise.id === Number(editForm.exerciseId))) {
      editForm.exerciseId = ''
    }
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
    exercises.value = []
  } finally {
    isLoading.value = false
  }
}

async function fetchRoutines() {
  isLoadingRoutines.value = true
  routineMessage.value = ''

  try {
    const response = await getWorkoutRoutinesPage({ page_size: 100 })
    const pageData = unwrapPageData(response)
    routines.value = pageData.results
  } catch (error) {
    routineMessage.value = normalizeCaughtError(error).message
    routines.value = []
  } finally {
    isLoadingRoutines.value = false
  }
}

function loadRoutineEntries() {
  routineMessage.value = ''
  routineEntries.value = []

  const routineId = Number(selectedRoutineId.value)
  if (!routineId) {
    return
  }

  const routine = routines.value.find((item) => item.id === routineId)
  const items = Array.isArray(routine?.items) ? routine.items : []

  if (items.length === 0) {
    routineMessage.value = '선택한 루틴에 등록된 운동이 없습니다.'
    return
  }

  routineEntries.value = items
    .map((routineItem) => {
      const exerciseId = extractExerciseId(routineItem)
      if (!exerciseId || Number.isNaN(exerciseId)) return null
      return {
        exerciseId,
        exerciseName: extractExerciseName(routineItem),
        workoutDate: form.workoutDate,
        workoutTime: 30,
        memo: '',
        sets: buildEntrySetsFromRoutineItem(routineItem),
      }
    })
    .filter((entry) => entry !== null)

  if (routineEntries.value.length === 0) {
    routineMessage.value = '불러올 수 있는 운동 항목이 없습니다.'
  }
}

function addEntrySet(entry) {
  entry.sets.push({
    setOrder: entry.sets.length + 1,
    weightKg: 0,
    repetition: 0,
    durationSeconds: null,
    rpe: null,
    isWarmup: false,
    restSeconds: null,
  })
}

function removeEntrySet(entry, index) {
  if (entry.sets.length <= 1) return
  entry.sets.splice(index, 1)
  entry.sets.forEach((set, setIndex) => {
    set.setOrder = setIndex + 1
  })
}

function validateEntry(entry) {
  if (!entry.exerciseId) return '운동을 선택해주세요.'
  if (!entry.sets || entry.sets.length === 0) return '최소 1개의 세트가 필요합니다.'
  return validateSets(entry.sets)
}

async function saveRoutineEntries() {
  routineMessage.value = ''

  if (routineEntries.value.length === 0) {
    routineMessage.value = '저장할 운동 기록이 없습니다.'
    return
  }

  const routineId = Number(selectedRoutineId.value)
  if (!routineId) {
    routineMessage.value = '루틴을 먼저 선택해주세요.'
    return
  }

  const invalid = routineEntries.value.find((entry) => validateEntry(entry))
  if (invalid) {
    routineMessage.value = validateEntry(invalid)
    return
  }

  isSavingRoutines.value = true
  let successCount = 0
  const failedNames = []

  try {
    for (const entry of routineEntries.value) {
      try {
        await createWorkoutLog({
          workoutId: entry.exerciseId,
          routineId,
          workoutDate: entry.workoutDate,
          workoutTime: entry.workoutTime,
          memo: entry.memo,
          sets: entry.sets.map(toApiSet),
        })
        successCount += 1
      } catch (error) {
        failedNames.push(entry.exerciseName || `운동 ID ${entry.exerciseId}`)
      }
    }

    if (failedNames.length > 0) {
      routineMessage.value = `${successCount}건 저장 성공. 일부 항목 저장 실패: ${failedNames.join(', ')}`
    } else {
      routineMessage.value = `운동 기록 ${successCount}건이 저장되었습니다.`
      toastStore.success?.(routineMessage.value)
    }

    routineEntries.value = []
    selectedRoutineId.value = ''
    await fetchLogs(1)
  } catch (error) {
    routineMessage.value = normalizeCaughtError(error).message
  } finally {
    isSavingRoutines.value = false
  }
}

async function fetchLogs(page = pagination.page) {
  errorMessage.value = ''

  try {
    const response = await getWorkoutLogsPage({
      date: form.workoutDate,
      page,
      page_size: pagination.pageSize,
    })
    const pageData = unwrapPageData(response)

    logs.value = pageData.results
    syncPagination(pageData)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
    logs.value = []
    syncPagination({ results: [], page, page_size: pagination.pageSize })
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
    const response = await getWorkoutLog(logId)
    const log = unwrapApiData(response)
    const logSets = Array.isArray(log?.sets) ? log.sets : []

    editForm.id = log.id
    editForm.workoutDate = log.workoutDate ?? log.workout_date ?? today
    editForm.exerciseId = log.workoutId ?? log.workout_id ?? log.exerciseId ?? log.exercise_id ?? log.exercise?.id ?? ''
    editForm.routineId = log.routineId ?? log.routine_id ?? null
    editForm.workoutTime = log.workoutTime ?? log.workout_time ?? 0
    editForm.memo = log.memo || ''
    editForm.sets = (logSets.length ? logSets : Array.from({ length: log.setCount ?? log.set_count ?? 1 }, (_, index) => ({
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
  await Promise.allSettled([
    fetchExercises(),
    fetchLogs(1),
    fetchRoutines(),
  ])
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
      <form class="form-card mobile-friendly-form workout-log-form" @submit.prevent="saveLog">
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
            <option value="">선택</option>
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
          <p>{{ getExerciseBodyParts(selectedExercise).join(', ') }} · {{ getExerciseEquipments(selectedExercise).join(', ') || '장비 없음' }}</p>
        </div>

        <div class="button-row form-actions">
          <button class="btn btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '저장 중...' : '운동 기록 저장' }}
          </button>
          <RouterLink class="btn btn-secondary" to="/workouts">운동 찾기</RouterLink>
        </div>
        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
        <div class="button-row">
          <!-- <RouterLink class="btn btn-secondary" to="/workout/progression">다음 운동 목표 추천</RouterLink> -->
          <RouterLink class="btn btn-secondary" to="/progress">진행 현황 보기</RouterLink>
          <RouterLink class="btn btn-secondary" to="/workout/routines">운동 루틴 관리</RouterLink>
        </div>
      </form>

      <section class="surface-card routine-import-card workout-routine-import">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Routine</p>
            <h2>내 루틴 불러오기</h2>
          </div>
          <span class="chip">{{ routines.length }}개 루틴</span>
        </div>

        <div class="field-group">
          <label for="routine-select">저장된 루틴</label>
          <div class="inline-controls mobile-stack">
            <select id="routine-select" v-model="selectedRoutineId" :disabled="isLoadingRoutines">
              <option value="">루틴 선택</option>
              <option v-for="routine in routines" :key="routine.id" :value="routine.id">{{ routine.name }}</option>
            </select>
            <button class="btn btn-secondary" type="button" :disabled="!selectedRoutineId || isLoadingRoutines" @click="loadRoutineEntries">
              {{ isLoadingRoutines ? '불러오는 중...' : '불러오기' }}
            </button>
          </div>
        </div>

        <p v-if="routineMessage && routineEntries.length === 0" class="form-message">{{ routineMessage }}</p>

        <template v-if="routineEntries.length > 0">
          <div class="routine-list">
            <article v-for="(entry, entryIndex) in routineEntries" :key="`${entry.exerciseId}-${entryIndex}`" class="routine-item routine-item-manage">
              <div class="routine-entry-head">
                <strong>{{ entry.exerciseName || `운동 ID ${entry.exerciseId}` }}</strong>
                <span class="meta-text">{{ entry.sets.length }}세트</span>
              </div>

              <div class="content-grid compact-form-grid">
                <div class="field-group" style="grid-column: span 4">
                  <label :for="`entry-date-${entryIndex}`">운동 날짜</label>
                  <input :id="`entry-date-${entryIndex}`" v-model="entry.workoutDate" type="date" />
                </div>
                <div class="field-group" style="grid-column: span 4">
                  <label :for="`entry-time-${entryIndex}`">시간(분)</label>
                  <input :id="`entry-time-${entryIndex}`" v-model.number="entry.workoutTime" type="number" min="0" />
                </div>
                <div class="field-group" style="grid-column: span 4">
                  <label :for="`entry-memo-${entryIndex}`">메모</label>
                  <input :id="`entry-memo-${entryIndex}`" v-model="entry.memo" type="text" placeholder="선택" />
                </div>
              </div>

              <div class="section-heading-row">
                <p class="section-label">세트</p>
                <button class="btn btn-secondary" type="button" @click="addEntrySet(entry)">세트 추가</button>
              </div>

              <div class="routine-set-list">
                <article v-for="(set, setIndex) in entry.sets" :key="setIndex" class="routine-set-row">
                  <span class="set-badge">{{ setIndex + 1 }}</span>
                  <div class="content-grid compact-form-grid">
                    <div class="field-group" style="grid-column: span 3">
                      <label :for="`entry-${entryIndex}-weight-${setIndex}`">중량</label>
                      <input :id="`entry-${entryIndex}-weight-${setIndex}`" v-model.number="set.weightKg" type="number" min="0" step="0.5" placeholder="맨몸" />
                    </div>
                    <div class="field-group" style="grid-column: span 3">
                      <label :for="`entry-${entryIndex}-reps-${setIndex}`">반복</label>
                      <input :id="`entry-${entryIndex}-reps-${setIndex}`" v-model.number="set.repetition" type="number" min="1" placeholder="선택" />
                    </div>
                    <div class="field-group" style="grid-column: span 3">
                      <label :for="`entry-${entryIndex}-duration-${setIndex}`">시간(초)</label>
                      <input :id="`entry-${entryIndex}-duration-${setIndex}`" v-model.number="set.durationSeconds" type="number" min="1" placeholder="선택" />
                    </div>
                    <div class="field-group" style="grid-column: span 3">
                      <label :for="`entry-${entryIndex}-rpe-${setIndex}`">RPE</label>
                      <input :id="`entry-${entryIndex}-rpe-${setIndex}`" v-model.number="set.rpe" type="number" min="1" max="10" step="0.5" placeholder="선택" />
                    </div>
                    <label class="checkbox-row" style="grid-column: span 12">
                      <input v-model="set.isWarmup" type="checkbox" />
                      워밍업 세트
                    </label>
                  </div>
                  <button class="btn btn-secondary" type="button" :disabled="entry.sets.length <= 1" @click="removeEntrySet(entry, setIndex)">삭제</button>
                </article>
              </div>
            </article>
          </div>

          <div class="button-row form-actions">
            <button class="btn btn-primary" type="button" :disabled="isSavingRoutines" @click="saveRoutineEntries">
              {{ isSavingRoutines ? '저장 중...' : `전체 저장 (${routineEntries.length}건)` }}
            </button>
            <button class="btn btn-secondary" type="button" :disabled="isSavingRoutines" @click="routineEntries = []; selectedRoutineId = ''; routineMessage = ''">
              취소
            </button>
          </div>
          <p v-if="routineMessage" class="form-message">{{ routineMessage }}</p>
        </template>
      </section>

      <section class="surface-card workout-log-list-card">
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
              <option value="">선택</option>
              <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">{{ exercise.name }}</option>
            </select>
            <span v-if="editingExercise" class="meta-text">{{ getExerciseBodyParts(editingExercise).join(', ') }}</span>
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
              <span>{{ getLogWorkoutTime(log) }}분 · {{ getLogSetCount(log) }}세트 · {{ getLogRepetition(log) }}회</span>
              <span v-if="log.sets?.length">
                {{ log.sets.map((set, index) => `${getSetOrder(set, index)}세트 ${getSetWeightKg(set) ?? '맨몸'}kg ${set.repetition ?? '-'}회${getSetRpe(set) ? ` RPE ${getSetRpe(set)}` : ''}`).join(' · ') }}
              </span>
              <span v-if="log.memo">{{ log.memo }}</span>
            </div>
            <div class="delete-actions">
              <strong>{{ getLogWorkoutDate(log) }}</strong>
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
            <!-- <a class="btn btn-primary" href="#exercise">운동 기록하기</a>
            <RouterLink class="btn btn-secondary" to="/workouts">운동 찾기</RouterLink> -->
          </StateBlock>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.workout-log-form {
  grid-column: span 5;
  align-self: start;
}

.workout-routine-import {
  grid-column: span 7;
  align-self: start;

  /* 카드 자체가 너무 길어지지 않게 제한 */
  max-height: calc(100vh - 190px);
  overflow: hidden;
}

.workout-log-list-card {
  grid-column: span 12;
}

.routine-import-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* 루틴 선택 영역은 고정 */
.routine-import-card > .section-heading-row,
.routine-import-card > .field-group {
  flex-shrink: 0;
}

/* 루틴 운동 목록만 내부 스크롤 */
.routine-import-card > .routine-list {
  flex: 1;
  min-height: 0;
  max-height: 520px;
  overflow-y: auto;
  padding-right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* 스크롤바 너무 못생기지 않게 */
.routine-import-card > .routine-list::-webkit-scrollbar {
  width: 8px;
}

.routine-import-card > .routine-list::-webkit-scrollbar-thumb {
  background: rgba(31, 107, 63, 0.28);
  border-radius: 999px;
}

.routine-import-card > .routine-list::-webkit-scrollbar-track {
  background: rgba(31, 107, 63, 0.06);
  border-radius: 999px;
}

/* 저장/취소 버튼은 카드 아래쪽에 유지 */
.routine-import-card .form-actions {
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  z-index: 2;
  padding-top: 0.75rem;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.2),
    rgba(255, 255, 255, 0.95)
  );
}

.routine-import-card .inline-controls {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.routine-import-card .inline-controls select {
  flex: 1;
  min-width: 0;
}

.routine-entry-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.routine-entry-head strong {
  font-size: 1.05rem;
  word-break: keep-all;
}

.routine-import-card .routine-item-manage {
  display: block;
  padding: 1.25rem;
}

.routine-set-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.routine-set-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: start;
  padding: 1rem;
  border: 1px solid rgba(34, 93, 62, 0.14);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
}

.set-badge {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #1f6b3f;
  color: white;
  font-weight: 800;
}

.routine-set-row .compact-form-grid {
  width: 100%;
}

.routine-set-row .field-group {
  min-width: 0;
}

.routine-set-row input {
  width: 100%;
}

.routine-set-row .checkbox-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.routine-set-row > .btn {
  white-space: nowrap;
}

@media (max-width: 1100px) {
  .workout-log-form,
  .workout-routine-import,
  .workout-log-list-card {
    grid-column: span 12;
  }

  .workout-routine-import {
    max-height: none;
    overflow: visible;
  }

  .routine-import-card > .routine-list {
    max-height: none;
    overflow: visible;
  }
}

@media (max-width: 900px) {
  .routine-set-row {
    grid-template-columns: 1fr;
  }

  .set-badge {
    width: 100%;
  }

  .routine-entry-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>