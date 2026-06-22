<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { getWorkoutsPage } from '@/api/workout'

const ALL_FILTER = '전체'

const workouts = ref([])
const bodyParts = ref([ALL_FILTER])
const equipments = ref([ALL_FILTER])
const search = ref('')
const selectedPart = ref(ALL_FILTER)
const selectedEquipment = ref(ALL_FILTER)
const isLoading = ref(false)
const errorMessage = ref('')
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
  return `${pagination.count.toLocaleString()}개 운동 · ${pagination.page}/${pagination.totalPages} 페이지`
})

function buildParams(page = pagination.page) {
  const params = { page, page_size: pagination.pageSize }
  const keyword = search.value.trim()

  if (keyword) params.search = keyword
  if (selectedPart.value !== ALL_FILTER) params.body_part = selectedPart.value
  if (selectedEquipment.value !== ALL_FILTER) params.equipment = selectedEquipment.value

  return params
}

function syncFilters(nextWorkouts) {
  bodyParts.value = [ALL_FILTER, ...new Set(nextWorkouts.flatMap((workout) => workout.bodyParts || []).filter(Boolean))]
  equipments.value = [
    ALL_FILTER,
    ...new Set(nextWorkouts.flatMap((workout) => workout.equipments || []).filter(Boolean)),
  ]
}

function syncPagination(data) {
  pagination.count = data.count
  pagination.page = data.page
  pagination.pageSize = data.pageSize
  pagination.totalPages = data.totalPages
  pagination.hasNext = data.hasNext
  pagination.hasPrevious = data.hasPrevious
}

function compactList(items, emptyText = '정보 없음', limit = 3) {
  const list = Array.isArray(items) ? items.filter(Boolean) : []
  if (list.length === 0) return emptyText
  if (list.length <= limit) return list.join(', ')
  return `${list.slice(0, limit).join(', ')} 외 ${list.length - limit}개`
}

async function fetchWorkouts(options = {}) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getWorkoutsPage(options.params || buildParams(options.page || 1))
    workouts.value = data.results
    syncPagination(data)

    if (options.syncFilters) {
      syncFilters(workouts.value)
    }
  } catch (error) {
    workouts.value = []
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

function resetFilters() {
  search.value = ''
  selectedPart.value = ALL_FILTER
  selectedEquipment.value = ALL_FILTER
  fetchWorkouts({ params: { page: 1, page_size: pagination.pageSize }, syncFilters: true })
}

function handleSearch() {
  fetchWorkouts({ params: buildParams(1) })
}

function movePage(page) {
  if (page < 1 || page > pagination.totalPages || page === pagination.page) return
  fetchWorkouts({ params: buildParams(page) })
}

onMounted(() => {
  fetchWorkouts({ params: buildParams(1), syncFilters: true })
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout"
      title="운동 목록"
      description="운동명, 부위, 장비 조건으로 운동 데이터를 검색합니다."
    />

    <form class="surface-card filter-panel" @submit.prevent="handleSearch">
      <div class="field-group">
        <label for="workout-search">운동명 검색</label>
        <input id="workout-search" v-model="search" type="text" placeholder="push up, squat, plank" />
      </div>

      <div class="field-group">
        <label for="body-part">운동 부위</label>
        <select id="body-part" v-model="selectedPart">
          <option v-for="part in bodyParts" :key="part" :value="part">{{ part }}</option>
        </select>
      </div>

      <div class="field-group">
        <label for="equipment">장비</label>
        <select id="equipment" v-model="selectedEquipment">
          <option v-for="equipment in equipments" :key="equipment" :value="equipment">
            {{ equipment }}
          </option>
        </select>
      </div>

      <button class="btn btn-primary" type="submit" :disabled="isLoading">
        {{ isLoading ? '검색 중...' : '검색' }}
      </button>
      <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="resetFilters">초기화</button>
      <RouterLink class="btn btn-secondary" to="/workout/logs">운동 기록</RouterLink>
      <RouterLink class="btn btn-secondary" to="/workout/recommend">AI 루틴 추천</RouterLink>
    </form>

    <div class="section-toolbar">
      <p class="section-label">검색 결과</p>
      <strong>{{ resultSummary }}</strong>
    </div>

    <StateBlock
      v-if="isLoading"
      type="loading"
      title="운동 데이터를 불러오는 중입니다"
      message="백엔드의 운동 데이터를 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="운동 데이터를 불러오지 못했습니다"
      :message="errorMessage"
    />

    <section v-else class="content-grid">
      <article v-for="workout in workouts" :key="workout.id" class="surface-card dense-card workout-card" style="grid-column: span 4">
        <div class="dense-card-header">
          <span class="chip">{{ compactList(workout.bodyParts, '부위 없음', 2) }}</span>
          <span class="dense-meta">{{ compactList(workout.equipments, '장비 없음', 1) }}</span>
        </div>

        <div class="workout-card-media">
          <img
            v-if="workout.gifUrl"
            :src="workout.gifUrl"
            :alt="`${workout.name} 운동 예시`"
            loading="lazy"
          />
          <span v-else>이미지 없음</span>
        </div>

        <h2>{{ workout.name }}</h2>

        <dl class="dense-info-list">
          <div>
            <dt>주요 근육</dt>
            <dd>{{ compactList(workout.targetMuscles) }}</dd>
          </div>
          <div>
            <dt>보조 근육</dt>
            <dd>{{ compactList(workout.secondaryMuscles, '보조 근육 없음') }}</dd>
          </div>
          <div>
            <dt>동작</dt>
            <dd>{{ workout.instructions.length || 0 }}단계</dd>
          </div>
        </dl>

        <ol class="instruction-list dense-instructions">
          <li v-for="instruction in workout.instructions.slice(0, 2)" :key="instruction">
            {{ instruction }}
          </li>
          <li v-if="workout.instructions.length > 2">나머지는 상세 화면에서 확인</li>
        </ol>

        <div class="button-row dense-card-actions">
          <RouterLink class="btn btn-secondary card-action" :to="`/workouts/${workout.id}`">
            상세 보기
          </RouterLink>
          <RouterLink class="btn btn-primary card-action" :to="`/workout/logs?exerciseId=${workout.id}`">
            기록하기
          </RouterLink>
        </div>
      </article>

      <div v-if="workouts.length > 0" class="surface-card pagination-panel" style="grid-column: 1 / -1">
        <button class="btn btn-secondary" type="button" :disabled="!pagination.hasPrevious || isLoading" @click="movePage(pagination.page - 1)">
          이전
        </button>
        <strong>{{ pagination.page }} / {{ pagination.totalPages }}</strong>
        <button class="btn btn-secondary" type="button" :disabled="!pagination.hasNext || isLoading" @click="movePage(pagination.page + 1)">
          다음
        </button>
      </div>

      <StateBlock
        v-if="workouts.length === 0"
        style="grid-column: 1 / -1"
        type="empty"
        title="검색 결과가 없습니다"
        message="운동명, 부위, 장비 조건을 바꿔 다시 검색해보세요."
      >
        <button class="btn btn-secondary" type="button" @click="resetFilters">검색 초기화</button>
        <RouterLink class="btn btn-primary" to="/workout/logs">운동 기록하기</RouterLink>
      </StateBlock>
    </section>
  </main>
</template>
