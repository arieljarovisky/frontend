import { useState, useEffect } from "react";
import { useQuery } from "../../shared/useQuery.js";
import { apiClient } from "../../api";
import {
  DollarSign,
  Receipt,
  CreditCard,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AccountingPage() {
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [typeFilter, setTypeFilter] = useState("all"); // all, deposits, cash, invoices
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Cargar señas
  const { data: depositsData, loading: loadingDeposits, refetch: refetchDeposits } = useQuery(
    async () => {
      const params = {
        from: dateFrom,
        to: dateTo,
      };
      const { data } = await apiClient.get("/api/admin/deposits/pending", { params });
      return data;
    },
    [dateFrom, dateTo]
  );

  // Cargar cierres de caja
  const { data: closuresData, loading: loadingClosures, refetch: refetchClosures } = useQuery(
    async () => {
      const params = {
        from: dateFrom,
        to: dateTo,
      };
      const { data } = await apiClient.get("/api/cash-register/closures", { params });
      return data;
    },
    [dateFrom, dateTo]
  );

  // Cargar facturas
  const { data: invoicesData, loading: loadingInvoices, refetch: refetchInvoices } = useQuery(
    async () => {
      const params = {
        from: dateFrom,
        to: dateTo,
      };
      const { data } = await apiClient.get("/api/invoicing/invoices", { params });
      return data;
    },
    [dateFrom, dateTo]
  );

  const deposits = depositsData?.data || [];
  const closures = closuresData?.data || [];
  const invoices = invoicesData?.data || [];

  // Combinar todos los registros
  const allRecords = [
    ...deposits.map(d => ({
      id: `deposit-${d.id}`,
      type: "deposit",
      typeLabel: "Seña",
      date: d.created_at || d.createdAt,
      amount: parseFloat(d.deposit_decimal || d.amount || 0),
      customer: d.customer_name || d.customer?.name || "Sin cliente",
      description: `Seña para turno ${d.appointment_id || ""}`,
      status: d.status || "pending",
      statusLabel: d.status === "paid" ? "Pagado" : d.status === "cancelled" ? "Cancelado" : "Pendiente",
      paymentMethod: d.payment_method || "N/A",
      data: d,
    })),
    ...closures.flatMap(c => {
      const records = [];
      if (c.cash_total > 0) {
        records.push({
          id: `cash-${c.id}-cash`,
          type: "cash",
          typeLabel: "Efectivo",
          date: c.closure_date || c.created_at,
          amount: parseFloat(c.cash_total || 0),
          customer: "Caja",
          description: `Cierre de caja - ${c.branch_name || ""}`,
          status: c.status || "closed",
          statusLabel: c.status === "closed" ? "Cerrado" : "Abierto",
          paymentMethod: "Efectivo",
          data: c,
        });
      }
      if (c.card_total > 0) {
        records.push({
          id: `cash-${c.id}-card`,
          type: "cash",
          typeLabel: "Tarjeta",
          date: c.closure_date || c.created_at,
          amount: parseFloat(c.card_total || 0),
          customer: "Caja",
          description: `Cierre de caja - ${c.branch_name || ""}`,
          status: c.status || "closed",
          statusLabel: c.status === "closed" ? "Cerrado" : "Abierto",
          paymentMethod: "Tarjeta",
          data: c,
        });
      }
      return records;
    }),
    ...invoices.map(i => ({
      id: `invoice-${i.id}`,
      type: "invoice",
      typeLabel: "Factura",
      date: i.fecha_emision || i.fecha || i.created_at,
      amount: parseFloat(i.importe_total || i.total || 0),
      customer: i.customer_name || i.customer?.name || i.razon_social || "Consumidor Final",
      description: `Factura ${i.numero_comprobante || i.numero || ""}`,
      status: i.status || "draft",
      statusLabel: i.status === "approved" ? "Aprobada" : i.status === "rejected" ? "Rechazada" : "Borrador",
      paymentMethod: "Facturación",
      data: i,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Filtrar registros
  const filteredRecords = allRecords.filter(record => {
    const matchesSearch = !search || 
      record.customer.toLowerCase().includes(search.toLowerCase()) ||
      record.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "all" || record.type === typeFilter;
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "paid" && record.status === "paid") ||
      (statusFilter === "pending" && (record.status === "pending" || record.status === "open")) ||
      (statusFilter === "closed" && record.status === "closed") ||
      (statusFilter === "approved" && record.status === "approved");

    return matchesSearch && matchesType && matchesStatus;
  });

  // Paginación
  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecords = filteredRecords.slice(startIndex, endIndex);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter, dateFrom, dateTo]);

  // Calcular totales
  const totals = filteredRecords.reduce((acc, record) => {
    if (record.status !== "cancelled" && record.status !== "rejected") {
      acc.total += record.amount;
      if (record.type === "deposit") acc.deposits += record.amount;
      if (record.type === "cash") acc.cash += record.amount;
      if (record.type === "invoice") acc.invoices += record.amount;
    }
    return acc;
  }, { total: 0, deposits: 0, cash: 0, invoices: 0 });

  const loading = loadingDeposits || loadingClosures || loadingInvoices;

  const handleRefresh = () => {
    refetchDeposits();
    refetchClosures();
    refetchInvoices();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Registro Contable</h1>
          <p className="text-foreground-muted mt-1">
            Visualización unificada de señas, pagos en efectivo y facturas
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn-ghost"
          disabled={loading}
        >
          <Download className="w-4 h-4 mr-2" />
          Actualizar
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Total General</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${totals.total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Señas</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${totals.deposits.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <Clock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Efectivo/Tarjeta</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${totals.cash.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <CreditCard className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground-muted">Facturas</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${totals.invoices.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
              </p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground mb-2">
              Buscar
            </label>
            <div className="input-group">
              <span className="input-group__icon">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cliente, descripción..."
                className="input input--with-icon"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tipo
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input"
            >
              <option value="all">Todos</option>
              <option value="deposit">Señas</option>
              <option value="cash">Efectivo/Tarjeta</option>
              <option value="invoice">Facturas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="all">Todos</option>
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="closed">Cerrado</option>
              <option value="approved">Aprobado</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Desde
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="input"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de registros */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-foreground">Fecha</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Cliente</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Descripción</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Método de Pago</th>
                <th className="text-right p-4 text-sm font-medium text-foreground">Monto</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Estado</th>
                <th className="text-left p-4 text-sm font-medium text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-foreground-muted">
                    Cargando registros...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-foreground-muted">
                    No se encontraron registros para los filtros seleccionados
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((record) => (
                  <tr key={record.id} className="border-b border-border hover:bg-background-secondary">
                    <td className="p-4 text-sm text-foreground">
                      {format(new Date(record.date), "dd/MM/yyyy HH:mm", { locale: es })}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        record.type === "deposit" ? "badge-warning" :
                        record.type === "cash" ? "badge-success" :
                        "badge-primary"
                      }`}>
                        {record.typeLabel}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-foreground">{record.customer}</td>
                    <td className="p-4 text-sm text-foreground">{record.description}</td>
                    <td className="p-4 text-sm text-foreground-muted">{record.paymentMethod}</td>
                    <td className="p-4 text-right text-sm font-medium text-foreground">
                      ${record.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`badge ${
                        record.status === "paid" || record.status === "approved" || record.status === "closed" 
                          ? "badge-success" 
                          : record.status === "cancelled" || record.status === "rejected"
                          ? "badge-danger"
                          : "badge-warning"
                      }`}>
                        {record.statusLabel}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => {
                          // Aquí puedes agregar un modal para ver detalles
                          toast.info("Ver detalles de " + record.typeLabel);
                        }}
                        className="btn-ghost btn--compact"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {filteredRecords.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <div className="flex items-center gap-4">
              <span className="text-sm text-foreground-muted">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredRecords.length)} de {filteredRecords.length} registros
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="input text-sm"
              >
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
                <option value={100}>100 por página</option>
                <option value={200}>200 por página</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="btn-ghost btn--compact disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-white"
                          : "bg-background-secondary text-foreground hover:bg-border"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="btn-ghost btn--compact disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

