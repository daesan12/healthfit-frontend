import { apiClient, unwrapResponse } from './client'
import { mapDietFeedback, mapDietRecommendation, mapFood } from './adapters'

export async function getFoods(params) {
  const response = await apiClient.get('/foods/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapFood) : data
}

export async function getMeals(params) {
  const response = await apiClient.get('/meals/', { params })
  return unwrapResponse(response)
}

export async function createMeal(payload) {
  const response = await apiClient.post('/meals/', payload)
  return unwrapResponse(response)
}

export async function recommendDiet(payload) {
  const response = await apiClient.post('/ai/diet/recommendations/', payload)
  return mapDietRecommendation(unwrapResponse(response))
}

export async function evaluateDiet(payload) {
  const response = await apiClient.post('/ai/diet/evaluations/', payload)
  return mapDietFeedback(unwrapResponse(response))
}
