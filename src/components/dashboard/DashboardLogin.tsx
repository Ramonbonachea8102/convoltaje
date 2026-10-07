import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useLocation } from 'wouter';
import { Settings } from 'lucide-react';

export default function DashboardLogin() {
  const { currentUser, loginWithCredentials, sendPasswordReset, error: storeError } = useAuthStore();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (currentUser) {
      setLocation('/admin/panel');
    }
  }, [currentUser, setLocation]);

  // States
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

    // Autenticación real y exclusiva mediante Supabase Auth
    try {
      const success = await loginWithCredentials(email, password);
      if (success) {
        setLocation('/admin/panel');
      } else {
        setError(storeError || 'Credenciales incorrectas o cuenta sin permisos activos.');
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
