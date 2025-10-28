// src/api/index.js
export {
  apiClient,
  authApi,
  setAccessToken,
  getAccessToken,
  setAuthEmail,
  getAuthEmail,
} from "./client";

// Compatibilidad con código viejo que esperaba { api }
export { apiClient as api } from "./client";