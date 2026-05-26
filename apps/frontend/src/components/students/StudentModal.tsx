import { useState } from 'react'
import { useCreateStudent, useUpdateStudent } from '@/queries/useStudents'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'

interface Props {
  student: any | null
  onClose: () => void
}

const IcClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IcInfo = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
)

export default function StudentModal({ student, onClose }: Props) {
  const profile = useSelector((s: RootState) => s.profile)

  const [form, setForm] = useState({
    name:          student?.name          ?? '',
    subject:       student?.subject       ?? '',
    grade:         student?.grade         ?? '',
    status:        student?.status        ?? 'active',
    phone:         student?.phone         ?? '',
    email:         student?.email         ?? '',
    notes:         student?.notes         ?? '',
    priceOverride: student?.priceOverride != null
      ? String(student.priceOverride)
      : '',
  })

  const createStudent = useCreateStudent()
  const updateStudent = useUpdateStudent()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const priceOverrideValue = form.priceOverride.trim() !== ''
      ? parseFloat(form.priceOverride)
      : null

    const payload = {
      name:    form.name,
      subject: form.subject,
      grade:   form.grade,
      status:  form.status,
      phone:   form.phone,
      email:   form.email,
      notes:   form.notes,
      ...(priceOverrideValue !== null
        ? { priceOverride: priceOverrideValue }
        : { priceOverride: undefined }),
    }

    if (student?.id) {
      updateStudent.mutate({ id: student.id, ...payload }, { onSuccess: onClose })
    } else {
      createStudent.mutate(payload, { onSuccess: onClose })
    }
  }

  const isValid = form.name.trim() && form.subject.trim()

  const defaultPrice = profile.defaultPrice60 ?? 0
  const currency = profile.currency ?? 'MDL'

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
        <div style={{
          padding: '18px 22px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '0.5px solid var(--border)', flexShrink: 0,
        }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600,
            letterSpacing: '-0.02em', color: 'var(--text-1)', margin: 0,
          }}>
            {student ? 'Editează student' : 'Student nou'}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: 8, color: 'var(--text-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-1)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent'
              ;(e.currentTarget as HTMLElement).style.color = 'var(--text-2)'
            }}
          ><IcClose /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 22, overflowY: 'auto' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Nume */}
            <div>
              <label className="tt-label">Nume complet</label>
              <input
                name="name" value={form.name} onChange={handleChange}
                placeholder="ex. Alexandru Ciobanu" className="tt-input"
              />
            </div>

            {/* Materie + Clasă */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Materie</label>
                <input
                  name="subject" value={form.subject} onChange={handleChange}
                  placeholder="ex. Matematică" className="tt-input"
                />
              </div>
              <div>
                <label className="tt-label">Clasă</label>
                <input
                  name="grade" value={form.grade} onChange={handleChange}
                  placeholder="ex. 9" className="tt-input"
                />
              </div>
            </div>

            {/* Telefon + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Telefon</label>
                <input
                  name="phone" value={form.phone} onChange={handleChange}
                  placeholder="ex. +373 69 000 000" className="tt-input"
                />
              </div>
              <div>
                <label className="tt-label">Email</label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange}
                  placeholder="ex. student@email.com" className="tt-input"
                />
              </div>
            </div>

            {/* Status + Preț override */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="tt-input">
                  <option value="active">Activ</option>
                  <option value="inactive">Inactiv</option>
                </select>
              </div>
              <div>
                <label className="tt-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  Preț per ședință ({currency})
                  <span
                    title={`Dacă lipsește, se folosește prețul global: ${defaultPrice} ${currency}/60 min`}
                    style={{ color: 'var(--text-3)', cursor: 'help', display: 'flex' }}
                  >
                    <IcInfo />
                  </span>
                </label>
                <input
                  name="priceOverride"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceOverride}
                  onChange={handleChange}
                  placeholder={`implicit ${defaultPrice}`}
                  className="tt-input"
                />
              </div>
            </div>

            {/* Hint preț override */}
            {form.priceOverride.trim() !== '' && (
              <div style={{
                padding: '8px 12px',
                background: 'var(--bg-card-hover)',
                borderRadius: 8,
                border: '0.5px solid var(--border)',
                fontSize: 12,
                color: 'var(--text-2)',
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}>
                <IcInfo />
                Prețul global ({defaultPrice} {currency}) este ignorat pentru acest student.
                Lecțiile noi vor folosi <strong style={{ color: 'var(--text-1)' }}>{form.priceOverride} {currency}</strong>.
                Lecțiile existente nu sunt afectate.
              </div>
            )}

            {/* Note */}
            <div>
              <label className="tt-label">Note (opțional)</label>
              <textarea
                name="notes" value={form.notes} onChange={handleChange}
                rows={2} placeholder="Observații..." className="tt-input"
                style={{ resize: 'none' }}
              />
            </div>

            {/* Butoane */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button
                type="button" onClick={onClose}
                className="tt-btn tt-btn-secondary"
                style={{ flex: 1, height: 40, justifyContent: 'center' }}
              >
                Anulează
              </button>
              <button
                type="submit" disabled={!isValid}
                className="tt-btn tt-btn-primary"
                style={{ flex: 1, height: 40, justifyContent: 'center' }}
              >
                {student ? 'Salvează' : 'Adaugă student'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
