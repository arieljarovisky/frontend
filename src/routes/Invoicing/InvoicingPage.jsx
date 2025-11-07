import { useState, useEffect } from "react";
import { useQuery } from "../../shared/useQuery.js";
import { apiClient } from "../../api";
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Eye,
  XCircle,
  CheckCircle,
  Clock,
  Filter,
  DollarSign,
  Calendar,
  CheckSquare,
  ShoppingCart,
  Pencil,
  Undo2
} from "lucide-react";
import { toast } from "sonner";
import "./invoicingModal.css";

const resolveInvoiceStatus = (invoice = {}) => {
  const explicit = String(invoice.status || "").toLowerCase();
  const STATUS_MAP = {
    approved: "approved",
    aprobada: "approved",
    aprobado: "approved",
    pendiente: "pending",
    pending: "pending",
    borrador: "draft",
    draft: "draft",
    rechazada: "rejected",
    rechazado: "rejected",
    rejected: "rejected",
    anulada: "cancelled",
    cancelada: "cancelled",
    cancelado: "cancelled",
    cancelled: "cancelled"
  };

  if (explicit && STATUS_MAP[explicit]) {
    return STATUS_MAP[explicit];
  }

  const caeRaw = String(invoice.cae ?? "").trim();
  const cae = caeRaw.toUpperCase();
  const notes = String(invoice.notes || "").toLowerCase();

  if (cae === "RECHAZADO" || notes.includes("rechazad")) return "rejected";
  const hasNumericCae = /^[0-9]{5,}$/.test(caeRaw);
  if (hasNumericCae) return "approved";

  return "draft";
};

const createEmptyInvoiceItem = () => ({
  service_id: "",
  descripcion: "",
  cantidad: 1,
  precio_unitario: 0,
  alicuota_iva: 21,
  codigo: null,
});

const mapInvoiceItemForForm = (item = {}) => ({
  service_id: item.service_id || "",
  descripcion: item.descripcion || item.description || "",
  cantidad: Number(item.cantidad || 1),
  precio_unitario: Number(item.precio_unitario ?? item.price ?? 0),
  alicuota_iva: Number(item.alicuota_iva ?? item.iva ?? 21),
  codigo: item.codigo || null,
});

const mapInvoiceItemForPayload = (item = {}) => ({
  service_id: item.service_id || null,
  descripcion: item.descripcion || "",
  cantidad: Number(item.cantidad || 1),
  precio_unitario: Number(item.precio_unitario || 0),
  alicuota_iva: Number(item.alicuota_iva ?? 21),
  codigo: item.codigo || null,
});

