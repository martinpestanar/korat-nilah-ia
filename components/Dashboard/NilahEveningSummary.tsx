/**
 * NilahEveningSummary — Cierre de Caja Nocturno
 *
 * Modal de resumen del día, conducido por Nilah en modo celebratorio.
 * Se muestra la primera vez que la dueña abre la app a partir de las 3 PM.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    X, TrendingUp, TrendingDown, Star, Calendar,
    DollarSign, ChevronRight, ChevronLeft, Zap,
    Users, AlertTriangle, Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../../hooks/useCurrency';
import { useAuth } from '../../context/AuthContext';
import NilahAvatar from './NilahAvatar';

// ── Confetti component ───────────────────────────────────────────

const CONFETTI_COLORS = [
    '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444',
];
const CONFETTI_COUNT = 20;

const Confetti: React.FC = () => {
    const pieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        left: `${5 + (i / CONFETTI_COUNT) * 90}%`,
        delay: `${(i * 0.07).toFixed(2)}s`,
        size: 6 + (i % 5) * 2,
        shape: i % 3 === 0 ? '50%' : i % 3 === 1 ? '2px' : '0%',
    }));

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className="absolute animate-confetti-piece"
                    style={{
                        left: p.left,
                        top: '-10px',
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: p.shape,
                        animationDelay: p.delay,
                        animationDuration: `${1.2 + (p.id % 4) * 0.3}s`,
                    }}
                />
            ))}
        </div>
    );
};

// ── Animated Stat Card ───────────────────────────────────────────

const StatCard: React.FC<{
    icon: React.ReactNode;
    value: string | number;
    label: string;
    sub?: string;
    colorClass: string;
    bgClass: string;
    borderClass: string;
    delay?: number;
    trend?: 'up' | 'down' | 'neutral';
}> = ({ icon, value, label, sub, colorClass, bgClass, borderClass, delay = 0, trend }) => {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    return (
        <div className={`p-4 rounded-2xl ${bgClass} border ${borderClass} transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2 mb-2">{icon}</div>
            <div className="flex items-baseline gap-2">
                <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
                {trend && (
                    <span className={trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-gray-400'}>
                        {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
                    </span>
                )}
            </div>
            <p className={`text-xs ${colorClass} opacity-70 mt-0.5`}>{label}</p>
            {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
    );
};

// ── Types ────────────────────────────────────────────────────────

interface EveningData {
    userName: string;
    today: {
        citasCompletadas: number;
        citasTotales: number;
        ingresos: number;
        ticketPromedio: number;
        calificacion: number | null;
        noShows: number;
    };
    vsYesterday: {
        citasDelta: number;
        ingresosDelta: number;
    };
    insight: {
        mensaje: string;
        impactoEstimado?: string;
        accion: string;
        actionPath?: string;
    };
    manana?: {
        citas: { hora: string; servicio: string; clienta: string }[];
    };
    clienteRescatable?: { nombre: string; diasSinVisita: number };
}

const MOCK_EVENING: EveningData = {
    userName: 'María',
    today: {
        citasCompletadas: 9,
        citasTotales: 11,
        ingresos: 1380,
        ticketPromedio: 153,
        calificacion: 4.9,
        noShows: 2,
    },
    vsYesterday: {
        citasDelta: +1,
        ingresosDelta: +140,
    },
    insight: {
        mensaje: 'Tuviste 2 no-shows hoy. Si activas los recordatorios automáticos de Nilah, reduces esto en un 70% y recuperas en promedio S/240 extra al mes.',
        impactoEstimado: 'S/240/mes extra',
        accion: 'Activar recordatorios',
        actionPath: '/nilah/app/engagement',
    },
    manana: {
        citas: [
            { hora: '10:00 AM', servicio: 'Uñas acrílicas', clienta: 'Ana Torres' },
            { hora: '12:00 PM', servicio: 'Masaje facial', clienta: 'Lucía Ríos' },
            { hora: '03:00 PM', servicio: 'Pestañas', clienta: 'Karen López' },
        ],
    },
    clienteRescatable: { nombre: 'Gabriela Medina', diasSinVisita: 42 },
};

interface NilahEveningSummaryProps {
    isOpen: boolean;
    onClose: () => void;
    data?: EveningData;
}

// ── Main Component ───────────────────────────────────────────────

const NilahEveningSummary: React.FC<NilahEveningSummaryProps> = ({
    isOpen,
    onClose,
    data = MOCK_EVENING,
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();
    const { formatMoney } = useCurrency();
    const { user } = useAuth();

    const displayName = user?.name?.split(' ')[0] || data.userName;
    const totalSlides = 4;

    useEffect(() => {
        if (isOpen) setCurrentSlide(0);
    }, [isOpen]);

    const getMoodForSlide = useCallback(() => {
        if (currentSlide === 0) return 'celebrating' as const;
        if (currentSlide === 1) return 'idle' as const;
        return 'talking' as const;
    }, [currentSlide]);

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) setCurrentSlide(p => p + 1);
    };
    const handlePrev = () => {
        if (currentSlide > 0) setCurrentSlide(p => p - 1);
    };
    const handleAction = (path?: string) => {
        onClose();
        if (path) navigate(path);
    };
    const handleFinish = () => {
        localStorage.setItem('nilah_evening_date', new Date().toDateString());
        onClose();
    };

    const accomplishment = data.today.citasCompletadas >= data.today.citasTotales
        ? '¡Agenda 100% completada! 🎉'
        : `${data.today.citasCompletadas} de ${data.today.citasTotales} citas`;

    if (!isOpen || typeof document === 'undefined') return null;

    const SLIDE_TITLES = [
        '¡Cerramos el día, jefa! 🌙',
        'Los números de hoy',
        'Lo que dice Nilah 🤖',
        'Mañana te espera ☀️',
    ];

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
            <div
                className="relative w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in"
                style={{
                    maxHeight: '92vh',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    background: 'linear-gradient(160deg, #1E0A3C 0%, #0F0720 100%)',
                }}
            >
                {/* Stars background */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-white"
                            style={{
                                width: `${1 + (i % 3)}px`,
                                height: `${1 + (i % 3)}px`,
                                left: `${(i * 37) % 100}%`,
                                top: `${(i * 23) % 60}%`,
                                opacity: 0.2 + (i % 5) * 0.1,
                                animation: `pulse-dot ${2 + (i % 3)}s ease-in-out infinite`,
                                animationDelay: `${(i * 0.17) % 2}s`,
                            }}
                        />
                    ))}
                </div>

                {/* ─── Header ───────────────────────────── */}
                <div className="relative px-5 pt-6 pb-5 overflow-hidden">
                    {currentSlide === 0 && <Confetti />}

                    <button
                        onClick={handleFinish}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10"
                    >
                        <X size={16} className="text-white" />
                    </button>

                    <div className="relative flex items-center gap-4 z-10">
                        <NilahAvatar mood={getMoodForSlide()} size="md" />
                        <div className="flex-1 min-w-0">
                            <p className="text-white/50 text-xs font-semibold tracking-wide uppercase mb-0.5">Nilah IA · Cierre de Caja</p>
                            <h2 className="text-white font-black text-xl leading-tight">
                                {displayName},<br />
                                <span className="text-violet-300">{SLIDE_TITLES[currentSlide]}</span>
                            </h2>
                            {currentSlide === 0 && (
                                <p className="mt-1.5 text-emerald-400 font-bold text-sm animate-count-up">{accomplishment}</p>
                            )}
                        </div>
                    </div>

                    {/* Progress dots */}
                    <div className="flex gap-1.5 mt-4 relative z-10">
                        {Array.from({ length: totalSlides }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-violet-400 w-7' :
                                        i < currentSlide ? 'bg-violet-700 w-4' :
                                            'bg-white/15 w-4'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* ─── Slide Content ─────────────────────── */}
                <div
                    className="overflow-y-auto px-5 pb-2"
                    style={{ maxHeight: '48vh' }}
                >

                    {/* SLIDE 0: Hero celebración */}
                    {currentSlide === 0 && (
                        <div className="animate-from-right space-y-4">
                            {/* Big number */}
                            <div className="p-5 rounded-2xl text-center"
                                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(236,72,153,0.2) 100%)', border: '1px solid rgba(139,92,246,0.3)' }}>
                                <p className="text-white/60 text-sm mb-1">Total del día</p>
                                <p className="text-5xl font-black text-white animate-starburst">
                                    {formatMoney(data.today.ingresos)}
                                </p>
                                <div className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-sm font-bold ${data.vsYesterday.ingresosDelta >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {data.vsYesterday.ingresosDelta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                    {data.vsYesterday.ingresosDelta >= 0 ? '+' : ''}{formatMoney(Math.abs(data.vsYesterday.ingresosDelta))} vs ayer
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p className="text-3xl font-black text-violet-300">{data.today.citasCompletadas}</p>
                                    <p className="text-white/50 text-xs mt-1">citas completadas</p>
                                </div>
                                <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <p className="text-3xl font-black text-pink-300">{formatMoney(data.today.ticketPromedio)}</p>
                                    <p className="text-white/50 text-xs mt-1">ticket promedio</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SLIDE 1: Stats detallado */}
                    {currentSlide === 1 && (
                        <div className="animate-from-right space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard
                                    icon={<Calendar size={16} className="text-violet-400" />}
                                    value={`${data.today.citasCompletadas}/${data.today.citasTotales}`}
                                    label="Citas del día"
                                    sub={data.vsYesterday.citasDelta >= 0 ? `+${data.vsYesterday.citasDelta} vs ayer` : `${data.vsYesterday.citasDelta} vs ayer`}
                                    colorClass="text-violet-300"
                                    bgClass="bg-violet-500/10"
                                    borderClass="border-violet-500/20"
                                    delay={100}
                                    trend={data.vsYesterday.citasDelta > 0 ? 'up' : data.vsYesterday.citasDelta < 0 ? 'down' : 'neutral'}
                                />
                                <StatCard
                                    icon={<DollarSign size={16} className="text-emerald-400" />}
                                    value={formatMoney(data.today.ingresos)}
                                    label="Ingresos hoy"
                                    sub={`Ticket prom: ${formatMoney(data.today.ticketPromedio)}`}
                                    colorClass="text-emerald-300"
                                    bgClass="bg-emerald-500/10"
                                    borderClass="border-emerald-500/20"
                                    delay={200}
                                    trend={data.vsYesterday.ingresosDelta >= 0 ? 'up' : 'down'}
                                />
                                {data.today.calificacion && (
                                    <StatCard
                                        icon={<Star size={16} className="text-amber-400" />}
                                        value={`${data.today.calificacion} ⭐`}
                                        label="Calificación prom."
                                        colorClass="text-amber-300"
                                        bgClass="bg-amber-500/10"
                                        borderClass="border-amber-500/20"
                                        delay={300}
                                    />
                                )}
                                {data.today.noShows > 0 && (
                                    <StatCard
                                        icon={<AlertTriangle size={16} className="text-rose-400" />}
                                        value={data.today.noShows}
                                        label="No-shows"
                                        sub="Activar recordatorios reduce esto"
                                        colorClass="text-rose-300"
                                        bgClass="bg-rose-500/10"
                                        borderClass="border-rose-500/20"
                                        delay={400}
                                        trend="down"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* SLIDE 2: Insight IA */}
                    {currentSlide === 2 && (
                        <div className="animate-from-right space-y-4">
                            <div className="p-4 rounded-2xl" style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}>
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                                        <span className="text-base">🤖</span>
                                    </div>
                                    <p className="text-white/85 text-sm leading-relaxed italic">
                                        "{data.insight.mensaje?.replace(/S\//g, formatMoney(0).replace(/[0.,\s]/g, ''))}"
                                    </p>
                                </div>
                                {data.insight.impactoEstimado && (
                                    <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <p className="text-white/50 text-xs mb-0.5">Impacto estimado</p>
                                        <p className="text-emerald-400 font-black text-lg">{data.insight.impactoEstimado?.replace(/S\//g, formatMoney(0).replace(/[0.,\s]/g, ''))}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleAction(data.insight.actionPath)}
                                className="w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-lg"
                                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)', boxShadow: '0 8px 30px rgba(139,92,246,0.4)' }}
                            >
                                <Zap size={18} className="fill-current" />
                                {data.insight.accion}
                            </button>
                        </div>
                    )}

                    {/* SLIDE 3: Mañana */}
                    {currentSlide === 3 && (
                        <div className="animate-from-right space-y-4">
                            {data.manana && data.manana.citas.length > 0 && (
                                <div>
                                    <p className="text-white/50 text-xs font-bold uppercase tracking-wide mb-3">☀️ Mañana te esperan</p>
                                    <div className="space-y-2">
                                        {data.manana.citas.map((cita, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 p-3 rounded-xl animate-from-left"
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    animationDelay: `${i * 100}ms`
                                                }}
                                            >
                                                <div className="w-12 text-center">
                                                    <p className="text-violet-400 font-black text-xs">{cita.hora}</p>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white font-bold text-sm truncate">{cita.clienta}</p>
                                                    <p className="text-white/50 text-xs truncate">{cita.servicio}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {data.clienteRescatable && (
                                <div className="p-4 rounded-2xl" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                            style={{ background: 'rgba(245,158,11,0.2)' }}>👑</div>
                                        <div>
                                            <p className="text-white font-black">{data.clienteRescatable.nombre}</p>
                                            <p className="text-amber-400 text-sm">{data.clienteRescatable.diasSinVisita} días sin visitar — VIP</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAction('/nilah/app/clients')}
                                        className="w-full py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                        style={{ background: 'rgba(245,158,11,0.4)' }}
                                    >
                                        <Send size={14} /> Enviar mensaje de rescate para mañana
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Footer ───────────────────────────── */}
                <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePrev}
                            disabled={currentSlide === 0}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${currentSlide === 0
                                    ? 'text-white/20 cursor-not-allowed'
                                    : 'text-white/60 hover:bg-white/10 border border-white/10'
                                }`}
                        >
                            <ChevronLeft size={16} />
                            Atrás
                        </button>

                        {currentSlide < totalSlides - 1 ? (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
                            >
                                Siguiente
                                <ChevronRight size={16} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-white text-sm transition-all active:scale-95"
                                style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', boxShadow: '0 4px 20px rgba(139,92,246,0.35)' }}
                            >
                                🌙 Buenas noches
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default NilahEveningSummary;
