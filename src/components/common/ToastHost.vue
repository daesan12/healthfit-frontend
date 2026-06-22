<script setup>
import { useToastStore } from '@/stores/toast'

const toastStore = useToastStore()
</script>

<template>
  <div v-if="toastStore.items.length" class="toast-host" aria-live="polite" aria-label="알림">
    <article v-for="toast in toastStore.items" :key="toast.id" class="toast-card" :class="`is-${toast.type}`">
      <div>
        <strong>{{ toast.title }}</strong>
        <p v-if="toast.message">{{ toast.message }}</p>
      </div>
      <button type="button" aria-label="알림 닫기" @click="toastStore.dismiss(toast.id)">×</button>
    </article>
  </div>
</template>
