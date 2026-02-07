
import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronRight, X, UserPlus, Phone, Calendar, Loader2, AlertCircle, HeartHandshake, Lock, ShieldAlert, ShieldCheck, CheckCircle2, RefreshCw, MessageCircle, Filter, FileText, Edit2, Save, Gift, Trash2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../context/DashboardDataContext';
import { Client, Appointment, ClientStats } from '../types';
import { calculateChurnRisk, calculateReliabilityScore } from '../utils/metrics';
import { STATUS_LABELS, STATUS_COLORS, SIMULATION_DATE } from '../constants';
import { crm, dashboard } from '../services/api';

// ===========================================
// Types
// ===========================================

interface RescueState {
  [clientId: number]: 'idle' | 'sending' | 'sent' | 'error';
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

// ===========================================
// Helper: Status Badge Colors
// ===========================================

const getStatusBadgeStyles = (statusColor: ClientStats['status_color']) => {
  switch (statusColor) {
    case 'success':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'warning':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'error':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'critical':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
  }
};

const getStatusDotColor = (statusColor: ClientStats['status_color']) => {
  switch (statusColor) {
    case 'success':
      return 'bg-green-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'error':
      return 'bg-red-500';
    case 'critical':
      return 'bg-purple-500';
    default:
      return 'bg-gray-400';
  }
};

// ===========================================
// Helper: Lifecycle Badge
// ===========================================

type LifecycleType = 'Nuevo' | 'Activo' | 'Leal' | 'En Riesgo' | 'Dormido' | 'Perdido';

const getLifecycleBadge = (lifecycle: LifecycleType | undefined) => {
  switch (lifecycle) {
    case 'Nuevo':
      return { emoji: '🆕', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' };
    case 'Activo':
      return { emoji: '⭐', bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400' };
    case 'Leal':
      return { emoji: '💎', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' };
    case 'En Riesgo':
      return { emoji: '⚠️', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400' };
    case 'Dormido':
      return { emoji: '😴', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400' };
    case 'Perdido':
      return { emoji: '❌', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' };
    default:
      return { emoji: '•', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-500 dark:text-gray-400' };
  }
};

// Helper: Formatear LTV
const formatLTV = (ltv: number | undefined): string => {
  if (!ltv || ltv === 0) return '-';
  return `S/ ${ltv.toLocaleString('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

// Helper: Cooldown Badge
const getCooldownInfo = (bloqueadoHasta: string | null): {
  enCooldown: boolean;
  diasRestantes: number;
  texto: string;
  color: string;
} => {
  if (!bloqueadoHasta) {
    return { enCooldown: false, diasRestantes: 0, texto: '✅ Disponible', color: 'green' };
  }

  const ahora = new Date();
  const fechaBloqueo = new Date(bloqueadoHasta);

  if (fechaBloqueo <= ahora) {
    return { enCooldown: false, diasRestantes: 0, texto: '✅ Disponible', color: 'green' };
  }

  const diasRestantes = Math.ceil((fechaBloqueo.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
  return {
    enCooldown: true,
    diasRestantes,
    texto: `🕐 ${diasRestantes}d restantes`,
    color: 'yellow'
  };
};

// ===========================================
// Main Component
// ===========================================

const ClientsPage: React.FC = () => {
  const { clients: mockClients, appointments, addClient } = useData();
  const { isPro, hasFeature, isAdmin } = useAuth();

  // 🚀 OPTIMIZACIÓN: Reutilizar datos del contexto central si ya están cargados
  const { data: dashboardData, isLoading: dashboardLoading, refresh: refreshDashboard } = useDashboardData();

  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [rescueStates, setRescueStates] = useState<RescueState>({});
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [currentPage, setCurrentPage] = useState(1);

  // Constantes de paginación
  const ITEMS_PER_PAGE = 10;

  // New Client Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Filter States
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [filterCategory, setFilterCategory] = useState<string>('Todos');

  // Client Notes State (local storage)
  const [clientNotes, setClientNotes] = useState<Record<number, string>>({});
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  // Inline Edit State for client fields
  const [editingField, setEditingField] = useState<'nombre' | 'telefono' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isSavingField, setIsSavingField] = useState(false);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('korat_client_notes');
    if (savedNotes) {
      setClientNotes(JSON.parse(savedNotes));
    }
  }, []);

  // ===========================================
  // Cache Configuration
  // ===========================================
  const CACHE_KEY = 'korat_clients_cache';
  const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutos

  // Helper: Guardar en caché
  const saveToCache = (data: Client[]) => {
    try {
      const cacheData = {
        timestamp: Date.now(),
        clients: data
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Error saving to cache:', e);
    }
  };

  // Helper: Leer del caché
  const loadFromCache = (): Client[] | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { timestamp, clients } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > CACHE_EXPIRY_MS;

      // Retornar aunque esté expirado (se actualizará en background)
      return clients;
    } catch (e) {
      console.warn('Error reading cache:', e);
      return null;
    }
  };

  // Helper: Verificar si el caché está fresco
  const isCacheFresh = (): boolean => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return false;

      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp < CACHE_EXPIRY_MS;
    } catch {
      return false;
    }
  };

  // ===========================================
  // Data Loading with Cache + Context Optimization
  // ===========================================

  const loadClients = useCallback(async (forceRefresh = false) => {
    // 🚀 OPTIMIZACIÓN: Si el DashboardDataContext ya tiene clientes, usarlos primero
    if (!forceRefresh && dashboardData?.clientes && dashboardData.clientes.length > 0) {
      const contextClients = dashboardData.clientes.map((c: any) => ({
        id: c.id || Date.now(),
        nombre: c.nombre || 'Sin nombre',
        telefono: c.telefono || '',
        fecha_registro: c.fecha_registro || new Date().toISOString().split('T')[0],
        primera_visita: c.primera_visita || '-',
        ultima_visita: c.ultima_visita || c.stats?.ultima_visita || '-',
        categoria: c.categoria || 'Regular',
        puntos_acumulados: c.puntos || c.puntos_acumulados || 0,
        total_visitas: c.total_visitas || 0,
        Estado: c.Estado || 'Activo',
        lifecycle: c.lifecycle || null,
        ltv: c.ltv || c.LTV || 0,
        bloqueado_hasta: c.bloqueado_hasta || null,
        ultimo_mensaje_enviado: c.ultimo_mensaje_enviado || null,
        tipo_ultimo_mensaje: c.tipo_ultimo_mensaje || null,
        stats: c.stats || {
          status_color: 'neutral',
          label: 'Activo',
          dias_ausente: 0,
          nivel_riesgo: 'Bajo',
          rescue_sent: false
        }
      })).sort((a: any, b: any) => (b.ltv || 0) - (a.ltv || 0));

      console.log('🚀 Clientes cargados desde DashboardDataContext:', contextClients.length);
      setClients(contextClients);
      saveToCache(contextClients);
      setIsLoading(false);
      return;
    }

    // 1. Si no es refresh forzado, intentar cargar del caché primero
    if (!forceRefresh) {
      const cachedClients = loadFromCache();
      if (cachedClients && cachedClients.length > 0) {
        setClients(cachedClients);
        setIsLoading(false);

        // Si el caché está fresco, no hacer request
        if (isCacheFresh()) {
          console.log('📦 Datos cargados desde caché (fresco)');
          return;
        }

        // Si está expirado, continuar para actualizar en background
        console.log('📦 Datos cargados desde caché (actualizando en background...)');
      }
    }

    // 2. Si no hay caché o está expirado, mostrar loading
    if (!loadFromCache()) {
      setIsLoading(true);
    }
    setLoadError(null);

    try {
      const data = await crm.getClients();

      // Normalizar la respuesta
      let clientsArray: any[] = [];

      if (Array.isArray(data)) {
        clientsArray = data;
      } else if (data && typeof data === 'object') {
        const dataObj = data as any;
        if (Array.isArray(dataObj.clients)) {
          clientsArray = dataObj.clients;
        } else if (Array.isArray(dataObj.data)) {
          clientsArray = dataObj.data;
        } else {
          clientsArray = [dataObj];
        }
      }

      // Mapear y normalizar
      const normalizedClients = clientsArray.map((c: any) => ({
        id: c.id || Date.now(),
        nombre: c.nombre || 'Sin nombre',
        telefono: c.telefono || '',
        fecha_registro: c.fecha_registro || new Date().toISOString().split('T')[0],
        primera_visita: c.primera_visita || '-',
        ultima_visita: c.ultima_visita || c.stats?.ultima_visita || '-',
        categoria: c.categoria || 'Regular',
        puntos_acumulados: c.puntos || c.puntos_acumulados || 0,
        total_visitas: c.total_visitas || 0,
        Estado: c.Estado || 'Activo',
        lifecycle: c.lifecycle || null,
        ltv: c.ltv || c.LTV || 0,
        // Campos de cooldown
        bloqueado_hasta: c.bloqueado_hasta || null,
        ultimo_mensaje_enviado: c.ultimo_mensaje_enviado || null,
        tipo_ultimo_mensaje: c.tipo_ultimo_mensaje || null,
        stats: {
          status_color: c.stats?.status_color || c.status_color || 'neutral',
          label: c.stats?.label || c.label || 'Activo',
          dias_ausente: c.stats?.dias_ausente ?? c.dias_ausente ?? 0,
          nivel_riesgo: c.stats?.nivel_riesgo || c.nivel_riesgo || 'Bajo',
          rescue_sent: c.stats?.rescue_sent || false,
          accion_recomendada: c.stats?.accion_recomendada || null,
          prioridad: c.stats?.prioridad || 0,
          impacto_actual: c.stats?.impacto_actual ?? c.impacto_actual ?? 0,
          ultima_promo_enviada: c.stats?.ultima_promo_enviada || c.ultimo_mensaje_enviado || null
        }
      }))
        .sort((a: any, b: any) => (b.ltv || 0) - (a.ltv || 0) || (b.stats?.prioridad || 0) - (a.stats?.prioridad || 0));

      console.log('✅ Clientes actualizados desde API:', normalizedClients.length);
      setClients(normalizedClients);

      // Guardar en caché
      saveToCache(normalizedClients);

    } catch (error) {
      console.warn('Error loading from API:', error);

      // Si hay caché, usarlo aunque haya error
      const cachedClients = loadFromCache();
      if (cachedClients && cachedClients.length > 0) {
        setClients(cachedClients);
        setLoadError('Usando datos en caché (API no disponible)');
      } else {
        // Fallback a mock data
        const clientsWithStats = mockClients.map(client => ({
          ...client,
          stats: generateMockStats(client)
        }));
        setClients(clientsWithStats);
        setLoadError('Usando datos de demostración (API no disponible)');
      }
    } finally {
      setIsLoading(false);
    }
  }, [mockClients, dashboardData?.clientes]);

  // Generar stats mock basados en los datos del cliente
  const generateMockStats = (client: Client): ClientStats => {
    const risk = calculateChurnRisk(client.ultima_visita, client.Estado, SIMULATION_DATE);

    let status_color: ClientStats['status_color'] = 'neutral';
    let nivel_riesgo: ClientStats['nivel_riesgo'] = 'Bajo';
    let label = 'Activo';

    if (risk.level === 'High') {
      status_color = 'error';
      nivel_riesgo = 'Alto';
      label = 'En riesgo de abandono';
    } else if (risk.level === 'Medium') {
      status_color = 'warning';
      nivel_riesgo = 'Medio';
      label = 'Atención requerida';
    } else {
      status_color = 'success';
      nivel_riesgo = 'Bajo';
      label = 'Cliente activo';
    }

    return {
      status_color,
      label,
      dias_ausente: risk.days,
      nivel_riesgo,
      rescue_sent: false
    };
  };

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  // ===========================================
  // Toast Handler
  // ===========================================

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // ===========================================
  // Rescue Handler
  // ===========================================

  const handleRescueClient = async (client: Client) => {
    // Verificar permisos
    if (!hasFeature('client_rescue')) {
      showToast('Esta función requiere el Plan Pro', 'error');
      return;
    }

    // Actualizar estado a "enviando"
    setRescueStates(prev => ({ ...prev, [client.id]: 'sending' }));

    try {
      const response = await crm.rescueClient(String(client.id));

      if (response.success) {
        // Calcular el impacto enviado basado en días
        const diasAusente = client.stats?.dias_ausente || 0;
        const impactoAnterior = client.stats?.impacto_actual || 0;
        let nuevoImpacto = impactoAnterior;

        // Si no tenía impacto, asignar según días
        if (impactoAnterior === 0) {
          if (diasAusente >= 90) nuevoImpacto = 3;
          else if (diasAusente >= 60) nuevoImpacto = 2;
          else nuevoImpacto = 1;
        } else {
          // Incrementar al siguiente impacto
          nuevoImpacto = Math.min(impactoAnterior + 1, 3);
        }

        // Actualizar estado a "enviado"
        setRescueStates(prev => ({ ...prev, [client.id]: 'sent' }));

        // Calcular fechas
        const ahora = new Date();
        const ahoraISO = ahora.toISOString();

        // Calcular bloqueado_hasta (3 días de cooldown)
        const bloqueadoHasta = new Date(ahora);
        bloqueadoHasta.setDate(bloqueadoHasta.getDate() + 3);
        const bloqueadoHastaISO = bloqueadoHasta.toISOString();

        // Actualizar el cliente en la lista con los campos de rescate inteligente
        setClients(prev => {
          const updatedClients = prev.map(c =>
            c.id === client.id
              ? {
                ...c,
                bloqueado_hasta: bloqueadoHastaISO,  // ← Actualizar cooldown
                ultimo_mensaje_enviado: ahoraISO,    // ← Fecha del mensaje
                tipo_ultimo_mensaje: 'rescate',       // ← Tipo de mensaje
                stats: {
                  ...c.stats!,
                  rescue_sent: true,
                  ultima_promo_enviada: ahoraISO,
                  impacto_actual: nuevoImpacto
                }
              }
              : c
          );
          // Actualizar caché con los nuevos datos
          saveToCache(updatedClients);
          return updatedClients;
        });

        // Mostrar toast con información del impacto
        const impactoNombres = ['', 'Soft Touch 🤗', 'Incentivo 🎁', 'Última Llamada ⚠️'];
        showToast(`✅ ${impactoNombres[nuevoImpacto]} enviado a ${client.nombre}`, 'success');

        // Si está seleccionado, actualizar también
        if (selectedClient?.id === client.id) {
          setSelectedClient(prev => prev ? {
            ...prev,
            bloqueado_hasta: bloqueadoHastaISO,
            ultimo_mensaje_enviado: ahoraISO,
            tipo_ultimo_mensaje: 'rescate',
            stats: {
              ...prev.stats!,
              rescue_sent: true,
              ultima_promo_enviada: ahoraISO,
              impacto_actual: nuevoImpacto
            }
          } : null);
        }
      } else {
        throw new Error(response.message || 'Error al enviar mensaje');
      }
    } catch (error) {
      console.error('Error rescuing client:', error);
      setRescueStates(prev => ({ ...prev, [client.id]: 'error' }));
      showToast(`Error al enviar mensaje a ${client.nombre}`, 'error');

      // Reset después de 3 segundos
      setTimeout(() => {
        setRescueStates(prev => ({ ...prev, [client.id]: 'idle' }));
      }, 3000);
    }
  };

  // ===========================================
  // Filtering (with status and category)
  // ===========================================

  const filteredClients = clients.filter(client => {
    // Search filter
    const matchesSearch = client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telefono.includes(searchTerm);

    // Status filter
    const matchesStatus = filterStatus === 'Todos' ||
      (filterStatus === 'En riesgo' && (client.stats?.nivel_riesgo === 'Alto' || client.stats?.nivel_riesgo === 'Crítico')) ||
      (filterStatus === 'Atención' && client.stats?.nivel_riesgo === 'Medio') ||
      (filterStatus === 'Activo' && client.stats?.nivel_riesgo === 'Bajo');

    // Category filter
    const matchesCategory = filterCategory === 'Todos' || client.categoria === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories for filter dropdown
  const uniqueCategories = [...new Set(clients.map(c => c.categoria).filter(Boolean))];

  // Paginación
  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset página cuando cambia búsqueda o filtros
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // ===========================================
  // Notes Handler
  // ===========================================
  const saveClientNotes = async (clientId: number, notes: string) => {
    try {
      // Save to backend (Supabase via n8n)
      const response = await crm.updateClientNotes(clientId, notes);

      if (response?.success) {
        // Also update local state
        const updatedNotes = { ...clientNotes, [clientId]: notes };
        setClientNotes(updatedNotes);
        localStorage.setItem('korat_client_notes', JSON.stringify(updatedNotes));
        setIsEditingNotes(false);
        showToast('Notas guardadas en la base de datos', 'success');
      } else {
        throw new Error(response?.error || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error saving notes:', error);
      // Fallback: save to localStorage only
      const updatedNotes = { ...clientNotes, [clientId]: notes };
      setClientNotes(updatedNotes);
      localStorage.setItem('korat_client_notes', JSON.stringify(updatedNotes));
      setIsEditingNotes(false);
      showToast('Notas guardadas localmente (sin conexión)', 'error');
    }
  };

  // ===========================================
  // Inline Edit Handler (name, phone)
  // ===========================================
  const saveClientField = async (clientId: number, field: 'nombre' | 'telefono', value: string) => {
    if (!value.trim()) {
      showToast('El campo no puede estar vacío', 'error');
      return;
    }

    setIsSavingField(true);
    try {
      const response = await crm.updateClient(clientId, { [field]: value.trim() });

      if (response?.success) {
        // Update local state
        setClients(prev => prev.map(c =>
          c.id === clientId ? { ...c, [field]: value.trim() } : c
        ));
        if (selectedClient?.id === clientId) {
          setSelectedClient(prev => prev ? { ...prev, [field]: value.trim() } : null);
        }
        setEditingField(null);
        setEditValue('');
        showToast(`${field === 'nombre' ? 'Nombre' : 'Teléfono'} actualizado`, 'success');
      } else {
        throw new Error(response?.error || 'Error al guardar');
      }
    } catch (error: any) {
      console.error('Error saving field:', error);
      showToast('Error al guardar. Intenta de nuevo.', 'error');
    } finally {
      setIsSavingField(false);
    }
  };

  // ===========================================
  // WhatsApp Helper
  // ===========================================
  const getWhatsAppLink = (phone: string, clientName: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = `¡Hola ${clientName}! 👋 Te escribimos desde el salón. ¿Cómo estás?`;
    return `https://wa.me/51${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getClientHistory = (clientId: number): Appointment[] => {
    return appointments
      .filter(a => a.cliente_id === clientId)
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // ===========================================
  // Get Next Appointment
  // ===========================================
  const getNextAppointment = (clientId: number): Appointment | null => {
    const now = new Date();
    const upcoming = appointments
      .filter(a => a.cliente_id === clientId && new Date(a.fecha) >= now && a.estado !== 'Cancelada')
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
    return upcoming.length > 0 ? upcoming[0] : null;
  };

  // ===========================================
  // Get Total Spent
  // ===========================================
  const getTotalSpent = (clientId: number): number => {
    return appointments
      .filter(a => a.cliente_id === clientId && a.estado === 'Completada')
      .reduce((sum, a) => sum + (a.precio || 0), 0);
  };

  // ===========================================
  // Add Client Handler
  // ===========================================

  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [isDeletingClient, setIsDeletingClient] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;

    setIsCreatingClient(true);

    try {
      // Llamar a la API para crear el cliente en la base de datos
      const response = await crm.createClient({
        nombre: newClientName.trim(),
        telefono: newClientPhone.trim()
      });

      // Debug log
      console.log('🔍 handleAddClient - response:', response);
      console.log('🔍 handleAddClient - response?.success:', response?.success);
      console.log('🔍 handleAddClient - response?.id:', response?.id);

      if (response?.success || response?.id) {
        // Cliente creado exitosamente - usar ID de la BD
        const newClient: Client = {
          id: response.id || response.cliente?.id || Date.now(),
          nombre: newClientName.trim(),
          telefono: newClientPhone.trim(),
          fecha_registro: new Date().toISOString().split('T')[0],
          primera_visita: '-',
          ultima_visita: '-',
          categoria: 'Nuevo',
          puntos_acumulados: 0,
          total_visitas: 0,
          Estado: 'Activo',
          lifecycle: 'Nuevo',
          ltv: 0,
          stats: {
            status_color: 'success',
            label: 'Cliente nuevo',
            dias_ausente: 0,
            nivel_riesgo: 'Bajo',
            rescue_sent: false
          }
        };

        // Actualizar estado local y contexto
        addClient(newClient);
        setClients(prev => [newClient, ...prev]);

        // Limpiar formulario
        setNewClientName('');
        setNewClientPhone('');
        setIsAddModalOpen(false);

        showToast(`✅ Cliente ${newClientName} guardado en la base de datos`, 'success');

        // ✅ REFRESCAR EL CONTEXTO para actualizar datos en tiempo real
        console.log('🔄 Refrescando dashboard después de crear cliente...');
        await refreshDashboard(true);
      } else {
        throw new Error(response?.message || 'Error al crear cliente');
      }
    } catch (error: any) {
      console.error('Error creating client:', error);
      showToast(`❌ Error al guardar cliente: ${error.message || 'Intenta de nuevo'}`, 'error');
    } finally {
      setIsCreatingClient(false);
    }
  };

  const getReliability = (clientId: number) => {
    const history = appointments.filter(a => a.cliente_id === clientId);
    return calculateReliabilityScore(history);
  };

  // ===========================================
  // Delete Client Handler (Solo Admin)
  // ===========================================
  const handleDeleteClient = async () => {
    if (!selectedClient || !isAdmin) return;

    setIsDeletingClient(true);
    try {
      const response = await crm.deleteClient(selectedClient.id);

      if (response?.success) {
        // Remover cliente del estado local
        setClients(prev => prev.filter(c => c.id !== selectedClient.id));

        // Cerrar modal y limpiar selección
        setSelectedClient(null);
        setShowDeleteConfirm(false);

        // ✅ REFRESCAR EL CONTEXTO para actualizar datos en tiempo real
        console.log('🔄 Refrescando dashboard después de eliminar cliente...');
        await refreshDashboard(true);

        showToast(`✅ Cliente ${selectedClient.nombre} eliminado`, 'success');
      } else {
        throw new Error(response?.message || 'Error al eliminar');
      }
    } catch (error: any) {
      console.error('Error deleting client:', error);
      showToast(`❌ Error al eliminar: ${error.message || 'Intenta de nuevo'}`, 'error');
    } finally {
      setIsDeletingClient(false);
      setShowDeleteConfirm(false);
    }
  };

  // ===========================================
  // Render: Rescue Button (Inteligente)
  // ===========================================

  const renderRescueButton = (client: Client, compact = false) => {
    const rescueState = rescueStates[client.id] || 'idle';
    const canRescue = hasFeature('client_rescue');
    const stats = client.stats;

    // Calcular estado del rescate
    const ultimaPromo = stats?.ultima_promo_enviada;
    const diasDesdePromo = ultimaPromo
      ? Math.ceil((Date.now() - new Date(ultimaPromo).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const impactoActual = stats?.impacto_actual || 0;
    const rescateExitoso = stats?.rescate_exitoso;
    const diasAusente = stats?.dias_ausente || 0;

    // Determinar estado visual
    type RescueVisualState = 'rescatado' | 'inactivo' | 'seguimiento' | 'reenviar' | 'rescatar' | 'oculto';

    const getVisualState = (): RescueVisualState => {
      // Si fue rescatado exitosamente
      if (rescateExitoso) return 'rescatado';

      // Si está inactivo (perdido)
      if (client.Estado === 'Inactivo') return 'inactivo';

      // Si nivel de riesgo no es Alto o Crítico, no mostrar
      if (stats?.nivel_riesgo !== 'Alto' && stats?.nivel_riesgo !== 'Crítico') return 'oculto';

      // Si tiene mensaje enviado recientemente (menos de 7 días)
      if (diasDesdePromo !== null && diasDesdePromo < 7) return 'seguimiento';

      // Si tiene mensaje enviado hace más de 7 días
      if (diasDesdePromo !== null && diasDesdePromo >= 7 && impactoActual > 0) return 'reenviar';

      // Default: puede rescatar
      return 'rescatar';
    };

    const visualState = getVisualState();

    // No mostrar si está oculto
    if (visualState === 'oculto') return null;

    // Sin acceso Pro
    if (!canRescue) {
      return (
        <div className="flex items-center justify-between rounded bg-white/50 p-2 dark:bg-black/20">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Lock size={10} />
            Auto-rescate bloqueado
          </span>
          <span className="text-[10px] font-bold text-primary uppercase">Plan Pro</span>
        </div>
      );
    }

    // Estado: Rescatado exitosamente
    if (visualState === 'rescatado') {
      const impactoFunciono = stats?.impacto_que_funciono;
      return (
        <div className={`flex items-center gap-2 ${compact ? 'px-3 py-1.5' : 'w-full py-2 px-3'} rounded-lg bg-green-100 dark:bg-green-900/30`}>
          <CheckCircle2 size={compact ? 12 : 14} className="text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            ¡Rescatado! 🎉
            {impactoFunciono && <span className="text-[10px] ml-1 opacity-75">Impacto {impactoFunciono}</span>}
          </span>
        </div>
      );
    }

    // Estado: Cliente Inactivo/Perdido
    if (visualState === 'inactivo') {
      return (
        <div className={`flex items-center gap-2 ${compact ? 'px-3 py-1.5' : 'w-full py-2 px-3'} rounded-lg bg-gray-100 dark:bg-gray-800`}>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            💀 Perdido ({diasAusente}d)
          </span>
        </div>
      );
    }

    // Estado: En seguimiento (mensaje enviado hace menos de 7 días)
    if (visualState === 'seguimiento') {
      return (
        <div className={`flex items-center gap-2 ${compact ? 'px-3 py-1.5' : 'w-full py-2 px-3'} rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800`}>
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
            📩 Seguimiento
            <span className="text-[10px] ml-1 opacity-75">
              Impacto {impactoActual} • hace {diasDesdePromo}d
            </span>
          </span>
        </div>
      );
    }

    // Estados de interacción (enviando, error)
    if (rescueState === 'sending') {
      return (
        <button
          disabled
          className={`flex items-center justify-center gap-2 rounded-lg ${compact ? 'px-3 py-1.5 text-xs' : 'w-full py-2 text-xs'
            } bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 cursor-wait`}
        >
          <Loader2 size={compact ? 12 : 14} className="animate-spin" />
          Enviando...
        </button>
      );
    }

    if (rescueState === 'sent') {
      return (
        <div className={`flex items-center gap-2 ${compact ? 'px-3 py-1.5' : 'w-full py-2 px-3'} rounded-lg bg-green-100 dark:bg-green-900/30`}>
          <CheckCircle2 size={compact ? 12 : 14} className="text-green-600 dark:text-green-400" />
          <span className="text-xs font-medium text-green-700 dark:text-green-400">
            ✓ Enviado
          </span>
        </div>
      );
    }

    if (rescueState === 'error') {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleRescueClient(client); }}
          className={`flex items-center justify-center gap-2 rounded-lg ${compact ? 'px-3 py-1.5 text-xs' : 'w-full py-2 text-xs'
            } bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200`}
        >
          <RefreshCw size={compact ? 12 : 14} />
          Reintentar
        </button>
      );
    }

    // Estado: Reenviar (pasaron más de 7 días sin respuesta)
    if (visualState === 'reenviar') {
      const nextImpact = Math.min(impactoActual + 1, 3);
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleRescueClient(client); }}
          className={`flex items-center justify-center gap-2 rounded-lg ${compact ? 'px-3 py-1.5 text-xs' : 'w-full py-2 text-xs'
            } font-bold bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-all`}
        >
          <RefreshCw size={compact ? 12 : 14} />
          Reenviar 🔄
          <span className="text-[10px] opacity-75">→ Impacto {nextImpact}</span>
        </button>
      );
    }

    // Estado: Default - Rescatar
    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleRescueClient(client); }}
        className={`flex items-center justify-center gap-2 rounded-lg ${compact ? 'px-3 py-1.5 text-xs' : 'w-full py-2 text-xs'
          } font-bold bg-white text-black shadow-sm hover:bg-gray-50 border border-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700 transition-all hover:shadow-md`}
      >
        <HeartHandshake size={compact ? 12 : 14} className="text-primary" />
        Rescatar 🚑
        <span className="text-[10px] opacity-60">{diasAusente}d</span>
      </button>
    );
  };

