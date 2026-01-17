type QueryValue = string | number | boolean | null | undefined

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? '/api'

function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null
  )
  if (!entries.length) return ''
  const query = entries
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    )
    .join('&')
  return query ? `?${query}` : ''
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const headers = new Headers(options.headers ?? {})
  const hasJsonBody =
    options.body !== undefined && !(options.body instanceof FormData)

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`
    try {
      const errorBody = await response.json()
      if (typeof errorBody?.error === 'string') {
        message = errorBody.error
      } else if (Array.isArray(errorBody?.errors)) {
        message = errorBody.errors.join('; ')
      }
    } catch {
      // ignore JSON parse errors and keep default message
    }
    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export async function get<T>(
  path: string,
  params?: Record<string, QueryValue>
): Promise<T> {
  return request<T>(`${path}${buildQuery(params)}`, {
    method: 'GET',
  })
}

export async function post<T>(
  path: string,
  body?: unknown,
  params?: Record<string, QueryValue>
): Promise<T> {
  return request<T>(`${path}${buildQuery(params)}`, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function put<T>(
  path: string,
  body?: unknown,
  params?: Record<string, QueryValue>
): Promise<T> {
  return request<T>(`${path}${buildQuery(params)}`, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

export async function del<T>(
  path: string,
  params?: Record<string, QueryValue>
): Promise<T> {
  return request<T>(`${path}${buildQuery(params)}`, {
    method: 'DELETE',
  })
}

export { API_BASE_URL }
export type { QueryValue }

