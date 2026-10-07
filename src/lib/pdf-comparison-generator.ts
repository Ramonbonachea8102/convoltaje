import { Product, OFFICIAL_WHATSAPP_NUMBER } from "@/lib/products";

export async function generateKitComparisonPDF(products: Product[]): Promise<Blob> {
  if (products.length === 0) {
    throw new Error("No hay productos seleccionados para comparar.");
  }

  const dateStr = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const columnsHtml = products.map((p) => `
    <div class="kit-card">
      <div class="kit-header">
        <h3 class="kit-title">${p.name}</h3>
        <div class="kit-price">$${p.price} <span class="usd">USD</span></div>
        ${p.originalPrice ? `<div class="kit-original-price">Antes: $${p.originalPrice} USD</div>` : ""}
        ${p.discount ? `<div class="kit-badge">-${p.discount}% OFF</div>` : ""}
      </div>
      
      <div class="kit-body">
        <div class="section-title">⚡ Equipos Soportados</div>
        <p class="supports-text">${p.supports || "Equipos básicos de hogar (Luces, TV, Nevera)"}</p>

        <div class="section-title">📋 Especificaciones Clave</div>
        <ul class="specs-list">
          ${(p.specs || [p.description])
            .slice(0, 7)
            .map((s) => `<li>✓ ${s}</li>`)
            .join("")}
        </ul>

        <div class="section-title">🛡️ Garantía Real</div>
        <p class="warranty-text">
          ${p.specs?.find((s) => s.startsWith("Garantía")) || "3 meses de garantía real en equipos e instalación."}
        </p>
      </div>
    </div>
  `).join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #0F172A;
          background: #ffffff;
          padding: 30px 40px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-b: 3px solid #0F3A7D;
          padding-bottom: 16px;
          margin-bottom: 24px;
        }
        .brand-title {
          font-size: 24px;
          font-weight: 800;
          color: #0F3A7D;
          letter-spacing: -0.5px;
        }
        .brand-sub {
          font-size: 13px;
          color: #00D9FF;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .meta-info {
          text-align: right;
          font-size: 11px;
          color: #64748B;
        }
        .doc-title {
          font-size: 18px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 4px;
        }
        .comparison-grid {
          display: flex;
          gap: 16px;
          justify-content: space-between;
        }
        .kit-card {
          flex: 1;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          overflow: hidden;
          background: #F8FAFC;
        }
        .kit-header {
          background: #0F3A7D;
          color: #ffffff;
          padding: 16px;
          text-align: center;
          position: relative;
        }
        .kit-title {
          font-size: 15px;
          font-weight: 700;
          margin-bottom: 6px;
          line-height: 1.2;
        }
        .kit-price {
          font-size: 24px;
          font-weight: 800;
          color: #00D9FF;
        }
        .kit-price .usd {
          font-size: 11px;
          color: #ffffff;
          font-weight: 400;
        }
        .kit-original-price {
          font-size: 10px;
          color: #94A3B8;
          text-decoration: line-through;
          margin-top: 2px;
        }
        .kit-badge {
          display: inline-block;
          background: #FF6B35;
          color: #ffffff;
          font-size: 9px;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 10px;
          margin-top: 6px;
        }
        .kit-body {
          padding: 14px;
        }
        .section-title {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          color: #0F3A7D;
          letter-spacing: 0.5px;
          margin-top: 10px;
          margin-bottom: 4px;
          border-bottom: 1px solid #CBD5E1;
          padding-bottom: 2px;
        }
        .supports-text {
          font-size: 11px;
          color: #334155;
          line-height: 1.3;
          font-weight: 600;
        }
        .specs-list {
          list-style: none;
          font-size: 10px;
          color: #475569;
          line-height: 1.4;
        }
        .specs-list li {
          margin-bottom: 3px;
        }
        .warranty-text {
          font-size: 10px;
          color: #16A34A;
          font-weight: 700;
        }
        .footer {
          margin-top: 24px;
          border-t: 1px solid #E2E8F0;
          padding-top: 12px;
          text-align: center;
          font-size: 10px;
          color: #64748B;
        }
        .footer strong {
          color: #0F3A7D;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-title">☀️ Convoltaje</div>
          <div class="brand-sub">Sistemas de Energía Solar & PowerStations — Cuba</div>
        </div>
        <div class="meta-info">
          <div class="doc-title">Tabla Comparativa de Kits</div>
          <div>WhatsApp: ${OFFICIAL_WHATSAPP_NUMBER}</div>
          <div>Fecha: ${dateStr}</div>
        </div>
      </div>

      <div class="comparison-grid">
        ${columnsHtml}
      </div>

      <div class="footer">
        <p><strong>Convoltaje Cuba:</strong> Instalación profesional incluida en todos los kits solares. Sin pagos por adelantado — se abona una vez instalado y funcionando al 100%.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    const options: any = {
      margin: 5,
      filename: `Comparativa-Kits-Convoltaje.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: products.length > 2 ? "landscape" : "portrait" },
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
    console.warn("html2pdf fallback used for comparison:", error);
    return new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  }
}
