// CalendarView.jsx - Versión mejorada con react-big-calendar
import { useMemo, useState, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "moment/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useApp } from "../context/UseApp";
import AppointmentModal from "./AppointmentModal";
import { Filter, RefreshCw } from "lucide-react";

// Configurar moment en español
moment.locale("es");
const localizer = momentLocalizer(moment);

// Paleta de colores mejorada para modo oscuro
const PALETTE = [
  "#6366F1", // Indigo
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#A855F7", // Purple
  "#84CC16", // Lime
  "#F97316", // Orange
  "#22C55E", // Green
  "#E11D48"  // Rose
];

const colorByIndex = (i) => PALETTE[i % PALETTE.length];

// Helper: construir mapa de colores por estilista
function buildStylistColorMap(stylists) {
  const map = {};
  (stylists || []).forEach((s, idx) => {
    map[s.id] = s.color_hex?.trim() || colorByIndex(idx);
  });
  return map;
}

// Helper: detectar métodos de pago
function getPaymentMethods(ep = {}) {
  const out = new Set();
  const push = (s) => {
    if (!s) return;
    const v = String(s).toLowerCase();
    if (v.includes("efectivo") || v.includes("cash")) out.add("cash");
    if (v.includes("tarjeta") || v.includes("card") || v.includes("debito") || v.includes("débito")) out.add("card");
    if (v.includes("mercadopago") || v.includes("mp")) out.add("mp");
  };

  [ep.last_payment_method, ep.payment_method, ep.deposit_method, ep.mp_payment_method].forEach(push);
  if (ep.paid_cash || ep.has_cash_payment) out.add("cash");
  if (ep.paid_card || ep.has_card_payment) out.add("card");
  
  const listLike = ep.payment_methods || ep.paid_methods || ep.methods;
  if (Array.isArray(listLike)) listLike.forEach(push);
  else if (typeof listLike === "string") listLike.split(/[,\s]+/).forEach(push);
  
  if (ep.mp_payment_id || ep.mp_payment_status) out.add("mp");
  return Array.from(out);
}

// Componente de evento personalizado
const EventComponent = ({ event }) => {
  const ep = event.extendedProps || {};
  const methods = getPaymentMethods(ep);
  const status = ep.status;
  
  return (
    <div className="flex flex-col gap-1 p-1">
      <div className="font-semibold text-xs leading-tight truncate">
        {event.title}
      </div>
      
      <div className="flex flex-wrap gap-1">
        {ep.stylist_name && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-black/20 backdrop-blur-sm">
            {ep.stylist_name}
          </span>
        )}
        
        {status === "pending_deposit" && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300">
            Seña pendiente
          </span>
        )}
        
        {status === "deposit_paid" && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300">
            Seña pagada
          </span>
        )}
        
        {status === "cancelled" && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-slate-500/20 text-slate-400">
            Cancelado
          </span>
        )}
      </div>
      
      {methods.length > 0 && (
        <div className="flex gap-1">
          {methods.includes("cash") && (
            <span className="text-[10px]" title="Efectivo">💵</span>
          )}
          {methods.includes("card") && (
            <span className="text-[10px]" title="Tarjeta">💳</span>
          )}
          {methods.includes("mp") && (
            <span className="text-[10px]" title="Mercado Pago">🟦</span>
          )}
        </div>
      )}
    </div>
  );
};

