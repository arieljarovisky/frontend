import { useEffect, useMemo, useState } from "react";
import { useApp } from "../context/UseApp";
import { apiClient } from "../api/client";
import { toast } from "sonner";
import { X, Save, Trash2, MessageSquare, DollarSign, Calendar } from "lucide-react";

function formatDateToLocalInput(d) {
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

// Crea Date en zona local desde "YYYY-MM-DDTHH:mm" (no depende de timezone parsing de string)
function parseLocalInputToDate(local) {
  if (!local) return null;
  const s = local.includes("T") ? local : local.replace(" ", "T");
  const [datePart, timePart = "00:00"] = s.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh = 0, mm = 0] = (timePart.split(":").map(Number) || []);
  return new Date(y, m - 1, d, hh, mm, 0);
}

// Convierte cualquier ISO (con zona o sin zona) a "YYYY-MM-DDTHH:mm" en hora LOCAL del navegador.
// - Si la string tiene offset/Z (ej '...Z' o '-03:00'), new Date(iso) convierte correctamente a local.
// - Si la string NO tiene offset y es "YYYY-MM-DDTHH:mm" o similar, lo tratamos como local directamente.
function isoToLocalInput(isoOrLocal) {
  if (!isoOrLocal) return "";
  const s = String(isoOrLocal).trim();

  // si contiene Z o +/-HH:MM asumimos zona explícita -> new Date() hará la conversión a local
  if (/[zZ]$|[+\-]\d{2}:\d{2}$/.test(s)) {
    const d = new Date(s);
    return formatDateToLocalInput(d);
  }

  // si es formato "YYYY-MM-DD HH:mm" o "YYYY-MM-DDTHH:mm" sin zona -> tratar como local
  const maybeLocal = s.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(maybeLocal)) {
    const d = parseLocalInputToDate(maybeLocal);
    return formatDateToLocalInput(d);
  }

  // fallback: intentar new Date() por si viene en otro formato con zona
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return formatDateToLocalInput(d);

  return "";
}

/* ===== Helpers extra del original (si los tenías) ===== */
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

