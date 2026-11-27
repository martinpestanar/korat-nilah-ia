import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  CheckCircle2,
  Star,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Wifi,
  Battery,
  Signal,
  ChevronRight,
  ExternalLink,
  Send,
  BellRing,
  MapPin,
  HeartHandshake,
  Radar,
  Megaphone,
  Filter,
} from 'lucide-react';

type PlanKey = 'glow' | 'pro';
type GlowModule = 'post_cita' | 'cumpleanos' | 'nocturno';
type ProModule = 'noshow' | 'cuidados' | 'retoques' | 'marketing';

interface ChatMessage {
  id: string;
  sender: 'salon' | 'client' | 'system';
  text: string;
  time: string;
  badge?: {
    label: string;
    tone: 'emerald' | 'rose' | 'amber' | 'violet' | 'cyan';
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
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'ding') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(784, now);
      osc.frequency.setValueAtTime(1046.5, now + 0.09);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'shield') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain.gain.setValueAtTime(0.07, now);
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
    // Ignorar si autoplay bloqueado
  }
}

export const NilahFlowSimulator: React.FC = () => {
  const [plan, setPlan] = useState<PlanKey>('glow');
  const [glowModule, setGlowModule] = useState<GlowModule>('post_cita');
  const [proModule, setProModule] = useState<ProModule>('noshow');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [ratingChoice, setRatingChoice] = useState<'5' | '3' | null>(null);
  const [clockMinutes, setClockMinutes] = useState<number>(0);
  const [beamPulse, setBeamPulse] = useState<number>(0);
  const [shieldIntercepted, setShieldIntercepted] = useState(false);
  const [birthdayMode, setBirthdayMode] = useState<'standard' | 'direct_reward'>('standard');
  const [nightPhase, setNightPhase] = useState<'idle' | 'queued' | 'released'>('idle');
  const [retoqueService, setRetoqueService] = useState<'pestanas' | 'unas' | 'alisado'>('pestanas');

  const [savedValue, setSavedValue] = useState<number>(0);
  const [displayValue, setDisplayValue] = useState<number>(0);
  const savedObjRef = useRef({ val: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [dynamicIsland, setDynamicIsland] = useState<{
    text: string;
    tone: 'neutral' | 'sending' | 'success' | 'alert' | 'night';
  }>({ text: 'Nilah IA • Listo', tone: 'neutral' });

  useEffect(() => {
    gsap.to(savedObjRef.current, {
      val: savedValue,
      duration: 0.85,
      ease: 'power3.out',
      onUpdate: () => setDisplayValue(Math.round(savedObjRef.current.val)),
    });
  }, [savedValue]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  const fireBeam = useCallback(() => setBeamPulse((p) => p + 1), []);

  const resetAll = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setStep(0);
    setRatingChoice(null);
    setClockMinutes(0);
    setShieldIntercepted(false);
    setNightPhase('idle');
    setSavedValue(0);
    setDynamicIsland({ text: 'Nilah IA • Listo', tone: 'neutral' });
  }, []);

  const pushMessage = useCallback(
    (msg: ChatMessage, delay = 600, sound: 'pop' | 'ding' | 'shield' = 'pop') => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, msg]);
        playUiSound(sound, soundEnabled);
      }, delay);
    },
    [soundEnabled]
  );

  // ================= GLOW HANDLERS =================
  const handleCompleteCita = () => {
    if (step >= 1) return;
    playUiSound('click', soundEnabled);
    setStep(1);
    setDynamicIsland({ text: '⏳ Esperando +30 min...', tone: 'sending' });
    const clockObj = { m: 0 };
    gsap.to(clockObj, {
      m: 30,
      duration: 0.9,
      ease: 'power4.out',
      onUpdate: () => setClockMinutes(Math.round(clockObj.m)),
      onComplete: () => {
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
            650,
            'pop'
          );
          setTimeout(() => setDynamicIsland({ text: 'Esperando respuesta', tone: 'neutral' }), 750);
        }, 180);
      },
    });
  };

  const handleSelectRating = (score: '5' | '3') => {
    if (step !== 1) return;
    playUiSound('click', soundEnabled);
    setRatingChoice(score);
    setStep(2);
    setMessages((prev) => [...prev, { id: `client-${score}`, sender: 'client', text: score, time: '4:32 PM' }]);

    if (score === '5') {
      fireBeam();
      setDynamicIsland({ text: '✨ Sello VIP acreditado', tone: 'success' });
      setSavedValue((v) => v + 45);
      pushMessage(
        {
          id: 'salon-5-reply',
          sender: 'salon',
          text: '¡Qué felicidad leerte, mil gracias por tu nota! 💖\n\n¡Ojo con esto! Con el sellito de hoy llegaste a 3 de 12... ¡y estás a solo 1 visita de desbloquear tu primer regalo: Bono Consentida $10 USD en tu cuenta! 🎁🎉',
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
          linkText: '📲 Revisa tu tarjeta: koratflow.agency/club/tu-salon',
        },
        700,
        'ding'
      );
      setTimeout(() => {
        confetti({ particleCount: 55, spread: 65, origin: { y: 0.65, x: 0.7 }, colors: ['#8b5cf6', '#ec4899', '#10b981', '#fbbf24'] });
      }, 850);
    } else {
      fireBeam();
      setShieldIntercepted(true);
      setDynamicIsland({ text: '🛡️ Escudo Activo • Pausa 24h', tone: 'alert' });
      setSavedValue((v) => v + 450);
      pushMessage(
        {
          id: 'salon-3-reply',
          sender: 'salon',
          text: 'Qué pena leer esto 🥺 no es la experiencia que queremos darte.\n\nPara nosotras tu comodidad es prioridad. ¿Podrías darme un poquito más de detalle sobre lo que pasó para revisarlo juntas? Quedo súper pendiente 💕',
          time: '4:32 PM',
          badge: { label: 'Escudo Control de Daños', tone: 'rose' },
        },
        600,
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
      }, 1200);
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
      { id: 'sys-resume-24h', sender: 'system', text: '⏰ 24 horas después • Pausa finalizada, enviando resumen de sellos VIP', time: 'Día sig. 4:32 PM' },
    ]);
    pushMessage(
      {
        id: 'salon-3-resume',
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
      },
      650,
      'ding'
    );
  };

  const handleBirthdayTime1 = (mode: 'standard' | 'direct_reward') => {
    playUiSound('click', soundEnabled);
    setBirthdayMode(mode);
    setStep(1);
    fireBeam();
    if (mode === 'standard') {
      setDynamicIsland({ text: '🎂 Regalo 7 días antes', tone: 'sending' });
      setSavedValue((v) => v + 65);
      setMessages([{ id: 'sys-b-1', sender: 'system', text: 'Tiempo 1 • 7 días antes del cumpleaños', time: '10:00 AM' }]);
      pushMessage(
        {
          id: 'salon-b-1',
          sender: 'salon',
          text: '¡Hola Sofía! 🌸🎂\nEn nuestro salón ya estamos celebrando porque se acerca tu cumpleaños ✨\n\n🎁 Tu regalo anticipado:\n¡Te regalamos +1 Sello VIP a tu tarjeta! Ahora tienes 3 de 12 sellos.\n🎯 Estás a solo 1 sellito de tu Bono Consentida 💕 ¿Qué día de esta semana agendas? 🗓️',
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
        600,
        'ding'
      );
    } else {
      setDynamicIsland({ text: '👑 Premio Desbloqueado', tone: 'success' });
      setSavedValue((v) => v + 85);
      setMessages([{ id: 'sys-b-direct', sender: 'system', text: 'Sofía estaba a 1 sello • Cumpleaños completa su hito', time: '10:00 AM' }]);
      pushMessage(
        {
          id: 'salon-b-direct',
          sender: 'salon',
          text: '¡Sorpresa de cumpleaños, Sofía! 🎁🎂👑\nEn nuestro salón te regalamos tu sello final y acabas de desbloquear tu regalo:\n\n🎉 Bono Consentida: $10 USD en tu cuenta ✨\nVen a consentirte esta semana y pídelo en recepción. 🌸',
          time: '10:00 AM',
          badge: { label: 'Premio Directo Desbloqueado', tone: 'amber' },
          walletCard: {
            title: 'Bono Consentida Desbloqueado',
            subtitle: 'Hito 4 de 12 Completado',
            stamps: 4,
            maxStamps: 12,
            newlyUnlockedIndex: 3,
            highlight: '✨ $10 USD listos para canjear',
            unlockedReward: true,
          },
        },
        600,
        'ding'
      );
      setTimeout(() => {
        confetti({ particleCount: 65, spread: 75, origin: { y: 0.65, x: 0.7 }, colors: ['#ec4899', '#8b5cf6', '#fbbf24', '#10b981'] });
      }, 750);
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
        badge: { label: 'Tiempo 2 • El Día Exacto (Sin Venta)', tone: 'emerald' },
      },
      550,
      'pop'
    );
  };

  const handleNightRegister = () => {
    playUiSound('click', soundEnabled);
    setNightPhase('queued');
    setStep(1);
    setDynamicIsland({ text: '🌙 Escudo Nocturno (10PM–7AM)', tone: 'night' });
    setMessages([
      {
        id: 'sys-night-1',
        sender: 'system',
        text: '🌙 11:15 PM • Cita registrada tarde. Escudo Nocturno ACTIVO: mensaje retenido en cola.',
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
      600,
      'ding'
    );
  };

  // ================= PRO HANDLERS =================
  const handleNoShow = (tiempo: 1 | 2 | 3) => {
    playUiSound('click', soundEnabled);
    fireBeam();
    if (tiempo === 1) {
      setStep(1);
      setDynamicIsland({ text: '⏰ Recordatorio 24h Antes', tone: 'sending' });
      setMessages([{ id: 'sys-ns1', sender: 'system', text: 'Tiempo 1 • 24 horas antes de la cita', time: 'Ayer 3:00 PM' }]);
      pushMessage(
        {
          id: 'salon-ns1',
          sender: 'salon',
          text: 'Dime que ya estás contando las horas para tu espacio de mañana a las 3:00 PM... porque yo sí. 😜\n\nSofía, todo preparado de mi lado para tus Extensiones de Pestañas con Valeria. ¿Confirmamos tu cita? 💕',
          time: 'Ayer 3:00 PM',
          badge: { label: 'Anti No-Show • 24h Antes', tone: 'emerald' },
        },
        600,
        'pop'
      );
    } else if (tiempo === 2) {
      setStep(2);
      setDynamicIsland({ text: '📍 Recordatorio 3h + Ubicación', tone: 'sending' });
      pushMessage(
        {
          id: 'salon-ns2',
          sender: 'salon',
          text: 'Contando los minutos para tu cita de las 3:00 PM. 😌\n\nSofía, todo listo de mi lado para tus Extensiones de Pestañas — solo faltas tú. 💅✨\n📍 Av. Larco 450, Miraflores',
          time: 'Hoy 12:00 PM',
          badge: { label: 'Tiempo 2 • 3h Antes', tone: 'cyan' },
        },
        600,
        'pop'
      );
    } else {
      setStep(3);
      setSavedValue((v) => v + 60);
      setDynamicIsland({ text: '✅ Silla Asegurada', tone: 'success' });
      setMessages((prev) => [...prev, { id: 'client-ns3', sender: 'client', text: '¡Sí, ahí estaré puntual! Gracias 💕', time: '12:02 PM' }]);
      playUiSound('ding', soundEnabled);
    }
  };

  const handleCuidados = (tiempo: 1 | 2) => {
    playUiSound('click', soundEnabled);
    fireBeam();
    if (tiempo === 1) {
      setStep(1);
      setDynamicIsland({ text: '💆‍♀️ Guía Cuidados 24h', tone: 'sending' });
      setMessages([{ id: 'sys-c1', sender: 'system', text: 'Tiempo 1 • 24 horas después de sus pestañas', time: 'Día 1 • 11:00 AM' }]);
      pushMessage(
        {
          id: 'salon-c1',
          sender: 'salon',
          text: '¡Hola Sofía! 💖 ¿Cómo amanecieron tus pestañas hoy?\n\n💡 Cuidados primeras 24h:\n• Evita mojarlas o vapor directo hoy\n• No uses rímel a prueba de agua\n• Cepíllalas suave por la mañana ✨',
          time: 'Día 1 • 11:00 AM',
          badge: { label: 'Guía Post-Cita • 24h', tone: 'violet' },
        },
        600,
        'pop'
      );
    } else {
      setStep(2);
      setSavedValue((v) => v + 45);
      setDynamicIsland({ text: '💕 Acompañamiento Día 10', tone: 'success' });
      pushMessage(
        {
          id: 'salon-c2',
          sender: 'salon',
          text: '🌸 ¡Hola Sofía! Ya pasaron 10 días desde tu cita.\n\nPara que te duren intactas, recuerda lavar tus ojitos con shampoo especial sin aceites. Cuéntame con confianza: ¿tuviste algún problema o molestia hasta hoy? 💕',
          time: 'Día 10 • 11:00 AM',
          badge: { label: 'Tiempo 2 • Día 10 (Cercanía)', tone: 'emerald' },
        },
        600,
        'ding'
      );
    }
  };

  const handleRetoques = (tiempo: 1 | 2) => {
    playUiSound('click', soundEnabled);
    fireBeam();
    const config = {
      pestanas: { label: 'Extensiones de Pestañas', d1: 'Día 18', d2: 'Día 45 (Rescate)', price: 55 },
      unas: { label: 'Uñas Acrílicas', d1: 'Día 30', d2: 'Día 60 (Rescate)', price: 45 },
      alisado: { label: 'Alisado Orgánico', d1: 'Mes 3 (90 días)', d2: 'Mes 4 (Rescate)', price: 120 },
    }[retoqueService];

    if (tiempo === 1) {
      setStep(1);
      setDynamicIsland({ text: `📡 Retoque ${config.d1}`, tone: 'sending' });
      setMessages([{ id: 'sys-r1', sender: 'system', text: `Ciclo configurado para ${config.label}: ${config.d1}`, time: '10:30 AM' }]);
      pushMessage(
        {
          id: 'salon-r1',
          sender: 'salon',
          text: `¡Hola Sofía! ✨ Ya estamos en el punto ideal (${config.d1}) para el mantenimiento de tu ${config.label} y que siga viéndose impecable. ¿Te apartamos horario esta semana? 🗓️💕`,
          time: '10:30 AM',
          badge: { label: `Tiempo 1 • ${config.d1}`, tone: 'cyan' },
        },
        600,
        'pop'
      );
    } else {
      setStep(2);
      setSavedValue((v) => v + config.price);
      setDynamicIsland({ text: '🧲 Clienta Rescatada', tone: 'success' });
      pushMessage(
        {
          id: 'salon-r2',
          sender: 'salon',
          text: `💖 ¡Te extrañamos por el salón, Sofía! Ya pasó un tiempito (${config.d2}) desde tu último ${config.label}.\n\nQueremos consentirte con un beneficio especial si agendas tu regreso esta semana 🌸✨`,
          time: '10:30 AM',
          badge: { label: `Tiempo 2 • ${config.d2}`, tone: 'amber' },
        },
        600,
        'ding'
      );
    }
  };

  const handleMarketingSegmentado = (mode: 'segment' | 'holiday') => {
    playUiSound('click', soundEnabled);
    fireBeam();
    if (mode === 'segment') {
      setStep(1);
      setSavedValue((v) => v + 180);
      setDynamicIsland({ text: '🎯 Solo Segmento Uñas (20)', tone: 'success' });
      setMessages([
        {
          id: 'sys-m1',
          sender: 'system',
          text: '🎯 Filtro inteligente: Enviando SOLO a las 20 clientas que se hacen Uñas (Cero spam a las de Pestañas)',
          time: '11:00 AM',
        },
      ]);
      pushMessage(
        {
          id: 'salon-m1',
          sender: 'salon',
          text: '💅 ¡Hola Sofía! Como eres de nuestras clientas VIP de Uñas, esta semana tienes 10% OFF en tu próximo diseño o relleno de acrílicas hasta el jueves ✨ ¿Te reservamos? 🌸',
          time: '11:00 AM',
          badge: { label: 'Promo Hiper-Segmentada', tone: 'violet' },
        },
        600,
        'ding'
      );
    } else {
      setStep(2);
      setSavedValue((v) => v + 220);
      setDynamicIsland({ text: '💘 Campaña San Valentín', tone: 'success' });
      pushMessage(
        {
          id: 'salon-m2',
          sender: 'salon',
          text: '💘 ¡Se acerca San Valentín, Sofía! Preparamos un paquete especial de Uñas + Mirada Radiante para que brilles ese día. Los cupos de viernes y sábado vuelan ✨🗓️',
          time: '11:05 AM',
          badge: { label: 'Festividad Estratégica', tone: 'rose' },
        },
        600,
        'ding'
      );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Barra superior del Simulador: Selector Glow vs Pro + Valor Rescatado + Audio */}
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-3xl p-3 sm:p-4 shadow-[0_10px_35px_rgba(15,23,42,0.05)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
          <button
            onClick={() => {
              playUiSound('click', soundEnabled);
              setPlan('glow');
              resetAll();
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              plan === 'glow'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <img src="/assets/3d/sparkles.png" alt="Glow" className="w-4 h-4 object-contain" />
            Plan Nilah Glow ($69)
          </button>
          <button
            onClick={() => {
              playUiSound('click', soundEnabled);
              setPlan('pro');
              resetAll();
            }}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              plan === 'pro'
                ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <img src="/assets/3d/crown.png" alt="Pro" className="w-4 h-4 object-contain" />
            Plan Nilah Pro ($109)
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-3.5 py-1.5 rounded-2xl">
            <img src="/assets/3d/money.png" alt="Valor" className="w-6 h-6 object-contain" />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 leading-none">
                Valor Protegido
              </div>
              <div className="text-sm font-black text-emerald-950 tabular-nums leading-tight">
                +${displayValue} USD
              </div>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled((s) => !s)}
            className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-violet-700 transition cursor-pointer"
            title={soundEnabled ? 'Silenciar UI' : 'Activar audio UI'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Sub-módulos por Plan */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2 shadow-sm">
        {plan === 'glow' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              { id: 'post_cita' as GlowModule, title: '1. Post-Cita + Escudo 1–5', desc: 'Sellos VIP o Alerta Privada', icon: '/assets/3d/star.png' },
              { id: 'cumpleanos' as GlowModule, title: '2. Cumpleaños VIP (2 Tiempos)', desc: '7 días antes + Día exacto', icon: '/assets/3d/cake.png' },
              { id: 'nocturno' as GlowModule, title: '3. Escudo Nocturno + Ranking', desc: '10 PM–7 AM + Estilistas', icon: '/assets/3d/moon.png' },
            ].map((tab) => {
              const active = glowModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playUiSound('click', soundEnabled);
                    setGlowModule(tab.id);
                    resetAll();
                  }}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl text-left transition cursor-pointer ${
                    active ? 'text-emerald-950' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="simSubTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-emerald-50 border border-emerald-200 rounded-xl"
                    />
                  )}
                  <img src={tab.icon} alt={tab.title} className="relative z-10 w-7 h-7 object-contain" />
                  <div className="relative z-10 min-w-0">
                    <div className="text-xs font-extrabold truncate">{tab.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { id: 'noshow' as ProModule, title: '1. Anti No-Show (24h / 3h)', desc: 'Ubicación + Confirmación', icon: <BellRing className="w-5 h-5 text-emerald-600" /> },
              { id: 'cuidados' as ProModule, title: '2. Cuidados Post-Cita (2T)', desc: '24h + Día 10 seguimiento', icon: <HeartHandshake className="w-5 h-5 text-rose-600" /> },
              { id: 'retoques' as ProModule, title: '3. Mantenimiento & Rescate', desc: 'Ciclos variables por servicio', icon: <Radar className="w-5 h-5 text-cyan-600" /> },
              { id: 'marketing' as ProModule, title: '4. Marketing Segmentado', desc: 'Por historial + Festividades', icon: <Megaphone className="w-5 h-5 text-violet-600" /> },
            ].map((tab) => {
              const active = proModule === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    playUiSound('click', soundEnabled);
                    setProModule(tab.id);
                    resetAll();
                  }}
                  className={`relative flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition cursor-pointer ${
                    active ? 'text-violet-950' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="simSubTab"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute inset-0 bg-violet-50 border border-violet-200 rounded-xl"
                    />
                  )}
                  <div className="relative z-10 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                    {tab.icon}
                  </div>
                  <div className="relative z-10 min-w-0">
                    <div className="text-xs font-extrabold truncate">{tab.title}</div>
                    <div className="text-[11px] text-slate-500 truncate">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Escenario Principal: Controles + SVG Beam + iPhone 2.5D */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Panel Izquierdo */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white/95 border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 text-white font-bold flex items-center justify-center text-xs">
                SM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Sofía Martínez</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    VIP • 2/12 Sellos
                  </span>
                </div>
                <p className="text-xs text-slate-500">Valor anual retenido: <strong>~$450 USD</strong></p>
              </div>
            </div>
            <button
              onClick={() => {
                playUiSound('click', soundEnabled);
                resetAll();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-violet-700 bg-slate-100 px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reiniciar
            </button>
          </div>

          <AnimatePresence mode="wait">
            {/* PANEL GLOW */}
            {plan === 'glow' && glowModule === 'post_cita' && (
              <motion.div
                key="g-post"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Nilah Glow • Post-Cita</span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">Calificación en Caliente + Escudo 1–5</h3>
                  </div>
                  <img src="/assets/3d/star.png" alt="Estrella" className="w-10 h-10 object-contain" />
                </div>

                <button
                  onClick={handleCompleteCita}
                  disabled={step >= 1}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left transition ${
                    step >= 1
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-600/20 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <div>
                      <div className="text-sm font-bold">1. Marcar cita como "Completada"</div>
                      <div className={`text-xs ${step >= 1 ? 'text-emerald-700' : 'text-violet-100'}`}>
                        {step >= 1 ? 'Encuesta enviada (+30 min)' : 'Simular cierre en agenda'}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold tabular-nums px-2.5 py-1 rounded-lg bg-black/10">
                    4:{clockMinutes.toString().padStart(2, '0')} PM
                  </span>
                </button>

                {step >= 1 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handleSelectRating('5')}
                      disabled={step >= 2}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        ratingChoice === '5'
                          ? 'bg-emerald-50 border-emerald-400'
                          : step >= 2
                          ? 'opacity-50 bg-slate-50 border-slate-200'
                          : 'bg-white hover:bg-emerald-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-amber-600">⭐⭐⭐⭐⭐ (5)</span>
                        <img src="/assets/3d/gift.png" alt="Regalo" className="w-6 h-6 object-contain" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">Responde "5"</div>
                      <p className="text-xs text-slate-500 mt-0.5">Entrega Sello #3 + Billetera VIP.</p>
                    </button>

                    <button
                      onClick={() => handleSelectRating('3')}
                      disabled={step >= 2}
                      className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                        ratingChoice === '3'
                          ? 'bg-rose-50 border-rose-400'
                          : step >= 2
                          ? 'opacity-50 bg-slate-50 border-slate-200'
                          : 'bg-white hover:bg-rose-50/60 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-rose-600">3 ⭐ Alerta</span>
                        <img src="/assets/3d/shield.png" alt="Escudo" className="w-6 h-6 object-contain" />
                      </div>
                      <div className="text-sm font-bold text-slate-900">Responde "3"</div>
                      <p className="text-xs text-slate-500 mt-0.5">Activa Escudo Privado + Pausa 24h.</p>
                    </button>
                  </div>
                )}

                {ratingChoice === '3' && (
                  <button
                    onClick={handleResumeAfter24h}
                    disabled={step >= 3}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition ${
                      step >= 3
                        ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                        : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      3. Simular +24 horas después (Recibe sus sellos)
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}

            {plan === 'glow' && glowModule === 'cumpleanos' && (
              <motion.div
                key="g-bday"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-pink-600">Nilah Glow • Cumpleaños 2T</span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">Llena tu agenda 7 días antes</h3>
                  </div>
                  <img src="/assets/3d/cake.png" alt="Pastel" className="w-10 h-10 object-contain" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => handleBirthdayTime1('standard')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      step >= 1 && birthdayMode === 'standard'
                        ? 'bg-pink-50 border-pink-400'
                        : 'bg-gradient-to-br from-pink-600 to-rose-600 text-white'
                    }`}
                  >
                    <div className="text-xs font-extrabold uppercase opacity-80">1A. 7 Días Antes</div>
                    <div className="text-sm font-bold mt-1">Regalo +1 Sello VIP</div>
                  </button>
                  <button
                    onClick={() => handleBirthdayTime1('direct_reward')}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      step >= 1 && birthdayMode === 'direct_reward'
                        ? 'bg-amber-50 border-amber-400'
                        : 'bg-white hover:bg-amber-50/60 border-slate-200'
                    }`}
                  >
                    <div className="text-xs font-extrabold uppercase text-amber-600">1B. A 1 Sello del Hito</div>
                    <div className="text-sm font-bold text-slate-900 mt-1">Premio Directo ($10)</div>
                  </button>
                </div>

                <button
                  onClick={handleBirthdayTime2}
                  disabled={step < 1 || step >= 2}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold text-sm transition ${
                    step < 1
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : step >= 2
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                      : 'bg-slate-900 text-white cursor-pointer'
                  }`}
                >
                  <span>2. Día Exacto (9:00 AM • Felicitación sin venta)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {plan === 'glow' && glowModule === 'nocturno' && (
              <motion.div
                key="g-night"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Nilah Glow • Control</span>
                    <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">Escudo Nocturno + Ranking de Equipo</h3>
                  </div>
                  <img src={nightPhase === 'released' ? '/assets/3d/sun.png' : '/assets/3d/moon.png'} alt="Nocturno" className="w-10 h-10 object-contain" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleNightRegister}
                    className={`p-4 rounded-2xl border text-left transition cursor-pointer ${
                      nightPhase === 'queued' ? 'bg-indigo-50 border-indigo-400' : 'bg-indigo-600 text-white'
                    }`}
                  >
                    <div className="text-xs font-extrabold uppercase opacity-80">1. 11:15 PM</div>
                    <div className="text-sm font-bold mt-1">Registrar cita tarde</div>
                  </button>
                  <button
                    onClick={handleMorningRelease}
                    disabled={nightPhase !== 'queued'}
                    className={`p-4 rounded-2xl border text-left transition ${
                      nightPhase === 'queued'
                        ? 'bg-amber-500 text-white cursor-pointer'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <div className="text-xs font-extrabold uppercase opacity-80">2. 7:05 AM</div>
                    <div className="text-sm font-bold mt-1">Liberar al despertar</div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* PANEL PRO */}
            {plan === 'pro' && proModule === 'noshow' && (
              <motion.div
                key="p-ns"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Nilah Pro • Pre-Cita</span>
                <h3 className="text-lg font-extrabold text-slate-900">Recordatorios Anti No-Show (24h y 3h antes)</h3>
                <button onClick={() => handleNoShow(1)} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-emerald-600 text-white font-bold text-sm cursor-pointer">
                  <span>1. Enviar Recordatorio 24h Antes</span>
                  <BellRing className="w-4 h-4" />
                </button>
                <button onClick={() => handleNoShow(2)} disabled={step < 1} className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold text-sm ${step < 1 ? 'bg-slate-100 text-slate-400' : 'bg-white border-emerald-300 text-slate-900 cursor-pointer'}`}>
                  <span>2. Enviar Recordatorio 3h Antes + Ubicación</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </button>
                <button onClick={() => handleNoShow(3)} disabled={step < 2} className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold text-sm ${step < 2 ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white cursor-pointer'}`}>
                  <span>3. Sofía Confirma Asistencia</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              </motion.div>
            )}

            {plan === 'pro' && proModule === 'cuidados' && (
              <motion.div
                key="p-care"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Nilah Pro • Acompañamiento</span>
                <h3 className="text-lg font-extrabold text-slate-900">Guía de Cuidados Post-Cita (2 Tiempos)</h3>
                <p className="text-xs text-slate-500">Para que la clienta sienta que la acompañas y no te olvidas de ella tras pagar.</p>
                <button onClick={() => handleCuidados(1)} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-rose-600 text-white font-bold text-sm cursor-pointer">
                  <span>1. Cuidados Inmediatos (24h después)</span>
                  <HeartHandshake className="w-4 h-4" />
                </button>
                <button onClick={() => handleCuidados(2)} disabled={step < 1} className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold text-sm ${step < 1 ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white cursor-pointer'}`}>
                  <span>2. Seguimiento Día 10 ("¿Tuviste algún problema?")</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {plan === 'pro' && proModule === 'retoques' && (
              <motion.div
                key="p-ret"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600">Nilah Pro • Ciclos Variables</span>
                <h3 className="text-lg font-extrabold text-slate-900">Mantenimiento & Rescate de Ausentes (2 Tiempos)</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'pestanas' as const, label: 'Pestañas (18d / 45d)' },
                    { id: 'unas' as const, label: 'Uñas (30d / 60d)' },
                    { id: 'alisado' as const, label: 'Alisado (3m / 4m)' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setRetoqueService(s.id);
                        resetAll();
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        retoqueService === s.id ? 'bg-cyan-600 text-white border-transparent' : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => handleRetoques(1)} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-cyan-600 text-white font-bold text-sm cursor-pointer">
                  <span>1. Recordatorio de Retoque (Tiempo 1)</span>
                  <Radar className="w-4 h-4" />
                </button>
                <button onClick={() => handleRetoques(2)} disabled={step < 1} className={`w-full flex items-center justify-between p-3.5 rounded-xl border font-bold text-sm ${step < 1 ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white cursor-pointer'}`}>
                  <span>2. Rescate de Ausente (Tiempo 2)</span>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </button>
              </motion.div>
            )}

            {plan === 'pro' && proModule === 'marketing' && (
              <motion.div
                key="p-mkt"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white/95 border border-slate-200/80 rounded-3xl p-6 shadow-md space-y-3"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-violet-600">Nilah Pro • Ventas Estratégicas</span>
                <h3 className="text-lg font-extrabold text-slate-900">Marketing Segmentado por Historial + Festividades</h3>
                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <div className="text-base font-black text-violet-700">20</div>
                    <div className="text-[10px] font-bold text-slate-500">Solo Uñas</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-pink-600">15</div>
                    <div className="text-[10px] font-bold text-slate-500">Solo Pestañas</div>
                  </div>
                  <div>
                    <div className="text-base font-black text-emerald-600">12</div>
                    <div className="text-[10px] font-bold text-slate-500">Uñas + Pestañas</div>
                  </div>
                </div>
                <button onClick={() => handleMarketingSegmentado('segment')} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-violet-600 text-white font-bold text-sm cursor-pointer">
                  <span>1. Enviar 10% Uñas SOLO al segmento Uñas (20)</span>
                  <Filter className="w-4 h-4" />
                </button>
                <button onClick={() => handleMarketingSegmentado('holiday')} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 text-white font-bold text-sm cursor-pointer">
                  <span>2. Campaña Festiva (San Valentín / Navidad)</span>
                  <Megaphone className="w-4 h-4 text-pink-400" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SVG Beam Conector */}
        <div className="hidden lg:flex lg:col-span-1 flex-col items-center justify-center">
          <svg className="w-full h-16 overflow-visible" viewBox="0 0 120 40">
            <defs>
              <linearGradient id="nilahSimBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.95" />
              </linearGradient>
            </defs>
            <path d="M 0 20 C 40 20, 80 20, 120 20" fill="none" stroke="#e2e8f0" strokeWidth="3" strokeDasharray="6 6" />
            {beamPulse > 0 && (
              <motion.path
                key={beamPulse}
                d="M 0 20 C 40 20, 80 20, 120 20"
                fill="none"
                stroke="url(#nilahSimBeam)"
                strokeWidth="4"
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 1 }}
                animate={{ pathLength: 1, opacity: [1, 1, 0] }}
                transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
              />
            )}
          </svg>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nilah IA</span>
        </div>

        {/* iPhone 2.5D Light + WhatsApp Light */}
        <div className="lg:col-span-5 flex justify-center" style={{ perspective: '1200px' }}>
          <motion.div
            initial={{ opacity: 0, rotateY: -6, rotateX: 3 }}
            whileInView={{ opacity: 1, rotateY: -3, rotateX: 1.5 }}
            whileHover={{ rotateY: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
            className={`w-full max-w-[365px] rounded-[2.6rem] p-2.5 bg-gradient-to-b from-slate-200 via-white to-slate-300 shadow-[0_24px_60px_-15px_rgba(124,58,237,0.22),0_0_0_1px_rgba(148,163,184,0.4)] ${
              shieldIntercepted ? 'ring-4 ring-rose-400/50' : ''
            }`}
          >
            <div className="bg-[#EFEAE2] rounded-[2.1rem] overflow-hidden flex flex-col h-[570px] border border-slate-300/70">
              <div className="bg-[#F6F6F6] px-4 pt-2.5 pb-1.5 flex items-center justify-between text-[10.5px] font-bold text-slate-800">
                <span>4:32</span>
                <motion.div
                  layout
                  className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold flex items-center gap-1 ${
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
                  <span className="truncate max-w-[130px]">{dynamicIsland.text}</span>
                </motion.div>
                <div className="flex items-center gap-1 text-slate-700">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="bg-[#F6F6F6] px-4 py-2 flex items-center gap-2.5 border-b border-slate-200">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center text-white text-xs">
                  💅
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-900 truncate">Tu Salón VIP</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-[10px] font-medium text-emerald-600">
                    {isTyping ? 'escribiendo...' : 'en línea'}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {messages.length === 0 && !isTyping && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-5">
                    <img src="/assets/3d/sparkles.png" alt="Nilah" className="w-12 h-12 object-contain mb-2" />
                    <p className="text-xs font-semibold text-slate-600 bg-white/90 px-4 py-2.5 rounded-2xl border border-slate-200">
                      Haz clic en los botones de la izquierda para ver la automatización en vivo.
                    </p>
                  </div>
                )}

                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    if (msg.sender === 'system') {
                      return (
                        <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
                          <div className="bg-[#FFF8E1] text-amber-900 text-[10px] font-semibold px-3 py-1 rounded-xl text-center border border-amber-200">
                            {msg.text}
                          </div>
                        </motion.div>
                      );
                    }
                    const isClient = msg.sender === 'client';
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                        className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[88%] rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed shadow-xs ${
                            isClient ? 'bg-[#D9FDD3] text-slate-900 rounded-tr-xs' : 'bg-white text-slate-800 rounded-tl-xs border border-slate-100'
                          }`}
                        >
                          {msg.badge && (
                            <div
                              className={`inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${
                                msg.badge.tone === 'emerald'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : msg.badge.tone === 'rose'
                                  ? 'bg-rose-100 text-rose-800'
                                  : msg.badge.tone === 'amber'
                                  ? 'bg-amber-100 text-amber-800'
                                  : msg.badge.tone === 'cyan'
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-violet-100 text-violet-800'
                              }`}
                            >
                              {msg.badge.tone === 'rose' && <AlertTriangle className="w-2.5 h-2.5" />}
                              {msg.badge.label}
                            </div>
                          )}
                          <div className="whitespace-pre-line">{msg.text}</div>

                          {msg.walletCard && (
                            <div className="mt-2 rounded-xl p-2.5 border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
                              <div className="flex items-center justify-between mb-1.5">
                                <div>
                                  <div className="text-[10.5px] font-extrabold text-violet-950">{msg.walletCard.title}</div>
                                  <div className="text-[9.5px] text-slate-500">{msg.walletCard.subtitle}</div>
                                </div>
                                <img
                                  src={msg.walletCard.unlockedReward ? '/assets/3d/crown.png' : '/assets/3d/card.png'}
                                  alt="VIP"
                                  className="w-6 h-6 object-contain"
                                />
                              </div>
                              <div className="grid grid-cols-6 gap-1">
                                {Array.from({ length: msg.walletCard.maxStamps }).map((_, idx) => {
                                  const filled = idx < msg.walletCard!.stamps;
                                  const milestoneIcon = idx === 3 ? '🎁' : idx === 7 ? '💎' : idx === 11 ? '👑' : null;
                                  return (
                                    <div
                                      key={idx}
                                      className={`h-5 rounded-md flex items-center justify-center text-[9.5px] font-extrabold border ${
                                        filled
                                          ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white border-transparent'
                                          : milestoneIcon
                                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                                          : 'bg-white text-slate-400 border-slate-200'
                                      }`}
                                    >
                                      {filled ? '★' : milestoneIcon ?? idx + 1}
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="mt-1.5 text-[10px] font-bold text-emerald-700">{msg.walletCard.highlight}</div>
                            </div>
                          )}

                          {msg.linkText && (
                            <div className="mt-1.5 pt-1 border-t border-slate-100 text-[10px] font-semibold text-violet-700 flex items-center gap-1">
                              <span className="truncate">{msg.linkText}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </div>
                          )}

                          <div className="text-[9px] text-slate-400 text-right mt-1">
                            {msg.time} {isClient && <span className="text-sky-500 font-bold">✓✓</span>}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 rounded-2xl px-3 py-2 text-xs text-slate-400">
                      escribiendo...
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="bg-[#F6F6F6] px-3 py-2 border-t border-slate-200 flex items-center gap-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-full px-3 py-1 text-[10.5px] text-slate-400">
                  Automatizado con Nilah IA...
                </div>
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                  <Send className="w-3 h-3" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
