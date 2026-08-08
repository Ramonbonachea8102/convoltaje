import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { crmService } from '@/lib/services/crmService';
import { makeService } from '@/lib/services/makeService';

export type DealStage = 'Contacto' | 'En Producción' | 'Terminado' | 'Facturado' | 'Feedback';

export type DealSubstage = 
  | 'lead_nuevo'
  | 'comercial_asignado'
  | 'fecha_agendada'
  | 'pendiente_levantamiento'
  | 'levantamiento_completado'
  | 'pendiente_almacen'
  | 'almacen_preparado'
  | 'en_transporte'
  | 'en_instalacion'
  | 'instalacion_completada'
  | 'pendiente_pago'
  | 'pago_verificado'
  | 'factura_emitida'
  | 'feedback_pendiente'
  | 'completado';

export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO timestamp
  actorName: string;
  actorRole: string;
  action: string; // Ej: "Agendó fecha de instalación", "Guardó levantamiento técnico"
  details?: string;
  fromSubstage?: DealSubstage;
  toSubstage?: DealSubstage;
}

export interface TechnicalSurvey {
  completedAt: string; // ISO timestamp
  proyectistaName: string;
  roofType: 'Placa de Hormigón' | 'Teja' | 'Zinc/Cinc' | 'Fibrocemento' | 'Estructura Elevada Requerida';
  availableAreaM2: number;
  electricalGrid: '110V Monofásico' | '220V Bifásico' | '220V Trifásico';
  groundingStatus: 'OK - Varilla Existente' | 'Requiere Kit Aterramiento ($350 USD)';
  cableDistanceMeters: number;
  grossKwhPerDay: number;
  safetyKwhPerDay: number;
  peakPowerKw: number;
  recommendedKit: string;
  suggestedFinalPrice: number;
  technicalNotes: string;
  appliancesSummary?: string;
}

export interface ClientDeal {
  id: string;
  name: string;
  company: string; // Tipo de Proyecto (ej. 'Kit Solar 6kW')
  phone: string;
  email: string;
  value: number;
  stage: DealStage;
  substage?: DealSubstage; // Tracking fino dentro de la etapa
  expectedDate: string; // Fecha de inicio
  source: string; // Notas adicionales
  otRef?: string; // Número de OT/Referencia que vincula oferta y factura
  salesAgent?: string; // Comercial asignado o elegido por el cliente
  address?: string; // Dirección de instalación
  deliveryAddress?: string; // Dirección exacta de entrega (a veces distinta a la de instalación)
  deliveryProof?: string[]; // Array de capturas de pantalla en WebP (data URLs)
  deliveryKm?: number; // Km reportados en la captura (opcional, lo escribe el transportista)
  technicalSurvey?: TechnicalSurvey; // Levantamiento Técnico en Terreno por Samuel
  activityLog?: ActivityEntry[]; // Historial de actividad (máximo 50 entradas con auto-prune)
}

interface CrmState {
  deals: ClientDeal[];
  fetchDeals: () => Promise<void>;
  addDeal: (deal: Omit<ClientDeal, 'id'>) => void;
  updateDeal: (id: string, updates: Partial<ClientDeal>) => void;
  deleteDeal: (id: string) => void;
  moveDeal: (id: string, newStage: DealStage, newSubstage?: DealSubstage) => Promise<void>;
  logOtActivity: (
    dealId: string,
    action: string,
    details?: string,
    newSubstage?: DealSubstage,
    actorName?: string,
    actorRole?: string
  ) => void;
  reserveDealKit: (dealId: string, actorName?: string) => void;
}

