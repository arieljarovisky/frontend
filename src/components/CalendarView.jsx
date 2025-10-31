// src/components/CalendarView.jsx — FullCalendar, moderno y fluido (responsive)
import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import esLocale from "@fullcalendar/core/locales/es";
import { Filter, RefreshCw } from "lucide-react";
import AppointmentModal from "./AppointmentModal";
import { useApp } from "../context/UseApp";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import resourcePlugin from "@fullcalendar/resource";

/* =========================
   Helpers Responsive
========================= */
function useIsMobile(bp = 768) {
  const get = () => (typeof window !== "undefined" ? window.innerWidth < bp : false);
  const [isMobile, setIsMobile] = useState(get);
  useEffect(() => {
    const onResize = () => setIsMobile(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [bp]);
  return isMobile;
}

/* =========================
   Colores por estilista
========================= */
const PALETTE = ["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#06B6D4", "#A855F7", "#84CC16", "#F97316", "#22C55E", "#E11D48"];
const colorByIndex = (i) => PALETTE[i % PALETTE.length];

function hexToRgba(hex, alpha = 0.08) {
  const h = hex.replace("#", "").trim();
  const bigint = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function buildStylistColorMap(stylists) {
  const map = {};
  (stylists || []).forEach((s, idx) => {
    map[s.id] = s.color_hex?.trim() || colorByIndex(idx);
  });
  return map;
}

/* =========================
   Adaptador de eventos
========================= */
function useCalendarEvents(events, stylistColors) {
  return useMemo(
    () =>
      (Array.isArray(events) ? events : []).map((ev) => {
        const st = ev.extendedProps?.status;
        const sid = ev.extendedProps?.stylist_id ?? ev.extendedProps?.stylistId;
        const base = ev.extendedProps?.color_hex || stylistColors[sid] || "#6B7280";

        let bg = base, border = base, opacity = 1;
        if (st === "pending_deposit") opacity = 0.85;
        if (st === "cancelled") { bg = "#475569"; border = "#64748B"; opacity = 0.6; }

        return {
          ...ev,
          // ➜ clave para que el evento caiga en la columna del peluquero
          resourceId: sid ? String(sid) : undefined,
          backgroundColor: bg,
          borderColor: border,
          textColor: "#fff",
          classNames: opacity < 1 ? ["fc-opacity"] : [],
        };
      }),
    [events, stylistColors]
  );
}

export default function CalendarView() {
  const { events, eventsLoading, eventsError, setRange, loadEvents, stylists } = useApp();
  const [stylistFilter, setStylistFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const calendarRef = useRef(null);
  const isMobile = useIsMobile(768);
  const [hideCancelled, setHideCancelled] = useState(false);

  const stylistColors = useMemo(() => buildStylistColorMap(stylists), [stylists]);
  const filtered = useMemo(() => {
    let list = Array.isArray(events) ? events : [];
    if (stylistFilter) {
      list = list.filter(
        (ev) => String(ev?.extendedProps?.stylist_id ?? ev?.extendedProps?.stylistId) === String(stylistFilter)
      );
    }
    if (hideCancelled) {
      list = list.filter((ev) => (ev?.extendedProps?.status || "") !== "cancelled");
    }
    return list;
  }, [events, stylistFilter, hideCancelled]);
  const fullEvents = useCalendarEvents(filtered, stylistColors);

  // Rango sin desmontar
  const handleDatesSet = useCallback(
    (arg) => {
      const fromIso = arg.startStr;
      const end = new Date(arg.end);
      end.setSeconds(end.getSeconds() - 1);
      setRange({ fromIso, toIso: end.toISOString() });
    },
    [setRange]
  );

  // Cambia vista al redimensionar sin perder estado
  const handleWindowResize = useCallback((arg) => {
    const desired = window.innerWidth < 768 ? "listWeek" : "timeGridWeek";
    if (arg.view.type !== desired) arg.view.calendar.changeView(desired);
  }, []);

  const eventClick = useCallback((info) => {
    const e = info.event;
    const ep = e.extendedProps || {};
    if (ep.status === "cancelled") return;
    setSelectedEvent({
      id: e.id,
      title: e.title,
      start: e.start ? new Date(e.start).toISOString() : null,
      end: e.end ? new Date(e.end).toISOString() : null,
      extendedProps: ep,
    });
    setModalOpen(true);
  }, []);
  useEffect(() => {
    const elId = "stylist-colors";
    let styleEl = document.getElementById(elId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = elId;
      document.head.appendChild(styleEl);
    }

    // armamos mapa id->color
    const map = buildStylistColorMap(stylists);
    const rules = Object.entries(map).map(([id, hex]) => {
      const light = hexToRgba(hex, 0.07); // intensidad del fondo
      // Header y cuerpo de la columna del resource (peluquero)
      return `
      /* header de la columna */
      .fc-resource-timegrid .fc-col-header-cell[data-resource-id="${id}"] {
        background: ${light};
      }
      /* celdas del grid (cuerpo) */
      .fc-resource-timegrid .fc-timegrid-col[data-resource-id="${id}"] {
        background: ${light};
      }
    `;
    }).join("\n");

    styleEl.textContent = rules;
    return () => { /* si querés limpiar en unmount, podés borrar styleEl */ };
  }, [stylists]);

  // Render elegante del evento
  const eventContent = useCallback((arg) => {
    const ep = arg.event.extendedProps || {};
    const status = ep.status;
    return (
      <div className="flex flex-col gap-1 p-1">
        <div className="text-xs font-semibold leading-tight line-clamp-1">{arg.event.title}</div>
        <div className="flex flex-wrap gap-1">
          {ep.stylist_name && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{
                backgroundColor: stylistColors[ep.stylist_id] || "#475569",
                opacity: 0.9,
              }}
            >
              {ep.stylist_name}
            </span>
          )}
          {status === "pending_deposit" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/25 text-amber-200">Seña pendiente</span>
          )}
          {status === "deposit_paid" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/25 text-emerald-200">Seña pagada</span>
          )}
          {status === "cancelled" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-500/25 text-slate-300">Cancelado</span>
          )}
        </div>
      </div>
    );
  }, []);

  // Vista/toolbar responsive
  const headerToolbar = useMemo(
    () => isMobile
      ? { left: "prev,next today", center: "title", right: "" }
      : { left: "prev,next today", center: "title", right: "resourceTimeGridDay,resourceTimeGridWeek,dayGridMonth,listWeek" },
    [isMobile]
  );
  // Día en dos líneas (DOW + DD/MM) en week/day/month
  const dayHeaderContent = useCallback((arg) => {
    if (["timeGridWeek", "dayGridWeek", "dayGridMonth"].includes(arg.view.type)) {
      const d = arg.date;
      const dow = d.toLocaleDateString("es-AR", { weekday: "short" }).toUpperCase(); // LUN
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      return { html: `<span>${dow}</span><span style="opacity:.75;font-weight:600">${dd}/${mm}</span>` };
    }
    return undefined;
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 animate-gradient-x" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="bg-slate-900/60 backdrop-blur-2xl border border-indigo-500/10 shadow-2xl rounded-3xl p-6 transition-all duration-500 hover:border-indigo-400/30 hover:shadow-indigo-500/20">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
                📅 Calendario de Turnos
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro estilista */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={stylistFilter}
                  onChange={(e) => setStylistFilter(e.target.value)}
                  className="
                    relative w-full pl-10 pr-4 py-2.5
                    rounded-xl
                    bg-slate-900/60
                    border border-slate-700/40
                    text-slate-200 text-sm
                    backdrop-blur-md
                    placeholder-slate-500
                    focus:outline-none
                    focus:ring-2 focus:ring-indigo-500/30
                    focus:border-indigo-500/30
                    transition-all duration-200
                    hover:border-slate-500/50
                  "
                >
                  <option className="bg-slate-900" value="">
                    Todos los estilistas
                  </option>
                  {(stylists || []).map((s) => (
                    <option key={s.id} className="bg-slate-900" value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refrescar */}
              <button
                onClick={loadEvents}
                disabled={eventsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                           bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white text-sm font-medium
                           hover:scale-[1.02] shadow-lg shadow-indigo-500/20 transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`} />
                Actualizar
              </button>
              <button
                onClick={() => setHideCancelled(v => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                border ${hideCancelled ? "bg-slate-800/80 border-slate-600 text-slate-100" : "bg-slate-900/60 border-slate-700/40 text-slate-200"}
                hover:scale-[1.01]`}
                title={hideCancelled ? "Mostrar cancelados" : "Ocultar cancelados"}
              >
                {hideCancelled ? "Mostrar cancelados" : "Ocultar cancelados"}
              </button>
            </div>
          </div>

          {/* Errores */}
          {eventsError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {eventsError}
            </div>
          )}

          {/* Calendario + overlay */}
          <div className="relative rounded-2xl border border-slate-800/30 bg-slate-900/30 p-2 overflow-visible">
            {eventsLoading && (
              <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
                <div className="animate-pulse text-slate-300 font-medium">Actualizando calendario…</div>
              </div>
            )}

            <div className="calendar-dark w-full min-w-0 overflow-visible rounded-2xl">
              <FullCalendar
                ref={calendarRef}
                licenseKey="GPL-My-Project-Is-Open-Source"
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, resourceTimeGridPlugin, resourcePlugin]}
                locale={esLocale}
                headerToolbar={headerToolbar}
                initialView="resourceTimeGridDay"
                windowResize={handleWindowResize}
                resources={(stylists || []).map((s, idx) => ({
                  id: String(s.id),
                  title: s.name,
                  color_hex: s.color_hex?.trim() || colorByIndex(idx),
                }))}
                buttonText={{ today: "Hoy", month: "Mes", week: "Semana", day: "Día", list: "Agenda" }}
                dayHeaderContent={dayHeaderContent}
                allDaySlot={false}
                slotMinTime="10:00:00"
                slotMaxTime="21:00:00"
                slotDuration="00:15:00"
                slotLabelFormat={{               // 24h y con minutos
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                }}
                expandRows
                stickyHeaderDates
                nowIndicator={!isMobile}
                navLinks={!isMobile}
                height="auto"
                contentHeight="auto"
                aspectRatio={isMobile ? 0.95 : 1.1}
                datesSet={handleDatesSet}
                events={fullEvents}
                eventClick={eventClick}
                eventContent={eventContent}
                dayMaxEvents={isMobile ? 2 : 3}
                displayEventTime={true}
                eventClassNames="rounded-xl shadow-md border-0"
                moreLinkClick={(arg) => {
                  // deja el comportamiento de popover
                  setTimeout(() => {
                    document.querySelectorAll(".fc-popover").forEach((el) => {
                      el.style.maxHeight = "70vh";
                      el.style.overflow = "hidden";
                      const body = el.querySelector(".fc-popover-body");
                      if (body) {
                        body.style.maxHeight = "100vh";
                        body.style.overflow = "auto";
                      }
                    });
                  }, 0);
                  return "popover";
                }}
              />
            </div>
          </div>

          {/* Modal */}
          <AppointmentModal
            open={modalOpen}
            event={selectedEvent}
            onClose={() => {
              setModalOpen(false);
              setSelectedEvent(null);
            }}
          />
        </div>
      </div>
    </div>
  );
}
