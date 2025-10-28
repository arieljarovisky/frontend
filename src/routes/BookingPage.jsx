// src/routes/BookingPage.jsx
import { AppProvider } from "../context/AppProvider";
import BookingWidget from "../components/BookingWidget";
import CalendarView from "../components/CalendarView";
import { Toaster } from "sonner";

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
                  <span className="text-sm text-slate-300">Sistema activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Calendario (sólido y sin cortes) */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
            <CalendarView />
          </div>
        </div>

        {/* Panel Widget (mismo fondo para que no “corte”) */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
          <div className="rounded-2xl bg-white/[0.03] ring-1 ring-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] overflow-hidden">
            <BookingWidget />
          </div>
        </div>

        {/* Toaster */}
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgb(30, 41, 59)',
              border: '1px solid rgb(51, 65, 85)',
              color: 'rgb(226, 232, 240)',
            },
            className: 'backdrop-blur-sm',
          }}
        />
      </div>
    </AppProvider>
  );
}