  // ===========================================
  // Render
  // ===========================================

  return (
    <div className="relative h-full">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg transition-all transform animate-slide-in ${toast.type === 'success'
          ? 'bg-green-600 text-white'
          : 'bg-red-600 text-white'
          }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Base de Clientes</h1>
          {loadError && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-1">
              <AlertCircle size={14} />
              {loadError}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => loadClients(true)}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300 dark:hover:bg-dark-border disabled:opacity-50"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Actualizar
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary-dim shadow-md"
          >
            <UserPlus size={18} />
            Nuevo Cliente
          </button>

          <div className="relative w-full sm:w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-10 text-sm focus:border-primary focus:ring-primary dark:border-dark-border dark:bg-dark-card dark:text-white dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg bg-gray-50 p-3 dark:bg-dark-card border border-gray-100 dark:border-dark-border">
        <Filter size={16} className="text-gray-400" />
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); handleFilterChange(); }}
          className="rounded-lg bg-white px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white focus:ring-primary focus:border-primary"
        >
          <option value="Todos">Todos los estados</option>
          <option value="En riesgo">🔴 En riesgo</option>
          <option value="Atención">🟡 Atención</option>
          <option value="Activo">🟢 Activos</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); handleFilterChange(); }}
          className="rounded-lg bg-white px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 dark:bg-dark-bg dark:text-white focus:ring-primary focus:border-primary"
        >
          <option value="Todos">Todas las categorías</option>
          {uniqueCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
          {filteredClients.length} clientes
        </span>
      </div>

      {/* Mobile Cards View */}
      {isMobile ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-gray-500">Cargando clientes...</span>
            </div>
          ) : paginatedClients.length > 0 ? (
            paginatedClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-dark-border dark:bg-dark-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-lg font-bold text-primary">
                      {client.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{client.nombre}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone size={10} />
                        {client.telefono}
                      </div>
                    </div>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${client.categoria === 'VIP' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {client.categoria || 'Regular'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusDotColor(client.stats?.status_color || 'neutral')}`}></div>
                    <span className={`text-xs font-medium ${getStatusBadgeStyles(client.stats?.status_color || 'neutral')} rounded px-2 py-0.5`}>
                      {client.stats?.label || 'Activo'}
                    </span>
                    {client.stats?.dias_ausente && client.stats.dias_ausente > 0 && (
                      <span className="text-xs text-gray-500">• {client.stats.dias_ausente}d</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* WhatsApp Button */}
                    <a
                      href={getWhatsAppLink(client.telefono, client.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                    >
                      <MessageCircle size={14} />
                    </a>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No se encontraron clientes.</div>
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white disabled:opacity-50 dark:border-dark-border dark:bg-dark-card dark:text-gray-300"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-dark-border dark:bg-dark-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-[#252525] dark:text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3">Nombre</th>
                  <th scope="col" className="px-6 py-3">Teléfono</th>
                  <th scope="col" className="px-4 py-3">Lifecycle</th>
                  <th scope="col" className="px-4 py-3">LTV</th>
                  <th scope="col" className="px-4 py-3">Días</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Cooldown</th>
                  <th scope="col" className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="text-gray-500">Cargando clientes...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => (
                    <tr
                      key={client.id}
                      className="border-b border-gray-100 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-[#252525] cursor-pointer"
                      onClick={() => setSelectedClient(client)}
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {client.nombre}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {client.telefono}
                          {/* WhatsApp Button */}
                          <a
                            href={getWhatsAppLink(client.telefono, client.nombre)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                          >
                            <MessageCircle size={12} />
                          </a>
                        </div>
                      </td>
                      {/* Lifecycle Column */}
                      <td className="px-4 py-4">
                        {(() => {
                          const badge = getLifecycleBadge(client.lifecycle as LifecycleType);
                          return (
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${badge.bg} ${badge.text}`}>
                              <span>{badge.emoji}</span>
                              {client.lifecycle || '-'}
                            </span>
                          );
                        })()}
                      </td>
                      {/* LTV Column */}
                      <td className="px-4 py-4">
                        <span className={`font-bold ${(client.ltv || 0) >= 2000 ? 'text-green-600 dark:text-green-400' : (client.ltv || 0) >= 1000 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {formatLTV(client.ltv)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-medium ${client.stats?.dias_ausente && client.stats.dias_ausente > 30
                          ? 'text-red-600 dark:text-red-400'
                          : client.stats?.dias_ausente && client.stats.dias_ausente > 15
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-600 dark:text-gray-400'
                          }`}>
                          {client.stats?.dias_ausente ?? '-'}d
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${getStatusDotColor(client.stats?.status_color || 'neutral')}`}></div>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${getStatusBadgeStyles(client.stats?.status_color || 'neutral')}`}>
                            {client.stats?.nivel_riesgo || 'Bajo'}
                          </span>
                        </div>
                      </td>
                      {/* Cooldown Column */}
                      <td className="px-4 py-4">
                        {(() => {
                          const cooldown = getCooldownInfo((client as any).bloqueado_hasta);
                          return (
                            <span className={`rounded px-2 py-0.5 text-xs font-medium ${cooldown.enCooldown
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              }`}>
                              {cooldown.texto}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {renderRescueButton(client, true)}
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron clientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Desktop Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-6 py-3 dark:border-dark-border dark:bg-[#252525]">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length} clientes
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-border dark:bg-dark-card dark:text-gray-300 dark:hover:bg-dark-border"
                >
                  Anterior
                </button>
                <span className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-dark-border dark:bg-dark-card dark:text-gray-300 dark:hover:bg-dark-border"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Client Detail Sidebar */}
      {selectedClient && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md transform border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 dark:border-dark-border dark:bg-dark-card flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-dark-border">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Ficha de Cliente</h2>
            <div className="flex items-center gap-2">
              {/* Botón Eliminar - Solo Admin */}
              {isAdmin && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="rounded-full p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Eliminar cliente"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={() => setSelectedClient(null)}
                className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-dark-border"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Diálogo de Confirmación para Eliminar */}
          {showDeleteConfirm && (
            <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/50">
              <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl dark:bg-dark-card">
                <div className="mb-4 flex items-center gap-3 text-red-500">
                  <AlertCircle size={24} />
                  <h3 className="text-lg font-bold">¿Eliminar cliente?</h3>
                </div>
                <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
                  Esta acción eliminará permanentemente a <strong>{selectedClient.nombre}</strong> y todos sus datos asociados. Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeletingClient}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteClient}
                    disabled={isDeletingClient}
                    className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                  >
                    {isDeletingClient ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 size={14} />
                        Sí, eliminar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {/* Profile Header */}
            <div className="mb-6 flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-2xl font-bold text-primary">
                {selectedClient.nombre.charAt(0)}
              </div>
              <div className="flex-1">
                {/* Editable Name */}
                {editingField === 'nombre' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveClientField(selectedClient.id, 'nombre', editValue)}
                      className="flex-1 rounded-lg border border-primary px-2 py-1 text-lg font-bold dark:bg-dark-bg dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => saveClientField(selectedClient.id, 'nombre', editValue)}
                      disabled={isSavingField}
                      className="rounded-lg bg-primary px-2 py-1 text-white hover:bg-primary/80 disabled:opacity-50"
                    >
                      {isSavingField ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    </button>
                    <button
                      onClick={() => { setEditingField(null); setEditValue(''); }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-gray-500 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-dark-bg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.nombre}</h3>
                    <button
                      onClick={() => { setEditingField('nombre'); setEditValue(selectedClient.nombre); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-bg"
                      title="Editar nombre"
                    >
                      <Edit2 size={14} className="text-gray-400" />
                    </button>
                  </div>
                )}

                {/* Editable Phone */}
                {editingField === 'telefono' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Phone size={14} className="text-gray-400" />
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveClientField(selectedClient.id, 'telefono', editValue)}
                      className="flex-1 rounded-lg border border-primary px-2 py-1 text-sm dark:bg-dark-bg dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => saveClientField(selectedClient.id, 'telefono', editValue)}
                      disabled={isSavingField}
                      className="rounded-lg bg-primary px-2 py-1 text-white hover:bg-primary/80 disabled:opacity-50"
                    >
                      {isSavingField ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    </button>
                    <button
                      onClick={() => { setEditingField(null); setEditValue(''); }}
                      className="rounded-lg border border-gray-200 px-2 py-1 text-gray-500 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-dark-bg"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="group flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Phone size={14} />
                    {selectedClient.telefono}
                    <button
                      onClick={() => { setEditingField('telefono'); setEditValue(selectedClient.telefono || ''); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-bg"
                      title="Editar teléfono"
                    >
                      <Edit2 size={12} className="text-gray-400" />
                    </button>
                  </div>
                )}

                <div className="mt-2 flex flex-wrap gap-2">
                  {/* Lifecycle Badge */}
                  {(() => {
                    const badge = getLifecycleBadge(selectedClient.lifecycle as LifecycleType);
                    return (
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${badge.bg} ${badge.text}`}>
                        <span>{badge.emoji}</span>
                        {selectedClient.lifecycle || 'Sin datos'}
                      </span>
                    );
                  })()}
                  {/* LTV Badge */}
                  {selectedClient.ltv && selectedClient.ltv > 0 && (
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${(selectedClient.ltv || 0) >= 2000 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                      💰 LTV: {formatLTV(selectedClient.ltv)}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    {selectedClient.categoria || 'Regular'}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    {selectedClient.total_visitas} Visitas
                  </span>
                </div>
              </div>
            </div>

            {/* CRM DATA GRID - EXPANDED */}
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-dark-border dark:bg-[#252525]">
                <p className="text-[10px] uppercase text-gray-500">Puntos</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedClient.puntos_acumulados}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-dark-border dark:bg-[#252525]">
                <p className="text-[10px] uppercase text-gray-500">Días sin venir</p>
                <p className={`text-xl font-bold ${selectedClient.stats?.dias_ausente && selectedClient.stats.dias_ausente > 30
                  ? 'text-red-600'
                  : selectedClient.stats?.dias_ausente && selectedClient.stats.dias_ausente > 15
                    ? 'text-yellow-600'
                    : 'text-gray-900 dark:text-white'
                  }`}>{selectedClient.stats?.dias_ausente ?? 0}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-dark-border dark:bg-[#252525]">
                <p className="text-[10px] uppercase text-gray-500">Total Gastado</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">S/ {getTotalSpent(selectedClient.id).toFixed(0)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-dark-border dark:bg-[#252525]">
                <p className="text-[10px] uppercase text-gray-500">Promedio/Visita</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  S/ {selectedClient.total_visitas > 0 ? (getTotalSpent(selectedClient.id) / selectedClient.total_visitas).toFixed(0) : 0}
                </p>
              </div>
            </div>

            {/* Redeem Points Button */}
            {selectedClient.puntos_acumulados > 0 && (
              <div className="mb-6">
                <button
                  onClick={() => {
                    showToast(`Canjear puntos de ${selectedClient.nombre} - Ir a Fidelización`, 'success');
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-600 py-3 text-sm font-bold text-white shadow-md hover:from-amber-500 hover:to-amber-700 transition-all"
                >
                  <Gift size={18} />
                  Canjear Puntos ({selectedClient.puntos_acumulados} pts disponibles)
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-1">
                  Puede canjear: {selectedClient.puntos_acumulados >= 300 ? 'Manicura Gratis' : selectedClient.puntos_acumulados >= 100 ? 'Depilación de Cejas' : 'Masaje de Manos'}
                </p>
              </div>
            )}

            {/* NEXT APPOINTMENT */}
            {(() => {
              const nextAppt = getNextAppointment(selectedClient.id);
              return nextAppt ? (
                <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-green-600" />
                    <span className="text-xs font-bold uppercase text-green-700 dark:text-green-400">Próxima Cita</span>
                  </div>
                  <p className="text-sm font-semibold text-green-800 dark:text-green-300">{nextAppt.servicio}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {new Date(nextAppt.fecha).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'short' })} - {nextAppt.fecha.split('T')[1]?.substring(0, 5) || '--:--'}
                  </p>
                </div>
              ) : (
                <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center dark:border-gray-600 dark:bg-gray-800/30">
                  <Calendar size={20} className="mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sin cita programada</p>
                  <p className="text-[10px] text-gray-400">Contactar para agendar</p>
                </div>
              );
            })()}

            {/* CLIENT NOTES - EDITABLE */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <FileText size={12} />
                  Notas del Cliente
                </h3>
                {!isEditingNotes && (
                  <button
                    onClick={() => { setIsEditingNotes(true); setTempNotes(clientNotes[selectedClient.id] || ''); }}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Edit2 size={10} />
                    Editar
                  </button>
                )}
              </div>

              {isEditingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={tempNotes}
                    onChange={(e) => setTempNotes(e.target.value)}
                    placeholder="Ej: Alérgica a amoniaco, prefiere turnos de mañana..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white resize-none focus:ring-primary focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveClientNotes(selectedClient.id, tempNotes)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-xs font-bold text-black hover:bg-primary-dim"
                    >
                      <Save size={12} />
                      Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingNotes(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : clientNotes[selectedClient.id] ? (
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-dark-border dark:bg-[#252525]">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{clientNotes[selectedClient.id]}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800/30">
                  <p className="text-xs text-gray-400">Sin notas. Haz clic en "Editar" para agregar.</p>
                </div>
              )}
            </div>

            {/* Status Card */}
            {selectedClient.stats && (
              <div className={`mb-6 rounded-lg border p-4 ${selectedClient.stats.status_color === 'critical'
                ? 'border-purple-200 bg-purple-50 dark:border-purple-900 dark:bg-purple-900/20'
                : selectedClient.stats.status_color === 'error'
                  ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-900/20'
                  : selectedClient.stats.status_color === 'warning'
                    ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-900/20'
                    : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-900/20'
                }`}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${getStatusDotColor(selectedClient.stats.status_color)}`}></span>
                    <span className={`text-sm font-bold ${selectedClient.stats.status_color === 'critical'
                      ? 'text-purple-700 dark:text-purple-400'
                      : selectedClient.stats.status_color === 'error'
                        ? 'text-red-700 dark:text-red-400'
                        : selectedClient.stats.status_color === 'warning'
                          ? 'text-yellow-700 dark:text-yellow-400'
                          : 'text-green-700 dark:text-green-400'
                      }`}>{selectedClient.stats.label}</span>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase ${selectedClient.stats.nivel_riesgo === 'Crítico'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                    : selectedClient.stats.nivel_riesgo === 'Alto'
                      ? 'bg-red-100 text-red-700'
                      : selectedClient.stats.nivel_riesgo === 'Medio'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                    Riesgo {selectedClient.stats.nivel_riesgo}
                  </span>
                </div>

                {/* Acción Recomendada por n8n */}
                {selectedClient.stats.accion_recomendada && (
                  <div className="mt-2 flex items-start gap-2 rounded bg-white/60 dark:bg-black/20 p-2">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Acción Recomendada:</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{selectedClient.stats.accion_recomendada}</p>
                    </div>
                  </div>
                )}

                {/* Rescue Button */}
                <div className="mt-3">
                  {renderRescueButton(selectedClient)}
                </div>
              </div>
            )}

            {/* RISK / RELIABILITY ANALYSIS */}
            <div className="mb-6 space-y-3">
              {/* Reliability */}
              {(() => {
                const rel = getReliability(selectedClient.id);
                return (
                  <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-dark-border">
                    {rel.level === 'Low' ? <ShieldAlert className="text-rose-500" /> : <ShieldCheck className="text-indigo-500" />}
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {rel.level === 'High' ? 'Cliente Confiable' : rel.level === 'Low' ? 'Cliente de Riesgo' : 'Cliente Estándar'}
                      </p>
                      <p className="text-xs text-gray-500">Score de Fiabilidad: {rel.score}/100</p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <h3 className="mb-3 text-sm font-bold uppercase text-gray-500 dark:text-gray-400">Historial de Citas</h3>
            <div className="space-y-3">
              {getClientHistory(selectedClient.id).map(apt => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 hover:bg-gray-50 dark:border-dark-border dark:hover:bg-[#252525]">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{apt.servicio}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar size={12} /> {apt.fecha}
                    </div>
                  </div>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[apt.estado]}`}>
                    {STATUS_LABELS[apt.estado] || apt.estado}
                  </span>
                </div>
              ))}
              {getClientHistory(selectedClient.id).length === 0 && (
                <p className="text-center text-sm text-gray-500">No hay historial disponible.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 dark:bg-dark-card shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Registrar Nuevo Cliente</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-dark-border"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  disabled={isCreatingClient}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-primary focus:ring-primary disabled:opacity-50"
                  placeholder="Ej. Maria Perez"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono</label>
                <input
                  type="tel"
                  required
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                  disabled={isCreatingClient}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm dark:border-dark-border dark:bg-dark-bg dark:text-white focus:border-primary focus:ring-primary disabled:opacity-50"
                  placeholder="+51 999 999 999"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isCreatingClient}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClient || !newClientName || !newClientPhone}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-black hover:bg-primary-dim shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingClient ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Cliente'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSS for toast animation */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ClientsPage;
