import { useState } from 'react'
import { useLessons, useUpdateLesson } from '@/queries/useLessons'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useQueryClient } from '@tanstack/react-query'
import MonthPicker from '@/components/ui/MonthPicker'

const IcCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IcCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcWhatsApp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l1.65-3.8A8.94 8.94 0 0 1 3.4 13a9 9 0 1 1 4.4 7.7L3 21"/>
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5 2 1c.5 1-1 2-2 2.5-3.5 0-7.5-4-7.5-7.5.5-1 1.5-2.5 2.5-2l1 2-1.5 1z"/>
  </svg>
)

interface Props {
  student: any
  initialMonth?: string
}

export default function StudentReport({ student, initialMonth }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(
    initialMonth ?? new Date().toISOString().slice(0, 7)
  )
  const [copied, setCopied] = useState(false)

  const profile      = useSelector((s: RootState) => s.profile)
  const queryClient  = useQueryClient()
  const updateLesson = useUpdateLesson()

  const { data: lessons = [] } = useLessons({
    studentId: student.id,
    month:     selectedMonth,
  })

  const grouped = (lessons as any[]).reduce((acc: Record<number, any[]>, l: any) => {
    const key = l.durationMinutes
    if (!acc[key]) acc[key] = []
    acc[key].push(l)
    return acc
  }, {})

  const monthLabel  = new Date(selectedMonth + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })
  const fmtDate     = (iso: string) => new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })
  const totalAmount  = (lessons as any[]).reduce((s: number, l: any) => s + Number(l.price), 0)
  const unpaidAmount = (lessons as any[]).filter((l: any) => !l.isPaid).reduce((s: number, l: any) => s + Number(l.price), 0)

  const generateReport = () => {
    let idx = 1
    const lines: string[] = []
    lines.push(`Salut ${student.name}. Îți trimit orarul lecțiilor de ${student.subject} din luna ${monthLabel}:`)
    lines.push('')
    ;(lessons as any[]).forEach((l: any) => lines.push(`${idx++}) ${fmtDate(l.date)} — ${l.durationMinutes} minute`))
    lines.push('')
    lines.push('💰 Calcul total:')
    let grand = 0
    Object.entries(grouped).forEach(([dur, items]) => {
      const sub = (items as any[]).reduce((s: number, l: any) => s + Number(l.price), 0)
      grand += sub
      lines.push(`📚 ${items.length} × ${dur} min × ${Number((items as any[])[0].price)} lei = ${sub} lei`)
    })
    lines.push('')
    lines.push(`Total de achitat: ${grand} lei`)
    lines.push('')
    lines.push(`ℹ️ Contact: 📞 ${profile.phone}  •  📧 ${profile.email}`)
    lines.push('Dacă ai întrebări, sunt aici. 😊')
    return lines.join('\n')
  }

  const report = generateReport()

  const handleCopy = async () => {
    await navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleMarkAllPaid = async () => {
    const unpaid = (lessons as any[]).filter((l: any) => !l.isPaid)
    await Promise.all(unpaid.map((l: any) => updateLesson.mutateAsync({ id: l.id, isPaid: true })))
    queryClient.invalidateQueries({ queryKey: ['lessons'] })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Month picker */}
      <div style={{ maxWidth: 220 }}>
        <label className="tt-label">Luna</label>
        <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      {/* Summary stats */}
      {(lessons as any[]).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Lecții',     value: String((lessons as any[]).length),              warn: false },
            { label: 'Total',      value: `${totalAmount.toLocaleString()} ${profile.currency}`,  warn: false },
            { label: 'Neachitat',  value: unpaidAmount > 0 ? `${unpaidAmount.toLocaleString()} ${profile.currency}` : '—', warn: unpaidAmount > 0 },
          ].map(({ label, value, warn }) => (
            <div key={label} style={{ padding: '12px 14px', background: 'var(--bg-page)', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
              <div className="tabular" style={{ fontSize: 16, fontWeight: 700, color: warn ? 'var(--warning-strong)' : 'var(--text-1)', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Report preview or empty state */}
      {(lessons as any[]).length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: 'var(--bg-page)', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
            Nicio lecție efectuată în {monthLabel}
          </p>
        </div>
      ) : (
        <>
          <div style={{
            padding: '16px 18px',
            background: 'var(--bg-page)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--r-md)',
            fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.75,
            color: 'var(--text-1)', whiteSpace: 'pre-wrap',
            maxHeight: 320, overflowY: 'auto',
          }}>
            {report}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              className="tt-btn tt-btn-primary"
              style={{ flex: 1, height: 42, minWidth: 160 }}
            >
              {copied ? <><IcCheck /> Copiat!</> : <><IcCopy /> Copiază în clipboard</>}
            </button>
            <button className="tt-btn tt-btn-secondary" style={{ height: 42 }}>
              <IcWhatsApp /> WhatsApp
            </button>
          </div>

          <button
            onClick={handleMarkAllPaid}
            disabled={(lessons as any[]).every((l: any) => l.isPaid)}
            className="tt-btn tt-btn-ghost"
            style={{ width: '100%', height: 36, fontSize: 12.5 }}
          >
            <IcCheck /> Marchează toate ca achitate
          </button>
        </>
      )}
    </div>
  )
}