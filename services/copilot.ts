import { campaigns, retention, engagement } from './api';
import {
  CopilotActionExecutionResult,
  CopilotActionType,
  CopilotExecuteRequest,
  CopilotResponse,
  CopilotTextRequest,
  CopilotVoiceRequestMetadata,
} from '../types/copilot';

const COPILOT_USE_MOCK = import.meta.env.VITE_COPILOT_USE_MOCK === 'true';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getWebhookBase = () => {
  const isDev = import.meta.env.DEV;
  const envUrl = import.meta.env.VITE_API_URL;
  return isDev ? '/api/n8n' : envUrl;
};

const pickMockResponse = (input: string): CopilotResponse => {
  const lower = input.toLowerCase();

  if (lower.includes('vac') || lower.includes('hueco') || lower.includes('agenda')) {
    return {
      message: 'Detecte un hueco importante en tu agenda. Te propongo activar una promo flash para llenarlo hoy.',
      actionCard: {
        type: 'marketing',
        title: 'Promo Flash -20% Coloracion (Hoy)',
        description: 'Envio masivo para reactivar clientas y ocupar horas libres en la tarde.',
        actionLabel: 'Enviar campana ahora',
        triggerActionType: 'SEND_SMS_CAMPAIGN',
        payload: {
          segmento: 'clientes_en_riesgo',
          mensaje: 'Solo por hoy: 20% OFF en coloracion. Responde y te reservo.',
          speedMode: 'safe',
          canal: 'whatsapp',
        },
      },
      debug: { source: 'mock', rule: 'agenda_gap' },
    };
  }

  if (lower.includes('vip') || lower.includes('retencion') || lower.includes('no vuelven')) {
    return {
      message: 'Veo clientas VIP en riesgo de fuga. Ejecutemos un rescate personalizado en 1 clic.',
      actionCard: {
        type: 'retention',
        title: 'Rescate VIP',
        description: 'Mensaje de recuperacion con incentivo para clientas inactivas.',
        actionLabel: 'Ejecutar plan de rescate',
        triggerActionType: 'EXECUTE_RESCUE_PLAN',
        payload: {
          clientIds: [],
          mensaje: 'Hola {nombre}, te extrañamos. Esta semana tienes beneficio especial para volver.',
          estrategia: 'rescate_vip',
          limite: 20,
        },
      },
      debug: { source: 'mock', rule: 'retention' },
    };
  }

  return {
    message: 'Tu operacion se ve estable. Mi sugerencia: reforzar recordatorios para reducir no-shows esta semana.',
    actionCard: {
      type: 'engagement',
      title: 'Recordatorio inmediato',
      description: 'Enviar recordatorio manual a citas proximas con mayor riesgo de no-show.',
      actionLabel: 'Enviar recordatorio',
      triggerActionType: 'SEND_REMINDER',
      payload: {
        clienteId: 1,
        tipoServicio: 'mantenimiento',
        diasPasados: 0,
      },
    },
    debug: { source: 'mock', rule: 'default' },
  };
};

const parseCopilotResponse = (data: any): CopilotResponse => {
  if (!data) throw new Error('Respuesta vacía de Nilah');

  // Si N8N devuelve un array de un elemento (comportamiento frecuente de su Webhook)
  const payload = Array.isArray(data) ? data[0] : data;

  // Si N8N nos entregó un string jsonificado dentro de actionCard, lo parseamos a Objeto
  if (typeof payload.actionCard === 'string') {
    try {
      payload.actionCard = JSON.parse(payload.actionCard);
    } catch (e) {
      console.warn('Error parseando actionCard de N8N', e);
      payload.actionCard = undefined; // Card inválida o corrupta
    }
  }

  // Igual con conversationState (a veces la IA envía '"esperando_respuesta"')
  if (typeof payload.conversationState === 'string') {
    try {
      payload.conversationState = JSON.parse(payload.conversationState);
    } catch (e) {
      // Remover comillas extra si es un string crudo
      payload.conversationState = payload.conversationState.replace(/^"|"$/g, '');
    }
  }

  return payload;
};

