// src/routes/Admin/ConfigPage.jsx - Con navegación oculta en mobile
import { useState, useEffect, useRef, useCallback } from "react";
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
  Building2,
  Receipt,
  Shield,
  MessageCircle,
  Play,
  TestTube,
  Info,
  Plus,
  Edit3,
} from "lucide-react";
import { apiClient } from "../../api/client.js";
import { toast } from "sonner";
import BusinessTypeConfig from "./BusinessTypeConfig.jsx";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/UseApp";
import Button from "../../components/ui/Button";

function ConfigSection({ title, description, icon: Icon, children }) {
  return (
    <div className="card card--space-lg">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-600/5 border border-primary-600/30">
          <Icon className="w-6 h-6 text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-foreground-secondary mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-foreground-muted mt-1">{hint}</p>}
    </div>
  );
}

function SwitchField({ label, description, checked, onChange, disabled = false }) {
  return (
    <label className={`flex items-center gap-3 p-3 rounded-xl bg-background-secondary hover:bg-border transition-all border border-border ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {description && (
          <div className="text-xs text-foreground-secondary mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

export default function ConfigPage() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const { user, tenant } = useAuth();
  const { tenantInfo, refreshFeatures } = useApp();
  const [active, setActive] = useState("general");
  const barRef = useRef(null);
  const navScrollRef = useRef(null);
  const navAnchorRef = useRef(null);
  const [floating, setFloating] = useState(false);
  const [topOffset, setTopOffset] = useState(24);
  const [navHeight, setNavHeight] = useState(0);
  const [navOffset, setNavOffset] = useState(148);
  const [navBounds, setNavBounds] = useState({ width: null, left: null });
  const SCROLL_MARGIN = 48;

  const permissions = user?.permissions || {};
  const configPerms = permissions.config || [];
  const invoicesPerms = permissions.invoicing || [];
  const hasConfigAccess =
    user?.role === "admin" ||
    configPerms.length > 0 ||
    invoicesPerms.length > 0;

  if (!hasConfigAccess) {
    return (
      <div className="p-6">
        <div className="card card--space-lg text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No tenés permiso para ver Configuración
          </h2>
          <p className="text-foreground-secondary text-sm">
            Pedí a un administrador que te otorgue acceso a este módulo.
          </p>
        </div>
      </div>
    );
  }

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
    { id: "business-type", label: "Tipo de Negocio", Icon: Building2, adminOnly: true },
    { id: "whatsapp", label: "WhatsApp", Icon: MessageCircle },
    { id: "contact", label: "ARCA", Icon: Receipt },
    { id: "mercadopago", label: "Mercado Pago", Icon: CreditCard },
    { id: "commissions", label: "Comisiones", Icon: Percent },
  ];

  // Estados
  const [general, setGeneral] = useState({
    businessName: "",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });
  const [generalHydrated, setGeneralHydrated] = useState(false);

  // Sincronizar el nombre real del tenant al cargar la página (solo una vez)
  useEffect(() => {
    if (generalHydrated) return;
    const nameFromAuth =
      (tenant && !tenant.is_system && (tenant.name || tenant.subdomain)) || "";
    const nameFromInfo =
      tenantInfo?.tenant?.name ||
      tenantInfo?.tenant?.subdomain ||
      tenantInfo?.name ||
      tenantInfo?.subdomain ||
      "";
    const resolved = nameFromAuth || nameFromInfo;
    if (resolved) {
      setGeneral((prev) => ({
        ...prev,
        businessName: prev.businessName || resolved,
      }));
      setGeneralHydrated(true);
    }
  }, [tenant, tenantInfo, generalHydrated]);


  const [contact, setContact] = useState({
    arca: "",
    whatsapp: "",
    arca_api_key: "",
    arca_cuit: "",
    arca_punto_venta: "1",
    arca_api_url: "https://api.arca.com.ar/v1",
    arca_cert_content: "",
    arca_key_content: "",
    use_certificates: false,
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    phoneDisplay: "",
    hubConfigured: false,
    hubActive: false,
    status: "pending",
    supportMessage: null,
    createdAt: null,
    updatedAt: null,
  });

  const [botConfig, setBotConfig] = useState({
    greeting: "",
    greetingWithName: "",
    welcomeMessage: "",
    nameRequest: "",
    branchSelectionMessage: "",
    serviceSelectionHeader: "",
    instructorSelectionBody: "",
  });

  const [savingBotConfig, setSavingBotConfig] = useState(false);

  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [whatsappTest, setWhatsappTest] = useState({
    to: "",
    message: "Hola 👋 Este es un mensaje de prueba desde tu asistente de turnos.",
  });

  const [notifications, setNotifications] = useState({
    expiringSoon: true,
    expired: true,
    paid: true,
    newAppointment: true,
    cancelled: false,
  });
  const [remindersConfig, setRemindersConfig] = useState({
    enabled: false,
    advance_hours: 24,
  });
  const [bookingConfig, setBookingConfig] = useState({
    require_membership: false,
  });
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [loadingMembershipPlans, setLoadingMembershipPlans] = useState(false);
  const [membershipError, setMembershipError] = useState("");

  const loadMembershipPlans = useCallback(async () => {
    try {
      setLoadingMembershipPlans(true);
      setMembershipError("");
      const plans = await apiClient.listMembershipPlans();
      setMembershipPlans(Array.isArray(plans) ? plans : []);
    } catch (error) {
      console.error("Error cargando planes de membresía:", error);
      setMembershipError(error?.response?.data?.error || error?.message || "No se pudieron cargar las membresías");
      setMembershipPlans([]);
    } finally {
      setLoadingMembershipPlans(false);
    }
  }, []);

  const [commissions, setCommissions] = useState({
    defaultPercentage: 50,
    calculateOnDeposit: false,
    showInDashboard: true,
  });
  const planInfo = tenantInfo?.plan || null;
  const PLAN_STATUS_LABELS = {
    authorized: "Activo",
    manual: "Activo (manual)",
    pending: "Pendiente",
    cancelled: "Cancelado",
    paused: "Pausado",
    error: "Error",
  };
  const formatCurrency = (value, currency = "ARS") => {
    if (value == null) return "—";
    try {
      return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(Number(value));
    } catch {
      return `${currency} ${value}`;
    }
  };
  const formatDateTime = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("es-AR", {
        dateStyle: "long",
        timeStyle: "short",
      });
    } catch {
      return value;
    }
  };

  // Estados de Mercado Pago
  const [mpConfig, setMpConfig] = useState({
    deposit_enabled: false,
    deposit_percentage: 20,
    deposit_amount_fixed: null,
    // opcionales por si luego agregás límites
    deposit_min: null,
    deposit_max: null,
  });

  const [mpStatus, setMpStatus] = useState({
    connected: false,
    userId: null,
    loading: true,
    expiresAt: null,
    isExpired: false,
    liveMode: undefined,
    accountInfo: null,
    accountStatus: null,
    accountError: null,
  });

  const [connectingMP, setConnectingMP] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [testingArca, setTestingArca] = useState(false);
  const [arcaTestResult, setArcaTestResult] = useState(null);
  const [arcaConnectionStatus, setArcaConnectionStatus] = useState(null);
  const [arcaStatusLoading, setArcaStatusLoading] = useState(false);
  const [showArcaTutorial, setShowArcaTutorial] = useState(false);

  // ============================================
  // 🔄 CARGAR CONFIGURACIÓN INICIAL
  // ============================================
  useEffect(() => {
    (async () => {
      try {
        const [g, c, n, contactData, w, booking, reminders, bot] = await Promise.all([
          apiClient.getConfigSection("general"),
          apiClient.getConfigSection("commissions"),
          apiClient.getConfigSection("notifications"),
          apiClient.getConfigSection("contact").catch(() => ({})), // Si no existe, retornar objeto vacío
          apiClient.getWhatsAppConfig().catch(() => ({})),
          apiClient.getAppointmentsConfig().catch(() => ({})),
          apiClient.get("/api/reminders/config").then(r => r.data?.data || {}).catch(() => ({})),
          apiClient.getConfigSection("bot").catch(() => ({})), // Configuración del bot
        ]);

        // Prefiere siempre el nombre real del tenant si está disponible
        const tenantName =
          (tenant && !tenant.is_system && (tenant.name || tenant.subdomain)) ||
          (tenantInfo?.tenant?.name || tenantInfo?.tenant?.subdomain) ||
          null;

        setGeneral({
          businessName: tenantName ?? g.businessName ?? "Mi Negocio",
          timezone: g.timezone ?? "America/Argentina/Buenos_Aires",
          currency: g.currency ?? "ARS",
          dateFormat: g.dateFormat ?? "DD/MM/YYYY",
          timeFormat: g.timeFormat ?? "24h",
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

        setRemindersConfig({
          enabled: Boolean(reminders.enabled ?? false),
          advance_hours: Number(reminders.advance_hours ?? 24),
        });
        setBookingConfig({
          require_membership: Boolean(booking.require_membership),
        });

        setContact({
          arca: contactData.arca ?? "",
          whatsapp: contactData.whatsapp ?? "",
          arca_api_key: contactData.arca_api_key ?? "",
          arca_cuit: contactData.arca_cuit ?? "",
          arca_punto_venta: contactData.arca_punto_venta ?? "1",
          arca_api_url: contactData.arca_api_url ?? "https://api.arca.com.ar/v1",
          arca_cert_content: "",
          arca_key_content: "",
          use_certificates: !!(contactData.arca_cert_path && contactData.arca_key_path),
        });
        const resolvedPhone = w.phoneDisplay ?? contactData.whatsapp ?? "";
        setWhatsappConfig({
          phoneDisplay: resolvedPhone,
          hubConfigured: !!w.hubConfigured,
          hubActive: !!w.hubActive,
          status: w.status ?? (w.hubConfigured ? (w.hubActive ? "ready" : "disabled") : "pending"),
          supportMessage:
            w.supportMessage ??
            (w.hubConfigured
              ? null
              : "Nuestro equipo completará la integración con WhatsApp Business por vos."),
          createdAt: w.createdAt ?? null,
          updatedAt: w.updatedAt ?? null,
        });

        setWhatsappTest((prev) => ({
          ...prev,
          to: resolvedPhone,
        }));

        // Cargar configuración del bot con valores por defecto
        setBotConfig({
          greeting: bot.greeting || "¡Hola! 👋",
          greetingWithName: bot.greetingWithName || "¡Hola {name}! 👋",
          welcomeMessage: bot.welcomeMessage || "¿Qué querés hacer?",
          nameRequest: bot.nameRequest || "Para personalizar tu experiencia, decime tu *nombre*.\nEjemplo: *Soy Ariel*",
          branchSelectionMessage: bot.branchSelectionMessage || "Elegí la sucursal donde querés atendete:",
          serviceSelectionHeader: bot.serviceSelectionHeader || "Elegí un servicio",
          instructorSelectionBody: bot.instructorSelectionBody || "¿Con quién preferís?",
        });
      } catch (e) {
        console.error("Load config failed", e);
      }
    })();
  }, []);

  // === Cargar configuración de pagos/señas (payments.*) ===
  const loadPayments = async () => {
    try {
      const r = await apiClient.get("/api/config/payments");
      const d = r.data?.data || r.data || {};
      setMpConfig({
        deposit_enabled: !!d.require_deposit,
        deposit_percentage: Number(d.deposit_percent ?? 20),
        deposit_amount_fixed: d.deposit_fixed != null ? Number(d.deposit_fixed) : null,
        deposit_min: d.deposit_min ?? null,
        deposit_max: d.deposit_max ?? null,
      });
    } catch (e) {
      console.error("Load payments failed", e);
    }
  };


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
        accountInfo: data.accountInfo || null,
        accountStatus: data.accountStatus || null,
        accountError: data.accountError || null,
      });
    } catch (err) {
      console.error('Error verificando estado MP:', err);
      setMpStatus({
        connected: false,
        userId: null,
        loading: false,
        expiresAt: null,
        isExpired: false,
        accountInfo: null,
        accountStatus: null,
        accountError: null,
      });
    }
  };


  // Cargar estado de MP al montar
  useEffect(() => {
    checkMPStatus();
    loadPayments();
    checkArcaConnection();
  }, []);

  useEffect(() => {
    if (bookingConfig.require_membership) {
      loadMembershipPlans();
    } else {
      setMembershipPlans([]);
    }
  }, [bookingConfig.require_membership, loadMembershipPlans]);

  // Verificar conexión con ARCA
  const checkArcaConnection = async () => {
    setArcaStatusLoading(true);
    try {
      const response = await apiClient.verifyArcaConnection();
      setArcaConnectionStatus(response);
    } catch (error) {
      console.error("Error verificando ARCA:", error);
      setArcaConnectionStatus({
        ok: false,
        error: error.response?.data?.error || error.message,
        details: error.response?.data?.details,
      });
    } finally {
      setArcaStatusLoading(false);
    }
  };

  // Generar factura de prueba
  const testArcaInvoice = async () => {
    // Validar que el CUIT esté configurado (verificar tanto el estado local como el del backend)
    const cuitToCheck = contact.arca_cuit || arcaConnectionStatus?.tenantCUIT;

    if (!cuitToCheck || String(cuitToCheck).replace(/\D/g, '').length !== 11) {
      toast.error("Por favor, ingresá un CUIT válido de 11 dígitos y guardá los cambios antes de testear.");
      return;
    }

    if (!confirm("¿Generar una factura de prueba por $121 (incluye IVA)? Esta factura se emitirá a nombre de tu CUIT.")) {
      return;
    }

    setTestingArca(true);
    setArcaTestResult(null);

    try {
      const response = await apiClient.testArcaInvoice();
      setArcaTestResult({
        success: true,
        message: response.message || "Factura generada exitosamente",
        data: response.data
      });
      toast.success("✅ Factura de prueba generada exitosamente");
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message;
      setArcaTestResult({
        success: false,
        error: errorMsg
      });
      toast.error(`❌ Error al generar factura: ${errorMsg}`);
    } finally {
      setTestingArca(false);
    }
  };

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

  const handleConnectMP = async () => {
    try {
      setConnectingMP(true);
      setMessage('');

      console.log('🔍 [Frontend] Solicitando URL de autorización...');
      const data = await apiClient.getMPAuthUrl({ fresh: true });
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
          accountInfo: null,
          accountStatus: null,
          accountError: null,
        });
        toast.success('Mercado Pago desconectado');
      }
    } catch (err) {
      console.error('Error desconectando MP:', err);
      toast.error('Error al desconectar');
    }
  };

  const handleSaveWhatsApp = async () => {
    const phoneDisplay = (whatsappConfig.phoneDisplay || "").trim();
    if (!phoneDisplay) {
      toast.error("Ingresá el número de WhatsApp con código de país (ej: +54911...)");
      return;
    }

    setSavingWhatsApp(true);
    try {
      const data = await apiClient.saveWhatsAppConfig({ phoneDisplay });
      const normalized = {
        phoneDisplay: data.phoneDisplay ?? phoneDisplay,
        hubConfigured: !!data.hubConfigured,
        hubActive: !!data.hubActive,
        status: data.status ?? (data.hubConfigured ? (data.hubActive ? "ready" : "disabled") : "pending"),
        supportMessage:
          data.supportMessage ??
          (data.hubConfigured
            ? null
            : "Nuestro equipo completará la integración con WhatsApp Business por vos."),
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };

      setWhatsappConfig(normalized);
      setContact((prev) => ({
        ...prev,
        whatsapp: normalized.phoneDisplay,
      }));
      setWhatsappTest((prev) => ({
        ...prev,
        to: prev.to || normalized.phoneDisplay || "",
      }));

      toast.success(
        normalized.hubConfigured
          ? "Número guardado. El asistente usa la integración centralizada."
          : "Número guardado. Nuestro equipo completará la integración por vos."
      );
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Error desconocido";
      toast.error("No se pudo guardar el número de WhatsApp", {
        description: errorMessage,
      });
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const handleToggleWhatsAppActive = async (nextActive) => {
    setSavingWhatsApp(true);
    try {
      const data = await apiClient.saveWhatsAppConfig({ isActive: nextActive });
      const normalized = {
        phoneDisplay: data.phoneDisplay ?? whatsappConfig.phoneDisplay,
        hubConfigured: !!data.hubConfigured,
        hubActive: !!data.hubActive,
        status: data.status ?? (data.hubConfigured ? (data.hubActive ? "ready" : "disabled") : "pending"),
        supportMessage:
          data.supportMessage ??
          (data.hubConfigured
            ? null
            : "Nuestro equipo completará la integración con WhatsApp Business por vos."),
        createdAt: data.createdAt ?? null,
        updatedAt: data.updatedAt ?? null,
      };
      setWhatsappConfig(normalized);
      toast.success(nextActive ? "Asistente de WhatsApp activado." : "Asistente de WhatsApp desactivado.");
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Error desconocido";
      toast.error("No se pudo actualizar el estado del asistente", {
        description: errorMessage,
      });
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const handleSendWhatsAppTest = async () => {
    if (!whatsappConfig.hubConfigured) {
      toast.info("Nuestro equipo debe completar la integración antes de poder enviar mensajes de prueba.");
      return;
    }
    if (!whatsappConfig.hubActive) {
      toast.error("Activá el asistente de WhatsApp antes de enviar un mensaje de prueba.");
      return;
    }

    const to = (whatsappTest.to || whatsappConfig.phoneDisplay || "").trim();
    if (!to) {
      toast.error("Ingresá un número de WhatsApp de prueba");
      return;
    }

    const message = (whatsappTest.message || "").trim();
    if (!message) {
      toast.error("Ingresá un mensaje de prueba");
      return;
    }

    setTestingWhatsApp(true);
    try {
      await apiClient.testWhatsAppConfig({ to, message });
      toast.success("Mensaje de prueba enviado");
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Error desconocido";
      toast.error("No se pudo enviar el mensaje de prueba", {
        description: errorMessage,
      });
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const handleSaveBotConfig = async () => {
    setSavingBotConfig(true);
    try {
      await apiClient.saveConfigSection("bot", botConfig);
      toast.success("Configuración del bot guardada correctamente");
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Error desconocido";
      toast.error("No se pudo guardar la configuración del bot", {
        description: errorMessage,
      });
    } finally {
      setSavingBotConfig(false);
    }
  };

  const goToMembershipPlansPage = (planId = null) => {
    const basePath = tenantSlug ? `/${tenantSlug}/admin/membresias` : "/admin/membresias";
    if (planId) {
      navigate(`${basePath}?planId=${planId}`);
    } else {
      navigate(basePath);
    }
  };

  const handlePlanToggle = async (plan) => {
    try {
      await apiClient.updateMembershipPlan(plan.id, { is_active: !plan.is_active });
      toast.success(
        plan.is_active ? "Membresía desactivada" : "Membresía activada"
      );
      await loadMembershipPlans();
    } catch (error) {
      const errorMessage = error?.response?.data?.error || error?.message || "Error desconocido";
      toast.error(errorMessage);
    }
  };

  // ============================================
  // 💾 GUARDAR CONFIGURACIÓN
  // ============================================
  const savePayments = async () => {
    const payload = {
      require_deposit: !!mpConfig.deposit_enabled,
      deposit_mode: mpConfig.deposit_amount_fixed != null ? "fixed" : "percent",
      // sólo enviar el campo correspondiente según el modo
      ...(mpConfig.deposit_amount_fixed == null
        ? { deposit_percent: Number(mpConfig.deposit_percentage || 0) }
        : { deposit_fixed: Number(mpConfig.deposit_amount_fixed || 0) }),
      // opcionales si los usás
      ...(mpConfig.deposit_min != null ? { deposit_min: Number(mpConfig.deposit_min) } : {}),
      ...(mpConfig.deposit_max != null ? { deposit_max: Number(mpConfig.deposit_max) } : {}),
    };
    await apiClient.put("/api/config/payments", payload);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Log para debug
      console.log("[handleSaveAll] Contact data a guardar:", contact);
      console.log("[handleSaveAll] arca_cuit:", contact.arca_cuit);

      await Promise.all([
        apiClient.saveConfigSection("general", general),
        apiClient.saveConfigSection("contact", contact),
        apiClient.saveConfigSection("commissions", commissions),
        apiClient.saveConfigSection("notifications", notifications),
        apiClient.saveAppointmentsConfig(bookingConfig),
        apiClient.put("/api/reminders/config", remindersConfig),
        // Guardar payments (seña) siempre - permite desactivar incluso sin MP conectado
        savePayments(),
      ]);
      toast.success("Configuración guardada correctamente");

      // Recargar configuración de contacto para asegurar que el estado esté actualizado
      try {
        const contactData = await apiClient.getConfigSection("contact");
        setContact({
          arca: contactData.arca ?? "",
          whatsapp: contactData.whatsapp ?? "",
          arca_api_key: contactData.arca_api_key ?? "",
          arca_cuit: contactData.arca_cuit ?? "",
          arca_punto_venta: contactData.arca_punto_venta ?? "1",
          arca_api_url: contactData.arca_api_url ?? "https://api.arca.com.ar/v1",
          arca_cert_content: "",
          arca_key_content: "",
          use_certificates: !!(contactData.arca_cert_path && contactData.arca_key_path),
        });
      } catch (e) {
        console.error("Error recargando configuración de contacto:", e);
      }

      // Recargar conexión ARCA después de guardar
      checkArcaConnection();
    } catch (error) {
      console.error(error);
      const errorMessage = error?.response?.data?.error || error?.message || "Error desconocido";
      toast.error(`❌ Error al guardar la configuración: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // 📍 SCROLL & NAVEGACIÓN
  // ============================================
  useEffect(() => {
    const calcMetrics = () => {
      const appbar =
        document.querySelector("[data-appbar]") ||
        document.querySelector("nav[role='navigation']") ||
        document.querySelector("header");
      const h = appbar ? Math.ceil(appbar.getBoundingClientRect().height) : 64;
      setTopOffset(h + 16);

      if (barRef.current) {
        const { height } = barRef.current.getBoundingClientRect();
        setNavHeight(Math.ceil(height));
      }
    };

    calcMetrics();
    window.addEventListener("resize", calcMetrics, { passive: true });
    return () => window.removeEventListener("resize", calcMetrics);
  }, []);

  useEffect(() => {
    setNavOffset(topOffset + navHeight + 16);
  }, [topOffset, navHeight]);

  useEffect(() => {
    const handleScroll = () => {
      if (!navAnchorRef.current) return;
      const anchorTop =
        window.scrollY + navAnchorRef.current.getBoundingClientRect().top;
      const shouldFloat = window.scrollY + topOffset >= anchorTop;

      if (shouldFloat) {
        if (barRef.current) {
          const rect = barRef.current.getBoundingClientRect();
          setNavBounds({ width: rect.width, left: rect.left });
        }
        setFloating(true);
      } else {
        setFloating(false);
        setNavBounds({ width: null, left: null });
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [topOffset]);

  useEffect(() => {
    if (!barRef.current) return;
    const { height, width, left } = barRef.current.getBoundingClientRect();
    setNavHeight(Math.ceil(height));
    if (floating) {
      setNavBounds({ width, left });
    }
  }, [floating]);

  useEffect(() => {
    const handleResize = () => {
      if (!barRef.current) return;
      const { width, left } = barRef.current.getBoundingClientRect();
      if (floating) {
        setNavBounds({ width, left });
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [floating]);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;

    const handleWheel = (event) => {
      if (!el) return;
      const { deltaY, deltaX } = event;
      if (Math.abs(deltaY) <= Math.abs(deltaX)) {
        return;
      }

      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;

      if ((deltaY < 0 && atStart) || (deltaY > 0 && atEnd)) {
        return;
      }

      el.scrollLeft += deltaY;
      event.preventDefault();
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  // Filtrar tabs según permisos del usuario
  const visibleTabs = TABS.filter((t) => {
    if (t.external) return false;
    if (t.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  useEffect(() => {
    const ids = visibleTabs.map((t) => t.id);

    const calcActive = () => {
      const refY = navOffset + SCROLL_MARGIN;
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

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

    let timeoutId = null;
    const onScroll = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(calcActive, 30);
      calcActive();
    };

    const onResize = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(calcActive, 30);
      calcActive();
    };

    calcActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [navOffset, visibleTabs]);

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const adjustedOffset = Math.max(0, navOffset - SCROLL_MARGIN);
    const targetY = window.scrollY + el.getBoundingClientRect().top - adjustedOffset;
    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    setActive(id);
  };

  const depositType = mpConfig.deposit_amount_fixed ? "fixed" : "percentage";

  const whatsappStatusMeta = (() => {
    switch (whatsappConfig.status) {
      case "ready":
        return {
          label: "Integrado",
          className: "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300",
          bulletClass: "bg-emerald-400",
          description: "El asistente responde automáticamente usando la integración centralizada.",
        };
      case "disabled":
        return {
          label: "Pausado",
          className: "bg-amber-500/10 border border-amber-500/30 text-amber-200",
          bulletClass: "bg-amber-300",
          description: "El asistente está pausado. Podés volver a activarlo cuando quieras.",
        };
      default:
        return {
          label: "Pendiente",
          className: "bg-slate-500/10 border border-slate-500/30 text-slate-200",
          bulletClass: "bg-slate-300",
          description:
            whatsappConfig.supportMessage ||
            "Guardá tu número y nuestro equipo completará la integración con WhatsApp Business.",
        };
    }
  })();

  const whatsappStatusTips = {
    ready: [
      "El asistente responde automáticamente con la información de tu negocio.",
      "Podés enviar mensajes de prueba o activar campañas desde el panel de soporte.",
    ],
    disabled: [
      "Activá el asistente para volver a enviar recordatorios y confirmaciones.",
      "Mientras esté pausado, las automatizaciones quedan suspendidas.",
    ],
    pending: [
      "Guardá el número y contactanos para finalizar la vinculación en Meta Business.",
      "Cuando la conexión esté lista vas a poder activar el asistente y enviar pruebas.",
    ],
  };

  const highlightedTips =
    whatsappStatusTips[whatsappConfig.status] || whatsappStatusTips.pending;

  const navZIndex = 70;

  return (
    <div className="space-y-6">
      <div ref={navAnchorRef} />
      {floating && <div style={{ height: navHeight }} />}
      {/*  barra de navegación */}
      <div
        ref={barRef}
        className="w-full px-3"
        style={
          floating
            ? {
                position: "fixed",
                top: topOffset,
                left: navBounds.left != null ? `${navBounds.left}px` : 0,
                width: navBounds.width != null ? `${navBounds.width}px` : "100%",
                zIndex: navZIndex,
              }
            : { position: "relative", zIndex: navZIndex }
        }
      >
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-primary/25 bg-[rgba(10,32,48,0.9)] shadow-md backdrop-blur-xl px-6 py-3 inline-block">
            <nav
              ref={navScrollRef}
              className="hidden md:flex items-center justify-start gap-2 flex-nowrap overflow-x-auto scrollbar-hide"
            >
              {visibleTabs.map(({ id, label, Icon, external }) => {
                const isActive = active === id;
                const base = "group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all min-w-max";
                const on = "bg-gradient-to-r from-[#13b5cf] to-[#0d7fd4] text-white shadow-lg ring-2 ring-white/10";
                const off = "text-slate-200/80 hover:text-white hover:bg-white/10 ring-1 ring-transparent";
                return <button type="button" key={id} onClick={() => (external ? navigate(`/${tenantSlug}/admin/instructores`) : goTo(id))} className={`${base} ${isActive ? on : off}`}><Icon className="w-4 h-4 opacity-80 group-hover:opacity-100 transition-opacity" /> <span className="whitespace-nowrap">{label}</span></button>;
              })}
            </nav>
            <div className="hidden">
              {visibleTabs.map(({ id, label, Icon, external }) => {
                const isActive = active === id;
                return <button type="button" key={id} onClick={() => (external ? navigate(`/${tenantSlug}/admin/instructores`) : goTo(id))} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${isActive ? "bg-gradient-to-r from-[#13b5cf] to-[#0d7fd4] text-white shadow-lg ring-2 ring-white/10" : "text-slate-200/80 hover:text-white hover:bg-white/10 ring-1 ring-transparent"}`}><Icon className="w-4 h-4 opacity-80" /> <span>{label}</span></button>;
              })}
            </div>
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
                disabled
                title="El nombre del negocio no se puede cambiar"
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

      {/* BOOKING */}
      <div id="booking">
        <ConfigSection
          title="Reservas y membresías"
          description="Configurá si el sistema requiere cuota al día antes de permitir un turno"
          icon={Shield}
        >
          <div className="space-y-4">
            <SwitchField
              label="Requerir cuota al día para reservar"
              description="Bloqueá las reservas si el cliente no tiene una suscripción activa. Ideal para gimnasios o clubes."
              checked={bookingConfig.require_membership}
              onChange={(e) =>
                setBookingConfig((prev) => ({ ...prev, require_membership: e.target.checked }))
              }
            />
            <p className="text-xs text-foreground-muted">
              Cuando está desactivado, cualquier cliente puede reservar aunque no tenga una
              membresía vigente (recomendado para peluquerías y estudios sin mensualidad).
            </p>
            {bookingConfig.require_membership && (
              <div className="rounded-2xl border border-border/60 bg-background-secondary/50 p-4 space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Planes de membresía</p>
                    <p className="text-xs text-foreground-muted">
                      Definí los precios y duración de las cuotas que vas a controlar.
                    </p>
                  </div>
                  <Button
                    onClick={() => goToMembershipPlansPage()}
                    className="flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    Nuevo plan
                  </Button>
                </div>

                {membershipError ? (
                  <div className="py-6 text-sm text-red-400">
                    {membershipError}
                  </div>
                ) : loadingMembershipPlans ? (
                  <div className="py-10 flex flex-col items-center gap-2 text-foreground-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Cargando planes...
                  </div>
                ) : membershipPlans.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-foreground-muted">
                    No cargaste planes de membresía todavía. Creá al menos uno para hacer cumplir la cuota mensual.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-border/70">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="bg-background-secondary/70 text-foreground-muted text-xs uppercase tracking-wide">
                        <tr>
                          <th className="text-left px-4 py-3">Nombre</th>
                          <th className="text-left px-4 py-3">Precio</th>
                          <th className="text-left px-4 py-3">Duración</th>
                          <th className="text-left px-4 py-3">Estado</th>
                          <th className="text-right px-4 py-3">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membershipPlans.map((plan) => (
                          <tr key={plan.id} className="border-t border-border/60">
                            <td className="px-4 py-3">
                              <p className="font-medium text-foreground">{plan.name}</p>
                              {plan.description && (
                                <p className="text-xs text-foreground-muted">{plan.description}</p>
                              )}
                              {(plan.max_classes_per_week || plan.max_classes_per_month || plan.max_active_appointments) ? (
                                <p className="text-xs text-foreground-muted mt-1 space-x-2">
                                  {plan.max_classes_per_week ? (
                                    <span>Semanal: {plan.max_classes_per_week}</span>
                                  ) : null}
                                  {plan.max_classes_per_month ? (
                                    <span>Mensual: {plan.max_classes_per_month}</span>
                                  ) : null}
                                  {plan.max_active_appointments ? (
                                    <span>Turnos activos: {plan.max_active_appointments}</span>
                                  ) : null}
                                </p>
                              ) : null}
                              <p className="text-xs text-foreground-muted mt-1 space-x-2">
                                {plan.billing_day ? (
                                  <span>Vence día {plan.billing_day}</span>
                                ) : (
                                  <span>Vence según fecha de pago</span>
                                )}
                                <span>Gracia: {plan.grace_days ?? 0} días</span>
                                <span>
                                  Interés:{" "}
                                  {plan.interest_type === "none"
                                    ? "Sin interés"
                                    : plan.interest_type === "percent"
                                    ? `${plan.interest_value ?? 0}%`
                                    : `$${plan.interest_value ?? 0}`}
                                </span>
                                <span>
                                  Bloquea: {plan.auto_block ? "Sí" : "No"}
                                </span>
                              </p>
                            </td>
                            <td className="px-4 py-3 text-foreground">
                              {formatCurrency(plan.price_decimal)}
                            </td>
                            <td className="px-4 py-3 text-foreground-secondary">
                              {plan.duration_months <= 1
                                ? "1 mes"
                                : `${plan.duration_months} meses`}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  plan.is_active
                                    ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                                    : "bg-slate-500/10 text-slate-300 border border-slate-500/40"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    plan.is_active ? "bg-emerald-300" : "bg-slate-300"
                                  }`}
                                />
                                {plan.is_active ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => goToMembershipPlansPage(plan.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePlanToggle(plan)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-foreground-secondary hover:text-foreground hover:bg-border transition-colors"
                                >
                                  {plan.is_active ? "Desactivar" : "Activar"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </ConfigSection>
      </div>

      {/* BUSINESS TYPE */}
      <div id="business-type">
        <ConfigSection
          title="Tipo de Negocio"
          description="Configurá el tipo de negocio y las funcionalidades habilitadas"
          icon={Building2}
        >
          <BusinessTypeConfig />
        </ConfigSection>
      </div>
      {/* WHATSAPP */}
      <div id="whatsapp">
        <ConfigSection
          title="WhatsApp Business"
          description="Conectá tu número de WhatsApp para automatizar reservas y recordatorios"
          icon={MessageCircle}
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/25">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Integración centralizada ARJA</h4>
                  <p className="text-xs text-foreground-secondary">
                    Solo necesitás cargar el número de WhatsApp del negocio. Nuestro equipo gestiona las credenciales y certificados en Meta Business.
                  </p>
                </div>
              </div>
              {whatsappConfig.supportMessage ? (
                <p className="mt-3 text-xs text-primary-200/90">{whatsappConfig.supportMessage}</p>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)]">
              <FieldGroup
                label="Número de WhatsApp"
                hint="Incluí el código de país. Ejemplo: +5491123456789"
              >
                <input
                  type="text"
                  value={whatsappConfig.phoneDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    setWhatsappConfig((prev) => ({ ...prev, phoneDisplay: value }));
                    setContact((prev) => ({ ...prev, whatsapp: value }));
                  }}
                  className="input w-full text-base font-medium tracking-wide"
                  placeholder="+5491123456789"
                />
              </FieldGroup>

              <div className="rounded-2xl border border-border/60 bg-background-secondary/70 shadow-sm p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Estado del asistente</p>
                    <p className="text-xs text-foreground-muted leading-relaxed">
                      {whatsappStatusMeta.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full ${whatsappStatusMeta.className}`}
                  >
                    <span className={`inline-flex w-2 h-2 rounded-full ${whatsappStatusMeta.bulletClass}`} />
                    {whatsappStatusMeta.label}
                  </span>
                </div>
                <ul className="space-y-2">
                  {highlightedTips.map((tip, index) => (
                    <li
                      key={`${whatsappConfig.status}-${index}`}
                      className="flex items-start gap-2 text-xs text-foreground-secondary"
                    >
                      <CheckCircle className="mt-[2px] h-3.5 w-3.5 text-primary/80 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={handleSaveWhatsApp} disabled={savingWhatsApp} className="flex items-center gap-2">
                  {savingWhatsApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar número
                    </>
                  )}
                </Button>

                <div className="w-full sm:w-auto">
                  <SwitchField
                    label="Asistente activo"
                    description="Enviá confirmaciones y recordatorios automáticos"
                    checked={whatsappConfig.hubActive}
                    disabled={!whatsappConfig.hubConfigured || savingWhatsApp}
                    onChange={(event) => handleToggleWhatsAppActive(event.target.checked)}
                  />
                </div>
              </div>

              <p className="text-xs text-foreground-muted">
                {whatsappConfig.updatedAt
                  ? `Última actualización: ${new Date(whatsappConfig.updatedAt).toLocaleString("es-AR")}`
                  : "Guardá el número para mantener la base de WhatsApp sincronizada."}
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background-secondary/60 p-4 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <TestTube className="w-5 h-5 text-primary-400" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Enviar mensaje de prueba
                  </h4>
                  <p className="text-xs text-foreground-secondary">
                    {whatsappConfig.hubConfigured
                      ? "Probá la integración enviándote un mensaje desde tu número configurado."
                      : "Guardá tu número y esperá a que soporte termine la conexión para poder hacer pruebas."}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FieldGroup label="Enviar a">
                  <input
                    type="text"
                    value={whatsappTest.to}
                    disabled={!whatsappConfig.hubActive}
                    onChange={(e) =>
                      setWhatsappTest((prev) => ({ ...prev, to: e.target.value }))
                    }
                    className="input w-full"
                    placeholder="Número con código de país"
                  />
                </FieldGroup>

                <FieldGroup label="Mensaje">
                  <textarea
                    value={whatsappTest.message}
                    disabled={!whatsappConfig.hubActive}
                    onChange={(e) =>
                      setWhatsappTest((prev) => ({ ...prev, message: e.target.value }))
                    }
                    className="input w-full min-h-[80px]"
                  />
                </FieldGroup>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleSendWhatsAppTest}
                  disabled={!whatsappConfig.hubActive || testingWhatsApp}
                  className="flex items-center gap-2"
                >
                  {testingWhatsApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Enviar prueba
                    </>
                  )}
                </Button>
                <p className="text-xs text-foreground-muted">
                  {whatsappConfig.hubActive
                    ? "Si es la primera vez, aceptá el mensaje desde WhatsApp Business para habilitar la conversación."
                    : "Activá el asistente para habilitar los envíos de prueba."}
                </p>
              </div>
            </div>

            {/* Configuración del Bot de WhatsApp */}
            <div className="border-t border-border pt-6 mt-6">
              <div className="mb-6">
                <h4 className="text-base font-semibold text-foreground mb-2">
                  Personalización del Bot
                </h4>
                <p className="text-sm text-foreground-secondary">
                  Personalizá los mensajes que el bot de WhatsApp envía a tus clientes. Usá <code className="bg-background-secondary px-1 rounded text-xs">{"{name}"}</code> para reemplazar el nombre del cliente.
                </p>
              </div>

              <div className="space-y-4">
                <FieldGroup
                  label="Saludo inicial"
                  hint="Mensaje que aparece cuando el cliente escribe 'hola' por primera vez"
                >
                  <input
                    type="text"
                    value={botConfig.greeting}
                    onChange={(e) => setBotConfig({ ...botConfig, greeting: e.target.value })}
                    className="input w-full"
                    placeholder="¡Hola! 👋"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Saludo con nombre"
                  hint="Mensaje cuando el cliente ya está registrado. Usá {name} para el nombre"
                >
                  <input
                    type="text"
                    value={botConfig.greetingWithName}
                    onChange={(e) => setBotConfig({ ...botConfig, greetingWithName: e.target.value })}
                    className="input w-full"
                    placeholder="¡Hola {name}! 👋"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Mensaje de bienvenida"
                  hint="Texto que aparece en el menú principal del bot"
                >
                  <input
                    type="text"
                    value={botConfig.welcomeMessage}
                    onChange={(e) => setBotConfig({ ...botConfig, welcomeMessage: e.target.value })}
                    className="input w-full"
                    placeholder="¿Qué querés hacer?"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Solicitud de nombre"
                  hint="Mensaje para pedirle el nombre al cliente nuevo"
                >
                  <textarea
                    value={botConfig.nameRequest}
                    onChange={(e) => setBotConfig({ ...botConfig, nameRequest: e.target.value })}
                    className="input w-full min-h-[80px]"
                    placeholder="Para personalizar tu experiencia, decime tu *nombre*.\nEjemplo: *Soy Ariel*"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Selección de sucursal"
                  hint="Mensaje cuando hay múltiples sucursales disponibles"
                >
                  <input
                    type="text"
                    value={botConfig.branchSelectionMessage}
                    onChange={(e) => setBotConfig({ ...botConfig, branchSelectionMessage: e.target.value })}
                    className="input w-full"
                    placeholder="Elegí la sucursal donde querés atendete:"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Encabezado - Selección de servicio"
                  hint="Título al mostrar la lista de servicios"
                >
                  <input
                    type="text"
                    value={botConfig.serviceSelectionHeader}
                    onChange={(e) => setBotConfig({ ...botConfig, serviceSelectionHeader: e.target.value })}
                    className="input w-full"
                    placeholder="Elegí un servicio"
                  />
                </FieldGroup>

                <FieldGroup
                  label="Cuerpo - Selección de profesional"
                  hint="Texto al mostrar la lista de profesionales/instructores"
                >
                  <input
                    type="text"
                    value={botConfig.instructorSelectionBody}
                    onChange={(e) => setBotConfig({ ...botConfig, instructorSelectionBody: e.target.value })}
                    className="input w-full"
                    placeholder="¿Con quién preferís?"
                  />
                </FieldGroup>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <p className="text-xs text-foreground-muted">
                    Los cambios se aplicarán inmediatamente al guardar
                  </p>
                  <Button
                    onClick={handleSaveBotConfig}
                    disabled={savingBotConfig}
                    className="flex items-center gap-2"
                  >
                    {savingBotConfig ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Guardar configuración del bot
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ConfigSection>
      </div>

      {/* CONTACT */}
      <div id="contact">
        <ConfigSection
          title="Facturación Electrónica ARCA"
          description="Configurá los datos necesarios para emitir facturas electrónicas con ARCA"
          icon={Receipt}
        >
          <div className="space-y-6">
            <div className="border-t border-border pt-6">
              <h4 className="text-sm font-semibold text-foreground mb-4">Facturación Electrónica ARCA</h4>

              <div className="mb-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                <p className="text-sm text-foreground mb-2">
                  <strong className="text-green-400">✓ Sistema Centralizado</strong>
                </p>
                <p className="text-xs text-foreground-secondary">
                  Solo necesitás tu CUIT. El sistema factura en tu nombre usando certificados centralizados.
                  No necesitás configurar certificados propios ni hacer trámites en AFIP.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <FieldGroup
                  label="Tu CUIT"
                  hint="Tu CUIT de 11 dígitos (sin guiones). El sistema facturará en tu nombre usando este CUIT."
                >
                  <input
                    type="text"
                    value={contact.arca_cuit}
                    onChange={(e) => setContact({ ...contact, arca_cuit: e.target.value.replace(/\D/g, '') })}
                    className="input w-full"
                    placeholder="20123456789"
                    maxLength={11}
                  />
                </FieldGroup>

                <FieldGroup
                  label="Punto de Venta (Opcional)"
                  hint="Si tenés un punto de venta específico, ingresalo aquí. Si no, el sistema usará el predeterminado."
                >
                  <input
                    type="text"
                    value={contact.arca_punto_venta}
                    onChange={(e) => setContact({ ...contact, arca_punto_venta: e.target.value })}
                    className="input w-full"
                    placeholder="1"
                  />
                </FieldGroup>
              </div>

              {/* Estado de conexión y test */}
              <div className="space-y-4 mt-6">
                {/* Estado de conexión */}
                {arcaStatusLoading && (
                  <div className="p-4 rounded-xl border bg-background-secondary/60 border-border/60 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-300" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Verificando credenciales de ARCA...
                      </p>
                      <p className="text-xs text-foreground-muted">
                        Esto puede tardar unos segundos si el servidor consulta AFIP.
                      </p>
                    </div>
                  </div>
                )}

                {arcaConnectionStatus && !arcaStatusLoading && (
                  <div className={`p-4 rounded-xl border ${arcaConnectionStatus.ok
                    ? "bg-green-500/10 border-green-500/30"
                    : "bg-red-500/10 border-red-500/30"
                    }`}>
                    <div className="flex items-start gap-3">
                      {arcaConnectionStatus.ok ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${arcaConnectionStatus.ok ? "text-green-400" : "text-red-400"
                          }`}>
                          {arcaConnectionStatus.ok ? "Conexión con ARCA OK" : "Error de conexión"}
                        </p>
                        <p className="text-xs text-foreground-secondary mt-1">
                          {arcaConnectionStatus.message || arcaConnectionStatus.error}
                        </p>
                        {!arcaConnectionStatus.ok && arcaConnectionStatus.tenantCUIT && (
                          <p className="text-xs text-amber-400 mt-2">
                            CUIT configurado: <strong>{arcaConnectionStatus.tenantCUIT}</strong>
                            <span className="block mt-1 text-red-400">
                              ⚠️ Falta configurar las credenciales del sistema en el servidor.
                            </span>
                          </p>
                        )}
                        {!arcaConnectionStatus.ok && arcaConnectionStatus.details && (
                          <p className="text-xs text-foreground-muted mt-2">
                            {arcaConnectionStatus.details}
                          </p>
                        )}
                        {!arcaConnectionStatus.ok && (
                          <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                            <p className="text-xs font-medium text-amber-400 mb-2">
                              ⚙️ Configuración necesaria en el servidor:
                            </p>
                            <p className="text-xs text-foreground-secondary mb-2">
                              El administrador del sistema debe configurar en el archivo <code className="bg-background-secondary px-1 rounded">.env</code> del servidor:
                            </p>
                            <div className="space-y-2">
                              <div className="p-2 rounded bg-background-secondary">
                                <p className="text-xs font-medium text-foreground mb-1">Opción A: Servicio Intermediario (API Key)</p>
                                <ul className="text-xs text-foreground-secondary space-y-1 list-disc list-inside ml-2">
                                  <li><code>ARCA_API_KEY</code> - API Key del servicio intermediario</li>
                                  <li><code>ARCA_CUIT</code> - CUIT del sistema</li>
                                  <li><code>ARCA_PUNTO_VENTA</code> - Punto de venta</li>
                                  <li><code>ARCA_API_URL</code> - URL del servicio intermediario</li>
                                </ul>
                              </div>
                              <div className="p-2 rounded bg-background-secondary">
                                <p className="text-xs font-medium text-foreground mb-1">Opción B: Certificados del Sistema (P12)</p>
                                <p className="text-xs text-foreground-secondary mb-2">
                                  <strong>Configurar en el archivo</strong> <code className="bg-background px-1 rounded">.env</code> del servidor (en la carpeta <code className="bg-background px-1 rounded">backend/</code>):
                                </p>
                                <ul className="text-xs text-foreground-secondary space-y-1 list-disc list-inside ml-2">
                                  <li><code>ARCA_CUIT</code> - CUIT del sistema (requerido)</li>
                                  <li><code>ARCA_PUNTO_VENTA</code> - Punto de venta (requerido)</li>
                                  <li><code>P12_PATH</code> - Ruta al archivo certificado P12 (requerido)</li>
                                  <li><code>P12_PASS</code> - Contraseña del certificado P12 (requerido)</li>
                                  <li><code>SERVICE</code> - <span className="text-foreground-muted">Opcional:</span> Servicio para WSAA (por defecto: "wsfe")</li>
                                  <li><code>WSAA_URL</code> - <span className="text-foreground-muted">Opcional:</span> URL del Web Service de Autenticación (WSAA). Si no se especifica, usa las URLs predeterminadas según el environment.</li>
                                  <li><code>WSFE_URL</code> - <span className="text-foreground-muted">Opcional:</span> URL del Web Service de Facturación (WSFE). Si no se especifica, usa las URLs predeterminadas según el environment.</li>
                                </ul>
                                <p className="text-xs text-foreground-muted mt-2 italic">
                                  <strong>Alternativa:</strong> También podés usar certificados separados (.crt y .key) colocándolos en <code className="bg-background px-1 rounded">backend/src/arca/</code> y configurando <code>ARCA_CERT_PATH</code> y <code>ARCA_KEY_PATH</code> (opcional si están en la carpeta predeterminada).
                                </p>
                              </div>
                            </div>
                            <p className="text-xs text-foreground-muted mt-2">
                              <strong>Nota:</strong> Si usás certificados, los usuarios deben delegar el servicio de facturación a tu empresa en AFIP.
                            </p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={checkArcaConnection}
                        className="p-2 rounded-lg bg-background-secondary hover:bg-border transition-colors"
                        title="Verificar conexión"
                      >
                        <RefreshCw className={`w-4 h-4 text-foreground-secondary`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Botón de test */}
                <div className="p-4 rounded-xl bg-primary-500/10 border border-primary-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Generar Factura de Prueba
                      </p>
                      <p className="text-xs text-foreground-secondary">
                        Generá una factura de prueba por $121 para verificar que todo funcione correctamente
                      </p>
                    </div>
                    <button
                      onClick={testArcaInvoice}
                      disabled={testingArca || !contact.arca_cuit || !arcaConnectionStatus?.ok}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {testingArca ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generando...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Testear
                        </>
                      )}
                    </button>
                  </div>

                  {/* Resultado del test */}
                  {arcaTestResult && (
                    <div className={`mt-4 p-3 rounded-lg border ${arcaTestResult.success
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                      }`}>
                      {arcaTestResult.success ? (
                        <div>
                          <p className="text-sm font-medium text-green-400 mb-2">
                            ✅ {arcaTestResult.message}
                          </p>
                          {arcaTestResult.data && (
                            <div className="text-xs text-foreground-secondary space-y-1">
                              {arcaTestResult.data.cae && (
                                <p><strong>CAE:</strong> {arcaTestResult.data.cae}</p>
                              )}
                              {arcaTestResult.data.numero && (
                                <p><strong>Número:</strong> {arcaTestResult.data.numero}</p>
                              )}
                              {arcaTestResult.data.punto_venta && (
                                <p><strong>Punto de Venta:</strong> {arcaTestResult.data.punto_venta}</p>
                              )}
                              {arcaTestResult.data.fecha_emision && (
                                <p><strong>Fecha:</strong> {new Date(arcaTestResult.data.fecha_emision).toLocaleString('es-AR')}</p>
                              )}
                              {arcaTestResult.data.pdf_url && (
                                <a
                                  href={arcaTestResult.data.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1 mt-2"
                                >
                                  Descargar PDF
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-red-400">
                          ❌ {arcaTestResult.error}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl border border-border/60 bg-background-secondary/60 space-y-3">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary-400" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      ¿Cómo funciona la facturación centralizada con ARCA?
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Nuestro equipo mantiene los certificados y credenciales. Solo necesitamos tu CUIT para emitir comprobantes a tu nombre.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowArcaTutorial((prev) => !prev)}
                  className="flex items-center gap-2 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Info className="w-4 h-4" />
                  {showArcaTutorial ? "Ocultar tutorial AFIP y ARCA" : "Ver tutorial paso a paso (AFIP + ARCA)"}
                </button>

                {showArcaTutorial && (
                  <div className="p-3 rounded-lg bg-background/80 border border-border/40 text-xs text-foreground-secondary space-y-2">
                    <p className="font-semibold text-foreground">Tutorial rápido</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        <strong>Ingresá a AFIP</strong> con clave fiscal y abrí el <em>Administrador de Relaciones</em>.
                      </li>
                      <li>
                        Elegí <strong>Delegar servicio</strong> &rarr; Buscá “Facturación Electrónica” y delegalo a la CUIT del proveedor que administra ARCA para tu estudio (<code className="bg-background px-1 rounded text-foreground">20-41834523-4</code> - ARJA ERP).
                      </li>
                      <li>
                        Volvé a esta pantalla, ingresá tu CUIT y tocá <strong>Guardar configuración</strong>.
                      </li>
                      <li>
                        Presioná <strong>Verificar conexión</strong>. Si todo está OK vas a ver el mensaje en verde.
                      </li>
                      <li>
                        Finalmente, generá la <strong>Factura de prueba</strong> para confirmar que AFIP responde correctamente.
                      </li>
                    </ol>
                    <p>
                      <strong>¿Usás tus propios certificados?</strong> Además de subir el archivo <code className="bg-background px-1 rounded text-foreground">.p12</code> (o <code className="bg-background px-1 rounded text-foreground">.crt</code>/<code className="bg-background px-1 rounded text-foreground">.key</code>), asegurate de tener habilitado el servicio WSFE/WSAA en AFIP para tu CUIT. En ese caso no necesitás delegar.
                    </p>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-3 text-xs text-foreground-secondary">
                  <div className="p-3 rounded-lg bg-background/80 border border-border/40">
                    <p className="font-semibold text-foreground mb-1">1. Guardá tu CUIT</p>
                    <p>Ingresá el CUIT y guardá la configuración. El sistema lo usa para generar tus facturas.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border/40">
                    <p className="font-semibold text-foreground mb-1">2. Verificá la conexión</p>
                    <p>Usá el botón <strong>Verificar conexión</strong> para confirmar que el servidor tiene todo listo.</p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border/40">
                    <p className="font-semibold text-foreground mb-1">3. Emití una prueba</p>
                    <p>Cuando el estado sea OK, generá una factura de prueba para confirmar que AFIP responde correctamente.</p>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-background/60 border border-border/30 text-xs text-foreground-muted">
                  <p className="font-medium text-foreground mb-1">¿Querés usar tus propios certificados?</p>
                  <p>
                    Escribinos por soporte y te ayudamos a habilitar el modo avanzado. Vas a necesitar cargar tu certificado
                    <code className="bg-background px-1 mx-1 rounded text-foreground">.p12</code> o los archivos
                    <code className="bg-background px-1 mx-1 rounded text-foreground">.crt</code> y
                    <code className="bg-background px-1 mx-1 rounded text-foreground">.key</code>, junto con la contraseña.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-primary-500/10 backdrop-blur-xl border border-primary-500/30">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-primary-500/20 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-primary-400" />
                  </div>
                </div>
                <div className="text-sm text-foreground-secondary">
                  <p className="font-semibold text-foreground mb-2">Información importante:</p>
                  <ul className="space-y-1 list-disc list-inside ml-2">
                    <li>El número de WhatsApp debe incluir el código de país (ej: +54 para Argentina)</li>
                    <li>El CUIT es necesario para emitir facturas electrónicas</li>
                    <li>Estos datos pueden ser utilizados en facturas y comunicaciones</li>
                  </ul>
                </div>
              </div>
            </div>
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
                  
                  {/* Información de la cuenta */}
                  {mpStatus.accountInfo ? (
                    <div className="mt-2 space-y-1">
                      {mpStatus.accountInfo.email && (
                        <p className="text-sm text-gray-300 font-medium">
                          📧 {mpStatus.accountInfo.email}
                        </p>
                      )}
                      {mpStatus.accountInfo.firstName && mpStatus.accountInfo.lastName && (
                        <p className="text-xs text-gray-400">
                          👤 {mpStatus.accountInfo.firstName} {mpStatus.accountInfo.lastName}
                        </p>
                      )}
                      {mpStatus.accountInfo.nickname && !mpStatus.accountInfo.email && (
                        <p className="text-sm text-gray-400">
                          @{mpStatus.accountInfo.nickname}
                        </p>
                      )}
                      {mpStatus.userId && (
                        <p className="text-xs text-gray-500 mt-1">
                          ID Usuario MP: {mpStatus.userId}
                        </p>
                      )}
                      {mpStatus.accountInfo.countryId && (
                        <p className="text-xs text-gray-500">
                          🌍 País: {mpStatus.accountInfo.countryId === 'AR' ? 'Argentina' : mpStatus.accountInfo.countryId}
                        </p>
                      )}
                    </div>
                  ) : mpStatus.userId ? (
                    <div className="mt-2">
                      <p className="text-sm text-gray-400">Usuario MP: {mpStatus.userId}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ⚠️ No se pudo obtener información detallada de la cuenta
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mt-2">No se pudo identificar el usuario</p>
                  )}

                  {/* Estado y modo */}
                  {mpStatus.accountStatus && (
                    <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
                      <p className={`text-xs font-medium ${
                        mpStatus.accountStatus.status === 'ready' 
                          ? 'text-green-400' 
                          : 'text-amber-400'
                      }`}>
                        {mpStatus.accountStatus.mode}
                      </p>
                      <p className="text-xs text-gray-400">
                        {mpStatus.accountStatus.message}
                      </p>
                    </div>
                  )}
                  
                  {/* Información adicional si no hay accountStatus */}
                  {!mpStatus.accountStatus && (
                    <div className="mt-2 space-y-1">
                      {mpStatus.expiresAt && (
                        <p className="text-xs text-gray-500">
                          Token expira: {new Date(mpStatus.expiresAt).toLocaleString('es-AR')}
                        </p>
                      )}
                      {mpStatus.liveMode !== undefined && (
                        <p className="text-xs text-gray-500">
                          Modo: {mpStatus.liveMode ? '🟢 Producción' : '🟡 Pruebas'}
                        </p>
                      )}
                    </div>
                  )}

                  {mpStatus.accountError && (
                    <p className="text-xs text-red-400 mt-2">
                      ⚠️ {mpStatus.accountError}
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

              {/* Información adicional de estado de la cuenta */}
              {mpStatus.accountStatus && mpStatus.accountStatus.status !== 'ready' && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl mb-6">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-amber-300 font-medium mb-1">Cuenta requiere atención</p>
                    <p className="text-sm text-amber-200/80 mb-2">
                      {mpStatus.accountStatus.message}
                    </p>
                    {!mpStatus.accountStatus.verified && (
                      <p className="text-xs text-amber-200/70 mb-1">
                        • Verifica que tu cuenta esté completamente verificada en Mercado Pago
                      </p>
                    )}
                    {!mpStatus.accountStatus.canReceivePayments && mpStatus.liveMode && (
                      <p className="text-xs text-amber-200/70 mb-1">
                        • Verifica que la cuenta esté habilitada para recibir pagos online
                      </p>
                    )}
                    {!mpStatus.liveMode && (
                      <p className="text-xs text-amber-200/70 mb-1">
                        • Tu cuenta está en modo PRUEBAS. Para recibir pagos reales, necesitas estar en modo PRODUCCIÓN
                      </p>
                    )}
                    <a
                      href="https://www.mercadopago.com.ar/home"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-300 hover:text-amber-200 underline inline-flex items-center gap-1 mt-2"
                    >
                      Ver cuenta en Mercado Pago →
                    </a>
                  </div>
                </div>
              )}

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
                  <div className="p-6 border-b border-border">
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-xl group-hover:scale-110 transition-transform">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Requerir pago de seña</h3>
                          <p className="text-sm text-foreground-muted">Los clientes deberán pagar antes de confirmar</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={mpConfig.deposit_enabled}
                          onChange={e => setMpConfig({ ...mpConfig, deposit_enabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-background-secondary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
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
                            ? 'border-primary bg-primary-light dark:bg-primary/20'
                            : 'border-border bg-background-secondary hover:border-border-hover'
                            }`}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className={`p-2 rounded-lg ${depositType === 'percentage'
                              ? 'bg-primary-light dark:bg-primary/20'
                              : 'bg-background-secondary group-hover:bg-border'
                              }`}>
                              <Percent className={`w-5 h-5 ${depositType === 'percentage' ? 'text-primary-400' : 'text-dark-400'
                                }`} />
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${depositType === 'percentage'
                              ? 'border-primary bg-primary'
                              : 'border-border'
                              }`}>
                              {depositType === 'percentage' && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <h4 className="font-semibold text-foreground mb-1">Porcentaje</h4>
                          <p className="text-sm text-foreground-muted">Calcula la seña como % del servicio</p>
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
                          <h4 className="font-semibold text-foreground mb-1">Monto fijo</h4>
                          <p className="text-sm text-foreground-muted">Misma seña para todos los servicios</p>
                        </button>
                      </div>

                      {/* Input de valor */}
                      <div className="space-y-2">
                        {depositType === 'percentage' ? (
                          <>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                              <Percent className="w-4 h-4" />
                              Porcentaje de seña
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={mpConfig.deposit_percentage || 20}
                                onChange={(e) => setMpConfig({ ...mpConfig, deposit_percentage: parseFloat(e.target.value) })}
                                className="input pr-12"
                                placeholder="20"
                                min="1"
                                max="100"
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted font-medium">%</span>
                            </div>
                            <p className="text-sm text-foreground-muted">
                              Ejemplo: Servicio $5000 → Seña ${((5000 * (mpConfig.deposit_percentage || 20)) / 100).toFixed(0)}
                            </p>
                          </>
                        ) : (
                          <>
                            <label className="flex items-center gap-2 text-sm font-medium text-foreground-secondary">
                              <DollarSign className="w-4 h-4" />
                              Monto fijo de seña
                            </label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted font-medium">$</span>
                              <input
                                type="number"
                                value={mpConfig.deposit_amount_fixed || ''}
                                onChange={(e) => setMpConfig({ ...mpConfig, deposit_amount_fixed: parseFloat(e.target.value) || null })}
                                className="input pl-10"
                                placeholder="1000"
                                min="0"
                                step="100"
                              />
                            </div>
                            <p className="text-sm text-foreground-muted">
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

              <div className="flex items-start gap-3 p-4 bg-background-secondary rounded-xl border border-border">
                <AlertCircle className="w-5 h-5 text-foreground-muted mt-0.5 flex-shrink-0" />
                <div className="text-sm text-foreground-muted">
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
            <FieldGroup label="Comisión por defecto (%)" hint="Porcentaje que se aplica a nuevos instructores">
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
                Para configurar comisiones individuales por instructor,{" "}
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

      {/* RECORDATORIOS DE TURNOS */}
      <div id="reminders" className="mt-12">
        <ConfigSection
          title="Recordatorios de Turnos"
          description="Configurá recordatorios automáticos por WhatsApp para tus clientes"
          icon={Bell}
        >
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/25">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Recordatorios automáticos</h4>
                  <p className="text-xs text-foreground-secondary">
                    Los recordatorios se envían automáticamente a tus clientes antes de sus turnos. Podés configurar cuántas horas antes se envían.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <SwitchField
                label="Activar recordatorios automáticos"
                description="Si está activado, se enviarán recordatorios automáticamente a los clientes antes de sus turnos"
                checked={remindersConfig.enabled}
                onChange={(checked) => setRemindersConfig(prev => ({ ...prev, enabled: checked }))}
              />

              {remindersConfig.enabled && (
                <FieldGroup
                  label="Horas de anticipación"
                  hint="¿Cuántas horas antes del turno se debe enviar el recordatorio? (0-168 horas = 7 días)"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="168"
                      value={remindersConfig.advance_hours}
                      onChange={(e) => {
                        const value = Math.max(0, Math.min(168, Number(e.target.value) || 24));
                        setRemindersConfig(prev => ({ ...prev, advance_hours: value }));
                      }}
                      className="input w-32 text-base font-medium"
                    />
                    <span className="text-sm text-foreground-secondary">
                      {remindersConfig.advance_hours === 1 
                        ? "hora antes" 
                        : remindersConfig.advance_hours === 24
                        ? "día antes"
                        : remindersConfig.advance_hours > 24
                        ? `${Math.round(remindersConfig.advance_hours / 24)} días antes`
                        : "horas antes"}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-foreground-muted">
                    Ejemplos: 24 horas = 1 día antes, 48 horas = 2 días antes, 2 horas = 2 horas antes
                  </div>
                </FieldGroup>
              )}

              {remindersConfig.enabled && (
                <>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-300 mb-1">Cómo funcionan los recordatorios</p>
                        <ul className="text-xs text-amber-200/90 space-y-1 list-disc list-inside">
                          <li>Se envían automáticamente por WhatsApp a los clientes</li>
                          <li>Solo se envían para turnos confirmados o programados</li>
                          <li>Cada turno recibe un solo recordatorio</li>
                          <li>Se envían dentro de una ventana de 1 hora antes del tiempo configurado</li>
                          <li>Requiere que WhatsApp esté configurado y activo</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={async () => {
                        try {
                          const response = await apiClient.post("/api/reminders/send");
                          const data = response.data || response;
                          if (data.ok) {
                            toast.success(
                              data.sent > 0
                                ? `Se enviaron ${data.sent} recordatorios`
                                : "No hay turnos que requieran recordatorio en este momento"
                            );
                          } else {
                            toast.error(data.error || "Error al enviar recordatorios");
                          }
                        } catch (error) {
                          toast.error(error?.response?.data?.error || "Error al enviar recordatorios");
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Enviar recordatorios ahora
                    </Button>
                    <span className="text-xs text-foreground-secondary">
                      Envía recordatorios manualmente para turnos que están dentro de la ventana configurada
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </ConfigSection>
      </div>

      {/* NOTIFICATIONS — sección temporalmente deshabilitada a pedido */}

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

/* Legacy MembershipPlanModal (reemplazado por la página /admin/membresias)
function MembershipPlanModal({ form, onClose, onChange, onSubmit, saving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-lg relative border border-border/70 p-6 sm:p-7">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground-secondary hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-semibold text-foreground mb-4">
          {form?.id ? "Editar plan de membresía" : "Nuevo plan de membresía"}
        </h3>
        <div className="space-y-4">
          <FieldGroup label="Nombre">
            <input
              type="text"
              value={form?.name ?? ""}
              onChange={(e) => onChange("name", e.target.value)}
              className="input w-full"
              placeholder="Ej: Mensual Clásica"
            />
          </FieldGroup>
          <FieldGroup label="Precio mensual">
            <input
              type="number"
              min="0"
              step="0.01"
              value={form?.price_decimal ?? 0}
              onChange={(e) => onChange("price_decimal", e.target.value)}
              className="input w-full"
            />
          </FieldGroup>
          <FieldGroup label="Duración (meses)">
            <input
              type="number"
              min="1"
              value={form?.duration_months ?? 1}
              onChange={(e) => onChange("duration_months", e.target.value)}
              className="input w-full"
            />
          </FieldGroup>
          <div>
            <p className="text-xs uppercase text-foreground-muted tracking-wide mb-2">
              Límites (dejá vacío para ilimitado)
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldGroup label="Clases por semana">
                <input
                  type="number"
                  min="0"
                  value={form?.max_classes_per_week ?? ""}
                  onChange={(e) => onChange("max_classes_per_week", e.target.value)}
                  className="input w-full"
                  placeholder="ej. 3"
                />
              </FieldGroup>
              <FieldGroup label="Clases por mes">
                <input
                  type="number"
                  min="0"
                  value={form?.max_classes_per_month ?? ""}
                  onChange={(e) => onChange("max_classes_per_month", e.target.value)}
                  className="input w-full"
                  placeholder="ej. 10"
                />
              </FieldGroup>
              <FieldGroup label="Turnos activos simultáneos">
                <input
                  type="number"
                  min="0"
                  value={form?.max_active_appointments ?? ""}
                  onChange={(e) => onChange("max_active_appointments", e.target.value)}
                  className="input w-full"
                  placeholder="ej. 4"
                />
              </FieldGroup>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup label="Día de vencimiento">
              <input
                type="number"
                min="1"
                max="31"
                value={form?.billing_day ?? ""}
                onChange={(e) => onChange("billing_day", e.target.value)}
                className="input w-full"
                placeholder="Ej: 10"
              />
              <p className="text-xs text-foreground-muted mt-1">
                Dejalo vacío para que se calcule desde la fecha de pago.
              </p>
            </FieldGroup>
            <FieldGroup label="Días de gracia">
              <input
                type="number"
                min="0"
                value={form?.grace_days ?? ""}
                onChange={(e) => onChange("grace_days", e.target.value)}
                className="input w-full"
              />
            </FieldGroup>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldGroup label="Interés por mora">
              <select
                value={form?.interest_type ?? "none"}
                onChange={(e) => onChange("interest_type", e.target.value)}
                className="input w-full"
              >
                <option value="none">Sin interés</option>
                <option value="fixed">Monto fijo</option>
                <option value="percent">Porcentaje</option>
              </select>
            </FieldGroup>
            {form?.interest_type !== "none" && (
              <FieldGroup label={form?.interest_type === "percent" ? "Porcentaje" : "Monto fijo"}>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form?.interest_value ?? 0}
                  onChange={(e) => onChange("interest_value", e.target.value)}
                  className="input w-full"
                  placeholder={form?.interest_type === "percent" ? "Ej: 5" : "Ej: 1500"}
                />
              </FieldGroup>
            )}
          </div>
          <div className="border border-border rounded-xl p-3">
            <SwitchField
              label="Bloquear automáticamente al vencer"
              description="Si está activo, los clientes con deuda no podrán reservar cuando pase el vencimiento + gracia."
              checked={form?.auto_block ?? true}
              onChange={(e) => onChange("auto_block", e.target.checked)}
            />
          </div>
          <FieldGroup label="Descripción (opcional)">
            <textarea
              value={form?.description ?? ""}
              onChange={(e) => onChange("description", e.target.value)}
              className="input w-full min-h-[90px]"
            />
          </FieldGroup>
          <div className="border border-border rounded-xl p-3">
            <SwitchField
              label="Plan activo"
              description={
                form?.id
                  ? "Podés pausar temporalmente la venta de este plan."
                  : "Los planes nuevos se crean activos."
              }
              checked={form?.is_active ?? true}
              disabled={!form?.id}
              onChange={(e) => onChange("is_active", e.target.checked)}
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="btn-primary"
              disabled={saving}
            >
              {saving ? "Guardando..." : form?.id ? "Guardar cambios" : "Crear plan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
*/