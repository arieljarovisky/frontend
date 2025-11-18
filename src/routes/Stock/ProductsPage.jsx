import { useState, useEffect } from "react";
import { useQuery } from "../../shared/useQuery.js";
import { apiClient } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2,
  TrendingDown,
  TrendingUp,
  Filter,
  Folder,
  X,
  ArrowRightLeft
} from "lucide-react";
import { toast } from "sonner";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showTotalStock, setShowTotalStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [transferProduct, setTransferProduct] = useState(null);
  const { user } = useAuth();
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setBranchesLoading(true);
        const response = await apiClient.listActiveBranches();
        if (!mounted) return;
        setBranches(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("[ProductsPage] loadBranches error", error);
        toast.error("No se pudieron cargar las sucursales");
      } finally {
        if (mounted) setBranchesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Cargar productos
  const { data: products = [], loading, error, refetch } = useQuery(
    async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (showLowStock) params.append("min_stock", "true");
      if (showTotalStock) params.append("mode", "all");
      
      const response = await apiClient.get(`/api/stock/products?${params}`);
      return response.data?.data || [];
    },
    [search, categoryFilter, showLowStock, showTotalStock]
  );

  // Cargar categorías
  const {
    data: categories = [],
    refetch: refetchCategories,
  } = useQuery(
    async () => {
      const response = await apiClient.get("/api/stock/categories");
      return response.data?.data || [];
    },
    []
  );

  // Productos con stock bajo
  const { data: lowStockProducts = [] } = useQuery(
    async () => {
      const response = await apiClient.get("/api/stock/low-stock");
      return response.data?.data || [];
    },
    []
  );

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;

    try {
      await apiClient.delete(`/api/stock/products/${id}`);
      toast.success("Producto eliminado");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar");
    }
  };

  const getStockStatus = (product) => {
    if (product.stock_quantity <= 0) {
      return { color: "text-red-500", label: "Sin stock", icon: AlertTriangle };
    }
    if (product.min_stock > 0 && product.stock_quantity <= product.min_stock) {
      return { color: "text-amber-500", label: "Stock bajo", icon: TrendingDown };
    }
    return { color: "text-emerald-500", label: "En stock", icon: TrendingUp };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Gestión de Stock</h1>
          <p className="text-sm sm:text-base text-foreground-secondary">
            Administra tu inventario de productos
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCategoryModal(true)}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Folder className="w-4 h-4" />
            Categorías
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-sm sm:text-base">Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <div className="card p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <p className="font-semibold text-foreground">
                {lowStockProducts.length} producto{lowStockProducts.length > 1 ? 's' : ''} con stock bajo
              </p>
              <p className="text-sm text-foreground-secondary">
                Revisa el inventario para evitar desabastecimiento
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card border border-primary/15 bg-gradient-to-br from-background-secondary/70 via-background-secondary/40 to-primary/5 p-5 shadow-[0_18px_40px_rgba(8,20,36,0.35)] backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-end gap-5">
          <div className="flex-1">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted mb-2">
              Buscar producto
            </span>
            <div className="input-group">
              <span className="input-group__icon text-primary/70">
                <Search className="w-5 h-5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, código o código de barras..."
                className="input input--with-icon h-12 pr-4 rounded-xl border border-transparent bg-background/65 transition-all focus:bg-background/90 focus:border-primary/60 focus:ring-2 focus:ring-primary/40 shadow-inner shadow-black/10"
              />
            </div>
          </div>

          <div className="w-full sm:w-60">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted mb-2">
              Categoría
            </span>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input h-12 w-full rounded-xl border border-transparent bg-background/65 pr-10 transition-all focus:bg-background/90 focus:border-primary/60 focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Todas las categorías</option>
                {(categories || []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.585l3.71-3.354a.75.75 0 011.02 1.1l-4.2 3.8a.75.75 0 01-1.02 0l-4.2-3.8a.75.75 0 01.02-1.1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted mb-2">
              Estado
            </span>
            <label
              className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer border transition-all duration-200 ${
                showLowStock
                  ? "bg-primary/12 border-primary/40 shadow-[0_12px_25px_rgba(24,182,208,0.25)]"
                  : "bg-background/65 border-transparent hover:border-primary/25"
              }`}
            >
              <span className="relative inline-flex h-5 w-10 items-center">
                <input
                  type="checkbox"
                  checked={showLowStock}
                  onChange={(e) => setShowLowStock(e.target.checked)}
                  className="peer absolute h-full w-full cursor-pointer opacity-0"
                />
                <span className="block h-full w-full rounded-full bg-border/70 transition-colors duration-200 peer-checked:bg-primary/60" />
                <span className="pointer-events-none absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background shadow-md transition-all duration-200 peer-checked:translate-x-5" />
              </span>
              <span
                className={`text-sm font-medium transition-colors ${
                  showLowStock ? "text-primary/90" : "text-foreground-secondary"
                }`}
              >
                Solo stock bajo
              </span>
            </label>
          </div>

          {branches.length > 1 && (
            <div className="w-full sm:w-auto">
              <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground-muted mb-2">
                Vista de Stock
              </span>
              <label
                className={`flex items-center gap-3 rounded-xl px-4 py-3 cursor-pointer border transition-all duration-200 ${
                  showTotalStock
                    ? "bg-primary/12 border-primary/40 shadow-[0_12px_25px_rgba(24,182,208,0.25)]"
                    : "bg-background/65 border-transparent hover:border-primary/25"
                }`}
              >
                <span className="relative inline-flex h-5 w-10 items-center">
                  <input
                    type="checkbox"
                    checked={showTotalStock}
                    onChange={(e) => setShowTotalStock(e.target.checked)}
                    className="peer absolute h-full w-full cursor-pointer opacity-0"
                  />
                  <span className="block h-full w-full rounded-full bg-border/70 transition-colors duration-200 peer-checked:bg-primary/60" />
                  <span className="pointer-events-none absolute left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-background shadow-md transition-all duration-200 peer-checked:translate-x-5" />
                </span>
                <span
                  className={`text-sm font-medium transition-colors ${
                    showTotalStock ? "text-primary/90" : "text-foreground-secondary"
                  }`}
                >
                  Stock total
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de productos */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Cargando productos...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-red-500">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-secondary">No hay productos</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mt-4"
          >
            Crear primer producto
          </button>
        </div>
      ) : (
        <>
          {/* Vista de cards en mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4">
            {(products || []).map((product) => {
              const status = getStockStatus(product);
              const StatusIcon = status.icon;
              return (
                <div key={product.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-foreground-muted line-clamp-2 mt-1">{product.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {branches.length > 1 && (
                        <button
                          onClick={() => {
                            setTransferProduct(product);
                            setShowTransferModal(true);
                          }}
                          className="p-2 rounded-lg text-foreground-secondary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          title="Transferir entre sucursales"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowModal(true);
                        }}
                        className="p-2 rounded-lg text-foreground-secondary hover:text-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg text-foreground-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-secondary">Código:</span>
                      <span className="text-foreground font-medium">{product.code || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-secondary">Categoría:</span>
                      <span className="text-foreground">{product.category_name || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-secondary">Stock:</span>
                      <span className="text-foreground font-medium">{product.stock_quantity}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-secondary">Precio:</span>
                      <span className="text-foreground font-semibold">${Number(product.price).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-secondary">Sucursal:</span>
                      <span className="text-foreground text-xs font-medium">
                        {showTotalStock && product.branch_name && product.branch_name.includes(',') 
                          ? "Múltiples sucursales" 
                          : (product.branch_name || "Sin asignar")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-foreground-secondary">Estado:</span>
                      <div className={`inline-flex items-center gap-1 ${status.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-xs">{status.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista de tabla en desktop */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-background-secondary">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Producto</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Código</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Categoría</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Sucursal</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                      Stock {showTotalStock && branches.length > 1 && <span className="text-xs font-normal text-foreground-muted">(Total)</span>}
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Precio</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(products || []).map((product) => {
                    const status = getStockStatus(product);
                    const StatusIcon = status.icon;
                    return (
                      <tr
                        key={product.id}
                        className="border-b border-border hover:bg-background-secondary transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-foreground-muted">{product.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">
                          {product.code || "-"}
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground-secondary">
                          {product.category_name || "-"}
                        </td>
                    <td className="py-3 px-4 text-sm text-foreground-secondary">
                      {showTotalStock && product.branch_name && product.branch_name.includes(',') 
                        ? "Múltiples sucursales" 
                        : (product.branch_name || "Sin asignar")}
                    </td>
                        <td className="py-3 px-4 text-right">
                          <div className="font-medium text-foreground">{product.stock_quantity}</div>
                          {product.min_stock > 0 && (
                            <div className="text-xs text-foreground-muted">
                              Mín: {product.min_stock}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-foreground">
                          ${Number(product.price).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className={`inline-flex items-center gap-1 ${status.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-xs">{status.label}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            {branches.length > 1 && (
                              <button
                                onClick={() => {
                                  setTransferProduct(product);
                                  setShowTransferModal(true);
                                }}
                                className="p-2 rounded-lg text-foreground-secondary hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Transferir entre sucursales"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setShowModal(true);
                              }}
                              className="p-2 rounded-lg text-foreground-secondary hover:text-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-2 rounded-lg text-foreground-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal de producto */}
      {showModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          branches={branches}
          branchesLoading={branchesLoading}
          defaultBranchId={user?.currentBranchId || user?.current_branch_id || null}
          onClose={() => {
            setShowModal(false);
            setEditingProduct(null);
          }}
          onSave={() => {
            refetch();
            setShowModal(false);
            setEditingProduct(null);
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryModal
          categories={categories}
          onClose={() => setShowCategoryModal(false)}
          onUpdated={() => refetchCategories()}
        />
      )}

      {showTransferModal && (
        <TransferModal
          product={transferProduct}
          branches={branches}
          onClose={() => {
            setShowTransferModal(false);
            setTransferProduct(null);
          }}
          onSuccess={() => {
            refetch();
            setShowTransferModal(false);
            setTransferProduct(null);
          }}
        />
      )}
    </div>
  );
}

// Modal para crear/editar producto
function ProductModal({ product, categories, branches, branchesLoading, defaultBranchId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: product?.name || "",
    code: product?.code || "",
    description: product?.description || "",
    category: product?.category || "",
    brand: product?.brand || "",
    price: product?.price || 0,
    cost: product?.cost || 0,
    stock_quantity: product?.stock_quantity || 0,
    min_stock: product?.min_stock || 0,
    max_stock: product?.max_stock || 0,
    unit: product?.unit || "unidad",
    barcode: product?.barcode || "",
    sku: product?.sku || "",
    image_url: product?.image_url || "",
    branch_id: product?.branch_id || defaultBranchId || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        branchId: formData.branch_id || null,
      };

      if (product) {
        await apiClient.put(`/api/stock/products/${product.id}`, payload);
        toast.success("Producto actualizado");
      } else {
        await apiClient.post("/api/stock/products", payload);
        toast.success("Producto creado");
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al guardar");
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
        className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
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
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {product ? "Editar Producto" : "Nuevo Producto"}
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Sucursal
                </label>
                <select
                  value={formData.branch_id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, branch_id: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  disabled={branchesLoading || branches.length === 0}
                >
                  {branches.length === 0 ? (
                    <option value="">
                      {branchesLoading ? "Cargando..." : "No hay sucursales activas"}
                    </option>
                  ) : (
                    <>
                      <option value="">Seleccionar sucursal</option>
                      {branches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              {/* Nombre - Full width */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  placeholder="Ej: Shampoo Profesional"
                  required
                />
              </div>

              {/* Código */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  placeholder="Código interno"
                />
              </div>

              {/* Categoría */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">Sin categoría</option>
                  {(categories || []).map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Marca */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Marca
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  placeholder="Nombre de la marca"
                />
              </div>

              {/* Precio de Venta */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Precio de Venta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Costo */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Costo
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground-muted">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Stock Actual */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Stock Actual
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  placeholder="0"
                />
              </div>

              {/* Stock Mínimo */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({ ...formData, min_stock: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  placeholder="0"
                />
              </div>

              {/* Unidad */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Unidad
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kilogramo</option>
                  <option value="litro">Litro</option>
                  <option value="metro">Metro</option>
                  <option value="par">Par</option>
                </select>
              </div>

              {/* Código de Barras */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  placeholder="Código de barras"
                />
              </div>

              {/* Descripción - Full width */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base resize-none"
                  rows={4}
                  placeholder="Descripción del producto..."
                />
              </div>
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
                Guardando...
              </span>
            ) : (
              product ? "Actualizar" : "Crear"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryModal({ categories = [], onClose, onUpdated }) {
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editing) {
      setFormData({
        name: editing.name || "",
        description: editing.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
  }, [editing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Ingresá un nombre para la categoría");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/api/stock/categories/${editing.id}`, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        });
        toast.success("Categoría actualizada");
      } else {
        await apiClient.post("/api/stock/categories", {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
        });
        toast.success("Categoría creada");
      }
      setEditing(null);
      setFormData({ name: "", description: "" });
      onUpdated?.();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Error al guardar la categoría");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    setSaving(true);
    try {
      await apiClient.delete(`/api/stock/categories/${category.id}`);
      toast.success("Categoría eliminada");
      if (editing?.id === category.id) {
        setEditing(null);
        setFormData({ name: "", description: "" });
      }
      onUpdated?.();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Error al eliminar la categoría");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/60 backdrop-blur-sm">
      <div className="card w-full max-w-5xl relative shadow-2xl border border-border/60 bg-background/95 p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground-secondary hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-semibold text-foreground mb-6 px-1 sm:px-2">Categorías</h2>

        <div className="grid lg:grid-cols-[1.4fr,360px] gap-6 px-1 sm:px-2">
          <div className="border border-border rounded-3xl overflow-hidden bg-background-secondary/70 p-3 sm:p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-background-secondary/80 backdrop-blur">
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Nombre</th>
                  <th className="text-left px-4 py-3 font-semibold text-foreground">Descripción</th>
                  <th className="text-center px-4 py-3 font-semibold text-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-foreground-muted">
                      No hay categorías creadas
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr key={category.id} className="border-t border-border">
                      <td className="px-4 py-2">{category.name}</td>
                      <td className="px-4 py-2 text-foreground-secondary">
                        {category.description || "—"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setEditing(category)}
                            className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-xs transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(category)}
                            className="px-3 py-1.5 rounded-lg border border-red-400/40 text-red-400 hover:bg-red-400/10 text-xs transition-colors disabled:opacity-50"
                            disabled={saving}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="border border-border rounded-3xl p-5 bg-background-secondary/80 backdrop-blur">
            <h3 className="font-semibold text-foreground mb-4">
              {editing ? "Editar categoría" : "Nueva categoría"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="input w-full"
                  placeholder="Ej: Shampoos, Accesorios"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="input w-full"
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                {editing ? (
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="btn-secondary flex-1"
                  >
                    Cancelar
                  </button>
                ) : (
                  <span />
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving ? "Guardando..." : editing ? "Guardar cambios" : "Crear categoría"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal para transferir stock entre sucursales
function TransferModal({ product, branches, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    from_branch_id: product?.branch_id || "",
    to_branch_id: "",
    quantity: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [availableStock, setAvailableStock] = useState(null);

  useEffect(() => {
    const fetchAvailableStock = async () => {
      if (product?.id && formData.from_branch_id) {
        try {
          const response = await apiClient.get(
            `/api/stock/products/${product.id}/stock/${formData.from_branch_id}`
          );
          if (response.data?.ok) {
            setAvailableStock(response.data.data.available_stock);
          } else {
            setAvailableStock(0);
          }
        } catch (error) {
          console.error("Error al obtener stock disponible:", error);
          setAvailableStock(0);
        }
      } else {
        setAvailableStock(null);
      }
    };

    fetchAvailableStock();
  }, [product?.id, formData.from_branch_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.from_branch_id || !formData.to_branch_id || !formData.quantity) {
      toast.error("Completá todos los campos requeridos");
      return;
    }

    if (formData.from_branch_id === formData.to_branch_id) {
      toast.error("La sucursal origen y destino no pueden ser la misma");
      return;
    }

    const quantityNum = Number(formData.quantity);
    if (quantityNum <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (availableStock !== null && quantityNum > availableStock) {
      toast.error(`Stock insuficiente. Disponible: ${availableStock}`);
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/stock/transfers", {
        product_id: product.id,
        from_branch_id: Number(formData.from_branch_id),
        to_branch_id: Number(formData.to_branch_id),
        quantity: quantityNum,
        notes: formData.notes || null
      });

      toast.success(
        `Transferencia realizada: ${quantityNum} unidades de ${product.name}`
      );
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al realizar la transferencia");
    } finally {
      setLoading(false);
    }
  };

  const fromBranch = branches.find(b => b.id === Number(formData.from_branch_id));
  const toBranch = branches.find(b => b.id === Number(formData.to_branch_id));

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
        className="bg-background rounded-2xl shadow-2xl max-w-lg w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
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
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Transferir Stock
            </h2>
            <p className="text-sm text-foreground-secondary mt-1">
              {product?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-secondary transition-all duration-200 text-foreground-muted hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-5">
            {availableStock !== null && (
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Stock disponible en {fromBranch?.name || "sucursal origen"}: <span className="font-bold">{availableStock}</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Sucursal Origen <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.from_branch_id}
                onChange={(e) => setFormData({ ...formData, from_branch_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                required
                disabled={!!product?.branch_id}
              >
                <option value="">Seleccionar sucursal</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {product?.branch_id && (
                <p className="text-xs text-foreground-muted mt-1">
                  Sucursal asignada al producto
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Sucursal Destino <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.to_branch_id}
                onChange={(e) => setFormData({ ...formData, to_branch_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                required
              >
                <option value="">Seleccionar sucursal</option>
                {branches
                  .filter(b => b.id !== Number(formData.from_branch_id))
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Cantidad <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={availableStock || undefined}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                placeholder="Cantidad a transferir"
                required
              />
              {availableStock !== null && (
                <p className="text-xs text-foreground-muted mt-1">
                  Máximo: {availableStock} unidades
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 resize-none"
                rows={3}
                placeholder="Notas sobre la transferencia..."
              />
            </div>

            {formData.from_branch_id && formData.to_branch_id && formData.quantity && (
              <div className="p-4 rounded-lg bg-background-secondary border border-border">
                <p className="text-sm font-medium text-foreground mb-2">Resumen de transferencia:</p>
                <div className="space-y-1 text-sm text-foreground-secondary">
                  <p>
                    <span className="font-medium">{formData.quantity}</span> unidades de <span className="font-medium">{product?.name}</span>
                  </p>
                  <p>
                    De: <span className="font-medium">{fromBranch?.name}</span>
                  </p>
                  <p>
                    A: <span className="font-medium">{toBranch?.name}</span>
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        <div 
          className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg font-medium text-foreground-secondary bg-background-secondary hover:bg-border transition-all duration-200"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-lg font-medium text-white bg-primary hover:bg-primary-hover transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                Transfiriendo...
              </span>
            ) : (
              "Transferir"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

