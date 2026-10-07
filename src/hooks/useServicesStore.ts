import { create } from 'zustand';
import { Service, CreateServiceInput, UpdateServiceInput } from '../types/services';
import { servicesService } from '../lib/services/servicesService';
import { COMPLEMENTARY_SERVICES } from '../lib/products';

interface ServicesState {
  services: Service[];
  publicServices: Service[];
  loading: boolean;
  error: string | null;
  usingFallback: boolean;

  fetchPublicServices: () => Promise<void>;
  fetchAdminServices: () => Promise<void>;
  createService: (input: CreateServiceInput) => Promise<Service>;
  updateService: (id: string, input: UpdateServiceInput) => Promise<Service>;
  deleteService: (id: string) => Promise<void>;
  toggleServiceActive: (id: string, currentStatus: boolean) => Promise<Service>;
}

/**
 * Convierte los servicios complementarios estáticos al modelo tipado `Service`
 */
function getStaticFallbackServices(): Service[] {
  return COMPLEMENTARY_SERVICES.map((item, index) => ({
    id: item.id,
    title: item.name,
    description: item.description,
    price: item.price,
    billingPeriod: item.period || null,
    badgeText: item.badge || null,
    imagePath: null,
    isActive: true,
    sortOrder: index + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

export const useServicesStore = create<ServicesState>((set, get) => ({
  services: [],
  publicServices: getStaticFallbackServices(),
  loading: false,
  error: null,
  usingFallback: true,

  fetchPublicServices: async () => {
    set({ loading: true, error: null });
    try {
      const data = await servicesService.listPublicActiveServices();
      if (data && data.length > 0) {
        set({ publicServices: data, usingFallback: false, loading: false });
      } else {
        set({ publicServices: getStaticFallbackServices(), usingFallback: true, loading: false });
      }
    } catch (err: any) {
      console.warn('Conexión con Supabase no disponible para servicios, usando fallback estático:', err.message);
      set({
        publicServices: getStaticFallbackServices(),
        usingFallback: true,
        loading: false,
      });
    }
  },

  fetchAdminServices: async () => {
    set({ loading: true, error: null });
    try {
      const data = await servicesService.listAdminServices();
      set({ services: data, loading: false });
    } catch (err: any) {
      console.error('Error al cargar servicios administrativos:', err.message);
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  createService: async (input: CreateServiceInput) => {
    set({ loading: true, error: null });
    try {
      const created = await servicesService.createService(input);
      set((state) => ({
        services: [created, ...state.services],
        publicServices: created.isActive ? [created, ...state.publicServices] : state.publicServices,
        loading: false,
      }));
      return created;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  updateService: async (id: string, input: UpdateServiceInput) => {
    set({ loading: true, error: null });
    try {
      const updated = await servicesService.updateService(id, input);
      set((state) => ({
        services: state.services.map((s) => (s.id === id ? updated : s)),
        publicServices: state.publicServices.map((s) => (s.id === id ? updated : s)).filter((s) => s.isActive),
        loading: false,
      }));
      return updated;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  deleteService: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await servicesService.deleteService(id);
      set((state) => ({
        services: state.services.filter((s) => s.id !== id),
        publicServices: state.publicServices.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (err: any) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  toggleServiceActive: async (id: string, currentStatus: boolean) => {
    return get().updateService(id, { isActive: !currentStatus });
  },
}));
