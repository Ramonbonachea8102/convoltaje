import { useState } from "react";
import { 
  Wrench, Calendar, MapPin, User, Plus, Phone, 
  CheckCircle2, ClipboardList, Flame, ArrowRight, 
  Clock, CheckSquare, Square, Trash2, MessageSquare, AlertTriangle 
} from "lucide-react";
import { toast } from "sonner";
import { useSettingsStore, formatEmployeeName } from "@/hooks/useSettingsStore";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useInventoryStore } from "@/hooks/useInventoryStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { makeService } from "@/lib/services/makeService";

export interface InstallationWorkOrder {
  id: string;
  clientName: string;
  systemType: string;
  phone: string;
  date: string;
  time?: string;
  location: string;
  comercial: string;
  tecnico?: string;
  description: string;
  status: "levantamiento" | "en_curso" | "completada";
  ecoFlowIntegration?: string; // Observaciones si integra EcoFlow
  checklist: {
    id: string;
    label: string;
    completed: boolean;
  }[];
}

const defaultInstallations: InstallationWorkOrder[] = [
  {
    id: "inst-1",
    clientName: "María Gómez",
    systemType: "Sistema 6K PLUS",
    phone: "+5352847162",
    date: "2026-07-13",
    time: "09:00",
    location: "Calle 45 #2203, San José de las Lajas, Mayabeque",
    comercial: "Laura Vice",
    tecnico: "Yasiel (Director Técnico)",
    description: "Casa de placa con buena exposición solar en cubierta. Evaluar espacio para 8 paneles y anclaje de perfiles. Inversor MUST de 6kW y batería Lifepo4 de 15kWh.",
    status: "en_curso",
    checklist: [
      { id: "ch-1", label: "Anclaje de estructuras y paneles", completed: true },
      { id: "ch-2", label: "Montaje de inversor y pizarra de protecciones", completed: true },
      { id: "ch-3", label: "Cableado solar certificado MC4 y conexión DC", completed: false },
      { id: "ch-4", label: "Pruebas de encendido, balance y transferencia AC", completed: false },
      { id: "ch-5", label: "Firma de acta y entrega de garantía de Convoltaje", completed: false }
    ]
  },
  {
    id: "inst-2",
    clientName: "Carlos López",
    systemType: "Sistema Solar - Medio 3000W",
    phone: "+5353928174",
    date: "2026-07-14",
    time: "10:30",
    location: "Avenida 31 #8204, Playa, La Habana",
    comercial: "Angel CEO",
    tecnico: "Yasiel (Director Técnico)",
    description: "Instalación en techo de tejas francesas. Requiere base soporte regulable especial. Integrar inversor de 3000W y 1 batería de litio de 5.1kWh.",
    status: "levantamiento",
    ecoFlowIntegration: "Cliente posee un EcoFlow DELTA 2 suelto que desea integrar en by-pass manual para iluminación secundaria en apagón.",
    checklist: [
      { id: "ch-1", label: "Inspección técnica de sitio (Levantamiento)", completed: true },
      { id: "ch-2", label: "Aprobación de croquis de anclaje por Yasiel", completed: false },
      { id: "ch-3", label: "Verificación de espacio en tablero de distribución", completed: false }
    ]
  },
  {
    id: "inst-3",
    clientName: "Héctor Valdés",
    systemType: "Sistema Premium 10000W",
    phone: "+5354928173",
    date: "2026-07-10",
    location: "Zona Industrial Mariel, Artemisa",
    comercial: "Laura Vice",
    tecnico: "Yasiel (Director Técnico)",
    description: "Instalación comercial de alta demanda. 12 paneles en estructura triángulo de 30°, inversor MUST de 10kW y banco de baterías Lifepo4 de 15.4kWh.",
    status: "completada",
    checklist: [
      { id: "ch-1", label: "Anclaje de estructuras y paneles", completed: true },
      { id: "ch-2", label: "Montaje de inversor y pizarra de protecciones", completed: true },
      { id: "ch-3", label: "Cableado solar certificado MC4 y conexión DC", completed: true },
      { id: "ch-4", label: "Pruebas de encendido, balance y transferencia AC", completed: true },
      { id: "ch-5", label: "Firma de acta y entrega de garantía de Convoltaje", completed: true }
    ]
  },
  {
    id: "inst-4",
    clientName: "Elena Vargas",
    systemType: "Sistema Híbrido 5000W",
    phone: "+5359182736",
    date: "2026-07-15",
    time: "14:00",
    location: "Calle Línea #405, Vedado, La Habana",
    comercial: "Angel CEO",
    description: "Levantamiento inicial solicitado por el cliente para evaluar factibilidad en apartamento de 3er piso. Evaluar pasarela de cables por patinejo.",
    status: "levantamiento",
    checklist: [
      { id: "ch-1", label: "Inspección técnica de sitio (Levantamiento)", completed: false },
      { id: "ch-2", label: "Aprobación de croquis de anclaje por Yasiel", completed: false },
      { id: "ch-3", label: "Verificación de espacio en tablero de distribución", completed: false }
    ]
  }
];

