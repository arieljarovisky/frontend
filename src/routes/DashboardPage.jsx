// src/routes/DashboardPage.jsx
import React from "react";
import { Card } from "../shared/ui.jsx";
import { useQuery } from "../shared/useQuery.js";
import { adminApi } from "../shared/api.js";
import { useNavigate } from "react-router-dom";

// Recharts
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend
} from "recharts";

function Section({ title, children, right }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {right}
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4">{children}</div>
    </div>
  );
}

const STATUS_LABELS = {
  scheduled: "Programado",
  pending_deposit: "Seña pendiente",
  deposit_paid: "Seña pagada",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
};

const asArray = (v) => Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [];

const money = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
    : "—";

// helpers de semana (lun-dom)
const ymd = (d) => {
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const startOfWeek = (base = new Date()) => {
  const d = new Date(base); d.setHours(0, 0, 0, 0);
  const dow = d.getDay() || 7; // lunes=1..domingo=7
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

  // ===== KPIs globales (hoy/mañana, revenue, deposits, etc.)
  const { data: raw, loading: loadingM } =
    useQuery((signal) => adminApi.dashboard({}, signal), []);
  const dashboard = raw?.data ?? raw ?? {};

  // ===== KPIs semanales para “Ingresos semana” (señas cobradas en la semana)
  const from = ymd(startOfWeek());
  const to = ymd(endOfWeek());
  const { data: rawWeek } =
    useQuery((signal) => adminApi.dashboard({ from, to }, signal), [from, to]);
  const week = rawWeek?.data ?? rawWeek ?? {};

  // ===== Charts
  const year = new Date().getFullYear();
  const { data: income, loading: loadingInc } =
    useQuery((signal) => adminApi.chartIncomeByMonth(year, signal), [year]);
  const incomeArr = asArray(income);

  const { data: topServices, loading: loadingSvc } =
    useQuery((signal) => adminApi.chartTopServices(6, 3, signal), []);
  const topServicesArr = asArray(topServices);

  // ===== Agenda de hoy
  const { data: agenda, loading: loadingAgenda } =
    useQuery((signal) => adminApi.todayAgenda(signal), []);
  const agendaArr = asArray(agenda);

  const todayTotal = dashboard?.today?.total ?? "—";
  const todayConfirmed = dashboard?.today?.confirmed ?? "—";
  const todayPending = dashboard?.today?.pending ?? "—";
  const incomeWeek = week?.deposits?.rangeAmount ?? 0;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => navigate("/appointments")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl shadow transition-all"
        >
          + Reservar turno
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card title="Turnos hoy" value={todayTotal} hint="Todos los estados" />
        <Card title="Confirmados" value={todayConfirmed} />
        {/* Antes decía “Cancelados” pero el backend no lo expone; mostramos Pendientes */}
        <Card title="Pendientes" value={todayPending} />
        <Card title="Ingresos semana" value={money(incomeWeek)} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <Section title={`Ingresos ${year}`}>
            <div className="w-full h-[260px]">
              <ResponsiveContainer>
                <LineChart data={incomeArr}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="income" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {loadingInc && <div className="text-xs text-gray-500 mt-2">Cargando…</div>}
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section title="Servicios más pedidos">
            <div className="w-full h-[260px]">
              <ResponsiveContainer>
                <BarChart data={topServicesArr}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="service_name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {loadingSvc && <div className="text-xs text-gray-500 mt-2">Cargando…</div>}
          </Section>
        </div>
      </div>

      {/* Agenda de hoy */}
      <Section
        title="Agenda de hoy"
        right={<span className="text-xs text-gray-500">{agendaArr.length} turnos</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr className="[&>th]:py-2 [&>th]:text-left">
                <th>Hora</th>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Peluquero</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-t">
              {loadingAgenda ? (
                <tr><td colSpan="5" className="py-4 text-gray-500">Cargando…</td></tr>
              ) : agendaArr.length === 0 ? (
                <tr><td colSpan="5" className="py-4 text-gray-500">Sin turnos para hoy.</td></tr>
              ) : (
                agendaArr.map((a) => (
                  <tr key={a.id} className="[&>td]:py-2">
                    <td>{new Date(a.starts_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{a.customer_name}</td>
                    <td>{a.service_name}</td>
                    <td>{a.stylist_name}</td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          a.status === "cancelled"
                            ? "bg-gray-100 text-gray-500"
                            : a.status === "pending_deposit"
                            ? "bg-yellow-100 text-yellow-700"
                            : a.status === "deposit_paid"
                            ? "bg-green-100 text-green-700"
                            : a.status === "completed"
                            ? "bg-indigo-100 text-indigo-700"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
