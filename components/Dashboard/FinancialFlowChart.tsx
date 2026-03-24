
import React from 'react';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useData } from '../../context/DataContext';
import { useCurrency } from '../../hooks/useCurrency';

const CustomTooltip = ({ active, payload, label }: any) => {
  const { formatValue } = useCurrency();

  if (active && payload && payload.length) {
    const revenueData = payload.find((p: any) => p.dataKey === 'revenue');
    const projectData = payload.find((p: any) => p.dataKey === 'projection');
    const pointData = payload[0]?.payload;
    const eventData = pointData?.event;
    const isFuture = pointData?.isFuture;
    const isToday = pointData?.isToday;

    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/95 p-3 shadow-xl backdrop-blur-md min-w-[160px]">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-bold text-gray-300">{label}</p>
          {isToday && (
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">HOY</span>
          )}
          {isFuture && (
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Proyección</span>
          )}
        </div>

        {!isFuture && revenueData?.value !== null && (
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-xs text-gray-400">Real:</span>
            <span className="text-sm font-bold text-white">{formatValue(revenueData?.value || 0)}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-purple-400" />
          <span className="text-xs text-gray-400">{isFuture ? 'Proyectado:' : 'Tendencia:'}</span>
          <span className="text-sm font-bold text-purple-400">{formatValue(projectData?.value || 0)}</span>
        </div>

        {eventData && (
          <div className="mt-2 flex items-start gap-2 rounded bg-indigo-500/20 p-2 border border-indigo-500/30">
            <span className="text-lg">🚀</span>
            <div>
              <p className="text-[10px] font-bold uppercase text-indigo-300">Impulso Nilah</p>
              <p className="text-xs text-white">{eventData.name}</p>
              <p className="text-[10px] text-indigo-200">Impacto: +{eventData.impact}% ventas</p>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (payload.event) {
    return (
      <g transform={`translate(${cx - 12},${cy - 25})`}>
        <circle cx="12" cy="18" r="14" fill="#a855f7" opacity="0.4" className="animate-ping" />
        <text x={0} y={0} fontSize={20} className="animate-bounce drop-shadow-md cursor-pointer">🚀</text>
      </g>
    );
  }
  return null;
};

const FinancialFlowChart: React.FC = () => {
  const { financialData } = useData();
  const { moneda } = useCurrency();

  return (
    <div className="h-full w-full">
      {/* ── Header: Título arriba, leyenda abajo en móvil ── */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-1.5">
            {/* Título más corto para no colapsar */}
            <span className="hidden sm:inline">Impacto Financiero: Efecto Nilah</span>
            <span className="sm:hidden">Efecto Nilah 📊</span>
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
          </h3>
        </div>

        {/* Descripción — solo en desktop */}
        <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Visualiza cómo las campañas (🚀) rompen la tendencia orgánica.
        </p>

        {/* Leyenda — siempre visible, compacta */}
        <div className="flex gap-3 mt-2 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/30 border border-primary shrink-0" />
            <span className="text-gray-500 dark:text-gray-400">Ventas</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border border-dashed border-purple-400 shrink-0" />
            <span className="text-gray-500 dark:text-gray-400">Proyección</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm">🚀</span>
            <span className="text-gray-500 dark:text-gray-400">Campaña</span>
          </div>
        </div>
      </div>

      {/* ── Chart — altura reducida en móvil ── */}
      <div className="h-52 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={financialData} margin={{ top: 16, right: 8, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />

            {/* Eje X: mostrar menos ticks en móvil */}
            <XAxis
              dataKey="day"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />

            {/* Eje Y: formato compacto S/400 → S/0.4k en móvil si fuera necesario */}
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${moneda}${value}`}
              width={54}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.5 }} />

            <Line
              type="monotone"
              dataKey="projection"
              stroke="#A78BFA"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />

            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#34D399"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="none"
              dot={<CustomizedDot />}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialFlowChart;
