/**
 * ===========================================
 * Mock Data for Loyalty Module
 * ===========================================
 */

// Tipos para el módulo de fidelización
export interface LoyaltyClient {
    id: number;
    name: string;
    phone: string;
    points: number;
    totalVisits: number;
    category: 'Nuevo' | 'Recurrente' | 'VIP' | 'Platino';
    lastVisit: string;
    pointsThisMonth: number;
}

export interface Reward {
    id: number;
    name: string;
    pointsCost: number;
    description: string;
    category: string;
    isActive: boolean;
    timesRedeemed: number;
}

export interface Redemption {
    id: number;
    clientId: number;
    clientName: string;
    rewardId: number;
    rewardName: string;
    pointsUsed: number;
    date: string;
}

export interface LoyaltyStats {
    totalActivePoints: number;
    totalRewards: number;
    redemptionsThisMonth: number;
    vipClients: number;
    pointsIssuedThisMonth: number;
    averagePointsPerClient: number;
}

// ======= MOCK DATA =======

export const MOCK_LOYALTY_STATS: LoyaltyStats = {
    totalActivePoints: 8940,
    totalRewards: 6,
    redemptionsThisMonth: 19,
    vipClients: 8,
    pointsIssuedThisMonth: 4250,
    averagePointsPerClient: 380,
};

export const MOCK_LOYALTY_CLIENTS: LoyaltyClient[] = [
    { id: 901, name: 'Valeria Brescia', phone: '+51991000001', points: 1250, totalVisits: 18, category: 'VIP', lastVisit: '2025-01-08', pointsThisMonth: 280 },
    { id: 916, name: 'Alessandra Denegri', phone: '+51991234567', points: 1100, totalVisits: 12, category: 'VIP', lastVisit: '2025-01-07', pointsThisMonth: 220 },
    { id: 903, name: 'Camila Wiese', phone: '+51993000003', points: 900, totalVisits: 10, category: 'VIP', lastVisit: '2025-01-06', pointsThisMonth: 160 },
    { id: 902, name: 'Luciana Fernandini', phone: '+51992000002', points: 850, totalVisits: 14, category: 'VIP', lastVisit: '2025-01-05', pointsThisMonth: 150 },
    { id: 910, name: 'Rafaela Miró Quesada', phone: '+51990000010', points: 600, totalVisits: 6, category: 'VIP', lastVisit: '2024-12-28', pointsThisMonth: 120 },
    { id: 908, name: 'Micaela Pardo', phone: '+51998000008', points: 400, totalVisits: 8, category: 'Recurrente', lastVisit: '2024-12-20', pointsThisMonth: 80 },
    { id: 917, name: 'Mariana Costa', phone: '+51992345678', points: 320, totalVisits: 7, category: 'Recurrente', lastVisit: '2024-12-29', pointsThisMonth: 90 },
    { id: 912, name: 'Paola Vargas', phone: '+51992220012', points: 300, totalVisits: 5, category: 'Recurrente', lastVisit: '2024-11-20', pointsThisMonth: 0 },
    { id: 919, name: 'Claudia De la Puente', phone: '+51994567890', points: 280, totalVisits: 5, category: 'Recurrente', lastVisit: '2024-12-15', pointsThisMonth: 50 },
    { id: 904, name: 'Sofía Benavides', phone: '+51994000004', points: 250, totalVisits: 5, category: 'Recurrente', lastVisit: '2025-01-02', pointsThisMonth: 130 },
    { id: 918, name: 'Fiorella Rodriguez', phone: '+51993456789', points: 210, totalVisits: 4, category: 'Recurrente', lastVisit: '2025-01-04', pointsThisMonth: 70 },
    { id: 920, name: 'Natalia Berckemeyer', phone: '+51995678901', points: 190, totalVisits: 4, category: 'Recurrente', lastVisit: '2024-12-18', pointsThisMonth: 60 },
    { id: 905, name: 'Andrea Llosa', phone: '+51995000005', points: 180, totalVisits: 6, category: 'Recurrente', lastVisit: '2024-12-30', pointsThisMonth: 60 },
    { id: 909, name: 'Jimena Castro', phone: '+51999000009', points: 150, totalVisits: 4, category: 'Recurrente', lastVisit: '2024-12-22', pointsThisMonth: 0 },
    { id: 921, name: 'Ariana Romero', phone: '+51996789012', points: 130, totalVisits: 3, category: 'Recurrente', lastVisit: '2024-12-26', pointsThisMonth: 40 },
    { id: 906, name: 'Macarena Paz', phone: '+51996000006', points: 120, totalVisits: 3, category: 'Recurrente', lastVisit: '2025-01-03', pointsThisMonth: 90 },
    { id: 907, name: 'Renata Ortiz', phone: '+51997000007', points: 90, totalVisits: 2, category: 'Nuevo', lastVisit: '2025-01-02', pointsThisMonth: 90 },
];

