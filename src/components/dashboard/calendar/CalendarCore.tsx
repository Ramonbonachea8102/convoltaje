import { useState, useEffect } from "react";
import { format, addMonths, subMonths, addDays, subDays, addWeeks, subWeeks, startOfWeek, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Download, Calendar as CalendarIcon, Clock, MapPin, User, FileText } from "lucide-react";
import MonthView from "./MonthView";
import EventModal from "./EventModal";
import { useCalendarStore, CalendarEvent } from "@/hooks/useCalendarStore";
import { useCrmStore } from "@/hooks/useCrmStore";
import { useAuthStore } from "@/hooks/useAuthStore";
import { makeService } from "@/lib/services/makeService";
import { toast } from "sonner";

type CalendarViewMode = 'semana' | 'mes' | 'hoy' | 'manana';

// Helpers para generar textos y colores de píldoras al estilo de la imagen de referencia
const getEventUserCode = (event: CalendarEvent) => {
  if (event.clientName) {
    const hash = event.clientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const num = (hash % 9) + 1;
    return `user0${num}`;
  }
  const num = (parseInt(event.id.replace(/\D/g, '')) % 9) + 1 || 1;
  return `user0${num}`;
};

const getEventSystemCode = (event: CalendarEvent) => {
  const title = event.title.toLowerCase();
  
  if (title.includes("6k") || title.includes("6000w")) return "6kplus";
  if (title.includes("3000w") || title.includes("medio")) return "3kplus";
  if (title.includes("1.5") || title.includes("1500w") || title.includes("básico")) return "1.5";
  if (title.includes("10kw") || title.includes("10000w") || title.includes("premium")) return "10k";
  if (title.includes("híbrido") || title.includes("5000w")) return "5k hybr";
  if (title.includes("levantamiento") || title.includes("factibilidad")) return "Levantam.";
  if (title.includes("panel") || title.includes("ecoflow")) return "Panel Ecof";
  if (title.includes("batería")) return "Baterías";
  if (title.includes("diagnóstico") || title.includes("error")) return "Soporte Tec";
  
  const cleanTitle = event.title.replace(/[^a-zA-Z0-9\s]/g, '');
  const words = cleanTitle.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    return words.slice(0, 2).join(' ');
  }
  return "Obra";
};

const getEventPillColor = (event: CalendarEvent) => {
  const code = getEventSystemCode(event);
  
  switch (code) {
    case "3kplus":
      return "bg-[#00FF66] text-[#0b1b33] hover:bg-[#00e55b]";
    case "6kplus":
      return "bg-[#1b8040] text-white hover:bg-[#156633]";
    case "1.5":
      return "bg-[#0a4d26] text-emerald-100 hover:bg-[#07361a]";
    case "Panel Ecof":
      return "bg-[#00D9FF] text-[#0b1b33] hover:bg-[#00c5e6]";
    case "Levantam.":
      return "bg-[#FF6B35] text-white hover:bg-[#e05f2f]";
    default:
      return "bg-slate-700 text-slate-100 hover:bg-slate-800";
  }
};

