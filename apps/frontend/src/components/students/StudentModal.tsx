import { useState } from 'react'
import { useCreateStudent, useUpdateStudent } from '@/queries/useStudents'

interface Props {
  student: any | null
  onClose: () => void
}

const IcClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

export default function StudentModal({ student, onClose }: Props) {
  const [form, setForm] = useState({
    name:    student?.name    ?? '',
    subject: student?.subject ?? '',
    grade:   student?.grade   ?? '',
    status:  student?.status  ?? 'active',
    phone:   student?.phone   ?? '',
    email:   student?.email   ?? '',
    notes:   student?.notes   ?? '',
  })

  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (student?.id) {
      updateStudent.mutate({ id: student.id, ...form }, { onSuccess: onClose })
    } else {
      createStudent.mutate(form, { onSuccess: onClose })
    }
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

        <div style={{ padding: 22, overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="tt-label">Nume complet</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="ex. Alexandru Ciobanu" className="tt-input" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Materie</label>
                <input name="subject" value={form.subject} onChange={handleChange} placeholder="ex. Matematică" className="tt-input" />
              </div>
              <div>
                <label className="tt-label">Clasă</label>
                <input name="grade" value={form.grade} onChange={handleChange} placeholder="ex. 9" className="tt-input" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Telefon</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="ex. +373 69 000 000" className="tt-input" />
              </div>
              <div>
                <label className="tt-label">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="ex. student@email.com" className="tt-input" />
              </div>
            </div>

            <div>
              <label className="tt-label">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="tt-input">
                <option value="active">Activ</option>
                <option value="inactive">Inactiv</option>
              </select>
            </div>

            <div>
              <label className="tt-label">Note (opțional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Observații..." className="tt-input" style={{ resize: 'none' }} />
            </div>

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
