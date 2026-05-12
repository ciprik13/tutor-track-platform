import { configureStore } from '@reduxjs/toolkit'
import profileReducer from '@/store/slices/profileSlice'
import uiReducer from '@/store/slices/uiSlice'
import authReducer from '@/store/slices/authSlice'

export const store = configureStore({
  reducer: {
    profile: profileReducer,
    ui: uiReducer,
    auth: authReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
