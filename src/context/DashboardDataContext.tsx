/**
 * DashboardDataContext
 * 
 * Contexto centralizado para todos los datos del Dashboard.
 * Carga datos crudos desde /dashboard/all y realiza cálculos en el cliente.
 * Implementa auto-refresh y caché en memoria.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import {
    User,
    UserFeatures,
    StaffPermissions,
    DEFAULT_STARTER_FEATURES,
    DEFAULT_PRO_FEATURES,
    DEFAULT_STAFF_PERMISSIONS,
    FinancialDataPoint
} from '../types';
import { auth as authApi, dashboard } from '../services/api';
import { supabase } from '@/services/supabase';
import { websocketService, WebSocketMessage, WebSocketStatus } from '../services/websocket';
import { handleWebSocketNotification, requestNotificationPermission } from '../services/pushNotifications';
import { DASHBOARD_REFRESH_INTERVAL } from '../constants';
import { useAuth } from './AuthContext';

// ===========================================
// Raw Data Types (Matching User JSON)
// ===========================================

export interface RawClient {
    id: number;
    nombre: string;
    telefono: string;
    primera_visita?: string;
    ultima_visita?: string;
    categoria?: string;
    puntos_acumulados?: number;
    total_visitas?: number;
    Estado?: string;
    estado_lifecycle?: string;
    LTV?: string | number | null;
    ticket_promedio?: string | number | null;
    fiabilidad_score?: number | null;
    rescatados_este_mes?: number;
    // Rescue campaign fields
    impacto_actual?: number;
    rescate_exitoso?: boolean;
    impacto_que_funciono?: number;
    fecha_rescate?: string;
    nivel_riesgo?: string;
    bloqueado_hasta?: string | null;
    ultimo_mensaje_enviado?: string | null;
    tipo_ultimo_mensaje?: string | null;
    notas?: string | null;
    dias_ausentes?: number;
    business_id?: string;
    // Bot pause fields
    bot_pausado?: boolean | null;
    bot_pausado_hasta?: string | null;
    bot_pausado_razon?: string | null;
    origen_captacion?: string | null;
    cumpleanos?: string | null;
}

export interface RawAppointment {
    id: number;
    fecha: string;
    cliente?: number; // Legacy ID del cliente
    cliente_id?: number; // ID del cliente desde Supabase
    nombre: string;
    servicio: string;
    precio: number;
    estado: string; // Pendiente, Completada, Cancelada, No-Show
    recordatorio_enviado?: boolean;
    encuesta_enviada?: boolean;
    calificacion?: string;
    feedback_cliente?: string;
    telefono?: string;
    notas?: string;
    hora_fin?: string;
    duracion_min?: number;
    categoria?: string; // manos, pies, rostro, pestanas, etc.
    staff_id?: number; // ID del staff asignado
}

export interface RawConfig {
    id: number | string;
    servicio: string;
    keywords: string;
    dias_min: number;
    dias_max: number;
    mensaje: string;
    emoji: string;
    activo: boolean;
}

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

export interface LoyaltyStats {
    totalActivePoints: number;
    totalRewards: number;
    redemptionsThisMonth: number;
    vipClients: number;
    pointsIssuedThisMonth: number;
    averagePointsPerClient: number;
}

export interface RawReward {
    id: number;
    nombre: string;
    costo_puntos: number;
    descripcion?: string;
    categoria?: string;
    activo: boolean;
    veces_canjeado?: number;
    limite_stock?: number | null;
}

export interface RawRedemption {
    id: number;
    cliente_id: number;
    premio_id: number;
    puntos_usados: number;
    estado: string;
    fecha_canje: string;
    fecha_entrega?: string | null;
    notas?: string;
    cliente_nombre?: string;
    premio_nombre?: string;
}

export interface RawStaff {
    id: number;
    nombre: string;
    email?: string;
    telefono?: string;
    rol: string;
    activo: boolean;
    especialidad?: string | null;
    cat_staff?: string | null;
    color?: string;
}

export interface RawService {
    id: number;
    categoria: string;
    nombre: string;
    precio?: number;
    duracion?: number;
    tags?: string;
    subcategoria?: string;
    zona?: string;
    prioridad?: string;
    imagen_url?: string;
    video_url?: string;
    business_id?: string;
    es_variable?: boolean;
}

export interface DashboardRawResponse {
    success: boolean;
    timestamp: string;
    data: {
        clientes: RawClient[];
        citas: RawAppointment[];
        configuracion: RawConfig[];
        staff?: RawStaff[]; // Nueva propiedad
        premios?: RawReward[];
        canjes?: RawRedemption[];
        // Optional legacy/extra fields
        stats?: any;
        forecast?: any;
        loyalty?: any;
        planesMarketing?: any[];
    };
}

// ===========================================
// Normalized Data Types (For UI Consumption)
// ===========================================

export interface Client {
    id: number;
    nombre: string;
    telefono: string;
    categoria: string;
    total_visitas: number;
    puntos: number;
    ltv: number;
    ticket_promedio: number;
    fiabilidad_score: number;
    estado: string; // Activo, Inactivo
    lifecycle: string; // Nuevo, Activo, En Riesgo, Perdido
    riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    dias_ausente: number;
    ultima_visita?: string | null;       // Fecha de última visita (YYYY-MM-DD o ISO)
    bloqueado_hasta?: string | null;     // Cooldown anti-spam del rescate
    impacto_actual?: number;             // Nivel de rescate enviado (0=ninguno, 1=soft, 2=incentivo, 3=urgent)
    rescate_exitoso?: boolean;           // Si el cliente volvió tras el rescate
    fecha_rescate?: string | null;       // Cuándo se hizo el rescate
    stats?: {                            // Campos extras calculados en runtime
        rescue_sent?: boolean;
        ultima_promo_enviada?: string | null;
        accion_recomendada?: string;
    };
    ultimo_mensaje?: {
        fecha: string;
        tipo: string;
    };
    notas?: string;
    // Bot pause state
    bot_pausado?: boolean;
    bot_pausado_hasta?: string | null;
    bot_pausado_razon?: string | null;
    origen_captacion?: string | null;
    cumpleanos?: string | null;
}

export interface EngagementConfig {
    id: string; // Normalized to string
    servicio: string;
    keywords: string;
    dias_min: number;
    dias_max: number;
    mensaje: string;
    emoji: string;
    activo: boolean;
}

export interface PendingRetoque {
    citaId: number; // Placeholder, uses client ID really
    clienteId: number;
    nombre: string;
    telefono: string;
    servicio: string;
    diasPasados: number;
    regla: string;
    mensaje: string;
    diasOptimosRestantes: number;
    tipoServicio: string;
}

export interface UpcomingCita {
    citaId: number;
    nombre: string;
    telefono: string;
    servicio: string;
    fecha: string;
    fechaFormateada: string;
    horaFormateada: string;
    horasRestantes: number;
    recordatorio24h: boolean;
    recordatorio3h: boolean;
}

// ===========================================
// Derived Metrics Types
// ===========================================

export interface FinancialMetrics {
    ingresosMes: number;
    ingresosHoy: number;
    ticketPromedio: number;
    proyeccionMes: number;
}

export interface OperationalMetrics {
    citasHoy: number;
    citasProximas: number; // 24-48h
    citasCompletadasMes: number;
    tasaCancelacion: number; // %
    totalClientes: number;
}

export interface EngagementMetrics {
    clientesActivos: number;
    clientesEnRiesgo: number;
    pendientesRetoqueCount: number;
    tasaRetencion: number;
    configServicesCount: number;
}

export interface LoyaltyMetrics {
    puntosTotales: number;
    canjesMes: number;
    topClientes: Client[];
    premiosPopulares: RawReward[];
    clientesCercaDePremio: any[];
    encuestasStats?: any;
    ultimasEncuestas?: any[];
}

export interface RetentionStats {
    total_en_riesgo: number;
    por_impacto: {
        impacto_1: number; // 45 days - Soft Touch
        impacto_2: number; // 60 days - Incentivo
        impacto_3: number; // 90 days - Ultima Llamada
    };
    rescatados_este_mes: number;
    perdidos_este_mes: number;
    tasa_exito: string; // percentage string like "75%"
}

export interface Rating {
    id: number;
    clientId?: number;
    clientName: string;
    clientPhone?: string;
    score: number; // 1-5
    hasScore?: boolean; // false when only feedback_cliente is present
    comment: string | null;
    serviceName: string;
    staffId?: number;
    staffName?: string;
    date: string;
}

export interface ServiceRanking {
    name: string;
    promedio: number;
    total: number;
}

export interface StaffRanking {
    name: string;
    promedio: number;
    total: number;
}

export interface NPSTrend {
    label: string;
    nps: number;
}

export interface ReminderStats {
    totalSent: number;
    confirmed: number;
    canceled: number;
    noShow: number;
    confirmationRate: number;
}

export interface EngagementExtras {
    calificaciones: Rating[];
    statsCalificaciones: {
        promedio: number;
        total: number;
        esteMes: number;
        comentariosEsteMes: number;
        npsScore: number;
        serviciosRanking: ServiceRanking[];
        staffRanking: StaffRanking[];
        npsTrend: NPSTrend[];
    };
    tasaConfirmacion: number;
    encuestasTotales: number;
    reminderStats: ReminderStats | null;
}

export interface DashboardContextState {
    // Raw Data
    raw: DashboardRawResponse['data'] | null;

    // Normalized Data
    clients: Client[];
    appointments: RawAppointment[];
    staff: any[];
    engagementConfig: EngagementConfig[];
    redemptions: RawRedemption[];
    rewards: RawReward[];

    // Derived Data
    financials: FinancialMetrics | null;
    operational: OperationalMetrics | null;
    engagement: EngagementMetrics | null;
    loyalty: LoyaltyMetrics | null;
    retentionStats: RetentionStats | null;
    engagementExtras: EngagementExtras | null;
    financialHistory: FinancialDataPoint[];

    // Business Config
    businessConfig: { moneda: string; idioma: string; } | null;

    // Services
    services: RawService[];

    // Legacy support (to avoid breaking existing widgets immediately)
    stats: any;
    forecast: any;
    planesMarketing: any[];

    // Lists for specific widgets
    pendientesRetoque: PendingRetoque[];
    citasProximas: UpcomingCita[];

    // Status
    isLoading: boolean;
    error: string | null;
    lastUpdate: Date | null;
    realtimeStatus: WebSocketStatus;

    // Actions
    refresh: (force?: boolean) => Promise<void>;
    
    // Meta Mensual
    metaMensual: number | null;
    setMetaMensual: (val: number) => Promise<void>;
}

const DashboardDataContext = createContext<DashboardContextState | null>(null);

// ===========================================
// Helper Functions
// ===========================================

const parseCurrency = (val: string | number | null | undefined): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const str = String(val).replace(/[^\d.-]/g, '');
    return parseFloat(str) || 0;
};

const normalizeConfig = (raw: RawConfig[]): EngagementConfig[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map(c => ({
        id: String(c.id),
        servicio: c.servicio || 'General',
        keywords: c.keywords || 'todos',
        dias_min: Number(c.dias_min) || 0,
        dias_max: Number(c.dias_max) || 0,
        mensaje: c.mensaje || '',
        emoji: c.emoji || '💅', // Fallback emoji
        activo: c.activo ?? true
    }));
};

const normalizeClients = (raw: RawClient[]): Client[] => {
    if (!Array.isArray(raw)) return [];
    const now = new Date();


    return raw.map(c => {
        // --- Calcular días ausente ---
        // Prioridad: campo dias_ausentes del backend → calcular desde ultima_visita
        let dias_ausente = c.dias_ausentes || 0;
        const ultimaVisitaRaw = (c as any).ultima_visita || null;
        if (dias_ausente === 0 && ultimaVisitaRaw && ultimaVisitaRaw !== '-') {
            try {
                const diffMs = now.getTime() - new Date(ultimaVisitaRaw).getTime();
                const calculated = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (calculated > 0) dias_ausente = calculated;
            } catch { /* ignorar fechas inválidas */ }
        }

        // --- Calcular nivel de riesgo ---
        let riesgo: Client['riesgo'] = 'Bajo';
        if (c.estado_lifecycle === 'Perdido' || dias_ausente >= 90) riesgo = 'Crítico';
        else if (c.estado_lifecycle === 'En Riesgo' || dias_ausente > 60) riesgo = 'Alto';
        else if (dias_ausente > 45) riesgo = 'Medio';

        // --- Cooldown: validar si sigue bloqueado ---
        let bloqueado_hasta: string | null = c.bloqueado_hasta || null;
        if (bloqueado_hasta) {
            const fechaBloqueo = new Date(bloqueado_hasta);
            if (fechaBloqueo <= now) bloqueado_hasta = null; // Ya expiró
        }

        return {
            id: c.id,
            nombre: c.nombre,
            telefono: c.telefono,
            categoria: c.categoria || 'Nuevo',
            total_visitas: c.total_visitas || 0,
            puntos: c.puntos_acumulados || 0,
            ltv: parseCurrency(c.LTV),
            ticket_promedio: parseCurrency(c.ticket_promedio),
            fiabilidad_score: c.fiabilidad_score ?? 100,
            estado: c.Estado || 'Activo',
            lifecycle: c.estado_lifecycle || 'Nuevo',
            riesgo,
            dias_ausente,
            ultima_visita: ultimaVisitaRaw,
            bloqueado_hasta,
            impacto_actual: c.impacto_actual || 0,
            rescate_exitoso: c.rescate_exitoso || false,
            fecha_rescate: c.fecha_rescate || null,
            ultimo_mensaje: c.ultimo_mensaje_enviado ? {
                fecha: c.ultimo_mensaje_enviado,
                tipo: c.tipo_ultimo_mensaje || 'unknown'
            } : undefined,
            notas: c.notas || undefined,
            // Bot pause state
            bot_pausado: c.bot_pausado ?? false,
            bot_pausado_hasta: c.bot_pausado_hasta || null,
            bot_pausado_razon: c.bot_pausado_razon || null,
            origen_captacion: c.origen_captacion || null,
            cumpleanos: c.cumpleanos || null
        };
    });
};

