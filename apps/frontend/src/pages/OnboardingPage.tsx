import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '@/store/slices/profileSlice'
import type { AppDispatch } from '@/store'

const IcArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)

export default function OnboardingPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:           '',
    email:          '',
    phone:          '',
    defaultPrice60:  200,
    defaultPrice90:  300,
    defaultPrice120: 400,
    currency: 'MDL' as 'MDL' | 'USD' | 'EUR',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: ['defaultPrice60','defaultPrice90','defaultPrice120'].includes(name) ? Number(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch(updateProfile({ ...form, googleCalendarToken: null, googleCalendarConnected: false }))
    navigate('/dashboard')
  }

  const isValid = form.name.trim() && form.email.trim() && form.phone.trim()

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'var(--bg-page)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: 'var(--font-text)',
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>

        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'var(--accent)', color: 'var(--accent-fg)',
            display: 'grid', placeItems: 'center', margin: '0 auto 16px',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            letterSpacing: '-0.04em', boxShadow: 'var(--shadow-pop)',
          }}>tt</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600,
            letterSpacing: '-0.03em', color: 'var(--text-1)', margin: '0 0 10px',
            lineHeight: 1.15,
          }}>Bine ai venit în TutorTrack</h1>
          <p style={{ fontSize: 14.5, color: 'var(--text-2)', margin: 0, lineHeight: 1.55 }}>
            Câteva detalii ca să poți începe să-ți organizezi lecțiile și plățile.
          </p>
        </div>

        <div className="tt-card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>

            {/* Step 1 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                1 — Date personale
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="tt-label">Cum te numești?</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="ex. Maria Andrei" className="tt-input" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="tt-label">Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="ex. maria@email.com" className="tt-input" />
                  </div>
                  <div>
                    <label className="tt-label">Telefon</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="+373 69 ..." className="tt-input" />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                2 — Prețuri implicite
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {([60, 90, 120] as const).map(min => (
                  <div key={min}>
                    <label className="tt-label">{min} min</label>
                    <input
                      name={`defaultPrice${min}`}
                      type="number"
                      value={form[`defaultPrice${min}` as keyof typeof form]}
                      onChange={handleChange}
                      className="tt-input tabular"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>
                3 — Monedă
              </div>
              <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-input)', borderRadius: 'var(--r-md)' }}>
                {(['MDL', 'USD', 'EUR'] as const).map(c => (
                  <button
                    key={c} type="button"
                    onClick={() => setForm(prev => ({ ...prev, currency: c }))}
                    style={{
                      flex: 1, height: 38, borderRadius: 7, border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-display)', fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.01em',
                      background: form.currency === c ? 'var(--bg-card)' : 'transparent',
                      color: form.currency === c ? 'var(--text-1)' : 'var(--text-2)',
                      boxShadow: form.currency === c ? 'var(--shadow-card)' : 'none',
                      transition: 'all 120ms',
                    }}
                  >{c}</button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!isValid}
              className="tt-btn tt-btn-primary"
              style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 600, justifyContent: 'center', gap: 8 }}
            >
              Începe <IcArrow />
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: 'var(--text-3)' }}>
          Datele rămân pe dispozitivul tău. Niciodată nu părăsesc browser-ul.
        </p>
      </div>
    </div>
  )
}
