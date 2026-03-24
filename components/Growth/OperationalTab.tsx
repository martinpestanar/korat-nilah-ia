import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { useDashboardData } from '../../context/DashboardDataContext';
import WidgetHelper from '../UI/WidgetHelper';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl bg-white/95 dark:bg-[#111118]/95 backdrop-blur-md border border-gray-100 dark:border-white/[0.07] p-4 shadow-xl shadow-black/5 dark:shadow-black/20">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{label}</p>
            {payload.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: e.color || e.payload?.fill || '#8B5CF6' }} />
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                        {e.name || e.dataKey}: {e.value}
                    </p>
                </div>
            ))}
        </div>
    );
};

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const SVCCOLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6'];

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

        // Hourly distribution (8:00 to 21:00 = 14 slots)
        const hourBuckets: Record<number, number> = {};
        filteredAppointments.forEach((c: any) => {
            if (c.estado !== 'Completada') return;
            const d = new Date(c.fecha_hora || c.fecha || '');
            if (isNaN(d.getTime())) return;
            const h = d.getHours();
            hourBuckets[h] = (hourBuckets[h] || 0) + 1;
        });
        const hourlyDist = Array.from({ length: 14 }, (_, i) => ({
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
            <svg width="0" height="0">
                <defs>
                    <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                    <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#F97316" />
                    </linearGradient>
                    <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" />
                        <stop offset="100%" stopColor="#2563EB" />
                    </linearGradient>
                    <linearGradient id="staffGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Occupancy by Month */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="rounded-3xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.05] p-5 sm:p-6 shadow-sm">
                <div className="mb-6">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Tasa de Ocupación Mensual</h3>
                        <WidgetHelper
                            title="Tasa de Ocupación"
                            what="Porcentaje de citas agendadas que realmente terminaron en atención (Completadas)."
                            why="Si ves la barra muy baja, tu índice de No-Shows es crítico. Nilah puede enviar recordatorios más agresivos."
                        />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Éxito de concretación de agendados</p>
                </div>
                {occupancyByMonth.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={occupancyByMonth} margin={{ top: 10, right: 0, bottom: 0, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} dy={10} />
                            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                            <Tooltip cursor={{ fill: 'var(--tw-colors-gray-100)', opacity: 0.1 }} content={<CustomTooltip />} />
                            <Bar dataKey="ocupacion" name="Ocupación %" radius={[6, 6, 0, 0]} fill="url(#primaryGrad)" activeBar={{ fill: 'url(#staffGrad)' }} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-48 items-center justify-center text-sm text-gray-400">
                        {filteredAppointments.length === 0 ? 'Sin citas cargadas en el periodo.' : 'Sin datos suficientes.'}
                    </div>
                )}
            </motion.div>

            {/* Peak Hours + Service Breakdown */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-3xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.05] p-5 sm:p-6 shadow-sm">
                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Horas Pico Reales</h3>
                            <WidgetHelper
                                title="Análisis de Horarios"
                                what="A qué hora tu salón factura realmente (citas completadas)."
                                why="Si a las 10am no hay nadie, puedes decirle a Nilah que envíe promos relámpago a las 9am para llenar ese hueco."
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tráfico de clientes durante el día</p>
                    </div>
                    {hourlyDist.some(h => h.citas > 0) ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={hourlyDist} margin={{ top: 10, right: 0, bottom: 0, left: -30 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" vertical={false} />
                                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={1} dy={10} />
                                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'rgba(150,150,150,0.1)' }} content={<CustomTooltip />} />
                                <Bar dataKey="citas" name="Citas" radius={[4, 4, 0, 0]} activeBar={{ fill: 'url(#primaryGrad)' }}>
                                    {hourlyDist.map((entry, i) => (
                                        <Cell 
                                            key={i} 
                                            fill={entry.citas === maxHour && maxHour > 0 ? 'url(#amberGrad)' : 'url(#blueGrad)'} 
                                            fillOpacity={entry.citas === maxHour && maxHour > 0 ? 1 : 0.7} 
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Sin datos de horarios disponibles</div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="rounded-3xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.05] p-5 sm:p-6 shadow-sm">
                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Servicios Estrella</h3>
                            <WidgetHelper
                                title="Top Servicios"
                                what="Es tu flujo de caja puro. Lo que más se pide y concreta."
                                why="Puedes armar estrategias Cross-Selling (Venta cruzada) ligando el servicio top 1 con el servicio en el cuarto lugar."
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ranking por volumen de atenciones</p>
                    </div>
                    {serviceBreakdown.length > 0 ? (
                        <div className="space-y-4">
                            {serviceBreakdown.map((svc, i) => {
                                const maxVal = serviceBreakdown[0].value;
                                const pct = maxVal > 0 ? (svc.value / maxVal) * 100 : 0;
                                return (
                                    <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.05 }} className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{svc.name}</span>
                                            <span className="text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{svc.value}</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-dark-bg overflow-hidden shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                                transition={{ duration: 0.8, delay: 0.4 + i * 0.05, ease: 'easeOut' }}
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: SVCCOLORS[i % SVCCOLORS.length] }}
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex h-44 items-center justify-center text-sm text-gray-400">Pocos datos para tabular.</div>
                    )}
                </motion.div>
            </div>

            {/* Staff Productivity */}
            {staffPerf.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                    className="rounded-3xl bg-white dark:bg-[#111118] border border-gray-100 dark:border-white/[0.05] p-5 sm:p-6 shadow-sm">
                    <div className="mb-6">
                        <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Productividad del Equipo</h3>
                            <WidgetHelper
                                title="Análisis de Staff"
                                what="Mide el volumen de clientes que cerró cada profesional."
                                why="Puedes darle un bono al top 1 y motivar al equipo."
                            />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ranking de citas completadas por especialista</p>
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(220, staffPerf.length * 45)}>
                        <BarChart data={staffPerf} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(150,150,150,0.1)" horizontal={true} vertical={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} axisLine={false} tickLine={false} width={80} />
                            <Tooltip cursor={{ fill: 'rgba(150,150,150,0.1)' }} content={<CustomTooltip />} />
                            <Bar 
                                dataKey="completed" 
                                name="Citas" 
                                radius={[0, 6, 6, 0]} 
                                fill="url(#staffGrad)" 
                                activeBar={{ fill: 'url(#primaryGrad)' }} 
                                barSize={24}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </motion.div>
            )}
        </div>
    );
};

export default OperationalTab;
