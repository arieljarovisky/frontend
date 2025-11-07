// src/api/client.js
import axios from "axios";
const apiBase = import.meta.env.VITE_API_URL || "http://localhost:4000";
const apiClient = axios.create({
  baseURL: apiBase,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
  withCredentials: true, // ✅ Para cookies HttpOnly
});

let isNgrok = false;
try {
  const host = new URL(apiBase).host;
  isNgrok = /ngrok-free\.dev$/i.test(host);
} catch { /* ignore */ }


function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x?.data && Array.isArray(x.data)) return x.data;
  if (x?.hours && Array.isArray(x.hours)) return x.hours;
  if (x?.items && Array.isArray(x.items)) return x.items;
  return [];
}

/* =========================
   HELPERS DE STORAGE
========================= */

function setAccessToken(token) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

function getAccessToken() {
  return localStorage.getItem("token");
}

function setAuthEmail(email) {
  if (email) {
    localStorage.setItem("authEmail", email);
  } else {
    localStorage.removeItem("authEmail");
  }
}

function getAuthEmail() {
  return localStorage.getItem("authEmail");
}

function setTenantId(tenantId) {
  if (tenantId) {
    localStorage.setItem("tenantId", String(tenantId));
  } else {
    localStorage.removeItem("tenantId");
  }
}

function getTenantId() {
  const id = localStorage.getItem("tenantId");
  return id ? Number(id) : null;
}

// ✅ NUEVO: Guardar info completa del usuario
function setUserData(user) {
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    if (user.tenantId) {
      setTenantId(user.tenantId);
    }
  } else {
    localStorage.removeItem("user");
  }
}

function getUserData() {
  const data = localStorage.getItem("user");
  return data ? JSON.parse(data) : null;
}

/* =========================
   INTERCEPTORS
========================= */

// Request interceptor - agregar token automáticamente
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Solo agregar para ngrok; en localhost NO
    if (isNgrok) {
      config.headers["ngrok-skip-browser-warning"] = "true";
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ================================
// Interceptor de respuesta - Auth
// ================================
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // No intentar refresh en endpoints de auth
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/tenant") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    // Si es 401 y aún no intentamos refresh
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        const refreshed = await authApi.refresh();
        if (refreshed) {
          // Reintentar la request original con el nuevo token
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh falló: limpiar sesión y redirigir al login
        setAccessToken(null);
        setAuthEmail(null);
        setTenantId(null);
        setUserData(null);

        // Redirigir con ?next a la ruta actual
        const next = encodeURIComponent(
          window.location.pathname + window.location.search
        );
        window.location.href = `/login?next=${next}`;

        return Promise.reject(refreshError);
      }
    }

    // Cualquier otro error
    return Promise.reject(error);
  }
);


/* =========================
   AUTH API
========================= */

