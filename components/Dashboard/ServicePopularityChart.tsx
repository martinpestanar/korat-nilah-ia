
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useDashboardData } from '../../context/DashboardDataContext';

const ServicePopularityChart: React.FC = () => {
  const { appointments } = useDashboardData();

  const chartData = useMemo(() => {
    const serviceCounts: Record<string, number> = {};

    // Contar citas por servicio (excluyendo canceladas)
    appointments.forEach(apt => {
      if (apt.estado !== 'Cancelada') {
        serviceCounts[apt.servicio] = (serviceCounts[apt.servicio] || 0) + 1;
      }
    });

    // Convertir a array, ordenar y tomar el Top 5
    return Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [appointments]);

  const COLORS = ['#34D399', '#60A5FA', '#A78BFA', '#F472B6', '#FBBF24'];

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-full w-full">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Servicios Más Solicitados</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ranking por volumen de citas (Top 5)</p>
        </div>
        <div className="flex h-48 sm:h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-dark-border dark:bg-[#1A1A1A]/50">
          <div className="mb-3 rounded-full bg-white p-3 shadow-sm dark:bg-[#252525]">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Gráfico sin datos</p>
          <p className="mt-1 max-w-[200px] text-xs text-gray-500 dark:text-gray-400">
            Registra citas para ver el ranking de tus servicios más populares.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Servicios Más Solicitados</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Ranking por volumen de citas (Top 5)</p>
      </div>

      <div className="h-48 sm:h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" opacity={0.1} />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={80}
              tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'transparent' }}
              contentStyle={{
                backgroundColor: '#1E1E1E',
                borderColor: '#333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value} Citas`, 'Volumen']}
            />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ServicePopularityChart;
