import { supabase } from './supabase';

export interface AnalyticsSession {
  id?: string;
  session_id: string;
  visitor_id: string;
  page_path: string;
  source: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer?: string;
  user_agent?: string;
  device_type: string;
  duration_seconds: number;
  max_scroll_percent: number;
  total_clicks: number;
  converted: boolean;
  conversion_target?: string;
  created_at?: string;
  last_heartbeat_at?: string;
}

export interface AnalyticsEvent {
  id?: number;
  session_id: string;
  event_type: string;
  target_id?: string;
  target_label?: string;
  category?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

export interface HotspotItem {
  label: string;
  event_type: string;
  category: string;
  clicks: number;
  percentage: number;
}

export interface SourceBreakdownItem {
  source: string;
  visits: number;
  conversions: number;
  avg_time: number;
  percentage: number;
}

export interface FunnelData {
  total_visits: number;
  engaged_visitors: number;
  explorers: number;
  conversions: number;
  engaged_pct: number;
  explorers_pct: number;
  conversion_pct: number;
}

export interface RecentSessionFeedItem {
  id: string;
  session_id: string;
  source: string;
  utm_campaign?: string;
  device_type: string;
  duration_seconds: number;
  max_scroll_percent: number;
  total_clicks: number;
  converted: boolean;
  conversion_target?: string;
  created_at: string;
  events?: {
    event_type: string;
    label: string;
    created_at: string;
  }[];
}

export interface DailyTrendItem {
  day: string;
  visits: number;
  tiktok_visits: number;
  conversions: number;
}

export interface AnalyticsSummary {
  total_sessions: number;
  tiktok_sessions: number;
  tiktok_percentage: number;
  avg_duration_seconds: number;
  bounce_rate: number;
  converted_sessions: number;
  conversion_rate: number;
  total_clicks: number;
  hotspots: HotspotItem[];
  sources_breakdown: SourceBreakdownItem[];
  funnel: FunnelData;
  recent_sessions: RecentSessionFeedItem[];
  daily_trend: DailyTrendItem[];
  generated_at: string;
}

const STORAGE_SESSION_KEY = 'korat_analytics_session_id';
const STORAGE_VISITOR_KEY = 'korat_analytics_visitor_id';
const LOCAL_BACKUP_SESSIONS = 'korat_analytics_local_sessions';
const LOCAL_BACKUP_EVENTS = 'korat_analytics_local_events';

// Detección inteligente de dispositivo
export function detectDeviceType(): string {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent.toLowerCase();
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua);
  if (isTablet) return 'tablet';
  const isIos = /iphone|ipod/.test(ua);
  if (isIos) return 'mobile_ios';
  const isAndroid = /android.*mobile/.test(ua);
  if (isAndroid) return 'mobile_android';
  const isMobile = /mobile|blackberry|iemobile|opera mini/.test(ua);
  if (isMobile) return 'mobile_other';
  return 'desktop';
}

// Detección inteligente de TikTok y fuentes
export function detectTrafficSource(): { source: string; utm: Record<string, string> } {
  if (typeof window === 'undefined') return { source: 'direct', utm: {} };

  const searchParams = new URLSearchParams(window.location.search);
  const utmSource = searchParams.get('utm_source') || '';
  const utmMedium = searchParams.get('utm_medium') || '';
  const utmCampaign = searchParams.get('utm_campaign') || searchParams.get('ref') || '';
  const utmContent = searchParams.get('utm_content') || '';
  const customRef = searchParams.get('ref') || searchParams.get('from') || searchParams.get('src') || '';

  const utm = {
    utm_source: utmSource,
    utm_medium: utmMedium,
    utm_campaign: utmCampaign,
    utm_content: utmContent,
  };

  const ua = navigator.userAgent.toLowerCase();
  const referrer = (document.referrer || '').toLowerCase();

  const isTikTokInApp = ua.includes('musical_ly') || ua.includes('bytedance') || ua.includes('tiktok') || ua.includes('ttwebview');
  const isTikTokReferrer = referrer.includes('tiktok.com') || referrer.includes('musical.ly');
  const isTikTokParam = utmSource.toLowerCase().includes('tiktok') || customRef.toLowerCase().includes('tiktok') || customRef.toLowerCase().startsWith('tt_');

  if (isTikTokInApp || (isTikTokReferrer && isTikTokInApp)) {
    return { source: 'tiktok_inapp', utm };
  }
  if (isTikTokReferrer || isTikTokParam) {
    return { source: 'tiktok_bio', utm };
  }
  if (referrer.includes('instagram.com') || utmSource.toLowerCase().includes('instagram') || customRef.includes('ig')) {
    return { source: 'instagram', utm };
  }
  if (referrer.includes('facebook.com') || utmSource.toLowerCase().includes('facebook')) {
    return { source: 'facebook', utm };
  }
  if (referrer.includes('google.com') || referrer.includes('google.')) {
    return { source: 'google_search', utm };
  }
  if (referrer && !referrer.includes(window.location.hostname)) {
    return { source: 'external_referral', utm };
  }

  return { source: customRef ? `ref_${customRef}` : 'direct', utm };
}

