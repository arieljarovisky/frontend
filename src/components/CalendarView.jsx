// src/components/CalendarView.jsx — FullCalendar Premium con diseño mejorado
import { useMemo, useRef, useState, useCallback, useEffect, useContext } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
// Locale en español - definido manualmente para evitar problemas de importación
const esLocale = {
  code: "es",
  week: { dow: 1, doy: 4 },
  buttonText: {
    prev: "Ant",
    next: "Sig",
    today: "Hoy",
    year: "Año",
    month: "Mes",
    week: "Semana",
    day: "Día",
    list: "Agenda"
  },
  weekText: "Sm",
  allDayText: "Todo el día",
  moreLinkText: "más",
  noEventsText: "No hay eventos para mostrar",
  monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
  monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
  dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
};
import "../calendar-dark.css"; // Estilos dark del calendario
import "../calendar-light.css"; // Estilos light del calendario
import { 
  Filter, 
  RefreshCw, 
  Calendar,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CalendarRange,
  List,
  Activity
} from "lucide-react";
import AppointmentModal from "./AppointmentModal";
import { AppContext } from "../context/AppProvider";
import { useTheme } from "../context/ThemeContext";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import resourcePlugin from "@fullcalendar/resource";
import apiClient from "../api/client";
import { logger } from "../utils/logger.js";

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
const PALETTE = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#14b8a6", "#e11d48"];

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
   Estadísticas rápidas
