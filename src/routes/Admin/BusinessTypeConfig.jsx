import { useState, useEffect } from "react";
import { apiClient } from "../../api";
import { toast } from "sonner";
import { Building2, CheckCircle } from "lucide-react";
import { useQuery } from "../../shared/useQuery.js";

export default function BusinessTypeConfig() {
  // Cargar tipos de negocio disponibles
  const { data: businessTypes = [], loading: loadingTypes } = useQuery(
    async () => {
      const response = await apiClient.get("/api/business-types");
      return response.data?.data || [];
    },
    []
  );

  // Cargar tipo actual del tenant
  const { data: currentBusinessType, loading: loadingCurrent, refetch } = useQuery(
    async () => {
      const response = await apiClient.get("/api/business-types/tenant/business-type");
      return response.data?.data || null;
    },
    []
  );

  const [selectedType, setSelectedType] = useState(null);
  const [featuresConfig, setFeaturesConfig] = useState({
    stock: false,
    invoicing: false,
    appointments: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentBusinessType) {
      setSelectedType(currentBusinessType.business_type_id);
      if (currentBusinessType.features_config) {
        const config = typeof currentBusinessType.features_config === 'string'
          ? JSON.parse(currentBusinessType.features_config)
          : currentBusinessType.features_config;
        setFeaturesConfig(config);
      } else if (currentBusinessType.features) {
        setFeaturesConfig(currentBusinessType.features);
      }
    }
  }, [currentBusinessType]);

  const handleSave = async () => {
    if (!selectedType) {
      toast.error("Selecciona un tipo de negocio");
      return;
    }

    setSaving(true);
    try {
      await apiClient.put("/api/business-types/tenant/business-type", {
        business_type_id: selectedType,
        features_config: featuresConfig
      });
      toast.success("Tipo de negocio actualizado");
      // Refetch para actualizar los datos
      if (refetch) {
        refetch();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeData = (businessTypes || []).find(bt => bt.id === selectedType);

  if (loadingTypes || loadingCurrent) {
    return (
      <div className="card p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-foreground-secondary mt-4">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Tipo de Negocio
        </h3>
        <p className="text-sm text-foreground-secondary">
          Selecciona el tipo de negocio que mejor describe tu actividad
        </p>
      </div>

      {/* Grid de tipos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {(businessTypes || []).map((type) => {
          const isSelected = selectedType === type.id;
          const features = typeof type.features === 'string' 
            ? JSON.parse(type.features) 
            : type.features;
          
          return (
            <button
              key={type.id}
              onClick={() => {
                setSelectedType(type.id);
                if (features) {
                  setFeaturesConfig(features);
                }
              }}
              className={`card p-4 sm:p-6 text-left transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary-light dark:bg-primary/20"
                  : "hover:bg-background-secondary"
              }`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">{type.name}</h4>
                    <p className="text-xs text-foreground-muted">{type.code}</p>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 ml-2" />
                )}
              </div>
              {type.description && (
                <p className="text-xs sm:text-sm text-foreground-secondary mb-2 sm:mb-3 line-clamp-2">
                  {type.description}
                </p>
              )}
              {features && (
                <div className="text-xs text-foreground-muted space-y-0.5 sm:space-y-1">
                  {features.stock && <div>✓ Gestión de stock</div>}
                  {features.appointments && <div>✓ Turnos</div>}
                  {features.invoicing && <div>✓ Facturación</div>}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Configuración de features */}
      {selectedTypeData && (
        <div className="card p-4 sm:p-6">
          <h4 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
            Funcionalidades Habilitadas
          </h4>
          <div className="space-y-2 sm:space-y-3">
            <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background-secondary hover:bg-border transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={featuresConfig.appointments}
                onChange={(e) => setFeaturesConfig({ ...featuresConfig, appointments: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-medium text-foreground text-sm sm:text-base">Turnos</div>
                <div className="text-xs text-foreground-secondary">
                  Gestión de turnos y citas
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background-secondary hover:bg-border transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={featuresConfig.stock}
                onChange={(e) => setFeaturesConfig({ ...featuresConfig, stock: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-medium text-foreground text-sm sm:text-base">Gestión de Stock</div>
                <div className="text-xs text-foreground-secondary">
                  Control de inventario y productos
                </div>
              </div>
            </label>

            <label className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background-secondary hover:bg-border transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={featuresConfig.invoicing}
                onChange={(e) => setFeaturesConfig({ ...featuresConfig, invoicing: e.target.checked })}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary flex-shrink-0"
              />
              <div className="min-w-0">
                <div className="font-medium text-foreground text-sm sm:text-base">Facturación</div>
                <div className="text-xs text-foreground-secondary">
                  Facturación electrónica con ARCA
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Botón guardar */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!selectedType || saving}
          className="btn-primary w-full sm:w-auto"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}

