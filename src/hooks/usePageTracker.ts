import { useEffect, useRef, useCallback } from 'react';
import {
  initAnalyticsSession,
  trackAnalyticsEvent,
  sendSessionHeartbeat,
} from '../services/analyticsService';

interface UsePageTrackerOptions {
  pagePath?: string;
  heartbeatIntervalMs?: number;
}

export function usePageTracker({
  pagePath = '/soluciones',
  heartbeatIntervalMs = 8000,
}: UsePageTrackerOptions = {}) {
  const startTimeRef = useRef<number>(Date.now());
  const totalActiveSecondsRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const maxScrollPercentRef = useRef<number>(0);
  const reportedScrollMilestonesRef = useRef<Set<number>>(new Set());

  // Helper para calcular porcentaje de scroll
  const calculateScrollPercent = useCallback((): number => {
    if (typeof window === 'undefined') return 0;
    const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const windowHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    const docHeight = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.offsetHeight
    );
    const scrollable = docHeight - windowHeight;
    if (scrollable <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((scrollTop / scrollable) * 100)));
  }, []);

  // Helper para registrar clics
  const trackClick = useCallback((
    targetId: string,
    targetLabel: string,
    category: string = 'cta',
    metadata?: Record<string, any>
  ) => {
    trackAnalyticsEvent({
      event_type: 'click_' + (category === 'whatsapp' ? 'whatsapp' : category === 'freemium' ? 'freemium' : 'solucion'),
      target_id: targetId,
      target_label: targetLabel,
      category,
      metadata: {
        ...metadata,
        scroll_at_click: maxScrollPercentRef.current,
        time_at_click: totalActiveSecondsRef.current,
      },
    });
  }, []);

  // Helper para eventos genéricos
  const trackCustomEvent = useCallback((
    eventType: string,
    targetId?: string,
    targetLabel?: string,
    category?: string,
    metadata?: Record<string, any>
  ) => {
    trackAnalyticsEvent({
      event_type: eventType,
      target_id: targetId,
      target_label: targetLabel,
      category,
      metadata: {
        ...metadata,
        scroll_at_event: maxScrollPercentRef.current,
        time_at_event: totalActiveSecondsRef.current,
      },
    });
  }, []);

  useEffect(() => {
    // 1. Inicializar sesión
    initAnalyticsSession(pagePath);
    startTimeRef.current = Date.now();

    // 2. Listener de Scroll
    const handleScroll = () => {
      const currentScroll = calculateScrollPercent();
      if (currentScroll > maxScrollPercentRef.current) {
        maxScrollPercentRef.current = currentScroll;
      }

      // Hitos de scroll (25, 50, 75, 90, 100)
      const milestones = [25, 50, 75, 90, 100];
      for (const m of milestones) {
        if (currentScroll >= m && !reportedScrollMilestonesRef.current.has(m)) {
          reportedScrollMilestonesRef.current.add(m);
          trackAnalyticsEvent({
            event_type: 'scroll_depth',
            target_id: `scroll_${m}`,
            target_label: `Scroll alcanzado ${m}%`,
            category: 'engagement',
            metadata: { milestone: m, duration_so_far: totalActiveSecondsRef.current },
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // 3. Listener de Visibilidad (Pausar timer si minimizan o cambian de app)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isVisibleRef.current = false;
        // Enviar heartbeat al ocultar
        sendSessionHeartbeat(totalActiveSecondsRef.current, maxScrollPercentRef.current);
      } else {
        isVisibleRef.current = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Temporizador de permanencia y Heartbeat periódico
    const timerInterval = setInterval(() => {
      if (isVisibleRef.current) {
        totalActiveSecondsRef.current += 1;
      }
    }, 1000);

    const heartbeatInterval = setInterval(() => {
      if (totalActiveSecondsRef.current > 0) {
        sendSessionHeartbeat(totalActiveSecondsRef.current, maxScrollPercentRef.current);
      }
    }, heartbeatIntervalMs);

    // 5. Listener de salida (beforeunload / pagehide)
    const handleUnload = () => {
      sendSessionHeartbeat(totalActiveSecondsRef.current, maxScrollPercentRef.current);
    };

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

    return () => {
      clearInterval(timerInterval);
      clearInterval(heartbeatInterval);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
      sendSessionHeartbeat(totalActiveSecondsRef.current, maxScrollPercentRef.current);
    };
  }, [pagePath, heartbeatIntervalMs, calculateScrollPercent]);

  return {
    trackClick,
    trackCustomEvent,
  };
}
