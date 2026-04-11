
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardData } from '../../context/DashboardDataContext';

const WeeklyVolumeChart: React.FC = () => {
  const { appointments } = useDashboardData();

  const chartData = useMemo(() => {
    const volumeByDate: Record<string, number> = {};

    // Ordenar cronológicamente
    const sorted = [...appointments].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    sorted.forEach(apt => {
      // Solo contamos citas activas o completadas para medir tráfico real
      if (apt.estado !== 'Cancelada') {
        const dateKey = apt.fecha.split(' ')[0]; // YYYY-MM-DD
        // Formato simple DD/MM
        const dateObj = new Date(dateKey);
        const dayStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

        volumeByDate[dayStr] = (volumeByDate[dayStr] || 0) + 1;
      }
    });

    // Tomar últimos 7 días con datos
    return Object.entries(volumeByDate)
      .map(([name, value]) => ({ name, value }))
      .slice(-7);
  }, [appointments]);

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tráfico de Citas</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Volumen de atención en los últimos 7 días</p>
      </div>
      <div className="h-64 w-full" style={{ minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E1E1E',
                borderColor: '#333',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#60A5FA' }}
              formatter={(value: number) => [`${value} Clientes`, 'Tráfico']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#60A5FA"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVolume)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyVolumeChart;
