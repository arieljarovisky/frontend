import { useState } from "react";
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
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

export default function InvoicingPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Cargar facturas
  const { data: invoices = [], loading, error, refetch } = useQuery(
    async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      
      const response = await apiClient.get(`/api/invoicing/invoices?${params}`);
      return response.data?.data || [];
    },
    [statusFilter]
  );

  // Cargar constantes
  const { data: constants } = useQuery(
    async () => {
      const response = await apiClient.get("/api/invoicing/constants");
      return response.data?.data || {};
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
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Nueva Factura</span>
        </button>
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
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Total:</span>
                    <span className="text-foreground font-semibold">
                      ${Number(invoice.importe_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="text-foreground-secondary">Estado:</span>
                    {getStatusBadge(invoice.status)}
                  </div>
                  {invoice.cae && (
                    <div className="text-xs text-foreground-muted">
                      CAE: {invoice.cae.slice(0, 12)}...
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
                        {formatInvoiceNumber(invoice.invoice_number)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-foreground">{invoice.customer_name}</div>
                        {invoice.customer_doc && (
                          <div className="text-xs text-foreground-muted">
                            Doc: {invoice.customer_doc}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">
                        {formatDate(invoice.fecha_emision)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">
                        ${Number(invoice.importe_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(invoice.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {invoice.cae ? (
                          <span className="text-xs text-foreground-muted">
                            {invoice.cae.slice(0, 8)}...
                          </span>
                        ) : (
                          <span className="text-xs text-foreground-muted">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
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
          customers={customers}
          constants={constants}
          onClose={() => setShowModal(false)}
          onSave={() => {
            refetch();
            setShowModal(false);
          }}
        />
      )}

      {/* Modal de detalles */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}

// Modal para crear factura
function InvoiceModal({ customers, constants, onClose, onSave }) {
  const [formData, setFormData] = useState({
    tipo_comprobante: constants?.COMPROBANTE_TIPOS?.FACTURA_B || 6,
    customer_id: "",
    items: [{ descripcion: "", cantidad: 1, precio_unitario: 0, alicuota_iva: 21 }],
    observaciones: "",
  });
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const handleCustomerChange = (customerId) => {
    const customer = customers.find(c => c.id === Number(customerId));
    setSelectedCustomer(customer);
    setFormData({ ...formData, customer_id: customerId });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...(formData.items || []), { descripcion: "", cantidad: 1, precio_unitario: 0, alicuota_iva: 21 }]
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: (formData.items || []).filter((_, i) => i !== index)
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...(formData.items || [])];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
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
      total: Math.round((neto + iva) * 100) / 100
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.customer_id) {
      toast.error("Selecciona un cliente");
      return;
    }

    if (!formData.items || formData.items.length === 0 || formData.items.some(item => !item.descripcion || item.precio_unitario <= 0)) {
      toast.error("Completa todos los items");
      return;
    }

    setLoading(true);

    try {
      await apiClient.post("/api/invoicing/arca/generate", {
        ...formData,
        importe_neto: totals.neto,
        importe_iva: totals.iva,
        importe_total: totals.total,
      });
      toast.success("Factura generada correctamente");
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al generar factura");
    } finally {
      setLoading(false);
    }
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
        className="bg-background rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Nueva Factura</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Tipo de Comprobante <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipo_comprobante}
                onChange={(e) => setFormData({ ...formData, tipo_comprobante: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
                required
              >
                <option value={constants?.COMPROBANTE_TIPOS?.FACTURA_A || 1}>
                  Factura A
                </option>
                <option value={constants?.COMPROBANTE_TIPOS?.FACTURA_B || 6}>
                  Factura B
                </option>
                <option value={constants?.COMPROBANTE_TIPOS?.FACTURA_C || 11}>
                  Factura C
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem'
                }}
                required
              >
                <option value="">Seleccionar cliente</option>
                {(customers || []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name || customer.full_name} {customer.phone ? `- ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-foreground">
                Items *
              </label>
              <button
                type="button"
                onClick={addItem}
                className="btn-secondary text-sm"
              >
                Agregar Item
              </button>
            </div>

            <div className="space-y-3">
              {(formData.items || []).map((item, index) => (
                <div key={index} className="card p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
                    <div className="col-span-1 sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Descripción"
                        value={item.descripcion}
                        onChange={(e) => updateItem(index, "descripcion", e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                        required
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <input
                        type="number"
                        placeholder="Cantidad"
                        value={item.cantidad}
                        onChange={(e) => updateItem(index, "cantidad", Number(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Precio"
                        value={item.precio_unitario}
                        onChange={(e) => updateItem(index, "precio_unitario", parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                        min="0"
                        required
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-2">
                      <input
                        type="number"
                        placeholder="IVA %"
                        value={item.alicuota_iva}
                        onChange={(e) => updateItem(index, "alicuota_iva", Number(e.target.value) || 21)}
                        className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="col-span-1 sm:col-span-1 flex items-center justify-end sm:justify-start">
                      {formData.items && formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-xl leading-none"
                          aria-label="Eliminar item"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs sm:text-sm text-foreground-secondary break-words">
                    <span className="block sm:inline">Subtotal: ${((item.precio_unitario || 0) * (item.cantidad || 1)).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                    <span className="block sm:inline sm:ml-2">+ IVA: ${(((item.precio_unitario || 0) * (item.cantidad || 1)) * (item.alicuota_iva || 21) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totales */}
          <div className="card p-4 bg-background-secondary">
            <div className="flex justify-between items-center mb-2">
              <span className="text-foreground-secondary">Subtotal:</span>
              <span className="font-medium text-foreground">
                ${totals.neto.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-foreground-secondary">IVA:</span>
              <span className="font-medium text-foreground">
                ${totals.iva.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-lg font-semibold text-foreground">Total:</span>
              <span className="text-lg font-bold text-foreground">
                ${totals.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base resize-none"
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>

        </form>
        </div>

        {/* Footer con botones */}
        <div 
          className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-medium text-foreground-secondary bg-background-secondary hover:bg-border transition-all duration-200 text-sm sm:text-base"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Generando...
              </span>
            ) : (
              "Generar Factura"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal de detalles de factura
function InvoiceDetailModal({ invoice, onClose }) {
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

          {/* Info de ARCA */}
          {invoice.cae && (
            <div className="card p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800">
              <h3 className="font-semibold text-foreground mb-2 text-sm sm:text-base">Información ARCA</h3>
              <div className="space-y-1 text-xs sm:text-sm">
                <p><span className="text-foreground-secondary">CAE:</span> <span className="font-mono text-foreground break-all">{invoice.cae}</span></p>
                {invoice.vto_cae && (
                  <p><span className="text-foreground-secondary">Vencimiento CAE:</span> <span className="text-foreground">{new Date(invoice.vto_cae).toLocaleDateString('es-AR')}</span></p>
                )}
                <p><span className="text-foreground-secondary">Fecha emisión:</span> <span className="text-foreground">{new Date(invoice.fecha_emision).toLocaleString('es-AR')}</span></p>
              </div>
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

