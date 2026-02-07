/**
 * ChartDrilldownModal Component
 * Modal para mostrar detalles cuando se hace click en un gráfico
 */

import React from 'react';
import { X, Calendar, DollarSign, User, Clock, Check, XCircle } from 'lucide-react';
import { Appointment } from '../../context/DashboardDataContext';

interface ChartDrilldownModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    date?: string;
    appointments: Appointment[];
    currencySymbol?: string;
}

const ChartDrilldownModal: React.FC<ChartDrilldownModalProps> = ({
    isOpen,
    onClose,
    title,
    date,
    appointments,
    currencySymbol = 'S/'
}) => {
    if (!isOpen) return null;

    // Calculate totals
    const totalRevenue = appointments
        .filter(a => a.estado === 'Completada')
        .reduce((sum, a) => sum + (a.precio || 0), 0);

    const completedCount = appointments.filter(a => a.estado === 'Completada').length;
    const cancelledCount = appointments.filter(a => a.estado === 'Cancelada' || a.estado === 'No-Show').length;

    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case 'Completada':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
                        <Check size={10} />
                        Completada
                    </span>
                );
            case 'Pendiente':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        Pendiente
                    </span>
                );
            case 'Cancelada':
            case 'No-Show':
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 flex items-center gap-1">
                        <XCircle size={10} />
                        {estado}
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                        {estado}
                    </span>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-dark-card rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-200 max-h-[80vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900 dark:text-white">{title}</h2>
                            {date && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 dark:bg-dark-bg/50">
                    <div className="text-center p-3 rounded-xl bg-white dark:bg-dark-card">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{appointments.length}</p>
                        <p className="text-[10px] text-gray-400">citas</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white dark:bg-dark-card">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ingresos</p>
                        <p className="text-lg font-bold text-primary">{currencySymbol}{totalRevenue.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400">{completedCount} completadas</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-white dark:bg-dark-card">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Canceladas</p>
                        <p className="text-lg font-bold text-red-500">{cancelledCount}</p>
                        <p className="text-[10px] text-gray-400">no asistieron</p>
                    </div>
                </div>

                {/* Appointments List */}
                <div className="flex-1 overflow-y-auto p-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Detalle de Citas</h3>
                    <div className="space-y-2">
                        {appointments.length > 0 ? (
                            appointments.map((apt, index) => (
                                <div
                                    key={apt.id || index}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                                >
                                    {/* Time */}
                                    <div className="flex items-center gap-1 text-gray-500 min-w-[60px]">
                                        <Clock size={14} />
                                        <span className="text-xs font-medium">
                                            {apt.hora || apt.fecha?.split(' ')[1]?.slice(0, 5) || '--:--'}
                                        </span>
                                    </div>

                                    {/* Client & Service */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {apt.nombre || 'Cliente'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {apt.servicio}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {currencySymbol}{(apt.precio || 0).toLocaleString()}
                                        </p>
                                        {getStatusBadge(apt.estado)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                No hay citas para este período
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-dark-border">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-dark-bg dark:hover:bg-dark-border text-gray-700 dark:text-gray-300 font-medium transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChartDrilldownModal;
