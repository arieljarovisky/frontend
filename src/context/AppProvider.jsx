import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiClient } from "../api/client";

export const AppContext = createContext(null);

export function AppProvider({ children, pollMs = 15000 }) {
  // --- Meta ---
  const [services, setServices] = useState([]);
  const [stylists, setStylists] = useState([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");

  // --- Availability ---
  const [availability, setAvailability] = useState({
    slots: [],
    busySlots: [],
    loading: false,
    error: "",
  });
  // --- Booking form ---
  const [booking, setBooking] = useState({
    serviceId: "",
    stylistId: "",
    date: "",
    selectedSlot: "",
    customerName: "",
    customerPhone: "",
  });
  const updateBooking = (patch) => setBooking((b) => ({ ...b, ...patch }));

  // --- Calendar events ---
  const [range, setRange] = useState(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  });
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const timer = useRef(null);

  // --- Booking save state ---
  const [bookingSave, setBookingSave] = useState({ saving: false, ok: false, error: "" });

  // ============================================
  // 📅 Helper: Convertir a MySQL local
  // ============================================
  function toLocalMySQL(val) {
    if (!val) return "";

    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      const ss = pad(d.getSeconds());
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    };

    // 1) Si es string SIN zona (local): NO usar Date, solo normalizar
    if (typeof val === "string") {
      let s = val.trim();

      // "YYYY-MM-DDTHH:MM(:SS)?" -> local (reemplazo T por espacio)
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        s = s.replace("T", " ");
        return s.length === 16 ? s + ":00" : s.slice(0, 19);
      }

      // "YYYY-MM-DD HH:MM(:SS)?" -> local (ya está)
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        return s.length === 16 ? s + ":00" : s.slice(0, 19);
      }

      // 2) Si trae zona (Z o +hh:mm), AHÍ sí usamos Date para convertir a local
      if (/[Zz]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) return fmt(d);
        return "";
      }
    }

    // 3) Date o epoch -> formateo local
    if (val instanceof Date) return fmt(val);
    if (typeof val === "number") {
      const ms = val > 1e12 ? val : val * 1000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return fmt(d);
    }

    return "";
  }

  // ============================================
  // 🔄 Cargar metadata (servicios + estilistas)
  // ============================================
  useEffect(() => {
    (async () => {
      try {
        setMetaLoading(true);
        const [srv, sty] = await Promise.all([apiClient.getServices(), apiClient.getStylists()]);
        setServices(srv);
        setStylists(sty);
      } catch (e) {
        console.error("❌ Error cargando metadata:", e.message);
        setMetaError(String(e.message || e));
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  // ============================================
  // 📅 Cargar eventos del calendario
  // ============================================
  const loadEvents = useCallback(async () => {
    const { fromIso, toIso } = range;
    if (!fromIso || !toIso) return;

    try {
      setEventsLoading(true);
      setEventsError("");
      const data = await apiClient.getAppointmentsBetween(fromIso, toIso);
      const evs = (data?.appointments ?? data ?? []).map((a) => ({
        id: String(a.id),
        title: `${a.customer_name ?? "Cliente"} • ${a.service_name ?? "Servicio"}`,
        start: a.starts_at,
        end: a.ends_at,
        backgroundColor: a.color_hex || undefined,
        borderColor: a.color_hex || undefined,
        extendedProps: a,
      }));
      setEvents(evs);
    } catch (e) {
      setEventsError(String(e.message || e));
    } finally {
      setEventsLoading(false);
    }
  }, [range]);

  // ============================================
  // 🔍 Cargar disponibilidad
  // ============================================
const loadAvailability = useCallback(async () => {
  const { serviceId, stylistId, date } = booking;
  if (!serviceId || !stylistId || !date) return;

  const selectedDate = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    setAvailability({
      slots: [],
      busySlots: [],
      loading: false,
      error: "⚠️ No podés buscar horarios para fechas pasadas",
    });
    return;
  }

  try {
    setAvailability((s) => ({ ...s, loading: true, error: "" }));

    const resp = await  apiClient.getAvailability({
      serviceId,
      stylistId,
      date,
      stepMin: 20,
    });

    console.log("📥 [Frontend] Respuesta availability:", resp);

    if (resp?.ok === false) throw new Error(resp?.error || "Sin disponibilidad");

    const rawSlots = resp?.data?.slots ?? resp?.slots ?? [];
    const rawBusySlots = resp?.data?.busySlots ?? resp?.busySlots ?? [];

    console.log("📊 [Frontend] Raw data:", {
      rawSlots: rawSlots.length,
      rawBusySlots: rawBusySlots.length,
      sampleSlot: rawSlots[0],
      sampleBusy: rawBusySlots[0],
    });

    // ✅ FUNCIÓN HELPER para normalizar: "HH:MM" → "YYYY-MM-DD HH:MM:SS"
    const normalizeSlot = (slot) => {
      // Si viene como "09:00", "09:20", etc.
      if (typeof slot === "string" && /^\d{1,2}:\d{2}$/.test(slot)) {
        const [h, m] = slot.split(":");
        const hh = h.padStart(2, "0");
        const mm = m.padStart(2, "0");
        return `${date} ${hh}:${mm}:00`; // ← Formato completo
      }
      // Si ya viene completo, lo devolvemos normalizado
      return toLocalMySQL(slot);
    };

    let slots = [];
    let busySlots = [];

    // ✅ Procesar slots
    if (Array.isArray(rawSlots) && rawSlots.length) {
      slots = rawSlots.map(normalizeSlot).filter(Boolean);
    }

    // ✅ Procesar busySlots CON EL MISMO FORMATO
    if (Array.isArray(rawBusySlots) && rawBusySlots.length) {
      busySlots = rawBusySlots.map(normalizeSlot).filter(Boolean);
    }

    console.log("✅ [Frontend] Procesado:", {
      slots: slots.length,
      busySlots: busySlots.length,
      sample: slots[0],
      busySample: busySlots[0],
    });

    // Filtrar horarios pasados
    const now = new Date();
    const validSlots = slots.filter((iso) => {
      const slotTime = new Date(iso.replace(" ", "T")); // ← Importante: convertir espacio a T
      return slotTime > now;
    });

    const validBusySlots = busySlots.filter((iso) => {
      const slotTime = new Date(iso.replace(" ", "T"));
      return slotTime > now;
    });

    console.log("🎯 [Frontend] Final:", {
      validSlots: validSlots.length,
      validBusySlots: validBusySlots.length,
    });

    setAvailability({
      slots: validSlots,
      busySlots: validBusySlots,
      loading: false,
      error: validSlots.length === 0 ? "No hay horarios disponibles" : "",
    });
  } catch (e) {
    console.error("❌ [AVAIL][error]", e);
    setAvailability({
      slots: [],
      busySlots: [],
      loading: false,
      error: String(e.message || e),
    });
  }
}, [booking, toLocalMySQL]);

  // ============================================
  // ✅ Crear turno
  // ============================================
  const createAppointment = useCallback(async (overrideData = {}) => {
    const customerPhone = overrideData.customerPhone || booking.customerPhone;
    const customerName = overrideData.customerName !== undefined
      ? overrideData.customerName
      : booking.customerName;
    const { selectedSlot, serviceId, stylistId } = booking;

    console.log("📤 [createAppointment] Datos recibidos:", {
      customerPhone,
      customerName,
      selectedSlot,
      serviceId,
      stylistId,
    });

    if (!customerPhone) {
      setBookingSave({
        saving: false,
        ok: false,
        error: "⚠️ Ingresá tu teléfono de WhatsApp",
      });
      return;
    }

    if (!selectedSlot || !serviceId || !stylistId) {
      setBookingSave({
        saving: false,
        ok: false,
        error: "⚠️ Completá todos los pasos antes de confirmar",
      });
      return;
    }

    const slotTime = new Date(selectedSlot);
    if (slotTime <= new Date()) {
      setBookingSave({
        saving: false,
        ok: false,
        error: "⚠️ El horario seleccionado ya pasó. Refrescá la página.",
      });
      return;
    }

    try {
      setBookingSave({ saving: true, ok: false, error: "" });

      const srv = (services || []).find((s) => String(s.id) === String(serviceId));
      const durationMin = srv?.duration_min ?? srv?.durationMin ?? undefined;
      const startsAt = toLocalMySQL(selectedSlot);

      const payload = {
        customerPhone: customerPhone.trim(),
        customerName: customerName ? customerName.trim() : undefined,
        stylistId: Number(stylistId),
        serviceId: Number(serviceId),
        startsAt,
        durationMin,
        status: "scheduled",
      };

      console.log("📤 [API] Enviando payload:", payload);

      const res = await apiClient.createAppointment(payload);

      console.log("📥 [API] Respuesta:", res);

      if (!res?.ok && !res?.id) {
        throw new Error(res?.error || "No se pudo crear el turno");
      }

      setBookingSave({
        saving: false,
        ok: true,
        error: "",
      });

      await loadEvents();

      setTimeout(() => {
        setBookingSave({ saving: false, ok: false, error: "" });
      }, 3000);
    } catch (e) {
      console.error("❌ [createAppointment] Error:", e);
      setBookingSave({
        saving: false,
        ok: false,
        error: String(e.message || e),
      });
    }
  }, [booking, services, loadEvents]);
  // ============================================
  // ✏️ Editar turno
  // ============================================
  const updateAppointment = useCallback(
    async (id, patch) => {
      try {
        const body = {
          ...patch,
          startsAt: patch.startsAt ? toLocalMySQL(patch.startsAt) : undefined,
          endsAt: patch.endsAt ? toLocalMySQL(patch.endsAt) : undefined,
        };
        await apiClient.updateAppointment(id, body);
        await loadEvents();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e.message || e) };
      }
    },
    [loadEvents]
  );

  // ============================================
  // 🗑️ Eliminar turno
  // ============================================
  const deleteAppointment = useCallback(
    async (id) => {
      try {
        await apiClient.deleteAppointment(id);
        await loadEvents();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e.message || e) };
      }
    },
    [loadEvents]
  );

  // ============================================
  // 🔄 Polling automático
  // ============================================
  useEffect(() => {
    loadEvents();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(loadEvents, pollMs);
    return () => timer.current && clearInterval(timer.current);
  }, [loadEvents, pollMs]);

  // ============================================
  // 📦 Valor del contexto
  // ============================================
  const value = useMemo(
    () => ({
      // Meta
      services,
      stylists,
      metaLoading,
      metaError,
      // Booking + availability
      booking,
      updateBooking,
      availability,
      loadAvailability,
      bookingSave,
      createAppointment,
      // Calendar
      events,
      eventsLoading,
      eventsError,
      range,
      setRange,
      loadEvents,
      updateAppointment,
      deleteAppointment,
    }),
    [
      services,
      stylists,
      metaLoading,
      metaError,
      booking,
      availability,
      bookingSave,
      events,
      eventsLoading,
      eventsError,
      range,
      loadEvents,
      createAppointment,
      updateAppointment,
      deleteAppointment,
      loadAvailability,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}