/* ===== Componente principal ===== */
export default function AppointmentModal({ open, onClose, event }) {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [darkMode] = useState(() => {
    const saved = localStorage.getItem("calendar:darkMode");
    return saved ? JSON.parse(saved) : true;
  });

  const { services = [], stylists = [], updateAppointment, deleteAppointment } = useApp();
  const a = event?.extendedProps || {};

  /* ===== Inicializar form usando isoToLocalInput (garantiza hora local) ===== */
  const [form, setForm] = useState(() => {
    const _a = event?.extendedProps || {};
    return {
      customerName: _a.customer_name || "",
      customerPhone: _a.phone_e164 || _a.customer_phone || "",
      serviceId: _a.service_id || _a.serviceId || "",
      stylistId: _a.stylist_id || _a.stylistId || "",
      startsLocal: isoToLocalInput(event?.start || _a.starts_at || _a.startsAt),
      status: _a.status || "scheduled",
    };
  });

  const [saving, setSaving] = useState(false);
  const [payUI, setPayUI] = useState({ visible: false, method: null });
  const [confirmUI, setConfirmUI] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    cancelText: "Cancelar",
    onConfirm: null,
  });

  const openConfirm = (cfg) => setConfirmUI({ open: true, cancelText: "Cancelar", confirmText: "Confirmar", ...cfg });
  const closeConfirm = () => setConfirmUI((u) => ({ ...u, open: false, onConfirm: null }));

  useEffect(() => {
    if (!msg && !error) return;
    const t = setTimeout(() => {
      setMsg("");
      setError("");
    }, 3000);
    return () => clearTimeout(t);
  }, [msg, error]);

  const [reprogUI, setReprogUI] = useState({
    visible: false,
    customText: "",
    autoCancel: true,
  });

  useEffect(() => {
    if (!open) return;
    const _a = event?.extendedProps || {};
    const localInput = isoToLocalInput(event?.start || _a.starts_at || _a.startsAt);

    // DEBUG opcional:
    // console.debug("DEBUG dates:", { eventStart: event?.start, starts_at: _a.starts_at, localInput });

    setForm({
      customerName: _a.customer_name || "",
      customerPhone: _a.phone_e164 || _a.customer_phone || "",
      serviceId: _a.service_id || _a.serviceId || "",
      stylistId: _a.stylist_id || _a.stylistId || "",
      startsLocal: localInput,
      status: _a.status || "scheduled",
    });

    const name = _a.customer_name ? ` ${_a.customer_name}` : "";
    setReprogUI({
      visible: false,
      customText: `Hola${name} 💈\nNecesitamos *reprogramar tu turno*. ¿Podemos coordinar una nueva fecha por acá? 🙏`,
      autoCancel: true,
    });

    setMsg("");
    setError("");
    setSaving(false);
    setPayUI({ visible: false, method: null });
  }, [open, event]);

  const onChange = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectedService = useMemo(
    () => (services || []).find((s) => String(s.id) === String(form.serviceId)),
    [services, form.serviceId]
  );

  /* ===== Variables relacionadas al pago - definidas antes del JSX ===== */
  const mpPaymentId = a.mp_payment_id || a.mp_paymentId || a.payment_id || null;
  const mpStatus = a.mp_payment_status || a.payment_status || null;
  const depositDecimal = a.deposit_decimal ?? a.depositAmount ?? null;
  const isDepositPaid = a.status === "deposit_paid" || a.status === "confirmed" || !!a.deposit_paid_at;

  /* ===== Guardar turno (usa parseLocalInputToDate para evitar offset UTC) ===== */
  const onSave = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const startsAt = form.startsLocal; // string "YYYY-MM-DDTHH:mm" (local)

      let endsAt = null;
      if (selectedService?.duration_min && form.startsLocal) {
        const d = parseLocalInputToDate(form.startsLocal); // crea Date en zona local
        d.setMinutes(d.getMinutes() + Number(selectedService.duration_min));
        endsAt = formatDateToLocalInput(d) + ":00"; // "YYYY-MM-DDTHH:mm:00"
      }

      // Si tu backend espera "YYYY-MM-DD HH:mm:ss" convertí startsAt:
      // const startsAtForDb = startsAt ? startsAt.replace("T", " ") + ":00" : null;

      await updateAppointment(a.id, {
        customerName: form.customerName || null,
        customerPhone: form.customerPhone || null,
        serviceId: Number(form.serviceId) || null,
        stylistId: Number(form.stylistId) || null,
        startsAt, // o startsAtForDb si tu backend lo requiere así
        endsAt,
        status: form.status,
      });

      toast.success("Turno actualizado correctamente", {
        description: `Cliente: ${form.customerName || "Sin nombre"}`,
      });
      setMsg("Turno actualizado correctamente.");
    } catch (e) {
      const errorMsg = e?.message || "Error al guardar.";
      toast.error("Error al actualizar turno", { description: errorMsg });
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  /* ===== Eliminar turno ===== */
  const onDelete = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      await deleteAppointment(a.id);
      toast.success("Turno eliminado", {
        description: "El turno ha sido borrado del sistema",
      });
      setMsg("Turno eliminado.");
      onClose?.();
    } catch (e) {
      const errorMsg = e?.message || "Error al eliminar.";
      toast.error("Error al eliminar turno", { description: errorMsg });
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const askDelete = () =>
    openConfirm({
      title: "Eliminar turno",
      message: "¿Seguro que querés eliminar este turno? Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      onConfirm: async () => {
        closeConfirm();
        await onDelete();
      },
    });

  /* ===== Reprogramación (WhatsApp) ===== */
  const onReprogramOpen = () => {
    setReprogUI((u) => ({ ...u, visible: true }));
  };

  const onReprogramCancel = () => {
    setReprogUI((u) => ({ ...u, visible: false }));
  };

  const onReprogramSend = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      const { data: j } = await apiClient.post("/api/whatsapp/reprogram", {
        appointmentId: a.id,
        phone: a.phone_e164 || a.customer_phone || form.customerPhone,
        customText: reprogUI.customText || null,
        autoCancel: Boolean(reprogUI.autoCancel),
      });
      if (!j?.ok) throw new Error(j?.error || "No se pudo enviar el mensaje.");

      toast.success("Mensaje de reprogramación enviado", {
        description: j.cancelled ? "El turno fue cancelado automáticamente" : "WhatsApp enviado exitosamente",
      });

      setMsg(`Mensaje enviado por WhatsApp. ${j.cancelled ? "El turno fue cancelado para liberar el hueco." : ""}`);
      setReprogUI({ visible: false, customText: "", autoCancel: true });

      if (j.cancelled) {
        await updateAppointment(a.id, { status: "cancelled" });
        onClose?.();
      }
    } catch (e) {
      const errorMsg = e?.message || "Error al reprogramar por WhatsApp.";
      toast.error("Error al enviar WhatsApp", { description: errorMsg });
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const onCancelAppointment = async () => {
    setSaving(true);
    setError("");
    setMsg("");
    try {
      await updateAppointment(a.id, { status: "cancelled" });
      toast.info("Turno cancelado", {
        description: "El horario ha sido liberado",
      });
      setMsg("Turno cancelado.");
      onClose?.();
    } catch (e) {
      const errorMsg = e?.message || "Error al cancelar el turno.";
      toast.error("Error al cancelar", { description: errorMsg });
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const askCancel = () =>
    openConfirm({
      title: "Cancelar turno",
      message: "El turno quedará marcado como cancelado y se liberará el horario.",
      confirmText: "Cancelar turno",
      onConfirm: async () => {
        closeConfirm();
        await onCancelAppointment();
      },
    });

  if (!open) return null;

  // Estilos dinámicos
  const modalBg = darkMode ? "bg-slate-900" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-gray-200";
  const textColor = darkMode ? "text-slate-100" : "text-gray-900";
  const subtextColor = darkMode ? "text-slate-400" : "text-gray-600";
  const inputBg = darkMode ? "bg-slate-800 border-slate-700 text-slate-100" : "bg-white border-gray-300 text-gray-900";
  const buttonPrimary = darkMode ? "bg-emerald-600 hover:bg-emerald-700" : "bg-black hover:bg-black/90";
  const buttonSecondary = darkMode ? "bg-slate-800 hover:bg-slate-700 border-slate-600" : "bg-white hover:bg-gray-50 border-gray-300";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 60,
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`${modalBg} ${borderColor} border rounded-2xl shadow-2xl`}
        style={{ width: 620, maxWidth: "95vw", maxHeight: "90vh", overflow: "auto", padding: 24 }}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-xl font-bold tracking-tight ${textColor} flex items-center gap-2`}>
              <Calendar className="w-5 h-5" />
              Editar turno
            </h3>
            <div className={`${subtextColor} text-sm mt-1`}>
              #{a?.id} • {a?.customer_name || "Cliente"} • {a?.service_name || "Servicio"}
            </div>
          </div>
          <button
            onClick={() => onClose?.()}
            className={`p-2 rounded-xl ${buttonSecondary} border transition-all`}
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isDepositPaid && (
            <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
              ✓ Seña pagada
            </span>
          )}
          {mpPaymentId && (
            <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700 border border-blue-200">
              MP ID: {mpPaymentId}
            </span>
          )}
          {mpStatus && (
            <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 border border-indigo-200">
              MP: {String(mpStatus).toUpperCase()}
            </span>
          )}
          {!isDepositPaid && (
            <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200">
              ⏳ Seña pendiente
            </span>
          )}
        </div>

        {/* Form */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${textColor}`}>Cliente</label>
            <input
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`}
              value={form.customerName}
              onChange={onChange("customerName")}
              placeholder="Nombre (opcional)"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${textColor}`}>Teléfono</label>
            <input
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`}
              value={form.customerPhone}
              onChange={onChange("customerPhone")}
              placeholder="+54911..."
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${textColor}`}>Servicio</label>
            <select className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`} value={form.serviceId} onChange={onChange("serviceId")}>
              <option value="">Seleccioná…</option>
              {(services || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${textColor}`}>Peluquero/a</label>
            <select className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`} value={form.stylistId} onChange={onChange("stylistId")}>
              <option value="">Seleccioná…</option>
              {(stylists || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${textColor}`}>Fecha y hora</label>
            <input
              type="datetime-local"
              className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`}
              value={form.startsLocal}
              onChange={onChange("startsLocal")}
              step="300"
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-1 ${textColor}`}>Estado</label>
            <select className={`w-full rounded-xl border px-3 py-2 text-sm ${inputBg}`} value={form.status} onChange={onChange("status")}>
              <option value="scheduled">Programado</option>
              <option value="pending_deposit">Seña pendiente</option>
              <option value="deposit_paid">Seña pagada</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        {/* Reprogramación */}
        <div className={`mb-4 p-4 rounded-xl border ${borderColor}`}>
          <div className="flex justify-between items-center mb-3">
            <div className={`font-semibold flex items-center gap-2 ${textColor}`}>
              <MessageSquare className="w-4 h-4" />
              Reprogramar por WhatsApp
            </div>
            <button onClick={onReprogramOpen} className={`px-3 py-1.5 rounded-lg text-xs ${buttonSecondary} border`}>
              Abrir
            </button>
          </div>
          {reprogUI.visible && (
            <div className={`p-3 rounded-lg ${darkMode ? "bg-slate-800/50" : "bg-gray-50"}`}>
              <textarea
                rows={4}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${inputBg}`}
                value={reprogUI.customText}
                onChange={(e) => setReprogUI((u) => ({ ...u, customText: e.target.value }))}
                placeholder="Mensaje personalizado..."
                disabled={saving}
              />
              <div className="flex items-center gap-2 mt-2 mb-3">
                <input
                  id="autoCancel"
                  type="checkbox"
                  checked={reprogUI.autoCancel}
                  onChange={(e) => setReprogUI((u) => ({ ...u, autoCancel: e.target.checked }))}
                  disabled={saving}
                  className="rounded"
                />
                <label htmlFor="autoCancel" className={`text-xs ${subtextColor}`}>
                  Cancelar turno automáticamente
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={onReprogramCancel} className={`px-3 py-1.5 rounded-lg text-sm ${buttonSecondary} border flex-1`} disabled={saving}>
                  Cerrar
                </button>
                <button
                  onClick={onReprogramSend}
                  className={`px-3 py-1.5 rounded-lg text-sm ${buttonPrimary} text-white flex-1`}
                  disabled={saving}
                >
                  {saving ? "Enviando…" : "Enviar"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mensajes */}
        {msg && (
          <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 p-3 text-sm">
            {msg}
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-xl border border-red-200 bg-red-50 text-red-700 p-3 text-sm">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: darkMode ? "#334155" : "#e5e7eb" }}>
          <button
            onClick={askDelete}
            disabled={saving}
            className="px-3 py-2 rounded-xl border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 text-sm flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
          <button
            onClick={askCancel}
            disabled={saving}
            className={`px-3 py-2 rounded-xl text-sm ${buttonSecondary} border`}
          >
            Cancelar turno
          </button>
          <div className="flex-1" />
          <button onClick={() => onClose?.()} disabled={saving} className={`px-4 py-2 rounded-xl text-sm ${buttonSecondary} border`}>
            Cerrar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className={`px-4 py-2 rounded-xl text-sm ${buttonPrimary} text-white flex items-center gap-2`}
          >
            <Save className="w-4 h-4" />
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmUI.open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            zIndex: 80,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className={`${modalBg} rounded-2xl shadow-2xl p-6`} style={{ width: 420, maxWidth: "90vw" }}>
            <div className={`font-bold text-lg mb-2 ${textColor}`}>{confirmUI.title}</div>
            <div className={`text-sm ${subtextColor} mb-4`}>{confirmUI.message}</div>
            <div className="flex justify-end gap-2">
              <button onClick={closeConfirm} className={`px-4 py-2 rounded-xl text-sm ${buttonSecondary} border`} disabled={saving}>
                {confirmUI.cancelText}
              </button>
              <button
                onClick={confirmUI.onConfirm}
                className={`px-4 py-2 rounded-xl text-sm ${buttonPrimary} text-white`}
                disabled={saving}
              >
                {saving ? "Procesando…" : confirmUI.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
