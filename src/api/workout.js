import { apiClient, unwrapResponse } from './client'
import { mapWorkout } from './adapters'

export async function getWorkouts(params) {
  const response = await apiClient.get('/workouts/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapWorkout) : data
}

export async function recommendWorkout(payload) {
  const response = await apiClient.post('/ai/workout/recommendations/', payload)
  return unwrapResponse(response)
}

export async function getWorkoutRoutines() {
  const response = await apiClient.get('/workout-routines/')
  return unwrapResponse(response)
}
