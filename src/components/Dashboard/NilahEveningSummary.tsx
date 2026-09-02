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
        : `${data.today.citasCompletadas} de ${data.today.citasTotales} citas completadas`;

    if (!isOpen || typeof document === 'undefined') return null;

    const SLIDE_TITLES = [
        '¡Cerramos el día, jefa! 🌙',
        'Los números de hoy',
        'Lo que dice Nilah 🤖',
        'Mañana te espera ☀️',
    ];

    const content = (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 sm:items-center sm:p-6 animate-fade-in">
            <div className="w-full max-w-xl overflow-hidden rounded-t-3xl border border-white/10 bg-[#0B0B12] text-white shadow-2xl sm:rounded-3xl animate-slide-up sm:animate-scale-in will-change-transform" style={{ transform: 'translateZ(0)' }}>
                {/* ─── Header ───────────────────────────── */}
                <div className="relative border-b border-white/10 bg-gradient-to-br from-violet-600/90 via-fuchsia-600/80 to-indigo-700/90 px-5 pb-5 pt-6">
                    {currentSlide === 0 && <Confetti />}

                    <button
                        onClick={handleFinish}
                        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 z-10"
                    >
                        <X size={16} />
                    </button>
                    
                    <p className="text-xs uppercase tracking-wide text-white/70">Cierre de Caja</p>
                    <h2 className="mt-1 text-2xl font-black">{displayName}, {SLIDE_TITLES[currentSlide]}</h2>
                    {currentSlide === 0 && (
                        <p className="mt-1 text-sm font-bold text-emerald-300 animate-count-up">{accomplishment}</p>
                    )}

                    {/* Progress dots */}
                    <div className="flex gap-1.5 mt-4 relative z-10">
                        {Array.from({ length: totalSlides }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'bg-white w-8' :
                                        i < currentSlide ? 'bg-white/50 w-4' :
                                            'bg-white/20 w-4'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* ─── Slide Content ─────────────────────── */}
                <div className="min-h-[360px] px-5 py-5 overflow-y-auto" style={{ maxHeight: '60vh' }}>

                    {/* SLIDE 0: Hero celebración */}
                    {currentSlide === 0 && (
                        <div className="animate-from-right space-y-4">
                            {/* Big number */}
                            <div className="p-6 rounded-2xl text-center border border-white/10 bg-white/5 shadow-inner">
                                <p className="text-white/60 text-sm mb-1">Total generado hoy</p>
                                <p className="text-6xl font-black text-white animate-starburst">
                                    {formatMoney(data.today.ingresos)}
                                </p>
                                <div className={`mx-auto inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-sm font-bold ${data.vsYesterday.ingresosDelta >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                    {data.vsYesterday.ingresosDelta >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    {data.vsYesterday.ingresosDelta >= 0 ? '+' : ''}{formatMoney(Math.abs(data.vsYesterday.ingresosDelta))} vs ayer
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <div className="p-5 rounded-2xl text-center border border-white/10 bg-white/5">
                                    <p className="text-4xl font-black text-violet-300">{data.today.citasCompletadas}</p>
                                    <p className="text-white/50 text-xs mt-1">citas completadas</p>
                                </div>
                                <div className="p-5 rounded-2xl text-center border border-white/10 bg-white/5">
                                    <p className="text-4xl font-black text-pink-300">{formatMoney(data.today.ticketPromedio)}</p>
                                    <p className="text-white/50 text-xs mt-1">ticket promedio</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SLIDE 1: Stats detallado */}
                    {currentSlide === 1 && (
                        <div className="animate-from-right space-y-3">
                            <h3 className="text-lg font-bold">Métricas el día</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <StatCard
                                    icon={<Calendar size={18} className="text-violet-400" />}
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
                                    icon={<DollarSign size={18} className="text-emerald-400" />}
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
                                        icon={<Star size={18} className="text-amber-400" />}
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
                                        icon={<AlertTriangle size={18} className="text-rose-400" />}
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
                            <h3 className="text-lg font-bold">Observaciones de Nilah</h3>
                            <div className="p-5 rounded-2xl border border-violet-500/30 bg-violet-500/10">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <span className="text-lg">🤖</span>
                                    </div>
                                    <p className="text-white/90 text-sm leading-relaxed italic mt-1">
                                        "{data.insight.mensaje?.replace(/S\//g, formatMoney(0).replace(/[0.,\s]/g, ''))}"
                                    </p>
                                </div>
                                {data.insight.impactoEstimado && (
                                    <div className="p-4 rounded-xl border border-white/10 bg-white/5 mt-4">
                                        <p className="text-white/60 text-xs mb-1 uppercase tracking-wider">Impacto estimado mensual</p>
                                        <p className="text-emerald-400 font-black text-2xl">{data.insight.impactoEstimado?.replace(/S\//g, formatMoney(0).replace(/[0.,\s]/g, ''))}</p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => handleAction(data.insight.actionPath)}
                                className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 bg-gradient-to-r from-violet-500 to-pink-500 shadow-md"
                            >
                                <Zap size={18} className="fill-current" />
                                {data.insight.accion}
                            </button>
                        </div>
                    )}

                    {/* SLIDE 3: Mañana */}
                    {currentSlide === 3 && (
                        <div className="animate-from-right space-y-4">
                            <h3 className="text-lg font-bold">Tu agenda de mañana</h3>
                            {data.manana && data.manana.citas.length > 0 ? (
                                <div className="space-y-3">
                                    {data.manana.citas.map((cita, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/5"
                                        >
                                            <div className="w-16 text-center border-r border-white/10 pr-2">
                                                <p className="text-violet-400 font-black text-sm">{cita.hora}</p>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-bold text-base truncate">{cita.clienta}</p>
                                                <p className="text-white/60 text-sm truncate">{cita.servicio}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-sm text-center text-white/50 mt-4 pt-4">Hay más citas agendadas, revisa tu agenda completa para los detalles.</p>
                                </div>
                            ) : (
                                <div className="p-6 text-center border border-white/10 bg-white/5 rounded-2xl">
                                    <Calendar className="mx-auto h-8 w-8 text-white/30 mb-2" />
                                    <p className="text-white/70">No tienes citas agendadas para mañana todavía.</p>
                                    <button onClick={() => handleAction('/nilah/app/agenda')} className="mt-4 px-4 py-2 border border-white/20 rounded-lg text-sm text-white hover:bg-white/10">Ver agenda completa</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ─── Footer ───────────────────────────── */}
                <div className="flex items-center justify-between border-t border-white/10 px-5 py-4">
                    <button
                        onClick={handlePrev}
                        disabled={currentSlide === 0}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    >
                        <ChevronLeft size={14} /> Anterior
                    </button>
                    {currentSlide < totalSlides - 1 ? (
                        <button
                            onClick={handleNext}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        >
                            Siguiente <ChevronRight size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black"
                        >
                            Cerrar y descansar 🌙
                        </button>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(content, document.body);
};

export default NilahEveningSummary;