const parseInvoiceItems = (invoice = {}) => {
  const raw = invoice.items;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function InvoicingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [draftToEdit, setDraftToEdit] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [creditNoteLoadingId, setCreditNoteLoadingId] = useState(null);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [creditNoteTarget, setCreditNoteTarget] = useState(null);
  const [creditNoteReason, setCreditNoteReason] = useState("");
  const [creditNoteError, setCreditNoteError] = useState("");

  // Cargar facturas
  const { data: rawInvoices = [], loading, error, refetch } = useQuery(
    async (signal) => {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      
      const response = await apiClient.get(`/api/invoicing/invoices?${params}`, { signal });
      return response.data?.data || [];
    },
    [statusFilter]
  );

  const invoicesSource = Array.isArray(rawInvoices) ? rawInvoices : (rawInvoices ? [rawInvoices] : []);

  const invoicesWithStatus = invoicesSource.map((invoice) => ({
    ...invoice,
    __status: resolveInvoiceStatus(invoice),
  }));

  const filteredByStatus = invoicesWithStatus.filter((invoice) => {
    if (!statusFilter) return true;
    return invoice.__status === statusFilter.toLowerCase();
  });

  const invoices = filteredByStatus.filter((invoice) => {
    if (!search) return true;
    const term = search.trim().toLowerCase();
    return (
      String(invoice.invoice_number || "").toLowerCase().includes(term) ||
      String(invoice.customer_name || "").toLowerCase().includes(term) ||
      String(invoice.customer_doc || invoice.customer_document || "").toLowerCase().includes(term)
    );
  });

  const canCreateCreditNote = (invoice = {}) => {
    const status = resolveInvoiceStatus(invoice);
    const tipoComprobante = Number(invoice.tipo_comprobante || 0);
    const isCreditNoteType = [3, 8, 13].includes(tipoComprobante);
    return (
      status === "approved" &&
      !isCreditNoteType &&
      !invoice.original_invoice_id &&
      invoice.cae && invoice.cae !== "RECHAZADO"
    );
  };

  const openCreditNoteModal = (invoice = {}) => {
    if (!invoice || !invoice.id) return;
    setCreditNoteTarget(invoice);
    const formattedNumber = formatInvoiceNumber(invoice.invoice_number);
    const defaultReason = formattedNumber && formattedNumber !== "-"
      ? `Nota de crédito sobre ${formattedNumber}`
      : `Nota de crédito factura #${invoice.id}`;
    setCreditNoteReason(defaultReason);
    setCreditNoteError("");
    setShowCreditNoteModal(true);
  };

  const closeCreditNoteModal = () => {
    setShowCreditNoteModal(false);
    setCreditNoteTarget(null);
    setCreditNoteReason("");
    setCreditNoteError("");
    setCreditNoteLoadingId(null);
  };

  const handleConfirmCreditNote = async () => {
    if (!creditNoteTarget?.id) return;
    const trimmed = creditNoteReason.trim();
    if (!trimmed) {
      setCreditNoteError("El motivo no puede estar vacío.");
      return;
    }

    try {
      setCreditNoteLoadingId(creditNoteTarget.id);
      const parsedItems = parseInvoiceItems(creditNoteTarget);
      const payload = {
        invoice_id: creditNoteTarget.id,
        motivo: trimmed,
      };
      if (parsedItems.length > 0) {
        payload.items = parsedItems;
      }
      const response = await apiClient.post("/api/invoicing/arca/nota-credito", payload);
      toast.success(response.data?.message || "Nota de crédito generada correctamente");
      closeCreditNoteModal();
      refetch();
    } catch (error) {
      const message = error?.response?.data?.error || "Error al generar la nota de crédito";
      setCreditNoteError(message);
      toast.error(message);
      setCreditNoteLoadingId(null);
    }
  };

  // Cargar constantes
  const { data: constants } = useQuery(
    async () => {
      const response = await apiClient.get("/api/invoicing/constants");
      return response.data?.data || {};
    },
    []
  );

  const { data: services = [] } = useQuery(
    async () => {
      const response = await apiClient.get("/api/meta/services?active=1");
      return response.data?.data || [];
    },
    []
  );

  // Cargar clientes
  const { data: customers = [] } = useQuery(
    async () => {
      const response = await apiClient.get("/api/customers");
      return response.data?.data || [];
    },
    []
  );

  // Cargar appointments/turnos pendientes de facturar
  const { data: appointments = [], refetch: refetchAppointments } = useQuery(
    async () => {
      try {
        // Obtener turnos de los últimos 3 meses que no estén facturados
        const from = new Date();
        from.setMonth(from.getMonth() - 3);
        const to = new Date();
        to.setDate(to.getDate() + 1); // Incluir hoy
        
        const response = await apiClient.listAppointments({
          from: from.toISOString(),
          to: to.toISOString()
        });
        
        // Filtrar solo los que tienen estado "completed" o "confirmed" y no están facturados
        const appointmentsData = response.data || response || [];
        
        // Normalizar los datos y filtrar
        const filtered = appointmentsData
          .map(apt => ({
            ...apt,
            // Normalizar campos de fecha
            start_time: apt.start_time || apt.starts_at || apt.date,
            date: apt.date || apt.starts_at || apt.start_time,
            // Normalizar campos de servicio
            service_name: apt.service_name || apt.service?.name,
            service: apt.service || { name: apt.service_name, price: apt.service_price || apt.price },
            // Normalizar campos de cliente
            customer_name: apt.customer_name || apt.customer?.name,
            customer: apt.customer || { 
              id: apt.customer_id, 
              name: apt.customer_name,
              documento: apt.customer_documento || apt.documento
            },
            // Normalizar campos de estilista
            stylist: apt.stylist || { name: apt.stylist_name },
            // Precio
            price: apt.price || apt.service_price || apt.service?.price || 0,
            total: apt.total || apt.price || apt.service_price || apt.service?.price || 0,
            // Normalizar flags de facturación
            invoiced: Number(apt.invoiced ?? 0),
            has_invoice: Number(apt.has_invoice ?? 0)
          }))
          .filter(apt => {
            // Filtrar por estado - incluir todos los estados válidos para facturar
            // Los turnos facturables son los que están confirmados, con seña pagada, o completados
            const validStatuses = ['confirmed', 'deposit_paid', 'scheduled', 'completed', 'paid'];
            const hasValidStatus = validStatuses.includes(apt.status);
            
            // Filtrar por facturado usando valores numéricos normalizados
            const invoicedValue = Number(apt.invoiced ?? 0);
            const hasInvoiceValue = Number(apt.has_invoice ?? 0);
            const isNotInvoiced = invoicedValue === 0 && hasInvoiceValue === 0;
            
            return hasValidStatus && isNotInvoiced;
          });
        
        console.log(`[InvoicingPage] Cargados ${filtered.length} turnos pendientes de facturar de ${appointmentsData.length} totales`);
        
        return filtered;
      } catch (error) {
        console.error("Error loading appointments:", error);
        return [];
      }
    },
    []
  );

  const getStatusBadge = (status) => {
    const configs = {
      draft: { color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", icon: FileText, label: "Borrador" },
      pending: { color: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400", icon: Clock, label: "Pendiente" },
      approved: { color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400", icon: CheckCircle, label: "Aprobada" },
      rejected: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", icon: XCircle, label: "Rechazada" },
      cancelled: { color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", icon: XCircle, label: "Anulada" },
    };
    const config = configs[status] || configs.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const formatInvoiceNumber = (number) => {
    if (!number) return "-";
    return number;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Facturación</h1>
          <p className="text-sm sm:text-base text-foreground-secondary">
            Gestiona facturas electrónicas con ARCA
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
          onClick={() => setShowAppointmentsModal(true)}
            className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Facturar Turnos</span>
          </button>
          <button
            onClick={() => {
              setDraftToEdit(null);
              setShowModal(true);
            }}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Nueva Factura</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por número, cliente..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">Todos los estados</option>
            <option value="draft">Borrador</option>
            <option value="pending">Pendiente</option>
            <option value="approved">Aprobada</option>
            <option value="rejected">Rechazada</option>
            <option value="cancelled">Anulada</option>
          </select>
        </div>
      </div>

      {/* Tabla de facturas */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Cargando facturas...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-red-500">
          {error}
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-secondary">No hay facturas</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mt-4"
          >
            Crear primera factura
          </button>
        </div>
      ) : (
        <>
          {/* Vista de cards en mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {(invoices || []).map((invoice) => (
              <div key={invoice.id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{invoice.customer_name}</h3>
                    <p className="text-xs text-foreground-muted mt-1">
                      {formatInvoiceNumber(invoice.invoice_number)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {invoice.__status === 'draft' && (
                      <button
                        onClick={() => {
                          setDraftToEdit(invoice);
                          setSelectedInvoice(null);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg text-foreground-secondary hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
                        title="Editar borrador"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {canCreateCreditNote(invoice) && (
                      <button
                        onClick={() => openCreditNoteModal(invoice)}
                        className="p-2 rounded-lg text-foreground-secondary hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Generar nota de crédito"
                        disabled={creditNoteLoadingId === invoice.id}
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(invoice)}
                      className="p-2 rounded-lg text-foreground-secondary hover:text-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {invoice.pdf_url && (
                      <a
                        href={invoice.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg text-foreground-secondary hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        title="Descargar PDF"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Fecha:</span>
                    <span className="text-foreground">{formatDate(invoice.fecha_emision)}</span>
                  </div>
                  {invoice.punto_venta && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-secondary">Punto de venta:</span>
                      <span className="text-foreground">{invoice.punto_venta}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Subtotal:</span>
                    <span className="text-foreground">
                      ${Number(invoice.importe_neto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">IVA:</span>
                    <span className="text-foreground">
                      ${Number(invoice.importe_iva || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-foreground-secondary font-semibold">Total:</span>
                    <span className="text-foreground font-bold">
                      ${Number(invoice.importe_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-foreground-secondary">Estado:</span>
                      {getStatusBadge(invoice.__status)}
                    </div>
                  {invoice.cae && (
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-foreground-secondary">CAE:</span>
                        <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                          {invoice.cae.slice(0, 12)}...
                        </span>
                      </div>
                      {invoice.vto_cae && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground-secondary">Vencimiento:</span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400">
                            {new Date(invoice.vto_cae).toLocaleDateString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Vista de tabla en desktop */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-background-secondary">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Número</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Cliente</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Fecha</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Total</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">CAE</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoices || []).map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border hover:bg-background-secondary transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div>{formatInvoiceNumber(invoice.invoice_number)}</div>
                        {invoice.punto_venta && (
                          <div className="text-xs text-foreground-muted">PV: {invoice.punto_venta}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-foreground font-medium">{invoice.customer_name}</div>
                        {invoice.customer_doc && (
                          <div className="text-xs text-foreground-muted">
                            Doc: {invoice.customer_doc}
                          </div>
                        )}
                        {invoice.customer_cuit && (
                          <div className="text-xs text-foreground-muted">
                            CUIT: {invoice.customer_cuit}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">
                        <div>{formatDate(invoice.fecha_emision)}</div>
                        {invoice.vto_cae && (
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Vto: {new Date(invoice.vto_cae).toLocaleDateString('es-AR')}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-medium text-foreground">
                          ${Number(invoice.importe_total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-foreground-muted">
                          Neto: ${Number(invoice.importe_neto || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(invoice.__status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {invoice.cae ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                              {invoice.cae.slice(0, 8)}...
                            </span>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                          </div>
                        ) : (
                          <span className="text-xs text-foreground-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          {invoice.__status === 'draft' && (
                            <button
                              onClick={() => {
                                setDraftToEdit(invoice);
                                setSelectedInvoice(null);
                                setShowModal(true);
                              }}
                              className="p-2 rounded-lg text-foreground-secondary hover:text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/10 transition-colors"
                              title="Editar borrador"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          {canCreateCreditNote(invoice) && (
                            <button
                              onClick={() => openCreditNoteModal(invoice)}
                              className="p-2 rounded-lg text-foreground-secondary hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Generar nota de crédito"
                              disabled={creditNoteLoadingId === invoice.id}
                            >
                              <Undo2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedInvoice(invoice)}
                            className="p-2 rounded-lg text-foreground-secondary hover:text-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {invoice.pdf_url && (
                            <a
                              href={invoice.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg text-foreground-secondary hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de crear factura */}
      {showModal && (
        <InvoiceModal
          key={draftToEdit?.id ? `edit-${draftToEdit.id}` : 'new'}
          customers={customers}
          constants={constants}
          services={services}
          initialInvoice={draftToEdit}
          onClose={() => {
            setShowModal(false);
            setDraftToEdit(null);
          }}
          onSave={() => {
            refetch();
            refetchAppointments();
            setShowModal(false);
            setDraftToEdit(null);
          }}
          formatInvoiceNumber={formatInvoiceNumber}
          formatDate={formatDate}
        />
      )}

      {showCreditNoteModal && creditNoteTarget && (
        <CreditNoteModal
          invoice={creditNoteTarget}
          reason={creditNoteReason}
          error={creditNoteError}
          onReasonChange={setCreditNoteReason}
          onClose={closeCreditNoteModal}
          onConfirm={handleConfirmCreditNote}
          loading={creditNoteLoadingId === creditNoteTarget.id}
        />
      )}

      {/* Modal de detalles */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Modal de facturar turnos */}
      {showAppointmentsModal && (
        <InvoiceAppointmentsModal
          appointments={appointments}
          customers={customers}
          constants={constants}
          onClose={() => setShowAppointmentsModal(false)}
          onSave={() => {
            refetch();
            refetchAppointments();
            setShowAppointmentsModal(false);
          }}
        />
      )}
    </div>
  );
}

// Modal para crear/editar factura
function InvoiceModal({ customers, constants, services, onClose, onSave, initialInvoice }) {
  const defaultInvoiceType = constants?.COMPROBANTE_TIPOS?.FACTURA_B || 6;
  const invoiceStatus = String(initialInvoice?.status || initialInvoice?.__status || "").toLowerCase();
  const isEditingDraft = Boolean(initialInvoice?.id && (!invoiceStatus || invoiceStatus === "draft"));

  const [formData, setFormData] = useState({
    id: null,
    tipo_comprobante: defaultInvoiceType,
    customer_id: "",
    items: [createEmptyInvoiceItem()],
    observaciones: "",
    punto_venta: "",
    numero_comprobante: "",
  });
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [serviceDropdownIndex, setServiceDropdownIndex] = useState(null);

  useEffect(() => {
    if (isEditingDraft) {
      let parsedItems = [];
      if (Array.isArray(initialInvoice?.items)) {
        parsedItems = initialInvoice.items;
      } else if (typeof initialInvoice?.items === "string" && initialInvoice.items.trim()) {
        try {
          parsedItems = JSON.parse(initialInvoice.items);
        } catch {
          parsedItems = [];
        }
      }

      const normalizedItems = parsedItems.length > 0
        ? parsedItems.map(mapInvoiceItemForForm)
        : [createEmptyInvoiceItem()];

      setFormData({
        id: initialInvoice.id,
        tipo_comprobante: Number(initialInvoice.tipo_comprobante || defaultInvoiceType),
        customer_id: initialInvoice.customer_id ? String(initialInvoice.customer_id) : "",
        items: normalizedItems,
        observaciones: initialInvoice.notes || initialInvoice.observaciones || "",
        punto_venta: initialInvoice.punto_venta ?? "",
        numero_comprobante: initialInvoice.numero_comprobante ?? "",
      });

      const customerFromList = initialInvoice.customer_id
        ? customers.find(c => String(c.id) === String(initialInvoice.customer_id))
        : null;

      if (customerFromList) {
        setSelectedCustomer(customerFromList);
      } else if (initialInvoice.customer_name) {
        setSelectedCustomer({
          id: initialInvoice.customer_id ?? null,
          name: initialInvoice.customer_name,
          documento: initialInvoice.customer_doc || "",
          cuit: initialInvoice.customer_cuit || "",
          address: initialInvoice.customer_address || "",
          condicion_iva: initialInvoice.condicion_iva || null,
        });
      } else {
        setSelectedCustomer(null);
      }
    } else {
      setFormData({
        id: null,
        tipo_comprobante: defaultInvoiceType,
        customer_id: "",
        items: [createEmptyInvoiceItem()],
        observaciones: "",
        punto_venta: "",
        numero_comprobante: "",
      });
      setSelectedCustomer(null);
    }
    setServiceDropdownIndex(null);
  }, [initialInvoice, customers, defaultInvoiceType, isEditingDraft]);

  const handleCustomerChange = (customerId) => {
    const numericId = customerId ? Number(customerId) : null;
    const customer = numericId ? customers.find(c => c.id === numericId) : null;
    setSelectedCustomer(customer || null);
    setFormData(prev => ({ ...prev, customer_id: customerId }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), createEmptyInvoiceItem()],
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index),
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleServiceInput = (index, value) => {
    const service = services.find(s => s.name.toLowerCase() === value.toLowerCase());
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = {
        ...newItems[index],
        service_id: service ? service.id : "",
        descripcion: value,
        precio_unitario: service ? Number(service.price_decimal || 0) : Number(newItems[index].precio_unitario || 0),
      };
      return { ...prev, items: newItems };
    });
  };

  const handleSelectSuggestion = (index, service) => {
    setFormData(prev => {
      const newItems = [...(prev.items || [])];
      newItems[index] = {
        ...newItems[index],
        service_id: service.id,
        descripcion: service.name,
        precio_unitario: Number(service.price_decimal || 0),
      };
      return { ...prev, items: newItems };
    });
    setServiceDropdownIndex(null);
  };

  const getServiceSuggestions = (query = "") => {
    const normalized = query.trim().toLowerCase();
    const matches = services.filter(service =>
      !normalized || service.name.toLowerCase().includes(normalized)
    );
    return matches.slice(0, 6);
  };

  const calculateTotals = () => {
    let neto = 0;
    let iva = 0;

    (formData.items || []).forEach(item => {
      const itemNeto = Number(item.precio_unitario || 0) * Number(item.cantidad || 1);
      const itemIva = itemNeto * (Number(item.alicuota_iva || 21) / 100);
      neto += itemNeto;
      iva += itemIva;
    });

    return {
      neto: Math.round(neto * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      total: Math.round((neto + iva) * 100) / 100,
    };
  };

  const totals = calculateTotals();
  const hasValidItems = (formData.items || []).length > 0 && !(formData.items || []).some(item => !item.descripcion || Number(item.precio_unitario || 0) <= 0);
  const isFormValid = Boolean(formData.customer_id) && hasValidItems;

  const buildDraftPayload = () => {
    const itemsPayload = (formData.items || []).map(mapInvoiceItemForPayload);
    return {
      tipo_comprobante: Number(formData.tipo_comprobante || defaultInvoiceType),
      customer_id: formData.customer_id ? Number(formData.customer_id) : null,
      items: itemsPayload,
      observaciones: formData.observaciones,
      importe_neto: totals.neto,
      importe_iva: totals.iva,
      importe_total: totals.total,
      cliente_data: selectedCustomer,
    };
  };

  const handleSaveDraft = async () => {
    const payload = buildDraftPayload();
    if (!payload.items.length) {
      toast.error("Agregá al menos un item antes de guardar");
      return;
    }

    try {
      setSavingDraft(true);
      if (isEditingDraft && formData.id) {
        await apiClient.put(`/api/invoicing/draft/${formData.id}`, payload);
        toast.success("Borrador actualizado");
      } else {
        await apiClient.post("/api/invoicing/draft", payload);
        toast.success("Borrador guardado");
      }
      onSave();
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Error al guardar borrador");
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Completá cliente e items válidos");
      return;
    }

    const tipoSeleccionado = Number(formData.tipo_comprobante || defaultInvoiceType);
    const customer = customers.find(c => String(c.id) === String(formData.customer_id));
    const facturaA = constants?.COMPROBANTE_TIPOS?.FACTURA_A;
    const facturaM = constants?.COMPROBANTE_TIPOS?.FACTURA_M;
    if ((tipoSeleccionado === facturaA || tipoSeleccionado === facturaM) && customer) {
      const rawDoc = (customer.cuit || customer.documento || "").toString();
      const numbersOnly = rawDoc.replace(/\D/g, "");
      if (numbersOnly.length !== 11) {
        toast.error("Para Factura A/M el cliente necesita un CUIT válido de 11 dígitos");
        return;
      }
    }

    const payload = {
      ...buildDraftPayload(),
    };
    if (isEditingDraft && formData.id) {
      payload.draft_id = formData.id;
    }

    setLoading(true);

    try {
      const response = await apiClient.post("/api/invoicing/arca/generate", payload);
      if (response.data?.duplicate) {
        toast.info(response.data?.message || "Esta factura ya había sido emitida.");
      } else {
        toast.success("Factura generada correctamente");
      }
      onSave();
    } catch (error) {
      const savedRejected = Boolean(error.response?.data?.saved_rejected);
      const message = error.response?.data?.error || "Error al generar factura";
      toast.error(message);
      if (savedRejected) {
        toast.info("Se registró la factura como rechazada");
        onSave();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invoice-modal-backdrop" onClick={onClose}>
      <div className="invoice-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="invoice-modal-header">
          <div>
            <h2>{isEditingDraft ? "Editar borrador" : "Nueva Factura"}</h2>
            <p>{isEditingDraft ? "Actualizá los datos antes de emitir la factura." : "Completá los datos para emitir la factura electrónica."}</p>
          </div>
          <button onClick={onClose} className="invoice-modal-close" aria-label="Cerrar modal">×</button>
        </header>

        <form onSubmit={handleSubmit} className="invoice-modal-form">
          <div className="invoice-grid two-columns">
            <label className="invoice-field">
              <span className="invoice-label">Tipo de comprobante *</span>
              <select
                value={formData.tipo_comprobante}
                onChange={(e) => setFormData(prev => ({ ...prev, tipo_comprobante: Number(e.target.value) }))}
                className="invoice-select"
              >
                {Object.entries(constants?.COMPROBANTE_TIPOS || {}).map(([label, value]) => (
                  <option key={value} value={value}>{label.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </label>

            <label className="invoice-field">
              <span className="invoice-label">Cliente *</span>
              <select
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="invoice-select"
              >
                <option value="">Seleccionar cliente</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
            </label>
          </div>

          {selectedCustomer && (
            <div className="invoice-pill">
              Facturando a <strong>{selectedCustomer.name}</strong>
              {selectedCustomer.documento && (
                <span className="invoice-pill-doc"> — Doc: {selectedCustomer.documento}</span>
              )}
            </div>
          )}

          <section className="invoice-items-section">
            <div className="invoice-section-header">
              <div className="invoice-field">
                <span className="invoice-label">Items *</span>
                <span className="invoice-empty-hint">Elegí los servicios, ajustá cantidades y modificá precios si es necesario.</span>
              </div>
              <button type="button" onClick={addItem} className="invoice-button secondary">Agregar item</button>
            </div>

            {(formData.items || []).map((item, index) => {
              const suggestions = getServiceSuggestions(item.descripcion);
              return (
                <div key={index} className="invoice-item-card">
                  <div className="invoice-item-actions">
                    <span className="invoice-item-title">Item {index + 1}</span>
                    {formData.items.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)}>Eliminar</button>
                    )}
                  </div>

                  <div className="invoice-item-grid">
                    <div className="invoice-field" style={{ position: "relative" }}>
                      <span className="invoice-label">Servicio</span>
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => handleServiceInput(index, e.target.value)}
                        onFocus={() => setServiceDropdownIndex(index)}
                        onBlur={() => setTimeout(() => setServiceDropdownIndex(null), 110)}
                        placeholder="Buscar servicio..."
                        className="invoice-input"
                      />
                      {serviceDropdownIndex === index && suggestions.length > 0 && (
                        <div className="invoice-service-suggestions">
                          {suggestions.map(service => (
                            <button
                              key={service.id}
                              type="button"
                              className="invoice-service-option"
                              onMouseDown={() => handleSelectSuggestion(index, service)}
                            >
                              <span>{service.name}</span>
                              <span>${Number(service.price_decimal || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="invoice-field">
                      <span className="invoice-label">Descripción</span>
                      <input
                        type="text"
                        placeholder="Descripción"
                        value={item.descripcion}
                        onChange={(e) => updateItem(index, "descripcion", e.target.value)}
                        className="invoice-input"
                        required
                      />
                    </div>

                    <div className="invoice-field">
                      <span className="invoice-label">Cantidad</span>
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={item.cantidad}
                        onChange={(e) => updateItem(index, "cantidad", Number(e.target.value) || 1)}
                        className="invoice-input"
                        min="1"
                        required
                      />
                    </div>

                    <div className="invoice-field">
                      <span className="invoice-label">Precio</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio"
                        value={item.precio_unitario}
                        onChange={(e) => updateItem(index, "precio_unitario", parseFloat(e.target.value) || 0)}
                        className="invoice-input"
                        min="0"
                        required
                      />
                    </div>

                    <div className="invoice-field">
                      <span className="invoice-label">IVA %</span>
                      <input
                        type="number"
                        placeholder="IVA %"
                        value={item.alicuota_iva}
                        onChange={(e) => updateItem(index, "alicuota_iva", Number(e.target.value) || 21)}
                        className="invoice-input"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>

                  <div className="invoice-item-meta">
                    Subtotal: ${((item.precio_unitario || 0) * (item.cantidad || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    {' '}• IVA: ${(((item.precio_unitario || 0) * (item.cantidad || 1)) * (item.alicuota_iva || 21) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              );
            })}
          </section>

          <section className="invoice-totals">
            <div className="invoice-total-row">
              <span>Subtotal</span>
              <span>${totals.neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="invoice-total-row">
              <span>IVA</span>
              <span>${totals.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="invoice-total-row invoice-total-highlight">
              <span>Total</span>
              <span>${totals.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
            </div>
          </section>

          <label className="invoice-field">
            <span className="invoice-label">Observaciones</span>
            <textarea
              placeholder="Observaciones adicionales..."
              value={formData.observaciones}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
              rows={3}
              className="invoice-textarea"
            />
          </label>

          <div className="invoice-footer">
            <span className="invoice-footer-note">Verificá un cliente y al menos un item antes de generar.</span>
            <div className="invoice-footer-actions">
              <button type="button" onClick={onClose} className="invoice-button secondary" disabled={loading || savingDraft}>Cancelar</button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="invoice-button secondary"
                disabled={savingDraft || loading}
              >
                {savingDraft ? "Guardando…" : isEditingDraft ? "Actualizar borrador" : "Guardar borrador"}
              </button>
              <button type="submit" className="invoice-button primary" disabled={!isFormValid || loading || savingDraft}>
                {loading ? "Generando..." : "Generar factura"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreditNoteModal({ invoice, reason, error, onReasonChange, onClose, onConfirm, loading, formatInvoiceNumber, formatDate }) {
  const safeFormatInvoiceNumber = typeof formatInvoiceNumber === 'function'
    ? formatInvoiceNumber
    : (value) => (value ? value : '-');
  const safeFormatDate = typeof formatDate === 'function'
    ? formatDate
    : (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-AR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      };

  const items = parseInvoiceItems(invoice);
  const totals = {
    neto: Number(invoice?.importe_neto || 0),
    iva: Number(invoice?.importe_iva || 0),
    total: Number(invoice?.importe_total || 0),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div
        className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col animate-scale-in"
        style={{
          border: '1px solid rgb(var(--border))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{
            borderColor: 'rgb(var(--border))',
            background: 'linear-gradient(to right, rgb(var(--background)), rgb(var(--background-secondary)))'
          }}
        >
          <div>
            <h2 className="text-lg sm:text-2xl font-bold text-foreground">Generar nota de crédito</h2>
            <p className="text-sm text-foreground-secondary">
              La nota revertirá la factura {safeFormatInvoiceNumber(invoice?.invoice_number)}.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-secondary transition-all duration-200 text-foreground-muted hover:text-foreground"
            aria-label="Cerrar"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <div className="card p-4 bg-background-secondary">
            <h3 className="font-semibold text-sm text-foreground mb-3">Datos de la factura</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-foreground-secondary block text-xs uppercase">Cliente</span>
                <span className="text-foreground font-medium">{invoice?.customer_name || 'Sin datos'}</span>
              </div>
              <div>
                <span className="text-foreground-secondary block text-xs uppercase">Número</span>
                <span className="text-foreground font-medium">{safeFormatInvoiceNumber(invoice?.invoice_number)}</span>
              </div>
              <div>
                <span className="text-foreground-secondary block text-xs uppercase">Fecha</span>
                <span className="text-foreground">{safeFormatDate(invoice?.fecha_emision)}</span>
              </div>
              <div>
                <span className="text-foreground-secondary block text-xs uppercase">Total</span>
                <span className="text-foreground font-medium">
                  ${totals.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3">Motivo *</h3>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              rows={3}
              className="invoice-textarea"
              placeholder="Describí el motivo de la nota de crédito..."
              disabled={loading}
            />
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
          </div>

          <div className="card p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3">Items incluidos</h3>
            {items.length === 0 ? (
              <p className="text-sm text-foreground-secondary">
                No se detectaron items asociados. Se generará una nota por el total de la factura.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const cantidad = Number(item.cantidad || 1);
                  const precio = Number(item.precio_unitario || 0);
                  return (
                    <div key={index} className="flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-foreground">{item.descripcion || `Item ${index + 1}`}</p>
                        <p className="text-foreground-secondary text-xs">
                          Cantidad: {cantidad} • Precio: ${precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })} • IVA: {Number(item.alicuota_iva ?? 21)}%
                        </p>
                      </div>
                      <span className="text-foreground font-medium">
                        ${(cantidad * precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            {loading && (
              <span className="inline-block h-4 w-4 border-2 border-transparent border-t-current rounded-full animate-spin" />
            )}
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de detalles de factura
function InvoiceDetailModal({ invoice, onClose }) {
  const derivedStatus = resolveInvoiceStatus(invoice);
  const items = invoice?.items 
    ? (typeof invoice.items === 'string' 
        ? JSON.parse(invoice.items) 
        : invoice.items)
    : [];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
        style={{
          border: '1px solid rgb(var(--border))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con gradiente sutil */}
        <div 
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{
            borderColor: 'rgb(var(--border))',
            background: 'linear-gradient(to right, rgb(var(--background)), rgb(var(--background-secondary)))'
          }}
        >
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">
            Factura {invoice.invoice_number}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-secondary transition-all duration-200 text-foreground-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

        <div className="space-y-4 sm:space-y-6">
          {/* Info del cliente */}
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Cliente</h3>
            <div className="card p-3 sm:p-4 bg-background-secondary">
              <p className="font-medium text-foreground text-sm sm:text-base">{invoice.customer_name}</p>
              {invoice.customer_doc && (
                <p className="text-xs sm:text-sm text-foreground-secondary mt-1">Doc: {invoice.customer_doc}</p>
              )}
              {invoice.customer_cuit && (
                <p className="text-xs sm:text-sm text-foreground-secondary mt-1">CUIT: {invoice.customer_cuit}</p>
              )}
              {invoice.customer_address && (
                <p className="text-xs sm:text-sm text-foreground-secondary mt-1">Dirección: {invoice.customer_address}</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Items</h3>
            {/* Vista mobile - cards */}
            <div className="block sm:hidden space-y-2">
              {(items || []).map((item, index) => (
                <div key={index} className="card p-3">
                  <div className="font-medium text-foreground text-sm mb-1">{item.descripcion}</div>
                  <div className="flex justify-between text-xs text-foreground-secondary">
                    <span>Cant: {item.cantidad}</span>
                    <span>Precio: ${Number(item.precio_unitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-right mt-1 font-semibold text-foreground text-sm">
                    Total: ${((item.precio_unitario || 0) * (item.cantidad || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
            {/* Vista desktop - tabla */}
            <div className="hidden sm:block card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-border bg-background-secondary">
                      <th className="text-left py-2 px-4 text-sm font-semibold text-foreground">Descripción</th>
                      <th className="text-center py-2 px-4 text-sm font-semibold text-foreground">Cantidad</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-foreground">Precio Unit.</th>
                      <th className="text-right py-2 px-4 text-sm font-semibold text-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(items || []).map((item, index) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-2 px-4 text-foreground">{item.descripcion}</td>
                        <td className="py-2 px-4 text-center text-foreground-secondary">{item.cantidad}</td>
                        <td className="py-2 px-4 text-right text-foreground-secondary">
                          ${Number(item.precio_unitario).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-2 px-4 text-right font-medium text-foreground">
                          ${((item.precio_unitario || 0) * (item.cantidad || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totales */}
          <div className="card p-3 sm:p-4 bg-background-secondary">
            <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
              <span className="text-foreground-secondary">Subtotal:</span>
              <span className="font-medium text-foreground">
                ${Number(invoice.importe_neto).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm sm:text-base">
              <span className="text-foreground-secondary">IVA:</span>
              <span className="font-medium text-foreground">
                ${Number(invoice.importe_iva).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-base sm:text-lg font-semibold text-foreground">Total:</span>
              <span className="text-base sm:text-lg font-bold text-foreground">
                ${Number(invoice.importe_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Información de factura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-3 sm:p-4 bg-background-secondary">
              <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base">Datos de Factura</h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Número:</span>
                  <span className="font-medium text-foreground">{invoice.invoice_number || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Punto de venta:</span>
                  <span className="text-foreground">{invoice.punto_venta || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Tipo:</span>
                  <span className="text-foreground">
                    {invoice.tipo_comprobante === 1 ? 'Factura A' : 
                     invoice.tipo_comprobante === 6 ? 'Factura B' : 
                     invoice.tipo_comprobante === 11 ? 'Factura C' : 
                     `Tipo ${invoice.tipo_comprobante}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Fecha emisión:</span>
                  <span className="text-foreground">
                    {invoice.fecha_emision ? new Date(invoice.fecha_emision).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground-secondary">Estado:</span>
                  <span className="text-foreground">
                    {derivedStatus === 'approved' ? '✓ Aprobada' :
                     derivedStatus === 'pending' ? '⏳ Pendiente' :
                     derivedStatus === 'draft' ? '📝 Borrador' :
                     derivedStatus === 'rejected' ? '✗ Rechazada' :
                     derivedStatus === 'cancelled' ? '🚫 Anulada' :
                     derivedStatus || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info de ARCA */}
            {invoice.cae && invoice.cae !== 'RECHAZADO' ? (
              <div className="card p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <h3 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-3 text-sm sm:text-base flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Información ARCA
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-foreground-secondary">CAE:</span>
                    <span className="font-mono text-foreground break-all text-right">{invoice.cae}</span>
                  </div>
                  {invoice.vto_cae && (
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">Vencimiento CAE:</span>
                      <span className="text-foreground">
                        {new Date(invoice.vto_cae).toLocaleDateString('es-AR', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  {invoice.arca_invoice_id && (
                    <div className="flex justify-between">
                      <span className="text-foreground-secondary">ID ARCA:</span>
                      <span className="font-mono text-foreground text-xs break-all text-right">{invoice.arca_invoice_id}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-3 sm:p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-2 text-sm sm:text-base">Estado ARCA</h3>
                <p className="text-xs sm:text-sm text-foreground-secondary">
                  {derivedStatus === 'pending' ? 'Factura pendiente de autorización' :
                   derivedStatus === 'draft' ? 'Factura en borrador' :
                   derivedStatus === 'rejected' ? 'Factura rechazada. Revisá la información del cliente.' :
                   'No autorizada por ARCA'}
                </p>
              </div>
            )}
          </div>

          {/* Observaciones */}
          {invoice.notes && (
            <div className="card p-3 sm:p-4 bg-background-secondary">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Observaciones</h3>
              <p className="text-xs sm:text-sm text-foreground-secondary whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {/* Links */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {invoice.pdf_url && (
              <a
                href={invoice.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                Descargar PDF
              </a>
            )}
            {invoice.xml_url && (
              <a
                href={invoice.xml_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                Descargar XML
              </a>
            )}
          </div>
        </div>
        </div>

        {/* Footer con botón de cerrar */}
        <div 
          className="flex justify-end px-6 py-4 border-t"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 text-sm sm:text-base"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal para facturar turnos/appointments
function InvoiceAppointmentsModal({ appointments, customers, constants, onClose, onSave }) {
  const [selectedAppointments, setSelectedAppointments] = useState([]);
  const [tipoComprobante, setTipoComprobante] = useState(constants?.COMPROBANTE_TIPOS?.FACTURA_B || 6);
  const [loading, setLoading] = useState(false);
  const [groupByCustomer, setGroupByCustomer] = useState(true);
  const [additionalItems, setAdditionalItems] = useState({}); // { customerId: [{ descripcion, cantidad, precio_unitario }] }
  const [showAddItem, setShowAddItem] = useState({}); // { customerId: true/false }

  const toggleAppointment = (appointmentId) => {
    setSelectedAppointments(prev => 
      prev.includes(appointmentId)
        ? prev.filter(id => id !== appointmentId)
        : [...prev, appointmentId]
    );
  };

  const toggleAll = () => {
    if (selectedAppointments.length === appointments.length) {
      setSelectedAppointments([]);
    } else {
      setSelectedAppointments(appointments.map(apt => apt.id));
    }
  };

  // Agrupar appointments por cliente si está activado
  const groupedAppointments = groupByCustomer 
    ? appointments.reduce((acc, apt) => {
        const customerId = apt.customer_id || apt.customer?.id || 'unknown';
        if (!acc[customerId]) acc[customerId] = [];
        acc[customerId].push(apt);
        return acc;
      }, {})
    : { all: appointments };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getCustomerName = (appointment) => {
    if (appointment.customer?.name) return appointment.customer.name;
    if (appointment.customer_name) return appointment.customer_name;
    const customer = customers.find(c => c.id === appointment.customer_id);
    return customer?.name || "Cliente desconocido";
  };

  const getServiceName = (appointment) => {
    return appointment.service?.name || appointment.service_name || "Servicio";
  };

  const getPrice = (appointment) => {
    return appointment.price || appointment.service?.price || appointment.total || 0;
  };

  const addAdditionalItem = (customerId) => {
    const newItem = { descripcion: '', cantidad: 1, precio_unitario: 0, alicuota_iva: 21 };
    setAdditionalItems(prev => ({
      ...prev,
      [customerId]: [...(prev[customerId] || []), newItem]
    }));
    setShowAddItem(prev => ({ ...prev, [customerId]: false }));
  };

  const removeAdditionalItem = (customerId, index) => {
    setAdditionalItems(prev => ({
      ...prev,
      [customerId]: prev[customerId]?.filter((_, i) => i !== index) || []
    }));
  };

  const updateAdditionalItem = (customerId, index, field, value) => {
    setAdditionalItems(prev => {
      const items = [...(prev[customerId] || [])];
      items[index] = { ...items[index], [field]: field === 'cantidad' || field === 'precio_unitario' ? Number(value) : value };
      return { ...prev, [customerId]: items };
    });
  };

  const calculateTotal = (customerId = null) => {
    let total = 0;
    
    // Sumar turnos seleccionados
    const relevantAppointments = customerId 
      ? selectedAppointments.filter(aptId => {
          const apt = appointments.find(a => a.id === aptId);
          return (apt?.customer_id || apt?.customer?.id) == customerId;
        })
      : selectedAppointments;
    
    total += relevantAppointments.reduce((sum, aptId) => {
      const apt = appointments.find(a => a.id === aptId);
      return sum + (getPrice(apt) || 0);
    }, 0);
    
    // Sumar items adicionales
    if (customerId && additionalItems[customerId]) {
      total += additionalItems[customerId].reduce((sum, item) => {
        return sum + ((item.precio_unitario || 0) * (item.cantidad || 1));
      }, 0);
    } else if (!customerId) {
      // Sumar todos los items adicionales de todos los clientes
      Object.values(additionalItems).forEach(items => {
        total += items.reduce((sum, item) => {
          return sum + ((item.precio_unitario || 0) * (item.cantidad || 1));
        }, 0);
      });
    }
    
    return total;
  };

  const handleInvoiceAll = async () => {
    if (selectedAppointments.length === 0) {
      toast.error("Selecciona al menos un turno");
      return;
    }

    setLoading(true);

    try {
      // Agrupar por cliente si está activado
      if (groupByCustomer) {
        const byCustomer = selectedAppointments.reduce((acc, aptId) => {
          const apt = appointments.find(a => a.id === aptId);
          const customerId = apt.customer_id || apt.customer?.id || 'unknown';
          if (!acc[customerId]) acc[customerId] = [];
          acc[customerId].push(apt);
          return acc;
        }, {});

        // Crear una factura por cada cliente
        for (const [customerId, customerAppointments] of Object.entries(byCustomer)) {
          const customer = customers.find(c => c.id === Number(customerId)) || 
                          customerAppointments[0]?.customer || 
                          { id: customerId, name: "Cliente", documento: "00000000" };

          // Items de turnos
          const appointmentItems = customerAppointments.map(apt => ({
            descripcion: `${getServiceName(apt)} - ${formatDate(apt.start_time || apt.date)}`,
            cantidad: 1,
            precio_unitario: getPrice(apt),
            alicuota_iva: 21
          }));

          // Items adicionales del cliente
          const extraItems = (additionalItems[customerId] || []).filter(item => 
            item.descripcion && item.precio_unitario > 0
          );

          // Combinar todos los items
          const items = [...appointmentItems, ...extraItems];

          const importe_neto = items.reduce((sum, item) => sum + (item.precio_unitario * (item.cantidad || 1)), 0);
          const importe_iva = importe_neto * 0.21;
          const importe_total = importe_neto + importe_iva;

          await apiClient.post("/api/invoicing/arca/generate", {
            tipo_comprobante: tipoComprobante,
            customer_id: customer.id,
            items: items,
            importe_neto: importe_neto,
            importe_iva: importe_iva,
            importe_total: importe_total,
            concepto: constants?.CONCEPTOS?.SERVICIOS || 2,
            tipo_doc_cliente: customer.documento?.length === 11 ? 80 : 96, // CUIT o DNI
            doc_cliente: customer.documento || "00000000",
            razon_social: customer.name || "Consumidor Final",
            condicion_iva: constants?.CONDICIONES_IVA?.CONSUMIDOR_FINAL || 5,
            appointment_ids: customerAppointments.map(apt => apt.id), // IDs de turnos facturados
          });
        }
      } else {
        // Crear una sola factura con todos los turnos
        const firstCustomer = appointments.find(a => selectedAppointments.includes(a.id))?.customer || 
                             appointments.find(a => selectedAppointments.includes(a.id)) || 
                             customers[0];

        // Items de turnos
        const appointmentItems = selectedAppointments.map(aptId => {
          const apt = appointments.find(a => a.id === aptId);
          return {
            descripcion: `${getServiceName(apt)} - ${formatDate(apt.start_time || apt.date)}`,
            cantidad: 1,
            precio_unitario: getPrice(apt),
            alicuota_iva: 21
          };
        });

        // Items adicionales (si hay)
        const extraItems = Object.values(additionalItems).flat().filter(item => 
          item.descripcion && item.precio_unitario > 0
        );

        // Combinar todos los items
        const items = [...appointmentItems, ...extraItems];

        const importe_neto = items.reduce((sum, item) => sum + (item.precio_unitario * (item.cantidad || 1)), 0);
        const importe_iva = importe_neto * 0.21;
        const importe_total = importe_neto + importe_iva;

        const appointmentIds = selectedAppointments.map(aptId => {
          const apt = appointments.find(a => a.id === aptId);
          return apt?.id;
        }).filter(Boolean);

        await apiClient.post("/api/invoicing/arca/generate", {
          tipo_comprobante: tipoComprobante,
          customer_id: firstCustomer.id,
          items: items,
          importe_neto: importe_neto,
          importe_iva: importe_iva,
          importe_total: importe_total,
          concepto: constants?.CONCEPTOS?.SERVICIOS || 2,
          appointment_ids: appointmentIds, // IDs de turnos facturados
        });
      }

      toast.success(`${selectedAppointments.length} turno(s) facturado(s) correctamente`);
      
      // Recargar appointments y facturas
      refetchAppointments();
      refetch();
      
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al facturar turnos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--border))' }}>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Facturar Turnos</h2>
            <p className="text-sm text-foreground-secondary mt-1">
              Selecciona los turnos que deseas facturar
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Opciones */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupByCustomer}
                  onChange={(e) => setGroupByCustomer(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Agrupar por cliente</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-foreground font-medium">Tipo:</label>
              <select
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(Number(e.target.value))}
                className="input w-auto"
              >
                <option value={constants?.COMPROBANTE_TIPOS?.FACTURA_A || 1}>Factura A</option>
                <option value={constants?.COMPROBANTE_TIPOS?.FACTURA_B || 6}>Factura B</option>
                <option value={constants?.COMPROBANTE_TIPOS?.FACTURA_C || 11}>Factura C</option>
              </select>
            </div>
          </div>

          {/* Lista de turnos */}
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-foreground-muted" />
              <p className="text-foreground-secondary">No hay turnos pendientes de facturar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select all */}
              <div className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedAppointments.length === appointments.length && appointments.length > 0}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Seleccionar todos</span>
                </label>
                <span className="text-sm text-foreground-secondary">
                  {selectedAppointments.length} de {appointments.length} seleccionados
                </span>
              </div>

              {/* Grupos por cliente */}
              {Object.entries(groupedAppointments).map(([customerId, customerAppointments]) => {
                const customer = customers.find(c => c.id === Number(customerId)) || 
                               customerAppointments[0]?.customer || 
                               { name: "Cliente desconocido" };
                
                const selectedCount = customerAppointments.filter(apt => selectedAppointments.includes(apt.id)).length;
                const customerTotal = calculateTotal(customerId);
                const hasSelected = selectedCount > 0;
                
                return (
                  <div key={customerId} className="border rounded-lg overflow-hidden" style={{ borderColor: 'rgb(var(--border))' }}>
                    {groupByCustomer && (
                      <div className="px-4 py-3 bg-background-secondary border-b flex items-center justify-between" style={{ borderColor: 'rgb(var(--border))' }}>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">{customer.name || "Cliente"}</h3>
                          {customer.documento && (
                            <p className="text-xs text-foreground-secondary mt-1">Doc: {customer.documento}</p>
                          )}
                        </div>
                        {hasSelected && (
                          <div className="text-right">
                            <p className="text-xs text-foreground-secondary">Total cliente:</p>
                            <p className="text-sm font-bold text-foreground">
                              ${Number(customerTotal).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Turnos del cliente */}
                    <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
                      {customerAppointments.map((apt) => (
                        <label
                          key={apt.id}
                          className="flex items-center gap-3 p-3 hover:bg-background-secondary cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAppointments.includes(apt.id)}
                            onChange={() => toggleAppointment(apt.id)}
                            className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-foreground">{getServiceName(apt)}</span>
                                {apt.stylist?.name && (
                                  <span className="text-xs text-foreground-secondary ml-2">- {apt.stylist.name}</span>
                                )}
                              </div>
                              <span className="font-semibold text-foreground">
                                ${Number(getPrice(apt)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className="text-xs text-foreground-secondary mt-1">
                              {formatDate(apt.start_time || apt.date)}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Items adicionales del cliente */}
                    {hasSelected && groupByCustomer && (
                      <div className="px-4 py-3 bg-background-secondary/50 border-t" style={{ borderColor: 'rgb(var(--border))' }}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-foreground">Consumos adicionales</h4>
                          <button
                            type="button"
                            onClick={() => setShowAddItem(prev => ({ ...prev, [customerId]: !prev[customerId] }))}
                            className="text-xs px-2 py-1 rounded text-primary hover:bg-primary/10 transition-colors"
                          >
                            {showAddItem[customerId] ? 'Cancelar' : '+ Agregar'}
                          </button>
                        </div>

                        {/* Formulario para agregar item */}
                        {showAddItem[customerId] && (
                          <div className="mb-3 p-3 bg-background rounded border" style={{ borderColor: 'rgb(var(--border))' }}>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <input
                                type="text"
                                placeholder="Descripción (ej: Producto, Servicio extra)"
                                className="input sm:col-span-5 text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addAdditionalItem(customerId);
                                  }
                                }}
                                onChange={(e) => {
                                  const items = additionalItems[customerId] || [];
                                  if (items.length === 0) {
                                    addAdditionalItem(customerId);
                                  }
                                  updateAdditionalItem(customerId, items.length - 1, 'descripcion', e.target.value);
                                }}
                              />
                              <input
                                type="number"
                                placeholder="Cantidad"
                                min="1"
                                step="1"
                                className="input sm:col-span-2 text-sm"
                                onChange={(e) => {
                                  const items = additionalItems[customerId] || [];
                                  if (items.length > 0) {
                                    updateAdditionalItem(customerId, items.length - 1, 'cantidad', e.target.value);
                                  }
                                }}
                              />
                              <input
                                type="number"
                                placeholder="Precio"
                                min="0"
                                step="0.01"
                                className="input sm:col-span-3 text-sm"
                                onChange={(e) => {
                                  const items = additionalItems[customerId] || [];
                                  if (items.length > 0) {
                                    updateAdditionalItem(customerId, items.length - 1, 'precio_unitario', e.target.value);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => addAdditionalItem(customerId)}
                                className="btn-primary sm:col-span-2 text-sm py-2"
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Lista de items adicionales */}
                        {(additionalItems[customerId] || []).length > 0 && (
                          <div className="space-y-2">
                            {additionalItems[customerId].map((item, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border" style={{ borderColor: 'rgb(var(--border))' }}>
                                <input
                                  type="text"
                                  value={item.descripcion || ''}
                                  placeholder="Descripción"
                                  className="input flex-1 text-sm"
                                  onChange={(e) => updateAdditionalItem(customerId, index, 'descripcion', e.target.value)}
                                />
                                <input
                                  type="number"
                                  value={item.cantidad || 1}
                                  min="1"
                                  step="1"
                                  className="input w-20 text-sm"
                                  onChange={(e) => updateAdditionalItem(customerId, index, 'cantidad', e.target.value)}
                                />
                                <input
                                  type="number"
                                  value={item.precio_unitario || 0}
                                  min="0"
                                  step="0.01"
                                  className="input w-24 text-sm"
                                  onChange={(e) => updateAdditionalItem(customerId, index, 'precio_unitario', e.target.value)}
                                />
                                <span className="text-sm font-medium text-foreground w-20 text-right">
                                  ${Number((item.precio_unitario || 0) * (item.cantidad || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeAdditionalItem(customerId, index)}
                                  className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-background-secondary" style={{ borderColor: 'rgb(var(--border))' }}>
          <div>
            <span className="text-sm text-foreground-secondary">Total seleccionado:</span>
            <span className="text-lg font-bold text-foreground ml-2">
              ${Number(calculateTotal()).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-foreground bg-background hover:bg-background-secondary border border-border transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleInvoiceAll}
              disabled={loading || selectedAppointments.length === 0}
              className="px-5 py-2 rounded-lg font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Facturando...
                </span>
              ) : (
                `Facturar ${selectedAppointments.length} turno(s)`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

