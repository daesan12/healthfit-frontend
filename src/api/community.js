import { apiClient, unwrapResponse } from './client'
import { mapComment, mapPost, mapPostDetail } from './adapters'

export async function getPosts(params) {
  const response = await apiClient.get('/posts/', { params })
  const data = unwrapResponse(response)
  const results = Array.isArray(data) ? data : data.results || []

  return {
    count: data.count ?? results.length,
    page: data.page ?? 1,
    pageSize: data.page_size ?? results.length,
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
  })
  return mapPostDetail(unwrapResponse(response))
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
