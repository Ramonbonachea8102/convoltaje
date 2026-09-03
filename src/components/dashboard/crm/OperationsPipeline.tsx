import { useState, useEffect } from 'react';
import { useCrmStore, DealStage, ClientDeal } from '@/hooks/useCrmStore';
import { MessageSquare, Phone, Search, ArrowRight, User, Calendar, DollarSign, Edit3, Clipboard, RefreshCw, X, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRefundsStore } from '@/hooks/useRefundsStore';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useSettingsStore, formatEmployeeName } from '@/hooks/useSettingsStore';
import { generateOfferPdf } from '@/lib/pdf-offer-generator';
import { CONVOLTAJE_PRODUCTS as products, type Product } from '@/lib/products';
import { makeService } from '@/lib/services/makeService';
import PaymentEntryModal from './PaymentEntryModal';

function findMatchingProduct(dealCompany: string): Product {
  const company = dealCompany.toLowerCase().trim();

  const clean = (s: string) => s.toLowerCase().replace(/sistema\s*/g, '').replace(/solar\s*/g, '').trim();

  const directMatch = products.find(p => {
    const productName = clean(p.name);
    return company.includes(productName) || productName.includes(company);
  });
  if (directMatch) return directMatch;

  const kw = company.match(/(\d+)\s*k/i);
  if (kw) {
    const num = parseInt(kw[1]);
    const kwProduct = products.find(p => {
      const n = clean(p.name);
      return n.includes(`${num}k`) || n.includes(`${num}000`);
    });
    if (kwProduct) return kwProduct;
  }

  const kwExplicit = company.match(/(\d{3,5})\s*w/i);
  if (kwExplicit) {
    const num = parseInt(kwExplicit[1]);
    const numProduct = products.find(p => {
      const n = clean(p.name);
      return n.includes(num.toString());
    });
    if (numProduct) return numProduct;
  }

  const keywords: [string, string][] = [
    ['básico', 'básico'], ['basico', 'básico'],
    ['híbrido', 'híbrido'], ['hibrido', 'híbrido'],
    ['avanzado', 'avanzado'], ['premium', 'premium'],
    ['ecoflow', 'ecoflow'], ['bluetti', 'bluetti'], ['anker', 'anker'],
    ['plus', 'plus'],
  ];
  for (const [key, target] of keywords) {
    if (company.includes(key)) {
      const match = products.find(p => p.name.toLowerCase().includes(target));
      if (match) return match;
    }
  }

  return products[0];
}

const STAGES: DealStage[] = ['Contacto', 'En Producción', 'Terminado', 'Facturado', 'Feedback'];

const STAGE_COLORS: Record<DealStage, string> = {
  'Contacto': 'bg-[#00D9FF] text-[#0b1b33]',
  'En Producción': 'bg-[#FFB800] text-[#0b1b33]',
  'Terminado': 'bg-[#00FF66] text-[#0b1b33]',
  'Facturado': 'bg-[#FF6B35] text-white',
  'Feedback': 'bg-white/20 text-white'
};

