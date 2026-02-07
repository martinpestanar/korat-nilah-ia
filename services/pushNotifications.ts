/**
 * Push Notification Service
 * Servicio para notificaciones push del navegador
 */

// ===========================================
// Types
// ===========================================

export interface PushNotificationOptions {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    requireInteraction?: boolean;
    onClick?: () => void;
}

type NotificationCallback = (notification: PushNotificationOptions) => void;

// ===========================================
// Permission Management
// ===========================================

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('❌ Este navegador no soporta notificaciones');
        return 'denied';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        console.log('🔔 Permiso de notificaciones:', permission);
        return permission;
    }

    return Notification.permission;
};

export const hasNotificationPermission = (): boolean => {
    return 'Notification' in window && Notification.permission === 'granted';
};

// ===========================================
// Notification Functions
// ===========================================

export const showPushNotification = async (options: PushNotificationOptions): Promise<Notification | null> => {
    if (!hasNotificationPermission()) {
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            console.log('⚠️ Permiso de notificación denegado');
            return null;
        }
    }

    try {
        const notification = new Notification(options.title, {
            body: options.body,
            icon: options.icon || '/logo192.png',
            badge: options.badge || '/badge.png',
            tag: options.tag,
            requireInteraction: options.requireInteraction || false,
        });

        if (options.onClick) {
            notification.onclick = () => {
                window.focus();
                notification.close();
                options.onClick?.();
            };
        }

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
            setTimeout(() => notification.close(), 5000);
        }

        console.log('🔔 Notificación mostrada:', options.title);
        return notification;
    } catch (error) {
        console.error('❌ Error mostrando notificación:', error);
        return null;
    }
};

// ===========================================
// Predefined Notification Templates
// ===========================================

export const notificationTemplates = {
    newAppointment: (clientName: string, time: string) => ({
        title: '📅 Nueva Cita',
        body: `${clientName} agendó una cita para ${time}`,
        tag: 'appointment-new',
    }),

    appointmentReminder: (clientName: string, minutesBefore: number) => ({
        title: '⏰ Recordatorio de Cita',
        body: `Cita con ${clientName} en ${minutesBefore} minutos`,
        tag: 'appointment-reminder',
        requireInteraction: true,
    }),

    clientAtRisk: (clientName: string, daysAbsent: number) => ({
        title: '⚠️ Cliente en Riesgo',
        body: `${clientName} no ha venido en ${daysAbsent} días`,
        tag: 'client-risk',
    }),

    clientRescued: (clientName: string) => ({
        title: '🎉 ¡Cliente Recuperado!',
        body: `${clientName} volvió después de recibir tu mensaje`,
        tag: 'client-rescued',
    }),

    rewardRedeemed: (clientName: string, rewardName: string) => ({
        title: '🎁 Premio Canjeado',
        body: `${clientName} canjeó: ${rewardName}`,
        tag: 'reward-redeemed',
    }),

    campaignSent: (recipientCount: number) => ({
        title: '🚀 Campaña Enviada',
        body: `Tu campaña fue enviada a ${recipientCount} clientes`,
        tag: 'campaign-sent',
    }),

    lowStock: (serviceName: string) => ({
        title: '📦 Inventario Bajo',
        body: `Stock bajo de: ${serviceName}`,
        tag: 'low-stock',
        requireInteraction: true,
    }),
};

// ===========================================
// Integration with WebSocket Events
// ===========================================

export const handleWebSocketNotification = (eventType: string, payload: any) => {
    switch (eventType) {
        case 'cita_nueva':
            showPushNotification(
                notificationTemplates.newAppointment(
                    payload.clientName || 'Cliente',
                    payload.time || 'próximamente'
                )
            );
            break;

        case 'cliente_rescatado':
            showPushNotification(
                notificationTemplates.clientRescued(payload.clientName || 'Un cliente')
            );
            break;

        case 'canje_nuevo':
            showPushNotification(
                notificationTemplates.rewardRedeemed(
                    payload.clientName || 'Cliente',
                    payload.rewardName || 'Premio'
                )
            );
            break;

        default:
            // No notification for unknown events
            break;
    }
};

// ===========================================
// Export
// ===========================================

export default {
    request: requestNotificationPermission,
    hasPermission: hasNotificationPermission,
    show: showPushNotification,
    templates: notificationTemplates,
    handleWebSocket: handleWebSocketNotification,
};
