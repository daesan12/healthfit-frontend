import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('healthfit_access_token') || '')
  const refreshToken = ref(localStorage.getItem('healthfit_refresh_token') || '')
  const user = ref(null)
  const isLoading = ref(false)
  const isSessionReady = ref(!accessToken.value)

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  function setTokens(tokens = {}) {
    accessToken.value = tokens.access || ''
    refreshToken.value = tokens.refresh || ''

    if (accessToken.value) {
      localStorage.setItem('healthfit_access_token', accessToken.value)
    } else {
      localStorage.removeItem('healthfit_access_token')
    }

    if (refreshToken.value) {
      localStorage.setItem('healthfit_refresh_token', refreshToken.value)
    } else {
      localStorage.removeItem('healthfit_refresh_token')
    }
  }

  function setUser(nextUser) {
    user.value = nextUser
  }

  async function login(credentials) {
    isLoading.value = true

    try {
      const data = await authApi.login(credentials)
      setTokens({
        access: data.access,
        refresh: data.refresh,
      })
      setUser(data.user)
      isSessionReady.value = true
      return data
    } finally {
      isLoading.value = false
    }
  }

  async function signup(payload) {
    isLoading.value = true

    try {
      return await authApi.signup(payload)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMe() {
    if (!accessToken.value) return null

    isSessionReady.value = false

    try {
      const data = await authApi.getMe()
      setUser(data)
      return data
    } catch (error) {
      clearAuth()
      throw error
    } finally {
      isSessionReady.value = true
    }
  }

  function clearAuth() {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    isSessionReady.value = true
    localStorage.removeItem('healthfit_access_token')
    localStorage.removeItem('healthfit_refresh_token')
  }

  async function logout() {
    const savedRefreshToken = refreshToken.value
    clearAuth()

    if (!savedRefreshToken) return

    try {
      await authApi.logout(savedRefreshToken)
    } catch {
      // Client state is already cleared, so a server-side logout failure is non-blocking.
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLoading,
    isSessionReady,
    isAuthenticated,
    setTokens,
    setUser,
    login,
    signup,
    fetchMe,
    clearAuth,
    logout,
  }
})
