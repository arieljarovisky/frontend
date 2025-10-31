import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TrendingUp, Scissors, Coins, PiggyBank, Download,
  Calendar, Loader2, AlertTriangle, Save, RotateCw
} from "lucide-react";
import { apiClient } from "../../api/client";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

/* ===== helpers ===== */
const money = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 })
    .format(Number(n || 0));

const csv = (rows) =>
  [Object.keys(rows[0] || {}).join(","), ...rows.map(r => Object.values(r).map(v =>
    String(v ?? "").replace(/"/g, '""')
  ).map(v => /[",\n]/.test(v) ? `"${v}"` : v).join(","))].join("\n");

const KPI = ({ icon: Icon, label, value, sublabel }) => (
  <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] transition hover:-translate-y-0.5 hover:shadow-xl">
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

/* ===== Editor horarios / francos ===== */
function WorkingHoursEditor({ stylistId }) {
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const week = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const load = useCallback(async () => {
    if (!stylistId) return;
    setErr("");
    try {
      const server = await apiClient.getWorkingHours(stylistId);
      const byWd = new Map((server || []).map(x => [Number(x.weekday), x]));
      const full = Array.from({ length: 7 }, (_, d) => {
        const r = byWd.get(d);
        return {
          weekday: d,
          start_time: r?.start_time ?? null,
          end_time: r?.end_time ?? null,
        };
      });
      setRows(full);
    } catch (e) {
      setErr("No pude cargar horarios.");
      console.error(e);
    }
  }, [stylistId]);

  useEffect(() => { load(); }, [load]);

  const update = (idx, patch) => setRows(rs => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  
  const toggleFranco = (idx) => {
    const r = rows[idx];
    const off = !r.start_time && !r.end_time;
    update(idx, off ? { start_time: "10:00:00", end_time: "19:00:00" }
      : { start_time: null, end_time: null });
  };

  const save = async () => {
    if (!stylistId) return;
    setSaving(true);
    setErr("");
    try {
      const hours = Array.from({ length: 7 }, (_, d) => {
        const r = rows.find(x => Number(x.weekday) === d) || {};
        const st = r.start_time?.trim?.() || null;
        const et = r.end_time?.trim?.() || null;
        return {
          weekday: d,
          start_time: st ? (st.length === 5 ? `${st}:00` : st) : null,
          end_time: et ? (et.length === 5 ? `${et}:00` : et) : null,
        };
      });

      await apiClient.saveWorkingHours(stylistId, hours);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "No pude guardar horarios.");
      console.error("[saveWorkingHours]", e);
    } finally {
      setSaving(false);
    }
  };

  if (!stylistId) return null;

  return (
    <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Horarios y francos</h3>
        <div className="flex items-center gap-2">
          <Btn onClick={load}><RotateCw className="size-4" /> Recargar</Btn>
          <Btn onClick={save} className="bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Guardar
          </Btn>
        </div>
      </div>
      {err && (
        <div className="mb-3 text-sm rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-300 flex items-center gap-2">
          <AlertTriangle className="size-4" /> {err}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {rows.map((r, idx) => {
          const off = !r.start_time && !r.end_time;
          return (
            <div key={idx} className={`rounded-xl border px-4 py-3 ${off ? "border-white/10 bg-white/[0.02]" : "border-white/10 bg-white/[0.04]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{week[r.weekday]}</span>
                <button
                  onClick={() => toggleFranco(idx)}
                  className={`text-xs rounded-lg px-2 py-1 border ${off ? "border-white/10 bg-white/5" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}
                >
                  {off ? "Franco" : "Trabaja"}
                </button>
              </div>
              {!off && (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-zinc-400">Desde</label>
                    <input
                      type="time"
                      value={(r.start_time || "").slice(0, 5)}
                      onChange={(e) => update(idx, { start_time: `${e.target.value}:00` })}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-zinc-400">Hasta</label>
                    <input
                      type="time"
                      value={(r.end_time || "").slice(0, 5)}
                      onChange={(e) => update(idx, { end_time: `${e.target.value}:00` })}
                      className="w-full rounded-lg bg-white/5 border border-white/10 px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===== Página principal ===== */
export default function StylistStatsPage() {
  const [stylists, setStylists] = useState([]);
  const [selected, setSelected] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [from, setFrom] = useState(() => new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  // ✅ useRef para mantener la función actualizada sin causar re-renders
  const loadStatsRef = useRef();

  loadStatsRef.current = async () => {
    if (!selected) return;
    setLoading(true);
    setErr("");
    try {
      const data = await apiClient.getStylistStatsRange(selected, { from, to });
      setStats({
        total_cortes: data.total_cortes ?? 0,
        monto_total: data.monto_total ?? 0,
        porcentaje: data.porcentaje ?? data.percentage ?? null,
        comision_ganada: data.comision_ganada ?? data.comision ?? 0,
        neto_local: data.neto_local ?? 0,
        daily: data.daily || null,
        services: data.services || null,
        turnos: data.turnos || null,
      });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "No pude traer las estadísticas.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Un solo useEffect con debounce para evitar doble refresh
  useEffect(() => {
    if (!selected) return;

    const timer = setTimeout(() => {
      loadStatsRef.current();
    }, 350);

    return () => clearTimeout(timer);
  }, [selected, from, to]);

  // Cargar peluqueros al inicio
  useEffect(() => {
    (async () => {
      try {
        let list = await apiClient.getCommissions();
        if (!Array.isArray(list) || !list.length) {
          const s = await apiClient.getStylists();
          list = (s || []).map(x => ({
            id: x.id,
            name: x.name,
            percentage: x.percentage ?? x.commission ?? null
          }));
        }
        setStylists(list);
        if (list?.length) setSelected(String(list[0].id));
      } catch (e) {
        setErr("No pude traer la lista de peluqueros.");
        console.error(e);
      }
    })();
  }, []);

  const stylist = stylists.find(s => String(s.id) === String(selected));
  const percent = useMemo(() => (stats?.porcentaje ?? stylist?.percentage ?? 0), [stats, stylist]);

  const dailySeries = useMemo(() => {
    if (!stats) return [];
    if (Array.isArray(stats.daily) && stats.daily.length) return stats.daily;
    if (Array.isArray(stats.turnos) && stats.turnos.length) {
      const map = new Map();
      for (const t of stats.turnos) {
        const d = String((t.starts_at || t.date || "").slice(0, 10));
        if (!d) continue;
        const m = map.get(d) || { date: d, amount: 0, cortes: 0 };
        m.amount += Number(t.price_decimal ?? t.amount ?? 0);
        m.cortes += 1;
        map.set(d, m);
      }
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    }
    return [];
  }, [stats]);

  const serviceRows = useMemo(() => {
    if (!stats) return [];
    if (Array.isArray(stats.services) && stats.services.length) return stats.services;
    if (Array.isArray(stats.turnos)) {
      const map = new Map();
      for (const t of stats.turnos) {
        const key = t.service_name ?? `Servicio ${t.service_id}`;
        const row = map.get(key) || { service: key, count: 0, amount: 0 };
        row.count += 1;
        row.amount += Number(t.price_decimal ?? 0);
        map.set(key, row);
      }
      return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    }
    return [];
  }, [stats]);

  const doExport = async () => {
    try {
      let rows = stats?.turnos;
      if (!rows) rows = await apiClient.getStylistTurns(selected, { from, to });
      if (!Array.isArray(rows) || !rows.length) return;
      const mapped = rows.map(t => ({
        fecha: (t.starts_at || "").replace("T", " ").slice(0, 16),
        servicio: t.service_name,
        precio: Number(t.price_decimal ?? 0),
        estado: t.status,
        cliente: t.customer_name ?? "",
        peluquero: t.stylist_name ?? "",
      }));
      const blob = new Blob([csv(mapped)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `turnos_${selected}_${from}_a_${to}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("No pude exportar.");
    }
  };

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
            </div>

            {/* Presets */}
            <Btn onClick={() => { 
              const d = new Date(); 
              const f = new Date(); 
              f.setDate(d.getDate() - 6); 
              setFrom(f.toISOString().slice(0, 10)); 
              setTo(d.toISOString().slice(0, 10)); 
            }}>7d</Btn>
            
            <Btn onClick={() => { 
              const d = new Date(); 
              const f = new Date(); 
              f.setDate(d.getDate() - 29); 
              setFrom(f.toISOString().slice(0, 10)); 
              setTo(d.toISOString().slice(0, 10)); 
            }}>30d</Btn>

            {/* Export */}
            <Btn onClick={doExport}><Download className="size-4" /> Exportar CSV</Btn>
          </div>
        </div>

        {/* Error visible */}
        {err ? (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <AlertTriangle className="size-4" />
            <span>{err}</span>
          </div>
        ) : null}

        {/* KPIs + contenido */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-[108px] animate-pulse rounded-2xl bg-white/5 border border-white/10" />
            ))}
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPI icon={Scissors} label="Cortes" value={stats?.total_cortes ?? 0} sublabel="Turnos facturables" />
              <KPI icon={Coins} label="Monto total" value={money(stats?.monto_total ?? 0)} />
              <KPI icon={TrendingUp} label={`Comisión (${percent}%)`} value={money(stats?.comision_ganada ?? 0)} />
              <KPI icon={PiggyBank} label="Neto para el local" value={money(stats?.neto_local ?? 0)} />
            </div>

            {/* Gráfico diario */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 text-sm text-zinc-400">Evolución diaria</div>
              {dailySeries.length ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySeries}>
                      <CartesianGrid strokeOpacity={0.1} />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v, n) => n === "amount" ? money(v) : v} />
                      <Area type="monotone" dataKey="amount" stroke="#8884d8" fillOpacity={0.25} fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <Empty />
              )}
            </div>

            {/* Tabla por servicio */}
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 text-sm text-zinc-400">Servicios</div>
              {serviceRows.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="text-zinc-400">
                      <tr>
                        <th className="text-left py-2 pr-4">Servicio</th>
                        <th className="text-right py-2 pr-4">Cortes</th>
                        <th className="text-right py-2">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceRows.map((r, i) => (
                        <tr key={i} className="border-t border-white/10">
                          <td className="py-2 pr-4">{r.service ?? r.name}</td>
                          <td className="py-2 pr-4 text-right">{r.count ?? r.cortes ?? 0}</td>
                          <td className="py-2 text-right">{money(r.amount ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty />
              )}
            </div>

            {/* Editor de horarios / francos */}
            <WorkingHoursEditor stylistId={selected} />
          </>
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