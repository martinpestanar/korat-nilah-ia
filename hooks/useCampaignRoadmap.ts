/**
 * useCampaignRoadmap — Hook centralizado para cargar campañas del mes desde Supabase.
 *
 * Arquitectura anti-fragilidad:
 *  1. Lee businessId de MÚLTIPLES fuentes: prop → localStorage → Supabase session.
 *     Nunca depende de una sola fuente que pueda fallar.
 *  2. Re-intenta automáticamente si businessId llega null en el primer render.
 *  3. Filtra el año en JS (no en PostgREST) para evitar el bug del .or() encadenado.
 *  4. Race-condition safe con fetchCountRef.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';

export interface WeeklyIdea {
    semana: number;
    titulo: string;
    objetivo: string;
    segmento: string;
    mensaje?: string;
    mensaje_sugerido?: string;
    promoLabel?: string;
    promo_label?: string;
    clientesObjetivo?: number;
    clientes_objetivo?: number;
    ingresoEstimado?: number;
    retorno_moneda_local?: number;
    estado?: string;
    fechaInicio?: string | null;
    razon?: string;
    razon_estrategica?: string;
    datos_en_juego?: string;
    disparador_emocional?: string;
    tono?: string;
    tipo_promo?: string;
    ideaImagen?: string | null;
    audience_id?: string;
    audience_nombre?: string;
    audience_descripcion?: string;
    variaciones_copy?: string[];
    campaign_id?: number | string;
    [key: string]: any;
}

interface UseCampaignRoadmapOptions {
    businessId?: string | null;  // Opcional: el hook puede resolverlo solo
    month: number;   // 0-indexed (JS format)
    year: number;
    enabled?: boolean;
}

interface UseCampaignRoadmapResult {
    ideas: WeeklyIdea[];
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/** Obtiene el businessId de todas las fuentes posibles */
const resolveBusinessId = async (propBusinessId?: string | null): Promise<string | null> => {
    // 1. Prop directo (más confiable si viene de AuthContext correcto)
    if (propBusinessId && !propBusinessId.startsWith('biz-') && propBusinessId !== 'demo') {
        return propBusinessId;
    }

    // 2. localStorage — múltiples claves que la app usa
    const keys = ['korat_business_id', 'business_id', 'businessId'];
    for (const key of keys) {
        const val = localStorage.getItem(key);
        if (val && !val.startsWith('biz-') && val !== 'demo' && val.includes('-')) {
            return val;
        }
    }

    // 3. Buscar en korat_user (objeto JSON guardado al hacer login)
    const userKeys = ['korat_user', 'user', 'korat_session'];
    for (const key of userKeys) {
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                const biz = parsed?.business_id || parsed?.user?.business_id;
                if (biz && !biz.startsWith('biz-') && biz.includes('-')) {
                    return biz;
                }
            }
        } catch { /* ignorar errores de parse */ }
    }

    // 4. Supabase session JWT metadata (si el usuario está autenticado con Supabase Auth)
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const biz = session?.user?.user_metadata?.business_id
            || session?.user?.app_metadata?.business_id;
        if (biz) return biz;
    } catch { /* ignorar */ }

    return null;
};

export const useCampaignRoadmap = ({
    businessId: propBusinessId,
    month,
    year,
    enabled = true,
}: UseCampaignRoadmapOptions): UseCampaignRoadmapResult => {
    const [ideas, setIdeas] = useState<WeeklyIdea[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchCountRef = useRef(0);
    // Guarda el businessId resuelto para no recalcular en cada render
    const resolvedBizIdRef = useRef<string | null>(null);

    const fetchCampaigns = useCallback(async () => {
        if (!enabled) return;

        const mesBuscado = month + 1; // JS 0-indexed → DB 1-indexed

        // Resolver businessId desde todas las fuentes disponibles
        const businessId = await resolveBusinessId(propBusinessId);
        resolvedBizIdRef.current = businessId;

        if (!businessId) {
            console.warn(`[useCampaignRoadmap] No se pudo resolver businessId para mes=${mesBuscado}. Fuentes: prop=${propBusinessId}, localStorage vacío.`);
            return;
        }

        const thisFetch = ++fetchCountRef.current;

        setIsLoading(true);
        setError(null);

        console.log(`[useCampaignRoadmap] Fetching mes=${mesBuscado}, anio=${year}, biz=${businessId}`);

        try {
            // NO usar .or() encadenado con .eq() — bug en PostgREST que devuelve [].
            // Filtrar anio en JS post-fetch.
            const { data: rawData, error: supabaseError } = await supabase
                .from('campanas')
                .select('*')
                .eq('business_id', businessId)
                .eq('mes', mesBuscado)
                .order('semana_del_mes', { ascending: true, nullsFirst: false });

            if (thisFetch !== fetchCountRef.current) return;

            if (supabaseError) {
                console.error(`[useCampaignRoadmap] Supabase error:`, supabaseError);
                setError(supabaseError.message);
                return;
            }

            // Filtrar por año: aceptar registros del año actual O con anio null (legacy)
            const data = (rawData || []).filter(row =>
                row.anio === null || row.anio === undefined || row.anio === year
            );

            console.log(`[useCampaignRoadmap] mes=${mesBuscado}: ${rawData?.length} total, ${data.length} para anio=${year}`);

            if (data.length === 0) {
                setIdeas([]);
                return;
            }

            const mapped: WeeklyIdea[] = data
                .map((row, index) => ({
                    semana: row.semana_del_mes ?? (index + 1),
                    titulo: row.titulo ?? '',
                    objetivo: row.objetivo ?? 'ventas',
                    segmento: row.segmento ?? '',
                    mensaje: row.mensaje ?? '',
                    clientesObjetivo: row.clientes_objetivo ?? 0,
                    ingresoEstimado: parseFloat(row.ingreso_estimado) || parseFloat(row.retorno_moneda_local) || 0,
                    retorno_moneda_local: parseFloat(row.retorno_moneda_local) || 0,
                    estado: row.estado ?? 'sugerida',
                    fechaInicio: row.fecha_programada ?? null,
                    razon: row.ai_analysis?.razon ?? row.razon_estrategica ?? '',
                    razon_estrategica: row.razon_estrategica ?? '',
                    datos_en_juego: row.datos_en_juego ?? '',
                    disparador_emocional: row.disparador_emocional ?? '',
                    tono: row.tono ?? '',
                    tipo_promo: row.tipo_promo ?? '',
                    ideaImagen: row.imagen_url ?? row.image_url ?? null,
                    audience_id: row.audience_id ?? '',
                    audience_nombre: row.audience_nombre ?? row.segmento ?? '',
                    audience_descripcion: row.audience_descripcion ?? '',
                    variaciones_copy: row.ai_analysis?.variaciones_copy ?? [],
                    campaign_id: row.id,
                    mes: row.mes,
                    anio: row.anio,
                }))
                .filter((w) => w.semana > 0 && !!w.titulo);

            console.log(`[useCampaignRoadmap] ✅ ${mapped.length} campañas cargadas para mes=${mesBuscado}`);
            setIdeas(mapped);

        } catch (err: any) {
            if (thisFetch !== fetchCountRef.current) return;
            console.error(`[useCampaignRoadmap] Exception:`, err);
            setError(err?.message ?? 'Error inesperado');
        } finally {
            if (thisFetch === fetchCountRef.current) {
                setIsLoading(false);
            }
        }
    }, [propBusinessId, month, year, enabled]);

    useEffect(() => {
        setIdeas([]);
        fetchCampaigns();
    }, [fetchCampaigns]);

    return { ideas, isLoading, error, refetch: fetchCampaigns };
};
