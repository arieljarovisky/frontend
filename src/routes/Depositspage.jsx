// src/routes/DepositsPage.jsx - Versión mejorada con tema oscuro
import React, { useEffect, useState } from "react";
import { useQuery } from "../shared/useQuery.js";
import axios from "axios";
import {
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Settings,
  Activity,
  TrendingUp,
  Users,
  Calendar,
  RefreshCw,
  Eye,
  EyeOff,
  Bell,
  Filter
} from "lucide-react";

const api = axios.create({ baseURL: "/api/admin" });

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

function TabButton({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all
        ${active 
          ? 'bg-gradient-primary text-white shadow-glow' 
          : 'text-dark-700 hover:text-dark-900 hover:bg-dark-200/50'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className={`
          inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold
          ${active ? 'bg-white/20 text-white' : 'bg-red-500/20 text-red-400'}
        `}>
          {badge}
        </span>
      )}
    </button>
  );
}

function UrgencyBadge({ urgency }) {
  const configs = {
    expired: { label: "Vencido", className: "badge-danger" },
    expiring: { label: "Por vencer", className: "badge-warning" },
    active: { label: "Activo", className: "badge-success" },
  };

  const config = configs[urgency] || configs.active;
  return <span className={config.className}>{config.label}</span>;
}

// ============================================
// ROW DE DEPÓSITO
// ============================================

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
      {/* Header Row */}
      <div className="flex items-center gap-4">
        {/* Cliente */}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-dark-900 truncate">
            {deposit.customer_name || "Sin nombre"}
          </div>
          <div className="text-xs text-dark-500 flex items-center gap-2 mt-1">
            <Users className="w-3 h-3" />
            {deposit.phone_e164}
          </div>
        </div>

        {/* Servicio */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-dark-800">{deposit.service_name}</div>
          <div className="text-xs text-dark-500 flex items-center gap-2 mt-1">
            <Users className="w-3 h-3" />
            {deposit.stylist_name}
          </div>
        </div>

        {/* Monto y Fecha */}
        <div className="w-32">
          <div className="text-sm font-bold text-emerald-400">
            ${Number(deposit.deposit_decimal || 0).toFixed(2)}
          </div>
          <div className="text-xs text-dark-500 flex items-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            {new Date(deposit.starts_at).toLocaleDateString("es-AR")}
          </div>
        </div>

        {/* Estado */}
        <div className="w-24">
          <UrgencyBadge urgency={deposit.urgency} />
        </div>

        {/* Acciones */}
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

      {/* Detalles Expandidos */}
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
// VISTA DE CONFIGURACIÓN
// ============================================

function ConfigurationView() {
  const [config, setConfig] = useState({
    depositPercentage: 50,
    holdMinutes: 30,
    expirationBeforeStart: 120,
    autoCancel: true,
    notifications: {
      expiringSoon: true,
      expired: true,
      paid: true,
    },
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/deposits/config", config);
      alert("Configuración guardada correctamente");
    } catch (error) {
      alert(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Configuración de Señas</h2>
          <p className="text-sm text-dark-600 mt-1">
            Ajustá los parámetros del sistema de depósitos
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {/* Secciones de configuración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Montos */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Configuración de Montos
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-2">
                Porcentaje de seña (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config.depositPercentage}
                onChange={(e) =>
                  setConfig({ ...config, depositPercentage: Number(e.target.value) })
                }
                className="input w-full"
              />
              <p className="text-xs text-dark-500 mt-1">
                Porcentaje del precio del servicio que se requiere como seña
              </p>
            </div>
          </div>
        </div>

        {/* Tiempos */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-400" />
            Configuración de Tiempos
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-800 mb-2">
                Tiempo de hold (minutos)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={config.holdMinutes}
                onChange={(e) =>
                  setConfig({ ...config, holdMinutes: Number(e.target.value) })
                }
                className="input w-full"
              />
              <p className="text-xs text-dark-500 mt-1">
                Tiempo máximo para pagar la seña antes de liberar el turno
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-800 mb-2">
                Expiración anticipada (minutos)
              </label>
              <input
                type="number"
                min="30"
                max="1440"
                value={config.expirationBeforeStart}
                onChange={(e) =>
                  setConfig({ ...config, expirationBeforeStart: Number(e.target.value) })
                }
                className="input w-full"
              />
              <p className="text-xs text-dark-500 mt-1">
                La seña expira antes del turno si falta menos de este tiempo
              </p>
            </div>
          </div>
        </div>

        {/* Automatización */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            Automatización
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.autoCancel}
                onChange={(e) =>
                  setConfig({ ...config, autoCancel: e.target.checked })
                }
                className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-dark-900">
                  Cancelación automática
                </div>
                <div className="text-xs text-dark-600">
                  Cancelar turnos cuando expira el tiempo de hold
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-dark-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Notificaciones
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.expiringSoon}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      expiringSoon: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-dark-900">
                  Señas por vencer
                </div>
                <div className="text-xs text-dark-600">
                  Notificar cuando una seña está próxima a expirar
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.expired}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      expired: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-dark-900">
                  Señas vencidas
                </div>
                <div className="text-xs text-dark-600">
                  Notificar cuando una seña ha expirado
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.notifications.paid}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notifications: {
                      ...config.notifications,
                      paid: e.target.checked,
                    },
                  })
                }
                className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <div className="text-sm font-medium text-dark-900">
                  Pagos recibidos
                </div>
                <div className="text-xs text-dark-600">
                  Notificar cuando se recibe un pago de seña
                </div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// VISTA DE ACTIVIDAD
// ============================================

function ActivityView() {
  const { data: activities, loading } = useQuery(
    () => api.get("/deposits/activity").then((r) => r.data.data),
    []
  );

  const getActivityIcon = (type) => {
    const icons = {
      deposit_paid: CheckCircle2,
      deposit_expired: XCircle,
      deposit_extended: Clock,
      appointment_cancelled: XCircle,
      config_changed: Settings,
    };
    return icons[type] || Activity;
  };

  const getActivityColor = (type) => {
    const colors = {
      deposit_paid: "text-emerald-400",
      deposit_expired: "text-red-400",
      deposit_extended: "text-amber-400",
      appointment_cancelled: "text-red-400",
      config_changed: "text-primary-400",
    };
    return colors[type] || "text-dark-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-900">Registro de Actividad</h2>
          <p className="text-sm text-dark-600 mt-1">
            Historial de acciones y eventos del sistema de señas
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtrar
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>
      </div>

      {/* Timeline de actividad */}
      <div className="card p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="text-center py-12 text-dark-600">
            No hay actividad registrada
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const colorClass = getActivityColor(activity.type);

              return (
                <div
                  key={activity.id || index}
                  className="flex gap-4 pb-4 border-b border-dark-200/30 last:border-0 last:pb-0"
                >
                  <div className={`p-2 rounded-xl bg-dark-200/50 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div className="font-medium text-dark-900">
                        {activity.description}
                      </div>
                      <div className="text-xs text-dark-500">
                        {new Date(activity.created_at).toLocaleString("es-AR")}
                      </div>
                    </div>
                    {activity.details && (
                      <div className="text-sm text-dark-600">{activity.details}</div>
                    )}
                    {activity.user && (
                      <div className="text-xs text-dark-500 mt-1">
                        Por: {activity.user}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DepositsPage() {
  const [activeTab, setActiveTab] = useState("deposits"); // deposits | config | activity
  const [includeExpired, setIncludeExpired] = useState(false);
  const [refreshKey, setRefresh] = useState(0);

  // Dashboard stats
  const { data: dashboard, loading: loadingDash } = useQuery(
    () => api.get("/deposits/dashboard").then((r) => r.data.data),
    [refreshKey]
  );

  // Pending deposits
  const { data: deposits, loading: loadingDeposits } = useQuery(
    () =>
      api
        .get("/deposits/pending", {
          params: { includeExpired: includeExpired ? "true" : "false" },
        })
        .then((r) => r.data.data),
    [includeExpired, refreshKey]
  );

  const handleAction = async (depositId, action) => {
    const endpoints = {
      markPaid: `/deposits/${depositId}/mark-paid`,
      cancel: `/deposits/${depositId}/cancel`,
      extend: `/deposits/${depositId}/extend`,
      remind: `/deposits/${depositId}/remind`,
    };

    await api.post(endpoints[action]);
  };

  const handleRefresh = () => setRefresh((k) => k + 1);

  // Auto-refresh cada 30 segundos
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
            Monitoreo en tiempo real de pagos y configuración del sistema
          </p>
        </div>
        <button onClick={handleRefresh} className="btn-primary">
          <RefreshCw className={`w-4 h-4 ${loadingDash ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton
          active={activeTab === "deposits"}
          onClick={() => setActiveTab("deposits")}
          icon={DollarSign}
          label="Depósitos"
          badge={stats.pendingActive || 0}
        />
        <TabButton
          active={activeTab === "config"}
          onClick={() => setActiveTab("config")}
          icon={Settings}
          label="Configuración"
        />
        <TabButton
          active={activeTab === "activity"}
          onClick={() => setActiveTab("activity")}
          icon={Activity}
          label="Actividad"
        />
      </div>

      {/* Contenido según tab activo */}
      {activeTab === "deposits" && (
        <>
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
        </>
      )}

      {activeTab === "config" && <ConfigurationView />}
      {activeTab === "activity" && <ActivityView />}
    </div>
  );
}