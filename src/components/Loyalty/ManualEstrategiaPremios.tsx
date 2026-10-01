import React, { useState } from 'react';
import { Sparkles, DollarSign, Gift, CheckCircle2, ShieldAlert, Award, ArrowRight, Heart } from 'lucide-react';
import { useCurrency } from '../../hooks/useCurrency';

interface ManualEstrategiaPremiosProps {
  onAplicarSugerencia?: (nombre: string, puntos: number, categoria: string, descripcion: string) => void;
}

export const ManualEstrategiaPremios: React.FC<ManualEstrategiaPremiosProps> = ({ onAplicarSugerencia }) => {
  const { symbol } = useCurrency();
  const [ticketPromedio, setTicketPromedio] = useState<number>(60);

  const sugerenciasEstrategicas = [
    {
      nivel: 'Premio 1: El Regalo Rápido (El Gancho)',
      puntos: 120,
      visitas: '1 o 2 visitas',
      ejemplo: 'Ampolla Hidratante / Retiro de Esmalte / Peinado Rápido',
      categoria: 'Tratamiento',
      descripcion: 'Te lo aplicamos gratis en tu próxima cita agendada.',
      porQue: 'A ti como dueña solo te cuesta unas moneditas del producto (casi nada) y toma 10 minutos en el lavacabezas. La clienta se emociona porque siente que ganar regalos en tu salón es súper fácil y rápido.',
      badge: 'Fácil de ganar · Muy barato para ti',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    },
    {
      nivel: 'Premio 2: El Regalo Favorito (Para que no se vaya)',
      puntos: 250,
      visitas: '3 o 4 visitas',
      ejemplo: 'Manicura Spa / Perfilado de Cejas / 20% de Descuento',
      categoria: 'Uñas',
      descripcion: 'Canjéalo en tu próxima visita avisándonos al agendar.',
      porQue: 'Es el premio que todas quieren. Cuando una clienta ya tiene 200 puntos, prefiere volver a tu salón mil veces antes de irse con la competencia para no perder su premio.',
      badge: 'El que más piden',
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800'
    },
    {
      nivel: 'Premio 3: El Gran Premio VIP (Para tus mejores clientas)',
      puntos: 500,
      visitas: '6 a 8 visitas',
      ejemplo: 'Pestañas Clásicas Gratis / Pack Manicura + Pedicura Completa',
      categoria: 'General',
      descripcion: 'Premio especial para nuestras clientas consentidas.',
      porQue: 'Para llegar a 500 puntos, esta clienta ya te pagó más de 500 en total. Darle un súper regalo no te hace perder dinero, al revés: hace que se sienta una reina y te recomiende con todas sus amigas.',
      badge: 'Clientas que más compran',
      badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    }
  ];

  return (
    <div className="space-y-4 text-xs">
      {/* ── Regla de Oro Explicada Super Sencilla ── */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 border border-violet-500/25 space-y-2.5">
        <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-black text-xs sm:text-sm">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
          <span>El Secreto: Cómo regalar sin perder ni un centavo</span>
        </div>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed font-medium text-[11px] sm:text-xs">
          El truco es muy simple: <b>Cada {symbol} 1 que tu clienta paga = 1 punto que gana</b>. 
          El regalo que tú le des tiene que ser algo que a ti te cueste <b>solo unas moneditas de crema o producto</b>, pero que para ella valga mucho.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-violet-200/60 dark:border-violet-800/40">
            <span className="text-[10px] font-bold text-gray-500 block uppercase">1. Tu clienta paga</span>
            <span className="text-sm font-black text-violet-600 dark:text-violet-400">100 Puntos</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Ya te pagó {symbol} 100 de verdad</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-violet-200/60 dark:border-violet-800/40">
            <span className="text-[10px] font-bold text-gray-500 block uppercase">2. Lo que tú gastas</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{symbol} 5 a {symbol} 7</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">Solo un poquito de producto</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-violet-200/60 dark:border-violet-800/40">
            <span className="text-[10px] font-bold text-gray-500 block uppercase">3. La clienta siente</span>
            <span className="text-sm font-black text-purple-600 dark:text-purple-400">{symbol} 30 de valor</span>
            <span className="text-[10px] text-gray-500 block mt-0.5">¡Se va feliz y regresa siempre!</span>
          </div>
        </div>
      </div>

      {/* ── Simulador Fácil ── */}
      <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-gray-900 dark:text-white flex items-center gap-1.5 text-xs">
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Calcula los puntos para tu salón</span>
          </span>
          <span className="text-[10px] text-gray-400 font-semibold">Fácil y rápido</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              ¿Cuánto paga una clienta normal en una visita?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">{symbol}</span>
              <input
                type="number"
                min={10}
                step={5}
                value={ticketPromedio}
                onChange={(e) => setTicketPromedio(Math.max(1, Number(e.target.value)))}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-card font-black text-xs text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
              ¿En cuántas visitas alcanzará sus premios?
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/50 px-2.5 py-1 rounded-lg">
                En 2 visitas: {ticketPromedio * 2} pts
              </span>
              <span className="text-xs font-black text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950/50 px-2.5 py-1 rounded-lg">
                En 4 visitas: {ticketPromedio * 4} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Los 3 Niveles Recomendados ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-500" />
            Los 3 Premios que Mejor Funcionan
          </span>
          {onAplicarSugerencia && (
            <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
              Toca "Usar este" para rellenar
            </span>
          )}
        </div>

        <div className="space-y-2">
          {sugerenciasEstrategicas.map((sug, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 shadow-2xs hover:border-purple-300 dark:hover:border-purple-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sug.badgeColor}`}>
                    {sug.badge}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">
                    🎯 Se gana en {sug.visitas}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <h5 className="text-xs font-black text-gray-900 dark:text-white">
                    {sug.ejemplo}
                  </h5>
                  <span className="text-xs font-extrabold text-amber-500">
                    {sug.puntos} pts
                  </span>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  💡 <b>Por qué te conviene:</b> {sug.porQue}
                </p>
              </div>

              {onAplicarSugerencia && (
                <button
                  type="button"
                  onClick={() => onAplicarSugerencia(sug.ejemplo.split(' / ')[0], sug.puntos, sug.categoria, sug.descripcion)}
                  className="shrink-0 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold text-[11px] border border-purple-200 dark:border-purple-800 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Usar este</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 3 Errores Fáciles de Evitar ── */}
      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
        <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold text-xs">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>3 Cosas que NUNCA debes hacer (Para no perder dinero)</span>
        </div>
        <ul className="space-y-1.5 text-[11px] text-gray-700 dark:text-gray-300 pl-4 list-disc">
          <li>
            <b>No pongas metas imposibles (como 2,000 puntos):</b> Si la clienta ve que necesita venir 30 veces para ganarse algo, se desanima y no le importan los puntos.
          </li>
          <li>
            <b>No regales trabajos largos de 3 horas un sábado:</b> Nunca regales tintes o decoloraciones completas. Regala cositas que se aplican rápido durante su misma cita (como una ampolla, exfoliación de manos o perfilado).
          </li>
          <li>
            <b>No pongas más de 3 o 4 premios:</b> Si pones demasiados premios, la gente se confunde. Con tener 1 premio fácil (120 pts), 1 mediano (250 pts) y 1 grande (500 pts) es perfecto.
          </li>
        </ul>
      </div>
    </div>
  );
};