export default function CalendarCore() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('semana');
  const [activeWeekDay, setActiveWeekDay] = useState(new Date()); // Día activo dentro de la vista de semana
  const [expandedDayStr, setExpandedDayStr] = useState<string | null>(format(new Date(), "yyyy-MM-dd"));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const { events, addEvent, updateEvent, deleteEvent, fetchEvents } = useCalendarStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePrevious = () => {
    if (viewMode === 'mes') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === 'semana') {
      const prevWeek = subWeeks(activeWeekDay, 1);
      setActiveWeekDay(prevWeek);
      setCurrentDate(prevWeek);
    } else if (viewMode === 'hoy' || viewMode === 'manana') {
      const prevDay = subDays(currentDate, 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (viewMode === 'mes') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === 'semana') {
      const nextWeek = addWeeks(activeWeekDay, 1);
      setActiveWeekDay(nextWeek);
      setCurrentDate(nextWeek);
    } else if (viewMode === 'hoy' || viewMode === 'manana') {
      const nextDay = addDays(currentDate, 1);
      setCurrentDate(nextDay);
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setActiveWeekDay(today);
  };

  const handleAddClick = () => {
    setSelectedEvent(undefined);
    setSelectedDate(viewMode === 'semana' ? activeWeekDay : currentDate);
    setIsModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setSelectedEvent(undefined);
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setSelectedDate(new Date(event.date + "T12:00:00"));
    setIsModalOpen(true);
  };

  const { deals, updateDeal, logOtActivity } = useCrmStore();
  const { currentUser } = useAuthStore();

  const handleSaveEvent = (eventData: any) => {
    if (selectedEvent) {
      updateEvent(selectedEvent.id, eventData);
    } else {
      addEvent(eventData);
    }

    // Sincronizar fecha y sub-etapa con la OT del cliente si coincide
    if (eventData.clientName || eventData.title) {
      const targetDeal = deals.find(
        (d) =>
          (eventData.clientName && d.name.toLowerCase().includes(eventData.clientName.toLowerCase())) ||
          (eventData.title && d.company.toLowerCase().includes(eventData.title.toLowerCase()))
      );

      if (targetDeal) {
        const fromSubstage = targetDeal.substage || 'lead_nuevo';
        const toSubstage = 'fecha_agendada';
        const actorName = currentUser?.name || 'Comercial';

        updateDeal(targetDeal.id, {
          expectedDate: eventData.date,
          substage: toSubstage,
        });

        logOtActivity(
          targetDeal.id,
          "Agendó/reprogramó fecha de instalación en Calendario",
          `Fecha de obra fijada para ${eventData.date} (${eventData.time || 'Horario laboral'})`,
          toSubstage,
          actorName,
          "comercial"
        );

        makeService.dispatchOtSubstageEvent(
          targetDeal.otRef || targetDeal.id,
          fromSubstage,
          toSubstage,
          actorName
        );
      }
    }

    setIsModalOpen(false);
  };

  // Obtener los 7 días de la semana activa
  const getWeekDays = () => {
    const start = startOfWeek(activeWeekDay, { weekStartsOn: 1 }); // Empezar en Lunes
    return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
  };

  const weekDays = getWeekDays();

  // Filtrar eventos para una fecha específica (formato YYYY-MM-DD)
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const formatted = format(date, "yyyy-MM-dd");
    const calendarEvents = events.filter(e => e.date === formatted);

    // Sincronizar OTs del CRM que tengan esta fecha de inicio
    const crmEvents: CalendarEvent[] = deals
      .filter(
        d =>
          d.expectedDate === formatted &&
          !calendarEvents.some(ce => ce.clientName === d.name || ce.title.includes(d.name))
      )
      .map(d => ({
        id: `crm-${d.id}`,
        title: `${d.otRef ? `[${d.otRef}] ` : ''}${d.company || 'Obra Solar'}`,
        date: d.expectedDate,
        time: "09:00",
        clientName: d.name,
        location: d.address || "Dirección de cliente",
        description: `OT del CRM (${d.substage || d.stage}). Presupuesto: $${d.value} USD.`
      }));

    return [...calendarEvents, ...crmEvents];
  };

  // Renderizar la lista de eventos del día seleccionado
  const renderEventsList = (targetDate: Date) => {
    const dayEvents = getEventsForDate(targetDate);
    
    return (
      <div className="space-y-3 mt-4">
        {dayEvents.length > 0 ? (
          dayEvents.map(event => (
            <button
              key={event.id}
              onClick={() => handleEventClick(event)}
              className="w-full text-left p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all flex flex-col gap-2 group active:scale-[0.99] shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#00D9FF] flex items-center gap-1">
                  <Clock size={12} />
                  {event.time || "Todo el día"}
                </span>
                <span className="text-[10px] text-white/30 font-mono">ID: {event.id}</span>
              </div>
              
              <h4 className="text-sm font-bold text-white group-hover:text-[#00D9FF] transition-colors">
                {event.title}
              </h4>
              
              {event.clientName && (
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <User size={12} className="text-white/40" />
                  <span>Cliente: <strong className="text-white/80">{event.clientName}</strong></span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-1.5 text-xs text-white/60">
                  <MapPin size={12} className="text-white/40" />
                  <span>Lugar: <span className="text-white/80 truncate">{event.location}</span></span>
                </div>
              )}

              {event.description && (
                <p className="text-xs text-white/50 leading-relaxed bg-black/20 rounded-xl p-2.5 border border-white/5 mt-1 font-sans">
                  {event.description}
                </p>
              )}
            </button>
          ))
        ) : (
          <div className="border border-dashed border-white/10 rounded-2xl p-8 text-center text-white/30 text-xs py-12">
            No hay trabajos agendados para este día.
          </div>
        )}
      </div>
    );
  };

  const handleCopyWhatsAppSummary = () => {
    const activeDate = viewMode === 'semana' ? activeWeekDay : currentDate;
    const formattedDate = format(activeDate, "yyyy-MM-dd");
    const dateLabel = format(activeDate, "eeee d 'de' MMMM, yyyy", { locale: es });
    const dayEvents = getEventsForDate(activeDate);

    let summaryText = `☀️ *CONVOLTAJE - RESUMEN DE OBRAS*\n📅 *Fecha:* ${dateLabel}\n-----------------------------------\n`;

    if (dayEvents.length === 0) {
      summaryText += `Sin servicios ni instalaciones agendadas para esta fecha.`;
    } else {
      dayEvents.forEach((evt, idx) => {
        summaryText += `\n*${idx + 1}. ${evt.title}*\n`;
        summaryText += `⏱️ *Hora:* ${evt.time || '09:00 hs'}\n`;
        if (evt.clientName) summaryText += `👤 *Cliente:* ${evt.clientName}\n`;
        if (evt.location) summaryText += `📍 *Lugar:* ${evt.location}\n`;
        if (evt.description) summaryText += `📝 *Detalles:* ${evt.description}\n`;
      });
    }

    navigator.clipboard.writeText(summaryText);
    toast.success('📋 Resumen copiado al portapapeles para WhatsApp.');
  };

  return (
    <div className="w-full flex flex-col font-sans text-white pb-12">
      
      {/* Controles del Cabezal del Calendario */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-0.5">Calendario de Obras</h2>
            <p className="text-white/60 text-xs">Plan de trabajo y logística técnica.</p>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleCopyWhatsAppSummary}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 rounded-xl text-slate-950 transition-all shadow-md"
              title="Copiar Resumen para WhatsApp"
            >
              <FileText size={14} />
              <span>WhatsApp</span>
            </button>
            <button 
              onClick={handleAddClick}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#FF6B35] hover:bg-[#e05a2b] rounded-xl text-white transition-all shadow-lg shadow-[#FF6B35]/20"
            >
              <Plus size={14} />
              <span>Nuevo</span>
            </button>
          </div>
        </div>

        {/* Selector de Modos de Vista */}
        <div className="grid grid-cols-4 gap-1 bg-black/25 rounded-2xl p-1 border border-white/5">
          {(['semana', 'mes', 'hoy', 'manana'] as CalendarViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => {
                setViewMode(mode);
                if (mode === 'hoy') {
                  setCurrentDate(new Date());
                } else if (mode === 'manana') {
                  setCurrentDate(addDays(new Date(), 1));
                }
              }}
              className={`rounded-xl py-2 text-xs font-bold transition-all capitalize
                ${viewMode === mode 
                  ? 'bg-[#00D9FF] text-[#0b1b33] shadow-md' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
            >
              {mode === 'manana' ? 'Mañana' : mode}
            </button>
          ))}
        </div>

        {/* Navegador de Fecha */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
          <button 
            onClick={handlePrevious}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          
          <span className="text-sm font-bold capitalize">
            {viewMode === 'mes' 
              ? format(currentDate, "MMMM yyyy", { locale: es })
              : viewMode === 'semana'
                ? `Semana del ${format(weekDays[0], "d 'de' MMMM", { locale: es })}`
                : format(viewMode === 'hoy' ? new Date() : viewMode === 'manana' ? addDays(new Date(), 1) : currentDate, "EEEE, d 'de' MMMM", { locale: es })}
          </span>

          <button 
            onClick={handleNext}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Renderizado de Vistas */}
      <div className="space-y-4">
        
        {/* Vista Semanal (Default con diseño móvil vertical de tarjetas y acordeón) */}
        {viewMode === 'semana' && (
          <div className="space-y-4 max-w-md mx-auto w-full">
            {weekDays.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const isExpanded = expandedDayStr === dateStr;
              const dayEvents = getEventsForDate(day);
              const dayName = format(day, "EEEE", { locale: es });
              const dayNumber = format(day, "dd");
              
              return (
                <div 
                  key={dateStr}
                  className="w-full bg-[#0a1e3f]/40 border border-white/10 rounded-[24px] overflow-hidden shadow-lg transition-all duration-300"
                >
                  {/* Header de la Tarjeta del Día */}
                  <div 
                    onClick={() => {
                      setExpandedDayStr(isExpanded ? null : dateStr);
                      setActiveWeekDay(day);
                    }}
                    className="w-full text-center py-4 bg-[#0a2e6b] border-b border-white/5 cursor-pointer hover:bg-[#0c367c] transition-colors flex items-center justify-between px-6 select-none"
                  >
                    <div className="w-6" /> {/* Espaciador para centrar el título */}
                    <span className="font-display font-black tracking-wider text-base text-white uppercase text-center flex-1">
                      {dayName} {dayNumber}
                    </span>
                    <span className="text-[10px] bg-white/15 text-white/90 px-2 py-0.5 rounded-full font-mono font-bold min-w-5 text-center">
                      {dayEvents.length}
                    </span>
                  </div>

                  {/* Body: Píldoras apiladas (si está colapsado) o Detalle de Tareas (si está expandido) */}
                  <div className="p-4 bg-[#071630]/30">
                    {dayEvents.length > 0 ? (
                      <>
                        {/* Vista Colapsada: píldoras compactas apiladas como en la imagen */}
                        {!isExpanded && (
                          <div 
                            onClick={() => {
                              setExpandedDayStr(dateStr);
                              setActiveWeekDay(day);
                            }}
                            className="flex flex-col gap-2 cursor-pointer max-w-[280px] mx-auto py-1"
                          >
                            {dayEvents.map((event) => {
                              const userCode = getEventUserCode(event);
                              const systemCode = getEventSystemCode(event);
                              const pillColorClass = getEventPillColor(event);
                              
                              return (
                                <div 
                                  key={event.id}
                                  className={`w-full py-2.5 px-4 rounded-[14px] text-center text-xs font-black shadow-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-1 ${pillColorClass}`}
                                >
                                  <span>{userCode}</span>
                                  <span>·</span>
                                  <span className="truncate max-w-[180px]">{systemCode}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Vista Expandida: detalle de tareas con transición */}
                        {isExpanded && (
                          <div className="animate-fade-in space-y-3">
                            <div className="space-y-3">
                              {dayEvents.map(event => (
                                <button
                                  key={event.id}
                                  onClick={() => handleEventClick(event)}
                                  className="w-full text-left p-4 rounded-[20px] bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#00D9FF]/40 transition-all flex flex-col gap-2.5 group active:scale-[0.99] shadow-md"
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-xs font-bold text-[#00D9FF] flex items-center gap-1">
                                      <Clock size={12} />
                                      {event.time || "Todo el día"}
                                    </span>
                                    <span className="text-[9px] text-white/30 font-mono">ID: {event.id}</span>
                                  </div>
                                  
                                  <h4 className="text-sm font-bold text-white group-hover:text-[#00D9FF] transition-colors leading-snug">
                                    {event.title}
                                  </h4>
                                  
                                  {event.clientName && (
                                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                                      <User size={12} className="text-white/40" />
                                      <span>Cliente: <strong className="text-white/80">{event.clientName}</strong></span>
                                    </div>
                                  )}

                                  {event.location && (
                                    <div className="flex items-center gap-1.5 text-xs text-white/60">
                                      <MapPin size={12} className="text-white/40" />
                                      <span>Lugar: <span className="text-white/80 truncate max-w-[200px]">{event.location}</span></span>
                                    </div>
                                  )}

                                  {event.description && (
                                    <p className="text-xs text-white/50 leading-relaxed bg-black/20 rounded-xl p-3 border border-white/5 mt-1 font-sans">
                                      {event.description}
                                    </p>
                                  )}
                                </button>
                              ))}
                            </div>
                            
                            {/* Botón para contraer la tarjeta */}
                            <div className="pt-2 text-center">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedDayStr(null);
                                }}
                                className="text-[11px] text-white/40 hover:text-white transition-colors py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[14px] inline-flex items-center gap-1 font-bold shadow-sm"
                              >
                                Contraer Vista
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="p-4 text-center text-white/20 text-xs py-8 border border-dashed border-white/5 rounded-[18px]">
                        Sin tareas agendadas
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Vista Mensual */}
        {viewMode === 'mes' && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
            <MonthView 
              currentDate={currentDate} 
              events={events} 
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          </div>
        )}

        {/* Vista Hoy */}
        {viewMode === 'hoy' && (
          <div>
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              Agenda de Hoy ({format(new Date(), "d 'de' MMMM", { locale: es })})
            </h3>
            {renderEventsList(new Date())}
          </div>
        )}

        {/* Vista Mañana */}
        {viewMode === 'manana' && (
          <div>
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">
              Agenda de Mañana ({format(addDays(new Date(), 1), "d 'de' MMMM", { locale: es })})
            </h3>
            {renderEventsList(addDays(new Date(), 1))}
          </div>
        )}

      </div>

      {/* Modal de edición/adición de evento */}
      <EventModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
        onDelete={selectedEvent ? () => { deleteEvent(selectedEvent.id); setIsModalOpen(false); } : undefined}
        initialDate={selectedDate}
        event={selectedEvent}
      />

    </div>
  );
}
