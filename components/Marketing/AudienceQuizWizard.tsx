import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight, ChevronLeft, Gift } from 'lucide-react';
import AudienceSelector, { SmartAudience } from './AudienceSelector';

interface AudienceQuizWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (audiences: { 
        semana: number; 
        audience_id: string; 
        audience_nombre: string; 
        audience_descripcion: string;
        beneficio?: string;
        beneficio_detalle?: string;
    }[]) => void;
    monthName: string;
}

interface QuizSelection {
    audience: SmartAudience | null;
    beneficioId: string;
    beneficioDetalle: string;
}

const BENEFIT_OPTIONS = [
    { id: "regalo_sorpresa", label: "Regalito sorpresa", descripcion: "Detalle especial que no se revela. Genera intriga.", icon: "🎁" },
    { id: "descuento_10", label: "10% descuento exclusivo", descripcion: "Solo para esta audiencia.", icon: "💰" },
    { id: "descuento_15", label: "15% descuento exclusivo", descripcion: "Solo para esta audiencia.", icon: "💰" },
    { id: "descuento_20", label: "20% descuento exclusivo", descripcion: "Solo para esta audiencia.", icon: "💰" },
    { id: "servicio_extra", label: "Servicio extra gratis", descripcion: "Complementa el servicio principal.", icon: "⭐" },
    { id: "quema_puntos", label: "Quema de puntos", descripcion: "Activa saldo dormido del CRM.", icon: "🔥" },
    { id: "agenda_prioritaria", label: "Horario prioritario", descripcion: "Sin lista de espera.", icon: "📅" },
    { id: "cumple_mimo", label: "Mimo de cumpleaños", descripcion: "Detalle sorpresa por su día.", icon: "🎂" },
    { id: "beneficio_vip", label: "Beneficio VIP misterioso", descripcion: "Exclusivo y no revelado.", icon: "🤫" },
    { id: "trae_amiga", label: "Trae una amiga", descripcion: "Promoción 2x1 o compartir.", icon: "👯" },
    { id: "emocional", label: "Sin Promoción (Puro Valor)", descripcion: "Solo mensaje emocional, sin oferta.", icon: "💖" },
    { id: "custom", label: "Personalizado", descripcion: "Escribe tu propio incentivo.", icon: "✍️" },
];

