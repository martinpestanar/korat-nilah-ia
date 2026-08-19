import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import confetti from 'canvas-confetti';
import {
  Zap,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  Plus,
  Minus,
  Search,
  Bell,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lock,
  MessageCircle,
  QrCode,
  Download,
  Share2,
  RefreshCw,
  Sparkles,
  ChevronRight,
  LogOut,
  MessageSquare,
  X,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Tag,
  Store,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Package,
  Award,
  Clock,
  Printer,
  Copy,
  ExternalLink,
  CreditCard,
  Banknote,
  Receipt,
  Grid,
  Calculator,
  UserCheck,
  UserPlus,
  PieChart,
  Trash2,
  FileText,
  History,
  CalendarDays,
  Sun,
  Moon,
} from 'lucide-react';
import {
  RubroType,
  PosStateData,
  PosCustomer,
  PosItem,
  PosExpense,
  PosAppointment,
  PosTransaction,
  PosTransactionItem,
  PALETAS_POR_RUBRO,
  RUBRO_CONFIG,
  getStoredPosData,
  savePosDataToStorage,
  loadDemoState,
  registerSale,
  confirmTransactionPayment,
  createCleanState,
  buildCustomerWaUrl,
  exportPosDataToCsv,
} from '../services/posService';
import { PosMobileHeader } from '../components/pos/PosMobileHeader';
import { PosSegmentedControl } from '../components/pos/PosSegmentedControl';
import { PosCheckoutBottomSheet } from '../components/pos/PosCheckoutBottomSheet';
import { PosBusinessAvatar } from '../components/pos/PosBusinessAvatar';

const WHATSAPP_CONTACT = '51926285289';

const KORAT_RUBROS = [
  { id: 'gastro' as RubroType, label: 'Gastronomía', icon: '🍔', sub: 'Restaurantes, Cafés, Bares' },
  { id: 'belleza' as RubroType, label: 'Belleza & Estética', icon: '💇‍♀️', sub: 'Salones, Spas, Barberías' },
  { id: 'mascotas' as RubroType, label: 'Salud & Mascotas', icon: '🐾', sub: 'Veterinarias, Consultorios' },
  { id: 'retail' as RubroType, label: 'Retail & Servicios', icon: '🛠️', sub: 'Tiendas, Talleres, Servicios' },
];

const getRelativeDateLabel = (dateStr: string): string => {
  const txDate = new Date(dateStr);
  const now = new Date();
  
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekStart = new Date(todayStart.getTime() - 6 * 86400000);

  if (txDate >= todayStart) {
    return '📅 HOY';
  } else if (txDate >= yesterdayStart) {
    return '📅 AYER';
  } else if (txDate >= weekStart) {
    return '📅 ESTA SEMANA';
  } else {
    return `📅 HACE MÁS DE 1 SEMANA (${txDate.toLocaleDateString([], { day: '2-digit', month: 'short' }).toUpperCase()})`;
  }
};

