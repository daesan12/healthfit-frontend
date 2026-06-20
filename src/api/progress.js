import { mapProgress } from './adapters'
import { apiClient, unwrapResponse } from './client'

export async function getProgress(params) {
  const response = await apiClient.get('/progress/', { params })
  return mapProgress(unwrapResponse(response))
}
