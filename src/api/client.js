// Base URL of the API. Defaults to "/api" (Vite dev proxy locally, nginx proxy in Docker).
// For a separately hosted backend set VITE_API_URL=https://your-api.example.com/api at build time.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')
const TOKEN_KEY = 'ems.token'

export const UNAUTHORIZED_EVENT = 'ems:unauthorized'

// "Remember me" keeps the token in localStorage, otherwise it lives only for the browser session.
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY),
  set: (token, remember) => {
    tokenStore.clear()
    ;(remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token)
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  },
}

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

async function request(path, { method = 'GET', body, params, auth = true } = {}) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      url.searchParams.set(key, String(value))
    }
  })

  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = tokenStore.get()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.')
  }

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401 && auth) {
      tokenStore.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(
      response.status,
      data?.message ?? 'Something went wrong. Please try again.',
      data?.fieldErrors ?? {},
    )
  }
  return data
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  me: () => request('/auth/me'),

  stats: {
    overview: () => request('/stats/overview'),
    mine: () => request('/stats/me'),
  },

  employees: {
    list: (params) => request('/employees', { params }),
    options: () => request('/employees/options'),
    create: (body) => request('/employees', { method: 'POST', body }),
    update: (id, body) => request(`/employees/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  },

  tasks: {
    list: (params) => request('/tasks', { params }),
    mine: (params) => request('/tasks/mine', { params }),
    create: (body) => request('/tasks', { method: 'POST', body }),
    update: (id, body) => request(`/tasks/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
    setStatus: (id, status) =>
      request(`/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
    setProgress: (id, percentComplete) =>
      request(`/tasks/${id}/progress`, { method: 'PATCH', body: { percentComplete } }),
  },
}
