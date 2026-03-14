import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, Lock, Star, Crown, ChevronRight, Gem, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';

const GAMIFICATION_LEVELS = [
    { id: 1, name: 'Semilla', material: 'Papel', color: 'from-[#D4B595] to-[#B38B59]', border: 'border-[#D4B595]', type: 'easy', required: '0 días', metric: 'Activación de Cuenta' },
    { id: 2, name: 'Despertar', material: 'Acrílico', color: 'from-gray-100 to-gray-300', border: 'border-white', type: 'easy', required: '50 Perfiles', metric: 'Clientes Completos' },
    { id: 3, name: 'Chispa', material: 'Cobre', color: 'from-[#E18D66] to-[#C05D36]', border: 'border-[#E18D66]', type: 'easy', required: '1 Campaña', metric: 'ROI > 0%' },
    { id: 4, name: 'Impulso', material: 'Bronce', color: 'from-[#CD7F32] to-[#8C5A26]', border: 'border-[#CD7F32]', type: 'medium', required: 'Retención > 25%', metric: 'Base Activos > 300' },
    { id: 5, name: 'Tracción', material: 'Plata', color: 'from-gray-300 to-gray-500', border: 'border-gray-300', type: 'medium', required: 'Rebooking > 15%', metric: 'Baja Ciclo 3 días' },
    { id: 6, name: 'Estabilidad', material: 'Titanio', color: 'from-slate-600 to-slate-800', border: 'border-slate-500', type: 'hard', required: 'Densidad > 1.4', metric: 'Ticket +10%' },
    { id: 7, name: 'Autoridad Local', material: 'Oro', color: 'from-yellow-400 to-yellow-600', border: 'border-yellow-400', type: 'hard', required: 'Churn < 5%', metric: 'VIP Activos > 100' },
    { id: 8, name: 'Expansión', material: 'Zafiro', color: 'from-blue-500 to-blue-800', border: 'border-blue-400', type: 'elite', required: 'IA Ingresos > 15%', metric: 'Ciclo VIP Rápido' },
    { id: 9, name: 'Imperio', material: 'Obsidiana', color: 'from-gray-800 to-black', border: 'border-gray-700', type: 'elite', required: 'CAC < Rentabilidad', metric: 'LTV Creciente' },
    { id: 10, name: 'Legado', material: 'Diamante', color: 'from-cyan-200 via-white to-cyan-300', border: 'border-cyan-200', type: 'immortal', required: 'Crecimiento YOY', metric: 'Delegación 100%' }
];

