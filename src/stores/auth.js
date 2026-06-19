import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(localStorage.getItem('healthfit_access_token') || '')
  const refreshToken = ref(localStorage.getItem('healthfit_refresh_token') || '')
  const user = ref(null)

  const isAuthenticated = computed(() => Boolean(accessToken.value))

  function setTokens(tokens) {
    accessToken.value = tokens.access || ''
    refreshToken.value = tokens.refresh || ''

    if (accessToken.value) {
      localStorage.setItem('healthfit_access_token', accessToken.value)
    }

    if (refreshToken.value) {
      localStorage.setItem('healthfit_refresh_token', refreshToken.value)
    }
  }

  function setUser(nextUser) {
    user.value = nextUser
  }

  function mockLogin() {
    setTokens({
      access: 'mock_access_token',
      refresh: 'mock_refresh_token',
    })
    setUser({
      id: 1,
      username: 'user01',
      email: 'user01@example.com',
    })
  }

  function logout() {
    accessToken.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.removeItem('healthfit_access_token')
    localStorage.removeItem('healthfit_refresh_token')
  }

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    setTokens,
    setUser,
    mockLogin,
    logout,
  }
})
