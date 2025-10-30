// src/routes/Admin/ConfigPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  DollarSign,
  Clock,
  Bell,
  Shield,
  Percent,
  TrendingUp,
  Save,
  RefreshCw,
  Calendar,
  Users,
  Scissors,
  Plus,
  Edit2,
  Trash2
} from "lucide-react";

function ConfigSection({ title, description, icon: Icon, children }) {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary-600/20 to-primary-600/5 border border-primary-600/30">
          <Icon className="w-6 h-6 text-primary-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-dark-900">{title}</h3>
          <p className="text-sm text-dark-600 mt-1">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-dark-800 mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-dark-500 mt-1">{hint}</p>}
    </div>
  );
}

function SwitchField({ label, description, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 p-3 rounded-xl bg-dark-200/30 hover:bg-dark-200/50 cursor-pointer transition-all">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
      />
      <div className="flex-1">
        <div className="text-sm font-medium text-dark-900">{label}</div>
        {description && (
          <div className="text-xs text-dark-600 mt-0.5">{description}</div>
        )}
      </div>
    </label>
  );
}

export default function ConfigPage() {
  const navigate = useNavigate();

  // Estado para las diferentes secciones
  const [deposits, setDeposits] = useState({
    percentage: 50,
    holdMinutes: 30,
    expirationBeforeStart: 120,
    autoCancel: true,
  });

  const [notifications, setNotifications] = useState({
    expiringSoon: true,
    expired: true,
    paid: true,
    newAppointment: true,
    cancelled: false,
  });

  const [commissions, setCommissions] = useState({
    defaultPercentage: 50,
    calculateOnDeposit: false,
    showInDashboard: true,
  });

  const [general, setGeneral] = useState({
    businessName: "Pelu de Barrio",
    timezone: "America/Argentina/Buenos_Aires",
    currency: "ARS",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });

  const [saving, setSaving] = useState(false);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Aquí irían las llamadas a la API para guardar cada sección
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulación
      alert("✅ Configuración guardada correctamente");
    } catch (error) {
      alert("❌ Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary-400" />
            Configuración del Sistema
          </h1>
          <p className="text-dark-600 mt-1">
            Ajustá los parámetros globales de tu negocio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Restablecer
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Todo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navegación rápida */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          <a href="#general" className="btn-ghost text-xs">
            <Settings className="w-3 h-3" /> General
          </a>
          <a href="#deposits" className="btn-ghost text-xs">
            <DollarSign className="w-3 h-3" /> Señas
          </a>
          <a href="#commissions" className="btn-ghost text-xs">
            <Percent className="w-3 h-3" /> Comisiones
          </a>
          <a href="#notifications" className="btn-ghost text-xs">
            <Bell className="w-3 h-3" /> Notificaciones
          </a>
          <button
            onClick={() => navigate("/admin/comisiones")}
            className="btn-ghost text-xs"
          >
            <Users className="w-3 h-3" /> Config. Peluqueros
          </button>
        </div>
      </div>

      {/* ============================================
          CONFIGURACIÓN GENERAL
          ============================================ */}
      <div id="general">
        <ConfigSection
          title="Configuración General"
          description="Información básica de tu negocio"
          icon={Settings}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <FieldGroup label="Nombre del negocio">
              <input
                type="text"
                value={general.businessName}
                onChange={(e) =>
                  setGeneral({ ...general, businessName: e.target.value })
                }
                className="input w-full"
              />
            </FieldGroup>

            <FieldGroup label="Zona horaria">
              <select
                value={general.timezone}
                onChange={(e) =>
                  setGeneral({ ...general, timezone: e.target.value })
                }
                className="input w-full"
              >
                <option value="America/Argentina/Buenos_Aires">
                  Buenos Aires (GMT-3)
                </option>
                <option value="America/Argentina/Cordoba">Córdoba (GMT-3)</option>
                <option value="America/New_York">Nueva York (GMT-5)</option>
                <option value="Europe/Madrid">Madrid (GMT+1)</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Moneda">
              <select
                value={general.currency}
                onChange={(e) =>
                  setGeneral({ ...general, currency: e.target.value })
                }
                className="input w-full"
              >
                <option value="ARS">Peso Argentino (ARS)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </FieldGroup>

            <FieldGroup label="Formato de fecha">
              <select
                value={general.dateFormat}
                onChange={(e) =>
                  setGeneral({ ...general, dateFormat: e.target.value })
                }
                className="input w-full"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </FieldGroup>
          </div>
        </ConfigSection>
      </div>

      {/* ============================================
          CONFIGURACIÓN DE SEÑAS
          ============================================ */}
      <div id="deposits">
        <ConfigSection
          title="Configuración de Señas"
          description="Parámetros para el sistema de depósitos y reservas"
          icon={DollarSign}
        >
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <FieldGroup
              label="Porcentaje de seña (%)"
              hint="Porcentaje del precio que se cobra como seña"
            >
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={deposits.percentage}
                onChange={(e) =>
                  setDeposits({ ...deposits, percentage: Number(e.target.value) })
                }
                className="input w-full"
              />
            </FieldGroup>

            <FieldGroup
              label="Tiempo de hold (minutos)"
              hint="Tiempo para pagar antes de liberar el turno"
            >
              <input
                type="number"
                min="5"
                max="120"
                step="5"
                value={deposits.holdMinutes}
                onChange={(e) =>
                  setDeposits({ ...deposits, holdMinutes: Number(e.target.value) })
                }
                className="input w-full"
              />
            </FieldGroup>

            <FieldGroup
              label="Expiración anticipada (min)"
              hint="Minutos antes del turno para expirar"
            >
              <input
                type="number"
                min="30"
                max="1440"
                step="30"
                value={deposits.expirationBeforeStart}
                onChange={(e) =>
                  setDeposits({
                    ...deposits,
                    expirationBeforeStart: Number(e.target.value),
                  })
                }
                className="input w-full"
              />
            </FieldGroup>
          </div>

          <div className="space-y-2">
            <SwitchField
              label="Cancelación automática"
              description="Cancelar turnos cuando expira el tiempo de hold"
              checked={deposits.autoCancel}
              onChange={(e) =>
                setDeposits({ ...deposits, autoCancel: e.target.checked })
              }
            />
          </div>
        </ConfigSection>
      </div>

      {/* ============================================
          CONFIGURACIÓN DE COMISIONES
          ============================================ */}
      <div id="commissions">
        <ConfigSection
          title="Configuración de Comisiones"
          description="Parámetros para el cálculo de comisiones"
          icon={Percent}
        >
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <FieldGroup
              label="Comisión por defecto (%)"
              hint="Porcentaje que se aplica a nuevos peluqueros"
            >
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={commissions.defaultPercentage}
                onChange={(e) =>
                  setCommissions({
                    ...commissions,
                    defaultPercentage: Number(e.target.value),
                  })
                }
                className="input w-full"
              />
            </FieldGroup>
          </div>

          <div className="space-y-2">
            <SwitchField
              label="Calcular sobre seña"
              description="Calcular comisiones sobre el monto de la seña en lugar del precio total"
              checked={commissions.calculateOnDeposit}
              onChange={(e) =>
                setCommissions({
                  ...commissions,
                  calculateOnDeposit: e.target.checked,
                })
              }
            />

            <SwitchField
              label="Mostrar en dashboard"
              description="Mostrar métricas de comisiones en el dashboard principal"
              checked={commissions.showInDashboard}
              onChange={(e) =>
                setCommissions({
                  ...commissions,
                  showInDashboard: e.target.checked,
                })
              }
            />
          </div>

          <div className="mt-6 p-4 rounded-xl bg-primary-600/10 border border-primary-600/20">
            <p className="text-sm text-primary-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>
                Para configurar comisiones individuales por peluquero,{" "}
                <button
                  onClick={() => navigate("/admin/comisiones")}
                  className="underline font-medium hover:text-primary-200"
                >
                  hacé clic aquí
                </button>
              </span>
            </p>
          </div>
        </ConfigSection>
      </div>

      {/* ============================================
          CONFIGURACIÓN DE NOTIFICACIONES
          ============================================ */}
      <div id="notifications">
        <ConfigSection
          title="Configuración de Notificaciones"
          description="Controlá qué notificaciones recibís"
          icon={Bell}
        >
          <div className="space-y-2">
            <SwitchField
              label="Señas por vencer"
              description="Te avisamos cuando una seña está próxima a expirar"
              checked={notifications.expiringSoon}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  expiringSoon: e.target.checked,
                })
              }
            />

            <SwitchField
              label="Señas vencidas"
              description="Te avisamos cuando una seña ha expirado"
              checked={notifications.expired}
              onChange={(e) =>
                setNotifications({ ...notifications, expired: e.target.checked })
              }
            />

            <SwitchField
              label="Pagos recibidos"
              description="Te avisamos cuando se recibe un pago de seña"
              checked={notifications.paid}
              onChange={(e) =>
                setNotifications({ ...notifications, paid: e.target.checked })
              }
            />

            <SwitchField
              label="Nuevos turnos"
              description="Te avisamos cuando se crea un nuevo turno"
              checked={notifications.newAppointment}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  newAppointment: e.target.checked,
                })
              }
            />

            <SwitchField
              label="Turnos cancelados"
              description="Te avisamos cuando se cancela un turno"
              checked={notifications.cancelled}
              onChange={(e) =>
                setNotifications({
                  ...notifications,
                  cancelled: e.target.checked,
                })
              }
            />
          </div>
        </ConfigSection>
      </div>

      {/* Footer con acciones */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-dark-600">
            Los cambios se aplicarán inmediatamente después de guardar
          </div>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}