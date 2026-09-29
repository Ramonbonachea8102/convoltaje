import React, { useState } from 'react';
import {
  X,
  Ticket,
  Sparkles,
  Gift,
  CheckCircle2,
  Copy,
  Send,
  Calendar,
  Flame,
  Star,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Globe,
  CalendarDays,
  Sparkle
} from 'lucide-react';
import { useParticipationStore, ParticipantLead } from '@/hooks/useParticipationStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { WHATSAPP_NUMBERS } from '@/lib/products';
import { toast } from 'sonner';

interface LeadRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCalculator?: () => void;
}

export const LeadRegistrationModal: React.FC<LeadRegistrationModalProps> = ({
  isOpen,
  onClose,
  onNavigateToCalculator,
}) => {
  const { currentParticipant, activeRaffle, registerLead, claimMission, checkInVisit, setRaffleFrequency } = useParticipationStore();
  const addDeal = useCrmStore((state) => state.addDeal);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const syncWithCrm = (lead: ParticipantLead) => {
    try {
      addDeal({
        name: lead.name,
        company: `Rifa Solar (${activeRaffle.frequencyLabel}) - Ticket: ${lead.ticketNumber}`,
        phone: lead.phone || '',
        email: lead.email,
        value: 0,
        stage: 'Contacto',
        substage: 'lead_nuevo',
        expectedDate: new Date().toISOString().split('T')[0],
        source: `Registro en Rifa Convoltaje (${lead.provider}). Ticket asignado: ${lead.ticketNumber}. Edición: ${activeRaffle.name}`,
        salesAgent: 'José (Comercial Ejecutivo)',
      });
    } catch (err) {
      console.error('Error al sincronizar lead de rifa con CRM:', err);
    }
  };

  const handleManualRegister = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Por favor ingresa tu nombre.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Ingresa un correo electrónico válido.');
      return;
    }

    const lead = registerLead({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      provider: 'email',
    });

    syncWithCrm(lead);
    toast.success(`¡Felicidades ${lead.name}! Tu ticket ${lead.ticketNumber} fue generado.`);
  };

  const handleSocialRegister = (provider: 'google' | 'facebook') => {
    const demoName = provider === 'google' ? 'Usuario Google' : 'Usuario Facebook';
    const randomNum = Math.floor(100 + Math.random() * 900);
    const demoEmail = `${provider}.user${randomNum}@gmail.com`;

    const lead = registerLead({
      name: demoName,
      email: demoEmail,
      provider,
    });

    syncWithCrm(lead);
    toast.success(`¡Conectado con ${provider.toUpperCase()}! Ticket asignado: ${lead.ticketNumber}`);
  };

  const handleCopyTicket = (ticket: string) => {
    navigator.clipboard.writeText(ticket);
    setIsCopied(true);
    toast.success('¡Número de ticket copiado al portapapeles!');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleShareWhatsApp = (lead: ParticipantLead) => {
    const rawNumber = WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, '');
    const message = `¡Hola Convoltaje! 👋 Acabo de registrarme en el sorteo ${activeRaffle.frequency} con mi número de participación:\n\n🎟️ *Ticket Oficial:* ${lead.ticketNumber}\n👤 *Participante:* ${lead.name}\n🎁 *Premio:* ${activeRaffle.prize}\n\n¡Espero ser el afortunado ganador!`;

    window.open(`https://wa.me/${rawNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWebCheckIn = () => {
    const res = checkInVisit();
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.info(res.message);
    }
  };

  const handleClaimCalculatorMission = () => {
    claimMission('visita_calculadora', 1);
    toast.success('¡+1 Chance adicional acreditada a tu ticket!');
    onClose();
    if (onNavigateToCalculator) {
      onNavigateToCalculator();
    } else {
      const calcEl = document.getElementById('calculadora');
      if (calcEl) calcEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleClaimShareMission = (lead: ParticipantLead) => {
    claimMission('compartir_amigo', 2);
    const text = `☀️ ¡Regístrate en la Rifa Solar de Convoltaje (${activeRaffle.frequencyLabel}) y gana kits de iluminación y descuentos! Mi ticket es ${lead.ticketNumber}. Entra aquí: ${window.location.origin}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('¡+2 Chances sumadas por compartir!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#0F3A7D] border border-[#00D9FF]/40 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[94vh] relative"
        role="dialog"
        aria-modal="true"
      >
        {/* Glow Decorator */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-[#00D9FF]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-[#FF6B35]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0b2b5c]/80 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00D9FF] to-[#FF6B35] flex items-center justify-center text-[#0b1b33] font-bold shadow-lg">
              <Gift size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-wider">
                  {activeRaffle.name}
                </h2>
                <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setRaffleFrequency('semanal')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      activeRaffle.frequency === 'semanal'
                        ? 'bg-[#00D9FF] text-[#0b1b33] shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Semanal
                  </button>
                  <button
                    type="button"
                    onClick={() => setRaffleFrequency('mensual')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                      activeRaffle.frequency === 'mensual'
                        ? 'bg-[#FF6B35] text-white shadow'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Mensual
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-[#00D9FF] font-semibold flex items-center gap-1 mt-0.5">
                <Calendar size={11} />
                Próximo Sorteo: {activeRaffle.nextDrawDate}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 relative z-10">
          
          {/* Banner Premio */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-sm">
            <div className="p-2.5 rounded-xl bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30">
              <Sparkles size={22} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] uppercase font-black tracking-wider text-[#FF6B35]">
                Premio de este mes
              </span>
              <p className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight">
                {activeRaffle.prize}
              </p>
            </div>
          </div>

          {!currentParticipant ? (
            /* ── PASO 1: REGISTRO DE LEAD ── */
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-black text-white">¡Obtén tu Número de Ticket Gratis!</h3>
                <p className="text-xs text-white/70 max-w-sm mx-auto">
                  Participa en el sorteo mensual y acumula chances visitando la web o usando la calculadora.
                </p>
              </div>

              {/* Social Login Options */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSocialRegister('google')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition-all shadow-md active:scale-95"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialRegister('facebook')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold text-xs transition-all shadow-md active:scale-95"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>
              </div>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/15" />
                <span className="text-[11px] text-white/50 uppercase font-bold">o con tu correo</span>
                <div className="flex-1 h-px bg-white/15" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleManualRegister} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-white/80 uppercase mb-1">
                    Tu Nombre Completo <span className="text-[#FF6B35]">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej: Marcos Pérez"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/80 uppercase mb-1">
                    Correo Electrónico <span className="text-[#FF6B35]">*</span>
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-white/80 uppercase mb-1">
                    WhatsApp / Teléfono (Para notificarte si ganas)
                  </label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+53 51234567"
                      className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#00D9FF]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#00D9FF] to-[#00b0d9] hover:brightness-105 text-[#0b1b33] font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#00D9FF]/30 active:scale-98 flex items-center justify-center gap-2"
                >
                  <Ticket size={16} />
                  <span>Generar Mi Ticket de Participación</span>
                </button>
              </form>
            </div>
          ) : (
            /* ── PASO 2: TICKET CARD CONFIRMADO Y GAMIFICACIÓN ── */
            <div className="space-y-6 animate-in zoom-in-95">
              
              {/* Tarjeta Digital Tipo Golden Ticket Holográfico */}
              <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0c2854] via-[#092044] to-[#081a38] border-2 border-[#00D9FF] p-6 shadow-2xl text-center">
                {/* Perforaciones visuales de ticket */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0F3A7D] border-r-2 border-[#00D9FF]" />
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0F3A7D] border-l-2 border-[#00D9FF]" />

                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Star size={14} className="text-[#FF6B35] fill-current" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#00D9FF]">
                    Pase Oficial de Sorteo
                  </span>
                  <Star size={14} className="text-[#FF6B35] fill-current" />
                </div>

                <div className="my-2">
                  <div className="text-[10px] uppercase font-bold text-white/50">Tu Número Asignado</div>
                  <div className="text-3xl sm:text-4xl font-black text-white tracking-wider font-mono my-1 drop-shadow-md select-all text-transparent bg-clip-text bg-gradient-to-r from-white via-[#00D9FF] to-white">
                    {currentParticipant.ticketNumber}
                  </div>
                  <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/30">
                    {currentParticipant.chances} {currentParticipant.chances === 1 ? 'Participación activa' : 'Participaciones activas'}
                  </span>
                </div>

                <div className="border-t border-dashed border-white/20 pt-3 mt-3 text-xs text-white/80 space-y-1">
                  <p><span className="text-white/50">Titular:</span> <span className="font-bold text-white">{currentParticipant.name}</span></p>
                  <p><span className="text-white/50">Edición:</span> <span className="text-[#00D9FF] font-semibold">{activeRaffle.name}</span></p>
                </div>

                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => handleCopyTicket(currentParticipant.ticketNumber)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all active:scale-95"
                  >
                    {isCopied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(currentParticipant)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all active:scale-95 shadow-md shadow-emerald-600/20"
                  >
                    <Send size={13} />
                    <span>Guardar en WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* ── MÓDULO DESACOPLADO DE GAMIFICACIÓN / MISIONES ── */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame size={16} className="text-[#FF6B35]" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                      Multiplica tus Chances de Ganar
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-[#00D9FF] bg-[#00D9FF]/10 px-2 py-0.5 rounded-md">
                    Nivel {currentParticipant.level}
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Misión Recurrente: Visitas Web */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        <Globe size={13} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>Check-in Web Semanal</span>
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold">
                            Racha: {currentParticipant.visitStreak || 1} {currentParticipant.visitStreak === 1 ? 'visita' : 'visitas'}
                          </span>
                        </div>
                        <div className="text-[10px] text-white/50">Visita la web cada semana y suma +1 chance</div>
                      </div>
                    </div>

                    {currentParticipant.lastCheckInDate === new Date().toISOString().split('T')[0] ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Al día
                      </span>
                    ) : (
                      <button
                        onClick={handleWebCheckIn}
                        className="text-xs font-bold text-[#00D9FF] hover:underline flex items-center gap-1"
                      >
                        <span>Reclamar +1</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>

                  {/* Misión 1: Calculadora */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-[#00D9FF] flex items-center justify-center text-xs font-bold">
                        ⚡
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Calcula tu Consumo Solar</div>
                        <div className="text-[10px] text-white/50">+1 Chance en el sorteo</div>
                      </div>
                    </div>

                    {currentParticipant.completedMissions.includes('visita_calculadora') ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Completado
                      </span>
                    ) : (
                      <button
                        onClick={handleClaimCalculatorMission}
                        className="text-xs font-bold text-[#00D9FF] hover:underline flex items-center gap-1"
                      >
                        <span>Calcular</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>

                  {/* Misión 2: Compartir con Amigos */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 text-[#FF6B35] flex items-center justify-center text-xs font-bold">
                        👥
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white">Invita a un Amigo en Cuba</div>
                        <div className="text-[10px] text-white/50">+2 Chances adicionales</div>
                      </div>
                    </div>

                    {currentParticipant.completedMissions.includes('compartir_amigo') ? (
                      <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Compartido
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaimShareMission(currentParticipant)}
                        className="text-xs font-bold text-[#00D9FF] hover:underline flex items-center gap-1"
                      >
                        <span>Compartir</span>
                        <ChevronRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón de cierre */}
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors"
              >
                Cerrar y seguir navegando
              </button>

            </div>
          )}

          {/* Seguridad y Privacidad */}
          <div className="text-center flex items-center justify-center gap-1.5 text-[10px] text-white/40">
            <ShieldCheck size={12} className="text-[#00D9FF]" />
            <span>Tus datos están protegidos · Convoltaje Servicios Energéticos</span>
          </div>

        </div>

      </div>
    </div>
  );
};
