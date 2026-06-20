<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { createMeal, deleteMeal, getFoods, getMeals } from '@/api/diet'

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

const foodSearch = ref('')
const foods = ref([])
const selectedFoodId = ref('')
const amount = ref(100)
const mealItems = ref([])
const meals = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const deletingMealId = ref(null)
const formMessage = ref('')
const errorMessage = ref('')

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

function calculateNutrition(food, grams) {
  if (!food) {
    return { calories: 0, carbohydrate: 0, protein: 0, fat: 0 }
  }

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
    foods.value = await getFoods(foodSearch.value.trim() ? { search: foodSearch.value.trim() } : {})
    if (!selectedFoodId.value && foods.value[0]) {
      selectedFoodId.value = foods.value[0].id
    }
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

async function fetchMeals() {
  try {
    meals.value = await getMeals({ date: form.intakeDate })
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    errorMessage.value = apiError.message
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
    await fetchMeals()
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    isSaving.value = false
  }
}

async function removeSavedMeal(mealId) {
  deletingMealId.value = mealId
  formMessage.value = ''

  try {
    await deleteMeal(mealId)
    formMessage.value = '식단 기록이 삭제되었습니다.'
    await fetchMeals()
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    formMessage.value = apiError.message
  } finally {
    deletingMealId.value = null
  }
}

async function handleDateChange() {
  await fetchMeals()
}

onMounted(async () => {
  await fetchFoods()
  await fetchMeals()
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet"
      title="식단 기록"
      description="음식 영양성분은 100g 기준이며, 섭취량에 맞춰 자동 계산됩니다."
    />

    <StateBlock
      v-if="isLoading && foods.length === 0"
      type="loading"
      title="음식 목록을 불러오는 중입니다"
      message="식단 기록에 사용할 음식 데이터를 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="식단 데이터를 불러오지 못했습니다"
      :message="errorMessage"
    />

    <section v-else class="content-grid">
      <form class="form-card" style="grid-column: span 5" @submit.prevent="saveMeal">
        <div class="content-grid">
          <div class="field-group" style="grid-column: span 6">
            <label for="intake-date">날짜</label>
            <input id="intake-date" v-model="form.intakeDate" type="date" @change="handleDateChange" />
          </div>

          <div class="field-group" style="grid-column: span 6">
            <label for="meal-type">식사 유형</label>
            <select id="meal-type" v-model="form.mealType">
              <option v-for="type in mealTypes" :key="type.value" :value="type.value">
                {{ type.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="field-group">
          <label for="food-search">음식 검색</label>
          <div class="button-row">
            <input id="food-search" v-model="foodSearch" type="text" placeholder="닭가슴살, 현미밥, 바나나" />
            <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="fetchFoods">검색</button>
          </div>
        </div>

        <div class="field-group">
          <label for="food">음식</label>
          <select id="food" v-model="selectedFoodId">
            <option v-for="food in foods" :key="food.id" :value="food.id">
              {{ food.name }} · {{ food.category }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="amount">섭취량(g)</label>
          <input id="amount" v-model.number="amount" type="number" min="1" />
        </div>

        <div class="nutrition-preview">
          <span>추가 예정</span>
          <strong>{{ formatNumber(calculatedPreview.calories) }} kcal</strong>
          <p>
            탄 {{ formatNumber(calculatedPreview.carbohydrate) }}g · 단
            {{ formatNumber(calculatedPreview.protein) }}g · 지
            {{ formatNumber(calculatedPreview.fat) }}g
          </p>
        </div>

        <div class="button-row">
          <button class="btn btn-secondary" type="button" @click="addMealItem">음식 추가</button>
          <button class="btn btn-primary" type="submit" :disabled="isSaving">
            {{ isSaving ? '저장 중...' : '식단 저장' }}
          </button>
        </div>

        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>
      </form>

      <section class="surface-card" style="grid-column: span 7">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Draft</p>
            <h2>저장할 음식</h2>
          </div>
          <span class="chip">{{ mealItems.length }}개 항목</span>
        </div>

        <div class="meal-list">
          <article v-for="item in mealItems" :key="item.id" class="meal-item">
            <div>
              <strong>{{ item.food.name }}</strong>
              <span>{{ item.amount }}g</span>
            </div>
            <div>
              <strong>{{ formatNumber(calculateNutrition(item.food, item.amount).calories) }} kcal</strong>
              <button type="button" @click="removeMealItem(item.id)">삭제</button>
            </div>
          </article>
        </div>

        <StateBlock
          v-if="mealItems.length === 0"
          type="empty"
          title="아직 추가한 음식이 없습니다"
          message="왼쪽에서 음식과 섭취량을 선택한 뒤 음식 추가를 눌러주세요."
        />

        <div class="totals-panel">
          <article>
            <span>총 칼로리</span>
            <strong>{{ formatNumber(totals.calories) }} kcal</strong>
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
      </section>

      <section class="surface-card" style="grid-column: 1 / -1">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Saved</p>
            <h2>{{ form.intakeDate }} 식단 기록</h2>
          </div>
          <span class="chip">{{ meals.length }}개 기록</span>
        </div>

        <div class="meal-list">
          <article v-for="meal in meals" :key="meal.id" class="meal-item">
            <div>
              <strong>{{ mealTypeLabel(meal.mealType) }}</strong>
              <span>{{ meal.mealItems.map((item) => `${item.foodName} ${item.amount}g`).join(', ') }}</span>
            </div>
            <div>
              <strong>{{ formatNumber(meal.totalCalories) }} kcal</strong>
              <button type="button" :disabled="deletingMealId === meal.id" @click="removeSavedMeal(meal.id)">
                {{ deletingMealId === meal.id ? '삭제 중...' : '삭제' }}
              </button>
            </div>
          </article>
        </div>

        <StateBlock
          v-if="meals.length === 0"
          type="empty"
          title="저장된 식단 기록이 없습니다"
          message="식단을 저장하면 이곳에 표시됩니다."
        />
      </section>
    </section>
  </main>
</template>
