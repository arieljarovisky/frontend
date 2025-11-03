// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import "./calendar-dark.css";

// Layout y páginas
import AppLayout from "./routes/AppLayout.jsx";
import DashboardPage from "./routes/DashboardPage.jsx";
import CustomersPage from "./routes/CustomersPage.jsx";
import CustomerDetailPage from "./routes/CustomerDetailPage.jsx";
import BookingPage from "./routes/BookingPage.jsx";
import DepositsPage from "./routes/Depositspage.jsx";
import LoginPage from "./routes/LoginPage.jsx";

// Auth
import { AuthProvider } from "./context/AuthContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";

// Sistema de notificaciones
import { NotificationSystem } from "./components/notifications/NotificationSystem.jsx";
import DepositsConfig from "./routes/Admin/DepositsConfig.jsx";
import Commissions from "./routes/Admin/Comissions.jsx";
import StylistStats from "./routes/Admin/StylistStats.jsx";
import ConfigPage from "./routes/Admin/ConfigPage.jsx";
import NotificationsPage from "./routes/NotificationPage.jsx";

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },

  // 👇 TODA la app del tenant cuelga de /:tenantSlug
  {
    path: "/:tenantSlug",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <DashboardPage />
          </PrivateRoute>
        ),
      },
      {
        path: "customers",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <CustomersPage />
          </PrivateRoute>
        ),
      },
      {
        path: "customers/:id",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <CustomerDetailPage />
          </PrivateRoute>
        ),
      },
      { path: "appointments", element: <BookingPage /> }, // público del tenant
      {
        path: "deposits",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <DepositsPage />
          </PrivateRoute>
        ),
      },
      {
        path: "notifications",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <NotificationsPage />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/config",
        element: (
          <PrivateRoute roles={["admin"]}>
            <ConfigPage />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/comisiones",
        element: (
          <PrivateRoute roles={["admin"]}>
            <Commissions />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/peluqueros",
        element: (
          <PrivateRoute roles={["admin"]}>
            <StylistStats />
          </PrivateRoute>
        ),
      },
    ],
  },

  // Fallback: fuera de un tenant → al login
  { path: "*", element: <Navigate to="/login" replace /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationSystem />
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);