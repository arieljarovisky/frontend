import { createContext, useContext, useEffect, useState } from "react";
import { authApi, getAccessToken, setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const { ok, user } = await authApi.me();
          if (ok) setUser(user);
        }
      } catch {
        setAccessToken(null);
      } finally {
        setAuthLoaded(true);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data?.ok && data?.access) {
      setUser(data.user);
      return { success: true };
    }
    if (data?.ok && data?.multiTenant) {
      return { success: false, multiTenant: true, tenants: data.tenants, email: data.email };
    }
    return { success: false, error: data?.error || "Error de login" };
  };

  const loginTenant = async (email, password, slug) => {
    const data = await authApi.loginTenant(email, password, slug);
    if (data?.ok && data?.access) {
      setUser(data.user);
      return { success: true };
    }
    return { success: false, error: data?.error || "Error de login" };
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authLoaded, login, loginTenant, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
