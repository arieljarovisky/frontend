// src/components/BookingWidget.jsx
import { useMemo } from "react";
import { useApp } from "../context/UseApp"; // ojo con el casing en Windows
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

function Section({ title, children, right }) {
  return (
    <section className="bg-white/90 rounded-2xl shadow p-4 md:p-6 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h2>
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
    // meta
    services = [], stylists = [], metaLoading, metaError,
    // booking + availability
    booking, updateBooking, availability, loadAvailability,
    bookingSave, createAppointment,
  } = useApp();

  const selectedService = useMemo(
    () => (Array.isArray(services) ? services : []).find(s => String(s.id) === String(booking.serviceId)),
    [services, booking.serviceId]
  );
  const selectedStylist = useMemo(
    () => (Array.isArray(stylists) ? stylists : []).find(s => String(s.id) === String(booking.stylistId)),
    [stylists, booking.stylistId]
  );

  // React Hook Form para “Tus datos”
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      customerName: booking.customerName || "",
      customerPhone: booking.customerPhone || "",
    },
  });

  const onSubmit = async (data) => {
    // guardamos en el contexto para que createAppointment use esos valores
    updateBooking(data);
    try {
      await createAppointment();
      toast.success("¡Turno confirmado!");
    } catch {
      toast.error("No pudimos confirmar el turno");
    }
  };

  return (
    <div className="bg-white/90 rounded-2xl shadow p-4 md:p-6 mb-4">
      <header className="mb-4">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">Reservá tu turno ✂️</h1>
        <p className="text-gray-600 mt-1 text-sm">
          Elegí servicio, peluquero, fecha y horario disponible. Luego confirmás con tu nombre y teléfono.
        </p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
          <span className="px-2 py-1 rounded-lg bg-gray-100">1 Servicio</span>
          <span className="px-2 py-1 rounded-lg bg-gray-100">2 Fecha</span>
          <span className="px-2 py-1 rounded-lg bg-gray-100">3 Horario</span>
          <span className="px-2 py-1 rounded-lg bg-gray-100">4 Datos</span>
        </div>
      </header>

      <div aria-live="polite">
        {(metaError || bookingSave.error || availability.error) && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            {metaError || bookingSave.error || availability.error}
          </div>
        )}
      </div>

      {/* 1) Servicio */}
      <Section title="1) Servicio" right={metaLoading ? <span className="text-xs text-gray-500">cargando...</span> : null}>
        <div className="grid md:grid-cols-2 gap-3">
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
      <Section title="2) Fecha">
        <div className="flex items-center gap-3">
          <DatePicker value={booking.date} onChange={(v) => updateBooking({ date: v })} />
          <Button
            onClick={loadAvailability}
            disabled={!booking.serviceId || !booking.stylistId || !booking.date}
            className="bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
          >
            Buscar horarios
          </Button>
        </div>
        <div className="mt-3 text-sm text-gray-500">
          Tip: la disponibilidad depende del servicio (duración) y del peluquero/a.
        </div>
      </Section>

      {/* 3) Horarios */}
      <Section
        title="3) Horarios disponibles"
        right={availability.loading ? <span className="text-xs text-gray-500">buscando...</span> : null}
      >
        <SlotGrid
          slots={availability.slots}
          loading={availability.loading}
          selected={booking.selectedSlot}
          onSelect={(iso) => updateBooking({ selectedSlot: iso })}
        />
      </Section>

      {/* 4) Datos + Confirmación */}
      <Section title="4) Tus datos">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Field label="Nombre (opcional)" error={errors.customerName?.message}>
            <input
              {...register("customerName")}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </Field>
          <Field label="Teléfono (WhatsApp)" hint="Ej: +54911..." error={errors.customerPhone?.message}>
            <input
              {...register("customerPhone")}
              inputMode="tel"
              placeholder="+54911..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </Field>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={
                bookingSave.saving ||
                !booking.selectedSlot ||
                !booking.serviceId ||
                !booking.stylistId
              }
            >
              {bookingSave.saving ? "Reservando..." : "Confirmar turno"}
            </Button>
            {bookingSave.ok && (
              <span className="text-green-700 text-sm">¡Listo! Te va a llegar confirmación por WhatsApp 📲</span>
            )}
          </div>
        </form>
      </Section>

      {(selectedService || selectedStylist) && (
        <div className="text-xs text-gray-500 mt-2">
          {selectedService && (
            <span className="mr-3">
              Servicio: <b>{selectedService.name}</b> ({selectedService.duration_min}min)
            </span>
          )}
          {selectedStylist && (
            <span>• Peluquero/a: <b>{selectedStylist.name}</b></span>
          )}
        </div>
      )}
    </div>
  );
}
