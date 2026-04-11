/**
 * LoyaltyIntelligence.tsx — BI Intelligence Tab
 * 
 * Widgets:
 * 1. Tasa de Canje (Donut Chart) — puntos canjeados vs activos
 * 2. Popularidad de Premios (Bar Chart) — canjes por categoría
 * 3. Impacto en LTV — comparación clientes que canjean vs no
 * 4. Velocidad de Acumulación — puntos/mes promedio
 */

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, Target, Award, Zap, ArrowUpRight, ArrowDownRight, DollarSign, Clock, Users, Gift, AlertTriangle, CheckCircle } from 'lucide-react';
import { CategoryData } from './StaffSelector';
import { useCurrency } from '../../hooks/useCurrency';

interface Props {
    clients: any[];
    premios: any[];
    canjes: any[];
    rewards: any[];
    redemptions: any[];
    isStaffMode: boolean;
    selectedCategory: string | null;
    puntosCategoriaData: any[];
    serviceCategories: CategoryData[];
}

const CHART_COLORS = ['#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e', '#6366f1'];

const LoyaltyIntelligence: React.FC<Props> = ({
    clients, premios, canjes, rewards, redemptions,
    isStaffMode, selectedCategory, puntosCategoriaData, serviceCategories
}) => {
    const { formatMoney } = useCurrency();

    // ── 1. Tasa de Canje (Donut) ─────────────────────────────────
    const canjeData = useMemo(() => {
        // Derive from actual canjes data since DB fields may not be populated
        const totalCanjeados = canjes.reduce((s: number, c: any) =>
            s + (Number(c.puntos_usados) || 0), 0);
        const activos = clients.reduce((s: number, c: any) =>
            s + (Number(c.puntos_acumulados) || 0), 0);
        const totalEmitidos = totalCanjeados + activos;
        const tasa = totalEmitidos > 0 ? Math.round((totalCanjeados / totalEmitidos) * 100) : 0;
        return {
            totalEmitidos,
            totalCanjeados,
            activos: Math.max(activos, 0),
            tasa,
            donutData: [
                { name: 'Canjeados', value: totalCanjeados, color: '#8b5cf6' },
                { name: 'Activos', value: Math.max(activos, 0), color: '#374151' },
            ]
        };
    }, [clients, canjes]);

    // ── 2. Popularidad de Premios por Categoría ──────────────────
    const popularidadData = useMemo(() => {
        const catMap = new Map<string, { canjes: number; puntos: number; premios: number }>();
        rewards.forEach(r => {
            const cat = r.category || 'Sin categoría';
            if (!catMap.has(cat)) catMap.set(cat, { canjes: 0, puntos: 0, premios: 0 });
            const entry = catMap.get(cat)!;
            entry.canjes += r.timesRedeemed || 0;
            entry.premios += 1;
        });
        return Array.from(catMap.entries())
            .map(([cat, data], i) => ({
                name: cat,
                canjes: data.canjes,
                premios: data.premios,
                fill: CHART_COLORS[i % CHART_COLORS.length]
            }))
            .sort((a, b) => b.canjes - a.canjes);
    }, [rewards]);

    // ── 3. Impacto en LTV ────────────────────────────────────────
    const ltvImpact = useMemo(() => {
        const parseLTV = (ltv: string | number | null): number => {
            if (!ltv || ltv === '') return 0;
            const str = String(ltv).replace(/[^0-9.]/g, '');
            return parseFloat(str) || 0;
        };

        // Determine which clients have redeemed from actual canjes data
        const clienteIdsConCanjes = new Set(
            canjes.map((c: any) => Number(c.cliente_id)).filter(Boolean)
        );

        const conCanjes = clients.filter((c: any) => clienteIdsConCanjes.has(Number(c.id)));
        const sinCanjes = clients.filter((c: any) => !clienteIdsConCanjes.has(Number(c.id)) && (Number(c.puntos_acumulados) || 0) > 0);

        const avgLtvCon = conCanjes.length > 0
            ? conCanjes.reduce((s: number, c: any) => s + parseLTV(c.LTV), 0) / conCanjes.length : 0;
        const avgLtvSin = sinCanjes.length > 0
            ? sinCanjes.reduce((s: number, c: any) => s + parseLTV(c.LTV), 0) / sinCanjes.length : 0;
        const avgVisitasCon = conCanjes.length > 0
            ? conCanjes.reduce((s: number, c: any) => s + (Number(c.total_visitas) || 0), 0) / conCanjes.length : 0;
        const avgVisitasSin = sinCanjes.length > 0
            ? sinCanjes.reduce((s: number, c: any) => s + (Number(c.total_visitas) || 0), 0) / sinCanjes.length : 0;

        const ltvDiff = avgLtvSin > 0 ? Math.round(((avgLtvCon - avgLtvSin) / avgLtvSin) * 100) : 0;

        return {
            conCanjes: { count: conCanjes.length, avgLtv: Math.round(avgLtvCon), avgVisitas: Math.round(avgVisitasCon * 10) / 10 },
            sinCanjes: { count: sinCanjes.length, avgLtv: Math.round(avgLtvSin), avgVisitas: Math.round(avgVisitasSin * 10) / 10 },
            ltvDiff
        };
    }, [clients, canjes]);

    // ── 4. Velocidad de Acumulación ──────────────────────────────
    const velocidad = useMemo(() => {
        const clientesActivos = clients.filter((c: any) =>
            (Number(c.puntos_acumulados) || 0) > 0 && c.primera_visita
        );
        if (clientesActivos.length === 0) return { promedioMensual: 0, diasParaProximoPremio: 0 };

        const now = new Date();
        let totalPuntosXMes = 0;
        let validCount = 0;

        clientesActivos.forEach((c: any) => {
            const firstVisit = new Date(c.primera_visita);
            const meses = Math.max(1, (now.getTime() - firstVisit.getTime()) / (1000 * 60 * 60 * 24 * 30));
            const puntosXMes = (Number(c.puntos_totales_historicos) || Number(c.puntos_acumulados) || 0) / meses;
            if (puntosXMes > 0) {
                totalPuntosXMes += puntosXMes;
                validCount++;
            }
        });

        const promedioMensual = validCount > 0 ? Math.round(totalPuntosXMes / validCount) : 0;
        const primerPremio = rewards.filter(r => r.isActive).sort((a, b) => a.pointsCost - b.pointsCost)[0];
        const diasParaPremio = promedioMensual > 0 && primerPremio
            ? Math.round((primerPremio.pointsCost / promedioMensual) * 30) : 0;

        return { promedioMensual, diasParaProximoPremio: diasParaPremio, primerPremioNombre: primerPremio?.name || '' };
    }, [clients, rewards]);

    // ── 5. Estado de Canjes Pendientes ────────────────────────────
    const canjesPendientes = useMemo(() => {
        const pendientes = redemptions.filter(r => r.status === 'pendiente');
        const entregados = redemptions.filter(r => r.status === 'entregado');
        return { pendientes: pendientes.length, entregados: entregados.length, total: redemptions.length };
    }, [redemptions]);

    // ── 6. Staff Category Breakdown (only staff mode) ────────────
    const categoryBreakdown = useMemo(() => {
        if (!isStaffMode) return [];
        return serviceCategories.map((cat, i) => ({
            name: cat.categoryName,
            emoji: cat.emoji,
            puntos: cat.totalPuntos,
            clientes: cat.clientesActivos,
            fill: CHART_COLORS[i % CHART_COLORS.length]
        }));
    }, [isStaffMode, serviceCategories]);

    return (
        <div className="space-y-6 animate-page-enter">
            {/* Row 1: Tasa de Canje + Velocidad de Acumulación */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* ── Tasa de Canje (Donut) ────────────────────── */}
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-6 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Target className="h-5 w-5 text-violet-500" />
                                Premios Usados
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Puntos que tus clientas ya canjearon por premios</p>
                        </div>
                        <div className={`rounded-xl px-3 py-1 text-sm font-bold ${canjeData.tasa < 30 ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
                            : canjeData.tasa < 60 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                            }`}>
                            {canjeData.tasa}%
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative w-36 h-36" style={{ minHeight: '144px' }}>
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={canjeData.donutData}
                                        cx="50%" cy="50%"
                                        innerRadius={40} outerRadius={60}
                                        dataKey="value"
                                        strokeWidth={0}
                                    >
                                        {canjeData.donutData.map((entry, i) => (
                                            <Cell key={i} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-gray-900 dark:text-white">{canjeData.tasa}%</span>
                            </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-violet-500" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Canjeados</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{canjeData.totalCanjeados.toLocaleString()} pts</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-3 w-3 rounded-full bg-gray-400 dark:bg-gray-600" />
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Activos</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{canjeData.activos.toLocaleString()} pts</span>
                            </div>
                            <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Total emitidos</span>
                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{canjeData.totalEmitidos.toLocaleString()} pts</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {canjeData.tasa < 30 && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3 border border-amber-200/50 dark:border-amber-500/20">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                <strong>Tasa baja.</strong> Tus clientes acumulan puntos pero no los canjean.
                                Considera reducir el costo de los premios o enviar recordatorios de puntos disponibles.
                            </p>
                        </div>
                    )}
                </div>

                {/* ── Velocidad de Acumulación + Estado Canjes ──── */}
                <div className="space-y-6">
                    {/* Velocidad */}
                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-6 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <Zap className="h-5 w-5 text-amber-500" />
                            ¿Cuánto acumulan?
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20 p-4 border border-violet-200/30 dark:border-violet-500/20">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Puntos por clienta/mes</p>
                                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{velocidad.promedioMensual}</p>
                                <p className="text-xs text-gray-400">en promedio</p>
                            </div>
                            <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 p-4 border border-amber-200/30 dark:border-amber-500/20">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Días para 1er premio</p>
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{velocidad.diasParaProximoPremio}</p>
                                <p className="text-xs text-gray-400 truncate">{velocidad.primerPremioNombre}</p>
                            </div>
                        </div>
                    </div>

                    {/* Estado de Canjes */}
                    <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-6 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                            <Gift className="h-5 w-5 text-emerald-500" />
                            Estado de Canjes
                        </h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="text-center rounded-xl bg-amber-50 dark:bg-amber-500/10 p-3 border border-amber-200/50 dark:border-amber-500/20">
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{canjesPendientes.pendientes}</p>
                                <p className="text-xs text-amber-600/70 dark:text-amber-400/70">🟡 Pendientes</p>
                            </div>
                            <div className="text-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-3 border border-emerald-200/50 dark:border-emerald-500/20">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{canjesPendientes.entregados}</p>
                                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">🟢 Entregados</p>
                            </div>
                            <div className="text-center rounded-xl bg-gray-50 dark:bg-gray-500/10 p-3 border border-gray-200/50 dark:border-gray-500/20">
                                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{canjesPendientes.total}</p>
                                <p className="text-xs text-gray-500">Total</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Popularidad de Premios + LTV Impact */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* ── Popularidad de Premios (Bar Chart) ────────── */}
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-6 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                        <Award className="h-5 w-5 text-purple-500" />
                        ¿Qué premios les gustan más?
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Los premios que más han pedido tus clientas</p>

                    {popularidadData.length > 0 ? (
                        <div className="h-48" style={{ minHeight: '192px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={popularidadData} layout="vertical" margin={{ left: 10, right: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} width={70} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(15,15,35,0.95)',
                                            border: '1px solid rgba(139,92,246,0.3)',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <Bar dataKey="canjes" radius={[0, 6, 6, 0]} barSize={20}>
                                        {popularidadData.map((entry, i) => (
                                            <Cell key={i} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-400">
                            <p className="text-sm">No hay datos de canjes aún</p>
                        </div>
                    )}

                    {/* Legend */}
                    <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-white/10">
                        {popularidadData.map((cat, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.fill }} />
                                <span className="text-xs text-gray-500">{cat.name}: {cat.canjes} canjes ({cat.premios} premios)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Impacto en Gasto ───────────────────────────── */}
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-6 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                        <DollarSign className="h-5 w-5 text-emerald-500" />
                        ¿Los premios fidelizan más?
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Clientas que canjearon premios gastan más que las que no</p>

                    <div className="grid grid-cols-2 gap-4 mb-5">
                        {/* Con Canjes */}
                        <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/10 dark:from-emerald-500/20 dark:to-green-500/20 p-4 border border-emerald-200/30 dark:border-emerald-500/20">
                            <div className="flex items-center gap-1.5 mb-3">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Canjearon premios</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Gasto promedio</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatMoney(ltvImpact.conCanjes.avgLtv)}</p>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{ltvImpact.conCanjes.count} clientas</span>
                                    <span className="text-gray-500">{ltvImpact.conCanjes.avgVisitas} visitas</span>
                                </div>
                            </div>
                        </div>

                        {/* Sin Canjes */}
                        <div className="rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-500/10 dark:to-gray-500/5 p-4 border border-gray-200/50 dark:border-gray-500/20">
                            <div className="flex items-center gap-1.5 mb-3">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sin canjear</span>
                            </div>
                            <div className="space-y-2">
                                <div>
                                    <p className="text-xs text-gray-500">Gasto promedio</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white">{formatMoney(ltvImpact.sinCanjes.avgLtv)}</p>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{ltvImpact.sinCanjes.count} clientas</span>
                                    <span className="text-gray-500">{ltvImpact.sinCanjes.avgVisitas} visitas</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Insight */}
                    {ltvImpact.ltvDiff !== 0 && (
                        <div className={`flex items-start gap-2 rounded-xl p-3 border ${ltvImpact.ltvDiff > 0
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20'
                            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20'
                            }`}>
                            {ltvImpact.ltvDiff > 0
                                ? <ArrowUpRight className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                : <ArrowDownRight className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            }
                            <p className={`text-xs ${ltvImpact.ltvDiff > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'}`}>
                                Los clientes que canjean premios {ltvImpact.ltvDiff > 0 ? 'gastan' : 'gastan'}
                                <strong> {Math.abs(ltvImpact.ltvDiff)}% {ltvImpact.ltvDiff > 0 ? 'más' : 'menos'}</strong> que
                                los que nunca han canjeado.
                                {ltvImpact.ltvDiff > 0
                                    ? ' Tu programa de fidelización está generando valor. 🎉'
                                    : ' Aún no hay suficientes datos para medir el impacto completo.'
                                }
                            </p>
                        </div>
                    )}

                    {ltvImpact.conCanjes.count === 0 && (
                        <div className="flex items-start gap-2 rounded-xl bg-gray-50 dark:bg-gray-500/10 p-3 border border-gray-200/50 dark:border-gray-500/20">
                            <Clock className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Aún no hay clientes con canjes registrados en la tabla principal.
                                A medida que los clientes canjeen premios, podrás ver el impacto real en sus ingresos.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Row 3: Staff Category Breakdown (only staff mode) */}
            {isStaffMode && categoryBreakdown.length > 0 && (
                <div className="rounded-2xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/10 p-6 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                        <Users className="h-5 w-5 text-blue-500" />
                        Distribución por Categoría de Servicio
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Puntos y clientes activos por cada categoría de tu salón</p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {categoryBreakdown.map((cat, i) => (
                            <div key={i} className="rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-white/5 dark:to-white/[0.02] p-4 border border-gray-200/50 dark:border-white/10 hover:border-violet-200 dark:hover:border-violet-500/20 transition-all">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">{cat.emoji}</span>
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{cat.name}</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">Puntos</span>
                                        <span className="text-sm font-bold" style={{ color: cat.fill }}>{cat.puntos.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-xs text-gray-500">Clientes</span>
                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cat.clientes}</span>
                                    </div>
                                </div>
                                {/* Progress bar visual */}
                                <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min(100, (cat.puntos / Math.max(...categoryBreakdown.map(c => c.puntos), 1)) * 100)}%`,
                                            backgroundColor: cat.fill
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoyaltyIntelligence;
