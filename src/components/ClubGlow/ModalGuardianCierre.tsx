import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Smartphone,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { PaisMonedaInfo } from '@/utils/currencyMultitenant';

interface ModalGuardianCierreProps {
  isOpen: boolean;
  onClose: () => void;
  monedaInfo: PaisMonedaInfo;
  nombreNegocio?: string;
}

export const ModalGuardianCierre: React.FC<ModalGuardianCierreProps> = ({
  isOpen,
  onClose,
  monedaInfo,
  nombreNegocio = 'mi negocio'
}) => {
  const tasaUsdAPen = 3.75;
  const costoPen = 20;
  const costoUsd = Math.round((costoPen / tasaUsdAPen) * 10) / 10;

  const precioPrincipal = monedaInfo.codigoMoneda === 'PEN'
    ? 'S/ 20/mes'
    : monedaInfo.codigoMoneda === 'USD'
    ? '$5/mes'
    : `${monedaInfo.simbolo} ${Math.round((costoUsd * monedaInfo.tasaCambioAproxUsd) / 100) * 100 || Math.round(costoUsd * monedaInfo.tasaCambioAproxUsd)}/mes`;

  const precioSubtexto = monedaInfo.codigoMoneda === 'PEN'
    ? '(equivale a ~$5 USD)'
    : monedaInfo.codigoMoneda === 'USD'
    ? '(equivale a S/ 20 PEN)'
    : `(Aprox. $${costoUsd} USD)`;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="bg-white dark:bg-[#12111d] border border-emerald-300/80 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] shadow-2xl relative overflow-hidden flex flex-col"
        >
          {/* Header Compacto */}
          <div className="p-3.5 sm:p-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-b border-emerald-200/50 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center text-lg sm:text-xl shadow-md font-black shrink-0">
                🔔
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-gray-900 dark:text-white leading-none">
                    Guardián de Cierre Diario
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                    Alerta WhatsApp
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Control total nocturno directo a tu celular personal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-gray-500 dark:text-gray-300 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cuerpo (Scrollable en móviles) */}
          <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-3.5 sm:space-y-4">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
              <strong>El problema diario en los salones:</strong> Tu equipo termina agotado tras una jornada intensa y olvida marcar como "completadas" las citas en el sistema. ¿El resultado? Clientas que no reciben sus sellos, estadísticas rotas y dinero sin conciliar.
            </div>

            {/* Cómo funciona en 3 puntos */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-white/5 border border-emerald-200 dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    Escaneo Automático Nocturno (Ej: 8:30 PM)
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                    Nilah revisa el calendario del día y detecta si quedaron citas del staff pendientes de cierre o sin sellos asignados.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-white/5 border border-emerald-200 dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-teal-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    Notificación Directa a tu WhatsApp con Link de 1 Clic
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                    Te envía un mensaje privado a ti como dueña con el botón express: <em>"Cerrar jornada y otorgar sellos pendientes"</em> sin tener que prender la computadora.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-white/5 border border-emerald-200 dark:border-white/10">
                <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white block">
                    Modo "Proteger Sueño"
                  </span>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                    Si todas las citas del día se cerraron correctamente, Nilah no te molesta y duermes con la tranquilidad de que tu negocio cerró perfecto.
                  </p>
                </div>
              </div>
            </div>

            {/* Simulación del Mensaje que recibe la dueña */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 block">
                Así te llega a tu WhatsApp personal:
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                "🌙 ¡Hola! Guardián de cierre de {nombreNegocio}. Hoy quedaron <strong>2 citas sin cerrar</strong> (Sofía T. y Mariana P.). Toca aquí para cerrarlas y enviar sus sellos en 1 segundo: 🔗 [Link de Cierre Rápido]"
              </div>
            </div>
          </div>

          {/* Footer (Mobile friendly) */}
          <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-[#181628] border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center justify-between sm:block">
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-gray-900 dark:text-white">
                  {precioPrincipal}
                </span>
                <span className="text-[11px] text-gray-400 font-medium">
                  {precioSubtexto}
                </span>
              </div>
              <span className="text-[10px] text-gray-400 block leading-tight">Control nocturno sin esfuerzo</span>
            </div>

            <a
              href={`https://wa.me/51924045869?text=${encodeURIComponent(
                `Hola Korat Flow 👋 Deseo activar el "Guardián de Cierre Diario por WhatsApp" (${precioPrincipal}) para mi salón "${nombreNegocio}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 min-h-[42px]"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white" />
              <span>Activar Guardián ✨</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
