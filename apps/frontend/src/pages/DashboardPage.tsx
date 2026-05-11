import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getInitials } from "@/lib/dateUtils";
import type { RootState } from "@/store";
import { useStudents } from "@/queries/useStudents";
import { useLessons } from "@/queries/useLessons";
import { useState } from "react";
import LessonModal from "@/components/lessons/LessonModal";

// ── Shared micro-icons ────────────────────────────────────────
const IcUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IcBook = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
)
const IcWallet = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)
const IcCal = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcChevRight = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const IcArrowUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
  </svg>
)
const IcStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IcPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

// ── Stat card ─────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  tone?: 'default' | 'amber' | 'teal'
  onClick?: () => void
  delta?: number
}

function StatCard({ label, value, sub, icon, tone = 'default', onClick, delta }: StatCardProps) {
  const isAmber = tone === 'amber'
  const isTeal  = tone === 'teal'
  return (
    <div
      onClick={onClick}
      className="tt-card"
      style={{
        padding: 22, cursor: onClick ? 'pointer' : 'default',
        background: isAmber ? 'var(--warning-soft)' : 'var(--bg-card)',
        border: isAmber ? '0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)' : '0.5px solid var(--border)',
        transition: 'all 120ms ease',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-pop)' }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontSize: 12, fontWeight: 500, letterSpacing: '-0.005em',
          color: isAmber ? 'var(--warning-strong)' : 'var(--text-2)',
        }}>{label}</span>
        <span style={{ color: isAmber ? 'var(--warning)' : 'var(--text-3)', opacity: 0.8 }}>{icon}</span>
      </div>

      <div className="tt-metric" style={{
        fontSize: 34,
        color: isAmber ? 'var(--warning-strong)' : isTeal ? 'var(--accent)' : 'var(--text-1)',
      }}>{value}</div>

      {sub && (
        <div style={{ fontSize: 12, color: isAmber ? 'var(--warning-strong)' : 'var(--text-3)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
          {delta != null && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, color: delta >= 0 ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
              <IcArrowUp /> {Math.abs(delta)}%
            </span>
          )}
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const profile  = useSelector((s: RootState) => s.profile)
  const [lessonModal, setLessonModal] = useState(false)

  const currentMonth    = new Date().toISOString().slice(0, 7)
  const currentWeekStart = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().slice(0, 10)
  })()

  const { data: students = [] }   = useStudents()
  const { data: allLessons = [] } = useLessons()

  const activeStudents    = students.filter(s => s.status === 'active')
  const lessonsThisMonth  = allLessons.filter(l => l.date.startsWith(currentMonth) && l.status === 'done')
  const lessonsThisWeek   = allLessons.filter(l => l.date.slice(0, 10) >= currentWeekStart && l.status === 'done')
  const unpaidTotal       = allLessons.filter(l => l.paymentStatus === 'unpaid' && l.status === 'done').reduce((s, l) => s + l.pricePerSession, 0)
  const recentActivity    = [...allLessons].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)

  const getStudent = (id: number) => students.find(s => s.id === id)

  const fmtShort = (iso: string) => {
    const d = new Date(iso)
    return { day: d.getDate(), mon: d.toLocaleDateString('ro-RO', { month: 'short' }).replace('.', '') }
  }
  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Bună dimineața'
    if (h < 18) return 'Bună ziua'
    return 'Bună seara'
  }

  return (
    <div style={{ padding: '32px 36px 60px', maxWidth: 1280 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600,
            letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1, margin: 0,
          }}>
            {greeting()},{' '}
            <span style={{ color: 'var(--accent)' }}>{profile.name.split(' ')[0] || 'Tutor'}</span>
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6, letterSpacing: '-0.01em' }}>
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setLessonModal(true)} className="tt-btn tt-btn-primary" style={{ height: 38 }}>
          <IcPlus /> Lecție nouă
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard
          label="Studenți activi" value={activeStudents.length}
          sub={`din ${students.length} total`}
          icon={<IcUsers />} onClick={() => navigate('/students')}
        />
        <StatCard
          label={`Lecții în ${new Date().toLocaleDateString('ro-RO', { month: 'long' })}`}
          value={lessonsThisMonth.length}
          sub={`${lessonsThisMonth.reduce((s, l) => s + l.pricePerSession, 0).toLocaleString()} ${profile.currency} total`}
          icon={<IcBook />} onClick={() => navigate('/lessons')}
        />
        <StatCard
          label="Total neachitat"
          value={unpaidTotal > 0 ? unpaidTotal.toLocaleString() : '0'}
          sub={profile.currency}
          icon={<IcWallet />}
          tone={unpaidTotal > 0 ? 'amber' : 'teal'}
          onClick={() => navigate('/payments')}
        />
        <StatCard
          label="Săptămâna aceasta" value={lessonsThisWeek.length}
          sub="lecții efectuate"
          icon={<IcCal />} onClick={() => navigate('/lessons')}
        />
      </div>

      {/* ── Two-column body ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>

        {/* Recent activity */}
        <div className="tt-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                Activitate recentă
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Ultimele lecții logate</div>
            </div>
            <button
              onClick={() => navigate('/lessons')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Toate lecțiile <IcChevRight />
            </button>
          </div>
          <div className="tt-rule" />

          {recentActivity.length === 0 ? (
            <div style={{ padding: '40px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>Nicio activitate încă</p>
              <button onClick={() => setLessonModal(true)} style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Adaugă prima lecție →
              </button>
            </div>
          ) : (
            recentActivity.map((lesson, idx) => {
              const student = getStudent(lesson.studentId)
              const { day, mon } = fmtShort(lesson.date)
              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/students/${lesson.studentId}`)}
                  style={{
                    display: 'grid', gridTemplateColumns: '52px 1fr auto auto',
                    alignItems: 'center', gap: 14, padding: '13px 22px',
                    borderBottom: idx < recentActivity.length - 1 ? '0.5px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div style={{ textAlign: 'center' }}>
                    <div className="tt-metric" style={{ fontSize: 20, color: 'var(--text-1)' }}>{day}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{mon}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                      {student?.name ?? '—'}
                      {student?.priority && <span style={{ color: 'var(--warning)', marginLeft: 6 }}><IcStar /></span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {student?.subject} · {lesson.durationMinutes} min · {fmtTime(lesson.date)}
                    </div>
                  </div>
                  <div className="tabular" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)' }}>
                    {lesson.pricePerSession.toLocaleString()} {profile.currency}
                  </div>
                  <span className={`tt-pill ${lesson.paymentStatus === 'paid' ? 'tt-pill-paid' : 'tt-pill-unpaid'}`}>
                    <span className={`tt-dot ${lesson.paymentStatus === 'paid' ? 'tt-dot-paid' : 'tt-dot-unpaid'}`} />
                    {lesson.paymentStatus === 'paid' ? 'Achitat' : 'Neachitat'}
                  </span>
                </div>
              )
            })
          )}
        </div>

        {/* Active students */}
        <div className="tt-card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                Studenți activi
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Ordonați după activitate</div>
            </div>
            <button
              onClick={() => navigate('/students')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Toți <IcChevRight />
            </button>
          </div>
          <div className="tt-rule" />

          {activeStudents.length === 0 ? (
            <div style={{ padding: '40px 22px', textAlign: 'center' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>Niciun student activ</p>
              <button onClick={() => navigate('/students')} style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Adaugă primul student →
              </button>
            </div>
          ) : (
            activeStudents.slice(0, 6).map((student, idx) => {
              const studentLessons = allLessons.filter(l => l.studentId === student.id && l.date.startsWith(currentMonth) && l.status === 'done')
              const unpaid = studentLessons.filter(l => l.paymentStatus === 'unpaid').reduce((s, l) => s + l.pricePerSession, 0)
              return (
                <div
                  key={student.id}
                  onClick={() => navigate(`/students/${student.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 22px',
                    borderBottom: idx < activeStudents.slice(0, 6).length - 1 ? '0.5px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div className="tt-avatar" style={{ width: 36, height: 36, fontSize: 13 }}>
                    {getInitials(student.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>{student.name}</span>
                      {student.priority && <span style={{ color: 'var(--warning)' }}><IcStar /></span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
                      {student.subject} · {studentLessons.length} lecții luna aceasta
                    </div>
                  </div>
                  {unpaid > 0 && (
                    <span className="tt-pill tt-pill-unpaid tabular">{unpaid.toLocaleString()} {profile.currency}</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {lessonModal && <LessonModal lesson={null} onClose={() => setLessonModal(false)} />}
    </div>
  )
}
