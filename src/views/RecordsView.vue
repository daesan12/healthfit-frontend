<script setup>
const recordCards = [
  {
    title: '식단 기록',
    eyebrow: 'Meal',
    description: '하루 식사와 섭취량을 기록하고 대시보드에서 영양 합계를 확인합니다.',
    to: '/diet/records',
    action: '식단 기록하기',
  },
  {
    title: '저장 식단',
    eyebrow: 'Saved Meal',
    description: '자주 먹는 식단을 저장하고 실제 Meal 기록으로 복사합니다.',
    to: '/saved-meals',
    action: '저장 식단 관리',
  },
  {
    title: '운동 기록',
    eyebrow: 'Workout Log',
    description: '운동, 세트, 반복, 시간을 저장해 진행 현황과 AI 추천에 반영합니다.',
    to: '/workout/logs',
    action: '운동 기록하기',
  },
  {
    title: '운동 루틴',
    eyebrow: 'Routine',
    description: '나만의 루틴을 만들고 운동 항목을 추가하거나 삭제합니다.',
    to: '/workout/routines',
    action: '루틴 관리',
  },
  {
    title: '신체 기록',
    eyebrow: 'Body',
    description: '날짜별 체중, 체지방률, 골격근량을 날짜별로 관리합니다.',
    to: '/body-records',
    action: '신체 기록하기',
  },
  {
    title: '내 음식·운동',
    eyebrow: 'My Data',
    description: '사용자 음식과 사용자 운동 데이터를 생성하고 관리합니다.',
    to: '/my-data',
    action: '내 데이터 관리',
  },
]

const quickLinks = [
  { label: '진행 현황 보기', to: '/progress' },
  { label: '음식 검색', to: '/foods' },
  { label: '운동 찾기', to: '/workouts' },
  { label: 'AI 식단 추천', to: '/diet/recommend' },
  { label: 'AI 식단 평가', to: '/diet/evaluation' },
  { label: 'AI 운동 추천', to: '/workout/recommend' },
  { label: 'AI 진행 추천', to: '/workout/progression' },
]
</script>

<template>
  <main class="page-shell">
    <section class="records-hero">
      <div>
        <p class="section-label">Records</p>
        <h1>HealthFit 기록과 관리 화면</h1>
        <p>
          사용자의 식단, 운동, 신체, 저장 식단, 루틴, 사용자 데이터 화면으로 이동합니다.
        </p>
      </div>
      <RouterLink class="btn btn-primary" to="/progress">진행 현황 보기</RouterLink>
    </section>

    <section class="content-grid">
      <RouterLink
        v-for="card in recordCards"
        :key="card.to"
        class="surface-card record-hub-card"
        style="grid-column: span 4"
        :to="card.to"
      >
        <p class="section-label">{{ card.eyebrow }}</p>
        <h2>{{ card.title }}</h2>
        <p>{{ card.description }}</p>
        <span class="btn btn-secondary">{{ card.action }}</span>
      </RouterLink>

      <section class="surface-card" style="grid-column: 1 / -1">
        <div class="section-heading-row">
          <div>
            <p class="section-label">Quick Links</p>
            <h2>빠른 이동</h2>
          </div>
        </div>
        <div class="button-row">
          <RouterLink
            v-for="link in quickLinks"
            :key="link.to"
            class="btn btn-secondary"
            :to="link.to"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </section>
    </section>
  </main>
</template>
