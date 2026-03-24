import React, { useCallback, useEffect, useRef, useState } from 'react';
import { User, MessageCircle, DollarSign } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 1. CIRCUIT FLOW LINES — Animated data-flow background
//    Used in: KoratHome "Qué Hacemos" section
// ═══════════════════════════════════════════════════════════

export const CircuitFlowSVG: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
        viewBox="0 0 800 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        {/* Node dots */}
        <circle cx="100" cy="200" r="6" fill="#10B981" opacity="0.6">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="300" cy="100" r="5" fill="#10B981" opacity="0.5">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="500" cy="280" r="6" fill="#10B981" opacity="0.6">
            <animate attributeName="opacity" values="0.4;0.9;0.4" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="700" cy="150" r="5" fill="#10B981" opacity="0.5">
            <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="400" cy="200" r="8" fill="#8B5CF6" opacity="0.7">
            <animate attributeName="r" values="7;10;7" dur="3s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;0.9;0.5" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Circuit paths */}
        <path
            d="M100 200 Q200 150 300 100"
            stroke="#10B981"
            strokeWidth="1.5"
            className="animate-glow-trace"
            opacity="0.6"
        />
        <path
            d="M300 100 Q350 150 400 200"
            stroke="#10B981"
            strokeWidth="1.5"
            className="animate-glow-trace"
            opacity="0.6"
            style={{ animationDelay: '0.5s' }}
        />
        <path
            d="M400 200 Q450 250 500 280"
            stroke="#8B5CF6"
            strokeWidth="1.5"
            className="animate-glow-trace"
            opacity="0.5"
            style={{ animationDelay: '1s' }}
        />
        <path
            d="M500 280 Q600 220 700 150"
            stroke="#8B5CF6"
            strokeWidth="1.5"
            className="animate-glow-trace"
            opacity="0.5"
            style={{ animationDelay: '1.5s' }}
        />

        {/* Secondary ambient lines */}
        <path
            d="M50 350 Q200 300 350 320 Q500 340 750 300"
            stroke="#10B981"
            strokeWidth="0.8"
            className="animate-circuit-pulse"
            opacity="0.2"
        />
        <path
            d="M80 50 Q250 80 400 60 Q600 40 780 80"
            stroke="#10B981"
            strokeWidth="0.8"
            className="animate-circuit-pulse"
            opacity="0.15"
            style={{ animationDelay: '1.5s' }}
        />
    </svg>
);

// ═══════════════════════════════════════════════════════════
// 2. WIREFRAME SPHERE — Tech aesthetic for hero sections
//    Used in: KoratHome Hero
// ═══════════════════════════════════════════════════════════

export const WireframeSphere: React.FC<{ className?: string; color?: string }> = ({
    className = '',
    color = '#10B981'
}) => (
    <div className={`animate-sphere-rotate ${className}`} style={{ transformStyle: 'preserve-3d' }}>
        <svg
            width="280" height="280" viewBox="0 0 280 280"
            fill="none" xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
        >
            {/* Horizontal ellipses */}
            {[0, 30, 60, 90, 120, 150].map((ry, i) => (
                <ellipse
                    key={`h-${i}`}
                    cx="140" cy="140"
                    rx="120"
                    ry={Math.abs(120 * Math.cos((ry * Math.PI) / 180))}
                    stroke={color}
                    strokeWidth="0.6"
                    opacity={0.15 + i * 0.05}
                />
            ))}
            {/* Vertical ellipses */}
            {[0, 45, 90, 135].map((rx, i) => (
                <ellipse
                    key={`v-${i}`}
                    cx="140" cy="140"
                    rx={Math.abs(120 * Math.cos((rx * Math.PI) / 180))}
                    ry="120"
                    stroke={color}
                    strokeWidth="0.6"
                    opacity={0.15 + i * 0.05}
                />
            ))}
            {/* Center glow */}
            <circle cx="140" cy="140" r="4" fill={color} opacity="0.8">
                <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
            </circle>
        </svg>
    </div>
);

// ═══════════════════════════════════════════════════════════
// 3. FLOATING REACTION BUBBLES — Social proof animation
//    Used in: Nilah IA Landing Hero (around WhatsApp mockup)
// ═══════════════════════════════════════════════════════════

const bubbles = [
    { emoji: '✅', x: -40, delay: 'bubble-delay-1' },
    { emoji: '💅', x: 50, delay: 'bubble-delay-2' },
    { emoji: '❤️', x: -30, delay: 'bubble-delay-3' },
    { emoji: '📅', x: 60, delay: 'bubble-delay-4' },
    { emoji: '⭐', x: -50, delay: 'bubble-delay-5' },
];

export const FloatingReactionBubbles: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden="true">
        {bubbles.map((b, i) => (
            <div
                key={i}
                className={`absolute bottom-0 animate-float-up ${b.delay}`}
                style={{ left: `calc(50% + ${b.x}px)` }}
            >
                <span className="text-lg drop-shadow-md">{b.emoji}</span>
            </div>
        ))}
    </div>
);

// ═══════════════════════════════════════════════════════════
// 4. NILAH FLOW DIAGRAM — Animated "How It Works" graphic
//    Used in: Landing "Cómo Funciona" section
// ═══════════════════════════════════════════════════════════

