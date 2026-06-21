<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { createMeal, deleteMeal, getFoods, getMealsPage } from '@/api/diet'
import { useToastStore } from '@/stores/toast'

const mealTypes = [
  { label: '아침', value: 'breakfast' },
  { label: '점심', value: 'lunch' },
  { label: '저녁', value: 'dinner' },
  { label: '간식', value: 'snack' },
]

const form = reactive({
  intakeDate: new Date().toISOString().slice(0, 10),
  mealType: 'breakfast',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  count: 0,
  totalPages: 1,
  hasNext: false,
  hasPrevious: false,
})

const foodSearch = ref('')
const foods = ref([])
const selectedFoodId = ref('')
const amount = ref(100)
const mealItems = ref([])
const meals = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const deletingMealId = ref(null)
const pendingDeleteMealId = ref(null)
const formMessage = ref('')
const errorMessage = ref('')
const toastStore = useToastStore()

const selectedFood = computed(() => foods.value.find((food) => food.id === Number(selectedFoodId.value)))
const calculatedPreview = computed(() => calculateNutrition(selectedFood.value, amount.value))

const totals = computed(() =>
  mealItems.value.reduce(
    (sum, item) => {
      const nutrition = calculateNutrition(item.food, item.amount)
      return {
        calories: sum.calories + nutrition.calories,
        carbohydrate: sum.carbohydrate + nutrition.carbohydrate,
        protein: sum.protein + nutrition.protein,
        fat: sum.fat + nutrition.fat,
      }
    },
    { calories: 0, carbohydrate: 0, protein: 0, fat: 0 },
  ),
)

