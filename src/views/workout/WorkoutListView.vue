<script setup>
import { computed, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { mockWorkouts } from '@/data/mockData'

const search = ref('')
const selectedPart = ref('전체')
const selectedEquipment = ref('전체')

const bodyParts = computed(() => [
  '전체',
  ...new Set(mockWorkouts.flatMap((workout) => workout.bodyParts)),
])

const equipments = computed(() => [
  '전체',
  ...new Set(mockWorkouts.flatMap((workout) => workout.equipments)),
])

const filteredWorkouts = computed(() =>
  mockWorkouts.filter((workout) => {
    const matchesSearch = workout.name.includes(search.value.trim())
    const matchesPart =
      selectedPart.value === '전체' || workout.bodyParts.includes(selectedPart.value)
    const matchesEquipment =
      selectedEquipment.value === '전체' || workout.equipments.includes(selectedEquipment.value)

    return matchesSearch && matchesPart && matchesEquipment
  }),
)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Workout"
      title="운동 목록"
      description="운동 데이터 415개를 검색하고 부위, 장비, 자극 근육을 확인합니다."
    />

    <section class="surface-card filter-panel">
      <div class="field-group">
        <label for="workout-search">운동명 검색</label>
        <input id="workout-search" v-model="search" type="text" placeholder="푸시업" />
      </div>

      <div class="field-group">
        <label for="body-part">운동 부위</label>
        <select id="body-part" v-model="selectedPart">
          <option v-for="part in bodyParts" :key="part">{{ part }}</option>
        </select>
      </div>

      <div class="field-group">
        <label for="equipment">장비</label>
        <select id="equipment" v-model="selectedEquipment">
          <option v-for="equipment in equipments" :key="equipment">{{ equipment }}</option>
        </select>
      </div>

      <RouterLink class="btn btn-primary" to="/workout/recommend">AI 루틴 추천</RouterLink>
    </section>

    <section class="content-grid">
      <article
        v-for="workout in filteredWorkouts"
        :key="workout.id"
        class="surface-card"
        style="grid-column: span 4"
      >
        <p class="section-label">{{ workout.equipments.join(', ') }}</p>
        <h2>{{ workout.name }}</h2>
        <div class="chip-list">
          <span v-for="part in workout.bodyParts" :key="part" class="chip">{{ part }}</span>
        </div>
        <p class="card-description">
          주 자극 근육: {{ workout.targetMuscles.join(', ') }}
        </p>
        <ol class="instruction-list">
          <li v-for="instruction in workout.instructions" :key="instruction">{{ instruction }}</li>
        </ol>
        <RouterLink class="btn btn-secondary card-action" :to="`/workouts/${workout.id}`">
          상세 보기
        </RouterLink>
      </article>

      <StateBlock
        v-if="filteredWorkouts.length === 0"
        style="grid-column: 1 / -1"
        type="empty"
        title="검색 결과가 없습니다."
        message="운동명, 부위, 장비 조건을 바꿔보세요."
      />
    </section>
  </main>
</template>
