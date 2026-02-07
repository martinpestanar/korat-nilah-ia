/**
 * Marketing Page - Nilah Marketing AI
 * Rediseño con Tabs para máximo valor: Crear, Métricas, Historial, Zonas Muertas
 */

import React, { useState, useEffect } from 'react';
import {
   Sparkles,
   ShieldAlert,
   Rocket,
   TrendingUp,
   Calendar,
   Send,
   CheckCircle,
   Clock,
   ChevronRight,
   FileText,
   Edit3,
   X,
   BarChart3,
   Zap,
   Target,
   Users,
   MessageSquare,
   CalendarDays,
   AlertTriangle,
   ArrowUpRight,
   ArrowRight,
   Copy
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MonthlyCarousel, CampaignBuilderWizard, BusinessBriefWizard, CampaignModeSelector, CampaignBuilderExpress, CampaignBuilderAdvanced } from '../components/Marketing';
import {
   MonthCard as MonthCardType,
   CountryCode,
   GeneratedCampaign,
   SUPPORTED_COUNTRIES,
   WizardMode
} from '../types/campaignBuilderTypes';
import {
   generateMonthCards,
   MONTH_NAMES
} from '../services/campaignMockData';
import { campaigns as campaignsApi, business as businessApi } from '../services/api';
import { useDashboardData } from '../context/DashboardDataContext';

// Types
type TabType = 'crear' | 'metricas' | 'historial' | 'zonas';

// Tipos para datos de API
interface MetricsData {
   ingresoTotal: number;
   totalMensajes: number;
   totalCitas: number;
   conversionPromedio: number;
   cambioVsMesAnterior: number;
   topCampanas: Array<{ nombre: string; ingresos: number; conversion: number; mensajes: number }>;
}

interface ZonaMuerta {
   dia: string;
   hora: string;
   ocupacion: number;
   potencial: number;
}

// Valores por defecto cuando no hay datos
const DEFAULT_METRICS: MetricsData = {
   ingresoTotal: 0,
   totalMensajes: 0,
   totalCitas: 0,
   conversionPromedio: 0,
   cambioVsMesAnterior: 0,
   topCampanas: []
};