// ===========================================
// Provider Function
// ===========================================

export const DashboardDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, user, isLoading: authLoading, isDemoMode } = useAuth();
    const [raw, setRaw] = useState<DashboardRawResponse['data'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [realtimeStatus, setRealtimeStatus] = useState<WebSocketStatus>('disconnected');

    // Derived State
    const [clients, setClients] = useState<Client[]>([]);
    const [engagementConfig, setEngagementConfig] = useState<EngagementConfig[]>([]);
    const [businessConfig, setBusinessConfig] = useState<{ moneda: string; idioma: string; } | null>(null);
    const [services, setServices] = useState<RawService[]>([]);
    const [engagementExtras, setEngagementExtras] = useState<EngagementExtras | null>(null);
    const [financialHistory, setFinancialHistory] = useState<FinancialDataPoint[]>([]);
    const [derived, setDerived] = useState<{
        financials: FinancialMetrics | null;
        operational: OperationalMetrics | null;
        engagement: EngagementMetrics | null;
        loyalty: LoyaltyMetrics | null;
        retentionStats: RetentionStats | null;
        pendientesRetoque: PendingRetoque[];
        citasProximas: UpcomingCita[];
    }>({
        financials: null,
        operational: null,
        engagement: null,
        loyalty: null,
        retentionStats: null,
        pendientesRetoque: [],
        citasProximas: []
    });

    const [legacy, setLegacy] = useState({
        planesMarketing: [] as any[],
        stats: {},
        forecast: {}
    });

    const [metaMensual, setMetaMensualState] = useState<number | null>(null);

    const setMetaMensual = async (val: number) => {
        if (!user?.business_id) return;
        try {
            setMetaMensualState(val);
            const { error } = await supabase
                .from('negocios')
                .update({ meta_mensual_ingresos: val })
                .eq('id', user.business_id);
            if (error) throw error;
        } catch (err) {
            console.error('Error saving metaMensual:', err);
            throw err;
        }
    };

    // ===========================================
    // Calculation Logic
    // ===========================================

    const calculateMetrics = useCallback((
        data: DashboardRawResponse['data'],
        normalizedClients: Client[],
        normalizedConfig: EngagementConfig[],
        fetchedRetoques?: PendingRetoque[]
    ) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        // 1. Operational Metrics
        const activeAppointments = data.citas.filter(c =>
            c.estado.toLowerCase() !== 'cancelada' && c.estado.toLowerCase() !== 'no-show'
        );

        const citasHoy = activeAppointments.filter(c => c.fecha.startsWith(todayStr));

        // Citas próximas (24-48h)
        const citasProximasRaw = activeAppointments.filter(c => {
            const citaDate = new Date(c.fecha);
            const diffHours = (citaDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            return diffHours > 0 && diffHours <= 48;
        });

        // Map to UpcomingCita for widget
        const citasProximasWidget: UpcomingCita[] = citasProximasRaw.map(c => {
            const citaDate = new Date(c.fecha);
            const diffHours = Math.max(0, Math.round((citaDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
            return {
                citaId: c.id,
                nombre: c.nombre,
                telefono: c.telefono || '',
                servicio: c.servicio,
                fecha: c.fecha,
                fechaFormateada: citaDate.toLocaleDateString(),
                horaFormateada: citaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                horasRestantes: diffHours,
                recordatorio24h: c.recordatorio_enviado || false, // Mapping simplistic for now
                recordatorio3h: false
            };
        });

        const citasMes = activeAppointments.filter(c => new Date(c.fecha) >= startOfMonth);
        const citasCompletadasMes = citasMes.filter(c => c.estado.toLowerCase() === 'completada').length;
        const totalCitasMes = citasMes.length;

        const operational: OperationalMetrics = {
            citasHoy: citasHoy.length,
            citasProximas: citasProximasRaw.length,
            citasCompletadasMes,
            tasaCancelacion: totalCitasMes > 0
                ? (citasMes.filter(c => c.estado.toLowerCase() === 'cancelada').length / totalCitasMes) * 100
                : 0,
            totalClientes: data.clientes.length
        };

        // 2. Financial Metrics
        const ingresosMes = citasMes
            .filter(c => c.estado.toLowerCase() === 'completada')
            .reduce((sum, c) => sum + (Number(c.precio) || 0), 0);

        const ingresosHoy = citasHoy
            .filter(c => c.estado.toLowerCase() === 'completada')
            .reduce((sum, c) => sum + (Number(c.precio) || 0), 0);

        const financial: FinancialMetrics = {
            ingresosMes,
            ingresosHoy,
            ticketPromedio: citasCompletadasMes > 0 ? ingresosMes / citasCompletadasMes : 0,
            proyeccionMes: ingresosMes // Simple projection for now
        };

        // 3. Engagement Metrics
        // Usar los obtenidos directamente por la base de datos (RPC) si están disponibles,
        // de lo contrario (modo demo) calcular en local.
        const pendientesRetoque: PendingRetoque[] = [];

        if (fetchedRetoques !== undefined && fetchedRetoques.length > 0) {
            pendientesRetoque.push(...fetchedRetoques);
        }
        // Nota: sin fallback local para evitar datos incorrectos.
        // El widget solo muestra clientes si el RPC confirma que aplican para la regla.



        const engagement: EngagementMetrics = {
            clientesActivos: normalizedClients.filter(c => c.estado === 'Activo').length,
            clientesEnRiesgo: normalizedClients.filter(c => c.riesgo === 'Alto' || c.riesgo === 'Crítico').length,
            pendientesRetoqueCount: pendientesRetoque.length,
            tasaRetencion: 0, // TODO: Calcuate properly
            configServicesCount: normalizedConfig.filter(c => c.activo).length
        };

        // 4. Loyalty Metrics
        const clientesCercaDePremio: any[] = [];
        const premiosActivos = (data.premios || []).filter(p => p.activo !== false);

        // Sort rewards by cost for easier matching
        const sortedPremios = [...premiosActivos].sort((a, b) => a.costo_puntos - b.costo_puntos);

        normalizedClients.forEach(c => {
            if (c.puntos > 0) {
                // Find the NEXT reward they are close to
                const nextReward = sortedPremios.find(p => p.costo_puntos > c.puntos);
                if (nextReward) {
                    const faltantes = nextReward.costo_puntos - c.puntos;
                    // Arbitrary threshold: if less than X points away
                    if (faltantes <= 50 && faltantes > 0) {
                        clientesCercaDePremio.push({
                            clienteId: c.id,
                            nombre: c.nombre,
                            telefono: c.telefono,
                            puntosActuales: c.puntos,
                            proximoPremio: nextReward.nombre,
                            puntosNecesarios: nextReward.costo_puntos,
                            faltantes: faltantes
                        });
                    }
                }
            }
        });

        // Sort by closest to reward
        clientesCercaDePremio.sort((a, b) => a.faltantes - b.faltantes);

        const loyalty: LoyaltyMetrics = {
            puntosTotales: normalizedClients.reduce((sum, c) => sum + c.puntos, 0),
            canjesMes: (data.canjes || []).filter(c => new Date(c.fecha_canje) >= startOfMonth).length,
            topClientes: [...normalizedClients].sort((a, b) => b.puntos - a.puntos),
            premiosPopulares: data.premios || [],
            clientesCercaDePremio: data.stats?.clientesCercaDePremio || [],
            encuestasStats: data.stats?.encuestas || {
                enviadasHoy: 0,
                enviadasSemana: 0,
                respondidasSemana: 0,
                tasaRespuesta: 0,
                calificacionPromedio: 0,
                conFeedback: 0
            },
            ultimasEncuestas: data.stats?.ultimasEncuestas || []
        };

        // 5. Retention / Rescue Metrics
        const rawClients = data.clientes || [];
        const atRiskClients = rawClients.filter(c => (c.dias_ausentes || 0) > 45);
        const impacto1 = rawClients.filter(c => (c.impacto_actual || 0) === 1).length;
        const impacto2 = rawClients.filter(c => (c.impacto_actual || 0) === 2).length;
        const impacto3 = rawClients.filter(c => (c.impacto_actual || 0) >= 3).length;

        // Rescued this month: clients with rescate_exitoso=true and fecha_rescate in current month
        const rescatadosEsteMes = rawClients.filter(c => {
            if (!c.rescate_exitoso || !c.fecha_rescate) return false;
            const rescateDate = new Date(c.fecha_rescate);
            return rescateDate >= startOfMonth;
        }).length;

        // Lost this month: clients with impacto_actual >= 3 that were NOT rescued
        const perdidosEsteMes = rawClients.filter(c => {
            return (c.impacto_actual || 0) >= 3 && !c.rescate_exitoso;
        }).length;

        const totalRescateIntentos = rescatadosEsteMes + perdidosEsteMes;
        const tasaExito = totalRescateIntentos > 0
            ? `${Math.round((rescatadosEsteMes / totalRescateIntentos) * 100)}%`
            : '0%';

        const retentionStats: RetentionStats = {
            total_en_riesgo: atRiskClients.length,
            por_impacto: {
                impacto_1: impacto1,
                impacto_2: impacto2,
                impacto_3: impacto3
            },
            rescatados_este_mes: rescatadosEsteMes,
            perdidos_este_mes: perdidosEsteMes,
            tasa_exito: tasaExito
        };

        setDerived({
            financials: financial,
            operational,
            engagement,
            loyalty,
            retentionStats,
            pendientesRetoque,
            citasProximas: citasProximasWidget
        });

    }, []);

    // ===========================================
    // Load Data
    // ===========================================

    const loadData = useCallback(async (force = false) => {
        setIsLoading(true);
        setError(null);
        try {

            if (isDemoMode) {
                const { MOCK_CLIENTS, MOCK_APPOINTMENTS, MOCK_CAMPAIGNS, MOCK_FINANCIAL_HISTORY, MOCK_STAFF } = await import('../services/mockData');
                
                const rawData = {
                    clientes: MOCK_CLIENTS,
                    citas: MOCK_APPOINTMENTS,
                    planesMarketing: MOCK_CAMPAIGNS,
                    configuracion: [
                        { id: 1, servicio: 'Balayage', keywords: 'Balayage', dias_min: 60, dias_max: 90, mensaje: 'Hola {nombre}, es hora de tu retoque de Balayage!', emoji: '✨', activo: true }
                    ],
                    staff: MOCK_STAFF,
                    premios: []
                };

                setRaw(rawData as any);
                setLastUpdate(new Date());
                setFinancialHistory(MOCK_FINANCIAL_HISTORY as any);

                const normClients = normalizeClients(rawData.clientes as any);
                const normConfig = normalizeConfig(rawData.configuracion as any);
                setClients(normClients);
                setEngagementConfig(normConfig);
                
                // Engagement extras reset
                setEngagementExtras({
                    calificaciones: [],
                    statsCalificaciones: {
                        promedio: 4.8, total: 15, esteMes: 5,
                        comentariosEsteMes: 3, npsScore: 85, serviciosRanking: [], staffRanking: [], npsTrend: []
                    },
                    tasaConfirmacion: 90,
                    encuestasTotales: 0,
                    reminderStats: null
                });

                calculateMetrics(rawData as any, normClients, normConfig);
                
                setLegacy({
                    planesMarketing: MOCK_CAMPAIGNS,
                    stats: {},
                    forecast: {}
                });

                setIsLoading(false);
                return;
            }

            // In parallel: fetch from n8n dashboard AND fetch business config from Supabase
            const businessId = user?.business_id || localStorage.getItem('korat_business_id');

            if (!businessId) {
                if (authLoading) return null;
                console.warn('⚠️ DashboardContext: No business_id found');
                setIsLoading(false);
                return null;
            }

            // Cache config and services for 5 minutes (they rarely change)
            const CONFIG_CACHE_KEY = `korat_biz_config_${businessId}`;
            const SERVICES_CACHE_KEY = `korat_biz_services_${businessId}`;
            const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

            const getCached = (key: string) => {
                try {
                    const raw = sessionStorage.getItem(key);
                    if (!raw) return null;
                    const parsed = JSON.parse(raw);
                    if (Date.now() - parsed.ts > CACHE_TTL) return null;
                    return parsed.data;
                } catch { return null; }
            };
            const setCache = (key: string, data: any) => {
                try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
            };

            const fetchConfig = async () => {
                if (!businessId) return null;
                const cached = !force && getCached(CONFIG_CACHE_KEY);
                if (cached) return cached;
                const { data, error } = await supabase
                    .from('negocios')
                    .select('moneda, idioma')
                    .eq('id', businessId)
                    .maybeSingle();
                if (error) console.error('Error fetching business config:', error);
                if (data) setCache(CONFIG_CACHE_KEY, data);
                return data;
            };

            const fetchServices = async () => {
                if (!businessId) return [];
                const cached = !force && getCached(SERVICES_CACHE_KEY);
                if (cached) return cached;
                const { data, error } = await supabase
                    .from('servicios')
                    .select('*')
                    .eq('business_id', businessId);
                if (error) console.error('Error fetching services:', error);
                if (data) setCache(SERVICES_CACHE_KEY, data);
                return data || [];
            };

            const fetchNegocioMeta = async () => {
                if (!businessId) return null;
                const { data, error } = await supabase
                    .from('negocios')
                    .select('meta_mensual_ingresos')
                    .eq('id', businessId)
                    .maybeSingle();
                if (error) console.error('Error fetching meta mensual:', error);
                return data?.meta_mensual_ingresos || null;
            };

            const fetchEngagementConfig = async () => {
                if (!businessId) return [];
                // Leer directamente de configuracion_recordatorios (fuente de verdad)
                const { data, error } = await supabase
                    .from('configuracion_recordatorios')
                    .select('*')
                    .eq('business_id', businessId)
                    .eq('activo', true);

                if (error) {
                    console.error('Error fetching configuracion_recordatorios:', error);
                    return [];
                }

                if (data && data.length > 0) {
                    return data.map((d: any) => ({
                        id: String(d.id),
                        servicio: d.servicio || 'General',
                        keywords: d.keywords || '',
                        dias_min: Number(d.dias_min || 0),
                        dias_max: Number(d.dias_max || 9999),
                        mensaje: d.mensaje || 'Hola {nombre}, es momento de tu retoque.',
                        emoji: d.emoji || '💅',
                        activo: d.activo ?? true
                    }));
                }
                return [];
            };

            const [response, configData, servicesData, metaMensualData, engagementConfigData] = await Promise.all([
                dashboard.getAll(force),
                fetchConfig(),
                fetchServices(),
                fetchNegocioMeta(),
                fetchEngagementConfig()
            ]);

            if (metaMensualData !== undefined) {
                setMetaMensualState(metaMensualData);
            }

            // Engagement extras will be computed below

            if (configData) {
                setBusinessConfig({ moneda: configData.moneda || 'S/.', idioma: configData.idioma || 'es-PE' });
            }
            if (servicesData) {
                setServices(servicesData);
            }

            if (response && response.success !== false) {
                // n8n a veces devuelve directamente el objeto de datos en lugar de envolverlo en {success: true, data: {...}}
                // Si response.data existe lo usamos, sino usamos response completo (si es un array [] usamos un objeto vacío)
                const rawData = response.data ? response.data : (Array.isArray(response) ? {} : response);

                setRaw(rawData || {});
                setLastUpdate(new Date());

                // --- Calculate Ratings Data ---
                const getFirst = (row: any, keys: string[]) => {
                    for (const key of keys) {
                        const val = row?.[key];
                        if (val === null || val === undefined) continue;
                        if (typeof val === 'string' && val.trim().length === 0) continue;
                        return val;
                    }
                    return null;
                };

                const ratingsAll: Rating[] = (rawData.citas || [])
                    .filter((row: any) => {
                        const feedbackRaw = getFirst(row, ['feedback_cliente', 'feedback', 'comentario', 'comentarios', 'observacion', 'observaciones', 'review', 'resena']);
                        const scoreRaw = getFirst(row, ['calificacion', 'rating', 'score', 'calificacion_cliente', 'calificacion_servicio']);
                        const hasFeedback = (feedbackRaw || '').toString().trim().length > 0;
                        const scoreNum = Number(scoreRaw);
                        const scoreParsed = Number.isFinite(scoreNum) ? scoreNum : parseInt((scoreRaw || '').toString(), 10) || 0;
                        const hasScoreRaw = scoreRaw !== null && scoreRaw !== undefined && scoreRaw !== '' && scoreRaw !== '0' && scoreParsed > 0;
                        return hasFeedback || hasScoreRaw;
                    })
                    .map((row: any) => {
                        const scoreRaw = getFirst(row, ['calificacion', 'rating', 'score', 'calificacion_cliente', 'calificacion_servicio']);
                        const scoreNum = Number(scoreRaw);
                        const parsedScore = Number.isFinite(scoreNum) ? scoreNum : parseInt((scoreRaw || '').toString(), 10) || 0;
                        const feedbackRaw = getFirst(row, ['feedback_cliente', 'feedback', 'comentario', 'comentarios', 'observacion', 'observaciones', 'review', 'resena']);
                        const hasFeedback = (feedbackRaw || '').toString().trim().length > 0;
                        const hasScore = parsedScore >= 1 && parsedScore <= 5;
                        const fallbackScore = !hasScore && hasFeedback
                            ? ((Number(row.id) || 0) % 2 === 0 ? 4 : 3)
                            : 0;
                        const nameRaw = getFirst(row, ['nombre', 'nombre_cliente', 'cliente_nombre', 'client_name', 'cliente']);
                        const nameResolved = typeof nameRaw === 'string' && nameRaw.trim().length > 0 ? nameRaw : 'Cliente';
                        const phoneRaw = getFirst(row, ['telefono', 'telefono_cliente', 'client_phone']);
                        const serviceRaw = getFirst(row, ['servicio', 'servicio_nombre', 'service_name']);
                        const fechaRaw = getFirst(row, ['fecha', 'start_time', 'fecha_inicio']);
                        return {
                            id: row.id,
                            clientId: row.cliente_id || row.cliente,
                            clientName: nameResolved,
                            clientPhone: phoneRaw ? String(phoneRaw) : '',
                            score: hasScore ? parsedScore : fallbackScore,
                            hasScore: hasScore || fallbackScore > 0,
                            comment: feedbackRaw ? String(feedbackRaw) : null,
                            serviceName: serviceRaw ? String(serviceRaw) : '',
                            staffId: row.staff_id,
                            date: fechaRaw ? String(fechaRaw).split('T')[0] : new Date().toISOString().split('T')[0]
                        };
                    })
                    .sort((a: Rating, b: Rating) => new Date(b.date).getTime() - new Date(a.date).getTime());

                const ratingsScored = ratingsAll.filter((r: Rating) => r.hasScore);

                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const esteMes = ratingsScored.filter(r => new Date(r.date) >= startOfMonth);
                const comentariosEsteMes = ratingsAll.filter(r => new Date(r.date) >= startOfMonth && r.comment && r.comment.trim().length > 0).length;
                const promedio = ratingsScored.length > 0
                    ? Math.round((ratingsScored.reduce((s, r) => s + r.score, 0) / ratingsScored.length) * 10) / 10
                    : 0;

                const promotores = ratingsScored.filter(r => r.score >= 4).length;
                const detractores = ratingsScored.filter(r => r.score <= 2).length;
                const npsScore = ratingsScored.length > 0
                    ? Math.round(((promotores - detractores) / ratingsScored.length) * 100)
                    : 0;

                const serviceGroups: Record<string, { total: number, sum: number }> = {};
                ratingsScored.forEach(r => {
                    const s = r.serviceName || 'Otro';
                    if (!serviceGroups[s]) serviceGroups[s] = { total: 0, sum: 0 };
                    serviceGroups[s].total++;
                    serviceGroups[s].sum += r.score;
                });
                const serviciosRanking = Object.entries(serviceGroups)
                    .map(([name, data]) => ({ name, total: data.total, promedio: data.sum / data.total }))
                    .sort((a, b) => b.promedio - a.promedio)
                    .slice(0, 5);

                const staffMapLocal = new Map((rawData.staff || []).map((s: any) => [s.id, s.nombre]));
                const staffGroups: Record<number, { total: number, sum: number }> = {};
                ratingsScored.forEach(r => {
                    if (r.staffId) {
                        if (!staffGroups[r.staffId]) staffGroups[r.staffId] = { total: 0, sum: 0 };
                        staffGroups[r.staffId].total++;
                        staffGroups[r.staffId].sum += r.score;
                    }
                });
                const staffRanking = Object.entries(staffGroups)
                    .map(([idStr, data]) => {
                        const sId = parseInt(idStr);
                        return {
                            name: String(staffMapLocal.get(sId) || `Staff ${sId}`),
                            total: data.total,
                            promedio: data.sum / data.total
                        };
                    })
                    .sort((a, b) => b.promedio - a.promedio)
                    .slice(0, 5);

                const weeksData = [0, 1, 2, 3].map(weeksAgo => {
                    const end = new Date();
                    end.setDate(end.getDate() - (weeksAgo * 7));
                    const start = new Date(end);
                    start.setDate(start.getDate() - 7);
                    const weekRatings = ratingsScored.filter(r => {
                        const d = new Date(r.date);
                        return d >= start && d <= end;
                    });
                    if (weekRatings.length === 0) return { label: `Sem-${weeksAgo + 1}`, nps: 0 };
                    const p = weekRatings.filter(r => r.score >= 4).length;
                    const d = weekRatings.filter(r => r.score <= 2).length;
                    return { label: `Sem-${weeksAgo + 1}`, nps: Math.round(((p - d) / weekRatings.length) * 100) };
                }).reverse();

                let newEngagementExtras: EngagementExtras = {
                    calificaciones: ratingsAll,
                    statsCalificaciones: {
                        promedio, total: ratingsScored.length, esteMes: esteMes.length,
                        comentariosEsteMes, npsScore, serviciosRanking, staffRanking, npsTrend: weeksData
                    },
                    tasaConfirmacion: 0,
                    encuestasTotales: 0,
                    reminderStats: null
                };
                // --- End Calculate Ratings Data ---

                // Legacy Field Support
                setLegacy({
                    planesMarketing: rawData.planesMarketing || [],
                    stats: rawData.stats || {},
                    forecast: rawData.forecast || {}
                });

                // Normalize
                const normClients = normalizeClients(rawData.clientes || []);
                const normConfig = engagementConfigData && engagementConfigData.length > 0
                    ? engagementConfigData 
                    : normalizeConfig(rawData.configuracion || []);

                setClients(normClients);
                setEngagementConfig(normConfig);
                // Update engagement extras with reminder stats based on parsed rawData
                if (rawData.citas && Array.isArray(rawData.citas)) {
                    const upcomingFromCitas = rawData.citas.filter((c: any) => {
                        const d = new Date(c.fecha);
                        return d >= new Date() && d.getTime() <= new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
                    });
                    const totalSent = upcomingFromCitas.filter((c: any) => c.recordatorio_enviado).length;
                    const confirmed = upcomingFromCitas.filter((c: any) => c.estado === 'Confirmada').length;
                    const canceled = upcomingFromCitas.filter((c: any) => c.estado === 'Cancelada').length;
                    const noShow = upcomingFromCitas.filter((c: any) => c.estado === 'No-Show').length;
                    const confirmRate = totalSent > 0 ? (confirmed / totalSent) * 100 : (confirmed > 0 ? 100 : 0);

                    newEngagementExtras.reminderStats = {
                        totalSent, confirmed, canceled, noShow, confirmationRate: confirmRate
                    };
                    newEngagementExtras.tasaConfirmacion = confirmRate;
                }
                setEngagementExtras(newEngagementExtras);

                // --- Fetch actual pendientesRetoque from Supabase RPC ---
                let fetchedRetoques: PendingRetoque[] = [];
                if (businessId && normConfig && normConfig.length > 0) {
                    try {
                        const activeRules = normConfig.filter(r => r.activo);
                        const rpcPromises = activeRules.map(rule => 
                            supabase.rpc('get_retoques_audience', {
                                p_business_id: businessId,
                                p_keywords: rule.keywords || '',
                                p_dias_min: rule.dias_min,
                                p_dias_max: rule.dias_max
                            })
                        );
                        
                        const rpcResults = await Promise.all(rpcPromises);
                        
                        rpcResults.forEach((res, ruleIdx) => {
                            const rule = activeRules[ruleIdx];
                            if (res.error) {
                                console.error(`Error fetching audience for rule ${rule.servicio}:`, res.error);
                                return;
                            }
                            if (res.data && Array.isArray(res.data)) {
                                res.data.forEach((client: any) => {
                                    // ✅ FIX: Deduplicar por cita_id (no por clienteId)
                                    // Un cliente puede tener servicios distintos en reglas distintas,
                                    // y cada cita es única. Usar clienteId bloqueaba clientes válidos.
                                    const alreadyAdded = fetchedRetoques.some(p => p.citaId === client.cita_id);
                                    if (!alreadyAdded) {
                                        fetchedRetoques.push({
                                            citaId: client.cita_id,
                                            clienteId: client.cliente_id,
                                            nombre: client.cliente_nombre,
                                            telefono: client.telefono,
                                            // ✅ FIX: servicio_realizado es el servicio real del cliente
                                            // tipoServicio = nombre de la regla que lo capturó (para agrupar en el widget)
                                            servicio: client.servicio_realizado,
                                            tipoServicio: rule.servicio,
                                            diasPasados: client.dias_pasados,
                                            regla: rule.keywords,
                                            mensaje: rule.mensaje
                                                .replace('{nombre}', client.cliente_nombre || '')
                                                .replace('{dias}', String(client.dias_pasados || '')),
                                            // ✅ FIX: nunca negativo — si el cliente ya superó el días_max
                                            // el RPC ya no debería traerlo, pero protegemos igual
                                            diasOptimosRestantes: Math.max(0, rule.dias_max - client.dias_pasados)
                                        });
                                    }
                                });
                            }
                        });
                    } catch (rpcErr) {
                        console.error('Error in get_retoques_audience RPC calls:', rpcErr);
                    }
                }

                // Calculate Metrics
                calculateMetrics(rawData || {}, normClients, normConfig, fetchedRetoques);

                // ── Build financialHistory from citas ────────────────────────────
                const allCitas = rawData.citas || [];
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Build a map of revenue per day (past 14 days + next 7 days)
                const revenueByDay: Record<string, number> = {};
                allCitas.forEach((c: any) => {
                    if (c.estado === 'Cancelada' || c.estado === 'No-Show') return;
                    const dateStr = String(c.fecha || '').split('T')[0].split(' ')[0];
                    if (!dateStr) return;
                    const cDate = new Date(dateStr);
                    cDate.setHours(0, 0, 0, 0);
                    const diffDays = Math.round((cDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                    // Only include past 14 days
                    if (diffDays >= -14 && diffDays <= 0) {
                        revenueByDay[dateStr] = (revenueByDay[dateStr] || 0) + (Number(c.precio) || 0);
                    }
                });

                // Build 21-day window: 14 past + today + 6 future
                const financialPoints: FinancialDataPoint[] = [];
                let rollingAvg = 0;
                const pastValues: number[] = [];

                for (let i = -14; i <= 6; i++) {
                    const d = new Date(today);
                    d.setDate(d.getDate() + i);
                    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                    const dayLabel = d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
                    const isPast = i <= 0;
                    const revenue = isPast ? (revenueByDay[dateKey] || 0) : null;

                    if (isPast && revenue !== null) pastValues.push(revenue);
                    if (pastValues.length >= 3) {
                        rollingAvg = pastValues.slice(-5).reduce((a, b) => a + b, 0) / Math.min(pastValues.length, 5);
                    }

                    financialPoints.push({
                        day: dayLabel,
                        revenue: isPast ? revenue : null,
                        projection: Math.round(rollingAvg * (1 + (i > 0 ? i * 0.02 : 0))),
                        event: null,
                    });
                }

                setFinancialHistory(financialPoints);

                // console.log('✅ DashboardContext: Metrics recalculated.');
            } else {
                console.warn('⚠️ DashboardContext: Received failure response from API', response);
                throw new Error(response?.message || 'Invalid response structure');
            }

        } catch (err: any) {
            console.error('❌ DashboardContext Error:', err);
            setError(err.message || 'Error loading data');
        } finally {
            setIsLoading(false);
        }
    }, [calculateMetrics, authLoading, user?.business_id, isDemoMode]);

    const refresh = useCallback(async (force = false) => {
        await loadData(force);
    }, [loadData]);

    // Auto-refresh Interval
    useEffect(() => {
        if (!isAuthenticated || authLoading || !user?.business_id) return;

        loadData(); // Initial load

        const intervalId = setInterval(() => {
            console.log('⏰ DashboardContext: Auto-refresh triggered.');
            loadData(true); // Force refresh
        }, DASHBOARD_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [loadData, isAuthenticated, authLoading, user?.business_id, isDemoMode]);

    return (
        <DashboardDataContext.Provider value={{
            raw,
            clients,
            appointments: raw?.citas || [],
            staff: raw?.staff || [], // ✅ Expose staff from raw data
            services,
            engagementConfig,
            redemptions: raw?.canjes || [],
            rewards: raw?.premios || [],

            engagementExtras,
            financialHistory,
            financials: derived.financials,
            operational: derived.operational,
            engagement: derived.engagement,
            loyalty: derived.loyalty,
            retentionStats: derived.retentionStats,
            businessConfig,

            pendientesRetoque: derived.pendientesRetoque,
            citasProximas: derived.citasProximas,

            // Legacy
            stats: legacy.stats,
            forecast: legacy.forecast,
            planesMarketing: legacy.planesMarketing,
            
            // Meta
            metaMensual,
            setMetaMensual,

            isLoading,
            error,
            lastUpdate,
            realtimeStatus,
            refresh
        }}>
            {children}
        </DashboardDataContext.Provider>
    );
};

export const useDashboardData = () => {
    const context = useContext(DashboardDataContext);
    if (!context) {
        throw new Error('useDashboardData must be used within a DashboardDataProvider');
    }
    return context;
};
