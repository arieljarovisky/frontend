// src/components/DatePicker.jsx
import { useMemo } from "react";

export default function DatePicker({ value, onChange }) {
  // Obtener fecha mínima (hoy) en formato YYYY-MM-DD
  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today.toISOString().split('T')[0];
  }, []);

  // Fecha máxima (ej: 90 días adelante)
  const maxDate = useMemo(() => {
    const future = new Date();
    future.setDate(future.getDate() + 90);
    return future.toISOString().split('T')[0];
  }, []);

  const handleChange = (e) => {
    const selected = e.target.value;
    
    // Validar que no sea fecha pasada
    if (selected < minDate) {
      alert("⚠️ No podés seleccionar fechas pasadas");
      return;
    }
    
    onChange(selected);
  };

  return (
    <input
      type="date"
      value={value}
      onChange={handleChange}
      min={minDate}
      max={maxDate}
      className="rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
      aria-label="Seleccionar fecha"
    />
  );
}