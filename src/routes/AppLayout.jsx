// src/routes/AppLayout.jsx - Con navegación a estadísticas
import React from "react";
import { useState, useEffect } from "react";
import { apiClient } from "../api/client";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  Activity,
  TrendingUp
} from "lucide-react";

export default function AppLayout() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };
  const [unreadCount, setUnreadCount] = useState(0);

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

    // Actualizar cada 30 segundos
    const interval = setInterval(loadUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, active: pathname === "/" },
    { to: "/appointments", label: "Calendario", icon: Calendar, active: pathname === "/appointments" },
    { to: "/customers", label: "Clientes", icon: Users, active: pathname.startsWith("/customers") },
    { to: "/deposits", label: "Depósitos", icon: DollarSign, active: pathname === "/deposits" },
    // NUEVA: Notificaciones
    {
      to: "/notifications",
      label: "Notificaciones",
      icon: Bell,
      active: pathname === "/notifications",
      badge: unreadCount > 0 ? unreadCount : null
    },
    // NUEVA: Estadísticas de peluqueros
    {
      to: "/admin/stats",
      label: "Estadísticas",
      icon: TrendingUp,
      active: pathname === "/admin/stats",
      adminOnly: true
    },
    {
      to: "/admin/config",
      label: "Configuración",
      icon: Settings,
      active: pathname === "/admin/config",
      adminOnly: true
    },
  ];

  // Filtrar elementos según el rol del usuario
  const filteredNavItems = navItems.filter(item => {
    if (item.adminOnly && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col ">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-dark-200/50" data-appbar>
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">P</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gradient">Pelu Admin</h1>
                <p className="text-xs text-dark-600">Sistema de Gestión</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {filteredNavItems.map((item) => (
                <NavButton key={item.to} {...item} />
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* User Menu */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-200/50">
                <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </span>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-dark-900 leading-none">
                    {user?.full_name || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-xs text-dark-600">{user?.role}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-dark-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-dark-600 hover:text-dark-900 hover:bg-dark-200/50"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-dark-200/50 animate-slide-down">
              <div className="space-y-1">
                {filteredNavItems.map((item) => (
                  <MobileNavButton
                    key={item.to}
                    {...item}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1  max-w-[1800px] w-full mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-dark-200/50 text-center text-sm text-zinc-400 bg-slate-950/50">
        <div className="max-w-[1800px] mx-auto px-4">
          <p>© 2025 — Pelu de Barrio</p>
          <p className="text-xs text-zinc-600 mt-1">Sistema de Gestión v2.0</p>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ to, label, icon: Icon, active, badge }) {
  return (
    <NavLink
      to={to}
      className={`
        relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${active
          ? "bg-gradient-primary text-white shadow-glow"
          : "text-dark-700 hover:text-dark-900 hover:bg-dark-200/50"
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {badge && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function MobileNavButton({ to, label, icon: Icon, active, onClick, badge }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
        ${active
          ? "bg-gradient-primary text-white shadow-glow"
          : "text-dark-700 hover:text-dark-900 hover:bg-dark-200/50"
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
      {badge && (
        <span className="ml-auto w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
          {badge}
        </span>
      )}
    </NavLink>
  );
}