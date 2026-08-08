import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/products";
import { useInventoryStore } from "@/hooks/useInventoryStore";

interface ProductCardProps {
  product: Product;
  whatsappNumber: string;
  onWhatsappClick: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  isComparing?: boolean;
  onToggleCompare?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onViewDetails,
  isComparing,
  onToggleCompare,
}: ProductCardProps) {
  const { items } = useInventoryStore();

  // Buscar stock real en useInventoryStore por nombre o código
  const invItem = items.find(
    (i) => i.name.toLowerCase().includes(product.name.toLowerCase()) || product.name.toLowerCase().includes(i.name.toLowerCase())
  );
  
  const currentStock = invItem ? invItem.stock : (product.outOfStock ? 0 : (product.popular ? 15 : 2));

  // Extraer marca sugerida o marca default
  const brandName = product.name.includes("SUNGOLDPOWER") ? "SUNGOLDPOWER"
    : product.name.includes("EG4") ? "EG4"
    : product.name.includes("Deye") ? "DEYE"
    : product.name.includes("EcoFlow") ? "ECOFLOW"
    : product.name.includes("Bluetti") ? "BLUETTI"
    : product.name.includes("Growatt") ? "GROWATT"
    : "SUNPOWER";

  const statusTag = product.discount ? "oferta!" : (product.popular ? "nuevo!" : "corre!");

  return (
    <div className="group relative bg-white border-2 border-orange-500/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full p-4 text-slate-800">
      
      {/* Header Top Section: Image & Badge */}
      <div className="relative w-full mb-3">
        {/* Status Badge Top Left */}
        <div className={`absolute -top-1 -left-1 z-20 font-black text-xs px-3 py-1 rounded-br-2xl rounded-tl-2xl shadow-md uppercase tracking-wider text-white ${
          statusTag === 'nuevo!' ? 'bg-blue-600' : statusTag === 'corre!' ? 'bg-orange-600' : 'bg-red-600'
        }`}>
          {statusTag}
        </div>

        {/* Compare Toggle Top Right */}
        {onToggleCompare && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare(product);
            }}
            className={`absolute top-0 right-0 z-20 px-2 py-1 rounded-full text-[10px] font-bold transition-all border shadow-sm ${
              isComparing
                ? "bg-[#00D9FF] text-black border-[#00D9FF]"
                : "bg-slate-900/60 text-white border-white/20 hover:bg-slate-900"
            }`}
          >
            {isComparing ? "✓" : "+ Comparar"}
          </button>
        )}

        {/* Product Image */}
        <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-3 relative border border-slate-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <Zap className="w-10 h-10 opacity-30" />
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Brand Name Tag */}
          <span className="text-[11px] font-extrabold text-orange-600 uppercase tracking-widest block mb-0.5">
            {brandName}
          </span>

          {/* Model Name */}
          <h3 className="font-black text-base md:text-lg text-slate-900 leading-tight mb-2 uppercase line-clamp-2">
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
            {product.description}
          </p>
        </div>

        {/* Stock & Action Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Stock Display Badge (Rojo si <=2, Gris/Verde si disponible) */}
          <div className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
            currentStock === 0
              ? 'bg-slate-100 text-slate-500 border-slate-200'
              : currentStock <= 2
              ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {currentStock === 0 ? 'Agotado' : `Quedan ${currentStock} en stock`}
          </div>

          {/* Action Button: ver + */}
          <Button
            onClick={() => onViewDetails && onViewDetails(product)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs px-4 py-2 h-auto rounded-xl shadow-md uppercase tracking-wider active:scale-95"
          >
            ver +
          </Button>
        </div>
      </div>
    </div>
  );
}

