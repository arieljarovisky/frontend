// src/routes/Admin/ConfigPage.jsx - Con navegación oculta en mobile
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Settings,
  DollarSign,
  Bell,
  Percent,
  TrendingUp,
  Save,
  RefreshCw,
  Users,
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { apiClient } from "../../api/client.js";
import { toast } from "sonner";

function ConfigSection({ title, description, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-600/5 border border-primary-600/30">
          <Icon className="w-6 h-6 text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
          <p className="text-sm text-dark-600 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dark-800 mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-dark-500 mt-1">{hint}</p>}
    </div>
  );
}

function SwitchField({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl bg-dark-200/30 hover:bg-dark-200/50 transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-dark-900">{label}</div>
        {description && (
          <div className="text-xs text-dark-600 mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

export default function ConfigPage() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const [active, setActive] = useState("general");
  const [floating, setFloating] = useState(false);
  const [topOffset, setTopOffset] = useState(12);
  const [barH, setBarH] = useState(56);
  const barRef = useRef(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'mercadopago') {
      setActive('mercadopago');
      // opcional: scroll automático a la sección
      const el = document.getElementById('mercadopago');
      if (el) {
        const y = window.scrollY + el.getBoundingClientRect().top - 120;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  const TABS = [
    { id: "general", label: "General", Icon: Settings },
    { id: "deposits", label: "Señas", Icon: DollarSign },
    { id: "mercadopago", label: "Mercado Pago", Icon: CreditCard },
    { id: "commissions", label: "Comisiones", Icon: Percent },
    { id: "notifications", label: "Notificaciones", Icon: Bell },
  ];

  // Estados
  const [general, setGeneral] = useState({
    businessName: "Pelu de Barrio",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });

  const [deposits, setDeposits] = useState({
    percentage: 50,
    holdMinutes: 30,
    expirationBeforeStart: 120,
    autoCancel: true,
  });

  const [notifications, setNotifications] = useState({
    expiringSoon: true,
    expired: true,
    paid: true,
    newAppointment: true,
    cancelled: false,
  });

  const [commissions, setCommissions] = useState({
    defaultPercentage: 50,
    calculateOnDeposit: false,
    showInDashboard: true,
  });

  // Estados de Mercado Pago
  const [mpConfig, setMpConfig] = useState({
    deposit_enabled: false,
    deposit_percentage: 20,
    deposit_amount_fixed: null,
  });

  const [mpStatus, setMpStatus] = useState({
    connected: false,
    userId: null,
    loading: true,
    expiresAt: null,
    isExpired: false,
    liveMode: undefined,
  });

  const [connectingMP, setConnectingMP] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  // ============================================
  // 🔄 CARGAR CONFIGURACIÓN INICIAL
  // ============================================
  useEffect(() => {
    (async () => {
      try {
        const [g, d, c, n] = await Promise.all([
          apiClient.getConfigSection("general"),
          apiClient.getConfigSection("deposit"),
          apiClient.getConfigSection("commissions"),
          apiClient.getConfigSection("notifications"),
        ]);

        setGeneral({
          businessName: g.businessName ?? "Pelu de Barrio",
          timezone: g.timezone ?? "America/Argentina/Buenos_Aires",
          currency: g.currency ?? "ARS",
          dateFormat: g.dateFormat ?? "DD/MM/YYYY",
          timeFormat: g.timeFormat ?? "24h",
        });

        setDeposits({
          percentage: Number(d["deposit.percentage"] ?? d.percentage ?? 50),
          holdMinutes: Number(d["deposit.holdMinutes"] ?? d.holdMinutes ?? 30),
          expirationBeforeStart: Number(d["deposit.expirationBeforeStart"] ?? d.expirationBeforeStart ?? 120),
          autoCancel: (d["deposit.autoCancel"] ?? d.autoCancel ?? true) === true,
        });

        setCommissions({
          defaultPercentage: Number(c.defaultPercentage ?? 50),
          calculateOnDeposit: Boolean(c.calculateOnDeposit ?? false),
          showInDashboard: Boolean(c.showInDashboard ?? true),
        });

        setNotifications({
          expiringSoon: Boolean(n.expiringSoon ?? true),
          expired: Boolean(n.expired ?? true),
          paid: Boolean(n.paid ?? true),
          newAppointment: Boolean(n.newAppointment ?? true),
          cancelled: Boolean(n.cancelled ?? false),
        });
      } catch (e) {
        console.error("Load config failed", e);
      }
    })();
  }, []);

  // ============================================
  // 💳 MERCADO PAGO - MANEJO DE OAUTH
  // ============================================

  // Verificar estado de conexión
  const checkMPStatus = async () => {
    try {
      setMpStatus(prev => ({ ...prev, loading: true }));
      const data = await apiClient.getMPStatus();
      setMpStatus({
        connected: data.connected || false,
        userId: data.userId || null,
        loading: false,
        expiresAt: data.expiresAt,
        isExpired: data.isExpired || false,
        liveMode: data.liveMode,
      });
    } catch (err) {
      console.error('Error verificando estado MP:', err);
      setMpStatus({
        connected: false,
        userId: null,
        loading: false,
        expiresAt: null,
        isExpired: false,
      });
    }
  };

  // Cargar estado de MP al montar
  useEffect(() => {
    checkMPStatus();
  }, []);

  // Manejar retorno de OAuth (success/error en URL)
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const mp = searchParams.get('mp');
    const desc = searchParams.get('desc');
    if (success === 'true') {
      toast.success('¡Mercado Pago conectado exitosamente!', {
        description: 'Ya podés empezar a recibir pagos de señas'
      });
      checkMPStatus(); // Recargar estado
      // Limpiar URL
      navigate(`/${tenantSlug}/admin/config`, { replace: true });
    }

    if (error) {
      const errorMessages = {
        'cancelled': 'Conexión cancelada',
        'invalid': 'Error al conectar con Mercado Pago',
        'invalid_state': 'Error de autenticación',
        'auth_failed': 'No se pudo autorizar la conexión',
        'server_error': 'Error del servidor',
      };
      const extra = desc ? ` (${decodeURIComponent(desc)})` : mp ? ` (${decodeURIComponent(mp)})` : '';
      toast.error('Error al conectar', { description: (errorMessages[error] || 'Error desconocido') + extra });
      navigate(`/${tenantSlug}/admin/config`, { replace: true });
    }
  }, [searchParams, navigate, tenantSlug]);

  // Conectar Mercado Pago
  const handleConnectMP = async () => {
    try {
      setConnectingMP(true);
      setMessage('');

      console.log('🔍 [Frontend] Solicitando URL de autorización...');
      const data = await apiClient.getMPAuthUrl();
      console.log('✅ [Frontend] URL recibida:', data);

      if (data.ok && data.authUrl) {
        console.log('🔄 [Frontend] Redirigiendo a Mercado Pago...');
        // Redirigir a Mercado Pago
        window.location.href = data.authUrl;
      } else {
        toast.error('Error al generar URL de autorización');
        setConnectingMP(false);
      }
    } catch (err) {
      console.error('❌ [Frontend] Error conectando MP:', err);
      toast.error('Error al conectar con Mercado Pago', {
        description: err.response?.data?.error || err.message
      });
      setConnectingMP(false);
    }
  };

  // Desconectar Mercado Pago
  const handleDisconnectMP = async () => {
    if (!confirm('¿Estás seguro de desconectar Mercado Pago? No podrás recibir pagos de señas hasta que vuelvas a conectar.')) return;

    try {
      const data = await apiClient.disconnectMP();
      if (data.ok) {
        setMpStatus({
          connected: false,
          userId: null,
          loading: false,
          expiresAt: null,
          isExpired: false,
        });
        toast.success('Mercado Pago desconectado');
      }
    } catch (err) {
      console.error('Error desconectando MP:', err);
      toast.error('Error al desconectar');
    }
  };

  // ============================================
  // 💾 GUARDAR CONFIGURACIÓN
  // ============================================
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        apiClient.saveConfigSection("general", general),
        apiClient.saveConfigSection("deposit", {
          "deposit.percentage": deposits.percentage,
          "deposit.holdMinutes": deposits.holdMinutes,
          "deposit.expirationBeforeStart": deposits.expirationBeforeStart,
          "deposit.autoCancel": deposits.autoCancel,
        }),
        apiClient.saveConfigSection("commissions", commissions),
        apiClient.saveConfigSection("notifications", notifications),
        // Guardar config de MP
        apiClient.updateConfig(mpConfig),
      ]);
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("❌ Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // 📍 SCROLL & NAVEGACIÓN
  // ============================================
  useEffect(() => {
    const calcOffsets = () => {
      const appbar =
        document.querySelector("[data-appbar]") ||
        document.querySelector("nav[role='navigation']") ||
        document.querySelector("header");
      const h = appbar ? Math.ceil(appbar.getBoundingClientRect().height) : 64;
      setTopOffset(h + 8);
      if (barRef.current) setBarH(Math.ceil(barRef.current.getBoundingClientRect().height));
    };
    calcOffsets();
    window.addEventListener("resize", calcOffsets, { passive: true });
    return () => window.removeEventListener("resize", calcOffsets);
  }, []);

  useEffect(() => {
    const ids = TABS.filter(t => !t.external).map(t => t.id);

    let ticking = false;
    const calcActive = () => {
      ticking = false;
      const refY = (topOffset + barH + 12);
      const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

      if (nearBottom) {
        setActive(ids[ids.length - 1]);
        return;
      }

      let current = ids[0];
      let bestTop = -Infinity;
      let closestDown = { id: ids[0], dist: Infinity };

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        if (rect.top <= refY && rect.top > bestTop) {
          bestTop = rect.top;
          current = id;
        }

        const distDown = rect.top - refY;
        if (distDown > 0 && distDown < closestDown.dist) {
          closestDown = { id, dist: distDown };
        }
      }

      if (bestTop === -Infinity && closestDown.id) {
        current = closestDown.id;
      }

      setActive(current);
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(calcActive);
      }
    };

    calcActive();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [topOffset, barH, TABS]);

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const targetY = window.scrollY + el.getBoundingClientRect().top - (topOffset + barH + 8);
    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    setActive(id);
  };

  const depositType = mpConfig.deposit_amount_fixed ? 'fixed' : 'percentage';

  return (
    <div className="space-y-6">
      {/* === Spacer cuando la barra está flotando === */}
      {floating && <div style={{ height: barH }} />}

      {/* === Barra de navegación === */}
      <div
        ref={barRef}
        className="w-full px-4 hidden md:block"
        style={{
          position: floating ? "fixed" : "sticky",
          top: floating ? topOffset : 90,
          left: floating ? "50%" : undefined,
          transform: floating ? "translateX(-50%)" : undefined,
          zIndex: 70,
        }}
      >
        <div className="mx-auto max-w-4xl rounded-2xl p-[1px] bg-gradient-to-r from-sky-500/30 via-fuchsia-500/20 to-indigo-500/30 shadow-lg">
          <div className="rounded-2xl bg-slate-900/80 backdrop-blur border border-white/10">
            <nav className="flex items-center justify-center gap-1 p-1">
              {TABS.map(({ id, label, Icon, external }) => {
                const isActive = active === id;
                const base = "group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all";
                const on = "bg-white/10 text-white shadow-inner ring-1 ring-white/10";
                const off = "text-white/70 hover:text-white hover:bg-white/5 ring-1 ring-transparent hover:ring-white/10";
                return (
                  <button
                    key={id}
                    onClick={() => (external ? navigate(`/${tenantSlug}/admin/peluqueros`) : goTo(id))}
                    className={`${base} ${isActive ? on : off}`}
                  >
                    <Icon className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* GENERAL */}
      <div id="general">
        <ConfigSection
          title="Configuración General"
          description="Información básica de tu negocio"
          icon={Settings}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <FieldGroup label="Nombre del negocio">
              <input
                type="text"
                value={general.businessName}
                onChange={(e) => setGeneral({ ...general, businessName: e.target.value })}
                className="input w-full"
              />
            </FieldGroup>

            <FieldGroup label="Zona horaria">
              <select
                value={general.timezone}
                onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                className="input w-full"
              >
                <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                <option value="America/Argentina/Cordoba">Córdoba (GMT-3)</option>
                <option value="America/New_York">Nueva York (GMT-5)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Moneda">
              <select
                value={general.currency}
                onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
                className="input w-full"
              >
                <option value="ARS">Peso Argentino (ARS)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Formato de fecha">
              <select
                value={general.dateFormat}
                onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}
                className="input w-full"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </FieldGroup>
          </div>
        </ConfigSection>
      </div>

      {/* DEPOSITS */}
      <div id="deposits">
        <ConfigSection
          title="Configuración de Señas"
          description="Parámetros para el sistema de depósitos y reservas"
          icon={DollarSign}
        >
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <FieldGroup label="Porcentaje de seña (%)" hint="Porcentaje del precio que se cobra como seña">
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={deposits.percentage}
                onChange={(e) => setDeposits({ ...deposits, percentage: Number(e.target.value) })}
                className="input w-full"
              />
            </FieldGroup>

            <FieldGroup label="Tiempo de hold (minutos)" hint="Tiempo para pagar antes de liberar el turno">
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={deposits.holdMinutes}
                onChange={(e) => setDeposits({ ...deposits, holdMinutes: Number(e.target.value) })}
                className="input w-full"
              />
            </FieldGroup>

            <FieldGroup label="Expiración anticipada (min)" hint="Minutos antes del turno para expirar">
              <input
                type="number"
                min="30"
                max="1440"
                step="30"
                value={deposits.expirationBeforeStart}
                onChange={(e) => setDeposits({ ...deposits, expirationBeforeStart: Number(e.target.value) })}
                className="input w-full"
              />
            </FieldGroup>
          </div>

          <div className="space-y-2">
            <SwitchField
              label="Cancelación automática"
              description="Cancelar turnos cuando expira el tiempo de hold"
              checked={deposits.autoCancel}
              onChange={(e) => setDeposits({ ...deposits, autoCancel: e.target.checked })}
            />
          </div>
        </ConfigSection>
      </div>

      {/* MERCADO PAGO */}
      <div id="mercadopago">
        <ConfigSection
          title="Mercado Pago"
          description="Configurá los pagos de señas"
          icon={CreditCard}
        >
          {/* Estado de Conexión */}
          {mpStatus.loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary-400 animate-spin" />
            </div>
          ) : mpStatus.connected ? (
            // ✅ Conectado
            <>
              <div className="flex items-center gap-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl mb-6">
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-white font-medium">Cuenta conectada</p>
                  <p className="text-sm text-gray-400">Usuario MP: {mpStatus.userId}</p>
                  {mpStatus.expiresAt && (
                    <p className="text-xs text-gray-500 mt-1">
                      Token expira: {new Date(mpStatus.expiresAt).toLocaleString('es-AR')}
                    </p>
                  )}
                  {mpStatus.liveMode !== undefined && (
                    <p className="text-xs text-gray-500">
                      Modo: {mpStatus.liveMode ? '🟢 Producción' : '🟡 Pruebas'}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleDisconnectMP}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Desconectar
                </button>
              </div>

              {mpStatus.isExpired && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-amber-300 font-medium mb-1">Token expirado</p>
                    <p className="text-sm text-amber-200/80">
                      El token de acceso ha expirado. Desconectá y volvé a conectar para renovarlo.
                    </p>
                  </div>
                </div>
              )}

              {/* Configuración de señas (solo si está conectado y no expirado) */}
              {!mpStatus.isExpired && (
                <div className="space-y-6">
                  {/* Toggle Activar/Desactivar Señas */}
                  <div className="p-6 border-b border-dark-200/50">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl group-hover:scale-110 transition-transform">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">Requerir pago de seña</h3>
                          <p className="text-sm text-dark-400">Los clientes deberán pagar antes de confirmar</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={mpConfig.deposit_enabled}
                          onChange={e => setMpConfig({ ...mpConfig, deposit_enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-dark-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary-500 peer-checked:to-accent-600"></div>
                      </div>
                    </label>
                  </div>

                  {/* Tipo de Seña */}
                  {mpConfig.deposit_enabled && (
                    <div className="space-y-6">
                      {/* Cards de selección */}
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Porcentaje */}
                        <button
                          onClick={() => setMpConfig({ ...mpConfig, deposit_amount_fixed: null })}
                          className={`p-6 rounded-xl border-2 transition-all text-left group ${depositType === 'percentage'
                            ? 'border-primary-500 bg-primary-500/10'
                            : 'border-dark-700 bg-dark-900/30 hover:border-dark-600'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${depositType === 'percentage'
                              ? 'bg-primary-500/20'
                              : 'bg-dark-700/50 group-hover:bg-dark-700'
                              }`}>
                              <Percent className={`w-5 h-5 ${depositType === 'percentage' ? 'text-primary-400' : 'text-dark-400'
                                }`} />
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${depositType === 'percentage'
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-dark-600'
                              }`}>
                              {depositType === 'percentage' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <h4 className="font-semibold text-white mb-1">Porcentaje</h4>
                          <p className="text-sm text-dark-400">Calcula la seña como % del servicio</p>
                        </button>

                        {/* Monto Fijo */}
                        <button
                          onClick={() => setMpConfig({ ...mpConfig, deposit_amount_fixed: 1000 })}
                          className={`p-6 rounded-xl border-2 transition-all text-left group ${depositType === 'fixed'
                            ? 'border-accent-500 bg-accent-500/10'
                            : 'border-dark-700 bg-dark-900/30 hover:border-dark-600'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${depositType === 'fixed'
                              ? 'bg-accent-500/20'
                              : 'bg-dark-700/50 group-hover:bg-dark-700'
                              }`}>
                              <DollarSign className={`w-5 h-5 ${depositType === 'fixed' ? 'text-accent-400' : 'text-dark-400'
                                }`} />
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${depositType === 'fixed'
                              ? 'border-accent-500 bg-accent-500'
                              : 'border-dark-600'
                              }`}>
                              {depositType === 'fixed' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <h4 className="font-semibold text-white mb-1">Monto fijo</h4>
                          <p className="text-sm text-dark-400">Misma seña para todos los servicios</p>
                        </button>
                      </div>

                      {/* Input de valor */}
                      <div className="space-y-2">
                        {depositType === 'percentage' ? (
                          <>
                            <label className="flex items-center gap-2 text-sm font-medium text-dark-300">
                              <Percent className="w-4 h-4" />
                              Porcentaje de seña
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={mpConfig.deposit_percentage || 20}
                                onChange={(e) => setMpConfig({ ...mpConfig, deposit_percentage: parseFloat(e.target.value) })}
                                className="w-full px-4 py-3 bg-dark-100/50 border border-dark-200 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                                placeholder="20"
                                min="1"
                                max="100"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">%</span>
                            </div>
                            <p className="text-sm text-dark-500">
                              Ejemplo: Servicio $5000 → Seña ${((5000 * (mpConfig.deposit_percentage || 20)) / 100).toFixed(0)}
                            </p>
                          </>
                        ) : (
                          <>
                            <label className="flex items-center gap-2 text-sm font-medium text-dark-300">
                              <DollarSign className="w-4 h-4" />
                              Monto fijo de seña
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">$</span>
                              <input
                                type="number"
                                value={mpConfig.deposit_amount_fixed || ''}
                                onChange={(e) => setMpConfig({ ...mpConfig, deposit_amount_fixed: parseFloat(e.target.value) || null })}
                                className="w-full px-4 py-3 bg-dark-100/50 border border-dark-200 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-all pl-10"
                                placeholder="1000"
                                min="0"
                                step="100"
                              />
                            </div>
                            <p className="text-sm text-dark-500">
                              Todos los servicios requerirán ${mpConfig.deposit_amount_fixed || 1000} de seña
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Info Card */}
                  <div className="mt-6 bg-primary-500/10 backdrop-blur-xl rounded-xl border border-primary-500/30 p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                          <AlertCircle className="w-5 h-5 text-primary-400" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-primary-400">Información importante</h3>
                        <ul className="space-y-2 text-sm text-dark-300">
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0"></div>
                            <span>La conexión es segura y no compartimos tus credenciales</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0"></div>
                            <span>Podés desconectar tu cuenta en cualquier momento</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0"></div>
                            <span>MP cobra una comisión por transacción (~4-5%)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0"></div>
                            <span>Los pagos se acreditan en 24-48hs hábiles</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-2 flex-shrink-0"></div>
                            <span>Cobrás directamente en tu cuenta de MP</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // ❌ No conectado
            <div className="space-y-4">
              <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
                <p className="text-dark-300 mb-4">
                  Conectá tu cuenta de Mercado Pago para empezar a recibir pagos de señas de forma segura.
                </p>
                <button
                  onClick={handleConnectMP}
                  disabled={connectingMP}
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-500/30"
                >
                  {connectingMP ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                      Conectar con Mercado Pago
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-start gap-3 p-4 bg-dark-900/50 rounded-xl border border-dark-700">
                <AlertCircle className="w-5 h-5 text-dark-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-dark-400">
                  <p className="mb-2">Al conectar, Mercado Pago te pedirá autorización para:</p>
                  <ul className="space-y-1 list-disc list-inside ml-2">
                    <li>Crear preferencias de pago</li>
                    <li>Recibir notificaciones de pagos</li>
                    <li>Acceder a información de transacciones</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </ConfigSection>
      </div>

      {/* COMMISSIONS */}
      <div id="commissions">
        <ConfigSection
          title="Configuración de Comisiones"
          description="Parámetros para el cálculo de comisiones"
          icon={Percent}
        >
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FieldGroup label="Comisión por defecto (%)" hint="Porcentaje que se aplica a nuevos peluqueros">
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={commissions.defaultPercentage}
                onChange={(e) => setCommissions({ ...commissions, defaultPercentage: Number(e.target.value) })}
                className="input w-full"
              />
            </FieldGroup>
          </div>

          <div className="space-y-2">
            <SwitchField
              label="Calcular sobre seña"
              description="Calcular comisiones sobre el monto de la seña en lugar del precio total"
              checked={commissions.calculateOnDeposit}
              onChange={(e) => setCommissions({ ...commissions, calculateOnDeposit: e.target.checked })}
            />

            <SwitchField
              label="Mostrar en dashboard"
              description="Mostrar métricas de comisiones en el dashboard principal"
              checked={commissions.showInDashboard}
              onChange={(e) => setCommissions({ ...commissions, showInDashboard: e.target.checked })}
            />
          </div>

          <div className="mt-6 p-4 rounded-xl bg-primary-600/10 border border-primary-600/20">
            <p className="text-sm text-primary-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>
                Para configurar comisiones individuales por peluquero,{" "}
                <button
                  onClick={() => navigate(`/${tenantSlug}/admin/comisiones`)}
                  className="underline font-medium hover:text-primary-200"
                >
                  hacé clic aquí
                </button>
              </span>
            </p>
          </div>
        </ConfigSection>
      </div>

      {/* NOTIFICATIONS */}
      <div id="notifications">
        <ConfigSection
          title="Configuración de Notificaciones"
          description="Controlá qué notificaciones recibís"
          icon={Bell}
        >
          <div className="space-y-2">
            <SwitchField
              label="Señas por vencer"
              description="Te avisamos cuando una seña está próxima a expirar"
              checked={notifications.expiringSoon}
              onChange={(e) => setNotifications({ ...notifications, expiringSoon: e.target.checked })}
            />

            <SwitchField
              label="Señas vencidas"
              description="Te avisamos cuando una seña ha expirado"
              checked={notifications.expired}
              onChange={(e) => setNotifications({ ...notifications, expired: e.target.checked })}
            />

            <SwitchField
              label="Pagos recibidos"
              description="Te avisamos cuando se recibe un pago de seña"
              checked={notifications.paid}
              onChange={(e) => setNotifications({ ...notifications, paid: e.target.checked })}
            />

            <SwitchField
              label="Nuevos turnos"
              description="Te avisamos cuando se crea un nuevo turno"
              checked={notifications.newAppointment}
              onChange={(e) => setNotifications({ ...notifications, newAppointment: e.target.checked })}
            />

            <SwitchField
              label="Turnos cancelados"
              description="Te avisamos cuando se cancela un turno"
              checked={notifications.cancelled}
              onChange={(e) => setNotifications({ ...notifications, cancelled: e.target.checked })}
            />
          </div>
        </ConfigSection>
      </div>

      {/* Footer */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-dark-600">
            Los cambios se aplicarán inmediatamente después de guardar
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}