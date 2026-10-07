import React from 'react';
import { Check, Sparkles, Send, ArrowRight, FileText, Download, Clock, Camera } from 'lucide-react';
import { SolarKit } from '@/hooks/useKitsStore';
import { WHATSAPP_NUMBERS } from '@/lib/products';

interface PublicKitCardProps {
  kit: SolarKit;
  onSelectKit: (kit: SolarKit) => void;
  onContactClick?: () => void;
}

export const PublicKitCard: React.FC<PublicKitCardProps> = ({
  kit,
  onSelectKit,
  onContactClick,
}) => {
  const handleQuickWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanNumber = WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, '');
    const message = `Hola ConVoltaje 👋 Me interesa solicitar cotización del *${kit.name}* ($${kit.totalPrice.toLocaleString()} USD). ¿Tienen disponibilidad?`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const hasOffer = Boolean(kit.originalPrice && kit.originalPrice > kit.totalPrice);
  const discountPercent = hasOffer && kit.originalPrice
    ? Math.round(((kit.originalPrice - kit.totalPrice) / kit.originalPrice) * 100)
    : 0;

  return (
    <div className="group relative bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full text-slate-100">
      
      {/* Top Banner: Image & Badges */}
      <div className="relative w-full h-52 bg-slate-900 overflow-hidden">
        {/* Kit Image or Professional Neutral Placeholder */}
        {kit.imageUrl && !kit.hasImagePending ? (
          <img
            src={kit.imageUrl}
            alt={kit.name}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2 shadow-inner">
              <Camera size={22} className="opacity-80" />
            </div>
            <span className="text-xs font-bold text-slate-300">Imagen del producto pendiente</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Fotografía técnica oficial en preparación</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Badges Top Left: Category & Discount */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/85 backdrop-blur-md border border-cyan-400/40 text-cyan-400 shadow-md">
            {kit.category}
          </span>
          {hasOffer && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-600 text-white shadow-lg animate-pulse">
              ¡Oferta -{discountPercent}%!
            </span>
          )}
        </div>

        {/* Direct Price Tag Bottom Right */}
        <div className="absolute bottom-3 right-3 z-10 bg-slate-950/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-orange-500/50 shadow-2xl flex flex-col items-end">
          {hasOffer && kit.originalPrice && (
            <span className="text-[11px] line-through text-slate-400 font-bold leading-none mb-1">
              ${kit.originalPrice.toLocaleString()} USD
            </span>
          )}
          <div className="flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-black text-orange-500 leading-none">
              ${kit.totalPrice.toLocaleString()}
            </span>
            <span className="text-[11px] font-extrabold text-slate-300">USD</span>
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Kit Name */}
          <h3 className="font-black text-lg md:text-xl text-white leading-tight mb-2 group-hover:text-cyan-400 transition-colors">
            {kit.name}
          </h3>

          {kit.description && (
            <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4 font-normal">
              {kit.description}
            </p>
          )}

          {/* Components Summary List */}
          <div className="my-3 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles size={12} className="text-cyan-400" />
              <span>Componentes Incluidos</span>
            </span>

            <ul className="space-y-1.5">
              {kit.componentsSummary.slice(0, 5).map((component, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check size={10} strokeWidth={3} />
                  </div>
                  <span className="line-clamp-2 leading-snug">{component}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ficha Técnica / PDF Actions */}
        <div className="pt-3 pb-2 border-t border-slate-800/80">
          {kit.pdfUrl && kit.hasTechnicalSheet !== false ? (
            <div className="flex items-center gap-2">
              <a
                href={kit.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-cyan-400 text-[11px] font-bold transition-all"
              >
                <FileText size={13} />
                <span>Ver ficha técnica</span>
              </a>
              <a
                href={kit.pdfUrl}
                download
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white text-[11px] font-bold transition-all"
                title="Descargar PDF"
              >
                <Download size={13} />
                <span className="hidden sm:inline">Descargar</span>
              </a>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold">
              <Clock size={13} />
              <span>Ficha técnica pendiente</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex items-center gap-2">
          {/* Primary Action: Solicitar Kit / Cotizar */}
          <button
            onClick={() => onSelectKit(kit)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-600/20 active:scale-95 group/btn"
          >
            <span>Solicitar Kit</span>
            <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
          </button>

          {/* Quick WhatsApp button */}
          <button
            onClick={handleQuickWhatsapp}
            className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors active:scale-95"
            title="Consultar por WhatsApp"
          >
            <Send size={15} />
          </button>
        </div>

      </div>

    </div>
  );
};
