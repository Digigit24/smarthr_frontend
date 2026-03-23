import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = (import.meta.env.VITE_API_URL || 'https://smart-hr.celiyo.com').replace(/\/+$/, '')
const AUTH_URL = (import.meta.env.VITE_AUTH_URL || 'https://smart-hr.celiyo.com').replace(/\/+$/, '')

// const BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
// const AUTH_URL = (import.meta.env.VITE_AUTH_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')

// ─── Axios instance ───────────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Timestamp of the last successful login — used to suppress 401 redirects
// for a brief window after login (race condition between navigate and queries)
let lastLoginAt = 0

// Request interceptor — attach Bearer token and tenant ID from the zustand store
api.interceptors.request.use((config) => {
  const { accessToken: storeToken, user } = useAuthStore.getState()
  // Fallback to localStorage in case zustand hasn't hydrated yet
  const accessToken = storeToken || localStorage.getItem('access_token')
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`

    // Prefer tenant_id from the user object; fall back to decoding the JWT
    let tenantId = user?.tenant_id
    if (!tenantId) {
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]))
        tenantId = payload.tenant_id
      } catch {
        // ignore malformed tokens
      }
    }
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId
    }
  }
  return config
})

// Guard against multiple simultaneous 401s each triggering a redirect
let isRedirecting = false

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      // Don't redirect within 5 seconds of a fresh login — the token is valid,
      // the 401 may be a transient issue or a race condition
      if (Date.now() - lastLoginAt < 5000) {
        console.warn('[api] Suppressed 401 redirect within login grace period')
        return Promise.reject(error)
      }
      isRedirecting = true
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Extract a JWT-like token from the login response, trying common response shapes */
function extractTokens(data: Record<string, unknown>): { access: string; refresh: string } {
  // Shape 1: { tokens: { access, refresh } }
  // Shape 2: { access, refresh }
  // Shape 3: { token, refresh }  (some backends use singular "token")
  // Shape 4: { access_token, refresh_token }
  const tokens = data.tokens as Record<string, string> | undefined
  const access =
    tokens?.access ??
    tokens?.access_token ??
    tokens?.token ??
    (data.access as string) ??
    (data.access_token as string) ??
    (data.token as string)
  const refresh =
    tokens?.refresh ??
    tokens?.refresh_token ??
    (data.refresh as string) ??
    (data.refresh_token as string) ??
    ''

  return { access: access ?? '', refresh }
}

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await axios.post(`${AUTH_URL}/api/auth/login/`, { email, password })
    const data = res.data

    console.log('[auth] Raw login response keys:', Object.keys(data))

    const { access, refresh } = extractTokens(data)

    if (!access) {
      console.error('[auth] Could not extract access token from login response:', data)
      throw new Error('Login succeeded but no access token was returned')
    }

    lastLoginAt = Date.now()

    return {
      user: data.user ?? null,
      tokens: { access, refresh },
    }
  },
}

// ─── Generic helpers ──────────────────────────────────────────────────────────
export async function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<T>(url, config)
  return res.data
}

export async function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<T>(url, data, config)
  return res.data
}

export async function patch<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.patch<T>(url, data)
  return res.data
}

export async function put<T>(url: string, data?: unknown): Promise<T> {
  const res = await api.put<T>(url, data)
  return res.data
}

export async function del(url: string): Promise<void> {
  await api.delete(url)
}

export async function download(url: string, filename: string): Promise<void> {
  const res = await api.get(url, { responseType: 'blob' })
  const blob = new Blob([res.data as BlobPart])
  const blobUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(blobUrl)
}
