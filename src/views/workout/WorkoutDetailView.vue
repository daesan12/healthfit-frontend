<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { normalizeCaughtError } from '@/api/client'
import { getWorkout } from '@/api/workout'

const route = useRoute()
const workout = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

async function fetchWorkout() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    workout.value = await getWorkout(route.params.id)
  } catch (error) {
    const apiError = normalizeCaughtError(error)
    workout.value = null
    errorMessage.value = apiError.message
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchWorkout)
</script>

<template>
  <main class="page-shell">
    <StateBlock
      v-if="isLoading"
      type="loading"
      title="운동 정보를 불러오는 중입니다"
      message="선택한 운동의 상세 정보를 조회하고 있습니다."
    />

    <StateBlock
      v-else-if="errorMessage"
      type="error"
      title="운동 정보를 찾을 수 없습니다"
      :message="errorMessage"
    />

    <template v-else-if="workout">
      <PageHeader
        eyebrow="Workout Detail"
        :title="workout.name"
        description="운동 부위, 장비, 타깃 근육, 수행 방법을 확인합니다."
      />

      <section class="content-grid">
        <article class="surface-card" style="grid-column: span 5">
          <p class="section-label">운동 정보</p>
          <img
            v-if="workout.gifUrl"
            class="detail-media"
            :src="workout.gifUrl"
            :alt="`${workout.name} 동작 예시`"
          />
          <div class="chip-list">
            <span v-for="part in workout.bodyParts" :key="part" class="chip">{{ part }}</span>
            <span v-for="equipment in workout.equipments" :key="equipment" class="chip">
              {{ equipment }}
            </span>
          </div>
          <p class="card-description">주요 타깃 근육: {{ workout.targetMuscles.join(', ') || '정보 없음' }}</p>
          <p v-if="workout.secondaryMuscles.length" class="card-description">
            보조 근육: {{ workout.secondaryMuscles.join(', ') }}
          </p>
          <div class="button-row">
            <RouterLink class="btn btn-primary" :to="`/workout/logs?exerciseId=${workout.id}`">
              이 운동 기록하기
            </RouterLink>
            <RouterLink class="btn btn-secondary" to="/workouts">목록으로</RouterLink>
          </div>
        </article>

        <article class="surface-card" style="grid-column: span 7">
          <p class="section-label">수행 방법</p>
          <ol class="instruction-list">
            <li v-for="instruction in workout.instructions" :key="instruction">{{ instruction }}</li>
          </ol>
        </article>
      </section>
    </template>

    <section v-else class="placeholder-panel">
      <p class="section-label">Not Found</p>
      <h1>운동 정보를 찾을 수 없습니다.</h1>
      <RouterLink class="btn btn-primary" to="/workouts">운동 목록으로 이동</RouterLink>
    </section>
  </main>
</template>
