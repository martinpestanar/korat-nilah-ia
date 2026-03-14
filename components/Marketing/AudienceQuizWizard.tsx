import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ChevronRight, ChevronLeft, Target } from 'lucide-react';
import AudienceSelector, { SmartAudience } from './AudienceSelector';

interface AudienceQuizWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (audiences: { semana: number; audience_id: string; audience_nombre: string; audience_descripcion: string }[]) => void;
    monthName: string;
}

const AudienceQuizWizard: React.FC<AudienceQuizWizardProps> = ({
    isOpen,
    onClose,
    onComplete,
    monthName
}) => {
    const [currentWeek, setCurrentWeek] = useState<number>(1);
    const [selections, setSelections] = useState<Record<number, SmartAudience | null>>({
        1: null,
        2: null,
        3: null,
        4: null
    });

    useEffect(() => {
        if (isOpen) {
            setCurrentWeek(1);
            setSelections({ 1: null, 2: null, 3: null, 4: null });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelect = (audience: SmartAudience) => {
        setSelections(prev => ({
            ...prev,
            [currentWeek]: audience
        }));
    };

    const handleNext = () => {
        if (currentWeek < 4) {
            setCurrentWeek(prev => prev + 1);
        } else {
            // Finish
            const finalAudiences = [1, 2, 3, 4].map(w => {
                const aud = selections[w]!;
                return {
                    semana: w,
                    audience_id: aud.id,
                    audience_nombre: aud.nombre,
                    audience_descripcion: aud.descripcion
                };
            });
            onComplete(finalAudiences);
        }
    };

    const handleBack = () => {
        if (currentWeek > 1) {
            setCurrentWeek(prev => prev - 1);
        }
    };

    const isCurrentSelected = !!selections[currentWeek];

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
                                    Paso {currentWeek} de 4
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
                            animate={{ width: `${(currentWeek / 4) * 100}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 hide-scrollbar">
                        <div className="mb-6 text-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                ¿A quién nos dirigiremos en la Semana {currentWeek}?
                            </h2>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Selecciona una audiencia para que Nilah diseñe la estrategia ideal.
                            </p>
                        </div>

                        {/* Audience Selector */}
                        <div className="mx-auto max-w-lg">
                            <AudienceSelector
                                onSelect={handleSelect}
                                selectedId={selections[currentWeek]?.id}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100 p-4 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            disabled={currentWeek === 1}
                            className={`flex items-center gap-1 sm:gap-2 rounded-xl px-4 py-2 font-medium transition-colors ${
                                currentWeek === 1
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
                            {currentWeek === 4 ? (
                                <>
                                    <Sparkles size={18} />
                                    Generar Plan Mensual
                                </>
                            ) : (
                                <>
                                    Siguiente Semana
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
