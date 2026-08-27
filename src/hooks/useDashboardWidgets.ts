/**
 * useDashboardWidgets
 *
 * Gestiona la configuración personalizada de widgets del Dashboard:
 * - Orden (subir/bajar con ▲ ▼)
 * - Visibilidad (ON/OFF con switch)
 *
 * La configuración persiste en localStorage por email de usuario.
 */

import { useState, useCallback } from "react";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export type WidgetTabCategory = "hoy" | "finanzas" | "clientes";

export interface WidgetConfig {
    id: string;
    enabled: boolean;
}

export interface WidgetMeta {
    id: string;
    label: string;
    description: string;
    category: WidgetTabCategory;
    icon: string;
}

// ─── Catálogo de widgets con metadatos ─────────────────────────────────────

export const WIDGET_CATALOG: WidgetMeta[] = [
    // ⚡ HOY EN SALÓN
    { id: "operativa",          label: "Operativa del Día",          description: "Citas, sillones y agenda de hoy",                     category: "hoy",      icon: "📋" },
    { id: "kpis",               label: "KPIs del Mes & Metas",       description: "Ingresos, citas, clientes y ticket promedio",          category: "hoy",      icon: "📊" },
    { id: "citas_pendientes",   label: "Recordatorios y Retoques",   description: "Clientas que necesitan retoque pronto",               category: "hoy",      icon: "🔔" },
    // 💰 FINANZAS & METAS
    { id: "oracle",             label: "Pronóstico IA",             description: "Predicción de ventas e insights del mes",             category: "finanzas", icon: "🔮" },
    { id: "financiero_resumen", label: "Resumen Financiero",         description: "Ingresos, ticket promedio y flujo de caja",           category: "finanzas", icon: "💰" },
    { id: "horas_muertas",      label: "Mapa de Horas Muertas",      description: "Identifica cuándo están vacíos tus sillones",         category: "finanzas", icon: "🕐" },
    { id: "servicios_top",      label: "Servicios Más Vendidos",      description: "Top servicios y ocupación semanal del salón",         category: "finanzas", icon: "✨" },
    // 👥 CLIENTAS & EQUIPO
    { id: "clientes_riesgo",    label: "Clientas en Riesgo",         description: "Quién lleva semanas sin volver (CTA WhatsApp)",       category: "clientes", icon: "⚠️" },
    { id: "retention_intel",    label: "Inteligencia de Retención",  description: "Tasa de retención, churn y tendencia de fidelidad",   category: "clientes", icon: "❤️" },
    { id: "clientes_tendencia", label: "Tendencia de Clientes",      description: "Nuevas vs recurrentes, distribución por servicios",   category: "clientes", icon: "👥" },
    { id: "staff_ranking",      label: "Ranking de Staff",            description: "Quién factura más y quién retiene más clientas",      category: "clientes", icon: "🏆" },
    { id: "nilah_impact",       label: "Trabajo de Nilah IA",         description: "Clientas recuperadas y follow-ups activos por IA",    category: "clientes", icon: "🤖" },
];

// ─── Orden y estado por defecto ─────────────────────────────────────────────

const DEFAULT_WIDGETS: WidgetConfig[] = WIDGET_CATALOG.map(w => ({
    id: w.id,
    enabled: true,
}));

// ─── Persistencia localStorage ───────────────────────────────────────────────

const STORAGE_KEY = "nilah_dashboard_widgets_v3";

function getStoredWidgets(userEmail?: string): WidgetConfig[] {
    try {
        const key = userEmail ? `${STORAGE_KEY}_${userEmail}` : STORAGE_KEY;
        const raw = localStorage.getItem(key);
        if (!raw) return DEFAULT_WIDGETS;
        const parsed: WidgetConfig[] = JSON.parse(raw);
        const storedIds = new Set(parsed.map((w: WidgetConfig) => w.id));
        const newWidgets = DEFAULT_WIDGETS.filter(w => !storedIds.has(w.id));
        return [...parsed, ...newWidgets];
    } catch {
        return DEFAULT_WIDGETS;
    }
}

function saveWidgets(widgets: WidgetConfig[], userEmail?: string): void {
    try {
        const key = userEmail ? `${STORAGE_KEY}_${userEmail}` : STORAGE_KEY;
        localStorage.setItem(key, JSON.stringify(widgets));
    } catch {
        // localStorage no disponible
    }
}

// ─── Hook Principal ──────────────────────────────────────────────────────────

export function useDashboardWidgets(userEmail?: string) {
    const [widgets, setWidgets] = useState<WidgetConfig[]>(() => getStoredWidgets(userEmail));

    const toggleWidget = useCallback((id: string) => {
        setWidgets(prev => {
            const next = prev.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w);
            saveWidgets(next, userEmail);
            return next;
        });
    }, [userEmail]);

    const moveWidgetUp = useCallback((id: string, groupCategory?: WidgetTabCategory) => {
        setWidgets(prev => {
            if (groupCategory) {
                const groupIds = WIDGET_CATALOG.filter(m => m.category === groupCategory).map(m => m.id);
                const groupItems = prev.filter(w => groupIds.includes(w.id));
                const idxInGroup = groupItems.findIndex(w => w.id === id);
                if (idxInGroup <= 0) return prev;
                
                const prevItemInGroup = groupItems[idxInGroup - 1];
                const globalIdx = prev.findIndex(w => w.id === id);
                const prevGlobalIdx = prev.findIndex(w => w.id === prevItemInGroup.id);
                
                const next = [...prev];
                [next[globalIdx], next[prevGlobalIdx]] = [next[prevGlobalIdx], next[globalIdx]];
                saveWidgets(next, userEmail);
                return next;
            } else {
                const idx = prev.findIndex(w => w.id === id);
                if (idx <= 0) return prev;
                const next = [...prev];
                [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                saveWidgets(next, userEmail);
                return next;
            }
        });
    }, [userEmail]);

    const moveWidgetDown = useCallback((id: string, groupCategory?: WidgetTabCategory) => {
        setWidgets(prev => {
            if (groupCategory) {
                const groupIds = WIDGET_CATALOG.filter(m => m.category === groupCategory).map(m => m.id);
                const groupItems = prev.filter(w => groupIds.includes(w.id));
                const idxInGroup = groupItems.findIndex(w => w.id === id);
                if (idxInGroup < 0 || idxInGroup >= groupItems.length - 1) return prev;
                
                const nextItemInGroup = groupItems[idxInGroup + 1];
                const globalIdx = prev.findIndex(w => w.id === id);
                const nextGlobalIdx = prev.findIndex(w => w.id === nextItemInGroup.id);
                
                const next = [...prev];
                [next[globalIdx], next[nextGlobalIdx]] = [next[nextGlobalIdx], next[globalIdx]];
                saveWidgets(next, userEmail);
                return next;
            } else {
                const idx = prev.findIndex(w => w.id === id);
                if (idx < 0 || idx >= prev.length - 1) return prev;
                const next = [...prev];
                [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                saveWidgets(next, userEmail);
                return next;
            }
        });
    }, [userEmail]);

    const resetWidgets = useCallback(() => {
        const def = DEFAULT_WIDGETS;
        setWidgets(def);
        saveWidgets(def, userEmail);
    }, [userEmail]);

    const isEnabled = (id: string) => widgets.find(w => w.id === id)?.enabled ?? true;

    return {
        widgets,
        enabledWidgets: widgets.filter(w => w.enabled),
        isEnabled,
        toggleWidget,
        moveWidgetUp,
        moveWidgetDown,
        resetWidgets,
    };
}
