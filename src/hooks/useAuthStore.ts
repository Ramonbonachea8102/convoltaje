import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../lib/services/authService';

export type UserRole = 'comercial' | 'tecnico' | 'contable' | 'admin' | 'ceo' | 'transportista' | 'proyectista' | 'almacenero' | 'comprador' | 'designado';

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
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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

      loginWithCredentials: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const authData = await authService.signInWithEmailPassword(email, password);
          const profiles = get().availableUsers.length > 0 ? get().availableUsers : await authService.getProfiles();
          
          // Buscar perfil asociado por ID de Supabase Auth o por Email
          const userProfile = profiles.find(
            p => p.id === authData.user?.id || p.name.toLowerCase() === email.split('@')[0].toLowerCase()
          ) || {
            id: authData.user?.id || 'auth-user',
            name: authData.user?.email?.split('@')[0] || 'Usuario Autenticado',
            role: (authData.user?.user_metadata?.role as UserRole) || 'comercial',
            title: 'Miembro del Equipo',
            avatar: '',
          };

          set({ currentUser: userProfile, isLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Error al iniciar sesión', isLoading: false });
          return false;
        }
      },

      sendPasswordReset: async (email: string) => {
        set({ isLoading: true, error: null });
        try {
          await authService.sendPasswordResetEmail(email);
          set({ isLoading: false });
          return true;
        } catch (err: any) {
          set({ error: err.message || 'Error al enviar invitación/restablecimiento', isLoading: false });
          return false;
        }
      },
      
      logout: async () => {
        try {
          await authService.signOut();
        } catch (e) {
          console.warn('Error durante el cierre de sesión de Supabase:', e);
        }
        set({ currentUser: null, error: null });
      }
    }),
    {
      name: 'convoltaje-auth-storage-v3',
      partialize: (state) => ({ currentUser: state.currentUser }),
    }
  )
);
