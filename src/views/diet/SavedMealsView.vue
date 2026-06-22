<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import {
  createMealFromSavedMeal,
  createSavedMeal,
  deleteSavedMeal,
  getFoods,
  getSavedMealsPage,
  updateSavedMeal,
} from '@/api/diet'

const savedMeals = ref([])
const foods = ref([])
const search = ref('')
const foodSearch = ref('')
const isLoading = ref(false)
const message = ref('')
const errorMessage = ref('')
const today = new Date().toISOString().slice(0, 10)
const editingSavedMealId = ref(null)
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
  return `${pagination.count.toLocaleString()}개 저장 식단 · ${pagination.page}/${pagination.totalPages} 페이지`
})

const selectedFood = computed(() => foods.value.find((item) => item.id === Number(form.foodId)))
const builderTotals = computed(() =>
  form.items.reduce(
    (sum, item) => ({
      calories: sum.calories + Number(item.calories || 0),
      carbohydrate: sum.carbohydrate + Number(item.carbohydrate || 0),
      protein: sum.protein + Number(item.protein || 0),
      fat: sum.fat + Number(item.fat || 0),
    }),
    { calories: 0, carbohydrate: 0, protein: 0, fat: 0 },
  ),
)

const form = reactive({
  name: '',
  description: '',
  foodId: '',
  amount: 100,
  items: [],
})

