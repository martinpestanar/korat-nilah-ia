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

export interface WidgetConfig {
    id: string;
    enabled: boolean;
}

export interface WidgetMeta {
    id: string;
    label: string;
    description: string;
    category: "operativo" | "clientes" | "crecimiento" | "equipo";
    icon: string;
}

// ─── Catálogo de widgets con metadatos ─────────────────────────────────────

export const WIDGET_CATALOG: WidgetMeta[] = [
    // OPERATIVO
    { id: "oracle",             label: "Pronóstico IA",             description: "Predicción de ventas e insights del día",             category: "operativo",   icon: "🔮" },
    { id: "operativa",          label: "Operativa del Día",          description: "Citas, sillones y agenda de hoy",                     category: "operativo",   icon: "📋" },
    { id: "kpis",               label: "KPIs del Mes",               description: "Ingresos, citas, clientes y ticket promedio",          category: "operativo",   icon: "📊" },
    { id: "horas_muertas",      label: "Mapa de Horas Muertas",      description: "Identifica cuándo están vacíos tus sillones",         category: "operativo",   icon: "🕐" },
    { id: "citas_pendientes",   label: "Recordatorios y Retoques",   description: "Clientas que necesitan retoque pronto",               category: "operativo",   icon: "🔔" },
    // CLIENTES
    { id: "clientes_riesgo",    label: "Clientas en Riesgo",         description: "Quién lleva semanas sin volver (CTA WhatsApp)",       category: "clientes",    icon: "⚠️" },
    { id: "retention_intel",    label: "Inteligencia de Retención",  description: "Tasa de retención, churn y tendencia de fidelidad",   category: "clientes",    icon: "❤️" },
    { id: "clientes_tendencia", label: "Tendencia de Clientes",      description: "Nuevas vs recurrentes, distribución por servicios",   category: "clientes",    icon: "👥" },
    // CRECIMIENTO
    { id: "financiero_resumen", label: "Resumen Financiero",         description: "Ingresos, ticket promedio y proyección del mes",      category: "crecimiento", icon: "💰" },
    { id: "servicios_top",      label: "Servicios Más Vendidos",      description: "Top servicios y ocupación semanal del salón",         category: "crecimiento", icon: "✨" },
    // EQUIPO
    { id: "staff_ranking",      label: "Ranking de Staff",            description: "Quién factura más y quién retiene más clientas",      category: "equipo",      icon: "🏆" },
    { id: "nilah_impact",       label: "Trabajo de Nilah",            description: "Clientas recuperadas y follow-ups activos por IA",    category: "equipo",      icon: "🤖" },
];

// ─── Orden y estado por defecto ─────────────────────────────────────────────

const DEFAULT_WIDGETS: WidgetConfig[] = WIDGET_CATALOG.map(w => ({
    id: w.id,
    enabled: true,
}));

// ─── Persistencia localStorage ───────────────────────────────────────────────

const STORAGE_KEY = "nilah_dashboard_widgets_v2";

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

    const moveWidgetUp = useCallback((id: string) => {
        setWidgets(prev => {
            const idx = prev.findIndex(w => w.id === id);
            if (idx <= 0) return prev;
            const next = [...prev];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            saveWidgets(next, userEmail);
            return next;
        });
    }, [userEmail]);

    const moveWidgetDown = useCallback((id: string) => {
        setWidgets(prev => {
            const idx = prev.findIndex(w => w.id === id);
            if (idx < 0 || idx >= prev.length - 1) return prev;
            const next = [...prev];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            saveWidgets(next, userEmail);
            return next;
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
