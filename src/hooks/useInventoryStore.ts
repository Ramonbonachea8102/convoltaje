import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ProductCategory = 'Paneles Solares' | 'Inversores' | 'Baterías' | 'Accesorios' | 'Estructuras';

export type ProductItemStatus = 'stock' | 'preventa' | 'vendido' | 'merma' | 'liquidacion' | 'exterminacion';
export type ProductApprovalStatus = 'pendiente_precio' | 'activo' | 'liquidado' | 'exterminado';

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: 'compra' | 'reimport' | 'reserva' | 'instalacion' | 'devolucion_reserva' | 'traslado' | 'liquidacion' | 'exterminacion';
  quantity: number;
  unitCost: number;
  totalCost: number;
  fromLocation?: string;
  toLocation?: string;
  accountId?: string;
  otRef?: string;
  supplierName?: string;
  countryOfOrigin?: string;
  date: string;
  createdBy: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  code: string;
  name: string;
  category: ProductCategory;
  brand?: string;
  imageUrl?: string;
  stock: number;
  initialStock: number; // Stock inicial ingresado por Comprador para alerta al <= 30%
  reservedStock?: number; // Stock en preventa / reservado para OTs
  costPrice: number;
  salePrice: number;
  laborPrice?: number; // Mano de obra definida por Designado
  minStock: number;
  storageLocation: string; // Área de almacenamiento (ej. Almacén Central Habana, Almacén Taller, Vehículo Técnico 1)
  countryOfOrigin?: string; // Procedencia / País de origen (ej. China, Panamá, Cuba)
  supplierId?: string;
  supplierName?: string;
  status: ProductApprovalStatus; // Workflow Comprador (pendiente_precio) -> Designado (activo)
  itemCondition?: ProductItemStatus;
}

interface InventoryState {
  items: InventoryItem[];
  movements: InventoryMovement[];
  
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  adjustStock: (id: string, amount: number) => void;
  reserveStock: (id: string, amount: number) => void;
  deductReservedStock: (id: string, amount: number) => void;
  
  // Acciones Modelo José
  recordPurchase: (data: {
    code: string;
    name: string;
    category: ProductCategory;
    brand?: string;
    quantity: number;
    unitCost: number;
    storageLocation: string;
    countryOfOrigin?: string;
    supplierId?: string;
    supplierName?: string;
    createdBy: string;
  }) => void;

  approveAndPriceItem: (id: string, salePrice: number, laborPrice?: number) => void;
  
  transferStock: (id: string, fromLocation: string, toLocation: string, quantity: number, createdBy: string) => void;
  
  liquidateStock: (id: string, quantity: number, createdBy: string, notes?: string) => void;
  
  exterminateStock: (id: string, quantity: number, createdBy: string, notes?: string) => void;
  
  reimportStock: (id: string, quantity: number, createdBy: string, notes?: string) => void;
}

