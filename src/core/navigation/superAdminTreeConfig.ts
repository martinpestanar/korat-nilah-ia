/**
 * ============================================================
 * CORE NAVIGATION: SuperAdmin Hierarchical Tree Architecture
 * ============================================================
 * Define la estructura en Árbol (Raíz -> 4 Ramas Maestras -> Nodos Hijos)
 * del panel God-Mode y resuelve con 100% de compatibilidad cualquier
 * ruta legacy (?tab=...) hacia su nodo y sub-vista exacta.
 */

export type TreeBranchId = 'root' | 'salones' | 'infraestructura' | 'autopilot' | 'comercial';

export type TreeNodeId =
  | 'overview'
  // Rama 1: Salones (Tenants)
  | 'clientes'
  | 'activacion'
  // Rama 2: Infraestructura WhatsApp & Salud SRE
  | 'whatsapp'
  | 'sre_salud'
  // Rama 3: Motor Autopilot & Plantillas
  | 'autopilot'
  | 'autopilot_plantillas'
  | 'autopilot_test'
  // Rama 4: Comercial, Planes & Tráfico
  | 'precios'
  | 'soluciones'
  | 'tiktok_analytics';

export type AutopilotSubTab =
  | 'monitor'
  | 'schedule'
  | 'templates'
  | 'tarjetas_club_glow'
  | 'pack_calificacion_sellos'
  | 'test';

export type ActivacionSubTab = 'seguimiento' | 'onboarding';
export type SreSaludSubTab = 'centinela' | 'errores';

export interface TreeNodeMeta {
  id: TreeNodeId;
  branchId: TreeBranchId;
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  badge?: string;
  badgeColor?: 'emerald' | 'violet' | 'rose' | 'amber' | 'blue';
}

export interface TreeBranchMeta {
  id: TreeBranchId;
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  accentColor: string;
  nodes: TreeNodeMeta[];
}

export const SUPERADMIN_TREE_BRANCHES: TreeBranchMeta[] = [
  {
    id: 'root',
    code: '0',
    label: 'Raíz del Ecosistema',
    shortLabel: 'Raíz',
    description: 'Pulso ejecutivo, Kill-Switch global y mapa del árbol en tiempo real',
    accentColor: 'emerald',
    nodes: [
      {
        id: 'overview',
        branchId: 'root',
        code: '0.1',
        label: 'Centro de Mando (Raíz)',
        shortLabel: 'Mando',
        description: 'Visión global del árbol, MRR, Kill-Switch y auditoría de acciones',
        badge: 'Root',
        badgeColor: 'emerald',
      },
    ],
  },
  {
    id: 'salones',
    code: '1',
    label: 'Rama 1 · Salones & Tenants',
    shortLabel: 'Salones',
    description: 'Control 360° de cada salón, activación de módulos, usuarios y onboarding',
    accentColor: 'blue',
    nodes: [
      {
        id: 'clientes',
        branchId: 'salones',
        code: '1.1',
        label: 'Directorio & Expediente 360°',
        shortLabel: 'Salones',
        description: 'Gestión por salón: Resumen, Plan & Módulos, Usuarios, Config y Monitor de Envíos',
        badge: '360°',
        badgeColor: 'blue',
      },
      {
        id: 'activacion',
        branchId: 'salones',
        code: '1.2',
        label: 'Embudo de Activación & Links',
        shortLabel: 'Activación',
        description: 'Progreso del tutorial paso a paso (Servicios -> Clientas -> Citas) y links de invitación',
        badge: 'Embudo',
        badgeColor: 'emerald',
      },
    ],
  },
  {
    id: 'infraestructura',
    code: '2',
    label: 'Rama 2 · WhatsApp & Salud SRE',
    shortLabel: 'WhatsApp/SRE',
    description: 'Conectividad Evolution API, agente Centinela 7AM y monitor de errores en vivo',
    accentColor: 'emerald',
    nodes: [
      {
        id: 'whatsapp',
        branchId: 'infraestructura',
        code: '2.1',
        label: 'Instancias Evolution API',
        shortLabel: 'WhatsApp',
        description: 'Vinculación QR, códigos de emparejamiento y estado en vivo de números WhatsApp',
        badge: 'API',
        badgeColor: 'emerald',
      },
      {
        id: 'sre_salud',
        branchId: 'infraestructura',
        code: '2.2',
        label: 'Centro SRE & Auditoría de Errores',
        shortLabel: 'Salud SRE',
        description: 'Unifica el Agente Centinela SRE (Salud de Agenda 7AM) y la consola Realtime de errores',
        badge: 'Live SRE',
        badgeColor: 'rose',
      },
    ],
  },
  {
    id: 'autopilot',
    code: '3',
    label: 'Rama 3 · Motor Autopilot & IA',
    shortLabel: 'Autopilot',
    description: 'Orquestación de flujos automáticos, cronjobs, plantillas maestras y simulador',
    accentColor: 'violet',
    nodes: [
      {
        id: 'autopilot',
        branchId: 'autopilot',
        code: '3.1',
        label: 'Flujos, Cola & Horarios',
        shortLabel: 'Flujos',
        description: 'Monitoreo diario de envíos automáticos, pausas por flujo y programación horaria',
        badge: 'Cron',
        badgeColor: 'violet',
      },
      {
        id: 'autopilot_plantillas',
        branchId: 'autopilot',
        code: '3.2',
        label: 'Plantillas & Club Glow Global',
        shortLabel: 'Plantillas',
        description: 'Plantillas maestras multitenant, tarjetas Club Glow y Pack Calificación + Sellos',
        badge: 'Master',
        badgeColor: 'amber',
      },
      {
        id: 'autopilot_test',
        branchId: 'autopilot',
        code: '3.3',
        label: 'Simulador & Test Runner',
        shortLabel: 'Simulador',
        description: 'Laboratorio de pruebas para disparar y auditar flujos en tiempo real',
      },
    ],
  },
  {
    id: 'comercial',
    code: '4',
    label: 'Rama 4 · Comercial & Growth',
    shortLabel: 'Comercial',
    description: 'Tarifas de suscripción, catálogo público de add-ons y tráfico de adquisición',
    accentColor: 'amber',
    nodes: [
      {
        id: 'precios',
        branchId: 'comercial',
        code: '4.1',
        label: 'Planes & Tarifas SaaS',
        shortLabel: 'Planes',
        description: 'Precios oficiales en Soles (PEN) y USD para los planes Glow y Glow Pro',
      },
      {
        id: 'soluciones',
        branchId: 'comercial',
        code: '4.2',
        label: 'Catálogo & Add-ons (/soluciones)',
        shortLabel: 'Catálogo',
        description: 'Editor de módulos, categorías y vitrina comercial de soluciones Korat',
      },
      {
        id: 'tiktok_analytics',
        branchId: 'comercial',
        code: '4.3',
        label: 'TikTok & Tráfico en Vivo',
        shortLabel: 'TikTok',
        description: 'Embudo de visitantes, eventos y conversiones de campañas en redes',
        badge: 'Live',
        badgeColor: 'emerald',
      },
    ],
  },
];

