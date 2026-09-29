import React, { useState } from 'react';
import { X, CheckCircle, Download, Send, Phone, MapPin, User, FileText, ArrowRight, Sparkles } from 'lucide-react';
import { SolarKit } from '@/hooks/useKitsStore';
import { useCrmStore } from '@/hooks/useCrmStore';
import { WHATSAPP_NUMBERS } from '@/lib/products';
import { toast } from 'sonner';

interface KitWorkOrderModalProps {
  kit: SolarKit | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KitWorkOrderModal: React.FC<KitWorkOrderModalProps> = ({
  kit,
  isOpen,
  onClose,
}) => {
  const { addDeal } = useCrmStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createdOtId, setCreatedOtId] = useState<string>('');

  if (!isOpen || !kit) return null;

  const handleGenerateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!phone.trim()) {
      toast.error('Por favor ingresa tu número de WhatsApp o teléfono.');
      return;
    }

    const otNumber = `OT-${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;
    const newDealId = `deal-${Date.now()}`;

    // Add Work Order to CRM Pipeline
    addDeal({
      name: name.trim(),
      company: kit.name,
      phone: phone.trim(),
      email: '',
      value: kit.totalPrice,
      stage: 'Contacto',
      substage: 'lead_nuevo',
      expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      source: `web_catalogo_kits - ${kit.name} ($${kit.totalPrice} USD) [${kit.category}]. ${notes.trim() ? `Notas: ${notes.trim()}` : ''}`,
      otRef: `${otNumber}/${name.split(' ')[0]}`,
      address: address.trim() || 'Cuba'
    });

    setCreatedOtId(otNumber);
    setIsSubmitted(true);
    toast.success('¡Solicitud y Orden de Trabajo generada con éxito!');
  };

  const handleOpenWhatsApp = () => {
    const rawNumber = WHATSAPP_NUMBERS.convoltaje.replace(/\D/g, '');
    const clientName = name.trim() || 'Cliente';
    const message = `Hola Convoltaje ☀️\n\nDeseo solicitar/cotizar el siguiente sistema solar:\n*Kit:* ${kit.name}\n*Categoría:* ${kit.category}\n*Precio Total:* $${kit.totalPrice.toLocaleString()} USD\n\n*Mis Datos:*\n• Nombre: ${clientName}\n• Teléfono: ${phone.trim() || 'No especificado'}\n• Dirección: ${address.trim() || 'Cuba'}\n${notes.trim() ? `• Consulta: ${notes.trim()}` : ''}\n\n¿Podrían brindarme información y disponibilidad para la instalación? Gracias.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${rawNumber}?text=${encoded}`, '_blank');
    onClose();
  };

  const handleScrollToContact = () => {
    onClose();
    const contactSection = document.getElementById('contacto');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div>
            <span className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider block">
              Cotización y Solicitud Directa
            </span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {kit.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Kit Summary Card */}
          <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <img
              src={kit.imageUrl || '/images/logoconvoltaje.jpg'}
              alt={kit.name}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/logoconvoltaje.jpg';
              }}
              className="w-20 h-20 rounded-xl object-cover border border-slate-700 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  {kit.category}
                </span>
                <span className="text-xs text-slate-400">Precio Oficial</span>
              </div>
              <div className="text-xl font-black text-orange-500">
                ${kit.totalPrice.toLocaleString()} <span className="text-xs text-slate-300 font-bold">USD</span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {kit.componentsSummary.slice(0, 2).join(' • ')}...
              </p>
            </div>
          </div>

          {!isSubmitted ? (
            <form onSubmit={handleGenerateWorkOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Tu Nombre Completo <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Carlos Santana"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Teléfono / WhatsApp <span className="text-orange-500">*</span>
                </label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ej: +53 51234567"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Dirección o Municipio de Instalación
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej: Playa, La Habana"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Notas Adicionales (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="¿Tienes dudas sobre tu consumo o tipo de techo? Déjanos un comentario."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/30 active:scale-95"
                >
                  <FileText size={16} />
                  <span>Generar Orden de Trabajo</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                  <Send size={15} />
                  <span>WhatsApp Directo</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mx-auto flex items-center justify-center">
                <CheckCircle size={34} />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-1">¡Solicitud Registrada con Éxito!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Hemos registrado la Orden de Trabajo para <span className="text-cyan-400 font-bold">{kit.name}</span>. Un especialista técnico de Convoltaje se comunicará contigo de inmediato.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
                <p>Referencia de Orden: <span className="text-white font-mono font-bold">{createdOtId || 'OT-ACTIVA'}</span></p>
                <p>Kit Solicitado: <span className="text-white font-semibold">{kit.name}</span> (${kit.totalPrice} USD)</p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleOpenWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30"
                >
                  <Send size={15} />
                  <span>Enviar datos por WhatsApp</span>
                </button>

                <button
                  onClick={onClose}
                  className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
                >
                  Volver al Catálogo
                </button>
              </div>
            </div>
          )}

          {/* Quick link to contact */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>¿Prefieres llamarnos o visitarnos?</span>
            <button
              onClick={handleScrollToContact}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
            >
              <span>Ver información de contacto</span>
              <ArrowRight size={13} />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
