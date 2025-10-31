// src/routes/Admin/ConfigPage.jsx - Con navegación oculta en mobile
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  DollarSign,
  Bell,
  Percent,
  TrendingUp,
  Save,
  RefreshCw,
  Users,
} from "lucide-react";
import { apiClient } from "../../api/client.js";
import { toast } from "sonner";

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
  const [active, setActive] = useState("general");
  const [floating, setFloating] = useState(false);
  const [topOffset, setTopOffset] = useState(12);
  const [barH, setBarH] = useState(56);
  const barRef = useRef(null);


  const TABS = [
    { id: "general", label: "General", Icon: Settings },
    { id: "deposits", label: "Señas", Icon: DollarSign },
    { id: "commissions", label: "Comisiones", Icon: Percent },
    { id: "notifications", label: "Notificaciones", Icon: Bell },
    { id: "stylists", label: "Config. Peluqueros", Icon: Users, external: true },
  ];
  useEffect(() => {
    const calcOffsets = () => {
      // Intentá encontrar tu topbar: marcala con data-appbar si podés
      const appbar =
        document.querySelector("[data-appbar]") ||
        document.querySelector("nav[role='navigation']") ||
        document.querySelector("header");
      const h = appbar ? Math.ceil(appbar.getBoundingClientRect().height) : 64;
      setTopOffset(h + 8); // 8px de separación
      if (barRef.current) setBarH(Math.ceil(barRef.current.getBoundingClientRect().height));
    };
    calcOffsets();
    window.addEventListener("resize", calcOffsets, { passive: true });
    return () => window.removeEventListener("resize", calcOffsets);
  }, []);

  // 2) Alterna a fixed cuando scrolleás
  useEffect(() => {
    const ids = TABS.filter(t => !t.external).map(t => t.id);

    let ticking = false;
    const calcActive = () => {
      ticking = false;

      // Línea de lectura: justo debajo de la barra
      const refY = (topOffset + barH + 12);

      // Si estamos al final de la página, forzamos la última sección
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (nearBottom) {
        setActive(ids[ids.length - 1]);
        return;
      }

      // Elegimos la sección cuyo top sea el último que pasó la línea de lectura
      // y, si ninguna pasó, la más cercana hacia abajo.
      let current = ids[0];
      let bestTop = -Infinity;
      let closestDown = { id: ids[0], dist: Infinity };

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();

        // Último top que quedó por encima de la línea (=> sección "en curso")
        if (rect.top <= refY && rect.top > bestTop) {
          bestTop = rect.top;
          current = id;
        }

        // Guardamos también la más cercana hacia abajo por si ninguna pasó
        const distDown = rect.top - refY;
        if (distDown > 0 && distDown < closestDown.dist) {
          closestDown = { id, dist: distDown };
        }
      }

      // Si ninguna pasó la línea, usamos la más cercana hacia abajo
      if (bestTop === -Infinity && closestDown.id) {
        current = closestDown.id;
      }

      setActive(current);
    };

    const onScrollOrResize = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(calcActive);
      }
    };

    calcActive();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [topOffset, barH, TABS]);

  const goTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const targetY = window.scrollY + el.getBoundingClientRect().top - (topOffset + barH + 8);
    window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    setActive(id);
  };
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

  useEffect(() => {
    (async () => {
      try {
        const [g, d, c, n] = await Promise.all([
          apiClient.getConfigSection("general"),
          apiClient.getConfigSection("deposit"),
          apiClient.getConfigSection("commissions"),
          apiClient.getConfigSection("notifications"),
        ]);
        // Mapear a tu shape local (con defaults)
        setGeneral({
          businessName: g.businessName ?? "Pelu de Barrio",
          timezone: g.timezone ?? "America/Argentina/Buenos_Aires",
          currency: g.currency ?? "ARS",
          dateFormat: g.dateFormat ?? "DD/MM/YYYY",
          timeFormat: g.timeFormat ?? "24h",
        });
        setDeposits({
          percentage: Number(d["deposit.percentage"] ?? d.percentage ?? 50),
          holdMinutes: Number(d["deposit.holdMinutes"] ?? d.holdMinutes ?? 30),
          expirationBeforeStart: Number(d["deposit.expirationBeforeStart"] ?? d.expirationBeforeStart ?? 120),
          autoCancel: (d["deposit.autoCancel"] ?? d.autoCancel ?? true) === true,
        });
        setCommissions({
          defaultPercentage: Number(c.defaultPercentage ?? 50),
          calculateOnDeposit: Boolean(c.calculateOnDeposit ?? false),
          showInDashboard: Boolean(c.showInDashboard ?? true),
        });
        setNotifications({
          expiringSoon: Boolean(n.expiringSoon ?? true),
          expired: Boolean(n.expired ?? true),
          paid: Boolean(n.paid ?? true),
          newAppointment: Boolean(n.newAppointment ?? true),
          cancelled: Boolean(n.cancelled ?? false),
        });
      } catch (e) {
        console.error("Load config failed", e);
      }
    })();
  }, []);

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        apiClient.saveConfigSection("general", general),
        apiClient.saveConfigSection("deposit", {
          "deposit.percentage": deposits.percentage,
          "deposit.holdMinutes": deposits.holdMinutes,
          "deposit.expirationBeforeStart": deposits.expirationBeforeStart,
          "deposit.autoCancel": deposits.autoCancel,
        }),
        apiClient.saveConfigSection("commissions", commissions),
        apiClient.saveConfigSection("notifications", notifications),
      ]);
      toast.success("Configuración guardada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("❌ Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* === Spacer cuando la barra está flotando (evita que tape contenido) === */}
      {floating && <div style={{ height: barH }} />}

      {/* === Barra centrada, dark, y por encima del topbar - OCULTA EN MOBILE === */}
      <div
        ref={barRef}
        className="w-full px-4 hidden md:block"
        style={{
          position: floating ? "fixed" : "sticky",
          top: floating ? topOffset : 90,
          left: floating ? "50%" : undefined,
          transform: floating ? "translateX(-50%)" : undefined,
          zIndex: 70,
        }}
      >
        <div className="mx-auto max-w-4xl rounded-2xl p-[1px] bg-gradient-to-r from-sky-500/30 via-fuchsia-500/20 to-indigo-500/30 shadow-lg">
          <div className="rounded-2xl bg-slate-900/80 backdrop-blur border border-white/10">
            <nav className="flex items-center justify-center gap-1 p-1">
              {TABS.map(({ id, label, Icon, external }) => {
                const isActive = active === id;
                const base = "group inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all";
                const on = "bg-white/10 text-white shadow-inner ring-1 ring-white/10";
                const off = "text-white/70 hover:text-white hover:bg-white/5 ring-1 ring-transparent hover:ring-white/10";
                return (
                  <button
                    key={id}
                    onClick={() => (external ? (window.location.href = "/admin/comisiones") : goTo(id))}
                    className={`${base} ${isActive ? on : off}`}
                  >
                    <Icon className="w-4 h-4 opacity-80 group-hover:opacity-100" />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
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