<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import {
  addRoutineItem,
  createWorkoutRoutine,
  deleteRoutineItem,
  deleteWorkoutRoutine,
  getWorkoutRoutinesPage,
  getWorkouts,
  updateRoutineItem,
  updateWorkoutRoutine,
} from '@/api/workout'

const routines = ref([])
const exercises = ref([])
const isLoading = ref(false)
const message = ref('')
const errorMessage = ref('')
const search = ref('')
const exerciseSearch = ref('')
const editingRoutineId = ref(null)
const editingRoutineItemId = ref(null)
const savingItemId = ref(null)
const pagination = reactive({
  count: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
})

const resultSummary = computed(() => {
  if (isLoading.value) return '조회 중'
  return `${pagination.count.toLocaleString()}개 루틴 · ${pagination.page}/${pagination.totalPages} 페이지`
})

const routineForm = reactive({
  name: '',
  description: '',
})

const itemForm = reactive({
  routineId: '',
  exerciseId: '',
  order: 1,
  sets: 3,
  reps: 10,
  weight: 0,
  restSeconds: 60,
})

function resetRoutineForm() {
  editingRoutineId.value = null
  routineForm.name = ''
  routineForm.description = ''
}

function resetItemForm() {
  editingRoutineItemId.value = null
  itemForm.routineId = ''
  itemForm.exerciseId = ''
  itemForm.order = 1
  itemForm.sets = 3
  itemForm.reps = 10
  itemForm.weight = 0
  itemForm.restSeconds = 60
}

function buildParams(page = pagination.page) {
  const params = { page, page_size: pagination.pageSize }
  if (search.value.trim()) params.search = search.value.trim()
  return params
}

function syncPagination(data) {
  pagination.count = data.count
  pagination.page = data.page
  pagination.pageSize = data.pageSize
  pagination.totalPages = data.totalPages
  pagination.hasNext = data.hasNext
  pagination.hasPrevious = data.hasPrevious
}

function toRoutineItemPayload(item, patch = {}) {
  return {
    order: Number(patch.order ?? item.order),
    sets: Math.max(1, Number(patch.sets ?? item.sets)),
    reps: Math.max(1, Number(patch.reps ?? item.reps)),
    weight: Math.max(0, Number(patch.weight ?? item.weight ?? 0)),
    restSeconds: Math.max(0, Number(patch.restSeconds ?? item.restSeconds ?? 0)),
  }
}

async function fetchRoutines(page = 1) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getWorkoutRoutinesPage(buildParams(page))
    routines.value = data.results
    syncPagination(data)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

async function fetchExercises() {
  exercises.value = await getWorkouts(
    exerciseSearch.value.trim() ? { search: exerciseSearch.value.trim(), page_size: 100 } : { page_size: 100 },
  )
  if (!exercises.value.some((exercise) => exercise.id === Number(itemForm.exerciseId))) {
    itemForm.exerciseId = ''
  }
}

function startEditRoutine(routine) {
  editingRoutineId.value = routine.id
  routineForm.name = routine.name
  routineForm.description = routine.description || ''
}

function startEditRoutineItem(routine, item) {
  editingRoutineItemId.value = item.id
  itemForm.routineId = routine.id
  itemForm.exerciseId = item.exercise?.id || ''
  itemForm.order = item.order
  itemForm.sets = item.sets
  itemForm.reps = item.reps
  itemForm.weight = item.weight || 0
  itemForm.restSeconds = item.restSeconds || 0
}

