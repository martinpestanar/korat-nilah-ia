import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useDashboardData } from '../../context/DashboardDataContext';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-3 shadow-xl">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
            {payload.map((e: any, i: number) => (
                <p key={i} style={{ color: e.color || '#8B5CF6' }} className="text-sm font-bold">{e.name || e.dataKey}: {e.value}</p>
            ))}
        </div>
    );
};

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const SVCCOLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#F43F5E', '#6366F1', '#14B8A6'];

const OperationalTab: React.FC<{ dateFilter?: { start: string; end: string; label: string } }> = ({ dateFilter }) => {
    const { appointments, raw } = useDashboardData();

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

    const { hourlyDist, staffPerf, serviceBreakdown, occupancyByMonth } = useMemo(() => {
        const staff = (raw?.staff || []) as any[];

        // Occupancy by month
        const byMonth: Record<string, { total: number; completed: number }> = {};
        filteredAppointments.forEach((c: any) => {
            const d = new Date(c.fecha_hora || c.fecha || '');
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!byMonth[key]) byMonth[key] = { total: 0, completed: 0 };
            byMonth[key].total++;
            if (c.estado === 'Completada') byMonth[key].completed++;
        });
        const occupancyByMonth = Object.entries(byMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-8)
            .map(([key, v]) => {
                const [, m] = key.split('-');
                const pct = v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0;
                return { month: MONTH_NAMES[parseInt(m) - 1], ocupacion: pct, total: v.total };
            });

        // Hourly distribution
        const hourBuckets: Record<number, number> = {};
        filteredAppointments.forEach((c: any) => {
            if (c.estado !== 'Completada') return;
            const d = new Date(c.fecha_hora || c.fecha || '');
            if (isNaN(d.getTime())) return;
            const h = d.getHours();
            hourBuckets[h] = (hourBuckets[h] || 0) + 1;
        });
        const hourlyDist = Array.from({ length: 12 }, (_, i) => ({
            hour: `${i + 8}:00`,
            citas: hourBuckets[i + 8] || 0,
        }));

        // Staff performance
        const staffMap: Record<string, { name: string; completed: number }> = {};
        filteredAppointments.forEach((c: any) => {
            const sid = String(c.staff_id || c.staffId || '');
            if (!sid) return;
            const sData = staff.find((s: any) => String(s.id) === sid);
            const name = sData?.nombre || sData?.name || `Staff ${sid}`;
            if (!staffMap[sid]) staffMap[sid] = { name, completed: 0 };
            if (c.estado === 'Completada') staffMap[sid].completed++;
        });
        const staffPerf = Object.values(staffMap)
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 6);

        // Service breakdown
        const svcMap: Record<string, number> = {};
        filteredAppointments.forEach((c: any) => {
            if (c.estado !== 'Completada') return;
            const svc = c.servicio || c.tipo_servicio || 'Sin categoría';
            svcMap[svc] = (svcMap[svc] || 0) + 1;
        });
        const serviceBreakdown = Object.entries(svcMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 7)
            .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, value }));

        return { hourlyDist, staffPerf, serviceBreakdown, occupancyByMonth };
    }, [filteredAppointments, raw]);

    const maxHour = Math.max(...hourlyDist.map(h => h.citas), 1);

    return (
        <div className="space-y-6">
            {/* Occupancy by Month */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Tasa de Ocupación Mensual</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">% de citas completadas vs. agendadas</p>
                </div>
                {occupancyByMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={occupancyByMonth} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={45} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="ocupacion" name="Ocupación %" radius={[8, 8, 0, 0]} fill="#8B5CF6" fillOpacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                        {filteredAppointments.length === 0 ? 'Sin citas cargadas en el periodo.' : 'Sin datos de meses anteriores.'}
                    </div>
                )}
            </motion.div>

            {/* Peak Hours + Service Breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Horas Pico</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Distribución de citas completadas por horario</p>
                    </div>
                    {hourlyDist.some(h => h.citas > 0) ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={hourlyDist} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                                <XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={1} />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={25} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="citas" name="Citas" radius={[6, 6, 0, 0]}>
                                    {hourlyDist.map((entry, i) => (
                                        <Bar key={i} fill={entry.citas === maxHour && maxHour > 0 ? '#F59E0B' : '#3B82F6'} fillOpacity={entry.citas === maxHour && maxHour > 0 ? 1 : 0.6} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Sin datos de horarios disponibles</div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Servicios Más Demandados</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cantidad de citas completadas por servicio</p>
                    </div>
                    {serviceBreakdown.length > 0 ? (
                        <div className="space-y-3">
                            {serviceBreakdown.map((svc, i) => {
                                const maxVal = serviceBreakdown[0].value;
                                const pct = maxVal > 0 ? (svc.value / maxVal) * 100 : 0;
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.06 }} className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{svc.name}</span>
                                            <span className="text-xs font-bold text-gray-900 dark:text-white">{svc.value}</span>
                                        </div>
                                        <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-dark-bg overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.8, delay: 0.4 + i * 0.06, type: 'spring' }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: SVCCOLORS[i % SVCCOLORS.length] }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Sin datos de servicios ({filteredAppointments.length} citas en periodo)</div>
                    )}
                </motion.div>
            </div>

            {/* Staff Productivity */}
            {staffPerf.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-6 shadow-sm">
                    <div className="mb-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Productividad del Staff</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Citas completadas por profesional</p>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(160, staffPerf.length * 40)}>
                        <BarChart data={staffPerf} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="completed" name="Citas" radius={[0, 8, 8, 0]} fill="#8B5CF6" fillOpacity={0.85} />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}
        </div>
    );
};

export default OperationalTab;
