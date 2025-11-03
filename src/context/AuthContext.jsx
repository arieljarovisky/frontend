import { createContext, useContext, useEffect, useState } from "react";
import { authApi, getAccessToken, setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
        const { ok, user } = await authApi.me();

        if (ok && user) {
          setUser(user);
        } else {
          // Token inválido, limpiar
          setAccessToken(null);
        }
      } catch (err) {
        console.error("[AuthContext] Error inicializando sesión:", err);
        setAccessToken(null);
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
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authLoaded,
        login,
        loginTenant,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}