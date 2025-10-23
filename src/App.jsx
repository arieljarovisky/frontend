// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import BookingPage from "./routes/BookingPage.jsx";
// si tenés Dashboard, Customers, etc. importalos acá
// import DashboardPage from "./routes/DashboardPage.jsx";

function Shell({ children }) {
  return (
    <div className="min-h-screen">
      {/* navbar simple opcional */}
      <nav className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex gap-4">
          <Link to="/" className="font-semibold">Pelu de Barrio</Link>
          <Link to="/appointments" className="text-sm text-zinc-600 hover:text-zinc-800">
            Reservar turnos
          </Link>
          {/* <Link to="/admin" className="text-sm text-zinc-600 hover:text-zinc-800">Dashboard</Link> */}
        </div>
      </nav>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          {/* Home: redirige a reservas o poné otra landing si querés */}
          <Route path="/" element={<Navigate to="/appointments" replace />} />
          <Route path="/appointments" element={<BookingPage />} />
          {/* <Route path="/admin" element={<DashboardPage />} /> */}
          <Route path="*" element={<Navigate to="/appointments" replace />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
