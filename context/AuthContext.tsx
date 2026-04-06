/**
 * ===========================================
 * Auth Context - Korat MVP
 * ===========================================
 * 
 * Maneja la autenticación, sesión de usuario y permisos (features).
 * Se conecta con el backend de n8n para login real.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  UserFeatures,
  StaffPermissions,
  DEFAULT_STARTER_FEATURES,
  DEFAULT_PRO_FEATURES,
  DEFAULT_COPILOT_FEATURES,
  DEFAULT_STAFF_PERMISSIONS
} from '../types';
import { auth as authApi } from '../services/api';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── SaaS Feature Flags Type (V2 compatible — supports both flat and nested) ───
export interface RecursosSaaS {
  plan_base: 'basico' | 'pro' | 'copilot' | 'automatico';
  // Legacy chatbot field
  chatbot?: {
    tipo?: 'mago_de_oz' | 'autonomo';
    activo?: boolean;
    nombre?: string;
    personalidad?: string;
  };
  // V2 bot field
  bot?: {
    modo?: string;
    nombre?: string;
    personalidad?: string;
  };
  // modulos: either flat (V1) or nested with {activo, sub_pestanas, widgets} (V2)
  modulos: Record<string, any>;
  limites?: {
    max_staff?: number;
    max_usuarios_adicionales?: number;
  };
  tipo_fidelizacion?: 'global' | 'staff';
  automatizaciones?: {
    permitir_rescate?: boolean;
    rescate_activo?: boolean;
    permitir_recordatorios?: boolean;
    recordatorios_activos?: boolean;
  };
}

// User-level module permissions (override per user, stored in Usuarios.permisos_modulos)
export type PermisosModulosUsuario = Record<string, boolean>;

const DEFAULT_RECURSOS: RecursosSaaS = {
  plan_base: 'basico',
  modulos: {},
  limites: { max_staff: 3 }
};

const normalizePlanBase = (plan: string | undefined | null): 'basico' | 'pro' | 'copilot' => {
  const p = (plan || '').toLowerCase();
  // New plan names (glow_pro = pro, glow_elite = copilot, glow = basico)
  if (['glow_pro', 'automatico', 'pro', 'korat'].includes(p)) return 'pro';
  if (['glow_elite', 'copilot', 'nilah_copilot', 'vip', 'premium'].includes(p)) return 'copilot';
  if (['glow', 'nilah', 'starter', 'basico'].includes(p)) return 'basico';
  return 'basico';
};

/**
 * Reads a module flag from recursos_saas supporting both V1 (flat boolean)
 * and V2 (nested { activo: boolean }) formats.
 */
const readModuleActive = (modulos: Record<string, any>, moduleName: string): boolean => {
  const mod = modulos?.[moduleName];
  if (mod === undefined || mod === null) return false;
  if (typeof mod === 'boolean') return mod;           // V1 flat
  if (typeof mod === 'object') return mod.activo ?? false; // V2 nested
  return false;
};

// ===========================================
// Types
// ===========================================

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success?: boolean;
  token?: string;
  user?: User;
  features?: UserFeatures;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  features: UserFeatures | null;
  recursosSaaS: RecursosSaaS;
  permisosModulos: PermisosModulosUsuario;
  tipoFidelizacion: 'global' | 'staff';
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isPro: boolean;
  isCopilot: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  loginMock: (email: string) => void;
  logout: () => void;
  clearError: () => void;
  hasFeature: (featureName: keyof UserFeatures) => boolean;
  hasStaffPermission: (permission: keyof StaffPermissions) => boolean;
  hasSaaSModule: (moduleName: string) => boolean;
}

// ===========================================
// Context
// ===========================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===========================================
// Storage Keys
// ===========================================

const STORAGE_KEYS = {
  USER: 'korat_user',
  TOKEN: 'korat_token',
  FEATURES: 'korat_features',
  RECURSOS: 'korat_recursos_saas',
} as const;

// ===========================================
// Helper Functions
// ===========================================

/**
 * Helper para deep merge seguro (Fusiona defaults con los datos parciales de DB)
 */
const deepMerge = (target: any, source: any): any => {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return target;

  const result = { ...target };
  Object.keys(source).forEach(key => {
    if (source[key] instanceof Object && key in target) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  });
  return result;
};

const safeParseJSON = (data: any, fallback: any) => {
  if (!data) return fallback;
  if (typeof data === 'object') {
    return deepMerge(fallback, data);
  }
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch (e) {
    return fallback;
  }
  if (!parsed || typeof parsed !== 'object') return fallback;
  return deepMerge(fallback, parsed);
};

/**
 * Obtiene las features por defecto según el plan
 */