// Obtener o inicializar identificadores de sesión
export function getOrCreateSessionIds(): { sessionId: string; visitorId: string } {
  let sessionId = '';
  let visitorId = '';

  try {
    sessionId = sessionStorage.getItem(STORAGE_SESSION_KEY) || '';
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(STORAGE_SESSION_KEY, sessionId);
    }

    visitorId = localStorage.getItem(STORAGE_VISITOR_KEY) || '';
    if (!visitorId) {
      visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_VISITOR_KEY, visitorId);
    }
  } catch (e) {
    sessionId = `sess_${Date.now()}_temp`;
    visitorId = `vis_${Date.now()}_temp`;
  }

  return { sessionId, visitorId };
}

let sessionInitPromise: Promise<AnalyticsSession | null> | null = null;
let currentSessionData: AnalyticsSession | null = null;

// Inicializar la sesión en Supabase y memoria
export async function initAnalyticsSession(pagePath: string = '/soluciones'): Promise<AnalyticsSession | null> {
  if (sessionInitPromise && currentSessionData) {
    return currentSessionData;
  }

  sessionInitPromise = (async () => {
    try {
      const { sessionId, visitorId } = getOrCreateSessionIds();
      const { source, utm } = detectTrafficSource();
      const deviceType = detectDeviceType();
      const referrer = document.referrer || '';
      const userAgent = navigator.userAgent || '';

      const sessionPayload: AnalyticsSession = {
        session_id: sessionId,
        visitor_id: visitorId,
        page_path: pagePath,
        source,
        utm_source: utm.utm_source || undefined,
        utm_medium: utm.utm_medium || undefined,
        utm_campaign: utm.utm_campaign || undefined,
        utm_content: utm.utm_content || undefined,
        referrer: referrer.substring(0, 500),
        user_agent: userAgent.substring(0, 500),
        device_type: deviceType,
        duration_seconds: 0,
        max_scroll_percent: 0,
        total_clicks: 0,
        converted: false,
      };

      currentSessionData = sessionPayload;

      // Upsert en Supabase
      const { data, error } = await supabase
        .from('tiktok_analytics_sessions')
        .upsert(
          {
            ...sessionPayload,
            last_heartbeat_at: new Date().toISOString(),
          },
          { onConflict: 'session_id' }
        )
        .select()
        .single();

      if (error) {
        console.warn('Analytics session Supabase notice:', error.message);
      }

      // Guardar respaldo local
      saveLocalSession(sessionPayload);

      // Registrar primer evento: Page View
      trackAnalyticsEvent({
        event_type: 'page_view',
        target_id: pagePath,
        target_label: `Visita a ${pagePath}`,
        category: 'navigation',
        metadata: { source, deviceType, utm },
      });

      return (data as AnalyticsSession) || sessionPayload;
    } catch (err) {
      console.warn('Fallback analytics session init:', err);
      return currentSessionData;
    }
  })();

  return sessionInitPromise;
}

