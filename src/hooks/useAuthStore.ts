import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../lib/services/authService';
import { supabase } from '../lib/supabase';

export type UserRole = 'superadmin' | 'comercial' | 'tecnico' | 'contable' | 'admin' | 'ceo' | 'transportista' | 'proyectista' | 'almacenero' | 'comprador' | 'designado';

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
          const cleanEmail = email.trim().toLowerCase();
          const authData = await authService.signInWithEmailPassword(cleanEmail, password);

          if (!authData?.user) {
            throw new Error('No se recibió la sesión del usuario de Supabase Auth.');
          }

          // Consultar perfil real canónico en public.perfiles
          const { data: profile, error: profileErr } = await supabase
            .from('perfiles')
            .select('*')
            .or(`id.eq.${authData.user.id},email.eq.${cleanEmail}`)
            .eq('activo', true)
            .maybeSingle();

          if (profileErr) {
            console.error('Error al consultar perfil en Supabase:', profileErr);
            throw new Error(`Error verificando perfil: ${profileErr.message}`);
          }

          if (!profile) {
            await authService.signOut();
            throw new Error('Acceso denegado: tu cuenta no tiene un perfil administrativo activo registrado en ConVoltaje.');
          }

          const userProfile: UserSession = {
            id: profile.id,
            name: profile.nombre || cleanEmail.split('@')[0],
            role: profile.rol as UserRole,
            title: profile.descripcion_corta || 'Administrador',
            avatar: profile.foto_url || '',
            clientsCount: profile.total_instalaciones || 0,
            reviewsCount: profile.calificacion_promedio ? Math.round(Number(profile.calificacion_promedio)) : 0,
            phone: profile.telefono || '',
          };

          set({ currentUser: userProfile, isLoading: false, error: null });
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
