/**
 * ============================================================
 * TIPOS PARA EL NUEVO GOD-MODE SUPER ADMIN — V2
 * ============================================================
 */

// ─── Plan base ───────────────────────────────────────────────
export type PlanBase = 'nilah' | 'korat' | 'copilot';
export type EstadoNegocio = 'activo' | 'trial' | 'suspendido' | 'cancelado';
export type BotModo = 'off' | 'on_demand' | 'automatico';
export type TipoFidelizacion = 'global' | 'staff';

// ─── Estructura de recursos_saas granular V2 ─────────────────

export interface ModuloConfig {
  activo: boolean;
  sub_pestanas?: Record<string, boolean>;
  widgets?: Record<string, boolean>;
}

export interface RecursosSaaSV2 {
  plan_base: PlanBase;
  bot: {
    modo: BotModo;
    nombre: string;
    personalidad: string;
  };
  automatizaciones?: {
    // 1. Rescate Automático (Retención 35/60/90)
    permitir_rescate: boolean;      // Super Admin: habilita el flujo para este negocio
    rescate_activo: boolean;        // Usuario: enciende/apaga el flujo cuando quiera

    // 2. Recordatorios de Cita (24h / 3h)
    permitir_recordatorios: boolean;
    recordatorios_activos: boolean;

    // 3. Recordatorios de Mantenimiento
    permitir_mantenimiento?: boolean;
    mantenimiento_activo?: boolean;

    // 4. Mensajes Post-Cita (Feedback/Calificación)
    permitir_post_cita?: boolean;
    post_cita_activo?: boolean;
  };
  modulos: {
    dashboard: ModuloConfig & {
      widgets: {
        kpi_citas: boolean;
        kpi_ingresos: boolean;
        kpi_clientes: boolean;
        chart_ocupacion: boolean;
        briefing_matutino: boolean;
        evening_summary: boolean;
        rescate_urgente: boolean;
        zona_copilot: boolean;
      };
    };
    agenda: ModuloConfig;
    engagement: ModuloConfig;
    inbox: ModuloConfig & {
      sub_pestanas: {
        conversaciones: boolean;
        asignaciones: boolean;
        historial_chat: boolean;
      };
    };
    crm: ModuloConfig & {
      sub_pestanas: {
        historial: boolean;
        segmentacion: boolean;
        rescate: boolean;
        feedback: boolean;
      };
    };
    finanzas: ModuloConfig & {
      widgets: {
        ingresos_chart: boolean;
        oracle_prediccion: boolean;
        ticket_promedio: boolean;
        top_servicios: boolean;
      };
    };
    marketing: ModuloConfig & {
      sub_pestanas: {
        campanas: boolean;
        audiencias: boolean;
        tuning_studio: boolean;
      };
    };
    nilah_creative: ModuloConfig & {
      widgets: {
        generador_flyers: boolean;
        galeria: boolean;
        copy_redes: boolean;
      };
    };
    crecimiento: ModuloConfig & {
      sub_pestanas: {
        pipeline: boolean;
        referidos: boolean;
        onboarding_clientes: boolean;
        metas: boolean;
        piloto_automatico: boolean;
      };
    };
    fidelizacion: ModuloConfig & {
      sub_pestanas: {
        puntos: boolean;
        premios: boolean;
        historial_canjes: boolean;
      };
    };
    analiticas: ModuloConfig & {
      sub_pestanas: {
        daily_briefing: boolean;
        zonas_muertas: boolean;
        kpis_avanzados: boolean;
      };
    };
    copilot: ModuloConfig & {
      sub_pestanas: {
        chat: boolean;
        voz: boolean;
        estrategia_semanal: boolean;
        rescue_vip: boolean;
      };
    };
    configuracion: ModuloConfig & {
      sub_pestanas: {
        negocio: boolean;
        horarios: boolean;
        staff: boolean;
        servicios: boolean;
        extras: boolean;
        integraciones: boolean;
        usuarios_adicionales: boolean;
      };
    };
  };
  limites: {
    max_staff: number;
    max_usuarios_adicionales: number;  // 0=sin acceso, -1=ilimitado
  };
  permisos_usuario: {
    puede_crear_usuarios: boolean;
    puede_editar_servicios: boolean;
    puede_ver_finanzas: boolean;
  };
}

