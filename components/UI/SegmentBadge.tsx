/**
 * SegmentBadge Component
 * 
 * Badge visual para mostrar el segmento/interés de un cliente.
 * Se usa en la lista de clientes y en el perfil del cliente.
 */

import React from 'react';
import { Crown, AlertTriangle, Sparkles, Heart, Users } from 'lucide-react';

interface SegmentBadgeProps {
    segment?: string;
    interest?: string;
    size?: 'sm' | 'md';
    showIcon?: boolean;
}

const SegmentBadge: React.FC<SegmentBadgeProps> = ({
    segment,
    interest,
    size = 'sm',
    showIcon = true
}) => {
    // Configuración de estilos por segmento
    const segmentConfig: Record<string, {
        label: string;
        icon: React.ElementType;
        bg: string;
        text: string;
        border: string;
    }> = {
        vip: {
            label: 'VIP',
            icon: Crown,
            bg: 'bg-amber-100 dark:bg-amber-900/30',
            text: 'text-amber-700 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800'
        },
        recuperar: {
            label: 'En Riesgo',
            icon: AlertTriangle,
            bg: 'bg-red-100 dark:bg-red-900/30',
            text: 'text-red-700 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800'
        },
        nuevo: {
            label: 'Nuevo',
            icon: Sparkles,
            bg: 'bg-emerald-100 dark:bg-emerald-900/30',
            text: 'text-emerald-700 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800'
        },
        recurrente: {
            label: 'Recurrente',
            icon: Users,
            bg: 'bg-blue-100 dark:bg-blue-900/30',
            text: 'text-blue-700 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800'
        }
    };

    // Configuración de estilos por interés
    const interestConfig: Record<string, {
        label: string;
        emoji: string;
        bg: string;
        text: string;
        border: string;
    }> = {
        'Uñas': {
            label: 'Uñas',
            emoji: '💅',
            bg: 'bg-pink-100 dark:bg-pink-900/30',
            text: 'text-pink-700 dark:text-pink-400',
            border: 'border-pink-200 dark:border-pink-800'
        },
        'Pestañas': {
            label: 'Pestañas',
            emoji: '👁️',
            bg: 'bg-violet-100 dark:bg-violet-900/30',
            text: 'text-violet-700 dark:text-violet-400',
            border: 'border-violet-200 dark:border-violet-800'
        },
        'Cabello': {
            label: 'Cabello',
            emoji: '💇',
            bg: 'bg-purple-100 dark:bg-purple-900/30',
            text: 'text-purple-700 dark:text-purple-400',
            border: 'border-purple-200 dark:border-purple-800'
        },
        'Cejas': {
            label: 'Cejas',
            emoji: '✨',
            bg: 'bg-orange-100 dark:bg-orange-900/30',
            text: 'text-orange-700 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800'
        },
        'Pies': {
            label: 'Pedicura',
            emoji: '🦶',
            bg: 'bg-teal-100 dark:bg-teal-900/30',
            text: 'text-teal-700 dark:text-teal-400',
            border: 'border-teal-200 dark:border-teal-800'
        },
        'Rostro': {
            label: 'Facial',
            emoji: '🧖',
            bg: 'bg-rose-100 dark:bg-rose-900/30',
            text: 'text-rose-700 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800'
        }
    };

    const sizeClasses = size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-2.5 py-1 text-sm';

    const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';

    // Renderizar badge de segmento
    const segmentInfo = segment ? segmentConfig[segment.toLowerCase()] : null;

    // Renderizar badge de interés
    const interestInfo = interest ? interestConfig[interest] : null;

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {/* Segment Badge */}
            {segmentInfo && (
                <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} ${segmentInfo.bg} ${segmentInfo.text} ${segmentInfo.border}`}>
                    {showIcon && <segmentInfo.icon className={iconSize} />}
                    {segmentInfo.label}
                </span>
            )}

            {/* Interest Badge */}
            {interestInfo && (
                <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} ${interestInfo.bg} ${interestInfo.text} ${interestInfo.border}`}>
                    <span>{interestInfo.emoji}</span>
                    {interestInfo.label}
                </span>
            )}

            {/* Fallback for unknown interests */}
            {interest && !interestInfo && interest !== 'General' && interest !== 'Sin Categoría Asignada' && (
                <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeClasses} bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700`}>
                    <Heart className={iconSize} />
                    {interest}
                </span>
            )}
        </div>
    );
};

export default SegmentBadge;
