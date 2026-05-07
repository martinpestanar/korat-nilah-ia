/**
 * ===========================================
 * Mock Data for Engagement Module
 * ===========================================
 */

// Tipos para el módulo de engagement
export interface Rating {
    id: number;
    clientId: number;
    clientName: string;
    score: number; // 1-5
    comment: string | null;
    serviceName: string;
    date: string;
}

export interface MaintenanceRule {
    id: number;
    serviceName: string;
    reminderDays: number;
    isActive: boolean;
    messageTemplate: string;
}

export interface PendingReminder {
    id: number | string;
    clientId?: number | string;
    clientName: string;
    clientPhone: string;
    type: 'confirmation' | 'maintenance';
    scheduledDate: string;
    serviceName: string;
    status: 'pending' | 'sent' | 'confirmed' | 'cancelled';
}

export interface EngagementStats {
    confirmationRate: number; // percentage
    pendingMaintenances: number;
    averageRating: number;
    npsScore: number;
    ratingsThisMonth: number;
    commentsThisMonth: number;
}

// ======= MOCK DATA =======

export const MOCK_ENGAGEMENT_STATS: EngagementStats = {
    confirmationRate: 94,
    pendingMaintenances: 12,
    averageRating: 4.8,
    npsScore: 72,
    ratingsThisMonth: 45,
    commentsThisMonth: 18,
};

export const MOCK_RATINGS: Rating[] = [
    { id: 1, clientId: 1, clientName: 'María López', score: 5, comment: '¡Excelente servicio! Siempre salgo feliz', serviceName: 'Manicura Gel', date: '2024-12-29' },
    { id: 2, clientId: 2, clientName: 'Ana García', score: 4, comment: 'Muy buen trabajo, aunque esperé un poco', serviceName: 'Extensiones Pestañas', date: '2024-12-28' },
    { id: 3, clientId: 3, clientName: 'Carmen Ruiz', score: 5, comment: null, serviceName: 'Pedicura Spa', date: '2024-12-27' },
    { id: 4, clientId: 4, clientName: 'Lucía Mendoza', score: 5, comment: 'La mejor estilista de la zona', serviceName: 'Tinte Cabello', date: '2024-12-26' },
    { id: 5, clientId: 5, clientName: 'Rosa Torres', score: 3, comment: 'El producto no duró mucho', serviceName: 'Uñas Acrílicas', date: '2024-12-25' },
    { id: 6, clientId: 6, clientName: 'Elena Vega', score: 5, comment: '¡Me encantó! Volveré pronto', serviceName: 'Depilación Facial', date: '2024-12-24' },
    { id: 7, clientId: 7, clientName: 'Patricia Soto', score: 4, comment: 'Muy profesional', serviceName: 'Corte Cabello', date: '2024-12-23' },
    { id: 8, clientId: 8, clientName: 'Diana Castro', score: 5, comment: null, serviceName: 'Masaje Relajante', date: '2024-12-22' },
    { id: 9, clientId: 9, clientName: 'Sofía Paredes', score: 5, comment: 'Increíble atención al cliente', serviceName: 'Facial Hidratante', date: '2024-12-21' },
    { id: 10, clientId: 10, clientName: 'Valentina Rojas', score: 4, comment: null, serviceName: 'Manicura Gel', date: '2024-12-20' },
];

export const MOCK_MAINTENANCE_RULES: MaintenanceRule[] = [
    { id: 1, serviceName: 'Extensiones Pestañas', reminderDays: 15, isActive: true, messageTemplate: '¡Hola {nombre}! Ya pasaron 15 días desde tus extensiones. ¿Agendamos tu mantenimiento?' },
    { id: 2, serviceName: 'Uñas Acrílicas', reminderDays: 21, isActive: true, messageTemplate: '¡Hola {nombre}! Es hora de renovar tus uñas acrílicas. Te esperamos 💅' },
    { id: 3, serviceName: 'Uñas Gel', reminderDays: 30, isActive: true, messageTemplate: '¡Hola {nombre}! Tu manicura gel ya tiene un mes. ¿Te agendamos?' },
    { id: 4, serviceName: 'Tinte Cabello', reminderDays: 45, isActive: true, messageTemplate: '¡Hola {nombre}! ¿Ya es hora de retocar el color? 🎨' },
    { id: 5, serviceName: 'Corte Cabello', reminderDays: 60, isActive: false, messageTemplate: '¡Hola {nombre}! Ya pasaron 2 meses desde tu último corte.' },
    { id: 6, serviceName: 'Depilación Cera', reminderDays: 30, isActive: true, messageTemplate: '¡Hola {nombre}! Es momento de tu depilación mensual ✨' },
];

export const MOCK_PENDING_REMINDERS: PendingReminder[] = [
    { id: 1, clientId: 1, clientName: 'María López', clientPhone: '987654321', type: 'confirmation', scheduledDate: '2024-12-30', serviceName: 'Manicura Gel', status: 'pending' },
    { id: 2, clientId: 2, clientName: 'Ana García', clientPhone: '987654322', type: 'confirmation', scheduledDate: '2024-12-30', serviceName: 'Pedicura', status: 'confirmed' },
    { id: 3, clientId: 3, clientName: 'Carmen Ruiz', clientPhone: '987654323', type: 'maintenance', scheduledDate: '2024-12-30', serviceName: 'Extensiones Pestañas', status: 'pending' },
    { id: 4, clientId: 4, clientName: 'Lucía Mendoza', clientPhone: '987654324', type: 'confirmation', scheduledDate: '2024-12-31', serviceName: 'Tinte', status: 'pending' },
    { id: 5, clientId: 5, clientName: 'Rosa Torres', clientPhone: '987654325', type: 'maintenance', scheduledDate: '2024-12-31', serviceName: 'Uñas Acrílicas', status: 'sent' },
    { id: 6, clientId: 6, clientName: 'Elena Vega', clientPhone: '987654326', type: 'confirmation', scheduledDate: '2024-12-31', serviceName: 'Masaje', status: 'pending' },
    { id: 7, clientId: 7, clientName: 'Patricia Soto', clientPhone: '987654327', type: 'maintenance', scheduledDate: '2025-01-02', serviceName: 'Extensiones Pestañas', status: 'pending' },
    { id: 8, clientId: 8, clientName: 'Diana Castro', clientPhone: '987654328', type: 'maintenance', scheduledDate: '2025-01-03', serviceName: 'Tinte Cabello', status: 'pending' },
];

// Helper para obtener color de score
export const getScoreColor = (score: number): string => {
    if (score >= 5) return 'text-emerald-500';
    if (score >= 4) return 'text-green-500';
    if (score >= 3) return 'text-amber-500';
    return 'text-red-500';
};

// Helper para obtener estilo de status de reminder
export const getReminderStatusStyle = (status: PendingReminder['status']): string => {
    switch (status) {
        case 'confirmed':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
        case 'sent':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
        case 'cancelled':
            return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400';
        case 'pending':
        default:
            return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400';
    }
};
