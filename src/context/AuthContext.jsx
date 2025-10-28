import { createContext, useContext, useEffect, useState } from "react";
import { authApi, getAccessToken, setAccessToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Al montar, intenta recuperar la sesión desde localStorage + /auth/me
  useEffect(() => {
    const init = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          const { ok, user } = await authApi.me();
          if (ok) setUser(user);
        }
      } catch {
        setAccessToken(null); // si el token no sirve, lo limpiamos
      } finally {
        setAuthLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    if (data?.ok) setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizado que simplifica el acceso al contexto
export function useAuth() {
  return useContext(AuthContext);
}
