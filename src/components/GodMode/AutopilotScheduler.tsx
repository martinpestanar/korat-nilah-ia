import React from 'react';
import {
  Calendar, Clock, ShieldCheck, Cpu, Terminal, CheckCircle2,
  AlertCircle, Workflow, Zap, Info, ArrowRight, ExternalLink
} from 'lucide-react';
import { type AutopilotConfig } from '../../services/autopilot';

interface Props {
  config?: AutopilotConfig | null;
  onSaved?: () => void;
}

const CRON_JOBS_INFO = [
  {
    id: 'recordatorios',
    titulo: 'Recordatorios Anti No-Show (24h & 3h Antes)',
    emoji: '⏰',
    color: 'border-violet-200 bg-violet-50/40 text-violet-900',
    badge: 'Cada 30 Minutos (Activo)',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
    frecuencia: 'Intervalo continuo cada 30 minutos',
    n8nWorkflow: 'Sistema Auto Recordatorio 24 y 3 Horas Antes',
    workflowId: 'Sw4DHYk8a1lVM4mn',
    triggerNode: 'Schedule Trigger (Interval: 30m)',
    databaseRpc: 'public.ejecutar_envios_recordatorios_noshow()',
    ventanaHoraria: '08:00 AM – 08:30 PM (Horario local del salón)',
    reglas: [
      'Evalúa citas a ~24h (entre 21h y 26h futuras) y ~3h (entre 1h30m y 4h futuras).',
      'Ventana de silencio de 8 horas: si la clienta chateó activamente en las últimas 8h, se pausa para no interrumpir a la recepcionista.',
      'Simula presencia "escribiendo..." en Evolution API con delay proporcional.',
    ],
  },
  {
    id: 'fidelizacion',
    titulo: 'Fidelización Post-Cita (2 Tiempos: Encuesta & Premios)',
    emoji: '⭐',
    color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
    badge: 'Cron 0,30 9-20 * * *',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    frecuencia: 'Minuto 0 y 30 de cada hora, entre 9:00 AM y 8:00 PM',
    n8nWorkflow: 'Fidelización 26 (Arquitectura Autónoma Supabase)',
    workflowId: 'dvo8alYiNJSfOawB',
    triggerNode: 'Schedule Trigger (Cron: 0,30 9-20 * * *)',
    databaseRpc: 'public.ejecutar_envios_fidelizacion_encuesta() [Tiempo 1]',
    ventanaHoraria: '09:00 AM – 08:00 PM (Horario local del salón)',
    reglas: [
      'Tiempo 1 (Encuesta): Selecciona citas completadas (hace 1h a 24h) y envía la pregunta de 1 a 5 ⭐.',
      'Tiempo 2 (Respuesta): Se activa de forma 100% autónoma en Supabase (registrar_respuesta_interaccion) cuando la clienta responde.',
      'Si responde 4-5 ⭐: Suma puntos automáticamente y entrega avance de premio de la misma categoría.',
      'Si responde 1-3 ⭐: Pausa el bot por 48h y notifica a la recepcionista humana.',
    ],
  },
  {
    id: 'retoque',
    titulo: 'Retoque & Mantenimiento Automático (18-24 Días)',
    emoji: '💅',
    color: 'border-amber-200 bg-amber-50/40 text-amber-900',
    badge: 'Diario Matutino',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    frecuencia: '1 vez al día (09:00 AM)',
    n8nWorkflow: 'Sistema Automático de Recordatorios de Retoque / Mantenimiento',
    workflowId: 'M0wWce2FoGLMKbjfym5RN',
    triggerNode: 'Schedule Trigger (Daily)',
    databaseRpc: 'Consultas inteligentes por categoría (Uñas, Pestañas, Alisado)',
    ventanaHoraria: '09:00 AM – 11:30 AM',
    reglas: [
      'Detecta clientas que realizaron servicios que requieren mantenimiento hace 18 a 24 días.',
      'Aplica cooldown estricto para no saturar.',
      'Usa plantillas dinámicas con variables de días transcurridos y nombre del especialista.',
    ],
  },
  {
    id: 'rescate',
    titulo: 'Rescate de Clientas Inactivas (45d / 75d / 120d)',
    emoji: '🫀',
    color: 'border-rose-200 bg-rose-50/40 text-rose-900',
    badge: 'Diario Matutino',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    frecuencia: '1 vez al día (10:00 AM)',
    n8nWorkflow: 'Rescate de Clientas Inactivas (45/75/120d)',
    workflowId: 'JOL4cdForpr8hnKt',
    triggerNode: 'Schedule Trigger (Daily)',
    databaseRpc: 'Filtro por última fecha de cita + segmento dormido',
    ventanaHoraria: '10:00 AM – 12:00 PM',
    reglas: [
      'Secuencia en 3 etapas: 45 días (Cálido), 75 días (Incentivo/Extra), 120 días (Beneficio exclusivo VIP).',
      'Excluye clientas con citas futuras agendadas o que solicitaron baja (opt-out).',
    ],
  },
];

export const AutopilotScheduler: React.FC<Props> = () => {
  return (
    <div className="space-y-5 font-sans text-slate-900">
      {/* ── Banner Informativo Central ── */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 border border-emerald-200/90 rounded-3xl p-5 shadow-sm">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight">
                Telemetría & Arquitectura de Triggers Cron (n8n Engine)
              </h3>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                100% Autónomo
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Los disparadores periódicos (crons) son orquestados directamente por los nodos <code>Schedule Trigger</code> dentro de <strong>n8n</strong> y ejecutados en la base de datos de <strong>Supabase</strong> con protección anti-baneo y ventanas de descanso. Esta vista es <strong>puramente informativa</strong> para auditar la frecuencia y salud de cada flujo.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tarjetas de Monitoreo por Flujo ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CRON_JOBS_INFO.map(item => (
          <div
            key={item.id}
            className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header Tarjeta */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{item.emoji}</span>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{item.titulo}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{item.frecuencia}</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>

            {/* Detalles Técnicos */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Workflow className="w-3.5 h-3.5 text-slate-400" />
                  <span>Workflow n8n:</span>
                </span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]" title={item.n8nWorkflow}>
                  {item.n8nWorkflow}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-slate-400" />
                  <span>Procedimiento / RPC:</span>
                </span>
                <code className="text-[10px] font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-emerald-800">
                  {item.databaseRpc}
                </code>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ventana Operativa:</span>
                </span>
                <span className="font-bold text-slate-700">{item.ventanaHoraria}</span>
              </div>
            </div>

            {/* Reglas de Negocio / Anti-Baneo */}
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Reglas y Protecciones del Flujo:
              </p>
              <ul className="space-y-1">
                {item.reglas.map((r, i) => (
                  <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5 font-medium leading-snug">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutopilotScheduler;
