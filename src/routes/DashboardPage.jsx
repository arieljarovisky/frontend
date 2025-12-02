// src/routes/DashboardPage.jsx
import React from "react";
import { useQuery } from "../shared/useQuery.js";
import { apiClient } from "../api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { logger } from "../utils/logger.js";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus
} from "lucide-react";

// Chart.js
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Drag and Drop
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

function StatCard({ title, value, subtitle, icon: Icon, trend, color = "primary" }) {
  const colorClasses = {
    primary: "stat-chip--primary",
    success: "stat-chip--success",
    warning: "stat-chip--warning",
    danger: "stat-chip--danger",
  };

  return (
    <div className="card card--space-lg">
      <div className="stat-card__header">
        <div className={`stat-chip ${colorClasses[color]}`}>
          <Icon />
        </div>
        {trend && (
          <div className={`stat-trend ${trend < 0 ? "stat-trend--down" : "stat-trend--up"}`}>
            <TrendingUp className={trend < 0 ? "stat-trend__icon--down" : "stat-trend__icon"} />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="stat-card__subtitle">{title}</p>
        <p className="stat-card__value">{value}</p>
        {subtitle && <p className="stat-card__footnote">{subtitle}</p>}
      </div>
    </div>
  );
}

function Section({ title, children, action }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="section-header">{title}</h2>
        {action}
      </div>
      <div className="card card--space-lg card--no-hover" style={{ minWidth: 0, overflow: 'visible' }}>
        {children}
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  scheduled: { label: "Programado", color: "bg-primary-600/20 text-primary-400 border-primary-600/30" },
  pending_deposit: { label: "Seña pendiente", color: "bg-amber-600/20 text-amber-400 border-amber-600/30" },
  deposit_paid: { label: "Seña pagada", color: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" },
  confirmed: { label: "Confirmado", color: "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" },
  completed: { label: "Completado", color: "bg-primary-600/20 text-primary-400 border-primary-600/30" },
  cancelled: { label: "Cancelado", color: "bg-background-secondary text-foreground-secondary border-border" },
};

// Componente de turno arrastrable
function SortableAppointmentItem({ item }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.scheduled;
  const time = formatArgentinaTime(item.starts_at);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-2 rounded-lg border border-border bg-background-secondary hover:bg-border cursor-move transition-colors mb-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-foreground truncate">{item.customer_name}</div>
          <div className="text-xs text-foreground-secondary truncate">{item.service_name}</div>
        </div>
        <div className="ml-2 flex flex-col items-end">
          <span className="text-xs font-medium text-foreground">{time}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.color} mt-1`}>
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}

// Componente de slot droppable
function DroppableSlot({ slot, children }) {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`border border-border rounded-lg p-3 bg-background-secondary min-h-[80px] transition-colors ${
        isOver ? 'bg-primary/10 border-primary/50' : ''
      }`}
    >
      {children}
    </div>
  );
}

const asArray = (v) => Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : [];

const getMonthName = (monthNumber) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const num = parseInt(monthNumber, 10);
  return months[num - 1] || monthNumber;
};

// Funciones para manejar hora argentina (UTC-3)
const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

// Convertir fecha ISO a hora argentina
const toArgentinaTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  // Obtener la fecha en hora argentina
  return new Date(date.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
};

// Obtener fecha/hora actual en hora argentina
const getArgentinaNow = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: ARGENTINA_TIMEZONE }));
};

// Crear fecha en hora argentina con hora específica
const createArgentinaDate = (year, month, day, hour = 0, minute = 0) => {
  // Crear fecha en UTC y luego convertir a hora argentina
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  const localDate = new Date(dateStr);
  // Calcular offset de Argentina (UTC-3)
  const offset = -3 * 60; // -3 horas en minutos
  const utc = localDate.getTime() + (localDate.getTimezoneOffset() * 60000);
  return new Date(utc + (offset * 60000));
};

// Formatear hora en hora argentina
const formatArgentinaTime = (dateString, options = { hour: '2-digit', minute: '2-digit' }) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-AR', { ...options, timeZone: ARGENTINA_TIMEZONE });
};

// Obtener hora y minutos en hora argentina
const getArgentinaHoursMinutes = (dateString) => {
  if (!dateString) return { hour: 0, minute: 0 };
  const date = new Date(dateString);
  // Obtener componentes en hora argentina usando Intl
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: ARGENTINA_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find(p => p.type === 'hour').value, 10);
  const minute = parseInt(parts.find(p => p.type === 'minute').value, 10);
  return { hour, minute };
};

// Crear ISO string desde hora argentina
const createISOFromArgentinaTime = (year, month, day, hour, minute) => {
  // Crear fecha en hora argentina (UTC-3)
  // Formato: YYYY-MM-DDTHH:mm:ss-03:00
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00-03:00`;
  return dateStr;
};

const money = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n)
    : "—";

const ymd = (d) => {
  const pad = (x) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const startOfWeek = (base = new Date()) => {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay() || 7;
  d.setDate(d.getDate() - (dow - 1));
  return d;
};

const endOfWeek = (base = new Date()) => {
  const s = startOfWeek(base), e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  
  const { data: topServices, loading: loadingSvc, error: errorSvc } =
    useQuery(() => apiClient.getTopServices({ months: 3, limit: 6 }), []);

  const { data: raw, loading: loadingM, error: errorM } =
    useQuery(() => apiClient.getAdminDashboard({}), []);
  const dashboard = raw?.data ?? raw ?? {};

  const from = ymd(startOfWeek());
  const to = ymd(endOfWeek());
  const { data: rawWeek, error: errorWeek } =
    useQuery(() => apiClient.getAdminDashboard({ from, to }), [from, to]);
  const week = rawWeek?.data ?? rawWeek ?? {};

  const year = getArgentinaNow().getFullYear();
  const { data: income, loading: loadingInc, error: errorInc } =
    useQuery(() => apiClient.getIncomeByMonth(year), [year]);
  const incomeArr = React.useMemo(() => {
    const arr = asArray(income);
    return arr.map(d => ({
      month: String(d.month ?? d.mm ?? d.m ?? "").padStart(2, "0"),
      income: Number(d.income ?? d.total ?? 0),
    })).filter(d => d.month); // Filtrar elementos sin mes válido
  }, [income]);

  const topServicesArr = React.useMemo(() => {
    const arr = asArray(topServices);
    return arr.map(d => ({
      service_name: String(d.service_name ?? d.name ?? "").trim(),
      count: Number(d.count ?? d.qty ?? 0),
    })).filter(d => d.service_name && d.count > 0); // Filtrar servicios vacíos o sin count
  }, [topServices]);


  // Debug: Log errores si existen
  if (errorInc) console.error("[Dashboard] Error cargando ingresos:", errorInc);
  if (errorSvc) console.error("[Dashboard] Error cargando servicios top:", errorSvc);
  if (errorM) console.error("[Dashboard] Error cargando dashboard:", errorM);
  if (errorWeek) console.error("[Dashboard] Error cargando semana:", errorWeek);
  
  // Debug: Log datos recibidos
  React.useEffect(() => {
    if (!loadingInc && income) {
      console.log("[Dashboard] Datos de ingresos recibidos:", income);
      console.log("[Dashboard] Array procesado de ingresos:", incomeArr);
      console.log("[Dashboard] ¿Tiene datos válidos?", incomeArr.length > 0);
      console.log("[Dashboard] ¿Renderizará gráfico?", incomeArr.length > 0 && !errorInc);
      console.log("[Dashboard] Estado de carga:", { loadingInc, errorInc, hasData: incomeArr.length > 0 });
    }
  }, [loadingInc, income, incomeArr, errorInc]);

  React.useEffect(() => {
    if (!loadingSvc && topServices) {
      console.log("[Dashboard] Datos de servicios recibidos:", topServices);
      console.log("[Dashboard] Array procesado de servicios:", topServicesArr);
      console.log("[Dashboard] ¿Tiene datos válidos?", topServicesArr.length > 0);
      console.log("[Dashboard] ¿Renderizará gráfico?", topServicesArr.length > 0 && !errorSvc);
      console.log("[Dashboard] Estado de carga servicios:", { loadingSvc, errorSvc, hasData: topServicesArr.length > 0 });
    }
  }, [loadingSvc, topServices, topServicesArr, errorSvc]);




  const { data: agenda, loading: loadingAgenda } =
    useQuery(() => apiClient.getAgendaToday(), []);
  const agendaArr = asArray(agenda);
  
  // Drag and Drop para agenda
  const [activeId, setActiveId] = React.useState(null);
  const [agendaItems, setAgendaItems] = React.useState([]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    setAgendaItems(agendaArr);
  }, [agendaArr]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedItem = agendaItems.find(item => item.id === active.id);
    if (!draggedItem) return;

    // Si se soltó sobre otro turno, intercambiar posiciones
    if (over.id !== active.id && agendaItems.find(item => item.id === over.id)) {
      const oldIndex = agendaItems.findIndex(item => item.id === active.id);
      const newIndex = agendaItems.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(agendaItems, oldIndex, newIndex);
        setAgendaItems(newItems);
        
        // Intercambiar horas (mantener la fecha de hoy en hora argentina)
        const targetItem = agendaItems[newIndex];
        const today = getArgentinaNow();
        const oldTime = getArgentinaHoursMinutes(draggedItem.starts_at);
        const newTime = getArgentinaHoursMinutes(targetItem.starts_at);
        
        // Crear nuevas fechas en hora argentina
        const oldDateISO = createISOFromArgentinaTime(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate(),
          newTime.hour,
          newTime.minute
        );
        const newDateISO = createISOFromArgentinaTime(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate(),
          oldTime.hour,
          oldTime.minute
        );
        
        try {
          await Promise.all([
            apiClient.updateAppointment(draggedItem.id, {
              startsAt: oldDateISO
            }),
            apiClient.updateAppointment(targetItem.id, {
              startsAt: newDateISO
            })
          ]);
          
          toast.success("Turnos actualizados correctamente");
        } catch (error) {
          toast.error("Error al actualizar los turnos");
          logger.error(error);
          // Revertir cambios locales
          setAgendaItems(agendaArr);
        }
      }
      return;
    }

    // Si se soltó sobre un slot de hora (formato "slot-XX:XX")
    if (String(over.id).startsWith('slot-')) {
      const slotTime = String(over.id).replace('slot-', '');
      const [hours, minutes] = slotTime.split(':');
      
      try {
        // Obtener la fecha actual en hora argentina
        const today = getArgentinaNow();
        const oldDate = toArgentinaTime(draggedItem.starts_at);
        
        // Crear nueva fecha en hora argentina con la hora del slot
        const newDateISO = createISOFromArgentinaTime(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate(),
          parseInt(hours),
          parseInt(minutes)
        );
        
        await apiClient.updateAppointment(draggedItem.id, {
          startsAt: newDateISO
        });
        
        // Actualizar localmente
        const updatedItems = agendaItems.map(item => 
          item.id === draggedItem.id 
            ? { ...item, starts_at: newDateISO }
            : item
        );
        setAgendaItems(updatedItems);
        
        toast.success("Turno actualizado correctamente");
      } catch (error) {
        toast.error("Error al actualizar el turno");
        logger.error(error);
      }
    }
  };

  // Organizar turnos por slots de hora (en hora argentina)
  const organizeByTimeSlots = () => {
    const slots = Array.from({ length: 24 }, (_, i) => {
      const hour = Math.floor(i / 2) + 8;
      const minute = (i % 2) * 30;
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      return { 
        time, 
        id: `slot-${time}`,
        items: [] 
      };
    });

    agendaItems.forEach(item => {
      // Obtener hora en hora argentina
      const { hour, minute } = getArgentinaHoursMinutes(item.starts_at);
      const slotIndex = (hour - 8) * 2 + Math.floor(minute / 30);
      
      if (slotIndex >= 0 && slotIndex < 24) {
        slots[slotIndex].items.push(item);
      }
    });

    return slots;
  };

  const todayTotal = dashboard?.today?.total ?? 0;
  const todayConfirmed = dashboard?.today?.confirmed ?? 0;
  const todayPending = dashboard?.today?.pending ?? 0;
  const incomeWeek = week?.deposits?.rangeAmount ?? 0;


  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-foreground-secondary">
            Resumen de actividad y métricas en tiempo real
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Turnos hoy"
          value={todayTotal}
          subtitle="Todos los estados"
          icon={Calendar}
          color="primary"
        />
        <StatCard
          title="Confirmados"
          value={todayConfirmed}
          subtitle="Pagos completados"
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          title="Pendientes"
          value={todayPending}
          subtitle="Requieren atención"
          icon={AlertCircle}
          color="warning"
        />
        <StatCard
          title="Ingresos Semana"
          value={money(incomeWeek)}
          subtitle="Señas cobradas"
          icon={DollarSign}
          color="success"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Income Chart */}
        <div className="lg:col-span-3">
          <Section title={`Ingresos ${year}`}>
            {loadingInc ? (
              <div className="w-full h-[280px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : errorInc ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  Error al cargar los datos de ingresos
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  {typeof errorInc === 'string' ? errorInc : errorInc?.message || "Intenta recargar la página"}
                </p>
              </div>
            ) : !incomeArr || incomeArr.length === 0 ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <DollarSign className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  No hay datos de ingresos para mostrar
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  Los ingresos aparecerán cuando tengas turnos completados
                </p>
              </div>
            ) : (
              <div 
                className="w-full" 
                style={{ height: '280px', position: 'relative', minWidth: '300px', width: '100%' }}
              >
                <Line
                  data={{
                    labels: incomeArr.map(d => getMonthName(d.month)),
                    datasets: [
                      {
                        label: 'Ingresos',
                        data: incomeArr.map(d => d.income),
                        borderColor: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#0ea5e9',
                        pointBorderColor: '#0ea5e9',
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                        labels: {
                          color: '#a1a1aa',
                          font: {
                            size: 12
                          }
                        }
                      },
                      tooltip: {
                        backgroundColor: '#27272a',
                        borderColor: '#3f3f46',
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        titleColor: '#fafafa',
                        bodyColor: '#fafafa',
                        callbacks: {
                          label: function(context) {
                            return `Ingresos: ${money(context.parsed.y)}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          color: '#a1a1aa',
                          font: {
                            size: 12
                          }
                        },
                        grid: {
                          color: 'rgba(63, 63, 70, 0.3)',
                          borderDash: [3, 3]
                        }
                      },
                      y: {
                        ticks: {
                          color: '#a1a1aa',
                          font: {
                            size: 12
                          },
                          callback: function(value) {
                            return `$${value.toLocaleString('es-AR')}`;
                          }
                        },
                        grid: {
                          color: 'rgba(63, 63, 70, 0.3)',
                          borderDash: [3, 3]
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </Section>
        </div>

        {/* Top Services Chart */}
        <div className="lg:col-span-2">
          <Section title="Servicios Top">
            {loadingSvc ? (
              <div className="w-full h-[280px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              </div>
            ) : errorSvc ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <AlertCircle className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  Error al cargar los servicios más solicitados
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  {typeof errorSvc === 'string' ? errorSvc : errorSvc?.message || "Intenta recargar la página"}
                </p>
              </div>
            ) : !topServicesArr || topServicesArr.length === 0 ? (
              <div className="w-full h-[280px] flex flex-col items-center justify-center text-center p-6">
                <Users className="w-12 h-12 text-foreground-muted mb-3" />
                <p className="text-foreground-secondary text-sm">
                  No hay datos de servicios para mostrar
                </p>
                <p className="text-foreground-muted text-xs mt-1">
                  Los servicios aparecerán cuando tengas turnos programados
                </p>
              </div>
            ) : (
              <div 
                className="w-full" 
                style={{ height: '280px', position: 'relative', minWidth: '200px', width: '100%' }}
              >
                <Bar
                  data={{
                    labels: topServicesArr.map(d => d.service_name),
                    datasets: [
                      {
                        label: 'Turnos',
                        data: topServicesArr.map(d => d.count),
                        backgroundColor: (context) => {
                          const ctx = context.chart.ctx;
                          const gradient = ctx.createLinearGradient(0, 0, 0, 280);
                          gradient.addColorStop(0, '#60a5fa');
                          gradient.addColorStop(1, '#a78bfa');
                          return gradient;
                        },
                        borderRadius: 12,
                        borderSkipped: false,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        backgroundColor: '#18181b',
                        borderColor: '#3f3f46',
                        borderWidth: 1,
                        borderRadius: 12,
                        padding: 12,
                        titleColor: '#fafafa',
                        bodyColor: '#fafafa',
                        callbacks: {
                          label: function(context) {
                            const value = context.parsed.y;
                            return `${value} turno${value !== 1 ? 's' : ''}`;
                          }
                        }
                      }
                    },
                    scales: {
                      x: {
                        ticks: {
                          color: '#a1a1aa',
                          font: {
                            size: 11
                          },
                          maxRotation: 12,
                          minRotation: 12
                        },
                        grid: {
                          display: false
                        }
                      },
                      y: {
                        ticks: {
                          color: '#a1a1aa',
                          font: {
                            size: 12
                          }
                        },
                        grid: {
                          color: 'rgba(63, 63, 70, 0.25)',
                          borderDash: [3, 3]
                        }
                      }
                    }
                  }}
                />
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Today's Agenda - Calendario */}
      <Section
        title="Agenda de Hoy"
        action={
          <span className="text-sm text-foreground-secondary">
            {agendaArr.length} turnos programados
          </span>
        }
      >
        {loadingAgenda ? (
          <div className="py-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : agendaArr.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-3 text-foreground-muted" />
            <p className="text-foreground-secondary">No hay turnos programados para hoy</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={agendaItems.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                {organizeByTimeSlots().map((slot, slotIndex) => {
                  const hasAppointments = slot.items.length > 0;
                  return (
                    <DroppableSlot key={slot.time} slot={slot}>
                      <div className="text-xs font-semibold text-foreground-secondary mb-2 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {slot.time}
                      </div>
                      <div className="space-y-1">
                        {slot.items.map((item) => (
                          <SortableAppointmentItem key={item.id} item={item} />
                        ))}
                        {!hasAppointments && (
                          <div className="text-xs text-foreground-muted italic py-2">
                            Libre
                          </div>
                        )}
                      </div>
                    </DroppableSlot>
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (
                <div className="p-2 rounded-lg border border-primary bg-background-secondary shadow-lg">
                  {(() => {
                    const item = agendaItems.find(i => i.id === activeId);
                    if (!item) return null;
                    const config = STATUS_CONFIG[item.status] || STATUS_CONFIG.scheduled;
                    const time = formatArgentinaTime(item.starts_at);
                    return (
                      <>
                        <div className="text-xs font-medium text-foreground">{item.customer_name}</div>
                        <div className="text-xs text-foreground-secondary">{item.service_name}</div>
                        <div className="text-xs text-foreground-muted mt-1">{time}</div>
                      </>
                    );
                  })()}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </Section>
    </div>
  );
}