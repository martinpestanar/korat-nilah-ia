/**
 * DataContext
 *
 * Maneja:
 * - Servicios (CRUD local)
 * - Campañas de marketing
 * - Datos financieros para gráficos
 * - Notificaciones REALES desde Supabase (con Realtime + PWA browser alerts)
 */

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Client, Appointment, ServiceItem, Forecast, MarketingCampaign, FinancialDataPoint, NotificationItem } from '../types';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS, MOCK_FINANCIAL_HISTORY, MOCK_CAMPAIGNS } from '../services/mockData';
import { SERVICE_DEFAULTS } from '../constants';
import { dashboard } from '../services/api';
import { supabase } from '../services/supabase';
import { useAuth } from './AuthContext';

interface DataContextType {
  clients: Client[];
  appointments: Appointment[];
  services: ServiceItem[];
  forecast: Forecast | null;
  campaigns: MarketingCampaign[];
  financialData: FinancialDataPoint[];
  notifications: NotificationItem[];

  addAppointment: (apt: Appointment) => void;
  addClient: (client: Client) => void;
  addService: (service: ServiceItem) => void;
  updateService: (service: ServiceItem) => void;
  deleteService: (id: number) => void;

  activateCampaign: (campaignId: string) => void;
  markNotificationAsRead: (id: string) => Promise<void>;

