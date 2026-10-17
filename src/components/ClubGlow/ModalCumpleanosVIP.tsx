import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  Gift,
  MessageSquare,
  Cake,
  Calendar,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { PaisMonedaInfo } from '@/utils/currencyMultitenant';

interface ModalCumpleanosVIPProps {
  isOpen: boolean;
  onClose: () => void;
  monedaInfo: PaisMonedaInfo;
  nombreNegocio?: string;
}

export const ModalCumpleanosVIP: React.FC<ModalCumpleanosVIPProps> = ({
  isOpen,
  onClose,
  monedaInfo,
  nombreNegocio = 'mi negocio'
}) => {
  const [activeTab, setActiveTab] = useState<'estrategia' | 'mensajes'>('estrategia');

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
          className="bg-white dark:bg-[#12111d] border border-pink-300/80 dark:border-pink-500/30 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] shadow-2xl relative overflow-hidden flex flex-col"
        >
          {/* Header Compacto */}
          <div className="p-3.5 sm:p-5 bg-gradient-to-r from-pink-500/15 via-rose-500/10 to-transparent border-b border-pink-200/50 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white flex items-center justify-center text-lg sm:text-xl shadow-md font-black shrink-0">
                🎂
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
                    Especial Cumpleañera VIP
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-900 dark:text-pink-300">
                    2 Tiempos
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  El momento de mayor gasto del año: asegura su cita de fiesta en tu salón
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

          {/* Selector de Pestañas */}
          <div className="flex border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('estrategia')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'estrategia'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-pink-500" />
              <span>Estrategia de 2 Tiempos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mensajes')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'mensajes'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-rose-500" />
              <span>Ver Mensajes de WhatsApp</span>
            </button>
          </div>

          {/* Contenido Dinámico (Scrollable en móviles) */}
          <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
            {activeTab === 'estrategia' ? (
              <div className="space-y-3.5 sm:space-y-4">
                <div className="p-3 rounded-2xl bg-pink-500/10 border border-pink-300/40 text-xs text-pink-950 dark:text-pink-200 leading-relaxed">
                  💡 <strong>¿Sabías que una mujer gasta hasta 3 veces más en su semana de cumpleaños?</strong> (Uñas nuevas, peinado, maquillaje, pestañas). Si le escribes el mismo día ya es tarde porque ya se arregló; la clave es escribirle <strong>7 días antes</strong>.
                </div>

                {/* Los 2 Tiempos */}
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-white/5 border border-pink-200 dark:border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-pink-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      -7d
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Tiempo 1: 7 Días Antes (La Invitación)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-500/20 text-pink-800 dark:text-pink-300 font-bold">Genera Cita</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug mt-1">
                        Le avisa que se acerca su día especial, le obsequia sellos sorpresa en su tarjeta digital dejándola <strong>a solo 1 sello de su premio</strong> y le ofrece un detalle de cortesía si agenda con anticipación.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-white/5 border border-rose-200 dark:border-white/10">
                    <div className="w-8 h-8 rounded-xl bg-rose-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      0d
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Tiempo 2: El Mismo Día (Calidez Pura)</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold">Fidelización</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug mt-1">
                        Un mensaje cálido y afectuoso felicitándola en su día exacto a nombre de todo el equipo, sin intentar vender de manera invasiva. Enamora y crea lealtad de por vida.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Nilah lee la fecha de nacimiento de tus clientas y envía los 2 mensajes automáticamente.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Mensaje 1 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-pink-600 dark:text-pink-400 block">
                    1. Mensaje Anticipado (7 días antes)
                  </span>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                    "¡Hola Mariana! 🎂✨ En {nombreNegocio} ya estamos en modo fiesta porque en 7 días es tu cumpleaños. 💖 Queremos que lo celebres luciendo impecable. Te regalamos sellos sorpresa en tu Tarjeta Glow para que quedes a 1 pasito de tu premio consentido. ¿Qué día de esta semana te gustaría agendar para consentirte? 💅🗓️"
                  </div>
                </div>

                {/* Mensaje 2 */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 block">
                    2. Felicitación el Mismo Día (Exacto)
                  </span>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-sans">
                    "¡Feliz cumpleaños, Mariana! 🥳🎂🎉 De parte de todo el equipo de {nombreNegocio}, te deseamos un día lleno de risas, amor y momentos mágicos. ¡Que cumplas muchísimos años más brillando con nosotros! 🥂✨"
                  </div>
                </div>
              </div>
            )}
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
              <span className="text-[10px] text-gray-400 block leading-tight">Sin contratos forzosos</span>
            </div>

            <a
              href={`https://wa.me/51924045869?text=${encodeURIComponent(
                `Hola Korat Flow 👋 Deseo activar el módulo "Especial Cumpleañera VIP" (${precioPrincipal}) para mi salón "${nombreNegocio}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:from-pink-600 hover:to-rose-500 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 min-h-[42px]"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white" />
              <span>Activar en WhatsApp ✨</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
