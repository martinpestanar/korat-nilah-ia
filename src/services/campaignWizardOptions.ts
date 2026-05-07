/**
 * ===========================================
 * Campaign Wizard Options v2
 * ===========================================
 * Opciones expandidas para el sistema de campañas con IA
 */

import {
    WizardOption,
    WizardStepConfig,
    ObjectiveType,
    SegmentType,
    PromoType,
    EmotionalTriggerType,
    ToneType,
    TimingType,
} from '../types/campaignBuilderTypes';

// ============================================
// PASO 1: OBJETIVOS DE NEGOCIO
// ============================================
export const OBJECTIVE_OPTIONS: WizardOption[] = [
    {
        id: 'llenar_agenda',
        value: 'llenar_agenda',
        label: 'Llenar mi agenda',
        icon: '📅',
        description: 'Tengo espacios vacíos que quiero ocupar esta semana',
        isRecommended: true,
        recommendationReason: 'Detectamos espacios vacíos en tu agenda',
    },
    {
        id: 'recuperar_inactivos',
        value: 'recuperar_inactivos',
        label: 'Recuperar clientas perdidas',
        icon: '💔',
        description: 'Traer de vuelta a quienes dejaron de venir',
    },
    {
        id: 'aumentar_ticket',
        value: 'aumentar_ticket',
        label: 'Aumentar ticket promedio',
        icon: '💰',
        description: 'Que cada visita genere más ingresos',
    },
    {
        id: 'captar_nuevos',
        value: 'captar_nuevos',
        label: 'Atraer clientas nuevas',
        icon: '🌟',
        description: 'Crecer mi base de clientes',
    },
    {
        id: 'fidelizar_vip',
        value: 'fidelizar_vip',
        label: 'Premiar a mis VIP',
        icon: '👑',
        description: 'Mantener felices a las mejores clientas',
    },
    {
        id: 'evento_especial',
        value: 'evento_especial',
        label: 'Fecha especial',
        icon: '🎉',
        description: 'San Valentín, Día de la Madre, etc.',
    },
    {
        id: 'lanzar_servicio',
        value: 'lanzar_servicio',
        label: 'Lanzar nuevo servicio',
        icon: '✨',
        description: 'Dar a conocer algo nuevo',
    },
    {
        id: 'liquidar_inventario',
        value: 'liquidar_inventario',
        label: 'Mover productos',
        icon: '📦',
        description: 'Vender productos en stock',
    },
];

// ============================================
// PASO 2: SEGMENTACIÓN DE CLIENTES
// ============================================
export const SEGMENT_OPTIONS: WizardOption[] = [
    {
        id: 'todas',
        value: 'todas',
        label: 'Toda mi base',
        icon: '👥',
        description: 'Enviar a todas las clientas registradas',
        count: 0, // Se calcula dinámicamente
    },
    {
        id: 'activas_frecuentes',
        value: 'activas_frecuentes',
        label: 'Frecuentes (VIP)',
        icon: '💎',
        description: '3+ visitas en últimos 3 meses',
        count: 0,
    },
    {
        id: 'activas_regulares',
        value: 'activas_regulares',
        label: 'Regulares',
        icon: '✨',
        description: '1-2 visitas en últimos 3 meses',
        count: 0,
    },
    {
        id: 'inactivas_30',
        value: 'inactivas_30',
        label: 'Sin venir 30+ días',
        icon: '⏰',
        description: 'Riesgo medio de pérdida',
        count: 0,
        isRecommended: true,
        recommendationReason: 'Tienen 23% más probabilidad de volver con incentivo',
    },
    {
        id: 'inactivas_60',
        value: 'inactivas_60',
        label: 'Sin venir 60+ días',
        icon: '😢',
        description: 'Alto riesgo - recuperar urgente',
        count: 0,
    },
    {
        id: 'inactivas_90',
        value: 'inactivas_90',
        label: 'Sin venir 90+ días',
        icon: '💀',
        description: 'Probablemente perdidas',
        count: 0,
    },
    {
        id: 'cumpleaneras',
        value: 'cumpleaneras',
        label: 'Cumpleañeras del mes',
        icon: '🎂',
        description: 'Clientas que cumplen años este mes',
        count: 0,
    },
    {
        id: 'nuevas_recientes',
        value: 'nuevas_recientes',
        label: 'Nuevas recientes',
        icon: '🌱',
        description: 'Primera visita últimos 30 días',
        count: 0,
    },
    {
        id: 'alto_valor',
        value: 'alto_valor',
        label: 'Alto LTV',
        icon: '👑',
        description: 'Gastan más de S/ 1,000/año',
        count: 0,
    },
    {
        id: 'servicio_especifico',
        value: 'servicio_especifico',
        label: 'Por servicio',
        icon: '💅',
        description: 'Clientas de un servicio específico',
        showInput: true,
        inputType: 'service',
    },
];

