/**
 * Marketing Page - Nilah Marketing AI
 * Rediseño con Tabs para máximo valor: Crear, Métricas, Historial, Zonas Muertas
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
   Calendar,
   Settings,
   TrendingUp,
   Users,
   Zap,
   ChevronRight,
   Plus,
   ArrowRight,
   Sparkles,
   AlertTriangle,
   Send,
   Edit3,
   CheckCircle2,
   X,
   Copy,
   CheckCircle,
   Clock,
   FileText,
   MessageSquare,
   CalendarDays,
   ShieldAlert,
   Rocket,
   BarChart3,
   Target,
   ArrowUpRight
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { business as businessApi, campaigns as campaignsApi } from '../services/api';

import {
   MonthlyCarousel,
   CampaignBuilderWizard,
   BusinessBriefWizard,
   CampaignModeSelector,
   CampaignBuilderExpress,
   CampaignBuilderAdvanced
} from '../components/Marketing';
import CampaignDetailsModal from '../components/Marketing/CampaignDetailsModal';
import WeeklyCampaignCard from '../components/Marketing/WeeklyCampaignCard';
import MarketingOpportunities from '../components/Marketing/MarketingOpportunities';
import OracleCard from '../components/Dashboard/OracleCard';

// Types
import {
   MonthCard as MonthCardType,
   GeneratedCampaign,
   WizardMode,
   CountryCode,
   SUPPORTED_COUNTRIES
} from '../types/campaignBuilderTypes';
import { generateMonthCards } from '../services/campaignMockData';

// Tipos para datos de API
const MONTH_NAMES = [
   'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
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

// Segmentation data from SQL view
interface SegmentData {
   vip: number;
   recuperar: number;
   nuevo: number;
   recurrente: number;
   interes_unas: number;
   interes_pestanas: number;
   interes_cabello: number;
   total: number;
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
   type TabType = 'crear' | 'historial' | 'metricas' | 'zonas';
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
   const [toastState, setToastState] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

   // New states
   const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'scheduled' | 'draft'>('all');
   const [previewCampaign, setPreviewCampaign] = useState<GeneratedCampaign | null>(null);
   const [detailsCampaign, setDetailsCampaign] = useState<GeneratedCampaign | null>(null);
   const [presetZonaMuerta, setPresetZonaMuerta] = useState<string | null>(null);

   // Sending progress state (Phase 2)
   const [sendingState, setSendingState] = useState<{ isSending: boolean; campaignTitle: string; total: number; estimatedMinutes: number }>({
      isSending: false, campaignTitle: '', total: 0, estimatedMinutes: 0
   });

   // Data from API
   const [metrics, setMetrics] = useState<MetricsData>(DEFAULT_METRICS);
   const [zonasMuertas, setZonasMuertas] = useState<ZonaMuerta[]>([]);

   // Loading states
   const [loadingCampaigns, setLoadingCampaigns] = useState(true);
   const [loadingMetrics, setLoadingMetrics] = useState(true);
   const [loadingZonas, setLoadingZonas] = useState(true);
   const [error, setError] = useState<string | null>(null);

   // Segmentation state (from clientes_segmentados view)
   const [segments, setSegments] = useState<SegmentData>({
      vip: 0, recuperar: 0, nuevo: 0, recurrente: 0,
      interes_unas: 0, interes_pestanas: 0, interes_cabello: 0, total: 0
   });
   const [loadingSegments, setLoadingSegments] = useState(true);
   const [preselectedSegment, setPreselectedSegment] = useState<string | null>(null);

   // Get navigation state (from Dashboard heatmap)
   const navigate = useNavigate();
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
               localStorage.setItem(`brief_completed_${businessId}`, 'true');
            } else {
               setHasBrief(false);
               // Removed auto-open: setIsBriefOpen(true);
            }
         } catch (err) {
            console.warn('Error checking brief:', err);
            setHasBrief(false);
            // Removed auto-open: setIsBriefOpen(true);
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

            // Validación de respuesta corrupta (Bug n8n)
            if (typeof response?.campanas === 'string' && response.campanas.includes('[object Object]')) {
               console.error('CRITICAL: La API retornó un string corrupto en lugar de JSON.', response.campanas);
               setError('Error de configuración en n8n: El campo "campanas" se devuelve como texto y no como JSON.');
               return;
            }

            if (response?.success && Array.isArray(response?.campanas)) {
               // Mapear datos de Supabase a formato del frontend
               const mapped = (response.campanas as any[]).map((c: any) => ({
                  id: c.id?.toString() || Math.random().toString(),
                  title: c.titulo,
                  message: c.mensaje,
                  status: c.estado === 'activa' ? 'active' : c.estado === 'programada' ? 'scheduled' : c.estado === 'enviada' ? 'enviada' : c.estado === 'borrador' ? 'draft' : 'draft',
                  estimatedReach: c.clientes_objetivo || 0,
                  estimatedRevenue: parseFloat(c.ingreso_estimado) || 0,
                  monthCard: { month: c.mes || 1, year: c.anio || 2026 },
                  keyDateName: c.fecha_clave || '',
                  createdAt: c.created_at,
                  // Métricas reales
                  mensajesEnviados: c.mensajes_enviados || 0,
                  ingresoReal: parseFloat(c.ingreso_real) || 0,
                  citasGeneradas: c.citas_generadas || 0,
                  // Campos extendidos para Detalle de Campaña
                  aiImageIdea: c.idea_imagen,
                  aiVideoIdea: c.idea_video,
                  aiTipsWhatsApp: c.tips_whatsapp,
                  koratFlowTip: c.koratflow_tip || '',
                  choices: {
                     objective: c.objetivo,
                     segment: c.segmento,
                     promo: c.tipo_promo,
                     emotionalTrigger: c.disparador_emocional,
                     tone: c.tono || 'amigable'
                  }
               }));
               setCampaigns(mapped);
            } else if (response?.success === false) {
               setError(response.message || 'Error al cargar campañas');
            }
         } catch (err) {
            console.error('Error loading campaigns:', err);
            setError('Error de conexión con el servidor');
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
            cambioVsMesAnterior: 0, // TODO: Calculate from historical data when available
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
         // Safety check for citas
         (dashboardData.citas || []).forEach(apt => {
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

         console.log('📊 Zonas Muertas Logic:', {
            citasCount: dashboardData.citas.length,
            deadZonesFound: deadZones.length,
            prioritized: prioritizedZones.length
         });

         setZonasMuertas(prioritizedZones);
         setLoadingZonas(false);
      } else if (dashboardData) {
         console.log('⚠️ Marketing: Dashboard data loaded but citas property is missing/null');
         setLoadingZonas(false);
      }
   }, [dashboardData]);

   // Load segment data (from clientes_segmentados view via GET /campanas)
   useEffect(() => {
      const loadSegments = async () => {
         try {
            setLoadingSegments(true);
            // Use the new getDashboard method that returns segments
            const response = await campaignsApi.getDashboard(businessId);
            if (response?.segments) {
               setSegments(response.segments);
            }
         } catch (err) {
            console.warn('Error loading segments:', err);
            // Keep default empty segments on error
         } finally {
            setLoadingSegments(false);
         }
      };
      if (businessId) {
         loadSegments();
      }
   }, [businessId]);

   // Handler for creating campaign from segment opportunity card
   const handleCreateFromSegment = (segmentId: string, segmentName: string) => {
      setPreselectedSegment(segmentId);
      // Open the wizard with the first month card
      if (monthCards.length > 0) {
         setSelectedMonth(monthCards[0]);
         if (hasBrief) {
            setWizardMode('express'); // Go directly to express mode
         } else {
            setIsBriefOpen(true);
         }
      }
   };

   // Handle navigation from Dashboard with zona muerta preset
   useEffect(() => {
      if (navigationState?.openWizard && hasBrief && monthCards.length > 0) {
         setPresetZonaMuerta(navigationState.zonaMuerta || null);
         setSelectedMonth(monthCards[0]);
         setWizardMode('express'); // Ir directo a express desde dashboard
         setActiveTab('crear');
         // Limpiar estado de navegación de forma segura para evitar loop
         navigate(location.pathname, { replace: true, state: {} });
      }
   }, [navigationState, hasBrief, monthCards, navigate]);

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
      setToastState({ show: true, message: '¡Brief guardado! Nilah ahora conoce tu negocio 🎉', type: 'success' });
      setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 4000);
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
            setToastState({ show: true, message: '🗑️ Campaña eliminada correctamente', type: 'success' });
            setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 4000);
         } catch (error) {
            console.error('Error removing campaign:', error);
            setError('Error al eliminar la campaña');
         }
      }
   };

   // Handle Manual Launch — con feedback de cooldown y progreso
   const handleLaunchCampaign = async (campaignId: string) => {
      try {
         // Buscar campaña para mostrar info de progreso
         const campaign = campaigns.find(c => c.id === campaignId);
         const recipientCount = campaign?.estimatedReach || campaign?.segmentCount || 0;

         // Mostrar banner de envío si hay destinatarios conocidos
         if (recipientCount > 0) {
            const estimatedMin = Math.max(1, Math.round((recipientCount * 25) / 60)); // ~25s por mensaje
            setSendingState({
               isSending: true,
               campaignTitle: campaign?.title || 'Campaña',
               total: recipientCount,
               estimatedMinutes: estimatedMin
            });
         }

         const sendResult = await campaignsApi.send(parseInt(campaignId)) as any;
         console.log('✅ Campaña lanzada manualmente:', sendResult);

         // Verificar si el cooldown bloqueó el envío
         if (sendResult?.puedeEnviar === false || sendResult?.bloqueado) {
            const razon = sendResult?.razon_bloqueo || sendResult?.razon || 'limite_desconocido';
            const infoExtra = sendResult?.info_extra || '';
            let mensajeToast = '⏳ ';

            switch (razon) {
               case 'cooldown_activo':
                  mensajeToast += `Cooldown activo — ${infoExtra || 'intenta más tarde'}`;
                  break;
               case 'cooldown_minimo':
                  mensajeToast += `Cooldown mínimo entre mensajes — ${infoExtra}`;
                  break;
               case 'limite_semanal':
                  mensajeToast += `Límite semanal alcanzado: ${infoExtra || '2/2 mensajes'}`;
                  break;
               case 'limite_diario':
                  mensajeToast += `Límite diario del negocio alcanzado (30 mensajes/día)`;
                  break;
               case 'horario_no_seguro':
                  mensajeToast += `Fuera de horario seguro (9AM-8PM). ${infoExtra}`;
                  break;
               default:
                  mensajeToast += `Envío bloqueado: ${razon}. ${infoExtra}`;
            }

            setSendingState(prev => ({ ...prev, isSending: false }));
            setToastState({ show: true, message: mensajeToast, type: 'error' });
            setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 6000);
            return;
         }

         // Éxito
         setCampaigns(prev => prev.map(c =>
            c.id === campaignId ? { ...c, status: 'active' } : c
         ));

         if (detailsCampaign?.id === campaignId) {
            setDetailsCampaign(prev => prev ? { ...prev, status: 'active' } : null);
         }

         const totalEnviados = sendResult?.total_enviados || sendResult?.mensajes_enviados || recipientCount;
         setToastState({ show: true, message: `🚀 ¡Campaña enviada! ${totalEnviados} mensajes enviados`, type: 'success' });
         setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 5000);

         // Auto-ocultar banner de progreso
         setTimeout(() => setSendingState(prev => ({ ...prev, isSending: false })), 3000);
      } catch (error: any) {
         console.error('Error lanzando campaña:', error);
         setSendingState(prev => ({ ...prev, isSending: false }));

         // Parsear error de cooldown desde la respuesta de error
         const errorMsg = error?.message || error?.toString() || '';
         if (errorMsg.includes('cooldown') || errorMsg.includes('limite') || errorMsg.includes('bloqueado')) {
            setToastState({ show: true, message: `⏳ ${errorMsg}`, type: 'error' });
         } else {
            setToastState({ show: true, message: '❌ Error al lanzar la campaña', type: 'error' });
         }
         setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 5000);
      }
   };

   const countryInfo = SUPPORTED_COUNTRIES[currentCountry];
   const currencySymbol = countryInfo.currencySymbol;

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
            <Link to="/nilah/app" className="mt-6 rounded-lg bg-gray-200 px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-white">
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
      <div className="w-full min-w-0 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         {/* Banner de Progreso de Envío */}
         {sendingState.isSending && (
            <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-lg animate-in slide-in-from-top-4 duration-300">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
                     <Send size={20} />
                  </div>
                  <div className="flex-1">
                     <p className="font-bold text-sm">📤 Enviando: {sendingState.campaignTitle}</p>
                     <p className="text-xs text-blue-100 mt-0.5">
                        ~{sendingState.total} mensajes • Tiempo estimado: ~{sendingState.estimatedMinutes} min
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                     <span className="text-xs font-medium">En progreso</span>
                  </div>
               </div>
               <div className="mt-3 w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div className="h-full bg-white/80 rounded-full animate-pulse" style={{ width: '60%' }} />
               </div>
            </div>
         )}

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
                     <span className="px-2 py-0.5 bg-primary text-white rounded-full text-[10px]">
                        {countryInfo.flag} {countryInfo.name}
                     </span>
                  </div>
                  <h1 className="text-2xl font-bold">Marketing Inteligente para tu Negocio</h1>
               </div>

               <div className="flex gap-2 sm:gap-3 overflow-x-auto hide-scrollbar pb-1">
                  <div className="px-3 sm:px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-center min-w-[80px]">
                     <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Rocket size={14} className="text-primary" />
                        <span className="text-xl font-bold">{activeCampaigns}</span>
                     </div>
                     <p className="text-[10px] text-indigo-200">Activas</p>
                  </div>
                  <div className="px-3 sm:px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-center min-w-[80px]">
                     <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock size={14} className="text-amber-400" />
                        <span className="text-xl font-bold">{scheduledCampaigns}</span>
                     </div>
                     <p className="text-[10px] text-indigo-200">Prog.</p>
                  </div>
                  <div className="px-3 sm:px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md text-center min-w-[80px]">
                     <div className="flex items-center justify-center gap-1 mb-0.5">
                        <TrendingUp size={14} className="text-emerald-400" />
                        <span className="text-xl font-bold">{countryInfo.currencySymbol}{totalEstimatedRevenue.toLocaleString()}</span>
                     </div>
                     <p className="text-[10px] text-indigo-200">Ingresos</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Tabs Navigation */}
         <div className="flex gap-1 p-1 rounded-xl bg-gray-100 dark:bg-dark-card overflow-x-auto hide-scrollbar">
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-w-[120px] sm:min-w-0 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                     ? 'bg-white dark:bg-dark-bg text-primary shadow-sm'
                     : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                     }`}
               >
                  <tab.icon size={16} className="shrink-0" />
                  <span className="sm:inline">{tab.label}</span>
               </button>
            ))}
         </div>

         {/* Tab Content */}
         <div className="min-h-[500px]">
            {/* TAB: CREAR CAMPAÑA */}
            {activeTab === 'crear' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  {/* NUEVO: Oportunidades de Marketing basadas en Segmentación */}
                  {!loadingSegments && (
                     <MarketingOpportunities
                        segments={segments}
                        onCreateCampaign={handleCreateFromSegment}
                     />
                  )}
                  {loadingSegments && (
                     <div className="h-32 flex items-center justify-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                     </div>
                  )}

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

            {/* TAB: HISTORIAL (New List View) */}
            {activeTab === 'historial' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Error Alert */}
                  {error && (
                     <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                           <h4 className="font-bold text-red-700 text-sm">Error al cargar campañas</h4>
                           <p className="text-sm text-red-600 mt-1">{error}</p>
                           {error.includes('n8n') && (
                              <p className="text-xs text-red-500 mt-2 font-mono bg-red-100 p-2 rounded">
                                 Tip: Revisa el nodo "Respond to Webhook" en n8n y asegúrate de usar "Expression" para el campo campanas.
                              </p>
                           )}
                        </div>
                     </div>
                  )}

                  {/* Active Campaigns List */}
                  <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                     <div className="p-4 border-b border-gray-100 dark:border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="font-bold text-gray-900 dark:text-white">
                           Historial de Campañas
                        </h3>
                        {/* Filter Chips */}
                        <div className="flex gap-2">
                           {(['all', 'active', 'enviada', 'scheduled', 'draft'] as const).map(filter => (
                              <button
                                 key={filter}
                                 onClick={() => setCampaignFilter(filter)}
                                 className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${campaignFilter === filter
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 dark:bg-dark-bg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-border'
                                    }`}
                              >
                                 {filter === 'all' ? 'Todas' : filter === 'active' ? 'Activas' : filter === 'enviada' ? 'Enviadas' : filter === 'scheduled' ? 'Programadas' : 'Borradores'}
                              </button>
                           ))}
                        </div>
                     </div>

                     {filteredCampaigns.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                           No hay campañas {campaignFilter !== 'all' ? campaignFilter : ''} para mostrar.
                        </div>
                     ) : (
                        <div className="divide-y divide-gray-100 dark:divide-dark-border">
                           {filteredCampaigns.map((campaign) => (
                              <div
                                 key={campaign.id}
                                 onClick={() => setDetailsCampaign(campaign)}
                                 className="p-4 hover:bg-gray-50 dark:hover:bg-dark-bg cursor-pointer transition-colors group"
                              >
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${campaign.status === 'active' ? 'bg-green-100 text-green-600' :
                                          campaign.status === 'scheduled' ? 'bg-amber-100 text-amber-600' :
                                             'bg-gray-100 text-gray-600'
                                          }`}>
                                          {campaign.status === 'active' ? <Send size={20} /> :
                                             campaign.status === 'scheduled' ? <Calendar size={20} /> :
                                                <Edit3 size={20} />}
                                       </div>
                                       <div>
                                          <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                             {campaign.title}
                                          </h4>
                                          <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                                             <span className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(campaign.createdAt).toLocaleDateString()}
                                             </span>
                                             {campaign.keyDateName && (
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-xs">
                                                   {campaign.keyDateName}
                                                </span>
                                             )}
                                          </div>
                                       </div>
                                    </div>

                                    <div className="flex items-center gap-3 sm:gap-6">
                                       {/* Status Badge mejorado */}
                                       <span className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${campaign.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                          campaign.status === 'scheduled' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                             campaign.status === 'enviada' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                          }`}>
                                          {campaign.status === 'active' ? '🟢 Activa' :
                                             campaign.status === 'scheduled' ? '📅 Programada' :
                                                campaign.status === 'enviada' ? '✅ Enviada' :
                                                   '📝 Borrador'}
                                       </span>

                                       <div className="text-right hidden md:block">
                                          <p className="text-xs text-gray-500 uppercase">Alcance</p>
                                          <p className="font-medium text-gray-900 dark:text-white">
                                             {campaign.estimatedReach}
                                          </p>
                                       </div>
                                       <div className="text-right hidden md:block">
                                          <p className="text-xs text-gray-500 uppercase">Ingreso Est.</p>
                                          <p className="font-medium text-green-600">
                                             {currencySymbol}{campaign.estimatedRevenue}
                                          </p>
                                       </div>

                                       {/* Botón Enviar Rápido para borradores y programadas */}
                                       {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                                          <button
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                handleLaunchCampaign(campaign.id);
                                             }}
                                             className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm"
                                             title="Enviar campaña ahora"
                                          >
                                             <Rocket size={13} />
                                             Enviar
                                          </button>
                                       )}

                                       <ChevronRight className="text-gray-300 group-hover:text-primary" size={20} />
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </div>
            )}

            {/* Wizard Modals */}


            {/* DETAILS MODAL */}
            {detailsCampaign && (
               <CampaignDetailsModal
                  isOpen={!!detailsCampaign}
                  onClose={() => setDetailsCampaign(null)}
                  campaign={detailsCampaign}
                  currencySymbol={currencySymbol}
                  onDelete={handleDeleteCampaign}
                  onLaunch={handleLaunchCampaign}
               />
            )}

            {/* TAB: MÉTRICAS (KPIs & Top Campaigns) */}
            {activeTab === 'metricas' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 text-white shadow-lg shadow-emerald-500/10">
                        <div className="flex items-center gap-2 mb-2">
                           <TrendingUp size={18} />
                           <span className="text-sm font-medium opacity-90">Ingresos Totales</span>
                        </div>
                        <p className="text-3xl font-bold">{countryInfo.currencySymbol}{metrics.ingresoTotal.toLocaleString()}</p>
                        {metrics.cambioVsMesAnterior > 0 && (
                           <p className="text-xs mt-1 flex items-center gap-1 text-emerald-200">
                              <ArrowUpRight size={12} />
                              +{metrics.cambioVsMesAnterior}% vs mes anterior
                           </p>
                        )}
                     </div>

                     <div className="rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-gray-500">
                           <MessageSquare size={18} />
                           <span className="text-sm font-medium">Mensajes Enviados</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalMensajes}</p>
                        <p className="text-xs text-gray-400 mt-1">campañas activas</p>
                     </div>

                     <div className="rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-2 text-gray-500">
                           <Calendar size={18} />
                           <span className="text-sm font-medium">Citas Generadas</span>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{metrics.totalCitas}</p>
                        <p className="text-xs text-gray-400 mt-1">desde campañas</p>
                     </div>

                     <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-5 text-white shadow-lg shadow-purple-500/10">
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
                     {(() => {
                        // Derive top campaigns from loaded data, sorted by revenue
                        const topCamps = [...campaigns]
                           .sort((a, b) => (b as any).ingresoReal || b.estimatedRevenue - ((a as any).ingresoReal || a.estimatedRevenue))
                           .slice(0, 3);
                        return topCamps.length > 0 ? (
                           <div className="divide-y divide-gray-100 dark:divide-dark-border">
                              {topCamps.map((camp, index) => (
                                 <div key={camp.id} onClick={() => setDetailsCampaign(camp)} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-bg transition-colors cursor-pointer">
                                    <div className="flex items-center gap-4">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                          index === 1 ? 'bg-gray-100 text-gray-600' :
                                             'bg-amber-100 text-amber-700'
                                          }`}>
                                          {index + 1}
                                       </div>
                                       <div>
                                          <p className="font-medium text-gray-900 dark:text-white">{camp.title}</p>
                                          <p className="text-xs text-gray-500">
                                             {(camp as any).mensajesEnviados || camp.estimatedReach} mensajes • {camp.status === 'enviada' ? '✅ Enviada' : camp.status === 'active' ? '🟢 Activa' : '📅 Programada'}
                                          </p>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                          {countryInfo.currencySymbol}{((camp as any).ingresoReal || camp.estimatedRevenue).toLocaleString()}
                                       </p>
                                       <p className="text-xs text-gray-500">
                                          {camp.estimatedReach} destinatarios
                                       </p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        ) : (
                           <div className="p-8 text-center">
                              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-3">
                                 <BarChart3 size={24} className="text-gray-400" />
                              </div>
                              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aún no hay datos de rendimiento</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Lanza tu primera campaña para ver métricas aquí</p>
                           </div>
                        );
                     })()}
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
                              {campaigns.length > 0
                                 ? `Tienes ${activeCampaigns} campaña${activeCampaigns !== 1 ? 's' : ''} activa${activeCampaigns !== 1 ? 's' : ''} y ${scheduledCampaigns} programada${scheduledCampaigns !== 1 ? 's' : ''}. ${zonasMuertas.length > 0 ? `Detecté ${zonasMuertas.length} zonas muertas que podrías aprovechar con una promo flash.` : 'Tu agenda se ve saludable.'}`
                                 : 'Crea tu primera campaña de WhatsApp para empezar a generar ingresos con marketing inteligente.'
                              }
                           </p>
                           <button
                              onClick={() => setActiveTab(zonasMuertas.length > 0 ? 'zonas' : 'crear')}
                              className="mt-3 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                           >
                              {zonasMuertas.length > 0 ? 'Ver zonas muertas' : 'Crear campaña ahora'}
                              <ArrowRight size={14} />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            )
            }



            {/* TAB: ZONAS MUERTAS */}
            {
               activeTab === 'zonas' && (
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
                     {zonasMuertas.length > 0 ? (
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
                                       className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors"
                                    >
                                       <Zap size={14} />
                                       Crear Promo
                                    </button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-12 rounded-xl border border-dashed border-gray-300 dark:border-dark-border bg-gray-50 dark:bg-dark-bg/50 animate-in fade-in duration-500">
                           <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                              <Sparkles size={32} className="text-green-600 dark:text-green-400" />
                           </div>
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">¡Todo se ve excelente!</h3>
                           <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                              No detectamos horarios recurrentes con ocupación críticamente baja. Tu agenda luce saludable.
                           </p>
                        </div>
                     )}

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
               )
            }
         </div>


         {/* Campaign Mode Selector */}
         {
            selectedMonth && (
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
            )
         }

         {/* Campaign Builder Express */}
         {
            selectedMonth && wizardMode === 'express' && (
               <CampaignBuilderExpress
                  isOpen={true}
                  onClose={handleCloseWizard}
                  monthCard={selectedMonth}
                  customSegment={preselectedSegment || undefined}
                  currencySymbol={countryInfo.currencySymbol}
                  onCampaignCreated={(campaign) => {
                     handleCampaignCreated(campaign);
                     handleCloseWizard();
                     setPreselectedSegment(null);
                  }}
               />
            )
         }

         {/* Campaign Builder Advanced */}
         {
            selectedMonth && wizardMode === 'advanced' && (
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
            )
         }

         {/* Business Brief Wizard Modal */}
         <BusinessBriefWizard
            isOpen={isBriefOpen}
            onClose={() => setIsBriefOpen(false)}
            onComplete={handleBriefComplete}
            businessId={businessId}
         />

         {/* Brief Badge */}
         {
            hasBrief && (
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
            )
         }

         {/* Success Toast */}
         {
            toastState.show && (
               <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
                  <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg ${toastState.type === 'error' ? 'bg-red-900 border border-red-500' : 'bg-dark-card border border-primary'}`}>
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${toastState.type === 'error' ? 'bg-red-500/20' : 'bg-primary/20'}`}>
                        <CheckCircle className={toastState.type === 'error' ? 'text-red-400' : 'text-primary'} size={20} />
                     </div>
                     <div>
                        <p className="font-bold text-white text-sm">{toastState.message}</p>
                     </div>
                     <button onClick={() => setToastState(prev => ({ ...prev, show: false }))} className="ml-2 p-1 hover:bg-white/10 rounded-lg">
                        <X size={16} className="text-gray-400" />
                     </button>
                  </div>
               </div>
            )
         }

         {/* WhatsApp Preview Modal */}
         {
            previewCampaign && (
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
            )
         }
      </div>
   );
};

export default MarketingPage;
