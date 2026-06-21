import { defineStore } from 'pinia'

let toastId = 0

export const useToastStore = defineStore('toast', {
  state: () => ({
    items: [],
  }),
  actions: {
    show({ type = 'success', title, message, timeout = 2600 }) {
      const id = ++toastId
      this.items.push({ id, type, title, message })

      window.setTimeout(() => {
        this.dismiss(id)
      }, timeout)
    },
    success(title, message) {
      this.show({ type: 'success', title, message })
    },
    error(title, message) {
      this.show({ type: 'error', title, message, timeout: 3600 })
    },
    dismiss(id) {
      this.items = this.items.filter((item) => item.id !== id)
    },
  },
})