export const useCrmStore = create<CrmState>()(
  persist(
    (set, get) => ({
      deals: [],
      
      fetchDeals: async () => {
        try {
          const fetchedDeals = await crmService.fetchDeals();
          const currentDeals = get().deals;
          // Preservar los deals locales creados que aún no estén en fetchedDeals
          const localDeals = currentDeals.filter(
            d => !fetchedDeals.some(fd => fd.id === d.id || (fd.otRef && d.otRef && fd.otRef === d.otRef))
          );
          set({ deals: [...localDeals, ...fetchedDeals] });
        } catch (error) {
          console.error("Error al cargar deals desde Supabase", error);
        }
      },

      addDeal: (deal) => {
        const newDeal: ClientDeal = {
          ...deal,
          id: `deal-${Date.now()}`,
          substage: deal.substage || 'lead_nuevo',
          activityLog: deal.activityLog || [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actorName: deal.salesAgent || 'Sistema / Cliente',
              actorRole: 'comercial',
              action: 'Creó la Orden de Trabajo (OT)',
              details: `Presupuesto inicial: $${deal.value} USD`,
              toSubstage: deal.substage || 'lead_nuevo',
            }
          ]
        };

        set((state) => ({ deals: [newDeal, ...state.deals] }));

        // Notificar / persistir en crmService
        crmService.createDeal(newDeal).catch((err) => {
          console.warn("Error guardando deal en crmService:", err);
        });
      },
      
      updateDeal: (id, updates) => set((state) => ({
        deals: state.deals.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      
      deleteDeal: (id) => set((state) => ({
        deals: state.deals.filter(d => d.id !== id)
      })),
      
      moveDeal: async (id, newStage, newSubstage) => {
        const STAGE_DEFAULT_SUBSTAGE: Partial<Record<DealStage, DealSubstage>> = {
          'En Producción': 'pendiente_almacen',
          'Terminado': 'pendiente_pago',
          'Facturado': 'factura_emitida',
          'Feedback': 'feedback_pendiente',
        };

        const currentDeal = get().deals.find(d => d.id === id);
        const fromSubstage = currentDeal?.substage || 'unknown';
        const otRef = currentDeal?.otRef || id;

        // Optimistic update
        set((state) => ({
          deals: state.deals.map(d => {
            if (d.id !== id) return d;
            const updatedSubstage = newSubstage || STAGE_DEFAULT_SUBSTAGE[newStage] || d.substage;
            const newLogEntry: ActivityEntry = {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              actorName: 'Usuario',
              actorRole: 'operaciones',
              action: `Movió OT a la etapa "${newStage}"`,
              fromSubstage: d.substage,
              toSubstage: updatedSubstage,
            };
            const currentLog = d.activityLog || [];
            // Auto-prune a 50 entradas máximas
            const updatedLog = [...currentLog, newLogEntry].slice(-50);
            return {
              ...d,
              stage: newStage,
              substage: updatedSubstage,
              activityLog: updatedLog,
            };
          })
        }));

        makeService.dispatchOtSubstageEvent(
          otRef,
          fromSubstage,
          newSubstage || fromSubstage,
          'Usuario'
        );

        try {
          await crmService.updateDealStage(id, newStage);
        } catch (error) {
          // El rollback o reintento se manejará o guardará en salvas_offline
        }
      },

      logOtActivity: (dealId, action, details, newSubstage, actorName = 'Usuario', actorRole = 'operaciones') => {
        set((state) => ({
          deals: state.deals.map((d) => {
            if (d.id !== dealId) return d;
            const fromSubstage = d.substage;
            const toSubstage = newSubstage || d.substage;
            const newLogEntry: ActivityEntry = {
              id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              timestamp: new Date().toISOString(),
              actorName,
              actorRole,
              action,
              details,
              fromSubstage,
              toSubstage,
            };
            const currentLog = d.activityLog || [];
            // Auto-prune a un máximo de 50 entradas (elimina las más antiguas)
            const updatedLog = [...currentLog, newLogEntry].slice(-50);
            return {
              ...d,
              substage: toSubstage,
              activityLog: updatedLog,
            };
          }),
        }));
      },

      reserveDealKit: (dealId, actorName = 'Comercial') => {
        const deal = get().deals.find(d => d.id === dealId);
        if (!deal) return;

        const clean = deal.company.toLowerCase();
        let itemsToReserve: { code: string; qty: number }[] = [];

        if (clean.includes('3kw')) {
          itemsToReserve = [{ code: 'INV-GROW-3KW', qty: 1 }, { code: 'PAN-CAN-450', qty: 6 }];
        } else if (clean.includes('5kw') || clean.includes('6kw')) {
          itemsToReserve = [{ code: 'INV-DEYE-5KW', qty: 1 }, { code: 'PAN-JINKO-550', qty: 10 }, { code: 'BAT-PYLON-4.8', qty: 1 }];
        } else if (clean.includes('10kw') || clean.includes('8kw')) {
          itemsToReserve = [{ code: 'INV-DEYE-5KW', qty: 2 }, { code: 'PAN-JINKO-550', qty: 16 }, { code: 'BAT-PYLON-4.8', qty: 2 }];
        } else {
          itemsToReserve = [{ code: 'INV-DEYE-5KW', qty: 1 }, { code: 'PAN-JINKO-550', qty: 8 }];
        }

        try {
          const { useInventoryStore } = require('./useInventoryStore');
          const invState = useInventoryStore.getState();

          itemsToReserve.forEach(req => {
            const invItem = invState.items.find((i: any) => i.code === req.code);
            if (invItem) {
              invState.reserveStock(invItem.id, req.qty);
            }
          });

          get().logOtActivity(
            dealId,
            `Reservó Kit (${deal.company}) en Almacén`,
            `Reserva de componentes para ${deal.name}`,
            'pendiente_almacen',
            actorName,
            'comercial'
          );
        } catch (err) {
          console.warn("Reserve stock skipped:", err);
        }
      }
    }),
    {
      name: 'convoltaje-crm-storage',
    }
  )
);

