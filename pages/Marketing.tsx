/**
 * Marketing Page - Nilah Marketing AI
 * Rediseño con Tabs para máximo valor: Crear, Métricas, Historial, Zonas Muertas
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
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
import { PLAN_FEATURES, PLAN_DISPLAY_NAMES, PLAN_NEXT, normalizeToPlanBase } from '../constants/planFeatures';
import { useDashboardData } from '../context/DashboardDataContext';
import { business as businessApi, campaigns as campaignsApi } from '../services/api';

import {
   MonthlyCarousel,
   CampaignBuilderWizard,
   BusinessBriefWizard,
   NilahAlertBanner,
   CampaignTuningModal,
   AudiencesTab,
   NilahImpactCenter
} from '../components/Marketing';
import { Lock, MessageCircle } from 'lucide-react';
import CampaignDetailsModal from '../components/Marketing/CampaignDetailsModal';
import ProfitHeatmap from '../components/Dashboard/ProfitHeatmap';

// Types
import {
   MonthCard as MonthCardType,
   GeneratedCampaign,
   WizardMode,
   CountryCode,
   SUPPORTED_COUNTRIES
} from '../types/campaignBuilderTypes';
import { fetchMonthCardsAsync } from '../services/marketingService';

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
   const { isAdmin, user, recursosSaaS } = useAuth();
   const planBase = normalizeToPlanBase(recursosSaaS.plan_base);
   const planFeatures = PLAN_FEATURES[planBase];
   const currentPlanName = PLAN_DISPLAY_NAMES[planBase];
   const nextPlan = PLAN_NEXT[planBase];
   const [searchParams, setSearchParams] = useSearchParams();

   // Tabs state
   type TabType = 'audiencias' | 'crear' | 'historial' | 'metricas' | 'zonas';
   const activeTab = (searchParams.get('tab') as TabType) || 'audiencias';
   const setActiveTab = (tab: TabType) => {
       setSearchParams({ tab });
   };



   // State
   const [currentCountry, setCurrentCountry] = useState<CountryCode>('PE');
   const [monthCards, setMonthCards] = useState<MonthCardType[]>([]);
   const [campaigns, setCampaigns] = useState<GeneratedCampaign[]>([]);
   const [selectedMonth, setSelectedMonth] = useState<MonthCardType | null>(null);
   const [isBriefOpen, setIsBriefOpen] = useState(false);
   const [hasBrief, setHasBrief] = useState(false);
   
   const [businessId, setBusinessId] = useState(() => {
      return localStorage.getItem('korat_business_id') || user?.business_id || `biz-${user?.email?.split('@')[0] || 'demo'}`;
   });

   useEffect(() => {
       const localBiz = localStorage.getItem('korat_business_id');
       if (localBiz) {
           setBusinessId(localBiz);
       } else if (user) {
           setBusinessId(user.business_id || `biz-${user.email?.split('@')[0] || 'demo'}`);
       }
   }, [user]);

   const [toastState, setToastState] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

   // New states
   const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'scheduled' | 'draft'>('all');
   const [previewCampaign, setPreviewCampaign] = useState<GeneratedCampaign | null>(null);
   const [detailsCampaign, setDetailsCampaign] = useState<GeneratedCampaign | null>(null);
   const [presetZonaMuerta, setPresetZonaMuerta] = useState<string | null>(null);

   // Tuning Modal state from Copilot / Zonas Muertas
   const [isTuningOpen, setIsTuningOpen] = useState(false);
   const [tuningIdea, setTuningIdea] = useState<any>(null);

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

   // Dashboard integration for Nilah Impact
   const dashboardContext = useDashboardData();

   // Segmentation state (from clientes_segmentados view)
   const [segments, setSegments] = useState<SegmentData>({
      vip: 0, recuperar: 0, nuevo: 0, recurrente: 0,
      interes_unas: 0, interes_pestanas: 0, interes_cabello: 0, total: 0
   });
   const [loadingSegments, setLoadingSegments] = useState(true);
   const [preselectedSegment, setPreselectedSegment] = useState<string | null>(null);

   // Get navigation state (from Dashboard heatmap or Copilot)
   const navigate = useNavigate();
   const location = useLocation();
   const navigationState = location.state as { 
      openWizard?: boolean; 
      presetObjective?: string; 
      zonaMuerta?: string;
      openTuningModal?: boolean;
      tuningTitle?: string;
      tuningPayload?: any;
      openMarketplace?: boolean;
   } | null;

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

   // Load month cards from Supabase when country or businessId changes
   useEffect(() => {
      const loadMonthCards = async () => {
         const cards = await fetchMonthCardsAsync(currentCountry, businessId);
         setMonthCards(cards);
      };

      loadMonthCards();
   }, [currentCountry, businessId]);

   // Load campaigns from API
   useEffect(() => {
      const loadCampaigns = async () => {
         try {
            setLoadingCampaigns(true);
            const response = await campaignsApi.getAll(businessId) as any;

            let campaignData = [];
            // Validación de respuesta corrupta (Bug n8n)
            if (typeof response?.campanas === 'string' && response.campanas.includes('[object Object]')) {
               console.error('CRITICAL: La API retornó un string corrupto en lugar de JSON.', response.campanas);
               setError('Error de configuración en n8n: El campo "campanas" se devuelve como texto y no como JSON.');
               return;
            }

            if (Array.isArray(response)) {
               campaignData = response;
            } else if (response?.success && Array.isArray(response?.campanas)) {
               campaignData = response.campanas;
            } else if (response?.success === false) {
               setError(response.message || 'Error al cargar campañas');
               return;
            }

            if (campaignData.length > 0) {
               // Mapear datos de Supabase a formato del frontend
               const mapped = campaignData.map((c: any) => ({
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
            } else {
               setCampaigns([]);
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
         // Calcular citas provenientes de campañas, rescates, retención, etc.
         const citasOrigen = (dashboardData?.citas || []).filter(c => 
             c.origen_cita && c.origen_cita !== 'organico' && c.origen_cita !== null
         );
         
         // Calcular ingresos generados por marketing (sumando el precio de citas no orgánicas)
         const ingresosCitasMarketing = citasOrigen.reduce((sum, c) => sum + (Number(c.precio) || 0), 0);

         // Calcular cantidad total de mensajes enviados históricamente en campañas
         const mensajesRealesEnviados = campaigns.reduce((sum, c) => sum + (c.mensajesEnviados || c.estimatedReach || 0), 0);

         // Calcular tasa de conversión real (Citas Agendadas / Mensajes Enviados)
         const tasaConversion = mensajesRealesEnviados > 0 
             ? Math.round((citasOrigen.length / mensajesRealesEnviados) * 100) 
             : 0;

         setMetrics({
            // Si hay ingresos de marketing usamos eso, sino un ratio del mes o 0
            ingresoTotal: ingresosCitasMarketing > 0 ? ingresosCitasMarketing : calculatedStats.ingresos_mes || 0,
            totalMensajes: mensajesRealesEnviados > 0 ? mensajesRealesEnviados : 0,
            totalCitas: citasOrigen.length > 0 ? citasOrigen.length : 0,
            conversionPromedio: tasaConversion > 0 ? tasaConversion : 0,
            cambioVsMesAnterior: 0, // TODO: Calcular cuando haya data histórica comparativa
            topCampanas: [] // TODO: Llenar si tuviéramos id de campaña en origen de cita
         });
      }
   }, [calculatedStats, campaigns, dashboardData]);

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
      
      // Personalizar mensaje si venimos de una Zona Muerta
      let suggestedTitle = `Campaña: ${segmentName}`;
      let suggestedMessage = `¡Hola! Tenemos un descuento especial reservado para ti hoy. Aprovecha esta promoción exclusiva.`;

      if (presetZonaMuerta) {
         suggestedTitle = `Flash: ${segmentName} (${presetZonaMuerta})`;
         suggestedMessage = `¡Hola! Notamos que sueles visitarnos los ${presetZonaMuerta}. Tenemos un espacio ideal para ti esta semana con un beneficio exclusivo. ¿Te gustaría aprovecharlo?`;
      }

      // Ir directo al Tuning Studio (Campaña Flash)
      setTuningIdea({
         titulo: suggestedTitle,
         objetivo: 'ventas',
         segmento: segmentId,
         audience_id: segmentId,       // ← Siempre set explícitamente
         audience_nombre: segmentName,
         mensaje_sugerido: suggestedMessage,
         origen_campana: presetZonaMuerta ? 'flash_mapa_calor' : 'flash_audiencia'
      });
      setIsTuningOpen(true);
      setActiveTab('crear');
   };

   // Handle navigation from Dashboard with zona muerta preset
   useEffect(() => {
      if (navigationState?.openMarketplace) {
         setPresetZonaMuerta(navigationState.zonaMuerta || null);
         setActiveTab('audiencias');
         navigate(location.pathname, { replace: true, state: {} });
      }

      // 2. Copilot Express Campaign
      if (navigationState?.openTuningModal && navigationState?.tuningPayload) {
        const payload = navigationState.tuningPayload;
        // Check multiple possible keys coming from n8n AI
        let rawSegmento: string = payload.audience_id || payload.segment_id || payload.segment || payload.segmento || '';
        const rawTitle: string = navigationState.tuningTitle || 'Promo Flash';
        const rawMensaje: string = payload.mensaje || '';
        const rawContexto = payload.contexto_adicional;

        if (!rawSegmento || rawSegmento === 'todas') {
           // Fallback: extract from message or title if AI forgot to set it in payload JSON
           const textToScan = (rawTitle + ' ' + rawMensaje + ' ' + (rawContexto || '')).toLowerCase();
           const knownIds = ['mkt-slowdays', 'mkt-overdue', 'mkt-early', 'mkt-discount', 'mkt-churn', 
                             'crm-vip', 'crm-fiel', 'crm-regular', 'crm-casual', 'crm-nuevas', 'crm-30', 
                             'crm-perdidas', 'crm-resenas', 'srv-cabello', 'srv-cejas', 'srv-facial', 
                             'srv-pestanas', 'srv-manos', 'srv-pies', 'mkt-primera-vez-facial'];
           const found = knownIds.find(id => textToScan.includes(id));
           rawSegmento = found || 'todas';
        }

        navigate(location.pathname, { replace: true, state: {} });

        // Async IIFE: Resolve audience ID → human-readable name/description
        (async () => {
          let resolvedNombre = rawTitle;
          let resolvedDesc = '';
          try {
            const result = await campaignsApi.getSmartAudiences(0) as any;
            const allAuds = [
              ...(result?.crm || []),
              ...(result?.crm_extra || []),
              ...(result?.marketing || []),
              ...(result?.servicios || []),
            ];
            const found = allAuds.find((a: any) => a.id === rawSegmento);
            if (found) {
              resolvedNombre = found.nombre;
              resolvedDesc = found.descripcion || '';
            }
          } catch (e) {
            console.warn('[Copilot→Tuning] No se pudo resolver el nombre de audiencia', e);
          }

          setTuningIdea({
            titulo: rawTitle,
            objetivo: 'ventas',
            segmento: rawSegmento,
            audience_id: rawSegmento,
            audience_nombre: resolvedNombre,
            audience_descripcion: resolvedDesc,
            mensaje_sugerido: rawMensaje,
            contexto_adicional: rawContexto,
            origen_campana: 'flash_copilot'
          });
          setIsTuningOpen(true);
          setActiveTab('crear');
        })();
      }
   }, [navigationState, monthCards, navigate, location.pathname]);

   // Handlers
   const handleSelectMonth = (card: MonthCardType) => {
      setSelectedMonth(card);
      if (hasBrief) {
         setActiveTab('audiencias');
         setToastState({ show: true, message: `Seleccionaste el mes. Ahora elige a quién enviarlo.`, type: 'success' });
      } else {
         setIsBriefOpen(true);
      }
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
      setTuningIdea({
         titulo: `Promo Flash Zona Muerta (${dia})`,
         objetivo: 'ventas',
         segmento: 'todas',
         mensaje_sugerido: `Aprovecha hoy un descuento especial en tus servicios.`,
         dia_zona_muerta: dia,
         origen_campana: 'flash_mapa_calor'
      });
      setIsTuningOpen(true);
   };

   // Global Handlers for Campaign Tuning Modal (Copilot & Zonas Muertas)
   const handleTuningLaunch = async (params: {
       campaign_id: number | string | undefined;
       audience: { id: string; nombre: string; count: number; [key: string]: any };
       message: string;
       scheduled_at?: string;
       origen_campana?: string | number;
   }) => {
       await campaignsApi.flow('lanzar_campana', {
           campaign_id: params.campaign_id,
           audience_id: params.audience.id,
           mensaje: params.message,
           scheduled_at: params.scheduled_at || null,
           origen_campana: params.origen_campana
       });
       setToastState({ show: true, message: '🚀 ¡Campaña Flash enviada con éxito!', type: 'success' });
       setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 5000);
   };

   const handleGenerateAssets = async (params: {
       campaign_id: number | string | undefined;
       audience: { id: string; nombre: string; count: number; descripcion?: string; insight?: string; contexto_adicional?: string; [key: string]: any };
       beneficio?: string;
       beneficio_detalle?: string;
   }) => {
       let fullDescription = params.audience.descripcion || '';
       if (params.audience.insight) {
           fullDescription += ` \nEstrategia de Nilah: ${params.audience.insight}`;
       }
       if (params.audience.contexto_adicional) {
           fullDescription += ` \nContexto Temporal de Zona Muerta: ${params.audience.contexto_adicional}`;
       }
       if (params.beneficio) {
           fullDescription += ` \n--- \nBENEFICIO CONCRETO DE LA CAMPAÑA (OFERTA): ${params.beneficio}`;
       }
       if (params.beneficio_detalle) {
           fullDescription += ` \nDETALLE REGLA/CONDICION DE LA OFERTA: ${params.beneficio_detalle}`;
       }
       
       return await campaignsApi.flow('generar_activos', {
           campaign_id: params.campaign_id,
           audience_id: params.audience.id,
           audience_nombre: params.audience.nombre,
           audience_descripcion: fullDescription.trim(),
           contexto_adicional: params.audience.contexto_adicional
       });
   };

   const handleSelectWeeklyIdea = (idea: any, card: MonthCardType) => {
      setSelectedMonth(card);
      setActiveTab('audiencias');
      setToastState({ show: true, message: `Seleccionaste la idea. Ahora elige a quién enviarlo.`, type: 'success' });
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
   // Tabs — locked tabs are still visible but show upgrade screen on click
   const tabs = [
      { id: 'audiencias' as TabType, label: 'Marketplace', icon: Users, locked: false },
      { id: 'crear' as TabType, label: 'Crear Campaña', icon: Rocket, locked: !planFeatures.marketing },
      { id: 'metricas' as TabType, label: 'Impacto Nilah', icon: BarChart3, locked: false },
      { id: 'historial' as TabType, label: 'Historial', icon: CalendarDays, locked: !planFeatures.marketing },
      { id: 'zonas' as TabType, label: 'Zonas Muertas', icon: Zap, locked: !planFeatures.marketing },
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
                  className={`relative flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                     ? 'bg-white dark:bg-dark-bg text-primary shadow-sm'
                     : tab.locked
                       ? 'text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400'
                       : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                     }`}
               >
                  <tab.icon size={16} className="shrink-0" />
                  <span className="sm:inline">{tab.label}</span>
                  {tab.locked && (
                     <Lock size={11} className="text-violet-400 dark:text-violet-500" />
                  )}
               </button>
            ))}
         </div>

         {/* Tab Content */}
         <div className="min-h-[500px]">

            {/* ── Upgrade Screen (shown when a locked tab is active) ─── */}
            {(() => {
               const activeLocked = tabs.find(t => t.id === activeTab)?.locked;
               if (!activeLocked) return null;

               const featureMap: Record<string, { title: string; desc: string; bullets: string[] }> = {
                  crear: {
                     title: 'Campañas Semanales de WhatsApp',
                     desc: 'Lanza 4 campañas inteligentes al mes. Nilah redacta el copy, elige la audiencia ideal y envía automáticamente.',
                     bullets: [
                        '200 contactas al 10% = 20 citas nuevas al mes',
                        'Copy generado con IA en tu tono y estilo',
                        'Cooldown inteligente: nunca molesta a quien ya tiene cita',
                     ],
                  },
                  historial: {
                     title: 'Historial de Campañas',
                     desc: 'Ve el rendimiento histórico de cada campaña: envíos, respuestas, citas generadas e ingresos recuperados.',
                     bullets: [
                        'Seguimiento por campaña y por clienta',
                        'Métricas de conversión y retorno de inversión',
                        'Exporta para tu contabilidad',
                     ],
                  },
                  zonas: {
                     title: 'Zonas Muertas — Rescue Mode',
                     desc: 'Detecta los días y horarios con menos citas y lanza campañas flash para llenar esos huecos en minutos.',
                     bullets: [
                        'Mapa de calor de ocupación de tu agenda',
                        'Campaña flash generada en 1 clic',
                        'Impacto: llena huecos que antes costaban dinero',
                     ],
                  },
               };

               const info = featureMap[activeTab] || { title: 'Función Premium', desc: '', bullets: [] };
               const waUrl = `https://wa.me/51999999999?text=${encodeURIComponent(`Hola! Quiero activar ${info.title} con el plan ${nextPlan?.displayName || 'Glow Pro'}`)}` ;

               return (
                  <div className="flex flex-col items-center justify-center min-h-[480px] py-12 animate-in fade-in duration-300">
                     <div className="max-w-lg w-full mx-auto">
                        {/* Lock icon */}
                        <div className="flex justify-center mb-6">
                           <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-indigo-100
                                           dark:from-violet-900/40 dark:to-indigo-900/40
                                           flex items-center justify-center shadow-xl shadow-violet-500/10">
                              <Lock className="text-violet-600 dark:text-violet-400" size={32} />
                           </div>
                        </div>

                        {/* Plan badge */}
                        <div className="flex justify-center mb-3">
                           <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                            bg-violet-100 dark:bg-violet-900/40
                                            text-violet-700 dark:text-violet-300
                                            border border-violet-200 dark:border-violet-700/40">
                              Requiere {nextPlan?.displayName || 'Glow Pro'}
                           </span>
                        </div>

                        {/* Title & Description */}
                        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-3">
                           {info.title}
                        </h2>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                           {info.desc}
                        </p>

                        {/* Feature bullets */}
                        <div className="rounded-2xl bg-gray-50 dark:bg-dark-card border border-gray-100 dark:border-dark-border p-5 mb-6 space-y-3">
                           {info.bullets.map((b, i) => (
                              <div key={i} className="flex items-start gap-3">
                                 <div className="mt-0.5 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40
                                                 flex items-center justify-center shrink-0">
                                    <span className="text-violet-600 dark:text-violet-400 text-xs font-bold">{i + 1}</span>
                                 </div>
                                 <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{b}</p>
                              </div>
                           ))}
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                           <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-sm text-white
                                         bg-gradient-to-r from-violet-600 to-indigo-600
                                         shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40
                                         hover:scale-105 transition-all"
                           >
                              <MessageCircle size={18} />
                              Activar {nextPlan?.displayName || 'Glow Pro'} por WhatsApp
                           </a>
                           <button
                              onClick={() => setActiveTab('metricas')}
                              className="px-6 py-4 rounded-xl font-medium text-sm text-gray-600 dark:text-gray-400
                                         border border-gray-200 dark:border-dark-border
                                         hover:bg-gray-50 dark:hover:bg-dark-card transition-colors"
                           >
                              Ver Impacto Nilah
                           </button>
                        </div>

                        {/* Current plan note */}
                        <p className="text-center text-xs text-gray-400 mt-4">
                           Estás en el plan <strong>{currentPlanName}</strong>.
                           Habla con nosotros para hacer el upgrade.
                        </p>
                     </div>
                  </div>
               );
            })()}

            {/* TAB: AUDIENCIAS (Marketplace) */}
            {activeTab === 'audiencias' && (
               <div className="space-y-6 animate-in fade-in duration-300">
                  {presetZonaMuerta && (
                     <div className="rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 p-4 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                              <Zap size={24} fill="currentColor" />
                           </div>
                           <div>
                              <h3 className="font-black text-amber-900 dark:text-amber-100 uppercase tracking-tight text-sm">Modo Zona Muerta: {presetZonaMuerta}</h3>
                              <p className="text-xs text-amber-800/70 dark:text-amber-200/80 font-medium">Elige la audiencia ideal para impulsar tus ventas este día.</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => setPresetZonaMuerta(null)}
                           className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-400 text-[11px] font-black uppercase tracking-wider transition-colors"
                        >
                           Cancelar
                        </button>
                     </div>
                  )}
                  <div className="mb-2">
                     <h2 className="text-xl font-bold text-gray-900 dark:text-white">Marketplace de Audiencias</h2>
                     <p className="text-sm text-gray-500 dark:text-gray-400">El corazón de tu marketing. Elige el público ideal y lanza campañas ultra-personalizadas en segundos.</p>
                  </div>
                  <div className="rounded-3xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border p-4 shadow-sm">
                     <AudiencesTab
                        businessId={businessId}
                        onLaunchFlash={(audience) => {
                           handleCreateFromSegment(audience.id, audience.nombre);
                        }}
                     />
                  </div>
               </div>
            )}

            {/* TAB: CREAR CAMPAÑA */}
            {activeTab === 'crear' && !tabs.find(t => t.id === 'crear')?.locked && (
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

            {/* TAB: HISTORIAL (New List View) */}
            {activeTab === 'historial' && !tabs.find(t => t.id === 'historial')?.locked && (
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

            {/* TAB: IMPACTO NILAH (Centro de Mando ROAI) */}
            {activeTab === 'metricas' && (
               (() => {
                  const citas = dashboardContext?.appointments || [];
                  const canceladas = citas.filter(c => c.estado.toLowerCase() === 'no-show' || c.estado.toLowerCase() === 'cancelada').length;
                  const tasaAsistencia = citas.length === 0 ? 0 : Math.max(0, 100 - (canceladas / citas.length) * 100);

                  const ticketProm = dashboardContext?.financials?.ticketPromedio || 0;
                  const rescatados = dashboardContext?.retentionStats?.rescatados_este_mes || 0;

                  const autonomos = citas.filter((c: any) => c.cerrado_por_ia);
                  const recordatorios = citas.filter((c: any) => c.recordatorio_24h_enviado || c.recordatorio_enviado || c.recordatorio_3h_enviado);

                  const nilahMetrics = {
                     broadcast: {
                        totalCampañas: campaigns.length,
                        ingresos: metrics.ingresoTotal,
                        mensajesEnviados: metrics.totalMensajes
                     },
                     rescate: {
                        clientesSalvados: rescatados,
                        ingresosRetenidos: rescatados * ticketProm
                     },
                     guardian: {
                        recordatoriosEnviados: recordatorios.length,
                        tasaAsistencia: Number(tasaAsistencia.toFixed(1))
                     },
                     chatbot: {
                        citasCerradas: autonomos.length,
                        ingresosAutonomos: autonomos.reduce((sum, c) => sum + (Number(c.precio) || 0), 0)
                     }
                  };

                  return <NilahImpactCenter metrics={nilahMetrics} />;
               })()
            )}



            {/* TAB: ZONAS MUERTAS */}
            {
               activeTab === 'zonas' && !tabs.find(t => t.id === 'zonas')?.locked && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                     <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-sm">
                        <ProfitHeatmap />
                     </div>

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


         {/* Campaign Builder Wizard eliminado - Ahora todo pasa por el Tuning Modal */}

         {/* Business Brief Wizard Modal */}
         <BusinessBriefWizard
            isOpen={isBriefOpen}
            onClose={() => setIsBriefOpen(false)}
            onComplete={handleBriefComplete}
            businessId={businessId}
         />

         {/* ─── Tuning Studio Modal (Global from Copilot/Zona Muerta) ─── */}
         <CampaignTuningModal
            isOpen={isTuningOpen}
            onClose={() => {
               setIsTuningOpen(false);
               setPresetZonaMuerta(null);
            }}
            idea={tuningIdea}
            businessId={businessId}
            onLaunch={async (params) => {
               await handleTuningLaunch(params);
               setIsTuningOpen(false);
               setPresetZonaMuerta(null);
            }}
            onGenerateAssets={handleGenerateAssets}
         />

         {/* Brief button removed — accessed from settings */}

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
