import { apiClient, unwrapResponse } from './client'

export async function askAi(payload) {
  const response = await apiClient.post('/ai/chats/', payload)
  return unwrapResponse(response)
}

export async function getAiChats() {
  const response = await apiClient.get('/ai/chats/')
  return unwrapResponse(response)
}
