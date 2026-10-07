/**
 * Professional PDF templates with Convoltaje branding
 * These generate HTML that can be converted to PDF using browser print or server-side tools
 */

import { OFFICIAL_WHATSAPP_CLEAN } from "./products";

export interface QuotationData {
  quotationNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  kitName?: string;
  kitPrice?: number;
  kitSpecs?: {
    inverterPower: number;
    batteryCapacity: number;
    minConsumption: number;
    maxConsumption: number;
  };
  complementaryProducts?: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  discountPercentage?: number;
  total: number;
  createdAt: Date;
  expiresAt?: Date;
  logoUrl?: string;
}

/**
 * Generate professional quotation HTML with Convoltaje branding
 */
export function generateQuotationHTML(data: QuotationData): string {
  const createdDate = new Date(data.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const expiresDate = data.expiresAt
    ? new Date(data.expiresAt).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "30 días desde la emisión";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prefactura ${data.quotationNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      line-height: 1.6;
      background: white;
    }
    .page { 
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #00d4ff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo-section {
      flex: 1;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #001a4d;
      margin-bottom: 5px;
      letter-spacing: 1px;
    }
    .tagline {
      font-size: 12px;
      color: #00d4ff;
      font-weight: 600;
    }
    .doc-info {
      text-align: right;
      flex: 1;
    }
    .doc-title {
      font-size: 24px;
      font-weight: bold;
      color: #001a4d;
      margin-bottom: 10px;
    }
    .doc-number {
      font-size: 13px;
      color: #666;
      margin-bottom: 3px;
    }
    h2 {
      font-size: 16px;
      color: #001a4d;
      margin-top: 25px;
      margin-bottom: 12px;
      border-bottom: 2px solid #00d4ff;
      padding-bottom: 8px;
      font-weight: 600;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 20px;
    }
    .info-block {
      background: #f8f9fa;
      padding: 12px;
      border-radius: 6px;
      border-left: 3px solid #00d4ff;
    }
    .info-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #001a4d;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    thead {
      background: #001a4d;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 13px;
    }
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    .summary-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #e0e0e0;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .summary-label {
      color: #666;
    }
    .summary-value {
      font-weight: 600;
      color: #001a4d;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #00d4ff;
      font-size: 18px;
      font-weight: bold;
      color: #001a4d;
    }
    .discount-badge {
      display: inline-block;
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    .cta-section {
      margin-top: 30px;
      padding: 15px;
      background: linear-gradient(135deg, #e8f4f8 0%, #f0f8ff 100%);
      border-left: 4px solid #00d4ff;
      border-radius: 4px;
    }
    .cta-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 15px;
    }
    .cta-title {
      font-size: 14px;
      font-weight: bold;
      color: #001a4d;
      margin-bottom: 8px;
    }
    .cta-text {
      font-size: 12px;
      color: #333;
      line-height: 1.8;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 10px;
      color: #999;
      text-align: center;
    }
    .contact-info {
      font-size: 11px;
      color: #666;
      margin: 10px 0;
    }
    .whatsapp-link {
      color: #25d366;
      font-weight: 600;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .page { box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo-section">
        <div class="logo">⚡ CONVOLTAJE</div>
        <div class="tagline">Energía Solar para Todos</div>
      </div>
      <div class="doc-info">
        <div class="doc-title">PREFACTURA</div>
        <div class="doc-number">Nº ${data.quotationNumber}</div>
        <div class="doc-number" style="color: #999; font-size: 11px;">Emitida: ${createdDate}</div>
      </div>
    </div>

    <!-- Customer Info -->
    <h2>Información del Cliente</h2>
    <div class="info-grid">
      <div class="info-block">
        <div class="info-label">Nombre</div>
        <div class="info-value">${data.customerName}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Email</div>
        <div class="info-value">${data.customerEmail}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Teléfono</div>
        <div class="info-value">${data.customerPhone}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Válido hasta</div>
        <div class="info-value">${expiresDate}</div>
      </div>
    </div>

    <!-- Order Details -->
    <h2>Detalles del Pedido</h2>
    <table>
      <thead>
        <tr>
          <th>Descripción</th>
          <th style="text-align: right;">Cantidad</th>
          <th style="text-align: right;">Precio Unitario</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${
          data.kitName
            ? `
        <tr>
          <td>
            <strong>${data.kitName}</strong>
            ${
              data.kitSpecs
                ? `<br><small style="color: #666;">
                  ⚡ ${data.kitSpecs.inverterPower} kW | 
                  🔋 ${data.kitSpecs.batteryCapacity} kWh | 
                  📊 ${data.kitSpecs.minConsumption}-${data.kitSpecs.maxConsumption} kWh/día
                </small>`
                : ""
            }
          </td>
          <td style="text-align: right;">1</td>
          <td style="text-align: right;">$${(data.kitPrice || 0).toFixed(2)}</td>
          <td style="text-align: right;"><strong>$${(data.kitPrice || 0).toFixed(2)}</strong></td>
        </tr>
        `
            : ""
        }
        ${
          data.complementaryProducts && data.complementaryProducts.length > 0
            ? data.complementaryProducts
                .map(
                  (product) => `
        <tr>
          <td>${product.name}</td>
          <td style="text-align: right;">${product.quantity}</td>
          <td style="text-align: right;">$${product.price.toFixed(2)}</td>
          <td style="text-align: right;"><strong>$${(product.price * product.quantity).toFixed(2)}</strong></td>
        </tr>
        `
                )
                .join("")
            : ""
        }
      </tbody>
    </table>

    <!-- Summary -->
    <div class="summary-section">
      <div class="summary-row">
        <span class="summary-label">Subtotal:</span>
        <span class="summary-value">$${(data.subtotal / 100).toFixed(2)}</span>
      </div>
      ${
        data.discount > 0
          ? `
      <div class="summary-row">
        <span class="summary-label">
          Descuento ${data.discountPercentage ? `(${data.discountPercentage}%)` : ""}:
          <span class="discount-badge">-$${(data.discount / 100).toFixed(2)}</span>
        </span>
        <span class="summary-value">-$${(data.discount / 100).toFixed(2)}</span>
      </div>
      `
          : ""
      }
      <div class="total-row">
        <span>TOTAL:</span>
        <span>$${(data.total / 100).toFixed(2)} USD</span>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="cta-section">
      <div class="cta-container">
        <div>
          <div class="cta-title">📞 ¿Próximos Pasos?</div>
          <div class="cta-text">
            1. Revisa esta prefactura<br>
            2. Contacta a nuestro comercial provincial<br>
            3. Confirme su pedido y acuerde la instalación<br>
            4. ¡Disfrute de su energía solar con garantía Convoltaje!<br><br>
            <strong>WhatsApp:</strong> <span class="whatsapp-link">${OFFICIAL_WHATSAPP_CLEAN}</span><br>
            <strong>Email:</strong> convoltaje@gmail.com
          </div>
        </div>
        <div style="flex-shrink: 0; display: flex; justify-content: center; align-items: center;">
          <img src="/images/Damos garantia.png" style="width: 90px; height: auto;" alt="Damos Garantía"/>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="contact-info">
        Convoltaje - Soluciones de Energía Solar<br>
        WhatsApp: ${OFFICIAL_WHATSAPP_CLEAN} | Email: contacto@convoltaje.com<br>
        Esta prefactura es válida por 30 días desde su emisión.
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text version for email
 */
export function generateQuotationText(data: QuotationData): string {
  return `
PREFACTURA - CONVOLTAJE
========================

Número: ${data.quotationNumber}
Fecha: ${new Date(data.createdAt).toLocaleDateString("es-ES")}
Válido hasta: ${data.expiresAt ? new Date(data.expiresAt).toLocaleDateString("es-ES") : "30 días"}

CLIENTE
-------
Nombre: ${data.customerName}
Email: ${data.customerEmail}
Teléfono: ${data.customerPhone}

DETALLES DEL PEDIDO
-------------------
${
  data.kitName
    ? `Kit Solar: ${data.kitName}
Precio: $${(data.kitPrice || 0).toFixed(2)} USD
${
  data.kitSpecs
    ? `Especificaciones:
  - Potencia: ${data.kitSpecs.inverterPower} kW
  - Batería: ${data.kitSpecs.batteryCapacity} kWh
  - Consumo ideal: ${data.kitSpecs.minConsumption}-${data.kitSpecs.maxConsumption} kWh/día`
    : ""
}`
    : ""
}

${
  data.complementaryProducts && data.complementaryProducts.length > 0
    ? `Productos Complementarios:
${data.complementaryProducts.map((p) => `- ${p.name} x${p.quantity}: $${(p.price * p.quantity).toFixed(2)}`).join("\n")}`
    : ""
}

RESUMEN FINANCIERO
------------------
Subtotal: $${(data.subtotal / 100).toFixed(2)} USD
${data.discount > 0 ? `Descuento: -$${(data.discount / 100).toFixed(2)} USD` : ""}
TOTAL: $${(data.total / 100).toFixed(2)} USD

PRÓXIMOS PASOS
--------------
1. Revisa esta prefactura
2. Contacta a nuestro equipo comercial por WhatsApp
3. Confirma tu pedido y procede con el pago
4. ¡Disfruta de tu energía limpia!

Contacto: WhatsApp ${OFFICIAL_WHATSAPP_CLEAN}
Email: contacto@convoltaje.com

---
Esta prefactura es válida por 30 días desde su emisión.
  `.trim();
}
