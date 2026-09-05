import React from 'react';
import { createPortal } from 'react-dom';
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
      'Filtro inteligente en 45, 75 y 120 días adaptado por servicio',
      'Protección anti-error: no alerta a los 45d a clientas de solo alisados (4-6m)',
      'Mensajes con gatillos mentales de cercanía y beneficio de retorno',
      'Recupera de 5 a 15 clientas dormidas en tu primer mes',
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
    badge: '✨ DISEÑADORA IA 24/7 EN TU BOLSILLO',
    title: 'Crea flyers y copys irresistibles para Instagram en segundos',
    subtitle: 'Sin pagarle a diseñadores ni pasar horas buscando plantillas en Canva.',
    description: 'Nilah Creative genera posts profesionales de tus servicios, ofertas relámpago y estados de WhatsApp listos para publicar con un toque.',
    bullets: [
      'Generación ilimitada de flyers y copys con tu logo y colores',
      'Formatos optimizados para Historias, Reels y Feed',
      'Textos persuasivos que convierten seguidoras en citas pagadas',
      'Banco de imágenes premium de belleza sin coste adicional',
    ],
    waMessage: 'Hola Martín! Quiero activar Nilah Creative para diseñar mis publicaciones de Instagram y WhatsApp automáticamente.',
  },
  general: {
    badge: '🚀 PLAN PRO AUTOMATIZADO',
    title: 'Pon tu salón en piloto automático con Nilah PRO',
    subtitle: 'Ahorra 2 horas al día y recupera clientas sin mover un dedo.',
    description: 'Desbloquea todo el arsenal de inteligencia artificial: recordatorios automáticos de citas, campañas masivas seguras, disparador de retoques y diseñadora de contenido.',
    bullets: [
      'Recordatorios Anti-Plantones 24h y 3h por WhatsApp',
      'Retoque automático a los 21 días (uñas y pestañas)',
      'Campañas de marketing masivas y segmentadas',
      'Nilah Creative: creadora de contenido visual para redes',
    ],
    waMessage: 'Hola Martín! Estoy interesado en subir mi salón al Plan PRO de Nilah para automatizar mis citas y marketing.',
  },
};

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  context = 'general',
  customData,
}) => {
  if (typeof document === 'undefined') return null;

  const config = CONTEXT_CONFIGS[context] || CONTEXT_CONFIGS.general;

  const buildWaUrl = () => {
    let msg = config.waMessage;
    if (customData?.clientCount) {
      msg += ` (Tengo aproximadamente ${customData.clientCount} clientas registradas)`;
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            key="pro-upgrade-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute inset-0 bg-black/60 dark:bg-black/80"
            onClick={onClose}
          />
          <motion.div
            key="pro-upgrade-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-pink-500/20 max-h-[90vh] overflow-y-auto will-change-transform"
            style={{ transform: 'translateZ(0)' }}
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

          {/* Botones de Acción Dual */}
          <div className="mt-5 space-y-2.5">
            <a
              href={buildWaUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-rose-600 hover:from-violet-700 hover:to-purple-700 text-white font-black text-xs shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95 text-center cursor-pointer"
            >
              <MessageCircle size={17} className="fill-white" />
              <span>🔥 ACTIVAR PLAN PRO 360° ($100 USD · S/ 335)</span>
              <ArrowRight size={15} />
            </a>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`¡Hola Martín! Quiero activar solo el módulo *${config.title}* a la carta para mi salón.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
            >
              <span>Comprar solo este módulo a la carta</span>
            </a>

            <button
              onClick={onClose}
              className="w-full py-1 text-center text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Continuar con el Plan Básico Gratuito por ahora
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
