// src/routes/DepositsPage.jsx
import React, { useEffect, useState } from "react";
import { useQuery } from "../shared/useQuery.js";
import axios from "axios";

const api = axios.create({ baseURL: "/api/admin" });

function Card({ title, value, subtitle, color = "gray" }) {
    const colors = {
        gray: "bg-gray-50 border-gray-200 text-gray-900",
        green: "bg-green-50 border-green-200 text-green-900",
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-900",
        red: "bg-red-50 border-red-200 text-red-900"
    };

    return (
        <div className={`rounded-2xl border p-5 ${colors[color]}`}>
            <div className="text-sm opacity-70">{title}</div>
            <div className="text-3xl font-semibold mt-1">{value}</div>
            {subtitle && <div className="text-xs opacity-60 mt-1">{subtitle}</div>}
        </div>
    );
}

function DepositRow({ deposit, onAction, onRefresh }) {
    const [loading, setLoading] = useState(false);

    const urgencyColors = {
        expired: "bg-red-100 text-red-800",
        expiring: "bg-yellow-100 text-yellow-800",
        active: "bg-green-100 text-green-800"
    };

    const handleAction = async (action) => {
        if (loading) return;
        
        const confirmations = {
            markPaid: "¿Marcar esta seña como paga?",
            cancel: "¿Cancelar este turno?",
            extend: "¿Extender el tiempo de hold por 30 minutos?"
        };

        if (confirmations[action] && !confirm(confirmations[action])) {
            return;
        }

        setLoading(true);
        try {
            await onAction(deposit.id, action);
            onRefresh();
        } catch (error) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-3 p-4 bg-white border-b hover:bg-gray-50">
            <div className="flex-1 grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3">
                    <div className="font-medium">{deposit.customer_name || "Sin nombre"}</div>
                    <div className="text-xs text-gray-500">{deposit.phone_e164}</div>
                </div>
                
                <div className="col-span-3">
                    <div className="text-sm">{deposit.service_name}</div>
                    <div className="text-xs text-gray-500">{deposit.stylist_name}</div>
                </div>
                
                <div className="col-span-2">
                    <div className="text-sm font-semibold">${Number(deposit.deposit_decimal || 0).toFixed(2)}</div>
                    <div className="text-xs text-gray-500">{deposit.starts_at}</div>
                </div>
                
                <div className="col-span-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${urgencyColors[deposit.urgency]}`}>
                        {deposit.urgency === "expired" ? "Vencido" : 
                         deposit.urgency === "expiring" ? "Por vencer" : "Activo"}
                    </span>
                </div>
                
                <div className="col-span-2 flex gap-1">
                    {deposit.urgency !== "expired" && (
                        <>
                            <button
                                onClick={() => handleAction("markPaid")}
                                disabled={loading}
                                className="px-2 py-1 text-xs rounded bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
                                title="Marcar como paga"
                            >
                                ✓ Paga
                            </button>
                            <button
                                onClick={() => handleAction("extend")}
                                disabled={loading}
                                className="px-2 py-1 text-xs rounded bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                                title="Extender tiempo"
                            >
                                ⏰ +30min
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => handleAction("cancel")}
                        disabled={loading}
                        className="px-2 py-1 text-xs rounded bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
                        title="Cancelar turno"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function DepositsPage() {
    const [includeExpired, setIncludeExpired] = useState(false);
    const [refreshKey, setRefresh] = useState(0);

    // Dashboard stats
    const { data: dashboard, loading: loadingDash } = useQuery(
        () => api.get("/deposits/dashboard").then(r => r.data.data),
        [refreshKey]
    );

    // Pending deposits
    const { data: deposits, loading: loadingDeposits } = useQuery(
        () => api.get("/deposits/pending", {
            params: { includeExpired: includeExpired ? "true" : "false" }
        }).then(r => r.data.data),
        [includeExpired, refreshKey]
    );

    const handleAction = async (depositId, action) => {
        const endpoints = {
            markPaid: `/deposits/${depositId}/mark-paid`,
            cancel: `/deposits/${depositId}/cancel`,
            extend: `/deposits/${depositId}/extend`,
            remind: `/deposits/${depositId}/remind`
        };

        await api.post(endpoints[action]);
    };

    const handleRefresh = () => setRefresh(k => k + 1);

    // Auto-refresh cada 30 segundos
    useEffect(() => {
        const interval = setInterval(handleRefresh, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loadingDash) {
        return <div className="p-6 text-gray-500">Cargando...</div>;
    }

    const stats = dashboard?.stats || {};

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Señas</h1>
                    <p className="text-sm text-gray-600 mt-1">
                        Monitoreo en tiempo real de pagos pendientes
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800"
                >
                    🔄 Actualizar
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <Card
                    title="Pendientes activas"
                    value={stats.pendingActive || 0}
                    subtitle="En tiempo"
                    color="green"
                />
                <Card
                    title="Vencidas"
                    value={stats.pendingExpired || 0}
                    subtitle="Sin pagar"
                    color="red"
                />
                <Card
                    title="Dinero retenido"
                    value={`$${Number(stats.amountHeld || 0).toFixed(0)}`}
                    subtitle="En espera"
                    color="yellow"
                />
                <Card
                    title="Pagadas hoy"
                    value={stats.paidToday || 0}
                    subtitle="Últimas 24hs"
                    color="gray"
                />
                <Card
                    title="Canceladas hoy"
                    value={stats.cancelledToday || 0}
                    subtitle="Timeout"
                    color="gray"
                />
            </div>

            {/* Expiring Soon Alert */}
            {dashboard?.expiringSoon?.length > 0 && (
                <div className="rounded-xl border-2 border-yellow-400 bg-yellow-50 p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="flex-1">
                            <div className="font-semibold text-yellow-900">
                                ¡{dashboard.expiringSoon.length} turno(s) próximos a vencer!
                            </div>
                            <div className="text-sm text-yellow-800 mt-1">
                                {dashboard.expiringSoon.map(appt => (
                                    <div key={appt.id} className="mt-1">
                                        • {appt.customer_name} - {appt.service_name} 
                                        (vence en {appt.minutes_left} min)
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Payments */}
            {dashboard?.recentPayments?.length > 0 && (
                <div className="rounded-2xl border bg-white p-5">
                    <h2 className="text-lg font-semibold mb-3">✅ Pagos recientes (24hs)</h2>
                    <div className="space-y-2 text-sm">
                        {dashboard.recentPayments.map(payment => (
                            <div key={payment.id} className="flex justify-between py-2 border-b last:border-0">
                                <div>
                                    <span className="font-medium">{payment.customer_name}</span>
                                    {" • "}
                                    <span className="text-gray-600">{payment.service_name}</span>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-green-600">
                                        ${Number(payment.deposit_decimal || 0).toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(payment.deposit_paid_at).toLocaleTimeString("es-AR", {
                                            hour: "2-digit",
                                            minute: "2-digit"
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Pending Deposits Table */}
            <div className="rounded-2xl border bg-white overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold">
                        Señas pendientes ({deposits?.length || 0})
                    </h2>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={includeExpired}
                            onChange={(e) => setIncludeExpired(e.target.checked)}
                            className="rounded"
                        />
                        Incluir vencidas
                    </label>
                </div>

                {loadingDeposits ? (
                    <div className="p-8 text-center text-gray-500">Cargando...</div>
                ) : !deposits || deposits.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        ✅ No hay señas pendientes
                    </div>
                ) : (
                    <div>
                        {/* Header */}
                        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 text-xs font-medium text-gray-600">
                            <div className="col-span-3">Cliente</div>
                            <div className="col-span-3">Servicio</div>
                            <div className="col-span-2">Monto / Turno</div>
                            <div className="col-span-2">Estado</div>
                            <div className="col-span-2">Acciones</div>
                        </div>
                        
                        {/* Rows */}
                        {deposits.map(deposit => (
                            <DepositRow
                                key={deposit.id}
                                deposit={deposit}
                                onAction={handleAction}
                                onRefresh={handleRefresh}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}