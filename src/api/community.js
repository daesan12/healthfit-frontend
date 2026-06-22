import { apiClient, mapPaginatedData, unwrapResponse } from './client'
import { mapComment, mapPost, mapPostDetail } from './adapters'

export async function getPosts(params) {
  const response = await apiClient.get('/posts/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []

  return {
    count: data.count ?? results.length,
    page: data.page ?? 1,
    pageSize: data.page_size ?? results.length,
    totalPages: data.total_pages ?? 1,
    hasNext: Boolean(data.has_next),
    hasPrevious: Boolean(data.has_previous),
    results: results.map(mapPost),
  }
}

export async function getPost(postId) {
  const response = await apiClient.get(`/posts/${postId}/`)
  return mapPostDetail(unwrapResponse(response))
}

export async function createPost(payload) {
  const response = await apiClient.post('/posts/', {
    title: payload.title,
    category: payload.category,
    content: payload.content,
    shared_saved_meal_id: payload.sharedSavedMealId || null,
    shared_workout_routine_id: payload.sharedWorkoutRoutineId || null,
  })
  return mapPostDetail(unwrapResponse(response))
}

export async function updatePost(postId, payload) {
  const requestBody = {
    title: payload.title,
    category: payload.category,
    content: payload.content,
  }

  if ('sharedSavedMealId' in payload) {
    requestBody.shared_saved_meal_id = payload.sharedSavedMealId || null
  }

  if ('sharedWorkoutRoutineId' in payload) {
    requestBody.shared_workout_routine_id = payload.sharedWorkoutRoutineId || null
  }

  const response = await apiClient.patch(`/posts/${postId}/`, requestBody)
  return mapPostDetail(unwrapResponse(response))
}

export async function deletePost(postId) {
  const response = await apiClient.delete(`/posts/${postId}/`)
  return unwrapResponse(response)
}

export async function togglePostLike(postId) {
  const response = await apiClient.post(`/posts/${postId}/like/`)
  return unwrapResponse(response)
}

export async function createComment(postId, payload) {
  const response = await apiClient.post(`/posts/${postId}/comments/`, {
    content: payload.content,
  })
  return mapComment(unwrapResponse(response))
}

export async function getComments(postId, params) {
  const response = await apiClient.get(`/posts/${postId}/comments/`, { params })
  return mapPaginatedData(unwrapResponse(response), mapComment)
}

export async function updateComment(commentId, payload) {
  const response = await apiClient.patch(`/comments/${commentId}/`, {
    content: payload.content,
  })
  return mapComment(unwrapResponse(response))
}

export async function deleteComment(commentId) {
  const response = await apiClient.delete(`/comments/${commentId}/`)
  return unwrapResponse(response)
}

export async function saveSharedMeal(postId) {
  const response = await apiClient.post(`/posts/${postId}/save-shared-meal/`)
  return unwrapResponse(response)
}

export async function saveSharedRoutine(postId) {
  const response = await apiClient.post(`/posts/${postId}/save-shared-routine/`)
  return unwrapResponse(response)
}

export async function getPublicProfile(userId) {
  const response = await apiClient.get(`/users/${userId}/public-profile/`)
  return unwrapResponse(response)
}
