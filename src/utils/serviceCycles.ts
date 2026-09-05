/**
 * serviceCycles.ts
 * Inteligencia de Ciclos de Mantenimiento y Detección de Falsos Positivos
 * Nilah IA · Korat Flow
 *
 * Resuelve el punto ciego de los salones de belleza:
 * - Servicios de Alta Frecuencia (Uñas, Pestañas, Cejas): 15-30 días (Ausencia en 45d, 75d, 120d).
 * - Servicios de Larga Duración (Alisados, Keratinas, Balayage, Microblading): 120-180 días (4 a 6 meses).
 * - Clienta Monoservicio Larga Duración: NO debe alertar como ausente a los 45d ni 75d.
 * - Clienta Híbrida (Uñas + Alisado): Rige el MÍNIMO ciclo (sus uñas a los 45d) + cross-sell capilar.
 */

// Palabras clave de servicios con ciclo largo (4 a 6 meses de renovación)
export const LONG_CYCLE_KEYWORDS = [
    'alisad',
    'keratin',
    'cirugia capilar',
    'cirugía capilar',
    'botox capilar',
    'bótox capilar',
    'nanoplast',
    'taninoplast',
    'planchado definitivo',
    'balayage',
    'mechas',
    'highlights',
    'baby lights',
    'babylights',
    'decolorac',
    'microblading',
    'micropigmentac',
    'permanente de rizos',
];

// Palabras clave de servicios con ciclo frecuente (15 a 30 días de mantenimiento)
export const FREQUENT_CYCLE_KEYWORDS = [
    'uña',
    'uñas',
    'manic',
    'pedic',
    'pie',
    'pies',
    'lash',
    'pestaña',
    'lifting',
    'ceja',
    'cejas',
    'cera',
    'hilo',
    'bozo',
    'depilac',
    'corte',
    'secado',
    'brushing',
    'peinado',
    'facial',
    'limpieza',
];

/** Normaliza texto removiendo acentos y pasando a minúsculas */
export function normalizeText(text: string = ''): string {
    return text
        .toLowerCase()
        .trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

/** Determina si un nombre de servicio o categoría corresponde a larga duración */
export function isLongCycleService(serviceName: string = '', categoryName: string = ''): boolean {
    const normService = normalizeText(serviceName);
    const normCat = normalizeText(categoryName);

    return LONG_CYCLE_KEYWORDS.some(kw => normService.includes(kw) || normCat.includes(kw));
}

/** Determina si un nombre de servicio o categoría corresponde a alta frecuencia */
export function isFrequentService(serviceName: string = '', categoryName: string = ''): boolean {
    const normService = normalizeText(serviceName);
    const normCat = normalizeText(categoryName);

    // Si coincide con categorías conocidas de frecuencia
    if (['manos', 'pestanas', 'pies', 'cejas', 'depilacion'].some(c => normCat.includes(c))) {
        return true;
    }

    return FREQUENT_CYCLE_KEYWORDS.some(kw => normService.includes(kw) || normCat.includes(kw));
}

export interface ClientCadenceAnalysis {
    hasFrequent: boolean;
    hasLongCycle: boolean;
    isLongCycleOnly: boolean;
    hasAlisado: boolean;
    dominantCycleType: 'frequent' | 'long_cycle' | 'hybrid';
    minCadenceDays: number;
    recommendedRenewalDays: number;
    explanation: string;
}

/**
 * Analiza la lista de servicios consumidos por una clienta y clasifica su cadencia
 */
export function analyzeClientServiceCadence(servicesList: string[] = []): ClientCadenceAnalysis {
    if (!servicesList || servicesList.length === 0) {
        return {
            hasFrequent: true, // Asumir ciclo estándar por defecto
            hasLongCycle: false,
            isLongCycleOnly: false,
            hasAlisado: false,
            dominantCycleType: 'frequent',
            minCadenceDays: 25,
            recommendedRenewalDays: 45,
            explanation: 'Sin historial específico. Rige ciclo general de 45 días.',
        };
    }

    let hasFrequent = false;
    let hasLongCycle = false;
    let hasAlisado = false;

    servicesList.forEach(svc => {
        const norm = normalizeText(svc);
        if (LONG_CYCLE_KEYWORDS.some(kw => norm.includes(kw))) {
            hasLongCycle = true;
            if (norm.includes('alisad') || norm.includes('keratin') || norm.includes('cirugia') || norm.includes('nanoplast')) {
                hasAlisado = true;
            }
        }
        if (FREQUENT_CYCLE_KEYWORDS.some(kw => norm.includes(kw))) {
            hasFrequent = true;
        }
    });

    // Si solo tiene cabello pero no es alisado ni balayage (ej. corte simple), es frecuente
    if (!hasFrequent && !hasLongCycle) {
        hasFrequent = true;
    }

    const isLongCycleOnly = hasLongCycle && !hasFrequent;

    let dominantCycleType: 'frequent' | 'long_cycle' | 'hybrid' = 'frequent';
    let minCadenceDays = 25;
    let recommendedRenewalDays = 45;
    let explanation = '';

    if (isLongCycleOnly) {
        dominantCycleType = 'long_cycle';
        minCadenceDays = 120;
        recommendedRenewalDays = 150;
        explanation = 'Clienta de ciclo extendido (Alisados/Balayage). Su ventana de renovación es de 4 a 6 meses (120-180d). No alertar a los 45d.';
    } else if (hasFrequent && hasLongCycle) {
        dominantCycleType = 'hybrid';
        minCadenceDays = 25; // Rige el tiempo mínimo de mantenimiento (uñas/pestañas)
        recommendedRenewalDays = 45;
        explanation = 'Clienta multiconsumo (Frecuente + Larga Duración). Rige el ciclo corto de sus uñas/pestañas (45d) + oportunidad de cross-sell capilar.';
    } else {
        dominantCycleType = 'frequent';
        minCadenceDays = 25;
        recommendedRenewalDays = 45;
        explanation = 'Clienta de servicios frecuentes. Alerta estándar de ausencia a los 45d, 75d y 120d.';
    }

    return {
        hasFrequent,
        hasLongCycle,
        isLongCycleOnly,
        hasAlisado,
        dominantCycleType,
        minCadenceDays,
        recommendedRenewalDays,
        explanation,
    };
}

/**
 * Determina si una clienta está en riesgo de ausencia teniendo en cuenta su tipo de servicio
 */
export function isClientInAbsenceRisk(
    diasAusente: number,
    servicesList: string[],
    riskStage: 'primer_riesgo_45' | 'riesgo_alto_75' | 'perdida_120'
): boolean {
    const analysis = analyzeClientServiceCadence(servicesList);

    // SI ES MONOSERVICIO DE LARGA DURACIÓN:
    // NUNCA entra en la alerta de 45 días ni de 75 días.
    if (analysis.isLongCycleOnly) {
        if (riskStage === 'primer_riesgo_45' || riskStage === 'riesgo_alto_75') {
            return false;
        }
        // A los 120+ días sí entra en rescate/renovación de su tratamiento estrella
        return diasAusente >= 120;
    }

    // SI TIENE SERVICIOS FRECUENTES (Puro o Híbrido):
    // Rige el ciclo oficial de 45d, 75d, 120d
    if (riskStage === 'primer_riesgo_45') {
        return diasAusente > 45 && diasAusente <= 75;
    }
    if (riskStage === 'riesgo_alto_75') {
        return diasAusente > 75 && diasAusente <= 120;
    }
    if (riskStage === 'perdida_120') {
        return diasAusente > 120;
    }

    return false;
}