// ============================================
// PASO 3: TIPOS DE PROMOCIÓN
// ============================================
export const PROMO_OPTIONS: WizardOption[] = [
    // --- DESCUENTOS ---
    {
        id: 'descuento_10',
        value: 'descuento_10',
        label: '10% de descuento',
        icon: '🏷️',
        description: 'Descuento moderado, buen margen',
        suggestedFor: ['fidelizar_vip', 'aumentar_ticket'],
    },
    {
        id: 'descuento_15',
        value: 'descuento_15',
        label: '15% de descuento',
        icon: '🏷️',
        description: 'Descuento atractivo',
        suggestedFor: ['recuperar_inactivos'],
    },
    {
        id: 'descuento_20',
        value: 'descuento_20',
        label: '20% de descuento',
        icon: '🏷️',
        description: 'Descuento agresivo',
        suggestedFor: ['captar_nuevos', 'llenar_agenda'],
        isRecommended: true,
        recommendationReason: 'Mejor balance costo-conversión',
    },
    {
        id: 'descuento_monto',
        value: 'descuento_monto',
        label: 'Monto fijo OFF',
        icon: '💵',
        description: 'Ej: S/ 30 de descuento',
        showInput: true,
        inputType: 'amount',
    },
    // --- 2x1 y COMBOS ---
    {
        id: '2x1_amigas',
        value: '2x1_amigas',
        label: '2x1 con tu amiga',
        icon: '👯',
        description: 'Ella paga, tú invitas - ¡Atrae nuevas!',
        suggestedFor: ['captar_nuevos', 'llenar_agenda'],
    },
    {
        id: '3x2_servicios',
        value: '3x2_servicios',
        label: '3x2 en servicios',
        icon: '🎁',
        description: 'Paga 2, lleva 3',
        suggestedFor: ['aumentar_ticket'],
    },
    {
        id: 'combo_personalizado',
        value: 'combo_personalizado',
        label: 'Paquete/Combo',
        icon: '📦',
        description: 'Combina servicios a precio especial',
        suggestedFor: ['aumentar_ticket'],
    },
    // --- GRATIS / EXTRAS ---
    {
        id: 'servicio_gratis',
        value: 'servicio_gratis',
        label: 'Servicio gratis',
        icon: '🆓',
        description: 'Por compra de X, regalamos Y',
        showInput: true,
        inputType: 'service',
    },
    {
        id: 'upgrade_gratis',
        value: 'upgrade_gratis',
        label: 'Upgrade gratis',
        icon: '⬆️',
        description: 'Manicure simple → gel gratis',
    },
    {
        id: 'producto_gratis',
        value: 'producto_gratis',
        label: 'Producto de regalo',
        icon: '🎁',
        description: 'Por compra, lleva un producto',
        suggestedFor: ['liquidar_inventario'],
    },
    // --- PUNTOS ---
    {
        id: 'puntos_dobles',
        value: 'puntos_dobles',
        label: 'Puntos dobles',
        icon: '⭐',
        description: 'Acumula el doble esta semana',
        suggestedFor: ['fidelizar_vip'],
    },
    {
        id: 'puntos_triple',
        value: 'puntos_triple',
        label: 'Puntos triples',
        icon: '⭐',
        description: 'Solo por 48 horas',
    },
    // --- FLASH / URGENCIA ---
    {
        id: 'flash_24h',
        value: 'flash_24h',
        label: 'Flash 24 horas',
        icon: '⚡',
        description: 'Oferta ultra limitada',
        suggestedFor: ['llenar_agenda'],
    },
    {
        id: 'ultimos_espacios',
        value: 'ultimos_espacios',
        label: 'Últimos espacios',
        icon: '🔥',
        description: 'Solo quedan X turnos',
        suggestedFor: ['llenar_agenda'],
    },
    // --- ESPECIALES ---
    {
        id: 'exclusivo_whatsapp',
        value: 'exclusivo_whatsapp',
        label: 'Exclusivo WhatsApp',
        icon: '📱',
        description: 'Solo para quienes reciben este mensaje',
        suggestedFor: ['fidelizar_vip'],
    },
];

