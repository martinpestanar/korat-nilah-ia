/**
 * Loyalty Page - Centro de Fidelización
 * 
 * Rediseño BI + UX Premium con 3 sub-tabs:
 * - Resumen: KPIs ejecutivos, ranking, clientes cerca de premio
 * - Premios y Canjes: Catálogo + historial con estados
 * - Inteligencia: BI avanzado (tasa canje, popularidad, LTV impact)
 * 
 * Soporta dos modos:
 * - Global: puntos globales por cliente
 * - Staff/Categoría: puntos segmentados por categoría de servicio
 */

import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Crown, Sparkles, Loader2, RefreshCw, Users, BarChart3, Gift, Brain, TrendingUp, Target, ArrowUpRight, Award, Zap, Globe } from 'lucide-react';
import PointsLeaderboard from '../components/Loyalty/PointsLeaderboard';
import RewardsList from '../components/Loyalty/RewardsList';
import RedemptionHistory from '../components/Loyalty/RedemptionHistory';
import ClientesCercaDePremio from '../components/Loyalty/ClientesCercaDePremio';
import StaffSelector, { CategoryData } from '../components/Loyalty/StaffSelector';
import LoyaltyIntelligence from '../components/Loyalty/LoyaltyIntelligence';
import { useDashboardData } from '../context/DashboardDataContext';
import { useAuth } from '../context/AuthContext';

// ── Types ────────────────────────────────────────────────
type TabId = 'resumen' | 'premios' | 'inteligencia';

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

// ── Helpers ──────────────────────────────────────────────
const normalizeCategory = (raw: string): 'Nuevo' | 'Recurrente' | 'VIP' | 'Platino' => {
    if (!raw) return 'Nuevo';
    const lower = raw.toLowerCase();
    if (lower.includes('platino')) return 'Platino';
    if (lower.includes('vip')) return 'VIP';
    if (lower.includes('fiel') || lower.includes('recurrente')) return 'Recurrente';
    return 'Nuevo';
};

const transformClients = (clients: any[]): LoyaltyClientLegacy[] => {
    if (!Array.isArray(clients)) return [];
    return clients
        .filter((c: any) => (c.puntos || c.points || 0) > 0)
        .map((c: any) => ({
            id: c.id,
            name: c.nombre || c.name || '',
            phone: c.telefono || c.phone || '',
            points: c.puntos || c.points || 0,
            totalVisits: c.totalVisitas || c.totalVisits || c.total_visitas || 0,
            category: normalizeCategory(c.categoria || c.category || c.lifecycle || 'Nuevo'),
            lastVisit: c.ultimaVisita || c.lastVisit || c.ultima_visita || '',
            pointsThisMonth: c.puntosEsteMes || c.pointsThisMonth || 0
        }));
};

const transformPremios = (premios: any[]): RewardLegacy[] => {
    if (!Array.isArray(premios)) return [];
    return premios.map((p: any) => ({
        id: p.id,
        name: p.nombre || p.name || '',
        pointsCost: p.costo_puntos || p.pointsCost || 0,
        description: p.descripcion || p.description || '',
        category: p.categoria || p.category || '',
        isActive: p.activo ?? p.isActive ?? true,
        timesRedeemed: p.veces_canjeado || p.timesRedeemed || 0
    }));
};

const transformCanjes = (
    canjes: any[],
    clientes: any[],
    premios: any[]
): RedemptionLegacy[] => {
    if (!Array.isArray(canjes)) return [];
    return canjes.map((c: any) => {
        const clienteId = Number(c.cliente_id);
        const cliente = (clientes || []).find((cl: any) => Number(cl.id) === clienteId);
        const clientName = c.cliente_nombre || cliente?.nombre || `Cliente #${c.cliente_id}`;

        const premioId = Number(c.premio_id);
        const premio = (premios || []).find((p: any) => Number(p.id) === premioId);
        const rewardName = c.premio_nombre || premio?.nombre || `Premio #${c.premio_id}`;

        return {
            id: c.id,
            clientId: c.cliente_id,
            clientName,
            rewardId: c.premio_id,
            rewardName,
            pointsUsed: c.puntos_usados || 0,
            date: c.fecha_canje || '',
            status: c.estado || 'pendiente'
        };
    });
};

