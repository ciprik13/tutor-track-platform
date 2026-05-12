import { apiClient, setToken, clearToken } from './api'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
  phone?: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    name: string
    role: string
    status: string
    phone?: string | null
    timezone?: string
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload)
  setToken(data.access_token)
  return data
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
  setToken(data.access_token)
  return data
}

export async function logout() {
  clearToken()
}

// Lab only
export async function getLabToken(role: string, sub: string, name: string): Promise<string> {
  const { data } = await apiClient.post<{ access_token: string }>('/auth/token', {
    role, sub, name,
  })
  setToken(data.access_token)
  return data.access_token
}
