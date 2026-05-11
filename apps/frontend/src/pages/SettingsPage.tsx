import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, clearProfile } from "@/store/slices/profileSlice";
import { toggleTheme } from "@/store/slices/uiSlice";
import type { RootState, AppDispatch } from "@/store";
import { useNavigate } from "react-router-dom";
import db from "@/db";
import { requestCalendarToken } from "@/lib/oauth";

// ── Icons ────────────────────────────────────────────────────
const IcGoogle = () => (
  <svg width="15" height="15" viewBox="0 0 16 16">
    <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.31a3.68 3.68 0 0 1-1.6 2.42v2h2.6c1.52-1.4 2.4-3.46 2.4-5.88z" fill="#4285F4"/>
    <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-2.7.75 4.79 4.79 0 0 1-4.5-3.32H.9v2.06A8 8 0 0 0 8 16z" fill="#34A853"/>
    <path d="M3.5 9.49a4.83 4.83 0 0 1 0-3.08V4.35H.9a8 8 0 0 0 0 7.2l2.6-2.06z" fill="#FBBC05"/>
    <path d="M8 3.18c1.23 0 2.33.42 3.2 1.25l2.4-2.4A8 8 0 0 0 .9 4.35L3.5 6.41A4.79 4.79 0 0 1 8 3.18z" fill="#EA4335"/>
  </svg>
)
const IcCalendar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IcDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)
const IcUpload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
)
const IcTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
  </svg>
)

type Tab = "profile" | "prices" | "integrations" | "data";

