import { useState } from "react";
import { useQuery } from "../../shared/useQuery.js";
import { apiClient } from "../../api";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Edit, 
  Trash2,
  TrendingDown,
  TrendingUp,
  Filter
} from "lucide-react";
import { toast } from "sonner";

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Cargar productos
  const { data: products = [], loading, error, refetch } = useQuery(
    async () => {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (showLowStock) params.append("min_stock", "true");
      
      const response = await apiClient.get(`/api/stock/products?${params}`);
      return response.data?.data || [];
    },
    [search, categoryFilter, showLowStock]
  );

  // Cargar categorías
  const { data: categories = [] } = useQuery(
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
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Nuevo Producto</span>
        </button>
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
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o código de barras..."
              className="input pl-10"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input w-full sm:w-48"
          >
            <option value="">Todas las categorías</option>
            {(categories || []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-4 py-2 bg-background-secondary rounded-lg cursor-pointer hover:bg-border transition-colors">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => setShowLowStock(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground-secondary">Solo stock bajo</span>
          </label>
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
                    <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">Stock</th>
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
    </div>
  );
}

// Modal para crear/editar producto
function ProductModal({ product, categories, onClose, onSave }) {
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
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product) {
        await apiClient.put(`/api/stock/products/${product.id}`, formData);
        toast.success("Producto actualizado");
      } else {
        await apiClient.post("/api/stock/products", formData);
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

