<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import {
  getDietRecommendation,
  replaceDietRecommendationFood,
  rerollDietRecommendation,
  saveDietRecommendation,
} from '@/api/diet'

const route = useRoute()
const recommendation = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isReplacing = ref(false)
const isRerolling = ref(false)
const errorMessage = ref('')
const saveMessage = ref('')
const editMessage = ref('')
const selectedReplacement = ref(null)
const replacementCondition = ref('비슷한 영양의 다른 음식으로 바꿔줘')
const rerollCondition = ref('기존 조건은 유지하고 조리가 더 쉬운 구성으로 다시 추천해줘')
const saveTarget = ref('meal_plan')
const saveTitle = ref('')
const saveDescription = ref('')

const saveTargetOptions = computed(() => [
  { value: 'meals', label: '식단 기록으로 저장' },
  { value: 'saved_meal', label: '저장 식단으로 저장' },
  { value: 'meal_plan', label: '하루 식단 계획으로 저장' },
  { value: 'both', label: '기록과 계획 모두 저장' },
])

const selectedSaveOption = computed(() => saveTargetOptions.value.find((option) => option.value === saveTarget.value))

function resetSaveFields() {
  saveTitle.value = recommendation.value?.title || ''
  saveDescription.value = recommendation.value?.reason || ''
}

function formatNumber(value, digits = 1) {
  return Number(value || 0).toFixed(digits)
}

