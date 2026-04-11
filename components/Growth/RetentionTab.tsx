import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Users, UserPlus, Heart, AlertTriangle } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import WidgetHelper from '../UI/WidgetHelper';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F43F5E', '#8B5CF6', '#6366F1'];

const RADIAN = Math.PI / 180;
const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return percent > 0.06 ? (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-3 shadow-xl">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} style={{ color: e.color }} className="text-sm font-bold">{e.name}: {e.value}</p>
            ))}
        </div>
    );
};

const RetentionTab: React.FC<{ dateFilter?: { start: string; end: string; label: string } }> = ({ dateFilter }) => {
    const { clients, appointments } = useDashboardData();

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

    const { monthlyAcq, pieData, stats, topRepeat } = useMemo(() => {
        // Monthly new vs returning from filtered appointments
        const byMonth: Record<string, { nuevos: number; recurrentes: number }> = {};
        filteredAppointments.forEach((c: any) => {
            if (c.estado !== 'Completada') return;
            const d = new Date(c.fecha_hora || c.fecha || '');
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { nuevos: 0, recurrentes: 0 };
            if (c.es_primera_visita) byMonth[key].nuevos++;
            else byMonth[key].recurrentes++;
        });
        const monthlyAcq = Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-8)
            .map(([key, v]) => {
                const [, m] = key.split('-');
                return { month: MONTH_NAMES[parseInt(m) - 1], ...v };
            });

        // Client lifecycle distribution using the normalized `clients` array
        const categories: Record<string, number> = {};
        clients.forEach((c: any) => {
            const cat = c.categoria || c.lifecycle || 'Sin categoría';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        const pieData = Object.entries(categories).map(([name, value], i) => ({
            name, value, color: PIE_COLORS[i % PIE_COLORS.length]
        }));

        const active = clients.filter((c: any) => ['Activo', 'VIP', 'Nuevo'].includes(c.categoria || c.lifecycle || '')).length;
        const atRisk = clients.filter((c: any) => ['En Riesgo', 'Enfriandose'].includes(c.categoria || c.lifecycle || '')).length;
        const lost = clients.filter((c: any) => c.categoria === 'Perdido' || c.lifecycle === 'Perdido').length;

        const topRepeat = [...clients]
            .filter((c: any) => (c.total_visitas || 0) > 1)
            .sort((a: any, b: any) => (b.total_visitas || 0) - (a.total_visitas || 0))
            .slice(0, 5);

        return { monthlyAcq, pieData, stats: { total: clients.length, active, atRisk, lost }, topRepeat };
    }, [clients, filteredAppointments]);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                    { label: 'Total Clientes', value: stats.total, icon: Users, bg: 'bg-blue-50 dark:bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', delay: 0 },
                    { label: 'Activos / VIP', value: stats.active, icon: Heart, bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', delay: 0.08 },
                    { label: 'En Riesgo', value: stats.atRisk, icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', delay: 0.16 },
                    { label: 'Perdidos', value: stats.lost, icon: UserPlus, bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', delay: 0.24 },
                ].map(({ label, value, icon: Icon, bg, text, delay }) => (
                    <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay, duration: 0.4 }} whileHover={{ y: -3, transition: { duration: 0.2 } }}
                        className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 shadow-sm"
                    >
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                            <Icon className={`h-5 w-5 ${text}`} />
                        </div>
                        <p className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Monthly Acq Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                <div className="mb-4">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Nuevos vs. Recurrentes</h3>
                        <WidgetHelper
                            title="Nuevos vs. Recurrentes"
                            what="Compara cuántos clientes nuevos captas vs cuántos regresan."
                            why="Un salón saludable debe tener más clientes recurrentes (fieles) que nuevos. Retener es más barato que captar."
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Evolución mensual de captación y retención</p>
                </div>
                {monthlyAcq.length > 0 ? (
                    <>
                        <ResponsiveContainer width="100%" height={220} minWidth={0}>
                            <AreaChart data={monthlyAcq} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="recurrentes" name="Recurrentes" stroke="#3B82F6" strokeWidth={2.5} fill="url(#recGrad)" />
                                <Area type="monotone" dataKey="nuevos" name="Nuevos" stroke="#10B981" strokeWidth={2.5} fill="url(#newGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                        <div className="flex gap-5 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500 inline-block" />Recurrentes</span>
                            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />Nuevos</span>
                        </div>
                    </>
                ) : (
                    <div className="flex h-52 items-center justify-center text-sm text-gray-400">
                        {clients.length === 0 ? 'Sin clientes cargados todavía.' : 'Sin citas con campo es_primera_visita disponible.'}
                    </div>
                )}
            </motion.div>

            {/* Pie + Top Repeat */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Distribución por Categoría</h3>
                            <WidgetHelper
                                title="Lifecycle de Clientes"
                                what="Agrupa a tus clientes según sus hábitos de visita."
                                why="Presta especial atención a los que están 'Enfriandose' (se demoran más de lo normal en volver) para enviarles promociones."
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Lifecycle de tus clientes</p>
                    </div>
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={200} minWidth={0}>
                                <PieChart>
                                    <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={80}
                                        labelLine={false} label={CustomLabel}>
                                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip formatter={(v) => [v, '']} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {pieData.map((e) => (
                                    <span key={e.name} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: e.color }} />
                                        {e.name} ({e.value})
                                    </span>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Sin datos de clientes</div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Clientes Más Fieles</h3>
                            <WidgetHelper
                                title="Top Clientes Fieles"
                                what="Los clientes que más veces han visitado tu salón."
                                why="¡Prémialos! Son la base de tu negocio. Una atención sorpresa los convertirá en tus mejores embajadores."
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Por número total de visitas</p>
                    </div>
                    {topRepeat.length > 0 ? (
                        <div className="space-y-3">
                            {topRepeat.map((client: any, i: number) => (
                                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.07 }}
                                    className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-sm">
                                            {client.nombre?.charAt(0)?.toUpperCase() || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[140px]">{client.nombre}</p>
                                            <p className="text-xs text-gray-400">{client.categoria || client.lifecycle || 'Cliente'}</p>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-400">
                                        {client.total_visitas} visitas
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Sin datos suficientes</div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default RetentionTab;
