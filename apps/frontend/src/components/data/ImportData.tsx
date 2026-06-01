import { useState, useRef } from "react";
import { studentsApi } from "@/lib/studentsApi";
import { lessonsApi } from "@/lib/lessonsApi";
import { paymentsApi } from "@/lib/paymentsApi";
import { useQueryClient } from "@tanstack/react-query";

// ── Icons ────────────────────────────────────────────────────
const IcUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcWarning = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcFile = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

// ── Types ────────────────────────────────────────────────────
type ImportState = "idle" | "analyzing" | "preview" | "importing" | "done" | "error";

interface ParsedData {
  students: any[];
  lessons: any[];
  payments: any[];
  exportedAt?: string;
}

interface PreviewStats {
  studentsNew: number;
  studentsSkipped: number;
  lessonsNew: number;
  lessonsSkipped: number;
  paymentsNew: number;
  paymentsSkipped: number;
}

interface ImportResult {
  studentsCreated: number;
  lessonsCreated: number;
  paymentsCreated: number;
  paymentsSkipped: number;
  errors: string[];
}

// ── Helper ───────────────────────────────────────────────────
const fetchAllPages = async (apiFn: (limit: number, offset: number) => Promise<any>) => {
  const PAGE = 100;
  let offset = 0;
  let allData: any[] = [];
  while (true) {
    const res = await apiFn(PAGE, offset);
    allData = [...allData, ...res.data];
    if (allData.length >= res.total) break;
    offset += PAGE;
  }
  return allData;
};