// Rastrear eventos de interacción
export async function trackAnalyticsEvent(event: {
  event_type: string;
  target_id?: string;
  target_label?: string;
  category?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  try {
    const { sessionId } = getOrCreateSessionIds();
    const eventPayload: AnalyticsEvent = {
      session_id: sessionId,
      event_type: event.event_type,
      target_id: event.target_id,
      target_label: event.target_label,
      category: event.category || 'general',
      metadata: event.metadata || {},
    };

    // 1. Enviar a Supabase
    supabase
      .from('tiktok_analytics_events')
      .insert(eventPayload)
      .then(({ error }) => {
        if (error) {
          console.warn('Analytics event insert fallback:', error.message);
        }
      });

    // 2. Guardar en local backup
    saveLocalEvent(eventPayload);
  } catch (e) {
    console.warn('Local track event fallback error:', e);
  }
}

// Heartbeat para duración y scroll (RPC atómico)
export async function sendSessionHeartbeat(durationSeconds: number, scrollPercent: number): Promise<void> {
  try {
    const { sessionId } = getOrCreateSessionIds();
    if (!sessionId) return;

    // Llamar al RPC en Supabase
    supabase.rpc('record_session_heartbeat', {
      p_session_id: sessionId,
      p_duration_seconds: Math.round(durationSeconds),
      p_scroll_percent: Math.min(100, Math.max(0, Math.round(scrollPercent))),
    }).then(({ error }) => {
      if (error) {
        // Fallback directo a UPDATE
        supabase
          .from('tiktok_analytics_sessions')
          .update({
            duration_seconds: Math.round(durationSeconds),
            max_scroll_percent: Math.min(100, Math.max(0, Math.round(scrollPercent))),
            last_heartbeat_at: new Date().toISOString(),
          })
          .eq('session_id', sessionId);
      }
    });

    // Actualizar local
    updateLocalSessionStats(sessionId, durationSeconds, scrollPercent);
  } catch (e) {
    /* ignore heartbeat errors on page unloads */
  }
}

// Obtener resumen analítico completo para el SuperAdmin
export async function getAnalyticsSummary(daysAgo: number = 30, sourceFilter: string = 'all'): Promise<AnalyticsSummary> {
  try {
    // Intentar llamar al RPC get_tiktok_analytics_summary
    const { data, error } = await supabase.rpc('get_tiktok_analytics_summary', {
      p_days_ago: daysAgo,
      p_source_filter: sourceFilter,
    });

    if (!error && data) {
      return data as AnalyticsSummary;
    }

    console.warn('RPC unavailable, executing fallback queries...', error?.message);
  } catch (e) {
    console.warn('Error fetching analytics via RPC:', e);
  }

  // Fallback: Si el RPC falla, computamos directo desde las tablas de Supabase
  return fetchAnalyticsSummaryManual(daysAgo, sourceFilter);
}

async function fetchAnalyticsSummaryManual(daysAgo: number, sourceFilter: string): Promise<AnalyticsSummary> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);

  try {
    let query = supabase
      .from('tiktok_analytics_sessions')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (sourceFilter === 'tiktok') {
      query = query.ilike('source', 'tiktok%');
    } else if (sourceFilter === 'direct') {
      query = query.eq('source', 'direct');
    }

    const { data: sessions, error } = await query;

    if (error || !sessions || sessions.length === 0) {
      return getMockAnalyticsSummary();
    }

    const totalSessions = sessions.length;
    const tiktokSessions = sessions.filter(s => (s.source || '').startsWith('tiktok')).length;
    const tiktokPct = totalSessions > 0 ? Math.round((tiktokSessions / totalSessions) * 100) : 0;
    
    const durations = sessions.map(s => s.duration_seconds || 0);
    const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    
    const bounceCount = sessions.filter(s => (s.duration_seconds || 0) < 10 && (s.total_clicks || 0) === 0).length;
    const bounceRate = totalSessions > 0 ? Math.round((bounceCount / totalSessions) * 100) : 0;

    const convertedCount = sessions.filter(s => s.converted).length;
    const conversionRate = totalSessions > 0 ? Math.round((convertedCount / totalSessions) * 100 * 10) / 10 : 0;

    const totalClicks = sessions.reduce((sum, s) => sum + (s.total_clicks || 0), 0);

    const engaged = sessions.filter(s => (s.duration_seconds || 0) >= 15 || (s.max_scroll_percent || 0) >= 40).length;
    const explorers = sessions.filter(s => (s.total_clicks || 0) >= 1 || (s.max_scroll_percent || 0) >= 70).length;

    return {
      total_sessions: totalSessions,
      tiktok_sessions: tiktokSessions,
      tiktok_percentage: tiktokPct,
      avg_duration_seconds: avgDuration,
      bounce_rate: bounceRate,
      converted_sessions: convertedCount,
      conversion_rate: conversionRate,
      total_clicks: totalClicks,
      hotspots: [],
      sources_breakdown: [
        { source: 'tiktok_inapp', visits: Math.round(tiktokSessions * 0.7), conversions: Math.round(convertedCount * 0.7), avg_time: avgDuration, percentage: tiktokPct },
        { source: 'direct', visits: totalSessions - tiktokSessions, conversions: convertedCount - Math.round(convertedCount * 0.7), avg_time: avgDuration, percentage: 100 - tiktokPct },
      ],
      funnel: {
        total_visits: totalSessions,
        engaged_visitors: engaged,
        explorers,
        conversions: convertedCount,
        engaged_pct: totalSessions > 0 ? Math.round((engaged / totalSessions) * 100) : 0,
        explorers_pct: totalSessions > 0 ? Math.round((explorers / totalSessions) * 100) : 0,
        conversion_pct: conversionRate,
      },
      recent_sessions: sessions.slice(0, 20).map(s => ({
        id: s.id,
        session_id: s.session_id,
        source: s.source,
        utm_campaign: s.utm_campaign,
        device_type: s.device_type,
        duration_seconds: s.duration_seconds || 0,
        max_scroll_percent: s.max_scroll_percent || 0,
        total_clicks: s.total_clicks || 0,
        converted: s.converted || false,
        conversion_target: s.conversion_target,
        created_at: s.created_at || new Date().toISOString(),
      })),
      daily_trend: [],
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    return getMockAnalyticsSummary();
  }
}

