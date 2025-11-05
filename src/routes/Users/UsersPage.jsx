import { useState } from "react";
import { useQuery } from "../../shared/useQuery.js";
import { apiClient } from "../../api";
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Key,
  Mail
} from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPermissions, setShowPermissions] = useState(null);

  // Cargar usuarios
  const { data: users = [], loading, error, refetch } = useQuery(
    async () => {
      const response = await apiClient.get("/api/users");
      return response.data?.data || [];
    },
    []
  );

  // Cargar permisos disponibles
  const { data: permissions = [] } = useQuery(
    async () => {
      const response = await apiClient.get("/api/users/permissions/list");
      return response.data?.data || [];
    },
    []
  );

  // Cargar roles
  const { data: rolesData } = useQuery(
    async () => {
      const response = await apiClient.get("/api/users/roles/list");
      return response.data?.data || {};
    },
    []
  );

  const handleDelete = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      await apiClient.delete(`/api/users/${id}`);
      toast.success("Usuario eliminado");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error al eliminar");
    }
  };

  const getRoleBadge = (role) => {
    const configs = {
      admin: { color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", label: "Administrador", icon: Shield },
      staff: { color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400", label: "Empleado", icon: UserCheck },
      user: { color: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300", label: "Usuario", icon: Users },
    };
    const config = configs[role] || configs.user;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const filteredUsers = (users || []).filter(user => 
    !search || 
    (user.email && user.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">Usuarios y Empleados</h1>
          <p className="text-sm sm:text-base text-foreground-secondary">
            Gestiona usuarios, permisos y roles
          </p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">Nuevo Usuario</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Lista de usuarios */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-foreground-secondary mt-4">Cargando usuarios...</p>
        </div>
      ) : error ? (
        <div className="card p-6 text-center text-red-500">
          {error}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-foreground-muted" />
          <p className="text-foreground-secondary">No hay usuarios</p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mt-4"
          >
            Crear primer usuario
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(filteredUsers || []).map((user) => (
            <div key={user.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
                    {user.email[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{user.email}</div>
                    {getRoleBadge(user.role)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingUser(user);
                      setShowModal(true);
                    }}
                    className="p-2 rounded-lg text-foreground-secondary hover:text-primary hover:bg-primary-light dark:hover:bg-primary/20 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 rounded-lg text-foreground-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-secondary">Estado:</span>
                  <span className={`${user.is_active ? 'text-emerald-500' : 'text-red-500'}`}>
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="w-4 h-4" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <UserX className="w-4 h-4" />
                        Inactivo
                      </span>
                    )}
                  </span>
                </div>

                {user.appointments_count !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Turnos:</span>
                    <span className="text-foreground">{user.appointments_count}</span>
                  </div>
                )}

                {user.last_login_at && (
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-secondary">Último acceso:</span>
                    <span className="text-foreground text-xs">
                      {new Date(user.last_login_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-border">
                  <button
                    onClick={() => setShowPermissions(user.id === showPermissions ? null : user.id)}
                    className="text-xs text-primary hover:text-primary-hover flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" />
                    {user.id === showPermissions ? "Ocultar" : "Ver"} permisos
                  </button>
                  {showPermissions === user.id && user.permissions && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(user.permissions).map(([module, perms]) => (
                        <div key={module} className="text-xs">
                          <span className="font-medium text-foreground">{module}:</span>
                          <span className="text-foreground-secondary ml-1">
                            {Array.isArray(perms) ? perms.join(", ") : "ninguno"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de usuario */}
      {showModal && (
        <UserModal
          user={editingUser}
          permissions={permissions}
          rolesData={rolesData}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={() => {
            refetch();
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}

// Modal para crear/editar usuario
function UserModal({ user, permissions, rolesData, onClose, onSave }) {
  const [formData, setFormData] = useState({
    email: user?.email || "",
    password: "",
    role: user?.role || "staff",
    is_active: user?.is_active !== undefined ? user.is_active : true,
    permissions: user?.permissions || {}
  });
  const [loading, setLoading] = useState(false);

  // Agrupar permisos por módulo
  const permissionsByModule = (permissions || []).reduce((acc, perm) => {
    if (!acc[perm.module]) {
      acc[perm.module] = [];
    }
    acc[perm.module].push(perm);
    return acc;
  }, {});

  const togglePermission = (module, action) => {
    const modulePerms = formData.permissions[module] || [];
    const permCode = `${module}.${action}`;
    
    if (modulePerms.includes(permCode) || modulePerms.includes(`${module}.admin`)) {
      // Remover permiso
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          [module]: modulePerms.filter(p => p !== permCode && p !== `${module}.admin`)
        }
      });
    } else {
      // Agregar permiso
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          [module]: [...modulePerms, permCode]
        }
      });
    }
  };

  const toggleModuleAdmin = (module) => {
    const modulePerms = formData.permissions[module] || [];
    const hasAdmin = modulePerms.includes(`${module}.admin`);
    
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [module]: hasAdmin ? [] : [`${module}.admin`]
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Preparar datos para enviar
      const payload = { ...formData };
      
      // Si es edición y la contraseña está vacía, no incluirla en el payload
      if (user && (!payload.password || payload.password.trim() === "")) {
        delete payload.password;
      }
      
      if (user) {
        await apiClient.put(`/api/users/${user.id}`, payload);
        toast.success("Usuario actualizado");
      } else {
        await apiClient.post("/api/users", payload);
        toast.success("Usuario creado");
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
        className="bg-background rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-scale-in"
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
            {user ? "Editar Usuario" : "Nuevo Usuario"}
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
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="usuario@ejemplo.com"
                  required
                  disabled={!!user}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  {user ? "Nueva Contraseña" : "Contraseña"} <span className="text-red-500">{!user && "*"}</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base"
                  placeholder={user ? "Dejar vacío para no cambiar" : "Mínimo 6 caracteres"}
                  required={!user}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 text-sm sm:text-base appearance-none cursor-pointer"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem'
                  }}
                  required
                >
                  <option value="admin">Administrador</option>
                  <option value="staff">Empleado</option>
                  <option value="user">Usuario</option>
                </select>
              </div>

            <div className="sm:col-span-2 flex items-center gap-3 pt-2 sm:pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">Usuario activo</span>
              </label>
            </div>
          </div>

          {/* Permisos */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-base sm:text-lg">Permisos</h3>
            <div className="space-y-3 sm:space-y-4">
              {Object.entries(permissionsByModule).map(([module, modulePerms]) => {
                const modulePermsArray = formData.permissions[module] || [];
                const hasAdmin = modulePermsArray.includes(`${module}.admin`);
                
                return (
                  <div key={module} className="card p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                      <h4 className="font-medium text-foreground capitalize text-sm sm:text-base">{module}</h4>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={hasAdmin}
                          onChange={() => toggleModuleAdmin(module)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-xs sm:text-sm text-foreground-secondary">Admin completo</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {(modulePerms || []).map((perm) => {
                        const isChecked = modulePermsArray.includes(perm.code) || hasAdmin;
                        return (
                          <label
                            key={perm.id}
                            className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-background-secondary transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePermission(module, perm.action)}
                              disabled={hasAdmin}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary disabled:opacity-50"
                            />
                            <span className="text-xs sm:text-sm text-foreground-secondary capitalize">
                              {perm.action}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
              user ? "Actualizar" : "Crear"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

