import React from 'react';
import { CalendarClock, CheckCircle, XCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReminderStats } from '../../context/DashboardDataContext';
import WidgetHelper from '../UI/WidgetHelper';

interface ReminderStatsWidgetProps {
    stats: ReminderStats;
}

const ReminderStatsWidget: React.FC<ReminderStatsWidgetProps> = ({ stats }) => {
    if (!stats) {
        return (
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border flex flex-col items-center justify-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400 mb-3">
                    <CalendarClock size={24} />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Eficiencia Recordatorios</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Cargando estadísticas de recordatorios...
                </p>
            </div>
        );
    }

    const { totalSent, confirmed, canceled, noShow, confirmationRate } = stats;

    // We avoid division by 0 by falling back to 0
    const confirmPct = totalSent > 0 ? (confirmed / totalSent) * 100 : 0;
    const cancelPct = totalSent > 0 ? (canceled / totalSent) * 100 : 0;
    const noShowPct = totalSent > 0 ? (noShow / totalSent) * 100 : 0;

    // Pending responses (citas próximas enviadas pero aún estado "Pendiente")
    const pendingResponses = totalSent - confirmed - canceled - noShow;
    const pendingPct = totalSent > 0 ? (pendingResponses / totalSent) * 100 : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-dark-card dark:border-dark-border"
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400">
                        <CalendarClock size={20} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Eficiencia Recordatorios
                            </h3>
                            <WidgetHelper
                                title="Eficiencia de Recordatorios"
                                what="Mide qué tan efectivos son los mensajes automáticos asincrónicos (WhatsApp/SMS)."
                                why="Si envías mensajes pero la confirmación es baja (debajo de 70%), podrías estar dándoles poco tiempo de anticipación a tus clientas."
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Citas próximas (7 días)
                        </p>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {Math.round(confirmPct)}%
                    </span>
                    <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                        Tasa Confirmación
                    </span>
                </div>
            </div>

            {/* Main Progress Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full mb-6 bg-gray-100 dark:bg-dark-bg">
                <motion.div initial={{ width: 0 }} animate={{ width: `${confirmPct}%` }} transition={{ duration: 1, delay: 0.2 }} className="bg-emerald-500" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${pendingPct}%` }} transition={{ duration: 1, delay: 0.3 }} className="bg-yellow-400 opacity-60" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${cancelPct}%` }} transition={{ duration: 1, delay: 0.4 }} className="bg-orange-500" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${noShowPct}%` }} transition={{ duration: 1, delay: 0.5 }} className="bg-red-500" />
            </div>

            {/* Legend Grid */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    visible: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } }
                }}
                className="grid grid-cols-2 gap-4"
            >
                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle size={12} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Confirmadas</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{confirmed}</span>
                    </div>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400">
                        <Clock size={12} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Sin Respuesta</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{pendingResponses > 0 ? pendingResponses : 0}</span>
                    </div>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400">
                        <XCircle size={12} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Canceladas</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{canceled}</span>
                    </div>
                </motion.div>

                <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                        <XCircle size={12} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">No-Shows</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{noShow}</span>
                    </div>
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4 pt-4 border-t border-gray-100 dark:border-dark-border flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"
            >
                <span>Total Recordatorios Enviados</span>
                <span className="font-bold text-gray-900 dark:text-white">{totalSent}</span>
            </motion.div>
        </motion.div >
    );
};

export default ReminderStatsWidget;
