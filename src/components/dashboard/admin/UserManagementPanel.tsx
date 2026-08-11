import { useState, useEffect } from "react";
import { UserSession, UserRole, useAuthStore } from "@/hooks/useAuthStore";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { UserPlus, Shield, Mail, Phone, RefreshCw, CheckCircle2, AlertCircle, X, Users } from "lucide-react";
import { toast } from "sonner";

interface SystemRole {
  id: string;
  nombre: string;
  descripcion: string;
}

const DEFAULT_ROLES: SystemRole[] = [
  { id: "admin", nombre: "Administrador", descripcion: "Acceso total al sistema y gestión de usuarios" },
  { id: "ceo", nombre: "CEO / Dirección", descripcion: "Dirección general y toma de decisiones" },
  { id: "comercial", nombre: "Asesor Comercial", descripcion: "Gestión de clientes, cotizaciones y ventas" },
  { id: "tecnico", nombre: "Técnico / Instalador", descripcion: "Instalación y diagnóstico técnico" },
  { id: "proyectista", nombre: "Proyectista", descripcion: "Diseño técnico y levantamiento de proyectos" },
  { id: "transportista", nombre: "Transportista / Logística", descripcion: "Despacho y entrega de equipamiento" },
  { id: "almacenero", nombre: "Almacenero", descripcion: "Gestión de inventarios y traslados de material" },
  { id: "comprador", nombre: "Comprador", descripcion: "Gestión de compras e insumos" },
  { id: "designado", nombre: "Designado", descripcion: "Supervisión y asignaciones especiales" }
];

export default function UserManagementPanel() {
  const { currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserSession[]>([]);
  const [roles, setRoles] = useState<SystemRole[]>(DEFAULT_ROLES);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    rol_id: "comercial" as UserRole,
    password: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Cargar perfiles
      const { data: profileData, error: profileErr } = await supabase
        .from("perfiles")
        .select("*")
        .order("nombre", { ascending: true });

      if (profileData && profileData.length > 0) {
        setUsers(
          profileData.map((row) => ({
            id: row.id,
            name: row.nombre,
            role: (row.rol_id || row.rol) as UserRole,
            title: row.descripcion_corta || "",
            avatar: row.foto_url || "",
            phone: row.telefono || "",
          }))
        );
      }

      // 2. Cargar roles desde la tabla relacional roles si existe
      const { data: rolesData } = await supabase.from("roles").select("*");
      if (rolesData && rolesData.length > 0) {
        setRoles(rolesData);
      }
    } catch (err) {
      console.warn("Usando perfiles locales de fallback...", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email) {
      toast.error("Por favor completa el nombre y el correo electrónico.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Invocamos la Edge Function protegida de administración
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: formData.email,
          password: formData.password || undefined,
          nombre: formData.nombre,
          telefono: formData.telefono,
          rol_id: formData.rol_id,
        },
      });

      if (error || (data && data.error)) {
        throw new Error(error?.message || data?.error || "Error al crear usuario.");
      }

      toast.success(`✅ Usuario ${formData.nombre} creado/invitado exitosamente.`);
      setIsModalOpen(false);
      setFormData({ nombre: "", email: "", telefono: "", rol_id: "comercial", password: "" });
      loadData();
    } catch (err: any) {
      console.error("Error al crear usuario:", err);
      toast.error(err.message || "Error al procesar solicitud en el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "ceo";

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-2xl border border-slate-800">
        <Shield size={36} className="mx-auto text-orange-500 mb-3" />
        <h3 className="text-lg font-bold text-white mb-1">Acceso Restringido</h3>
        <p className="text-xs">Solo los usuarios con rol Administrador o CEO pueden gestionar el equipo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Gestión de Usuarios y Roles</h2>
            <p className="text-xs text-slate-400">Administración de credenciales y permisos de acceso del equipo Convoltaje.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white text-xs"
          >
            <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-500/20"
          >
            <UserPlus size={16} className="mr-1.5" />
            Crear Usuario CRM
          </Button>
        </div>
      </div>

      {/* Lista de Usuarios */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Miembros Registrados ({users.length})
          </span>
          <span className="text-[11px] text-cyan-400 font-semibold bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            Base de Datos Supabase
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 overflow-x-auto">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-sm shrink-0">
                  {u.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate">{u.name}</h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                    {u.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-500" /> {u.phone}
                      </span>
                    )}
                    <span className="text-slate-500 truncate">{u.title || u.role}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-slate-800 border border-slate-700 text-cyan-300">
                  {roles.find((r) => r.id === u.role)?.nombre || u.role}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  <CheckCircle2 size={12} /> Activo
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal para Crear / Invitar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <UserPlus size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Nuevo Usuario CRM</h3>
                <p className="text-xs text-slate-400">Crea el acceso en Supabase Auth y asigna su rol de equipo.</p>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej. Jean Paulo"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ej. jeanpaulo@convoltaje.com"
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Teléfono de Referencia</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+5355144097"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Rol Asignado</label>
                <select
                  value={formData.rol_id}
                  onChange={(e) => setFormData({ ...formData, rol_id: e.target.value as UserRole })}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                      {r.nombre} — ({r.descripcion})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1.5">Contraseña (Opcional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Dejar vacío para enviar invitación por email"
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Si la dejas en blanco, Supabase enviará un enlace de bienvenida por correo.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  {isSubmitting ? "Procesando en Supabase..." : "Crear / Invitar Usuario"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
