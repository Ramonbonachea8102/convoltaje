import { supabase } from '../supabase';
import { UserSession, UserRole } from '../../hooks/useAuthStore';

const MOCK_PROFILES: UserSession[] = [
  { id: "1", name: "Ángel Eduardo", role: "admin", title: "CEO / Dueño", avatar: "", phone: "+5355144097", clientsCount: 0, reviewsCount: 0 },
  { id: "2", name: "Laura", role: "admin", title: "Vice Directora", avatar: "", phone: "+5355144097", clientsCount: 0, reviewsCount: 0 },
  { id: "3", name: "José Luis", role: "contable", title: "Contador / Marketing", avatar: "", phone: "+5355144097", clientsCount: 0, reviewsCount: 0 },
  { id: "4", name: "Samuel", role: "proyectista", title: "Proyectista Técnico", avatar: "", phone: "+5355144097", clientsCount: 15, reviewsCount: 10 },
  { id: "5", name: "Yasiel", role: "tecnico", title: "Director Técnico", avatar: "", phone: "+5355144097", clientsCount: 30, reviewsCount: 25 },
  { id: "6", name: "Niurki", role: "comercial", title: "Asesora Comercial", avatar: "", phone: "+5355144097", clientsCount: 15, reviewsCount: 45 },
  { id: "7", name: "Diana Rosa", role: "comercial", title: "Asesora Comercial", avatar: "", phone: "+5355144097", clientsCount: 12, reviewsCount: 38 },
  { id: "8", name: "Almacenero", role: "almacenero", title: "Gestión de Almacén", avatar: "", phone: "+5355144097", clientsCount: 0, reviewsCount: 0 },
  { id: "9", name: "Transportista", role: "transportista", title: "Transporte y Logística", avatar: "", phone: "+5355144097", clientsCount: 0, reviewsCount: 0 }
];

export const authService = {
  /**
   * Autentica un usuario con email y contraseña mediante Supabase Auth
   */
  async signInWithEmailPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Error al iniciar sesión.');
    }

    return data;
  },

  /**
   * Envía un correo electrónico con enlace para restablecer o crear la contraseña
   */
  async sendPasswordResetEmail(email: string) {
    const redirectUrl = `${window.location.origin}/admin/login`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      throw new Error(error.message || 'Error al enviar enlace de recuperación.');
    }

    return true;
  },

  /**
   * Cierra la sesión activa en Supabase Auth
   */
  async signOut() {
    await supabase.auth.signOut();
  },

  /**
   * Obtiene todos los perfiles activos de la base de datos y los mapea al formato UserSession
   */
  async getProfiles(): Promise<UserSession[]> {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('*')
        .eq('activo', true);

      if (error) {
        console.warn('Error obteniendo perfiles de Supabase, usando mocks:', error);
        return MOCK_PROFILES;
      }

      if (!data || data.length === 0) {
        console.warn('Supabase no devolvió perfiles, usando mocks.');
        return MOCK_PROFILES;
      }

      return data.map((row) => ({
        id: row.id,
        name: row.nombre,
        role: (row.rol as UserRole) || 'comercial',
        title: row.descripcion_corta || '',
        avatar: row.foto_url || '',
        clientsCount: row.total_instalaciones || 0,
        reviewsCount: row.calificacion_promedio ? Math.round(Number(row.calificacion_promedio)) : 0,
        phone: row.telefono || '',
        avatarOrigin: 'center',
        avatarZoom: 1.0,
      }));
    } catch (err) {
      console.warn('Excepción al consultar Supabase, usando mocks:', err);
      return MOCK_PROFILES;
    }
  }
};
