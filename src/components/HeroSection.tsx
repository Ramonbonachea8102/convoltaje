import { ArrowRight, Users, Calendar, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onExploreClick: () => void;
  onCalculatorClick: () => void;
}

export default function HeroSection({ onExploreClick, onCalculatorClick }: HeroSectionProps) {
  return (
    <section id="inicio" className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Fallback Dark Background */}
      <div className="absolute inset-0 bg-[#050510] z-[-1]" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto items-center">
          {/* Main Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-white/20 shadow-2xl text-white animate-fade-in text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00D9FF]/20 border border-[#00D9FF]/40 text-[#00D9FF] text-xs md:text-sm font-semibold mb-6 uppercase tracking-wider">
              ⚡ Energía Solar Inteligente para Cuba
            </span>

            <h1 
              className="font-display text-4xl md:text-6xl lg:text-7xl mb-6 leading-tight font-extrabold tracking-tight"
              style={{ textShadow: '0 2px 20px rgba(0,0,0,0.8)' }}
            >
              Energiza tu vida
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mt-8 mb-10 flex-wrap">
              <Button
                onClick={onExploreClick}
                className="w-full sm:w-auto font-accent text-base md:text-lg px-8 py-6 neon-btn shadow-lg hover:scale-105 transition-all"
              >
                Explorar Catálogo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={onCalculatorClick}
                className="w-full sm:w-auto bg-[#ff4500] hover:bg-[#ff4500]/90 text-white border-none shadow-lg shadow-[#ff4500]/30 font-semibold font-accent text-base md:text-lg px-8 py-6 transition-all hover:scale-105"
              >
                Calculadora Solar
              </Button>
              <a
                href="/admin/login"
                className="w-full sm:w-auto bg-[#0b3c8f]/80 hover:bg-[#0b3c8f] text-white border border-white/30 font-bold font-sans text-sm px-6 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Acceso Equipo / CRM</span>
                <span>🔒</span>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-6 text-sm justify-center items-center flex-wrap">
              <div className="flex items-center gap-2 text-white/90 font-medium">
                <Users className="w-5 h-5 text-[#00D9FF] flex-shrink-0" />
                <span>Instalaciones en toda Cuba</span>
              </div>
              <div className="flex items-center gap-2 text-white/90 font-medium">
                <Calendar className="w-5 h-5 text-[#00D9FF] flex-shrink-0" />
                <span>Entrega e instalación rápida</span>
              </div>
              <div className="flex items-center gap-2 text-white/90 font-medium">
                <ShieldCheck className="w-5 h-5 text-[#00D9FF] flex-shrink-0" />
                <span>Garantía y respaldo técnico</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hidden md:flex absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-[#00D9FF] rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}
