import React from 'react';
import { Star, Users, Award, TrendingUp, Sparkles, UserCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { StaffRanking } from '../../context/DashboardDataContext';

interface StaffRankingWidgetProps {
    rankings: StaffRanking[];
}

const StaffRankingWidget: React.FC<StaffRankingWidgetProps> = ({ rankings }) => {
    // Si no hay calificaciones en absoluto
    if (!rankings || rankings.length === 0) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 mb-3">
                    <Users size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Rendimiento del Equipo</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Aún no hay calificaciones registradas para evaluar el desempeño.
                </p>
            </div>
        );
    }

    // Comprobar si todas las calificaciones son de 'Atención General' (salón sin staff asignado aún)
    const isOnlyGeneral = rankings.length === 1 && rankings[0].name === 'Atención General';
    const generalData = isOnlyGeneral ? rankings[0] : null;

    if (isOnlyGeneral && generalData) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border space-y-4"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                                Calidad de Atención Global
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Satisfacción general del salón
                            </p>
                        </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300">
                        Atención Integral
                    </span>
                </div>

                <div className="p-4 rounded-xl border border-purple-100/60 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/30 dark:bg-dark-bg/50 dark:border-dark-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg shadow-md">
                            ⭐
                        </div>
                        <div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white block">
                                Puntuación de Experiencia
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {generalData.total} {generalData.total === 1 ? 'reseña verificada' : 'reseñas verificadas'}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                            <span className="text-xl font-black text-gray-900 dark:text-white">
                                {generalData.promedio.toFixed(1)}
                            </span>
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-500" />
                        </div>
                        <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400 mt-1">
                            {generalData.promedio >= 4.5 ? 'Excelente Nivel' : 'Buen Servicio'}
                        </span>
                    </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg/40 border border-gray-100 dark:border-dark-border text-xs text-gray-500 dark:text-gray-400">
                    <UserCheck size={16} className="text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                    <span>
                        <b>Modo adaptable:</b> Cuando agregues o vincules a tu equipo de profesionales a las citas, este módulo mostrará automáticamente el ranking individual de desempeño de cada colaboradora.
                    </span>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-white p-5 sm:p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border"
        >
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                            Staff Destacado
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Por calificación de clientes
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                    {rankings.length} {rankings.length === 1 ? 'perfil' : 'perfiles'}
                </span>
            </div>

            <div className="space-y-3">
                {rankings.map((staff, index) => {
                    const isGeneral = staff.name === 'Atención General';
                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-dark-bg/50 dark:border-dark-border group"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="relative shrink-0">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold shadow-sm transition-shadow ${
                                        isGeneral 
                                            ? 'bg-gradient-to-br from-slate-500 to-gray-600 text-white' 
                                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
                                    }`}>
                                        {isGeneral ? '🏢' : staff.name.charAt(0).toUpperCase()}
                                    </div>
                                    {!isGeneral && index === 0 && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            transition={{ delay: 0.8, type: "spring" }}
                                            className="absolute -top-1 -right-1 rounded-full bg-yellow-400 p-0.5 border-2 border-white dark:border-dark-bg"
                                        >
                                            <Award size={10} className="text-white" />
                                        </motion.div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                        {staff.name}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {staff.total} {staff.total === 1 ? 'reseña' : 'reseñas'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {staff.promedio.toFixed(1)}
                                    </span>
                                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400">
                                    <TrendingUp size={10} />
                                    {isGeneral ? 'General' : `Top ${(index + 1) * 20}%`}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default StaffRankingWidget;