const LegacyPage: React.FC = () => {
    const { user, isCopilot } = useAuth();
    const { data, isLoading } = useDashboardData();
    const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

    // Mocking current level for DEMO
    const currentLevel = 3;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 pb-10"
        >
            {/* === HEADER === */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-600 shadow-lg shadow-yellow-500/30"
                    >
                        <Trophy className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 }}
                            className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white"
                        >
                            Mi Legado
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm text-gray-500 dark:text-gray-400"
                        >
                            El Camino del Salón · Tu Evolución Empresarial
                        </motion.p>
                    </div>
                </div>

                {isCopilot && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 rounded-2xl border border-violet-500/30 bg-violet-500/5 px-4 py-3"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-500">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-violet-600 dark:text-violet-400">Nilah Mentor Activo</p>
                            <p className="text-[10px] text-gray-500">Analizando tus métricas para subir al Nivel 4</p>
                        </div>
                        <button className="ml-2 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:bg-violet-600 transition-colors">
                            Pedir Consejo
                        </button>
                    </motion.div>
                )}
            </div>

            {/* === CURRENT LEVEL BANNER === */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1C2D] to-black border border-gray-800 p-8 shadow-2xl"
            >
                {/* Background Details */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-[80px]" />
                
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-gray-300">
                        <Star className="h-4 w-4 text-orange-400" />
                        Nivel Actual
                    </div>
                    <h2 className="bg-gradient-to-br from-[#E18D66] to-[#C05D36] bg-clip-text text-5xl font-black text-transparent md:text-6xl">
                        {GAMIFICATION_LEVELS[currentLevel - 1].name}
                    </h2>
                    <p className="mt-4 max-w-lg text-sm text-gray-400">
                        "Encendiste la chispa del marketing automatizado. Tu salón empieza a pensar por sí mismo y tus clientes están reaccionando."
                    </p>
                    
                    <div className="mt-8 flex w-full max-w-md flex-col items-center">
                        <div className="mb-2 flex w-full justify-between text-xs font-bold text-gray-400">
                            <span>Progreso hacia Nivel 4: Impulso</span>
                            <span className="text-orange-400">65%</span>
                        </div>
                        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-800/50">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-orange-600 to-yellow-500" 
                            />
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* === THE PATH GARAGE / LEVELS === */}
            <div>
                <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">El Camino del Salón</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {GAMIFICATION_LEVELS.map((level, index) => {
                        const isUnlocked = level.id <= currentLevel;
                        const isCompleted = level.id < currentLevel;
                        const isNext = level.id === currentLevel + 1;
                        const isCurrent = level.id === currentLevel;

                        return (
                            <motion.div
                                key={level.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * index }}
                                onClick={() => setSelectedLevel(level.id === selectedLevel ? null : level.id)}
                                className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 ${
                                    isCurrent 
                                        ? `bg-gradient-to-br ${level.color} border-white shadow-xl shadow-orange-500/20 scale-105 z-10` 
                                        : isCompleted
                                            ? `bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/30 opacity-90`
                                            : isUnlocked
                                                ? `bg-gray-100 dark:bg-dark-card ${level.border} border-dashed opacity-80`
                                                : `bg-gray-50 dark:bg-dark-bg/50 border-gray-200 dark:border-gray-800 opacity-50 grayscale hover:grayscale-0`
                                }`}
                            >
                                <div className="flex flex-col items-center text-center">
                                    <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-full shadow-inner ${
                                        isCurrent ? 'bg-black/20 text-white' : isCompleted ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-white dark:bg-gray-800 text-gray-500'
                                    }`}>
                                        {isCompleted ? <CheckCircle className="h-6 w-6" /> : level.id >= 9 ? <Gem className="h-6 w-6" /> : isUnlocked ? <Crown className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                                    </div>
                                    <div className={`text-xs font-bold uppercase tracking-wider ${isCurrent ? 'text-white/80' : isCompleted ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-500'}`}>
                                        Nivel {level.id}
                                    </div>
                                    <div className={`mt-1 text-lg font-black ${
                                        isCurrent ? 'text-white' : 'text-gray-900 dark:text-white'
                                    }`}>
                                        {level.name}
                                    </div>
                                    
                                    <AnimatePresence>
                                        {(selectedLevel === level.id || isCurrent) && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="mt-4 w-full border-t border-white/10 pt-4"
                                            >
                                                <div className="space-y-2 text-left">
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className={isCurrent ? 'text-white/70' : 'text-gray-400'}>Meta:</span>
                                                        <span className={isCurrent ? 'text-white' : 'text-gray-800 dark:text-gray-200'}>{level.required}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[10px] font-bold">
                                                        <span className={isCurrent ? 'text-white/70' : 'text-gray-400'}>KPI:</span>
                                                        <span className={isCurrent ? 'text-white' : 'text-gray-800 dark:text-gray-200'}>{level.metric}</span>
                                                    </div>
                                                </div>
                                                {isNext && isCopilot && (
                                                    <button className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg bg-violet-500/10 py-2 text-[10px] font-bold text-violet-600 hover:bg-violet-500/20 dark:text-violet-400">
                                                        <Sparkles className="h-3 w-3" />
                                                        Consultar IA
                                                    </button>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default LegacyPage;