export default function InstallationsMain() {
  const { teamMembers } = useSettingsStore();
  const [installations, setInstallations] = useState<InstallationWorkOrder[]>(() => {
    const saved = localStorage.getItem("convoltaje_installations");
    return saved ? JSON.parse(saved) : defaultInstallations;
  });

  const [activeTab, setActiveTab] = useState<"levantamiento" | "en_curso" | "completada">("en_curso");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states
  const [clientName, setClientName] = useState("");
  const [systemType, setSystemType] = useState("Sistema Básico - 1500W");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [comercial, setComercial] = useState("Angel CEO");
  const [description, setDescription] = useState("");
  const [ecoFlowIntegration, setEcoFlowIntegration] = useState("");
  const [isEcoFlow, setIsEcoFlow] = useState(false);

  const saveToStorage = (updated: InstallationWorkOrder[]) => {
    setInstallations(updated);
    localStorage.setItem("convoltaje_installations", JSON.stringify(updated));
  };

  const { deals, updateDeal, logOtActivity } = useCrmStore();
  const { items, deductReservedStock } = useInventoryStore();
  const { currentUser } = useAuthStore();

  // Toggle checklist item
  const handleToggleCheck = (instId: string, checkId: string) => {
    const updated = installations.map(inst => {
      if (inst.id === instId) {
        const updatedChecklist = inst.checklist.map(item => {
          if (item.id === checkId) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });

        // Si el checklist se completó al 100%, opcionalmente podemos ofrecer pasarlo a completada
        const allDone = updatedChecklist.every(item => item.completed);
        let newStatus = inst.status;
        if (allDone && inst.status === "en_curso") {
          newStatus = "completada";
          toast.success(`¡Obra de ${inst.clientName} lista! Se movió a Completadas.`);

          // Sincronizar con useCrmStore & useInventoryStore
          const targetDeal = deals.find(d => d.name.toLowerCase().includes(inst.clientName.toLowerCase()));
          if (targetDeal) {
            const fromSubstage = targetDeal.substage || 'en_instalacion';
            const toSubstage = 'instalacion_completada';
            const actorName = currentUser?.name || inst.tecnico || 'Técnico Yasiel';

            updateDeal(targetDeal.id, {
              substage: toSubstage,
            });

            // Descontar stock físico reservado en almacén
            if (targetDeal.company) {
              const lower = targetDeal.company.toLowerCase();
              items.forEach((item) => {
                if (lower.includes("inversor") && item.category === "Inversores") {
                  deductReservedStock(item.id, 1);
                } else if (lower.includes("batería") && item.category === "Baterías") {
                  deductReservedStock(item.id, 1);
                } else if (lower.includes("kit") && (item.category === "Accesorios" || item.category === "Estructuras")) {
                  deductReservedStock(item.id, 2);
                }
              });
            }

            logOtActivity(
              targetDeal.id,
              "Finalizó la instalación técnica (Stock Físico Descontado)",
              `Checklist al 100%. Obra completada satisfactoriamente por ${actorName}`,
              toSubstage,
              actorName,
              "tecnico"
            );

            makeService.dispatchOtSubstageEvent(
              targetDeal.otRef || targetDeal.id,
              fromSubstage,
              toSubstage,
              actorName
            );
          }
        } else if (!allDone && inst.status === "completada") {
          newStatus = "en_curso";
          toast.info(`Obra de ${inst.clientName} volvió a estado En Curso.`);
        }

        return { 
          ...inst, 
          status: newStatus,
          checklist: updatedChecklist 
        };
      }
      return inst;
    });

    saveToStorage(updated);
  };

  // Add new installation
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !phone || !date || !location || !description) {
      toast.error("Por favor, llena todos los campos obligatorios.");
      return;
    }

    const defaultChecklist = systemType.includes("Levantamiento") 
      ? [
          { id: "ch-1", label: "Inspección técnica de sitio (Levantamiento)", completed: false },
          { id: "ch-2", label: "Aprobación de croquis de anclaje por Yasiel", completed: false },
          { id: "ch-3", label: "Verificación de espacio en tablero de distribución", completed: false }
        ]
      : [
          { id: "ch-1", label: "Anclaje de estructuras y paneles", completed: false },
          { id: "ch-2", label: "Montaje de inversor y pizarra de protecciones", completed: false },
          { id: "ch-3", label: "Cableado solar certificado MC4 y conexión DC", completed: false },
          { id: "ch-4", label: "Pruebas de encendido, balance y transferencia AC", completed: false },
          { id: "ch-5", label: "Firma de acta y entrega de garantía de Convoltaje", completed: false }
        ];

    const isOnlyLevantamiento = systemType === "Levantamiento Técnico";

    const newInst: InstallationWorkOrder = {
      id: `inst-${Date.now()}`,
      clientName,
      systemType: isOnlyLevantamiento ? "Levantamiento Técnico" : systemType,
      phone,
      date,
      time: time || undefined,
      location,
      comercial,
      tecnico: "Yasiel (Director Técnico)",
      description,
      status: isOnlyLevantamiento ? "levantamiento" : "en_curso",
      ecoFlowIntegration: isEcoFlow && ecoFlowIntegration ? ecoFlowIntegration : undefined,
      checklist: defaultChecklist
    };

    const updated = [newInst, ...installations];
    saveToStorage(updated);
    
    // Reset Form
    setClientName("");
    setPhone("");
    setDate("");
    setTime("");
    setLocation("");
    setDescription("");
    setEcoFlowIntegration("");
    setIsEcoFlow(false);
    setShowAddForm(false);

    // Redirigir tab
    setActiveTab(isOnlyLevantamiento ? "levantamiento" : "en_curso");
    toast.success("Nuevo servicio agendado correctamente.");
  };

  // Delete installation
  const handleDelete = (id: string, clientName: string) => {
    if (confirm(`¿Estás seguro de eliminar el registro de ${clientName}?`)) {
      const updated = installations.filter(i => i.id !== id);
      saveToStorage(updated);
      toast.success("Registro eliminado.");
    }
  };

  // Filter list
  const filteredList = installations.filter(i => i.status === activeTab);

  return (
    <div className="w-full flex flex-col font-sans text-white pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">Control de Instalaciones</h2>
          <p className="text-white/60 text-xs">Monitoreo de levantamientos y montajes activos.</p>
        </div>
        
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#FF6B35] hover:bg-[#e05a2b] rounded-xl text-white transition-all shadow-lg shadow-[#FF6B35]/20"
        >
          <Plus size={14} />
          <span>{showAddForm ? "Cerrar" : "Nuevo"}</span>
        </button>
      </div>

      {/* Add New Installation Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="bg-[#0a1e3f]/80 border border-white/10 rounded-[24px] p-5 mb-6 space-y-4 animate-fade-in">
          <h3 className="text-sm font-bold text-[#00D9FF] border-b border-white/5 pb-2">Agendar Servicio / Obra</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Cliente *</label>
              <input 
                type="text" 
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                placeholder="Nombre completo"
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#00D9FF]/40"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Teléfono *</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+5355555555"
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#00D9FF]/40"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Comercial</label>
              <select 
                value={comercial}
                onChange={e => setComercial(e.target.value)}
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]/40"
              >
                <option value="Angel CEO">Angel CEO</option>
                <option value="Laura Vice">Laura Vice</option>
                <option value="José Luis Marketing">José Luis</option>
              </select>
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Servicio o Sistema *</label>
              <select 
                value={systemType}
                onChange={e => setSystemType(e.target.value)}
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]/40"
              >
                <option value="Levantamiento Técnico">Levantamiento Técnico (Solo Inspección)</option>
                <option value="Sistema Básico - 1500W">Sistema Básico - 1500W</option>
                <option value="Sistema Solar - Medio 3000W">Sistema Solar - Medio 3000W</option>
                <option value="Sistema Solar Aire Acondicionado 3000W">Sistema Solar AC 3000W</option>
                <option value="Sistema Híbrido 5000W">Sistema Híbrido 5000W</option>
                <option value="Sistema Avanzado 6000W">Sistema Avanzado 6000W</option>
                <option value="Sistema 6K PLUS">Sistema 6K PLUS</option>
                <option value="Sistema Premium 10000W">Sistema Premium 10000W</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Fecha *</label>
              <input 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Hora</label>
              <input 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Dirección Exacta *</label>
              <input 
                type="text" 
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Dirección y provincia"
                className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#00D9FF]/40"
                required
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] text-white/50 uppercase font-bold tracking-wider">Descripción del trabajo *</label>
              <textarea 
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Detalles sobre techado, placa, requerimientos..."
                rows={3}
                className="bg-black/35 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#00D9FF]/40 font-sans"
                required
              />
            </div>

            <div className="col-span-2 flex items-center gap-2 py-1 select-none">
              <input 
                type="checkbox" 
                id="ecoCheck" 
                checked={isEcoFlow}
                onChange={e => setIsEcoFlow(e.target.checked)}
                className="rounded border-white/20 accent-[#00D9FF]"
              />
              <label htmlFor="ecoCheck" className="text-xs text-white/70 cursor-pointer">¿Integra baterías EcoFlow existentes?</label>
            </div>

            {isEcoFlow && (
              <div className="flex flex-col gap-1 col-span-2 animate-fade-in">
                <label className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Especificaciones EcoFlow (Yasiel)</label>
                <input 
                  type="text" 
                  value={ecoFlowIntegration}
                  onChange={e => setEcoFlowIntegration(e.target.value)}
                  placeholder="Modelo y detalles técnicos de acople"
                  className="bg-black/35 border border-amber-500/20 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          <button 
            type="submit"
            className="w-full py-3 bg-[#FF6B35] hover:bg-[#e05a2b] rounded-xl text-xs font-bold text-white transition-all shadow-lg mt-2"
          >
            Agendar e Inicializar Obra
          </button>
        </form>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-1 bg-black/25 rounded-2xl p-1 border border-white/5 mb-6">
        {[
          { id: "levantamiento", label: "Levantamientos" },
          { id: "en_curso", label: "En Curso" },
          { id: "completada", label: "Completas" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setExpandedId(null);
            }}
            className={`rounded-xl py-2.5 text-xs font-bold transition-all text-center
              ${activeTab === tab.id 
                ? 'bg-[#00D9FF] text-[#0b1b33] shadow-md' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Work Orders List */}
      <div className="space-y-4">
        {filteredList.length > 0 ? (
          filteredList.map(inst => {
            const isExpanded = expandedId === inst.id;
            
            // Calculate progress percentage
            const totalChecks = inst.checklist.length;
            const completedChecks = inst.checklist.filter(c => c.completed).length;
            const progressPercent = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;

            // Border color class depending on status
            const borderClass = 
              inst.status === "levantamiento" ? "border-orange-500/20" :
              inst.status === "en_curso" ? "border-[#00D9FF]/20" : "border-emerald-500/20";

            return (
              <div 
                key={inst.id}
                className={`w-full bg-[#0a1e3f]/40 border ${borderClass} rounded-[24px] overflow-hidden shadow-lg transition-all duration-300`}
              >
                {/* Header */}
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : inst.id)}
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                      {inst.systemType}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold
                      ${inst.status === "levantamiento" ? "bg-orange-500/20 text-orange-400" :
                        inst.status === "en_curso" ? "bg-[#00D9FF]/20 text-[#00D9FF]" :
                        "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      {progressPercent}%
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-2">{inst.clientName}</h3>

                  <div className="flex flex-col gap-1.5 text-xs text-white/60">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-white/40" />
                      <span>{inst.date} {inst.time ? `· ${inst.time} hs` : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-white/40" />
                      <span className="truncate max-w-[240px]">{inst.location}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 rounded-full
                        ${inst.status === "levantamiento" ? "bg-orange-500" :
                          inst.status === "en_curso" ? "bg-[#00D9FF]" : "bg-emerald-500"
                        }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details Accordion */}
                {isExpanded && (
                  <div className="px-4 pb-5 pt-1 border-t border-white/5 bg-[#071630]/30 space-y-4 animate-fade-in">
                    
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs border-b border-white/5 pb-3">
                      <div>
                        <span className="text-[10px] text-white/40 block font-bold">COMERCIAL</span>
                        <span className="text-white font-medium">{formatEmployeeName(inst.comercial, teamMembers)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-white/40 block font-bold">INGENIERO / TÉCNICO</span>
                        <span className="text-white font-medium">{inst.tecnico ? formatEmployeeName(inst.tecnico, teamMembers) : "Pendiente"}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-white/40 block font-bold">DESCRIPCIÓN TÉCNICA</span>
                        <p className="text-white/70 leading-relaxed font-sans mt-0.5">{inst.description}</p>
                      </div>

                      <div className="col-span-2 pt-2 flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/10">
                        <div className="text-xs">
                          <span className="font-bold text-[#00D9FF]">Estado de Aceptación OT:</span>
                          <p className="text-white/70">Aceptar confirma la asignación para montaje y notifica al cliente.</p>
                        </div>
                        <button
                          onClick={() => {
                            makeService.dispatchOtSubstageEvent(inst.id, inst.status, 'en_instalacion', currentUser?.name || 'Técnico');
                            toast.success(`✅ OT "${inst.clientName}" aceptada correctamente.`);
                          }}
                          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 shrink-0"
                        >
                          ✅ Aceptar OT
                        </button>
                      </div>
                    </div>

                    {/* EcoFlow Integration Alert if applicable */}
                    {inst.ecoFlowIntegration && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-2 text-xs text-amber-300">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <strong className="block mb-0.5">Integración EcoFlow</strong>
                          {inst.ecoFlowIntegration}
                        </div>
                      </div>
                    )}

                    {/* Interactive Checklist */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-white/40 block font-bold tracking-wider mb-2">Checklist Técnico</span>
                      <div className="space-y-2 bg-black/25 rounded-2xl p-3 border border-white/5">
                        {inst.checklist.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => handleToggleCheck(inst.id, item.id)}
                            className="flex items-center gap-2.5 py-1.5 cursor-pointer select-none group"
                          >
                            {item.completed ? (
                              <CheckSquare size={16} className="text-[#00D9FF] shrink-0" />
                            ) : (
                              <Square size={16} className="text-white/30 group-hover:text-white/50 shrink-0" />
                            )}
                            <span className={`text-xs transition-colors
                              ${item.completed ? 'text-white/50 line-through' : 'text-white/95'}`}
                            >
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <a 
                        href={`tel:${inst.phone}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
                      >
                        <Phone size={14} />
                        <span>Llamar</span>
                      </a>
                      <button 
                        onClick={() => {
                          const message = `Hola ${inst.clientName}, te escribo de Convoltaje con respecto a la instalación de tu ${inst.systemType}.`;
                          const encodedMessage = encodeURIComponent(message);
                          const whatsappUrl = `https://wa.me/${inst.phone.replace(/\D/g, "")}?text=${encodedMessage}`;
                          window.open(whatsappUrl, "_blank");
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-xs font-bold text-white transition-all active:scale-[0.98]"
                      >
                        <MessageSquare size={14} />
                        <span>WhatsApp</span>
                      </button>
                      <button 
                        onClick={() => handleDelete(inst.id, inst.clientName)}
                        className="p-2.5 bg-red-950/40 border border-red-500/20 hover:bg-red-900/40 text-red-400 hover:text-red-300 rounded-xl transition-all"
                        title="Eliminar Obra"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center text-white/30 text-xs py-16">
            <ClipboardList size={28} className="mx-auto text-white/10 mb-2" />
            No hay servicios en estado {
              activeTab === "levantamiento" ? "Levantamientos" :
              activeTab === "en_curso" ? "En Curso" : "Completadas"
            }.
          </div>
        )}
      </div>

    </div>
  );
}
