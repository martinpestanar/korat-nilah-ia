import React from 'react';
import { Star, TrendingUp, Award, Droplets, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ServiceRanking } from '../../context/DashboardDataContext';

interface ServiceRankingWidgetProps {
    rankings: ServiceRanking[];
}

const ServiceRankingWidget: React.FC<ServiceRankingWidgetProps> = ({ rankings }) => {
    if (!rankings || rankings.length === 0) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 mb-3">
                    <Droplets size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Servicios Mejor Calificados</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No hay suficientes calificaciones para mostrar el ranking.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                        <Droplets size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            Servicios Mejor Calificados
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Top 5 por satisfacción
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {rankings.map((service, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="flex flex-col gap-2"
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[180px]">
                                {service.name}
                            </span>
                            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-500" />
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {service.promedio.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-400">({service.total})</span>
                            </div>
                        </div>
                        {/* Custom Progress Bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-dark-bg">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(service.promedio / 5) * 100}%` }}
                                transition={{ duration: 1, delay: 0.3 + index * 0.1, type: "spring" }}
                                className={`h-full rounded-full ${service.promedio >= 4.5 ? 'bg-emerald-500' :
                                    service.promedio >= 4.0 ? 'bg-blue-500' :
                                        service.promedio >= 3.0 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

export default ServiceRankingWidget;
