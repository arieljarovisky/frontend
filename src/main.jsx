// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import "./calendar-dark.css";

// Layout y páginas
import LandingPage from "./routes/LandingPage.jsx";
import AppLayout from "./routes/AppLayout.jsx";
import DashboardPage from "./routes/DashboardPage.jsx";
import CustomersPage from "./routes/CustomersPage.jsx";
import CustomerDetailPage from "./routes/CustomerDetailPage.jsx";
import BookingPage from "./routes/BookingPage.jsx";
import DepositsPage from "./routes/Depositspage.jsx";
import LoginPage from "./routes/LoginPage.jsx";
import ClassesPage from "./routes/ClassesPage.jsx";

// Auth
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import PaymentSuccess from "./routes/PaymentSuccess.jsx";
import PaymentFailure from "./routes/PaymentFailure.jsx";

// Sistema de notificaciones
import { NotificationSystem } from "./components/notifications/NotificationSystem.jsx";
import DepositsConfig from "./routes/Admin/DepositsConfig.jsx";
import Commissions from "./routes/Admin/Comissions.jsx";
import StylistStats from "./routes/Admin/StylistStats.jsx";
import ConfigPage from "./routes/Admin/ConfigPage.jsx";
import NotificationsPage from "./routes/NotificationPage.jsx";
import ProductsPage from "./routes/Stock/ProductsPage.jsx";
import InvoicingPage from "./routes/Invoicing/InvoicingPage.jsx";
import UsersPage from "./routes/Users/UsersPage.jsx";
import SuperAdminLayout from "./routes/SuperAdmin/SuperAdminLayout.jsx";
import SuperAdminTenantsPage from "./routes/SuperAdmin/SuperAdminTenantsPage.jsx";
import SuperAdminRoute from "./components/SuperAdminRoute.jsx";
import OnboardingPage from "./routes/Onboarding/OnboardingPage.jsx";
import PaymentSetupPage from "./routes/Onboarding/PaymentSetupPage.jsx";
import PaymentCompletePage from "./routes/Onboarding/PaymentCompletePage.jsx";

const router = createBrowserRouter([
  // Página principal de marketing/ventas
  { path: "/", element: <LandingPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { path: "/onboarding/payment", element: <PaymentSetupPage /> },
  { path: "/onboarding/payment/complete", element: <PaymentCompletePage /> },

  // 👇 TODA la app del tenant cuelga de /:tenantSlug
  {
    path: "/:tenantSlug",
    element: <AppLayout />,
    children: [
      // Redirección del index a dashboard
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      { path: "payment/success", element: <PaymentSuccess /> },
      { path: "payment/failure", element: <PaymentFailure /> },
      { path: "payment/pending", element: <PaymentSuccess /> },
      {
        path: "dashboard",
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
        path: "classes",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <ClassesPage />
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
        path: "stock/products",
        element: (
          <PrivateRoute>
            <ProductsPage />
          </PrivateRoute>
        ),
      },
      {
        path: "invoicing",
        element: (
          <PrivateRoute>
            <InvoicingPage />
          </PrivateRoute>
        ),
      },
      {
        path: "users",
        element: (
          <PrivateRoute roles={["admin"]}>
            <UsersPage />
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

  // Panel dueño del sistema
  {
    path: "/super-admin",
    element: (
      <SuperAdminRoute>
        <SuperAdminLayout />
      </SuperAdminRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="tenants" replace />,
      },
      {
        path: "tenants",
        element: <SuperAdminTenantsPage />,
      },
    ],
  },

  // Fallback: fuera de un tenant → a la landing page
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <NotificationSystem />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);