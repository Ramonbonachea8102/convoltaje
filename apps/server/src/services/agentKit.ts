import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

// Cliente administrativo exclusivo de backend con service_role_key
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export interface IncomingWhatsAppMessage {
  from: string; // Número de teléfono (ej. 5355144097)
  messageId: string;
  type: 'text' | 'image' | 'interactive' | 'location' | 'unknown';
  text?: string;
  timestamp: string;
  rawPayload?: any;
}

export const agentKit = {
  /**
   * Procesa un mensaje entrante de WhatsApp y ejecuta la lógica de agente del CRM
   */
  async processIncomingMessage(msg: IncomingWhatsAppMessage): Promise<{ handled: boolean; reply?: string }> {
    console.log(`🤖 [AgentKit] Procesando mensaje de ${msg.from}:`, msg.text || `[Tipo: ${msg.type}]`);

    const cleanText = msg.text?.trim().toLowerCase() || '';

    // 1. Consulta de Estado de OT (ej. "estado OT-0107" o "OT-0107")
    const otMatch = cleanText.match(/ot-\d{4}/i);
    if (otMatch) {
      const otNumber = otMatch[0].toUpperCase();
      try {
        const { data, error } = await supabaseAdmin
          .from('ordenes_trabajo')
          .select('numero_ot, estado, tipo_trabajo, fecha_instalacion')
          .eq('numero_ot', otNumber)
          .single();

        if (error || !data) {
          return {
            handled: true,
            reply: `No encontramos una orden registrada con el código *${otNumber}*. Por favor verifica con tu comercial asignado.`
          };
        }

        return {
          handled: true,
          reply: `📋 *Estado de Orden ${data.numero_ot}*\n• Servicio: ${data.tipo_trabajo}\n• Estado actual: *${data.estado}*\n• Fecha prevista: ${data.fecha_instalacion || 'Por coordinar'}`
        };
      } catch (err) {
        console.error('[AgentKit] Error consultando OT:', err);
      }
    }

    // 2. Consulta de Kits y Catálogo Solar
    if (cleanText.includes('kit') || cleanText.includes('precio') || cleanText.includes('catalogo') || cleanText.includes('cotizar')) {
      return {
        handled: true,
        reply: `⚡ *Convoltaje Energía Solar*\n\nNuestros sistemas principales:\n• *Kit 3K 110V*: Ideal para luces, TV, ventiladores y refrigerador.\n• *Kit 6K Plus*: Respaldo completo para split y cargas medias.\n• *Kit 10K Pro*: Respaldo total con inversor de alta capacidad.\n\n¿Deseas calcular tu consumo personalizado o hablar con un asesor comercial?`
      };
    }

    // 3. Fallback de cortesía para capturar Lead
    return {
      handled: true,
      reply: `Hola! Gracias por contactar a *Convoltaje*. ☀️ Un asesor comercial revisará tu mensaje en breve para brindarte atención personalizada.`
    };
  }
};
