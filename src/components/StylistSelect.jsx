// src/components/StylistSelect.jsx - Versión mejorada modo oscuro
import { User } from "lucide-react";

export default function StylistSelect({ stylists, value, onChange }) {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <User className="w-5 h-5 text-slate-500" />
      </div>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 appearance-none cursor-pointer hover:border-slate-600/50 transition-all"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23cbd5e1'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1.25rem',
        }}
      >
        <option value="" disabled>Elegí peluquero/a</option>
        {stylists.map((st) => (
          <option key={st.id} value={st.id}>
            {st.name}
          </option>
        ))}
      </select>
    </div>
  );
}