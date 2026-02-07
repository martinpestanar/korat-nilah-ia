/**
 * DailyBriefingModal Component
 * Modal de bienvenida inteligente con resumen diario de Nilah IA
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Sparkles,
    Calendar,
    DollarSign,
    Users,
    Star,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Zap,
    Send,
    Clock,
    Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DailyBriefingData {
    userName: string;
    // Resumen de ayer
    yesterday: {
        date: string;
        citasCompletadas: number;
        ingresos: number;
        calificacionPromedio: number;
        clientasNuevas: number;
        noShows: number;
    };
    // Resumen de la semana
    week: {
        dateRange: string;
        ingresoTotal: number;
        cambioVsSemanaAnterior: number;
        totalCitas: number;
        citasCompletadas: number;
        mejorDia: string;
        mejorDiaIngresos: number;
        servicioTop: string;
    };
    // Recomendación de IA
    recommendation: {
        tipo: 'marketing' | 'rescate' | 'general';
        mensaje: string;
        sugerencia: string;
        accion: string;
        actionPath?: string;
    };
    // Alertas (opcional)
    alerts?: {
        clienteVIP?: { nombre: string; diasSinVisita: number };
        recordatoriosPendientes?: number;
        zonaMuerta?: { dia: string; ocupacion: number };
    };
}

// Datos mock para demostración
const MOCK_DATA: DailyBriefingData = {
    userName: 'María',
    yesterday: {
        date: 'Miércoles 8 Enero',
        citasCompletadas: 8,
        ingresos: 1240,
        calificacionPromedio: 4.8,
        clientasNuevas: 2,
        noShows: 1
    },
    week: {
        dateRange: '1 - 7 Enero',
        ingresoTotal: 5820,
        cambioVsSemanaAnterior: 12,
        totalCitas: 42,
        citasCompletadas: 38,
        mejorDia: 'Sábado',
        mejorDiaIngresos: 1400,
        servicioTop: 'Uñas acrílicas'
    },
    recommendation: {
        tipo: 'marketing',
        mensaje: 'María, los martes tu agenda está solo 30% ocupada. Es buen momento para hacer una campaña de WhatsApp.',
        sugerencia: 'Martes de Relax: 20% OFF en masajes',
        accion: 'Crear esta campaña',
        actionPath: '/app/marketing'
    },
    alerts: {
        clienteVIP: { nombre: 'Laura García', diasSinVisita: 35 },
        recordatoriosPendientes: 3,
        zonaMuerta: { dia: 'Martes', ocupacion: 25 }
    }
};

interface DailyBriefingModalProps {
    isOpen: boolean;
    onClose: () => void;
    data?: DailyBriefingData;
}

const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({
    isOpen,
    onClose,
    data = MOCK_DATA
}) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const navigate = useNavigate();

    const totalSlides = data.alerts ? 4 : 3;

    // Determinar saludo según hora
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return '☀️ Buenos días';
        if (hour < 18) return '🌤️ Buenas tardes';
        return '🌙 Buenas noches';
    };

    const handleNext = () => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    };

    const handleAction = (path?: string) => {
        onClose();
        if (path) {
            navigate(path);
        }
    };

    const handleFinish = () => {
        // Guardar que ya vio el briefing hoy
        localStorage.setItem('lastBriefingDate', new Date().toDateString());
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header con gradiente */}
                <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 px-6 py-8 text-white overflow-hidden">
                    {/* Elementos decorativos */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />

                    {/* Botón cerrar */}
                    <button
                        onClick={handleFinish}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                        <X size={18} />
                    </button>

                    {/* Título */}
                    <div className="relative flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Sparkles size={24} className="text-yellow-300" />
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium">Nilah AI</p>
                            <h2 className="text-xl font-bold">{getGreeting()}, {data.userName}</h2>
                        </div>
                    </div>

                    {/* Indicadores de progreso */}
                    <div className="flex gap-2 mt-6">
                        {Array.from({ length: totalSlides }).map((_, i) => (
                            <div
                                key={i}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide
                                        ? 'bg-white w-8'
                                        : i < currentSlide
                                            ? 'bg-white/60 w-4'
                                            : 'bg-white/30 w-4'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Contenido de slides */}
                <div className="p-6 min-h-[320px]">

                    {/* SLIDE 1: Resumen de ayer */}
                    {currentSlide === 0 && (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar size={20} className="text-indigo-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Así te fue ayer
                                </h3>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    ({data.yesterday.date})
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Calendar size={16} className="text-emerald-600" />
                                        <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                            {data.yesterday.citasCompletadas}
                                        </span>
                                    </div>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Citas completadas</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <DollarSign size={16} className="text-blue-600" />
                                        <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                            S/{data.yesterday.ingresos.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-xs text-blue-600 dark:text-blue-500">Ingresos</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Star size={16} className="text-amber-600" />
                                        <span className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                                            {data.yesterday.calificacionPromedio}
                                        </span>
                                    </div>
                                    <p className="text-xs text-amber-600 dark:text-amber-500">Calificación promedio</p>
                                </div>

                                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Users size={16} className="text-purple-600" />
                                        <span className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                                            {data.yesterday.clientasNuevas}
                                        </span>
                                    </div>
                                    <p className="text-xs text-purple-600 dark:text-purple-500">Clientas nuevas</p>
                                </div>
                            </div>

                            {data.yesterday.noShows > 0 && (
                                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 flex items-center gap-3">
                                    <AlertTriangle size={16} className="text-rose-500" />
                                    <span className="text-sm text-rose-700 dark:text-rose-400">
                                        {data.yesterday.noShows} no-show(s) ayer
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* SLIDE 2: Resumen de la semana */}
                    {currentSlide === 1 && (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp size={20} className="text-indigo-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Tu semana en números
                                </h3>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    ({data.week.dateRange})
                                </span>
                            </div>

                            {/* Ingreso principal */}
                            <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white mb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-emerald-100 text-sm">Ingreso total</p>
                                        <p className="text-3xl font-bold">S/{data.week.ingresoTotal.toLocaleString()}</p>
                                    </div>
                                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${data.week.cambioVsSemanaAnterior >= 0
                                            ? 'bg-white/20'
                                            : 'bg-rose-500/30'
                                        }`}>
                                        {data.week.cambioVsSemanaAnterior >= 0 ? (
                                            <TrendingUp size={14} />
                                        ) : (
                                            <TrendingDown size={14} />
                                        )}
                                        <span className="text-sm font-bold">
                                            {data.week.cambioVsSemanaAnterior >= 0 ? '+' : ''}{data.week.cambioVsSemanaAnterior}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total citas</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {data.week.citasCompletadas}/{data.week.totalCitas}
                                    </p>
                                </div>

                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mejor día</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {data.week.mejorDia}
                                    </p>
                                    <p className="text-xs text-emerald-600">S/{data.week.mejorDiaIngresos.toLocaleString()}</p>
                                </div>

                                <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-100 dark:border-purple-800">
                                    <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">🏆 Servicio estrella</p>
                                    <p className="font-bold text-purple-700 dark:text-purple-300">
                                        {data.week.servicioTop}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SLIDE 3: Recomendación de IA */}
                    {currentSlide === 2 && (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={20} className="text-indigo-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Mi recomendación para hoy
                                </h3>
                            </div>

                            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 mb-4">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                                        <Sparkles size={18} className="text-white" />
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        "{data.recommendation.mensaje}"
                                    </p>
                                </div>

                                <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target size={16} className="text-indigo-600" />
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                                            Sugerencia
                                        </span>
                                    </div>
                                    <p className="font-bold text-gray-900 dark:text-white text-lg">
                                        {data.recommendation.sugerencia}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleAction(data.recommendation.actionPath)}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
                            >
                                <Zap size={18} />
                                {data.recommendation.accion}
                            </button>

                            <button
                                onClick={handleNext}
                                className="w-full mt-3 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors"
                            >
                                Ver otras opciones
                            </button>
                        </div>
                    )}

                    {/* SLIDE 4: Alertas (si hay) */}
                    {currentSlide === 3 && data.alerts && (
                        <div className="animate-in slide-in-from-right duration-300">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle size={20} className="text-amber-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Una cosa más...
                                </h3>
                            </div>

                            <div className="space-y-3">
                                {data.alerts.clienteVIP && (
                                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                                    <Users size={18} className="text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-white">
                                                        {data.alerts.clienteVIP.nombre}
                                                    </p>
                                                    <p className="text-sm text-amber-600 dark:text-amber-400">
                                                        {data.alerts.clienteVIP.diasSinVisita} días sin visita
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-2 py-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 text-xs font-bold">
                                                VIP
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => handleAction('/app/clients')}
                                            className="mt-3 w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                            <Send size={14} />
                                            Enviar mensaje de rescate
                                        </button>
                                    </div>
                                )}

                                {data.alerts.recordatoriosPendientes && data.alerts.recordatoriosPendientes > 0 && (
                                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                                <Clock size={18} className="text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {data.alerts.recordatoriosPendientes} recordatorios
                                                </p>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                                    Pendientes de enviar
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAction('/app/engagement')}
                                            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
                                        >
                                            Ver lista
                                        </button>
                                    </div>
                                )}

                                {data.alerts.zonaMuerta && (
                                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center">
                                                <TrendingDown size={18} className="text-rose-600" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {data.alerts.zonaMuerta.dia} vacío
                                                </p>
                                                <p className="text-sm text-rose-600 dark:text-rose-400">
                                                    Solo {data.alerts.zonaMuerta.ocupacion}% ocupado
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleAction('/app/marketing')}
                                            className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium"
                                        >
                                            Crear promo
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer con navegación */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={currentSlide === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${currentSlide === 0
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <ChevronLeft size={18} />
                        Anterior
                    </button>

                    {currentSlide < totalSlides - 1 ? (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                        >
                            Siguiente
                            <ChevronRight size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={handleFinish}
                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold transition-colors shadow-lg"
                        >
                            <Sparkles size={16} />
                            Comenzar mi día
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DailyBriefingModal;
