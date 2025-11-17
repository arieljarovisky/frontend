import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Logo from "../components/Logo";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);

  // Verificar el estado del pago desde los query params
  const status = searchParams.get("status");
  const preapprovalId = searchParams.get("preapproval_id");

  useEffect(() => {
    // Si el estado no es autorizado, redirigir a la página de fallo
    if (status && status !== "authorized" && status !== "approved") {
      navigate(`/${tenantSlug || ""}/subscription/failure?status=${status}`);
      return;
    }

    // Redirigir automáticamente después de 10 segundos solo si el pago fue exitoso
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (tenantSlug) {
            navigate(`/${tenantSlug}/dashboard`);
          } else {
            navigate("/");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, tenantSlug, status]);

  const handleGoToDashboard = () => {
    if (tenantSlug) {
      navigate(`/${tenantSlug}/dashboard`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="card p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-foreground mb-3">
              ¡Pago realizado correctamente!
            </h1>
            <p className="text-lg text-foreground-secondary">
              Tu suscripción ha sido activada exitosamente.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-foreground-secondary">
              Ya podés usar todas las funcionalidades de ARJA ERP. 
              Serás redirigido al dashboard en {countdown} segundos...
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoToDashboard}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              Ir al dashboard ahora
            </button>
            <button
              onClick={() => navigate(`/${tenantSlug || ""}/plans`)}
              className="w-full btn-ghost py-2 text-sm"
            >
              Ver detalles de mi plan
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <Logo size="small" showText />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

