import { useState } from "react";
import { useStudents } from "@/queries/useStudents";
import { useLessons, useUpdateLesson } from "@/queries/useLessons";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { useQueryClient } from "@tanstack/react-query";
import MonthPicker from "@/components/ui/MonthPicker";
import { getInitials } from "@/lib/dateUtils";

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

export default function ReportsPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>();
  const [selectedMonth, setSelectedMonth]         = useState(new Date().toISOString().slice(0, 7));
  const [copied, setCopied]                       = useState(false);

  const profile     = useSelector((s: RootState) => s.profile);
  const queryClient = useQueryClient();
  const updateLesson = useUpdateLesson();
  const { data: students = [] } = useStudents();
  const { data: lessons  = [] } = useLessons({ studentId: selectedStudentId, month: selectedMonth, status: 'done' });

  const student = students.find(s => s.id === selectedStudentId);

  const grouped = lessons.reduce((acc, l) => {
    const key = l.durationMinutes;
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {} as Record<number, typeof lessons>);

  const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' });

  const generateReport = () => {
    if (!student) return '';
    let idx = 1; const lines: string[] = [];
    lines.push(`Salut ${student.name}. Îți trimit orarul lecțiilor de ${student.subject} din luna ${monthLabel}:`);
    lines.push('');
    lessons.forEach(l => lines.push(`${idx++}) ${fmtDate(l.date)} — ${l.durationMinutes} minute`));
    lines.push('');
    lines.push('💰 Calcul total:');
    let grand = 0;
    Object.entries(grouped).forEach(([dur, items]) => {
      const sub = items.reduce((s, l) => s + l.pricePerSession, 0);
      grand += sub;
      lines.push(`📚 ${items.length} × ${dur} min × ${items[0].pricePerSession} lei = ${sub} lei`);
    });
    lines.push('');
    lines.push(`Total de achitat: ${grand} lei`);
    lines.push('');
    lines.push(`ℹ️ Date MIA: 📞 ${profile.phone}  •  📧 ${profile.email}`);
    lines.push('Dacă ai întrebări, sunt aici. 😊');
    return lines.join('\n');
  };

  const report = generateReport();
  const handleCopy = async () => {
    await navigator.clipboard.writeText(report);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const handleMarkAllPaid = async () => {
    const unpaid = lessons.filter(l => l.paymentStatus === 'unpaid');
    await Promise.all(unpaid.map(l => updateLesson.mutateAsync({ ...l, paymentStatus: 'paid' })));
    queryClient.invalidateQueries({ queryKey: ['lessons'] });
  };

  const totalAmount  = lessons.reduce((s, l) => s + l.pricePerSession, 0);
  const unpaidAmount = lessons.filter(l => l.paymentStatus === 'unpaid').reduce((s, l) => s + l.pricePerSession, 0);

  return (
    <div style={{ padding: '28px 36px 60px', maxWidth: 1280 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="tt-page-title">Rapoarte</h1>
        <p className="tt-page-sub">Generează raport lunar și trimite-l părinților</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, alignItems: 'start' }}>

        {/* ── Left: filters + summary ── */}
        <div className="tt-card" style={{ padding: 20 }}>
          <div style={{ marginBottom: 14 }}>
            <label className="tt-label">Student</label>
            <select
              value={selectedStudentId ?? ''}
              onChange={e => setSelectedStudentId(e.target.value ? Number(e.target.value) : undefined)}
              className="tt-input"
            >
              <option value="">Selectează student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="tt-label">Luna</label>
            <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
          </div>

          {selectedStudentId && lessons.length > 0 && (
            <>
              <div className="tt-rule" style={{ marginBottom: 16 }} />
              {/* Summary */}
              {student && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div className="tt-avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                    {getInitials(student.name)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>{student.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{student.phone}</div>
                  </div>
                </div>
              )}
              {[
                ['Lecții', lessons.length],
                ['Total', `${totalAmount.toLocaleString()} MDL`],
                ['Neachitate', unpaidAmount > 0 ? `${unpaidAmount.toLocaleString()} MDL` : '—'],
              ].map(([lbl, val]) => (
                <div key={lbl as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{lbl}</span>
                  <span className="tabular" style={{ fontSize: 13, fontWeight: 600, color: lbl === 'Neachitate' && unpaidAmount > 0 ? 'var(--warning-strong)' : 'var(--text-1)' }}>{val}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Right: report preview ── */}
        <div>
          {!selectedStudentId ? (
            <div className="tt-card" style={{ padding: 28, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.6 }}>
                Selectează un student și o lună pentru a genera raportul
              </p>
              <div style={{
                marginTop: 20, padding: '18px 20px',
                background: 'var(--bg-page)', border: '0.5px dashed var(--border)',
                borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-mono)', fontSize: 12.5, lineHeight: 1.7,
                color: 'var(--text-3)', textAlign: 'left', whiteSpace: 'pre-wrap',
              }}>
                {`Salut [Nume]. Îți trimit orarul lecțiilor de [Materie] din luna [Lună]:

1) [zi] [lună] — [durata] minute
2) [zi] [lună] — [durata] minute

💰 Calcul total:
📚 [nr] × [dur] min × [preț] lei = [subtotal] lei

Total de achitat: [total] lei`}
              </div>
            </div>
          ) : lessons.length === 0 ? (
            <div className="tt-card" style={{ padding: 40, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
                Nicio lecție efectuată în {monthLabel} pentru {student?.name}
              </p>
            </div>
          ) : (
            <div className="tt-card" style={{ padding: 24 }}>
              {/* Report text */}
              <div style={{
                padding: '18px 20px', marginBottom: 18,
                background: 'var(--bg-page)',
                border: '0.5px solid var(--border)',
                borderRadius: 'var(--r-md)',
                fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.75,
                color: 'var(--text-1)', whiteSpace: 'pre-wrap',
                maxHeight: 420, overflowY: 'auto',
              }}>
                {report}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={handleCopy}
                  className="tt-btn tt-btn-primary"
                  style={{ flex: 1, height: 42, minWidth: 180 }}
                >
                  {copied ? <><IcCheck /> Copiat!</> : <><IcCopy /> Copiază în clipboard</>}
                </button>
                <button
                  className="tt-btn tt-btn-secondary"
                  style={{ height: 42 }}
                >
                  <IcWhatsApp /> Deschide WhatsApp
                </button>
              </div>

              <button
                onClick={handleMarkAllPaid}
                disabled={lessons.every(l => l.paymentStatus === 'paid')}
                className="tt-btn tt-btn-ghost"
                style={{ marginTop: 10, width: '100%', height: 36, fontSize: 12.5 }}
              >
                <IcCheck /> Marchează toate ca achitate
              </button>

              {/* Duration breakdown */}
              {Object.keys(grouped).length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(grouped).length}, 1fr)`, gap: 12, marginTop: 20 }}>
                  {Object.entries(grouped).map(([dur, items]) => (
                    <div key={dur} style={{ padding: '14px 16px', background: 'var(--bg-page)', borderRadius: 'var(--r-md)', border: '0.5px solid var(--border)' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{dur} min</div>
                      <div className="tt-metric tabular" style={{ fontSize: 24, color: 'var(--text-1)', marginTop: 6 }}>{items.length}</div>
                      <div className="tabular" style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>
                        {items.reduce((s, l) => s + l.pricePerSession, 0).toLocaleString()} {profile.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
