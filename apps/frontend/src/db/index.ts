import Dexie, { type EntityTable } from 'dexie'
import type { Student, Lesson, Payment } from '@/types'

const db = new Dexie('tutor-track') as Dexie & {
  students: EntityTable<Student, 'id'>
  lessons: EntityTable<Lesson, 'id'>
  payments: EntityTable<Payment, 'id'>
}

db.version(1).stores({
  students: '++id, name, subject, status, priority, createdAt',
  lessons: '++id, studentId, date, durationMinutes, paymentStatus, status, createdAt',
  payments: '++id, studentId, period, status, date, createdAt',
})

export default db