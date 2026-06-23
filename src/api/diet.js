import { apiClient, mapPaginatedData, unwrapResponse } from './client'
import {
  mapDietFeedback,
  mapDietRecommendation,
  mapFood,
  mapMeal,
  mapMealDashboard,
  mapSavedMeal,
} from './adapters'

export async function getFoods(params) {
  const response = await apiClient.get('/foods/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []
  return results.map(mapFood)
}

export async function getFoodsPage(params) {
  const response = await apiClient.get('/foods/', { params })
  return mapPaginatedData(unwrapResponse(response), mapFood)
}

export async function getFood(foodId) {
  const response = await apiClient.get(`/foods/${foodId}/`)
  return mapFood(unwrapResponse(response))
}

function toFoodPayload(food) {
  return {
    name: food.name,
    category: food.category,
    calories: food.calories,
    carbohydrate: food.carbohydrate,
    protein: food.protein,
    fat: food.fat,
  }
}

export async function createFood(food) {
  const response = await apiClient.post('/foods/', toFoodPayload(food))
  return mapFood(unwrapResponse(response))
}

export async function updateFood(foodId, food) {
  const response = await apiClient.patch(`/foods/${foodId}/`, toFoodPayload(food))
  return mapFood(unwrapResponse(response))
}

export async function deleteFood(foodId) {
  const response = await apiClient.delete(`/foods/${foodId}/`)
  return unwrapResponse(response)
}

export async function getMeals(params) {
  const response = await apiClient.get('/meals/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []
  return results.map(mapMeal)
}

export async function getMealsPage(params) {
  const response = await apiClient.get('/meals/', { params })
  return mapPaginatedData(unwrapResponse(response), mapMeal)
}

export async function createMeal(payload) {
  const response = await apiClient.post('/meals/', {
    meal_type: payload.mealType,
    meal_order: payload.mealOrder,
    meal_label: payload.mealLabel,
    intake_date: payload.intakeDate,
    items: payload.items.map((item) => ({
      food_id: item.foodId,
      amount: item.amount,
    })),
  })
  return mapMeal(unwrapResponse(response))
}

export async function getMeal(mealId) {
  const response = await apiClient.get(`/meals/${mealId}/`)
  return mapMeal(unwrapResponse(response))
}

export async function updateMeal(mealId, payload) {
  const requestBody = {}

  if ('mealType' in payload) requestBody.meal_type = payload.mealType
  if ('mealOrder' in payload) requestBody.meal_order = payload.mealOrder
  if ('mealLabel' in payload) requestBody.meal_label = payload.mealLabel
  if ('intakeDate' in payload) requestBody.intake_date = payload.intakeDate
  if ('items' in payload) {
    requestBody.items = payload.items.map((item) => ({
      food_id: item.foodId,
      amount: item.amount,
    }))
  }

  const response = await apiClient.patch(`/meals/${mealId}/`, requestBody)
  return mapMeal(unwrapResponse(response))
}

export async function deleteMeal(mealId) {
  const response = await apiClient.delete(`/meals/${mealId}/`)
  return unwrapResponse(response)
}

export async function addMealItem(mealId, payload) {
  const response = await apiClient.post(`/meals/${mealId}/items/`, {
    food_id: payload.foodId,
    amount: payload.amount,
  })
  return unwrapResponse(response)
}

export async function updateMealItem(mealItemId, payload) {
  const response = await apiClient.patch(`/meal-items/${mealItemId}/`, {
    amount: payload.amount,
  })
  return unwrapResponse(response)
}

export async function deleteMealItem(mealItemId) {
  const response = await apiClient.delete(`/meal-items/${mealItemId}/`)
  return unwrapResponse(response)
}

export async function getSavedMeals(params) {
  const response = await apiClient.get('/saved-meals/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []
  return results.map(mapSavedMeal)
}

export async function getSavedMealsPage(params) {
  const response = await apiClient.get('/saved-meals/', { params })
  return mapPaginatedData(unwrapResponse(response), mapSavedMeal)
}

function toSavedMealPayload(savedMeal) {
  return {
    name: savedMeal.name,
    description: savedMeal.description,
    items: (savedMeal.items || []).map((item) => {
      const payload = { amount: item.amount }
      if (item.foodId) payload.food_id = item.foodId
      if (item.aiFoodKey) payload.ai_food_key = item.aiFoodKey
      return payload
    }),
  }
}

export async function createSavedMeal(savedMeal) {
  const response = await apiClient.post('/saved-meals/', toSavedMealPayload(savedMeal))
  return mapSavedMeal(unwrapResponse(response))
}

export async function updateSavedMeal(savedMealId, savedMeal) {
  const response = await apiClient.patch(`/saved-meals/${savedMealId}/`, toSavedMealPayload(savedMeal))
  return mapSavedMeal(unwrapResponse(response))
}

export async function deleteSavedMeal(savedMealId) {
  const response = await apiClient.delete(`/saved-meals/${savedMealId}/`)
  return unwrapResponse(response)
}

export async function createMealFromSavedMeal(savedMealId, payload) {
  const response = await apiClient.post(`/saved-meals/${savedMealId}/create-meal/`, {
    meal_type: payload.mealType,
    intake_date: payload.intakeDate,
  })
  return mapMeal(unwrapResponse(response))
}

export async function getMealDashboard(params) {
  const response = await apiClient.get('/meals/dashboard/', { params })
  return mapMealDashboard(unwrapResponse(response))
}

export async function recommendDiet(payload) {
  const response = await apiClient.post('/ai/diet/recommendations/', payload)
  return mapDietRecommendation(unwrapResponse(response))
}

export async function getDietRecommendation(recommendationId) {
  const response = await apiClient.get(`/ai/diet/recommendations/${recommendationId}/`)
  return mapDietRecommendation(unwrapResponse(response))
}

export async function evaluateDiet(payload) {
  const response = await apiClient.post('/ai/diet/evaluations/', payload)
  return mapDietFeedback(unwrapResponse(response))
}

export async function getDietFeedbacks(params) {
  const response = await apiClient.get('/diet-feedbacks/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || data || []
  return results.map(mapDietFeedback)
}

export async function saveDietRecommendation(recommendationId, payload) {
  const response = await apiClient.post(`/ai/diet/recommendations/${recommendationId}/save/`, payload)
  return unwrapResponse(response)
}

export async function replaceDietRecommendationFood(recommendationId, payload) {
  const requestBody = {
    meal_order: payload.mealOrder,
    message: payload.message,
  }

  if (payload.replaceFoodId) {
    requestBody.replace_food_id = payload.replaceFoodId
  }

  if (payload.replaceAiFoodKey) {
    requestBody.replace_ai_food_key = payload.replaceAiFoodKey
  }

  const response = await apiClient.post(`/ai/diet/recommendations/${recommendationId}/replace/`, requestBody)
  return mapDietRecommendation(unwrapResponse(response))
}

export async function rerollDietRecommendation(recommendationId, payload) {
  const response = await apiClient.post(`/ai/diet/recommendations/${recommendationId}/reroll/`, {
    message: payload.message,
  })
  return mapDietRecommendation(unwrapResponse(response))
}
