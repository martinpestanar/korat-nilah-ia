import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Zap,
  Check,
  ShieldCheck,
  MessageSquare,
  Gift,
  Flame,
  Bell
} from 'lucide-react';
import { PaisMonedaInfo } from '@/utils/currencyMultitenant';

interface ModalPackPilotoAutomaticoProps {
  isOpen: boolean;
  onClose: () => void;
  monedaInfo: PaisMonedaInfo;
  nombreNegocio?: string;
  precioPack: string;
  precioIndividualTotal: string;
  ahorroTexto: string;
}

export const ModalPackPilotoAutomatico: React.FC<ModalPackPilotoAutomaticoProps> = ({
  isOpen,
  onClose,
  monedaInfo,
  nombreNegocio = 'mi negocio',
  precioPack,
  precioIndividualTotal,
  ahorroTexto
}) => {
  if (!isOpen) return null;

  const modulos = [
    {
      emoji: '🧲',
      titulo: 'Imán de Clientas Ausentes (Día 25 y 45)',
      desc: 'Detecta cuando se vence su retoque biológico y la rescata antes de irse a otro salón con 2x sellos e incentivo "a 1 sello del premio".',
      badge: 'Retención de Clientas'
    },
    {
      emoji: '🎂',
      titulo: 'Especial Cumpleañera VIP (2 Tiempos)',
      desc: 'Dispara su consumo escribiéndole 7 días antes con sellos sorpresa para amarrar su cita de fiesta, y la felicita con calidez el mismo día.',
      badge: 'Mayor Consumo del Año'
    },
    {
      emoji: '🔔',
      titulo: 'Guardián de Cierre Diario por WhatsApp',
      desc: 'Escaneo nocturno a tu celular con link express para cerrar citas olvidadas y otorgar sellos en 1 segundo sin abrir tu computadora.',
      badge: 'Cero Pérdidas'
    },
    {
      emoji: '⚡',
      titulo: 'Martes & Miércoles Glow (2X Sellos)',
      desc: 'Estrategia de choque para llenar tus sillones en los días más flojos de la semana sin regalar descuentos en efectivo.',
      badge: 'Llena Días Lentos'
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-[#12111d] border-2 border-amber-400 dark:border-amber-500/40 rounded-2xl sm:rounded-3xl w-full max-w-xl shadow-2xl relative overflow-hidden my-auto max-h-[92dvh] flex flex-col"
        >
          {/* Header Dorado Premium */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-slate-950 shrink-0 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3 pr-8 sm:pr-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0">
                👑
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950 text-amber-300">
                    Oferta Todo Incluido
                  </span>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    {ahorroTexto}
                  </span>
                </div>
                <h2 className="text-base sm:text-xl font-black leading-tight mt-1">
                  Super Pack Piloto Automático Total
                </h2>
                <p className="text-xs font-semibold text-slate-900/90 leading-snug">
                  Los 4 aceleradores de facturación y retención activados en tu salón
                </p>
              </div>
            </div>
          </div>

          {/* Contenido (Scrollable en móviles) */}
          <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 min-h-0 space-y-3.5 sm:space-y-4 text-gray-800 dark:text-gray-200">
            {/* Comparativa Psicológica */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50 dark:bg-white/5 border border-amber-200 dark:border-white/10 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 block">Si los compras por separado:</span>
                <span className="text-xs sm:text-sm font-bold text-gray-400 line-through">
                  {precioIndividualTotal}/mes
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-amber-900 dark:text-amber-300 font-bold block">Precio en Super Pack:</span>
                <span className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                  {precioPack}/mes
                </span>
              </div>
            </div>

            {/* Los 4 Módulos Incluidos */}
            <div className="space-y-2 sm:space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                Módulos que se activan con 1 clic:
              </span>

              {modulos.map((m, idx) => (
                <div
                  key={idx}
                  className="p-2.5 sm:p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-start gap-2.5 sm:gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/10 text-base flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    {m.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h4 className="text-xs font-black text-gray-900 dark:text-white">
                        {m.titulo}
                      </h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                        ✓ Incluido
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-snug mt-0.5">
                      {m.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Garantía de ROI */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 text-center font-medium leading-snug">
              💡 <strong>Con que regrese 1 sola clienta al mes</strong> con un corte, tinte o uñas, el pack completo ya se pagó y te deja dinero a favor.
            </div>
          </div>

          {/* Footer de Conversión (Mobile friendly) */}
          <div className="p-3.5 sm:p-5 bg-gray-50 dark:bg-[#181628] border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            <div className="flex items-center justify-between sm:block">
              <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                {precioPack}/mes
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                Los 4 aceleradores incluidos • Sin contratos
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none py-2.5 px-3.5 rounded-xl border border-gray-300 dark:border-white/15 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-all cursor-pointer text-center min-h-[42px] flex items-center justify-center"
              >
                Cerrar
              </button>
              <a
                href={`https://wa.me/51924045869?text=${encodeURIComponent(
                  `Hola Korat Flow 👋 Deseo activar el "Super Pack Piloto Automático Total" (${precioPack}/mes) para mi salón "${nombreNegocio}". ¡Quiero tener los 4 aceleradores activos!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 min-h-[42px]"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                <span>Activar Super Pack ✨</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
