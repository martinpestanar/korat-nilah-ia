import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, MessageCircle, CheckCircle2, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

const WHATSAPP_NUMBER = '51926285289';

export type TriggerContext =
  | 'recordatorios_whatsapp'
  | 'retoques_21d'
  | 'rescate_inactivas'
  | 'marketing_masivo'
  | 'stand_qr_resenas'
  | 'nilah_creative'
  | 'general';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: TriggerContext;
  customData?: {
    clientCount?: number;
    estimatedRevenue?: number;
    serviceName?: string;
  };
}

const CONTEXT_CONFIGS: Record<TriggerContext, {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  waMessage: string;
}> = {
  recordatorios_whatsapp: {
    badge: '⚡ AUTOMATIZACIÓN ANTI-PLANTONES',
    title: 'Elimina el 30% de citas no asistidas',
    subtitle: 'Deja que Nilah le recuerde y confirme la cita por WhatsApp en automático.',
    description: '1 de cada 3 clientas olvida su cita si no se le avisa. Con el Plan PRO, tus clientas reciben recordatorios inteligentes 24h y 3h antes con botón de confirmación.',
    bullets: [
      'Recordatorio automático 24h y 3h antes por WhatsApp',
      'Botón interactivo de confirmación o reagendamiento',
      'Libera el turno de inmediato si la clienta cancela',
      'Sin que tú ni tu equipo tengan que mandar mensajes manuales',
    ],
    waMessage: 'Hola Martín! Estoy usando la agenda gratuita de Nilah y quiero activar los Recordatorios Automáticos por WhatsApp para evitar plantones en mi salón.',
  },
  retoques_21d: {
    badge: '⏰ DISPARADOR DE RETOQUES (15 A 21 DÍAS)',
    title: 'Asegura la siguiente cita antes de que se caigan las pestañas o uñas',
    subtitle: 'Nilah detecta el día exacto de mantenimiento y le escribe sola a la clienta.',
    description: 'Las clientas siempre esperan al último momento para agendar su retoque y encuentran tu agenda llena. Nilah les envía un mensaje personalizado al día 16 para asegurar su mantenimiento.',
    bullets: [
      'Disparo automático de WhatsApp en el día 15 a 21 según servicio',
      'Mensaje no invasivo con enlace directo a sus horas libres',
      'Aumento del 40% en frecuencia de visitas por clienta',
      'Historial de curvatura de pestañas y tonos de esmalte en su ficha',
    ],
    waMessage: 'Hola Martín! Me interesa activar el Disparador Automático de Retoques a los 21 días por WhatsApp para mis clientas de pestañas/uñas.',
  },
  rescate_inactivas: {
    badge: '💸 RECUPERACIÓN DE CLIENTAS DORMIDAS',
    title: 'Despierta a tus clientas inactivas (+45 días)',
    subtitle: 'Hay dinero real dormido en tu base de datos esperando una invitación.',
    description: 'Nilah identifica en tu base de datos a todas las clientas que amaron tu servicio pero no han vuelto en más de 45 días, y les envía una oferta exclusiva para reactivarlas.',
    bullets: [
      'Filtro automático de clientas sin visita en 35, 60 y 90 días',
      'Mensajes con gatillos mentales de urgencia y exclusividad',
      'Recupera de 5 a 15 clientas dormidas en la primera semana',
      'Control anti-spam para no saturar los chats',
    ],
    waMessage: 'Hola Martín! Tengo clientas registradas en Nilah que no han vuelto hace semanas y quiero activar la Reactivación Automática por WhatsApp.',
  },
  marketing_masivo: {
    badge: '📢 WHATSAPP MARKETING & DÍAS FLOJOS',
    title: 'Llena tus turnos vacíos de martes y miércoles',
    subtitle: 'Lanza campañas relámpago a toda tu base de clientas en un solo clic.',
    description: 'Deja de publicar historias en Instagram que nadie ve. Llega directamente al WhatsApp de todas tus clientas con ofertas irresistibles para tus días de menor movimiento.',
    bullets: [
      'Envíos masivos con copys probados de alta conversión',
      'Segmentación por servicios (Pestañas, Uñas, Cabello)',
      'Filtro seguro anti-bloqueo de WhatsApp oficial',
      'Llenado garantizado de horarios libres de media semana',
    ],
    waMessage: 'Hola Martín! Quiero activar el módulo de WhatsApp Marketing Masivo para llenar los martes y miércoles en mi salón.',
  },
  stand_qr_resenas: {
    badge: '⭐ RESEÑAS 5★ GOOGLE & CLUB VIP',
    title: 'Multiplica tus reseñas en Google Maps y fideliza',
    subtitle: 'Stand QR físico de acrílico para tu mostrador + Club de Puntos por WhatsApp.',
    description: 'Tus clientas escanean al pagar en caja, dejan su reseña de 5 estrellas en tu perfil de Google Maps y acumulan puntos VIP en WhatsApp para canjear en su próxima visita.',
    bullets: [
      'Stand físico de acrílico personalizado con tu logo',
      'Crecimiento acelerado en los primeros lugares de Google Maps',
      'Sistema de puntos VIP automático que premia la lealtad',
      'Reporte de clientas más recurrentes y de mayor gasto',
    ],
    waMessage: 'Hola Martín! Quiero solicitar el Stand QR Físico de mostrador con Reseñas 5 Estrellas Google y Club VIP para mi salón.',
  },
  nilah_creative: {
    badge: '📸 GENERADOR DE CONTENIDO & REDES',
    title: 'Crea fotos y promociones para TikTok/Instagram en 5s',
    subtitle: 'Sin usar Canva ni perder horas diseñando.',
    description: 'Genera fotos de antes y después, banners con ofertas y textos persuasivos listos para publicar en tus redes sociales con tu propia marca.',
    bullets: [
      'Plantillas estéticas diseñadas para salones, uñas y pestañas',
      'Generador de textos y ganchos para TikTok',
      'Llamadas a la acción directas al WhatsApp de tu salón',
      'Creación en 1 clic desde tu celular',
    ],
    waMessage: 'Hola Martín! Quiero activar Nilah Creative para diseñar fotos y ofertas para las redes de mi salón.',
  },
  general: {
    badge: '💎 PLAN PRO 360° DE NILAH IA',
    title: 'Convierte tu WhatsApp en una máquina de citas',
    subtitle: 'Todo lo que necesitas para automatizar, fidelizar y duplicar tus ingresos.',
    description: 'Accede a todas las herramientas avanzadas de IA, recordatorios automáticos, disparadores de retoque y campañas masivas de WhatsApp Marketing.',
    bullets: [
      'Recordatorios anti-plantones y confirmaciones 24/7',
      'Retoques automáticos a los 15-21 días (Pestañas & Uñas)',
      'Campañas de WhatsApp Masivo para días flojos',
      'Stand QR de Mostrador con Reseñas 5★ Google Maps',
      'Nilah Creative y Soporte Prioritario de Martín',
    ],
    waMessage: 'Hola Martín! Tengo mi salón registrado en Nilah y quiero pasar al Plan PRO 360° para automatizar mis citas y WhatsApp.',
  },
};

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  context = 'general',
  customData,
}) => {
  if (!isOpen) return null;

  const config = CONTEXT_CONFIGS[context] || CONTEXT_CONFIGS.general;

  const buildWaUrl = () => {
    let msg = config.waMessage;
    if (customData?.clientCount) {
      msg += ` (Tengo aproximadamente ${customData.clientCount} clientas registradas)`;
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-pink-500/20 max-h-[90vh] overflow-y-auto relative"
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Badge Contextual */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-500/30 text-[10px] font-black text-pink-700 dark:text-pink-300 uppercase tracking-wider mb-3">
            <Sparkles size={13} className="text-pink-500" />
            {config.badge}
          </div>

          {/* Título y Subtítulo */}
          <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            {config.title}
          </h3>
          <p className="text-xs text-pink-600 dark:text-pink-400 font-bold mt-1">
            {config.subtitle}
          </p>

          {/* Descripción */}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
            {config.description}
          </p>

          {/* Bullets de Valor */}
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Lo que desbloqueas con el Plan PRO:
            </p>
            {config.bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200">
                <CheckCircle2 size={16} className="text-pink-500 shrink-0 mt-0.5" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>

          {/* Garantía / Asesoría de Martín */}
          <div className="mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 flex items-center gap-2.5">
            <ShieldCheck size={20} className="text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-900 dark:text-amber-200 font-medium leading-snug">
              <strong>Instalación y soporte personal:</strong> Martín te ayuda a conectar tu WhatsApp y dejarlo corriendo en 24h.
            </p>
          </div>

          {/* Botón CTA principal */}
          <div className="mt-5 flex flex-col gap-2">
            <a
              href={buildWaUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 text-center cursor-pointer"
            >
              <MessageCircle size={17} className="fill-white" />
              <span>🔥 ACTIVAR PLAN PRO CON MARTÍN (WhatsApp)</span>
              <ArrowRight size={15} />
            </a>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Continuar con el Plan Básico Gratuito por ahora
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
