// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import "./styles/arja-theme.css";

// Layout y páginas
import LandingPage from "./routes/LandingPage.jsx";
import DocsPage from "./routes/DocsPage.jsx";
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
import InstructorStats from "./routes/Admin/InstructorStats.jsx";
import ConfigPage from "./routes/Admin/ConfigPage.jsx";
import NotificationsPage from "./routes/NotificationPage.jsx";
import ProductsPage from "./routes/Stock/ProductsPage.jsx";
import StockReservationsPage from "./routes/Stock/StockReservationsPage.jsx";
import StockTransfersPage from "./routes/Stock/StockTransfersPage.jsx";
import StockAlertsPage from "./routes/Stock/StockAlertsPage.jsx";
import StockValuationPage from "./routes/Stock/StockValuationPage.jsx";
import InvoicingPage from "./routes/Invoicing/InvoicingPage.jsx";
import EcommerceSalesPage from "./routes/Invoicing/EcommerceSalesPage.jsx";
import UsersPage from "./routes/Users/UsersPage.jsx";
import SuperAdminLayout from "./routes/SuperAdmin/SuperAdminLayout.jsx";
import SuperAdminTenantsPage from "./routes/SuperAdmin/SuperAdminTenantsPage.jsx";
import SuperAdminTenantDetail from "./routes/SuperAdmin/SuperAdminTenantDetail.jsx";
import SuperAdminRoute from "./components/SuperAdminRoute.jsx";
import OnboardingPage from "./routes/Onboarding/OnboardingPage.jsx";
import PaymentSetupPage from "./routes/Onboarding/PaymentSetupPage.jsx";
import PaymentCompletePage from "./routes/Onboarding/PaymentCompletePage.jsx";
import InstructorsPage from "./routes/Admin/InstructorsPage.jsx";
import MembershipPlansPage from "./routes/Admin/MembershipPlansPage.jsx";
import BranchesPage from "./routes/Admin/BranchesPage.jsx";
import FeatureGate from "./components/FeatureGate.jsx";
import { AppProvider } from "./context/AppProvider.jsx";
import EnterpriseRequest from "./routes/EnterpriseRequest.jsx";
import ForgotPasswordPage from "./routes/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./routes/ResetPasswordPage.jsx";
import HelpPage from "./routes/HelpPage.jsx";
import ContactPage from "./routes/ContactPage.jsx";
import TermsPage from "./routes/TermsPage.jsx";
import PrivacyPage from "./routes/PrivacyPage.jsx";
import PlansPage from "./routes/PlansPage.jsx";
import SubscriptionSuccess from "./routes/SubscriptionSuccess.jsx";
import SubscriptionFailure from "./routes/SubscriptionFailure.jsx";
import CashRegisterPage from "./routes/CashRegister/CashRegisterPage.jsx";
import AccountingPage from "./routes/Accounting/AccountingPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { logDiagnosis, startMonitoring } from "./utils/performanceMonitor.js";
import IntegrationsPage from "./routes/Admin/IntegrationsPage.jsx";

const router = createBrowserRouter([
  // Página principal de marketing/ventas
  { path: "/", element: <LandingPage /> },
  { path: "/docs", element: <DocsPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/enterprise-request", element: <EnterpriseRequest /> },
  { path: "/help", element: <HelpPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { path: "/onboarding/payment", element: <PaymentSetupPage /> },
  { path: "/onboarding/payment/complete", element: <PaymentCompletePage /> },

  // 👇 TODA la app del tenant cuelga de /:tenantSlug
  {
    path: "/:tenantSlug",
    element: (
      <AppProvider>
        <AppLayout />
      </AppProvider>
    ),
    children: [
      // Redirección del index a dashboard
      {
        index: true,
        element: <Navigate to="dashboard" replace />,
      },
      { path: "payment/success", element: <PaymentSuccess /> },
      { path: "payment/failure", element: <PaymentFailure /> },
      { path: "payment/pending", element: <PaymentSuccess /> },
      { path: "subscription/success", element: <SubscriptionSuccess /> },
      { path: "subscription/failure", element: <SubscriptionFailure /> },
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
        path: "plans",
        element: (
          <PrivateRoute>
            <PlansPage />
          </PrivateRoute>
        ),
      },
      {
        path: "stock/products",
        element: (
          <PrivateRoute>
            <FeatureGate featureKey="stock">
              <ProductsPage />
            </FeatureGate>
          </PrivateRoute>
        ),
      },
      {
        path: "stock/reservations",
        element: (
          <PrivateRoute>
            <FeatureGate featureKey="stock">
              <StockReservationsPage />
            </FeatureGate>
          </PrivateRoute>
        ),
      },
      {
        path: "stock/transfers",
        element: (
          <PrivateRoute>
            <FeatureGate featureKey="stock">
              <StockTransfersPage />
            </FeatureGate>
          </PrivateRoute>
        ),
      },
      {
        path: "stock/alerts",
        element: (
          <PrivateRoute>
            <FeatureGate featureKey="stock">
              <StockAlertsPage />
            </FeatureGate>
          </PrivateRoute>
        ),
      },
      {
        path: "stock/valuation",
        element: (
          <PrivateRoute>
            <FeatureGate featureKey="stock">
              <StockValuationPage />
            </FeatureGate>
          </PrivateRoute>
        ),
      },
      {
        path: "invoicing",
        element: (
          <PrivateRoute>
            <FeatureGate featureKey="invoicing">
              <InvoicingPage />
            </FeatureGate>
          </PrivateRoute>
        ),
      },
      {
        path: "ecommerce-sales",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <FeatureGate featureKey="invoicing">
              <EcommerceSalesPage />
            </FeatureGate>
          </PrivateRoute>
        ),
      },
      {
        path: "cash-register",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <CashRegisterPage />
          </PrivateRoute>
        ),
      },
      {
        path: "accounting",
        element: (
          <PrivateRoute roles={["admin", "staff"]}>
            <AccountingPage />
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
        path: "admin/integraciones",
        element: (
          <PrivateRoute roles={["admin"]}>
            <IntegrationsPage />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/instructores",
        element: (
          <PrivateRoute roles={["admin"]}>
            <InstructorsPage />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/branches",
        element: (
          <PrivateRoute roles={["admin"]}>
            <BranchesPage />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/instructores/estadisticas",
        element: (
          <PrivateRoute roles={["admin"]}>
            <InstructorStats />
          </PrivateRoute>
        ),
      },
      {
        path: "admin/membresias",
        element: (
          <PrivateRoute roles={["admin"]}>
            <MembershipPlansPage />
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
      {
        path: "tenants/:tenantId",
        element: <SuperAdminTenantDetail />,
      },
    ],
  },

  // Fallback: fuera de un tenant → a la landing page
  { path: "*", element: <Navigate to="/" replace /> },
]);

// Exponer función de diagnóstico en la consola para debugging
if (typeof window !== 'undefined') {
  window.checkServerPerformance = logDiagnosis;
  window.startPerformanceMonitoring = startMonitoring;
  
  // Iniciar monitoreo automático en desarrollo
  if (import.meta.env.DEV) {
    startMonitoring(60000); // Cada minuto
    console.log('💡 Tip: Usa window.checkServerPerformance() en la consola para ver el diagnóstico');
  }
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificationSystem />
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);