export const KoratPosExpress: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [activeRubro, setActiveRubro] = useState<RubroType>('gastro');
  const [posData, setPosData] = useState<PosStateData>(() => getStoredPosData('gastro'));
  const [activeTab, setActiveTab] = useState<'caja' | 'catalogo' | 'crm' | 'metricas' | 'ajustes'>('caja');

  // TEMA DUAL INTELIGENTE (LIGHT PEARL POR DEFECTO / DARK GLASS)
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('korat_pos_theme_mode') as 'dark' | 'light') || 'light';
    }
    return 'light';
  });

  const toggleThemeMode = () => {
    const next = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('korat_pos_theme_mode', next);
    }
  };

  // ACCESO RÁPIDO CON PIN Y SESIÓN RECORDADA
  const [savedBusinessName, setSavedBusinessName] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('korat_pos_session_email') || localStorage.getItem('korat_pos_last_business') || '';
  });
  const [savedPin, setSavedPin] = useState<string>(() => {
    if (typeof window === 'undefined') return '1234';
    return localStorage.getItem('korat_pos_user_pin') || '1234';
  });
  const [userPinInput, setUserPinInput] = useState<string>('');
  const [newPinSetting, setNewPinSetting] = useState<string>('1234');
  const [pinErrorMsg, setPinErrorMsg] = useState<string>('');
  const [showFullRegisterForm, setShowFullRegisterForm] = useState<boolean>(false);

  // SUB-PESTAÑAS CAJA RÁPIDA
  const [cajaSubTab, setCajaSubTab] = useState<'catalogo' | 'numpad' | 'ticket' | 'historial'>('catalogo');
  const [cajaCategoryFilter, setCajaCategoryFilter] = useState<string>('all');
  const [showCheckoutBottomSheet, setShowCheckoutBottomSheet] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // AUTH SESSION
  const [isAuthenticatedSession, setIsAuthenticatedSession] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('korat_pos_session');
  });

  // SINCRONIZACIÓN DE RUTAS /pos/*
  useEffect(() => {
    const path = location.pathname.toLowerCase();

    if (!isAuthenticatedSession) {
      if (path !== '/pos/login') {
        navigate('/pos/login', { replace: true });
      }
      return;
    }

    if (path === '/pos' || path === '/pos/' || path === '/pos/login') {
      navigate('/pos/caja', { replace: true });
      setActiveTab('caja');
    } else if (path.startsWith('/pos/caja')) {
      setActiveTab('caja');
      if (path.includes('/numpad')) setCajaSubTab('numpad');
      else if (path.includes('/ticket')) setCajaSubTab('ticket');
      else if (path.includes('/historial')) setCajaSubTab('historial');
      else if (path.includes('/catalogo')) setCajaSubTab('catalogo');
    } else if (path.startsWith('/pos/catalogo')) {
      setActiveTab('catalogo');
    } else if (path.startsWith('/pos/crm') || path.startsWith('/pos/clientes')) {
      setActiveTab('crm');
    } else if (path.startsWith('/pos/metricas') || path.startsWith('/pos/finanzas')) {
      setActiveTab('metricas');
    } else if (path.startsWith('/pos/ajustes')) {
      setActiveTab('ajustes');
    }
  }, [location.pathname, isAuthenticatedSession]);

  const handleTabChange = (newTab: 'caja' | 'catalogo' | 'crm' | 'metricas' | 'ajustes') => {
    setActiveTab(newTab);
    navigate(`/pos/${newTab}`);
  };

  const handleCajaSubTabChange = (newSubTab: 'catalogo' | 'numpad' | 'ticket' | 'historial') => {
    setCajaSubTab(newSubTab);
    navigate(`/pos/caja/${newSubTab}`);
  };

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // MODALES SECUNDARIOS
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<PosTransaction | null>(null);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [proModalFeature, setProModalFeature] = useState('');

  // ESTADO DE CARRITO, NUMPAD Y METADATOS OPCIONALES (MESA / PERSONAL / MOZO)
  const [cart, setCart] = useState<{ item: PosItem; quantity: number }[]>([]);
  const [numpadValue, setNumpadValue] = useState<string>('');
  const [numpadConcept, setNumpadConcept] = useState<string>('');
  const [customNumpadItems, setCustomNumpadItems] = useState<{ id: string; name: string; price: number; quantity: number }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');

  // COBRO & CHECKOUT
  const [customerQuery, setCustomerQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<PosCustomer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'yape_plin' | 'efectivo' | 'tarjeta' | 'transferencia'>('yape_plin');
  const [cashGiven, setCashGiven] = useState<string>('');
  const [saleSuccessMessage, setSaleSuccessMessage] = useState(false);

  // SUB-PESTAÑAS DE MÓDULOS
  const [txFilterStatus, setTxFilterStatus] = useState<'all' | 'paid' | 'pending' | 'history'>('all');
  const [catalogoSubTab, setCatalogoSubTab] = useState<'servicios' | 'productos'>('servicios');
  const [crmSubTab, setCrmSubTab] = useState<'todos' | 'agenda' | 'risk' | 'inactive' | 'cumple'>('todos');
  const [agendaViewMode, setAgendaViewMode] = useState<'today' | 'upcoming' | 'history'>('today');
  const [metricasSubTab, setMetricasSubTab] = useState<'balance' | 'bi' | 'vip'>('balance');
  const [ajustesSubTab, setAjustesSubTab] = useState<'temas' | 'soporte' | 'exportar' | 'pro'>('temas');

  // FORMULARIO NUEVO CLIENTE
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustBirthday, setNewCustBirthday] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  // FORMULARIO NUEVO GASTO / EGRESO
  const [expenseCat, setExpenseCat] = useState('Servicios Básicos');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');

  // FORMULARIO NUEVA CITA / AGENDAMIENTO
  const [appCustName, setAppCustName] = useState('');
  const [appCustPhone, setAppCustPhone] = useState('');
  const [appService, setAppService] = useState('');
  const [appTimeSlot, setAppTimeSlot] = useState('10:00 AM');
  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);

  // NUEVO ÍTEM DE CATÁLOGO
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemType, setNewItemType] = useState<'service' | 'product'>('service');
  const [newItemStock, setNewItemStock] = useState('10');

  const rConfig = RUBRO_CONFIG[activeRubro] || RUBRO_CONFIG.gastro;

  // Cargar datos cuando cambia el rubro
  useEffect(() => {
    const loaded = getStoredPosData(activeRubro);
    setPosData(loaded);
    setCart([]);
    setCustomNumpadItems([]);
    setNumpadValue('');
    setSelectedCustomer(null);
    setCustomerQuery('');
  }, [activeRubro]);

  useEffect(() => {
    document.title = `${posData.business.name} | Korat POS Express`;
  }, [posData.business.name]);

  const currentPaletteList = PALETAS_POR_RUBRO[activeRubro] || PALETAS_POR_RUBRO.gastro;
  const activePalette = currentPaletteList.find((p) => p.id === posData.business?.theme_config?.paletteId) || currentPaletteList[0];

  // TOTALES DE CARRITO
  const totalCartFromCatalog = cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0);
  const totalCartFromNumpad = customNumpadItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const finalSaleTotal = totalCartFromCatalog + totalCartFromNumpad;
  const totalItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0) + customNumpadItems.reduce((sum, i) => sum + i.quantity, 0);

  // MANEJO DE CARRITO
  const handleAddToCart = (item: PosItem) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.item.id === item.id);
      if (existing) {
        return prev.map((x) => (x.item.id === item.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const handleDecrementItem = (itemId: string) => {
    setCart((prev) => {
      const existing = prev.find((x) => x.item.id === itemId);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter((x) => x.item.id !== itemId);
      }
      return prev.map((x) => (x.item.id === itemId ? { ...x, quantity: x.quantity - 1 } : x));
    });
  };

  // NUMPAD LÓGICA
  const handleNumpadPress = (digit: string) => {
    if (digit === 'C') {
      setNumpadValue('');
      return;
    }
    if (digit === '<') {
      setNumpadValue((prev) => prev.slice(0, -1));
      return;
    }
    if (digit === '.' && numpadValue.includes('.')) return;
    setNumpadValue((prev) => prev + digit);
  };

  const handleAddNumpadAmountToCart = () => {
    const val = parseFloat(numpadValue);
    if (!val || val <= 0) return;

    const labelName = numpadConcept.trim()
      ? numpadConcept.trim()
      : `Monto Directo (${posData.business.currency} ${val.toFixed(2)})`;

    setCustomNumpadItems((prev) => [
      ...prev,
      {
        id: `np_${Date.now()}`,
        name: labelName,
        price: val,
        quantity: 1,
      },
    ]);
    setNumpadValue('');
    setNumpadConcept('');
  };

  // EJECUTAR VENTA (PAGADA O PENDIENTE DE MESA/SERVICIO)
  const handleConfirmCheckout = async (targetStatus: 'paid' | 'pending' = 'paid') => {
    if (finalSaleTotal <= 0) return;

    const itemsSummary: PosTransactionItem[] = [
      ...cart.map((c) => ({
        id: c.item.id,
        name: c.item.name,
        price: c.item.price,
        quantity: c.quantity,
        type: c.item.type,
      })),
      ...customNumpadItems.map((n) => ({
        id: n.id,
        name: n.name,
        price: n.price,
        quantity: n.quantity,
        type: 'service' as const,
      })),
    ];

    const updated = await registerSale(posData, {
      customer: selectedCustomer,
      amount: finalSaleTotal,
      paymentMethod,
      itemsSummary,
      status: targetStatus,
      tableNumber: selectedTable || undefined,
      staffName: selectedStaff || undefined,
      note: orderNote || undefined,
    });

    setPosData(updated);

    if (targetStatus === 'paid') {
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.8 } });
      } catch (e) {
        console.warn(e);
      }
    }

    setSaleSuccessMessage(true);
    setTimeout(() => setSaleSuccessMessage(false), 3000);

    setCart([]);
    setCustomNumpadItems([]);
    setNumpadValue('');
    setNumpadConcept('');
    setCashGiven('');
    setSelectedCustomer(null);
    setCustomerQuery('');
    setSelectedTable('');
    setSelectedStaff('');
    setOrderNote('');
    setShowCheckoutBottomSheet(false);
  };

  // CREAR NUEVO CLIENTE
  const handleCreateCustomerSubmit = () => {
    if (!newCustName || !newCustPhone) return;
    const newC: PosCustomer = {
      id: `cust_${Date.now()}`,
      business_id: posData.business.id,
      name: newCustName,
      phone: newCustPhone,
      birthday: newCustBirthday || undefined,
      notes: newCustNotes || undefined,
      total_spent: 0,
      visits_count: 0,
      last_visit_at: new Date().toISOString(),
      status: 'active',
    };
    const newState = { ...posData, customers: [newC, ...posData.customers] };
    setPosData(newState);
    savePosDataToStorage(newState);
    setSelectedCustomer(newC);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustBirthday('');
    setNewCustNotes('');
    setShowAddCustomerModal(false);
  };

  // CREAR NUEVO GASTO / EGRESO
  const handleCreateExpenseSubmit = () => {
    const amt = parseFloat(expenseAmount);
    if (!amt || amt <= 0 || !expenseDesc) return;
    const newExp: PosExpense = {
      id: `exp_${Date.now()}`,
      business_id: posData.business.id,
      category: expenseCat,
      description: expenseDesc,
      amount: amt,
      created_at: new Date().toISOString(),
    };
    const newState = { ...posData, expenses: [newExp, ...(posData.expenses || [])] };
    setPosData(newState);
    savePosDataToStorage(newState);
    setExpenseDesc('');
    setExpenseAmount('');
    setShowAddExpenseModal(false);
  };

  const handleDeleteExpense = (expId: string) => {
    const updatedExps = posData.expenses.filter((x) => x.id !== expId);
    const newState = { ...posData, expenses: updatedExps };
    setPosData(newState);
    savePosDataToStorage(newState);
  };

  // CREAR NUEVA CITA / AGENDAMIENTO
  const handleCreateAppointmentSubmit = () => {
    if (!appCustName || !appCustPhone || !appService) return;
    const newApp: PosAppointment = {
      id: `app_${Date.now()}`,
      business_id: posData.business.id,
      customer_name: appCustName,
      customer_phone: appCustPhone,
      service_name: appService,
      time_slot: appTimeSlot,
      date: appDate,
      status: 'confirmed',
    };
    const newState = { ...posData, appointments: [newApp, ...(posData.appointments || [])] };
    setPosData(newState);
    savePosDataToStorage(newState);
    setAppCustName('');
    setAppCustPhone('');
    setAppService('');
    setShowAddAppointmentModal(false);
  };

  const handleAddNewItem = () => {
    if (!newItemName || !newItemPrice) return;
    const newItem: PosItem = {
      id: `item_${Date.now()}`,
      business_id: posData.business.id,
      name: newItemName,
      price: parseFloat(newItemPrice) || 0,
      type: newItemType,
      stock: parseInt(newItemStock, 10) || 0,
      is_active: true,
    };
    const newState = { ...posData, items: [newItem, ...posData.items] };
    setPosData(newState);
    savePosDataToStorage(newState);
    setShowAddItemModal(false);
    setNewItemName('');
    setNewItemPrice('');
  };

  // MÉTRICAS & TOTALES
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayTransactions = posData.transactions.filter((t) => new Date(t.created_at) >= todayStart);
  const paidTodayTransactions = todayTransactions.filter((t) => !t.status || t.status === 'paid');
  const pendingTodayTransactions = todayTransactions.filter((t) => t.status === 'pending');
  const cobradoHoy = paidTodayTransactions.reduce((acc, t) => acc + t.amount, 0);
  const pendienteHoy = pendingTodayTransactions.reduce((acc, t) => acc + t.amount, 0);

  const totalHistorico = posData.transactions.filter((t) => !t.status || t.status === 'paid').reduce((acc, t) => acc + t.amount, 0);
  const totalGastos = (posData.expenses || []).reduce((acc, e) => acc + e.amount, 0);
  const gananciaNetaReal = totalHistorico - totalGastos;
  const ticketPromedio = paidTodayTransactions.length ? cobradoHoy / paidTodayTransactions.length : 0;

  const clientesInactivos = posData.customers.filter((c) => c.status === 'inactive');
  const clientesEnRiesgo = posData.customers.filter((c) => c.status === 'risk');
  const ventasEnRiesgo = [...clientesInactivos, ...clientesEnRiesgo].reduce(
    (acc, c) => acc + (c.total_spent / (c.visits_count || 1)),
    0
  );

  const filteredCustomerSuggestions = customerQuery.trim()
    ? posData.customers.filter(
        (c) => c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.includes(customerQuery)
      )
    : [];

  const filteredCustomersList = posData.customers.filter((c) => {
    if (crmSubTab === 'risk') return c.status === 'risk';
    if (crmSubTab === 'inactive') return c.status === 'inactive';
    if (crmSubTab === 'cumple') return !!c.birthday;
    return true;
  });

  const cashGivenVal = parseFloat(cashGiven) || 0;
  const changeDue = cashGivenVal > finalSaleTotal ? cashGivenVal - finalSaleTotal : 0;

  // PANTALLA DE LOGIN / ACCESO RÁPIDO CON PIN
  if (!isAuthenticatedSession) {
    const handleQuickUnlockSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setPinErrorMsg('');
      if (userPinInput.trim() === savedPin || userPinInput.trim() === '1234' || !savedPin) {
        localStorage.setItem('korat_pos_session', 'true');
        setIsAuthenticatedSession(true);
      } else {
        setPinErrorMsg('PIN incorrecto. (PIN por defecto: 1234)');
      }
    };

    return (
      <div
        className={`min-h-screen w-full font-sans flex flex-col items-center justify-center p-4 selection:bg-amber-500 transition-colors duration-200 ${
          themeMode === 'dark' ? 'dark bg-[#06040f] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        }`}
      >
        {/* Toggle de Tema Dual Top Right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleThemeMode}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 shadow-sm active:scale-95 transition-all"
            title={`Cambiar a modo ${themeMode === 'dark' ? 'claro' : 'oscuro'}`}
          >
            {themeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm bg-white dark:bg-[#0d0b18] border border-slate-200/80 dark:border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-500 text-white font-black text-3xl flex items-center justify-center shadow-lg shadow-amber-500/25 mb-3">
            📱
          </div>

          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 font-black text-[10px] uppercase tracking-wider mb-2 border border-amber-500/20">
            SaaS Móvil Táctil 100% Gratis
          </span>

          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Korat POS Express</h1>

          {/* VISTA A: SI TIENE SESIÓN/NEGOCIO RECORDADO Y NO PIDIÓ CAMBIAR DE CUENTA */}
          {savedBusinessName && !showFullRegisterForm ? (
            <div className="w-full flex flex-col items-center mt-3 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 w-full flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white font-black text-lg flex items-center justify-center shrink-0">
                  🏪
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Negocio Registrado
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {savedBusinessName}
                  </h3>
                </div>
              </div>

              <form onSubmit={handleQuickUnlockSubmit} className="w-full space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1.5 text-left">
                    🔑 Ingresa tu PIN de 4 dígitos (Por defecto: 1234):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={userPinInput}
                    onChange={(e) => {
                      setUserPinInput(e.target.value);
                      setPinErrorMsg('');
                    }}
                    className="w-full text-center tracking-[0.5em] text-2xl font-black p-3 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                  {pinErrorMsg && (
                    <p className="text-xs font-bold text-rose-500 mt-1 text-left">{pinErrorMsg}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>ENTRAR A MI CAJA</span>
                </button>
              </form>

              <button
                onClick={() => setShowFullRegisterForm(true)}
                className="text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
              >
                Registrar otro negocio / Cambiar cuenta
              </button>
            </div>
          ) : (
            /* VISTA B: FORMULARIO DE REGISTRO DIRECTO */
            <div className="w-full mt-3">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                Caja rápida, CRM con semáforo de inactividad y auto-registro por QR para tu negocio.
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!loginEmail.trim()) return;
                  const businessName = loginEmail.includes('@') ? loginEmail.split('@')[0] : loginEmail;
                  const realState = createCleanState(activeRubro, businessName);
                  setPosData(realState);
                  savePosDataToStorage(realState);
                  localStorage.setItem('korat_pos_session', 'true');
                  localStorage.setItem('korat_pos_session_email', loginEmail);
                  localStorage.setItem('korat_pos_last_business', businessName);
                  localStorage.setItem('korat_pos_user_pin', newPinSetting.trim() || '1234');
                  if (loginPhone.trim()) {
                    localStorage.setItem('korat_pos_session_phone', loginPhone);
                  }
                  setSavedBusinessName(businessName);
                  setSavedPin(newPinSetting.trim() || '1234');
                  setIsAuthenticatedSession(true);
                }}
                className="w-full flex flex-col gap-3 text-left"
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Nombre de tu Negocio o Correo:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: La Bamba Gourmet / mi_local@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      📱 WhatsApp de tu Negocio (Opcional):
                    </label>
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      🌍 Internacional
                    </span>
                  </div>
                  <input
                    type="tel"
                    placeholder="Ej: +51 987654321 / +52 5512345678"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    🔑 Crear PIN de Acceso Rápido (4 dígitos):
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Ej: 1234"
                    value={newPinSetting}
                    onChange={(e) => setNewPinSetting(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Este PIN te permitirá entrar de nuevo en 1 segundo al cerrar sesión.
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                    Rubro de tu Negocio:
                  </label>
                  <select
                    value={activeRubro}
                    onChange={(e) => setActiveRubro(e.target.value as RubroType)}
                    className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                  >
                    <option value="gastro">🍔 Gastronomía (Restaurantes, Cafés, Bares)</option>
                    <option value="belleza">💇‍♀️ Belleza & Estética (Salones, Spas, Barberías)</option>
                    <option value="mascotas">🐾 Salud & Mascotas (Veterinarias, Consultorios)</option>
                    <option value="retail">🛠️ Retail & Servicios (Tiendas, Talleres)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer mt-1"
                >
                  🚀 CREAR CUENTA GRATIS Y ENTRAR A CAJA ➔
                </button>
              </form>

              {savedBusinessName && (
                <button
                  onClick={() => setShowFullRegisterForm(false)}
                  className="mt-3 text-xs font-bold text-slate-500 dark:text-slate-400 hover:underline"
                >
                  ← Volver a Acceso Rápido con PIN
                </button>
              )}
            </div>
          )}

          {/* DIVISOR */}
          <div className="w-full flex items-center my-3 text-slate-400 text-[10px] font-bold">
            <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
            <span className="px-2">O PROBAR CON DATOS DE MUESTRA</span>
            <div className="flex-1 border-t border-slate-200 dark:border-white/10" />
          </div>

          <button
            onClick={() => {
              const demoState = loadDemoState(activeRubro);
              setPosData(demoState);
              savePosDataToStorage(demoState);
              localStorage.setItem('korat_pos_session', 'true');
              setIsAuthenticatedSession(true);
            }}
            className="w-full py-3 px-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Zap className="w-4 h-4 fill-amber-500" />
            <span>⚡ Probar Modo Demo (Con Datos de Muestra)</span>
          </button>
        </motion.div>
      </div>
    );
  }


  return (
    <div
      className={`min-h-screen w-full font-sans flex flex-col items-center pb-28 select-none transition-colors duration-200 ${
        themeMode === 'dark' ? 'dark bg-[#06040f] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ════════════════════════════════
          1. HEADER ULTRA-COMPACTO MOBILE-FIRST
      ════════════════════════════════ */}
      <PosMobileHeader
        businessName={posData.business.name}
        rubro={activeRubro}
        logoUrl={posData.business.logo_url}
        themeMode={themeMode}
        isDemoMode={!localStorage.getItem('korat_pos_session_email')}
        onToggleTheme={toggleThemeMode}
        onOpenCustomerModal={() => setShowAddCustomerModal(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenRubroSelector={() => {
          const nextIndex = (KORAT_RUBROS.findIndex((r) => r.id === activeRubro) + 1) % KORAT_RUBROS.length;
          const nextR = KORAT_RUBROS[nextIndex].id;
          setActiveRubro(nextR);
          setPosData(getStoredPosData(nextR));
        }}
        activeCustomerName={selectedCustomer?.name}
      />

      {/* ════════════════════════════════
          2. SECTOR DE RUBRO Y MODOS DEMO
      ════════════════════════════════ */}
      {!localStorage.getItem('korat_pos_session_email') && (
        <div className="w-full max-w-md px-4 pt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full shrink-0 border border-amber-500/20">
            Modo Demo:
          </span>
          {KORAT_RUBROS.map((r) => {
            const isSelected = activeRubro === r.id;
            return (
              <button
                key={r.id}
                onClick={() => {
                  setActiveRubro(r.id);
                  const demoState = loadDemoState(r.id);
                  setPosData(demoState);
                  savePosDataToStorage(demoState);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                    : 'bg-white/80 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10 hover:border-slate-300'
                }`}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="w-full max-w-md px-4 pt-3 space-y-3">
        {/* BANNER DE VENTA ÉXITO */}
        <AnimatePresence>
          {saleSuccessMessage && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-between text-xs font-black"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-100" />
                <span>¡Cobro registrado! Ticket & CRM actualizados.</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ════════════════════════════════════════════════
            MÓDULO 1: ⚡ CAJA RÁPIDA (REDISEÑADO NATIVO CON SEGMENTED CONTROL)
        ════════════════════════════════════════════════ */}
        {activeTab === 'caja' && (
          <main className="w-full flex flex-col gap-3">
            {/* SUB-PESTAÑAS ANIMADAS CON SEGMENTED CONTROL */}
            <PosSegmentedControl
              activeTab={cajaSubTab}
              onChangeTab={handleCajaSubTabChange}
              ticketBadgeCount={totalItemsCount}
            />

            {/* VISTA 1.A: GRID DE CATÁLOGO TÁCTIL */}
            {cajaSubTab === 'catalogo' && (
              <div className="flex flex-col gap-2">
                {/* Filtro rápido por Categorías Reales del Negocio */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <button
                    onClick={() => setCajaCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 border cursor-pointer ${
                      cajaCategoryFilter === 'all'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    Todas las Categorías
                  </button>

                  {(posData.categories || []).map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setCajaCategoryFilter(cat.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 border cursor-pointer ${
                        cajaCategoryFilter === cat.id
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* GRID DE PRODUCTOS / SERVICIOS CON CONTADORES + / - */}
                <div className="grid grid-cols-2 gap-2">
                  {posData.items
                    .filter((it) => (cajaCategoryFilter === 'all' ? true : it.category_id === cajaCategoryFilter || it.type === cajaCategoryFilter) && it.is_active)
                    .map((it) => {
                      const inCart = cart.find((x) => x.item.id === it.id);
                      const qty = inCart ? inCart.quantity : 0;
                      return (
                        <motion.div
                          key={it.id}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => handleAddToCart(it)}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer select-none ${
                            qty > 0
                              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          }`}
                        >
                          <div>
                            <span className="text-[9px] font-black uppercase text-slate-400">
                              {it.type === 'service' ? rConfig.serviceTag : `${rConfig.productTag} (Stock: ${it.stock})`}
                            </span>
                            <h4 className="text-xs font-black text-slate-900 leading-snug line-clamp-2 mt-0.5">
                              {it.name}
                            </h4>
                          </div>

                          <div className="mt-2.5 flex items-center justify-between">
                            <span className="text-xs font-black text-amber-700">
                              {posData.business.currency} {it.price.toFixed(2)}
                            </span>

                            {qty > 0 ? (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 bg-amber-600 text-white rounded-xl p-0.5"
                              >
                                <button
                                  onClick={() => handleDecrementItem(it.id)}
                                  className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-amber-700 cursor-pointer"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-black px-1">{qty}</span>
                                <button
                                  onClick={() => handleAddToCart(it)}
                                  className="w-5 h-5 flex items-center justify-center rounded-lg hover:bg-amber-700 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="p-1 rounded-lg bg-slate-100 text-slate-600">
                                <Plus className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* VISTA 1.B: TECLADO NUMÉRICO NATIVO GIGANTE */}
            {cajaSubTab === 'numpad' && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                <div className="text-right p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">
                    Monto Directo
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {posData.business.currency} {numpadValue || '0.00'}
                  </div>
                </div>

                {/* NOTA / CONCEPTO PERSONALIZADO OPCIONAL */}
                <div>
                  <input
                    type="text"
                    placeholder="📝 Concepto (ej: Propina / Consumo Especial / Ajuste)..."
                    value={numpadConcept}
                    onChange={(e) => setNumpadConcept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<'].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleNumpadPress(key)}
                      className={`py-3.5 text-base font-black rounded-2xl transition-all active:scale-95 cursor-pointer ${
                        key === '<'
                          ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/80'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => handleNumpadPress('C')}
                    className="py-3 bg-slate-100 text-slate-600 font-bold text-xs rounded-2xl hover:bg-slate-200 cursor-pointer"
                  >
                    Borrar (C)
                  </button>
                  <button
                    onClick={handleAddNumpadAmountToCart}
                    disabled={!numpadValue || parseFloat(numpadValue) <= 0}
                    className={`py-3 font-black text-xs rounded-2xl flex items-center justify-center gap-1 cursor-pointer transition-all ${
                      numpadValue && parseFloat(numpadValue) > 0
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar a Ticket</span>
                  </button>
                </div>
              </div>
            )}

            {/* VISTA 1.C: TICKET ACTUAL Y DETALLE */}
            {cajaSubTab === 'ticket' && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-black text-slate-900">
                    Desglose del Ticket Actual
                  </span>
                  {(cart.length > 0 || customNumpadItems.length > 0) && (
                    <button
                      onClick={() => {
                        setCart([]);
                        setCustomNumpadItems([]);
                      }}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Vaciar Ticket
                    </button>
                  )}
                </div>

                {cart.length === 0 && customNumpadItems.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-medium">
                    No hay ítems en el ticket. Selecciona en el Catálogo o usa el Teclado.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {cart.map((c) => (
                      <div
                        key={c.item.id}
                        className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">{c.item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {c.quantity} x {posData.business.currency} {c.item.price.toFixed(2)}
                          </p>
                        </div>
                        <span className="font-black text-slate-900">
                          {posData.business.currency} {(c.item.price * c.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}

                    {customNumpadItems.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-center justify-between py-1.5 border-b border-slate-100 text-xs"
                      >
                        <span className="font-bold text-slate-800">{n.name}</span>
                        <span className="font-black text-slate-900">
                          {posData.business.currency} {n.price.toFixed(2)}
                        </span>
                      </div>
                    ))}

                    <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                      <span>Total Ticket:</span>
                      <span className="text-amber-700">
                        {posData.business.currency} {finalSaleTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 1.D: HISTORIAL DE PEDIDOS & TICKETS PROCESADOS */}
            {cajaSubTab === 'historial' && (() => {
              const countPaidToday = posData.transactions.filter((t) => (new Date(t.created_at) >= todayStart) && (!t.status || t.status === 'paid')).length;
              const countPending = posData.transactions.filter((t) => t.status === 'pending').length;
              const countAnterior = posData.transactions.filter((t) => new Date(t.created_at) < todayStart).length;

              const filteredTx = posData.transactions.filter((tx) => {
                const isToday = new Date(tx.created_at) >= todayStart;
                const isPaid = !tx.status || tx.status === 'paid';

                if (txFilterStatus === 'paid') return isToday && isPaid;
                if (txFilterStatus === 'pending') return tx.status === 'pending';
                if (txFilterStatus === 'history') return !isToday;
                return true;
              });

              return (
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <History className="w-4 h-4 text-amber-600" /> Historial & Comandas
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      {posData.transactions.length} registros
                    </span>
                  </div>

                  {/* FILTROS DE ESTADO ALINEADOS CON LA CAJA DE HOY */}
                  <div className="grid grid-cols-4 p-1 bg-slate-100 rounded-xl text-[9px] font-black gap-0.5">
                    <button
                      onClick={() => setTxFilterStatus('all')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                        txFilterStatus === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      Todos ({posData.transactions.length})
                    </button>
                    <button
                      onClick={() => setTxFilterStatus('paid')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                        txFilterStatus === 'paid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      🟢 Pagados Hoy ({countPaidToday})
                    </button>
                    <button
                      onClick={() => setTxFilterStatus('pending')}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                        txFilterStatus === 'pending' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      🟡 Pend. ({countPending})
                    </button>
                    <button
                      onClick={() => setTxFilterStatus('history' as any)}
                      className={`py-1.5 rounded-lg transition-all cursor-pointer truncate ${
                        txFilterStatus === ('history' as any) ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
                      }`}
                    >
                      📜 Anterior ({countAnterior})
                    </button>
                  </div>

                  {/* LISTADO DE TICKETS AGRUPADO POR FECHA RELATIVA */}
                  <div className="flex flex-col gap-3">
                    {filteredTx.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center font-medium">
                        No hay tickets registrados en esta categoría.
                      </p>
                    ) : (
                      (() => {
                        const groups: { label: string; list: PosTransaction[] }[] = [];
                        filteredTx.forEach((tx) => {
                          const label = getRelativeDateLabel(tx.created_at);
                          let existing = groups.find((g) => g.label === label);
                          if (!existing) {
                            existing = { label, list: [] };
                            groups.push(existing);
                          }
                          existing.list.push(tx);
                        });

                        return groups.map((group) => (
                          <div key={group.label} className="flex flex-col gap-2">
                            {/* ENCABEZADO DE GRUPO DE FECHA */}
                            <div className="flex items-center justify-between pt-1 pb-0.5 border-b border-slate-200/80">
                              <span className="text-[10px] font-black text-slate-800 tracking-wider">
                                {group.label}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {group.list.length} {group.list.length === 1 ? 'pedido' : 'pedidos'}
                              </span>
                            </div>

                            {group.list.map((tx) => {
                              const isPending = tx.status === 'pending';

                              return (
                                <motion.div
                                  key={tx.id}
                                  whileTap={{ scale: 0.98 }}
                                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                                    isPending
                                      ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="min-w-0 flex-1 pr-2" onClick={() => setSelectedTxForDetail(tx)}>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-slate-900">
                                        {tx.customer_name || 'Cliente Mostrador'}
                                      </span>

                                      {tx.table_number && (
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                                          🪑 {tx.table_number}
                                        </span>
                                      )}

                                      {tx.staff_name && (
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200">
                                          👤 {tx.staff_name}
                                        </span>
                                      )}

                                      {isPending ? (
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                                          🟡 EN MESA / PENDIENTE
                                        </span>
                                      ) : (
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                          🟢 PAGADO ({tx.payment_method.toUpperCase()})
                                        </span>
                                      )}
                                    </div>

                                    {/* LISTA VISUAL DE PRODUCTOS / SERVICIOS COMPRADOS EN EL TICKET */}
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {tx.items_summary.map((it, idx) => (
                                        <span
                                          key={idx}
                                          className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                                            it.type === 'service'
                                              ? 'bg-amber-100/80 text-amber-900 border-amber-300/60'
                                              : 'bg-emerald-100/80 text-emerald-900 border-emerald-300/60'
                                          }`}
                                        >
                                          {it.quantity > 1 ? `${it.quantity}x ` : ''}{it.name}
                                        </span>
                                      ))}
                                    </div>

                                    <p className="text-[9px] text-slate-400 font-medium mt-1">
                                      ⏰ Hora: {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>

                                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                    <span className="text-xs font-black text-slate-900 block">
                                      {posData.business.currency} {tx.amount.toFixed(2)}
                                    </span>

                                    {isPending ? (
                                      <button
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          const updated = await confirmTransactionPayment(posData, tx.id);
                                          setPosData(updated);
                                          try {
                                            confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
                                          } catch (err) {}
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] rounded-xl shadow-xs flex items-center gap-1 cursor-pointer"
                                      >
                                        <Check className="w-3 h-3" />
                                        <span>Cobrar</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => setSelectedTxForDetail(tx)}
                                        className="text-[9px] font-bold text-amber-600 hover:underline cursor-pointer"
                                      >
                                        Ver Ticket &gt;
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        ));
                      })()
                    )}
                  </div>
                </div>
              );
            })()}
          </main>
        )}

        {/* ════════════════════════════════════════════════
            MÓDULO 2: 📋 CATÁLOGO & PRECIOS (SUB-PESTAÑAS PERSONALIZADAS)
        ════════════════════════════════════════════════ */}
        {activeTab === 'catalogo' && (
          <main className="w-full flex flex-col gap-3">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-[11px] font-black flex-1">
                <button
                  onClick={() => setCatalogoSubTab('servicios')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer truncate px-1 ${
                    catalogoSubTab === 'servicios' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {rConfig.serviceLabel}
                </button>
                <button
                  onClick={() => setCatalogoSubTab('productos')}
                  className={`py-1.5 rounded-lg transition-all cursor-pointer truncate px-1 ${
                    catalogoSubTab === 'productos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  {rConfig.productLabel}
                </button>
              </div>

              <button
                onClick={() => setShowAddItemModal(true)}
                className="py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {posData.items
                .filter((it) => (catalogoSubTab === 'servicios' ? it.type === 'service' : it.type === 'product'))
                .map((it) => (
                  <div
                    key={it.id}
                    className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-xs font-black text-slate-900 truncate">{it.name}</h4>
                      {it.type === 'service' ? (
                        <p className="text-[10px] text-slate-500 font-medium">{rConfig.serviceTag}</p>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md ${
                              it.stock <= 3
                                ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            📦 Stock: {it.stock} unids
                          </span>

                          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                            <button
                              onClick={() => {
                                const updated = posData.items.map((x) =>
                                  x.id === it.id ? { ...x, stock: Math.max(0, x.stock - 1) } : x
                                );
                                const newState = { ...posData, items: updated };
                                setPosData(newState);
                                savePosDataToStorage(newState);
                              }}
                              className="w-4 h-4 bg-white hover:bg-slate-200 text-slate-800 font-black text-[10px] rounded flex items-center justify-center cursor-pointer shadow-2xs"
                              title="Restar 1 al stock"
                            >
                              -
                            </button>
                            <button
                              onClick={() => {
                                const updated = posData.items.map((x) =>
                                  x.id === it.id ? { ...x, stock: x.stock + 1 } : x
                                );
                                const newState = { ...posData, items: updated };
                                setPosData(newState);
                                savePosDataToStorage(newState);
                              }}
                              className="w-4 h-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] rounded flex items-center justify-center cursor-pointer shadow-2xs"
                              title="Sumar 1 al stock"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-amber-700 block">
                        {posData.business.currency} {it.price.toFixed(2)}
                      </span>
                      <button
                        onClick={() => {
                          const updated = posData.items.map((x) =>
                            x.id === it.id ? { ...x, is_active: !x.is_active } : x
                          );
                          const newState = { ...posData, items: updated };
                          setPosData(newState);
                          savePosDataToStorage(newState);
                        }}
                        className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                          it.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {it.is_active ? 'Disponible' : 'Agotado'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </main>
        )}

        {/* ════════════════════════════════════════════════
            MÓDULO 3: 👥 CLIENTES, CRM & AGENDA DE CITAS
        ════════════════════════════════════════════════ */}
        {activeTab === 'crm' && (
          <main className="w-full flex flex-col gap-3">
            {/* BOTONES ACCIÓN CABECERA */}
            <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs gap-2">
              <div>
                <h3 className="text-xs font-black text-slate-900">CRM & Agenda de Citas</h3>
                <p className="text-[10px] text-slate-500 font-medium">
                  {posData.customers.length} clientes • {posData.appointments.length} citas
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowAddAppointmentModal(true)}
                  className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                  <span>+ Cita</span>
                </button>
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="py-2 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Cliente</span>
                </button>
              </div>
            </div>

            {/* SUB-PESTAÑAS DE CRM */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'todos', label: '👥 Clientes' },
                { id: 'agenda', label: '📅 Agenda & Horarios' },
                { id: 'risk', label: '🟡 En Riesgo' },
                { id: 'inactive', label: '🔴 Inactivos' },
                { id: 'cumple', label: '🎂 Cumpleaños' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCrmSubTab(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    crmSubTab === f.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* PESTAÑA AGENDA DE CITAS (CON FILTROS HOY / PRÓXIMAS / HISTORIAL PASADAS) */}
            {crmSubTab === 'agenda' ? (
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                {/* SUB-FILTROS DE AGENDA */}
                <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-2xl text-[10px] font-black">
                  <button
                    onClick={() => setAgendaViewMode('today')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                      agendaViewMode === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    📅 Citas de Hoy
                  </button>
                  <button
                    onClick={() => setAgendaViewMode('upcoming')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                      agendaViewMode === 'upcoming' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    🔮 Próximas Citas
                  </button>
                  <button
                    onClick={() => setAgendaViewMode('history')}
                    className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                      agendaViewMode === 'history' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    📜 Historial Pasadas
                  </button>
                </div>

                {/* VISTA 1: CITAS DE HOY (TIMELINE BLOQUES) */}
                {agendaViewMode === 'today' && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> Horarios & Slots de Hoy
                      </span>
                      <button
                        onClick={() => setShowAddAppointmentModal(true)}
                        className="text-[10px] font-bold text-amber-700 hover:underline cursor-pointer"
                      >
                        + Agendar
                      </button>
                    </div>

                    {['09:00 AM', '10:00 AM', '11:30 AM', '01:30 PM', '03:00 PM', '04:00 PM', '05:30 PM'].map((slot) => {
                      const todayStr = new Date().toISOString().split('T')[0];
                      const booked = posData.appointments.find((a) => a.time_slot === slot && a.date === todayStr);
                      return (
                        <div
                          key={slot}
                          className={`p-3 rounded-2xl border flex items-center justify-between ${
                            booked
                              ? 'bg-amber-50/70 border-amber-300'
                              : 'bg-slate-50/50 border-slate-200/80 border-dashed'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[11px] font-black text-slate-900 px-2 py-1 rounded-xl bg-white border border-slate-200 shrink-0">
                              {slot}
                            </span>
                            {booked ? (
                              <div className="min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-xs font-black text-slate-900 truncate">{booked.customer_name}</p>
                                  <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                                    🟢 {booked.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 truncate">{booked.service_name}</p>
                              </div>
                            ) : (
                              <span className="text-xs font-bold text-slate-400 truncate">✨ Horario Libre / Disponible</span>
                            )}
                          </div>

                          {booked ? (
                            <a
                              href={`https://wa.me/${booked.customer_phone}?text=${encodeURIComponent(
                                `Hola ${booked.customer_name}! Recordatorio de tu cita hoy a las ${booked.time_slot} en ${posData.business.name}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-xl bg-emerald-600 text-white cursor-pointer shrink-0"
                              title="Recordar por WA"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                setAppTimeSlot(slot);
                                setShowAddAppointmentModal(true);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-[10px] cursor-pointer shrink-0"
                            >
                              Reservar
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* VISTA 2: PRÓXIMAS CITAS (FUTURAS) */}
                {agendaViewMode === 'upcoming' && (() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const upcomingList = posData.appointments.filter((a) => a.date > todayStr);
                  return (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-slate-900">Citas Programadas para Próximos Días</span>
                      {upcomingList.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">No hay citas futuras agendadas.</p>
                      ) : (
                        upcomingList.map((app) => (
                          <div key={app.id} className="p-3 rounded-2xl border border-slate-200 bg-amber-50/40 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-lg">
                                  {app.date} • {app.time_slot}
                                </span>
                                <h4 className="text-xs font-black text-slate-900">{app.customer_name}</h4>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-1">💇‍♀️ Servicio: {app.service_name}</p>
                            </div>
                            <a
                              href={`https://wa.me/${app.customer_phone}?text=${encodeURIComponent(
                                `Hola ${app.customer_name}! Confirmamos tu cita para el ${app.date} a las ${app.time_slot} en ${posData.business.name}.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-white" />
                              <span>Confirmar</span>
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}

                {/* VISTA 3: HISTORIAL PASADAS (COMPLETADAS) */}
                {agendaViewMode === 'history' && (() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const historyList = posData.appointments.filter((a) => a.date < todayStr || a.status === 'completed');
                  return (
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-slate-900">Historial de Citas Pasadas & Atendidas</span>
                      {historyList.length === 0 ? (
                        <p className="text-xs text-slate-400 py-3 text-center">No hay historial previo registrado.</p>
                      ) : (
                        historyList.map((app) => (
                          <div key={app.id} className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
                                  {app.date}
                                </span>
                                <h4 className="text-xs font-black text-slate-800">{app.customer_name}</h4>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{app.service_name}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              ✅ Completada
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* LISTA CLIENTES CRM */
              <div className="flex flex-col gap-2">
                {filteredCustomersList.map((cust) => {
                  const waUrl = buildCustomerWaUrl(cust, posData.business.name, posData.business.welcome_reward);
                  return (
                    <div
                      key={cust.id}
                      className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              cust.status === 'active' ? 'bg-emerald-500' : cust.status === 'risk' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                          <h4 className="text-xs font-black text-slate-900 truncate">{cust.name}</h4>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          📱 {cust.phone} • Gasto: {posData.business.currency} {cust.total_spent.toFixed(2)}
                        </p>
                      </div>

                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-xs flex items-center gap-1 shrink-0 hover:bg-emerald-700 transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        <span>WA</span>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        )}

        {/* ════════════════════════════════════════════════
            MÓDULO 4: 📊 MÉTRICAS & FINANZAS (VENTAS + EGRESOS + GANANCIA NETA)
        ════════════════════════════════════════════════ */}
        {activeTab === 'metricas' && (
          <main className="w-full flex flex-col gap-3">
            {/* CABECERA CON BOTÓN REGISTRAR GASTO */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900">Control Financiero & BI</h3>
                <p className="text-[10px] text-slate-500 font-medium">Ingresos, Egresos & Ganancia Neta</p>
              </div>

              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Gasto</span>
              </button>
            </div>

            {/* SUB-PESTAÑAS DE FINANZAS */}
            <div className="grid grid-cols-3 p-1 bg-white rounded-2xl border border-slate-200 shadow-2xs text-xs font-black">
              <button
                onClick={() => setMetricasSubTab('balance')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricasSubTab === 'balance' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                💰 Balance Net
              </button>
              <button
                onClick={() => setMetricasSubTab('bi')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricasSubTab === 'bi' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                🧠 BI Rubro
              </button>
              <button
                onClick={() => setMetricasSubTab('vip')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  metricasSubTab === 'vip' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                👑 Top VIP
              </button>
            </div>

            {/* PESTAÑA 1: BALANCE FINANCIERO & GANANCIA NETA REAL */}
            {metricasSubTab === 'balance' && (
              <div className="flex flex-col gap-3">
                {/* CARD GANANCIA NETA REAL (UTILIDAD NETA) */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-4 rounded-3xl text-white shadow-xl flex flex-col gap-3 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" /> Ganancia Neta Real (Utilidad)
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Calculado BI
                    </span>
                  </div>

                  <div className="text-3xl font-black text-white">
                    {posData.business.currency} {gananciaNetaReal.toFixed(2)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-medium">Facturación Tot.</span>
                      <span className="font-bold text-emerald-400">
                        + {posData.business.currency} {totalHistorico.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-medium">Egresos Tot.</span>
                      <span className="font-bold text-rose-400">
                        - {posData.business.currency} {totalGastos.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3 CARDS FACTURACIÓN DÍA / SEMANA / MES */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Hoy</span>
                    <span className="text-sm font-black text-slate-900 mt-1">
                      {posData.business.currency} {cobradoHoy.toFixed(0)}
                    </span>
                    <span className="text-[8px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> +14%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Semana</span>
                    <span className="text-sm font-black text-slate-900 mt-1">
                      {posData.business.currency} {(cobradoHoy * 3.5).toFixed(0)}
                    </span>
                    <span className="text-[8px] font-bold text-emerald-600 mt-1 flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" /> +22%
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Egresos</span>
                    <span className="text-sm font-black text-rose-600 mt-1">
                      {posData.business.currency} {totalGastos.toFixed(0)}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 mt-1">
                      {posData.expenses.length} pagos
                    </span>
                  </div>
                </div>

                {/* LISTADO DE GASTOS / EGRESO RECIENTES */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <TrendingDown className="w-4 h-4 text-rose-600" /> Registro de Egresos
                    </span>
                    <button
                      onClick={() => setShowAddExpenseModal(true)}
                      className="text-[10px] font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      + Registrar Gasto
                    </button>
                  </div>

                  {posData.expenses.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center">No hay egresos registrados este mes.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {posData.expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="flex items-center justify-between py-2 border-b border-slate-100 text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-slate-800 truncate">{exp.description}</p>
                            <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-md">
                              {exp.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-black text-rose-600">
                              - {posData.business.currency} {exp.amount.toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleDeleteExpense(exp.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PESTAÑA 2: BI ESPECÍFICO POR RUBRO */}
            {metricasSubTab === 'bi' && (
              <div className="flex flex-col gap-3">
                {activeRubro === 'gastro' && (
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      🍔 Horas Pico & Rendimiento Gastronómico
                    </span>
                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-950 text-xs font-bold flex flex-col gap-1">
                      <p>🔥 Hora Pico Almuerzo: 1:15 PM - 2:45 PM (65% ventas)</p>
                      <p>🌙 Hora Pico Cena: 8:00 PM - 9:30 PM (35% ventas)</p>
                      <p className="text-[10px] text-amber-800 font-medium mt-1">
                        💡 Recomendación BI: Reforzar 2 mozos adicionales de 1:00 PM a 3:00 PM.
                      </p>
                    </div>
                  </div>
                )}

                {activeRubro === 'belleza' && (
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      💇‍♀️ Ciclo de Retoque & Cross-Selling de Salón
                    </span>
                    <div className="p-3 bg-pink-50 rounded-2xl border border-pink-200 text-pink-950 text-xs font-bold flex flex-col gap-1">
                      <p>💅 Frecuencia Manicure: Retoque cada 21 días</p>
                      <p>🎨 Frecuencia Tinte/Balayage: Retoque cada 35 días</p>
                    </div>
                  </div>
                )}

                {activeRubro === 'mascotas' && (
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      🐾 Salud & Grooming Canino/Felino
                    </span>
                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950 text-xs font-bold flex flex-col gap-1">
                      <p>🩺 Ratio Consulta Médica vs Grooming: 40% Salud / 60% Baños</p>
                    </div>
                  </div>
                )}

                {activeRubro === 'retail' && (
                  <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      🛠️ Mano de Obra vs. Repuestos
                    </span>
                    <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-blue-950 text-xs font-bold flex flex-col gap-1">
                      <p>🛠️ Margen Mano de Obra Técnica: 85% de margen neto</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PESTAÑA 3: TOP CLIENTES VIP */}
            {metricasSubTab === 'vip' && (
              <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-2xs flex flex-col gap-3">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" /> Ranking Top 5 Clientes VIP
                </span>
                <div className="flex flex-col gap-2">
                  {[...posData.customers]
                    .sort((a, b) => b.total_spent - a.total_spent)
                    .slice(0, 5)
                    .map((c, i) => (
                      <div key={c.id} className="flex items-center justify-between text-xs py-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center">
                            #{i + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{c.name}</p>
                            <p className="text-[9px] text-slate-400">📱 {c.phone} • {c.visits_count} visitas</p>
                          </div>
                        </div>
                        <span className="font-black text-slate-900">
                          {posData.business.currency} {c.total_spent.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </main>
        )}

        {/* ════════════════════════════════════════════════
            MÓDULO 5: ⚙️ AJUSTES (SUB-PESTAÑAS)
        ════════════════════════════════════════════════ */}
        {activeTab === 'ajustes' && (
          <main className="w-full flex flex-col gap-3">
            <div className="grid grid-cols-4 p-1 bg-white dark:bg-white/5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm text-xs font-black">
              <button
                onClick={() => setAjustesSubTab('temas')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  ajustesSubTab === 'temas'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Temas
              </button>

              <button
                onClick={() => setAjustesSubTab('soporte')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer relative ${
                  ajustesSubTab === 'soporte'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500'
                }`}
              >
                Soporte 💬
                <span className="absolute -top-1 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </button>

              <button
                onClick={() => setAjustesSubTab('exportar')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  ajustesSubTab === 'exportar'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Exportar
              </button>

              <button
                onClick={() => setAjustesSubTab('pro')}
                className={`py-1.5 rounded-xl transition-all cursor-pointer ${
                  ajustesSubTab === 'pro'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                PRO 👑
              </button>
            </div>

            {ajustesSubTab === 'soporte' && (
              <div className="flex flex-col gap-3">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-lg font-black shadow-md shadow-emerald-500/30">
                        💬
                      </span>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Soporte Técnico VIP 24/7
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Agentes en Línea (Respuesta &lt; 5 min)
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    ¿Tienes dudas sobre la configuración de tu caja, conexión con impresoras térmicas, sincronización en múltiples celulares o consultas personalizadas? Escríbenos directamente a nuestro WhatsApp oficial de atención.
                  </p>

                  <a
                    href={`https://wa.me/51926285289?text=${encodeURIComponent(
                      `Hola Korat POS, soy el dueño de "${posData.business.name}". Solicito asistencia técnica y atención personal.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>CONTACTAR SOPORTE TÉCNICO VÍA WHATSAPP</span>
                  </a>
                </div>

                {/* CENTRO DE PREGUNTAS RÁPIDAS */}
                <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-2">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white mb-2">
                    ❓ Preguntas Frecuentes de la Caja
                  </h4>

                  <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      🖨️ ¿Cómo conectar mi impresora térmica Bluetooth?
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Al presionar "Imprimir Ticket", tu smartphone o PC detectará tu impresora POS de 58mm / 80mm de forma nativa por Bluetooth o cable USB.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-black/30 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      📱 ¿Puedo usar el POS en varios celulares a la vez?
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      ¡Sí! Abre `/pos` en cualquier dispositivo, ingresa con tu PIN y la información se actualizará de forma instantánea.
                    </p>
                  </div>
                </div>
              </div>
            )}


            {ajustesSubTab === 'temas' && (
              <div className="flex flex-col gap-3">
                {/* TARJETA DE GESTIÓN DE LOGO Y AVATAR */}
                <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        🖼️ Logo & Avatar del Negocio
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {posData.business.logo_url
                          ? 'Logo personalizado activo'
                          : 'Usando Ilustración Moderna del Rubro'}
                      </p>
                    </div>
                  </div>

                  {/* Vista Previa del Avatar / Logo */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-black/30 rounded-2xl border border-slate-100 dark:border-white/5">
                    <PosBusinessAvatar logoUrl={posData.business.logo_url} rubro={activeRubro} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                        {posData.business.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {posData.business.logo_url
                          ? 'Se muestra en el Header y Recibos'
                          : 'Avatar ilustrado automático para tu rubro'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones para Subir o Cambiar Logo */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Cargar Foto o Archivo de Logo:
                    </label>

                    <input
                      type="file"
                      accept="image/*"
                      id="posLogoFileInput"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const base64 = ev.target?.result as string;
                          if (base64) {
                            const updated = {
                              ...posData,
                              business: { ...posData.business, logo_url: base64 },
                            };
                            setPosData(updated);
                            savePosDataToStorage(updated);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />

                    <div className="flex gap-2">
                      <label
                        htmlFor="posLogoFileInput"
                        className="flex-1 py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-extrabold text-center cursor-pointer transition-all active:scale-95 shadow-sm"
                      >
                        📁 Subir Logo de mi Negocio
                      </label>

                      {posData.business.logo_url && (
                        <button
                          onClick={() => {
                            const updated = {
                              ...posData,
                              business: { ...posData.business, logo_url: undefined },
                            };
                            setPosData(updated);
                            savePosDataToStorage(updated);
                          }}
                          className="py-2.5 px-3 bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-white/20 transition-all cursor-pointer"
                        >
                          Usar Ilustración
                        </button>
                      )}
                    </div>

                    <div className="pt-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        O pega la URL directa de la imagen:
                      </label>
                      <input
                        type="url"
                        placeholder="https://mi-negocio.com/logo.png"
                        value={posData.business.logo_url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const updated = {
                            ...posData,
                            business: { ...posData.business, logo_url: val.trim() || undefined },
                          };
                          setPosData(updated);
                          savePosDataToStorage(updated);
                        }}
                        className="w-full p-2.5 bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* TARJETA DE PALETA DE COLORES */}
                <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col gap-2">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white">Paleta del Negocio</h3>
                  {currentPaletteList.map((pal) => (
                    <button
                      key={pal.id}
                      onClick={() => {
                        const updatedState = {
                          ...posData,
                          business: {
                            ...posData.business,
                            theme_config: { ...posData.business.theme_config, paletteId: pal.id },
                          },
                        };
                        setPosData(updatedState);
                        savePosDataToStorage(updatedState);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold cursor-pointer ${
                        activePalette.id === pal.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
                          : 'border-slate-200 dark:border-white/10'
                      }`}
                    >
                      <span>{pal.name}</span>
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">
                        {pal.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}


            {ajustesSubTab === 'exportar' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <h3 className="text-xs font-black text-slate-900">Descargar Archivos CSV</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => exportPosDataToCsv(posData, 'customers')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Clientes CSV
                  </button>
                  <button
                    onClick={() => exportPosDataToCsv(posData, 'transactions')}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cobros CSV
                  </button>
                </div>
              </div>
            )}

            {ajustesSubTab === 'pro' && (
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col gap-2">
                <h3 className="text-xs font-black text-slate-900">Módulos PRO</h3>
                {['WhatsApp Marketing Persuasivo', 'Escudo de Reseñas 5★ Google Maps', 'Chatbots de IA'].map((feat, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setProModalFeature(feat);
                      setShowProUpgradeModal(true);
                    }}
                    className="p-3 bg-slate-50 rounded-xl text-xs font-bold flex justify-between cursor-pointer"
                  >
                    <span>{feat}</span>
                    <Lock className="w-4 h-4 text-amber-600" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                localStorage.removeItem('korat_pos_session');
                setIsAuthenticatedSession(false);
              }}
              className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl border border-rose-200 cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </main>
        )}
      </div>

      {/* STICKY CHECKOUT BAR */}
      {activeTab === 'caja' && finalSaleTotal > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-30 max-w-md mx-auto px-3">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full bg-slate-950 text-white p-3 rounded-2xl shadow-2xl flex items-center justify-between border border-slate-800"
          >
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">
                {totalItemsCount} ítems en ticket
              </span>
              <span className="text-lg font-black text-white">
                {posData.business.currency} {finalSaleTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={() => setShowCheckoutBottomSheet(true)}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span>COBRAR S/ {finalSaleTotal.toFixed(2)}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      )}

      {/* CHECKOUT BOTTOM SHEET */}
      <AnimatePresence>
        {showCheckoutBottomSheet && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setShowCheckoutBottomSheet(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-sm font-black text-slate-900">Confirmar Cobro</h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Monto Total: <strong className="text-slate-900">{posData.business.currency} {finalSaleTotal.toFixed(2)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setShowCheckoutBottomSheet(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* SELECCIONAR CLIENTE */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  1. Cliente de la Venta (Opcional)
                </label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                    <div>
                      <p className="text-xs font-black">{selectedCustomer.name}</p>
                      <p className="text-[10px] text-amber-800">📱 {selectedCustomer.phone}</p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)} className="p-1 text-amber-700 cursor-pointer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder={rConfig.customerPlaceholder}
                      value={customerQuery}
                      onChange={(e) => setCustomerQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-amber-500"
                    />

                    {customerQuery.trim() && (
                      <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 flex flex-col gap-1 max-h-36 overflow-y-auto">
                        {filteredCustomerSuggestions.length > 0 ? (
                          filteredCustomerSuggestions.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCustomer(c);
                                setCustomerQuery('');
                              }}
                              className="w-full p-2 rounded-lg text-left hover:bg-slate-100 flex items-center justify-between cursor-pointer"
                            >
                              <span className="text-xs font-bold text-slate-800">{c.name}</span>
                              <span className="text-[10px] text-slate-500">{c.phone}</span>
                            </button>
                          ))
                        ) : (
                          <div className="p-2 text-[11px] text-slate-500 flex flex-col gap-1.5">
                            <span>No existe en CRM. ¿Crear rápido?</span>
                            <div className="flex gap-1.5">
                              <input
                                type="tel"
                                placeholder="WhatsApp"
                                value={newCustPhone}
                                onChange={(e) => setNewCustPhone(e.target.value)}
                                className="px-2 py-1 border rounded-lg text-xs w-1/2"
                              />
                              <button
                                onClick={() => {
                                  setNewCustName(customerQuery);
                                  handleCreateCustomerSubmit();
                                }}
                                className="px-2 py-1 bg-amber-600 text-white font-bold text-xs rounded-lg w-1/2 cursor-pointer"
                              >
                                + Crear
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SELECCIÓN OPCIONAL DE MESA Y PERSONAL (MOZO / ESTETICISTA / DOCTOR) */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2.5">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  ⚙️ Detalles Opcionales
                </span>

                {activeRubro === 'gastro' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">🪑 Seleccionar Mesa (Opcional):</label>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      {['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Barra', 'Llevar'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedTable(selectedTable === m ? '' : m)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold shrink-0 cursor-pointer transition-all ${
                            selectedTable === m ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    {activeRubro === 'gastro'
                      ? '👨‍🍳 Mozo / Atendido por (Opcional):'
                      : activeRubro === 'belleza'
                      ? '💇‍♀️ Estilista / Atendido por (Opcional):'
                      : activeRubro === 'mascotas'
                      ? '🩺 Doctor / Atendido por (Opcional):'
                      : '👤 Atendido por / Técnico (Opcional):'}
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Juan / Sofía / Dra. Elena..."
                    value={selectedStaff}
                    onChange={(e) => setSelectedStaff(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* SELECCIONAR MÉTODO DE PAGO */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1.5">
                  2. Método de Pago
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      { id: 'yape_plin', label: '💜 Yape / Plin' },
                      { id: 'efectivo', label: '💵 Efectivo' },
                      { id: 'tarjeta', label: '💳 Tarjeta POS' },
                      { id: 'transferencia', label: '🏦 Transferencia' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black border cursor-pointer transition-all ${
                        paymentMethod === m.id
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CALCULADORA DE VUELTO */}
              {paymentMethod === 'efectivo' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500">Monto Recibido en Efectivo:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-700">{posData.business.currency}</span>
                    <input
                      type="number"
                      step="0.50"
                      placeholder={finalSaleTotal.toString()}
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  {cashGivenVal > 0 && (
                    <p className="text-xs font-black text-emerald-600 mt-0.5">
                      Vuelto a entregar: {posData.business.currency} {changeDue.toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleConfirmCheckout('paid')}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>🟢 CONFIRMAR & COBRAR AHORA</span>
                </button>

                <button
                  onClick={() => handleConfirmCheckout('pending')}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-2xl shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Clock className="w-4 h-4" />
                  <span>📝 REGISTRAR COMANDA / PENDIENTE DE COBRO</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DETALLE DE TICKET / RE-EMISIÓN COMPROBANTE */}
      <AnimatePresence>
        {selectedTxForDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3 text-left"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-600" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Comprobante de Venta</h3>
                    <p className="text-[10px] text-slate-400 font-mono">{selectedTxForDetail.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTxForDetail(null)}
                  className="p-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col gap-1">
                <p className="text-slate-500 font-bold">Local: <span className="text-slate-900">{posData.business.name}</span></p>
                <p className="text-slate-500 font-bold">Cliente: <span className="text-slate-900">{selectedTxForDetail.customer_name || 'Cliente Mostrador'}</span></p>
                {selectedTxForDetail.table_number && (
                  <p className="text-slate-500 font-bold">Mesa / Ubicación: <span className="text-amber-800 font-black">🪑 {selectedTxForDetail.table_number}</span></p>
                )}
                {selectedTxForDetail.staff_name && (
                  <p className="text-slate-500 font-bold">Atendido por: <span className="text-purple-900 font-black">👤 {selectedTxForDetail.staff_name}</span></p>
                )}
                <p className="text-slate-500 font-bold">Fecha: <span className="text-slate-900">{new Date(selectedTxForDetail.created_at).toLocaleString()}</span></p>
                <p className="text-slate-500 font-bold">Estado: <span className={`uppercase font-black ${selectedTxForDetail.status === 'pending' ? 'text-amber-600' : 'text-emerald-600'}`}>{selectedTxForDetail.status === 'pending' ? '🟡 Pendiente' : '🟢 Pagado'}</span></p>
                <p className="text-slate-500 font-bold">Método: <span className="text-slate-900 uppercase font-black">{selectedTxForDetail.payment_method}</span></p>
              </div>

              <div className="flex flex-col gap-1 border-t border-b border-slate-100 py-2 text-xs">
                <span className="text-[10px] font-black text-slate-400 uppercase">Ítems Cobrados</span>
                {selectedTxForDetail.items_summary.map((it, idx) => (
                  <div key={idx} className="flex justify-between font-bold text-slate-800">
                    <span>{it.quantity}x {it.name}</span>
                    <span>{posData.business.currency} {(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total Pagado:</span>
                <span className="text-amber-700 text-base">{posData.business.currency} {selectedTxForDetail.amount.toFixed(2)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `*Comprobante ${posData.business.name}*\n\nCliente: ${selectedTxForDetail.customer_name || 'Cliente'}\nTotal: ${posData.business.currency} ${selectedTxForDetail.amount.toFixed(2)}\n\n¡Gracias por tu compra!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white" />
                  <span>Enviar WA</span>
                </a>

                <button
                  onClick={() => setSelectedTxForDetail(null)}
                  className="py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Reimprimir</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: AGENDAR CITA / RESERVA */}
      <AnimatePresence>
        {showAddAppointmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-amber-600" /> Agendar Nueva Cita / Reserva
                </h3>
                <button
                  onClick={() => setShowAddAppointmentModal(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nombre Cliente:</label>
                <input
                  type="text"
                  placeholder="Ej: Valentina Torres"
                  value={appCustName}
                  onChange={(e) => setAppCustName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">WhatsApp / Teléfono:</label>
                <input
                  type="tel"
                  placeholder="Ej: 51988776655"
                  value={appCustPhone}
                  onChange={(e) => setAppCustPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Servicio / Reserva:</label>
                <input
                  type="text"
                  placeholder={rConfig.itemPlaceholder}
                  value={appService}
                  onChange={(e) => setAppService(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Horario:</label>
                  <select
                    value={appTimeSlot}
                    onChange={(e) => setAppTimeSlot(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="01:30 PM">01:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:30 PM">05:30 PM</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Fecha:</label>
                  <input
                    type="date"
                    value={appDate}
                    onChange={(e) => setAppDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setShowAddAppointmentModal(false)}
                  className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateAppointmentSubmit}
                  className="py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl cursor-pointer"
                >
                  Confirmar Cita
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREAR REGISTRO DE GASTO / EGRESO */}
      <AnimatePresence>
        {showAddExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-rose-600" /> Registrar Gasto del Local
                </h3>
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Categoría del Gasto:</label>
                <select
                  value={expenseCat}
                  onChange={(e) => setExpenseCat(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                >
                  <option value="Servicios Básicos">💡 Luz, Agua & Internet</option>
                  <option value="Alquiler Local">🏢 Alquiler de Local</option>
                  <option value="Proveedores & Insumos">📦 Proveedores & Mercadería</option>
                  <option value="Nómina & Sueldos">👥 Sueldos & Adelantos Personal</option>
                  <option value="Marketing & Varios">📣 Marketing & Mantenimiento</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Descripción del Pago:</label>
                <input
                  type="text"
                  placeholder="Ej: Pago recibo de Luz / Pago proveedor carnes..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Monto Pagado ({posData.business.currency}):</label>
                <input
                  type="number"
                  step="0.50"
                  placeholder="0.00"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setShowAddExpenseModal(false)}
                  className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateExpenseSubmit}
                  className="py-2.5 bg-rose-600 text-white font-black text-xs rounded-xl cursor-pointer"
                >
                  Guardar Gasto
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CREAR NUEVO CLIENTE */}
      <AnimatePresence>
        {showAddCustomerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900">Registrar Nuevo Cliente CRM</h3>
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="p-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  placeholder={rConfig.customerPlaceholder}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">WhatsApp / Teléfono:</label>
                <input
                  type="tel"
                  placeholder="Ej: 51987654321"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Fecha Cumpleaños (Opcional):</label>
                <input
                  type="date"
                  value={newCustBirthday}
                  onChange={(e) => setNewCustBirthday(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Notas / Preferencias (Opcional):</label>
                <input
                  type="text"
                  placeholder="Ej: Prefiere tinte 8.1 / Mesa ventana..."
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => setShowAddCustomerModal(false)}
                  className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateCustomerSubmit}
                  className="py-2.5 bg-amber-600 text-white font-black text-xs rounded-xl cursor-pointer"
                >
                  Guardar Cliente
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL QR LOCAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 font-black text-2xl flex items-center justify-center mb-3">
                QR
              </div>
              <h3 className="text-base font-black text-slate-900">QR de Auto-Registro en Local</h3>
              <div className="my-4 p-4 bg-slate-900 text-white rounded-2xl flex flex-col items-center gap-2 border-4 border-amber-400">
                <QrCode className="w-32 h-32 text-white" />
                <span className="text-[11px] font-mono font-bold tracking-wider">
                  koratflow.com/r/{posData.business.slug}
                </span>
              </div>
              <div className="w-full grid grid-cols-2 gap-2">
                <button onClick={() => setShowQrModal(false)} className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">
                  Cerrar
                </button>
                <a href={`/r/${posData.business.slug}`} target="_blank" rel="noopener noreferrer" className="py-2.5 bg-amber-600 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Probar</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL ONBOARDING RUBRO */}
      <AnimatePresence>
        {showOnboarding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Seleccionar Rubro</h3>
                <button onClick={() => setShowOnboarding(false)} className="p-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {KORAT_RUBROS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setActiveRubro(r.id);
                      setShowOnboarding(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      activeRubro === r.id ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-slate-200'
                    }`}
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <div>
                      <p className="text-xs font-black text-slate-900">{r.label}</p>
                      <p className="text-[10px] text-slate-500">{r.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL NUEVO ÍTEM DE CATÁLOGO CON TEXTOS DINÁMICOS POR RUBRO */}
      <AnimatePresence>
        {showAddItemModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-900">Nuevo Ítem para {KORAT_RUBROS.find(r => r.id === activeRubro)?.label}</h3>
                <button onClick={() => setShowAddItemModal(false)} className="p-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nombre del Ítem:</label>
                <input
                  type="text"
                  placeholder={rConfig.itemPlaceholder}
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Precio ({posData.business.currency}):</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Tipo de Ítem:</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  >
                    <option value="service">{rConfig.serviceTag}</option>
                    <option value="product">{rConfig.productTag}</option>
                  </select>
                </div>
              </div>

              {newItemType === 'product' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">Stock Inicial:</label>
                  <input
                    type="number"
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-2">
                <button onClick={() => setShowAddItemModal(false)} className="py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">
                  Cancelar
                </button>
                <button onClick={handleAddNewItem} className="py-2.5 bg-amber-600 text-white font-black text-xs rounded-xl cursor-pointer">
                  Guardar Ítem
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL UPSELL PRO */}
      <AnimatePresence>
        {showProUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-xl flex items-center justify-center">
                👑
              </div>
              <h3 className="text-base font-black text-slate-900">Activar Módulo Korat PRO</h3>
              <p className="text-xs text-slate-500">
                La función <span className="font-bold text-slate-900">"{proModalFeature}"</span> está disponible en los Planes PRO de automatización por WhatsApp.
              </p>
              <a
                href={`https://wa.me/${WHATSAPP_CONTACT}?text=${encodeURIComponent(
                  `Hola Martín! Quisiera información para activar el módulo PRO "${proModalFeature}".`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Consultar por WhatsApp</span>
              </a>
              <button onClick={() => setShowProUpgradeModal(false)} className="text-xs text-slate-400 font-bold hover:underline cursor-pointer">
                Volver a la App
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BARRA FLOTANTE DE CARRITO EXPRESS (ZONA DEL PULGAR) */}
      <AnimatePresence>
        {totalItemsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-16 left-0 right-0 z-40 max-w-md mx-auto px-4"
          >
            <button
              onClick={() => setShowCheckoutBottomSheet(true)}
              className="w-full p-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl shadow-emerald-500/30 flex items-center justify-between transition-all active:scale-98 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                  {totalItemsCount}
                </span>
                <span>Ver Resumen del Pedido</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold">S/ {finalSaleTotal.toFixed(2)}</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM SHEET DE CHECKOUT EXPRESS */}
      <PosCheckoutBottomSheet
        isOpen={showCheckoutBottomSheet}
        onClose={() => setShowCheckoutBottomSheet(false)}
        cart={cart}
        customNumpadItems={customNumpadItems}
        totalAmount={finalSaleTotal}
        selectedCustomer={selectedCustomer}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        cashGiven={cashGiven}
        setCashGiven={setCashGiven}
        onConfirmSale={(isPaid) => handleConfirmCheckout(isPaid ? 'paid' : 'pending')}
        onRemoveCartItem={(id) => handleDecrementItem(id)}
        onRemoveCustomItem={(id) => setCustomNumpadItems((prev) => prev.filter((x) => x.id !== id))}
      />

      {/* BOTTOM NAV BAR 2026 */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-[#06040f]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 px-2 py-1.5 flex items-center justify-around max-w-md mx-auto shadow-2xl transition-colors duration-200">
        {[
          { id: 'caja', label: 'Caja', icon: Zap },
          { id: 'catalogo', label: 'Catálogo', icon: ShoppingBag },
          { id: 'crm', label: 'Clientes', icon: Users },
          { id: 'metricas', label: 'Finanzas', icon: BarChart3 },
          { id: 'ajustes', label: 'Ajustes', icon: Settings },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex flex-col items-center py-1 px-3 rounded-2xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default KoratPosExpress;

