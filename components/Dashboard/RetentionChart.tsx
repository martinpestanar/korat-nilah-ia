
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useDashboardData } from '../../context/DashboardDataContext';

const RetentionChart: React.FC = () => {
  const { data: dashboardData } = useDashboardData();
  const clients = dashboardData?.clientes || [];

  const chartData = useMemo(() => {
    // Filtramos clientes activos por lifecycle
    const activeClients = clients.filter(c =>
      c.lifecycle === 'Activo' || c.lifecycle === 'Leal' || c.stats?.nivel_riesgo === 'Bajo'
    );

    let newClients = 0;
    let returningClients = 0;

    activeClients.forEach(client => {
      // Definición de Recurrente: Más de 1 visita o explícitamente VIP/Regular
      if ((client.total_visitas || 0) > 1 || client.categoria === 'VIP' || client.categoria === 'Regular') {
        returningClients++;
      } else {
        newClients++;
      }
    });

    return [
      { name: 'Recurrentes (Fidelizados)', value: returningClients },
      { name: 'Nuevos (Oportunidad)', value: newClients },
    ];
  }, [clients]);

  const COLORS = ['#8B5CF6', '#3B82F6']; // Purple (Loyal) vs Blue (New)

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Ratio de Retención</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Composición de tu cartera de clientes activos</p>
      </div>
      <div className="h-64 w-full">
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
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(24, 24, 27, 0.95)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '12px 16px',
                color: '#fff'
              }}
              itemStyle={{ color: '#fff', fontWeight: 600, fontSize: '13px' }}
              cursor={{ fill: 'transparent' }}
              formatter={(value: number) => [`${value} Clientes`, '']}
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

export default RetentionChart;
