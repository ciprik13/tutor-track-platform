import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { toggleSidebar, toggleTheme } from "@/store/slices/uiSlice";
import { getInitials } from "@/lib/dateUtils";
import type { RootState, AppDispatch } from "@/store";

// ── Icons ────────────────────────────────────────────────────
const Ic = {
  Dashboard: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  Students: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Lessons: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  Payments: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  ),
  Reports: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Statistics: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Settings: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  Sun: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  ),
  Moon: () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  ),
  Menu: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Close: () => (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  ChevronsLeft: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

const navItems = [
  { path: "/dashboard", label: "Dashboard", Icon: Ic.Dashboard },
  { path: "/students", label: "Studenți", Icon: Ic.Students },
  { path: "/lessons", label: "Lecții", Icon: Ic.Lessons },
  { path: "/payments", label: "Plăți", Icon: Ic.Payments },
  { path: "/reports", label: "Rapoarte", Icon: Ic.Reports },
  { path: "/statistics", label: "Statistici", Icon: Ic.Statistics },
  { path: "/settings", label: "Setări", Icon: Ic.Settings },
];

// ── Logo components ──────────────────────────────────────────

/**
 * Full logo — shown when sidebar is expanded or in mobile header.
 * logo.png is 677×369 px (landscape). At height:40 it renders ~74×40px,
 * showing the compass icon + "TutorTrack" text in full.
 */
const LogoFull = ({
  height = 40,
  onClick,
}: {
  height?: number;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    style={{
      cursor: onClick ? "pointer" : "default",
      display: "flex",
      alignItems: "center",
    }}
  >
    <img
      src="/logo.png"
      alt="TutorTrack"
      style={{ height, width: "auto", maxWidth: 170, display: "block" }}
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        img.style.display = "none";
        const span = document.createElement("span");
        span.style.cssText = `font-family:var(--font-display);font-weight:700;font-size:15.5px;letter-spacing:-0.025em;color:var(--text-1)`;
        span.textContent = "TutorTrack";
        img.parentElement?.appendChild(span);
      }}
    />
  </div>
);

/**
 * Icon-only mark — shown in the collapsed sidebar (64px wide).
 * logo-icon.png is 615×406 px (ratio ≈ 1.51 : 1, NOT square).
 * We render it at a fixed width so it keeps its natural proportions
 * instead of being squeezed into a 1:1 box.
 */
const LogoMark = ({ onClick }: { onClick?: () => void }) => {
  // Natural render: 46 px wide → height ≈ 30 px (616/406 ≈ 1.52)
  const W = 46;
  return (
    <button
      onClick={onClick}
      title="Extinde bara"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 52,
        height: 44,
        border: "none",
        cursor: onClick ? "pointer" : "default",
        padding: 0,
        background: "transparent",
        flexShrink: 0,
      }}
    >
      <img
        src="/logo-icon.png"
        alt="TutorTrack"
        style={{ width: W, height: "auto", display: "block" }}
        onError={(e) => {
          const img = e.currentTarget as HTMLImageElement;
          img.style.display = "none";
          const el = img.parentElement as HTMLElement;
          el.style.cssText += `;background:var(--accent);color:var(--accent-fg);font-family:var(--font-display);font-weight:700;font-size:13px;letter-spacing:-0.04em;border-radius:9px;width:36px;height:36px`;
          el.textContent = "tt";
        }}
      />
    </button>
  );
};

interface Props {
  children: React.ReactNode;
}

