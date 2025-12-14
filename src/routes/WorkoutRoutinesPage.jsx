import React, { useEffect, useState } from "react";
import { apiClient } from "../api";
import { useQuery } from "../shared/useQuery.js";
import { toast } from "sonner";
import { SearchInput } from "../shared/ui.jsx";
import { useDebouncedValue } from "../shared/useDebouncedValue.js";
import { Link, useParams } from "react-router-dom";

export default function WorkoutRoutinesPage() {
  const { tenantSlug } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const qDebounced = useDebouncedValue(searchQuery, 300);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const { data: routines, loading, error, refetch } = useQuery(
    (signal) => apiClient.getAvailableRoutines(),
    []
  );

  const routinesList = Array.isArray(routines) ? routines : [];

  // Filtrar rutinas por búsqueda
  const filteredRoutines = routinesList.filter((routine) => {
    if (!qDebounced) return true;
    const search = qDebounced.toLowerCase();
    return (
      routine.name?.toLowerCase().includes(search) ||
      routine.description?.toLowerCase().includes(search) ||
      routine.difficulty?.toLowerCase().includes(search)
    );
  });

  const handleAssignClick = async (routine) => {
    setSelectedRoutine(routine);
    setShowAssignModal(true);
    // Cargar lista de clientes
    setLoadingCustomers(true);
    try {
      const customersData = await apiClient.listCustomers("", null, { limit: 500 });
      setCustomers(Array.isArray(customersData) ? customersData : customersData?.data || []);
    } catch (error) {
      console.error("Error cargando clientes:", error);
      toast.error("Error al cargar la lista de clientes");
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleAssignToCustomer = async (customerId) => {
    if (!selectedRoutine) return;

    try {
      setAssigning(true);
      await apiClient.assignRoutineToCustomer(selectedRoutine.id, customerId);
      toast.success("Rutina asignada correctamente");
      setShowAssignModal(false);
      setSelectedRoutine(null);
      await refetch();
    } catch (error) {
      console.error("Error asignando rutina:", error);
      toast.error(error?.response?.data?.error || "Error al asignar la rutina");
    } finally {
      setAssigning(false);
    }
  };

  const getAssignedCustomerName = (routine) => {
    if (routine.assigned_to_customer_id) {
      // Primero intentar usar el nombre que viene del backend
      if (routine.assigned_customer_name) {
        return routine.assigned_customer_name;
      }
      // Si no está, buscar en la lista de clientes cargados
      const customer = customers.find((c) => c.id === routine.assigned_to_customer_id);
      return customer ? customer.name : `Cliente #${routine.assigned_to_customer_id}`;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Rutinas de ejercicios</h1>
          <p className="text-sm text-foreground-secondary">
            Gestiona y asigna rutinas de ejercicios a tus clientes
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-full flex flex-col gap-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar rutinas por nombre, descripción o dificultad…"
            width="100%"
          />
        </div>
      </div>

      {/* Lista de rutinas */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-3" />
            <div className="text-sm text-foreground-muted">Cargando rutinas…</div>
          </div>
        ) : error ? (
          <div className="px-6 py-12 text-center">
            <div className="text-sm text-red-400 mb-2">Error al cargar rutinas</div>
            <div className="text-xs text-foreground-muted">{error}</div>
          </div>
        ) : filteredRoutines.length === 0 ? (
          <div className="px-6 py-12 flex flex-col items-center justify-center text-center">
            <div className="text-sm text-foreground-secondary mb-1">
              {qDebounced ? "No se encontraron rutinas" : "Sin rutinas todavía"}
            </div>
            <div className="text-xs text-foreground-muted">
              {qDebounced
                ? "Intenta con otro término de búsqueda"
                : "Las rutinas aparecerán aquí cuando se creen"}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredRoutines.map((routine) => {
              const assignedCustomer = getAssignedCustomerName(routine);
              return (
                <div
                  key={routine.id}
                  className="px-6 py-4 hover:bg-background-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-foreground">{routine.name}</h3>
                        {routine.difficulty && (
                          <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20">
                            {routine.difficulty}
                          </span>
                        )}
                        {routine.duration_minutes && (
                          <span className="text-xs text-foreground-muted">
                            ⏱️ {routine.duration_minutes} min
                          </span>
                        )}
                      </div>
                      {routine.description && (
                        <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
                          {routine.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-foreground-muted">
                        {assignedCustomer ? (
                          <div className="flex items-center gap-2">
                            <span className="text-foreground-secondary">Asignada a:</span>
                            <Link
                              to={`/${tenantSlug}/customers/${routine.assigned_to_customer_id}`}
                              className="text-primary hover:text-primary-hover font-medium"
                            >
                              {assignedCustomer}
                            </Link>
                          </div>
                        ) : (
                          <span className="text-foreground-muted">Sin asignar</span>
                        )}
                        {routine.created_at && (
                          <span>
                            Creada: {new Date(routine.created_at).toLocaleDateString("es-AR")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAssignClick(routine)}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors"
                      >
                        {assignedCustomer ? "Reasignar" : "Asignar"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para asignar rutina */}
      {showAssignModal && selectedRoutine && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowAssignModal(false);
            setSelectedRoutine(null);
          }}
        >
          <div
            className="bg-background rounded-lg border border-border p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Asignar rutina: {selectedRoutine.name}
              </h3>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRoutine(null);
                }}
                className="text-foreground-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {loadingCustomers ? (
              <div className="py-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-sm text-foreground-secondary py-8 text-center">
                No hay clientes disponibles
              </div>
            ) : (
              <div className="space-y-2">
                {customers.map((customer) => {
                  const isAssigned = selectedRoutine.assigned_to_customer_id === customer.id;
                  return (
                    <button
                      key={customer.id}
                      onClick={() => handleAssignToCustomer(customer.id)}
                      disabled={assigning || isAssigned}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isAssigned
                          ? "border-primary bg-primary/10 cursor-not-allowed"
                          : "border-border bg-background-secondary/40 hover:bg-background-secondary"
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-foreground">
                            {customer.name || "(Sin nombre)"}
                          </div>
                          {customer.phone && (
                            <div className="text-xs text-foreground-muted mt-1">
                              {customer.phone}
                            </div>
                          )}
                        </div>
                        {isAssigned && (
                          <span className="text-xs font-medium text-primary">Asignada</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

