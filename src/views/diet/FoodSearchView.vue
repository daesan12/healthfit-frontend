<script setup>
import { computed, onMounted, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { getFoods } from '@/api/diet'

const ALL_CATEGORY = '전체'

const foods = ref([])
const categories = ref([ALL_CATEGORY])
const search = ref('')
const selectedCategory = ref(ALL_CATEGORY)
const isLoading = ref(false)
const errorMessage = ref('')

const resultSummary = computed(() => {
  if (isLoading.value) return '조회 중'
  return `${foods.value.length.toLocaleString()}개 음식`
})

function buildParams() {
  const params = {}
  const keyword = search.value.trim()

  if (keyword) params.search = keyword
  if (selectedCategory.value !== ALL_CATEGORY) params.category = selectedCategory.value

  return params
}

function syncCategories(nextFoods) {
  const nextCategories = [...new Set(nextFoods.map((food) => food.category).filter(Boolean))]
  categories.value = [ALL_CATEGORY, ...nextCategories]
}

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits)
}

function macroRows(food) {
  const carbohydrate = Number(food.carbohydrate || 0)
  const protein = Number(food.protein || 0)
  const fat = Number(food.fat || 0)
  const total = Math.max(carbohydrate + protein + fat, 1)

  return [
    { label: '탄수화물', value: carbohydrate, ratio: Math.round((carbohydrate / total) * 100) },
    { label: '단백질', value: protein, ratio: Math.round((protein / total) * 100) },
    { label: '지방', value: fat, ratio: Math.round((fat / total) * 100) },
  ]
}

async function fetchFoods(options = {}) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getFoods(options.params || {})
    foods.value = Array.isArray(data) ? data : []

    if (options.syncCategories) {
      syncCategories(foods.value)
    }
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    foods.value = []
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

function handleSearch() {
  fetchFoods({ params: buildParams() })
}

function resetFilters() {
  search.value = ''
  selectedCategory.value = ALL_CATEGORY
  fetchFoods({ syncCategories: true })
}

onMounted(() => {
  fetchFoods({ syncCategories: true })
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Foods"
      title="음식 검색"
      description="음식명과 카테고리로 영양성분 데이터를 찾아봅니다."
    />

    <form class="surface-card filter-panel" @submit.prevent="handleSearch">
      <div class="field-group">
        <label for="food-search">음식명 검색</label>
        <input id="food-search" v-model="search" type="text" placeholder="예: 닭가슴살, 바나나" />
      </div>

      <div class="field-group">
        <label for="food-category">카테고리</label>
        <select id="food-category" v-model="selectedCategory">
          <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
        </select>
      </div>

      <button class="btn btn-primary" type="submit" :disabled="isLoading">
        {{ isLoading ? '검색 중...' : '검색' }}
      </button>
      <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="resetFilters">초기화</button>
      <RouterLink class="btn btn-secondary" to="/diet/records">식단 기록</RouterLink>
    </form>

    <div class="section-toolbar">
      <p class="section-label">검색 결과</p>
      <strong>{{ resultSummary }}</strong>
    </div>

    <StateBlock
      v-if="isLoading"
      type="loading"
      title="음식 데이터를 불러오는 중입니다"
      message="백엔드의 음식 데이터를 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="음식 데이터를 불러오지 못했습니다"
      :message="errorMessage"
    />

    <section v-else class="content-grid">
      <article v-for="food in foods" :key="food.id" class="surface-card dense-card food-card" style="grid-column: span 4">
        <div class="dense-card-header">
          <span class="chip">{{ food.category || '미분류' }}</span>
          <span class="dense-meta">100g 기준</span>
        </div>

        <h2>{{ food.name }}</h2>

        <div class="calorie-hero">
          <strong>{{ formatNumber(food.calories, 0) }}</strong>
          <span>kcal</span>
        </div>

        <div class="macro-list">
          <div v-for="row in macroRows(food)" :key="row.label" class="macro-row">
            <span>{{ row.label }}</span>
            <strong>{{ formatNumber(row.value) }}g</strong>
            <i :style="{ width: `${row.ratio}%` }"></i>
          </div>
        </div>

        <RouterLink class="btn btn-secondary card-action" to="/diet/records">
          식단에 기록하기
        </RouterLink>
      </article>

      <StateBlock
        v-if="foods.length === 0"
        style="grid-column: 1 / -1"
        type="empty"
        title="검색 결과가 없습니다"
        message="다른 음식명이나 카테고리로 다시 검색해보세요."
      >
        <button class="btn btn-secondary" type="button" @click="resetFilters">검색 초기화</button>
        <RouterLink class="btn btn-primary" to="/diet/records">식단 기록하기</RouterLink>
      </StateBlock>
    </section>
  </main>
</template>
