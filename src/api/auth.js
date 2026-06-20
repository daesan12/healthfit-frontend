import { apiClient, unwrapResponse } from './client'

export async function login(payload) {
  const response = await apiClient.post('/auth/login/', {
    login_id: payload.loginId,
    password: payload.password,
  })
  return unwrapResponse(response)
}

export async function signup(payload) {
  const response = await apiClient.post('/auth/signup/', {
    username: payload.username,
    email: payload.email,
    password: payload.password,
  })
  return unwrapResponse(response)
}

export async function logout(refresh) {
  const response = await apiClient.post('/auth/logout/', { refresh })
  return unwrapResponse(response)
}

export async function getMe() {
  const response = await apiClient.get('/auth/me/')
  return unwrapResponse(response)
}
