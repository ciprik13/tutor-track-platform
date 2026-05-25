import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { updateProfile, clearProfile } from "@/store/slices/profileSlice";
import { toggleTheme } from "@/store/slices/uiSlice";
import type { RootState, AppDispatch } from "@/store";
import { studentsApi } from "@/lib/studentsApi";
import { lessonsApi } from "@/lib/lessonsApi";
import { paymentsApi } from "@/lib/paymentsApi";
import { googleApi } from "@/lib/googleApi";
import { apiClient } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const IcCheck = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcDownload = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IcTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
const IcEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IcGoogle = () => (
  <svg width="16" height="16" viewBox="0 0 16 16">
    <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.31a3.68 3.68 0 0 1-1.6 2.42v2h2.6c1.52-1.4 2.4-3.46 2.4-5.88z" fill="#4285F4" />
    <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-2.7.75 4.79 4.79 0 0 1-4.5-3.32H.9v2.06A8 8 0 0 0 8 16z" fill="#34A853" />
    <path d="M3.5 9.49a4.83 4.83 0 0 1 0-3.08V4.35H.9a8 8 0 0 0 0 7.2l2.6-2.06z" fill="#FBBC05" />
    <path d="M8 3.18c1.23 0 2.33.42 3.2 1.25l2.4-2.4A8 8 0 0 0 .9 4.35L3.5 6.41A4.79 4.79 0 0 1 8 3.18z" fill="#EA4335" />
  </svg>
);

type Tab = "profile" | "prices" | "integrations" | "data";
const TABS: { key: Tab; label: string }[] = [
  { key: "profile", label: "Profil" },
  { key: "prices", label: "Prețuri" },
  { key: "integrations", label: "Integrări" },
  { key: "data", label: "Date" },
];

