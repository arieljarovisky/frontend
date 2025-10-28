// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

// Páginas
import BookingPage from "./routes/BookingPage.jsx";
import DashboardPage from "./routes/DashboardPage.jsx";
import CustomersPage from "./routes/CustomersPage.jsx";
import CustomerDetailPage from "./routes/CustomerDetailPage.jsx";
import DepositsPage from "./routes/Depositspage.jsx";
import Login from "./routes/LoginPage.jsx";

// Auth
import { AuthProvider } from "./context/AuthContext.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";

function Shell({ children }) {
  return (
    <div className="min-h-screen">
      <nav className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4">
          <Link to="/" className="font-semibold">Pelu de Barrio</Link>
          <Link to="/appointments" className="text-sm text-zinc-600 hover:text-zinc-800">
            Reservar turnos
          </Link>
          <Link to="/customers" className="text-sm text-zinc-600 hover:text-zinc-800">
            Clientes
          </Link>
          <Link to="/deposits" className="text-sm text-zinc-600 hover:text-zinc-800">
            Depósitos
          </Link>
        </div>
      </nav>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            {/* Dashboard protegido */}
            <Route
              path="/"
              element={
                <PrivateRoute roles={["admin", "staff"]}>
                  <DashboardPage />
                </PrivateRoute>
              }
            />

            {/* Módulos protegidos */}
            <Route
              path="/customers"
              element={
                <PrivateRoute roles={["admin", "staff"]}>
                  <CustomersPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/customers/:id"
              element={
                <PrivateRoute roles={["admin", "staff"]}>
                  <CustomerDetailPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/deposits"
              element={
                <PrivateRoute roles={["admin", "staff"]}>
                  <DepositsPage />
                </PrivateRoute>
              }
            />

            {/* Público */}
            <Route path="/appointments" element={<BookingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/appointments" replace />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </AuthProvider>
  );
}
