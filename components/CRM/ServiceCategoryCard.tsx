/**
 * ServiceCategoryCard.tsx
 * Premium iPhone-style category card for CRM segments.
 * Glass morphism + live metrics + animated progress ring.
 */
import React from 'react';
import { ServiceCategory } from '../../types/crm';
import { ChevronRight, AlertCircle } from 'lucide-react';

interface Props {
    category: ServiceCategory;
    clientCount: number;
    totalClients: number;
    atRiskCount: number;
    onClick: () => void;
}

const ServiceCategoryCard: React.FC<Props> = ({
    category,
    clientCount,
    totalClients,
    atRiskCount,
    onClick,
}) => {
    const pct = totalClients > 0 ? Math.round((clientCount / totalClients) * 100) : 0;
    const riskPct = clientCount > 0 ? Math.round((atRiskCount / clientCount) * 100) : 0;

    // SVG ring parameters
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (pct / 100) * circumference;

    return (
        <button
            onClick={onClick}
            className="relative w-full text-left rounded-3xl overflow-hidden active:scale-[0.97] transition-all duration-200 focus:outline-none group"
            style={{
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)',
            }}
        >
            {/* Full gradient background */}
            <div className={`bg-gradient-to-br ${category.color} p-4`}>
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                    {/* Emoji in frosted circle */}
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
                        <span className="text-2xl leading-none">{category.emoji}</span>
                    </div>

                    {/* Progress ring */}
                    <div className="relative flex items-center justify-center">
                        <svg width="40" height="40" className="-rotate-90">
                            {/* Track */}
                            <circle
                                cx="20" cy="20" r={radius}
                                fill="none"
                                stroke="rgba(255,255,255,0.25)"
                                strokeWidth="3.5"
                            />
                            {/* Fill */}
                            <circle
                                cx="20" cy="20" r={radius}
                                fill="none"
                                stroke="white"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)' }}
                            />
                        </svg>
                        <span className="absolute text-[10px] font-black text-white">{pct}%</span>
                    </div>
                </div>

                {/* Category name */}
                <h3 className="text-base font-black text-white leading-tight tracking-tight">{category.label}</h3>

                {/* Client count */}
                <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-white leading-none tracking-tighter">
                        {clientCount}
                    </span>
                    <span className="text-xs text-white/70 font-medium">clientas</span>
                </div>

                {/* Bottom row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20">
                    {atRiskCount > 0 ? (
                        <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-white/80" />
                            <span className="text-[11px] font-semibold text-white/90">
                                {atRiskCount} en riesgo · {riskPct}%
                            </span>
                        </div>
                    ) : (
                        <span className="text-[11px] font-semibold text-white/80">Sin alertas 🟢</span>
                    )}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                        <ChevronRight className="h-3.5 w-3.5 text-white" />
                    </div>
                </div>
            </div>
        </button>
    );
};

export default ServiceCategoryCard;
