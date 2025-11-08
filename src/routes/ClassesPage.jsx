import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  DollarSign,
  Plus,
  RefreshCw,
  UserPlus,
  Users,
  XCircle,
  Trash2,
} from "lucide-react";
import { apiClient } from "../api";
import { useQuery } from "../shared/useQuery";

const DEFAULT_FEATURES_BY_BUSINESS = {
  salon: { classes: false },
  gym: { classes: true },
  pilates: { classes: true },
  kinesiology: { classes: false },
  spa: { classes: false },
  other: { classes: false },
};

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "scheduled", label: "Programadas" },
  { value: "completed", label: "Completadas" },
  { value: "cancelled", label: "Canceladas" },
];

const ENROLLMENT_STATUS_OPTIONS = [
  { value: "reserved", label: "Reservado" },
  { value: "attended", label: "Asistió" },
  { value: "cancelled", label: "Cancelado" },
  { value: "noshow", label: "No asistió" },
];

const WEEKDAY_OPTIONS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const DEFAULT_REPEAT_OPTIONS = {
  enabled: false,
  weeks: 4,
  patterns: [],
};

const ACTIVE_ENROLLMENT_STATUSES = new Set(["reserved", "attended"]);

const parseJSON = (raw) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw;
  return {};
};

const toDateInputValue = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const addMinutesToISO = (iso, minutes) => {
  if (!iso || !minutes) return iso;
  const base = new Date(iso);
  if (Number.isNaN(base.getTime())) return iso;
  const end = new Date(base.getTime() + Number(minutes) * 60000);
  return toDateTimeLocalValue(end);
};

function toDateTimeLocalValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (v) => String(v).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

const formatDateTime = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const currency = (value) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(
    Number(value || 0)
  );

const ActionBanner = ({ message, onClose }) => {
  if (!message) return null;
  const palette =
    message.type === "error"
      ? "bg-red-500/10 border-red-500/40 text-red-200"
      : message.type === "success"
        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
        : "bg-blue-500/10 border-blue-500/40 text-blue-200";

  return (
    <div className={`flex items-start justify-between gap-4 px-4 py-3 rounded-xl border ${palette}`}>
      <div>
        <p className="font-medium">{message.title}</p>
        {message.body && <p className="text-sm opacity-80">{message.body}</p>}
      </div>
      <button
        onClick={onClose}
        className="text-sm opacity-70 hover:opacity-100 transition"
        aria-label="Cerrar mensaje"
      >
        ✕
      </button>
    </div>
  );
};

export default function ClassesPage() {
  const today = new Date();
  const defaultFrom = toDateInputValue(today);
  const defaultTo = toDateInputValue(new Date(today.getTime() + 1000 * 60 * 60 * 24 * 14));
  const defaultStartsAt = `${defaultFrom}T09:00`;
  const defaultEndsAt = `${defaultFrom}T10:00`;

  const [filters, setFilters] = useState({
    from: defaultFrom,
    to: defaultTo,
    status: "scheduled",
  });

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");

  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState("");

  const [stylists, setStylists] = useState([]);
  const [services, setServices] = useState([]);

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const [sessionFormOpen, setSessionFormOpen] = useState(false);
  const [templateFormOpen, setTemplateFormOpen] = useState(false);

  const [sessionForm, setSessionForm] = useState({
    templateId: "",
    activityType: "",
    stylistId: "",
    serviceId: "",
    startsAt: defaultStartsAt,
    endsAt: defaultEndsAt,
    capacityMax: 10,
    priceDecimal: 0,
    notes: "",
  });
  const [sessionDurationMin, setSessionDurationMin] = useState(60);
  const [repeatOptions, setRepeatOptions] = useState(DEFAULT_REPEAT_OPTIONS);
  const [savingSession, setSavingSession] = useState(false);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    activityType: "",
    defaultCapacity: 10,
    defaultDurationMin: 60,
    defaultPriceDecimal: 0,
    defaultStylistId: "",
    color: "",
    description: "",
    isActive: true,
  });
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [enrollForm, setEnrollForm] = useState({
    customerId: "",
    customerName: "",
    customerPhone: "",
    notes: "",
  });
  const [savingEnrollment, setSavingEnrollment] = useState(false);

  const [actionMessage, setActionMessage] = useState(null);

  const dismissMessage = () => setActionMessage(null);

