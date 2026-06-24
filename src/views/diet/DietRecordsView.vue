<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import {
  addMealItem,
  createMeal,
  deleteMeal,
  deleteMealItem,
  getFood,
  getFoods,
  getMeal,
  getMealsPage,
  updateMeal,
  updateMealItem,
} from '@/api/diet'
import { useToastStore } from '@/stores/toast'

const route = useRoute()
const mealTypes = [
  { label: '아침', value: 'breakfast' },
  { label: '점심', value: 'lunch' },
  { label: '저녁', value: 'dinner' },
  { label: '간식', value: 'snack' },
]

const today = new Date().toISOString().slice(0, 10)
const form = reactive({
  intakeDate: today,
  mealType: 'breakfast',
  mealOrder: 1,
  mealLabel: '아침',
})

const detailForm = reactive({
  mealType: 'breakfast',
  mealOrder: 1,
  mealLabel: '',
  intakeDate: today,
})

const detailNewItem = reactive({
  foodId: '',
  amount: 100,
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
const selectedMeal = ref(null)
const editingAmounts = reactive({})
const isLoading = ref(false)
const isSaving = ref(false)
const isDetailLoading = ref(false)
const isDetailSaving = ref(false)
const deletingMealId = ref(null)
const pendingDeleteMealId = ref(null)
const formMessage = ref('')
const detailMessage = ref('')
const errorMessage = ref('')
const toastStore = useToastStore()

const selectedFood = computed(() => foods.value.find((food) => food.id === Number(selectedFoodId.value)))
const detailSelectedFood = computed(() => foods.value.find((food) => food.id === Number(detailNewItem.foodId)))
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

function defaultMealLabel(mealType, mealOrder) {
  const base = mealTypeLabel(mealType)
  return Number(mealOrder || 1) <= 4 ? base : `${mealOrder}번째 식사`
}

function syncLabelFromType() {
  form.mealLabel = defaultMealLabel(form.mealType, form.mealOrder)
}

function hydrateDetailForm(meal) {
  detailForm.mealType = meal.mealType || 'breakfast'
  detailForm.mealOrder = meal.mealOrder || 1
  detailForm.mealLabel = meal.mealLabel || defaultMealLabel(detailForm.mealType, detailForm.mealOrder)
  detailForm.intakeDate = meal.intakeDate || form.intakeDate
  Object.keys(editingAmounts).forEach((key) => delete editingAmounts[key])
  meal.mealItems.forEach((item) => {
    editingAmounts[item.id] = item.amount
  })
}

async function fetchFoods() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    foods.value = await getFoods(foodSearch.value.trim() ? { search: foodSearch.value.trim(), page_size: 50 } : { page_size: 50 })
    if (!foods.value.some((food) => food.id === Number(selectedFoodId.value))) {
      selectedFoodId.value = foods.value[0]?.id || ''
    }
    if (!foods.value.some((food) => food.id === Number(detailNewItem.foodId))) {
      detailNewItem.foodId = foods.value[0]?.id || ''
    }
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

async function applyRouteFoodSelection() {
  const routeFoodId = Number(route.query.foodId || 0)
  if (!routeFoodId) return

  try {
    const food = await getFood(routeFoodId)
    if (!foods.value.some((candidate) => candidate.id === food.id)) {
      foods.value = [food, ...foods.value]
    }
    selectedFoodId.value = food.id
    foodSearch.value = food.name || String(route.query.foodName || '')
  } catch (error) {
    if (route.query.foodName) foodSearch.value = String(route.query.foodName)
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
    if (selectedMeal.value && !meals.value.some((meal) => meal.id === selectedMeal.value.id)) {
      selectedMeal.value = null
    }
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  }
}

function addMealItemToDraft() {
  formMessage.value = ''

  if (!selectedFood.value || Number(amount.value) <= 0) {
    formMessage.value = '음식과 섭취량을 확인해주세요.'
    return
  }

  mealItems.value.push({
    id: `${selectedFood.value.id}-${Date.now()}`,
    food: selectedFood.value,
    amount: Number(amount.value),
  })
}

function removeMealItemFromDraft(itemId) {
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
      mealOrder: Number(form.mealOrder || 1),
      mealLabel: form.mealLabel.trim() || defaultMealLabel(form.mealType, form.mealOrder),
      intakeDate: form.intakeDate,
      items: mealItems.value.map((item) => ({
        foodId: item.food.id,
        amount: item.amount,
      })),
    })
    mealItems.value = []
    formMessage.value = '식단 기록이 저장되었습니다.'
    toastStore.success('식단 저장 완료', '선택한 날짜의 식단 기록에 반영했습니다.')
    await fetchMeals(1)
  } catch (error) {
    formMessage.value = normalizeCaughtError(error).message
  } finally {
    isSaving.value = false
  }
}

