// src/routes/AppLayout.jsx
import React, { useState, useEffect, useMemo } from "react";
import { apiClient } from "../api/client";
import { Link, NavLink, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import BranchSelector from "../components/BranchSelector";
import TrialWarning from "../components/TrialWarning";
import TrialExpiredBlock from "../components/TrialExpiredBlock";
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
  Shield,
  Receipt,
  BookOpen
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
  const authContext = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { features } = useApp();

  // Obtener tipo de negocio - debe ejecutarse antes de cualquier return condicional
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

  // Extraer valores del contexto de forma segura
  const user = authContext?.user || null;
  const tenant = authContext?.tenant || null;
  const logout = authContext?.logout || (() => {});
  const authLoaded = authContext?.authLoaded || false;

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

  // Cargar contador de notificaciones - debe ejecutarse antes de cualquier return condicional
  useEffect(() => {
    if (!authLoaded || !authContext) return;
    
    const loadUnreadCount = async () => {
      try {
        const result = await apiClient.getUnreadCount();
        setUnreadCount(result?.count || 0);
      } catch (error) {
        console.error("Error loading unread count:", error);
        setUnreadCount(0);
      }
    };
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Actualizar cada 30 segundos
    return () => clearInterval(interval);
  }, [authLoaded, authContext]);

  const featureFlags = useMemo(
    () => ({
      ...(DEFAULT_FEATURES_BY_BUSINESS[businessTypeCode] || {}),
      ...tenantFeatures,
      ...features,
    }),
    [tenantFeatures, businessTypeCode, features]
  );

  const handleLogout = async () => {
    if (logout) {
      await logout();
      navigate("/login");
    }
  };

  // Manejar el caso cuando el contexto de autenticación no está disponible
  if (!authContext) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-foreground-muted">Cargando...</p>
        </div>
      </div>
    );
  }

  // Esperar a que la autenticación se cargue
  if (!authLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-foreground-muted">Cargando...</p>
        </div>
      </div>
    );
  }

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
    {
      to: `${base}/cash-register`,
      label: "Cierre de Caja",
      icon: Receipt,
      active: pathname.startsWith(`${base}/cash-register`),
      adminOnly: true,
    },
    {
      to: `${base}/accounting`,
      label: "Registro Contable",
      icon: BookOpen,
      active: pathname.startsWith(`${base}/accounting`),
      adminOnly: true,
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
        className={`arja-sidebar ${sidebarOpen ? "is-open" : ""} bg-background border-r border-border shadow-2xl`}
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
        {/* Trial Warning Banner */}
        <TrialWarning />

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
            <TrialExpiredBlock>
            <div className="animate-fade-in">
              <Outlet />
            </div>
            </TrialExpiredBlock>
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
  const authContext = useAuth();
  const user = authContext?.user || null;
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