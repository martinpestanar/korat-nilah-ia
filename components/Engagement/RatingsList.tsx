import React, { useState } from 'react';
import { Star, MessageSquare, MessageCircle, AlertTriangle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Rating } from '../../context/DashboardDataContext';

interface RatingsListProps {
    ratings: Rating[];
    itemsPerPage?: number;
}

const RatingsList: React.FC<RatingsListProps> = ({ ratings, itemsPerPage = 6 }) => {
    // Filter state
    const [filterBy, setFilterBy] = useState<string>('all');
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);

    // Apply filter
    const filteredRatings = ratings.filter(r => {
        if (filterBy === 'all') return true;
        if (filterBy === 'low') return r.score <= 2;
        if (filterBy === 'medium') return r.score === 3;
        if (filterBy === 'high') return r.score >= 4;
        return true;
    });

    // Sort by most recent first
    const sortedRatings = [...filteredRatings]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Pagination
    const totalPages = Math.ceil(sortedRatings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedRatings = sortedRatings.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when filter changes
    const handleFilterChange = (value: string) => {
        setFilterBy(value);
        setCurrentPage(1);
    };

    // Count ratings by category
    const lowCount = ratings.filter(r => r.score <= 2).length;
    const mediumCount = ratings.filter(r => r.score === 3).length;
    const highCount = ratings.filter(r => r.score >= 4).length;

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.toLocaleDateString('es-PE', { month: 'short' });
        return `${day} ${month}`;
    };

    // Get color scheme based on score
    const getScoreColorScheme = (score: number) => {
        if (score <= 2) {
            return {
                bg: 'bg-red-50 dark:bg-red-900/20',
                border: 'border-red-200 dark:border-red-800',
                star: 'fill-red-500 text-red-500',
                avatar: 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-300',
                comment: 'bg-red-100 dark:bg-red-900/30',
            };
        }
        if (score === 3) {
            return {
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                border: 'border-amber-200 dark:border-amber-800',
                star: 'fill-amber-500 text-amber-500',
                avatar: 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-300',
                comment: 'bg-amber-100 dark:bg-amber-900/30',
            };
        }
        return {
            bg: 'bg-gray-50 dark:bg-gray-800/30',
            border: 'border-gray-200 dark:border-gray-700',
            star: 'fill-emerald-500 text-emerald-500',
            avatar: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-300',
            comment: 'bg-gray-100 dark:bg-gray-900/50',
        };
    };

    const renderStars = (score: number) => {
        const colors = getScoreColorScheme(score);
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= score
                            ? colors.star
                            : 'text-gray-200 dark:text-gray-600'
                            }`}
                    />
                ))}
            </div>
        );
    };

    // Calculate rating distribution
    const ratingCounts = ratings.reduce((acc, r) => {
        acc[r.score] = (acc[r.score] || 0) + 1;
        return acc;
    }, {} as Record<number, number>);

    const totalRatings = ratings.length;

    // Handle reply - opens WhatsApp with pre-filled message (works on web and mobile)
    const handleReply = (rating: Rating) => {
        // Clean phone number: remove spaces, dashes, parentheses
        const cleanPhone = (rating.clientPhone || '').replace(/[\s\-\(\)\+]/g, '');

        // If phone doesn't start with country code, assume Peru (51)
        const phoneWithCode = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`;

        // Generic professional message
        const message = rating.score <= 2
            ? `¡Hola ${rating.clientName}! 👋 Somos del salón y notamos que tu última experiencia no fue como esperabas. Queremos disculparnos y saber qué pasó para mejorar. Como gesto, te ofrecemos un descuento especial en tu próxima visita. ¿Podemos conversar? 🙏💚`
            : `¡Hola ${rating.clientName}! 👋 Gracias por visitarnos. Queremos saber cómo fue tu experiencia y si hay algo que podamos mejorar. ¡Tu opinión es muy importante para nosotros! 💚`;

        // wa.me works on both desktop (opens WhatsApp Web) and mobile (opens WhatsApp app)
        const whatsappUrl = phoneWithCode
            ? `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`; // Fallback without phone

        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Calificaciones
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {ratings.length} reviews
                    </span>
                </div>

                {/* Filter Dropdown - Only star icon options */}
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-gray-400" />
                    <select
                        value={filterBy}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white"
                    >
                        <option value="all">⭐ Todas ({totalRatings})</option>
                        <option value="high">⭐ 4-5 Excelentes ({highCount})</option>
                        <option value="medium">⭐ 3 Regular ({mediumCount})</option>
                        <option value="low">⭐ 1-2 Bajas ({lowCount})</option>
                    </select>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="mb-4 space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                {[5, 4, 3, 2, 1].map((score) => {
                    const count = ratingCounts[score] || 0;
                    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                    const colors = getScoreColorScheme(score);
                    return (
                        <div key={score} className="flex items-center gap-2">
                            <span className={`w-3 text-xs font-medium ${score <= 2 ? 'text-red-500' : score === 3 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                {score}
                            </span>
                            <Star className={`h-3 w-3 ${colors.star}`} />
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                    className={`h-full rounded-full ${score <= 2 ? 'bg-red-400' : score === 3 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <span className="w-8 text-right text-xs text-gray-500 dark:text-gray-400">
                                {count}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Ratings List */}
            <div className="space-y-3">
                {paginatedRatings.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-4">
                        No hay calificaciones con este filtro
                    </p>
                ) : (
                    paginatedRatings.map((rating) => {
                        const colors = getScoreColorScheme(rating.score);
                        const isLowRating = rating.score <= 2;
                        const isMediumRating = rating.score === 3;

                        return (
                            <div
                                key={rating.id}
                                className={`rounded-lg border p-3 transition-colors ${colors.border} ${colors.bg}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium ${colors.avatar}`}>
                                            {rating.clientName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {rating.clientName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {rating.serviceName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {renderStars(rating.score)}
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            {formatDate(rating.date)}
                                        </p>
                                    </div>
                                </div>

                                {rating.comment && (
                                    <div className={`mt-2 flex items-start gap-2 rounded-lg p-2 ${colors.comment}`}>
                                        <MessageSquare className="mt-0.5 h-3 w-3 text-gray-400" />
                                        <p className="text-sm italic text-gray-600 dark:text-gray-300">
                                            "{rating.comment}"
                                        </p>
                                    </div>
                                )}

                                {/* Reply Button for Low Ratings */}
                                {isLowRating && (
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                                            <AlertTriangle size={12} />
                                            Requiere atención urgente
                                        </span>
                                        <button
                                            onClick={() => handleReply(rating)}
                                            className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition-colors"
                                        >
                                            <MessageCircle size={12} />
                                            Responder
                                        </button>
                                    </div>
                                )}

                                {/* Notice for medium ratings */}
                                {isMediumRating && (
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                                            <AlertTriangle size={12} />
                                            Puede mejorar
                                        </span>
                                        <button
                                            onClick={() => handleReply(rating)}
                                            className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 transition-colors"
                                        >
                                            <MessageCircle size={12} />
                                            Contactar
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Página {currentPage} de {totalPages} ({sortedRatings.length} resultados)
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            <ChevronLeft size={14} />
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                        >
                            Siguiente
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatingsList;
