import { useState } from 'react'
import { useCreateLesson, useUpdateLesson } from '@/queries/useLessons'
import { useStudents } from '@/queries/useStudents'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import DatePicker from '@/components/ui/DatePicker'
import { toLocalISOString } from '@/lib/dateUtils'

interface Props {
  lesson: any | null
  onClose: () => void
  preselectedStudentId?: string
}

const IcClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function LessonModal({ lesson, onClose, preselectedStudentId }: Props) {
  const profile = useSelector((s: RootState) => s.profile)
  const { data: students = [] } = useStudents()

  const [form, setForm] = useState({
    studentId:            lesson?.studentId ?? preselectedStudentId ?? '',
    date:                 lesson?.date ?? toLocalISOString(new Date()),
    durationMinutes:      lesson?.durationMinutes ?? 60,
    price:                lesson?.price ? Number(lesson.price) : profile.defaultPrice60,
    isPaid:               lesson?.isPaid ?? false,
    googleCalendarEventId: lesson?.googleCalendarEventId ?? undefined,
    notes:                lesson?.notes ?? '',
  })

  const createLesson = useCreateLesson()
  const updateLesson = useUpdateLesson()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => {
      const updated: any = {
        ...prev,
        [name]: ['durationMinutes', 'price'].includes(name) ? Number(value)
               : name === 'isPaid' ? value === 'paid'
               : name === 'studentId' ? value
               : value,
      }
      if (name === 'durationMinutes') {
        const d = Number(value) as 60 | 90 | 120
        updated.price = d === 60 ? profile.defaultPrice60 : d === 90 ? profile.defaultPrice90 : profile.defaultPrice120
      }
      return updated
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (lesson?.id) {
      updateLesson.mutate({ id: lesson.id, ...form }, { onSuccess: onClose })
    } else {
      createLesson.mutate(form, { onSuccess: onClose })
    }
  }

  const isValid = form.studentId && form.date

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--bg-overlay)', backdropFilter: 'blur(6px)',
        display: 'grid', placeItems: 'center', padding: 20,
      }}
    >
      <div style={{
        width: '100%', maxWidth: 500,
        background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-modal)',
        border: '0.5px solid var(--border)',
        overflow: 'hidden', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', margin: 0 }}>
            {lesson ? 'Editează lecție' : 'Lecție nouă'}
          </h2>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 8, color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-2)' }}
          ><IcClose /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 22, overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Student */}
            {!preselectedStudentId && (
              <div>
                <label className="tt-label">Student</label>
                <select name="studentId" value={form.studentId} onChange={handleChange} className="tt-input">
                  <option value="" disabled>Selectează student</option>
                  {(students as any[]).map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            {/* Date */}

            {/* Date */}
            <DatePicker
              label="Data și ora"
              value={form.date}
              onChange={val => setForm(p => ({ ...p, date: val }))}
              includeTime={true}
            />

            {/* Duration + Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Durată</label>
                <select name="durationMinutes" value={form.durationMinutes} onChange={handleChange} className="tt-input">
                  {profile.availableDurations.map(d => (
                    <option key={d} value={d}>{d} min</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="tt-label">Preț ({profile.currency})</label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  className="tt-input tabular"
                />
              </div>
            </div>

            {/* Payment status */}
            <div>
              <label className="tt-label">Status plată</label>
              <select
                name="isPaid"
                value={form.isPaid ? 'paid' : 'unpaid'}
                onChange={handleChange}
                className="tt-input"
              >
                <option value="unpaid">Neachitat</option>
                <option value="paid">Achitat</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="tt-label">Note (opțional)</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={2}
                placeholder="Observații..."
                className="tt-input"
                style={{ resize: 'none' }}
              />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} className="tt-btn tt-btn-secondary" style={{ flex: 1, height: 40, justifyContent: 'center' }}>
                Anulează
              </button>
              <button type="submit" disabled={!isValid} className="tt-btn tt-btn-primary" style={{ flex: 1, height: 40, justifyContent: 'center' }}>
                {lesson ? 'Salvează' : 'Adaugă'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
