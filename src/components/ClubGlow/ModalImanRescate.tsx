import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  MessageSquare,
  Flame,
  Calendar,
  Gift
} from 'lucide-react';
import { PaisMonedaInfo } from '@/utils/currencyMultitenant';

interface ModalImanRescateProps {
  isOpen: boolean;
  onClose: () => void;
  monedaInfo: PaisMonedaInfo;
  nombreNegocio?: string;
}

export const ModalImanRescate: React.FC<ModalImanRescateProps> = ({
  isOpen,
  onClose,
  monedaInfo,
  nombreNegocio = 'mi negocio'
}) => {
  const [activeTab, setActiveTab] = useState<'estrategia' | 'calculadora'>('estrategia');

  // Precios base: 20 PEN / equivalencia en USD
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

  // Simulación interactiva simple y de alto impacto
  const costoModuloLocal = monedaInfo.codigoMoneda === 'PEN'
    ? 20
    : monedaInfo.codigoMoneda === 'USD'
    ? 5.3
    : costoUsd * monedaInfo.tasaCambioAproxUsd;

  const ticketBase = monedaInfo.codigoMoneda === 'PEN'
    ? 50
    : monedaInfo.codigoMoneda === 'USD'
    ? 20
    : monedaInfo.codigoMoneda === 'COP'
    ? 75000
    : 350;

  const [clientas, setClientas] = useState(4);
  const facturacionExtra = clientas * ticketBase;
  const gananciaNeta = Math.max(0, facturacionExtra - costoModuloLocal);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="bg-white dark:bg-[#12111d] border border-amber-300/80 dark:border-amber-500/30 rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[92dvh] shadow-2xl relative overflow-hidden flex flex-col"
        >
          {/* Header Compacto con Gradiente Suave */}
          <div className="p-3.5 sm:p-5 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border-b border-amber-200/50 dark:border-white/10 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center text-lg sm:text-xl shadow-md font-black shrink-0">
                🧲
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
                    Imán de Clientas Ausentes
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300">
                    Pro
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Recupera clientas en automático sin rematar tus precios
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

          {/* Selector de Pestañas Visuales (Tabs limpias) */}
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
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Cómo Funciona (25 y 45 días)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calculadora')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'calculadora'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Calculadora de Ganancias</span>
            </button>
          </div>

          {/* Contenido Dinámico de las Pestañas */}
          {/* Contenido Dinámico de las Pestañas (Scrollable en móviles) */}
          <div className="p-3.5 sm:p-5 overflow-y-auto flex-1 min-h-0 space-y-4">
            {activeTab === 'estrategia' ? (
              <div className="space-y-3.5 sm:space-y-4">
                {/* Timeline Visual de 3 Pasos */}
                <div className="space-y-2.5">
                  {/* Punto 1: Día 1 */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                    <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">Día 1: Visita al salón</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">Atención</span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                        La clienta se atiende feliz. El sistema empieza a contar discretamente sus días.
                      </p>
                    </div>
                  </div>

                  {/* Punto 2: Día 25 */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-500/30">
                    <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      25
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Día 25: Bono 2x Sellos</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-200 dark:bg-amber-500/30 text-amber-900 dark:text-amber-200 font-bold">Fin de Retoque</span>
                      </div>
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug mt-0.5">
                        <strong>¿Por qué 25 días?</strong> Uñas, raíz de tinte y pestañas ya crecieron. Nilah le escribe ofreciendo <strong>Doble Sello</strong> si agenda esta misma semana.
                      </p>
                    </div>
                  </div>

                  {/* Punto 3: Día 45 */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                      45
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Día 45: A 1 Sello del Premio</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-200 dark:bg-emerald-500/30 text-emerald-900 dark:text-emerald-200 font-bold">Rescate de Oro</span>
                      </div>
                      <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-snug mt-0.5">
                        <strong>¿Por qué 45 días?</strong> Para no perderla con la competencia, el sistema le regala sellos y la deja <strong>a 1 sola visita de su premio</strong>. ¡Vuelve motivada a reclamarlo!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filtro anti-spam */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Si la clienta ya tiene una cita agendada, <strong>el robot no le escribe</strong>.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 sm:space-y-4">
                {/* Visualizador de Ganancia Gigante */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-300 dark:border-emerald-500/30 text-center space-y-1">
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 tracking-wider">
                    Ganancia neta estimada
                  </span>
                  <div className="text-2xl sm:text-4xl font-black text-emerald-700 dark:text-emerald-400">
                    +{monedaInfo.simbolo} {Math.round(gananciaNeta).toLocaleString()}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Facturas extra: +{monedaInfo.simbolo} {facturacionExtra.toLocaleString()} | Módulo: {precioPrincipal}
                  </p>
                </div>

                {/* Slider Único Interactivo */}
                <div className="bg-gray-50 dark:bg-white/5 p-3 sm:p-3.5 rounded-2xl border border-gray-100 dark:border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-700 dark:text-gray-300">Clientas rescatadas al mes:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black text-xs sm:text-sm px-2.5 py-0.5 rounded-lg bg-emerald-500/10">
                      {clientas} clientas
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={clientas}
                    onChange={(e) => setClientas(parseInt(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-gray-200 dark:bg-white/20 rounded-lg"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-1">
                    <span>1 clienta</span>
                    <span>5 clientas</span>
                    <span>10 clientas</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-300/40 text-[11px] text-amber-900 dark:text-amber-200 text-center leading-snug">
                  💡 <strong>Con que recuperes 1 sola clienta al mes</strong>, el módulo ya se pagó solo y te deja dinero a favor.
                </div>
              </div>
            )}
          </div>

          {/* Footer Compacto y Directo (Mobile friendly) */}
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
              <span className="text-[10px] text-gray-400 block leading-tight">Sin ataduras, cancela cuando quieras</span>
            </div>

            <a
              href={`https://wa.me/51924045869?text=${encodeURIComponent(
                `Hola Korat Flow 👋 Deseo activar el "Imán de Clientas Ausentes" (${precioPrincipal}) para mi salón "${nombreNegocio}".`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 text-xs font-black shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 min-h-[42px]"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
              <span>Activar en WhatsApp ✨</span>
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
