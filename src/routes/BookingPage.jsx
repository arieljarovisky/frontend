// src/routes/BookingPage.jsx
import { useState, useEffect } from "react";
import BookingWidget from "../components/BookingWidget";
import CalendarView from "../components/CalendarView";
import { Calendar, ArrowUp } from "lucide-react";

export default function BookingPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToWidget = () => {
    const widget = document.getElementById("booking-widget");
    if (widget) {
      widget.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header mejorado con botón destacado */}
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
          
          {/* Botón destacado para reservar turno */}
          <button
            onClick={scrollToWidget}
            className="group relative px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-300 flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            <span>Reservar Turno</span>
            <ArrowUp className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </div>

      {/* Panel Widget - MOVIDO ARRIBA para mayor visibilidad */}
      <div id="booking-widget" className="max-w-7xl mx-auto px-4 md:px-6 pb-6">
        <div className="card overflow-hidden shadow-2xl border-2 border-primary/20">
          <BookingWidget />
        </div>
      </div>

      {/* Panel Calendario */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
        <div className="card overflow-hidden">
          <CalendarView />
        </div>
      </div>

      {/* Botón flotante para volver al widget */}
      {showScrollTop && (
        <button
          onClick={scrollToWidget}
          className="fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-500/70 transition-all duration-300 hover:scale-110 flex items-center justify-center group"
          aria-label="Volver a reservar turno"
        >
          <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
        </button>
      )}
    </div>
  );
}
