import { apiClient, unwrapResponse } from './client'
import { mapDietFeedback, mapDietRecommendation, mapFood, mapMeal, mapMealDashboard } from './adapters'

export async function getFoods(params) {
  const response = await apiClient.get('/foods/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapFood) : data
}

export async function getMeals(params) {
  const response = await apiClient.get('/meals/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapMeal) : data
}

export async function createMeal(payload) {
  const response = await apiClient.post('/meals/', {
    meal_type: payload.mealType,
    intake_date: payload.intakeDate,
    items: payload.items.map((item) => ({
      food_id: item.foodId,
      amount: item.amount,
    })),
  })
  return mapMeal(unwrapResponse(response))
}

export async function deleteMeal(mealId) {
  const response = await apiClient.delete(`/meals/${mealId}/`)
  return unwrapResponse(response)
}

export async function getMealDashboard(params) {
  const response = await apiClient.get('/meals/dashboard/', { params })
  return mapMealDashboard(unwrapResponse(response))
}

export async function recommendDiet(payload) {
  const response = await apiClient.post('/ai/diet/recommendations/', payload)
  return mapDietRecommendation(unwrapResponse(response))
}

export async function evaluateDiet(payload) {
  const response = await apiClient.post('/ai/diet/evaluations/', payload)
  return mapDietFeedback(unwrapResponse(response))
}
