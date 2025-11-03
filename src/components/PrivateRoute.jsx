// src/components/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children, roles }) {
  const { user, authLoaded } = useAuth();

  // Esperar carga de auth para decidir (evita flicker/loops)
  if (!authLoaded) return null; // o <Spinner />

  // No logueado → al login
  if (!user) return <Navigate to="/login" replace />;

  // Si hay restricción de roles
  if (Array.isArray(roles) && roles.length) {
    const ok = roles.includes(user.role);
    if (!ok) return <Navigate to="/login" replace />;
  }

  // Autorizado
  return children;
}
