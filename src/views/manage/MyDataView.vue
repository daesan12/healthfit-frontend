<script setup>
import { onMounted, reactive, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { createFood, deleteFood, getFoods, updateFood } from '@/api/diet'
import { createWorkout, deleteWorkout, getWorkouts, updateWorkout } from '@/api/workout'

const foods = ref([])
const exercises = ref([])
const message = ref('')
const errorMessage = ref('')
const isLoading = ref(false)
const editingFoodId = ref(null)
const editingExerciseId = ref(null)

const emptyFoodForm = {
  name: '',
  category: 'custom',
  calories: 0,
  carbohydrate: 0,
  protein: 0,
  fat: 0,
}

const emptyExerciseForm = {
  name: '',
  gifUrl: '',
  bodyParts: '',
  equipments: '',
  targetMuscles: '',
  secondaryMuscles: '',
  instructions: '',
}

const foodForm = reactive({ ...emptyFoodForm })
const exerciseForm = reactive({ ...emptyExerciseForm })

function resetFoodForm() {
  Object.assign(foodForm, emptyFoodForm)
  editingFoodId.value = null
}

function resetExerciseForm() {
  Object.assign(exerciseForm, emptyExerciseForm)
  editingExerciseId.value = null
}

function listToText(value) {
  return Array.isArray(value) ? value.join(', ') : value || ''
}

async function fetchData() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const [nextFoods, nextExercises] = await Promise.all([
      getFoods({ source: 'my', page_size: 50 }),
      getWorkouts({ source: 'my', page_size: 50 }),
    ])
    foods.value = nextFoods
    exercises.value = nextExercises
  } catch (error) {
    errorMessage.value = normalizeCaughtError(error).message
  } finally {
    isLoading.value = false
  }
}

function startEditFood(food) {
  editingFoodId.value = food.id
  Object.assign(foodForm, {
    name: food.name,
    category: food.category,
    calories: food.calories,
    carbohydrate: food.carbohydrate,
    protein: food.protein,
    fat: food.fat,
  })
}

function startEditExercise(exercise) {
  editingExerciseId.value = exercise.id
  Object.assign(exerciseForm, {
    name: exercise.name,
    gifUrl: exercise.gifUrl || '',
    bodyParts: listToText(exercise.bodyParts),
    equipments: listToText(exercise.equipments),
    targetMuscles: listToText(exercise.targetMuscles),
    secondaryMuscles: listToText(exercise.secondaryMuscles),
    instructions: listToText(exercise.instructions),
  })
}

