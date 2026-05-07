/**
 * ContextualTooltip Component
 * Tooltips contextuales para onboarding y ayuda
 */

import React, { useState, useEffect } from 'react';
import { X, HelpCircle, Lightbulb, ChevronRight } from 'lucide-react';

interface TooltipStep {
    id: string;
    title: string;
    content: string;
    targetSelector?: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface ContextualTooltipProps {
    id: string;
    title: string;
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    showOnce?: boolean;
    delay?: number;
    className?: string;
}

// Helper to track shown tooltips
const SHOWN_TOOLTIPS_KEY = 'korat_shown_tooltips';

const getShownTooltips = (): string[] => {
    try {
        return JSON.parse(localStorage.getItem(SHOWN_TOOLTIPS_KEY) || '[]');
    } catch {
        return [];
    }
};

const markTooltipShown = (id: string) => {
    const shown = getShownTooltips();
    if (!shown.includes(id)) {
        localStorage.setItem(SHOWN_TOOLTIPS_KEY, JSON.stringify([...shown, id]));
    }
};

export const ContextualTooltip: React.FC<ContextualTooltipProps> = ({
    id,
    title,
    content,
    children,
    position = 'top',
    showOnce = true,
    delay = 1000,
    className = ''
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [hasBeenDismissed, setHasBeenDismissed] = useState(false);

    useEffect(() => {
        if (showOnce && getShownTooltips().includes(id)) {
            setHasBeenDismissed(true);
            return;
        }

        const timer = setTimeout(() => {
            setIsVisible(true);
        }, delay);

        return () => clearTimeout(timer);
    }, [id, showOnce, delay]);

    const handleDismiss = () => {
        setIsVisible(false);
        setHasBeenDismissed(true);
        if (showOnce) {
            markTooltipShown(id);
        }
    };

    const getPositionClasses = () => {
        switch (position) {
            case 'top':
                return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
            case 'bottom':
                return 'top-full left-1/2 -translate-x-1/2 mt-2';
            case 'left':
                return 'right-full top-1/2 -translate-y-1/2 mr-2';
            case 'right':
                return 'left-full top-1/2 -translate-y-1/2 ml-2';
            default:
                return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
        }
    };

    const getArrowClasses = () => {
        switch (position) {
            case 'top':
                return 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent';
            case 'bottom':
                return 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700 border-l-transparent border-r-transparent border-t-transparent';
            case 'left':
                return 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700 border-t-transparent border-b-transparent border-r-transparent';
            case 'right':
                return 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700 border-t-transparent border-b-transparent border-l-transparent';
            default:
                return '';
        }
    };

    return (
        <div className={`relative inline-block ${className}`}>
            {children}

            {isVisible && !hasBeenDismissed && (
                <div className={`absolute z-50 ${getPositionClasses()} animate-in fade-in zoom-in-95 duration-200`}>
                    {/* Tooltip Content */}
                    <div className="relative w-64 p-4 rounded-xl bg-gray-900 dark:bg-gray-700 text-white shadow-xl">
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
                        >
                            <X size={14} />
                        </button>

                        {/* Icon */}
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                                <Lightbulb size={14} className="text-primary" />
                            </div>
                            <h4 className="font-bold text-sm">{title}</h4>
                        </div>

                        {/* Content */}
                        <p className="text-xs text-gray-300 leading-relaxed">{content}</p>

                        {/* Got it button */}
                        <button
                            onClick={handleDismiss}
                            className="mt-3 w-full py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium transition-colors flex items-center justify-center gap-1"
                        >
                            Entendido
                            <ChevronRight size={12} />
                        </button>

                        {/* Arrow */}
                        <div className={`absolute w-0 h-0 border-8 ${getArrowClasses()}`} />
                    </div>
                </div>
            )}
        </div>
    );
};

// ===========================================
// Help Icon with Tooltip
// ===========================================

interface HelpTooltipProps {
    content: string;
    className?: string;
}

export const HelpTooltip: React.FC<HelpTooltipProps> = ({ content, className = '' }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onClick={() => setIsVisible(!isVisible)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <HelpCircle size={14} />
            </button>

            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="w-48 p-2 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs shadow-lg">
                        {content}
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-t-gray-900 dark:border-t-gray-700 border-l-transparent border-r-transparent border-b-transparent" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContextualTooltip;
