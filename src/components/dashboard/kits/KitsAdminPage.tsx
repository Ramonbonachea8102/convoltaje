import React from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, LogOut, ShieldCheck, Sun, Layers, Home, ExternalLink } from 'lucide-react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { KitsManagement } from './KitsManagement';

export const KitsAdminPage: React.FC = () => {
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
              <Sun size={18} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                <span>Convoltaje</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-[#00D9FF]">
                  Admin Kits
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Right: User session & Actions */}
        <div className="flex items-center gap-3">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-[#00D9FF]/20 text-[#00D9FF] flex items-center justify-center text-xs font-bold">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-white/80">
                {currentUser.name}{' '}
                <span className="text-[10px] text-[#00D9FF] font-semibold uppercase">
                  ({currentUser.role})
                </span>
              </span>
            </div>
          )}

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors px-2 py-1"
            title="Ver sitio público"
          >
            <ExternalLink size={14} />
            <span className="hidden md:inline">Sitio Web</span>
          </a>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white font-semibold transition-colors bg-white/5 border border-white/10 rounded-xl px-3 py-1.5"
            title="Cerrar sesión"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8 flex flex-col">
        {/* Breadcrumb & Security Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBackToDashboard}
              className="hover:text-[#00D9FF] transition-colors flex items-center gap-1"
            >
              <Home size={13} />
              <span>Admin</span>
            </button>
            <span>/</span>
            <span className="text-white font-semibold">Kits Solares</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#00D9FF] bg-[#00D9FF]/10 border border-[#00D9FF]/20 px-2.5 py-1 rounded-full font-semibold">
            <ShieldCheck size={13} />
            <span>Ruta Protegida · Solo Personal Autorizado</span>
          </div>
        </div>

        {/* Kits Management Core */}
        <KitsManagement />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-4 px-6 text-center text-xs text-white/40 bg-[#082a66]/40">
        Convoltaje Cuba · Sistema de Administración y Catálogo de Kits Solares
      </footer>
    </div>
  );
};

export default KitsAdminPage;
