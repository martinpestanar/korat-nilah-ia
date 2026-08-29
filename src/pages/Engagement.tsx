import React, { useState, useCallback } from 'react';
import { MessageCircle, Sparkles, RefreshCw, CheckCircle } from 'lucide-react';
import EngagementStatsCard from '../components/Engagement/EngagementStatsCard';
import RatingsList from '../components/Engagement/RatingsList';
import MaintenanceRemindersWidget from '../components/Dashboard/MaintenanceRemindersWidget';
import PendingReminders from '../components/Engagement/PendingReminders';
import ServiceRankingWidget from '../components/Engagement/ServiceRankingWidget';
import StaffRankingWidget from '../components/Engagement/StaffRankingWidget';
import NPSTrendWidget from '../components/Engagement/NPSTrendWidget';
import ReminderStatsWidget from '../components/Engagement/ReminderStatsWidget';
import { engagement } from '../services/api';
import { useDashboardData, PendingRetoque, EngagementConfig, UpcomingCita } from '../context/DashboardDataContext';
import { motion } from 'framer-motion';
import {
    MOCK_ENGAGEMENT_STATS,
    MOCK_RATINGS,
    PendingReminder,
} from '../services/engagementMockData';

const EngagementPage: React.FC = () => {
    const { pendientesRetoque, citasProximas, isLoading, refresh, engagementExtras } = useDashboardData();
    const [sendingId, setSendingId] = useState<string | null>(null);

    // Transform pendientesRetoque to PendingReminder format
    const pendingReminders: PendingReminder[] = [
        // Maintenance reminders (retoques)
        ...pendientesRetoque.map((p: PendingRetoque, idx: number) => ({
            id: `retoque-${p.citaId}-${idx}`,
            clientId: String(p.clienteId),
            clientName: p.nombre,
            clientPhone: p.telefono || '',
            serviceName: p.servicio,
            type: 'maintenance' as const,
            status: 'pending' as const,
            scheduledDate: new Date().toISOString().split('T')[0],
            tipoServicio: p.regla,
            diasPasados: p.diasPasados,
            mensaje: p.mensaje
        })),
        // Confirmation reminders (próximas citas)
        ...citasProximas.map((c: UpcomingCita, idx: number) => ({
            id: `cita-${c.citaId}-${idx}`,
            clientId: String(c.citaId),
            clientName: c.nombre,
            clientPhone: c.telefono || '',
            serviceName: c.servicio,
            type: 'confirmation' as const,
            status: (c.recordatorio24h || c.recordatorio3h) ? 'sent' as const : 'pending' as const,
            scheduledDate: c.fecha.split('T')[0],
            horasRestantes: c.horasRestantes
        }))
    ];

    // Use REAL ratings from Supabase via engagementExtras, fallback to mock only if no data
    const calificaciones = engagementExtras?.calificaciones || [];
    const hasRealRatings = calificaciones.length > 0;
    const ratings = hasRealRatings ? calificaciones : MOCK_RATINGS;

    // Calculate stats with real data when available
    const statsReal = engagementExtras?.statsCalificaciones;
    const stats = {
        ...MOCK_ENGAGEMENT_STATS,
        pendingMaintenance: pendientesRetoque.length,
        pendingConfirmations: citasProximas.filter((c: UpcomingCita) => !c.recordatorio24h && !c.recordatorio3h).length,
        averageRating: statsReal?.promedio ?? MOCK_ENGAGEMENT_STATS.averageRating,
        ratingsThisMonth: statsReal?.esteMes ?? MOCK_ENGAGEMENT_STATS.ratingsThisMonth,
        commentsThisMonth: statsReal?.comentariosEsteMes ?? MOCK_ENGAGEMENT_STATS.commentsThisMonth,
        npsScore: statsReal?.npsScore ?? MOCK_ENGAGEMENT_STATS.npsScore,
        confirmationRate: engagementExtras?.tasaConfirmacion
            ? Math.round(engagementExtras.tasaConfirmacion)
            : MOCK_ENGAGEMENT_STATS.confirmationRate,
    };

    // Handle send reminder via n8n
    const handleSendReminder = useCallback(async (reminder: PendingReminder) => {
        try {
            setSendingId(reminder.id);

            const response = await engagement.sendReminder(
                Number(reminder.clientId),
                (reminder as any).tipoServicio || reminder.serviceName,
                (reminder as any).diasPasados || 0
            );

            // Normalize response
            const result = Array.isArray(response) ? response[0] : response;

            if (result?.success) {
                // Refresh data from context
                refresh(true);
            } else {
                console.error('❌ Failed to send reminder:', result?.error);
                alert(result?.error || 'Error al enviar el recordatorio');
            }
        } catch (error) {
            console.error('💥 Error sending reminder:', error);
            alert('Error de conexión al enviar el recordatorio');
        } finally {
            setSendingId(null);
        }
    }, [refresh]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6 pb-36 sm:pb-10 animate-page-enter"
        >
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                            <MessageCircle size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Centro de Engagement
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Recordatorios, calificaciones y comunicaciones
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refresh(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-bg"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </button>
                    {hasRealRatings ? (
                        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 dark:bg-emerald-900/20 dark:border-emerald-800">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                {calificaciones.length} reseñas reales
                            </span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-4 py-2 dark:from-blue-500/20 dark:to-indigo-500/20">
                            <Sparkles className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Automatizado vía WhatsApp
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <EngagementStatsCard stats={stats} />

            {/* BI Dashboards */}
            {engagementExtras ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
                    <ReminderStatsWidget stats={engagementExtras.reminderStats!} />
                    <NPSTrendWidget trend={engagementExtras.statsCalificaciones?.npsTrend || []} />
                    <ServiceRankingWidget rankings={engagementExtras.statsCalificaciones?.serviciosRanking || []} />
                    <StaffRankingWidget rankings={engagementExtras.statsCalificaciones?.staffRanking || []} />
                </div>
            ) : null}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-6">
                {/* Left Column - Reminders */}
                <PendingReminders
                    reminders={pendingReminders}
                    onSendReminder={handleSendReminder}
                />

                {/* Right Column - Ratings */}
                <RatingsList ratings={ratings} itemsPerPage={6} />
            </div>

            {/* Maintenance Widget - Full featured */}
            <div className="mt-6">
                <MaintenanceRemindersWidget />
            </div>
        </motion.div>
    );
};

export default EngagementPage;
