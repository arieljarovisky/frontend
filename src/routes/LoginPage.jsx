import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ShieldCheck, Loader2, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * Professional Login Page
 * - Tailwind + Framer Motion + Lucide icons
 * - Accessible form (labels, aria-*), keyboard-friendly
 * - Password visibility toggle
 * - Client-side validation + server error handling
 * - "Remember me" stores email only (never the password)
 * - Works with AuthContext.login(email, password)
 *
 * Routes:
 *   - After success → navigate to "/" (dashboard). Adjust if needed.
 */
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // preload remembered email
  useEffect(() => {
    const saved = localStorage.getItem("auth:email");
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    if (remember) localStorage.setItem("auth:email", email);
    else localStorage.removeItem("auth:email");
  }, [remember, email]);

  const isDisabled = useMemo(() => {
    if (loading) return true;
    if (!email || !password) return true;
    // basic client validation
    const ok = /.+@.+\..+/.test(email) && password.length >= 6;
    return !ok;
  }, [loading, email, password]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const ok = await login(email.trim(), password);
      if (ok) {
        navigate("/", { replace: true });
      } else {
        setError("Credenciales inválidas. Verificá tu email y contraseña.");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "Error de autenticación";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  // (Opcional) prueba de /auth/me si ya hay sesión válida (access vigente)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await http.get("/auth/me");
        if (mounted && data?.ok) navigate("/", { replace: true });
      } catch (_) {}
    })();
    return () => (mounted = false);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white">
      {/* Top bar brand */}
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
        <Link to="/appointments" className="inline-flex items-center gap-2 text-slate-200 hover:text-white">
          <ShieldCheck className="size-5" />
          <span className="font-semibold tracking-tight">Sistema de Turnos 2.0</span>
        </Link>
        <span className="text-xs text-slate-400">v2 • Secure Access</span>
      </div>

      {/* Centered card */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: marketing / benefits */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:block"
          >
            <div className="relative rounded-3xl border border-slate-800/70 bg-gradient-to-br from-slate-900/60 to-slate-800/30 p-8 shadow-[0_0_60px_-15px_rgba(2,6,23,0.8)] backdrop-blur">
              <h1 className="text-3xl font-bold tracking-tight">
                Bienvenido
                <span className="block text-slate-300 font-semibold text-lg mt-3">Gestión segura con roles y auditoría</span>
              </h1>
              <ul className="mt-6 space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block size-2 rounded-full bg-emerald-400" />
                  Accedé a tu panel con autenticación JWT y refresh rotation.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block size-2 rounded-full bg-cyan-400" />
                  Protección por rol (admin, staff, user) y rutas privadas.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 inline-block size-2 rounded-full bg-indigo-400" />
                  Cookies httpOnly para refresh + interceptores de Axios.
                </li>
              </ul>
              <div className="mt-8 grid grid-cols-3 divide-x divide-slate-800/80 rounded-xl border border-slate-800/70 bg-black/20">
                {[
                  ["Disponibilidad", "en tiempo real"],
                  ["Pagos", "Mercado Pago"],
                  ["WhatsApp", "bot integrado"],
                ].map(([a, b], i) => (
                  <div key={i} className="p-4 text-center">
                    <p className="text-sm text-slate-400">{a}</p>
                    <p className="text-base font-semibold text-white">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: login card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto w-full max-w-md"
          >
            <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-gradient-to-b from-slate-900/70 to-slate-900/30 p-6 shadow-[0_10px_50px_-20px_rgba(0,0,0,0.6)]">
              <div className="absolute -top-24 -right-24 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
              <div className="absolute -bottom-28 -left-28 size-72 rounded-full bg-indigo-500/10 blur-3xl" />

              <header className="relative z-10 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/30">
                  <ShieldCheck className="size-6 text-emerald-300" />
                </div>
                <h2 className="text-xl font-semibold tracking-tight">Iniciar sesión</h2>
                <p className="mt-1 text-sm text-slate-400">Usá tus credenciales de administrador o staff.</p>
              </header>

              {error && (
                <div className="relative z-10 mt-4 rounded-xl border border-red-900/50 bg-red-950/60 px-3 py-2 text-sm text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={onSubmit} className="relative z-10 mt-4 space-y-4">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-200">
                    Email
                  </label>
                  <div className="group relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Mail className="size-4 text-slate-500" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="admin@pelu.local"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-200">
                    Contraseña
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="size-4 text-slate-500" />
                    </div>
                    <input
                      id="password"
                      type={showPass ? "text" : "password"}
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPass((s) => !s)}
                      className="absolute inset-y-0 right-0 grid w-10 place-content-center text-slate-500 hover:text-slate-300"
                    >
                      {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      className="size-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    Recordarme
                  </label>
                  <button
                    type="button"
                    onClick={() => alert("Pedí al admin el reset de contraseña ✅")}
                    className="text-sm text-emerald-300 hover:text-emerald-200"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isDisabled}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Ingresando…
                    </>
                  ) : (
                    <>Ingresar</>
                  )}
                </button>

                <div className="text-center text-xs text-slate-500">
                  Acceso restringido. Si no tenés usuario, solicitá alta al administrador.
                </div>
              </form>

              <footer className="relative z-10 mt-6 border-t border-slate-800/70 pt-4 text-center text-xs text-slate-500">
                © {new Date().getFullYear()} Pelu de Barrio — Seguridad JWT
              </footer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
