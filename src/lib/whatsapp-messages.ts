import { ECOPOWER_KITS } from "./calculator";
import { TINTAFLASH_PRODUCTS, OFFICIAL_WHATSAPP_CLEAN } from "./products";

/**
 * Generate personalized WhatsApp message for a specific kit
 */
export function getKitWhatsAppMessage(kitId: string): string {
  const kit = ECOPOWER_KITS.find((k) => k.id === kitId);
  if (!kit) return "Hola, me interesa conocer más sobre los sistemas solares de Convoltaje.";

  return `Hola, me interesa el kit *${kit.name}*

💰 Precio: $${kit.price} USD
⚡ Potencia: ${kit.inverterPower} kW
🔋 Batería: ${kit.batteryCapacity} kWh
📊 Consumo ideal: ${kit.minDailyConsumption}-${kit.maxDailyConsumption} kWh/día

Me gustaría conocer más detalles y recibir una cotización personalizada.`;
}

/**
 * Generate personalized WhatsApp message for a specific product
 */
export function getProductWhatsAppMessage(productId: string): string {
  const product = TINTAFLASH_PRODUCTS.find((p) => p.id === productId);
  if (!product)
    return "Hola, me interesa personalizar productos con Tintaflash.";

  return `Hola, me interesa personalizar el producto: *${product.name}*

📦 Producto: ${product.name}
💰 Precio base: $${product.price} USD
🎨 Personalización: Ilimitada

Me gustaría conocer opciones de diseño y recibir una cotización.`;
}

/**
 * Generate WhatsApp message for calculator results with kit recommendation
 */
export function getCalculatorResultsMessage(
  kitId: string,
  dailyConsumption: number,
  complementaryProducts: string[] = []
): string {
  const kit = ECOPOWER_KITS.find((k) => k.id === kitId);
  if (!kit) return "Hola, me interesa conocer más sobre los sistemas solares de Convoltaje.";

  let message = `Hola, basado en mi análisis de consumo, me interesa el kit: *${kit.name}*

📊 Mi consumo diario: ${dailyConsumption.toFixed(1)} kWh
⚡ Kit recomendado: ${kit.name}
💰 Precio: $${kit.price} USD
🔋 Capacidad: ${kit.batteryCapacity} kWh
⚙️ Potencia: ${kit.inverterPower} kW`;

  if (complementaryProducts.length > 0) {
    message += `\n\n🛠️ Productos complementarios de interés:\n`;
    complementaryProducts.forEach((productId) => {
      const product = TINTAFLASH_PRODUCTS.find((p) => p.id === productId);
      if (product) {
        message += `• ${product.name} ($${product.price})\n`;
      }
    });
  }

  message += `\n\nMe gustaría recibir una cotización completa y más información sobre la instalación.`;

  return message;
}

/**
 * Generate WhatsApp message for bulk order with discount
 */
export function getBulkOrderMessage(
  kitId: string,
  complementaryProducts: string[],
  subtotal: number,
  discount: number,
  total: number
): string {
  const kit = ECOPOWER_KITS.find((k) => k.id === kitId);

  let message = `Hola, me interesa hacer un pedido completo:

🎯 KIT PRINCIPAL
${kit ? `• ${kit.name}: $${kit.price}` : ""}

🛠️ PRODUCTOS COMPLEMENTARIOS`;

  complementaryProducts.forEach((productId) => {
    const product = TINTAFLASH_PRODUCTS.find((p) => p.id === productId);
    if (product) {
      message += `\n• ${product.name}: $${product.price}`;
    }
  });

  message += `\n\n💰 RESUMEN FINANCIERO
Subtotal: $${(subtotal / 100).toFixed(2)}
Descuento: -$${(discount / 100).toFixed(2)}
TOTAL: $${(total / 100).toFixed(2)} USD

Me gustaría proceder con la compra y recibir los detalles de pago.`;

  return message;
}

/**
 * Generate WhatsApp message for design consultation (Tintaflash)
 */
export function getDesignConsultationMessage(
  productIds: string[],
  quantity: number = 1
): string {
  let message = `Hola, me interesa personalizar los siguientes productos de Tintaflash:

📦 PRODUCTOS SELECCIONADOS`;

  productIds.forEach((productId) => {
    const product = TINTAFLASH_PRODUCTS.find((p) => p.id === productId);
    if (product) {
      message += `\n• ${product.name} (Cantidad: ${quantity})`;
    }
  });

  message += `\n\n🎨 PERSONALIZACIÓN
Tengo mis propios diseños y me gustaría que me ayuden con:
- Revisión de diseños
- Recomendaciones de materiales
- Cotización final
- Tiempo de entrega

¿Cuál es el siguiente paso?`;

  return message;
}

/**
 * Generate generic inquiry message
 */
export function getGenericInquiryMessage(topic: string): string {
  return `Hola, tengo una pregunta sobre ${topic} en Convoltaje. Me gustaría hablar con un comercial para más información.`;
}

/**
 * Generate WhatsApp link with pre-filled message
 */
export function getWhatsAppLink(
  message: string,
  phoneNumber: string = OFFICIAL_WHATSAPP_CLEAN
): string {
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
}

/**
 * Generate WhatsApp link for kit inquiry
 */
export function getKitWhatsAppLink(kitId: string): string {
  const message = getKitWhatsAppMessage(kitId);
  return getWhatsAppLink(message);
}

/**
 * Generate WhatsApp link for product inquiry
 */
export function getProductWhatsAppLink(productId: string): string {
  const message = getProductWhatsAppMessage(productId);
  return getWhatsAppLink(message);
}

/**
 * Generate WhatsApp link for calculator results
 */
export function getCalculatorResultsLink(
  kitId: string,
  dailyConsumption: number,
  complementaryProducts: string[] = []
): string {
  const message = getCalculatorResultsMessage(
    kitId,
    dailyConsumption,
    complementaryProducts
  );
  return getWhatsAppLink(message);
}

/**
 * Generate WhatsApp link for bulk order
 */
export function getBulkOrderLink(
  kitId: string,
  complementaryProducts: string[],
  subtotal: number,
  discount: number,
  total: number
): string {
  const message = getBulkOrderMessage(
    kitId,
    complementaryProducts,
    subtotal,
    discount,
    total
  );
  return getWhatsAppLink(message);
}
