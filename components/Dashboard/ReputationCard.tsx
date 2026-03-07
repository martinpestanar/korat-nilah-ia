
import React, { useMemo } from 'react';
import { Star, AlertTriangle } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';

const ReputationCard: React.FC = () => {
  const { appointments } = useDashboardData();

  const stats = useMemo(() => {
    const ratedAppointments = appointments.filter(a =>
      a.estado === 'Completada' && a.calificacion && parseInt(a.calificacion) > 0
    );
    const totalRated = ratedAppointments.length;

    if (totalRated === 0) return { average: 0, total: 0, recentReviews: [] };

    const sum = ratedAppointments.reduce((acc, curr) => acc + parseInt(curr.calificacion || '0'), 0);
    const average = sum / totalRated;

    // Get last 2 reviews with text
    const recentReviews = ratedAppointments
      .filter(a => a.feedback_cliente && a.feedback_cliente.length > 0)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 2);

    return { average, total: totalRated, recentReviews };
  }, [appointments]);

  return (
    <div className="h-full rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reputación</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Feedback de Clientes (Pro)</p>
        </div>
        <div className="rounded-full bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
          <Star size={20} fill="currentColor" />
        </div>
      </div>

      <div className="flex items-end gap-3 mb-6">
        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{stats.average.toFixed(1)}</span>
        <div className="mb-1 flex text-yellow-400">
          {[1, 2, 3, 4, 5].map(i => (
            <Star
              key={i}
              size={16}
              fill={i <= Math.round(stats.average) ? "currentColor" : "none"}
              className={i <= Math.round(stats.average) ? "" : "text-gray-300 dark:text-gray-600"}
            />
          ))}
        </div>
        <span className="mb-1 text-sm text-gray-500 dark:text-gray-400">({stats.total} reseñas)</span>
      </div>

      <div className="space-y-3 flex-1">
        {stats.recentReviews.length > 0 ? (
          stats.recentReviews.map(review => (
            <div key={review.id} className="rounded-lg bg-gray-50 p-3 dark:bg-[#252525]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900 dark:text-white">{review.nombre}</span>
                <span className="flex text-yellow-400">
                  {[...Array(parseInt(review.calificacion || '0'))].map((_, i) => <Star key={i} size={8} fill="currentColor" />)}
                </span>
              </div>
              <p className="text-xs italic text-gray-600 dark:text-gray-300">"{review.feedback_cliente}"</p>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-sm text-gray-500">
            No hay comentarios recientes.
          </div>
        )}
      </div>

      {stats.average < 4.5 && stats.total > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
          <AlertTriangle size={14} />
          <span>Atención: Puntuación baja reciente.</span>
        </div>
      )}
    </div>
  );
};

export default ReputationCard;
