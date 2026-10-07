import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { OFFICIAL_WHATSAPP_NUMBER } from '@/lib/products';

export interface TeamMember {
  id: string;
  name: string;
  role: 'admin' | 'comercial' | 'tecnico' | 'contable' | 'proyectista' | 'almacenero' | 'transportista';
  title: string;
  commissionPct: number; // % de comisión sobre ventas (0 si no aplica)
  phone?: string;
  email?: string;
  avatar?: string;
  isActive: boolean;
}

export function formatEmployeeName(nameOrId: string | undefined, teamMembers: TeamMember[]): string {
  if (!nameOrId) return 'Sin asignar';
  const cleanName = nameOrId.replace(/\s*\(ex-empleado\)$/i, '').trim();
  const member = teamMembers.find(m => m.name.toLowerCase() === cleanName.toLowerCase() || m.id === cleanName);
  if (member && !member.isActive) {
    return `${member.name} (ex-empleado)`;
  }
  return nameOrId;
}

export interface WhatsAppTemplate {
  id: string;
  label: string;       // Nombre descriptivo (ej. "Bienvenida al cliente")
  category: 'bienvenida' | 'cobro' | 'instalacion' | 'queja' | 'seguimiento';
  body: string;        // Texto del mensaje
}

export interface SettingsState {
  // Tasa de cambio
  tasaCambioUSD: number;  // CUP por 1 USD (referencia El Toque + ajuste manual)
  tasaCambioMLC: number;  // CUP por 1 MLC
  lastRateUpdate: string; // Timestamp de la última actualización manual

  // Equipo y comisiones
  teamMembers: TeamMember[];

  // Plantillas de WhatsApp
  whatsappTemplates: WhatsAppTemplate[];

  // Acciones
  setTasaCambioUSD: (rate: number) => void;
  setTasaCambioMLC: (rate: number) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  removeTeamMember: (id: string) => void;
  updateTemplate: (id: string, updates: Partial<WhatsAppTemplate>) => void;
  addTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => void;
  removeTemplate: (id: string) => void;
}

const defaultTeam: TeamMember[] = [
  { id: 'tm-1', name: 'Ángel Eduardo', role: 'admin',     title: 'CEO / Dueño',           commissionPct: 0,  phone: OFFICIAL_WHATSAPP_NUMBER, isActive: true },
  { id: 'tm-2', name: 'Laura',         role: 'admin',     title: 'Vice Directora',         commissionPct: 0,  phone: '',           isActive: true },
  { id: 'tm-3', name: 'José Luis',     role: 'admin',     title: 'Administrador Ejecutivo',commissionPct: 0,  phone: OFFICIAL_WHATSAPP_NUMBER, isActive: true },
  { id: 'tm-5', name: 'Yasiel',        role: 'tecnico',   title: 'Director Técnico',       commissionPct: 3,  phone: '',           isActive: true },
  { id: 'tm-6', name: 'Daniel',        role: 'tecnico',   title: 'Técnico - Pinar del Río',commissionPct: 3,  phone: '',           isActive: true },
  { id: 'tm-7', name: 'Anabel',        role: 'comercial', title: 'Comercial - Mayabeque',  commissionPct: 5,  phone: '',           isActive: true },
  { id: 'tm-8', name: 'Isabel',        role: 'comercial', title: 'Comercial - Artemisa',   commissionPct: 5,  phone: '',           isActive: true },
];

const defaultTemplates: WhatsAppTemplate[] = [
  {
    id: 'tpl-1',
    label: 'Bienvenida al cliente',
    category: 'bienvenida',
    body: `Hola {nombre} 👋 Soy {agente} de *Convoltaje*. Gracias por confiar en nosotros para tu sistema de energía solar. Estamos aquí para acompañarte en cada paso del proceso. ¿Tiene alguna pregunta inicial?`
  },
  {
    id: 'tpl-2',
    label: 'Confirmación de instalación',
    category: 'instalacion',
    body: `Hola {nombre} ☀️ Le recordamos que su instalación está programada para *{fecha}* a las *{hora}*. El técnico asignado es *{tecnico}*. Por favor, asegúrese de que el área de trabajo esté despejada. Ante cualquier cambio, comuníquese con nosotros.`
  },
  {
    id: 'tpl-3',
    label: 'Cobro pendiente',
    category: 'cobro',
    body: `Hola {nombre} 💳 Le recordamos que tiene un pago pendiente de *{monto}* correspondiente a *{concepto}*. Puede realizarlo vía Transfermóvil o Enzona al número *{numero_pago}*. ¡Gracias!`
  },
  {
    id: 'tpl-4',
    label: 'Seguimiento post-instalación',
    category: 'seguimiento',
    body: `Hola {nombre} 🔆 Han pasado *{dias} días* desde su instalación. ¿Cómo está funcionando su sistema solar? ¿Tiene alguna duda o necesita asistencia técnica? Estamos a su disposición.`
  },
  {
    id: 'tpl-5',
    label: 'Respuesta a queja',
    category: 'queja',
    body: `Hola {nombre}, lamentamos el inconveniente reportado. Hemos registrado su caso y un técnico se comunicará con usted antes de las *{hora_limite}* de hoy para darle solución. Pedimos disculpas por las molestias causadas.`
  },
];

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tasaCambioUSD: 675,
      tasaCambioMLC: 185,
      lastRateUpdate: new Date().toISOString(),

      teamMembers: defaultTeam,
      whatsappTemplates: defaultTemplates,

      setTasaCambioUSD: (rate) =>
        set({ tasaCambioUSD: rate, lastRateUpdate: new Date().toISOString() }),

      setTasaCambioMLC: (rate) =>
        set({ tasaCambioMLC: rate, lastRateUpdate: new Date().toISOString() }),

      updateTeamMember: (id, updates) =>
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      addTeamMember: (member) =>
        set((state) => ({
          teamMembers: [
            ...state.teamMembers,
            { ...member, id: `tm-${Date.now()}` },
          ],
        })),

      removeTeamMember: (id) =>
        set((state) => ({
          teamMembers: state.teamMembers.filter((m) => m.id !== id),
        })),

      updateTemplate: (id, updates) =>
        set((state) => ({
          whatsappTemplates: state.whatsappTemplates.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      addTemplate: (template) =>
        set((state) => ({
          whatsappTemplates: [
            ...state.whatsappTemplates,
            { ...template, id: `tpl-${Date.now()}` },
          ],
        })),

      removeTemplate: (id) =>
        set((state) => ({
          whatsappTemplates: state.whatsappTemplates.filter((t) => t.id !== id),
        })),
    }),
    { name: 'convoltaje-settings-storage' }
  )
);
