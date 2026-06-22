import { mapProfile } from './adapters'
import { apiClient, unwrapResponse } from './client'

function toProfilePayload(profile) {
  return {
    gender: profile.gender,
    age: profile.age,
    height: profile.height,
    weight: profile.weight,
    body_type: profile.bodyType,
    activity_level: profile.activityLevel,
    workout_goal: profile.workoutGoal,
    workout_experience: profile.workoutExperience,
  }
}

export async function getProfile() {
  const response = await apiClient.get('/profiles/me/')
  return mapProfile(unwrapResponse(response))
}

export async function saveProfile(profile) {
  const response = await apiClient.put('/profiles/me/', toProfilePayload(profile))
  return mapProfile(unwrapResponse(response))
}

export async function getCalorieTarget() {
  const response = await apiClient.get('/profiles/me/calorie-target/')
  return unwrapResponse(response)
}
