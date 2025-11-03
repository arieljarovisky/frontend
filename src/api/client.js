// src/api/client.js
import axios from "axios";

/** Base URL (usa VITE_API_BASE_URL si hace falta apuntar a ngrok) */
const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE = RAW_BASE.replace(/\/$/, "");

/** Claves de localStorage */
const LS_ACCESS = "auth:accessToken";
const LS_EMAIL = "auth:email";
const LS_TENANT = "auth:tenantId"; // ✅ NUEVO: almacenar tenant ID

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

// ✅ NUEVO: Manejo del Tenant ID
export function setTenantId(tenantId) {
  if (tenantId) localStorage.setItem(LS_TENANT, tenantId);
  else localStorage.removeItem(LS_TENANT);
}
export function getTenantId() {
  return localStorage.getItem(LS_TENANT) || "";
}

/** Cliente axios */
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  withCredentials: true, // manda cookies (refresh)
});

/** 
 * ✅ INTERCEPTOR MODIFICADO: Inyecta Authorization + X-Tenant-ID
 * 
 * ESTRATEGIAS MULTI-TENANT:
 * 
 * 1. HEADER (recomendado para API): X-Tenant-ID
 * 2. SUBDOMAIN: tenant.tuapp.com (requiere configuración DNS/routing)
 * 3. PATH: /api/tenant123/appointments (menos común)
 * 4. QUERY PARAM: ?tenantId=123 (menos seguro)
 */
