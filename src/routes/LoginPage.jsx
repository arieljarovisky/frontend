import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
import {
  authApi,
  setAccessToken,
  setTenantId,
  setAuthEmail,
  setUserData,
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";

function safeNextParam(search) {
  const next = new URLSearchParams(search).get("next");
  return next && next.startsWith("/") ? next : null;
}

export default function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, authLoaded } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Multi-tenant
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [availableTenants, setAvailableTenants] = useState([]);

  const goAfterLogin = (resp, fallbackSlug) => {
    const next = safeNextParam(location.search);
    const isSuperAdmin = resp?.user?.isSuperAdmin || resp?.user?.is_super_admin;
    const slug = resp?.tenant?.slug || fallbackSlug || null;
    const defaultDest = isSuperAdmin
      ? "/super-admin/tenants"
      : slug
      ? `/${slug}/dashboard`
      : "/login";
    const dest = next || defaultDest;
    window.location.replace(dest);
  };

  useEffect(() => {
    if (!authLoaded || !user) return;

    const isSuperAdmin = user?.isSuperAdmin || user?.is_super_admin;
    if (isSuperAdmin) {
      if (!location.pathname.startsWith("/super-admin")) {
        navigate("/super-admin/tenants", { replace: true });
      }
      return;
    }

    if (user?.tenant?.slug) {
      navigate(`/${user.tenant.slug}/dashboard`, { replace: true });
    }
  }, [authLoaded, user, navigate, location.pathname]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resp = await authApi.login(email, password);

      if (!resp?.ok) {
        setError(resp?.error || "Credenciales incorrectas");
        setLoading(false);
        return;
      }

      if (resp.multiTenant) {
        const tenants = resp.tenants || [];
        if (resp.isSuperAdmin) {
          const systemTenant = tenants.find(
            (t) => t.is_system || t.slug === "system"
          );
          if (systemTenant) {
            await handleTenantSelect(systemTenant.slug);
            return;
          }
        }
        setAvailableTenants(tenants);
        setShowTenantSelector(true);
        setLoading(false);
        return;
      }

      if (resp.access) setAccessToken(resp.access);
      if (resp.user) setUserData(resp.user);
      if (resp.tenant?.id) setTenantId(resp.tenant.id);
      setAuthEmail(resp?.user?.email || email);

      goAfterLogin(resp);
    } catch (err) {
      console.error("Error en login:", err);
      
      // Extraer mensaje de error del backend si está disponible
      let errorMessage = "No se pudo conectar con el servidor";
      
      if (err?.response?.data?.error) {
        // Error del backend con mensaje específico
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        // Error de red o axios
        if (err.message.includes("Network Error") || err.message.includes("timeout")) {
          errorMessage = "No se pudo conectar con el servidor. Verificá tu conexión a internet.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantSelect = async (slug) => {
    setError("");
    setLoading(true);
    try {
      const resp = await authApi.loginTenant(email, password, slug);

      if (!resp?.ok) {
        setError(resp?.error || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      if (resp.access) setAccessToken(resp.access);
      if (resp.user) setUserData(resp.user);
      if (resp.tenant?.id) setTenantId(resp.tenant.id);
      setAuthEmail(resp?.user?.email || email);

      goAfterLogin(resp, slug);
    } catch (err) {
      console.error("Error en login tenant:", err);
      
      // Extraer mensaje de error del backend si está disponible
      let errorMessage = "Error al conectar con el servidor";
      
      if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.message) {
        if (err.message.includes("Network Error") || err.message.includes("timeout")) {
          errorMessage = "No se pudo conectar con el servidor. Verificá tu conexión a internet.";
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (showTenantSelector) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="card p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-foreground">
                Seleccioná tu negocio
              </h2>
              <ThemeToggle />
            </div>

            <div className="space-y-3">
              {availableTenants.map((tenant) => (
                <button
                  key={tenant.slug}
                  onClick={() => handleTenantSelect(tenant.slug)}
                  disabled={loading}
                  className="w-full p-4 text-left rounded-lg border border-border bg-background-secondary hover:bg-border transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-foreground flex items-center gap-2">
                    {tenant.is_system && (
          <div className="flex justify-center">
            <Logo size="default" showText />
          </div>
                    )}
                    <span>
                      {tenant.name || tenant.slug}
                    </span>
                  </div>
                  <div className="text-sm text-foreground-muted">
                    {tenant.role}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowTenantSelector(false);
                setAvailableTenants([]);
              }}
              className="w-full text-sm text-foreground-secondary hover:text-foreground transition-colors"
            >
              ← Volver
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="card p-8 space-y-8">
          {/* Logo y título */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="default" showText />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Bienvenido
              </h1>
              <p className="text-foreground-muted">
                Iniciá sesión para continuar
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="input-group">
                <span className="input-group__icon">
                  <Mail />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input--with-icon"
                  placeholder="tu@email.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Contraseña
              </label>
              <div className="input-group">
                <span className="input-group__icon">
                  <Lock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input--with-icon input--with-icon-right"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-group__action"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42l-3.29-3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="text-center space-y-2 text-sm text-foreground-muted">
            <p>
              <button
                onClick={() => navigate("/forgot-password")}
                className="text-primary hover:text-primary-hover font-medium"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </p>
            <p>
              ¿Necesitás ayuda?{" "}
              <button
                onClick={() => navigate("/contact")}
                className="text-primary hover:text-primary-hover font-medium"
              >
                Contactanos
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



