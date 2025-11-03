// src/components/TenantSelector.jsx - Para super admins que gestionan múltiples tenants
import { useState, useEffect } from "react";
import { Building2, Check } from "lucide-react";
import { http, setTenantId } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function TenantSelector() {
  const { user, tenant, refreshSession } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Solo mostrar si es super admin
  if (!user?.is_super_admin) return null;

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const { data } = await http.get("/api/admin/tenants");
      setTenants(data?.data || []);
    } catch (error) {
      console.error("Error loading tenants:", error);
    }
  };

  const switchTenant = async (newTenantId) => {
    setLoading(true);
    try {
      setTenantId(newTenantId);
      await refreshSession();
      setShowDropdown(false);
      window.location.reload(); // Forzar recarga para que todo se actualice
    } catch (error) {
      console.error("Error switching tenant:", error);
      alert("Error al cambiar de sucursal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600/10 border border-purple-600/20 hover:bg-purple-600/20 transition-all"
        disabled={loading}
      >
        <Building2 className="w-4 h-4 text-purple-400" />
        <div className="text-left">
          <p className="text-xs text-dark-600 leading-none">Sucursal activa</p>
          <p className="text-sm font-medium text-purple-300">
            {tenant?.name || "Seleccionar"}
          </p>
        </div>
      </button>

      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-64 rounded-xl border border-dark-300 bg-dark-100 shadow-xl z-50 max-h-96 overflow-auto">
            <div className="p-2">
              <p className="text-xs text-dark-600 px-2 py-1 font-medium">
                Cambiar de sucursal
              </p>
              {tenants.map((t) => (
                <button
                  key={t.id}
                  onClick={() => switchTenant(t.id)}
                  disabled={loading || t.id === tenant?.id}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-left
                    transition-all
                    ${t.id === tenant?.id
                      ? "bg-purple-600/20 text-purple-300"
                      : "hover:bg-dark-200/50 text-dark-800"
                    }
                    disabled:opacity-50
                  `}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-dark-600">{t.subdomain}</p>
                    </div>
                  </div>
                  {t.id === tenant?.id && (
                    <Check className="w-4 h-4 text-purple-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}