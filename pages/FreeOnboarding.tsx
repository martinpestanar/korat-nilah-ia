import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import {
  Sparkles, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff,
  Calendar, Users, BarChart3, Wallet, Settings, Loader2, X, Plus
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AccountData { nombre: string; salon: string; email: string; password: string; }
interface SalonData { pais: string; moneda: string; telefono: string; }
interface Servicio { nombre: string; precio: string; }

const PAISES = ['Perú', 'Colombia', 'México', 'Chile', 'Argentina', 'Ecuador', 'Bolivia', 'Venezuela'];
const MONEDAS: Record<string, string> = { 'Perú': 'S/.', 'Colombia': 'COP', 'México': 'MXN', 'Chile': 'CLP', 'Argentina': 'ARS', 'Ecuador': 'USD', 'Bolivia': 'Bs', 'Venezuela': 'Bs.D' };

const FEATURES = [
  { icon: <Calendar size={15} className="text-white" />, bg: 'bg-emerald-500', label: 'Agenda básica' },
  { icon: <Users size={15} className="text-white" />, bg: 'bg-cyan-500', label: 'Tus clientas' },
  { icon: <BarChart3 size={15} className="text-white" />, bg: 'bg-violet-500', label: 'Dashboard' },
  { icon: <Wallet size={15} className="text-white" />, bg: 'bg-pink-500', label: 'Finanzas' },
  { icon: <Settings size={15} className="text-white" />, bg: 'bg-amber-500', label: 'Configuración' },
];

// ─── Progress Bar ─────────────────────────────────────────────────────────────
const Progress: React.FC<{ step: number; total: number }> = ({ step, total }) => (
  <div className="flex items-center gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i < step ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'}`} />
    ))}
  </div>
);

// ─── Step 1: Cuenta ───────────────────────────────────────────────────────────
const StepCuenta: React.FC<{ data: AccountData; onChange: (d: AccountData) => void; onNext: () => void; loading: boolean; error: string; isOrphaned?: boolean; }> = ({ data, onChange, onNext, loading, error, isOrphaned }) => {
  const [showPw, setShowPw] = useState(false);
  const set = (k: keyof AccountData) => (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...data, [k]: e.target.value });
  const valid = data.nombre && data.salon && data.email && (isOrphaned || data.password.length >= 8);

  return (
    <div>
      <div className="text-4xl mb-3">👋</div>
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">¡Hola! Cuéntame de ti</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Creamos tu cuenta en segundos. Sin tarjeta, sin compromisos.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tu nombre</label>
          <input className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="Ej: María González" value={data.nombre} onChange={set('nombre')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nombre de tu salón</label>
          <input className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="Ej: Lux Beauty Studio" value={data.salon} onChange={set('salon')} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Tu email</label>
          <input type="email" className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="tu@email.com" value={data.email} onChange={set('email')} />
        </div>
        {!isOrphaned && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contraseña</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="Mínimo 8 caracteres" value={data.password} onChange={set('password')} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}

      <button onClick={onNext} disabled={!valid || loading} className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Creando tu cuenta...</> : <>Continuar <ArrowRight size={18} /></>}
      </button>

      <p className="text-center text-xs text-gray-400 mt-3">Sin tarjeta · Hasta 100 clientas gratis · Sin compromisos</p>
    </div>
  );
};

