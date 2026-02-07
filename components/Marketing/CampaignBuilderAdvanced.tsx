/**
 * CampaignBuilderAdvanced Component
 * Modal wizard de 6 pasos para crear campañas con control total
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowLeft, ArrowRight, Loader2, Settings } from 'lucide-react';
import WizardStep from './WizardStep';
import CampaignSummary from './CampaignSummary';
import {
    CampaignChoices,
    WizardOption,
    KeyDate,
    MonthCard,
    GeneratedCampaign,
    ObjectiveType,
    SegmentType,
    PromoType,
    EmotionalTriggerType,
    ToneType,
    TimingType,
} from '../../types/campaignBuilderTypes';
import {
    WIZARD_STEPS_ADVANCED,
    OBJECTIVE_OPTIONS,
    SEGMENT_OPTIONS,
    PROMO_OPTIONS,
    EMOTIONAL_TRIGGER_OPTIONS,
    TONE_OPTIONS,
    TIMING_OPTIONS,
} from '../../services/campaignWizardOptions';
import { MONTH_NAMES } from '../../services/campaignMockData';
import { campaigns } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';

interface CampaignBuilderAdvancedProps {
    isOpen: boolean;
    onClose: () => void;
    monthCard: MonthCard;
    currencySymbol: string;
    onCampaignCreated: (campaign: GeneratedCampaign) => void;
}

const INITIAL_CHOICES: CampaignChoices = {
    objective: null,
    segment: null,
    promo: null,
    emotionalTrigger: null,
    tone: null,
    timing: null,
    scheduledDateTime: undefined,
};

// Generador de mensajes basado en las elecciones
const generateCampaignMessage = (
    choices: CampaignChoices,
    currencySymbol: string,
    businessName: string = 'Tu Salón'
): string => {
    const { objective, emotionalTrigger, promo, tone } = choices;

    // Saludos según tono
    const greetings: Record<string, string> = {
        amigable: '¡Hola! 👋',
        profesional: 'Estimada clienta,',
        divertido: '¡Hey guapa! 🔥✨',
        elegante: '✨ Querida clienta,',
        directo: 'Hola,',
        emotivo: '💕 Hola querida,',
    };

    // Mensajes por disparador emocional
    const triggerMessages: Record<string, string> = {
        recompensa: 'Te lo mereces después de tanto esfuerzo.',
        urgencia: '⏰ Solo por tiempo limitado.',
        exclusividad: 'Esto es solo para clientas especiales como tú.',
        nostalgia: 'Te extrañamos... hace tiempo que no te vemos.',
        prueba_social: 'Todas están aprovechando esta oportunidad.',
        ocasion_especial: 'Prepárate para brillar en tu gran día.',
        mantenimiento: '¿Ya toca tu retoque? Tu look te extraña.',
        transformacion: 'Es momento de reinventarte.',
    };

    // Promociones
    const promoMessages: Record<string, string> = {
        descuento_10: '🏷️ 10% OFF en tu próximo servicio',
        descuento_15: '🏷️ 15% OFF especial para ti',
        descuento_20: '🏷️ 20% de descuento',
        '2x1_amigas': '👯 Ven con tu amiga y solo paga una',
        combo_personalizado: '📦 Paquete especial a precio increíble',
        flash_24h: '⚡ Oferta flash - Solo 24 horas',
        puntos_dobles: '⭐ Puntos dobles esta semana',
        exclusivo_whatsapp: '📱 Oferta exclusiva solo por este mensaje',
    };

    // CTAs según tono
    const ctas: Record<string, string> = {
        amigable: '¿Te reservo? 💅',
        profesional: 'Aguardamos su reserva.',
        divertido: '¡Dale que te reserve! 🚀',
        elegante: 'Le esperamos.',
        directo: '¿Agendamos?',
        emotivo: '¿Nos vemos pronto? 💖',
    };

    const greeting = greetings[tone || 'amigable'];
    const trigger = triggerMessages[emotionalTrigger || 'recompensa'];
    const promoMsg = promoMessages[promo || 'descuento_20'] || '🏷️ Promoción especial';
    const cta = ctas[tone || 'amigable'];

    return `${greeting}\n\n${trigger}\n\n${promoMsg}\n\n${cta}\n\nCon cariño, ${businessName}`;
};

const CampaignBuilderAdvanced: React.FC<CampaignBuilderAdvancedProps> = ({
    isOpen,
    onClose,
    monthCard,
    currencySymbol,
    onCampaignCreated,
}) => {
    const { data } = useDashboardData();
    const [currentStep, setCurrentStep] = useState(1);
    const [choices, setChoices] = useState<CampaignChoices>(INITIAL_CHOICES);
    const [showSummary, setShowSummary] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [scheduledDateTime, setScheduledDateTime] = useState('');

    // Estados para datos generados por la IA - Nueva estructura
    const [aiImageIdea, setAiImageIdea] = useState<any>(null);
    const [aiTipsWhatsApp, setAiTipsWhatsApp] = useState<string[] | null>(null);
    const [aiVideoIdea, setAiVideoIdea] = useState<any>(null);
    const [koratFlowTip, setKoratFlowTip] = useState<string | null>(null);
    const [aiEstimatedReach, setAiEstimatedReach] = useState<number | null>(null);
    const [aiEstimatedRevenue, setAiEstimatedRevenue] = useState<number | null>(null);

    // Calcular conteos de segmentos dinamicamente
    const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({});

    // Reset cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setChoices(INITIAL_CHOICES);
            setShowSummary(false);
            setGeneratedMessage('');
            setAiImageIdea(null);
            setAiTipsWhatsApp(null);
            setAiVideoIdea(null);
            setKoratFlowTip(null);
            setAiEstimatedReach(null);
            setAiEstimatedRevenue(null);
            setScheduledDateTime('');

            // Calcular segmentos basados en datos reales
            const totalClients = data?.clientes?.length || 100;
            setSegmentCounts({
                todas: totalClients,
                activas_frecuentes: Math.floor(totalClients * 0.2),
                activas_regulares: Math.floor(totalClients * 0.35),
                inactivas_30: Math.floor(totalClients * 0.15),
                inactivas_60: Math.floor(totalClients * 0.1),
                inactivas_90: Math.floor(totalClients * 0.1),
                cumpleaneras: Math.floor(totalClients * 0.05),
                nuevas_recientes: Math.floor(totalClients * 0.08),
                alto_valor: Math.floor(totalClients * 0.12),
            });
        }
    }, [isOpen, data]);

    // Obtener opciones del paso actual con conteos
    const getStepOptions = (stepIndex: number): WizardOption[] => {
        switch (stepIndex) {
            case 0: return OBJECTIVE_OPTIONS;
            case 1:
                // Agregar conteos a las opciones de segmento
                return SEGMENT_OPTIONS.map(opt => ({
                    ...opt,
                    count: segmentCounts[opt.value] || 0,
                    description: `${opt.description} (${segmentCounts[opt.value] || 0} clientas)`,
                }));
            case 2:
                // Filtrar promos recomendadas según objetivo
                return PROMO_OPTIONS.map(opt => ({
                    ...opt,
                    isRecommended: opt.suggestedFor?.includes(choices.objective as ObjectiveType) || false,
                }));
            case 3: return EMOTIONAL_TRIGGER_OPTIONS;
            case 4: return TONE_OPTIONS;
            case 5: return TIMING_OPTIONS;
            default: return [];
        }
    };

    const handleSelect = (value: string) => {
        const stepKeys: (keyof CampaignChoices)[] = ['objective', 'segment', 'promo', 'emotionalTrigger', 'tone', 'timing'];
        const stepKey = stepKeys[currentStep - 1];
        setChoices((prev) => ({
            ...prev,
            [stepKey]: value,
        }));
    };

    const handleNext = async () => {
        if (currentStep < 6) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Paso final: generar mensaje con IA
            setIsGenerating(true);

            try {
                const user = localStorage.getItem('korat_user');
                const businessId = user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';
                const briefData = localStorage.getItem(`business_brief_${businessId}`);
                const brief = briefData ? JSON.parse(briefData) : {};
                const businessName = brief.businessName || 'Tu Salón';

                // Llamar a la API de generación
                const totalClients = data?.clientes?.length || 100;
                const segmentCount = segmentCounts[choices.segment || 'todas'] || 50;

                const response = await campaigns.generate({
                    objective: choices.objective,
                    tone: choices.tone,
                    promo: choices.promo,
                    segment: choices.segment,
                    emotionalTrigger: choices.emotionalTrigger,
                    businessId,
                    businessName,
                    segmentCount,
                    // Métricas del dashboard para el prompt PRO
                    dashboardMetrics: {
                        totalClients,
                        inactiveClients30: Math.floor(totalClients * 0.15),
                        inactiveClients60: Math.floor(totalClients * 0.1),
                        occupancyRate: 65,
                        segmentCount,
                    },
                    // Fecha clave si existe
                    keyDate: monthCard.keyDates?.[0]?.name || null,
                });

                if (response?.message) {
                    setGeneratedMessage(response.message);
                    // Nueva estructura de datos de IA
                    if (response.ideaImagen) setAiImageIdea(response.ideaImagen);
                    if (response.tipsWhatsApp) setAiTipsWhatsApp(response.tipsWhatsApp);
                    if (response.ideaVideo) setAiVideoIdea(response.ideaVideo);
                    if (response.koratFlowTip) setKoratFlowTip(response.koratFlowTip);
                    if (response.estimatedReach) setAiEstimatedReach(response.estimatedReach);
                    if (response.estimatedRevenue) setAiEstimatedRevenue(response.estimatedRevenue);
                } else {
                    // Fallback local
                    const message = generateCampaignMessage(choices, currencySymbol, businessName);
                    setGeneratedMessage(message);
                }
            } catch (err) {
                console.warn('AI generation failed, using local fallback:', err);
                const user = localStorage.getItem('korat_user');
                const businessId = user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';
                const briefData = localStorage.getItem(`business_brief_${businessId}`);
                const brief = briefData ? JSON.parse(briefData) : {};
                const message = generateCampaignMessage(choices, currencySymbol, brief.businessName || 'Tu Salón');
                setGeneratedMessage(message);
            } finally {
                setIsGenerating(false);
            }

            // Calcular estimaciones si no vinieron de IA
            const segmentCount = segmentCounts[choices.segment || 'todas'] || 50;
            const avgTicket = 80; // Default
            if (!aiEstimatedReach) setAiEstimatedReach(segmentCount);
            if (!aiEstimatedRevenue) setAiEstimatedRevenue(segmentCount * avgTicket * 0.15);

            setShowSummary(true);
        }
    };

    const handleBack = () => {
        if (showSummary) {
            setShowSummary(false);
        } else if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleLaunch = async () => {
        const user = localStorage.getItem('korat_user');
        const businessId = user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';

        const newCampaign: GeneratedCampaign = {
            id: `camp-${Date.now()}`,
            monthCard: { month: monthCard.month, year: monthCard.year },
            choices,
            title: `Campaña ${MONTH_NAMES[monthCard.month]}`,
            message: generatedMessage,
            estimatedReach: aiEstimatedReach ?? segmentCounts[choices.segment || 'todas'] ?? 50,
            estimatedRevenue: aiEstimatedRevenue ?? 800,
            status: 'enviada',
            createdAt: new Date().toISOString(),
            mode: 'advanced',
            segmentCount: segmentCounts[choices.segment || 'todas'],
            aiImageIdea: aiImageIdea || undefined,
            aiTipsWhatsApp: aiTipsWhatsApp || undefined,
            aiVideoIdea: aiVideoIdea || undefined,
        };

        // Guardar en Supabase
        try {
            const createdCampaign = await campaigns.create({
                business_id: businessId,
                titulo: newCampaign.title,
                mensaje: newCampaign.message,
                objetivo: choices.objective,
                tono: choices.tone,
                tipo_promo: choices.promo,
                segmento: choices.segment,
                ingreso_estimado: newCampaign.estimatedRevenue,
                clientes_objetivo: newCampaign.segmentCount,
                estado: 'enviando', // Estado mientras se envía
                mes: monthCard.month + 1,
                anio: monthCard.year,
            });
            console.log('✅ Campaña guardada en Supabase:', createdCampaign);

            // Enviar la campaña (llamar al flujo n8n de envío)
            if (createdCampaign?.id) {
                console.log('📤 Iniciando envío de campaña...');
                const sendResult = await campaigns.send(createdCampaign.id);
                console.log('✅ Campaña enviada:', sendResult);
            }
        } catch (err) {
            console.warn('⚠️ Error guardando/enviando campaña:', err);
        }

        onCampaignCreated(newCampaign);
        onClose();
    };

    const handleSchedule = async () => {
        const user = localStorage.getItem('korat_user');
        const businessId = user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';

        const scheduleDate = scheduledDateTime || new Date(Date.now() + 86400000).toISOString();

        const newCampaign: GeneratedCampaign = {
            id: `camp-${Date.now()}`,
            monthCard: { month: monthCard.month, year: monthCard.year },
            choices: { ...choices, scheduledDateTime: scheduleDate },
            title: `Campaña ${MONTH_NAMES[monthCard.month]}`,
            message: generatedMessage,
            estimatedReach: aiEstimatedReach ?? segmentCounts[choices.segment || 'todas'] ?? 50,
            estimatedRevenue: aiEstimatedRevenue ?? 800,
            status: 'scheduled',
            scheduledDate: scheduleDate,
            createdAt: new Date().toISOString(),
            mode: 'advanced',
            segmentCount: segmentCounts[choices.segment || 'todas'],
        };

        // Guardar en Supabase
        try {
            await campaigns.create({
                business_id: businessId,
                titulo: newCampaign.title,
                mensaje: newCampaign.message,
                objetivo: choices.objective,
                tono: choices.tone,
                tipo_promo: choices.promo,
                segmento: choices.segment,
                ingreso_estimado: newCampaign.estimatedRevenue,
                clientes_objetivo: newCampaign.segmentCount,
                estado: 'programada',
                fecha_programada: scheduleDate,
                mes: monthCard.month + 1,
                anio: monthCard.year,
            });
            console.log('✅ Campaña programada guardada');
        } catch (err) {
            console.warn('⚠️ Error guardando campaña:', err);
        }

        onCampaignCreated(newCampaign);
        onClose();
    };

    // Regenerar mensaje
    const handleRegenerate = async () => {
        setIsGenerating(true);
        try {
            const user = localStorage.getItem('korat_user');
            const businessId = user ? `biz-${JSON.parse(user).email?.split('@')[0]}` : 'biz-demo';
            const briefData = localStorage.getItem(`business_brief_${businessId}`);
            const brief = briefData ? JSON.parse(briefData) : {};

            const response = await campaigns.generate({
                objective: choices.objective,
                tone: choices.tone,
                promo: choices.promo,
                segment: choices.segment,
                emotionalTrigger: choices.emotionalTrigger,
                businessId,
                businessName: brief.businessName || 'Tu Salón',
                segmentCount: segmentCounts[choices.segment || 'todas'] || 50,
                regenerate: true,
                dashboardMetrics: {
                    totalClients: data?.clientes?.length || 100,
                    segmentCount: segmentCounts[choices.segment || 'todas'] || 50,
                },
            });

            if (response?.message) {
                setGeneratedMessage(response.message);
                // Nueva estructura de datos de IA
                if (response.ideaImagen) setAiImageIdea(response.ideaImagen);
                if (response.tipsWhatsApp) setAiTipsWhatsApp(response.tipsWhatsApp);
                if (response.ideaVideo) setAiVideoIdea(response.ideaVideo);
                if (response.koratFlowTip) setKoratFlowTip(response.koratFlowTip);
            } else {
                const message = generateCampaignMessage(choices, currencySymbol, brief.businessName || 'Tu Salón');
                setGeneratedMessage(message);
            }
        } catch (err) {
            console.warn('Regeneration failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const getCurrentStepConfig = () => {
        const config = WIZARD_STEPS_ADVANCED[currentStep - 1];
        return {
            ...config,
            options: getStepOptions(currentStep - 1),
        };
    };

    const getCurrentValue = (): string | null => {
        const keys: (keyof CampaignChoices)[] = ['objective', 'segment', 'promo', 'emotionalTrigger', 'tone', 'timing'];
        return choices[keys[currentStep - 1]] as string | null;
    };

    if (!isOpen) return null;

    const stepConfig = getCurrentStepConfig();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">
                                {showSummary ? 'Campaña Lista' : 'Modo Avanzado'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {MONTH_NAMES[monthCard.month]} {monthCard.year} • Paso {currentStep} de 6
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex gap-1 px-4 pt-2">
                    {[1, 2, 3, 4, 5, 6].map((step) => (
                        <div
                            key={step}
                            className={`flex-1 h-1 rounded-full transition-colors ${step <= currentStep || showSummary ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
                    {showSummary ? (
                        <CampaignSummary
                            choices={choices}
                            generatedMessage={generatedMessage}
                            estimatedReach={aiEstimatedReach ?? segmentCounts[choices.segment || 'todas'] ?? 50}
                            estimatedRevenue={aiEstimatedRevenue ?? 800}
                            keyDate={null}
                            monthYear={{ month: monthCard.month, year: monthCard.year }}
                            onEdit={() => setShowSummary(false)}
                            onSchedule={handleSchedule}
                            onLaunch={handleLaunch}
                            onEditMessage={setGeneratedMessage}
                            currencySymbol={currencySymbol}
                            aiImageIdea={aiImageIdea}
                            aiTipsWhatsApp={aiTipsWhatsApp}
                            aiVideoIdea={aiVideoIdea}
                            koratFlowTip={koratFlowTip}
                            onRegenerate={handleRegenerate}
                            isRegenerating={isGenerating}
                        />
                    ) : (
                        <WizardStep
                            stepNumber={currentStep}
                            totalSteps={6}
                            title={stepConfig.title}
                            question={stepConfig.question}
                            nilahMessage={stepConfig.nilahMessage}
                            options={stepConfig.options}
                            selectedValue={getCurrentValue()}
                            onSelect={handleSelect}
                            onBack={handleBack}
                            onNext={handleNext}
                            isFirstStep={currentStep === 1}
                            isLastStep={currentStep === 6}
                            isLoading={isGenerating}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignBuilderAdvanced;
