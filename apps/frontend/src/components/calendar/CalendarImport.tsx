import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useStudents } from '@/queries/useStudents'
import { useCreateLesson, useLessons } from '@/queries/useLessons'
import { googleApi } from '@/lib/googleApi'
import { useQueryClient } from '@tanstack/react-query'
import MonthPicker from '@/components/ui/MonthPicker'

interface Props {
  onClose: () => void
}

export interface CalendarEvent {
  id: string
  summary: string
  start: { dateTime?: string; date?: string }
  end: { dateTime?: string; date?: string }
  description?: string
  calendarName?: string
  mergedIds?: string[]
}

type DuplicateKind = 'exact' | 'probable' | null

function extractNameTokens(eventTitle: string): string[] {
  const namePart = eventTitle.split('|')[0].trim().toLowerCase()
  return namePart.split(/\s+/).filter(t => t.length > 1)
}

function guessStudentId(eventTitle: string, students: { id?: any; name: string }[]): string | null {
  const title = eventTitle.toLowerCase()

  // ── Step 1: Extract name part ────────────────────────────────
  let namePart = title
  if (title.includes('|')) {
    const parts = title.split('|').map(p => p.trim())
    const subjectWords = ['clasa', 'mate', 'math', 'english', 'individual', 'grup',
      'online', 'fizica', 'chimie', 'biologie', 'istorie', 'romana', 'geografie', 'informatica']
    namePart = parts.find(p =>
      !subjectWords.some(sw => p.startsWith(sw)) && !/^\d/.test(p)
    ) ?? parts[parts.length - 1]
  }
  namePart = namePart.trim()

  // ── Step 2: Initials pattern e.g. "M&D", "A/B" ──────────────
  const initialsMatch = namePart.match(/^([a-z])[\s&\/\+\-]([a-z])$/i)
  if (initialsMatch) {
    const init1 = initialsMatch[1].toLowerCase()
    const init2 = initialsMatch[2].toLowerCase()
    for (const student of students) {
      const words = student.name.toLowerCase().split(/[\s\-]+/).filter(w => w.length > 1)
      const initials = words.map(w => w[0])
      if (initials.includes(init1) && initials.includes(init2)) {
        return student.id ? String(student.id) : null
      }
    }
  }

  // ── Step 3: Multiple initials e.g. "M&D&A" ──────────────────
  if (/^[a-z]([\s&\/\+\-][a-z])+$/i.test(namePart)) {
    const initials = namePart.match(/[a-z]/gi)?.map(c => c.toLowerCase()) ?? []
    for (const student of students) {
      const words = student.name.toLowerCase().split(/[\s\-]+/).filter(w => w.length > 1)
      const studentInitials = words.map(w => w[0])
      if (initials.every(i => studentInitials.includes(i))) {
        return student.id ? String(student.id) : null
      }
    }
  }

  // ── Step 4: Direct token match ───────────────────────────────
  const tokens = namePart.split(/[\s\-&\/\+]+/).filter(t => t.length > 1)
  for (const student of students) {
    const studentWords = student.name.toLowerCase().split(/[\s\-]+/)
    if (tokens.some(token => studentWords.some(word => word.length > 1 && word === token))) {
      return student.id ? String(student.id) : null
    }
  }

  // ── Step 5: Substring match ──────────────────────────────────
  for (const student of students) {
    const studentWords = student.name.toLowerCase().split(/[\s\-]+/)
    if (studentWords.some(word => word.length > 2 && namePart.includes(word))) {
      return student.id ? String(student.id) : null
    }
  }

  // ── Step 6: Event token in student name ─────────────────────
  for (const token of tokens) {
    if (token.length < 3) continue
    for (const student of students) {
      if (student.name.toLowerCase().includes(token)) {
        return student.id ? String(student.id) : null
      }
    }
  }

  return null
}

function guessDuration(event: CalendarEvent): 60 | 90 | 120 {
  if (!event.start.dateTime || !event.end.dateTime) return 60
  const diff = (new Date(event.end.dateTime).getTime() - new Date(event.start.dateTime).getTime()) / 60000
  if (diff <= 75) return 60
  if (diff <= 105) return 90
  return 120
}

