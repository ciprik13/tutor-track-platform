import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getInitials } from "@/lib/dateUtils";
import type { RootState } from "@/store";
import { useStudents } from "@/queries/useStudents";
import { useLessons } from "@/queries/useLessons";
import { useState, useEffect } from "react";
import LessonModal from "@/components/lessons/LessonModal";

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
const IcPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

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
        padding: 18, cursor: onClick ? 'pointer' : 'default',
        background: isAmber ? 'var(--warning-soft)' : 'var(--bg-card)',
        border: isAmber ? '0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)' : '0.5px solid var(--border)',
        transition: 'all 120ms ease',
        position: 'relative', overflow: 'hidden',
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-pop)' }}
      onMouseLeave={e => { if (onClick) (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{
          fontSize: 11.5, fontWeight: 500, letterSpacing: '-0.005em',
          color: isAmber ? 'var(--warning-strong)' : 'var(--text-2)',
        }}>{label}</span>
        <span style={{ color: isAmber ? 'var(--warning)' : 'var(--text-3)', opacity: 0.8 }}>{icon}</span>
      </div>
      <div className="tt-metric" style={{
        fontSize: 28,
        color: isAmber ? 'var(--warning-strong)' : isTeal ? 'var(--accent)' : 'var(--text-1)',
      }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 11.5, color: isAmber ? 'var(--warning-strong)' : 'var(--text-3)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
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

export default function DashboardPage() {
  const navigate = useNavigate()
  const profile  = useSelector((s: RootState) => s.profile)
  const [lessonModal, setLessonModal] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentWeekStart = (() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1)
    return d.toISOString().slice(0, 10)
  })()

  const { data: students = [] }   = useStudents()
  const { data: allLessons = [] } = useLessons()

  const activeStudents   = students.filter(s => s.status === 'active')
  const lessonsThisMonth = allLessons.filter((l: any) => l.date.startsWith(currentMonth))
  const lessonsThisWeek  = allLessons.filter((l: any) => l.date.slice(0, 10) >= currentWeekStart)
  const unpaidTotal      = allLessons.filter((l: any) => !l.isPaid).reduce((s: number, l: any) => s + Number(l.price), 0)
  const recentActivity   = [...allLessons].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)

  const getStudent = (id: string) => students.find((s: any) => s.id === id)

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
    <div style={{ padding: isMobile ? '20px 16px 60px' : '32px 36px 60px', maxWidth: 1280 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 20 : 32, gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: isMobile ? 24 : 30, fontWeight: 600,
            letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1, margin: 0,
          }}>
            {greeting()},{' '}
            <span style={{ color: 'var(--accent)' }}>{profile.name.split(' ')[0] || 'Tutor'}</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 5, letterSpacing: '-0.01em' }}>
            {new Date().toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button onClick={() => setLessonModal(true)} className="tt-btn tt-btn-primary" style={{ height: 38 }}>
          <IcPlus /> Lecție nouă
        </button>
      </div>

      {/* Stat cards — 2x2 on mobile, 4x1 on desktop */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? 10 : 14,
        marginBottom: 20,
      }}>
        <StatCard
          label="Studenți activi" value={activeStudents.length}
          sub={`din ${students.length} total`}
          icon={<IcUsers />} onClick={() => navigate('/students')}
        />
        <StatCard
          label={`Lecții în ${new Date().toLocaleDateString('ro-RO', { month: 'long' })}`}
          value={lessonsThisMonth.length}
          sub={`${lessonsThisMonth.reduce((s: number, l: any) => s + Number(l.price), 0).toLocaleString()} ${profile.currency} total`}
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

      {/* Two-column body — stacked on mobile */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr',
        gap: 16,
      }}>

        {/* Recent activity */}
        <div className="tt-card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
                Activitate recentă
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Ultimele lecții logate</div>
            </div>
            <button
              onClick={() => navigate('/lessons')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--accent)', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Toate lecțiile <IcChevRight />
            </button>
          </div>
          <div className="tt-rule" />

          {recentActivity.length === 0 ? (
            <div style={{ padding: '40px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>Nicio activitate încă</p>
              <button onClick={() => setLessonModal(true)} style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Adaugă prima lecție →
              </button>
            </div>
          ) : (
            recentActivity.map((lesson: any, idx: number) => {
              const student = getStudent(lesson.studentId)
              const { day, mon } = fmtShort(lesson.date)
              return (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/students/${lesson.studentId}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 10 : 14,
                    padding: isMobile ? '12px 14px' : '13px 18px',
                    borderBottom: idx < recentActivity.length - 1 ? '0.5px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  {/* Date */}
                  <div style={{ textAlign: 'center', minWidth: 38, flexShrink: 0 }}>
                    <div className="tt-metric" style={{ fontSize: 18, color: 'var(--text-1)' }}>{day}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>{mon}</div>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {student?.name ?? lesson.studentNameSnapshot ?? '—'}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                      {lesson.subjectSnapshot} · {lesson.durationMinutes} min · {fmtTime(lesson.date)}
                    </div>
                  </div>
                  {/* Price + status — stacked on mobile */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-end' : 'center', gap: isMobile ? 4 : 10, flexShrink: 0 }}>
                    <div className="tabular" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
                      {Number(lesson.price).toLocaleString()} {profile.currency}
                    </div>
                    <span className={`tt-pill ${lesson.isPaid ? 'tt-pill-paid' : 'tt-pill-unpaid'}`}>
                      <span className={`tt-dot ${lesson.isPaid ? 'tt-dot-paid' : 'tt-dot-unpaid'}`} />
                      {lesson.isPaid ? 'Achitat' : 'Neachitat'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Active students */}
        <div className="tt-card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
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
            <div style={{ padding: '40px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 13.5, color: 'var(--text-3)' }}>Niciun student activ</p>
              <button onClick={() => navigate('/students')} style={{ marginTop: 10, fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                Adaugă primul student →
              </button>
            </div>
          ) : (
            activeStudents.slice(0, 6).map((student: any, idx: number) => {
              const studentLessons = allLessons.filter((l: any) => l.studentId === student.id && l.date.startsWith(currentMonth))
              const unpaid = studentLessons.filter((l: any) => !l.isPaid).reduce((s: number, l: any) => s + Number(l.price), 0)
              return (
                <div
                  key={student.id}
                  onClick={() => navigate(`/students/${student.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: isMobile ? '12px 14px' : '12px 18px',
                    borderBottom: idx < activeStudents.slice(0, 6).length - 1 ? '0.5px solid var(--border)' : 'none',
                    cursor: 'pointer', transition: 'background 120ms',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div className="tt-avatar" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
                    {getInitials(student.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                      {student.subject} · {studentLessons.length} lecții luna aceasta
                    </div>
                  </div>
                  {unpaid > 0 && (
                    <span className="tt-pill tt-pill-unpaid tabular" style={{ flexShrink: 0 }}>{unpaid.toLocaleString()} {profile.currency}</span>
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
