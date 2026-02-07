/**
 * ===========================================
 * Campaign Builder Mock Data
 * ===========================================
 * Datos de prueba para el sistema de campañas
 */

import {
    CountryCode,
    KeyDate,
    WizardStepConfig,
    MonthCard,
    GeneratedCampaign,
    ContentIdea,
} from '../types/campaignBuilderTypes';

// ============================================
// FECHAS CLAVE POR PAÍS
// ============================================

// Helper para crear IDs únicos
const createId = (prefix: string, index: number) => `${prefix}-${index}`;

// Ideas de contenido genéricas por categoría
const createContentIdeas = (theme: string, category: string): ContentIdea[] => [
    {
        id: `${theme}-post`,
        title: `Post ${theme}`,
        type: 'post',
        description: `Publicación temática para ${theme}`,
        suggestedHashtags: [`#${theme.replace(/\s/g, '')}`, '#belleza', '#promocion'],
    },
    {
        id: `${theme}-promo`,
        title: `Promo ${theme}`,
        type: 'promo',
        description: `Oferta especial por ${theme}`,
    },
    {
        id: `${theme}-story`,
        title: `Story ${theme}`,
        type: 'story',
        description: `Historia interactiva para ${theme}`,
    },
];

// ============================================
// 🇵🇪 PERÚ - FECHAS CLAVE
// ============================================
export const PERU_KEY_DATES: KeyDate[] = [
    // ENERO
    {
        id: 'pe-01',
        date: '01-01',
        name: 'Año Nuevo',
        category: 'holiday',
        description: 'Inicio del año, perfecta para promociones de "Nuevo Año, Nueva Tú"',
        contentIdeas: createContentIdeas('Año Nuevo', 'holiday'),
    },
    // FEBRERO
    {
        id: 'pe-02',
        date: '02-14',
        name: 'San Valentín',
        category: 'commercial',
        description: 'Día del amor, ideal para promos de parejas y self-love',
        contentIdeas: [
            { id: 'sv-1', title: '💕 Date Night Ready', type: 'promo', description: 'Paquete parejas: Manicura + Pedicura para dos' },
            { id: 'sv-2', title: '💖 Self-Love Day', type: 'post', description: 'Consiéntete, mereces brillar' },
            { id: 'sv-3', title: '💝 Regalo de Amor', type: 'whatsapp', description: 'Gift cards para regalar bienestar' },
        ],
    },
    // MARZO
    {
        id: 'pe-03',
        date: '03-08',
        name: 'Día Internacional de la Mujer',
        category: 'commercial',
        description: 'Celebración de la mujer, promociones especiales',
        contentIdeas: [
            { id: 'dm-1', title: '👑 Celebra tu Belleza', type: 'promo', description: 'Descuento especial para todas las reinas' },
            { id: 'dm-2', title: '💪 Mujer Empoderada', type: 'story', description: 'Historias de nuestras clientas' },
        ],
    },
    // ABRIL
    {
        id: 'pe-04',
        date: '04-17',
        name: 'Semana Santa',
        category: 'holiday',
        description: 'Semana de reflexión, spa y relax',
        isVariable: true,
        variableRule: 'Domingo de Pascua - puede variar entre marzo y abril',
        contentIdeas: createContentIdeas('Semana Santa', 'holiday'),
    },
    // MAYO
    {
        id: 'pe-05a',
        date: '05-01',
        name: 'Día del Trabajo',
        category: 'holiday',
        description: 'Feriado largo, ideal para tratamientos de relax',
        contentIdeas: createContentIdeas('Día del Trabajo', 'holiday'),
    },
    {
        id: 'pe-05b',
        date: '05-11',
        name: 'Día de la Madre',
        category: 'commercial',
        description: 'Una de las fechas más importantes del año',
        isVariable: true,
        variableRule: '2do domingo de mayo',
        contentIdeas: [
            { id: 'mom-1', title: '👩‍👧 Mamá Merece Brillar', type: 'promo', description: 'Pack especial para consentir a mamá' },
            { id: 'mom-2', title: '💐 Regalo para Mamá', type: 'whatsapp', description: 'Gift cards con mensaje personalizado' },
            { id: 'mom-3', title: '👑 Reina del Hogar', type: 'post', description: 'Sorteo especial día de la madre' },
        ],
    },
    // JUNIO
    {
        id: 'pe-06',
        date: '06-15',
        name: 'Día del Padre',
        category: 'commercial',
        description: 'Servicios para hombres o gift cards',
        isVariable: true,
        variableRule: '3er domingo de junio',
        contentIdeas: [
            { id: 'dad-1', title: '👨 Papá También se Cuida', type: 'promo', description: 'Servicios de barbería y spa' },
            { id: 'dad-2', title: '🎁 Regala a Papá', type: 'whatsapp', description: 'Gift cards para que papá se relaje' },
        ],
    },
    // JULIO
    {
        id: 'pe-07a',
        date: '07-28',
        name: 'Día de la Independencia',
        category: 'holiday',
        description: 'Fiestas Patrias - Look patrio',
        contentIdeas: [
            { id: 'peru-1', title: '🇵🇪 Uñas Bicolor', type: 'post', description: 'Diseños con los colores de Perú' },
            { id: 'peru-2', title: '❤️ Orgullo Peruano', type: 'story', description: 'Celebremos nuestra patria con estilo' },
            { id: 'peru-3', title: '🎉 Promo Patria', type: 'promo', description: 'Descuento por Fiestas Patrias' },
        ],
    },
    {
        id: 'pe-07b',
        date: '07-29',
        name: 'Fiestas Patrias',
        category: 'holiday',
        description: 'Segundo día de celebración nacional',
        contentIdeas: createContentIdeas('Fiestas Patrias', 'holiday'),
    },
    // AGOSTO
    {
        id: 'pe-08',
        date: '08-30',
        name: 'Santa Rosa de Lima',
        category: 'holiday',
        description: 'Feriado religioso',
        contentIdeas: createContentIdeas('Santa Rosa', 'holiday'),
    },
    // OCTUBRE
    {
        id: 'pe-10a',
        date: '10-08',
        name: 'Combate de Angamos',
        category: 'holiday',
        description: 'Feriado cívico',
        contentIdeas: createContentIdeas('Feriado', 'holiday'),
    },
    {
        id: 'pe-10b',
        date: '10-31',
        name: 'Día de la Canción Criolla / Halloween',
        category: 'cultural',
        description: 'Doble celebración: criolla y Halloween',
        contentIdeas: [
            { id: 'hal-1', title: '🎃 Uñas de Halloween', type: 'post', description: 'Diseños terroríficamente lindos' },
            { id: 'hal-2', title: '🎸 Look Criollo', type: 'story', description: 'Elegancia peruana para la jarana' },
        ],
    },
    // NOVIEMBRE
    {
        id: 'pe-11a',
        date: '11-01',
        name: 'Día de Todos los Santos',
        category: 'holiday',
        description: 'Feriado religioso',
        contentIdeas: createContentIdeas('Todos los Santos', 'holiday'),
    },
    {
        id: 'pe-11b',
        date: '11-29',
        name: 'Black Friday',
        category: 'commercial',
        description: 'Día de ofertas masivas',
        isVariable: true,
        variableRule: 'Último viernes de noviembre',
        contentIdeas: [
            { id: 'bf-1', title: '🖤 Black Friday Beauty', type: 'promo', description: 'Los mejores descuentos del año' },
            { id: 'bf-2', title: '⚡ Flash Sale', type: 'whatsapp', description: 'Solo 24 horas de locura' },
        ],
    },
    // DICIEMBRE
    {
        id: 'pe-12a',
        date: '12-08',
        name: 'Inmaculada Concepción',
        category: 'holiday',
        description: 'Feriado religioso',
        contentIdeas: createContentIdeas('Inmaculada', 'holiday'),
    },
    {
        id: 'pe-12b',
        date: '12-24',
        name: 'Nochebuena',
        category: 'holiday',
        description: 'Preparación para Navidad',
        contentIdeas: [
            { id: 'xmas-1', title: '✨ Brilla en Navidad', type: 'promo', description: 'Último momento para lucir perfecta' },
            { id: 'xmas-2', title: '🎄 Look Navideño', type: 'post', description: 'Uñas y maquillaje festivo' },
        ],
    },
    {
        id: 'pe-12c',
        date: '12-25',
        name: 'Navidad',
        category: 'holiday',
        description: 'Celebración navideña',
        contentIdeas: createContentIdeas('Navidad', 'holiday'),
    },
    {
        id: 'pe-12d',
        date: '12-31',
        name: 'Año Nuevo',
        category: 'commercial',
        description: 'Cierre de año con estilo',
        contentIdeas: [
            { id: 'ny-1', title: '🎆 Cierra el Año con Glamour', type: 'promo', description: 'Paquete completo para recibir el año' },
            { id: 'ny-2', title: '✨ Último Look del Año', type: 'whatsapp', description: 'Reserva tu cita de fin de año' },
        ],
    },
];

