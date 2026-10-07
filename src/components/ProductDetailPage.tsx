import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, Zap, MessageCircle, FileText, Camera } from "lucide-react";
import { Product } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { generateProductSheet } from "@/lib/pdf-generator";
import { SalesRepsModal } from "@/components/SalesRepsModal";

interface ProductDetailPageProps {
  product: Product;
  onClose: () => void;
  onWhatsappClick: (product: Product) => void;
  onCalculatorClick: () => void;
}

export default function ProductDetailPage({
  product,
  onClose,
  onWhatsappClick,
  onCalculatorClick,
}: ProductDetailPageProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  const [showSalesRepsModal, setShowSalesRepsModal] = useState(false);
  const validImages = (product.images || []).filter(Boolean) as string[];
  const images = validImages.length > 0 ? validImages : (product.image ? [product.image] : []);
  const hasImages = images.length > 0;
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleDownloadSheet = async () => {
    try {
      setIsGeneratingPdf(true);
      const blob = await generateProductSheet(product);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ficha-${product.slug || product.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading sheet:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto flex flex-col animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver al catálogo
        </Button>
      </header>

      <div className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Carousel */}
          <div className="flex flex-col gap-4">
            <div className="relative w-full h-[280px] lg:h-[500px] bg-slate-900 rounded-2xl overflow-hidden border border-border flex items-center justify-center">
              {hasImages && images[currentImageIndex] ? (
                <img
                  src={images[currentImageIndex]}
                  alt={`${product.name} - Imagen ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
                    <Camera size={32} className="opacity-80" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Imagen del producto pendiente</h4>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Estamos preparando el material fotográfico y de catálogo oficial para este sistema.
                  </p>
                </div>
              )}
              
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-all"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  
                  {/* Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? "bg-primary w-4" : "bg-primary/30"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.popular && (
                  <div className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-accent flex items-center gap-1 shadow-sm w-fit">
                    <Zap className="w-3 h-3" />
                    Popular
                  </div>
                )}
                {product.discount && (
                  <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-xs font-accent shadow-sm w-fit">
                    -{product.discount}%
                  </div>
                )}
              </div>
            </div>
            
            {hasMultipleImages && (
              <div className="flex gap-3 mt-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-[60px] h-[60px] rounded-md overflow-hidden border-2 transition-all ${
                      idx === currentImageIndex ? "border-primary ring-2 ring-primary/30" : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & CTA */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              {product.name}
            </h1>
            
            <p className="text-foreground text-lg mb-8">
              {product.description}
            </p>

            <div className="bg-muted/10 rounded-2xl p-6 border border-border mb-8">
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-primary">
                  ${product.price}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ${product.originalPrice}
                  </span>
                )}
                <span className="text-sm font-medium text-muted-foreground ml-1">USD</span>
              </div>

              {/* Bloques de disponibilidad y pago */}
              <div className="flex flex-col gap-3 mb-6">
                <div className={`px-4 py-3 rounded-lg text-sm flex items-center ${product.outOfStock ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20 font-medium' : 'bg-green-500/10 text-green-700 font-semibold border border-green-500/20'}`}>
                  {product.outOfStock ? "⚠️ Temporalmente agotado" : "✅ Disponible — instalación en 10-15 días"}
                </div>
                <div className="bg-muted/50 px-4 py-3 rounded-lg text-sm text-foreground font-medium border border-border">
                  💵 Efectivo USD al finalizar la instalación. Sin anticipos.
                </div>
                <Button 
                  variant="outline" 
                  className="w-full text-primary border-primary hover:bg-primary/5 font-accent font-semibold text-sm py-3 mt-1 shadow-sm"
                  onClick={() => setShowFinancingModal(true)}
                >
                  💳 ¿Quieres financiar tu compra?
                </Button>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setShowSalesRepsModal(true)}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-accent text-lg py-6"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Solicitar por WhatsApp
                </Button>
                
                {product.pdfUrl && product.hasTechnicalSheet !== false ? (
                  <div className="flex gap-2 w-full">
                    <a
                      href={product.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border text-sm font-semibold transition-colors"
                    >
                      <FileText className="w-4 h-4 mr-2 text-primary" />
                      Ver ficha técnica
                    </a>
                    <a
                      href={product.pdfUrl}
                      download
                      className="flex-1 inline-flex items-center justify-center py-3 px-4 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border text-sm font-semibold transition-colors"
                    >
                      📄 Descargar PDF
                    </a>
                  </div>
                ) : (
                  <div className="w-full text-center py-3 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-semibold flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Ficha técnica pendiente</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onCalculatorClick();
                  }}
                  className="w-full text-primary border-primary hover:bg-primary/5 font-accent text-base py-6 mt-2"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  ⚡ Calcular mi sistema solar
                </Button>
              </div>
            </div>

            {/* Supports */}
            {product.supports && (
              <div className="mb-8 bg-[#00D9FF]/10 text-[#00D9FF] rounded-xl p-4 border border-[#00D9FF]/20 flex items-start gap-3 shadow-sm">
                <Zap className="w-6 h-6 flex-shrink-0" />
                <p className="font-medium text-lg">
                  <strong className="mr-2">Soporta:</strong> 
                  {product.supports}
                </p>
              </div>
            )}

            {/* Specs */}
            {product.specs && product.specs.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#00D9FF]" />
                  Especificaciones Técnicas
                </h3>
                <ul className="space-y-3">
                  {product.specs.map((spec, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                      <div className="mt-1 bg-[#00D9FF]/10 p-1 rounded-full text-[#00D9FF]">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-foreground/80 flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Garantía y Pago:</strong> {product.specs?.find(s => s.startsWith("Garantía")) || "90 días de garantía en instalación"}. Pago solo al finalizar. Sin adelantos.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Footer Note - Calculator Callout */}
      <div className="bg-primary text-primary-foreground py-12 mt-auto">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h3 className="text-2xl font-bold mb-4 font-display">¿Tienes dudas sobre la capacidad?</h3>
          <p className="mb-6 text-primary-foreground/90">
            Usa nuestra Calculadora Solar interactiva para saber exactamente cuánta energía consume tu hogar y si este sistema es el adecuado para ti.
          </p>
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={onCalculatorClick}
            className="font-accent"
          >
            Probar Calculadora Solar
          </Button>
        </div>
      </div>

      {/* Financing Modal */}
      {showFinancingModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowFinancingModal(false)}>
          <div className="bg-background border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setShowFinancingModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4 font-display text-primary flex items-center gap-2">
              💳 Financiamiento
            </h3>
            <div className="space-y-4 text-foreground/80">
              <p>
                Estamos trabajando en la solución a esta inquietud. 
                Síguenos en nuestros canales oficiales para estar al tanto 
                de cómo vamos a darle solución a esta necesidad.
              </p>
              <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                <p>📘 <strong>Facebook:</strong> @convoltajecuba</p>
                <p>📸 <strong>Instagram:</strong> @convoltajecuba</p>
                <p>💬 <strong>Telegram:</strong> @convoltajecuba</p>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => setShowFinancingModal(false)}
              >
                Entendido
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <SalesRepsModal 
        isOpen={showSalesRepsModal} 
        onClose={() => setShowSalesRepsModal(false)} 
        productName={product.name}
      />
    </div>
  );
}
