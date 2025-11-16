import { useEffect, useMemo, useState } from "react";
import { Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient, getBranchViewMode, setBranchViewMode } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function BranchSelector() {
  const { user, refreshSession } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => getBranchViewMode());

  const currentBranchId = user?.currentBranchId || user?.current_branch_id || null;
  const currentBranch = useMemo(() => {
    if (viewMode === "all") return null;
    if (user?.currentBranch) return user.currentBranch;
    return branches.find((branch) => branch.id === currentBranchId) || null;
  }, [branches, currentBranchId, user?.currentBranch, viewMode]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.listActiveBranches();
        if (!mounted) return;
        setBranches(Array.isArray(response?.data) ? response.data : []);
      } catch (error) {
        console.error("[BranchSelector] list error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSelect = async (branchId) => {
    if (branchId === currentBranchId) {
      setOpen(false);
      return;
    }
    if (viewMode === "all") {
      setBranchViewMode("single");
      setViewMode("single");
    }
    setSaving(true);
    try {
      await apiClient.setCurrentBranch(branchId);
      await refreshSession();
      toast.success("Sucursal activa actualizada");
      setOpen(false);
      setTimeout(() => {
        window.location.reload();
      }, 150);
    } catch (error) {
      console.error("[BranchSelector] select error:", error);
      toast.error(error?.response?.data?.error || error?.message || "No se pudo cambiar de sucursal");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;
  const isAdmin = user.role === "admin" || user.isSuperAdmin;

  const accessMode = user?.branchAccessMode || user?.branch_access_mode || "all";
  const canViewAll = isAdmin && accessMode !== "custom";

  const handleViewModeChange = (mode) => {
    if (!canViewAll || mode === viewMode) {
      setOpen(false);
      return;
    }
    setBranchViewMode(mode);
    setViewMode(mode);
    toast.success(
      mode === "all"
        ? "Mostrando datos de todas las sucursales"
        : "Mostrando datos de la sucursal seleccionada"
    );
    setTimeout(() => window.location.reload(), 300);
  };

  return (
    <div className="relative space-y-3">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-border bg-background-secondary hover:bg-muted transition"
        disabled={loading}
      >
        <div className="flex items-center gap-2 text-left">
          <span className="p-1.5 rounded-lg bg-muted text-foreground/70">
            <Building2 className="w-4 h-4" />
          </span>
          <div>
            <p className="text-xs text-foreground/70">Sucursal activa</p>
            <p className="text-sm font-semibold text-foreground">
              {viewMode === "all"
                ? "Todas las sucursales"
                : currentBranch?.name || "Seleccionar sucursal"}
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-foreground/70 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute mt-2 right-0 left-0 z-50 rounded-xl border border-border bg-background shadow-2xl max-h-72 overflow-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-3 text-sm text-foreground/70">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando sucursales...
              </div>
            ) : branches.length === 0 ? (
              <div className="px-4 py-3 text-sm text-foreground/70">
                No tenés sucursales activas habilitadas.
              </div>
            ) : (
              <>
                {[canViewAll ? { id: "all", label: "Todas las sucursales" } : null, ...branches].filter(Boolean).map((option) => {
                  if (option.id === "all") {
                    return (
                      <button
                        key="all"
                        type="button"
                        onClick={() => handleViewModeChange("all")}
                        className={`w-full flex items-center justify-between px-4 py-2 text-left transition text-foreground ${
                          viewMode === "all" ? "bg-accent/40" : "hover:bg-muted"
                        }`}
                      >
                        <span className="text-sm font-medium">Todas las sucursales</span>
                        {viewMode === "all" ? <Check className="w-4 h-4 text-primary" /> : null}
                      </button>
                    );
                  }
                  const branch = option;
                  const isActive = viewMode !== "all" && branch.id === currentBranchId;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => handleSelect(branch.id)}
                      disabled={saving}
                      className={`w-full flex items-center justify-between px-4 py-2 text-left transition text-foreground ${
                        isActive ? "bg-accent/40" : "hover:bg-muted"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{branch.name}</p>
                        <p className="text-xs text-foreground/70">{branch.slug}</p>
                      </div>
                      {isActive ? <Check className="w-4 h-4 text-primary" /> : null}
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}


