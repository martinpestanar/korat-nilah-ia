
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

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const revenueData = payload.find((p: any) => p.dataKey === 'revenue');
    const projectData = payload.find((p: any) => p.dataKey === 'projection');
    const pointData = payload[0]?.payload;
    const eventData = pointData?.event;
    const isFuture = pointData?.isFuture;
    const isToday = pointData?.isToday;

    return (
      <div className="rounded-xl border border-gray-700 bg-gray-900/95 p-4 shadow-xl backdrop-blur-md min-w-[180px]">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-sm font-bold text-gray-300">{label}</p>
          {isToday && (
            <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">HOY</span>
          )}
          {isFuture && (
            <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">Proyección</span>
          )}
        </div>

        {/* Revenue - solo si no es futuro */}
        {!isFuture && revenueData?.value !== null && (
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-primary"></div>
            <span className="text-xs text-gray-400">Ingresos reales:</span>
            <span className="text-sm font-bold text-white">S/ {revenueData?.value?.toLocaleString('es-PE') || 0}</span>
          </div>
        )}

        {/* Projection - siempre mostrar */}
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-purple-400"></div>
          <span className="text-xs text-gray-400">{isFuture ? 'Proyectado:' : 'Tendencia:'}</span>
          <span className="text-sm font-bold text-purple-400">S/ {projectData?.value?.toLocaleString('es-PE') || 0}</span>
        </div>

        {/* Event Banner if exists */}
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


// Custom Dot for Events (The Rocket)
const CustomizedDot = (props: any) => {
  const { cx, cy, payload } = props;

  if (payload.event) {
    return (
      <g transform={`translate(${cx - 12},${cy - 25})`}>
        <text x={0} y={0} fontSize={20} className="animate-bounce drop-shadow-md">🚀</text>
      </g>
    );
  }
  return null;
};

const FinancialFlowChart: React.FC = () => {
  const { financialData } = useData();

  return (
    <div className="h-full w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Impacto Financiero: Efecto Nilah
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Visualiza cómo las campañas (🚀) rompen la tendencia orgánica.</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-primary/20 border border-primary"></span>
            <span className="text-gray-600 dark:text-gray-300">Ventas Totales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border border-dashed border-purple-400"></span>
            <span className="text-gray-600 dark:text-gray-300">Proyección Orgánica</span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={financialData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34D399" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />

            <XAxis
              dataKey="day"
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `S/${value}`}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#fff', strokeWidth: 1, strokeDasharray: '5 5', opacity: 0.5 }} />

            {/* AI Projection Line (The Ghost Line) */}
            <Line
              type="monotone"
              dataKey="projection"
              stroke="#A78BFA"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />

            {/* Real Revenue Area */}
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#34D399"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />

            {/* Event Markers (Rockets) - Using a Line with custom dots to place icons */}
            <Line
              type="monotone"
              dataKey="revenue" // Bind to revenue to place icon on top of the line
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
