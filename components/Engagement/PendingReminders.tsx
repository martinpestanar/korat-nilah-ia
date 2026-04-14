import React, { useState, useEffect } from 'react';
import { Bell, CalendarCheck, Wrench, CheckCircle, Clock, Send, XCircle, Phone, Filter, MessageCircle, TrendingUp, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PendingReminder, getReminderStatusStyle } from '../../services/engagementMockData';

interface PendingRemindersProps {
    reminders: PendingReminder[];
    onSendReminder?: (reminder: PendingReminder) => Promise<void>;
    itemsPerPage?: number;
}

const PendingReminders: React.FC<PendingRemindersProps> = ({ reminders, onSendReminder, itemsPerPage = 6 }) => {
    const [filterType, setFilterType] = useState<'all' | 'confirmation' | 'maintenance'>('all');
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
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

    // Pagination
    const totalPages = Math.max(1, Math.ceil(filteredReminders.length / itemsPerPage));
    const paginatedReminders = filteredReminders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // Group by date (for the paginated set only, or for the whole set? 
    // Usually grouping by date looks better if we group the whole filtered list then paginate the groups, 
    // but standard pagination is by item. Let's paginate items and then if they fall in same day, they group.)
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const groupedReminders = paginatedReminders.reduce((acc, reminder) => {
        let group: string;
        if (reminder.scheduledDate === today) group = 'Hoy';
        else if (reminder.scheduledDate === tomorrow) group = 'Mañana';
        else group = 'Esta semana';
        
        if (!acc[group]) acc[group] = [];
        acc[group].push(reminder);
        return acc;
    }, {} as Record<string, PendingReminder[]>);

    // Metrics based on ALL reminders (filtered) or just the ones being shown? Usually ALL.
    const totalSent = reminders.filter(r => r.status === 'sent' || r.status === 'confirmed').length;
    const totalConfirmed = reminders.filter(r => r.status === 'confirmed').length;
    const confirmationRate = totalSent > 0 ? Math.round((totalConfirmed / totalSent) * 100) : 0;

    const getStatusIcon = (status: PendingReminder['status']) => {
        switch (status) {
            case 'confirmed': return <CheckCircle className="h-4 w-4 text-emerald-500" />;
            case 'sent': return <Send className="h-4 w-4 text-blue-500" />;
            case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Clock className="h-4 w-4 text-amber-500" />;
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

    const handleSendNow = async (reminder: PendingReminder) => {
        if (onSendReminder) {
            setSendingId(reminder.id);
            try { await onSendReminder(reminder); } 
            finally { setSendingId(null); }
        } else {
            const message = reminder.type === 'confirmation'
                ? `¡Hola ${reminder.clientName}! 👋 Te recordamos tu cita de ${reminder.serviceName}. ¿Confirmamos? ✅`
                : `¡Hola ${reminder.clientName}! 👋 Ya pasaron algunos días desde tu ${reminder.serviceName}. ¿Te agendamos tu siguiente?`;
            const cleanPhone = reminder.clientPhone.replace(/\D/g, '');
            window.open(`https://wa.me/51${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    };

    const handleFilterChange = (val: string) => {
        setFilterType(val as any);
        setCurrentPage(1);
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-card flex flex-col h-full">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                        Recordatorios
                    </h3>
                    <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                        {filteredReminders.filter(r => r.status === 'pending').length} PENDIENTES
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-gray-400" />
                    <select
                        value={filterType}
                        onChange={(e) => handleFilterChange(e.target.value)}
                        className="rounded-lg bg-gray-50 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white"
                    >
                        <option value="all">Ver todos</option>
                        <option value="confirmation">Confirmaciones</option>
                        <option value="maintenance">Sugerir Cita</option>
                    </select>
                </div>
            </div>

            {/* Success RateIndicator - Simplified */}
            <div className="mb-4 flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Tasa de Exito</p>
                        <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{confirmationRate}%</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{totalConfirmed}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Confirmados</p>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 space-y-4">
                {Object.entries(groupedReminders).map(([group, items]) => (
                    <div key={group}>
                        <h4 className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            {group}
                        </h4>

                        <div className="space-y-2">
                            {items.map((reminder) => (
                                <div
                                    key={reminder.id}
                                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-dark-border dark:hover:bg-gray-800"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`p-2 rounded-lg ${reminder.type === 'confirmation' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'} dark:bg-white/5`}>
                                            {getTypeIcon(reminder.type)}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                                {reminder.clientName}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                                <span className="truncate">{reminder.serviceName}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {reminder.status === 'pending' ? (
                                            <button
                                                onClick={() => handleSendNow(reminder)}
                                                disabled={sendingId === reminder.id}
                                                className="flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-[10px] font-black uppercase text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                                            >
                                                {sendingId === reminder.id ? (
                                                    <Loader2 size={12} className="animate-spin" />
                                                ) : (
                                                    <MessageCircle size={12} />
                                                )}
                                                {sendingId === reminder.id ? '...' : 'Enviar'}
                                            </button>
                                        ) : (
                                            <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${getReminderStatusStyle(reminder.status)}`}>
                                                {getStatusLabel(reminder.status)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {paginatedReminders.length === 0 && (
                    <div className="py-10 text-center">
                        <CheckCircle size={32} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400">¡Todo al día!</p>
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">
                        {currentPage} de {totalPages}
                    </p>
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 dark:border-gray-700 dark:text-gray-400"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 dark:border-gray-700 dark:text-gray-400"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PendingReminders;
