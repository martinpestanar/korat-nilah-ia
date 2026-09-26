/**
 * ============================================================
 * PÁGINA PÚBLICA: Vinculación Remota de WhatsApp para Clientes
 * Mobile-First, Clean Light Emerald & Violet Glow
 * Permite a las dueñas de salón vincular su WhatsApp en su propio tiempo
 * ============================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, Hash, QrCode, Phone, Check, Copy, RefreshCw,
  AlertTriangle, Clock, Sparkles, CheckCircle2, ShieldCheck,
  ArrowRight, ExternalLink, HelpCircle, Loader2
} from 'lucide-react';
import { getPairingCode, checkConnection, updateInstanceStatus } from '../services/evolutionAdmin';
import { supabase } from '../services/supabase';

export const VincularWhatsAppPublico: React.FC = () => {
  const [searchParams] = useSearchParams();
  const instanceParam = searchParams.get('instance') || searchParams.get('inst') || '';
  const nameParam = searchParams.get('name') || searchParams.get('salon') || '';
  const businessIdParam = searchParams.get('businessId') || searchParams.get('bid') || '';

  const [salonName, setSalonName] = useState<string>(nameParam || 'Tu Negocio');
  const [instanceName, setInstanceName] = useState<string>(instanceParam);
  const [activeTab, setActiveTab] = useState<'code' | 'qr'>('code');

  // Estados de vinculación
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Temporizador regresivo de 3 minutos (180 segundos)
  const TIMER_INITIAL = 180; // 3 minutos
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_INITIAL);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Polling para chequear conexión en tiempo real
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Cargar datos del salón si sólo viene businessId ─────────
  useEffect(() => {
    if (businessIdParam && !instanceName) {
      supabase
        .from('instancias_evolution')
        .select('instance_name, label')
        .eq('business_id', businessIdParam)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.instance_name) setInstanceName(data.instance_name);
          if (data?.label && !nameParam) setSalonName(data.label);
        });

      if (!nameParam) {
        supabase
          .from('negocios')
          .select('nombre')
          .eq('id', businessIdParam)
          .maybeSingle()
          .then(({ data }) => {
            if (data?.nombre) setSalonName(data.nombre);
          });
      }
    }
  }, [businessIdParam, instanceName, nameParam]);

  // ─── Polling de estado de conexión ──────────────────────────
  useEffect(() => {
    if (!instanceName || isConnected) return;

    pollingRef.current = setInterval(async () => {
      try {
        const result = await checkConnection(instanceName);
        if (result.isConnected) {
          setIsConnected(true);
          if (timerRef.current) clearInterval(timerRef.current);
          if (pollingRef.current) clearInterval(pollingRef.current);
          await updateInstanceStatus(instanceName, 'conectado');
        }
      } catch {
        // silencioso
      }
    }, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [instanceName, isConnected]);

  // ─── Cuenta regresiva del código (3 minutos) ────────────────
  useEffect(() => {
    if (pairingCode && timeLeft > 0 && !isConnected) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pairingCode, isConnected]);

  // ─── Generar Pairing Code ───────────────────────────────────
  const handleGenerateCode = async () => {
    const clean = phoneInput.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Por favor ingresa tu número con código de país (ej: 51981482289, 573001234567)');
      return;
    }

    if (!instanceName) {
      setErrorMessage('Enlace incompleto: No se encontró la instancia asignada. Consulta con soporte.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await getPairingCode({
        instanceName,
        phoneNumber: clean,
      });

      if (!res.success || !res.pairingCode) {
        throw new Error(res.error || 'No se pudo generar el código. Intenta nuevamente.');
      }

      setPairingCode(res.pairingCode);
      setTimeLeft(TIMER_INITIAL); // Reiniciar reloj de 3 minutos
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error al generar código');
    } finally {
      setLoading(false);
    }
  };

  // ─── Copiar código ──────────────────────────────────────────
  const handleCopyCode = () => {
    if (!pairingCode) return;
    navigator.clipboard.writeText(pairingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Formato minutos:segundos
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-emerald-50/20 to-slate-100 flex flex-col justify-between font-sans text-slate-900 antialiased p-4 sm:p-6">

      {/* ── TOP HEADER BRANDING ───────────────────────────────── */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black tracking-tight text-slate-900 block leading-tight">Korat Flow</span>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Asistente IA</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Conexión Segura
        </div>
      </header>

      {/* ── MAIN CONTENT CARD ─────────────────────────────────── */}
      <main className="max-w-md w-full mx-auto my-auto py-4">
        <AnimatePresence mode="wait">

          {/* ═════════════════════════════════════════════════════
              ESTADO 1: CONECTADO CON ÉXITO
          ═════════════════════════════════════════════════════ */}
          {isConnected ? (
            <motion.div
              key="connected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl shadow-emerald-900/5 text-center space-y-5"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-2">
                  ¡Vinculación Completa!
                </span>
                <h2 className="text-xl font-black text-slate-900">WhatsApp Conectado</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  El WhatsApp de <strong className="text-slate-800">{salonName}</strong> ha quedado vinculado exitosamente a tu sistema inteligente.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-left space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Tu asistente ya está activo y listo</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Puedes cerrar esta ventana de forma segura</span>
                </div>
              </div>
            </motion.div>
          ) : (

            /* ═════════════════════════════════════════════════════
                ESTADO 2: VINCULACIÓN EN PROCESO
            ═════════════════════════════════════════════════════ */
            <motion.div
              key="linking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-5"
            >
              {/* Saludo y salón */}
              <div className="text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Paso único de inicio
                </span>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-2">
                  Conectar WhatsApp
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Salón: <strong className="text-slate-800">{salonName}</strong>
                </p>
              </div>

              {/* AVISO IMPORTANTE DE EXPIRACIÓN */}
              <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-3.5 flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-amber-900">
                  <strong className="block font-bold">⏳ Duración del código: 2 a 3 minutos</strong>
                  Por seguridad de WhatsApp, el código generado expira rápidamente. Ten tu WhatsApp abierto antes de generarlo.
                </div>
              </div>

              {/* ── SECCIÓN DE CÓDIGO (PAIRING CODE) ───────────────── */}
              <div className="space-y-4">
                {!pairingCode ? (
                  /* Formulario de entrada de teléfono */
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-700 block">
                      Número de WhatsApp del negocio
                    </label>

                    <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50/80 px-3.5 py-3 focus-within:border-emerald-500 focus-within:bg-white transition-all shadow-inner">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <input
                        type="tel"
                        value={phoneInput}
                        onChange={e => {
                          setPhoneInput(e.target.value);
                          setErrorMessage('');
                        }}
                        placeholder="Ej: 51981482289 (con código de país)"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none"
                        onKeyDown={e => e.key === 'Enter' && handleGenerateCode()}
                      />
                    </div>

                    <p className="text-[10px] text-slate-400 leading-normal">
                      💡 <strong>Recuerda el prefijo de tu país:</strong> Perú (+51), Colombia (+57), México (+521), Chile (+56), etc. (Solo dígitos, sin el signo +).
                    </p>

                    {errorMessage && (
                      <p className="text-xs text-rose-500 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                        {errorMessage}
                      </p>
                    )}

                    <button
                      onClick={handleGenerateCode}
                      disabled={loading || !phoneInput.trim()}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50 active:scale-[0.99]"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generando código seguro...
                        </>
                      ) : (
                        <>
                          <Hash className="w-4 h-4" />
                          Generar Código de Vinculación
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Código listo con cuenta regresiva */
                  <div className="space-y-4">
                    {/* Tarjeta del código */}
                    <div className="rounded-2xl border-2 border-violet-200 bg-gradient-to-b from-violet-50/80 to-purple-50/50 p-4 text-center space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100 px-2.5 py-0.5 rounded-full inline-block">
                        Tu Código de Vinculación
                      </span>

                      <div className="py-1">
                        <span className="text-3xl sm:text-4xl font-black font-mono tracking-[0.25em] text-violet-900 block select-all">
                          {pairingCode}
                        </span>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={handleCopyCode}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-md shadow-violet-500/20 hover:bg-violet-700 transition active:scale-95"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? '¡Copiado!' : 'Copiar Código'}
                        </button>
                      </div>

                      {/* Contador de expiración */}
                      <div className="pt-2 border-t border-violet-100 flex items-center justify-center gap-1.5 text-xs font-bold">
                        <Clock className={`w-3.5 h-3.5 ${timeLeft <= 30 ? 'text-rose-500 animate-spin' : 'text-violet-600'}`} />
                        <span className={timeLeft <= 30 ? 'text-rose-600' : 'text-violet-700'}>
                          {timeLeft > 0 ? (
                            <>Expira en: <span className="font-mono text-sm">{formatTime(timeLeft)}</span> min</>
                          ) : (
                            <span className="text-rose-600">¡Código expirado! Genera uno nuevo.</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Si expiró, botón para regenerar */}
                    {timeLeft === 0 && (
                      <button
                        onClick={handleGenerateCode}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-amber-600 text-white font-bold text-xs py-3 hover:bg-amber-700 transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Generar nuevo código de 3 minutos
                      </button>
                    )}

                    {/* Instrucciones paso a paso en WhatsApp */}
                    <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-2.5">
                      <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        Pasos en tu WhatsApp (ahora mismo):
                      </p>

                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                          <span>Abre <strong>WhatsApp</strong> $\rightarrow$ Menú `⋮` (o Ajustes) $\rightarrow$ <strong>Dispositivos vinculados</strong>.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                          <span>Toca el botón verde <strong>"Vincular un dispositivo"</strong>.</span>
                        </div>
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                          <span>Abajo toca la opción <strong>"Vincular con número de teléfono"</strong> y escribe este código.</span>
                        </div>
                      </div>
                    </div>

                    {/* Estado de espera en tiempo real */}
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 animate-pulse font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Esperando confirmación de WhatsApp...
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── FOOTER DISCRETO ───────────────────────────────────── */}
      <footer className="max-w-md w-full mx-auto text-center py-2 text-[10px] text-slate-400">
        Plataforma protegida con cifrado de extremo a extremo · Korat Flow
      </footer>

    </div>
  );
};

export default VincularWhatsAppPublico;
