import { useEffect, useState } from "react";
import { useApp } from "../context/UseApp";

function toLocalDatetimeValue(isoOrLocal) {
  if (!isoOrLocal) return "";
  if (typeof isoOrLocal === "string") {
    let s = isoOrLocal.trim().replace(" ", "T");
    if (s.length >= 16) return s.slice(0, 16);
  }
  const d = new Date(isoOrLocal);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toMySQLFromLocalInput(localValue) {
  if (!localValue) return null;
  const s = localValue.trim();
  const normalized = s.includes("T") ? s.replace("T", " ") : s;
  return normalized.length === 16 ? normalized + ":00" : normalized.slice(0, 19);
}

export default function AppointmentModal({ open, onClose, event }) {
  const { services = [], stylists = [], updateAppointment, deleteAppointment, createAppointment } = useApp();
  const a = event?.extendedProps || {};

  const [form, setForm] = useState({
    customerName: a.customer_name || "",
    customerPhone: a.phone_e164 || a.customer_phone || "",
    serviceId: a.service_id || a.serviceId || "",
    stylistId: a.stylist_id || a.stylistId || "",
    startsLocal: toLocalDatetimeValue(event?.start || a.starts_at || a.startsAt),
    status: a.status || "scheduled",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const _a = event?.extendedProps || {};
    setForm({
      customerName: _a.customer_name || "",
      customerPhone: _a.phone_e164 || _a.customer_phone || "",
      serviceId: _a.service_id || _a.serviceId || "",
      stylistId: _a.stylist_id || _a.stylistId || "",
      startsLocal: toLocalDatetimeValue(event?.start || _a.starts_at || _a.startsAt),
      status: _a.status || "scheduled",
    });
    setError("");
    setSaving(false);
  }, [open, event]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onSave = async () => {
    setSaving(true); setError("");

    const startsAt = toMySQLFromLocalInput(form.startsLocal);

    let endsAt = null;
    const srv = (services || []).find(s => String(s.id) === String(form.serviceId));
    if (srv?.duration_min && form.startsLocal) {
      const d = new Date(form.startsLocal);
      d.setMinutes(d.getMinutes() + Number(srv.duration_min));
      const pad = (n) => String(n).padStart(2, "0");
      endsAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    }

    const payload = {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      serviceId: Number(form.serviceId),
      stylistId: Number(form.stylistId),
      startsAt,
      endsAt,
      status: form.status,
    };

    const res = await updateAppointment(event.id, payload);
    setSaving(false);
    if (!res.ok) return setError(res.error || "No se pudo guardar");
    onClose?.(true);
  };

  const onDelete = async () => {
    if (!confirm("¿Eliminar este turno?")) return;
    setSaving(true); setError("");
    const res = await deleteAppointment(event.id);
    setSaving(false);
    if (!res.ok) return setError(res.error || "No se pudo eliminar");
    onClose?.(true);
  };

  if (!open) return null;

  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 };
  const card = { background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.15)", width: "100%", maxWidth: 520, padding: 20 };
  const row = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 };
  const input = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d4d4d8" };
  const label = { fontSize: 13, fontWeight: 600, marginBottom: 6 };
  const footer = { display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 };

  // Datos Mercado Pago (si el backend los embebe en extendedProps del evento)
  const mpPaymentId = a.mp_payment_id || a.mp_paymentId || a.payment_id || null;
  const mpStatus = a.mp_payment_status || a.payment_status || null;
  const depositRequired = a.deposit_required || a.requires_deposit || false;
  const depositAmount = a.deposit_amount || null;

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div style={card}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Editar turno</h3>
        <div style={{ color: "#52525b", fontSize: 13, marginBottom: 8 }}>
          #{a?.id} • {a?.customer_name || "Cliente"} • {a?.service_name || "Servicio"}
        </div>

        {/* Badges de seña / MP */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {depositRequired ? (
            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
              Requiere seña{depositAmount ? ` ($${Number(depositAmount)})` : ""}
            </span>
          ) : null}
          {mpPaymentId ? (
            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, background: "#EFF6FF", color: "#1E40AF", border: "1px solid #BFDBFE" }}>
              MP ID: {mpPaymentId}
            </span>
          ) : null}
          {mpStatus ? (
            <span style={{ fontSize: 12, padding: "4px 8px", borderRadius: 8, background: "#ECFDF5", color: "#065F46", border: "1px solid #A7F3D0" }}>
              Estado MP: {mpStatus}
            </span>
          ) : null}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 8, padding: 10, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={row}>
          <div>
            <div style={label}>Cliente</div>
            <input style={input} value={form.customerName} onChange={onChange("customerName")} placeholder="Nombre" />
          </div>
          <div>
            <div style={label}>WhatsApp</div>
            <input style={input} value={form.customerPhone} onChange={onChange("customerPhone")} placeholder="+54911..." />
          </div>
        </div>

        <div style={row}>
          <div>
            <div style={label}>Servicio</div>
            <select style={input} value={form.serviceId} onChange={onChange("serviceId")}>
              <option value="" disabled>Seleccioná…</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div style={label}>Peluquero/a</div>
            <select style={input} value={form.stylistId} onChange={onChange("stylistId")}>
              <option value="" disabled>Seleccioná…</option>
              {stylists.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div style={row}>
          <div>
            <div style={label}>Fecha y hora</div>
            <input type="datetime-local" style={input} value={form.startsLocal} onChange={onChange("startsLocal")} />
          </div>
          <div>
            <div style={label}>Estado</div>
            <select style={input} value={form.status} onChange={onChange("status")}>
              <option value="scheduled">Programado</option>
              <option value="pending_deposit">Seña pendiente</option>
              <option value="confirmed">Confirmado</option>
              <option value="deposit_paid">Seña pagada</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div style={footer}>
          <button
            onClick={async () => {
              if (!event?.id) return;
              if (!confirm("Esto avisará al cliente y liberará el turno actual (se marcará como Cancelado). ¿Continuar?")) {
                return;
              }
              try {
                const r = await fetch("/api/whatsapp/reprogram", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ appointmentId: event.id, autoCancel: true }),
                });
                const data = await r.json();
                if (data.ok) {
                  alert("📱 Mensaje enviado y turno cancelado.");
                  onClose?.(true); // 👈 cierra y notifica que hubo cambios para refrescar
                } else {
                  alert("Error: " + (data.error || "No se pudo enviar el mensaje"));
                }
              } catch (e) {
                alert("Error al enviar mensaje: " + e.message);
              }
            }}
            style={{
              ...input,
              background: "#F9FAFB",
              borderColor: "#E5E7EB",
              color: "#374151",
            }}
          >
            📅 Reprogramar y liberar
          </button>
          {event?.extendedProps?.status === "cancelled" && (
            <button
              onClick={async () => {
                const ep = event.extendedProps || {};
                try {
                  // Datos base
                  const payload = {
                    customerName: ep.customer_name,
                    customerPhone: ep.phone_e164,
                    stylistId: ep.stylist_id ?? ep.stylistId,
                    serviceId: ep.service_id ?? ep.serviceId,
                    startsAt: event.startStr,                 // ISO → el back lo normaliza
                    durationMin: ep.duration_min ?? null,     // si no viene, el back usa la del servicio
                    status: ep.deposit_required ? "pending_deposit" : "confirmed",
                    depositDecimal: ep.deposit_required ? Number(ep.deposit_amount ?? ep.deposit_decimal ?? 0) : 0,
                  };

                  const data = await createAppointment(payload);
                  if (!data?.ok) throw new Error(data?.error || "No se pudo crear el nuevo turno");

                  alert("✅ Turno re-agendado en el mismo horario");
                  onClose?.(true); // refresca calendario
                } catch (e) {
                  alert("Error: " + e.message);
                }
              }}
              className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 text-sm"
            >
              🔁 Reagendar en este horario
            </button>
          )}
          <button onClick={onDelete} disabled={saving} style={{ ...input, background: "#fff", borderColor: "#fca5a5", color: "#991b1b" }}>
            Eliminar
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onClose?.()} disabled={saving} style={{ ...input, background: "#fff" }}>
              Cancelar
            </button>
            <button onClick={onSave} disabled={saving} style={{ ...input, background: "#000", color: "#fff", borderColor: "#000" }}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
