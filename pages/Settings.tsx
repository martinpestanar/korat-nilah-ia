
import React, { useState, useEffect } from 'react';
import {
  ToggleLeft, ToggleRight, Save, ShieldAlert, Plus, Trash2, X, Clock, DollarSign,
  Sparkles, Users, Bot, Bell, Crown, CreditCard, Settings2, MessageCircle,
  CheckCircle2, AlertCircle, User, Building2, Palette, Calendar, AlertTriangle, Loader2, Check, Pencil
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { Link } from 'react-router-dom';
import { ServiceItem, StaffPermissions, DEFAULT_STAFF_PERMISSIONS, ClosedDay, CategoriaCalendario } from '../types';
import { diasCerrados, servicios, preciosExtras, equipo, negocioInfo, categoriasCalendario, negocios } from '../services/api';

// Types for staff management
interface StaffMember {
  id: number;
  name: string;
  email: string;
  role: 'Staff';
  isActive: boolean;
  permissions: StaffPermissions;
}

// Tabs for settings page
type SettingsTab = 'general' | 'closedDays' | 'staff' | 'services' | 'subscription' | 'chatbot';

const SettingsPage: React.FC = () => {
  // Services from API (not DataContext)
  interface ServiceDB {
    id: number;
    nombre: string;
    categoria: string;
    precio: number;
    duracion_min: number;
    tags?: string;
  }
  const [servicesFromDB, setServicesFromDB] = useState<ServiceDB[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Service editing state - stores pending changes per service
  const [editingService, setEditingService] = useState<{ id: number; changes: Partial<ServiceDB> } | null>(null);

  const { user, isAdmin, isPro } = useAuth();
  // ✅ Hook para refrescar datos después de operaciones CRUD
  const { refresh: refreshDashboard } = useDashboardData();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Chatbot settings
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotPersonality, setChatbotPersonality] = useState<'formal' | 'casual' | 'friendly'>('friendly');
  const [chatbotWelcomeMessage, setChatbotWelcomeMessage] = useState('¡Hola! 👋 Soy Nilah, tu asistente virtual. ¿En qué puedo ayudarte hoy?');
  const [chatbotHours, setChatbotHours] = useState<'24/7' | 'business'>('24/7');

  // Load Bot Config (Kill Switch)
  useEffect(() => {
    const loadBotConfig = async () => {
      try {
        const data = await negocios.get();
        // data es un array, tomamos el primero o el único
        const config = data[0]?.bot_config || {};
        if (config.bot_enabled !== undefined) {
          setChatbotEnabled(config.bot_enabled);
        }
      } catch (error) {
        console.error('Error cargando config bot:', error);
      }
    };
    if (isAdmin) loadBotConfig();
  }, [isAdmin]);

  const handleToggleBot = async () => {
    const newState = !chatbotEnabled;
    setChatbotEnabled(newState);
    setSaveStatus('saving');
    try {
      await negocios.updateBotConfig({ bot_enabled: newState });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error actualizando bot:', error);
      setChatbotEnabled(!newState); // Revertir
      alert('Error al actualizar estado del bot');
      setSaveStatus('idle');
    }
  };

  // Staff management - API connected
  interface StaffDB {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    activo: boolean;
    telefono?: string;
    permisos?: Record<string, boolean>;
    especialidad?: string;
    sub_especialidad?: string;
    color?: string;
    cat_staff?: string; // Categoría de staff: manos, pies, pestanas, rostro, cabello
    horario_trabajo?: { inicio: string; fin: string }; // Horario laboral individual
  }
  const [staffFromDB, setStaffFromDB] = useState<StaffDB[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ nombre: '', email: '', telefono: '', rol: 'Staff', cat_staff: '', sub_especialidad: '', color: '#6366f1' });
  const [editingStaff, setEditingStaff] = useState<StaffDB | null>(null);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);

  // --- Categorías Calendario State ---
  const [categoriasData, setCategoriasData] = useState<CategoriaCalendario[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [isEditCatModalOpen, setIsEditCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoriaCalendario | null>(null);
  const [catFormData, setCatFormData] = useState({ nombre: '', emoji: '📁', descripcion: '', activo: true });
  const [staffSubTab, setStaffSubTab] = useState<'miembros' | 'categorias'>('miembros');
  const [editStaffData, setEditStaffData] = useState({ nombre: '', email: '', telefono: '', rol: 'Staff', cat_staff: '', sub_especialidad: '', color: '#6366f1', especialidad: 'multi' });

  // Service modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newService, setNewService] = useState<Partial<ServiceItem>>({
    name: '',
    durationMin: 30,
    price: 0
  });

  // Pagination for services
  const SERVICES_PER_PAGE = 7;
  const [servicesCurrentPage, setServicesCurrentPage] = useState(1);
  const servicesTotalPages = Math.ceil(servicesFromDB.length / SERVICES_PER_PAGE);
  const paginatedServices = servicesFromDB.slice(
    (servicesCurrentPage - 1) * SERVICES_PER_PAGE,
    servicesCurrentPage * SERVICES_PER_PAGE
  );

  // Load services from API
  const loadServicesFromAPI = async () => {
    setLoadingServices(true);
    try {
      const data = await servicios.getAll();
      setServicesFromDB(data as ServiceDB[]);
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setLoadingServices(false);
    }
  };

  // Notification settings
  const [notifications, setNotifications] = useState({
    reminder24h: true,
    reminder1h: true,
    newAppointmentEmail: true,
    newAppointmentWhatsApp: false,
    clientAtRisk: true,
  });

  // Business Info (negocio_info table)
  interface NegocioInfoItem {
    id: number;
    clave: string;
    valor_texto: string;
    valor_img?: string;
    valor_video?: string;
    descripcion: string;
  }
  const [negocioData, setNegocioData] = useState<Record<string, string>>({});
  const [loadingNegocio, setLoadingNegocio] = useState(false);
  const [savingNegocio, setSavingNegocio] = useState(false);
  const [unsavedNegocioChanges, setUnsavedNegocioChanges] = useState<Set<string>>(new Set());
  // ✅ Trackear las claves que YA EXISTEN en la BD (para distinguir POST vs PUT)
  const [existingNegocioKeys, setExistingNegocioKeys] = useState<Set<string>>(new Set());

  // State para inputs de horario (desacoplado de negocioData para formato UI vs DB)
  const [scheduleState, setScheduleState] = useState({
    weekdays: { start: '09:00', end: '20:00', closed: false },
    saturday: { start: '09:00', end: '14:00', closed: false },
    sunday: { start: '', end: '', closed: true },
    lunch: { start: '13:00', end: '14:00', closed: false }, // ✅ Nuevo estado para almuerzo
  });

  // Helper: Parsear string "9am - 8pm" a { start: "09:00", end: "20:00" }
  const parseScheduleString = (str: string) => {
    if (!str || str === 'CERRADO') return { start: '', end: '', closed: true };
    try {
      // Formato esperado: "9am - 8pm" o "9:30am - 8:30pm"
      const [startStr, endStr] = str.split('-').map(s => s.trim());

      const parseTime = (t: string) => {
        if (!t) return '';
        const match = t.match(/(\d+)(?::(\d+))?(am|pm)/i);
        if (!match) return '';
        let h = parseInt(match[1]);
        const m = match[2] || '00';
        const ampm = match[3].toLowerCase();

        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;

        return `${h.toString().padStart(2, '0')}:${m}`;
      };

      return { start: parseTime(startStr), end: parseTime(endStr), closed: false };
    } catch (e) {
      return { start: '', end: '', closed: true };
    }
  };

  // Helper: Formatear { start: "09:00", end: "20:00" } a "9am - 8pm"
  const formatScheduleString = (start: string, end: string) => {
    if (!start || !end) return 'CERRADO'; // Si falta hora, asumimos cerrado o incompleto

    const formatTime = (time: string) => {
      const [h, m] = time.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'pm' : 'am';
      const hour12 = hour % 12 || 12;
      return m === '00' ? `${hour12}${ampm}` : `${hour12}:${m}${ampm}`;
    };

    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Payment methods available
  const PAYMENT_METHODS = [
    { id: 'efectivo', label: '💵 Efectivo', icon: '💵' },
    { id: 'yape', label: '📱 Yape', icon: '📱' },
    { id: 'plin', label: '📲 Plin', icon: '📲' },
    { id: 'tarjeta', label: '💳 Tarjeta', icon: '💳' },
    { id: 'transferencia', label: '🏦 Transferencia', icon: '🏦' },
  ];

  // Save status for feedback
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Días cerrados (Interruptor Maestro)
  const [closedDays, setClosedDays] = useState<ClosedDay[]>([]);
  const [loadingClosedDays, setLoadingClosedDays] = useState(false);
  const [newClosedDay, setNewClosedDay] = useState({
    fecha: '',
    motivo: '',
    mensaje_chatbot: '',
    es_dia_completo: true,
    hora_inicio: '09:00',
    hora_fin: '13:00'
  });
  const [isAddingClosedDay, setIsAddingClosedDay] = useState(false);
  const [closingToday, setClosingToday] = useState(false);
  const [showClosedDayModal, setShowClosedDayModal] = useState(false);

  // Precios Extras (Cotización Nail Art)
  interface PrecioExtra {
    id: number;
    categoria: string;
    nombre: string;
    etiqueta: string;
    precio: number;
    descripcion?: string;
    orden?: number;
  }
  const [preciosExtrasList, setPreciosExtrasList] = useState<PrecioExtra[]>([]);
  const [loadingPreciosExtras, setLoadingPreciosExtras] = useState(false);
  const [showPrecioExtraModal, setShowPrecioExtraModal] = useState(false);
  const [editingPrecioExtra, setEditingPrecioExtra] = useState<PrecioExtra | null>(null);
  const [newPrecioExtra, setNewPrecioExtra] = useState({
    categoria: 'largo',
    nombre: '',
    etiqueta: '',
    precio: 0,
    descripcion: ''
  });

  // --- HANDLERS SERVICES ---
  // Acumula cambios localmente sin guardar en BD
  const handleServiceFieldChange = (id: number, field: string, value: string | number) => {
    const fieldMap: Record<string, string> = {
      name: 'nombre',
      durationMin: 'duracion_min',
      price: 'precio'
    };
    const dbField = fieldMap[field] || field;

    setEditingService(prev => {
      if (prev && prev.id === id) {
        return { id, changes: { ...prev.changes, [dbField]: value } };
      }
      return { id, changes: { [dbField]: value } };
    });
  };

  // Guardar cambios en BD
  const handleSaveServiceChanges = async () => {
    if (!editingService) return;

    try {
      await servicios.update(editingService.id, editingService.changes);
      // Update local state
      setServicesFromDB(prev => prev.map(s =>
        s.id === editingService.id ? { ...s, ...editingService.changes } : s
      ));
      setEditingService(null);
      showSaveStatus();
      // ✅ Refrescar dashboard
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error actualizando servicio:', error);
      alert('Error al guardar cambios.');
    }
  };

  // Cancelar edición
  const handleCancelServiceEdit = () => {
    setEditingService(null);
  };

  const handleServiceDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      await servicios.delete(id);
      setServicesFromDB(prev => prev.filter(s => s.id !== id));
      showSaveStatus();
      // ✅ Refrescar dashboard
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      alert('Error al eliminar el servicio.');
    }
  };

  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || newService.price === undefined || !newService.durationMin) return;

    try {
      const created = await servicios.create({
        nombre: newService.name,
        precio: Number(newService.price),
        duracion_min: Number(newService.durationMin),
        categoria: 'General',
        tags: ''
      });
      // Reload to get the new ID from DB
      await loadServicesFromAPI();
      setIsServiceModalOpen(false);
      setNewService({ name: '', durationMin: 30, price: 0 });
      showSaveStatus();
      // ✅ Refrescar dashboard
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error creando servicio:', error);
      alert('Error al crear el servicio.');
    }
  };

  // --- HANDLERS STAFF ---
  const loadStaffFromAPI = async () => {
    setLoadingStaff(true);
    try {
      const data = await equipo.getAll();
      setStaffFromDB(data as StaffDB[]);
    } catch (error) {
      console.error('Error cargando equipo:', error);
    } finally {
      setLoadingStaff(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.nombre || !newStaff.email) return;

    try {
      await equipo.create({
        nombre: newStaff.nombre,
        email: newStaff.email,
        telefono: newStaff.telefono || '',
        rol: newStaff.rol,
        activo: true,
        permisos: DEFAULT_STAFF_PERMISSIONS,
        cat_staff: newStaff.cat_staff || '',
        sub_especialidad: newStaff.sub_especialidad || '',
        color: newStaff.color || '#6366f1'
      } as any);
      await loadStaffFromAPI();
      setIsAddStaffModalOpen(false);
      setNewStaff({ nombre: '', email: '', telefono: '', rol: 'Staff', cat_staff: '', sub_especialidad: '', color: '#6366f1' });
      showSaveStatus();
      // ✅ Refrescar dashboard
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error creando staff:', error);
      alert('Error al agregar miembro del equipo.');
    }
  };

  const handleStaffActiveToggle = async (staffId: number) => {
    const staff = staffFromDB.find(s => s.id === staffId);
    if (!staff) return;

    try {
      await equipo.toggleActive(staffId, !staff.activo);
      setStaffFromDB(prev => prev.map(s =>
        s.id === staffId ? { ...s, activo: !s.activo } : s
      ));
      showSaveStatus();
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este miembro del equipo?')) return;

    try {
      await equipo.delete(staffId);
      setStaffFromDB(prev => prev.filter(s => s.id !== staffId));
      showSaveStatus();
      // ✅ Refrescar dashboard
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error eliminando staff:', error);
      alert('Error al eliminar miembro del equipo.');
    }
  };

  const handleOpenEditStaff = (staff: StaffDB) => {
    setEditingStaff(staff);
    setEditStaffData({
      nombre: staff.nombre || '',
      email: staff.email || '',
      telefono: staff.telefono || '',
      rol: staff.rol || 'Staff',
      cat_staff: staff.cat_staff || '',
      sub_especialidad: staff.sub_especialidad || '',
      color: staff.color || '#6366f1',
      especialidad: staff.especialidad || 'multi'
    });
    setIsEditStaffModalOpen(true);
  };

  const handleUpdateStaff = async () => {
    if (!editingStaff || !editStaffData.nombre) return;

    try {
      await equipo.update(editingStaff.id, {
        nombre: editStaffData.nombre,
        email: editStaffData.email,
        telefono: editStaffData.telefono || '',
        rol: editStaffData.rol,
        cat_staff: editStaffData.cat_staff || '',
        sub_especialidad: editStaffData.sub_especialidad || '',
        color: editStaffData.color || '#6366f1',
        especialidad: editStaffData.especialidad || 'multi'
      } as any);
      await loadStaffFromAPI();
      setIsEditStaffModalOpen(false);
      setEditingStaff(null);
      showSaveStatus();
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error actualizando staff:', error);
      alert('Error al actualizar miembro del equipo.');
    }
  };

  // ═══════════════════ CATEGORÍAS CALENDARIO HANDLERS ═══════════════════

  const loadCategoriasCalendario = async () => {
    setLoadingCategorias(true);
    try {
      const data = await categoriasCalendario.getAll();
      setCategoriasData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const handleAddCat = async () => {
    if (!catFormData.nombre) return;
    try {
      await categoriasCalendario.create(catFormData);
      await loadCategoriasCalendario();
      setIsAddCatModalOpen(false);
      setCatFormData({ nombre: '', emoji: '📁', descripcion: '', activo: true });
      showSaveStatus();
    } catch (error) {
      console.error('Error creando categoría:', error);
      alert('Error al crear categoría.');
    }
  };

  const handleOpenEditCat = (cat: CategoriaCalendario) => {
    setEditingCat(cat);
    setCatFormData({
      nombre: cat.nombre || '',
      emoji: cat.emoji || '📁',
      descripcion: cat.descripcion || '',
      activo: cat.activo ?? true
    });
    setIsEditCatModalOpen(true);
  };

  const handleUpdateCat = async () => {
    if (!editingCat || !catFormData.nombre) return;
    try {
      await categoriasCalendario.update(editingCat.id, catFormData);
      await loadCategoriasCalendario();
      setIsEditCatModalOpen(false);
      setEditingCat(null);
      showSaveStatus();
    } catch (error) {
      console.error('Error actualizando categoría:', error);
      alert('Error al actualizar categoría.');
    }
  };

  const handleDeleteCat = async (id: number) => {
    if (!window.confirm('¿Eliminar esta categoría? Staff vinculado a ella deberá reasignarse.')) return;
    try {
      await categoriasCalendario.delete(id);
      await loadCategoriasCalendario();
      showSaveStatus();
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert('Error al eliminar categoría.');
    }
  };

  const showSaveStatus = () => {
    setSaveStatus('saving');
    setTimeout(() => setSaveStatus('saved'), 500);
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  // --- HANDLERS NEGOCIO INFO ---
  const loadNegocioInfo = async () => {
    setLoadingNegocio(true);
    try {
      const data = await negocioInfo.getAll();
      console.log('📋 Datos recibidos de negocio_info:', data);
      // Convert array to object keyed by 'clave'
      const dataMap: Record<string, string> = {};
      const keysFromDB = new Set<string>();

      (data as NegocioInfoItem[]).forEach((item: NegocioInfoItem) => {
        dataMap[item.clave] = item.valor_texto || '';
        keysFromDB.add(item.clave); // ✅ Guardar clave como existente en BD
      });

      console.log('📋 Datos mapeados:', dataMap);

      setNegocioData(dataMap);
      setExistingNegocioKeys(keysFromDB);
      setUnsavedNegocioChanges(new Set());

      // ✅ Populate scheduleState from new keys (or fallback)
      const weekdays = dataMap['horario_semana']
        ? parseScheduleString(dataMap['horario_semana'])
        : (dataMap['hora_apertura'] ? { start: dataMap['hora_apertura'], end: dataMap['hora_cierre'], closed: false } : scheduleState.weekdays);

      const saturday = dataMap['horario_sabado']
        ? parseScheduleString(dataMap['horario_sabado'])
        : (keysFromDB.has('hora_apertura_sabado') ? {
          start: dataMap['hora_apertura_sabado'],
          end: dataMap['hora_cierre_sabado'],
          closed: dataMap['hora_apertura_sabado'] === 'CERRADO'
        } : scheduleState.saturday);

      const sunday = dataMap['horario_domingo']
        ? parseScheduleString(dataMap['horario_domingo'])
        : (keysFromDB.has('hora_apertura_domingo') ? {
          start: dataMap['hora_apertura_domingo'],
          end: dataMap['hora_cierre_domingo'],
          closed: dataMap['hora_apertura_domingo'] === 'CERRADO'
        } : scheduleState.sunday);

      const lunch = dataMap['hora_almuerzo']
        ? parseScheduleString(dataMap['hora_almuerzo'])
        : scheduleState.lunch;

      // @ts-ignore
      setScheduleState({ weekdays, saturday, sunday, lunch });
    } catch (error) {
      console.error('Error cargando info del negocio:', error);
      // alert('Error al cargar información del negocio'); // Silent fail better for initial load or console only
    } finally {
      setLoadingNegocio(false);
    }
  };

  const handleNegocioFieldChange = (clave: string, valor: string) => {
    setNegocioData(prev => ({ ...prev, [clave]: valor }));
    setUnsavedNegocioChanges(prev => new Set(prev).add(clave));
  };

  // Handler específico para cambios en horarios UI (no guarda en DB todavía, solo state local UI)
  const handleScheduleChange = (day: 'weekdays' | 'saturday' | 'sunday', field: 'start' | 'end' | 'closed', value: any) => {
    setScheduleState(prev => {
      const newState = { ...prev, [day]: { ...prev[day], [field]: value } };

      // Calcular string para DB
      const dayData = newState[day];
      const dbValue = dayData.closed ? 'CERRADO' : formatScheduleString(dayData.start, dayData.end);

      // Mapear al campo DB correcto
      const dbKey = day === 'weekdays' ? 'horario_semana'
        : day === 'saturday' ? 'horario_sabado'
          : day === 'sunday' ? 'horario_domingo'
            : 'hora_almuerzo';

      // Actualizar negocioData y marcar como unsaved
      handleNegocioFieldChange(dbKey, dbValue);

      // Trigger update descripción general (opcional, para mantener compatibilidad)
      // updateHorariosDescription(newState); // Necesitaríamos pasar el state nuevo

      return newState;
    });
  };

  const handleSaveNegocioField = async (clave: string) => {
    setSavingNegocio(true);
    try {
      // ✅ Verificar si la clave existe en BD para decidir POST vs PUT
      if (existingNegocioKeys.has(clave)) {
        // La clave existe → ACTUALIZAR (PUT)
        console.log(`📝 Actualizando campo existente: ${clave}`);
        await negocioInfo.update(clave, negocioData[clave]);
      } else {
        // La clave NO existe → CREAR (POST)
        console.log(`➕ Creando campo nuevo: ${clave}`);
        await negocioInfo.create({
          clave,
          valor_texto: negocioData[clave]
        });
        // Agregar a las claves existentes para futuros guardados
        setExistingNegocioKeys(prev => new Set(prev).add(clave));
      }

      // Si actualizamos horarios, regenerar el texto 'horarios' completo automáticamente y guardarlo
      if (['horario_semana', 'horario_sabado', 'horario_domingo'].includes(clave)) {
        updateFullDescription();
      }

      setUnsavedNegocioChanges(prev => {
        const next = new Set(prev);
        next.delete(clave);
        return next;
      });
      showSaveStatus();
    } catch (error) {
      console.error('Error guardando campo:', error);
      alert('Error al guardar el campo.');
    } finally {
      setSavingNegocio(false);
    }
  };

  const handleSaveAllNegocio = async () => {
    if (unsavedNegocioChanges.size === 0) return;

    setSavingNegocio(true);
    try {
      // ✅ Separar campos nuevos de campos existentes
      const newItems: Array<{ clave: string, valor_texto: string }> = [];
      const updateItems: Array<{ clave: string, valor: string }> = [];

      Array.from(unsavedNegocioChanges).forEach(clave => {
        const key = clave as string;
        const valor = String(negocioData[key] || '');
        if (existingNegocioKeys.has(key)) {
          updateItems.push({ clave: key, valor });
        } else {
          newItems.push({ clave: key, valor_texto: valor });
        }
      });

      console.log(`📝 Actualizando ${updateItems.length} campos existentes, creando ${newItems.length} nuevos`);

      // Actualizar campos existentes en batch
      if (updateItems.length > 0) {
        await negocioInfo.updateBulk(updateItems);
      }

      // Crear campos nuevos uno por uno (no hay createBulk)
      for (const item of newItems) {
        await negocioInfo.create(item);
        setExistingNegocioKeys(prev => new Set(prev).add(item.clave));
      }

      // Asegurar que la descripción completa también se actualice si hubo cambios de horario
      const needsDescUpdate = Array.from(unsavedNegocioChanges).some(f => (f as string).startsWith('horario_'));
      if (needsDescUpdate) {
        await updateFullDescription();
      }

      setUnsavedNegocioChanges(new Set());
      showSaveStatus();
    } catch (error) {
      console.error('Error guardando cambios:', error);
      alert('Error al guardar los cambios.');
    } finally {
      setSavingNegocio(false);
    }
  };

  const updateFullDescription = async () => {
    // Generar texto completo para el campo legacy 'horarios' usado por chatbot
    // Leemos de negocioData o scheduleState. Usaremos negocioData que ya tiene el formato string nuevo.
    const w = negocioData.horario_semana || 'CERRADO';
    const s = negocioData.horario_sabado || 'CERRADO';
    const d = negocioData.horario_domingo || 'CERRADO';

    let desc = '';
    if (w !== 'CERRADO') desc += `Lunes a Viernes: ${w}`;
    if (s !== 'CERRADO') desc += desc ? `. Sábados: ${s}` : `Sábados: ${s}`;
    if (d !== 'CERRADO') desc += desc ? `. Domingos: ${d}` : `Domingos: ${d}`;

    if (desc) {
      await negocioInfo.update('horarios', desc);
      setNegocioData(prev => ({ ...prev, horarios: desc })); // Sync local
    }
  };

  // --- HANDLERS DÍAS CERRADOS ---
  const loadClosedDays = async () => {
    setLoadingClosedDays(true);
    try {
      const response = await diasCerrados.getAll();
      console.log('📅 Días cerrados RAW response:', response);

      // Normalizar respuesta - puede venir en diferentes formatos de n8n
      let data: ClosedDay[] = [];

      if (Array.isArray(response)) {
        data = response as ClosedDay[];
      } else if (response && typeof response === 'object') {
        // Type assertion para acceder a propiedades
        const obj = response as Record<string, unknown>;
        // Si viene como objeto con data
        if (Array.isArray(obj.data)) {
          data = obj.data as ClosedDay[];
        } else if (obj.id && obj.fecha) {
          // Si viene un solo objeto
          data = [response as ClosedDay];
        }
      }

      console.log('📅 Días cerrados NORMALIZED:', data);
      setClosedDays(data);
    } catch (error) {
      console.error('Error cargando días cerrados:', error);
    } finally {
      setLoadingClosedDays(false);
    }
  };

  const handleAddClosedDay = async () => {
    if (!newClosedDay.fecha || !newClosedDay.motivo) return;

    // Validar que si es cierre parcial, las horas sean válidas
    if (!newClosedDay.es_dia_completo) {
      if (!newClosedDay.hora_inicio || !newClosedDay.hora_fin) {
        alert('Por favor, selecciona las horas de inicio y fin del cierre');
        return;
      }
      if (newClosedDay.hora_inicio >= newClosedDay.hora_fin) {
        alert('La hora de inicio debe ser menor que la hora de fin');
        return;
      }
    }

    setIsAddingClosedDay(true);
    try {
      await diasCerrados.create({
        fecha: newClosedDay.fecha,
        motivo: newClosedDay.motivo,
        mensaje_chatbot: newClosedDay.mensaje_chatbot || undefined,
        es_dia_completo: newClosedDay.es_dia_completo,
        hora_inicio: newClosedDay.es_dia_completo ? undefined : newClosedDay.hora_inicio,
        hora_fin: newClosedDay.es_dia_completo ? undefined : newClosedDay.hora_fin
      });
      setNewClosedDay({
        fecha: '',
        motivo: '',
        mensaje_chatbot: '',
        es_dia_completo: true,
        hora_inicio: '09:00',
        hora_fin: '13:00'
      });
      setShowClosedDayModal(false);
      await loadClosedDays();
      showSaveStatus();
      // ✅ Refrescar dashboard
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error agregando día cerrado:', error);
      alert('Error al agregar el día cerrado. Por favor, intenta de nuevo.');
    } finally {
      setIsAddingClosedDay(false);
    }
  };

  const handleDeleteClosedDay = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este día cerrado?')) return;

    try {
      await diasCerrados.delete(id);
      await loadClosedDays();
      showSaveStatus();
      // ✅ Refrescar dashboard
      await refreshDashboard(true);
    } catch (error) {
      console.error('Error eliminando día cerrado:', error);
      alert('Error al eliminar el día cerrado.');
    }
  };

  const handleCloseToday = async () => {
    const motivo = prompt('¿Cuál es el motivo del cierre de emergencia?', 'Cerrado de emergencia');
    if (!motivo) return;

    setClosingToday(true);
    try {
      await diasCerrados.cerrarHoy(motivo);
      await loadClosedDays();
      showSaveStatus();
      alert('✅ Hoy se ha marcado como cerrado. El chatbot informará a los clientes.');
    } catch (error) {
      console.error('Error cerrando hoy:', error);
      alert('Error al cerrar el día de hoy.');
    } finally {
      setClosingToday(false);
    }
  };

  // Cargar días cerrados cuando cambia a tab General
  useEffect(() => {
    if (activeTab === 'general' && isAdmin) {
      loadClosedDays();
    }
  }, [activeTab, isAdmin]);

  // --- HANDLERS PRECIOS EXTRAS ---
  const loadPreciosExtras = async () => {
    setLoadingPreciosExtras(true);
    try {
      const response = await preciosExtras.getAll();
      setPreciosExtrasList(response as PrecioExtra[]);
    } catch (error) {
      console.error('Error cargando precios extras:', error);
    } finally {
      setLoadingPreciosExtras(false);
    }
  };

  const handleAddPrecioExtra = async () => {
    if (!newPrecioExtra.nombre || !newPrecioExtra.etiqueta) return;

    try {
      await preciosExtras.create(newPrecioExtra);
      await loadPreciosExtras();
      setShowPrecioExtraModal(false);
      setNewPrecioExtra({ categoria: 'largo', nombre: '', etiqueta: '', precio: 0, descripcion: '' });
      showSaveStatus();
    } catch (error) {
      console.error('Error creando precio extra:', error);
      alert('Error al crear el precio extra.');
    }
  };

  const handleUpdatePrecioExtra = async (id: number, data: Partial<PrecioExtra>) => {
    try {
      await preciosExtras.update(id, data);
      await loadPreciosExtras();
      showSaveStatus();
    } catch (error) {
      console.error('Error actualizando precio extra:', error);
    }
  };

  const handleDeletePrecioExtra = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar este precio extra?')) return;

    try {
      await preciosExtras.delete(id);
      await loadPreciosExtras();
      showSaveStatus();
    } catch (error) {
      console.error('Error eliminando precio extra:', error);
      alert('Error al eliminar el precio extra.');
    }
  };

  // Cargar servicios y precios extras cuando cambia a tab Services
  useEffect(() => {
    if (activeTab === 'services' && isAdmin) {
      loadServicesFromAPI();
      loadPreciosExtras();
    }
  }, [activeTab, isAdmin]);

  // Cargar staff cuando cambia a tab Staff
  useEffect(() => {
    if (activeTab === 'staff' && isAdmin && isPro) {
      loadCategoriasCalendario();
      loadStaffFromAPI();
    }
  }, [activeTab, isAdmin, isPro]);

  // Cargar info del negocio cuando cambia a tab General
  useEffect(() => {
    if (activeTab === 'general' && isAdmin) {
      loadNegocioInfo();
    }
  }, [activeTab, isAdmin]);

  // --- ACCESS DENIED FOR STAFF ---
  if (!isAdmin) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center">
        <div className="mb-4 rounded-full bg-rose-100 p-4 text-rose-500 dark:bg-rose-900/20">
          <ShieldAlert size={48} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Acceso Restringido</h1>
        <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
          Esta sección contiene configuraciones sensibles del negocio. Solo el administrador puede realizar cambios aquí.
        </p>
        <Link to="/nilah/app" className="mt-6 rounded-lg bg-gray-200 px-6 py-2 text-sm font-bold text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700">
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  // Tab definitions
  const tabs = [
    { id: 'general' as SettingsTab, label: 'General', icon: Building2 },
    { id: 'closedDays' as SettingsTab, label: 'Días Cerrados', icon: Calendar },
    { id: 'staff' as SettingsTab, label: 'Equipo', icon: Users, proBadge: true },
    { id: 'services' as SettingsTab, label: 'Servicios', icon: Palette },
    { id: 'chatbot' as SettingsTab, label: 'Nilah IA', icon: Bot, proBadge: true },
    { id: 'subscription' as SettingsTab, label: 'Mi Plan', icon: CreditCard },
  ];

  return (
    <div className="max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configuración</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gestiona tu salón, equipo y preferencias</p>
        </div>

        {/* Save Status Indicator */}
        {saveStatus !== 'idle' && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-all ${saveStatus === 'saving' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            }`}>
            {saveStatus === 'saving' ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                <span>Guardado</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1 dark:bg-[#1A1A1A]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
              ? 'bg-white text-gray-900 shadow dark:bg-[#2A2A2A] dark:text-white'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.proBadge && !isPro && (
              <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                PRO
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">

        {/* GENERAL TAB */}
        {activeTab === 'general' && (
          <div className="space-y-6">

            {/* Loading State */}
            {loadingNegocio && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            )}

            {!loadingNegocio && (
              <>
                {/* Unsaved Changes Banner */}
                {unsavedNegocioChanges.size > 0 && (
                  <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Tienes {unsavedNegocioChanges.size} cambio(s) sin guardar
                      </span>
                    </div>
                    <button
                      onClick={handleSaveAllNegocio}
                      disabled={savingNegocio}
                      className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      {savingNegocio ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Guardar Todo
                    </button>
                  </div>
                )}

                {/* SECCIÓN 1: Información Básica */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-500/20">
                      <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Información Básica</h2>
                      <p className="text-xs text-gray-500">Datos principales de tu negocio</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        📍 Ubicación y Contacto
                      </label>
                      <textarea
                        value={negocioData.ubicacion_contacto || ''}
                        onChange={(e) => handleNegocioFieldChange('ubicacion_contacto', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('ubicacion_contacto') && handleSaveNegocioField('ubicacion_contacto')}
                        placeholder="Ej: Calle Ficticia 123, Palermo, Buenos Aires"
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white resize-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        📱 WhatsApp del Negocio
                      </label>
                      <input
                        type="tel"
                        value={negocioData.whatsapp || ''}
                        onChange={(e) => handleNegocioFieldChange('whatsapp', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('whatsapp') && handleSaveNegocioField('whatsapp')}
                        placeholder="+51981482289"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-4">
                        {/* Weekday Hours */}
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-[#1A1A1A]">
                          <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              Lunes a Viernes
                            </label>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Apertura</label>
                              <input
                                type="time"
                                value={scheduleState.weekdays.start}
                                onChange={(e) => handleScheduleChange('weekdays', 'start', e.target.value)}
                                onBlur={() => handleScheduleChange('weekdays', 'start', scheduleState.weekdays.start)} // Trigger save on blur
                                className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs text-gray-500">Cierre</label>
                              <input
                                type="time"
                                value={scheduleState.weekdays.end}
                                onChange={(e) => handleScheduleChange('weekdays', 'end', e.target.value)}
                                onBlur={() => handleScheduleChange('weekdays', 'end', scheduleState.weekdays.end)} // Trigger save on blur
                                className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Saturday Hours */}
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-[#1A1A1A]">
                          <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              Sábados
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                checked={scheduleState.saturday.closed}
                                onChange={(e) => handleScheduleChange('saturday', 'closed', e.target.checked)}
                              />
                              <span className="text-xs font-medium text-gray-500">Marcar como Cerrado</span>
                            </label>
                          </div>

                          {!scheduleState.saturday.closed ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">Apertura</label>
                                <input
                                  type="time"
                                  value={scheduleState.saturday.start}
                                  onChange={(e) => handleScheduleChange('saturday', 'start', e.target.value)}
                                  onBlur={() => handleScheduleChange('saturday', 'start', scheduleState.saturday.start)}
                                  className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">Cierre</label>
                                <input
                                  type="time"
                                  value={scheduleState.saturday.end}
                                  onChange={(e) => handleScheduleChange('saturday', 'end', e.target.value)}
                                  onBlur={() => handleScheduleChange('saturday', 'end', scheduleState.saturday.end)}
                                  className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-2 text-sm text-gray-400 italic bg-gray-100 dark:bg-[#141414] rounded-lg">
                              Cerrado este día
                            </div>
                          )}
                        </div>

                        {/* Sunday Hours */}
                        <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-[#1A1A1A]">
                          <div className="mb-3 flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                              Domingos
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                checked={scheduleState.sunday.closed}
                                onChange={(e) => handleScheduleChange('sunday', 'closed', e.target.checked)}
                              />
                              <span className="text-xs font-medium text-gray-500">Marcar como Cerrado</span>
                            </label>
                          </div>

                          {!scheduleState.sunday.closed ? (
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">Apertura</label>
                                <input
                                  type="time"
                                  value={scheduleState.sunday.start}
                                  onChange={(e) => handleScheduleChange('sunday', 'start', e.target.value)}
                                  onBlur={() => handleScheduleChange('sunday', 'start', scheduleState.sunday.start)}
                                  className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">Cierre</label>
                                <input
                                  type="time"
                                  value={scheduleState.sunday.end}
                                  onChange={(e) => handleScheduleChange('sunday', 'end', e.target.value)}
                                  onBlur={() => handleScheduleChange('sunday', 'end', scheduleState.sunday.end)}
                                  className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center py-2 text-sm text-gray-400 italic bg-gray-100 dark:bg-[#141414] rounded-lg">
                              Cerrado este día
                            </div>
                          )}
                        </div>      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          🍽️ Horario de Almuerzo
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            // @ts-ignore
                            checked={scheduleState.lunch.closed}
                            // @ts-ignore
                            onChange={(e) => handleScheduleChange('lunch', 'closed', e.target.checked)}
                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                          />
                          <span className="text-xs font-medium text-gray-500">Sin almuerzo</span>
                        </label>
                      </div>

                      {/* @ts-ignore */}
                      {!scheduleState.lunch.closed ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Inicio</label>
                            <input
                              type="time"
                              // @ts-ignore
                              value={scheduleState.lunch.start}
                              // @ts-ignore
                              onChange={(e) => handleScheduleChange('lunch', 'start', e.target.value)}
                              // @ts-ignore
                              onBlur={() => handleScheduleChange('lunch', 'start', scheduleState.lunch.start)}
                              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Fin</label>
                            <input
                              type="time"
                              // @ts-ignore
                              value={scheduleState.lunch.end}
                              // @ts-ignore
                              onChange={(e) => handleScheduleChange('lunch', 'end', e.target.value)}
                              // @ts-ignore
                              onBlur={() => handleScheduleChange('lunch', 'end', scheduleState.lunch.end)}
                              className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-2 text-sm text-gray-400 italic bg-gray-100 dark:bg-[#141414] rounded-lg">
                          Sin horario de almuerzo configurado
                        </div>
                      )}

                      <p className="mt-2 text-xs text-gray-400">
                        Este horario se bloqueará automáticamente en la agenda
                      </p>
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 2: Redes Sociales */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-pink-100 p-2 dark:bg-pink-500/20">
                      <MessageCircle className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Redes Sociales</h2>
                      <p className="text-xs text-gray-500">Conecta tus perfiles para que el chatbot los comparta</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                        <span className="text-lg">📸</span>
                      </div>
                      <input
                        type="text"
                        value={negocioData.Instagram || ''}
                        onChange={(e) => handleNegocioFieldChange('Instagram', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('Instagram') && handleSaveNegocioField('Instagram')}
                        placeholder="@tu_salon_beauty"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                      />
                      {negocioData.Instagram && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          ✓ Conectado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white">
                        <span className="text-lg">👤</span>
                      </div>
                      <input
                        type="text"
                        value={negocioData.Facebook || ''}
                        onChange={(e) => handleNegocioFieldChange('Facebook', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('Facebook') && handleSaveNegocioField('Facebook')}
                        placeholder="@tu_salon_fb"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                      />
                      {negocioData.Facebook && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          ✓ Conectado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 md:col-span-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black text-white dark:bg-white dark:text-black">
                        <span className="text-lg">🎵</span>
                      </div>
                      <input
                        type="text"
                        value={negocioData.Tiktok || ''}
                        onChange={(e) => handleNegocioFieldChange('Tiktok', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('Tiktok') && handleSaveNegocioField('Tiktok')}
                        placeholder="@tu_salon_tiktok"
                        className="flex-1 rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                      />
                      {negocioData.Tiktok && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          ✓ Conectado
                        </span>
                      )}
                    </div>
                  </div>
                </section>

                {/* SECCIÓN 3: Métodos de Pago */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-500/20">
                      <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Métodos de Pago</h2>
                      <p className="text-xs text-gray-500">El chatbot informará las formas de pago aceptadas</p>
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={negocioData.metodos_pago || ''}
                      onChange={(e) => handleNegocioFieldChange('metodos_pago', e.target.value)}
                      onBlur={() => unsavedNegocioChanges.has('metodos_pago') && handleSaveNegocioField('metodos_pago')}
                      placeholder="Ej: Efectivo (10% descuento), Yape, Plin, Tarjeta de crédito/débito, Transferencia bancaria"
                      rows={2}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white resize-none"
                    />
                  </div>
                </section>

                {/* SECCIÓN 4: Políticas del Negocio */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-500/20">
                      <Settings2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Políticas de Reserva</h2>
                      <p className="text-xs text-gray-500">Reglas que el chatbot comunicará a los clientes</p>
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={negocioData.politicas_reserva || ''}
                      onChange={(e) => handleNegocioFieldChange('politicas_reserva', e.target.value)}
                      onBlur={() => unsavedNegocioChanges.has('politicas_reserva') && handleSaveNegocioField('politicas_reserva')}
                      placeholder="Ej: Anticipación 24hs. Cancelación gratuita hasta 4hs antes. Llegada puntual, tolerancia 15 min."
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white resize-none"
                    />
                  </div>
                </section>

                {/* SECCIÓN 5: FAQ del Chatbot */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-500/20">
                      <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preguntas Frecuentes (FAQ)</h2>
                      <p className="text-xs text-gray-500">Respuestas que Nilah usará para contestar preguntas comunes</p>
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={negocioData.faq || ''}
                      onChange={(e) => handleNegocioFieldChange('faq', e.target.value)}
                      onBlur={() => unsavedNegocioChanges.has('faq') && handleSaveNegocioField('faq')}
                      placeholder="Ej: - ¿Hacen domicilios? Solo eventos especiales&#10;- ¿Tienen estacionamiento? Sí, gratuito&#10;- ¿Aceptan mascotas? Solo perros pequeños"
                      rows={4}
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-mono dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white resize-none"
                    />
                  </div>
                </section>

                {/* SECCIÓN 6: Promociones Activas - MEJORADA */}
                <section className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-6 shadow-sm dark:border-violet-500/20 dark:from-violet-500/5 dark:to-pink-500/5">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-500/20">
                        <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Promociones Activas</h2>
                        <p className="text-xs text-gray-500">El chatbot promocionará estas ofertas automáticamente</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { key: 'Promociones General', label: 'Promoción General', icon: '🎁', color: 'from-violet-500 to-purple-600' },
                      { key: 'Promociones Uñas', label: 'Uñas', icon: '💅', color: 'from-pink-500 to-rose-600' },
                      { key: 'Promociones Pies', label: 'Pies', icon: '🦶', color: 'from-amber-500 to-orange-600' },
                      { key: 'Promociones Pestañas', label: 'Pestañas', icon: '👁️', color: 'from-blue-500 to-indigo-600' },
                      { key: 'Promociones Cabello', label: 'Cabello', icon: '💇', color: 'from-emerald-500 to-teal-600' },
                      { key: 'Promociones Rostro', label: 'Faciales & Rostro', icon: '🧖', color: 'from-rose-500 to-pink-600' },
                    ].map(promo => {
                      const textoKey = promo.key;
                      const hasContent = negocioData[textoKey] && negocioData[textoKey] !== '(Sin promos activas actualmente)';

                      return (
                        <div
                          key={promo.key}
                          className="group rounded-xl border border-violet-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-violet-500/20 dark:bg-[#141414]"
                        >
                          {/* Header con icono y estado */}
                          <div className="mb-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${promo.color} text-white shadow-sm`}>
                                <span className="text-lg">{promo.icon}</span>
                              </div>
                              <span className="font-medium text-gray-800 dark:text-white">{promo.label}</span>
                            </div>
                            {hasContent && (
                              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Activa
                              </span>
                            )}
                          </div>
                          {/* Campo de texto principal */}
                          <div>
                            <label className="mb-1 block text-xs text-gray-500">Descripción de la promo</label>
                            <textarea
                              value={negocioData[textoKey] || ''}
                              onChange={(e) => handleNegocioFieldChange(textoKey, e.target.value)}
                              onBlur={() => unsavedNegocioChanges.has(textoKey) && handleSaveNegocioField(textoKey)}
                              placeholder="Ej: 15% OFF primera visita"
                              rows={2}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white resize-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* SECCIÓN 7: Cuenta del Usuario */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Tu Cuenta</h2>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                      {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </div>
                    <div>
                      <p className="text-lg font-medium dark:text-white">{user?.name}</p>
                      <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
                      <div className="mt-1 flex gap-2">
                        <span className="inline-block rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {user?.role}
                        </span>
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold ${user?.plan === 'Pro'
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                          {user?.plan}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </>
            )}
          </div>
        )}

        {/* CLOSED DAYS TAB - Días No Laborables */}
        {activeTab === 'closedDays' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-100 p-3 dark:bg-rose-500/20">
                <Calendar className="h-6 w-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Días No Laborables</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  El chatbot Nilah informará automáticamente a los clientes
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCloseToday}
                disabled={closingToday}
                className="flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-6 py-4 text-base font-bold text-white shadow-lg hover:bg-rose-600 disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                {closingToday ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <AlertTriangle className="h-5 w-5" />
                )}
                <span>🚨 Cerrar HOY</span>
              </button>
              <button
                onClick={() => setShowClosedDayModal(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-6 py-4 text-base font-bold text-white shadow hover:bg-violet-600 transition-all"
              >
                <Plus className="h-5 w-5" />
                <span>Programar Cierre Futuro</span>
              </button>
            </div>

            {/* Closed Days List */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Calendar className="h-5 w-5 text-rose-500" />
                Próximos Cierres ({closedDays.length})
              </h3>

              {loadingClosedDays ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                </div>
              ) : closedDays.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-white/10">
                  <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">No hay cierres programados</p>
                  <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
                    Programa un cierre para feriados, inventarios o eventos especiales
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {closedDays.map((day) => (
                    <div
                      key={day.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-white/10 dark:bg-[#1A1A1A]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/20">
                          <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                            {new Date(day.fecha + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-lg font-bold text-rose-700 dark:text-rose-300">
                            {new Date(day.fecha + 'T12:00:00').getDate()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{day.motivo}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(day.fecha + 'T12:00:00').toLocaleDateString('es-ES', {
                              month: 'long',
                              year: 'numeric'
                            })}
                            {!day.es_dia_completo && day.hora_inicio && day.hora_fin && (
                              <span className="ml-2 text-amber-600 dark:text-amber-400">
                                ⏰ {day.hora_inicio} - {day.hora_fin}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteClosedDay(day.id)}
                        className="self-end sm:self-auto rounded-lg bg-rose-100 p-2.5 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/30 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* MODAL PARA AGREGAR CIERRE */}
            {showClosedDayModal && (
              <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300 max-h-[90vh] overflow-y-auto">
                  {/* Header del modal */}
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 dark:border-white/10 bg-white dark:bg-[#1A1A1A] px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-rose-100 p-2 dark:bg-rose-500/20">
                        <Calendar className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <h3 className="text-lg font-semibold dark:text-white">Programar Cierre</h3>
                    </div>
                    <button
                      onClick={() => setShowClosedDayModal(false)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Contenido del modal */}
                  <div className="p-4 sm:p-6 space-y-4">
                    {/* Fecha */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Fecha del cierre
                      </label>
                      <input
                        type="date"
                        value={newClosedDay.fecha}
                        onChange={(e) => setNewClosedDay({ ...newClosedDay, fecha: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-base dark:border-white/10 dark:bg-[#141414] dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>

                    {/* Motivo */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Motivo del cierre
                      </label>
                      <input
                        type="text"
                        value={newClosedDay.motivo}
                        onChange={(e) => setNewClosedDay({ ...newClosedDay, motivo: e.target.value })}
                        placeholder="Ej: Feriado, Inventario, Evento..."
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-base dark:border-white/10 dark:bg-[#141414] dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                      />
                    </div>

                    {/* Toggle Día Completo / Parcial */}
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium dark:text-white">Tipo de cierre</p>
                          <p className="text-xs text-gray-500">
                            {newClosedDay.es_dia_completo ? 'Cerrado todo el día' : 'Cerrado solo algunas horas'}
                          </p>
                        </div>
                        <button
                          onClick={() => setNewClosedDay({ ...newClosedDay, es_dia_completo: !newClosedDay.es_dia_completo })}
                          className={`transition-colors ${newClosedDay.es_dia_completo ? 'text-rose-500' : 'text-amber-500'}`}
                        >
                          {newClosedDay.es_dia_completo ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                        </button>
                      </div>

                      {/* Horarios parciales */}
                      {!newClosedDay.es_dia_completo && (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Desde</label>
                            <input
                              type="time"
                              value={newClosedDay.hora_inicio}
                              onChange={(e) => setNewClosedDay({ ...newClosedDay, hora_inicio: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Hasta</label>
                            <input
                              type="time"
                              value={newClosedDay.hora_fin}
                              onChange={(e) => setNewClosedDay({ ...newClosedDay, hora_fin: e.target.value })}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mensaje Chatbot (opcional) */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Mensaje para el chatbot <span className="text-gray-400">(opcional)</span>
                      </label>
                      <textarea
                        value={newClosedDay.mensaje_chatbot}
                        onChange={(e) => setNewClosedDay({ ...newClosedDay, mensaje_chatbot: e.target.value })}
                        placeholder="Mensaje personalizado que Nilah enviará a los clientes..."
                        rows={2}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-base dark:border-white/10 dark:bg-[#141414] dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                      />
                    </div>
                  </div>

                  {/* Footer del modal */}
                  <div className="sticky bottom-0 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowClosedDayModal(false)}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors order-2 sm:order-1"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddClosedDay}
                      disabled={!newClosedDay.fecha || !newClosedDay.motivo || isAddingClosedDay}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
                    >
                      {isAddingClosedDay ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Agregar Cierre
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHATBOT TAB */}
        {activeTab === 'chatbot' && (
          <div className="space-y-6">
            {!isPro ? (
              <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-8 text-center dark:border-violet-500/20 dark:from-violet-500/5 dark:to-pink-500/5">
                <Crown className="mx-auto mb-4 h-12 w-12 text-violet-500" />
                <h3 className="text-xl font-bold">Configuración Avanzada de Nilah IA</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Personaliza la personalidad, mensajes y horarios de tu chatbot con el plan Pro.
                </p>
                <button className="mt-6 rounded-lg bg-violet-500 px-6 py-2.5 font-bold text-white hover:bg-violet-600">
                  Actualizar a Pro
                </button>
              </div>
            ) : (
              <>
                {/* Chatbot Enable/Disable */}
                <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <Bot className="h-6 w-6 text-violet-500" />
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nilah IA (Chatbot)</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {chatbotEnabled ? 'Activo - Respondiendo mensajes de WhatsApp' : 'Desactivado - Los mensajes no se responden automáticamente'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleBot}
                      className={`transition-colors duration-200 ${chatbotEnabled ? 'text-violet-500' : 'text-gray-400'}`}
                    >
                      {chatbotEnabled ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                    </button>
                  </div>
                </section>

                {chatbotEnabled && (
                  <>
                    {/* Personality */}
                    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Personalidad de Nilah</h3>
                      <div className="grid gap-3 md:grid-cols-3">
                        {[
                          { id: 'formal', label: 'Formal', emoji: '👔', desc: 'Profesional y educado' },
                          { id: 'casual', label: 'Casual', emoji: '😊', desc: 'Amigable y relajado' },
                          { id: 'friendly', label: 'Divertido', emoji: '🎉', desc: 'Alegre y cercano' },
                        ].map(p => (
                          <button
                            key={p.id}
                            onClick={() => { setChatbotPersonality(p.id as any); showSaveStatus(); }}
                            className={`rounded-xl border-2 p-4 text-left transition-all ${chatbotPersonality === p.id
                              ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                              : 'border-gray-200 hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20'
                              }`}
                          >
                            <span className="text-2xl">{p.emoji}</span>
                            <p className="mt-2 font-medium dark:text-white">{p.label}</p>
                            <p className="text-xs text-gray-500">{p.desc}</p>
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Welcome Message */}
                    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Mensaje de Bienvenida</h3>
                      <textarea
                        value={chatbotWelcomeMessage}
                        onChange={(e) => setChatbotWelcomeMessage(e.target.value)}
                        onBlur={showSaveStatus}
                        rows={3}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#1A1A1A] dark:text-white"
                        placeholder="Mensaje que Nilah envía al iniciar una conversación..."
                      />
                    </section>

                    {/* Operating Hours */}
                    <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
                      <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Horario de Nilah</h3>
                      <div className="flex gap-4">
                        <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${chatbotHours === '24/7' ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-gray-200 dark:border-white/10'
                          }`}>
                          <input
                            type="radio"
                            name="hours"
                            checked={chatbotHours === '24/7'}
                            onChange={() => { setChatbotHours('24/7'); showSaveStatus(); }}
                            className="sr-only"
                          />
                          <Clock className="h-5 w-5 text-violet-500" />
                          <div>
                            <p className="font-medium dark:text-white">24/7</p>
                            <p className="text-xs text-gray-500">Siempre activo</p>
                          </div>
                        </label>
                        <label className={`flex flex-1 cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition-all ${chatbotHours === 'business' ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10' : 'border-gray-200 dark:border-white/10'
                          }`}>
                          <input
                            type="radio"
                            name="hours"
                            checked={chatbotHours === 'business'}
                            onChange={() => { setChatbotHours('business'); showSaveStatus(); }}
                            className="sr-only"
                          />
                          <Building2 className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium dark:text-white">Horario Laboral</p>
                            <p className="text-xs text-gray-500">Solo en horario de atención</p>
                          </div>
                        </label>
                      </div>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            {!isPro ? (
              <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-pink-50 p-8 text-center dark:border-violet-500/20 dark:from-violet-500/5 dark:to-pink-500/5">
                <Users className="mx-auto mb-4 h-12 w-12 text-violet-500" />
                <h3 className="text-xl font-bold">Gestión de Equipo</h3>
                <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                  Agrega hasta 3 miembros de staff con permisos personalizables en el plan Pro.
                </p>
                <button className="mt-6 rounded-lg bg-violet-500 px-6 py-2.5 font-bold text-white hover:bg-violet-600">
                  Actualizar a Pro
                </button>
              </div>
            ) : (
              <>
                {/* ═══════ SUB-TABS: Miembros / Categorías ═══════ */}
                <div className="flex items-center gap-1 rounded-xl bg-gray-100 dark:bg-white/5 p-1 mb-6">
                  <button
                    onClick={() => setStaffSubTab('miembros')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${staffSubTab === 'miembros' ? 'bg-white dark:bg-[#1A1A1A] text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <Users className="h-4 w-4" /> Miembros
                  </button>
                  <button
                    onClick={() => setStaffSubTab('categorias')}
                    className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${staffSubTab === 'categorias' ? 'bg-white dark:bg-[#1A1A1A] text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <Calendar className="h-4 w-4" /> Categorías
                  </button>
                </div>

                {staffSubTab === 'miembros' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Miembros del Equipo</h2>
                        <p className="text-sm text-gray-500">{staffFromDB.filter(s => s.activo).length} de 3 usuarios activos</p>
                      </div>
                      <button
                        onClick={() => setIsAddStaffModalOpen(true)}
                        disabled={staffFromDB.length >= 3}
                        className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} />
                        Agregar Staff
                      </button>
                    </div>



                    {/* Loading State */}
                    {loadingStaff && (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                      </div>
                    )}


                    {/* Staff List */}
                    {!loadingStaff && (
                      <div className="space-y-4">
                        {/* Dynamic staff grouping from categoriasData */}
                        {[...categoriasData.filter(c => c.activo), { id: 0, nombre: 'General', emoji: '✨', activo: true } as CategoriaCalendario].map(catObj => {
                          const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                          const employees = staffFromDB.filter(s => {
                            const rawCat = s.cat_staff || s.especialidad || 'multi';
                            if (catObj.id === 0) {
                              // "General" catches staff with cat_staff = 'multi' or no match
                              const matchesAny = categoriasData.some(c => normalize(c.nombre) === normalize(String(rawCat)));
                              return !matchesAny || normalize(String(rawCat)) === 'multi' || normalize(String(rawCat)) === 'general';
                            }
                            return normalize(String(rawCat)) === normalize(catObj.nombre);
                          });
                          if (employees.length === 0) return null;

                          const config = { label: catObj.nombre, emoji: catObj.emoji || '📁' };

                          return (
                            <div key={catObj.id || 'general'} className="space-y-3 pt-2">
                              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 px-1">
                                <span>{config.emoji}</span> {config.label} <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500 font-bold">{employees.length}</span>
                              </h3>
                              <div className="grid gap-4">
                                {employees.map(staff => (
                                  <div
                                    key={staff.id}
                                    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]"
                                  >
                                    <div className="flex items-center justify-between mb-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                                          {staff.nombre?.split(' ').map(n => n[0]).join('') || '?'}
                                        </div>
                                        <div>
                                          <p className="font-medium dark:text-white">{staff.nombre}</p>
                                          <p className="text-sm text-gray-500">{staff.email || staff.telefono || 'Sin contacto'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${staff.activo
                                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                          : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                          }`}>
                                          {staff.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                        <button
                                          onClick={() => handleStaffActiveToggle(staff.id)}
                                          className={`transition-colors ${staff.activo ? 'text-emerald-500' : 'text-gray-400'}`}
                                        >
                                          {staff.activo ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                        </button>
                                        <button
                                          onClick={() => handleOpenEditStaff(staff)}
                                          className="rounded p-2 text-gray-400 hover:bg-violet-100 hover:text-violet-500 dark:hover:bg-violet-900/30 dark:hover:text-violet-400 transition"
                                          title="Editar"
                                        >
                                          <Pencil size={16} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteStaff(staff.id)}
                                          className="rounded p-2 text-gray-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition"
                                          title="Eliminar"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Role Badge + Especialidad Badge + cat_staff badge */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                        {staff.rol || 'Staff'}
                                      </span>
                                      {/* Mostrar cat_staff si existe, o fallback a especialidad */}
                                      {(staff.cat_staff || (staff.especialidad && staff.especialidad !== 'multi')) && (
                                        <span
                                          className="rounded-lg px-2 py-1 text-xs font-medium flex items-center gap-1"
                                          style={{
                                            backgroundColor: `${staff.color || '#6366f1'}20`,
                                            color: staff.color || '#6366f1'
                                          }}
                                        >
                                          <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: staff.color || '#6366f1' }}
                                          ></span>
                                          {(() => {
                                            const cat = staff.cat_staff || staff.especialidad;
                                            return cat === 'manos' ? '💅 Manos' :
                                              cat === 'pies' ? '🦶 Pies' :
                                                cat === 'pestanas' ? '👁️ Pestañas' :
                                                  cat === 'rostro' ? '💆 Rostro' :
                                                    cat === 'cabello' ? '💇 Cabello' : cat;
                                          })()}
                                        </span>
                                      )}
                                      {(staff as any).sub_especialidad && (
                                        <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-400">
                                          ✨ {(staff as any).sub_especialidad}
                                        </span>
                                      )}
                                    </div>

                                    {/* === DISPONIBILIDAD — Quick Actions === */}
                                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">⚡ Disponibilidad</p>

                                      {/* Horario del staff */}
                                      {(staff as any).horario_trabajo && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                          🕐 Horario: {(staff as any).horario_trabajo.inicio || '09:00'} - {(staff as any).horario_trabajo.fin || '21:00'}
                                        </p>
                                      )}

                                      <div className="flex flex-wrap gap-2">
                                        <button
                                          onClick={async () => {
                                            if (!confirm(`¿Marcar a ${staff.nombre} como FALTA HOY?`)) return;
                                            try {
                                              const { staffDisponibilidad } = await import('../services/api.js');
                                              await staffDisponibilidad.marcarFaltaHoy(staff.id, 'Falta del día');
                                              alert(`✅ ${staff.nombre} marcada como ausente hoy`);
                                            } catch (e) {
                                              console.error(e);
                                              alert('Error al registrar ausencia');
                                            }
                                          }}
                                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 font-medium transition-colors"
                                        >
                                          ❌ Falta Hoy
                                        </button>
                                        <button
                                          onClick={async () => {
                                            const hora = prompt(`¿Desde qué hora se retira ${staff.nombre}? (ej: 14:00)`);
                                            if (!hora) return;
                                            try {
                                              const { staffDisponibilidad } = await import('../services/api.js');
                                              await staffDisponibilidad.marcarMedioDia(staff.id, hora, 'Se retiró temprano');
                                              alert(`✅ ${staff.nombre} marcada como medio día desde ${hora}`);
                                            } catch (e) {
                                              console.error(e);
                                              alert('Error al registrar medio día');
                                            }
                                          }}
                                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 font-medium transition-colors"
                                        >
                                          🌗 Medio Día
                                        </button>
                                        <button
                                          onClick={async () => {
                                            const fecha = prompt(`Fecha de ausencia para ${staff.nombre} (YYYY-MM-DD):`);
                                            if (!fecha) return;
                                            const motivo = prompt('Motivo (ej: Vacaciones, Cita médica):') || 'Ausencia programada';
                                            try {
                                              const { staffDisponibilidad } = await import('../services/api.js');
                                              await staffDisponibilidad.create({
                                                staff_id: staff.id,
                                                tipo: 'ausencia',
                                                fecha,
                                                motivo,
                                                recurrente: false
                                              });
                                              alert(`✅ Ausencia programada: ${staff.nombre} el ${fecha}`);
                                            } catch (e) {
                                              console.error(e);
                                              alert('Error al programar ausencia');
                                            }
                                          }}
                                          className="text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 font-medium transition-colors"
                                        >
                                          📅 Programar Ausencia
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {staffFromDB.length === 0 && !loadingStaff && (
                          <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 text-center dark:border-white/10">
                            <Users className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                            <p className="text-gray-500">No hay miembros de staff. Agrega uno para comenzar.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ADD STAFF MODAL */}
                    {isAddStaffModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                            <h3 className="text-lg font-semibold dark:text-white">Agregar Miembro</h3>
                            <button
                              onClick={() => setIsAddStaffModalOpen(false)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4">
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo *</label>
                              <input
                                type="text"
                                value={newStaff.nombre}
                                onChange={(e) => setNewStaff({ ...newStaff, nombre: e.target.value })}
                                placeholder="Ej: Ana García"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                              <input
                                type="email"
                                value={newStaff.email}
                                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                placeholder="ana@salon.com"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                              <input
                                type="tel"
                                value={newStaff.telefono}
                                onChange={(e) => setNewStaff({ ...newStaff, telefono: e.target.value })}
                                placeholder="+51 999 999 999"
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría (Área) *</label>
                              <select
                                value={newStaff.cat_staff}
                                onChange={(e) => setNewStaff({ ...newStaff, cat_staff: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              >
                                <option value="">Seleccionar categoría...</option>
                                <option value="manos">💅 Manos</option>
                                <option value="pies">🦶 Pies</option>
                                <option value="pestanas">👁️ Pestañas</option>
                                <option value="rostro">💆 Rostro</option>
                                <option value="cabello">💇 Cabello</option>
                                <option value="multi">✨ General / Multi-área</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                              <select
                                value={newStaff.rol}
                                onChange={(e) => setNewStaff({ ...newStaff, rol: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              >
                                <optgroup label="Uñas">
                                  <option value="Manicurista">💅 Manicurista</option>
                                  <option value="Pedicurista">🦶 Pedicurista</option>
                                  <option value="Nail Artist">🎨 Nail Artist</option>
                                  <option value="Técnica en Acrílico">✨ Técnica en Acrílico</option>
                                  <option value="Técnica en Gel">💎 Técnica en Gel</option>
                                </optgroup>
                                <optgroup label="Pestañas y Cejas">
                                  <option value="Lashista">👁️ Lashista</option>
                                  <option value="Técnica en Lifting">🔄 Técnica en Lifting</option>
                                  <option value="Diseñadora de Cejas">✏️ Diseñadora de Cejas</option>
                                  <option value="Microblading Artist">🖌️ Microblading Artist</option>
                                </optgroup>
                                <optgroup label="Cabello">
                                  <option value="Estilista">💇 Estilista</option>
                                  <option value="Colorista">🌈 Colorista</option>
                                  <option value="Barbero">✂️ Barbero</option>
                                  <option value="Técnica en Alisados">🔥 Técnica en Alisados</option>
                                  <option value="Extensionista Capilar">💫 Extensionista Capilar</option>
                                </optgroup>
                                <optgroup label="Facial y Corporal">
                                  <option value="Esteticista">🧖 Esteticista</option>
                                  <option value="Cosmetóloga">💆 Cosmetóloga</option>
                                  <option value="Masajista">🙌 Masajista</option>
                                  <option value="Depiladora">🍯 Depiladora</option>
                                </optgroup>
                                <optgroup label="Administración">
                                  <option value="Recepcionista">📋 Recepcionista</option>
                                  <option value="Gerente">👔 Gerente</option>
                                  <option value="Asistente">🤝 Asistente</option>
                                  <option value="Staff">👤 Staff General</option>
                                </optgroup>
                              </select>
                            </div>

                            {/* Especialidad y Color */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad</label>
                                <select
                                  value={newStaff.especialidad}
                                  onChange={(e) => setNewStaff({ ...newStaff, especialidad: e.target.value })}
                                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                >
                                  <option value="multi">🔄 Multi-servicio</option>
                                  {categoriasData.filter(c => c.activo).map(c => (
                                    <option key={c.id} value={c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}>{c.emoji || '📁'} {c.nombre}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Sub-especialidad</label>
                                <input
                                  type="text"
                                  value={newStaff.sub_especialidad}
                                  onChange={(e) => setNewStaff({ ...newStaff, sub_especialidad: e.target.value })}
                                  placeholder="Ej: Nail Art, Manicura Rusa..."
                                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                />
                              </div>
                            </div>
                            {/* Color picker */}
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Color identificativo</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={newStaff.color}
                                  onChange={(e) => setNewStaff({ ...newStaff, color: e.target.value })}
                                  className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer dark:border-white/10"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">{newStaff.color}</span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex gap-3">
                            <button
                              onClick={() => setIsAddStaffModalOpen(false)}
                              className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleAddStaff}
                              disabled={!newStaff.nombre}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-4 w-4" /> Agregar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EDIT STAFF MODAL */}
                    {isEditStaffModalOpen && editingStaff && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="rounded-lg bg-violet-100 p-2 dark:bg-violet-500/20">
                                <Pencil className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                              </div>
                              <h3 className="text-lg font-semibold dark:text-white">Editar Miembro</h3>
                            </div>
                            <button
                              onClick={() => setIsEditStaffModalOpen(false)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4">
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo *</label>
                              <input
                                type="text"
                                value={editStaffData.nombre}
                                onChange={(e) => setEditStaffData({ ...editStaffData, nombre: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                              <input
                                type="email"
                                value={editStaffData.email}
                                onChange={(e) => setEditStaffData({ ...editStaffData, email: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                              <input
                                type="tel"
                                value={editStaffData.telefono}
                                onChange={(e) => setEditStaffData({ ...editStaffData, telefono: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría (Área) *</label>
                              <select
                                value={editStaffData.cat_staff}
                                onChange={(e) => setEditStaffData({ ...editStaffData, cat_staff: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              >
                                <option value="">Seleccionar categoría...</option>
                                {categoriasData.filter(c => c.activo).map(c => (
                                  <option key={c.id} value={c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}>{c.emoji || '📁'} {c.nombre}</option>
                                ))}
                                <option value="multi">✨ General / Multi-área</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Rol</label>
                              <select
                                value={editStaffData.rol}
                                onChange={(e) => setEditStaffData({ ...editStaffData, rol: e.target.value })}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                              >
                                <optgroup label="Uñas">
                                  <option value="Manicurista">💅 Manicurista</option>
                                  <option value="Pedicurista">🦶 Pedicurista</option>
                                  <option value="Nail Artist">🎨 Nail Artist</option>
                                  <option value="Técnica en Acrílico">✨ Técnica en Acrílico</option>
                                  <option value="Técnica en Gel">💎 Técnica en Gel</option>
                                </optgroup>
                                <optgroup label="Pestañas y Cejas">
                                  <option value="Lashista">👁️ Lashista</option>
                                  <option value="Técnica en Lifting">🔄 Técnica en Lifting</option>
                                  <option value="Diseñadora de Cejas">✏️ Diseñadora de Cejas</option>
                                  <option value="Microblading Artist">🖌️ Microblading Artist</option>
                                </optgroup>
                                <optgroup label="Cabello">
                                  <option value="Estilista">💇 Estilista</option>
                                  <option value="Colorista">🌈 Colorista</option>
                                  <option value="Barbero">✂️ Barbero</option>
                                  <option value="Técnica en Alisados">🔥 Técnica en Alisados</option>
                                  <option value="Extensionista Capilar">💫 Extensionista Capilar</option>
                                </optgroup>
                                <optgroup label="Facial y Corporal">
                                  <option value="Esteticista">🧖 Esteticista</option>
                                  <option value="Cosmetóloga">💆 Cosmetóloga</option>
                                  <option value="Masajista">🙌 Masajista</option>
                                  <option value="Depiladora">🍯 Depiladora</option>
                                </optgroup>
                                <optgroup label="Administración">
                                  <option value="Recepcionista">📋 Recepcionista</option>
                                  <option value="Gerente">👔 Gerente</option>
                                  <option value="Asistente">🤝 Asistente</option>
                                  <option value="Staff">👤 Staff General</option>
                                </optgroup>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Especialidad</label>
                                <select
                                  value={editStaffData.especialidad}
                                  onChange={(e) => setEditStaffData({ ...editStaffData, especialidad: e.target.value })}
                                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                >
                                  <option value="multi">🔄 Multi-servicio</option>
                                  <option value="manos">💅 Manos</option>
                                  <option value="pies">🦶 Pies</option>
                                  <option value="pestanas">👁️ Pestañas</option>
                                  <option value="rostro">💆 Rostro</option>
                                  <option value="cabello">💇 Cabello</option>
                                </select>
                              </div>
                              <div>
                                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Sub-especialidad</label>
                                <input
                                  type="text"
                                  value={editStaffData.sub_especialidad}
                                  onChange={(e) => setEditStaffData({ ...editStaffData, sub_especialidad: e.target.value })}
                                  placeholder="Ej: Nail Art, Manicura Rusa..."
                                  className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Color identificativo</label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={editStaffData.color}
                                  onChange={(e) => setEditStaffData({ ...editStaffData, color: e.target.value })}
                                  className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer dark:border-white/10"
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">{editStaffData.color}</span>
                              </div>
                            </div>
                          </div>
                          <div className="border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex gap-3">
                            <button
                              onClick={() => setIsEditStaffModalOpen(false)}
                              className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleUpdateStaff}
                              disabled={!editStaffData.nombre}
                              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="h-4 w-4" /> Guardar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </>
                )}

                {/* ═══════════════════ CATEGORÍAS SUB-TAB ═══════════════════ */}
                {staffSubTab === 'categorias' && (
                  <>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Categorías de Equipo</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Define las áreas de trabajo que agrupan a tu staff y servicios</p>
                      </div>
                      <button
                        onClick={() => { setCatFormData({ nombre: '', emoji: '📁', descripcion: '', activo: true }); setIsAddCatModalOpen(true); }}
                        className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white hover:bg-violet-600"
                      >
                        <Plus className="h-4 w-4" /> Nueva Categoría
                      </button>
                    </div>

                    {loadingCategorias ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
                    ) : categoriasData.length === 0 ? (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 p-12 text-center">
                        <Calendar className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No hay categorías creadas</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Crea tu primera categoría para agrupar staff y servicios</p>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {categoriasData.map(cat => {
                          const staffCount = staffFromDB.filter(s => {
                            const normalize = (str: string) => str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
                            return normalize(s.cat_staff || s.especialidad || '') === normalize(cat.nombre);
                          }).length;
                          return (
                            <div key={cat.id} className={`rounded-xl border p-5 transition-all hover:shadow-md ${cat.activo ? 'border-gray-100 bg-white dark:border-white/10 dark:bg-[#141414]' : 'border-gray-100 bg-gray-50 dark:border-white/5 dark:bg-[#0d0d0d] opacity-60'}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-3xl">{cat.emoji || '📁'}</span>
                                  <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{cat.nombre}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{cat.descripcion || 'Sin descripción'}</p>
                                  </div>
                                </div>
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${cat.activo ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
                                  {cat.activo ? 'Activo' : 'Inactivo'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                                <div className="flex items-center gap-4">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {staffCount} staff</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button onClick={() => handleOpenEditCat(cat)} className="rounded-lg p-1.5 text-gray-400 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-500/20" title="Editar">
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => handleDeleteCat(cat.id)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/20" title="Eliminar">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ADD CATEGORÍA MODAL */}
                    {isAddCatModalOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                            <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                              <Plus className="h-5 w-5 text-violet-500" /> Nueva Categoría
                            </h3>
                            <button onClick={() => setIsAddCatModalOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4">
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Área *</label>
                              <input type="text" value={catFormData.nombre} onChange={e => setCatFormData({ ...catFormData, nombre: e.target.value })} placeholder="Ej: Manos, Pestañas, Cabello..." className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Emoji</label>
                              <div className="flex gap-2 flex-wrap">
                                {['💅', '🦶', '👁️', '💆', '💇', '✨', '🎨', '💎', '🌸', '🪷'].map(em => (
                                  <button key={em} type="button" onClick={() => setCatFormData({ ...catFormData, emoji: em })} className={`text-2xl p-2 rounded-lg transition-all ${catFormData.emoji === em ? 'bg-violet-100 dark:bg-violet-500/20 ring-2 ring-violet-500 scale-110' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}>{em}</button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción (opcional)</label>
                              <input type="text" value={catFormData.descripcion} onChange={e => setCatFormData({ ...catFormData, descripcion: e.target.value })} placeholder="Ej: Manicura, acrílicas, gel, esmaltado" className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                            </div>
                          </div>
                          <div className="border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex gap-3">
                            <button onClick={() => setIsAddCatModalOpen(false)} className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">Cancelar</button>
                            <button onClick={handleAddCat} disabled={!catFormData.nombre} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed">
                              <Plus className="h-4 w-4" /> Crear
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* EDIT CATEGORÍA MODAL */}
                    {isEditCatModalOpen && editingCat && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                            <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                              <Pencil className="h-5 w-5 text-violet-500" /> Editar Categoría
                            </h3>
                            <button onClick={() => setIsEditCatModalOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4">
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre del Área *</label>
                              <input type="text" value={catFormData.nombre} onChange={e => setCatFormData({ ...catFormData, nombre: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Emoji</label>
                              <div className="flex gap-2 flex-wrap">
                                {['💅', '🦶', '👁️', '💆', '💇', '✨', '🎨', '💎', '🌸', '🪷'].map(em => (
                                  <button key={em} type="button" onClick={() => setCatFormData({ ...catFormData, emoji: em })} className={`text-2xl p-2 rounded-lg transition-all ${catFormData.emoji === em ? 'bg-violet-100 dark:bg-violet-500/20 ring-2 ring-violet-500 scale-110' : 'hover:bg-gray-100 dark:hover:bg-white/10'}`}>{em}</button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Descripción (opcional)</label>
                              <input type="text" value={catFormData.descripcion} onChange={e => setCatFormData({ ...catFormData, descripcion: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Activo</label>
                              <button onClick={() => setCatFormData({ ...catFormData, activo: !catFormData.activo })} className="text-gray-400">
                                {catFormData.activo ? <ToggleRight className="h-6 w-6 text-violet-500" /> : <ToggleLeft className="h-6 w-6" />}
                              </button>
                            </div>
                          </div>
                          <div className="border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex gap-3">
                            <button onClick={() => setIsEditCatModalOpen(false)} className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">Cancelar</button>
                            <button onClick={handleUpdateCat} disabled={!catFormData.nombre} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed">
                              <Save className="h-4 w-4" /> Guardar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

              </>
            )}
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Catálogo de Servicios</h2>
                  <p className="text-xs text-gray-500">Define los tratamientos disponibles, sus tiempos y costos.</p>
                </div>
                <button
                  onClick={() => setIsServiceModalOpen(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white hover:bg-violet-600 transition shadow-sm"
                >
                  <Plus size={18} /> Nuevo Servicio
                </button>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-700 dark:bg-[#1A1A1A] dark:text-gray-300">
                    <tr>
                      <th className="px-4 py-3 w-1/2">Nombre del Servicio</th>
                      <th className="px-4 py-3">Duración (min)</th>
                      <th className="px-4 py-3">Precio (S/)</th>
                      <th className="px-4 py-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                    {paginatedServices.map(service => {
                      const isEditing = editingService?.id === service.id;
                      const currentNombre = isEditing && editingService.changes.nombre !== undefined
                        ? editingService.changes.nombre
                        : service.nombre;
                      const currentDuracion = isEditing && editingService.changes.duracion_min !== undefined
                        ? editingService.changes.duracion_min
                        : service.duracion_min;
                      const currentPrecio = isEditing && editingService.changes.precio !== undefined
                        ? editingService.changes.precio
                        : service.precio;

                      return (
                        <tr key={service.id} className={`bg-white dark:bg-[#141414] group hover:bg-gray-50 dark:hover:bg-[#1A1A1A] ${isEditing ? 'ring-2 ring-violet-500 ring-inset' : ''}`}>
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={currentNombre}
                              onChange={(e) => handleServiceFieldChange(service.id, 'name', e.target.value)}
                              className="w-full rounded border-transparent bg-transparent px-2 py-1 font-medium text-gray-900 focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 dark:text-white dark:focus:bg-[#1A1A1A] transition-colors"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={currentDuracion}
                              onChange={(e) => handleServiceFieldChange(service.id, 'durationMin', Number(e.target.value))}
                              className="w-20 rounded border-transparent bg-transparent px-2 py-1 text-gray-600 focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 dark:text-gray-300 dark:focus:bg-[#1A1A1A]"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1.5 text-xs font-bold text-gray-400">S/</span>
                              <input
                                type="number"
                                value={currentPrecio}
                                onChange={(e) => handleServiceFieldChange(service.id, 'price', Number(e.target.value))}
                                className="w-24 rounded border-transparent bg-transparent pl-6 pr-2 py-1 font-bold text-gray-900 focus:border-violet-500 focus:bg-white focus:ring-1 focus:ring-violet-500 dark:text-white dark:focus:bg-[#1A1A1A]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center justify-center gap-1">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={handleSaveServiceChanges}
                                    className="rounded p-2 text-white bg-green-500 hover:bg-green-600 transition"
                                    title="Guardar cambios"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={handleCancelServiceEdit}
                                    className="rounded p-2 text-gray-500 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
                                    title="Cancelar"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleServiceDelete(service.id)}
                                  className="rounded p-2 text-gray-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition"
                                  title="Eliminar servicio"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {servicesFromDB.length === 0 && !loadingServices && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No hay servicios registrados. Agrega uno nuevo para comenzar.
                  </div>
                )}
                {loadingServices && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                  </div>
                )}
              </div>

              {/* Elegant Pagination */}
              {servicesTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Mostrando {((servicesCurrentPage - 1) * SERVICES_PER_PAGE) + 1} - {Math.min(servicesCurrentPage * SERVICES_PER_PAGE, servicesFromDB.length)} de {servicesFromDB.length} servicios
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setServicesCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={servicesCurrentPage === 1}
                      className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-gray-400 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                    >
                      <svg className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm font-semibold text-gray-700 dark:text-white">{servicesCurrentPage}</span>
                      <span className="text-sm text-gray-400">/</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{servicesTotalPages}</span>
                    </div>
                    <button
                      onClick={() => setServicesCurrentPage(prev => Math.min(prev + 1, servicesTotalPages))}
                      disabled={servicesCurrentPage === servicesTotalPages}
                      className="group flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all hover:border-violet-300 hover:bg-violet-50 hover:text-violet-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:bg-white disabled:hover:text-gray-500 dark:border-white/10 dark:bg-[#1A1A1A] dark:text-gray-400 dark:hover:border-violet-500/50 dark:hover:bg-violet-500/10 dark:hover:text-violet-400"
                    >
                      <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* PRECIOS EXTRAS SECTION */}
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Precios Extras (Nail Art)</h2>
                  <p className="text-xs text-gray-500">Cotización de largo, diseño y extras para uñas.</p>
                </div>
                <button
                  onClick={() => setShowPrecioExtraModal(true)}
                  className="flex items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm font-bold text-white hover:bg-pink-600 transition shadow-sm"
                >
                  <Plus size={18} /> Nuevo Precio
                </button>
              </div>

              {loadingPreciosExtras ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-700 dark:bg-[#1A1A1A] dark:text-gray-300">
                      <tr>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3">Etiqueta</th>
                        <th className="px-4 py-3">Precio Extra</th>
                        <th className="px-4 py-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                      {preciosExtrasList.map(item => (
                        <tr key={item.id} className="bg-white dark:bg-[#141414] group hover:bg-gray-50 dark:hover:bg-[#1A1A1A]">
                          <td className="px-4 py-2">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${item.categoria === 'largo' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              item.categoria === 'diseño' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                              {item.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-medium dark:text-white">{item.etiqueta}</td>
                          <td className="px-4 py-2">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1.5 text-xs font-bold text-gray-400">+S/</span>
                              <input
                                type="number"
                                value={item.precio}
                                onChange={(e) => handleUpdatePrecioExtra(item.id, { precio: Number(e.target.value) })}
                                className="w-24 rounded border-transparent bg-transparent pl-8 pr-2 py-1 font-bold text-gray-900 focus:border-pink-500 focus:bg-white focus:ring-1 focus:ring-pink-500 dark:text-white dark:focus:bg-[#1A1A1A]"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => handleDeletePrecioExtra(item.id)}
                              className="rounded p-2 text-gray-400 hover:bg-rose-100 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preciosExtrasList.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No hay precios extras configurados. Agrega uno nuevo para empezar.
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* MODAL AGREGAR PRECIO EXTRA */}
            {showPrecioExtraModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 duration-300">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                    <h3 className="text-lg font-semibold dark:text-white">Nuevo Precio Extra</h3>
                    <button
                      onClick={() => setShowPrecioExtraModal(false)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                      <select
                        value={newPrecioExtra.categoria}
                        onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, categoria: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                      >
                        <option value="largo">📏 Largo</option>
                        <option value="diseño">🎨 Diseño</option>
                        <option value="extras">✨ Extras</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre interno</label>
                      <input
                        type="text"
                        value={newPrecioExtra.nombre}
                        onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, nombre: e.target.value })}
                        placeholder="Ej: largo_xl"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Etiqueta visible</label>
                      <input
                        type="text"
                        value={newPrecioExtra.etiqueta}
                        onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, etiqueta: e.target.value })}
                        placeholder="Ej: Largas XL (extra)"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Precio adicional (S/)</label>
                      <input
                        type="number"
                        value={newPrecioExtra.precio}
                        onChange={(e) => setNewPrecioExtra({ ...newPrecioExtra, precio: Number(e.target.value) })}
                        placeholder="0"
                        className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex gap-3">
                    <button
                      onClick={() => setShowPrecioExtraModal(false)}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddPrecioExtra}
                      disabled={!newPrecioExtra.nombre || !newPrecioExtra.etiqueta}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-pink-500 px-4 py-3 text-sm font-bold text-white hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" /> Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Recordatorios de Citas</h2>
              <div className="space-y-4">
                {[
                  { key: 'reminder24h', label: 'Recordatorio 24 horas antes', desc: 'Envía un mensaje automático el día anterior' },
                  { key: 'reminder1h', label: 'Recordatorio 1 hora antes', desc: 'Envía un mensaje cuando falta poco para la cita' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 dark:border-white/5">
                    <div>
                      <p className="font-medium dark:text-white">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }));
                        showSaveStatus();
                      }}
                      className={notifications[item.key as keyof typeof notifications] ? 'text-violet-500' : 'text-gray-400'}
                    >
                      {notifications[item.key as keyof typeof notifications] ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Alertas para Ti</h2>
              <div className="space-y-4">
                {[
                  { key: 'newAppointmentEmail', label: 'Nueva cita por email', desc: 'Recibe un email cuando se agenda una cita' },
                  { key: 'newAppointmentWhatsApp', label: 'Nueva cita por WhatsApp', desc: 'Recibe un mensaje cuando se agenda una cita' },
                  { key: 'clientAtRisk', label: 'Clientas en riesgo', desc: 'Alerta cuando una clienta no viene hace tiempo', proBadge: true },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between rounded-lg border border-gray-100 p-4 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="font-medium dark:text-white">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                      {item.proBadge && !isPro && (
                        <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                          PRO
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (item.proBadge && !isPro) return;
                        setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof notifications] }));
                        showSaveStatus();
                      }}
                      className={`${item.proBadge && !isPro ? 'opacity-50 cursor-not-allowed' : ''} ${notifications[item.key as keyof typeof notifications] ? 'text-violet-500' : 'text-gray-400'
                        }`}
                    >
                      {notifications[item.key as keyof typeof notifications] ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === 'subscription' && (
          <div className="space-y-6">
            <section className={`rounded-xl border-2 p-6 ${user?.plan === 'Pro'
              ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-500/10 dark:to-pink-500/10 dark:border-violet-500/50'
              : 'border-gray-200 bg-white dark:border-white/10 dark:bg-[#141414]'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-full p-3 ${user?.plan === 'Pro' ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-gray-100 dark:bg-white/5'
                    }`}>
                    <Crown className={`h-8 w-8 ${user?.plan === 'Pro' ? 'text-violet-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold dark:text-white">Plan {user?.plan}</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                      {user?.plan === 'Pro' ? 'Todas las funcionalidades desbloqueadas' : 'Funcionalidades básicas'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold dark:text-white">
                    S/ {user?.plan === 'Pro' ? '597' : '297'}<span className="text-sm font-normal text-gray-500">/mes</span>
                  </p>
                </div>
              </div>

              {user?.plan === 'Starter' && (
                <div className="mt-6 rounded-lg bg-violet-100 p-4 dark:bg-violet-500/10">
                  <p className="text-sm text-violet-700 dark:text-violet-300">
                    <Sparkles className="inline mr-1" size={14} />
                    <strong>Actualiza a Pro</strong> para desbloquear: Nilah Marketing, Rescate de Clientas, Gestión de Staff, y más.
                  </p>
                  <button className="mt-3 w-full rounded-lg bg-violet-500 py-2.5 font-bold text-white hover:bg-violet-600">
                    Actualizar Ahora
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]">
              <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">Detalles de Facturación</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Próxima factura</span>
                  <span className="font-medium dark:text-white">15 de Febrero, 2026</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Método de pago</span>
                  <span className="font-medium dark:text-white">Visa •••• 4242</span>
                </div>
              </div>
              <button className="mt-4 text-sm text-violet-500 hover:underline">
                Gestionar método de pago
              </button>
            </section>
          </div>
        )}
      </div>

      {/* --- ADD SERVICE MODAL --- */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-[#1A1A1A] animate-in zoom-in-95 duration-200">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Agregar Nuevo Servicio</h2>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddServiceSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Nombre del Servicio</label>
                <input
                  type="text"
                  required
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm focus:border-violet-500 focus:ring-violet-500 dark:border-white/10 dark:bg-[#141414] dark:text-white"
                  placeholder="Ej. Lifting de Pestañas"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Duración</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="5"
                      step="5"
                      value={newService.durationMin}
                      onChange={(e) => setNewService({ ...newService, durationMin: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-9 text-sm focus:border-violet-500 focus:ring-violet-500 dark:border-white/10 dark:bg-[#141414] dark:text-white"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-gray-500">min</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Precio Base</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      value={newService.price}
                      onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                      className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-9 text-sm focus:border-violet-500 focus:ring-violet-500 dark:border-white/10 dark:bg-[#141414] dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-violet-500 px-6 py-2 text-sm font-bold text-white hover:bg-violet-600 shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