// ============================================
// PASO 4: DISPARADORES EMOCIONALES
// ============================================
export const EMOTIONAL_TRIGGER_OPTIONS: WizardOption[] = [
    {
        id: 'recompensa',
        value: 'recompensa',
        label: 'Recompensa',
        icon: '🎁',
        description: '"Te lo mereces después de tanto trabajo"',
        examples: [
            'Semana difícil? Consiéntete hoy',
            'Tú siempre das todo... ahora es tu turno'
        ],
    },
    {
        id: 'urgencia',
        value: 'urgencia',
        label: 'Urgencia Real',
        icon: '⏰',
        description: '"Solo quedan 3 espacios"',
        examples: [
            'Última oportunidad antes del finde',
            'Esta promo termina en 24 horas'
        ],
        isRecommended: true,
        recommendationReason: 'Aumenta conversión en 40%',
    },
    {
        id: 'exclusividad',
        value: 'exclusividad',
        label: 'Exclusividad VIP',
        icon: '👑',
        description: '"Solo para mis clientas especiales"',
        examples: [
            'Eres parte de mi círculo VIP',
            'Esto no lo comparto con cualquiera'
        ],
    },
    {
        id: 'nostalgia',
        value: 'nostalgia',
        label: 'Te extrañamos',
        icon: '💭',
        description: '"Hace tiempo que no vienes..."',
        examples: [
            'Te extrañamos por acá',
            'Tu silla está esperándote'
        ],
    },
    {
        id: 'prueba_social',
        value: 'prueba_social',
        label: 'Prueba Social',
        icon: '👯',
        description: '"Todas están viniendo para X"',
        examples: [
            'Ya 50 clientas reservaron para San Valentín',
            'El servicio más pedido esta semana'
        ],
    },
    {
        id: 'ocasion_especial',
        value: 'ocasion_especial',
        label: 'Ocasión Especial',
        icon: '🎉',
        description: '"Prepárate para tu gran día"',
        examples: [
            'Brilla en tu evento especial',
            'Tu cumpleaños merece un look increíble'
        ],
    },
    {
        id: 'mantenimiento',
        value: 'mantenimiento',
        label: 'Mantenimiento',
        icon: '✨',
        description: '"Ya toca tu retoque..."',
        examples: [
            'Hace 3 semanas de tu último tinte',
            '¿Cómo están esas uñas?'
        ],
    },
    {
        id: 'transformacion',
        value: 'transformacion',
        label: 'Transformación',
        icon: '🦋',
        description: '"Es momento de un cambio"',
        examples: [
            'Nuevo año, nuevo look',
            'Reinvéntate este mes'
        ],
    },
];

// ============================================
// PASO 5: TONOS DE COMUNICACIÓN
// ============================================
export const TONE_OPTIONS: WizardOption[] = [
    {
        id: 'amigable',
        value: 'amigable',
        label: 'Amigable',
        icon: '😊',
        description: 'Como hablarías con una amiga',
        examples: ['¡Hola guapa! ¿Cómo estás?'],
        isRecommended: true,
        recommendationReason: 'Mejor engagement en WhatsApp',
    },
    {
        id: 'profesional',
        value: 'profesional',
        label: 'Profesional',
        icon: '💼',
        description: 'Formal pero cálido',
        examples: ['Estimada María, esperamos que se encuentre bien'],
    },
    {
        id: 'divertido',
        value: 'divertido',
        label: 'Divertido',
        icon: '🎉',
        description: 'Con humor y emojis',
        examples: ['¿Lista para brillar? ✨💅🔥'],
    },
    {
        id: 'elegante',
        value: 'elegante',
        label: 'Elegante',
        icon: '💎',
        description: 'Premium y sofisticado',
        examples: ['Una experiencia de belleza única te espera'],
    },
    {
        id: 'directo',
        value: 'directo',
        label: 'Directo',
        icon: '🎯',
        description: 'Sin rodeos, claro y conciso',
        examples: ['Promo: 20% OFF solo hoy. ¿Te reservo?'],
    },
    {
        id: 'emotivo',
        value: 'emotivo',
        label: 'Emotivo',
        icon: '💕',
        description: 'Apela a los sentimientos',
        examples: ['Mereces sentirte hermosa...'],
    },
];

// ============================================
// PASO 6: TIMING
// ============================================
export const TIMING_OPTIONS: WizardOption[] = [
    {
        id: 'ahora',
        value: 'ahora',
        label: 'Enviar ahora',
        icon: '🚀',
        description: 'Lanzar inmediatamente',
    },
    {
        id: 'mejor_momento',
        value: 'mejor_momento',
        label: 'Mejor momento',
        icon: '⭐',
        description: 'IA recomienda según tu historial',
        isRecommended: true,
        recommendationReason: 'Basado en tu mejor tasa de apertura',
    },
    {
        id: 'antes_finde',
        value: 'antes_finde',
        label: 'Pre-fin de semana',
        icon: '🗓️',
        description: 'Jueves o viernes para reservas del weekend',
    },
    {
        id: 'inicio_semana',
        value: 'inicio_semana',
        label: 'Inicio de semana',
        icon: '📅',
        description: 'Lunes para planificación semanal',
    },
    {
        id: 'fecha_especifica',
        value: 'fecha_especifica',
        label: 'Fecha específica',
        icon: '📆',
        description: 'Elegir día y hora exacta',
        showInput: true,
        inputType: 'datetime',
    },
];