// ============================================
// 🇲🇽 MÉXICO - FECHAS CLAVE
// ============================================
export const MEXICO_KEY_DATES: KeyDate[] = [
    { id: 'mx-01', date: '01-01', name: 'Año Nuevo', category: 'holiday', description: 'Inicio del año', contentIdeas: createContentIdeas('Año Nuevo', 'holiday') },
    { id: 'mx-02', date: '02-14', name: 'Día del Amor y la Amistad', category: 'commercial', description: 'San Valentín mexicano', contentIdeas: createContentIdeas('San Valentín', 'commercial') },
    { id: 'mx-03', date: '03-08', name: 'Día de la Mujer', category: 'commercial', description: 'Celebración de la mujer', contentIdeas: createContentIdeas('Día de la Mujer', 'commercial') },
    { id: 'mx-05a', date: '05-05', name: 'Batalla de Puebla', category: 'holiday', description: 'Celebración patria', contentIdeas: createContentIdeas('5 de Mayo', 'holiday') },
    { id: 'mx-05b', date: '05-10', name: 'Día de las Madres', category: 'commercial', description: 'Fecha fija en México', contentIdeas: createContentIdeas('Día de la Madre', 'commercial') },
    { id: 'mx-09', date: '09-16', name: 'Día de la Independencia', category: 'holiday', description: 'Fiestas Patrias', contentIdeas: createContentIdeas('Independencia', 'holiday') },
    { id: 'mx-11a', date: '11-01', name: 'Día de Muertos', category: 'cultural', description: 'Tradición mexicana', contentIdeas: createContentIdeas('Día de Muertos', 'cultural') },
    { id: 'mx-11b', date: '11-02', name: 'Día de los Fieles Difuntos', category: 'cultural', description: 'Continuación Día de Muertos', contentIdeas: createContentIdeas('Día de Muertos', 'cultural') },
    { id: 'mx-11c', date: '11-20', name: 'Revolución Mexicana', category: 'holiday', description: 'Feriado cívico', contentIdeas: createContentIdeas('Revolución', 'holiday') },
    { id: 'mx-12a', date: '12-12', name: 'Día de la Virgen de Guadalupe', category: 'holiday', description: 'Fecha religiosa importante', contentIdeas: createContentIdeas('Guadalupe', 'holiday') },
    { id: 'mx-12b', date: '12-25', name: 'Navidad', category: 'holiday', description: 'Celebración navideña', contentIdeas: createContentIdeas('Navidad', 'holiday') },
];

