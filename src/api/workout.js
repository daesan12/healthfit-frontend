import { apiClient, unwrapResponse } from './client'
import { mapWorkout, mapWorkoutLog } from './adapters'

export async function getWorkouts(params) {
  const response = await apiClient.get('/exercises/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapWorkout) : data
}

export async function getWorkout(id) {
  const response = await apiClient.get(`/exercises/${id}/`)
  return mapWorkout(unwrapResponse(response))
}

export async function recommendWorkout(payload) {
  const response = await apiClient.post('/ai/workout/recommendations/', payload)
  return unwrapResponse(response)
}

export async function getWorkoutRoutines() {
  const response = await apiClient.get('/workout-routines/')
  return unwrapResponse(response)
}

export async function getWorkoutLogs(params) {
  const response = await apiClient.get('/workout-logs/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapWorkoutLog) : data
}

export async function createWorkoutLog(payload) {
  const response = await apiClient.post('/workout-logs/', {
    exercise_id: payload.exerciseId,
    workout_date: payload.workoutDate,
    workout_time: payload.workoutTime,
    set_count: payload.setCount,
    repetition: payload.repetition,
    memo: payload.memo,
  })
  return mapWorkoutLog(unwrapResponse(response))
}

export async function deleteWorkoutLog(logId) {
  const response = await apiClient.delete(`/workout-logs/${logId}/`)
  return unwrapResponse(response)
}