function resetForm() {
  editingSavedMealId.value = null
  form.name = ''
  form.description = ''
  form.foodId = ''
  form.amount = 100
  form.items = []
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

async function fetchSavedMeals(page = 1) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const data = await getSavedMealsPage(buildParams(page))
    savedMeals.value = data.results
    syncPagination(data)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

async function fetchFoods() {
  foods.value = await getFoods(foodSearch.value.trim() ? { search: foodSearch.value.trim(), page_size: 100 } : { page_size: 100 })
}

function addItemToForm() {
  message.value = ''
  const food = foods.value.find((item) => item.id === Number(form.foodId))
  const amount = Number(form.amount)

  if (!food || amount <= 0) {
    message.value = '음식과 섭취량을 확인해주세요.'
    return
  }

  const existingItem = form.items.find((item) => item.foodId === food.id)
  const ratio = amount / 100

  if (existingItem) {
    existingItem.amount += amount
    existingItem.calories += food.calories * ratio
    existingItem.carbohydrate += food.carbohydrate * ratio
    existingItem.protein += food.protein * ratio
    existingItem.fat += food.fat * ratio
    form.foodId = ''
    form.amount = 100
    return
  }

  form.items.push({
    id: `${food.id}-${Date.now()}`,
    foodId: food.id,
    foodName: food.name,
    amount,
    calories: food.calories * ratio,
    carbohydrate: food.carbohydrate * ratio,
    protein: food.protein * ratio,
    fat: food.fat * ratio,
  })
  form.foodId = ''
  form.amount = 100
}

function removeItemFromForm(itemId) {
  form.items = form.items.filter((item) => item.id !== itemId)
}

function startEditSavedMeal(meal) {
  editingSavedMealId.value = meal.id
  form.name = meal.name
  form.description = meal.description || ''
  form.foodId = ''
  form.amount = 100
  form.items = meal.items.map((item) => ({
    id: item.id,
    foodId: item.foodId,
    foodName: item.foodName,
    amount: item.amount,
    calories: item.calories,
    carbohydrate: item.carbohydrate,
    protein: item.protein,
    fat: item.fat,
  }))
}

async function submitSavedMeal() {
  message.value = ''

  if (!form.name.trim() || form.items.length === 0) {
    message.value = '이름과 음식 항목을 입력해주세요.'
    return
  }

  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    items: form.items.map((item) => ({ foodId: Number(item.foodId), amount: Number(item.amount || 0) })),
  }

  try {
    const nextPage = editingSavedMealId.value ? pagination.page : 1

    if (editingSavedMealId.value) {
      await updateSavedMeal(editingSavedMealId.value, payload)
      message.value = '저장 식단을 수정했습니다.'
    } else {
      await createSavedMeal(payload)
      message.value = '저장 식단을 만들었습니다.'
    }

    resetForm()
    await fetchSavedMeals(nextPage)
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function removeSavedMeal(savedMealId) {
  try {
    await deleteSavedMeal(savedMealId)
    if (editingSavedMealId.value === savedMealId) resetForm()
    message.value = '저장 식단을 삭제했습니다.'
    await fetchSavedMeals(savedMeals.value.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page)
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function createMeal(savedMeal, mealType) {
  try {
    await createMealFromSavedMeal(savedMeal.id, { mealType, intakeDate: today })
    message.value = `${savedMeal.name}을 오늘 식단으로 기록했습니다.`
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

onMounted(() => {
  fetchSavedMeals(1)
  fetchFoods()
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Saved Meals"
      title="저장 식단"
      description="자주 먹는 식단을 저장하고 수정한 뒤 실제 식단 기록으로 복사합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4; align-self: start" @submit.prevent="submitSavedMeal">
        <p class="section-label">{{ editingSavedMealId ? 'Edit Saved Meal' : 'New Saved Meal' }}</p>
        <div class="field-group">
          <label for="saved-meal-name">이름</label>
          <input id="saved-meal-name" v-model="form.name" type="text" />
        </div>
        <div class="field-group">
          <label for="saved-meal-description">설명</label>
          <textarea id="saved-meal-description" v-model="form.description" />
        </div>
        <div class="field-group">
          <label for="saved-meal-food">음식</label>
          <div class="inline-controls" style="margin-bottom: 0.5rem">
            <input id="saved-meal-food-search" v-model="foodSearch" type="text" placeholder="음식 이름 검색" />
            <button class="btn btn-secondary" type="button" @click="fetchFoods">검색</button>
          </div>
          <select id="saved-meal-food" v-model="form.foodId">
            <option value="">선택</option>
            <option v-for="food in foods" :key="food.id" :value="food.id">{{ food.name }}</option>
          </select>
        </div>
        <div class="field-group">
          <label for="saved-meal-amount">섭취량(g)</label>
          <input id="saved-meal-amount" v-model.number="form.amount" type="number" min="1" />
        </div>
        <div v-if="selectedFood" class="preview-panel">
          <p class="section-label">추가 예정</p>
          <strong>{{ selectedFood.name }}</strong>
          <span>
            {{ form.amount }}g ·
            {{ ((selectedFood.calories * Number(form.amount || 0)) / 100).toFixed(1) }} kcal
          </span>
        </div>
        <button class="btn btn-secondary" type="button" @click="addItemToForm">음식 항목 추가</button>

        <div class="section-heading-row">
          <div>
            <p class="section-label">Builder</p>
            <h2>담은 음식 {{ form.items.length }}개</h2>
          </div>
        </div>

        <div class="meal-list">
          <article v-for="item in form.items" :key="item.id" class="meal-item">
            <div>
              <strong>{{ item.foodName }}</strong>
              <span>{{ item.amount }}g · {{ Number(item.calories || 0).toFixed(1) }} kcal</span>
            </div>
            <button type="button" @click="removeItemFromForm(item.id)">제외</button>
          </article>
        </div>

        <div v-if="form.items.length > 0" class="totals-panel">
          <article>
            <span>칼로리</span>
            <strong>{{ builderTotals.calories.toFixed(1) }}kcal</strong>
          </article>
          <article>
            <span>탄수화물</span>
            <strong>{{ builderTotals.carbohydrate.toFixed(1) }}g</strong>
          </article>
          <article>
            <span>단백질</span>
            <strong>{{ builderTotals.protein.toFixed(1) }}g</strong>
          </article>
          <article>
            <span>지방</span>
            <strong>{{ builderTotals.fat.toFixed(1) }}g</strong>
          </article>
        </div>

        <div class="button-row">
          <button class="btn btn-primary" type="submit">{{ editingSavedMealId ? '저장 식단 수정' : '저장 식단 만들기' }}</button>
          <button v-if="editingSavedMealId" class="btn btn-secondary" type="button" @click="resetForm">취소</button>
        </div>
        <p v-if="message" class="form-message">{{ message }}</p>
      </form>

      <section class="post-list" style="grid-column: span 8">
        <form class="surface-card filter-panel" @submit.prevent="fetchSavedMeals(1)">
          <div class="field-group">
            <label for="saved-meal-search">저장 식단 목록 검색</label>
            <input
              id="saved-meal-search"
              v-model="search"
              type="text"
              placeholder="저장 식단 이름 또는 설명 검색"
            />
          </div>
          <button class="btn btn-primary" type="submit" :disabled="isLoading">조회</button>
        </form>

        <div class="section-toolbar">
          <p class="section-label">저장 식단 목록</p>
          <strong>{{ resultSummary }}</strong>
        </div>

        <StateBlock
          v-if="isLoading"
          type="loading"
          title="저장 식단 조회 중"
          message="내 저장 식단을 불러오고 있습니다."
        />
        <StateBlock v-else-if="errorMessage" type="error" title="조회 실패" :message="errorMessage" />

        <template v-else>
          <article v-for="meal in savedMeals" :key="meal.id" class="surface-card">
            <div class="section-heading-row">
              <div>
                <p class="section-label">{{ meal.totalCalories }} kcal</p>
                <h2>{{ meal.name }}</h2>
              </div>
              <div class="button-row">
                <button class="btn btn-secondary" type="button" @click="startEditSavedMeal(meal)">수정</button>
                <button class="btn btn-secondary" type="button" @click="removeSavedMeal(meal.id)">삭제</button>
              </div>
            </div>
            <p class="card-description">{{ meal.description || '설명 없음' }}</p>
            <ul>
              <li v-for="item in meal.items" :key="item.id">
                {{ item.foodName }} {{ item.amount }}g · {{ item.calories }} kcal
              </li>
            </ul>
            <div class="button-row">
              <button class="btn btn-primary" type="button" @click="createMeal(meal, 'breakfast')">아침 기록</button>
              <button class="btn btn-primary" type="button" @click="createMeal(meal, 'lunch')">점심 기록</button>
              <button class="btn btn-primary" type="button" @click="createMeal(meal, 'dinner')">저녁 기록</button>
            </div>
          </article>

          <div v-if="savedMeals.length > 0" class="surface-card pagination-panel">
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasPrevious || isLoading" @click="fetchSavedMeals(pagination.page - 1)">
              이전
            </button>
            <strong>{{ pagination.page }} / {{ pagination.totalPages }}</strong>
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasNext || isLoading" @click="fetchSavedMeals(pagination.page + 1)">
              다음
            </button>
          </div>

          <StateBlock
            v-if="savedMeals.length === 0"
            type="empty"
            title="저장 식단이 없습니다"
            message="왼쪽에서 자주 먹는 식단을 저장해보세요."
          />
        </template>
      </section>
    </section>
  </main>
</template>
