// src/api/client.js
import axios from "axios";

/** Base URL (usa VITE_API_BASE_URL si hace falta apuntar a ngrok) */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE = RAW_BASE.replace(/\/$/, "");

/** Claves de localStorage */
const LS_ACCESS = "auth:accessToken";
const LS_EMAIL  = "auth:email";

/** Set/Get/Remove token */
export function setAccessToken(token) {
  if (token) localStorage.setItem(LS_ACCESS, token);
  else localStorage.removeItem(LS_ACCESS);
}
export function getAccessToken() {
  return localStorage.getItem(LS_ACCESS) || "";
}
export function setAuthEmail(email) {
  if (email) localStorage.setItem(LS_EMAIL, email);
  else localStorage.removeItem(LS_EMAIL);
}
export function getAuthEmail() {
  return localStorage.getItem(LS_EMAIL) || "";
}

/** Cliente axios */
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true, // manda cookies (refresh)
});

/** Inyecta Authorization si hay token */
apiClient.interceptors.request.use((cfg) => {
  const t = getAccessToken();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

/* =========================
   REFRESH LOCK + RETRY 401
   ========================= */
let isRefreshing = false;
let refreshPromise = null;
const requestQueue = [];

function enqueue(cb) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ cb, resolve, reject });
  });
}
function flushQueue(error, token) {
  while (requestQueue.length) {
    const { cb, resolve, reject } = requestQueue.shift();
    if (error) reject(error);
    else resolve(cb(token));
  }
}

/** Interceptor de respuesta con manejo 401 */
apiClient.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err?.config;
    const status = err?.response?.status;
    const data = err?.response?.data;
    const msg =
      typeof data === "string"
        ? data
        : data?.error || data?.message || err.message || "Error de red";

    // Si no es 401 o el request ya fue reintentado, propaga
    if (status !== 401 || original?._retry) {
      console.error("[API ERROR]", status || "?", data || msg);
      return Promise.reject(err);
    }

    // Marcamos que se va a reintentar (para evitar loops)
    original._retry = true;

    // Si ya hay un refresh en curso: encolamos y, al terminar, reintentamos
    if (isRefreshing) {
      try {
        return await enqueue((newToken) => {
          if (newToken) original.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(original);
        });
      } catch (e) {
        return Promise.reject(e);
      }
    }

    // Disparamos refresh único con lock
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const ok = await authApi.refresh();
        if (!ok) throw new Error("No se pudo refrescar sesión");
        const newToken = getAccessToken();
        flushQueue(null, newToken);
        return newToken;
      } catch (e) {
        // Si el refresh falla, limpiamos sesión y rechazamos toda la cola
        setAccessToken(null);
        setAuthEmail(null);
        flushQueue(e, null);
        throw e;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    try {
      const newToken = await refreshPromise;
      if (newToken) original.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(original);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);

/** ========================
 *  Auth de alto nivel
 * ======================== */
export const authApi = {
  async login(email, password) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    // Espera { ok, accessToken, user }
    if (data?.ok && data?.accessToken) {
      setAccessToken(data.accessToken);
      setAuthEmail(data?.user?.email || email);
    }
    return data;
  },
  async logout() {
    try { await apiClient.post("/auth/logout"); } catch {}
    setAccessToken(null);
    setAuthEmail(null);
  },
  async refresh() {
    // Importante: este endpoint usa la cookie HttpOnly + withCredentials:true
    const { data } = await apiClient.post("/auth/refresh", {});
    if (data?.ok && data?.accessToken) {
      setAccessToken(data.accessToken);
      return true;
    }
    return false;
  },
  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data; // { ok, user }
  },
};

/* =========================
   API de dominio (turnos)
   =========================
   Ajustá los PATH_* si tu backend usa otros endpoints.
*/
const PATH_SERVICES = "/api/meta/services";
const PATH_STYLISTS = "/api/meta/stylists";
const PATH_AVAIL    = "/api/availability";
const PATH_APPTS    = "/api/appointments";
const PATH_ADMIN = "/api/admin";

// Lista de servicios
apiClient.getServices = async function () {
  const { data } = await apiClient.get(PATH_SERVICES);
  return Array.isArray(data?.services) ? data.services : (data ?? []);
};

// Lista de estilistas
apiClient.getStylists = async function () {
  const { data } = await apiClient.get(PATH_STYLISTS);
  return Array.isArray(data?.stylists) ? data.stylists : (data ?? []);
};

// Disponibilidad (GET con query params)
apiClient.getAvailability = async function ({ serviceId, stylistId, date, stepMin }) {
  const { data } = await apiClient.get(PATH_AVAIL, {
    params: { serviceId, stylistId, date, stepMin },
  });
  // Normalizamos: { ok, data: { slots, busySlots } }
  if (data?.data) return data;
  return {
    ok: data?.ok ?? true,
    data: { slots: data?.slots ?? [], busySlots: data?.busySlots ?? [] },
  };
};

// Turnos entre fechas ISO (from/to)
apiClient.getAppointmentsBetween = async function (fromIso, toIso) {
  const { data } = await apiClient.get(PATH_APPTS, { params: { from: fromIso, to: toIso } });
  return Array.isArray(data?.appointments)
    ? data
    : { appointments: Array.isArray(data) ? data : [] };
};

// Crear turno
apiClient.createAppointment = async function (payload) {
  const { data } = await apiClient.post(PATH_APPTS, payload);
  return data; // esperás { ok, id, ... }
};

// Actualizar turno
apiClient.updateAppointment = async function (id, patch) {
  const { data } = await apiClient.patch(`${PATH_APPTS}/${id}`, patch);
  return data; // { ok: true }
};

// Borrar turno
apiClient.deleteAppointment = async function (id) {
  const { data } = await apiClient.delete(`${PATH_APPTS}/${id}`);
  return data; // { ok: true }
};

// KPIs “rápidos” para las cards
apiClient.getAdminMetrics = async function () {
  const { data } = await apiClient.get(`${PATH_ADMIN}/metrics`);
  return data; // { today_scheduled, today_cancelled, today_total, week_income }
};

// Dashboard completo (hoy/mañana, por estilista, depósitos, facturación, etc.)
apiClient.getAdminDashboard = async function ({ from, to } = {}) {
  const params = {};
  if (from && to) { params.from = from; params.to = to; } // YYYY-MM-DD
  const { data } = await apiClient.get(PATH_ADMIN, { params });
  return data; // { ok:true, data:{ ... } }
};

// Línea: ingresos por mes del año
apiClient.getIncomeByMonth = async function (year = new Date().getFullYear()) {
  const { data } = await apiClient.get(`${PATH_ADMIN}/charts/income-by-month`, { params: { year } });
  return data; // [{ month:"Ene", income:123 }, ...]
};

// Barras: servicios más pedidos
apiClient.getTopServices = async function ({ months = 3, limit = 6 } = {}) {
  const { data } = await apiClient.get(`${PATH_ADMIN}/charts/top-services`, { params: { months, limit } });
  return data; // [{ service_name, count }, ...]
};

// Agenda de HOY
apiClient.getAgendaToday = async function () {
  const { data } = await apiClient.get(`${PATH_ADMIN}/agenda/today`);
  return data; // [{ id, starts_at, status, customer_name, service_name, stylist_name }, ...]
};

// (Opcional) Búsqueda de clientes para Admin
apiClient.searchAdminCustomers = async function (q = "") {
  const { data } = await apiClient.get(`${PATH_ADMIN}/customers`, { params: q ? { q } : {} });
  return data;
};
