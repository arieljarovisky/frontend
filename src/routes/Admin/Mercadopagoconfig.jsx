import { useState, useEffect } from "react";
import { apiClient } from "../../api/client";
import { toast } from "sonner";
import {
  CreditCard,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  Info,
  Link as LinkIcon,
} from "lucide-react";

export default function MercadoPagoConfig() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    connected: false,
    liveMode: false,
    userId: null,
  });

  const loadStatus = async () => {
    setLoading(true);
    try {
      const result = await apiClient.checkMpConnection();
      setStatus(result);
    } catch (error) {
      console.error("Error loading MP status:", error);
      toast.error("Error al verificar conexión con Mercado Pago");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleConnect = () => {
    // TODO: Obtener tenant_id del contexto real
    const tenantId = 1;
    const url = apiClient.getMpConnectUrl(tenantId);
    window.open(url, "_blank", "width=600,height=800");

    // Polling para detectar cuando se complete la conexión
    const checkInterval = setInterval(async () => {
      const result = await apiClient.checkMpConnection();
      if (result.connected) {
        clearInterval(checkInterval);
        await loadStatus();
        toast.success("¡Mercado Pago conectado exitosamente!");
      }
    }, 3000);

    // Timeout después de 2 minutos
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 120000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-blue-400" />
          Configuración de Mercado Pago
        </h1>
        <p className="text-slate-400 mt-2">
          Conectá tu cuenta para aceptar pagos online de señas
        </p>
      </div>

      {/* Estado de conexión */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-100 mb-1">
              Estado de la conexión
            </h2>
            <p className="text-sm text-slate-400">
              {status.connected
                ? "Tu cuenta está conectada y lista para recibir pagos"
                : "Conectá tu cuenta para empezar a cobrar señas online"}
            </p>
          </div>

          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors"
            title="Actualizar estado"
          >
            <RefreshCw
              className={`w-5 h-5 text-slate-400 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Badge de estado */}
            <div className="flex items-center gap-4">
              <div
                className={`
                flex items-center gap-2 px-4 py-2 rounded-xl border-2
                ${
                  status.connected
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }
              `}
              >
                {status.connected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-semibold">Conectado</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5" />
                    <span className="font-semibold">Desconectado</span>
                  </>
                )}
              </div>

              {status.connected && (
                <div
                  className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl border
                  ${
                    status.liveMode
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  }
                `}
                >
                  <span className="text-sm font-medium">
                    {status.liveMode ? "🟢 Producción" : "🟡 Sandbox"}
                  </span>
                </div>
              )}
            </div>

            {/* Detalles */}
            {status.connected && status.userId && (
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">ID de usuario MP:</span>
                </div>
                <code className="text-sm text-slate-300 font-mono">
                  {status.userId}
                </code>
              </div>
            )}

            {/* Acciones */}
            <div className="pt-4 border-t border-slate-800">
              {!status.connected ? (
                <button
                  onClick={handleConnect}
                  className="w-full px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <ExternalLink className="w-5 h-5" />
                  Conectar con Mercado Pago
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handleConnect}
                    className="w-full px-6 py-3 rounded-xl border-2 border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Reconectar / Actualizar credenciales
                  </button>

                  <p className="text-xs text-slate-500 text-center">
                    Solo necesitás reconectar si cambiaste la cuenta o las credenciales
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="space-y-4">
        {/* ¿Cómo funciona? */}
        <div className="card p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">
                ¿Cómo funciona?
              </h3>
              <ol className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span>
                    Cuando un cliente reserva un turno, se genera automáticamente
                    un link de pago
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>
                    El cliente paga la seña desde su celular con cualquier medio
                    (tarjeta, efectivo en punto de pago, etc.)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>
                    Cuando el pago se confirma, el turno se actualiza automáticamente
                    y el cliente recibe la confirmación por WhatsApp
                  </span>
                </li>
              </ol>
            </div>
          </div>
        </div>

        {/* Advertencias importantes */}
        <div className="card p-6 border-2 border-amber-500/30">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-amber-300 mb-3">
                Importante
              </h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>
                    Mercado Pago cobra una comisión por cada transacción. Revisá
                    las tarifas en tu panel de MP.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>
                    Los pagos pueden tardar hasta 48hs en acreditarse según el
                    medio de pago usado.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400">•</span>
                  <span>
                    Si desconectás la cuenta, no podrás generar nuevos links de
                    pago hasta que la vuelvas a conectar.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Testing en Sandbox */}
        {status.connected && !status.liveMode && (
          <div className="card p-6 bg-amber-500/5 border-amber-500/30">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-amber-300 mb-2">
                  Modo de prueba activo
                </h3>
                <p className="text-sm text-slate-300 mb-3">
                  Estás usando credenciales de sandbox. Los pagos son simulados
                  y no se procesan realmente.
                </p>
                <a
                  href="https://www.mercadopago.com.ar/developers/es/docs/checkout-api/testing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 underline"
                >
                  Ver tarjetas de prueba
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}