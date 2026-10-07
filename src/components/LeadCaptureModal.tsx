import { useState } from "react";
import { X, CheckCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WHATSAPP_NUMBERS, OFFICIAL_WHATSAPP_NUMBER, OFFICIAL_WHATSAPP_CLEAN, CONVOLTAJE_PRODUCTS, type Product } from "@/lib/products";
import { EcoPowerKit } from "@/lib/calculator";
import { generateOfferPdf } from "@/lib/pdf-offer-generator";
import { useCrmStore } from "@/hooks/useCrmStore";
import { SalesRepsModal } from "./SalesRepsModal";

interface LeadCaptureModalProps {
  kit: EcoPowerKit;
  dailyConsumption: number;
  onClose: () => void;
}

type ModalStep = "form" | "confirmation";

export default function LeadCaptureModal({
  kit,
  dailyConsumption,
  onClose,
}: LeadCaptureModalProps) {
  const [step, setStep] = useState<ModalStep>("form");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    purchaseType: "unitaria" as "unitaria" | "mayorista",
    installationAddress: "",
    installationDate: "",
    salesAgent: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfExtension, setPdfExtension] = useState<string>("pdf");
  const [showReps, setShowReps] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      alert("Por favor ingresa tu nombre");
      return false;
    }
    if (!formData.phone.trim()) {
      alert("Por favor ingresa tu teléfono");
      return false;
    }
    if (!formData.email.trim()) {
      alert("Por favor ingresa tu email");
      return false;
    }
    if (!formData.installationAddress.trim()) {
      alert("Por favor ingresa la dirección de instalación");
      return false;
    }
    // Basic phone validation
    if (!/^\d{8,}$/.test(formData.phone.replace(/\D/g, ""))) {
      alert("Por favor ingresa un teléfono válido");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // 1. Generar OT persistente única
      const otRef = `OT-${Math.floor(1000 + Math.random() * 9000)}`;
      const chosenAgent = formData.salesAgent || "Diana (Comercial Matanzas)";

      // 2. Persistir Lead en el CRM Pipeline (useCrmStore + localStorage)
      useCrmStore.getState().addDeal({
        name: formData.name,
        company: kit.name,
        phone: formData.phone,
        email: formData.email,
        value: kit.price,
        stage: 'Contacto',
        expectedDate: formData.installationDate || new Date().toISOString().split("T")[0],
        source: `${chosenAgent} — ${formData.installationAddress}`,
        otRef: otRef,
        salesAgent: chosenAgent,
        address: formData.installationAddress
      });

      // 3. Matchear o construir objeto Product
      const catalogProduct: Product = CONVOLTAJE_PRODUCTS.find(p => p.name.toLowerCase().includes(kit.name.toLowerCase())) || {
        id: kit.id || 'kit-custom',
        name: kit.name,
        description: kit.description,
        price: kit.price,
        category: 'Residencial',
        slug: 'kit-custom',
        image: '/images/solucionapagon.jpg',
        images: ['/images/solucionapagon.jpg'],
        specs: kit.features,
        hasTechnicalSheet: false,
        pdfUrl: null
      };

      // 4. Generar PDF unificado institucional
      await generateOfferPdf(
        catalogProduct,
        {
          name: formData.name,
          phone: formData.phone,
          address: formData.installationAddress,
          date: new Date().toLocaleDateString('es-ES'),
          reference: otRef,
        },
        false,
        kit.price,
        chosenAgent,
        OFFICIAL_WHATSAPP_NUMBER
      );

      // 5. Mostrar confirmación
      setStep("confirmation");
    } catch (error) {
      console.error("Error al procesar la solicitud:", error);
      alert("Error al generar la prefactura. Por favor intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between">
          <h2 className="font-display text-xl text-foreground">
            {step === "form" ? "Solicitar Sistema" : "¡Solicitud Enviada!"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {step === "form" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Kit Summary */}
              <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground mb-1">
                  Sistema Seleccionado:
                </p>
                <p className="font-accent text-lg text-primary">
                  {kit.name}
                </p>
                <p className="text-sm text-secondary font-accent mt-2">
                  ${kit.price} USD
                </p>
              </div>

              {/* Form Fields */}
              <div>
                <label className="block text-sm font-accent text-foreground mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-accent text-foreground mb-2">
                  Teléfono (WhatsApp) *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={OFFICIAL_WHATSAPP_CLEAN}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-accent text-foreground mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-accent text-foreground mb-2">
                  Dirección de instalación *
                </label>
                <input
                  type="text"
                  name="installationAddress"
                  value={formData.installationAddress}
                  onChange={handleInputChange}
                  placeholder="Calle 123, Habana..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-accent text-foreground mb-2">
                  Fecha preferida de instalación
                </label>
                <input
                  type="date"
                  name="installationDate"
                  value={formData.installationDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-accent text-foreground mb-2">
                  Nombre del comercial (opcional)
                </label>
                <input
                  type="text"
                  name="salesAgent"
                  value={formData.salesAgent}
                  onChange={handleInputChange}
                  placeholder="Ninguno / Me contacté por la web"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                />
              </div>

              <div>
                <label className="block text-sm font-accent text-foreground mb-2">
                  Tipo de Compra
                </label>
                <select
                  name="purchaseType"
                  value={formData.purchaseType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
                >
                  <option value="unitaria">Compra Unitaria</option>
                  <option value="mayorista">Compra Mayorista</option>
                </select>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-accent py-3"
              >
                {isSubmitting ? "Procesando..." : "Enviar Solicitud"}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Al enviar, recibirás un PDF con la prefactura y un comercial se
                contactará contigo por WhatsApp.
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-secondary mx-auto" />
              <h3 className="font-display text-2xl text-foreground">
                ¡Solicitud Enviada!
              </h3>
              <p className="text-muted-foreground">
                Tu oferta ha sido descargada. Por favor, selecciona una comercial para continuar con tu compra por WhatsApp.
              </p>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 my-4">
                <p className="text-sm font-accent text-primary mb-2">
                  Próximos pasos:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left">
                  <li>✓ Revisa tu oferta descargada</li>
                  <li>✓ Selecciona tu asesora comercial</li>
                  <li>✓ Confirma detalles con nuestro comercial</li>
                  <li>✓ Procede con tu compra</li>
                </ul>
              </div>

              {pdfUrl && (
                <Button
                  onClick={() => window.open(pdfUrl, "_blank")}
                  variant="outline"
                  className="w-full font-accent py-3 mb-2"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Abrir Prefactura ({pdfExtension.toUpperCase()})
                </Button>
              )}

              <Button
                onClick={() => setShowReps(true)}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-accent py-3 mb-2"
              >
                Elegir Asesora Comercial
              </Button>

              <Button
                onClick={onClose}
                variant="outline"
                className="w-full font-accent py-3"
              >
                Cerrar
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      <SalesRepsModal 
        isOpen={showReps} 
        onClose={() => {
          setShowReps(false);
          onClose(); // Cerrar todo el modal
        }} 
        customMessage={`Hola {name}, he realizado el cálculo de mi sistema solar en su página web. Me interesa el sistema: *${kit.name}* - $${kit.price.toLocaleString()} USD. Mi consumo diario estimado es de ${dailyConsumption.toFixed(2)} kWh. Mi nombre es ${formData.name}. Ya descargué mi oferta, ¿me ayudas a concretar mi compra?`}
      />
    </div>
  );
}