async function loadMealDetail(mealId) {
  detailMessage.value = ''
  isDetailLoading.value = true

  try {
    selectedMeal.value = await getMeal(mealId)
    hydrateDetailForm(selectedMeal.value)
  } catch (error) {
    detailMessage.value = normalizeCaughtError(error).message
  } finally {
    isDetailLoading.value = false
  }
}

async function saveMealMeta() {
  if (!selectedMeal.value) return
  detailMessage.value = ''
  isDetailSaving.value = true

  try {
    selectedMeal.value = await updateMeal(selectedMeal.value.id, {
      mealType: detailForm.mealType,
      mealOrder: Number(detailForm.mealOrder || 1),
      mealLabel: detailForm.mealLabel.trim() || defaultMealLabel(detailForm.mealType, detailForm.mealOrder),
      intakeDate: detailForm.intakeDate,
    })
    hydrateDetailForm(selectedMeal.value)
    detailMessage.value = '식단 정보가 수정되었습니다.'
    await fetchMeals(pagination.page)
  } catch (error) {
    detailMessage.value = normalizeCaughtError(error).message
  } finally {
    isDetailSaving.value = false
  }
}

async function addItemToSelectedMeal() {
  if (!selectedMeal.value) return
  detailMessage.value = ''

  if (!detailSelectedFood.value || Number(detailNewItem.amount) <= 0) {
    detailMessage.value = '추가할 음식과 섭취량을 확인해주세요.'
    return
  }

  isDetailSaving.value = true

  try {
    await addMealItem(selectedMeal.value.id, {
      foodId: Number(detailNewItem.foodId),
      amount: Number(detailNewItem.amount),
    })
    selectedMeal.value = await getMeal(selectedMeal.value.id)
    hydrateDetailForm(selectedMeal.value)
    detailNewItem.amount = 100
    detailMessage.value = '음식이 추가되었습니다.'
    await fetchMeals(pagination.page)
  } catch (error) {
    detailMessage.value = normalizeCaughtError(error).message
  } finally {
    isDetailSaving.value = false
  }
}

async function saveItemAmount(itemId) {
  if (!selectedMeal.value) return
  detailMessage.value = ''

  const nextAmount = Number(editingAmounts[itemId])
  if (nextAmount <= 0) {
    detailMessage.value = '섭취량은 0보다 커야 합니다.'
    return
  }

  isDetailSaving.value = true

  try {
    await updateMealItem(itemId, { amount: nextAmount })
    selectedMeal.value = await getMeal(selectedMeal.value.id)
    hydrateDetailForm(selectedMeal.value)
    detailMessage.value = '섭취량이 수정되었습니다.'
    await fetchMeals(pagination.page)
  } catch (error) {
    detailMessage.value = normalizeCaughtError(error).message
  } finally {
    isDetailSaving.value = false
  }
}

