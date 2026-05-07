/**
 * CampaignBuilderWizard Component
 * Modal wizard de 5 pasos para crear campañas de forma gamificada
 */

import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import WizardStep from './WizardStep';
import CampaignSummary from './CampaignSummary';
import {
    CampaignChoices,
    WizardOption,
    KeyDate,
    MonthCard,
    GeneratedCampaign,
    ObjectiveType,
    ToneType,
    PromoType,
    ChannelType,
} from '../../types/campaignBuilderTypes';
import { WIZARD_STEPS, MONTH_NAMES } from '../../services/campaignMockData';
import { campaigns } from '../../services/api';

interface CampaignBuilderWizardProps {
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
    channel: null,
    launchDate: null,
    keyDateId: null,
};

// Generador de mensajes basado en las elecciones - MENSAJES PERSUASIVOS
const generateCampaignMessage = (
    choices: CampaignChoices,
    keyDate: KeyDate | null,
    currencySymbol: string
): string => {
    // Mensajes por objetivo y tono - sin mencionar fechas de forma forzada
    const templates: Record<string, Record<string, string[]>> = {
        // Objetivo: Nuevos Clientes
        new_clients: {
            fun: [
                `🎉 ¡Hey! ¿Aún no nos conoces?\n\n¡Esta es TU señal para consentirte! 💅`,
                `✨ Si nunca has venido... ¡no sabes lo que te pierdes! 🔥`,
            ],
            elegant: [
                `✨ Descubre por qué nuestras clientas repiten.\n\nExperiencia premium que mereces.`,
                `💎 Tu primera visita puede cambiar todo. Ven a comprobarlo.`,
            ],
            emotional: [
                `💕 Mereces ese momento solo para ti.\n\nDéjanos consentirte por primera vez.`,
                `🌸 Tu bienestar es nuestra misión. ¿Nos das la oportunidad de demostrártelo?`,
            ],
        },
        // Objetivo: Más Ventas
        sales: {
            fun: [
                `🔥 ¡Se vino lo bueno!\n\nEsta promo no va a durar para siempre... 👀`,
                `💥 ¡Llegó el momento de brillar sin excusas! ✨`,
            ],
            elegant: [
                `✨ Una oportunidad exclusiva para ti.\n\nPorque te lo mereces.`,
                `💎 Tratamientos premium a precios especiales. Solo por tiempo limitado.`,
            ],
            emotional: [
                `💝 Regálate algo especial.\n\nTú siempre das todo... ahora es tu turno.`,
                `🌟 Porque brillar no es un lujo, es tu derecho.`,
            ],
        },
        // Objetivo: Recuperar Inactivos
        recover_inactive: {
            fun: [
                `👋 ¡Oye! ¿Dónde te metiste?\n\nTe extrañamos por acá... 🥺`,
                `😏 Sabemos que nos extrañas también... ¡vuelve!`,
            ],
            elegant: [
                `✨ Ha pasado tiempo desde tu última visita.\n\nTe guardamos tu lugar.`,
                `💫 Queremos verte de nuevo. Y tenemos algo especial para ti.`,
            ],
            emotional: [
                `💕 No eres solo una clienta más.\n\nEres parte de nuestra familia y te echamos de menos.`,
                `🌸 Prometemos consentirte como la primera vez. ¿Volvemos a vernos?`,
            ],
        },
    };

    const promoMessages: Record<string, string> = {
        discount: `\n\n🏷️ Aprovecha 20% OFF en tu próximo servicio.`,
        bundle: `\n\n🎁 Ven con tu amiga y ¡ambas pagan mitad!`,
        flash_sale: `\n\n⚡ Solo 48 horas con precios de locura.`,
    };

    const objective = choices.objective || 'sales';
    const tone = choices.tone || 'elegant';
    const promo = choices.promo || 'discount';

    // Seleccionar mensaje aleatorio del array
    const messageOptions = templates[objective]?.[tone] || [];
    const baseMessage = messageOptions[Math.floor(Math.random() * messageOptions.length)] || '';
    const promoMessage = promoMessages[promo] || '';

    // CTA según canal
    let cta = '';
    if (choices.channel === 'whatsapp') {
        cta = '\n\n📱 Escríbeme para separar tu cita.';
    } else if (choices.channel === 'instagram') {
        cta = '\n\n📸 Dale like y comenta "QUIERO" para reservar.';
    } else if (choices.channel === 'reels') {
        cta = '\n\n🎬 Guarda este video y escríbeme por DM.';
    }

    return `${baseMessage}${promoMessage}${cta}`;
};