const resultSummary = computed(() => {
  if (!pagination.count) return '0개'
  const start = (pagination.page - 1) * pagination.pageSize + 1
  const end = Math.min(start + meals.value.length - 1, pagination.count)
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

function calculateNutrition(food, grams) {
  if (!food) return { calories: 0, carbohydrate: 0, protein: 0, fat: 0 }
  const ratio = Number(grams || 0) / 100
  return {
    calories: food.calories * ratio,
    carbohydrate: food.carbohydrate * ratio,
    protein: food.protein * ratio,
    fat: food.fat * ratio,
  }
}

function formatNumber(value) {
  return Number(value || 0).toFixed(1)
}

function mealTypeLabel(value) {
  return mealTypes.find((type) => type.value === value)?.label || value
}

async function fetchFoods() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    foods.value = await getFoods(foodSearch.value.trim() ? { search: foodSearch.value.trim(), page_size: 50 } : { page_size: 50 })
    if (!selectedFoodId.value && foods.value[0]) selectedFoodId.value = foods.value[0].id
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

async function fetchMeals(page = pagination.page) {
  errorMessage.value = ''

  try {
    const data = await getMealsPage({
      date: form.intakeDate,
      page,
      page_size: pagination.pageSize,
    })
    meals.value = data.results
    syncPagination(data)
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  }
}

function addMealItem() {
  formMessage.value = ''

  if (!selectedFood.value || Number(amount.value) <= 0) {
    formMessage.value = '음식과 섭취량을 확인해주세요.'
    return
  }

  mealItems.value.push({
    id: Date.now(),
    food: selectedFood.value,
    amount: Number(amount.value),
  })
}

function removeMealItem(itemId) {
  mealItems.value = mealItems.value.filter((item) => item.id !== itemId)
}

async function saveMeal() {
  formMessage.value = ''
  pendingDeleteMealId.value = null

  if (mealItems.value.length === 0) {
    formMessage.value = '저장할 음식을 1개 이상 추가해주세요.'
    return
  }

  isSaving.value = true

  try {
    await createMeal({
      mealType: form.mealType,
      intakeDate: form.intakeDate,
      items: mealItems.value.map((item) => ({
        foodId: item.food.id,
        amount: item.amount,
      })),
    })
    mealItems.value = []
    formMessage.value = '식단 기록이 저장되었습니다.'
    toastStore.success('식단 저장 완료', '오늘 식단 기록에 반영했습니다.')
    await fetchMeals(1)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isSaving.value = false
  }
}

async function removeSavedMeal(mealId) {
  formMessage.value = ''

  if (pendingDeleteMealId.value !== mealId) {
    pendingDeleteMealId.value = mealId
    formMessage.value = '삭제하려면 같은 버튼을 한 번 더 눌러주세요.'
    return
  }

  deletingMealId.value = mealId

  try {
    await deleteMeal(mealId)
    formMessage.value = '식단 기록을 삭제했습니다.'
    pendingDeleteMealId.value = null
    await fetchMeals(meals.value.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    deletingMealId.value = null
  }
}

function cancelDelete() {
  pendingDeleteMealId.value = null
  formMessage.value = ''
}

async function handleDateChange() {
  pendingDeleteMealId.value = null
  await fetchMeals(1)
}

onMounted(async () => {
  await fetchFoods()
  await fetchMeals(1)
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet"
      title="식단 기록"
      description="섭취한 음식을 추가하고 날짜별 식단 기록을 저장합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 5" @submit.prevent="saveMeal">
        <div class="field-group">
          <label for="intake-date">섭취 날짜</label>
          <input id="intake-date" v-model="form.intakeDate" type="date" @change="handleDateChange" />
        </div>

        <div class="field-group">
          <label for="meal-type">식사 구분</label>
          <select id="meal-type" v-model="form.mealType">
            <option v-for="type in mealTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="food-search">음식 검색</label>
          <div class="inline-controls">
            <input id="food-search" v-model="foodSearch" type="text" placeholder="닭가슴살, 현미밥" />
            <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="fetchFoods">검색</button>
          </div>
        </div>

        <div class="field-group">
          <label for="food-select">음식 선택</label>
          <select id="food-select" v-model="selectedFoodId">
            <option v-for="food in foods" :key="food.id" :value="food.id">
              {{ food.name }} · {{ formatNumber(food.calories) }}kcal/100g
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="amount">섭취량(g)</label>
          <input id="amount" v-model.number="amount" type="number" inputmode="numeric" min="1" step="1" placeholder="100" />
        </div>

        <div class="preview-panel">
          <p class="section-label">예상 영양</p>
          <strong>{{ formatNumber(calculatedPreview.calories) }}kcal</strong>
          <span>
            탄수 {{ formatNumber(calculatedPreview.carbohydrate) }}g · 단백질
            {{ formatNumber(calculatedPreview.protein) }}g · 지방 {{ formatNumber(calculatedPreview.fat) }}g
          </span>
        </div>

        <button class="btn btn-secondary" type="button" @click="addMealItem">음식 추가</button>

        <div class="meal-list">
          <article v-for="item in mealItems" :key="item.id" class="meal-item">
            <div>
              <strong>{{ item.food.name }}</strong>
              <span>{{ item.amount }}g · {{ formatNumber(calculateNutrition(item.food, item.amount).calories) }}kcal</span>
            </div>
            <button type="button" @click="removeMealItem(item.id)">제외</button>
          </article>
        </div>

        <div class="totals-panel">
          <article>
            <span>칼로리</span>
            <strong>{{ formatNumber(totals.calories) }}kcal</strong>
          </article>
          <article>
            <span>탄수화물</span>
            <strong>{{ formatNumber(totals.carbohydrate) }}g</strong>
          </article>
          <article>
            <span>단백질</span>
            <strong>{{ formatNumber(totals.protein) }}g</strong>
          </article>
          <article>
            <span>지방</span>
            <strong>{{ formatNumber(totals.fat) }}g</strong>
          </article>
        </div>

        <button class="btn btn-primary" type="submit" :disabled="isSaving">
          {{ isSaving ? '저장 중...' : '식단 기록 저장' }}
        </button>
        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
        <div class="button-row">
          <RouterLink class="btn btn-secondary" to="/diet/evaluation">AI 식단 평가</RouterLink>
          <RouterLink class="btn btn-secondary" to="/diet/recommend">AI 식단 추천</RouterLink>
          <RouterLink class="btn btn-secondary" to="/saved-meals">저장 식단 관리</RouterLink>
        </div>
      </form>

      <section class="surface-card" style="grid-column: span 7">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Saved Meals</p>
            <h2>{{ form.intakeDate }} 식단</h2>
          </div>
          <span class="chip">{{ resultSummary }}</span>
        </div>

        <StateBlock
          v-if="errorMessage"
          type="error"
          title="식단 데이터를 불러오지 못했습니다"
          :message="errorMessage"
        />

        <div v-else class="meal-list">
          <article v-for="meal in meals" :key="meal.id" class="meal-item">
            <div>
              <strong>{{ mealTypeLabel(meal.mealType) }}</strong>
              <span>{{ formatNumber(meal.totalCalories) }}kcal</span>
              <span v-for="item in meal.mealItems" :key="item.id">
                {{ item.foodName }} {{ item.amount }}g
              </span>
            </div>
            <div class="delete-actions">
              <span>{{ meal.intakeDate }}</span>
              <button
                type="button"
                :class="{ 'is-danger': pendingDeleteMealId === meal.id }"
                :disabled="deletingMealId === meal.id"
                @click="removeSavedMeal(meal.id)"
              >
                {{
                  deletingMealId === meal.id
                    ? '삭제 중...'
                    : pendingDeleteMealId === meal.id
                      ? '확인 삭제'
                      : '삭제'
                }}
              </button>
              <button v-if="pendingDeleteMealId === meal.id" type="button" @click="cancelDelete">취소</button>
            </div>
          </article>

          <div v-if="pagination.totalPages > 1" class="pagination-panel">
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasPrevious" @click="fetchMeals(pagination.page - 1)">
              이전
            </button>
            <span>{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button class="btn btn-secondary" type="button" :disabled="!pagination.hasNext" @click="fetchMeals(pagination.page + 1)">
              다음
            </button>
          </div>

          <StateBlock
            v-if="meals.length === 0"
            type="empty"
            title="저장된 식단이 없습니다"
            message="왼쪽에서 음식을 추가하고 식단을 저장해보세요."
          >
            <a class="btn btn-primary" href="#food-search">음식 추가하기</a>
            <RouterLink class="btn btn-secondary" to="/foods">음식 데이터 보기</RouterLink>
          </StateBlock>
        </div>
      </section>
    </section>
  </main>
</template>
