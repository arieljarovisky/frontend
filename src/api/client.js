// src/api/client.js
import axios from "axios";

// ─────────────────────────────────────────────────────────────
// Base URL
// Usa VITE_API_BASE_URL si está presente (ngrok/prod).
// Si no, asume dev con proxy de Vite y deja baseURL = "" (mismo origen).
// ─────────────────────────────────────────────────────────────
const RAW_BASE =
  (import.meta?.env?.VITE_API_BASE_URL || import.meta?.env?.VITE_API_BASE || "").trim();
const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, "") : "";

// Cliente axios
export const apiClient = axios.create({
  baseURL: API_BASE,         // "" si usás proxy de Vite
  timeout: 15000,
  withCredentials: false,
});

// Interceptor de errores → arroja Error con mensaje utilizable
apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg =
      typeof data === "string"
        ? data
        : data?.error || data?.message || err.message || "Error de red";
    console.error("[API ERROR]", status || "?", data || msg);
    throw new Error(msg);
  }
);

// Normaliza array vs {ok:true,data:[...]}
const asArray = (data) => (Array.isArray(data) ? data : data?.data ?? data ?? []);

// Asegura que fechas tengan segundos y no terminen en 'Z' si ya vienen locales
const ensureMySQLish = (s) => {
  if (!s) return s;
  let v = String(s).trim().replace("T", " ");
  if (v.endsWith("Z")) v = v.slice(0, -1);
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(v)) v += ":00";
  return v.slice(0, 19);
};

// API pública
export const api = {
  // Meta
  getServices: async () => {
    const { data } = await apiClient.get("/api/services");
    return asArray(data);
  },

  getStylists: async () => {
    const { data } = await apiClient.get("/api/stylists");
    return asArray(data);
  },

  // Disponibilidad (step=20 por defecto)
  getAvailability: async ({ serviceId, stylistId, date, stepMin = 20 }) => {
    const sid = Number(serviceId);
    const tid = Number(stylistId);
    const step = String(stepMin);
    const params = {
      serviceId: sid, stylistId: tid, date, stepMin: step,
      // compat snake
      service_id: sid, stylist_id: tid, step_min: step,
    };
    const { data } = await apiClient.get("/api/availability", { params });
    return data;
  },

  // Calendario (permite filtrar por estilista)
  getAppointmentsBetween: async (fromIso, toIso, stylistId) => {
    const params = {
      from: fromIso, // el backend ya normaliza ISO → MySQL
      to: toIso,
    };
    if (stylistId) params.stylistId = stylistId;
    const { data } = await apiClient.get("/api/appointments", { params });
    return data;
  },

  // Crear turno
  createAppointment: async (payload) => {
    // Si ya calculaste endsAt en el front, lo respetamos.
    // Si no, pasamos durationMin para que el back lo calcule.
    const body = {
      customerPhone: payload.customerPhone,
      customerName: payload.customerName,
      stylistId: Number(payload.stylistId),
      serviceId: Number(payload.serviceId),
      startsAt: ensureMySQLish(payload.startsAt),
      endsAt: ensureMySQLish(payload.endsAt) || undefined,
      durationMin: payload.durationMin ?? undefined,
      status: payload.status || "scheduled",
      // snake compat
      phone_e164: payload.customerPhone,
      customer_name: payload.customerName,
      stylist_id: Number(payload.stylistId),
      service_id: Number(payload.serviceId),
      starts_at: ensureMySQLish(payload.startsAt),
      ends_at: ensureMySQLish(payload.endsAt) || undefined,
      duration_min: payload.durationMin ?? undefined,
    };
    const { data } = await apiClient.post("/api/appointments", body);
    return data; // { ok: true, id }
  },

  // Editar turno
  updateAppointment: async (id, payload) => {
    const body = {
      id,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      serviceId: Number(payload.serviceId),
      stylistId: Number(payload.stylistId),
      startsAt: ensureMySQLish(payload.startsAt),
      endsAt: ensureMySQLish(payload.endsAt) || undefined,
      durationMin: payload.durationMin ?? undefined, // permite al back recalcular fin
      status: payload.status,
      // snake compat
      customer_name: payload.customerName,
      phone_e164: payload.customerPhone,
      service_id: Number(payload.serviceId),
      stylist_id: Number(payload.stylistId),
      starts_at: ensureMySQLish(payload.startsAt),
      ends_at: ensureMySQLish(payload.endsAt) || undefined,
      duration_min: payload.durationMin ?? undefined,
    };
    const { data } = await apiClient.put(`/api/appointments/${id}`, body);
    return data; // { ok: true }
  },

  // Eliminar turno
  deleteAppointment: async (id) => {
    const { data } = await apiClient.delete(`/api/appointments/${id}`);
    return data; // { ok: true }
  },
};
