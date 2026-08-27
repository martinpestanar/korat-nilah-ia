/**
 * useSmartSignals
 * 
 * Consulta las señales inteligentes activas del negocio desde Supabase.
 * Gestiona dismiss con cooldown de 48h persistido en la propia tabla.
 * Se actualiza en tiempo real via Supabase Realtime.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

// ─── Tipos ─────────────────────────────────────────────────────────────────

export interface ClientePreview {
    nombre?: string;
    servicio?: string;
    dias?: number;
    hora?: string;
    fiabilidad?: number;
    ltv?: string;
    categoria?: string;
    cumpleanos?: string;
    puntos?: number;
    visitas?: number;
    nivel?: string;
    ultima_visita?: string;
    monto?: number;
    fecha?: string;
}

export type UrgenciaLevel = "alta" | "media" | "baja";
export type AccionTipo = "whatsapp" | "navigate" | "upgrade";

export interface SmartSignal {
    id: string;
    business_id: string;
    tipo: string;
    emoji: string;
    titulo: string;
    descripcion_corta: string;
    descripcion_larga: string;
    urgencia: UrgenciaLevel;
    dinero_estimado: number;
    moneda: string;
    conteo: number;
    clientes_preview: ClientePreview[];
    whatsapp_preview: string | null;
    modulo_destino: string;
    accion_label: string;
    accion_tipo: AccionTipo;
    dismissed_until: string | null;
    generated_at: string;
    expires_at: string;
}

// ─── Prioridad para ordenar ──────────────────────────────────────────────────

const URGENCIA_ORDER: Record<UrgenciaLevel, number> = { alta: 0, media: 1, baja: 2 };

function sortSignals(signals: SmartSignal[]): SmartSignal[] {
    return [...signals].sort((a, b) => {
        const urgDiff = URGENCIA_ORDER[a.urgencia] - URGENCIA_ORDER[b.urgencia];
        if (urgDiff !== 0) return urgDiff;
        return b.dinero_estimado - a.dinero_estimado;
    });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSmartSignals() {
    const { user, businessId } = useAuth();
    const [signals, setSignals] = useState<SmartSignal[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const channelRef = useRef<any>(null);

    const fetchSignals = useCallback(async () => {
        const bid = businessId || user?.businessId;
        if (!bid) { setIsLoading(false); return; }

        const { data, error } = await supabase
            .from("smart_signals")
            .select("*")
            .eq("business_id", bid)
            .gt("expires_at", new Date().toISOString())
            .or("dismissed_until.is.null,dismissed_until.lt." + new Date().toISOString())
            .order("urgencia", { ascending: true });

        if (!error && data) {
            setSignals(sortSignals(data as SmartSignal[]));
        }
        setIsLoading(false);
    }, [businessId, user?.businessId]);

    useEffect(() => {
        fetchSignals();
    }, [fetchSignals]);

    // Supabase Realtime para updates en tiempo real
    useEffect(() => {
        const bid = businessId || user?.businessId;
        if (!bid) return;

        channelRef.current = supabase
            .channel(`smart_signals_${bid}`)
            .on("postgres_changes", {
                event: "*",
                schema: "public",
                table: "smart_signals",
                filter: `business_id=eq.${bid}`,
            }, () => {
                fetchSignals();
            })
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    }, [businessId, user?.businessId, fetchSignals]);

    // Dismiss con cooldown 48h
    const dismissSignal = useCallback(async (signalId: string, hours: number = 48) => {
        const dismissUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        const { error } = await supabase
            .from("smart_signals")
            .update({ dismissed_until: dismissUntil })
            .eq("id", signalId);

        if (!error) {
            setSignals(prev => {
                const next = prev.filter(s => s.id !== signalId);
                setActiveIndex(idx => Math.min(idx, Math.max(0, next.length - 1)));
                return next;
            });
        }
    }, []);

    // Disparar regeneración manual (via RPC)
    const regenerateSignals = useCallback(async () => {
        const bid = businessId || user?.businessId;
        if (!bid) return;
        setIsLoading(true);
        await supabase.rpc("fn_generate_smart_signals_extended", { p_business_id: bid });
        await fetchSignals();
    }, [businessId, user?.businessId, fetchSignals]);

    const activeSignal = signals[activeIndex] ?? null;
    const totalSignals = signals.length;

    return {
        signals,
        activeSignal,
        activeIndex,
        setActiveIndex,
        totalSignals,
        isLoading,
        dismissSignal,
        regenerateSignals,
        refresh: fetchSignals,
    };
}
