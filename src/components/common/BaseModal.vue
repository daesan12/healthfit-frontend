<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close'])

function closeModal() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-pop">
      <div v-if="open" class="modal-backdrop" role="presentation" @click.self="closeModal">
        <section class="modal-card" role="dialog" aria-modal="true" :aria-label="title">
          <header class="modal-header">
            <div>
              <p class="section-label">Compose</p>
              <h2>{{ title }}</h2>
            </div>
            <button class="modal-close" type="button" aria-label="닫기" @click="closeModal">×</button>
          </header>
          <slot />
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
