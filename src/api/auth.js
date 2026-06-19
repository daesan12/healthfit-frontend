import { apiClient, unwrapResponse } from './client'

export async function login(payload) {
  const response = await apiClient.post('/auth/login/', payload)
  return unwrapResponse(response)
}

export async function signup(payload) {
  const response = await apiClient.post('/auth/signup/', payload)
  return unwrapResponse(response)
}

export async function getMe() {
  const response = await apiClient.get('/auth/me/')
  return unwrapResponse(response)
}
