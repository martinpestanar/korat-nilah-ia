import React, { useState } from 'react';
import { Star, Filter, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Rating } from '../../context/DashboardDataContext';

interface RatingsListProps {
    ratings: Rating[];
    itemsPerPage?: number;
}

const RatingsList: React.FC<RatingsListProps> = ({ ratings, itemsPerPage = 8 }) => {
    const [filterBy, setFilterBy] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Solo calificaciones con score válido
    const scoredRatings = ratings.filter(r => r.hasScore !== false && r.score >= 1);

    const lowCount    = scoredRatings.filter(r => r.score <= 2).length;
    const mediumCount = scoredRatings.filter(r => r.score === 3).length;
    const highCount   = scoredRatings.filter(r => r.score >= 4).length;
    const totalRatings = scoredRatings.length;

    const avgScore = totalRatings > 0
        ? Math.round((scoredRatings.reduce((s, r) => s + r.score, 0) / totalRatings) * 10) / 10
        : 0;

    // Rating distribution
    const ratingCounts = scoredRatings.reduce((acc, r) => {
        acc[r.score] = (acc[r.score] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    // Filter
    const filtered = scoredRatings.filter(r => {
        if (filterBy === 'low')    return r.score <= 2;
        if (filterBy === 'medium') return r.score === 3;
        if (filterBy === 'high')   return r.score >= 4;
        return true;
    });

    const sorted = [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalPages = Math.max(1, Math.ceil(sorted.length / itemsPerPage));
    const paginated  = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleFilterChange = (value: string) => {
        setFilterBy(value);
        setCurrentPage(1);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
    };

    const getScoreStyle = (score: number) => {
        if (score <= 2) return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', star: 'fill-red-500 text-red-500', avatar: 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' };
        if (score === 3) return { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', star: 'fill-amber-500 text-amber-500', avatar: 'bg-amber-100 text-amber-700 dark:bg-amber-800 dark:text-amber-200', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' };
        return { bg: 'bg-gray-50 dark:bg-gray-800/30', border: 'border-gray-200 dark:border-gray-700', star: 'fill-emerald-500 text-emerald-500', avatar: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    };

    const renderStars = (score: number) => {
        const { star } = getScoreStyle(score);
        return (
            <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`h-3.5 w-3.5 ${s <= score ? star : 'text-gray-200 dark:text-gray-600'}`} />
                ))}
            </div>
        );
    };

    const getLabel = (score: number) => {
        if (score >= 5) return 'Excelente';
        if (score >= 4) return 'Muy buena';
        if (score === 3) return 'Regular';
        if (score === 2) return 'Mala';
        return 'Muy mala';
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-card">

            {/* ── Header ── */}
            <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Calificaciones</h3>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{totalRatings} total</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Filter size={13} className="text-gray-400" />
                    <select
                        value={filterBy}
                        onChange={e => handleFilterChange(e.target.value)}
                        className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white"
                    >
                        <option value="all">Todas ({totalRatings})</option>
                        <option value="high">⭐ 4-5 Buenas ({highCount})</option>
                        <option value="medium">⭐ 3 Regular ({mediumCount})</option>
                        <option value="low">⭐ 1-2 Bajas ({lowCount})</option>
                    </select>
                </div>
            </div>

            {/* ── Promedio + distribución ── */}
            {totalRatings > 0 && (
                <div className="mb-4 flex gap-4 rounded-xl bg-gray-50 dark:bg-white/5 p-4 border border-gray-100 dark:border-white/10">
                    {/* Número grande */}
                    <div className="flex flex-col items-center justify-center min-w-[56px]">
                        <p className="text-3xl font-black text-gray-900 dark:text-white leading-none">{avgScore.toFixed(1)}</p>
                        <div className="flex mt-1 gap-0.5">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`h-2.5 w-2.5 ${s <= Math.round(avgScore) ? 'fill-amber-400 text-amber-400' : 'text-gray-200 dark:text-gray-700'}`} />
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">de 5</p>
                    </div>

                    {/* Barras */}
                    <div className="flex-1 space-y-1.5">
                        {[5,4,3,2,1].map(score => {
                            const count = ratingCounts[score] || 0;
                            const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                            return (
                                <div key={score} className="flex items-center gap-2">
                                    <span className={`w-3 text-[10px] font-bold text-right ${score <= 2 ? 'text-red-500' : score === 3 ? 'text-amber-500' : 'text-emerald-500'}`}>{score}</span>
                                    <Star className={`h-2.5 w-2.5 shrink-0 ${score <= 2 ? 'fill-red-400 text-red-400' : score === 3 ? 'fill-amber-400 text-amber-400' : 'fill-emerald-400 text-emerald-400'}`} />
                                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${score <= 2 ? 'bg-red-400' : score === 3 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <span className="w-5 text-right text-[10px] text-gray-400">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── Lista de calificaciones ── */}
            <div className="space-y-2">
                {paginated.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-400">No hay calificaciones con este filtro</p>
                ) : (
                    paginated.map(rating => {
                        const styles = getScoreStyle(rating.score);
                        const isLow = rating.score <= 2;
                        return (
                            <div
                                key={rating.id}
                                className={`flex items-center gap-3 rounded-lg border p-3 ${styles.border} ${styles.bg}`}
                            >
                                {/* Avatar */}
                                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${styles.avatar}`}>
                                    {rating.clientName.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{rating.clientName}</p>
                                        {isLow && (
                                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">
                                                <AlertTriangle size={10} /> Atención
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">{rating.serviceName || 'Servicio'}</p>
                                </div>

                                {/* Score + fecha */}
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    {renderStars(rating.score)}
                                    <div className="flex items-center gap-1.5">
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${styles.badge}`}>
                                            {getLabel(rating.score)}
                                        </span>
                                        <span className="text-[10px] text-gray-400">{formatDate(rating.date)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── Paginación ── */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3">
                    <p className="text-xs text-gray-400">{currentPage} / {totalPages} · {sorted.length} resultados</p>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <ChevronLeft size={13} /> Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Siguiente <ChevronRight size={13} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatingsList;
