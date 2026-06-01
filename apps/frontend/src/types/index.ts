export interface Profile {
  name: string
  email: string
  phone: string
  defaultPrice60: number
  defaultPrice90: number
  defaultPrice120: number
  currency: 'MDL' | 'USD' | 'EUR'
  googleCalendarToken: string | null
  googleCalendarConnected: boolean
  availableDurations: number[]
}

export interface Student {
  id?: string
  tutorId: string
  userAccountId?: string | null
  name: string
  subject?: string
  grade?: string
  status: 'active' | 'inactive'
  phone?: string
  email?: string
  notes?: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  priceOverride?: number 
}

export interface Lesson {
  id: string
  tutorId: string
  studentId: string
  date: string
  durationMinutes: number
  price: string
  isPaid: boolean
  gradeSnapshot?: string | null
  studentNameSnapshot: string
  subjectSnapshot?: string | null
  googleCalendarEventId?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  student?: { id: string; name: string; subject?: string }
  payment?: Payment | null
}

export interface Payment {
  id: string
  tutorId: string
  studentId: string
  lessonId: string
  amount: string
  month: string
  status: 'paid' | 'unpaid' | 'partial'
  paidAt?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  createdBy?: string | null
  updatedBy?: string | null
  student?: { id: string; name: string }
  lesson?: { id: string; date: string; durationMinutes: number }
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  limit: number
  offset: number
}