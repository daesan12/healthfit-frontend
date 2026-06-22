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

export function mapPaginatedData(data, mapper = (item) => item) {
  const results = Array.isArray(data) ? data : data?.results || []
  const count = data?.count ?? results.length
  const pageSize = data?.page_size ?? results.length

  return {
    count,
    page: data?.page ?? 1,
    pageSize,
    totalPages: data?.total_pages ?? (pageSize ? Math.max(1, Math.ceil(count / pageSize)) : 1),
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    hasNext: Boolean(data?.has_next ?? data?.next),
    hasPrevious: Boolean(data?.has_previous ?? data?.previous),
    results: results.map(mapper),
  }
}

export function normalizeApiError(errorPayload) {
  return {
    message: errorPayload?.message || '요청 처리에 실패했습니다.',
    errors: errorPayload?.errors || {},
  }
}

export function normalizeCaughtError(error) {
  if (error?.response?.data) {
    return normalizeApiError(error.response.data)
  }

  if (error?.message) {
    return {
      message: error.message,
      errors: {},
    }
  }

  return {
    message: '알 수 없는 오류가 발생했습니다.',
    errors: {},
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
