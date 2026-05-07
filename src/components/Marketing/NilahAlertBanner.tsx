import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, AlertTriangle, Crown, TrendingUp } from 'lucide-react';

interface SegmentData {
    vip: number;
    recuperar: number;
    nuevo: number;
    recurrente: number;
    interes_unas?: number;
    interes_pestanas?: number;
    interes_cabello?: number;
    total: number;
}

interface NilahAlertBannerProps {
    segments: SegmentData;
    onViewAudiences: () => void;
}

function getWeekNumber(d: Date) {
    const copy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    copy.setUTCDate(copy.getUTCDate() + 4 - (copy.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((copy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNo;
}

// ─── Alert variant definitions — full dark + light mode tokens ────────────────
const ALERT_VARIANTS = {
    recuperar: {
        id: 'recuperar',
        icon: AlertTriangle,
        // Light mode
        bgLight: 'bg-rose-50',
        borderLight: 'border-rose-200',
        iconBgLight: 'bg-rose-100',
        iconColorLight: 'text-rose-600',
        titleColorLight: 'text-rose-700',
        textColorLight: 'text-gray-600',
        btnLight: 'bg-rose-600 hover:bg-rose-700 text-white',
        // Dark mode
        bgDark: 'dark:bg-rose-950/40',
        borderDark: 'dark:border-rose-800/50',
        iconBgDark: 'dark:bg-rose-900/50',
        iconColorDark: 'dark:text-rose-400',
        titleColorDark: 'dark:text-rose-300',
        textColorDark: 'dark:text-gray-400',
        btnDark: 'dark:bg-rose-500 dark:hover:bg-rose-600 dark:text-white',
        title: 'Alerta de Retención',
        getMessage: (s: SegmentData) =>
            `Nilah detectó ${s.recuperar} clientas sin visita en +90 días. Lanzar una campaña de recuperación hoy tiene un alto porcentaje de éxito.`,
    },
    vip: {
        id: 'vip',
        icon: Crown,
        bgLight: 'bg-amber-50',
        borderLight: 'border-amber-200',
        iconBgLight: 'bg-amber-100',
        iconColorLight: 'text-amber-600',
        titleColorLight: 'text-amber-700',
        textColorLight: 'text-gray-600',
        btnLight: 'bg-amber-500 hover:bg-amber-600 text-white',
        bgDark: 'dark:bg-amber-950/40',
        borderDark: 'dark:border-amber-800/50',
        iconBgDark: 'dark:bg-amber-900/50',
        iconColorDark: 'dark:text-amber-400',
        titleColorDark: 'dark:text-amber-300',
        textColorDark: 'dark:text-gray-400',
        btnDark: 'dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-white',
        title: 'Oportunidad VIP',
        getMessage: (s: SegmentData) =>
            `Tienes ${s.vip} clientas VIP activas. ¿Por qué no enviarles un incentivo exclusivo esta semana para asegurar su lealtad y aumentar tu ticket?`,
    },
    nuevo: {
        id: 'nuevo',
        icon: Sparkles,
        bgLight: 'bg-emerald-50',
        borderLight: 'border-emerald-200',
        iconBgLight: 'bg-emerald-100',
        iconColorLight: 'text-emerald-700',
        titleColorLight: 'text-emerald-700',
        textColorLight: 'text-gray-600',
        btnLight: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        bgDark: 'dark:bg-emerald-950/40',
        borderDark: 'dark:border-emerald-800/50',
        iconBgDark: 'dark:bg-emerald-900/50',
        iconColorDark: 'dark:text-emerald-400',
        titleColorDark: 'dark:text-emerald-300',
        textColorDark: 'dark:text-gray-400',
        btnDark: 'dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white',
        title: 'Nuevas Visitas en Riesgo',
        getMessage: (s: SegmentData) =>
            `Hay ${s.nuevo} clientas de primera vez recientes. Una campaña rápida de agradecimiento hoy garantiza que vuelvan el próximo mes.`,
    },
    trends: {
        id: 'trends',
        icon: TrendingUp,
        bgLight: 'bg-violet-50',
        borderLight: 'border-violet-200',
        iconBgLight: 'bg-violet-100',
        iconColorLight: 'text-violet-700',
        titleColorLight: 'text-violet-700',
        textColorLight: 'text-gray-600',
        btnLight: 'bg-violet-600 hover:bg-violet-700 text-white',
        bgDark: 'dark:bg-violet-950/40',
        borderDark: 'dark:border-violet-800/50',
        iconBgDark: 'dark:bg-violet-900/50',
        iconColorDark: 'dark:text-violet-400',
        titleColorDark: 'dark:text-violet-300',
        textColorDark: 'dark:text-gray-400',
        btnDark: 'dark:bg-violet-600 dark:hover:bg-violet-700 dark:text-white',
        title: 'Interés Detectado',
        getMessage: (s: SegmentData) => {
            const n = (s.interes_unas || 0) + (s.interes_pestanas || 0) + (s.interes_cabello || 0);
            return `Nilah identificó demanda latente de ${n} clientas en servicios específicos. Aprovecha esta micro-tendencia con una campaña focalizada.`;
        },
    },
} as const;

type AlertKey = keyof typeof ALERT_VARIANTS;

const NilahAlertBanner: React.FC<NilahAlertBannerProps> = ({ segments, onViewAudiences }) => {
    const currentWeek = getWeekNumber(new Date());

    const availableKeys: AlertKey[] = [];
    if (segments.recuperar > 0) availableKeys.push('recuperar');
    if (segments.vip > 0) availableKeys.push('vip');
    if (segments.nuevo > 0) availableKeys.push('nuevo');
    const interestsCount = (segments.interes_unas || 0) + (segments.interes_pestanas || 0) + (segments.interes_cabello || 0);
    if (interestsCount > 0) availableKeys.push('trends');

    if (availableKeys.length === 0) return null;

    const key = availableKeys[currentWeek % availableKeys.length];
    const v = ALERT_VARIANTS[key];
    const Icon = v.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className={`
                flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
                p-4 sm:p-5 rounded-2xl border shadow-sm
                ${v.bgLight} ${v.borderLight}
                ${v.bgDark} ${v.borderDark}
                transition-colors duration-200
            `}
        >
            {/* Left: icon + text */}
            <div className="flex items-start gap-4">
                <div className={`
                    flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center
                    ${v.iconBgLight} ${v.iconColorLight}
                    ${v.iconBgDark} ${v.iconColorDark}
                `}>
                    <Icon size={22} />
                </div>
                <div>
                    <h4 className={`
                        text-sm font-bold flex items-center gap-1.5 leading-tight
                        ${v.titleColorLight} ${v.titleColorDark}
                    `}>
                        <Sparkles size={13} className="opacity-70" />
                        {v.title}
                    </h4>
                    <p className={`
                        mt-1 text-sm leading-relaxed max-w-2xl
                        ${v.textColorLight} ${v.textColorDark}
                    `}>
                        {v.getMessage(segments)}
                    </p>
                </div>
            </div>

            {/* CTA Button */}
            <button
                onClick={onViewAudiences}
                className={`
                    flex-shrink-0 w-full sm:w-auto flex items-center justify-center gap-2
                    px-5 py-2.5 rounded-xl text-sm font-bold
                    shadow-sm hover:shadow-md active:scale-95
                    transition-all duration-150
                    ${v.btnLight} ${v.btnDark}
                `}
            >
                Ver Audiencias
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
            </button>
        </motion.div>
    );
};

export default NilahAlertBanner;
