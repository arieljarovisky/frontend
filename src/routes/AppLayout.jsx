// src/routes/AppLayout.jsx
import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../api/client";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import { useQuery } from "../shared/useQuery";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  LogOut,
  Menu,
  X,
  Settings,
  Bell,
  Scissors,
  Building2,
  Package,
  FileText,
  GraduationCap,
  Shield
} from "lucide-react";

const DEFAULT_FEATURES_BY_BUSINESS = {
  salon: { classes: false },
  gym: { classes: true },
  pilates: { classes: true },
  kinesiology: { classes: false },
  spa: { classes: false },
  other: { classes: false },
};

// Mapeo de nombres según el tipo de negocio
const getNavigationLabels = (businessTypeCode) => {
  const labels = {
    salon: {
      appointments: "Turnos",
      classes: "Clases",
      professionals: "Peluqueros",
      customers: "Clientes",
      deposits: "Depósitos",
    },
    gym: {
      appointments: "Clases",
      classes: "Clases",
      professionals: "Instructores",
      customers: "Socios",
      deposits: "Pagos",
    },
    kinesiology: {
      appointments: "Sesiones",
      classes: "Clases",
      professionals: "Kinesiólogos",
      customers: "Pacientes",
      deposits: "Pagos",
    },
    pilates: {
      appointments: "Clases",
      classes: "Clases",
      professionals: "Instructores",
      customers: "Alumnos",
      deposits: "Pagos",
    },
    spa: {
      appointments: "Reservas",
      classes: "Clases",
      professionals: "Terapeutas",
      customers: "Clientes",
      deposits: "Señas",
    },
    other: {
      appointments: "Turnos",
      classes: "Clases",
      professionals: "Profesionales",
      customers: "Clientes",
      deposits: "Depósitos",
    },
  };

  return labels[businessTypeCode] || labels.other;
};

export default function AppLayout() {
  const { pathname } = useLocation();
  const { tenantSlug } = useParams();
  const base = `/${tenantSlug || ""}`;
  const { user, tenant, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Obtener tipo de negocio
  const { data: businessTypeData } = useQuery(
    async () => {
      try {
        const response = await apiClient.get("/api/business-types/tenant/business-type");
        return response.data?.data || null;
      } catch (error) {
        console.error("Error loading business type:", error);
        return null;
      }
    },
    []
  );

  const businessTypeCode = businessTypeData?.code || "salon";
  const navLabels = getNavigationLabels(businessTypeCode);

  const rawFeatures = businessTypeData?.features_config ?? businessTypeData?.featuresConfig;
  const tenantFeatures = useMemo(() => {
    if (!rawFeatures) return {};
    if (typeof rawFeatures === "string") {
      try {
        return JSON.parse(rawFeatures);
      } catch {
        return {};
      }
    }
    return typeof rawFeatures === "object" && rawFeatures != null ? rawFeatures : {};
  }, [rawFeatures]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Cargar contador de notificaciones
  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await apiClient.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error("Error loading unread count:", error);
      }
    };
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const enabledFeatures = useMemo(
    () => ({
      ...(DEFAULT_FEATURES_BY_BUSINESS[businessTypeCode] || {}),
      ...tenantFeatures,
    }),
    [tenantFeatures, businessTypeCode]
  );

  const navItems = [
    { to: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard, active: pathname === `${base}/dashboard` },
    { to: `${base}/appointments`, label: navLabels.appointments, icon: Calendar, active: pathname.startsWith(`${base}/appointments`) },
    { to: `${base}/classes`, label: navLabels.classes, icon: GraduationCap, active: pathname.startsWith(`${base}/classes`), featureKey: "classes" },
    { to: `${base}/customers`, label: navLabels.customers, icon: Users, active: pathname.startsWith(`${base}/customers`) },
    { to: `${base}/deposits`, label: navLabels.deposits, icon: DollarSign, active: pathname.startsWith(`${base}/deposits`) },
    { to: `${base}/stock/products`, label: "Stock", icon: Package, active: pathname.startsWith(`${base}/stock`), module: "stock" },
    { to: `${base}/invoicing`, label: "Facturación", icon: FileText, active: pathname.startsWith(`${base}/invoicing`), module: "invoicing" },
    { to: `${base}/notifications`, label: "Notificaciones", icon: Bell, active: pathname.startsWith(`${base}/notifications`), badge: unreadCount > 0 ? unreadCount : null },
    { to: `${base}/users`, label: "Usuarios", icon: Users, active: pathname.startsWith(`${base}/users`), adminOnly: true },
    { to: `${base}/admin/peluqueros`, label: navLabels.professionals, icon: Scissors, active: pathname.startsWith(`${base}/admin/peluqueros`), adminOnly: true },
    { to: `${base}/admin/config`, label: "Configuración", icon: Settings, active: pathname.startsWith(`${base}/admin/config`), adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== "admin") return false;
    
    if (item.featureKey && !enabledFeatures[item.featureKey]) {
      return false;
    }
    
    // Verificar permisos por módulo
    if (item.module) {
      const permissions = user?.permissions || {};
      const modulePerms = permissions[item.module] || [];
      if (user?.role !== "admin" && modulePerms.length === 0) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50
          w-64 lg:w-72
          h-screen
          bg-background border-r border-border
          flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <Logo size="default" showText={true} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Info */}
        {tenant && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary-light dark:bg-primary/20 border border-primary/30">
              <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-foreground-muted leading-none">Sucursal</p>
                <p className="text-sm font-medium text-foreground truncate">
                  {tenant.is_system ? "Panel Global" : tenant.name || tenant.subdomain || `#${tenant.id}`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
          {filteredNavItems.map((item) => (
            <SidebarNavButton
              key={item.to}
              {...item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background-secondary">
            <span className="text-sm text-foreground-secondary">Tema</span>
            <ThemeToggle />
          </div>

          {user?.isSuperAdmin && (
            <Link
              to="/super-admin/tenants"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-all"
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Panel del dueño</span>
            </Link>
          )}

          {/* User Info */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background-secondary">
            <div className="w-10 h-10 rounded-lg bg-blue-900 dark:bg-blue-700 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-sm font-semibold">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-foreground-muted capitalize">{user?.role}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-foreground-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col min-w-0 lg:ml-72 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 glass-strong border-b border-border">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Logo size="small" showText={true} />
            <div className="w-10" /> {/* Spacer para centrar */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-4 sm:py-6 border-t border-border text-center text-xs sm:text-sm text-foreground-muted bg-background-secondary">
          <div className="max-w-[1800px] mx-auto px-4 sm:px-6">
            <p>© {new Date().getFullYear()} — Agendly ERP</p>
            <p className="text-[10px] sm:text-xs text-foreground-muted mt-1">
              Sistema de Gestión v2.0{" "}
              {tenant ? `• ${tenant.is_system ? "Panel Global" : tenant.name || tenant.subdomain}` : ""}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function SidebarNavButton({ to, label, icon: Icon, active, onClick, badge, module }) {
  // Verificar permisos por módulo
  const { user } = useAuth();
  const permissions = user?.permissions || {};
  const modulePerms = permissions[module] || [];
  
  // Si tiene módulo y no es admin, verificar permisos
  if (module && user?.role !== "admin" && modulePerms.length === 0) {
    return null;
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
        ${active
          ? "bg-blue-900 dark:bg-blue-700 text-white shadow-md"
          : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
        }
      `}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shadow-md">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
      {/* Indicador activo */}
      {active && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
      )}
    </NavLink>
  );
}