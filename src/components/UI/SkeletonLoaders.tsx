/**
 * Skeleton Loaders
 * Componentes de skeleton para estados de carga que imitan la estructura del contenido
 */

import React from 'react';

// ===========================================
// Base Skeleton Classes
// ===========================================

const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 dark:before:via-white/10 before:to-transparent";

// ===========================================
// Skeleton Components
// ===========================================

export const SkeletonText: React.FC<{ width?: string; className?: string }> = ({
    width = 'w-full',
    className = ''
}) => (
    <div className={`h-4 rounded bg-gray-200 dark:bg-gray-700 ${shimmerClass} ${width} ${className}`} />
);

export const SkeletonTitle: React.FC<{ width?: string; className?: string }> = ({
    width = 'w-3/4',
    className = ''
}) => (
    <div className={`h-6 rounded bg-gray-200 dark:bg-gray-700 ${shimmerClass} ${width} ${className}`} />
);

export const SkeletonCircle: React.FC<{ size?: string; className?: string }> = ({
    size = 'w-10 h-10',
    className = ''
}) => (
    <div className={`rounded-full bg-gray-200 dark:bg-gray-700 ${shimmerClass} ${size} ${className}`} />
);

export const SkeletonRect: React.FC<{ width?: string; height?: string; className?: string }> = ({
    width = 'w-full',
    height = 'h-24',
    className = ''
}) => (
    <div className={`rounded-xl bg-gray-200 dark:bg-gray-700 ${shimmerClass} ${width} ${height} ${className}`} />
);

// ===========================================
// Composite Skeleton Components
// ===========================================

export const SkeletonStatCard: React.FC = () => (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
        <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
                <SkeletonText width="w-24" />
                <SkeletonTitle width="w-32" />
                <SkeletonText width="w-20" className="h-3" />
            </div>
            <SkeletonCircle size="w-12 h-12" />
        </div>
    </div>
);

export const SkeletonChart: React.FC<{ height?: string }> = ({ height = 'h-64' }) => (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
        <div className="flex items-center gap-2 mb-4">
            <SkeletonCircle size="w-5 h-5" />
            <SkeletonText width="w-32" />
        </div>
        <SkeletonRect height={height} />
    </div>
);

export const SkeletonListItem: React.FC = () => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card">
        <SkeletonCircle size="w-10 h-10" />
        <div className="flex-1 space-y-2">
            <SkeletonText width="w-40" />
            <SkeletonText width="w-24" className="h-3" />
        </div>
        <SkeletonRect width="w-16" height="h-6" className="rounded-full" />
    </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <div className="rounded-xl border border-gray-100 bg-white dark:border-dark-border dark:bg-dark-card overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 dark:bg-dark-bg p-4 border-b border-gray-100 dark:border-dark-border">
            <div className="flex gap-8">
                <SkeletonText width="w-20" />
                <SkeletonText width="w-24" />
                <SkeletonText width="w-16" />
                <SkeletonText width="w-20" />
            </div>
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-100 dark:border-dark-border last:border-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3">
                        <SkeletonCircle size="w-8 h-8" />
                        <SkeletonText width="w-32" />
                    </div>
                    <SkeletonText width="w-24" />
                    <SkeletonRect width="w-16" height="h-5" className="rounded-full" />
                    <SkeletonText width="w-20" />
                </div>
            </div>
        ))}
    </div>
);

// ===========================================
// Widget-specific Skeletons
// ===========================================

export const SkeletonRetentionWidget: React.FC = () => (
    <div className="h-full flex flex-col p-4">
        <div className="flex items-center gap-2 mb-4">
            <SkeletonCircle size="w-5 h-5" />
            <SkeletonText width="w-40" />
        </div>
        <SkeletonRect height="h-20" className="mb-4" />
        <div className="space-y-2 mb-4">
            <SkeletonRect height="h-10" />
            <SkeletonRect height="h-10" />
            <SkeletonRect height="h-10" />
        </div>
        <div className="grid grid-cols-3 gap-2 mt-auto">
            <SkeletonRect height="h-16" />
            <SkeletonRect height="h-16" />
            <SkeletonRect height="h-16" />
        </div>
    </div>
);

export const SkeletonForecastWidget: React.FC = () => (
    <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
            <SkeletonCircle size="w-5 h-5" />
            <SkeletonText width="w-32" />
        </div>
        <div className="flex items-center gap-4 mb-4">
            <SkeletonTitle width="w-24" className="h-8" />
            <SkeletonText width="w-16" />
        </div>
        <SkeletonRect height="h-3 rounded-full" className="mb-4" />
        <SkeletonRect height="h-12" />
    </div>
);

// ===========================================
// Export Default
// ===========================================

export default {
    Text: SkeletonText,
    Title: SkeletonTitle,
    Circle: SkeletonCircle,
    Rect: SkeletonRect,
    StatCard: SkeletonStatCard,
    Chart: SkeletonChart,
    ListItem: SkeletonListItem,
    Table: SkeletonTable,
    RetentionWidget: SkeletonRetentionWidget,
    ForecastWidget: SkeletonForecastWidget
};
