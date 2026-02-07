/**
 * ComparisonBadge Component
 * Badge con comparativa temporal (vs mes pasado, vs semana pasada, etc.)
 */

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ComparisonBadgeProps {
    currentValue: number;
    previousValue: number;
    format?: 'percent' | 'absolute' | 'currency';
    currencySymbol?: string;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const ComparisonBadge: React.FC<ComparisonBadgeProps> = ({
    currentValue,
    previousValue,
    format = 'percent',
    currencySymbol = 'S/',
    label = 'vs mes pasado',
    size = 'sm',
    className = ''
}) => {
    // Calculate difference
    const difference = currentValue - previousValue;
    const percentChange = previousValue !== 0
        ? ((difference / previousValue) * 100)
        : (currentValue > 0 ? 100 : 0);

    // Determine trend
    const trend = difference > 0 ? 'up' : difference < 0 ? 'down' : 'neutral';

    // Get styling based on trend
    const getTrendStyles = () => {
        switch (trend) {
            case 'up':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    text: 'text-green-600 dark:text-green-400',
                    border: 'border-green-200 dark:border-green-800',
                    icon: <TrendingUp className="w-3 h-3" />
                };
            case 'down':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    text: 'text-red-600 dark:text-red-400',
                    border: 'border-red-200 dark:border-red-800',
                    icon: <TrendingDown className="w-3 h-3" />
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-800',
                    text: 'text-gray-600 dark:text-gray-400',
                    border: 'border-gray-200 dark:border-gray-700',
                    icon: <Minus className="w-3 h-3" />
                };
        }
    };

    // Format the change value
    const formatChange = () => {
        const sign = difference > 0 ? '+' : '';

        switch (format) {
            case 'percent':
                return `${sign}${percentChange.toFixed(0)}%`;
            case 'absolute':
                return `${sign}${difference.toLocaleString()}`;
            case 'currency':
                return `${sign}${currencySymbol}${Math.abs(difference).toLocaleString()}`;
            default:
                return `${sign}${percentChange.toFixed(0)}%`;
        }
    };

    const styles = getTrendStyles();

    // Size variants
    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
        md: 'text-xs px-2 py-1 gap-1',
        lg: 'text-sm px-3 py-1.5 gap-1.5'
    };

    return (
        <div
            className={`inline-flex items-center rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${sizeClasses[size]} ${className}`}
            title={`${formatChange()} ${label}`}
        >
            {styles.icon}
            <span className="font-medium">{formatChange()}</span>
            {size !== 'sm' && (
                <span className="opacity-70">{label}</span>
            )}
        </div>
    );
};

export default ComparisonBadge;
