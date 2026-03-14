import { LucideIcon, Calendar, Users, Crown, MessageCircle, Megaphone, BarChart3, Settings, Lightbulb, PlayCircle, BookOpen, Bot, Image } from 'lucide-react';

export type ArticleType = 'doc' | 'masterclass' | 'video';

export interface KBArticle {
    id: string;
    title: string;
    excerpt: string;
    type: ArticleType;
    readTime: string;
    content: string; // This can be HTML or Markdown later, keeping simple string for now
    proTip?: string; // Nilah's Pro Tip
}

export interface KBCategory {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: {
        bg: string;
        text: string;
        border: string;
    };
    articles: KBArticle[];
}

export const kbData: KBCategory[] = [
    {
        id: 'agenda',
        title: 'Agenda y Citas',
        description: 'Gestión eficiente de tu calendario y reservas',
        icon: Calendar,
        color: { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' },
        articles: [
            {
                id: 'agenda-bloqueo',
                title: 'Cómo bloquear horas para descansos',
                excerpt: 'Aprende a gestionar tu disponibilidad y la de tu equipo.',
                type: 'doc',
                readTime: '2 min',
                content: `
          <h3>Bloquear Horarios</h3>
          <p>Para bloquear una hora en tu agenda, sigue estos pasos:</p>
          <ol>
            <li>Ve a la pestaña <b>Agenda</b> en el menú principal.</li>
            <li>Haz clic en el horario libre que deseas bloquear.</li>
            <li>Selecciona la opción <b>Bloquear Horario</b> en el menú desplegable.</li>
            <li>Ingresa el motivo (ej. Almuerzo, Reunión) y la duración.</li>
            <li>Guarda los cambios.</li>
          </ol>
          <p>Tus clientes no podrán agendar citas durante ese bloque de tiempo de forma online, y tu equipo sabrá que ese espacio no está disponible.</p>
        `,
                proTip: "Bloquea siempre 15 minutos entre clientes para limpieza y orden de tu estación. ¡La primera impresión es clave para retener a clientes nuevos!"
            },
            {
                id: 'agenda-masterclass-no-shows',
                title: 'Estrategia anti No-Shows',
                excerpt: 'Cómo reducir las inasistencias a casi cero usando psicología simple.',
                type: 'masterclass',
                readTime: '4 min',
                content: `
          <h3>El problema de las inasistencias</h3>
          <p>Las sillas vacías son el principal enemigo de la rentabilidad de un salón. Pero no todos los No-Shows son por falta de respeto; a veces es solo olvido.</p>
          
          <h3>Estrategia de 3 pasos:</h3>
          <ol>
            <li><b>Recordatorio automático 24h antes:</b> Usa el módulo de Engagement para que Korat envíe un WhatsApp con opción a confirmar/cancelar.</li>
            <li><b>Penalidad amable:</b> Si un cliente nuevo no asiste, su próxima cita debe requerir un depósito del 30%. Haz que esto sea una política visible.</li>
            <li><b>El mensaje de \"Te extrañamos\":</b> 15 minutos después de un no-show, Nilah puede enviar un mensaje preguntando si todo está bien. Muchas veces la vergüenza hace que reagenden de inmediato.</li>
          </ol>
        `,
                proTip: "Si cobras por adelantado o pides tarjeta en garantía, verás que tus inasistencias caen un 80% desde el día uno."
            }
        ]
    },
    {
        id: 'crm',
        title: 'CRM y Clientes',
        description: 'Conoce y gestiona la información de tus clientes',
        icon: Users,
        color: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' },
        articles: [
            {
                id: 'crm-etiquetas',
                title: 'Uso de Etiquetas (Tags)',
                excerpt: 'Clasifica a tus clientes por preferencias o comportamiento.',
                type: 'doc',
                readTime: '2 min',
                content: `
          <h3>Clasifica para vender mejor</h3>
          <p>Las etiquetas son fundamentales para segmentar tu base de datos y lanzar campañas de marketing más efectivas.</p>
          <ul>
            <li><b>Preferencias:</b> (ej. Vegano, Tintura sin amoníaco, Alergias).</li>
            <li><b>Comportamiento:</b> (ej. Llega tarde, Compra productos, Vip).</li>
          </ul>
          <p>Para añadir una etiqueta, entra al perfil del cliente desde la sección <b>CRM</b> y haz clic en el campo \"Añadir Etiqueta\".</p>
        `,
                proTip: "Usa la etiqueta \"Café con leche de almendras\" o \"Charla mucho\". Anotar pequeños detalles personales hace que el cliente se sienta como en casa y aumente la lealtad drásticamente."
            },
            {
                id: 'crm-masterclass-ltv',
                title: 'Entendiendo el Life-Time Value (LTV)',
                excerpt: 'Por qué un cliente no vale lo de su corte de hoy.',
                type: 'masterclass',
                readTime: '3 min',
                content: `
          <h3>¿Qué es el LTV?</h3>
          <p>LTV (Life-Time Value o Valor de Vida del Cliente) es la métrica más importante de tu salón. No se trata de cuánto gastó hoy (S/50), sino de cuánto gastará en su vida si se queda contigo.</p>
          <p><i>Ejemplo:</i> Si alguien gasta S/100 al mes y se queda contigo 3 años, su LTV es de <b>S/3,600</b>. ¡Ese es su verdadero valor!</p>
          <h3>¿Cómo usar este número?</h3>
          <p>Si sabes que un cliente VIP vale S/3,600, entonces gastar S/20 regalándole un tratamiento el día de su cumpleaños es la mejor inversión que puedes hacer. Nunca mires la transacción única, mira la relación a largo plazo.</p>
        `,
                proTip: "Revisa siempre la columna de LTV en tu vista de CRM. Los clientes con el LTV más alto son a los que NUNCA debes dejar ir."
            }
        ]
    },
    {
        id: 'fidelizacion',
        title: 'Fidelización',
        description: 'Programas de puntos y niveles VIP',
        icon: Crown,
        color: { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' },
        articles: [
            {
                id: 'fid-puntos',
                title: 'Cómo configurar el canje de puntos',
                excerpt: 'Guía técnica para configurar las reglas de tu programa.',
                type: 'doc',
                readTime: '2 min',
                content: `
          <h3>Configura las reglas de tu juego</h3>
          <p>Ve a <b>Fidelización > Configurar Reglas</b>. Aquí podrás decidir a cuánto equivale 1 punto.</p>
          <ol>
            <li>Ingresa el valor de un punto en tu moneda local.</li>
            <li>Determina qué porcentaje del total del ticket se puede pagar usando puntos.</li>
            <li>Define servicios exclusivos que premian con puntos dobles en días fríos.</li>
          </ol>
        `,
                proTip: "No permitas canjear el 100% de un servicio con puntos. Permite un máximo del 50%, así siempre aseguras liquidez en caja."
            }
        ]
    },
    {
        id: 'engagement',
        title: 'Engagement',
        description: 'Automatizaciones y WhatsApp',
        icon: MessageCircle,
        color: { bg: 'bg-pink-500/10', text: 'text-pink-500', border: 'border-pink-500/20' },
        articles: [
            {
                id: 'eng-masterclass-rescate',
                title: 'El Arte de Rescatar Clientes',
                excerpt: 'Qué decirle a un cliente cuando lleva 60 días sin venir.',
                type: 'masterclass',
                readTime: '5 min',
                content: `
          <h3>Cuidado con los descuentos a la primera</h3>
          <p>Un error común es enviar inmediatamente "Te extrañamos, aquí tienes un 20%". Esto educa al cliente a esperar siempre a no ir para recibir ofertas.</p>
          <h3>El mensaje perfecto:</h3>
          <p><i>"Hola [Nombre], hace tiempo que no te vemos por [Nombre del Salón]. Pasaba a saludarte y asegurarme de que el balayage de tu última visita sigue increíble. Si necesitas un retoque, avísame y te busco un hueco con [Tu Nombre]."</i></p>
          <p>Es un mensaje de servicio, no de venta pura. Si no responde a eso en una semana, entonces sí, lanza una pequeña promoción de rescate del módulo de Korat.</p>
        `,
                proTip: "Usa el widget 'Oportunidades de Rescate 🛟' en tu Dashboard Operativo. Apunta siempre a los clientes en 'En Riesgo' antes de que pasen a estado 'Perdido'."
            }
        ]
    },
    {
        id: 'marketing',
        title: 'Marketing Mágico',
        description: 'Campañas inteligentes creadas por IA',
        icon: Megaphone,
        color: { bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' },
        articles: [
            {
                id: 'mkt-campana',
                title: 'Creando tu primera campaña de WhatsApp',
                excerpt: 'Lanza una campaña en 3 clics con Nilah IA.',
                type: 'doc',
                readTime: '3 min',
                content: `
          <h3>Magia en un botón</h3>
          <p>Ve a <b>Marketing</b>. Elige un objetivo de la lista inteligente de Nilah (ej. Promocionar Nuevo Tratamiento).</p>
          <p>Nilah generará el texto con emojis y tono persuasivo. Luego podrás seleccionar el segmento de clientes de tu CRM al que aplicar la campaña (ej. "Clientes VIP de Tintes"). Dale a Enviar, y nosotros nos encargamos del resto.</p>
        `,
                proTip: "Las campañas los jueves por la tarde (4 PM) tienen el mayor porcentaje de conversión para citas de fin de semana."
            }
        ]
    },
    {
        id: 'crecimiento',
        title: 'Métricas y Crecimiento',
        description: 'Entiende tus números y toma decisiones',
        icon: BarChart3,
        color: { bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' },
        articles: [
            {
                id: 'metrics-ticket-promedio',
                title: 'El Santo Grial: El Ticket Promedio',
                excerpt: 'Cómo subir las ventas sin conseguir clientes nuevos.',
                type: 'masterclass',
                readTime: '4 min',
                content: `
          <h3>¿Por qué importar más clientes si puedes vender más a los actuales?</h3>
          <p>El Ticket Promedio (Ingresos Totales / Número de Tickets) te dice cuánto gasta en promedio una persona cuando cruza tu puerta.</p>
          <h3>Tácticas para aumentarlo hoy:</h3>
          <ul>
            <li><b>Upselling de Lavacabezas:</b> "Por S/20 adicionales, te aplico una ampolla hidratante intensiva de 3 minutos. Tu cabello lo necesita".</li>
            <li><b>Cross-selling al cobrar:</b> Tener productos de <i>travel size</i> junto a la caja.</li>
            <li><b>Combos de servicios:</b> Vender "Color + Corte + Hidratación" por un precio de paquete, en lugar de servicios individuales.</li>
          </ul>
        `,
                proTip: "Revisa tu widget 'Cadence Predictor'. Si sabes qué suele venir a hacerse un cliente, ofrécele algo complementario antes de que siquiera llegue a la silla."
            }
        ]
    },
    {
        id: 'copilot',
        title: 'Nilah Copilot',
        description: 'Dirección ejecutiva y crecimiento omnicanal',
        icon: Bot,
        color: { bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' },
        articles: [
            {
                id: 'copilot-que-es',
                title: 'Qué hace Nilah Copilot por tu salón',
                excerpt: 'Cómo Nilah prioriza acciones para mejorar ingresos y salud del negocio.',
                type: 'doc',
                readTime: '3 min',
                content: `
          <h3>Copilot no es solo chat</h3>
          <p>Nilah Copilot analiza tu agenda, retención y ocupación para decirte <b>qué hacer hoy</b> con mayor impacto.</p>
          <ul>
            <li>Prioriza oportunidades por impacto económico.</li>
            <li>Propone tácticas concretas con botones de ejecución.</li>
            <li>Hace seguimiento del resultado para ajustar la estrategia.</li>
          </ul>
          <p>El objetivo es ayudarte a dirigir tu salón como empresaria, no solo operar citas.</p>
        `,
                proTip: "Si ejecutas al menos 2 acciones de Copilot por semana, tendrás datos suficientes para optimizar tu plan en el mes siguiente."
            },
            {
                id: 'copilot-creative',
                title: 'Creativo IA: imágenes y guiones',
                excerpt: 'Cómo generar piezas promocionales para WhatsApp, Instagram y Facebook.',
                type: 'masterclass',
                readTime: '4 min',
                content: `
          <h3>Tu motor creativo en minutos</h3>
          <p>En el plan Copilot puedes generar assets y propuestas de contenido sin empezar de cero:</p>
          <ol>
            <li>Imagen promocional para oferta puntual.</li>
            <li>Copy para post y WhatsApp.</li>
            <li>Idea y guion breve para video o reel.</li>
          </ol>
          <p>Si necesitas producción avanzada, Nilah crea un brief para escalar con el equipo humano de Korat Flow.</p>
        `,
                proTip: "Usa una sola campaña por semana con 3 formatos: WhatsApp + Story + Reel corto. La consistencia gana a la cantidad."
            }
        ]
    },
    {
        id: 'configuracion',
        title: 'Configuraciones',
        description: 'Personalización de tu cuenta',
        icon: Settings,
        color: { bg: 'bg-zinc-500/10', text: 'text-zinc-500', border: 'border-zinc-500/20' },
        articles: [
            {
                id: 'conf-staff',
                title: 'Gestión de Staff y Permisos',
                excerpt: 'Da acceso seguro a tus estilistas.',
                type: 'doc',
                readTime: '2 min',
                content: `
          <h3>Agrega a tu equipo</h3>
          <p>Dentro de <b>Configuración > Equipo</b> puedes invitar a tus empleados.</p>
          <p>Asigna un rol: <b>Admin</b> lo ve todo, <b>Staff</b> solo ve lo que tú configures. Usa los conmutadores para encender/apagar qué gráficas y funciones pueden ver en su App. Esto te protege de fugas de información financiera sensible.</p>
        `,
                proTip: "Oculta el Dashboard Financiero a tu staff, pero déjales ver el widget 'Ranking Semanal' para fomentar la competencia sana."
            }
        ]
    }
];
