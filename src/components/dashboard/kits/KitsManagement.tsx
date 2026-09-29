import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Package,
  Layers,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Eye
} from 'lucide-react';
import { useKitsStore, SolarKit, KitCategory } from '@/hooks/useKitsStore';
import { KitFormModal } from './KitFormModal';
import { toast } from 'sonner';

export const KitsManagement: React.FC = () => {
  const { kits, addKit, updateKit, deleteKit, resetToDefaults } = useKitsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<SolarKit | null>(null);
  const [deletingKitId, setDeletingKitId] = useState<string | null>(null);
  const [viewingKit, setViewingKit] = useState<SolarKit | null>(null);

  // Filtered kits based on search & category
  const filteredKits = useMemo(() => {
    return kits.filter((kit) => {
      const matchesCategory =
        selectedCategory === 'all' || kit.category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      if (!query) return matchesCategory;

      const matchesName = kit.name.toLowerCase().includes(query);
      const matchesDesc = kit.description?.toLowerCase().includes(query);
      const matchesComponents = kit.componentsSummary?.some((comp) =>
        comp.toLowerCase().includes(query)
      );

      return matchesCategory && (matchesName || matchesDesc || matchesComponents);
    });
  }, [kits, searchQuery, selectedCategory]);

  const handleOpenCreateModal = () => {
    setEditingKit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (kit: SolarKit) => {
    setEditingKit(kit);
    setIsModalOpen(true);
  };

  const handleSaveKit = (kitData: {
    name: string;
    category: KitCategory;
    imageUrl: string;
    componentsSummary: string[];
    totalPrice: number;
    description?: string;
  }) => {
    if (editingKit) {
      updateKit(editingKit.id, kitData);
    } else {
      addKit(kitData);
    }
  };

  const handleConfirmDelete = () => {
    if (deletingKitId) {
      deleteKit(deletingKitId);
      toast.success('Kit solar eliminado con éxito.');
      setDeletingKitId(null);
    }
  };

  const kitToDelete = kits.find((k) => k.id === deletingKitId);

  return (
    <div className="w-full flex-1 flex flex-col space-y-6">
      {/* Action Bar & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-[#00D9FF]" size={22} />
            <span>Catálogo de Kits Solares</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#00D9FF]/20 text-[#00D9FF] font-bold">
              {kits.length} {kits.length === 1 ? 'kit' : 'kits'}
            </span>
          </h2>
          <p className="text-xs text-white/60 mt-0.5">
            Administra configuraciones de sistemas completos y precios directos listos para el cliente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetToDefaults}
            title="Restaurar kits iniciales de fábrica si la lista se vacía"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Restaurar Predefinidos</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00D9FF] hover:bg-[#00c5e6] text-[#0b1b33] text-xs font-black transition-all shadow-lg shadow-[#00D9FF]/20 active:scale-95"
          >
            <Plus size={16} />
            <span>Crear Kit Solar</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white/5 border border-white/10 rounded-2xl p-3.5 backdrop-blur-md">
        {/* Search */}
        <div className="md:col-span-7 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de kit o componente (ej: inversor 6kW, baterías)..."
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]/50 transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="md:col-span-5 flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {['all', 'Residencial', 'Comercial', 'Personalizado'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#00D9FF] text-[#0b1b33] border-[#00D9FF] font-bold shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border-white/10'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Kits List / Table Responsive View */}
      {filteredKits.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white/5 border border-dashed border-white/15 rounded-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 mb-3">
            <Package size={28} />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No se encontraron kits solares</h3>
          <p className="text-xs text-white/60 max-w-sm mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? 'Prueba modificando tus términos de búsqueda o cambiando el filtro de categoría.'
              : 'Todavía no hay kits registrados. Agrega tu primer paquete con el botón superior.'}
          </p>
          {(searchQuery || selectedCategory !== 'all') ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Limpiar filtros
            </button>
          ) : (
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-[#00D9FF] text-[#0b1b33] text-xs font-black"
            >
              Crear Nuevo Kit
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKits.map((kit) => (
            <div
              key={kit.id}
              className="group bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-[#00D9FF]/40 rounded-2xl overflow-hidden transition-all duration-200 flex flex-col shadow-lg relative"
            >
              {/* Card Image Banner */}
              <div className="relative h-44 w-full bg-[#071f47] overflow-hidden">
                <img
                  src={kit.imageUrl || '/images/logoconvoltaje.jpg'}
                  alt={kit.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/logoconvoltaje.jpg';
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 backdrop-blur-md border border-white/20 text-[#00D9FF]">
                    {kit.category}
                  </span>
                </div>

                {/* Direct Price Tag */}
                <div className="absolute bottom-3 right-3 bg-[#0b3c8f]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#00D9FF]/30 shadow-md">
                  <span className="text-[10px] text-white/70 block uppercase font-bold leading-none">
                    Precio Total
                  </span>
                  <span className="text-base font-black text-[#00D9FF] leading-tight">
                    ${kit.totalPrice.toLocaleString()} <span className="text-[10px] font-bold text-white/80">USD</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#00D9FF] transition-colors mb-1 line-clamp-1">
                    {kit.name}
                  </h3>

                  {kit.description && (
                    <p className="text-xs text-white/60 line-clamp-2 mb-3">
                      {kit.description}
                    </p>
                  )}

                  {/* Components summary list */}
                  <div className="space-y-1.5 my-3">
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider flex items-center gap-1">
                      <Sparkles size={11} className="text-[#00D9FF]" />
                      Componentes ({kit.componentsSummary?.length || 0})
                    </span>
                    <ul className="space-y-1">
                      {kit.componentsSummary?.slice(0, 3).map((comp, idx) => (
                        <li key={idx} className="text-xs text-white/80 flex items-start gap-1.5 line-clamp-1">
                          <span className="text-[#00D9FF] text-xs font-bold leading-none mt-0.5">•</span>
                          <span className="truncate">{comp}</span>
                        </li>
                      ))}
                      {(kit.componentsSummary?.length || 0) > 3 && (
                        <li className="text-[11px] text-[#00D9FF] font-semibold pl-3 cursor-pointer hover:underline" onClick={() => setViewingKit(kit)}>
                          + {kit.componentsSummary.length - 3} componente(s) más...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Card Controls: Edit & Delete */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => setViewingKit(kit)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="Ver detalles completos"
                  >
                    <Eye size={15} />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(kit)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all hover:border-[#00D9FF]/40 active:scale-95"
                    >
                      <Edit2 size={13} className="text-[#00D9FF]" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={() => setDeletingKitId(kit.id)}
                      className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-colors active:scale-95"
                      title="Eliminar kit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal for Add/Edit */}
      <KitFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveKit}
        editingKit={editingKit}
      />

      {/* Delete Confirmation Modal */}
      {deletingKitId && kitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#0b3c8f] border border-red-500/30 rounded-2xl p-6 shadow-2xl text-white">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center mb-4">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-bold mb-1">¿Eliminar este kit solar?</h3>
            <p className="text-xs text-white/70 mb-4">
              Estás por eliminar permanentemente el kit <span className="text-white font-bold">"{kitToDelete.name}"</span> por un valor de <span className="text-[#00D9FF] font-bold">${kitToDelete.totalPrice} USD</span>. Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingKitId(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Detail Viewer Modal */}
      {viewingKit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0b3c8f] border border-white/15 rounded-2xl overflow-hidden shadow-2xl text-white flex flex-col max-h-[90vh]">
            <div className="relative h-48 w-full bg-black/40">
              <img
                src={viewingKit.imageUrl || '/images/logoconvoltaje.jpg'}
                alt={viewingKit.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewingKit(null)}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/30">
                  {viewingKit.category}
                </span>
                <span className="text-xl font-black text-[#00D9FF]">
                  ${viewingKit.totalPrice.toLocaleString()} USD
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{viewingKit.name}</h3>
                {viewingKit.description && (
                  <p className="text-xs text-white/70 mt-1">{viewingKit.description}</p>
                )}
              </div>

              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white/60 mb-2">
                  Componentes incluidos ({viewingKit.componentsSummary.length})
                </h4>
                <div className="space-y-1.5 bg-white/5 border border-white/10 rounded-xl p-3">
                  {viewingKit.componentsSummary.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-white/90">
                      <CheckCircle2 size={14} className="text-[#00D9FF] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-[#082a66]/60 flex justify-end gap-2">
              <button
                onClick={() => {
                  const kitToEdit = viewingKit;
                  setViewingKit(null);
                  handleOpenEditModal(kitToEdit);
                }}
                className="px-4 py-2 rounded-xl bg-[#00D9FF] text-[#0b1b33] text-xs font-black"
              >
                Editar este Kit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
