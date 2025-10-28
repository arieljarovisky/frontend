// src/components/SlotGrid.jsx - Versión mejorada modo oscuro
import { useMemo } from "react";
import { Clock, X, Check } from "lucide-react";

function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function SlotGrid({ 
  slots = [], 
  busySlots = [], 
  loading, 
  selected, 
  onSelect 
}) {
  const busySlotsSet = useMemo(() => {
    return new Set(busySlots);
  }, [busySlots]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
          <Clock className="absolute inset-0 m-auto w-6 h-6 text-indigo-400" />
        </div>
        <p className="text-sm text-slate-400">Buscando horarios disponibles...</p>
      </div>
    );
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <div className="p-4 bg-amber-500/10 rounded-full">
          <X className="w-8 h-8 text-amber-400" />
        </div>
        <div className="text-center">
          <p className="text-amber-300 font-medium mb-1">No hay horarios disponibles</p>
          <p className="text-sm text-slate-400">
            Intentá con otra fecha o estilista
          </p>
        </div>
      </div>
    );
  }

  const freeCount = slots.filter(slot => !busySlotsSet.has(slot)).length;

  return (
    <div className="space-y-4">
      {/* Leyenda mejorada */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-slate-800 border-2 border-slate-600"></div>
            <span className="text-sm text-slate-300">Disponible ({freeCount})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-red-500/20 border-2 border-red-500/40"></div>
            <span className="text-sm text-slate-300">Ocupado ({busySlots.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 border-2 border-indigo-400"></div>
            <span className="text-sm text-slate-300">Seleccionado</span>
          </div>
        </div>
        
        <div className="text-xs text-slate-500">
          <Clock className="inline w-3 h-3 mr-1" />
          {slots.length} horarios
        </div>
      </div>

      {/* Grid de horarios mejorado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {slots.map((iso) => {
          const isBusy = busySlotsSet.has(iso);
          const isSelected = selected === iso;

          return (
            <button
              key={iso}
              onClick={() => !isBusy && onSelect?.(iso)}
              disabled={isBusy}
              className={`
                group relative px-4 py-4 rounded-xl font-medium text-sm transition-all duration-200
                ${
                  isBusy
                    ? "bg-red-500/10 text-red-400 cursor-not-allowed border-2 border-red-500/20 opacity-60"
                    : isSelected
                    ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-2 border-indigo-400 shadow-lg shadow-indigo-500/25 scale-105"
                    : "bg-slate-800/50 hover:bg-slate-700/50 border-2 border-slate-700/50 hover:border-slate-600/50 text-slate-300 hover:text-slate-100 hover:shadow-lg hover:scale-105"
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Icono */}
                <div className={`
                  p-2 rounded-lg transition-all
                  ${isBusy 
                    ? 'bg-red-500/10' 
                    : isSelected 
                    ? 'bg-white/20' 
                    : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  }
                `}>
                  {isBusy ? (
                    <X className="w-4 h-4" />
                  ) : isSelected ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                {/* Hora */}
                <span className={`text-base font-bold ${isBusy ? 'line-through' : ''}`}>
                  {formatTime(iso)}
                </span>

                {/* Estado */}
                {isBusy && (
                  <span className="text-[10px] uppercase tracking-wider opacity-75">
                    Ocupado
                  </span>
                )}
                {isSelected && (
                  <span className="text-[10px] uppercase tracking-wider opacity-90">
                    Seleccionado
                  </span>
                )}
              </div>

              {/* Efecto de brillo en hover */}
              {!isBusy && !isSelected && (
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          );
        })}
      </div>

      {/* Mensaje informativo */}
      {freeCount > 0 && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-sm text-indigo-300">
          <strong>✨ Consejo:</strong> Los horarios mostrados son en tiempo real. Si no encontrás el horario ideal, probá con otra fecha o estilista.
        </div>
      )}
    </div>
  );
}