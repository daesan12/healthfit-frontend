<script setup>
import { computed, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import {
  createSavedMeal,
  recommendDiet,
  replaceDietRecommendationFood,
  rerollDietRecommendation,
  saveDietRecommendation,
} from '@/api/diet'

const targetDate = ref(new Date().toISOString().slice(0, 10))
const mealCount = ref(3)
const foodSource = ref('all')
const preference = ref('고단백, 조리 간단한 한식 식단')
const recommendation = ref(null)
const isLoading = ref(false)
const isReplacing = ref(false)
const isRerolling = ref(false)
const requestMessage = ref('')
const replaceMessage = ref('')
const rerollMessage = ref('')
const saveMessage = ref('')
const isSavingSelected = ref(false)
const selectedReplacement = ref(null)
const replacementCondition = ref('비슷한 영양의 다른 음식으로 바꿔줘')
const rerollCondition = ref('기존 조건은 유지하고 조리가 더 쉬운 구성으로 다시 추천해줘')
const saveForms = reactive({})
const savingMealOrders = reactive({})
const foodSourceOptions = [
  {
    value: 'all',
    label: 'DB 음식 기준 추천',
    description: 'HealthFit 음식 DB와 내 음식을 함께 후보로 사용합니다.',
  },
  {
    value: 'my_fridge',
    label: '내 음식 기준 추천',
    description: '직접 추가한 내 음식만 후보로 사용합니다.',
  },
  {
    value: 'free',
    label: 'AI 자유 추천',
    description: 'DB 후보 제한 없이 현실적인 식단을 자유롭게 추천합니다.',
  },
]

const selectedFoodSourceOption = computed(() =>
  foodSourceOptions.find((option) => option.value === foodSource.value) || foodSourceOptions[0],
)

const recommendationFoodSourceOption = computed(() =>
  foodSourceOptions.find((option) => option.value === recommendation.value?.foodSource) || selectedFoodSourceOption.value,
)

const isFreeRecommendation = computed(() => recommendation.value?.foodSource === 'free')

function buildDietRecommendationMessage() {
  const condition = preference.value.trim() || '균형 잡힌 건강 식단'

  return [
    'HealthFit 식단 추천 요청입니다.',
    `${targetDate.value} 기준으로 ${mealCount.value}끼 식단을 추천해주세요.`,
    '목표는 건강한 영양 구성, 적절한 칼로리, 충분한 단백질 섭취입니다.',
    `사용자 선호 조건: ${condition}`,
  ].join(' ')
}

function resetSaveForms() {
  Object.keys(saveForms).forEach((key) => delete saveForms[key])
  Object.keys(savingMealOrders).forEach((key) => delete savingMealOrders[key])

  ;(recommendation.value?.meals || []).forEach((meal) => {
    saveForms[meal.mealOrder] = {
      shouldSave: false,
      title: meal.mealType || `${meal.mealOrder}번째 식단`,
      description: preference.value,
      message: '',
    }
  })
}

function resetAiEditMessages() {
  replaceMessage.value = ''
  rerollMessage.value = ''
  selectedReplacement.value = null
}

async function requestRecommendation() {
  requestMessage.value = ''
  saveMessage.value = ''
  resetAiEditMessages()
  isLoading.value = true

  try {
    recommendation.value = await recommendDiet({
      scope: 'day',
      target_date: targetDate.value,
      meal_count: Number(mealCount.value || 1),
      food_source: foodSource.value,
      message: buildDietRecommendationMessage(),
      preference: preference.value,
    })
    resetSaveForms()
  } catch (error) {
    requestMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

function startReplacement(meal, food) {
  selectedReplacement.value = {
    mealOrder: meal.mealOrder,
    mealType: meal.mealType,
    food,
  }
  replacementCondition.value = `${food.name} 대신 비슷한 영양의 다른 음식으로 바꿔줘`
  replaceMessage.value = ''
}

function cancelReplacement() {
  selectedReplacement.value = null
  replacementCondition.value = '비슷한 영양의 다른 음식으로 바꿔줘'
}

async function submitReplacement() {
  if (!recommendation.value?.id || !selectedReplacement.value) return

  const food = selectedReplacement.value.food
  if (!food.foodId && !food.aiFoodKey) {
    replaceMessage.value = '교체할 음식 정보를 찾을 수 없습니다.'
    return
  }

  isReplacing.value = true
  replaceMessage.value = ''

  try {
    recommendation.value = await replaceDietRecommendationFood(recommendation.value.id, {
      mealOrder: selectedReplacement.value.mealOrder,
      replaceFoodId: food.foodId,
      replaceAiFoodKey: food.aiFoodKey,
      message: replacementCondition.value.trim(),
    })
    resetSaveForms()
    cancelReplacement()
    replaceMessage.value = '선택한 음식을 교체한 추천을 생성했습니다.'
  } catch (error) {
    replaceMessage.value = normalizeCaughtError(error).message
  } finally {
    isReplacing.value = false
  }
}

async function submitReroll() {
  if (!recommendation.value?.id) {
    rerollMessage.value = '먼저 AI 추천을 생성해주세요.'
    return
  }

  if (!rerollCondition.value.trim()) {
    rerollMessage.value = '재추천 조건을 입력해주세요.'
    return
  }

  isRerolling.value = true
  rerollMessage.value = ''
  selectedReplacement.value = null

  try {
    recommendation.value = await rerollDietRecommendation(recommendation.value.id, {
      message: rerollCondition.value.trim(),
    })
    resetSaveForms()
    rerollMessage.value = '기존 조건을 기반으로 새 추천을 생성했습니다.'
  } catch (error) {
    rerollMessage.value = normalizeCaughtError(error).message
  } finally {
    isRerolling.value = false
  }
}

async function saveSelectedMeals() {
  saveMessage.value = ''

  const selectedMeals = (recommendation.value?.meals || []).filter((meal) => saveForms[meal.mealOrder]?.shouldSave)
  if (!selectedMeals.length) {
    saveMessage.value = '저장할 식사를 체크해주세요.'
    return
  }

  isSavingSelected.value = true

  if (isFreeRecommendation.value) {
    let savedCount = 0

    try {
      for (const meal of selectedMeals) {
        const form = saveForms[meal.mealOrder]
        await saveDietRecommendation(recommendation.value.id, {
          save_target: 'saved_meal',
          meal_orders: [meal.mealOrder],
          title: form?.title?.trim() || meal.mealType || recommendation.value.title,
          description: form?.description?.trim() || preference.value,
        })
        savedCount += 1
        if (form) form.message = '저장 식단으로 저장했습니다.'
      }
      saveMessage.value = `${selectedMeals.length}개 AI 자유 추천 식사를 저장 식단으로 저장했습니다.`
    } catch (error) {
      saveMessage.value = normalizeCaughtError(error).message
    } finally {
      isSavingSelected.value = false
    }
    return
  }

  let savedCount = 0

  try {
    for (const meal of selectedMeals) {
      const saved = await saveMealAsSavedMeal(meal)
      if (saved) savedCount += 1
    }
    saveMessage.value = `${savedCount}개 식사를 저장 식단으로 저장했습니다.`
  } finally {
    isSavingSelected.value = false
  }
}

async function saveMealAsSavedMeal(meal) {
  const form = saveForms[meal.mealOrder]
  if (!form) return

  form.message = ''
  const items = meal.foods
    .filter((food) => food.foodId)
    .map((food) => ({
      foodId: food.foodId,
      amount: food.amount,
    }))

  if (!items.length) {
    form.message = '저장 가능한 DB 음식이 없습니다.'
    return false
  }

  savingMealOrders[meal.mealOrder] = true

  try {
    await createSavedMeal({
      name: form.title.trim() || meal.mealType || `${meal.mealOrder}번째 식단`,
      description: form.description.trim(),
      items,
    })
    form.shouldSave = true
    form.message = '저장 식단으로 저장했습니다.'
    return true
  } catch (error) {
    form.message = normalizeCaughtError(error).message
    return false
  } finally {
    savingMealOrders[meal.mealOrder] = false
  }
}

watch(recommendation, (nextRecommendation) => {
  if (nextRecommendation) resetSaveForms()
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet AI"
      title="AI 식단 추천"
      description="원하는 끼니 수만큼 추천받고, 필요한 끼니만 저장 식단으로 저장합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4; align-self: start" @submit.prevent="requestRecommendation">
        <div class="field-group">
          <label for="target-date">추천 기준 날짜</label>
          <input id="target-date" v-model="targetDate" type="date" />
        </div>

        <div class="field-group">
          <label for="meal-count">추천받을 끼니 수</label>
          <select id="meal-count" v-model.number="mealCount">
            <option v-for="count in 6" :key="count" :value="count">{{ count }}끼</option>
          </select>
        </div>

        <div class="field-group">
          <label for="food-source">음식 소스</label>
          <select id="food-source" v-model="foodSource">
            <option v-for="option in foodSourceOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
          <span class="meta-text">{{ selectedFoodSourceOption.description }}</span>
        </div>

        <div class="field-group">
          <label for="preference">선호 조건</label>
          <textarea id="preference" v-model="preference" />
        </div>

        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '추천 생성 중...' : 'AI 추천 받기' }}
        </button>
      </form>

      <section class="surface-card recommendation-panel" style="grid-column: span 8">
        <StateBlock
          v-if="requestMessage"
          type="error"
          title="추천을 불러오지 못했습니다"
          message="조건을 조금 바꾸거나 잠시 후 다시 검색해보세요."
        >
          <p class="meta-text">{{ requestMessage }}</p>
          <button class="btn btn-secondary" type="button" :disabled="isLoading" @click="requestRecommendation">
            다시 추천 받기
          </button>
        </StateBlock>

        <StateBlock
          v-else-if="isLoading && !recommendation"
          type="loading"
          title="추천 식단 생성 중"
          message="AI가 조건에 맞는 식단을 구성하고 있습니다."
        />

        <template v-else-if="recommendation">
          <div class="section-heading-row">
            <div>
              <p class="section-label">Recommendation</p>
              <h2>{{ recommendation.title }}</h2>
            </div>
            <div class="chip-list">
              <span class="chip">{{ recommendation.meals.length }}끼</span>
              <span class="badge badge-ai">{{ recommendationFoodSourceOption.label }}</span>
            </div>
          </div>

          <div class="save-options-panel">
            <div class="field-group">
              <label for="reroll-condition">기존 조건 기반 재추천</label>
              <textarea id="reroll-condition" v-model="rerollCondition" />
              <span class="meta-text">현재 추천의 기준 조건은 유지하고 추가 조건만 반영합니다.</span>
            </div>
            <button class="btn btn-secondary" type="button" :disabled="isRerolling" @click="submitReroll">
              {{ isRerolling ? '재추천 중...' : '기존 조건으로 다시 추천' }}
            </button>
            <p v-if="rerollMessage" class="form-message">{{ rerollMessage }}</p>
          </div>

          <div v-if="selectedReplacement" class="save-options-panel">
            <div>
              <p class="section-label">Replace Food</p>
              <h3>{{ selectedReplacement.mealType }} · {{ selectedReplacement.food.name }}</h3>
            </div>
            <div class="field-group">
              <label for="replacement-condition">교체 조건</label>
              <textarea id="replacement-condition" v-model="replacementCondition" />
            </div>
            <div class="button-row">
              <button class="btn btn-primary" type="button" :disabled="isReplacing" @click="submitReplacement">
                {{ isReplacing ? '교체 중...' : '이 음식 교체' }}
              </button>
              <button class="btn btn-secondary" type="button" :disabled="isReplacing" @click="cancelReplacement">
                취소
              </button>
            </div>
          </div>

          <p v-if="replaceMessage" class="form-message">{{ replaceMessage }}</p>
          <p class="card-description">{{ recommendation.reason }}</p>

          <div class="totals-panel recommendation-totals">
            <article>
              <span>총 칼로리</span>
              <strong>{{ recommendation.totalCalories }} kcal</strong>
            </article>
            <article>
              <span>탄수화물</span>
              <strong>{{ recommendation.totalCarbohydrate }}g</strong>
            </article>
            <article>
              <span>단백질</span>
              <strong>{{ recommendation.totalProtein }}g</strong>
            </article>
            <article>
              <span>지방</span>
              <strong>{{ recommendation.totalFat }}g</strong>
            </article>
          </div>

          <div class="recommendation-meals">
            <article v-for="meal in recommendation.meals" :key="meal.mealOrder" class="meal-plan-card">
              <div class="section-heading-row">
                <div>
                  <p class="section-label">{{ meal.mealOrder }}번째</p>
                  <h3>{{ meal.mealType }}</h3>
                </div>
                <label class="chip">
                  <input v-model="saveForms[meal.mealOrder].shouldSave" type="checkbox" />
                  저장
                </label>
              </div>

              <ul>
                <li v-for="food in meal.foods" :key="`${meal.mealOrder}-${food.foodId || food.aiFoodKey || food.name}`">
                  <span>{{ food.name }} {{ food.amount }}g</span>
                  <strong>{{ food.calories }} kcal</strong>
                  <button class="btn btn-secondary" type="button" @click="startReplacement(meal, food)">
                    교체
                  </button>
                </li>
              </ul>

              <div v-if="saveForms[meal.mealOrder]?.shouldSave" class="save-options-panel">
                <div class="field-group">
                  <label :for="`save-title-${meal.mealOrder}`">저장 식단 이름</label>
                  <input :id="`save-title-${meal.mealOrder}`" v-model="saveForms[meal.mealOrder].title" type="text" />
                </div>
                <div class="field-group">
                  <label :for="`save-description-${meal.mealOrder}`">설명</label>
                  <textarea :id="`save-description-${meal.mealOrder}`" v-model="saveForms[meal.mealOrder].description" />
                </div>
                <p v-if="saveForms[meal.mealOrder].message" class="form-message">
                  {{ saveForms[meal.mealOrder].message }}
                </p>
              </div>
            </article>
          </div>

          <div class="save-options-panel">
            <p class="section-label">선택한 식사 저장</p>
            <p class="meta-text">
              {{
                isFreeRecommendation
                  ? 'AI 자유 추천은 선택한 식사를 스냅샷 음식 기반 저장 식단으로 저장합니다.'
                  : '체크한 식사들을 한 번에 저장 식단 목록에 추가합니다.'
              }}
            </p>
            <button class="btn btn-primary" type="button" :disabled="isSavingSelected" @click="saveSelectedMeals">
              {{ isSavingSelected ? '저장 중...' : '선택한 식사 저장' }}
            </button>
            <p v-if="saveMessage" class="form-message">{{ saveMessage }}</p>
          </div>

          <div class="button-row">
            <RouterLink class="btn btn-secondary" to="/saved-meals">저장 식단 보기</RouterLink>
            <RouterLink class="btn btn-secondary" to="/community">커뮤니티에 공유</RouterLink>
          </div>
        </template>

        <StateBlock
          v-else
          type="empty"
          title="AI 추천을 생성해보세요"
          message="왼쪽 조건을 입력하고 추천을 요청하면 결과가 표시됩니다."
        />
      </section>
    </section>
  </main>
</template>