// ============================================
// 🇨🇴 COLOMBIA - FECHAS CLAVE
// ============================================
export const COLOMBIA_KEY_DATES: KeyDate[] = [
    { id: 'co-01', date: '01-01', name: 'Año Nuevo', category: 'holiday', description: 'Inicio del año', contentIdeas: createContentIdeas('Año Nuevo', 'holiday') },
    { id: 'co-02', date: '02-14', name: 'Día de San Valentín', category: 'commercial', description: 'Día del amor', contentIdeas: createContentIdeas('San Valentín', 'commercial') },
    { id: 'co-03', date: '03-08', name: 'Día de la Mujer', category: 'commercial', description: 'Celebración de la mujer', contentIdeas: createContentIdeas('Día de la Mujer', 'commercial') },
    { id: 'co-05', date: '05-11', name: 'Día de la Madre', category: 'commercial', description: '2do domingo de mayo', isVariable: true, contentIdeas: createContentIdeas('Día de la Madre', 'commercial') },
    { id: 'co-06', date: '06-15', name: 'Día del Padre', category: 'commercial', description: '3er domingo de junio', isVariable: true, contentIdeas: createContentIdeas('Día del Padre', 'commercial') },
    { id: 'co-07', date: '07-20', name: 'Día de la Independencia', category: 'holiday', description: 'Grito de independencia', contentIdeas: createContentIdeas('Independencia', 'holiday') },
    { id: 'co-08', date: '08-07', name: 'Batalla de Boyacá', category: 'holiday', description: 'Feriado patrio', contentIdeas: createContentIdeas('Boyacá', 'holiday') },
    { id: 'co-10', date: '10-31', name: 'Halloween', category: 'cultural', description: 'Día de brujas', contentIdeas: createContentIdeas('Halloween', 'cultural') },
    { id: 'co-12', date: '12-25', name: 'Navidad', category: 'holiday', description: 'Celebración navideña', contentIdeas: createContentIdeas('Navidad', 'holiday') },
];

