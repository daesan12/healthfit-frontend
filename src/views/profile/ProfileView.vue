<script setup>
import { reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { useProfileStore } from '@/stores/profile'

const profileStore = useProfileStore()

const profile = reactive({
  gender: 'male',
  age: null,
  height: null,
  weight: null,
  activityLevel: 'normal',
  workoutGoal: 'fat_loss',
  workoutExperience: 'beginner',
})

const errors = reactive({
  age: '',
  height: '',
  weight: '',
})

const formMessage = ref('')

function isBetween(value, min, max) {
  return Number(value) >= min && Number(value) <= max
}

function validateProfile() {
  errors.age = isBetween(profile.age, 10, 100) ? '' : '나이는 10세부터 100세 사이로 입력해주세요.'
  errors.height = isBetween(profile.height, 100, 230) ? '' : '키는 100cm부터 230cm 사이로 입력해주세요.'
  errors.weight = isBetween(profile.weight, 30, 250) ? '' : '몸무게는 30kg부터 250kg 사이로 입력해주세요.'

  return !errors.age && !errors.height && !errors.weight
}

function handleProfileSave() {
  formMessage.value = ''

  if (!validateProfile()) return

  profileStore.setProfile({ ...profile })
  formMessage.value = '프로필 입력값 검증이 완료되었습니다. 백엔드 연결 후 저장 요청을 보냅니다.'
}
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Profile"
      title="마이프로필"
      description="권장 칼로리, 식단 추천, 운동 추천의 기준이 되는 정보를 입력합니다."
    />

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 8" @submit.prevent="handleProfileSave">
        <div class="content-grid">
          <div class="field-group" style="grid-column: span 6">
            <label for="gender">성별</label>
            <select id="gender" v-model="profile.gender">
              <option value="male">남성</option>
              <option value="female">여성</option>
            </select>
          </div>

          <div class="field-group" style="grid-column: span 6" :class="{ 'has-error': errors.age }">
            <label for="age">나이</label>
            <input id="age" v-model.number="profile.age" type="number" placeholder="27" />
            <p v-if="errors.age" class="error-text">{{ errors.age }}</p>
          </div>

          <div class="field-group" style="grid-column: span 4" :class="{ 'has-error': errors.height }">
            <label for="height">키</label>
            <input id="height" v-model.number="profile.height" type="number" placeholder="181" />
            <p v-if="errors.height" class="error-text">{{ errors.height }}</p>
          </div>

          <div class="field-group" style="grid-column: span 4" :class="{ 'has-error': errors.weight }">
            <label for="weight">몸무게</label>
            <input id="weight" v-model.number="profile.weight" type="number" placeholder="100" />
            <p v-if="errors.weight" class="error-text">{{ errors.weight }}</p>
          </div>

          <div class="field-group" style="grid-column: span 4">
            <label for="activity">활동량</label>
            <select id="activity" v-model="profile.activityLevel">
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
            </select>
          </div>

          <div class="field-group" style="grid-column: span 6">
            <label for="goal">운동 목표</label>
            <select id="goal" v-model="profile.workoutGoal">
              <option value="fat_loss">감량</option>
              <option value="muscle_gain">근력 향상</option>
              <option value="maintenance">유지</option>
              <option value="weight_gain">증량</option>
            </select>
          </div>

          <div class="field-group" style="grid-column: span 6">
            <label for="experience">운동 경험</label>
            <select id="experience" v-model="profile.workoutExperience">
              <option value="beginner">초급</option>
              <option value="intermediate">중급</option>
              <option value="advanced">고급</option>
            </select>
          </div>
        </div>

        <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

        <div class="button-row">
          <button class="btn btn-primary" type="submit">프로필 저장</button>
          <RouterLink class="btn btn-secondary" to="/diet">식단 대시보드 보기</RouterLink>
        </div>
      </form>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">추천 기준</p>
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