function mergeConsecutiveEvents(events: CalendarEvent[], students: { id?: any; name: string }[]): CalendarEvent[] {
  const sorted = [...events].sort((a, b) => (a.start.dateTime ?? '').localeCompare(b.start.dateTime ?? ''))
  const consumed = new Set<string>()
  const result: CalendarEvent[] = []

  for (let i = 0; i < sorted.length; i++) {
    if (consumed.has(sorted[i].id)) continue
    const cur = sorted[i]
    if (!cur.start.dateTime || !cur.end.dateTime) { result.push(cur); continue }

    const curStudentId = guessStudentId(cur.summary, students)
    if (!curStudentId) { result.push(cur); continue }

    let merged: CalendarEvent = { ...cur, mergedIds: [cur.id] }
    let runEnd = cur.end.dateTime

    for (let j = i + 1; j < sorted.length; j++) {
      const nxt = sorted[j]
      if (consumed.has(nxt.id) || !nxt.start.dateTime || !nxt.end.dateTime) continue
      if (guessStudentId(nxt.summary, students) !== curStudentId) continue
      if (nxt.start.dateTime !== runEnd) continue
      const totalMin = (new Date(nxt.end.dateTime).getTime() - new Date(merged.start.dateTime!).getTime()) / 60000
      if (totalMin > 120) break
      merged = { ...merged, end: nxt.end, mergedIds: [...merged.mergedIds!, nxt.id] }
      runEnd = nxt.end.dateTime
      consumed.add(nxt.id)
    }
    result.push(merged)
  }
  return result
}

function detectDuplicate(event: CalendarEvent, studentId: string | null, existingLessons: any[]): DuplicateKind {
  const allIds = [event.id, ...(event.mergedIds ?? [])]
  if (allIds.some(id => existingLessons.some((l: any) => l.googleCalendarEventId === id))) return 'exact'
  if (studentId && event.start.dateTime) {
    const eventHour = event.start.dateTime.slice(0, 13)
    if (existingLessons.some((l: any) => l.studentId === studentId && l.date.slice(0, 13) === eventHour)) return 'probable'
  }
  return null
}

