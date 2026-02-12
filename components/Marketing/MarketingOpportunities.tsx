/**
 * MarketingOpportunities Component
 * 
 * Muestra tarjetas de oportunidades basadas en la segmentación de clientes.
 * Cada tarjeta es un "Call to Action" para crear campañas dirigidas.
 */

import React from 'react';
import {
    AlertTriangle,
    Crown,
    Sparkles,
    Heart,
    TrendingUp,
    Users,
    ChevronRight
} from 'lucide-react';

// Types
interface SegmentData {
    vip: number;
    recuperar: number;
    nuevo: number;
    recurrente: number;
    interes_unas?: number;
    interes_pestanas?: number;
    interes_cabello?: number;
    total: number;
}

interface OpportunityCardProps {
    title: string;
    count: number;
    description: string;
    icon: React.ElementType;
    gradient: string;
    textColor: string;
    onClick: () => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
    title,
    count,
    description,
    icon: Icon,
    gradient,
    textColor,
    onClick
}) => (
    <button
        onClick={onClick}
        className={`relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group ${gradient}`}
    >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/30" />
            <div className="absolute -bottom-2 -left-2 h-16 w-16 rounded-full bg-white/20" />
        </div>

        {/* Content */}
        <div className="relative z-10">
            <div className="flex items-start justify-between">
                <div className={`rounded-xl p-2.5 bg-white/20 backdrop-blur-sm`}>
                    <Icon className={`h-6 w-6 ${textColor}`} />
                </div>
                <span className={`text-3xl font-bold ${textColor}`}>
                    {count}
                </span>
            </div>

            <h3 className={`mt-4 text-lg font-semibold ${textColor}`}>
                {title}
            </h3>
            <p className={`mt-1 text-sm ${textColor} opacity-80`}>
                {description}
            </p>

            {/* CTA Arrow */}
            <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${textColor} group-hover:gap-2 transition-all`}>
                Crear campaña
                <ChevronRight className="h-4 w-4" />
            </div>
        </div>
    </button>
);

interface MarketingOpportunitiesProps {
    segments: SegmentData;
    onCreateCampaign: (segment: string, segmentName: string) => void;
}

const MarketingOpportunities: React.FC<MarketingOpportunitiesProps> = ({
    segments,
    onCreateCampaign
}) => {
    // Determinar los top 3-4 segmentos más relevantes para mostrar
    const opportunities = [
        {
            id: 'recuperar',
            title: 'Recuperar Perdidos',
            count: segments.recuperar || 0,
            description: 'Clientes que no vuelven hace tiempo',
            icon: AlertTriangle,
            gradient: 'bg-gradient-to-br from-orange-500 to-red-600',
            textColor: 'text-white',
            priority: segments.recuperar > 0 ? 1 : 99
        },
        {
            id: 'vip',
            title: 'Premiar VIPs',
            count: segments.vip || 0,
            description: 'Tus mejores clientes merecen un mimo',
            icon: Crown,
            gradient: 'bg-gradient-to-br from-amber-400 to-orange-500',
            textColor: 'text-white',
            priority: segments.vip > 0 ? 2 : 99
        },
        {
            id: 'nuevo',
            title: 'Fidelizar Nuevos',
            count: segments.nuevo || 0,
            description: 'Convierte primerizos en recurrentes',
            icon: Sparkles,
            gradient: 'bg-gradient-to-br from-emerald-400 to-teal-500',
            textColor: 'text-white',
            priority: segments.nuevo > 0 ? 3 : 99
        },
        {
            id: 'interes_unas',
            title: 'Amantes de Uñas',
            count: segments.interes_unas || 0,
            description: 'Les encanta tu servicio de uñas',
            icon: Heart,
            gradient: 'bg-gradient-to-br from-pink-400 to-rose-500',
            textColor: 'text-white',
            priority: (segments.interes_unas || 0) > 5 ? 4 : 99
        },
        {
            id: 'interes_pestanas',
            title: 'Fans de Pestañas',
            count: segments.interes_pestanas || 0,
            description: 'Interesados en extensiones y lifting',
            icon: Sparkles,
            gradient: 'bg-gradient-to-br from-violet-400 to-purple-500',
            textColor: 'text-white',
            priority: (segments.interes_pestanas || 0) > 5 ? 5 : 99
        }
    ];

    // Ordenar por prioridad y mostrar solo los que tienen datos
    const visibleOpportunities = opportunities
        .filter(o => o.count > 0)
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 4);

    if (visibleOpportunities.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-300">
                    Sin datos de segmentación
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                    Necesitas completar citas para ver oportunidades de marketing
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Oportunidades de Marketing
                    </h2>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {segments.total || 0} clientes totales
                </span>
            </div>

            {/* Opportunity Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {visibleOpportunities.map(opp => (
                    <OpportunityCard
                        key={opp.id}
                        title={opp.title}
                        count={opp.count}
                        description={opp.description}
                        icon={opp.icon}
                        gradient={opp.gradient}
                        textColor={opp.textColor}
                        onClick={() => onCreateCampaign(opp.id, opp.title)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MarketingOpportunities;
