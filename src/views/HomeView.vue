<script setup>
const highlights = [
  { value: '2,322', label: '정제 음식 데이터' },
  { value: '415', label: '한글화 운동 데이터' },
  { value: '25', label: '핵심 요구사항' },
]

const featureCards = [
  {
    title: 'AI 식단 추천',
    text: '프로필과 권장 칼로리를 기준으로 아침, 점심, 저녁, 간식 식단을 추천합니다.',
    to: '/diet/recommend',
  },
  {
    title: '운동 루틴 관리',
    text: '운동 목표와 경험에 맞는 루틴을 만들고 실제 수행 기록을 남깁니다.',
    to: '/workout/recommend',
  },
  {
    title: '진행 현황 시각화',
    text: '체중, 섭취 칼로리, 식단 점수, 운동 횟수 변화를 한눈에 확인합니다.',
    to: '/progress',
  },
]
</script>

<template>
  <main class="home-page">
    <section class="hero-section">
      <div class="hero-copy">
        <p class="section-label">AI 맞춤 식단·운동 추천 서비스</p>
        <h1>오늘의 기록이 내일의 루틴이 되는 HealthFit</h1>
        <p class="hero-description">
          신체 정보, 식단 기록, 운동 기록을 바탕으로 개인에게 맞는 식단과 운동 루틴을
          추천하고 진행 현황을 시각화하는 건강 관리 플랫폼입니다.
        </p>

        <div class="hero-actions">
          <RouterLink class="primary-link large" to="/profile">프로필 시작</RouterLink>
          <RouterLink class="secondary-link large" to="/diet">식단 대시보드</RouterLink>
        </div>
      </div>

      <div class="insight-panel" aria-label="HealthFit summary">
        <div class="score-card">
          <span class="score-label">오늘의 식단 점수</span>
          <strong>86</strong>
          <span class="score-note">단백질 비율이 좋아요</span>
        </div>
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
      </div>
    </section>

    <section class="stats-grid" aria-label="Project data summary">
      <article v-for="item in highlights" :key="item.label">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </article>
    </section>

    <section class="feature-grid" aria-label="Core features">
      <RouterLink v-for="feature in featureCards" :key="feature.title" :to="feature.to">
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.text }}</p>
      </RouterLink>
    </section>
  </main>
</template>
