import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, getAccessToken, setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Inicializa la sesión si hay token
  useEffect(() => {
    const init = async () => {
      try {
        const token = getAccessToken();

        if (!token) {
          // No hay token, usuario no autenticado
          setAuthLoaded(true);
          return;
        }

        // Validar token con el backend
        const { ok, user: userData, tenant: tenantData } = await authApi.me();

        if (ok && userData) {
          setUser(userData);
          setTenant(tenantData || null);
        } else {
          // Token inválido, limpiar
          setAccessToken(null);
          setTenant(null);
        }
      } catch (err) {
        console.error("[AuthContext] Error inicializando sesión:", err);
        setAccessToken(null);
        setTenant(null);
      } finally {
        setAuthLoaded(true);
      }
    };

    init();
  }, []);

  // ==== Métodos de login ====
  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data?.ok && data?.access) {
      setUser(data.user);
      setTenant(data.tenant || null);
      return { success: true, data };
    }
    if (data?.ok && data?.multiTenant) {
      return {
        success: false,
        multiTenant: true,
        tenants: data.tenants,
        email: data.email,
      };
    }
    return { success: false, error: data?.error || "Error de login" };
  };

  const loginTenant = async (email, password, slug) => {
    const data = await authApi.loginTenant(email, password, slug);
    if (data?.ok && data?.access) {
      setUser(data.user);
      setTenant(data.tenant || null);
      return { success: true, data };
    }
    return { success: false, error: data?.error || "Error de login" };
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn("[AuthContext] logout warning:", err.message);
    } finally {
      setUser(null);
      setAccessToken(null);
      setTenant(null);
      // Limpiar sessionStorage al cerrar sesión
      sessionStorage.removeItem('stockAlertsShown');
    }
  };

  const refreshSession = useCallback(async () => {
    try {
      const { ok, user: userData, tenant: tenantData } = await authApi.me();
      if (ok && userData) {
        setUser(userData);
        setTenant(tenantData || null);
        return { ok: true };
      }
      setUser(null);
      setTenant(null);
      setAccessToken(null);
      return { ok: false };
    } catch (err) {
      console.error("[AuthContext] refreshSession error:", err);
      setUser(null);
      setTenant(null);
      setAccessToken(null);
      return { ok: false, error: err?.message || "Error" };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        authLoaded,
        login,
        loginTenant,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}