const categoryEmojiMap: Record<string, string> = {
    'manos': '💅', 'uñas': '💅', 'manicure': '💅',
    'pies': '👣', 'pedicure': '👣',
    'rostro': '🧴', 'facial': '🧴', 'cara': '🧴',
    'pestañas': '👁️', 'lashes': '👁️',
    'cabello': '💇', 'pelo': '💇', 'corte': '✂️',
    'cejas': '✨', 'depilación': '✨',
    'spa': '🧖', 'masaje': '💆',
};

const getEmoji = (cat: string): string => {
    if (!cat) return '✨';
    const lower = cat.toLowerCase();
    for (const [key, emoji] of Object.entries(categoryEmojiMap)) {
        if (lower.includes(key)) return emoji;
    }
    return '✨';
};

// ── Tab Configuration ────────────────────────────────────
const TABS: { id: TabId; label: string; icon: any; description: string }[] = [
    { id: 'resumen', label: 'Resumen', icon: BarChart3, description: 'Vista ejecutiva' },
    { id: 'premios', label: 'Premios y Canjes', icon: Gift, description: 'Catálogo y canjes' },
    { id: 'inteligencia', label: 'Inteligencia', icon: Brain, description: 'BI y estrategia' },
];

// ══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════
const LoyaltyPage: React.FC = () => {
    const { loyalty, isLoading, refresh, raw, rewards: ctxRewards, redemptions: ctxRedemptions } = useDashboardData();
    const { tipoFidelizacion } = useAuth();
    const isStaffMode = tipoFidelizacion === 'staff';

    // Raw context arrays
    const staffList = (raw as any)?.staff || [];
    const appointments = (raw as any)?.citas || [];
    const clients = (raw as any)?.clientes || [];

    // UI state
    const [searchParams, setSearchParams] = useSearchParams();
    const tabStr = searchParams.get('tab');
    const activeTab: TabId = (tabStr === 'resumen' || tabStr === 'premios' || tabStr === 'inteligencia') ? tabStr : 'resumen';
    
    const setActiveTab = (tab: TabId) => {
        setSearchParams(prev => {
            const p = new URLSearchParams(prev);
            p.set('tab', tab);
            return p;
        });
    };

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // ── Staff Mode: Build puntosCategoriaData client-side ─────────
    const puntosCategoriaData = useMemo(() => {
        if (!isStaffMode) return [];
        const rawPuntos = (raw as any)?.puntos_por_categoria || [];
        return rawPuntos.map((p: any) => ({
            cliente_id: p.cliente_id,
            cliente_nombre: clients.find((c: any) => Number(c.id) === Number(p.cliente_id))?.nombre || `Cliente #${p.cliente_id}`,
            categoria_id: null,
            categoria_nombre: p.categoria,
            puntos: Number(p.puntos) || 0,
        })).filter((r: any) => r.puntos > 0);
    }, [isStaffMode, raw, clients]);

    // ── Transform data ───────────────────────────────────────────
    const premiosData = ctxRewards || [];
    const canjesData = ctxRedemptions || [];
    const topClientes = loyalty?.topClientes || [];

    const leaderboard = transformClients((topClientes).map((c: any) => ({
        id: c.id, nombre: c.nombre, telefono: c.telefono, puntos: c.puntos,
        totalVisitas: c.total_visitas, categoria: c.categoria || c.lifecycle || 'Nuevo',
        ultimaVisita: c.ultima_visita || '', puntosEsteMes: 0
    })));
    const rewards = transformPremios(premiosData);
    const redemptions = transformCanjes(canjesData, clients, premiosData);

    // ── KPI Stats (unified for both modes) ───────────────────────
    // Derive puntos canjeados from actual canjes data (puntos_usados) since the DB fields may not be updated
    const totalPuntosCanjeados = canjesData.reduce((s: number, c: any) => s + (Number(c.puntos_usados) || 0), 0);
    const totalPuntosActivos = clients.reduce((s: number, c: any) => s + (Number(c.puntos_acumulados) || 0), 0);
    const totalPuntosEmitidos = totalPuntosCanjeados + totalPuntosActivos;
    const tasaCanje = totalPuntosEmitidos > 0 ? Math.round((totalPuntosCanjeados / totalPuntosEmitidos) * 100) : 0;
    const clientesConPuntos = isStaffMode ? puntosCategoriaData.length : topClientes.filter((c: any) => c.puntos > 0).length;

    const kpis = useMemo(() => {
        const totalPuntos = loyalty?.puntosTotales ?? (isStaffMode
            ? puntosCategoriaData.reduce((s: number, p: any) => s + (Number(p.puntos) || 0), 0)
            : 0);
        return {
            totalPuntos,
            clientesActivos: clientesConPuntos,
            canjesMes: loyalty?.canjesMes ?? redemptions.length,
            tasaCanje,
            promedioPorCliente: clientesConPuntos > 0 ? Math.round(totalPuntos / clientesConPuntos) : 0,
        };
    }, [loyalty, puntosCategoriaData, clientesConPuntos, redemptions, tasaCanje, isStaffMode]);

    // ── Staff: Service Categories ────────────────────────────────
    const serviceCategories = useMemo((): CategoryData[] => {
        if (!isStaffMode) return [];
        const activeStaff = staffList.filter((s: any) => s.activo !== false);
        if (activeStaff.length === 0) return [];
        const groups = new Map<string, any[]>();
        activeStaff.forEach((s: any) => {
            const catNames = (s.cat_staff || 'General').split(',').map((c: string) => c.trim());
            catNames.forEach((catName: string) => {
                const name = catName || 'General';
                if (!groups.has(name)) groups.set(name, []);
                if (!groups.get(name)!.some(existing => existing.id === s.id)) {
                    groups.get(name)!.push(s);
                }
            });
        });
        return Array.from(groups.entries()).map(([catName, members]) => {
            const catPointsRecords = puntosCategoriaData.filter((p: any) => p.categoria_nombre === catName);
            const totalPuntos = catPointsRecords.reduce((sum: number, p: any) => sum + (Number(p.puntos) || 0), 0);
            return {
                categoryId: catPointsRecords[0]?.categoria_id,
                categoryName: catName,
                emoji: getEmoji(catName),
                totalPuntos: Math.round(totalPuntos),
                clientesActivos: catPointsRecords.length,
                staffMembers: members.map((m: any) => ({ id: m.id, nombre: m.nombre, especialidad: m.especialidad })),
            };
        }).sort((a, b) => b.totalPuntos - a.totalPuntos);
    }, [isStaffMode, staffList, puntosCategoriaData]);

    // ── Staff: Filtered Rewards ──────────────────────────────────
    const staffRewards = useMemo((): RewardLegacy[] => {
        if (!isStaffMode) return rewards;
        if (!selectedCategory) return rewards;
        return rewards.filter(r => {
            const rCat = (r.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            const selCat = selectedCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            return rCat === selCat;
        });
    }, [isStaffMode, selectedCategory, rewards]);

    // ── Staff: Clients Near Reward ───────────────────────────────
    const staffClientesCercaDePremio = useMemo(() => {
        if (!isStaffMode) return loyalty?.clientesCercaDePremio || [];
        const records = selectedCategory
            ? puntosCategoriaData.filter((p: any) => p.categoria_nombre === selectedCategory)
            : puntosCategoriaData;
        const catRewards = [...staffRewards].filter(r => r.isActive !== false).sort((a, b) => a.pointsCost - b.pointsCost);
        const result: any[] = [];
        records.forEach((p: any) => {
            const puntos = Number(p.puntos) || 0;
            if (puntos <= 0) return;
            const nextReward = catRewards.find(r => r.pointsCost > puntos);
            if (!nextReward) return;
            const faltantes = nextReward.pointsCost - puntos;
            if (faltantes > 0 && faltantes <= 50) {
                const matchingClient = clients.find((c: any) => Number(c.id) === Number(p.cliente_id));
                result.push({
                    clienteId: Number(p.cliente_id),
                    nombre: matchingClient?.nombre || p.cliente_nombre || `Cliente ${p.cliente_id}`,
                    telefono: matchingClient?.telefono || '',
                    puntosActuales: puntos,
                    proximoPremio: nextReward.name,
                    puntosNecesarios: nextReward.pointsCost,
                    faltantes,
                });
            }
        });
        return result.sort((a, b) => a.faltantes - b.faltantes);
    }, [isStaffMode, selectedCategory, puntosCategoriaData, staffRewards, clients, loyalty]);

    // ── Staff Leaderboard ────────────────────────────────────────
    const getStaffLeaderboard = () => {
        if (!isStaffMode) return [];
        const records = selectedCategory
            ? puntosCategoriaData.filter((p: any) => p.categoria_nombre === selectedCategory)
            : puntosCategoriaData;
        const byClient = new Map<number, any>();
        records.forEach((p: any) => {
            const cId = Number(p.cliente_id);
            const existing = byClient.get(cId);
            if (!existing || Number(p.puntos) > Number(existing.puntos)) byClient.set(cId, p);
        });
        return Array.from(byClient.values()).map((p: any) => {
            const matchingClient = clients.find((c: any) => Number(c.id) === Number(p.cliente_id));
            return {
                id: Number(p.cliente_id),
                name: matchingClient?.nombre || p.cliente_nombre || 'Cliente',
                phone: matchingClient?.telefono || '-',
                points: Number(p.puntos) || 0,
                totalVisits: matchingClient?.total_visitas || 0,
                category: matchingClient?.categoria || matchingClient?.lifecycle || 'Recurrente',
                lastVisit: matchingClient?.ultima_visita || new Date().toISOString(),
                pointsThisMonth: 0
            };
        }).sort((a, b) => b.points - a.points);
    };

    // ── Loading State ────────────────────────────────────────────
    if (isLoading && !loyalty) {
        return (
            <div className="flex h-96 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-violet-500 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando programa de fidelización...</p>
                </div>
            </div>
        );
    }

    const currentLeaderboard = isStaffMode ? getStaffLeaderboard() : leaderboard;
    const currentRewards = isStaffMode ? staffRewards : rewards;
    const currentCercaDePremio = isStaffMode ? staffClientesCercaDePremio : (loyalty?.clientesCercaDePremio || []);

    // ══════════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════════
    return (
        <div className="space-y-6 pb-10 animate-page-enter w-full min-w-0">
            {/* ── HEADER ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/25">
                        <Crown size={22} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Centro de Fidelización
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {isStaffMode ? 'Modo Staff · Puntos por categoría de servicio' : 'Programa de puntos y premios'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-xl bg-violet-500/10 px-3 py-1.5 dark:bg-violet-500/20 border border-violet-500/20">
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                        <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">1 sol = 1 punto</span>
                    </div>
                    {isStaffMode ? (
                        <div className="flex items-center gap-1.5 rounded-xl bg-purple-500/10 px-3 py-1.5 dark:bg-purple-500/20 border border-purple-500/20">
                            <Users className="h-3.5 w-3.5 text-purple-500" />
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">Modo Staff</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 py-1.5 dark:bg-blue-500/20 border border-blue-500/20">
                            <Globe className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Modo Global</span>
                        </div>
                    )}
                    <button
                        onClick={() => refresh(true)}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 transition-all"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </div>

            {/* ── KPI CARDS ───────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                <KPICard icon={Sparkles} label="Puntos Total" value={kpis.totalPuntos.toLocaleString()} gradient="from-violet-500 to-purple-600" />
                <KPICard icon={Users} label="Clientes Activos" value={kpis.clientesActivos.toString()} gradient="from-blue-500 to-cyan-500" />
                <KPICard icon={Gift} label="Canjes Este Mes" value={kpis.canjesMes.toString()} gradient="from-amber-500 to-orange-500" />
                <KPICard icon={Target} label="Tasa de Canje" value={`${tasaCanje}%`} gradient="from-emerald-500 to-green-500" subtitle={tasaCanje < 30 ? '⚠️ Baja' : tasaCanje < 60 ? '📊 Moderada' : '🔥 Alta'} />
                <KPICard icon={TrendingUp} label="Promedio/Cliente" value={kpis.promedioPorCliente.toString()} gradient="from-pink-500 to-rose-500" className="col-span-2 lg:col-span-1" />
            </div>

            {/* ── STAFF CATEGORY SELECTOR ─────────────────────────── */}
            {isStaffMode && (
                <StaffSelector
                    categories={serviceCategories}
                    selectedCategory={selectedCategory}
                    onSelect={setSelectedCategory}
                />
            )}

            {/* ── TAB BAR ────────────────────────────────────────── */}
            <div className="relative">
                <div className="flex gap-1 rounded-2xl bg-gray-100/80 dark:bg-white/5 p-1 border border-gray-200/50 dark:border-white/10 backdrop-blur-sm">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${isActive
                                    ? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-200/50 dark:border-violet-500/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/5'
                                    }`}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-violet-500' : ''}`} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════ */}
            {/* TAB: RESUMEN                                          */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'resumen' && (
                <div className="space-y-6 animate-page-enter">
                    {/* Clientes Cerca de Premio */}
                    <ClientesCercaDePremio
                        clientes={currentCercaDePremio}
                        maxItems={7}
                        umbralPuntos={50}
                    />

                    {/* Ranking + Quick Rewards */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <PointsLeaderboard
                            clients={currentLeaderboard}
                            maxItems={7}
                            staffFilter={isStaffMode && selectedCategory !== null ? 1 : undefined}
                            staffCategoryName={isStaffMode ? (selectedCategory || undefined) : undefined}
                        />
                        <RewardsList
                            rewards={currentRewards}
                            isStaffMode={isStaffMode}
                            categoryId={isStaffMode ? serviceCategories.find(c => c.categoryName === selectedCategory)?.categoryId : undefined}
                            leaderboard={currentLeaderboard}
                            maxItems={5}
                        />
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* TAB: PREMIOS Y CANJES                                 */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'premios' && (
                <div className="space-y-6 animate-page-enter">
                    {/* Full Rewards Catalog */}
                    <RewardsList
                        rewards={currentRewards}
                        isStaffMode={isStaffMode}
                        categoryId={isStaffMode ? serviceCategories.find(c => c.categoryName === selectedCategory)?.categoryId : undefined}
                        leaderboard={currentLeaderboard}
                        maxItems={20}
                    />

                    {/* Full Redemption History */}
                    <RedemptionHistory
                        redemptions={redemptions}
                        maxItems={15}
                        isStaffMode={isStaffMode}
                    />
                </div>
            )}

            {/* ══════════════════════════════════════════════════════ */}
            {/* TAB: INTELIGENCIA BI                                  */}
            {/* ══════════════════════════════════════════════════════ */}
            {activeTab === 'inteligencia' && (
                <LoyaltyIntelligence
                    clients={clients}
                    premios={premiosData}
                    canjes={canjesData}
                    rewards={rewards}
                    redemptions={redemptions}
                    isStaffMode={isStaffMode}
                    selectedCategory={selectedCategory}
                    puntosCategoriaData={puntosCategoriaData}
                    serviceCategories={serviceCategories}
                />
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════
// KPI CARD — Premium glassmorphism design
// ══════════════════════════════════════════════════════════
const KPICard: React.FC<{
    icon: any;
    label: string;
    value: string;
    gradient: string;
    subtitle?: string;
    className?: string;
}> = ({ icon: Icon, label, value, gradient, subtitle, className = '' }) => (
    <div className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-200 dark:hover:border-violet-500/20 ${className}`}>
        {/* Background gradient accent */}
        <div className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

        <div className="relative flex items-start justify-between">
            <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>}
            </div>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg opacity-90`}>
                <Icon className="h-4 w-4" />
            </div>
        </div>
    </div>
);

export default LoyaltyPage;
