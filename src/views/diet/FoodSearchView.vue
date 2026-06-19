<script setup>
import { computed, ref } from 'vue'
import PageHeader from '@/components/common/PageHeader.vue'
import StateBlock from '@/components/common/StateBlock.vue'
import { mockFoods } from '@/data/mockData'

const search = ref('')
const selectedCategory = ref('전체')

const categories = computed(() => ['전체', ...new Set(mockFoods.map((food) => food.category))])

const filteredFoods = computed(() =>
  mockFoods.filter((food) => {
    const matchesSearch = food.name.includes(search.value.trim())
    const matchesCategory = selectedCategory.value === '전체' || food.category === selectedCategory.value

    return matchesSearch && matchesCategory
  }),
)
</script>

<template>
  <main class="page-shell">
    <PageHeader
      eyebrow="Foods"
      title="음식 검색"
      description="음식명과 카테고리로 영양성분 데이터를 찾아봅니다."
    />

    <section class="surface-card filter-panel">
      <div class="field-group">
        <label for="food-search">음식명 검색</label>
        <input id="food-search" v-model="search" type="text" placeholder="닭가슴살" />
      </div>

      <div class="field-group">
        <label for="food-category">카테고리</label>
        <select id="food-category" v-model="selectedCategory">
          <option v-for="category in categories" :key="category">{{ category }}</option>
        </select>
      </div>

      <RouterLink class="btn btn-primary" to="/diet/records">식단 기록</RouterLink>
    </section>

    <section class="content-grid">
      <article
        v-for="food in filteredFoods"
        :key="food.id"
        class="surface-card"
        style="grid-column: span 4"
      >
        <span class="chip">{{ food.category }}</span>
        <h2>{{ food.name }}</h2>
        <div class="food-macro-grid">
          <span>{{ food.calories }} kcal</span>
          <span>탄 {{ food.carbohydrate }}g</span>
          <span>단 {{ food.protein }}g</span>
          <span>지 {{ food.fat }}g</span>
        </div>
      </article>

      <StateBlock
        v-if="filteredFoods.length === 0"
        style="grid-column: 1 / -1"
        type="empty"
        title="검색 결과가 없습니다."
        message="다른 음식명이나 카테고리로 다시 검색해보세요."
      />
    </section>
  </main>
</template>
