/**
 * ValleyHoursWidget.tsx
 * BI Widget 2 — Identify slow day/hour slots for targeted campaigns.
 * Heatmap visualization + valley day cards + actionable insights.
 * Premium iPhone-style. Nilah IA · Korat Flow.
 */
import React from 'react';
import { CalendarClock, TrendingUp, Target, Send } from 'lucide-react';
import { ValleySlot } from '../../types/crm';

interface ValleyDayInfo {
    dayOfWeek: number;
    dayLabel: string;
    totalBookings: number;
    isValley: boolean;
}

interface Props {
    slots: ValleySlot[];
    valleyDays: ValleyDayInfo[];
    peakDays: { dayLabel: string; dayOfWeek: number; totalBookings: number }[];
    onCreateCampaign?: (dayLabel: string) => void;
}

const HOUR_LABELS: Record<number, string> = {
    8: '8am', 9: '9am', 10: '10am', 11: '11am', 12: '12pm',
    13: '1pm', 14: '2pm', 15: '3pm', 16: '4pm', 17: '5pm',
    18: '6pm', 19: '7pm', 20: '8pm',
};

// Map a booking count to a Tailwind opacity class for heatmap cells
function getHeatColor(count: number, max: number): string {
    if (max === 0 || count === 0) return 'bg-gray-100 dark:bg-gray-800/40';
    const ratio = count / max;
    if (ratio >= 0.8) return 'bg-indigo-500';
    if (ratio >= 0.6) return 'bg-indigo-400';
    if (ratio >= 0.4) return 'bg-indigo-300';
    if (ratio >= 0.2) return 'bg-indigo-200';
    return 'bg-indigo-100 dark:bg-indigo-900/30';
}

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const ValleyHoursWidget: React.FC<Props> = ({ slots, valleyDays, peakDays, onCreateCampaign }) => {
    const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    const days = [1, 2, 3, 4, 5, 6]; // Mon–Sat (skip Sunday = 0)

    // Max count for normalization
    const maxCount = Math.max(...slots.map(s => s.bookingCount), 1);

    const valleyDaysFiltered = valleyDays.filter(d => d.isValley && d.dayOfWeek !== 0);
    const busyDays = [...valleyDays].filter(d => d.dayOfWeek !== 0).sort((a, b) => b.totalBookings - a.totalBookings);
    const maxDayCount = Math.max(...busyDays.map(d => d.totalBookings), 1);

    return (
        <div className="rounded-3xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Gradient header */}
            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 p-5 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" aria-hidden />
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                        <CalendarClock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white leading-tight tracking-tight">Horas Valle</h3>
                        <p className="text-[11px] text-white/75">Identifica los horarios lentos para campañas dirigidas</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card p-4 space-y-5">
                {/* Day bar chart */}
                <div>
                    <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-cyan-500" />
                        Citas por día
                    </h4>
                    <div className="flex items-end gap-1.5 h-20">
                        {busyDays.map(d => {
                            const barH = maxDayCount > 0 ? Math.round((d.totalBookings / maxDayCount) * 100) : 0;
                            return (
                                <div key={d.dayOfWeek} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex items-end justify-center" style={{ height: '60px' }}>
                                        <div
                                            className={`w-full rounded-t-lg transition-all duration-700 ${d.isValley ? 'bg-cyan-200 dark:bg-cyan-800/50' : 'bg-gradient-to-t from-cyan-400 to-blue-500'}`}
                                            style={{ height: `${barH}%`, minHeight: '4px' }}
                                        />
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{DAY_SHORT[d.dayOfWeek]}</span>
                                    {d.isValley && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-cyan-300" title="Día valle" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-4 rounded-sm bg-gradient-to-r from-cyan-400 to-blue-500" />
                            <span className="text-[10px] text-gray-400 font-medium">Ocupado</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="h-2 w-4 rounded-sm bg-cyan-200 dark:bg-cyan-800/50" />
                            <span className="text-[10px] text-gray-400 font-medium">Valle</span>
                        </div>
                    </div>
                </div>

                {/* Heatmap mini */}
                <div>
                    <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        Mapa de calor (hora × día)
                    </h4>
                    <div className="overflow-x-auto -mx-1 px-1">
                        <div className="min-w-max">
                            {/* Hour headers */}
                            <div className="flex gap-1 mb-1 ml-8">
                                {hours.map(h => (
                                    <div key={h} className="w-7 text-center text-[8px] text-gray-400 font-medium">{HOUR_LABELS[h]}</div>
                                ))}
                            </div>
                            {/* Grid */}
                            {days.map(day => (
                                <div key={day} className="flex items-center gap-1 mb-1">
                                    <span className="w-7 text-[9px] font-bold text-gray-500 dark:text-gray-400 text-right pr-1">{DAY_SHORT[day]}</span>
                                    {hours.map(hour => {
                                        const slot = slots.find(s => s.dayOfWeek === day && s.hour === hour);
                                        const count = slot?.bookingCount || 0;
                                        return (
                                            <div
                                                key={hour}
                                                title={`${DAY_SHORT[day]} ${HOUR_LABELS[hour]}: ${count} citas`}
                                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold ${getHeatColor(count, maxCount)} ${count > 0 ? 'text-white' : 'text-gray-300 dark:text-gray-600'}`}
                                            >
                                                {count > 0 ? count : ''}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Valley day action cards */}
                {valleyDaysFiltered.length > 0 && (
                    <div>
                        <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                            <Target className="h-3.5 w-3.5 text-cyan-500" />
                            Días lentos — oportunidad de campaña
                        </h4>
                        <div className="space-y-2">
                            {valleyDaysFiltered.map(d => (
                                <div
                                    key={d.dayOfWeek}
                                    className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-100 dark:border-cyan-800/30 p-3.5"
                                >
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-black text-sm shadow-sm">
                                        {DAY_SHORT[d.dayOfWeek]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-800 dark:text-white">{d.dayLabel}</p>
                                        <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                            Solo {d.totalBookings} citas · Ideal para promoción
                                        </p>
                                    </div>
                                    {onCreateCampaign && (
                                        <button
                                            onClick={() => onCreateCampaign(d.dayLabel)}
                                            className="flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-3 py-2 text-[11px] font-black text-white active:scale-95 transition-transform shadow-sm shadow-cyan-500/30"
                                        >
                                            <Send className="h-3 w-3" />
                                            Campaña
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {slots.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <CalendarClock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm font-medium">Sin suficientes datos de citas</p>
                        <p className="text-xs opacity-70">Necesitas al menos 10 citas completadas</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ValleyHoursWidget;
