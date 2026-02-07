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
    totalActivePoints: 12450,
    totalRewards: 8,
    redemptionsThisMonth: 23,
    vipClients: 15,
    pointsIssuedThisMonth: 3200,
    averagePointsPerClient: 156,
};

export const MOCK_LOYALTY_CLIENTS: LoyaltyClient[] = [
    { id: 1, name: 'María López', phone: '987654321', points: 850, totalVisits: 24, category: 'VIP', lastVisit: '2024-12-28', pointsThisMonth: 120 },
    { id: 2, name: 'Ana García', phone: '987654322', points: 720, totalVisits: 18, category: 'VIP', lastVisit: '2024-12-27', pointsThisMonth: 80 },
    { id: 3, name: 'Carmen Ruiz', phone: '987654323', points: 650, totalVisits: 15, category: 'VIP', lastVisit: '2024-12-26', pointsThisMonth: 150 },
    { id: 4, name: 'Lucía Mendoza', phone: '987654324', points: 480, totalVisits: 12, category: 'Recurrente', lastVisit: '2024-12-25', pointsThisMonth: 60 },
    { id: 5, name: 'Rosa Torres', phone: '987654325', points: 350, totalVisits: 8, category: 'Recurrente', lastVisit: '2024-12-24', pointsThisMonth: 100 },
    { id: 6, name: 'Elena Vega', phone: '987654326', points: 280, totalVisits: 6, category: 'Recurrente', lastVisit: '2024-12-23', pointsThisMonth: 50 },
    { id: 7, name: 'Patricia Soto', phone: '987654327', points: 180, totalVisits: 4, category: 'Nuevo', lastVisit: '2024-12-22', pointsThisMonth: 90 },
    { id: 8, name: 'Diana Castro', phone: '987654328', points: 130, totalVisits: 2, category: 'Nuevo', lastVisit: '2024-12-20', pointsThisMonth: 80 },
    { id: 9, name: 'Sofía Paredes', phone: '987654329', points: 95, totalVisits: 2, category: 'Nuevo', lastVisit: '2024-12-19', pointsThisMonth: 45 },
    { id: 10, name: 'Valentina Rojas', phone: '987654330', points: 50, totalVisits: 1, category: 'Nuevo', lastVisit: '2024-12-18', pointsThisMonth: 50 },
];

export const MOCK_REWARDS: Reward[] = [
    { id: 1, name: 'Depilación de Cejas', pointsCost: 100, description: 'Depilación completa de cejas con cera o hilo', category: 'Tratamiento', isActive: true, timesRedeemed: 45 },
    { id: 2, name: 'Masaje de Manos', pointsCost: 20, description: 'Masaje relajante de 10 minutos', category: 'Spa', isActive: true, timesRedeemed: 78 },
    { id: 3, name: 'Nutrición Capilar', pointsCost: 200, description: 'Tratamiento de nutrición profunda para cabello', category: 'Cabello', isActive: true, timesRedeemed: 28 },
    { id: 4, name: 'Manicura Gratis', pointsCost: 300, description: 'Manicura completa con esmaltado', category: 'Uñas', isActive: true, timesRedeemed: 15 },
    { id: 5, name: 'Pedicura Spa', pointsCost: 400, description: 'Pedicura completa con exfoliación', category: 'Spa', isActive: true, timesRedeemed: 8 },
    { id: 6, name: 'Descuento 20%', pointsCost: 500, description: '20% de descuento en cualquier servicio', category: 'Descuento', isActive: true, timesRedeemed: 12 },
    { id: 7, name: 'Tinte Completo', pointsCost: 800, description: 'Servicio completo de coloración', category: 'Cabello', isActive: true, timesRedeemed: 3 },
    { id: 8, name: 'Día de Spa VIP', pointsCost: 1500, description: 'Paquete completo: masaje, facial y manicura', category: 'Premium', isActive: true, timesRedeemed: 1 },
];

export const MOCK_REDEMPTIONS: Redemption[] = [
    { id: 1, clientId: 4, clientName: 'Lucía Mendoza', rewardId: 4, rewardName: 'Manicura Gratis', pointsUsed: 300, date: '2024-12-29' },
    { id: 2, clientId: 5, clientName: 'Rosa Torres', rewardId: 1, rewardName: 'Depilación de Cejas', pointsUsed: 100, date: '2024-12-28' },
    { id: 3, clientId: 1, clientName: 'María López', rewardId: 2, rewardName: 'Masaje de Manos', pointsUsed: 20, date: '2024-12-27' },
    { id: 4, clientId: 2, clientName: 'Ana García', rewardId: 3, rewardName: 'Nutrición Capilar', pointsUsed: 200, date: '2024-12-26' },
    { id: 5, clientId: 3, clientName: 'Carmen Ruiz', rewardId: 6, rewardName: 'Descuento 20%', pointsUsed: 500, date: '2024-12-25' },
    { id: 6, clientId: 6, clientName: 'Elena Vega', rewardId: 2, rewardName: 'Masaje de Manos', pointsUsed: 20, date: '2024-12-24' },
    { id: 7, clientId: 1, clientName: 'María López', rewardId: 1, rewardName: 'Depilación de Cejas', pointsUsed: 100, date: '2024-12-23' },
    { id: 8, clientId: 7, clientName: 'Patricia Soto', rewardId: 2, rewardName: 'Masaje de Manos', pointsUsed: 20, date: '2024-12-22' },
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
