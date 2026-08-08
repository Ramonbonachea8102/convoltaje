import { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { canAccessView } from '@/hooks/useRoleAccess';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useInventoryStore } from '@/hooks/useInventoryStore';
import { useQuejasStore, Complaint } from '@/hooks/useQuejasStore';
import { AdminView } from './Sidebar';
import { SalesRepsModal } from '../SalesRepsModal';
import {
  UserPlus, Wrench, Flame, BarChart3,
  Package, Calendar, Sliders, CheckCircle2,
  ClipboardList, LayoutGrid, Calculator, FileText, Truck, ClipboardCheck,
  Search, ShieldAlert, LogOut, Edit3, DollarSign, MessageSquare, ExternalLink, HelpCircle, X, Globe, Box
} from 'lucide-react';
import { toast } from 'sonner';

interface MobileHomeGridProps {
  onNavigate?: (view: AdminView) => void;
  onSelectView?: (view: AdminView) => void;
}

// ── Tile de Útiles ──────────────────────────────────────────
const UTILES_TILE = {
  id: 'utiles',
  view: 'utiles' as AdminView,
  label: 'Útiles',
  icon: LayoutGrid
};

// ── Matriz de Tiles por Rol (RBAC Visual) ───────────────────
const TILES_BY_ROLE: Record<string, { id: string; view: AdminView; label: string; icon: React.ElementType; defaultBadge?: number }[]> = {
  admin: [
    { id: 'clientes',      view: 'pipeline',      label: 'Clientes',      icon: UserPlus },
    { id: 'levantamiento', view: 'levantamiento', label: 'Levantamiento', icon: ClipboardCheck },
    { id: 'instalaciones', view: 'instalaciones',  label: 'Instalaciones', icon: Wrench },
    { id: 'quejas',        view: 'quejas',         label: 'Quejas',        icon: Flame },
    { id: 'estadisticas',  view: 'finanzas',       label: 'Finanzas / Pagos', icon: BarChart3 },
    { id: 'inventario',    view: 'almacen',        label: 'Inventario',    icon: Package },
    { id: 'calendario',    view: 'calendario',     label: 'Calendario',    icon: Calendar },
    { id: 'ajustes',       view: 'ajustes',        label: 'Ajustes',       icon: Sliders },
    { id: 'validacion',    view: 'validacion',     label: 'Validación',    icon: CheckCircle2 },
    { id: 'entregas',      view: 'entregas',       label: 'Entregas',      icon: Truck },
  ],
  comercial: [
    { id: 'clientes',      view: 'pipeline',      label: 'Clientes',      icon: UserPlus },
    { id: 'calendario',    view: 'calendario',     label: 'Calendario',    icon: Calendar },
    { id: 'quejas',        view: 'quejas',         label: 'Quejas',        icon: Flame },
    { id: 'calculadora',   view: 'calculadora',    label: 'Calculadora',   icon: Calculator },
    { id: 'plantillas',    view: 'plantillas',     label: 'Multimedias',   icon: FileText },
    { id: 'levantamiento', view: 'levantamiento', label: 'Levantamiento', icon: ClipboardCheck },
  ],
  tecnico: [
    { id: 'asignaciones', view: 'asignaciones',   label: 'Asignaciones',  icon: ClipboardList },
    { id: 'instalaciones', view: 'instalaciones',  label: 'Instalaciones', icon: Wrench },
    { id: 'calendario',   view: 'calendario',     label: 'Calendario',    icon: Calendar },
    { id: 'inventario',   view: 'almacen',        label: 'Inventario',    icon: Package },
    { id: 'validacion',   view: 'validacion',     label: 'Validación',    icon: CheckCircle2 },
    { id: 'herramientas', view: 'herramientas',   label: 'Herramientas',  icon: LayoutGrid },
    { id: 'levantamiento', view: 'levantamiento', label: 'Levantamiento', icon: ClipboardCheck },
  ],
  proyectista: [
    { id: 'levantamiento', view: 'levantamiento', label: 'Levantamiento Técnico', icon: ClipboardCheck },
    { id: 'calendario',   view: 'calendario',     label: 'Planificación',      icon: Calendar },
    { id: 'calculadora',  view: 'calculadora',    label: 'Calculadora',        icon: Calculator },
    { id: 'herramientas', view: 'herramientas',   label: 'Herramientas',       icon: LayoutGrid },
  ],
  transportista: [
    { id: 'entregas',    view: 'entregas',        label: 'Entregas / Rutas',   icon: Truck },
    { id: 'inventario',  view: 'almacen',         label: 'Carga / Almacén',    icon: Package },
  ],
  almacenero: [
    { id: 'pedidos',     view: 'pedidos',         label: 'Pedidos Pendientes', icon: ClipboardList },
    { id: 'inventario',  view: 'almacen',         label: 'Gestión Almacén',    icon: Package },
  ],
  contable: [
    { id: 'estadisticas',view: 'finanzas',       label: 'Contabilidad / Pagos', icon: DollarSign },
    { id: 'inventario',  view: 'almacen',         label: 'Inventario',          icon: Package },
    { id: 'plantillas',  view: 'plantillas',      label: 'Plantillas',          icon: FileText },
  ],
  comprador: [
    { id: 'inventario',  view: 'almacen',         label: 'Compras e Inventario', icon: Package },
    { id: 'estadisticas',view: 'finanzas',       label: 'Finanzas',             icon: DollarSign },
  ],
  designado: [
    { id: 'inventario',  view: 'almacen',         label: 'Fijar Precios Almacén', icon: Package },
    { id: 'clientes',    view: 'pipeline',        label: 'Pipeline OTs',          icon: UserPlus },
  ]
};

