<script setup>
defineProps({
  type: {
    type: String,
    default: 'empty',
    validator: (value) => ['loading', 'empty', 'error'].includes(value),
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <section class="state-block" :class="`is-${type}`">
    <span class="state-icon" aria-hidden="true">{{ type === 'loading' ? '...' : type === 'error' ? '!' : '0' }}</span>
    <div>
      <h2>{{ title }}</h2>
      <p v-if="message">{{ message }}</p>
    </div>
  </section>
</template>