const mockInventory: InventoryItem[] = [
  { id: "i1", code: "INV-DEYE-5KW", name: "Inversor Deye 5kW", category: "Inversores", brand: "Deye", stock: 15, initialStock: 20, costPrice: 800, salePrice: 1200, minStock: 6, storageLocation: "Almacén Central Habana", countryOfOrigin: "China", supplierName: "Sunshine Solar Tech Co., Ltd.", status: "activo", itemCondition: "stock" },
  { id: "i2", code: "PAN-JINKO-550", name: "Panel Solar Jinko 550W", category: "Paneles Solares", brand: "Jinko Solar", stock: 120, initialStock: 150, costPrice: 150, salePrice: 220, minStock: 45, storageLocation: "Almacén Central Habana", countryOfOrigin: "China", supplierName: "Sunshine Solar Tech Co., Ltd.", status: "activo", itemCondition: "stock" },
  { id: "i3", code: "BAT-PYLON-4.8", name: "Batería Pylontech 4.8kWh", category: "Baterías", brand: "Pylontech", stock: 25, initialStock: 30, costPrice: 1200, salePrice: 1800, minStock: 9, storageLocation: "Almacén Taller Santiago", countryOfOrigin: "China", supplierName: "Energía Solar Caribe S.A.", status: "activo", itemCondition: "stock" },
  { id: "i4", code: "ACC-CBL-6MM", name: "Cable Solar 6mm (Rollo 100m)", category: "Accesorios", brand: "General", stock: 50, initialStock: 60, costPrice: 80, salePrice: 150, minStock: 18, storageLocation: "Almacén Central Habana", countryOfOrigin: "Cuba", supplierName: "Habana Import Tech", status: "activo", itemCondition: "stock" },
  { id: "i5", code: "INV-GROW-3KW", name: "Inversor Growatt 3kW", category: "Inversores", brand: "Growatt", stock: 2, initialStock: 10, costPrice: 600, salePrice: 950, minStock: 3, storageLocation: "Almacén Central Habana", countryOfOrigin: "China", supplierName: "Sunshine Solar Tech Co., Ltd.", status: "activo", itemCondition: "stock" },
  { id: "i6", code: "PAN-CAN-450", name: "Panel Canadian Solar 450W", category: "Paneles Solares", brand: "Canadian Solar", stock: 200, initialStock: 250, costPrice: 120, salePrice: 180, minStock: 75, storageLocation: "Almacén Central Habana", countryOfOrigin: "China", supplierName: "Sunshine Solar Tech Co., Ltd.", status: "activo", itemCondition: "stock" }
];

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: mockInventory,
      movements: [],

      addItem: (item) => set((state) => ({
        items: [...state.items, {
          ...item,
          id: Date.now().toString(),
          initialStock: item.initialStock || item.stock,
          minStock: item.minStock || Math.ceil((item.initialStock || item.stock) * 0.3),
          storageLocation: item.storageLocation || 'Almacén Central Habana',
          status: item.status || 'activo',
          itemCondition: item.itemCondition || 'stock'
        }]
      })),

      updateItem: (id, updates) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, ...updates } : i)
      })),

      deleteItem: (id) => set((state) => ({
        items: state.items.filter(i => i.id !== id)
      })),

      adjustStock: (id, amount) => set((state) => ({
        items: state.items.map(i => i.id === id ? { ...i, stock: Math.max(0, i.stock + amount) } : i)
      })),

      reserveStock: (id, amount) => set((state) => ({
        items: state.items.map(i => i.id === id ? {
          ...i,
          reservedStock: Math.max(0, (i.reservedStock || 0) + amount),
          itemCondition: 'preventa'
        } : i)
      })),

      deductReservedStock: (id, amount) => set((state) => ({
        items: state.items.map(i => i.id === id ? {
          ...i,
          stock: Math.max(0, i.stock - amount),
          reservedStock: Math.max(0, (i.reservedStock || 0) - amount),
          itemCondition: 'vendido'
        } : i)
      })),

      recordPurchase: (data) => {
        const newItem: InventoryItem = {
          id: `item-${Date.now()}`,
          code: data.code,
          name: data.name,
          category: data.category,
          brand: data.brand,
          stock: data.quantity,
          initialStock: data.quantity,
          costPrice: data.unitCost,
          salePrice: 0, // Pendiente asignación por Designado
          minStock: Math.ceil(data.quantity * 0.3), // Alerta automática al <= 30%
          storageLocation: data.storageLocation,
          countryOfOrigin: data.countryOfOrigin,
          supplierId: data.supplierId,
          supplierName: data.supplierName,
          status: 'pendiente_precio',
          itemCondition: 'stock'
        };

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}`,
          itemId: newItem.id,
          type: 'compra',
          quantity: data.quantity,
          unitCost: data.unitCost,
          totalCost: data.quantity * data.unitCost,
          toLocation: data.storageLocation,
          supplierName: data.supplierName,
          countryOfOrigin: data.countryOfOrigin,
          date: new Date().toISOString(),
          createdBy: data.createdBy,
          notes: `Ingreso de compra por Comprador (${data.createdBy})`
        };

        set((state) => ({
          items: [newItem, ...state.items],
          movements: [movement, ...state.movements]
        }));
      },

      approveAndPriceItem: (id, salePrice, laborPrice) => set((state) => ({
        items: state.items.map(i => i.id === id ? {
          ...i,
          salePrice,
          laborPrice: laborPrice || 0,
          status: 'activo'
        } : i)
      })),

      transferStock: (id, fromLocation, toLocation, quantity, createdBy) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}`,
          itemId: id,
          type: 'traslado',
          quantity,
          unitCost: item.costPrice,
          totalCost: quantity * item.costPrice,
          fromLocation,
          toLocation,
          date: new Date().toISOString(),
          createdBy,
          notes: `Traslado de ${quantity} uds de "${fromLocation}" a "${toLocation}"`
        };

        set((state) => ({
          items: state.items.map(i => i.id === id ? { ...i, storageLocation: toLocation } : i),
          movements: [movement, ...state.movements]
        }));
      },

      liquidateStock: (id, quantity, createdBy, notes) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}`,
          itemId: id,
          type: 'liquidacion',
          quantity,
          unitCost: item.costPrice,
          totalCost: quantity * item.costPrice,
          date: new Date().toISOString(),
          createdBy,
          notes: notes || `Salida en liquidación a precio de costo ($${item.costPrice} USD)`
        };

        set((state) => ({
          items: state.items.map(i => i.id === id ? {
            ...i,
            stock: Math.max(0, i.stock - quantity),
            itemCondition: 'liquidacion'
          } : i),
          movements: [movement, ...state.movements]
        }));
      },

      exterminateStock: (id, quantity, createdBy, notes) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}`,
          itemId: id,
          type: 'exterminacion',
          quantity,
          unitCost: item.costPrice,
          totalCost: quantity * item.costPrice,
          date: new Date().toISOString(),
          createdBy,
          notes: notes || `Baja por exterminación (pérdida/destrucción sin retorno)`
        };

        set((state) => ({
          items: state.items.map(i => i.id === id ? {
            ...i,
            stock: Math.max(0, i.stock - quantity),
            itemCondition: 'exterminacion'
          } : i),
          movements: [movement, ...state.movements]
        }));
      },

      reimportStock: (id, quantity, createdBy, notes) => {
        const item = get().items.find(i => i.id === id);
        if (!item) return;

        const movement: InventoryMovement = {
          id: `mov-${Date.now()}`,
          itemId: id,
          type: 'reimport',
          quantity,
          unitCost: item.costPrice,
          totalCost: quantity * item.costPrice,
          date: new Date().toISOString(),
          createdBy,
          notes: notes || `Reintegro al almacén por cancelación de instalación OT`
        };

        set((state) => ({
          items: state.items.map(i => i.id === id ? {
            ...i,
            stock: i.stock + quantity,
            reservedStock: Math.max(0, (i.reservedStock || 0) - quantity),
            itemCondition: 'stock'
          } : i),
          movements: [movement, ...state.movements]
        }));
      }
    }),
    {
      name: 'convoltaje-crm-storage-inv-v2',
    }
  )
);