export const MOCK_REWARDS: Reward[] = [
    { id: 1, name: 'Perfilado & Diseño de Cejas', pointsCost: 150, description: 'Diseño personalizado con visagismo y depilación de cejas', category: 'Cejas y Pestañas', isActive: true, timesRedeemed: 32 },
    { id: 2, name: 'Hidratación Capilar Express', pointsCost: 250, description: 'Tratamiento intensivo de brillo y nutrición con lavado y secado', category: 'Cabello', isActive: true, timesRedeemed: 44 },
    { id: 3, name: 'Manicura Rusa con Esmaltado', pointsCost: 300, description: 'Limpieza profunda de cutículas y acabado impecable semipermanente', category: 'Manos y Pies', isActive: true, timesRedeemed: 28 },
    { id: 4, name: 'Lifting de Pestañas + Keratina', pointsCost: 450, description: 'Arqueado natural de pestañas con nutrición profunda y tinte negro', category: 'Cejas y Pestañas', isActive: true, timesRedeemed: 19 },
    { id: 5, name: 'Sesión Limpieza Facial Glow', pointsCost: 600, description: 'Exfoliación ultrasónica, mascarilla de colágeno y masaje facial', category: 'Facial & Spa', isActive: true, timesRedeemed: 15 },
    { id: 6, name: 'Botox Capilar Restaurador', pointsCost: 900, description: 'Sellado de cutícula, anti-frizz y brillo espejo para melenas exigentes', category: 'Cabello', isActive: true, timesRedeemed: 8 },
];

export const MOCK_REDEMPTIONS: Redemption[] = [
    { id: 1, clientId: 901, clientName: 'Valeria Brescia', rewardId: 6, rewardName: 'Botox Capilar Restaurador', pointsUsed: 900, date: '2025-01-08' },
    { id: 2, clientId: 916, clientName: 'Alessandra Denegri', rewardId: 4, rewardName: 'Lifting de Pestañas + Keratina', pointsUsed: 450, date: '2025-01-06' },
    { id: 3, clientId: 903, clientName: 'Camila Wiese', rewardId: 5, rewardName: 'Sesión Limpieza Facial Glow', pointsUsed: 600, date: '2025-01-04' },
    { id: 4, clientId: 902, clientName: 'Luciana Fernandini', rewardId: 2, rewardName: 'Hidratación Capilar Express', pointsUsed: 250, date: '2025-01-02' },
    { id: 5, clientId: 904, clientName: 'Sofía Benavides', rewardId: 3, rewardName: 'Manicura Rusa con Esmaltado', pointsUsed: 300, date: '2024-12-28' },
    { id: 6, clientId: 908, clientName: 'Micaela Pardo', rewardId: 1, rewardName: 'Perfilado & Diseño de Cejas', pointsUsed: 150, date: '2024-12-26' },
    { id: 7, clientId: 917, clientName: 'Mariana Costa', rewardId: 2, rewardName: 'Hidratación Capilar Express', pointsUsed: 250, date: '2024-12-22' },
    { id: 8, clientId: 919, clientName: 'Claudia De la Puente', rewardId: 1, rewardName: 'Perfilado & Diseño de Cejas', pointsUsed: 150, date: '2024-12-18' },
];

// Helper para obtener color de categoría
export const getCategoryColor = (category: LoyaltyClient['category']): string => {
    switch (category) {
        case 'Platino':
            return 'bg-gradient-to-r from-gray-700 to-gray-900 text-white';
        case 'VIP':
            return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
        case 'Recurrente':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400';
        case 'Nuevo':
        default:
            return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
    }
};
