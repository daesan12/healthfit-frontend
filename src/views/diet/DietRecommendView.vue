<script setup>
import { computed, ref, watch } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import {
  recommendDiet,
  replaceDietRecommendationFood,
  rerollDietRecommendation,
  saveDietRecommendation,
} from '@/api/diet'

const targetDate = ref(new Date().toISOString().slice(0, 10))
const mealCount = ref(3)
const preference = ref('고단백, 조리 간단한 한식 식단')
const detailLookupId = ref('')
const saveTarget = ref('meal_plan')
const saveTitle = ref('')
const saveDescription = ref('')
const recommendation = ref(null)
const isLoading = ref(false)
const isSaving = ref(false)
const isReplacing = ref(false)
const isRerolling = ref(false)
const saveMessage = ref('')
const requestMessage = ref('')
const replaceMessage = ref('')
const rerollMessage = ref('')
const selectedReplacement = ref(null)
const replacementCondition = ref('비슷한 영양으로 다른 음식으로 바꿔줘')
const rerollCondition = ref('기존 조건은 유지하고 조리가 더 쉬운 구성으로 다시 추천해줘')

const saveTargetOptions = computed(() => [
  {
    value: 'meals',
    label: '식단 기록으로 저장',
    description: '추천된 식사를 해당 날짜의 실제 식단 기록으로 저장합니다.',
  },
  {
    value: 'saved_meal',
    label: '저장 식단으로 저장',
    description: '추천 한 끼를 저장 식단 템플릿으로 저장합니다.',
  },
  {
    value: 'meal_plan',
    label: '하루 식단 계획으로 저장',
    description: '하루 추천 전체를 식단 계획 형태로 저장합니다.',
  },
  {
    value: 'both',
    label: '식단 기록과 계획 모두 저장',
    description: '해당 날짜 식단 기록과 하루 식단 계획을 함께 만듭니다.',
  },
])

const selectedSaveOption = computed(() => saveTargetOptions.value.find((option) => option.value === saveTarget.value))

function resetSaveFields() {
  saveTarget.value = 'meal_plan'
  saveTitle.value = recommendation.value?.title || ''
  saveDescription.value = preference.value
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
      meal_count: mealCount.value,
      food_source: 'all',
      message: preference.value,
      preference: preference.value,
    })
    resetSaveFields()
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
  replacementCondition.value = '비슷한 영양으로 다른 음식으로 바꿔줘'
}

async function submitReplacement() {
  if (!recommendation.value?.id || !selectedReplacement.value) return

  const food = selectedReplacement.value.food
  if (!food.foodId && !food.aiFoodKey) {
    replaceMessage.value = '교체할 음식 식별자를 찾을 수 없습니다.'
    return
  }

  isReplacing.value = true
  replaceMessage.value = ''
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
    replaceMessage.value = '선택한 음식을 교체한 새 추천을 생성했습니다.'
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
  saveMessage.value = ''
  selectedReplacement.value = null

  try {
    recommendation.value = await rerollDietRecommendation(recommendation.value.id, {
      message: rerollCondition.value.trim(),
    })
    resetSaveFields()
    rerollMessage.value = '기존 조건을 기반으로 새 추천을 생성했습니다.'
  } catch (error) {
    rerollMessage.value = normalizeCaughtError(error).message
  } finally {
    isRerolling.value = false
  }
}

async function saveRecommendation() {
  if (!recommendation.value?.id) {
    saveMessage.value = '먼저 AI 추천을 생성해주세요.'
    return
  }

  if (!saveTarget.value) {
    saveMessage.value = '저장 대상을 선택해주세요.'
    return
  }

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
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet AI"
      title="AI 식단 추천"
      description="하루 식단을 추천받고, 음식 교체나 기존 조건 재추천 후 원하는 방식으로 저장합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4" @submit.prevent="requestRecommendation">
        <div class="field-group">
          <label for="target-date">추천 기준 날짜</label>
          <input id="target-date" v-model="targetDate" type="date" />
        </div>

        <div class="field-group">
          <label for="meal-count">식사 구성</label>
          <select id="meal-count" v-model.number="mealCount">
            <option :value="3">아침, 점심, 저녁</option>
            <option :value="4">아침, 점심, 저녁, 간식</option>
          </select>
        </div>

        <div class="field-group">
          <label for="preference">선호 조건</label>
          <textarea id="preference" v-model="preference" />
        </div>

        <button class="btn btn-primary" type="submit" :disabled="isLoading">
          {{ isLoading ? '추천 생성 중...' : 'AI 추천 받기' }}
        </button>

        <div class="field-group">
          <label for="recommendation-id">추천 ID로 상세 조회</label>
          <input id="recommendation-id" v-model="detailLookupId" type="number" min="1" placeholder="예: 12" />
        </div>
        <RouterLink
          class="btn btn-secondary"
          :class="{ disabled: !detailLookupId }"
          :to="detailLookupId ? `/diet/recommendations/${detailLookupId}` : '/diet/recommend'"
        >
          추천 상세 열기
        </RouterLink>

        <StateBlock
          v-if="requestMessage"
          type="error"
          title="추천을 불러오지 못했습니다"
          :message="requestMessage"
        />
      </form>

      <section class="surface-card recommendation-panel" style="grid-column: span 8">
        <StateBlock
          v-if="isLoading && !recommendation"
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
            <RouterLink class="btn btn-secondary" :to="`/diet/recommendations/${recommendation.id}`">
              상세 페이지
            </RouterLink>
          </div>

          <div class="save-options-panel">
            <div class="field-group">
              <label for="reroll-condition">기존 조건 기반 재추천</label>
              <textarea id="reroll-condition" v-model="rerollCondition" />
              <span class="meta-text">현재 추천의 scope, 날짜, 음식 소스, 끼니 수를 유지하고 조건만 추가합니다.</span>
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

          <div class="save-options-panel">
            <div class="field-group">
              <label for="save-target">저장 대상</label>
              <select id="save-target" v-model="saveTarget">
                <option v-for="option in saveTargetOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
              <span class="meta-text">{{ selectedSaveOption?.description }}</span>
            </div>

            <div class="field-group">
              <label for="save-title">저장 제목</label>
              <input id="save-title" v-model="saveTitle" type="text" />
            </div>

            <div class="field-group">
              <label for="save-description">저장 설명</label>
              <textarea id="save-description" v-model="saveDescription" />
            </div>

            <button class="btn btn-secondary" type="button" :disabled="isSaving" @click="saveRecommendation">
              {{ isSaving ? '저장 중...' : '선택한 방식으로 저장' }}
            </button>
          </div>

          <p v-if="saveMessage" class="form-message">{{ saveMessage }}</p>
          <div v-if="saveMessage" class="button-row">
            <RouterLink class="btn btn-secondary" to="/saved-meals">저장 식단 보기</RouterLink>
            <RouterLink class="btn btn-secondary" to="/diet/records">식단 기록으로 이동</RouterLink>
            <RouterLink class="btn btn-secondary" to="/community">커뮤니티에 공유</RouterLink>
          </div>
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
              <h3>{{ meal.mealType }}</h3>
              <ul>
                <li v-for="food in meal.foods" :key="`${meal.mealOrder}-${food.foodId || food.aiFoodKey || food.name}`">
                  <span>{{ food.name }} {{ food.amount }}g</span>
                  <strong>{{ food.calories }} kcal</strong>
                  <button class="btn btn-secondary" type="button" @click="startReplacement(meal, food)">
                    교체
                  </button>
                </li>
              </ul>
            </article>
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
