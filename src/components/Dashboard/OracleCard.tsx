/**
 * OracleCard — Widget "Meta de Crecimiento"
 *
 * Muestra a la dueña del salón:
 *   1. Cuánto lleva ganado este mes vs. su meta
 *   2. Cuántas citas le faltan para llegar a la meta
 *   3. Si va a tiempo, rápido o lenta para lograrlo
 *   4. Un enlace directo a Marketing IA si necesita más citas
 *
 * La meta se guarda en Supabase (tabla negocios.meta_mensual_ingresos)
 * y se puede editar en cualquier momento.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Target,
    Pencil,
    Check,
    X,
    TrendingUp,
    TrendingDown,
    Minus,
    Flame,
    Rocket,
    AlertTriangle,
    ChevronRight,
    Info,
} from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';
import { useCurrency } from '../../hooks/useCurrency';

// ===========================================
// Pequeño Tooltip de ayuda (sin librerías externas)
// ===========================================
const HelpTip: React.FC<{ text: string }> = ({ text }) => {
    const [visible, setVisible] = useState(false);
    return (
        <span className="relative inline-flex items-center">
            <span
                role="button"
                tabIndex={0}
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onFocus={() => setVisible(true)}
                onBlur={() => setVisible(false)}
                className="ml-1 text-gray-400 hover:text-primary transition-colors focus:outline-none cursor-help"
                aria-label="Ayuda"
            >
                <Info size={13} />
            </span>
            {visible && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-52 rounded-xl bg-gray-900 px-3 py-2 text-[11px] text-white shadow-xl leading-snug pointer-events-none">
                    {text}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </span>
            )}
        </span>
    );
};

// ===========================================
// Componente principal
// ===========================================
const OracleCard: React.FC = () => {
    const navigate = useNavigate();
    const { financials, operational, metaMensual, setMetaMensual, isLoading } = useDashboardData();
    const { formatValue } = useCurrency();

    // Estado del modo edición de meta
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // -------------------------------------------------------
    // Datos clave
    // -------------------------------------------------------
    const ingresosActuales = financials?.ingresosMes ?? 0;
    const ticketPromedio   = financials?.ticketPromedio ?? 0;

    // Días del mes
    const now         = new Date();
    const diasDelMes  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const diaActual   = now.getDate();
    const diasRestantes = diasDelMes - diaActual;

    // Meta: la que definió el usuario (Supabase) o la calculada (130% de lo actual)
    const goalRevenue = useMemo(() => {
        if (metaMensual != null && metaMensual > 0) return metaMensual;
        // Sugerencia automática: +30% del mes actual o 5000 si no hay datos
        return ingresosActuales > 0 ? Math.round(ingresosActuales * 1.3) : 5000;
    }, [metaMensual, ingresosActuales]);

    const esMetaPersonalizada = metaMensual != null && metaMensual > 0;

    // Progreso (0–100) — máximo 100 aunque se supere la meta
    const progreso = goalRevenue > 0
        ? Math.min(100, Math.round((ingresosActuales / goalRevenue) * 100))
        : 0;

    // Brecha para llegar a la meta
    const brecha         = Math.max(0, goalRevenue - ingresosActuales);
    // Citas que faltan para cerrar la brecha
    const citasFaltantes = ticketPromedio > 0 ? Math.ceil(brecha / ticketPromedio) : 0;

    // Ritmo actual: ingresos ganados por día hasta hoy
    const ritmoActual    = diaActual > 0 ? ingresosActuales / diaActual : 0;
    // Ritmo necesario: lo que falta ÷ días restantes
    const ritmoNecesario = diasRestantes > 0 ? brecha / diasRestantes : 0;

    // Proyección si sigo al ritmo actual durante los días restantes
    const proyeccionFinal = ingresosActuales + ritmoActual * diasRestantes;

    // Estado de velocidad
    const superaMeta     = ingresosActuales >= goalRevenue;
    const vaDelante      = proyeccionFinal >= goalRevenue;
    const diferenciaPct  = ritmoNecesario > 0
        ? Math.round(((ritmoActual - ritmoNecesario) / ritmoNecesario) * 100)
        : 0;

    const velocidad: 'cohete' | 'bien' | 'justo' | 'alerta' = superaMeta
        ? 'cohete'
        : diferenciaPct >= 10
        ? 'bien'
        : diferenciaPct >= -10
        ? 'justo'
        : 'alerta';

    // -------------------------------------------------------
    // Edición de meta
    // -------------------------------------------------------
    const openEdit = () => {
        setInputValue(metaMensual ? String(metaMensual) : String(goalRevenue));
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const cancelEdit = () => setIsEditing(false);

    const saveEdit = async () => {
        const parsed = parseFloat(inputValue.replace(/[^0-9.]/g, ''));
        if (isNaN(parsed) || parsed <= 0) { setIsEditing(false); return; }
        setIsSaving(true);
        await setMetaMensual(parsed);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter')  saveEdit();
        if (e.key === 'Escape') cancelEdit();
    };

    // -------------------------------------------------------
    // Colores dinámicos según velocidad
    // -------------------------------------------------------
    const palette = {
        cohete: { bar: 'from-amber-400 to-yellow-300',   text: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-200 dark:border-amber-800' },
        bien:   { bar: 'from-emerald-500 to-teal-400',   text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800' },
        justo:  { bar: 'from-blue-500 to-indigo-400',    text: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-200 dark:border-blue-800' },
        alerta: { bar: 'from-rose-500 to-orange-400',    text: 'text-rose-600',   bg: 'bg-rose-50 dark:bg-rose-900/20',    border: 'border-rose-200 dark:border-rose-800' },
    }[velocidad];

    const VelocidadIcon = velocidad === 'cohete' ? Flame
        : velocidad === 'bien'   ? TrendingUp
        : velocidad === 'justo'  ? Minus
        : TrendingDown;

    const velocidadLabel = {
        cohete: '🔥 ¡Ya superaste tu meta!',
        bien:   '✅ Vas muy bien',
        justo:  '⚡ Vas justo — no bajes el ritmo',
        alerta: '⚠️ Necesitas más citas esta semana',
    }[velocidad];

    // -------------------------------------------------------
    // Skeleton cargando
    // -------------------------------------------------------
    if (isLoading && !financials) {
        return (
            <div className="rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm animate-pulse space-y-4">
                <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-gray-700" />
            </div>
        );
    }

    // -------------------------------------------------------
    // Render
    // -------------------------------------------------------
    return (
        <div className="flex flex-col h-full rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm gap-4">

            {/* ── Cabecera ── */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                            Meta de Crecimiento
                        </h3>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">
                            {esMetaPersonalizada ? 'Meta personalizada' : 'Sugerida por Nilah (+30%)'}
                            <HelpTip text="Nilah sugiere crecer un 30% sobre lo que ganaste el mes anterior. Puedes cambiar esta meta cuando quieras con el lápiz ✏️." />
                        </p>
                    </div>
                </div>

                {/* Botón editar meta */}
                {!isEditing && (
                    <button
                        onClick={openEdit}
                        title="Cambiar mi meta"
                        className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:bg-primary/10 px-2 py-1 rounded-lg transition-colors"
                    >
                        <Pencil size={11} /> Cambiar meta
                    </button>
                )}
            </div>

            {/* ── Edición de meta ── */}
            {isEditing && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 shrink-0">Mi meta:</span>
                    <input
                        ref={inputRef}
                        type="number"
                        min={1}
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 rounded-lg border border-primary/40 bg-white dark:bg-dark-bg px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
                        placeholder="Ej: 8000"
                    />
                    <button
                        onClick={saveEdit}
                        disabled={isSaving}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white hover:opacity-90 transition disabled:opacity-60"
                        title="Guardar"
                    >
                        {isSaving ? <span className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Check size={14} />}
                    </button>
                    <button
                        onClick={cancelEdit}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-dark-border text-gray-500 hover:bg-gray-200 transition"
                        title="Cancelar"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* ── Progreso principal ── */}
            <div>
                {/* Números grandes */}
                <div className="flex items-baseline justify-between mb-1">
                    <span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">
                        {formatValue(ingresosActuales)}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                        / {formatValue(goalRevenue)}
                    </span>
                </div>

                {/* Barra de progreso */}
                <div
                    className="relative h-3 rounded-full bg-gray-100 dark:bg-dark-border overflow-hidden"
                    title={`${progreso}% de la meta`}
                >
                    <div
                        className={`h-full rounded-full bg-gradient-to-r ${palette.bar} transition-all duration-700`}
                        style={{ width: `${progreso}%` }}
                    />
                    {/* Línea de meta */}
                    <span className="absolute right-0 top-0 h-full w-0.5 bg-gray-400 dark:bg-gray-600 opacity-40" />
                </div>

                <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{progreso}% completado</span>
                    <span className="text-[10px] text-gray-400">{diasRestantes} días restantes</span>
                </div>
            </div>

            {/* ── Chip de velocidad ── */}
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${palette.bg} ${palette.border}`}>
                <VelocidadIcon size={14} className={palette.text} />
                <span className={`text-[11px] font-bold ${palette.text}`}>{velocidadLabel}</span>
            </div>

            {/* ── "Cuántas citas te faltan" ── */}
            {!superaMeta && (
                <div className="rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border p-3 space-y-1">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Para llegar a tu meta
                        <HelpTip text="Dividimos lo que te falta entre el precio promedio de tus servicios. Así sabes exactamente cuántas citas necesitas cubrir." />
                    </p>
                    {citasFaltantes > 0 ? (
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                            {citasFaltantes > 1
                                ? `Necesitas ${citasFaltantes} citas más`
                                : `Con 1 cita más lo logras 🎉`}
                        </p>
                    ) : (
                        <p className="text-sm font-black text-gray-900 dark:text-white">
                            ¡Estás muy cerca! Sigue así 💪
                        </p>
                    )}
                    {ticketPromedio > 0 && (
                        <p className="text-[10px] text-gray-400">
                            Basado en tu precio promedio de {formatValue(ticketPromedio)} por servicio
                        </p>
                    )}
                </div>
            )}

            {/* ── Si ya superó la meta ── */}
            {superaMeta && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-center space-y-0.5">
                    <p className="text-sm font-black text-amber-700 dark:text-amber-300">
                        🏆 ¡Superaste tu meta este mes!
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                        Llevas {formatValue(ingresosActuales - goalRevenue)} de extra. ¿Subimos la meta?
                    </p>
                    <button
                        onClick={openEdit}
                        className="mt-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:opacity-80 transition"
                    >
                        Subir mi meta ✏️
                    </button>
                </div>
            )}

            {/* ── CTA a Marketing (solo si va retrasada y no superó meta) ── */}
            {velocidad === 'alerta' && !superaMeta && (
                <button
                    onClick={() => navigate('/nilah/app/marketing?tab=audiencias')}
                    className="flex items-center justify-between w-full rounded-xl bg-gradient-to-r from-primary/90 to-violet-600 text-white px-4 py-3 font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
                >
                    <span className="flex items-center gap-2">
                        <Rocket size={15} />
                        Conseguir más citas ahora
                    </span>
                    <ChevronRight size={15} className="opacity-80" />
                </button>
            )}

            {/* ── CTA suave cuando va bien pero no ha superado ── */}
            {(velocidad === 'bien' || velocidad === 'justo') && !superaMeta && (
                <div className="flex items-center self-start">
                    <button
                        onClick={() => navigate('/nilah/app/marketing?tab=audiencias')}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline transition"
                    >
                        <Rocket size={11} /> Lanzar campaña exprés
                    </button>
                    <HelpTip text="Lleva al módulo de Marketing donde puedes enviar un WhatsApp a tus clientas inactivas para llenar huecos rápidamente." />
                </div>
            )}
        </div>
    );
};

export default OracleCard;