// src/routes/Admin/MobileAppPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { apiClient } from "../../api/client";
import { useApp } from "../../context/UseApp";
import { logger } from "../../utils/logger";

const EMPTY_SETTINGS = {
  theme: { primary: "", secondary: "", text: "", background: "" },
  notifications: { push: true, inApp: true },
  pricing: null,
  schedule: null,
  logoUrl: "",
};

function ColorField({ label, name, value, onChange }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-foreground">
      <span className="text-foreground-secondary">{label}</span>
      <input
        type="color"
        name={name}
        value={value || "#13b5cf"}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-16 p-0 bg-transparent border border-border rounded"
      />
    </label>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-foreground">
      <span className="text-foreground-secondary">{label}</span>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input"
      />
    </label>
  );
}

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox"
      />
      <span className="text-foreground-secondary">{label}</span>
    </label>
  );
}

export default function MobileAppPage() {
  const { features } = useApp();
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const mobileAppEnabled = useMemo(() => features?.mobile_app !== false, [features]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCustomers(true);
        const { data, pagination } = await apiClient.listCustomers("", undefined, { limit: 50 });
        setCustomers(data || pagination?.data || data || []);
      } catch (error) {
        logger.error("❌ [MobileAppPage] Error cargando clientes:", error);
        setErrorMsg(error?.response?.data?.error || "No se pudieron cargar clientes");
      } finally {
        setLoadingCustomers(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCustomerId) return;
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        setErrorMsg("");
        const data = await apiClient.getCustomerAppSettings(selectedCustomerId);
        setSettings({
          theme: {
            primary: data?.theme?.primary || "",
            secondary: data?.theme?.secondary || "",
            text: data?.theme?.text || "",
            background: data?.theme?.background || "",
          },
          notifications: {
            push: data?.notifications?.push ?? true,
            inApp: data?.notifications?.inApp ?? true,
          },
          pricing: data?.pricing || null,
          schedule: data?.schedule || null,
          logoUrl: data?.logoUrl || "",
        });
      } catch (error) {
        logger.error("❌ [MobileAppPage] Error cargando settings:", error);
        const status = error?.response?.status;
        if (status === 403) {
          setErrorMsg("Tu plan no incluye la app móvil. Necesitás plan Pro o habilitación del super admin.");
        } else if (status === 404) {
          setErrorMsg("El cliente no pertenece a este negocio o no existe.");
        } else {
          setErrorMsg(error?.response?.data?.error || "No se pudo cargar la configuración.");
        }
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSettings();
  }, [selectedCustomerId]);

  const handleSave = async () => {
    if (!selectedCustomerId) {
      setMessage("Seleccioná un cliente primero.");
      return;
    }
    try {
      setSaving(true);
      setMessage("");
      setErrorMsg("");
      const payload = {
        theme: {
          primary: settings.theme.primary || undefined,
          secondary: settings.theme.secondary || undefined,
          text: settings.theme.text || undefined,
          background: settings.theme.background || undefined,
        },
        notifications: {
          push: settings.notifications?.push ?? true,
          inApp: settings.notifications?.inApp ?? true,
        },
        pricing: settings.pricing || null,
        schedule: settings.schedule || null,
        logoUrl: settings.logoUrl || null,
      };
      await apiClient.updateCustomerAppSettings(selectedCustomerId, payload);
      setMessage("Configuración guardada.");
    } catch (error) {
      logger.error("❌ [MobileAppPage] Error guardando settings:", error);
      const status = error?.response?.status;
      if (status === 403) {
        setErrorMsg("Tu plan no incluye la app móvil. Necesitás plan Pro o habilitación del super admin.");
      } else if (status === 404) {
        setErrorMsg("El cliente no pertenece a este negocio o no existe.");
      } else {
        setErrorMsg(error?.response?.data?.error || "No se pudo guardar la configuración.");
      }
    } finally {
      setSaving(false);
    }
  };

  const primary = settings.theme?.primary || "#13b5cf";
  const secondary = settings.theme?.secondary || "#0d8ba1";
  const textColor = settings.theme?.text || "#0f172a";
  const background = settings.theme?.background || "#ffffff";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">App móvil</h1>
        <p className="text-sm text-foreground-secondary">
          Configurá el branding, notificaciones y datos específicos para cada cliente. Solo disponible en plan Pro.
        </p>
        {!mobileAppEnabled && (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
            Tu plan no incluye la app móvil. Actualizá al plan Pro para habilitarla.
          </div>
        )}
        {errorMsg && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-900">
            {errorMsg}
          </div>
        )}
      </header>

      <div className="card p-4 space-y-4">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          <span className="text-foreground-secondary">Seleccioná cliente</span>
          <select
            className="input"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            disabled={loadingCustomers || !mobileAppEnabled}
          >
            <option value="">Elegí un cliente…</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.full_name || c.phone || `Cliente ${c.id}`}
              </option>
            ))}
          </select>
        </label>
        {loadingSettings && selectedCustomerId ? (
          <div className="text-sm text-foreground-secondary">Cargando configuración…</div>
        ) : null}
      </div>

      {selectedCustomerId && (
        <>
          <div className="card p-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Branding</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ColorField
                label="Color primario"
                name="primary"
                value={settings.theme?.primary}
                onChange={(v) => setSettings((s) => ({ ...s, theme: { ...s.theme, primary: v } }))}
                disabled={!mobileAppEnabled}
              />
              <ColorField
                label="Color secundario"
                name="secondary"
                value={settings.theme?.secondary}
                onChange={(v) => setSettings((s) => ({ ...s, theme: { ...s.theme, secondary: v } }))}
                disabled={!mobileAppEnabled}
              />
              <ColorField
                label="Texto"
                name="text"
                value={settings.theme?.text}
                onChange={(v) => setSettings((s) => ({ ...s, theme: { ...s.theme, text: v } }))}
                disabled={!mobileAppEnabled}
              />
              <ColorField
                label="Fondo"
                name="background"
                value={settings.theme?.background}
                onChange={(v) => setSettings((s) => ({ ...s, theme: { ...s.theme, background: v } }))}
                disabled={!mobileAppEnabled}
              />
            </div>
            <TextInput
              label="Logo (URL)"
              value={settings.logoUrl}
              onChange={(v) => setSettings((s) => ({ ...s, logoUrl: v }))}
              placeholder="https://tusitio.com/logo.png"
              disabled={!mobileAppEnabled}
            />

            <div className="p-4 border border-border rounded-lg space-y-2" style={{ backgroundColor: background }}>
              <p className="text-sm font-medium" style={{ color: textColor }}>
                Vista previa
              </p>
              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ background: primary }}
                  type="button"
                >
                  Botón primario
                </button>
                <button
                  className="px-4 py-2 rounded-lg text-white text-sm font-semibold"
                  style={{ background: secondary }}
                  type="button"
                >
                  Botón secundario
                </button>
              </div>
              <p className="text-sm" style={{ color: textColor }}>
                Texto de ejemplo
              </p>
            </div>
          </div>

          <div className="card p-4 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Notificaciones</h2>
            <div className="flex flex-col md:flex-row gap-4">
              <Checkbox
                label="Push"
                checked={settings.notifications?.push}
                onChange={(v) => setSettings((s) => ({ ...s, notifications: { ...s.notifications, push: v } }))}
                disabled={!mobileAppEnabled}
              />
              <Checkbox
                label="In-app"
                checked={settings.notifications?.inApp}
                onChange={(v) => setSettings((s) => ({ ...s, notifications: { ...s.notifications, inApp: v } }))}
                disabled={!mobileAppEnabled}
              />
            </div>
          </div>

          <div className="card p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Precios (JSON opcional)</h2>
            <textarea
              className="input h-32 font-mono text-xs"
              placeholder='{"plans":[{"name":"Mensual","price":10000}]}'
              value={settings.pricing ? JSON.stringify(settings.pricing, null, 2) : ""}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                  setSettings((s) => ({ ...s, pricing: parsed }));
                } catch {
                  // ignorar parse hasta que sea válido
                }
              }}
              disabled={!mobileAppEnabled}
            />
          </div>

          <div className="card p-4 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Horarios (JSON opcional)</h2>
            <textarea
              className="input h-32 font-mono text-xs"
              placeholder='{"slots":[{"day":"monday","from":"09:00","to":"18:00"}]}'
              value={settings.schedule ? JSON.stringify(settings.schedule, null, 2) : ""}
              onChange={(e) => {
                try {
                  const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                  setSettings((s) => ({ ...s, schedule: parsed }));
                } catch {
                  // ignorar parse
                }
              }}
              disabled={!mobileAppEnabled}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !mobileAppEnabled}
              className="btn-primary"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {message && <span className="text-sm text-foreground-secondary">{message}</span>}
          </div>
        </>
      )}
    </div>
  );
}

