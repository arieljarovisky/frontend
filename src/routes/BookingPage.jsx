// src/routes/BookingPage.jsx
import { AppProvider } from "../context/AppProvider";
import BookingWidget from "../components/BookingWidget";
import CalendarView from "../components/CalendarView";

export default function BookingPage() {
  return (
    <AppProvider>
      {/* Wrapper de página con fondo que cubre todo */}
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm text-foreground-secondary">Sistema activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Calendario (sólido y sin cortes) */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
          <div className="card overflow-hidden">
            <CalendarView />
          </div>
        </div>

        {/* Panel Widget (mismo fondo para que no "corte") */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
          <div className="card overflow-hidden">
            <BookingWidget />
          </div>
        </div>

      </div>
    </AppProvider>
  );
}
