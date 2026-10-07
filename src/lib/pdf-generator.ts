import { EcoPowerKit } from "@/lib/calculator";
import { Product, OFFICIAL_WHATSAPP_NUMBER, OFFICIAL_WHATSAPP_CLEAN } from "@/lib/products";

interface PDFGeneratorOptions {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  kit: EcoPowerKit;
  dailyConsumption: number;
  purchaseType: "unitaria" | "mayorista";
  installationAddress: string;
  installationDate: string;
  salesAgent: string;
}

export async function generatePDF(options: PDFGeneratorOptions): Promise<Blob> {
  const {
    clientName,
    clientPhone,
    clientEmail,
    kit,
    dailyConsumption,
    purchaseType,
    installationAddress,
    installationDate,
    salesAgent,
  } = options;

  const refId = `OT-${Math.floor(1000 + Math.random() * 9000)}`;

  let warrantyInfo = "Garantía de 3 meses en equipos e instalación.";
  if (kit.inverterPower >= 10) {
    warrantyInfo = "Garantía de 1 año en equipos e instalación.";
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        .pdf-container {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #333;
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 0;
          box-sizing: border-box;
        }
        .page {
          padding: 40px 50px;
          position: relative;
          min-height: 1050px;
          page-break-after: always;
        }
        .header-geometric {
          position: absolute;
          top: 0;
          left: 0;
          width: 350px;
          height: 120px;
          background: linear-gradient(135deg, #0F3A7D 0%, #00D9FF 100%);
          clip-path: polygon(0 0, 100% 0, 80% 100%, 0% 100%);
          display: flex;
          justify-content: flex-start;
          align-items: center;
          padding-left: 40px;
        }
        .header-geometric img {
          height: 60px;
          object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .document-title {
          font-size: 32px;
          font-weight: 800;
          color: #0F3A7D;
          margin-top: 40px;
          margin-bottom: 5px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-align: right;
        }
        .meta-data {
          font-size: 14px;
          color: #666;
          margin-bottom: 40px;
          text-align: right;
        }
        .meta-data p {
          margin: 4px 0;
        }
        .client-section {
          background: #f8fafc;
          border-left: 4px solid #0F3A7D;
          padding: 15px 20px;
          flex: 1;
        }
        .commercial-section {
          background: #f8fafc;
          border-left: 4px solid #00D9FF;
          padding: 15px 20px;
          flex: 1;
        }
        .client-section h3, .commercial-section h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #0F3A7D;
        }
        .client-section p, .commercial-section p {
          margin: 4px 0;
          font-size: 14px;
        }
        .table-container {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        .table-container th {
          background-color: #0F3A7D;
          color: white;
          text-align: left;
          padding: 12px 15px;
          font-size: 14px;
        }
        .table-container td {
          padding: 15px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .table-container .price-col {
          text-align: right;
          font-weight: bold;
        }
        .total-row {
          background-color: #f1f5f9;
        }
        .total-row td {
          font-size: 18px;
          font-weight: bold;
          color: #0F3A7D;
          border-bottom: none;
        }
        .footer-badge {
          position: absolute;
          bottom: 40px;
          left: 50px;
          height: 80px;
        }
        
        /* Page 2 specifics */
        .section-title {
          color: #0F3A7D;
          border-bottom: 2px solid #00D9FF;
          padding-bottom: 8px;
          margin-top: 30px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .terms-list {
          margin: 0 0 10px 0;
          padding-left: 20px;
          font-size: 13px;
          color: #444;
          line-height: 1.4;
          text-align: justify;
        }
        .terms-list li {
          margin-bottom: 5px;
        }
        .highlight-box {
          background: #fff8f1;
          border: 1px solid #fed7aa;
          padding: 15px;
          border-radius: 6px;
          margin-top: 20px;
          font-size: 14px;
          color: #9a3412;
        }
      </style>
    </head>
    <body>
      <div class="pdf-container">
        <!-- PÁGINA 1: LA PREFACTURA -->
        <div class="page">
          <div class="header-geometric">
            <img src="/images/Marca de agua.png" alt="ConVoltaje Logo" />
          </div>
          
          <div style="display: flex; justify-content: flex-end; margin-bottom: 20px; position: relative; z-index: 10;">
            <div>
              <h1 class="document-title">OFERTA COMERCIAL</h1>
              
              <div class="meta-data">
                <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>ID Orden:</strong> OT-${Math.floor(Math.random() * 10000)}</p>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 20px; margin-bottom: 40px; margin-top: 40px;">
            <div class="client-section">
              <h3>Datos del Cliente</h3>
              <p><strong>Nombre:</strong> ${clientName}</p>
              <p><strong>Teléfono:</strong> ${clientPhone}</p>
              ${clientEmail ? `<p><strong>Email:</strong> ${clientEmail}</p>` : ''}
              ${installationAddress ? `<p><strong>Dirección:</strong> ${installationAddress}</p>` : ''}
              ${installationDate ? `<p><strong>Fecha Preferida:</strong> ${installationDate}</p>` : ''}
            </div>
            
            <div class="commercial-section">
              <h3>Datos del Comercial</h3>
              <p><strong>Atendido por:</strong> ${salesAgent || 'Vía Web / Calculadora'}</p>
              <p><strong>Canal:</strong> ${salesAgent ? 'Venta Asistida' : 'Autogestión Web'}</p>
              <p><strong>Contacto Info:</strong> ${salesAgent ? 'Asignado' : OFFICIAL_WHATSAPP_NUMBER}</p>
            </div>
          </div>

          <table class="table-container">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Consumo</th>
                <th class="price-col">Precio Unit.</th>
                <th class="price-col">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>${kit.name}</strong><br>
                  <span style="color: #666; font-size: 12px;">Alto rendimiento con gran autonomía<br>Inversor: ${kit.inverterPower} | Batería: ${kit.batteryCapacity}</span>
                </td>
                <td>
                  <strong>${dailyConsumption} kWh/día</strong><br>
                  <span style="color: #666; font-size: 10px;">(${Math.round(dailyConsumption * 30).toFixed(2)} /mes)</span>
                </td>
                <td class="price-col">$${kit.price.toLocaleString()}</td>
                <td class="price-col">$${kit.price.toLocaleString()}</td>
              </tr>
              <tr>
                <td>
                  <strong>Instalación y Puesta en Marcha</strong><br>
                  <span style="color: #666; font-size: 12px;">Mano de obra certificada y configuración inicial.</span>
                </td>
                <td>-</td>
                <td class="price-col">Incluido</td>
                <td class="price-col">$0.00</td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right; padding-right: 20px;">TOTAL A PAGAR (USD)</td>
                <td class="price-col">$${kit.price.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 50px; font-size: 14px; color: #555;">
            <p><strong>Método de pago:</strong> Efectivo o Transferencia al finalizar la instalación.</p>
            <p>Sin cobros por adelantado.</p>
          </div>

          <img src="/images/Damos garantia.png" alt="Damos Garantía" class="footer-badge" />
        </div>

        <!-- PÁGINA 2: TÉRMINOS Y CONDICIONES -->
        <div class="page" style="page-break-after: auto;">
          <div class="header-geometric" style="height: 60px; clip-path: polygon(0 0, 100% 0, 90% 100%, 0% 100%);"></div>
          
          <h2 style="margin-top: 40px; color: #0F3A7D; font-size: 24px;">Condiciones del Servicio</h2>
          
          <h3 class="section-title" style="margin-top: 20px;">1. ¿Qué incluye la oferta?</h3>
          <ul class="terms-list">
            <li>Suministro de los equipos fotovoltaicos detallados en la página anterior.</li>
            <li>Transporte de los equipos hasta el sitio de instalación.</li>
            <li>Instalación mecánica y eléctrica estándar (cableado desde los paneles hasta el inversor y baterías, a una distancia prudencial).</li>
            <li>Configuración del inversor y puesta en marcha del sistema.</li>
          </ul>

          <h3 class="section-title" style="margin-top: 20px;">2. ¿Qué NO está incluido?</h3>
          <ul class="terms-list">
            <li>Obras civiles (construcción de bases de concreto, rotura de paredes, zanjado extenso).</li>
            <li>Acondicionamiento o sustitución del cableado eléctrico existente de la vivienda si se encuentra en mal estado.</li>
            <li>Materiales eléctricos adicionales si la distancia entre paneles e inversor supera lo estándar.</li>
          </ul>

          <h3 class="section-title" style="margin-top: 20px;">3. Condiciones del Espacio</h3>
          <p style="font-size: 14px; color: #444; margin-top: 10px;">Para garantizar el éxito de la instalación, el cliente debe disponer de:</p>
          <ul class="terms-list">
            <li>Una superficie sólida (techo de placa o similar) libre de sombras para los paneles solares.</li>
            <li>Un espacio interior ventilado y protegido de la intemperie para el inversor y las baterías.</li>
            <li>Acometida eléctrica en buenas condiciones para realizar las conexiones de forma segura.</li>
          </ul>

          <h3 class="section-title" style="margin-top: 20px;">4. Garantía</h3>
          <ul class="terms-list">
            <li><strong>Cobertura:</strong> ${warrantyInfo}</li>
            <li><strong>Política de Pago:</strong> No cobramos anticipo. El pago se realiza únicamente cuando el sistema está instalado y funcionando al 100%.</li>
          </ul>

          <div class="highlight-box">
            <strong>Nota importante:</strong> La garantía pierde efecto si los equipos son manipulados por personal no autorizado por ConVoltaje, o si sufren daños por descargas atmosféricas directas o desastres naturales.
          </div>
          
          <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
            <div style="text-align: center; width: 250px; border-top: 1px solid #000; padding-top: 10px;">
              <p style="margin: 0; font-size: 14px; font-weight: bold;">Por ConVoltaje</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Firma Autorizada</p>
            </div>
            <div style="text-align: center; width: 250px; border-top: 1px solid #000; padding-top: 10px;">
              <p style="margin: 0; font-size: 14px; font-weight: bold;">El Cliente</p>
              <p style="margin: 0; font-size: 12px; color: #666;">Aceptación Conforme</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const html2pdf = (await import("html2pdf.js")).default;

    const options: any = {
      margin: 0,
      filename: `Oferta_${clientName}_${new Date().toISOString().split("T")[0]}.pdf`,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: true },
      jsPDF: { unit: "pt", format: "letter", orientation: "portrait" },
    };

    return new Promise((resolve, reject) => {
      html2pdf()
        .set(options)
        .from(htmlContent)
        .toPdf()
        .output("blob")
        .then((blob: Blob) => resolve(blob))
        .catch(reject);
    });
  } catch (error) {
    console.warn("html2pdf failed or not available, using HTML fallback", error);
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    return blob;
  }
}

export async function generateProductSheet(product: Product): Promise<Blob> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #1A1F2E; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; padding: 40px; }
        .header {
          border-bottom: 3px solid #0F3A7D;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header h1 { color: #0F3A7D; font-size: 26px; }
        .header h2 { color: #FF6B35; font-size: 16px; margin-top: 5px; font-weight: normal; }
        
        .product-title {
          font-size: 32px;
          color: #1A1F2E;
          margin-bottom: 10px;
        }
        .product-price {
          font-size: 24px;
          color: #0F3A7D;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .product-desc {
          font-size: 16px;
          margin-bottom: 30px;
        }
        
        table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 30px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E0E4E8; }
        th { background-color: #F8F9FA; font-weight: bold; color: #0F3A7D; font-size: 14px; }
        td { font-size: 14px; }
        
        .supports-box {
          background-color: #E6F9FC;
          border: 1px solid #00D9FF;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .supports-title {
          color: #00D9FF;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .note {
          background-color: #FFF9F5;
          border-left: 4px solid #FF6B35;
          padding: 15px;
          font-size: 12px;
          color: #4B5563;
          margin-bottom: 40px;
        }
        
        .footer {
          border-top: 2px solid #0F3A7D;
          padding-top: 20px;
          text-align: center;
          color: #6B7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div style="display: flex; align-items: center; gap: 15px;">
            <img src="https://img2.elyerromenu.com/images/convoltaje/logo-c/img.webp" 
                 style="width:80px; height:80px; object-fit:contain; border-radius:50%;" 
                 alt="Convoltaje Logo"/>
            <div>
              <h1>FICHA TÉCNICA</h1>
              <h2>ConVoltaje — Energía Solar Confiable</h2>
            </div>
          </div>
          <div style="text-align: right; font-size: 12px; color: #6B7280;">
            <p>WhatsApp: <b>${OFFICIAL_WHATSAPP_CLEAN}</b></p>
            <p>convoltaje@gmail.com</p>
          </div>
        </div>

        <!-- Product Info -->
        <h1 class="product-title">${product.name}</h1>
        <div class="product-price">$${product.price} USD</div>
        <p class="product-desc">${product.description}</p>

        <!-- Supports -->
        ${product.supports ? `
        <div class="supports-box">
          <div class="supports-title">⚡ Soporta:</div>
          <p>${product.supports}</p>
        </div>
        ` : ''}

        <!-- Specs Table -->
        ${product.specs && product.specs.length > 0 ? `
        <table>
          <tr>
            <th>Especificaciones Técnicas y Materiales Incluidos</th>
          </tr>
          ${product.specs.map(spec => `
          <tr>
            <td>✓ ${spec}</td>
          </tr>
          `).join('')}
        </table>
        ` : ''}

        <!-- Important Note -->
        <div class="note">
          <strong>NOTA IMPORTANTE:</strong> El presente kit incluye los materiales detallados. En caso de que durante la instalación sea necesario utilizar materiales eléctricos adicionales debido a condiciones específicas del inmueble, recorrido del cableado o requerimientos técnicos de seguridad, estos serán informados al cliente y facturados por separado. — Atentamente ConVoltaje
        </div>

        <div class="footer">
          <p><strong>${product.specs?.find(s => s.startsWith("Garantía")) || "90 días de garantía en instalación"}. Pago solo al finalizar.</strong></p>
          <p style="margin-top: 10px;">Generado el ${new Date().toLocaleDateString("es-ES")}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const options: any = {
      margin: 0,
      filename: `Ficha-${product.slug || product.id}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: false, logging: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };

    return new Promise((resolve, reject) => {
      html2pdf()
        .set(options)
        .from(htmlContent)
        .toPdf()
        .output("blob")
        .then((blob: Blob) => resolve(blob))
        .catch(reject);
    });
  } catch (error) {
    console.warn("html2pdf failed or not available, using HTML fallback", error);
    return new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  }
}
