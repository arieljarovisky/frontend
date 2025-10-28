// src/components/BookingWidget.jsx - Versión mejorada modo oscuro
import { useMemo, useEffect, useRef } from "react";
import { useApp } from "../context/UseApp";
import ServiceSelect from "./ServiceSelect";
import StylistSelect from "./StylistSelect";
import DatePicker from "./DatePicker";
import SlotGrid from "./SlotGrid";
import Button from "./ui/Button";
import { Field } from "./ui/Field";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, User, Phone, CheckCircle2, Scissors } from "lucide-react";

function Section({ title, children, right, icon: Icon }) {
  return (
    <section className="bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-800/50 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-indigo-400" />}
          {title}
        </h2>
        {right}
      </div>
      {children}
    </section>
  );
}

const schema = z.object({
  customerName: z.string().max(60).optional(),
  customerPhone: z
    .string()
    .regex(/^\+\d{10,15}$/, "Usá formato internacional, ej. +54911..."),
});

export default function BookingWidget() {
  const {
    services = [],
    stylists = [],
    metaLoading,
    metaError,
    booking,
    updateBooking,
    availability,
    loadAvailability,
    bookingSave,
    createAppointment,
  } = useApp();

  const selectedService = useMemo(
    () => (Array.isArray(services) ? services : []).find((s) => String(s.id) === String(booking.serviceId)),
    [services, booking.serviceId]
  );
  
  const selectedStylist = useMemo(
    () => (Array.isArray(stylists) ? stylists : []).find((s) => String(s.id) === String(booking.stylistId)),
    [stylists, booking.stylistId]
  );

  const lastSuccessRef = useRef(false);
  const lastErrorRef = useRef("");

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: booking.customerName || "",
      customerPhone: booking.customerPhone || "",
    },
  });

  useEffect(() => {
    if (bookingSave.ok && !lastSuccessRef.current) {
      lastSuccessRef.current = true;
      toast.success("¡Turno confirmado! 🎉", {
        description: "Te va a llegar la confirmación por WhatsApp",
      });
      reset({
        customerName: "",
        customerPhone: "",
      });
      updateBooking({
        selectedSlot: "",
        customerName: "",
        customerPhone: "",
      });
    }
    if (!bookingSave.ok && lastSuccessRef.current) {
      lastSuccessRef.current = false;
    }
  }, [bookingSave.ok, reset, updateBooking]);

  useEffect(() => {
    if (bookingSave.error && bookingSave.error !== lastErrorRef.current) {
      lastErrorRef.current = bookingSave.error;
      toast.error(bookingSave.error);
    }
    if (!bookingSave.error) {
      lastErrorRef.current = "";
    }
  }, [bookingSave.error]);

  const onSubmit = async (data) => {
    updateBooking({
      customerName: data.customerName || "",
      customerPhone: data.customerPhone,
    });

    try {
      await createAppointment({
        customerName: data.customerName || "",
        customerPhone: data.customerPhone,
      });
    } catch (error) {
      console.error("❌ Error:", error);
    }
  };

  // Calcular progreso
  const progress = useMemo(() => {
    let completed = 0;
    if (booking.serviceId) completed++;
    if (booking.date) completed++;
    if (booking.selectedSlot) completed++;
    return (completed / 3) * 100;
  }, [booking.serviceId, booking.date, booking.selectedSlot]);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-800/50 p-6 mb-6">
      <header className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Scissors className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              Reservá tu turno
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Seguí los pasos para confirmar tu turno en minutos
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Indicadores de pasos */}
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <StepBadge completed={!!booking.serviceId} label="Servicio" number={1} />
          <StepBadge completed={!!booking.date} label="Fecha" number={2} />
          <StepBadge completed={!!booking.selectedSlot} label="Horario" number={3} />
          <StepBadge completed={false} label="Confirmación" number={4} />
        </div>
      </header>

      {/* Errores */}
      <div aria-live="polite">
        {(metaError || availability.error) && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 p-4 text-sm flex items-start gap-3">
            <div className="text-lg">⚠️</div>
            <div>{metaError || availability.error}</div>
          </div>
        )}
      </div>

      {/* 1) Servicio */}
      <Section 
        title="Paso 1: Elegí tu servicio" 
        icon={Scissors}
        right={metaLoading ? <span className="text-xs text-slate-500">cargando...</span> : null}
      >
        <div className="grid md:grid-cols-2 gap-4">
          <ServiceSelect 
            services={services} 
            value={booking.serviceId} 
            onChange={(v) => updateBooking({ serviceId: v })} 
          />
          <StylistSelect 
            stylists={stylists} 
            value={booking.stylistId} 
            onChange={(v) => updateBooking({ stylistId: v })} 
          />
        </div>
      </Section>

      {/* 2) Fecha */}
      <Section title="Paso 2: Seleccioná la fecha" icon={Calendar}>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <DatePicker 
            value={booking.date} 
            onChange={(v) => updateBooking({ date: v })} 
          />
          <Button
            onClick={loadAvailability}
            disabled={!booking.serviceId || !booking.stylistId || !booking.date || availability.loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:opacity-50"
          >
            {availability.loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Buscando...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Buscar horarios
              </>
            )}
          </Button>
        </div>
        <div className="mt-3 px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-400">
          💡 La disponibilidad depende del servicio seleccionado y del estilista elegido
        </div>
      </Section>

      {/* 3) Horarios */}
      <Section
        title="Paso 3: Elegí tu horario"
        icon={Clock}
        right={availability.loading ? (
          <span className="text-xs text-indigo-400 flex items-center gap-2">
            <div className="animate-spin h-3 w-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full" />
            buscando...
          </span>
        ) : null}
      >
        <SlotGrid
          slots={availability.slots}
          busySlots={availability.busySlots}
          loading={availability.loading}
          selected={booking.selectedSlot}
          onSelect={(iso) => updateBooking({ selectedSlot: iso })}
        />
      </Section>

      {/* 4) Datos + Confirmación */}
      <Section title="Paso 4: Confirmá tus datos" icon={User}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Nombre (opcional)" error={errors.customerName?.message}>
            <input
              {...register("customerName")}
              placeholder="Juan Pérez"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
          </Field>
          
          <Field 
            label="Teléfono (WhatsApp)" 
            hint="Formato: +54911..." 
            error={errors.customerPhone?.message}
          >
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                {...register("customerPhone")}
                inputMode="tel"
                placeholder="+54911..."
                className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 pl-11 pr-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>
          </Field>

          <Button
            type="submit"
            disabled={bookingSave.saving || !booking.selectedSlot || !booking.serviceId || !booking.stylistId}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white font-semibold py-4 text-base shadow-lg"
          >
            {bookingSave.saving ? (
              <>
                <div className="animate-spin mr-2 h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                Reservando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Confirmar turno
              </>
            )}
          </Button>
        </form>
      </Section>

      {/* Resumen */}
      {(selectedService || selectedStylist) && (
        <div className="mt-4 px-4 py-3 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-2">Resumen de tu reserva:</div>
          <div className="flex flex-wrap gap-4 text-sm">
            {selectedService && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Servicio:</span>
                <span className="font-semibold text-slate-200">{selectedService.name}</span>
                <span className="text-slate-500">• {selectedService.duration_min}min</span>
              </div>
            )}
            {selectedStylist && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Estilista:</span>
                <span className="font-semibold text-slate-200">{selectedStylist.name}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para badges de pasos
function StepBadge({ completed, label, number }) {
  return (
    <div
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
        ${completed 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'bg-slate-800/50 text-slate-400 border border-slate-700/50'
        }
      `}
    >
      <span className={`
        inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold
        ${completed ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400'}
      `}>
        {completed ? '✓' : number}
      </span>
      {label}
    </div>
  );
}