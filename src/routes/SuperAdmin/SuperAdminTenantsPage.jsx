import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Shield,
  Users,
  CalendarCheck,
} from "lucide-react";
import { apiClient } from "../../api/client.js";
import { useQuery } from "../../shared/useQuery.js";
import { useDebouncedValue } from "../../shared/useDebouncedValue.js";

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "trial", label: "Trial" },
  { value: "paused", label: "Pausados" },
  { value: "suspended", label: "Suspendidos" },
];

function formatStatus(status) {
  switch (status) {
    case "active":
      return "Activo";
    case "trial":
      return "Trial";
    case "paused":
      return "Pausado";
    case "suspended":
      return "Suspendido";
    case "cancelled":
      return "Cancelado";
    default:
      return status || "Desconocido";
  }
}

export default function SuperAdminTenantsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [detailTenantId, setDetailTenantId] = useState(null);

  const {
    data: tenantsResponse,
    loading,
    error,
    refetch,
  } = useQuery(
    async (signal) => {
      const params = {
        page,
        limit: 20,
        mode: "full",
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (status && status !== "all") params.status = status;

      const response = await apiClient.superAdmin.listTenants(params, { signal });
      return response;
    },
    [page, debouncedSearch, status]
  );

  const tenants = useMemo(() => tenantsResponse?.data || [], [tenantsResponse]);
  const tenantsWithDisplay = useMemo(
    () =>
      (tenants || []).map((tenant) => ({
        ...tenant,
        displayName: tenant.is_system
          ? "Panel Global"
          : tenant.name || tenant.subdomain || `#${tenant.id}`,
      })),
    [tenants]
  );
  const pagination = tenantsResponse?.pagination || { page: 1, pages: 1, total: tenantsWithDisplay.length, limit: 20 };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Listado actualizado");
    } catch (err) {
      toast.error(err?.message || "Error al actualizar");
    }
  };

  const openEditModal = (tenant) => {
    setEditingTenant(tenant);
    setShowCreateModal(true);
  };

  const openEditFromDetail = (detail) => {
    const tenantData = detail?.tenant || detail || { id: detailTenantId };
    setDetailTenantId(null);
    openEditModal(tenantData);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingTenant(null);
    setDetailTenantId(null);
  };

  const handleStatusChange = async (tenant, newStatus) => {
    if (!tenant?.id) return;
    if (tenant.is_system) {
      toast.error("El tenant del sistema no puede cambiar de estado");
      return;
    }
    if (tenant.status === newStatus) return;

    try {
      await apiClient.superAdmin.updateTenant(tenant.id, {
        tenant: { status: newStatus },
      });
      toast.success(`Tenant ${tenant.subdomain || tenant.id} actualizado`);
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Error al actualizar estado");
    }
  };

  const handleCreateOrUpdate = async (payload, tenantId = null) => {
    try {
      if (tenantId) {
        await apiClient.superAdmin.updateTenant(tenantId, payload);
        toast.success("Tenant actualizado");
      } else {
        await apiClient.superAdmin.createTenant(payload);
        toast.success("Tenant creado");
      }
      closeModals();
      await refetch();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Error al guardar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Tenants del sistema</h2>
          <p className="text-foreground-secondary text-sm">
            Gestión centralizada de todas las cuentas
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-background-secondary transition-all"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            onClick={() => {
              setEditingTenant(null);
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Nuevo tenant
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 card p-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            value={search}
            onChange={(event) => {
              setPage(1);
              setSearch(event.target.value);
            }}
            placeholder="Buscar por nombre, subdominio o email…"
            className="input pl-9"
            type="search"
          />
        </div>
        <div>
          <select
            className="input"
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="card p-10 text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="text-sm text-foreground-secondary">Cargando tenants…</p>
        </div>
      ) : error ? (
        <div className="card p-10 text-center text-red-500">
          {error}
        </div>
      ) : tenantsWithDisplay.length === 0 ? (
        <div className="card p-10 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-secondary">No se encontraron tenants con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-background-secondary/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Subdominio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Usuarios activos
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Clientes
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Turnos próximos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-foreground-secondary">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenantsWithDisplay.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-background-secondary/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium flex items-center gap-2">
                        {tenant.displayName}
                        {tenant.is_system && <SystemBadge />}
                      </div>
                      <div className="text-xs text-foreground-secondary">
                        #{tenant.id}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-secondary">
                      {tenant.subdomain || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {tenant.is_system ? <SystemBadge /> : <StatusBadge status={tenant.status} />}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {tenant.active_users ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {tenant.customers_count ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {tenant.appointments_upcoming ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setDetailTenantId(tenant.id)}
                          className="p-2 rounded-lg border border-border hover:bg-background transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(tenant)}
                          className="p-2 rounded-lg border border-border hover:bg-background transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {!tenant.is_system && (
                          <StatusMenu tenant={tenant} onChange={handleStatusChange} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            pagination={pagination}
            onPageChange={setPage}
          />
        </div>
      )}

      {showCreateModal && (
        <TenantFormModal
          tenant={editingTenant}
          onClose={closeModals}
          onSubmit={handleCreateOrUpdate}
        />
      )}

      {detailTenantId && (
        <TenantDetailModal
          tenantId={detailTenantId}
          onClose={closeModals}
          onEdit={openEditFromDetail}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const label = formatStatus(status);
  const style =
    status === "active"
      ? "bg-emerald-500/20 text-emerald-500"
      : status === "trial"
      ? "bg-blue-500/20 text-blue-500"
      : status === "paused"
      ? "bg-amber-500/20 text-amber-500"
      : status === "suspended"
      ? "bg-red-500/20 text-red-500"
      : "bg-foreground-muted/20 text-foreground-secondary";

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${style}`}>
      <Shield className="w-3 h-3" />
      {label}
    </span>
  );
}

function SystemBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary">
      <Shield className="w-3 h-3" />
      Sistema
    </span>
  );
}

function StatusMenu({ tenant, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-lg border border-border hover:bg-background transition-colors"
        title="Cambiar estado"
      >
        <Shield className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-lg border border-border bg-background shadow-lg z-50">
          <div className="py-1">
            {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setOpen(false);
                  onChange(tenant, option.value);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-background-secondary transition ${
                  tenant.status === option.value ? "text-primary" : "text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Pagination({ pagination, onPageChange }) {
  if (!pagination) return null;
  const { page = 1, pages = 1 } = pagination;

  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-background-secondary/40">
      <span className="text-sm text-foreground-secondary">
        Página {page} de {pages}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className="px-3 py-1 rounded-md border border-border text-sm hover:bg-background"
          disabled={page <= 1}
        >
          Anterior
        </button>
        <button
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          className="px-3 py-1 rounded-md border border-border text-sm hover:bg-background"
          disabled={page >= pages}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

function TenantFormModal({ tenant, onClose, onSubmit }) {
  const isEdit = Boolean(tenant?.id);
  const isSystemTenant = Boolean(tenant?.is_system);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: tenant?.name || "",
    subdomain: tenant?.subdomain || "",
    status: tenant?.status || "active",
    ownerEmail: "",
    ownerPassword: "",
  });

  useEffect(() => {
    if (tenant) {
      setFormData((prev) => ({
        ...prev,
        name: tenant.name || "",
        subdomain: tenant.subdomain || "",
        status: tenant.status || "active",
      }));
    }
  }, [tenant]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        tenant: {
          name: formData.name || null,
          subdomain: formData.subdomain || undefined,
          status: formData.status,
        },
      };

      if (!isEdit) {
        payload.owner = {};
        if (formData.ownerEmail) payload.owner.email = formData.ownerEmail;
        if (formData.ownerPassword) payload.owner.password = formData.ownerPassword;
      }

      if (isEdit) {
        await onSubmit(payload, tenant.id);
      } else {
        if (!formData.subdomain) {
          throw new Error("El subdominio es obligatorio para crear un tenant");
        }
        if (!formData.ownerEmail || !formData.ownerPassword) {
          throw new Error("Email y contraseña del responsable son obligatorios");
        }
        await onSubmit(payload, null);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">
            {isEdit ? "Editar tenant" : "Crear nuevo tenant"}
          </h3>
          <p className="text-sm text-foreground-secondary">
            Define los datos principales del tenant {isEdit ? `#${tenant?.id}` : ""}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre comercial</label>
              <input
                className="input"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Ej: Peluquería Centro"
              />
            </div>
            <div>
              <label className="label">Subdominio</label>
              <input
                className="input"
                value={formData.subdomain}
                onChange={(event) => setFormData({ ...formData, subdomain: event.target.value })}
                placeholder="Ej: pelu-centro"
                disabled={isEdit}
                required={!isEdit}
              />
            </div>
            <div>
              <label className="label">Estado</label>
              <select
                className="input"
                value={formData.status}
                onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                disabled={isSystemTenant}
              >
                {STATUS_OPTIONS.filter((option) => option.value !== "all").map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isSystemTenant && (
                <p className="text-xs text-foreground-secondary mt-1">
                  El tenant del sistema permanece siempre activo.
                </p>
              )}
            </div>
          </div>

          {!isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border pt-4">
              <div>
                <label className="label">Email del responsable</label>
                <input
                  className="input"
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(event) => setFormData({ ...formData, ownerEmail: event.target.value })}
                  placeholder="dueño@example.com"
                  required
                />
              </div>
              <div>
                <label className="label">Contraseña inicial</label>
                <input
                  className="input"
                  type="password"
                  value={formData.ownerPassword}
                  onChange={(event) => setFormData({ ...formData, ownerPassword: event.target.value })}
                  placeholder="Contraseña temporal"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-background-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TenantDetailModal({ tenantId, onClose, onEdit }) {
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    apiClient.superAdmin
      .getTenant(tenantId, {}, { signal: controller.signal })
      .then((response) => {
        setDetail(response?.data || null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err?.response?.data?.error || err?.message || "Error al cargar detalle");
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [tenantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Detalle tenant #{tenantId}</h3>
            <p className="text-sm text-foreground-secondary">
              Información resumida del tenant y sus métricas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onEdit(detail);
              }}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-background"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-background"
            >
              Cerrar
            </button>
          </div>
        </header>

        {loading ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <p className="text-foreground-secondary">Cargando detalle…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : !detail ? (
          <div className="p-8 text-center text-foreground-secondary">No hay datos disponibles.</div>
        ) : (
          <div className="px-6 py-5 space-y-6">
            {detail?.tenant?.is_system && (
              <div className="p-4 border border-primary/40 rounded-lg bg-primary/5 text-sm text-primary">
                Este tenant corresponde al panel global del sistema.
              </div>
            )}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InfoCard
                title="Información general"
                items={[
                  {
                    label: "Nombre",
                    value: detail.tenant?.is_system
                      ? "Panel Global"
                      : detail.tenant?.name || "—",
                  },
                  { label: "Subdominio", value: detail.tenant?.subdomain || "—" },
                  { label: "Estado", value: formatStatus(detail.tenant?.status) },
                  {
                    label: "Creado",
                    value: detail.tenant?.created_at
                      ? new Date(detail.tenant.created_at).toLocaleString("es-AR")
                      : "—",
                  },
                ]}
              />
              <InfoCard
                title="Métricas"
                items={[
                  { label: "Usuarios activos", value: detail.metrics?.active_users ?? "—", icon: Users },
                  { label: "Clientes", value: detail.metrics?.customers_count ?? "—" },
                  {
                    label: "Turnos próximos",
                    value: detail.metrics?.appointments_upcoming ?? "—",
                    icon: CalendarCheck,
                  },
                ]}
              />
            </section>

            {detail.subscription && (
              <InfoCard
                title="Suscripción"
                items={[
                  { label: "Estado", value: detail.subscription?.status || "—" },
                  { label: "Plan", value: detail.subscription?.plan_id ? `#${detail.subscription.plan_id}` : "—" },
                  {
                    label: "Periodo actual",
                    value: detail.subscription?.current_period_end
                      ? new Date(detail.subscription.current_period_end).toLocaleDateString("es-AR")
                      : "—",
                  },
                ]}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, items }) {
  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-background-secondary/40">
      <h4 className="font-semibold text-sm text-foreground">{title}</h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-foreground-secondary">{item.label}</span>
            <span className="font-medium text-foreground flex items-center gap-2">
              {item.icon ? <item.icon className="w-4 h-4" /> : null}
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