const authApi = {
  /**
   * Login
   */
  async login(email, password) {
    const { data } = await apiClient.post("/auth/login", { email, password });

    if (data?.ok) {
      // Caso 1: Multi-tenant (necesita elegir tenant)
      if (data.multiTenant) {
        return data; // { ok, multiTenant, email, tenants }
      }

      // Caso 2: Single tenant (login exitoso)
      if (data.access) {
        setAccessToken(data.access);
        setAuthEmail(data?.user?.email || email);

        // ✅ Guardar tenantId y user data
        if (data.user) {
          setUserData(data.user);
        }
        if (data.tenant?.id) {
          setTenantId(data.tenant.id);
        }
      }
    }

    return data;
  },

  /**
   * Login con tenant específico
   */
  async loginTenant(email, password, slug) {
    const { data } = await apiClient.post("/auth/login-tenant", {
      email,
      password,
      slug,
    });

    if (data?.ok && data?.access) {
      setAccessToken(data.access);
      setAuthEmail(data?.user?.email || email);

      // ✅ Guardar datos completos
      if (data.user) {
        setUserData(data.user);
      }
      if (data.tenant?.id) {
        setTenantId(data.tenant.id);
      }
    }

    return data;
  },

  /**
   * Logout
   */
  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch (e) {
      console.error("Error en logout:", e);
    }

    // Limpiar todo
    setAccessToken(null);
    setAuthEmail(null);
    setTenantId(null);
    setUserData(null);
  },

  /**
   * Refresh token
   */
  async refresh() {
    try {
      const { data } = await apiClient.post("/auth/refresh", {});

      if (data?.ok && data?.access) {
        setAccessToken(data.access);

        // ✅ Actualizar datos de usuario
        if (data.user) {
          setUserData(data.user);
        }
        if (data.tenant?.id) {
          setTenantId(data.tenant.id);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error("Error en refresh:", error);
      return false;
    }
  },

  /**
   * Get current user
   */
  async me() {
    try {
      const { data } = await apiClient.get("/auth/me");

      // ✅ Actualizar datos si vienen
      if (data?.ok && data?.user) {
        setUserData(data.user);

        if (data.user.tenantId && !getTenantId()) {
          setTenantId(data.user.tenantId);
        }
      }

      return data;
    } catch (error) {
      console.error("Error en me:", error);
      throw error;
    }
  },

  /**
   * Verificar si está autenticado
   */
  isAuthenticated() {
    return !!getAccessToken();
  },

  /**
   * Obtener token actual
   */
  getToken() {
    return getAccessToken();
  },

  /**
   * Obtener tenant ID actual
   */
  getTenantId() {
    return getTenantId();
  },

  /**
   * Obtener datos de usuario
   */
  getUser() {
    return getUserData();
  },
};

/* =========================
   CONFIG API
========================= */

apiClient.getConfig = async function () {
  try {
    const { data } = await apiClient.get("/api/config");
    return data;
  } catch (error) {
    console.error("Error obteniendo config:", error);
    return {};
  }
};

apiClient.updateConfig = async function (config) {
  const { data } = await apiClient.put("/api/config", config);
  return data;
};

/* =========================
   SERVICES API
========================= */

apiClient.listServices = async function ({ active = true } = {}) {
  const params = active ? { active: 1 } : {};
  const { data } = await apiClient.get("/api/meta/services", { params });
  return data?.data || [];
};

/* =========================
   STYLISTS API
========================= */

apiClient.listStylists = async function ({ active = true } = {}) {
  const params = active ? { active: 1 } : {};
  const { data } = await apiClient.get("/api/meta/stylists", { params });
  return data?.data || [];
};

/* =========================
   AVAILABILITY API
========================= */

apiClient.getAvailability = async function ({ stylistId, serviceId, date }) {
  const { data } = await apiClient.get("/api/availability", {
    params: { stylistId, serviceId, date },
  });
  return data;
};

/* =========================
   APPOINTMENTS API
========================= */

apiClient.createAppointment = async function (appointmentData) {
  const { data } = await apiClient.post("/api/appointments", appointmentData);
  return data;
};

apiClient.updateAppointment = async function (id, updates) {
  const { data } = await apiClient.patch(`/api/appointments/${id}`, updates);
  return data;
};

apiClient.listAppointments = async function ({ from, to, stylistId } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (stylistId) params.stylistId = stylistId;
  const { data } = await apiClient.get("/api/appointments", { params });
  return data;
};

/* =========================
   PAYMENTS API
========================= */

apiClient.createPaymentPreference = async function (appointmentId) {
  const { data } = await apiClient.post("/api/payments/preference", {
    appointmentId,
  });
  return data;
};

apiClient.createManualPayment = async function (paymentData) {
  const { data } = await apiClient.post("/api/payments/manual", paymentData);
  return data;
};

apiClient.checkPaymentStatus = async function (appointmentId) {
  const { data } = await apiClient.get(`/api/payments/status/${appointmentId}`);
  return data;
};

apiClient.listPayments = async function (params = {}) {
  const { data } = await apiClient.get("/api/payments", { params });
  return data;
};

apiClient.getPaymentStats = async function ({ from, to } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get("/api/payments/stats", { params });
  return data?.stats || {};
};

/* =========================
   MERCADO PAGO OAUTH API
========================= */

apiClient.getMPAuthUrl = async (opts = {}) => {
  const { data } = await apiClient.get("/mp/oauth/connect", {
    params: { fresh: opts.fresh ? 1 : undefined },
  });
  return data;
};
apiClient.getMPStatus = async function () {
  const { data } = await apiClient.get("/mp/oauth/status");
  return data;
};

apiClient.disconnectMP = async function () {
  const { data } = await apiClient.post("/mp/oauth/disconnect");
  return data;
};

/* =========================
   CUSTOMERS API
========================= */

apiClient.listCustomers = async function (q = "", signal) {
  const { data } = await apiClient.get("/api/meta/customers", {
    params: { q },
    signal,
  });
  return data?.data || [];
};

apiClient.customerDetail = async function (customerId, signal) {
  if (!customerId) throw new Error("customerId es requerido");
  const { data } = await apiClient.get(`/api/customers/${customerId}`, { signal });
  return data?.data || data || null;
};

apiClient.updateCustomer = async function (customerId, payload) {
  if (!customerId) throw new Error("customerId es requerido");
  const { data } = await apiClient.put(`/api/customers/${customerId}`, payload);
  return data?.data || data || null;
};

/* =========================
   CALENDAR API
========================= */

apiClient.getCalendarDay = async function ({ date, stylistId } = {}) {
  const params = { date };
  if (stylistId) params.stylistId = stylistId;
  const { data } = await apiClient.get("/api/calendar/day", { params });
  return data;
};

apiClient.getCalendarRange = async function ({ from, to, stylistId } = {}) {
  const params = { from, to };
  if (stylistId) params.stylistId = stylistId;
  const { data } = await apiClient.get("/api/calendar/range", { params });
  return data;
};
apiClient.getUnreadCount = async function () {
  try {
    const { data } = await apiClient.get("/api/notifications/count");
    if (typeof data === "number") return { count: data };
    return { count: Number(data?.count || 0) };
  } catch (error) {
    console.error("Error obteniendo unread count:", error);
    return { count: 0 };
  }
};

apiClient.getCommissions = async function (params = {}) {
  try {
    const { data } = await apiClient.get("/api/commissions", { params });
    // si tu endpoint devuelve { ok, data: [...] }
    if (Array.isArray(data?.data)) return data.data;
    return data;
  } catch (error) {
    console.error("❌ [getCommissions] Error:", error);
    return [];
  }
};
apiClient.updateCommission = async function (stylistId, percentage) {
  try {
    const { data } = await apiClient.put(`/api/commissions/${stylistId}`, {
      percentage: Number(percentage),
    });
    return data;
  } catch (error) {
    console.error("❌ [updateCommission] Error:", error);
    throw error;
  }
};
/* =========================
   STYLIST STATS API
========================= */
apiClient.getStylistStatsRange = async function ({ from, to, stylistId }) {
  if (!stylistId) throw new Error("stylistId es requerido");
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await apiClient.get(`/api/stats/${encodeURIComponent(stylistId)}`, { params });
  return data ?? {};
};
/* =========================
   WORKING HOURS API
========================= */
// Muchos routers de hours requieren stylistId. Envíalo siempre si lo tenés.
apiClient.getWorkingHours = async function ({ stylistId } = {}) {
  const params = {};
  if (stylistId) params.stylistId = stylistId;
  const { data } = await apiClient.get("/api/working-hours", { params });
  return toArray(data); // <-- siempre array
};

apiClient.saveWorkingHours = async function ({ stylistId, hours }) {
  const { data } = await apiClient.put("/api/working-hours", { stylistId, hours });
  return data;
};

/* =========================
   DAYS OFF / BLOQUEOS API
========================= */
apiClient.listDaysOff = async function ({ from, to, stylistId } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (stylistId) params.stylistId = stylistId;
  const { data } = await apiClient.get("/api/days-off", { params });
  return toArray(data); // <-- siempre array
};

/* =========================
   DAYS OFF / BLOQUEOS API
========================= */
apiClient.listDaysOff = async function ({ from, to, stylistId } = {}) {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  if (stylistId) params.stylistId = stylistId;
  const { data } = await apiClient.get("/api/days-off", { params });
  return data?.data ?? data ?? [];
};
apiClient.createDayOff = async function (payload) {
  const { data } = await apiClient.post("/api/days-off", payload);
  return data;
};
apiClient.deleteDayOff = async function (id) {
  const { data } = await apiClient.delete(`/api/days-off/${id}`);
  return data;
};
/* =========================
   CONFIG API (match backend)
========================= */

// Lee una sección
apiClient.getConfigSection = async function (section) {
  if (!section) throw new Error("section es requerido");
  if (section === "general") {
    const { data } = await apiClient.get("/api/config"); // <-- GET sin sección
    return data?.data ?? data ?? {};
  } else if (section === "deposit") {
    const { data } = await apiClient.get("/api/config/deposit");
    return data?.data ?? data ?? {};
  } else {
    const { data } = await apiClient.get(`/api/config/${encodeURIComponent(section)}`);
    return data?.data ?? data ?? {};
  }
};

// Guarda una sección
apiClient.saveConfigSection = async function (section, payload) {
  if (!section) throw new Error("section es requerido");
  if (section === "general") {
    const { data } = await apiClient.put("/api/config/general", payload);
    return data?.data ?? data ?? {};
  } else if (section === "deposit") {
    const { data } = await apiClient.put("/api/config/deposit", payload);
    return data?.data ?? data ?? {};
  } else {
    const { data } = await apiClient.put(`/api/config/${encodeURIComponent(section)}`, payload);
    return data?.data ?? data ?? {};
  }
};

// Lee todo (equivalente a la sección general)
apiClient.getAllConfig = async function () {
  const { data } = await apiClient.get("/api/config");
  return data?.data ?? data ?? {};
};

// Bulk update: body con claves completas "section.key"
apiClient.saveConfigBulk = async function (updates) {
  const { data } = await apiClient.put("/api/config", updates);
  return data?.data ?? data ?? {};
};

/* =========================
   ARCA / FACTURACIÓN API
========================= */
apiClient.verifyArcaConnection = async function () {
  const { data } = await apiClient.get("/api/invoicing/arca/verify");
  return data;
};

apiClient.testArcaInvoice = async function () {
  const { data } = await apiClient.post("/api/invoicing/arca/test");
  return data;
};

/* =========================
   EXPORT
========================= */

export {
  // Storage helpers
  setAccessToken,
  getAccessToken,
  setAuthEmail,
  getAuthEmail,
  setTenantId,
  getTenantId,
  setUserData,
  getUserData,

  // Auth API
  authApi,

  // Main client
  apiClient,
};

export default apiClient;