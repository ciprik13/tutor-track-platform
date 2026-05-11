import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '@/store'
import type { AppDispatch } from '@/store'
import { updateProfile } from '@/store/slices/profileSlice'
import { useStudents } from '@/queries/useStudents'
import { useCreateLesson, useLessons } from '@/queries/useLessons'
import { fetchCalendarEvents, type CalendarEvent } from '@/lib/calendar'
import { requestCalendarToken } from '@/lib/oauth'
import { useQueryClient } from '@tanstack/react-query'
import MonthPicker from '@/components/ui/MonthPicker'
import type { Lesson } from '@/types'

interface Props {
  onClose: () => void
}

type DuplicateKind = 'exact' | 'probable' | null

function extractNameTokens(eventTitle: string): string[] {
  const namePart = eventTitle.split('|')[0].trim().toLowerCase()
  return namePart.split(/\s+/).filter(t => t.length > 1)
}

function guessStudentId(eventTitle: string, students: { id?: number; name: string }[]): number | null {
  const tokens = extractNameTokens(eventTitle)
  for (const student of students) {
    const parts = student.name.toLowerCase().split(/\s+/)
    if (tokens.some(token => parts.some(part => part.length > 1 && part === token))) {
      return student.id ?? null
    }
  }
  // Fallback: substring match on the name portion before "|"
  const namePart = eventTitle.split('|')[0].trim().toLowerCase()
  for (const student of students) {
    const parts = student.name.toLowerCase().split(/\s+/)
    if (parts.some(part => part.length > 2 && namePart.includes(part))) {
      return student.id ?? null
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

// Merge consecutive events for the same student into a single longer lesson.
function mergeConsecutiveEvents(
  events: CalendarEvent[],
  students: { id?: number; name: string }[],
): CalendarEvent[] {
  const sorted = [...events].sort((a, b) =>
    (a.start.dateTime ?? '').localeCompare(b.start.dateTime ?? ''),
  )
  const consumed = new Set<string>()
  const result: CalendarEvent[] = []

  for (let i = 0; i < sorted.length; i++) {
    if (consumed.has(sorted[i].id)) continue
    const cur = sorted[i]
    if (!cur.start.dateTime || !cur.end.dateTime) { result.push(cur); continue }

    const curStudentId = guessStudentId(cur.summary, students)
    if (!curStudentId) { result.push(cur); continue }

    // Look ahead for adjacent same-student slots
    let merged: CalendarEvent = { ...cur, mergedIds: [cur.id] }
    let runEnd = cur.end.dateTime

    for (let j = i + 1; j < sorted.length; j++) {
      const nxt = sorted[j]
      if (consumed.has(nxt.id) || !nxt.start.dateTime || !nxt.end.dateTime) continue
      // Must be same student and start exactly when the current run ends
      if (guessStudentId(nxt.summary, students) !== curStudentId) continue
      if (nxt.start.dateTime !== runEnd) continue
      // Cap at 120 min total
      const totalMin =
        (new Date(nxt.end.dateTime).getTime() - new Date(merged.start.dateTime!).getTime()) / 60000
      if (totalMin > 120) break

      merged = { ...merged, end: nxt.end, mergedIds: [...merged.mergedIds!, nxt.id] }
      runEnd = nxt.end.dateTime
      consumed.add(nxt.id)
    }

    result.push(merged)
  }

  return result
}

function detectDuplicate(
  event: CalendarEvent,
  studentId: number | null,
  existingLessons: Lesson[],
): DuplicateKind {
  // Exact: any of the original calendar IDs already in DB
  const allIds = [event.id, ...(event.mergedIds ?? [])]
  if (allIds.some(id => existingLessons.some(l => l.googleCalendarEventId === id))) {
    return 'exact'
  }
  // Probable: same student + same hour slot
  if (studentId && event.start.dateTime) {
    const eventHour = event.start.dateTime.slice(0, 13) // "2026-05-09T11"
    if (existingLessons.some(l => l.studentId === studentId && l.date.slice(0, 13) === eventHour)) {
      return 'probable'
    }
  }
  return null
}

export default function CalendarImport({ onClose }: Props) {
  const dispatch = useDispatch<AppDispatch>()
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

  // Load existing lessons for the chosen month to detect duplicates
  const { data: existingLessons = [] } = useLessons({ month })

  const getToken = async (): Promise<string> => {
    if (profile.googleCalendarToken) return profile.googleCalendarToken
    const token = await requestCalendarToken()
    dispatch(updateProfile({ googleCalendarToken: token, googleCalendarConnected: true }))
    return token
  }

  const loadEvents = async (token: string) => {
    const raw = await fetchCalendarEvents(token, month)
    const filtered = raw.filter(e => e.summary && e.start.dateTime)
    const merged = mergeConsecutiveEvents(filtered, students)
    setEvents(merged)
    // Auto-select only events that match a student AND are NOT duplicates
    setSelected(new Set(
      merged
        .filter(e => {
          const sid = guessStudentId(e.summary, students)
          return sid !== null && detectDuplicate(e, sid, existingLessons) === null
        })
        .map(e => e.id)
    ))
    setStep('preview')
  }

  const handleFetch = async () => {
    setLoading(true)
    setError('')
    try {
      const token = await getToken()
      await loadEvents(token)
    } catch (err: any) {
      if (err.message === 'TOKEN_EXPIRED') {
        try {
          const fresh = await requestCalendarToken()
          dispatch(updateProfile({ googleCalendarToken: fresh }))
          await loadEvents(fresh)
        } catch {
          setError('Tokenul a expirat și reconectarea a eșuat. Reconectează din Setări.')
        }
      } else {
        setError(err.message || 'Eroare la încărcarea evenimentelor.')
      }
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
      const price = duration === 60 ? profile.defaultPrice60
        : duration === 90 ? profile.defaultPrice90
        : profile.defaultPrice120
      await createLesson.mutateAsync({
        studentId,
        title: event.summary,
        date: event.start.dateTime!.slice(0, 16),
        durationMinutes: duration,
        pricePerSession: price,
        status: 'done',
        paymentStatus: 'unpaid',
        googleCalendarEventId: event.mergedIds?.[0] ?? event.id,
        notes: '',
        createdAt: new Date().toISOString(),
      })
      count++
    }
    queryClient.invalidateQueries({ queryKey: ['lessons'] })
    setImportedCount(count)
    setStep('done')
    setImporting(false)
  }

  // Stats for the preview header
  const duplicateCount = events.filter(e => {
    const sid = guessStudentId(e.summary, students)
    return detectDuplicate(e, sid, existingLessons) !== null
  }).length

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 50, padding: 16,
    }}>
      <div className="tt-card" style={{
        width: '100%', maxWidth: 520,
        maxHeight: '82vh', display: 'flex', flexDirection: 'column',
        padding: 0, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '0.5px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
              Import din Google Calendar
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              {step === 'select' && 'Selectează luna'}
              {step === 'preview' && (
                duplicateCount > 0
                  ? `${events.length} evenimente · ${duplicateCount} deja existente (neselectate)`
                  : `${events.length} evenimente găsite`
              )}
              {step === 'done' && 'Import finalizat'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* ── Step: select month ── */}
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

          {/* ── Step: preview ── */}
          {step === 'preview' && (
            <div>
              {events.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center', padding: '20px 0' }}>
                  Niciun eveniment găsit în această lună
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {/* Legend for duplicates */}
                  {duplicateCount > 0 && (
                    <div style={{
                      fontSize: 12, color: 'var(--warning-strong)',
                      background: 'var(--warning-soft)',
                      border: '0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)',
                      borderRadius: 8, padding: '8px 12px', marginBottom: 6,
                    }}>
                      {duplicateCount} {duplicateCount === 1 ? 'eveniment există deja' : 'evenimente există deja'} în platformă — neselectate automat. Poți să le bifezi manual dacă vrei să le reimportezi.
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {selected.size} din {events.length} selectate
                    </span>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => setSelected(new Set(events.map(e => e.id)))}
                        style={{ fontSize: 11.5, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                      >Toate</button>
                      <button
                        onClick={() => setSelected(new Set())}
                        style={{ fontSize: 11.5, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >Niciuna</button>
                    </div>
                  </div>

                  {events.map(event => {
                    const studentId = guessStudentId(event.summary, students)
                    const student = students.find(s => s.id === studentId)
                    const dupKind = detectDuplicate(event, studentId, existingLessons)
                    const isSelected = selected.has(event.id)
                    const isDup = dupKind !== null
                    const duration = guessDuration(event)
                    const dt = event.start.dateTime ? new Date(event.start.dateTime) : null
                    const dateStr = dt ? dt.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }) : '—'
                    const timeStr = dt ? `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}` : '—'

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
                          background: isSelected
                            ? 'var(--accent-soft)'
                            : isDup
                            ? 'var(--warning-soft)'
                            : 'var(--bg-input)',
                          border: `0.5px solid ${
                            isSelected
                              ? 'color-mix(in srgb, var(--accent) 30%, transparent)'
                              : isDup
                              ? 'color-mix(in srgb, var(--warning) 25%, transparent)'
                              : 'var(--border)'
                          }`,
                          transition: 'all 120ms',
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                          background: isSelected ? 'var(--accent)' : 'transparent',
                          border: `2px solid ${isSelected ? 'var(--accent)' : isDup ? 'color-mix(in srgb, var(--warning) 50%, transparent)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 120ms',
                        }}>
                          {isSelected && (
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>

                        {/* Event info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {event.summary}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                            <span>{dateStr} · {timeStr} · {duration} min</span>
                            {event.mergedIds && event.mergedIds.length > 1 && (
                              <span style={{
                                fontSize: 10, fontWeight: 600, color: 'var(--accent)',
                                background: 'var(--accent-soft)', padding: '1px 6px', borderRadius: 10,
                              }}>
                                {event.mergedIds.length}×{Math.round(duration / event.mergedIds.length)} min combinat
                              </span>
                            )}
                            {event.calendarName && (
                              <span style={{ opacity: 0.7 }}>· {event.calendarName}</span>
                            )}
                          </div>
                        </div>

                        {/* Right badge: duplicate indicator or student name */}
                        <div style={{ flexShrink: 0, textAlign: 'right' }}>
                          {isDup ? (
                            <span style={{
                              fontSize: 10.5, fontWeight: 600,
                              color: 'var(--warning-strong)',
                              background: 'var(--warning-soft)',
                              padding: '2px 8px', borderRadius: 20,
                              border: '0.5px solid color-mix(in srgb, var(--warning) 30%, transparent)',
                            }}>
                              {dupKind === 'exact' ? 'Deja importat' : 'Probabil duplicat'}
                            </span>
                          ) : student ? (
                            <span className="tt-pill tt-pill-active" style={{ fontSize: 10.5 }}>
                              {student.name.split(' ')[0]}
                            </span>
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

          {/* ── Step: done ── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'var(--accent-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
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
              <button onClick={() => setStep('select')} className="tt-btn tt-btn-secondary" style={{ height: 36, flex: 1 }}>
                Înapoi
              </button>
              <button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
                className="tt-btn tt-btn-primary"
                style={{ height: 36, flex: 2, opacity: importing || selected.size === 0 ? 0.5 : 1 }}
              >
                {importing ? 'Se importă...' : `Importă ${selected.size} lecții`}
              </button>
            </>
          )}
          {step === 'done' && (
            <button onClick={onClose} className="tt-btn tt-btn-primary" style={{ height: 36, flex: 1 }}>
              Gata
            </button>
          )}
          {step === 'select' && (
            <button onClick={onClose} className="tt-btn tt-btn-secondary" style={{ height: 36, flex: 1 }}>
              Anulează
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
