import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  country: string; // Procedencia (ej. China, Panamá, España, Cuba)
  offeredProducts: string[]; // Productos o categorías que oferta
  isBestOffer?: boolean; // Badge "Mejor Oferta" (Subasta)
  rating?: number; // 1-5 estrellas
  notes?: string;
  createdAt: string;
  createdBy: string;
}

interface SuppliersState {
  suppliers: Supplier[];
  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  toggleBestOffer: (id: string) => void;
  getSuppliersByProduct: (productName: string) => Supplier[];
}

const DEFAULT_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Sunshine Solar Tech Co., Ltd.',
    phone: '+86 138 0013 8000',
    email: 'sales@sunshinesolar.cn',
    country: 'China',
    offeredProducts: ['Inversores', 'Paneles Solares', 'Baterías'],
    isBestOffer: true,
    rating: 4.9,
    notes: 'Proveedor principal de inversores Deye y paneles 550W con certificación UL.',
    createdAt: new Date().toISOString(),
    createdBy: 'José Medina'
  },
  {
    id: 'sup-2',
    name: 'Energía Solar Caribe S.A.',
    phone: '+507 6000 1234',
    email: 'contacto@solarcaribe.com.pa',
    country: 'Panamá',
    offeredProducts: ['Inversores', 'Estructuras', 'Accesorios'],
    isBestOffer: false,
    rating: 4.6,
    notes: 'Despacho rápido desde Zona Libre de Colón. Ideal para reposición urgente.',
    createdAt: new Date().toISOString(),
    createdBy: 'Ángel Eduardo'
  },
  {
    id: 'sup-3',
    name: 'Habana Import Tech',
    phone: '+53 5280 4411',
    email: 'importaciones@habanatech.cu',
    country: 'Cuba',
    offeredProducts: ['Cable Solar', 'Protecciones DC/AC', 'MC4'],
    isBestOffer: true,
    rating: 4.8,
    notes: 'Proveedor local con stock directo en almacén Habana Central.',
    createdAt: new Date().toISOString(),
    createdBy: 'Laura'
  }
];

export const useSuppliersStore = create<SuppliersState>()(
  persist(
    (set, get) => ({
      suppliers: DEFAULT_SUPPLIERS,

      addSupplier: (supplierData) => set((state) => ({
        suppliers: [
          {
            ...supplierData,
            id: `sup-${Date.now()}`,
            createdAt: new Date().toISOString()
          },
          ...state.suppliers
        ]
      })),

      updateSupplier: (id, updates) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      deleteSupplier: (id) => set((state) => ({
        suppliers: state.suppliers.filter(s => s.id !== id)
      })),

      toggleBestOffer: (id) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === id ? { ...s, isBestOffer: !s.isBestOffer } : s)
      })),

      getSuppliersByProduct: (productName: string) => {
        const query = productName.toLowerCase();
        return get().suppliers.filter(s =>
          s.offeredProducts.some(p => p.toLowerCase().includes(query)) ||
          s.name.toLowerCase().includes(query)
        );
      }
    }),
    {
      name: 'convoltaje_suppliers_storage_v1',
    }
  )
);
