<script setup>
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { mapFieldErrors, normalizeCaughtError } from '@/api/client'
import { useProfileStore } from '@/stores/profile'
import { useToastStore } from '@/stores/toast'

const profileStore = useProfileStore()
const toastStore = useToastStore()

const profile = reactive({
  gender: 'male',
  age: null,
  height: null,
  weight: null,
  bodyType: 'normal',
  activityLevel: 'normal',
  workoutGoal: 'fat_loss',
  workoutExperience: 'beginner',
})

const errors = reactive({
  age: '',
  height: '',
  weight: '',
  bodyType: '',
})

const formMessage = ref('')
const loadMessage = ref('')

const bodyTypeLabels = {
  slim: '마른 체형',
  normal: '보통 체형',
  muscular: '근육형',
  overweight: '체지방 증가형',
}

const activityLabels = {
  low: '낮음',
  normal: '보통',
  high: '높음',
}

const goalLabels = {
  fat_loss: '감량',
  muscle_gain: '근력 향상',
  maintenance: '유지',
  weight_gain: '증량',
}

function fillProfile(nextProfile) {
  if (!nextProfile) return

  Object.assign(profile, {
    gender: nextProfile.gender || 'male',
    age: nextProfile.age ?? null,
    height: nextProfile.height ?? null,
    weight: nextProfile.weight ?? null,
    bodyType: nextProfile.bodyType || 'normal',
    activityLevel: nextProfile.activityLevel || 'normal',
    workoutGoal: nextProfile.workoutGoal || 'fat_loss',
    workoutExperience: nextProfile.workoutExperience || 'beginner',
  })
}

function isBetween(value, min, max) {
  return Number(value) >= min && Number(value) <= max
}

function validateProfile() {
  errors.age = isBetween(profile.age, 10, 100) ? '' : '나이는 10부터 100 사이로 입력해주세요.'
  errors.height = isBetween(profile.height, 100, 230) ? '' : '키는 100cm부터 230cm 사이로 입력해주세요.'
  errors.weight = isBetween(profile.weight, 30, 250) ? '' : '몸무게는 30kg부터 250kg 사이로 입력해주세요.'
  errors.bodyType = profile.bodyType ? '' : '체형을 선택해주세요.'

  return !errors.age && !errors.height && !errors.weight && !errors.bodyType
}

function applyServerErrors(serverErrors) {
  const fieldErrors = mapFieldErrors(serverErrors)
  errors.age = fieldErrors.age || ''
  errors.height = fieldErrors.height || ''
  errors.weight = fieldErrors.weight || ''
  errors.bodyType = fieldErrors.body_type || ''
}

async function handleProfileSave() {
  formMessage.value = ''

  if (!validateProfile()) return

  try {
    const savedProfile = await profileStore.saveProfile({ ...profile })
    fillProfile(savedProfile)
    formMessage.value = '프로필이 저장되었습니다.'
    toastStore.success('프로필 저장 완료', '맞춤 추천에 사용할 정보가 갱신되었습니다.')
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    applyServerErrors(apiError.errors)
    formMessage.value = apiError.message
  }
}

onMounted(async () => {
  loadMessage.value = ''

  try {
    const savedProfile = await profileStore.fetchProfile()
    fillProfile(savedProfile)
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    loadMessage.value = apiError.message
  }
})
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Profile"
      title="마이 프로필"
      description="권장 칼로리, 식단 추천, 운동 추천의 기준이 되는 정보를 입력합니다."
    />

    <StateBlock
      v-if="profileStore.isLoading && !profileStore.hasProfile"
      type="loading"
      title="프로필을 불러오는 중입니다"
      message="저장된 정보가 있으면 자동으로 입력합니다."
    />

    <section v-else class="content-grid">
      <form class="form-card mobile-friendly-form" style="grid-column: span 8" @submit.prevent="handleProfileSave">
        <p v-if="loadMessage && !profileStore.hasProfile" class="form-message">
          저장된 프로필이 없습니다. 새로 입력하면 추천 기능에 사용할 수 있습니다.
        </p>

        <div class="content-grid compact-form-grid">
          <div class="field-group" style="grid-column: span 6">
            <label for="gender">성별</label>
            <select id="gender" v-model="profile.gender">
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>

          <div class="field-group" style="grid-column: span 6" :class="{ 'has-error': errors.age }">
            <label for="age">나이</label>
            <input id="age" v-model.number="profile.age" type="number" inputmode="numeric" min="10" max="100" placeholder="27" />
            <p v-if="errors.age" class="error-text">{{ errors.age }}</p>
          </div>

          <div class="field-group" style="grid-column: span 4" :class="{ 'has-error': errors.height }">
            <label for="height">키(cm)</label>
            <input id="height" v-model.number="profile.height" type="number" inputmode="decimal" min="100" max="230" step="0.1" placeholder="181" />
            <p v-if="errors.height" class="error-text">{{ errors.height }}</p>
          </div>

          <div class="field-group" style="grid-column: span 4" :class="{ 'has-error': errors.weight }">
            <label for="weight">몸무게(kg)</label>
            <input id="weight" v-model.number="profile.weight" type="number" inputmode="decimal" min="30" max="250" step="0.1" placeholder="72" />
            <p v-if="errors.weight" class="error-text">{{ errors.weight }}</p>
          </div>

          <div class="field-group" style="grid-column: span 4" :class="{ 'has-error': errors.bodyType }">
            <label for="body-type">체형</label>
            <select id="body-type" v-model="profile.bodyType">
              <option value="slim">마른 체형</option>
              <option value="normal">보통 체형</option>
              <option value="muscular">근육형</option>
              <option value="overweight">체지방 증가형</option>
            </select>
            <p v-if="errors.bodyType" class="error-text">{{ errors.bodyType }}</p>
          </div>

          <div class="field-group" style="grid-column: span 4">
            <label for="activity">활동량</label>
            <select id="activity" v-model="profile.activityLevel">
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
            </select>
          </div>

          <div class="field-group" style="grid-column: span 4">
            <label for="goal">운동 목표</label>
            <select id="goal" v-model="profile.workoutGoal">
              <option value="fat_loss">감량</option>
              <option value="muscle_gain">근력 향상</option>
              <option value="maintenance">유지</option>
              <option value="weight_gain">증량</option>
            </select>
          </div>

          <div class="field-group" style="grid-column: span 4">
            <label for="experience">운동 경험</label>
            <select id="experience" v-model="profile.workoutExperience">
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>
        </div>

        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

        <div class="button-row form-actions">
          <button class="btn btn-primary" type="submit" :disabled="profileStore.isLoading">
            {{ profileStore.isLoading ? '저장 중...' : '프로필 저장' }}
          </button>
          <!-- <RouterLink class="btn btn-secondary" to="/diet">식단 대시보드 보기</RouterLink> -->
        </div>
      </form>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">추천 기준</p>
        <h2>{{ bodyTypeLabels[profile.bodyType] }}</h2>
        <p>
          활동량 {{ activityLabels[profile.activityLevel] }}, 목표 {{ goalLabels[profile.workoutGoal] }} 기준으로
          권장 칼로리와 추천 흐름을 계산합니다.
        </p>
        <div class="chip-list">
          <span class="chip">권장 칼로리</span>
          <span class="chip">탄단지 비율</span>
          <span class="chip">운동 루틴</span>
          <span class="chip">식단 평가</span>
        </div>
      </aside>
    </section>
  </main>
</template>
