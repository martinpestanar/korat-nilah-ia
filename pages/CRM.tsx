/**
 * CRM.tsx — Módulo CRM con Segmentación Inteligente
 * Reemplaza y extiende Clients.tsx.
 * Tab 1: Clientes (lista legacy) | Tab 2: Segmentos (NUEVO)
 * Mobile-first. UI premium. Nilah IA.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, RefreshCw, Loader2, Users, Layers,
    DatabaseZap, Filter, ChevronRight, Sparkles, Trash2, BrainCircuit, AlertCircle
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useDashboardData, Client } from '../context/DashboardDataContext';
import { auth as authApi, dashboard, crm } from '../services/api';
import { supabase } from '../context/DashboardDataContext';

// Legacy client components
import { ClientsMetrics } from '../components/Clients/ClientsMetrics';
import { ClientCard } from '../components/Clients/ClientCard';
import { ClientModal } from '../components/Clients/ClientModal';
import { BottomSheet } from '../components/UI/BottomSheet';

// CRM Segmentation components
import ServiceCategoryCard from '../components/CRM/ServiceCategoryCard';
import SegmentBuilder from '../components/CRM/SegmentBuilder';
import SegmentInsights from '../components/CRM/SegmentInsights';
import SegmentDetail from '../components/CRM/SegmentDetail';

// BI Intelligence components
import CadencePredictor from '../components/CRM/CadencePredictor';
import ValleyHoursWidget from '../components/CRM/ValleyHoursWidget';
import StaffAffinityWidget from '../components/CRM/StaffAffinityWidget';

// Segmentation logic
import {
    buildClientProfiles,
    applySegment,
    computeSegmentMetrics,
    generateAutoInsights,
    getCategoryById,
    generateDynamicCategories,
} from '../utils/segmentation';
// BI analysis engines
import {
    computeRFMCadences,
    computeValleyHours,
    computeStaffAffinity,
} from '../utils/bi';
import { Segment, SegmentOperator, SegmentFilter, AutoInsight } from '../types/crm';
import { SegmentClientProfile, ServiceCategory } from '../types/crm';

// ============================
// Legacy Client Tabs
// ============================
const CLIENT_TABS = [
    { id: 'Todos', label: 'Todos' },
    { id: 'Perdidos', label: '🔴 Perdidos', filter: (c: Client) => (c.dias_ausente || 0) >= 90 },
    { id: 'En Riesgo', label: '🟠 En Riesgo', filter: (c: Client) => { const d = c.dias_ausente || 0; return d >= 60 && d < 90; } },
    { id: 'Enfriándose', label: '🟡 Enfriándose', filter: (c: Client) => { const d = c.dias_ausente || 0; return d >= 30 && d < 60; } },
    { id: 'Activos', label: '🟢 Activos', filter: (c: Client) => (c.dias_ausente || 0) < 30 },
    { id: 'VIP', label: '⭐ VIP', filter: (c: Client) => c.categoria === 'VIP' },
];

// ============================
// Main Page
// ============================
const CRMPage: React.FC = () => {
    const { isAdmin } = useAuth();
    const { clients, appointments, services, staff: staffList, isLoading, refresh, error: loadError } = useDashboardData();
    const navigate = useNavigate();

    // Dynamic categories from servicios table
    const dynamicCategories = useMemo(() => generateDynamicCategories(services || []), [services]);

    // ---- Top-level tab ----
    const [mainTab, setMainTab] = useState<'clients' | 'segments' | 'intelligence'>('clients');

    // ---- Legacy Clients state ----
    const [searchTerm, setSearchTerm] = useState('');
    const [activeClientTab, setActiveClientTab] = useState('Todos');

    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [isClientCreated, setIsClientCreated] = useState(false);
    const [clientCreationError, setClientCreationError] = useState<string | null>(null);
    const [rescueStates, setRescueStates] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
    const [clientNotes, setClientNotes] = useState<Record<number, string>>({});
    const ITEMS_PER_PAGE = 20;
    const [currentPage, setCurrentPage] = useState(1);

    // ---- All historical appointments from Supabase (for accurate CRM segmentation) ----
    // The dashboard only loads recent appointments, but CRM needs the FULL history
    const [allAppointments, setAllAppointments] = React.useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = React.useState(false);

    React.useEffect(() => {
        const fetchAllCitas = async () => {
            const businessId = localStorage.getItem('korat_business_id');
            if (!businessId) return;
            setLoadingHistory(true);
            // Note: Citas table has `cliente_id` not `cliente`
            // We select it and then map it so buildClientProfiles finds it correctly
            const { data, error } = await supabase
                .from('Citas')
                .select('id, fecha, nombre, servicio, precio, estado, categoria, staff_id, cliente_id, nombre_empleada, empleada_id')
                .eq('business_id', businessId)
                .order('fecha', { ascending: false });
            if (error) {
                console.error('[CRM] Error fetching all citas from Supabase:', error);
            } else {
                // Map so that `cliente` field also exists for backwards compat with buildClientProfiles
                const mapped = (data || []).map((c: any) => ({
                    ...c,
                    cliente: c.cliente_id, // buildClientProfiles looks at `a.cliente || a.cliente_id`
                }));
                console.log(`[CRM] Loaded ${mapped.length} historical appointments for segmentation`);
                // Debug: how many have staff linkage
                const withStaff = mapped.filter((a: any) => a.staff_id || a.empleada_id || a.nombre_empleada);
                console.log(`[CRM] ${withStaff.length} appointments have staff linkage (staff_id/empleada_id/nombre_empleada)`);
                setAllAppointments(mapped);
            }
            setLoadingHistory(false);
        };
        fetchAllCitas();
    }, []);

    // ---- Segmentation state ----
    const [savedSegments, setSavedSegments] = React.useState<Segment[]>([]);


    React.useEffect(() => {
        const fetchSegments = async () => {
            const businessId = localStorage.getItem('korat_business_id');
            if (!businessId) return;
            const { data, error } = await supabase
                .from('crm_segments')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (error) {
                console.error('Error fetching segments:', error);
                return;
            }
            if (data) {
                const mapped = data.map(d => ({
                    id: d.id,
                    name: d.name,
                    categoryIds: d.category_ids,
                    operator: d.operator,
                    filters: d.filters,
                    clientCount: d.clientCount || 0,
                    createdAt: d.created_at
                }));
                setSavedSegments(mapped);
            }
        };
        fetchSegments();
    }, []);
    const [detailView, setDetailView] = useState<null | {
        title: string; subtitle?: string; emoji?: string; color?: string;
        profiles: SegmentClientProfile[];
    }>(null);

    // ============================
    // Build client profiles (memoized)
    // Uses allAppointments (full history) for accurate category profiling
    // Falls back to dashboard appointments if history not loaded yet
    // ============================
    const clientProfiles = useMemo(() =>
        buildClientProfiles(
            clients || [],
            (allAppointments.length > 0 ? allAppointments : appointments) || [],
            services || []
        ),
        [clients, allAppointments, appointments, services]
    );

    // ============================
    // Category counts
    // ============================
    const categoryCounts = useMemo(() => {
        const counts: Record<string, { total: number; atRisk: number }> = {};
        dynamicCategories.forEach(cat => {
            const matching = applySegment(clientProfiles, [cat.id], 'OR', {});
            const atRisk = matching.filter(p => p.dias_ausente >= 45 && p.dias_ausente < 90).length;
            counts[cat.id] = { total: matching.length, atRisk };
        });
        return counts;
    }, [clientProfiles, dynamicCategories]);

    // ============================
    // Auto-insights
    // ============================
    const autoInsights = useMemo(() =>
        generateAutoInsights(clientProfiles, dynamicCategories),
        [clientProfiles, dynamicCategories]
    );

    // ============================
    // BI Intelligence memos
    // ============================
    const rfmProfiles = useMemo(() => computeRFMCadences(clientProfiles), [clientProfiles]);

    const valleyData = useMemo(
        () => computeValleyHours(allAppointments.length > 0 ? allAppointments : appointments || []),
        [allAppointments, appointments]
    );

    const staffAffinityData = useMemo(
        () => computeStaffAffinity(
            allAppointments.length > 0 ? allAppointments : appointments || [],
            staffList,
            clientProfiles
        ),
        [allAppointments, appointments, staffList, clientProfiles]
    );

    // ============================
    // Filtered clients (legacy tab)
    // ============================
    const filteredClients = useMemo(() => {
        let result = clients || [];
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(c =>
                c.nombre.toLowerCase().includes(term) || (c.telefono && c.telefono.includes(term))
            );
        }
        const tab = CLIENT_TABS.find(t => t.id === activeClientTab);
        if (tab && tab.filter) result = result.filter(tab.filter);
        result.sort((a, b) => {
            const aNeedsRescue = (a.dias_ausente || 0) >= 45 && !a.rescate_exitoso && (!a.bloqueado_hasta || new Date(a.bloqueado_hasta) <= new Date());
            const bNeedsRescue = (b.dias_ausente || 0) >= 45 && !b.rescate_exitoso && (!b.bloqueado_hasta || new Date(b.bloqueado_hasta) <= new Date());
            if (aNeedsRescue && !bNeedsRescue) return -1;
            if (!aNeedsRescue && bNeedsRescue) return 1;
            if ((b.ltv || 0) !== (a.ltv || 0)) return (b.ltv || 0) - (a.ltv || 0);
            return a.nombre.localeCompare(b.nombre);
        });
        return result;
    }, [clients, searchTerm, activeClientTab]);

    const totalPages = Math.max(1, Math.ceil(filteredClients.length / ITEMS_PER_PAGE));
    const paginatedClients = filteredClients.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // ============================
    // Handlers - Legacy
    // ============================
    const handleCreateClient = useCallback(async () => {
        if (!newClientName.trim() || !newClientPhone.trim() || newClientPhone.includes('+')) return;
        setClientCreationError(null);
        setIsClientCreated(false);
        setIsCreatingClient(true);
        try {
            // Ensure no '+' symbol is sent to the backend
            const sanitizedPhone = newClientPhone.trim().replace(/\+/g, '');
            await crm.createClient({ nombre: newClientName.trim(), telefono: sanitizedPhone });

            setIsClientCreated(true);

            // Wait a moment to show success state before closing
            setTimeout(() => {
                setNewClientName(''); setNewClientPhone('');
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
    }, [newClientName, newClientPhone, refresh]);

    // ============================
    // Handlers - Segmentation
    // ============================
    const handleOpenCategory = useCallback((cat: ServiceCategory) => {
        const profiles = applySegment(clientProfiles, [cat.id], 'OR', {});
        const metrics = computeSegmentMetrics(profiles, appointments || []);
        setDetailView({ title: cat.label, subtitle: cat.description, emoji: cat.emoji, color: cat.color, profiles });
    }, [clientProfiles, appointments]);

    const handleInsightClick = useCallback((insight: AutoInsight) => {
        const profiles = applySegment(clientProfiles, insight.categoryIds, insight.operator, insight.filters);
        const metrics = computeSegmentMetrics(profiles, appointments || []);
        setDetailView({
            title: insight.title,
            subtitle: insight.description,
            emoji: insight.emoji,
            color: insight.color,
            profiles,
        });
    }, [clientProfiles, appointments]);

    const handleCreateSegment = useCallback(async (
        name: string, categoryIds: string[], operator: SegmentOperator, filters: SegmentFilter
    ) => {
        const profiles = applySegment(clientProfiles, categoryIds, operator, filters);
        const newSeg = {
            name,
            business_id: localStorage.getItem('korat_business_id'),
            category_ids: categoryIds,
            operator,
            filters,
        };

        const { data, error } = await supabase
            .from('crm_segments')
            .insert([newSeg])
            .select()
            .single();

        if (error) {
            console.error('Error saving segment', error);
            return;
        }

        const seg: Segment = {
            id: data.id,
            name: data.name,
            categoryIds: data.category_ids,
            operator: data.operator as SegmentOperator,
            filters: data.filters,
            clientCount: profiles.length,
            createdAt: data.created_at,
        };
        const updated = [seg, ...savedSegments].slice(0, 10);
        setSavedSegments(updated);
        // Open detail
        setDetailView({ title: name, emoji: '🎯', color: 'from-indigo-400 to-purple-500', profiles });
    }, [clientProfiles, savedSegments]);

    const handleDeleteSegment = useCallback(async (e: React.MouseEvent, segId: string) => {
        e.stopPropagation();
        setSavedSegments(prev => prev.filter(s => s.id !== segId));
        if (detailView?.title === savedSegments.find(s => s.id === segId)?.name) {
            setDetailView(null);
        }
        await supabase.from('crm_segments').delete().eq('id', segId);
    }, [savedSegments, detailView]);

    const handleSendCampaign = useCallback((profiles: SegmentClientProfile[]) => {
        const audience = {
            source: 'crm_segment',
            title: detailView?.title || 'Segmento CRM',
            clientIds: profiles.map(p => p.clientId),
            count: profiles.length,
        };
        sessionStorage.setItem('crm_target_audience', JSON.stringify(audience));
        navigate('/nilah/app/marketing');
    }, [navigate, detailView]);

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
        if (!selectedClient || !appointments) return [];
        return appointments
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

    const handleRescueClient = async (e: React.MouseEvent, client: Client) => {
        e.stopPropagation();
        setRescueStates(prev => ({ ...prev, [client.id]: 'sending' }));
        try {
            await crm.rescueClient(String(client.id));
            setRescueStates(prev => ({ ...prev, [client.id]: 'sent' }));
            setTimeout(() => refresh(true), 1500);
        } catch (error) {
            setRescueStates(prev => ({ ...prev, [client.id]: 'error' }));
            setTimeout(() => setRescueStates(prev => ({ ...prev, [client.id]: 'idle' })), 3000);
        }
    };

    // ============================
    // Render
    // ============================
    return (
        <div className="flex flex-col min-h-0 pb-24 animate-page-enter">
            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                        <DatabaseZap size={18} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-900 dark:text-white leading-none">CRM</h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(clients || []).length} clientas · {autoInsights.length} insights
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
                    {isAdmin && (
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

            {/* ── Main Tabs ── */}
            <div className="mb-4 flex rounded-xl bg-gray-100 dark:bg-dark-bg p-1 gap-1">
                <button
                    onClick={() => { setMainTab('clients'); setDetailView(null); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${mainTab === 'clients'
                        ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <Users className="h-3.5 w-3.5" />
                    Clientes
                </button>
                <button
                    onClick={() => { setMainTab('segments'); setDetailView(null); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${mainTab === 'segments'
                        ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <Layers className="h-3.5 w-3.5" />
                    Segmentos
                    {autoInsights.filter(i => i.priority === 'high').length > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                            {autoInsights.filter(i => i.priority === 'high').length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => { setMainTab('intelligence'); setDetailView(null); }}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all ${mainTab === 'intelligence'
                        ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    IA
                </button>
            </div>

            {/* ==============================
           TAB: CLIENTES (Legacy)
          ============================== */}
            {mainTab === 'clients' && (
                <div className="flex flex-col gap-4">
                    {/* Metrics */}
                    {clients && clients.length > 0 && (
                        <ClientsMetrics clients={clients} appointments={appointments || []} />
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            placeholder="Buscar por nombre o teléfono..."
                            className="w-full rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card pl-9 pr-3 py-2.5 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                        />
                    </div>

                    {/* Lifecycle tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        {CLIENT_TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveClientTab(tab.id); setCurrentPage(1); }}
                                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${activeClientTab === tab.id
                                    ? 'bg-indigo-500 text-white shadow-sm'
                                    : 'bg-gray-100 dark:bg-dark-bg text-gray-600 dark:text-gray-400'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Loading */}
                    {isLoading && !clients.length && (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                        </div>
                    )}

                    {/* Client list */}
                    {!isLoading && paginatedClients.length === 0 && (
                        <div className="flex flex-col items-center py-12 text-gray-400">
                            <Users className="h-10 w-10 mb-2 opacity-50" />
                            <p className="text-sm">No hay clientas en este filtro</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        {paginatedClients.map(client => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                onClick={() => setSelectedClient(client)}
                                rescueState={rescueStates[String(client.id)] || 'idle'}
                                onRescue={(e) => handleRescueClient(e, client)}
                            />
                        ))}
                    </div>

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
           TAB: SEGMENTOS
          ============================== */}
            {mainTab === 'segments' && (
                <div className="flex flex-col gap-5">

                    {/* Loading indicator for history */}
                    {loadingHistory && (
                        <div className="flex items-center gap-2 px-1">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                            <span className="text-xs text-gray-400 dark:text-gray-500">Cargando historial completo...</span>
                        </div>
                    )}

                    {/* Detail view */}
                    {detailView ? (
                        <SegmentDetail
                            title={detailView.title}
                            subtitle={detailView.subtitle}
                            emoji={detailView.emoji}
                            color={detailView.color}
                            profiles={detailView.profiles}
                            metrics={computeSegmentMetrics(detailView.profiles, appointments || [])}
                            categories={dynamicCategories}
                            onBack={() => setDetailView(null)}
                            onSendCampaign={handleSendCampaign}
                        />
                    ) : (
                        <>
                            {/* Auto-Insights */}
                            {autoInsights.length > 0 && (
                                <SegmentInsights
                                    insights={autoInsights}
                                    onInsightClick={handleInsightClick}
                                />
                            )}

                            {/* ── Popular Services ── */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/30">
                                        <Sparkles className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Populares</h2>
                                    <span className="text-[11px] text-gray-400 ml-auto font-medium">haz clic para ver clientes</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                                    {computeSegmentMetrics(Array.from(clientProfiles.values()), appointments || []).topServices.map(ts => (
                                        <button
                                            key={ts.servicio}
                                            onClick={() => {
                                                const profiles = applySegment(clientProfiles, [], 'OR', { serviciosEspecificos: [ts.servicio] });
                                                setDetailView({
                                                    title: ts.servicio,
                                                    subtitle: `Clientas que han tomado este servicio`,
                                                    emoji: '🔥',
                                                    color: 'from-amber-400 to-orange-500',
                                                    profiles
                                                });
                                            }}
                                            className="flex-shrink-0 flex items-center gap-2 rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border px-3.5 py-2.5 active:scale-95 transition-transform"
                                            style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
                                        >
                                            <span className="text-sm font-bold text-gray-800 dark:text-white">{ts.servicio}</span>
                                            <span className="flex items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-400">
                                                {ts.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── By Category ── */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm shadow-indigo-500/30">
                                        <Layers className="h-3.5 w-3.5 text-white" />
                                    </div>
                                    <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Por Categoría</h2>
                                    <span className="ml-auto text-[11px] text-gray-400 font-medium">{(clients || []).length} clientas total</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {dynamicCategories.length === 0 ? (
                                        <div className="col-span-2 rounded-2xl border border-dashed border-gray-200 dark:border-dark-border p-8 text-center">
                                            <p className="text-sm text-gray-400">No se encontraron categorías.<br />Revisa tu tabla de servicios en Supabase.</p>
                                        </div>
                                    ) : dynamicCategories.map(cat => {
                                        const counts = categoryCounts[cat.id] || { total: 0, atRisk: 0 };
                                        return (
                                            <ServiceCategoryCard
                                                key={cat.id}
                                                category={cat}
                                                clientCount={counts.total}
                                                totalClients={(clients || []).length}
                                                atRiskCount={counts.atRisk}
                                                onClick={() => handleOpenCategory(cat)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Segment Builder */}
                            <SegmentBuilder
                                profiles={clientProfiles}
                                categories={dynamicCategories}
                                services={services || []}
                                onCreateSegment={handleCreateSegment}
                            />

                            {/* Saved segments */}
                            {savedSegments.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-sm shadow-teal-500/30">
                                            <Filter className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <h2 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">Segmentos Guardados</h2>
                                        <span className="ml-auto text-[11px] text-gray-400 font-medium">{savedSegments.length} guardados</span>
                                    </div>
                                    <div className="space-y-2">
                                        {savedSegments.map(seg => {
                                            const cats = seg.categoryIds.map(id => getCategoryById(id, dynamicCategories)).filter(Boolean);
                                            return (
                                                <div
                                                    key={seg.id}
                                                    className="w-full flex items-center gap-3 rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card p-3.5 cursor-pointer active:scale-[0.98] transition-transform"
                                                    style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
                                                    onClick={() => {
                                                        const profiles = applySegment(clientProfiles, seg.categoryIds, seg.operator, seg.filters);
                                                        setDetailView({ title: seg.name, emoji: cats[0]?.emoji || '🎯', color: cats[0]?.color || 'from-indigo-400 to-purple-500', profiles });
                                                    }}
                                                >
                                                    {/* Emoji stack */}
                                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-50 dark:bg-dark-bg text-lg border border-gray-100 dark:border-dark-border">
                                                        {cats.slice(0, 2).map(c => c?.emoji).join('') || '🎯'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{seg.name}</p>
                                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                                                            {applySegment(clientProfiles, seg.categoryIds, seg.operator, seg.filters).length} clientas · {seg.operator === 'AND' ? 'Tienen todos los servicios' : 'Tienen algún servicio'}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                                                    <button
                                                        onClick={(e) => handleDeleteSegment(e, seg.id)}
                                                        className="flex-shrink-0 rounded-xl p-2 text-gray-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ==============================
           TAB: INTELIGENCIA BI
          ============================== */}
            {mainTab === 'intelligence' && (
                <div className="flex flex-col gap-5">
                    {/* Hero intro card */}
                    <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-5 relative overflow-hidden"
                        style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.25)' }}
                    >
                        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" aria-hidden />
                        <div className="absolute -bottom-4 -left-4 h-20 w-20 rounded-full bg-white/10 blur-xl" aria-hidden />
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                                <BrainCircuit className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-white leading-tight tracking-tight">Inteligencia BI</h2>
                                <p className="text-[11px] text-white/75">3 análisis avanzados para tu salón</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { label: 'Predictor', emoji: '⏰', desc: 'Ritmo personal' },
                                { label: 'Horas Valle', emoji: '📊', desc: 'Horarios lentos' },
                                { label: 'Equipo', emoji: '👥', desc: 'Riesgo de fuga' },
                            ].map(item => (
                                <div key={item.label} className="rounded-2xl bg-white/15 backdrop-blur-sm px-2 py-2.5 text-center">
                                    <span className="text-xl block leading-none mb-1">{item.emoji}</span>
                                    <p className="text-[10px] font-black text-white leading-tight">{item.label}</p>
                                    <p className="text-[9px] text-white/65 mt-0.5">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Widget 1: Cadence Predictor */}
                    <CadencePredictor profiles={rfmProfiles} />

                    {/* Widget 2: Valley Hours */}
                    <ValleyHoursWidget
                        slots={valleyData.slots}
                        valleyDays={valleyData.valleyDays}
                        peakDays={valleyData.peakDays}
                        onCreateCampaign={(dayLabel) => {
                            // Navigate to marketing with a pre-filled target
                            sessionStorage.setItem('crm_target_audience', JSON.stringify({
                                source: 'valley_hours',
                                title: `Campaña día ${dayLabel}`,
                                clientIds: Array.from(clientProfiles.keys()),
                                count: clientProfiles.size,
                            }));
                            navigate('/nilah/app/marketing');
                        }}
                    />

                    {/* Widget 3: Staff Affinity */}
                    <StaffAffinityWidget results={staffAffinityData} />
                </div>
            )}

            {/* ── Client Modal ── */}
            {selectedClient && (
                <ClientModal
                    client={selectedClient}
                    isOpen={!!selectedClient}
                    onClose={() => setSelectedClient(null)}
                    onRescue={(e) => handleRescueClient(e, selectedClient)}
                    rescueState={rescueStates[String(selectedClient.id)] || 'idle'}
                    onSaveNotes={note => setClientNotes(prev => ({ ...prev, [selectedClient.id]: note }))}
                    clientNotes={clientNotes[selectedClient.id] || ''}
                    getTotalSpent={getTotalSpent}
                    getNextAppointment={getNextAppointment}
                    getClientHistory={getClientHistory}
                    isAdmin={isAdmin}
                    onDelete={() => { }}
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
                                            setNewClientPhone(e.target.value);
                                            if (clientCreationError) setClientCreationError(null);
                                        }}
                                        placeholder="Ej. 51987654321"
                                        className={`w-full rounded-2xl border-0 bg-gray-50 dark:bg-dark-bg px-4 py-3.5 text-sm dark:text-white focus:bg-white focus:ring-2 transition-all shadow-inner ${newClientPhone.includes('+') ? 'ring-2 ring-red-500/50 focus:ring-red-500/50' : clientCreationError ? 'ring-2 ring-red-500/50 focus:ring-red-500/50' : 'focus:ring-indigo-500/50'}`}
                                    />
                                    {newClientPhone.length > 0 && !newClientPhone.includes('+') && !clientCreationError && (
                                        <p className="text-[10px] text-gray-400 px-1 opacity-70">Número guardado sin el símbolo +</p>
                                    )}
                                    {newClientPhone.includes('+') && (
                                        <p className="text-[10px] text-red-500 font-bold px-1 animate-pulse">Símbolo + no permitido</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer Action */}
                        <div className="p-6 pt-2 bg-gray-50/50 dark:bg-dark-bg/20">
                            <button
                                onClick={isClientCreated ? () => setIsAddModalOpen(false) : handleCreateClient}
                                disabled={isCreatingClient || (!isClientCreated && (!newClientName.trim() || !newClientPhone.trim() || newClientPhone.includes('+')))}
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
        </div>
    );
};

export default CRMPage;
