import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export type KitCategory = 'Residencial' | 'Comercial' | 'Personalizado' | 'Industrial' | 'Portátil';

export interface SolarKit {
  id: string;
  name: string;
  category: KitCategory;
  imageUrl: string;
  componentsSummary: string[];
  totalPrice: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface KitsState {
  kits: SolarKit[];
  isLoading: boolean;
  error: string | null;
  fetchKits: () => Promise<void>;
  addKit: (kit: Omit<SolarKit, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateKit: (id: string, updates: Partial<Omit<SolarKit, 'id' | 'createdAt'>>) => Promise<void>;
  deleteKit: (id: string) => Promise<void>;
  resetToDefaults: () => void;
}

export const INITIAL_SOLAR_KITS: SolarKit[] = [
  {
    id: 'kit-basico-1500w',
    name: 'Sistema Básico - 1500W',
    category: 'Residencial',
    imageUrl: '/images/logoconvoltaje.jpg',
    componentsSummary: [
      'Inversor Onda Pura MUST 1.5kW',
      '2 Paneles Solares Monocristalinos 450W',
      '1 Batería Ciclo Profundo Gel 12V 200Ah',
      'Estructura de montaje coplanar para techo',
      'Kit de protecciones AC/DC + cable solar 4mm'
    ],
    totalPrice: 1745,
    description: 'Kit residencial para cargas críticas (refrigerador, luces, TV y ventiladores).',
    createdAt: '2026-01-15T10:00:00.000Z',
    updatedAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'kit-medio-3000w',
    name: 'Sistema Solar Medio - 3000W',
    category: 'Residencial',
    imageUrl: '/images/kit-10kw-equipo.jpg',
    componentsSummary: [
      'Inversor Híbrido MUST 3kW 24V',
      '4 Paneles Solares Monocristalinos 550W Tier 1',
      '1 Batería LiFePO4 MUST 5.1kWh',
      'Estructura de aluminio anodizado reforzada',
      'Caja de protecciones completa + monitoreo WiFi'
    ],
    totalPrice: 3850,
    description: 'Autonomía balanceada para el hogar promedio cubano con respaldo nocturno continuo.',
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z'
  },
  {
    id: 'kit-6k-plus',
    name: 'Sistema 6K PLUS',
    category: 'Comercial',
    imageUrl: '/images/kit-10kw-equipo.jpg',
    componentsSummary: [
      'Inversor Híbrido MUST 6kW 48V split-phase',
      '8 Paneles Solares Alta Eficiencia 550W',
      'Batería LiFePO4 MUST 15kWh de pared',
      'Estructura de montaje en aluminio sobre cubierta plana o teja',
      'Interruptor de transferencia automática (ATS) + protecciones'
    ],
    totalPrice: 6950,
    description: 'Capacidad para alimentar aire acondicionado, bombas de agua, refrigeración comercial y hogar completo.',
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-02-01T10:00:00.000Z'
  },
  {
    id: 'kit-industrial-10kw',
    name: 'Sistema Industrial / Negocio 10kW',
    category: 'Personalizado',
    imageUrl: '/images/Kit-10k-imagen-2.jpg',
    componentsSummary: [
      'Inversor Industrial MUST 10kW',
      '16 Paneles Solares 580W Bifaciales',
      '2 Baterías LiFePO4 15kWh (30kWh totales en paralelo)',
      'Estructuras de suelo con ingeniería de fijación reforzada',
      'Gabinete de protecciones industriales y cableado cero pérdida'
    ],
    totalPrice: 11800,
    description: 'Solución a medida para negocios de alto consumo, restaurantes, talleres y clínicas.',
    createdAt: '2026-02-15T10:00:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z'
  }
];

export const useKitsStore = create<KitsState>()(
  persist(
    (set, get) => ({
      kits: INITIAL_SOLAR_KITS,
      isLoading: false,
      error: null,

      fetchKits: async () => {
        set({ isLoading: true, error: null });
        try {
          // Race between network fetch and timeout for high-availability offline tolerance
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
                description: item.description || '',
                createdAt: item.created_at || new Date().toISOString(),
                updatedAt: item.created_at || new Date().toISOString(),
              };
            });

            set({ kits: mappedKits, isLoading: false, error: null });
          } else {
            // If Supabase returned empty table, preserve local kits
            set({ isLoading: false });
          }
        } catch (err: any) {
          console.warn('Fallo de red Supabase kits (offline fallback):', err.message);
          set({ isLoading: false });
        }
      },

      addKit: async (kitData) => {
        const tempId = `kit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const newKit: SolarKit = {
          ...kitData,
          id: tempId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 1. Optimistic local update
        set((state) => ({ kits: [newKit, ...state.kits] }));

        // 2. Sync to Supabase in background
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
            // Replace temporary local ID with server UUID
            set((state) => ({
              kits: state.kits.map((k) => (k.id === tempId ? { ...k, id: data.id } : k)),
            }));
          }
        } catch (err) {
          console.warn('Sync to Supabase deferred to local storage:', err);
        }
      },

      updateKit: async (id, updates) => {
        // 1. Optimistic local update
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

        // 2. Sync to Supabase in background
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
        // 1. Optimistic local delete
        set((state) => ({
          kits: state.kits.filter((kit) => kit.id !== id),
        }));

        // 2. Sync to Supabase
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
      name: 'convoltaje-solar-kits-v1',
      partialize: (state) => ({ kits: state.kits }),
    }
  )
);
