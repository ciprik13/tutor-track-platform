import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Profile } from '@/types'

const STORAGE_KEY = 'tutor_profile'

export const loadProfileFromStorage = createAsyncThunk(
  'profile/loadFromStorage',
  () => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  }
)

const initialState: Profile = {
  name: '',
  email: '',
  phone: '',
  defaultPrice60: 200,
  defaultPrice90: 300,
  defaultPrice120: 400,
  currency: 'MDL',
  googleCalendarToken: null,
  googleCalendarConnected: false,
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<Profile>>) => {
      Object.assign(state, action.payload)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    },
    clearProfile: () => {
      localStorage.removeItem(STORAGE_KEY)
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder.addCase(loadProfileFromStorage.fulfilled, (state, action) => {
      if (action.payload) Object.assign(state, action.payload)
    })
  },
})

export const { updateProfile, clearProfile } = profileSlice.actions
export default profileSlice.reducer