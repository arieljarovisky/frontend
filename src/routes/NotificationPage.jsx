// src/routes/NotificationsPage.jsx
import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  RefreshCw,
  Calendar,
  DollarSign,
  AlertTriangle,
  Info,
  X,
  Filter
} from "lucide-react";

// Configuración de iconos y colores por tipo de notificación
const NOTIFICATION_CONFIG = {
  new_appointment: {
    icon: Calendar,
    color: "from-primary-600/20 to-primary-600/5 border-primary-600/30",
    iconColor: "text-primary-400",
  },
  deposit_paid: {
    icon: DollarSign,
    color: "from-emerald-600/20 to-emerald-600/5 border-emerald-600/30",
    iconColor: "text-emerald-400",
  },
  appointment_cancelled: {
    icon: X,
    color: "from-red-600/20 to-red-600/5 border-red-600/30",
    iconColor: "text-red-400",
  },
  deposit_pending: {
    icon: AlertTriangle,
    color: "from-amber-600/20 to-amber-600/5 border-amber-600/30",
    iconColor: "text-amber-400",
  },
  default: {
    icon: Info,
    color: "from-slate-600/20 to-slate-600/5 border-slate-600/30",
    iconColor: "text-slate-400",
  },
};

function NotificationCard({ notification, onMarkRead, onDelete, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.default;
  const Icon = config.icon;

  const handleMarkRead = async () => {
    if (loading || notification.is_read) return;
    setLoading(true);
    try {
      await onMarkRead(notification.id);
      onRefresh();
      toast.success("Notificación marcada como leída");
    } catch (error) {
      toast.error(error.message || "Error al marcar notificación");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (loading) return;
    if (!confirm("¿Eliminar esta notificación?")) return;
    
    setLoading(true);
    try {
      await onDelete(notification.id);
      onRefresh();
      toast.success("Notificación eliminada");
    } catch (error) {
      toast.error(error.message || "Error al eliminar notificación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`
        card p-4 transition-all hover:shadow-dark-lg
        ${!notification.is_read ? 'ring-2 ring-primary-500/30' : ''}
      `}
    >
      <div className="flex gap-4">
        {/* Icono */}
        <div className={`
          p-3 rounded-xl bg-gradient-to-br ${config.color} border flex-shrink-0
        `}>
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-dark-900 flex items-center gap-2">
              {notification.title}
              {!notification.is_read && (
                <span className="inline-block w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              )}
            </h3>
            <span className="text-xs text-dark-500 whitespace-nowrap">
              {formatRelativeTime(notification.created_at)}
            </span>
          </div>

          <p className="text-sm text-dark-700 mb-3">
            {notification.message}
          </p>

          {/* Datos adicionales */}
          {notification.data && (
            <div className="text-xs text-dark-500 mb-3">
              {notification.data.appointmentId && (
                <span>Turno #{notification.data.appointmentId}</span>
              )}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {!notification.is_read && (
              <button
                onClick={handleMarkRead}
                disabled={loading}
                className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Marcar leída
              </button>
            )}
            <button
              onClick={handleDelete}
              disabled={loading}
              className="btn-ghost text-xs px-3 py-1.5 flex items-center gap-1 text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-3 h-3" />
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unread
  const [refreshKey, setRefreshKey] = useState(0);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = filter === "unread" ? "?unreadOnly=true" : "";
      const res = await apiClient.get(`/api/notifications${params}`);
      setNotifications(res.data?.data || []);
    } catch (error) {
      toast.error("Error al cargar notificaciones");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const res = await apiClient.get("/api/notifications/count");
      setUnreadCount(res.data?.count || 0);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, [filter, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
  };

  const handleMarkRead = async (id) => {
    await apiClient.put(`/api/notifications/${id}/read`);
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put("/api/notifications/read-all");
      toast.success("Todas las notificaciones marcadas como leídas");
      handleRefresh();
    } catch (error) {
      toast.error("Error al marcar todas las notificaciones");
    }
  };

  const handleDelete = async (id) => {
    await apiClient.delete(`/api/notifications/${id}`);
  };

  const filteredNotifications = notifications;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary-400" />
            Notificaciones
          </h1>
          <p className="text-dark-600 mt-1">
            Mantente al día con las actualizaciones del sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCheck className="w-4 h-4" />
              Marcar todas leídas
            </button>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-600/10">
              <Bell className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm text-dark-600">Total</p>
              <p className="text-2xl font-bold text-dark-900">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-600/10">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-dark-600">Sin leer</p>
              <p className="text-2xl font-bold text-dark-900">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-600/10">
              <CheckCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-dark-600">Leídas</p>
              <p className="text-2xl font-bold text-dark-900">
                {notifications.length - unreadCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-dark-500" />
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === "all"
              ? "bg-gradient-primary text-white shadow-glow"
              : "text-dark-700 hover:text-dark-900 hover:bg-dark-200/50"
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filter === "unread"
              ? "bg-gradient-primary text-white shadow-glow"
              : "text-dark-700 hover:text-dark-900 hover:bg-dark-200/50"
          }`}
        >
          Sin leer ({unreadCount})
        </button>
      </div>

      {/* Lista de notificaciones */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-dark-400" />
            <p className="text-dark-600 mb-2">
              {filter === "unread" 
                ? "No tenés notificaciones sin leer" 
                : "No tenés notificaciones"
              }
            </p>
            <p className="text-sm text-dark-500">
              Te avisaremos cuando haya novedades
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Helper para formatear tiempo relativo
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins}min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
  });
}