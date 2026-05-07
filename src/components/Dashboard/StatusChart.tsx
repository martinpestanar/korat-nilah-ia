
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDashboardData } from '../../context/DashboardDataContext';
import { STATUS_LABELS } from '../../constants';

const StatusChart: React.FC = () => {
  const { appointments } = useDashboardData();

  const chartData = useMemo(() => {
    const statusCount: Record<string, number> = {};
    appointments.forEach(app => {
      // Use the friendly label for the chart key
      const label = STATUS_LABELS[app.estado as keyof typeof STATUS_LABELS] || app.estado;
      statusCount[label] = (statusCount[label] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
  }, [appointments]);

  // Colores sincronizados con constants.ts
  const COLORS: Record<string, string> = {
    'Completada': '#10B981', // Emerald 500
    'Pendiente': '#F59E0B',  // Amber 500
    'Reagendada': '#6366F1', // Indigo 500 (Para diferenciar visualmente)
    'Cancelada': '#F43F5E',  // Rose 500
    'No-Show': '#64748B'     // Slate 500
  };

  return (
    <div className="h-full w-full">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Estado de Citas</h3>
      <div className="h-64 w-full" style={{ minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[entry.name] || '#8884d8'}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(24, 24, 27, 0.95)', // Zinc-950 con transparencia
                borderColor: 'rgba(255, 255, 255, 0.1)', // Borde sutil
                borderRadius: '12px',
                padding: '12px 16px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
                color: '#F4F4F5' // Texto claro base
              }}
              itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}
              cursor={{ fill: 'transparent' }}
              formatter={(value: number) => [`${value} Citas`, '']}
              separator=""
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '12px', color: '#9CA3AF', paddingTop: '10px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatusChart;
