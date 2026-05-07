/**
 * CRM Types — Segmentación Inteligente de Clientes
 * Nilah IA · Korat Flow
 */

// ============================
// Service Categories
// ============================

export interface ServiceCategory {
    id: string;
    label: string;
    emoji: string;
    description: string;
    keywords: string[];       // keywords para buscaer en el campo "servicio" de citas
    color: string;            // Tailwind gradient
    bgColor: string;          // bg card color
    textColor: string;
    iconBg: string;
}
// Removed hardcoded SERVICE_CATEGORIES, using dynamic ones from utils/segmentation.ts

// ============================
// Segment Types
// ============================

export type SegmentOperator = 'AND' | 'OR';

export interface SegmentFilter {
    ltvMin?: number;
    ltvMax?: number;
    diasAusenteMin?: number;
    diasAusenteMax?: number;
    visitasMin?: number;
    lifecycle?: string[];   // Activo, En Riesgo, Perdido, etc.
    serviciosEspecificos?: string[]; // Arrays de nombres de servicio exactos
}

export interface Segment {
    id: string;
    name: string;
    description?: string;
    categoryIds: string[];        // IDs de ServiceCategory seleccionadas
    operator: SegmentOperator;
    filters: SegmentFilter;
    clientCount: number;
    createdAt: string;
    color?: string;               // color override
}

// ============================
// Segment Client Profile
// ============================

export interface SegmentClientProfile {
    clientId: number;
    nombre: string;
    telefono: string;
    ltv: number;
    ticket_promedio: number;
    total_visitas: number;
    dias_ausente: number;
    estado: string;
    lifecycle: string;
    riesgo: string;
    categoryIds: Set<string>;     // Qué categorías de servicio tiene el cliente
    services: string[];           // Servicios específicos que ha tomado (nombres únicos)
    serviceHistory: { servicio: string; fecha: string; estado: string }[]; // Historial completo con fechas
    bloqueado_hasta: string | null;
}

// ============================
// Segment Metrics
// ============================

export interface SegmentMetrics {
    total: number;
    activos: number;
    enRiesgo: number;
    perdidos: number;
    ltvPromedio: number;
    ticketPromedio: number;
    frecuenciaPromedio: number;   // visitas / mes
    topServices: { servicio: string; count: number }[];
}

// ============================
// Auto-Insight
// ============================

export interface AutoInsight {
    id: string;
    title: string;
    description: string;
    emoji: string;
    clientCount: number;
    priority: 'high' | 'medium' | 'low';
    categoryIds: string[];
    operator: SegmentOperator;
    filters: SegmentFilter;
    actionLabel: string;
    color: string;
}

// ============================
// BI Intelligence Types
// ============================

/** Per-client cadence analysis (RFM predictor) */
export interface RFMClientProfile {
    clientId: number;
    nombre: string;
    telefono: string;
    ltv: number;
    avgCadenceDays: number;       // average days between visits
    daysSinceLastVisit: number;
    overdueByDays: number;        // positive = overdue, negative = still within window
    topService: string;           // most-booked service
    totalVisits: number;
    riskLevel: 'on-time' | 'due-soon' | 'overdue' | 'lost';
}

/** A day+hour combination that represents a salon's 'valley' slot */
export interface ValleySlot {
    dayOfWeek: number;      // 0=Sun..6=Sat
    dayLabel: string;       // 'Lunes', 'Martes', etc.
    hour: number;           // 0-23
    bookingCount: number;   // how often that slot is booked
    isValley: boolean;      // true if significantly below average
}

/** Per-staff dependency risk result */
export interface StaffAffinityResult {
    staffId: number | string;
    staffName: string;
    totalClients: number;         // unique clients who have visited this staff
    exclusiveClients: number;     // clients who ONLY visit this staff member
    exclusivePct: number;         // exclusiveClients / totalClients
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    topExclusiveClients: { clientId: number; nombre: string; ltv: number }[];
}
