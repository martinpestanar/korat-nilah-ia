export type TipoRecompensa = 'porcentaje' | 'monto_fijo' | 'regalo' | 'especial';
export type EstadoCupon = 'activo' | 'canjeado' | 'vencido';

export interface ResenasConfig {
  id: string;
  business_id: string;
  google_review_url: string;
  admin_pin: string;
  dias_validez_default: number;
  limite_dias_por_cliente: number;
  webhook_n8n_url: string;
  flyer_titulo: string;
  flyer_subtitulo: string;
  activo: boolean;
  created_at: string;
}

export interface ResenaPremio {
  id: string;
  business_id: string;
  categoria: string;
  titulo_premio: string;
  tipo_recompensa: TipoRecompensa;
  valor_recompensa?: string;
  dias_validez: number;
  orden: number;
  activo: boolean;
  created_at?: string;
}

export interface ResenaCupon {
  id: string;
  business_id: string;
  premio_id?: string | null;
  codigo: string;
  cliente_nombre: string;
  cliente_telefono: string;
  categoria_servicio: string;
  titulo_beneficio: string;
  estado: EstadoCupon;
  expira_en: string;
  canjeado_en?: string | null;
  canjeado_por?: string | null;
  notas_canje?: string | null;
  created_at: string;
}

export interface ResenasPublicData {
  negocio: {
    id: string;
    nombre: string;
    slug: string;
    logo_url?: string;
    direccion?: string;
    telefono?: string;
  };
  config: ResenasConfig;
  premios: ResenaPremio[];
}
