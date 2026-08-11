import { supabase } from '../supabase';

export type MakeEventType = 
  | 'OT_CREATED'
  | 'OT_UPDATED'
  | 'OT_DELETED'
  | 'OT_SUBSTAGE_CHANGED'
  | 'DEAL_STAGE_CHANGED'
  | 'PAYMENT_PROCESSED'
  | 'REFUND_REQUESTED';

export interface MakeEventPayload {
  eventType: MakeEventType;
  timestamp: string;
  data: Record<string, any>;
  userId?: string;
}

export const makeService = {
  /**
   * Envía un evento a Make.com a través de la Supabase Edge Function protegida ('notify-make')
   * La Edge Function autentica al usuario mediante JWT y usa el secreto MAKE_WEBHOOK_URL del servidor.
   */
  notify: async (payload: Omit<MakeEventPayload, 'timestamp'>) => {
    const fullPayload: MakeEventPayload = {
      ...payload,
      timestamp: new Date().toISOString()
    };

    try {
      // Invocamos la Edge Function protegida de Supabase sin exponer URLs ni tokens en el cliente
      const { error } = await supabase.functions.invoke('notify-make', {
        body: fullPayload
      });

      if (error) {
        console.warn('Advertencia o error al invocar Edge Function notify-make:', error);
      }
    } catch (error) {
      console.error('Error al notificar evento vía Supabase Edge Function:', error);
    }
  },

  /**
   * Despachador de evento de cambio de sub-etapa de OT para Make.com (Webhook / Consola)
   */
  dispatchOtSubstageEvent: (
    otRef: string,
    fromSubstage: string,
    toSubstage: string,
    actor: string
  ) => {
    const payload = {
      event: "ot.substage_changed",
      otRef,
      from: fromSubstage,
      to: toSubstage,
      actor,
      timestamp: new Date().toISOString()
    };
    console.log("⚡ [MAKE AUTOMATION DISPATCH]:", payload);
    makeService.notify({
      eventType: 'OT_SUBSTAGE_CHANGED',
      data: payload
    });
  }
};

