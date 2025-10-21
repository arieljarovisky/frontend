export default function ServiceSelect({ services, value, onChange }) {
    return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10">
            <option value="" disabled>Seleccioná un servicio</option>
            {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} • {s.duration_min}min • ${Number(s.price_decimal ?? 0).toLocaleString("es-AR")}</option>
            ))}
        </select>
    );
}