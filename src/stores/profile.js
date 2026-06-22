import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as profileApi from '@/api/profile'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(null)
  const calorieTarget = ref(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const hasProfile = computed(() => Boolean(profile.value))

  function setProfile(nextProfile) {
    profile.value = nextProfile
  }

  function clearProfile() {
    profile.value = null
    calorieTarget.value = null
    errorMessage.value = ''
  }

  async function fetchProfile() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const data = await profileApi.getProfile()
      setProfile(data)
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function saveProfile(nextProfile) {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const data = await profileApi.saveProfile(nextProfile)
      setProfile(data)
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCalorieTarget() {
    const data = await profileApi.getCalorieTarget()
    calorieTarget.value = data
    return data
  }

  return {
    profile,
    calorieTarget,
    isLoading,
    errorMessage,
    hasProfile,
    setProfile,
    clearProfile,
    fetchProfile,
    saveProfile,
    fetchCalorieTarget,
  }
})
