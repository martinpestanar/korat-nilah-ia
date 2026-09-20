import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, CheckCircle2, Zap, Heart, Star, Scissors } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { provisionUserAccount } from '../services/authProvisioning';

type AuthTab = 'login' | 'register';
type Especialidad = 'lashista' | 'manicurista' | 'salon';

const ESPECIALIDADES = [
  { id: 'lashista' as const, label: 'Lashista / Pestañas', icon: '👁️' },
  { id: 'manicurista' as const, label: 'Manicurista / Nails', icon: '💅' },
  { id: 'salon' as const, label: 'Salón de Belleza / Spa', icon: '💇‍♀️' },
];

const DEFAULT_SERVICES: Record<Especialidad, Array<{ name: string; price: number; durationMin: number }>> = {
  lashista: [
    { name: 'Extensiones Clásicas (1x1)', price: 70, durationMin: 90 },
    { name: 'Retoque de Pestañas (15-21 días)', price: 45, durationMin: 60 },
    { name: 'Lifting & Tinte de Pestañas', price: 50, durationMin: 45 },
  ],
  manicurista: [
    { name: 'Uñas Acrílicas / Esculturales', price: 80, durationMin: 90 },
    { name: 'Mantenimiento / Retoque (20 días)', price: 50, durationMin: 60 },
    { name: 'Esmaltado Semipermanente', price: 40, durationMin: 45 },
  ],
  salon: [
    { name: 'Corte & Cepillado', price: 40, durationMin: 45 },
    { name: 'Manicura Spa', price: 35, durationMin: 45 },
    { name: 'Extensiones de Pestañas', price: 75, durationMin: 90 },
  ],
};

