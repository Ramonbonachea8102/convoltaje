import { useState, useEffect } from "react";
import { LogOut, ChevronLeft, ShieldAlert } from "lucide-react";
import { useLocation } from "wouter";
import CalendarCore from "./calendar/CalendarCore";
import OperationsPipeline from "./crm/OperationsPipeline";
import InventoryMain from "./inventory/InventoryMain";
import MobileHomeGrid from "./MobileHomeGrid";
import SalesTemplates from "./crm/SalesTemplates";
import TroubleshootingGuide from "./tech/TroubleshootingGuide";
import CrmCalculator from "./crm/CrmCalculator";
import ManualsLibrary from "./tech/ManualsLibrary";
import InstallationsMain from "./InstallationsMain";
import QuejasMain from "./QuejasMain";
import FinanzasMain from "./FinanzasMain";
import AjustesMain from "./AjustesMain";
import AsignacionesView from "./AsignacionesView";
import ValidationFlow from "./ValidationFlow";
import HerramientasView from "./HerramientasView";
import UtilesHub from "./UtilesHub";
import EntregasView from "./EntregasView";
import PedidosPendientes from "./inventory/PedidosPendientes";
import LevantamientoForm from "./tech/LevantamientoForm";
import { KitsManagement } from "./kits/KitsManagement";
import { useAuthStore } from "@/hooks/useAuthStore";
import { canAccessView } from "@/hooks/useRoleAccess";
import { AdminView } from "./Sidebar";

export default function DashboardPanel() {
  const [, setLocation] = useLocation();
  const { currentUser, logout } = useAuthStore();
  const [currentView, setCurrentView] = useState<AdminView>('inicio');
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);

  // Redireccionar al login si no hay usuario
  useEffect(() => {
    if (!currentUser) {
      setLocation("/admin/login");
    }
  }, [currentUser, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const handleSelectEventForValidation = (eventId: string) => {
    setSelectedEventId(eventId);
    setCurrentView('validacion');
  };

  const handleValidationFinished = () => {
    setSelectedEventId(undefined);
    setCurrentView('inicio');
  };

  const renderContent = () => {
    // Verificación de Permisos por Rol (RBAC)
    if (currentView !== 'inicio' && !canAccessView(currentUser?.role, currentView)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Acceso Restringido</h2>
          <p className="text-sm text-white/60 max-w-xs mb-6">
            Tu rol de <span className="text-[#00D9FF] font-bold uppercase">{currentUser?.role}</span> no tiene permisos para acceder a la sección de <span className="text-white font-bold">{currentView}</span>.
          </p>
          <button
            onClick={() => setCurrentView('inicio')}
            className="px-5 py-2.5 rounded-xl bg-[#00D9FF] hover:bg-[#00c5e6] text-[#0b1b33] font-black text-xs transition-all shadow-lg"
          >
            Volver a Inicio
          </button>
        </div>
      );
    }
    switch (currentView) {
      case 'inicio':
        return <MobileHomeGrid onSelectView={setCurrentView} />;
      case 'calendario':
        return <CalendarCore />;
      case 'pipeline':
        return <OperationsPipeline />;
      case 'almacen':
        return <InventoryMain />;
      case 'instalaciones':
        return <InstallationsMain />;
      case 'quejas':
        return <QuejasMain />;
      case 'finanzas':
        return <FinanzasMain />;
      case 'plantillas':
        return <SalesTemplates />;
      case 'errores':
        return <TroubleshootingGuide />;
      case 'calculadora':
        return <CrmCalculator />;
      case 'manuales':
        return <ManualsLibrary />;
      case 'asignaciones' as AdminView:
        return (
          <AsignacionesView 
            onSelectView={setCurrentView} 
            onSelectEventForValidation={handleSelectEventForValidation} 
          />
        );
      case 'validacion' as AdminView:
        return (
          <ValidationFlow 
            selectedEventId={selectedEventId} 
            onFinished={handleValidationFinished} 
          />
        );
      case 'herramientas' as AdminView:
        return <HerramientasView />;
      case 'ajustes':
        return <AjustesMain />;
      case 'utiles':
        return <UtilesHub onSelectView={setCurrentView} />;
      case 'entregas':
        return <EntregasView onSelectView={setCurrentView} />;
      case 'pedidos':
        return <PedidosPendientes onSelectView={setCurrentView} />;
      case 'levantamiento':
        return <LevantamientoForm />;
      case 'kits' as AdminView:
        return <KitsManagement />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-white/50 py-12">
            <h2 className="text-xl font-bold mb-2 text-white/80">Módulo en Construcción</h2>
            <p className="text-sm">La sección de "{currentView}" estará disponible pronto.</p>
          </div>
        );
    }
  };

  if (!currentUser) return null;

  return (
    <div className="h-screen w-full bg-[#0b3c8f] text-white flex flex-col font-sans overflow-hidden">
      
      {/* Cabecera Móvil/Escritorio unificada para el Dashboard de Botones */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0b3c8f] relative z-20 shadow-sm">
        {currentView !== 'inicio' ? (
          <button 
            onClick={() => setCurrentView('inicio')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors"
          >
            <ChevronLeft size={16} />
            <span>Volver</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/70 font-medium">Sesión: <span className="text-[#00D9FF] font-bold">{currentUser.name}</span></span>
          </div>
        )}
        
        <h3 className="text-sm font-black capitalize text-white tracking-tight">
          {currentView === 'inicio' ? 'Convoltaje Workspace' : 
           currentView === 'pipeline' ? 'Clientes' : 
           currentView === 'almacen' ? 'Almacén' : 
           currentView === 'plantillas' ? 'Plantillas de Venta' : 
           currentView === 'calculadora' ? 'Calculadora Técnica' : 
           currentView === 'manuales' ? 'Biblioteca de Manuales' : 
           currentView === 'errores' ? 'Errores MUST' : 
           currentView === ('asignaciones' as AdminView) ? 'Mis Asignaciones' :
           currentView === ('validacion' as AdminView) ? 'Validación del Trabajo' :
           currentView === ('herramientas' as AdminView) ? 'Herramientas' :
           currentView === 'ajustes' ? 'Configuración' :
            currentView === 'utiles' ? 'Útiles y Herramientas' :
            currentView === 'entregas' ? 'Rutas y Entregas' :
            currentView === 'kits' ? 'Kits Solares' :
            currentView === 'pedidos' ? 'Pedidos Pendientes' : currentView}
        </h3>

        <button 
          onClick={handleLogout}
          className="text-xs text-white/70 hover:text-white font-bold transition-colors bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5"
        >
          Salir
        </button>
      </div>

      {/* Contenido Dinámico de la vista (Grid o Módulo activo) */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mx-auto w-full flex flex-col ${
        currentView === 'inicio' ? 'max-w-lg' : 'max-w-6xl'
      }`}>
        {renderContent()}
      </div>

    </div>
  );
}