export const NilahFlowDiagram: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        className={`w-full max-w-3xl mx-auto ${className}`}
        viewBox="0 0 700 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        {/* WhatsApp Node */}
        <circle cx="80" cy="70" r="30" fill="#25D366" opacity="0.15" />
        <circle cx="80" cy="70" r="20" fill="#25D366" opacity="0.3">
            <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
        </circle>
        <text x="80" y="76" textAnchor="middle" fontSize="20" aria-hidden="true">📱</text>
        <text x="80" y="115" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6" className="dark:fill-gray-400">Cliente</text>

        {/* Flow line 1: WhatsApp → Brain */}
        <path
            d="M115 70 Q200 30 270 70"
            stroke="#8B5CF6"
            strokeWidth="2"
            className="animate-glow-trace"
            style={{ animationDelay: '0s' }}
        />
        {/* Data dot traveling */}
        <circle r="4" fill="#8B5CF6" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" path="M115 70 Q200 30 270 70" />
        </circle>

        {/* Brain Node (Nilah) */}
        <circle cx="350" cy="70" r="38" fill="#8B5CF6" opacity="0.1">
            <animate attributeName="r" values="36;42;36" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="350" cy="70" r="26" fill="#8B5CF6" opacity="0.25" />
        <text x="350" y="76" textAnchor="middle" fontSize="22" aria-hidden="true">🤖</text>
        <text x="350" y="120" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6" className="dark:fill-gray-400">Nilah IA</text>
        {/* Pulse ring */}
        <circle cx="350" cy="70" r="26" stroke="#8B5CF6" strokeWidth="1" fill="none" opacity="0.4">
            <animate attributeName="r" values="26;50;26" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
        </circle>

        {/* Flow line 2: Brain → Calendar */}
        <path
            d="M390 55 Q460 20 530 50"
            stroke="#EC4899"
            strokeWidth="2"
            className="animate-glow-trace"
            style={{ animationDelay: '1s' }}
        />
        <circle r="3" fill="#EC4899" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" path="M390 55 Q460 20 530 50" begin="1s" />
        </circle>

        {/* Flow line 3: Brain → Dashboard */}
        <path
            d="M390 85 Q460 120 530 90"
            stroke="#10B981"
            strokeWidth="2"
            className="animate-glow-trace"
            style={{ animationDelay: '1.5s' }}
        />
        <circle r="3" fill="#10B981" opacity="0.9">
            <animateMotion dur="2s" repeatCount="indefinite" path="M390 85 Q460 120 530 90" begin="1.5s" />
        </circle>

        {/* Calendar Node */}
        <circle cx="580" cy="45" r="22" fill="#EC4899" opacity="0.15" />
        <text x="580" y="51" textAnchor="middle" fontSize="18" aria-hidden="true">📅</text>
        <text x="580" y="80" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6" className="dark:fill-gray-400">Agenda</text>

        {/* Dashboard Node */}
        <circle cx="580" cy="100" r="22" fill="#10B981" opacity="0.15" />
        <text x="580" y="106" textAnchor="middle" fontSize="18" aria-hidden="true">📊</text>
        <text x="580" y="135" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.6" className="dark:fill-gray-400">Dashboard</text>
    </svg>
);

// ═══════════════════════════════════════════════════════════
// 5. MORPHING BLOB — Organic gradient element
//    Used in: Hero backgrounds, section dividers
// ═══════════════════════════════════════════════════════════

export const MorphingBlob: React.FC<{
    className?: string;
    colors?: string;
    size?: string;
}> = ({
    className = '',
    colors = 'from-emerald-500/20 via-teal-500/15 to-green-500/10',
    size = 'h-[400px] w-[400px]',
}) => (
        <div
            className={`absolute bg-gradient-to-br ${colors} ${size} animate-morph-blob blur-[80px] pointer-events-none ${className}`}
            aria-hidden="true"
        />
    );

// ═══════════════════════════════════════════════════════════
// 6. ANIMATED COUNTER — For statistics with pop-in effect
//    Used in: Landing stats, Dashboard KPIs
// ═══════════════════════════════════════════════════════════