async function removeItemFromSelectedMeal(itemId) {
  if (!selectedMeal.value) return
  detailMessage.value = ''
  isDetailSaving.value = true

  try {
    await deleteMealItem(itemId)
    selectedMeal.value = await getMeal(selectedMeal.value.id)
    hydrateDetailForm(selectedMeal.value)
    detailMessage.value = '음식이 삭제되었습니다.'
    await fetchMeals(pagination.page)
  } catch (error) {
    detailMessage.value = normalizeCaughtError(error).message
  } finally {
    isDetailSaving.value = false
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
    if (selectedMeal.value?.id === mealId) selectedMeal.value = null
    formMessage.value = '식단 기록이 삭제되었습니다.'
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
  selectedMeal.value = null
  await fetchMeals(1)
}

onMounted(async () => {
  await fetchFoods()
  await applyRouteFoodSelection()
  await fetchMeals(1)
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet"
      title="식사 기록"
      description="날짜와 식사 순서를 기준으로 실제 섭취 음식을 기록하고 상세 항목을 관리합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 5; align-self: start" @submit.prevent="saveMeal">
        <div class="field-group">
          <label for="intake-date">섭취 날짜</label>
          <input id="intake-date" v-model="form.intakeDate" type="date" @change="handleDateChange" />
        </div>

        <div class="content-grid compact-form-grid">
          <div class="field-group" style="grid-column: span 6">
            <label for="meal-type">식사 유형</label>
            <select id="meal-type" v-model="form.mealType" @change="syncLabelFromType">
              <option v-for="type in mealTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>

          <div class="field-group" style="grid-column: span 6">
            <label for="meal-order">식사 순서</label>
            <input id="meal-order" v-model.number="form.mealOrder" type="number" min="1" max="6" @change="syncLabelFromType" />
          </div>
        </div>

        <div class="field-group">
          <label for="meal-label">식사 이름</label>
          <input id="meal-label" v-model="form.mealLabel" type="text" placeholder="예: 운동 후 식사" />
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
            <option value="">선택</option>
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

        <button class="btn btn-secondary" type="button" @click="addMealItemToDraft">음식 추가</button>

        <div class="meal-list">
          <article v-for="item in mealItems" :key="item.id" class="meal-item">
            <div>
              <strong>{{ item.food.name }}</strong>
              <span>{{ item.amount }}g · {{ formatNumber(calculateNutrition(item.food, item.amount).calories) }}kcal</span>
            </div>
            <button type="button" @click="removeMealItemFromDraft(item.id)">제외</button>
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
              <strong>{{ meal.mealLabel || mealTypeLabel(meal.mealType) }}</strong>
              <span>{{ meal.mealOrder || 1 }}번째 · {{ mealTypeLabel(meal.mealType) }} · {{ formatNumber(meal.totalCalories) }}kcal</span>
              <span v-for="item in meal.mealItems" :key="item.id">
                {{ item.foodName }} {{ item.amount }}g
              </span>
            </div>
            <div class="delete-actions">
              <span>{{ meal.intakeDate }}</span>
              <button type="button" @click="loadMealDetail(meal.id)">상세</button>
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
            <!-- <a class="btn btn-primary" href="#food-search">음식 추가하기</a>
            <RouterLink class="btn btn-secondary" to="/foods">음식 데이터 보기</RouterLink> -->
          </StateBlock>
        </div>
      </section>

      <section class="surface-card" style="grid-column: span 12">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Meal Detail</p>
            <h2>{{ selectedMeal ? `${selectedMeal.mealLabel || mealTypeLabel(selectedMeal.mealType)} 상세 관리` : '식단을 선택하세요' }}</h2>
          </div>
          <span v-if="selectedMeal" class="chip">{{ formatNumber(selectedMeal.totalCalories) }}kcal</span>
        </div>

        <StateBlock
          v-if="isDetailLoading"
          type="loading"
          title="식단 상세 조회 중"
          message="선택한 식단의 음식 항목을 불러오고 있습니다."
        />

        <StateBlock
          v-else-if="!selectedMeal"
          type="empty"
          title="상세 관리할 식단이 없습니다"
          message="위 목록에서 상세 버튼을 누르면 음식 추가, 섭취량 수정, 삭제를 할 수 있습니다."
        />

        <template v-else>
          <form class="content-grid compact-form-grid" @submit.prevent="saveMealMeta">
            <div class="field-group" style="grid-column: span 3">
              <label for="detail-date">날짜</label>
              <input id="detail-date" v-model="detailForm.intakeDate" type="date" />
            </div>
            <div class="field-group" style="grid-column: span 3">
              <label for="detail-type">식사 유형</label>
              <select id="detail-type" v-model="detailForm.mealType">
                <option v-for="type in mealTypes" :key="type.value" :value="type.value">
                  {{ type.label }}
                </option>
              </select>
            </div>
            <div class="field-group" style="grid-column: span 2">
              <label for="detail-order">순서</label>
              <input id="detail-order" v-model.number="detailForm.mealOrder" type="number" min="1" max="6" />
            </div>
            <div class="field-group" style="grid-column: span 3">
              <label for="detail-label">이름</label>
              <input id="detail-label" v-model="detailForm.mealLabel" type="text" />
            </div>
            <button class="btn btn-primary" style="grid-column: span 1" type="submit" :disabled="isDetailSaving">
              저장
            </button>
          </form>

          <div class="totals-panel">
            <article>
              <span>칼로리</span>
              <strong>{{ formatNumber(selectedMeal.totalCalories) }}kcal</strong>
            </article>
            <article>
              <span>탄수화물</span>
              <strong>{{ formatNumber(selectedMeal.totalCarbohydrate) }}g</strong>
            </article>
            <article>
              <span>단백질</span>
              <strong>{{ formatNumber(selectedMeal.totalProtein) }}g</strong>
            </article>
            <article>
              <span>지방</span>
              <strong>{{ formatNumber(selectedMeal.totalFat) }}g</strong>
            </article>
          </div>

          <div class="content-grid compact-form-grid" style="margin-top: 1rem">
            <div class="field-group" style="grid-column: span 5">
              <label for="detail-food">추가 음식</label>
              <select id="detail-food" v-model="detailNewItem.foodId">
                <option value="">선택</option>
                <option v-for="food in foods" :key="food.id" :value="food.id">{{ food.name }}</option>
              </select>
            </div>
            <div class="field-group" style="grid-column: span 3">
              <label for="detail-amount">섭취량(g)</label>
              <input id="detail-amount" v-model.number="detailNewItem.amount" type="number" min="1" />
            </div>
            <button class="btn btn-secondary" style="grid-column: span 4" type="button" :disabled="isDetailSaving" @click="addItemToSelectedMeal">
              선택 식단에 음식 추가
            </button>
          </div>

          <div class="meal-list" style="margin-top: 1rem">
            <article v-for="item in selectedMeal.mealItems" :key="item.id" class="meal-item">
              <div>
                <strong>{{ item.foodName }}</strong>
                <span>{{ formatNumber(item.calories) }}kcal · 탄수 {{ formatNumber(item.carbohydrate) }}g · 단백질 {{ formatNumber(item.protein) }}g · 지방 {{ formatNumber(item.fat) }}g</span>
              </div>
              <div class="delete-actions">
                <input v-model.number="editingAmounts[item.id]" type="number" min="1" style="width: 110px" />
                <button type="button" :disabled="isDetailSaving" @click="saveItemAmount(item.id)">수정</button>
                <button type="button" :disabled="isDetailSaving" @click="removeItemFromSelectedMeal(item.id)">삭제</button>
              </div>
            </article>
          </div>

          <p v-if="detailMessage" class="form-message" style="margin-top: 1rem">{{ detailMessage }}</p>
        </template>
      </section>
    </section>
  </main>
</template>