export default function MobileHomeGrid({ onNavigate, onSelectView }: MobileHomeGridProps) {
  const { currentUser, logout } = useAuthStore();
  const { deals } = useCrmStore();
  const { items: inventoryItems } = useInventoryStore();
  const { complaints } = useQuejasStore();

  const handleNavigate = (view: AdminView) => {
    if (onNavigate) onNavigate(view);
    else if (onSelectView) onSelectView(view);
  };

  const [globalSearch, setGlobalSearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const role = currentUser?.role || 'comercial';
  const isAdminOrComercial = role === 'admin' || role === 'comercial';

  // Badges dinámicos calculados del store
  const openDealsCount = deals.filter(d => d.stage === 'Contacto').length;
  const todayInstallationsCount = deals.filter(d => d.substage === 'en_instalacion').length;
  const openQuejasCount = complaints.filter(q => q.status !== 'resuelta' && q.status !== 'rechazada').length;
  const lowStockCount = inventoryItems.filter(i => i.stock <= (i.initialStock ? i.initialStock * 0.3 : i.minStock)).length;
  const pendingPaymentsCount = deals.filter(d => d.substage === 'pendiente_pago').length;
  const pendingValidationCount = deals.filter(d => d.substage === 'instalacion_completada').length;

  const getDynamicBadge = (view: AdminView): number | undefined => {
    switch (view) {
      case 'pipeline': return openDealsCount || undefined;
      case 'calendario': return todayInstallationsCount || undefined;
      case 'quejas': return openQuejasCount || undefined;
      case 'almacen': return lowStockCount || undefined;
      case 'finanzas': return pendingPaymentsCount || undefined;
      case 'validacion': return pendingValidationCount || undefined;
      default: return undefined;
    }
  };

  // Filtrado de Búsqueda Global (solo Admin/Comercial)
  const searchResults = globalSearch.trim() === '' ? [] : [
    ...deals
      .filter(d => d.name.toLowerCase().includes(globalSearch.toLowerCase()) || d.company.toLowerCase().includes(globalSearch.toLowerCase()) || d.phone.includes(globalSearch))
      .slice(0, 3)
      .map(d => ({ title: `OT: ${d.name}`, sub: `${d.company} • ${d.stage}`, view: 'pipeline' as AdminView })),

    ...inventoryItems
      .filter(i => i.name.toLowerCase().includes(globalSearch.toLowerCase()) || i.code.toLowerCase().includes(globalSearch.toLowerCase()))
      .slice(0, 3)
      .map(i => ({ title: `Producto: ${i.name}`, sub: `Stock: ${i.stock} uds (${i.code})`, view: 'almacen' as AdminView }))
  ];

  // Tiles permitidos por el rol del usuario
  const roleTiles = (TILES_BY_ROLE[role] || TILES_BY_ROLE.comercial)
    .filter(t => canAccessView(role, t.view));

  return (
    <div className="w-full min-h-screen bg-[#0b3c8f] text-white p-4 md:p-6 font-sans relative overflow-x-hidden">
      
      {/* Background radial gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b3c8f] via-[#092e6e] to-[#072152] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">

        {/* ── HEADER DE PERFIL (Común para todos los roles con su estilo institucional) ───────── */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-md shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            
            {/* Avatar con borde naranja */}
            <div className="relative w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-[#FF6B35] via-amber-400 to-[#00D9FF] shadow-lg shrink-0">
              <img
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || 'User'}`}
                alt={currentUser?.name}
                className="w-full h-full object-cover rounded-full bg-[#0b2b63]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser?.name || 'User'}`;
                }}
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 border-2 border-[#0b3c8f] rounded-full" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                ¡Bienvenid@, {currentUser?.name || 'Usuario'}!
              </h2>
              <p className="text-xs text-[#00D9FF] font-semibold uppercase tracking-wider mt-0.5">
                {currentUser?.title?.replace(/^\(|\)$/g, '') || currentUser?.role || 'Asistente Comercial'}
              </p>

              {isAdminOrComercial && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 text-white/80 font-bold">
                    👥 580 clientes
                  </span>
                  <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10 text-amber-300 font-bold">
                    ★ 190 reseñas
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              onClick={() => setShowProfileModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-white/15 transition-all flex items-center gap-1.5"
            >
              <Edit3 size={14} className="text-[#00D9FF]" /> Editar Perfil
            </button>

            <button
              onClick={() => logout()}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold px-3.5 py-2 rounded-xl border border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>

        {/* ── MOCKUP 1 COMPLETO: SOLO PARA ADMIN Y COMERCIAL ───────────────────────── */}
        {isAdminOrComercial ? (
          <>
            {/* 🔍 BARRA DE BÚSQUEDA GLOBAL */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 w-5 h-5" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => {
                    setGlobalSearch(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Búsqueda rápida de todo (Clientes, OTs, Productos, Inventario)..."
                  className="w-full bg-white/10 text-white placeholder-white/50 text-sm pl-12 pr-4 py-3.5 rounded-2xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#00D9FF] backdrop-blur-md shadow-xl transition-all"
                />
              </div>

              {/* Dropdown de Búsqueda Global */}
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0b2b63] border border-white/20 rounded-2xl p-2 shadow-2xl z-40 backdrop-blur-xl">
                  {searchResults.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleNavigate(res.view);
                        setShowSearchDropdown(false);
                        setGlobalSearch('');
                      }}
                      className="w-full text-left p-3 hover:bg-white/10 rounded-xl transition-colors flex justify-between items-center"
                    >
                      <div>
                        <p className="font-bold text-white text-xs">{res.title}</p>
                        <p className="text-[11px] text-white/60">{res.sub}</p>
                      </div>
                      <ExternalLink size={14} className="text-[#00D9FF]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ☀️ SECCIÓN 1: SEGUIMIENTO DIARIO */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" /> Seguimiento Diario
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'clientes', view: 'pipeline' as AdminView, label: 'Clientes', icon: UserPlus, badge: openDealsCount },
                  { id: 'calendario', view: 'calendario' as AdminView, label: 'Calendario', icon: Calendar, badge: todayInstallationsCount },
                  { id: 'quejas', view: 'quejas' as AdminView, label: 'Quejas', icon: Flame, badge: openQuejasCount },
                ].map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => handleNavigate(tile.view)}
                    className="bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl p-5 text-left transition-all group flex flex-col justify-between backdrop-blur-md relative overflow-hidden active:scale-95 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#00D9FF] group-hover:scale-110 transition-transform">
                        <tile.icon size={24} />
                      </div>
                      {tile.badge !== undefined && tile.badge > 0 && (
                        <span className="bg-[#FF6B35] text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md">
                          {tile.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-base text-white mt-4 group-hover:text-[#00D9FF] transition-colors">
                      {tile.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ⌛ SECCIÓN 2: ESTADOS GENERALES */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00D9FF]" /> Estados Generales
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'inventario', view: 'almacen' as AdminView, label: 'Inventario', icon: Package, badge: lowStockCount },
                  { id: 'pagos', view: 'finanzas' as AdminView, label: 'Pagos', icon: DollarSign, badge: pendingPaymentsCount },
                  { id: 'validacion', view: 'validacion' as AdminView, label: 'Validación', icon: CheckCircle2, badge: pendingValidationCount },
                ].map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => handleNavigate(tile.view)}
                    className="bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl p-5 text-left transition-all group flex flex-col justify-between backdrop-blur-md relative overflow-hidden active:scale-95 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#00D9FF] group-hover:scale-110 transition-transform">
                        <tile.icon size={24} />
                      </div>
                      {tile.badge !== undefined && tile.badge > 0 && (
                        <span className="bg-[#00D9FF] text-slate-950 font-black text-xs px-2.5 py-1 rounded-full shadow-md">
                          {tile.badge}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-base text-white mt-4 group-hover:text-[#00D9FF] transition-colors">
                      {tile.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ⚙️ SECCIÓN 3: HERRAMIENTAS OPORTUNAS */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white/60 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Herramientas Oportunas
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'calculadora', view: 'calculadora' as AdminView, label: 'Calculadora', icon: Calculator },
                  { id: 'multimedias', view: 'plantillas' as AdminView, label: 'Multimedias', icon: FileText },
                  { id: 'estadisticas', view: 'finanzas' as AdminView, label: 'Estadísticas', icon: BarChart3 },
                ].map(tile => (
                  <button
                    key={tile.id}
                    onClick={() => handleNavigate(tile.view)}
                    className="bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl p-5 text-left transition-all group flex flex-col justify-between backdrop-blur-md relative overflow-hidden active:scale-95 shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#00D9FF] group-hover:scale-110 transition-transform">
                        <tile.icon size={24} />
                      </div>
                    </div>
                    <span className="font-bold text-base text-white mt-4 group-hover:text-[#00D9FF] transition-colors">
                      {tile.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* ── LAYOUT SIMPLIFICADO PARA ROLES OPERATIVOS (Técnico, Proyectista, Transportista, etc.) ── */
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/70 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D9FF]" /> Módulos Asignados para tu Rol
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {roleTiles.map(tile => {
                const badge = getDynamicBadge(tile.view);
                return (
                  <button
                    key={tile.id}
                    onClick={() => handleNavigate(tile.view)}
                    className="bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl p-5 text-left transition-all group flex flex-col justify-between backdrop-blur-md relative overflow-hidden active:scale-95 shadow-lg min-h-[120px]"
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-[#00D9FF] group-hover:scale-110 transition-transform">
                        <tile.icon size={24} />
                      </div>
                      {badge !== undefined && badge > 0 && (
                        <span className="bg-[#FF6B35] text-white font-extrabold text-xs px-2.5 py-1 rounded-full shadow-md">
                          {badge}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm sm:text-base text-white mt-4 group-hover:text-[#00D9FF] transition-colors">
                      {tile.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TILE DE ÚTILES (Común para todos los roles) ─────────────────────────── */}
        <div className="pt-2">
          <button
            onClick={() => handleNavigate(UTILES_TILE.view)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/15 rounded-2xl p-4 text-left transition-all group flex items-center justify-between backdrop-blur-md active:scale-95 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-400">
                <UTILES_TILE.icon size={20} />
              </div>
              <span className="font-bold text-sm text-white group-hover:text-amber-400 transition-colors">
                {UTILES_TILE.label} (Manuales, Documentos y Recursos)
              </span>
            </div>
            <span className="text-xs text-white/50 group-hover:text-white transition-colors font-semibold">Abrir →</span>
          </button>
        </div>

        {/* ── FOOTER DE LINKS & DISCLAIMER LEGAL (Solo Admin / Comercial) ──────────── */}
        {isAdminOrComercial && (
          <div className="pt-6 border-t border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/70">
              <button
                onClick={() => handleNavigate('pipeline')}
                className="hover:text-[#00D9FF] flex items-center gap-1.5 transition-colors font-medium"
              >
                <Globe size={14} /> Visitar la Tienda
              </button>

              <a
                href="mailto:soporte@convoltaje.com"
                className="hover:text-[#00D9FF] flex items-center gap-1.5 transition-colors font-medium"
              >
                <MessageSquare size={14} /> Contactar a Soporte
              </a>

              <button
                onClick={() => setShowFaqModal(true)}
                className="hover:text-[#00D9FF] flex items-center gap-1.5 transition-colors font-medium"
              >
                <HelpCircle size={14} /> Preguntas Frecuentes
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-white/60 leading-relaxed font-sans">
                🛡️ Convoltaje ERP Beta v2.4 — Sistema de gestión offline-first para Cuba. Reservados todos los derechos.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Modal Editar Perfil */}
      <SalesRepsModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />

      {/* Modal FAQ */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b2b63] border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto text-white font-sans">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HelpCircle size={20} className="text-[#00D9FF]" /> Preguntas Frecuentes (FAQ)
              </h3>
              <button onClick={() => setShowFaqModal(false)} className="text-white/70 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs text-white/80">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="font-bold text-white text-sm mb-1">¿Cómo creo una nueva Orden de Trabajo (OT)?</p>
                <p>Ve a la sección Clientes (Pipeline), haz clic en "+ Nuevo Lead" e ingresa los datos del cliente y kit seleccionado.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="font-bold text-white text-sm mb-1">¿Cómo reservo stock de un kit?</p>
                <p>En la tarjeta de la OT dentro del Pipeline, presiona el botón "📦 Reservar Kit". El sistema descontará automáticamente del stock disponible y pasará a stock reservado.</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <p className="font-bold text-white text-sm mb-1">¿Qué hago si no hay señal en terreno?</p>
                <p>El levantamiento autoguarda localmente en tu teléfono. Una vez recuperes cobertura, sincroniza con el servidor.</p>
              </div>
            </div>

            <button
              onClick={() => setShowFaqModal(false)}
              className="w-full bg-[#00D9FF] hover:bg-cyan-400 text-slate-950 font-bold py-3 rounded-2xl shadow-lg transition-all mt-6 text-xs"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
