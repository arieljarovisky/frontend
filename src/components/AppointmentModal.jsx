import { useEffect, useState } from "react";
import { useApp } from "../context/UseApp";

// Helpers -------------------------------
function toLocalDatetimeValue(isoOrLocal) {
  if (!isoOrLocal) return "";
  // Acepta "YYYY-MM-DDTHH:MM(:SS)" o "YYYY-MM-DD HH:MM(:SS)"
  if (typeof isoOrLocal === "string") {
    let s = isoOrLocal.trim().replace(" ", "T");
    // recorto a minutos
    if (s.length >= 16) return s.slice(0, 16);
  }
  const d = new Date(isoOrLocal);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toMySQLFromLocalInput(localValue) {
  if (!localValue) return null;
  const s = localValue.trim(); // ej: "2025-10-20T11:00"
  const normalized = s.includes("T") ? s.replace("T", " ") : s;
  return normalized.length === 16 ? normalized + ":00" : normalized.slice(0, 19);
}

export default function AppointmentModal({ open, onClose, event }) {
  const { services = [], stylists = [], updateAppointment, deleteAppointment } = useApp();
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

    // 1) fecha/hora de inicio en formato MySQL local (sin Z)
    const startsAt = toMySQLFromLocalInput(form.startsLocal);

    // 2) calcular endsAt según duración del servicio seleccionado
    let endsAt = null;
    const srv = (services || []).find(s => String(s.id) === String(form.serviceId));
    if (srv?.duration_min && form.startsLocal) {
      const d = new Date(form.startsLocal); // interpreta local
      d.setMinutes(d.getMinutes() + Number(srv.duration_min));
      const pad = (n)=>String(n).padStart(2,"0");
      endsAt = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
    }

    const payload = {
      // si tu tabla usa customers, acá mandarías customerId; estos dos son decorativos
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      serviceId: Number(form.serviceId),
      stylistId: Number(form.stylistId),
      startsAt,   // "YYYY-MM-DD HH:MM:SS"
      endsAt,     // "YYYY-MM-DD HH:MM:SS" o null si no hay duración
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

  // Estilos inline (sin Tailwind)
  const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 };
  const card = { background: "#fff", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,.15)", width: "100%", maxWidth: 520, padding: 20 };
  const row = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 };
  const input = { width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #d4d4d8" };
  const label = { fontSize: 13, fontWeight: 600, marginBottom: 6 };
  const footer = { display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 };

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div style={card}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Editar turno</h3>
        <div style={{ color: "#52525b", fontSize: 13, marginBottom: 8 }}>
          #{a?.id} • {a?.customer_name || "Cliente"} • {a?.service_name || "Servicio"}
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
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div style={footer}>
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
