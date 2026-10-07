import { create } from 'zustand';
import { Offer, CreateOfferInput, UpdateOfferInput } from '../types/offers';
import { offersService } from '../lib/services/offersService';
import { storageService } from '../lib/services/storageService';
import { CONVOLTAJE_PRODUCTS } from '../lib/products';

interface OffersState {
  publicOffers: Offer[];
  adminOffers: Offer[];
  isLoadingPublic: boolean;
  isLoadingAdmin: boolean;
  error: string | null;
  usingFallback: boolean;

  fetchPublicOffers: () => Promise<void>;
  fetchAdminOffers: () => Promise<void>;
  createOffer: (input: CreateOfferInput) => Promise<Offer>;
  updateOffer: (id: string, input: UpdateOfferInput) => Promise<Offer>;
  deleteOffer: (id: string) => Promise<void>;
  toggleOfferActive: (id: string, currentStatus: boolean) => Promise<void>;
  clearError: () => void;
}

/**
 * Genera ofertas de fallback a partir del catálogo estático oficial
 * garantizando que si Supabase está offline o la tabla no tiene filas,
 * la experiencia de usuario se mantenga funcional sin interrupciones.
 */
function getStaticFallbackOffers(): Offer[] {
  const kitsWithDiscount = CONVOLTAJE_PRODUCTS.filter(
    (p) => Boolean(p.originalPrice && p.originalPrice > p.price)
  );

  return kitsWithDiscount.map((kit, index) => {
    const resolvedImage = kit.image || (kit.images && kit.images[0]) || '/images/logoconvoltaje.jpg';
    return {
      id: `static-offer-${kit.id}`,
      title: kit.name,
      description: kit.description,
      originalPrice: kit.originalPrice || null,
      offerPrice: kit.price,
      currency: 'USD',
      badgeText: 'OFERTA ESPECIAL',
      imagePath: resolvedImage,
      imageUrl: resolvedImage,
      pdfPath: kit.pdfUrl || null,
      pdfUrl: kit.pdfUrl || null,
      isActive: true,
      startDate: new Date('2026-01-01').toISOString(),
      endDate: null,
      sortOrder: index,
      createdAt: new Date('2026-01-01').toISOString(),
      updatedAt: new Date('2026-01-01').toISOString(),
    };
  });
}

export const useOffersStore = create<OffersState>((set, get) => ({
  publicOffers: [],
  adminOffers: [],
  isLoadingPublic: false,
  isLoadingAdmin: false,
  error: null,
  usingFallback: false,

  fetchPublicOffers: async () => {
    set({ isLoadingPublic: true, error: null });
    try {
      const data = await offersService.listPublicActiveOffers();
      if (data && data.length > 0) {
        set({ publicOffers: data, usingFallback: false, isLoadingPublic: false });
      } else {
        // Si no hay ofertas activas en la BD, activar el fallback estático
        const fallback = getStaticFallbackOffers();
        set({ publicOffers: fallback, usingFallback: true, isLoadingPublic: false });
      }
    } catch (err: any) {
      console.warn('Fallo al obtener ofertas de Supabase, usando fallback local:', err);
      const fallback = getStaticFallbackOffers();
      set({
        publicOffers: fallback,
        usingFallback: true,
        isLoadingPublic: false,
        error: err.message || 'Error de conexión con el servidor de ofertas.',
      });
    }
  },

  fetchAdminOffers: async () => {
    set({ isLoadingAdmin: true, error: null });
    try {
      const data = await offersService.listAdminOffers();
      set({ adminOffers: data, isLoadingAdmin: false });
    } catch (err: any) {
      set({
        error: err.message || 'Error al obtener la lista administrativa de ofertas.',
        isLoadingAdmin: false,
      });
      throw err;
    }
  },

  createOffer: async (input: CreateOfferInput) => {
    set({ error: null });
    try {
      const newOffer = await offersService.createOffer(input);
      set((state) => ({
        adminOffers: [newOffer, ...state.adminOffers],
      }));
      // Refrescar lista pública en segundo plano si está activa
      if (newOffer.isActive) {
        get().fetchPublicOffers();
      }
      return newOffer;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  updateOffer: async (id: string, input: UpdateOfferInput) => {
    set({ error: null });
    try {
      const updated = await offersService.updateOffer(id, input);
      set((state) => ({
        adminOffers: state.adminOffers.map((o) => (o.id === id ? updated : o)),
      }));
      // Sincronizar lista pública
      get().fetchPublicOffers();
      return updated;
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  deleteOffer: async (id: string) => {
    set({ error: null });
    const target = get().adminOffers.find((o) => o.id === id);
    try {
      await offersService.deleteOffer(id);
      
      // Limpiar archivos en storage asociados de forma asíncrona
      if (target?.imagePath && !target.imagePath.startsWith('/') && !target.imagePath.startsWith('http')) {
        storageService.deleteAsset(target.imagePath).catch(console.warn);
      }
      if (target?.pdfPath && !target.pdfPath.startsWith('/') && !target.pdfPath.startsWith('http')) {
        storageService.deleteAsset(target.pdfPath).catch(console.warn);
      }

      set((state) => ({
        adminOffers: state.adminOffers.filter((o) => o.id !== id),
        publicOffers: state.publicOffers.filter((o) => o.id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  toggleOfferActive: async (id: string, currentStatus: boolean) => {
    set({ error: null });
    try {
      const updated = await offersService.toggleOfferActive(id, currentStatus);
      set((state) => ({
        adminOffers: state.adminOffers.map((o) => (o.id === id ? updated : o)),
      }));
      get().fetchPublicOffers();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