export const sendTextMessage = async (payload: CopilotTextRequest): Promise<CopilotResponse> => {
  if (COPILOT_USE_MOCK) {
    await wait(900);
    return pickMockResponse(payload.userInput);
  }

  const base = getWebhookBase();
  const response = await fetch(`${base}/copilot/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Copilot error HTTP ${response.status}`);
  }

  const rawData = await response.json();
  return parseCopilotResponse(rawData);
};

export const sendVoiceMessage = async (
  audioBlob: Blob,
  metadata: CopilotVoiceRequestMetadata,
): Promise<CopilotResponse> => {
  if (COPILOT_USE_MOCK) {
    await wait(1200);
    return pickMockResponse(metadata.transcriptHint || 'audio_simulado');
  }

  const base = getWebhookBase();
  const formData = new FormData();
  formData.append('audio', audioBlob, `nilah-voice-${Date.now()}.webm`);
  formData.append('metadata', JSON.stringify(metadata));

  const response = await fetch(`${base}/copilot/message`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Copilot voice error HTTP ${response.status}`);
  }

  const rawData = await response.json();
  return parseCopilotResponse(rawData);
};

export const executeAction = async (
  triggerActionType: CopilotActionType,
  payload: Record<string, any> = {},
  context?: { business_id?: string; conversationId?: string | null; requestedBy?: string; ownerName?: string },
): Promise<CopilotActionExecutionResult> => {
  const startedAt = performance.now();

  try {
    if (!COPILOT_USE_MOCK) {
      const base = getWebhookBase();
      const businessId = context?.business_id || localStorage.getItem('korat_business_id') || '';
      const executePayload: CopilotExecuteRequest = {
        business_id: businessId,
        salonId: businessId,
        ownerName: context?.ownerName || 'Duena',
        currentGoal: { type: 'revenue', target: 0, current: 0 },
        businessContext: { todaysAppointments: 0, lastWeekRevenue: 0, clientsAtRisk: 0 },
        conversationId: context?.conversationId || undefined,
        triggerActionType,
        payload,
        requestedBy: context?.requestedBy,
      };

      const response = await fetch(`${base}/copilot/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(executePayload),
      });

      if (!response.ok) {
        throw new Error(`Copilot execute error HTTP ${response.status}`);
      }

      const remoteResult = await response.json();
      const latencyMs = Math.round(performance.now() - startedAt);
      return {
        success: remoteResult?.success !== false,
        message: remoteResult?.message || 'Accion procesada.',
        data: remoteResult,
        latencyMs,
      };
    }

    let data: any;

    switch (triggerActionType) {
      case 'SEND_SMS_CAMPAIGN': {
        if (payload.campana_id || payload.campaignId) {
          data = await campaigns.send(payload.campana_id || payload.campaignId, payload.options || {});
        } else {
          data = await campaigns.sendCampaign({
            segmento: payload.segmento || 'clientes_en_riesgo',
            mensaje: payload.mensaje || 'Promo especial disponible hoy en tu salon.',
            speedMode: payload.speedMode || 'safe',
            canal: payload.canal || 'whatsapp',
          });
        }
        break;
      }
      case 'EXECUTE_RESCUE_PLAN': {
        data = await retention.executePlan({
          clientIds: payload.clientIds || [],
          mensaje: payload.mensaje,
          estrategia: payload.estrategia || 'rescate',
          limite: payload.limite || 20,
        });
        break;
      }
      case 'SEND_REMINDER': {
        data = await engagement.sendReminder(
          payload.clienteId,
          payload.tipoServicio || 'servicio',
          payload.diasPasados || 0,
          payload.citaId || null,
        );
        break;
      }
      default:
        throw new Error('Accion no soportada por Copilot');
    }

    const latencyMs = Math.round(performance.now() - startedAt);
    return {
      success: true,
      message: 'Accion ejecutada correctamente.',
      data,
      latencyMs,
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - startedAt);
    return {
      success: false,
      message: error?.message || 'No se pudo ejecutar la accion.',
      latencyMs,
    };
  }
};

export const copilotConfig = {
  COPILOT_USE_MOCK,
};
