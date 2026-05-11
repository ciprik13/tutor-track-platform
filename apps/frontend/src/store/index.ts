import { configureStore } from '@reduxjs/toolkit'
import profileReducer from '@/store/slices/profileSlice'
import uiReducer from '@/store/slices/uiSlice'

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    ui: uiReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch