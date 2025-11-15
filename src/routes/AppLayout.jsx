// src/routes/AppLayout.jsx
import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../api/client";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import BranchSelector from "../components/BranchSelector";
import { useQuery } from "../shared/useQuery";
import { useApp } from "../context/UseApp.js";
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
  UserRound,
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
      professionals: "Instructores",
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
  const { features } = useApp();

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

  const featureFlags = useMemo(
    () => ({
      ...(DEFAULT_FEATURES_BY_BUSINESS[businessTypeCode] || {}),
      ...tenantFeatures,
      ...features,
    }),
    [tenantFeatures, businessTypeCode, features]
  );

  const navItems = [
    { to: `${base}/dashboard`, label: "Dashboard", icon: LayoutDashboard, active: pathname === `${base}/dashboard` },
    { to: `${base}/appointments`, label: navLabels.appointments, icon: Calendar, active: pathname.startsWith(`${base}/appointments`) },
    { to: `${base}/classes`, label: navLabels.classes, icon: GraduationCap, active: pathname.startsWith(`${base}/classes`), featureKey: "classes" },
    { to: `${base}/customers`, label: navLabels.customers, icon: Users, active: pathname.startsWith(`${base}/customers`) },
    { to: `${base}/deposits`, label: navLabels.deposits, icon: DollarSign, active: pathname.startsWith(`${base}/deposits`) },
    {
      to: `${base}/stock/products`,
      label: "Stock",
      icon: Package,
      active: pathname.startsWith(`${base}/stock`),
      module: "stock",
      featureKey: "stock",
    },
    {
      to: `${base}/invoicing`,
      label: "Facturación",
      icon: FileText,
      active: pathname.startsWith(`${base}/invoicing`),
      module: "invoicing",
      featureKey: "invoicing",
    },
    { to: `${base}/notifications`, label: "Notificaciones", icon: Bell, active: pathname.startsWith(`${base}/notifications`), badge: unreadCount > 0 ? unreadCount : null },
    { to: `${base}/users`, label: "Usuarios", icon: Users, active: pathname.startsWith(`${base}/users`), adminOnly: true },
    { to: `${base}/admin/instructores`, label: navLabels.professionals, icon: UserRound, active: pathname.startsWith(`${base}/admin/instructores`), adminOnly: true },
    { to: `${base}/admin/branches`, label: "Sucursales", icon: Building2, active: pathname.startsWith(`${base}/admin/branches`), adminOnly: true },
    { to: `${base}/admin/config`, label: "Configuración", icon: Settings, active: pathname.startsWith(`${base}/admin/config`), adminOnly: true },
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== "admin") return false;
    
    if (item.featureKey && featureFlags?.[item.featureKey] === false) {
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
    <div className="arja-shell">
      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`arja-sidebar ${sidebarOpen ? "is-open" : ""}`}
        style={{
          background:
            "linear-gradient(190deg, rgba(6, 14, 28, 0.98), rgba(9, 24, 44, 0.98))",
          borderRight: "1px solid rgba(24, 118, 168, 0.3)",
          boxShadow: "18px 0 40px rgba(4, 10, 20, 0.55)",
        }}
      >
        {/* Logo Header */}
        <div className="arja-sidebar__section arja-sidebar__header">
          <Logo size="default" showText={true} />
          <button
            onClick={() => setSidebarOpen(false)}
            type="button"
            className="arja-sidebar__close"
            aria-label="Cerrar menú"
          >
            <X />
          </button>
        </div>

        {/* Tenant Info */}
        {tenant && (
          <div className="arja-sidebar__section space-y-3">
            <div className="arja-tenant-card">
              <span className="arja-tenant-card__icon">
                <Building2 />
              </span>
              <div className="arja-tenant-card__body">
                <p className="arja-tenant-card__title">Negocio</p>
                <p className="arja-tenant-card__value">
                  {tenant.is_system ? "Panel Global" : tenant.name || tenant.subdomain || `#${tenant.id}`}
                </p>
              </div>
            </div>
            {!tenant.is_system ? <BranchSelector /> : null}
          </div>
        )}

        {/* Navigation */}
        <nav className="arja-nav">
          {filteredNavItems.map((item) => (
            <SidebarNavButton
              key={item.to}
              {...item}
              onClick={() => setSidebarOpen(false)}
            />
          ))}
        </nav>

        {/* User Section */}
        <div className="arja-sidebar__footer">
          {/* Theme Toggle */}
          <div className="arja-sidebar__theme">
            <span>Tema</span>
            <ThemeToggle />
          </div>

          {user?.isSuperAdmin && (
            <Link
              to="/super-admin/tenants"
              className="arja-sidebar__superadmin"
            >
              <Shield />
              <span>Panel del dueño</span>
            </Link>
          )}

          {/* User Info */}
          <div className="arja-user-card">
            <div className="arja-user-card__avatar">
              <span>
                {user?.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="arja-user-card__info">
              <p className="arja-user-card__name">
                {user?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="arja-user-card__role">{user?.role}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="arja-sidebar__logout"
          >
            <LogOut />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="arja-main">
        {/* Mobile Header */}
        <header className="arja-main__header arja-main__header--mobile">
          <div className="arja-main__header-inner">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              className="arja-main__menu"
              aria-label="Abrir menú"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Logo size="small" showText={true} />
            <div className="w-10" /> {/* Spacer para centrar */}
          </div>
        </header>

        {/* Main Content */}
        <main className="arja-main__content">
          <div className="arja-main__content-inner">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="arja-main__footer">
          © {new Date().getFullYear()} — ARJA ERP
          <small>
            Sistema de Gestión v2.0{" "}
            {tenant ? `• ${tenant.is_system ? "Panel Global" : tenant.name || tenant.subdomain}` : ""}
          </small>
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
      className={`arja-nav-link ${active ? "is-active" : ""}`}
    >
      <Icon />
      <span>{label}</span>
      {badge && (
        <span className="arja-nav-link__badge">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </NavLink>
  );
}