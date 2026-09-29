import React from 'react';
import { Check, Sparkles, Send, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
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
    const rawNumber = WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, '');
    const message = `Hola Convoltaje, me interesa cotizar/solicitar el *${kit.name}* ($${kit.totalPrice.toLocaleString()} USD). ¿Tienen disponibilidad?`;
    window.open(`https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="group relative bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full text-slate-100">
      
      {/* Top Banner: Image & Badges */}
      <div className="relative w-full h-52 bg-slate-900 overflow-hidden">
        {/* Kit Image */}
        <img
          src={kit.imageUrl || '/images/logoconvoltaje.jpg'}
          alt={kit.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/logoconvoltaje.jpg';
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Category Badge Top Left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/80 backdrop-blur-md border border-cyan-400/40 text-cyan-400 shadow-md">
            {kit.category}
          </span>
        </div>

        {/* Direct Price Tag Bottom Right */}
        <div className="absolute bottom-3 right-3 z-10 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-orange-500/40 shadow-xl">
          <span className="text-[9px] uppercase font-extrabold text-slate-400 block leading-none">
            Precio Total
          </span>
          <span className="text-lg md:text-xl font-black text-orange-500 leading-tight">
            ${kit.totalPrice.toLocaleString()} <span className="text-[10px] font-bold text-slate-300">USD</span>
          </span>
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
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4 font-normal">
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
              {kit.componentsSummary.map((component, idx) => (
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

        {/* Action Controls */}
        <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center gap-2">
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
