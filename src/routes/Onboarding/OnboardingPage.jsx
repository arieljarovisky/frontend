import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient, authApi } from "../../api/client";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import ThemeToggle from "../../components/ThemeToggle";
import Logo from "../../components/Logo";
import { useAuth } from "../../context/AuthContext";

const STEP_IDS = ["owner", "business", "branding", "plan"];

const BUSINESS_TYPES = [
  { value: "salon", label: "Salón de Belleza" },
  { value: "barbershop", label: "Barbería" },
  { value: "spa", label: "Spa / Estética" },
  { value: "gym", label: "Gimnasio / Fitness" },
  { value: "other", label: "Otro rubro" },
];

const FEATURE_OPTIONS = [
  { key: "facturacion", label: "Necesito facturación electrónica" },
  { key: "stock", label: "Gestiono stock de productos" },
  { key: "classes", label: "Ofrezco clases / sesiones grupales" },
  { key: "automation", label: "Quiero automatizar recordatorios y campañas" },
];

const COLORS = [
  "#6366F1",
  "#C084FC",
  "#F97316",
  "#22C55E",
  "#0EA5E9",
  "#F43F5E",
];

const initialForm = {
  owner: {
    name: "",
    email: "",
    phone: "",
    password: "",
  },
  business: {
    business_type: "",
    professionals_count: "",
    monthly_appointments: "",
    notes: "",
  },
  features: {
    facturacion: false,
    stock: false,
    classes: false,
    automation: false,
  },
  branding: {
    name: "",
    subdomain: "",
    color_primary: COLORS[0],
    color_secondary: COLORS[2],
    logo_url: "",
  },
};

const fadeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [session, setSession] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [planRecommendation, setPlanRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [subdomainStatus, setSubdomainStatus] = useState({
    checking: false,
    available: null,
    message: "",
  });
  const currentStep = STEP_IDS[stepIndex];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex]);

  const handleInput = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleFeatureToggle = (key) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key],
      },
    }));
  };

  const validateCurrentStep = () => {
    setError("");
    if (currentStep === "owner") {
      const { name, email, password } = formData.owner;
      if (!name.trim()) return "Necesitamos tu nombre";
      if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
        return "Ingresá un email válido";
      }
      if (!password || password.length < 6) {
        return "La contraseña debe tener al menos 6 caracteres";
      }
    } else if (currentStep === "business") {
      if (!formData.business.business_type) {
        return "Seleccioná el tipo de negocio";
      }
    } else if (currentStep === "branding") {
      const { name, subdomain } = formData.branding;
      if (!name.trim()) return "Ingresá el nombre comercial";
      if (!subdomain.trim() || !/^[a-z0-9-]{3,20}$/.test(subdomain)) {
        return "Elegí un subdominio (3-20 caracteres, solo letras, números o guiones)";
      }
      if (subdomainStatus.available === false) {
        return "El subdominio no está disponible";
      }
    }
    return "";
  };

  const syncOwnerSession = async () => {
    const payload = {
      email: formData.owner.email,
      owner_name: formData.owner.name,
      phone: formData.owner.phone,
    };
    const response = await apiClient.onboarding.start(payload);
    if (response?.session) {
      setSession(response.session);
      if (response.session.id) {
        sessionStorage.setItem("onboardingSessionId", response.session.id);
      }
    }
  };

  const syncBusinessSession = async () => {
    if (!session) return;
    const payload = {
      business: formData.business,
      features: formData.features,
    };
    const response = await apiClient.onboarding.saveBusiness(session.id, payload);
    if (response?.session) {
      setSession(response.session);
      if (response.session.id) {
        sessionStorage.setItem("onboardingSessionId", response.session.id);
      }
    }
  };

  const syncBrandingSession = async () => {
    if (!session) return;
    const payload = {
      branding: formData.branding,
    };
    const response = await apiClient.onboarding.saveBranding(session.id, payload);
    if (response?.session) {
      setSession(response.session);
      if (response.session.id) {
        sessionStorage.setItem("onboardingSessionId", response.session.id);
      }
    }
  };

  const fetchPlanRecommendation = async () => {
    if (!session) return;
    const response = await apiClient.onboarding.recommendPlan(session.id);
    if (response?.recommendation) {
      setPlanRecommendation(response.recommendation);
      sessionStorage.setItem(
        "onboardingSessionPlan",
        response.recommendation?.recommended || ""
      );
    }
  };

  const handleNext = async () => {
    const validation = validateCurrentStep();
    if (validation) {
      setError(validation);
      return;
    }

    setError("");
    setLoading(true);
    try {
      if (currentStep === "owner") {
        await syncOwnerSession();
      } else if (currentStep === "business") {
        await syncBusinessSession();
      } else if (currentStep === "branding") {
        await syncBrandingSession();
      }

      if (currentStep === "branding") {
        await fetchPlanRecommendation();
      }

      if (stepIndex < STEP_IDS.length - 1) {
        setStepIndex((prev) => prev + 1);
      }
    } catch (err) {
      console.error("[ONBOARDING] next error", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "No se pudieron guardar los datos, intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrev = () => {
    if (stepIndex === 0) return;
    setStepIndex((prev) => prev - 1);
  };

  const handleFinish = async () => {
    const validation = validateCurrentStep();
    if (validation) {
      setError(validation);
      return;
    }
    if (!session) {
      setError("La sesión expiró. Volvé al inicio.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await syncBusinessSession();
      await syncBrandingSession();
      const response = await apiClient.onboarding.finish(session.id, {
        password: formData.owner.password,
      });

      if (!response?.tenant) {
        navigate("/login");
        return;
      }

      const tenantSlug = response.tenant.subdomain;
      const email = response.user?.email || session.email;

      if (response.session?.id) {
        sessionStorage.setItem("onboardingSessionId", response.session.id);
      }
      if (tenantSlug) {
        sessionStorage.setItem("onboardingTenantSlug", tenantSlug);
      }
      sessionStorage.setItem(
        "onboardingSessionPlan",
        response.plan?.recommended ||
          response.session?.plan ||
          planRecommendation?.recommended ||
          session?.plan?.recommended ||
          ""
      );

      try {
        const loginResp = await authApi.login(email, formData.owner.password);
        if (loginResp?.multiTenant && tenantSlug) {
          await authApi.loginTenant(email, formData.owner.password, tenantSlug);
        }
      } catch (loginError) {
        console.error("[ONBOARDING] auto login error", loginError);
      }

      try {
        await refreshSession();
      } catch (err) {
        console.warn("[ONBOARDING] refreshSession warning:", err);
      }

      if (tenantSlug) {
        navigate(
          `/onboarding/payment?tenant=${tenantSlug}${
            response.session?.id ? `&session=${response.session.id}` : ""
          }`,
          { replace: true }
        );
      } else {
        navigate(
          `/onboarding/payment${
            response.session?.id ? `?session=${response.session.id}` : ""
          }`,
          { replace: true }
        );
      }
    } catch (err) {
      console.error("[ONBOARDING] finish error", err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Ocurrió un error al crear tu cuenta. Intentá nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const { subdomain } = formData.branding;
    if (
      currentStep === "branding" &&
      subdomain &&
      /^[a-z0-9-]{3,20}$/.test(subdomain)
    ) {
      setSubdomainStatus((prev) => ({
        ...prev,
        checking: true,
        message: "",
      }));
      const timer = setTimeout(async () => {
        try {
          const resp = await apiClient.onboarding.checkSubdomain(subdomain);
          setSubdomainStatus({
            checking: false,
            available: resp?.available ?? null,
            message: resp?.available
              ? "Excelente, está disponible"
              : "Este subdominio ya está en uso",
          });
        } catch (err) {
          console.error("[ONBOARDING] check subdomain error", err);
          setSubdomainStatus({
            checking: false,
            available: null,
            message: "No se pudo verificar, intentá más tarde",
          });
        }
      }, 600);

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }
    return () => controller.abort();
  }, [formData.branding.subdomain, currentStep]);

  const renderStep = () => {
    switch (currentStep) {
      case "owner":
        return (
          <OwnerStep
            data={formData.owner}
            onChange={handleInput}
          />
        );
      case "business":
        return (
          <BusinessStep
            data={formData.business}
            features={formData.features}
            onChange={handleInput}
            onToggleFeature={handleFeatureToggle}
          />
        );
      case "branding":
        return (
          <BrandingStep
            data={formData.branding}
            onChange={handleInput}
            subdomainStatus={subdomainStatus}
          />
        );
      case "plan":
        return (
          <PlanStep
            session={session}
            plan={planRecommendation}
            features={formData.features}
          />
        );
      default:
        return null;
    }
  };

  const progress = useMemo(
    () => ((stepIndex + 1) / STEP_IDS.length) * 100,
    [stepIndex]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_0%_0%,#6366f122,transparent_55%)]" />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size="small" showText />
            <span className="text-sm text-slate-300">
              Configurá tu sistema en menos de 5 minutos
            </span>
          </div>
          <ThemeToggle />
        </header>

        <div className="bg-slate-900/70 border border-slate-700/40 rounded-3xl p-6 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold mb-1">
                {currentStep === "owner" && "Contanos sobre vos"}
                {currentStep === "business" && "Tu negocio"}
                {currentStep === "branding" && "Personalizá tu sistema"}
                {currentStep === "plan" && "Plan recomendado"}
              </h1>
              <p className="text-sm text-slate-400">
                Paso {stepIndex + 1} de {STEP_IDS.length}
              </p>
            </div>
            <div className="w-32 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-fuchsia-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          <footer className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>¿Ya tenés cuenta?</span>
              <button
                onClick={() => navigate("/login")}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Iniciar sesión
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handlePrev}
                disabled={stepIndex === 0 || loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/60 text-sm text-slate-200 hover:bg-slate-800/60 disabled:opacity-40"
              >
                <ArrowLeft className="w-4 h-4" />
                Atrás
              </button>
              {currentStep === "plan" ? (
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      Finalizar
                      <CheckCircle2 className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-sm font-semibold hover:from-indigo-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function StepSection({ title, subtitle, children }) {
  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
      </header>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function InputField({ label, hint, ...props }) {
  return (
    <label className="space-y-2">
      <span className="block text-sm font-medium text-slate-200">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
      />
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </label>
  );
}

function OwnerStep({ data, onChange }) {
  return (
    <div className="space-y-6">
      <StepSection
        title="Tu información"
        subtitle="Usaremos estos datos para crear tu cuenta de administrador."
      >
        <InputField
          label="Nombre y apellido"
          value={data.name}
          onChange={(e) => onChange("owner", "name", e.target.value)}
          placeholder="Ej: Ana González"
        />
        <InputField
          label="Email de contacto"
          value={data.email}
          onChange={(e) => onChange("owner", "email", e.target.value)}
          placeholder="tu@email.com"
          type="email"
        />
        <InputField
          label="Teléfono (opcional)"
          value={data.phone}
          onChange={(e) => onChange("owner", "phone", e.target.value)}
          placeholder="+54 11 5555-5555"
        />
        <InputField
          label="Contraseña"
          value={data.password}
          onChange={(e) => onChange("owner", "password", e.target.value)}
          placeholder="Mínimo 6 caracteres"
          type="password"
        />
      </StepSection>
    </div>
  );
}

function BusinessStep({ data, features, onChange, onToggleFeature }) {
  return (
    <div className="space-y-8">
      <StepSection
        title="Sobre tu negocio"
        subtitle="Nos ayuda a configurar la cuenta ideal para vos."
      >
        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-200">
            Tipo de negocio
          </span>
          <select
            value={data.business_type}
            onChange={(e) => onChange("business", "business_type", e.target.value)}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
          >
            <option value="" disabled>
              Seleccioná una opción
            </option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid md:grid-cols-2 gap-4">
          <InputField
            label="Profesionales en tu local"
            value={data.professionals_count}
            onChange={(e) =>
              onChange("business", "professionals_count", e.target.value)
            }
            type="number"
            min="0"
            placeholder="Ej: 5"
          />
          <InputField
            label="Turnos mensuales estimados"
            value={data.monthly_appointments}
            onChange={(e) =>
              onChange("business", "monthly_appointments", e.target.value)
            }
            type="number"
            min="0"
            placeholder="Ej: 200"
          />
        </div>

        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-200">
            Comentarios adicionales (opcional)
          </span>
          <textarea
            value={data.notes}
            onChange={(e) => onChange("business", "notes", e.target.value)}
            rows={3}
            placeholder="Contanos algo particular de tu negocio..."
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
          />
        </label>
      </StepSection>

      <StepSection
        title="¿Qué necesitás gestionar?"
        subtitle="Seleccioná las opciones que mejor se adapten a tu negocio."
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {FEATURE_OPTIONS.map((feature) => (
            <button
              type="button"
              key={feature.key}
              onClick={() => onToggleFeature(feature.key)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                features[feature.key]
                  ? "border-indigo-500/60 bg-indigo-500/10 text-slate-100"
                  : "border-slate-700/40 bg-slate-900/40 text-slate-400 hover:border-slate-600/60"
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                  features[feature.key]
                    ? "border-indigo-400 bg-indigo-500/30"
                    : "border-slate-600"
                }`}
              >
                {features[feature.key] && (
                  <CheckCircle2 className="h-4 w-4 text-indigo-300" />
                )}
              </span>
              <span className="text-sm font-medium">{feature.label}</span>
            </button>
          ))}
        </div>
      </StepSection>
    </div>
  );
}

function BrandingStep({ data, onChange, subdomainStatus }) {
  return (
    <div className="space-y-8">
      <StepSection
        title="Identidad de tu sistema"
        subtitle="Estos datos se usarán en tu panel y para generar el acceso privado."
      >
        <InputField
          label="Nombre comercial"
          value={data.name}
          onChange={(e) => onChange("branding", "name", e.target.value)}
          placeholder="Ej: Estudio Belleza Zen"
        />
        <label className="space-y-2">
          <span className="block text-sm font-medium text-slate-200">
            Subdominio (acceso web)
          </span>
            <div className="flex items-center gap-3">
            <input
              value={data.subdomain}
              onChange={(e) => onChange("branding", "subdomain", e.target.value)}
              placeholder="Ej: belleza-zen"
              className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40"
            />
              <div className="text-xs text-slate-500">arjaerp.com/</div>
          </div>
          <p
            className={`text-xs ${
              subdomainStatus.available
                ? "text-emerald-400"
                : subdomainStatus.available === false
                ? "text-red-400"
                : "text-slate-500"
            }`}
          >
            {subdomainStatus.checking
              ? "Verificando disponibilidad..."
              : subdomainStatus.message || "Tu acceso sería: arjaerp.com/subdominio"}
          </p>
        </label>

        <div className="grid sm:grid-cols-2 gap-4">
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-200">
              Color principal
            </span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange("branding", "color_primary", color)}
                  className={`h-10 w-10 rounded-full border-2 transition ${
                    data.color_primary === color
                      ? "border-white scale-110"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </label>
          <label className="space-y-2">
            <span className="block text-sm font-medium text-slate-200">
              Color secundario
            </span>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onChange("branding", "color_secondary", color)}
                  className={`h-10 w-10 rounded-full border-2 transition ${
                    data.color_secondary === color
                      ? "border-white scale-110"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </label>
        </div>

        <InputField
          label="Logo (opcional)"
          value={data.logo_url}
          onChange={(e) => onChange("branding", "logo_url", e.target.value)}
          placeholder="Link a tu logo (PNG/JPG)"
        />
      </StepSection>
    </div>
  );
}

function PlanStep({ session, plan, features }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-500/40 bg-indigo-500/10 p-6">
        <h3 className="text-lg font-semibold text-indigo-200">
          ¡Listo! Este es el plan que recomendamos para vos
        </h3>
        <p className="text-sm text-indigo-100/80 mt-2">
          Podés cambiar de plan en cualquier momento desde tu panel.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6">
        <h4 className="text-lg font-semibold text-slate-100">
          Plan recomendado:{" "}
          <span className="text-indigo-300 uppercase tracking-wide">
            {plan?.recommended || "Starter"}
          </span>
        </h4>
        <ul className="mt-4 space-y-2 text-sm text-slate-300">
          {(plan?.reasons || ["Plan de entrada para comenzar a usar ARJA ERP"]).
            map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-300 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-6">
        <h5 className="text-sm font-semibold text-slate-200 uppercase tracking-wide mb-4">
          Resumen de lo que necesitás
        </h5>
        <dl className="grid sm:grid-cols-2 gap-3 text-sm text-slate-300">
          <div>
            <dt className="font-medium text-slate-400">Features clave</dt>
            <dd className="mt-1">
              {Object.entries(features)
                .filter(([, enabled]) => enabled)
                .map(([key]) => key)
                .join(", ") || "Funciones básicas"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-400">
              Email de administrador
            </dt>
            <dd className="mt-1">{session?.email}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

