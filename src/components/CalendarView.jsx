import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useApp } from "../context/UseApp";


export default function CalendarView() {
    const { events, eventsLoading, eventsError, setRange, loadEvents } = useApp();


    return (
        <div className="rounded-2xl shadow p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg md:text-xl font-semibold tracking-tight">Calendario</h2>
                <div className="flex items-center gap-2 text-sm">
                    {eventsLoading && <span className="text-gray-500">actualizando...</span>}
                    <button onClick={loadEvents} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50">Refrescar</button>
                </div>
            </div>
            {eventsError && <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{eventsError}</div>}
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
                slotMinTime="09:00:00"
                slotMaxTime="21:00:00"
                locale="es"
                events={events}
                datesSet={(arg) => setRange({ fromIso: new Date(arg.start).toISOString(), toIso: new Date(arg.end).toISOString() })}
                eventClick={(info) => {
                    const a = info?.event?.extendedProps;
                    if (!a) return;
                      alert(`Turno #${a.id}
                      Cliente: ${a.customer_name}
                      Servicio: ${a.service_name}
                      Peluquero: ${a.stylist_name}
                      Estado: ${a.status}`);
                }}
                height="auto"
            />
        </div>
    );
}