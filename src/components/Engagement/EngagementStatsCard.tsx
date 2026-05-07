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
            label: 'Asistencia Asegurada',
            value: `${stats.confirmationRate}%`,
            icon: Bell,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            what: 'De cada 100 clientas que recibieron un aviso, ¿cuántas confirmaron su asistencia?',
            why: 'Si este número baja, corres el riesgo de tener huecos vacíos en tu agenda por olvidos.'
        },
        {
            label: 'Plata por recuperar (Retoques)',
            value: stats.pendingMaintenance,
            icon: TrendingUp,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            what: 'Clientas que ya deberían haber vuelto para un mantenimiento (uñas, keratina, etc.) pero aún no agendaron.',
            why: '¡Ingresos fáciles! Envíales un mensajito rápido para que no se les pase la fecha.'
        },
        {
            label: 'Felicidad del Cliente',
            value: `⭐ ${stats.averageRating}`,
            icon: Star,
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-500/10',
            what: 'El puntaje que tus clientas le dan a su experiencia (de 1 a 5 estrellas).',
            why: 'Si baja de 4, tus clientas podrían estar descontentas con algo. \u00a1Pregunta qu\u00e9 pas\u00f3!'
        },
        {
            label: '¿Qué tanto te quieren?',
            value: `${stats.npsScore > 0 ? '+' : ''}${stats.npsScore}`,
            icon: MessageCircle,
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
            what: '¿Cuántas de tus clientas son fanáticas de tu salón y te recomiendan con sus amigas?',
            why: 'Un número alto significa que tus clientas están haciendo el marketing por ti.'
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
