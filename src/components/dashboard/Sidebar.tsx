import { Calendar, LayoutDashboard, Package, PieChart, Users, Truck, ClipboardList, ClipboardCheck, Layers } from "lucide-react";
import { useAuthStore } from "@/hooks/useAuthStore";
import { canAccessView } from "@/hooks/useRoleAccess";

export type AdminView = 'inicio' | 'calendario' | 'pipeline' | 'almacen' | 'finanzas' | 'instalaciones' | 'quejas' | 'ajustes' | 'calculadora' | 'historial' | 'plantillas' | 'errores' | 'manuales' | 'asignaciones' | 'validacion' | 'herramientas' | 'utiles' | 'entregas' | 'pedidos' | 'levantamiento' | 'kits';

interface SidebarProps {
  currentView: AdminView;
  onChangeView: (view: AdminView) => void;
}

export default function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const { currentUser } = useAuthStore();
  
  const allNavItems: { id: AdminView; label: string; icon: React.ReactNode }[] = [
    { id: 'inicio', label: 'Inicio', icon: <LayoutDashboard size={20} /> },
    { id: 'pipeline', label: 'Pipeline CRM', icon: <Users size={20} /> },
    { id: 'levantamiento', label: 'Levantamiento Técnico', icon: <ClipboardCheck size={20} /> },
    { id: 'calendario', label: 'Calendario', icon: <Calendar size={20} /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ClipboardList size={20} /> },
    { id: 'entregas', label: 'Entregas / Rutas', icon: <Truck size={20} /> },
    { id: 'almacen', label: 'Almacén', icon: <Package size={20} /> },
    { id: 'kits', label: 'Kits Solares', icon: <Layers size={20} /> },
    { id: 'finanzas', label: 'Finanzas', icon: <PieChart size={20} /> },
  ];

  const navItems = allNavItems.filter(item => canAccessView(currentUser?.role, item.id));

  return (
    <div className="hidden lg:flex flex-col w-64 h-screen bg-[#0d233a]/90 backdrop-blur-xl border-r border-white/10 flex-shrink-0">
      {/* Logo Area */}
      <div className="flex items-center gap-3 p-6 border-b border-white/10">
        <img 
          src="/images/Logo-admin.png" 
          alt="Logo Admin" 
          className="w-10 h-10 object-contain [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]"
          style={{ mixBlendMode: 'screen' }}
        />
        <div>
          <h1 className="font-bold text-white tracking-wide">Convoltaje</h1>
          <p className="text-[10px] text-[#00D9FF] uppercase tracking-wider font-semibold">Workspace</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
        {navItems.map(item => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as AdminView)}
              className={`
                flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium text-sm
                ${isActive 
                  ? 'bg-gradient-to-r from-[#00D9FF]/20 to-transparent text-[#00D9FF] border-l-2 border-[#00D9FF]' 
                  : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'
                }
              `}
            >
              <div className={`${isActive ? 'text-[#00D9FF]' : 'text-white/40'}`}>
                {item.icon}
              </div>
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
