import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Zap, CheckCircle } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

interface Insight {
    type: 'positive' | 'warning' | 'opportunity' | 'tip';
    title: string;
    description: string;
    metric?: string;
    action?: string;
    priority: number;
}

const ICONS: Record<string, React.FC<any>> = {
    positive: TrendingUp,
    warning: AlertTriangle,
    opportunity: Target,
    tip: Lightbulb,
};

const STYLES: Record<string, { bg: string; text: string; border: string; icon: string }> = {
    positive: { bg: 'bg-emerald-50 dark:bg-emerald-500/5', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200/80 dark:border-emerald-500/20', icon: 'text-emerald-500' },
    warning: { bg: 'bg-amber-50 dark:bg-amber-500/5', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200/80 dark:border-amber-500/20', icon: 'text-amber-500' },
    opportunity: { bg: 'bg-blue-50 dark:bg-blue-500/5', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200/80 dark:border-blue-500/20', icon: 'text-blue-500' },
    tip: { bg: 'bg-violet-50 dark:bg-violet-500/5', text: 'text-violet-800 dark:text-violet-300', border: 'border-violet-200/80 dark:border-violet-500/20', icon: 'text-violet-500' },
};

const AIInsightsTab: React.FC<{ dateFilter?: { start: string; end: string; label: string } }> = ({ dateFilter }) => {
    const { appointments, clients, financials, operational, engagementExtras } = useDashboardData();
    const { formatMoney } = useCurrency();

    // Filter appointments by date
    const filteredAppointments = useMemo(() => {
        if (!dateFilter || (!dateFilter.start && !dateFilter.end)) return appointments;
        const start = dateFilter.start ? new Date(dateFilter.start) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = dateFilter.end ? new Date(dateFilter.end) : null;
        if (end) end.setHours(23, 59, 59, 999);

        return appointments.filter((c: any) => {
            const d = new Date(c.fecha_hora || c.fecha || '');
            if (isNaN(d.getTime())) return false;
            if (start && d < start) return false;
            if (end && d > end) return false;
            return true;
        });
    }, [appointments, dateFilter]);

    const insights = useMemo((): Insight[] => {
        const result: Insight[] = [];

        // === 1. REVENUE TREND (month-over-month) ===
        const byMonth: Record<string, number> = {};
        filteredAppointments.forEach((c: any) => {
            if (c.estado !== 'Completada') return;
            const d = new Date(c.fecha_hora || c.fecha || '');
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            byMonth[key] = (byMonth[key] || 0) + parseFloat(c.precio_servicio || c.precio || 0);
        });
        const months = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b));
        const lastRevenue = months[months.length - 1]?.[1] ?? 0;
        const prevRevenue = months[months.length - 2]?.[1] ?? 0;
        if (lastRevenue > 0 && prevRevenue > 0) {
            const revChange = ((lastRevenue - prevRevenue) / prevRevenue) * 100;
            if (revChange > 10) {
                result.push({ type: 'positive', priority: 1, title: '📈 Tus ingresos están creciendo', description: `Este mes generaste un ${Math.round(revChange)}% más en ingresos que el mes anterior. Estás en buen ritmo.`, metric: `+${Math.round(revChange)}% vs. mes anterior`, action: 'Sigue impulsando las campañas de marketing para mantener el impulso.' });
            } else if (revChange < -10) {
                result.push({ type: 'warning', priority: 1, title: '⚠️ Caída en ingresos este mes', description: `Los ingresos bajaron un ${Math.abs(Math.round(revChange))}% respecto al mes anterior.`, metric: `${Math.round(revChange)}% vs. mes anterior`, action: 'Activa una campaña de rescate en el módulo de CRM para reactivar clientes.' });
            }
        }

        // === 2. CANCELLATION RATE ===
        const totalCitas = filteredAppointments.length;
        if (totalCitas > 5) {
            const canceladas = filteredAppointments.filter((c: any) => c.estado === 'Cancelada').length;
            const noShows = filteredAppointments.filter((c: any) => c.estado === 'No-Show').length;
            const cancelRate = (canceladas + noShows) / totalCitas;
            if (cancelRate > 0.2) {
                result.push({ type: 'warning', priority: 2, title: '🚫 Alta tasa de cancelaciones y no-shows', description: `El ${Math.round(cancelRate * 100)}% de tus citas se cancela o termina en no-show. Esto reduce directamente tu ocupación e ingresos.`, metric: `${canceladas} canceladas · ${noShows} no-shows de ${totalCitas}`, action: 'Activa recordatorios automáticos 24h antes en el módulo Engagement.' });
            }
        }

        // === 3. AT-RISK CLIENTS ===
        const atRiskClients = clients.filter((c: any) => ['En Riesgo', 'Perdido', 'Enfriándose'].includes(c.categoria || c.lifecycle || '')).length;
        if (atRiskClients > 0) {
            result.push({ type: 'opportunity', priority: 3, title: '🎯 Clientes que necesitan atención', description: `Tienes ${atRiskClients} clientes que no han vuelto en mucho tiempo. Rescatar el 20% representaría ingresos adicionales inmediatos.`, metric: `${atRiskClients} clientes en riesgo o perdidos`, action: 'Usa el módulo CRM → botón "Rescatar" para enviarles un mensaje personalizado.' });
        }

        // === 4. TICKET TREND ===
        const completedWithPrice = filteredAppointments.filter((c: any) => c.estado === 'Completada' && parseFloat(c.precio_servicio || c.precio || 0) > 0);
        if (completedWithPrice.length >= 10) {
            const half = Math.floor(completedWithPrice.length / 2);
            const avgFirst = completedWithPrice.slice(0, half).reduce((s: number, c: any) => s + parseFloat(c.precio_servicio || c.precio || 0), 0) / half;
            const avgSecond = completedWithPrice.slice(half).reduce((s: number, c: any) => s + parseFloat(c.precio_servicio || c.precio || 0), 0) / (completedWithPrice.length - half);
            const ticketChange = ((avgSecond - avgFirst) / avgFirst) * 100;
            if (ticketChange < -5) {
                result.push({ type: 'opportunity', priority: 4, title: '💡 Oportunidad: aumentar tu ticket promedio', description: `Tu ticket bajó un ${Math.abs(Math.round(ticketChange))}%. Un combo de servicios complementarios podría revertirlo.`, metric: `${formatMoney(Math.round(avgFirst))} → ${formatMoney(Math.round(avgSecond))}`, action: 'Crea combos en Configuración y promuévelos en el módulo Marketing.' });
            } else if (ticketChange > 10) {
                result.push({ type: 'positive', priority: 4, title: '💰 Tu ticket promedio está subiendo', description: `El ticket promedio creció un ${Math.round(ticketChange)}%. Tus clientes están gastando más por visita.`, metric: `${formatMoney(Math.round(avgFirst))} → ${formatMoney(Math.round(avgSecond))}` });
            }
        }

        // === 5. OCCUPANCY ===
        const completedCount = filteredAppointments.filter((c: any) => c.estado === 'Completada').length;
        const occupancy = totalCitas > 0 ? completedCount / totalCitas : 0;
        if (totalCitas > 3 && occupancy < 0.6) {
            result.push({ type: 'tip', priority: 5, title: '🕐 Agenda con espacio disponible', description: `Solo el ${Math.round(occupancy * 100)}% de las citas agendadas se concreta. Puedes crecer sin contratar más personal.`, metric: `${Math.round(occupancy * 100)}% de ocupación efectiva`, action: 'Usa Marketing para crear una campaña de "horarios disponibles" con descuento.' });
        }

        // === 6. RATINGS (NPS from engagementExtras) ===
        const avgRating = engagementExtras?.statsCalificaciones?.promedio;
        const totalRatings = engagementExtras?.statsCalificaciones?.total;
        if (avgRating && totalRatings && totalRatings > 0) {
            if (avgRating >= 4.5) {
                result.push({ type: 'positive', priority: 6, title: '⭐ Calidad de servicio excelente', description: `Tu calificación promedio es ${avgRating.toFixed(1)}/5 sobre ${totalRatings} reseñas. Ese nivel de satisfacción es tu mejor herramienta de marketing.`, metric: `${avgRating.toFixed(1)}/5 · ${totalRatings} reseñas`, action: 'Pide reseñas en Google desde el módulo Engagement para que el mundo lo sepa.' });
            } else if (avgRating < 3.5) {
                result.push({ type: 'warning', priority: 2, title: '⚠️ Calidad por debajo de lo esperado', description: `Tu calificación promedio es ${avgRating.toFixed(1)}/5. Analiza qué servicios o profesionales tienen las notas más bajas.`, metric: `${avgRating.toFixed(1)}/5 · ${totalRatings} reseñas`, action: 'Revisa el ranking de servicios y staff en el módulo Engagement.' });
            }
        }

        // === 7. SEASONAL PATTERN (detect slow month) ===
        if (months.length >= 4) {
            const currentMonth = new Date().getMonth();
            const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const valuesForCurrentMonth = months.filter(([k]) => parseInt(k.split('-')[1]) - 1 === currentMonth);
            if (valuesForCurrentMonth.length > 0) {
                const avgAll = months.reduce((s, [, v]) => s + v, 0) / months.length;
                const avgThisMonth = valuesForCurrentMonth.reduce((s, [, v]) => s + v, 0) / valuesForCurrentMonth.length;
                if (avgThisMonth < avgAll * 0.8) {
                    result.push({ type: 'tip', priority: 7, title: `📅 ${MONTH_NAMES[currentMonth]} suele ser un mes bajo`, description: `Históricamente, ${MONTH_NAMES[currentMonth]} genera un 20%+ menos ingresos para tu negocio. Prepara una campaña anticipada.`, action: 'Lanza una promoción especial de temporada desde el módulo Marketing.' });
                }
            }
        }

        // Fallback when no data
        if (result.length === 0) {
            result.push({
                type: 'tip', priority: 99,
                title: '📊 Acumulando datos para el análisis',
                description: `Se analizaron ${filteredAppointments.length} citas y ${clients.length} clientes en el periodo. Para más insights, sigue registrando actividad.`,
                action: 'Completa citas y actualiza el estado de los clientes.',
            });
        }

        return result.sort((a, b) => a.priority - b.priority);
    }, [filteredAppointments, clients, financials, operational, engagementExtras]);

    return (
        <div className="space-y-5">
            {/* Hero */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 p-6 text-white shadow-2xl shadow-violet-500/30 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
                    <div className="absolute -bottom-5 -left-5 h-32 w-32 rounded-full bg-white/5 blur-xl" />
                </div>
                <div className="relative z-10 flex items-start gap-4">
                    <motion.div initial={{ rotate: -10, scale: 0 }} animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                        <Brain className="h-7 w-7 text-white" />
                    </motion.div>
                    <div>
                        <h2 className="text-xl font-bold">Análisis con IA</h2>
                        <p className="mt-1 text-sm text-white/80">
                            Tu asistente analizó {filteredAppointments.length} citas y {clients.length} clientes · {insights.length} conclusiones generadas
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {[
                                { label: `${insights.filter(i => i.type === 'positive').length} Positivos`, color: 'bg-emerald-400/30' },
                                { label: `${insights.filter(i => i.type === 'warning').length} Alertas`, color: 'bg-amber-400/30' },
                                { label: `${insights.filter(i => i.type === 'opportunity').length} Oportunidades`, color: 'bg-blue-400/30' },
                                { label: `${insights.filter(i => i.type === 'tip').length} Tips`, color: 'bg-violet-400/30' },
                            ].filter(b => parseInt(b.label) > 0).map(badge => (
                                <span key={badge.label} className={`rounded-full ${badge.color} px-3 py-0.5 text-xs font-bold text-white`}>{badge.label}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Insight Cards */}
            <div className="space-y-4">
                {insights.map((insight, i) => {
                    const style = STYLES[insight.type];
                    const Icon = ICONS[insight.type];
                    return (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
                            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                            className={`rounded-2xl border ${style.bg} ${style.border} p-5 transition-all`}>
                            <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-dark-card shadow-sm">
                                    <Icon className={`h-5 w-5 ${style.icon}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold text-sm ${style.text}`}>{insight.title}</h4>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{insight.description}</p>
                                    {insight.metric && (
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <Zap className={`h-3.5 w-3.5 ${style.icon}`} />
                                            <span className={`text-xs font-bold ${style.text}`}>{insight.metric}</span>
                                        </div>
                                    )}
                                    {insight.action && (
                                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-white/60 dark:bg-dark-card/50 px-3 py-2.5 border border-white/50 dark:border-dark-border/50">
                                            <CheckCircle className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                                <span className="font-bold text-gray-700 dark:text-gray-300">Acción sugerida: </span>{insight.action}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default AIInsightsTab;
