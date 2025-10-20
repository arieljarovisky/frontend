import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { getStylists, getAppointments } from "../api";

/**
 * Muestra agenda por peluquero (resourceTimeGridDay/Week).
 * Lee turnos de /api/appointments y los pinta por stylist_id.
 */
export default function CalendarView() {
  const [stylists, setStylists] = useState([]);
  const [events, setEvents] = useState([]);
  const [range, setRange] = useState({ from: null, to: null });

  // Cargar peluqueros
  useEffect(() => {
    getStylists().then(setStylists);
  }, []);

  // Cargar turnos al cambiar el rango visible
  useEffect(() => {
    if (!range.from || !range.to) return;
    getAppointments({
      from: range.from.toISOString(),
      to: range.to.toISOString()
    }).then((rows) => {
      const evs = rows.map(a => ({
        id: String(a.id),
        resourceId: String(a.stylist_id),
        start: a.starts_at, // viene ISO UTC de la API
        end: a.ends_at,
        title: `${a.service_name} – ${a.customer_name ?? a.phone_e164}`,
        backgroundColor: a.color_hex ?? undefined
      }));
      setEvents(evs);
    });
  }, [range]);

  const resources = useMemo(
    () => stylists.map(s => ({ id: String(s.id), title: s.name })),
    [stylists]
  );

  return (
    <div className="p-4">
      <FullCalendar
        height="80vh"
        plugins={[resourceTimeGridPlugin, interactionPlugin]}
        initialView="resourceTimeGridDay"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "resourceTimeGridDay,resourceTimeGridWeek"
        }}
        resources={resources}
        events={events}
        slotMinTime="09:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        nowIndicator={true}
        eventOverlap={false}
        datesSet={(arg) => {
          // FullCalendar da start/end como Date (UTC). Guardamos para fetch.
          setRange({ from: arg.start, to: arg.end });
        }}
      />
    </div>
  );
}
