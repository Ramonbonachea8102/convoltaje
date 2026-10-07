import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';
import { CONVOLTAJE_PRODUCTS } from '@/lib/products';

export type KitCategory = 'Residencial' | 'Comercial' | 'Personalizado' | 'PowerStations' | 'Industrial' | 'Portátil';

export interface SolarKit {
  id: string;
  name: string;
  category: KitCategory;
  imageUrl?: string | null;
  hasImagePending?: boolean;
  componentsSummary: string[];
  totalPrice: number; // Precio de oferta / precio principal
  originalPrice?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  pdfUrl?: string | null;
  hasTechnicalSheet?: boolean;
}

interface KitsState {
  kits: SolarKit[];
  isLoading: boolean;
  error: string | null;
  fetchKits: () => Promise<void>;
  addKit: (kit: Omit<SolarKit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateKit: (id: string, updates: Partial<SolarKit>) => Promise<void>;
  deleteKit: (id: string) => Promise<void>;
  resetToDefaults: () => void;
}

// Generar kits predeterminados sincronizados con la fuente única CONVOLTAJE_PRODUCTS
export const INITIAL_SOLAR_KITS: SolarKit[] = CONVOLTAJE_PRODUCTS.map((prod) => ({
  id: prod.id,
  name: prod.name,
  category: (prod.category as KitCategory) || 'Residencial',
  imageUrl: prod.image || null,
  hasImagePending: prod.hasImagePending,
  componentsSummary: prod.specs && prod.specs.length > 0 ? prod.specs : [prod.description],
  totalPrice: prod.price,
  originalPrice: prod.originalPrice,
  description: prod.description,
  createdAt: '2026-09-30T10:00:00.000Z',
  updatedAt: '2026-09-30T10:00:00.000Z',
  pdfUrl: prod.pdfUrl,
  hasTechnicalSheet: prod.hasTechnicalSheet,
}));

export const useKitsStore = create<KitsState>()(
  persist(
    (set, get) => ({
      kits: INITIAL_SOLAR_KITS,
      isLoading: false,
      error: null,

      fetchKits: async () => {
        set({ isLoading: true, error: null });
        try {
          const queryPromise = supabase
            .from('kits')
            .select('*')
            .order('created_at', { ascending: false });

          const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout Supabase kits')), 1800)
          );

          const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

          if (error) {
            console.warn('Error al cargar kits de Supabase, usando persistencia local:', error);
            set({ isLoading: false });
            return;
          }

          if (data && Array.isArray(data) && data.length > 0) {
            const mappedKits: SolarKit[] = data.map((item: any) => {
              let components: string[] = [];
              if (Array.isArray(item.components)) {
                components = item.components;
              } else if (typeof item.components === 'string') {
                try {
                  components = JSON.parse(item.components);
                } catch {
                  components = [item.components];
                }
              }

              return {
                id: item.id,
                name: item.name,
                category: (item.category as KitCategory) || 'Residencial',
                imageUrl: item.image_url || '/images/logoconvoltaje.jpg',
                componentsSummary: components.length > 0 ? components : ['Componentes estándar de sistema'],
                totalPrice: Number(item.price) || 0,
                originalPrice: item.original_price ? Number(item.original_price) : undefined,
                description: item.description || '',
                createdAt: item.created_at || new Date().toISOString(),
                updatedAt: item.created_at || new Date().toISOString(),
                pdfUrl: item.pdf_url || null,
                hasTechnicalSheet: item.has_technical_sheet ?? Boolean(item.pdf_url),
              };
            });

            set({ kits: mappedKits, isLoading: false, error: null });
          } else {
            set({ isLoading: false });
          }
        } catch (err: any) {
          console.warn('Fallo de red Supabase kits (offline fallback):', err.message);
          set({ isLoading: false });
        }
      },

      addKit: async (kitData) => {
        const tempId = 'kit-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
        const newKit: SolarKit = {
          ...kitData,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({ kits: [newKit, ...state.kits] }));

        try {
          const { data, error } = await supabase
            .from('kits')
            .insert({
              name: kitData.name,
              category: kitData.category,
              image_url: kitData.imageUrl,
              components: kitData.componentsSummary,
              price: kitData.totalPrice,
            })
            .select()
            .single();

          if (!error && data?.id) {
            set((state) => ({
              kits: state.kits.map((k) => (k.id === tempId ? { ...k, id: data.id } : k)),
            }));
          }
        } catch (err) {
          console.warn('Sync to Supabase deferred to local storage:', err);
        }
      },

      updateKit: async (id, updates) => {
        set((state) => ({
          kits: state.kits.map((kit) =>
            kit.id === id
              ? {
                  ...kit,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                }
              : kit
          ),
        }));

        try {
          const dbUpdates: Record<string, any> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.category !== undefined) dbUpdates.category = updates.category;
          if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
          if (updates.componentsSummary !== undefined) dbUpdates.components = updates.componentsSummary;
          if (updates.totalPrice !== undefined) dbUpdates.price = updates.totalPrice;

          await supabase.from('kits').update(dbUpdates).eq('id', id);
        } catch (err) {
          console.warn('Sync update to Supabase deferred:', err);
        }
      },

      deleteKit: async (id) => {
        set((state) => ({
          kits: state.kits.filter((kit) => kit.id !== id),
        }));

        try {
          await supabase.from('kits').delete().eq('id', id);
        } catch (err) {
          console.warn('Sync delete to Supabase deferred:', err);
        }
      },

      resetToDefaults: () =>
        set({
          kits: INITIAL_SOLAR_KITS,
        }),
    }),
    {
      name: 'convoltaje-solar-kits-v3', // v3 para invalidar y cargar flyers limpios y placeholders neutros
      partialize: (state) => ({ kits: state.kits }),
    }
  )
);
