import { useState, useEffect } from 'react';
import { useAuthStore, UserSession } from '@/hooks/useAuthStore';
import { useLocation } from 'wouter';
import { Settings, LogIn, ShieldAlert } from 'lucide-react';

export default function DashboardLogin() {
  const { availableUsers, login, loginWithCredentials, sendPasswordReset, fetchUsers, isLoading, error: storeError } = useAuthStore();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  // States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetSuccess('');
    setIsSubmitting(true);
    
    const cleanInput = email.trim().toLowerCase();
    // Acceso demo/dev de respaldo para el equipo
    if ((cleanInput === 'admin' || cleanInput === 'admin@convoltaje.com') && password === 'admin') {
      setIsAuthenticated(true);
      setIsSubmitting(false);
      return;
    }

    // Autenticación real mediante Supabase Auth
    try {
      const success = await loginWithCredentials(email, password);
      if (success) {
        setIsAuthenticated(true);
      } else {
        setError(storeError || 'Credenciales incorrectas. Verifica tu email y contraseña.');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con Supabase Auth.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email || !email.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido para enviar la invitación/restablecimiento.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      const ok = await sendPasswordReset(email);
      if (ok) {
        setResetSuccess(`Se envió un enlace de configuración/acceso a ${email}`);
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUserSelect = (userId: string) => {
    login(userId);
    setLocation('/admin/panel');
  };

  // ----------------------------------------------------
  // VISTA 2: SELECCIÓN DE PERFIL (SIMULADOR DE ROLES)
  // ----------------------------------------------------
  if (isAuthenticated) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-[#0b1b33] to-[#0F3A7D] flex items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Fondo con engranajes muy sutil */}
        <div 
          className="absolute inset-0 opacity-[0.02] pointer-events-none" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M45.5,35.5 c-1.5,0-3,0.3-4.4,0.7l-3.3-6.6c-0.6-1.3-2.1-1.8-3.4-1.2l-4.1,1.9c-1.3,0.6-1.9,2.2-1.3,3.5l3.2,6.5 c-2.3,2.2-3.8,5.1-4.2,8.4l-7.2,1c-1.4,0.2-2.4,1.5-2.2,2.9l0.9,4.4c0.2,1.4,1.5,2.4,2.9,2.2l7.1-1 c1,3.2,3,5.9,5.7,7.8l-1.9,7c-0.4,1.4,0.4,2.8,1.8,3.2l4.3,1.2c1.4,0.4,2.8-0.4,3.2-1.8l1.8-6.9c2.8,0,5.5-0.5,8-1.5 l4.4,5.8c0.9,1.1,2.5,1.3,3.7,0.4l3.6-2.7c1.1-0.9,1.4-2.5,0.4-3.7l-4.5-5.9c2-2,3.4-4.5,4.1-7.3l7-1.4c1.4-0.3,2.3-1.6,2-3 l-0.9-4.4c-0.3-1.4-1.6-2.3-3-2l-6.9,1.4c-1.3-3-3.4-5.6-6-7.4l2.5-6.8c0.5-1.3-0.2-2.8-1.5-3.3l-4.2-1.6 C55.3,34.4,53.8,35,53.3,36.4L51,43C49.3,42.7,47.4,42.5,45.5,35.5z M44.6,58.4c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8 S49,58.4,44.6,58.4z' fill='%23ffffff'/%3E%3C/svg%3E")`,
            backgroundSize: '150px 150px'
          }} 
        />

        <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00D9FF]/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] mb-4">
              <LogIn size={24} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Simulador de Acceso</h1>
            <p className="text-white/60 text-sm">
              Selecciona un perfil para ingresar al panel de Convoltaje.
            </p>
            {isLoading && <p className="text-[#00D9FF] text-sm mt-4">Cargando perfiles...</p>}
            {storeError && <p className="text-[#FF6B35] text-sm mt-4">{storeError}</p>}
          </div>

          <div className="space-y-3 relative z-10">
            {availableUsers.map((user: UserSession) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00D9FF]/40 text-left transition-all group active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-full border-2 border-white/20 group-hover:border-[#00D9FF] overflow-hidden flex-shrink-0 transition-colors shadow-lg bg-white/10 relative">
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} 
                    alt={user.name} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`;
                    }}
                    className="w-full h-full object-cover"
                    style={{
                      transform: user.avatarZoom ? `scale(${user.avatarZoom})` : 'none',
                      transformOrigin: user.avatarOrigin || 'center'
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold text-sm group-hover:text-[#00D9FF] transition-colors truncate">
                    {user.name}
                  </h4>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider mt-0.5 truncate">
                    {user.title?.replace(/^\(|\)$/g, '') || user.role}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 text-white/40 text-xs justify-center">
            <ShieldAlert size={14} className="text-[#00D9FF]" />
            <span>Acceso offline autorizado · Puedes explorar todos los roles</span>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VISTA 1: LOGIN PRINCIPAL (CAPTURA DE PANTALLA)
  // ----------------------------------------------------
  return (
    <div className="w-full min-h-screen bg-[#112133] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex flex-wrap justify-center content-center gap-12 p-4">
        {Array.from({ length: 48 }).map((_, i) => (
          <Settings key={i} size={100} className="text-white" />
        ))}
      </div>

      <div className="w-full max-w-sm z-10 flex flex-col items-center">
        <div className="w-40 h-40 mb-2">
          <img 
            src="/admin-pontealdia.jpg" // Usando la imagen exacta de la captura que está en public/
            alt="Admin Mascot"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://api.dicebear.com/7.x/bottts/svg?seed=admin';
            }}
          />
        </div>

        <h1 className="text-[22px] font-bold text-white mb-2 text-center">Panel de Administración</h1>
        <p className="text-[#8e9aab] text-[13px] text-center mb-8 px-4 leading-relaxed font-medium">
          Estas a punto de entrar al lugar donde tus datos<br/>hacen la diferencia.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <input
              type="text"
              placeholder="Correo electrónico / Usuario"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#2c4060] border border-transparent focus:border-[#00D9FF] rounded-lg text-white placeholder-[#8e9aab] outline-none transition-colors font-medium text-sm"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña de Supabase"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#2c4060] border border-transparent focus:border-[#00D9FF] rounded-lg text-white placeholder-[#8e9aab] outline-none transition-colors font-medium text-sm"
              required
            />
          </div>

          {error && <p className="text-[#FF6B35] text-xs text-center font-medium bg-[#FF6B35]/10 p-2.5 rounded-lg border border-[#FF6B35]/20">{error}</p>}
          {resetSuccess && <p className="text-[#00D9FF] text-xs text-center font-medium bg-[#00D9FF]/10 p-2.5 rounded-lg border border-[#00D9FF]/20">{resetSuccess}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-[#00D9FF] hover:bg-[#00bfe6] disabled:opacity-50 text-[#0F3A7D] font-bold rounded-lg transition-colors mt-2 text-[15px]"
          >
            {isSubmitting ? 'Verificando en Supabase Auth...' : 'Entrar al Panel'}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={isSubmitting}
              className="text-xs text-[#00D9FF]/80 hover:text-[#00D9FF] transition-colors underline font-medium"
            >
              ¿Primer ingreso o dejàs crear contraseña? Enviar enlace por Email
            </button>
          </div>
        </form>

        <div className="mt-12 flex flex-col items-center gap-2">
          <button className="flex items-center gap-1.5 text-white font-bold text-sm tracking-wider">
            CONVOLTAJE <span className="text-[10px] opacity-70">▼</span>
          </button>
          <p className="text-[#8e9aab] text-[11px] text-center mt-1">
            Puedes cambiar de negocio antes de introducir<br/>tus credenciales
          </p>
        </div>

        <button 
          onClick={() => setLocation('/')}
          className="mt-10 text-[#00D9FF]/80 hover:text-[#00D9FF] text-[13px] transition-colors font-medium"
        >
          ← Volver a la selección de negocios
        </button>
      </div>
    </div>
  );
}
