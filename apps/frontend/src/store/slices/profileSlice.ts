import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Profile } from '@/types'

const getStorageKey = (userId?: string) => 
  userId ? `tutor_profile_${userId}` : 'tutor_profile'

export const loadProfileFromStorage = createAsyncThunk(
  'profile/loadFromStorage',
  (userId: string) => {
    // Try user-specific key first, then fall back to old key
    const raw = localStorage.getItem(getStorageKey(userId)) 
      ?? localStorage.getItem('tutor_profile')
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
  availableDurations: [60],
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    updateProfile: (state, action: PayloadAction<Partial<Profile> & { _userId?: string }>) => {
      const { _userId, ...rest } = action.payload
      Object.assign(state, rest)
      localStorage.setItem(getStorageKey(_userId), JSON.stringify(state))
    },
    clearProfile: (_, action: PayloadAction<string | undefined>) => {
      const userId = action.payload
      localStorage.removeItem(getStorageKey(userId))
      localStorage.removeItem('tutor_profile') // clean up old key
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
