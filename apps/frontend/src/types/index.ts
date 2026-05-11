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
}

export interface Student {
  id?: number
  name: string
  subject: string
  grade: string
  status: 'active' | 'inactive'
  priority: boolean
  phone: string
  notes: string
  createdAt: string
}

export interface Lesson {
  id?: number
  studentId: number
  title?: string
  date: string
  durationMinutes: 60 | 90 | 120
  pricePerSession: number
  status: 'done' | 'cancelled'
  paymentStatus: 'paid' | 'unpaid'
  googleCalendarEventId: string | null
  notes: string
  createdAt: string
}

export interface Payment {
  id?: number
  studentId: number
  amount: number
  currency: string
  period: string
  status: 'paid' | 'unpaid' | 'partial'
  date: string
  notes: string
  createdAt: string
}