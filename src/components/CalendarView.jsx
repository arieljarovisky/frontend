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

function buildInstructorColorMap(instructors) {
  const map = {};
  (instructors || []).forEach((s, idx) => {
    map[s.id] = s.color_hex?.trim() || colorByIndex(idx);
  });
  return map;
}

/* =========================
   Adaptador de eventos
========================= */
function useCalendarEvents(events, instructorColors) {
  return useMemo(
    () =>
      (Array.isArray(events) ? events : []).map((ev) => {
        const type = ev.extendedProps?.eventType || "appointment";
        const st = ev.extendedProps?.status;
        const sid = ev.extendedProps?.instructor_id ?? ev.extendedProps?.instructorId;
        const baseColor = ev.backgroundColor || ev.extendedProps?.color_hex || instructorColors[sid] || "#6B7280";
        const baseBorder = ev.borderColor || baseColor;

        let bg = baseColor;
        let border = baseBorder;
        let opacity = 1;

        if (type !== "class_session") {
          if (st === "pending_deposit") opacity = 0.85;
          if (st === "cancelled") {
            bg = "#475569";
            border = "#64748B";
            opacity = 0.6;
          }
        } else if (st === "cancelled") {
          opacity = 0.7;
        }

        let resourceId = undefined;
        if (sid) {
          resourceId = String(sid);
        } else if (type === "class_session" || type === "appointment") {
          resourceId = "unassigned";
        }

        return {
          ...ev,
          resourceId,
          backgroundColor: bg,
          borderColor: border,
          textColor: "#fff",
          classNames: opacity < 1 ? ["fc-opacity"] : [],
        };
      }),
    [events, instructorColors]
  );
}

