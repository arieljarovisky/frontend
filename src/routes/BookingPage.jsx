// src/routes/BookingPage.jsx - Versión mejorada modo oscuro
import { AppProvider } from "../context/AppProvider";
import BookingWidget from "../components/BookingWidget";
import CalendarView from "../components/CalendarView";
import { Toaster } from "sonner";

export default function BookingPage() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Header con degradado */}
        <header className="relative overflow-hidden border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 via-purple-600/5 to-pink-600/5" />
          
          <div className="relative max-w-12xl mx-auto px-4 md:px-6 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                  Pelu de Barrio
                </h1>
                <p className="text-slate-400 mt-2 text-sm md:text-base">
                  Sistema de gestión y reservas profesional ✨
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm text-slate-300">Sistema activo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-12xl mx-auto px-4 md:px-6 py-8 grid gap-8">
          {/* Calendario */}
          <CalendarView />
          
          {/* Widget de reservas */}
          <BookingWidget />
        </main>

        {/* Footer mejorado */}
        <footer className="border-t border-slate-800/50 bg-slate-900/30 backdrop-blur-sm mt-12">
          <div className="max-w-12xl mx-auto px-4 md:px-6 py-8">
            <div className="grid md:grid-cols-3 gap-8">
              {/* Columna 1 */}
              <div>
                <h3 className="text-slate-200 font-semibold mb-3">Pelu de Barrio</h3>
                <p className="text-slate-400 text-sm">
                  Sistema profesional de gestión de turnos y reservas online.
                </p>
              </div>
              
              {/* Columna 2 */}
              <div>
                <h3 className="text-slate-200 font-semibold mb-3">Características</h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Reservas en tiempo real
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Gestión de pagos integrada
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Notificaciones por WhatsApp
                  </li>
                </ul>
              </div>
              
              {/* Columna 3 */}
              <div>
                <h3 className="text-slate-200 font-semibold mb-3">Contacto</h3>
                <p className="text-slate-400 text-sm">
                  ¿Tenés dudas? Contactanos por WhatsApp o email.
                </p>
                <div className="mt-4 flex gap-3">
                  <button className="px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 text-sm transition-all">
                    WhatsApp
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-slate-300 text-sm transition-all">
                    Email
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-800/50 text-center text-sm text-slate-500">
              © {new Date().getFullYear()} Pelu de Barrio. Todos los derechos reservados.
            </div>
          </div>
        </footer>
      </div>

      {/* Toaster para notificaciones */}
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
    </AppProvider>
  );
}