// src/routes/LoginPage.jsx
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";

export default function LoginPage() {
  const { user, authLoaded, login, loginTenant } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const didNavigate = useRef(false);

  useEffect(() => {
    if (!authLoaded || !user || didNavigate.current) return;

    // Tené siempre un slug válido
    const tenant = user?.tenant?.slug || "default";
    const target = `/${tenant}`;

    // Evita navegar si ya estás en la ruta destino
    if (location.pathname !== target) {
      didNavigate.current = true;
      navigate(target, { replace: true });
    }
  }, [authLoaded, user, location.pathname, navigate]);

  // Mientras carga auth
  if (!authLoaded) return null;

  // Si ya hay user, no muestres el form (el guard va a dejarte pasar)
  if (user) return null;

  async function onSubmit(e) {
    e.preventDefault();
    const email = e.currentTarget.email.value;
    const password = e.currentTarget.password.value;
    const r = await login(email, password);
    if (!r.success && !r.multiTenant) {
      alert(r.error || "Error de login");
    }
    // si r.multiTenant, mostrás tu selector y luego llamás a loginTenant(...)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <form onSubmit={onSubmit} className="bg-slate-900 p-6 rounded-xl w-80">
        <h1 className="text-xl font-semibold mb-4">Iniciar sesión</h1>
        <input name="email" type="email" placeholder="Email" className="w-full mb-3 p-2 rounded bg-slate-800" />
        <input name="password" type="password" placeholder="Contraseña" className="w-full mb-4 p-2 rounded bg-slate-800" />
        <button className="w-full p-2 rounded bg-indigo-600 hover:bg-indigo-700">Entrar</button>
      </form>
    </div>
  );
}
