import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getInitials } from "@/lib/dateUtils";
import { useStudents, useDeleteStudent } from "@/queries/useStudents";
import StudentModal from "@/components/students/StudentModal";

const IcSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
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

export default function StudentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<any | null>(null);

  const { data: students = [], isLoading } = useStudents({
    status: statusFilter === "all" ? undefined : statusFilter,
    search,
  });
  const deleteStudent = useDeleteStudent();

  const handleEdit = (student: any) => { setEditStudent(student); setModalOpen(true) }
  const handleAdd = () => { setEditStudent(null); setModalOpen(true) }
  const handleDelete = (id: string) => {
    if (confirm("Sigur vrei să ștergi acest student?")) deleteStudent.mutate(id)
  }

  return (
    <div style={{ padding: '28px 36px 60px', maxWidth: 1280 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 className="tt-page-title">Studenți</h1>
          <p className="tt-page-sub">
            {students.filter((s: any) => s.status === 'active').length} activi
            {students.filter((s: any) => s.status === 'inactive').length > 0 && ` · ${students.filter((s: any) => s.status === 'inactive').length} inactivi`}
          </p>
        </div>
        <button onClick={handleAdd} className="tt-btn tt-btn-primary" style={{ height: 38 }}>
          <IcPlus /> Student nou
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}>
            <IcSearch />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Caută după nume..."
            className="tt-input"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div className="tt-filter-row">
          {([['all', 'Toți'], ['active', 'Activi'], ['inactive', 'Inactivi']] as const).map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={`tt-filter-btn ${statusFilter === k ? 'active' : ''}`}
            >{lbl}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <p style={{ color: 'var(--text-3)', fontSize: 13.5 }}>Se încarcă...</p>
      ) : students.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 64 }}>
          <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Niciun student găsit</p>
          <button onClick={handleAdd} style={{ marginTop: 12, color: 'var(--accent)', fontSize: 13.5, background: 'none', border: 'none', cursor: 'pointer' }}>
            Adaugă primul student →
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {students.map((student: any) => (
            <div
              key={student.id}
              className="tt-card"
              style={{
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 16,
                opacity: student.status === 'inactive' ? 0.6 : 1,
                transition: 'all 120ms',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-pop)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)'}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, cursor: 'pointer', minWidth: 0 }}
                onClick={() => navigate(`/students/${student.id}`)}
              >
                <div className="tt-avatar" style={{ width: 42, height: 42, fontSize: 15, flexShrink: 0 }}>
                  {getInitials(student.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                      {student.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 2 }}>
                    {student.subject} · Clasa {student.grade}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span className={`tt-pill ${student.status === 'active' ? 'tt-pill-active' : 'tt-pill-inactive'}`}>
                  {student.status === 'active' ? 'Activ' : 'Inactiv'}
                </span>
                <button
                  onClick={() => handleEdit(student)}
                  style={{ width: 30, height: 30, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-card-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                  title="Editează"
                ><IcEdit /></button>
                <button
                  onClick={() => handleDelete(student.id)}
                  style={{ width: 30, height: 30, borderRadius: 7, color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 120ms' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--danger-soft)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-3)' }}
                  title="Șterge"
                ><IcTrash /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <StudentModal student={editStudent} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
