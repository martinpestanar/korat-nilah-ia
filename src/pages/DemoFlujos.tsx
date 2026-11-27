import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Star,
  Volume2,
  VolumeX,
  Lock,
  Clock,
  Sparkles,
  Send,
  ShieldCheck,
  AlertTriangle,
  Wifi,
  Battery,
  Signal,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

type GlowModule = 'post_cita' | 'cumpleanos' | 'nocturno' | 'psicologia';

interface ChatMessage {
  id: string;
  sender: 'salon' | 'client' | 'system';
  text: string;
  time: string;
  badge?: {
    label: string;
    tone: 'emerald' | 'rose' | 'amber' | 'violet';
  };
  walletCard?: {
    title: string;
    subtitle: string;
    stamps: number;
    maxStamps: number;
    newlyUnlockedIndex: number;
    highlight: string;
    unlockedReward?: boolean;
  };
  linkText?: string;
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

// Micro-audio UI sintetizado con Web Audio API (sin archivos externos)
function playUiSound(type: 'pop' | 'ding' | 'shield' | 'click', enabled: boolean) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'ding') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(784, now);
      osc.frequency.setValueAtTime(1046.5, now + 0.09);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'shield') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch {
    // Silenciar si el navegador bloquea autoplay
  }
}

export default function DemoFlujos() {
  const [activeModule, setActiveModule] = useState<GlowModule>('post_cita');
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Estado del storytelling y simulador
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [ratingChoice, setRatingChoice] = useState<'5' | '3' | null>(null);
  const [dynamicIsland, setDynamicIsland] = useState<{
    text: string;
    tone: 'neutral' | 'sending' | 'success' | 'alert' | 'night';
  }>({ text: 'Nilah Glow • Listo', tone: 'neutral' });

  // Reloj simulado para Post-Cita (4:00 PM -> 4:30 PM)
  const [clockMinutes, setClockMinutes] = useState<number>(0);
  // Haz de luz SVG entre panel e iPhone
  const [beamPulse, setBeamPulse] = useState<number>(0);
  // Escudo visual bloqueando redes en caso 3 estrellas
  const [shieldIntercepted, setShieldIntercepted] = useState(false);
  // Cumpleaños: modo premio directo o normal
  const [birthdayMode, setBirthdayMode] = useState<'standard' | 'direct_reward'>('standard');
  // Nocturno: modo día/noche
  const [nightPhase, setNightPhase] = useState<'idle' | 'queued' | 'released'>('idle');
  // Submódulo 4: Calculadora de ticket mínimo por sello
  const [minTicketPerStamp, setMinTicketPerStamp] = useState<number>(20);

  // Contador odómetro de Valor Rescatado / Protegido (USD)
  const [savedValue, setSavedValue] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const savedObjRef = useRef({ val: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const floatingIconsRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  // Animación continua "Always Alive" en íconos 3D decorativos (GSAP)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to('.float-3d-slow', {
        y: -7,
        rotation: 1.5,
        duration: 2.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.35,
      });
      gsap.to('.ambient-orb', {
        y: 18,
        x: 10,
        duration: 5.5,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.9,
      });
    }, floatingIconsRef);
    return () => ctx.revert();
  }, []);

  // Odómetro GSAP para el contador de valor rescatado
  useEffect(() => {
    gsap.to(savedObjRef.current, {
      val: savedValue,
      duration: 0.9,
      ease: 'power3.out',
      onUpdate: () => {
        setDisplayValue(Math.round(savedObjRef.current.val));
      },
    });
  }, [savedValue]);

  // Auto-scroll suave en WhatsApp
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const fireBeam = useCallback(() => {
    setBeamPulse((p) => p + 1);
  }, []);

  const resetModule = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setStep(0);
    setRatingChoice(null);
    setClockMinutes(0);
    setShieldIntercepted(false);
    setNightPhase('idle');
    setSavedValue(0);
    setDynamicIsland({ text: 'Nilah Glow • Listo', tone: 'neutral' });
  }, []);

  const handleSelectModule = (mod: GlowModule) => {
    playUiSound('click', soundEnabled);
    setActiveModule(mod);
    resetModule();
  };

  const pushMessage = useCallback(
    (msg: ChatMessage, delay = 650, sound: 'pop' | 'ding' | 'shield' = 'pop') => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, msg]);
        playUiSound(sound, soundEnabled);
      }, delay);
    },
    [soundEnabled]
  );

  // ==========================================================
  // FLUJOS: 1. POST-CITA + ESCUDO 1–5⭐ + BILLETERA VIP
  // ==========================================================
  const handleCompleteCita = () => {
    if (step >= 1) return;
    playUiSound('click', soundEnabled);
    setStep(1);
    setDynamicIsland({ text: '⏳ Esperando +30 min...', tone: 'sending' });

    // Reloj GSAP acelerando de 0 a 30 min
    const clockObj = { m: 0 };
    gsap.to(clockObj, {
      m: 30,
      duration: 0.95,
      ease: 'power4.out',
      onUpdate: () => setClockMinutes(Math.round(clockObj.m)),
      onComplete: () => {
        // Hold (pausa breve de 0.2s antes de disparar el beam)
        setTimeout(() => {
          fireBeam();
          setDynamicIsland({ text: '⚡ Enviando encuesta...', tone: 'sending' });
          setMessages([
            {
              id: 'sys-cita-1',
              sender: 'system',
              text: 'Cita de Sofía marcada "Completada" • +30 min transcurridos',
              time: '4:30 PM',
            },
          ]);
          pushMessage(
            {
              id: 'salon-encuesta',
              sender: 'salon',
              text: '🌸 ¡Qué alegría haberte tenido con nosotras!\n\nUna preguntita rápida... del 1 al 5, ¿cómo te sentiste con la atención? (Responde solo con el número porfa) 👇',
              time: '4:30 PM',
            },
            700,
            'pop'
          );
          setTimeout(() => {
            setDynamicIsland({ text: 'Esperando respuesta', tone: 'neutral' });
          }, 800);
        }, 200);
      },
    });
  };

  const handleSelectRating = (score: '5' | '3') => {
    if (step !== 1) return;
    playUiSound('click', soundEnabled);
    setRatingChoice(score);
    setStep(2);

    setMessages((prev) => [
      ...prev,
      {
        id: `client-${score}`,
        sender: 'client',
        text: score,
        time: '4:32 PM',
      },
    ]);

    if (score === '5') {
      fireBeam();
      setDynamicIsland({ text: '✨ Sello VIP acreditado', tone: 'success' });
      setSavedValue((v) => v + 45);

      pushMessage(
        {
          id: 'salon-5-reply',
          sender: 'salon',
          text: '¡Qué felicidad leerte, mil gracias por tu nota! 💖\n\n¡Ojo con esto! Con el sellito de hoy llegaste a 3 de 12... ¡y estás a solo 1 visita de desbloquear tu primer regalo: Bono Consentida $10 USD en tu cuenta! 🎁🎉\nEn tu próxima cita te llevas tu premio 🌸',
          time: '4:32 PM',
          badge: { label: 'Sello #3 Sumado', tone: 'emerald' },
          walletCard: {
            title: 'Billetera VIP • Tu Salón',
            subtitle: 'Sofía Martínez • Nivel Consentida',
            stamps: 3,
            maxStamps: 12,
            newlyUnlockedIndex: 2,
            highlight: '¡A solo 1 visita de tu Bono $10 USD!',
          },
          linkText: '📲 Revisa tu tarjeta casi lista: koratflow.agency/club/tu-salon',
        },
        750,
        'ding'
      );

      setTimeout(() => {
        confetti({
          particleCount: 55,
          spread: 65,
          origin: { y: 0.65, x: 0.72 },
          colors: ['#8b5cf6', '#ec4899', '#10b981', '#fbbf24'],
        });
      }, 900);
    } else {
      fireBeam();
      setShieldIntercepted(true);
      setDynamicIsland({ text: '🛡️ Escudo Activo • Pausa 24h', tone: 'alert' });
      setSavedValue((v) => v + 450);

      pushMessage(
        {
          id: 'salon-3-reply',
          sender: 'salon',
          text: 'Qué pena leer esto 🥺 no es la experiencia que queremos darte.\n\nPara nosotras tu comodidad es prioridad. ¿Podrías darme un poquito más de detalle sobre lo que pasó para revisarlo juntas?\nQuedo súper pendiente de tu mensaje 💕',
          time: '4:32 PM',
          badge: { label: 'Escudo Control de Daños', tone: 'rose' },
        },
        650,
        'shield'
      );

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: 'sys-pausa-24h',
            sender: 'system',
            text: '🔒 Envíos pausados por 24h • Alerta privada enviada a la dueña antes de que vaya a redes.',
            time: '4:32 PM',
          },
        ]);
      }, 1250);
    }
  };

  const handleResumeAfter24h = () => {
    if (ratingChoice !== '3' || step !== 2) return;
    playUiSound('click', soundEnabled);
    setStep(3);
    fireBeam();
    setDynamicIsland({ text: '⏰ +24h • Resumen de sellos', tone: 'success' });

    setMessages((prev) => [
      ...prev,
      {
        id: 'sys-resume-24h',
        sender: 'system',
        text: '⏰ 24 horas después • Pausa finalizada, enviando resumen de sellos VIP',
        time: 'Día sig. 4:32 PM',
      },
    ]);

    pushMessage(
      {
        id: 'salon-3-resume-stamps',
        sender: 'salon',
        text: '¡Hola Sofía! 💕 Gracias por ayudarnos a mejorar.\n\nQueremos recordarte que tu visita de ayer sí sumó tu sellito VIP. Llegaste a 3 de 12 y estás a solo 1 visita de tu Bono Consentida ($10 USD) 🌸✨',
        time: 'Día sig. 4:32 PM',
        badge: { label: 'Sello #3 Sumado (+24h)', tone: 'emerald' },
        walletCard: {
          title: 'Billetera VIP • Tu Salón',
          subtitle: 'Sofía Martínez • Nivel Consentida',
          stamps: 3,
          maxStamps: 12,
          newlyUnlockedIndex: 2,
          highlight: '¡A solo 1 visita de tu Bono $10 USD!',
        },
        linkText: '📲 Revisa tu tarjeta: koratflow.agency/club/tu-salon',
      },
      700,
      'ding'
    );
  };

  // ==========================================================
  // FLUJOS: 2. CUMPLEAÑOS VIP (2 TIEMPOS)
  // ==========================================================
  const handleBirthdayTime1 = (mode: 'standard' | 'direct_reward') => {
    playUiSound('click', soundEnabled);
    setBirthdayMode(mode);
    setStep(1);
    fireBeam();

    if (mode === 'standard') {
      setDynamicIsland({ text: '🎂 Regalo 7 días antes', tone: 'sending' });
      setSavedValue((v) => v + 65);
      setMessages([
        {
          id: 'sys-b-1',
          sender: 'system',
          text: 'Tiempo 1 • Disparado automáticamente 7 días antes del cumpleaños',
          time: '10:00 AM',
        },
      ]);
      pushMessage(
        {
          id: 'salon-b-1',
          sender: 'salon',
          text: '¡Hola Sofía! 🌸🎂\nEn nuestro salón ya estamos celebrando porque se acerca tu cumpleaños ✨\n\n🎁 Tu regalo anticipado:\n¡Te regalamos +1 Sello VIP a tu tarjeta! Ahora tienes 3 de 12 sellos.\n🎯 Estás a solo 1 sellito de desbloquear tu regalo: Bono Consentida 💕\n\n¿Qué día de esta semana te gustaría agendar? 🗓️',
          time: '10:00 AM',
          badge: { label: 'Tiempo 1 • 7 Días Antes', tone: 'violet' },
          walletCard: {
            title: 'Regalo Anticipado (+1 Sello)',
            subtitle: 'Campaña Cumpleaños VIP',
            stamps: 3,
            maxStamps: 12,
            newlyUnlockedIndex: 2,
            highlight: 'A 1 sello del Bono Consentida ($10 USD)',
          },
        },
        650,
        'ding'
      );
    } else {
      setDynamicIsland({ text: '👑 Premio Desbloqueado', tone: 'success' });
      setSavedValue((v) => v + 85);
      setMessages([
        {
          id: 'sys-b-direct',
          sender: 'system',
          text: 'Sofía estaba a 1 sello de su hito • Cumpleaños completa su tarjeta',
          time: '10:00 AM',
        },
      ]);
      pushMessage(
        {
          id: 'salon-b-direct',
          sender: 'salon',
          text: '¡Sorpresa de cumpleaños, Sofía! 🎁🎂👑\nEn nuestro salón te regalamos tu sello final y acabas de desbloquear tu regalo:\n\n🎉 Bono Consentida: $10 USD en tu cuenta ✨\nVen a consentirte esta semana y pídelo directo en recepción con tu servicio favorito. 🌸',
          time: '10:00 AM',
          badge: { label: 'Premio Directo Desbloqueado', tone: 'amber' },
          walletCard: {
            title: 'Bono Consentida Desbloqueado',
            subtitle: 'Hito 4 de 12 Completado',
            stamps: 4,
            maxStamps: 12,
            newlyUnlockedIndex: 3,
            highlight: '✨ $10 USD listos para canjear en recepción',
            unlockedReward: true,
          },
          linkText: '📲 Ver tu regalo en tu tarjeta digital: koratflow.agency/club/tu-salon',
        },
        650,
        'ding'
      );
      setTimeout(() => {
        confetti({
          particleCount: 70,
          spread: 75,
          origin: { y: 0.65, x: 0.72 },
          colors: ['#ec4899', '#8b5cf6', '#fbbf24', '#10b981'],
        });
      }, 800);
    }
  };

  const handleBirthdayTime2 = () => {
    if (step < 1) return;
    playUiSound('click', soundEnabled);
    setStep(2);
    fireBeam();
    setDynamicIsland({ text: '🥳 Felicitación Día Exacto', tone: 'success' });
    pushMessage(
      {
        id: 'salon-b-2',
        sender: 'salon',
        text: '¡Feliz cumpleaños, Sofía! 🥳🎂🎉✨\nDe parte de todo el equipo, te deseamos un día maravilloso lleno de amor. 💕 ¡Que todos tus deseos se cumplan! 🥂💖',
        time: '9:00 AM',
        badge: { label: 'Tiempo 2 • El Día Exacto', tone: 'emerald' },
      },
      600,
      'pop'
    );
  };

  // ==========================================================
  // FLUJOS: 3. ESCUDO NOCTURNO + RANKING DE PERSONAL
  // ==========================================================
  const handleNightRegister = () => {
    playUiSound('click', soundEnabled);
    setNightPhase('queued');
    setStep(1);
    setDynamicIsland({ text: '🌙 Escudo Nocturno (10PM–7AM)', tone: 'night' });
    setMessages([
      {
        id: 'sys-night-1',
        sender: 'system',
        text: '🌙 11:15 PM • Cita registrada tarde. Escudo Nocturno ACTIVO: mensaje retenido en cola para no despertar a Sofía.',
        time: '11:15 PM',
      },
    ]);
    playUiSound('shield', soundEnabled);
  };

  const handleMorningRelease = () => {
    if (nightPhase !== 'queued') return;
    playUiSound('click', soundEnabled);
    setNightPhase('released');
    setStep(2);
    fireBeam();
    setDynamicIsland({ text: '☀️ Salida cordial 7:05 AM', tone: 'success' });
    setSavedValue((v) => v + 35);

    pushMessage(
      {
        id: 'salon-morning',
        sender: 'salon',
        text: '☀️ ¡Buenos días, Sofía! Qué alegría saludarte.\n\nTe confirmamos tu cita con mucho cariño y sumamos tus datos en tu Billetera VIP Club Glow. ¡Nos vemos pronto! ✨💕',
        time: '7:05 AM',
        badge: { label: 'Entregado al Despertar', tone: 'amber' },
      },
      650,
      'ding'
    );
  };

  return (
    <div
      ref={floatingIconsRef}
      className="min-h-screen bg-[#FAF8FF] text-slate-900 flex flex-col relative overflow-x-hidden selection:bg-violet-200 selection:text-violet-900"
    >
      {/* Orbes ambientales Light (Always Alive) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="ambient-orb absolute -top-24 -left-24 w-[480px] h-[480px] rounded-full bg-violet-200/45 blur-[110px]" />
        <div className="ambient-orb absolute top-1/3 -right-24 w-[420px] h-[420px] rounded-full bg-pink-200/40 blur-[110px]" />
        <div className="ambient-orb absolute -bottom-24 left-1/3 w-[380px] h-[380px] rounded-full bg-emerald-100/50 blur-[100px]" />
      </div>

      {/* Header Editorial Light */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/75 shadow-[0_1px_12px_rgba(15,23,42,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link
              to="/soluciones"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-700 bg-slate-100/90 hover:bg-violet-50 border border-slate-200/80 px-3 py-2 rounded-xl transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Planes
            </Link>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-md shadow-violet-500/20">
                <img
                  src="/assets/3d/sparkles.png"
                  alt="Nilah Glow"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700 bg-violet-100/80 px-2 py-0.5 rounded-full">
                    Plan Nilah Glow • $69/mes
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400">
                    Demo Interactiva en Vivo
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight mt-0.5">
                  La Historia de Sofía: Fidelización VIP y Escudo de Reputación
                </h1>
              </div>
            </div>
          </div>

          {/* Storytelling Financiero + Audio Toggle */}
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
              className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 px-3.5 py-1.5 rounded-2xl shadow-sm"
            >
              <img
                src="/assets/3d/money.png"
                alt="Valor rescatado"
                className="float-3d-slow w-6 h-6 object-contain"
              />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 leading-none">
                  Valor Protegido / Rescatado
                </div>
                <div className="text-sm sm:text-base font-black text-emerald-950 tabular-nums leading-tight">
                  +${displayValue} USD
                </div>
              </div>
            </motion.div>

            <button
              onClick={() => setSoundEnabled((s) => !s)}
              title={soundEnabled ? 'Silenciar efectos UI' : 'Activar efectos UI'}
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-violet-700 hover:border-violet-200 shadow-xs transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Selector de Sub-módulos con Match-Cut layoutId */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 flex-1">
            {[
              {
                id: 'post_cita' as GlowModule,
                title: '1. Post-Cita + Escudo 1–5⭐',
                desc: 'Sellos VIP o Alerta Privada',
                icon: '/assets/3d/star.png',
              },
              {
                id: 'cumpleanos' as GlowModule,
                title: '2. Cumpleaños VIP (2 Tiempos)',
                desc: 'Regalo 7 días antes + Día exacto',
                icon: '/assets/3d/cake.png',
              },
              {
                id: 'nocturno' as GlowModule,
                title: '3. Escudo Nocturno + Ranking',
                desc: 'Cero molestias 10 PM–7 AM',
                icon: '/assets/3d/moon.png',
              },
              {
                id: 'psicologia' as GlowModule,
                title: '4. Psicología & Retorno',
                desc: 'Neuromarketing + Matemática',
                icon: '/assets/3d/crown.png',
              },
            ].map((tab) => {
              const isActive = activeModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectModule(tab.id)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors ${
                    isActive ? 'text-violet-950' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeGlowTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border border-violet-200/90 rounded-xl shadow-xs"
                    />
                  )}
                  <img
                    src={tab.icon}
                    alt={tab.title}
                    className={`relative z-10 w-8 h-8 object-contain transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'opacity-80'
                    }`}
                  />
                  <div className="relative z-10 min-w-0">
                    <div className="text-xs sm:text-sm font-bold truncate">{tab.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] font-semibold text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Nilah Pro ($109) · Siguiente fase</span>
          </div>
        </div>
      </div>

      {/* Escenario Principal: Panel Izquierdo + Beam SVG + iPhone 2.5D Derecho (o Cierre Ejecutivo Psicología) */}
      {activeModule === 'psicologia' ? (
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          <motion.div
            key="panel-psicologia"
            initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="space-y-6"
          >
            {/* Cabecera del Cierre Psicológico */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-[0_14px_40px_rgba(124,58,237,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-violet-700 bg-violet-100/90 px-3 py-1 rounded-full">
                  Ciencia del Comportamiento + Rentabilidad
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Por qué tus clientas no se van y el sistema se paga solo
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Nilah Glow no envía mensajes al azar: cada punto de contacto está diseñado sobre{' '}
                  <strong>3 principios de neuromarketing</strong> y un{' '}
                  <strong>control matemático de margen</strong> para tu salón.
                </p>
              </div>
              <img
                src="/assets/3d/crown.png"
                alt="Psicología Glow"
                className="float-3d-slow w-16 h-16 object-contain shrink-0 drop-shadow-md"
              />
            </div>

            {/* Los 3 Ganchos Psicológicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  badge: 'Sesgo 1 • Meta Cercana',
                  title: 'No la dejas ir (Aversión a la Pérdida)',
                  icon: '/assets/3d/card.png',
                  accent: 'border-violet-200 bg-gradient-to-b from-violet-50/70 to-white',
                  badgeColor: 'bg-violet-100 text-violet-800',
                  psychology:
                    'El cerebro acelera su regreso cuando siente que ya tiene progreso acumulado (hitos cortos en 4, 8 y 12).',
                  impact:
                    'Irse a otro salón se siente como "botar a la basura" sus sellos y su Bono de $10 USD.',
                },
                {
                  badge: 'Sesgo 2 • Catarsis Privada',
                  title: 'Siente que no la olvidas al salir',
                  icon: '/assets/3d/shield.png',
                  accent: 'border-rose-200 bg-gradient-to-b from-rose-50/70 to-white',
                  badgeColor: 'bg-rose-100 text-rose-800',
                  psychology:
                    'El 96% no se queja en el espejo por pena. Al preguntarle 30 min después, siente que su opinión sí importa.',
                  impact:
                    'Si algo falló, tiene un lugar privado donde descargarse contigo antes de quemar tu salón en redes.',
                },
                {
                  badge: 'Sesgo 3 • Reciprocidad Pura',
                  title: 'Cumpleaños sin venderle nada',
                  icon: '/assets/3d/cake.png',
                  accent: 'border-pink-200 bg-gradient-to-b from-pink-50/70 to-white',
                  badgeColor: 'bg-pink-100 text-pink-800',
                  psychology:
                    '7 días antes recibe su sello de regalo (dispara reciprocidad para agendar contigo esa semana).',
                  impact:
                    'El día exacto recibe cariño genuino sin venta agresiva. Eso crea lealtad emocional real.',
                },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  className={`rounded-3xl p-6 border shadow-[0_10px_30px_rgba(15,23,42,0.04)] space-y-3.5 ${card.accent}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10.5px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full ${card.badgeColor}`}>
                      {card.badge}
                    </span>
                    <img src={card.icon} alt={card.title} className="w-10 h-10 object-contain" />
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    <strong>Psicología:</strong> {card.psychology}
                  </p>
                  <div className="pt-2 border-t border-slate-200/70 text-xs font-semibold text-slate-800">
                    💡 {card.impact}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Calculadora Matemática de Margen Protegido + ROI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-7 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-[0_12px_36px_rgba(15,23,42,0.04)] space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                      Control Matemático de Margen
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      Tú configuras el consumo mínimo por cada sello
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Nunca regalas trabajos caros sin retorno. Selecciona un ticket mínimo por sello para calcular cuánto deja una clienta al completar 12 sellos:
                    </p>
                  </div>
                  <img src="/assets/3d/money.png" alt="Dinero" className="w-11 h-11 object-contain shrink-0" />
                </div>

                {/* Selector de Ticket mínimo */}
                <div className="flex flex-wrap items-center gap-2">
                  {[20, 30, 40, 50].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        playUiSound('click', soundEnabled);
                        setMinTicketPerStamp(val);
                      }}
                      className={`px-4 py-2.5 rounded-xl text-sm font-extrabold transition cursor-pointer ${
                        minTicketPerStamp === val
                          ? 'bg-slate-900 text-white shadow-md'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      ${val} USD / sello
                    </button>
                  ))}
                </div>

                {/* Resultados en vivo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                      1 Tarjeta Completada (12 Sellos)
                    </div>
                    <div className="text-3xl font-black text-emerald-950 tabular-nums mt-1">
                      ${(minTicketPerStamp * 12).toLocaleString()} USD
                    </div>
                    <div className="text-xs text-emerald-800 mt-1">
                      Facturación mínima garantizada por 1 sola clienta fiel.
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                      Con solo 10 Clientas Fieles
                    </div>
                    <div className="text-3xl font-black text-violet-950 tabular-nums mt-1">
                      ${(minTicketPerStamp * 12 * 10).toLocaleString()} USD
                    </div>
                    <div className="text-xs text-violet-800 mt-1">
                      Ingresos recurrentes sin gastar un dólar extra en publicidad.
                    </div>
                  </div>
                </div>
              </div>

              {/* Resumen Ejecutivo de Retorno */}
              <div className="lg:col-span-5 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 text-white rounded-3xl p-6 shadow-xl shadow-violet-600/20 flex flex-col justify-between space-y-5">
                <div className="space-y-2">
                  <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                    La Matemática del Retorno
                  </span>
                  <h3 className="text-2xl font-black leading-tight">
                    Retorno Neto de 4X a 6X al mes
                  </h3>
                  <p className="text-xs text-violet-100 leading-relaxed">
                    No es un gasto de software; es una máquina de recuperar citas y proteger tu reputación.
                  </p>
                </div>

                <div className="space-y-2.5 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-violet-100">Inversión Plan Nilah Glow:</span>
                    <span className="font-black text-sm">$69 USD / mes</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-violet-100">1 Clienta salvada al año:</span>
                    <span className="font-black text-sm text-emerald-300">~$450 USD</span>
                  </div>
                  <div className="pt-2 border-t border-white/15 text-xs font-bold text-amber-200">
                    ✨ Con solo 2 citas rescatadas al mes, el sistema ya se pagó solo.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      ) : (
        <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* COLUMNA IZQUIERDA: PANEL DE ACCIÓN DEL SALÓN */}
        <div className="lg:col-span-6 space-y-5">
          {/* Ficha de la Clienta Protagonista */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
            className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 text-white font-bold flex items-center justify-center text-sm shadow-md shadow-violet-500/20">
                SM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Sofía Martínez</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    Clienta VIP • 2/12 Sellos
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Servicio de hoy: <strong>Balayage + Hidratación</strong> • Valor anual: <strong>~$450 USD</strong>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                playUiSound('click', soundEnabled);
                resetModule();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-700 bg-slate-100 hover:bg-violet-50 px-3 py-2 rounded-xl transition shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </motion.div>

          {/* Contenido Dinámico por Sub-Módulo */}
          <AnimatePresence mode="wait">
            {activeModule === 'post_cita' && (
              <motion.div
                key="panel-post-cita"
                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-[0_14px_40px_rgba(124,58,237,0.06)] space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">
                      Flujo 1 • Experiencia Post-Cita
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      Calificación en Caliente + Escudo 1–5
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Al cerrar la cita en tu agenda, Nilah espera 30 minutos y le pregunta cómo se sintió.
                    </p>
                  </div>
                  <img
                    src="/assets/3d/star.png"
                    alt="Estrella 3D"
                    className="float-3d-slow w-12 h-12 object-contain shrink-0 drop-shadow-md"
                  />
                </div>

                {/* Paso 1: Botón Completar Cita + Reloj Odómetro */}
                <div className="space-y-3">
                  <motion.button
                    whileHover={step === 0 ? { y: -2 } : {}}
                    whileTap={step === 0 ? { scale: 0.985 } : {}}
                    onClick={handleCompleteCita}
                    disabled={step >= 1}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      step >= 1
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                        : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 border-transparent text-white shadow-lg shadow-violet-600/25 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          step >= 1 ? 'bg-emerald-500 text-white' : 'bg-white/20 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">
                          1. Marcar cita de Sofía como "Completada"
                        </div>
                        <div className={`text-xs ${step >= 1 ? 'text-emerald-700' : 'text-violet-100'}`}>
                          {step >= 1
                            ? 'Temporizador completado (+30 min) • Encuesta enviada'
                            : 'Haz clic para simular el cierre en tu recepción'}
                        </div>
                      </div>
                    </div>

                    {/* Reloj Odómetro */}
                    <div
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold tabular-nums flex items-center gap-1.5 ${
                        step >= 1
                          ? 'bg-white text-emerald-700 border border-emerald-200'
                          : 'bg-white/15 text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      4:{clockMinutes.toString().padStart(2, '0')} PM
                    </div>
                  </motion.button>

                  {/* Paso 2: Bifurcación Interactiva */}
                  <AnimatePresence>
                    {step >= 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.15 }}
                        className="pt-2 space-y-2.5"
                      >
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          2. Elige qué responde Sofía en su WhatsApp:
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Camino 5 estrellas */}
                          <motion.button
                            whileHover={step === 1 ? { y: -3 } : {}}
                            whileTap={step === 1 ? { scale: 0.98 } : {}}
                            onClick={() => handleSelectRating('5')}
                            disabled={step >= 2}
                            className={`relative p-4 rounded-2xl border text-left transition-all ${
                              ratingChoice === '5'
                                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-500/20'
                                : step >= 2
                                ? 'bg-slate-50 border-slate-200 opacity-50'
                                : 'bg-white hover:bg-emerald-50/50 border-slate-200 hover:border-emerald-300 shadow-sm cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold">
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-500 text-amber-500" />
                                ))}
                              </span>
                              <img src="/assets/3d/gift.png" alt="Premio" className="w-7 h-7 object-contain" />
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                              Responde "5" (Feliz)
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Suma <strong>Sello #3</strong> y abre su Billetera VIP en WhatsApp.
                            </p>
                          </motion.button>

                          {/* Camino 3 estrellas */}
                          <motion.button
                            whileHover={step === 1 ? { y: -3 } : {}}
                            whileTap={step === 1 ? { scale: 0.98 } : {}}
                            onClick={() => handleSelectRating('3')}
                            disabled={step >= 2}
                            className={`relative p-4 rounded-2xl border text-left transition-all ${
                              ratingChoice === '3'
                                ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-500/20'
                                : step >= 2
                                ? 'bg-slate-50 border-slate-200 opacity-50'
                                : 'bg-white hover:bg-rose-50/50 border-slate-200 hover:border-rose-300 shadow-sm cursor-pointer'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
                                3 ⭐ Alerta
                              </span>
                              <img src="/assets/3d/shield.png" alt="Escudo" className="w-7 h-7 object-contain" />
                            </div>
                            <div className="text-sm font-bold text-slate-900">
                              Responde "3" (Inconforme)
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Activa <strong>Escudo Privado</strong>, frena queja pública y pausa 24h.
                            </p>
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Visualizador del Escudo Anti-Redes cuando elige 3 estrellas */}
                  <AnimatePresence>
                    {shieldIntercepted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
                        className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-white to-amber-50 border border-rose-200 flex items-center gap-4 shadow-sm"
                      >
                        <motion.img
                          src="/assets/3d/shield.png"
                          alt="Escudo"
                          initial={{ scale: 0.5, rotate: -15 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                          className="w-12 h-12 object-contain shrink-0"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-rose-800 uppercase tracking-wider">
                              Queja interceptada en privado
                            </span>
                            <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-full">
                              BLOQUEADO EN REDES
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1">
                            Evitaste una reseña negativa en Google Maps o TikTok. La dueña recibe alerta inmediata para llamarla y salvar la relación.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Paso 3 (solo si eligió 3 estrellas): 24 horas después recibe su resumen de sellos */}
                  <AnimatePresence>
                    {ratingChoice === '3' && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: EASE_OUT_EXPO, delay: 0.2 }}
                        whileHover={step === 2 ? { y: -2 } : {}}
                        whileTap={step === 2 ? { scale: 0.985 } : {}}
                        onClick={handleResumeAfter24h}
                        disabled={step >= 3}
                        className={`w-full flex items-center justify-between p-4 rounded-2xl border font-bold text-sm transition ${
                          step >= 3
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : 'bg-slate-900 hover:bg-slate-800 text-white border-transparent shadow-md cursor-pointer'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-emerald-400" />
                          3. Simular +24 horas después (Recibe su resumen de sellos)
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {activeModule === 'cumpleanos' && (
              <motion.div
                key="panel-cumpleanos"
                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-[0_14px_40px_rgba(236,72,153,0.06)] space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600">
                      Flujo 2 • Cumpleaños VIP en 2 Tiempos
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      Llena tu agenda 7 días antes de su cumpleaños
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Todos felicitan el mismo día cuando ya se arregló en otro salón. Nilah la premia antes para que reserve contigo.
                    </p>
                  </div>
                  <img
                    src="/assets/3d/cake.png"
                    alt="Pastel 3D"
                    className="float-3d-slow w-12 h-12 object-contain shrink-0 drop-shadow-md"
                  />
                </div>

                {/* Timeline horizontal animada */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2">
                    <span className={step >= 1 ? 'text-pink-600' : ''}>Tiempo 1: 7 Días Antes</span>
                    <span className={step >= 2 ? 'text-emerald-600' : ''}>Tiempo 2: El Día Exacto</span>
                  </div>
                  <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-pink-500 via-violet-500 to-emerald-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: step === 0 ? '8%' : step === 1 ? '55%' : '100%' }}
                      transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleBirthdayTime1('standard')}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        step >= 1 && birthdayMode === 'standard'
                          ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-500/20'
                          : 'bg-gradient-to-br from-pink-600 to-rose-600 text-white border-transparent shadow-lg shadow-pink-600/20'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs font-extrabold uppercase ${step >= 1 && birthdayMode === 'standard' ? 'text-pink-700' : 'text-pink-100'}`}>
                          Paso 1A • 7 Días Antes
                        </span>
                        <img src="/assets/3d/gift.png" alt="Regalo" className="w-6 h-6 object-contain" />
                      </div>
                      <div className={`text-sm font-bold ${step >= 1 && birthdayMode === 'standard' ? 'text-slate-900' : 'text-white'}`}>
                        Regalo +1 Sello VIP
                      </div>
                      <p className={`text-xs mt-1 ${step >= 1 && birthdayMode === 'standard' ? 'text-slate-600' : 'text-pink-100'}`}>
                        Le avisa que queda a 1 sello de su Bono $10.
                      </p>
                    </motion.button>

                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleBirthdayTime1('direct_reward')}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        step >= 1 && birthdayMode === 'direct_reward'
                          ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                          : 'bg-white hover:bg-amber-50/60 border-slate-200 hover:border-amber-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-extrabold uppercase text-amber-600">
                          Paso 1B • Si estaba a 1 sello
                        </span>
                        <img src="/assets/3d/crown.png" alt="Corona" className="w-6 h-6 object-contain" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">
                        ¡Desbloquea Premio Directo!
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Completa el hito 4/12 y libera su Bono de $10 USD.
                      </p>
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={step >= 1 && step < 2 ? { y: -2 } : {}}
                    whileTap={step >= 1 && step < 2 ? { scale: 0.985 } : {}}
                    onClick={handleBirthdayTime2}
                    disabled={step < 1 || step >= 2}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border font-bold text-sm transition ${
                      step < 1
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : step >= 2
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-transparent shadow-md cursor-pointer'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      2. Simular El Día Exacto (9:00 AM • Felicitación VIP)
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {activeModule === 'nocturno' && (
              <motion.div
                key="panel-nocturno"
                initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-6 shadow-[0_14px_40px_rgba(79,70,229,0.06)] space-y-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Flujo 3 • Control Total & Paz Mental
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                      Escudo Nocturno + Ranking de Estilistas
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Nunca envía mensajes entre 10:00 PM y 7:00 AM. Además, mide en vivo qué estilista enamora más a tus clientas.
                    </p>
                  </div>
                  <img
                    src={nightPhase === 'released' ? '/assets/3d/sun.png' : '/assets/3d/moon.png'}
                    alt="Ciclo Día Noche"
                    className="float-3d-slow w-12 h-12 object-contain shrink-0 drop-shadow-md"
                  />
                </div>

                {/* Controles Día / Noche */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={handleNightRegister}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      nightPhase === 'queued'
                        ? 'bg-indigo-50 border-indigo-400 ring-2 ring-indigo-500/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent shadow-lg shadow-indigo-600/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-extrabold uppercase ${nightPhase === 'queued' ? 'text-indigo-700' : 'text-indigo-100'}`}>
                        1. 11:15 PM (Noche)
                      </span>
                      <img src="/assets/3d/moon.png" alt="Luna" className="w-6 h-6 object-contain" />
                    </div>
                    <div className={`text-sm font-bold ${nightPhase === 'queued' ? 'text-slate-900' : 'text-white'}`}>
                      Registrar cita de noche
                    </div>
                    <p className={`text-xs mt-1 ${nightPhase === 'queued' ? 'text-slate-600' : 'text-indigo-100'}`}>
                      Escudo retiene el envío sin molestar.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={nightPhase === 'queued' ? { y: -2 } : {}}
                    whileTap={nightPhase === 'queued' ? { scale: 0.985 } : {}}
                    onClick={handleMorningRelease}
                    disabled={nightPhase !== 'queued'}
                    className={`p-4 rounded-2xl border text-left transition ${
                      nightPhase === 'released'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-500/20'
                        : nightPhase === 'queued'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-transparent shadow-lg shadow-amber-500/20 cursor-pointer'
                        : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-extrabold uppercase ${nightPhase === 'released' ? 'text-amber-700' : nightPhase === 'queued' ? 'text-amber-50' : 'text-slate-400'}`}>
                        2. 7:05 AM (Despertar)
                      </span>
                      <img src="/assets/3d/sun.png" alt="Sol" className="w-6 h-6 object-contain" />
                    </div>
                    <div className={`text-sm font-bold ${nightPhase === 'queued' ? 'text-white' : nightPhase === 'released' ? 'text-slate-900' : 'text-slate-400'}`}>
                      Liberar al amanecer
                    </div>
                    <p className={`text-xs mt-1 ${nightPhase === 'queued' ? 'text-amber-50' : 'text-slate-500'}`}>
                      Sale cordial en horario permitido.
                    </p>
                  </motion.button>
                </div>

                {/* Mini Ranking de Personal en vivo */}
                <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src="/assets/3d/trophy.png" alt="Ranking" className="w-5 h-5 object-contain" />
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                        Ranking de Personal en Tiempo Real
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Alimentado por 1–5⭐
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { name: 'Valeria Gómez (Colorista)', score: '4.96', pct: '96%', color: 'bg-violet-600' },
                      { name: 'Camila Rojas (Manicurista)', score: '4.88', pct: '90%', color: 'bg-fuchsia-500' },
                      { name: 'Lucía Paredes (Lashista)', score: '4.74', pct: '82%', color: 'bg-emerald-500' },
                    ].map((staff) => (
                      <div key={staff.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{staff.name}</span>
                          <span className="tabular-nums font-bold text-slate-900">{staff.score} ⭐</span>
                        </div>
                        <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: staff.pct }}
                            transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
                            className={`h-full rounded-full ${staff.color}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* CONECTOR ANIMADO SVG BEAM (visible en desktop entre ambas columnas) */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center relative h-32">
          <svg className="w-full h-16 overflow-visible" viewBox="0 0 120 40">
            <defs>
              <linearGradient id="nilahBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              d="M 0 20 C 40 20, 80 20, 120 20"
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="3"
              strokeDasharray="6 6"
            />
            {beamPulse > 0 && (
              <motion.path
                key={beamPulse}
                d="M 0 20 C 40 20, 80 20, 120 20"
                fill="none"
                stroke="url(#nilahBeamGrad)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                transition={{ duration: 0.75, ease: EASE_OUT_EXPO }}
              />
            )}
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
            Nilah Cloud
          </span>
        </div>

        {/* COLUMNA DERECHA: IPHONE 2.5D LIGHT + WHATSAPP REAL LIGHT */}
        <div
          className="lg:col-span-5 flex justify-center"
          style={{ perspective: '1200px' }}
        >
          <motion.div
            ref={phoneRef}
            initial={{ opacity: 0, rotateY: -8, rotateX: 4, scale: 0.96 }}
            animate={{ opacity: 1, rotateY: -3, rotateX: 1.5, scale: 1 }}
            whileHover={{ rotateY: 0, rotateX: 0 }}
            transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
            style={{ transformStyle: 'preserve-3d' }}
            className={`relative w-full max-w-[380px] rounded-[2.8rem] p-3 bg-gradient-to-b from-slate-200 via-white to-slate-300 shadow-[0_28px_70px_-15px_rgba(79,70,229,0.22),0_0_0_1px_rgba(148,163,184,0.4)] transition-shadow duration-500 ${
              shieldIntercepted ? 'ring-4 ring-rose-400/50' : ''
            }`}
          >
            {/* Pantalla interna */}
            <div className="bg-[#EFEAE2] rounded-[2.2rem] overflow-hidden flex flex-col h-[640px] border border-slate-300/70 relative">
              {/* Barra de estado iOS + Dynamic Island Viva */}
              <div className="bg-[#F6F6F6] px-5 pt-2.5 pb-1.5 flex items-center justify-between text-[11px] font-bold text-slate-800 relative z-20">
                <span>4:32</span>
                {/* Dynamic Island */}
                <motion.div
                  layout
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 shadow-sm ${
                    dynamicIsland.tone === 'alert'
                      ? 'bg-rose-600 text-white'
                      : dynamicIsland.tone === 'success'
                      ? 'bg-emerald-600 text-white'
                      : dynamicIsland.tone === 'sending'
                      ? 'bg-violet-600 text-white'
                      : dynamicIsland.tone === 'night'
                      ? 'bg-indigo-900 text-indigo-100'
                      : 'bg-slate-900 text-white'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  <span className="truncate max-w-[140px]">{dynamicIsland.text}</span>
                </motion.div>
                <div className="flex items-center gap-1 text-slate-700">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Cabecera WhatsApp Light */}
              <div className="bg-[#F6F6F6] px-4 py-2.5 flex items-center gap-3 border-b border-slate-200/90 z-10">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white text-sm shadow-xs">
                  💅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 truncate">Tu Salón VIP</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  </div>
                  <div className="text-[11px] font-medium text-emerald-600">
                    {isTyping ? 'escribiendo...' : 'Cuenta de empresa oficial'}
                  </div>
                </div>
              </div>

              {/* Cuerpo del Chat WhatsApp Light */}
              <div
                className="flex-1 p-3.5 overflow-y-auto space-y-3 relative"
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(148,163,184,0.16) 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              >
                {messages.length === 0 && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center px-6"
                  >
                    <img
                      src="/assets/3d/sparkles.png"
                      alt="Esperando"
                      className="float-3d-slow w-14 h-14 object-contain mb-3 opacity-90"
                    />
                    <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-2xl px-4 py-3 shadow-xs">
                      <p className="text-xs font-semibold text-slate-700">
                        WhatsApp de Sofía listo
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Usa los controles de la izquierda para disparar la automatización en tiempo real.
                      </p>
                    </div>
                  </motion.div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    if (msg.sender === 'system') {
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, scale: 0.92, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                          className="flex justify-center"
                        >
                          <div className="bg-[#FFF8E1] text-amber-900 text-[10.5px] font-semibold px-3 py-1.5 rounded-xl text-center border border-amber-200/90 shadow-xs max-w-[92%]">
                            {msg.text}
                          </div>
                        </motion.div>
                      );
                    }

                    const isClient = msg.sender === 'client';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 14, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
                        className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed shadow-[0_1px_2px_rgba(0,0,0,0.08)] ${
                            isClient
                              ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs'
                              : 'bg-white text-slate-800 rounded-tl-xs border border-slate-100'
                          }`}
                        >
                          {msg.badge && (
                            <div
                              className={`inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5 ${
                                msg.badge.tone === 'emerald'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : msg.badge.tone === 'rose'
                                  ? 'bg-rose-100 text-rose-800'
                                  : msg.badge.tone === 'amber'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-violet-100 text-violet-800'
                              }`}
                            >
                              {msg.badge.tone === 'rose' && <AlertTriangle className="w-2.5 h-2.5" />}
                              {msg.badge.label}
                            </div>
                          )}

                          <div className="whitespace-pre-line">{msg.text}</div>

                          {/* Tarjeta Billetera Digital Club Glow con Light Sweep */}
                          {msg.walletCard && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.92, rotateX: 12 }}
                              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                              transition={{ duration: 0.55, ease: EASE_OUT_EXPO, delay: 0.12 }}
                              className={`mt-2.5 relative overflow-hidden rounded-xl p-3 border shadow-sm ${
                                msg.walletCard.unlockedReward
                                  ? 'bg-gradient-to-br from-amber-50 via-pink-50 to-violet-50 border-amber-300'
                                  : 'bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 border-violet-200'
                              }`}
                            >
                              {/* Light sweep diagonal */}
                              <motion.div
                                initial={{ x: '-120%' }}
                                animate={{ x: '220%' }}
                                transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay: 0.35 }}
                                className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/75 to-transparent -skew-x-12"
                              />

                              <div className="flex items-center justify-between gap-2 relative z-10">
                                <div>
                                  <div className="text-[11px] font-extrabold text-violet-950">
                                    {msg.walletCard.title}
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-500">
                                    {msg.walletCard.subtitle}
                                  </div>
                                </div>
                                <img
                                  src={msg.walletCard.unlockedReward ? '/assets/3d/crown.png' : '/assets/3d/card.png'}
                                  alt="Club Glow"
                                  className="w-7 h-7 object-contain"
                                />
                              </div>

                              {/* Cuadrícula de 12 sellos */}
                              <div className="grid grid-cols-6 gap-1.5 mt-2.5 relative z-10">
                                {Array.from({ length: msg.walletCard.maxStamps }).map((_, idx) => {
                                  const filled = idx < msg.walletCard!.stamps;
                                  const isNew = idx === msg.walletCard!.newlyUnlockedIndex;
                                  const milestoneIcon =
                                    idx === 3 ? '🎁' : idx === 7 ? '💎' : idx === 11 ? '👑' : null;
                                  const isMilestone = milestoneIcon !== null;
                                  return (
                                    <motion.div
                                      key={idx}
                                      initial={isNew ? { scale: 0.4, rotate: -25 } : false}
                                      animate={isNew ? { scale: [1.25, 1], rotate: 0 } : {}}
                                      transition={{ type: 'spring', stiffness: 420, damping: 18, delay: 0.25 }}
                                      className={`h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold border ${
                                        filled
                                          ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-transparent shadow-xs'
                                          : isMilestone
                                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                                          : 'bg-white text-slate-400 border-slate-200'
                                      }`}
                                    >
                                      {filled ? '★' : milestoneIcon ?? idx + 1}
                                    </motion.div>
                                  );
                                })}
                              </div>

                              <div className="mt-2 text-[10.5px] font-bold text-emerald-700 relative z-10">
                                {msg.walletCard.highlight}
                              </div>
                            </motion.div>
                          )}

                          {msg.linkText && (
                            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10.5px] font-semibold text-violet-700 flex items-center gap-1">
                              <span className="truncate">{msg.linkText}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </div>
                          )}

                          <div className="text-[9.5px] text-slate-400 text-right mt-1 flex items-center justify-end gap-1">
                            <span>{msg.time}</span>
                            {isClient && <span className="text-sky-500 font-bold">✓✓</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs flex items-center gap-1">
                      {[0, 1, 2].map((dot) => (
                        <motion.span
                          key={dot}
                          animate={{ y: [0, -4, 0] }}
                          transition={{
                            duration: 0.6,
                            repeat: Infinity,
                            delay: dot * 0.14,
                            ease: 'easeInOut',
                          }}
                          className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Barra inferior simulada de WhatsApp Light */}
              <div className="bg-[#F6F6F6] px-3 py-2 border-t border-slate-200/80 flex items-center gap-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-[11px] text-slate-400">
                  Mensaje automático vía Nilah IA...
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Send className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        </main>
      )}
    </div>
  );
}
