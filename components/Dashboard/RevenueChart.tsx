import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

const RevenueChart: React.FC = () => {
  const { appointments } = useDashboardData();
  const { formatValue, moneda } = useCurrency();

  const chartData = useMemo(() => {
    // Aggregate revenue by date
    const revenueByDate: Record<string, number> = {};

    // Sort appointments by date
    const sorted = [...appointments].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    sorted.forEach(app => {
      if (app.estado !== 'Cancelada') {
        const dateKey = app.fecha.split(' ')[0]; // YYYY-MM-DD
        // Format to simple day/month
        const dateObj = new Date(dateKey);
        const dayStr = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;

        revenueByDate[dayStr] = (revenueByDate[dayStr] || 0) + app.precio;
      }
    });

    // Convert to array and take last 7 distinct days for readability
    return Object.entries(revenueByDate)
      .map(([name, value]) => ({ name, value }))
      .slice(-7);
  }, [appointments]);

  return (
    <div className="h-full w-full">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Ingresos por Día</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.3} />
            <XAxis
              dataKey="name"
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
              tickFormatter={(value) => `${moneda} ${value}`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1E1E1E', borderColor: '#333', color: '#fff' }}
              itemStyle={{ color: '#34D399' }}
              cursor={{ fill: '#333', opacity: 0.2 }}
              formatter={(value: number) => [`${moneda} ${value}`, 'Ingresos']}
            />
            <Bar
              dataKey="value"
              fill="#34D399"
              radius={[4, 4, 0, 0]}
              barSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RevenueChart;