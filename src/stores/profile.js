import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)

  const hasProfile = computed(() => Boolean(profile.value))

  function setProfile(nextProfile) {
    profile.value = nextProfile
  }

  function clearProfile() {
    profile.value = null
  }

  return {
    profile,
    hasProfile,
    setProfile,
    clearProfile,
  }
})