export default function CalendarView() {
  const { events, eventsLoading, eventsError, setRange, loadEvents, instructors } = useApp();
  const [instructorFilter, setInstructorFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const calendarRef = useRef(null);
  const isMobile = useIsMobile(768);
  const [hideCancelled, setHideCancelled] = useState(false);

  const instructorColors = useMemo(() => buildInstructorColorMap(instructors), [instructors]);

  const resources = useMemo(() => {
    const map = new Map();
    (instructors || []).forEach((s, idx) => {
      map.set(String(s.id), {
        id: String(s.id),
        title: s.name,
        color_hex: s.color_hex?.trim() || colorByIndex(idx),
      });
    });

    let needsUnassigned = false;
    (events || []).forEach((ev) => {
      const ep = ev.extendedProps || {};
      const sid = ep.instructor_id ?? ep.instructorId;
      if (!sid) needsUnassigned = true;
    });

    if (needsUnassigned) {
      map.set("unassigned", { id: "unassigned", title: "Sin asignar", color_hex: "#6B7280" });
    }

    if (map.size === 0) {
      map.set("unassigned", { id: "unassigned", title: "Sin asignar", color_hex: "#6B7280" });
    }

    return Array.from(map.values());
  }, [instructors, events]);
  const filtered = useMemo(() => {
    let list = Array.isArray(events) ? events : [];
    if (instructorFilter) {
      list = list.filter(
        (ev) => String(ev?.extendedProps?.instructor_id ?? ev?.extendedProps?.instructorId) === String(instructorFilter)
      );
    }
    if (hideCancelled) {
      list = list.filter((ev) => (ev?.extendedProps?.status || "") !== "cancelled");
    }
    return list;
  }, [events, instructorFilter, hideCancelled]);
  const fullEvents = useCalendarEvents(filtered, instructorColors);

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
    const elId = "instructor-colors";
    let styleEl = document.getElementById(elId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = elId;
      document.head.appendChild(styleEl);
    }

    // armamos mapa id->color
    const map = buildInstructorColorMap(instructors);
    const rules = Object.entries(map).map(([id, hex]) => {
      const light = hexToRgba(hex, 0.07); // intensidad del fondo
      // Header y cuerpo de la columna del resource (instructor)
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
  }, [instructors]);

  // Render elegante del evento
  const eventContent = useCallback((arg) => {
    const ep = arg.event.extendedProps || {};
    const type = ep.eventType || "appointment";
    const status = ep.status;
    const occupancy =
      type === "class_session" && ep.enrolled_count != null && ep.capacity_max != null
        ? `${ep.enrolled_count}/${ep.capacity_max}`
        : null;
    return (
      <div className="flex flex-col gap-1 p-1">
        <div className="text-xs font-semibold leading-tight line-clamp-1">{arg.event.title}</div>
        <div className="flex flex-wrap gap-1">
          {ep.instructor_name && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{
                backgroundColor: instructorColors[ep.instructor_id] || "#0959c9ff",
                opacity: 0.9,
              }}
            >
              {ep.instructor_name}
            </span>
          )}
          {occupancy && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[rgba(106,142,184,0.18)] text-accent">
              {occupancy} alumnos
            </span>
          )}
          {type !== "class_session" && status === "pending_deposit" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-100">Seña pendiente</span>
          )}
          {type !== "class_session" && status === "deposit_paid" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-100">Seña pagada</span>
          )}
          {status === "cancelled" && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-[rgba(154,160,166,0.2)] text-accent">Cancelado</span>
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
      return { html: `<span>${dow}<span style="opacity:.75;font-weight:600"></span>` };
    }
    return undefined;
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#060d18] via-[#0c1726] to-[#132b45]" />
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="bg-[rgba(12,24,38,0.78)] backdrop-blur-2xl border border-[rgba(79,108,152,0.25)] shadow-[0_30px_60px_rgba(4,10,18,0.45)] rounded-3xl p-6 transition-all duration-500 hover:border-[rgba(106,142,184,0.35)] hover:shadow-[0_40px_70px_rgba(6,16,28,0.55)]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#6A8EB8]">
                📅 Calendario general
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro estilista */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/80" />
                <select
                  value={instructorFilter}
                  onChange={(e) => setInstructorFilter(e.target.value)}
                  disabled={Array.isArray(instructors) && instructors.length === 0}
                  className="
                    relative w-full pl-10 pr-4 py-2.5
                    rounded-xl
                    bg-[rgba(15,35,59,0.35)]
                    border border-[rgba(106,142,184,0.3)]
                    text-foreground text-sm
                    backdrop-blur-md
                    placeholder:text-foreground-muted
                    focus:outline-none
                    focus:ring-2 focus:ring-[rgba(106,142,184,0.5)]
                    focus:border-[rgba(79,108,152,0.6)]
                    transition-all duration-200
                    hover:border-[rgba(106,142,184,0.6)]
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <option className="bg-[rgba(8,17,32,0.95)]" value="">
                    {Array.isArray(instructors) && instructors.length > 0
                      ? "Todos los profesionales"
                      : "Sin filtro de profesional"}
                  </option>
                  {(instructors || []).map((s) => (
                    <option key={s.id} className="bg-[rgba(8,17,32,0.95)]" value={s.id}>
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
                           bg-gradient-to-r from-primary to-[#6A8EB8] text-white text-sm font-medium
                           hover:scale-[1.02] shadow-lg shadow-[rgba(15,35,59,0.35)] transition-all duration-300 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`} />
                Actualizar
              </button>
              <button
                onClick={() => setHideCancelled(v => !v)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all
                border ${hideCancelled ? "bg-[rgba(15,35,59,0.55)] border-[rgba(79,108,152,0.5)] text-white" : "bg-[rgba(12,24,38,0.35)] border-[rgba(79,108,152,0.35)] text-foreground"}
                hover:scale-[1.01]`}
                title={hideCancelled ? "Mostrar cancelados" : "Ocultar cancelados"}
              >
                {hideCancelled ? "Mostrar cancelados" : "Ocultar cancelados"}
              </button>
            </div>
          </div>

          {/* Errores */}
          {eventsError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm">
              {eventsError}
            </div>
          )}

          {/* Calendario + overlay */}
          <div className="relative rounded-2xl border border-[rgba(79,108,152,0.25)] bg-[rgba(10,20,32,0.6)] p-2 overflow-visible">
            {eventsLoading && (
              <div className="absolute inset-0 bg-[rgba(8,17,32,0.65)] backdrop-blur-sm flex items-center justify-center rounded-2xl z-20">
                <div className="animate-pulse text-foreground-muted font-medium">Actualizando calendario…</div>
              </div>
            )}
            {!eventsLoading && fullEvents.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[rgba(106,142,184,0.35)] bg-[rgba(10,20,32,0.65)] text-center text-sm text-foreground-muted z-10 px-6">
                <p>No hay eventos en este rango.</p>
                <p className="text-xs text-foreground-muted/70">
                  Programá una nueva clase o turno para que aparezca acá.
                </p>
              </div>
            )}

            <div className="calendar-dark w-full min-w-0 overflow-visible rounded-2xl">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, resourceTimeGridPlugin, resourcePlugin]}
                locale={esLocale}
                headerToolbar={headerToolbar}
                initialView="resourceTimeGridDay"
                windowResize={handleWindowResize}
                resources={resources}
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

