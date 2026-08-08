import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../lib/services/authService';

export type UserRole = 'comercial' | 'tecnico' | 'contable' | 'admin' | 'transportista' | 'proyectista' | 'almacenero' | 'comprador' | 'designado';

export interface UserSession {
  id: string;
  name: string;
  role: UserRole;
  title: string; // Título o cargo real en la empresa
  avatar: string;
  avatarOrigin?: string; // Dirección del zoom (ej: 'center 25%')
  avatarZoom?: number;   // Escala de zoom (ej: 2.2)
  clientsCount?: number;
  reviewsCount?: number;
  phone?: string;
}

interface AuthState {
  currentUser: UserSession | null;
  availableUsers: UserSession[];
  isLoading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  login: (userId: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      availableUsers: [],
      isLoading: false,
      error: null,
      
      fetchUsers: async () => {
        set({ isLoading: true, error: null });
        try {
          const profiles = await authService.getProfiles();
          set({ availableUsers: profiles, isLoading: false });
        } catch (error: any) {
          console.error("Error al cargar perfiles:", error);
          set({ error: error.message, isLoading: false });
        }
      },

      login: (userId: string) => set((state) => {
        const user = state.availableUsers.find(u => u.id === userId);
        return { currentUser: user || null };
      }),
      
      logout: () => set({ currentUser: null })
    }),
    {
      name: 'convoltaje-auth-storage-v3',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
