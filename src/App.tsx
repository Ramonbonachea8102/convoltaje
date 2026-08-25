import { useState, useEffect } from "react";
import Header from "./components/Header";
import HeroSection from "./components/HeroSection";
import ConvoltajeSection from "./components/ConvoltajeSection";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";
import FloatingNav from "./components/FloatingNav";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import SolarCalculator from "./components/calculator/SolarCalculator";
import { ReviewSection } from "./components/ReviewSection";
import ProductDetailPage from "./components/ProductDetailPage";
import { CONVOLTAJE_PRODUCTS, TINTAFLASH_PRODUCTS, WHATSAPP_NUMBERS } from "./lib/products";

import SplashWelcome from "./components/SplashWelcome";
import { Toaster } from "sonner";
import { Switch, Route } from "wouter";
import DashboardMain from "./components/dashboard/DashboardMain";

function App() {
  const [selectedBrand, setSelectedBrand] = useState<"none" | "convoltaje" | "tintaflash">("none");
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);

  // Sync scrolling to top when entering product detail page
  useEffect(() => {
    if (selectedProductSlug) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedProductSlug]);

  const handleExploreClick = () => {
    const catalogSection = document.getElementById("catalogo");
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCalculatorClick = () => {
    const calculatorSection = document.getElementById("calculadora");
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleWhatsappClick = (product: any) => {
    const message = `Hola, me interesa el producto: *${product.name}* - $${product.price} USD. ¿Puedes darme más información?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const allProducts = [...CONVOLTAJE_PRODUCTS, ...TINTAFLASH_PRODUCTS];
  const selectedProduct = selectedProductSlug ? allProducts.find(p => p.slug === selectedProductSlug) : null;

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Switch>
        {/* Rutas del Dashboard / Admin */}
        <Route path="/admin" component={DashboardMain} />
        <Route path="/admin/:rest*" component={DashboardMain} />
        
        {/* Ruta principal de la Landing Page */}
        <Route>
          {selectedBrand === "none" ? (
            <SplashWelcome onSelectBrand={setSelectedBrand} />
          ) : selectedBrand === "tintaflash" ? (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
              <h1 className="text-4xl font-display font-bold text-primary mb-4">Tinta Flash</h1>
              <p className="text-lg text-muted-foreground mb-8 text-center max-w-md">Próximamente: Todos nuestros servicios de personalización e impresión.</p>
              <button 
                onClick={() => setSelectedBrand("none")}
                className="text-primary hover:underline"
              >
                Volver al inicio
              </button>
            </div>
          ) : selectedProduct ? (
            <ProductDetailPage 
              product={selectedProduct} 
              onClose={() => {
                setSelectedProductSlug(null);
                setTimeout(() => {
                  const catalogSection = document.getElementById('catalogo') || document.querySelector('[data-section="catalogo"]');
                  if (catalogSection) {
                    catalogSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 100);
              }}
              onWhatsappClick={handleWhatsappClick}
              onCalculatorClick={() => {
                setSelectedProductSlug(null);
                setTimeout(() => {
                  handleCalculatorClick();
                }, 300);
              }}
            />
          ) : (
            <>
              <Header onResetBrand={() => setSelectedBrand("none")} />
              <HeroSection onExploreClick={handleExploreClick} onCalculatorClick={handleCalculatorClick} />
              <ConvoltajeSection 
                onCalculatorClick={handleCalculatorClick}
                onViewDetails={(product) => setSelectedProductSlug(product.slug)}
              />
              <div id="calculadora" className="container mx-auto px-4 py-16 scroll-mt-20">
                <SolarCalculator />
              </div>
              <ReviewSection />
              <FAQSection />
              <Footer />
              <FloatingNav />
              <FloatingWhatsApp />
            </>
          )}
        </Route>
      </Switch>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
