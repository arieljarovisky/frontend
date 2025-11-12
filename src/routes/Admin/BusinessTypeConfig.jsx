import { useState, useEffect, useMemo, useCallback } from "react";
import { apiClient } from "../../api";
import { toast } from "sonner";
import { Building2, CheckCircle, RotateCcw } from "lucide-react";
import { useQuery } from "../../shared/useQuery.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useApp } from "../../context/UseApp.js";

const FEATURE_KEYS = ["appointments", "stock", "invoicing"];
const FEATURE_LABELS = {
  appointments: "Turnos",
  stock: "Gestión de stock",
  invoicing: "Facturación",
};
const FEATURE_DESCRIPTIONS = {
  appointments: "Gestión de turnos y citas",
  stock: "Control de inventario y productos",
  invoicing: "Facturación electrónica con ARCA",
};
const BASE_FEATURE_DEFAULTS = {
  appointments: true,
  stock: false,
  invoicing: false,
};

function parseFeatures(raw) {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed != null ? parsed : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object" && raw != null) {
    return raw;
  }
  return {};
}

function normalizeFeatures(raw, fallback = BASE_FEATURE_DEFAULTS) {
  const parsed = parseFeatures(raw);
  const merged = { ...fallback, ...parsed };
  return FEATURE_KEYS.reduce((acc, key) => {
    acc[key] = Boolean(merged[key]);
    return acc;
  }, {});
}

function diffFeatures(current, next, locks = {}) {
  return FEATURE_KEYS.map((key) => ({
    key,
    current: Boolean(current?.[key]),
    next: Boolean(next?.[key]),
    locked: Boolean(locks[key]),
    changed: Boolean(current?.[key]) !== Boolean(next?.[key]),
  }));
}

