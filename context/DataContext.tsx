/**
 * DataContext - Legacy Context
 * 
 * NOTA: Este contexto está siendo migrado a DashboardDataContext.
 * Para datos de dashboard (clientes, citas, forecast, engagement, loyalty),
 * usar `useDashboardData()` del DashboardDataContext en su lugar.
 * 
 * Este contexto ahora solo maneja:
 * - Servicios (CRUD local)
 * - Campañas de marketing
 * - Datos financieros para gráficos
 * - Notificaciones
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client, Appointment, ServiceItem, Forecast, MarketingCampaign, FinancialDataPoint, NotificationItem } from '../types';
import { MOCK_CLIENTS, MOCK_APPOINTMENTS, MOCK_FINANCIAL_HISTORY, MOCK_CAMPAIGNS } from '../services/mockData';
import { SERVICE_DEFAULTS } from '../constants';
import { dashboard } from '../services/api';

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
  // Updated Service Methods
  addService: (service: ServiceItem) => void;
  updateService: (service: ServiceItem) => void;
  deleteService: (id: number) => void;

  activateCampaign: (campaignId: string) => void;
  markNotificationAsRead: (id: string) => void;

  // Funciones de recarga
  refreshData: () => Promise<void>;

  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<ServiceItem[]>(SERVICE_DEFAULTS);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [financialData, setFinancialData] = useState<FinancialDataPoint[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data - Now with real API calls
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      // Mock data for non-API items (still hardcoded)
      setClients(MOCK_CLIENTS);
      setAppointments(MOCK_APPOINTMENTS);
      setCampaigns(MOCK_CAMPAIGNS);

      // ✅ REAL API CALL for Financial History (Chart Data)
      try {
        const historyData = await dashboard.getFinancialHistory();
        if (historyData && historyData.data && Array.isArray(historyData.data)) {
          setFinancialData(historyData.data);
          console.log('✅ Historial financiero cargado desde API:', historyData.data.length, 'días');
        } else {
          console.warn('⚠️ Financial history sin datos válidos, usando fallback');
          setFinancialData(MOCK_FINANCIAL_HISTORY);
        }
      } catch (error) {
        console.warn('⚠️ Error cargando historial financiero:', error);
        setFinancialData(MOCK_FINANCIAL_HISTORY);
      }

      // ✅ NOTA: Forecast se obtiene principalmente desde DashboardDataContext
      // No hacemos llamada duplicada aquí para evitar race conditions
      // Los componentes deben usar useDashboardData() para obtener forecast
      setForecast({
        projectedRevenue: 0,
        goalRevenue: 15000,
        status: 'on_track',
        suggestion: "Cargando pronóstico...",
        actionLabel: "Ver Agenda"
      });

      // Inicializar notificaciones mock
      setNotifications([
        { id: '1', type: 'ai', title: 'Cliente Recuperado', message: 'Nilah IA convenció a Carla Vega de agendar cita.', time: 'Hace 5 min', read: false },
        { id: '2', type: 'success', title: 'Nueva Reserva', message: 'Valentina Ruiz agendó "Masaje Relajante" via Web.', time: 'Hace 30 min', read: false },
        { id: '3', type: 'warning', title: 'Feedback Negativo', message: 'Lucía Gómez dejó 3 estrellas: "Agua fría".', time: 'Hace 2 horas', read: true },
      ]);

      setIsLoading(false);
    };

    loadData();
  }, []);

  const addAppointment = (apt: Appointment) => {
    setAppointments((prev) => [apt, ...prev]);
    // Simulate notification
    const newNotif: NotificationItem = {
      id: Date.now().toString(),
      type: 'success',
      title: 'Nueva Reserva Manual',
      message: `Se agendó cita para ${apt.nombre_cliente}.`,
      time: 'Ahora mismo',
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const addClient = (client: Client) => {
    setClients((prev) => [client, ...prev]);
  };

  // --- SERVICE MANAGEMENT ---
  const addService = (service: ServiceItem) => {
    setServices((prev) => [...prev, service]);
  };

  const updateService = (updatedService: ServiceItem) => {
    setServices((prev) =>
      prev.map(s => s.id === updatedService.id ? updatedService : s)
    );
  };

  const deleteService = (id: number) => {
    setServices((prev) => prev.filter(s => s.id !== id));
  };

  // --- FUNCIÓN DE RECARGA DE DATOS ---
  // NOTA: Esta función ahora solo recarga datos locales/legacy
  // Para recargar dashboard, usar DashboardDataContext.refresh()
  const refreshData = async () => {
    console.log('🔄 DataContext.refreshData: Nota - usar DashboardDataContext.refresh() para datos del dashboard');

    // Solo recargar historial financiero que es específico de este contexto
    try {
      const historyData = await dashboard.getFinancialHistory();
      if (historyData && historyData.data && Array.isArray(historyData.data)) {
        setFinancialData(historyData.data);
        console.log('✅ Historial financiero recargado:', historyData.data.length, 'días');
      }
    } catch (error) {
      console.warn('⚠️ Error recargando historial financiero:', error);
    }
  };

  // --- THE MAGIC: Link Marketing to Finance ---
  const activateCampaign = (campaignId: string) => {
    // 1. Mark campaign as active
    const campaign = campaigns.find(c => c.id === campaignId);
    setCampaigns(prev => prev.map(c => c.id === campaignId ? { ...c, status: 'Active' } : c));

    // 2. Update Financial Chart to show the Rocket Event TODAY
    if (campaign) {
      setFinancialData(prev => prev.map(point => {
        if (point.day === 'Jue 04') { // Hardcoded for simulation "Today"
          return {
            ...point,
            event: {
              name: campaign.title,
              impact: 25 // Simulated conversion rate
            },
            // Simulate instant revenue bump
            revenue: (point.revenue || 0) + 150
          };
        }
        return point;
      }));

      // Add notification
      const newNotif: NotificationItem = {
        id: Date.now().toString(),
        type: 'ai',
        title: 'Campaña Activada',
        message: `Nilah está enviando mensajes para: ${campaign.title}`,
        time: 'Ahora mismo',
        read: false
      };
      setNotifications(prev => [newNotif, ...prev]);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <DataContext.Provider value={{
      clients,
      appointments,
      services,
      forecast,
      campaigns,
      financialData,
      notifications,
      addAppointment,
      addClient,
      addService,
      updateService,
      deleteService,
      activateCampaign,
      markNotificationAsRead,
      refreshData,
      isLoading
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