async function submitFood() {
  message.value = ''

  try {
    if (editingFoodId.value) {
      await updateFood(editingFoodId.value, foodForm)
      message.value = '내 음식 정보를 수정했습니다.'
    } else {
      await createFood(foodForm)
      message.value = '내 음식을 추가했습니다.'
    }

    resetFoodForm()
    await fetchData()
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function submitExercise() {
  message.value = ''

  try {
    if (editingExerciseId.value) {
      await updateWorkout(editingExerciseId.value, exerciseForm)
      message.value = '내 운동 정보를 수정했습니다.'
    } else {
      await createWorkout(exerciseForm)
      message.value = '내 운동을 추가했습니다.'
    }

    resetExerciseForm()
    await fetchData()
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function removeFood(foodId) {
  try {
    await deleteFood(foodId)
    if (editingFoodId.value === foodId) resetFoodForm()
    message.value = '내 음식을 삭제했습니다.'
    await fetchData()
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

async function removeExercise(exerciseId) {
  try {
    await deleteWorkout(exerciseId)
    if (editingExerciseId.value === exerciseId) resetExerciseForm()
    message.value = '내 운동을 삭제했습니다.'
    await fetchData()
  } catch (error) {
    message.value = normalizeCaughtError(error).message
  }
}

onMounted(fetchData)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="My Data"
      title="내 음식·운동 관리"
      description="직접 추가한 음식과 운동을 만들고 수정하고 삭제합니다."
    />

    <StateBlock v-if="errorMessage" type="error" title="데이터를 불러오지 못했습니다" :message="errorMessage" />
    <p v-if="message" class="form-message">{{ message }}</p>

    <section class="content-grid">
      <form class="form-card" style="grid-column: span 4" @submit.prevent="submitFood">
        <p class="section-label">Food</p>
        <h2>{{ editingFoodId ? '음식 수정' : '음식 추가' }}</h2>
        <div class="field-group">
          <label for="food-name">음식 이름</label>
          <input id="food-name" v-model="foodForm.name" type="text" required />
        </div>
        <div class="field-group">
          <label for="food-category">카테고리</label>
          <input id="food-category" v-model="foodForm.category" type="text" />
        </div>
        <div class="field-group">
          <label for="food-calories">칼로리</label>
          <input id="food-calories" v-model.number="foodForm.calories" type="number" min="0" step="0.1" />
        </div>
        <div class="field-group">
          <label for="food-carb">탄수화물</label>
          <input id="food-carb" v-model.number="foodForm.carbohydrate" type="number" min="0" step="0.1" />
        </div>
        <div class="field-group">
          <label for="food-protein">단백질</label>
          <input id="food-protein" v-model.number="foodForm.protein" type="number" min="0" step="0.1" />
        </div>
        <div class="field-group">
          <label for="food-fat">지방</label>
          <input id="food-fat" v-model.number="foodForm.fat" type="number" min="0" step="0.1" />
        </div>
        <div class="button-row">
          <button class="btn btn-primary" type="submit">{{ editingFoodId ? '음식 수정' : '음식 추가' }}</button>
          <button v-if="editingFoodId" class="btn btn-secondary" type="button" @click="resetFoodForm">취소</button>
        </div>
      </form>

      <form class="form-card" style="grid-column: span 4" @submit.prevent="submitExercise">
        <p class="section-label">Exercise</p>
        <h2>{{ editingExerciseId ? '운동 수정' : '운동 추가' }}</h2>
        <div class="field-group">
          <label for="exercise-name">운동 이름</label>
          <input id="exercise-name" v-model="exerciseForm.name" type="text" required />
        </div>
        <div class="field-group">
          <label for="exercise-gif">이미지 URL</label>
          <input id="exercise-gif" v-model="exerciseForm.gifUrl" type="url" />
        </div>
        <div class="field-group">
          <label for="exercise-body">부위</label>
          <input id="exercise-body" v-model="exerciseForm.bodyParts" type="text" placeholder="쉼표로 구분" />
        </div>
        <div class="field-group">
          <label for="exercise-equipment">장비</label>
          <input id="exercise-equipment" v-model="exerciseForm.equipments" type="text" placeholder="쉼표로 구분" />
        </div>
        <div class="field-group">
          <label for="exercise-target">주요 근육</label>
          <input id="exercise-target" v-model="exerciseForm.targetMuscles" type="text" placeholder="쉼표로 구분" />
        </div>
        <div class="field-group">
          <label for="exercise-secondary">보조 근육</label>
          <input id="exercise-secondary" v-model="exerciseForm.secondaryMuscles" type="text" placeholder="쉼표로 구분" />
        </div>
        <div class="field-group">
          <label for="exercise-instructions">동작 설명</label>
          <textarea id="exercise-instructions" v-model="exerciseForm.instructions" placeholder="쉼표로 구분" />
        </div>
        <div class="button-row">
          <button class="btn btn-primary" type="submit">{{ editingExerciseId ? '운동 수정' : '운동 추가' }}</button>
          <button v-if="editingExerciseId" class="btn btn-secondary" type="button" @click="resetExerciseForm">취소</button>
        </div>
      </form>

      <section class="surface-card" style="grid-column: span 4">
        <p class="section-label">내 데이터</p>
        <StateBlock v-if="isLoading" type="loading" title="조회 중" message="내 음식과 운동을 불러오고 있습니다." />
        <template v-else>
          <h2>내 음식</h2>
          <article v-for="food in foods" :key="food.id" class="comment-item">
            <div>
              <strong>{{ food.name }}</strong>
              <p>{{ food.calories }} kcal · {{ food.category }}</p>
            </div>
            <div class="button-row">
              <button type="button" @click="startEditFood(food)">수정</button>
              <button type="button" @click="removeFood(food.id)">삭제</button>
            </div>
          </article>

          <h2>내 운동</h2>
          <article v-for="exercise in exercises" :key="exercise.id" class="comment-item">
            <div>
              <strong>{{ exercise.name }}</strong>
              <p>{{ (exercise.bodyParts || []).join(', ') || '부위 없음' }}</p>
            </div>
            <div class="button-row">
              <button type="button" @click="startEditExercise(exercise)">수정</button>
              <button type="button" @click="removeExercise(exercise.id)">삭제</button>
            </div>
          </article>
        </template>
      </section>
    </section>
  </main>
</template>
