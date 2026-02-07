import React, { useState, useEffect } from 'react';
import { Bell, CalendarCheck, Wrench, CheckCircle, Clock, Send, XCircle, Phone, Filter, MessageCircle, TrendingUp, Loader2 } from 'lucide-react';
import { PendingReminder, getReminderStatusStyle } from '../../services/engagementMockData';

interface PendingRemindersProps {
    reminders: PendingReminder[];
    onSendReminder?: (reminder: PendingReminder) => Promise<void>;
}

const PendingReminders: React.FC<PendingRemindersProps> = ({ reminders, onSendReminder }) => {
    // Filter state
    const [filterType, setFilterType] = useState<'all' | 'confirmation' | 'maintenance'>('all');
    // Sending state for individual reminders
    const [sendingId, setSendingId] = useState<string | null>(null);

    // Mobile detection
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filter reminders
    const filteredReminders = reminders.filter(r =>
        filterType === 'all' || r.type === filterType
    );

    // Group by date
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const groupedReminders = filteredReminders.reduce((acc, reminder) => {
        let group: string;
        if (reminder.scheduledDate === today) {
            group = 'Hoy';
        } else if (reminder.scheduledDate === tomorrow) {
            group = 'Mañana';
        } else {
            group = 'Esta semana';
        }
        if (!acc[group]) acc[group] = [];
        acc[group].push(reminder);
        return acc;
    }, {} as Record<string, PendingReminder[]>);

    // Success metrics
    const totalSent = reminders.filter(r => r.status === 'sent' || r.status === 'confirmed').length;
    const totalConfirmed = reminders.filter(r => r.status === 'confirmed').length;
    const confirmationRate = totalSent > 0 ? Math.round((totalConfirmed / totalSent) * 100) : 0;

    const getStatusIcon = (status: PendingReminder['status']) => {
        switch (status) {
            case 'confirmed':
                return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'sent':
                return <Send className="h-4 w-4 text-blue-500" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-500" />;
            default:
                return <Clock className="h-4 w-4 text-amber-500" />;
        }
    };

    const getTypeIcon = (type: PendingReminder['type']) => {
        return type === 'confirmation'
            ? <CalendarCheck className="h-4 w-4 text-blue-500" />
            : <Wrench className="h-4 w-4 text-indigo-500" />;
    };

    const getStatusLabel = (status: PendingReminder['status']): string => {
        switch (status) {
            case 'confirmed': return 'Confirmado';
            case 'sent': return 'Enviado';
            case 'cancelled': return 'Cancelado';
            default: return 'Pendiente';
        }
    };

    // Send WhatsApp handler - uses callback if provided, otherwise opens WhatsApp directly
    const handleSendNow = async (reminder: PendingReminder) => {
        if (onSendReminder) {
            // Use n8n API via callback
            setSendingId(reminder.id);
            try {
                await onSendReminder(reminder);
            } finally {
                setSendingId(null);
            }
        } else {
            // Fallback: Open WhatsApp directly
            const message = reminder.type === 'confirmation'
                ? `¡Hola ${reminder.clientName}! 👋 Te recordamos tu cita de ${reminder.serviceName}. ¿Confirmamos? ✅`
                : `¡Hola ${reminder.clientName}! 👋 Ya pasaron algunos días desde tu ${reminder.serviceName}. ¿Te agendamos tu siguiente?`;
            const cleanPhone = reminder.clientPhone.replace(/\D/g, '');
            window.open(`https://wa.me/51${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    };


    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card">
            {/* Header with filter and success rate */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Recordatorios Pendientes
                    </h3>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                        {filteredReminders.filter(r => r.status === 'pending').length} pendientes
                    </span>
                </div>

                {/* Filter dropdown */}
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-gray-400" />
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value as any)}
                        className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white"
                    >
                        <option value="all">Todos</option>
                        <option value="confirmation">Confirmaciones</option>
                        <option value="maintenance">Mantenimientos</option>
                    </select>
                </div>
            </div>

            {/* Success Rate Indicator */}
            <div className="mb-4 flex items-center gap-3 rounded-lg bg-gradient-to-r from-emerald-50 to-blue-50 p-3 dark:from-emerald-900/20 dark:to-blue-900/20">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tasa de Confirmación</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{confirmationRate}%</span>
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${confirmationRate}%` }}
                        />
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500">{totalConfirmed}/{totalSent}</p>
                    <p className="text-[10px] text-gray-400">confirmados</p>
                </div>
            </div>

            {/* Reminders List */}
            <div className="space-y-4">
                {Object.entries(groupedReminders).map(([group, items]: [string, PendingReminder[]]) => (
                    <div key={group}>
                        <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            {group}
                        </h4>

                        {/* Mobile Cards or Desktop List */}
                        {isMobile ? (
                            <div className="space-y-3">
                                {items.map((reminder) => (
                                    <div
                                        key={reminder.id}
                                        className="rounded-lg border border-gray-100 p-3 dark:border-dark-border"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(reminder.type)}
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                                                        {reminder.clientName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{reminder.serviceName}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${getReminderStatusStyle(reminder.status)}`}>
                                                    {getStatusLabel(reminder.status)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1 text-xs text-gray-400">
                                                <Phone size={10} />
                                                {reminder.clientPhone}
                                            </span>

                                            {/* Send Now Button */}
                                            {reminder.status === 'pending' && (
                                                <button
                                                    onClick={() => handleSendNow(reminder)}
                                                    disabled={sendingId === reminder.id}
                                                    className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {sendingId === reminder.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <MessageCircle size={12} />
                                                    )}
                                                    {sendingId === reminder.id ? 'Enviando...' : 'Enviar'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {items.map((reminder) => (
                                    <div
                                        key={reminder.id}
                                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-100 dark:border-dark-border dark:hover:bg-gray-800"
                                    >
                                        <div className="flex items-center gap-3">
                                            {getTypeIcon(reminder.type)}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {reminder.clientName}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <span>{reminder.serviceName}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {reminder.clientPhone}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Send Now Button for pending */}
                                            {reminder.status === 'pending' && (
                                                <button
                                                    onClick={() => handleSendNow(reminder)}
                                                    disabled={sendingId === reminder.id}
                                                    className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {sendingId === reminder.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <MessageCircle size={12} />
                                                    )}
                                                    {sendingId === reminder.id ? 'Enviando...' : 'Enviar Ahora'}
                                                </button>
                                            )}

                                            <span className={`rounded px-2 py-1 text-[10px] font-bold uppercase ${getReminderStatusStyle(reminder.status)}`}>
                                                {getStatusLabel(reminder.status)}
                                            </span>
                                            {getStatusIcon(reminder.status)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredReminders.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                    No hay recordatorios de este tipo
                </p>
            )}
        </div>
    );
};

export default PendingReminders;
