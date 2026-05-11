import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface UiState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
}

const initialState: UiState = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark') ?? 'dark',
  sidebarOpen: true,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      localStorage.setItem('theme', state.theme)
      document.documentElement.setAttribute('data-theme', state.theme)
      document.body.style.background = state.theme === 'dark' ? '#0f1f24' : '#f2f2f2'
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
      localStorage.setItem('theme', action.payload)
      document.documentElement.setAttribute('data-theme', action.payload)
      document.body.style.background = action.payload === 'dark' ? '#0f1f24' : '#f2f2f2'
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
  },
})

export const { toggleTheme, setTheme, toggleSidebar } = uiSlice.actions
export default uiSlice.reducer