// ── Component ────────────────────────────────────────────────
export default function ImportData() {
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [state, setState] = useState<ImportState>("idle");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [preview, setPreview] = useState<PreviewStats | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // ── File select → analyze ──────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);
    setState("analyzing");

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.students || !Array.isArray(json.students)) {
        throw new Error("Fișierul nu are structura corectă (lipsesc students)");
      }

      const jsonStudents: any[] = json.students ?? [];
      const jsonLessons: any[]  = json.lessons  ?? [];
      const jsonPayments: any[] = json.payments  ?? [];

      // Fetch all existing data for dedup
      const [existingStudents, existingLessons, existingPayments] = await Promise.all([
        fetchAllPages(studentsApi.getAll),
        fetchAllPages(lessonsApi.getAll),
        fetchAllPages(paymentsApi.getAll),
      ]);

      // Students — dedup by ID or name (case-insensitive)
      const existingStudentIds   = new Set(existingStudents.map((s: any) => s.id));
      const existingStudentNames = new Set(existingStudents.map((s: any) => s.name.toLowerCase().trim()));
      const studentsNew = jsonStudents.filter(
        (s: any) =>
          !existingStudentIds.has(s.id) &&
          !existingStudentNames.has(s.name?.toLowerCase().trim())
      );

      // Lessons — dedup by ID or googleCalendarEventId
      const existingLessonIds  = new Set(existingLessons.map((l: any) => l.id));
      const existingGcalIds    = new Set(
        existingLessons
          .filter((l: any) => l.googleCalendarEventId)
          .map((l: any) => l.googleCalendarEventId)
      );
      const lessonsNew = jsonLessons.filter(
        (l: any) =>
          !existingLessonIds.has(l.id) &&
          (!l.googleCalendarEventId || !existingGcalIds.has(l.googleCalendarEventId))
      );

      // Payments — dedup by ID or (studentId + lessonId) combo
      const existingPaymentIds      = new Set(existingPayments.map((p: any) => p.id));
      const existingPaymentLessonIds = new Set(existingPayments.map((p: any) => p.lessonId));
      const paymentsNew = jsonPayments.filter(
        (p: any) =>
          !existingPaymentIds.has(p.id) &&
          !existingPaymentLessonIds.has(p.lessonId)
      );

      setPreview({
        studentsNew:      studentsNew.length,
        studentsSkipped:  jsonStudents.length - studentsNew.length,
        lessonsNew:       lessonsNew.length,
        lessonsSkipped:   jsonLessons.length - lessonsNew.length,
        paymentsNew:      paymentsNew.length,
        paymentsSkipped:  jsonPayments.length - paymentsNew.length,
      });

      setParsed({
        students:    studentsNew,
        lessons:     lessonsNew,
        payments:    paymentsNew,
        exportedAt:  json.exportedAt,
      });

      setState("preview");

    } catch (err: any) {
      setError(err.message || "Eroare la citirea fișierului");
      setState("error");
    }
  };

  // ── Confirm import ─────────────────────────────────────────
  const handleImport = async () => {
    if (!parsed) return;
    setState("importing");

    const total = parsed.students.length + parsed.lessons.length + parsed.payments.length;
    let done = 0;

    // Maps: old JSON id → new API id (pentru relații)
    const studentIdMap: Record<string, string> = {};
    const lessonIdMap:  Record<string, string> = {};

    let studentsCreated = 0;
    let lessonsCreated  = 0;
    let paymentsCreated = 0;
    let paymentsSkipped = 0;
    const errors: string[] = [];

    try {
      // ── 1. Studenți ──────────────────────────────────────
      for (const student of parsed.students) {
        setProgress({ done, total, current: `Student: ${student.name}` });
        try {
          const created = await studentsApi.create({
            name:          student.name,
            subject:       student.subject,
            grade:         student.grade,
            status:        student.status ?? "active",
            phone:         student.phone,
            email:         student.email,
            notes:         student.notes,
            priceOverride: student.priceOverride,
          });
          studentIdMap[student.id] = created.id;
          studentsCreated++;
        } catch (err: any) {
          errors.push(`Student "${student.name}": ${err.response?.data?.message ?? err.message}`);
        }
        done++;
        setProgress({ done, total, current: `Student: ${student.name}` });
      }

      // ── 2. Lecții ────────────────────────────────────────
      for (const lesson of parsed.lessons) {
        const mappedStudentId = studentIdMap[lesson.studentId] ?? lesson.studentId;
        setProgress({ done, total, current: `Lecție: ${lesson.studentNameSnapshot} — ${lesson.date?.slice(0, 10)}` });
        try {
          const created = await lessonsApi.create({
            studentId:             mappedStudentId,
            date:                  lesson.date,
            durationMinutes:       lesson.durationMinutes,
            price:                 Number(lesson.price),
            isPaid:                lesson.isPaid ?? false,
            googleCalendarEventId: lesson.googleCalendarEventId || null,
            notes:                 lesson.notes,
          });
          lessonIdMap[lesson.id] = created.id;
          lessonsCreated++;
        } catch (err: any) {
          errors.push(`Lecție "${lesson.date?.slice(0, 10)}": ${err.response?.data?.message ?? err.message}`);
        }
        done++;
        setProgress({ done, total, current: `Lecție: ${lesson.studentNameSnapshot}` });
      }

      // ── 3. Plăți ─────────────────────────────────────────
      for (const payment of parsed.payments) {
        const mappedStudentId = studentIdMap[payment.studentId] ?? payment.studentId;
        const mappedLessonId  = lessonIdMap[payment.lessonId]   ?? payment.lessonId;

        setProgress({ done, total, current: `Plată: ${payment.month}` });
        try {
          // Verificăm că lecția există în DB (poate fi lecție veche deja existentă)
          if (!mappedLessonId) {
            paymentsSkipped++;
            errors.push(`Plată pentru luna ${payment.month}: lecția asociată nu a fost găsită`);
            done++;
            continue;
          }

          await paymentsApi.create({
            studentId: mappedStudentId,
            lessonId:  mappedLessonId,
            amount:    Number(payment.amount),
            month:     payment.month,
            status:    payment.status ?? "unpaid",
            paidAt:    payment.paidAt,
          });
          paymentsCreated++;
        } catch (err: any) {
          paymentsSkipped++;
          errors.push(`Plată "${payment.month}": ${err.response?.data?.message ?? err.message}`);
        }
        done++;
        setProgress({ done, total, current: `Plată: ${payment.month}` });
      }

      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });

      setResult({ studentsCreated, lessonsCreated, paymentsCreated, paymentsSkipped, errors });
      setState("done");

    } catch (err: any) {
      setError(err.message || "Eroare neașteptată la import");
      setState("error");
    }
  };

  const handleReset = () => {
    setState("idle");
    setParsed(null);
    setPreview(null);
    setError(null);
    setResult(null);
    setFileName(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const totalNew = (preview?.studentsNew ?? 0) + (preview?.lessonsNew ?? 0) + (preview?.paymentsNew ?? 0);

  return (
    <div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: "none" }} />

      {/* ── IDLE ── */}
      {state === "idle" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 0, marginBottom: 18 }}>
            Importă date dintr-un fișier JSON exportat anterior din TutorTrack.
            Înregistrările existente nu vor fi suprascrise.
          </p>
          <button onClick={() => fileRef.current?.click()} className="tt-btn tt-btn-secondary" style={{ height: 36, gap: 7 }}>
            <IcUpload /> Selectează fișier JSON
          </button>
          <div style={{ marginTop: 14, padding: "12px 14px", background: "var(--bg-page)", borderRadius: "var(--r-md)", border: "0.5px solid var(--border)", fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.6 }}>
            <strong style={{ color: "var(--text-2)" }}>Format acceptat:</strong> fișier <code>.json</code> exportat din TutorTrack
            (conține <code>students</code>, <code>lessons</code>, <code>payments</code>).
          </div>
        </div>
      )}

      {/* ── ANALYZING ── */}
      {state === "analyzing" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 10 }}>
            Se analizează fișierul și se verifică duplicatele...
          </p>
          <div style={{ height: 4, background: "var(--bg-page)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: "60%", background: "var(--accent)", borderRadius: 99, animation: "pulse 1.2s ease-in-out infinite" }} />
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {state === "preview" && preview && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <IcFile />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{fileName}</div>
              {parsed?.exportedAt && (
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  Exportat la {new Date(parsed.exportedAt).toLocaleDateString("ro-RO", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Stats grid — 3 entități × 2 coloane */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Studenți noi",              value: preview.studentsNew,      accent: true  },
              { label: "Studenți existenți (skip)", value: preview.studentsSkipped,  accent: false },
              { label: "Lecții noi",                value: preview.lessonsNew,       accent: true  },
              { label: "Lecții existente (skip)",   value: preview.lessonsSkipped,   accent: false },
              { label: "Plăți noi",                 value: preview.paymentsNew,      accent: true  },
              { label: "Plăți existente (skip)",    value: preview.paymentsSkipped,  accent: false },
            ].map((item) => (
              <div key={item.label} style={{
                padding: "12px 14px",
                background: "var(--bg-page)",
                borderRadius: "var(--r-md)",
                border: "0.5px solid var(--border)",
              }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                  {item.label}
                </div>
                <div className="tt-metric tabular" style={{
                  fontSize: 22,
                  color: item.value > 0 && item.accent ? "var(--accent)" : "var(--text-3)",
                }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {totalNew === 0 ? (
            <div style={{
              padding: "14px 16px", borderRadius: "var(--r-md)",
              background: "var(--warning-soft)",
              border: "0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)",
              fontSize: 13, color: "var(--warning-strong)",
              marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
            }}>
              <IcWarning /> Toate înregistrările există deja în baza de date. Nimic de importat.
            </div>
          ) : (
            <div style={{
              padding: "12px 14px", borderRadius: "var(--r-md)",
              background: "color-mix(in srgb, var(--accent) 8%, transparent)",
              border: "0.5px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              fontSize: 13, color: "var(--text-2)", marginBottom: 16,
            }}>
              Se vor crea{" "}
              {preview.studentsNew > 0 && <><strong style={{ color: "var(--accent)" }}>{preview.studentsNew} studenți</strong>{" "}</>}
              {preview.lessonsNew > 0  && <><strong style={{ color: "var(--accent)" }}>{preview.lessonsNew} lecții</strong>{" "}</>}
              {preview.paymentsNew > 0 && <><strong style={{ color: "var(--accent)" }}>{preview.paymentsNew} plăți</strong></>}
              . Înregistrările existente nu vor fi modificate.
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleReset} className="tt-btn tt-btn-secondary" style={{ height: 38 }}>
              Anulează
            </button>
            {totalNew > 0 && (
              <button onClick={handleImport} className="tt-btn tt-btn-primary" style={{ height: 38, gap: 7 }}>
                <IcUpload /> Importă {totalNew} înregistrări
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── IMPORTING ── */}
      {state === "importing" && (
        <div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
            Se importă... {progressPct}%
          </p>
          <div style={{ height: 6, background: "var(--bg-page)", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: "var(--accent)", borderRadius: 99,
              transition: "width 200ms",
            }} />
          </div>
          <p style={{ fontSize: 12, color: "var(--text-3)" }}>{progress.current}</p>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
            {progress.done} / {progress.total} înregistrări
          </p>
        </div>
      )}

      {/* ── DONE ── */}
      {state === "done" && result && (
        <div>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "16px 18px",
            background: "color-mix(in srgb, var(--success) 10%, transparent)",
            borderRadius: "var(--r-lg)",
            border: "0.5px solid color-mix(in srgb, var(--success) 25%, transparent)",
            marginBottom: 18,
          }}>
            <IcCheck />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                Import finalizat cu succes!
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 4, lineHeight: 1.7 }}>
                {result.studentsCreated > 0 && <div>✓ {result.studentsCreated} studenți importați</div>}
                {result.lessonsCreated  > 0 && <div>✓ {result.lessonsCreated} lecții importate</div>}
                {result.paymentsCreated > 0 && <div>✓ {result.paymentsCreated} plăți importate</div>}
                {result.paymentsSkipped > 0 && <div style={{ color: "var(--warning-strong)" }}>⚠ {result.paymentsSkipped} plăți ignorate (lecție lipsă)</div>}
              </div>

              {/* Erori detaliate — colapsate dacă sunt multe */}
              {result.errors.length > 0 && (
                <details style={{ marginTop: 10 }}>
                  <summary style={{ fontSize: 12, color: "var(--text-3)", cursor: "pointer" }}>
                    {result.errors.length} avertismente
                  </summary>
                  <ul style={{ margin: "8px 0 0", padding: "0 0 0 16px", fontSize: 12, color: "var(--text-3)", lineHeight: 1.7 }}>
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </div>

          <button onClick={handleReset} className="tt-btn tt-btn-secondary" style={{ height: 36 }}>
            Importă alt fișier
          </button>
        </div>
      )}

      {/* ── ERROR ── */}
      {state === "error" && error && (
        <div>
          <div style={{
            padding: "14px 16px", borderRadius: "var(--r-md)",
            background: "var(--danger-soft)",
            border: "0.5px solid color-mix(in srgb, var(--danger) 20%, transparent)",
            fontSize: 13, color: "var(--danger-strong)",
            marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
          }}>
            <IcWarning /> {error}
          </div>
          <button onClick={handleReset} className="tt-btn tt-btn-secondary" style={{ height: 36 }}>
            Încearcă din nou
          </button>
        </div>
      )}
    </div>
  );
}
