import { useState } from "react";
import { useLessons, useDeleteLesson, useTogglePayment } from "@/queries/useLessons";
import { useStudents } from "@/queries/useStudents";
import LessonModal from "@/components/lessons/LessonModal";
import type { Lesson } from "@/types";
import MonthPicker from "@/components/ui/MonthPicker";
import CalendarImport from "@/components/calendar/CalendarImport";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { getInitials } from "@/lib/dateUtils";

const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const IcCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IcTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

export default function LessonsPage() {
  const [studentFilter, setStudentFilter] = useState<number | undefined>();
  const [monthFilter, setMonthFilter]     = useState(new Date().toISOString().slice(0, 7));
  const [paymentFilter, setPaymentFilter] = useState<'paid' | 'unpaid' | undefined>();
  const [modalOpen, setModalOpen]         = useState(false);
  const [editLesson, setEditLesson]       = useState<Lesson | null>(null);
  const [calendarImport, setCalendarImport] = useState(false);

  const googleConnected = useSelector((s: RootState) => s.profile.googleCalendarConnected);

  const { data: lessons  = [], isLoading } = useLessons({ studentId: studentFilter, month: monthFilter || undefined, paymentStatus: paymentFilter });
  const { data: students = [] }            = useStudents();
  const deleteLesson  = useDeleteLesson();
  const togglePayment = useTogglePayment();

  const handleEdit   = (l: Lesson) => { setEditLesson(l); setModalOpen(true) }
  const handleAdd    = () => { setEditLesson(null); setModalOpen(true) }
  const handleDelete = (id: number) => { if (confirm('Sigur vrei să ștergi această lecție?')) deleteLesson.mutate(id) }
  const handleToggle = (l: Lesson) => togglePayment.mutate({ id: l.id!, paymentStatus: l.paymentStatus === 'paid' ? 'unpaid' : 'paid' })

  const getStudent = (id: number) => students.find(s => s.id === id)
  const fmtShort = (iso: string) => {
    const d = new Date(iso)
    return { day: d.getDate(), mon: d.toLocaleDateString('ro-RO', { month: 'short' }).replace('.', '') }
  }
  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const fmtDow = (iso: string) => new Date(iso).toLocaleDateString('ro-RO', { weekday: 'long' })

  // Group by day
  const grouped = lessons.reduce((acc, l) => {
    const day = l.date.slice(0, 10)
    if (!acc[day]) acc[day] = []
    acc[day].push(l)
    return acc
  }, {} as Record<string, typeof lessons>)
  const sortedDays = Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))

  const totalRevenue = lessons.reduce((s, l) => s + l.pricePerSession, 0)
  const unpaidCount  = lessons.filter(l => l.paymentStatus === 'unpaid').length

  return (
    <div style={{ padding: '28px 36px 60px', maxWidth: 1280 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="tt-page-title">Lecții</h1>
          <p className="tt-page-sub">
            {lessons.length} lecții
            {totalRevenue > 0 && ` · ${totalRevenue.toLocaleString()} MDL`}
            {unpaidCount > 0 && ` · ${unpaidCount} neachitate`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {googleConnected && (
            <button
              onClick={() => setCalendarImport(true)}
              className="tt-btn tt-btn-secondary"
              style={{ height: 38, gap: 7 }}
            >
              <IcCalendar /> Import Calendar
            </button>
          )}
          <button onClick={handleAdd} className="tt-btn tt-btn-primary" style={{ height: 38 }}>
            <IcPlus /> Adaugă
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={studentFilter ?? ''}
          onChange={e => setStudentFilter(e.target.value ? Number(e.target.value) : undefined)}
          className="tt-input"
          style={{ width: 'auto', minWidth: 200 }}
        >
          <option value="">Toți studenții</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <MonthPicker value={monthFilter} onChange={setMonthFilter} />

        <div className="tt-filter-row">
          {([
            [undefined, 'Toate'],
            ['paid',    'Achitate'],
            ['unpaid',  'Neachitate'],
          ] as const).map(([k, lbl]) => (
            <button
              key={k ?? 'all'}
              onClick={() => setPaymentFilter(k)}
              className={`tt-filter-btn ${paymentFilter === k ? 'active' : ''}`}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Se încarcă...</p>
      ) : lessons.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 64 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Nicio lecție găsită</p>
          <button onClick={handleAdd} style={{ marginTop: 12, color: 'var(--accent)', fontSize: 13.5, background: 'none', border: 'none', cursor: 'pointer' }}>
            Adaugă prima lecție →
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {sortedDays.map(([day, dayLessons], gIdx) => {
            const { day: d, mon } = fmtShort(day + 'T00:00')
            const dow = fmtDow(day + 'T00:00')
            return (
              <div key={day} className="tt-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 10 }}>
                {/* Day header */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', padding: '9px 20px',
                  background: 'var(--bg-page)',
                  borderBottom: '0.5px solid var(--border)',
                  fontSize: 11.5, fontWeight: 600, letterSpacing: '0.04em',
                  color: 'var(--text-3)', textTransform: 'uppercase',
                }}>
                  <span style={{ textTransform: 'capitalize' }}>{dow}, {d} {mon}</span>
                  <span className="tabular">
                    {dayLessons.length} {dayLessons.length === 1 ? 'lecție' : 'lecții'} · {dayLessons.reduce((s, l) => s + l.pricePerSession, 0).toLocaleString()} MDL
                  </span>
                </div>

                {/* Lesson rows */}
                {dayLessons.map((lesson, i) => {
                  const student = getStudent(lesson.studentId)
                  return (
                    <div
                      key={lesson.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '56px 1fr auto auto auto auto',
                        alignItems: 'center', gap: 14, padding: '13px 20px',
                        borderBottom: i < dayLessons.length - 1 ? '0.5px solid var(--border)' : 'none',
                        transition: 'background 120ms',
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div className="tabular" style={{ fontSize: 12.5, color: 'var(--text-3)', fontWeight: 500, textAlign: 'center' }}>
                        {fmtTime(lesson.date)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        {student && (
                          <div className="tt-avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}>
                            {getInitials(student.name)}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {student?.name ?? '—'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                            {student?.subject} · {lesson.durationMinutes} min
                          </div>
                        </div>
                      </div>
                      <div className="tabular" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                        {lesson.pricePerSession.toLocaleString()} MDL
                      </div>
                      <button
                        onClick={() => handleToggle(lesson)}
                        className={`tt-pill ${lesson.paymentStatus === 'paid' ? 'tt-pill-paid' : 'tt-pill-unpaid'}`}
                        style={{ cursor: 'pointer', border: 'none', height: 24, transition: 'opacity 120ms' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                      >
                        <span className={`tt-dot ${lesson.paymentStatus === 'paid' ? 'tt-dot-paid' : 'tt-dot-unpaid'}`} />
                        {lesson.paymentStatus === 'paid' ? 'Achitat' : 'Neachitat'}
                      </button>
                      <button
                        onClick={() => handleEdit(lesson)}
                        style={{ width: 28, height: 28, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                      ><IcEdit /></button>
                      <button
                        onClick={() => handleDelete(lesson.id!)}
                        style={{ width: 28, height: 28, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                      ><IcTrash /></button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen     && <LessonModal lesson={editLesson} onClose={() => setModalOpen(false)} />}
      {calendarImport && <CalendarImport onClose={() => setCalendarImport(false)} />}
    </div>
  );
}
