import { useState, useRef, useEffect } from "react";
import { CONVOLTAJE_PRODUCTS, COMPLEMENTARY_SERVICES, SERVICES_FLYER_URL, WHATSAPP_NUMBERS, Product, ComplementaryService } from "@/lib/products";
import { Button } from "@/components/ui/button";
import { Calculator, Download, Search, Store, Percent, Wrench, CheckCircle, Calendar as CalendarIcon, Eye, ArrowUpDown, Layers, ShieldCheck, Send, Star, MessageSquare } from "lucide-react";
import { generateKitComparisonPDF } from "@/lib/pdf-comparison-generator";
import { useKitsStore, SolarKit } from "@/hooks/useKitsStore";
import { useOffersStore } from "@/hooks/useOffersStore";
import { useServicesStore } from "@/hooks/useServicesStore";
import { PublicKitCard } from "@/components/PublicKitCard";
import { PublicOfferCard } from "@/components/PublicOfferCard";
import { KitWorkOrderModal } from "@/components/KitWorkOrderModal";
import { toast } from "sonner";

interface ConvoltajeSectionProps {
  onRef?: (ref: HTMLElement | null) => void;
  onCalculatorClick?: () => void;
  onViewDetails?: (product: Product) => void;
}

export default function ConvoltajeSection({ onRef, onCalculatorClick, onViewDetails }: ConvoltajeSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Dynamic Kits Store
  const { kits, fetchKits } = useKitsStore();
  const [selectedKitForOrder, setSelectedKitForOrder] = useState<SolarKit | null>(null);

  // Dynamic Offers Store (Supabase + fallback estático seguro)
  const { publicOffers, isLoadingPublic: isLoadingOffers, fetchPublicOffers } = useOffersStore();

  // Dynamic Services Store (Supabase + fallback estático seguro de 6 servicios)
  const { publicServices, fetchPublicServices } = useServicesStore();

  // Categorías oficiales requeridas: Todos, Residencial, Comercial, Personalizado
  const [selectedCategory, setSelectedCategory] = useState<"Todos" | "Residencial" | "Comercial" | "Personalizado">("Todos");

  // Tabs superiores de navegación
  const [activeTab, setActiveTab] = useState<"kits" | "tienda" | "ofertas" | "servicios" | "resenas" | "instalar">("kits");
  const [sortOption, setSortOption] = useState<"recomendados" | "precio_menor" | "precio_mayor">("recomendados");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchKits();
    fetchPublicOffers();
    fetchPublicServices();
  }, [fetchKits, fetchPublicOffers, fetchPublicServices]);

  useEffect(() => {
    if (onRef) {
      onRef(sectionRef.current);
    }
  }, [onRef]);

  const handleReviewsTabClick = () => {
    setActiveTab("resenas");
    const reviewSec = document.getElementById("resenas");
    if (reviewSec) {
      reviewSec.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleWhatsappServiceClick = (service: { title: string; price: number; billingPeriod?: string | null }) => {
    const cleanNumber = WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, "");
    const periodText = service.billingPeriod ? `/${service.billingPeriod}` : "";
    const message = `Hola ConVoltaje 👋 Me interesa contratar el servicio de *${service.title}* ($${service.price} USD${periodText}). ¿Cómo podemos coordinarlo?`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, "_blank");
  };

  // Filtrado de Kits Solares (cuando no se está en pestaña de ofertas dinámicas)
  const filteredKits = kits.filter((k) => {
    const matchesCategory =
      selectedCategory === "Todos" || k.category.toLowerCase() === selectedCategory.toLowerCase();

    const query = searchQuery.trim().toLowerCase();
    if (!query) return matchesCategory;

    const matchesName = k.name.toLowerCase().includes(query);
    const matchesDesc = k.description?.toLowerCase().includes(query);
    const matchesComp = k.componentsSummary?.some((c) => c.toLowerCase().includes(query));
    return matchesCategory && (matchesName || matchesDesc || matchesComp);
  }).sort((a, b) => {
    if (sortOption === "precio_menor") return a.totalPrice - b.totalPrice;
    if (sortOption === "precio_mayor") return b.totalPrice - a.totalPrice;
    return 0;
  });

  // Filtrado de Ofertas Especiales (Supabase + fallback)
  const filteredOffers = publicOffers.filter((o) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const matchesTitle = o.title.toLowerCase().includes(query);
    const matchesDesc = o.description ? o.description.toLowerCase().includes(query) : false;
    return matchesTitle || matchesDesc;
  }).sort((a, b) => {
    if (sortOption === "precio_menor") return a.offerPrice - b.offerPrice;
    if (sortOption === "precio_mayor") return b.offerPrice - a.offerPrice;
    return a.sortOrder - b.sortOrder;
  });

  return (
    <section
      id="catalogo"
      ref={sectionRef}
      className="py-8 lg:py-14 bg-slate-950 text-white scroll-mt-20 font-sans"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* ── 1. Hero Banner: Equipo y +900 Familias ── */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 bg-slate-950 border border-slate-800">
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src="/Imagen_equipo-landingpage.jpg"
              alt="Equipo de trabajo Convoltaje"
              className="w-full h-full object-cover opacity-75 object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/30 md:to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          </div>

          <div className="relative z-10 p-6 md:p-10 lg:p-12 flex flex-col items-start justify-center max-w-3xl">
            <span className="text-cyan-400 font-extrabold text-xs md:text-sm tracking-wider uppercase mb-1.5 block drop-shadow-md">
              Equipo de trabajo Convoltaje
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-orange-500 tracking-tight leading-none mb-3 drop-shadow-lg">
              +900 Familias
            </h1>
            <h2 className="text-xl md:text-3xl font-extrabold text-orange-400 mb-4 drop-shadow-lg">
              complacidas por toda <span className="text-white">Cuba</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/75 p-4 rounded-2xl border border-white/15 backdrop-blur-md max-w-xl shadow-lg">
              Con Voltaje surgió por la necesidad urgente de hacer llegar la luz a nuestros amigos, contactos, familiares y clientes que con el tiempo se volvieron todos, parte de nosotros.
            </p>
          </div>
        </div>

        {/* ── 2. Pestañas Principales de Navegación del Catálogo Solar ── */}
        <div className="bg-slate-900/80 p-2 rounded-2xl border border-slate-800 mb-6 shadow-lg flex items-center justify-between overflow-x-auto gap-2 scrollbar-none backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("kits")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "kits"
                ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30 font-black"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Layers size={16} /> Kits Solares ({kits.length})
          </button>

          <button
            onClick={() => setActiveTab("tienda")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "tienda"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Store size={16} /> Todos los Equipos
          </button>

          <button
            onClick={() => setActiveTab("ofertas")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "ofertas"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Percent size={16} /> Ofertas Especiales
          </button>

          <button
            onClick={() => setActiveTab("servicios")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "servicios"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Wrench size={16} /> Servicios ({publicServices.length})
          </button>

          <button
            onClick={handleReviewsTabClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === "resenas"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <CheckCircle size={16} /> Reseñas
          </button>

          <button
            onClick={onCalculatorClick}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-slate-400 hover:text-white hover:bg-slate-800 transition-all whitespace-nowrap"
          >
            <CalendarIcon size={16} /> Instalar
          </button>
        </div>

        {/* ── 3. Categorías Oficiales: Todos | Residencial | Comercial | Personalizado ── */}
        {activeTab !== "servicios" && activeTab !== "resenas" && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Categoría:</span>
            {(["Todos", "Residencial", "Comercial", "Personalizado"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* ── 4. Filtro de Ordenación & Buscador ── */}
        {activeTab !== "servicios" && activeTab !== "resenas" && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 w-full md:w-auto">
              <div className="flex items-center gap-1.5 font-bold text-orange-400">
                <Eye size={14} />
                <span>
                  {activeTab === "ofertas"
                    ? `Mostrando ${filteredOffers.length} ofertas especiales`
                    : `Mostrando ${filteredKits.length} kits disponibles`}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
                <ArrowUpDown size={13} className="text-slate-400" />
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="recomendados" className="bg-slate-900 text-white">Recomendados</option>
                  <option value="precio_menor" className="bg-slate-900 text-white">Precio: Menor a Mayor</option>
                  <option value="precio_mayor" className="bg-slate-900 text-white">Precio: Mayor a Menor</option>
                </select>
              </div>
            </div>

            {/* Buscador en tiempo real */}
            <div className="relative w-full md:w-72">
              <input
                type="text"
                placeholder="Buscar por kit, panel o inversor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/50 rounded-xl px-3.5 py-2 pl-9 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        )}

        {/* ── 5. Renderizado: Kits vs Servicios vs Reseñas vs Ofertas ── */}
        {activeTab === "servicios" ? (
          <div>
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <ShieldCheck size={20} className="text-cyan-400" />
                  Servicios Complementarios ConVoltaje
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Protege y cuida tu inversión con soporte técnico profesional en toda Cuba.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={SERVICES_FLYER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-cyan-400 text-xs font-bold border border-cyan-500/30 transition-all shadow-md"
                  title="Ver infografía oficial de tarifas"
                >
                  <Eye size={14} />
                  <span>Ver Infografía Oficial</span>
                </a>
                <span className="hidden sm:inline text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20">
                  Tarifas Oficiales
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {publicServices.map((serv) => (
                <div
                  key={serv.id}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-950 text-cyan-400 border border-cyan-400/20">
                        {serv.badgeText || "Servicio"}
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-orange-500">${serv.price}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">
                          USD{serv.billingPeriod ? `/${serv.billingPeriod}` : ""}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-base font-black text-white mb-2">{serv.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{serv.description}</p>
                  </div>

                  <button
                    onClick={() => handleWhatsappServiceClick(serv)}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
                  >
                    <Send size={14} />
                    <span>Solicitar Servicio</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === "resenas" ? (
          /* Renderizado de Vista Rápida de Reseñas para que la pestaña nunca esté vacía */
          <div className="mb-12 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>4.9 / 5 estrellas en satisfacción de clientes</span>
                </div>
                <h3 className="text-2xl font-black text-white">
                  Opiniones de Clientes ConVoltaje
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                  Revisa las experiencias de familias y negocios con nuestros kits solares e instalaciones en toda Cuba, o déjanos tu propia reseña.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => {
                    const sec = document.getElementById("resenas");
                    if (sec) sec.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 text-center"
                >
                  Ver Todas las Reseñas
                </button>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, "")}?text=${encodeURIComponent("Hola ConVoltaje 👋 Quiero compartir mi opinión sobre el servicio que recibí.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Enviar testimonio</span>
                </a>
              </div>
            </div>
          </div>
        ) : activeTab === "ofertas" ? (
          /* Renderizado de Ofertas Especiales (Supabase + fallback estático seguro) */
          filteredOffers.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800 p-8 my-8">
              <p className="text-slate-400 text-sm">No se encontraron ofertas especiales activas en este momento.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredOffers.map((offer) => (
                <PublicOfferCard
                  key={offer.id}
                  offer={offer}
                />
              ))}
            </div>
          )
        ) : (
          /* Renderizado de Kits Solares */
          filteredKits.length === 0 ? (
            <div className="text-center py-16 bg-slate-950/40 rounded-3xl border border-dashed border-slate-800 p-8 my-8">
              <p className="text-slate-400 text-sm">No se encontraron kits solares con los filtros seleccionados.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("Todos");
                }}
                className="mt-3 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold rounded-xl"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredKits.map((kit) => (
                <PublicKitCard
                  key={kit.id}
                  kit={kit}
                  onSelectKit={(k) => setSelectedKitForOrder(k)}
                />
              ))}
            </div>
          )
        )}

        {/* Modal de Generación de Orden de Trabajo y Cotización */}
        <KitWorkOrderModal
          kit={selectedKitForOrder}
          isOpen={Boolean(selectedKitForOrder)}
          onClose={() => setSelectedKitForOrder(null)}
        />

        {/* CTA Section (Calculadora Solar) */}
        <div className="mt-12 bg-gradient-to-r from-slate-950 to-blue-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-black text-white mb-2">¿Necesitas una solución personalizada?</h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl">
              Usa nuestra Calculadora Solar Inteligente y descubre en minutos qué sistema se ajusta a tus necesidades.
            </p>
          </div>
          <Button
            onClick={onCalculatorClick}
            className="bg-orange-600 hover:bg-orange-700 text-white font-black text-sm px-6 py-4 h-auto rounded-2xl shadow-xl uppercase tracking-wider shrink-0"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Usar Calculadora
          </Button>
        </div>

      </div>
    </section>
  );
}
