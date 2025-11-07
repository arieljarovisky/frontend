import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "../api";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "../shared/useQuery.js";
import { formatPhone, initials, formatDateTime, StatusPill } from "../shared/ui.jsx";

const DOCUMENT_TYPE_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "96", label: "DNI" },
  { value: "80", label: "CUIT" },
  { value: "86", label: "CUIL" },
  { value: "94", label: "Pasaporte" },
  { value: "99", label: "Consumidor Final (sin documento)" },
];

const CONDICION_IVA_OPTIONS = [
  { value: "", label: "Sin especificar" },
  { value: "5", label: "Consumidor Final" },
  { value: "1", label: "Responsable Inscripto" },
  { value: "6", label: "Monotributista" },
  { value: "4", label: "Exento" },
];

const buildFormData = (customer) => ({
  name: customer?.name ?? "",
  phone: customer?.phone ?? "",
  email: customer?.email ?? "",
  documento: customer?.documento ?? "",
  tipo_documento: customer?.tipo_documento != null && customer?.tipo_documento !== undefined
    ? String(customer.tipo_documento)
    : "",
  cuit: customer?.cuit ?? "",
  razon_social: customer?.razon_social ?? "",
  domicilio: customer?.domicilio ?? "",
  condicion_iva: customer?.condicion_iva != null && customer?.condicion_iva !== undefined
    ? String(customer.condicion_iva)
    : "",
  notes: customer?.notes ?? "",
});

const getOptionLabel = (options, value) => {
  const option = options.find((opt) => opt.value === (value ?? ""));
  if (option) return option.label;
  if (!value) return "Sin especificar";
  return value;
};

export default function CustomerDetailPage() {
  const { id, tenantSlug } = useParams();
  const { data, loading, error, refetch } = useQuery((signal) => apiClient.customerDetail(id, signal), [id]);
  const [customer, setCustomer] = useState(null);
  const [formData, setFormData] = useState(buildFormData(null));
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (data) {
      setCustomer(data);
      if (!isEditing) {
        setFormData(buildFormData(data));
      }
    }
  }, [data]);

  const appointments = useMemo(() => customer?.appointments ?? [], [customer]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartEditing = () => {
    setFormData(buildFormData(customer));
    setIsEditing(true);
    setSaveError("");
  };

  const handleCancelEditing = () => {
    setFormData(buildFormData(customer));
    setIsEditing(false);
    setSaveError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData) return;
    setSaving(true);
    setSaveError("");

    try {
      const updated = await apiClient.updateCustomer(id, formData);
      const merged = { ...customer, ...updated };
      setCustomer(merged);
      setFormData(buildFormData(merged));
      setIsEditing(false);
      refetch();
    } catch (e) {
      const message = e?.response?.data?.error || e?.message || "Error al guardar";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Cargando…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!customer) return <p className="text-sm text-gray-500">No encontrado.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-base">
            {initials(customer.name || "?")}
          </div>
          <div>
            <div className="text-lg font-semibold">{customer.name || "(Sin nombre)"}</div>
            <div className="text-sm text-white-600">{formatPhone(customer.phone)}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to={`/${tenantSlug}/customers`} className="text-sm text-white-600 hover:text-gray-900">
            ← Volver
          </Link>
          {!isEditing ? (
            <button
              type="button"
              onClick={handleStartEditing}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
            >
              Editar
            </button>
          ) : null}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Datos del cliente</h2>
          {isEditing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancelEditing}
                className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          ) : null}
        </div>

        {saveError ? <p className="text-sm text-red-600">{saveError}</p> : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Nombre</span>
            <input
              type="text"
              value={formData.name}
              onChange={handleChange("name")}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              disabled={!isEditing}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Teléfono</span>
            <input
              type="text"
              value={formData.phone}
              onChange={handleChange("phone")}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              disabled={!isEditing}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Email</span>
            <input
              type="email"
              value={formData.email}
              onChange={handleChange("email")}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              disabled={!isEditing}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Documento</span>
            <input
              type="text"
              value={formData.documento}
              onChange={handleChange("documento")}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              disabled={!isEditing}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Tipo documento</span>
            {isEditing ? (
              <select
                value={formData.tipo_documento}
                onChange={handleChange("tipo_documento")}
                className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              >
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground-secondary">
                {getOptionLabel(DOCUMENT_TYPE_OPTIONS, formData.tipo_documento)}
              </div>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">CUIT</span>
            <input
              type="text"
              value={formData.cuit}
              onChange={handleChange("cuit")}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              disabled={!isEditing}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Razón social</span>
            <input
              type="text"
              value={formData.razon_social}
              onChange={handleChange("razon_social")}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              disabled={!isEditing}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Domicilio</span>
            <input
              type="text"
              value={formData.domicilio}
              onChange={handleChange("domicilio")}
              className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              disabled={!isEditing}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-foreground-secondary uppercase">Condición IVA</span>
            {isEditing ? (
              <select
                value={formData.condicion_iva}
                onChange={handleChange("condicion_iva")}
                className="rounded-lg border border-border px-3 py-2 text-sm bg-background"
              >
                {CONDICION_IVA_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-border px-3 py-2 text-sm bg-background text-foreground-secondary">
                {getOptionLabel(CONDICION_IVA_OPTIONS, formData.condicion_iva)}
              </div>
            )}
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-foreground-secondary uppercase">Notas</span>
          <textarea
            value={formData.notes}
            onChange={handleChange("notes")}
            className="rounded-lg border border-border px-3 py-2 text-sm bg-background min-h-24"
            disabled={!isEditing}
          />
        </label>
      </form>

      <div>
        <div className="text-sm font-medium mb-2">Historial de turnos</div>
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-medium text-white-500 bg-dark-200 border-b ">
            <div className="col-span-4">Fecha</div>
            <div className="col-span-3">Estado</div>
            <div className="col-span-5">Servicio / Peluquero</div>
          </div>
          {Array.isArray(appointments) && appointments.length > 0 ? (
            <div className="divide-y">
              {appointments.map((a) => (
                <div key={a.id} className="grid grid-cols-12 px-4 py-2 text-sm">
                  <div className="col-span-4">{formatDateTime(a.starts_at)}</div>
                  <div className="col-span-3"><StatusPill status={a.status} /></div>
                  <div className="col-span-5 text-white-700">
                    {a.service} · <span className="text-dark-500">{a.stylist}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-gray-500">Sin turnos todavía.</div>
          )}
        </div>
      </div>
    </div>
  );
}