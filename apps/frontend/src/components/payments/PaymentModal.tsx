import { useState, useEffect } from 'react'
import { useCreatePayment, useUpdatePayment } from '@/queries/usePayments'
import { useStudents } from '@/queries/useStudents'
import { useLessons } from '@/queries/useLessons'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import type { Payment } from '@/types'
import { toLocalISOString } from '@/lib/dateUtils'

interface Props {
  payment: Payment | null
  onClose: () => void
}

const IcClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IcWallet = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)

export default function PaymentModal({ payment, onClose }: Props) {
  const profile = useSelector((s: RootState) => s.profile)
  const { data: students = [] } = useStudents()

  const [amount, setAmount] = useState(payment?.amount?.toString() ?? '')
  const [form, setForm] = useState({
    studentId: payment?.studentId ?? (students[0]?.id ?? 0),
    currency:  payment?.currency ?? profile.currency,
    period:    payment?.period ?? new Date().toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' }),
    status:    (payment?.status ?? 'unpaid') as 'paid' | 'unpaid' | 'partial',
    date:      payment?.date ?? toLocalISOString(new Date()).slice(0, 10),
    notes:     payment?.notes ?? '',
    createdAt: payment?.createdAt ?? new Date().toISOString(),
  })

  const { data: unpaidLessons = [] } = useLessons({
    studentId:     form.studentId || undefined,
    paymentStatus: 'unpaid',
    status:        'done',
  })
  const unpaidTotal = unpaidLessons.reduce((s, l) => s + l.pricePerSession, 0)

  // Auto-fill amount on student change
  useEffect(() => {
    if (!payment && form.studentId) {
      setAmount(unpaidTotal > 0 ? unpaidTotal.toString() : '')
    }
  }, [form.studentId, unpaidTotal, payment])

  const createPayment = useCreatePayment()
  const updatePayment = useUpdatePayment()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: name === 'studentId' ? Number(value) : value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, amount: Number(amount) }
    if (payment?.id) updatePayment.mutate({ ...data, id: payment.id }, { onSuccess: onClose })
    else             createPayment.mutate(data, { onSuccess: onClose })
  }

  const isValid = form.studentId && Number(amount) > 0 && form.period.trim()

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
        width: '100%', maxWidth: 480,
        background: 'var(--bg-card)', borderRadius: 'var(--r-xl)',
        boxShadow: 'var(--shadow-modal)',
        border: '0.5px solid var(--border)',
        overflow: 'hidden', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '0.5px solid var(--border)', flexShrink: 0 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)', margin: 0 }}>
            {payment ? 'Editează plată' : 'Înregistrează plată'}
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
            <div>
              <label className="tt-label">Student</label>
              <select name="studentId" value={form.studentId} onChange={handleChange} className="tt-input">
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Unpaid banner — key UX touch point */}
            {!payment && unpaidLessons.length > 0 && (
              <div style={{
                padding: '13px 16px',
                background: 'var(--warning-soft)',
                border: '0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)',
                borderRadius: 'var(--r-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: 'var(--warning)' }}><IcWallet /></span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--warning-strong)' }}>
                      {unpaidLessons.length} {unpaidLessons.length === 1 ? 'lecție neachitată' : 'lecții neachitate'}
                    </div>
                    <div className="tabular" style={{ fontSize: 12, color: 'var(--warning-strong)', opacity: 0.8, marginTop: 1 }}>
                      Total: {unpaidTotal.toLocaleString()} {profile.currency}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAmount(unpaidTotal.toString())}
                  style={{
                    height: 30, padding: '0 12px', borderRadius: 7,
                    background: 'var(--warning-strong)', color: 'white',
                    fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer',
                    flexShrink: 0, fontFamily: 'var(--font-text)',
                  }}
                >Folosește suma</button>
              </div>
            )}

            {/* Amount + Currency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
              <div>
                <label className="tt-label">Sumă</label>
                <input
                  type="number" value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="ex. 300" min={0}
                  className="tt-input tabular"
                  style={{ fontSize: 18, fontWeight: 600 }}
                />
              </div>
              <div>
                <label className="tt-label">Monedă</label>
                <select name="currency" value={form.currency} onChange={handleChange} className="tt-input" style={{ width: 90 }}>
                  <option value="MDL">MDL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            {/* Period */}
            <div>
              <label className="tt-label">Perioadă</label>
              <input name="period" value={form.period} onChange={handleChange} placeholder="ex. Aprilie 2026" className="tt-input" />
            </div>

            {/* Date + Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="tt-label">Data</label>
                <input name="date" type="date" value={form.date} onChange={handleChange} className="tt-input" />
              </div>
              <div>
                <label className="tt-label">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="tt-input">
                  <option value="unpaid">Neachitat</option>
                  <option value="paid">Achitat</option>
                  <option value="partial">Parțial</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="tt-label">Note (opțional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Numerar, transfer bancar..." className="tt-input" style={{ resize: 'none' }} />
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
              <button type="button" onClick={onClose} className="tt-btn tt-btn-secondary" style={{ flex: 1, height: 40, justifyContent: 'center' }}>
                Anulează
              </button>
              <button type="submit" disabled={!isValid} className="tt-btn tt-btn-primary" style={{ flex: 1, height: 40, justifyContent: 'center' }}>
                {payment ? 'Salvează' : 'Înregistrează plata'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
