/**
 * RealtimeIndicator Component
 * Muestra el estado de conexión en tiempo real en el header
 */

import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useDashboardData } from '../../context/DashboardDataContext';

const RealtimeIndicator: React.FC = () => {
    const { realtimeStatus } = useDashboardData();

    const getStatusConfig = () => {
        switch (realtimeStatus) {
            case 'connected':
                return {
                    icon: <Wifi size={14} />,
                    label: 'En vivo',
                    dotColor: 'bg-green-500',
                    textColor: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    borderColor: 'border-green-200 dark:border-green-800',
                    animate: true
                };
            case 'connecting':
                return {
                    icon: <Loader2 size={14} className="animate-spin" />,
                    label: 'Conectando',
                    dotColor: 'bg-yellow-500',
                    textColor: 'text-yellow-600 dark:text-yellow-400',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    borderColor: 'border-yellow-200 dark:border-yellow-800',
                    animate: false
                };
            case 'error':
            case 'disconnected':
            default:
                return {
                    icon: <WifiOff size={14} />,
                    label: 'Offline',
                    dotColor: 'bg-gray-400',
                    textColor: 'text-gray-500 dark:text-gray-400',
                    bgColor: 'bg-gray-50 dark:bg-gray-800',
                    borderColor: 'border-gray-200 dark:border-gray-700',
                    animate: false
                };
        }
    };

    const config = getStatusConfig();

    // Solo mostrar cuando está conectado o conectando
    if (realtimeStatus === 'disconnected' || realtimeStatus === 'error') {
        return null;
    }

    return (
        <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${config.bgColor} ${config.borderColor} ${config.textColor}`}
        >
            <span className="relative flex h-2 w-2">
                <span
                    className={`absolute inline-flex h-full w-full rounded-full ${config.dotColor} ${config.animate ? 'animate-ping opacity-75' : ''}`}
                />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
            </span>
            <span className="hidden sm:inline">{config.label}</span>
        </div>
    );
};

export default RealtimeIndicator;
