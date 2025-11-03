// src/routes/LoginPage.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  authApi,
  setAccessToken,
  setTenantId,
  setAuthEmail,
  setUserData,
} from "../api/client";
import { useAuth } from "../context/AuthContext";


function safeNextParam(search) {
  const next = new URLSearchParams(search).get("next");
  // Solo permitir paths internos para evitar XSS
  return next && next.startsWith("/") ? next : null;
}

export default function LoginPage() {
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { user, authLoaded } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Multi-tenant
  const [showTenantSelector, setShowTenantSelector] = useState(false);
  const [availableTenants, setAvailableTenants] = useState([]);

  const goAfterLogin = (resp, fallbackSlug) => {
    const next = safeNextParam(location.search);

    // Si querés ir siempre a dashboard por tenant, podés cambiar esta línea:
    const slug = resp?.tenant?.slug || fallbackSlug || "default";
    const dest = next || `/${slug}/dashboard`;

    // Redirección dura para evitar efectos pendientes que hagan requests a /api
    window.location.replace(dest);
  };

  useEffect(() => {
    if (authLoaded && user?.tenant?.slug) {
      navigate(`/${user.tenant.slug}/`, { replace: true });
    }
  }, [authLoaded, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const resp = await authApi.login(email, password);

      if (!resp?.ok) {
        setError(resp?.error || "Credenciales incorrectas");
        return;
      }

      // Multi-tenant: mostrar lista de tenants
      if (resp.multiTenant) {
        setAvailableTenants(resp.tenants || []);
        setShowTenantSelector(true);
        return;
      }

      // Guardar sesión (reforzamos, aunque authApi.login ya lo hace)
      if (resp.access) setAccessToken(resp.access);
      if (resp.user) setUserData(resp.user);
      if (resp.tenant?.id) setTenantId(resp.tenant.id);
      setAuthEmail(resp?.user?.email || email);

      goAfterLogin(resp);
    } catch (err) {
      console.error("Error en login:", err);
      setError("No se pudo conectar con el servidor");
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
        return;
      }

      if (resp.access) setAccessToken(resp.access);
      if (resp.user) setUserData(resp.user);
      if (resp.tenant?.id) setTenantId(resp.tenant.id);
      setAuthEmail(resp?.user?.email || email);

      goAfterLogin(resp, slug);
    } catch (err) {
      console.error("Error en login tenant:", err);
      setError("Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  if (showTenantSelector) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Seleccioná tu negocio
          </h2>

          <div className="space-y-3">
            {availableTenants.map((tenant) => (
              <button
                key={tenant.slug}
                onClick={() => handleTenantSelect(tenant.slug)}
                disabled={loading}
                className="w-full p-4 bg-gray-900/50 border border-gray-700 rounded-xl hover:border-blue-500 transition-all text-left disabled:opacity-50"
              >
                <div className="text-white font-semibold">{tenant.slug}</div>
                <div className="text-sm text-gray-400">{tenant.role}</div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setShowTenantSelector(false);
              setAvailableTenants([]);
            }}
            className="w-full mt-4 text-gray-400 hover:text-white"
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-white mb-8">Iniciar Sesión</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 transition-all"
          >
            {loading ? "Cargando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