const TABS: { key: Tab; label: string }[] = [
  { key: "profile",      label: "Profil"     },
  { key: "prices",       label: "Prețuri"    },
  { key: "integrations", label: "Integrări"  },
  { key: "data",         label: "Date"       },
];

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const profile  = useSelector((s: RootState) => s.profile);
  const theme    = useSelector((s: RootState) => s.ui.theme);

  const [tab, setTab]       = useState<Tab>("profile");
  const [connecting, setConnecting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    name:            profile.name,
    email:           profile.email,
    phone:           profile.phone,
    defaultPrice60:  profile.defaultPrice60,
    defaultPrice90:  profile.defaultPrice90,
    defaultPrice120: profile.defaultPrice120,
    currency:        profile.currency,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: ["defaultPrice60","defaultPrice90","defaultPrice120"].includes(name)
        ? Number(value) : value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(updateProfile(form));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = async () => {
    const [students, lessons, payments] = await Promise.all([
      db.students.toArray(), db.lessons.toArray(), db.payments.toArray(),
    ]);
    const blob = new Blob(
      [JSON.stringify({ profile, students, lessons, payments, exportedAt: new Date().toISOString() }, null, 2)],
      { type: "application/json" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tutor-track-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.students) await db.students.bulkPut(data.students);
        if (data.lessons)  await db.lessons.bulkPut(data.lessons);
        if (data.payments) await db.payments.bulkPut(data.payments);
        if (data.profile)  dispatch(updateProfile(data.profile));
        alert("Date importate cu succes!");
      } catch { alert("Fișier invalid!"); }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    if (!confirm("Sigur vrei să ștergi TOATE datele? Această acțiune nu poate fi anulată!")) return;
    if (!confirm("Ești absolut sigur? Toate lecțiile, studenții și plățile vor fi șterse!")) return;
    await db.students.clear(); await db.lessons.clear(); await db.payments.clear();
    dispatch(clearProfile()); navigate("/onboarding");
  };

  return (
    <div style={{ padding: "28px 36px 60px", maxWidth: 1100 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="tt-page-title">Setări</h1>
        <p className="tt-page-sub">Profilul tău, prețuri și integrări</p>
      </div>

      {/* Two-column layout: nav + content */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, alignItems: "start" }}>

        {/* ── Left tab nav ── */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                textAlign: "left",
                fontSize: 13.5,
                fontWeight: tab === key ? 600 : 500,
                background: tab === key ? "var(--accent-soft)" : "transparent",
                color: tab === key ? "var(--accent)" : "var(--text-2)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-text)",
                transition: "all 120ms",
              }}
              onMouseEnter={e => { if (tab !== key) { (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)" } }}
              onMouseLeave={e => { if (tab !== key) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)" } }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* ── Right content panel ── */}
        <div className="tt-card" style={{ padding: 28 }}>

          {/* ── Profil ── */}
          {tab === "profile" && (
            <form onSubmit={handleSave} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="tt-label">Nume complet</label>
                <input name="name" value={form.name} onChange={handleChange} className="tt-input" />
              </div>
              <div>
                <label className="tt-label">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="tt-input" />
              </div>
              <div>
                <label className="tt-label">Telefon</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="tt-input" />
              </div>
              <div style={{ gridColumn: "1 / -1", paddingTop: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button type="submit" className="tt-btn tt-btn-primary" style={{ height: 38 }}>
                  {saved ? <><IcCheck /> Salvat!</> : "Salvează modificările"}
                </button>

                {/* Theme toggle — inline in Profile tab */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 13, color: "var(--text-2)" }}>
                    Temă {theme === "dark" ? "întunecată" : "luminoasă"}
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch(toggleTheme())}
                    style={{
                      width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                      background: theme === "dark" ? "var(--accent)" : "var(--bg-muted)",
                      position: "relative", transition: "background 200ms", flexShrink: 0,
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 2,
                      width: 20, height: 20, borderRadius: 10, background: "white",
                      transition: "transform 200ms",
                      transform: theme === "dark" ? "translateX(20px)" : "translateX(2px)",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }} />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ── Prețuri ── */}
          {tab === "prices" && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 0, marginBottom: 18 }}>
                Prețuri implicite la crearea unei lecții
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                {([60, 90, 120] as const).map(min => (
                  <div key={min}>
                    <label className="tt-label">{min} minute</label>
                    <div style={{ position: "relative" }}>
                      <input
                        name={`defaultPrice${min}`}
                        type="number"
                        value={form[`defaultPrice${min}` as keyof typeof form]}
                        onChange={handleChange}
                        className="tt-input tabular"
                        style={{ paddingRight: 50 }}
                      />
                      <span style={{
                        position: "absolute", right: 12, top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 12, color: "var(--text-3)", fontWeight: 500,
                        pointerEvents: "none",
                      }}>
                        {form.currency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18 }}>
                <label className="tt-label">Monedă</label>
                <select
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                  className="tt-input"
                  style={{ maxWidth: 260 }}
                >
                  <option value="MDL">MDL — Leu moldovenesc</option>
                  <option value="USD">USD — Dolar american</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={e => { e.preventDefault(); dispatch(updateProfile(form)); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                  className="tt-btn tt-btn-primary"
                  style={{ height: 38 }}
                >
                  {saved ? <><IcCheck /> Salvat!</> : "Salvează prețurile"}
                </button>
              </div>
            </div>
          )}

          {/* ── Integrări ── */}
          {tab === "integrations" && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: 16,
                background: "var(--bg-input)",
                borderRadius: "var(--r-md)",
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "var(--r-md)",
                  background: "var(--bg-card)",
                  border: "0.5px solid var(--border)",
                  display: "grid", placeItems: "center",
                  color: "var(--accent)", flexShrink: 0,
                }}>
                  <IcCalendar />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>
                    Google Calendar
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
                    {profile.googleCalendarConnected
                      ? "Poți importa lecții din calendar la pagina Lecții"
                      : "Importă lecțiile programate automat"}
                  </div>
                </div>
                {profile.googleCalendarConnected ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <span className="tt-pill tt-pill-active"><IcCheck /> Conectat</span>
                    <button
                      onClick={() => dispatch(updateProfile({ googleCalendarToken: null, googleCalendarConnected: false }))}
                      className="tt-btn tt-btn-secondary"
                      style={{ height: 32, fontSize: 12.5 }}
                    >Deconectează</button>
                  </div>
                ) : (
                  <button
                    disabled={connecting}
                    onClick={async () => {
                      setConnecting(true);
                      try {
                        const token = await requestCalendarToken();
                        dispatch(updateProfile({ googleCalendarToken: token, googleCalendarConnected: true }));
                      } catch (err) {
                        console.error("Google auth error:", err);
                        alert("Conectare eșuată. Încearcă din nou.");
                      } finally {
                        setConnecting(false);
                      }
                    }}
                    className="tt-btn tt-btn-secondary"
                    style={{ height: 36, gap: 8, flexShrink: 0, opacity: connecting ? 0.6 : 1 }}
                  >
                    <IcGoogle /> {connecting ? "Se conectează..." : "Conectează"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── Date ── */}
          {tab === "data" && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 0, marginBottom: 18 }}>
                Datele sunt salvate local pe acest dispozitiv (IndexedDB)
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 32 }}>
                <button onClick={handleExport} className="tt-btn tt-btn-secondary" style={{ height: 36, gap: 7 }}>
                  <IcDownload /> Exportă JSON
                </button>
                <label className="tt-btn tt-btn-secondary" style={{ height: 36, gap: 7, cursor: "pointer" }}>
                  <IcUpload /> Importă
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
                </label>
              </div>

              {/* Danger zone */}
              <div style={{
                padding: 18, borderRadius: "var(--r-md)",
                background: "var(--danger-soft)",
                border: "0.5px solid color-mix(in srgb, var(--danger) 20%, transparent)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Zonă periculoasă
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>Șterge toate datele</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Acțiune ireversibilă — șterge tot</div>
                  </div>
                  <button
                    onClick={handleClearAll}
                    style={{
                      height: 32, padding: "0 14px", borderRadius: "var(--r-md)",
                      background: "var(--danger-soft)", color: "var(--danger-strong)",
                      border: "0.5px solid color-mix(in srgb, var(--danger) 30%, transparent)",
                      fontSize: 12.5, fontWeight: 500, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      flexShrink: 0, fontFamily: "var(--font-text)",
                      transition: "opacity 120ms",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.75"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
                  >
                    <IcTrash /> Șterge tot
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