// ─── Step 2: Salón ────────────────────────────────────────────────────────────
const StepSalon: React.FC<{ data: SalonData; onChange: (d: SalonData) => void; onNext: () => void; onBack: () => void; loading: boolean; error: string; salonNombre: string; }> = ({ data, onChange, onNext, onBack, loading, error, salonNombre }) => {
  const valid = data.pais && data.moneda;
  return (
    <div>
      <div className="text-4xl mb-3">💅</div>
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">Cuéntame de <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">{salonNombre}</span></h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Solo necesito lo básico para configurar tu espacio.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">¿En qué país está tu salón?</label>
          <select className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" value={data.pais} onChange={e => onChange({ ...data, pais: e.target.value, moneda: MONEDAS[e.target.value] || 'USD' })}>
            <option value="">Selecciona tu país</option>
            {PAISES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        {data.pais && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl px-4 py-3">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Tu moneda: <strong>{data.moneda}</strong></p>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">WhatsApp del salón <span className="text-gray-400 font-normal">(opcional)</span></label>
          <input type="tel" className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="+51 999 999 999" value={data.telefono} onChange={e => onChange({ ...data, telefono: e.target.value })} />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex gap-3 mt-6">
        <button onClick={onBack} className="flex items-center gap-2 px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
          <ArrowLeft size={18} />
        </button>
        <button onClick={onNext} disabled={!valid || loading} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : <>Continuar <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
};

// ─── Step 3: Servicios ────────────────────────────────────────────────────────
const StepServicios: React.FC<{ servicios: Servicio[]; onChange: (s: Servicio[]) => void; onNext: () => void; onBack: () => void; loading: boolean; error: string; moneda: string; }> = ({ servicios, onChange, onNext, onBack, loading, error, moneda }) => {
  const add = () => onChange([...servicios, { nombre: '', precio: '' }]);
  const remove = (i: number) => onChange(servicios.filter((_, idx) => idx !== i));
  const update = (i: number, k: keyof Servicio, v: string) => { const s = [...servicios]; s[i] = { ...s[i], [k]: v }; onChange(s); };
  const valid = servicios.some(s => s.nombre.trim());

  const SUGERENCIAS = ['Corte y peinado', 'Manicure', 'Pedicure', 'Tinte', 'Pestañas', 'Depilación', 'Tratamiento facial', 'Masaje'];

  return (
    <div>
      <div className="text-4xl mb-3">✨</div>
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-1">¿Qué servicios ofreces?</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Agrega los principales. Puedes editar más después.</p>

      {servicios.length === 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Sugerencias rápidas</p>
          <div className="flex flex-wrap gap-2">
            {SUGERENCIAS.map(s => (
              <button key={s} onClick={() => onChange([...servicios, { nombre: s, precio: '' }])} className="px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-500/30 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
        {servicios.map((s, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className="flex-1 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" placeholder="Nombre del servicio" value={s.nombre} onChange={e => update(i, 'nombre', e.target.value)} />
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-2.5 py-2.5 w-28">
              <span className="text-xs text-gray-400 shrink-0">{moneda}</span>
              <input className="w-full bg-transparent text-sm text-gray-900 dark:text-white outline-none" placeholder="0" type="number" value={s.precio} onChange={e => update(i, 'precio', e.target.value)} />
            </div>
            <button onClick={() => remove(i)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={add} className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 text-sm text-gray-500 dark:text-gray-400 hover:border-violet-300 hover:text-violet-500 transition-all">
        <Plus size={16} /> Agregar servicio
      </button>

      {error && <p className="mt-3 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-2">{error}</p>}

      <div className="flex gap-3 mt-5">
        <button onClick={onBack} className="px-5 py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
          <ArrowLeft size={18} />
        </button>
        <button onClick={onNext} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-lg shadow-violet-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none">
          {loading ? <><Loader2 size={18} className="animate-spin" /> Guardando...</> : <>{valid ? 'Finalizar configuración' : 'Omitir por ahora'} <ArrowRight size={18} /></>}
        </button>
      </div>
    </div>
  );
};

// ─── Step 4: Listo ────────────────────────────────────────────────────────────
const StepListo: React.FC<{ nombre: string; salon: string; onGo: () => void; }> = ({ nombre, salon, onGo }) => (
  <div className="text-center">
    <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-violet-500/30 animate-bounce">
      <Sparkles size={40} className="text-white" />
    </div>
    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">¡Todo listo, {nombre.split(' ')[0]}! 🎉</h2>
    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed max-w-xs mx-auto">
      <strong className="text-gray-700 dark:text-gray-200">{salon}</strong> ya tiene su panel. Ahora puedes empezar a usarlo.
    </p>

    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 mb-6 text-left">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Lo que tienes disponible:</p>
      <div className="grid grid-cols-2 gap-2">
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <div className={`w-6 h-6 rounded-lg ${f.bg} flex items-center justify-center shrink-0`}>{f.icon}</div>
            {f.label}
          </div>
        ))}
      </div>
    </div>

    <button onClick={onGo} className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold text-base shadow-xl shadow-violet-500/30 hover:scale-[1.02] active:scale-95 transition-all">
      Ir a mi panel ahora <ArrowRight size={18} />
    </button>
    <p className="text-xs text-gray-400 mt-3">Cuando quieras más funciones, el plan Pro te espera.</p>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const FreeOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const { session, user, isOrphaned, refreshAuth } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [account, setAccount] = useState<AccountData>({ nombre: '', salon: '', email: '', password: '' });
  const [salon, setSalon] = useState<SalonData>({ pais: '', moneda: 'S/.', telefono: '' });
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [businessId, setBusinessId] = useState('');

  // Pre-llenar si ya está autenticado (pero huérfano)
  React.useEffect(() => {
    if (session?.user && isOrphaned && step === 1) {
      setAccount(prev => ({
        ...prev,
        email: session.user.email || '',
        // No podemos pre-llenar password, pero si ya está logueado
        // podemos saltar el login/signup si detectamos que es el mismo email
      }));
    }
  }, [session, isOrphaned, step]);

  // Step 1: Create account
  const handleCreateAccount = async () => {
    setError('');
    if (account.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    setLoading(true);
    try {
      const cleanEmail = account.email.trim().toLowerCase();
      let userId = session?.user?.id;

      // Solo intentar signUp si no hay sesión o el email es distinto
      if (!session || session.user.email?.toLowerCase() !== cleanEmail) {
        const { data: signUpData, error: authErr } = await supabase.auth.signUp({ email: cleanEmail, password: account.password });
        userId = signUpData?.user?.id;

        if (authErr) {
          if (authErr.message.includes('already registered')) {
            const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({ email: cleanEmail, password: account.password });
            if (signInErr) { setError('Esta cuenta ya existe. Inicia sesión o usa otro correo.'); return; }
            userId = signInData?.user?.id;
          } else { setError(authErr.message); return; }
        }
      }

      // Create negocio via RPC (no token needed for free plan)
      const { data: negId, error: dbErr } = await supabase.rpc('create_free_negocio', {
        p_nombre_persona: account.nombre,
        p_nombre_negocio: account.salon,
        p_email: cleanEmail,
        p_user_uid: userId ?? null,
        p_password: account.password,
      });

      if (dbErr) {
        // Fallback: direct insert if RPC doesn't exist yet
        const { data: neg, error: negErr } = await supabase.from('negocios').insert({
          nombre: account.salon,
          plan: 'free',
          moneda: 'S/.',
        }).select('id').single();
        if (negErr) { setError('Error al crear tu espacio. Intenta de nuevo.'); return; }
        setBusinessId(neg.id);
      } else {
        setBusinessId(negId);
      }
      
      // Actualizar estado de autenticación (ya no es huérfano)
      await refreshAuth();
      
      setStep(2);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error inesperado.');
    } finally { setLoading(false); }
  };

  // Step 2: Save salon info
  const handleSaveSalon = async () => {
    setError('');
    setLoading(true);
    try {
      if (businessId) {
        await supabase.from('negocios').update({ pais: salon.pais, moneda: salon.moneda, telefono_recepcionista: salon.telefono }).eq('id', businessId);
      }
      setStep(3);
    } catch { setError('Error al guardar. Intenta de nuevo.'); }
    finally { setLoading(false); }
  };

  // Step 3: Save services
  const handleSaveServicios = async () => {
    setError('');
    setLoading(true);
    try {
      const valid = servicios.filter(s => s.nombre.trim());
      if (valid.length > 0 && businessId) {
        await supabase.from('servicios').insert(
          valid.map(s => ({ business_id: businessId, nombre: s.nombre, precio: parseFloat(s.precio) || 0 }))
        );
      }
      setStep(4);
    } catch { setError('Error al guardar servicios.'); }
    finally { setLoading(false); }
  };

  const handleGoToDashboard = () => navigate('/nilah/login?welcome=1&free=1&email=' + encodeURIComponent(account.email));

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-gray-50 via-white to-violet-50 dark:from-[#0A0A0A] dark:via-[#0A0A0A] dark:to-[#0d0b1a] flex items-center justify-center p-4">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-fuchsia-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 dark:text-white">KoratFlow</span>
          </div>
          <span className="text-xs text-gray-400 font-medium">Plan Free · Paso {step} de 4</span>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#141414] rounded-3xl border border-gray-100 dark:border-white/8 shadow-2xl shadow-violet-500/5 p-6 md:p-8">
          <Progress step={step} total={4} />

          {step === 1 && <StepCuenta data={account} onChange={setAccount} onNext={handleCreateAccount} loading={loading} error={error} isOrphaned={isOrphaned} />}
          {step === 2 && <StepSalon data={salon} onChange={setSalon} onNext={handleSaveSalon} onBack={() => setStep(1)} loading={loading} error={error} salonNombre={account.salon} />}
          {step === 3 && <StepServicios servicios={servicios} onChange={setServicios} onNext={handleSaveServicios} onBack={() => setStep(2)} loading={loading} error={error} moneda={salon.moneda || 'S/.'} />}
          {step === 4 && <StepListo nombre={account.nombre} salon={account.salon} onGo={handleGoToDashboard} />}
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <a href="/nilah/login" className="text-violet-500 font-semibold hover:underline">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
};

export default FreeOnboarding;
