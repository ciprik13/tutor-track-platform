import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";
import { toLocalISOString } from "@/lib/dateUtils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  includeTime?: boolean;
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
const DAYS = ["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"];

function getTimeSlots() {
  const slots = [];
  for (let h = 6; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

export default function DatePicker({
  value,
  onChange,
  includeTime = false,
  label,
}: Props) {
  const theme = useSelector((state: RootState) => state.ui.theme);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const isDark = theme === "dark";
  const parsed = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(parsed.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed.getMonth());

  const selectedDate = value ? new Date(value) : null;
  const selectedTime = selectedDate
    ? `${String(selectedDate.getHours()).padStart(2, "0")}:${String(selectedDate.getMinutes()).padStart(2, "0")}`
    : "08:00";

  const displayValue = selectedDate
    ? includeTime
      ? `${selectedDate.toLocaleDateString("ro-RO")} ${selectedTime}`
      : selectedDate.toLocaleDateString("ro-RO")
    : "";

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

  useEffect(() => {
    if (open && timeRef.current) {
      const active = timeRef.current.querySelector(
        '[data-active="true"]',
      ) as HTMLElement;
      if (active)
        setTimeout(() => active.scrollIntoView({ block: "center" }), 50);
    }
  }, [open]);

  const handleDayClick = (day: number) => {
    const current = value ? new Date(value) : new Date();
    const newDate = new Date(
      viewYear,
      viewMonth,
      day,
      current.getHours() || 8,
      current.getMinutes() || 0,
    );
    onChange(
      includeTime
        ? toLocalISOString(newDate)
        : toLocalISOString(newDate).slice(0, 10),
    );
  };

  const handleTimeClick = (slot: string) => {
    const [h, m] = slot.split(":").map(Number);
    const current = value ? new Date(value) : new Date();
    current.setHours(h, m, 0, 0);
    onChange(toLocalISOString(current));
    setOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const timeSlots = getTimeSlots();

  const c = {
    bg: "var(--bg-card)",
    bg2: "var(--bg-input)",
    bg3: "var(--bg-card-hover)",
    border: "var(--border)",
    text1: "var(--text-1)",
    text2: "var(--text-2)",
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
            boxShadow: isDark
              ? "0 8px 32px rgba(0,0,0,0.6)"
              : "0 8px 32px rgba(0,0,0,0.15)",
            display: "flex",
            overflow: "hidden",
            alignItems: "flex-start",
          }}
        >
          <div style={{ padding: "16px", width: "260px" }}>
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
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  if (viewMonth === 0) {
                    setViewMonth(11);
                    setViewYear((y) => y - 1);
                  } else setViewMonth((m) => m - 1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.text2,
                  fontSize: "18px",
                  lineHeight: 1,
                  padding: "2px 8px",
                }}
              >
                ‹
              </button>
              <span
                style={{ fontSize: "13px", fontWeight: 600, color: c.text1 }}
              >
                {MONTHS[viewMonth]} {viewYear}
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => {
                  if (viewMonth === 11) {
                    setViewMonth(0);
                    setViewYear((y) => y + 1);
                  } else setViewMonth((m) => m + 1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: c.text2,
                  fontSize: "18px",
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
                gridTemplateColumns: "repeat(7,1fr)",
                gap: "2px",
                marginBottom: "6px",
              }}
            >
              {DAYS.map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: "11px",
                    color: c.text2,
                    padding: "4px 0",
                    fontWeight: 500,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: "2px",
              }}
            >
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const isSelected =
                  selectedDate &&
                  selectedDate.getDate() === day &&
                  selectedDate.getMonth() === viewMonth &&
                  selectedDate.getFullYear() === viewYear;
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === viewMonth &&
                  new Date().getFullYear() === viewYear;
                return (
                  <button
                    key={day}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => handleDayClick(day)}
                    style={{
                      padding: "6px 0",
                      borderRadius: "6px",
                      border: "none",
                      background: isSelected ? "var(--accent)" : "transparent",
                      color: isSelected
                        ? "#ffffff"
                        : isToday
                          ? "var(--accent)"
                          : c.text1,
                      fontSize: "12px",
                      cursor: "pointer",
                      fontWeight: isSelected || isToday ? 600 : 400,
                      textAlign: "center",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = c.bg3;
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {includeTime && (
            <div
              style={{
                width: "90px",
                borderLeft: `1px solid ${c.border}`,
                display: "flex",
                flexDirection: "column",
                height: "320px",
              }}
            >
              <div
                style={{
                  padding: "14px 12px 8px",
                  fontSize: "11px",
                  color: c.text2,
                  fontWeight: 500,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                ORA
              </div>
              <div
                ref={timeRef}
                style={{ overflowY: "auto", flex: 1, padding: "4px 6px 8px" }}
              >
                {timeSlots.map((slot) => {
                  const isActive = slot === selectedTime;
                  return (
                    <button
                      key={slot}
                      type="button"
                      data-active={isActive}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={() => handleTimeClick(slot)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "6px 4px",
                        borderRadius: "6px",
                        border: "none",
                        textAlign: "center",
                        background: isActive ? "var(--accent)" : "transparent",
                        color: isActive ? "#ffffff" : c.text1,
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: isActive ? 600 : 400,
                        marginBottom: "2px",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = c.bg3;
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
          gap: "8px",
          background: c.bg2,
          border: `1px solid ${open ? "var(--accent)" : c.border}`,
          borderRadius: "8px",
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: "13px",
          color: c.text1,
          minHeight: "40px",
          transition: "border-color 0.15s",
        }}
      >
        <span>{displayValue || "Selectează data"}</span>
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
