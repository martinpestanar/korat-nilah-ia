
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '../../context/DataContext';

const ServicePopularityChart: React.FC = () => {
  const { appointments } = useData();

  const data = useMemo(() => {
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

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Servicios Más Solicitados</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">Ranking por volumen de citas (Top 5)</p>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            layout="vertical" 
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#333" opacity={0.1} />
            <XAxis type="number" hide />
            <YAxis 
                type="category" 
                dataKey="name" 
                width={100}
                tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 500}}
                axisLine={false}
                tickLine={false}
            />
            <Tooltip 
                cursor={{fill: 'transparent'}}
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
                {data.map((entry, index) => (
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