// ─── Presets por plan ────────────────────────────────────────

export const PLAN_PRESET: Record<PlanBase, RecursosSaaSV2> = {
  nilah: {
    plan_base: 'nilah',
    bot: { modo: 'on_demand', nombre: 'Nilah', personalidad: 'amable y profesional' },
    automatizaciones: {
      permitir_rescate: false,    rescate_activo: false,
      permitir_recordatorios: false, recordatorios_activos: false,
      permitir_mantenimiento: false, mantenimiento_activo: false,
      permitir_post_cita: false,  post_cita_activo: false,
    },
    modulos: {
      dashboard: {
        activo: true,
        widgets: { kpi_citas: true, kpi_ingresos: true, kpi_clientes: true, chart_ocupacion: false, briefing_matutino: false, evening_summary: false, rescate_urgente: true, zona_copilot: false }
      },
      agenda: { activo: true },
      engagement: { activo: false },
      inbox: { activo: true, sub_pestanas: { conversaciones: true, asignaciones: false, historial_chat: false } },
      crm: { activo: true, sub_pestanas: { historial: true, segmentacion: false, rescate: true, feedback: false } },
      finanzas: { activo: true, widgets: { ingresos_chart: true, oracle_prediccion: false, ticket_promedio: false, top_servicios: false } },
      marketing: { activo: false, sub_pestanas: { campanas: false, audiencias: false, tuning_studio: false } },
      nilah_creative: { activo: false, widgets: { generador_flyers: false, galeria: false, copy_redes: false } },
      crecimiento: { activo: false, sub_pestanas: { pipeline: false, referidos: false, onboarding_clientes: false, metas: false, piloto_automatico: false } },
      fidelizacion: { activo: false, sub_pestanas: { puntos: false, premios: false, historial_canjes: false } },
      analiticas: { activo: false, sub_pestanas: { daily_briefing: false, zonas_muertas: false, kpis_avanzados: false } },
      copilot: { activo: false, sub_pestanas: { chat: false, voz: false, estrategia_semanal: false, rescue_vip: false } },
      configuracion: { activo: true, sub_pestanas: { negocio: true, horarios: true, staff: true, servicios: true, extras: true, integraciones: false, usuarios_adicionales: false } }
    },
    limites: { max_staff: 5, max_usuarios_adicionales: 0 },
    permisos_usuario: { puede_crear_usuarios: false, puede_editar_servicios: true, puede_ver_finanzas: true }
  },

  korat: {
    plan_base: 'korat',
    bot: { modo: 'automatico', nombre: 'Nilah', personalidad: 'amable y profesional' },
    automatizaciones: {
      permitir_rescate: false,    rescate_activo: false,
      permitir_recordatorios: false, recordatorios_activos: false,
      permitir_mantenimiento: false, mantenimiento_activo: false,
      permitir_post_cita: false,  post_cita_activo: false,
    },
    modulos: {
      dashboard: {
        activo: true,
        widgets: { kpi_citas: true, kpi_ingresos: true, kpi_clientes: true, chart_ocupacion: true, briefing_matutino: true, evening_summary: true, rescate_urgente: true, zona_copilot: false }
      },
      agenda: { activo: true },
      engagement: { activo: true },
      inbox: { activo: true, sub_pestanas: { conversaciones: true, asignaciones: true, historial_chat: true } },
      crm: { activo: true, sub_pestanas: { historial: true, segmentacion: true, rescate: true, feedback: true } },
      finanzas: { activo: true, widgets: { ingresos_chart: true, oracle_prediccion: true, ticket_promedio: true, top_servicios: true } },
      marketing: { activo: true, sub_pestanas: { campanas: true, audiencias: true, tuning_studio: true } },
      nilah_creative: { activo: true, widgets: { generador_flyers: true, galeria: true, copy_redes: true } },
      crecimiento: { activo: true, sub_pestanas: { pipeline: true, referidos: true, onboarding_clientes: true, metas: true, piloto_automatico: true } },
      fidelizacion: { activo: true, sub_pestanas: { puntos: true, premios: true, historial_canjes: true } },
      analiticas: { activo: true, sub_pestanas: { daily_briefing: true, zonas_muertas: true, kpis_avanzados: true } },
      copilot: { activo: false, sub_pestanas: { chat: false, voz: false, estrategia_semanal: false, rescue_vip: false } },
      configuracion: { activo: true, sub_pestanas: { negocio: true, horarios: true, staff: true, servicios: true, extras: true, integraciones: true, usuarios_adicionales: true } }
    },
    limites: { max_staff: 20, max_usuarios_adicionales: 3 },
    permisos_usuario: { puede_crear_usuarios: true, puede_editar_servicios: true, puede_ver_finanzas: true }
  },

  copilot: {
    plan_base: 'copilot',
    bot: { modo: 'automatico', nombre: 'Nilah', personalidad: 'amable y profesional' },
    automatizaciones: {
      permitir_rescate: false,    rescate_activo: false,
      permitir_recordatorios: false, recordatorios_activos: false,
      permitir_mantenimiento: false, mantenimiento_activo: false,
      permitir_post_cita: false,  post_cita_activo: false,
    },
    modulos: {
      dashboard: {
        activo: true,
        widgets: { kpi_citas: true, kpi_ingresos: true, kpi_clientes: true, chart_ocupacion: true, briefing_matutino: true, evening_summary: true, rescate_urgente: true, zona_copilot: true }
      },
      agenda: { activo: true },
      engagement: { activo: true },
      inbox: { activo: true, sub_pestanas: { conversaciones: true, asignaciones: true, historial_chat: true } },
      crm: { activo: true, sub_pestanas: { historial: true, segmentacion: true, rescate: true, feedback: true } },
      finanzas: { activo: true, widgets: { ingresos_chart: true, oracle_prediccion: true, ticket_promedio: true, top_servicios: true } },
      marketing: { activo: true, sub_pestanas: { campanas: true, audiencias: true, tuning_studio: true } },
      nilah_creative: { activo: true, widgets: { generador_flyers: true, galeria: true, copy_redes: true } },
      crecimiento: { activo: true, sub_pestanas: { pipeline: true, referidos: true, onboarding_clientes: true, metas: true, piloto_automatico: true } },
      fidelizacion: { activo: true, sub_pestanas: { puntos: true, premios: true, historial_canjes: true } },
      analiticas: { activo: true, sub_pestanas: { daily_briefing: true, zonas_muertas: true, kpis_avanzados: true } },
      copilot: { activo: true, sub_pestanas: { chat: true, voz: true, estrategia_semanal: true, rescue_vip: true } },
      configuracion: { activo: true, sub_pestanas: { negocio: true, horarios: true, staff: true, servicios: true, extras: true, integraciones: true, usuarios_adicionales: true } }
    },
    limites: { max_staff: 999, max_usuarios_adicionales: -1 },
    permisos_usuario: { puede_crear_usuarios: true, puede_editar_servicios: true, puede_ver_finanzas: true }
  }
};