const FeatureToggle = ({ featureKey, checked, onChange, description, customized, locked }) => {
  return (
    <label
      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg bg-background-secondary ${
        locked ? "opacity-60 cursor-not-allowed" : "hover:bg-border cursor-pointer"
      } transition-colors`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(featureKey, event.target.checked)}
        className="w-4 h-4 rounded border-border text-primary focus:ring-primary flex-shrink-0"
        disabled={locked}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-foreground text-sm sm:text-base">
            {FEATURE_LABELS[featureKey]}
          </span>
          {customized ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400 bg-amber-500/10 border border-amber-400/30 rounded-full px-2 py-0.5">
              Personalizado
            </span>
          ) : null}
          {locked ? (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-red-300 bg-red-500/10 border border-red-400/30 rounded-full px-2 py-0.5">
              No incluido en tu plan
            </span>
          ) : null}
        </div>
        <div className="text-xs text-foreground-secondary">{description}</div>
      </div>
    </label>
  );
};

const ConfirmDialog = ({ open, onCancel, onConfirm, typeChanged, fromType, toType, featureSummary }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-background border border-border shadow-2xl p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Confirmar cambios</h3>
          <p className="text-sm text-foreground-secondary">
            {typeChanged
              ? `Estás por cambiar el tipo de negocio de "${fromType || "Sin especificar"}" a "${toType}".`
              : "Estás por actualizar las funcionalidades habilitadas."}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-background-secondary/50 divide-y divide-border/60">
          <div className="px-4 py-3 text-sm font-medium text-foreground-secondary uppercase tracking-wide">
            Impacto en módulos
          </div>
          <ul className="px-4 py-2 text-sm space-y-2">
            {featureSummary.map(({ key, current, next, changed, locked }) => (
              <li key={key} className="flex items-center justify-between gap-4">
                <span className="text-foreground">{FEATURE_LABELS[key]}</span>
                {locked ? (
                  <span className="text-xs font-semibold uppercase tracking-wide text-red-300">
                    No disponible en tu plan
                  </span>
                ) : (
                  <span
                    className={`text-xs font-semibold uppercase tracking-wide ${
                      changed
                        ? next
                          ? "text-emerald-400"
                          : "text-rose-400"
                        : "text-foreground-muted"
                    }`}
                  >
                    {changed ? (next ? "Se habilitará" : "Se desactivará") : "Se mantiene"}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {typeChanged ? (
          <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Cambiar el tipo de negocio reemplazará tus servicios actuales por los predeterminados del nuevo tipo.
            Guardá o exportá tus servicios si necesitás conservarlos.
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
          >
            Revisar de nuevo
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
          >
            Confirmar y guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default function BusinessTypeConfig() {
  const { user } = useAuth();
  const { refreshFeatures, tenantInfo } = useApp();
  const canEditType = Boolean(user?.isSuperAdmin || user?.is_super_admin);
  const planLocks = useMemo(() => {
    const planFeatures = tenantInfo?.plan?.features || {};
    return FEATURE_KEYS.reduce((acc, key) => {
      if (planFeatures[key] === false) acc[key] = true;
      return acc;
    }, {});
  }, [tenantInfo?.plan?.features]);

  const { data: businessTypes = [], loading: loadingTypes } = useQuery(
    async () => {
      const response = await apiClient.get("/api/business-types");
      return response.data?.data || [];
    },
    []
  );

  const { data: currentBusinessType, loading: loadingCurrent, refetch } = useQuery(
    async () => {
      const response = await apiClient.get("/api/business-types/tenant/business-type");
      return response.data?.data || null;
    },
    []
  );

  const [selectedType, setSelectedType] = useState(null);
  const [featuresConfig, setFeaturesConfig] = useState(BASE_FEATURE_DEFAULTS);
  const [currentFeatures, setCurrentFeatures] = useState(BASE_FEATURE_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedTypeData = useMemo(
    () => (businessTypes || []).find((bt) => bt.id === selectedType) || null,
    [businessTypes, selectedType]
  );
  const currentTypeData = useMemo(
    () =>
      (businessTypes || []).find((bt) => bt.id === currentBusinessType?.business_type_id) || null,
    [businessTypes, currentBusinessType?.business_type_id]
  );
  const selectedTypeDefaults = useMemo(
    () => normalizeFeatures(selectedTypeData?.features, BASE_FEATURE_DEFAULTS),
    [selectedTypeData]
  );
  const typeChanged =
    canEditType && selectedType != null && selectedType !== (currentBusinessType?.business_type_id ?? null);

  const applyPlanLocks = useCallback(
    (config) =>
      FEATURE_KEYS.reduce((acc, key) => {
        acc[key] = planLocks[key] ? false : Boolean(config[key]);
        return acc;
      }, {}),
    [planLocks]
  );

  useEffect(() => {
    if (!loadingTypes && !loadingCurrent && currentBusinessType) {
      const typeId = currentBusinessType.business_type_id;
      setSelectedType(typeId);

      const typeDefaults = normalizeFeatures(
        (businessTypes || []).find((t) => t.id === typeId)?.features,
        BASE_FEATURE_DEFAULTS
      );
      const persisted = normalizeFeatures(
        currentBusinessType.features_config ?? currentBusinessType.features,
        { ...BASE_FEATURE_DEFAULTS, ...typeDefaults }
      );
      const locked = applyPlanLocks(persisted);
      setFeaturesConfig(locked);
      setCurrentFeatures(locked);
    }
  }, [businessTypes, currentBusinessType, loadingCurrent, loadingTypes, applyPlanLocks]);

  const handleSelectType = (type) => {
    if (!type) return;
    if (!canEditType && type.id !== (currentBusinessType?.business_type_id ?? null)) {
      toast.info("Contactá al dueño del sistema para cambiar el tipo de negocio y actualizar tu plan.");
      return;
    }
    setSelectedType(type.id);
    const defaults = normalizeFeatures(type.features, BASE_FEATURE_DEFAULTS);
    setFeaturesConfig((prev) => (type.id === selectedType ? prev : applyPlanLocks(defaults)));
  };

  const handleToggleFeature = (key, value) => {
    if (planLocks[key]) {
      toast.info("Necesitás un plan superior para habilitar esta funcionalidad.");
      return;
    }
    setFeaturesConfig((prev) => ({ ...prev, [key]: Boolean(value) }));
  };

  const handleRestoreDefaults = () => {
    setFeaturesConfig(applyPlanLocks(selectedTypeDefaults));
    toast.info("Se restauraron las funcionalidades por defecto del tipo seleccionado.");
  };

  const featureChanges = useMemo(
    () => diffFeatures(currentFeatures, featuresConfig, planLocks),
    [currentFeatures, featuresConfig, planLocks]
  );
  const hasFeatureChanges = featureChanges.some((change) => change.changed && !change.locked);
  const hasUnsavedChanges = typeChanged || (canEditType && hasFeatureChanges);
  const customizedKeys = useMemo(
    () =>
      FEATURE_KEYS.filter(
        (key) =>
          !planLocks[key] &&
          Boolean(featuresConfig[key]) !== Boolean(selectedTypeDefaults[key])
      ),
    [featuresConfig, selectedTypeDefaults, planLocks]
  );
  const pendingChangeLabels = useMemo(() => {
    const labels = [];
    if (typeChanged) labels.push("tipo de negocio");
    if (canEditType && hasFeatureChanges) labels.push("funcionalidades");
    return labels;
  }, [typeChanged, hasFeatureChanges, canEditType]);

  const handleOpenConfirm = () => {
    if (!canEditType) {
      toast.info("Contactá al dueño del sistema para gestionar estos cambios.");
      return;
    }
    if (!selectedType) {
      toast.error("Seleccioná un tipo de negocio");
      return;
    }
    if (!hasUnsavedChanges) {
      toast.info("No hay cambios para guardar.");
      return;
    }
    setShowConfirm(true);
  };

  const performSave = async () => {
    setSaving(true);
    try {
      await apiClient.put("/api/business-types/tenant/business-type", {
        business_type_id: canEditType
          ? selectedType
          : currentBusinessType?.business_type_id ?? selectedType,
        features_config: applyPlanLocks(featuresConfig),
      });

      toast.success(
        typeChanged
          ? `Tipo de negocio actualizado a ${selectedTypeData?.name || "nuevo tipo"}.`
          : "Funcionalidades actualizadas correctamente."
      );

      const lockedConfig = applyPlanLocks(featuresConfig);
      setFeaturesConfig(lockedConfig);
      setCurrentFeatures(lockedConfig);
      setShowConfirm(false);
      if (refetch) refetch();
      if (refreshFeatures) {
        refreshFeatures();
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "No se pudieron guardar los cambios.");
    } finally {
      setSaving(false);
    }
  };

  const planFeatureList = useMemo(
    () =>
      FEATURE_KEYS.map((key) => ({
        key,
        label: FEATURE_LABELS[key],
        enabled: Boolean(featuresConfig[key]),
        locked: planLocks[key],
      })),
    [featuresConfig, planLocks]
  );
  const hasLockedFeatures = useMemo(
    () => planFeatureList.some((feature) => feature.locked),
    [planFeatureList]
  );

  const handleRequestUpgrade = () => {
    toast.info("Contactá al dueño del sistema o escribinos a ventas@arjaerp.com para cambiar tu plan.");
  };

  if (loadingTypes || loadingCurrent) {
    return (
      <div className="card card--space-xl card--no-hover text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        <p className="text-foreground-secondary mt-4">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Tipo de Negocio</h3>
        <p className="text-sm text-foreground-secondary">
          Seleccioná el tipo de negocio que mejor describe tu actividad. Antes de guardar, revisá
          el resumen para entender qué módulos y servicios se van a ajustar.
        </p>
        <p className="text-xs text-foreground-secondary mt-2">
          Plan actual:{" "}
          <span className="font-medium text-foreground">
            {tenantInfo?.plan?.label || "Plan Starter"}
          </span>
        </p>
        {!canEditType ? (
          <div className="mt-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-xs sm:text-sm text-primary">
            Para cambiar el tipo de negocio o sumar funcionalidades necesitás contactar al dueño del sistema.
            Los módulos disponibles dependen del plan contratado.
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {(businessTypes || []).map((type) => {
          const isSelected = selectedType === type.id;
          const features = normalizeFeatures(type.features, BASE_FEATURE_DEFAULTS);

          return (
            <button
              key={type.id}
              onClick={() => handleSelectType(type)}
              className={`card p-4 sm:p-6 text-left transition-all ${
                isSelected
                  ? "ring-2 ring-primary bg-primary-light dark:bg-primary/20"
                  : "hover:bg-background-secondary"
              } ${!canEditType && type.id !== (currentBusinessType?.business_type_id ?? null) ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-foreground text-sm sm:text-base truncate">
                      {type.name}
                    </h4>
                    <p className="text-xs text-foreground-muted">{type.code}</p>
                  </div>
                </div>
                {isSelected ? (
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0 ml-2" />
                ) : null}
              </div>

              {type.description ? (
                <p className="text-xs sm:text-sm text-foreground-secondary mb-2 sm:mb-3 line-clamp-2">
                  {type.description}
                </p>
              ) : null}

              <div className="text-xs text-foreground-muted space-y-0.5 sm:space-y-1">
                {features.stock ? <div>✓ Gestión de stock</div> : null}
                {features.appointments ? <div>✓ Turnos</div> : null}
                {features.invoicing ? <div>✓ Facturación</div> : null}
              </div>
            </button>
          );
        })}
      </div>

       {selectedTypeData ? (
        <div className="card card--space-md space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
            <div>
              <p className="text-sm text-foreground-secondary">
                Tipo actual:{" "}
                <span className="font-medium text-foreground">
                  {currentTypeData?.name || "Sin configuración"}
                </span>
              </p>
              <p className="text-sm text-foreground-secondary">
                Selección pendiente:{" "}
                <span className="font-medium text-foreground">{selectedTypeData.name}</span>
              </p>
            </div>
            {typeChanged ? (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-primary/10 text-primary border border-primary/30">
                Cambio pendiente
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide bg-foreground/5 text-foreground-secondary border border-border">
                Mismo tipo guardado
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border bg-background-secondary/50 divide-y divide-border/60">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              Resultado esperado al guardar
            </div>
            <ul className="px-4 py-2 text-sm space-y-2">
              {featureChanges.map(({ key, next, changed, locked }) => (
                <li key={key} className="flex items-center justify-between">
                  <span className="text-foreground">{FEATURE_LABELS[key]}</span>
                  {locked ? (
                    <span className="text-xs font-semibold uppercase tracking-wide text-red-300">
                      No disponible en tu plan
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        changed
                          ? next
                            ? "text-emerald-400"
                            : "text-rose-400"
                          : "text-foreground-muted"
                      }`}
                    >
                      {changed
                        ? next
                          ? "Se habilitará"
                          : "Se desactivará"
                        : "Se mantiene"}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {typeChanged ? (
            <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs sm:text-sm text-amber-200">
              Al guardar se reemplazarán los servicios actuales por los predeterminados de{" "}
              <span className="font-semibold">{selectedTypeData.name}</span>. Si necesitás conservar
              servicios personalizados, exportalos o duplicalos antes de confirmar.
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedTypeData ? (
        <div className="card card--space-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h4 className="font-semibold text-foreground text-sm sm:text-base">
              {canEditType ? "Funcionalidades habilitadas" : "Funcionalidades incluidas en tu plan"}
            </h4>
            {canEditType ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-foreground-muted">
                  Valores por defecto de {selectedTypeData.name}:{" "}
                  {FEATURE_KEYS.filter((key) => selectedTypeDefaults[key])
                    .map((key) => FEATURE_LABELS[key])
                    .join(", ") || "ninguno"}
                </span>
                <button
                  type="button"
                  onClick={handleRestoreDefaults}
                  disabled={customizedKeys.length === 0}
                  className="inline-flex items-center gap-2 text-xs font-medium text-foreground-secondary hover:text-foreground px-3 py-1 rounded-lg border border-border hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restaurar valores del tipo
                </button>
              </div>
            ) : null}
          </div>

          {canEditType ? (
            <div className="space-y-2 sm:space-y-3">
              {FEATURE_KEYS.map((key) => (
                <FeatureToggle
                  key={key}
                  featureKey={key}
                  checked={featuresConfig[key]}
                  onChange={handleToggleFeature}
                  description={FEATURE_DESCRIPTIONS[key]}
                  customized={customizedKeys.includes(key)}
                  locked={planLocks[key]}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {planFeatureList.map((feature) => (
                <div
                  key={feature.key}
                  className={`rounded-lg border px-4 py-3 text-left ${
                    feature.enabled
                      ? "border-emerald-500/40 bg-emerald-500/10"
                      : feature.locked
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-border bg-background-secondary"
                  }`}
                >
                  <div className="font-semibold text-sm text-foreground">{feature.label}</div>
                  <div className="text-xs text-foreground-secondary mt-1">
                    {feature.enabled
                      ? "Disponible en tu plan"
                      : feature.locked
                      ? "Requiere un plan superior"
                      : "Deshabilitado actualmente"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {canEditType ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
            {hasUnsavedChanges ? (
              <span className="text-xs text-foreground-secondary">
                Revisá el resumen antes de guardar. Cambios pendientes:{" "}
                <strong>{pendingChangeLabels.join(" y ")}</strong>.
              </span>
            ) : (
              <span className="text-xs text-foreground-muted">No hay cambios pendientes.</span>
            )}
            <button
              onClick={handleOpenConfirm}
              disabled={!hasUnsavedChanges || saving}
              className="btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

          <ConfirmDialog
            open={showConfirm}
            onCancel={() => setShowConfirm(false)}
            onConfirm={performSave}
            typeChanged={typeChanged}
            fromType={currentTypeData?.name}
            toType={selectedTypeData?.name}
            featureSummary={featureChanges}
          />
        </>
      ) : (
        <div className="card card--space-md space-y-3 text-center">
          <h4 className="text-sm font-semibold text-foreground">¿Necesitás más funcionalidades?</h4>
          <p className="text-sm text-foreground-secondary">
            Para habilitar módulos adicionales como stock o facturación tenés que cambiar de plan. Nuestro equipo comercial puede ayudarte a encontrar la mejor opción.
          </p>
          <div className="flex justify-center">
            <button type="button" onClick={handleRequestUpgrade} className="btn-primary">
              Solicitar cambio de plan
            </button>
          </div>
          {hasLockedFeatures ? (
            <p className="text-[11px] text-foreground-muted">
              Las funcionalidades marcadas como{" "}
              <span className="text-red-300">“Requiere un plan superior”</span> no están incluidas en tu suscripción actual.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

