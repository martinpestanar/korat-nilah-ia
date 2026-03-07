/**
 * EncuestasPostCitaWidget Component
 * 
 * Muestra estadísticas de las encuestas post-cita enviadas
 * y las últimas encuestas con su estado de respuesta.
 * Incluye paginación moderna.
 */

import React, { useState } from 'react';
import { MessageSquare, CheckCircle, Clock, Star, TrendingUp, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface EncuestaEnviada {
    clienteId: number;
    nombre: string;
    servicio: string;
    puntosOtorgados: number;
    calificacion: number | null;
    feedback: string | null;
    fechaEnvio: string;
    respondio: boolean;
}

interface EncuestasStats {
    enviadasHoy: number;
    enviadasSemana: number;
    respondidasSemana: number;
    tasaRespuesta: number;
    calificacionPromedio: number;
    conFeedback: number;
}

interface EncuestasPostCitaWidgetProps {
    stats: EncuestasStats;
    ultimasEncuestas: EncuestaEnviada[];
    maxItems?: number;
}

const EncuestasPostCitaWidget: React.FC<EncuestasPostCitaWidgetProps> = ({
    stats,
    ultimasEncuestas,
    maxItems = 5
}) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalEncuestas = ultimasEncuestas.length;
    const totalPages = Math.ceil(totalEncuestas / maxItems);
    const startIndex = (currentPage - 1) * maxItems;
    const displayedEncuestas = ultimasEncuestas.slice(startIndex, startIndex + maxItems);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffHours < 1) return 'Hace unos minutos';
        if (diffHours < 24) return `Hace ${diffHours}h`;
        return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
    };

    const renderStars = (score: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-3 w-3 ${star <= score
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300 dark:text-gray-600'}`}
                    />
                ))}
            </div>
        );
    };

    const renderEncuestaRow = (encuesta: EncuestaEnviada, index: number) => (
        <div
            key={`${encuesta.clienteId}-${index}`}
            className={`flex items-center justify-between rounded-lg p-3 transition-colors ${encuesta.respondio
                ? 'bg-emerald-50/50 dark:bg-emerald-500/5'
                : 'bg-gray-50 dark:bg-gray-800/50'
                }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                {/* Avatar */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-sm font-bold text-primary flex-shrink-0">
                    {encuesta.nombre.charAt(0)}
                </div>

                {/* Info */}
                <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                        {encuesta.nombre}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="truncate">{encuesta.servicio}</span>
                        <span className="text-primary font-medium">+{encuesta.puntosOtorgados} pts</span>
                    </div>
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 flex-shrink-0">
                {encuesta.respondio && encuesta.calificacion ? (
                    <div className="text-right">
                        {renderStars(encuesta.calificacion)}
                        {encuesta.feedback && (
                            <div className="flex items-center gap-1 mt-0.5">
                                <MessageCircle className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] text-gray-400 truncate max-w-20">
                                    {encuesta.feedback}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-1 text-gray-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Pendiente</span>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card flex flex-col h-full">
                {/* Header */}
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex-shrink-0">
                            <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Encuestas Post-Cita
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Esta semana
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-500/10">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                {stats.enviadasSemana}
                            </span>
                        </div>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Enviadas</p>
                    </div>

                    <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-500/10">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {stats.respondidasSemana}
                            </span>
                        </div>
                        <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Respondidas</p>
                    </div>

                    <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-500/10">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                {stats.tasaRespuesta}%
                            </span>
                        </div>
                        <p className="text-xs text-purple-600/70 dark:text-purple-400/70">Tasa Resp.</p>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-3 dark:bg-amber-500/10">
                        <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                {stats.calificacionPromedio.toFixed(1)}
                            </span>
                        </div>
                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70">Promedio</p>
                    </div>
                </div>

                {/* Últimas Encuestas */}
                <div className="space-y-2 flex-1">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Últimas Encuestas
                        </p>
                        {totalEncuestas > 0 && (
                            <span className="text-xs text-gray-400">
                                {totalEncuestas} encuestas
                            </span>
                        )}
                    </div>

                    {displayedEncuestas.length > 0 ? (
                        <div className="space-y-2">
                            {displayedEncuestas.map((encuesta, index) => renderEncuestaRow(encuesta, index))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <MessageSquare className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No hay encuestas recientes
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Stats & Pagination */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border">
                    <div className="flex items-center justify-between text-xs mb-4">
                        <span className="text-gray-500 dark:text-gray-400">
                            📱 Hoy: <span className="font-medium text-gray-700 dark:text-gray-300">{stats.enviadasHoy}</span> enviadas
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                            💬 <span className="font-medium text-gray-700 dark:text-gray-300">{stats.conFeedback}</span> con repuestas
                        </span>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                Mostrando {startIndex + 1}-{Math.min(startIndex + maxItems, totalEncuestas)} de {totalEncuestas}
                            </span>
                            <div className="flex gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-300"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EncuestasPostCitaWidget;
