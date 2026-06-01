import { useState, useEffect } from "react";
import { useStudents } from "@/queries/useStudents";
import { getInitials } from "@/lib/dateUtils";
import { useLessons, useUpdateLesson } from "@/queries/useLessons";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import type { RootState } from "@/store";
import { useNavigate } from "react-router-dom";
import MonthPicker from "@/components/ui/MonthPicker";
import { useCreateBulkPayment } from "@/queries/usePayments";

interface MonthSummary {
  studentId: string;
  studentName: string;
  month: string;
  monthLabel: string;
  total: number;
  unpaidAmount: number;
  lessonCount: number;
  paidCount: number;
  unpaidCount: number;
  status: "paid" | "unpaid" | "partial";
}

const IcCheck = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcUndo = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 .49-3.42" />
  </svg>
);

const COL = "2fr 1fr 60px 1fr 120px 185px";

export default function PaymentsPage() {
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);
  const queryClient = useQueryClient();
  const updateLesson = useUpdateLesson();
  const createBulkPayment = useCreateBulkPayment();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  const [monthFilter, setMonthFilter] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "unpaid" | "partial"
  >("all");

  const { data: students = [] } = useStudents();
  const { data: allLessons = [] } = useLessons();

  const summaries: MonthSummary[] = [];
  (students as any[]).forEach((student) => {
    const sl = (allLessons as any[]).filter((l) => l.studentId === student.id);
    const months = [
      ...new Set(sl.map((l: any) => l.date.slice(0, 7))),
    ] as string[];
    months.forEach((month) => {
      const ml = sl.filter((l: any) => l.date.startsWith(month));
      if (!ml.length) return;
      const total = ml.reduce((s: number, l: any) => s + Number(l.price), 0);
      const paidCount = ml.filter((l: any) => l.isPaid).length;
      const unpaidCount = ml.filter((l: any) => !l.isPaid).length;
      const unpaidAmount = ml
        .filter((l: any) => !l.isPaid)
        .reduce((s: number, l: any) => s + Number(l.price), 0);
      const status: MonthSummary["status"] =
        paidCount === ml.length
          ? "paid"
          : unpaidCount === ml.length
            ? "unpaid"
            : "partial";
      summaries.push({
        studentId: student.id,
        studentName: student.name,
        month,
        monthLabel: new Date(month + "-01").toLocaleDateString("ro-RO", {
          month: "long",
          year: "numeric",
        }),
        total,
        unpaidAmount,
        lessonCount: ml.length,
        paidCount,
        unpaidCount,
        status,
      });
    });
  });
  summaries.sort((a, b) => b.month.localeCompare(a.month));

  const filtered = summaries.filter((s) => {
    if (monthFilter && !s.month.startsWith(monthFilter)) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const totalUnpaid = summaries
    .filter((s) => s.status !== "paid")
    .reduce((sum, s) => sum + s.unpaidAmount, 0);
  const monthUnpaid = summaries
    .filter((s) => s.month.startsWith(monthFilter) && s.status !== "paid")
    .reduce((sum, s) => sum + s.unpaidAmount, 0);
  const monthLabel = monthFilter
    ? new Date(monthFilter + "-01").toLocaleDateString("ro-RO", {
        month: "long",
        year: "numeric",
      })
    : "";

  const handleMarkAllPaid = async (sm: MonthSummary) => {
    const ml = (allLessons as any[]).filter(
      (l) =>
        l.studentId === sm.studentId &&
        l.date.startsWith(sm.month) &&
        !l.isPaid,
    );
    if (!ml.length) return;
    await createBulkPayment.mutateAsync({
      studentId: sm.studentId,
      month: sm.month,
      lessonIds: ml.map((l: any) => l.id),
    });
    queryClient.invalidateQueries({ queryKey: ["lessons"] });
  };

  const handleMarkAllUnpaid = async (sm: MonthSummary) => {
    const ml = (allLessons as any[]).filter(
      (l) =>
        l.studentId === sm.studentId && l.date.startsWith(sm.month) && l.isPaid,
    );
    await Promise.all(
      ml.map((l: any) => updateLesson.mutateAsync({ id: l.id, isPaid: false })),
    );
    queryClient.invalidateQueries({ queryKey: ["lessons"] });
  };

  return (
    <div
      style={{
        padding: isMobile ? "20px 16px 60px" : "28px 36px 60px",
        maxWidth: 1280,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 className="tt-page-title">Plăți</h1>
        <p className="tt-page-sub">Sumar automat per student per lună</p>
      </div>

      {/* Summary cards */}
      <div
        style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}
      >
        {monthUnpaid > 0 && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "var(--r-lg)",
              background: "var(--bg-card)",
              border: "0.5px solid var(--border)",
              flex: isMobile ? "1" : "0 0 auto",
              minWidth: isMobile ? 0 : "auto",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "capitalize",
              }}
            >
              {monthLabel}
            </div>
            <div
              className="tt-metric tabular"
              style={{
                fontSize: isMobile ? 22 : 28,
                color: "var(--text-1)",
                marginTop: 4,
              }}
            >
              {monthUnpaid.toLocaleString()} {profile.currency}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 3 }}>
              de încasat luna aceasta
            </div>
          </div>
        )}
        {totalUnpaid > 0 && (
          <div
            style={{
              padding: "14px 18px",
              borderRadius: "var(--r-lg)",
              background: "var(--warning-soft)",
              border:
                "0.5px solid color-mix(in srgb, var(--warning) 25%, transparent)",
              flex: isMobile ? "1" : "0 0 auto",
              minWidth: isMobile ? 0 : "auto",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--warning-strong)",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Total de încasat
            </div>
            <div
              className="tt-metric tabular"
              style={{
                fontSize: isMobile ? 22 : 28,
                color: "var(--warning-strong)",
                marginTop: 4,
              }}
            >
              {totalUnpaid.toLocaleString()} {profile.currency}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--warning-strong)",
                marginTop: 3,
                opacity: 0.7,
              }}
            >
              toate lunile neachitate
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <MonthPicker value={monthFilter} onChange={setMonthFilter} />
        <div className="tt-filter-row">
          {(
            [
              ["all", "Toate"],
              ["unpaid", "Neachitate"],
              ["partial", "Parțiale"],
              ["paid", "Achitate"],
            ] as const
          ).map(([k, lbl]) => (
            <button
              key={k}
              onClick={() => setStatusFilter(k)}
              className={`tt-filter-btn ${statusFilter === k ? "active" : ""}`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", paddingTop: 64 }}>
          <p style={{ color: "var(--text-3)", fontSize: 14 }}>
            Nicio plată găsită
          </p>
          <p style={{ color: "var(--text-3)", fontSize: 12.5, marginTop: 6 }}>
            Adaugă lecții pentru a vedea sumarul plăților
          </p>
        </div>
      ) : isMobile ? (
        /* ── Mobile: card list ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((sm) => (
            <div
              key={`${sm.studentId}-${sm.month}`}
              className="tt-card"
              style={{ padding: 16 }}
            >
              {/* Row 1: avatar + name + month */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div
                  className="tt-avatar"
                  style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}
                  onClick={() => navigate(`/students/${sm.studentId}`)}
                >
                  {getInitials(sm.studentName)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "var(--text-1)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => navigate(`/students/${sm.studentId}`)}
                  >
                    {sm.studentName}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-3)",
                      marginTop: 1,
                      textTransform: "capitalize",
                    }}
                  >
                    {sm.monthLabel}
                  </div>
                </div>
                <span
                  className={`tt-pill ${sm.status === "paid" ? "tt-pill-paid" : sm.status === "partial" ? "tt-pill-partial" : "tt-pill-unpaid"}`}
                >
                  <span
                    className={`tt-dot ${sm.status === "paid" ? "tt-dot-paid" : "tt-dot-unpaid"}`}
                  />
                  {sm.status === "paid"
                    ? "Achitat"
                    : sm.status === "partial"
                      ? "Parțial"
                      : "Neachitat"}
                </span>
              </div>

              {/* Row 2: stats */}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 12,
                  paddingBottom: 12,
                  borderBottom: "0.5px solid var(--border)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Lecții
                  </div>
                  <div
                    className="tabular"
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-1)",
                      marginTop: 2,
                    }}
                  >
                    {sm.lessonCount}
                  </div>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Total
                  </div>
                  <div
                    className="tabular"
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--text-1)",
                      marginTop: 2,
                    }}
                  >
                    {sm.total.toLocaleString()} {profile.currency}
                  </div>
                </div>
                {sm.status === "partial" && (
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--warning-strong)",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Neachitat
                    </div>
                    <div
                      className="tabular"
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "var(--warning-strong)",
                        marginTop: 2,
                      }}
                    >
                      {sm.unpaidAmount.toLocaleString()} {profile.currency}
                    </div>
                  </div>
                )}
              </div>

              {/* Row 3: actions */}
              <div style={{ display: "flex", gap: 8 }}>
                {sm.status !== "paid" && (
                  <button
                    onClick={() => handleMarkAllPaid(sm)}
                    className="tt-btn tt-btn-primary"
                    style={{
                      flex: 1,
                      height: 36,
                      fontSize: 13,
                      justifyContent: "center",
                    }}
                  >
                    <IcCheck /> Marchează achitat
                  </button>
                )}
                {sm.status !== "unpaid" && (
                  <button
                    onClick={() => handleMarkAllUnpaid(sm)}
                    className="tt-btn tt-btn-secondary"
                    style={{ height: 36, fontSize: 13 }}
                  >
                    <IcUndo /> Anulează
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── Desktop: table ── */
        <div className="tt-card" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: COL,
              padding: "10px 20px",
              borderBottom: "0.5px solid var(--border)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.05em",
              color: "var(--text-3)",
              textTransform: "uppercase",
              gap: 12,
            }}
          >
            <div>Student</div>
            <div>Luna</div>
            <div>Lecții</div>
            <div>Total</div>
            <div>Status</div>
            <div />
          </div>
          {filtered.map((sm, idx) => (
            <div
              key={`${sm.studentId}-${sm.month}`}
              style={{
                display: "grid",
                gridTemplateColumns: COL,
                alignItems: "center",
                gap: 12,
                padding: "13px 20px",
                borderBottom:
                  idx < filtered.length - 1
                    ? "0.5px solid var(--border)"
                    : "none",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "var(--bg-card-hover)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "transparent")
              }
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  minWidth: 0,
                }}
                onClick={() => navigate(`/students/${sm.studentId}`)}
              >
                <div
                  className="tt-avatar"
                  style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}
                >
                  {getInitials(sm.studentName)}
                </div>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--text-1)",
                    letterSpacing: "-0.01em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {sm.studentName}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  textTransform: "capitalize",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {sm.monthLabel}
              </div>
              <div
                className="tabular"
                style={{ fontSize: 13.5, color: "var(--text-1)" }}
              >
                {sm.lessonCount}
              </div>
              <div>
                <div
                  className="tabular"
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--text-1)",
                  }}
                >
                  {sm.total.toLocaleString()} {profile.currency}
                </div>
                {sm.status === "partial" && (
                  <div
                    className="tabular"
                    style={{
                      fontSize: 11.5,
                      color: "var(--warning-strong)",
                      marginTop: 2,
                    }}
                  >
                    {sm.unpaidAmount.toLocaleString()} neachitat
                  </div>
                )}
              </div>
              <div>
                <span
                  className={`tt-pill ${sm.status === "paid" ? "tt-pill-paid" : sm.status === "partial" ? "tt-pill-partial" : "tt-pill-unpaid"}`}
                >
                  <span
                    className={`tt-dot ${sm.status === "paid" ? "tt-dot-paid" : "tt-dot-unpaid"}`}
                  />
                  {sm.status === "paid"
                    ? "Achitat"
                    : sm.status === "partial"
                      ? "Parțial"
                      : "Neachitat"}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  justifyContent: "flex-end",
                  flexWrap: "nowrap",
                }}
              >
                {sm.status !== "paid" && (
                  <button
                    onClick={() => handleMarkAllPaid(sm)}
                    className="tt-btn tt-btn-primary"
                    style={{
                      height: 30,
                      fontSize: 12,
                      gap: 5,
                      padding: "0 11px",
                      flexShrink: 0,
                    }}
                  >
                    <IcCheck /> Achitat
                  </button>
                )}
                {sm.status !== "unpaid" && (
                  <button
                    onClick={() => handleMarkAllUnpaid(sm)}
                    className="tt-btn tt-btn-secondary"
                    style={{
                      height: 30,
                      fontSize: 12,
                      gap: 5,
                      padding: "0 11px",
                      flexShrink: 0,
                    }}
                  >
                    <IcUndo /> Anulează
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
