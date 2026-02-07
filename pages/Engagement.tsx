import React, { useState, useCallback } from 'react';
import { MessageCircle, Sparkles, RefreshCw } from 'lucide-react';
import EngagementStatsCard from '../components/Engagement/EngagementStatsCard';
import RatingsList from '../components/Engagement/RatingsList';
import MaintenanceRemindersWidget from '../components/Dashboard/MaintenanceRemindersWidget';
import PendingReminders from '../components/Engagement/PendingReminders';
import { engagement } from '../services/api';
import { useDashboardData, PendingRetoque, EngagementConfig, UpcomingCita, Rating } from '../context/DashboardDataContext';
import {
    MOCK_ENGAGEMENT_STATS,
    MOCK_RATINGS,
    PendingReminder,
} from '../services/engagementMockData';

const EngagementPage: React.FC = () => {
    const { data, isLoading, refresh } = useDashboardData();
    const [sendingId, setSendingId] = useState<string | null>(null);

    // Extract engagement data directly from context
    const engagementData = data?.engagement;
    const pendientesRetoque = engagementData?.pendientesRetoque || [];
    const citasProximas = engagementData?.citasProximas || [];
    const configRaw = engagementData?.config || [];

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

    // Note: MaintenanceRemindersWidget handles its own data loading

    // Get calificaciones from context or fallback to mock
    const calificaciones = engagementData?.calificaciones || [];
    const hasRealRatings = calificaciones.length > 0;
    const ratings = hasRealRatings ? calificaciones : MOCK_RATINGS;

    // Calculate stats with real data if available
    const statsCalificaciones = engagementData?.statsCalificaciones;
    const stats = {
        ...MOCK_ENGAGEMENT_STATS,
        pendingMaintenance: pendientesRetoque.length,
        pendingConfirmations: citasProximas.filter((c: UpcomingCita) => !c.recordatorio24h && !c.recordatorio3h).length,
        averageRating: statsCalificaciones?.promedio || MOCK_ENGAGEMENT_STATS.averageRating,
        ratingsThisMonth: statsCalificaciones?.esteMes || MOCK_ENGAGEMENT_STATS.ratingsThisMonth,
        commentsThisMonth: statsCalificaciones?.comentariosEsteMes || MOCK_ENGAGEMENT_STATS.commentsThisMonth,
    };

    // Handle send reminder via n8n
    const handleSendReminder = useCallback(async (reminder: PendingReminder) => {
        try {
            console.log('📤 Sending reminder to:', reminder.clientName);
            setSendingId(reminder.id);

            const response = await engagement.sendReminder(
                Number(reminder.clientId),
                (reminder as any).tipoServicio || reminder.serviceName,
                (reminder as any).diasPasados || 0
            );

            // Normalize response
            const result = Array.isArray(response) ? response[0] : response;

            if (result?.success) {
                console.log('✅ Reminder sent successfully');
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
        <div className="space-y-6 pb-10">
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
                    <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-indigo-500/10 px-4 py-2 dark:from-blue-500/20 dark:to-indigo-500/20">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Automatizado vía WhatsApp
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <EngagementStatsCard stats={stats} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Column - Reminders */}
                <PendingReminders
                    reminders={pendingReminders}
                    onSendReminder={handleSendReminder}
                />

                {/* Right Column - Ratings */}
                <RatingsList ratings={ratings} maxItems={6} />
            </div>

            {/* Maintenance Widget - Full featured */}
            <MaintenanceRemindersWidget />
        </div>
    );
};

export default EngagementPage;
