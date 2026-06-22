import { apiClient, mapPaginatedData, unwrapResponse } from './client'
import { mapWorkout, mapWorkoutLog, mapWorkoutRoutine } from './adapters'

export async function getWorkouts(params) {
  const response = await apiClient.get('/exercises/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []
  return results.map(mapWorkout)
}

export async function getWorkoutsPage(params) {
  const response = await apiClient.get('/exercises/', { params })
  return mapPaginatedData(unwrapResponse(response), mapWorkout)
}

export async function getWorkout(id) {
  const response = await apiClient.get(`/exercises/${id}/`)
  return mapWorkout(unwrapResponse(response))
}

function toExercisePayload(exercise) {
  return {
    name: exercise.name,
    gif_url: exercise.gifUrl || null,
    body_parts: splitList(exercise.bodyParts),
    equipments: splitList(exercise.equipments),
    target_muscles: splitList(exercise.targetMuscles),
    secondary_muscles: splitList(exercise.secondaryMuscles),
    instructions: splitList(exercise.instructions),
  }
}

function splitList(value) {
  if (Array.isArray(value)) return value
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function createWorkout(exercise) {
  const response = await apiClient.post('/exercises/', toExercisePayload(exercise))
  return mapWorkout(unwrapResponse(response))
}

export async function updateWorkout(exerciseId, exercise) {
  const response = await apiClient.patch(`/exercises/${exerciseId}/`, toExercisePayload(exercise))
  return mapWorkout(unwrapResponse(response))
}

export async function deleteWorkout(exerciseId) {
  const response = await apiClient.delete(`/exercises/${exerciseId}/`)
  return unwrapResponse(response)
}

export async function recommendWorkout(payload) {
  const response = await apiClient.post('/ai/workout/recommendations/', payload)
  return unwrapResponse(response)
}

export async function saveWorkoutRecommendation(recommendationId, payload) {
  const response = await apiClient.post(`/ai/recommendations/${recommendationId}/save-routine/`, payload)
  return unwrapResponse(response)
}

export async function getWorkoutRoutines(params) {
  const response = await apiClient.get('/workout-routines/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []
  return results.map(mapWorkoutRoutine)
}

export async function getWorkoutRoutinesPage(params) {
  const response = await apiClient.get('/workout-routines/', { params })
  return mapPaginatedData(unwrapResponse(response), mapWorkoutRoutine)
}

export async function createWorkoutRoutine(payload) {
  const response = await apiClient.post('/workout-routines/', {
    name: payload.name,
    description: payload.description,
  })
  return mapWorkoutRoutine(unwrapResponse(response))
}

export async function updateWorkoutRoutine(routineId, payload) {
  const response = await apiClient.patch(`/workout-routines/${routineId}/`, {
    name: payload.name,
    description: payload.description,
  })
  return mapWorkoutRoutine(unwrapResponse(response))
}

export async function deleteWorkoutRoutine(routineId) {
  const response = await apiClient.delete(`/workout-routines/${routineId}/`)
  return unwrapResponse(response)
}

export async function addRoutineItem(routineId, payload) {
  const response = await apiClient.post(`/workout-routines/${routineId}/items/`, {
    exercise_id: payload.exerciseId,
    order: payload.order,
    sets: payload.sets,
    reps: payload.reps,
    weight: payload.weight,
    rest_seconds: payload.restSeconds,
  })
  return unwrapResponse(response)
}

export async function updateRoutineItem(routineItemId, payload) {
  const response = await apiClient.patch(`/routine-items/${routineItemId}/`, {
    order: payload.order,
    sets: payload.sets,
    reps: payload.reps,
    weight: payload.weight,
    rest_seconds: payload.restSeconds,
  })
  return unwrapResponse(response)
}

export async function deleteRoutineItem(routineItemId) {
  const response = await apiClient.delete(`/routine-items/${routineItemId}/`)
  return unwrapResponse(response)
}

export async function getWorkoutLogs(params) {
  const response = await apiClient.get('/workout-logs/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []
  return results.map(mapWorkoutLog)
}

export async function getWorkoutLogsPage(params) {
  const response = await apiClient.get('/workout-logs/', { params })
  return mapPaginatedData(unwrapResponse(response), mapWorkoutLog)
}

export async function getWorkoutLog(logId) {
  const response = await apiClient.get(`/workout-logs/${logId}/`)
  return mapWorkoutLog(unwrapResponse(response))
}

export async function createWorkoutLog(payload) {
  const response = await apiClient.post('/workout-logs/', {
    workout_id: payload.workoutId,
    routine_id: payload.routineId || null,
    workout_date: payload.workoutDate,
    workout_time: payload.workoutTime,
    sets: payload.sets,
    memo: payload.memo,
  })
  return mapWorkoutLog(unwrapResponse(response))
}

export async function updateWorkoutLog(logId, payload) {
  const response = await apiClient.patch(`/workout-logs/${logId}/`, {
    workout_id: payload.workoutId,
    routine_id: payload.routineId || null,
    workout_date: payload.workoutDate,
    workout_time: payload.workoutTime,
    sets: payload.sets,
    memo: payload.memo,
  })
  return mapWorkoutLog(unwrapResponse(response))
}

export async function deleteWorkoutLog(logId) {
  const response = await apiClient.delete(`/workout-logs/${logId}/`)
  return unwrapResponse(response)
}

export async function recommendWorkoutProgression(payload) {
  const response = await apiClient.post('/ai/workout/progression/', {
    workout_id: payload.workoutId,
    target_date: payload.targetDate,
    goal: payload.goal,
    message: payload.message,
  })
  return unwrapResponse(response)
}
