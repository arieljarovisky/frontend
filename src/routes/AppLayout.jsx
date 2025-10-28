// src/routes/AppLayout.jsx
import React, { useState } from "react";
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
  Bell
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

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, active: pathname === "/" },
    { to: "/appointments", label: "Calendario", icon: Calendar, active: pathname === "/appointments" },
    { to: "/customers", label: "Clientes", icon: Users, active: pathname.startsWith("/customers") },
    { to: "/deposits", label: "Depósitos", icon: DollarSign, active: pathname === "/deposits" },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-dark-200/50">
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
              {navItems.map((item) => (
                <NavButton key={item.to} {...item} />
              ))}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl text-dark-600 hover:text-dark-900 hover:bg-dark-200/50 transition-all">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {/* Settings */}
              <button className="p-2 rounded-xl text-dark-600 hover:text-dark-900 hover:bg-dark-200/50 transition-all">
                <Settings className="w-5 h-5" />
              </button>

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
                {navItems.map((item) => (
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
      <main className="max-w-[1600px] mx-auto px-4 lg:px-6 py-6 lg:py-8">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-dark-200/50 bg-dark-100/30 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-dark-600">
            <p>© {new Date().getFullYear()} Pelu de Barrio • Sistema de Gestión v2.0</p>
            <p>Desarrollado con 💙</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function NavButton({ to, label, icon: Icon, active }) {
  return (
    <NavLink
      to={to}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
        ${
          active
            ? "bg-gradient-primary text-white shadow-glow"
            : "text-dark-700 hover:text-dark-900 hover:bg-dark-200/50"
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </NavLink>
  );
}

function MobileNavButton({ to, label, icon: Icon, active, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
        ${
          active
            ? "bg-gradient-primary text-white shadow-glow"
            : "text-dark-700 hover:text-dark-900 hover:bg-dark-200/50"
        }
      `}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </NavLink>
  );
}