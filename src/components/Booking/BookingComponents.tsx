import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Clock, User, Sparkles, Check, UserPlus, Phone, Crown, Flame, ChevronRight, History } from 'lucide-react';
import { appointments as appointmentsApi, servicios, negocioInfo, categoriasCalendario } from '../../services/api';
import { useDashboardData } from '../../context/DashboardDataContext';
import { getTimeInLima, getDateInLima } from '../../utils/timezone';

// Types
interface TimeSlot {
    time: string;
    status: 'free' | 'booked' | 'blocked' | 'past' | 'lunch';
    client?: string;
    service?: string;
}

interface DaySummary {
    date: string;
    label: string;
    freeSlots: number;
    isToday: boolean;
}

interface Client {
    id: number;
    nombre: string;
    telefono?: string;
    ultima_visita?: string;
    categoria?: string;
    total_visitas?: number;
    fiabilidad_score?: number | null;
}

interface Service {
    id: number;
    nombre: string;
    precio: number;
    duracion_min: number;
    categoria?: string;
}

interface QuickBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDate: string;
    selectedTime: string;
    onSuccess: () => void;
    staffList: Array<{ id: number; nombre: string; especialidad?: string; cat_staff?: string }>;
}

// Helper para obtener fecha local YYYY-MM-DD (evita problema de timezone con toISOString)
const getLocalDateStr = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// ============================================
// COMPONENTE: Day Carousel
// ============================================
export const DayCarousel: React.FC<{
    selectedDate: string;
    onDateChange: (date: string) => void;
    appointments: any[];
}> = ({ selectedDate, onDateChange, appointments }) => {
    const [businessHours, setBusinessHours] = useState({
        weekdays: { start: 9, end: 20 },
        saturday: { start: 9, end: 20 },
        sunday: { start: 9, end: 20 }
    });

    useEffect(() => {
        const fetchHours = async () => {
            try {
                const data = await negocioInfo.getAll();

                if (Array.isArray(data)) {
                    const getHours = (openKey: string, closeKey: string) => {
                        const openStr = data.find((i: any) => i.clave === openKey)?.valor_texto;
                        const closeStr = data.find((i: any) => i.clave === closeKey)?.valor_texto;
                        return {
                            start: openStr ? parseInt(openStr.split(':')[0]) : 9,
                            end: closeStr ? parseInt(closeStr.split(':')[0]) : 20
                        };
                    };

                    setBusinessHours({
                        weekdays: getHours('hora_apertura', 'hora_cierre'),
                        saturday: getHours('hora_apertura_sabado', 'hora_cierre_sabado'),
                        sunday: getHours('hora_apertura_domingo', 'hora_cierre_domingo')
                    });
                }
            } catch (e) {
                console.error('Error fetching hours in carousel:', e);
            }
        };
        fetchHours();
    }, []);

    const days = useMemo(() => {
        const result: DaySummary[] = [];
        const today = new Date();
        const currentHour = today.getHours();

        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            const dateStr = getLocalDateStr(date);

            const dayAppointments = appointments.filter(apt =>
                apt.fecha?.startsWith(dateStr) && apt.estado !== 'cancelled'
            );

            // Determinar horario del día específico
            const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

            let dayStart = businessHours.weekdays.start;
            let dayEnd = businessHours.weekdays.end;

            if (dayOfWeek === 6) {
                dayStart = businessHours.saturday.start;
                dayEnd = businessHours.saturday.end;
            } else if (dayOfWeek === 0) {
                dayStart = businessHours.sunday.start;
                dayEnd = businessHours.sunday.end;
            }

            // Calcular slots totales reales (horas abiertas - 1h almuerzo)
            // Si el horario es inválido (ej: cerrado), slots es 0
            const totalOpenHours = Math.max(0, dayEnd - dayStart);
            let totalSlots = totalOpenHours > 0 ? Math.max(0, totalOpenHours - 1) : 0;

            // Si es HOY, descontar las horas que ya pasaron
            if (i === 0) {
                const horasPasadas = Math.max(0, currentHour - dayStart + 1);
                totalSlots = Math.max(0, totalSlots - horasPasadas);
            }

            const bookedSlots = dayAppointments.length;

            result.push({
                date: dateStr,
                label: i === 0 ? 'HOY' : i === 1 ? 'MAÑANA' : date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' }).toUpperCase(),
                freeSlots: Math.max(0, totalSlots - bookedSlots),
                isToday: i === 0
            });
        }
        return result;
    }, [appointments, businessHours]);


    const getSlotColor = (slots: number) => {
        if (slots <= 0) return 'bg-red-500';
        if (slots <= 2) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {days.map((day) => (
                <button
                    key={day.date}
                    onClick={() => onDateChange(day.date)}
                    className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl border-2 transition-all min-w-[80px] ${selectedDate === day.date
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300'
                        }`}
                >
                    <span className={`text-xs font-bold ${day.isToday ? 'text-violet-600' : 'text-gray-500'}`}>
                        {day.label}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                        {new Date(day.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    </span>
                    <div className={`mt-2 flex items-center gap-1 px-2 py-0.5 rounded-full ${getSlotColor(day.freeSlots)} text-white text-xs font-medium`}>
                        <span>{day.freeSlots}</span>
                        <span className="opacity-80">slots</span>
                    </div>
                </button>
            ))}
        </div>
    );
};

// ============================================
// COMPONENTE: Timeline Slots (Multi-staff, 30 min intervals)
// ============================================
export const TimelineSlots: React.FC<{
    date: string;
    appointments: any[];
    onSlotClick: (time: string) => void;
    selectedTime?: string;
    lunchHours?: string;
    closedDays?: Array<{ fecha: string; motivo: string; hora_inicio?: string; hora_fin?: string; es_dia_completo?: boolean }>;
    staff?: Array<{ id: number; nombre: string; activo?: boolean }>;
}> = ({ date, appointments, onSlotClick, selectedTime, lunchHours = "12pm - 2pm", closedDays = [], staff = [] }) => {
    // State para datos de disponibilidad (fallback legacy API)
    const [apiSlots, setApiSlots] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const [businessHours, setBusinessHours] = useState({
        weekdays: { start: 9, end: 20 },
        saturday: { start: 9, end: 20 },
        sunday: { start: 9, end: 20 }
    });

    // Fetch business hours
    useEffect(() => {
        const fetchHours = async () => {
            try {
                const data = await negocioInfo.getAll();
                if (Array.isArray(data)) {
                    const getHours = (openKey: string, closeKey: string) => {
                        const openStr = data.find((i: any) => i.clave === openKey)?.valor_texto;
                        const closeStr = data.find((i: any) => i.clave === closeKey)?.valor_texto;
                        return {
                            start: openStr ? parseInt(openStr.split(':')[0]) : 9,
                            end: closeStr ? parseInt(closeStr.split(':')[0]) : 20
                        };
                    };
                    setBusinessHours({
                        weekdays: getHours('hora_apertura', 'hora_cierre'),
                        saturday: getHours('hora_apertura_sabado', 'hora_cierre_sabado'),
                        sunday: getHours('hora_apertura_domingo', 'hora_cierre_domingo')
                    });
                }
            } catch (e) { console.error('Error fetching hours', e); }
        };
        fetchHours();
    }, []);

    // Parsear hora de almuerzo
    const parsedLunchHours = useMemo(() => {
        try {
            if (!lunchHours || lunchHours === 'CERRADO') return { start: 0, end: 0 };
            const parts = lunchHours.toLowerCase().replace(/\s/g, '').split('-');
            if (parts.length !== 2) return { start: 12, end: 14 };
            const parseHour = (str: string): number => {
                const isPM = str.includes('pm');
                const num = parseInt(str.replace(/[^\d]/g, ''));
                if (isPM && num !== 12) return num + 12;
                if (!isPM && num === 12) return 0;
                return num;
            };
            return { start: parseHour(parts[0]), end: parseHour(parts[1]) };
        } catch { return { start: 12, end: 14 }; }
    }, [lunchHours]);

    const dayClosureInfo = useMemo(() => closedDays.find(d => d.fecha === date), [date, closedDays]);

    // Calcular slots (Intervalos de 30 mins)
    const slots = useMemo(() => {
        const result: TimeSlot[] = [];
        const now = new Date();
        const today = getLocalDateStr(now);
        const isToday = date === today;
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        const dateObj = new Date(date + 'T12:00:00');
        const dayOfWeek = dateObj.getDay();

        let startHour = businessHours.weekdays.start;
        let endHour = businessHours.weekdays.end;

        if (dayOfWeek === 6) { startHour = businessHours.saturday.start; endHour = businessHours.saturday.end; }
        else if (dayOfWeek === 0) { startHour = businessHours.sunday.start; endHour = businessHours.sunday.end; }

        if (startHour >= endHour) return [];

        // Capacity calculation
        const activeStaffCount = staff.filter(s => s.activo !== false).length || 1; // Default to 1 if empty

        // Generate 30 min intervals
        for (let h = startHour; h < endHour; h += 0.5) {
            const hour = Math.floor(h);
            const minute = (h % 1) * 60;
            const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

            // 1. Check blocked/closed
            if (dayClosureInfo?.es_dia_completo) {
                result.push({ time: timeStr, status: 'blocked' });
                continue;
            }
            if (dayClosureInfo && dayClosureInfo.hora_inicio && dayClosureInfo.hora_fin) {
                const closedStart = parseInt(dayClosureInfo.hora_inicio.split(':')[0]);
                const closedEnd = parseInt(dayClosureInfo.hora_fin.split(':')[0]);
                if (h >= closedStart && h < closedEnd) {
                    result.push({ time: timeStr, status: 'blocked' });
                    continue;
                }
            }

            // 2. Check Lunch
            if (h >= parsedLunchHours.start && h < parsedLunchHours.end) {
                result.push({ time: timeStr, status: 'lunch' });
                continue;
            }

            // 3. Check Past
            if (isToday) {
                if (hour < currentHour || (hour === currentHour && minute < currentMin)) {
                    result.push({ time: timeStr, status: 'past' });
                    continue;
                }
            }

            // 4. Check Capacity
            const slotStart = h;
            const slotEnd = h + 0.5;

            let concurrentlyBooked = 0;
            const bookingDetails: any[] = [];

            appointments.forEach(apt => {
                if (!apt.fecha || apt.estado === 'cancelled' || apt.estado === 'Cancelada') return;

                const aptDate = getDateInLima(apt.fecha);
                if (aptDate !== date) return;

                const aptTimeStr = getTimeInLima(apt.fecha);
                const [aptH, aptM] = aptTimeStr.split(':').map(Number);
                const aptStart = aptH + (aptM / 60);

                // Duration handling: use duracion_min or default 60
                const duration = apt.duracion_min || 60;
                const aptEnd = aptStart + (duration / 60);

                // Check overlap (Strict overlap)
                // Appt: [11:00, 12:30) (90 mins)
                // Slot: [11:00, 11:30) -> Overlap!
                // Slot: [11:30, 12:00) -> Overlap!
                // Slot: [12:00, 12:30) -> Overlap!
                // Slot: [12:30, 13:00) -> No Overlap
                if (Math.max(slotStart, aptStart) < Math.min(slotEnd, aptEnd)) {
                    concurrentlyBooked++;
                    bookingDetails.push(apt);
                }
            });

            // If booked count >= active staff -> Blocked
            if (concurrentlyBooked >= activeStaffCount) {
                result.push({
                    time: timeStr,
                    status: 'booked',
                    client: 'Ocupado',
                    service: ''
                });
            } else {
                result.push({ time: timeStr, status: 'free' });
            }
        }
        return result;
    }, [date, appointments, parsedLunchHours, dayClosureInfo, businessHours, staff]);


    const getSlotStyle = (slot: TimeSlot, isSelected: boolean) => {
        const base = 'flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all cursor-pointer min-w-[70px] h-[80px]';

        if (isSelected) {
            return `${base} border-violet-500 bg-violet-100 dark:bg-violet-500/20 ring-2 ring-violet-500/50`;
        }

        switch (slot.status) {
            case 'free':
                return `${base} border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 hover:border-emerald-400 hover:shadow-md`;
            case 'booked':
                return `${base} border-gray-300 bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-60`;
            case 'past':
                return `${base} border-gray-200 bg-gray-100 dark:bg-gray-900 cursor-not-allowed opacity-30`;
            case 'lunch':
                return `${base} border-amber-200 bg-amber-50 dark:bg-amber-900/20 cursor-not-allowed opacity-50`;
            case 'blocked':
                return `${base} border-gray-200 bg-gray-50 dark:bg-gray-900 cursor-not-allowed opacity-40`;
            default:
                return base;
        }
    };

    return (
        <div className="overflow-x-auto pb-4">
            {apiError && (
                <div className="mb-2 text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Usando datos locales (API no disponible)</span>
                </div>
            )}
            <div className="flex gap-2 min-w-max">
                {slots.map((slot) => (
                    <div
                        key={slot.time}
                        onClick={() => slot.status === 'free' && onSlotClick(slot.time)}
                        className={getSlotStyle(slot, selectedTime === slot.time)}
                    >
                        <span className={`text-sm font-bold ${slot.status === 'free' ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500'}`}>
                            {slot.time}
                        </span>

                        {slot.status === 'free' && (
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">✓ Libre</span>
                        )}

                        {slot.status === 'booked' && (
                            <div className="text-center mt-1">
                                <span className="text-xs text-gray-600 dark:text-gray-400 block truncate max-w-[60px]">
                                    {slot.client}
                                </span>
                            </div>
                        )}

                        {slot.status === 'past' && (
                            <span className="text-xs text-gray-400 mt-1">⏰ Pasado</span>
                        )}

                        {slot.status === 'lunch' && (
                            <span className="text-xs text-amber-600 dark:text-amber-400 mt-1">🍽️ Almuerzo</span>
                        )}

                        {slot.status === 'blocked' && (
                            <span className="text-xs text-gray-400 mt-1">🚫 Cerrado</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============================================
// COMPONENTE: Client Quick Search (UX Experto para Salones)
// ============================================
const AVATAR_GRADIENTS = [
    'from-violet-500 to-indigo-600',
    'from-fuchsia-500 to-pink-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-sky-500 to-blue-600',
    'from-purple-500 to-violet-600',
];

const getClientGradient = (name: string = '') => {
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return AVATAR_GRADIENTS[sum % AVATAR_GRADIENTS.length];
};

const normalizeText = (text: string = '') => {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

export const ClientQuickSearch: React.FC<{
    value: Client | null;
    onChange: (client: Client | null) => void;
    clients: Client[];
}> = ({ value, onChange, clients }) => {
    const [search, setSearch] = useState('');
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Clientes Frecuentes / Recientes sugeridos (Top 4)
    const suggestedClients = useMemo(() => {
        return [...clients]
            .sort((a, b) => (b.total_visitas || 0) - (a.total_visitas || 0))
            .slice(0, 4);
    }, [clients]);

    // Filtrar clientes en tiempo real
    const filteredClients = useMemo(() => {
        if (!search.trim()) {
            return clients.slice(0, 6);
        }
        const cleanQuery = normalizeText(search);
        const cleanPhoneQuery = search.replace(/\D/g, '');

        return clients.filter(c => {
            const matchesName = normalizeText(c.nombre).includes(cleanQuery);
            const matchesPhone = cleanPhoneQuery && c.telefono
                ? c.telefono.replace(/\D/g, '').includes(cleanPhoneQuery)
                : false;
            return matchesName || matchesPhone;
        }).slice(0, 8);
    }, [search, clients]);

    const handleStartNewClient = (prefillName?: string) => {
        setIsNewClient(true);
        setNewClientName(prefillName || search || '');
        setNewClientPhone('');
    };

    const handleNewClientConfirm = () => {
        if (newClientName.trim()) {
            onChange({
                id: -1,
                nombre: newClientName.trim(),
                telefono: newClientPhone.trim() || undefined,
                total_visitas: 1,
                categoria: 'Nuevo'
            });
            setIsNewClient(false);
            setSearch('');
            setNewClientName('');
            setNewClientPhone('');
        }
    };

    // 1. ESTADO: CLIENTE SELECCIONADO (Tarjeta resumen elegante)
    if (value) {
        const isVip = value.categoria?.toUpperCase().includes('VIP') || (value.total_visitas || 0) >= 8;
        const isFrecuente = !isVip && (value.total_visitas || 0) >= 3;
        const isNuevo = value.id === -1 || value.categoria === 'Nuevo' || (value.total_visitas || 0) <= 1;

        return (
            <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-violet-50/90 via-purple-50/50 to-white dark:from-violet-950/40 dark:via-purple-950/20 dark:to-gray-800/80 border-2 border-violet-500/40 dark:border-violet-500/30 shadow-sm transition-all animate-in fade-in duration-200">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${getClientGradient(value.nombre)} flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0`}>
                            {value.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-gray-900 dark:text-white text-base truncate">
                                    {value.nombre}
                                </h4>
                                {isVip && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
                                        <Crown size={12} className="text-amber-500" /> VIP
                                    </span>
                                )}
                                {isFrecuente && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300">
                                        <Flame size={12} className="text-violet-500" /> {value.total_visitas} citas
                                    </span>
                                )}
                                {isNuevo && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                        ✨ Nuevo
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                <Phone size={12} className="text-gray-400" />
                                <span>{value.telefono || 'Sin número registrado'}</span>
                                {value.ultima_visita && (
                                    <span className="text-[11px] text-gray-400 ml-1">
                                        · Última: {value.ultima_visita.split('T')[0]}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            onChange(null);
                            setTimeout(() => searchInputRef.current?.focus(), 50);
                        }}
                        className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-xs font-semibold text-violet-600 dark:text-violet-300 shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        Cambiar
                    </button>
                </div>
            </div>
        );
    }

    // 2. ESTADO: CREAR NUEVO CLIENTE (Formulario Express integrado)
    if (isNewClient) {
        return (
            <div className="p-4 rounded-2xl bg-violet-50/70 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-500/30 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 font-bold text-sm">
                        <UserPlus size={16} />
                        <span>Registrar Nuevo Cliente</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsNewClient(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="space-y-2">
                    <input
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Nombre completo (ej: Valentina Torres)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        autoFocus
                    />
                    <input
                        type="tel"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        placeholder="WhatsApp / Teléfono (opcional)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 outline-none"
                    />
                </div>

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={() => setIsNewClient(false)}
                        className="flex-1 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleNewClientConfirm}
                        disabled={!newClientName.trim()}
                        className="flex-1 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                    >
                        <Check size={14} /> Usar este Cliente
                    </button>
                </div>
            </div>
        );
    }

    // 3. ESTADO: BÚSQUEDA INTELIGENTE + SLOTS DE ACCESO RÁPIDO
    return (
        <div className="space-y-3">
            {/* Input de Búsqueda Principal con Botón +Nuevo integrado */}
            <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={17} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Escribe nombre o WhatsApp..."
                        className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all shadow-xs"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => handleStartNewClient()}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 border border-violet-200 dark:border-violet-500/30 text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-xs"
                    title="Registrar nuevo cliente"
                >
                    <UserPlus size={15} />
                    <span className="hidden sm:inline">+ Nuevo</span>
                </button>
            </div>

            {/* Accesos Rápidos de Clientes Frecuentes (Sólo cuando no hay búsqueda activa) */}
            {!search.trim() && suggestedClients.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Flame size={13} className="text-amber-500" />
                        Accesos Rápidos Frecuentes
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedClients.map((sc) => (
                            <button
                                key={sc.id}
                                type="button"
                                onClick={() => onChange(sc)}
                                className="group flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 hover:bg-violet-50 dark:hover:bg-violet-500/15 border border-gray-200/80 dark:border-gray-700/80 hover:border-violet-300 dark:hover:border-violet-500/40 text-left transition-all hover:scale-102 active:scale-98"
                            >
                                <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${getClientGradient(sc.nombre)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                                    {sc.nombre?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-medium text-gray-800 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-300 truncate max-w-[130px]">
                                    {sc.nombre}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Lista de Resultados Asistida */}
            <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 divide-y-0 scrollbar-thin">
                {filteredClients.length > 0 ? (
                    filteredClients.map((client) => {
                        const isVip = client.categoria?.toUpperCase().includes('VIP') || (client.total_visitas || 0) >= 8;
                        const isFrecuente = !isVip && (client.total_visitas || 0) >= 3;

                        return (
                            <button
                                key={client.id}
                                type="button"
                                onClick={() => onChange(client)}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-violet-50/70 dark:hover:bg-violet-500/10 border border-transparent hover:border-violet-200 dark:hover:border-violet-500/30 transition-all text-left group"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${getClientGradient(client.nombre)} flex items-center justify-center text-white text-sm font-bold shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                                        {client.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                                                {client.nombre}
                                            </p>
                                            {isVip && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
                                                    VIP
                                                </span>
                                            )}
                                            {isFrecuente && (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 shrink-0">
                                                    {client.total_visitas} citas
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            {client.telefono || 'Sin teléfono'}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-gray-300 dark:text-gray-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all">
                                    <ChevronRight size={16} />
                                </div>
                            </button>
                        );
                    })
                ) : (
                    /* Estado 0 Resultados: Botón Automático para Crear */
                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-dashed border-gray-200 dark:border-gray-700 text-center space-y-2.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            No se encontró ningún cliente con "<span className="font-medium text-gray-700 dark:text-gray-300">{search}</span>"
                        </p>
                        <button
                            type="button"
                            onClick={() => handleStartNewClient(search)}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                        >
                            <UserPlus size={14} />
                            Crear "{search}" como nuevo cliente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// COMPONENTE: Service Chips (Mejorado con búsqueda y categorías)
// ============================================
export const ServiceChips: React.FC<{
    value: Service | null;
    onChange: (service: Service | null) => void;
    services: Service[];
}> = ({ value, onChange, services }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('todos');

    // Inferir categoría basada en nombre del servicio
    const getServiceCategory = (nombre: string): string => {
        const n = nombre.toLowerCase();
        if (n.includes('uñas') || n.includes('mani') || n.includes('acril') || n.includes('gel') || n.includes('esmalt') || n.includes('rubber')) return 'Uñas Manos';
        if (n.includes('pedi') || n.includes('pies')) return 'Pedicura';
        if (n.includes('pest') || n.includes('lifting') || n.includes('tinte') || n.includes('wispy') || n.includes('fox') || n.includes('cat eye') || n.includes('extensiones')) return 'Pestañas';
        if (n.includes('facial') || n.includes('rostro') || n.includes('hidra') || n.includes('limpieza')) return 'Facial';
        if (n.includes('cabello') || n.includes('corte') || n.includes('tinte') || n.includes('mechas') || n.includes('balayage') || n.includes('keratina')) return 'Cabello';
        if (n.includes('ceja') || n.includes('depila')) return 'Cejas/Depilación';
        return 'Otros';
    };

    const getServiceIcon = (nombre: string) => {
        const n = nombre.toLowerCase();
        if (n.includes('uñas') || n.includes('mani') || n.includes('acril') || n.includes('gel') || n.includes('esmalt')) return '💅';
        if (n.includes('pedi') || n.includes('pies')) return '🦶';
        if (n.includes('pest') || n.includes('lifting') || n.includes('wispy') || n.includes('fox') || n.includes('cat')) return '👁️';
        if (n.includes('facial') || n.includes('rostro') || n.includes('hidra')) return '🧖';
        if (n.includes('cabello') || n.includes('corte') || n.includes('tinte') || n.includes('mechas')) return '💇';
        if (n.includes('ceja') || n.includes('depila')) return '✨';
        return '💫';
    };

    // Obtener categorías únicas disponibles
    const categories = useMemo(() => {
        const cats = new Set<string>();
        services.forEach(s => cats.add(getServiceCategory(s.nombre)));
        return ['todos', ...Array.from(cats)];
    }, [services]);

    // Filtrar servicios por búsqueda y categoría
    const filteredServices = useMemo(() => {
        return services.filter(s => {
            const matchesSearch = searchTerm === '' ||
                s.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'todos' ||
                getServiceCategory(s.nombre) === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [services, searchTerm, activeCategory]);

    // Agrupar servicios por categoría para mostrar
    const groupedServices = useMemo(() => {
        if (activeCategory !== 'todos') {
            return { [activeCategory]: filteredServices };
        }
        const groups: Record<string, Service[]> = {};
        filteredServices.forEach(s => {
            const cat = getServiceCategory(s.nombre);
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(s);
        });
        return groups;
    }, [filteredServices, activeCategory]);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Uñas Manos': return '💅';
            case 'Pedicura': return '🦶';
            case 'Pestañas': return '👁️';
            case 'Facial': return '🧖';
            case 'Cabello': return '💇';
            case 'Cejas/Depilación': return '✨';
            case 'todos': return '📋';
            default: return '💫';
        }
    };

    return (
        <div className="space-y-3">
            {/* Buscador */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar servicio..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Tabs de categorías */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${activeCategory === cat
                            ? 'bg-violet-500 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                    >
                        <span>{getCategoryIcon(cat)}</span>
                        <span>{cat === 'todos' ? 'Todos' : cat}</span>
                        {cat !== 'todos' && (
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeCategory === cat ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                                }`}>
                                {services.filter(s => getServiceCategory(s.nombre) === cat).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Grid de servicios agrupados */}
            <div className="max-h-[35vh] overflow-y-auto pr-1 space-y-4">
                {(Object.entries(groupedServices) as [string, Service[]][]).map(([category, categoryServices]) => (
                    <div key={category}>
                        {activeCategory === 'todos' && (
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                                <span>{getCategoryIcon(category)}</span>
                                {category}
                                <span className="text-gray-400">({categoryServices.length})</span>
                            </p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {categoryServices.map((service) => (
                                <button
                                    key={service.id}
                                    onClick={() => onChange(value?.id === service.id ? null : service)}
                                    className={`flex flex-col items-center text-center gap-1 px-2 py-2.5 rounded-xl border-2 transition-all ${value?.id === service.id
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 ring-2 ring-violet-500/30 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-violet-300 hover:shadow-sm'
                                        }`}
                                >
                                    <span className="text-lg">{getServiceIcon(service.nombre)}</span>
                                    <p className={`text-[11px] font-medium leading-tight line-clamp-2 ${value?.id === service.id ? 'text-violet-700 dark:text-violet-300' : 'text-gray-900 dark:text-white'}`}>
                                        {service.nombre}
                                    </p>
                                    <p className="text-[10px] text-gray-500">
                                        ${service.precio} · {service.duracion_min}min
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Estado vacío */}
                {filteredServices.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <Search size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No se encontraron servicios</p>
                        <button
                            onClick={() => { setSearchTerm(''); setActiveCategory('todos'); }}
                            className="text-xs text-violet-500 hover:underline mt-1"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================
// COMPONENTE: Success Confetti
// ============================================
export const SuccessConfetti: React.FC<{
    show: boolean;
    clientName: string;
    serviceName: string;
    dateTime: string;
    onClose: () => void;
}> = ({ show, clientName, serviceName, dateTime, onClose }) => {
    const [confettiPieces] = useState(() =>
        [...Array(50)].map((_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            color: ['#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#3B82F6'][Math.floor(Math.random() * 5)],
            isCircle: Math.random() > 0.5
        }))
    );

    if (!show) return null;

    return (
        <>
            <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        .confetti-piece { animation: confetti-fall 3s ease-out forwards; }
      `}</style>

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {confettiPieces.map((piece) => (
                        <div
                            key={piece.id}
                            className="absolute confetti-piece"
                            style={{
                                left: `${piece.left}%`,
                                top: '-10px',
                                animationDelay: `${piece.delay}s`,
                                backgroundColor: piece.color,
                                width: '10px',
                                height: '10px',
                                borderRadius: piece.isCircle ? '50%' : '0',
                            }}
                        />
                    ))}
                </div>

                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
                    <div className="text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            ¡Cita Confirmada!
                        </h2>

                        <div className="my-6 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <p className="font-medium text-gray-900 dark:text-white">{clientName}</p>
                            <p className="text-violet-600 dark:text-violet-400">{serviceName}</p>
                            <p className="text-sm text-gray-500 mt-1">{dateTime}</p>
                        </div>

                        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm mb-6">
                            <Check size={16} />
                            <span>Recordatorio programado</span>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-3 px-4 bg-violet-500 hover:bg-violet-600 text-white font-medium rounded-xl transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

// ============================================
// COMPONENTE PRINCIPAL: Quick Book Modal
// ============================================
export const QuickBookModal: React.FC<QuickBookModalProps> = ({
    isOpen,
    onClose,
    selectedDate,
    selectedTime,
    onSuccess,
    staffList = []
}) => {
    // ✅ USAR CLIENTES DEL CONTEXTO (ya filtrados por business_id)
    const { clients: dashboardClientes, refresh: refreshDashboard } = useDashboardData();

    const [client, setClient] = useState<Client | null>(null);
    const [service, setService] = useState<Service | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [selectedCategoria, setSelectedCategoria] = useState<string>(''); // Categoría de staff
    const [selectedStaffId, setSelectedStaffId] = useState<string>(''); // Staff específico
    const [categoriasList, setCategoriasList] = useState<Array<{ id: number; nombre: string; emoji?: string; activo: boolean }>>([]);
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Clientes desde el contexto
    const clients: Client[] = useMemo(() => {
        if (dashboardClientes && dashboardClientes.length > 0) {
            return dashboardClientes.map((c: any) => ({
                id: c.id || 0,
                nombre: c.nombre || 'Sin nombre',
                telefono: c.telefono || '',
                ultima_visita: c.ultima_visita || '',
                categoria: c.categoria || '',
                total_visitas: c.total_visitas || 0,
                fiabilidad_score: c.fiabilidad_score
            }));
        }
        return [];
    }, [dashboardClientes]);

    useEffect(() => {
        if (isOpen) {
            loadServices();
            categoriasCalendario.getAll().then((data: any) => {
                if (Array.isArray(data)) setCategoriasList(data);
            }).catch(() => { });
        }
    }, [isOpen]);

    // Solo cargar servicios (clientes vienen del contexto)
    const loadServices = async () => {
        try {
            const servicesData = await servicios.getAll();
            setServices((servicesData as Service[]) || []);
        } catch (error) {
            console.error('Error loading services:', error);
        }
    };

    const handleConfirm = async () => {
        if (!client || !service) return;

        setLoading(true);

        // FIX: Manejo de Staff ID (Evitar Null si la DB lo requiere)
        let finalStaffId: number | null = selectedStaffId ? parseInt(selectedStaffId) : null;

        if (!finalStaffId && selectedCategoria) {
            // Filtrar staff disponible para esta categoría
            const eligibleStaff = staffList.filter(s => {
                const staffCat = (s.cat_staff || s.especialidad || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                const catFilter = selectedCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                return staffCat === catFilter && s.activo !== false;
            });

            if (eligibleStaff.length > 0) {
                // Asignar aleatoriamente 
                const randomStaff = eligibleStaff[Math.floor(Math.random() * eligibleStaff.length)];
                finalStaffId = randomStaff.id;
            } else {
                alert(`⚠️ No hay personal disponible para la categoría "${selectedCategoria}". Por favor contacta al administrador.`);
                setLoading(false);
                return;
            }
        }

        try {
            // FIX: Robust payload preparation
            await appointmentsApi.create({
                fecha: `${selectedDate}T${selectedTime}:00-05:00`, // Con timezone Lima
                duracion_min: (service as any).duracion_min || (service as any).durationMin || (service as any).duration || (service as any).duracion || 60,
                cliente_id: client.id,
                nombre: client.nombre,
                servicio: service.nombre,
                precio: service.precio || 0,
                categoria: selectedCategoria || service.categoria || 'multi', // Categoría de staff
                staff_id: finalStaffId
            } as any);

            // ✅ REFRESCAR EL CONTEXTO para actualizar datos en tiempo real
            await refreshDashboard(true);

            setShowSuccess(true);
        } catch (error: any) {
            console.error('Error creating appointment:', error);

            // Manejo específico de error 409 (conflicto)
            if (error.status === 409) {
                alert('⚠️ Este horario acaba de ser reservado. Por favor selecciona otro.');
                onClose(); // Cerrar para que vea el timeline actualizado
            } else {
                alert(error.message || 'Error al crear la cita');
            }
        } finally {
            setLoading(false);
        }
    };


    const handleSuccessClose = () => {
        setShowSuccess(false);
        setClient(null);
        setService(null);
        setSelectedStaffId('');
        onSuccess();
        onClose();
    };

    const formatDateTime = () => {
        const date = new Date(selectedDate + 'T12:00:00');
        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
        const dayNum = date.getDate();
        const month = date.toLocaleDateString('es-ES', { month: 'long' });
        return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${dayNum} de ${month}, ${selectedTime}`;
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

            <div className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-40 bg-white dark:bg-gray-800 rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] md:max-h-[80vh] md:max-w-2xl md:w-full overflow-hidden flex flex-col">
                <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-violet-500" size={20} />
                                Agendar Cita
                            </h2>
                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                <Clock size={14} />
                                {formatDateTime()}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            👤 Cliente
                        </label>
                        <ClientQuickSearch value={client} onChange={setClient} clients={clients} />
                    </div>

                    {/* Category Selector (MOVED UP) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            🎯 Área de Staff <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedCategoria}
                            onChange={(e) => { setSelectedCategoria(e.target.value); setSelectedStaffId(''); }}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        >
                            <option value="">Seleccionar categoría...</option>
                            {categoriasList.filter(c => c.activo).map(c => (
                                <option key={c.id} value={c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}>{c.emoji || '📁'} {c.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Staff Selector (NEW) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            👤 Profesional (Opcional)
                        </label>
                        <select
                            value={selectedStaffId}
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 p-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                        >
                            <option value="">Sin preferencia (Cualquiera disponible)</option>
                            {staffList
                                .filter(s => {
                                    if (!selectedCategoria) return true;
                                    const staffCat = (s.cat_staff || s.especialidad || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                                    const catFilter = selectedCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                                    return staffCat === catFilter;
                                })
                                .map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Service Selector (MOVED DOWN) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            💅 Servicio
                        </label>
                        <ServiceChips
                            value={service}
                            onChange={setService}
                            services={services.filter(s => {
                                if (!selectedCategoria) return true;
                                const sCat = (s.categoria || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                                const filterCat = selectedCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                                return sCat === filterCat || sCat === 'multi';
                            })}
                        />
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleConfirm}
                        disabled={!client || !service || !selectedCategoria || loading}
                        className="btn-primary w-full py-4 px-6 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Check size={20} />
                                Confirmar Cita
                            </>
                        )}
                    </button>
                </div>
            </div>

            <SuccessConfetti
                show={showSuccess}
                clientName={client?.nombre || ''}
                serviceName={service?.nombre || ''}
                dateTime={formatDateTime()}
                onClose={handleSuccessClose}
            />
        </>
    );
};

export default QuickBookModal;
