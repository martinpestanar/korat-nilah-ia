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
      const initialServices = DEFAULT_SERVICES[especialidad] || DEFAULT_SERVICES.lashista;
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
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans selection:bg-pink-500 selection:text-white">

      {/* ── Luces de fondo ambientadas para Estética ── */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-pink-600/20 via-purple-600/20 to-amber-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Contenedor Principal */}
      <div className="relative z-10 w-full max-w-md">

        {/* Header con Marca */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 p-0.5 shadow-lg shadow-pink-500/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-pink-400" />
              </div>
            </div>
          </Link>

          <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 border border-pink-500/20 px-3 py-0.5 rounded-full mb-1.5">
            SaaS para Lashistas, Nails & Salones
          </span>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Nilah IA
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Tu salón y agenda organizados desde el celular
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-slate-900/90 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-7 shadow-2xl relative">

          {/* Selector de Tabs: Iniciar Sesión / Registro Gratis */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => { setTab('login'); clearError(); setLocalError(null); }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white/10 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>

            <button
              type="button"
              onClick={() => { setTab('register'); clearError(); setLocalError(null); }}
              className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                tab === 'register'
                  ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md shadow-pink-500/20'
                  : 'text-pink-400 hover:text-pink-300'
              }`}
            >
              <Sparkles size={13} />
              <span>Crear Gratis</span>
            </button>
          </div>

          {/* Mensajes de Alerta / Error */}
          {currentError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium leading-relaxed">
              {currentError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold leading-relaxed flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* ════════════════════════════════
              TAB 1: INICIAR SESIÓN
          ════════════════════════════════ */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Selector de modo de acceso: Con Usuario o Con Correo */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Ingresar con:
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-950/70 rounded-lg border border-white/5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setLoginMode('username'); setLocalError(null); }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        loginMode === 'username'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      @ Usuario
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginMode('email'); setLocalError(null); }}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        loginMode === 'email'
                          ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ✉️ Correo
                    </button>
                  </div>
                </div>

                <div className="relative flex items-center">
                  {loginMode === 'username' ? (
                    <span className="absolute left-3.5 text-slate-500 font-bold text-sm">@</span>
                  ) : null}
                  <input
                    type={loginMode === 'email' ? 'email' : 'text'}
                    required
                    placeholder={loginMode === 'username' ? 'valelashes' : 'tu@email.com'}
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className={`w-full bg-slate-950/80 border border-white/10 rounded-xl py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all ${
                      loginMode === 'username' ? 'pl-8 pr-4' : 'px-4'
                    }`}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {loginMode === 'username' ? 'Ingresa con el nombre de usuario de tu salón' : 'Ingresa con tu correo electrónico registrado'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">
                    Contraseña
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading || localLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer mt-2"
              >
                {authLoading || localLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Entrar a mi Salón</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-xs text-slate-400 hover:text-pink-400 transition-colors"
                >
                  ¿No tienes cuenta? <strong className="text-pink-400">Regístrate gratis aquí</strong>
                </button>
              </div>
            </form>
          )}

          {/* ════════════════════════════════
              TAB 2: REGISTRO EXPRESS GRATIS (5 SEGUNDOS)
          ════════════════════════════════ */}
          {tab === 'register' && (
            <form onSubmit={isOrphaned && session?.user ? (e) => { e.preventDefault(); handleOrphanRecovery(); } : handleRegisterSubmit} className="space-y-3.5">

              {/* BANNER DE RECUPERACIÓN — Solo visible para usuarios huérfanos */}
              {isOrphaned && session?.user && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs mb-1">
                  <span className="text-amber-400 text-base shrink-0 mt-0.5">⚠️</span>
                  <div>
                    <p className="font-black text-amber-300 mb-0.5">Tu cuenta necesita completarse</p>
                    <p className="text-amber-200/70 leading-relaxed">
                      Tu usuario <strong className="text-amber-300">{session.user.email?.replace('@nilah.app', '')}</strong> existe pero le falta configurar el espacio de trabajo.
                      Confirma tu nombre de salón y haz clic en "Completar mi cuenta" para entrar.
                    </p>
                  </div>
                </div>
              )}

              {/* Especialidad Badge Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-300">
                    ¿Cuál es tu especialidad principal?
                  </label>
                  <span className="text-[10px] text-pink-400 font-medium">Paso 1 de 4</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {ESPECIALIDADES.map((esp) => (
                    <button
                      key={esp.id}
                      type="button"
                      onClick={() => setEspecialidad(esp.id)}
                      className={`p-2 rounded-xl text-center border text-[11px] font-bold transition-all flex flex-col items-center gap-1 active:scale-95 ${
                        especialidad === esp.id
                          ? 'bg-pink-500/20 border-pink-500 text-pink-300 ring-2 ring-pink-500/20'
                          : 'bg-slate-950/60 border-white/5 text-slate-400 hover:border-white/15'
                      }`}
                    >
                      <span className="text-base">{esp.icon}</span>
                      <span className="truncate w-full">{esp.label.split('/')[0]}</span>
                    </button>
                  ))}
                </div>
                {/* Micro-guía interactiva según especialidad */}
                <p className="text-[10px] text-pink-300/80 bg-pink-500/10 border border-pink-500/15 rounded-lg px-2.5 py-1.5 mt-1.5 flex items-center gap-1.5">
                  <Sparkles size={11} className="shrink-0 text-pink-400" />
                  <span>
                    {especialidad === 'lashista' && 'Pre-cargaremos: Extensiones 1x1, Retoques 21d y Lifting'}
                    {especialidad === 'manicurista' && 'Pre-cargaremos: Acrílicas, Retoque 20d y Semipermanente'}
                    {especialidad === 'salon' && 'Pre-cargaremos: Corte & Cepillado, Manicura Spa y Pestañas'}
                  </span>
                </p>
              </div>

              {/* Nombre de Salón */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nombre de tu Salón / Estudio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Vale Lashes & Nails"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                />
                {salonName.trim().length > 0 && (
                  <p className="text-[10px] text-emerald-400 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 size={11} />
                    <span>Tu espacio se llamará <strong>{salonName.trim()}</strong></span>
                  </p>
                )}
              </div>

              {/* Usuario */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-300">
                    Tu Usuario Único
                  </label>
                  <span className="text-[10px] text-slate-400">Sin espacios ni símbolos</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-pink-400 font-bold text-sm">@</span>
                  <input
                    type="text"
                    required
                    placeholder="valelashes"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  />
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    {username ? (
                      <span className="text-pink-300">
                        Entrarás con: <strong>@{username}</strong>
                      </span>
                    ) : (
                      'El nombre con el que iniciarás sesión en tu celular'
                    )}
                  </p>
                  {username.length >= 3 && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                      ✓ Válido
                    </span>
                  )}
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Crea una Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-slate-400">
                    {regPassword.length === 0
                      ? 'Usa una clave sencilla que no olvides'
                      : regPassword.length < 6
                      ? `Te faltan ${6 - regPassword.length} caracteres más`
                      : 'Contraseña lista para tu cuenta'}
                  </p>
                  {regPassword.length >= 6 && (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                      ✓ Segura
                    </span>
                  )}
                </div>
              </div>

              {/* Lo que incluye el Plan Gratuito */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-300 space-y-1 mt-2">
                <p className="font-bold text-white flex items-center gap-1 text-[11px]">
                  <CheckCircle2 size={13} className="text-pink-400" /> Plan Básico Gratuito de por vida:
                </p>
                <p className="text-slate-400 pl-4">
                  ✓ Dashboard ✓ Agenda de Citas ✓ Fichas de Clientas ✓ Egresos y Nóminas ✓ Mi Salón
                </p>
              </div>

              <button
                type="submit"
                disabled={localLoading || authLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 cursor-pointer mt-3"
              >
                {localLoading || authLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : isOrphaned && session?.user ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Completar mi cuenta y Entrar</span>
                    <ArrowRight size={15} />
                  </>
                ) : (
                  <>
                    <Zap size={15} className="fill-white" />
                    <span>⚡ EMPEZAR A USAR GRATIS AHORA</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-500 pt-1">
                Sin tarjeta de crédito · Configuración instantánea en 5 segundos
              </p>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-slate-500">
          <p>¿Tienes dudas sobre los planes o instalación de WhatsApp?</p>
          <a
            href="https://wa.me/51926285289?text=Hola%20Mart%C3%ADn!%20Tengo%20una%20consulta%20sobre%20Nilah%20IA."
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:underline font-bold mt-1 inline-block"
          >
            Hablar directamente con Martín Pestana (WhatsApp)
          </a>
        </div>

      </div>

    </div>
  );
};

export default LoginPage;
