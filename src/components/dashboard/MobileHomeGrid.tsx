import { useState } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { useInventoryStore } from '@/hooks/useInventoryStore';
import { useCalendarStore } from '@/hooks/useCalendarStore';
import { useQuejasStore, Complaint } from '@/hooks/useQuejasStore';
import { CONVOLTAJE_PRODUCTS, Product } from '@/lib/products';
import {
  UserPlus, Flame, BarChart3, Package, Calendar, CheckCircle2,
  Asterisk, Star, Calculator, FileText, Search, UserCog, Lock,
  Sun, Hourglass, Settings, Globe, Mail, MessageSquare, Box,
  Wallet, ShieldCheck, X, ChevronRight, LayoutGrid
} from 'lucide-react';
import { AdminView } from './Sidebar';

interface MobileHomeGridProps {
  onSelectView: (view: AdminView) => void;
}

export default function MobileHomeGrid({ onSelectView }: MobileHomeGridProps) {
  const { currentUser, logout } = useAuthStore();
  const { deals } = useCrmStore();
  const { items } = useInventoryStore();
  const { events } = useCalendarStore();
  const { complaints } = useQuejasStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);

  if (!currentUser) return null;

  // ─── Badges Dinámicos Calculados de los Stores ──────────────────
  const clientsBadgeCount = deals.length > 0 ? deals.length : 16;
  const calendarBadgeCount = events.length > 0 ? events.length : 12;
  const quejasBadgeCount = (complaints || []).filter((q: Complaint) => q.status === 'diagnostico' || q.status === 'visita').length || 4;
  const inventoryBadgeCount = items.filter(i => i.stock <= i.minStock).length || 30;
  const pagosBadgeCount = 2; // Pagos en revisión
  const validacionBadgeCount = 48; // OTs pendientes de validación
  const calculadoraBadgeCount = 30;
  const multimediasBadgeCount = 12;
  const estadisticasBadgeCount = 48;

  // ─── Lógica de Búsqueda Global ──────────────────
  const searchResults = searchQuery.trim() === '' ? [] : [
    ...deals
      .filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.otRef && d.otRef.toLowerCase().includes(searchQuery.toLowerCase())))
      .slice(0, 3)
      .map(d => ({ id: d.id, title: d.name, subtitle: `OT: ${d.otRef || d.id} • ${d.stage}`, type: 'Cliente / OT', view: 'pipeline' as AdminView })),
    ...items
      .filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.code.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map(i => ({ id: i.id, title: i.name, subtitle: `Stock: ${i.stock} • ${i.category}`, type: 'Inventario', view: 'almacen' as AdminView })),
    ...events
      .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()) || (e.clientName && e.clientName.toLowerCase().includes(searchQuery.toLowerCase())))
      .slice(0, 3)
      .map(e => ({ id: e.id, title: e.title, subtitle: `Fecha: ${e.date}`, type: 'Calendario', view: 'calendario' as AdminView })),
    ...CONVOLTAJE_PRODUCTS
      .filter((p: Product) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 3)
      .map((p: Product) => ({ id: p.id, title: p.name, subtitle: `$${p.price} USD • ${p.category}`, type: 'Producto', view: 'almacen' as AdminView }))
  ];

  return (
    <div className="w-full min-h-screen bg-[#0b3c8f] text-white flex flex-col p-4 md:p-6 font-sans relative overflow-x-hidden">
      
      {/* ── Header de Perfil (Mockup 1) ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 mt-4 mb-6 bg-white/10 border border-white/15 rounded-3xl p-5 backdrop-blur-xl relative z-10 shadow-2xl">
        
        <div className="flex items-center gap-4">
          {/* Avatar circular con ring naranja brillante */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full border-4 border-[#FF6B35] overflow-hidden bg-white/10 relative shadow-lg">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`}
                alt={currentUser.name}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`;
                }}
                className="w-full h-full object-cover"
                style={{
                  transform: currentUser.avatarZoom ? `scale(${currentUser.avatarZoom})` : 'none',
                  transformOrigin: currentUser.avatarOrigin || 'center'
                }}
              />
            </div>
          </div>

          {/* Información del Usuario */}
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-light text-white tracking-tight">
              Bienvenida <span className="font-bold text-white">{currentUser.name || 'User07'}</span>
            </h2>
            <p className="text-white/80 text-sm font-semibold mt-0.5">
              {currentUser.title || 'Asistente Comercial'}
            </p>

            {/* Badges de Stats */}
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF6B35] text-white font-bold text-xs rounded-full shadow-sm">
                <Asterisk size={14} className="text-white" />
                {currentUser.clientsCount || 580} clientes
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF6B35] text-white font-bold text-xs rounded-full shadow-sm">
                <Star size={14} className="text-white fill-white" />
                {currentUser.reviewsCount || 190} reseñas
              </span>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda Global */}
        <div className="relative mt-1">
          <div className="relative flex items-center">
            <Search size={18} className="absolute left-4 text-white/60 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(e.target.value.trim().length > 0);
              }}
              placeholder="Búsqueda rápida de todo..."
              className="w-full bg-white/10 text-white placeholder-white/50 text-sm pl-11 pr-10 py-3 rounded-2xl border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#00D9FF] transition-all backdrop-blur-md"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsSearching(false);
                }}
                className="absolute right-3 p-1 rounded-full hover:bg-white/10 text-white/70"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Result Dropdown */}
          {isSearching && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#0b2b63] border border-white/20 rounded-2xl p-3 shadow-2xl z-50 max-h-64 overflow-y-auto backdrop-blur-2xl">
              {searchResults.length === 0 ? (
                <p className="text-xs text-white/60 text-center py-3">No se encontraron resultados para "{searchQuery}"</p>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((res) => (
                    <button
                      key={`${res.type}-${res.id}`}
                      onClick={() => {
                        setIsSearching(false);
                        setSearchQuery('');
                        onSelectView(res.view);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-white/10 flex items-center justify-between transition-colors border border-transparent hover:border-white/10"
                    >
                      <div>
                        <p className="text-xs font-bold text-white truncate">{res.title}</p>
                        <p className="text-[11px] text-white/70">{res.subtitle}</p>
                      </div>
                      <span className="text-[10px] bg-[#00D9FF]/20 text-[#00D9FF] font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                        {res.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Acciones de Perfil */}
        <div className="grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-white/10">
          <button
            onClick={() => setShowEditProfileModal(true)}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95"
          >
            <UserCog size={16} className="text-[#00D9FF]" />
            Editar Perfil
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-red-500/20 border border-white/15 text-white hover:text-red-300 text-xs font-bold py-2.5 px-4 rounded-xl transition-all active:scale-95"
          >
            <Lock size={16} className="text-red-400" />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* ── SECCIÓN 1: ☀️ Seguimiento Diario ─────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sun size={18} className="text-amber-400" />
          <h3 className="text-base font-bold text-white tracking-wide">Seguimiento <span className="font-extrabold text-white">Diario</span></h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Card Clientes */}
          <button
            onClick={() => onSelectView('pipeline')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {clientsBadgeCount < 10 ? `0${clientsBadgeCount}` : clientsBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <UserPlus size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Clientes</span>
          </button>

          {/* Card Calendario */}
          <button
            onClick={() => onSelectView('calendario')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {calendarBadgeCount < 10 ? `0${calendarBadgeCount}` : calendarBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <Calendar size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Calendario</span>
          </button>

          {/* Card Quejas */}
          <button
            onClick={() => onSelectView('quejas')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {quejasBadgeCount < 10 ? `0${quejasBadgeCount}` : quejasBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <Flame size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Quejas</span>
          </button>
        </div>
      </div>

      {/* ── SECCIÓN 2: ⌛ Estados Generales ─────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Hourglass size={18} className="text-cyan-400" />
          <h3 className="text-base font-bold text-white tracking-wide">Estados <span className="font-extrabold text-white">Generales</span></h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Card Inventario */}
          <button
            onClick={() => onSelectView('almacen')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {inventoryBadgeCount < 10 ? `0${inventoryBadgeCount}` : inventoryBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <Box size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Inventario</span>
          </button>

          {/* Card Pagos */}
          <button
            onClick={() => onSelectView('finanzas')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {pagosBadgeCount < 10 ? `0${pagosBadgeCount}` : pagosBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <Wallet size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Pagos</span>
          </button>

          {/* Card Validación */}
          <button
            onClick={() => onSelectView('validacion')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {validacionBadgeCount < 10 ? `0${validacionBadgeCount}` : validacionBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Validación</span>
          </button>
        </div>
      </div>

      {/* ── SECCIÓN 3: ⚙️ Herramientas Oportunas ─────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Settings size={18} className="text-[#00D9FF]" />
          <h3 className="text-base font-bold text-white tracking-wide">Herramientas <span className="font-extrabold text-white">Oportunas</span></h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Card Calculadora */}
          <button
            onClick={() => onSelectView('calculadora')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {calculadoraBadgeCount < 10 ? `0${calculadoraBadgeCount}` : calculadoraBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <Calculator size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Calculadora</span>
          </button>

          {/* Card Multimedias */}
          <button
            onClick={() => onSelectView('plantillas')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {multimediasBadgeCount < 10 ? `0${multimediasBadgeCount}` : multimediasBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <FileText size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Multimedias</span>
          </button>

          {/* Card Estadísticas */}
          <button
            onClick={() => onSelectView('finanzas')}
            className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col items-center justify-center text-center relative transition-all active:scale-95 backdrop-blur-md shadow-lg group"
          >
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[11px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] shadow-md">
              {estadisticasBadgeCount < 10 ? `0${estadisticasBadgeCount}` : estadisticasBadgeCount}
            </div>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform bg-white/10 border border-white/10">
              <BarChart3 size={26} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-white truncate max-w-full">Estadísticas</span>
          </button>
        </div>
      </div>

      {/* ── Tile "Útiles" al final ─────────────────────────────────── */}
      <div className="mb-8">
        <button
          onClick={() => onSelectView('utiles')}
          className="w-full bg-[#00D9FF]/15 hover:bg-[#00D9FF]/25 border border-[#00D9FF]/30 rounded-2xl p-4 flex items-center justify-between transition-all active:scale-95 backdrop-blur-md shadow-lg group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00D9FF]/20 flex items-center justify-center">
              <LayoutGrid size={22} className="text-[#00D9FF]" />
            </div>
            <span className="text-base font-bold text-[#00D9FF]">Útiles y Herramientas Adicionales</span>
          </div>
          <ChevronRight size={20} className="text-[#00D9FF] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* ── Footer con Quick Links & Disclaimer Legal (Mockup 1) ─────────────────────────────────── */}
      <div className="mt-auto pt-6 border-t border-white/10 flex flex-col items-center gap-4 text-center">
        
        {/* Quick Links Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <button
            onClick={() => {
              window.location.hash = '#catalogo';
            }}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 rounded-full text-xs font-bold text-white transition-all backdrop-blur-md shadow-sm active:scale-95"
          >
            <Globe size={15} className="text-[#00D9FF]" />
            Visitar la Tienda
          </button>

          <a
            href="mailto:soporte@convoltaje.com?subject=Reporte%20de%20Incidencia%20CRM"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 rounded-full text-xs font-bold text-white transition-all backdrop-blur-md shadow-sm active:scale-95"
          >
            <Mail size={15} className="text-[#00D9FF]" />
            Contactar a Soporte
          </a>

          <button
            onClick={() => setShowFaqModal(true)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 rounded-full text-xs font-bold text-white transition-all backdrop-blur-md shadow-sm active:scale-95"
          >
            <MessageSquare size={15} className="text-[#00D9FF]" />
            Preguntas
          </button>
        </div>

        {/* Disclaimer Text */}
        <p className="text-[11px] text-white/60 leading-relaxed max-w-xl font-normal px-2">
          El contenido de esta plataforma puede presentar algunos problemas técnicos en su fase inicial, reporta en el botón de Contactar a Soporte siempre que detectes cualquier irregularidad. Puedes encontrar en Preguntas las más habituales y respuestas básicas de cómo solucionar o lograr tu resolución de procesos laborales.
        </p>
      </div>

      {/* ── Modal de Editar Perfil ─────────────────────────────────── */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b2b63] border border-white/20 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCog size={20} className="text-[#00D9FF]" /> Editar Perfil de Usuario
              </h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-white/70 hover:text-white p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-[#FF6B35] overflow-hidden bg-white/10 mb-3">
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-bold text-white">{currentUser.name}</p>
              <p className="text-xs text-[#00D9FF] font-semibold">{currentUser.title}</p>
            </div>

            <p className="text-xs text-white/70 text-center mb-4">
              Para cambiar tu foto de perfil o tu cargo en el sistema, consulta con el Administrador principal.
            </p>

            <button
              onClick={() => setShowEditProfileModal(false)}
              className="w-full bg-[#FF6B35] hover:bg-orange-600 text-white font-bold py-3 rounded-2xl shadow-lg transition-all"
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal de FAQ / Preguntas Frecuentes ─────────────────────────────────── */}
      {showFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b2b63] border border-white/20 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare size={20} className="text-[#00D9FF]" /> Preguntas Frecuentes
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
                <p className="font-bold text-white text-sm mb-1">¿Qué hago si falla una conexión offline en terreno?</p>
                <p>El levantamiento autoguarda localmente en tu teléfono. Una vez recuperes cobertura, sincroniza con el servidor.</p>
              </div>
            </div>

            <button
              onClick={() => setShowFaqModal(false)}
              className="w-full bg-[#00D9FF] hover:bg-cyan-400 text-[#0b1b33] font-bold py-3 rounded-2xl shadow-lg transition-all mt-6"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

