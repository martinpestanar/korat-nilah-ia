
import React, { useEffect, useRef, useState } from 'react';

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
