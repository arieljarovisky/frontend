import { useEffect, useMemo, useState, useCallback } from "react";
import { useApp } from "../context/UseApp";
import { apiClient } from "../api/client";
import Button from "./ui/Button";
import { Field } from "./ui/Field";
import { Users, CalendarClock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

function formatSessionLabel(session) {
  if (!session) return "Clase";
  const start = session.starts_at ? new Date(session.starts_at.replace(" ", "T")) : null;
  const end = session.ends_at ? new Date(session.ends_at.replace(" ", "T")) : null;
  const fmt = (date) =>
    date?.toLocaleString("es-AR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  const base = session.activity_type || "Clase";
  return `${base} — ${fmt(start) || ""}${end ? ` a ${end.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}` : ""}`;
}

export default function ClassEnrollForm({ defaultName = "", defaultPhone = "" }) {
  const { classesEnabled } = useApp();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    sessionId: "",
    customerName: defaultName || "",
    customerPhone: defaultPhone || "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!classesEnabled) {
      setSessions([]);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const now = new Date();
      const from = new Date(now.getTime() - 60 * 60 * 1000);
      const to = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
      const data = await apiClient.listClassSessions({
        from: from.toISOString(),
        to: to.toISOString(),
      });
      const available = (Array.isArray(data) ? data : []).filter((session) => session.status === "scheduled");
      setSessions(available);
    } catch (e) {
      console.error("❌ [ClassEnrollForm] Error cargando clases:", e);
      setError(e?.message || "No se pudieron obtener las clases disponibles.");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [classesEnabled]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      customerName: defaultName || "",
      customerPhone: defaultPhone || "",
    }));
  }, [defaultName, defaultPhone]);

  const handleChange = (key) => (evt) => {
    const value = evt?.target?.value ?? "";
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    if (!form.sessionId) {
      setError("Seleccioná una clase para inscribir al cliente.");
      return;
    }
    if (!form.customerPhone) {
      setError("Ingresá un teléfono para inscribir en la clase.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        customerName: form.customerName || null,
        customerPhone: form.customerPhone,
        notes: form.notes || null,
      };
      const response = await apiClient.createClassEnrollment(Number(form.sessionId), payload);
      if (response?.ok === false) {
        throw new Error(response?.error || "No se pudo inscribir al cliente");
      }
      toast.success("Cliente inscripto en la clase seleccionada");
      setForm((prev) => ({
        ...prev,
        notes: "",
        sessionId: "",
      }));
      loadSessions();
    } catch (e) {
      const errorMsg = e?.response?.data?.error || e?.message || "Error al inscribir en la clase";
      setError(errorMsg);
      toast.error("No se pudo inscribir al cliente", { description: errorMsg });
    } finally {
      setSaving(false);
    }
  };

  const upcoming = useMemo(() => sessions.slice(0, 3), [sessions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">
          Inscribí al cliente actual en una clase grupal. Podés hacerlo después de confirmar el turno.
        </div>
        <button
          type="button"
          onClick={loadSessions}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700/50 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-200 hover:border-indigo-500/40 hover:text-white transition disabled:opacity-40"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Clase" hint="Mostramos las próximas clases con cupo disponible.">
          <select
            value={form.sessionId}
            onChange={handleChange("sessionId")}
            disabled={loading || sessions.length === 0}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 disabled:opacity-50"
          >
            <option value="">Seleccioná una clase</option>
            {sessions.map((session) => {
              const occupied = Number(session.enrolled_count ?? 0);
              const capacity = Number(session.capacity_max ?? 0);
              const full = capacity > 0 && occupied >= capacity;
              return (
                <option key={session.id} value={session.id} disabled={full}>
                  {formatSessionLabel(session)} • {occupied}/{capacity || "∞"}{" "}
                  {full ? "(Completa)" : ""}
                </option>
              );
            })}
          </select>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Nombre del alumno" hint="Opcional, usamos el del turno si lo dejás vacío.">
            <input
              value={form.customerName}
              onChange={handleChange("customerName")}
              placeholder="Nombre del alumno"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
          </Field>
          <Field label="Teléfono" hint="Formato internacional, ej. +54911..." required>
            <input
              value={form.customerPhone}
              onChange={handleChange("customerPhone")}
              placeholder="+54911..."
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
            />
          </Field>
        </div>

        <Field label="Notas" hint="Información adicional para el profesor (opcional).">
          <textarea
            value={form.notes}
            onChange={handleChange("notes")}
            rows={3}
            placeholder="Notas sobre el alumno…"
            className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          />
        </Field>

        <Button
          type="submit"
          disabled={saving || loading || !sessions.length}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white font-semibold py-3 flex items-center justify-center gap-2"
        >
          <Users className="w-5 h-5" />
          {saving ? "Inscribiendo…" : "Inscribir en clase"}
        </Button>
      </form>

      <div className="rounded-xl border border-slate-700/40 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
          <CalendarClock className="w-4 h-4" />
          Próximas clases
        </div>
        {loading ? (
          <div className="flex items-center gap-2 text-slate-300 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Cargando…
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-sm text-slate-400">No hay clases agendadas dentro de los próximos días.</div>
        ) : (
          <ul className="space-y-2 text-sm text-slate-200">
            {upcoming.map((session) => {
              const occupied = Number(session.enrolled_count ?? 0);
              const capacity = Number(session.capacity_max ?? 0);
              return (
                <li key={`upcoming-${session.id}`} className="flex items-center justify-between gap-2">
                  <span>{formatSessionLabel(session)}</span>
                  <span className="text-xs text-slate-400">
                    Cupo {occupied}/{capacity || "∞"}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}