async function submitRoutine() {
  message.value = ''
  if (!routineForm.name.trim()) {
    message.value = '루틴 이름을 입력해주세요.'
    return
  }

  try {
    if (editingRoutineId.value) {
      await updateWorkoutRoutine(editingRoutineId.value, routineForm)
      message.value = '루틴을 수정했습니다.'
      resetRoutineForm()
      await fetchRoutines(pagination.page)
    } else {
      const routine = await createWorkoutRoutine(routineForm)
      resetRoutineForm()
      itemForm.routineId = routine.id
      message.value = '루틴을 만들었습니다.'
      await fetchRoutines(1)
    }
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function submitRoutineItem() {
  message.value = ''
  if (!itemForm.routineId || (!editingRoutineItemId.value && !itemForm.exerciseId)) {
    message.value = '루틴과 운동을 선택해주세요.'
    return
  }

  const payload = {
    exerciseId: Number(itemForm.exerciseId),
    order: Number(itemForm.order),
    sets: Number(itemForm.sets),
    reps: Number(itemForm.reps),
    weight: Number(itemForm.weight),
    restSeconds: Number(itemForm.restSeconds),
  }

  try {
    if (editingRoutineItemId.value) {
      await updateRoutineItem(editingRoutineItemId.value, payload)
      message.value = '루틴 항목을 수정했습니다.'
      resetItemForm()
    } else {
      await addRoutineItem(Number(itemForm.routineId), payload)
      message.value = '루틴 항목을 추가했습니다.'
    }

    await fetchRoutines(pagination.page)
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function quickUpdateRoutineItem(item, patch, successMessage) {
  message.value = ''
  savingItemId.value = item.id

  try {
    await updateRoutineItem(item.id, toRoutineItemPayload(item, patch))
    message.value = successMessage
    await fetchRoutines(pagination.page)
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  } finally {
    savingItemId.value = null
  }
}

async function moveRoutineItem(routine, item, direction) {
  const sortedItems = [...routine.items].sort((a, b) => a.order - b.order)
  const currentIndex = sortedItems.findIndex((candidate) => candidate.id === item.id)
  const swapItem = sortedItems[currentIndex + direction]

  if (!swapItem) return

  savingItemId.value = item.id
  message.value = ''

  try {
    await Promise.all([
      updateRoutineItem(item.id, toRoutineItemPayload(item, { order: swapItem.order })),
      updateRoutineItem(swapItem.id, toRoutineItemPayload(swapItem, { order: item.order })),
    ])
    message.value = '루틴 항목 순서를 변경했습니다.'
    await fetchRoutines(pagination.page)
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  } finally {
    savingItemId.value = null
  }
}

async function removeRoutine(routineId) {
  try {
    await deleteWorkoutRoutine(routineId)
    if (editingRoutineId.value === routineId) resetRoutineForm()
    message.value = '루틴을 삭제했습니다.'
    await fetchRoutines(routines.value.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page)
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function removeRoutineItem(itemId) {
  try {
    await deleteRoutineItem(itemId)
    if (editingRoutineItemId.value === itemId) resetItemForm()
    message.value = '루틴 항목을 삭제했습니다.'
    await fetchRoutines(pagination.page)
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

onMounted(() => {
  fetchRoutines(1)
  fetchExercises()
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout Routines"
      title="운동 루틴"
      description="내 루틴을 만들고 항목의 순서, 세트, 반복, 중량, 휴식 시간을 수정합니다."
    />

    <section class="content-grid">
      <div class="form-card" style="grid-column: span 4; align-self: start">
        <form @submit.prevent="submitRoutine">
          <p class="section-label">{{ editingRoutineId ? 'Edit Routine' : 'New Routine' }}</p>
          <div class="field-group">
            <label for="routine-name">루틴 이름</label>
            <input id="routine-name" v-model="routineForm.name" type="text" />
          </div>
          <div class="field-group">
            <label for="routine-description">설명</label>
            <textarea id="routine-description" v-model="routineForm.description" />
          </div>
          <div class="button-row">
            <button class="btn btn-primary" type="submit">{{ editingRoutineId ? '루틴 수정' : '루틴 만들기' }}</button>
            <button v-if="editingRoutineId" class="btn btn-secondary" type="button" @click="resetRoutineForm">취소</button>
          </div>
        </form>

        <form class="stacked-form" @submit.prevent="submitRoutineItem">
          <p class="section-label">{{ editingRoutineItemId ? 'Edit Item' : 'Add Item' }}</p>
          <div class="field-group">
            <label for="routine-select">대상 루틴</label>
            <select id="routine-select" v-model="itemForm.routineId" :disabled="Boolean(editingRoutineItemId)">
              <option value="">선택</option>
              <option v-for="routine in routines" :key="routine.id" :value="routine.id">{{ routine.name }}</option>
            </select>
          </div>
          <div class="field-group">
            <label for="exercise-select">운동</label>
            <div class="inline-controls" style="margin-bottom: 0.5rem">
              <input id="routine-exercise-search" v-model="exerciseSearch" type="text" placeholder="운동 이름 검색" />
              <button class="btn btn-secondary" type="button" @click="fetchExercises">검색</button>
            </div>
            <select id="exercise-select" v-model="itemForm.exerciseId" :disabled="Boolean(editingRoutineItemId)">
              <option value="">선택</option>
              <option v-for="exercise in exercises" :key="exercise.id" :value="exercise.id">{{ exercise.name }}</option>
            </select>
          </div>
          <div class="content-grid compact-form-grid">
            <div class="field-group" style="grid-column: span 6">
              <label for="routine-order">순서</label>
              <input id="routine-order" v-model.number="itemForm.order" type="number" min="1" />
            </div>
            <div class="field-group" style="grid-column: span 6">
              <label for="routine-sets">세트</label>
              <input id="routine-sets" v-model.number="itemForm.sets" type="number" min="1" />
            </div>
            <div class="field-group" style="grid-column: span 6">
              <label for="routine-reps">반복</label>
              <input id="routine-reps" v-model.number="itemForm.reps" type="number" min="1" />
            </div>
            <div class="field-group" style="grid-column: span 6">
              <label for="routine-weight">중량</label>
              <input id="routine-weight" v-model.number="itemForm.weight" type="number" min="0" step="0.5" />
            </div>
            <div class="field-group" style="grid-column: span 12">
              <label for="routine-rest">휴식(초)</label>
              <input id="routine-rest" v-model.number="itemForm.restSeconds" type="number" min="0" />
            </div>
          </div>
          <div class="button-row">
            <button class="btn btn-secondary" type="submit">{{ editingRoutineItemId ? '항목 수정' : '항목 추가' }}</button>
            <button v-if="editingRoutineItemId" class="btn btn-secondary" type="button" @click="resetItemForm">취소</button>
          </div>
        </form>

        <p v-if="message" class="form-message">{{ message }}</p>
      </div>

      <section class="post-list" style="grid-column: span 8">
        <form class="surface-card filter-panel" @submit.prevent="fetchRoutines(1)">
          <div class="field-group">
            <label for="routine-search">검색</label>
            <input id="routine-search" v-model="search" type="text" />
          </div>
          <button class="btn btn-primary" type="submit" :disabled="isLoading">조회</button>
        </form>

        <div class="section-toolbar">
          <p class="section-label">루틴 목록</p>
          <strong>{{ resultSummary }}</strong>
        </div>

        <StateBlock v-if="isLoading" type="loading" title="루틴 조회 중" message="내 루틴을 불러오고 있습니다." />
        <StateBlock v-else-if="errorMessage" type="error" title="조회 실패" :message="errorMessage" />

        <template v-else>
          <article v-for="routine in routines" :key="routine.id" class="surface-card">
            <div class="section-heading-row">
              <div>
                <p class="section-label">{{ routine.items.length }}개 운동</p>
                <h2>{{ routine.name }}</h2>
              </div>
              <div class="button-row">
                <button class="btn btn-secondary" type="button" @click="startEditRoutine(routine)">루틴 수정</button>
                <button class="btn btn-secondary" type="button" @click="removeRoutine(routine.id)">삭제</button>
              </div>
            </div>
            <p class="card-description">{{ routine.description || '설명 없음' }}</p>

            <div class="routine-list">
              <article v-for="item in routine.items" :key="item.id" class="routine-item routine-item-manage">
                <span>{{ item.order }}</span>
                <div>
                  <strong>{{ item.exercise?.name || '운동 정보 없음' }}</strong>
                  <p>{{ item.sets }}세트 · {{ item.reps }}회 · {{ item.weight || 0 }}kg · 휴식 {{ item.restSeconds }}초</p>
                  <div class="button-row routine-quick-actions">
                    <button class="btn btn-secondary" type="button" :disabled="savingItemId === item.id" @click="moveRoutineItem(routine, item, -1)">
                      위로
                    </button>
                    <button class="btn btn-secondary" type="button" :disabled="savingItemId === item.id" @click="moveRoutineItem(routine, item, 1)">
                      아래로
                    </button>
                    <button class="btn btn-secondary" type="button" :disabled="savingItemId === item.id" @click="quickUpdateRoutineItem(item, { sets: item.sets + 1 }, '세트 수를 늘렸습니다.')">
                      세트 +1
                    </button>
                    <button class="btn btn-secondary" type="button" :disabled="savingItemId === item.id || item.sets <= 1" @click="quickUpdateRoutineItem(item, { sets: item.sets - 1 }, '세트 수를 줄였습니다.')">
                      세트 -1
                    </button>
                    <button class="btn btn-secondary" type="button" :disabled="savingItemId === item.id" @click="quickUpdateRoutineItem(item, { reps: item.reps + 1 }, '반복 수를 늘렸습니다.')">
                      반복 +1
                    </button>
                    <button class="btn btn-secondary" type="button" :disabled="savingItemId === item.id || item.reps <= 1" @click="quickUpdateRoutineItem(item, { reps: item.reps - 1 }, '반복 수를 줄였습니다.')">
                      반복 -1
                    </button>
                  </div>
                </div>
                <div class="button-row">
                  <button class="btn btn-secondary" type="button" @click="startEditRoutineItem(routine, item)">상세 수정</button>
                  <button class="btn btn-secondary" type="button" @click="removeRoutineItem(item.id)">삭제</button>
                </div>
              </article>
            </div>
          </article>

          <div v-if="routines.length > 0" class="surface-card pagination-panel">
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasPrevious || isLoading" @click="fetchRoutines(pagination.page - 1)">
              이전
            </button>
            <strong>{{ pagination.page }} / {{ pagination.totalPages }}</strong>
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasNext || isLoading" @click="fetchRoutines(pagination.page + 1)">
              다음
            </button>
          </div>

          <StateBlock
            v-if="routines.length === 0"
            type="empty"
            title="루틴이 없습니다"
            message="왼쪽에서 내 운동 루틴을 만들어보세요."
          />
        </template>
      </section>
    </section>
  </main>
</template>
