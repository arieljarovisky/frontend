// src/shared/ui.js

import React from "react";

export function Card({ title, value, hint }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-200 p-5 bg-white flex flex-col gap-1">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-3xl font-semibold">{value}</div>
      {hint ? <div className="text-xs text-gray-400">{hint}</div> : null}
    </div>
  );
}

export function SearchInput({ value, onChange, onSubmit, placeholder = "Buscar…" }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.(value);
      }}
      className="relative"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-black/10"
      />
      <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0013.15 13.15z" />
      </svg>
      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 rounded-lg bg-black text-white">
        Buscar
      </button>
    </form>
  );
}

export function initials(name) {
  const n = String(name || "").trim();
  if (!n) return "?";
  const parts = n.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

export function formatPhone(p) {
  const digits = String(p || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("54")) return `+${digits.slice(0, 2)} ${digits.slice(2)}`;
  return digits;
}

export function formatDateTime(iso) {
  try {
    const d = new Date(iso);
    const f = d.toLocaleDateString("es-AR", { weekday: "short", day: "2-digit", month: "2-digit" });
    const h = d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    return `${f} ${h}`;
  } catch {
    return iso ?? "";
  }
}

export function StatusPill({ status }) {
  const s = String(status || "").toLowerCase();
  let cls = "border-gray-200 text-gray-600 bg-gray-50";
  if (s === "scheduled") cls = "border-emerald-200 text-emerald-700 bg-emerald-50";
  if (s === "cancelled") cls = "border-rose-200 text-rose-700 bg-rose-50";
  if (s === "done") cls = "border-sky-200 text-sky-700 bg-sky-50";
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${cls}`}>{status}</span>;
}
