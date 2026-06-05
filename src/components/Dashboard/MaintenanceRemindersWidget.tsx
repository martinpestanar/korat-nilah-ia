import React, { useState, useEffect, useCallback } from 'react';
import {
    Bell, Settings, Clock, CheckCircle2, AlertCircle,
    ChevronRight, Save, X, Edit2, Loader2, RefreshCw,
    Sparkles, Calendar, MessageCircle, Users, CalendarClock, Trash2, Search, HelpCircle
} from 'lucide-react';
import { engagement } from '../../services/api';
import { supabase } from '../../services/supabase';
import { useDashboardData } from '../../context/DashboardDataContext';

// ===========================================
// Plantillas Predefinidas
// ===========================================

interface RetoquePredefinido {
  nombre: string;
  keywords: string;
  dias_min: number;
  dias_max: number;
}

const RETOQUES_PREDEFINIDOS: Record<string, RetoquePredefinido[]> = {
  Manos: [
    { nombre: 'Retoque Acrílicas / Gel', keywords: 'acrilica, gel, kapping', dias_min: 15, dias_max: 21 },
    { nombre: 'Cambio Esmaltado Semipermanente', keywords: 'semipermanente, esmaltado', dias_min: 14, dias_max: 20 },
  ],
  Pies: [
    { nombre: 'Pedicure Spa / Profundo', keywords: 'pedicure, pedi, pies', dias_min: 21, dias_max: 30 },
    { nombre: 'Cambio de Esmalte Pies', keywords: 'esmalte pies, semi pies', dias_min: 20, dias_max: 30 },
  ],
  Facial: [
    { nombre: 'Limpieza Facial Profunda', keywords: 'limpieza, facial, peeling', dias_min: 30, dias_max: 45 },
    { nombre: 'Tratamiento Acné / Hidratación', keywords: 'hidratacion, acne, dermapen', dias_min: 15, dias_max: 25 },
  ],
  Pestañas: [
    { nombre: 'Retoque Extensiones Pestañas', keywords: 'extensiones, volumen, clasicas', dias_min: 15, dias_max: 21 },
    { nombre: 'Lifting de Pestañas', keywords: 'lifting, ondulacion', dias_min: 30, dias_max: 45 },
  ],
  Cabello: [
    { nombre: 'Retoque de Raíz / Tinte', keywords: 'tinte, raiz, color', dias_min: 30, dias_max: 45 },
    { nombre: 'Mantenimiento Balayage', keywords: 'balayage, mechas', dias_min: 60, dias_max: 90 },
    { nombre: 'Alisado / Keratina / Botox', keywords: 'keratina, botox, alisado', dias_min: 60, dias_max: 120 },
  ],
  Cejas: [
    { nombre: 'Retoque Diseño de Cejas', keywords: 'cejas, diseño, henna', dias_min: 15, dias_max: 21 },
    { nombre: 'Laminado de Cejas', keywords: 'laminado, planchado', dias_min: 30, dias_max: 45 },
  ],
  Depilación: [
    { nombre: 'Depilación Cera / Hilo', keywords: 'cera, hilo, bozo, axilas', dias_min: 21, dias_max: 30 },
    { nombre: 'Sesión Depilación Láser', keywords: 'laser, ipl', dias_min: 30, dias_max: 45 },
  ]
};

const CATEGORIAS_RETOQUE = Object.keys(RETOQUES_PREDEFINIDOS);
const EMOJIS_CATEGORIA: Record<string, string> = {
  Manos: '💅', Pies: '🦶', Facial: '💆‍♀️', Pestañas: '👁️', Cabello: '💇‍♀️', Cejas: '🤨', Depilación: '🪒'
};

// ===========================================
// Types
// ===========================================

interface ServiceConfig {
    id: string;
    servicio: string;
    keywords: string;
    dias_min: number;
    dias_max: number;
    mensaje: string;
    emoji: string;
    activo: boolean;
}

interface PendingReminder {
    citaId?: number;        // ID de la cita específica
    clienteId: number;
    nombre: string;
    telefono: string;
    servicio: string;
    tipoServicio: string;
    emoji?: string;
    diasPasados: number;
    diasOptimosRestantes: number;
    fechaUltimaCita: string;
}

// Nuevo: Citas próximas para recordatorio de confirmación
interface UpcomingAppointment {
    citaId: number;
    clienteId: number;
    nombre: string;
    telefono: string;
    servicio: string;
    fechaCita: string;
    horaFormateada: string;
    fechaFormateada: string;
    horasRestantes: number;
    estado: string;
    recordatorio24h: boolean;
    recordatorio3h: boolean;
}

interface ReminderHistory {
    id: number;
    clienteName: string;
    servicio: string;
    fechaEnvio: string;
    resultado: 'enviado' | 'cooldown' | 'error';
}

interface Summary {
    totalPendientes: number;
    enviadosHoy: number;
    enCooldown: number;
    porServicio: Record<string, number>;
    citasProximas?: number;
}

// ===========================================
// Main Component
// ===========================================

