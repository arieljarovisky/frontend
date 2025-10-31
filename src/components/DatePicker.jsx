// src/components/DatePicker.jsx - Versión mejorada modo oscuro
import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

export default function DatePicker({ value, onChange }) {
  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }, []);

  const maxDate = useMemo(() => {
    const future = new Date();
    future.setDate(future.getDate() + 90);
    return future.toISOString().split('T')[0];
  }, []);

  const handleChange = (e) => {
    const selected = e.target.value;
    
    if (selected < minDate) {
      toast.warning("⚠️ No podés seleccionar fechas pasadas");
      return;
    }
    
    onChange(selected);
  };

  return (
    <div className="relative flex-1">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Calendar className="w-5 h-5 text-slate-500" />
      </div>
      <input
        type="date"
        value={value}
        onChange={handleChange}
        min={minDate}
        max={maxDate}
        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 cursor-pointer hover:border-slate-600/50 transition-all [color-scheme:dark]"
        aria-label="Seleccionar fecha"
      />
    </div>
  );
}