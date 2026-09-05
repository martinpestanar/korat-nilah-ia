import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Zap, Users, ArrowRight, ShieldAlert,
  ChevronRight, RefreshCw, Calendar, Flame, DollarSign,
  Layers, Gift, AlertTriangle, Clock, Lock, CheckCircle2,
  TrendingUp, Sliders, BellRing, Target, X, Calculator, Eye, UserCheck
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { ProUpgradeModal, TriggerContext } from '../UI/ProUpgradeModal';
import { Client } from '../../context/DashboardDataContext';
import { analyzeClientServiceCadence } from '../../utils/serviceCycles';

export interface CrmSegmentItem {
  id: string;
  categoria: 'ausencia' | 'servicios' | 'cruzadas' | 'lealtad';
  titulo: string;
  emoji: string;
  badge: string;
  color: 'pink' | 'violet' | 'amber' | 'fuchsia' | 'teal' | 'yellow' | 'emerald' | 'rose' | 'blue';
  count: number;
  avg_ticket: number;
  potential_revenue: number;
  dopamine_text: string;
  automation_benefit: string;
  filter_client_tab: string;
  filter_facet: string;
}

export interface CrmMarketplaceData {
  business_id: string;
  global_metrics: {
    total_clientes: number;
    total_revenue: number;
    avg_ticket: number;
  };
  proxima_festividad?: {
    nombre: string;
    fecha: string;
    dias_faltantes: number;
  } | null;
  segmentos: CrmSegmentItem[];
}

interface CrmAudiencesMarketplaceProps {
  businessId: string;
  isPro: boolean;
  clients?: Client[];
  appointments?: any[];
  onNavigateToClients: (clientTab: string, facet: string) => void;
}

type TabCategory = 'todas' | 'servicios' | 'cruzadas' | 'ausencia' | 'lealtad';
type QuickSortOption = 'todos' | 'dinero_rapido' | 'alto_ticket' | 'cross_sell';

const CATEGORY_TABS: { id: TabCategory; label: string; emoji: string }[] = [
  { id: 'todas', label: 'Todas las Oportunidades', emoji: '✨' },
  { id: 'servicios', label: 'Por Servicios', emoji: '💅' },
  { id: 'cruzadas', label: 'Venta Cruzada', emoji: '🔀' },
  { id: 'ausencia', label: 'Ausencia & Riesgo', emoji: '⚠️' },
  { id: 'lealtad', label: 'VIP & Leales', emoji: '👑' },
];

const SORT_PILLS: { id: QuickSortOption; label: string; emoji: string }[] = [
  { id: 'todos', label: 'Todos los niveles', emoji: '🎯' },
  { id: 'dinero_rapido', label: 'Dinero Rápido (Ciclo Corto)', emoji: '🔥' },
  { id: 'alto_ticket', label: 'Mayor Facturación (Ticket Alto)', emoji: '💎' },
  { id: 'cross_sell', label: 'Venta Cruzada Combo', emoji: '🔀' },
];