const MaintenanceRemindersWidget: React.FC = () => {
    // ✅ USAR CONTEXTO: Datos ya normalizados desde el Context
    const {
        engagementConfig,
        pendientesRetoque: contextPending,
        citasProximas: contextUpcoming,
        engagement,
        isLoading: contextLoading,
        refresh
    } = useDashboardData();

    const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'upcoming' | 'config' | 'diagnostic'>('overview');

    // Local state for UI interaction (optimistic updates)
    const [config, setConfig] = useState<ServiceConfig[]>([]);
    const [pending, setPending] = useState<PendingReminder[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [editingService, setEditingService] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ServiceConfig>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [sendingReminder, setSendingReminder] = useState<number | null>(null);
    const [sendingAppointmentReminder, setSendingAppointmentReminder] = useState<number | null>(null);
    const [summary, setSummary] = useState<Summary>({
        totalPendientes: 0,
        enviadosHoy: 0,
        enCooldown: 0,
        porServicio: {},
        citasProximas: 0
    });

    // Diagnostic state
    const [diagnosticList, setDiagnosticList] = useState<any[]>([]);
    const [isDiagnosticLoading, setIsDiagnosticLoading] = useState(false);
    const [searchDiagnostic, setSearchDiagnostic] = useState('');
    const [diagnosticPage, setDiagnosticPage] = useState(0);
    const DIAGNOSTIC_PAGE_SIZE = 5;

    // Pagination for pending reminders
    const PENDING_PAGE_SIZE = 4;
    const [pendingPage, setPendingPage] = useState(0);

    // Pagination for upcoming appointments
    const UPCOMING_PAGE_SIZE = 4;
    const [upcomingPage, setUpcomingPage] = useState(0);

    // New service modal state
    const [showNewServiceModal, setShowNewServiceModal] = useState(false);
    const [newServiceForm, setNewServiceForm] = useState({
        servicio: '',
        keywords: '',
        dias_min: 15,
        dias_max: 30,
        mensaje: '',
        emoji: '✨',
        activo: true
    });
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    // ===========================================
    // Sync with Context Data
    // ===========================================

    useEffect(() => {
        if (contextLoading) {
            setIsLoading(true);
            return;
        }

        // 1. Sync Config
        if (engagementConfig) {
            // Map Context Config (EngagementConfig) to Widget Config (ServiceConfig)
            // They are almost identical now, but let's ensure types match
            const mappedConfig: ServiceConfig[] = engagementConfig.map(c => ({
                id: c.id,
                servicio: c.servicio,
                keywords: c.keywords,
                dias_min: c.dias_min,
                dias_max: c.dias_max,
                mensaje: c.mensaje,
                emoji: c.emoji,
                activo: c.activo
            }));
            setConfig(mappedConfig);
        }

        // 2. Sync Pending Reminders
        if (contextPending) {
            // Map Context Pending (PendingRetoque) to Widget Pending (PendingReminder)
            const mappedPending: PendingReminder[] = contextPending.map(p => ({
                citaId: p.citaId,
                clienteId: p.clienteId,
                nombre: p.nombre,
                telefono: p.telefono,
                servicio: p.servicio,
                tipoServicio: p.tipoServicio,
                diasPasados: p.diasPasados,
                diasOptimosRestantes: p.diasOptimosRestantes,
                fechaUltimaCita: '', // Not strictly needed for UI card now, or can be added to context if vital
                mensajePersonalizado: p.mensaje
            }));
            setPending(mappedPending);

            // Update Summary by Service
            const porServicioCalc: Record<string, number> = {};

            // Sumar Retoques — agrupar por tipoServicio (nombre de la regla)
            // tipoServicio ya viene del context con el nombre exacto de la regla (ej: "Retoque Acrílicas / Gel")
            mappedPending.forEach(p => {
                // Usar tipoServicio directamente como clave de agrupación
                const displayKey = p.tipoServicio || 'Otros';
                porServicioCalc[displayKey] = (porServicioCalc[displayKey] || 0) + 1;
            });

            // Update Summary State
            setSummary(prev => ({
                ...prev,
                porServicio: porServicioCalc,
                totalPendientes: mappedPending.length
            }));
        }

        // 3. Sync Upcoming Appointments
        if (contextUpcoming) {
            const mappedUpcoming: UpcomingAppointment[] = contextUpcoming.map(u => ({
                citaId: u.citaId,
                clienteId: 0, // Not in context type, maybe not needed for widget actions
                nombre: u.nombre,
                telefono: u.telefono,
                servicio: u.servicio,
                fechaCita: u.fecha,
                horaFormateada: u.horaFormateada,
                fechaFormateada: u.fechaFormateada,
                horasRestantes: u.horasRestantes,
                estado: 'Pendiente', // Assumed
                recordatorio24h: u.recordatorio24h,
                recordatorio3h: u.recordatorio3h
            }));

            setUpcomingAppointments(mappedUpcoming);

            setSummary(prev => ({
                ...prev,
                citasProximas: mappedUpcoming.length
            }));
        }

        setIsLoading(false);
    }, [engagementConfig, contextPending, contextUpcoming, contextLoading]);

    // Fetch diagnostic list when diagnostic tab is selected
    useEffect(() => {
        if (activeTab === 'diagnostic') {
            const fetchDiagnostic = async () => {
                setIsDiagnosticLoading(true);
                try {
                    const businessId = localStorage.getItem('korat_business_id');
                    if (!businessId) return;

                    const { data, error } = await supabase
                        .rpc('get_retoques_diagnostico', { p_business_id: businessId });

                    if (error) throw error;

                    if (data) {
                        setDiagnosticList(data.map((item: any) => ({
                            clienteId: item.cliente_id,
                            clienteNombre: item.cliente_nombre,
                            telefono: item.telefono,
                            servicioRealizado: item.servicio_realizado,
                            diasPasados: item.dias_pasados,
                            reglaServicio: item.regla_servicio,
                            motivoExclusion: item.motivo_exclusion
                        })));
                    }
                } catch (error) {
                    console.error('Error fetching diagnostic:', error);
                } finally {
                    setIsDiagnosticLoading(false);
                }
            };
            fetchDiagnostic();
        }
    }, [activeTab]);

    // Función para refrescar datos (usa el contexto)
    const loadData = useCallback(() => {
        refresh(true);  // Force refresh desde el contexto
    }, [refresh]);

    // ===========================================
    // Handle edit service config
    // ===========================================

    const handleEdit = (service: ServiceConfig) => {
        setEditingService(service.id);
        setEditForm(service);
    };

    const handleSave = async () => {
        if (!editingService) return;

        const updatedConfig = config.map(s =>
            s.id === editingService ? { ...s, ...editForm, dias_min: Number(editForm.dias_min), dias_max: Number(editForm.dias_max) } as ServiceConfig : s
        );

        setIsSaving(true);
        try {
            const businessId = localStorage.getItem('korat_business_id');
            if (!businessId) throw new Error('No business_id');

            const jsonValue = JSON.stringify(updatedConfig.map(s => ({
                nombre: s.servicio,
                servicio: s.servicio,
                keywords: s.keywords,
                dias_min: s.dias_min,
                dias_max: s.dias_max,
                mensaje: s.mensaje,
                emoji: s.emoji,
                activo: s.activo
            })));

            const { error } = await supabase
                .rpc('upsert_negocio_info', {
                    p_business_id: businessId,
                    p_clave: 'recordatorios_retoque',
                    p_valor_texto: jsonValue
                });

            if (error) throw error;

            // Update local state
            setConfig(updatedConfig);
            setEditingService(null);
            setEditForm({});
        } catch (error) {
            console.error('Error saving config:', error);
            alert('Error al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteService = async (serviceId: string) => {
        try {
            const businessId = localStorage.getItem('korat_business_id');
            if (!businessId) throw new Error('No se encontró el ID del negocio');

            const updatedConfig = config.filter(s => s.id !== serviceId);
            
            const jsonValue = JSON.stringify(updatedConfig.map(s => ({
                nombre: s.servicio,
                servicio: s.servicio,
                keywords: s.keywords,
                dias_min: s.dias_min,
                dias_max: s.dias_max,
                mensaje: s.mensaje,
                emoji: s.emoji,
                activo: s.activo
            })));

            const { error } = await supabase
                .rpc('upsert_negocio_info', {
                    p_business_id: businessId,
                    p_clave: 'recordatorios_retoque',
                    p_valor_texto: jsonValue
                });

            if (error) throw error;

            setConfig(updatedConfig);
            await refresh(true);
            
        } catch (error: any) {
            console.error('❌ Error deleting service:', error);
        }
    };

    const handleToggleActive = async (serviceId: string) => {
        const service = config.find(s => s.id === serviceId);
        if (!service) return;

        const updatedConfig = config.map(s =>
            s.id === serviceId ? { ...s, activo: !s.activo } : s
        );

        // Optimistic update
        setConfig(updatedConfig);

        try {
            const businessId = localStorage.getItem('korat_business_id');
            if (!businessId) throw new Error('No business_id');

            // Serialize the updated config and save to negocio_info
            const jsonValue = JSON.stringify(updatedConfig.map(s => ({
                nombre: s.servicio,
                servicio: s.servicio,
                keywords: s.keywords,
                dias_min: s.dias_min,
                dias_max: s.dias_max,
                mensaje: s.mensaje,
                emoji: s.emoji,
                activo: s.activo
            })));

            const { error } = await supabase
                .rpc('upsert_negocio_info', {
                    p_business_id: businessId,
                    p_clave: 'recordatorios_retoque',
                    p_valor_texto: jsonValue
                });

            if (error) throw error;
        } catch (error) {
            // Revert on error
            setConfig(config);
            console.error('Error toggling service:', error);
        }
    };

    // ===========================================
    // Handle create new service
    // ===========================================

    const handleCreateService = async () => {
        if (!newServiceForm.servicio.trim()) {
            setCreateError('El nombre del servicio es requerido');
            return;
        }

        setIsCreating(true);
        setCreateError(null);

        try {
            const businessId = localStorage.getItem('korat_business_id');
            if (!businessId) throw new Error('No business_id');

            const newService: ServiceConfig = {
                id: `new-${Date.now()}`,
                servicio: newServiceForm.servicio.trim(),
                keywords: newServiceForm.keywords || newServiceForm.servicio.toLowerCase(),
                dias_min: newServiceForm.dias_min,
                dias_max: newServiceForm.dias_max,
                mensaje: newServiceForm.mensaje || `¡Hola {nombre}! 👋 Ya es momento de tu ${newServiceForm.servicio.trim()}. ¿Te agendamos?`,
                emoji: newServiceForm.emoji || '✨',
                activo: newServiceForm.activo
            };

            const updatedConfig = [...config, newService];

            const jsonValue = JSON.stringify(updatedConfig.map(s => ({
                nombre: s.servicio,
                servicio: s.servicio,
                keywords: s.keywords,
                dias_min: s.dias_min,
                dias_max: s.dias_max,
                mensaje: s.mensaje,
                emoji: s.emoji,
                activo: s.activo
            })));

            const { error } = await supabase
                .rpc('upsert_negocio_info', {
                    p_business_id: businessId,
                    p_clave: 'recordatorios_retoque',
                    p_valor_texto: jsonValue
                });

            if (error) throw error;

            setConfig(updatedConfig);

            // Reset form and close modal
            setNewServiceForm({
                servicio: '',
                keywords: '',
                dias_min: 15,
                dias_max: 30,
                mensaje: '',
                emoji: '✨',
                activo: true
            });
            setShowNewServiceModal(false);
        } catch (error: any) {
            console.error('Error creating service:', error);
            setCreateError(error.message || 'Error al crear el servicio');
        } finally {
            setIsCreating(false);
        }
    };

    // ===========================================
    // Handle send reminder manually
    // ===========================================

    const handleSendReminder = async (reminder: PendingReminder) => {
        setSendingReminder(reminder.clienteId);
        try {
            // Normalizar la respuesta si es array
            const rawResponse = await engagement.sendReminder(
                reminder.clienteId,
                reminder.tipoServicio,
                reminder.diasPasados || 0,
                reminder.citaId || null  // ← Nuevo: pasar ID de la cita
            );
            const response = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;

            if (response?.success) {
                // Remove from pending list - filtrar por citaId si existe, sino por clienteId
                setPending(prev => prev.filter(p => {
                    if (reminder.citaId) {
                        return p.citaId !== reminder.citaId;
                    }
                    return p.clienteId !== reminder.clienteId || p.tipoServicio !== reminder.tipoServicio;
                }));
                setSummary(prev => ({
                    ...prev,
                    totalPendientes: prev.totalPendientes - 1,
                    enviadosHoy: prev.enviadosHoy + 1
                }));
            } else {
                console.error('Error sending reminder:', response?.error);
                alert(response?.error || 'Error al enviar el recordatorio');
            }
        } catch (error) {
            console.error('Error sending reminder:', error);
            alert('Error de conexión al enviar el recordatorio');
        } finally {
            setSendingReminder(null);
        }
    };

    // ===========================================
    // Handle send appointment reminder (24h/3h)
    // ===========================================

    const handleSendAppointmentReminder = async (appointment: UpcomingAppointment) => {
        setSendingAppointmentReminder(appointment.citaId);
        try {
            const tipo = appointment.horasRestantes > 6 ? 'recordatorio_24h' : 'recordatorio_3h';
            const rawResponse = await engagement.sendAppointmentReminder(
                appointment.citaId,
                tipo
            );
            const response = Array.isArray(rawResponse) ? rawResponse[0] : rawResponse;

            if (response?.success) {
                // Update the appointment in the list
                setUpcomingAppointments(prev => prev.map(a => {
                    if (a.citaId === appointment.citaId) {
                        return {
                            ...a,
                            recordatorio24h: tipo === 'recordatorio_24h' ? true : a.recordatorio24h,
                            recordatorio3h: tipo === 'recordatorio_3h' ? true : a.recordatorio3h
                        };
                    }
                    return a;
                }));
                setSummary(prev => ({
                    ...prev,
                    enviadosHoy: prev.enviadosHoy + 1
                }));
            } else {
                console.error('Error sending appointment reminder:', response?.error);
                alert(response?.error || 'Error al enviar el recordatorio');
            }
        } catch (error) {
            console.error('Error sending appointment reminder:', error);
            alert('Error de conexión al enviar el recordatorio');
        } finally {
            setSendingAppointmentReminder(null);
        }
    };

    // ===========================================
    // Render: Overview Tab
    // ===========================================

    const renderOverview = () => (
        <div className="space-y-3 sm:space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-xl bg-primary p-2.5 sm:p-4 text-white shadow-lg shadow-primary/20">
                    <div className="flex items-center justify-between">
                        <Bell className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                        <span className="text-lg sm:text-2xl font-bold">{summary.totalPendientes}</span>
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs opacity-80">Pendientes</p>
                </div>

                <div className="rounded-xl bg-green-500 p-2.5 sm:p-4 text-white shadow-lg shadow-green-500/20">
                    <div className="flex items-center justify-between">
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                        <span className="text-lg sm:text-2xl font-bold">{summary.enviadosHoy}</span>
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs opacity-80">Enviados</p>
                </div>

                <div className="rounded-xl bg-amber-500 p-2.5 sm:p-4 text-white shadow-lg shadow-amber-500/20">
                    <div className="flex items-center justify-between">
                        <CalendarClock className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                        <span className="text-lg sm:text-2xl font-bold">{summary.citasProximas || 0}</span>
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs opacity-80">Citas Próximas</p>
                </div>

                <div className="rounded-xl bg-blue-500 p-2.5 sm:p-4 text-white shadow-lg shadow-blue-500/20">
                    <div className="flex items-center justify-between">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                        <span className="text-lg sm:text-2xl font-bold">{config.filter(c => c.activo).length}</span>
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs opacity-80">Activos</p>
                </div>
            </div>

            {/* By Service Breakdown */}
            <div className="rounded-xl border border-gray-100 bg-white p-4 dark:border-dark-border dark:bg-dark-card">
                <h4 className="mb-3 text-sm font-bold text-gray-700 dark:text-gray-300">
                    Por Tipo de Servicio
                </h4>
                <div className="space-y-2">
                    {Object.keys(summary.porServicio).length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-2">
                            Sin recordatorios pendientes por servicio
                        </p>
                    ) : (
                        Object.entries(summary.porServicio).map(([servicio, count]) => {
                            const serviceConfig = config.find(c =>
                                c.servicio.toLowerCase() === servicio.toLowerCase()
                            );
                            return (
                                <div key={servicio} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-dark-bg">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{serviceConfig?.emoji || '📋'}</span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{servicio}</span>
                                    </div>
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary dark:bg-primary/20">
                                        {count}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Next Automatic Run */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gradient-to-r from-gray-50 to-white p-4 dark:border-dark-border dark:from-dark-card dark:to-dark-bg">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Próxima ejecución</p>
                        <p className="text-xs text-gray-500">Mañana a las 11:00 AM</p>
                    </div>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Automático
                </span>
            </div>
        </div>
    );

    // ===========================================
    // Render: Pending Tab
    // ===========================================

    const renderPending = () => {
    const pendingPages = Math.ceil(pending.length / PENDING_PAGE_SIZE);
    const visiblePending = pending.slice(pendingPage * PENDING_PAGE_SIZE, (pendingPage + 1) * PENDING_PAGE_SIZE);

    return (
        <div className="space-y-3">
            {pending.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <CheckCircle2 className="mb-2 h-12 w-12 text-green-400" />
                    <p className="text-sm">¡No hay recordatorios pendientes!</p>
                </div>
            ) : (
                <>
                {visiblePending.map((reminder) => {
                    // Buscar configuración de la regla por tipoServicio (nombre de la regla)
                    const serviceConfig = config.find(c => c.servicio === reminder.tipoServicio)
                        // Fallback: buscar también por el servicio realizado del cliente
                        ?? config.find(c => reminder.servicio?.toLowerCase().includes((c.servicio || '').toLowerCase().split(' ')[0]));
                    const isUrgent = reminder.diasOptimosRestantes <= 2;
                    // Siempre mostramos la regla para mantener la consistencia visual en el diseño de las tarjetas
                    const showRuleLabel = !!reminder.tipoServicio;

                    return (
                        <div
                            // ✅ FIX: Usar citaId como key — evita que React reutilice un nodo
                            // anterior con datos incorrectos cuando cambia el clienteId
                            key={`cita-${reminder.citaId ?? reminder.clienteId}`}
                            className={`rounded-xl border p-4 transition-all hover:shadow-md ${isUrgent
                                ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
                                : 'border-gray-100 bg-white dark:border-dark-border dark:bg-dark-card'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${isUrgent ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-dark-bg'
                                        }`}>
                                        {serviceConfig?.emoji || '📋'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{reminder.nombre}</p>
                                        {/* ✅ Mostrar el servicio REAL del cliente (servicio_realizado del RPC) */}
                                        <p className="text-xs text-gray-500">{reminder.servicio}</p>
                                        {/* Badge de la regla que capturó al cliente, si es diferente al servicio */}
                                        {showRuleLabel && (
                                            <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary dark:bg-primary/20">
                                                Regla: {reminder.tipoServicio}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-lg font-bold ${isUrgent ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                        {reminder.diasPasados}d
                                    </span>
                                    <p className="text-[10px] text-gray-400">desde última cita</p>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {isUrgent && (
                                        <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                            <AlertCircle className="h-3 w-3" />
                                            ¡Urgente!
                                        </span>
                                    )}
                                    <span className="text-xs text-gray-500">
                                        Ventana óptima: {reminder.diasOptimosRestantes}d restantes
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {pendingPages > 1 && (
                    <div className="flex items-center justify-between pt-1">
                        <button
                            onClick={() => setPendingPage(p => Math.max(0, p - 1))}
                            disabled={pendingPage === 0}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition"
                        >
                            ← Anterior
                        </button>
                        <span className="text-xs text-gray-400">{pendingPage + 1} / {pendingPages}</span>
                        <button
                            onClick={() => setPendingPage(p => Math.min(pendingPages - 1, p + 1))}
                            disabled={pendingPage >= pendingPages - 1}
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition"
                        >
                            Siguiente →
                        </button>
                    </div>
                )}
                </>
            )}
        </div>
    );
    };

    // ===========================================
    // Render: Upcoming Appointments Tab
    // ===========================================

    const renderUpcoming = () => {
        const upcomingPages = Math.ceil(upcomingAppointments.length / UPCOMING_PAGE_SIZE);
        const visibleUpcoming = upcomingAppointments.slice(upcomingPage * UPCOMING_PAGE_SIZE, (upcomingPage + 1) * UPCOMING_PAGE_SIZE);

        return (
            <div className="space-y-3">
                {upcomingAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <CalendarClock className="mb-2 h-12 w-12 text-indigo-400" />
                        <p className="text-sm">No hay citas próximas (24-48h)</p>
                    </div>
                ) : (
                    <>
                    {visibleUpcoming.map((appointment) => {
                        const isUrgent = appointment.horasRestantes <= 4;
                        const hasReminder = appointment.horasRestantes > 6
                            ? appointment.recordatorio24h
                            : appointment.recordatorio3h;

                        return (
                            <div
                                key={appointment.citaId}
                                className={`rounded-xl border p-4 transition-all ${isUrgent
                                    ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-white dark:border-orange-800 dark:from-orange-900/20 dark:to-dark-card'
                                    : 'border-gray-100 bg-white dark:border-dark-border dark:bg-dark-card'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isUrgent
                                            ? 'bg-orange-100 dark:bg-orange-900/30'
                                            : 'bg-indigo-100 dark:bg-indigo-900/30'
                                            }`}>
                                            <CalendarClock className={`h-5 w-5 ${isUrgent ? 'text-orange-600' : 'text-indigo-600'
                                                }`} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {appointment.nombre}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {appointment.servicio} • {appointment.horaFormateada}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-lg font-bold ${isUrgent ? 'text-orange-600' : 'text-indigo-700 dark:text-indigo-300'
                                            }`}>
                                            {appointment.horasRestantes}h
                                        </span>
                                        <p className="text-[10px] text-gray-400">restantes</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {hasReminder ? (
                                            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Recordatorio enviado
                                            </span>
                                        ) : isUrgent ? (
                                            <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                <AlertCircle className="h-3 w-3" />
                                                ¡Próxima!
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-500">
                                                {appointment.fechaFormateada}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {upcomingPages > 1 && (
                        <div className="flex items-center justify-between pt-1">
                            <button
                                onClick={() => setUpcomingPage(p => Math.max(0, p - 1))}
                                disabled={upcomingPage === 0}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition"
                            >
                                ← Anterior
                            </button>
                            <span className="text-xs text-gray-400">{upcomingPage + 1} / {upcomingPages}</span>
                            <button
                                onClick={() => setUpcomingPage(p => Math.min(upcomingPages - 1, p + 1))}
                                disabled={upcomingPage >= upcomingPages - 1}
                                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition"
                            >
                                Siguiente →
                            </button>
                        </div>
                    )}
                    </>
                )}
            </div>
        );
    };

    // ===========================================
    // Render: Config Tab
    // ===========================================

    const renderConfig = () => (
        <div className="space-y-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
                Configura los servicios y cuándo enviar recordatorios automáticos.
            </p>



            {config.map((service) => (
                <div
                    key={service.id}
                    className={`rounded-xl border p-4 transition-all ${service.activo
                        ? 'border-gray-100 bg-white dark:border-dark-border dark:bg-dark-card'
                        : 'border-gray-100 bg-gray-50 opacity-60 dark:border-dark-border dark:bg-dark-bg'
                        }`}
                >
                    {editingService === service.id ? (
                        // Edit Mode
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    value={editForm.servicio || ''}
                                    onChange={(e) => setEditForm({ ...editForm, servicio: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-bold dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                    placeholder="Nombre del servicio"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] text-gray-500">Días mínimo</label>
                                    <input
                                        type="number"
                                        value={editForm.dias_min || 0}
                                        onChange={(e) => setEditForm({ ...editForm, dias_min: parseInt(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500">Días máximo</label>
                                    <input
                                        type="number"
                                        value={editForm.dias_max || 0}
                                        onChange={(e) => setEditForm({ ...editForm, dias_max: parseInt(e.target.value) })}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500">Keywords (separadas por coma)</label>
                                <input
                                    type="text"
                                    value={editForm.keywords || ''}
                                    onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                    placeholder="pestaña,lifting,lash"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-gray-500">Mensaje (usa {'{nombre}'} y {'{dias}'})</label>
                                <textarea
                                    value={editForm.mensaje || ''}
                                    onChange={(e) => setEditForm({ ...editForm, mensaje: e.target.value })}
                                    rows={3}
                                    className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => { setEditingService(null); setEditForm({}); }}
                                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-border dark:text-gray-400 dark:hover:bg-dark-bg"
                                >
                                    <X className="h-3 w-3" />
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-dim disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    ) : (
                        // View Mode
                        <>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{service.emoji}</span>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">{service.servicio}</p>
                                        <p className="text-xs text-gray-500">
                                            Recordar entre {service.dias_min}-{service.dias_max} días
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleActive(service.id)}
                                        className={`relative h-6 w-11 rounded-full transition-colors ${service.activo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${service.activo ? 'left-5' : 'left-0.5'
                                            }`} />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(service)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg"
                                    >
                                        <Edit2 className="h-4 w-4 text-gray-400" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteService(service.id)}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-1">
                                {service.keywords.split(',').map((keyword, i) => (
                                    <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-dark-bg dark:text-gray-400">
                                        {keyword.trim()}
                                    </span>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            ))}

            {/* Add New Service Button */}
            <button
                onClick={() => setShowNewServiceModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-4 text-sm font-medium text-gray-400 transition-colors hover:border-primary hover:text-primary dark:border-dark-border dark:hover:border-primary"
            >
                <Sparkles className="h-4 w-4" />
                Agregar nuevo servicio
            </button>
        </div>
    );

    const renderDiagnostic = () => {
        const filteredDiagnostic = diagnosticList.filter(item => 
            (item.clienteNombre || '').toLowerCase().includes(searchDiagnostic.toLowerCase()) ||
            (item.servicioRealizado || '').toLowerCase().includes(searchDiagnostic.toLowerCase()) ||
            (item.reglaServicio || '').toLowerCase().includes(searchDiagnostic.toLowerCase()) ||
            (item.motivoExclusion || '').toLowerCase().includes(searchDiagnostic.toLowerCase())
        );

        const diagnosticPages = Math.ceil(filteredDiagnostic.length / DIAGNOSTIC_PAGE_SIZE);
        const visibleDiagnostic = filteredDiagnostic.slice(diagnosticPage * DIAGNOSTIC_PAGE_SIZE, (diagnosticPage + 1) * DIAGNOSTIC_PAGE_SIZE);

        return (
            <div className="space-y-3">
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Verifica por qué una clienta que visitó en los últimos 60 días no ha recibido recordatorios.
                </p>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar clienta o motivo..."
                        value={searchDiagnostic}
                        onChange={(e) => {
                            setSearchDiagnostic(e.target.value);
                            setDiagnosticPage(0);
                        }}
                        className="w-full rounded-xl border border-gray-200 pl-9 pr-4 py-1.5 text-xs dark:border-dark-border dark:bg-dark-bg dark:text-white"
                    />
                </div>

                {isDiagnosticLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                        <p className="text-xs">Consultando base de datos...</p>
                    </div>
                ) : filteredDiagnostic.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-center">
                        <HelpCircle className="h-10 w-10 text-gray-300 mb-2" />
                        <p className="text-xs font-semibold">Sin registros de exclusión</p>
                        <p className="text-[10px] text-gray-400 max-w-[250px] mt-1">
                            Solo se listan clientes no elegibles de los últimos 60 días.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            {visibleDiagnostic.map((item, idx) => {
                                const isCooldown = item.motivoExclusion.includes('cooldown') || item.motivoExclusion.includes('espera');
                                const isNewer = item.motivoExclusion.includes('regresó') || item.motivoExclusion.includes('más reciente');
                                const isFuture = item.motivoExclusion.includes('futura');
                                const isInactive = item.motivoExclusion.includes('inactivo') || item.motivoExclusion.includes('marketing') || item.motivoExclusion.includes('teléfono');
                                
                                let badgeColor = 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
                                if (isCooldown) badgeColor = 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
                                if (isNewer) badgeColor = 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
                                if (isFuture) badgeColor = 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
                                if (isInactive) badgeColor = 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800';

                                return (
                                    <div 
                                        key={`${item.clienteId}-${item.reglaServicio}-${idx}`}
                                        className="rounded-xl border border-gray-100 bg-white p-3 dark:border-dark-border dark:bg-dark-card shadow-sm"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-xs font-bold text-gray-900 dark:text-white">{item.clienteNombre}</p>
                                                <p className="text-[10px] text-gray-500 mt-0.5">
                                                    Último servicio: <span className="font-medium text-gray-700 dark:text-gray-300">{item.servicioRealizado}</span> ({item.diasPasados}d atrás)
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary dark:bg-primary/20">
                                                        Regla: {item.reglaServicio}
                                                    </span>
                                                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${badgeColor}`}>
                                                        {item.motivoExclusion}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {diagnosticPages > 1 && (
                            <div className="flex items-center justify-between pt-1">
                                <button
                                    onClick={() => setDiagnosticPage(p => Math.max(0, p - 1))}
                                    disabled={diagnosticPage === 0}
                                    className="rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition"
                                >
                                    ← Anterior
                                </button>
                                <span className="text-[10px] text-gray-400">{diagnosticPage + 1} / {diagnosticPages}</span>
                                <button
                                    onClick={() => setDiagnosticPage(p => Math.min(diagnosticPages - 1, p + 1))}
                                    disabled={diagnosticPage >= diagnosticPages - 1}
                                    className="rounded-lg px-2 py-1 text-[10px] font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-30 transition"
                                >
                                    Siguiente →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    // ===========================================
    // Main Render
    // ===========================================

    return (
        <>
            {/* New Service Modal */}
            {showNewServiceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-dark-card shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-primary p-4 text-white shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5" />
                                    <h3 className="font-bold">Nuevo Servicio</h3>
                                </div>
                                <button
                                    onClick={() => setShowNewServiceModal(false)}
                                    className="p-1 rounded-lg hover:bg-white/20"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 space-y-4 overflow-y-auto flex-1">
                            {createError && (
                                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                    <AlertCircle className="inline h-4 w-4 mr-1" />
                                    {createError}
                                </div>
                            )}

                            {/* Plantilla Predefinida */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Usar Plantilla Predefinida (Opcional)
                                </label>
                                <select 
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white bg-white"
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        const [cat, idx] = e.target.value.split('-');
                                        const plantilla = RETOQUES_PREDEFINIDOS[cat]?.[parseInt(idx)];
                                        if (plantilla) {
                                            setNewServiceForm(prev => ({
                                                ...prev,
                                                servicio: plantilla.nombre,
                                                keywords: plantilla.keywords,
                                                dias_min: plantilla.dias_min,
                                                dias_max: plantilla.dias_max,
                                                emoji: EMOJIS_CATEGORIA[cat] || '✨'
                                            }));
                                        }
                                    }}
                                    defaultValue=""
                                >
                                    <option value="">-- Seleccionar Plantilla --</option>
                                    {CATEGORIAS_RETOQUE.map(cat => (
                                        <optgroup key={cat} label={`${EMOJIS_CATEGORIA[cat]} ${cat}`}>
                                            {RETOQUES_PREDEFINIDOS[cat].map((p, i) => (
                                                <option key={p.nombre} value={`${cat}-${i}`}>
                                                    {p.nombre} ({p.dias_min}-{p.dias_max} días)
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            {/* Service Name */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Nombre del Servicio *
                                </label>
                                <input
                                    type="text"
                                    value={newServiceForm.servicio}
                                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, servicio: e.target.value }))}
                                    placeholder="Ej: Manicura Gel, Pestañas, Corte..."
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                />
                            </div>

                            {/* Keywords */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Keywords (separadas por coma)
                                </label>
                                <input
                                    type="text"
                                    value={newServiceForm.keywords}
                                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, keywords: e.target.value }))}
                                    placeholder="Ej: manicura,gel,uñas"
                                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                />
                            </div>

                            {/* Days Range */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Días Mínimo
                                    </label>
                                    <input
                                        type="number"
                                        value={newServiceForm.dias_min}
                                        onChange={(e) => setNewServiceForm(prev => ({ ...prev, dias_min: parseInt(e.target.value) || 0 }))}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                        Días Máximo
                                    </label>
                                    <input
                                        type="number"
                                        value={newServiceForm.dias_max}
                                        onChange={(e) => setNewServiceForm(prev => ({ ...prev, dias_max: parseInt(e.target.value) || 0 }))}
                                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Emoji */}
                            <div>
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Emoji
                                </label>
                                <input
                                    type="text"
                                    value={newServiceForm.emoji}
                                    onChange={(e) => setNewServiceForm(prev => ({ ...prev, emoji: e.target.value }))}
                                    placeholder="✨"
                                    className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm text-center dark:border-dark-border dark:bg-dark-bg dark:text-white"
                                />
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Activar inmediatamente</span>
                                <button
                                    onClick={() => setNewServiceForm(prev => ({ ...prev, activo: !prev.activo }))}
                                    className={`relative h-6 w-11 rounded-full transition-colors ${newServiceForm.activo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${newServiceForm.activo ? 'left-5' : 'left-0.5'}`} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-100 dark:border-dark-border p-4 flex gap-3">
                            <button
                                onClick={() => setShowNewServiceModal(false)}
                                className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-dark-border dark:text-gray-400 dark:hover:bg-dark-bg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateService}
                                disabled={isCreating || !newServiceForm.servicio.trim()}
                                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-bold text-white hover:bg-primary-dim disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Crear Servicio
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 md:p-5 shadow-sm dark:border-dark-border dark:bg-dark-card">
                {/* Header */}
                <div className="mb-3 sm:mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary">
                            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                                Recordatorios
                            </h3>
                            <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
                                Sistema automático
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-dark-bg">
                    {[
                        { id: 'overview', label: 'Resumen', icon: Sparkles },
                        { id: 'pending', label: 'Retoques', icon: Bell },
                        { id: 'upcoming', label: 'Citas', icon: CalendarClock },
                        { id: 'diagnostic', label: 'Diagnóstico', icon: HelpCircle },
                        { id: 'config', label: 'Config', icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-[10px] sm:text-xs font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm dark:bg-dark-card dark:text-white'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <tab.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 mt-2">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'pending' && renderPending()}
                    {activeTab === 'upcoming' && renderUpcoming()}
                    {activeTab === 'diagnostic' && renderDiagnostic()}
                    {activeTab === 'config' && renderConfig()}
                </div>
            </div>
        </>
    );
};

export default MaintenanceRemindersWidget;