const getDefaultFeaturesByPlan = (plan: User['plan']): UserFeatures => {
  switch (plan) {
    case 'Glow Elite':
    case 'Copilot':
      return DEFAULT_COPILOT_FEATURES;
    case 'Glow Pro':
    case 'Pro':
      return DEFAULT_PRO_FEATURES;
    case 'Glow':
    case 'Starter':
    default:
      return DEFAULT_STARTER_FEATURES;
  }
};

/**
 * Carga datos de sesión del localStorage
 */
const loadStoredSession = (): { user: User | null; features: UserFeatures | null; recursos: RecursosSaaS | null } => {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedFeatures = localStorage.getItem(STORAGE_KEYS.FEATURES);
    const storedRecursos = localStorage.getItem(STORAGE_KEYS.RECURSOS);

    const user = storedUser ? JSON.parse(storedUser) : null;
    let features = storedFeatures ? JSON.parse(storedFeatures) : null;
    let recursos: RecursosSaaS | null = storedRecursos ? JSON.parse(storedRecursos) : null;

    // Si hay usuario pero no features, generar features por defecto según plan
    if (user && !features) {
      features = getDefaultFeaturesByPlan(user.plan);
    }

    return { user, features, recursos };
  } catch (error) {
    console.error('Error loading stored session:', error);
    return { user: null, features: null, recursos: null };
  }
};

/**
 * Guarda datos de sesión en localStorage
 */
const saveSession = (user: User, features: UserFeatures, token?: string): void => {
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  localStorage.setItem(STORAGE_KEYS.FEATURES, JSON.stringify(features));
  if (token) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  }
  if (user.business_id) {
    localStorage.setItem('korat_business_id', user.business_id);
  }
};

/**
 * Limpia la sesión del localStorage y TODO el caché de datos
 * Esto es importante para evitar mostrar datos de un negocio anterior
 * cuando se cambia de cuenta o se cierra sesión
 */
const clearSession = (): void => {
  // 1. Limpiar datos de autenticación
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.FEATURES);
  localStorage.removeItem(STORAGE_KEYS.RECURSOS);

  // 2. Limpiar identificadores de negocio
  localStorage.removeItem('korat_business_id');

  // 3. Limpiar caché de datos del dashboard y módulos
  localStorage.removeItem('korat_dashboard_cache');
  localStorage.removeItem('korat_citas_cache');
  localStorage.removeItem('korat_clients_cache');
  localStorage.removeItem('korat_services_cache');
  localStorage.removeItem('korat_financial_cache');

  // 4. Limpiar cualquier otra clave de Korat que pueda existir
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('korat_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));

  console.log('🧹 Sesión y caché limpiados completamente');
};