// ============================================
// CONFIGURACIÓN COMPLETA DEL WIZARD AVANZADO
// ============================================
export const WIZARD_STEPS_ADVANCED: WizardStepConfig[] = [
    {
        id: 1,
        title: 'Objetivo',
        question: '¿Qué quieres lograr con esta campaña?',
        nilahMessage: 'Entender tu objetivo me ayuda a crear el mensaje perfecto para ti.',
        options: OBJECTIVE_OPTIONS,
    },
    {
        id: 2,
        title: 'Público',
        question: '¿A quién va dirigida?',
        nilahMessage: 'Segmentar bien es clave. Te muestro cuántas clientas hay en cada grupo.',
        options: SEGMENT_OPTIONS,
    },
    {
        id: 3,
        title: 'Oferta',
        question: '¿Qué tipo de promoción quieres ofrecer?',
        nilahMessage: 'La promoción correcta puede duplicar tu conversión.',
        options: PROMO_OPTIONS,
    },
    {
        id: 4,
        title: 'Emoción',
        question: '¿Con qué emoción quieres conectar?',
        nilahMessage: 'El disparador emocional define si abren o ignoran el mensaje.',
        options: EMOTIONAL_TRIGGER_OPTIONS,
    },
    {
        id: 5,
        title: 'Tono',
        question: '¿Cómo quieres que suene el mensaje?',
        nilahMessage: 'El tono debe reflejar la personalidad de tu marca.',
        options: TONE_OPTIONS,
    },
    {
        id: 6,
        title: 'Timing',
        question: '¿Cuándo quieres enviar la campaña?',
        nilahMessage: 'El momento de envío puede aumentar tu tasa de respuesta en 25%.',
        options: TIMING_OPTIONS,
    },
];

// ============================================
// OPCIONES PARA MODO EXPRESS
// ============================================
export const EXPRESS_OBJECTIVE_OPTIONS: WizardOption[] = [
    {
        id: 'llenar_agenda',
        value: 'llenar_agenda',
        label: 'Llenar mi agenda esta semana',
        icon: '📅',
        description: 'Tengo espacios vacíos',
    },
    {
        id: 'recuperar_inactivos',
        value: 'recuperar_inactivos',
        label: 'Recuperar clientas perdidas',
        icon: '💔',
        description: 'Traer de vuelta a quienes no vienen',
    },
    {
        id: 'evento_especial',
        value: 'evento_especial',
        label: 'Fecha especial',
        icon: '🎉',
        description: 'Promoción para evento cercano',
    },
    {
        id: 'sorprendeme',
        value: 'sorprendeme',
        label: '✨ Sorpréndeme',
        icon: '🤖',
        description: 'La IA analiza todo y decide lo mejor',
        isRecommended: true,
        recommendationReason: 'La IA usa todos tus datos para crear la campaña perfecta',
    },
];

// ============================================
// MAPEO OBJETIVO -> SEGMENTO RECOMENDADO
// ============================================
export const OBJECTIVE_TO_SEGMENT: Record<string, SegmentType> = {
    'llenar_agenda': 'todas',
    'recuperar_inactivos': 'inactivas_30',
    'aumentar_ticket': 'activas_frecuentes',
    'captar_nuevos': 'todas',
    'fidelizar_vip': 'activas_frecuentes',
    'evento_especial': 'todas',
    'lanzar_servicio': 'activas_frecuentes',
    'liquidar_inventario': 'todas',
};

// ============================================
// MAPEO OBJETIVO -> PROMO RECOMENDADA
// ============================================
export const OBJECTIVE_TO_PROMO: Record<string, PromoType> = {
    'llenar_agenda': 'flash_24h',
    'recuperar_inactivos': 'descuento_20',
    'aumentar_ticket': 'combo_personalizado',
    'captar_nuevos': '2x1_amigas',
    'fidelizar_vip': 'exclusivo_whatsapp',
    'evento_especial': 'descuento_15',
    'lanzar_servicio': 'servicio_gratis',
    'liquidar_inventario': 'producto_gratis',
};

// ============================================
// MAPEO OBJETIVO -> DISPARADOR EMOCIONAL
// ============================================
export const OBJECTIVE_TO_TRIGGER: Record<string, EmotionalTriggerType> = {
    'llenar_agenda': 'urgencia',
    'recuperar_inactivos': 'nostalgia',
    'aumentar_ticket': 'exclusividad',
    'captar_nuevos': 'prueba_social',
    'fidelizar_vip': 'exclusividad',
    'evento_especial': 'ocasion_especial',
    'lanzar_servicio': 'transformacion',
    'liquidar_inventario': 'urgencia',
};
