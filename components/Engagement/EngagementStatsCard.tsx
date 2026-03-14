import React from 'react';
import { MessageCircle, Bell, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { EngagementStats } from '../../services/engagementMockData';
import WidgetHelper from '../UI/WidgetHelper';

interface EngagementStatsCardProps {
    stats: EngagementStats;
}

const EngagementStatsCard: React.FC<EngagementStatsCardProps> = ({ stats }) => {
    const statItems = [
        {
            label: 'Tasa Confirmación',
            value: `${stats.confirmationRate}%`,
            icon: Bell,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            what: 'Porcentaje de citas que los clientes han confirmado por WhatsApp/SMS.',
            why: 'Mide la certidumbre de tu agenda. Si baja, podrías tener muchos espacios vacíos por culpa de no-shows.'
        },
        {
            label: 'Mantenim. Pendientes',
            value: stats.pendingMaintenances,
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            what: 'Clientas que necesitan un retoque o mantenimiento pero aún no agendan (ej. uñas acrílicas a las 3 semanas).',
            why: 'Dinero fácil sobre la mesa. Envíales un recordatorio rápido ofreciendo el turno.'
        },
        {
            label: 'Calificación Promedio',
            value: `⭐ ${stats.averageRating}`,
            icon: Star,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            what: 'Promedio de estrellas (1-5) dejadas por clientes después de su cita.',
            why: 'Crucial para tu reputación. Un promedio bajo puede indicar problemas con el staff o la puntualidad.'
        },
        {
            label: 'NPS Score',
            value: stats.npsScore,
            icon: MessageCircle,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            what: 'Net Promoter Score. Mide la lealtad de tus clientes basándose en encuestas.',
            why: 'Un NPS alto (+30) indica que tus clientes te recomiendan activamente con sus amigas.'
        },
    ];

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statItems.map((item, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-card"
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`rounded-lg p-2 ${item.bgColor}`}>
                                <item.icon className={`h-5 w-5 ${item.color}`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {item.value}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                            </div>
                        </div>
                        {item.what && (
                            <WidgetHelper
                                title={item.label}
                                what={item.what!}
                                why={item.why!}
                            />
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default EngagementStatsCard;
