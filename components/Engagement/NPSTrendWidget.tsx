import React from 'react';
import { Activity, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { NPSTrend } from '../../context/DashboardDataContext';

interface NPSTrendWidgetProps {
    trend: NPSTrend[];
}

const NPSTrendWidget: React.FC<NPSTrendWidgetProps> = ({ trend }) => {
    if (!trend || trend.length === 0) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 mb-3">
                    <Activity size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">¿Te Recomiendan?</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Aún no hay suficientes reseñas para ver la tendencia. ¡Sigue pidiendo calificaciones!
                </p>
            </div>
        );
    }

    // Determine min/max for chart scaling
    const minNPS = Math.min(...trend.map(t => t.nps), -100);
    const maxNPS = Math.max(...trend.map(t => t.nps), 100);
    const currentNPS = trend[trend.length - 1]?.nps || 0;
    const previousNPS = trend[trend.length - 2]?.nps || 0;
    const isTrendingUp = currentNPS >= previousNPS;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                        <Activity size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            ¿Te Recomiendan?
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Últimas 4 semanas
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium ${isTrendingUp
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                    {isTrendingUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {currentNPS > 0 ? '+' : ''}{currentNPS}
                </div>
            </div>

            <div className="flex items-end justify-between h-32 gap-2 mt-4">
                {trend.map((data, index) => {
                    // Calculate height percentage (0 to 100 mapped from -100 to 100)
                    const heightPercent = Math.max(5, ((data.nps + 100) / 200) * 100);
                    const isPositive = data.nps >= 0;

                    return (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="flex flex-col items-center flex-1 h-full gap-2"
                        >
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                {data.nps > 0 ? '+' : ''}{data.nps}
                            </span>
                            <div className="w-full relative h-full flex items-end justify-center">
                                {/* Bar */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPercent}%` }}
                                    transition={{ duration: 0.8, delay: 0.2 + index * 0.1, type: "spring", stiffness: 50 }}
                                    className={`w-full max-w-[40px] rounded-t-md ${isPositive
                                        ? 'bg-gradient-to-t from-blue-400 to-indigo-500 shadow-md shadow-indigo-500/20'
                                        : 'bg-gradient-to-t from-red-400 to-orange-500 shadow-md shadow-red-500/20'
                                        }`}
                                />
                            </div>
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                {data.label}
                            </span>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );
};

export default NPSTrendWidget;
