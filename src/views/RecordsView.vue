<script setup>
const recordCards = [
  {
    title: '식단 기록',
    eyebrow: 'Diet',
    description: '음식과 섭취량을 입력해 하루 칼로리와 탄단지를 관리합니다.',
    to: '/diet/records',
    action: '식단 기록하기',
  },
  {
    title: '운동 기록',
    eyebrow: 'Workout',
    description: '수행한 운동, 시간, 세트, 반복 수를 저장해 진행 현황에 반영합니다.',
    to: '/workout/logs',
    action: '운동 기록하기',
  },
  {
    title: '신체 기록',
    eyebrow: 'Body',
    description: '체중, 체지방률, 골격근량을 날짜별로 남겨 변화를 확인합니다.',
    to: '/body-records',
    action: '신체 기록하기',
  },
]

const quickLinks = [
  {
    label: '진행 현황 보기',
    to: '/progress',
  },
  {
    label: '음식 검색',
    to: '/foods',
  },
  {
    label: '운동 찾기',
    to: '/workouts',
  },
]
</script>

<template>
  <main class="page-shell">
    <section class="records-hero">
      <div>
        <p class="section-label">Records</p>
        <h1>오늘의 기록을 한 곳에서 관리합니다</h1>
        <p>
          식단, 운동, 신체 기록으로 나누어 입력하고 진행 현황에서 변화를 확인할 수 있습니다.
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
            <h2>기록 전에 자주 쓰는 화면</h2>
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
