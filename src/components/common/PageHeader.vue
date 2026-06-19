<script setup>
defineProps({
  eyebrow: {
    type: String,
    default: 'HealthFit',
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <header class="page-header">
    <p class="section-label">{{ eyebrow }}</p>
    <h1>{{ title }}</h1>
    <p v-if="description">{{ description }}</p>
  </header>
</template>
