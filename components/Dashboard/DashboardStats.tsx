
import React, { useMemo } from 'react';
import { DollarSign, Calendar, TrendingUp, Users, ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const DashboardStats: React.FC = () => {
  const { appointments, clients, isLoading } = useData();
  const { isAdmin } = useAuth();

  const stats = useMemo(() => {
    if (isLoading) return null;

    // 1. Total Revenue (Status != 'Cancelada' or 'No-Show')
    const totalRevenue = appointments
      .filter(a => a.estado !== 'Cancelada' && a.estado !== 'No-Show')
      .reduce((sum, curr) => sum + curr.precio, 0);

    // 2. Total Appointments
    const totalAppts = appointments.length;

    // 3. Average Ticket
    const avgTicket = totalAppts > 0 ? totalRevenue / totalAppts : 0;

    // 4. Protected Revenue (Admin) OR Completed Count (Staff)
    const protectedRevenue = appointments
        .filter(a => a.estado === 'Completada')
        .reduce((sum, curr) => sum + curr.precio, 0);
    
    const completedCount = appointments.filter(a => a.estado === 'Completada').length;
    const completionRate = totalAppts > 0 ? (completedCount / totalAppts) * 100 : 0;

    return {
      totalRevenue,
      totalAppts,
      avgTicket,
      protectedRevenue,
      completedCount,
      completionRate
    };
  }, [appointments, clients, isLoading]);

  if (isLoading || !stats) {
    return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl bg-gray-200 dark:bg-dark-card"></div>)}
    </div>;
  }

  // --- ADMIN VIEW (Full Financials) ---
  const adminCards = [
    {
      title: 'Ingresos Totales',
      value: `S/ ${stats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10'
    },
    {
      title: 'Citas Totales',
      value: stats.totalAppts.toString(),
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Ticket Promedio',
      value: `S/ ${stats.avgTicket.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Ingresos Realizados',
      value: `S/ ${stats.protectedRevenue.toLocaleString('es-PE')}`,
      icon: ShieldCheck,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    }
  ];

  // --- STAFF VIEW (Operational Metrics Only - NO MONEY) ---
  const staffCards = [
    {
      title: 'Citas Totales',
      value: stats.totalAppts.toString(),
      icon: Calendar,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Citas Completadas',
      value: stats.completedCount.toString(),
      icon: CheckCircle2,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    {
      title: 'Tasa de Cumplimiento',
      value: `${stats.completionRate.toFixed(0)}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      title: 'Clientes Activos',
      value: clients.length.toString(),
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10'
    }
  ];

  const cardsToShow = isAdmin ? adminCards : staffCards;

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {cardsToShow.map((card, index) => (
        <div key={index} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-dark-border dark:bg-dark-card dark:shadow-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
              <h3 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
            </div>
            <div className={`rounded-full p-3 ${card.bg}`}>
              <card.icon className={`h-6 w-6 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
