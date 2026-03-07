import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Clock, User, Sparkles, Check } from 'lucide-react';
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
// COMPONENTE: Client Quick Search
// ============================================
export const ClientQuickSearch: React.FC<{
    value: Client | null;
    onChange: (client: Client | null) => void;
    clients: Client[];
}> = ({ value, onChange, clients }) => {
    const [search, setSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    const filteredClients = useMemo(() => {
        if (!search) return clients.slice(0, 5);
        return clients.filter(c =>
            c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            c.telefono?.includes(search)
        ).slice(0, 5);
    }, [search, clients]);

    const handleNewClientConfirm = () => {
        if (newClientName) {
            onChange({
                id: -1,
                nombre: newClientName,
                telefono: newClientPhone
            });
            setIsNewClient(false);
            setShowDropdown(false);
        }
    };

    if (value) {
        return (
            <div className="flex items-center justify-between p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-bold">
                        {value.nombre?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{value.nombre}</p>
                        {value.telefono && (
                            <p className="text-sm text-gray-500">{value.telefono}</p>
                        )}
                    </div>
                </div>
                <button onClick={() => onChange(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Buscar cliente por nombre o teléfono..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
            </div>

            {showDropdown && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                    {!isNewClient ? (
                        <>
                            {filteredClients.map((client) => (
                                <button
                                    key={client.id}
                                    onClick={() => {
                                        onChange(client);
                                        setShowDropdown(false);
                                        setSearch('');
                                    }}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-sm font-medium">
                                        {client.nombre?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{client.nombre}</p>
                                        <p className="text-xs text-gray-500">{client.telefono || 'Sin teléfono'}</p>
                                    </div>
                                </button>
                            ))}

                            <button
                                onClick={() => setIsNewClient(true)}
                                className="w-full flex items-center gap-3 p-3 border-t border-gray-100 dark:border-gray-700 hover:bg-violet-50 dark:hover:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            >
                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-500/20 flex items-center justify-center">
                                    <User size={16} />
                                </div>
                                <span className="font-medium">+ Nuevo cliente</span>
                            </button>
                        </>
                    ) : (
                        <div className="p-4 space-y-3">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Nuevo cliente</p>
                            <input
                                type="text"
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                placeholder="Nombre"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                                autoFocus
                            />
                            <input
                                type="tel"
                                value={newClientPhone}
                                onChange={(e) => setNewClientPhone(e.target.value)}
                                placeholder="Teléfono (opcional)"
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsNewClient(false)}
                                    className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNewClientConfirm}
                                    disabled={!newClientName}
                                    className="flex-1 px-3 py-2 text-sm bg-violet-500 text-white rounded-lg disabled:opacity-50"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
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
            console.log('📋 QuickBookModal: Usando clientes del contexto:', dashboardClientes.length);
            return dashboardClientes.map((c: any) => ({
                id: c.id || 0,
                nombre: c.nombre || 'Sin nombre',
                telefono: c.telefono || '',
                ultima_visita: c.ultima_visita || ''
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
                console.log(`🎲 Staff "Sin preferencia" -> Asignado automáticamente: ${randomStaff.nombre} (ID: ${finalStaffId})`);
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
            console.log('🔄 Refrescando dashboard después de crear cita...');
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
                        className="w-full py-4 px-6 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
