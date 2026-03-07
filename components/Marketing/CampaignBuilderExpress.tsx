/**
 * CampaignBuilderExpress Component
 * Wizard de 3 pasos donde la IA hace el trabajo pesado
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Sparkles,
    Zap,
    ArrowLeft,
    ArrowRight,
    Loader2,
    RefreshCw,
    Send,
    Calendar,
    Users,
    DollarSign,
    Target,
    MessageSquare,
    Check,
    Edit3,
    Image,
    Lightbulb,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { MonthCard, GeneratedCampaign, CampaignChoices, ObjectiveType } from '../../types/campaignBuilderTypes';
import { EXPRESS_OBJECTIVE_OPTIONS, OBJECTIVE_TO_SEGMENT, OBJECTIVE_TO_PROMO, OBJECTIVE_TO_TRIGGER } from '../../services/campaignWizardOptions';
import { campaigns } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';
import { MONTH_NAMES } from '../../services/campaignMockData';
import { formatMessage } from '../../utils/textFormatter';

interface CampaignBuilderExpressProps {
    isOpen: boolean;
    onClose: () => void;
    monthCard: MonthCard;
    currencySymbol: string;
    onCampaignCreated: (campaign: GeneratedCampaign) => void;
    customSegment?: string;
}

interface AIAnalysis {
    segmentName: string;
    segmentCount: number;
    avgTicket: number;
    promoType: string;
    promoLabel: string;
    emotionalTrigger: string;
    suggestedTime: string;
    suggestedDay: string;
    estimatedRevenue: number;
    estimatedReach: number;
    reason: string;
}

const CampaignBuilderExpress: React.FC<CampaignBuilderExpressProps> = ({
    isOpen,
    onClose,
    monthCard,
    currencySymbol,
    onCampaignCreated,
    customSegment,
}) => {
    const { clients, loyalty } = useDashboardData();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedObjective, setSelectedObjective] = useState<ObjectiveType | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedMessage, setEditedMessage] = useState('');
    const [scheduledDate, setScheduledDate] = useState<string>('');
    const [isLaunching, setIsLaunching] = useState(false);

    // Estados para envío por partes
    const [customRecipients, setCustomRecipients] = useState<number | null>(null);
    const [sendInParts, setSendInParts] = useState(false);
    const [batchSize, setBatchSize] = useState(20);

    // Estados para tips de IA
    const [aiImageIdea, setAiImageIdea] = useState<any>(null);
    const [aiTipsWhatsApp, setAiTipsWhatsApp] = useState<string[] | null>(null);
    const [aiVideoIdea, setAiVideoIdea] = useState<any>(null);
    const [koratFlowTip, setKoratFlowTip] = useState<string | null>(null);
    const [showCreativeTips, setShowCreativeTips] = useState(false);

    // Estado para toast de notificación
    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
    };

    // Reset al abrir
    useEffect(() => {
        if (isOpen) {
            // Verificar si viene con datos pre-cargados del plan semanal
            const preloaded = (monthCard as any)?.preloadedPlan;

            if (preloaded) {
                console.log('📋 Pre-cargando datos del plan semanal:', preloaded);

                // Mapear objetivo del plan al objetivo del wizard
                const objetivoMap: Record<string, ObjectiveType> = {
                    'recuperar_inactivos': 'recuperar_inactivos',
                    'fecha_especial': 'evento_especial',
                    'llenar_agenda': 'llenar_agenda',
                    'fidelizar': 'fidelizar_vip',
                    'referidos': 'captar_nuevos',
                };
                const mappedObjetivo = objetivoMap[preloaded.objetivo] || 'recuperar_inactivos';
                setSelectedObjective(mappedObjetivo);

                // Pre-cargar mensaje
                const mensaje = preloaded.mensaje || preloaded.mensaje_sugerido || '';
                setGeneratedMessage(mensaje);
                setEditedMessage(mensaje);

                // Pre-cargar análisis
                setAiAnalysis({
                    segmentName: preloaded.segmento || 'Todos',
                    segmentCount: preloaded.clientes_objetivo || preloaded.clientesObjetivo || 20,
                    avgTicket: 80,
                    promoType: preloaded.tipo_promo || preloaded.tipoPromo || 'descuento_15',
                    promoLabel: preloaded.promo_label || preloaded.promoLabel || '15% OFF',
                    emotionalTrigger: 'exclusividad',
                    suggestedTime: '10:00',
                    suggestedDay: 'Lunes',
                    estimatedRevenue: preloaded.ingreso_estimado || preloaded.ingresoEstimado || 240,
                    estimatedReach: preloaded.clientes_objetivo || preloaded.clientesObjetivo || 20,
                    reason: preloaded.razon || preloaded.razon_ia || ''
                });

                // Pre-cargar tips creativos
                try {
                    const ideaImagen = typeof preloaded.idea_imagen === 'string'
                        ? JSON.parse(preloaded.idea_imagen)
                        : preloaded.idea_imagen || preloaded.ideaImagen;
                    if (ideaImagen) setAiImageIdea(ideaImagen);

                    const tipsWa = typeof preloaded.tips_whatsapp === 'string'
                        ? JSON.parse(preloaded.tips_whatsapp)
                        : preloaded.tips_whatsapp || preloaded.tipsWhatsApp;
                    if (tipsWa && Array.isArray(tipsWa)) setAiTipsWhatsApp(tipsWa);

                    const ideaVideo = typeof preloaded.idea_video === 'string'
                        ? JSON.parse(preloaded.idea_video)
                        : preloaded.idea_video || preloaded.ideaVideo;
                    if (ideaVideo) setAiVideoIdea(ideaVideo);
                } catch (e) {
                    console.warn('Error parseando tips creativos:', e);
                }

                // Avanzar al paso 2 (ya tiene los datos)
                setCurrentStep(2);
                setIsEditing(false);
                setShowCreativeTips(true);

            } else {
                // Reset normal
                setCurrentStep(1);
                setSelectedObjective(null);
                setGeneratedMessage('');
                setAiAnalysis(null);
                setIsEditing(false);
                setEditedMessage('');
                setScheduledDate('');
                // Reset tips
                setAiImageIdea(null);
                setAiTipsWhatsApp(null);
                setAiVideoIdea(null);
                setKoratFlowTip(null);
                setShowCreativeTips(false);
            }
        }
    }, [isOpen, monthCard]);

    // Generar análisis y mensaje con IA
    const generateCampaign = async (objective: ObjectiveType) => {
        setIsGenerating(true);
        setCurrentStep(2);

        try {
            // Obtener datos del brief
            const user = localStorage.getItem('korat_user');
            const businessId = user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';
            const briefData = localStorage.getItem(`business_brief_${businessId}`);
            const brief = briefData ? JSON.parse(briefData) : {};

            // Obtener clientes del caché del dashboard
            const clientes = clients || [];
            const totalClients = clientes.length;
            const avgTicket = brief.avgTicket || 80;

            // Determinar automáticamente basado en objetivo
            // Prioridad: 1. Custom Segment (Props) 2. Preloaded (Weekly Idea) 3. Objetivo (Default)
            const preloadedSegment = (monthCard as any)?.preloadedPlan?.segmento;
            const segment = customSegment || preloadedSegment || OBJECTIVE_TO_SEGMENT[objective] || 'todas';

            const promo = OBJECTIVE_TO_PROMO[objective] || 'descuento_20';
            const trigger = OBJECTIVE_TO_TRIGGER[objective] || 'urgencia';

            // ✅ Calcular segmento REAL filtrando los datos en caché (instantáneo)
            let segmentCount = totalClients;
            let segmentName = 'Todas las clientas';

            if (segment === 'inactivas_30') {
                const inactivas = clientes.filter((c: any) =>
                    (c.dias_ausentes >= 30 || c.diasAusentes >= 30) && (c.Estado === 'Activo' || c.estado === 'activo')
                );
                segmentCount = inactivas.length || Math.floor(totalClients * 0.15);
                segmentName = 'Inactivas 30+ días';
            } else if (segment === 'inactivas_60' || segment === 'recuperar') {
                const inactivas = clientes.filter((c: any) =>
                    (c.dias_ausentes >= 60 || c.diasAusentes >= 60) && (c.Estado === 'Activo' || c.estado === 'activo')
                );
                segmentCount = inactivas.length || Math.floor(totalClients * 0.10);
                segmentName = 'Inactivas 60+ días';
            } else if (segment === 'activas_frecuentes' || segment === 'recurrente') {
                const frecuentes = clientes.filter((c: any) =>
                    (c.total_visitas >= 3 || c.totalVisitas >= 3) && (c.Estado === 'Activo' || c.estado === 'activo')
                );
                segmentCount = frecuentes.length || Math.floor(totalClients * 0.25);
                segmentName = 'Clientas recurrentes';
            } else if (segment === 'vip') {
                // Top 20% por visitas o gasto (Estimado)
                const vips = clientes.filter((c: any) =>
                    (c.total_visitas >= 8 || c.totalVisitas >= 8) && (c.Estado === 'Activo' || c.estado === 'activo')
                );
                segmentCount = vips.length || Math.floor(totalClients * 0.10);
                segmentName = 'Clientes VIP';
            } else if (segment === 'nuevo') {
                const nuevos = clientes.filter((c: any) =>
                    (c.total_visitas === 1 || c.totalVisitas === 1) && (c.Estado === 'Activo' || c.estado === 'activo')
                );
                segmentCount = nuevos.length || Math.floor(totalClients * 0.15);
                segmentName = 'Nuevos clientes';
            } else if (segment.startsWith('interes_')) {
                // Estimación para intereses (requiere análisis de historia de servicios)
                // Por ahora usamos un % fijo o random inteligente para simular realidad
                const category = segment.replace('interes_', '');
                segmentCount = Math.floor(totalClients * (category === 'unas' ? 0.35 : category === 'pestanas' ? 0.20 : 0.15));
                segmentName = `Interesadas en ${category}`;
            } else if (segment === 'todas') {
                const activas = clientes.filter((c: any) => c.Estado === 'Activo' || c.estado === 'activo');
                segmentCount = activas.length || totalClients;
                segmentName = 'Todas las clientas activas';
            }

            // Crear análisis
            const analysis: AIAnalysis = {
                segmentName,
                segmentCount: segmentCount || 25,
                avgTicket,
                promoType: promo,
                promoLabel: promo === 'descuento_20' ? '20% OFF' :
                    promo === 'flash_24h' ? 'Flash 24h' :
                        promo === '2x1_amigas' ? '2x1 con amiga' : 'Promo especial',
                emotionalTrigger: trigger,
                suggestedDay: 'Jueves',
                suggestedTime: '10:00 AM',
                estimatedRevenue: (segmentCount || 25) * avgTicket * 0.15,
                estimatedReach: segmentCount || 25,
                reason: objective === 'recuperar_inactivos'
                    ? 'Tienes clientas que no vienen hace tiempo. Un mensaje nostálgico con descuento tiene 32% de conversión.'
                    : objective === 'llenar_agenda'
                        ? 'Detectamos espacios vacíos esta semana. Una oferta flash genera urgencia.'
                        : 'Basado en tu historial y preferencias de clientas.',
            };

            setAiAnalysis(analysis);

            // Llamar a la API para generar mensaje
            try {
                // Calcular métricas del dashboard para enviar a la IA
                const inactivos30Count = clientes.filter((c: any) =>
                    (c.dias_ausentes >= 30 || c.diasAusentes >= 30)
                ).length;
                const inactivos60Count = clientes.filter((c: any) =>
                    (c.dias_ausentes >= 60 || c.diasAusentes >= 60)
                ).length;

                const dashboardMetrics = {
                    totalClients: totalClients,
                    inactiveClients30: inactivos30Count,
                    inactiveClients60: inactivos60Count,
                    occupancyRate: 65, // Default o calculado
                    segmentCount: segmentCount,
                };

                const response = await campaigns.generate({
                    objective,
                    tone: 'amigable',
                    promo,
                    segment,
                    emotionalTrigger: trigger,
                    businessId: businessId,
                    businessName: brief.businessName || 'Tu Salón',
                    segmentCount: segmentCount,
                    // Métricas del dashboard para el prompt PRO
                    dashboardMetrics,
                    // Fecha clave si existe
                    keyDate: monthCard.keyDates?.[0]?.name || null,
                });

                if (response?.message) {
                    setGeneratedMessage(response.message);
                    setEditedMessage(response.message);

                    // Guardar tips de IA
                    if (response.ideaImagen) setAiImageIdea(response.ideaImagen);
                    if (response.tipsWhatsApp) setAiTipsWhatsApp(response.tipsWhatsApp);
                    if (response.ideaVideo) setAiVideoIdea(response.ideaVideo);
                    if (response.koratFlowTip) setKoratFlowTip(response.koratFlowTip);

                    // Actualizar análisis con conteo real si viene del backend
                    if (response.segmentCountReal && aiAnalysis) {
                        setAiAnalysis({
                            ...analysis,
                            segmentCount: response.segmentCountReal,
                            estimatedRevenue: response.segmentCountReal * avgTicket * 0.15,
                            estimatedReach: response.segmentCountReal,
                        });
                    }
                } else {
                    // Fallback local
                    const fallbackMessage = generateFallbackMessage(objective, analysis, brief);
                    setGeneratedMessage(fallbackMessage);
                    setEditedMessage(fallbackMessage);
                }
            } catch {
                // Fallback local si falla IA
                const fallbackMessage = generateFallbackMessage(objective, analysis, brief);
                setGeneratedMessage(fallbackMessage);
                setEditedMessage(fallbackMessage);
            }

            // Calcular fecha sugerida (próximo jueves 10am)
            const now = new Date();
            const daysUntilThursday = (4 - now.getDay() + 7) % 7 || 7;
            const suggestedDate = new Date(now);
            suggestedDate.setDate(now.getDate() + daysUntilThursday);
            suggestedDate.setHours(10, 0, 0, 0);
            setScheduledDate(suggestedDate.toISOString().slice(0, 16));

        } catch (error) {
            console.error('Error generando campaña:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Fallback para generar mensaje localmente (si falla la IA)
    const generateFallbackMessage = (objective: ObjectiveType, analysis: AIAnalysis, brief: any): string => {
        const businessName = brief.businessName || 'Tu Salón';
        const topService = brief.topService1 || 'servicio';

        const messages: Record<string, string> = {
            'llenar_agenda': `¡Hola! 👋

Tenemos algunos espacios libres esta semana y pensé en ti...

⚡ Te tenemos ${analysis.promoLabel} en tu ${topService}. Es una oportunidad que no podía dejar pasar sin avisarte.

Solo nos quedan 5 espacios disponibles y quiero que aproveches antes de que se llenen.

¿Te reservo para mañana o el viernes? 💅

Con cariño,
${businessName}`,

            'recuperar_inactivos': `¡Hola! 💕

Hace tiempo que no te vemos por aquí y te extrañamos... tu sillón favorito está esperándote 🥺

Queremos que vuelvas, por eso te preparamos algo especial: ${analysis.promoLabel} en tu ${topService} favorito.

Esta oferta es solo para ti y solo por esta semana.

¿Qué dices? ¿Te guardo un espacio? ¿Mañana o el viernes? 💅

Con cariño,
${businessName}`,

            'evento_especial': `¡Hola! 🎉

¿Ya tienes todo listo para brillar en tu fecha especial?

Queremos que te veas increíble, por eso te tenemos ${analysis.promoLabel} en servicios seleccionados.

No dejes tu cita para último momento... los espacios se llenan rápido ✨

¿Cuándo te agendo? ¿Esta semana o la próxima? 💅

Con cariño,
${businessName}`,

            'sorprendeme': `¡Hola! ✨

Tengo algo especial para ti que no quería que te perdieras...

${analysis.promoLabel} en tu ${topService}. Sí, como lo lees 😍

Es nuestra forma de consentirte. Pero ojo, solo tenemos espacios limitados.

¿Te lo reservo? ¿Mañana te queda bien? 💅

Con cariño,
${businessName}`,
        };

        return messages[objective] || messages['sorprendeme'];
    };

    // Regenerar mensaje
    const handleRegenerate = async () => {
        if (!selectedObjective || !aiAnalysis) return;
        setIsGenerating(true);

        try {
            const user = localStorage.getItem('korat_user');
            const businessId = user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';
            const briefData = localStorage.getItem(`business_brief_${businessId}`);
            const brief = briefData ? JSON.parse(briefData) : {};

            const response = await campaigns.generate({
                objective: selectedObjective,
                tone: 'amigable',
                promo: aiAnalysis.promoType,
                segment: OBJECTIVE_TO_SEGMENT[selectedObjective] || 'todas',
                emotionalTrigger: aiAnalysis.emotionalTrigger,
                businessId: businessId,
                businessName: brief.businessName || 'Tu Salón',
                segmentCount: aiAnalysis.segmentCount,
                regenerate: true,
                dashboardMetrics: {
                    totalClients: clients?.length || 0,
                    segmentCount: aiAnalysis.segmentCount,
                },
            });

            if (response?.message) {
                setGeneratedMessage(response.message);
                setEditedMessage(response.message);
            }
        } catch (error) {
            console.error('Error regenerando:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    // Lanzar campaña
    const handleLaunch = async (immediate: boolean = false) => {
        if (!selectedObjective || !aiAnalysis) return;
        setIsLaunching(true);

        const finalMessage = isEditing ? editedMessage : generatedMessage;
        const launchDate = immediate ? new Date().toISOString() : scheduledDate;

        const choices: CampaignChoices = {
            objective: selectedObjective,
            segment: OBJECTIVE_TO_SEGMENT[selectedObjective] as any || 'todas',
            promo: aiAnalysis.promoType as any,
            emotionalTrigger: aiAnalysis.emotionalTrigger as any,
            tone: 'amigable',
            timing: immediate ? 'ahora' : 'fecha_especifica',
            scheduledDateTime: launchDate,
        };

        const finalRecipients = customRecipients ?? aiAnalysis.segmentCount;
        const adjustedRevenue = aiAnalysis.estimatedRevenue * (finalRecipients / aiAnalysis.segmentCount);

        const newCampaign: GeneratedCampaign = {
            id: `camp-${Date.now()}`,
            monthCard: { month: monthCard.month, year: monthCard.year },
            choices,
            title: `Campaña ${selectedObjective === 'recuperar_inactivos' ? 'Recuperación' :
                selectedObjective === 'llenar_agenda' ? 'Agenda Flash' : 'Express'}`,
            message: finalMessage,
            estimatedReach: finalRecipients,
            estimatedRevenue: adjustedRevenue,
            status: immediate ? 'enviada' : 'scheduled',
            scheduledDate: launchDate,
            createdAt: new Date().toISOString(),
            mode: 'express',
            segmentCount: finalRecipients,
        };

        // Guardar en Supabase
        try {
            const businessId = localStorage.getItem('korat_business_id') || 'biz-demo';

            const createdCampaign = await campaigns.create({
                business_id: businessId,
                titulo: newCampaign.title,
                mensaje: finalMessage,
                objetivo: selectedObjective,
                tono: 'amigable',
                tipo_promo: aiAnalysis.promoType,
                segmento: choices.segment,
                ingreso_estimado: adjustedRevenue,
                clientes_objetivo: finalRecipients,
                estado: immediate ? 'enviando' : 'programada',
                fecha_programada: launchDate,
                mes: monthCard.month + 1,
                anio: monthCard.year,
                // Guardar guía creativa
                idea_imagen: aiImageIdea ? JSON.stringify(aiImageIdea) : null,
                idea_video: aiVideoIdea ? JSON.stringify(aiVideoIdea) : null,
                tips_whatsapp: aiTipsWhatsApp ? JSON.stringify(aiTipsWhatsApp) : null,
                koratflow_tip: koratFlowTip || null,
            });
            console.log('✅ Campaña guardada (POST /campanas):', createdCampaign);

            // Si es lanzamiento inmediato, enviar la campaña
            if (immediate && createdCampaign?.id) {
                console.log('📤 Iniciando envío de campaña con ID:', createdCampaign.id);
                const sendResult = await campaigns.send(createdCampaign.id) as any;
                console.log('✅ Campaña enviada:', sendResult);

                // Verificar si el cooldown bloqueó el envío
                if (sendResult?.puedeEnviar === false || sendResult?.bloqueado) {
                    const razon = sendResult?.razon_bloqueo || sendResult?.razon || 'limite';
                    const infoExtra = sendResult?.info_extra || '';
                    let msg = '⏳ ';
                    switch (razon) {
                        case 'cooldown_activo': msg += `Cooldown activo — ${infoExtra || 'intenta más tarde'}`; break;
                        case 'cooldown_minimo': msg += `Cooldown mínimo — ${infoExtra}`; break;
                        case 'limite_semanal': msg += `Límite semanal alcanzado: ${infoExtra || '2/2'}`; break;
                        case 'limite_diario': msg += `Límite diario alcanzado (30 msgs/día)`; break;
                        case 'horario_no_seguro': msg += `Fuera de horario seguro (9AM-8PM). ${infoExtra}`; break;
                        default: msg += `Envío bloqueado: ${razon}. ${infoExtra}`;
                    }
                    showToast(msg, 'error');
                } else {
                    const totalEnviados = sendResult?.total_enviados || sendResult?.mensajes_enviados || aiAnalysis?.segmentCount || 0;
                    const segmentoNombre = aiAnalysis?.segmentName || 'el segmento seleccionado';
                    const estimatedMin = Math.max(1, Math.round((totalEnviados * 25) / 60));
                    showToast(`🚀 ¡Campaña enviada! ${totalEnviados} mensajes a ${segmentoNombre} (~${estimatedMin} min)`, 'success');
                }
            } else if (immediate) {
                console.warn('⚠️ No se puede enviar: createdCampaign.id es undefined');
                showToast('⚠️ Campaña guardada pero no se pudo enviar. Revisa la consola.', 'error');
            } else {
                // Campaña programada
                showToast(`📅 Campaña programada para ${new Date(scheduledDate).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`, 'success');
            }
        } catch (err: any) {
            console.warn('⚠️ Error guardando/enviando campaña:', err);
            const errorMsg = err?.message || '';
            if (errorMsg.includes('cooldown') || errorMsg.includes('limite') || errorMsg.includes('bloqueado')) {
                showToast(`⏳ ${errorMsg}`, 'error');
            } else {
                showToast('❌ Error al guardar/enviar la campaña', 'error');
            }
        }

        setIsLaunching(false);
        onCampaignCreated(newCampaign);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all transform animate-slide-in ${toast.type === 'success'
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                    }`}>
                    {toast.type === 'success' ? (
                        <CheckCircle2 size={20} />
                    ) : (
                        <AlertCircle size={20} />
                    )}
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}

            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-primary/5 to-violet-500/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Modo Express
                                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded-full font-medium">
                                    ⚡ IA
                                </span>
                            </h2>
                            <p className="text-sm text-gray-500">
                                {MONTH_NAMES[monthCard.month]} {monthCard.year} • Paso {currentStep} de 3
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex gap-1 px-4 pt-4">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`flex-1 h-1.5 rounded-full transition-colors ${step <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 160px)' }}>
                    {/* STEP 1: Elegir objetivo */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                    ¿Qué quieres lograr hoy?
                                </h3>
                                <p className="text-gray-500">
                                    Elige una opción y la IA hará el resto
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {EXPRESS_OBJECTIVE_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => {
                                            setSelectedObjective(option.value as ObjectiveType);
                                            generateCampaign(option.value as ObjectiveType);
                                        }}
                                        disabled={isGenerating}
                                        className={`relative p-4 rounded-xl border-2 text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] ${option.isRecommended
                                            ? 'border-primary/50 bg-primary/5 hover:border-primary'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {option.isRecommended && (
                                            <span className="absolute -top-2 left-4 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full">
                                                RECOMENDADO
                                            </span>
                                        )}
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl">{option.icon}</span>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                                    {option.label}
                                                </h4>
                                                <p className="text-sm text-gray-500 mt-0.5">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {/* Instrucción visual */}
                            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                                👆 Haz clic en una opción para que la IA genere tu campaña automáticamente
                            </p>
                        </div>
                    )}

                    {/* STEP 2: IA Genera */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            {isGenerating ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                                        <Sparkles className="w-8 h-8 text-black" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        Generando tu campaña...
                                    </h3>
                                    <p className="text-gray-500">
                                        Analizando tu brief, métricas y comportamiento de clientes
                                    </p>
                                    <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-400">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Esto toma unos segundos...</span>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* AI Analysis Card */}
                                    {aiAnalysis && (
                                        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-dark-bg dark:to-dark-card border border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="w-4 h-4 text-primary" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Análisis de IA
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                                {aiAnalysis.reason}
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                <div className="p-3 rounded-lg bg-white dark:bg-dark-bg border border-gray-100 dark:border-gray-700">
                                                    <Users className="w-4 h-4 text-blue-500 mb-1" />
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {aiAnalysis.segmentCount}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">Destinatarios</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-white dark:bg-dark-bg border border-gray-100 dark:border-gray-700">
                                                    <Target className="w-4 h-4 text-purple-500 mb-1" />
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {aiAnalysis.promoLabel}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">Promoción</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-white dark:bg-dark-bg border border-gray-100 dark:border-gray-700">
                                                    <Calendar className="w-4 h-4 text-amber-500 mb-1" />
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {aiAnalysis.suggestedDay}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">{aiAnalysis.suggestedTime}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-white dark:bg-dark-bg border border-gray-100 dark:border-gray-700">
                                                    <DollarSign className="w-4 h-4 text-green-500 mb-1" />
                                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {currencySymbol}{Math.round(aiAnalysis.estimatedRevenue)}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">Estimado</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Generated Message */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    Mensaje generado
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={handleRegenerate}
                                                    disabled={isGenerating}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                >
                                                    <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                                                    Regenerar
                                                </button>
                                                <button
                                                    onClick={() => setIsEditing(!isEditing)}
                                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                    {isEditing ? 'Listo' : 'Editar'}
                                                </button>
                                            </div>
                                        </div>

                                        {isEditing ? (
                                            <textarea
                                                value={editedMessage}
                                                onChange={(e) => setEditedMessage(e.target.value)}
                                                className="w-full h-40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                            />
                                        ) : (
                                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm">
                                                {formatMessage(generatedMessage)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Next button */}
                                    <button
                                        onClick={() => setCurrentStep(3)}
                                        className="w-full py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                    >
                                        Me gusta, continuar
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 3: Confirmar y lanzar */}
                    {currentStep === 3 && aiAnalysis && (
                        <div className="space-y-6">
                            <div className="text-center mb-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-3">
                                    <Check className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    ¡Campaña lista!
                                </h3>
                                <p className="text-gray-500">
                                    Revisa los detalles y lanza cuando quieras
                                </p>
                            </div>

                            {/* Summary */}
                            <div className="p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-gray-800 space-y-3">
                                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-sm text-gray-500">Objetivo</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {EXPRESS_OBJECTIVE_OPTIONS.find(o => o.value === selectedObjective)?.label}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-500">Destinatarios</span>
                                        <span className="text-[10px] text-gray-400 italic">*Puedes ajustar la cantidad</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            max={aiAnalysis.segmentCount}
                                            value={customRecipients ?? aiAnalysis.segmentCount}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (val > 0 && val <= aiAnalysis.segmentCount) {
                                                    setCustomRecipients(val);
                                                }
                                            }}
                                            className="w-16 px-2 py-1 text-sm font-medium text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                        />
                                        <span className="text-xs text-gray-400">
                                            / {aiAnalysis.segmentCount} ({aiAnalysis.segmentName})
                                        </span>
                                    </div>
                                </div>

                                {/* Envío por partes */}
                                <div className="py-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Users size={14} className="text-primary" />
                                            <span className="text-sm text-gray-500">Enviar por partes</span>
                                            <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full font-bold">Anti-ban</span>
                                        </div>
                                        <button
                                            onClick={() => setSendInParts(!sendInParts)}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${sendInParts ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${sendInParts ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                    {sendInParts && (
                                        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Mensajes por día:</span>
                                                <div className="flex gap-1.5">
                                                    {[10, 15, 20, 25].map((size) => (
                                                        <button
                                                            key={size}
                                                            onClick={() => setBatchSize(size)}
                                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${batchSize === size
                                                                ? 'bg-primary text-white shadow-sm'
                                                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                                }`}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-primary-dark dark:text-primary font-medium">
                                                <span>📊</span>
                                                <span>
                                                    {batchSize} msgs/día × {Math.ceil((customRecipients ?? aiAnalysis.segmentCount) / batchSize)} días = {customRecipients ?? aiAnalysis.segmentCount} total
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 italic">
                                                💡 Enviar en lotes reduce el riesgo de bloqueo y mejora la tasa de entrega.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <span className="text-sm text-gray-500">Ingreso estimado</span>
                                    <span className="text-sm font-bold text-green-600">
                                        ~{currencySymbol}{Math.round(aiAnalysis.estimatedRevenue * ((customRecipients ?? aiAnalysis.segmentCount) / aiAnalysis.segmentCount))}
                                    </span>
                                </div>
                            </div>

                            {/* CREATIVE RECOMMENDATIONS SECTION - Powered by AI */}
                            <div className="mt-4">
                                <button
                                    onClick={() => setShowCreativeTips(!showCreativeTips)}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/30 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <Lightbulb size={18} className="text-amber-600 dark:text-amber-400" />
                                        <span className="font-bold text-amber-800 dark:text-amber-300">🤖 Recomendaciones de Nilah</span>
                                        <span className="text-xs bg-gradient-to-r from-violet-500 to-violet-600 text-white px-2 py-0.5 rounded-full font-medium">IA</span>
                                    </div>
                                    {showCreativeTips ? <ChevronUp size={18} className="text-amber-600" /> : <ChevronDown size={18} className="text-amber-600" />}
                                </button>

                                {showCreativeTips && (
                                    <div className="mt-3 p-4 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border space-y-4">

                                        {/* 1. IDEA DE IMAGEN/FLYER */}
                                        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-800/30 flex items-center justify-center flex-shrink-0">
                                                    <Image size={20} className="text-rose-600 dark:text-rose-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm mb-2">📸 Idea para tu Imagen/Flyer</h4>
                                                    {typeof aiImageIdea === 'object' && aiImageIdea ? (
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                                                                <strong>Descripción:</strong> {aiImageIdea.descripcion}
                                                            </p>
                                                            <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                                                                <strong>Elementos clave:</strong> {aiImageIdea.elementosClaves}
                                                            </p>
                                                            <p className="text-xs text-rose-600 dark:text-rose-300 font-medium bg-rose-100 dark:bg-rose-800/40 p-2 rounded-lg">
                                                                💬 Texto sugerido: "{aiImageIdea.textoSugerido}"
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                                                            Foto de tu mejor trabajo con la promoción visible. Incluye logo y número de WhatsApp.
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 mt-2">
                                                        <Zap size={10} />
                                                        <span>Las imágenes con personas reales generan 38% más interacción.</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. TIPS DE WHATSAPP */}
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-800/30 flex items-center justify-center flex-shrink-0">
                                                    <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-2">📱 Tips para tu campaña de WhatsApp</h4>
                                                    <ul className="space-y-1.5">
                                                        {(aiTipsWhatsApp && aiTipsWhatsApp.length > 0 ? aiTipsWhatsApp : [
                                                            '📱 Envía entre 10-11 AM o 7-8 PM para mejor respuesta',
                                                            '⏰ Da seguimiento en 24h si no responden',
                                                            '📸 Adjunta una imagen junto con el mensaje'
                                                        ]).map((tip, index) => (
                                                            <li key={index} className="text-xs text-green-700 dark:text-green-400 leading-relaxed flex items-start gap-1">
                                                                <span className="mt-0.5">•</span>
                                                                <span>{tip}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 3. IDEA DE VIDEO/REEL */}
                                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center flex-shrink-0">
                                                    <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm mb-2">🎬 Tip: Crea un Video Reel (15-30 seg)</h4>
                                                    {aiVideoIdea ? (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                                                                🎯 "{aiVideoIdea.titulo}"
                                                            </p>
                                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                                <strong>Concepto:</strong> {aiVideoIdea.concepto}
                                                            </p>
                                                            <div className="text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-800/40 p-2 rounded-lg">
                                                                <strong>Estructura:</strong> {aiVideoIdea.estructura}
                                                            </div>
                                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                                                                💡 {aiVideoIdea.porqueCrearlo}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                                <strong>Concepto:</strong> Muestra tu servicio en acción con música trending.
                                                            </p>
                                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                                <strong>Estructura:</strong> HOOK (pregunta intrigante) → Proceso del servicio → CTA
                                                            </p>
                                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                                                                💡 Los videos tienen 3x más engagement que las imágenes.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4. KORAT FLOW TIP - Mención sutil */}
                                        {koratFlowTip && (
                                            <div className="pt-3 border-t border-gray-100 dark:border-dark-border">
                                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                                    {koratFlowTip}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Schedule picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Programar para:
                                </label>
                                <input
                                    type="datetime-local"
                                    value={scheduledDate}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-bg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            {/* Action buttons */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => handleLaunch(false)}
                                    disabled={isLaunching}
                                    className="py-3 px-4 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    <Calendar className="w-4 h-4" />
                                    Programar
                                </button>
                                <button
                                    onClick={() => handleLaunch(true)}
                                    disabled={isLaunching}
                                    className="py-3 px-4 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {isLaunching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Lanzar ahora
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {currentStep > 1 && currentStep < 3 && !isGenerating && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-border">
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Atrás
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignBuilderExpress;