export const AnimatedCounter: React.FC<{
    value: string;
    label: string;
    className?: string;
    gradientClass?: string;
}> = ({ value, label, className = '', gradientClass = 'from-violet-500 to-pink-500' }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={ref} className={`px-8 ${className}`}>
            <p className={`text-4xl font-extrabold bg-gradient-to-r ${gradientClass} bg-clip-text text-transparent ${isVisible ? 'animate-number-pop' : 'opacity-0'}`}>
                {value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// 7. PARALLAX PHONE MOCKUP WRAPPER
//    Used in: Landing Hero WhatsApp mockup
// ═══════════════════════════════════════════════════════════

export const ParallaxTiltWrapper: React.FC<{
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}> = ({ children, className = '', intensity = 8 }) => {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        ref.current.style.transform = `rotateY(${x * intensity}deg) rotateX(${-y * intensity}deg)`;
    };

    const handleMouseLeave = () => {
        if (ref.current) ref.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
    };

    return (
        <div className={`perspective-container ${className}`}>
            <div
                ref={ref}
                className="tilt-card"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════
// 8. TECH STACK ORBIT — Animated circular orbit for logos
//    Used in: KoratHome Tech Stack section
// ═══════════════════════════════════════════════════════════

export const TechOrbitSVG: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        className={`w-48 h-48 md:w-64 md:h-64 ${className}`}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
    >
        {/* Orbit rings */}
        <circle cx="100" cy="100" r="80" stroke="#10B981" strokeWidth="0.5" opacity="0.2" />
        <circle cx="100" cy="100" r="55" stroke="#10B981" strokeWidth="0.5" opacity="0.15" />

        {/* Center node */}
        <circle cx="100" cy="100" r="12" fill="#10B981" opacity="0.2">
            <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite" />
        </circle>
        <text x="100" y="104" textAnchor="middle" fontSize="12" aria-hidden="true">⚡</text>

        {/* Orbiting dots */}
        <circle r="5" fill="#8B5CF6" opacity="0.7">
            <animateMotion dur="8s" repeatCount="indefinite" path="M100,20 A80,80 0 1,1 99.99,20" />
        </circle>
        <circle r="4" fill="#10B981" opacity="0.7">
            <animateMotion dur="6s" repeatCount="indefinite" path="M100,45 A55,55 0 1,1 99.99,45" />
        </circle>
        <circle r="3" fill="#EC4899" opacity="0.7">
            <animateMotion dur="10s" repeatCount="indefinite" path="M100,20 A80,80 0 1,0 99.99,20" />
        </circle>
    </svg>
);

// ═══════════════════════════════════════════════════════════
// 9. NILAH WHATSAPP CONVO — Animated live WhatsApp chat
//    Used in: La Solución "Activadores de Rescate" section
// ═══════════════════════════════════════════════════════════
interface ConvoMessage {
  from: 'nilah' | 'client';
  text: string;
  delay: number; // ms before appearing
}

const RESCUE_CONVO: ConvoMessage[] = [
  { from: 'nilah', text: 'No voy a decir que llevo semanas mirando tu espacio vacío... pero lo estoy diciendo. 👀', delay: 1000 },
  { from: 'nilah', text: 'Pero como soy buena gente, te guardé un regalito — y tu espacio favorito también. 😏🎁', delay: 5000 },
  { from: 'nilah', text: 'Sofía, ¿coordinamos esta semana? 💅', delay: 9000 },
  { from: 'client', text: 'Jajajaja me leíste la mente 😂 ¡Sí! Anótame para el jueves a las 4pm 🙌', delay: 13500 },
];


export const NilahWhatsAppConvo: React.FC<{ className?: string; autoPlay?: boolean }> = ({
  className = '',
  autoPlay = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(autoPlay);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startAnimation = useCallback(() => {
    if (visibleCount > 0) return; // already started
    setStarted(true);
    setVisibleCount(0);
    setTyping(false);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    RESCUE_CONVO.forEach((msg, i) => {
      // Show typing indicator just before each nilah message
      if (msg.from === 'nilah') {
        const t1 = setTimeout(() => setTyping(true), msg.delay - 800);
        const t2 = setTimeout(() => {
          setTyping(false);
          setVisibleCount(i + 1);
        }, msg.delay);
        timeoutsRef.current.push(t1, t2);
      } else {
        const t = setTimeout(() => setVisibleCount(i + 1), msg.delay);
        timeoutsRef.current.push(t);
      }
    });
  }, [visibleCount]);

  // Auto-restart when cycling is complete
  useEffect(() => {
    if (!started) return;
    if (visibleCount === RESCUE_CONVO.length) {
      const restart = setTimeout(() => {
        setVisibleCount(0);
        setStarted(false);
        setTimeout(() => setStarted(true), 300);
      }, 12000);
      return () => clearTimeout(restart);
    }
  }, [visibleCount, started]);

  // Trigger on scroll into view
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) startAnimation();
    }, { threshold: 0.3 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [started, startAnimation]);

  // Re-trigger when started flips back to true after restart
  useEffect(() => {
    if (started && visibleCount === 0) startAnimation();
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-xs mx-auto select-none ${className}`}
    >
      {/* Phone frame */}
      <div className="bg-[#111B21] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1F2C34]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-extrabold text-sm">N</div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-none">Nilah IA 🤖</p>
            <p className="text-[#8696A0] text-[11px] mt-0.5">Salón Bella</p>
          </div>
          <span className="text-xs text-[#25D366] font-bold">● en línea</span>
        </div>

        {/* Chat area */}
        <div
          className="p-3 space-y-2 h-[340px] overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03' fill='%23fff'%3E%3Cpolygon points='25,0 30,20 50,20 35,30 40,50 25,38 10,50 15,30 0,20 20,20' /%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0B141A',
          }}
        >
          {RESCUE_CONVO.slice(0, visibleCount).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === 'nilah' ? 'justify-start' : 'justify-end'} animate-fade-in-up`}
              style={{ animationDuration: '0.35s', animationFillMode: 'both' }}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-[13px] leading-snug max-w-[82%] shadow-md ${
                  msg.from === 'nilah'
                    ? 'bg-[#1F2C34] text-[#E9EDEF] rounded-tl-none'
                    : 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="bg-[#1F2C34] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating reaction bubbles */}
      {visibleCount >= RESCUE_CONVO.length && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-2 pointer-events-none">
          {['💅', '✅', '🎉'].map((e, i) => (
            <span
              key={i}
              className="text-xl animate-float-up"
              style={{ animationDelay: `${i * 0.2}s`, animationFillMode: 'both' }}
            >
              {e}
            </span>
          ))}
        </div>
      )}

      {/* Play button when paused */}
      {!started && visibleCount === 0 && (
        <button
          onClick={startAnimation}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-sm"
        >
          <span className="bg-white/90 rounded-full px-4 py-2 text-sm font-bold text-gray-900 shadow-lg">▶ Ver en acción</span>
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// NEW. POST-VISITA WHATSAPP CONVO MOCKUP
// ═══════════════════════════════════════════════════════════
const POST_VISITA_CONVO: ConvoMessage[] = [
  { from: 'nilah', text: '¡Sofía! ✨ Qué alegría haberte tenido con nosotras.\n\nSumaste 40 puntos en tu esmaltado semipermanente 💅\nYa llevas 210 en total.\n\n━━━━━━━━━━\n🎯 ¡Vas muy bien!\nSolo te faltan 20 puntos para canjear tu\nUñas Acrílicas Gratis 🎁\n━━━━━━━━━━\n\n¡Que tengas una tarde preciosa! 🌸', delay: 1000 },
  { from: 'nilah', text: 'Una preguntita rápida, Sofía 😊\n¿Cómo te sentiste con la atención durante tu visita?\n\nDel 1 al 5, ¿cómo calificarías tu experiencia?\n👉 Responde solo con el número', delay: 4500 }
];

export const NilahWhatsAppPostVisita: React.FC<{ className?: string; autoPlay?: boolean }> = ({
  className = '',
  autoPlay = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(autoPlay);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startAnimation = useCallback(() => {
    if (visibleCount > 0) return; // already started
    setStarted(true);
    setVisibleCount(0);
    setTyping(false);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    POST_VISITA_CONVO.forEach((msg, i) => {
      // Show typing indicator just before each nilah message
      if (msg.from === 'nilah') {
        const t1 = setTimeout(() => setTyping(true), msg.delay - 800);
        const t2 = setTimeout(() => {
          setTyping(false);
          setVisibleCount(i + 1);
        }, msg.delay);
        timeoutsRef.current.push(t1, t2);
      } else {
        const t = setTimeout(() => setVisibleCount(i + 1), msg.delay);
        timeoutsRef.current.push(t);
      }
    });
  }, [visibleCount]);

  // Auto-restart when cycling is complete
  useEffect(() => {
    if (!started) return;
    if (visibleCount === POST_VISITA_CONVO.length) {
      const restart = setTimeout(() => {
        setVisibleCount(0);
        setStarted(false);
        setTimeout(() => setStarted(true), 300);
      }, 12000);
      return () => clearTimeout(restart);
    }
  }, [visibleCount, started]);

  // Trigger on scroll into view
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) startAnimation();
    }, { threshold: 0.3 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [started, startAnimation]);

  // Re-trigger when started flips back to true after restart
  useEffect(() => {
    if (started && visibleCount === 0) startAnimation();
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-xs mx-auto select-none ${className}`}
    >
      {/* Phone frame */}
      <div className="bg-[#111B21] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1F2C34]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-extrabold text-sm">N</div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-none">Nilah IA 🤖</p>
            <p className="text-[#8696A0] text-[11px] mt-0.5">Salón Bella</p>
          </div>
          <span className="text-xs text-[#25D366] font-bold">● en línea</span>
        </div>

        {/* Chat area */}
        <div
          className="p-3 space-y-2 h-[360px] overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03' fill='%23fff'%3E%3Cpolygon points='25,0 30,20 50,20 35,30 40,50 25,38 10,50 15,30 0,20 20,20' /%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0B141A',
          }}
        >
          {POST_VISITA_CONVO.slice(0, visibleCount).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === 'nilah' ? 'justify-start' : 'justify-end'} animate-fade-in-up`}
              style={{ animationDuration: '0.35s', animationFillMode: 'both' }}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-[13px] leading-snug max-w-[85%] shadow-md whitespace-pre-wrap ${
                  msg.from === 'nilah'
                    ? 'bg-[#1F2C34] text-[#E9EDEF] rounded-tl-none'
                    : 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="bg-[#1F2C34] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Play button when paused */}
      {!started && visibleCount === 0 && (
        <button
          onClick={startAnimation}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-sm"
        >
          <span className="bg-white/90 rounded-full px-4 py-2 text-sm font-bold text-gray-900 shadow-lg">▶ Ver en acción</span>
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// NEW. RETOQUE WHATSAPP CONVO MOCKUP (Día 15-20)
// ═══════════════════════════════════════════════════════════
const RETOQUE_CONVO: ConvoMessage[] = [
  { from: 'nilah', text: 'Dime que no estás mirando tus acrílicas con esa cara de "están bien" cuando claramente no están bien... 😏', delay: 1000 },
  { from: 'nilah', text: 'Sofía, el crecimiento de la cutícula ya está contando los días — y yo también. 💅 ¿Les damos el rescate esta semana? 👀✨', delay: 6000 },
  { from: 'client', text: '¡Ay sí! Menos mal me escribes, se me había pasado por completo. El jueves a las 5pm porfa 🙏', delay: 11000 },
];

export const NilahWhatsAppRetoque: React.FC<{ className?: string; autoPlay?: boolean }> = ({
  className = '',
  autoPlay = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(autoPlay);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startAnimation = useCallback(() => {
    if (visibleCount > 0) return; // already started
    setStarted(true);
    setVisibleCount(0);
    setTyping(false);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    RETOQUE_CONVO.forEach((msg, i) => {
      // Show typing indicator just before each nilah message
      if (msg.from === 'nilah') {
        const t1 = setTimeout(() => setTyping(true), msg.delay - 800);
        const t2 = setTimeout(() => {
          setTyping(false);
          setVisibleCount(i + 1);
        }, msg.delay);
        timeoutsRef.current.push(t1, t2);
      } else {
        const t = setTimeout(() => setVisibleCount(i + 1), msg.delay);
        timeoutsRef.current.push(t);
      }
    });
  }, [visibleCount]);

  // Auto-restart when cycling is complete
  useEffect(() => {
    if (!started) return;
    if (visibleCount === RETOQUE_CONVO.length) {
      const restart = setTimeout(() => {
        setVisibleCount(0);
        setStarted(false);
        setTimeout(() => setStarted(true), 300);
      }, 10000);
      return () => clearTimeout(restart);
    }
  }, [visibleCount, started]);

  // Trigger on scroll into view
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) startAnimation();
    }, { threshold: 0.3 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [started, startAnimation]);

  // Re-trigger when started flips back to true after restart
  useEffect(() => {
    if (started && visibleCount === 0) startAnimation();
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-xs mx-auto select-none ${className}`}
    >
      {/* Phone frame */}
      <div className="bg-[#111B21] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1F2C34]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-extrabold text-sm">N</div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-none">Nilah IA 🤖</p>
            <p className="text-[#8696A0] text-[11px] mt-0.5">Salón Bella</p>
          </div>
          <span className="text-xs text-[#25D366] font-bold">● en línea</span>
        </div>

        {/* Chat area */}
        <div
          className="p-3 space-y-2 h-[320px] overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03' fill='%23fff'%3E%3Cpolygon points='25,0 30,20 50,20 35,30 40,50 25,38 10,50 15,30 0,20 20,20' /%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0B141A',
          }}
        >
          {RETOQUE_CONVO.slice(0, visibleCount).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === 'nilah' ? 'justify-start' : 'justify-end'} animate-fade-in-up`}
              style={{ animationDuration: '0.35s', animationFillMode: 'both' }}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-[13px] leading-snug max-w-[85%] shadow-md whitespace-pre-wrap ${
                  msg.from === 'nilah'
                    ? 'bg-[#1F2C34] text-[#E9EDEF] rounded-tl-none'
                    : 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="bg-[#1F2C34] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Play button when paused */}
      {!started && visibleCount === 0 && (
        <button
          onClick={startAnimation}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-sm"
        >
          <span className="bg-white/90 rounded-full px-4 py-2 text-sm font-bold text-gray-900 shadow-lg">▶ Ver en acción</span>
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 10. ROI SLOT MACHINE — Money counter animation on scroll
//     Used in: "El Problema" loss calculation impact box
// ═══════════════════════════════════════════════════════════
export const ROISlotMachine: React.FC<{
  targetAmount: number;
  prefix?: string;
  suffix?: string;
  label?: string;
  className?: string;
  color?: 'red' | 'green';
}> = ({ targetAmount, prefix = '$', suffix = ' USD', label = '', className = '', color = 'green' }) => {
  const [current, setCurrent] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !triggered) setTriggered(true);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [triggered]);

  useEffect(() => {
    if (!triggered) return;
    let frame = 0;
    const total = 60;
    const tick = () => {
      frame++;
      const progress = frame / total;
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setCurrent(Math.round(eased * targetAmount));
      if (frame < total) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [triggered, targetAmount]);

  const colorClass = color === 'green'
    ? 'text-emerald-500 dark:text-emerald-400'
    : 'text-rose-500 dark:text-rose-400';

  return (
    <div ref={ref} className={`flex flex-col items-center ${className}`}>
      <span className={`text-4xl md:text-5xl font-black tabular-nums ${colorClass}`}>
        {color === 'red' ? '-' : '+'}{prefix}{current.toLocaleString()}{suffix}
      </span>
      {label && <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// NEW. FESTIVA WHATSAPP CONVO MOCKUP (Holy Week / Holidays)
// ═══════════════════════════════════════════════════════════
const FESTIVA_CONVO: ConvoMessage[] = [
  { from: 'nilah', text: 'Todo el mundo viajando, publicando fotos y luciendo impecable en Semana Santa... 👀\n\nSofía, no voy a dejar que seas la única que no brille este finde largo — me quedan dos espacios y uno puede ser tuyo. 💅\n\n¿Lo tomamos antes de que vuelen? 😏🌸', delay: 1000 },
  { from: 'client', text: '¡Uy sí, tienes razón! Guárdame uno para el miércoles por la mañana.', delay: 7000 },
];

export const NilahWhatsAppFestiva: React.FC<{ className?: string; autoPlay?: boolean }> = ({
  className = '',
  autoPlay = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(autoPlay);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startAnimation = useCallback(() => {
    if (visibleCount > 0) return; // already started
    setStarted(true);
    setVisibleCount(0);
    setTyping(false);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    FESTIVA_CONVO.forEach((msg, i) => {
      // Show typing indicator just before each nilah message
      if (msg.from === 'nilah') {
        const t1 = setTimeout(() => setTyping(true), msg.delay - 800);
        const t2 = setTimeout(() => {
          setTyping(false);
          setVisibleCount(i + 1);
        }, msg.delay);
        timeoutsRef.current.push(t1, t2);
      } else {
        const t = setTimeout(() => setVisibleCount(i + 1), msg.delay);
        timeoutsRef.current.push(t);
      }
    });
  }, [visibleCount]);

  // Auto-restart when cycling is complete
  useEffect(() => {
    if (!started) return;
    if (visibleCount === FESTIVA_CONVO.length) {
      const restart = setTimeout(() => {
        setVisibleCount(0);
        setStarted(false);
        setTimeout(() => setStarted(true), 300);
      }, 10000);
      return () => clearTimeout(restart);
    }
  }, [visibleCount, started]);

  // Trigger on scroll into view
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) startAnimation();
    }, { threshold: 0.3 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [started, startAnimation]);

  // Re-trigger when started flips back to true after restart
  useEffect(() => {
    if (started && visibleCount === 0) startAnimation();
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-xs mx-auto select-none ${className}`}
    >
      {/* Phone frame */}
      <div className="bg-[#111B21] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1F2C34]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-extrabold text-sm">N</div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-none">Nilah IA 🤖</p>
            <p className="text-[#8696A0] text-[11px] mt-0.5">Salón Bella</p>
          </div>
          <span className="text-xs text-[#25D366] font-bold">● en línea</span>
        </div>

        {/* Chat area */}
        <div
          className="p-3 space-y-2 h-[320px] overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03' fill='%23fff'%3E%3Cpolygon points='25,0 30,20 50,20 35,30 40,50 25,38 10,50 15,30 0,20 20,20' /%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0B141A',
          }}
        >
          {FESTIVA_CONVO.slice(0, visibleCount).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === 'nilah' ? 'justify-start' : 'justify-end'} animate-fade-in-up`}
              style={{ animationDuration: '0.35s', animationFillMode: 'both' }}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-[13px] leading-snug max-w-[85%] shadow-md whitespace-pre-wrap ${
                  msg.from === 'nilah'
                    ? 'bg-[#1F2C34] text-[#E9EDEF] rounded-tl-none'
                    : 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="bg-[#1F2C34] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Play button when paused */}
      {!started && visibleCount === 0 && (
        <button
          onClick={startAnimation}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-sm"
        >
          <span className="bg-white/90 rounded-full px-4 py-2 text-sm font-bold text-gray-900 shadow-lg">▶ Ver en acción</span>
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// NEW. ACTIVO DORMIDO WHATSAPP CONVO MOCKUP (Root Landing)
// ═══════════════════════════════════════════════════════════
const ACTIVO_DORMIDO_CONVO: ConvoMessage[] = [
  { from: 'nilah', text: 'Un mes sin verte y yo aquí preguntándome si hice algo mal... 😏\n\nSofía, spoiler: no hice nada mal — pero igual tengo un espacio guardado por si quieres reconciliarte esta semana. 😌💅\n\n¿Coordinamos? 👀✨\n\n---\n*Audiencia:* Clientas que no vienen hace 30 días', delay: 1000 },
  { from: 'client', text: 'Jajajaja noooo para nada me había olvidado! Qué linda por acordarte. Guárdame una cita para el miércoles plisss 💖', delay: 7000 },
];

export const NilahWhatsAppActivoDormido: React.FC<{ className?: string; autoPlay?: boolean }> = ({
  className = '',
  autoPlay = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const [started, setStarted] = useState(autoPlay);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const startAnimation = useCallback(() => {
    if (visibleCount > 0) return; // already started
    setStarted(true);
    setVisibleCount(0);
    setTyping(false);
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    ACTIVO_DORMIDO_CONVO.forEach((msg, i) => {
      // Show typing indicator just before each nilah message
      if (msg.from === 'nilah') {
        const t1 = setTimeout(() => setTyping(true), msg.delay - 800);
        const t2 = setTimeout(() => {
          setTyping(false);
          setVisibleCount(i + 1);
        }, msg.delay);
        timeoutsRef.current.push(t1, t2);
      } else {
        const t = setTimeout(() => setVisibleCount(i + 1), msg.delay);
        timeoutsRef.current.push(t);
      }
    });
  }, [visibleCount]);

  // Auto-restart when cycling is complete
  useEffect(() => {
    if (!started) return;
    if (visibleCount === ACTIVO_DORMIDO_CONVO.length) {
      const restart = setTimeout(() => {
        setVisibleCount(0);
        setStarted(false);
        setTimeout(() => setStarted(true), 300);
      }, 10000);
      return () => clearTimeout(restart);
    }
  }, [visibleCount, started]);

  // Trigger on scroll into view
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started) startAnimation();
    }, { threshold: 0.3 });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [started, startAnimation]);

  // Re-trigger when started flips back to true after restart
  useEffect(() => {
    if (started && visibleCount === 0) startAnimation();
  }, [started]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-xs mx-auto select-none ${className}`}
    >
      {/* Phone frame */}
      <div className="bg-[#111B21] rounded-3xl overflow-hidden shadow-2xl border border-white/[0.06]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#1F2C34]">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-extrabold text-sm">N</div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm leading-none">Nilah IA 🤖</p>
            <p className="text-[#8696A0] text-[11px] mt-0.5">Salón Bella</p>
          </div>
          <span className="text-xs text-[#25D366] font-bold">● en línea</span>
        </div>

        {/* Chat area */}
        <div
          className="p-3 space-y-2 min-h-[350px] max-h-[460px] overflow-hidden"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03' fill='%23fff'%3E%3Cpolygon points='25,0 30,20 50,20 35,30 40,50 25,38 10,50 15,30 0,20 20,20' /%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: '#0B141A',
          }}
        >
          {ACTIVO_DORMIDO_CONVO.slice(0, visibleCount).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.from === 'nilah' ? 'justify-start' : 'justify-end'} animate-fade-in-up`}
              style={{ animationDuration: '0.35s', animationFillMode: 'both' }}
            >
              <div
                className={`px-3 py-2 rounded-2xl text-[13px] leading-snug max-w-[85%] shadow-md whitespace-pre-wrap ${
                  msg.from === 'nilah'
                    ? 'bg-[#1F2C34] text-[#E9EDEF] rounded-tl-none'
                    : 'bg-[#005C4B] text-[#E9EDEF] rounded-tr-none'
                }`}
              >
                {/* Process text to make audience bold */}
                {msg.text.includes('---') ? (
                  <>
                    {msg.text.split('---')[0].trim()}
                    <div className="mt-2 text-[10px] text-[#8696A0] border-t border-white/10 pt-1">
                      {msg.text.split('---')[1].trim()}
                    </div>
                  </>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <div className="flex justify-start animate-fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="bg-[#1F2C34] px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Play button when paused */}
      {!started && visibleCount === 0 && (
        <button
          onClick={startAnimation}
          className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl backdrop-blur-sm"
        >
          <span className="bg-white/90 rounded-full px-4 py-2 text-sm font-bold text-gray-900 shadow-lg">▶ Ver en acción</span>
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 12. AGENDA FILL ANIMATION — Calendar slots filling up
//     Used in: Nilah Copilot section
// ═══════════════════════════════════════════════════════════
const agendaSlots = [
  { time: '9:00', name: 'Balayage', filled: true, filledFrom: 'existing', color: 'bg-violet-500' },
  { time: '10:30', name: '— hueco —', filled: false, color: '' },
  { time: '12:00', name: 'Manicure VIP', filled: true, filledFrom: 'existing', color: 'bg-violet-500' },
  { time: '13:30', name: '— hueco —', filled: false, color: '' },
  { time: '15:00', name: 'Tintura Raíz', filled: true, filledFrom: 'existing', color: 'bg-violet-500' },
  { time: '16:30', name: '— hueco —', filled: false, color: '' },
];

export const AgendaFillAnimation: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [phase, setPhase] = useState<'idle' | 'command' | 'filling' | 'done'>('idle');
  const [filledSlots, setFilledSlots] = useState<number[]>([]);
  const [cmdText, setCmdText] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const fullCmd = '> Nilah, llena los huecos de hoy';

  const runAnimation = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
    setPhase('command');
    setFilledSlots([]);
    setCmdText('');

    // Type command
    let charIdx = 0;
    const typeInterval = setInterval(() => {
      charIdx++;
      setCmdText(fullCmd.slice(0, charIdx));
      if (charIdx >= fullCmd.length) {
        clearInterval(typeInterval);
        const t1 = setTimeout(() => {
          setPhase('filling');
          const emptySlots = agendaSlots.map((s, i) => (!s.filled ? i : -1)).filter(i => i >= 0);
          emptySlots.forEach((slotIdx, order) => {
            const t = setTimeout(() => {
              setFilledSlots(prev => [...prev, slotIdx]);
              if (order === emptySlots.length - 1) {
                const t2 = setTimeout(() => setPhase('done'), 600);
                timeoutsRef.current.push(t2);
              }
            }, order * 700);
            timeoutsRef.current.push(t);
          });
        }, 400);
        timeoutsRef.current.push(t1);
      }
    }, 42);

    // Restart loop
    const restart = setTimeout(() => {
      setPhase('idle');
      setFilledSlots([]);
      setCmdText('');
      const t = setTimeout(runAnimation, 300);
      timeoutsRef.current.push(t);
    }, 15000);
    timeoutsRef.current.push(restart);
    return () => clearInterval(typeInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && phase === 'idle') runAnimation();
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [phase, runAnimation]);

  const getSlotStyle = (slot: typeof agendaSlots[0], idx: number) => {
    const isBeingFilled = filledSlots.includes(idx);
    if (slot.filled) {
      return 'bg-violet-500/20 border-violet-500/40 text-violet-300';
    }
    if (isBeingFilled) {
      return 'bg-emerald-500/30 border-emerald-400 text-emerald-300 scale-105 shadow-lg shadow-emerald-500/20';
    }
    return 'bg-white/5 border-white/10 text-gray-500';
  };

  return (
    <div ref={ref} className={`w-full max-w-xs mx-auto min-h-[380px] flex flex-col justify-end ${className}`}>
      {/* Command prompt */}
      <div className="bg-gray-950 rounded-xl px-4 py-3 mb-3 border border-white/10 font-mono text-sm text-violet-400 min-h-[48px] overflow-hidden whitespace-nowrap text-ellipsis">
        {cmdText}
        {phase === 'command' && <span className="animate-pulse">|</span>}
        {(phase === 'filling' || phase === 'done') && (
          <span className="text-emerald-400 ml-1">✓</span>
        )}
      </div>

      {/* Agenda grid */}
      <div className="bg-gray-900 rounded-2xl p-3 border border-white/10 space-y-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 mb-3">📅 Hoy — Agenda</p>
        {agendaSlots.map((slot, i) => {
          const isFilled = filledSlots.includes(i);
          return (
            <div
              key={i}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-500 ${getSlotStyle(slot, i)}`}
            >
              <span className="text-xs text-gray-400 w-10 shrink-0 font-mono">{slot.time}</span>
              <span className={`text-sm font-medium flex-1 transition-all duration-300 ${isFilled ? 'text-emerald-300 font-bold' : ''}`}>
                {isFilled ? slot.time === '10:30' ? 'Mechas Full 🎉' : slot.time === '13:30' ? 'Uñas Gel 💅' : 'Corte + Brushing ✨' : slot.name}
              </span>
              {isFilled && <span className="text-emerald-400 text-xs animate-fade-in-up">+cita</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 12. DORMANT GRID AWAKENING — Dots that "wake up" on scroll
//     Used in: "El Problema" hero intro / Problem section
// ═══════════════════════════════════════════════════════════
export const DormantGridAwakening: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [waveRadius, setWaveRadius] = useState(0);
  const [awoken, setAwoken] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  // Reducimos las columnas/filas para que los iconos se vean bien
  const COLS = 10;
  const ROWS = 4;
  const CX = COLS / 2;
  const CY = ROWS / 2;

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setWaveRadius(0);
        setAwoken(new Set());
        let start: number | null = null;
        const duration = 5000; // Más lento para el storytelling
        const maxR = Math.sqrt(CX * CX + CY * CY) + 1;
        const step = (ts: number) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / duration, 1);
          const r = progress * maxR;
          setWaveRadius(r);
          const next = new Set<number>();
          for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
              const dist = Math.sqrt((col - CX) ** 2 + (row - CY) ** 2);
              if (dist <= r) next.add(row * COLS + col);
            }
          }
          setAwoken(next);
          if (progress < 1) {
            animRef.current = requestAnimationFrame(step);
          } else {
            // Loop animation after a delay so it doesn't freeze
            setTimeout(() => {
              if (ref.current) {
                start = null;
                setWaveRadius(0);
                setAwoken(new Set());
                animRef.current = requestAnimationFrame(step);
              }
            }, 3000);
          }
        };
        animRef.current = requestAnimationFrame(step);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => { obs.disconnect(); cancelAnimationFrame(animRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={ref} className={`w-full flex justify-center py-4 ${className}`} aria-hidden>
      <div
        className="grid gap-3 sm:gap-4 lg:gap-5"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: ROWS * COLS }).map((_, idx) => {
          const row = Math.floor(idx / COLS);
          const col = idx % COLS;
          const dist = Math.sqrt((col - CX) ** 2 + (row - CY) ** 2);
          const isAwake = awoken.has(idx);
          
          // Determinamos el icono y color al azar de forma determinista para cada celda
          const isDollar = (row * col + idx) % 3 === 0;
          const Icon = isAwake ? (isDollar ? DollarSign : MessageCircle) : User;
          const activeColor = isDollar ? 'text-emerald-500 dark:text-emerald-400' : 'text-violet-500 dark:text-violet-400';
          const shadowColor = isDollar ? 'shadow-emerald-500/30' : 'shadow-violet-500/30';

          return (
            <div
              key={idx}
              className={`flex items-center justify-center p-2 rounded-xl transition-all ${
                isAwake ? 'bg-white dark:bg-[#1A1A24] scale-110 shadow-lg ' + shadowColor : 'bg-transparent scale-100'
              }`}
              style={{
                transitionDuration: '500ms',
                transitionDelay: `${(dist * 120).toFixed(0)}ms`,
              }}
            >
               <Icon 
                 size={20} 
                 className={`transition-colors duration-500 ${isAwake ? activeColor : 'text-gray-300 dark:text-gray-700'}`} 
                 strokeWidth={isAwake ? 2.5 : 1.5}
               />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 13. MAGNETIC CARD — 3D cursor-tracking glow card
//     Used in: any card container where you want tactile feel
// ═══════════════════════════════════════════════════════════
export const MagneticCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className = '', glowColor = 'rgba(139, 92, 246, 0.25)' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const tiltX = (y - 0.5) * -12;
    const tiltY = (x - 0.5) * 12;
    setStyle({ transform: `perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1.02)` });
    setGlowPos({ x: x * 100, y: y * 100 });
  }, []);

  const handleLeave = useCallback(() => {
    setStyle({ transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)', transition: 'transform 0.5s ease' });
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden cursor-crosshair ${className}`}
      style={{ ...style, transition: style.transition ?? 'transform 0.1s ease' }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {/* Cursor glow */}
      <div
        className="pointer-events-none absolute w-48 h-48 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          left: `${glowPos.x}%`,
          top: `${glowPos.y}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: 0,
        }}
        aria-hidden
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 14. GRADIENT TEXT — Fluid animated gradient on headlines
//     Used in: Hero and section titles for premium feel
// ═══════════════════════════════════════════════════════════
export const GradientText: React.FC<{
  children: React.ReactNode;
  className?: string;
  colors?: string;
  animated?: boolean;
}> = ({
  children,
  className = '',
  colors = 'from-violet-500 via-fuchsia-500 to-pink-500',
  animated = true,
}) => (
  <span
    className={`text-transparent bg-clip-text bg-gradient-to-r ${colors} ${animated ? 'animate-gradient-text' : ''} ${className}`}
    style={animated ? { backgroundSize: '200% 200%' } : {}}
  >
    {children}
  </span>
);

// ═══════════════════════════════════════════════════════════
// NEW. NILAH INBOX MOCKUP — 3 Column full UI mockup for Landing
// ═══════════════════════════════════════════════════════════
export const NilahInboxMockup: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative w-full max-w-5xl mx-auto select-none rounded-[2rem] overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 ${className}`}>
      {/* Container simulating a browser/app frame */}
      <div className="flex h-[500px] md:h-[600px] bg-white dark:bg-[#111] overflow-hidden">
        
        {/* COLUMN 1: Chat List (Hidden on very small screens, 25% on md) */}
        <div className="hidden md:flex flex-col w-[280px] lg:w-[320px] bg-gray-50 dark:bg-[#0B0B0B] border-r border-gray-200 dark:border-white/5 shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-white/5">
            <h3 className="font-bold text-gray-900 dark:text-white">Bandeja de Entrada</h3>
            <div className="mt-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
              <div className="w-full h-9 bg-white dark:bg-[#1A1A1A] rounded-lg border border-gray-200 dark:border-white/10" />
            </div>
          </div>
          <div className="flex-1 overflow-hidden p-2 space-y-1">
            {/* Active Chat */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-violet-100 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-500/30">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg">A</div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Andrea López</p>
                  <p className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">Ahora</p>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 truncate">Sí, me encantaría agendar...</p>
              </div>
            </div>
            
            {/* Inactive Chat 1 */}
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 opacity-70">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg">M</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">María Fernanda</p>
                  <p className="text-[10px] text-gray-500">10:42 AM</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px]">🤖</span>
                  <p className="text-xs text-gray-500 truncate">Te esperamos mañana a las...</p>
                </div>
              </div>
            </div>

            {/* Inactive Chat 2 */}
            <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 opacity-70">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">C</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Carla Gómez</p>
                  <p className="text-[10px] text-gray-500">Ayer</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-blue-500 line-through decoration-2">✓✓</span>
                  <p className="text-xs text-gray-500 truncate">¡Gracias por la atención!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 2: WhatsApp Conversation (Center) */}
        <div className="flex-1 flex flex-col bg-[#EFEAE2] dark:bg-[#0B141A] relative" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg opacity='0.03' fill='%23000'%3E%3Cpolygon points='25,0 30,20 50,20 35,30 40,50 25,38 10,50 15,30 0,20 20,20' /%3E%3C/g%3E%3C/svg%3E")` }}>
          {/* Header */}
          <div className="h-16 bg-white dark:bg-[#1F2C34] border-b border-gray-200 dark:border-white/5 px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-orange-400 flex items-center justify-center text-white font-bold text-lg">A</div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">Andrea López</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">En línea</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 animate-pulse">
                    <span>🔕</span> Bot Pausado
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500" />
              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500" />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col justify-end space-y-4">
            <div className="flex justify-center mb-4">
              <span className="bg-white/80 dark:bg-[#1A2226]/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-xs px-3 py-1 rounded-lg shadow-sm">Hoy</span>
            </div>
            
            {/* Bot Message */}
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#1F2C34] text-gray-800 dark:text-[#E9EDEF] p-3 rounded-2xl rounded-tl-sm max-w-[85%] md:max-w-[75%] shadow-sm text-sm">
                <span className="text-[10px] font-bold text-violet-500 mb-1 flex items-center gap-1">🤖 Nilah IA</span>
                ¡Hola Andrea! Vi que tu última visita fue para un Balayage hace 2 meses. ¿Te gustaría agendar un retoque esta semana? Tenemos espacios el Jueves y Viernes. ✨
                <span className="block text-right text-[10px] text-gray-400 mt-1">10:30 AM</span>
              </div>
            </div>

            {/* Client Message */}
            <div className="flex justify-end">
              <div className="bg-[#D9FDD3] dark:bg-[#005C4B] text-gray-800 dark:text-[#E9EDEF] p-3 rounded-2xl rounded-tr-sm max-w-[85%] md:max-w-[75%] shadow-sm text-sm">
                ¡Hola! Qué lindo que me escriban. Sí, me encantaría agendar el retoque para el Jueves en la tarde si es posible.
                <span className="block text-right text-[10px] text-[#55A081] dark:text-[#8696A0] mt-1">10:45 AM ✓✓</span>
              </div>
            </div>

            {/* System Status overlay indicator */}
            <div className="flex justify-center my-2">
              <div className="bg-amber-100/90 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm animate-fade-in-up">
                <span className="text-amber-600 dark:text-amber-400 text-sm">⚠️</span>
                <span className="text-amber-800 dark:text-amber-200 text-xs font-medium">Bot pausado por intervención humana</span>
              </div>
            </div>

            {/* Human Typing Indicator */}
            <div className="flex justify-end">
              <div className="bg-[#D9FDD3] dark:bg-[#005C4B] px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm flex gap-1">
                {[0, 1, 2].map(d => (
                  <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-600/50 dark:bg-emerald-400/50 animate-bounce" style={{ animationDelay: `${d * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
          
          {/* Input Area */}
          <div className="h-16 bg-[#F0F2F5] dark:bg-[#1F2C34] flex items-center gap-3 px-4 shrink-0">
            <span className="text-gray-400 text-xl hidden sm:block">😊</span>
            <span className="text-gray-400 text-xl hidden sm:block">📎</span>
            <div className="flex-1 bg-white dark:bg-[#2A3942] rounded-xl h-10 flex items-center px-4">
              <span className="text-gray-400 dark:text-gray-500 text-sm">Perfecto Andrea, el jueves a las 4...|</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <span className="rotate-45 ml-1">➤</span>
            </div>
          </div>
        </div>

        {/* COLUMN 3: Client Profile (Hidden on mobile, 30% on lg) */}
        <div className="hidden lg:flex flex-col w-[340px] bg-white dark:bg-[#141414] border-l border-gray-200 dark:border-white/5 shrink-0 overflow-y-auto">
          {/* Cover & Avatar */}
          <div className="relative h-24 bg-gradient-to-r from-violet-500 to-fuchsia-500 shrink-0">
            <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-white dark:border-[#141414] bg-gradient-to-br from-rose-400 to-orange-400 shadow-lg flex items-center justify-center text-white font-bold text-3xl">
              A
            </div>
          </div>
          
          <div className="pt-12 px-6 pb-6 w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase mb-1">Andrea López</h2>
            <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mb-4">+51 987 654 321</p>
            
            {/* VIP Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3 py-1.5 rounded-lg mb-6 shadow-sm">
              <span className="text-amber-500">👑</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Clienta VIP</span>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Visitas</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">12</p>
              </div>
              <div className="bg-violet-50 dark:bg-violet-500/10 p-3 rounded-xl border border-violet-100 dark:border-violet-500/20 text-center shadow-inner">
                <p className="text-[10px] text-violet-600 dark:text-violet-400 uppercase font-bold tracking-wider mb-1">LTV (Gastado)</p>
                <p className="text-lg font-bold text-violet-700 dark:text-violet-300">$640</p>
              </div>
            </div>

            {/* Internal Notes / Badges */}
            <div className="space-y-4">
               <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>📌</span> Notas Internas
                  </h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/30 p-3 rounded-xl text-xs text-yellow-800 dark:text-yellow-300 font-medium leading-relaxed">
                    Clienta muy detallista. Siempre ofrecerle café sin azúcar. Preferencia por tonos cenizos en balayage.
                  </div>
               </div>
               
               <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-2">
                    <span>⚠️</span> Alertas Médicas
                  </h4>
                  <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/30 p-3 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-bold flex items-center gap-2">
                    <span className="text-base animate-pulse">🚨</span> ALERGIA AL AMONIACO
                  </div>
               </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