const MarketingPage: React.FC = () => {
   const { isAdmin, user } = useAuth();

   // Tabs state
   const [activeTab, setActiveTab] = useState<TabType>('crear');

   // State
   const [currentCountry, setCurrentCountry] = useState<CountryCode>('PE');
   const [monthCards, setMonthCards] = useState<MonthCardType[]>([]);
   const [campaigns, setCampaigns] = useState<GeneratedCampaign[]>([]);
   const [selectedMonth, setSelectedMonth] = useState<MonthCardType | null>(null);
   const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
   const [wizardMode, setWizardMode] = useState<WizardMode | null>(null);
   const [isBriefOpen, setIsBriefOpen] = useState(false);
   const [hasBrief, setHasBrief] = useState(false);
   const [businessId] = useState(() => {
      return localStorage.getItem('korat_business_id') || user?.business_id || `biz-${user?.email?.split('@')[0] || 'demo'}`;
   });
   const [showToast, setShowToast] = useState(false);

   // New states
   const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'scheduled' | 'draft'>('all');
   const [previewCampaign, setPreviewCampaign] = useState<GeneratedCampaign | null>(null);
   const [presetZonaMuerta, setPresetZonaMuerta] = useState<string | null>(null);

   // Data from API
   const [metrics, setMetrics] = useState<MetricsData>(DEFAULT_METRICS);
   const [zonasMuertas, setZonasMuertas] = useState<ZonaMuerta[]>([]);

   // Loading states
   const [loadingCampaigns, setLoadingCampaigns] = useState(true);
   const [loadingMetrics, setLoadingMetrics] = useState(true);
   const [loadingZonas, setLoadingZonas] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Get navigation state (from Dashboard heatmap)
   const location = useLocation();
   const navigationState = location.state as { openWizard?: boolean; presetObjective?: string; zonaMuerta?: string } | null;

   // Filter campaigns
   const filteredCampaigns = campaigns.filter(c =>
      campaignFilter === 'all' || c.status === campaignFilter
   );

   // Check if business has brief on mount (GET /brief)
   useEffect(() => {
      const checkBrief = async () => {
         try {
            const response = await businessApi.getBrief(businessId);
            // El backend devuelve { success: true, brief: { ... } }
            const briefValues = response?.brief || response; // Fallback por si cambia la estructura

            if (briefValues && (briefValues.businessName || briefValues.business_name)) {
               setHasBrief(true);
               // También guardar en localStorage como caché
               localStorage.setItem(`brief_completed_${businessId}`, 'true');
            } else {
               setHasBrief(false);
               setIsBriefOpen(true);
            }
         } catch (err) {
            console.warn('Error checking brief, defaulting to wizard:', err);
            setHasBrief(false);
            setIsBriefOpen(true);
         }
      };

      if (businessId) {
         checkBrief();
      }
   }, [businessId]);

   // Generate month cards when country changes
   useEffect(() => {
      const cards = generateMonthCards(currentCountry);
      setMonthCards(cards);
   }, [currentCountry]);

   // Load campaigns from API
   useEffect(() => {
      const loadCampaigns = async () => {
         try {
            setLoadingCampaigns(true);
            const response = await campaignsApi.getAll(businessId) as any;
            if (response?.success && Array.isArray(response?.campanas)) {
               // Mapear datos de Supabase a formato del frontend
               const mapped = (response.campanas as any[]).map((c: any) => ({
                  id: c.id.toString(),
                  title: c.titulo,
                  message: c.mensaje,
                  status: c.estado === 'activa' ? 'active' : c.estado === 'programada' ? 'scheduled' : 'draft',
                  estimatedReach: c.clientes_objetivo || 0,
                  estimatedRevenue: c.ingreso_estimado || 0,
                  monthCard: { month: c.mes || 1, year: c.anio || 2026 },
                  keyDateName: c.fecha_clave || '',
                  createdAt: c.created_at
               }));
               setCampaigns(mapped);
            }
         } catch (err) {
            console.error('Error loading campaigns:', err);
            setError('Error al cargar campañas');
         } finally {
            setLoadingCampaigns(false);
         }
      };
      loadCampaigns();
   }, [businessId]);

   const { data: dashboardData, calculatedStats, isLoading: isLoadingDashboard, planesMarketing } = useDashboardData();

   // Derived Metrics from Dashboard Data
   useEffect(() => {
      if (calculatedStats) {
         setMetrics({
            ingresoTotal: calculatedStats.ingresos_mes || 0,
            totalMensajes: campaigns.reduce((sum, c) => sum + (c.estimatedReach || 0), 0), // Estimate based on campaigns
            totalCitas: calculatedStats.total_citas || 0, // Using real appointments count
            conversionPromedio: calculatedStats.tasa_cumplimiento || 0, // Using completion rate as proxy
            cambioVsMesAnterior: 12, // Hardcoded for now, or calculate if historical data available
            topCampanas: [] // Kept empty or populate if we have campaign attribution in appointments
         });
      }
   }, [calculatedStats, campaigns]);

   // Calculate Zonas Muertas from Real Appointments (Dashboard Data)
   useEffect(() => {
      if (dashboardData?.citas) {
         const grid: Record<string, Record<number, number>> = {};
         const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];
         const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8-21

         // Initialize
         DAYS.forEach(day => {
            grid[day] = {};
            HOURS.forEach(hour => grid[day][hour] = 0);
         });

         // Fill processed data
         dashboardData.citas.forEach(apt => {
            if (apt.estado === 'Cancelada' || apt.estado === 'No-Show' || !apt.fecha) return;

            // Extract hour and day
            const fechaStr = apt.fecha;
            const horaMatch = fechaStr.match(/T(\d{2}):/);
            const hour = horaMatch ? parseInt(horaMatch[1], 10) : new Date(fechaStr).getHours();

            const date = new Date(fechaStr);
            const dayIndex = date.getUTCDay();
            const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
            const dayName = DAYS[adjustedDayIndex];

            if (grid[dayName] && grid[dayName][hour] !== undefined) {
               grid[dayName][hour] += 1; // Count occupancy count, not price for "dead zone" logic
            }
         });

         // Find Empty Zones (Occupancy < 1)
         const deadZones: ZonaMuerta[] = [];
         DAYS.forEach(day => {
            HOURS.forEach(hour => {
               if (grid[day][hour] === 0) {
                  // Potential revenue calculation (avg ticket S/80)
                  deadZones.push({
                     dia: day,
                     hora: `${hour}:00 - ${hour + 1}:00`,
                     ocupacion: 0,
                     potencial: 80
                  });
               } else if (grid[day][hour] < 2) { // Low occupancy
                  deadZones.push({
                     dia: day,
                     hora: `${hour}:00 - ${hour + 1}:00`,
                     ocupacion: 30, // Approx
                     potencial: 50
                  });
               }
            });
         });

         // Pick top 3 dead zones (prioritizing weekdays)
         const prioritizedZones = deadZones
            .sort((a, b) => b.potencial - a.potencial) // Higher potential first
            .slice(0, 6); // Take top 6

         setZonasMuertas(prioritizedZones);
         setLoadingZonas(false);
      }
   }, [dashboardData]);

   // Handle navigation from Dashboard with zona muerta preset
   useEffect(() => {
      if (navigationState?.openWizard && hasBrief && monthCards.length > 0) {
         setPresetZonaMuerta(navigationState.zonaMuerta || null);
         setSelectedMonth(monthCards[0]);
         setWizardMode('express'); // Ir directo a express desde dashboard
         setActiveTab('crear');
         window.history.replaceState({}, document.title);
      }
   }, [navigationState, hasBrief, monthCards]);

   // Handlers
   const handleSelectMonth = (card: MonthCardType) => {
      setSelectedMonth(card);
      if (hasBrief) {
         setIsModeSelectorOpen(true);
      } else {
         setIsBriefOpen(true);
      }
   };

   const handleSelectMode = (mode: WizardMode) => {
      setWizardMode(mode);
      setIsModeSelectorOpen(false);
   };

   const handleCloseWizard = () => {
      setWizardMode(null);
      setSelectedMonth(null);
   };

   const handleCampaignCreated = (campaign: GeneratedCampaign) => {
      setCampaigns((prev) => [campaign, ...prev]);
      setMonthCards((prev) =>
         prev.map((card) => {
            if (card.month === campaign.monthCard.month && card.year === campaign.monthCard.year) {
               return { ...card, campaignsCreated: card.campaignsCreated + 1 };
            }
            return card;
         })
      );
   };

   const handleChangeCountry = (country: CountryCode) => {
      setCurrentCountry(country);
   };

   const handleBriefComplete = () => {
      localStorage.setItem(`brief_completed_${businessId}`, 'true');
      setHasBrief(true);
      setIsBriefOpen(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
   };

   const handleCreateFromZonaMuerta = (dia: string) => {
      if (monthCards.length > 0) {
         setPresetZonaMuerta(dia);
         setSelectedMonth(monthCards[0]);
         if (hasBrief) {
            setIsModeSelectorOpen(true);
         } else {
            setIsBriefOpen(true);
         }
      }
   };

   const handleSelectWeeklyIdea = (idea: any, card: MonthCardType) => {
      // Pre-cargar el wizard con los datos de la idea seleccionada
      setSelectedMonth({
         ...card,
         // Pre-cargar datos del plan semanal
         preloadedPlan: idea
      } as MonthCardType);
      setWizardMode('express'); // Usar modo express con datos pre-cargados
   };

   // Handle Cancel/Delete Campaign
   const handleDeleteCampaign = async (e: React.MouseEvent, campaignId: string) => {
      e.stopPropagation(); // Prevent opening preview
      if (window.confirm('¿Estás seguro de que deseas eliminar esta campaña?')) {
         try {
            await campaignsApi.delete(parseInt(campaignId));
            setCampaigns(prev => prev.filter(c => c.id !== campaignId));
            setShowToast(true); // Reusing toast for success
         } catch (error) {
            console.error('Error removing campaign:', error);
            setError('Error al eliminar la campaña');
         }
      }
   };

   const countryInfo = SUPPORTED_COUNTRIES[currentCountry];

   // Access denied for non-admin
   if (!isAdmin) {
      return (
         <div className="flex h-[80vh] flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-rose-100 p-4 text-rose-500 dark:bg-rose-900/20">
               <ShieldAlert size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Denegado</h1>
            <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
               La gestión de campañas de marketing está reservada para el administrador.
            </p>
            <Link to="/app" className="mt-6 rounded-lg bg-gray-200 px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-white">
               Volver al Dashboard
            </Link>
         </div>
      );
   }

   // Stats calculation
   const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
   const scheduledCampaigns = campaigns.filter((c) => c.status === 'scheduled').length;
   const totalEstimatedRevenue = campaigns
      .filter((c) => c.status === 'active' || c.status === 'scheduled')
      .reduce((sum, c) => sum + c.estimatedRevenue, 0);

   // Tab definitions
   const tabs = [
      { id: 'crear' as TabType, label: 'Crear Campaña', icon: Rocket },
      { id: 'metricas' as TabType, label: 'Métricas', icon: BarChart3 },
      { id: 'historial' as TabType, label: 'Historial', icon: CalendarDays },
      { id: 'zonas' as TabType, label: 'Zonas Muertas', icon: Zap },
   ];

   return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Header Section */}
         <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 p-6 text-white shadow-xl">
            {/* Decorative elements */}
            <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/4 rounded-full bg-purple-500/30 blur-3xl" />
            <div className="absolute left-1/4 bottom-0 h-48 w-48 translate-y-1/2 rounded-full bg-indigo-500/20 blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
               <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-200 backdrop-blur-md">
                     <Sparkles size={12} />
                     Nilah Marketing AI
                     <span className="px-2 py-0.5 bg-primary text-black rounded-full text-[10px]">
                        {countryInfo.flag} {countryInfo.name}
                     </span>
                  </div>
                  <h1 className="text-2xl font-bold">Marketing Inteligente para tu Negocio</h1>
               </div>

               {/* Quick Stats */}
               <div className="flex gap-3">
                  <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-center">
                     <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Rocket size={14} className="text-primary" />
                        <span className="text-xl font-bold">{activeCampaigns}</span>
                     </div>
                     <p className="text-[10px] text-indigo-200">Activas</p>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-center">
                     <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock size={14} className="text-amber-400" />
                        <span className="text-xl font-bold">{scheduledCampaigns}</span>
                     </div>
                     <p className="text-[10px] text-indigo-200">Programadas</p>
                  </div>
                  <div className="px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-center">
                     <div className="flex items-center justify-center gap-1 mb-0.5">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-xl font-bold">{countryInfo.currencySymbol}{totalEstimatedRevenue.toLocaleString()}</span>
                     </div>
                     <p className="text-[10px] text-indigo-200">Ingresos Est.</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Tabs Navigation */}
         <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-dark-card">
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                     ? 'bg-white dark:bg-dark-bg text-primary shadow-sm'
                     : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                     }`}
               >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
               </button>
            ))}
         </div>

         {/* Tab Content */}
         <div className="min-h-[500px]">
            {/* TAB: CREAR CAMPAÑA */}
            {activeTab === 'crear' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  <MonthlyCarousel
                     cards={monthCards}
                     currentCountry={currentCountry}
                     onSelectMonth={handleSelectMonth}
                     onChangeCountry={handleChangeCountry}
                     onSelectWeeklyIdea={handleSelectWeeklyIdea}
                     businessId={businessId}
                  />

                  {/* Quick action */}
                  {campaigns.length > 0 && (
                     <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                 <Send size={18} className="text-primary" />
                              </div>
                              <div>
                                 <p className="font-bold text-gray-900 dark:text-white">Última campaña</p>
                                 <p className="text-sm text-gray-500">{campaigns[0].title}</p>
                              </div>
                           </div>
                           <button
                              onClick={() => setPreviewCampaign(campaigns[0])}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-bg text-sm font-medium hover:bg-gray-200 dark:hover:bg-dark-card transition-colors"
                           >
                              Ver mensaje
                              <ChevronRight size={16} />
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* TAB: MÉTRICAS */}
            {activeTab === 'metricas' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white">
                        <div className="flex items-center gap-2 mb-2">
                           <TrendingUp size={18} />
                           <span className="text-sm font-medium opacity-90">Ingresos Totales</span>
                        </div>
                        <p className="text-3xl font-bold">{countryInfo.currencySymbol}{metrics.ingresoTotal.toLocaleString()}</p>
                        <p className="text-xs mt-1 flex items-center gap-1 text-emerald-200">
                           <ArrowUpRight size={12} />
                           +{metrics.cambioVsMesAnterior}% vs mes anterior
                        </p>
                     </div>

                     <div className="rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5">
                        <div className="flex items-center gap-2 mb-2 text-gray-500">
                           <MessageSquare size={18} />
                           <span className="text-sm font-medium">Mensajes Enviados</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalMensajes}</p>
                        <p className="text-xs text-gray-400 mt-1">campañas activas</p>
                     </div>

                     <div className="rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5">
                        <div className="flex items-center gap-2 mb-2 text-gray-500">
                           <Calendar size={18} />
                           <span className="text-sm font-medium">Citas Generadas</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalCitas}</p>
                        <p className="text-xs text-gray-400 mt-1">desde campañas</p>
                     </div>

                     <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white">
                        <div className="flex items-center gap-2 mb-2">
                           <Target size={18} />
                           <span className="text-sm font-medium opacity-90">Conversión</span>
                        </div>
                        <p className="text-3xl font-bold">{metrics.conversionPromedio}%</p>
                        <p className="text-xs mt-1 text-indigo-200">promedio de campañas</p>
                     </div>
                  </div>

                  {/* Top Campaigns */}
                  <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card overflow-hidden">
                     <div className="p-4 border-b border-gray-100 dark:border-dark-border">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                           🏆 Top 3 Campañas por Ingresos
                        </h3>
                     </div>
                     <div className="divide-y divide-gray-100 dark:divide-dark-border">
                        {metrics.topCampanas.map((camp, index) => (
                           <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors">
                              <div className="flex items-center gap-4">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-gray-100 text-gray-600' :
                                       'bg-amber-100 text-amber-700'
                                    }`}>
                                    {index + 1}
                                 </div>
                                 <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{camp.nombre}</p>
                                    <p className="text-xs text-gray-500">{camp.mensajes} mensajes enviados</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {countryInfo.currencySymbol}{camp.ingresos.toLocaleString()}
                                 </p>
                                 <p className="text-xs text-gray-500">{camp.conversion}% conversión</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* AI Insight */}
                  <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 p-5">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0">
                           <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white mb-1">💡 Insight de Nilah</p>
                           <p className="text-sm text-gray-600 dark:text-gray-300">
                              Tus campañas de <strong>fechas especiales</strong> tienen 2.5x mejor conversión que las regulares.
                              Te recomiendo crear una campaña para el próximo <strong>Día de la Madre</strong>.
                           </p>
                           <button
                              onClick={() => setActiveTab('crear')}
                              className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                           >
                              Crear campaña ahora
                              <ArrowRight size={14} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* TAB: HISTORIAL */}
            {activeTab === 'historial' && (
               <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Filters */}
                  <div className="flex items-center justify-between">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Send size={20} className="text-primary" />
                        Todas tus Campañas
                        <span className="text-sm font-normal text-gray-500">({campaigns.length})</span>
                     </h3>
                     <select
                        value={campaignFilter}
                        onChange={(e) => setCampaignFilter(e.target.value as any)}
                        className="rounded-lg bg-white dark:bg-dark-card px-3 py-2 text-sm border border-gray-200 dark:border-dark-border"
                     >
                        <option value="all">Todas</option>
                        <option value="active">Activas</option>
                        <option value="scheduled">Programadas</option>
                        <option value="draft">Borradores</option>
                     </select>
                  </div>


                  {/* Campaign Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {filteredCampaigns.map((campaign) => (
                        <div
                           key={campaign.id}
                           onClick={() => setPreviewCampaign(campaign)}
                           className={`relative p-5 rounded-xl border transition-all hover:shadow-lg cursor-pointer ${campaign.status === 'active'
                              ? 'border-primary bg-primary/5'
                              : campaign.status === 'scheduled'
                                 ? 'border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/5'
                                 : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card'
                              }`}
                        >
                           {/* Status Badge */}
                           <div className="absolute -top-2.5 right-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${campaign.status === 'active'
                                 ? 'bg-primary text-black'
                                 : campaign.status === 'scheduled'
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                 }`}>
                                 {campaign.status === 'active' && <CheckCircle size={10} />}
                                 {campaign.status === 'scheduled' && <Clock size={10} />}
                                 {campaign.status === 'active' ? 'Activa' : campaign.status === 'scheduled' ? 'Programada' : 'Borrador'}
                              </span>
                           </div>

                           <div className="mb-3">
                              <h4 className="font-bold text-gray-900 dark:text-white">{campaign.title}</h4>
                              <p className="text-xs text-gray-500">
                                 {MONTH_NAMES[campaign.monthCard.month]} {campaign.monthCard.year}
                                 {campaign.keyDateName && ` · ${campaign.keyDateName}`}
                              </p>
                           </div>

                           <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-4">
                              {campaign.message}
                           </p>

                           <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-dark-border">
                              <div className="flex items-center gap-4">
                                 <div>
                                    <p className="text-xs text-gray-400">Alcance</p>
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{campaign.estimatedReach}</p>
                                 </div>
                                 <div>
                                    <p className="text-xs text-gray-400">Ingreso</p>
                                    <p className="text-sm font-bold text-emerald-600">{countryInfo.currencySymbol}{campaign.estimatedRevenue}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-2">
                                 <button
                                    onClick={(e) => handleDeleteCampaign(e, campaign.id)}
                                    className="p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Eliminar campaña"
                                 >
                                    <X size={16} />
                                 </button>
                                 <ChevronRight size={18} className="text-gray-400" />
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>

                  {filteredCampaigns.length === 0 && (
                     <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-dark-card flex items-center justify-center mb-4">
                           <Send size={24} className="text-gray-400" />
                        </div>
                        <p className="text-gray-500">No hay campañas con este filtro</p>
                     </div>
                  )}

                  {/* WEEKLY SUGGESTIONS FROM DASHBOARD CONTEXT */}
                  {planesMarketing && planesMarketing.length > 0 && campaignFilter === 'all' && (
                     <div className="mt-8 border-t border-gray-100 dark:border-dark-border pt-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                           <Sparkles size={18} className="text-purple-500" />
                           Ideas Semanales Sugeridas (Nilah)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           {planesMarketing.map((plan, i) => (
                              <div key={i} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30">
                                 <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{plan.titulo}</h4>
                                 <p className="text-xs text-gray-500 mb-2">{plan.objetivo}</p>
                                 <button
                                    onClick={() => {
                                       /* Logic to prefill wizard with this plan */
                                       if (monthCards.length > 0) {
                                          handleSelectWeeklyIdea(plan, monthCards[0]);
                                          setActiveTab('crear');
                                       }
                                    }}
                                    className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
                                 >
                                    Usar esta idea <ArrowRight size={12} />
                                 </button>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>
            )}

            {/* TAB: ZONAS MUERTAS */}
            {activeTab === 'zonas' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Alert Banner */}
                  <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 p-5">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
                           <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white mb-1">
                              ⚠️ Detectamos {zonasMuertas.length} días con baja ocupación
                           </p>
                           <p className="text-sm text-gray-600 dark:text-gray-300">
                              Estos horarios tienen menos del 50% de ocupación. Una campaña de WhatsApp podría generar hasta <strong>{countryInfo.currencySymbol}{zonasMuertas.reduce((sum, z) => sum + z.potencial, 0).toLocaleString()}</strong> adicionales por semana.
                           </p>
                        </div>
                     </div>
                  </div>

                  {/* Zonas Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {zonasMuertas.map((zona, index) => (
                        <div key={index} className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5">
                           <div className="flex items-center justify-between mb-4">
                              <div>
                                 <p className="font-bold text-gray-900 dark:text-white text-lg">{zona.dia}</p>
                                 <p className="text-sm text-gray-500">{zona.hora}</p>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${zona.ocupacion < 30 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                 }`}>
                                 {zona.ocupacion}%
                              </div>
                           </div>

                           {/* Progress bar */}
                           <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-dark-bg mb-4">
                              <div
                                 className={`h-full rounded-full ${zona.ocupacion < 30 ? 'bg-red-500' : 'bg-amber-500'
                                    }`}
                                 style={{ width: `${zona.ocupacion}%` }}
                              />
                           </div>

                           <div className="flex items-center justify-between">
                              <div>
                                 <p className="text-xs text-gray-500">Potencial</p>
                                 <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                    +{countryInfo.currencySymbol}{zona.potencial}
                                 </p>
                              </div>
                              <button
                                 onClick={() => handleCreateFromZonaMuerta(zona.dia)}
                                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-black text-sm font-bold hover:bg-primary-dark transition-colors"
                              >
                                 <Zap size={14} />
                                 Crear Promo
                              </button>
                           </div>
                        </div>
                     ))}
                  </div>

                  {/* AI Suggestion */}
                  <div className="rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800 p-5">
                     <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0">
                           <Sparkles size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                           <p className="font-bold text-gray-900 dark:text-white mb-1">🤖 Nilah sugiere:</p>
                           <p className="text-sm text-gray-600 dark:text-gray-300">
                              "Un <strong>Martes de 20% OFF</strong> podría generar {countryInfo.currencySymbol}800-1,200 adicionales por semana.
                              Tus clientas responden mejor a promociones de <strong>última hora</strong>."
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Campaign Mode Selector */}
         {selectedMonth && (
            <CampaignModeSelector
               isOpen={isModeSelectorOpen}
               onClose={() => {
                  setIsModeSelectorOpen(false);
                  setSelectedMonth(null);
               }}
               onSelectMode={handleSelectMode}
               monthName={MONTH_NAMES[selectedMonth.month]}
               year={selectedMonth.year}
            />
         )}

         {/* Campaign Builder Express */}
         {selectedMonth && wizardMode === 'express' && (
            <CampaignBuilderExpress
               isOpen={true}
               onClose={handleCloseWizard}
               monthCard={selectedMonth}
               currencySymbol={countryInfo.currencySymbol}
               onCampaignCreated={(campaign) => {
                  handleCampaignCreated(campaign);
                  handleCloseWizard();
               }}
            />
         )}

         {/* Campaign Builder Advanced */}
         {selectedMonth && wizardMode === 'advanced' && (
            <CampaignBuilderAdvanced
               isOpen={true}
               onClose={handleCloseWizard}
               monthCard={selectedMonth}
               currencySymbol={countryInfo.currencySymbol}
               onCampaignCreated={(campaign) => {
                  handleCampaignCreated(campaign);
                  handleCloseWizard();
               }}
            />
         )}

         {/* Business Brief Wizard Modal */}
         <BusinessBriefWizard
            isOpen={isBriefOpen}
            onClose={() => setIsBriefOpen(false)}
            onComplete={handleBriefComplete}
            businessId={businessId}
         />

         {/* Brief Badge */}
         {hasBrief && (
            <div className="fixed bottom-6 right-6 z-40">
               <button
                  onClick={() => setIsBriefOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all text-sm font-medium"
               >
                  <CheckCircle size={16} />
                  Brief
                  <Edit3 size={14} className="opacity-70" />
               </button>
            </div>
         )}

         {/* Success Toast */}
         {showToast && (
            <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
               <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-dark-card border border-primary shadow-lg">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                     <CheckCircle className="text-primary" size={20} />
                  </div>
                  <div>
                     <p className="font-bold text-white text-sm">¡Brief guardado!</p>
                     <p className="text-xs text-gray-400">Nilah ahora conoce tu negocio 🎉</p>
                  </div>
                  <button onClick={() => setShowToast(false)} className="ml-2 p-1 hover:bg-white/10 rounded-lg">
                     <X size={16} className="text-gray-400" />
                  </button>
               </div>
            </div>
         )}

         {/* WhatsApp Preview Modal */}
         {previewCampaign && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
               <div className="w-full max-w-md bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border bg-green-600">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                           <span className="text-xl">💬</span>
                        </div>
                        <div>
                           <h3 className="font-bold text-white">{previewCampaign.title}</h3>
                           <p className="text-xs text-green-100">Vista previa del mensaje</p>
                        </div>
                     </div>
                     <button onClick={() => setPreviewCampaign(null)} className="p-2 rounded-lg hover:bg-white/10">
                        <X size={20} className="text-white" />
                     </button>
                  </div>

                  {/* WhatsApp Chat Preview */}
                  <div className="p-4 bg-[#e5ddd5] dark:bg-[#0b141a] min-h-[300px]">
                     <div className="max-w-[85%] bg-white dark:bg-[#005c4b] rounded-lg p-3 shadow">
                        <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                           {previewCampaign.message}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-300 text-right mt-2">
                           10:30 AM ✓✓
                        </p>
                     </div>
                  </div>

                  {/* Campaign Stats */}
                  <div className="p-4 border-t border-gray-100 dark:border-dark-border">
                     <div className="flex items-center justify-between mb-4">
                        <div className="text-center">
                           <p className="text-xs text-gray-400">Alcance</p>
                           <p className="font-bold text-gray-900 dark:text-white">{previewCampaign.estimatedReach}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-xs text-gray-400">Ingreso Est.</p>
                           <p className="font-bold text-emerald-600">{countryInfo.currencySymbol}{previewCampaign.estimatedRevenue}</p>
                        </div>
                        <div className="text-center">
                           <p className="text-xs text-gray-400">Estado</p>
                           <p className={`font-bold ${previewCampaign.status === 'active' ? 'text-primary' : 'text-amber-500'}`}>
                              {previewCampaign.status === 'active' ? 'Activa' : previewCampaign.status === 'scheduled' ? 'Programada' : 'Borrador'}
                           </p>
                        </div>
                     </div>
                     <button
                        onClick={() => {
                           navigator.clipboard.writeText(previewCampaign.message);
                           setPreviewCampaign(null);
                        }}
                        className="w-full py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                     >
                        <Copy size={16} />
                        Copiar Mensaje
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

export default MarketingPage;