apiClient.interceptors.request.use((cfg) => {
  // Inyectar token de autorización
  const token = getAccessToken();
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ Inyectar Tenant ID en header
  const tenantId = getTenantId();
  if (tenantId) {
    cfg.headers['X-Tenant-ID'] = tenantId;
  }

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
        setTenantId(null); // ✅ Limpiar también el tenant
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
  /**
   * ✅ Login modificado para guardar tenantId
   * El backend debe devolver el tenantId en la respuesta
   */
 async login(email, password) {
    const { data } = await apiClient.post("/auth/login", { email, password });
    // ✅ Si tiene access token, guardarlo
    if (data?.ok && data?.access) {
      setAccessToken(data.access);
      setAuthEmail(data?.user?.email || email);
    }
    return data;
  },
   async loginTenant(email, password, slug) {
    const { data } = await apiClient.post("/auth/login-tenant", { 
      email, 
      password, 
      slug 
    });
    if (data?.ok && data?.access) {
      setAccessToken(data.access);
      setAuthEmail(data?.user?.email || email);
    }
    return data;
  },
  
  async logout() {
    try { await apiClient.post("/auth/logout"); } catch { }
    setAccessToken(null);
    setAuthEmail(null);
  },
  
  async refresh() {
    const { data } = await apiClient.post("/auth/refresh", {});
    if (data?.ok && data?.access) {
      setAccessToken(data.access);
      return true;
    }
    return false;
  },
  
  async me() {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch { }
    setAccessToken(null);
    setAuthEmail(null);
    setTenantId(null); // ✅ Limpiar tenant al hacer logout
  },

  async refresh() {
    // Importante: este endpoint usa la cookie HttpOnly + withCredentials:true
    const { data } = await apiClient.post("/auth/refresh", {});
    if (data?.ok && data?.accessToken) {
      setAccessToken(data.accessToken);

      // ✅ Actualizar tenantId si viene en el refresh
      if (data?.tenantId) {
        setTenantId(data.tenantId);
      }
      return true;
    }
    return false;
  },

  async me() {
    const { data } = await apiClient.get("/auth/me");

    // ✅ Actualizar tenantId desde /me si no lo tenemos
    if (data?.ok && data?.user?.tenantId && !getTenantId()) {
      setTenantId(data.user.tenantId);
    }

    return data; // { ok, user }
  },
};

/* =========================
   API de dominio (turnos)
   =========================
   ✅ Rutas corregidas para coincidir con el backend.
*/
const PATH_SERVICES = "/api/meta/services";  // ✅ Corregido
const PATH_STYLISTS = "/api/meta/stylists";  // ✅ Corregido
const PATH_AVAIL = "/api/availability";
const PATH_APPTS = "/api/appointments";
const PATH_ADMIN = "/api/admin";


/* ---------------------------
   🔔 Refresh helpers (front)
--------------------------- */

// emite evento en la pestaña actual
function emitAppointmentsChanged(detail) {
  try {
    window.dispatchEvent(new CustomEvent("appointments:changed", { detail }));
  } catch { }
}

// sincroniza entre pestañas (BroadcastChannel si existe; si no, storage)
let _bc = null;
try {
  if ("BroadcastChannel" in window) {
    _bc = new BroadcastChannel("appointments");
    _bc.addEventListener("message", (ev) => {
      if (ev?.data === "changed") emitAppointmentsChanged({ source: "bc" });
    });
  } else {
    window.addEventListener("storage", (e) => {
      if (e.key === "appointments:pulse") {
        emitAppointmentsChanged({ source: "storage" });
      }
    });
  }
} catch { }
function fanout() {
  try {
    if (_bc) _bc.postMessage("changed");
    else localStorage.setItem("appointments:pulse", String(Date.now()));
  } catch { }
}




// Lista de servicios
apiClient.getServices = async function () {
  const { data } = await apiClient.get(PATH_SERVICES);
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
};

// Lista de estilistas
apiClient.getStylists = async function () {
  const { data } = await apiClient.get(PATH_STYLISTS);
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
};

// Disponibilidad (GET con query params)
apiClient.getAvailability = async function ({ serviceId, stylistId, date, stepMin }) {
  const { data } = await apiClient.get(PATH_AVAIL, {
    params: { serviceId, stylistId, date, stepMin },
  });
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
  fanout();
  emitAppointmentsChanged({ action: "create" });
  return data;
};

// Actualizar turno
apiClient.updateAppointment = async function (id, patch) {
  const { data } = await apiClient.patch(`${PATH_APPTS}/${id}`, patch);
  fanout();
  emitAppointmentsChanged({ action: "update", id });
  return data;
};

// Eliminar turno
apiClient.deleteAppointment = async function (id) {
  const { data } = await apiClient.delete(`${PATH_APPTS}/${id}`);
  fanout();
  emitAppointmentsChanged({ action: "delete", id });
  return data;
};

// Confirmar turno
apiClient.confirmAppointment = async function (id) {
  const { data } = await apiClient.post(`${PATH_APPTS}/${id}/confirm`);
  fanout();
  emitAppointmentsChanged({ action: "confirm", id });
  return data;
};

// Cancelar turno
apiClient.cancelAppointment = async function (id, reason) {
  const { data } = await apiClient.post(`${PATH_APPTS}/${id}/cancel`, { reason });
  fanout();
  emitAppointmentsChanged({ action: "cancel", id });
  return data;
};

// (Opcional) Búsqueda de clientes para Admin
apiClient.searchAdminCustomers = async function (q = "") {
  const { data } = await apiClient.get(`${PATH_ADMIN}/customers`, { params: q ? { q } : {} });
  return data;
};

// ===== Customers =====
const PATH_CUSTOMERS = "/api/customers";
const PATH_CUSTOMERS_ADMIN = "/api/admin/customers";

// Búsqueda admin (requiere rol admin/staff)
apiClient.customers = async function (q = "", signal) {
  const params = q ? { q } : {};
  const config = signal ? { params, signal } : { params };
  const { data } = await apiClient.get(PATH_CUSTOMERS_ADMIN, config);
  return Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
};

// Detalle de cliente
apiClient.customerDetail = async function (id, signal) {
  const config = signal ? { signal } : {};
  const { data } = await apiClient.get(`${PATH_CUSTOMERS_ADMIN}/${id}`, config);
  return data?.data ?? data;
};

// Crear cliente
apiClient.createCustomer = async function (payload) {
  const { data } = await apiClient.post(PATH_CUSTOMERS, payload);
  return data;
};

// Actualizar cliente
apiClient.updateCustomer = async function (id, patch) {
  const { data } = await apiClient.patch(`${PATH_CUSTOMERS}/${id}`, patch);
  return data;
};

// Eliminar cliente
apiClient.deleteCustomer = async function (id) {
  const { data } = await apiClient.delete(`${PATH_CUSTOMERS}/${id}`);
  return data;
};

/* =========================
   CONFIGURACIÓN DE SEÑAS
   ========================= */
apiClient.getDepositConfig = async function () {
  const { data } = await apiClient.get("/api/config/deposit");
  return data;
};

apiClient.updateDepositConfig = async function (payload) {
  const { data } = await apiClient.put("/api/config/deposit", payload);
  return data;
};

/* =========================
   COMISIONES DE PELUQUEROS
   ========================= */
apiClient.getCommissions = async function () {
  const { data } = await apiClient.get("/api/commissions");
  return Array.isArray(data) ? data : data?.data || [];
};

apiClient.updateCommission = async function (stylistId, percentage) {
  const { data } = await apiClient.put(`/api/commissions/${stylistId}`, {
    percentage,
  });
  return data;
};

/* =========================
   ESTADÍSTICAS POR PELUQUERO
   ========================= */
apiClient.getStylistStats = async function (stylistId) {
  const { data } = await apiClient.get(`/api/stats/${stylistId}`);
  return data;
};

apiClient.getStylistStatsRange = async function (stylistId, { from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get(`/api/stats/${stylistId}`, { params });
  return data;
};

apiClient.getStylistTurns = async function (stylistId, { from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get(`/api/stats/${stylistId}/turnos`, { params });
  return Array.isArray(data) ? data : data?.data || [];
};

/* =========================
   WORKING HOURS / FRANCOS
   ========================= */

apiClient.getWorkingHours = async function (stylistId) {
  const { data } = await apiClient.get("/api/working-hours", { params: { stylistId } });
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

apiClient.setWorkingHour = async function ({ stylistId, weekday, is_open, start_time, end_time }) {
  const { data } = await apiClient.put("/api/working-hours", { stylistId, weekday, is_open, start_time, end_time });
  return data;
};

apiClient.setWorkingHoursBulk = async function ({ stylistId, week }) {
  const { data } = await apiClient.put("/api/working-hours/bulk", { stylistId, week });
  return data;
};

// === Días de franco (time_off) ===
apiClient.listDaysOff = async function ({ stylistId, from, to }) {
  const params = { stylistId };
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get("/api/days-off", { params });
  return data;
};

apiClient.addDayOff = async function ({ stylistId, starts_at, ends_at, reason }) {
  const { data } = await apiClient.post("/api/days-off", { stylistId, starts_at, ends_at, reason });
  return data;
};

apiClient.deleteDayOff = async function (id) {
  const { data } = await apiClient.delete(`/api/days-off/${id}`);
  return data;
};

apiClient.saveWorkingHours = async function (stylistId, hours) {
  const payload = {
    stylistId: Number(stylistId),
    hours: hours.map(h => ({
      weekday: Number(h.weekday),
      start_time: h.start_time ?? null,
      end_time: h.end_time ?? null,
    })),
  };
  const { data } = await apiClient.put("/api/working-hours", payload);
  return data;
};

/* =========================
   NOTIFICACIONES
   ========================= */

apiClient.getNotifications = async function ({ unreadOnly = false } = {}) {
  const params = unreadOnly ? { unreadOnly: 'true' } : {};
  const { data } = await apiClient.get('/api/notifications', { params });
  return Array.isArray(data?.data) ? data.data : [];
};

apiClient.getUnreadCount = async function () {
  const { data } = await apiClient.get('/api/notifications/count');
  return data?.count || 0;
};

apiClient.markNotificationRead = async function (id) {
  const { data } = await apiClient.put(`/api/notifications/${id}/read`);
  return data;
};

apiClient.markAllNotificationsRead = async function () {
  const { data } = await apiClient.put('/api/notifications/read-all');
  return data;
};

apiClient.deleteNotification = async function (id) {
  const { data } = await apiClient.delete(`/api/notifications/${id}`);
  return data;
};

apiClient.createTestNotification = async function (payload) {
  const { data } = await apiClient.post('/api/notifications/test', payload);
  return data;
};

/* =========================
   CONFIGURACIÓN
   ========================= */

apiClient.getConfig = async function () {
  const { data } = await apiClient.get('/api/config');
  return data?.data || {};
};

apiClient.updateConfig = async function (config) {
  const { data } = await apiClient.put('/api/config', config);
  return data;
};

apiClient.getConfigSection = async function (section) {
  const { data } = await apiClient.get(`/api/config/${section}`);
  return data?.data || {};
};

apiClient.updateConfigSection = async function (section, updates) {
  const { data } = await apiClient.put(`/api/config/${section}`, updates);
  return data;
};

apiClient.resetConfig = async function (section = null) {
  const { data } = await apiClient.post('/api/config/reset', { section });
  return data;
};

apiClient.saveConfigSection = async function (section, payload) {
  const r = await apiClient.put(`/api/config/${section}`, payload, { withCredentials: true });
  return r.data || { ok: false };
}

