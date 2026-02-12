/**
 * ===========================================
 * Campaign Builder Types v2 - Rediseño Completo
 * ===========================================
 * Tipos para el sistema de construcción de campañas con IA
 */

// ============================================
// PAÍSES Y CONFIGURACIÓN REGIONAL
// ============================================

export type CountryCode = 'PE' | 'MX' | 'CO' | 'AR' | 'CL' | 'EC' | 'US' | 'ES';

export interface CountryInfo {
    code: CountryCode;
    name: string;
    flag: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
}

export const SUPPORTED_COUNTRIES: Record<CountryCode, CountryInfo> = {
    PE: { code: 'PE', name: 'Perú', flag: '🇵🇪', currency: 'PEN', currencySymbol: 'S/', timezone: 'America/Lima' },
    MX: { code: 'MX', name: 'México', flag: '🇲🇽', currency: 'MXN', currencySymbol: '$', timezone: 'America/Mexico_City' },
    CO: { code: 'CO', name: 'Colombia', flag: '🇨🇴', currency: 'COP', currencySymbol: '$', timezone: 'America/Bogota' },
    AR: { code: 'AR', name: 'Argentina', flag: '🇦🇷', currency: 'ARS', currencySymbol: '$', timezone: 'America/Buenos_Aires' },
    CL: { code: 'CL', name: 'Chile', flag: '🇨🇱', currency: 'CLP', currencySymbol: '$', timezone: 'America/Santiago' },
    EC: { code: 'EC', name: 'Ecuador', flag: '🇪🇨', currency: 'USD', currencySymbol: '$', timezone: 'America/Guayaquil' },
    US: { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', timezone: 'America/New_York' },
    ES: { code: 'ES', name: 'España', flag: '🇪🇸', currency: 'EUR', currencySymbol: '€', timezone: 'Europe/Madrid' },
};

// ============================================
// FECHAS CLAVE
// ============================================

export type DateCategory = 'holiday' | 'commercial' | 'cultural' | 'industry';

export interface KeyDate {
    id: string;
    date: string; // MM-DD format
    name: string;
    category: DateCategory;
    description: string;
    contentIdeas: ContentIdea[];
    isVariable?: boolean;
    variableRule?: string;
}

export interface ContentIdea {
    id: string;
    title: string;
    type: 'post' | 'promo' | 'story' | 'whatsapp' | 'email';
    description: string;
    template?: string;
    suggestedHashtags?: string[];
}

// ============================================
// SUGERENCIAS SEMANALES (NUEVO)
// ============================================

export interface WeekSuggestion {
    weekNumber: 1 | 2 | 3 | 4;
    startDate: string;
    endDate: string;
    specialEvent?: string;
    suggestedPromo: string;
    suggestedMessage: string;
    estimatedImpact: 'alto' | 'medio' | 'bajo';
    reason: string;
    promoType: PromoType;
}

// ============================================
// TARJETAS MENSUALES (ACTUALIZADO)
// ============================================

export type MonthStatus = 'active' | 'planning' | 'preview' | 'locked' | 'past';

export interface MonthCard {
    month: number; // 0-11
    year: number;
    status: MonthStatus;
    keyDates: KeyDate[];
    weeks: WeekSuggestion[];  // NUEVO: 4 sugerencias por semana
    campaignsCreated: number;
    campaignsPending: number;
}

// ============================================
// WIZARD DE CAMPAÑA - TIPOS EXPANDIDOS
// ============================================

// Objetivos de negocio (expandidos)
export type ObjectiveType =
    | 'llenar_agenda'
    | 'recuperar_inactivos'
    | 'aumentar_ticket'
    | 'captar_nuevos'
    | 'fidelizar_vip'
    | 'evento_especial'
    | 'lanzar_servicio'
    | 'liquidar_inventario';

// Segmentos de clientes (NUEVO)
export type SegmentType =
    | 'todas'
    | 'activas_frecuentes'
    | 'activas_regulares'
    | 'inactivas_30'
    | 'inactivas_60'
    | 'inactivas_90'
    | 'cumpleaneras'
    | 'nuevas_recientes'
    | 'alto_valor'
    | 'servicio_especifico';

// Tipos de promoción (expandidos)
export type PromoType =
    | 'descuento_10'
    | 'descuento_15'
    | 'descuento_20'
    | 'descuento_monto'
    | '2x1_amigas'
    | '3x2_servicios'
    | 'combo_personalizado'
    | 'servicio_gratis'
    | 'upgrade_gratis'
    | 'producto_gratis'
    | 'puntos_dobles'
    | 'puntos_triple'
    | 'flash_24h'
    | 'ultimos_espacios'
    | 'precio_especial_dia'
    | 'membresia'
    | 'exclusivo_whatsapp';

// Disparadores emocionales (NUEVO)
export type EmotionalTriggerType =
    | 'recompensa'
    | 'urgencia'
    | 'exclusividad'
    | 'nostalgia'
    | 'prueba_social'
    | 'ocasion_especial'
    | 'mantenimiento'
    | 'transformacion';

// Tonos de comunicación (expandidos)
export type ToneType =
    | 'amigable'
    | 'profesional'
    | 'divertido'
    | 'elegante'
    | 'directo'
    | 'emotivo';

// Opciones de timing (NUEVO)
export type TimingType =
    | 'ahora'
    | 'mejor_momento'
    | 'antes_finde'
    | 'inicio_semana'
    | 'fecha_especifica';

// Mantener ChannelType por compatibilidad (aunque ya no se usa en wizard)
export type ChannelType = 'whatsapp' | 'instagram' | 'reels';

export interface WizardOption {
    id: string;
    value: string;
    label: string;
    icon: string;
    description: string;
    isRecommended?: boolean;
    recommendationReason?: string;
    count?: number;  // NUEVO: Para segmentos (cuántos clientes)
    avgTicket?: number;  // NUEVO: Ticket promedio del segmento
    showInput?: boolean;  // NUEVO: Si requiere input adicional
    inputType?: 'amount' | 'service' | 'datetime';  // NUEVO: Tipo de input
    suggestedFor?: ObjectiveType[];  // NUEVO: Para qué objetivos se recomienda
    examples?: string[];  // NUEVO: Ejemplos de mensajes
}

export interface WizardStepConfig {
    id: number;
    title: string;
    question: string;
    nilahMessage: string;
    options: WizardOption[];
}

// ============================================
// ELECCIONES DE CAMPAÑA (ACTUALIZADO)
// ============================================

export interface CampaignChoices {
    // Wizard Básico
    objective: ObjectiveType | null;
    segment: SegmentType | null;  // NUEVO
    promo: PromoType | null;
    promoValue?: number | string;  // NUEVO: Valor del descuento si aplica
    emotionalTrigger: EmotionalTriggerType | null;  // NUEVO
    tone: ToneType | null;
    timing: TimingType | null;  // NUEVO
    scheduledDateTime?: string;  // NUEVO: Fecha/hora programada

    // Campos legacy (para compatibilidad)
    channel?: ChannelType | null;
    launchDate?: string | null;
    keyDateId?: string | null;
}

// ============================================
// CAMPAÑA GENERADA (ACTUALIZADO)
// ============================================

export interface GeneratedCampaign {
    id: string;
    monthCard: { month: number; year: number };
    choices: CampaignChoices;
    title: string;
    message: string;
    estimatedReach: number;
    estimatedRevenue: number;
    status: 'draft' | 'scheduled' | 'active' | 'completed' | 'enviada';
    scheduledDate?: string;
    createdAt: string;
    keyDateName?: string;

    // Campos para Supabase
    segmentCount?: number;
    mode?: 'express' | 'advanced';

    // Campos de IA - Nueva estructura
    aiImageIdea?: any;
    aiTipsWhatsApp?: string[];
    aiVideoIdea?: any;
    koratFlowTip?: string;
}

// ============================================
// MODO DE WIZARD
// ============================================

export type WizardMode = 'express' | 'advanced';

// ============================================
// BUSINESS BRIEF MEJORADO
// ============================================

export interface BusinessBriefEnhanced {
    // === SECCIÓN 1: IDENTIDAD DEL NEGOCIO ===
    businessId: string;
    businessName: string;
    businessType: 'salon' | 'spa' | 'barberia' | 'estetica' | 'clinica';
    yearsOperating: number;
    location: string;
    hasParking: boolean;
    numberOfChairs: number;
    employeesCount: number;

    // === SECCIÓN 2: FINANZAS Y MÉTRICAS ===
    monthlyRevenue: string;
    avgTicket: number;
    ticketPremium: number;
    targetMonthlyRevenue: number;
    marginPercent: number;

    // === SECCIÓN 3: SERVICIOS ===
    topService1: string;
    topService1Price: number;
    topService1Duration: number;
    topService2: string;
    topService2Price: number;
    premiumService: string;
    premiumServicePrice: number;
    hookService: string;
    hookServicePrice: number;

    // === SECCIÓN 4: CLIENTELA ===
    activeClients: number;
    newClientsPerMonth: number;
    repeatRate: number;
    targetGender: 'mujeres' | 'hombres' | 'ambos';
    targetAge: string;
    clientPersona: string;

    // === SECCIÓN 5: COMPORTAMIENTO Y TIMING ===
    preferredChannel: string;
    weakDays: string[];
    peakDays: string[];
    peakHours: string;
    appointmentLeadTime: string;

    // === SECCIÓN 6: RETOS Y OBJETIVOS ===
    mainChallenge: string;
    secondaryChallenge: string;
    monthlyGoal: string;
    biggestFear: string;

    // === SECCIÓN 7: COMUNICACIÓN Y MARCA ===
    brandWords: string;
    communicationStyle: 'formal' | 'casual' | 'amigable' | 'profesional';
    emojiUsage: 'mucho' | 'moderado' | 'poco' | 'nada';
    brandColor: string;
    competitorDifferentiator: string;

    // === SECCIÓN 8: HISTORIAL DE MARKETING ===
    hasWhatsAppBusiness: boolean;
    previousMarketingEfforts: string;
    bestCampaignEver: string;
    averageCampaignBudget: number;
}

// ============================================
// CONTEXTO PARA IA
// ============================================

export interface AIContext {
    business: Partial<BusinessBriefEnhanced>;
    metrics: {
        totalClients: number;
        activeClients: number;
        inactiveClients30: number;
        inactiveClients60: number;
        birthdaysThisMonth: number;
        avgTicketThisMonth: number;
        occupancyRate: number;
        lowOccupancyDays: string[];
        revenueThisMonth: number;
        targetRevenue: number;
    };
    campaignHistory: {
        totalSent: number;
        avgResponseRate: number;
        avgConversionRate: number;
        bestDayToSend: string;
        bestTimeToSend: string;
    };
    temporal: {
        currentDate: string;
        currentMonth: string;
        upcomingEvents: string[];
        seasonality: string;
        dayOfWeek: string;
    };
}

// ============================================
// CONTEXTO DE CAMPAÑA (ESTADO GLOBAL)
// ============================================

export interface CampaignBuilderState {
    monthCards: MonthCard[];
    userCampaigns: GeneratedCampaign[];
    currentCountry: CountryCode;
    isWizardOpen: boolean;
    wizardMode: WizardMode;  // NUEVO
    selectedMonth: { month: number; year: number } | null;
    wizardStep: number;
    wizardChoices: CampaignChoices;
}

// ============================================
// CONSTANTES DE UI (MAPPINGS)
// ============================================

export const OBJECTIVE_TO_LABEL: Record<ObjectiveType, string> = {
    'llenar_agenda': 'Llenar Agenda',
    'recuperar_inactivos': 'Recuperar Inactivos',
    'aumentar_ticket': 'Aumentar Ticket',
    'captar_nuevos': 'Captar Nuevos',
    'fidelizar_vip': 'Fidelizar VIPs',
    'evento_especial': 'Evento Especial',
    'lanzar_servicio': 'Lanzar Servicio',
    'liquidar_inventario': 'Liquidar Stock'
};
