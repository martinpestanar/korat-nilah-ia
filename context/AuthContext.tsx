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

// ─── SaaS Feature Flags Type ───
export interface RecursosSaaS {
  plan_base: 'basico' | 'pro' | 'copilot' | 'automatico';
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
    copilot: boolean;
    imagenes_promocionales: boolean;
    contenido_redes: boolean;
    estrategia_ads: boolean;
    studio_humano: boolean;
  };
  limites: {
    max_staff: number;
  };
  tipo_fidelizacion?: 'global' | 'staff';
}

const DEFAULT_RECURSOS: RecursosSaaS = {
  plan_base: 'basico',
  chatbot: { tipo: 'mago_de_oz', activo: true },
  modulos: {
    marketing: false,
    fidelizacion: false,
    analiticas_avanzadas: false,
    zonas_muertas: false,
    engagement_recordatorios: false,
    copilot: false,
    imagenes_promocionales: false,
    contenido_redes: false,
    estrategia_ads: false,
    studio_humano: false
  },
  limites: { max_staff: 3 }
};

const normalizePlanBase = (plan: RecursosSaaS['plan_base']): 'basico' | 'pro' | 'copilot' => {
  if (plan === 'automatico') return 'pro';
  if (plan === 'pro') return 'pro';
  if (plan === 'copilot') return 'copilot';
  return 'basico';
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
  hasSaaSModule: (moduleName: keyof RecursosSaaS['modulos']) => boolean;
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
    case 'Copilot':
      return DEFAULT_COPILOT_FEATURES;
    case 'Pro':
      return DEFAULT_PRO_FEATURES;
    case 'Starter':
    default:
      return DEFAULT_STARTER_FEATURES;
  }
};

/**
 * Carga datos de sesión del localStorage
 */
const loadStoredSession = (): { user: User | null; features: UserFeatures | null } => {
  try {
    const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const storedFeatures = localStorage.getItem(STORAGE_KEYS.FEATURES);

    const user = storedUser ? JSON.parse(storedUser) : null;
    let features = storedFeatures ? JSON.parse(storedFeatures) : null;

    // Si hay usuario pero no features, generar features por defecto según plan
    if (user && !features) {
      features = getDefaultFeaturesByPlan(user.plan);
    }

    return { user, features };
  } catch (error) {
    console.error('Error loading stored session:', error);
    return { user: null, features: null };
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
  const [tipoFidelizacion, setTipoFidelizacion] = useState<'global' | 'staff'>('global');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar sesión al iniciar
  useEffect(() => {
    const { user: storedUser, features: storedFeatures } = loadStoredSession();
    setUser(storedUser);
    setFeatures(storedFeatures);
    setIsLoading(false);
  }, []);

  // Cargar recursos_saas cuando hay sesión activa
  useEffect(() => {
    const loadRecursosSaaS = async () => {
      const businessId = localStorage.getItem('korat_business_id');
      if (!businessId) return;
      try {
        const { data: recursosData, error: dbErr } = await supabase
          .rpc('get_recursos_saas', { b_id: businessId });

        if (!dbErr && recursosData) {
          // Parseamos el JSON seguramente, mezclando con los defaults para evitar undefined properties (Ej: modulos)
          const parsedRecursos = safeParseJSON(recursosData, DEFAULT_RECURSOS);

          setRecursosSaaS(parsedRecursos);

          // Leer tipo_fidelizacion desde recursosData (guardado en el JSON) en lugar de consultar la tabla (bloqueado por RLS)
          if (parsedRecursos?.tipo_fidelizacion) {
            setTipoFidelizacion(parsedRecursos.tipo_fidelizacion);
          }

          // Sincronizar dinámicamente el user.plan con el plan_base del negocio
          if (user) {
            const normalizedPlan = normalizePlanBase(parsedRecursos.plan_base);
            const newPlan = normalizedPlan === 'copilot' ? 'Copilot' : normalizedPlan === 'pro' ? 'Pro' : 'Starter';

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
    if (user?.role === 'Admin') return true;
    const permissions = user?.staffPermissions || DEFAULT_STAFF_PERMISSIONS;
    return permissions[permission] ?? false;
  }, [user]);

  /**
   * Verificar si el tenant tiene un módulo SaaS activado
   */
  const hasSaaSModule = useCallback((moduleName: keyof RecursosSaaS['modulos']): boolean => {
    return recursosSaaS?.modulos?.[moduleName] ?? false;
  }, [recursosSaaS]);

  // Computed values
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'Admin';
  const isStaff = user?.role === 'Staff';
  const normalizedPlan = normalizePlanBase(recursosSaaS.plan_base);
  const isPro = normalizedPlan === 'pro' || normalizedPlan === 'copilot';
  const isCopilot = normalizedPlan === 'copilot';

  return (
    <AuthContext.Provider
      value={{
        user,
        features,
        recursosSaaS,
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
