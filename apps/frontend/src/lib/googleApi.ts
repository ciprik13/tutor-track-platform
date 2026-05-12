import { apiClient } from './api'
import { store } from '@/store'

export const googleApi = {
  getStatus: () =>
    apiClient.get<{
      connected: boolean
      googleEmail: string | null
      lastSyncedAt: string | null
    }>('/google/status').then(r => r.data),

  connect: () => {
    const state = store.getState()
    const tutorId = state.auth.user?.id
    if (!tutorId) throw new Error('Not authenticated')
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
    window.location.href = `${apiUrl}/google/connect?tutorId=${tutorId}`
  },

  disconnect: () =>
    apiClient.post('/google/disconnect').then(r => r.data),

  getEvents: (month: string) =>
    apiClient.get<{ connected: boolean; events: any[] }>('/google/events', {
      params: { month },
    }).then(r => r.data),
}
