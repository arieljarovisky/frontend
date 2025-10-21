import { useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useApp } from "../context/UseApp";
import AppointmentModal from "./AppointmentModal";

export default function CalendarView() {
  const { events, eventsLoading, eventsError, setRange, loadEvents, stylists } = useApp();
  const [stylistFilter, setStylistFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    if (!stylistFilter) return events;
    return events.filter((ev) => String(ev?.extendedProps?.stylist_id ?? ev?.extendedProps?.stylistId) === String(stylistFilter));
  }, [events, stylistFilter]);

  return (
    <div className="bg-white/90 rounded-2xl shadow p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">Calendario</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Peluquero:</label>
          <select
            value={stylistFilter}
            onChange={(e) => setStylistFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            title="Filtrar por peluquero"
          >
            <option value="">Todos</option>
            {Array.isArray(stylists) &&
              stylists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>

          <button onClick={loadEvents} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm">
            Refrescar
          </button>
        </div>
      </div>

      {eventsLoading && <div className="text-xs text-gray-500 mb-2">actualizando…</div>}
      {eventsError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{eventsError}</div>
      )}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        slotMinTime="09:00:00"
        slotMaxTime="21:00:00"
        locale="es"
        nowIndicator
        events={filteredEvents}
        datesSet={(arg) =>
          setRange({
            fromIso: new Date(arg.start).toISOString(),
            toIso: new Date(arg.end).toISOString(),
          })
        }
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit" }}
        height="auto"
        eventClick={(info) => {
          setSelectedEvent(info.event);
          setModalOpen(true);
        }}
      />

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
