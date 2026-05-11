import { apiClient, setToken, clearToken } from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  expires_in: string;
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', payload);
  setToken(data.access_token);
  return data;
}

export async function logout() {
  clearToken();
}

// Lab only — obține token cu rol direct
export async function getLabToken(role: string, sub: string, name: string): Promise<string> {
  const { data } = await apiClient.post<TokenResponse>('/auth/token', {
    role,
    sub,
    name,
  });
  setToken(data.access_token);
  return data.access_token;
}
