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

// helpers locales
const asArray = (v) =>
    Array.isArray(v) ? v :
        Array.isArray(v?.data) ? v.data : [];

const money = (n) =>
    typeof n === "number"
        ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
        : "—";

export default function DashboardPage() {

    const navigate = useNavigate();
    // ---- métricas principales
    const { data: rawMetrics, loading: loadingM } =
        useQuery((signal) => adminApi.metrics({}, signal), []);
    const metrics = rawMetrics ?? {}; // <- si viene null, uso {}

    // ---- ingresos por mes (línea)
    const year = new Date().getFullYear();
    const { data: income, loading: loadingInc } =
        useQuery((signal) => adminApi.chartIncomeByMonth(year, signal), [year]);
    const incomeArr = asArray(income);

    // ---- servicios más pedidos (barra)
    const { data: topServices, loading: loadingSvc } =
        useQuery((signal) => adminApi.chartTopServices(6, 3, signal), []);
    const topServicesArr = asArray(topServices);

    // ---- agenda de hoy (tabla)
    const { data: agenda, loading: loadingAgenda } =
        useQuery((signal) => adminApi.todayAgenda(signal), []);
    const agendaArr = asArray(agenda);

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
                <Card title="Turnos hoy" value={metrics?.today_total ?? "—"} hint="Todos los estados" />
                <Card title="Confirmados" value={metrics?.today_scheduled ?? "—"} />
                <Card title="Cancelados" value={metrics?.today_cancelled ?? "—"} />
                <Card title="Ingresos semana" value={money(metrics?.week_income)} />
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
                                        <td className="capitalize">{a.status}</td>
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
