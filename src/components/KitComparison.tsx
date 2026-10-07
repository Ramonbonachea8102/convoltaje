import { ArrowLeft, Check, MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/products";
import { useState } from "react";
import { SalesRepsModal } from "@/components/SalesRepsModal";

interface KitComparisonProps {
  products: Product[];
  onBack: () => void;
  onViewDetails: (product: Product) => void;
  onWhatsappClick: (product: Product) => void;
}

export default function KitComparison({
  products,
  onBack,
  onViewDetails,
  onWhatsappClick,
}: KitComparisonProps) {
  const [showSalesRepsModal, setShowSalesRepsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleWhatsappClick = (product: Product) => {
    setSelectedProduct(product);
    setShowSalesRepsModal(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground font-accent pl-0"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al catálogo
          </Button>
          <div className="font-display text-lg text-primary hidden sm:block">
            Comparando {products.length} kits
          </div>
          <div className="w-24 sm:hidden"></div> {/* Spacer for centering in mobile if needed, or just let it flex */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="font-display text-2xl text-primary mb-8 sm:hidden text-center">
          Comparando {products.length} kits
        </h1>

        {/* Comparison Grid */}
        <div className="flex overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar lg:grid lg:grid-cols-3 gap-6 lg:gap-8 lg:overflow-visible lg:pb-0">
          {products.map((product) => {
            const currentImage = product.images?.[0] || product.image || undefined;
            
            return (
              <div 
                key={product.id} 
                className="snap-center shrink-0 w-[85vw] sm:w-[350px] lg:w-auto flex flex-col bg-card border border-border rounded-xl shadow-sm overflow-hidden"
              >
                {/* Product Image */}
                <div className="relative aspect-video bg-muted/20 flex items-center justify-center p-4">
                  {currentImage ? (
                    <img
                      src={currentImage}
                      alt={product.name}
                      className="w-full h-full object-contain drop-shadow-lg"
                    />
                  ) : (
                    <div className="text-muted-foreground text-xs font-semibold">
                      Imagen pendiente
                    </div>
                  )}
                  {product.discount && (
                    <div className="absolute top-4 right-4 bg-secondary text-secondary-foreground font-bold font-accent px-3 py-1 rounded-full text-sm shadow-lg">
                      -{product.discount}% OFF
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-6 flex flex-col flex-1">
                  <h3 className="font-display text-2xl text-primary mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-end gap-3 mb-6">
                    <span className="font-display text-3xl text-secondary">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-muted-foreground line-through mb-1">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Supports field */}
                  {product.supports && (
                    <div className="bg-[#E6F9FC] border border-[#00D9FF]/30 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 text-[#00D9FF] font-bold mb-2">
                        <Zap className="w-4 h-4 fill-current" />
                        <span className="uppercase text-xs tracking-wider">Soporta</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 leading-relaxed">
                        {product.supports}
                      </p>
                    </div>
                  )}

                  {/* Specs */}
                  <div className="flex-1">
                    <h4 className="font-accent font-semibold text-foreground mb-4">
                      Especificaciones:
                    </h4>
                    <ul className="space-y-3 mb-8">
                      {product.specs?.map((spec, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground leading-relaxed">
                            {spec}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-border">
                    <Button
                      onClick={() => handleWhatsappClick(product)}
                      className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-accent py-6 text-base"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Solicitar por WhatsApp
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => onViewDetails(product)}
                      className="w-full font-accent border-primary text-primary hover:bg-primary/5 py-6"
                    >
                      Ver detalles completos
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <SalesRepsModal 
        isOpen={showSalesRepsModal} 
        onClose={() => setShowSalesRepsModal(false)} 
        productName={selectedProduct?.name}
      />
    </div>
  );
}
