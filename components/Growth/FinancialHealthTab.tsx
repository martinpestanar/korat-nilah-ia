import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { Target, Zap, BarChart3, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import WidgetHelper from '../UI/WidgetHelper';
import { useCurrency } from '../../hooks/useCurrency';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const COLORS = { emerald: '#10B981', blue: '#3B82F6', violet: '#8B5CF6', amber: '#F59E0B' };

const CustomTooltip = ({ active, payload, label, prefix }: any) => {
    const { formatMoney } = useCurrency();
    const resolvedPrefix = prefix || (formatMoney(0).replace(/[0.,\s]/g, '') + ' ');
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-3 shadow-xl">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-sm font-bold" style={{ color: entry.color }}>
                    {entry.name}: {resolvedPrefix}{typeof entry.value === 'number' ? entry.value.toLocaleString('es-PE') : entry.value}
                </p>
            ))}
        </div>
    );
};

const StatCard = ({ label, value, subLabel, icon: Icon, trend, colorClass, delay = 0 }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.4 }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 shadow-sm"
    >
        <div className="flex items-start justify-between">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClass.bg}`}>
                <Icon className={`h-5 w-5 ${colorClass.text}`} />
            </div>
            {trend !== undefined && (
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
                    {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(trend)}%
                </span>
            )}
        </div>
        <div className="mt-4">
            <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{value}</p>
            <p className="mt-0.5 text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
            {subLabel && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{subLabel}</p>}
        </div>
    </motion.div>
);

const FinancialHealthTab: React.FC<{ dateFilter?: { start: string; end: string; label: string } }> = ({ dateFilter }) => {
    const { appointments } = useDashboardData();
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

    // Build monthly revenue series from filtered appointments
    const monthlyData = useMemo(() => {
        const byMonth: Record<string, { revenue: number; count: number; tickets: number[] }> = {};
        filteredAppointments.forEach((c: any) => {
            if (c.estado !== 'Completada') return;
            const date = new Date(c.fecha_hora || c.fecha || '');
            if (isNaN(date.getTime())) return;
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { revenue: 0, count: 0, tickets: [] };
            const price = parseFloat(c.precio_servicio || c.precio || 0);
            byMonth[key].revenue += price;
            byMonth[key].count += 1;
            if (price > 0) byMonth[key].tickets.push(price);
        });
        return Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-8)
            .map(([key, val]) => {
                const [, m] = key.split('-');
                const avg = val.tickets.length > 0 ? val.tickets.reduce((a, b) => a + b, 0) / val.tickets.length : 0;
                return { month: MONTH_NAMES[parseInt(m) - 1], revenue: Math.round(val.revenue), citas: val.count, ticket: Math.round(avg) };
            });
    }, [filteredAppointments]);

    const lastM = monthlyData[monthlyData.length - 1];
    const prevM = monthlyData[monthlyData.length - 2];
    const revTrend = lastM && prevM && prevM.revenue > 0
        ? Math.round(((lastM.revenue - prevM.revenue) / prevM.revenue) * 100) : 0;
    const ticketTrend = lastM && prevM && prevM.ticket > 0
        ? Math.round(((lastM.ticket - prevM.ticket) / prevM.ticket) * 100) : 0;
    const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);
    const avgMonthlyRevenue = monthlyData.length > 0 ? Math.round(totalRevenue / monthlyData.length) : 0;

    // Projection
    const projectionData = useMemo(() => {
        if (monthlyData.length < 2) return [];
        const n = monthlyData.length;
        const yMean = totalRevenue / n;
        const xMean = (n - 1) / 2;
        let num = 0, den = 0;
        monthlyData.forEach((m, i) => { num += (i - xMean) * (m.revenue - yMean); den += (i - xMean) ** 2; });
        const slope = den !== 0 ? num / den : 0;
        const projected = Math.max(0, Math.round(slope * n + (yMean - slope * xMean)));
        const nextMonthIdx = new Date().getMonth();
        const projLabel = `${MONTH_NAMES[nextMonthIdx]} (est.)`;
        return [...monthlyData, { month: projLabel, revenue: 0, citas: 0, ticket: 0, projected }];
    }, [monthlyData, totalRevenue]);

    const hasData = monthlyData.length > 0;

    const colorClasses = {
        emerald: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400' },
        blue: { bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400' },
        violet: { bg: 'bg-violet-50 dark:bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400' },
        amber: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400' },
    };

    // Calculate totals for the selected period
    const totalPeriodRevenue = useMemo(() => {
        return filteredAppointments
            .filter((c: any) => c.estado === 'Completada')
            .reduce((sum: number, c: any) => sum + parseFloat(c.precio_servicio || c.precio || 0), 0);
    }, [filteredAppointments]);

    const periodTickets = filteredAppointments.filter((c: any) => c.estado === 'Completada' && parseFloat(c.precio_servicio || c.precio || 0) > 0);
    const periodAvgTicket = periodTickets.length > 0 ? totalPeriodRevenue / periodTickets.length : 0;
    const periodCompletedCitas = periodTickets.length; // Approximate from tickets

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard delay={0} icon={DollarSign} label="Ingresos" value={formatMoney(Math.round(totalPeriodRevenue))} trend={revTrend} colorClass={colorClasses.emerald} subLabel={dateFilter?.label || "mes en curso"} />
                <StatCard delay={0.08} icon={Target} label="Ticket Promedio" value={formatMoney(Math.round(periodAvgTicket))} trend={ticketTrend} colorClass={colorClasses.blue} subLabel="por cita en periodo" />
                <StatCard delay={0.16} icon={BarChart3} label="Citas Completadas" value={periodCompletedCitas} colorClass={colorClasses.violet} subLabel="en periodo" />
                <StatCard delay={0.24} icon={TrendingUp} label="Promedio Mensual" value={formatMoney(Math.round(avgMonthlyRevenue))} colorClass={colorClasses.amber} subLabel="últimos 8 meses" />
            </div>

            {/* Revenue Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Evolución de Ingresos</h3>
                        <WidgetHelper
                            title="Evolución de Ingresos"
                            what="Ingresos brutos generados mes a mes por servicios completados."
                            why="Muestra tu crecimiento real en el tiempo. Si la tendencia baja, podrías necesitar promociones o rescate de clientes."
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ingresos brutos por mes (citas completadas)</p>
                </div>
                {hasData ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={55} tickFormatter={v => v === 0 ? '0' : `${formatMoney(0).replace(/[0.,\s]/g, '')}${(v / 1000).toFixed(0)}k`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="revenue" name="Ingresos" stroke={COLORS.emerald} strokeWidth={2.5} fill="url(#revGrad)" dot={{ fill: COLORS.emerald, r: 4 }} activeDot={{ r: 6 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-52 items-center justify-center flex-col gap-2">
                        <TrendingUp className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-400">Aún no hay citas completadas con precio registrado.</p>
                    </div>
                )}
            </motion.div>

            {/* Ticket + Projection */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Evolución del Ticket</h3>
                            <WidgetHelper
                                title="Evolución del Ticket Promedio"
                                what="El monto promedio que gasta cada cliente por cita."
                                why="Si el ticket es alto, ganas más con menos esfuerzo. Súbelo ofreciendo servicios complementarios (up-sell)."
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gasto promedio por visita</p>
                    </div>
                    {hasData ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => formatMoney(v)} />
                                <Tooltip content={<CustomTooltip />} />
                                <Line type="monotone" dataKey="ticket" name="Ticket" stroke={COLORS.blue} strokeWidth={2.5} dot={{ fill: COLORS.blue, r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Sin datos suficientes</div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">Proyección Próximo Mes</h3>
                                <WidgetHelper
                                    title="Proyección Próximo Mes"
                                    what="Predicción de ingresos generada por Nilah basándose en tu historial."
                                    why="Te ayuda a anticipar si llegarás a tu meta mensual y tomar acción a tiempo."
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tendencia lineal basada en historial</p>
                        </div>
                        <span className="ml-auto flex items-center gap-1 rounded-full bg-violet-50 dark:bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-400">
                            <Zap className="h-3 w-3" /> IA
                        </span>
                    </div>
                    {projectionData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={160}>
                                <BarChart data={projectionData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={50} tickFormatter={v => v === 0 ? '0' : `${formatMoney(0).replace(/[0.,\s]/g, '')}${(v / 1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="revenue" name="Real" fill={COLORS.emerald} radius={[6, 6, 0, 0]} fillOpacity={0.85} />
                                    <Bar dataKey="projected" name="Estimado" fill={COLORS.violet} radius={[6, 6, 0, 0]} fillOpacity={0.5} />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Real</span>
                                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400 inline-block" />Estimado</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Se necesitan 2+ meses para proyectar</div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default FinancialHealthTab;