const SUBSTAGE_LABELS: Record<string, { label: string; color: string }> = {
  lead_nuevo: { label: '🆕 Lead Nuevo', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  comercial_asignado: { label: '👤 Comercial Asignado', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' },
  fecha_agendada: { label: '📅 Fecha Agendada', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  pendiente_levantamiento: { label: '📋 Pendiente Levantamiento', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  levantamiento_completado: { label: '📋 Levantamiento Completado', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  pendiente_almacen: { label: '📦 Pendiente Almacén', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
  almacen_preparado: { label: '📦 Pedido Preparado (Stock Reservado)', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  en_transporte: { label: '🚚 En Transporte / Ruta', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  en_instalacion: { label: '🔧 En Instalación', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
  instalacion_completada: { label: '✅ Instalación Completada', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  pendiente_pago: { label: '💰 Pendiente de Pago', color: 'bg-[#FFB800]/20 text-[#FFB800] border-[#FFB800]/30' },
  pago_verificado: { label: '💳 Pago Verificado', color: 'bg-[#00FF66]/20 text-[#00FF66] border-[#00FF66]/30' },
  factura_emitida: { label: '📄 Factura Emitida', color: 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30' },
  feedback_pendiente: { label: '⭐ Feedback Pendiente', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  completado: { label: '🎉 OT Completada', color: 'bg-emerald-500/30 text-emerald-200 border-emerald-500/40' },
};

export default function OperationsPipeline() {
  const { deals, moveDeal, fetchDeals, updateDeal, logOtActivity } = useCrmStore();
  const { teamMembers } = useSettingsStore();

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  const { addRefund } = useRefundsStore();
  const { currentUser } = useAuthStore();
  const [activeStage, setActiveStage] = useState<DealStage>('Contacto');
  const [selectedDeal, setSelectedDeal] = useState<ClientDeal | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'capsulas'>('kanban');

  // Estados para el Modal de Reintegro
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMaterialStatus, setRefundMaterialStatus] = useState<'disponible' | 'merma' | 'revision_tecnica'>('disponible');

  // Estado para Modal de Pago
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Filtrar clientes por etapa activa y término de búsqueda
  const stageDeals = deals.filter(d => d.stage === activeStage);
  const filteredDeals = stageDeals.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm)
  );

  const handleStageChange = (dealId: string, newStage: DealStage) => {
    moveDeal(dealId, newStage);
    if (currentUser) {
      logOtActivity(dealId, `Movido a etapa: ${newStage}`, currentUser.name);
    }
    
    // Actualizar el cliente seleccionado en el estado local
    if (selectedDeal && selectedDeal.id === dealId) {
      setSelectedDeal({ ...selectedDeal, stage: newStage });
    }
    toast.success(`Cliente movido a ${newStage}`);
  };

  const handleSubstageChange = (newSubstage: any, actionLabel: string, details?: string, newStage?: DealStage) => {
    if (!selectedDeal) return;
    const fromSubstage = selectedDeal.substage || 'lead_nuevo';
    const actorName = currentUser?.name || 'Comercial';
    const targetStage = newStage || selectedDeal.stage;

    updateDeal(selectedDeal.id, {
      stage: targetStage,
      substage: newSubstage,
    });

    logOtActivity(
      selectedDeal.id,
      actionLabel,
      details || `Acción iniciada por ${actorName}`,
      newSubstage,
      actorName,
      "comercial"
    );

    makeService.dispatchOtSubstageEvent(
      selectedDeal.otRef || selectedDeal.id,
      fromSubstage,
      newSubstage,
      actorName
    );

    setSelectedDeal({
      ...selectedDeal,
      stage: targetStage,
      substage: newSubstage,
    });

    toast.success(`OT actualizada: ${actionLabel}`);
  };

  const getFeedbackStatus = (dateString: string) => {
    const installDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - installDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const daysLeft = 7 - diffDays;
    
    if (daysLeft > 0) {
      return { status: 'waiting', text: `⏳ En prueba (${daysLeft} días)` };
    }
    return { status: 'ready', text: '🟢 Pedir Reseña' };
  };

  const handleCreateRefund = () => {
    if (!selectedDeal || !currentUser) return;
    if (Number(refundAmount) <= 0) {
      toast.error("El monto debe ser mayor a 0");
      return;
    }

    addRefund({
      payment_id: "pay-unknown", // En un sistema real esto vendría de un pago seleccionado
      deal_id: selectedDeal.id,
      requested_by: currentUser.name,
      amount_to_refund: Number(refundAmount),
      status: 'pendiente',
      material_status_decision: refundMaterialStatus,
      material_decided_by: null
    });

    toast.success("Solicitud de reintegro enviada a la dirección.");
    setShowRefundModal(false);
    setRefundAmount('');
  };

  return (
    <div className="w-full flex flex-col font-sans text-white pb-12">
      
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">Pipeline de Clientes</h2>
          <p className="text-white/60 text-xs">
            Visualiza y organiza tus proyectos según su fase de progreso.
          </p>
        </div>

        {/* Toggle de Modo de Vista */}
        <div className="flex bg-black/30 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'kanban' 
                ? 'bg-[#00D9FF] text-[#0b1b33] shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Trello Kanban
          </button>
          <button
            onClick={() => setViewMode('capsulas')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'capsulas' 
                ? 'bg-[#00D9FF] text-[#0b1b33] shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Cápsulas
          </button>
        </div>
      </div>

      {/* Input de Búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
        <input 
          type="text" 
          placeholder="Buscar por nombre, proyecto o telf..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00D9FF] transition-all w-full backdrop-blur-md"
        />
      </div>

      {/* VISTA 1: TABLERO TRELLO KANBAN */}
      {viewMode === 'kanban' && (
        <div className="w-full space-y-3 mb-6">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-white/50 font-medium">
              Desliza horizontalmente ➔ para moverte entre las 5 fases del Pipeline
            </span>
            <span className="text-[10px] bg-[#00D9FF]/20 text-[#00D9FF] px-2 py-0.5 rounded-full font-mono font-bold">
              {deals.length} Clientes Totales
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto snap-x pb-4 scrollbar-none max-w-full">
            {STAGES.map((stage) => {
              const searchFilteredDeals = deals.filter(d => 
                d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                d.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                d.phone.includes(searchTerm)
              );
              const stageDealsList = searchFilteredDeals.filter(d => d.stage === stage);

              return (
                <div
                  key={stage}
                  className="w-[280px] shrink-0 snap-start bg-[#071630]/70 border border-white/10 rounded-2xl p-3 flex flex-col gap-3 shadow-xl"
                >
                  {/* Header de columna Trello */}
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${STAGE_COLORS[stage]}`}>
                      {stage}
                    </span>
                    <span className="text-xs font-mono font-bold bg-white/15 px-2.5 py-0.5 rounded-full text-white">
                      {stageDealsList.length}
                    </span>
                  </div>

                  {/* Tarjetas del Kanban */}
                  <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[550px] pr-1">
                    {stageDealsList.length > 0 ? (
                      stageDealsList.map((deal) => (
                        <div
                          key={deal.id}
                          onClick={() => setSelectedDeal(deal)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 group shadow-md active:scale-[0.98] ${
                            selectedDeal?.id === deal.id
                              ? 'bg-[#0a2e6b] border-[#00D9FF] text-white ring-1 ring-[#00D9FF]/30'
                              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white/90'
                          }`}
                        >
                          {/* Top: Avatar + Nombre + OT Ref */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-white/10 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {deal.name.charAt(0)}
                              </div>
                              <h4 className="text-xs font-bold text-white truncate group-hover:text-[#00D9FF] transition-colors">
                                {deal.name}
                              </h4>
                            </div>
                            {deal.otRef && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00D9FF]/20 text-[#00D9FF] font-black shrink-0">
                                {deal.otRef}
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-white/70 line-clamp-1 font-medium">
                            {deal.company}
                          </p>

                          {/* Subetapa Badge */}
                          {deal.substage && SUBSTAGE_LABELS[deal.substage] && (
                            <span className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold self-start ${SUBSTAGE_LABELS[deal.substage].color}`}>
                              {SUBSTAGE_LABELS[deal.substage].label}
                            </span>
                          )}

                          {/* Footer de Tarjeta: Precio + Mover de Etapa */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] gap-1">
                            <span className="font-mono font-bold text-[#00FF66] shrink-0">
                              ${deal.value.toLocaleString()} USD
                            </span>

                            {/* Selector para Mover de Fase al Instante */}
                            <div 
                              className="relative"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <select
                                value={deal.stage}
                                onChange={(e) => handleStageChange(deal.id, e.target.value as DealStage)}
                                className="bg-[#0b1b33] hover:bg-[#0c2447] border border-white/20 text-[10px] text-[#00D9FF] font-bold rounded-lg px-2 py-1 outline-none cursor-pointer transition-colors"
                              >
                                {STAGES.map((s) => (
                                  <option key={s} value={s} className="bg-[#0b1b33] text-white">
                                    Mover a {s}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="border border-dashed border-white/10 rounded-xl p-6 text-center text-white/30 text-[11px] py-8">
                        Sin clientes en esta fase
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: CÁPSULAS CLÁSICAS */}
      {viewMode === 'capsulas' && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {STAGES.map((stage) => {
            const count = deals.filter(d => d.stage === stage).length;
            const isActive = activeStage === stage;
            
            return (
              <button
                key={stage}
                onClick={() => {
                  setActiveStage(stage);
                  setSelectedDeal(null); // Resetear detalle
                }}
                className={`rounded-xl py-2.5 px-1 text-center border transition-all flex flex-col items-center justify-center gap-1
                  ${isActive 
                    ? `${STAGE_COLORS[stage]} border-transparent font-bold shadow-lg shadow-black/20` 
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
              >
                <span className="text-[10px] uppercase tracking-wider font-semibold truncate max-w-full px-1">{stage}</span>
                <span className="text-xs font-mono font-bold bg-black/15 px-2 py-0.5 rounded-full">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Stack de Lista y Detalles */}
      <div className="space-y-6">
        
        {/* Lista de clientes para la etapa seleccionada */}
        <div className="space-y-2">
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Fase: {activeStage}</span>
            <span className="font-mono">{filteredDeals.length} de {stageDeals.length}</span>
          </h3>

          {filteredDeals.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredDeals.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group active:scale-[0.99]
                    ${selectedDeal?.id === deal.id
                      ? 'bg-gradient-to-r from-[#00D9FF]/20 to-transparent border-[#00D9FF] text-white shadow-lg'
                      : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/80 font-bold text-sm flex-shrink-0">
                      {deal.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold truncate group-hover:text-[#00D9FF] transition-colors">{deal.name}</h4>
                        {deal.otRef && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00D9FF]/15 text-[#00D9FF] font-semibold">
                            {deal.otRef}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs text-white/55 truncate">{deal.company}</p>
                        {deal.salesAgent && (
                          <span className="text-[10px] text-[#FFB800] font-medium truncate">
                            👤 {formatEmployeeName(deal.salesAgent, teamMembers)}
                          </span>
                        )}
                        {deal.substage && SUBSTAGE_LABELS[deal.substage] && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold self-start mt-0.5 ${SUBSTAGE_LABELS[deal.substage].color}`}>
                            {SUBSTAGE_LABELS[deal.substage].label}
                          </span>
                        )}
                        {deal.technicalSurvey && !deal.substage && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00FF66]/20 text-[#00FF66] font-bold self-start mt-0.5 flex items-center gap-1">
                            📋 Levantamiento Completado
                          </span>
                        )}
                        {deal.stage === 'Feedback' && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold self-start ${
                            getFeedbackStatus(deal.expectedDate).status === 'ready' 
                              ? 'bg-[#00FF66]/20 text-[#00FF66]' 
                              : 'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {getFeedbackStatus(deal.expectedDate).text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 pl-2">
                    <span className="text-xs font-mono font-bold text-[#00FF66]">${deal.value.toLocaleString()}</span>
                    <p className="text-[9px] text-white/40 font-mono mt-0.5">{deal.expectedDate}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-white/30 text-xs">
              Sin clientes en esta fase.
            </div>
          )}
        </div>

        {/* Detalle del cliente seleccionado */}
        {selectedDeal && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#00D9FF]/10 flex items-center justify-center text-[#00D9FF] flex-shrink-0">
                  <User size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate leading-none mb-1">{selectedDeal.name}</h3>
                  <span className="text-xs text-white/55 font-mono">{selectedDeal.phone}</span>
                </div>
              </div>
              
              {/* Enlace directo a WhatsApp */}
              <a 
                href={`https://wa.me/${selectedDeal.phone.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] rounded-xl hover:bg-[#25D366]/30 transition-all flex-shrink-0 active:scale-[0.97]"
              >
                <MessageSquare size={13} />
                <span>WhatsApp</span>
              </a>
            </div>

            {/* Detalles rápidos */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-white/40 block mb-0.5">Orden de Trabajo (OT)</span>
                <span className="font-mono font-bold text-[#00D9FF] block truncate">{selectedDeal.otRef || 'Generando al emitir'}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Comercial Asignado</span>
                <span className="font-semibold text-[#FFB800] block truncate">{formatEmployeeName(selectedDeal.salesAgent || currentUser?.name || 'Agente Comercial', teamMembers)}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Proyecto / Equipo</span>
                <span className="font-semibold text-white block truncate">{selectedDeal.company}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Valor Estimado</span>
                <span className="font-mono font-bold text-[#00FF66]">${selectedDeal.value.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Fecha de Inicio</span>
                <span className="font-mono font-semibold text-white/90 flex items-center gap-1">
                  <Calendar size={12} className="text-white/40" />
                  {selectedDeal.expectedDate}
                </span>
              </div>
              <div>
                <span className="text-white/40 block mb-0.5">Fase de Pipeline</span>
                <div className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-1 ${STAGE_COLORS[selectedDeal.stage]}`}>
                  {selectedDeal.stage}
                </div>
              </div>
            </div>

            {/* Ficha Técnica de Levantamiento (Si Samuel completó el levantamiento en terreno) */}
            {selectedDeal.technicalSurvey && (
              <div className="bg-[#00D9FF]/10 border border-[#00D9FF]/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-[#00D9FF]/20 pb-2">
                  <span className="text-[10px] font-black text-[#00D9FF] uppercase tracking-wider flex items-center gap-1.5">
                    📋 Ficha Técnica de Levantamiento
                  </span>
                  <span className="text-[9px] text-white/50 font-mono">
                    Por {selectedDeal.technicalSurvey.proyectistaName}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[9px] text-white/40 block">Techo / Cubierta</span>
                    <span className="font-bold text-white">{selectedDeal.technicalSurvey.roofType} ({selectedDeal.technicalSurvey.availableAreaM2}m²)</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 block">Red Eléctrica</span>
                    <span className="font-bold text-white">{selectedDeal.technicalSurvey.electricalGrid}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 block">Aterramiento</span>
                    <span className="font-bold text-white">{selectedDeal.technicalSurvey.groundingStatus}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-white/40 block">Consumo Diario (+30% Seg)</span>
                    <span className="font-mono font-bold text-[#00FF66]">{selectedDeal.technicalSurvey.safetyKwhPerDay} kWh/día</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#00D9FF]/20 text-xs">
                  <span className="text-[9px] text-[#00D9FF] font-bold block mb-0.5">Notas Técnicas del Proyectista:</span>
                  <p className="text-white/80 text-[11px] leading-relaxed bg-black/20 p-2 rounded-xl border border-white/5">
                    {selectedDeal.technicalSurvey.technicalNotes}
                  </p>
                </div>
              </div>
            )}

            {/* Línea de Tiempo de la OT (Activity Log) */}
            <div className="bg-black/30 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[10px] font-black text-[#00D9FF] uppercase tracking-wider flex items-center gap-1.5">
                  ⏱️ Línea de Tiempo de la OT ({selectedDeal.activityLog?.length || 0})
                </span>
                <span className="text-[9px] text-white/40 font-mono">
                  Historial de auditoría
                </span>
              </div>

              {selectedDeal.activityLog && selectedDeal.activityLog.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDeal.activityLog.slice().reverse().map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-white/5 border border-white/5 rounded-xl p-2.5 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-bold text-[#00D9FF] flex items-center gap-1">
                          👤 {entry.actorName} ({entry.actorRole})
                        </span>
                        <span className="text-white/40 font-mono">
                          {new Date(entry.timestamp).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="font-semibold text-white/90 text-xs">
                        {entry.action}
                      </p>
                      {entry.details && (
                        <p className="text-[11px] text-white/60 bg-black/20 p-1.5 rounded border border-white/5">
                          {entry.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/40 italic">
                  Sin registros de actividad previos.
                </p>
              )}
            </div>

            {/* Notas del proyecto */}
            <div>
              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider block mb-1">Notas del Proyecto</span>
              <p className="text-xs text-white/80 leading-relaxed bg-black/20 rounded-xl p-3 border border-white/5 whitespace-pre-wrap">
                {selectedDeal.source || 'Sin notas adicionales.'}
              </p>
            </div>

            {/* Acciones Adicionales */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2 justify-end">
              <button
                onClick={async () => {
                  const product = findMatchingProduct(selectedDeal.company);
                  let otRef = selectedDeal.otRef;
                  if (!otRef) {
                    const seq = Math.floor(1000 + Math.random() * 9000);
                    otRef = `OT-${seq}`;
                    updateDeal(selectedDeal.id, { otRef });
                  }
                  const chosenAgent = selectedDeal.salesAgent || currentUser?.name || 'Agente Comercial';
                  const clientData = {
                    name: selectedDeal.name,
                    phone: selectedDeal.phone,
                    address: selectedDeal.address,
                    date: new Date().toLocaleDateString('es-ES'),
                    reference: otRef,
                  };
                  
                  try {
                    await generateOfferPdf(
                      product,
                      clientData,
                      selectedDeal.stage === 'Terminado' || selectedDeal.stage === 'Facturado',
                      selectedDeal.value,
                      chosenAgent,
                      currentUser?.phone || '+5355144097',
                    );
                    toast.success("Documento generado correctamente");
                  } catch (error) {
                    console.error("Failed to generate PDF:", error);
                    toast.error("Error al generar el documento");
                  }
                }}
                className="px-3 py-2 text-[10px] font-bold rounded-xl border border-[#00D9FF]/30 bg-[#00D9FF]/10 hover:bg-[#00D9FF]/20 text-[#00D9FF] transition-all flex items-center gap-1.5 active:scale-[0.96]"
              >
                <FileText size={12} />
                {selectedDeal.stage === 'Terminado' || selectedDeal.stage === 'Facturado' ? 'Generar Factura' : 'Generar Oferta'}
              </button>

              <button
                onClick={() => setShowRefundModal(true)}
                className="px-3 py-2 text-[10px] font-bold rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all flex items-center gap-1.5 active:scale-[0.96]"
              >
                <RefreshCw size={12} />
                Iniciar Reintegro
              </button>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-3 py-2 text-[10px] font-bold rounded-xl border border-[#00FF66]/30 bg-[#00FF66]/10 hover:bg-[#00FF66]/20 text-[#00FF66] transition-all flex items-center gap-1.5 active:scale-[0.96]"
              >
                <DollarSign size={12} />
                Registrar Pago
              </button>
            </div>

            {/* Sub-etapas y Acciones Directas de la OT */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] text-[#00D9FF] uppercase tracking-wider font-bold">
                ⚡ Acciones Directas de la OT (Asignación y Notificación):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(() => {
                  const isSurveyPending = selectedDeal.substage === 'pendiente_levantamiento';
                  const isSurveyDone = selectedDeal.substage === 'levantamiento_completado' || Boolean(selectedDeal.technicalSurvey);
                  const isScheduled = Boolean(selectedDeal.expectedDate);

                  return (
                    <button
                      disabled={isSurveyPending || isSurveyDone}
                      onClick={() => {
                        if (!isScheduled) {
                          toast.error("⚠️ Para solicitar levantamiento a Samuel, primero debes fijar la fecha en el Calendario.");
                          return;
                        }
                        handleSubstageChange(
                          'pendiente_levantamiento',
                          'Solicitó levantamiento técnico a Samuel (Proyectista)',
                          'Notificado Samuel para evaluación de terreno, techo y red eléctrica'
                        );
                      }}
                      className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-between group active:scale-[0.96] ${
                        isSurveyDone
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 cursor-not-allowed opacity-80"
                          : isSurveyPending
                          ? "border-amber-500/40 bg-amber-500/20 text-amber-200 cursor-not-allowed"
                          : "border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      <span>
                        {isSurveyDone
                          ? "✓ Levantamiento Completado (por Samuel)"
                          : isSurveyPending
                          ? "⏳ Levantamiento Solicitado a Samuel"
                          : "📋 Solicitar Levantamiento a Samuel"}
                      </span>
                      {!isSurveyDone && !isSurveyPending && (
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      )}
                    </button>
                  );
                })()}

                <button
                  onClick={() => handleSubstageChange(
                    'pendiente_almacen',
                    'Envió pedido a Almacén para preparación',
                    'Materiales enviados al Almacenero para reserva y empaque',
                    'En Producción'
                  )}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 transition-all flex items-center justify-between group active:scale-[0.96]"
                >
                  <span>📦 Enviar Pedido a Almacén</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleSubstageChange(
                    'pendiente_pago',
                    'Envió OT a Contabilidad para verificar pago',
                    'Factura u oferta lista para cobro',
                    'Facturado'
                  )}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-[#FFB800]/30 bg-[#FFB800]/10 hover:bg-[#FFB800]/20 text-[#FFB800] transition-all flex items-center justify-between group active:scale-[0.96]"
                >
                  <span>💰 Pasar a Pendiente de Pago</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    const isAuthorized = currentUser?.role === 'admin' || currentUser?.role === 'contable' || currentUser?.name === 'Laura';
                    if (!isAuthorized) {
                      toast.error("⛔ Permiso Denegado: Solo Admin (Ángel/Laura) y Contabilidad (José) pueden verificar pagos.");
                      return;
                    }
                    handleSubstageChange(
                      'pago_verificado',
                      'Verificó y validó el cobro de la OT',
                      'Pago acreditado en cuenta/caja. Habilitado para emisión de factura',
                      'Facturado'
                    );
                  }}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 transition-all flex items-center justify-between group active:scale-[0.96]"
                >
                  <span>💳 Verificar Pago (Admin/Contable)</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => handleSubstageChange(
                    'factura_emitida',
                    'Emitió la factura final con sello de garantía',
                    'Garantía real registrada y enviada al cliente',
                    'Facturado'
                  )}
                  className="px-3 py-2 text-xs font-bold rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 transition-all flex items-center justify-between group active:scale-[0.96]"
                >
                  <span>📄 Emitir Factura & Garantía</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Cambiar etapa (Acción rápida) */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Cambiar fase del cliente:</span>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.filter(s => s !== selectedDeal.stage).map((stage) => (
                  <button
                    key={stage}
                    onClick={() => handleStageChange(selectedDeal.id, stage)}
                    className="px-2.5 py-1.5 text-[10px] font-bold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1 active:scale-[0.96]"
                  >
                    <span>Mover a {stage}</span>
                    <ArrowRight size={10} className="text-white/40" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL DE REINTEGRO */}
      {showRefundModal && selectedDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1b33] border border-white/10 rounded-3xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-red-500/10">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <RefreshCw size={16} /> Solicitar Reintegro
              </h3>
              <button 
                onClick={() => setShowRefundModal(false)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-white/60">Cliente:</p>
                <p className="text-sm font-bold text-white">{selectedDeal.name}</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-1">Monto a Devolver (CUP/USD)</label>
                <input 
                  type="number" 
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="Ej. 1500"
                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono font-bold focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-white/60 uppercase tracking-wider block mb-1">Estado del Material Involucrado</label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setRefundMaterialStatus('disponible')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      refundMaterialStatus === 'disponible' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    Disponible (Se puede revender inmediatamente)
                  </button>
                  <button
                    onClick={() => setRefundMaterialStatus('merma')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      refundMaterialStatus === 'merma' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    Merma (Daño irreparable, no revendible)
                  </button>
                  <button
                    onClick={() => setRefundMaterialStatus('revision_tecnica')}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                      refundMaterialStatus === 'revision_tecnica' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-white/60'
                    }`}
                  >
                    Revisión Técnica (Requiere diagnóstico antes de decidir)
                  </button>
                </div>
              </div>

            </div>

            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end gap-3">
              <button 
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-white/5 hover:bg-white/10 text-white/70"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateRefund}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-red-500 hover:bg-red-400 text-white shadow-lg flex items-center gap-2"
              >
                <RefreshCw size={14} /> Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Pago */}
      {showPaymentModal && selectedDeal && (
        <PaymentEntryModal
          dealId={selectedDeal.id}
          dealName={selectedDeal.name}
          dealValue={selectedDeal.value}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
