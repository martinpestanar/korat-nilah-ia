/**
 * ===========================================
 * Super Admin Dashboard — Korat Flow Agency
 * ===========================================
 * Panel maestro para gestionar tenants y sus Feature Flags.
 * Ruta: /#/god-mode/dashboard
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    ShieldAlert, Building2, Bot, ToggleLeft, ToggleRight, Save,
    Loader2, LogOut, Users, Megaphone, Star, BarChart3, Zap,
    Clock, ChevronDown, ChevronUp, Search, RefreshCw, CheckCircle2, Plus, X, Edit2, Trash2, AlertTriangle, AlertCircle, Power, MessageSquare
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import StaffModal from '../components/SuperAdmin/StaffModal';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cfggpqpbqqeavdbdzwoz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Types ───────────────────────────────────────────

interface RecursosSaaS {
    plan_base: 'basico' | 'automatico';
    chatbot: {
        tipo: 'mago_de_oz' | 'autonomo';
        activo: boolean;
        nombre?: string;
        personalidad?: string;
    };
    modulos: {
        marketing: boolean;
        fidelizacion: boolean;
        analiticas_avanzadas: boolean;
        zonas_muertas: boolean;
        engagement_recordatorios: boolean;
    };
    limites: {
        max_staff: number;
    };
    ui_config?: { // Added ui_config to RecursosSaaS type
        dashboard_widgets?: {
            ingresos_chart?: boolean;
            citas_canceladas?: boolean;
            top_servicios?: boolean;
        };
        action_buttons?: {
            rescate_whatsapp?: boolean;
            envio_masivo?: boolean;
        };
    };
}

interface Negocio {
    id: string;
    nombre: string;
    recursos_saas: RecursosSaaS;
    bot_config?: Record<string, any>;
    created_at?: string;
    owner?: {
        nombre_persona: string;
        email: string;
    } | null;
    Usuarios?: any[]; // Assuming Usuarios can be an array of any type for now
    briefCompleted?: boolean;
}

export interface PrecioSuscripcion {
    id: string;
    nombre: string;
    precio: number;
    categoria: string;
}

// ─── Default structure for new tenants ───

const DEFAULT_RECURSOS: RecursosSaaS = {
    plan_base: 'basico',
    chatbot: { tipo: 'mago_de_oz', activo: true, nombre: 'Nilah', personalidad: 'amable y profesional' },
    modulos: {
        marketing: false,
        fidelizacion: false,
        analiticas_avanzadas: false,
        zonas_muertas: false,
        engagement_recordatorios: false
    },
    limites: { max_staff: 3 },
    ui_config: {
        dashboard_widgets: { ingresos_chart: false, citas_canceladas: false, top_servicios: false },
        action_buttons: { rescate_whatsapp: false, envio_masivo: false }
    }
};

// ─── Module Config UI ───

const MODULE_LABELS: Record<string, { label: string; icon: React.ReactNode; desc: string }> = {
    marketing: { label: 'Marketing WhatsApp', icon: <Megaphone className="w-4 h-4" />, desc: 'Campañas masivas y segmentación' },
    fidelizacion: { label: 'Fidelización (Loyalty)', icon: <Star className="w-4 h-4" />, desc: 'Puntos, premios y programa de lealtad' },
    analiticas_avanzadas: { label: 'Analíticas Avanzadas', icon: <BarChart3 className="w-4 h-4" />, desc: 'Daily Briefing IA, métricas profundas' },
    zonas_muertas: { label: 'Zonas Muertas', icon: <Clock className="w-4 h-4" />, desc: 'Detección de huecos en agenda' },
    engagement_recordatorios: { label: 'Recordatorios & Engagement', icon: <Zap className="w-4 h-4" />, desc: 'Recordatorios automáticos de retoque' }
};

// ─── Component ───────────────────────────────────────

const SuperAdminDashboard: React.FC = () => {
    const [negocios, setNegocios] = useState<Negocio[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);
    const [savedId, setSavedId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [adminInfo, setAdminInfo] = useState<{ nombre: string; email: string } | null>(null);

    // Precios
    const [precios, setPrecios] = useState<PrecioSuscripcion[]>([]);
    const [loadingPrecios, setLoadingPrecios] = useState(true);

    // Create    // Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newSalonName, setNewSalonName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // Feedback & Confirm Modals
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning';
        onConfirm: () => void;
    } | null>(null);
    const [feedbackModal, setFeedbackModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    // Staff/User management
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<any>(null);

    // Verify super admin session
    useEffect(() => {
        const session = sessionStorage.getItem('korat_super_admin');
        if (!session) {
            window.location.hash = '#/god-mode';
            return;
        }
        try {
            setAdminInfo(JSON.parse(session));
        } catch {
            window.location.hash = '#/god-mode';
        }
    }, []);

    // Load precios directly from Supabase
    const loadPrecios = useCallback(async () => {
        setLoadingPrecios(true);
        try {
            const { data, error } = await supabase
                .from('precios_suscripcion')
                .select('*')
                .order('categoria', { ascending: true });

            if (error) throw error;
            setPrecios(data || []);
        } catch (err) {
            console.error('Error loading precios:', err);
        } finally {
            setLoadingPrecios(false);
        }
    }, []);

    // Load all negocios directly from Supabase (V2: Staff & Briefs)
    const loadNegocios = useCallback(async () => {
        setLoading(true);
        try {
            // Llamar al endpoint de n8n que el usuario configuró
            const isDev = import.meta.env.DEV;
            const baseUrl = isDev ? '/api/n8n' : import.meta.env.VITE_API_URL;
            const endpoint = `${baseUrl}/get-superadmin-data`;

            console.log("Fetching superadmin data from:", endpoint);

            const response = await fetch(endpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error en el endpoint n8n. Status: ${response.status}`);
            }

            const rawData = await response.json();

            // n8n a veces devuelve la repuesta en forma de un array con un solo objeto
            const data = Array.isArray(rawData) && rawData.length === 1 && rawData[0].id === undefined
                ? rawData[0]
                : rawData;

            // Compatibilidad si devuelve un arreglo directo o { negocios: [...] }
            const negociosList = Array.isArray(data) ? data : (data.negocios || []);

            const formattedData = negociosList.map((n: any) => {
                const nUsuarios = n.Usuarios || [];
                const nBriefs = n.business_briefs || [];

                const ownerUser = nUsuarios.find((u: any) => u.role === 'Admin' || u.role === 'Dueño');
                const hasBrief = nBriefs.length > 0;

                // Deep merge function to ensure all default nested keys exist
                const deepMerge = (target: any, source: any): any => {
                    if (typeof target !== 'object' || target === null) return source;
                    if (typeof source !== 'object' || source === null) return target;

                    const output = { ...target };
                    Object.keys(source).forEach(key => {
                        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                            output[key] = deepMerge(target[key] || {}, source[key]);
                        } else {
                            output[key] = source[key] !== undefined ? source[key] : target[key];
                        }
                    });
                    return output;
                };

                // Parse JSON fields safely in case n8n returns them as strings
                const safeParseJSON = (data: any, fallback: any) => {
                    let parsed = data;
                    if (typeof parsed === 'string') {
                        try { parsed = JSON.parse(parsed); } catch { parsed = null; }
                    }
                    if (!parsed || typeof parsed !== 'object') return fallback;
                    return deepMerge(fallback, parsed);
                };

                const recursosSaaS = safeParseJSON(n.recursos_saas, DEFAULT_RECURSOS);
                const botConfig = safeParseJSON(n.bot_config, {});

                return {
                    id: n.id,
                    nombre: n.nombre || 'Sin Nombre',
                    bot_config: botConfig,
                    created_at: n.created_at,
                    recursos_saas: recursosSaaS,
                    owner: ownerUser ? { nombre_persona: ownerUser.nombre_persona, email: ownerUser.email } : null,
                    Usuarios: nUsuarios,
                    briefCompleted: hasBrief
                };
            });

            setNegocios(formattedData);
        } catch (err) {
            console.error('Error loading negocios from n8n:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPrecios();
        loadNegocios();
    }, [loadNegocios, loadPrecios]);

    // Create a new negocio
    const handleCreateNuevoSalon = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSalonName.trim()) return;

        setIsCreating(true);
        try {
            const { data, error } = await supabase
                .from('negocios')
                .insert([
                    {
                        nombre: newSalonName.trim(),
                        recursos_saas: DEFAULT_RECURSOS,
                        plan: 'Starter'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Add the new item to state
            setNegocios(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));

            // Close modal and reset
            setIsCreateModalOpen(false);
            setNewSalonName('');
            setExpandedId(data.id); // Expand the newly created salon automatically
        } catch (err) {
            console.error('Error creating salon:', err);
            setFeedbackModal({ isOpen: true, title: 'Error', message: 'Error al crear el salón. Verifica los permisos de la base de datos.', type: 'error' });
        } finally {
            setIsCreating(false);
        }
    };

    const handleSaveStaff = async (staffData: any) => {
        try {
            if (staffData.id) {
                // Modo Edición: Actualizar registro en public.Usuarios (via RPC)
                const { error: dbError } = await supabase
                    .rpc('superadmin_update_user', {
                        p_user_id: staffData.id,
                        p_nombre_persona: staffData.nombre,
                        p_role: staffData.role,
                        p_features: staffData.permissions || {}
                    });

                if (dbError) {
                    console.error("DB Error Updating:", dbError);
                    throw new Error("Fallo al actualizar el usuario.");
                }

                setFeedbackModal({ isOpen: true, title: '¡Actualizado!', message: `Usuario ${staffData.nombre} actualizado exitosamente.`, type: 'success' });
            } else {
                // Modo Creación: Crear en Auth y luego en public.Usuarios
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: staffData.email,
                    password: staffData.password,
                });

                if (authError) {
                    console.error("Auth Error:", authError);
                    throw new Error("No se pudo crear la cuenta de usuario. Quizás el email ya esté en uso.");
                }

                const userId = authData.user?.id;
                if (!userId) throw new Error("No se pudo obtener el ID del usuario creado.");

                const { error: dbError } = await supabase
                    .from('Usuarios')
                    .insert([
                        {
                            user_id: userId,
                            email: staffData.email,
                            nombre_persona: staffData.nombre,
                            role: staffData.role,
                            business_id: staffData.business_id,
                            features: staffData.permissions || null
                        }
                    ]);

                if (dbError) {
                    console.error("DB Error Inserting:", dbError);
                    throw new Error("Usuario creado en Auth, pero falló al asignarlo al salón.");
                }

                setFeedbackModal({ isOpen: true, title: '¡Creado!', message: `Usuario ${staffData.nombre} creado exitosamente.`, type: 'success' });
            }

            // Success common
            setIsStaffModalOpen(false);
            setEditingUser(null);
            loadNegocios(); // Refresh the list to see changes

        } catch (err: any) {
            console.error('Error saving staff:', err);
            setFeedbackModal({ isOpen: true, title: 'Error', message: err.message || 'Error al guardar el usuario.', type: 'error' });
        }
    };

    const handleDeleteUser = async (user: any) => {
        setConfirmModal({
            isOpen: true,
            title: 'Eliminar Usuario',
            message: `¿Estás seguro de que deseas eliminar permanentemente el usuario ${user.nombre_persona} (${user.email})? Esta acción no se puede deshacer.`,
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(null);
                try {
                    // Se utiliza una función RPC bypass RLS para eliminar el usuario
                    const { error } = await supabase
                        .rpc('superadmin_delete_user', { p_user_id: user.id || user.user_id });

                    if (error) {
                        console.error("RPC Delete Error:", error);
                        throw new Error("No se pudo eliminar el usuario de la base de datos.");
                    }

                    setFeedbackModal({ isOpen: true, title: 'Usuario Eliminado', message: 'Usuario eliminado correctamente. (Recuerda que la cuenta en Auth puede persistir si no tienes políticas establecidas).', type: 'success' });
                    loadNegocios();

                } catch (err) {
                    console.error('Error deleting user:', err);
                    setFeedbackModal({ isOpen: true, title: 'Error', message: 'Error al intentar eliminar el usuario.', type: 'error' });
                }
            }
        });
    };

    // Update a negocio's recursos_saas
    const handleSave = async (negocioId: string, recursos: RecursosSaaS) => {
        setSavingId(negocioId);
        try {
            const { error } = await supabase
                .from('negocios')
                .update({ recursos_saas: recursos })
                .eq('id', negocioId);

            if (error) throw error;

            setSavedId(negocioId);
            setTimeout(() => setSavedId(null), 2000);
        } catch (err) {
            console.error('Error updating:', err);
            setFeedbackModal({ isOpen: true, title: 'Error', message: 'Error al guardar cambios de recursos.', type: 'error' });
        } finally {
            setSavingId(null);
        }
    };

    // Helper: Mute standard mapping and auto-save instantly
    const updateRecursosAutoSave = async (negocioId: string, updater: (r: RecursosSaaS) => RecursosSaaS) => {
        const currentNegocio = negocios.find(x => x.id === negocioId);
        if (!currentNegocio) return;

        const newRecursos = updater(currentNegocio.recursos_saas);

        // Optimistic UI Update
        setNegocios(prev => prev.map(item => item.id === negocioId ? { ...item, recursos_saas: newRecursos } : item));

        // Database Save
        setSavingId(negocioId);
        try {
            const { error } = await supabase.rpc('superadmin_update_negocio_recursos', {
                p_negocio_id: negocioId,
                p_recursos: newRecursos
            });

            if (error) throw error;
            setSavedId(negocioId);
            setTimeout(() => setSavedId(null), 2000);
        } catch (err) {
            console.error('Error auto-updating:', err);
            setFeedbackModal({ isOpen: true, title: 'Error', message: 'Error al auto-guardar cambios.', type: 'error' });
        } finally {
            setSavingId(null);
        }
    };

    // Update a price in Supabase
    const handleUpdatePrecio = async (id: string, newPrecio: number) => {
        setSavingId(`price_${id}`);
        try {
            const { error } = await supabase.rpc('superadmin_update_precio', {
                p_id: id,
                p_precio: newPrecio
            });

            if (error) throw error;

            // Optimistic update
            setPrecios(prev => prev.map(p => p.id === id ? { ...p, precio: newPrecio } : p));
            setSavedId(`price_${id}`);
            setTimeout(() => setSavedId(null), 2000);
        } catch (err) {
            console.error('Error updating precio:', err);
            setFeedbackModal({ isOpen: true, title: 'Error', message: 'Error al actualizar el precio.', type: 'error' });
        } finally {
            setSavingId(null);
        }
    };

    // Preset: Apply Plan Básico
    const applyPlanBasico = (negocioId: string) => {
        updateRecursosAutoSave(negocioId, (r) => ({
            ...r,
            plan_base: 'basico',
            modulos: {
                marketing: false,
                fidelizacion: false,
                analiticas_avanzadas: false,
                zonas_muertas: false,
                engagement_recordatorios: false
            },
            ui_config: {
                dashboard_widgets: { ingresos_chart: false, citas_canceladas: false, top_servicios: false },
                action_buttons: { rescate_whatsapp: false, envio_masivo: false }
            }
        }));
    };

    // Preset: Apply Plan Pro
    const applyPlanPro = (negocioId: string) => {
        updateRecursosAutoSave(negocioId, (r) => ({
            ...r,
            plan_base: 'automatico',
            modulos: {
                marketing: true,
                fidelizacion: true,
                analiticas_avanzadas: true,
                zonas_muertas: true,
                engagement_recordatorios: true
            },
            ui_config: {
                dashboard_widgets: { ingresos_chart: true, citas_canceladas: true, top_servicios: true },
                action_buttons: { rescate_whatsapp: true, envio_masivo: true }
            }
        }));
    };

    // Toggle a module
    const toggleModule = (negocioId: string, moduleName: string) => {
        updateRecursosAutoSave(negocioId, (r) => ({
            ...r,
            modulos: {
                ...r.modulos,
                [moduleName]: !r.modulos[moduleName as keyof typeof r.modulos]
            }
        }));
    };

    // Toggle UI Config (Widgets & Buttons)
    const toggleUIConfig = (negocioId: string, category: 'dashboard_widgets' | 'action_buttons', key: string) => {
        updateRecursosAutoSave(negocioId, (r) => {
            const currentUiConfig = r.ui_config || {
                dashboard_widgets: { ingresos_chart: false, citas_canceladas: false, top_servicios: false },
                action_buttons: { rescate_whatsapp: false, envio_masivo: false }
            };

            return {
                ...r,
                ui_config: {
                    ...currentUiConfig,
                    [category]: {
                        ...currentUiConfig[category],
                        [key]: !currentUiConfig[category][key as keyof typeof currentUiConfig[typeof category]]
                    }
                }
            };
        });
    };

    // Bot Tier Setting
    const setBotTier = (negocioId: string, tier: 'off' | 'info' | 'auto') => {
        updateRecursosAutoSave(negocioId, (r) => {
            let activo = false;
            let tipo = 'mago_de_oz';
            let plan_base = r.plan_base;

            if (tier === 'info') {
                activo = true;
                tipo = 'mago_de_oz';
                plan_base = 'basico';
            } else if (tier === 'auto') {
                activo = true;
                tipo = 'autonomo';
                plan_base = 'automatico';
            }

            return {
                ...r,
                plan_base: plan_base as 'basico' | 'automatico',
                chatbot: { ...r.chatbot, activo, tipo: tipo as 'mago_de_oz' | 'autonomo' }
            };
        });
    };

    // Update max staff
    const updateMaxStaff = (negocioId: string, value: number) => {
        updateRecursosAutoSave(negocioId, (r) => ({
            ...r,
            limites: { ...r.limites, max_staff: Math.max(1, value) }
        }));
    };

    const handleLogout = () => {
        sessionStorage.removeItem('korat_super_admin');
        window.location.hash = '#/god-mode';
    };

    const getPrecio = (id: string, defValue: number) => {
        const p = precios.find(pr => pr.id === id);
        return p ? Number(p.precio) : defValue;
    };

    const calculateMRR = (recursos: RecursosSaaS) => {
        let total = 0;
        if (!recursos) return total;

        total += recursos.plan_base === 'automatico'
            ? getPrecio('plan_base_automatico', 79)
            : getPrecio('plan_base_manual', 29);

        // Add WebApp prices depending on the plan tier (Pro vs Básico)
        total += recursos.plan_base === 'automatico'
            ? getPrecio('webapp_pro', 0)
            : getPrecio('webapp_basico', 0);

        if (recursos.chatbot?.activo) {
            total += getPrecio('chatbot_mago_oz', 20); // El ID funciona para ambos, en base de datos dice Chatbot (Mago de Oz / Autónomo)
        }

        if (recursos.modulos?.marketing) total += getPrecio('modulo_marketing', 15);
        if (recursos.modulos?.fidelizacion) total += getPrecio('modulo_fidelizacion', 15);
        if (recursos.modulos?.analiticas_avanzadas) total += getPrecio('modulo_analiticas', 15);
        if (recursos.modulos?.zonas_muertas) total += getPrecio('modulo_zonas_muertas', 15);
        if (recursos.modulos?.engagement_recordatorios) total += getPrecio('modulo_engagement', 15);

        return total;
    };

    const filtered = negocios.filter(n =>
        n.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalMRR = negocios.reduce((acc, n) => acc + calculateMRR(n.recursos_saas), 0);
    const arpu = negocios.length > 0 ? totalMRR / negocios.length : 0;

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* ═══ TOP BAR ═══ */}
            <header className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
                            <ShieldAlert className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold leading-tight">Korat Flow Admin</h1>
                            <p className="text-[11px] text-zinc-500">{adminInfo?.email || 'Super Admin'}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Salir
                    </button>
                </div>
            </header>

            {/* ═══ CONTENT ═══ */}
            <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Search, Refresh & Create */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar salón..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                            onClick={loadNegocios}
                            className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Recargar"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white font-medium hover:bg-violet-500 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Nuevo Salón
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4 text-center">
                        <p className="text-2xl font-bold text-violet-400">S/ {totalMRR.toFixed(2)}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Total MRR (PEN)</p>
                    </div>
                    <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4 text-center">
                        <p className="text-2xl font-bold">S/ {arpu.toFixed(2)}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">ARPU Promedio (PEN)</p>
                    </div>
                    <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4 text-center">
                        <p className="text-2xl font-bold">{negocios.length}</p>
                        <p className="text-[11px] text-zinc-500 mt-1">Salones Activos</p>
                    </div>
                    <div className="rounded-xl bg-zinc-900/80 border border-white/5 p-4 text-center">
                        <p className="text-2xl font-bold text-emerald-400">
                            {negocios.filter(n => n.recursos_saas.chatbot.activo).length}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-1">Bots Autónomos</p>
                    </div>
                </div>

                {/* Gestión de Precios - Acordeón o Sección */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="text-xl">💰</span>
                                Gestión de Precios (PEN)
                            </h2>
                            <p className="text-xs text-zinc-500 mt-1">Configura el costo en la moneda local (PEN). El MRR total lo convierte conceptualmente, pero los montos base operan aquí en tu moneda local.</p>
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-950/30">
                        {loadingPrecios ? (
                            <div className="flex items-center justify-center p-8 text-zinc-500">
                                <Loader2 className="w-6 h-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {Array.from(new Set(precios.map(p => p.categoria))).map(cat => (
                                    <div key={cat} className="space-y-3">
                                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-violet-400 border-b border-white/5 pb-2">{cat}</h3>
                                        <div className="space-y-3">
                                            {precios.filter(p => p.categoria === cat).map(p => (
                                                <div key={p.id} className="bg-zinc-800/30 rounded-lg p-3 border border-white/5 relative group">
                                                    <label className="block text-[11px] font-medium text-zinc-400 mb-1.5 line-clamp-1" title={p.nombre}>{p.nombre}</label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">S/</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={p.precio}
                                                            onChange={(e) => {
                                                                const val = parseFloat(e.target.value) || 0;
                                                                setPrecios(prev => prev.map(x => x.id === p.id ? { ...x, precio: val } : x));
                                                            }}
                                                            onBlur={(e) => handleUpdatePrecio(p.id, parseFloat(e.target.value) || 0)}
                                                            className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 transition-colors"
                                                        />
                                                    </div>
                                                    {/* Status indicator */}
                                                    <div className="absolute top-2 right-2">
                                                        {savingId === `price_${p.id}` && <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />}
                                                        {savedId === `price_${p.id}` && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                    </div>
                )}

                {/* Tenant Cards */}
                {!loading && filtered.map((negocio, index) => {
                    const isExpanded = expandedId === negocio.id;
                    const r = negocio.recursos_saas;
                    const isSaving = savingId === negocio.id;
                    const isSaved = savedId === negocio.id;

                    return (
                        <div
                            key={`${negocio.id}-${index}`}
                            className="rounded-2xl bg-zinc-900/80 border border-white/5 overflow-hidden transition-all"
                        >
                            {/* ── Header ── */}
                            <div className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center border border-violet-500/20">
                                        <Building2 className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div className="text-left w-full overflow-hidden">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-sm truncate">{negocio.nombre}</h3>
                                            <span className="shrink-0 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                                                S/ {calculateMRR(r)}/mes
                                            </span>
                                            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${negocio.briefCompleted !== false
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                }`}>
                                                {negocio.briefCompleted !== false ? '🟢 Brief OK' : '🟡 Brief Pendiente'}
                                            </span>
                                        </div>
                                        {negocio.owner ? (
                                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                                                <span className="text-zinc-300 font-medium">{negocio.owner.nombre_persona}</span> ({negocio.owner.email})
                                            </p>
                                        ) : (
                                            <p className="text-xs text-zinc-500 italic mt-0.5">Sin dueño asignado (Admin)</p>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons Header */}
                                <div className="flex items-center gap-3 shrink-0">
                                    <div className="hidden sm:flex items-center gap-2">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${r.plan_base === 'automatico'
                                            ? 'bg-violet-500/20 text-violet-400'
                                            : 'bg-zinc-700/50 text-zinc-400'
                                            }`}>
                                            {r.plan_base === 'automatico' ? '👑 Pro' : '📦 Básico'}
                                        </span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${r.chatbot.activo
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-red-500/20 text-red-400'
                                            }`}>
                                            {r.chatbot.activo ? '🤖 Bot ON' : '🔴 Bot OFF'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedId(isExpanded ? null : negocio.id);
                                        }}
                                        className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                                    >
                                        {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                                    </button>
                                </div>
                            </div>

                            {/* ── Expanded Config ── */}
                            {isExpanded && (
                                <div className="px-5 pb-5 pt-1 border-t border-white/5 space-y-5 animate-slide-up">

                                    {/* AI Agent Tiers Configuration */}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">🤖 Nivel de Inteligencia Artificial (Plan del Bot)</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            {/* Tier 0: Off */}
                                            <button
                                                onClick={() => setBotTier(negocio.id, 'off')}
                                                className={`p-4 rounded-xl border text-left transition-all ${!r.chatbot.activo ? 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/50' : 'bg-zinc-800/50 border-white/5 hover:border-white/10 hover:bg-zinc-800'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`p-2 rounded-lg ${!r.chatbot.activo ? 'bg-red-500/20' : 'bg-white/5'}`}>
                                                        <Power className={`w-5 h-5 ${!r.chatbot.activo ? 'text-red-400' : 'text-zinc-500'}`} />
                                                    </div>
                                                    {!r.chatbot.activo && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                                                </div>
                                                <p className={`font-bold text-sm mt-3 ${!r.chatbot.activo ? 'text-red-400' : 'text-zinc-400'}`}>Desactivado</p>
                                                <p className="text-[11px] text-zinc-500 mt-1 leading-tight">El agente de IA no responderá ningún mensaje de los clientes.</p>
                                            </button>

                                            {/* Tier 1: Info */}
                                            <button
                                                onClick={() => setBotTier(negocio.id, 'info')}
                                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${r.chatbot.activo && r.chatbot.tipo === 'mago_de_oz' ? 'bg-amber-500/10 border-amber-500/30 ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'bg-zinc-800/50 border-white/5 hover:border-white/10 hover:bg-zinc-800'}`}
                                            >
                                                {r.chatbot.activo && r.chatbot.tipo === 'mago_de_oz' && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>}
                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <div className={`p-2 rounded-lg ${r.chatbot.activo && r.chatbot.tipo === 'mago_de_oz' ? 'bg-amber-500/20' : 'bg-white/5'}`}>
                                                        <MessageSquare className={`w-5 h-5 ${r.chatbot.activo && r.chatbot.tipo === 'mago_de_oz' ? 'text-amber-400' : 'text-zinc-500'}`} />
                                                    </div>
                                                    {r.chatbot.activo && r.chatbot.tipo === 'mago_de_oz' && <CheckCircle2 className="w-5 h-5 text-amber-500" />}
                                                </div>
                                                <p className={`font-bold text-sm mt-3 relative z-10 ${r.chatbot.activo && r.chatbot.tipo === 'mago_de_oz' ? 'text-amber-400' : 'text-zinc-400'}`}>Nivel 1: Asistente Info</p>
                                                <p className="text-[11px] text-zinc-500 mt-1 leading-tight relative z-10">Responde FAQs y recolecta datos básicos. Deriva agendas a un humano.</p>
                                            </button>

                                            {/* Tier 2: Auto */}
                                            <button
                                                onClick={() => setBotTier(negocio.id, 'auto')}
                                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${r.chatbot.activo && r.chatbot.tipo === 'autonomo' ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'bg-zinc-800/50 border-white/5 hover:border-white/10 hover:bg-zinc-800'}`}
                                            >
                                                {r.chatbot.activo && r.chatbot.tipo === 'autonomo' && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>}
                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <div className={`p-2 rounded-lg ${r.chatbot.activo && r.chatbot.tipo === 'autonomo' ? 'bg-gradient-to-br from-violet-500/20 to-pink-500/20' : 'bg-white/5'}`}>
                                                        <Bot className={`w-5 h-5 ${r.chatbot.activo && r.chatbot.tipo === 'autonomo' ? 'text-violet-400' : 'text-zinc-500'}`} />
                                                    </div>
                                                    {r.chatbot.activo && r.chatbot.tipo === 'autonomo' && <CheckCircle2 className="w-5 h-5 text-violet-500" />}
                                                </div>
                                                <p className={`font-bold text-sm mt-3 relative z-10 ${r.chatbot.activo && r.chatbot.tipo === 'autonomo' ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400' : 'text-zinc-400'}`}>Nivel 2: Autónomo 100%</p>
                                                <p className="text-[11px] text-zinc-500 mt-1 leading-tight relative z-10">Inteligencia total. Agenda, reprograma y vende sin intervención humana.</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* WebApp Plan Designation */}
                                    <div className="mt-6 pt-6 border-t border-white/5">
                                        <div className="flex items-center justify-between mb-3">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">🏢 Plan de Software (Dashboard WebApp)</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                                            {/* WebApp Basic */}
                                            <button
                                                onClick={() => applyPlanBasico(negocio.id)}
                                                className={`p-4 rounded-xl border text-left transition-all ${r.plan_base === 'basico' ? 'bg-zinc-800/80 border-white/20 ring-1 ring-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)]' : 'bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-800'}`}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className={`p-2 rounded-lg ${r.plan_base === 'basico' ? 'bg-white/10' : 'bg-white/5'}`}>
                                                        <Building2 className={`w-5 h-5 ${r.plan_base === 'basico' ? 'text-white' : 'text-zinc-500'}`} />
                                                    </div>
                                                    {r.plan_base === 'basico' && <CheckCircle2 className="w-5 h-5 text-zinc-300" />}
                                                </div>
                                                <p className={`font-bold text-sm mt-3 ${r.plan_base === 'basico' ? 'text-white' : 'text-zinc-400'}`}>Dashboard Básico</p>
                                                <p className="text-[11px] text-zinc-500 mt-1 leading-tight">Acceso a la agenda y gestión de staff. Sin addons avanzados.</p>
                                            </button>

                                            {/* WebApp Pro */}
                                            <button
                                                onClick={() => applyPlanPro(negocio.id)}
                                                className={`p-4 rounded-xl border text-left transition-all relative overflow-hidden ${r.plan_base === 'automatico' ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-800'}`}
                                            >
                                                {r.plan_base === 'automatico' && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>}
                                                <div className="flex justify-between items-start mb-2 relative z-10">
                                                    <div className={`p-2 rounded-lg ${r.plan_base === 'automatico' ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20' : 'bg-white/5'}`}>
                                                        <BarChart3 className={`w-5 h-5 ${r.plan_base === 'automatico' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                                                    </div>
                                                    {r.plan_base === 'automatico' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                                </div>
                                                <p className={`font-bold text-sm mt-3 relative z-10 ${r.plan_base === 'automatico' ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400' : 'text-zinc-400'}`}>Dashboard Pro</p>
                                                <p className="text-[11px] text-zinc-500 mt-1 leading-tight relative z-10">Activa todas las funciones, CRM de rescate, métricas y fidelización.</p>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Módulos y UI Config en Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">📦 Add-ons: WebApp Modules</p>
                                            <div className="space-y-2">
                                                {Object.entries(MODULE_LABELS).map(([key, config]) => {
                                                    const isOn = r.modulos[key as keyof typeof r.modulos];
                                                    return (
                                                        <div key={key} className="flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-800/50 border border-white/5">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className={isOn ? 'text-violet-400' : 'text-zinc-600'}>{config.icon}</span>
                                                                <div>
                                                                    <p className="text-sm font-medium">{config.label}</p>
                                                                    <p className="text-[10px] text-zinc-500">{config.desc}</p>
                                                                </div>
                                                            </div>
                                                            <button onClick={() => toggleModule(negocio.id, key)} className="transition-colors">
                                                                {isOn
                                                                    ? <ToggleRight className="w-9 h-9 text-violet-500" />
                                                                    : <ToggleLeft className="w-9 h-9 text-zinc-600" />
                                                                }
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* UI Config (Pro) */}
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">🎨 Configuración de Interfaz (Pro)</p>

                                            <div className="space-y-4">
                                                {/* Dashboard Widgets */}
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-400 mb-2">Dashboard Widgets</p>
                                                    <div className="space-y-2">
                                                        {['ingresos_chart', 'citas_canceladas', 'top_servicios'].map((key) => {
                                                            const uiConfig = r.ui_config || { dashboard_widgets: {} };
                                                            const isOn = uiConfig.dashboard_widgets?.[key as keyof typeof uiConfig.dashboard_widgets] || false;
                                                            return (
                                                                <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-800/30 border border-white/5">
                                                                    <p className="text-xs font-medium capitalize">{key.replace('_', ' ')}</p>
                                                                    <button onClick={() => toggleUIConfig(negocio.id, 'dashboard_widgets', key)} className="transition-colors">
                                                                        {isOn ? <ToggleRight className="w-7 h-7 text-pink-500" /> : <ToggleLeft className="w-7 h-7 text-zinc-600" />}
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-400 mb-2">Botones de Acción (CRM)</p>
                                                    <div className="space-y-2">
                                                        {['rescate_whatsapp', 'envio_masivo'].map((key) => {
                                                            const uiConfig = r.ui_config || { action_buttons: {} };
                                                            const isOn = uiConfig.action_buttons?.[key as keyof typeof uiConfig.action_buttons] || false;
                                                            return (
                                                                <div key={key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-zinc-800/30 border border-white/5">
                                                                    <p className="text-xs font-medium capitalize">{key.replace('_', ' ')}</p>
                                                                    <button onClick={() => toggleUIConfig(negocio.id, 'action_buttons', key)} className="transition-colors">
                                                                        {isOn ? <ToggleRight className="w-7 h-7 text-pink-500" /> : <ToggleLeft className="w-7 h-7 text-zinc-600" />}
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Limits */}
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">⚙️ Límites</p>
                                        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-zinc-800/50 border border-white/5">
                                            <div className="flex items-center gap-2.5">
                                                <Users className="w-4 h-4 text-zinc-400" />
                                                <p className="text-sm">Max Staff</p>
                                            </div>
                                            <input
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={r.limites.max_staff}
                                                onChange={(e) => updateMaxStaff(negocio.id, parseInt(e.target.value) || 1)}
                                                className="w-16 text-center rounded-lg bg-zinc-900 border border-white/10 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                                            />
                                        </div>
                                    </div>

                                    {/* User Management */}
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">👥 Cuentas de Acceso (Usuarios)</p>
                                        <div className="bg-zinc-800/50 border border-white/5 rounded-xl overflow-hidden">
                                            {negocio.Usuarios && negocio.Usuarios.length > 0 ? (
                                                <div className="divide-y divide-white/5">
                                                    {negocio.Usuarios.map((u: any, idx: number) => (
                                                        <div key={idx} className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors group">
                                                            <div>
                                                                <p className="text-sm font-medium text-white flex items-center gap-2">
                                                                    {u.nombre_persona}
                                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${u.role === 'Admin' || u.role === 'Dueño'
                                                                        ? 'bg-violet-500/20 text-violet-400 border border-violet-500/20'
                                                                        : 'bg-zinc-700/50 text-zinc-400 border border-white/10'
                                                                        }`}>
                                                                        {u.role === 'Admin' || u.role === 'Dueño' ? '👑 Dueño' : '👤 Staff'}
                                                                    </span>
                                                                </p>
                                                                <p className="text-[11px] text-zinc-400 mt-0.5">{u.email}</p>
                                                            </div>
                                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedBusinessId(negocio.id);
                                                                        setEditingUser(u);
                                                                        setIsStaffModalOpen(true);
                                                                    }}
                                                                    className="p-1.5 text-zinc-400 hover:text-violet-400 bg-white/5 hover:bg-violet-500/10 rounded-lg transition-colors"
                                                                    title="Editar Usuario"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(u)}
                                                                    className="p-1.5 text-zinc-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                    title="Eliminar Usuario"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-4 text-center text-sm text-zinc-500 italic">
                                                    No hay usuarios asignados.
                                                </div>
                                            )}
                                            <button
                                                onClick={() => {
                                                    setSelectedBusinessId(negocio.id);
                                                    setEditingUser(null);
                                                    setIsStaffModalOpen(true);
                                                }}
                                                className="w-full py-2.5 text-xs font-medium text-violet-400 hover:text-white hover:bg-violet-500/20 transition-colors border-t border-white/5"
                                            >
                                                + Agregar Usuario
                                            </button>
                                        </div>
                                    </div>

                                    {/* Auto-saved implicitly */}
                                    <div className="flex justify-end pt-2">
                                        {isSaving ? (
                                            <span className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                                                <Loader2 className="w-3 h-3 animate-spin" /> Guardando...
                                            </span>
                                        ) : isSaved ? (
                                            <span className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                                                <CheckCircle2 className="w-3 h-3" /> Guardado
                                            </span>
                                        ) : (
                                            <span className="text-xs text-zinc-600 italic">
                                                Autoguardado activado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {!loading && filtered.length === 0 && (
                    <div className="text-center py-12 text-zinc-500">
                        <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No se encontraron salones</p>
                    </div>
                )}
            </main>

            {/* Create Modal Overlay */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950/50">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-violet-400" />
                                Crear Nuevo Salón
                            </h3>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateNuevoSalon} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5 ml-1">Nombre del Salón</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="Ej: Beauty Studio..."
                                    value={newSalonName}
                                    onChange={(e) => setNewSalonName(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || !newSalonName.trim()}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Salón'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Staff/User Edit Modal */}
            {selectedBusinessId && (
                <StaffModal
                    isOpen={isStaffModalOpen}
                    onClose={() => {
                        setIsStaffModalOpen(false);
                        setEditingUser(null);
                    }}
                    businessId={selectedBusinessId}
                    onSave={handleSaveStaff}
                    userToEdit={editingUser}
                />
            )}

            {/* Premium Confirm Modal */}
            {confirmModal?.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl">
                    <div className="w-full max-w-sm bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-scale-in">
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-zinc-950/50">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                {confirmModal.type === 'danger' ? (
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-amber-500" />
                                )}
                                {confirmModal.title}
                            </h3>
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-zinc-300 mb-6">{confirmModal.message}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm font-medium hover:bg-white/5 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmModal.onConfirm}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all tap-feedback ${confirmModal.type === 'danger'
                                        ? 'bg-red-600 hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]'
                                        : 'bg-amber-600 hover:bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                        }`}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Alert/Feedback Modal */}
            {feedbackModal?.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm shadow-2xl">
                    <div className="w-full max-w-sm bg-zinc-900 rounded-3xl border border-white/10 overflow-hidden shadow-2xl animate-scale-in text-center p-8">
                        {feedbackModal.type === 'success' ? (
                            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                            </div>
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                                <X className="w-8 h-8 text-red-400" />
                            </div>
                        )}
                        <h3 className="text-xl font-bold text-white mb-2">{feedbackModal.title}</h3>
                        <p className="text-sm text-zinc-400 leading-relaxed mb-6">{feedbackModal.message}</p>
                        <button
                            onClick={() => setFeedbackModal(null)}
                            className={`w-full py-3 rounded-xl font-medium text-white tap-feedback transition-all ${feedbackModal.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-zinc-800 hover:bg-zinc-700'
                                }`}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