// ============================================
// 🇦🇷 ARGENTINA - FECHAS CLAVE
// ============================================
export const ARGENTINA_KEY_DATES: KeyDate[] = [
    { id: 'ar-01', date: '01-01', name: 'Año Nuevo', category: 'holiday', description: 'Inicio del año', contentIdeas: createContentIdeas('Año Nuevo', 'holiday') },
    { id: 'ar-02', date: '02-14', name: 'San Valentín', category: 'commercial', description: 'Día del amor', contentIdeas: createContentIdeas('San Valentín', 'commercial') },
    { id: 'ar-03', date: '03-08', name: 'Día de la Mujer', category: 'commercial', description: 'Celebración de la mujer', contentIdeas: createContentIdeas('Día de la Mujer', 'commercial') },
    { id: 'ar-05', date: '05-25', name: 'Revolución de Mayo', category: 'holiday', description: 'Feriado patrio', contentIdeas: createContentIdeas('25 de Mayo', 'holiday') },
    { id: 'ar-06', date: '06-20', name: 'Día de la Bandera', category: 'holiday', description: 'Feriado patrio', contentIdeas: createContentIdeas('Día de la Bandera', 'holiday') },
    { id: 'ar-07a', date: '07-09', name: 'Día de la Independencia', category: 'holiday', description: 'Fiestas Patrias', contentIdeas: createContentIdeas('Independencia', 'holiday') },
    { id: 'ar-07b', date: '07-21', name: 'Día del Amigo', category: 'commercial', description: 'Celebración única de Argentina', contentIdeas: createContentIdeas('Día del Amigo', 'commercial') },
    { id: 'ar-10', date: '10-16', name: 'Día de la Madre', category: 'commercial', description: '3er domingo de octubre', isVariable: true, contentIdeas: createContentIdeas('Día de la Madre', 'commercial') },
    { id: 'ar-12', date: '12-25', name: 'Navidad', category: 'holiday', description: 'Celebración navideña', contentIdeas: createContentIdeas('Navidad', 'holiday') },
];

// ============================================
// MAPA DE FECHAS POR PAÍS
// ============================================
export const KEY_DATES_BY_COUNTRY: Record<CountryCode, KeyDate[]> = {
    PE: PERU_KEY_DATES,
    MX: MEXICO_KEY_DATES,
    CO: COLOMBIA_KEY_DATES,
    AR: ARGENTINA_KEY_DATES,
    CL: PERU_KEY_DATES, // Similar a Perú por ahora
    EC: PERU_KEY_DATES, // Similar a Perú por ahora
    US: [], // TODO: Agregar fechas de USA
    ES: [], // TODO: Agregar fechas de España
};

