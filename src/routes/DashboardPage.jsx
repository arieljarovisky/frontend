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
    primary: "from-primary-600/20 to-primary-600/5 border-primary-600/30 text-primary-400",
    success: "from-emerald-600/20 to-emerald-600/5 border-emerald-600/30 text-emerald-400",
    warning: "from-amber-600/20 to-amber-600/5 border-amber-600/30 text-amber-400",
    danger: "from-red-600/20 to-red-600/5 border-red-600/30 text-red-400",
  };

  return (
    <div className="card p-6 hover:scale-[1.02] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-dark-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-dark-900">{value}</p>
        {subtitle && <p className="text-xs text-dark-500 mt-2">{subtitle}</p>}
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
      <div className="card p-6">
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
  completed: { label: "Completado", color: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  cancelled: { label: "Cancelado", color: "bg-dark-200/50 text-dark-600 border-dark-300/50" },
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

  const { data: raw, loading: loadingM } =
    useQuery(() => apiClient.getAdminDashboard({}), []);
  const dashboard = raw?.data ?? raw ?? {};

  const from = ymd(startOfWeek());
  const to = ymd(endOfWeek());
  const { data: rawWeek } =
    useQuery(() => apiClient.getAdminDashboard({ from, to }), [from, to]);
  const week = rawWeek?.data ?? rawWeek ?? {};

  const year = new Date().getFullYear();
  const { data: income, loading: loadingInc } =
    useQuery(() => apiClient.getIncomeByMonth(year), [year]);
  const incomeArr = asArray(income);

  const { data: topServices, loading: loadingSvc } =
    useQuery(() => apiClient.getTopServices({ months: 3, limit: 6 }), []);
  const topServicesArr = asArray(topServices);

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
          <h1 className="text-3xl font-bold text-dark-900 mb-2">
            Dashboard
          </h1>
          <p className="text-dark-600">
            Resumen de actividad y métricas en tiempo real
          </p>
        </div>
        <button
          onClick={() => navigate("/appointments")}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Turno
        </button>
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
          trend={12}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Income Chart */}
        <div className="lg:col-span-3">
          <Section title={`Ingresos ${year}`}>
            <div className="w-full h-[280px]">
              {loadingInc ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : (
                <ResponsiveContainer>
                  <LineChart data={incomeArr}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      stroke="#a1a1aa"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#a1a1aa"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '12px',
                        color: '#fafafa'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#a1a1aa' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="income" 
                      stroke="#0ea5e9" 
                      strokeWidth={3}
                      dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </Section>
        </div>

        {/* Top Services Chart */}
        <div className="lg:col-span-2">
          <Section title="Servicios Top">
            <div className="w-full h-[280px]">
              {loadingSvc ? (
                <div className="h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
                </div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={topServicesArr}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" opacity={0.3} />
                    <XAxis 
                      dataKey="service_name" 
                      stroke="#a1a1aa"
                      style={{ fontSize: '11px' }}
                      angle={-15}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis 
                      allowDecimals={false} 
                      stroke="#a1a1aa"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#27272a',
                        border: '1px solid #3f3f46',
                        borderRadius: '12px',
                        color: '#fafafa'
                      }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#colorGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                        <stop offset="100%" stopColor="#d946ef" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Section>
        </div>
      </div>

      {/* Today's Agenda */}
      <Section
        title="Agenda de Hoy"
        action={
          <span className="text-sm text-dark-600">
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
              <Clock className="w-12 h-12 mx-auto mb-3 text-dark-400" />
              <p className="text-dark-600">No hay turnos programados para hoy</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-200/50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-dark-700">Hora</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-dark-700">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-dark-700">Servicio</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-dark-700">Peluquero</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-dark-700">Estado</th>
                </tr>
              </thead>
              <tbody>
                {agendaArr.map((a) => {
                  const config = STATUS_CONFIG[a.status] || STATUS_CONFIG.scheduled;
                  return (
                    <tr 
                      key={a.id} 
                      className="border-b border-dark-200/30 hover:bg-dark-200/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-medium text-dark-900">
                        {new Date(a.starts_at).toLocaleTimeString("es-AR", { 
                          hour: "2-digit", 
                          minute: "2-digit" 
                        })}
                      </td>
                      <td className="py-3 px-4 text-sm text-dark-800">{a.customer_name}</td>
                      <td className="py-3 px-4 text-sm text-dark-700">{a.service_name}</td>
                      <td className="py-3 px-4 text-sm text-dark-700">{a.stylist_name}</td>
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