export interface ResolvedTreeRoute {
  branch: TreeBranchMeta;
  node: TreeNodeMeta;
  activacionView?: ActivacionSubTab;
  sreView?: SreSaludSubTab;
  autopilotView?: AutopilotSubTab;
}

/**
 * Resuelve cualquier valor de `?tab=` (incluyendo IDs legacy como 'seguimiento',
 * 'onboarding', 'centinela', 'errores') hacia su Rama, Nodo y Sub-vista exacta.
 */
export function resolveSuperAdminTreeRoute(
  rawTab: string | null | undefined,
  rawView?: string | null
): ResolvedTreeRoute {
  const t = (rawTab || 'overview').toLowerCase().trim();

  let targetNodeId: TreeNodeId = 'overview';
  let activacionView: ActivacionSubTab | undefined;
  let sreView: SreSaludSubTab | undefined;
  let autopilotView: AutopilotSubTab | undefined;

  switch (t) {
    case 'overview':
      targetNodeId = 'overview';
      break;
    case 'clientes':
      targetNodeId = 'clientes';
      break;
    case 'activacion':
      targetNodeId = 'activacion';
      activacionView = rawView === 'onboarding' ? 'onboarding' : 'seguimiento';
      break;
    case 'seguimiento':
      targetNodeId = 'activacion';
      activacionView = 'seguimiento';
      break;
    case 'onboarding':
      targetNodeId = 'activacion';
      activacionView = 'onboarding';
      break;
    case 'whatsapp':
      targetNodeId = 'whatsapp';
      break;
    case 'sre_salud':
      targetNodeId = 'sre_salud';
      sreView = rawView === 'errores' ? 'errores' : 'centinela';
      break;
    case 'centinela':
      targetNodeId = 'sre_salud';
      sreView = 'centinela';
      break;
    case 'errores':
      targetNodeId = 'sre_salud';
      sreView = 'errores';
      break;
    case 'autopilot':
      if (
        rawView === 'templates' ||
        rawView === 'tarjetas_club_glow' ||
        rawView === 'pack_calificacion_sellos'
      ) {
        targetNodeId = 'autopilot_plantillas';
        autopilotView = rawView;
      } else if (rawView === 'test') {
        targetNodeId = 'autopilot_test';
        autopilotView = 'test';
      } else {
        targetNodeId = 'autopilot';
        autopilotView = rawView === 'schedule' ? 'schedule' : 'monitor';
      }
      break;
    case 'autopilot_plantillas':
      targetNodeId = 'autopilot_plantillas';
      autopilotView =
        rawView === 'tarjetas_club_glow' || rawView === 'pack_calificacion_sellos'
          ? rawView
          : 'templates';
      break;
    case 'autopilot_test':
      targetNodeId = 'autopilot_test';
      autopilotView = 'test';
      break;
    case 'precios':
      targetNodeId = 'precios';
      break;
    case 'soluciones':
      targetNodeId = 'soluciones';
      break;
    case 'tiktok_analytics':
      targetNodeId = 'tiktok_analytics';
      break;
    default:
      targetNodeId = 'overview';
      break;
  }

  for (const branch of SUPERADMIN_TREE_BRANCHES) {
    const found = branch.nodes.find(n => n.id === targetNodeId);
    if (found) {
      return {
        branch,
        node: found,
        activacionView,
        sreView,
        autopilotView,
      };
    }
  }

  return {
    branch: SUPERADMIN_TREE_BRANCHES[0],
    node: SUPERADMIN_TREE_BRANCHES[0].nodes[0],
  };
}
