import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { store } from '@/store'
import App from './App'
import './index.css'
import { getLabToken } from '@/lib/authApi'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

const savedTheme = localStorage.getItem('theme') ?? 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)
document.body.style.background = savedTheme === 'dark' ? '#0f1f24' : '#f2f2f2'

// ── Lab: obține token automat la pornire ──────────────────────
// TODO: înlocuiește cu login real când implementăm auth UI
async function bootstrap() {
  try {
    await getLabToken(
      'TUTOR',
      '550e8400-e29b-41d4-a716-446655440000',
      'Ion Popescu',
    )
  } catch (err) {
    console.warn('Could not obtain auth token:', err)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </Provider>
    </StrictMode>
  )
}

bootstrap()
