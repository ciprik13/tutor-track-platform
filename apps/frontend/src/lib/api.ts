import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10_000,
})

// ── Request interceptor ──────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor ─────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken()
      import('@/store').then(({ store }) => {
        import('@/store/slices/authSlice').then(({ clearAuth }) => {
          store.dispatch(clearAuth())
        })
      })
      window.location.href = '/#/login'
    }
    return Promise.reject(error)
  },
)

const TOKEN_KEY = 'tt_access_token'
const PERSIST_KEY = 'tt_keep_logged_in'

/**
 * Salvează token-ul.
 * @param token  JWT primit de la API
 * @param persist true  → localStorage  (persistent între sesiuni de browser)
 *                false → sessionStorage (expiră la închiderea tab-ului)
 */
export function setToken(token: string, persist: boolean = true) {
  if (persist) {
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(PERSIST_KEY, 'true')
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(PERSIST_KEY)
  }
}

/**
 * Citește token-ul — verifică mai întâi localStorage, apoi sessionStorage.
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY)
}

/**
 * Șterge token-ul din ambele storage-uri (folosit la logout).
 */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(PERSIST_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}