export interface CopyPromocional {
  id: string;
  business_id: string;
  titulo: string;
  contenido: string;
  tipo_promocion: 'porcentaje' | 'monto_fijo' | 'regalo' | 'custom';
  valor_promocion: string;
  regalo_sugerido?: string;
  audiencia_target?: string; // 'todas' | 'ausentes_60d' | 'rescate_90d' | 'vip' | 'leads' | etc.
  veces_usado?: number;
  convertidos?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BroadcastAudienceClient {
  id: number;
  nombre: string;
  telefono: string;
  categoria: string;
  ultima_visita: string | null;
  dias_sin_visita: number;
  ultimo_servicio: string;
  dia_preferido: string;
  descuento_sugerido: string;
  regalo_sugerido: string;
  bloqueado_hasta?: string | null;
  cooldown_activo?: boolean;
}


export interface BroadcastFilterState {
  servicioKeyword: string;
  diasSinVisita: number;
  categoria: string;
  soloOptin: boolean;
  limitSendingCount: number; // Ej: enviar solo a 20 de 50
}

export interface SendBroadcastPayload {
  business_id: string;
  titulo_campana: string;
  copy_id?: string;
  mensaje_template: string;
  total_audiencia_encontrada: number;
  total_seleccionados: number;
  tipo_promocion: string;
  valor_promocion: string;
  regalo: string;
  imagen_url?: string;
  formato?: 'texto' | 'imagen_texto';
  recipients: Array<{
    id: number;
    nombre: string;
    telefono: string;
    dia_preferido: string;
    ultimo_servicio: string;
    dias_sin_visita: number;
    mensaje_personalizado: string;
  }>;
}
