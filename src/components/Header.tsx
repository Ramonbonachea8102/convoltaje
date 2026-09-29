import { useState, useEffect } from "react";
import { useParticipationStore } from "@/hooks/useParticipationStore";

interface HeaderProps {
  onResetBrand?: () => void;
  onOpenRaffle?: () => void;
}

export default function Header({ onResetBrand, onOpenRaffle }: HeaderProps) {
  const [activeTab, setActiveTab] = useState<string>("inicio");
  const { currentParticipant } = useParticipationStore();

  const scrollTo = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const sections = ["inicio", "nosotros", "catalogo", "calculadora", "reviews-section", "contacto"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        {/* Mobile: Logo + Access Button */}
        <div className="md:hidden py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 cursor-pointer min-w-0" onClick={() => scrollTo("inicio")}>
            <img
              src="https://img2.elyerromenu.com/images/convoltaje/logo-c/img.webp"
              alt="Convoltaje Logo"
              className="w-8 h-8 object-contain rounded-md flex-shrink-0"
            />
            <div className="flex flex-col text-left truncate">
              <h1 className="font-display text-sm text-primary font-bold leading-none truncate">Convoltaje</h1>
              <p className="text-[9px] text-muted-foreground leading-none">Energía Solar</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onOpenRaffle && (
              <button
                onClick={onOpenRaffle}
                className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#f0551a] text-white text-[10px] font-black shadow-sm flex items-center gap-1 active:scale-95"
              >
                <span>🎟️</span>
                <span>{currentParticipant ? currentParticipant.ticketNumber : 'Rifa Solar'}</span>
              </button>
            )}

            <a
              href="/admin/login"
              className="px-2.5 py-1.5 rounded-xl bg-[#0b3c8f] text-white text-[10px] font-bold shadow-sm flex items-center gap-1"
            >
              <span>Equipo</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        {/* Desktop: Logo + Tabs + Acceso Equipo */}
        <div className="hidden md:flex items-center justify-between py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollTo("inicio")}>
            <img
              src="https://img2.elyerromenu.com/images/convoltaje/logo-c/img.webp"
              alt="Convoltaje Logo"
              className="w-10 h-10 object-contain rounded-md"
            />
            <div className="flex flex-col">
              <h1 className="font-display text-xl text-primary font-bold">Convoltaje</h1>
              <p className="text-xs text-muted-foreground leading-none">& Tintaflash</p>
            </div>
          </div>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => scrollTo("nosotros")}
              className={`pb-1 transition-colors font-medium border-b-2 ${activeTab === 'nosotros' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-foreground hover:text-cyan-500'}`}
            >
              Quiénes somos
            </button>
            <button
              onClick={() => scrollTo("catalogo")}
              className={`pb-1 transition-colors font-medium border-b-2 ${activeTab === 'catalogo' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-foreground hover:text-cyan-500'}`}
            >
              Kits Solares
            </button>
            <button
              onClick={() => scrollTo("calculadora")}
              className={`pb-1 transition-colors font-medium border-b-2 ${activeTab === 'calculadora' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-foreground hover:text-cyan-500'}`}
            >
              Calculadora
            </button>
            <button
              onClick={() => scrollTo("contacto")}
              className={`pb-1 transition-colors font-medium border-b-2 ${activeTab === 'contacto' ? 'border-cyan-500 text-cyan-600' : 'border-transparent text-foreground hover:text-cyan-500'}`}
            >
              Contáctanos
            </button>
            {onResetBrand && (
              <button
                onClick={onResetBrand}
                className="text-xs text-muted-foreground hover:text-cyan-500 transition-colors font-medium flex items-center gap-1 border-r border-border pr-3"
              >
                <span>← Cambiar Marca</span>
              </button>
            )}
            {onOpenRaffle && (
              <button
                onClick={onOpenRaffle}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#f0551a] hover:brightness-110 text-white text-xs font-black shadow-md shadow-orange-500/20 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>🎟️</span>
                <span>{currentParticipant ? `Ticket: ${currentParticipant.ticketNumber}` : 'Rifa Solar'}</span>
              </button>
            )}

            <a
              href="/admin/login"
              className="px-4 py-2 rounded-xl bg-[#0b3c8f] hover:bg-[#092d6e] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
            >
              <span>Acceso Equipo</span>
              <span>🔒</span>
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
