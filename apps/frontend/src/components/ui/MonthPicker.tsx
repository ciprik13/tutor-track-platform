import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const MONTHS = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

export default function MonthPicker({ value, onChange, label }: Props) {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const isDark = theme === "dark";
  const currentYear = value
    ? parseInt(value.slice(0, 4))
    : new Date().getFullYear();
  const currentMonth = value
    ? parseInt(value.slice(5, 7)) - 1
    : new Date().getMonth();
  const [year, setYear] = useState(currentYear);

  const displayValue = value
    ? `${MONTHS[currentMonth]} ${currentYear}`
    : "Selectează luna";

  const c = {
    bg: "var(--bg-card)",
    bg2: "var(--bg-input)",
    bg3: "var(--bg-card-hover)",
    border: "var(--border)",
    text1: "var(--text-1)",
    text2: "var(--text-2)",
  };

  const openPicker = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
      });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (monthIndex: number) => {
    const m = String(monthIndex + 1).padStart(2, "0");
    onChange(`${year}-${m}`);
    setOpen(false);
  };

  const picker = open
    ? createPortal(
        <div
          ref={pickerRef}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: c.bg,
            border: `1px solid ${c.border}`,
            borderRadius: "12px",
            padding: "16px",
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.6)"
              : "0 8px 32px rgba(0,0,0,0.15)",
            minWidth: "240px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <button
              type="button"
              onClick={() => setYear((y) => y - 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: c.text2,
                fontSize: "20px",
                lineHeight: 1,
                padding: "2px 8px",
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: "14px", fontWeight: 600, color: c.text1 }}>
              {year}
            </span>
            <button
              type="button"
              onClick={() => setYear((y) => y + 1)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: c.text2,
                fontSize: "20px",
                lineHeight: 1,
                padding: "2px 8px",
              }}
            >
              ›
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: "6px",
            }}
          >
            {MONTHS.map((month, i) => {
              const isSelected =
                value &&
                parseInt(value.slice(0, 4)) === year &&
                parseInt(value.slice(5, 7)) - 1 === i;
              const isCurrentMonth =
                new Date().getFullYear() === year &&
                new Date().getMonth() === i;
              return (
                <button
                  key={month}
                  type="button"
                  onClick={() => handleSelect(i)}
                  style={{
                    padding: "9px 4px",
                    borderRadius: "8px",
                    border: "none",
                    background: isSelected
                      ? "var(--accent)"
                      : isCurrentMonth
                        ? c.bg3
                        : c.bg2,
                    color: isSelected
                      ? "#ffffff"
                      : isCurrentMonth
                        ? "var(--accent)"
                        : c.text1,
                    fontSize: "12px",
                    fontWeight: isSelected ? 600 : 400,
                    cursor: "pointer",
                    transition: "all 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = c.bg3;
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = isCurrentMonth
                        ? c.bg3
                        : c.bg2;
                  }}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={triggerRef} style={{ position: "relative" }}>
      {label && (
        <label
          style={{
            display: "block",
            fontSize: "13px",
            color: c.text2,
            marginBottom: "6px",
          }}
        >
          {label}
        </label>
      )}
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
          openPicker();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: c.bg2,
          border: `1px solid ${open ? "var(--accent)" : c.border}`,
          borderRadius: "8px",
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: "13px",
          color: c.text1,
          minHeight: "40px",
          transition: "border-color 0.15s",
          gap: "8px",
        }}
      >
        <span>{displayValue}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="1" y="2" width="12" height="11" rx="1.5" />
          <path d="M4 1v2M10 1v2M1 5.5h12" />
        </svg>
      </div>
      {picker}
    </div>
  );
}
