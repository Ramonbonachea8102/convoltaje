import { useState, useEffect } from "react";
import Header from "./components/Header";
import ConvoltajeSection from "./components/ConvoltajeSection";
import FAQSection from "./components/FAQSection";
import Footer from "./components/Footer";
import FloatingNav from "./components/FloatingNav";
import FloatingWhatsApp from "./components/FloatingWhatsApp";
import SolarCalculator from "./components/calculator/SolarCalculator";
import { ReviewSection } from "./components/ReviewSection";
import ProductDetailPage from "./components/ProductDetailPage";
import { CONVOLTAJE_PRODUCTS, WHATSAPP_NUMBERS } from "./lib/products";

import { Toaster } from "sonner";
import { Switch, Route } from "wouter";
import DashboardMain from "./components/dashboard/DashboardMain";
import { LeadRegistrationModal } from "./components/participation/LeadRegistrationModal";

function App() {
  // Entrada directa a Convoltaje: eliminado el splash que forzaba elegir entre Convoltaje y Tinta Flash
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [showRaffleModal, setShowRaffleModal] = useState(false);

  // Sync scrolling to top when entering product detail page
  useEffect(() => {
    if (selectedProductSlug) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [selectedProductSlug]);



  const handleCalculatorClick = () => {
    const calculatorSection = document.getElementById("calculadora");
    if (calculatorSection) {
      calculatorSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleWhatsappClick = (product: any) => {
    const message = `Hola ConVoltaje 👋 Me interesa el producto: *${product.name}* - $${product.price} USD. ¿Puedes darme más información técnica y disponibilidad?`;
    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, "");
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const selectedProduct = selectedProductSlug ? CONVOLTAJE_PRODUCTS.find(p => p.slug === selectedProductSlug) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white relative font-sans">
      <Switch>
        {/* Rutas privadas del Dashboard / CRM */}
        <Route path="/admin" component={DashboardMain} />
        <Route path="/admin/:rest*" component={DashboardMain} />
        <Route path="/dashboard" component={DashboardMain} />
        <Route path="/dashboard/:rest*" component={DashboardMain} />

        {/* Experiencia pública directa de ConVoltaje */}
        <Route>
          {selectedProduct ? (
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
              <Header 
                onOpenRaffle={() => setShowRaffleModal(true)}
              />
              <ConvoltajeSection 
                onCalculatorClick={handleCalculatorClick}
                onViewDetails={(product) => setSelectedProductSlug(product.slug)}
              />
              <div id="calculadora" className="scroll-mt-20">
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

      <LeadRegistrationModal 
        isOpen={showRaffleModal}
        onClose={() => setShowRaffleModal(false)}
        onNavigateToCalculator={handleCalculatorClick}
      />
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
