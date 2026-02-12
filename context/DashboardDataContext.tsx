/**
 * DashboardDataContext
 * 
 * Contexto centralizado para todos los datos del Dashboard.
 * Carga datos crudos desde /dashboard/all y realiza cálculos en el cliente.
 * Implementa auto-refresh y caché en memoria.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { dashboard } from '../services/api';
import { websocketService, WebSocketMessage, WebSocketStatus } from '../services/websocket';
import { handleWebSocketNotification, requestNotificationPermission } from '../services/pushNotifications';
import { DASHBOARD_REFRESH_INTERVAL } from '../constants';

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
}

export interface RawAppointment {
    id: number;
    fecha: string;
    cliente?: number; // ID del cliente
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
    estado: string; // Activo, Inactivo
    lifecycle: string; // Nuevo, Activo, En Riesgo, Perdido
    riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    dias_ausente: number;
    ultimo_mensaje?: {
        fecha: string;
        tipo: string;
    };
    notas?: string;
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

export interface DashboardContextState {
    // Raw Data
    raw: DashboardRawResponse['data'] | null;

    // Normalized Data
    clients: Client[];
    appointments: RawAppointment[];
    engagementConfig: EngagementConfig[];
    redemptions: RawRedemption[];
    rewards: RawReward[];

    // Derived Data
    financials: FinancialMetrics | null;
    operational: OperationalMetrics | null;
    engagement: EngagementMetrics | null;
    loyalty: LoyaltyMetrics | null;
    retentionStats: RetentionStats | null;

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
    return raw.map(c => {
        let riesgo: Client['riesgo'] = 'Bajo';
        // Lógica simple de riesgo basada en lifecycle o dias_ausentes
        if (c.estado_lifecycle === 'Perdido' || (c.dias_ausentes || 0) > 90) riesgo = 'Crítico';
        else if (c.estado_lifecycle === 'En Riesgo' || (c.dias_ausentes || 0) > 60) riesgo = 'Alto';
        else if ((c.dias_ausentes || 0) > 45) riesgo = 'Medio';

        return {
            id: c.id,
            nombre: c.nombre,
            telefono: c.telefono,
            categoria: c.categoria || 'Nuevo',
            total_visitas: c.total_visitas || 0,
            puntos: c.puntos_acumulados || 0,
            ltv: parseCurrency(c.LTV),
            ticket_promedio: parseCurrency(c.ticket_promedio),
            estado: c.Estado || 'Activo',
            lifecycle: c.estado_lifecycle || 'Nuevo',
            riesgo,
            dias_ausente: c.dias_ausentes || 0,
            ultimo_mensaje: c.ultimo_mensaje_enviado ? {
                fecha: c.ultimo_mensaje_enviado,
                tipo: c.tipo_ultimo_mensaje || 'unknown'
            } : undefined,
            notas: c.notas || undefined
        };
    });
};

// ===========================================
// Provider Function
// ===========================================

export const DashboardDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [raw, setRaw] = useState<DashboardRawResponse['data'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [realtimeStatus, setRealtimeStatus] = useState<WebSocketStatus>('disconnected');

    // Derived State
    const [clients, setClients] = useState<Client[]>([]);
    const [engagementConfig, setEngagementConfig] = useState<EngagementConfig[]>([]);
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

    // ===========================================
    // Calculation Logic
    // ===========================================

    const calculateMetrics = useCallback((
        data: DashboardRawResponse['data'],
        normalizedClients: Client[],
        normalizedConfig: EngagementConfig[]
    ) => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const todayStr = now.toISOString().split('T')[0];

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
        // Calcular pendientes de retoque basado en reglas
        const pendientesRetoque: PendingRetoque[] = [];

        normalizedClients.forEach(client => {
            // Buscar última visita o usar campo dias_ausentes
            // Si el cliente está activo y hace XX dias no viene, y coincide con una regla...
            if (client.estado === 'Activo' && client.dias_ausente > 0) {
                // Buscar si alguna regla aplica. (Esto es una simulacion simple, idealmente filtramos por servicio de ultima visita)
                // Como no tenemos el servicio de la ultima visita en Client, usamos dias_ausente como proxy
                const ruleIdx = normalizedConfig.findIndex(r =>
                    r.activo && client.dias_ausente >= r.dias_min && client.dias_ausente <= r.dias_max
                );

                if (ruleIdx >= 0) {
                    const rule = normalizedConfig[ruleIdx];
                    pendientesRetoque.push({
                        citaId: 0,
                        clienteId: client.id,
                        nombre: client.nombre,
                        telefono: client.telefono,
                        servicio: rule.servicio,
                        tipoServicio: rule.servicio,
                        diasPasados: client.dias_ausente,
                        regla: rule.keywords,
                        mensaje: rule.mensaje.replace('{nombre}', client.nombre),
                        diasOptimosRestantes: rule.dias_max - client.dias_ausente
                    });
                }
            }
        });

        const engagement: EngagementMetrics = {
            clientesActivos: normalizedClients.filter(c => c.estado === 'Activo').length,
            clientesEnRiesgo: normalizedClients.filter(c => c.riesgo === 'Alto' || c.riesgo === 'Crítico').length,
            pendientesRetoqueCount: pendientesRetoque.length,
            tasaRetencion: 0, // TODO: Calcuate properly
            configServicesCount: normalizedConfig.filter(c => c.activo).length
        };

        // 4. Loyalty Metrics
        const loyalty: LoyaltyMetrics = {
            puntosTotales: normalizedClients.reduce((sum, c) => sum + c.puntos, 0),
            canjesMes: (data.canjes || []).filter(c => new Date(c.fecha_canje) >= startOfMonth).length,
            topClientes: [...normalizedClients].sort((a, b) => b.puntos - a.puntos).slice(0, 5),
            premiosPopulares: data.premios || []
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
            console.log('🔄 DashboardContext: Fetching raw data...', force ? '(Forced)' : '');
            const response = await dashboard.getAll(force);

            if (response && response.success && response.data) {
                const rawData = response.data;
                setRaw(rawData);
                setLastUpdate(new Date());

                // Legacy Field Support
                setLegacy({
                    planesMarketing: rawData.planesMarketing || [],
                    stats: rawData.stats || {},
                    forecast: rawData.forecast || {}
                });

                // Normalize
                const normClients = normalizeClients(rawData.clientes || []);
                const normConfig = normalizeConfig(rawData.configuracion || []);

                setClients(normClients);
                setEngagementConfig(normConfig);

                // Calculate Metrics
                calculateMetrics(rawData, normClients, normConfig);

                console.log('✅ DashboardContext: Metrics recalculated.');
            } else {
                throw new Error('Invalid response structure');
            }

        } catch (err: any) {
            console.error('❌ DashboardContext Error:', err);
            setError(err.message || 'Error loading data');
        } finally {
            setIsLoading(false);
        }
    }, [calculateMetrics]);

    const refresh = useCallback(async (force = false) => {
        await loadData(force);
    }, [loadData]);

    // Auto-refresh Interval
    useEffect(() => {
        loadData(); // Initial load

        const intervalId = setInterval(() => {
            console.log('⏰ DashboardContext: Auto-refresh triggered.');
            loadData(true); // Force refresh
        }, DASHBOARD_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [loadData]);

    return (
        <DashboardDataContext.Provider value={{
            raw,
            clients,
            appointments: raw?.citas || [],
            staff: raw?.staff || [], // ✅ Expose staff from raw data
            engagementConfig,
            redemptions: raw?.canjes || [],
            rewards: raw?.premios || [],

            financials: derived.financials,
            operational: derived.operational,
            engagement: derived.engagement,
            loyalty: derived.loyalty,
            retentionStats: derived.retentionStats,

            pendientesRetoque: derived.pendientesRetoque,
            citasProximas: derived.citasProximas,

            // Legacy
            stats: legacy.stats,
            forecast: legacy.forecast,
            planesMarketing: legacy.planesMarketing,

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