function ProfileTab({ isMobile }: { isMobile: boolean }) {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((s: RootState) => s.profile);
  const theme = useSelector((s: RootState) => s.ui.theme);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: profile.name, phone: profile.phone });

  const { data: googleStatus } = useQuery({
    queryKey: ["google-status"],
    queryFn: googleApi.getStatus,
    retry: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch("/auth/me", { name: form.name, phone: form.phone });
      dispatch(updateProfile({ name: form.name, phone: form.phone }));
      setEditing(false);
    } catch {
      alert("Eroare la salvare.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: profile.name, phone: profile.phone });
    setEditing(false);
  };

  const fieldStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: "var(--r-md)",
    background: "var(--bg-input)",
    border: "0.5px solid var(--border)",
    fontSize: 14,
    color: "var(--text-1)",
    minHeight: 42,
    display: "flex",
    alignItems: "center",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-1)" }}>Informații personale</div>
          <div style={{ fontSize: 12.5, color: "var(--text-3)", marginTop: 2 }}>
            {editing ? "Editează datele tale de profil" : "Datele tale de contact și autentificare"}
          </div>
        </div>
        {!editing && (
          <button onClick={() => setEditing(true)} className="tt-btn tt-btn-secondary" style={{ height: 34, gap: 7, fontSize: 13 }}>
            <IcEdit /> Editează
          </button>
        )}
      </div>

      <div className="tt-rule" />

      {/* Fields — 1 col on mobile, 2 col on desktop */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label className="tt-label">Nume complet</label>
          {editing ? (
            <input name="name" value={form.name} onChange={handleChange} className="tt-input" autoFocus />
          ) : (
            <div style={fieldStyle}>{profile.name || "—"}</div>
          )}
        </div>

        <div>
          <label className="tt-label">Email platformă</label>
          <div style={{ ...fieldStyle, color: "var(--text-2)" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile.email}</span>
            <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-3)", fontWeight: 500, flexShrink: 0 }}>(fix)</span>
          </div>
        </div>

        <div>
          <label className="tt-label">Telefon</label>
          {editing ? (
            <input name="phone" value={form.phone} onChange={handleChange} className="tt-input" placeholder="+373 69 000 000" />
          ) : (
            <div style={fieldStyle}>{profile.phone || "—"}</div>
          )}
        </div>

        {googleStatus?.connected && (
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="tt-label">Cont Google conectat</label>
            <div style={{ ...fieldStyle, gap: 10 }}>
              <IcGoogle />
              <span style={{ color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {googleStatus.googleEmail}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)", flexShrink: 0 }}>
                ✓ Conectat
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="tt-rule" />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>
            Temă {theme === "dark" ? "întunecată" : "luminoasă"}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Schimbă aspectul interfeței</div>
        </div>
        <button
          onClick={() => dispatch(toggleTheme())}
          style={{ width: 44, height: 26, borderRadius: 13, border: "none", cursor: "pointer", background: theme === "dark" ? "var(--accent)" : "var(--bg-muted)", position: "relative", transition: "background 200ms", flexShrink: 0 }}
        >
          <div style={{ position: "absolute", top: 3, width: 20, height: 20, borderRadius: 10, background: "white", transition: "transform 200ms", transform: theme === "dark" ? "translateX(21px)" : "translateX(3px)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </button>
      </div>

      {editing && (
        <>
          <div className="tt-rule" />
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleCancel} className="tt-btn tt-btn-secondary" style={{ flex: 1, height: 40, justifyContent: "center" }}>
              Anulează
            </button>
            <button onClick={handleSave} disabled={saving} className="tt-btn tt-btn-primary" style={{ flex: 2, height: 40, justifyContent: "center", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Se salvează..." : "Salvează modificările"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function IntegrationsTab() {
  const queryClient = useQueryClient();

  const { data: googleStatus, isLoading } = useQuery({
    queryKey: ["google-status"],
    queryFn: googleApi.getStatus,
    retry: false,
  });

  const disconnectMutation = useMutation({
    mutationFn: googleApi.disconnect,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["google-status"] }),
  });

  useEffect(() => {
    const hash = window.location.hash;
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const params = new URLSearchParams(queryString);
    const googleResult = params.get("google");
    if (googleResult === "success") {
      queryClient.invalidateQueries({ queryKey: ["google-status"] });
      window.history.replaceState(null, "", window.location.pathname + "#/settings");
    }
  }, []);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (isLoading) return <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-3)", fontSize: 13.5 }}>Se încarcă...</div>;

  const connected = googleStatus?.connected ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ borderRadius: "var(--r-lg)", border: connected ? "1px solid color-mix(in srgb, var(--success) 30%, transparent)" : "0.5px solid var(--border)", background: "var(--bg-input)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 18px", flexWrap: "wrap" }}>
          <div style={{ width: 44, height: 44, borderRadius: "var(--r-md)", background: "white", border: "0.5px solid var(--border)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <IcGoogle />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Google Calendar</span>
              {connected && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 99, background: "color-mix(in srgb, var(--success) 15%, transparent)", color: "var(--success)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  <IcCheck /> Conectat
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {connected ? `Cont conectat: ${googleStatus?.googleEmail}` : "Importă lecțiile programate automat din calendar"}
            </div>
          </div>
          {connected ? (
            <button onClick={() => disconnectMutation.mutate()} disabled={disconnectMutation.isPending} className="tt-btn tt-btn-secondary" style={{ height: 34, fontSize: 13, flexShrink: 0 }}>
              {disconnectMutation.isPending ? "Se deconectează..." : "Deconectează"}
            </button>
          ) : (
            <button onClick={() => googleApi.connect()} className="tt-btn tt-btn-secondary" style={{ height: 34, fontSize: 13, gap: 8, flexShrink: 0 }}>
              <IcGoogle /> Conectează cu Google
            </button>
          )}
        </div>
        {connected && (
          <div style={{ borderTop: "0.5px solid var(--border)", padding: "12px 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Ultima sincronizare</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>
                {googleStatus?.lastSyncedAt ? fmtDate(googleStatus.lastSyncedAt) : "Niciodată"}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Permisiuni</div>
              <div style={{ fontSize: 12.5, color: "var(--text-2)" }}>Citire și creare evenimente</div>
            </div>
          </div>
        )}
      </div>
      {!connected && (
        <div style={{ padding: "14px 16px", background: "var(--bg-input)", borderRadius: "var(--r-md)", border: "0.5px solid var(--border)", fontSize: 13, color: "var(--text-3)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text-2)" }}>Cum funcționează:</strong> După conectare, mergi la pagina{" "}
          <strong style={{ color: "var(--accent)" }}>Lecții</strong> și apasă butonul de import calendar.
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const profile = useSelector((s: RootState) => s.profile);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])

  const location = useLocation();
  const [tab, setTab] = useState<Tab>("profile");
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    defaultPrice60: profile.defaultPrice60,
    defaultPrice90: profile.defaultPrice90,
    defaultPrice120: profile.defaultPrice120,
    currency: profile.currency,
  });

  // Auto-switch to integrations tab if redirected from Google OAuth
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("tab=integrations")) setTab("integrations");
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["defaultPrice60", "defaultPrice90", "defaultPrice120"].includes(name) ? Number(value) : value,
    }));
  };

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

const handleExport = async () => {
  try {
    const [students, lessons, payments] = await Promise.all([
      fetchAllPages(studentsApi.getAll),
      fetchAllPages(lessonsApi.getAll),
      fetchAllPages(paymentsApi.getAll),
    ]);
    const blob = new Blob([JSON.stringify({ profile, students, lessons, payments, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `tutor-track-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error("Export error:", err);
    alert("Export eșuat: " + (err as any)?.message);
  }
};

  const handleClearAll = async () => {
    if (!confirm("Sigur vrei să resetezi sesiunea?")) return;
    dispatch(clearProfile());
    navigate("/login");
  };

  return (
    <div style={{ padding: isMobile ? "20px 16px 60px" : "28px 36px 60px", maxWidth: 1100 }}>
      <div style={{ marginBottom: isMobile ? 16 : 28 }}>
        <h1 className="tt-page-title">Setări</h1>
        <p className="tt-page-sub">Profilul tău, prețuri și integrări</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "200px 1fr", gap: isMobile ? 16 : 28, alignItems: "start" }}>

        {/* Nav — horizontal tabs on mobile, vertical on desktop */}
        <nav style={{
          display: "flex",
          flexDirection: isMobile ? "row" : "column",
          gap: isMobile ? 4 : 1,
          overflowX: isMobile ? "auto" : "visible",
          paddingBottom: isMobile ? 4 : 0,
          borderBottom: isMobile ? "0.5px solid var(--border)" : "none",
        }}>
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: isMobile ? "7px 14px" : "8px 12px",
                borderRadius: 8,
                textAlign: "left",
                fontSize: isMobile ? 13 : 13.5,
                fontWeight: tab === key ? 600 : 500,
                background: tab === key ? "var(--accent-soft)" : "transparent",
                color: tab === key ? "var(--accent)" : "var(--text-2)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--font-text)",
                transition: "all 120ms",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { if (tab !== key) { (e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-1)"; } }}
              onMouseLeave={(e) => { if (tab !== key) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-2)"; } }}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="tt-card" style={{ padding: isMobile ? 18 : 28 }}>
          {tab === "profile" && <ProfileTab isMobile={isMobile} />}

          {tab === "prices" && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 0, marginBottom: 18 }}>
                Prețuri implicite la crearea unei lecții
              </p>
              {/* 1 col on mobile, 3 col on desktop */}
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
                {([60, 90, 120] as const).map((min) => (
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
                      <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "var(--text-3)", fontWeight: 500, pointerEvents: "none" }}>
                        {form.currency}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 18 }}>
                <label className="tt-label">Monedă</label>
                <select name="currency" value={form.currency} onChange={handleChange} className="tt-input" style={{ maxWidth: isMobile ? "100%" : 260 }}>
                  <option value="MDL">MDL — Leu moldovenesc</option>
                  <option value="USD">USD — Dolar american</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
              <div style={{ marginTop: 20 }}>
                <button
                  onClick={(e) => { e.preventDefault(); dispatch(updateProfile(form)); setSaved(true); setTimeout(() => setSaved(false), 2000); }}
                  className="tt-btn tt-btn-primary"
                  style={{ height: 38, width: isMobile ? "100%" : "auto" }}
                >
                  {saved ? <><IcCheck /> Salvat!</> : "Salvează prețurile"}
                </button>
              </div>
            </div>
          )}

          {tab === "integrations" && <IntegrationsTab />}

          {tab === "data" && (
            <div>
              <p style={{ fontSize: 13, color: "var(--text-2)", marginTop: 0, marginBottom: 18 }}>
                Exportă datele tale din baza de date
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" }}>
                <button onClick={handleExport} className="tt-btn tt-btn-secondary" style={{ height: 36, gap: 7 }}>
                  <IcDownload /> Exportă JSON
                </button>
              </div>
              <div style={{ padding: 18, borderRadius: "var(--r-md)", background: "var(--danger-soft)", border: "0.5px solid color-mix(in srgb, var(--danger) 20%, transparent)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--danger)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>
                  Zonă periculoasă
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-1)" }}>Resetează sesiunea</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>Curăță profilul local și mergi la login</div>
                  </div>
                  <button
                    onClick={handleClearAll}
                    style={{ height: 32, padding: "0 14px", borderRadius: "var(--r-md)", background: "var(--danger-soft)", color: "var(--danger-strong)", border: "0.5px solid color-mix(in srgb, var(--danger) 30%, transparent)", fontSize: 12.5, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0, fontFamily: "var(--font-text)", transition: "opacity 120ms" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.75")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
                  >
                    <IcTrash /> Resetează
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