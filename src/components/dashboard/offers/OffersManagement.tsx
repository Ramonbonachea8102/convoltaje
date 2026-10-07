import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { useOffersStore } from '@/hooks/useOffersStore';
import { Offer, CreateOfferInput, UpdateOfferInput } from '@/types/offers';
import { storageService } from '@/lib/services/storageService';
import { OfferFormModal } from './OfferFormModal';
import { toast } from 'sonner';

export const OffersManagement: React.FC = () => {
  const {
    adminOffers,
    isLoadingAdmin,
    fetchAdminOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    toggleOfferActive,
  } = useOffersStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOffers().catch((err) => {
      console.warn('No se pudieron cargar ofertas administrativas (requiere migración remota):', err);
    });
  }, [fetchAdminOffers]);

  const filteredOffers = adminOffers.filter((offer) => {
    const matchesQuery =
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (offer.description && offer.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      filterActive === 'all'
        ? true
        : filterActive === 'active'
        ? offer.isActive
        : !offer.isActive;

    return matchesQuery && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingOffer(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: Offer) => {
    setEditingOffer(offer);
    setIsModalOpen(true);
  };

  const handleSaveOffer = async (
    data: CreateOfferInput | UpdateOfferInput,
    tempFiles?: { imageFile?: File; pdfFile?: File }
  ) => {
    const targetId = editingOffer ? editingOffer.id : (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11));
    let uploadedImagePath = editingOffer ? editingOffer.imagePath : '';
    let uploadedPdfPath = editingOffer ? editingOffer.pdfPath : null;

    // Subir imagen si se seleccionó un nuevo archivo
    if (tempFiles?.imageFile) {
      const res = await storageService.uploadOfferAsset(tempFiles.imageFile, targetId, false);
      uploadedImagePath = res.path;
    }

    // Subir PDF si se seleccionó un nuevo archivo
    if (tempFiles?.pdfFile) {
      const res = await storageService.uploadOfferAsset(tempFiles.pdfFile, targetId, true);
      uploadedPdfPath = res.path;
    }

    const payload = {
      ...data,
      imagePath: uploadedImagePath,
      pdfPath: uploadedPdfPath,
    };

    if (editingOffer) {
      await updateOffer(editingOffer.id, payload as UpdateOfferInput);
      toast.success('Oferta actualizada exitosamente.');
    } else {
      await createOffer(payload as CreateOfferInput);
      toast.success('Oferta creada exitosamente.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOffer(id);
      toast.success('Oferta eliminada correctamente.');
      setDeletingOfferId(null);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar la oferta.');
    }
  };

  const handleToggle = async (offer: Offer) => {
    try {
      await toggleOfferActive(offer.id, offer.isActive);
      toast.success(offer.isActive ? 'Oferta desactivada de la web.' : 'Oferta activada en la web.');
    } catch (err: any) {
      toast.error(err.message || 'Error al cambiar estado.');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b3c8f] text-white overflow-hidden font-sans">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/10 bg-[#0d233a]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-inner">
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">Gestión de Ofertas Comerciales</h1>
            <p className="text-xs text-white/60">
              Crea promociones, asocia flyers, fichas técnicas y controla su visibilidad en el portal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdminOffers()}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all"
            title="Refrescar ofertas"
          >
            <RotateCcw size={16} className={isLoadingAdmin ? 'animate-spin' : ''} />
          </button>
          
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
          >
            <Plus size={16} />
            <span>Nueva Oferta</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 px-6 bg-slate-950/40 border-b border-white/5">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterActive === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            Todas ({adminOffers.length})
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterActive === 'active'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            Activas ({adminOffers.filter((o) => o.isActive).length})
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterActive === 'inactive'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            Inactivas ({adminOffers.filter((o) => !o.isActive).length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Buscar por título o detalle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#08182b] border border-white/10 rounded-xl px-3.5 py-1.5 pl-8 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <Search size={14} className="text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 border border-dashed border-white/15 rounded-3xl p-8 text-center bg-white/5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 mb-3">
              <Tag size={32} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">No hay ofertas registradas</h3>
            <p className="text-xs text-white/60 max-w-sm mb-4">
              {searchQuery
                ? 'No se encontraron resultados para la búsqueda ingresada.'
                : 'Crea tu primera oferta comercial para exhibirla en la landing page.'}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider"
            >
              Crear Oferta
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer) => {
              const discountPercent =
                offer.originalPrice && offer.originalPrice > offer.offerPrice
                  ? Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
                  : 0;

              return (
                <div
                  key={offer.id}
                  className="bg-[#0e2746] border border-white/10 hover:border-cyan-500/30 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between transition-all group"
                >
                  <div>
                    {/* Image / Flyer Banner */}
                    <div className="relative w-full h-44 bg-slate-900 overflow-hidden">
                      {offer.imageUrl || offer.imagePath ? (
                        <img
                          src={offer.imageUrl || offer.imagePath}
                          alt={offer.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950">
                          <Tag size={32} />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0e2746] via-transparent to-transparent" />

                      {/* Top Status and Discount Badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-950/80 backdrop-blur-md border border-cyan-400/30 text-cyan-400">
                          {offer.badgeText || 'OFERTA'}
                        </span>
                        {discountPercent > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-md">
                            -{discountPercent}% OFF
                          </span>
                        )}
                      </div>

                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() => handleToggle(offer)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-md shadow-md transition-all ${
                            offer.isActive
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {offer.isActive ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>Activa</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              <span>Pausada</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5">
                      <h3 className="text-base font-bold text-white mb-2 leading-snug">
                        {offer.title}
                      </h3>
                      {offer.description && (
                        <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                          {offer.description}
                        </p>
                      )}

                      {/* Prices */}
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-black text-orange-500">
                          ${offer.offerPrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-bold text-slate-400">USD</span>
                        {offer.originalPrice && offer.originalPrice > offer.offerPrice && (
                          <span className="text-xs text-slate-400 line-through ml-1">
                            ${offer.originalPrice.toLocaleString()} USD
                          </span>
                        )}
                      </div>

                      {/* PDF Indicator */}
                      {offer.pdfUrl || offer.pdfPath ? (
                        <div className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 mb-3 w-fit">
                          <FileText size={13} />
                          <span className="font-semibold text-[11px]">Ficha técnica vinculada</span>
                        </div>
                      ) : null}

                      {/* Validity Dates */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Calendar size={12} />
                        <span>
                          Desde: {new Date(offer.startDate).toLocaleDateString()}
                          {offer.endDate ? ` • Hasta: ${new Date(offer.endDate).toLocaleDateString()}` : ' • Indefinida'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between p-4 px-5 border-t border-white/5 bg-[#091e36]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(offer)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all"
                        title="Editar oferta"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeletingOfferId(offer.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
                        title="Eliminar oferta"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <button
                      onClick={() => handleToggle(offer)}
                      className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      {offer.isActive ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Creación / Edición */}
      <OfferFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOffer}
        editingOffer={editingOffer}
      />

      {/* Modal de Confirmación de Eliminación */}
      {deletingOfferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e2746] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">¿Eliminar oferta?</h3>
            <p className="text-xs text-white/60 mb-5 leading-relaxed">
              Esta acción eliminará el registro de la base de datos y limpiará sus archivos asociados en Storage.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingOfferId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deletingOfferId)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-md"
              >
                Confirmar Eliminación
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