  refreshData: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Helper: formato relativo de tiempo ──────────────────────────────────────
const formatRelativeTime = (isoString: string): string => {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMin < 1) return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffHrs < 24) return `Hace ${diffHrs} hora${diffHrs > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
  return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
};

// ─── Helper: dispara alerta nativa del navegador / PWA ───────────────────────
const triggerBrowserNotification = (notif: NotificationItem) => {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const icons: Record<string, string> = {
    ai:      '🤖',
    success: '✅',
    warning: '⚠️',
    info:    'ℹ️',
  };

  const emoji = (notif as any).emoji || icons[notif.type] || '🔔';

  try {
    // Intentar via Service Worker (funciona en background / móvil)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(`${emoji} ${notif.title}`, {
          body:  notif.message,
          icon:  '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag:   notif.id,
          data:  { url: (notif as any).action_url || '/#/nilah/app' },
        });
      });
    } else {
      // Fallback: Notification API directa
      new Notification(`${emoji} ${notif.title}`, {
        body: notif.message,
        icon: '/pwa-192x192.png',
        tag:  notif.id,
      });
    }
  } catch {
    // Ignorar errores silenciosamente
  }
};

// ─── Helper: mapear fila de BD a NotificationItem ────────────────────────────
const mapRow = (row: any): NotificationItem => ({
  id:      row.id,
  type:    row.type as NotificationItem['type'],
  title:   row.title,
  message: row.message,
  time:    formatRelativeTime(row.created_at),
  read:    row.read,
  // campos extra que pasamos
  ...(row.emoji       && { emoji:      row.emoji }),
  ...(row.action_url  && { action_url: row.action_url }),
  ...(row.created_at  && { created_at: row.created_at }),
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients]           = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices]         = useState<ServiceItem[]>(SERVICE_DEFAULTS);
  const [forecast, setForecast]         = useState<Forecast | null>(null);
  const [campaigns, setCampaigns]       = useState<MarketingCampaign[]>([]);
  const [financialData, setFinancialData] = useState<FinancialDataPoint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading]       = useState(true);
  
  const { isDemoMode } = useAuth();

  // Ref para el canal Realtime (evita múltiples suscripciones)
  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  // Ref del business_id actual (para el canal Realtime)
  const businessIdRef = useRef<string | null>(null);

  // ── Cargar notificaciones reales desde Supabase ──────────────────────────
  const loadNotifications = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from('notificaciones')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      if (data && data.length > 0) {
        setNotifications(data.map(mapRow));
      }
    } catch (err) {
      console.warn('⚠️ No se pudieron cargar notificaciones reales:', err);
    }
  };

  // ── Suscripción Realtime ─────────────────────────────────────────────────
  const subscribeRealtime = (businessId: string) => {
    // Limpiar canal previo
    if (realtimeRef.current) {
      supabase.removeChannel(realtimeRef.current).catch(() => {});
      realtimeRef.current = null;
    }

    const channel = supabase
      .channel(`notificaciones:${businessId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notificaciones',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const newNotif = mapRow(payload.new);

          // Agregar al principio de la lista
          setNotifications(prev => [newNotif, ...prev]);

          // 🔔 Disparar alerta nativa (PWA / navegador)
          triggerBrowserNotification(newNotif);
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'notificaciones',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          // Sincronizar actualizaciones (ej. marcar como leído desde otro dispositivo)
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? mapRow(payload.new) : n)
          );
        }
      )
      .subscribe();

    realtimeRef.current = channel;
  };

  // ── Obtener business_id del usuario autenticado ──────────────────────────
  const fetchBusinessId = async (): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('Usuarios')
        .select('business_id')
        .eq('auth_uid', user.id)
        .single();

      return data?.business_id ?? null;
    } catch {
      return null;
    }
  };

  // ── Carga inicial de datos ───────────────────────────────────────────────
  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      setIsLoading(true);

      // Datos locales (legacy / mock por ahora)
      setClients(MOCK_CLIENTS);
      setAppointments(MOCK_APPOINTMENTS);
      setCampaigns(MOCK_CAMPAIGNS);

      // Historial financiero real
      try {
        const historyData = await dashboard.getFinancialHistory();
        if (ignore) return;
        if (historyData?.data && Array.isArray(historyData.data)) {
          setFinancialData(historyData.data);
        } else {
          setFinancialData(MOCK_FINANCIAL_HISTORY);
        }
      } catch {
        if (!ignore) setFinancialData(MOCK_FINANCIAL_HISTORY);
      }

      if (ignore) return;

      setForecast({
        projectedRevenue: 0,
        goalRevenue: 15000,
        status: 'on_track',
        suggestion: 'Cargando pronóstico...',
        actionLabel: 'Ver Agenda',
      });

      // 🔑 Notificaciones reales
      const businessId = await fetchBusinessId();
      if (ignore) return;

      if (isDemoMode) {
        setNotifications([{
          id: 'demo-notif-1',
          type: 'success',
          title: 'Demo iniciada',
          message: 'Explora métricas y funcionalidades en tiempo real.',
          time: 'Ahora',
          read: false,
          emoji: '✨'
        }]);
      } else if (businessId) {
        businessIdRef.current = businessId;
        await loadNotifications(businessId);
        if (!ignore) subscribeRealtime(businessId);
      } else {
        setNotifications([]);
      }

      if (!ignore) setIsLoading(false);
    };

    loadData();

    // Cleanup al desmontar
    return () => {
      ignore = true;
      if (realtimeRef.current) {
        supabase.removeChannel(realtimeRef.current).catch(() => {});
        realtimeRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);

  // ── CRUD de citas y clientes ─────────────────────────────────────────────
  const addAppointment = (apt: Appointment) => {
    setAppointments(prev => [apt, ...prev]);
    // La notificación real la insertará n8n en la tabla notificaciones
    // Este es solo un optimistic update local para la UI inmediata:
    const tempNotif: NotificationItem = {
      id: `local-${Date.now()}`,
      type: 'success',
      title: 'Nueva Reserva Manual',
      message: `Se agendó cita para ${apt.nombre_cliente}.`,
      time: 'Ahora mismo',
      read: false,
    };
    setNotifications(prev => [tempNotif, ...prev]);
  };

  const addClient = (client: Client) => {
    setClients(prev => [client, ...prev]);
  };

  // ── Servicios ────────────────────────────────────────────────────────────
  const addService = (service: ServiceItem) => setServices(prev => [...prev, service]);
  const updateService = (s: ServiceItem) => setServices(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteService = (id: number) => setServices(prev => prev.filter(s => s.id !== id));

  // ── Campañas ─────────────────────────────────────────────────────────────
  const activateCampaign = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'Active' } : c));

    if (campaign) {
      setFinancialData(prev => prev.map(point => {
        if (point.day === 'Jue 04') {
          return { ...point, event: { name: campaign.title, impact: 25 }, revenue: (point.revenue || 0) + 150 };
        }
        return point;
      }));

      // Notif local optimista (n8n también insertará la real)
      const tempNotif: NotificationItem = {
        id: `local-${Date.now()}`,
        type: 'ai',
        title: '🚀 Campaña Activada',
        message: `Nilah está enviando mensajes para: ${campaign.title}`,
        time: 'Ahora mismo',
        read: false,
      };
      setNotifications(prev => [tempNotif, ...prev]);
    }
  };

  // ── Marcar como leída (persiste en BD) ───────────────────────────────────
  const markNotificationAsRead = async (id: string) => {
    // Optimistic update inmediato en UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

    // Persistir en base de datos (omitir IDs temporales locales)
    if (!isDemoMode && !id.startsWith('local-') && !id.startsWith('demo-')) {
      try {
        await supabase
          .from('notificaciones')
          .update({ read: true })
          .eq('id', id);
      } catch (err) {
        console.warn('⚠️ Error marcando notificación como leída:', err);
      }
    }
  };

  // ── Recarga manual ───────────────────────────────────────────────────────
  const refreshData = async () => {
    try {
      const historyData = await dashboard.getFinancialHistory();
      if (historyData?.data && Array.isArray(historyData.data)) {
        setFinancialData(historyData.data);
      }
    } catch {
      // silencioso
    }

    // Refrescar notificaciones también
    if (businessIdRef.current) {
      await loadNotifications(businessIdRef.current);
    }
  };

  return (
    <DataContext.Provider value={{
      clients, appointments, services, forecast, campaigns,
      financialData, notifications,
      addAppointment, addClient,
      addService, updateService, deleteService,
      activateCampaign, markNotificationAsRead,
      refreshData, isLoading,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
