import { useState, useRef } from "react";
import { studentsApi } from "@/lib/studentsApi";
import { lessonsApi } from "@/lib/lessonsApi";
import { useQueryClient } from "@tanstack/react-query";

const IcUpload = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
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

type ImportState = "idle" | "preview" | "importing" | "done" | "error";

interface ParsedData {
  students: any[];
  lessons: any[];
  exportedAt?: string;
}

interface PreviewStats {
  studentsNew: number;
  studentsSkipped: number;
  lessonsNew: number;
  lessonsSkipped: number;
}

export default function ImportData() {
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const [state, setState] = useState<ImportState>("idle");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [preview, setPreview] = useState<PreviewStats | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ studentsCreated: number; lessonsCreated: number; skipped: number } | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!json.students || !json.lessons) {
        throw new Error("Fișierul nu are structura corectă (lipsesc students sau lessons)");
      }
      if (!Array.isArray(json.students) || !Array.isArray(json.lessons)) {
        throw new Error("students și lessons trebuie să fie array-uri");
      }

      setParsed({ students: json.students, lessons: json.lessons, exportedAt: json.exportedAt });

      setProgress({ done: 0, total: 0, current: "Se verifică datele existente..." });
      setState("importing");

      const [existingStudents, existingLessons] = await Promise.all([
        fetchAllPages(studentsApi.getAll),
        fetchAllPages(lessonsApi.getAll),
      ]);

      const existingStudentIds = new Set(existingStudents.map((s: any) => s.id));
      // Dedup students by name (case-insensitive) — IDs may differ after reimport
      const existingStudentNames = new Set(
        existingStudents.map((s: any) => s.name.toLowerCase().trim())
      );
      const existingLessonIds = new Set(existingLessons.map((l: any) => l.id));
      const existingGcalIds = new Set(
        existingLessons
          .filter((l: any) => l.googleCalendarEventId)
          .map((l: any) => l.googleCalendarEventId)
      );

      const studentsNew = json.students.filter(
        (s: any) =>
          !existingStudentIds.has(s.id) &&
          !existingStudentNames.has(s.name.toLowerCase().trim())
      );
      const studentsSkipped = json.students.length - studentsNew.length;
      const lessonsNew = json.lessons.filter(
        (l: any) =>
          !existingLessonIds.has(l.id) &&
          (!l.googleCalendarEventId || !existingGcalIds.has(l.googleCalendarEventId))
      );
      const lessonsSkipped = json.lessons.length - lessonsNew.length;

      setPreview({ studentsNew: studentsNew.length, studentsSkipped, lessonsNew: lessonsNew.length, lessonsSkipped });
      setParsed({ students: studentsNew, lessons: lessonsNew, exportedAt: json.exportedAt });
      setState("preview");

    } catch (err: any) {
      setError(err.message || "Eroare la citirea fișierului");
      setState("error");
    }
  };

  const handleImport = async () => {
    if (!parsed) return;
    setState("importing");

    const total = parsed.students.length + parsed.lessons.length;
    let done = 0;
    let studentsCreated = 0;
    let lessonsCreated = 0;
    let skipped = 0;

    const studentIdMap: Record<string, string> = {};

    try {
      for (const student of parsed.students) {
        setProgress({ done, total, current: `Student: ${student.name}` });
        try {
          const created = await studentsApi.create({
            name: student.name,
            subject: student.subject,
            grade: student.grade,
            status: student.status ?? "active",
            phone: student.phone,
            email: student.email,
            notes: student.notes,
          });
          studentIdMap[student.id] = created.id;
          studentsCreated++;
        } catch {
          skipped++;
        }
        done++;
        setProgress({ done, total, current: `Student: ${student.name}` });
      }

      for (const lesson of parsed.lessons) {
        const mappedStudentId = studentIdMap[lesson.studentId] ?? lesson.studentId;
        setProgress({ done, total, current: `Lecție: ${lesson.studentNameSnapshot} — ${lesson.date?.slice(0, 10)}` });
        try {
          await lessonsApi.create({
            studentId: mappedStudentId,
            date: lesson.date,
            durationMinutes: lesson.durationMinutes,
            price: Number(lesson.price),
            isPaid: lesson.isPaid ?? false,
            googleCalendarEventId: lesson.googleCalendarEventId,
            notes: lesson.notes,
          });
          lessonsCreated++;
        } catch {
          skipped++;
        }
        done++;
        setProgress({ done, total, current: `Lecție: ${lesson.studentNameSnapshot}` });
      }

      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });

      setResult({ studentsCreated, lessonsCreated, skipped });
      setState("done");

    } catch (err: any) {
      setError(err.message || "Eroare la import");
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

  return (
    <div>
      <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} style={{ display: "none" }} />

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
            <strong style={{ color: "var(--text-2)" }}>Format acceptat:</strong> fișier <code>.json</code> exportat din TutorTrack (conține students, lessons, payments).
            <br />Pe viitor vor fi suportate și alte formate (Excel, CSV).
          </div>
        </div>
      )}

      {state === "importing" && !result && (
        <div>
          <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
            {progress.total === 0 ? progress.current : `Se importă... ${progressPct}%`}
          </p>
          {progress.total > 0 && (
            <>
              <div style={{ height: 6, background: "var(--bg-page)", borderRadius: 99, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "var(--accent)", borderRadius: 99, transition: "width 200ms" }} />
              </div>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>{progress.current}</p>
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>{progress.done} / {progress.total} înregistrări</p>
            </>
          )}
        </div>
      )}

      {state === "preview" && preview && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            <IcFile />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text-1)" }}>{fileName}</div>
              {parsed?.exportedAt && (
                <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                  Exportat la {new Date(parsed.exportedAt).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            {[
              { label: "Studenți noi", value: preview.studentsNew, color: "var(--accent)" },
              { label: "Studenți existenți (skip)", value: preview.studentsSkipped, color: "var(--text-3)" },
              { label: "Lecții noi", value: preview.lessonsNew, color: "var(--accent)" },
              { label: "Lecții existente (skip)", value: preview.lessonsSkipped, color: "var(--text-3)" },
            ].map((item) => (
              <div key={item.label} style={{ padding: "12px 14px", background: "var(--bg-page)", borderRadius: "var(--r-md)", border: "0.5px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>{item.label}</div>
                <div className="tt-metric tabular" style={{ fontSize: 22, color: item.value > 0 ? item.color : "var(--text-3)" }}>{item.value}</div>
              </div>
            ))}
          </div>

          {preview.studentsNew === 0 && preview.lessonsNew === 0 ? (
            <div style={{ padding: "14px 16px", background: "var(--warning-soft)", borderRadius: "var(--r-md)", border: "0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)", fontSize: 13, color: "var(--warning-strong)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <IcWarning /> Toate înregistrările există deja în baza de date. Nimic de importat.
            </div>
          ) : (
            <div style={{ padding: "12px 14px", background: "color-mix(in srgb, var(--accent) 8%, transparent)", borderRadius: "var(--r-md)", border: "0.5px solid color-mix(in srgb, var(--accent) 20%, transparent)", fontSize: 13, color: "var(--text-2)", marginBottom: 16 }}>
              Se vor crea <strong style={{ color: "var(--accent)" }}>{preview.studentsNew} studenți</strong> și <strong style={{ color: "var(--accent)" }}>{preview.lessonsNew} lecții</strong> noi.
              Înregistrările existente nu vor fi modificate.
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleReset} className="tt-btn tt-btn-secondary" style={{ height: 38 }}>Anulează</button>
            {(preview.studentsNew > 0 || preview.lessonsNew > 0) && (
              <button onClick={handleImport} className="tt-btn tt-btn-primary" style={{ height: 38 }}>
                <IcUpload /> Importă {preview.studentsNew + preview.lessonsNew} înregistrări
              </button>
            )}
          </div>
        </div>
      )}

      {state === "done" && result && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 18px", background: "color-mix(in srgb, var(--success) 10%, transparent)", borderRadius: "var(--r-lg)", border: "0.5px solid color-mix(in srgb, var(--success) 25%, transparent)", marginBottom: 18 }}>
            <IcCheck />
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Import finalizat cu succes!</div>
              <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 3 }}>
                {result.studentsCreated} studenți · {result.lessonsCreated} lecții importate
                {result.skipped > 0 && ` · ${result.skipped} erori ignorate`}
              </div>
            </div>
          </div>
          <button onClick={handleReset} className="tt-btn tt-btn-secondary" style={{ height: 36 }}>
            Importă alt fișier
          </button>
        </div>
      )}

      {state === "error" && error && (
        <div>
          <div style={{ padding: "14px 16px", background: "var(--danger-soft)", borderRadius: "var(--r-md)", border: "0.5px solid color-mix(in srgb, var(--danger) 20%, transparent)", fontSize: 13, color: "var(--danger-strong)", marginBottom: 16 }}>
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