const CampaignBuilderWizard: React.FC<CampaignBuilderWizardProps> = ({
    isOpen,
    onClose,
    monthCard,
    currencySymbol,
    onCampaignCreated,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [choices, setChoices] = useState<CampaignChoices>(INITIAL_CHOICES);
    const [showSummary, setShowSummary] = useState(false);
    const [generatedMessage, setGeneratedMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Estados para datos generados por la IA
    const [aiImageIdea, setAiImageIdea] = useState<string | null>(null);
    const [aiReelIdea, setAiReelIdea] = useState<string | null>(null);
    const [aiEstimatedReach, setAiEstimatedReach] = useState<number | null>(null);
    const [aiEstimatedRevenue, setAiEstimatedRevenue] = useState<number | null>(null);

    // Reset cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setCurrentStep(1);
            setChoices(INITIAL_CHOICES);
            setShowSummary(false);
            setGeneratedMessage('');
            // Resetear datos de IA
            setAiImageIdea(null);
            setAiReelIdea(null);
            setAiEstimatedReach(null);
            setAiEstimatedRevenue(null);
        }
    }, [isOpen]);

    // Generar opciones de fecha dinámicamente
    const getDateOptions = (): WizardOption[] => {
        const options: WizardOption[] = [];

        // Agregar fechas clave del mes
        monthCard.keyDates.slice(0, 2).forEach((date, index) => {
            options.push({
                id: date.id,
                value: date.id,
                label: date.name,
                icon: date.category === 'holiday' ? '🎉' : date.category === 'commercial' ? '💰' : '🎭',
                description: `${date.date.split('-')[1]}/${date.date.split('-')[0]} - ${date.description.slice(0, 50)}...`,
                isRecommended: index === 0,
                recommendationReason: index === 0 ? 'La fecha más próxima con alto potencial' : undefined,
            });
        });

        // Opción personalizada
        options.push({
            id: 'custom',
            value: 'custom',
            label: 'Otra fecha',
            icon: '📅',
            description: 'Elegir una fecha personalizada',
        });

        return options;
    };

    const handleSelect = (value: string) => {
        const stepKey = ['objective', 'tone', 'promo', 'channel', 'keyDateId'][currentStep - 1];
        setChoices((prev) => ({
            ...prev,
            [stepKey]: value,
        }));
    };

    const handleNext = async () => {
        if (currentStep < 5) {
            setCurrentStep((prev) => prev + 1);
        } else {
            // Paso final: generar mensaje con IA
            setIsGenerating(true);
            const selectedKeyDate = monthCard.keyDates.find((d) => d.id === choices.keyDateId) || null;

            try {
                // Obtener businessId del localStorage
                const user = localStorage.getItem('korat_user');
                const businessName = user ? JSON.parse(user).email?.split('@')[0] : 'Tu Negocio';

                // Llamar a la API de generación de n8n
                const response = await campaigns.generate({
                    objective: choices.objective,
                    tone: choices.tone,
                    promo: choices.promo,
                    channel: choices.channel,
                    businessName: businessName
                });

                if (response && response.message) {
                    setGeneratedMessage(response.message);
                    // Guardar datos adicionales de la IA
                    if (response.imageIdea) setAiImageIdea(response.imageIdea);
                    if (response.reelIdea) setAiReelIdea(response.reelIdea);
                    if (response.estimatedReach) setAiEstimatedReach(response.estimatedReach);
                    if (response.estimatedRevenue) setAiEstimatedRevenue(response.estimatedRevenue);
                } else {
                    // Fallback al generador local
                    const message = generateCampaignMessage(choices, selectedKeyDate, currencySymbol);
                    setGeneratedMessage(message);
                }
            } catch (err) {
                console.warn('AI generation failed, using local fallback:', err);
                const message = generateCampaignMessage(choices, selectedKeyDate, currencySymbol);
                setGeneratedMessage(message);
            } finally {
                setIsGenerating(false);
            }

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
        const selectedKeyDate = monthCard.keyDates.find((d) => d.id === choices.keyDateId);

        const newCampaign: GeneratedCampaign = {
            id: `camp-${Date.now()}`,
            monthCard: { month: monthCard.month, year: monthCard.year },
            choices,
            title: selectedKeyDate ? `Campaña ${selectedKeyDate.name}` : 'Campaña Personalizada',
            message: generatedMessage,
            estimatedReach: aiEstimatedReach ?? Math.floor(Math.random() * 100) + 50,
            estimatedRevenue: aiEstimatedRevenue ?? Math.floor(Math.random() * 2000) + 500,
            status: 'active',
            createdAt: new Date().toISOString(),
            keyDateName: selectedKeyDate?.name,
        };

        try {
            const businessId = localStorage.getItem('korat_business_id') || 'biz-demo';

            // Paso 1: Guardar la campaña
            const createdCampaign = await campaigns.create({
                business_id: businessId,
                titulo: newCampaign.title,
                mensaje: newCampaign.message,
                objetivo: choices.objective === 'new_clients' ? 'nuevos_clientes'
                    : choices.objective === 'sales' ? 'ventas'
                        : choices.objective === 'recover_inactive' ? 'recuperar_inactivos'
                            : 'ventas',
                tono: choices.tone,
                tipo_promo: choices.promo === 'discount' ? 'descuento'
                    : choices.promo === 'bundle' ? 'paquete'
                        : 'flash',
                segmento: 'todas',
                ingreso_estimado: newCampaign.estimatedRevenue,
                estado: 'enviando',
                fecha_clave: selectedKeyDate?.name || null,
                mes: monthCard.month,
                anio: monthCard.year
            }) as any;

            // Paso 2: Disparar el Master Flow (envio inmediato)
            const campanaId = createdCampaign?.[0]?.id ?? createdCampaign?.id;
            if (campanaId) {
                await campaigns.flow('ejecutar', {
                    id_campana: campanaId,
                    segmento: choices.segment || 'todas',
                    mensaje: generatedMessage,
                    fecha_programada: new Date().toISOString(),
                });
            }
        } catch (err) {
            console.warn('⚠️ No se pudo guardar/disparar la campaña:', err);
        }

        onCampaignCreated(newCampaign);
        onClose();
    };

    const handleSchedule = async () => {
        const selectedKeyDate = monthCard.keyDates.find((d) => d.id === choices.keyDateId);
        const scheduleDate = new Date(Date.now() + 86400000).toISOString();

        const newCampaign: GeneratedCampaign = {
            id: `camp-${Date.now()}`,
            monthCard: { month: monthCard.month, year: monthCard.year },
            choices,
            title: selectedKeyDate ? `Campaña ${selectedKeyDate.name}` : 'Campaña Personalizada',
            message: generatedMessage,
            estimatedReach: aiEstimatedReach ?? Math.floor(Math.random() * 100) + 50,
            estimatedRevenue: aiEstimatedRevenue ?? Math.floor(Math.random() * 2000) + 500,
            status: 'scheduled',
            scheduledDate: scheduleDate,
            createdAt: new Date().toISOString(),
            keyDateName: selectedKeyDate?.name,
        };

        try {
            const businessId = localStorage.getItem('korat_business_id') || 'biz-demo';

            // Paso 1: Guardar la campaña como programada
            const createdCampaign = await campaigns.create({
                business_id: businessId,
                titulo: newCampaign.title,
                mensaje: newCampaign.message,
                objetivo: choices.objective === 'new_clients' ? 'nuevos_clientes'
                    : choices.objective === 'sales' ? 'ventas'
                        : choices.objective === 'recover_inactive' ? 'recuperar_inactivos'
                            : 'ventas',
                tono: choices.tone,
                tipo_promo: choices.promo === 'discount' ? 'descuento'
                    : choices.promo === 'bundle' ? 'paquete'
                        : 'flash',
                segmento: 'todas',
                ingreso_estimado: newCampaign.estimatedRevenue,
                estado: 'programada',
                fecha_programada: scheduleDate,
                fecha_clave: selectedKeyDate?.name || null,
                mes: monthCard.month,
                anio: monthCard.year
            }) as any;

            // Paso 2: Disparar el Master Flow (schedule)
            const campanaId = createdCampaign?.[0]?.id ?? createdCampaign?.id;
            if (campanaId) {
                await campaigns.flow('programar', {
                    id_campana: campanaId,
                    segmento: choices.segment || 'todas',
                    mensaje: generatedMessage,
                    fecha_programada: scheduleDate,
                });
            }
        } catch (err) {
            console.warn('⚠️ No se pudo guardar/disparar la campaña:', err);
        }

        onCampaignCreated(newCampaign);
        onClose();
    };

    // Handler para regenerar campaña
    const handleRegenerate = async () => {
        setIsGenerating(true);
        const selectedKeyDate = monthCard.keyDates.find((d) => d.id === choices.keyDateId) || null;

        try {
            const user = localStorage.getItem('korat_user');
            const businessName = user ? JSON.parse(user).email?.split('@')[0] : 'Tu Negocio';

            const response = await campaigns.generate({
                objective: choices.objective,
                tone: choices.tone,
                promo: choices.promo,
                channel: choices.channel,
                businessName: businessName,
                regenerate: true // Indicar que es regeneración
            });

            if (response && response.message) {
                setGeneratedMessage(response.message);
                if (response.imageIdea) setAiImageIdea(response.imageIdea);
                if (response.reelIdea) setAiReelIdea(response.reelIdea);
                if (response.estimatedReach) setAiEstimatedReach(response.estimatedReach);
                if (response.estimatedRevenue) setAiEstimatedRevenue(response.estimatedRevenue);
            } else {
                const message = generateCampaignMessage(choices, selectedKeyDate, currencySymbol);
                setGeneratedMessage(message);
            }
        } catch (err) {
            console.warn('Regeneration failed, using local fallback:', err);
            const message = generateCampaignMessage(choices, selectedKeyDate, currencySymbol);
            setGeneratedMessage(message);
        } finally {
            setIsGenerating(false);
        }
    };

    const getCurrentStepConfig = () => {
        const config = WIZARD_STEPS[currentStep - 1];
        if (currentStep === 5) {
            return {
                ...config,
                options: getDateOptions(),
            };
        }
        return config;
    };

    const getCurrentValue = (): string | null => {
        const keys: (keyof CampaignChoices)[] = ['objective', 'tone', 'promo', 'channel', 'keyDateId'];
        return choices[keys[currentStep - 1]];
    };

    if (!isOpen) return null;

    const stepConfig = getCurrentStepConfig();
    const selectedKeyDate = monthCard.keyDates.find((d) => d.id === choices.keyDateId) || null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">
                                {showSummary ? 'Campaña Lista' : 'Crear Campaña'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {MONTH_NAMES[monthCard.month]} {monthCard.year}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                    {showSummary ? (
                        <CampaignSummary
                            choices={choices}
                            generatedMessage={generatedMessage}
                            estimatedReach={aiEstimatedReach ?? Math.floor(Math.random() * 100) + 50}
                            estimatedRevenue={aiEstimatedRevenue ?? Math.floor(Math.random() * 2000) + 500}
                            keyDate={selectedKeyDate}
                            monthYear={{ month: monthCard.month, year: monthCard.year }}
                            onEdit={() => setShowSummary(false)}
                            onSchedule={handleSchedule}
                            onLaunch={handleLaunch}
                            onEditMessage={setGeneratedMessage}
                            currencySymbol={currencySymbol}
                            aiImageIdea={aiImageIdea}
                            aiReelIdea={aiReelIdea}
                            onRegenerate={handleRegenerate}
                            isRegenerating={isGenerating}
                            onReachChange={setAiEstimatedReach}
                        />
                    ) : (
                        <WizardStep
                            stepNumber={currentStep}
                            totalSteps={5}
                            title={stepConfig.title}
                            question={stepConfig.question}
                            nilahMessage={stepConfig.nilahMessage}
                            options={stepConfig.options}
                            selectedValue={getCurrentValue()}
                            onSelect={handleSelect}
                            onBack={handleBack}
                            onNext={handleNext}
                            isFirstStep={currentStep === 1}
                            isLastStep={currentStep === 5}
                            isLoading={isGenerating}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignBuilderWizard;
