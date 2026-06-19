<script setup>
import { computed, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { mockFoods } from '@/data/mockData'

const mealTypes = [
  { label: '아침', value: 'breakfast' },
  { label: '점심', value: 'lunch' },
  { label: '저녁', value: 'dinner' },
  { label: '간식', value: 'snack' },
]

const selectedMealType = ref('breakfast')
const selectedFoodId = ref(mockFoods[0].id)
const amount = ref(100)

const mealItems = reactive([
  { id: 1, foodId: 3, amount: 180 },
  { id: 2, foodId: 2, amount: 120 },
])

const selectedFood = computed(() => mockFoods.find((food) => food.id === Number(selectedFoodId.value)))

const calculatedPreview = computed(() => calculateNutrition(selectedFood.value, amount.value))

const totals = computed(() =>
  mealItems.reduce(
    (sum, item) => {
      const food = mockFoods.find((entry) => entry.id === item.foodId)
      const nutrition = calculateNutrition(food, item.amount)

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
  return Number(value).toFixed(1)
}

function addMealItem() {
  if (!selectedFood.value || Number(amount.value) <= 0) return

  mealItems.push({
    id: Date.now(),
    foodId: selectedFood.value.id,
    amount: Number(amount.value),
  })
}

function removeMealItem(itemId) {
  const itemIndex = mealItems.findIndex((item) => item.id === itemId)
  if (itemIndex >= 0) {
    mealItems.splice(itemIndex, 1)
  }
}

function getFood(foodId) {
  return mockFoods.find((food) => food.id === foodId)
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet"
      title="식단 기록"
      description="음식 영양성분은 100g 기준이며, 섭취량은 g 단위로 계산합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 5">
        <div class="field-group">
          <label for="meal-type">식사 유형</label>
          <select id="meal-type" v-model="selectedMealType">
            <option v-for="type in mealTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div class="field-group">
          <label for="food">음식</label>
          <select id="food" v-model="selectedFoodId">
            <option v-for="food in mockFoods" :key="food.id" :value="food.id">
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

        <button class="btn btn-primary" type="button" @click="addMealItem">음식 추가</button>
      </form>

      <section class="surface-card" style="grid-column: span 7">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Today</p>
            <h2>기록된 음식</h2>
          </div>
          <span class="chip">{{ mealItems.length }}개 항목</span>
        </div>

        <div class="meal-list">
          <article v-for="item in mealItems" :key="item.id" class="meal-item">
            <div>
              <strong>{{ getFood(item.foodId)?.name }}</strong>
              <span>{{ item.amount }}g</span>
            </div>
            <div>
              <strong>{{ formatNumber(calculateNutrition(getFood(item.foodId), item.amount).calories) }} kcal</strong>
              <button type="button" @click="removeMealItem(item.id)">삭제</button>
            </div>
          </article>
        </div>

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
    </section>
  </main>
</template>