export const CrmAudiencesMarketplace: React.FC<CrmAudiencesMarketplaceProps> = ({
  businessId,
  isPro,
  clients = [],
  appointments = [],
  onNavigateToClients,
}) => {
  const [data, setData] = useState<CrmMarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TabCategory>('todas');
  const [quickSort, setQuickSort] = useState<QuickSortOption>('todos');
  
  // Alerta Flash del Día
  const [isFlashDismissed, setIsFlashDismissed] = useState(false);

  // Simulador / Calculadora Interactiva de Ganancias
  const [simulatingSegment, setSimulatingSegment] = useState<CrmSegmentItem | null>(null);
  const [conversionRate, setConversionRate] = useState<number>(35);

  // Teaser Drawer con Revelación Parcial (3 visibles + resto Blur)
  const [teaserSegment, setTeaserSegment] = useState<CrmSegmentItem | null>(null);

  // Upgrade Modal State
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [upgradeContext, setUpgradeContext] = useState<TriggerContext>('marketing_masivo');
  const [upgradeCustomData, setUpgradeCustomData] = useState<{
    clientCount?: number;
    estimatedRevenue?: number;
    serviceName?: string;
  }>({});

  const fetchMarketplace = useCallback(async () => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: res, error: rpcError } = await supabase.rpc('get_crm_segments_marketplace', {
        p_business_id: businessId,
      });

      if (rpcError) throw rpcError;
      if (res) {
        setData(res as CrmMarketplaceData);
      }
    } catch (err: any) {
      console.error('Error fetching CRM segments marketplace:', err);
      setError(err?.message || 'No se pudieron cargar los segmentos inteligentes');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchMarketplace();
  }, [fetchMarketplace]);

  // Filtrado y Ordenamiento por Facilidad de Retorno
  const filteredSegments = useMemo(() => {
    if (!data?.segmentos) return [];
    let list = [...data.segmentos];

    if (selectedCategory !== 'todas') {
      list = list.filter(s => s.categoria === selectedCategory);
    }

    if (quickSort === 'dinero_rapido') {
      list.sort((a, b) => {
        const aFast = (a.id.includes('unas') || a.id.includes('pestanas') || a.id.includes('riesgo')) ? 1 : 0;
        const bFast = (b.id.includes('unas') || b.id.includes('pestanas') || b.id.includes('riesgo')) ? 1 : 0;
        return bFast - aFast || b.potential_revenue - a.potential_revenue;
      });
    } else if (quickSort === 'alto_ticket') {
      list.sort((a, b) => b.avg_ticket - a.avg_ticket);
    } else if (quickSort === 'cross_sell') {
      list = list.filter(s => s.categoria === 'cruzadas');
    }

    return list;
  }, [data, selectedCategory, quickSort]);

  const totalMoneyOnTheTable = useMemo(() => {
    if (!data?.segmentos) return 0;
    return data.segmentos.reduce((sum, s) => sum + (s.potential_revenue || 0), 0);
  }, [data]);

  // Top segmento para la Alerta Flash del Día
  const topFlashSegment = useMemo(() => {
    if (!data?.segmentos) return null;
    const candidates = data.segmentos.filter(s => s.count > 0 && (s.id.includes('unas') || s.id.includes('pestanas') || s.id.includes('riesgo')));
    if (candidates.length === 0) return data.segmentos[0] || null;
    return candidates.reduce((prev, curr) => (curr.potential_revenue > prev.potential_revenue ? curr : prev), candidates[0]);
  }, [data]);

  // Mapa de servicios consumidos por cliente a partir de citas
  const clientServicesMap = useMemo(() => {
    const map = new Map<number, string[]>();
    (appointments || []).forEach(a => {
      const cid = Number(a.cliente_id ?? (a as any).client_id ?? (a as any).cliente);
      if (cid && a.servicio) {
        if (!map.has(cid)) map.set(cid, []);
        map.get(cid)!.push(a.servicio);
      }
    });
    return map;
  }, [appointments]);

  // Obtener clientas reales correspondientes al segmento para el Teaser Drawer (con filtro inteligente de ciclo)
  const teaserClientsList = useMemo(() => {
    if (!teaserSegment || !clients || clients.length === 0) return [];
    const segId = teaserSegment.id;

    const getServices = (c: any) => {
      const fromAppts = clientServicesMap.get(Number(c.id));
      if (fromAppts && fromAppts.length > 0) return fromAppts;
      return c.ultimo_servicio ? [c.ultimo_servicio] : [];
    };

    // Filtros lógicos sobre la base local de clientes
    if (segId.includes('unas')) {
      return clients.filter(c => (c.ultimo_servicio || '').toLowerCase().includes('uña') || (c.ultimo_servicio || '').toLowerCase().includes('manic'));
    } else if (segId.includes('pestanas')) {
      return clients.filter(c => (c.ultimo_servicio || '').toLowerCase().includes('pestañ') || (c.ultimo_servicio || '').toLowerCase().includes('lash'));
    } else if (segId === 'renovacion_alisados') {
      // Clientas con Alisado en ventana de renovación (120-210 días)
      return clients.filter(c => {
        const svcs = getServices(c);
        const cad = analyzeClientServiceCadence(svcs);
        return cad.hasAlisado && (c.dias_ausente || 0) >= 120 && (c.dias_ausente || 0) <= 210;
      });
    } else if (segId.includes('cabello')) {
      return clients.filter(c => (c.ultimo_servicio || '').toLowerCase().includes('cabello') || (c.ultimo_servicio || '').toLowerCase().includes('corte') || (c.ultimo_servicio || '').toLowerCase().includes('color') || (c.ultimo_servicio || '').toLowerCase().includes('alisad'));
    } else if (segId.includes('45')) {
      // FILTRO INTELIGENTE ANTI-SPAM: Excluir clientas que SOLO se hacen Alisados
      return clients.filter(c => {
        const svcs = getServices(c);
        const cad = analyzeClientServiceCadence(svcs);
        if (cad.isLongCycleOnly) return false;
        return (c.dias_ausente || 0) > 45 && (c.dias_ausente || 0) <= 75;
      });
    } else if (segId.includes('75')) {
      // FILTRO INTELIGENTE ANTI-SPAM: Excluir clientas que SOLO se hacen Alisados
      return clients.filter(c => {
        const svcs = getServices(c);
        const cad = analyzeClientServiceCadence(svcs);
        if (cad.isLongCycleOnly) return false;
        return (c.dias_ausente || 0) > 75 && (c.dias_ausente || 0) <= 120;
      });
    } else if (segId.includes('120')) {
      return clients.filter(c => (c.dias_ausente || 0) > 120);
    } else if (segId.includes('nuevas')) {
      return clients.filter(c => (c.total_visitas || 0) === 1);
    } else if (segId.includes('vip')) {
      return clients.filter(c => (c.categoria || '').toUpperCase().includes('VIP') || (c.total_visitas || 0) >= 8);
    }
    // Fallback general
    return clients.slice(0, 10);
  }, [teaserSegment, clients, clientServicesMap]);

  const handleOpenUpgrade = (segment: CrmSegmentItem, customRev?: number, customCount?: number) => {
    let ctx: TriggerContext = 'marketing_masivo';
    if (segment.id.includes('unas') || segment.id.includes('pestanas')) {
      ctx = 'retoques_21d';
    } else if (segment.categoria === 'ausencia') {
      ctx = 'rescate_inactivas';
    } else if (segment.categoria === 'lealtad') {
      ctx = 'stand_qr_resenas';
    }

    setUpgradeContext(ctx);
    setUpgradeCustomData({
      clientCount: customCount ?? segment.count,
      estimatedRevenue: customRev ?? segment.potential_revenue,
      serviceName: segment.titulo,
    });
    setIsUpgradeOpen(true);
  };

  const handleHolidayCampaign = () => {
    setUpgradeContext('marketing_masivo');
    setUpgradeCustomData({
      clientCount: data?.global_metrics?.total_clientes || 25,
      estimatedRevenue: Math.round((data?.global_metrics?.total_clientes || 25) * (data?.global_metrics?.avg_ticket || 60) * 0.4),
      serviceName: `Campaña ${data?.proxima_festividad?.nombre || 'Festiva'}`,
    });
    setIsUpgradeOpen(true);
  };

  // Cálculos de la calculadora interactiva
  const simulatedClients = useMemo(() => {
    if (!simulatingSegment) return 0;
    return Math.max(1, Math.round((simulatingSegment.count * conversionRate) / 100));
  }, [simulatingSegment, conversionRate]);

  const simulatedEarnings = useMemo(() => {
    if (!simulatingSegment) return 0;
    return simulatedClients * simulatingSegment.avg_ticket;
  }, [simulatingSegment, simulatedClients]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25"
        >
          <Sparkles size={28} />
        </motion.div>
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white">
            Calculando tus Audiencias con IA...
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Analizando tus citas, recurrencia y oportunidades ocultas
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-50/50 dark:bg-red-950/20 p-6 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-rose-500 mb-2" />
        <h4 className="text-sm font-black text-gray-900 dark:text-white">Ops, no pudimos cargar el marketplace</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">{error}</p>
        <button
          onClick={fetchMarketplace}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 text-xs font-bold"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── ALERTA FLASH DEL DÍA ── */}
      {topFlashSegment && !isFlashDismissed && topFlashSegment.count > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 p-4 text-white shadow-lg shadow-indigo-500/20"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-xl">
                <span className="animate-bounce">⚡</span>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                    Alerta de Oportunidad Hoy
                  </span>
                  <span className="text-amber-200 text-xs font-extrabold">
                    {topFlashSegment.count} clientas
                  </span>
                </div>
                <h4 className="text-sm font-black mt-0.5 leading-snug">
                  {topFlashSegment.titulo}: Tienes S/ {topFlashSegment.potential_revenue.toLocaleString()} esperando
                </h4>
                <p className="text-xs text-white/85 mt-0.5 leading-relaxed">
                  Hoy es el día ideal para enviarles el recordatorio de mantenimiento antes de que busquen otro salón.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsFlashDismissed(true)}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white/80 shrink-0 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-end gap-2">
            <button
              onClick={() => setTeaserSegment(topFlashSegment)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all"
            >
              <Eye size={13} />
              <span>Ver Clientas</span>
            </button>
            <button
              onClick={() => handleOpenUpgrade(topFlashSegment)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-900 text-xs font-black shadow-md active:scale-95 transition-all"
            >
              <Zap size={13} className="fill-gray-900" />
              <span>Activar Automatización</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── BANNER HERO DOPAMÍNICO: DINERO SOBRE LA MESA ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-950 p-5 text-white shadow-xl border border-indigo-500/30">
        <div className="absolute top-0 right-0 -mr-10 -mt-10 h-36 w-36 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-10 -mb-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-3 py-1 text-[11px] font-black text-emerald-300 tracking-wider">
              <Flame size={13} className="text-emerald-400" />
              OPORTUNIDADES DE INGRESOS
            </span>
            <span className="text-[11px] text-indigo-200/80 font-medium">
              Ticket Promedio: <strong>S/ {data.global_metrics.avg_ticket}</strong>
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              S/ {totalMoneyOnTheTable.toLocaleString()} en ingresos potenciales
            </h2>
            <p className="text-xs text-indigo-200/90 mt-1 leading-relaxed">
              Detectamos <strong>{data.segmentos.length} audiencias clave</strong> listas para recibir ofertas de retoques, venta cruzada y rescate.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <div className="flex-1 bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
              <p className="text-[10px] uppercase font-bold text-indigo-300">Clientas Totales</p>
              <p className="text-base font-black">{data.global_metrics.total_clientes}</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
              <p className="text-[10px] uppercase font-bold text-indigo-300">LTV Acumulado</p>
              <p className="text-base font-black text-emerald-400">S/ {data.global_metrics.total_revenue.toLocaleString()}</p>
            </div>
            <div className="flex-1 bg-white/10 rounded-2xl p-2.5 backdrop-blur-sm">
              <p className="text-[10px] uppercase font-bold text-indigo-300">Audiencias Activas</p>
              <p className="text-base font-black text-amber-300">
                {data.segmentos.filter(s => s.count > 0).length} / {data.segmentos.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CARD FESTIVIDAD PRÓXIMA ── */}
      {data.proxima_festividad && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 text-xl">
              🎉
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Próxima Festividad
                </span>
                <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 text-[10px] font-extrabold">
                  En {data.proxima_festividad.dias_faltantes} días
                </span>
              </div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white mt-0.5 truncate">
                Campaña {data.proxima_festividad.nombre}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-snug">
                Tus clientas ya están planeando sus citas festivas. Con tu ticket promedio de <strong>S/ {data.global_metrics.avg_ticket}</strong>, una campaña preventiva puede llenar tu semana antes de tiempo.
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-amber-500/20 flex justify-end">
            <button
              onClick={handleHolidayCampaign}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-amber-500/30 active:scale-95 transition-all"
            >
              <Zap size={14} />
              <span>Lanzar Promo de Festividad {!isPro && '(Add-on)'}</span>
            </button>
          </div>
        </motion.div>
      )}

      {/* ── SELECTOR RÁPIDO DE VELOCIDAD DE RETORNO ── */}
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
          Modo de Exploración Rápida
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {SORT_PILLS.map(sp => {
            const isSelected = quickSort === sp.id;
            return (
              <button
                key={sp.id}
                onClick={() => setQuickSort(sp.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all duration-150 active:scale-95 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50'
                }`}
              >
                <span>{sp.emoji}</span>
                <span>{sp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SELECTOR HORIZONTAL TÁCTIL DE CATEGORÍAS ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {CATEGORY_TABS.map(cat => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all duration-150 active:scale-95 min-h-[40px] ${
                isActive
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md'
                  : 'bg-white dark:bg-dark-card text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-white/10 hover:bg-gray-50'
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── GRID DE CARDS DOPAMÍNICAS DE AUDIENCIA ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSegments.map((segment, idx) => {
          const hasClients = segment.count > 0;
          return (
            <motion.div
              key={segment.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`group relative overflow-hidden rounded-3xl border p-4 flex flex-col justify-between transition-all duration-200 ${
                hasClients
                  ? 'bg-white dark:bg-dark-card border-gray-200/90 dark:border-white/10 shadow-sm hover:shadow-md'
                  : 'bg-gray-50/70 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/5 opacity-75'
              }`}
            >
              {/* Encabezado de la Card */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/10 text-2xl shadow-inner shrink-0">
                      {segment.emoji}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                        {segment.titulo}
                      </h3>
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                        {segment.badge}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-xl font-black ${hasClients ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                      {segment.count}
                    </span>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">clientas</p>
                  </div>
                </div>

                {/* Mensaje Persuasivo */}
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-3">
                  {segment.dopamine_text}
                </p>

                {/* Proyección Financiera (S/) + Botón de Simulación Dopamínica */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 p-2.5 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <TrendingUp size={13} className="text-emerald-500" />
                      Potencial Recuperable:
                    </span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      S/ {segment.potential_revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-emerald-500/15">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                      Ticket est.: S/ {segment.avg_ticket}
                    </span>
                    {hasClients && (
                      <button
                        onClick={() => {
                          setSimulatingSegment(segment);
                          setConversionRate(35);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:underline active:scale-95"
                      >
                        <Calculator size={11} />
                        <span>Simular Retorno</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Botones de Acción (Free vs Pro) */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                {/* Botón 1: Teaser de Revelación Parcial */}
                <button
                  onClick={() => setTeaserSegment(segment)}
                  className="flex-1 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 transition-all text-center truncate active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Eye size={12} />
                  <span>Ver {segment.count} clientas</span>
                </button>

                {/* Botón 2: El Hook de Conversión a Automatizaciones Pro */}
                <button
                  onClick={() => handleOpenUpgrade(segment)}
                  className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 ${
                    isPro
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      : 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-indigo-600/20'
                  }`}
                >
                  <Zap size={13} className={isPro ? '' : 'text-amber-300 fill-amber-300'} />
                  <span className="whitespace-nowrap">
                    {isPro ? 'Automatizar' : 'Activar Bot'}
                  </span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── TEASER DRAWER: REVELACIÓN PARCIAL (3 REALES + RESTO EN BLUR CON CANDADO) ── */}
      <AnimatePresence>
        {teaserSegment && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
              onClick={() => setTeaserSegment(null)}
            />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-hidden"
            >
              {/* Encabezado del Drawer */}
              <div className="flex items-start justify-between border-b border-gray-100 dark:border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-white/10 text-2xl">
                    {teaserSegment.emoji}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Audiencia Acumulada
                    </span>
                    <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                      {teaserSegment.titulo}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {teaserSegment.count} clientas detectadas por Nilah
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setTeaserSegment(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lista Teaser: 3 visibles reales */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {/* Banner de Inteligencia de Ciclos Anti-Spam */}
                {teaserSegment.categoria === 'ausencia' && (
                  <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/40 p-2.5 flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">🛡️</span>
                    <p className="text-[10px] text-indigo-900 dark:text-indigo-200 leading-snug">
                      <strong>Filtro Anti-Spam Activo:</strong> Solo incluye clientas con servicios frecuentes (uñas, pestañas, cejas) o híbridas. Las clientas que solo se hacen <strong>alisados o balayage</strong> están protegidas en su ciclo de 4 a 6 meses.
                    </p>
                  </div>
                )}

                {teaserSegment.id === 'renovacion_alisados' && (
                  <div className="rounded-2xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200/70 dark:border-purple-800/40 p-2.5 flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">✨</span>
                    <p className="text-[10px] text-purple-900 dark:text-purple-200 leading-snug">
                      <strong>Ciclo de Oro (120-210d):</strong> Clientas cuyo alisado/keratina ya cumplió 4 a 6 meses. La raíz ya tiene nuevo crecimiento visible y es el momento exacto para agendar su renovación de ticket alto.
                    </p>
                  </div>
                )}

                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Muestra de clientas esperando contacto:
                </p>

                {teaserClientsList.slice(0, 3).map((cl, i) => (
                  <div
                    key={cl.id || i}
                    className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs shrink-0">
                        {cl.nombre?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                          {cl.nombre || `Clienta #${cl.id}`}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">
                          {cl.ultimo_servicio || 'Servicio frecuente'} · {cl.dias_ausente || 21}d de ausencia
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 shrink-0">
                      Día Óptimo
                    </span>
                  </div>
                ))}

                {/* FILAS CON BLUR (DOPAMINA + CANDADO) */}
                <div className="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 dark:border-white/15 p-2 space-y-2 bg-gray-50/50 dark:bg-white/5">
                  {/* Filas fantasma difuminadas */}
                  <div className="filter blur-[4px] select-none pointer-events-none space-y-2 opacity-60">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-200 dark:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gray-300 dark:bg-white/20" />
                        <div>
                          <p className="text-xs font-bold text-gray-800">María Fernanda Gómez</p>
                          <p className="text-[9px] text-gray-500">Retoque Uñas Gel · hace 22d</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold">En espera</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-200 dark:bg-white/10">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-gray-300 dark:bg-white/20" />
                        <div>
                          <p className="text-xs font-bold text-gray-800">Lucía Ramos Castillo</p>
                          <p className="text-[9px] text-gray-500">Pestañas Volumen · hace 20d</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-600 font-bold">En espera</span>
                    </div>
                  </div>

                  {/* Tarjeta de Hook de Conversión sobre el Blur */}
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-dark-card dark:via-dark-card/95 flex flex-col items-center justify-center p-4 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 mb-1.5">
                      <Lock size={18} />
                    </div>
                    <h4 className="text-xs font-black text-gray-900 dark:text-white">
                      +{Math.max(1, teaserSegment.count - 3)} clientas más en esta audiencia
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-xs leading-tight">
                      Contactarlas a mano una por una te tomará horas todos los días y se te pasarán las fechas.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer CTA */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex flex-col gap-2">
                <button
                  onClick={() => {
                    const seg = teaserSegment;
                    setTeaserSegment(null);
                    handleOpenUpgrade(seg);
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
                >
                  <Zap size={16} className="fill-amber-300 text-amber-300" />
                  <span>Automatizar Envíos por WhatsApp (Plan PRO)</span>
                </button>
                <button
                  onClick={() => {
                    const seg = teaserSegment;
                    setTeaserSegment(null);
                    onNavigateToClients(seg.filter_client_tab, seg.filter_facet);
                  }}
                  className="text-center text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-1"
                >
                  Ver lista simple en CRM
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL CALCULADORA INTERACTIVA DE RETORNO ── */}
      <AnimatePresence>
        {simulatingSegment && (
          <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs"
              onClick={() => setSimulatingSegment(null)}
            />

            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-dark-card border border-gray-200 dark:border-white/10 p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-white/10 text-2xl">
                    {simulatingSegment.emoji}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Simulador Financiero Nilah
                    </span>
                    <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                      {simulatingSegment.titulo}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSimulatingSegment(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-600 dark:text-gray-300">
                Tienes <strong>{simulatingSegment.count} clientas</strong> en este grupo. Mueve el control para ver cuánto dinero generarías según la tasa de respuesta:
              </p>

              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-200/70 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-gray-500 dark:text-gray-400">Tasa de Reactivación:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 text-sm">{conversionRate}%</span>
                </div>

                <input
                  type="range"
                  min="10"
                  max="70"
                  step="5"
                  value={conversionRate}
                  onChange={e => setConversionRate(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                <div className="flex justify-between text-[10px] font-bold text-gray-400">
                  <span>10% (Pesimista)</span>
                  <span>35% (Habitual Nilah)</span>
                  <span>70% (Temporada Alta)</span>
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/30 p-4 text-center">
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  Recuperarías <strong>{simulatedClients} citas pagadas</strong>
                </p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 my-1">
                  S/ {simulatedEarnings.toLocaleString()}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  (Basado en tu ticket promedio de S/ {simulatingSegment.avg_ticket})
                </p>
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl p-3 border border-indigo-200/70 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                  El Add-on se paga solo en tu 1er día
                </p>
                <p className="text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-300">
                  Con solo <strong>2 clientas</strong> que reactives de las {simulatedClients} estimadas, ya recuperaste la inversión de la automatización mensual.
                </p>
              </div>

              <button
                onClick={() => {
                  const seg = simulatingSegment;
                  setSimulatingSegment(null);
                  handleOpenUpgrade(seg, simulatedEarnings, simulatedClients);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 text-sm font-black text-white shadow-lg shadow-indigo-500/25 active:scale-95 transition-all"
              >
                <Zap size={16} className="fill-amber-300 text-amber-300" />
                <span>Activar este Flujo para Recuperar S/ {simulatedEarnings.toLocaleString()}</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE UPGRADE CONTEXTUALIZADO CON DATOS REALES */}
      <ProUpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        context={upgradeContext}
        customData={upgradeCustomData}
      />
    </div>
  );
};

export default CrmAudiencesMarketplace;
