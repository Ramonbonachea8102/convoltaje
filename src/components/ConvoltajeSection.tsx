import { useState, useRef, useEffect } from "react";
import { CONVOLTAJE_PRODUCTS, WHATSAPP_NUMBERS, Product } from "@/lib/products";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Calculator, Download, X, Search, Store, Percent, Wrench, CheckCircle, Calendar as CalendarIcon, Eye, ArrowUpDown } from "lucide-react";
import { generateKitComparisonPDF } from "@/lib/pdf-comparison-generator";
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

  // Estados del Mockup 2 (Tienda Mercado Cubano)
  const [activeTab, setActiveTab] = useState<'tienda' | 'ofertas' | 'servicios' | 'resenas' | 'instalar'>('tienda');
  const [sortOption, setSortOption] = useState<'mas_visitados' | 'precio_menor' | 'precio_mayor'>('mas_visitados');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (onRef) {
      onRef(sectionRef.current);
    }
  }, [onRef]);

  const handleWhatsappClick = (product: Product) => {
    const message = `Hola, me interesa el producto: *${product.name}* - $${product.price} USD. ¿Puedes darme más información?`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, "")}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleToggleCompare = (product: Product) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(product.id)) {
        return prev.filter((id) => id !== product.id);
      }
      if (prev.length >= 3) {
        toast.error("Máximo 3 kits para comparar en PDF. Desmarca uno primero.");
        return prev;
      }
      return [...prev, product.id];
    });
  };

  const handleDownloadComparisonPdf = async () => {
    const selectedProducts = CONVOLTAJE_PRODUCTS.filter((p) => selectedCompareIds.includes(p.id));
    if (selectedProducts.length === 0) return;

    try {
      setIsGeneratingPdf(true);
      toast.info("📄 Generando PDF comparativo...");
      const blob = await generateKitComparisonPDF(selectedProducts);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Comparativa-Kits-Convoltaje.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("✅ PDF comparativo descargado exitosamente.");
    } catch (err) {
      console.error("Error al generar PDF comparativo:", err);
      toast.error("Error al generar el PDF comparativo.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Filtrado y Ordenación de Productos
  const filteredProducts = CONVOLTAJE_PRODUCTS.filter((p) => {
    const matchesTab = activeTab === 'tienda' ? true
      : activeTab === 'ofertas' ? (p.discount || p.originalPrice)
      : true;
    const matchesSearch = searchQuery.trim() === '' ? true
      : p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  }).sort((a, b) => {
    if (sortOption === 'precio_menor') return a.price - b.price;
    if (sortOption === 'precio_mayor') return b.price - a.price;
    // Default: 'mas_visitados' (populares primero)
    return (b.popular ? 1 : 0) - (a.popular ? 1 : 0);
  });

  return (
    <section
      id="catalogo"
      ref={sectionRef}
      className="py-8 lg:py-16 bg-slate-900 text-white scroll-mt-20 font-sans"
    >
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* ── 1. Hero Banner sobre la Tienda (Mockup 2) ─────────────────────────────────── */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 bg-slate-950 border border-slate-800">
          {/* Fondo Imagen del Equipo con Overlay Gradiente Lindo */}
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src="/Imagen_equipo-landingpage.jpg"
              alt="Equipo de trabajo Convoltaje"
              className="w-full h-full object-cover opacity-75 object-center"
            />
            {/* Overlay gradiente horizontal que oscurece solo a la izquierda para el texto y deja clara la imagen a la derecha */}
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

        {/* ── 2. Navbar de Píldoras (Mockup 2) ─────────────────────────────────── */}
        <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 mb-6 shadow-lg flex items-center justify-between overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('tienda')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'tienda'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Store size={16} /> Tienda
          </button>

          <button
            onClick={() => setActiveTab('ofertas')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'ofertas'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Percent size={16} /> Ofertas
          </button>

          <button
            onClick={() => setActiveTab('servicios')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'servicios'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wrench size={16} /> Servicios
          </button>

          <button
            onClick={() => setActiveTab('resenas')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === 'resenas'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
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

        {/* ── 3. Filter Bar & Buscador (Mockup 2) ─────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          {/* Ordenación Text & Dropdown */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 w-full md:w-auto">
            <div className="flex items-center gap-1.5 font-bold text-orange-400">
              <Eye size={14} />
              <span>Mostrando artículos por orden de más visitados</span>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              <ArrowUpDown size={13} className="text-slate-400" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="mas_visitados" className="bg-slate-900 text-white">Más visitados</option>
                <option value="precio_menor" className="bg-slate-900 text-white">Precio: Menor a Mayor</option>
                <option value="precio_mayor" className="bg-slate-900 text-white">Precio: Mayor a Menor</option>
              </select>
            </div>
          </div>

          {/* Input de Búsqueda Rápida */}
          <div className="relative w-full md:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto rápidamente"
              className="w-full bg-slate-900 text-white text-xs placeholder-slate-500 pl-4 pr-10 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-600 text-white p-1.5 rounded-lg">
              <Search size={14} />
            </div>
          </div>
        </div>

        {/* ── 4. Product Grid Mercado Cubano (2x4 Responsivo) ─────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              whatsappNumber={WHATSAPP_NUMBERS.convoltaje}
              onWhatsappClick={handleWhatsappClick}
              onViewDetails={onViewDetails}
              isComparing={selectedCompareIds.includes(product.id)}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>

        {/* ── 5. Footer con Paginación de 7 Dots (Mockup 2) ─────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2.5 py-6">
          {[1, 2, 3, 4, 5, 6, 7].map((dotIndex) => (
            <button
              key={dotIndex}
              onClick={() => setCurrentPage(dotIndex)}
              className={`h-3 rounded-full transition-all duration-300 ${
                dotIndex === currentPage
                  ? "w-8 bg-orange-500 shadow-md shadow-orange-500/50"
                  : "w-3 bg-slate-700 hover:bg-slate-500"
              }`}
              aria-label={`Página ${dotIndex}`}
            />
          ))}
        </div>

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

      {/* Floating Bar para Descargar Comparativa PDF (Mobile-First) */}
      {selectedCompareIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#0F3A7D]/95 text-white border border-[#00D9FF]/40 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 max-w-[95vw] sm:max-w-md w-full justify-between animate-fade-in">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-[#00D9FF]">
              Comparando {selectedCompareIds.length} kit{selectedCompareIds.length > 1 ? "s" : ""}
            </span>
            <span className="text-[10px] text-white/70 truncate">
              {CONVOLTAJE_PRODUCTS.filter((p) => selectedCompareIds.includes(p.id)).map((p) => p.name).join(" vs ")}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              disabled={isGeneratingPdf || selectedCompareIds.length < 2}
              onClick={handleDownloadComparisonPdf}
              className="bg-[#00D9FF] hover:bg-[#00D9FF]/90 text-black text-xs font-bold px-3 py-1.5 h-auto rounded-xl shadow-md flex items-center gap-1.5"
            >
              <Download size={14} />
              <span>{isGeneratingPdf ? "Generando..." : selectedCompareIds.length < 2 ? "Selecciona 2 o 3" : "Descargar PDF"}</span>
            </Button>

            <button
              onClick={() => setSelectedCompareIds([])}
              className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white"
              title="Limpiar selección"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