const LoginPage: React.FC = () => {
  const { login, isLoading: authLoading, error: authError, clearError, isAuthenticated, user, isOrphaned, refreshAuth, session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fromState = (location.state as any)?.from;
  const from = fromState ? `${fromState.pathname}${fromState.search || ''}${fromState.hash || ''}` : '/nilah/app';

  // Params de URL
  const [searchParams] = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';

  // Tabs
  const [tab, setTab] = useState<AuthTab>(initialTab);

  // Login form state
  const [loginMode, setLoginMode] = useState<'username' | 'email'>('username');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register form state (Express: Salon + Username + Password + Especialidad)
  const [salonName, setSalonName] = useState('');
  const [username, setUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [especialidad, setEspecialidad] = useState<Especialidad>('lashista');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [preloadSuggestedServices, setPreloadSuggestedServices] = useState<boolean>(true);

  // Local state
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sincronizar tab si cambia el query param
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'register') {
      setTab('register');
    } else if (tabParam === 'login') {
      setTab('login');
    }
  }, [searchParams]);

  // Redirección si ya está autenticado (con perfil completo)
  useEffect(() => {
    if (isAuthenticated && user && !authLoading && !isOrphaned) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, user, authLoading, navigate, from, isOrphaned]);

  // AUTO-RECOVERY: Si hay sesión activa pero está huérfano, completar el perfil automáticamente
  useEffect(() => {
    if (isOrphaned && session?.user && !localLoading) {
      const orphanedEmail = session.user.email || '';
      const guessedName = orphanedEmail.replace('@nilah.app', '').replace('@', '');
      // Pre-llenar el formulario de registro con los datos de la sesión huérfana
      if (!salonName && guessedName) {
        setSalonName(guessedName);
        setUsername(guessedName);
      }
      setTab('register');
    }
  }, [isOrphaned, session]);

  // Auto-completar perfil huérfano cuando se llama handleRegisterSubmit con sesión activa
  const handleOrphanRecovery = async () => {
    if (!session?.user) return;
    setLocalLoading(true);
    setLocalError(null);

    const cleanSalon = salonName.trim() || session.user.email?.replace('@nilah.app', '') || 'Mi Salón';
    const userId = session.user.id;
    const generatedEmail = session.user.email || '';

    try {
      const initialServices = DEFAULT_SERVICES[especialidad] || DEFAULT_SERVICES.lashista;
      const res = await provisionUserAccount({
        userId,
        email: generatedEmail,
        salonName: cleanSalon,
        especialidad,
        initialServices,
      });

      if (!res.success) {
        throw new Error(res.error || 'No se pudo aprovisionar el perfil.');
      }

      await refreshAuth();
      setSuccessMessage('¡Tu cuenta está lista! Ingresando...');
      setTimeout(() => navigate('/nilah/app', { replace: true }), 400);
    } catch (err: any) {
      setLocalError('No se pudo completar tu perfil. ' + (err?.message || ''));
    } finally {
      setLocalLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const trimmed = loginIdentifier.trim().toLowerCase();
    if (!trimmed || !loginPassword) {
      setLocalError(loginMode === 'username' ? 'Por favor ingresa tu nombre de usuario y contraseña.' : 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    let cleanEmail = '';
    if (trimmed.includes('@') && !trimmed.endsWith('@nilah.app')) {
      // Ingresó un correo real directamente
      cleanEmail = trimmed;
    } else {
      // Ingresó un username (ej: valelashes o @valelashes)
      const cleanUser = trimmed.replace(/^@/, '').replace(/[^a-z0-9_-]/g, '');
      cleanEmail = `${cleanUser}@nilah.app`;
    }

    const success = await login({ email: cleanEmail, password: loginPassword });
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    const cleanSalon = salonName.trim();
    const cleanUser = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    if (!cleanSalon) {
      setLocalError('Ingresa el nombre de tu salón o estudio.');
      return;
    }
    if (!cleanUser || cleanUser.length < 3) {
      setLocalError('El usuario debe tener al menos 3 caracteres (letras y números).');
      return;
    }
    if (regPassword.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLocalLoading(true);

    try {
      const generatedEmail = `${cleanUser}@nilah.app`;
      let userId = session?.user?.id;

      // 1. Si no hay sesión o el email es diferente, crear cuenta en Supabase Auth
      if (!session || session.user?.email?.toLowerCase() !== generatedEmail) {
        const { data: signUpData, error: authErr } = await supabase.auth.signUp({
          email: generatedEmail,
          password: regPassword,
        });

        userId = signUpData?.user?.id;

        if (authErr) {
          // Si ya existe la cuenta en Auth (422 o already registered), intentamos login con esa contraseña
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: generatedEmail,
            password: regPassword,
          });

          if (signInErr) {
            setLocalError('Este nombre de usuario ya está registrado con otra contraseña. Por favor inicia sesión o elige otro nombre de usuario.');
            setLocalLoading(false);
            return;
          }
          userId = signInData?.user?.id;
        }
      }

      // Si no tenemos session aún, aseguramos signIn para obtener el UID
      if (!userId) {
        const { data: signInData, error: forceSignInErr } = await supabase.auth.signInWithPassword({
          email: generatedEmail,
          password: regPassword,
        });
        if (forceSignInErr && !signInData?.user) {
          console.warn('Sign-in fallback notice:', forceSignInErr.message);
        }
        userId = signInData?.user?.id;
      }

      if (!userId) {
        throw new Error('No se pudo verificar la sesión para completar el registro.');
      }

      // 2. Aprovisionamiento seguro y unificado (evita race conditions)
      const initialServices = preloadSuggestedServices
        ? (DEFAULT_SERVICES[especialidad] || DEFAULT_SERVICES.lashista)
        : [];
      const res = await provisionUserAccount({
        userId,
        email: generatedEmail,
        salonName: cleanSalon,
        password: regPassword,
        especialidad,
        initialServices,
      });

      if (!res.success) {
        throw new Error(res.error || 'Hubo un error al crear tu espacio de trabajo.');
      }

      // 3. Refrescar estado de autenticación y navegar directo a la app
      setSuccessMessage('¡Cuenta creada con éxito! Ingresando a tu panel...');
      await refreshAuth().catch(() => {});
      setTimeout(() => {
        navigate('/nilah/app', { replace: true });
      }, 400);

    } catch (err: any) {
      console.error('Error en registro express:', err);
      setLocalError(err?.message || 'Hubo un error al crear tu cuenta. Intenta de nuevo.');
    } finally {
      setLocalLoading(false);
    }
  };

  const currentError = localError || authError;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/70 via-white to-pink-50/40 text-slate-800 flex flex-col justify-between items-center px-4 py-6 sm:py-10 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white">

      {/* ── Luces y auras sutiles de fondo (Aesthetic Beauty Salon) ── */}
      <div className="absolute -top-24 -left-20 w-80 h-80 bg-gradient-to-br from-pink-300/35 via-rose-200/30 to-purple-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-gradient-to-bl from-purple-200/35 via-pink-200/25 to-amber-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-96 h-64 bg-pink-100/40 rounded-full blur-2xl pointer-events-none" />

      {/* Contenedor Principal Mobile First */}
      <div className="relative z-10 w-full max-w-[430px] my-auto">

        {/* Header con Marca */}
        <div className="flex flex-col items-center text-center mb-5 sm:mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 p-[2px] shadow-lg shadow-pink-500/20 group-hover:scale-105 active:scale-95 transition-transform duration-200">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center shadow-inner">
                <Sparkles className="w-6 h-6 text-pink-600" />
              </div>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-pink-700 bg-pink-100/80 border border-pink-200/90 px-3.5 py-1 rounded-full mb-2 shadow-2xs">
            <Sparkles size={11} className="text-pink-500" />
            <span>SaaS para Lashistas, Nails & Salones</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Nilah IA
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 max-w-[300px]">
            Tu salón, clientas y agenda organizados desde tu celular
          </p>
        </div>

        {/* Card Principal — Light Glassmorphism Premium */}
        <div className="bg-white/95 border border-pink-100/90 backdrop-blur-xl rounded-[28px] p-5 sm:p-7 shadow-[0_12px_40px_-10px_rgba(244,114,182,0.18),0_4px_16px_-2px_rgba(0,0,0,0.04)] relative">

          {/* Selector de Tabs Mobile-First: Iniciar Sesión / Crear Gratis */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60 mb-5">
            <button
              type="button"
              onClick={() => { setTab('login'); clearError(); setLocalError(null); }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer text-center ${
                tab === 'login'
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/70'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={() => { setTab('register'); clearError(); setLocalError(null); }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 text-white shadow-md shadow-pink-500/25'
                  : 'text-pink-600 hover:text-pink-700'
              }`}
            >
              <Sparkles size={14} />
              <span>Crear Gratis</span>
            </button>
          </div>

          {/* Mensajes de Alerta / Error */}
          {currentError && (
            <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed flex items-start gap-2 shadow-2xs animate-in fade-in duration-200">
              <span className="text-base shrink-0">⚠️</span>
              <div>{currentError}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold leading-relaxed flex items-center gap-2 shadow-2xs animate-in fade-in duration-200">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ════════════════════════════════
              TAB 1: INICIAR SESIÓN (LIGHT)
          ════════════════════════════════ */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Selector de modo de acceso: Con Usuario o Con Correo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Ingresar con:
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setLoginMode('username'); setLocalError(null); }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        loginMode === 'username'
                          ? 'bg-white text-pink-600 shadow-2xs border border-pink-200/80'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      @ Usuario
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMode('email'); setLocalError(null); }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                        loginMode === 'email'
                          ? 'bg-white text-pink-600 shadow-2xs border border-pink-200/80'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      ✉️ Correo
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center">
                  {loginMode === 'username' && (
                    <span className="absolute left-3.5 text-pink-600 font-bold text-sm">@</span>
                  )}
                  <input
                    type={loginMode === 'email' ? 'email' : 'text'}
                    required
                    autoComplete={loginMode === 'email' ? 'email' : 'username'}
                    placeholder={loginMode === 'username' ? 'valelashes' : 'tu@email.com'}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className={`w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-pink-500/15 transition-all shadow-inner ${
                      loginMode === 'username' ? 'pl-8 pr-4' : 'px-4'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                  {loginMode === 'username' ? 'Escribe el usuario de tu salón (ej: valelashes)' : 'Escribe tu correo registrado'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Contraseña
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-pink-500/15 transition-all pr-11 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showLoginPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading || localLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-3"
              >
                {authLoading || localLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <>
                    <span>Entrar a mi Salón</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-xs text-slate-600 hover:text-pink-600 font-medium transition-colors cursor-pointer py-1"
                >
                  ¿No tienes cuenta? <strong className="text-pink-600 underline decoration-pink-300">Regístrate gratis aquí</strong>
                </button>
              </div>
            </form>
          )}

          {/* ════════════════════════════════
              TAB 2: REGISTRO EXPRESS GRATIS (LIGHT)
          ════════════════════════════════ */}
          {tab === 'register' && (
            <form onSubmit={isOrphaned && session?.user ? (e) => { e.preventDefault(); handleOrphanRecovery(); } : handleRegisterSubmit} className="space-y-3.5">

              {/* BANNER DE RECUPERACIÓN — Solo visible para usuarios huérfanos */}
              {isOrphaned && session?.user && (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs mb-1 shadow-2xs">
                  <span className="text-amber-500 text-base shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <p className="font-black text-amber-900 mb-0.5">Tu cuenta necesita completarse</p>
                    <p className="text-amber-800 leading-relaxed">
                      Tu usuario <strong className="text-amber-950 font-bold">{session.user.email?.replace('@nilah.app', '')}</strong> existe pero le falta configurar el espacio de trabajo.
                      Confirma tu nombre de salón y haz clic en "Completar mi cuenta" para entrar.
                    </p>
                  </div>
                </div>
              )}

              {/* Especialidad Badge Selector Mobile Friendly */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700">
                    ¿Cuál es tu especialidad principal?
                  </label>
                  <span className="text-[10px] text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">Paso 1 de 4</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ESPECIALIDADES.map((esp) => (
                    <button
                      key={esp.id}
                      type="button"
                      onClick={() => setEspecialidad(esp.id)}
                      className={`p-2.5 rounded-xl text-center border text-[11px] font-bold transition-all flex flex-col items-center gap-1 active:scale-95 cursor-pointer ${
                        especialidad === esp.id
                          ? 'bg-pink-50/90 border-pink-500 text-pink-800 ring-2 ring-pink-500/20 shadow-xs'
                          : 'bg-slate-50/90 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">{esp.icon}</span>
                      <span className="truncate w-full leading-tight">{esp.label.split('/')[0]}</span>
                    </button>
                  ))}
                </div>
                {/* Selector Interactivo UI/UX: Precargar Servicios Sugeridos o Empezar Limpio */}
                <div className="mt-2.5 rounded-xl border border-pink-200/80 bg-gradient-to-br from-pink-50/70 via-white to-purple-50/50 p-2.5 shadow-xs transition-all">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPreloadSuggestedServices(!preloadSuggestedServices)}
                      className="flex items-center gap-2 text-left flex-1 cursor-pointer group"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        preloadSuggestedServices
                          ? 'bg-pink-600 border-pink-600 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}>
                        <CheckCircle2 size={12} className={preloadSuggestedServices ? 'stroke-[3]' : 'opacity-0'} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                          <Sparkles size={12} className="text-pink-600" />
                          Precargar 3 servicios de ejemplo
                        </span>
                        <p className="text-[10px] text-slate-500">
                          {preloadSuggestedServices
                            ? 'Ideal para probar de inmediato (puedes editarlos luego)'
                            : 'Empezarás de cero para añadir tus propios servicios y precios'}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPreloadSuggestedServices(!preloadSuggestedServices)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        preloadSuggestedServices
                          ? 'bg-pink-100 text-pink-700 border-pink-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {preloadSuggestedServices ? 'Sugeridos' : 'Desde Cero'}
                    </button>
                  </div>

                  {preloadSuggestedServices && (
                    <div className="mt-2 pt-2 border-t border-pink-100/80 flex flex-wrap gap-1.5 animate-fadeIn">
                      {(DEFAULT_SERVICES[especialidad] || []).map((srv, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[9.5px] font-semibold bg-white/90 text-slate-700 border border-pink-200/60 px-2 py-0.5 rounded-lg shadow-2xs"
                        >
                          <span>{srv.name}</span>
                          <span className="text-pink-600 font-bold">S/{srv.price}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Nombre de Salón */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de tu Salón / Estudio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Vale Lashes & Nails"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-pink-500/15 transition-all shadow-inner"
                />
                {salonName.trim().length > 0 && (
                  <p className="text-[11px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Tu espacio se llamará <strong>{salonName.trim()}</strong></span>
                  </p>
                )}
              </div>

              {/* Usuario */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Tu Usuario Único
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">Sin espacios ni tildes</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-pink-600 font-bold text-sm">@</span>
                  <input
                    type="text"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    placeholder="valelashes"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl pl-8 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-pink-500/15 transition-all shadow-inner"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-medium">
                    {username ? (
                      <span className="text-pink-700 font-semibold">
                        Entrarás con: <strong>@{username}</strong>
                      </span>
                    ) : (
                      'El nombre corto para iniciar sesión en tu celular'
                    )}
                  </p>
                  {username.length >= 3 && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ Válido
                    </span>
                  )}
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Crea una Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-50/80 hover:bg-slate-50 border border-slate-200 focus:border-pink-500 focus:bg-white rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-3 focus:ring-pink-500/15 transition-all pr-11 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showRegPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-slate-500 font-medium">
                    {regPassword.length === 0
                      ? 'Una clave sencilla para recordar en tu celular'
                      : regPassword.length < 6
                      ? `Te faltan ${6 - regPassword.length} caracteres más`
                      : 'Contraseña lista para tu cuenta'}
                  </p>
                  {regPassword.length >= 6 && (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      ✓ Segura
                    </span>
                  )}
                </div>
              </div>

              {/* Lo que incluye el Plan Gratuito (Card Light) */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-50/60 to-purple-50/60 border border-pink-200/70 text-[11px] text-slate-700 space-y-1 mt-2">
                <p className="font-bold text-slate-900 flex items-center gap-1.5 text-[11px]">
                  <CheckCircle2 size={14} className="text-pink-600" /> Plan Básico Gratuito de por vida:
                </p>
                <p className="text-slate-600 pl-5 text-[10px] sm:text-[11px] leading-relaxed">
                  ✓ Dashboard ✓ Agenda de Citas ✓ Fichas de Clientas ✓ Egresos y Nóminas ✓ Mi Salón
                </p>
              </div>

              <button
                type="submit"
                disabled={localLoading || authLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer mt-3"
              >
                {localLoading || authLoading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : isOrphaned && session?.user ? (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Completar mi cuenta y Entrar</span>
                    <ArrowRight size={16} />
                  </>
                ) : (
                  <>
                    <Zap size={15} className="fill-white" />
                    <span>⚡ EMPEZAR A USAR GRATIS AHORA</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 pt-1 font-medium">
                Sin tarjeta de crédito · Configuración instantánea en 5 segundos
              </p>
            </form>
          )}

        </div>

        {/* Footer info & WhatsApp direct contact */}
        <div className="mt-6 text-center text-xs text-slate-600 pb-2">
          <p className="font-medium">¿Tienes dudas sobre los planes o instalación de WhatsApp?</p>
          <a
            href="https://wa.me/51926285289?text=Hola%20Mart%C3%ADn!%20Tengo%20una%20consulta%20sobre%20Nilah%20IA."
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 hover:text-pink-700 font-bold mt-1.5 inline-flex items-center gap-1.5 hover:underline"
          >
            <span>💬</span>
            <span>Hablar directamente con Martín Pestana (WhatsApp)</span>
          </a>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;