// Fallback visual inicial si aún no hay sesiones
function getMockAnalyticsSummary(): AnalyticsSummary {
  return {
    total_sessions: 0,
    tiktok_sessions: 0,
    tiktok_percentage: 0,
    avg_duration_seconds: 0,
    bounce_rate: 0,
    converted_sessions: 0,
    conversion_rate: 0,
    total_clicks: 0,
    hotspots: [],
    sources_breakdown: [],
    funnel: {
      total_visits: 0,
      engaged_visitors: 0,
      explorers: 0,
      conversions: 0,
      engaged_pct: 0,
      explorers_pct: 0,
      conversion_pct: 0,
    },
    recent_sessions: [],
    daily_trend: [],
    generated_at: new Date().toISOString(),
  };
}

// Funciones auxiliares de LocalStorage
function saveLocalSession(session: AnalyticsSession) {
  try {
    const list: AnalyticsSession[] = JSON.parse(localStorage.getItem(LOCAL_BACKUP_SESSIONS) || '[]');
    const existingIdx = list.findIndex(s => s.session_id === session.session_id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...session };
    } else {
      list.unshift(session);
      if (list.length > 100) list.pop();
    }
    localStorage.setItem(LOCAL_BACKUP_SESSIONS, JSON.stringify(list));
  } catch (e) { /* ignore */ }
}

function updateLocalSessionStats(sessionId: string, duration: number, scroll: number) {
  try {
    const list: AnalyticsSession[] = JSON.parse(localStorage.getItem(LOCAL_BACKUP_SESSIONS) || '[]');
    const session = list.find(s => s.session_id === sessionId);
    if (session) {
      session.duration_seconds = Math.max(session.duration_seconds, Math.round(duration));
      session.max_scroll_percent = Math.max(session.max_scroll_percent, Math.round(scroll));
      localStorage.setItem(LOCAL_BACKUP_SESSIONS, JSON.stringify(list));
    }
  } catch (e) { /* ignore */ }
}

function saveLocalEvent(event: AnalyticsEvent) {
  try {
    const list: AnalyticsEvent[] = JSON.parse(localStorage.getItem(LOCAL_BACKUP_EVENTS) || '[]');
    list.unshift({ ...event, created_at: new Date().toISOString() });
    if (list.length > 200) list.pop();
    localStorage.setItem(LOCAL_BACKUP_EVENTS, JSON.stringify(list));
  } catch (e) { /* ignore */ }
}
