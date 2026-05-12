import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { login, register } from '@/lib/authApi'
import { setAuth } from '@/store/slices/authSlice'
import { updateProfile } from '@/store/slices/profileSlice'
import type { AppDispatch } from '@/store'

export default function LoginPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate  = useNavigate()

  const [mode, setMode]       = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const [form, setForm] = useState({
    name:     '',
    email:    '',
    password: '',
    phone:    '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = mode === 'login'
        ? await login({ email: form.email, password: form.password })
        : await register({ name: form.name, email: form.email, password: form.password, phone: form.phone })

      dispatch(setAuth({ user: response.user, token: response.access_token }))
      dispatch(updateProfile({
        name:  response.user.name,
        email: response.user.email,
        phone: response.user.phone ?? '',
      }))
      navigate('/dashboard')
    } catch (err: any) {
      const msg = err.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background image */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'url(/tutor-track/tutor-image.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: 'brightness(0.35)',
        zIndex: 0,
      }} />

      {/* Card */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: 'var(--r-xl)',
        border: '0.5px solid rgba(255,255,255,0.15)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        padding: '40px 36px',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/tutor-track/logo.png"
            alt="TutorTrack"
            style={{
              height: 48,
              width: 'auto',
              margin: '0 auto',
              filter: 'brightness(0) invert(1)',
              opacity: 0.95,
            }}
            onError={e => {
              const img = e.currentTarget as HTMLImageElement
              img.style.display = 'none'
              const span = document.createElement('span')
              span.style.cssText = 'font-family:var(--font-display);font-weight:700;font-size:22px;letter-spacing:-0.03em;color:white'
              span.textContent = 'TutorTrack'
              img.parentElement?.appendChild(span)
            }}
          />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: 'white',
            margin: '0 0 6px',
          }}>
            {mode === 'login' ? 'Bun venit înapoi' : 'Creează cont'}
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {mode === 'login'
              ? 'Intră în contul tău TutorTrack'
              : 'Începe să îți gestionezi meditațiile'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                Nume complet
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ion Popescu"
                required
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '0.5px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-text)',
                  transition: 'border-color 150ms',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="ion@email.com"
              required
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px',
                borderRadius: 'var(--r-md)',
                background: 'rgba(255,255,255,0.1)',
                border: '0.5px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-text)',
                transition: 'border-color 150ms',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
              Parolă
            </label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minim 6 caractere"
              required
              minLength={6}
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px',
                borderRadius: 'var(--r-md)',
                background: 'rgba(255,255,255,0.1)',
                border: '0.5px solid rgba(255,255,255,0.2)',
                color: 'white',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'var(--font-text)',
                transition: 'border-color 150ms',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: 6 }}>
                Telefon (opțional)
              </label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+373 69 000 000"
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 14px',
                  borderRadius: 'var(--r-md)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '0.5px solid rgba(255,255,255,0.2)',
                  color: 'white',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'var(--font-text)',
                  transition: 'border-color 150ms',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              />
            </div>
          )}

          {error && (
            <div style={{
              fontSize: 12.5,
              color: '#ffb3b3',
              background: 'rgba(255,80,80,0.15)',
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              border: '0.5px solid rgba(255,80,80,0.3)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 44,
              borderRadius: 'var(--r-md)',
              background: loading ? 'rgba(82,171,152,0.6)' : 'var(--accent)',
              color: 'white',
              fontSize: 14,
              fontWeight: 600,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 6,
              fontFamily: 'var(--font-text)',
              letterSpacing: '-0.01em',
              transition: 'opacity 150ms',
            }}
          >
            {loading
              ? (mode === 'login' ? 'Se autentifică...' : 'Se creează contul...')
              : (mode === 'login' ? 'Intră în cont' : 'Creează cont')
            }
          </button>
        </form>

        {/* Toggle mode */}
        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>
          {mode === 'login' ? (
            <>
              Nu ai cont?{' '}
              <button
                onClick={() => { setMode('register'); setError('') }}
                style={{ color: 'rgba(255,255,255,0.9)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}
              >
                Înregistrează-te
              </button>
            </>
          ) : (
            <>
              Ai deja cont?{' '}
              <button
                onClick={() => { setMode('login'); setError('') }}
                style={{ color: 'rgba(255,255,255,0.9)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}
              >
                Intră în cont
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
