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
    confirmationRate: 96,
    pendingMaintenances: 8,
    averageRating: 4.9,
    npsScore: 88,
    ratingsThisMonth: 64,
    commentsThisMonth: 38,
};

export const MOCK_RATINGS: Rating[] = [
    { id: 1, clientId: 901, clientName: 'Valeria Brescia', score: 5, comment: '¡Increíble atención! El balayage me quedó impecable, el tono exacto que quería.', serviceName: 'Balayage Premium', date: '2025-01-08' },
    { id: 2, clientId: 902, clientName: 'Luciana Fernandini', score: 5, comment: 'Camila es una genia con el botox capilar y el tratamiento de ozono, mi cabello brilla hermoso ✨', serviceName: 'Tratamiento Ozono', date: '2025-01-07' },
    { id: 3, clientId: 903, clientName: 'Camila Wiese', score: 5, comment: 'El masaje relajante y la exfoliación facial superaron mis expectativas. 10/10.', serviceName: 'Masaje Relajante', date: '2025-01-06' },
    { id: 4, clientId: 904, clientName: 'Sofía Benavides', score: 5, comment: 'Mis uñas acrílicas quedaron súper finas y elegantes. Muy pro Valeria.', serviceName: 'Uñas Acrílicas', date: '2025-01-05' },
    { id: 5, clientId: 905, clientName: 'Andrea Llosa', score: 4, comment: 'Muy buena técnica en mechas babylights, todo el equipo súper atento.', serviceName: 'Mechas Babylights', date: '2025-01-04' },
    { id: 6, clientId: 906, clientName: 'Macarena Paz', score: 5, comment: 'La limpieza facial profunda me dejó la piel como de porcelana. ¡Recomendadísimo!', serviceName: 'Limpieza Facial Profunda', date: '2025-01-03' },
    { id: 7, clientId: 907, clientName: 'Renata Ortiz', score: 5, comment: 'La pedicura jelly spa es una experiencia deliciosa, salí totalmente renovada 💅', serviceName: 'Pedicura Jelly Spa', date: '2025-01-02' },
    { id: 8, clientId: 913, clientName: 'Antonella Ríos', score: 5, comment: 'Primera vez que voy a Brilla Studio y amé la manicura rusa, el detalle es perfecto.', serviceName: 'Manicura Rusa', date: '2025-01-01' },
    { id: 9, clientId: 916, clientName: 'Alessandra Denegri', score: 5, comment: 'Ana me hizo el mejor lifting de pestañas de Lima, natural y con arqueado perfecto.', serviceName: 'Lifting Pestañas', date: '2024-12-30' },
    { id: 10, clientId: 917, clientName: 'Mariana Costa', score: 5, comment: 'El retoque de color y secado me dura intacto toda la semana. ¡Son las mejores!', serviceName: 'Retoque Color', date: '2024-12-28' },
    { id: 11, clientId: 918, clientName: 'Fiorella Rodriguez', score: 4, comment: 'Muy buena atención, ambiente súper limpio y café delicioso mientras me atendían.', serviceName: 'Manicura Gel', date: '2024-12-26' },
    { id: 12, clientId: 908, clientName: 'Micaela Pardo', score: 5, comment: 'Me recuperaron el cabello dañado con el tratamiento de hidratación intensiva.', serviceName: 'Botox Capilar', date: '2024-12-24' },
];

export const MOCK_MAINTENANCE_RULES: MaintenanceRule[] = [
    { id: 1, serviceName: 'Extensiones Pestañas', reminderDays: 18, isActive: true, messageTemplate: '¡Hola {nombre}! ✨ Ya pasaron 18 días desde tus extensiones. ¿Agendamos tu mantenimiento para que sigan perfectas?' },
    { id: 2, serviceName: 'Uñas Acrílicas / Gel', reminderDays: 21, isActive: true, messageTemplate: '¡Hola {nombre}! 💅 Es momento de tu retoque de uñas en Brilla Studio. ¿Te reservo tu horario habitual?' },
    { id: 3, serviceName: 'Balayage / Mechas', reminderDays: 75, isActive: true, messageTemplate: '¡Hola {nombre}! 🎨 Tu coloración ya tiene 2 meses y medio. ¿Te gustaría retocar matiz o hidratación?' },
    { id: 4, serviceName: 'Lifting de Pestañas', reminderDays: 35, isActive: true, messageTemplate: '¡Hola {nombre}! ✨ Es hora de renovar tu lifting de pestañas para mantener esa mirada impactante.' },
    { id: 5, serviceName: 'Limpieza Facial Profunda', reminderDays: 30, isActive: true, messageTemplate: '¡Hola {nombre}! 💆‍♀️ Tu piel merece su sesión mensual de cuidado y glow. ¿Te agendamos?' },
    { id: 6, serviceName: 'Botox / Alisado Orgánico', reminderDays: 90, isActive: true, messageTemplate: '¡Hola {nombre}! Ya pasaron 3 meses de tu laceado/botox. ¿Revisamos el mantenimiento de brillo?' },
];

export const MOCK_PENDING_REMINDERS: PendingReminder[] = [
    { id: 'm-1', clientId: '901', clientName: 'Valeria Brescia', clientPhone: '+51991000001', type: 'maintenance', scheduledDate: new Date().toISOString().split('T')[0], serviceName: 'Retoque Balayage', status: 'pending' },
    { id: 'c-1', clientId: '902', clientName: 'Luciana Fernandini', clientPhone: '+51992000002', type: 'confirmation', scheduledDate: new Date().toISOString().split('T')[0], serviceName: 'Tratamiento Ozono', status: 'confirmed' },
    { id: 'm-2', clientId: '904', clientName: 'Sofía Benavides', clientPhone: '+51994000004', type: 'maintenance', scheduledDate: new Date().toISOString().split('T')[0], serviceName: 'Uñas Acrílicas', status: 'pending' },
    { id: 'c-2', clientId: '913', clientName: 'Antonella Ríos', clientPhone: '+51993330013', type: 'confirmation', scheduledDate: new Date().toISOString().split('T')[0], serviceName: 'Manicura Rusa', status: 'confirmed' },
    { id: 'm-3', clientId: '908', clientName: 'Micaela Pardo', clientPhone: '+51998000008', type: 'maintenance', scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], serviceName: 'Botox Capilar', status: 'pending' },
    { id: 'c-3', clientId: '910', clientName: 'Rafaela Miró Q.', clientPhone: '+51990000010', type: 'confirmation', scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], serviceName: 'Lifting Pestañas', status: 'sent' },
    { id: 'm-4', clientId: '916', clientName: 'Alessandra Denegri', clientPhone: '+51991234567', type: 'maintenance', scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], serviceName: 'Lifting Pestañas', status: 'pending' },
    { id: 'c-4', clientId: '907', clientName: 'Renata Ortiz', clientPhone: '+51997000007', type: 'confirmation', scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], serviceName: 'Pedicura Jelly Spa', status: 'pending' },
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
