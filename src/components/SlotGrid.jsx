// src/components/SlotGrid.jsx
import { useMemo } from "react";

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
    const set = new Set(busySlots);
    console.log("🔴 [SlotGrid] BusySlots creados:", {
      total: set.size,
      list: Array.from(set)
    });
    return set;
  }, [busySlots]);

  console.log("📋 [SlotGrid] Render con:", {
    slotsCount: slots.length,
    busySlotsCount: busySlots.length,
    slotsPreview: slots.slice(0, 3),
    busySlotsPreview: busySlots.slice(0, 3),
  });

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-black rounded-full" />
        Buscando disponibilidad…
      </div>
    );
  }

  if (!Array.isArray(slots) || slots.length === 0) {
    return (
      <div className="text-gray-500 text-sm p-4 bg-amber-50 border border-amber-200 rounded-xl">
        ⚠️ No hay horarios disponibles para esta fecha/servicio.
      </div>
    );
  }

  const freeCount = slots.filter(slot => !busySlotsSet.has(slot)).length;

  return (
    <div className="space-y-3">
      {/* Leyenda */}
      <div className="flex items-center gap-4 text-xs bg-gray-50 p-2 rounded-lg">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-lg bg-white border-2 border-gray-300"></div>
          <span className="text-gray-700">Disponible ({freeCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-lg bg-red-50 border-2 border-red-200"></div>
          <span className="text-gray-700">Ocupado ({busySlots.length})</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {slots.map((iso) => {
          const isBusy = busySlotsSet.has(iso);
          const isSelected = selected === iso;

          // Debug detallado por cada slot
          if (isBusy) {
            console.log(`  🔴 OCUPADO: ${formatTime(iso)} | iso="${iso}"`);
          }

          return (
            <button
              key={iso}
              onClick={() => {
                console.log(`🖱️ Click: ${formatTime(iso)}, busy=${isBusy}, iso="${iso}"`);
                !isBusy && onSelect?.(iso);
              }}
              disabled={isBusy}
              className={[
                "px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all",
                isBusy
                  ? "bg-red-50 text-red-400 cursor-not-allowed border-red-200 opacity-60"
                  : isSelected
                  ? "bg-black text-white border-black shadow-lg"
                  : "bg-white hover:bg-gray-50 border-gray-300 hover:border-gray-400",
              ].join(" ")}
            >
              <div className="flex flex-col items-center">
                <span className={isBusy ? "line-through" : ""}>{formatTime(iso)}</span>
                {isBusy && (
                  <span className="text-[10px] mt-0.5">ocupado</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}