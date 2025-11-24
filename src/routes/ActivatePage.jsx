import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { apiClient } from "../api/client";
import Logo from "../components/Logo";

export default function ActivatePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setError("Token de activación no proporcionado");
      setLoading(false);
      return;
    }

    activateAccount(token);
  }, [searchParams]);

  const activateAccount = async (token) => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/public/onboarding/activate?token=${token}`);
      
      if (response?.data?.ok) {
        setSuccess(true);
        setTenant(response.data.tenant);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          if (response.data.tenant?.subdomain) {
            navigate(`/${response.data.tenant.subdomain}/login`);
          } else {
            navigate("/login");
          }
        }, 3000);
      } else {
        setError(response?.data?.error || "Error al activar la cuenta");
      }
    } catch (err) {
      setError(
        err?.response?.data?.error || 
        "Error al activar la cuenta. El token puede haber expirado o ser inválido."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="card p-8 text-center">
          <div className="mb-6">
            <Logo size="large" showText />
          </div>

          {loading && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Activando tu cuenta...
              </h1>
              <p className="text-foreground-secondary">
                Por favor espera mientras procesamos tu activación.
              </p>
            </>
          )}

          {success && (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                ¡Cuenta activada exitosamente!
              </h1>
              {tenant && (
                <p className="text-foreground-secondary mb-4">
                  Tu cuenta para <strong>{tenant.name}</strong> está lista para usar.
                </p>
              )}
              <p className="text-sm text-foreground-muted">
                Serás redirigido al inicio de sesión en unos segundos...
              </p>
            </>
          )}

          {error && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Error al activar
              </h1>
              <p className="text-foreground-secondary mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/login")}
                  className="btn-primary w-full"
                >
                  Ir al inicio de sesión
                </button>
                <button
                  onClick={() => navigate("/contact")}
                  className="btn-secondary w-full"
                >
                  Contactar soporte
                </button>
              </div>
            </>
          )}

          {!loading && !success && !error && (
            <div className="flex items-center gap-2 text-foreground-secondary">
              <Mail className="w-5 h-5" />
              <p>Revisa tu correo para el enlace de activación.</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

