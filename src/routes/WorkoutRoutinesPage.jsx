import React, { useEffect, useState } from "react";
import { apiClient } from "../api";
import { useQuery } from "../shared/useQuery.js";
import { toast } from "sonner";
import { SearchInput } from "../shared/ui.jsx";
import { useDebouncedValue } from "../shared/useDebouncedValue.js";
import { Link, useParams } from "react-router-dom";
import { Plus, Upload } from "lucide-react";

export default function WorkoutRoutinesPage() {
  const { tenantSlug } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const qDebounced = useDebouncedValue(searchQuery, 300);
  const [selectedRoutine, setSelectedRoutine] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [bodyParts, setBodyParts] = useState([]);
  const [selectedBodyParts, setSelectedBodyParts] = useState([]);
  const [routineName, setRoutineName] = useState("");
  const [routineDescription, setRoutineDescription] = useState("");
  const [difficulty, setDifficulty] = useState("intermedio");
  const [duration, setDuration] = useState(60);
  const [assignToCustomerId, setAssignToCustomerId] = useState(null);

  const { data: routines, loading, error, refetch } = useQuery(
    (signal) => apiClient.getAvailableRoutines(),
    []
  );

  // Cargar partes del cuerpo
  useEffect(() => {
    const loadBodyParts = async () => {
      try {
        const data = await apiClient.getBodyParts();
        setBodyParts(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando partes del cuerpo:", error);
      }
    };
    loadBodyParts();
  }, []);

  // Cargar clientes cuando se abre el modal de crear
  useEffect(() => {
    if (showCreateModal) {
      const loadCustomers = async () => {
        setLoadingCustomers(true);
        try {
          const customersData = await apiClient.listCustomers("", null, { limit: 500 });
          setCustomers(Array.isArray(customersData) ? customersData : customersData?.data || []);
        } catch (error) {
          console.error("Error cargando clientes:", error);
        } finally {
          setLoadingCustomers(false);
        }
      };
      loadCustomers();
    }
  }, [showCreateModal]);

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

  const handleCreateRoutine = async () => {
    if (!routineName.trim()) {
      toast.error("El nombre de la rutina es requerido");
      return;
    }

    try {
      setCreating(true);
      const params = {
        name: routineName.trim(),
        description: routineDescription.trim() || '',
        duration_minutes: duration,
        difficulty,
        body_parts: selectedBodyParts,
        exercises_data: {
          exercises: [],
          warmup: [],
          cooldown: [],
        },
      };
      
      if (assignToCustomerId) {
        params.assigned_to_customer_id = assignToCustomerId;
      }

      await apiClient.createWorkoutRoutine(params);
      toast.success("Rutina creada exitosamente");
      setShowCreateModal(false);
      // Resetear formulario
      setRoutineName("");
      setRoutineDescription("");
      setSelectedBodyParts([]);
      setDifficulty("intermedio");
      setDuration(60);
      setAssignToCustomerId(null);
      await refetch();
    } catch (error) {
      console.error("Error creando rutina:", error);
      toast.error(error?.response?.data?.error || "Error al crear la rutina");
    } finally {
      setCreating(false);
    }
  };

  const toggleBodyPart = (bodyPartId) => {
    setSelectedBodyParts((prev) =>
      prev.includes(bodyPartId)
        ? prev.filter((id) => id !== bodyPartId)
        : [...prev, bodyPartId]
    );
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground border border-border rounded-lg hover:bg-background-secondary transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar rutinas
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear rutina
          </button>
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
                      <Link
                        to={`/${tenantSlug}/workout-routines/${routine.id}/edit`}
                        className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground border border-border rounded-lg hover:bg-background-secondary transition-colors"
                      >
                        Editar
                      </Link>
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

      {/* Modal para crear rutina */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => {
            setShowCreateModal(false);
            setRoutineName("");
            setRoutineDescription("");
            setSelectedBodyParts([]);
            setDifficulty("intermedio");
            setDuration(60);
            setAssignToCustomerId(null);
          }}
        >
          <div
            className="bg-background rounded-lg border border-border p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Crear nueva rutina</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setRoutineName("");
                  setRoutineDescription("");
                  setSelectedBodyParts([]);
                  setDifficulty("intermedio");
                  setDuration(60);
                  setAssignToCustomerId(null);
                }}
                className="text-foreground-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Nombre de la rutina */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nombre de la rutina <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={routineName}
                  onChange={(e) => setRoutineName(e.target.value)}
                  placeholder="Ej: Rutina de fuerza para principiantes"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={routineDescription}
                  onChange={(e) => setRoutineDescription(e.target.value)}
                  placeholder="Describe la rutina, objetivos, etc..."
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background min-h-24"
                />
              </div>

              {/* Partes del cuerpo */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Partes del cuerpo (opcional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {bodyParts.map((part) => (
                    <button
                      key={part.id}
                      type="button"
                      onClick={() => toggleBodyPart(part.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedBodyParts.includes(part.id)
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background-secondary/40 hover:bg-background-secondary"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedBodyParts.includes(part.id)}
                          onChange={() => toggleBodyPart(part.id)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">{part.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dificultad y duración */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Dificultad
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
                  >
                    <option value="principiante">Principiante</option>
                    <option value="intermedio">Intermedio</option>
                    <option value="avanzado">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Duración (minutos)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min="15"
                    max="180"
                    step="15"
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
                  />
                </div>
              </div>

              {/* Asignar a cliente (opcional) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Asignar directamente a un cliente (opcional)
                </label>
                <select
                  value={assignToCustomerId || ""}
                  onChange={(e) => setAssignToCustomerId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
                >
                  <option value="">No asignar ahora</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name || "(Sin nombre)"} {customer.phone ? `- ${customer.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setRoutineName("");
                    setRoutineDescription("");
                    setSelectedBodyParts([]);
                    setDifficulty("intermedio");
                    setDuration(60);
                    setAssignToCustomerId(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
                  disabled={creating}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateRoutine}
                  disabled={creating || !routineName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? "Creando..." : "Crear rutina"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importación */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border border-border p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Importar rutinas</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-foreground-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-foreground-secondary mb-4">
                  Puedes importar rutinas desde un archivo Word (.docx) o JSON. El sistema intentará extraer automáticamente la información de la rutina.
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground-secondary mb-2">
                    Archivo Word (.docx)
                  </label>
                  <input
                    type="file"
                    accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      try {
                        setImporting(true);
                        const result = await apiClient.importWorkoutRoutineFromWord(file);

                        if (result?.data) {
                          toast.success(`Rutina "${result.data.name}" importada correctamente desde Word`);
                          await refetch();
                          setShowImportModal(false);
                        }
                      } catch (error) {
                        console.error("Error importando rutina desde Word:", error);
                        toast.error(error?.response?.data?.error || "Error al importar la rutina desde Word");
                      } finally {
                        setImporting(false);
                        e.target.value = ''; // Reset input
                      }
                    }}
                    className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
                    disabled={importing}
                  />
                  <p className="text-xs text-foreground-muted mt-1 mb-3">
                    El documento debe contener el nombre de la rutina, ejercicios con series y repeticiones
                  </p>
                  
                  <div className="bg-background-secondary rounded-lg p-4 border border-border">
                    <p className="text-xs font-medium text-foreground-secondary mb-2">Ejemplo de formato Word:</p>
                    <div className="bg-white dark:bg-gray-900 rounded border border-border p-4 text-sm font-mono text-left whitespace-pre-wrap text-foreground">
{`RUTINA DE PIERNAS Y GLÚTEOS

Descripción: Rutina completa para trabajar piernas y glúteos

Dificultad: Intermedio
Duración: 60 minutos

EJERCICIOS PRINCIPALES

Sentadillas
3 series x 10-12 repeticiones
Descanso: 60 segundos
Descripción: Realizar sentadillas profundas manteniendo la espalda recta

Prensa de piernas
4 series x 8-10 repeticiones
Descanso: 90 segundos
Descripción: Ejecutar con control completo del movimiento

Zancadas
3 series x 12 repeticiones por pierna
Descanso: 45 segundos

CALENTAMIENTO

Movilidad de cadera
2 series x 10 repeticiones

ENFRIAMIENTO

Estiramiento de cuádriceps
30 segundos por pierna`}
                    </div>
                    <p className="text-xs text-foreground-muted mt-2">
                      El sistema detectará automáticamente: nombre, ejercicios, series, repeticiones, descanso y secciones.
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-foreground-secondary mb-2">
                    O sube un archivo JSON con el formato:
                  </p>
                  <pre className="bg-background-secondary p-4 rounded-lg text-xs text-foreground-secondary overflow-x-auto mb-4">
{`[
  {
    "name": "Rutina de ejemplo",
    "description": "Descripción de la rutina",
    "duration_minutes": 60,
    "difficulty": "intermedio",
    "body_parts": ["piernas", "brazos"],
    "exercises": [
      {
        "name": "Sentadillas",
        "body_part": "piernas",
        "sets": 3,
        "reps": "10-12",
        "rest_seconds": 60,
        "description": "Descripción del ejercicio",
        "tips": "Consejos de técnica",
        "video_url": "",
        "image_url": ""
      }
    ],
    "warmup": [],
    "cooldown": []
  }
]`}
                  </pre>
                  <div>
                    <label className="block text-sm font-medium text-foreground-secondary mb-2">
                      Archivo JSON
                    </label>
                    <input
                  type="file"
                  accept=".json,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    try {
                      setImporting(true);
                      const text = await file.text();
                      const jsonData = JSON.parse(text);

                      // Validar que sea un array
                      if (!Array.isArray(jsonData)) {
                        toast.error("El archivo JSON debe contener un array de rutinas");
                        return;
                      }

                      if (jsonData.length === 0) {
                        toast.error("El archivo no contiene rutinas para importar");
                        return;
                      }

                      // Importar las rutinas
                      const result = await apiClient.importWorkoutRoutines(jsonData);

                      if (result?.data) {
                        const { imported, total, errors } = result.data;
                        toast.success(
                          `Se importaron ${imported} de ${total} rutinas${errors ? ` (${errors.length} errores)` : ""}`
                        );
                        
                        if (errors && errors.length > 0) {
                          console.error("Errores de importación:", errors);
                          toast.error(`Algunas rutinas no se pudieron importar. Revisa la consola para más detalles.`);
                        }

                        // Recargar la lista
                        await refetch();
                        setShowImportModal(false);
                      }
                    } catch (error) {
                      console.error("Error importando rutinas:", error);
                      if (error instanceof SyntaxError) {
                        toast.error("El archivo JSON no es válido. Verifica el formato.");
                      } else {
                        toast.error(error?.response?.data?.error || "Error al importar las rutinas");
                      }
                    } finally {
                      setImporting(false);
                      e.target.value = ''; // Reset input
                    }
                  }}
                      className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-background"
                      disabled={importing}
                    />
                  </div>
                </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                  onClick={() => setShowImportModal(false)}
                  disabled={importing}
                  className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:text-foreground"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

