import React from 'react';
import { Star, Users, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { StaffRanking } from '../../context/DashboardDataContext';

interface StaffRankingWidgetProps {
    rankings: StaffRanking[];
}

const StaffRankingWidget: React.FC<StaffRankingWidgetProps> = ({ rankings }) => {
    if (!rankings || rankings.length === 0) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 mb-3">
                    <Users size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Staff Destacado</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Aún no hay suficientes calificaciones de clientes.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Staff Destacado
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Por calificación de clientes
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {rankings.map((staff, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                        whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-50 bg-gray-50/50 dark:bg-dark-bg/50 dark:border-dark-border group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-sm group-hover:shadow-md transition-shadow">
                                    {staff.name.charAt(0).toUpperCase()}
                                </div>
                                {index === 0 && (
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
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {staff.name}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {staff.total} reseñas
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {staff.promedio.toFixed(1)}
                                </span>
                                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-500" />
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400">
                                <TrendingUp size={10} />
                                Top {(index + 1) * 20}%
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default StaffRankingWidget;
