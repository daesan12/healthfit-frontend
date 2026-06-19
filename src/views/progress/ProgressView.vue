<script setup>
import PageHeader from '@/components/common/PageHeader.vue'
import { mockProgress } from '@/data/mockData'
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Progress"
      title="진행 현황"
      description="체중, 섭취 칼로리, 식단 점수, 운동 횟수를 기간별로 확인합니다."
    />

    <section class="content-grid">
      <article class="surface-card" style="grid-column: span 8">
        <p class="section-label">식단 점수 변화</p>
        <div class="bar-chart">
          <div v-for="item in mockProgress" :key="item.date" class="bar-item">
            <span>{{ item.score }}</span>
            <i :style="{ height: `${item.score}%` }"></i>
            <strong>{{ item.date }}</strong>
          </div>
        </div>
      </article>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">최근 기록</p>
        <div v-for="item in mockProgress" :key="item.date" class="record-row">
          <span>{{ item.date }}</span>
          <strong>{{ item.weight }}kg</strong>
          <em>{{ item.workouts }}회 운동</em>
        </div>
      </aside>
    </section>
  </main>
</template>
