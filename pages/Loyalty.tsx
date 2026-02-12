/**
 * Loyalty Page - Centro de Fidelización
 * 
 * Diseño de dos columnas:
 * - Izquierda: Ranking de Puntos con progreso
 * - Derecha: Catálogo de Premios (lista)
 */

import React from 'react';
import { Crown, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import LoyaltyStatsCard from '../components/Loyalty/LoyaltyStatsCard';
import PointsLeaderboard from '../components/Loyalty/PointsLeaderboard';
import RewardsList from '../components/Loyalty/RewardsList';
import RedemptionHistory from '../components/Loyalty/RedemptionHistory';
import EncuestasPostCitaWidget from '../components/Loyalty/EncuestasPostCitaWidget';
import ClientesCercaDePremio from '../components/Loyalty/ClientesCercaDePremio';
import {
    useDashboardData,
    LoyaltyClient as ContextLoyaltyClient,
    Premio,
    Canje,
    LoyaltyStats,
    EncuestasStats,
    EncuestaEnviada,
    ClienteCercaDePremio as ClienteCercaDePremioType
} from '../context/DashboardDataContext';
import { MOCK_LOYALTY_STATS, MOCK_LOYALTY_CLIENTS, MOCK_REWARDS, MOCK_REDEMPTIONS } from '../services/loyaltyMockData';

// Adapter types
interface LoyaltyClientLegacy {
    id: number;
    name: string;
    phone: string;
    points: number;
    totalVisits: number;
    category: 'Nuevo' | 'Recurrente' | 'VIP' | 'Platino';
    lastVisit: string;
    pointsThisMonth: number;
}

interface RewardLegacy {
    id: number;
    name: string;
    pointsCost: number;
    description: string;
    category: string;
    isActive: boolean;
    timesRedeemed: number;
}

interface RedemptionLegacy {
    id: number;
    clientId: number;
    clientName: string;
    rewardId: number;
    rewardName: string;
    pointsUsed: number;
    date: string;
    status?: 'pendiente' | 'entregado' | 'cancelado';
}

// Transform functions
const transformClients = (clients: ContextLoyaltyClient[]): LoyaltyClientLegacy[] => {
    return clients.map(c => ({
        id: c.id,
        name: c.nombre,
        phone: c.telefono,
        points: c.puntos,
        totalVisits: c.totalVisitas,
        category: (c.categoria as 'Nuevo' | 'Recurrente' | 'VIP' | 'Platino') || 'Nuevo',
        lastVisit: c.ultimaVisita || '',
        pointsThisMonth: c.puntosEsteMes || 0
    }));
};

const transformPremios = (premios: Premio[]): RewardLegacy[] => {
    return premios.map(p => ({
        id: p.id,
        name: p.nombre,
        pointsCost: p.costo_puntos,
        description: p.descripcion,
        category: p.categoria,
        isActive: p.activo,
        timesRedeemed: p.veces_canjeado
    }));
};

const transformCanjes = (
    canjes: Canje[],
    clientes: { id: number; nombre: string }[],
    premios: Premio[]
): RedemptionLegacy[] => {
    return canjes.map(c => {
        // Buscar nombre del cliente por ID (usar Number para evitar problemas string vs number)
        const clienteId = Number(c.cliente_id);
        const cliente = clientes.find(cl => Number(cl.id) === clienteId);
        const clientName = c.cliente_nombre || cliente?.nombre || `Cliente #${c.cliente_id}`;

        // Buscar nombre del premio por ID
        const premioId = Number(c.premio_id);
        const premio = premios.find(p => Number(p.id) === premioId);
        const rewardName = c.premio_nombre || premio?.nombre || `Premio #${c.premio_id}`;

        return {
            id: c.id,
            clientId: c.cliente_id,
            clientName,
            rewardId: c.premio_id,
            rewardName,
            pointsUsed: c.puntos_usados,
            date: c.fecha_canje.split('T')[0],
            status: c.estado
        };
    });
};

const transformStats = (stats: LoyaltyStats | undefined) => {
    if (!stats) return {
        totalActivePoints: 0,
        totalRewards: 0,
        redemptionsThisMonth: 0,
        vipClients: 0,
        pointsIssuedThisMonth: 0,
        averagePointsPerClient: 0
    };
    return stats;
};

const LoyaltyPage: React.FC = () => {
    const { loyalty, isLoading, refresh, data } = useDashboardData();

    // Use real data if available, otherwise fallback to mock data
    const hasRealData = loyalty && (loyalty.premios?.length > 0 || loyalty.leaderboard?.length > 0);

    // Obtener clientes del contexto para hacer lookup de nombres
    const clientes = data?.clientes || [];
    const premiosData = loyalty?.premios || [];

    // DEBUG: Ver qué datos tenemos
    console.log('🔍 DEBUG Loyalty:', {
        clientesCount: clientes.length,
        clientesSample: clientes.slice(0, 2).map(c => ({ id: c.id, nombre: c.nombre })),
        premiosCount: premiosData.length,
        premiosSample: premiosData.slice(0, 2).map(p => ({ id: p.id, nombre: p.nombre })),
        canjesCount: loyalty?.canjesRecientes?.length || 0,
        canjesSample: loyalty?.canjesRecientes?.slice(0, 2).map(c => ({
            id: c.id,
            cliente_id: c.cliente_id,
            premio_id: c.premio_id,
            cliente_nombre: c.cliente_nombre,
            premio_nombre: c.premio_nombre
        }))
    });

    const stats = hasRealData ? transformStats(loyalty?.stats) : MOCK_LOYALTY_STATS;
    const leaderboard = hasRealData ? transformClients(loyalty?.leaderboard || []) : MOCK_LOYALTY_CLIENTS;
    const rewards = hasRealData ? transformPremios(premiosData) : MOCK_REWARDS;
    const redemptions = hasRealData
        ? transformCanjes(loyalty?.canjesRecientes || [], clientes, premiosData)
        : MOCK_REDEMPTIONS;

    if (isLoading && !loyalty) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando programa de fidelización...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg shadow-amber-500/20">
                            <Crown size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Centro de Fidelización
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Gestiona tu programa de puntos y premios
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary/10 to-violet-500/10 px-4 py-2 dark:from-primary/20 dark:to-emerald-500/20">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            1 sol = 1 punto
                        </span>
                    </div>
                    <button
                        onClick={() => refresh(true)}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <LoyaltyStatsCard stats={stats} />

            {/* NEW: Encuestas y Clientes Cerca de Premio */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left - Clientes cerca de premio */}
                <ClientesCercaDePremio
                    clientes={loyalty?.clientesCercaDePremio || []}
                    maxItems={5}
                    umbralPuntos={50}
                />

                {/* Right - Encuestas Post-Cita */}
                <EncuestasPostCitaWidget
                    stats={loyalty?.encuestasStats || {
                        enviadasHoy: 0,
                        enviadasSemana: 0,
                        respondidasSemana: 0,
                        tasaRespuesta: 0,
                        calificacionPromedio: 0,
                        conFeedback: 0
                    }}
                    ultimasEncuestas={loyalty?.ultimasEncuestas || []}
                    maxItems={5}
                />
            </div>

            {/* Main Content Grid - Two Columns */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Left Column - Leaderboard */}
                <PointsLeaderboard clients={leaderboard} maxItems={10} />

                {/* Right Column - Rewards */}
                <RewardsList rewards={rewards} />
            </div>

            {/* Redemption History */}
            <RedemptionHistory redemptions={redemptions} maxItems={8} />
        </div>
    );
};

export default LoyaltyPage;
