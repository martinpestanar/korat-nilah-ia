/**
 * CampaignModeSelector Component
 * Selector de modo para crear campaña: Express o Avanzado
 */

import React from 'react';
import { Zap, Settings, Sparkles, ArrowRight, Clock, Target, BarChart3 } from 'lucide-react';
import { WizardMode } from '../../types/campaignBuilderTypes';

interface CampaignModeSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectMode: (mode: WizardMode) => void;
    monthName: string;
    year: number;
}

const CampaignModeSelector: React.FC<CampaignModeSelectorProps> = ({
    isOpen,
    onClose,
    onSelectMode,
    monthName,
    year,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-emerald-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/25">
                            <Sparkles className="w-7 h-7 text-black" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Crear Campaña
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400">
                                {monthName} {year} • ¿Cómo quieres crearla?
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content - Mode Cards */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Advanced Mode */}
                        <button
                            onClick={() => onSelectMode('advanced')}
                            className="group relative p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-dark-bg dark:to-dark-card hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 text-left"
                        >
                            {/* Icon */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
                                <Settings className="w-6 h-6 text-white" />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Modo Avanzado
                            </h3>

                            {/* Description */}
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                Control total sobre cada aspecto de tu campaña
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Target className="w-4 h-4 text-indigo-500" />
                                    <span>6 pasos de personalización</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                                    <span>Segmentación detallada</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Clock className="w-4 h-4 text-indigo-500" />
                                    <span>~3-5 minutos</span>
                                </li>
                            </ul>

                            {/* CTA */}
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium group-hover:gap-3 transition-all">
                                <span>Seleccionar</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>
                        </button>

                        {/* Express Mode */}
                        <button
                            onClick={() => onSelectMode('express')}
                            className="group relative p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-emerald-500/5 dark:from-primary/10 dark:to-emerald-500/10 hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 text-left"
                        >
                            {/* Recommended Badge */}
                            <div className="absolute -top-3 left-6 px-3 py-1 bg-gradient-to-r from-primary to-emerald-400 text-black text-xs font-bold rounded-full shadow-lg">
                                ⚡ RECOMENDADO
                            </div>

                            {/* Icon */}
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
                                <Zap className="w-6 h-6 text-black" />
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Modo Express
                            </h3>

                            {/* Description */}
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                                La IA crea todo automáticamente con tus datos
                            </p>

                            {/* Features */}
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span>Solo 3 pasos</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Target className="w-4 h-4 text-primary" />
                                    <span>IA analiza tu brief + métricas</span>
                                </li>
                                <li className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span>~1 minuto</span>
                                </li>
                            </ul>

                            {/* CTA */}
                            <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                                <span>Seleccionar</span>
                                <ArrowRight className="w-4 h-4" />
                            </div>

                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-emerald-400/5 transition-all duration-500 pointer-events-none" />
                        </button>
                    </div>

                    {/* Info Section */}
                    <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-gray-800">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    ¿No sabes cuál elegir?
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Te recomendamos <strong>Express</strong> si ya completaste tu Brief.
                                    La IA usará toda tu información para crear campañas optimizadas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-dark-bg/50">
                    <button
                        onClick={onClose}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                        ← Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CampaignModeSelector;
