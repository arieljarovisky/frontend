// src/routes/DepositsPage.jsx - Versión corregida
import React, { useEffect, useState } from "react";
import { useQuery } from "../shared/useQuery.js";
import { apiClient } from "../api/client";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

// ============================================
// COMPONENTES DE UI
// ============================================

function StatCard({ icon: Icon, title, value, subtitle, trend, color = "primary" }) {
  const colorClasses = {
    primary: "from-primary-600/20 to-primary-600/5 border-primary-600/30",
    success: "from-emerald-600/20 to-emerald-600/5 border-emerald-600/30",
    warning: "from-amber-600/20 to-amber-600/5 border-amber-600/30",
    danger: "from-red-600/20 to-red-600/5 border-red-600/30",
  };

  const iconColorClasses = {
    primary: "text-primary-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
  };

  return (
    <div className="card p-6 hover:scale-[1.02] transition-transform">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} border`}>
          <Icon className={`w-6 h-6 ${iconColorClasses[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend > 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
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

function UrgencyBadge({ urgency }) {
  const configs = {
    expired: { label: "Vencido", className: "badge-danger" },
    expiring: { label: "Por vencer", className: "badge-warning" },
    active: { label: "Activo", className: "badge-success" },
  };

  const config = configs[urgency] || configs.active;
  return <span className={`badge ${config.className}`}>{config.label}</span>;
}

function DepositRow({ deposit, onAction, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAction = async (action) => {
    if (loading) return;

    const confirmations = {
      markPaid: "¿Marcar esta seña como paga?",
      cancel: "¿Cancelar este turno?",
      extend: "¿Extender el tiempo de hold por 30 minutos?",
    };

    if (confirmations[action] && !confirm(confirmations[action])) return;

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
    <div className="card p-4 mb-3 hover:shadow-dark-lg transition-all">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-dark-900 truncate">
            {deposit.customer_name || "Sin nombre"}
          </div>
          <div className="text-xs text-dark-500 flex items-center gap-2 mt-1">
            <Users className="w-3 h-3" />
            {deposit.phone_e164}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm text-dark-800">{deposit.service_name}</div>
          <div className="text-xs text-dark-500 flex items-center gap-2 mt-1">
            <Users className="w-3 h-3" />
            {deposit.stylist_name}
          </div>
        </div>

        <div className="w-32">
          <div className="text-sm font-bold text-emerald-400">
            ${Number(deposit.deposit_decimal || 0).toFixed(2)}
          </div>
          <div className="text-xs text-dark-500 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {new Date(deposit.starts_at).toLocaleDateString("es-AR")}
          </div>
        </div>

        <div className="w-24">
          <UrgencyBadge urgency={deposit.urgency} />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl bg-dark-200/50 hover:bg-dark-300/50 transition-all"
            title={expanded ? "Ocultar detalles" : "Ver detalles"}
          >
            {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {deposit.urgency !== "expired" && (
            <>
              <button
                onClick={() => handleAction("markPaid")}
                disabled={loading}
                className="btn-success text-xs px-3 py-2 disabled:opacity-50"
                title="Marcar como paga"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleAction("extend")}
                disabled={loading}
                className="btn-secondary text-xs px-3 py-2 disabled:opacity-50"
                title="Extender tiempo"
              >
                <Clock className="w-4 h-4" />
              </button>
            </>
          )}
          
          <button
            onClick={() => handleAction("cancel")}
            disabled={loading}
            className="btn-danger text-xs px-3 py-2 disabled:opacity-50"
            title="Cancelar turno"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-dark-200/30 grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-dark-600 mb-1">Hora del turno</div>
            <div className="text-dark-900 font-medium">
              {new Date(deposit.starts_at).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
          <div>
            <div className="text-dark-600 mb-1">Estado del pago</div>
            <div className="text-dark-900 font-medium">Pendiente</div>
          </div>
          <div>
            <div className="text-dark-600 mb-1">ID del turno</div>
            <div className="text-dark-900 font-medium font-mono text-xs">#{deposit.id}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DepositsPage() {
  const [includeExpired, setIncludeExpired] = useState(false);
  const [refreshKey, setRefresh] = useState(0);

  const { data: dashboard, loading: loadingDash } = useQuery(
    async () => {
      const { data } = await apiClient.get("/api/admin/deposits/dashboard");
      return data.data;
    },
    [refreshKey]
  );

  const { data: deposits, loading: loadingDeposits } = useQuery(
    async () => {
      const { data } = await apiClient.get("/api/admin/deposits/pending", {
        params: { includeExpired: includeExpired ? "true" : "false" },
      });
      return data.data;
    },
    [includeExpired, refreshKey]
  );

  const handleAction = async (depositId, action) => {
    const endpoints = {
      markPaid: `/api/admin/deposits/${depositId}/mark-paid`,
      cancel: `/api/admin/deposits/${depositId}/cancel`,
      extend: `/api/admin/deposits/${depositId}/extend`,
      remind: `/api/admin/deposits/${depositId}/remind`,
    };

    await apiClient.post(endpoints[action]);
  };

  const handleRefresh = () => setRefresh((k) => k + 1);

  useEffect(() => {
    const interval = setInterval(handleRefresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = dashboard?.stats || {};

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900">Gestión de Señas</h1>
          <p className="text-dark-600 mt-1">
            Monitoreo en tiempo real de pagos del sistema
          </p>
        </div>
        <button onClick={handleRefresh} className="btn-primary">
          <RefreshCw className={`w-4 h-4 ${loadingDash ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Clock}
          title="Pendientes activas"
          value={stats.pendingActive || 0}
          subtitle="En tiempo"
          color="success"
        />
        <StatCard
          icon={AlertTriangle}
          title="Vencidas"
          value={stats.pendingExpired || 0}
          subtitle="Sin pagar"
          color="danger"
        />
        <StatCard
          icon={DollarSign}
          title="Dinero retenido"
          value={`$${Number(stats.amountHeld || 0).toFixed(0)}`}
          subtitle="En espera"
          color="warning"
        />
        <StatCard
          icon={CheckCircle2}
          title="Pagadas hoy"
          value={stats.paidToday || 0}
          subtitle="Últimas 24hs"
          color="primary"
        />
        <StatCard
          icon={XCircle}
          title="Canceladas hoy"
          value={stats.cancelledToday || 0}
          subtitle="Timeout"
          color="primary"
        />
      </div>

      {/* Expiring Soon Alert */}
      {dashboard?.expiringSoon?.length > 0 && (
        <div className="card p-4 border-2 border-amber-600/30 bg-amber-600/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-amber-300 mb-2">
                ¡{dashboard.expiringSoon.length} turno(s) próximos a vencer!
              </div>
              <div className="text-sm text-amber-200 space-y-1">
                {dashboard.expiringSoon.map((appt) => (
                  <div key={appt.id}>
                    • {appt.customer_name} - {appt.service_name} (vence en{" "}
                    {appt.minutes_left} min)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Payments */}
      {dashboard?.recentPayments?.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Pagos recientes (24hs)
          </h2>
          <div className="space-y-2 text-sm">
            {dashboard.recentPayments.map((payment) => (
              <div
                key={payment.id}
                className="flex justify-between py-2 border-b border-dark-200/30 last:border-0"
              >
                <div>
                  <span className="font-medium text-dark-900">
                    {payment.customer_name}
                  </span>
                  {" • "}
                  <span className="text-dark-600">{payment.service_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-emerald-400">
                    ${Number(payment.deposit_decimal || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-dark-500">
                    {new Date(payment.deposit_paid_at).toLocaleTimeString(
                      "es-AR",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Deposits */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-dark-900">
            Señas pendientes ({deposits?.length || 0})
          </h2>
          <label className="flex items-center gap-2 text-sm text-dark-700 cursor-pointer">
            <input
              type="checkbox"
              checked={includeExpired}
              onChange={(e) => setIncludeExpired(e.target.checked)}
              className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
            />
            Incluir vencidas
          </label>
        </div>

        {loadingDeposits ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : !deposits || deposits.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
            <p className="text-dark-600">✅ No hay señas pendientes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deposits.map((deposit) => (
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