/**
 * CRM.tsx — Módulo CRM con Segmentación Inteligente
 * Reemplaza y extiende Clients.tsx.
 * Tab 1: Clientes (lista legacy) | Tab 2: Segmentos (NUEVO)
 * Mobile-first. UI premium. Nilah IA.
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Plus, RefreshCw, Loader2, Users, Layers,
    DatabaseZap, Filter, ChevronRight, Sparkles, Trash2, BrainCircuit, AlertCircle,
    MessageCircle, MessageSquare, Crown, Gift, BarChart3, Brain, Target, TrendingUp, Zap, CheckCircle,
    ChevronUp, ChevronDown, Lock, X,
} from 'lucide-react';


import { useAuth } from '../context/AuthContext';
import { useDashboardData, Client } from '../context/DashboardDataContext';
import { auth as authApi, dashboard, crm, engagement, campaigns as campaignsApi } from '../services/api';
import { supabase } from '../services/supabase';

// Legacy client components
import { ClientsMetrics } from '../components/Clients/ClientsMetrics';
import { ClientCard } from '../components/Clients/ClientCard';
import { ClientModal } from '../components/Clients/ClientModal';
import { BottomSheet } from '../components/UI/BottomSheet';
import { ProUpgradeModal, TriggerContext } from '../components/UI/ProUpgradeModal';

// CRM Segmentation components
import AudiencesTab, { SmartAudience } from '../components/Marketing/AudiencesTab';
import CampaignTuningModal from '../components/Marketing/CampaignTuningModal';

// Engagement components
import EngagementStatsCard from '../components/Engagement/EngagementStatsCard';
import RatingsList from '../components/Engagement/RatingsList';
import PendingReminders from '../components/Engagement/PendingReminders';
import MaintenanceRemindersWidget from '../components/Dashboard/MaintenanceRemindersWidget';
import ReminderStatsWidget from '../components/Engagement/ReminderStatsWidget';
import NPSTrendWidget from '../components/Engagement/NPSTrendWidget';
import ServiceRankingWidget from '../components/Engagement/ServiceRankingWidget';
import StaffRankingWidget from '../components/Engagement/StaffRankingWidget';
import { MOCK_ENGAGEMENT_STATS, MOCK_RATINGS, PendingReminder } from '../services/engagementMockData';
import { PendingRetoque, EngagementConfig, UpcomingCita } from '../context/DashboardDataContext';

// Loyalty components
import PointsLeaderboard from '../components/Loyalty/PointsLeaderboard';
import RewardsList from '../components/Loyalty/RewardsList';
import RedemptionHistory from '../components/Loyalty/RedemptionHistory';
import ClientesCercaDePremio from '../components/Loyalty/ClientesCercaDePremio';
import StaffSelector, { CategoryData } from '../components/Loyalty/StaffSelector';
import LoyaltyIntelligence from '../components/Loyalty/LoyaltyIntelligence';
// ============================
// Main tab type
// ============================
type MainTab = 'clients' | 'segments' | 'engagement' | 'loyalty';

// Helper para detectar cumpleaños en el mes actual
export const isCurrentMonthBirthday = (c: Client) => {
    if (!c.cumpleanos) return false;
    const currentMonth = new Date().getMonth() + 1;
    const str = String(c.cumpleanos).trim();
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts.length === 3) return parseInt(parts[1], 10) === currentMonth;
        if (parts.length === 2) return parseInt(parts[0], 10) === currentMonth;
    } else if (str.includes('/')) {
        const parts = str.split('/');
        if (parts.length >= 2) return parseInt(parts[1], 10) === currentMonth || parseInt(parts[0], 10) === currentMonth;
    }
    return false;
};

// ============================
// Filtros de Nivel 1: Salud del Ciclo de Vida (Recencia / Estado)
// ============================
export const HEALTH_TABS = [
    { id: 'Todos', label: 'Todas', emoji: '👥', badgeClass: 'bg-indigo-600 text-white' },
    { id: 'Activos', label: 'Activas (≤30d)', emoji: '🟢', badgeClass: 'bg-emerald-600 text-white', filter: (c: Client) => (c.total_visitas || 0) > 0 && (c.dias_ausente || 0) <= 30 },
    { id: 'EnRiesgo', label: 'En Riesgo (31-60d)', emoji: '⚠️', badgeClass: 'bg-amber-600 text-white', filter: (c: Client) => (c.total_visitas || 0) > 0 && (c.dias_ausente || 0) > 30 && (c.dias_ausente || 0) <= 60 },
    { id: 'Inactivas', label: 'Inactivas (+60d)', emoji: '💤', badgeClass: 'bg-rose-600 text-white', filter: (c: Client) => (c.total_visitas || 0) > 0 && (c.dias_ausente || 0) > 60 },
    { id: 'Nuevas', label: 'Nuevas (1 Visita)', emoji: '🌱', badgeClass: 'bg-teal-600 text-white', filter: (c: Client) => (c.total_visitas || 0) === 1 || (c.categoria || '').toUpperCase().includes('NUEVA') || (c.categoria || '').toUpperCase() === 'NUEVO' },
];

// ============================
// Filtros de Nivel 2: Facetas Rápidas (Comportamiento / Valor / Eventos)
// ============================
export const QUICK_FACETS = [
    { id: 'todos', label: 'Todos los tipos', icon: '✨' },
    { id: 'vip', label: 'VIP & Fieles', icon: '👑', filter: (c: Client) => (c.categoria || '').toUpperCase().includes('VIP') || (c.categoria || '').toUpperCase().includes('FIEL') || (c.total_visitas || 0) >= 13 || (c.ltv || 0) >= 1000 },
    { id: 'ticket_alto', label: 'Ticket Alto', icon: '💰', filter: (c: Client) => (c.ticket_promedio || 0) >= 50 },
    { id: 'cumpleanos', label: 'Cumpleaños del Mes', icon: '🎂', filter: (c: Client) => isCurrentMonthBirthday(c) },
    { id: 'fans', label: '5★ Fans', icon: '⭐', filter: (c: Client, ratingAvg?: number | null) => (ratingAvg != null ? ratingAvg >= 4.8 : (c.fiabilidad_score || 100) >= 95) },
    { id: 'no_show', label: 'Riesgo No-Show', icon: '🛑', filter: (c: Client) => (c.fiabilidad_score || 100) < 70 },
];

// ============================
// Loyalty helpers
// ============================
interface LoyaltyClientLegacy {
    id: number; name: string; phone: string; points: number; totalVisits: number;
    category: 'Nuevo' | 'Recurrente' | 'VIP' | 'Platino'; lastVisit: string; pointsThisMonth: number;
}
interface RewardLegacy {
    id: number; name: string; pointsCost: number; description: string;
    category: string; isActive: boolean; timesRedeemed: number;
}
interface RedemptionLegacy {
    id: number; clientId: number; clientName: string; rewardId: number;
    rewardName: string; pointsUsed: number; date: string; status?: 'pendiente' | 'entregado' | 'cancelado';
}
const normalizeCategory = (raw: string): 'Nuevo' | 'Recurrente' | 'VIP' | 'Platino' => {
    const lower = (raw || '').toLowerCase();
    if (lower.includes('platino')) return 'Platino';
    if (lower.includes('vip')) return 'VIP';
    if (lower.includes('fiel') || lower.includes('recurrente')) return 'Recurrente';
    return 'Nuevo';
};
const transformClients = (raw: any[]): LoyaltyClientLegacy[] =>
    (raw || []).filter(c => (c.puntos || c.points || 0) > 0).map(c => ({
        id: c.id, name: c.nombre || '', phone: c.telefono || '',
        points: c.puntos || c.points || 0, totalVisits: c.totalVisitas || c.total_visitas || 0,
        category: normalizeCategory(c.categoria || c.lifecycle || 'Nuevo'),
        lastVisit: c.ultimaVisita || c.ultima_visita || '', pointsThisMonth: c.puntosEsteMes || 0,
    }));
const transformPremios = (premios: any[]): RewardLegacy[] =>
    (premios || []).map(p => ({
        id: p.id, name: p.nombre || '', pointsCost: p.costo_puntos || 0,
        description: p.descripcion || '', category: p.categoria || '',
        isActive: p.activo ?? true, timesRedeemed: p.veces_canjeado || 0,
    }));
const transformCanjes = (canjes: any[], clientes: any[], premios: any[]): RedemptionLegacy[] =>
    (canjes || []).map(c => ({
        id: c.id, clientId: c.cliente_id,
        clientName: c.cliente_nombre || (clientes.find((cl: any) => Number(cl.id) === Number(c.cliente_id))?.nombre) || `Cliente #${c.cliente_id}`,
        rewardId: c.premio_id,
        rewardName: c.premio_nombre || (premios.find((p: any) => Number(p.id) === Number(c.premio_id))?.nombre) || `Premio #${c.premio_id}`,
        pointsUsed: c.puntos_usados || 0, date: c.fecha_canje || '', status: c.estado || 'pendiente',
    }));
const KPICard: React.FC<{ icon: any; label: string; value: string; gradient: string; subtitle?: string; className?: string }> =
    ({ icon: Icon, label, value, gradient, subtitle, className = '' }) => (
        <div className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-4 transition-all duration-300 hover:shadow-lg ${className}`}>
            <div className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
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

// ============================
// Main Page
// ============================
const CRMPage: React.FC = () => {
    const { isAdmin, isStaff, tipoFidelizacion, hasSaaSModule, hasSaaSFeature, user } = useAuth();
    const businessId = user?.business_id || localStorage.getItem('korat_business_id') || '';
    const { clients, appointments, services, staff: staffList, isLoading, refresh, error: loadError,
        pendientesRetoque, citasProximas, engagementExtras, loyalty, raw, rewards: ctxRewards, redemptions: ctxRedemptions,
    } = useDashboardData();
    const navigate = useNavigate();
    const isStaffMode = tipoFidelizacion === 'staff';

    // ---- Top-level tab ----
    const MAIN_TABS = useMemo(() => {
        const tabs: { id: MainTab; label: string; icon: any; color: string; featureKey?: string }[] = [
            { id: 'clients', label: 'Clientes', icon: Users, color: '#6366f1' },
        ];
        if (hasSaaSModule('marketing') || hasSaaSModule('crm')) {
            tabs.push({ id: 'segments', label: 'Segmentos', icon: Layers, color: '#7c3aed', featureKey: 'segmentos' });
        }
        if (hasSaaSModule('engagement')) {
            tabs.push({ id: 'engagement', label: 'Conexión & Calidad', icon: MessageCircle, color: '#3b82f6' });
        }
        if (hasSaaSModule('fidelizacion')) {
            tabs.push({ id: 'loyalty', label: 'Puntos & Premios', icon: Crown, color: '#f59e0b' });
        }
        return tabs;
    }, [hasSaaSModule]);

    const tabHasAccess = (featureKey?: string) => !featureKey || hasSaaSFeature('crm', featureKey);

    const { isPro } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const mainTab = (searchParams.get('tab') as MainTab) || 'clients';

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [upgradeModalContext, setUpgradeModalContext] = useState<TriggerContext>('rescate_inactivas');
    const [isCrmBannerDismissed, setIsCrmBannerDismissed] = useState<boolean>(() => {
        return sessionStorage.getItem('nilah_crm_banner_dismissed') === 'true';
    });

    useEffect(() => {
        if (isCrmBannerDismissed || isPro) return;
        // Auto-cierre suave después de 14 segundos para no interrumpir el flujo del usuario
        const timer = setTimeout(() => {
            setIsCrmBannerDismissed(true);
        }, 14000);
        return () => clearTimeout(timer);
    }, [isCrmBannerDismissed, isPro]);

    const handleDismissCrmBanner = () => {
        setIsCrmBannerDismissed(true);
        sessionStorage.setItem('nilah_crm_banner_dismissed', 'true');
    };

    const setMainTab = (tab: MainTab) => {
        setSearchParams({ tab });
    };

    const inactiveClientsCount = useMemo(() => {
        return (clients || []).filter(c => (c.total_visitas || 0) > 0 && (c.dias_ausente || 0) >= 30).length;
    }, [clients]);

    useEffect(() => {
        const currentTab = MAIN_TABS.find(t => t.id === mainTab);
        if (!currentTab || (currentTab.featureKey && !hasSaaSFeature('crm', currentTab.featureKey))) {
            setMainTab('clients'); // fallback si no tiene acceso o no existe
        }
    }, [MAIN_TABS, mainTab, hasSaaSFeature]);

    // ---- Engagement state ----
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [showAdvancedStats, setShowAdvancedStats] = useState(false);
    const [showLoyaltyStats, setShowLoyaltyStats] = useState(false);

    // ---- Legacy Clients state ----
    const [searchTerm, setSearchTerm] = useState('');
    
    const activeClientTab = searchParams.get('clientTab') || 'Todos';
    const activeFacet = searchParams.get('facet') || 'todos';

    const setActiveClientTab = (tab: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('clientTab', tab);
            return newParams;
        });
    };

    const setActiveFacet = (facet: string) => {
        setSearchParams(prev => {
            const newParams = new URLSearchParams(prev);
            newParams.set('facet', facet);
            return newParams;
        });
    };

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [newClientCumpleanos, setNewClientCumpleanos] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [isClientCreated, setIsClientCreated] = useState(false);
    const [clientCreationError, setClientCreationError] = useState<string | null>(null);
    const [clientNotes, setClientNotes] = useState<Record<number, string>>({});
    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);

    // ============================
    // Optimized lookups
    // ============================
    const apptsByClientId = useMemo(() => {
        const map = new Map<number, any[]>();
        (appointments || []).forEach(a => {
            const id = a.cliente_id ?? a.client_id ?? a.cliente;
            if (id) {
                const numId = Number(id);
                if (!map.has(numId)) map.set(numId, []);
                map.get(numId)!.push(a);
            }
        });
        return map;
    }, [appointments]);

    // ============================
    // Filtered clients (Salud + Faceta rápida + Búsqueda)
    // ============================
    const filteredClients = useMemo(() => {
        let result = clients || [];
        
        // 1. Filtro por término de búsqueda (nombre o teléfono)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                (c.nombre && c.nombre.toLowerCase().includes(term)) || 
                (c.telefono && c.telefono.includes(term))
            );
        }

        // 2. Filtro Nivel 1: Salud del Ciclo de Vida (Recencia / Estado)
        const healthTab = HEALTH_TABS.find(t => t.id === activeClientTab);
        if (healthTab && (healthTab as any).filter) {
            result = result.filter((healthTab as any).filter);
        }

        // 3. Filtro Nivel 2: Faceta Rápida (Comportamiento / Valor / Eventos)
        const facet = QUICK_FACETS.find(f => f.id === activeFacet);
        if (facet && (facet as any).filter) {
            result = result.filter((c: Client) => {
                const rating = ratingAvgByClientId.get(c.id) ?? ratingAvgByClientId.get(String(c.id)) ?? null;
                return (facet as any).filter(c, rating);
            });
        }

        // Ordenamiento inteligente: Rescates prioritarios primero, luego LTV descendente
        result.sort((a, b) => {
            const aNeedsRescue = (a.dias_ausente || 0) >= 45 && !a.rescate_exitoso && (!a.bloqueado_hasta || new Date(a.bloqueado_hasta) <= new Date());
            const bNeedsRescue = (b.dias_ausente || 0) >= 45 && !b.rescate_exitoso && (!b.bloqueado_hasta || new Date(b.bloqueado_hasta) <= new Date());
            if (aNeedsRescue && !bNeedsRescue) return -1;
            if (!aNeedsRescue && bNeedsRescue) return 1;
            if ((b.ltv || 0) !== (a.ltv || 0)) return (b.ltv || 0) - (a.ltv || 0);
            return (a.nombre || '').localeCompare(b.nombre || '');
        });
        return result;
    }, [clients, searchTerm, activeClientTab, activeFacet, ratingAvgByClientId]);

    const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
    const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ============================
    // Engagement Logic
    // ============================
    const pendingReminders: PendingReminder[] = [
        ...(pendientesRetoque || []).map((p: PendingRetoque, idx: number) => ({
            id: `retoque-${p.citaId}-${idx}`, clientId: String(p.clienteId), clientName: p.nombre,
            clientPhone: p.telefono || '', serviceName: p.servicio, type: 'maintenance' as const,
            status: 'pending' as const, scheduledDate: new Date().toISOString().split('T')[0],
            tipoServicio: p.regla, diasPasados: p.diasPasados, mensaje: p.mensaje,
        })),
        ...(citasProximas || []).map((c: UpcomingCita, idx: number) => ({
            id: `cita-${c.citaId}-${idx}`, clientId: String(c.citaId), clientName: c.nombre,
            clientPhone: c.telefono || '', serviceName: c.servicio, type: 'confirmation' as const,
            status: (c.recordatorio24h || c.recordatorio3h) ? 'sent' as const : 'pending' as const,
            scheduledDate: c.fecha.split('T')[0], horasRestantes: c.horasRestantes,
        })),
    ];

    const calificaciones = engagementExtras?.calificaciones || [];
    const hasRealRatings = calificaciones.length > 0;
    const ratings = hasRealRatings ? calificaciones : MOCK_RATINGS;
    const statsReal = engagementExtras?.statsCalificaciones;

    // ── Métricas por cliente (rating promedio, canjes) ──
    const ratingAvgByClientId = useMemo(() => {
        const map = new Map<string | number, number>();
        const grouped = new Map<string | number, number[]>();
        calificaciones.forEach((r: any) => {
            const cId = r.clientId;
            if (cId == null || !r.hasScore) return;
            if (!grouped.has(cId)) grouped.set(cId, []);
            grouped.get(cId)!.push(r.score);
        });
        grouped.forEach((scores, cId) => {
            const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
            map.set(cId, Math.round(avg * 10) / 10);
        });
        return map;
    }, [calificaciones]);



    const engagementStats = {
        ...MOCK_ENGAGEMENT_STATS,
        pendingMaintenance: (pendientesRetoque || []).length,
        pendingConfirmations: (citasProximas || []).filter((c: UpcomingCita) => !c.recordatorio24h && !c.recordatorio3h).length,
        averageRating: statsReal?.promedio ?? MOCK_ENGAGEMENT_STATS.averageRating,
        ratingsThisMonth: statsReal?.esteMes ?? MOCK_ENGAGEMENT_STATS.ratingsThisMonth,
        commentsThisMonth: statsReal?.comentariosEsteMes ?? MOCK_ENGAGEMENT_STATS.commentsThisMonth,
        npsScore: statsReal?.npsScore ?? MOCK_ENGAGEMENT_STATS.npsScore,
        confirmationRate: engagementExtras?.tasaConfirmacion ? Math.round(engagementExtras.tasaConfirmacion) : MOCK_ENGAGEMENT_STATS.confirmationRate,
    };

    const handleSendReminder = useCallback(async (reminder: PendingReminder) => {
        setSendingId(reminder.id);
        try {
            const response = await engagement.sendReminder(
                Number(reminder.clientId), (reminder as any).tipoServicio || reminder.serviceName, (reminder as any).diasPasados || 0,
            );
            const result = Array.isArray(response) ? response[0] : response;
            if (result?.success) refresh(true);
        } catch (e) { console.error(e); }
        finally { setSendingId(null); }
    }, [refresh]);

    // ============================
    // Loyalty Logic
    // ============================
    const loyaltyRawClients: any[] = (raw as any)?.clientes || [];
    const loyaltyRawAppointments: any[] = (raw as any)?.citas || [];
    const loyaltyRawStaff: any[] = (raw as any)?.staff || [];
    const premiosData = ctxRewards || [];
    const canjesData = ctxRedemptions || [];
    const redemptionsByClientId = useMemo(() => {
        const map = new Map<string | number, number>();
        canjesData.forEach((c: any) => {
            const cId = c.cliente_id ?? c.client_id;
            if (cId == null) return;
            map.set(String(cId), (map.get(String(cId)) || 0) + 1);
        });
        return map;
    }, [canjesData]);
    const topClientes = loyalty?.topClientes || [];
    const leaderboard = transformClients(topClientes.map((c: any) => ({
        id: c.id, nombre: c.nombre, telefono: c.telefono, puntos: c.puntos,
        totalVisitas: c.total_visitas, categoria: c.categoria || 'Nuevo', ultimaVisita: c.ultima_visita || '',
    })));
    const rewards = transformPremios(premiosData);
    const redemptions = transformCanjes(canjesData, loyaltyRawClients, premiosData);
    
    // Support subtab state in URL
    const lTabStr = searchParams.get('loyaltyTab');
    const loyaltyTab: 'resumen' | 'premios' | 'inteligencia' = (lTabStr === 'resumen' || lTabStr === 'premios' || lTabStr === 'inteligencia') ? lTabStr : 'resumen';
    
    const setLoyaltyTab = (tab: 'resumen' | 'premios' | 'inteligencia') => {
        setSearchParams(prev => {
            const p = new URLSearchParams(prev);
            p.set('loyaltyTab', tab);
            return p;
        });
    };

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const puntosCategoriaData = useMemo(() => {
        if (!isStaffMode) return [];
        return ((raw as any)?.puntos_por_categoria || []).map((p: any) => ({
            cliente_id: p.cliente_id,
            cliente_nombre: loyaltyRawClients.find((c: any) => Number(c.id) === Number(p.cliente_id))?.nombre || `Cliente #${p.cliente_id}`,
            categoria_id: null, categoria_nombre: p.categoria, puntos: Number(p.puntos) || 0,
        })).filter((r: any) => r.puntos > 0);
    }, [isStaffMode, raw, loyaltyRawClients]);

    const totalPuntosCanjeados = canjesData.reduce((s: number, c: any) => s + (Number(c.puntos_usados) || 0), 0);
    const totalPuntosActivos = loyaltyRawClients.reduce((s: number, c: any) => s + (Number(c.puntos_acumulados) || 0), 0);
    const totalPuntosEmitidos = totalPuntosCanjeados + totalPuntosActivos;
    const tasaCanje = totalPuntosEmitidos > 0 ? Math.round((totalPuntosCanjeados / totalPuntosEmitidos) * 100) : 0;
    const clientesConPuntos = isStaffMode ? puntosCategoriaData.length : topClientes.filter((c: any) => c.puntos > 0).length;

    const loyaltyKpis = useMemo(() => {
        const totalPuntos = loyalty?.puntosTotales ?? (isStaffMode
            ? puntosCategoriaData.reduce((s: number, p: any) => s + (Number(p.puntos) || 0), 0) : 0);
        return {
            totalPuntos, clientesActivos: clientesConPuntos,
            canjesMes: loyalty?.canjesMes ?? redemptions.length, tasaCanje,
            promedioPorCliente: clientesConPuntos > 0 ? Math.round(totalPuntos / clientesConPuntos) : 0,
        };
    }, [loyalty, puntosCategoriaData, clientesConPuntos, redemptions, tasaCanje, isStaffMode]);

    const serviceCategories = useMemo((): CategoryData[] => {
        if (!isStaffMode) return [];
        const activeStaff = loyaltyRawStaff.filter((s: any) => s.activo !== false);
        if (activeStaff.length === 0) return [];
        const groups = new Map<string, any[]>();
        activeStaff.forEach((s: any) => {
            const catNames = (s.cat_staff || 'General').split(',').map((c: string) => c.trim());
            catNames.forEach((catName: string) => {
                const name = catName || 'General';
                if (!groups.has(name)) groups.set(name, []);
                // Evitar duplicados en el mismo grupo por si acaso
                if (!groups.get(name)!.some(existing => existing.id === s.id)) {
                    groups.get(name)!.push(s);
                }
            });
        });
        return Array.from(groups.entries()).map(([catName, members]) => {
            const catPointsRecords = puntosCategoriaData.filter((p: any) => p.categoria_nombre === catName);
            const totalPuntos = catPointsRecords.reduce((s: number, p: any) => s + (Number(p.puntos) || 0), 0);
            return {
                categoryId: catPointsRecords[0]?.categoria_id, categoryName: catName,
                emoji: '✨', totalPuntos: Math.round(totalPuntos),
                clientesActivos: catPointsRecords.length,
                staffMembers: members.map((m: any) => ({ id: m.id, nombre: m.nombre, especialidad: m.especialidad })),
            };
        }).sort((a, b) => b.totalPuntos - a.totalPuntos);
    }, [isStaffMode, loyaltyRawStaff, puntosCategoriaData]);

    const staffRewards = useMemo((): RewardLegacy[] => {
        if (!isStaffMode || !selectedCategory) return rewards;
        return rewards.filter(r => {
            const rCat = (r.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            const selCat = selectedCategory.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            return rCat === selCat;
        });
    }, [isStaffMode, selectedCategory, rewards]);

    const staffClientesCercaDePremio = useMemo(() => {
        if (!isStaffMode) return loyalty?.clientesCercaDePremio || [];
        const records = selectedCategory ? puntosCategoriaData.filter((p: any) => p.categoria_nombre === selectedCategory) : puntosCategoriaData;
        const catRewards = [...staffRewards].filter(r => r.isActive !== false).sort((a, b) => a.pointsCost - b.pointsCost);
        const result: any[] = [];
        records.forEach((p: any) => {
            const puntos = Number(p.puntos) || 0;
            if (puntos <= 0) return;
            const nextReward = catRewards.find(r => r.pointsCost > puntos);
            if (!nextReward) return;
            const faltantes = nextReward.pointsCost - puntos;
            if (faltantes > 0 && faltantes <= 50) {
                const matchingClient = loyaltyRawClients.find((c: any) => Number(c.id) === Number(p.cliente_id));
                result.push({
                    clienteId: Number(p.cliente_id),
                    nombre: matchingClient?.nombre || p.cliente_nombre || `Cliente ${p.cliente_id}`,
                    telefono: matchingClient?.telefono || '',
                    puntosActuales: puntos, proximoPremio: nextReward.name,
                    puntosNecesarios: nextReward.pointsCost, faltantes,
                });
            }
        });
        return result.sort((a, b) => a.faltantes - b.faltantes);
    }, [isStaffMode, selectedCategory, puntosCategoriaData, staffRewards, loyaltyRawClients, loyalty]);

    const getStaffLeaderboard = () => {
        if (!isStaffMode) return [];
        const records = selectedCategory ? puntosCategoriaData.filter((p: any) => p.categoria_nombre === selectedCategory) : puntosCategoriaData;
        const byClient = new Map<number, any>();
        records.forEach((p: any) => {
            const cId = Number(p.cliente_id);
            const existing = byClient.get(cId);
            if (!existing || Number(p.puntos) > Number(existing.puntos)) byClient.set(cId, p);
        });
        return Array.from(byClient.values()).map((p: any) => {
            const mc = loyaltyRawClients.find((c: any) => Number(c.id) === Number(p.cliente_id));
            return { id: Number(p.cliente_id), name: mc?.nombre || 'Cliente', phone: mc?.telefono || '-',
                points: Number(p.puntos) || 0, totalVisits: mc?.total_visitas || 0,
                category: mc?.categoria || 'Recurrente', lastVisit: mc?.ultima_visita || new Date().toISOString(), pointsThisMonth: 0 };
        }).sort((a, b) => b.points - a.points);
    };

    const currentLeaderboard = isStaffMode ? getStaffLeaderboard() : leaderboard;
    const currentRewards = isStaffMode ? staffRewards : rewards;
    const currentCercaDePremio = isStaffMode ? staffClientesCercaDePremio : (loyalty?.clientesCercaDePremio || []);

    // ============================
    // Handlers - Legacy
    // ============================
    const handleCreateClient = useCallback(async () => {
        const rawDigits = newClientPhone.replace(/\D/g, '');
        let sanitizedPhone = rawDigits;

        if (sanitizedPhone.length === 9 && sanitizedPhone.startsWith('9')) {
            sanitizedPhone = '51' + sanitizedPhone;
        }

        if (!newClientName.trim() || !sanitizedPhone || !sanitizedPhone.startsWith('51')) {
            setClientCreationError('El teléfono debe tener el prefijo 51 (ej. 51987654321).');
            return;
        }

        setClientCreationError(null);
        setIsClientCreated(false);
        setIsCreatingClient(true);
        try {
            await (crm.createClient as any)({ 
                nombre: newClientName.trim(), 
                telefono: sanitizedPhone,
                cumpleanos: newClientCumpleanos.trim() || null
            });

            setIsClientCreated(true);

            // Wait a moment to show success state before closing
            setTimeout(() => {
                setNewClientName(''); setNewClientPhone(''); setNewClientCumpleanos('');
                setIsClientCreated(false);
                setIsAddModalOpen(false);
                refresh(true);
            }, 1500);
        } catch (e: any) {
            console.error('Error creating client:', e);
            const errMsg = e?.message?.toLowerCase() || '';
            const errCode = e?.code || '';
            // Detect common duplicate/unique constraint errors
            if (errMsg.includes('duplicate') || errMsg.includes('unique') || errMsg.includes('ya existe') || errCode === '23505') {
                setClientCreationError('Este teléfono ya está registrado con otra clienta.');
            } else {
                setClientCreationError('Ocurrió un error al crear la clienta. Por favor intenta de nuevo.');
            }
        }
        finally { setIsCreatingClient(false); }
    }, [newClientName, newClientPhone, newClientCumpleanos, refresh]);

    // ============================
    // Handlers - Marketplace
    // ============================
    const [tuningIdea, setTuningIdea] = useState<any>(null);
    const [isTuningGenerating, setIsTuningGenerating] = useState(false);

    const handleLaunchFromMarketplace = useCallback((audience: SmartAudience, week: number = 1) => {
        setTuningIdea({
            id: `crm-${Date.now()}`,
            semana: week,
            titulo: `Campaña: ${audience.nombre}`,
            objetivo: 'Marketing Automático',
            segmento: audience.id,
            audience_id: audience.id,
            audience_nombre: audience.nombre,
            audience_descripcion: audience.descripcion,
            clientesObjetivo: audience.count,
        });
    }, []);

    // ── Matriz RFM & Inteligencia de Cartera ──
    const rfmAnalysis = useMemo(() => {
        const list = clients || [];
        const total = list.length;
        const totalRevenue = list.reduce((sum, c) => sum + (c.ltv || 0), 0);
        const avgTicket = total > 0 ? (list.reduce((sum, c) => sum + (c.ticket_promedio || 0), 0) / total) : 0;

        // 1. Champions / VIPs
        const champions = list.filter(c => (c.categoria || '').toUpperCase().includes('VIP') || (c.total_visitas || 0) >= 13 || (c.ltv || 0) >= 1000);
        const championsRevenue = champions.reduce((sum, c) => sum + (c.ltv || 0), 0);
        const championsPct = totalRevenue > 0 ? Math.round((championsRevenue / totalRevenue) * 100) : 0;

        // 2. Leales & Recurrentes
        const loyals = list.filter(c => ((c.total_visitas || 0) >= 4 && (c.total_visitas || 0) < 13) && (c.dias_ausente || 0) <= 60);
        const loyalsRevenue = loyals.reduce((sum, c) => sum + (c.ltv || 0), 0);

        // 3. Nuevas (1 Visita)
        const newClients = list.filter(c => (c.total_visitas || 0) === 1);

        // 4. En Riesgo (31 a 60 días sin venir)
        const atRisk = list.filter(c => (c.total_visitas || 0) > 0 && (c.dias_ausente || 0) > 30 && (c.dias_ausente || 0) <= 60);
        const atRiskRevenueEst = atRisk.reduce((sum, c) => sum + (c.ticket_promedio || avgTicket || 60), 0);

        // 5. Inactivas / Churn (+60 días)
        const inactives = list.filter(c => (c.total_visitas || 0) > 0 && (c.dias_ausente || 0) > 60);
        const inactivesRecoverableEst = Math.round(inactives.length * (avgTicket || 60) * 0.3);

        return {
            total,
            totalRevenue,
            avgTicket: Math.round(avgTicket),
            champions: { count: champions.length, revenue: championsRevenue, pct: championsPct },
            loyals: { count: loyals.length, revenue: loyalsRevenue },
            newClients: { count: newClients.length },
            atRisk: { count: atRisk.length, revenueEst: Math.round(atRiskRevenueEst) },
            inactives: { count: inactives.length, recoverableEst: inactivesRecoverableEst },
        };
    }, [clients]);

    const handleLaunchSegmentCampaign = useCallback((segmentKey: string, segmentTitle: string, targetCount: number) => {
        setTuningIdea({
            id: `rfm-${segmentKey}-${Date.now()}`,
            semana: 1,
            titulo: `Campaña ${segmentTitle}`,
            objetivo: 'Marketing Automático',
            segmento: segmentKey,
            audience_id: segmentKey,
            audience_nombre: segmentTitle,
            audience_descripcion: `Segmento RFM de Inteligencia de Negocios (${targetCount} clientas)`,
            clientesObjetivo: targetCount,
        });
    }, []);

    // ============================
    // Mock Helpers / Rescue
    // ============================
    const getTotalSpent = useCallback(() => selectedClient?.ltv || 0, [selectedClient]);

    const getNextAppointment = useCallback(() => {
        if (!selectedClient || !appointments) return null;
        const clientAppts = appointments.filter((a: any) =>
            (a.cliente_id === selectedClient.id || a.client_id === selectedClient.id) &&
            new Date(a.fecha || a.start_time) > new Date()
        );
        if (clientAppts.length === 0) return null;
        clientAppts.sort((a: any, b: any) => new Date(a.fecha || a.start_time).getTime() - new Date(b.fecha || b.start_time).getTime());
        const next = clientAppts[0] as any;
        return {
            id: next.id,
            servicio: next.servicio || next.service_name || 'Servicio Programado',
            fecha: next.fecha || next.start_time,
            estado: next.estado || next.status
        };
    }, [selectedClient, appointments]);

    const getClientHistory = useCallback(() => {
        if (!selectedClient) return [];
        const source = appointments || [];
        return source
            .filter((a: any) => a.cliente_id === selectedClient.id || a.client_id === selectedClient.id)
            .filter((a: any) => new Date(a.fecha || a.start_time) <= new Date())
            .map((a: any) => ({
                id: a.id,
                servicio: a.servicio || a.service_name || 'Servicio',
                fecha: a.fecha || a.start_time,
                estado: a.estado || a.status || 'Completada'
            }))
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 5); // Últimas 5
    }, [selectedClient, appointments]);

    const computeClientInsights = useCallback((client: Client) => {
        const appts = apptsByClientId.get(Number(client.id)) || [];
        const parseDate = (a: any) => {
            const d = new Date(a.fecha || a.start_time || a.date || '');
            return isNaN(d.getTime()) ? null : d;
        };
        const statusText = (a: any) => String(a.estado || a.status || '').toLowerCase();
        const isCompleted = (a: any) => statusText(a).includes('complet');
        const isNoShow = (a: any) => statusText(a).includes('no-show') || statusText(a).includes('no show');
        const isCanceled = (a: any) => statusText(a).includes('anul') || statusText(a).includes('cancel') || statusText(a).includes('reagend');

        const completed = appts.filter(isCompleted).map(a => ({ ...a, _date: parseDate(a) })).filter(a => a._date);
        completed.sort((a: any, b: any) => b._date.getTime() - a._date.getTime());
        const lastVisit = completed[0]?._date || null;
        const last3 = completed.slice(0, 3);
        const avgTicketRecent = last3.length > 0
            ? last3.reduce((s: number, a: any) => s + (parseFloat(String(a.precio || 0)) || 0), 0) / last3.length
            : null;

        let frequencyDays: number | null = null;
        if (completed.length >= 2) {
            const diffs = completed.slice(0, 6).map((a: any, idx: number) => {
                const next = completed[idx + 1];
                if (!next) return null;
                return (a._date.getTime() - next._date.getTime()) / (1000 * 60 * 60 * 24);
            }).filter((d: any) => d !== null);
            if (diffs.length > 0) frequencyDays = diffs.reduce((s: number, d: number) => s + d, 0) / diffs.length;
        }

        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 90);
        const last90 = appts.map(a => ({ ...a, _date: parseDate(a) })).filter(a => a._date && a._date >= cutoff && a._date <= now);
        const total90 = last90.filter(a => isCompleted(a) || isCanceled(a) || isNoShow(a)).length || 0;
        const cancel90 = last90.filter(a => isCanceled(a)).length;
        const noShow90 = last90.filter(a => isNoShow(a)).length;
        const cancelRate90 = total90 > 0 ? cancel90 / total90 : null;

        const countBy = (list: any[], keyFn: (a: any) => string) => {
            const map = new Map<string, number>();
            list.forEach(a => {
                const k = keyFn(a);
                if (!k) return;
                map.set(k, (map.get(k) || 0) + 1);
            });
            let best: string | null = null;
            let bestVal = 0;
            map.forEach((v, k) => { if (v > bestVal) { best = k; bestVal = v; } });
            return best;
        };

        const favoriteService = countBy(completed, (a: any) => a.servicio || '');
        const favoriteCategory = countBy(completed, (a: any) => a.categoria || '');
        const staffMap = new Map((staffList || []).map((s: any) => [String(s.id), s.nombre]));
        const favoriteStaffId = countBy(completed, (a: any) => String(a.staff_id || a.empleada_id || ''));
        const favoriteStaff = favoriteStaffId ? (staffMap.get(favoriteStaffId) || null) : null;

        const future = appts.map(a => ({ ...a, _date: parseDate(a) })).filter(a => a._date && a._date > now);
        future.sort((a: any, b: any) => a._date.getTime() - b._date.getTime());
        const nextVisit = future[0] ? {
            date: future[0]._date.toISOString(),
            service: future[0].servicio || null,
            staff: favoriteStaff || null,
        } : null;

        return {
            avgTicketRecent,
            frequencyDays,
            cancelRate90,
            noShow90,
            favoriteService,
            favoriteCategory,
            favoriteStaff,
            lastVisit: lastVisit ? lastVisit.toISOString() : null,
            nextVisit,
        };
    }, [apptsByClientId, staffList]);

    const [selectedInsights, setSelectedInsights] = useState<any>(null);

    useEffect(() => {
        if (!selectedClient) {
            setSelectedInsights(null);
            return;
        }
        // Calculamos los insights de forma asíncrona para no bloquear el hilo principal
        // y permitir que la animación del BottomSheet se inicie sin LAG.
        const timer = setTimeout(() => {
            const result = computeClientInsights(selectedClient);
            setSelectedInsights(result);
        }, 50); // Un pequeño delay para priorizar la animación de entrada
        
        return () => clearTimeout(timer);
    }, [selectedClient, computeClientInsights]);

    // Data memoized for ClientModal to prevent animation lag
    const selectedClientHistory = useMemo(() => {
        if (!selectedClient) return [];
        const appts = apptsByClientId.get(Number(selectedClient.id)) || [];
        return [...appts].sort((a, b) => {
            const d1 = new Date(a.fecha || a.start_time || '').getTime();
            const d2 = new Date(b.fecha || b.start_time || '').getTime();
            return d2 - d1;
        });
    }, [selectedClient, apptsByClientId]);

    const selectedClientNextAppointment = useMemo(() => {
        if (!selectedClient) return null;
        const now = new Date().getTime();
        const appts = apptsByClientId.get(Number(selectedClient.id)) || [];
        const future = appts
            .filter(a => new Date(a.fecha || a.start_time || '').getTime() > now)
            .sort((a, b) => new Date(a.fecha || a.start_time || '').getTime() - new Date(b.fecha || b.start_time || '').getTime());
        return future[0] || null;
    }, [selectedClient, apptsByClientId]);

    const selectedClientTotalSpent = useMemo(() => {
        if (!selectedClient) return 0;
        const appts = apptsByClientId.get(Number(selectedClient.id)) || [];
        return appts
            .filter(a => a.estado === 'Completada')
            .reduce((sum, a) => sum + (Number(a.precio_total || a.precio || 0)), 0);
    }, [selectedClient, apptsByClientId]);

    // ============================
    // Render
    // ============================
    const handleUpdateClient = useCallback(async (id: number, data: any) => {
        try {
            await crm.updateClient(id, data);
            refresh(true);
            if (selectedClient && selectedClient.id === id) {
                setSelectedClient(prev => prev ? { ...prev, ...data } : null);
            }
        } catch (e) {
            console.error('Error updating client:', e);
            throw e;
        }
    }, [refresh, selectedClient]);

    return (
        <div className="flex flex-col min-h-0 pb-24 animate-page-enter px-4 py-5 sm:p-0">
            {/* ── Header ── */}
            <div className="mb-4 flex shrink-0 items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                        <DatabaseZap size={18} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">Clientes</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(clients || []).length} clientas registradas
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => refresh(true)}
                        disabled={isLoading}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg"
                    >
                        <RefreshCw className={`h-4 w-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    {(isAdmin || isStaffMode || isStaff) && mainTab === 'clients' && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-xs font-bold text-white shadow-md shadow-indigo-500/20"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Nueva
                        </button>
                    )}
                </div>
            </div>

            {/* ── Main Tabs — Scrollable pill bar ── */}
            <div className="mb-4 flex shrink-0 gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                {MAIN_TABS.map(tab => {
                    const Icon = tab.icon;
                    const isActive = mainTab === tab.id;
                    const hasAccess = tabHasAccess(tab.featureKey);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => hasAccess && setMainTab(tab.id)}
                            title={!hasAccess ? '🔒 Disponible en Plan Pro' : undefined}
                            className={`flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 min-h-[44px] ${
                                !hasAccess
                                  ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600'
                                  : isActive
                                    ? 'text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                            style={isActive && hasAccess ? { background: `linear-gradient(135deg, ${tab.color}dd, ${tab.color}aa)`, boxShadow: `0 4px 14px ${tab.color}40` } : {}}
                        >
                            {hasAccess ? <Icon size={14} /> : <Lock size={14} />}
                            {tab.label}
                        </button>
                    );
                })}
            </div>


            {/* ==============================
           TAB: CLIENTES (Legacy)
          ============================== */}
            {mainTab === 'clients' && (
                <div className="flex flex-col gap-4">
                    {/* SMART TRIGGER: BANNER DE ACTIVACIÓN BASADO EN DATOS - Solo para cuentas Free / No-Pro */}
                    {!isPro && !isCrmBannerDismissed && (
                        <AnimatePresence>
                            {inactiveClientsCount >= 2 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                                    transition={{ duration: 0.25 }}
                                    className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs relative group"
                                >
                                    <div className="flex items-center gap-2.5 pr-6 sm:pr-0">
                                        <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-base shrink-0">💸</span>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white">
                                                Dinero dormido detectado: {inactiveClientsCount} clientas no vuelven hace +30 días
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                Hay aprox. S/ {inactiveClientsCount * 65} en servicios esperando. Despiértalas con un WhatsApp con oferta relámpago.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUpgradeModalContext('rescate_inactivas');
                                                setIsUpgradeModalOpen(true);
                                            }}
                                            className="flex-1 sm:flex-none shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95 text-center"
                                        >
                                            <Sparkles size={13} />
                                            <span>Despertar Clientas (PRO)</span>
                                            <ChevronRight size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDismissCrmBanner}
                                            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
                                            title="Cerrar aviso"
                                            aria-label="Cerrar aviso"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (clients || []).length >= 5 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: -6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                                    transition={{ duration: 0.25 }}
                                    className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-transparent border border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs relative group"
                                >
                                    <div className="flex items-center gap-2.5 pr-6 sm:pr-0">
                                        <span className="p-2 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 text-base shrink-0">📢</span>
                                        <div>
                                            <p className="text-xs font-black text-gray-900 dark:text-white">
                                                ¡Ya tienes {(clients || []).length} clientas en tu base de datos!
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                                Ahora puedes lanzarles una campaña por WhatsApp para llenar tus turnos de martes y miércoles.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setUpgradeModalContext('marketing_masivo');
                                                setIsUpgradeModalOpen(true);
                                            }}
                                            className="flex-1 sm:flex-none shrink-0 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer active:scale-95 text-center"
                                        >
                                            <Sparkles size={13} />
                                            <span>Lanzar Campaña PRO</span>
                                            <ChevronRight size={13} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDismissCrmBanner}
                                            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer shrink-0"
                                            title="Cerrar aviso"
                                            aria-label="Cerrar aviso"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    )}

                    {/* Metrics */}
                    {clients && clients.length > 0 && (
                        <ClientsMetrics clients={clients} appointments={appointments || []} />
                    )}

                    {/* Search + 2-Level Smart Filters */}
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-3.5 border border-gray-100 dark:border-dark-border/80 mb-1 shadow-sm flex flex-col gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                placeholder="Buscar por nombre o teléfono..."
                                className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg pl-10 pr-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[44px]"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setCurrentPage(1); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Nivel 1: Filtros de Salud del Ciclo de Vida (Recencia / Estado) */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5 px-0.5">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                    Salud de la Cartera
                                </span>
                                {(activeClientTab !== 'Todos' || activeFacet !== 'todos') && (
                                    <button
                                        onClick={() => {
                                            setActiveClientTab('Todos');
                                            setActiveFacet('todos');
                                            setCurrentPage(1);
                                        }}
                                        className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                {HEALTH_TABS.map(tab => {
                                    const isActive = activeClientTab === tab.id;
                                    const count = (tab as any).filter
                                        ? (clients || []).filter((tab as any).filter).length
                                        : (clients || []).length;

                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => { setActiveClientTab(tab.id); setCurrentPage(1); }}
                                            className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold whitespace-nowrap transition-all active:scale-95 min-h-[38px] border ${isActive
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                                                : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            <span>{tab.emoji}</span>
                                            <span>{tab.label}</span>
                                            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${isActive
                                                ? 'bg-white/20 text-white'
                                                : 'bg-gray-200/80 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                                                }`}>
                                                {count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nivel 2: Facetas Rápidas (Comportamiento, Valor, Eventos) */}
                        <div className="pt-2 border-t border-gray-100 dark:border-dark-border/60">
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
                                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 shrink-0 mr-1">
                                    Filtrar por:
                                </span>
                                {QUICK_FACETS.map(facet => {
                                    const isFacetActive = activeFacet === facet.id;
                                    return (
                                        <button
                                            key={facet.id}
                                            onClick={() => { setActiveFacet(facet.id); setCurrentPage(1); }}
                                            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${isFacetActive
                                                ? 'bg-purple-600 text-white shadow-xs font-bold'
                                                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-white/10'
                                                }`}
                                        >
                                            {facet.icon && <span>{facet.icon}</span>}
                                            <span>{facet.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && !clients.length && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                    )}

                    {/* Client list */}
                    {!isLoading && paginatedClients.length === 0 && (
                        <div className="flex flex-col items-center py-12 text-gray-400 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-dark-border p-6 text-center">
                            <Users className="h-10 w-10 mb-2 opacity-50 text-indigo-400" />
                            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No hay clientas con estos filtros</p>
                            <p className="text-xs text-gray-400 mt-1">Prueba seleccionando "Todas" o limpiando los filtros de búsqueda.</p>
                            <button
                                onClick={() => { setActiveClientTab('Todos'); setActiveFacet('todos'); setSearchTerm(''); }}
                                className="mt-3 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl hover:bg-indigo-100 transition-all"
                            >
                                Restablecer filtros
                            </button>
                        </div>
                    )}

                    <motion.div 
                        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: { staggerChildren: 0.05 }
                            }
                        }}
                    >
                        {paginatedClients.map(client => (
                            <motion.div
                                key={client.id}
                                variants={{
                                    hidden: { opacity: 0, y: 10 },
                                    visible: { opacity: 1, y: 0 }
                                }}
                            >
                                <ClientCard
                                    key={client.id}
                                    client={client}
                                    onClick={() => setSelectedClient(client)}
                                    ratingAvg={ratingAvgByClientId.get(client.id) ?? ratingAvgByClientId.get(String(client.id)) ?? null}
                                    totalRedemptions={redemptionsByClientId.get(String(client.id)) || 0}
                                />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                                className="rounded-lg border border-gray-200 dark:border-dark-border px-3 py-2 text-xs font-medium disabled:opacity-30 dark:text-gray-300"
                            >
                                ← Anterior
                            </button>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                                className="rounded-lg border border-gray-200 dark:border-dark-border px-3 py-2 text-xs font-medium disabled:opacity-30 dark:text-gray-300"
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ==============================
           TAB: SEGMENTOS (Matriz RFM & Salud de Cartera)
          ============================== */}
            {mainTab === 'segments' && (
                <div className="flex flex-col gap-5">
                    {/* Header de la Matriz RFM */}
                    <div className="bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent p-5 rounded-3xl border border-indigo-500/20 backdrop-blur-md">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 shrink-0">
                                    <Layers size={22} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                                        Matriz de Segmentación RFM
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Estructura de valor y salud de tu cartera en tiempo real
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/marketing')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all"
                            >
                                <Sparkles size={14} />
                                <span>Marketplace Marketing</span>
                                <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* KPI Bar de Cartera */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-indigo-500/20">
                            <div className="bg-white/60 dark:bg-white/5 p-3 rounded-2xl border border-white/20 dark:border-white/5">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Total Clientas</p>
                                <p className="text-xl font-black text-gray-900 dark:text-white">{rfmAnalysis.total}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-white/5 p-3 rounded-2xl border border-white/20 dark:border-white/5">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">LTV Total Acumulado</p>
                                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">S/ {rfmAnalysis.totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-white/5 p-3 rounded-2xl border border-white/20 dark:border-white/5">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Ticket Promedio</p>
                                <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">S/ {rfmAnalysis.avgTicket}</p>
                            </div>
                            <div className="bg-white/60 dark:bg-white/5 p-3 rounded-2xl border border-white/20 dark:border-white/5">
                                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Pareto VIP (% Ventas)</p>
                                <p className="text-xl font-black text-amber-500">{rfmAnalysis.champions.pct}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Pirámide de Segmentos RFM */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* 1. Champions & VIPs */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-amber-500/30 dark:border-amber-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/60 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                        👑 Champions & VIP
                                    </span>
                                    <span className="text-lg font-black text-amber-500">{rfmAnalysis.champions.count}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Clientas de Máximo Valor</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Aportan el <strong>{rfmAnalysis.champions.pct}% de los ingresos</strong> totales (S/ {rfmAnalysis.champions.revenue.toLocaleString()}). Son las embajadoras de tu marca.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-border/60">
                                <button
                                    onClick={() => {
                                        setMainTab('clients');
                                        setActiveClientTab('Todos');
                                        setActiveFacet('vip');
                                    }}
                                    className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all text-center"
                                >
                                    Ver en Lista ({rfmAnalysis.champions.count})
                                </button>
                                <button
                                    onClick={() => handleLaunchSegmentCampaign('vip', 'Exclusiva VIP', rfmAnalysis.champions.count)}
                                    className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    Campaña VIP
                                </button>
                            </div>
                        </div>

                        {/* 2. Leales & Recurrentes */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-indigo-500/30 dark:border-indigo-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/60 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                                        💎 Leales & Recurrentes
                                    </span>
                                    <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{rfmAnalysis.loyals.count}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Columna Vertebral</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Visitas constantes (4 a 12 citas). Generan <strong>S/ {rfmAnalysis.loyals.revenue.toLocaleString()}</strong> de flujo estable. Ideales para venta cruzada.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-border/60">
                                <button
                                    onClick={() => {
                                        setMainTab('clients');
                                        setActiveClientTab('Activos');
                                        setActiveFacet('todos');
                                    }}
                                    className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all text-center"
                                >
                                    Ver en Lista ({rfmAnalysis.loyals.count})
                                </button>
                                <button
                                    onClick={() => handleLaunchSegmentCampaign('leales', 'Upsell Leales', rfmAnalysis.loyals.count)}
                                    className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
                                >
                                    Promo Upsell
                                </button>
                            </div>
                        </div>

                        {/* 3. Nuevas (1 Sola Visita) */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-teal-500/30 dark:border-teal-500/20 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-teal-500/60 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center gap-1">
                                        🌱 Nuevas Oportunidades
                                    </span>
                                    <span className="text-lg font-black text-teal-600 dark:text-teal-400">{rfmAnalysis.newClients.count}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Segunda Cita Crítica</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Han venido 1 sola vez. Contactarlas a los 14-21 días multiplica por 2.4x la tasa de retorno a largo plazo.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-border/60">
                                <button
                                    onClick={() => {
                                        setMainTab('clients');
                                        setActiveClientTab('Nuevas');
                                        setActiveFacet('todos');
                                    }}
                                    className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all text-center"
                                >
                                    Ver en Lista ({rfmAnalysis.newClients.count})
                                </button>
                                <button
                                    onClick={() => handleLaunchSegmentCampaign('nuevas', 'Segunda Visita Bienvenida', rfmAnalysis.newClients.count)}
                                    className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm shadow-teal-600/20 active:scale-95 transition-all"
                                >
                                    Bienvenida 2x
                                </button>
                            </div>
                        </div>

                        {/* 4. En Riesgo de Abandono (31-60d) */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-amber-500/40 dark:border-amber-500/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/70 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                                        ⚠️ En Riesgo (31-60d)
                                    </span>
                                    <span className="text-lg font-black text-amber-600 dark:text-amber-400">{rfmAnalysis.atRisk.count}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Alerta de Pérdida</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Hay aprox. <strong>S/ {rfmAnalysis.atRisk.revenueEst.toLocaleString()}</strong> en riesgo de fuga si no se reactivan en los próximos 15 días.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-border/60">
                                <button
                                    onClick={() => {
                                        setMainTab('clients');
                                        setActiveClientTab('EnRiesgo');
                                        setActiveFacet('todos');
                                    }}
                                    className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all text-center"
                                >
                                    Ver en Lista ({rfmAnalysis.atRisk.count})
                                </button>
                                <button
                                    onClick={() => handleLaunchSegmentCampaign('en_riesgo', 'Reenganche Urgente', rfmAnalysis.atRisk.count)}
                                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-bold shadow-sm shadow-amber-500/20 active:scale-95 transition-all"
                                >
                                    Reenganche
                                </button>
                            </div>
                        </div>

                        {/* 5. Inactivas (+60d) */}
                        <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-rose-500/40 dark:border-rose-500/30 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/70 transition-all">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                        💤 Inactivas (+60d)
                                    </span>
                                    <span className="text-lg font-black text-rose-600 dark:text-rose-400">{rfmAnalysis.inactives.count}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Cartera Dormida</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                                    Oportunidad de recuperar aprox. <strong>S/ {rfmAnalysis.inactives.recoverableEst.toLocaleString()}</strong> mediante ofertas relámpago con descuento agresivo.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-dark-border/60">
                                <button
                                    onClick={() => {
                                        setMainTab('clients');
                                        setActiveClientTab('Inactivas');
                                        setActiveFacet('todos');
                                    }}
                                    className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all text-center"
                                >
                                    Ver en Lista ({rfmAnalysis.inactives.count})
                                </button>
                                <button
                                    onClick={() => handleLaunchSegmentCampaign('inactivas', 'Rescate Flash 30% OFF', rfmAnalysis.inactives.count)}
                                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white text-xs font-bold shadow-sm shadow-rose-500/20 active:scale-95 transition-all"
                                >
                                    Rescate Flash
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ==============================
           TAB: ENGAGEMENT
          ============================== */}
            {mainTab === 'engagement' && (
                <motion.div
                    key="engagement-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    {/* Simplified Header */}
                    <div className="flex items-center justify-between bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Conexión & Calidad</h2>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Todo bajo control - Avisos y satisfacción</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                            className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                        >
                            <BarChart3 size={14} />
                            {showAdvancedStats ? 'Ocultar Estadísticas' : 'Ver Análisis Avanzado'}
                            {showAdvancedStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>

                    {/* Advanced Stats Section (Collapsible) */}
                    <AnimatePresence>
                        {showAdvancedStats && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="overflow-hidden space-y-4"
                            >
                                <EngagementStatsCard stats={engagementStats} />
                                {engagementExtras && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                                        <ReminderStatsWidget stats={engagementExtras.reminderStats!} />
                                        <NPSTrendWidget trend={engagementExtras.statsCalificaciones?.npsTrend || []} />
                                        <ServiceRankingWidget rankings={engagementExtras.statsCalificaciones?.serviciosRanking || []} />
                                        <StaffRankingWidget rankings={engagementExtras.statsCalificaciones?.staffRanking || []} />
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ACTIONS GRID: Priority 1 */}
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
                        <div className="xl:col-span-3">
                            <PendingReminders 
                                reminders={pendingReminders} 
                                onSendReminder={handleSendReminder} 
                                itemsPerPage={5}
                            />
                        </div>
                        <div className="xl:col-span-2">
                             <RatingsList 
                                ratings={ratings} 
                                itemsPerPage={4} 
                            />
                        </div>
                    </div>

                    {/* Secondary Actions */}
                    <div className="bg-gray-50/50 dark:bg-black/20 p-4 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                         <MaintenanceRemindersWidget />
                    </div>
                </motion.div>
            )}


            {/* ==============================
           TAB: FIDELIZACIÓN
          ============================== */}
            {mainTab === 'loyalty' && (
                <motion.div
                    key="loyalty-tab"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                >
                    {/* Simplified Header */}
                    <div className="flex items-center justify-between bg-white/40 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl shadow-violet-500/20">
                                <Crown size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Fidelización</h2>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    {isStaffMode ? 'Modo Staff · Puntos por categoría' : 'Gana y premia la lealtad'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {!isStaffMode && (
                                <div className="hidden lg:flex items-center gap-1.5 rounded-xl bg-violet-500/10 px-3 py-1.5 border border-violet-500/20">
                                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">1 sol = 1 punto</span>
                                </div>
                            )}
                            <button 
                                onClick={() => {
                                    const next = !showLoyaltyStats;
                                    setShowLoyaltyStats(next);
                                    if (!next && loyaltyTab === 'inteligencia') {
                                        setLoyaltyTab('resumen');
                                    }
                                }}
                                className="flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 transition-all dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/20"
                            >
                                <BarChart3 size={14} />
                                {showLoyaltyStats ? 'Ocultar Estadísticas' : 'Ver Análisis Avanzado'}
                                {showLoyaltyStats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                        </div>
                    </div>

                    {/* Advanced Stats Section (Collapsible KPIs) */}
                    <AnimatePresence>
                        {showLoyaltyStats && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                className="overflow-hidden space-y-4"
                            >
                                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                                    <KPICard icon={Sparkles} label="Puntos Total" value={loyaltyKpis.totalPuntos.toLocaleString()} gradient="from-violet-500 to-purple-600" />
                                    <KPICard icon={Users} label="Con Puntos" value={loyaltyKpis.clientesActivos.toString()} gradient="from-blue-500 to-cyan-500" />
                                    <KPICard icon={Gift} label="Premios usados" value={loyaltyKpis.canjesMes.toString()} gradient="from-amber-500 to-orange-500" />
                                    <KPICard icon={Target} label="Usan los premios" value={`${tasaCanje}%`} gradient="from-emerald-500 to-green-500" subtitle={tasaCanje < 30 ? '⚠️ Poco' : tasaCanje < 60 ? '📊 Regular' : '🔥 Genial'} />
                                    <KPICard icon={TrendingUp} label="Puntos/Clienta" value={loyaltyKpis.promedioPorCliente.toString()} gradient="from-pink-500 to-rose-500" className="col-span-2 lg:col-span-1" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {isStaffMode && (
                        <StaffSelector categories={serviceCategories} selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
                    )}

                    {/* Loyalty sub-tabs - Filtered */}
                    <div className="flex gap-1 rounded-2xl bg-gray-100/80 dark:bg-white/5 p-1 border border-gray-200/50 dark:border-white/10 max-w-md mx-auto sm:mx-0">
                        {([
                            { id: 'resumen', label: 'Ranking', icon: BarChart3 }, 
                            { id: 'premios', label: 'Premios', icon: Gift }, 
                            { id: 'inteligencia', label: 'Estadísticas', icon: Brain }
                        ] as const)
                        .filter(tab => tab.id !== 'inteligencia' || showLoyaltyStats)
                        .map(tab => {
                            const isActive = loyaltyTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button key={tab.id} onClick={() => setLoyaltyTab(tab.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300 ${
                                        isActive ? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm border border-violet-200/50 dark:border-violet-500/20' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="">{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {loyaltyTab === 'resumen' && (
                        <div className="space-y-5">
                            <ClientesCercaDePremio clientes={currentCercaDePremio} maxItems={7} umbralPuntos={50} />
                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <PointsLeaderboard clients={currentLeaderboard} maxItems={7}
                                    staffFilter={isStaffMode && selectedCategory !== null ? 1 : undefined}
                                    staffCategoryName={isStaffMode ? (selectedCategory || undefined) : undefined} />
                                <RewardsList rewards={currentRewards} isStaffMode={isStaffMode}
                                    categoryId={isStaffMode ? serviceCategories.find(c => c.categoryName === selectedCategory)?.categoryId : undefined}
                                    leaderboard={currentLeaderboard} maxItems={5} />
                            </div>
                        </div>
                    )}
                    {loyaltyTab === 'premios' && (
                        <div className="space-y-5">
                            <RewardsList rewards={currentRewards} isStaffMode={isStaffMode} maxItems={20}
                                categoryId={isStaffMode ? serviceCategories.find(c => c.categoryName === selectedCategory)?.categoryId : undefined}
                                leaderboard={currentLeaderboard} />
                            <RedemptionHistory redemptions={redemptions} maxItems={15} isStaffMode={isStaffMode} />
                        </div>
                    )}
                    {loyaltyTab === 'inteligencia' && (
                        <LoyaltyIntelligence clients={loyaltyRawClients} premios={premiosData} canjes={canjesData}
                            rewards={rewards} redemptions={redemptions} isStaffMode={isStaffMode}
                            selectedCategory={selectedCategory} puntosCategoriaData={puntosCategoriaData}
                            serviceCategories={serviceCategories} />
                    )}
                </motion.div>
            )}

            {/* ── Client Modal ── */}
            {selectedClient && (
                <ClientModal
                    client={selectedClient}
                    isOpen={!!selectedClient}
                    onClose={() => setSelectedClient(null)}
                    onSaveNotes={note => setClientNotes(prev => ({ ...prev, [selectedClient.id]: note }))}
                    clientNotes={clientNotes[selectedClient.id] || ''}
                    insights={selectedInsights}
                    totalSpent={selectedClientTotalSpent}
                    nextAppointment={selectedClientNextAppointment}
                    history={selectedClientHistory}
                    isAdmin={isAdmin}
                    isStaff={isStaff}
                    isStaffMode={isStaffMode}
                    onUpdateClient={handleUpdateClient}
                    onDelete={() => { }}
                    ratingAvg={ratingAvgByClientId.get(selectedClient.id) ?? ratingAvgByClientId.get(String(selectedClient.id)) ?? null}
                    totalRedemptions={redemptionsByClientId.get(String(selectedClient.id)) || 0}
                />
            )}

            {/* ── Add Client Centered Premium Modal ── */}
            {isAddModalOpen && typeof document !== 'undefined' && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md animate-fade-in"
                        onClick={() => setIsAddModalOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem] bg-white dark:bg-dark-card shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border border-white/20 dark:border-white/10 animate-slide-up sm:animate-scale-in">
                        {/* Header Gradient & Close Button */}
                        <div className={`relative px-6 pt-6 pb-4 transition-colors duration-500 ${isClientCreated ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30' : 'bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20'}`}>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-gray-500 hover:bg-black/10 transition-colors"
                            >
                                ✕
                            </button>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-3 transition-colors duration-500 ${isClientCreated ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'}`}>
                                {isClientCreated ? <Sparkles className="h-6 w-6 animate-pulse" /> : <Plus className="h-6 w-6" />}
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {isClientCreated ? '¡Clienta Creada!' : 'Nueva Clienta'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {isClientCreated ? 'El perfil se guardó exitosamente.' : 'Ingresa los datos para registrarla'}
                            </p>
                        </div>

                        {/* Form Body - Hidden on success to show a clean state */}
                        {!isClientCreated && (
                            <div className="px-6 py-5 space-y-4 animate-fade-in">
                                {clientCreationError && (
                                    <div className="flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-shake">
                                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                        <p className="font-medium leading-tight">{clientCreationError}</p>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={newClientName}
                                        onChange={e => {
                                            setNewClientName(e.target.value);
                                            if (clientCreationError) setClientCreationError(null);
                                        }}
                                        placeholder="Ej. María González"
                                        className="w-full rounded-2xl border-0 bg-gray-50 dark:bg-dark-bg px-4 py-3.5 text-sm dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Teléfono (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        value={newClientPhone}
                                        onChange={e => {
                                            let val = e.target.value;
                                            // Si el usuario intenta borrar todo o deja sin 51 un número peruano de 9 dígitos
                                            const digits = val.replace(/\D/g, '');
                                            if (digits.length === 9 && digits.startsWith('9')) {
                                                val = '51' + digits;
                                            }
                                            setNewClientPhone(val);
                                            if (clientCreationError) setClientCreationError(null);
                                        }}
                                        onBlur={() => {
                                            const digits = newClientPhone.replace(/\D/g, '');
                                            if (digits.length === 9 && digits.startsWith('9')) {
                                                setNewClientPhone('51' + digits);
                                            }
                                        }}
                                        placeholder="Ej. 51987654321"
                                        className={`w-full rounded-2xl border-0 bg-gray-50 dark:bg-dark-bg px-4 py-3.5 text-sm dark:text-white focus:bg-white focus:ring-2 transition-all shadow-inner ${
                                            newClientPhone.length > 0 && !newClientPhone.replace(/\D/g, '').startsWith('51')
                                                ? 'ring-2 ring-red-500/50 focus:ring-red-500/50'
                                                : clientCreationError ? 'ring-2 ring-red-500/50 focus:ring-red-500/50' : 'focus:ring-indigo-500/50'
                                        }`}
                                    />
                                    {newClientPhone.length > 0 && newClientPhone.replace(/\D/g, '').startsWith('51') && !clientCreationError && (
                                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold px-1 flex items-center gap-1">
                                            ✓ Formato correcto con prefijo 51
                                        </p>
                                    )}
                                    {newClientPhone.length > 0 && !newClientPhone.replace(/\D/g, '').startsWith('51') && (
                                        <p className="text-[10px] text-red-500 font-bold px-1 animate-pulse">
                                            El número debe empezar con el prefijo 51
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cumpleaños (Opcional)</label>
                                    <input
                                        type="date"
                                        value={newClientCumpleanos}
                                        onChange={e => setNewClientCumpleanos(e.target.value)}
                                        className="w-full rounded-2xl border-0 bg-gray-50 dark:bg-dark-bg px-4 py-3.5 text-sm dark:text-white focus:bg-white focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Footer Action */}
                        <div className="p-6 pt-2 bg-gray-50/50 dark:bg-dark-bg/20">
                            <button
                                onClick={isClientCreated ? () => setIsAddModalOpen(false) : handleCreateClient}
                                disabled={
                                    isCreatingClient ||
                                    (!isClientCreated && (
                                        !newClientName.trim() ||
                                        !newClientPhone.trim() ||
                                        !newClientPhone.replace(/\D/g, '').startsWith('51')
                                    ))
                                }
                                className={`w-full rounded-2xl px-4 py-3.5 text-sm font-bold text-white transition-all shadow-md flex items-center justify-center gap-2 active:scale-[0.98] ${isClientCreated
                                    ? 'bg-green-500 hover:bg-green-600 hover:shadow-lg'
                                    : 'bg-gray-900 dark:bg-white dark:text-gray-900 disabled:opacity-50 hover:shadow-lg disabled:hover:shadow-md'
                                    }`}
                            >
                                {isCreatingClient ? <Loader2 className="h-5 w-5 animate-spin" /> : isClientCreated ? '¡Listo!' : 'Crear Perfil'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ── Campaign Tuning Modal (CRM Segmentation) ── */}
            <CampaignTuningModal
                isOpen={!!tuningIdea}
                onClose={() => setTuningIdea(null)}
                idea={tuningIdea}
                businessId="default"
                onLaunch={async (params) => {
                    // Minimal simulation for now
                    await new Promise(r => setTimeout(r, 1500));
                }}
                onGenerateAssets={async (params) => {
                    try {
                        setIsTuningGenerating(true);
                        const response = await campaignsApi.generateCampaignAssets(params);
                        return response;
                    } catch (err) {
                        console.error("Error generating assets", err);
                        throw err;
                    } finally {
                        setIsTuningGenerating(false);
                    }
                }}
            />

            {/* Modal de Upgrade PRO Contextual */}
            <ProUpgradeModal
                isOpen={isUpgradeModalOpen}
                onClose={() => setIsUpgradeModalOpen(false)}
                context={upgradeModalContext}
                customData={{ clientCount: (clients || []).length }}
            />
        </div>
    );
};

export default CRMPage;