// ===========================================
// Provider Component
// ===========================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [features, setFeatures] = useState<UserFeatures | null>(null);
  const [recursosSaaS, setRecursosSaaS] = useState<RecursosSaaS>(DEFAULT_RECURSOS);
  const [permisosModulos, setPermisosModulos] = useState<PermisosModulosUsuario>({});
  const [tipoFidelizacion, setTipoFidelizacion] = useState<'global' | 'staff'>('global');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Carga inicial: sesión + recursos (simultáneo) ─────────────────────────
  useEffect(() => {
    const { user: storedUser, features: storedFeatures, recursos: storedRecursos } = loadStoredSession();
    setUser(storedUser);
    setFeatures(storedFeatures);

    // Si hay recursos cacheados en localStorage, usarlos INMEDIATAMENTE (0-delay)
    if (storedRecursos && storedRecursos.modulos && Object.keys(storedRecursos.modulos).length > 0) {
      setRecursosSaaS(storedRecursos);
    }

    // Kick off async DB fetch right away (sin esperar al efecto de user)
    const businessId = localStorage.getItem('korat_business_id');
    if (businessId) {
      (async () => {
        try {
          const { data: recursosData, error: dbErr } = await supabase.rpc('get_recursos_saas', { b_id: businessId });
          if (!dbErr && recursosData) {
            const parsedRecursos = safeParseJSON(recursosData, DEFAULT_RECURSOS);
            setRecursosSaaS(parsedRecursos);
            localStorage.setItem(STORAGE_KEYS.RECURSOS, JSON.stringify(parsedRecursos));
            if (parsedRecursos?.tipo_fidelizacion) {
              setTipoFidelizacion(parsedRecursos.tipo_fidelizacion);
            }
            // Sincronizar plan del usuario con el plan real de la DB
            if (storedUser) {
              const normalizedPlan = normalizePlanBase(parsedRecursos.plan_base);
              const newPlan: User['plan'] = normalizedPlan === 'copilot' ? 'Glow Elite' : normalizedPlan === 'pro' ? 'Glow Pro' : 'Glow';
              if (storedUser.plan !== newPlan) {
                const updatedUser: User = { ...storedUser, plan: newPlan };
                const updatedFeatures = getDefaultFeaturesByPlan(newPlan);
                setUser(updatedUser);
                setFeatures(updatedFeatures);
                const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
                saveSession(updatedUser, updatedFeatures, token || undefined);
              }
            }
          }
        } catch (e) {
          console.warn('Could not load recursos_saas on init:', e);
        }
      })();
    }

    setIsLoading(false);
  }, []);

  // ─── Reload recursos cuando cambia el usuario (ej: login) ──────────────────
  useEffect(() => {
    if (!user) return;
    const loadRecursosSaaS = async () => {
      const businessId = localStorage.getItem('korat_business_id');
      if (!businessId) return;
      try {
        const { data: recursosData, error: dbErr } = await supabase
          .rpc('get_recursos_saas', { b_id: businessId });

        if (!dbErr && recursosData) {
          const parsedRecursos = safeParseJSON(recursosData, DEFAULT_RECURSOS);
          setRecursosSaaS(parsedRecursos);

          // Cachear en localStorage para carga inmediata la próxima vez
          localStorage.setItem(STORAGE_KEYS.RECURSOS, JSON.stringify(parsedRecursos));

          if (parsedRecursos?.tipo_fidelizacion) {
            setTipoFidelizacion(parsedRecursos.tipo_fidelizacion);
          }

          // Sincronizar plan del usuario
          if (user) {
            const normalizedPlan = normalizePlanBase(parsedRecursos.plan_base);
            const newPlan = normalizedPlan === 'copilot' ? 'Glow Elite' : normalizedPlan === 'pro' ? 'Glow Pro' : 'Glow';

            if (user.plan !== newPlan) {
              const updatedUser = { ...user, plan: newPlan };
              const updatedFeatures = getDefaultFeaturesByPlan(newPlan);
              setUser(updatedUser);
              setFeatures(updatedFeatures);
              const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
              saveSession(updatedUser, updatedFeatures, token || undefined);
            }
          }
        }
      } catch (e) {
        console.warn('Could not load recursos_saas:', e);
      }

      // Cargar permisos_modulos del usuario logueado (override por usuario)
      try {
        const userEmail = user?.email;
        if (userEmail) {
          const { data: usuarioData } = await supabase
            .from('Usuarios')
            .select('permisos_modulos')
            .eq('email', userEmail)
            .single();
          if (usuarioData?.permisos_modulos) {
            const parsed = typeof usuarioData.permisos_modulos === 'string'
              ? JSON.parse(usuarioData.permisos_modulos)
              : usuarioData.permisos_modulos;
            setPermisosModulos(parsed || {});
          }
        }
      } catch (e) {
        // permisos_modulos es opcional, no bloqueamos
      }
    };
    if (user) loadRecursosSaaS();
  }, [user]);

  /**
   * Login real con backend n8n
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response: LoginResponse = await authApi.login(credentials);

      console.log('🔐 Login response:', response);

      // Validación estricta: DEBE tener user para considerarse exitoso
      // El backend debe devolver { user: {...} } para login válido
      if (!response || !response.user) {
        // Si no hay user, es login fallido
        const errorMsg = response?.message || 'Credenciales inválidas. Por favor, verifica tu email y contraseña.';
        setError(errorMsg);
        setIsLoading(false);
        return false;
      }

      // Verificar si el backend explícitamente marcó como fallido
      if (response.success === false) {
        setError(response.message || 'Error al iniciar sesión');
        setIsLoading(false);
        return false;
      }

      // Login exitoso - tenemos user
      const userFeatures = response.features || getDefaultFeaturesByPlan(response.user.plan);

      // Guardar en state
      setUser(response.user);
      setFeatures(userFeatures);

      // Guardar en localStorage
      saveSession(response.user, userFeatures, response.token);

      setIsLoading(false);

      // Redirigir al dashboard
      window.location.hash = '#/nilah/app';

      return true;

    } catch (err) {
      console.error('🔐 Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión con el servidor';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, []);

  /**
   * Login mock para desarrollo/testing
   * Mantiene la funcionalidad anterior para poder probar sin backend
   */
  const loginMock = useCallback((email: string): void => {
    const isStaff = email.toLowerCase().includes('staff');
    const isProUser = email.toLowerCase().includes('pro');

    // Determinar plan basado en email
    let plan: User['plan'] = 'Starter';
    if (isProUser) plan = 'Pro';

    const newUser: User = {
      name: isStaff ? 'Staff Member' : 'Admin Owner',
      email: email,
      role: isStaff ? 'Staff' : 'Admin',
      plan: plan,
      business_id: 'default-korat-business-id', // Asegurar que exista un business_id mock
      avatar: isStaff
        ? 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?fit=crop&w=200&h=200'
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?fit=crop&w=200&h=200'
    };

    const userFeatures = getDefaultFeaturesByPlan(plan);

    // Guardar en state
    setUser(newUser);
    setFeatures(userFeatures);

    // Guardar en localStorage (sin token real para mock)
    saveSession(newUser, userFeatures, 'mock_token_' + Date.now());

    // Redirigir al dashboard
    window.location.hash = '#/nilah/app';
  }, []);

  /**
   * Logout - limpia sesión y redirige a login
   */
  const logout = useCallback((): void => {
    clearSession();
    setUser(null);
    setFeatures(null);
    setError(null);
    window.location.hash = '#/nilah/login';
  }, []);

  /**
   * Limpiar error
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  /**
   * Verificar si el usuario tiene una feature específica
   */
  const hasFeature = useCallback((featureName: keyof UserFeatures): boolean => {
    return features?.[featureName] ?? false;
  }, [features]);

  /**
   * Verificar si el Staff tiene un permiso específico
   * Para Admin siempre retorna true (tiene todos los permisos)
   */
  const hasStaffPermission = useCallback((permission: keyof StaffPermissions): boolean => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'dueño' || role === 'dueno') return true;
    const permissions = user?.staffPermissions || DEFAULT_STAFF_PERMISSIONS;
    return permissions[permission] ?? false;
  }, [user]);

  /**
   * Verificar si el tenant tiene un módulo SaaS activado.
   * Soporta tanto el formato plano V1 (boolean) como el anidado V2 ({ activo: boolean }).
   * También aplica overrides a nivel de usuario (permisosModulos).
   */
  const hasSaaSModule = useCallback((moduleName: string): boolean => {
    const modulos = recursosSaaS?.modulos || {};
    const modulosLoaded = Object.keys(modulos).length > 0;
    let negocioTieneModulo = false;

    // Módulos básicos por defecto si no están definidos
    const defaultBasic = ['dashboard', 'agenda', 'inbox', 'configuracion', 'crm', 'finanzas'];

    if (modulosLoaded && moduleName in modulos) {
      // Prioridad 1: Si la DB tiene una configuración para este módulo, se respeta estrictamente (SuperAdmin toggle)
      negocioTieneModulo = readModuleActive(modulos, moduleName);
    } else if (modulosLoaded) {
      // Prioridad 2: La DB cargó, pero el módulo no está definido. Aplicar básicos
      negocioTieneModulo = defaultBasic.includes(moduleName);
    } else {
      // Prioridad 3: DB cargando. Fallback basado en el plan del usuario local
      const planNorm = normalizePlanBase(user?.plan);
      if (planNorm === 'copilot') {
        negocioTieneModulo = true;
      } else if (planNorm === 'pro') {
        negocioTieneModulo = moduleName !== 'copilot';
      } else {
        negocioTieneModulo = defaultBasic.includes(moduleName) || moduleName === 'engagement';
      }
    }

    // Core modules always allowed for Admin/Owner
    const isOwnerOrAdmin = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    const isCoreModule = ['dashboard', 'agenda', 'inbox', 'configuracion', 'crm', 'finanzas', 'settings'].includes(moduleName);

    if (isOwnerOrAdmin && isCoreModule) return true;

    if (!negocioTieneModulo) return false;

    // Override a nivel de usuario (permisos_modulos del SuperAdmin)
    if (Object.keys(permisosModulos).length > 0) {
      if (moduleName in permisosModulos) {
        return permisosModulos[moduleName] === true;
      }
      return true;
    }

    return true;
  }, [recursosSaaS, permisosModulos, user]);

  // Computed values
  const isAuthenticated = !!user;
  const userRoleRaw = user?.role?.toLowerCase() || '';
  // Robusta normalización de roles: admin, dueño, owner, etc.
  const isAdmin = ['admin', 'dueño', 'dueno', 'owner', 'propietario'].includes(userRoleRaw);
  const isStaff = userRoleRaw === 'staff';
  const normalizedPlan = normalizePlanBase(recursosSaaS.plan_base);
  const isPro = normalizedPlan === 'pro' || normalizedPlan === 'copilot';
  const isCopilot = normalizedPlan === 'copilot';

  return (
    <AuthContext.Provider
      value={{
        user,
        features,
        recursosSaaS,
        permisosModulos,
        tipoFidelizacion,
        isAuthenticated,
        isAdmin,
        isStaff,
        isPro,
        isCopilot,
        isLoading,
        error,
        login,
        loginMock,
        logout,
        clearError,
        hasFeature,
        hasStaffPermission,
        hasSaaSModule,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ===========================================
// Hook
// ===========================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
