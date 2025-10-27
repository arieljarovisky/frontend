import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/UseApp";

/* ===== Helpers fecha ===== */
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

/* ===== Estilos inline mínimos ===== */
const overlay = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60
};
const card = { width: 620, maxWidth: "95vw", background: "#fff", borderRadius: 16, padding: 16 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
const input = {
  width: "100%", padding: "8px 10px", borderRadius: 10,
  border: "1px solid #e5e7eb", fontSize: 14
};
const label = { fontSize: 12, fontWeight: 600, marginBottom: 6, color: "#374151" };
const footer = { display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 };
const badge = (bg, border, color) => ({
  fontSize: 12, padding: "4px 8px", borderRadius: 999, background: bg, color, border: `1px solid ${border}`
});
const button = (variant = "solid") => ({
  borderRadius: 10,
  padding: "10px 12px",
  border: "1px solid #000",
  background: variant === "solid" ? "#000" : "#fff",
  color: variant === "solid" ? "#fff" : "#000",
  fontWeight: 600,
  cursor: "pointer"
});
const row = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };

/* ===== Subcomponente: Formulario de pago ===== */
function PayForm({ visible, defaultAmount, method, onConfirm, onCancel, disabled }) {
  const [amount, setAmount] = useState(defaultAmount ?? "");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (visible) {
      setAmount(defaultAmount ?? "");
      setLocalError("");
    }
  }, [visible, defaultAmount]);

  if (!visible) return null;

  const methodLabel = method === "cash" ? "Efectivo" : "Débito/Tarjeta";

  const submit = async () => {
    setLocalError("");
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      setLocalError("Ingresá un importe válido mayor a 0.");
      return;
    }
    await onConfirm({ method, amount: n });
  };

  return (
    <div style={{
      marginTop: 10, border: "1px solid #e5e7eb", borderRadius: 12, padding: 12,
      background: "#fafafa"
    }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Registrar pago ({methodLabel})</div>
      <div style={grid}>
        <div>
          <div style={label}>Importe (ARS)</div>
          <input
            style={input}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            disabled={disabled}
          />
        </div>
        <div>
          <div style={label}>Notas (opcional)</div>
          <input
            style={input}
            placeholder={method === "cash" ? "Pago en efectivo" : "Pago presencial con tarjeta"}
            value={method === "cash" ? "Pago en efectivo" : "Pago presencial con débito/tarjeta"}
            readOnly
          />
        </div>
      </div>
      {localError && (
        <div style={{
          marginTop: 10, color: "#991b1b", background: "#FEF2F2",
          border: "1px solid #FECACA", padding: 8, borderRadius: 8
        }}>
          {localError}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={button("outline")} onClick={onCancel} disabled={disabled}>Cancelar</button>
        <button style={button("solid")} onClick={submit} disabled={disabled}>Confirmar pago</button>
      </div>
    </div>
  );
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
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  /* NUEVO: estado para formulario de pago */
  const [payUI, setPayUI] = useState({ visible: false, method: null });

  /* ===== Mapea props → form cuando se abre ===== */
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
    setMsg("");
    setError("");
    setSaving(false);
    setPayUI({ visible: false, method: null });
  }, [open, event]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /* ===== Duración por servicio para calcular endsAt ===== */
  const selectedService = useMemo(
    () => (services || []).find((s) => String(s.id) === String(form.serviceId)),
    [services, form.serviceId]
  );

  const onSave = async () => {
    setSaving(true); setError(""); setMsg("");
    try {
      const startsAt = toMySQLFromLocalInput(form.startsLocal);

      let endsAt = null;
      if (selectedService?.duration_min && form.startsLocal) {
        const d = new Date(form.startsLocal);
        d.setMinutes(d.getMinutes() + Number(selectedService.duration_min));
        const pad = (n) => String(n).padStart(2, "0");
        endsAt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
      }

      await updateAppointment(a.id, {
        customerName: form.customerName || null,
        customerPhone: form.customerPhone || null,
        serviceId: Number(form.serviceId) || null,
        stylistId: Number(form.stylistId) || null,
        startsAt,
        endsAt,
        status: form.status,
      });
      setMsg("Turno actualizado correctamente.");
    } catch (e) {
      setError(e?.message || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("¿Eliminar este turno?")) return;
    setSaving(true); setError(""); setMsg("");
    try {
      await deleteAppointment(a.id);
      setMsg("Turno eliminado.");
      onClose?.();
    } catch (e) {
      setError(e?.message || "Error al eliminar.");
    } finally {
      setSaving(false);
    }
  };

  /* ====== PAGO: helpers ====== */
  const mpPaymentId = a.mp_payment_id || a.mp_paymentId || a.payment_id || null;
  const mpStatus = a.mp_payment_status || a.payment_status || null;
  const depositDecimal = a.deposit_decimal ?? a.depositAmount ?? null;
  const isDepositPaid = a.status === "deposit_paid" || a.status === "confirmed" || !!a.deposit_paid_at;

  const postPayment = async ({ method, amount }) => {
    setError(""); setMsg("");
    try {
      const r = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: a.id,
          method,                         // 'cash' | 'card'
          amount_cents: Math.round(Number(amount) * 100),
          recorded_by: "admin",
          notes: method === "cash" ? "Pago en efectivo" : "Pago presencial con débito/tarjeta",
          markDepositAsPaid: true
        })
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "No se pudo registrar el pago.");
      setMsg(`Pago ${method === "cash" ? "en efectivo" : "con tarjeta"} registrado.`);
      setPayUI({ visible: false, method: null });
    } catch (e) {
      setError(e?.message || "Error registrando el pago.");
    }
  };

  /* NUEVO: abrir formularios en vez de prompt() */
  const onPayCash = () => setPayUI({ visible: true, method: "cash" });
  const onPayCard = () => setPayUI({ visible: true, method: "card" });

  if (!open) return null;

  return (
    <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div style={card}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Editar turno</h3>
          <button onClick={() => onClose?.()} style={button("outline")}>Cerrar</button>
        </div>

        <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 8 }}>
          #{a?.id} • {a?.customer_name || "Cliente"} • {a?.service_name || "Servicio"}
        </div>

        {/* Badges */}
        <div style={{ ...row, marginBottom: 10 }}>
          {isDepositPaid ? <span style={badge("#DCFCE7", "#86EFAC", "#065F46")}>Seña pagada</span> : null}
          {mpPaymentId ? <span style={badge("#EFF6FF", "#BFDBFE", "#1E40AF")}>MP ID: {mpPaymentId}</span> : null}
          {mpStatus ? <span style={badge("#E0E7FF", "#C7D2FE", "#3730A3")}>MP: {String(mpStatus).toUpperCase()}</span> : null}
          {!isDepositPaid ? <span style={badge("#FEF3C7", "#FDE68A", "#92400E")}>Seña pendiente</span> : null}
        </div>

        {/* Form */}
        <div style={grid}>
          <div>
            <div style={label}>Cliente</div>
            <input style={input} value={form.customerName} onChange={onChange("customerName")} placeholder="Nombre (opcional)" />
          </div>
          <div>
            <div style={label}>Teléfono</div>
            <input style={input} value={form.customerPhone} onChange={onChange("customerPhone")} placeholder="+54911..." />
          </div>

          <div>
            <div style={label}>Servicio</div>
            <select style={input} value={form.serviceId} onChange={onChange("serviceId")}>
              <option value="">Seleccioná…</option>
              {(services || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={label}>Peluquero/a</div>
            <select style={input} value={form.stylistId} onChange={onChange("stylistId")}>
              <option value="">Seleccioná…</option>
              {(stylists || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div style={label}>Fecha y hora</div>
            <input
              type="datetime-local"
              style={input}
              value={form.startsLocal}
              onChange={onChange("startsLocal")}
            />
          </div>
          <div>
            <div style={label}>Estado</div>
            <select style={input} value={form.status} onChange={onChange("status")}>
              <option value="scheduled">Programado</option>
              <option value="pending_deposit">Seña pendiente</option>
              <option value="deposit_paid">Seña pagada</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Pagos */}
        <div style={{ marginTop: 14 }}>
          <div style={{ ...row, justifyContent: "space-between" }}>
            <div style={{ fontWeight: 700 }}>Pagos</div>
            {depositDecimal != null && (
              <div style={{ fontSize: 13, color: "#374151" }}>
                Seña esperada: <b>${Number(depositDecimal).toFixed(2)}</b>
              </div>
            )}
          </div>

          <div style={{ ...row, marginTop: 8 }}>
            <button style={button("solid")} onClick={onPayCash}>Registrar EFECTIVO</button>
            <button style={button("outline")} onClick={onPayCard}>Registrar DÉBITO/TARJETA</button>
            {mpPaymentId && (
              <a
                style={{ ...button("outline"), textDecoration: "none" }}
                href={`https://www.mercadopago.com.ar/activities/${mpPaymentId}`} target="_blank" rel="noreferrer"
              >
                Ver en Mercado Pago
              </a>
            )}
          </div>

          {/* NUEVO: Formulario inline para confirmar el pago */}
          <PayForm
            visible={payUI.visible}
            method={payUI.method}
            defaultAmount={depositDecimal != null ? Number(depositDecimal).toFixed(2) : ""}
            onCancel={() => setPayUI({ visible: false, method: null })}
            onConfirm={postPayment}
            disabled={saving}
          />
        </div>

        {/* Mensajes */}
        {msg && <div style={{ marginTop: 10, color: "#065f46", background: "#ECFDF5", border: "1px solid #A7F3D0", padding: 8, borderRadius: 8 }}>{msg}</div>}
        {error && <div style={{ marginTop: 10, color: "#991b1b", background: "#FEF2F2", border: "1px solid #FECACA", padding: 8, borderRadius: 8 }}>{error}</div>}

        {/* Footer */}
        <div style={footer}>
          <button onClick={onDelete} disabled={saving} style={button("outline")}>
            Eliminar
          </button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onClose?.()} disabled={saving} style={button("outline")}>
              Cancelar
            </button>
            <button onClick={onSave} disabled={saving} style={button("solid")}>
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
