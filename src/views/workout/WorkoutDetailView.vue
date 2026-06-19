<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageHeader from '@/components/common/PageHeader.vue'
import { mockWorkouts } from '@/data/mockData'

const route = useRoute()
const workout = computed(() => mockWorkouts.find((item) => item.id === Number(route.params.id)))
</script>

<template>
  <main class="page-shell">
    <template v-if="workout">
      <PageHeader
        eyebrow="Workout Detail"
        :title="workout.name"
        description="운동 부위, 장비, 자극 근육, 수행 방법을 확인합니다."
      />

      <section class="content-grid">
        <article class="surface-card" style="grid-column: span 5">
          <p class="section-label">운동 정보</p>
          <div class="chip-list">
            <span v-for="part in workout.bodyParts" :key="part" class="chip">{{ part }}</span>
            <span v-for="equipment in workout.equipments" :key="equipment" class="chip">
              {{ equipment }}
            </span>
          </div>
          <p class="card-description">주 자극 근육: {{ workout.targetMuscles.join(', ') }}</p>
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
