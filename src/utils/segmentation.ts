/**
 * segmentation.ts
 * Lógica pura de clasificación y segmentación de clientes por servicios.
 * Nilah IA · Korat Flow
 */

import {
    ServiceCategory,
    Segment,
    SegmentClientProfile,
    SegmentMetrics,
    AutoInsight,
    SegmentFilter,
} from '../types/crm';
import { RawAppointment, Client, RawService } from '../context/DashboardDataContext';
import { analyzeClientServiceCadence } from './serviceCycles';

// ============================
// Dynamic Category Generation
// ============================

// Stable color palette — indexed by a simple hash of category name
// so the SAME category always gets the SAME color regardless of DB order.
const CATEGORY_COLORS = [
    { color: 'from-pink-400 to-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950/30', textColor: 'text-rose-600 dark:text-rose-400', iconBg: 'bg-rose-100 dark:bg-rose-900/30' },
    { color: 'from-violet-400 to-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400', iconBg: 'bg-purple-100 dark:bg-purple-900/30' },
    { color: 'from-orange-400 to-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400', iconBg: 'bg-amber-100 dark:bg-amber-900/30' },
    { color: 'from-cyan-400 to-teal-500', bgColor: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400', iconBg: 'bg-teal-100 dark:bg-teal-900/30' },
    { color: 'from-green-400 to-emerald-500', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', textColor: 'text-emerald-600 dark:text-emerald-400', iconBg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { color: 'from-blue-400 to-indigo-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
    { color: 'from-yellow-400 to-orange-400', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', textColor: 'text-yellow-700 dark:text-yellow-400', iconBg: 'bg-yellow-100 dark:bg-yellow-900/30' },
];

// Well-known category names → stable emoji (for beauty salon context)
const KNOWN_CATEGORY_EMOJIS: Record<string, string> = {
    manos: '💅',
    pestanas: '👁️',
    pies: '🦶',
    rostro: '✨',
    cabello: '💇',
    depilacion: '🪒',
    relajacion: '💆',
    general: '🌟',
};

/** Simple deterministic hash of a string → number (used to pick stable color) */
function strHash(s: string): number {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        hash = (hash * 31 + s.charCodeAt(i)) & 0xfffffff;
    }
    return hash;
}

export function generateDynamicCategories(services: RawService[]): ServiceCategory[] {
    const categoriesMap = new Map<string, ServiceCategory>();

    // Fallback if no services are defined yet
    if (!services || services.length === 0) return [];

    // Collect unique category names first (to keep insertion stable before hashing)
    const uniqueCats: { catId: string; catName: string }[] = [];
    services.forEach(svc => {
        const catName = svc.categoria || 'General';
        const catId = catName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!categoriesMap.has(catId)) {
            categoriesMap.set(catId, null as any); // placeholder to preserve uniqueness
            uniqueCats.push({ catId, catName });
        }
    });

    // Sort alphabetically so order is always deterministic regardless of DB response order
    uniqueCats.sort((a, b) => a.catId.localeCompare(b.catId));

    // Now assign stable color by hashing the category id
    uniqueCats.forEach(({ catId, catName }) => {
        const colorIdx = strHash(catId) % CATEGORY_COLORS.length;
        const style = CATEGORY_COLORS[colorIdx];

        // Pick emoji: check known keys first, then fallback
        const shortKey = catId.replace(/-/g, '').substring(0, 8);
        const emoji = KNOWN_CATEGORY_EMOJIS[shortKey] ||
            Object.entries(KNOWN_CATEGORY_EMOJIS).find(([k]) => catId.includes(k))?.[1] ||
            '💄';

        categoriesMap.set(catId, {
            id: catId,
            label: catName,
            emoji,
            description: `Servicios de ${catName}`,
            keywords: [],
            ...style
        });
    });

    return Array.from(categoriesMap.values()).filter(Boolean);
}

// ============================
// Classify a single appointment service string based on raw services
// Returns array of matching category IDs
// ============================
export function classifyService(servicio: string, services: RawService[]): string[] {
    if (!servicio || services.length === 0) return [];

    const normalize = (s: string) =>
        s.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const lowerCita = normalize(servicio);

    // Helper to get category ID from a category name
    const toCatId = (catName: string) =>
        catName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // TIER 1: Exact/substring match (appointment text contains full service name or vice versa)
    const matchingService = services.find(s => {
        const svcNorm = normalize(s.nombre);
        if (lowerCita.includes(svcNorm) || svcNorm.includes(lowerCita)) return true;

        // Split DB service into significant words (skip prepositions and short words)
        const dbWords = svcNorm.split(' ').filter(w => w.length > 3);
        // Split appointment text into significant words too
        const citaWords = lowerCita.split(' ').filter(w => w.length > 3);

        // Exact word match (both directions)
        if (dbWords.some(w => lowerCita.includes(w))) return true;
        if (citaWords.some(w => svcNorm.includes(w))) return true;

        // Prefix match: first 5 chars to handle spelling variants like pedicure/pedicura
        const PREFIX_LEN = 5;
        return dbWords.some(dbW =>
            citaWords.some(citaW =>
                dbW.length >= PREFIX_LEN && citaW.length >= PREFIX_LEN &&
                dbW.substring(0, PREFIX_LEN) === citaW.substring(0, PREFIX_LEN)
            )
        );
    });

    if (matchingService) {
        return [toCatId(matchingService.categoria || 'General')];
    }

    // TIER 2: The appointment text contains the category name directly (e.g. "Rostro", "Pies")
    const categoryMatch = services.find(s => {
        const catNorm = normalize(s.categoria || '');
        return catNorm && lowerCita.includes(catNorm);
    });

    if (categoryMatch) {
        return [toCatId(categoryMatch.categoria || 'General')];
    }

    // TIER 3: last resort keyword matching
    if (lowerCita.includes('pedi') || lowerCita.includes('pie')) return [toCatId('Pies')];
    if (lowerCita.includes('pesta') || lowerCita.includes('lifting') || lowerCita.includes('extension')) return [toCatId('Pestañas')];
    if (lowerCita.includes('mano') || lowerCita.includes('manicur') || lowerCita.includes('acril') || lowerCita.includes('esmalte')) return [toCatId('Manos')];
    if (lowerCita.includes('cejas') || lowerCita.includes('facial') || lowerCita.includes('depilac') || lowerCita.includes('rostro')) return [toCatId('Rostro')];
    if (lowerCita.includes('cabello') || lowerCita.includes('corte') || lowerCita.includes('tinte')) return [toCatId('Cabello')];

    // No match found
    return ['otro'];
}


// ============================
// Build a Map<clientId, SegmentClientProfile> from raw data
// ============================
export function buildClientProfiles(
    clients: Client[],
    appointments: RawAppointment[],
    services: RawService[]
): Map<number, SegmentClientProfile> {
    const profileMap = new Map<number, SegmentClientProfile>();

    // Initialize from clients
    clients.forEach(c => {
        profileMap.set(c.id, {
            clientId: c.id,
            nombre: c.nombre,
            telefono: c.telefono || '',
            ltv: c.ltv || 0,
            ticket_promedio: c.ticket_promedio || 0,
            total_visitas: c.total_visitas || 0,
            dias_ausente: c.dias_ausente || 0,
            estado: c.estado || 'Activo',
            lifecycle: c.lifecycle || 'Nuevo',
            riesgo: c.riesgo || 'Bajo',
            categoryIds: new Set<string>(),
            services: [],
            serviceHistory: [],
            bloqueado_hasta: c.bloqueado_hasta || null,
        });
    });

    // Enrich with appointment service data
    appointments
        .filter(a => {
            // Case-insensitive comparison — DB has 'Completada', 'completada', etc.
            const estado = (a.estado || '').toLowerCase().trim();
            return estado === 'completada' && (a.cliente || a.cliente_id);
        })
        .forEach(apt => {
            const clientId = (apt.cliente || apt.cliente_id) as number;
            const profile = profileMap.get(clientId);
            if (!profile) return;

            // Add service text unique
            if (apt.servicio && !profile.services.includes(apt.servicio)) {
                profile.services.push(apt.servicio);
            }

            // Track detailed history
            if (apt.servicio) {
                profile.serviceHistory.push({
                    servicio: apt.servicio,
                    fecha: apt.fecha || '',
                    estado: apt.estado || 'Completada',
                });
            }

            // Classify and add categories
            const cats = classifyService(apt.servicio || '', services);
            cats.forEach(c => profile.categoryIds.add(c));
        });

    return profileMap;
}

// ============================
// Apply a segment filter to a list of profiles
// ============================
export function applySegment(
    profiles: Map<number, SegmentClientProfile>,
    categoryIds: string[],
    operator: 'AND' | 'OR',
    filters: SegmentFilter = {}
): SegmentClientProfile[] {
    return Array.from(profiles.values()).filter(p => {
        // Category match
        if (categoryIds.length > 0) {
            const catMatch = operator === 'AND'
                ? categoryIds.every(cat => p.categoryIds.has(cat))
                : categoryIds.some(cat => p.categoryIds.has(cat));
            if (!catMatch) return false;
        }

        // Additional filters
        if (filters.ltvMin !== undefined && p.ltv < filters.ltvMin) return false;
        if (filters.ltvMax !== undefined && p.ltv > filters.ltvMax) return false;
        if (filters.diasAusenteMin !== undefined && p.dias_ausente < filters.diasAusenteMin) return false;
        if (filters.diasAusenteMax !== undefined && p.dias_ausente > filters.diasAusenteMax) return false;
        if (filters.visitasMin !== undefined && p.total_visitas < filters.visitasMin) return false;
        if (filters.lifecycle && filters.lifecycle.length > 0) {
            if (!filters.lifecycle.includes(p.lifecycle)) return false;
        }

        // Exact service match (OR logic inside the list of specific services)
        if (filters.serviciosEspecificos && filters.serviciosEspecificos.length > 0) {
            const hasService = filters.serviciosEspecificos.some(svc => p.services.includes(svc));
            if (!hasService) return false;
        }

        return true;
    });
}

// ============================
// Compute metrics for a list of profiles
// ============================
export function computeSegmentMetrics(
    profiles: SegmentClientProfile[],
    appointments: RawAppointment[]
): SegmentMetrics {
    if (profiles.length === 0) {
        return {
            total: 0, activos: 0, enRiesgo: 0, perdidos: 0,
            ltvPromedio: 0, ticketPromedio: 0, frecuenciaPromedio: 0,
            topServices: [],
        };
    }

    const idSet = new Set(profiles.map(p => p.clientId));

    // Métricas con Ciclo de Vida Inteligente (45d / 75d / 120d y Alisados 120-180d)
    const activos = profiles.filter(p => {
        const cad = analyzeClientServiceCadence(p.services);
        return cad.isLongCycleOnly ? p.dias_ausente < 120 : p.dias_ausente <= 45;
    }).length;
    const enRiesgo = profiles.filter(p => {
        const cad = analyzeClientServiceCadence(p.services);
        return cad.isLongCycleOnly ? (p.dias_ausente >= 120 && p.dias_ausente <= 180) : (p.dias_ausente > 45 && p.dias_ausente <= 75);
    }).length;
    const perdidos = profiles.filter(p => {
        const cad = analyzeClientServiceCadence(p.services);
        return cad.isLongCycleOnly ? p.dias_ausente > 180 : p.dias_ausente > 75;
    }).length;

    const ltvPromedio = profiles.reduce((s, p) => s + p.ltv, 0) / profiles.length;
    const ticketPromedio = profiles.filter(p => p.ticket_promedio > 0).reduce((s, p) => s + p.ticket_promedio, 0)
        / (profiles.filter(p => p.ticket_promedio > 0).length || 1);
    const frecuenciaPromedio = profiles.reduce((s, p) => s + p.total_visitas, 0) / profiles.length;

    // Top services from appointments
    const serviceCounts: Record<string, number> = {};
    appointments
        .filter(a => {
            const cId = (a.cliente || a.cliente_id) as number;
            return a.estado?.toLowerCase() === 'completada' && cId && idSet.has(cId);
        })
        .forEach(a => {
            const s = a.servicio || 'Otro';
            serviceCounts[s] = (serviceCounts[s] || 0) + 1;
        });

    const topServices = Object.entries(serviceCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([servicio, count]) => ({ servicio, count }));

    return { total: profiles.length, activos, enRiesgo, perdidos, ltvPromedio, ticketPromedio, frecuenciaPromedio, topServices };
}

// ============================
// Generate Auto-Insights from the full data
// ============================
export function generateAutoInsights(
    profiles: Map<number, SegmentClientProfile>,
    categories: ServiceCategory[]
): AutoInsight[] {
    const insights: AutoInsight[] = [];

    const all = Array.from(profiles.values());
    if (all.length === 0) return insights;

    // Insight 1: High-value clients at risk (LTV > median, respetando ciclo de servicio)
    const sorted = [...all].sort((a, b) => b.ltv - a.ltv);
    const medianLtv = sorted[Math.floor(sorted.length / 2)]?.ltv || 0;
    const highValueAtRisk = all.filter(p => {
        if (p.ltv < medianLtv) return false;
        const cad = analyzeClientServiceCadence(p.services);
        // Si solo se hace alisados, su riesgo real de renovación ocurre a los 120-180 días
        if (cad.isLongCycleOnly) {
            return p.dias_ausente >= 120 && p.dias_ausente <= 180;
        }
        return p.dias_ausente >= 45 && p.dias_ausente <= 75;
    });

    if (highValueAtRisk.length > 0) {
        insights.push({
            id: 'high-value-at-risk',
            title: 'Clientas VIP que se alejan',
            description: `${highValueAtRisk.length} clientas VIP están en su ventana de riesgo según su tipo de servicio.`,
            emoji: '⚠️',
            clientCount: highValueAtRisk.length,
            priority: 'high',
            categoryIds: [],
            operator: 'OR',
            filters: { ltvMin: medianLtv, diasAusenteMin: 45, diasAusenteMax: 75 },
            actionLabel: 'Rescatar con campaña',
            color: 'from-red-400 to-orange-500',
        });
    }

    // Insight 2: Renovación de Alisados & Keratinas (Oportunidad Ticket Alto)
    const alisadosRenovar = all.filter(p => {
        const cad = analyzeClientServiceCadence(p.services);
        return cad.hasAlisado && p.dias_ausente >= 120 && p.dias_ausente <= 210;
    });

    if (alisadosRenovar.length > 0) {
        insights.push({
            id: 'alisados-renovacion',
            title: 'Renovación de Alisados (Ticket Alto)',
            description: `${alisadosRenovar.length} clientas con alisado cumplieron 4-6 meses. Momento exacto para renovar raíz.`,
            emoji: '✨',
            clientCount: alisadosRenovar.length,
            priority: 'high',
            categoryIds: [],
            operator: 'OR',
            filters: { diasAusenteMin: 120, diasAusenteMax: 210 },
            actionLabel: 'Lanzar campaña',
            color: 'from-purple-500 to-indigo-600',
        });
    }

    // Generate per-category insights
    categories.forEach(cat => {
        const catProfiles = all.filter(p => p.categoryIds.has(cat.id));
        if (catProfiles.length < 3) return;

        // En riesgo dentro de esa categoría
        const atRisk = catProfiles.filter(p => p.dias_ausente >= 45 && p.dias_ausente < 90);
        if (atRisk.length > 0) {
            insights.push({
                id: `at-risk-${cat.id}`,
                title: `Clientas de ${cat.label} sin venir`,
                description: `${atRisk.length} clientas de ${cat.label} llevan más de 45 días sin visitarte.`,
                emoji: cat.emoji,
                clientCount: atRisk.length,
                priority: atRisk.length > 5 ? 'high' : 'medium',
                categoryIds: [cat.id],
                operator: 'OR',
                filters: { diasAusenteMin: 45, diasAusenteMax: 89 },
                actionLabel: 'Crear campaña',
                color: cat.color,
            });
        }

        // Exclusive loyals (only this category)
        const exclusive = catProfiles.filter(p => p.categoryIds.size === 1 && p.categoryIds.has(cat.id) && p.total_visitas >= 3);
        if (exclusive.length >= 3) {
            insights.push({
                id: `exclusive-${cat.id}`,
                title: `Fans exclusivas de ${cat.label}`,
                description: `${exclusive.length} clientas que solo vienen por ${cat.label}. Ideal para upsell cruzado.`,
                emoji: '🎯',
                clientCount: exclusive.length,
                priority: 'medium',
                categoryIds: [cat.id],
                operator: 'OR',
                filters: { visitasMin: 3 },
                actionLabel: 'Ver segmento',
                color: cat.color,
            });
        }
    });

    // Insight: Clients who get 2+ categories (cross-sell loyals)
    const crossBuyers = all.filter(p => p.categoryIds.size >= 2 && p.total_visitas >= 3);
    if (crossBuyers.length > 0) {
        insights.push({
            id: 'cross-buyers',
            title: 'Clientas multi-servicio',
            description: `${crossBuyers.length} clientas que disfrutan 2+ tipos de servicios. Tu audiencia más fiel.`,
            emoji: '⭐',
            clientCount: crossBuyers.length,
            priority: 'low',
            categoryIds: [],
            operator: 'OR',
            filters: { visitasMin: 3 },
            actionLabel: 'Ver segmento premium',
            color: 'from-indigo-400 to-purple-500',
        });
    }

    // Sort: high priority first, then by clientCount desc
    return insights
        .sort((a, b) => {
            const pOrder = { high: 0, medium: 1, low: 2 };
            const pd = pOrder[a.priority] - pOrder[b.priority];
            if (pd !== 0) return pd;
            return b.clientCount - a.clientCount;
        })
        .slice(0, 6);
}

// ============================
// Get category by ID
// ============================
export function getCategoryById(id: string, categories: ServiceCategory[]): ServiceCategory | undefined {
    return categories.find(c => c.id === id);
}

// End of file