export default function Layout({ children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useSelector((s: RootState) => s.profile);
  const { theme, sidebarOpen } = useSelector((s: RootState) => s.ui);
  const isDark = theme === "dark";

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);

  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [location.pathname, isMobile]);

  const showLabel = sidebarOpen || isMobile;

  // ── Sidebar inner content ────────────────────────────────
  const SidebarContent = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: showLabel ? "space-between" : "center",
          padding: showLabel ? "12px 14px 12px 16px" : "12px 0",
          height: 62,
          flexShrink: 0,
        }}
      >
        {showLabel ? (
          <>
            {/* Full logo — click navigates to dashboard */}
            <LogoFull
              height={36}
              onClick={() => {
                navigate("/dashboard");
                setMobileOpen(false);
              }}
            />

            {/* Collapse / close button */}
            {isMobile ? (
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 7,
                  color: "var(--text-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Ic.Close />
              </button>
            ) : (
              <button
                onClick={() => dispatch(toggleSidebar())}
                title="Restrânge bara"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  color: "var(--text-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 120ms",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-card-hover)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-3)";
                }}
              >
                <Ic.ChevronsLeft />
              </button>
            )}
          </>
        ) : (
          /* Collapsed sidebar — icon-only mark, click to expand */
          <LogoMark onClick={() => dispatch(toggleSidebar())} />
        )}
      </div>

      {/* New lesson CTA */}
      <div style={{ padding: showLabel ? "0 12px 8px" : "0 10px 8px" }}>
        <button
          onClick={() => navigate("/lessons")}
          className="tt-btn tt-btn-primary"
          style={{
            width: "100%",
            height: 34,
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Ic.Plus />
          {showLabel && "Lecție nouă"}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ padding: showLabel ? "2px 10px" : "2px 8px", flex: 1 }}>
        {navItems.map(({ path, label, Icon }) => {
          const isActive =
            location.pathname === path ||
            (path === "/students" && location.pathname.startsWith("/students"));
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              title={!showLabel ? label : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                padding: showLabel ? "8px 10px" : "9px",
                marginBottom: 1,
                borderRadius: 9,
                justifyContent: showLabel ? "flex-start" : "center",
                background: isActive ? "var(--accent-soft)" : "transparent",
                color: isActive ? "var(--accent)" : "var(--text-2)",
                fontSize: 13.5,
                fontWeight: isActive ? 600 : 500,
                letterSpacing: "-0.01em",
                transition: "all 120ms ease",
                cursor: "pointer",
                border: "none",
                fontFamily: "var(--font-text)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--bg-card-hover)";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-1)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--text-2)";
                }
              }}
            >
              <Icon />
              {showLabel && label}
            </button>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div style={{ padding: showLabel ? "0 10px 6px" : "0 8px 6px" }}>
        <button
          onClick={() => dispatch(toggleTheme())}
          title={isDark ? "Mod luminos" : "Mod întunecat"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: showLabel ? "8px 10px" : "9px",
            borderRadius: 9,
            color: "var(--text-2)",
            fontSize: 13.5,
            fontWeight: 500,
            justifyContent: showLabel ? "flex-start" : "center",
            transition: "all 120ms",
            cursor: "pointer",
            border: "none",
            background: "transparent",
            fontFamily: "var(--font-text)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "var(--bg-card-hover)";
            (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
          }}
        >
          {isDark ? <Ic.Sun /> : <Ic.Moon />}
          {showLabel && <span>{isDark ? "Mod luminos" : "Mod întunecat"}</span>}
        </button>
      </div>

      {/* User card */}
      <div
        style={{
          padding: showLabel ? "10px 12px" : "10px 8px",
          borderTop: "0.5px solid var(--border)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: showLabel ? "6px 8px" : 0,
            borderRadius: 10,
            justifyContent: showLabel ? "flex-start" : "center",
          }}
        >
          <div
            className="tt-avatar"
            style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0 }}
          >
            {getInitials(profile.name || "T")}
          </div>
          {showLabel && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: "var(--text-1)",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {profile.name || "Tutor"}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-3)",
                  marginTop: 1,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {profile.email || ""}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg-page)",
      }}
    >
      {/* ── Mobile top bar ── */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            background: "var(--bg-card)",
            borderBottom: "0.5px solid var(--border)",
            height: 54,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 14px",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              color: "var(--text-1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ic.Menu />
          </button>

          {/* Logo in mobile topbar — fixed height, click → dashboard */}
          <LogoFull height={28} onClick={() => navigate("/dashboard")} />

          <button
            onClick={() => dispatch(toggleTheme())}
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              color: "var(--text-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDark ? <Ic.Sun /> : <Ic.Moon />}
          </button>
        </div>
      )}

      {/* ── Mobile overlay ── */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--bg-overlay)",
            zIndex: 150,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && (
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 200,
            width: 260,
            background: "var(--bg-card)",
            borderRight: "0.5px solid var(--border)",
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 240ms cubic-bezier(.2,.7,.3,1)",
            boxShadow: mobileOpen ? "var(--shadow-modal)" : "none",
          }}
        >
          <SidebarContent />
        </aside>
      )}

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <aside
          style={{
            width: sidebarOpen ? 220 : 64,
            height: "100vh",
            background: "var(--bg-card)",
            borderRight: "0.5px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            transition: "width 200ms ease",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <SidebarContent />
        </aside>
      )}

      {/* ── Main content ── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          height: "100vh",
          background: "var(--bg-page)",
          paddingTop: isMobile ? 54 : 0,
        }}
      >
        {children}
      </main>
    </div>
  );
}