// ─── Metadata visual de módulos ──────────────────────────────


export type ModuloKey = keyof RecursosSaaSV2['modulos'];

export interface ModuloMeta {
  label: string;
  emoji: string;
  desc: string;
  sub_pestanas?: Record<string, string>;
  widgets?: Record<string, string>;
  planes_incluidos: PlanBase[];
  // Roles que por defecto NO tienen acceso (Super Admin puede cambiarlo)
  roles_restringidos?: ('Staff' | 'Admin')[];
}

export const MODULOS_META: Record<ModuloKey, ModuloMeta> = {
  dashboard: {
    label: 'Dashboard',
    emoji: '🏠',
    desc: 'Widgets visibles en el panel principal del salón',
    widgets: {
      kpi_citas: 'KPI — Citas del mes',
      kpi_ingresos: 'KPI — Ingresos del mes',
      kpi_clientes: 'KPI — Clientes activos',
      chart_ocupacion: 'Gráfico de ocupación horaria',
      briefing_matutino: 'Briefing matutino IA (mañana)',
      evening_summary: 'Resumen nocturno IA (tarde)',
      rescate_urgente: 'Alerta de clientes en riesgo',
      zona_copilot: 'Zona Copilot (solo plan Copilot)',
    },
    planes_incluidos: ['nilah', 'korat', 'copilot'],
  },
  agenda: {
    label: 'Agenda',
    emoji: '📅',
    desc: 'Gestión de citas y disponibilidad',
    planes_incluidos: ['nilah', 'korat', 'copilot'],
  },
  engagement: {
    label: 'Engagement',
    emoji: '⚡',
    desc: 'Recordatorios auto y Calificaciones',
    planes_incluidos: ['korat', 'copilot'],
  },
  inbox: {
    label: 'Inbox WhatsApp',
    emoji: '💬',
    desc: 'Conversaciones WhatsApp, asignaciones y chat histórico',
    sub_pestanas: {
      conversaciones: 'Vista de conversaciones activas',
      asignaciones: 'Asignación a agentes',
      historial_chat: 'Historial completo de chats',
    },
    planes_incluidos: ['nilah', 'korat', 'copilot'],
  },
  crm: {
    label: 'CRM',
    emoji: '👥',
    desc: 'Clientes, historial y rescate',
    sub_pestanas: {
      historial: 'Historial de clientas',
      segmentacion: 'Segmentación dinámica',
      rescate: 'Sistema 35/60/90 días',
      feedback: 'Feedback post-cita',
    },
    planes_incluidos: ['nilah', 'korat', 'copilot'],
    roles_restringidos: ['Staff'],
  },
  finanzas: {
    label: 'Finanzas',
    emoji: '💰',
    desc: 'Dashboard de ingresos y proyecciones',
    widgets: {
      ingresos_chart: 'Gráfico de ingresos',
      oracle_prediccion: 'Oracle IA — predicción del mes',
      ticket_promedio: 'Ticket promedio',
      top_servicios: 'Top servicios más vendidos',
    },
    planes_incluidos: ['nilah', 'korat', 'copilot'],
    roles_restringidos: ['Staff'],
  },
  marketing: {
    label: 'Nilah Marketing',
    emoji: '📣',
    desc: 'Campañas WhatsApp, audiencias y copy',
    sub_pestanas: {
      campanas: 'Campañas mensuales',
      audiencias: 'Marketplace de audiencias',
      tuning_studio: 'Tuning Studio de copy',
    },
    planes_incluidos: ['korat', 'copilot'],
    roles_restringidos: ['Staff'],
  },
  nilah_creative: {
    label: 'Nilah Creative',
    emoji: '🎨',
    desc: 'Generador de flyers y creativos con IA',
    widgets: {
      generador_flyers: 'Generador de flyers IA',
      galeria: 'Galería de creativos guardados',
      copy_redes: 'Copy para redes sociales',
    },
    planes_incluidos: ['korat', 'copilot'],
    roles_restringidos: ['Staff'],
  },
  crecimiento: {
    label: 'Crecimiento',
    emoji: '🚀',
    desc: 'Analytics, ROI, Piloto Automático y más',
    sub_pestanas: {
      pipeline: 'Pipeline de nuevos clientes',
      referidos: 'Programa de referidos',
      onboarding_clientes: 'Onboarding de clientes',
      metas: 'Metas y objetivos',
      piloto_automatico: 'Piloto Automático (n8n)',
    },
    planes_incluidos: ['korat', 'copilot'],
    roles_restringidos: ['Staff'],
  },
  fidelizacion: {
    label: 'Fidelización',
    emoji: '⭐',
    desc: 'Puntos, premios y programa de lealtad',
    sub_pestanas: {
      puntos: 'Sistema de puntos',
      premios: 'Catálogo de premios',
      historial_canjes: 'Historial de canjes',
    },
    planes_incluidos: ['korat', 'copilot'],
  },
  analiticas: {
    label: 'Analíticas',
    emoji: '📊',
    desc: 'Daily Briefing IA, zonas muertas, KPIs',
    sub_pestanas: {
      daily_briefing: 'Daily Briefing matutino',
      zonas_muertas: 'Zonas muertas en agenda',
      kpis_avanzados: 'KPIs avanzados',
    },
    planes_incluidos: ['korat', 'copilot'],
    roles_restringidos: ['Staff'],
  },
  copilot: {
    label: 'Nilah Copilot',
    emoji: '🧠',
    desc: 'Asistente ejecutivo IA por texto y voz',
    sub_pestanas: {
      chat: 'Chat ejecutivo',
      voz: 'Control por voz',
      estrategia_semanal: 'Estrategia semanal',
      rescue_vip: 'Planes de rescate VIP',
    },
    planes_incluidos: ['copilot'],
    roles_restringidos: ['Staff'],
  },
  configuracion: {
    label: 'Configuración',
    emoji: '⚙️',
    desc: 'Sub-pestañas visibles en el panel del cliente',
    sub_pestanas: {
      negocio: 'Datos del negocio',
      horarios: 'Horarios y días',
      staff: 'Gestión de staff',
      servicios: 'Catálogo de servicios',
      extras: 'Precios extras',
      integraciones: 'Integraciones (WA, etc.)',
      usuarios_adicionales: 'Usuarios adicionales',
    },
    planes_incluidos: ['nilah', 'korat', 'copilot'],
  },
};

