// src/components/SlotGrid.jsx
function formatTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function SlotGrid({ slots = [], loading, selected, onSelect }) {
  if (loading) return <div className="text-sm text-gray-500">Buscando disponibilidad…</div>;
  if (!Array.isArray(slots) || slots.length === 0) {
    return <div className="text-gray-500 text-sm">No hay horarios para esa combinación.</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {slots.map((iso) => {
        const active = selected === iso;
        return (
          <button
            key={iso}
            onClick={() => onSelect?.(iso)}
            className={[
              "px-3 py-2 rounded-xl border text-sm transition",
              active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50 border-gray-300"
            ].join(" ")}
          >
            {formatTime(iso)}
          </button>
        );
      })}
    </div>
  );
}