const { data: tenantBusinessInfo, loading: businessInfoLoading } = useQuery(
    () => apiClient.getTenantBusinessInfo(),
    []
  );

  const tenantFeatures = useMemo(
    () => parseJSON(tenantBusinessInfo?.features_config || tenantBusinessInfo?.featuresConfig),
    [tenantBusinessInfo]
  );
  const enabledFeatures = useMemo(
    () => ({
      ...(DEFAULT_FEATURES_BY_BUSINESS[tenantBusinessInfo?.code] || {}),
      ...tenantFeatures,
    }),
    [tenantFeatures, tenantBusinessInfo?.code]
  );
  const classesEnabled = Boolean(enabledFeatures.classes);

  const fetchStylists = useCallback(async () => {
    try {
      const list = await apiClient.listStylists({ active: true });
      setStylists(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("❌ [classes] Error cargando estilistas:", error);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const list = await apiClient.listServices({ active: true });
      setServices(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("❌ [classes] Error cargando servicios:", error);
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      setTemplatesLoading(true);
      setTemplatesError("");
      const list = await apiClient.listClassTemplates();
      setTemplates(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("❌ [classes] Error cargando plantillas:", error);
      setTemplatesError(error?.message || "No se pudieron obtener las plantillas");
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      setSessionsLoading(true);
      setSessionsError("");
      const params = {
        from: filters.from ? `${filters.from} 00:00:00` : undefined,
        to: filters.to ? `${filters.to} 23:59:59` : undefined,
        status: filters.status || undefined,
      };
      const list = await apiClient.listClassSessions(params);
      setSessions(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error("❌ [classes] Error cargando sesiones:", error);
      setSessions([]);
      setSessionsError(error?.message || "No se pudieron obtener las clases");
    } finally {
      setSessionsLoading(false);
    }
  }, [filters]);

  const fetchSessionDetail = useCallback(
    async (sessionId) => {
      if (!sessionId) {
        setSessionDetail(null);
        setDetailError("");
        return;
      }
      try {
        setDetailLoading(true);
        setDetailError("");
        const detail = await apiClient.getClassSession(sessionId);
        setSessionDetail(detail);
      } catch (error) {
        console.error("❌ [classes] Error cargando detalle:", error);
        setDetailError(error?.message || "No se pudo cargar la clase seleccionada");
        setSessionDetail(null);
      } finally {
        setDetailLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchStylists();
    fetchServices();
    fetchTemplates();
  }, [fetchStylists, fetchServices, fetchTemplates]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionDetail(selectedSessionId);
    }
  }, [selectedSessionId, fetchSessionDetail]);

  const handleTemplateApply = (templateId) => {
    setSessionForm((prev) => ({ ...prev, templateId }));
    const template = templates.find((tpl) => String(tpl.id) === String(templateId));
    if (!template) return;

    setSessionForm((prev) => {
      const next = {
        ...prev,
        activityType: prev.activityType || template.activity_type || "",
        capacityMax: template.default_capacity ?? prev.capacityMax,
        priceDecimal: template.default_price_decimal ?? prev.priceDecimal,
      };
      if (!prev.stylistId && template.default_stylist_id) {
        next.stylistId = String(template.default_stylist_id);
      }
      if (template.default_duration_min) {
        next.endsAt = addMinutesToISO(prev.startsAt || defaultStartsAt, template.default_duration_min);
      }
      return next;
    });
    if (template.default_duration_min) {
      setSessionDurationMin(Number(template.default_duration_min));
    }
  };

  const handleSessionFormChange = (field, value) => {
    setSessionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSessionFormSubmit = async (event) => {
    event.preventDefault();
    if (!sessionForm.activityType.trim()) {
      setActionMessage({ type: "error", title: "Ingresá el tipo de actividad." });
      return;
    }
    if (!sessionForm.stylistId) {
      setActionMessage({ type: "error", title: "Seleccioná un profesor." });
      return;
    }
    if (!sessionForm.startsAt) {
      setActionMessage({ type: "error", title: "Elegí una fecha y hora de inicio." });
      return;
    }

    const payload = {
      templateId: sessionForm.templateId ? Number(sessionForm.templateId) : undefined,
      stylistId: Number(sessionForm.stylistId),
      serviceId: sessionForm.serviceId ? Number(sessionForm.serviceId) : undefined,
      startsAt: sessionForm.startsAt,
      endsAt: sessionForm.endsAt || addMinutesToISO(sessionForm.startsAt, sessionDurationMin),
      activityType: sessionForm.activityType.trim(),
      capacityMax: Number(sessionForm.capacityMax || 0),
      priceDecimal: Number(sessionForm.priceDecimal || 0),
      notes: sessionForm.notes?.trim() || undefined,
    };

    if (payload.capacityMax <= 0) {
      setActionMessage({ type: "error", title: "El cupo debe ser mayor a cero." });
      return;
    }

    let generatedSeriesId = null;

    if (repeatOptions.enabled) {
      generatedSeriesId = window.crypto?.randomUUID?.() || `series-${Date.now()}`;
      payload.seriesId = generatedSeriesId;
      const totalWeeks = Math.max(1, Number(repeatOptions.weeks || 0));
      const baseStartDate = new Date(sessionForm.startsAt);
      const baseEndDate = new Date(payload.endsAt);

      if (Number.isNaN(baseStartDate.getTime()) || Number.isNaN(baseEndDate.getTime())) {
        setActionMessage({ type: "error", title: "No se pudo interpretar la fecha de la clase base." });
        return;
      }

      const baseDurationMin = Math.max(1, sessionDurationMin || Math.round((baseEndDate - baseStartDate) / 60000));
      const baseTime = sessionForm.startsAt.slice(11, 16) || "09:00";
      const patterns = [
        {
          isBase: true,
          weekday: baseStartDate.getDay(),
          startTime: baseTime,
          durationMin: baseDurationMin,
        },
        ...repeatOptions.patterns.map((pattern) => ({
          weekday: Number(pattern.weekday ?? 0),
          startTime: pattern.startTime || baseTime,
          endTime: pattern.endTime || "",
          durationMin: pattern.durationMin ? Number(pattern.durationMin) : null,
          stylistId: pattern.stylistId || "",
          serviceId: pattern.serviceId || "",
          capacityMax: pattern.capacityMax,
          priceDecimal: pattern.priceDecimal,
          activityType: pattern.activityType,
          notes: pattern.notes,
        })),
      ];

      const additionalSessions = [];

      for (let week = 0; week < totalWeeks; week += 1) {
        patterns.forEach((pattern) => {
          const occurrence = new Date(baseStartDate);
          const diffDays = ((Number(pattern.weekday) - baseStartDate.getDay() + 7) % 7) + week * 7;
          occurrence.setDate(occurrence.getDate() + diffDays);

          const [hour, minute] = (pattern.startTime || baseTime).split(":").map((n) => Number(n));
          occurrence.setHours(
            Number.isFinite(hour) ? hour : baseStartDate.getHours(),
            Number.isFinite(minute) ? minute : baseStartDate.getMinutes(),
            0,
            0
          );

          let endDate;
          if (pattern.endTime) {
            const [eh, em] = pattern.endTime.split(":").map((n) => Number(n));
            endDate = new Date(occurrence);
            endDate.setHours(
              Number.isFinite(eh) ? eh : occurrence.getHours(),
              Number.isFinite(em) ? em : occurrence.getMinutes(),
              0,
              0
            );
          } else {
            const duration = Number.isFinite(pattern.durationMin) && pattern.durationMin > 0 ? pattern.durationMin : baseDurationMin;
            endDate = new Date(occurrence.getTime() + duration * 60000);
          }

          if (pattern.isBase && week === 0) {
            return;
          }

          const sessionOverride = {
            startsAt: toDateTimeLocalValue(occurrence),
            endsAt: toDateTimeLocalValue(endDate),
            seriesId: generatedSeriesId,
          };

          if (pattern.stylistId) sessionOverride.stylistId = Number(pattern.stylistId);
          if (pattern.serviceId) sessionOverride.serviceId = Number(pattern.serviceId);
          if (pattern.activityType) sessionOverride.activityType = String(pattern.activityType).trim();
          if (pattern.capacityMax !== undefined && pattern.capacityMax !== null && pattern.capacityMax !== "") {
            sessionOverride.capacityMax = Number(pattern.capacityMax);
          }
          if (pattern.priceDecimal !== undefined && pattern.priceDecimal !== null && pattern.priceDecimal !== "") {
            sessionOverride.priceDecimal = Number(pattern.priceDecimal);
          }
          if (pattern.notes) sessionOverride.notes = String(pattern.notes).trim();

          additionalSessions.push(sessionOverride);
        });
      }

      if (additionalSessions.length) {
        payload.repeat = { sessions: additionalSessions };
      }
    }

    try {
      setSavingSession(true);
      const response = await apiClient.createClassSession(payload);
      const createdCount = Array.isArray(response?.ids) ? response.ids.length : 1;

      setActionMessage({
        type: "success",
        title: createdCount > 1 ? `${createdCount} clases creadas` : "Clase creada correctamente.",
        body: createdCount > 1 ? "Se generaron todas las sesiones programadas." : "Ya podés anotar alumnos en la sesión.",
      });

      setSessionForm({
        templateId: "",
        activityType: "",
        stylistId: "",
        serviceId: "",
        startsAt: defaultStartsAt,
        endsAt: defaultEndsAt,
        capacityMax: 10,
        priceDecimal: 0,
        notes: "",
      });
      setSessionDurationMin(60);
      setRepeatOptions(DEFAULT_REPEAT_OPTIONS);
      setSessionFormOpen(false);
      await fetchSessions();
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudo crear la clase.",
        body: error?.response?.data?.error || error?.message || "Intentá nuevamente más tarde.",
      });
    } finally {
      setSavingSession(false);
    }
  };

  const handleTemplateFormSubmit = async (event) => {
    event.preventDefault();
    if (!templateForm.name.trim() || !templateForm.activityType.trim()) {
      setActionMessage({
        type: "error",
        title: "Completá nombre y tipo de actividad.",
      });
      return;
    }
    try {
      setSavingTemplate(true);
      await apiClient.createClassTemplate({
        name: templateForm.name.trim(),
        description: templateForm.description?.trim() || undefined,
        activityType: templateForm.activityType.trim(),
        defaultCapacity: Number(templateForm.defaultCapacity || 0),
        defaultDurationMin: Number(templateForm.defaultDurationMin || 0),
        defaultPriceDecimal: Number(templateForm.defaultPriceDecimal || 0),
        defaultStylistId: templateForm.defaultStylistId ? Number(templateForm.defaultStylistId) : undefined,
        color: templateForm.color || null,
        isActive: templateForm.isActive,
      });
      setActionMessage({
        type: "success",
        title: "Plantilla creada.",
        body: "Ahora podés reutilizarla al programar nuevas clases.",
      });
      setTemplateForm({
        name: "",
        activityType: "",
        defaultCapacity: 10,
        defaultDurationMin: 60,
        defaultPriceDecimal: 0,
        defaultStylistId: "",
        color: "",
        description: "",
        isActive: true,
      });
      setTemplateFormOpen(false);
      fetchTemplates();
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudo crear la plantilla.",
        body: error?.response?.data?.error || error?.message || "Intentá nuevamente más tarde.",
      });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleAddEnrollment = async (event) => {
    event.preventDefault();
    if (!selectedSessionId) return;
    if (!enrollForm.customerPhone.trim()) {
      setActionMessage({ type: "error", title: "Ingresá el teléfono del alumno." });
      return;
    }
    try {
      setSavingEnrollment(true);
      await apiClient.createClassEnrollment(selectedSessionId, {
        customerId: enrollForm.customerId ? Number(enrollForm.customerId) : undefined,
        customerName: enrollForm.customerName?.trim() || undefined,
        customerPhone: enrollForm.customerPhone.trim(),
        notes: enrollForm.notes?.trim() || undefined,
      });
      setActionMessage({
        type: "success",
        title: "Alumno inscripto.",
      });
      setEnrollForm({
        customerId: "",
        customerName: "",
        customerPhone: "",
        notes: "",
      });
      await Promise.all([fetchSessionDetail(selectedSessionId), fetchSessions()]);
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudo inscribir al alumno.",
        body: error?.response?.data?.error || error?.message || "",
      });
    } finally {
      setSavingEnrollment(false);
    }
  };

  const handleUpdateEnrollment = async (enrollmentId, nextStatus) => {
    if (!selectedSessionId || !enrollmentId) return;
    try {
      await apiClient.updateClassEnrollment(selectedSessionId, enrollmentId, { status: nextStatus });
      setActionMessage({
        type: "success",
        title: "Inscripción actualizada.",
      });
      await Promise.all([fetchSessionDetail(selectedSessionId), fetchSessions()]);
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudo actualizar la inscripción.",
        body: error?.response?.data?.error || error?.message || "",
      });
    }
  };

  const handleDeleteEnrollment = async (enrollmentId) => {
    if (!selectedSessionId || !enrollmentId) return;
    if (!window.confirm("¿Eliminar la inscripción seleccionada?")) return;
    try {
      await apiClient.deleteClassEnrollment(selectedSessionId, enrollmentId);
      setActionMessage({
        type: "success",
        title: "Inscripción eliminada.",
      });
      await Promise.all([fetchSessionDetail(selectedSessionId), fetchSessions()]);
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudo eliminar la inscripción.",
        body: error?.response?.data?.error || error?.message || "",
      });
    }
  };

  const handleCloseSession = async (id, status) => {
    if (!id) return;
    try {
      const payload = status ? { status } : undefined;
      await apiClient.updateClassSession(id, payload || {});
      setActionMessage({
        type: "success",
        title: "Clase actualizada.",
      });
      await Promise.all([fetchSessions(), fetchSessionDetail(id)]);
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudo actualizar la clase.",
        body: error?.response?.data?.error || error?.message || "",
      });
    }
  };

  const handleCancelSession = async (id) => {
    if (!id) return;
    if (!window.confirm("Vas a cancelar la clase y todas las inscripciones quedarán en espera. ¿Continuar?")) {
      return;
    }
    try {
      await apiClient.cancelClassSession(id);
      setActionMessage({
        type: "success",
        title: "Clase cancelada.",
      });
      if (selectedSessionId === id) {
        setSelectedSessionId(null);
      }
      await fetchSessions();
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudo cancelar la clase.",
        body: error?.response?.data?.error || error?.message || "",
      });
    }
  };

  const handleCancelSeries = async (seriesId) => {
    if (!seriesId) return;
    const confirm = window.confirm("¿Cancelar todas las clases programadas en esta serie?");
    if (!confirm) return;
    try {
      await apiClient.cancelClassSeries(seriesId);
      setActionMessage({
        type: "success",
        title: "Clases canceladas",
        body: "Se cancelaron todas las sesiones programadas de la serie.",
      });
      await fetchSessions();
      if (selectedSessionId) {
        await fetchSessionDetail(selectedSessionId);
      }
    } catch (error) {
      setActionMessage({
        type: "error",
        title: "No se pudieron cancelar las clases",
        body: error?.response?.data?.error || error?.message || "Intentá nuevamente más tarde.",
      });
    }
  };

  const activeEnrollments = useMemo(() => {
    if (!sessionDetail?.enrollments) return 0;
    return sessionDetail.enrollments.filter((e) => ACTIVE_ENROLLMENT_STATUSES.has(e.status)).length;
  }, [sessionDetail]);

  const handleRepeatToggle = (enabled) => {
    setRepeatOptions((prev) => ({
      ...prev,
      enabled,
    }));
  };

  const handleRepeatFieldChange = (field, value) => {
    setRepeatOptions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddPattern = () => {
    const baseStart = new Date(sessionForm.startsAt);
    const baseWeekday = Number.isNaN(baseStart.getTime()) ? 0 : baseStart.getDay();
    const baseTime = sessionForm.startsAt ? sessionForm.startsAt.slice(11, 16) : "09:00";

    setRepeatOptions((prev) => ({
      ...prev,
      patterns: [
        ...prev.patterns,
        {
          weekday: baseWeekday,
          startTime: baseTime,
          durationMin: sessionDurationMin || 60,
          stylistId: "",
          serviceId: "",
          capacityMax: "",
          priceDecimal: "",
          activityType: "",
          notes: "",
        },
      ],
    }));
  };

  const handlePatternFieldChange = (index, field, value) => {
    setRepeatOptions((prev) => {
      const patterns = [...prev.patterns];
      patterns[index] = { ...patterns[index], [field]: value };
      return { ...prev, patterns };
    });
  };

  const handleRemovePattern = (index) => {
    setRepeatOptions((prev) => ({
      ...prev,
      patterns: prev.patterns.filter((_, i) => i !== index),
    }));
  };

  if (businessInfoLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-foreground-secondary">
        <RefreshCw className="w-4 h-4 animate-spin" />
        Cargando configuración…
      </div>
    );
  }

  if (!classesEnabled) {
    return (
      <div className="max-w-3xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-amber-400" />
        <h1 className="text-3xl font-semibold text-foreground">Clases deshabilitadas</h1>
        <p className="text-foreground-secondary">
          Este negocio no tiene activada la gestión de clases grupales. Podés habilitarla desde{" "}
          <strong>Configuración → Sucursal → Features</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clases grupales</h1>
          <p className="text-foreground-secondary">
            Programá sesiones, gestioná plantillas y controlá inscripciones en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchSessions()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:border-primary-500 hover:text-primary-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refrescar
          </button>
          <button
            onClick={() => setTemplateFormOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary-500/10 text-secondary-200 border border-secondary-500/40 hover:bg-secondary-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            Nueva plantilla
          </button>
          <button
            onClick={() => {
              setRepeatOptions(DEFAULT_REPEAT_OPTIONS);
              setSessionFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition"
          >
            <Plus className="w-4 h-4" />
            Programar clase
          </button>
        </div>
      </div>

      <ActionBanner message={actionMessage} onClose={dismissMessage} />

      <section className="card p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-foreground-secondary block mb-1">
                Desde
              </label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-foreground-secondary block mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value }))}
                className="input"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-foreground-secondary block mb-1">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="input"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
            <CalendarClock className="w-4 h-4" />
            Mostrando {sessions.length} clases
          </div>
        </div>

        <div className="overflow-x-auto border border-border rounded-xl">
          {sessionsLoading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-foreground-secondary">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cargando clases…
            </div>
          ) : sessionsError ? (
            <div className="py-12 text-center text-red-400">{sessionsError}</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-foreground-secondary">
              No se encontraron clases en este rango de fechas.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-secondary text-foreground-muted text-xs uppercase tracking-wide">
                  <th className="py-3 px-4 text-left">Inicio</th>
                  <th className="py-3 px-4 text-left">Actividad</th>
                  <th className="py-3 px-4 text-left">Serie</th>
                  <th className="py-3 px-4 text-left">Profesor</th>
                  <th className="py-3 px-4 text-left">Cupo</th>
                  <th className="py-3 px-4 text-left">Precio</th>
                  <th className="py-3 px-4 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const isSelected = String(session.id) === String(selectedSessionId);
                  return (
                    <tr
                      key={session.id}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`border-b border-border cursor-pointer hover:bg-background-secondary transition ${
                        isSelected ? "bg-primary-500/10" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-medium text-foreground">{formatDateTime(session.starts_at)}</td>
                      <td className="py-3 px-4 text-foreground-secondary">{session.activity_type}</td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        {session.series_id ? session.series_id : "—"}
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">{session.stylist_name}</td>
                      <td className="py-3 px-4 text-foreground-secondary">
                        {session.capacity_max} lugares
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">{currency(session.price_decimal)}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            session.status === "scheduled"
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40"
                              : session.status === "completed"
                                ? "bg-blue-500/10 text-blue-300 border border-blue-500/40"
                                : "bg-red-500/10 text-red-300 border border-red-500/40"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="card p-5 space-y-4 xl:col-span-2">
          <h2 className="text-lg font-semibold text-foreground">Plantillas</h2>
          {templatesLoading ? (
            <div className="py-6 flex items-center gap-2 text-foreground-secondary">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cargando plantillas…
            </div>
          ) : templatesError ? (
            <div className="py-6 text-red-400">{templatesError}</div>
          ) : templates.length === 0 ? (
            <div className="py-6 text-foreground-secondary">Aún no cargaste plantillas.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <article
                  key={tpl.id}
                  className="rounded-xl border border-border bg-background-secondary/40 p-4 space-y-2"
                >
                  <header className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-md font-semibold text-foreground">{tpl.name}</h3>
                      <p className="text-sm text-foreground-secondary">{tpl.activity_type}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-lg ${
                        tpl.is_active ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {tpl.is_active ? "Activa" : "Inactiva"}
                    </span>
                  </header>
                  {tpl.description && (
                    <p className="text-sm text-foreground-secondary line-clamp-2">{tpl.description}</p>
                  )}
                  <dl className="grid grid-cols-2 gap-2 text-xs text-foreground-secondary">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Cupo: {tpl.default_capacity}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{currency(tpl.default_price_decimal)}</span>
                    </div>
                  </dl>
                  <button
                    className="text-xs text-primary-300 hover:text-primary-200 transition"
                    onClick={() => handleTemplateApply(tpl.id)}
                  >
                    Usar en nueva clase
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="card p-5 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Detalle de la clase</h2>

          {!selectedSessionId ? (
            <p className="text-sm text-foreground-secondary">
              Seleccioná una fila en la tabla para ver inscripciones y acciones rápidas.
            </p>
          ) : detailLoading ? (
            <div className="py-6 flex items-center gap-2 text-foreground-secondary">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Cargando detalle…
            </div>
          ) : detailError ? (
            <p className="text-sm text-red-400">{detailError}</p>
          ) : !sessionDetail ? (
            <p className="text-sm text-foreground-secondary">No se encontró información para esta clase.</p>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-background-secondary/50 p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase text-foreground-muted tracking-wide">Actividad</p>
                  <p className="text-sm font-medium text-foreground">{sessionDetail.activity_type}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-foreground-secondary">
                  <div>
                    <span className="text-xs uppercase text-foreground-muted block">Inicio</span>
                    {formatDateTime(sessionDetail.starts_at)}
                  </div>
                  <div>
                    <span className="text-xs uppercase text-foreground-muted block">Fin</span>
                    {formatDateTime(sessionDetail.ends_at)}
                  </div>
                  <div>
                    <span className="text-xs uppercase text-foreground-muted block">Profesor</span>
                    {sessionDetail.stylist_name}
                  </div>
                  <div>
                    <span className="text-xs uppercase text-foreground-muted block">Precio</span>
                    {currency(sessionDetail.price_decimal)}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border border-border/40 bg-background/60 text-xs">
                    Serie: {sessionDetail.series_id || "—"}
                  </span>
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-200 border border-primary-500/20 text-xs font-medium">
                    {sessionDetail.status}
                  </span>
                </div>
                {sessionDetail.notes && (
                  <p className="text-sm text-foreground-secondary border-t border-border pt-3">
                    {sessionDetail.notes}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleCloseSession(sessionDetail.id, "completed")}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 transition text-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar como completada
                  </button>
                  <button
                    onClick={() => handleCancelSession(sessionDetail.id)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 transition text-xs"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Cancelar clase
                  </button>
                  {sessionDetail.series_id && (
                    <button
                      onClick={() => handleCancelSeries(sessionDetail.series_id)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/10 transition text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Cancelar serie completa
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleAddEnrollment} className="bg-background-secondary/40 border border-border rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Añadir alumno
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className="input"
                    placeholder="Nombre"
                    value={enrollForm.customerName}
                    onChange={(e) => setEnrollForm((prev) => ({ ...prev, customerName: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="Teléfono (obligatorio)"
                    value={enrollForm.customerPhone}
                    onChange={(e) => setEnrollForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    required
                  />
                  <input
                    className="input"
                    placeholder="ID cliente (opcional)"
                    value={enrollForm.customerId}
                    onChange={(e) => setEnrollForm((prev) => ({ ...prev, customerId: e.target.value }))}
                  />
                  <input
                    className="input"
                    placeholder="Notas"
                    value={enrollForm.notes}
                    onChange={(e) => setEnrollForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingEnrollment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingEnrollment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Inscribir alumno
                </button>
              </form>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Inscripciones ({sessionDetail.enrollments?.length || 0})
                </h3>

                {sessionDetail.enrollments?.length ? (
                  <div className="space-y-2">
                    {sessionDetail.enrollments.map((enrollment) => (
                      <div
                        key={enrollment.id}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-border rounded-lg px-3 py-2"
                      >
                        <div>
                          <p className="text-sm text-foreground font-medium">
                            {enrollment.customer_name || "Cliente sin nombre"}
                          </p>
                          <p className="text-xs text-foreground-secondary">
                            {enrollment.customer_phone || "Sin teléfono"}
                          </p>
                          {enrollment.notes && (
                            <p className="text-xs text-foreground-secondary mt-1">{enrollment.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <select
                            value={enrollment.status}
                            onChange={(e) => handleUpdateEnrollment(enrollment.id, e.target.value)}
                            className="input text-xs"
                          >
                            {ENROLLMENT_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleDeleteEnrollment(enrollment.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-red-300 hover:text-red-200"
                          >
                            <XCircle className="w-3 h-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground-secondary">Aún no hay alumnos inscriptos.</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      {sessionFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto p-4" onClick={(e) => e.target === e.currentTarget && setSessionFormOpen(false)}>
          <div className="max-w-3xl w-full mx-auto my-8 bg-background border border-border rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Programar nueva clase</h2>
                <p className="text-sm text-foreground-secondary">
                  Completá la información para agregar una sesión al calendario.
                </p>
              </div>
              <button
                onClick={() => {
                  setSessionFormOpen(false);
                  setRepeatOptions(DEFAULT_REPEAT_OPTIONS);
                }}
                className="p-2 rounded-full hover:bg-background-secondary transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </header>
            <form onSubmit={handleSessionFormSubmit} className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Plantilla</span>
                  <select
                    className="input"
                    value={sessionForm.templateId}
                    onChange={(e) => handleTemplateApply(e.target.value)}
                  >
                    <option value="">Sin plantilla</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Tipo de actividad</span>
                  <input
                    className="input"
                    value={sessionForm.activityType}
                    onChange={(e) => handleSessionFormChange("activityType", e.target.value)}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Profesor</span>
                  <select
                    className="input"
                    value={sessionForm.stylistId}
                    onChange={(e) => handleSessionFormChange("stylistId", e.target.value)}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {stylists.map((sty) => (
                      <option key={sty.id} value={sty.id}>
                        {sty.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Servicio (opcional)</span>
                  <select
                    className="input"
                    value={sessionForm.serviceId}
                    onChange={(e) => handleSessionFormChange("serviceId", e.target.value)}
                  >
                    <option value="">Sin servicio asociado</option>
                    {services.map((svc) => (
                      <option key={svc.id} value={svc.id}>
                        {svc.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Inicio</span>
                  <input
                    type="datetime-local"
                    className="input"
                    value={sessionForm.startsAt}
                    onChange={(e) => handleSessionFormChange("startsAt", e.target.value)}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Fin</span>
                  <input
                    type="datetime-local"
                    className="input"
                    value={sessionForm.endsAt}
                    onChange={(e) => handleSessionFormChange("endsAt", e.target.value)}
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Duración (min)</span>
                  <input
                    type="number"
                    className="input"
                    value={sessionDurationMin}
                    onChange={(e) => setSessionDurationMin(Number(e.target.value || 0))}
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Cupo máximo</span>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={sessionForm.capacityMax}
                    onChange={(e) => handleSessionFormChange("capacityMax", e.target.value)}
                    required
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Precio</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input"
                    value={sessionForm.priceDecimal}
                    onChange={(e) => handleSessionFormChange("priceDecimal", e.target.value)}
                  />
                </label>

                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-foreground-secondary">Notas</span>
                  <textarea
                    className="input min-h-[80px]"
                    value={sessionForm.notes}
                    onChange={(e) => handleSessionFormChange("notes", e.target.value)}
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-border bg-background-secondary/40 p-4 space-y-4">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={repeatOptions.enabled}
                    onChange={(e) => handleRepeatToggle(e.target.checked)}
                  />
                  Repetir semanalmente
                </label>

                {repeatOptions.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <label className="flex flex-col gap-1 text-sm">
                        <span className="text-foreground-secondary">Semanas (incluye la actual)</span>
                        <input
                          type="number"
                          min={1}
                          className="input"
                          value={repeatOptions.weeks}
                          onChange={(e) => handleRepeatFieldChange("weeks", e.target.value)}
                        />
                      </label>
                      <div className="md:col-span-2 text-xs text-foreground-secondary">
                        Elegí cuántas semanas se generarán automáticamente. Podés sumar múltiples días y horarios por
                        semana con configuraciones personalizadas.
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background p-3 text-xs text-foreground-secondary">
                      La clase base se programará el {formatDateTime(sessionForm.startsAt)}. También se crearán todas las
                      repeticiones configuradas para las semanas indicadas.
                    </div>

                    <div className="space-y-3">
                      {repeatOptions.patterns.map((pattern, index) => (
                        <div key={`repeat-pattern-${index}`} className="rounded-xl border border-border bg-background p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">Repetición #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePattern(index)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Quitar
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Día</span>
                              <select
                                className="input"
                                value={pattern.weekday}
                                onChange={(e) => handlePatternFieldChange(index, "weekday", Number(e.target.value))}
                              >
                                {WEEKDAY_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Hora</span>
                              <input
                                type="time"
                                className="input"
                                value={pattern.startTime || ""}
                                onChange={(e) => handlePatternFieldChange(index, "startTime", e.target.value)}
                              />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Duración (min)</span>
                              <input
                                type="number"
                                min={15}
                                className="input"
                                value={pattern.durationMin ?? ""}
                                onChange={(e) => handlePatternFieldChange(index, "durationMin", e.target.value)}
                                placeholder={String(sessionDurationMin || 60)}
                              />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Profesor</span>
                              <select
                                className="input"
                                value={pattern.stylistId}
                                onChange={(e) => handlePatternFieldChange(index, "stylistId", e.target.value)}
                              >
                                <option value="">Usar profesor base</option>
                                {stylists.map((sty) => (
                                  <option key={sty.id} value={sty.id}>
                                    {sty.name}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Cupo</span>
                              <input
                                type="number"
                                min={1}
                                className="input"
                                value={pattern.capacityMax ?? ""}
                                onChange={(e) => handlePatternFieldChange(index, "capacityMax", e.target.value)}
                                placeholder={String(sessionForm.capacityMax || 1)}
                              />
                            </label>

                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Precio</span>
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                className="input"
                                value={pattern.priceDecimal ?? ""}
                                onChange={(e) => handlePatternFieldChange(index, "priceDecimal", e.target.value)}
                                placeholder={String(sessionForm.priceDecimal || 0)}
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Actividad</span>
                              <input
                                className="input"
                                value={pattern.activityType || ""}
                                onChange={(e) => handlePatternFieldChange(index, "activityType", e.target.value)}
                                placeholder="Usar actividad base"
                              />
                            </label>
                            <label className="flex flex-col gap-1 text-sm">
                              <span className="text-foreground-secondary">Servicio</span>
                              <select
                                className="input"
                                value={pattern.serviceId || ""}
                                onChange={(e) => handlePatternFieldChange(index, "serviceId", e.target.value)}
                              >
                                <option value="">Usar servicio base</option>
                                {services.map((svc) => (
                                  <option key={svc.id} value={svc.id}>
                                    {svc.name}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <label className="flex flex-col gap-1 text-sm">
                            <span className="text-foreground-secondary">Notas</span>
                            <textarea
                              className="input min-h-[60px]"
                              value={pattern.notes || ""}
                              onChange={(e) => handlePatternFieldChange(index, "notes", e.target.value)}
                              placeholder="Notas específicas para esta repetición"
                            />
                          </label>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddPattern}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-foreground-secondary hover:bg-background-secondary transition"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar día y horario
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setSessionFormOpen(false);
                    setRepeatOptions(DEFAULT_REPEAT_OPTIONS);
                  }}
                  className="px-4 py-2 rounded-lg border border-border text-foreground-secondary hover:bg-background-secondary transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingSession}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingSession ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Guardar clase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {templateFormOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 overflow-y-auto p-4" onClick={(e) => e.target === e.currentTarget && setTemplateFormOpen(false)}>
          <div className="max-w-2xl w-full mx-auto my-8 bg-background border border-border rounded-2xl shadow-2xl overflow-y-auto max-h-[85vh]">
            <header className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Nueva plantilla de clase</h2>
                <p className="text-sm text-foreground-secondary">
                  Guardá configuraciones frecuentes y reutilizalas al programar sesiones.
                </p>
              </div>
              <button
                onClick={() => setTemplateFormOpen(false)}
                className="p-2 rounded-full hover:bg-background-secondary transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </header>
            <form onSubmit={handleTemplateFormSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Nombre de la plantilla</span>
                  <input
                    className="input"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Tipo de actividad</span>
                  <input
                    className="input"
                    value={templateForm.activityType}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, activityType: e.target.value }))}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Cupo por defecto</span>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={templateForm.defaultCapacity}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, defaultCapacity: e.target.value }))}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Duración (min)</span>
                  <input
                    type="number"
                    min={1}
                    className="input"
                    value={templateForm.defaultDurationMin}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({ ...prev, defaultDurationMin: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Precio sugerido</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    className="input"
                    value={templateForm.defaultPriceDecimal}
                    onChange={(e) =>
                      setTemplateForm((prev) => ({ ...prev, defaultPriceDecimal: e.target.value }))
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="text-foreground-secondary">Profesor por defecto</span>
                  <select
                    className="input"
                    value={templateForm.defaultStylistId}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, defaultStylistId: e.target.value }))}
                  >
                    <option value="">Sin asignar</option>
                    {stylists.map((sty) => (
                      <option key={sty.id} value={sty.id}>
                        {sty.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-sm md:col-span-2">
                  <span className="text-foreground-secondary">Descripción</span>
                  <textarea
                    className="input min-h-[80px]"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <input
                    type="checkbox"
                    checked={templateForm.isActive}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  />
                  Plantilla activa
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setTemplateFormOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground-secondary hover:bg-background-secondary transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {savingTemplate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Guardar plantilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


