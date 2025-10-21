// src/App.jsx
import { AppProvider } from "./context/AppProvider";
import BookingWidget from "./components/BookingWidget";
import CalendarView from "./components/CalendarView";

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen">
        <header className="px-4 pt-8 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Reservá tu turno <span className="align-middle">✂️</span>
          </h1>
          <p className="text-zinc-600 mt-2">
            Elegí servicio, peluquero, fecha y horario. Te confirmamos por WhatsApp.
          </p>
        </header>

        <main className="max-w-12xl mx-auto p-4 md:p-6 grid gap-6 md:grid-cols-[1.1fr_1fr]">
          <BookingWidget />
          <CalendarView />
        </main>

        <footer className="text-center text-xs text-zinc-500 py-8">
          Pelu de Barrio • {new Date().getFullYear()}
        </footer>
      </div>
    </AppProvider>
  );
}
