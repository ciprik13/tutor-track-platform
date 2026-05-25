import { useSelector } from "react-redux";
import { useState, useEffect } from "react";
import type { RootState } from "@/store";
import { useStudents } from "@/queries/useStudents";
import { useLessons } from "@/queries/useLessons";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const MONTHS_SHORT = ["Ian","Feb","Mar","Apr","Mai","Iun","Iul","Aug","Sep","Oct","Nov","Dec"];

export default function StatisticsPage() {
  const profile = useSelector((s: RootState) => s.profile);
  const theme = useSelector((s: RootState) => s.ui.theme);
  const { data: students = [] } = useStudents();
  const { data: allLessons = [] } = useLessons();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const isDark = theme === "dark";
  const currentYear = new Date().getFullYear();

  const textColor = isDark ? "#6f6a60" : "#8a8479";
  const gridColor = isDark ? "rgba(245,241,233,0.06)" : "rgba(26,24,21,0.06)";
  const tooltipBg = isDark ? "#1c1a17" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(245,241,233,0.12)" : "rgba(26,24,21,0.10)";
  const accentColor = isDark ? "#52ab98" : "#2b6777";
  const accentLight = isDark ? "#3a8a7a" : "#52ab98";

  const yearLessons = (allLessons as any[]).filter((l: any) => l.date.startsWith(String(currentYear)));

  const monthlyData = MONTHS_SHORT.map((month, i) => {
    const ms = `${currentYear}-${String(i + 1).padStart(2, "0")}`;
    const ml = yearLessons.filter((l) => l.date.startsWith(ms));
    const total = ml.reduce((s: number, l: any) => s + Number(l.price), 0);
    const achitat = ml.filter((l: any) => l.isPaid).reduce((s: number, l: any) => s + Number(l.price), 0);
    return { month, total, achitat, neachitat: total - achitat, lectii: ml.length };
  });

  const totalYear = monthlyData.reduce((s, m) => s + m.total, 0);
  const totalAchitat = monthlyData.reduce((s, m) => s + m.achitat, 0);
  const avgMonthly = Math.round(totalYear / 12);
  const bestMonth = monthlyData.reduce((b, m) => (m.total > b.total ? m : b), monthlyData[0]);

  const studentData = [
    { name: "Activi", value: students.filter((s) => s.status === "active").length, color: accentColor },
    { name: "Inactivi", value: students.filter((s) => s.status === "inactive").length, color: isDark ? "#2a2520" : "#e8e5de" },
  ];

  const dur60 = yearLessons.filter((l) => l.durationMinutes === 60).length;
  const dur90 = yearLessons.filter((l) => l.durationMinutes === 90).length;
  const dur120 = yearLessons.filter((l) => l.durationMinutes === 120).length;
  const durationData = [
    { name: "60 min", value: dur60, color: accentColor },
    { name: "90 min", value: dur90, color: accentLight },
    { name: "120 min", value: dur120, color: isDark ? "#2b6777" : "#c8dde4" },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: tooltipBg, border: `0.5px solid ${tooltipBorder}`, borderRadius: 8, padding: "10px 14px", boxShadow: "var(--shadow-pop)" }}>
        <p style={{ fontSize: 11.5, color: textColor, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ fontSize: 13, fontWeight: 500, color: p.color, margin: "2px 0", fontVariantNumeric: "tabular-nums" }}>
            {p.name}: {p.value.toLocaleString()}{p.name !== "lectii" ? ` ${profile.currency}` : ""}
          </p>
        ))}
      </div>
    );
  };

  const kpiCards = [
    { label: "Venit total", value: `${totalYear.toLocaleString()} ${profile.currency}`, sub: `din care ${totalAchitat.toLocaleString()} achitat` },
    { label: "Medie lunară", value: `${avgMonthly.toLocaleString()} ${profile.currency}`, sub: `per lună în ${currentYear}` },
    { label: "Luna cea mai bună", value: bestMonth.total > 0 ? bestMonth.month : "—", sub: bestMonth.total > 0 ? `${bestMonth.total.toLocaleString()} ${profile.currency}` : "nicio lecție încă" },
    { label: "Lecții total", value: yearLessons.length, sub: `în ${currentYear}` },
  ];

  // Donut card component reusable
  const DonutCard = ({ title, data, total }: { title: string; data: typeof studentData; total: number }) => (
    <div className="tt-card" style={{ padding: isMobile ? 16 : 22, display: "flex", alignItems: "center", gap: isMobile ? 16 : 28 }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-1)", marginBottom: 10 }}>
          {title}
        </div>
        <div style={{ position: "relative", width: isMobile ? 100 : 130, height: isMobile ? 100 : 130 }}>
          <ResponsiveContainer width={isMobile ? 100 : 130} height={isMobile ? 100 : 130}>
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={isMobile ? 32 : 42} outerRadius={isMobile ? 50 : 65} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                {data.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <span className="tt-metric" style={{ fontSize: isMobile ? 18 : 22, color: "var(--text-1)" }}>{total}</span>
            <span style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.07em", fontWeight: 600, textTransform: "uppercase", marginTop: 2 }}>TOTAL</span>
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {data.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: isMobile ? 12 : 13, color: "var(--text-2)", flex: 1 }}>{s.name}</span>
              <span className="tabular" style={{ fontSize: isMobile ? 12 : 13, fontWeight: 600, color: "var(--text-1)" }}>
                {s.value}
                {'pct' in s ? <span style={{ color: "var(--text-3)", fontWeight: 400 }}> ({(s as any).pct}%)</span> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const durationDataWithPct = durationData.map(d => ({
    ...d,
    pct: yearLessons.length > 0 ? Math.round((d.value / yearLessons.length) * 100) : 0,
  }));

  const chartHeight = isMobile ? 160 : 210;

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px" : "28px 36px 60px", maxWidth: 1280 }}>
      {/* Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h1 className="tt-page-title">Statistici</h1>
        <p className="tt-page-sub">Anul {currentYear} — privire de ansamblu</p>
      </div>

      {/* KPI cards — 2x2 on mobile, 4x1 on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 10 : 14, marginBottom: 18 }}>
        {kpiCards.map((c) => (
          <div key={c.label} className="tt-card" style={{ padding: isMobile ? 14 : 20 }}>
            <div style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500, marginBottom: 8 }}>{c.label}</div>
            <div className="tt-metric tabular" style={{ fontSize: isMobile ? 18 : 24, color: "var(--text-1)" }}>{c.value}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 5 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 — stacked on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Line chart */}
        <div className="tt-card" style={{ padding: isMobile ? 16 : 22 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
              Venituri lunare {currentYear}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>MDL · total vs. achitat</div>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: isMobile ? -20 : -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 11, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: textColor }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px", color: textColor }} />
              <Line type="monotone" dataKey="total" name="Total" stroke={accentColor} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="achitat" name="achitat" stroke={accentLight} strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar chart */}
        <div className="tt-card" style={{ padding: isMobile ? 16 : 22 }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-1)" }}>
              Lecții per lună
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>Număr de lecții efectuate</div>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: isMobile ? -20 : -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={gridColor} />
              <XAxis dataKey="month" tick={{ fontSize: isMobile ? 10 : 11, fill: textColor }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 11, fill: textColor }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="lectii" name="lectii" fill={accentColor} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 — donut cards, stacked on mobile */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <DonutCard title="Studenți" data={studentData} total={students.length} />
        <DonutCard title="Durată lecții" data={durationDataWithPct} total={yearLessons.length} />
      </div>
    </div>
  );
}
