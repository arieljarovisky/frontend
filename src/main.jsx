// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { logger } from "./utils/logger.js";
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
import ActivationPendingPage from "./routes/Onboarding/ActivationPendingPage.jsx";
import InstructorsPage from "./routes/Admin/InstructorsPage.jsx";
import MembershipPlansPage from "./routes/Admin/MembershipPlansPage.jsx";
import BranchesPage from "./routes/Admin/BranchesPage.jsx";
import FeatureGate from "./components/FeatureGate.jsx";
import { AppProvider } from "./context/AppProvider.jsx";
import EnterpriseRequest from "./routes/EnterpriseRequest.jsx";
import ForgotPasswordPage from "./routes/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./routes/ResetPasswordPage.jsx";
import ActivatePage from "./routes/ActivatePage.jsx";
import HelpPage from "./routes/HelpPage.jsx";
import ContactPage from "./routes/ContactPage.jsx";
import TermsPage from "./routes/TermsPage.jsx";
import PrivacyPage from "./routes/PrivacyPage.jsx";

// Componente de redirección para mantener compatibilidad con /privacy
const PrivacyRedirect = () => <Navigate to="/privacy.html" replace />;

import PlansPage from "./routes/PlansPage.jsx";
import SubscriptionSuccess from "./routes/SubscriptionSuccess.jsx";
import SubscriptionFailure from "./routes/SubscriptionFailure.jsx";
import CashRegisterPage from "./routes/CashRegister/CashRegisterPage.jsx";
import AccountingPage from "./routes/Accounting/AccountingPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { logDiagnosis, startMonitoring } from "./utils/performanceMonitor.js";
import IntegrationsPage from "./routes/Admin/IntegrationsPage.jsx";
import FeatureRequestPage from "./routes/FeatureRequestPage.jsx";
import TwoFactorAuthPage from "./routes/TwoFactorAuthPage.jsx";
import GoogleOAuthCallback from "./routes/GoogleOAuthCallback.jsx";

