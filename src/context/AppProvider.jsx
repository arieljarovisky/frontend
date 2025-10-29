// src/context/AppProvider.jsx
import React, {
  createContext,
  useCallback,
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
  const [range, _setRange] = useState(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 30);
    return { fromIso: start.toISOString(), toIso: end.toISOString() };
  });
  const rangeRef = useRef(range);
  useEffect(() => {
    rangeRef.current = range;
  }, [range]);

  const setRangeSafe = useCallback((next) => {
    if (!next) return;
    _setRange((prev) =>
      prev.fromIso === next.fromIso && prev.toIso === next.toIso ? prev : next
    );
  }, []);

  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const pollTimer = useRef(null);
  const debounceTimer = useRef(null);

  // --- Booking save state ---
  const [bookingSave, setBookingSave] = useState({
    saving: false,
    ok: false,
    error: "",
  });

  // ============================================
  // 🧰 Helper: Local MySQL datetime
  // ============================================
  const toLocalMySQL = useCallback((val) => {
    if (!val) return "";
    const fmt = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    if (typeof val === "string") {
      let s = val.trim();
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        s = s.replace("T", " ");
        return s.length === 16 ? s + ":00" : s.slice(0, 19);
      }
      if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}(:\d{2})?$/.test(s)) {
        return s.length === 16 ? s + ":00" : s.slice(0, 19);
      }
      if (/[Zz]$/.test(s) || /[+\-]\d{2}:\d{2}$/.test(s)) {
        const d = new Date(s);
        if (!Number.isNaN(d.getTime())) return fmt(d);
        return "";
      }
    }
    if (val instanceof Date) return fmt(val);
    if (typeof val === "number") {
      const ms = val > 1e12 ? val : val * 1000;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return fmt(d);
    }
    return "";
  }, []);

  // ============================================
  // 🔄 Cargar metadata (servicios + estilistas)
  // ============================================
  useEffect(() => {
    (async () => {
      try {
        setMetaLoading(true);
        const [srv, sty] = await Promise.all([
          apiClient.getServices(),
          apiClient.getStylists(),
        ]);
        setServices(srv);
        setStylists(sty);
      } catch (e) {
        console.error("❌ Error cargando metadata:", e);
        setMetaError(String(e.message || e));
      } finally {
        setMetaLoading(false);
      }
    })();
  }, []);

  // ============================================
  // 📅 Cargar eventos — función ESTABLE
  // ============================================
  const loadEvents = useCallback(async () => {
    const { fromIso, toIso } = rangeRef.current || {};
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
  }, []); // 👈 ya no depende de `range`

  // 🔔 Debounce cuando cambia el rango visible (navegación)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      loadEvents();
      debounceTimer.current = null;
    }, 150);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [range, loadEvents]);

  // ⏱️ Polling estable (no se reinicia al scrollear)
  useEffect(() => {
    loadEvents(); // primer carga
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(loadEvents, pollMs);
    return () => pollTimer.current && clearInterval(pollTimer.current);
  }, [loadEvents, pollMs]);

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

      const resp = await apiClient.getAvailability({
        serviceId,
        stylistId,
        date,
        stepMin: 20,
      });

      if (resp?.ok === false) throw new Error(resp?.error || "Sin disponibilidad");

      const rawSlots = resp?.data?.slots ?? resp?.slots ?? [];
      const rawBusySlots = resp?.data?.busySlots ?? resp?.busySlots ?? [];

      const normalizeSlot = (slot) => {
        if (typeof slot === "string" && /^\d{1,2}:\d{2}$/.test(slot)) {
          const [h, m] = slot.split(":");
          return `${date} ${h.padStart(2, "0")}:${m.padStart(2, "0")}:00`;
        }
        return toLocalMySQL(slot);
      };

      let slots = Array.isArray(rawSlots) ? rawSlots.map(normalizeSlot).filter(Boolean) : [];
      let busySlots =
        Array.isArray(rawBusySlots) ? rawBusySlots.map(normalizeSlot).filter(Boolean) : [];

      const now = new Date();
      const validSlots = slots.filter((iso) => new Date(iso.replace(" ", "T")) > now);
      const validBusySlots = busySlots.filter((iso) => new Date(iso.replace(" ", "T")) > now);

      setAvailability({
        slots: validSlots,
        busySlots: validBusySlots,
        loading: false,
        error: validSlots.length === 0 ? "No hay horarios disponibles" : "",
      });
    } catch (e) {
      console.error("❌ [AVAIL] error", e);
      setAvailability({
        slots: [],
        busySlots: [],
        loading: false,
        error: String(e.message || e),
      });
    }
  }, [booking, toLocalMySQL]);

  // ============================================
  // ✅ Crear / Editar / Eliminar turno
  // ============================================
  const createAppointment = useCallback(
    async (overrideData = {}) => {
      const customerPhone = overrideData.customerPhone || booking.customerPhone;
      const customerName =
        overrideData.customerName !== undefined ? overrideData.customerName : booking.customerName;
      const { selectedSlot, serviceId, stylistId } = booking;

      if (!customerPhone) {
        setBookingSave({ saving: false, ok: false, error: "⚠️ Ingresá tu teléfono de WhatsApp" });
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

        const res = await apiClient.createAppointment(payload);
        if (!res?.ok && !res?.id) throw new Error(res?.error || "No se pudo crear el turno");

        setBookingSave({ saving: false, ok: true, error: "" });
        await loadEvents(); // estable
        setTimeout(() => setBookingSave({ saving: false, ok: false, error: "" }), 3000);
      } catch (e) {
        setBookingSave({ saving: false, ok: false, error: String(e.message || e) });
      }
    },
    [booking, services, toLocalMySQL, loadEvents]
  );

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
    [toLocalMySQL, loadEvents]
  );

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
  // 📦 Context value
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
      setRange: setRangeSafe, // 👈 versión que evita renders inútiles
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
      loadAvailability,
      createAppointment,
      loadEvents,
      updateAppointment,
      deleteAppointment,
      setRangeSafe,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
