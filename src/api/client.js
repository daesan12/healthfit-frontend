import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('healthfit_access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export function unwrapResponse(response) {
  const payload = response.data

  if (payload && typeof payload === 'object' && 'success' in payload) {
    if (!payload.success) {
      throw normalizeApiError(payload)
    }

    return payload.data
  }

  return payload?.data ?? payload
}

export function normalizeApiError(errorPayload) {
  return {
    message: errorPayload?.message || '요청 처리에 실패했습니다.',
    errors: errorPayload?.errors || {},
  }
}

export function mapFieldErrors(errors = {}) {
  return Object.fromEntries(
    Object.entries(errors).map(([field, messages]) => [
      field,
      Array.isArray(messages) ? messages.join(' ') : String(messages),
    ]),
  )
}
