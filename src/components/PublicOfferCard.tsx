import React from 'react';
import { Tag, FileText, Send, Calendar, Percent } from 'lucide-react';
import { Offer } from '@/types/offers';
import { WHATSAPP_NUMBERS } from '@/lib/products';

interface PublicOfferCardProps {
  offer: Offer;
  onContactClick?: (offer: Offer) => void;
}

export const PublicOfferCard: React.FC<PublicOfferCardProps> = ({ offer, onContactClick }) => {
  const discountPercent =
    offer.originalPrice && offer.originalPrice > offer.offerPrice
      ? Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
      : 0;

  const handleWhatsapp = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onContactClick) {
      onContactClick(offer);
      return;
    }
    const cleanNumber = WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, '');
    const message = `Hola ConVoltaje 👋 Me interesa consultar por la oferta: *${offer.title}* por $${offer.offerPrice.toLocaleString()} USD. ¿Está disponible para entrega e instalación?`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleOpenPdf = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (offer.pdfUrl) {
      window.open(offer.pdfUrl, '_blank');
    }
  };

  return (
    <div className="group relative bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full text-slate-100">
      
      {/* Top Banner: Image & Badges */}
      <div className="relative w-full h-56 bg-slate-900 overflow-hidden">
        {offer.imageUrl || offer.imagePath ? (
          <img
            src={offer.imageUrl || offer.imagePath}
            alt={offer.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-2">
              <Tag size={24} />
            </div>
            <span className="text-xs font-bold text-slate-300">Oferta Especial</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Badges Top Left */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/90 backdrop-blur-md border border-cyan-400/40 text-cyan-400 shadow-md">
            {offer.badgeText || 'OFERTA ESPECIAL'}
          </span>
          {discountPercent > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md">
              -{discountPercent}% OFF
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-black text-white group-hover:text-cyan-400 transition-colors mb-2 leading-snug">
            {offer.title}
          </h3>

          {offer.description && (
            <p className="text-xs text-slate-300 line-clamp-3 mb-4 leading-relaxed">
              {offer.description}
            </p>
          )}

          {/* Validity dates if configured */}
          {offer.endDate && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3 bg-slate-900/60 px-2.5 py-1 rounded-lg w-fit border border-slate-800">
              <Calendar size={12} className="text-cyan-400" />
              <span>Válido hasta: {new Date(offer.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Price & CTA */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <span className="text-3xl font-black text-orange-500 tracking-tight">
                ${offer.offerPrice.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-400 ml-1">USD</span>
            </div>

            {offer.originalPrice && offer.originalPrice > offer.offerPrice && (
              <span className="text-xs font-bold text-slate-500 line-through">
                ${offer.originalPrice.toLocaleString()} USD
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {offer.pdfUrl && (
              <button
                onClick={handleOpenPdf}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/25 text-xs font-bold transition-all shadow-sm"
              >
                <FileText size={14} />
                <span>Ver Ficha Técnica Oficial</span>
              </button>
            )}

            <button
              onClick={handleWhatsapp}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
            >
              <Send size={14} />
              <span>Aprovechar Oferta por WhatsApp</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
