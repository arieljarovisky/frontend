// src/shared/api.js
import axios from "axios";

const asArray = (x) =>
  Array.isArray(x) ? x :
    Array.isArray(x?.data) ? x.data :
      Array.isArray(x?.rows) ? x.rows :
        Array.isArray(x?.appointments) ? x.appointments : [];

const asObject = (x) =>
  (x && typeof x === "object" && !Array.isArray(x))
    ? (x.data ?? x)
    : {};

// Cliente base
export const apiClient = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ========== Endpoints públicos ==========
export const getStylists = (signal) =>
  apiClient.get("/stylists", { signal }).then((r) => r.data);

export const getServices = (signal) =>
  apiClient.get("/services", { signal }).then((r) => r.data);

export const getAppointments = (params, signal) =>
  apiClient.get("/appointments", { params, signal }).then((r) => r.data);

export const createAppointment = (body, signal) =>
  apiClient.post("/appointments", body, { signal }).then((r) => r.data);

// Disponibilidad (cancelable)
export const getAvailability = (stylistId, serviceId, date, signal) =>
  apiClient
    .get("/availability", { params: { stylistId, serviceId, date }, signal })
    .then((r) => r.data);

// ========== Endpoints ADMIN (Dashboard / Clientes) ==========
export const adminApi = {
  /**
   * Dashboard principal (KPIs, recaudación, etc.)
   * -> GET /api/admin
   * @param {{from?: string, to?: string}} params
   */
  dashboard: (params = {}, signal) =>
    apiClient
      .get("/admin", { params, signal })
      .then((r) => asObject(r.data)),

  /**
   * Chart: Ingresos por mes
   * -> GET /api/admin/charts/income-by-month?year=YYYY
   */
  chartIncomeByMonth: (year, signal) =>
    apiClient
      .get("/admin/charts/income-by-month", { params: { year }, signal })
      .then((r) => r.data ?? []),

  /**
   * Chart: Servicios más vendidos
   * -> GET /api/admin/charts/top-services?limit&months
   */
  chartTopServices: (limit = 6, months = 3, signal) =>
    apiClient
      .get("/admin/charts/top-services", { params: { limit, months }, signal })
      .then((r) => r.data ?? []),

  /**
   * Agenda del día (turnos hoy)
   * -> GET /api/admin/agenda/today
   */
  todayAgenda: (signal) =>
    apiClient.get("/admin/agenda/today", { signal }).then((r) => r.data ?? []),

  /**
   * Buscar clientes
   * -> GET /api/admin/customers?q=
   */
  customers: (q, signal) =>
    apiClient
      .get("/admin/customers", { params: { q }, signal })
      .then((r) => {
        if (Array.isArray(r.data)) return r.data;
        if (Array.isArray(r.data?.customers)) return r.data.customers;
        if (Array.isArray(r.data?.data)) return r.data.data;
        return [];
      }),

  /**
   * Detalle de cliente
   * -> GET /api/admin/customers/:id
   */
  customerDetail: (id, signal) =>
    apiClient.get(`/admin/customers/${id}`, { signal }).then((r) => asObject(r.data)),

  /**
   * Turnos de un cliente
   * -> GET /api/admin/customers/:id/appointments
   */
  customerAppointments: (id, params = {}, signal) =>
    apiClient
      .get(`/admin/customers/${id}/appointments`, { params, signal })
      .then((r) => asArray(r.data)),
};

export default apiClient;