========================= */
function QuickStats({ events, instructors }) {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayEvents = events.filter(e => {
      const start = new Date(e.start);
      return start >= today && start < tomorrow && e.extendedProps?.status !== 'cancelled';
    });

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekEvents = events.filter(e => {
      const start = new Date(e.start);
      return start >= weekStart && start < weekEnd && e.extendedProps?.status !== 'cancelled';
    });

    const pendingDeposits = events.filter(e => 
      e.extendedProps?.status === 'pending_deposit'
    );

    return {
      todayCount: todayEvents.length,
      weekCount: weekEvents.length,
      pendingCount: pendingDeposits.length,
      cancelledCount: events.filter(e => e.extendedProps?.status === 'cancelled').length
    };
  }, [events]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-2xl p-4 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <CalendarDays className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-blue-300">Hoy</p>
            <p className="text-2xl font-bold text-blue-100">{stats.todayCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-2xl p-4 border border-purple-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <CalendarRange className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-purple-300">Esta semana</p>
            <p className="text-2xl font-bold text-purple-100">{stats.weekCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-2xl p-4 border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-amber-300">Seña pendiente</p>
            <p className="text-2xl font-bold text-amber-100">{stats.pendingCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-2xl p-4 border border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <EyeOff className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-red-300">Cancelados</p>
            <p className="text-2xl font-bold text-red-100">{stats.cancelledCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================
   Adaptador de eventos
========================= */
function useCalendarEvents(events, instructorColors, useResources = false) {
  return useMemo(
    () =>
      (Array.isArray(events) ? events : []).map((ev) => {
        const type = ev.extendedProps?.eventType || "appointment";
        const st = ev.extendedProps?.status;
        const sid = ev.extendedProps?.instructor_id ?? ev.extendedProps?.instructorId;
        
        // Obtener color del instructor o usar color por defecto
        const instructorColor = instructorColors[sid] || "#6B7280";
        const baseColor = ev.backgroundColor || ev.extendedProps?.color_hex || instructorColor;
        const baseBorder = ev.borderColor || baseColor;

        let bg = baseColor;
        let border = baseBorder;
        let opacity = 1;

        // Ajustes por estado
        if (type !== "class_session") {
          if (st === "pending_deposit") {
            opacity = 0.85;
            border = "#f59e0b"; // Amarillo para pendientes
          }
          if (st === "cancelled") {
            bg = "#475569";
            border = "#64748B";
            opacity = 0.5;
          }
          if (st === "confirmed" || st === "deposit_paid") {
            border = "#10b981"; // Verde para confirmados
          }
        } else if (st === "cancelled") {
          opacity = 0.5;
        }

        // Solo asignar resourceId si estamos usando vista de recursos
        let resourceId = undefined;
        if (useResources) {
          if (sid) {
            resourceId = String(sid);
          } else if (type === "class_session" || type === "appointment") {
            resourceId = "unassigned";
          }
        }

        // Clases CSS según estado
        const classNames = [
          opacity < 1 ? "fc-opacity" : "",
          st === "confirmed" ? "fc-event-confirmed" : "",
          st === "cancelled" ? "fc-event-cancelled" : "",
          st === "pending_deposit" ? "fc-event-pending" : "",
          st === "deposit_paid" ? "fc-event-deposit" : ""
        ].filter(Boolean);

        return {
          ...ev,
          resourceId,
          backgroundColor: bg,
          borderColor: border,
          textColor: "#ffffff",
          classNames,
          // Agregar datos del estado como atributo para CSS
          extendedProps: {
            ...ev.extendedProps,
            'data-status': st
          }
        };
      }),
    [events, instructorColors, useResources]
  );
}

export default function CalendarView() {
  const appCtx = useContext(AppContext);
  const { theme } = useTheme();

  if (!appCtx) {
    return (
      <div className="p-6 text-center text-sm text-foreground-muted">
        Calendario no disponible. Este componente necesita el contexto de la app.
      </div>
    );
  }

  const { events, eventsLoading, eventsError, setRange, loadEvents, instructors } = appCtx;
  const [instructorFilter, setInstructorFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const calendarRef = useRef(null);
  const isMobile = useIsMobile(768);
  const [hideCancelled, setHideCancelled] = useState(false);
  const [currentView, setCurrentView] = useState("resourceTimeGridDay");
  const [showStats, setShowStats] = useState(true);

  const instructorColors = useMemo(() => buildInstructorColorMap(instructors), [instructors]);

  // Calcular rango de horarios dinámicamente basado en los horarios de las sucursales
  const [calendarTimeRange, setCalendarTimeRange] = useState({ min: "08:00:00", max: "19:00:00" });

  useEffect(() => {
    const calculateTimeRange = async () => {
      try {
        // Obtener horarios de los instructores relevantes
        const relevantInstructors = instructorFilter 
          ? instructors.filter(i => String(i.id) === String(instructorFilter))
          : instructors;

        if (relevantInstructors.length === 0) {
          // Si no hay instructores, usar valores por defecto
          setCalendarTimeRange({ min: "08:00:00", max: "19:00:00" });
          return;
        }

        // Obtener horarios de todos los instructores relevantes
        const allWorkingHours = [];
        for (const instructor of relevantInstructors) {
          try {
            const hours = await apiClient.getWorkingHours({ instructorId: instructor.id });
            if (Array.isArray(hours) && hours.length > 0) {
              allWorkingHours.push(...hours);
            }
          } catch (e) {
            logger.warn(`[CalendarView] No se pudieron cargar horarios para instructor ${instructor.id}:`, e);
          }
        }

        if (allWorkingHours.length === 0) {
          // Si no hay horarios, usar valores por defecto
          setCalendarTimeRange({ min: "08:00:00", max: "19:00:00" });
          return;
        }

        // Calcular min y max de todos los horarios
        let minHour = 24;
        let maxHour = 0;

        allWorkingHours.forEach(h => {
          if (h.start_time && h.end_time) {
            const startParts = h.start_time.split(':').map(Number);
            const endParts = h.end_time.split(':').map(Number);
            const startHour = startParts[0] + (startParts[1] || 0) / 60;
            const endHour = endParts[0] + (endParts[1] || 0) / 60;

            if (startHour < minHour) minHour = startHour;
            if (endHour > maxHour) maxHour = endHour;
          }
        });

        // Asegurar valores razonables (mínimo 6:00, máximo 23:00)
        minHour = Math.max(6, Math.floor(minHour));
        maxHour = Math.min(23, Math.ceil(maxHour));

        // Agregar un margen de 1 hora antes y después
        const minTime = `${String(Math.max(0, minHour - 1)).padStart(2, '0')}:00:00`;
        const maxTime = `${String(Math.min(23, maxHour + 1)).padStart(2, '0')}:00:00`;

        logger.log(`[CalendarView] Rango de horarios calculado: ${minTime} - ${maxTime} (basado en ${allWorkingHours.length} horarios)`);
        setCalendarTimeRange({ min: minTime, max: maxTime });
      } catch (e) {
        logger.error("[CalendarView] Error calculando rango de horarios:", e);
        setCalendarTimeRange({ min: "08:00:00", max: "19:00:00" });
      }
    };

    calculateTimeRange();
  }, [instructors, instructorFilter]);

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

  const fullEvents = useCalendarEvents(filtered, instructorColors, currentView === "resourceTimeGridDay");

  // Rango sin desmontar
  const handleDatesSet = useCallback(
    (arg) => {
      const fromIso = arg.startStr;
      const end = new Date(arg.end);
      end.setSeconds(end.getSeconds() - 1);
      setRange({ fromIso, toIso: end.toISOString() });
      // Actualizar la vista actual y ajustar recursos
      if (arg.view) {
        const viewType = arg.view.type;
        setCurrentView(viewType);
        // Activar recursos solo para vista de día con recursos
        if (viewType === "resourceTimeGridDay") {
          arg.view.calendar.setOption("resources", resources);
        } else {
          arg.view.calendar.setOption("resources", null);
        }
      }
    },
    [setRange, resources]
  );

  // Actualizar recursos cuando cambien los instructores o la vista
  useEffect(() => {
    if (calendarRef.current && calendarRef.current.getApi) {
      const calendarApi = calendarRef.current.getApi();
      const currentViewType = calendarApi.view?.type;
      if (currentViewType === "resourceTimeGridDay" && resources.length > 0) {
        calendarApi.setOption("resources", resources);
      }
    }
  }, [resources, currentView]);

  // Cambia vista al redimensionar sin perder estado
  const handleWindowResize = useCallback((arg) => {
    const desired = window.innerWidth < 768 ? "listWeek" : "timeGridWeek";
    if (arg.view.type !== desired) {
      // Si cambiamos de vista de recursos a normal, quitar recursos
      if (arg.view.type.includes("resource") && desired === "timeGridWeek") {
        arg.view.calendar.setOption("resources", false);
      }
      arg.view.calendar.changeView(desired);
    }
  }, []);

  const eventClick = useCallback((info) => {
    const e = info.event;
    const ep = e.extendedProps || {};
    if (ep.status === "cancelled" && !info.jsEvent.ctrlKey && !info.jsEvent.metaKey) return;
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

    const map = buildInstructorColorMap(instructors);
    const rules = Object.entries(map).map(([id, hex]) => {
      const light = hexToRgba(hex, 0.04);
      return `
        .fc-resource-timegrid .fc-col-header-cell[data-resource-id="${id}"] {
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
    
    const isTimeGrid = arg.view.type.includes('timeGrid');
    const isList = arg.view.type.includes('list');
    const isDayGrid = arg.view.type.includes('dayGrid');
    
    // Para vista de lista, mostrar información completa
    if (isList) {
      return (
        <div className="flex flex-col gap-1 p-2 w-full">
          <div className="text-sm font-semibold text-foreground">
            {arg.event.title}
          </div>
          <div className="flex flex-wrap gap-1 items-center">
            {ep.instructor_name && (
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-white"
                style={{
                  backgroundColor: instructorColors[ep.instructor_id] || "#3b82f6",
                }}
              >
                {ep.instructor_name}
              </span>
            )}
            {occupancy && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-indigo-500/20 text-indigo-200 font-medium">
                👥 {occupancy}
              </span>
            )}
            {type !== "class_session" && status === "deposit_paid" && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/20 text-emerald-200 font-medium">
                💰 Seña
              </span>
            )}
            {status === "cancelled" && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-red-500/20 text-red-200 font-medium">
                ❌ Cancelado
              </span>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className={`flex flex-col gap-1 ${isTimeGrid ? 'p-2' : 'p-3'} min-h-[${isTimeGrid ? '60px' : '72px'}] w-full overflow-hidden`}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-semibold leading-snug overflow-hidden text-ellipsis whitespace-nowrap flex-1">
            {arg.event.title}
          </div>
          {status === "confirmed" && (
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shrink-0" title="Confirmado" />
          )}
        </div>
        
        {!isDayGrid && (
          <div className="flex flex-wrap gap-1 items-center">
            {ep.instructor_name && !isList && (
              <span
                className="px-1.5 py-0.5 rounded-md text-[10px] font-medium text-white shadow-sm overflow-hidden text-ellipsis whitespace-nowrap max-w-full"
                style={{
                  backgroundColor: instructorColors[ep.instructor_id] || "#3b82f6",
                  opacity: 0.9,
                }}
              >
                {ep.instructor_name}
              </span>
            )}
            
            {occupancy && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-indigo-500/20 text-indigo-200 font-medium whitespace-nowrap">
                👥 {occupancy}
              </span>
            )}
            
            {type !== "class_session" && status === "deposit_paid" && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-emerald-500/20 text-emerald-200 font-medium whitespace-nowrap">
                💰 Seña
              </span>
            )}
            
            {status === "cancelled" && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-red-500/20 text-red-200 font-medium whitespace-nowrap">
                ❌ Cancelado
              </span>
            )}
          </div>
        )}
      </div>
    );
  }, [instructorColors]);

  // Vista/toolbar responsive mejorada
  const headerToolbar = useMemo(
    () => ({
      left: isMobile ? "prev,next" : "prev,next today", 
      center: "title",
      right: isMobile ? "listWeek,dayGridMonth" : "resourceTimeGridDay,timeGridWeek,dayGridMonth,listWeek"
    }),
    [isMobile]
  );

  // Día en dos líneas (DOW + DD/MM) en week/day/month
  const dayHeaderContent = useCallback((arg) => {
    const d = arg.date;
    const isToday = new Date().toDateString() === d.toDateString();
    const dow = d.toLocaleDateString("es-AR", { weekday: "short" }).toUpperCase();
    const day = d.getDate();
    const month = d.toLocaleDateString("es-AR", { month: "short" });
    
    if (["timeGridWeek", "resourceTimeGridDay"].includes(arg.view.type)) {
      return { 
        html: `
          <div class="fc-day-header-custom ${isToday ? 'fc-day-today' : ''}">
            <div class="fc-day-header-dow">${dow}</div>
            <div class="fc-day-header-date">${day} ${month}</div>
          </div>
        ` 
      };
    }
    
    return undefined;
  }, []);

  // CSS para los headers personalizados
  useEffect(() => {
    const styleId = "calendar-header-styles";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
      .fc-day-header-custom {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 8px 0;
      }
      .fc-day-header-dow {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.8;
      }
      .fc-day-header-date {
        font-size: 1rem;
        font-weight: 700;
      }
      .fc-day-header-custom.fc-day-today {
        position: relative;
      }
      .fc-day-header-custom.fc-day-today .fc-day-header-date {
        color: #3b82f6;
      }
      .fc-day-header-custom.fc-day-today::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 30px;
        height: 3px;
        background: #3b82f6;
        border-radius: 2px;
      }
    `;
    
    return () => { /* cleanup */ };
  }, []);

  return (
    <div className={`${theme === "dark" ? "calendar-dark" : "calendar-light"} relative min-h-screen overflow-hidden`}>
      <div className="relative z-10">
        <div className="bg-background/95 backdrop-blur-xl border border-border rounded-3xl p-6 transition-all duration-500 shadow-2xl">
          {/* Header mejorado */}
          <div className="flex flex-col gap-6 mb-6">
            {/* Título y controles principales */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl">
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                    Calendario General
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    Vista completa de turnos y clases
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="p-2.5 rounded-xl bg-background-secondary border border-border hover:border-primary/30 transition-all"
                  title={showStats ? "Ocultar estadísticas" : "Mostrar estadísticas"}
                >
                  <Activity className="w-4 h-4" />
                </button>
                
                <button
                  onClick={loadEvents}
                  disabled={eventsLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl 
                           bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium
                           hover:from-blue-700 hover:to-purple-700 
                           shadow-lg hover:shadow-xl transform hover:-translate-y-0.5
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${eventsLoading ? "animate-spin" : ""}`} />
                  {eventsLoading ? "Actualizando..." : "Actualizar"}
                </button>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            {showStats && <QuickStats events={events} instructors={instructors} />}

            {/* Filtros y controles */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Filtro estilista mejorado */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted/60 pointer-events-none" />
                <select
                  value={instructorFilter}
                  onChange={(e) => setInstructorFilter(e.target.value)}
                  disabled={Array.isArray(instructors) && instructors.length === 0}
                  className="
                    w-full pl-10 pr-10 py-2.5
                    rounded-xl
                    bg-background-secondary/80 backdrop-blur-sm
                    border border-border
                    text-foreground text-sm
                    placeholder:text-foreground-muted
                    focus:outline-none
                    focus:ring-2 focus:ring-primary/40
                    focus:border-primary
                    focus:bg-background-secondary
                    transition-all duration-200
                    hover:border-border/80
                    disabled:opacity-50 disabled:cursor-not-allowed
                    appearance-none
                    cursor-pointer
                  "
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.5rem center',
                    backgroundSize: '1.5rem'
                  }}
                >
                  <option className="bg-background" value="">
                    {Array.isArray(instructors) && instructors.length > 0
                      ? "Todos los profesionales"
                      : "Sin filtro de profesional"}
                  </option>
                  {(instructors || []).map((s) => (
                    <option key={s.id} className="bg-background" value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle cancelados mejorado */}
              <button
                onClick={() => setHideCancelled(v => !v)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                  border transition-all duration-200 transform hover:scale-[1.02]
                  ${hideCancelled 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" 
                    : "bg-background-secondary/80 border-border text-foreground hover:border-primary/30"}
                `}
                title={hideCancelled ? "Mostrar cancelados" : "Ocultar cancelados"}
              >
                {hideCancelled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {hideCancelled ? "Mostrar cancelados" : "Ocultar cancelados"}
              </button>
            </div>
          </div>

          {/* Errores mejorados */}
          {eventsError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 
                            border border-red-500/20 text-red-400 text-sm backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-red-500/20 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
                {eventsError}
              </div>
            </div>
          )}

          {/* Calendario con diseño premium */}
          <div className="relative rounded-2xl border border-border bg-background-secondary backdrop-blur-sm p-3 overflow-hidden
                          shadow-inner" style={{ backgroundColor: 'var(--fc-surface-bg, #0f1825)' }}>
            {/* Loading overlay mejorado */}
            {eventsLoading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-20 
                              flex items-center justify-center rounded-2xl">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                    <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent 
                                    rounded-full animate-spin" />
                  </div>
                  <p className="text-sm font-medium text-foreground-muted">Cargando eventos...</p>
                </div>
              </div>
            )}
            
            {/* Empty state mejorado */}
            {!eventsLoading && fullEvents.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center 
                              text-center text-sm text-foreground-muted z-10 px-6">
                <div className="bg-background-secondary/80 backdrop-blur-sm rounded-2xl p-8 
                                border border-border shadow-xl">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 
                                  rounded-2xl flex items-center justify-center">
                    <Calendar className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="font-semibold text-base mb-2">No hay eventos en este rango</p>
                  <p className="text-xs text-foreground-muted/70">
                    Programá una nueva clase o turno para que aparezca acá.
                  </p>
                </div>
              </div>
            )}

            <div className="w-full min-w-0 overflow-hidden rounded-xl bg-background-secondary">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, resourceTimeGridPlugin, resourcePlugin]}
                locale={esLocale}
                headerToolbar={headerToolbar}
                initialView={isMobile ? "listWeek" : "resourceTimeGridDay"}
                windowResize={handleWindowResize}
                resources={isMobile ? null : resources}
                resourceGroupField="title"
                buttonText={{ 
                  today: "Hoy", 
                  month: "Mes", 
                  week: "Semana", 
                  day: "Día", 
                  list: "Agenda" 
                }}
                dayHeaderContent={dayHeaderContent}
                allDaySlot={false}
                slotMinTime={calendarTimeRange.min}
                slotMaxTime={calendarTimeRange.max}
                slotDuration="00:30:00"
                slotLabelFormat={{
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                }}
                expandRows={false}
                stickyHeaderDates
                nowIndicator={!isMobile}
                navLinks={!isMobile}
                height="auto"
                contentHeight={isMobile ? 400 : 550}
                aspectRatio={isMobile ? 0.95 : 2.0}
                datesSet={handleDatesSet}
                viewDidMount={(arg) => {
                  // Ajustar recursos cuando cambia la vista
                  const viewType = arg.view.type;
                  setCurrentView(viewType);
                  if (viewType === "resourceTimeGridDay") {
                    // Asegurar que los recursos se actualicen
                    arg.view.calendar.setOption("resources", resources);
                  } else {
                    arg.view.calendar.setOption("resources", null);
                  }
                }}
                events={fullEvents}
                eventClick={eventClick}
                eventContent={eventContent}
                eventDidMount={(info) => {
                  try {
                    // Aplicar altura mínima según la vista
                    info.el.style.minHeight = info.view.type.includes('timeGrid') ? "60px" : "72px";
                    
                    // Aplicar data-status para CSS
                    const status = info.event.extendedProps?.status;
                    if (status) {
                      info.el.setAttribute('data-status', status);
                    }
                    
                    // Asegurar que el color de fondo se aplique correctamente en vista mes
                    if (info.view.type === 'dayGridMonth' && info.event.backgroundColor) {
                      info.el.style.backgroundColor = info.event.backgroundColor;
                      info.el.style.borderColor = info.event.borderColor || info.event.backgroundColor;
                    }
                    
                    // Añadir tooltip
                    const ep = info.event.extendedProps;
                    if (ep.customer_name || ep.service_name) {
                      info.el.title = `${ep.customer_name || 'Cliente'} - ${ep.service_name || 'Servicio'}`;
                    }
                  } catch {}
                }}
                dayMaxEvents={isMobile ? 2 : 3}
                displayEventTime={true}
                eventClassNames="fc-event-modern"
                moreLinkClick={(arg) => {
                  // Mejorar el popover
                  setTimeout(() => {
                    document.querySelectorAll(".fc-popover").forEach((el) => {
                      el.classList.add("fc-popover-modern");
                      el.style.maxHeight = "70vh";
                      el.style.overflow = "hidden";
                      const body = el.querySelector(".fc-popover-body");
                      if (body) {
                        body.style.maxHeight = "60vh";
                        body.style.overflow = "auto";
                      }
                    });
                  }, 0);
                  return "popover";
                }}
                moreLinkText={(n) => `+${n} más`}
                // Personalización adicional de vistas
                views={{
                  dayGridMonth: {
                    dayMaxEventRows: 3,
                    fixedWeekCount: false
                  },
                  timeGridWeek: {
                    dayHeaderFormat: { weekday: 'short', day: 'numeric' }
                  },
                  listWeek: {
                    listDayFormat: { weekday: 'long', month: 'long', day: 'numeric' },
                    listDaySideFormat: false
                  }
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