// ─── Permisos por defecto por rol ─────────────────────────────

export type RolUsuario = 'Dueno' | 'Admin' | 'Staff';

/**
 * Módulos que cada rol puede ver por defecto.
 * El Super Admin puede personalizar esto por usuario.
 */
export const PERMISOS_ROL_DEFECTO: Record<RolUsuario, Partial<Record<ModuloKey, boolean>>> = {
  Dueno: {
    dashboard: true, agenda: true, engagement: true, inbox: true, crm: true,
    finanzas: true, marketing: true, nilah_creative: true,
    crecimiento: true, fidelizacion: true, analiticas: true,
    copilot: true, configuracion: true,
  },
  Admin: {
    dashboard: true, agenda: true, engagement: true, inbox: true, crm: true,
    finanzas: true, marketing: true, nilah_creative: true,
    crecimiento: true, fidelizacion: true, analiticas: true,
    copilot: true, configuracion: true,
  },
  Staff: {
    // Staff solo ve agenda, inbox, fidelizacion (sin datos financieros por defecto)
    dashboard: true, agenda: true, engagement: true, inbox: true, crm: false,
    finanzas: false, marketing: false, nilah_creative: false,
    crecimiento: false, fidelizacion: true, analiticas: false,
    copilot: false, configuracion: false,
  },
};