async function fetchRecommendation() {
  isLoading.value = true
  errorMessage.value = ''
  saveMessage.value = ''
  editMessage.value = ''
  selectedReplacement.value = null

  try {
    recommendation.value = await getDietRecommendation(route.params.id)
    resetSaveFields()
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
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
  editMessage.value = ''
}

function cancelReplacement() {
  selectedReplacement.value = null
  replacementCondition.value = '비슷한 영양의 다른 음식으로 바꿔줘'
}

async function submitReplacement() {
  if (!recommendation.value?.id || !selectedReplacement.value) return

  const food = selectedReplacement.value.food
  if (!food.foodId && !food.aiFoodKey) {
    editMessage.value = '교체할 음식 식별자를 찾을 수 없습니다.'
    return
  }

  isReplacing.value = true
  editMessage.value = ''
  saveMessage.value = ''

  try {
    recommendation.value = await replaceDietRecommendationFood(recommendation.value.id, {
      mealOrder: selectedReplacement.value.mealOrder,
      replaceFoodId: food.foodId,
      replaceAiFoodKey: food.aiFoodKey,
      message: replacementCondition.value.trim(),
    })
    resetSaveFields()
    cancelReplacement()
    editMessage.value = '선택한 음식을 교체한 새 추천을 불러왔습니다.'
  } catch (error) {
    editMessage.value = normalizeCaughtError(error).message
  } finally {
    isReplacing.value = false
  }
}

async function submitReroll() {
  if (!recommendation.value?.id) return
  if (!rerollCondition.value.trim()) {
    editMessage.value = '재추천 조건을 입력해주세요.'
    return
  }

  isRerolling.value = true
  editMessage.value = ''
  saveMessage.value = ''
  selectedReplacement.value = null

  try {
    recommendation.value = await rerollDietRecommendation(recommendation.value.id, {
      message: rerollCondition.value.trim(),
    })
    resetSaveFields()
    editMessage.value = '기존 조건을 기반으로 새 추천을 불러왔습니다.'
  } catch (error) {
    editMessage.value = normalizeCaughtError(error).message
  } finally {
    isRerolling.value = false
  }
}

async function saveRecommendation() {
  if (!recommendation.value?.id) return

  isSaving.value = true
  saveMessage.value = ''

  try {
    await saveDietRecommendation(recommendation.value.id, {
      save_target: saveTarget.value,
      title: saveTitle.value.trim() || recommendation.value.title,
      description: saveDescription.value.trim(),
    })
    saveMessage.value = `${selectedSaveOption.value?.label || '추천 식단 저장'}을 완료했습니다.`
  } catch (error) {
    saveMessage.value = normalizeCaughtError(error).message
  } finally {
    isSaving.value = false
  }
}

watch(recommendation, (nextRecommendation) => {
  if (nextRecommendation) resetSaveFields()
})

onMounted(fetchRecommendation)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet AI Detail"
      :title="recommendation?.title || 'AI 식단 추천 상세'"
      description="저장된 AI 식단 추천을 다시 조회하고 저장, 교체, 재추천 흐름으로 이어갑니다."
    />

    <StateBlock
      v-if="isLoading"
      type="loading"
      title="추천 상세를 불러오는 중입니다"
      message="추천 ID로 저장된 AI 식단 결과를 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="추천 상세를 불러오지 못했습니다"
      :message="errorMessage"
    />

    <section v-else-if="recommendation" class="content-grid">
      <article class="surface-card recommendation-panel" style="grid-column: span 8">
        <div class="section-heading-row">
          <div>
            <p class="section-label">추천 #{{ recommendation.id }}</p>
            <h2>{{ recommendation.title }}</h2>
          </div>
          <RouterLink class="btn btn-secondary" to="/diet/recommend">새 추천</RouterLink>
        </div>

        <div class="chip-list">
          <span v-if="recommendation.scope" class="chip">{{ recommendation.scope }}</span>
          <span v-if="recommendation.targetDate" class="chip">{{ recommendation.targetDate }}</span>
          <span v-if="recommendation.parentRecommendationId" class="chip">
            원본 #{{ recommendation.parentRecommendationId }}
          </span>
        </div>

        <p class="card-description">{{ recommendation.reason || '추천 설명이 없습니다.' }}</p>

        <div class="totals-panel recommendation-totals">
          <article>
            <span>총 칼로리</span>
            <strong>{{ formatNumber(recommendation.totalCalories, 0) }} kcal</strong>
          </article>
          <article>
            <span>탄수화물</span>
            <strong>{{ formatNumber(recommendation.totalCarbohydrate) }}g</strong>
          </article>
          <article>
            <span>단백질</span>
            <strong>{{ formatNumber(recommendation.totalProtein) }}g</strong>
          </article>
          <article>
            <span>지방</span>
            <strong>{{ formatNumber(recommendation.totalFat) }}g</strong>
          </article>
        </div>

        <div class="recommendation-meals">
          <article v-for="meal in recommendation.meals" :key="meal.mealOrder" class="meal-plan-card">
            <h3>{{ meal.mealType }}</h3>
            <ul>
              <li v-for="food in meal.foods" :key="`${meal.mealOrder}-${food.foodId || food.aiFoodKey || food.name}`">
                <span>{{ food.name }} {{ food.amount }}g</span>
                <strong>{{ formatNumber(food.calories, 0) }} kcal</strong>
                <button class="btn btn-secondary" type="button" @click="startReplacement(meal, food)">
                  교체
                </button>
              </li>
            </ul>
          </article>
        </div>
      </article>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">저장</p>
        <div class="stacked-form">
          <div class="field-group">
            <label for="save-target">저장 대상</label>
            <select id="save-target" v-model="saveTarget">
              <option v-for="option in saveTargetOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="field-group">
            <label for="save-title">저장 제목</label>
            <input id="save-title" v-model="saveTitle" type="text" />
          </div>
          <div class="field-group">
            <label for="save-description">저장 설명</label>
            <textarea id="save-description" v-model="saveDescription" />
          </div>
          <button class="btn btn-primary" type="button" :disabled="isSaving" @click="saveRecommendation">
            {{ isSaving ? '저장 중...' : '선택한 방식으로 저장' }}
          </button>
          <p v-if="saveMessage" class="form-message">{{ saveMessage }}</p>
        </div>
      </aside>

      <section class="surface-card" style="grid-column: 1 / -1">
        <div class="section-heading-row">
          <div>
            <p class="section-label">추천 조정</p>
            <h2>교체 또는 재추천</h2>
          </div>
        </div>

        <div v-if="selectedReplacement" class="save-options-panel">
          <p class="section-label">{{ selectedReplacement.mealType }}</p>
          <h3>{{ selectedReplacement.food.name }}</h3>
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

        <div class="save-options-panel">
          <div class="field-group">
            <label for="reroll-condition">기존 조건 기반 재추천</label>
            <textarea id="reroll-condition" v-model="rerollCondition" />
          </div>
          <button class="btn btn-secondary" type="button" :disabled="isRerolling" @click="submitReroll">
            {{ isRerolling ? '재추천 중...' : '기존 조건으로 다시 추천' }}
          </button>
        </div>

        <p v-if="editMessage" class="form-message">{{ editMessage }}</p>
      </section>
    </section>
  </main>
</template>
