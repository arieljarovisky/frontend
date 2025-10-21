import axios from "axios";

const API_BASE = (import.meta?.env?.VITE_API_BASE || "http://localhost:4000").replace(/\/$/, "");

export const apiClient = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
    timeout: 15000,
});

apiClient.interceptors.response.use(
    (r) => r,
    (err) => {
        const status = err?.response?.status;
        const data = err?.response?.data;
        console.error("[API ERROR]", status, data || err.message);
        throw new Error(
            typeof data === "string" ? data : JSON.stringify(data || { message: err.message })
        );
    }
);

// Helpers que normalizan la forma { ok: true, data: [...] }
export const api = {
    getServices: async () => {
        const { data } = await apiClient.get("/api/services");
        // soporta {ok:true,data:[...]} o array directo
        return Array.isArray(data) ? data : (data?.data ?? []);
    },
    getStylists: async () => {
        const { data } = await apiClient.get("/api/stylists");
        return Array.isArray(data) ? data : (data?.data ?? []);
    },
    getAvailability: async ({ serviceId, stylistId, date, stepMin = 10 }) => {
    const sid = Number(serviceId);
    const tid = Number(stylistId);
    const step = String(stepMin); // algunos backends lo esperan string
    const params = {
      // camel
      serviceId: sid, stylistId: tid, date, stepMin: step,
      // snake (compat)
      service_id: sid, stylist_id: tid, step_min: step,
    };
    const { data } = await apiClient.get("/api/availability", { params });
    return data;
  },
    getAppointmentsBetween: async (fromIso, toIso) => {
        const { data } = await apiClient.get("/api/appointments", { params: { from: fromIso, to: toIso } });
        return data;
    },
    createAppointment: async (payload) => {
        const body = {
            customerPhone: payload.customerPhone,
            customerName: payload.customerName,
            stylistId: payload.stylistId,
            serviceId: payload.serviceId,
            startsAt: payload.startsAt,
            // snake-case por compatibilidad
            phone_e164: payload.customerPhone,
            customer_name: payload.customerName,
            stylist_id: payload.stylistId,
            service_id: payload.serviceId,
            starts_at: payload.startsAt,
        };
        const { data } = await apiClient.post("/api/appointments", body);
        return data;
    },
};
