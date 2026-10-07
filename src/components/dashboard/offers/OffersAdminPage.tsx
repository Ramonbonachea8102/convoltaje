import React from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, LogOut, Tag, Home, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { OffersManagement } from './OffersManagement';

export const OffersAdminPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { currentUser, logout } = useAuthStore();

  const handleBackToDashboard = () => {
    setLocation('/admin/panel');
  };

  const handleLogout = async () => {
    await logout();
    setLocation('/admin/login');
  };

  return (
    <div className="min-h-screen w-full bg-[#0b3c8f] text-white flex flex-col font-sans selection:bg-[#00D9FF]/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b3c8f]/95 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-sm">
        {/* Left: Back button & brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition-colors"
            title="Volver al panel general"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="h-4 w-px bg-white/15 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00D9FF]/20 border border-[#00D9FF]/40 text-[#00D9FF] flex items-center justify-center font-bold">
              <Tag size={18} />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white block leading-none">
                Convoltaje
              </span>
              <span className="text-[10px] uppercase tracking-wider text-[#00D9FF] font-semibold">
                Módulo de Ofertas
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="/#catalogo"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#00D9FF] bg-[#00D9FF]/10 hover:bg-[#00D9FF]/20 border border-[#00D9FF]/30 rounded-xl transition-colors"
            title="Ver catálogo público en nueva pestaña"
          >
            <ExternalLink size={14} />
            <span>Ver Catálogo Web</span>
          </a>

          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <span className="text-xs text-white/70 hidden md:inline">
              {currentUser?.name} ({currentUser?.role})
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 text-white/60 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <OffersManagement />
      </main>
    </div>
  );
};
