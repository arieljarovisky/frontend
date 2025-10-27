// CalendarView.jsx (versión corregida)
import { useMemo, useRef, useState, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { useApp } from "../context/UseApp";
import AppointmentModal from "./AppointmentModal";

// paleta fallback (si el estilista no trae color_hex)
const PALETTE = ["#6366F1", "#F59E0B", "#10B981", "#EF4444", "#06B6D4", "#A855F7", "#84CC16", "#F97316", "#22C55E", "#E11D48"];
const colorByIndex = (i) => PALETTE[i % PALETTE.length];

// helper: arma mapa id->color
function buildStylistColorMap(stylists) {
  const map = {};
  (stylists || []).forEach((s, idx) => {
    map[s.id] = s.color_hex?.trim() || colorByIndex(idx);
  });
  return map;
}

export default function CalendarView() {
  const { events, eventsLoading, eventsError, setRange, loadEvents, stylists } = useApp();
  const [stylistFilter, setStylistFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // evita loops con datesSet
  const lastRangeRef = useRef({ fromIso: "", toIso: "" });
  const onDatesSet = useCallback(
    (arg) => {
      const fromIso = new Date(arg.start).toISOString();
      const toIso = new Date(arg.end).toISOString();
      if (fromIso === lastRangeRef.current.fromIso && toIso === lastRangeRef.current.toIso) return;
      lastRangeRef.current = { fromIso, toIso };
      setRange({ fromIso, toIso });
    },
    [setRange]
  );

  const stylistColors = useMemo(() => buildStylistColorMap(stylists), [stylists]);

  const filteredEvents = useMemo(() => {
    const list = Array.isArray(events) ? events : [];
    if (!stylistFilter) return list;
    return list.filter(
      (ev) => String(ev?.extendedProps?.stylist_id ?? ev?.extendedProps?.stylistId) === String(stylistFilter)
    );
  }, [events, stylistFilter]);

  // aplica color del peluquero + estilo por estado
  const styledEvents = useMemo(() => {
    return (filteredEvents || []).map((ev) => {
      const st = ev.extendedProps?.status || "";
      const sid = ev.extendedProps?.stylist_id ?? ev.extendedProps?.stylistId;
      const base = ev.extendedProps?.color_hex || stylistColors[sid] || "#A1A1AA";

      // default
      let backgroundColor = base;
      let borderLeft = `4px solid ${base}`;
      let textColor = "#111827";
      let opacity = 1;
      let textDecoration = "none";
      let pattern = null; // para pending

      if (st === "pending_deposit") {
        opacity = 0.85;
        pattern =
          "repeating-linear-gradient(45deg, rgba(255,255,255,.25) 0, rgba(255,255,255,.25) 4px, transparent 4px, transparent 8px)";
      } else if (st === "cancelled") {
        backgroundColor = "#F3F4F6";
        borderLeft = "4px solid #D1D5DB";
        textColor = "#9CA3AF";
        opacity = 0.6;
        textDecoration = "line-through";
      } else if (st === "completed") {
        opacity = 0.9;
      }

      return {
        ...ev,
        backgroundColor,
        borderColor: "#00000020",
        textColor,
        extendedProps: {
          ...ev.extendedProps,
          style: { opacity, textDecoration, borderLeft, pattern },
          stylistColor: base,
        },
      };
    });
  }, [filteredEvents, stylistColors]);

  return (
    <div className="bg-white/90 rounded-2xl shadow p-4 md:p-6">
      {/* Leyenda y filtros */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">Calendario</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Peluquero/a:</label>
          <select
            value={stylistFilter}
            onChange={(e) => setStylistFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm"
            title="Filtrar por peluquero"
          >
            <option value="">Todos</option>
            {(stylists || []).map((s) => (
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

      {/* Mini-leyenda de colores */}
      <div className="flex flex-wrap gap-2 mb-3">
        {(stylists || []).map((s) => (
          <span key={s.id} className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: "#E5E7EB" }}>
            <span
              className="inline-block w-3 h-3 rounded-sm mr-2"
              style={{ background: s.color_hex?.trim() || stylistColors[s.id] || "#A1A1AA" }}
            />
            {s.name}
          </span>
        ))}
      </div>

      {eventsLoading && <div className="text-xs text-gray-500 mb-2">actualizando…</div>}
      {eventsError && (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">{eventsError}</div>
      )}

      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        locales={[esLocale]}
        locale="es"
        initialView="timeGridWeek"
        headerToolbar={{ left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek,timeGridDay" }}
        height="auto"
        events={styledEvents}
        datesSet={onDatesSet}
        slotDuration="00:10:00"       // más granular
        slotLabelInterval="01:00"     // etiquetas cada hora
        slotMinTime="09:00:00"
        slotMaxTime="21:00:00"
        eventMinHeight={28}
        nowIndicator
        eventOrder={["extendedProps.stylist_id", "start"]}  // 👈 forma recomendada
        eventTimeFormat={{ hour: "2-digit", minute: "2-digit" }}
        eventClick={(info) => {
          if (info.event.extendedProps?.status === "cancelled") return;
          setSelectedEvent(info.event);
          setModalOpen(true);
        }}
        // Render rico: barra de color + chips
        eventContent={(arg) => {
          const ep = arg.event.extendedProps || {};
          const style = ep.style || {};
          const stylistName = ep.stylist_name || "";
          const status = ep.status;

          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                padding: "6px 8px",
                opacity: style.opacity || 1,
                textDecoration: style.textDecoration || "none",
                backgroundImage: style.pattern || "none",
                borderLeft: style.borderLeft || undefined,
                borderRadius: 8,
                boxShadow: "0 1px 0 rgba(0,0,0,.12)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.1,
                }}
                title={arg.event.title}
              >
                {arg.timeText && <b>{arg.timeText} • </b>}
                {arg.event.title}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {stylistName && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: (ep.stylistColor || "#999") + "1A",
                      border: `1px solid ${(ep.stylistColor || "#999")}55`,
                    }}
                  >
                    {stylistName}
                  </span>
                )}
                {status === "pending_deposit" && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "#FEF3C7",
                      border: "1px solid #FDE68A",
                    }}
                  >
                    seña pendiente
                  </span>
                )}
                {status === "deposit_paid" && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "#DCFCE7",
                      border: "1px solid #A7F3D0",
                    }}
                  >
                    seña pagada
                  </span>
                )}
                {status === "cancelled" && (
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 999,
                      background: "#F3F4F6",
                      border: "1px solid #E5E7EB",
                    }}
                  >
                    cancelado
                  </span>
                )}
              </div>
            </div>
          );
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
