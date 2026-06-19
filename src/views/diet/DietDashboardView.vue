<script setup>
import PageHeader from '@/components/common/PageHeader.vue'

const metrics = [
  { label: '하루 권장 칼로리', value: '2,200 kcal' },
  { label: '오늘 섭취 칼로리', value: '1,640 kcal' },
  { label: '최근 식단 점수', value: '86점' },
]
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Diet"
      title="식단 대시보드"
      description="권장 칼로리와 오늘의 섭취 상태를 한눈에 확인합니다."
    />

    <section class="content-grid">
      <article
        v-for="metric in metrics"
        :key="metric.label"
        class="metric-card"
        style="grid-column: span 4"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </article>

      <section class="surface-card" style="grid-column: span 8">
        <p class="section-label">오늘의 탄단지</p>
        <div class="macro-row">
          <span>탄수화물</span>
          <div class="meter"><i style="width: 54%"></i></div>
          <strong>54%</strong>
        </div>
        <div class="macro-row">
          <span>단백질</span>
          <div class="meter"><i style="width: 31%"></i></div>
          <strong>31%</strong>
        </div>
        <div class="macro-row">
          <span>지방</span>
          <div class="meter"><i style="width: 18%"></i></div>
          <strong>18%</strong>
        </div>
      </section>

      <aside class="surface-card" style="grid-column: span 4">
        <p class="section-label">빠른 이동</p>
        <div class="button-row">
          <RouterLink class="btn btn-secondary" to="/foods">음식 검색</RouterLink>
          <RouterLink class="btn btn-primary" to="/diet/records">식단 기록</RouterLink>
          <RouterLink class="btn btn-secondary" to="/diet/recommend">AI 추천</RouterLink>
          <RouterLink class="btn btn-secondary" to="/diet/evaluation">오늘 평가</RouterLink>
        </div>
      </aside>
    </section>
  </main>
</template>