const router = createBrowserRouter([
  // Página principal de marketing/ventas
  { path: "/", element: <LandingPage /> },
  { path: "/docs", element: <DocsPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/auth/google/success", element: <GoogleOAuthCallback /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/reset-password", element: <ResetPasswordPage /> },
  { path: "/activate", element: <ActivatePage /> },
  { path: "/enterprise-request", element: <EnterpriseRequest /> },
  { path: "/help", element: <HelpPage /> },
  { path: "/contact", element: <ContactPage /> },
  { path: "/terms", element: <TermsPage /> },
  { path: "/privacy", element: <PrivacyRedirect /> },
  { path: "/privacy.html", element: <PrivacyPage /> },
  { path: "/onboarding", element: <OnboardingPage /> },
  { path: "/onboarding/payment", element: <PaymentSetupPage /> },
  { path: "/onboarding/payment/complete", element: <PaymentCompletePage /> },
  { path: "/onboarding/activation-pending", element: <ActivationPendingPage /> },

  // 👇 TODA la app del tenant cuelga de /:tenantSlug
  {
    path: "/:tenantSlug",
    element: (
      <AppProvider>
        <AppLayout />
      </AppProvider>
    ),
    errorElement: <ErrorBoundary><div className="min-h-screen bg-background flex items-center justify-center p-4"><div className="text-center"><h1 className="text-2xl font-bold text-foreground mb-4">Error al cargar la página</h1><p className="text-foreground-muted mb-4">Ocurrió un error al cargar esta sección. Por favor, recarga la página.</p><button onClick={() => window.location.reload()} className="btn-primary">Recargar página</button></div></div></ErrorBoundary>,
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
        path: "admin/2fa",
        element: (
          <PrivateRoute>
            <TwoFactorAuthPage />
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
            <FeatureGate featureKey="online_sales">
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
            <FeatureGate featureKey="ecommerce_integrations">
              <IntegrationsPage />
            </FeatureGate>
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
      {
        path: "feature-request",
        element: (
          <PrivateRoute roles={["admin"]}>
            <FeatureRequestPage />
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
    logger.log('💡 Tip: Usa window.checkServerPerformance() en la consola para ver el diagnóstico');
  }
  
  // Protección global contra errores de DOM durante traducciones automáticas
  const isPageTranslated = () => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('translated-ltr') ||
           document.documentElement.classList.contains('translated-rtl') ||
           document.body.classList.contains('translated-ltr') ||
           document.body.classList.contains('translated-rtl') ||
           document.querySelector('[data-google-translate]') !== null ||
           document.querySelector('script[src*="translate.googleapis.com"]') !== null;
  };
  
  const isRemoveChildError = (message, error) => {
    const msg = String(message || '');
    const errMsg = error?.message ? String(error.message) : '';
    return (msg.includes('removeChild') || errMsg.includes('removeChild')) &&
           (error?.name === 'NotFoundError' || error?.name === 'DOMException');
  };
  
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Verificar si es un error de removeChild durante traducción
    if (isRemoveChildError(message, error) && isPageTranslated()) {
      // Silenciar el error durante traducciones
      if (import.meta.env.DEV) {
        logger.warn('Error de DOM durante traducción automática (ignorado):', { message, error });
      }
      return true; // Prevenir que el error se propague
    }
    
    // Llamar al manejador original si existe
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // También capturar errores no manejados en promesas
  window.addEventListener('unhandledrejection', (event) => {
    if (isRemoveChildError(event.reason?.message, event.reason) && isPageTranslated()) {
      // Silenciar el error durante traducciones
      if (import.meta.env.DEV) {
        logger.warn('Error de DOM durante traducción automática (ignorado):', event.reason);
      }
      event.preventDefault(); // Prevenir que el error se propague
    }
  });
  
  // Interceptar removeChild a nivel de Node.prototype para prevenir errores
  // Esto se hace aquí como respaldo, pero el script inline en HTML debería ejecutarse primero
  if (typeof Node !== 'undefined' && Node.prototype.removeChild) {
    // Solo interceptar si no fue ya interceptado por el script inline
    if (!Node.prototype.removeChild._translationProtected) {
      const originalRemoveChild = Node.prototype.removeChild;
      Node.prototype.removeChild = function(child) {
        try {
          // Verificar si el nodo es realmente hijo antes de remover
          // Usar múltiples métodos de verificación para mayor robustez
          let isChild = false;
          if (child && this) {
            try {
              // Método 1: contains
              if (this.contains) {
                isChild = this.contains(child);
              }
              // Método 2: comparar parentNode
              if (!isChild && child.parentNode === this) {
                isChild = true;
              }
              // Método 3: verificar en childNodes
              if (!isChild && this.childNodes) {
                isChild = Array.from(this.childNodes).includes(child);
              }
            } catch (e) {
              // Si cualquier verificación falla, asumir que no es hijo
              isChild = false;
            }
          }
          
          if (!isChild) {
            // Si la página está siendo traducida, simplemente retornar sin error
            if (isPageTranslated()) {
              if (import.meta.env.DEV) {
                logger.warn('Intento de remover nodo que no es hijo (ignorado durante traducción)');
              }
              return child;
            }
            // Si no está siendo traducida, lanzar el error normalmente
            throw new DOMException('Failed to execute \'removeChild\' on \'Node\': The node to be removed is not a child of this node.', 'NotFoundError');
          }
          return originalRemoveChild.call(this, child);
        } catch (error) {
          // Si es un error de removeChild durante traducción, ignorarlo
          if (isPageTranslated() && isRemoveChildError(error.message, error)) {
            if (import.meta.env.DEV) {
              logger.warn('Error de removeChild durante traducción (ignorado):', error);
            }
            return child;
          }
          throw error;
        }
      };
      Node.prototype.removeChild._translationProtected = true;
    }
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