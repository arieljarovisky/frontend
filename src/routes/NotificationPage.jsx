// src/routes/NotificationsPage.jsx - Con paginado
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
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
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

// Componente de Paginación
function Pagination({ currentPage, totalPages, totalItems, itemsPerPage, onPageChange }) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar array de números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Mostrar todas las páginas
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Mostrar páginas con ellipsis
      if (currentPage <= 3) {
        // Cerca del inicio
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Cerca del final
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        // En el medio
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-dark-200/50">
      {/* Info de items */}
      <div className="text-sm text-dark-600">
        Mostrando <span className="font-medium text-dark-900">{startItem}</span> a{" "}
        <span className="font-medium text-dark-900">{endItem}</span> de{" "}
        <span className="font-medium text-dark-900">{totalItems}</span> notificaciones
      </div>

      {/* Controles de paginación */}
      <div className="flex items-center gap-2">
        {/* Primera página */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-dark-300 hover:bg-dark-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Página anterior */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-dark-300 hover:bg-dark-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números de página */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, idx) => (
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-3 py-2 text-dark-500">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all
                  ${currentPage === page
                    ? 'bg-gradient-primary text-white shadow-glow'
                    : 'border border-dark-300 hover:bg-dark-200/50 text-dark-700'
                  }
                `}
              >
                {page}
              </button>
            )
          ))}
        </div>

        {/* Indicador móvil */}
        <div className="sm:hidden px-3 py-2 rounded-lg border border-dark-300 text-sm font-medium">
          {currentPage} / {totalPages}
        </div>

        {/* Página siguiente */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-dark-300 hover:bg-dark-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Última página */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-dark-300 hover:bg-dark-200/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
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
  
  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = filter === "unread" ? "?unreadOnly=true" : "";
      const res = await apiClient.get(`/api/notifications${params}`);
      setNotifications(res.data?.data || []);
      // Reset a página 1 cuando cambia el filtro
      setCurrentPage(1);
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

  // Cálculos de paginación
  const totalItems = notifications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNotifications = notifications.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll suave al inicio de la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

      {/* Lista de notificaciones con paginación */}
      <div className="card p-6">
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-500" />
            </div>
          ) : currentNotifications.length === 0 ? (
            <div className="py-12 text-center">
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
            <>
              {currentNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                  onRefresh={handleRefresh}
                />
              ))}
              
              {/* Componente de paginación */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
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