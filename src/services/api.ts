import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:8000'

// ─── Axios instance ───────────────────────────────────────────────────────────
export const api: AxiosInstance = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach Bearer token from the zustand store
api.interceptors.request.use((config) => {
  // Read from the zustand store (always up-to-date, not a stale localStorage read)
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
      isRedirecting = true
      // clearAuth() updates zustand state AND the persisted `smarthr-auth` key,
      // so on page reload isAuthenticated will be false and login page won't redirect.
      useAuthStore.getState().clearAuth()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await axios.post(`${AUTH_URL}/api/auth/login/`, { email, password })
    return res.data
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
