import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { api } from "../api/client"; // axios helpers

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
    loading: false,
    error: "",
  });

  // --- Booking form ---
  const [booking, setBooking] = useState({
    serviceId: "",
    stylistId: "",
    date: "",           // "YYYY-MM-DD"
    selectedSlot: "",   // "YYYY-MM-DD HH:MM:SS" (local)
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

  // ✅ helper: convierte Date/ISO/“YYYY-MM-DDTHH:MM(:SS)” a "YYYY-MM-DD HH:MM:SS" local (sin Z)
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

    // "YYYY-MM-DDTHH:MM(:SS)?"  -> local (reemplazo T por espacio)
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(s)) {
      s = s.replace("T", " ");
      return s.length === 16 ? s + ":00" : s.slice(0, 19);
    }

    // "YYYY-MM-DD HH:MM(:SS)?"  -> local (ya está)
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

  // --- Cargar meta ---
  useEffect(() => {
    (async () => {
      try {
        setMetaLoading(true);
        const [srv, sty] = await Promise.all([api.getServices(), api.getStylists()]);
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

  // --- Disponibilidad ---
  const loadAvailability = useCallback(async () => {
    const { serviceId, stylistId, date } = booking; // date="YYYY-MM-DD"
    if (!serviceId || !stylistId || !date) return;

    try {
      setAvailability((s) => ({ ...s, loading: true, error: "" }));

      const resp = await api.getAvailability({
        serviceId,
        stylistId,
        date,
        stepMin: 10, // o 20 si querés
      });

      if (resp?.ok === false) throw new Error(resp?.error || "Sin disponibilidad");

      const rawSlots = resp?.data?.slots ?? resp?.slots ?? resp?.data ?? [];
      let slots = [];

      if (Array.isArray(rawSlots) && rawSlots.length) {
        // A) backend devuelve ["HH:mm", ...]
        if (typeof rawSlots[0] === "string" && /^\d{1,2}:\d{2}$/.test(rawSlots[0])) {
          slots = rawSlots.map((hhmm) => {
            // 👉 guardamos en estado formateo local MySQL (sin Z) para enviar al back tal cual
            return `${date} ${hhmm.length === 5 ? hhmm : hhmm.padStart(5, "0")}:00`;
          });
        } else {
          // B) ya vienen ISO/epoch/objetos — los normalizamos a local MySQL
          const toMySQL = (val) => {
            if (typeof val === "string") {
              // si es ISO tipo "...Z" o con T, convertirlo a local MySQL
              return toLocalMySQL(val.replace("Z", ""));
            }
            if (typeof val === "number" || val instanceof Date) return toLocalMySQL(val);
            if (val && typeof val === "object") {
              const candidate = val.startsAt || val.start || val.iso || val.starts_at || val.start_at || val.time;
              return toLocalMySQL(candidate);
            }
            return "";
          };
          slots = rawSlots.map(toMySQL).filter(Boolean);
        }
      }

      setAvailability({
        slots,
        loading: false,
        error: slots.length ? "" : "No hay horarios para esa combinación.",
      });
    } catch (e) {
      console.error("[AVAIL][error]", e);
      setAvailability({ slots: [], loading: false, error: String(e.message || e) });
    }
  }, [booking]);

  // --- Crear turno ---
  const [bookingSave, setBookingSave] = useState({ saving: false, ok: false, error: "" });

  const createAppointment = useCallback(async () => {
    const { customerPhone, selectedSlot, serviceId, stylistId, customerName } = booking;
    if (!customerPhone || !selectedSlot || !serviceId || !stylistId) return;

    try {
      setBookingSave({ saving: true, ok: false, error: "" });

      // duración del servicio (fallback para que el back calcule ends_at)
      const srv = (services || []).find((s) => String(s.id) === String(serviceId));
      const durationMin = srv?.duration_min ?? srv?.durationMin ?? undefined;

      // normalizamos SIEMPRE a "YYYY-MM-DD HH:MM:SS" local
      const startsAt = toLocalMySQL(selectedSlot);

      const payload = {
        customerPhone: customerPhone.trim(),
        customerName: (customerName || "").trim() || undefined,
        stylistId: Number(stylistId),
        serviceId: Number(serviceId),
        startsAt,            // <- local sin Z
        durationMin,         // <- fallback para cálculo del fin
        status: "scheduled",
      };

      const res = await api.createAppointment(payload);
      setBookingSave({ saving: false, ok: Boolean(res?.ok), error: "" });
      await loadEvents();
    } catch (e) {
      setBookingSave({ saving: false, ok: false, error: String(e.message || e) });
    }
  }, [booking, services]);

  // --- Cargar eventos ---
  const loadEvents = useCallback(async () => {
    const { fromIso, toIso } = range;
    if (!fromIso || !toIso) return;
    try {
      setEventsLoading(true);
      setEventsError("");
      const data = await api.getAppointmentsBetween(fromIso, toIso);
      const evs = (data?.appointments ?? data ?? []).map((a) => ({
        id: String(a.id),
        title: `${a.customer_name ?? "Cliente"} • ${a.service_name ?? "Servicio"}`,
        start: a.starts_at, // backend ya devuelve "YYYY-MM-DDTHH:MM:SS" (local)
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

  // --- Editar turno ---
  const updateAppointment = useCallback(
    async (id, patch) => {
      try {
        // si viene startsAt tipo ISO, lo normalizamos
        const body = {
          ...patch,
          startsAt: patch.startsAt ? toLocalMySQL(patch.startsAt) : undefined,
          endsAt: patch.endsAt ? toLocalMySQL(patch.endsAt) : undefined,
        };
        await api.updateAppointment(id, body);
        await loadEvents();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e.message || e) };
      }
    },
    [loadEvents]
  );

  // --- Eliminar turno ---
  const deleteAppointment = useCallback(
    async (id) => {
      try {
        await api.deleteAppointment(id);
        await loadEvents();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: String(e.message || e) };
      }
    },
    [loadEvents]
  );

  // Polling para reflejar reservas externas
  useEffect(() => {
    loadEvents();
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(loadEvents, pollMs);
    return () => timer.current && clearInterval(timer.current);
  }, [loadEvents, pollMs]);

  const value = useMemo(
    () => ({
      // meta
      services,
      stylists,
      metaLoading,
      metaError,
      // booking + availability
      booking,
      updateBooking,
      availability,
      loadAvailability,
      bookingSave,
      createAppointment,
      // calendar
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
      updateAppointment,
      deleteAppointment,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