// ─── Negocio (vista super admin) ─────────────────────────────

export interface NegocioAdmin {
  id: string;
  nombre: string;
  plan: PlanBase;
  estado: EstadoNegocio;
  recursos_saas: RecursosSaaSV2;
  tipo_fidelizacion: TipoFidelizacion;
  destellos_disponibles: number;
  destellos_limite_mensual: number;
  destellos_reset_fecha: string | null;
  fecha_registro: string;
  color_primario?: string;
  logo_url?: string;
  email_negocio?: string;
  telefono_recepcionista?: string;
  pais?: string;
  moneda?: string;
  nombre_admin?: string;
  instance_id?: string;
  instance_name?: string;
  api_key?: string;
  // Agregados de la view
  owner: { nombre_persona: string; email: string } | null;
  total_usuarios: number;
  total_staff: number;
  citas_mes: number;
  ultimo_token?: string;
  onboarding_completado?: boolean;
  onboarding_paso?: number;
  brief_completado?: boolean;
  clientes_activos?: number;
}

// ─── Onboarding token ────────────────────────────────────────

export interface OnboardingTokenAdmin {
  id: string;
  token: string;
  email: string;
  business_id: string | null;
  paso_actual: number;
  completado: boolean;
  expires_at: string;
  created_at: string;
  datos_parciales: {
    nombre_salon?: string;
    plan_inicial?: PlanBase;
    whatsapp?: string;
  };
}

// ─── Precio suscripción ──────────────────────────────────────

export interface PrecioSuscripcion {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}
