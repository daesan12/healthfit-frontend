import { apiClient, unwrapResponse } from './client'
import { mapPost } from './adapters'

export async function getPosts(params) {
  const response = await apiClient.get('/posts/', { params })
  const data = unwrapResponse(response)
  return Array.isArray(data) ? data.map(mapPost) : data
}

export async function createPost(payload) {
  const response = await apiClient.post('/posts/', payload)
  return mapPost(unwrapResponse(response))
}

export async function togglePostLike(postId) {
  const response = await apiClient.post(`/posts/${postId}/like/`)
  return unwrapResponse(response)
}
