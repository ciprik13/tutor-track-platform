import { useState } from 'react'
import { useCreateStudent, useUpdateStudent } from '@/queries/useStudents'
import type { Student } from '@/types'

interface Props {
  student: Student | null
  onClose: () => void
}

const IcClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

export default function StudentModal({ student, onClose }: Props) {
  const [form, setForm] = useState<Omit<Student, 'id'>>({
    name:      student?.name      ?? '',
    subject:   student?.subject   ?? '',
    grade:     student?.grade     ?? '',
    status:    student?.status    ?? 'active',
    priority:  student?.priority  ?? false,
    phone:     student?.phone     ?? '',
    notes:     student?.notes     ?? '',
    createdAt: student?.createdAt ?? new Date().toISOString(),
  })

  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (student?.id) updateStudent.mutate({ ...form, id: student.id }, { onSuccess: onClose })
    else             createStudent.mutate(form, { onSuccess: onClose })
  }

  const isValid = form.name.trim() && form.subject.trim()

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
            {student ? 'Editează student' : 'Student nou'}
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

            {/* Name */}
            <div>
              <label className="tt-label">Nume complet</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="ex. Alexandru Ciobanu" className="tt-input" />
            </div>

            {/* Subject + Grade */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Materie</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="ex. Matematică" className="tt-input" />
              </div>
              <div>
                <label className="tt-label">Clasă</label>
                <input name="grade" value={form.grade} onChange={handleChange} placeholder="ex. clasa 9" className="tt-input" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="tt-label">Telefon</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="ex. +373 69 000 000" className="tt-input" />
            </div>

            {/* Status + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'end' }}>
              <div>
                <label className="tt-label">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="tt-input">
                  <option value="active">Activ</option>
                  <option value="inactive">Inactiv</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, priority: !p.priority }))}
                style={{
                  height: 38, padding: '0 14px', borderRadius: 'var(--r-md)',
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: form.priority ? 'var(--warning-soft)' : 'var(--bg-input)',
                  color: form.priority ? 'var(--warning-strong)' : 'var(--text-2)',
                  border: form.priority ? '0.5px solid color-mix(in srgb, var(--warning) 30%, transparent)' : '0.5px solid transparent',
                  fontSize: 13.5, fontWeight: 500, cursor: 'pointer', transition: 'all 120ms',
                  fontFamily: 'var(--font-text)',
                }}
              >
                <span style={{ color: form.priority ? 'var(--warning)' : 'var(--text-3)' }}><IcStar /></span>
                Prioritar
              </button>
            </div>

            {/* Notes */}
            <div>
              <label className="tt-label">Note (opțional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Observații despre stil de învățare, obiective..." className="tt-input" style={{ resize: 'none' }} />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} className="tt-btn tt-btn-secondary" style={{ flex: 1, height: 40, justifyContent: 'center' }}>
                Anulează
              </button>
              <button type="submit" disabled={!isValid} className="tt-btn tt-btn-primary" style={{ flex: 1, height: 40, justifyContent: 'center' }}>
                {student ? 'Salvează' : 'Adaugă student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
