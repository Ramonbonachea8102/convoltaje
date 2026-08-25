import Dexie, { type Table } from 'dexie';
import { supabase } from '../supabase';

export interface OfflineImageBlob {
  id: string;
  name: string;
  blob: Blob;
  type: string;
  createdAt: string;
}

export interface OfflinePayload {
  id?: string; // Client-side UUID for idempotent sync
  action: 'CREATE_OT' | 'UPDATE_OT' | 'DELETE_OT' | 'MOVE_DEAL' | 'UPDATE_DEAL';
  table: string;
  recordId?: string;
  payload: any;
  images?: OfflineImageBlob[]; // Blobs nativos en IndexedDB
  timestamp: string;
  retries?: number;
}

export interface OfflineQueueRecord extends OfflinePayload {
  id: string;
  retries: number;
}

class ConvoltajeDatabase extends Dexie {
  offlineQueue!: Table<OfflineQueueRecord, string>;
  offlineImages!: Table<OfflineImageBlob, string>;

  constructor() {
    super('ConvoltajeOfflineDB');
    this.version(1).stores({
      offlineQueue: 'id, action, table, recordId, timestamp',
      offlineImages: 'id, name, type, createdAt'
    });
  }
}

export const db = new ConvoltajeDatabase();

/**
 * Solicita persistencia de almacenamiento en el navegador para evitar desalojo por baja memoria.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      console.log(`[Storage] Persistencia de IndexedDB otorgada: ${isPersisted}`);
      return isPersisted;
    } catch (err) {
      console.warn('[Storage] Error al solicitar persistencia de almacenamiento:', err);
      return false;
    }
  }
  return false;
}

export const offlineService = {
  /**
   * Guarda una acción en IndexedDB con ID cliente (UUID) para upsert idempotente.
   * Las imágenes DEBEN pasarse como Blob nativo, nunca como string base64.
   */
  async saveOfflineAction(userId: string | null, data: OfflinePayload): Promise<string> {
    const actionId = data.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
    
    // Asegurar que el payload tenga su ID de cliente para upsert idempotente
    if (data.payload && typeof data.payload === 'object' && !data.payload.id) {
      data.payload.id = data.recordId || actionId;
    }

    const record: OfflineQueueRecord = {
      ...data,
      id: actionId,
      retries: data.retries || 0,
      timestamp: data.timestamp || new Date().toISOString()
    };

    console.log('[OfflineService] Guardando acción offline en IndexedDB (Dexie):', record);

    try {
      await db.offlineQueue.put(record);

      // Si hay blobs asociados, guardarlos también en la tabla de imágenes
      if (data.images && data.images.length > 0) {
        for (const img of data.images) {
          if (img.blob instanceof Blob) {
            await db.offlineImages.put(img);
          }
        }
      }
    } catch (dbErr) {
      console.error('[OfflineService] Error guardando en Dexie IndexedDB:', dbErr);
    }

    // Opcional: registrar intento en la tabla remota salvas_offline si hay algo de señal
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        await supabase.from('salvas_offline').insert({
          usuario_id: userId && userId.length === 36 ? userId : null,
          datos_json: { ...record, images: undefined }, // No enviar blobs crudos por JSON RPC
          fecha_salva: new Date().toISOString(),
          sincronizada: false
        });
      }
    } catch (e) {
      console.warn('[OfflineService] No se pudo asentar log en salvas_offline (sin red).', e);
    }

    return actionId;
  },

  /**
   * Guarda una imagen como Blob nativo en IndexedDB
   */
  async saveImageBlob(blob: Blob, name = 'capture.webp'): Promise<string> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `img-${Date.now()}`;
    const imgRecord: OfflineImageBlob = {
      id,
      name,
      blob,
      type: blob.type || 'image/webp',
      createdAt: new Date().toISOString()
    };
    await db.offlineImages.put(imgRecord);
    return id;
  },

  /**
   * Obtiene un Blob de imagen por ID
   */
  async getImageBlob(id: string): Promise<Blob | null> {
    const record = await db.offlineImages.get(id);
    return record ? record.blob : null;
  },

  /**
   * Migra items existentes de localStorage a IndexedDB.
   * Regla de contrato:
   * 1. Leer de localStorage
   * 2. Escribir en Dexie
   * 3. VERIFICAR lectura exitosa en Dexie
   * 4. Solo entonces borrar de localStorage. Si falla la verificación, el item permanece en localStorage.
   */
  async migrateLocalStorageQueue(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    try {
      const raw = localStorage.getItem('convoltaje_offline_queue');
      if (!raw) return;

      const legacyQueue: OfflinePayload[] = JSON.parse(raw);
      if (!Array.isArray(legacyQueue) || legacyQueue.length === 0) {
        localStorage.removeItem('convoltaje_offline_queue');
        return;
      }

      console.log(`[OfflineService] Migrando ${legacyQueue.length} acciones de localStorage -> IndexedDB (Dexie)...`);
      const unverifiedItems: OfflinePayload[] = [];

      for (const item of legacyQueue) {
        const itemId = item.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `legacy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`);
        const queueRecord: OfflineQueueRecord = {
          ...item,
          id: itemId,
          retries: item.retries || 0,
          timestamp: item.timestamp || new Date().toISOString()
        };

        try {
          // 1. Escribir en Dexie
          await db.offlineQueue.put(queueRecord);

          // 2. VERIFICAR lectura exitosa
          const verified = await db.offlineQueue.get(itemId);
          if (!verified || verified.id !== itemId) {
            console.warn(`[OfflineService] Verificación fallida para item ${itemId}. Se mantendrá en localStorage.`);
            unverifiedItems.push(item);
          }
        } catch (migrationErr) {
          console.error(`[OfflineService] Error al migrar item ${itemId}:`, migrationErr);
          unverifiedItems.push(item);
        }
      }

      // 3. Solo actualizar localStorage con los items que fallaron la verificación
      if (unverifiedItems.length > 0) {
        localStorage.setItem('convoltaje_offline_queue', JSON.stringify(unverifiedItems));
        console.warn(`[OfflineService] Quedaron ${unverifiedItems.length} items en localStorage para reintentar en el próximo boot.`);
      } else {
        localStorage.removeItem('convoltaje_offline_queue');
        console.log('[OfflineService] Migración de localStorage a IndexedDB completada con 100% de verificación.');
      }
    } catch (err) {
      console.error('[OfflineService] Error general durante la migración de localStorage:', err);
    }
  },

  /**
   * Sincronización idempotente con Supabase al reconectar.
   */
  async syncOfflineQueue(): Promise<void> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.log('[OfflineService] Sin conexión a internet, sync omitido.');
      return;
    }

    try {
      const items = await db.offlineQueue.toArray();
      if (items.length === 0) return;

      console.log(`[OfflineService] Sincronizando ${items.length} acciones pendientes con Supabase...`);

      for (const item of items) {
        try {
          // Idempotencia: Usamos upsert con la clave de ID única de cliente
          if (item.action === 'CREATE_OT' || item.action === 'UPDATE_OT' || item.action === 'UPDATE_DEAL' || item.action === 'MOVE_DEAL') {
            const upsertPayload = {
              ...item.payload,
              id: item.payload?.id || item.recordId || item.id
            };

            const { error } = await supabase
              .from(item.table)
              .upsert(upsertPayload, { onConflict: 'id' });

            if (error) throw error;
          } else if (item.action === 'DELETE_OT') {
            const targetId = item.recordId || item.payload?.id;
            if (targetId) {
              const { error } = await supabase
                .from(item.table)
                .delete()
                .eq('id', targetId);
              if (error) throw error;
            }
          }

          // Éxito: Eliminar de la cola IndexedDB
          await db.offlineQueue.delete(item.id);
          console.log(`[OfflineService] Acción ${item.id} (${item.action}) sincronizada y eliminada de IndexedDB.`);
        } catch (syncErr) {
          console.error(`[OfflineService] Error sincronizando acción ${item.id}:`, syncErr);
          // Incrementar contador de reintentos
          await db.offlineQueue.update(item.id, { retries: (item.retries || 0) + 1 });
        }
      }
    } catch (err) {
      console.error('[OfflineService] Excepción durante syncOfflineQueue:', err);
    }
  },

  /**
   * Obtiene la cantidad de acciones pendientes en cola
   */
  async getPendingCount(): Promise<number> {
    try {
      return await db.offlineQueue.count();
    } catch {
      return 0;
    }
  }
};

// ============================================================
// INICIALIZACIÓN AUTOMÁTICA
// ============================================================
if (typeof window !== 'undefined') {
  // 1. Solicitar almacenamiento persistente
  requestPersistentStorage();

  // 2. Ejecutar migración segura desde localStorage
  offlineService.migrateLocalStorageQueue();

  // 3. Listener global para sincronizar al volver la red
  window.addEventListener('online', () => {
    console.log('[OfflineService] Conexión restaurada. Ejecutando sync idempotente...');
    offlineService.syncOfflineQueue();
  });
}
