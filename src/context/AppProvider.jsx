import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { api } from "../api/client"; // <-- axios helpers

export const AppContext = createContext(null);

export function AppProvider({ children, pollMs = 15000 }) {
    // --- Meta ---
    const [services, setServices] = useState([]);
    const [stylists, setStylists] = useState([]);
    const [metaLoading, setMetaLoading] = useState(true);
    const [metaError, setMetaError] = useState("");

    // --- Availability (por combinación actual) ---
    const [availability, setAvailability] = useState({
        slots: [],
        loading: false,
        error: "",
    });

    // --- Booking form (controlado global para simplicidad del MVP) ---
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

    // --- Cargar meta ---
    useEffect(() => {
        (async () => {
            try {
                setMetaLoading(true);
                const [srv, sty] = await Promise.all([
                    api.getServices(),
                    api.getStylists(),
                ]);
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

    const loadAvailability = useCallback(async () => {
        // --- helper: convierte distintos formatos a ISO string ---
        function toIso(val) {
            if (!val) return null;
            if (typeof val === "number") {
                const ms = val > 1e12 ? val : val * 1000; // epoch s/ms
                return new Date(ms).toISOString();
            }
            if (val instanceof Date) return val.toISOString();
            if (typeof val === "string") {
                let s = val.trim();
                // "YYYY-MM-DD HH:mm(:ss)" -> "YYYY-MM-DDTHH:mm(:ss)"
                if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(s)) s = s.replace(" ", "T");
                const d = new Date(s);
                return Number.isNaN(d.getTime()) ? null : d.toISOString();
            }
            if (typeof val === "object") {
                const candidate = val.startsAt || val.start || val.iso || val.starts_at || val.start_at || val.time;
                return toIso(candidate);
            }
            return null;
        }

        const { serviceId, stylistId, date } = booking; // date = "YYYY-MM-DD"
        if (!serviceId || !stylistId || !date) return;

        try {
            setAvailability((s) => ({ ...s, loading: true, error: "" }));

            // pedimos disponibilidad (manda ambos nombres de params por compatibilidad)
            const resp = await api.getAvailability({
                serviceId,
                stylistId,
                date,
                stepMin: 10,
            });

            console.log("[AVAIL][request]", { serviceId, stylistId, date, stepMin: 10 });
            console.log("[AVAIL][response]", resp);

            if (resp?.ok === false) throw new Error(resp?.error || "Sin disponibilidad");

            // extraemos posibles ubicaciones de slots
            const rawSlots =
                resp?.data?.slots ??
                resp?.slots ??
                resp?.data ??
                [];

            let slots = [];
            if (Array.isArray(rawSlots) && rawSlots.length) {
                // Caso A: backend devuelve ["HH:mm", ...]
                if (typeof rawSlots[0] === "string" && /^\d{1,2}:\d{2}$/.test(rawSlots[0])) {
                    slots = rawSlots
                        .map((hhmm) => toIso(`${date}T${hhmm}:00`)) // usa la fecha elegida
                        .filter(Boolean);
                } else {
                    // Caso B: ya vienen ISO/epoch/objetos con starts_at
                    slots = rawSlots.map(toIso).filter(Boolean);
                }
            }

            console.log("[AVAIL][rawCount->isoCount]", Array.isArray(rawSlots) ? rawSlots.length : 0, "->", slots.length);

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
    const [bookingSave, setBookingSave] = useState({
        saving: false,
        ok: false,
        error: "",
    });

    const createAppointment = useCallback(async () => {
        const { customerPhone, selectedSlot, serviceId, stylistId, customerName } =
            booking;
        if (!customerPhone || !selectedSlot || !serviceId || !stylistId) return;
        try {
            setBookingSave({ saving: true, ok: false, error: "" });
            const payload = {
                customerPhone: customerPhone.trim(),
                customerName: customerName.trim() || undefined,
                stylistId: Number(stylistId),
                serviceId: Number(serviceId),
                startsAt: selectedSlot,
            };
            // axios
            const res = await api.createAppointment(payload);
            setBookingSave({ saving: false, ok: Boolean(res?.ok), error: "" });
            // refrescamos calendario
            await loadEvents();
        } catch (e) {
            setBookingSave({
                saving: false,
                ok: false,
                error: String(e.message || e),
            });
        }
    }, [booking]);

    // --- Cargar eventos (turnos) ---
    const loadEvents = useCallback(async () => {
        const { fromIso, toIso } = range;
        if (!fromIso || !toIso) return;
        try {
            setEventsLoading(true);
            setEventsError("");
            // axios
            const data = await api.getAppointmentsBetween(fromIso, toIso);
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

    // Polling para reflejar reservas que vienen por WhatsApp
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
        ]
    );

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
