/**
 * WizardStep Component
 * Paso individual del wizard con 3 opciones clickeables
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { WizardOption } from '../../types/campaignBuilderTypes';

// Mensajes dinámicos durante la generación
const LOADING_MESSAGES = [
    '✨ Analizando tu negocio...',
    '🎯 Personalizando el mensaje...',
    '📊 Calculando potencial de alcance...',
    '🎬 Creando ideas para tu reel...',
    '📸 Diseñando la sugerencia visual...',
    '💰 Estimando el retorno esperado...',
    '🚀 Casi listo...',
];

interface WizardStepProps {
    stepNumber: number;
    totalSteps: number;
    title: string;
    question: string;
    nilahMessage: string;
    options: WizardOption[];
    selectedValue: string | null;
    onSelect: (value: string) => void;
    onBack: () => void;
    onNext: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    isLoading?: boolean; // Para prevenir múltiples clicks
}

const WizardStep: React.FC<WizardStepProps> = ({
    stepNumber,
    totalSteps,
    title,
    question,
    nilahMessage,
    options,
    selectedValue,
    onSelect,
    onBack,
    onNext,
    isFirstStep,
    isLastStep,
    isLoading = false,
}) => {
    return (
        <div className="flex flex-col h-full">
            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Paso {stepNumber} de {totalSteps}
                    </span>
                    <span className="text-sm font-bold text-primary">{title}</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500 ease-out"
                        style={{ width: `${(stepNumber / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            {/* Nilah Message */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-1">
                            Nilah dice:
                        </p>
                        <p className="text-sm text-indigo-700 dark:text-indigo-400">
                            {nilahMessage}
                        </p>
                    </div>
                </div>
            </div>

            {/* Question */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                {question}
            </h3>

            {/* Options Grid */}
            <div className="grid grid-cols-1 gap-4 flex-1">
                {options.map((option) => {
                    const isSelected = selectedValue === option.value;

                    return (
                        <button
                            key={option.id}
                            onClick={() => onSelect(option.value)}
                            className={`relative flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-300 hover:scale-[1.02] ${isSelected
                                ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                        >
                            {/* Icon */}
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all ${isSelected
                                    ? 'bg-primary/10 scale-110'
                                    : 'bg-gray-100 dark:bg-dark-bg'
                                    }`}
                            >
                                {option.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-bold ${isSelected ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                                        {option.label}
                                    </span>
                                    {option.isRecommended && (
                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full">
                                            ✨ Recomendado
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {option.description}
                                </p>
                                {option.isRecommended && option.recommendationReason && (
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2 flex items-center gap-1">
                                        <Sparkles size={12} />
                                        {option.recommendationReason}
                                    </p>
                                )}
                            </div>

                            {/* Selection Indicator */}
                            <div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            >
                                {isSelected && <Check size={14} className="text-black" />}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-dark-border">
                <button
                    onClick={onBack}
                    disabled={isFirstStep}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all ${isFirstStep
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg'
                        }`}
                >
                    ← Atrás
                </button>

                <button
                    onClick={onNext}
                    disabled={!selectedValue || isLoading}
                    className={`px-8 py-2.5 rounded-lg font-bold transition-all flex items-center gap-2 ${selectedValue && !isLoading
                        ? 'bg-black dark:bg-white text-white dark:text-black hover:opacity-90 shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isLoading ? (
                        <LoadingButton />
                    ) : (
                        isLastStep ? 'Ver Campaña →' : 'Siguiente →'
                    )}
                </button>
            </div>
        </div>
    );
};

// Componente de botón con mensajes dinámicos
const LoadingButton: React.FC = () => {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="truncate max-w-[180px] animate-pulse">{LOADING_MESSAGES[messageIndex]}</span>
        </>
    );
};

export default WizardStep;