const AudienceQuizWizard: React.FC<AudienceQuizWizardProps> = ({
    isOpen,
    onClose,
    onComplete,
    monthName
}) => {
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [subStep, setSubStep] = useState<'audience' | 'benefit'>('audience');
    
    const [selections, setSelections] = useState<Record<number, QuizSelection>>({
        1: { audience: null, beneficioId: '', beneficioDetalle: '' },
        2: { audience: null, beneficioId: '', beneficioDetalle: '' },
        3: { audience: null, beneficioId: '', beneficioDetalle: '' },
        4: { audience: null, beneficioId: '', beneficioDetalle: '' }
    });

    useEffect(() => {
        if (isOpen) {
            setCurrentWeek(1);
            setSubStep('audience');
            setSelections({
                1: { audience: null, beneficioId: '', beneficioDetalle: '' },
                2: { audience: null, beneficioId: '', beneficioDetalle: '' },
                3: { audience: null, beneficioId: '', beneficioDetalle: '' },
                4: { audience: null, beneficioId: '', beneficioDetalle: '' }
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectAudience = (audience: SmartAudience) => {
        setSelections(prev => ({
            ...prev,
            [currentWeek]: { ...prev[currentWeek], audience }
        }));
    };

    const handleSelectBenefit = (beneficioId: string) => {
        setSelections(prev => ({
            ...prev,
            [currentWeek]: { ...prev[currentWeek], beneficioId }
        }));
    };

    const handleBenefitDetailChange = (val: string) => {
        setSelections(prev => ({
            ...prev,
            [currentWeek]: { ...prev[currentWeek], beneficioDetalle: val }
        }));
    };

    const handleNext = () => {
        if (subStep === 'audience') {
            setSubStep('benefit');
        } else {
            if (currentWeek < 4) {
                setCurrentWeek(prev => prev + 1);
                setSubStep('audience');
            } else {
                // Finish
                const finalAudiences = [1, 2, 3, 4].map(w => {
                    const sel = selections[w];
                    const aud = sel.audience!;
                    const fullBenefit = BENEFIT_OPTIONS.find(b => b.id === sel.beneficioId);
                    const benefitPayload = fullBenefit ? `${fullBenefit.icon} ${fullBenefit.label} - ${fullBenefit.descripcion}` : '';
                    
                    return {
                        semana: w,
                        audience_id: aud.id,
                        audience_nombre: aud.nombre,
                        audience_descripcion: aud.descripcion,
                        beneficio: benefitPayload,
                        beneficio_detalle: sel.beneficioDetalle
                    };
                });
                onComplete(finalAudiences);
            }
        }
    };

    const handleBack = () => {
        if (subStep === 'benefit') {
            setSubStep('audience');
        } else if (currentWeek > 1) {
            setCurrentWeek(prev => prev - 1);
            setSubStep('benefit');
        }
    };

    const isCurrentSelected = subStep === 'audience' 
        ? !!selections[currentWeek].audience 
        : !!selections[currentWeek].beneficioId;

    // Calculamos el % de progreso general. Hay 8 pasos en total (4 semanas x 2 sub-pasos)
    const currentAbsoluteStep = (currentWeek - 1) * 2 + (subStep === 'audience' ? 1 : 2);
    const progressPercent = (currentAbsoluteStep / 8) * 100;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-card border border-white/10"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-4 dark:border-white/5 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
                                <Sparkles size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Audience Quiz: {monthName}
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Paso {currentAbsoluteStep} de 8
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1 w-full bg-gray-100 dark:bg-dark-border">
                        <motion.div
                            className="h-full bg-violet-500"
                            initial={{ width: '0%' }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 hide-scrollbar">
                        <AnimatePresence mode="wait">
                            {subStep === 'audience' ? (
                                <motion.div
                                    key="audience-step"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="mx-auto max-w-lg"
                                >
                                    <div className="mb-6 text-center">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            ¿A quién nos dirigiremos en la Semana {currentWeek}?
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Selecciona una audiencia para que Nilah diseñe la estrategia ideal.
                                        </p>
                                    </div>
                                    <AudienceSelector
                                        onSelect={handleSelectAudience}
                                        selectedId={selections[currentWeek].audience?.id}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="benefit-step"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="mx-auto max-w-lg"
                                >
                                    <div className="mb-6 text-center">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            ¿Qué beneficio o incentivo ofreceremos en la Semana {currentWeek}?
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            Para {selections[currentWeek].audience?.nombre}. Toda buena campaña incluye una oferta de valor.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                                        {BENEFIT_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleSelectBenefit(opt.id)}
                                                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                                                    selections[currentWeek].beneficioId === opt.id
                                                        ? 'bg-violet-50 dark:bg-violet-500/15 border-violet-500 dark:border-violet-500/50 text-violet-900 dark:text-white shadow-sm'
                                                        : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <span className="text-sm font-semibold flex items-center gap-2">
                                                    <span className="text-base leading-none">{opt.icon}</span> 
                                                    <span className="truncate">{opt.label}</span>
                                                </span>
                                                <span className={`text-[11px] leading-tight line-clamp-2 ${
                                                    selections[currentWeek].beneficioId === opt.id 
                                                        ? 'text-violet-700 dark:text-violet-300' 
                                                        : 'text-gray-500 dark:text-gray-500'
                                                }`}>
                                                    {opt.descripcion}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 dark:border-dark-border">
                                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Detalle personalizado (Opcional)
                                        </p>
                                        <input
                                            type="text"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                                            placeholder="Ej: Incluye una copa de vino, 2x1 en coloración..."
                                            value={selections[currentWeek].beneficioDetalle}
                                            onChange={(e) => handleBenefitDetailChange(e.target.value)}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 p-4 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            disabled={currentWeek === 1 && subStep === 'audience'}
                            className={`flex items-center gap-1 sm:gap-2 rounded-xl px-4 py-2 font-medium transition-colors ${
                                currentWeek === 1 && subStep === 'audience'
                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50'
                                    : 'text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-white/5'
                            }`}
                        >
                            <ChevronLeft size={18} />
                            Atrás
                        </button>
                        
                        <button
                            onClick={handleNext}
                            disabled={!isCurrentSelected}
                            className={`flex items-center gap-1 sm:gap-2 rounded-xl px-6 py-2.5 font-bold text-white transition-all shadow-md ${
                                !isCurrentSelected
                                    ? 'bg-gray-300 cursor-not-allowed shadow-none dark:bg-gray-700'
                                    : 'bg-primary hover:bg-primary-dark shadow-primary/20 hover:shadow-primary/40'
                            }`}
                        >
                            {currentWeek === 4 && subStep === 'benefit' ? (
                                <>
                                    <Sparkles size={18} />
                                    Generar Plan Mensual
                                </>
                            ) : (
                                <>
                                    {subStep === 'audience' ? 'Siguiente (Elegir Beneficio)' : 'Siguiente Semana'}
                                    <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AudienceQuizWizard;