export default function CalendarView() {
  const { events, eventsLoading, eventsError, setRange, loadEvents, stylists } = useApp();
  const [stylistFilter, setStylistFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState("week");

  const stylistColors = useMemo(() => buildStylistColorMap(stylists), [stylists]);

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    if (!stylistFilter) return list;
    return list.filter(
      (ev) => String(ev?.extendedProps?.stylist_id ?? ev?.extendedProps?.stylistId) === String(stylistFilter)
    );
  }, [events, stylistFilter]);

  // Convertir eventos para react-big-calendar
  const calendarEvents = useMemo(() => {
    return (filteredEvents || []).map((ev) => {
      const st = ev.extendedProps?.status || "";
      const sid = ev.extendedProps?.stylist_id ?? ev.extendedProps?.stylistId;
      const base = ev.extendedProps?.color_hex || stylistColors[sid] || "#6B7280";

      let backgroundColor = base;
      let borderColor = base;
      let opacity = 1;

      if (st === "pending_deposit") {
        opacity = 0.85;
      } else if (st === "cancelled") {
        backgroundColor = "#475569";
        borderColor = "#64748B";
        opacity = 0.6;
      } else if (st === "completed") {
        opacity = 0.9;
      }

      return {
        id: ev.id,
        title: ev.title,
        start: new Date(ev.start),
        end: new Date(ev.end),
        resource: {
          backgroundColor,
          borderColor,
          opacity,
          extendedProps: ev.extendedProps,
        },
        extendedProps: ev.extendedProps,
      };
    });
  }, [filteredEvents, stylistColors]);

  const handleSelectEvent = useCallback((event) => {
    if (event.extendedProps?.status === "cancelled") return;
    setSelectedEvent({
      ...event,
      extendedProps: event.extendedProps,
      start: event.start.toISOString(),
      end: event.end.toISOString(),
    });
    setModalOpen(true);
  }, []);

  const handleRangeChange = useCallback((range) => {
    let fromIso, toIso;
    
    if (Array.isArray(range)) {
      fromIso = new Date(range[0]).toISOString();
      toIso = new Date(range[range.length - 1]);
      toIso.setHours(23, 59, 59, 999);
      toIso = toIso.toISOString();
    } else {
      fromIso = new Date(range.start).toISOString();
      toIso = new Date(range.end).toISOString();
    }
    
    setRange({ fromIso, toIso });
  }, [setRange]);

  const eventStyleGetter = useCallback((event) => {
    const resource = event.resource || {};
    return {
      style: {
        backgroundColor: resource.backgroundColor || "#6366F1",
        borderLeftColor: resource.borderColor || "#6366F1",
        borderLeftWidth: "4px",
        borderLeftStyle: "solid",
        opacity: resource.opacity || 1,
        color: "#ffffff",
      },
    };
  }, []);

  const messages = {
    today: "Hoy",
    previous: "Anterior",
    next: "Siguiente",
    month: "Mes",
    week: "Semana",
    day: "Día",
    agenda: "Agenda",
    date: "Fecha",
    time: "Hora",
    event: "Evento",
    noEventsInRange: "No hay eventos en este rango",
    showMore: (total) => `+ ${total} más`,
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-800/50 p-6">
      {/* Header con controles */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            📅 Calendario de Turnos
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Gestión visual de todos tus turnos
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por estilista */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={stylistFilter}
              onChange={(e) => setStylistFilter(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            >
              <option value="">Todos los estilistas</option>
              {(stylists || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Botón refrescar */}
          <button
            onClick={loadEvents}
            disabled={eventsLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${eventsLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Leyenda de colores */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(stylists || []).map((s) => (
          <div
            key={s.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700/50"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color_hex?.trim() || stylistColors[s.id] || "#6B7280" }}
            />
            <span className="text-xs text-slate-300">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Mensajes de estado */}
      {eventsLoading && (
        <div className="mb-4 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm">
          Actualizando calendario...
        </div>
      )}
      
      {eventsError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {eventsError}
        </div>
      )}

      {/* Calendario */}
      <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-800/30">
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 700 }}
          view={view}
          onView={setView}
          onSelectEvent={handleSelectEvent}
          onRangeChange={handleRangeChange}
          eventPropGetter={eventStyleGetter}
          components={{
            event: EventComponent,
          }}
          messages={messages}
          formats={{
            timeGutterFormat: "HH:mm",
            eventTimeRangeFormat: ({ start, end }) =>
              `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
            agendaTimeRangeFormat: ({ start, end }) =>
              `${moment(start).format("HH:mm")} - ${moment(end).format("HH:mm")}`,
          }}
          step={15}
          timeslots={4}
          min={new Date(2024, 0, 1, 9, 0)}
          max={new Date(2024, 0, 1, 21, 0)}
          defaultDate={new Date()}
          popup
          selectable
        />
      </div>

      {/* Modal de edición */}
      <AppointmentModal
        open={modalOpen}
        event={selectedEvent}
        onClose={() => {
          setModalOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}