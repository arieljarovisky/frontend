// src/routes/DashboardPage.jsx
import React from "react";
import { useQuery } from "../shared/useQuery.js";
import { apiClient } from "../api";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";

// Recharts
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";

function StatCard({ title, value, subtitle, icon: Icon, trend, color = "primary" }) {
  const colorClasses = {
    primary: "stat-chip--primary",
    success: "stat-chip--success",
    warning: "stat-chip--warning",
    danger: "stat-chip--danger",
  };

  return (
    <div className="card card--space-lg">
      <div className="stat-card__header">
        <div className={`stat-chip ${colorClasses[color]}`}>
          <Icon />
        </div>
        {trend && (
          <div className={`stat-trend ${trend < 0 ? "stat-trend--down" : "stat-trend--up"}`}>
            <TrendingUp className={trend < 0 ? "stat-trend__icon--down" : "stat-trend__icon"} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="stat-card__subtitle">{title}</p>
        <p className="stat-card__value">{value}</p>
        {subtitle && <p className="stat-card__footnote">{subtitle}</p>}
      </div>
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">{title}</h2>
        {action}
      </div>
      <div className="card card--space-lg card--no-hover">
        {children}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  scheduled: { label: "Programado", color: "bg-primary-600/20 text-primary-400 border-primary-600/30" },
  pending_deposit: { label: "Seña pendiente", color: "bg-amber-600/20 text-amber-400 border-amber-600/30" },
  deposit_paid: { label: "Seña pagada", color: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" },
  confirmed: { label: "Confirmado", color: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" },
  completed: { label: "Completado", color: "bg-primary-600/20 text-primary-400 border-primary-600/30" },
  cancelled: { label: "Cancelado", color: "bg-background-secondary text-foreground-secondary border-border" },
};

const asArray = (v) => Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [];

const money = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
    : "—";

const ymd = (d) => {
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const startOfWeek = (base = new Date()) => {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - (dow - 1));
  return d;
};

const endOfWeek = (base = new Date()) => {
  const s = startOfWeek(base), e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  
  const { data: topServices, loading: loadingSvc, error: errorSvc } =
    useQuery(() => apiClient.getTopServices({ months: 3, limit: 6 }), []);

  const { data: raw, loading: loadingM, error: errorM } =
    useQuery(() => apiClient.getAdminDashboard({}), []);
  const dashboard = raw?.data ?? raw ?? {};

  const from = ymd(startOfWeek());
  const to = ymd(endOfWeek());
  const { data: rawWeek, error: errorWeek } =
    useQuery(() => apiClient.getAdminDashboard({ from, to }), [from, to]);
  const week = rawWeek?.data ?? rawWeek ?? {};

  const year = new Date().getFullYear();
  const { data: income, loading: loadingInc, error: errorInc } =
    useQuery(() => apiClient.getIncomeByMonth(year), [year]);
  const incomeArr = React.useMemo(() => {
    const arr = asArray(income);
    return arr.map(d => ({
      month: String(d.month ?? d.mm ?? d.m ?? "").padStart(2, "0"),
      income: Number(d.income ?? d.total ?? 0),
    })).filter(d => d.month); // Filtrar elementos sin mes válido
  }, [income]);

  const topServicesArr = React.useMemo(() => {
    const arr = asArray(topServices);
    return arr.map(d => ({
      service_name: String(d.service_name ?? d.name ?? "").trim(),
      count: Number(d.count ?? d.qty ?? 0),
    })).filter(d => d.service_name && d.count > 0); // Filtrar servicios vacíos o sin count
  }, [topServices]);

  // Debug: Log errores si existen
  if (errorInc) console.error("[Dashboard] Error cargando ingresos:", errorInc);
  if (errorSvc) console.error("[Dashboard] Error cargando servicios top:", errorSvc);
  if (errorM) console.error("[Dashboard] Error cargando dashboard:", errorM);
  if (errorWeek) console.error("[Dashboard] Error cargando semana:", errorWeek);
  
  // Debug: Log datos recibidos
  React.useEffect(() => {
    if (!loadingInc && income) {
      console.log("[Dashboard] Datos de ingresos recibidos:", income);
      console.log("[Dashboard] Array procesado de ingresos:", incomeArr);
      console.log("[Dashboard] ¿Tiene datos válidos?", incomeArr.length > 0);
      console.log("[Dashboard] ¿Renderizará gráfico?", incomeArr.length > 0 && !errorInc);
      console.log("[Dashboard] Estado de carga:", { loadingInc, errorInc, hasData: incomeArr.length > 0 });
    }
  }, [loadingInc, income, incomeArr, errorInc]);

  React.useEffect(() => {
    if (!loadingSvc && topServices) {
      console.log("[Dashboard] Datos de servicios recibidos:", topServices);
      console.log("[Dashboard] Array procesado de servicios:", topServicesArr);
      console.log("[Dashboard] ¿Tiene datos válidos?", topServicesArr.length > 0);
      console.log("[Dashboard] ¿Renderizará gráfico?", topServicesArr.length > 0 && !errorSvc);
      console.log("[Dashboard] Estado de carga servicios:", { loadingSvc, errorSvc, hasData: topServicesArr.length > 0 });
    }
  }, [loadingSvc, topServices, topServicesArr, errorSvc]);




  const { data: agenda, loading: loadingAgenda } =
    useQuery(() => apiClient.getAgendaToday(), []);
  const agendaArr = asArray(agenda);

  const todayTotal = dashboard?.today?.total ?? 0;
  const todayConfirmed = dashboard?.today?.confirmed ?? 0;
  const todayPending = dashboard?.today?.pending ?? 0;
  const incomeWeek = week?.deposits?.rangeAmount ?? 0;


  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-foreground-secondary">
            Resumen de actividad y métricas en tiempo real
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Turnos hoy"
          value={todayTotal}
          subtitle="Todos los estados"
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Confirmados"
          value={todayConfirmed}
          subtitle="Pagos completados"
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Pendientes"
          value={todayPending}
          subtitle="Requieren atención"
          icon={AlertCircle}
          color="warning"
        />
        <StatCard
          title="Ingresos Semana"
          value={money(incomeWeek)}
          subtitle="Señas cobradas"
          icon={DollarSign}
          color="success"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Income Chart */}
        <div className="lg:col-span-3">
          <Section title={`Ingresos ${year}`}>
            {loadingInc ? (
              <div className="w-full h-[280px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : errorInc ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  Error al cargar los datos de ingresos
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  {typeof errorInc === 'string' ? errorInc : errorInc?.message || "Intenta recargar la página"}
                </p>
              </div>
            ) : !incomeArr || incomeArr.length === 0 ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <DollarSign className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  No hay datos de ingresos para mostrar
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  Los ingresos aparecerán cuando tengas turnos completados
                </p>
              </div>
            ) : (
              <div className="w-full" style={{ height: '280px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={incomeArr} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                      <XAxis
                        dataKey="month"
                        stroke="#a1a1aa"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#a1a1aa' }}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        style={{ fontSize: '12px' }}
                        tick={{ fill: '#a1a1aa' }}
                        tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#27272a',
                          border: '1px solid #3f3f46',
                          borderRadius: '12px',
                          color: '#fafafa'
                        }}
                        formatter={(value) => money(value)}
                        labelFormatter={(label) => `Mes ${label}`}
                      />
                      <Legend
                        wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="income"
                        name="Ingresos"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
            )}
          </Section>
        </div>

        {/* Top Services Chart */}
        <div className="lg:col-span-2">
          <Section title="Servicios Top">
            {loadingSvc ? (
              <div className="w-full h-[280px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : errorSvc ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  Error al cargar los servicios más solicitados
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  {typeof errorSvc === 'string' ? errorSvc : errorSvc?.message || "Intenta recargar la página"}
                </p>
              </div>
            ) : !topServicesArr || topServicesArr.length === 0 ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <Users className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  No hay datos de servicios para mostrar
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  Los servicios aparecerán cuando tengas turnos programados
                </p>
              </div>
            ) : (
              <div className="w-full" style={{ height: '280px', position: 'relative' }}>
                <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topServicesArr} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                      <defs>
                        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.25} />
                      <XAxis
                        dataKey="service_name"
                        stroke="#a1a1aa"
                        tick={{ fill: "#a1a1aa", fontSize: 11 }}
                        interval={0}
                        angle={-12}
                        dy={8}
                        height={60}
                      />
                      <YAxis
                        stroke="#a1a1aa"
                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                        width={50}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{
                          backgroundColor: "#18181b",
                          border: "1px solid #3f3f46",
                          borderRadius: 12,
                          color: "#fafafa",
                        }}
                        itemStyle={{ color: "#fafafa" }}
                        labelStyle={{ color: "#fafafa" }}
                        formatter={(value) => `${value} turno${value !== 1 ? 's' : ''}`}
                      />
                      <Bar
                        dataKey="count"
                        name="Turnos"
                        fill="url(#barFill)"
                        radius={[12, 12, 0, 0]}
                        background={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            )}
          </Section>
        </div>
      </div>

      {/* Today's Agenda */}
      <Section
        title="Agenda de Hoy"
        action={
          <span className="text-sm text-foreground-secondary">
            {agendaArr.length} turnos programados
          </span>
        }
      >
        <div className="overflow-x-auto">
          {loadingAgenda ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
            </div>
          ) : agendaArr.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 text-foreground-muted" />
              <p className="text-foreground-secondary">No hay turnos programados para hoy</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Hora</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Servicio</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Instructor</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Estado</th>
                </tr>
              </thead>
              <tbody>
                {agendaArr.map((a) => {
                  const config = STATUS_CONFIG[a.status] || STATUS_CONFIG.scheduled;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-border hover:bg-background-secondary transition-colors"
                      >
                      <td className="py-3 px-4 text-sm font-medium text-foreground">
                        {new Date(a.starts_at).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">{a.customer_name}</td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{a.service_name}</td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{a.instructor_name}</td>
                      <td className="py-3 px-4">
                        <span className={`badge ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Section>
    </div>
  );
}