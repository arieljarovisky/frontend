import { motion } from "framer-motion";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../../components/Logo";
import ThemeToggle from "../../components/ThemeToggle";

export default function ActivationPendingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const tenantName = searchParams.get("tenant") || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0%_0%,#6366f122,transparent_55%)]" />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10">
        <header className="flex items-center justify-between mb-8">
          <Logo size="small" showText />
          <ThemeToggle />
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-700/40 bg-slate-900/70 p-8 md:p-12 shadow-2xl backdrop-blur"
        >
          <div className="flex flex-col items-center text-center gap-6">
            {/* Icono de email */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5, delay: 0.2 }}
              className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300"
            >
              <Mail className="w-10 h-10" />
            </motion.div>

            {/* Título principal */}
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-3">
                ¡Cuenta creada exitosamente!
              </h1>
              <p className="text-lg text-slate-300">
                {tenantName ? (
                  <>
                    Tu cuenta para <strong className="text-indigo-300">{tenantName}</strong> está lista.
                  </>
                ) : (
                  "Tu cuenta está lista."
                )}
              </p>
            </div>

            {/* Mensaje principal */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 w-full">
              <div className="flex items-start gap-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <h2 className="text-lg font-semibold text-slate-100 mb-2">
                    Revisá tu correo electrónico
                  </h2>
                  <p className="text-slate-300 mb-3">
                    Te enviamos un email a <strong className="text-indigo-300">{email || "tu correo"}</strong> con un enlace para activar tu cuenta.
                  </p>
                  <p className="text-sm text-slate-400">
                    Hacé clic en el botón "Activar mi cuenta" del email para comenzar a usar ARJA ERP.
                  </p>
                </div>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="w-full space-y-4 text-left">
              <h3 className="text-md font-semibold text-slate-200">¿Qué hacer ahora?</h3>
              <ol className="space-y-3 text-slate-300">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-semibold flex-shrink-0">
                    1
                  </span>
                  <span>Revisá tu bandeja de entrada (y la carpeta de spam si no lo encontrás)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-semibold flex-shrink-0">
                    2
                  </span>
                  <span>Hacé clic en el botón "Activar mi cuenta" del email</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-sm font-semibold flex-shrink-0">
                    3
                  </span>
                  <span>Una vez activada, podrás iniciar sesión y comenzar a usar tu cuenta</span>
                </li>
              </ol>
            </div>

            {/* Nota importante */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 w-full">
              <p className="text-sm text-amber-200">
                <strong>Importante:</strong> El enlace de activación expira en 7 días. Si no recibiste el email, revisá tu carpeta de spam o contactanos.
              </p>
            </div>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-6 py-3 text-sm font-semibold transition-colors"
              >
                Ir al inicio de sesión
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold hover:from-indigo-600 hover:to-fuchsia-600 transition-all"
              >
                Contactar soporte
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

