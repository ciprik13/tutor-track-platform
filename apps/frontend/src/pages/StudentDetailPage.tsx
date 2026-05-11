import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getInitials } from "@/lib/dateUtils";
import { useStudent } from "@/queries/useStudents";
import { useLessons, useTogglePayment, useDeleteLesson, useUpdateLesson } from "@/queries/useLessons";
import { usePayments, useDeletePayment } from "@/queries/usePayments";
import { useQueryClient } from "@tanstack/react-query";
import LessonModal from "@/components/lessons/LessonModal";
import PaymentModal from "@/components/payments/PaymentModal";
import type { Lesson, Payment } from "@/types";

const IcBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const IcStar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IcWallet = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
  </svg>
)
const IcPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
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
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

export default function StudentDetailPage() {
  const { id }         = useParams();
  const navigate       = useNavigate();
  const queryClient    = useQueryClient();
  const [activeTab, setActiveTab]   = useState<"lessons" | "payments" | "report">("lessons");
  const [lessonModal, setLessonModal]   = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [editLesson, setEditLesson]     = useState<Lesson | null>(null);
  const [editPayment, setEditPayment]   = useState<Payment | null>(null);

  const { data: student, isLoading } = useStudent(Number(id));
  const { data: lessons  = [] }      = useLessons({ studentId: Number(id) });
  const { data: payments = [] }      = usePayments({ studentId: Number(id) });

  const togglePayment = useTogglePayment();
  const deleteLesson  = useDeleteLesson();
  const deletePayment = useDeletePayment();
  const updateLesson  = useUpdateLesson();

  const unpaidLessons = lessons.filter(l => l.paymentStatus === 'unpaid' && l.status === 'done');
  const unpaidTotal   = unpaidLessons.reduce((s, l) => s + l.pricePerSession, 0);
  const paidTotal     = lessons.filter(l => l.paymentStatus === 'paid').reduce((s, l) => s + l.pricePerSession, 0);

  const handleMarkAllPaid = async () => {
    await Promise.all(unpaidLessons.map(l => updateLesson.mutateAsync({ ...l, paymentStatus: 'paid' })));
    queryClient.invalidateQueries({ queryKey: ['lessons'] });
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
  const fmtShort = (iso: string) => {
    const d = new Date(iso)
    return { day: d.getDate(), mon: d.toLocaleDateString('ro-RO', { month: 'short' }).replace('.', '') }
  }
  const fmtTime = (iso: string) => {
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Se încarcă...</p>
    </div>
  );
  if (!student) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Studentul nu a fost găsit.</p>
    </div>
  );

  const tabs: Array<{ key: 'lessons' | 'payments' | 'report'; label: string; count?: number }> = [
    { key: 'lessons',  label: 'Lecții',  count: lessons.length  },
    { key: 'payments', label: 'Plăți',   count: payments.length },
    { key: 'report',   label: 'Raport' },
  ]

  return (
    <div style={{ minHeight: '100%' }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'color-mix(in srgb, var(--bg-page) 92%, transparent)',
        backdropFilter: 'blur(8px)',
        borderBottom: '0.5px solid var(--border)',
      }}>
        <div style={{ maxWidth: 1100, padding: '14px 36px 0' }}>
          {/* Back */}
          <button
            onClick={() => navigate('/students')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14, transition: 'color 120ms' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'}
          >
            <IcBack /> Toți studenții
          </button>

          {/* Student info row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="tt-avatar" style={{ width: 52, height: 52, fontSize: 18 }}>
                {getInitials(student.name)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h1 style={{
                    fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600,
                    letterSpacing: '-0.025em', color: 'var(--text-1)', margin: 0,
                  }}>{student.name}</h1>
                  {student.priority && <span style={{ color: 'var(--warning)' }}><IcStar /></span>}
                  <span className={`tt-pill ${student.status === 'active' ? 'tt-pill-active' : 'tt-pill-inactive'}`}>
                    {student.status === 'active' ? 'Activ' : 'Inactiv'}
                  </span>
                </div>
                <p style={{ fontSize: 13.5, color: 'var(--text-2)', margin: '4px 0 0' }}>
                  {student.subject} · {student.grade}{student.phone && ` · ${student.phone}`}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditLesson(null); setLessonModal(true) }} className="tt-btn tt-btn-primary" style={{ height: 36 }}>
                <IcPlus /> Lecție
              </button>
              <button onClick={() => { setEditPayment(null); setPaymentModal(true) }} className="tt-btn tt-btn-secondary" style={{ height: 36 }}>
                Înregistrează plată
              </button>
            </div>
          </div>

          {/* Unpaid banner */}
          {unpaidTotal > 0 && (
            <div style={{
              marginTop: 16, padding: '12px 16px',
              background: 'var(--warning-soft)',
              border: '0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)',
              borderRadius: 'var(--r-md)',
              display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            }}>
              <span style={{ color: 'var(--warning)', flexShrink: 0 }}><IcWallet /></span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--warning-strong)' }}>
                  {unpaidLessons.length} {unpaidLessons.length === 1 ? 'lecție neachitată' : 'lecții neachitate'} ·{' '}
                </span>
                <span className="tabular" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--warning-strong)' }}>
                  {unpaidTotal.toLocaleString()} MDL
                </span>
                <span style={{ fontSize: 12, color: 'var(--warning-strong)', opacity: 0.75, marginLeft: 6 }}>
                  Trimite raportul sau marchează ca achitat.
                </span>
              </div>
              <button
                onClick={handleMarkAllPaid}
                style={{
                  height: 30, padding: '0 12px', borderRadius: 8,
                  background: 'var(--warning-strong)', color: 'white',
                  fontSize: 12.5, fontWeight: 500, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
                }}
              ><IcCheck /> Marchează achitat</button>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, marginTop: 16 }}>
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: '10px 16px',
                  fontSize: 13.5, fontWeight: activeTab === key ? 600 : 500,
                  color: activeTab === key ? 'var(--text-1)' : 'var(--text-2)',
                  borderBottom: activeTab === key ? '2px solid var(--accent)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'all 120ms',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', borderRadius: 0,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontFamily: 'var(--font-text)',
                }}
              >
                {label}
                {count != null && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ maxWidth: 1100, padding: '24px 36px 60px' }}>

        {/* Lessons tab */}
        {activeTab === 'lessons' && (
          <div className="tt-card" style={{ padding: 0, overflow: 'hidden' }}>
            {lessons.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Nicio lecție înregistrată</p>
                <button onClick={() => { setEditLesson(null); setLessonModal(true) }} style={{ marginTop: 10, color: 'var(--accent)', fontSize: 13.5, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Adaugă prima lecție →
                </button>
              </div>
            ) : (
              lessons.map((lesson, idx) => {
                const { day, mon } = fmtShort(lesson.date)
                return (
                  <div
                    key={lesson.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '52px 1fr auto auto auto auto',
                      alignItems: 'center', gap: 14, padding: '14px 22px',
                      borderBottom: idx < lessons.length - 1 ? '0.5px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <div className="tt-metric" style={{ fontSize: 20, color: 'var(--text-1)' }}>{day}</div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>{mon}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                        {student.subject} · {lesson.durationMinutes} min
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{fmtTime(lesson.date)}</div>
                    </div>
                    <div className="tabular" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                      {lesson.pricePerSession.toLocaleString()} MDL
                    </div>
                    <button
                      onClick={() => togglePayment.mutate({ id: lesson.id!, paymentStatus: lesson.paymentStatus === 'paid' ? 'unpaid' : 'paid' })}
                      className={`tt-pill ${lesson.paymentStatus === 'paid' ? 'tt-pill-paid' : 'tt-pill-unpaid'}`}
                      style={{ cursor: 'pointer', border: 'none', height: 24 }}
                    >
                      <span className={`tt-dot ${lesson.paymentStatus === 'paid' ? 'tt-dot-paid' : 'tt-dot-unpaid'}`} />
                      {lesson.paymentStatus === 'paid' ? 'Achitat' : 'Neachitat'}
                    </button>
                    <button
                      onClick={() => { setEditLesson(lesson); setLessonModal(true) }}
                      style={{ width: 28, height: 28, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                    ><IcEdit /></button>
                    <button
                      onClick={() => confirm('Ștergi lecția?') && deleteLesson.mutate(lesson.id!)}
                      style={{ width: 28, height: 28, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                    ><IcTrash /></button>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* Payments tab */}
        {activeTab === 'payments' && (
          <div>
            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div className="tt-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Total achitat</div>
                <div className="tt-metric tabular" style={{ fontSize: 28, color: 'var(--success)', marginTop: 8 }}>
                  {paidTotal.toLocaleString()} MDL
                </div>
              </div>
              <div className="tt-card" style={{ padding: 20, background: unpaidTotal > 0 ? 'var(--warning-soft)' : 'var(--bg-card)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>De încasat</div>
                <div className="tt-metric tabular" style={{ fontSize: 28, color: unpaidTotal > 0 ? 'var(--warning-strong)' : 'var(--text-3)', marginTop: 8 }}>
                  {unpaidTotal.toLocaleString()} MDL
                </div>
              </div>
            </div>

            {payments.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Nicio plată înregistrată</p>
              </div>
            ) : (
              <div className="tt-card" style={{ padding: 0 }}>
                {payments.map((payment, idx) => (
                  <div
                    key={payment.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '14px 22px',
                      borderBottom: idx < payments.length - 1 ? '0.5px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>{payment.period}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{fmtDate(payment.date)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="tabular" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                        {payment.amount.toLocaleString()} {payment.currency}
                      </span>
                      <span className={`tt-pill ${payment.status === 'paid' ? 'tt-pill-paid' : payment.status === 'partial' ? 'tt-pill-partial' : 'tt-pill-unpaid'}`}>
                        {payment.status === 'paid' ? 'Achitat' : payment.status === 'partial' ? 'Parțial' : 'Neachitat'}
                      </span>
                      <button onClick={() => { setEditPayment(payment); setPaymentModal(true) }}
                        style={{ width: 28, height: 28, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                      ><IcEdit /></button>
                      <button onClick={() => confirm('Ștergi plata?') && deletePayment.mutate(payment.id!)}
                        style={{ width: 28, height: 28, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                      ><IcTrash /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Report tab */}
        {activeTab === 'report' && (
          <div className="tt-card" style={{ padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Mergi la pagina{' '}
              <span
                onClick={() => navigate('/reports')}
                style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 500 }}
              >
                Rapoarte
              </span>{' '}
              pentru a genera raportul lunar al acestui student.
            </p>
          </div>
        )}
      </div>

      {lessonModal && (
        <LessonModal lesson={editLesson} preselectedStudentId={Number(id)} onClose={() => setLessonModal(false)} />
      )}
      {paymentModal && (
        <PaymentModal payment={editPayment} onClose={() => setPaymentModal(false)} />
      )}
    </div>
  );
}
