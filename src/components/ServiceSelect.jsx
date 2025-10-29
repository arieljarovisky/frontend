export default function ServiceSelect({ services, value, onChange }) {
    return (
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full pl-4  rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50  cursor-pointer hover:border-slate-600/50 transition-all">
            <option value="" disabled>Seleccioná un servicio</option>
            {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} • {s.duration_min}min • ${Number(s.price_decimal ?? 0).toLocaleString("es-AR")}</option>
            ))}
        </select>
    );
}