// ============================================
// CONFIGURACIÓN DEL WIZARD
// ============================================
export const WIZARD_STEPS: WizardStepConfig[] = [
    {
        id: 1,
        title: 'Objetivo',
        question: '¿Cuál es tu objetivo principal este mes?',
        nilahMessage: 'Entender tu objetivo me ayuda a sugerirte la estrategia perfecta. ¿Qué quieres lograr?',
        options: [
            {
                id: 'sales',
                value: 'sales',
                label: 'Más Ventas',
                icon: '💰',
                description: 'Aumentar los ingresos del mes con promociones atractivas',
                isRecommended: false,
            },
            {
                id: 'new_clients',
                value: 'new_clients',
                label: 'Nuevos Clientes',
                icon: '👥',
                description: 'Atraer clientes que nunca han visitado tu negocio',
                isRecommended: true,
                recommendationReason: 'Las fechas especiales son ideales para captar nuevos clientes',
            },
            {
                id: 'recover_inactive',
                value: 'recover_inactive',
                label: 'Recuperar Inactivos',
                icon: '🔄',
                description: 'Traer de vuelta a clientes que no han venido en un tiempo',
                isRecommended: false,
            },
        ],
    },
    {
        id: 2,
        title: 'Tono',
        question: '¿Cómo quieres que suene tu mensaje?',
        nilahMessage: 'El tono define la personalidad de tu campaña. Elige el que mejor represente tu marca.',
        options: [
            {
                id: 'fun',
                value: 'fun',
                label: 'Divertido',
                icon: '🎉',
                description: 'Alegre, con emojis, cercano y juvenil',
                isRecommended: false,
            },
            {
                id: 'elegant',
                value: 'elegant',
                label: 'Elegante',
                icon: '💎',
                description: 'Sofisticado, premium, exclusivo',
                isRecommended: true,
                recommendationReason: 'Tu marca proyecta calidad y exclusividad',
            },
            {
                id: 'emotional',
                value: 'emotional',
                label: 'Emocional',
                icon: '❤️',
                description: 'Conecta con sentimientos, historias, cercanía',
                isRecommended: false,
            },
        ],
    },
    {
        id: 3,
        title: 'Promoción',
        question: '¿Qué tipo de oferta quieres ofrecer?',
        nilahMessage: 'La promoción es el gancho que atraerá a tus clientes. ¿Cuál prefieres?',
        options: [
            {
                id: 'discount',
                value: 'discount',
                label: 'Descuento %',
                icon: '🏷️',
                description: '10%, 20%, 30% de descuento directo',
                isRecommended: false,
            },
            {
                id: 'bundle',
                value: 'bundle',
                label: '2x1 / Paquete',
                icon: '🎁',
                description: 'Trae a un amigo, combos especiales',
                isRecommended: true,
                recommendationReason: 'Los paquetes generan mayor ticket promedio',
            },
            {
                id: 'flash_sale',
                value: 'flash_sale',
                label: 'Flash Sale',
                icon: '⏰',
                description: 'Oferta por tiempo limitado (24-48hrs)',
                isRecommended: false,
            },
        ],
    },
    {
        id: 4,
        title: 'Canal',
        question: '¿Por dónde quieres enviar tu campaña?',
        nilahMessage: 'Cada canal tiene sus ventajas. Te recomiendo según tu audiencia.',
        options: [
            {
                id: 'whatsapp',
                value: 'whatsapp',
                label: 'WhatsApp',
                icon: '📱',
                description: 'Mensaje directo, alta tasa de apertura',
                isRecommended: true,
                recommendationReason: '95% de tus clientes responden por WhatsApp',
            },
            {
                id: 'instagram',
                value: 'instagram',
                label: 'Instagram Post/Story',
                icon: '📸',
                description: 'Post en feed o historia con alcance orgánico',
                isRecommended: false,
            },
            {
                id: 'reels',
                value: 'reels',
                label: 'Reel/TikTok',
                icon: '🎬',
                description: 'Video corto viral para máximo alcance',
                isRecommended: false,
                recommendationReason: 'Los reels tienen 2x más alcance que posts estáticos',
            },
        ],
    },
    {
        id: 5,
        title: 'Fecha',
        question: '¿Cuándo quieres lanzar la campaña?',
        nilahMessage: 'Te sugiero fechas estratégicas basadas en el calendario del mes.',
        options: [], // Se llenarán dinámicamente con las fechas del mes
    },
];

// ============================================
// HELPER: Obtener tarjetas del mes
// ============================================
export const generateMonthCards = (country: CountryCode): MonthCard[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const cards: MonthCard[] = [];
    const keyDates = KEY_DATES_BY_COUNTRY[country] || [];

    for (let i = 0; i < 3; i++) {
        let month = currentMonth + i;
        let year = currentYear;

        if (month > 11) {
            month = month - 12;
            year = currentYear + 1;
        }

        // Filtrar fechas del mes
        const monthDates = keyDates.filter(date => {
            const [mm] = date.date.split('-');
            return parseInt(mm) === month + 1;
        });

        cards.push({
            month,
            year,
            status: i === 0 ? 'active' : i === 1 ? 'planning' : 'preview',
            keyDates: monthDates,
            weeks: [],  // Se genera dinámicamente por IA
            campaignsCreated: 0,
            campaignsPending: monthDates.length,
        });
    }

    return cards;
};

// ============================================
// MOCK: Campañas de ejemplo
// ============================================
export const MOCK_USER_CAMPAIGNS: GeneratedCampaign[] = [
    {
        id: 'camp-001',
        monthCard: { month: 11, year: 2024 }, // Diciembre
        choices: {
            objective: 'aumentar_ticket',
            segment: 'todas',
            promo: 'combo_personalizado',
            emotionalTrigger: 'ocasion_especial',
            tone: 'elegante',
            timing: 'fecha_especifica',
            channel: 'whatsapp',
            launchDate: '2024-12-20',
            keyDateId: 'pe-12b',
        },
        title: 'Pack Navideño Especial',
        message: '✨ Esta Navidad, regálate bienestar. Pack completo: Manicura + Pedicura + Facial a solo S/150 (antes S/195). 🎄 Reserva ahora y brilla en Nochebuena.',
        estimatedReach: 150,
        estimatedRevenue: 2250,
        status: 'scheduled',
        scheduledDate: '2024-12-20T09:00:00',
        createdAt: '2024-12-15T14:30:00',
        keyDateName: 'Navidad',
    },
];

// ============================================
// NOMBRES DE MESES EN ESPAÑOL
// ============================================
export const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
