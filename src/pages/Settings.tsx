
import React, { useState, useEffect } from 'react';
import {
  ToggleLeft, ToggleRight, Save, ShieldAlert, Plus, Trash2, X, Clock, DollarSign,
  Sparkles, Users, Bot, Bell, Crown, CreditCard, Settings2, MessageCircle,
  CheckCircle2, AlertCircle, User, Building2, Palette, Calendar, AlertTriangle, Loader2, Check, Pencil, Scissors, Target,
  MapPin, Smartphone, Instagram, Facebook, Landmark, Globe, Activity, Lock
} from 'lucide-react';

import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { ServiceItem, StaffPermissions, DEFAULT_STAFF_PERMISSIONS, ClosedDay, CategoriaCalendario } from '../types';
import { diasCerrados, servicios, preciosExtras, equipo, staffDisponibilidad, negocioInfo, categoriasCalendario, negocios, brandSettings } from '../services/api';
import { getSupabaseClient, supabase } from '../services/supabase';
import { ServiciosTab } from '../components/Settings/ServiciosTab';
import { ChatbotTab } from '../components/Settings/ChatbotTab';
import { RescateTab } from '../components/Settings/RescateTab';
import { BriefWizardModal } from '../components/Settings/BriefWizardModal';
import { BrandThemePicker } from '../components/Settings/BrandThemePicker';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { BookingTab } from '../components/Settings/BookingTab';

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
type SettingsTab = 'general' | 'closedDays' | 'staff' | 'services' | 'marca' | 'subscription' | 'chatbot' | 'rescate' | 'booking';

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

  const { user, isAdmin, isPro, hasSaaSFeature } = useAuth();
  // ✅ Hook para refrescar datos después de operaciones CRUD
  const { refresh: refreshDashboard } = useDashboardData();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SettingsTab) || 'general';

  const setActiveTab = (tab: SettingsTab) => {
    setSearchParams({ tab });
  };

  // Chatbot settings
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotPersonality, setChatbotPersonality] = useState<'formal' | 'casual' | 'friendly'>('friendly');
  const [chatbotWelcomeMessage, setChatbotWelcomeMessage] = useState('¡Hola! 👋 Soy Nilah, tu asistente virtual. ¿En qué puedo ayudarte hoy?');
  const [hasBrandProfile, setHasBrandProfile] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadSuccess, setLogoUploadSuccess] = useState(false);
  const [brandIdentity, setBrandIdentity] = useState<Record<string, any> | null>(null);
  const [loadingBrand, setLoadingBrand] = useState(false);
  const [briefId, setBriefId] = useState<number | null>(null);
  const [briefData, setBriefData] = useState({
    business_name: '',
    business_type: 'salon',
    years_operating: '',
    monthly_revenue: '',
    avg_ticket: '',
    active_clients: '',
    top_service_1: '',
    top_service_2: '',
    premium_service: '',
    hook_service: '',
    target_gender: '',
    target_age: '',
    preferred_channel: '',
    weak_day: '',
    main_challenge: '',
    brand_words: '',
    brand_color: ''
  });
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [savingBrief, setSavingBrief] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  // Load Bot Config (Kill Switch)
  useEffect(() => {
    const loadBotConfig = async () => {
      try {
        const data = await negocios.get();
        // data es un array, tomamos el primero o el único
        const config = data ? (Array.isArray(data) ? data[0]?.bot_config : data.bot_config) : {};
        if (config && config.bot_enabled !== undefined) {
          setChatbotEnabled(config.bot_enabled);
        }
      } catch (error) {
        console.warn('Silenciando 404 esperado si el webhook /negocios no existe para bot_config');
      }
    };
    if (isAdmin) loadBotConfig();
  }, [isAdmin]);

  // Load Brand Wizard status
  useEffect(() => {
    const checkBrandProfile = async () => {
      try {
        const businessId = localStorage.getItem('korat_business_id');
        if (!businessId) return;

        const { data, error } = await supabase
          .from('negocios')
          .select('marca_identidad')
          .eq('id', businessId)
          .maybeSingle();

        if (!error && data && data.marca_identidad) {
          const rawMarca = data.marca_identidad;
          let respuestas = null;
          
          if (rawMarca.respuestas) {
            respuestas = rawMarca.respuestas;
          } else {
            respuestas = rawMarca;
          }

          if (respuestas && (typeof respuestas === 'object' ? Object.keys(respuestas).length > 0 : String(respuestas).length > 0)) {
            setHasBrandProfile(true);
          }
        }
      } catch (error) {
        // Ignorar error silenciosamente
      }
    };
    if (isAdmin) checkBrandProfile();
  }, [isAdmin]);
  // Load Brand Identity and Brief when switching to 'marca'
  useEffect(() => {
    if (activeTab === 'marca' && isAdmin) {
      const loadBrandIdentity = async () => {
        setLoadingBrand(true);
        const businessId = localStorage.getItem('korat_business_id');
        try {
          // 1. Fetch logo using SECURITY DEFINER RPC — direct SELECT is blocked by RLS since auth.uid()=null
          if (businessId) {
            const { data: logoFromRpc } = await supabase.rpc('get_negocio_logo', {
              p_business_id: businessId
            });
            if (logoFromRpc) {
              setLogoUrl(logoFromRpc);
            } else {
              // Fallback: read from negocio_info table
              const { data: infoItem } = await supabase
                .from('negocio_info')
                .select('valor_texto')
                .eq('clave', 'logo_url')
                .eq('business_id', businessId)
                .maybeSingle();
              if (infoItem?.valor_texto) setLogoUrl(infoItem.valor_texto);
            }
          }

          // 2. Fetch marca_identidad via the brand-wizard endpoint (this webhook exists in n8n)
          try {
            const marcaData = await negocios.getBrandWizardAnswers();
            if (marcaData?.marca_identidad) {
              const mi = marcaData.marca_identidad;
              const identidad = mi?.identidad_generada || (typeof mi === 'object' && !mi.generado ? mi : null);
              if (identidad) setBrandIdentity(identidad);
            }
          } catch {
            // brand-wizard not configured yet — silently ignore
          }
        } catch (e) {
          console.error('Error cargando identidad de marca:', e);
        } finally {
          setLoadingBrand(false);
        }
      };

      const loadBusinessBrief = async () => {
        const businessId = localStorage.getItem('korat_business_id');
        if (!businessId) return;
        setLoadingBrief(true);
        setBriefError(null);
        try {
          const tenantSupabase = getSupabaseClient(businessId);
          const { data, error } = await tenantSupabase
            .from('business_briefs')
            .select('*')
            .eq('business_id', businessId)
            .order('updated_at', { ascending: false })
            .limit(1);
          if (error) throw error;
          const brief = data && data.length > 0 ? data[0] : null;
          if (brief) {
            setBriefId(brief.id || null);
            setBriefData({
              business_name: brief.business_name || '',
              business_type: brief.business_type || 'salon',
              years_operating: brief.years_operating != null ? String(brief.years_operating) : '',
              monthly_revenue: brief.monthly_revenue || '',
              avg_ticket: brief.avg_ticket != null ? String(brief.avg_ticket) : '',
              active_clients: brief.active_clients != null ? String(brief.active_clients) : '',
              top_service_1: brief.top_service_1 || '',
              top_service_2: brief.top_service_2 || '',
              premium_service: brief.premium_service || '',
              hook_service: brief.hook_service || '',
              target_gender: brief.target_gender || '',
              target_age: brief.target_age || '',
              preferred_channel: brief.preferred_channel || '',
              weak_day: brief.weak_day || '',
              main_challenge: brief.main_challenge || '',
              brand_words: brief.brand_words || '',
              brand_color: brief.brand_color || ''
            });
          } else {
            setBriefId(null);
          }
        } catch (e) {
          setBriefError(e?.message || 'Error cargando brief');
        } finally {
          setLoadingBrief(false);
        }
      };

      loadBrandIdentity();
      loadBusinessBrief();
    }
  }, [activeTab, isAdmin]);

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
  const handleBriefField = (field: keyof typeof briefData, value: string) => {
    setBriefData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveBrief = async () => {
    const businessId = localStorage.getItem('korat_business_id');
    if (!businessId) return;
    setSavingBrief(true);
    setBriefError(null);
    try {
      const tenantSupabase = getSupabaseClient(businessId);
      const payload: any = {
        business_id: businessId,
        business_name: briefData.business_name,
        business_type: briefData.business_type || 'salon',
        years_operating: briefData.years_operating ? Number(briefData.years_operating) : null,
        monthly_revenue: briefData.monthly_revenue || null,
        avg_ticket: briefData.avg_ticket ? Number(briefData.avg_ticket) : null,
        active_clients: briefData.active_clients ? Number(briefData.active_clients) : null,
        top_service_1: briefData.top_service_1 || null,
        top_service_2: briefData.top_service_2 || null,
        premium_service: briefData.premium_service || null,
        hook_service: briefData.hook_service || null,
        target_gender: briefData.target_gender || null,
        target_age: briefData.target_age || null,
        preferred_channel: briefData.preferred_channel || null,
        weak_day: briefData.weak_day || null,
        main_challenge: briefData.main_challenge || null,
        brand_words: briefData.brand_words || null,
        brand_color: briefData.brand_color || null
      };

      if (briefId) {
        const { error } = await tenantSupabase
          .from('business_briefs')
          .update(payload)
          .eq('id', briefId);
        if (error) throw error;
      } else {
        const { data, error } = await tenantSupabase
          .from('business_briefs')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        if (data?.id) setBriefId(data.id);
      }
    } catch (e: any) {
      setBriefError(e?.message || 'Error guardando brief');
    } finally {
      setSavingBrief(false);
    }
  };

  const handleDeleteBrief = async () => {
    if (!briefId) return;
    if (!confirm('¿Eliminar brief de marca?')) return;
    setSavingBrief(true);
    setBriefError(null);
    try {
      const tenantSupabase = getSupabaseClient(localStorage.getItem('korat_business_id') || undefined);
      const { error } = await tenantSupabase
        .from('business_briefs')
        .delete()
        .eq('id', briefId);
      if (error) throw error;
      setBriefId(null);
      setBriefData({
        business_name: '',
        business_type: 'salon',
        years_operating: '',
        monthly_revenue: '',
        avg_ticket: '',
        active_clients: '',
        top_service_1: '',
        top_service_2: '',
        premium_service: '',
        hook_service: '',
        target_gender: '',
        target_age: '',
        preferred_channel: '',
        weak_day: '',
        main_challenge: '',
        brand_words: '',
        brand_color: ''
      });
    } catch (e: any) {
      setBriefError(e?.message || 'Error eliminando brief');
    } finally {
      setSavingBrief(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setUploadingLogo(true);
    try {
      const url = await brandSettings.uploadLogo(file);
      setLogoUrl(url);
      setLogoUploadSuccess(true);
      setTimeout(() => setLogoUploadSuccess(false), 3000);
    } catch (e) {
      console.error('Error subiendo logo:', e);
      alert('Error al subir el logo. Asegúrate de que el archivo sea PNG menor a 5MB.');
    } finally {
      setUploadingLogo(false);
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

  // --- Modal de Ausencias ---
  type AbsenceMode = 'falta' | 'medio_dia' | 'programar';
  const [absenceModal, setAbsenceModal] = useState<{staffId: number; staffNombre: string; mode: AbsenceMode; hora: string; fecha: string; motivo: string; saving: boolean;} | null>(null);

  const openAbsenceModal = (staff: StaffDB, mode: AbsenceMode) => {
    setAbsenceModal({ staffId: staff.id, staffNombre: staff.nombre || '?', mode, hora: '14:00', fecha: new Date().toISOString().split('T')[0], motivo: mode === 'falta' ? 'Falta del dia' : mode === 'medio_dia' ? 'Se retiro temprano' : 'Ausencia programada', saving: false });
  };

  const handleConfirmAbsence = async () => {
    if (!absenceModal) return;
    setAbsenceModal(prev => prev ? { ...prev, saving: true } : null);
    try {
      if (absenceModal.mode === 'falta') { await staffDisponibilidad.marcarFaltaHoy(absenceModal.staffId, absenceModal.motivo); }
      else if (absenceModal.mode === 'medio_dia') { await staffDisponibilidad.marcarMedioDia(absenceModal.staffId, absenceModal.hora, absenceModal.motivo); }
      else { await staffDisponibilidad.create({ staff_id: absenceModal.staffId, tipo: 'ausencia', fecha: absenceModal.fecha, motivo: absenceModal.motivo, recurrente: false }); }
      setAbsenceModal(null);
      showSaveStatus();
    } catch (e) { console.error('Error registrando ausencia:', e); setAbsenceModal(prev => prev ? { ...prev, saving: false } : null); }
  };

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
    if (!str || str.toUpperCase() === 'CERRADO') return { start: '', end: '', closed: true };
    try {
      // Formato esperado: "9am - 8pm" o "09:00 - 20:00"
      const [startStr, endStr] = str.split('-').map(s => s.trim());

      const parseTime = (t: string) => {
        if (!t) return '';
        // Si ya está en formato HH:mm (militar de 24hrs) devuélvelo tal cual
        if (/^\d{1,2}:\d{2}$/.test(t)) return t.padStart(5, '0');
        
        const match = t.match(/(\d+)(?::(\d+))?(am|pm)/i);
        if (!match) return t; // fallback
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
    if (!newStaff.nombre) return;

    // VALIDAR LIMITE DE ADMINS (Max 2)
    const adminRoles = ['Dueño', 'Admin', 'Gerente'];
    if (adminRoles.includes(newStaff.rol || '')) {
      const currentAdmins = staffFromDB.filter(s => adminRoles.includes(s.rol || ''));
      if (currentAdmins.length >= 2) {
        alert('Límite alcanzado: El sistema solo permite un máximo de 2 administradores/dueños por negocio.');
        return;
      }
    }

    try {
      await equipo.create({
        nombre: newStaff.nombre,
        email: newStaff.email || null,
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

    const originalState = staff.activo;
    const newState = !originalState;

    // Actualización Optimista
    setStaffFromDB(prev => prev.map(s =>
      s.id === staffId ? { ...s, activo: newState } : s
    ));

    try {
      await equipo.toggleActive(staffId, newState);
      showSaveStatus();
      // Refrescar el contexto global para actualizar widgets y agendas
      await refreshDashboard(true);
    } catch (error: any) {
      console.error('Error cambiando estado:', error);
      alert('Error al guardar: ' + (error?.message || 'Error de conexión'));
      
      // Revertir cambio optimista
      setStaffFromDB(prev => prev.map(s =>
        s.id === staffId ? { ...s, activo: originalState } : s
      ));
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

    // VALIDAR LIMITE DE ADMINS (Max 2)
    const adminRoles = ['Dueño', 'Admin', 'Gerente'];
    const isNewRoleAdmin = adminRoles.includes(editStaffData.rol || '');
    const wasAdmin = adminRoles.includes(editingStaff.rol || '');

    if (isNewRoleAdmin && !wasAdmin) {
      const currentAdmins = staffFromDB.filter(s => adminRoles.includes(s.rol || ''));
      if (currentAdmins.length >= 2) {
        alert('Límite alcanzado: El sistema solo permite un máximo de 2 administradores/dueños por negocio.');
        return;
      }
    }

    try {
      await equipo.update(editingStaff.id, {
        nombre: editStaffData.nombre,
        email: editStaffData.email || null,
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

      // Convert array to object keyed by 'clave'
      const dataMap: Record<string, string> = {};
      const keysFromDB = new Set<string>();

      (data as NegocioInfoItem[]).forEach((item: NegocioInfoItem) => {
        dataMap[item.clave] = item.valor_texto || '';
        keysFromDB.add(item.clave); // ✅ Guardar clave como existente en BD
      });



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
  const handleScheduleChange = (day: 'weekdays' | 'saturday' | 'sunday' | 'lunch', field: 'start' | 'end' | 'closed', value: any) => {
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

        await negocioInfo.update(clave, negocioData[clave]);
      } else {
        // La clave NO existe → CREAR (POST)

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

  // Cargar días cerrados cuando cambia a tab closedDays
  useEffect(() => {
    if (activeTab === 'closedDays' && isAdmin) {
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

  // Tab definitions (with feature gating for Free plan)
  const tabs = [
    { id: 'general'   as SettingsTab, label: 'General',            icon: Building2,  featureKey: null },
    { id: 'services'  as SettingsTab, label: 'Servicios',           icon: Palette,    featureKey: null },
    { id: 'closedDays'as SettingsTab, label: 'Días Cerrados',       icon: Calendar,   featureKey: 'dias_cerrados' },
    { id: 'subscription'as SettingsTab,label: 'Mi Plan',            icon: CreditCard, featureKey: null },
    { id: 'staff'     as SettingsTab, label: 'Equipo',              icon: Users,      featureKey: 'staff', proBadge: true },
    { id: 'marca'     as SettingsTab, label: 'Identidad de Marca',  icon: Sparkles,   featureKey: 'identidad_marca' },
    { id: 'chatbot'   as SettingsTab, label: 'Nilah IA',            icon: Bot,        featureKey: 'chatbot', proBadge: true },
    { id: 'rescate'   as SettingsTab, label: 'Retención IA',        icon: Activity,   featureKey: 'retencion', proBadge: true },
    { id: 'booking'   as SettingsTab, label: 'Agenda Pública',      icon: Calendar,   featureKey: null },
  ];

  const tabHasAccess = (featureKey: string | null | undefined) =>
    !featureKey || hasSaaSFeature('configuracion', featureKey);

  // Sort tabs so accessible ones (Free plan) appear first, and locked ones appear at the end
  const sortedTabs = [...tabs].sort((a, b) => {
    const aAccess = tabHasAccess(a.featureKey);
    const bAccess = tabHasAccess(b.featureKey);
    if (aAccess && !bAccess) return -1;
    if (!aAccess && bAccess) return 1;
    return 0;
  });

  const hasBrandIdentity = !!brandIdentity && Object.keys(brandIdentity).length > 0;

  return (
    <div className="w-full min-w-0 max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-4 py-5 sm:p-0">
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
      <div className="flex gap-1 overflow-x-auto hide-scrollbar rounded-xl bg-gray-100 p-1 dark:bg-[#1A1A1A]">
        {sortedTabs.map(tab => {
          const hasAccess = tabHasAccess(tab.featureKey);
          return (
            <button
              key={tab.id}
              onClick={() => hasAccess && setActiveTab(tab.id)}
              title={!hasAccess ? '🔒 Disponible en Plan Pro' : undefined}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                !hasAccess
                  ? 'opacity-40 cursor-not-allowed text-gray-400 dark:text-gray-600'
                  : activeTab === tab.id
                    ? 'bg-white text-gray-900 shadow dark:bg-[#2A2A2A] dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {hasAccess ? <tab.icon size={16} /> : <Lock size={15} />}
              {tab.label}
              {tab.proBadge && !isPro && hasAccess && (
                <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">

        {/* BRAND IDENTITY TAB */}
        {activeTab === 'marca' && (
          <div className="space-y-6">
            {loadingBrand && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
              </div>
            )}
            {!loadingBrand && (
              <>
                <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-gradient-to-br from-violet-50 via-white to-rose-50 p-6 shadow-sm dark:border-white/5 dark:from-[#1a1b2b] dark:via-[#141421] dark:to-[#1f1b2e]">
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500">Identidad de Marca</p>
                      <h2 className="mt-2 text-xl font-bold text-gray-900 dark:text-white">La voz que Nilah usa por ti</h2>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Ajusta el brief y la identidad para que cada mensaje suene a tu salón.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-200">Logo</span>
                      <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-200">Perfil IA</span>
                      <span className="rounded-full border border-white/60 bg-white/70 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-gray-200">Brief</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-white/5 dark:bg-[#161622]">
                  <div className="border-b border-gray-100 px-5 py-4 dark:border-white/5">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Logo del Salón</h3>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      Sube tu logo en PNG para personalizar tus materiales automáticos.
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="flex flex-col items-center gap-6 sm:flex-row">
                      <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                        {logoUrl ? (
                          <img src={logoUrl} alt="Logo del salón" className="h-full w-full object-contain p-2" />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-center">
                            <Palette size={24} className="text-gray-400" />
                            <span className="text-xs text-gray-400">Sin logo</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col gap-3">
                        <label className="relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-violet-200 bg-violet-50 px-6 py-4 transition-colors hover:border-violet-400 hover:bg-violet-100 dark:border-violet-500/20 dark:bg-violet-500/5 dark:hover:bg-violet-500/10">
                          <Sparkles size={20} className="text-violet-500" />
                          <span className="text-sm font-medium text-violet-700 dark:text-violet-400">
                            {uploadingLogo ? 'Subiendo...' : logoUploadSuccess ? '✅ ¡Logo guardado!' : 'Seleccionar archivo PNG'}
                          </span>
                          <span className="text-xs text-violet-500/70">PNG recomendado · Máx 5MB</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="absolute inset-0 cursor-pointer opacity-0"
                            disabled={uploadingLogo}
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleLogoUpload(f);
                            }}
                          />
                        </label>
                        {logoUrl && (
                          <p className="truncate text-xs text-gray-500 dark:text-gray-600">
                            URL: {logoUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ✨ BRAND THEME PICKER — Identidad de Color */}
                <BrandThemePicker />

                {/* ✨ BRAND IDENTITY WIZARD CARD (Moved here) */}
                <section className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/80 via-white to-pink-50/80 p-6 shadow-sm backdrop-blur dark:border-violet-500/20 dark:from-violet-500/10 dark:via-[#161622] dark:to-pink-500/5 transition-all hover:border-violet-300 dark:hover:border-violet-500/40">
                  <div className="absolute top-0 right-0 w-40 h-40 opacity-20 dark:opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/25">
                      <Sparkles size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Identidad de Marca del Bot</h3>
                      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed md:max-w-[90%]">
                        {hasBrandProfile
                          ? 'Has configurado la identidad de marca de Nilah IA. Editala visualmente para seguir afinando tu voz.'
                          : 'Dale una voz única a tu chatbot. Responde unas preguntas simples y la IA creará la personalidad perfecta para tu negocio.'}
                      </p>
                      <Link
                        to="/nilah/app/brand-wizard"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-95"
                      >
                        <Bot size={18} />
                        {hasBrandProfile ? 'Ver / Editar Identidad' : 'Crear Identidad de Marca'}
                      </Link>
                    </div>
                  </div>
                </section>

                {hasBrandIdentity && (
                  <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-[#161622]">
                    <div className="border-b border-gray-100 px-6 py-5 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-rose-500/20 text-violet-600 dark:text-violet-300">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white">Perfil Activo de IA</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">La personalidad que Nilah utiliza en cada campaña.</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-5 p-6">
                      <div className="flex flex-wrap gap-2">
                        {brandIdentity.arquetipo && (
                          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300 shadow-sm">
                            Arquetipo: {brandIdentity.arquetipo}
                          </span>
                        )}
                        {brandIdentity.tono_voz && (
                          <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 shadow-sm">
                            Tono: {brandIdentity.tono_voz}
                          </span>
                        )}
                        {brandIdentity.trato_cliente && (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 shadow-sm">
                            Trato: {brandIdentity.trato_cliente}
                          </span>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        {brandIdentity.emojis && (
                          <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-5 dark:border-amber-500/20 dark:bg-amber-500/5">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-600/80 dark:text-amber-400/80">Emojis de marca</p>
                            <p className="text-2xl">{Array.isArray(brandIdentity.emojis) ? brandIdentity.emojis.join(' ') : brandIdentity.emojis}</p>
                          </div>
                        )}
                        {brandIdentity.valores_marca && (
                          <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600/80 dark:text-blue-400/80">Valores de marca</p>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                              {Array.isArray(brandIdentity.valores_marca) ? brandIdentity.valores_marca.join(' · ') : brandIdentity.valores_marca}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!briefId && (
                  <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/40 p-10 text-center dark:border-white/10 dark:bg-white/[0.02]">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                      <Sparkles size={28} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Aún no hay identidad de marca generada</h3>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Completa el brief para que Nilah construya tu perfil y personalice todas tus promociones.</p>
                  </div>
                )}

                <section className="relative overflow-hidden rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50/80 via-white to-pink-50/80 p-6 shadow-sm backdrop-blur dark:border-violet-500/20 dark:from-violet-500/10 dark:via-[#161622] dark:to-pink-500/5 transition-all hover:border-violet-300 dark:hover:border-violet-500/40">
                  <div className="absolute top-0 right-0 w-40 h-40 opacity-20 dark:opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />
                  
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start mb-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg shadow-violet-500/25">
                      <Target size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Brief de Marca</h3>
                      <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed md:max-w-[90%]">
                        Gestiona los detalles de tu negocio que nutren la inteligencia de Nilah.
                      </p>
                      
                      {!isEditingBrief && (
                        <button
                          onClick={() => setIsEditingBrief(true)}
                          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-violet-500/20 transition-all hover:shadow-lg hover:shadow-violet-500/30 hover:scale-[1.02] active:scale-95"
                        >
                          <Pencil size={18} />
                          Editar Brief
                        </button>
                      )}
                    </div>
                  </div>

                </section>
              </>
            )}
          </div>
        )}
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

                {/* PWA INSTALL BANNER */}
                {isInstallable && !isInstalled && (
                  <motion.section
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    style={{ borderColor: 'color-mix(in srgb, var(--color-violet-500) 30%, transparent)', background: 'color-mix(in srgb, var(--color-violet-500) 6%, var(--color-bg-elevated))' }}
                  >
                    <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-violet-400/20 blur-2xl pointer-events-none" />
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Smartphone size={20} className="text-violet-500" /> App Móvil de Nilah
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Instala la aplicación en tu teléfono para notificaciones push instantáneas y uso más rápido.</p>
                    </div>
                    <button
                      onClick={promptInstall}
                      className="shrink-0 flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-violet-700 transition-colors"
                    >
                      Instalar App
                    </button>
                  </motion.section>
                )}

                {/* PUSH NOTIFICATIONS BANNER */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  style={{ borderColor: 'rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.04)' }}
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-400/20 blur-2xl pointer-events-none" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Bell size={20} className="text-blue-500" /> Notificaciones Push
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Activa las notificaciones para recibir alertas críticas en tu dispositivo.</p>
                  </div>
                  <button
                    onClick={async () => {
                      const { subscribeToPushNotifications } = await import('../services/push');
                      if (user?.id) {
                        const sub = await subscribeToPushNotifications(user.id);
                        if (sub) alert('¡Notificaciones activadas con éxito! ✅');
                      }
                    }}
                    className="shrink-0 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
                  >
                    Activar Alertas
                  </button>
                </motion.section>

                {/* SECCIÓN 1: Información Básica */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1A1A1A]"
                >
                  <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/50 p-5 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/20">
                      <Building2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Información Básica</h2>
                      <p className="text-sm text-gray-500">Datos principales y horarios operativos</p>
                    </div>
                  </div>

                  <div className="space-y-8 p-5 md:p-6">
                    {/* Contact Info */}
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="group space-y-1.5 rounded-xl border border-transparent bg-gray-50/50 p-4 transition-colors hover:bg-gray-50 dark:bg-white/[0.01] dark:hover:bg-white/[0.02]">
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1.5"><MapPin size={16} /> Ubicación</span>
                          <textarea
                            value={negocioData.ubicacion_contacto || ''}
                            onChange={(e) => handleNegocioFieldChange('ubicacion_contacto', e.target.value)}
                            onBlur={() => unsavedNegocioChanges.has('ubicacion_contacto') && handleSaveNegocioField('ubicacion_contacto')}
                            placeholder="Ej: Calle Ficticia 123..."
                            rows={2}
                            className="mt-1 w-full resize-none bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                          />
                        </label>
                      </div>

                      <div className="group space-y-1.5 rounded-xl border border-transparent bg-gray-50/50 p-4 transition-colors hover:bg-gray-50 dark:bg-white/[0.01] dark:hover:bg-white/[0.02]">
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1.5"><Smartphone size={16} /> WhatsApp del Negocio</span>
                          <input
                            type="tel"
                            value={negocioData.whatsapp || ''}
                            onChange={(e) => handleNegocioFieldChange('whatsapp', e.target.value)}
                            onBlur={() => unsavedNegocioChanges.has('whatsapp') && handleSaveNegocioField('whatsapp')}
                            placeholder="+51981482289"
                            className="mt-1 w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                          />
                        </label>
                      </div>
                    </div>

                    {/* Schedule Cards */}
                    <div className="space-y-4">
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                        <Clock size={14} /> Horarios de Atención
                      </h3>

                      <div className="grid gap-3 md:grid-cols-3">
                        {/* Lunes a Viernes */}
                        <motion.div whileHover={{ scale: 1.01 }} className="flex flex-col justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#1f1f1f]">
                          <div className="mb-4 flex items-center justify-between">
                            <span className="font-semibold text-gray-900 dark:text-white">Lunes a Viernes</span>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Apertura</span>
                              <input type="time" value={scheduleState.weekdays.start} onChange={(e) => handleScheduleChange('weekdays', 'start', e.target.value)} onBlur={() => handleScheduleChange('weekdays', 'start', scheduleState.weekdays.start)} className="w-full min-w-0 cursor-text rounded-lg bg-gray-50 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-[#141414] dark:text-white" />
                            </div>
                            <span className="pt-4 text-gray-300 shrink-0">-</span>
                            <div className="flex-1 min-w-0">
                              <span className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Cierre</span>
                              <input type="time" value={scheduleState.weekdays.end} onChange={(e) => handleScheduleChange('weekdays', 'end', e.target.value)} onBlur={() => handleScheduleChange('weekdays', 'end', scheduleState.weekdays.end)} className="w-full min-w-0 cursor-text rounded-lg bg-gray-50 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-[#141414] dark:text-white" />
                            </div>
                          </div>
                        </motion.div>

                        {/* Sábado */}
                        <motion.div whileHover={{ scale: 1.01 }} className={`flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-colors ${scheduleState.saturday.closed ? 'border-dashed border-gray-200 bg-gray-50 dark:border-white/5 dark:bg-[#141414]' : 'border-gray-100 bg-white dark:border-white/5 dark:bg-[#1f1f1f]'}`}>
                          <div className="mb-4 flex items-center justify-between">
                            <span className={`font-semibold ${scheduleState.saturday.closed ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>Sábados</span>
                            <button onClick={() => handleScheduleChange('saturday', 'closed', !scheduleState.saturday.closed)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!scheduleState.saturday.closed ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'}`}>
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!scheduleState.saturday.closed ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          {!scheduleState.saturday.closed ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Apertura</span>
                                <input type="time" value={scheduleState.saturday.start} onChange={(e) => handleScheduleChange('saturday', 'start', e.target.value)} onBlur={() => handleScheduleChange('saturday', 'start', scheduleState.saturday.start)} className="w-full min-w-0 cursor-text rounded-lg bg-gray-50 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-[#141414] dark:text-white" />
                              </div>
                              <span className="pt-4 text-gray-300 shrink-0">-</span>
                              <div className="flex-1 min-w-0">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Cierre</span>
                                <input type="time" value={scheduleState.saturday.end} onChange={(e) => handleScheduleChange('saturday', 'end', e.target.value)} onBlur={() => handleScheduleChange('saturday', 'end', scheduleState.saturday.end)} className="w-full min-w-0 cursor-text rounded-lg bg-gray-50 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-[#141414] dark:text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-[60px] items-center justify-center rounded-lg bg-gray-100/50 text-[13px] font-medium text-gray-400 dark:bg-white/5">
                              Día Cerrado
                            </div>
                          )}
                        </motion.div>

                        {/* Domingo */}
                        <motion.div whileHover={{ scale: 1.01 }} className={`flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-colors ${scheduleState.sunday.closed ? 'border-dashed border-gray-200 bg-gray-50 dark:border-white/5 dark:bg-[#141414]' : 'border-gray-100 bg-white dark:border-white/5 dark:bg-[#1f1f1f]'}`}>
                          <div className="mb-4 flex items-center justify-between">
                            <span className={`font-semibold ${scheduleState.sunday.closed ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>Domingos</span>
                            <button onClick={() => handleScheduleChange('sunday', 'closed', !scheduleState.sunday.closed)} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!scheduleState.sunday.closed ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'}`}>
                              <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!scheduleState.sunday.closed ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </div>
                          {!scheduleState.sunday.closed ? (
                            <div className="flex items-center gap-2 sm:gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Apertura</span>
                                <input type="time" value={scheduleState.sunday.start} onChange={(e) => handleScheduleChange('sunday', 'start', e.target.value)} onBlur={() => handleScheduleChange('sunday', 'start', scheduleState.sunday.start)} className="w-full min-w-0 cursor-text rounded-lg bg-gray-50 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-[#141414] dark:text-white" />
                              </div>
                              <span className="pt-4 text-gray-300 shrink-0">-</span>
                              <div className="flex-1 min-w-0">
                                <span className="mb-1 block text-[10px] font-medium uppercase text-gray-400">Cierre</span>
                                <input type="time" value={scheduleState.sunday.end} onChange={(e) => handleScheduleChange('sunday', 'end', e.target.value)} onBlur={() => handleScheduleChange('sunday', 'end', scheduleState.sunday.end)} className="w-full min-w-0 cursor-text rounded-lg bg-gray-50 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:bg-[#141414] dark:text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className="flex h-[60px] items-center justify-center rounded-lg bg-gray-100/50 text-[13px] font-medium text-gray-400 dark:bg-white/5">
                              Día Cerrado
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Almuerzo */}
                      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-white/5 dark:bg-[#1A1A1A]">
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">🍽️</span>
                            <div>
                              <span className="block font-semibold text-gray-900 dark:text-white">Horario de Almuerzo</span>
                              <span className="block text-[11px] text-gray-500">Bloqueo automático en agenda</span>
                            </div>
                          </div>
                          <button onClick={(e) => { e.preventDefault(); handleScheduleChange('lunch', 'closed', !scheduleState.lunch.closed); }} className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!scheduleState.lunch.closed ? 'bg-violet-500' : 'bg-gray-200 dark:bg-white/10'}`}>
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!scheduleState.lunch.closed ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        {!scheduleState.lunch.closed ? (
                          <div className="flex max-w-sm items-center gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <input type="time" value={scheduleState.lunch.start} onChange={(e) => handleScheduleChange('lunch', 'start', e.target.value)} onBlur={() => handleScheduleChange('lunch', 'start', scheduleState.lunch.start)} className="w-full min-w-0 cursor-text rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                            </div>
                            <span className="text-gray-300 shrink-0">-</span>
                            <div className="flex-1 min-w-0">
                              <input type="time" value={scheduleState.lunch.end} onChange={(e) => handleScheduleChange('lunch', 'end', e.target.value)} onBlur={() => handleScheduleChange('lunch', 'end', scheduleState.lunch.end)} className="w-full min-w-0 cursor-text rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[13px] text-gray-500">Sin horario de almuerzo de equipo.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.section>

                {/* SECCIÓN 2: Redes Sociales */}
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#1A1A1A]"
                >
                  <div className="flex items-center gap-4 border-b border-gray-100 bg-gray-50/50 p-5 dark:border-white/5 dark:bg-white/[0.02]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-500/20">
                      <MessageCircle className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Redes Sociales</h2>
                      <p className="text-sm text-gray-500">Conecta tus perfiles para Nilah</p>
                    </div>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6 lg:grid-cols-3">
                    <div className="group relative rounded-xl border border-gray-100 bg-gray-50/50 p-1 transition-colors focus-within:border-pink-500/50 focus-within:ring-2 focus-within:ring-pink-500/20 dark:border-white/5 dark:bg-[#141414]">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 p-1.5 text-white">
                        <Instagram size={14} />
                      </div>
                      <input
                        type="text"
                        value={negocioData.Instagram || ''}
                        onChange={(e) => handleNegocioFieldChange('Instagram', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('Instagram') && handleSaveNegocioField('Instagram')}
                        placeholder="@tu_salon_beauty"
                        className="w-full bg-transparent py-3 pl-12 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                      />
                    </div>

                    <div className="group relative rounded-xl border border-gray-100 bg-gray-50/50 p-1 transition-colors focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-white/5 dark:bg-[#141414]">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md bg-blue-500 p-1.5 text-white">
                        <Facebook size={14} />
                      </div>
                      <input
                        type="text"
                        value={negocioData.Facebook || ''}
                        onChange={(e) => handleNegocioFieldChange('Facebook', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('Facebook') && handleSaveNegocioField('Facebook')}
                        placeholder="@tu_salon_fb"
                        className="w-full bg-transparent py-3 pl-12 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                      />
                    </div>

                    <div className="group relative rounded-xl border border-gray-100 bg-gray-50/50 p-1 transition-colors focus-within:border-gray-500/50 focus-within:ring-2 focus-within:ring-gray-500/20 dark:border-white/5 dark:bg-[#141414]">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 rounded-md bg-black p-1.5 text-white dark:bg-white dark:text-black">
                        <span className="flex h-3.5 w-3.5 items-center justify-center font-serif text-[10px] font-bold">t</span>
                      </div>
                      <input
                        type="text"
                        value={negocioData.Tiktok || ''}
                        onChange={(e) => handleNegocioFieldChange('Tiktok', e.target.value)}
                        onBlur={() => unsavedNegocioChanges.has('Tiktok') && handleSaveNegocioField('Tiktok')}
                        placeholder="@tu_salon_tiktok"
                        className="w-full bg-transparent py-3 pl-12 pr-4 text-sm font-medium text-gray-900 placeholder-gray-400 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </motion.section>

                {/* SECCIÓN 3: Métodos de Pago */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-[#141414]/70"
                >
                  <div className="border-b border-gray-100 bg-emerald-50/50 px-6 py-4 dark:border-white/5 dark:bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Métodos de Pago</h2>
                        <p className="text-sm text-gray-500">¿Cómo pueden pagarte tus clientes?</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <textarea
                      value={negocioData.metodos_pago || ''}
                      onChange={(e) => handleNegocioFieldChange('metodos_pago', e.target.value)}
                      onBlur={() => unsavedNegocioChanges.has('metodos_pago') && handleSaveNegocioField('metodos_pago')}
                      placeholder="Ej: Efectivo (10% de descuento), Yape, Plin, Tarjetas..."
                      rows={2}
                      className="w-full rounded-xl border-none bg-gray-50/50 p-4 text-sm text-gray-900 outline-none ring-1 ring-gray-200 transition-all focus:ring-emerald-500 focus:bg-white dark:bg-[#1A1A1A]/50 dark:text-white dark:ring-white/10 dark:focus:ring-emerald-500"
                    />
                  </div>
                </motion.section>

                {/* SECCIÓN 4: Políticas del Negocio */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-[#141414]/70"
                >
                  <div className="border-b border-gray-100 bg-amber-50/50 px-6 py-4 dark:border-white/5 dark:bg-amber-500/5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                        <Settings2 className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Políticas de Reserva</h2>
                        <p className="text-sm text-gray-500">Reglas que el chatbot comunicará a los clientes</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <textarea
                      value={negocioData.politicas_reserva || ''}
                      onChange={(e) => handleNegocioFieldChange('politicas_reserva', e.target.value)}
                      onBlur={() => unsavedNegocioChanges.has('politicas_reserva') && handleSaveNegocioField('politicas_reserva')}
                      placeholder="Ej: Cancelaciones con 4hs de anticipación. Tolerancia de 15 min."
                      rows={3}
                      className="w-full rounded-xl border-none bg-gray-50/50 p-4 text-sm text-gray-900 outline-none ring-1 ring-gray-200 transition-all focus:ring-amber-500 focus:bg-white dark:bg-[#1A1A1A]/50 dark:text-white dark:ring-white/10 dark:focus:ring-amber-500"
                    />
                  </div>
                </motion.section>

                {/* SECCIÓN 5: FAQ del Chatbot */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-[#141414]/70"
                >
                  <div className="border-b border-gray-100 bg-blue-50/50 px-6 py-4 dark:border-white/5 dark:bg-blue-500/5">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preguntas Frecuentes (FAQ)</h2>
                        <p className="text-sm text-gray-500">Respuestas que Nilah usará para contestar dudas comunes</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <textarea
                      value={negocioData.faq || ''}
                      onChange={(e) => handleNegocioFieldChange('faq', e.target.value)}
                      onBlur={() => unsavedNegocioChanges.has('faq') && handleSaveNegocioField('faq')}
                      placeholder="Ej: - ¿Hacen domicilios? Solo eventos especiales&#10;- ¿Tienen estacionamiento? Sí, gratuito"
                      rows={4}
                      className="w-full rounded-xl border-none bg-gray-50/50 p-4 text-sm font-mono text-gray-900 outline-none ring-1 ring-gray-200 transition-all focus:ring-blue-500 focus:bg-white dark:bg-[#1A1A1A]/50 dark:text-white dark:ring-white/10 dark:focus:ring-blue-500"
                    />
                  </div>
                </motion.section>

                {/* SECCIÓN 6: Promociones Activas */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/50 to-pink-50/50 shadow-sm backdrop-blur-xl relative dark:border-violet-500/20 dark:from-violet-500/5 dark:to-pink-500/5 dark:bg-[#141414]"
                >
                  {/* Decorative blur elements for premium feel */}
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-violet-400/20 blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-pink-400/20 blur-3xl pointer-events-none"></div>

                  <div className="relative border-b border-violet-100 bg-white/40 px-6 py-4 dark:border-white/5 dark:bg-black/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-violet-100 p-2.5 text-violet-600 shadow-inner dark:bg-violet-500/20 dark:text-violet-400">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Promociones Activas</h2>
                          <p className="text-sm text-gray-500">¿Qué ofertas especiales debería mencionar el chatbot?</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { key: 'Promociones General', label: 'General', icon: '🎁', color: 'from-violet-500 to-purple-600', ring: 'focus:ring-violet-500' },
                        { key: 'Promociones Uñas', label: 'Uñas', icon: '💅', color: 'from-pink-500 to-rose-600', ring: 'focus:ring-pink-500' },
                        { key: 'Promociones Pies', label: 'Pies', icon: '🦶', color: 'from-amber-500 to-orange-600', ring: 'focus:ring-amber-500' },
                        { key: 'Promociones Pestañas', label: 'Pestañas', icon: '👁️', color: 'from-blue-500 to-indigo-600', ring: 'focus:ring-blue-500' },
                        { key: 'Promociones Cabello', label: 'Cabello', icon: '💇', color: 'from-emerald-500 to-teal-600', ring: 'focus:ring-emerald-500' },
                        { key: 'Promociones Rostro', label: 'Rostro', icon: '🧖', color: 'from-rose-500 to-pink-600', ring: 'focus:ring-rose-500' },
                      ].map(promo => {
                        const textoKey = promo.key;
                        const hasContent = negocioData[textoKey] && negocioData[textoKey] !== '(Sin promos activas actualmente)';

                        return (
                          <motion.div
                            whileHover={{ y: -2 }}
                            key={promo.key}
                            className="group flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm transition-all hover:bg-white dark:border-white/10 dark:bg-[#1A1A1A]/80 dark:hover:bg-[#222]"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${promo.color} text-white shadow-md`}>
                                  <span className="text-xl">{promo.icon}</span>
                                </div>
                                <span className="font-semibold text-gray-800 dark:text-white">{promo.label}</span>
                              </div>
                              {hasContent && (
                                <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                                  Activa
                                </span>
                              )}
                            </div>

                            <div className="relative mt-1">
                              <textarea
                                value={negocioData[textoKey] || ''}
                                onChange={(e) => handleNegocioFieldChange(textoKey, e.target.value)}
                                onBlur={() => unsavedNegocioChanges.has(textoKey) && handleSaveNegocioField(textoKey)}
                                placeholder="Ej: 15% OFF en primera visita..."
                                rows={2}
                                className={`w-full rounded-xl border-none bg-gray-50/80 p-3 text-sm text-gray-900 outline-none ring-1 ring-gray-200 transition-all focus:bg-white ${promo.ring} dark:bg-black/20 dark:text-white dark:ring-white/10`}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </motion.section>

                {/* SECCIÓN 7: Cuenta del Usuario */}
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="overflow-hidden rounded-2xl border border-gray-100 bg-white/70 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-[#141414]/70"
                >
                  <div className="p-6">
                    <h2 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">Tus Datos de Cuenta</h2>
                    <div className="flex items-center gap-5 rounded-2xl border border-gray-100 p-4 bg-gray-50/50 dark:border-white/5 dark:bg-[#1A1A1A]/50">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-2xl font-bold text-white shadow-lg shadow-violet-500/20">
                        {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{user?.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{user?.email}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                            <ShieldAlert className="h-3 w-3" />
                            {user?.role}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${user?.plan === 'Pro'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300'
                            : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                            {user?.plan === 'Pro' ? <Crown className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            Plan {user?.plan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
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
                        <p className="text-sm text-gray-500">{staffFromDB.filter(s => s.activo).length} usuarios activos</p>
                      </div>
                      <button
                        onClick={() => setIsAddStaffModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-bold text-white hover:bg-violet-600"
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
                            const rawCats = (s.cat_staff || s.especialidad || 'multi').split(',').map(x => normalize(x));
                            if (catObj.id === 0) {
                              // "General" catches staff with cat_staff = 'multi' or no match
                              const matchesAny = categoriasData.some(c => rawCats.includes(normalize(c.nombre)));
                              return !matchesAny || rawCats.includes('multi') || rawCats.includes('general');
                            }
                            return rawCats.includes(normalize(catObj.nombre));
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
                                    className="rounded-xl border border-gray-100 bg-white p-4 sm:p-6 shadow-sm dark:border-white/10 dark:bg-[#141414]"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                                      <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex items-center justify-center text-white font-bold text-lg sm:text-base shadow-inner shrink-0">
                                          {staff.nombre?.split(' ').map(n => n[0]).join('') || '?'}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium text-lg sm:text-base dark:text-white leading-tight mb-0.5">{staff.nombre}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${staff.activo
                                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                              : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                                              }`}>
                                              {staff.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-500">{staff.email || staff.telefono || 'Sin contacto'}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 self-end sm:self-auto">
                                        <button
                                          onClick={() => handleStaffActiveToggle(staff.id)}
                                          className={`transition-colors p-1 ${staff.activo ? 'text-emerald-500' : 'text-gray-400'}`}
                                        >
                                          {staff.activo ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                                        </button>
                                        <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                                        <button
                                          onClick={() => handleOpenEditStaff(staff)}
                                          className="rounded-lg p-2 text-gray-500 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400 transition bg-gray-50 dark:bg-white/5"
                                          title="Editar"
                                        >
                                          <Pencil size={18} />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteStaff(staff.id)}
                                          className="rounded-lg p-2 text-gray-500 hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition bg-gray-50 dark:bg-white/5"
                                          title="Eliminar"
                                        >
                                          <Trash2 size={18} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Role Badge + Especialidad Badge + cat_staff badge */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="rounded-lg bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                                        {(staff as any).nivel_experiencia || staff.rol || 'Staff'}
                                      </span>
                                      {/* Mostrar cat_staff si existe, o fallback a especialidad */}
                                      {(staff.cat_staff || (staff.especialidad && staff.especialidad !== 'multi')) && (
                                        <div className="flex gap-1 flex-wrap">
                                          {(() => {
                                            const catsStr = staff.cat_staff || (staff.especialidad !== 'multi' ? staff.especialidad : '');
                                            if (!catsStr) return null;
                                            
                                            // Normalizar y deduplicar categoras
                                            const uniqueCats = Array.from(new Set(
                                              catsStr.split(',')
                                                .map(c => c.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
                                                .filter(Boolean)
                                            ));

                                            return uniqueCats.map((c, i) => {
                                              return (
                                                <span
                                                  key={i}
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
                                                  {c === 'manos' ? '💅 Manos' :
                                                    c === 'pies' ? '🦶 Pies' :
                                                      c === 'pestanas' ? '👁️ Pestañas' :
                                                        c === 'rostro' ? '💆 Rostro' :
                                                          c === 'cabello' ? '💇 Cabello' : 
                                                          c.charAt(0).toUpperCase() + c.slice(1)}
                                                </span>
                                              );
                                            });
                                          })()}
                                        </div>
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
                                        <button onClick={() => openAbsenceModal(staff, 'falta')} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:hover:bg-rose-900/30 font-medium transition-colors">
                                           ❌ Falta Hoy
                                         </button>
                                         <button onClick={() => openAbsenceModal(staff, 'medio_dia')} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 font-medium transition-colors">
                                           🌗 Medio Día
                                         </button>
                                         <button onClick={() => openAbsenceModal(staff, 'programar')} className="text-[11px] px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 font-medium transition-colors">
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
                      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                        <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300 max-h-[90vh] flex flex-col">
                          <div className="shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                            <h3 className="text-lg font-semibold dark:text-white">Agregar Miembro</h3>
                            <button
                              onClick={() => setIsAddStaffModalOpen(false)}
                              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4 overflow-y-auto">
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
                              <div className="flex flex-wrap gap-2">
                                {categoriasData.filter(c => c.activo).map(c => {
                                  const val = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                  const currentCats = newStaff.cat_staff.split(',').map(x => x.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
                                  const isSelected = currentCats.includes(val);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        const cats = newStaff.cat_staff ? newStaff.cat_staff.split(',').map(x => x.trim()) : [];
                                        const newCats = isSelected 
                                          ? cats.filter(x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') !== val) 
                                          : [...cats, val];
                                        setNewStaff({ ...newStaff, cat_staff: newCats.join(',') });
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
                                    >
                                      {c.emoji || '✨'} {c.nombre}
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentCats = newStaff.cat_staff.split(',').map(x => x.trim().toLowerCase());
                                    const isSelected = currentCats.includes('multi');
                                    const cats = newStaff.cat_staff ? newStaff.cat_staff.split(',').map(x => x.trim()) : [];
                                    const newCats = isSelected ? cats.filter(x => x.toLowerCase() !== 'multi') : [...cats, 'multi'];
                                    setNewStaff({ ...newStaff, cat_staff: newCats.join(',') });
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${newStaff.cat_staff.split(',').map(x => x.trim().toLowerCase()).includes('multi') ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
                                >
                                  ✨ General / Multi-área
                                </button>
                              </div>
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
                      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                        <div className="w-full max-w-md max-h-[90vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
                          <div className="shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
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
                          <div className="p-6 space-y-4 overflow-y-auto">
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
                              <div className="flex flex-wrap gap-2">
                                {categoriasData.filter(c => c.activo).map(c => {
                                  const val = c.nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                                  const currentCats = editStaffData.cat_staff.split(',').map(x => x.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
                                  const isSelected = currentCats.includes(val);
                                  return (
                                    <button
                                      key={c.id}
                                      type="button"
                                      onClick={() => {
                                        const cats = editStaffData.cat_staff ? editStaffData.cat_staff.split(',').map(x => x.trim()) : [];
                                        const newCats = isSelected 
                                          ? cats.filter(x => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') !== val) 
                                          : [...cats, val];
                                        setEditStaffData({ ...editStaffData, cat_staff: newCats.join(',') });
                                      }}
                                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
                                    >
                                      {c.emoji || '📁'} {c.nombre}
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentCats = editStaffData.cat_staff.split(',').map(x => x.trim().toLowerCase());
                                    const isSelected = currentCats.includes('multi');
                                    const cats = editStaffData.cat_staff ? editStaffData.cat_staff.split(',').map(x => x.trim()) : [];
                                    const newCats = isSelected ? cats.filter(x => x.toLowerCase() !== 'multi') : [...cats, 'multi'];
                                    setEditStaffData({ ...editStaffData, cat_staff: newCats.join(',') });
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${editStaffData.cat_staff.split(',').map(x => x.trim().toLowerCase()).includes('multi') ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'}`}
                                >
                                  ✨ General / Multi-área
                                </button>
                              </div>
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
                          <div className="shrink-0 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex flex-col sm:flex-row gap-3">
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
                            const cats = (s.cat_staff || s.especialidad || '').split(',').map(x => normalize(x));
                            return cats.includes(normalize(cat.nombre));
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
                      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                        <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300 max-h-[90vh] flex flex-col">
                          <div className="shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                            <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                              <Plus className="h-5 w-5 text-violet-500" /> Nueva Categoría
                            </h3>
                            <button onClick={() => setIsAddCatModalOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4 overflow-y-auto">
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
                          <div className="shrink-0 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex flex-col sm:flex-row gap-3">
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
                      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
                        <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300 max-h-[90vh] flex flex-col">
                          <div className="shrink-0 flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
                            <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                              <Pencil className="h-5 w-5 text-violet-500" /> Editar Categoría
                            </h3>
                            <button onClick={() => setIsEditCatModalOpen(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10">
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <div className="p-6 space-y-4 overflow-y-auto">
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
                           <div className="shrink-0 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex flex-col sm:flex-row gap-3">
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
          <ServiciosTab />
        )}

        {/* CHATBOT YA VINCULACION */}
        {activeTab === 'chatbot' && (
           <ChatbotTab />
        )}

        {/* RESCATE/RETENCION */}
        {activeTab === 'rescate' && (
           <RescateTab />
        )}

        {/* BOOKING/AGENDA PÚBLICA */}
        {activeTab === 'booking' && (
           <BookingTab />
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
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Métodos de Pago y Facturación</h3>
                <p className="text-sm text-gray-500 mt-1">Elige la opción que mejor se adapte para mantener tu suscripción a Nilah activa. Aceptamos transferencias locales e internacionales.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Yape */}
                <div className="relative overflow-hidden rounded-2xl border border-[#7B228B]/20 bg-gradient-to-br from-[#7B228B]/5 to-transparent p-5 transition-all hover:border-[#7B228B]/40 dark:from-[#7B228B]/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7B228B] text-white shadow-md">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Yape (Perú)</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Escanea o usa el número directamente</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-[#7B228B]/10 p-3 text-center dark:bg-[#7B228B]/20 border border-[#7B228B]/10">
                    <p className="font-mono text-xl font-black tracking-wider text-[#7B228B] dark:text-[#E2AEEB]">981 482 289</p>
                    <p className="mt-1 text-xs font-semibold text-[#7B228B]/70 dark:text-[#E2AEEB]/70">Titular verificado</p>
                  </div>
                </div>

                {/* BCP */}
                <div className="relative overflow-hidden rounded-2xl border border-[#002A8D]/20 bg-gradient-to-br from-[#002A8D]/5 to-[#FF7A00]/5 p-5 transition-all hover:border-[#002A8D]/40 dark:from-[#002A8D]/20 dark:to-[#FF7A00]/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#002A8D] text-white shadow-md">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">BCP Transferencia</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Cuenta recaudadora Soles</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-gray-100 p-3 text-center dark:bg-white/5 border border-gray-200 dark:border-white/10">
                    <p className="font-mono text-lg font-black tracking-wider text-gray-800 dark:text-gray-200">370-72845703-0-69</p>
                    <p className="mt-1 text-xs text-gray-500">CTA. CORRIENTE SOLES</p>
                  </div>
                </div>

                {/* Stripe */}
                <div className="relative overflow-hidden rounded-2xl border border-[#635BFF]/20 bg-gradient-to-br from-[#635BFF]/5 to-transparent p-5 transition-all hover:border-[#635BFF]/40 dark:from-[#635BFF]/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#635BFF] text-white shadow-md">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900 dark:text-white">Tarjeta Internacional</p>
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Recomendado</span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Pago seguro con la red de Stripe</p>
                      </div>
                    </div>
                  </div>
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 p-3 text-sm font-bold text-white transition-all hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200">
                    <CreditCard size={16} /> Configurar Tarjeta vía Stripe
                  </button>
                </div>

                {/* PayPal */}
                <div className="relative overflow-hidden rounded-2xl border border-[#003087]/20 bg-gradient-to-br from-[#003087]/5 to-[#0079C1]/5 p-5 transition-all hover:border-[#003087]/40 dark:from-[#003087]/20 dark:to-[#0079C1]/10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#003087] text-white shadow-md">
                        <Globe size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">PayPal Global</p>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">Ideal para pagos recurrentes fuera de Perú</p>
                      </div>
                    </div>
                  </div>
                  <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0079C1] p-3 text-sm font-bold text-white transition-all hover:bg-[#003087]">
                    Conectar cuenta de PayPal
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5 dark:border-white/10">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Estado de facturación: <span className="text-emerald-500">Al día</span></p>
                  <p className="text-xs text-gray-500">Próxima renovación: 15 de Febrero, 2026</p>
                </div>
                <button className="text-sm font-semibold text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300">
                  Ver historial de recibos
                </button>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* --- ADD SERVICE MODAL --- */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1A1A1A] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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

              <div className="mt-6 flex flex-col flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-violet-500 px-6 py-3 sm:py-2 text-sm font-bold text-white hover:bg-violet-600 shadow-md"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL DE AUSENCIAS ═══ */}
      {absenceModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#1A1A1A] shadow-xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-6 py-4">
              <h3 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                {absenceModal.mode === 'falta' ? '❌ Falta Hoy' : absenceModal.mode === 'medio_dia' ? '🌗 Medio Día' : '�� Programar Ausencia'}
                <span className="text-violet-500">— {absenceModal.staffNombre}</span>
              </h3>
              <button onClick={() => setAbsenceModal(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              {absenceModal.mode === 'medio_dia' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">¿Desde qué hora se retira?</label>
                  <input type="time" value={absenceModal.hora} onChange={e => setAbsenceModal(prev => prev ? {...prev, hora: e.target.value} : null)} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                </div>
              )}
              {absenceModal.mode === 'programar' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de ausencia</label>
                  <input type="date" value={absenceModal.fecha} onChange={e => setAbsenceModal(prev => prev ? {...prev, fecha: e.target.value} : null)} className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white" />
                </div>
              )}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo</label>
                <input type="text" value={absenceModal.motivo} onChange={e => setAbsenceModal(prev => prev ? {...prev, motivo: e.target.value} : null)} placeholder="Ej: Cita médica, Emergencia..." className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm dark:border-white/10 dark:bg-[#141414] dark:text-white" />
              </div>
            </div>
            <div className="border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-[#141414] px-6 py-4 flex flex-col sm:flex-row gap-3">
              <button onClick={() => setAbsenceModal(null)} className="flex-1 rounded-lg border border-gray-300 dark:border-white/20 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10">Cancelar</button>
              <button onClick={handleConfirmAbsence} disabled={absenceModal.saving} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-3 text-sm font-bold text-white hover:bg-violet-600 disabled:opacity-50">
                {absenceModal.saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Brief Wizard Modal ─────────────────────────────────── */}
      <BriefWizardModal
        isOpen={isEditingBrief}
        onClose={() => setIsEditingBrief(false)}
        briefData={briefData}
        handleBriefField={handleBriefField}
        handleSaveBrief={handleSaveBrief}
        savingBrief={savingBrief}
        briefError={briefError}
        briefId={briefId}
        handleDeleteBrief={handleDeleteBrief}
      />

    </div>
  );
};

export default SettingsPage;


