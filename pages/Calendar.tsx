
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Filter, X, Calendar as CalendarIcon, DollarSign, CheckCircle, Ban, AlertCircle, Shield, ShieldAlert, ShieldCheck, ChevronRight, Eye, Clock, History, ListFilter, ThumbsUp, Bot, Loader2, RefreshCw, Phone, MessageCircle, CalendarClock, FileText, Pencil, Save, Grid3X3, List, User, Sparkles, Maximize, Minimize } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';
import { Appointment, StaffEspecialidad, CategoriaCalendario } from '../types';
import { calculateReliabilityScore } from '../utils/metrics';
import { dashboard, crm, appointments as appointmentsApi, negocioInfo, diasCerrados, equipo, categoriasCalendario } from '../services/api';
import { getTimeInLima, formatDateTimeLima } from '../utils/timezone';
// DayCarousel removed — replaced by compact DailyMetricsBar strip
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
  const [isFullScreen, setIsFullScreen] = useState(false);

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
  const [categoriasList, setCategoriasList] = useState<CategoriaCalendario[]>([]);

  // Clientes: vienen del contexto (ya filtrados por business_id)

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

        const [configData, closedDaysData, staffData, categoriasData] = await Promise.all([
          negocioInfo.getAll().catch(() => []),
          diasCerrados.getAll().catch(() => []),
          equipo.getAll().catch(() => []),
          categoriasCalendario.getAll().catch(() => [])
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

        // 6. Procesar categorías
        if (Array.isArray(categoriasData) && categoriasData.length > 0) {
          setCategoriasList(categoriasData);
          console.log('📂 Categorías cargadas:', categoriasData.length);
        } else {
          // Fallback: derivar categorías únicas desde el staff (cat_staff o especialidad)
          console.warn('⚠️ No se encontraron categorías en la tabla. Derivando desde staff...');
          const activeStaffForCats = Array.isArray(staffData) ? staffData.filter((s: any) => s.activo !== false) : [];
          const uniqueCats = Array.from(
            new Set(
              activeStaffForCats
                .map((s: any) => (s.cat_staff || s.especialidad || '').trim())
                .filter((cat: string) => cat && cat.toLowerCase() !== 'multi')
            )
          );
          const derivedCats: CategoriaCalendario[] = uniqueCats.map((cat: string, idx: number) => ({
            id: -(idx + 1), // IDs negativos para indicar que son derivados
            nombre: cat.charAt(0).toUpperCase() + cat.slice(1),
            activo: true,
          }));
          if (derivedCats.length > 0) {
            setCategoriasList(derivedCats);
            console.log('📂 Categorías derivadas del staff:', derivedCats.length, derivedCats);
          } else {
            console.warn('⚠️ No se pudieron derivar categorías del staff tampoco.');
          }
        }

        // Citas se cargan automáticamente via Context (processedAppointments useMemo)

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
    const today = new Date();
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

    // Usar el fiabilidad_score real del backend si está disponible (fallback 100 como default)
    const score = client.fiabilidad_score ?? 100;

    // Lógica Semáforo: <50 (Riesgo/Depósito), 50-79 (Medio/Precaución), >=80 (Fiable)
    let level: 'High' | 'Medium' | 'Low' = 'High';
    if (score < 50) level = 'Low';
    else if (score < 80) level = 'Medium';

    return { score, level };
  };

  const renderShield = (shield: { score: number; level: 'High' | 'Medium' | 'Low' }, size = 16) => {
    // Escudo Rosa (Riesgo), Naranja (Neutro), Verde (Fiable)
    if (shield.level === 'Low') {
      return (
        <div className="flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/30 dark:text-red-400" title="Riesgo Alto (<50) - Depósito Requerido">
          <ShieldAlert size={size} />
          <span className="hidden sm:inline">{shield.score} pts</span>
        </div>
      );
    }
    if (shield.level === 'Medium') {
      return (
        <div className="flex items-center gap-1.5 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" title="Riesgo Medio (50-79) - Enviar recordatorio extra">
          <Shield size={size} />
          <span className="hidden sm:inline">{shield.score} pts</span>
        </div>
      );
    }
    // High (Trust)
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" title="Cliente Confiable">
        <ShieldCheck size={size} />
        <span className="hidden sm:inline">{shield.score} pts</span>
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

    // ═══════════════════ VALIDACIÓN HORARIO DE NEGOCIO ═══════════════════

    // 1. Validar días cerrados
    const closedDay = closedDays.find(cd => cd.fecha === newDate);
    if (closedDay) {
      if (closedDay.es_dia_completo) {
        setFormError(`El ${newDate} es un día cerrado. No se pueden agendar citas.`);
        return;
      }
      // Cierre parcial: verificar si la hora cae dentro del rango cerrado
      if (closedDay.hora_inicio && closedDay.hora_fin) {
        if (newTime >= closedDay.hora_inicio && newTime < closedDay.hora_fin) {
          setFormError(`El ${newDate} está cerrado de ${closedDay.hora_inicio} a ${closedDay.hora_fin}.`);
          return;
        }
      }
    }

    // 2. Validar horario de operación del día
    const dayOfWeek = localDate.getDay(); // 0=Dom, 1-5=Lun-Vie, 6=Sáb
    const dayHours = dayOfWeek === 0 ? businessHours.sunday
      : dayOfWeek === 6 ? businessHours.saturday
        : businessHours.weekdays;

    if (dayHours.start === 0 && dayHours.end === 0) {
      const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
      setFormError(`El negocio está cerrado los ${dayNames[dayOfWeek]}s.`);
      return;
    }

    const appointmentHour = localDate.getHours();
    const appointmentMinutes = localDate.getMinutes();
    const appointmentTimeDecimal = appointmentHour + appointmentMinutes / 60;

    if (appointmentTimeDecimal < dayHours.start || appointmentTimeDecimal >= dayHours.end) {
      setFormError(`El horario de atención es de ${dayHours.start}:00 a ${dayHours.end}:00. La cita debe estar dentro de ese rango.`);
      return;
    }

    // 3. Validar hora de almuerzo
    if (lunchHours && lunchHours !== 'Sin almuerzo') {
      // Parsear formato "12pm - 2pm" o "1pm - 2pm"
      const lunchMatch = lunchHours.match(/(\d+)(am|pm)\s*-\s*(\d+)(am|pm)/i);
      if (lunchMatch) {
        let lunchStart = parseInt(lunchMatch[1]);
        if (lunchMatch[2].toLowerCase() === 'pm' && lunchStart !== 12) lunchStart += 12;
        if (lunchMatch[2].toLowerCase() === 'am' && lunchStart === 12) lunchStart = 0;
        let lunchEnd = parseInt(lunchMatch[3]);
        if (lunchMatch[4].toLowerCase() === 'pm' && lunchEnd !== 12) lunchEnd += 12;
        if (lunchMatch[4].toLowerCase() === 'am' && lunchEnd === 12) lunchEnd = 0;

        if (appointmentHour >= lunchStart && appointmentHour < lunchEnd) {
          setFormError(`La hora seleccionada coincide con la hora de almuerzo (${lunchHours}). Por favor elige otro horario.`);
          return;
        }
      }
    }

    // ═══════════════════ FIN VALIDACIÓN ═══════════════════

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

      const msg: string = error.message || '';

      // FIX E7: Fecha en el pasado
      if (msg.includes('PAST_DATE') || msg.includes('pasado')) {
        setFormError('⚠️ No puedes agendar citas en el pasado. Por favor selecciona una fecha futura.');
      // FIX E6: Staff inactivo o inexistente
      } else if (msg.includes('INACTIVE_STAFF') || msg.includes('no está activo')) {
        setFormError('⚠️ La especialista seleccionada no está activa actualmente. Por favor elige otra.');
      } else if (msg.includes('INVALID_STAFF') || msg.includes('no existe')) {
        setFormError('⚠️ La especialista seleccionada ya no existe. Por favor recarga la página.');
      // STAFF_CONFLICT: El trigger de Supabase detectó solapamiento de horario
      } else if (msg.includes('STAFF_CONFLICT') || msg.includes('ya tiene una cita')) {
        setFormError('⚠️ La especialista ya tiene una cita en ese horario o se solaparía con otra. Por favor elige otro horario o una especialista diferente.');
      } else if (error.status === 409 || msg.includes('ocupado') || msg.includes('conflict')) {
        setFormError('⚠️ Este horario ya está ocupado. Por favor selecciona otro horario.');
      } else {
        setFormError(msg || 'Error al agendar la cita. Intenta de nuevo.');
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
        nuevo_estado: selectedAppointment.estado,
        staff_id: selectedAppointment.staff_id
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
    <div className={`space-y-4 overflow-x-hidden ${isFullScreen ? 'fixed inset-0 z-[100] bg-gray-50 dark:bg-dark-bg py-4 sm:p-6 pb-24 sm:pb-6 overflow-y-auto' : 'pb-24 sm:pb-4'}`}>
      {/* ─ HEADER ──────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-4 sm:px-0">
        <div className="min-w-0">
          {/* Móvil: solo día + fecha corta. Desktop: full title */}
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white truncate">
            <span className="sm:hidden">Agenda — {new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}</span>
            <span className="hidden sm:inline">Agenda — {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </h1>
          {loadError && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-0.5">
              <AlertCircle size={12} />{loadError}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="flex items-center justify-center h-11 w-11 rounded-2xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300 active:scale-95 transition-all"
            title={isFullScreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullScreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
          {/* Refresh: icon-only en móvil */}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center justify-center h-11 w-11 rounded-2xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {/* Botón Nueva Cita — visible solo en desktop */}
          <button
            onClick={() => {
              const d = new Date();
              setNewDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
              setIsNewApptModalOpen(true);
            }}
            className="hidden sm:flex items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 py-2.5 text-sm font-black text-white hover:bg-primary-dim active:scale-95 shadow-lg shadow-primary/20 transition-all min-h-[44px]"
          >
            <Plus size={20} />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* ── MÉTRICAS DEL DÍA — Strip compacto (sin DayCarousel/slots) ── */}
      <div className="mx-4 sm:mx-0 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-dark-border dark:bg-dark-card">
        <DailyMetricsBar
          appointments={appointments}
          allAppointments={appointments}
          selectedDate={new Date(quickBookDate + 'T00:00:00')}
          staff={staffList}
          businessHours={businessHours}
          closedDays={closedDays}
        />
      </div>

      {/* VIEW TOGGLE & TABS */}
      <div className="flex flex-col gap-3 px-4 sm:px-0">
        {/* ── View Type Toggle: 3 botones flex-1, caben en 390px ─ */}
        <div className="grid grid-cols-3 gap-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-2xl p-1">
          {([
            { view: 'list' as const, label: 'Lista', icon: <List size={15} /> },
            { view: 'monthly' as const, label: 'Mensual', icon: <Grid3X3 size={15} /> },
            { view: 'columns' as const, label: 'Staff', icon: <CalendarIcon size={15} /> },
          ] as const).map(({ view, label, icon }) => {
            const active = calendarViewType === view;
            return (
              <button
                key={view}
                onClick={() => {
                  setCalendarViewType(view);
                  localStorage.setItem('korat_calendar_view', view);
                }}
                className={`
                  flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold
                  transition-all duration-200 active:scale-95 min-h-[44px]
                  ${active
                    ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-md'
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                <span className={active ? 'text-primary' : ''}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* List View Tabs (Upcoming/History) */}
        {calendarViewType === 'list' && (
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('upcoming')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 ${viewMode === 'upcoming'
                ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30'
                : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-primary/40'
                }`}
            >
              <CalendarIcon size={15} />
              Próximas
              <span className={`rounded-full px-2 py-0 text-[11px] font-black ${viewMode === 'upcoming' ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}>
                {(() => {
                  const todayStart = new Date();
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
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 ${viewMode === 'history'
                ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg shadow-gray-900/20 dark:from-gray-600 dark:to-gray-800'
                : 'bg-white dark:bg-dark-card text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-dark-border hover:border-gray-400'
                }`}
            >
              <History size={15} />
              Historial
            </button>
          </div>
        )}
      </div>

      {/* STAFF FILTER TABS (only in monthly view) */}
      {calendarViewType === 'monthly' && (
        <div className="mx-4 sm:mx-0 rounded-2xl bg-white px-3 py-3 shadow-sm dark:bg-dark-card border border-gray-100 dark:border-dark-border overflow-hidden">
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
          appointments={appointments}
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
        <div className="mx-4 sm:mx-0 flex flex-col gap-3 rounded-xl bg-white p-3 shadow-sm sm:flex-row sm:items-center dark:bg-dark-card border border-gray-100 dark:border-dark-border">
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
        <div className="space-y-6 px-4 sm:px-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 dark:border-dark-border bg-white dark:bg-dark-card py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Cargando citas...</span>
            </div>
          ) : Object.keys(groupedAppointments).length > 0 ? (
            Object.keys(groupedAppointments).map(dateKey => {
              const label = getDateHeaderLabel(dateKey);
              const isTodayLabel = label === 'HOY';

              return (
                <div key={dateKey} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* DATE HEADER — sutil, estilo iOS */}
                  <div className="sticky top-0 z-10 flex items-center gap-2 py-1.5 bg-gray-50/95 dark:bg-dark-bg/95 backdrop-blur-sm mb-2">
                    <span className={`text-xs font-black tracking-widest uppercase px-2.5 py-1 rounded-lg ${isTodayLabel
                      ? 'bg-primary text-white'
                      : 'text-gray-500 dark:text-gray-400'
                      }`}>
                      {label}
                    </span>
                    <div className="h-px flex-1 bg-gray-200/80 dark:bg-gray-700/60" />
                  </div>

                  <div className="flex flex-col gap-2">
                    {groupedAppointments[dateKey].map((apt) => {
                      const shield = getClientShield(apt);
                      const fechaApt = apt.fecha || '';
                      const timePart = fechaApt ? getTimeInLima(fechaApt) : '--:--';
                      const assignedStaff = staffList.find(s => s.id === (apt as any).staff_id);
                      // Color accent per category
                      const catNorm = (apt.categoria || apt.servicio || '').toLowerCase();
                      let accentColor = '#a855f7';
                      if (catNorm.includes('mano') || catNorm.includes('una')) accentColor = '#ec4899';
                      else if (catNorm.includes('pie') || catNorm.includes('pedicura')) accentColor = '#f97316';
                      else if (catNorm.includes('pestana') || catNorm.includes('ceja')) accentColor = '#8b5cf6';
                      else if (catNorm.includes('rostro') || catNorm.includes('facial')) accentColor = '#10b981';
                      else if (catNorm.includes('cabello') || catNorm.includes('corte')) accentColor = '#3b82f6';

                      return (
                        <div
                          key={apt.id}
                          className="group relative flex items-stretch overflow-hidden rounded-2xl bg-white dark:bg-dark-card border border-gray-100 dark:border-dark-border transition-all hover:shadow-md active:scale-[0.99] cursor-pointer"
                          onClick={() => setSelectedAppointment(apt)}
                          style={{ borderLeft: `3px solid ${accentColor}` }}
                        >
                          {/* LEFT: TIME BLOCK */}
                          <div className="flex flex-col items-center justify-center px-2.5 py-3 min-w-[52px] border-r border-gray-100 dark:border-dark-border bg-gray-50/40 dark:bg-white/[0.02]">
                            <span className="text-lg font-black text-gray-900 dark:text-white tabular-nums leading-none">{timePart.split(':')[0]}</span>
                            <span className="text-[11px] font-bold text-gray-400 leading-none">{timePart.split(':')[1]}</span>
                            {apt.isAiGenerated && (
                              <span className="mt-1 flex items-center gap-0.5 rounded bg-purple-100 dark:bg-purple-900/40 px-1 py-0.5 text-[8px] font-black text-purple-700 dark:text-purple-300">
                                <Bot size={7} /> IA
                              </span>
                            )}
                          </div>

                          {/* CENTER: INFO */}
                          <div className="flex-1 px-3 py-2.5 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight flex-1 truncate">
                                {getDisplayName(apt)}
                              </h3>
                              {renderShield(shield)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1.5">
                              {apt.servicio}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {/* STATUS */}
                              <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${STATUS_COLORS[apt.estado]}`}>
                                {STATUS_LABELS[apt.estado] || apt.estado}
                              </span>
                              {/* STAFF */}
                              {assignedStaff ? (
                                <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                  👤 {assignedStaff.nombre.split(' ')[0]}
                                </span>
                              ) : (apt as any).categoria ? (
                                <span className="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                  ⚠️ Sin asignar
                                </span>
                              ) : null}
                              {/* QUICK ASSIGN */}
                              {!(apt as any).staff_id && (apt as any).categoria && staffList.length > 0 && (
                                <select
                                  className="text-[10px] rounded-lg border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg text-gray-700 dark:text-gray-300 px-1.5 py-0.5 cursor-pointer hover:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                                  defaultValue=""
                                  onClick={e => e.stopPropagation()}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const staffId = e.target.value ? parseInt(e.target.value) : null;
                                    handleQuickStaffAssign(apt.id, staffId);
                                  }}
                                >
                                  <option value="">Asignar...</option>
                                  {staffList.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>

                          {/* RIGHT: PRICE + ARROW */}
                          <div className="flex flex-col items-end justify-between px-3 py-2.5 min-w-[64px]">
                            <span className="text-sm font-black text-gray-900 dark:text-white whitespace-nowrap">
                              S/ {(apt.precio || 0).toFixed(0)}
                            </span>
                            <ChevronRight size={15} className="text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 py-16 text-center">
              <div className="mb-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No hay citas {viewMode === 'history' ? 'en el historial' : 'próximas'}</h3>
              <p className="text-sm text-gray-400 mt-1">Intenta ajustar los filtros o crear una nueva cita.</p>
            </div>
          )}
        </div>
      )}

      {/* --- NEW APPOINTMENT MODAL --- */}
      {isNewApptModalOpen && (() => {
        // ── Smart emoji map for category names ──────────────────────────────
        const getCatEmoji = (nombre: string, existingEmoji?: string): string => {
          if (existingEmoji && existingEmoji !== '📁') return existingEmoji;
          const n = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (n.includes('pestana') || n.includes('ceja') || n.includes('lash')) return '👁️';
          if (n.includes('mano') || n.includes('manicura') || n.includes('una')) return '💅';
          if (n.includes('pie') || n.includes('pedicura')) return '🦶';
          if (n.includes('rostro') || n.includes('facial') || n.includes('limpieza')) return '✨';
          if (n.includes('cabello') || n.includes('pelo') || n.includes('corte') || n.includes('tinte')) return '💇‍♀️';
          if (n.includes('masaje') || n.includes('spa') || n.includes('relaj')) return '💆‍♀️';
          if (n.includes('depilacion') || n.includes('cera')) return '🪒';
          if (n.includes('bronc') || n.includes('solar') || n.includes('bronceado')) return '☀️';
          if (n.includes('maquillaje') || n.includes('makeup')) return '💄';
          if (n.includes('multi')) return '🌟';
          return '💜';
        };

        const getCatColor = (nombre: string): { bg: string; border: string; text: string; activeBg: string; activeBorder: string; activeText: string } => {
          const n = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (n.includes('pestana') || n.includes('ceja') || n.includes('lash'))
            return { bg: 'bg-violet-50 dark:bg-violet-500/20', border: 'border-violet-200 dark:border-violet-500/30', text: 'text-violet-700 dark:text-violet-300', activeBg: 'bg-violet-500', activeBorder: 'border-violet-500', activeText: 'text-white' };
          if (n.includes('mano') || n.includes('manicura') || n.includes('una'))
            return { bg: 'bg-pink-50 dark:bg-pink-500/20', border: 'border-pink-200 dark:border-pink-500/30', text: 'text-pink-700 dark:text-pink-300', activeBg: 'bg-pink-500', activeBorder: 'border-pink-500', activeText: 'text-white' };
          if (n.includes('pie') || n.includes('pedicura'))
            return { bg: 'bg-teal-50 dark:bg-teal-500/20', border: 'border-teal-200 dark:border-teal-500/30', text: 'text-teal-700 dark:text-teal-300', activeBg: 'bg-teal-500', activeBorder: 'border-teal-500', activeText: 'text-white' };
          if (n.includes('rostro') || n.includes('facial'))
            return { bg: 'bg-amber-50 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-300', activeBg: 'bg-amber-500', activeBorder: 'border-amber-500', activeText: 'text-white' };
          if (n.includes('cabello') || n.includes('pelo') || n.includes('corte'))
            return { bg: 'bg-orange-50 dark:bg-orange-500/20', border: 'border-orange-200 dark:border-orange-500/30', text: 'text-orange-700 dark:text-orange-300', activeBg: 'bg-orange-500', activeBorder: 'border-orange-500', activeText: 'text-white' };
          if (n.includes('masaje') || n.includes('spa'))
            return { bg: 'bg-blue-50 dark:bg-blue-500/20', border: 'border-blue-200 dark:border-blue-500/30', text: 'text-blue-700 dark:text-blue-300', activeBg: 'bg-blue-500', activeBorder: 'border-blue-500', activeText: 'text-white' };
          return { bg: 'bg-purple-50 dark:bg-purple-500/20', border: 'border-purple-200 dark:border-purple-500/30', text: 'text-purple-700 dark:text-purple-300', activeBg: 'bg-purple-500', activeBorder: 'border-purple-500', activeText: 'text-white' };
        };

        // ── Staff initials avatar color ──────────────────────────────────────
        const getStaffColor = (idx: number): string => {
          const colors = ['bg-violet-500', 'bg-pink-500', 'bg-teal-500', 'bg-amber-500', 'bg-blue-500', 'bg-orange-500', 'bg-emerald-500', 'bg-rose-500'];
          return colors[idx % colors.length];
        };

        const filteredStaff = staffList.filter(s => {
          if (!formCategoria) return true;
          const staffCat = (s.cat_staff || s.especialidad || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          const catFilter = formCategoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          return staffCat === catFilter || staffCat === 'multi';
        });

        const filteredServices = services.filter(s => {
          if (!formCategoria) return true;
          const filterCat = formCategoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          const sCat = (s.categoria || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

          // If the service has an explicit categoria set, match STRICTLY — 'multi' only shows when no filter
          if (sCat) {
            return sCat === filterCat;
          }

          // Only use keyword inference when the service has NO categoria field at all
          const name = (s.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          if (filterCat.includes('pestana')) return name.includes('pestana') || name.includes('cejas') || name.includes('extensiones') || name.includes('lifting') || name.includes('volumen') || name.includes('wispy') || name.includes('rimel') || name.includes('fox');
          if (filterCat.includes('mano') || filterCat.includes('unas')) return name.includes('mano') || name.includes('manicura') || name.includes('una') || name.includes('gel') || name.includes('acril') || name.includes('esmalt') || name.includes('rubber');
          if (filterCat.includes('pie') || filterCat.includes('pedicura')) return name.includes('pedicura') || name.includes('callo') || (name.includes('pie') && !name.includes('piel'));
          if (filterCat.includes('rostro') || filterCat.includes('facial')) return name.includes('rostro') || name.includes('facial') || name.includes('hidra');
          if (filterCat.includes('cabello') || filterCat.includes('peluqueria')) return name.includes('cabello') || name.includes('corte') || name.includes('tinte') || name.includes('mechas') || name.includes('botox') || name.includes('keratina') || name.includes('cauterizacion');
          return false;
        });

        const hoy = new Date();
        const manana = new Date(); manana.setDate(manana.getDate() + 1);
        const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        const mananaStr = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;

        return (
          <div
            className={`fixed inset-0 z-[70] flex justify-center bg-black/60 backdrop-blur-sm ${formSuccess ? 'items-center' : 'items-end sm:items-center'}`}
            style={{ animation: 'fadeInOverlay 0.2s ease-out' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setIsNewApptModalOpen(false); setFormError(null); setFormSuccess(null); } }}
          >
            <style>{`
              @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
              @keyframes slideUpModal { from { opacity: 0; transform: translateY(40px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
              @keyframes fadeInField { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
              .modal-slide-up { animation: slideUpModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
              .field-fade-in { animation: fadeInField 0.25s ease-out both; }
              .cat-card { transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1); }
              .cat-card:hover:not(.cat-active) { transform: translateY(-2px) scale(1.02); }
              .cat-card.cat-active { transform: scale(1.03); }
              .staff-card { transition: all 0.18s cubic-bezier(0.34, 1.56, 0.64, 1); }
              .staff-card:hover:not(.staff-active) { transform: translateY(-1px); }
              .staff-card.staff-active { box-shadow: 0 4px 14px -2px rgba(139,92,246,0.35); }
            `}</style>

            <div className="modal-slide-up w-full sm:max-w-md bg-white dark:bg-dark-card rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">

              {/* ── Header ─────────────────────────────────────────────────── */}
              <div className={`relative flex-shrink-0 px-5 pt-5 pb-4 transition-colors duration-500 ${formSuccess ? 'bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/30 dark:to-emerald-900/30' : 'bg-gradient-to-r from-primary/10 via-accent/5 to-transparent dark:from-primary/20 dark:via-accent/10'}`}>
                {/* Drag handle (mobile) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-gray-300 dark:bg-gray-600 sm:hidden" />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg transition-colors duration-500 ${formSuccess ? 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-green-500/30' : 'bg-gradient-to-br from-primary to-accent shadow-primary/30'}`}>
                      {formSuccess ? <Sparkles size={20} className="text-white animate-pulse" /> : <CalendarClock size={20} className="text-white" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {formSuccess ? '¡Cita Agendada!' : 'Nueva Cita'}
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formSuccess ? 'La cita se guardó exitosamente.' : 'Completa los datos para agendar'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setIsNewApptModalOpen(false); setFormError(null); setFormSuccess(null); }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:bg-dark-bg dark:text-gray-400 dark:hover:bg-dark-border transition-all active:scale-90"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* ── Scrollable body ─────────────────────────────────────────── */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-2 pt-4">

                {/* Alerts */}
                {formError && (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm animate-shake field-fade-in">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div><strong className="block font-bold text-xs uppercase tracking-wide mb-0.5">Error</strong><p className="text-xs font-medium leading-relaxed">{formError}</p></div>
                  </div>
                )}

                {/* Hide entire form on success to show clean state */}
                {!formSuccess && (
                  <form onSubmit={handleNewApptSubmit} className="space-y-5 animate-fade-in" id="nueva-cita-form">

                    {/* ── Cliente ──────────────────────────────────────────── */}
                    <div className="field-fade-in" style={{ animationDelay: '0.05s' }}>
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span className="text-base">👤</span> Cliente <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          disabled={isSubmitting}
                          value={formClient}
                          onChange={(e) => { setFormClient(e.target.value); setFormError(null); }}
                          className="w-full appearance-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-800 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:focus:border-primary dark:focus:bg-dark-card disabled:opacity-50"
                        >
                          <option value="">Seleccionar cliente...</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}{c.telefono ? ` · ${c.telefono}` : ''}</option>
                          ))}
                        </select>
                        <ChevronRight size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                      {/* Risk alert */}
                      {formClient && (() => {
                        const cId = parseInt(formClient);
                        const clientFound = clients.find(c => c.id === cId);
                        if (!clientFound) return null;
                        const tempApt = { cliente_id: cId, nombre_cliente: clientFound.nombre } as Appointment;
                        const shield = getClientShield(tempApt);
                        if (shield.level === 'Low') {
                          return (
                            <div className="mt-2.5 flex gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:bg-rose-900/20 dark:border-rose-900/40 field-fade-in">
                              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                              <div>
                                <strong className="block text-xs font-bold text-rose-700 dark:text-rose-400">⚠️ Alerta de riesgo</strong>
                                <p className="mt-0.5 text-xs text-rose-600 dark:text-rose-300 leading-relaxed">Historial de inasistencias. Solicitar <span className="font-bold">depósito del 50%</span>.</p>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>

                    {/* ── Categoría — Card Grid ─────────────────────────────── */}
                    <div className="field-fade-in" style={{ animationDelay: '0.1s' }}>
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span className="text-base">🏷️</span> Categoría <span className="text-red-400">*</span>
                      </label>
                      {categoriasList.filter(c => c.activo).length === 0 ? (
                        <p className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-border p-4 text-center text-xs text-gray-400">Sin categorías configuradas</p>
                      ) : (
                        <div className={`grid gap-2 ${categoriasList.filter(c => c.activo).length <= 3 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4'}`}>
                          {categoriasList.filter(c => c.activo).map(c => {
                            const val = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                            const isActive = formCategoria === val;
                            const colors = getCatColor(c.nombre);
                            const emoji = getCatEmoji(c.nombre, c.emoji);
                            return (
                              <button
                                key={c.id}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => { setFormCategoria(isActive ? '' : val); setFormStaffId(''); }}
                                className={`cat-card ${isActive ? 'cat-active' : ''} flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-shadow disabled:opacity-50 ${isActive
                                  ? `${colors.activeBg} ${colors.activeBorder} shadow-lg`
                                  : `${colors.bg} ${colors.border} hover:shadow-md`
                                  }`}
                              >
                                <span className="text-2xl leading-none">{emoji}</span>
                                <span className={`text-[10px] font-bold leading-tight ${isActive ? colors.activeText : colors.text}`}>
                                  {c.nombre}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {/* Hidden required input for form validation */}
                      <input type="text" required value={formCategoria} onChange={() => { }} className="sr-only" tabIndex={-1} aria-hidden="true" />
                    </div>

                    {/* ── Staff — Avatar Cards ──────────────────────────────── */}
                    {(filteredStaff.length > 0 || !formCategoria) && (
                      <div className="field-fade-in" style={{ animationDelay: '0.15s' }}>
                        <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          <span className="text-base">✂️</span> Especialista <span className="text-gray-400 font-normal normal-case tracking-normal">(opcional)</span>
                        </label>
                        <div className="flex gap-2 overflow-x-auto py-2 px-0.5 scrollbar-hide">
                          {/* "Sin asignar" option */}
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setFormStaffId('')}
                            className={`staff-card ${!formStaffId ? 'staff-active' : ''} flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 min-w-[72px] transition-shadow disabled:opacity-50 ${!formStaffId
                              ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                              : 'border-gray-200 bg-gray-50 dark:border-dark-border dark:bg-dark-bg hover:shadow-sm'
                              }`}
                          >
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center text-lg ${!formStaffId ? 'bg-primary/20' : 'bg-gray-200 dark:bg-dark-border'}`}>
                              🎲
                            </div>
                            <span className={`text-[10px] font-bold leading-tight text-center ${!formStaffId ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                              Cualquiera
                            </span>
                          </button>
                          {filteredStaff.map((s, idx) => {
                            const isActive = formStaffId === String(s.id);
                            const initials = s.nombre.split(' ').map((w: string) => w[0]).join('').substring(0, 2).toUpperCase();
                            const avatarColor = getStaffColor(idx);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => setFormStaffId(isActive ? '' : String(s.id))}
                                className={`staff-card ${isActive ? 'staff-active' : ''} flex-shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 min-w-[72px] transition-shadow disabled:opacity-50 ${isActive
                                  ? 'border-primary bg-primary/10 shadow-md shadow-primary/20'
                                  : 'border-gray-200 bg-gray-50 dark:border-dark-border dark:bg-dark-bg hover:shadow-sm'
                                  }`}
                              >
                                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white ${avatarColor} ${isActive ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-dark-card' : ''}`}>
                                  {initials}
                                </div>
                                <span className={`text-[10px] font-bold leading-tight text-center max-w-[60px] truncate ${isActive ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}>
                                  {s.nombre.split(' ')[0]}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ── Servicio ─────────────────────────────────────────── */}
                    <div className="field-fade-in" style={{ animationDelay: '0.2s' }}>
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span className="text-base">💎</span> Servicio <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          required
                          disabled={isSubmitting}
                          value={formService}
                          onChange={(e) => { setFormService(e.target.value); setFormError(null); }}
                          className="w-full appearance-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm font-medium text-gray-800 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:focus:border-primary dark:focus:bg-dark-card disabled:opacity-50"
                        >
                          <option value="">Seleccionar servicio...</option>
                          {filteredServices.map(s => (
                            <option key={s.id} value={s.name}>
                              {s.name} — S/ {typeof s.price === 'number' ? s.price.toFixed(2) : s.price}
                            </option>
                          ))}
                        </select>
                        <ChevronRight size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 rotate-90 text-gray-400" />
                      </div>
                    </div>

                    {/* ── Fecha & Hora ─────────────────────────────────────── */}
                    <div className="field-fade-in" style={{ animationDelay: '0.25s' }}>
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span className="text-base">📅</span> Fecha y Hora <span className="text-red-400">*</span>
                      </label>
                      {/* Quick date chips */}
                      <div className="flex gap-2 mb-3">
                        {[
                          { label: '🌅 Hoy', val: hoyStr },
                          { label: '🌄 Mañana', val: mananaStr },
                        ].map(({ label, val }) => (
                          <button
                            key={val}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => { setNewDate(val); setFormError(null); }}
                            className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 ${newDate === val
                              ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md shadow-primary/30'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-bg dark:text-gray-300 dark:hover:bg-dark-border'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          required
                          disabled={isSubmitting}
                          value={newDate}
                          onChange={(e) => { setNewDate(e.target.value); setFormError(null); }}
                          className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:focus:border-primary dark:focus:bg-dark-card disabled:opacity-50"
                        />
                        <input
                          type="time"
                          required
                          disabled={isSubmitting}
                          value={newTime}
                          onChange={(e) => { setNewTime(e.target.value); setFormError(null); }}
                          className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:focus:border-primary dark:focus:bg-dark-card disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* ── Notas ────────────────────────────────────────────── */}
                    <div className="field-fade-in" style={{ animationDelay: '0.3s' }}>
                      <label className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        <span className="text-base">📝</span> Notas <span className="text-gray-400 font-normal normal-case tracking-normal">(opcional)</span>
                      </label>
                      <textarea
                        disabled={isSubmitting}
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        placeholder="Ej: Alérgica a ciertos productos, viene con su hija, preferencias especiales..."
                        rows={2}
                        className="w-full resize-none rounded-2xl border-2 border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 transition-all focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 dark:border-dark-border dark:bg-dark-bg dark:text-white dark:placeholder-gray-600 dark:focus:border-primary dark:focus:bg-dark-card disabled:opacity-50"
                      />
                    </div>

                    {/* Spacer for footer */}
                    <div className="h-1" />
                  </form>
                )}
              </div>

              {/* ── Footer ─────────────────────────────────────────────────── */}
              <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-white/10 bg-white dark:bg-dark-card mt-auto z-10">
                <div className="flex gap-3">
                  {!formSuccess && (
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => { setIsNewApptModalOpen(false); setFormError(null); setFormSuccess(null); }}
                      className="flex-1 rounded-2xl border-2 border-gray-200 bg-transparent py-3 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 active:scale-95 dark:border-dark-border dark:text-gray-300 dark:hover:bg-dark-bg disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type={formSuccess ? "button" : "submit"}
                    form={formSuccess ? undefined : "nueva-cita-form"}
                    disabled={isSubmitting}
                    onClick={formSuccess ? () => { setIsNewApptModalOpen(false); setFormError(null); setFormSuccess(null); } : undefined}
                    className={`flex-[2] flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-white transition-all hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${formSuccess
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 hover:shadow-green-500/40'
                      : 'bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:opacity-95'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Agendando...</span>
                      </>
                    ) : formSuccess ? (
                      <>
                        <Sparkles size={16} />
                        <span>¡Listo!</span>
                      </>
                    ) : (
                      <>
                        <CalendarClock size={16} />
                        <span>Confirmar Cita</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* --- DETAILS MODAL: Bottom Sheet en mobile, centered en desktop --- */}
      {
        selectedAppointment && (
          <div
            className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => { setSelectedAppointment(null); setIsRescheduling(false); setRescheduleDate(''); setRescheduleTime(''); }}
          >
            <div
              className="w-full sm:max-w-lg overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl dark:bg-dark-card animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Handle bar — solo visible en mobile */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
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
                    {/* STAFF INFO */}
                    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-dark-border dark:bg-dark-bg col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <User size={16} className="text-blue-500" />
                        <span className="text-xs font-bold text-gray-500">STAFF ASIGNADO</span>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {selectedAppointment.staff_id
                          ? staffList.find(s => s.id === selectedAppointment.staff_id)?.nombre || 'Desconocido'
                          : 'Sin Asignar'}
                      </p>
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
                            {client && renderShield(shield)}
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

      {/* ── FAB "Nueva Cita" — solo visible en mobile, sobre el BottomNavBar ── */}
      <button
        onClick={() => {
          const d = new Date();
          setNewDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
          setIsNewApptModalOpen(true);
        }}
        className="sm:hidden fixed z-[60] flex items-center justify-center w-14 h-14 rounded-full text-white active:scale-95 transition-all"
        style={{
          bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          right: '16px',
          background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
          boxShadow: '0 8px 24px rgba(124,58,237,0.5), 0 2px 8px rgba(79,70,229,0.3)',
        }}
        aria-label="Nueva Cita"
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default CalendarPage;
