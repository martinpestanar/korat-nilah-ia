
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Filter, X, Calendar as CalendarIcon, DollarSign, CheckCircle, Ban, AlertCircle, Shield, ShieldAlert, ShieldCheck, ChevronRight, Eye, Clock, History, ListFilter, ThumbsUp, Bot, Loader2, RefreshCw, Phone, MessageCircle, CalendarClock, FileText, Zap, Pencil, Save, Grid3X3, List } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { STATUS_COLORS, STATUS_LABELS, SIMULATION_DATE } from '../constants';
import { Appointment, StaffEspecialidad } from '../types';
import { calculateReliabilityScore } from '../utils/metrics';
import { dashboard, crm, appointments as appointmentsApi, negocioInfo, diasCerrados, equipo } from '../services/api';
import { getTimeInLima, formatDateTimeLima } from '../utils/timezone';
import { DayCarousel } from '../components/Booking';
import { StaffFilterTabs, MonthlyCalendarView, DailyMetricsBar } from '../components/Calendar';
import StaffColumnsView from '../components/Calendar/StaffColumnsView';

type ViewMode = 'upcoming' | 'history';
type CalendarViewType = 'list' | 'monthly' | 'columns';

const CalendarPage: React.FC = () => {
  const { appointments: mockAppointments, clients: mockClients, services: mockServices, addAppointment } = useData();

  // Dashboard data via context (destructured below)

  // State for API data
  const [loadedAppointments, setLoadedAppointments] = useState<Appointment[]>([]);
  const [loadedServices, setLoadedServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [isNewApptModalOpen, setIsNewApptModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Calendar View State (list vs monthly)
  const [calendarViewType, setCalendarViewType] = useState<CalendarViewType>(() => {
    return (localStorage.getItem('korat_calendar_view') as CalendarViewType) || 'list';
  });

  // Staff Filter State
  const [staffFilter, setStaffFilter] = useState<StaffEspecialidad | 'todos'>('todos');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterService, setFilterService] = useState<string>('Todos');

  // New Appointment Form State
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formService, setFormService] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [formNotes, setFormNotes] = useState(''); // Notas de cita
  const [formStaffId, setFormStaffId] = useState<string>(''); // Staff asignado
  const [formCategoria, setFormCategoria] = useState<string>(''); // Categoría de staff (mandatory)

  // Reschedule State
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [isReschedulingSubmitting, setIsReschedulingSubmitting] = useState(false);

  // Edit Appointment State
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editService, setEditService] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editPrice, setEditPrice] = useState<number | string>(0);

  // Quick Booking State
  const [quickBookDate, setQuickBookDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [quickBookTime, setQuickBookTime] = useState('');
  const [isQuickBookOpen, setIsQuickBookOpen] = useState(false);
  const [showQuickView, setShowQuickView] = useState(true);

  // Config para disponibilidad (hora de almuerzo y días cerrados)
  const [lunchHours, setLunchHours] = useState('12pm - 2pm');
  const [closedDays, setClosedDays] = useState<Array<{ fecha: string; es_dia_completo: boolean; hora_inicio?: string; hora_fin?: string }>>([]);
  const [businessHours, setBusinessHours] = useState({
    weekdays: { start: 9, end: 20 },
    saturday: { start: 9, end: 20 },
    sunday: { start: 9, end: 20 }
  });

  // Staff para vista de columnas
  const [staffList, setStaffList] = useState<Array<{ id: number; nombre: string; especialidad?: string; cat_staff?: string; color?: string; activo?: boolean }>>([]);

  // ✅ CLIENTES: Usar del contexto (ya filtrados por business_id) o mock como fallback
  // ✅ CLIENTES: Usar del contexto (ya filtrados por business_id) o mock como fallback
  // (Definición antigua eliminada - ahora viene del destructuring del contexto más abajo)

  const services = loadedServices.length > 0 ? loadedServices : [];

  // Ref para evitar múltiples inicializaciones
  const isInitialized = useRef(false);

  // ===========================================
  // Cache Configuration for Appointments
  // ===========================================
  const CITAS_CACHE_KEY = 'korat_citas_cache';
  const CITAS_CACHE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutos para mejor rendimiento


  const saveCitasToCache = (data: Appointment[]) => {
    try {
      localStorage.setItem(CITAS_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        citas: data
      }));
    } catch (e) {
      console.warn('Error saving citas to cache:', e);
    }
  };

  const loadCitasFromCache = (): Appointment[] | null => {
    try {
      const cached = localStorage.getItem(CITAS_CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);

      // Validar estructura del caché
      if (!parsed || !Array.isArray(parsed.citas)) {
        console.warn('Caché de citas corrupto, limpiando...');
        localStorage.removeItem(CITAS_CACHE_KEY);
        return null;
      }

      return parsed.citas;
    } catch (e) {
      console.warn('Error reading citas cache, clearing:', e);
      localStorage.removeItem(CITAS_CACHE_KEY);
      return null;
    }
  };

  const isCitasCacheFresh = (): boolean => {
    try {
      const cached = localStorage.getItem(CITAS_CACHE_KEY);
      if (!cached) return false;

      const parsed = JSON.parse(cached);
      if (!parsed || typeof parsed.timestamp !== 'number') return false;

      return Date.now() - parsed.timestamp < CITAS_CACHE_EXPIRY_MS;
    } catch {
      return false;
    }
  };

  // ===========================================
  // Load Appointments from n8n with Cache
  // ===========================================
  // ===========================================
  // Data from Context
  // ===========================================
  const {
    appointments: rawAppointments,
    clients,
    // rewards ignored to avoid collision with state

    refresh: refreshDashboard
  } = useDashboardData();

  // Normalize Appointments from Context
  const processedAppointments = useMemo(() => {
    if (!rawAppointments) return [];

    console.log('🔄 Calendar: Processing appointments from Context:', rawAppointments.length);

    return rawAppointments.map((c: any) => {
      const precioRaw = c.extendedProps?.precio || c.precio || 0;
      const precioNum = typeof precioRaw === 'string' ? parseFloat(precioRaw) : precioRaw;

      let servicioName = c.extendedProps?.servicio || c.servicio || '';
      if (!servicioName && c.title && typeof c.title === 'string' && c.title.includes('-')) {
        const parts = c.title.split('-');
        servicioName = parts.slice(0, -1).join('-').trim();
        servicioName = servicioName.charAt(0).toUpperCase() + servicioName.slice(1).toLowerCase();
      }
      if (!servicioName) servicioName = 'Servicio';

      let duracionRaw = c.extendedProps?.duracion_min || c.duracion_min || c.duration_min || c.duration;
      let duracion = typeof duracionRaw === 'number' ? duracionRaw : parseInt(duracionRaw || '0');

      if ((!duracion || duracion <= 0 || duracion === 60) && servicioName) {
        const svc = loadedServices.find((s: any) => s.name === servicioName);
        if (svc) {
          const svcDur = svc.durationMin || svc.duration || svc.duracion;
          if (svcDur && svcDur > 0) duracion = svcDur;
        }
        if (duracion <= 0) duracion = 60;
      }

      const clienteId = c.extendedProps?.cliente_id || c.cliente_id || c.client_id || 0;
      const clienteIdNum = typeof clienteId === 'string' ? parseInt(clienteId) : clienteId;

      const clienteEncontrado = clients.find(cl => cl.id === clienteIdNum || cl.id === clienteId);

      const isValidValue = (val: any): boolean => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string') {
          const trimmed = val.trim().toLowerCase();
          return trimmed !== '' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'cliente' && trimmed !== 'sin nombre';
        }
        return true;
      };

      let telefonoValue = '';
      if (isValidValue(c.extendedProps?.telefono)) telefonoValue = c.extendedProps.telefono;
      else if (isValidValue(c.telefono)) telefonoValue = c.telefono;
      else if (clienteEncontrado && isValidValue(clienteEncontrado.telefono)) telefonoValue = clienteEncontrado.telefono;

      let nombreCliente = '';
      if (isValidValue(c.extendedProps?.nombre_cliente)) nombreCliente = c.extendedProps.nombre_cliente;
      else if (isValidValue(c.nombre_cliente)) nombreCliente = c.nombre_cliente;
      else if (isValidValue(c.nombre)) nombreCliente = c.nombre; // Raw format
      else if (clienteEncontrado && isValidValue(clienteEncontrado.nombre)) nombreCliente = clienteEncontrado.nombre;

      if (!nombreCliente && c.title && c.title.includes('-')) {
        const parts = c.title.split('-');
        nombreCliente = parts[parts.length - 1].trim();
      }
      if (!nombreCliente) nombreCliente = 'Cliente';

      return {
        id: c.id || Date.now(),
        fecha: c.start || c.fecha || new Date().toISOString(),
        cliente_id: clienteIdNum,
        nombre_cliente: nombreCliente,
        servicio: servicioName,
        categoria: c.extendedProps?.categoria || c.categoria || '',
        precio: isNaN(precioNum) ? 0 : precioNum,
        duracion_min: duracion,
        estado: c.extendedProps?.estado || c.estado || 'Pendiente',
        staff_id: c.extendedProps?.staff_id || c.staff_id || null,
        calificacion: c.extendedProps?.calificacion || c.calificacion || 0,
        feedback_cliente: c.extendedProps?.feedback_cliente || c.feedback_cliente || '',
        isAiGenerated: c.extendedProps?.isAiGenerated || c.isAiGenerated || false,
        _extendedProps: c.extendedProps || {},
        _backgroundColor: c.backgroundColor || null,
        _telefono: telefonoValue,
        _nombreReal: nombreCliente
      };
    });
  }, [rawAppointments, clients, loadedServices]);

  useEffect(() => {
    setLoadedAppointments(processedAppointments);
  }, [processedAppointments]);

  const refresh = async () => {
    setIsLoading(true);
    await refreshDashboard(true);
    await loadServices();
    setIsLoading(false);
  };

  // ============================================
  // Load Services from n8n (clientes vienen del contexto)
  // ===========================================
  const loadServices = useCallback(async () => {
    try {
      // Solo cargar servicios - los clientes vienen del DashboardDataContext
      const servicesData = await crm.getServices();

      // Normalizar servicios
      let servicesArray: any[] = [];
      if (Array.isArray(servicesData)) {
        servicesArray = servicesData;
      } else if (servicesData && typeof servicesData === 'object') {
        const dataObj = servicesData as any;
        servicesArray = dataObj.services || dataObj.data || [dataObj];
      }

      // Mapear servicios al formato esperado
      const normalizedServices = servicesArray.map((s: any, index: number) => ({
        id: s.id || s.Id || (index + 1),
        name: s.name || s.nombre || s.Name || s.Nombre || 'Servicio',
        price: typeof s.price === 'string' ? parseFloat(s.price) : (s.price || s.precio || s.Price || 0),
        durationMin: s.durationMin || s.duration || s.duracion || 60
      }));

      console.log('✅ Servicios cargados desde API:', normalizedServices);
      setLoadedServices(normalizedServices);
      return normalizedServices;

    } catch (error) {
      console.warn('Error loading services from API, using mock data:', error);
      // Fallback silencioso a mock data
      return [];
    }
  }, []);

  // Cargar primero clientes/servicios, luego citas (solo una vez)
  useEffect(() => {
    // Evitar múltiples inicializaciones
    if (isInitialized.current) return;
    isInitialized.current = true;

    const initializeData = async () => {
      try {
        // 1. Mostrar datos del caché INMEDIATAMENTE para UX rápida
        const cachedCitas = loadCitasFromCache();
        if (cachedCitas && cachedCitas.length > 0) {
          console.log('⚡ Display instantáneo desde caché:', cachedCitas.length, 'citas');
          setLoadedAppointments(cachedCitas);
          setIsLoading(false);
        }

        // 2. Cargar servicios, config, días cerrados y equipo en paralelo
        // (clientes vienen del DashboardDataContext)
        // 2. Cargar servicios, config, días cerrados y equipo en paralelo
        // (clientes vienen del DashboardDataContext)

        // Primero obtener servicios para poder usarlos en el enrichment de citas
        const servicesRetrieved = await loadServices();

        const [configData, closedDaysData, staffData] = await Promise.all([
          negocioInfo.getAll().catch(() => []),
          diasCerrados.getAll().catch(() => []),
          equipo.getAll().catch(() => [])
        ]);

        // 3. Procesar config de horario (Lunch + Schedule)
        if (Array.isArray(configData)) {
          // Lunch
          const lunchConfig = configData.find((c: any) => c.clave === 'hora_almuerzo');
          if (lunchConfig && lunchConfig.valor_texto) {
            setLunchHours(lunchConfig.valor_texto);
          }

          // Hours
          const getHours = (scheduleKey: string, openKeyLegacy: string, closeKeyLegacy: string) => {
            // 1. Intentar formato nuevo combined ("9am - 8pm")
            const scheduleStr = configData.find((i: any) => i.clave === scheduleKey)?.valor_texto;

            if (scheduleStr && scheduleStr !== 'CERRADO') {
              try {
                const parts = scheduleStr.toLowerCase().split('-');
                if (parts.length === 2) {
                  const parseH = (s: string) => {
                    s = s.trim();
                    const isPm = s.includes('pm');
                    let h = parseInt(s.replace(/[^0-9]/g, ''));
                    if (isPm && h < 12) h += 12;
                    if (!isPm && h === 12) h = 0;
                    return h;
                  };
                  return { start: parseH(parts[0]), end: parseH(parts[1]) };
                }
              } catch (e) { console.error('Error parsing schedule string', e); }
            }

            // 2. Fallback Legacy
            const openStr = configData.find((i: any) => i.clave === openKeyLegacy)?.valor_texto;
            const closeStr = configData.find((i: any) => i.clave === closeKeyLegacy)?.valor_texto;

            if (!openStr || openStr === 'CERRADO' || !closeStr || closeStr === 'CERRADO') {
              return { start: 0, end: 0 };
            }

            return {
              start: parseInt(openStr.split(':')[0]),
              end: parseInt(closeStr.split(':')[0])
            };
          };

          setBusinessHours({
            weekdays: getHours('horario_semana', 'hora_apertura', 'hora_cierre'),
            saturday: getHours('horario_sabado', 'hora_apertura_sabado', 'hora_cierre_sabado'),
            sunday: getHours('horario_domingo', 'hora_apertura_domingo', 'hora_cierre_domingo')
          });
        }

        // 4. Procesar días cerrados
        if (Array.isArray(closedDaysData)) {
          setClosedDays(closedDaysData);
          console.log('📅 Días cerrados cargados:', closedDaysData.length);
        }

        // 5. Procesar equipo para vista de columnas
        if (Array.isArray(staffData)) {
          const activeStaff = staffData.filter((s: any) => s.activo !== false);
          setStaffList(activeStaff);
          console.log('👥 Staff cargado para vista columnas:', activeStaff.length, activeStaff);
        } else {
          console.warn('⚠️ staffData no es array:', staffData);
        }

        // 6. Cargar citas usando la función que ya normaliza todo
        // (los clientes ya vienen del contexto)
        // 6. Cargar citas usando la función que ya normaliza todo
        // (los clientes ya vienen del contexto)
        // Pasamos servicios recuperados para enriquecer duración
        // Citas loaded automatically via Context processedAppointments useMemo

      } catch (error) {
        console.error('Error en inicialización:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sin dependencias - solo ejecutar una vez al montar


  // Combinar citas cargadas con las del contexto
  const appointments = loadedAppointments;

  // --- FILTER & SORT LOGIC ---
  const filteredAppointments = useMemo(() => {
    // Definir el umbral de "Hoy" basado en la fecha actual
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    return appointments.filter(apt => {
      // Validar que la fecha exista
      if (!apt.fecha) return false;

      // Parsear la fecha manualmente para evitar problemas de zona horaria
      let aptYear: number, aptMonth: number, aptDay: number;
      const fecha = apt.fecha;

      if (fecha.includes('T')) {
        // Formato ISO: 2025-12-23T13:00:00
        const [datePart] = fecha.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        aptYear = y; aptMonth = m; aptDay = d;
      } else if (fecha.includes(' ')) {
        // Formato con espacio: 2025-12-23 13:00
        const [datePart] = fecha.split(' ');
        const [y, m, d] = datePart.split('-').map(Number);
        aptYear = y; aptMonth = m; aptDay = d;
      } else {
        // Fallback: intentar con Date parser
        const aptDate = new Date(fecha);
        if (isNaN(aptDate.getTime())) return false;
        aptYear = aptDate.getFullYear();
        aptMonth = aptDate.getMonth() + 1;
        aptDay = aptDate.getDate();
      }

      // Validar valores
      if (isNaN(aptYear) || isNaN(aptMonth) || isNaN(aptDay)) return false;

      // Crear fecha local sin hora (medianoche)
      const aptDateLocal = new Date(aptYear, aptMonth - 1, aptDay, 0, 0, 0);

      // Comparar fechas (ignorando horas)
      const isPast = aptDateLocal.getTime() < todayStart.getTime();

      // 1. Tab Filter (Strict Logic)
      if (viewMode === 'upcoming') {
        // Mostrar citas desde HOY en adelante (hoy >= aptDate) -> !isPast
        if (isPast) return false;

        // Excluir citas canceladas o no-show de "Próximas" (se muestran en Historial)
        const estado = (apt.estado || '').toLowerCase();
        if (estado === 'cancelada' || estado === 'no-show') return false;
      } else {
        // Historial: citas pasadas O canceladas/no-show (incluso futuras)
        const estado = (apt.estado || '').toLowerCase();
        const isCancelled = estado === 'cancelada' || estado === 'no-show';

        // Mostrar si es pasada O si está cancelada/no-show
        if (!isPast && !isCancelled) return false;
      }

      // 2. Search & Dropdown Filters
      // Usar nombre_cliente directamente (ya normalizado) para la búsqueda
      const clientName = ((apt as any)._nombreReal || apt.nombre_cliente || '').toLowerCase();
      const matchesSearch = clientName.includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || apt.estado === filterStatus;
      const matchesService = filterService === 'Todos' || apt.servicio === filterService;

      return matchesSearch && matchesStatus && matchesService;
    }).sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      // Próximas: Ascendente (Lo más cercano primero)
      // Historial: Descendente (Lo más reciente primero)
      return viewMode === 'upcoming' ? dateA - dateB : dateB - dateA;
    });
  }, [appointments, searchTerm, filterStatus, filterService, viewMode]);

  // DEBUG: Log para ver qué está pasando
  console.log('📅 DEBUG Agenda:', {
    totalAppointments: appointments.length,
    filteredCount: filteredAppointments.length,
    appointments: appointments.map(a => ({ id: a.id, fecha: a.fecha, nombre: a.nombre_cliente })),
    today: new Date().toISOString()
  });

  // --- GROUPING LOGIC (BY DATE) ---
  const groupedAppointments = useMemo(() => {
    const groups: Record<string, Appointment[]> = {};

    filteredAppointments.forEach(apt => {
      // Manejar tanto formato ISO (2025-12-17T14:00:00) como espacio (YYYY-MM-DD HH:MM)
      const fechaStr = apt.fecha || '';

      // Saltar si no hay fecha
      if (!fechaStr) return;

      let dateKey: string;
      if (fechaStr.includes('T')) {
        // Formato ISO
        dateKey = fechaStr.split('T')[0];
      } else if (fechaStr.includes(' ')) {
        // Formato con espacio
        dateKey = fechaStr.split(' ')[0];
      } else if (fechaStr.includes('-')) {
        // Solo fecha YYYY-MM-DD
        dateKey = fechaStr;
      } else {
        // Formato desconocido, intentar parsear
        const parsed = new Date(fechaStr);
        if (isNaN(parsed.getTime())) return; // Saltar si no es parseable
        dateKey = parsed.toISOString().split('T')[0];
      }

      // Validar que el dateKey tenga formato correcto YYYY-MM-DD
      if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return;

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(apt);
    });

    return groups;
  }, [filteredAppointments]);

  // --- HELPER: DATE HEADER LABEL ---
  const getDateHeaderLabel = (dateStr: string) => {
    // IMPORTANTE: Crear una copia para no mutar el original
    const today = new Date(SIMULATION_DATE.getTime());
    today.setHours(0, 0, 0, 0);

    // Validar el formato de fecha
    if (!dateStr || !dateStr.includes('-')) return 'Fecha inválida';

    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3 || parts.some(isNaN)) return 'Fecha inválida';

    const [y, m, d] = parts;
    const target = new Date(y, m - 1, d);

    // Verificar que la fecha sea válida
    if (isNaN(target.getTime())) return 'Fecha inválida';

    // Format strings for comparison
    const targetStr = target.toDateString();
    const todayStr = today.toDateString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toDateString();

    if (targetStr === todayStr) return "HOY";
    if (targetStr === tomorrowStr) return "MAÑANA";

    return target.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  // --- HELPER: FORMATEAR FECHA ISO PARA MOSTRAR AL CLIENTE ---
  const formatDateForDisplay = (isoDate: string): string => {
    try {
      if (!isoDate) return 'Fecha no disponible';

      // Parsear la fecha manualmente para evitar problemas de zona horaria
      // El formato esperado es: "2025-12-23T13:00:00" o "2025-12-23 13:00"
      let year: number, month: number, day: number, hours: number, minutes: number;

      if (isoDate.includes('T')) {
        // Formato ISO: 2025-12-23T13:00:00
        const [datePart, timePart] = isoDate.split('T');
        const [y, m, d] = datePart.split('-').map(Number);
        const [h, min] = (timePart || '00:00').split(':').map(Number);
        year = y; month = m; day = d; hours = h || 0; minutes = min || 0;
      } else if (isoDate.includes(' ')) {
        // Formato con espacio: 2025-12-23 13:00
        const [datePart, timePart] = isoDate.split(' ');
        const [y, m, d] = datePart.split('-').map(Number);
        const [h, min] = (timePart || '00:00').split(':').map(Number);
        year = y; month = m; day = d; hours = h || 0; minutes = min || 0;
      } else {
        // Fallback: intentar parsear normalmente
        const date = new Date(isoDate);
        if (isNaN(date.getTime())) return isoDate;
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
        hours = date.getHours();
        minutes = date.getMinutes();
      }

      // Validar valores
      if (isNaN(year) || isNaN(month) || isNaN(day)) return isoDate;

      // Crear fecha local (sin conversión de zona horaria)
      const localDate = new Date(year, month - 1, day, hours, minutes);
      if (isNaN(localDate.getTime())) return isoDate;

      // Formatear día de la semana
      const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

      const weekday = weekdays[localDate.getDay()];
      const monthName = months[localDate.getMonth()];

      // Formatear hora en 12h
      const h12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const minuteStr = minutes.toString().padStart(2, '0');

      return `${weekday}, ${day} de ${monthName} ${year} - ${h12}:${minuteStr} ${ampm}`;
    } catch {
      return isoDate;
    }
  };

  // --- HELPER: EXTRAER NOMBRE DEL CLIENTE DEL SUMMARY ---
  // El summary viene como "servicio-nombre" (ej: "pestañas-martin")
  const extractClientName = (summary: string | null | undefined): string => {
    if (!summary || summary === 'null' || summary === 'undefined') return '';

    // Si contiene guión, tomar la parte después del último guión
    if (summary.includes('-')) {
      const parts = summary.split('-');
      const name = parts[parts.length - 1].trim();
      if (!name) return '';
      // Capitalizar primera letra de cada palabra
      return name.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    // Si no tiene guión, capitalizar el nombre tal cual
    return summary.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // --- HELPER: OBTENER NOMBRE A MOSTRAR DEL CLIENTE ---
  // Busca en múltiples fuentes: _nombreReal, extracción del summary, cliente cargado
  const getDisplayName = (apt: Appointment): string => {
    const aptAny = apt as any;

    // Helper local para validar nombres
    const isValidName = (name: any): boolean => {
      if (!name || typeof name !== 'string') return false;
      const trimmed = name.trim().toLowerCase();
      return trimmed !== '' &&
        trimmed !== 'null' &&
        trimmed !== 'undefined' &&
        trimmed !== 'cliente' &&
        trimmed !== 'sin nombre';
    };

    // Función para capitalizar nombre
    const capitalize = (name: string): string => {
      return name.split(' ')
        .filter((word: string) => word && word.trim() !== '')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    };

    // 1. Primero intentar _nombreReal (que ya fue normalizado)
    if (isValidName(aptAny._nombreReal)) {
      return capitalize(aptAny._nombreReal);
    }

    // 2. Nombre del cliente si está guardado y es válido (pero no contiene guión - eso sería formato "servicio-nombre")
    if (isValidName(apt.nombre_cliente) && !apt.nombre_cliente.includes('-')) {
      return capitalize(apt.nombre_cliente);
    }

    // 3. Buscar en la lista de clientes cargados por cliente_id
    if (apt.cliente_id && apt.cliente_id !== 0) {
      const client = clients.find(c => c.id === apt.cliente_id || c.id === Number(apt.cliente_id));
      if (client && isValidName(client.nombre)) {
        return capitalize(client.nombre);
      }
    }

    // 4. Extraer del nombre_cliente si tiene formato "servicio-nombre"
    if (apt.nombre_cliente && apt.nombre_cliente.includes('-')) {
      const extracted = extractClientName(apt.nombre_cliente);
      if (isValidName(extracted)) {
        return extracted; // Ya viene capitalizado de extractClientName
      }
    }

    // 5. Intentar extraer de extendedProps
    if (isValidName(aptAny._extendedProps?.nombre_cliente)) {
      return capitalize(aptAny._extendedProps.nombre_cliente);
    }

    // 6. Fallback
    return 'Cliente';
  };

  // --- HELPER: CLIENT SHIELD ---
  // Buscar cliente por ID o por nombre (extraído del summary)
  const getClientContext = (apt: Appointment) => {
    // 1. Buscar por cliente_id
    let client = clients.find(c => c.id === apt.cliente_id);
    if (client) return client;

    // 2. Si no se encuentra, buscar por nombre (extraído del summary)
    const extractedName = extractClientName(apt.nombre_cliente || '').toLowerCase();
    if (extractedName) {
      client = clients.find(c =>
        c.nombre?.toLowerCase() === extractedName ||
        c.nombre?.toLowerCase().includes(extractedName)
      );
    }

    return client || null;
  };

  // --- HELPER: OBTENER TELÉFONO DEL CLIENTE ---
  const getClientPhone = (apt: Appointment): string => {
    const aptAny = apt as any;

    // 1. Teléfono guardado en la cita
    if (aptAny._telefono && aptAny._telefono !== '' && aptAny._telefono !== 'null' && aptAny._telefono !== 'undefined') {
      return aptAny._telefono;
    }

    // 2. Teléfono en extendedProps
    if (aptAny._extendedProps?.telefono && aptAny._extendedProps.telefono !== 'null') {
      return aptAny._extendedProps.telefono;
    }
    if (aptAny._extendedProps?.phone && aptAny._extendedProps.phone !== 'null') {
      return aptAny._extendedProps.phone;
    }

    // 3. Buscar en la lista de clientes cargados por cliente_id
    if (apt.cliente_id) {
      const clientById = clients.find(c => c.id === apt.cliente_id || c.id === Number(apt.cliente_id));
      if (clientById?.telefono && clientById.telefono !== 'null') {
        return clientById.telefono;
      }
      if ((clientById as any)?.phone && (clientById as any).phone !== 'null') {
        return (clientById as any).phone;
      }
    }

    // 4. Buscar por contexto (nombre)
    const client = getClientContext(apt);
    if (client?.telefono && client.telefono !== 'null') {
      return client.telefono;
    }
    if ((client as any)?.phone && (client as any).phone !== 'null') {
      return (client as any).phone;
    }

    return 'No disponible';
  };

  const getClientShield = (apt: Appointment) => {
    const client = getClientContext(apt);
    if (!client) return { score: 0, level: 'Medium' as const };
    const history = appointments.filter(a => a.cliente_id === client.id);
    return calculateReliabilityScore(history);
  };

  const renderShield = (level: 'High' | 'Medium' | 'Low', size = 16) => {
    // Escudo Rosa (Riesgo), Gris (Neutro), Índigo (Fiable)
    if (level === 'Low') {
      return (
        <div className="flex items-center gap-1.5 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" title="Riesgo: Historial de inasistencias">
          <ShieldAlert size={size} />
          <span className="hidden sm:inline">Riesgo</span>
        </div>
      );
    }
    if (level === 'Medium') {
      return (
        <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-800 dark:text-gray-400" title="Cliente Estándar">
          <Shield size={size} />
          <span className="hidden sm:inline">Neutro</span>
        </div>
      );
    }
    // High (Trust)
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400" title="Cliente Confiable">
        <ShieldCheck size={size} />
        <span className="hidden sm:inline">Confiable</span>
      </div>
    );
  };

  // --- HANDLER: NEW APPOINTMENT ---
  const handleNewApptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Limpiar mensajes previos
    setFormError(null);
    setFormSuccess(null);

    // Validar campos requeridos
    if (!formClient || !formService || !newDate || !newTime) {
      setFormError('Por favor completa todos los campos.');
      return;
    }

    // Buscar el cliente seleccionado para obtener su nombre
    const client = clients.find(c => c.id.toString() === formClient);

    if (!client) {
      setFormError('Cliente no válido.');
      return;
    }

    // Combinar fecha y hora y convertir a ISO (UTC)
    // Se usa el timezone del navegador automáticamente:
    // Si estoy en Chile (-3), "13:00" -> Date 13:00 GMT-3 -> .toISOString() 16:00 UTC
    // Y al mostrarse en Chile, se convierte back a 13:00.
    // Si un usuario en Lima (-5) ve esa misma cita (16:00 UTC), verá 11:00.

    // Combinar fecha y hora y convertir a ISO (UTC)
    // Se usa el timezone del navegador automáticamente:
    const localDate = new Date(`${newDate}T${newTime}:00`);
    const startTime = localDate.toISOString();

    // Buscar servicio para obtener precio y duración
    const selectedService = services.find(s => s.name === formService);

    // FIX: Usar durationMin (normalizado) en lugar de duration
    const duracionMin = selectedService?.durationMin || selectedService?.duration || 60;

    // FIX: Manejo de Staff ID (Evitar Null si la DB lo requiere)
    let finalStaffId: number | null = formStaffId ? parseInt(formStaffId) : null;
    let finalCategoria = formCategoria || '';

    // Si no se seleccionó staff (Sin preferencia), intentar asignar uno de la categoría seleccionada
    if (!finalStaffId && finalCategoria) {
      // Filtrar staff disponible para esta categoría
      const eligibleStaff = staffList.filter(s => {
        const staffCat = (s.cat_staff || s.especialidad || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const catFilter = finalCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        return staffCat === catFilter && s.activo !== false;
      });

      if (eligibleStaff.length > 0) {
        // Asignar aleatoriamente (o el primero) para evitar error de NULL en DB
        const randomStaff = eligibleStaff[Math.floor(Math.random() * eligibleStaff.length)];
        finalStaffId = randomStaff.id;
        console.log(`🎲 Staff "Sin preferencia" -> Asignado automáticamente: ${randomStaff.nombre} (ID: ${finalStaffId})`);
      } else {
        console.warn('⚠️ No hay staff disponible para la categoría:', finalCategoria);
        // Si no hay staff, advertir? O dejar que falle si la DB lo requiere?
        // Vamos a bloquear para evitar el crash feo
        setFormError(`No hay personal disponible para la categoría "${finalCategoria}". Por favor contacta al administrador.`);
        return;
      }
    }

    // Preparar payload según lo que espera appointmentsApi.create
    const payload: any = {
      fecha: startTime,
      duracion_min: duracionMin,
      cliente_id: parseInt(formClient),
      nombre: client.nombre,
      servicio: formService,
      precio: selectedService?.price || 0,
      categoria: finalCategoria,
      staff_id: finalStaffId
    };

    console.log('📤 Enviando cita a n8n:', payload);

    setIsSubmitting(true);

    try {
      const response = await appointmentsApi.create(payload);
      console.log('✅ Cita creada exitosamente:', response);

      // Mostrar éxito
      setFormSuccess('¡Cita agendada exitosamente!');

      // Usar el precio del servicio que ya buscamos antes
      const precio = selectedService?.price || 0;

      // Crear la cita localmente con los datos correctos del formulario
      // (workaround porque el API no devuelve client_name correctamente)
      const newAppointment: Appointment = {
        id: response?.id || Date.now(), // Usar ID de respuesta o generar uno temporal
        fecha: startTime,
        cliente_id: parseInt(formClient),
        nombre_cliente: client.nombre, // Nombre real del cliente
        servicio: formService,
        precio: precio,
        estado: 'Pendiente',
        calificacion: 0,
        feedback_cliente: '',
        isAiGenerated: false
      };

      // Añadir campos extra para el display
      (newAppointment as any)._telefono = client.telefono || '';
      (newAppointment as any)._nombreReal = client.nombre;
      (newAppointment as any)._extendedProps = {};
      if (formStaffId) {
        (newAppointment as any).staff_id = parseInt(formStaffId);
      }

      console.log('📌 Añadiendo cita local con datos correctos:', newAppointment);

      // Añadir al estado local inmediatamente y guardar en cache
      setLoadedAppointments(prev => {
        const updated = [...prev, newAppointment];
        // Guardar en cache para que persista
        saveCitasToCache(updated);
        return updated;
      });

      // (NO llamar a loadCitas porque sobrescribiría con datos incorrectos de la API)

      // Cerrar modal después de un breve delay para que el usuario vea el mensaje
      setTimeout(() => {
        setIsNewApptModalOpen(false);
        setNewDate('');
        setNewTime('');
        setFormClient('');
        setFormService('');
        setFormNotes('');
        setFormStaffId('');
        setFormSuccess(null);
      }, 1500);

    } catch (error: any) {
      console.error('❌ Error al crear cita:', error);

      // Manejar error 409 (conflicto de horario) - NO cerrar modal
      if (error.status === 409) {
        setFormError(error.message || 'Este horario ya está ocupado. Por favor, elige otro.');
      } else {
        setFormError(error.message || 'Error al agendar la cita. Intenta de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================================
  // Handle Quick Action Status Updates
  // ===========================================
  const handleUpdateStatus = async (citaId: number, nuevoEstado: string) => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);

    try {
      // Llamar a la API para actualizar el estado
      await appointmentsApi.updateStatus(citaId, nuevoEstado);

      // Actualizar el estado local optimísticamente
      setLoadedAppointments(prev => {
        const updated = prev.map(apt =>
          apt.id === citaId ? { ...apt, estado: nuevoEstado } : apt
        );
        // Guardar en cache
        saveCitasToCache(updated);
        return updated;
      });

      // Actualizar la cita seleccionada para reflejar el cambio
      if (selectedAppointment && selectedAppointment.id === citaId) {
        setSelectedAppointment({ ...selectedAppointment, estado: nuevoEstado });
      }

      console.log(`✅ Estado actualizado a: ${nuevoEstado}`);
      // ✅ Refrescar dashboard
      await refreshDashboard(true);

    } catch (error: any) {
      console.error('❌ Error al actualizar estado:', error);
      alert(`Error al actualizar el estado: ${error.message || 'Intenta de nuevo'}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ===========================================
  // Handle Quick Staff Assignment (inline from list)
  // ===========================================
  const handleQuickStaffAssign = async (citaId: number, staffId: number | null) => {
    try {
      // Llamar a la API para actualizar el staff_id
      await appointmentsApi.update(citaId, { staff_id: staffId } as any);

      // Actualizar el estado local optimísticamente
      setLoadedAppointments(prev => {
        const updated = prev.map(apt =>
          apt.id === citaId ? { ...apt, staff_id: staffId } : apt
        );
        saveCitasToCache(updated);
        return updated;
      });

      // Actualizar la cita seleccionada si está abierta
      if (selectedAppointment && selectedAppointment.id === citaId) {
        setSelectedAppointment({ ...selectedAppointment, staff_id: staffId } as any);
      }

      console.log(`✅ Staff asignado: ${staffId || 'Sin asignar'}`);
    } catch (error: any) {
      console.error('❌ Error al asignar staff:', error);
    }
  };

  // ===========================================
  // Handle Reschedule
  // ===========================================
  const handleReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;

    setIsReschedulingSubmitting(true);

    try {
      const newStartTime = `${rescheduleDate}T${rescheduleTime}:00`;

      // Llamar a API para actualizar (por ahora solo actualizamos localmente)
      // await appointmentsApi.reschedule(selectedAppointment.id, newStartTime);

      // Actualizar localmente
      setLoadedAppointments(prev => {
        const updated = prev.map(apt =>
          apt.id === selectedAppointment.id ? { ...apt, fecha: newStartTime } : apt
        );
        saveCitasToCache(updated);
        return updated;
      });

      // Actualizar la cita seleccionada
      setSelectedAppointment({ ...selectedAppointment, fecha: newStartTime });

      // Cerrar formulario de reagendar
      setIsRescheduling(false);
      setRescheduleDate('');
      setRescheduleTime('');

      console.log(`✅ Cita reagendada a: ${newStartTime}`);

    } catch (error: any) {
      console.error('❌ Error al reagendar:', error);
      alert(`Error al reagendar: ${error.message || 'Intenta de nuevo'}`);
    } finally {
      setIsReschedulingSubmitting(false);
    }
  };

  // Inicializar campos de edición cuando se abre el modo edición
  const handleStartEdit = () => {
    if (!selectedAppointment) return;

    // Parsear fecha y hora de la cita actual
    const fechaStr = selectedAppointment.fecha || '';
    let dateValue = '';
    let timeValue = '';

    if (fechaStr) {
      const date = new Date(fechaStr);
      dateValue = date.toISOString().split('T')[0];
      timeValue = date.toTimeString().slice(0, 5);
    }

    setEditDate(dateValue);
    setEditTime(timeValue);
    setEditService(selectedAppointment.servicio || '');
    setEditPrice(selectedAppointment.precio || 0);
    setIsEditingAppointment(true);
  };

  // Guardar cambios de edición
  const handleSaveEdit = async () => {
    if (!selectedAppointment || !editDate || !editTime || !editService) return;

    setIsEditSubmitting(true);

    try {
      // FORZAR CONVERSIÓN LIMA -> UTC (Robusto)
      // "21:00 Lima" equivale a "02:00 UTC" del día siguiente.
      // UTC = Lima + 5 horas.
      const [y, m, d] = editDate.split('-').map(Number);
      const [h, min] = editTime.split(':').map(Number);

      // Creamos timestamp asumiendo que los números ingresados fueran UTC
      const baseTimestamp = Date.UTC(y, m - 1, d, h, min, 0);
      // Sumamos 5 horas para obtener el UTC real correspondiente a Lima
      const limaToUtcOffset = 5 * 60 * 60 * 1000;
      const utcDate = new Date(baseTimestamp + limaToUtcOffset);

      const newDateTime = utcDate.toISOString(); // Ejemplo: "...T02:00:00.000Z"

      const numPrice = Number(editPrice);

      console.log('🔄 Update Appointment (Calculated UTC):', {
        inputLima: `${editDate} ${editTime}`,
        sentUTC: newDateTime
      });

      // Llamar a API para actualizar
      const response = await appointmentsApi.update(selectedAppointment.id, {
        nueva_fecha: newDateTime,
        nuevo_servicio: editService,
        nuevo_precio: numPrice,
        nuevo_estado: selectedAppointment.estado
      });

      console.log('✅ Update Success:', response);

      // Actualizar localmente
      const updatedAppointment = {
        ...selectedAppointment,
        fecha: newDateTime,
        servicio: editService,
        precio: numPrice
      };

      setLoadedAppointments(prev => {
        const updated = prev.map(apt =>
          apt.id === selectedAppointment.id ? updatedAppointment : apt
        );
        console.log('📊 Actualizando estado local:', updated.find(a => a.id === selectedAppointment.id));
        saveCitasToCache(updated);
        return updated;
      });

      // Actualizar la cita seleccionada para que el modal refleje cambio inmediato (si siguiera abierto)
      setSelectedAppointment(updatedAppointment);

      // FORCE REFRESH: Invalidar caché GLOBAL del dashboard para que al recargar vengan datos nuevos
      console.log('🧹 Invalidando caché dashboard_all...');
      dashboard.invalidateCache();
      // ✅ Refrescar dashboard en tiempo real
      await refreshDashboard(true);

      // Cerrar formulario de edición
      setIsEditingAppointment(false);
      setEditDate('');
      setEditTime('');
      setEditService('');
      setEditPrice(0);

      // Mostrar éxito (toast o alert si no hay toast)
      // alert('Cita actualizada correctamente'); // Opcional, mejor usar UI no intrusiva

    } catch (error: any) {
      console.error('❌ Error al actualizar cita:', error);
      alert(`Error al actualizar: ${error.message || 'Intenta de nuevo'}`);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Cancelar edición
  const handleCancelEdit = () => {
    setIsEditingAppointment(false);
    setEditDate('');
    setEditTime('');
    setEditService('');
    setEditPrice(0);
  };

  // ===========================================
  // Generate WhatsApp Reminder Message
  // ===========================================
  const generateWhatsAppMessage = (apt: Appointment) => {
    const clientName = getDisplayName(apt);
    const service = apt.servicio || 'servicio';
    const dateFormatted = formatDateForDisplay(apt.fecha);

    return `¡Hola ${clientName}! 👋\n\n` +
      `Te recordamos tu cita de *${service}* programada para:\n` +
      `📅 ${dateFormatted}\n\n` +
      `¡Te esperamos! 💅✨\n\n` +
      `Si necesitas cambiar tu cita, por favor contáctanos.`;
  };

  // ===========================================
  // Safety check para evitar renders con datos inválidos
  // ===========================================
  if (!Array.isArray(appointments)) {
    console.error('appointments no es un array válido:', appointments);
    return (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-dark-card rounded-xl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Error cargando datos. <button onClick={refresh} className="text-primary underline">Reintentar</button></p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Agenda - {SIMULATION_DATE.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona tus citas de forma eficiente.</p>
          {loadError && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-1">
              <AlertCircle size={14} />
              {loadError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300 dark:hover:bg-dark-border disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>
          <button
            onClick={() => setIsNewApptModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-black hover:bg-primary-dim shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* QUICK AVAILABILITY VIEW */}
      {/* DAILY DASHBOARD VIEW */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-violet-600 dark:text-violet-400" size={20} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Resumen del Día</h2>
          </div>
          <button
            onClick={() => setShowQuickView(!showQuickView)}
            className="text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            {showQuickView ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        {showQuickView && (
          <div className="space-y-4">
            {/* Day Carousel */}
            <DayCarousel
              selectedDate={quickBookDate}
              onDateChange={setQuickBookDate}
              appointments={appointments}
            />

            {/* Daily Metrics Bar Replace TimelineSlots */}
            <DailyMetricsBar
              appointments={appointments}
              allAppointments={appointments}
              selectedDate={new Date(quickBookDate + 'T00:00:00')}
              staff={staffList}
              businessHours={businessHours}
              closedDays={closedDays}
            />
          </div>
        )}
      </div>

      {/* VIEW TOGGLE & TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-dark-border pb-3">
        {/* View Type Toggle (List vs Monthly) */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => {
              setCalendarViewType('list');
              localStorage.setItem('korat_calendar_view', 'list');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${calendarViewType === 'list'
              ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <List size={16} />
            <span className="hidden sm:inline">Lista</span>
          </button>
          <button
            onClick={() => {
              setCalendarViewType('monthly');
              localStorage.setItem('korat_calendar_view', 'monthly');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${calendarViewType === 'monthly'
              ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <Grid3X3 size={16} />
            <span className="hidden sm:inline">Mensual</span>
          </button>
          <button
            onClick={() => {
              setCalendarViewType('columns');
              localStorage.setItem('korat_calendar_view', 'columns');
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${calendarViewType === 'columns'
              ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
          >
            <CalendarIcon size={16} />
            <span className="hidden sm:inline">Por Staff</span>
          </button>
        </div>

        {/* List View Tabs (Upcoming/History) - Only show in list mode */}
        {calendarViewType === 'list' && (
          <div className="flex gap-1">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${viewMode === 'upcoming'
                ? 'bg-primary text-black'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
            >
              <CalendarIcon size={16} />
              Próximas
              <span className={`ml-1 rounded-full px-2 py-0.5 text-xs ${viewMode === 'upcoming' ? 'bg-black/20' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'}`}>
                {(() => {
                  const todayStart = new Date(SIMULATION_DATE.getTime());
                  todayStart.setHours(0, 0, 0, 0);
                  return appointments.filter(a => {
                    if (!a.fecha) return false;
                    const aptDate = new Date(a.fecha);
                    if (isNaN(aptDate.getTime())) return false;
                    const estado = (a.estado || '').toLowerCase();
                    return aptDate >= todayStart && estado !== 'cancelada' && estado !== 'no-show';
                  }).length;
                })()}
              </span>
            </button>
            <button
              onClick={() => setViewMode('history')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors rounded-lg ${viewMode === 'history'
                ? 'bg-primary text-black'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
            >
              <History size={16} />
              Historial
            </button>
          </div>
        )}
      </div>

      {/* STAFF FILTER TABS (only in monthly view) */}
      {calendarViewType === 'monthly' && (
        <div className="rounded-xl bg-white p-3 shadow-sm dark:bg-dark-card border border-gray-100 dark:border-dark-border">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Filtrar por especialidad
            </p>
            {staffFilter !== 'todos' && (
              <button
                onClick={() => setStaffFilter('todos')}
                className="text-xs text-primary hover:underline"
              >
                Limpiar filtro
              </button>
            )}
          </div>
          <StaffFilterTabs
            selected={staffFilter}
            onChange={(esp) => setStaffFilter(esp)}
            counts={{
              todos: appointments.filter(a => a.estado !== 'Cancelada' && a.estado !== 'No-Show').length,
              manos: appointments.filter(a => (a.categoria || '').toLowerCase() === 'manos').length,
              pies: appointments.filter(a => (a.categoria || '').toLowerCase() === 'pies').length,
              pestañas: appointments.filter(a => (a.categoria || '').toLowerCase() === 'pestañas').length,
              rostro: appointments.filter(a => (a.categoria || '').toLowerCase() === 'rostro').length,
              cabello: appointments.filter(a => (a.categoria || '').toLowerCase() === 'cabello').length,
              multi: appointments.filter(a => (a.categoria || '').toLowerCase() === 'multi').length,
            }}
            showCounts={true}
          />
        </div>
      )}

      {/* MONTHLY CALENDAR VIEW */}
      {calendarViewType === 'monthly' && (
        <MonthlyCalendarView
          appointments={appointments.filter(apt => {
            if (staffFilter === 'todos') return true;
            return (apt.categoria || '').toLowerCase() === staffFilter;
          })}
          closedDays={closedDays}
          selectedEspecialidad={staffFilter}
          onSelectDate={(date) => {
            setQuickBookDate(date);
            setIsQuickBookOpen(true);
          }}
          onSelectAppointment={(apt) => setSelectedAppointment(apt)}
          onCreateAppointment={(date) => {
            setQuickBookDate(date);
            setIsQuickBookOpen(true);
          }}
        />
      )}

      {/* STAFF COLUMNS VIEW */}
      {calendarViewType === 'columns' && (
        <StaffColumnsView
          date={quickBookDate}
          appointments={appointments.filter(apt => {
            if (staffFilter === 'todos') return true;
            return (apt.categoria || '').toLowerCase() === staffFilter;
          }).map(apt => ({
            ...apt,
            hora: apt.fecha ? getTimeInLima(apt.fecha) : '',
            cliente_nombre: getDisplayName(apt)
          }))}
          staff={staffList}
          businessHours={businessHours}
          lunchHours={lunchHours}
          closedDays={closedDays}
          onCreateAppointment={(time, staffId) => {
            // Pre-fill form data
            setNewTime(time);
            setNewDate(typeof quickBookDate === 'string' ? quickBookDate : quickBookDate.toISOString().split('T')[0]);
            if (staffId) setFormStaffId(staffId.toString());
            // Open standard modal
            setIsNewApptModalOpen(true);
          }}
          onSelectAppointment={(apt) => setSelectedAppointment(apt as any)}
          onDateChange={(date) => setQuickBookDate(date)}
        />
      )}

      {/* LIST VIEW - FILTERS (only in list mode) */}
      {calendarViewType === 'list' && (
        <div className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:bg-dark-card border border-gray-100 dark:border-dark-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:bg-dark-bg dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <ListFilter className="h-4 w-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:bg-dark-bg dark:text-white cursor-pointer min-w-[160px]"
            >
              <option value="Todos">Todos los Estados</option>
              {Object.keys(STATUS_LABELS).map(key => (
                <option key={key} value={key}>{STATUS_LABELS[key]}</option>
              ))}
            </select>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="rounded-lg bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 dark:bg-dark-bg dark:text-white cursor-pointer min-w-[180px]"
            >
              <option value="Todos">Todos los Servicios</option>
              {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* APPOINTMENT LIST (only in list mode) */}
      {calendarViewType === 'list' && (
        <div className="space-y-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-dark-border dark:bg-dark-card">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span className="text-gray-500 dark:text-gray-400">Cargando citas...</span>
            </div>
          ) : Object.keys(groupedAppointments).length > 0 ? (
            Object.keys(groupedAppointments).map(dateKey => {
              const label = getDateHeaderLabel(dateKey);
              const isToday = label === 'HOY';

              return (
                <div key={dateKey} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* DATE HEADER */}
                  <div className="sticky top-0 z-10 mb-4 flex items-center gap-3 bg-gray-50/95 py-3 backdrop-blur dark:bg-dark-bg/95">
                    <span className={`rounded-md px-3 py-1 text-sm font-bold tracking-wide shadow-sm ${isToday ? 'bg-primary text-black' : 'bg-white text-gray-700 border border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                      }`}>
                      {label}
                    </span>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800"></div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {groupedAppointments[dateKey].map((apt) => {
                      const shield = getClientShield(apt);
                      // Convertir hora UTC a hora de Lima
                      const fechaApt = apt.fecha || '';
                      const timePart = fechaApt ? getTimeInLima(fechaApt) : '--:--';

                      return (
                        <div
                          key={apt.id}
                          className="group relative flex flex-col sm:flex-row items-stretch overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-primary/40 hover:shadow-md dark:border-dark-border dark:bg-dark-card"
                        >
                          {/* LEFT: TIME */}
                          <div className="flex w-full sm:w-24 items-center justify-between sm:justify-center border-b border-gray-100 bg-gray-50 px-4 py-2 sm:flex-col sm:border-b-0 sm:border-r dark:border-dark-border dark:bg-[#252525]">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">{timePart}</span>
                            {/* AI INDICATOR */}
                            {apt.isAiGenerated && (
                              <span className="mt-1 flex items-center gap-1 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" title="Agendado por Nilah IA">
                                <Bot size={10} /> IA
                              </span>
                            )}
                          </div>

                          {/* CENTER: INFO */}
                          <div className="flex-1 p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{getDisplayName(apt)}</h3>
                              {renderShield(shield.level)}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{apt.servicio}</span>
                              <span className="h-1 w-1 rounded-full bg-gray-300"></span>
                              <span>S/ {(apt.precio || 0).toFixed(2)}</span>
                            </div>
                            {/* QUICK STAFF ASSIGNMENT - Show if no staff_id but has categoria */}
                            {!(apt as any).staff_id && (apt as any).categoria && staffList.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  ⚠️ Sin asignar
                                </span>
                                <select
                                  className="text-xs rounded-md border border-gray-200 bg-white px-2 py-1 dark:border-dark-border dark:bg-dark-bg dark:text-white cursor-pointer hover:border-primary focus:ring-1 focus:ring-primary"
                                  defaultValue=""
                                  onChange={(e) => {
                                    const staffId = e.target.value ? parseInt(e.target.value) : null;
                                    handleQuickStaffAssign(apt.id, staffId);
                                  }}
                                >
                                  <option value="">Asignar empleado...</option>
                                  {staffList
                                    .filter(s => !(apt as any).categoria || s.especialidad === (apt as any).categoria)
                                    .map(s => (
                                      <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))
                                  }
                                  {/* If no matching staff, show all */}
                                  {staffList.filter(s => s.especialidad === (apt as any).categoria).length === 0 &&
                                    staffList.map(s => (
                                      <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))
                                  }
                                </select>
                              </div>
                            )}
                            {/* Show assigned staff name if exists */}
                            {(apt as any).staff_id && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  👤 {staffList.find(s => s.id === (apt as any).staff_id)?.nombre || 'Asignado'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* RIGHT: STATUS & ACTION */}
                          <div className="flex items-center justify-between p-4 sm:w-auto sm:justify-end sm:gap-4 sm:border-l sm:border-gray-100 dark:sm:border-dark-border">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${STATUS_COLORS[apt.estado]}`}>
                              {STATUS_LABELS[apt.estado] || apt.estado}
                            </span>

                            <button
                              onClick={() => setSelectedAppointment(apt)}
                              className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:border-primary hover:text-primary dark:border-dark-border dark:bg-dark-bg dark:text-gray-300 dark:hover:text-white transition-colors shadow-sm"
                            >
                              Ver Detalles
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700">
              <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-dark-card">
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay citas en esta vista</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Intenta cambiar de pestaña o ajustar los filtros.</p>
            </div>
          )}
        </div>
      )}

      {/* --- NEW APPOINTMENT MODAL --- */}
      {
        isNewApptModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md animate-in zoom-in-95 duration-200 rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nueva Cita</h2>
                <button onClick={() => { setIsNewApptModalOpen(false); setFormError(null); setFormSuccess(null); }} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                  <X size={20} />
                </button>
              </div>

              {/* Alerta de Error */}
              {formError && (
                <div className="mb-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300">
                  <AlertCircle size={20} className="shrink-0 text-red-600" />
                  <div>
                    <strong className="block font-bold">Error</strong>
                    <p className="mt-0.5">{formError}</p>
                  </div>
                </div>
              )}

              {/* Alerta de Éxito */}
              {formSuccess && (
                <div className="mb-4 flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900/50 dark:text-emerald-300">
                  <CheckCircle size={20} className="shrink-0 text-emerald-600" />
                  <div>
                    <strong className="block font-bold">¡Éxito!</strong>
                    <p className="mt-0.5">{formSuccess}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleNewApptSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Cliente</label>
                  <select
                    required
                    disabled={isSubmitting}
                    value={formClient}
                    onChange={(e) => { setFormClient(e.target.value); setFormError(null); }}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white disabled:opacity-50"
                  >
                    <option value="">Seleccionar Cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}{c.telefono ? ` (${c.telefono})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* AUTO-DETECT BAD CLIENT */}
                  {formClient && (() => {
                    const cId = parseInt(formClient);
                    const clientFound = clients.find(c => c.id === cId);
                    if (!clientFound) return null;
                    // Crear un appointment temporal para usar getClientShield
                    const tempApt = { cliente_id: cId, nombre_cliente: clientFound.nombre } as Appointment;
                    const shield = getClientShield(tempApt);
                    if (shield.level === 'Low') {
                      return (
                        <div className="mt-3 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-900/20 dark:border-rose-900/50 dark:text-rose-300">
                          <AlertCircle size={20} className="shrink-0 text-rose-600" />
                          <div>
                            <strong className="block font-bold text-rose-700 dark:text-rose-400">⚠️ ALERTA DE RIESGO</strong>
                            <p className="mt-1 text-xs leading-relaxed">Cliente con historial de inasistencias. Se recomienda solicitar un <span className="font-bold underline">depósito del 50%</span>.</p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Service moved down */}

                {/* Selector de Categoría (Mandatory) */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    Categoría <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    disabled={isSubmitting}
                    value={formCategoria}
                    onChange={(e) => { setFormCategoria(e.target.value); setFormStaffId(''); }}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white disabled:opacity-50"
                  >
                    <option value="">Seleccionar Categoría...</option>
                    <option value="manos">💅 Manos</option>
                    <option value="pies">🦶 Pies</option>
                    <option value="pestanas">👁️ Pestañas</option>
                    <option value="rostro">💆 Rostro</option>
                    <option value="cabello">💇 Cabello</option>
                  </select>
                </div>

                {/* Selector de Staff */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    👤 Asignar a (Opcional)
                  </label>
                  <select
                    disabled={isSubmitting}
                    value={formStaffId}
                    onChange={(e) => setFormStaffId(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white disabled:opacity-50"
                  >
                    <option value="">Sin asignar (general)</option>
                    {staffList
                      .filter(s => {
                        if (!formCategoria) return true;
                        const staffCat = (s.cat_staff || s.especialidad || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        // Comparación flexible
                        const catFilter = formCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        return staffCat === catFilter;
                      })
                      .map(s => (
                        <option key={s.id} value={s.id}>
                          {s.nombre} {s.cat_staff ? `(${s.cat_staff})` : (s.especialidad && s.especialidad !== 'multi' ? `(${s.especialidad})` : '')}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Selector de Servicio (MOVED DOWN) */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Servicio</label>
                  <select
                    required
                    disabled={isSubmitting}
                    value={formService}
                    onChange={(e) => { setFormService(e.target.value); setFormError(null); }}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white disabled:opacity-50"
                  >
                    <option value="">Seleccionar Servicio...</option>
                    {services
                      .filter(s => {
                        if (!formCategoria) return true;
                        const filterCat = formCategoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                        // 1. Check explicit category (if exists)
                        const sCat = (s.categoria || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                        if (sCat === filterCat || sCat === 'multi') return true;

                        // 2. Check name inference (Fallback keywords)
                        const name = (s.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                        if (filterCat.includes('pestana')) {
                          return name.includes('pestana') || name.includes('cejas') || name.includes('extensiones') || name.includes('lifting') || name.includes('volumen') || name.includes('wispy') || name.includes('rimel') || name.includes('fox') || name.includes('cat');
                        }
                        if (filterCat.includes('mano') || filterCat.includes('uñas')) {
                          return name.includes('mano') || name.includes('manicura') || name.includes('una') || name.includes('uña') || name.includes('gel') || name.includes('acril') || name.includes('esmalt') || name.includes('rubber');
                        }
                        if (filterCat.includes('pie') || filterCat.includes('pedicura')) {
                          return name.includes('pie') || name.includes('pedicura') || name.includes('callo');
                        }
                        if (filterCat.includes('rostro') || filterCat.includes('facial')) {
                          return name.includes('rostro') || name.includes('facial') || name.includes('limpieza') || name.includes('masaje') || name.includes('hidra');
                        }
                        if (filterCat.includes('cabello') || filterCat.includes('peluqueria')) {
                          return name.includes('cabello') || name.includes('corte') || name.includes('tinte') || name.includes('mechas') || name.includes('botox') || name.includes('keratina') || name.includes('cauterizacion');
                        }

                        return false;
                      })
                      .map(s => (
                        <option key={s.id} value={s.name}>
                          {s.name} - S/ {typeof s.price === 'number' ? s.price.toFixed(2) : s.price}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Fecha</label>
                    <input
                      type="date"
                      required
                      disabled={isSubmitting}
                      value={newDate}
                      onChange={(e) => { setNewDate(e.target.value); setFormError(null); }}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">Hora</label>
                    <input
                      type="time"
                      required
                      disabled={isSubmitting}
                      value={newTime}
                      onChange={(e) => { setNewTime(e.target.value); setFormError(null); }}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    <FileText size={12} className="inline mr-1" />
                    Notas (Opcional)
                  </label>
                  <textarea
                    disabled={isSubmitting}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Ej: Alérgica a ciertos productos, viene con su hija, preferencias especiales..."
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white disabled:opacity-50 resize-none"
                  />
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4 dark:border-dark-border">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => { setIsNewApptModalOpen(false); setFormError(null); setFormSuccess(null); }}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-bg disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-black hover:bg-primary-dim shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Agendando...
                      </>
                    ) : (
                      'Confirmar Cita'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* --- DETAILS MODAL --- */}
      {
        selectedAppointment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-dark-card animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4 dark:border-dark-border dark:bg-[#252525]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Detalles de la Cita</h2>
                    {selectedAppointment.isAiGenerated && (
                      <span className="flex items-center gap-1 rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        <Bot size={12} /> Nilah IA
                      </span>
                    )}
                    {!isEditingAppointment && selectedAppointment.estado !== 'Cancelada' && (
                      <button
                        onClick={handleStartEdit}
                        className="ml-2 rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-primary dark:text-gray-400 dark:hover:bg-gray-700"
                        title="Editar Cita"
                      >
                        <Pencil size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">ID: #{selectedAppointment.id}</p>
                </div>
                <button onClick={() => { setSelectedAppointment(null); setIsRescheduling(false); setRescheduleDate(''); setRescheduleTime(''); }} className="rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* 1. Appointment Info - Edit Mode or View Mode */}
                {isEditingAppointment ? (
                  <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <div className="mb-3">
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Servicio</label>
                      <select
                        value={editService}
                        onChange={(e) => {
                          const newService = e.target.value;
                          setEditService(newService);
                          const sObj = services.find(s => s.name === newService);
                          if (sObj) setEditPrice(sObj.price);
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-dark-bg dark:text-white"
                      >
                        {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Fecha</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-dark-bg dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Hora</label>
                        <input
                          type="time"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-dark-bg dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="mb-1 block text-xs font-bold uppercase text-gray-500">Precio (S/)</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-gray-600 dark:bg-dark-bg dark:text-white"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={isEditSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-50"
                      >
                        {isEditSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Guardar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isEditSubmitting}
                        className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-dark-bg dark:text-gray-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-6 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-bg">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarIcon size={16} className="text-primary" />
                        <span className="text-xs font-bold text-gray-500">FECHA Y HORA</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-relaxed">{formatDateTimeLima(selectedAppointment.fecha)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-bg">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign size={16} className="text-green-500" />
                        <span className="text-xs font-bold text-gray-500">PRECIO</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">S/ {(selectedAppointment.precio || 0).toFixed(2)}</p>
                    </div>
                  </div>
                )}

                {/* 2. Client Context */}
                {(() => {
                  const client = getClientContext(selectedAppointment);
                  const shield = getClientShield(selectedAppointment);
                  const telefono = getClientPhone(selectedAppointment);

                  return (
                    <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Cliente</h3>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                              {getDisplayName(selectedAppointment)}
                            </span>
                            {client && renderShield(shield.level)}
                          </div>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <Phone size={14} className="text-primary" />
                              <span>{telefono}</span>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                                {client?.categoria || 'Regular'}
                              </span>
                              <span className="text-xs text-gray-500">
                                Servicio: <span className="font-medium">{selectedAppointment.servicio}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        {client && (
                          <div className="text-right">
                            <span className="block text-xl font-bold text-primary">{client.total_visitas}</span>
                            <span className="text-[10px] uppercase text-gray-400">Visitas</span>
                          </div>
                        )}
                      </div>

                      {/* Extended Props Section */}
                      {(selectedAppointment as any)._extendedProps && Object.keys((selectedAppointment as any)._extendedProps).length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-border">
                          <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-2">Información Adicional</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries((selectedAppointment as any)._extendedProps).map(([key, value]) => (
                              key !== 'cliente_id' && key !== 'nombre_cliente' && value && (
                                <div key={key} className="flex justify-between bg-white dark:bg-dark-card rounded px-2 py-1">
                                  <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span className="font-medium text-gray-700 dark:text-gray-300">{String(value)}</span>
                                </div>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 3. Communication Buttons */}
                {selectedAppointment.estado !== 'Cancelada' && (
                  <div className="mb-4">
                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Comunicación</h3>
                    <div className="flex gap-2">
                      {/* WhatsApp Reminder Button */}
                      {(() => {
                        const telefono = getClientPhone(selectedAppointment);
                        const cleanPhone = telefono.replace(/\D/g, '');
                        const hasValidPhone = cleanPhone.length >= 9 && telefono !== 'No disponible';

                        return hasValidPhone ? (
                          <a
                            href={`https://wa.me/51${cleanPhone}?text=${encodeURIComponent(generateWhatsAppMessage(selectedAppointment))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-green-500 py-2.5 text-xs font-bold text-white shadow-lg shadow-green-500/30 transition-transform hover:scale-[1.02] hover:bg-green-400"
                          >
                            <MessageCircle size={16} />
                            Enviar Recordatorio
                          </a>
                        ) : (
                          <button
                            disabled
                            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gray-200 py-2.5 text-xs font-bold text-gray-400 cursor-not-allowed dark:bg-gray-700"
                          >
                            <MessageCircle size={16} />
                            Sin teléfono
                          </button>
                        );
                      })()}

                      {/* Reschedule Button */}
                      <button
                        onClick={() => setIsRescheduling(!isRescheduling)}
                        className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${isRescheduling
                          ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'}`}
                      >
                        <CalendarClock size={16} />
                        {isRescheduling ? 'Cancelar' : 'Reagendar'}
                      </button>
                    </div>

                    {/* Reschedule Form */}
                    {isRescheduling && (
                      <div className="mt-3 p-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
                          Selecciona la nueva fecha y hora:
                        </p>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="flex-1 rounded-lg border border-blue-300 bg-white p-2 text-sm dark:border-blue-700 dark:bg-dark-bg dark:text-white"
                          />
                          <input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="w-28 rounded-lg border border-blue-300 bg-white p-2 text-sm dark:border-blue-700 dark:bg-dark-bg dark:text-white"
                          />
                        </div>
                        <button
                          onClick={handleReschedule}
                          disabled={!rescheduleDate || !rescheduleTime || isReschedulingSubmitting}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isReschedulingSubmitting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Confirmar Nueva Fecha
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Quick Actions - Status Changes */}
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">Acciones Rápidas</h3>

                {selectedAppointment.estado === 'Cancelada' ? (
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                    Esta cita está cancelada. No hay acciones disponibles.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Botón Completar (Verde fuerte) - Solo si NO está Completada */}
                    {selectedAppointment.estado !== 'Completada' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'Completada')}
                        disabled={isUpdatingStatus}
                        className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/30 transition-transform hover:scale-[1.02] hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingStatus ? <Loader2 size={18} className="animate-spin" /> : <ThumbsUp size={18} />}
                        Marcar Completada
                      </button>
                    )}

                    {/* Si ya está Completada, mostrar botón para revertir a Pendiente */}
                    {selectedAppointment.estado === 'Completada' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'Pendiente')}
                        disabled={isUpdatingStatus}
                        className="flex items-center justify-center gap-2 rounded-lg bg-yellow-500 py-3 text-xs font-bold text-white shadow-lg shadow-yellow-500/30 transition-transform hover:scale-[1.02] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingStatus ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        Revertir a Pendiente
                      </button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {/* Botón No-Show (Gris) - Solo si NO está en No-Show */}
                      {selectedAppointment.estado !== 'No-Show' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedAppointment.id, 'No-Show')}
                          disabled={isUpdatingStatus}
                          className="flex flex-col items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-100 py-2 text-[10px] font-bold text-gray-600 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                          No-Show
                        </button>
                      )}

                      {/* Si es No-Show, mostrar opción de revertir */}
                      {selectedAppointment.estado === 'No-Show' && (
                        <button
                          onClick={() => handleUpdateStatus(selectedAppointment.id, 'Pendiente')}
                          disabled={isUpdatingStatus}
                          className="flex flex-col items-center justify-center gap-1 rounded-lg border border-yellow-300 bg-yellow-50 py-2 text-[10px] font-bold text-yellow-700 hover:bg-yellow-100 dark:border-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                          Revertir
                        </button>
                      )}

                      {/* Botón Cancelar (Rojo) - Siempre visible excepto si está Cancelada */}
                      <button
                        onClick={() => handleUpdateStatus(selectedAppointment.id, 'Cancelada')}
                        disabled={isUpdatingStatus}
                        className="flex flex-col items-center justify-center gap-1 rounded-lg bg-red-100 py-2 text-[10px] font-bold text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUpdatingStatus ? <Loader2 size={16} className="animate-spin" /> : <Ban size={16} />}
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-6 py-3 text-center text-xs dark:bg-[#252525]">
                Estado actual: <span className={`inline-flex rounded-full px-2 py-0.5 font-bold ${STATUS_COLORS[selectedAppointment.estado]}`}>{STATUS_LABELS[selectedAppointment.estado] || selectedAppointment.estado}</span>
              </div>
            </div>
          </div>
        )
      }

      {/* Quick Book Modal */}
      {/* Quick Book Modal Removed */}
    </div >
  );
};

export default CalendarPage;
