import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RaffleEdition {
  id: string;
  name: string;
  frequency: 'semanal' | 'mensual';
  frequencyLabel: string;
  prize: string;
  nextDrawDate: string; // YYYY-MM-DD
  isActive: boolean;
}

export interface GamifiedMission {
  id: string;
  title: string;
  description: string;
  extraChances: number;
  completed: boolean;
}

export interface ParticipantLead {
  id: string;
  ticketNumber: string; // e.g. CV-A1234
  name: string;
  email: string;
  phone?: string;
  provider: 'email' | 'google' | 'facebook';
  editionId: string;
  chances: number; // Cantidad de participaciones acumuladas para la rifa
  level: number; // Gamification Level
  points: number;
  badges: string[];
  completedMissions: string[];
  createdAt: string;
  lastVisitAt: string;
  lastCheckInDate?: string; // YYYY-MM-DD para check-in diario/recurrente
  visitStreak: number; // Días o semanas consecutivas visitando la web
}

interface ParticipationState {
  currentParticipant: ParticipantLead | null;
  participantsList: ParticipantLead[];
  activeRaffle: RaffleEdition;
  
  // Actions
  registerLead: (data: {
    name: string;
    email: string;
    phone?: string;
    provider?: 'email' | 'google' | 'facebook';
  }) => ParticipantLead;

  claimMission: (missionId: string, extraChances: number) => void;
  checkInVisit: () => { success: boolean; message: string; chancesAdded: number };
  setRaffleFrequency: (frequency: 'semanal' | 'mensual') => void;
  updateLastVisit: () => void;
  logoutParticipant: () => void;
}

export const DEFAULT_RAFFLE: RaffleEdition = {
  id: 'raffle-solar-activa',
  name: 'Sorteo Solar Convoltaje',
  frequency: 'semanal',
  frequencyLabel: 'Edición Semanal',
  prize: 'Kit de Iluminación Solar + Bono de $250 USD en Instalación',
  nextDrawDate: 'Este Domingo a las 20:00',
  isActive: true,
};

// Generador de ticket único y elegante alfanumérico
function generateTicketCode(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 dígitos
  const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `CV-${randomLetter}${randomSuffix}`;
}

export const useParticipationStore = create<ParticipationState>()(
  persist(
    (set, get) => ({
      currentParticipant: null,
      participantsList: [],
      activeRaffle: DEFAULT_RAFFLE,

      registerLead: (data) => {
        const existing = get().participantsList.find(
          (p) => p.email.toLowerCase() === data.email.trim().toLowerCase()
        );

        if (existing) {
          set({ currentParticipant: existing });
          return existing;
        }

        const newTicketNumber = generateTicketCode();
        const todayStr = new Date().toISOString().split('T')[0];

        const newLead: ParticipantLead = {
          id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ticketNumber: newTicketNumber,
          name: data.name.trim(),
          email: data.email.trim(),
          phone: data.phone?.trim() || '',
          provider: data.provider || 'email',
          editionId: get().activeRaffle.id,
          chances: 1, // 1 participación inicial garantizada
          level: 1,
          points: 100,
          badges: ['Pionero Solar ☀️'],
          completedMissions: ['registro_inicial'],
          createdAt: new Date().toISOString(),
          lastVisitAt: new Date().toISOString(),
          lastCheckInDate: todayStr,
          visitStreak: 1,
        };

        set((state) => ({
          currentParticipant: newLead,
          participantsList: [newLead, ...state.participantsList],
        }));

        return newLead;
      },

      checkInVisit: () => {
        const participant = get().currentParticipant;
        if (!participant) {
          return { success: false, message: 'Regístrate primero para reclamar chances.', chancesAdded: 0 };
        }

        const todayStr = new Date().toISOString().split('T')[0];
        if (participant.lastCheckInDate === todayStr) {
          return { 
            success: false, 
            message: '¡Ya reclamaste tu chance de visita de hoy! Vuelve mañana o la próxima semana para seguir acumulando.', 
            chancesAdded: 0 
          };
        }

        const newStreak = (participant.visitStreak || 0) + 1;
        const extraChances = newStreak % 5 === 0 ? 2 : 1; // Bonus cada 5 visitas

        const updated: ParticipantLead = {
          ...participant,
          chances: participant.chances + extraChances,
          points: participant.points + extraChances * 50,
          lastCheckInDate: todayStr,
          visitStreak: newStreak,
          lastVisitAt: new Date().toISOString(),
        };

        set((state) => ({
          currentParticipant: updated,
          participantsList: state.participantsList.map((p) =>
            p.id === participant.id ? updated : p
          ),
        }));

        return {
          success: true,
          message: `¡+${extraChances} Chance acreditada por visitar la web! Racha de visitas: ${newStreak} días.`,
          chancesAdded: extraChances,
        };
      },

      setRaffleFrequency: (frequency) => {
        set((state) => ({
          activeRaffle: {
            ...state.activeRaffle,
            frequency,
            frequencyLabel: frequency === 'semanal' ? 'Edición Semanal' : 'Edición Mensual',
            nextDrawDate: frequency === 'semanal' ? 'Este Domingo a las 20:00' : 'Fin de mes a las 20:00',
          },
        }));
      },

      claimMission: (missionId, extraChances) => {
        const participant = get().currentParticipant;
        if (!participant) return;

        if (participant.completedMissions.includes(missionId)) return;

        const updatedMissions = [...participant.completedMissions, missionId];
        const updatedChances = participant.chances + extraChances;
        const updatedPoints = participant.points + extraChances * 50;
        const newLevel = updatedMissions.length >= 3 ? 3 : updatedMissions.length >= 2 ? 2 : 1;

        const updatedParticipant: ParticipantLead = {
          ...participant,
          chances: updatedChances,
          points: updatedPoints,
          level: newLevel,
          completedMissions: updatedMissions,
        };

        set((state) => ({
          currentParticipant: updatedParticipant,
          participantsList: state.participantsList.map((p) =>
            p.id === participant.id ? updatedParticipant : p
          ),
        }));
      },

      updateLastVisit: () => {
        const participant = get().currentParticipant;
        if (!participant) return;

        const updated: ParticipantLead = {
          ...participant,
          lastVisitAt: new Date().toISOString(),
        };

        set((state) => ({
          currentParticipant: updated,
          participantsList: state.participantsList.map((p) =>
            p.id === participant.id ? updated : p
          ),
        }));
      },

      logoutParticipant: () => {
        set({ currentParticipant: null });
      },
    }),
    {
      name: 'convoltaje-raffle-participation-v1',
    }
  )
);
