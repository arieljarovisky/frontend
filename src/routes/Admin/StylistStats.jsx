// src/routes/StylistStatsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { TrendingUp, Scissors, Coins, PiggyBank, Download, Calendar, Loader2, AlertTriangle } from "lucide-react";

const fmtMoney = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 })
    .format(Number(n || 0));

const KPI = ({ icon: Icon, label, value, sublabel }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:-translate-y-0.5 hover:shadow-xl">
    <div className="absolute inset-0 bg-[radial-gradient(25rem_15rem_at_120%_-20%,rgba(99,102,241,.15),transparent_60%)] pointer-events-none" />
    <div className="flex items-center gap-3">
      <div className="rounded-xl p-2.5 bg-white/10 backdrop-blur-sm">
        <Icon className="size-5" />
      </div>
      <div className="text-sm text-zinc-400">{label}</div>
    </div>
    <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    {sublabel ? <div className="mt-1 text-xs text-zinc-500">{sublabel}</div> : null}
  </div>
);

const Btn = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm hover:bg-white/10 active:scale-[.99] transition ${className}`}
  >
    {children}
  </button>
);

export default function StylistStatsPage() {
  const [stylists, setStylists] = useState([]);
  const [selected, setSelected] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Últimos 30 días por defecto
  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Cargar peluqueros + % de comisión (GET /api/stylist-commission)
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/stylist-commission", { credentials: "include" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        setStylists(data || []);
        if (data?.length && !selected) setSelected(String(data[0].id));
      } catch (e) {
        setErr("No pude traer la lista de peluqueros.");
        console.error(e);
      }
    })();
    // eslint-disable-next-line
  }, []);

  // Cargar stats (GET /api/stats/:stylistId?from&to)
  const loadStats = async () => {
    if (!selected) return;
    setLoading(true);
    setErr("");
    try {
      const u = new URL(`/api/stats/${selected}`, window.location.origin); // ruta definida en el backend
      u.searchParams.set("from", from);
      u.searchParams.set("to", to);
      const r = await fetch(u.toString(), { credentials: "include" });
      const data = await r.json().catch(() => ({}));

      if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
      // el endpoint devuelve un objeto plano con métricas
      if (data && typeof data === "object" && ("total_cortes" in data || "monto_total" in data)) {
        setStats(data);
      } else if (data?.ok === false) {
        throw new Error(data.error || "Respuesta inválida del servidor");
      } else {
        // Caso sin datos (p.ej., no hay turnos en ese rango)
        setStats({ total_cortes: 0, monto_total: 0, porcentaje: 0, comision_ganada: 0, neto_local: 0 });
      }
    } catch (e) {
      setErr(e.message || "No pude traer las estadísticas.");
      console.error("[STYLIST_STATS] FE error:", e);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Cargar cuando cambia el peluquero
  useEffect(() => {
    if (selected) loadStats();
    // eslint-disable-next-line
  }, [selected]);

  // Recalcular al cambiar fechas (debounce 400ms)
  useEffect(() => {
    const t = setTimeout(() => { if (selected) loadStats(); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [from, to, selected]);

  const selectedStylist = stylists.find((s) => String(s.id) === String(selected));
  const percent = useMemo(
    () => (stats?.porcentaje ?? selectedStylist?.percentage ?? 0),
    [stats, selectedStylist]
  );

  const Empty = () => (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
      <p className="text-zinc-400">No hay datos para el rango seleccionado.</p>
    </div>
  );

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Estadísticas por Peluquero</h1>
            <p className="text-zinc-400 mt-1">Cortes, facturación y comisión.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector peluquero */}
            <div className="relative">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="appearance-none rounded-xl bg-white/5 border border-white/10 px-3 py-2 pr-8 text-sm"
              >
                {stylists.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.percentage != null ? `(${s.percentage}% comisión)` : ""}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">▾</div>
            </div>

            {/* Rango fechas */}
            <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 p-1">
              <Calendar className="size-4 mx-1 text-zinc-400" />
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="bg-transparent text-sm outline-none px-1" />
              <span className="text-zinc-500">–</span>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-sm outline-none px-1" />
              <Btn onClick={loadStats}>Aplicar</Btn>
            </div>

            {/* Presets */}
            <Btn onClick={() => { const d = new Date(); const f = new Date(); f.setDate(d.getDate()-6); setFrom(f.toISOString().slice(0,10)); setTo(d.toISOString().slice(0,10)); }}>7d</Btn>
            <Btn onClick={() => { const d = new Date(); const f = new Date(); f.setDate(d.getDate()-29); setFrom(f.toISOString().slice(0,10)); setTo(d.toISOString().slice(0,10)); }}>30d</Btn>

            {/* Export */}
            <Btn onClick={() => window.print()}>
              <Download className="size-4" /> Exportar
            </Btn>
          </div>
        </div>

        {/* Error visible */}
        {err ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <AlertTriangle className="size-4" />
            <span>{err}</span>
          </div>
        ) : null}

        {/* KPIs */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[108px] animate-pulse rounded-2xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI icon={Scissors} label="Cortes" value={stats?.total_cortes ?? 0} sublabel="Turnos facturables" />
            <KPI icon={Coins} label="Monto total" value={fmtMoney(stats?.monto_total ?? 0)} />
            <KPI icon={TrendingUp} label={`Comisión (${percent}%)`} value={fmtMoney(stats?.comision_ganada ?? 0)} />
            <KPI icon={PiggyBank} label="Neto para el local" value={fmtMoney(stats?.neto_local ?? 0)} />
          </div>
        ) : (
          <Empty />
        )}

        {/* Pie */}
        <div className="mt-10 flex items-center gap-2 text-xs text-zinc-500">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          <span>{loading ? "Actualizando…" : "Listo"}</span>
        </div>
      </div>
    </div>
  );
}