export default function CalendarImport({ onClose }: Props) {
  const profile = useSelector((s: RootState) => s.profile)
  const { data: students = [] } = useStudents()
  const createLesson = useCreateLesson()
  const queryClient = useQueryClient()

  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'select' | 'preview' | 'done'>('select')
  const [importedCount, setImportedCount] = useState(0)

  const { data: existingLessons = [] } = useLessons({ month })

  const handleFetch = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await googleApi.getEvents(month)
      if (!response.connected) {
        setError('Google Calendar nu e conectat. Mergi la Setări → Integrări.')
        return
      }
      const filtered = response.events.filter((e: any) => e.summary && e.start?.dateTime)
      const merged = mergeConsecutiveEvents(filtered, students)
      setEvents(merged)
      setSelected(new Set(
        merged
          .filter((e: any) => {
            const sid = guessStudentId(e.summary, students)
            return sid !== null && detectDuplicate(e, sid, existingLessons) === null
          })
          .map((e: any) => e.id),
      ))
      setStep('preview')
    } catch (err: any) {
      setError(err.response?.data?.message ?? err.message ?? 'Eroare la încărcarea evenimentelor.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    const toImport = events.filter(e => selected.has(e.id))
    let count = 0
    for (const event of toImport) {
      const studentId = guessStudentId(event.summary, students)
      if (!studentId) continue
      const duration = guessDuration(event)
      const price = duration === 60 ? profile.defaultPrice60 : duration === 90 ? profile.defaultPrice90 : profile.defaultPrice120
      await createLesson.mutateAsync({
        studentId: String(studentId),
        date: event.start.dateTime!.slice(0, 16),
        durationMinutes: duration,
        price,
        isPaid: false,
        googleCalendarEventId: event.mergedIds?.[0] ?? event.id,
        notes: '',
      })
      count++
    }
    queryClient.invalidateQueries({ queryKey: ['lessons'] })
    setImportedCount(count)
    setStep('done')
    setImporting(false)
  }

  const duplicateCount = events.filter(e => {
    const sid = guessStudentId(e.summary, students)
    return detectDuplicate(e, sid, existingLessons) !== null
  }).length

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
      <div className="tt-card" style={{ width: '100%', maxWidth: 520, maxHeight: '82vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Import din Google Calendar
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {step === 'select' && 'Selectează luna'}
              {step === 'preview' && (duplicateCount > 0 ? `${events.length} evenimente · ${duplicateCount} deja existente (neselectate)` : `${events.length} evenimente găsite`)}
              {step === 'done' && 'Import finalizat'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 22, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Step: select */}
          {step === 'select' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <MonthPicker value={month} onChange={setMonth} label="Luna de importat" />
              {error && (
                <div style={{ fontSize: 12.5, color: 'var(--danger-strong)', background: 'var(--danger-soft)', padding: '10px 14px', borderRadius: 8, border: '0.5px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}>
                  {error}
                </div>
              )}
              <button onClick={handleFetch} disabled={loading} className="tt-btn tt-btn-primary" style={{ height: 38 }}>
                {loading ? 'Se încarcă...' : 'Încarcă evenimente'}
              </button>
            </div>
          )}

          {/* Step: preview */}
          {step === 'preview' && (
            <div>
              {events.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', padding: '20px 0' }}>
                  Niciun eveniment găsit în această lună
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {duplicateCount > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--warning-strong)', background: 'var(--warning-soft)', border: '0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)', borderRadius: 8, padding: '8px 12px', marginBottom: 6 }}>
                      {duplicateCount} {duplicateCount === 1 ? 'eveniment există deja' : 'evenimente există deja'} în platformă — neselectate automat.
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{selected.size} din {events.length} selectate</span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button onClick={() => setSelected(new Set(events.map(e => e.id)))} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Toate</button>
                      <button onClick={() => setSelected(new Set())} style={{ fontSize: 11.5, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}>Niciuna</button>
                    </div>
                  </div>

                  {events.map(event => {
                    const studentId = guessStudentId(event.summary, students)
                    const student = (students as any[]).find((s: any) => s.id === studentId)
                    const dupKind = detectDuplicate(event, studentId, existingLessons)
                    const isSelected = selected.has(event.id)
                    const isDup = dupKind !== null
                    const duration = guessDuration(event)
                    const dt = event.start.dateTime ? new Date(event.start.dateTime) : null
                    const dateStr = dt ? dt.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }) : '—'
                    const timeStr = dt ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : '—'

                    return (
                      <div
                        key={event.id}
                        onClick={() => {
                          const next = new Set(selected)
                          if (next.has(event.id)) next.delete(event.id)
                          else next.add(event.id)
                          setSelected(next)
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                          opacity: isDup && !isSelected ? 0.55 : 1,
                          background: isSelected ? 'var(--accent-soft)' : isDup ? 'var(--warning-soft)' : 'var(--bg-input)',
                          border: `0.5px solid ${isSelected ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : isDup ? 'color-mix(in srgb, var(--warning) 25%, transparent)' : 'var(--border)'}`,
                          transition: 'all 120ms',
                        }}
                      >
                        <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, background: isSelected ? 'var(--accent)' : 'transparent', border: `2px solid ${isSelected ? 'var(--accent)' : isDup ? 'color-mix(in srgb, var(--warning) 50%, transparent)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}>
                          {isSelected && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.summary}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <span>{dateStr} · {timeStr} · {duration} min</span>
                            {event.mergedIds && event.mergedIds.length > 1 && (
                              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', background: 'var(--accent-soft)', padding: '1px 6px', borderRadius: 10 }}>
                                {event.mergedIds.length}×{Math.round(duration / event.mergedIds.length)} min combinat
                              </span>
                            )}
                            {event.calendarName && <span style={{ opacity: 0.7 }}>· {event.calendarName}</span>}
                          </div>
                        </div>

                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          {isDup ? (
                            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--warning-strong)', background: 'var(--warning-soft)', padding: '2px 8px', borderRadius: 20, border: '0.5px solid color-mix(in srgb, var(--warning) 30%, transparent)' }}>
                              {dupKind === 'exact' ? 'Deja importat' : 'Probabil duplicat'}
                            </span>
                          ) : student ? (
                            <span className="tt-pill tt-pill-active" style={{ fontSize: 10.5 }}>{student.name.split(' ')[0]}</span>
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Necunoscut</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step: done */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-display)' }}>Import finalizat!</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 6 }}>
                {importedCount} {importedCount === 1 ? 'lecție adăugată' : 'lecții adăugate'}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 10 }}>
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('select')} className="tt-btn tt-btn-secondary" style={{ height: 36, flex: 1 }}>Înapoi</button>
              <button onClick={handleImport} disabled={importing || selected.size === 0} className="tt-btn tt-btn-primary" style={{ height: 36, flex: 2, opacity: importing || selected.size === 0 ? 0.5 : 1 }}>
                {importing ? 'Se importă...' : `Importă ${selected.size} lecții`}
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="tt-btn tt-btn-primary" style={{ height: 36, flex: 1 }}>Gata</button>
          )}
          {step === 'select' && (
            <button onClick={onClose} className="tt-btn tt-btn-secondary" style={{ height: 36, flex: 1 }}>Anulează</button>
          )}
        </div>
      </div>
    </div>
  )
}
