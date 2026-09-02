import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Eye, Clock, Zap, ArrowUpRight, Smartphone,
  RefreshCw, CheckCircle2, ChevronDown, ChevronUp, Copy, Check,
  Share2, MousePointer, ShieldAlert, Sparkles, Filter, Users,
  BarChart3, Layers, Compass, HelpCircle, Flame
} from 'lucide-react';
import {
  getAnalyticsSummary,
  AnalyticsSummary,
  RecentSessionFeedItem,
  HotspotItem
} from '../../services/analyticsService';

export const GodModeTikTokAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<number>(7); // 1, 7, 30, 90
  const [sourceFilter, setSourceFilter] = useState<string>('all'); // all, tiktok, direct, other
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('tiktok_bio');

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const summary = await getAnalyticsSummary(timeRange, sourceFilter);
      setData(summary);
    } catch (err) {
      console.error('Error fetching analytics summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeRange, sourceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Formatear segundos a formato amigable (ej. 1m 24s o 45s)
  const formatSeconds = (seconds: number): string => {
    if (!seconds || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // Formatear fecha relativa (ej. "Hace 5 min", "Hace 2 horas")
  const formatTimeAgo = (isoDate?: string): string => {
    if (!isoDate) return 'Reciente';
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Hace unos segs';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  };

  // Copiar link de TikTok listo
  const handleCopyLink = (campaign: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nilah.app';
    const link = `${origin}/soluciones?ref=${campaign}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(campaign);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const getDeviceIcon = (device?: string) => {
    if (device?.includes('ios') || device?.includes('android') || device?.includes('mobile')) {
      return <Smartphone className="w-4 h-4 text-emerald-600" />;
    }
    return <Layers className="w-4 h-4 text-slate-500" />;
  };

  const getSourceBadge = (source?: string) => {
    if (source?.startsWith('tiktok')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          TikTok {source === 'tiktok_inapp' ? 'In-App' : 'Bio'}
        </span>
      );
    }
    if (source === 'instagram') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-fuchsia-50 border border-fuchsia-200 text-fuchsia-800 text-[10px] font-black uppercase tracking-wider shadow-2xs">
          Instagram
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold">
        {source || 'Directo'}
      </span>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 pb-20 font-sans text-slate-900">

      {/* ══════════════════════════════════════════════════════════
          1. HEADER FIRST-MOBILE CON CONTROL DE TIEMPO & REFRESH
      ══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm shadow-emerald-900/5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
                TikTok Traffic & Growth Hub
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                  Live
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Telemetría en tiempo real del enlace <span className="text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">/soluciones</span>
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Filtros & Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selector de Rango */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold shadow-2xs">
            <button
              onClick={() => setTimeRange(1)}
              className={`px-3 py-1 rounded-lg transition-all ${timeRange === 1 ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Hoy
            </button>
            <button
              onClick={() => setTimeRange(7)}
              className={`px-3 py-1 rounded-lg transition-all ${timeRange === 7 ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
            >
              7D
            </button>
            <button
              onClick={() => setTimeRange(30)}
              className={`px-3 py-1 rounded-lg transition-all ${timeRange === 30 ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
            >
              30D
            </button>
            <button
              onClick={() => setTimeRange(90)}
              className={`px-3 py-1 rounded-lg transition-all ${timeRange === 90 ? 'bg-white text-emerald-800 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Todo
            </button>
          </div>

          {/* Botón Refrescar */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-600 border border-slate-200 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold shadow-2xs"
            title="Refrescar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. FILTRO RÁPIDO DE FUENTE (CHIPS TÁCTILES)
      ══════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold no-scrollbar">
        <button
          onClick={() => setSourceFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl border shrink-0 transition-all ${
            sourceFilter === 'all'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          🌐 Todas las Fuentes
        </button>
        <button
          onClick={() => setSourceFilter('tiktok')}
          className={`px-3.5 py-1.5 rounded-xl border shrink-0 transition-all flex items-center gap-1.5 ${
            sourceFilter === 'tiktok'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          🎵 Solo TikTok ({data?.tiktok_percentage || 0}%)
        </button>
        <button
          onClick={() => setSourceFilter('direct')}
          className={`px-3.5 py-1.5 rounded-xl border shrink-0 transition-all ${
            sourceFilter === 'direct'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          🔗 Directo / Bio Link
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          3. GENERADOR DE LINKS CON TRACKING PARA TIKTOK
      ══════════════════════════════════════════════════════════ */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/40 border border-emerald-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Share2 className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">
                Tu Enlace Inteligente para TikTok
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Copia este link para pegarlo en tu biografía o fijarlo en tus comentarios:
              </p>
            </div>
          </div>

          {/* Selector de Campaña & Botón Copiar */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-white border border-emerald-200 text-slate-900 text-xs font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-emerald-500 shadow-2xs"
            >
              <option value="tiktok_bio">📌 Bio de TikTok (General)</option>
              <option value="tt_video_noshows">🎬 Video: Calculadora No-Shows</option>
              <option value="tt_video_ebook">📚 Video: Ebook Clientas Regresen</option>
              <option value="tt_video_freemium">📱 Video: Nilah App Freemium</option>
              <option value="tt_video_independizarse">🚀 Video: Quiero Independizarme</option>
            </select>

            <button
              onClick={() => handleCopyLink(selectedCampaign)}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer ${
                copiedLink === selectedCampaign
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {copiedLink === selectedCampaign ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. 4 KPIS HERO (FIRST-MOBILE CARDS)
      ══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Visitas Totales */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-slate-500 text-xs font-bold">Visitas Totales</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Eye className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.total_sessions.toLocaleString() || 0}
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
              <span>🎵 {data?.tiktok_sessions || 0} de TikTok ({data?.tiktok_percentage || 0}%)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Dwell Time Promedio */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-slate-500 text-xs font-bold">Tiempo en Página</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {formatSeconds(data?.avg_duration_seconds || 0)}
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              Promedio de atención real
            </div>
          </div>
        </div>

        {/* KPI 3: Tasa de Rebote */}
        <div className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-slate-500 text-xs font-bold">Tasa de Rebote</span>
            <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {data?.bounce_rate || 0}%
            </div>
            <div className="mt-1 text-[11px] text-slate-500 font-medium">
              Salieron en &lt;10s sin clics
            </div>
          </div>
        </div>

        {/* KPI 4: Conversiones a WhatsApp / Registro */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-white to-emerald-50 border border-emerald-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-emerald-800 text-xs font-bold">Conversión (Leads)</span>
            <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-emerald-800">
              {data?.converted_sessions || 0}
              <span className="text-sm font-bold text-emerald-600 ml-1.5">
                ({data?.conversion_rate || 0}%)
              </span>
            </div>
            <div className="mt-1 text-[11px] text-slate-600 font-medium">
              WhatsApp / Registro gratis
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          5. EMBUDO DE CONVERSIÓN VISUAL (FUNNEL)
      ══════════════════════════════════════════════════════════ */}
      <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <BarChart3 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">Embudo de Conversión de TikTok</h3>
              <p className="text-xs text-slate-500">Pérdida y retención de visitantes por etapa</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Paso 1: Entraron */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-700 font-black">1</span>
                Entraron a /soluciones
              </span>
              <span className="text-slate-900 font-mono">{data?.funnel?.total_visits || 0} (100%)</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full w-full" />
            </div>
          </div>

          {/* Paso 2: Permanencia Calificada (+15s o Scroll >40%) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-700 font-black">2</span>
                Se quedaron a leer (+15s / Scroll &gt;40%)
              </span>
              <span className="text-emerald-700 font-mono">
                {data?.funnel?.engaged_visitors || 0} ({data?.funnel?.engaged_pct || 0}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data?.funnel?.engaged_pct || 0)}%` }}
              />
            </div>
          </div>

          {/* Paso 3: Exploradores Activos (Clics en nichos o Scroll >70%) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-700 font-black">3</span>
                Interactuaron con recursos / Calculadora
              </span>
              <span className="text-amber-600 font-mono">
                {data?.funnel?.explorers || 0} ({data?.funnel?.explorers_pct || 0}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, data?.funnel?.explorers_pct || 0)}%` }}
              />
            </div>
          </div>

          {/* Paso 4: Conversión (WhatsApp / Registro) */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-emerald-900 font-black flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">4</span>
                Conversión Final (WhatsApp / Registro)
              </span>
              <span className="text-emerald-700 font-mono font-black">
                {data?.funnel?.conversions || 0} ({data?.funnel?.conversion_pct || 0}%)
              </span>
            </div>
            <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden border border-emerald-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${Math.min(100, data?.funnel?.conversion_pct || 0)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          6. RANKING DE BOTONES MÁS CLICKEADOS (HOTSPOTS)
      ══════════════════════════════════════════════════════════ */}
      <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Flame className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">Botones Calientes (Hotspots)</h3>
              <p className="text-xs text-slate-500">Dónde hacen clic los visitantes dentro de /soluciones</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-600">
            Total clics: <strong className="text-emerald-800 font-mono">{data?.total_clicks || 0}</strong>
          </span>
        </div>

        {(!data?.hotspots || data.hotspots.length === 0) ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100">
            <MousePointer className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Aún no se registran clics en este periodo.</p>
            <p className="text-[11px] text-slate-500 mt-1">Los clics aparecerán en tiempo real conforme la gente entre desde TikTok.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.hotspots.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-emerald-200 transition-all flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-black text-emerald-700 w-4">{idx + 1}.</span>
                    <h4 className="text-xs font-black text-slate-900 truncate">
                      {item.label}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                      {item.clicks} clics
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-700">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Barra de progreso */}
                <div className="w-full h-1.5 rounded-full bg-slate-200/80 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          7. FEED EN TIEMPO REAL DE SESIONES (LIVE FEED)
      ══════════════════════════════════════════════════════════ */}
      <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-sm">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <div>
              <h3 className="text-sm font-black text-slate-900">Feed de Sesiones en Vivo</h3>
              <p className="text-xs text-slate-500">Historial reciente de visitantes y sus acciones</p>
            </div>
          </div>
        </div>

        {(!data?.recent_sessions || data.recent_sessions.length === 0) ? (
          <div className="p-8 text-center rounded-xl bg-slate-50 border border-slate-100">
            <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Sin sesiones registradas en este filtro.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recent_sessions.map((session) => {
              const isExpanded = expandedSessionId === session.session_id;

              return (
                <div
                  key={session.session_id}
                  className={`rounded-xl border transition-all ${
                    session.converted
                      ? 'bg-emerald-50/50 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-emerald-200'
                  }`}
                >
                  <div
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.session_id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="p-2 rounded-xl bg-slate-50 border border-slate-100 shrink-0">
                        {getDeviceIcon(session.device_type)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {getSourceBadge(session.source)}
                          {session.utm_campaign && (
                            <span className="text-[10px] font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              {session.utm_campaign}
                            </span>
                          )}
                          {session.converted && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider shadow-2xs">
                              ✓ Convirtió
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2 font-medium">
                          <span>⏳ {formatSeconds(session.duration_seconds)}</span>
                          <span>•</span>
                          <span>📜 Scroll: {session.max_scroll_percent}%</span>
                          <span>•</span>
                          <span>🖱️ {session.total_clicks} clics</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatTimeAgo(session.created_at)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Detalle expandido de eventos de la sesión */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-slate-100 text-xs bg-slate-50/50 rounded-b-xl">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        Línea de tiempo de interacción:
                      </p>
                      {(!session.events || session.events.length === 0) ? (
                        <p className="text-slate-400 italic text-[11px]">Navegó sin eventos de clics registrados.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {session.events.map((ev, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span className="font-semibold text-slate-900">{ev.label}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                ({formatTimeAgo(ev.created_at)})
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
