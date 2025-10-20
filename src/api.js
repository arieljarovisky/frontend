import axios from "axios";
const api = axios.create({ baseURL: "/api", headers: { "Content-Type": "application/json" } });

export const getStylists = () => api.get("/stylists").then(r => r.data);
export const getServices = () => api.get("/services").then(r => r.data);
export const getAppointments = (params) => api.get("/appointments", { params }).then(r => r.data);
export const createAppointment = (body) => api.post("/appointments", body).then(r => r.data);

// 👇 aceptar AbortSignal para poder cancelar
export const getAvailability = (stylistId, serviceId, date, signal) =>
  api.get("/availability", { params: { stylistId, serviceId, date }, signal }).then(r => r.data);

export default api;
