/**
 * ===========================================
 * Auth Context - Korat MVP
 * ===========================================
 *
 * Autenticación con Supabase Auth nativo.
 * - Login / logout / sesión automática con tokens JWT reales
 * - RLS funciona correctamente con auth.uid()
 * - Perfil del usuario cargado desde tabla Usuarios por auth_uid
 * - business_id guardado en localStorage para compatibilidad con n8n
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  User,
  UserFeatures,
  StaffPermissions,
  DEFAULT_STARTER_FEATURES,
  DEFAULT_PRO_FEATURES,
  DEFAULT_COPILOT_FEATURES,
  DEFAULT_STAFF_PERMISSIONS
} from '../types';
import { supabase } from '@/services/supabase';

// ─── SaaS Feature Flags Type (V2 compatible) ───────────────────────────────

export interface RecursosSaaS {
  plan_base: 'basico' | 'pro' | 'copilot' | 'automatico';
  /** Legacy field stored inside the recursos_saas JSON blob by get_plan_preset_v2.
   *  plan_base (injected by get_recursos_saas RPC) takes priority; this is the fallback. */
  plan?: string;
  chatbot?: {
    tipo?: 'mago_de_oz' | 'autonomo';
    activo?: boolean;
    nombre?: string;
    personalidad?: string;
  };
  bot?: {
    modo?: string;
    nombre?: string;
    personalidad?: string;
  };
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

export type PermisosModulosUsuario = Record<string, boolean>;

const DEFAULT_RECURSOS: RecursosSaaS = {
  plan_base: 'basico',
  modulos: {},
  limites: { max_staff: 3 }
};

const normalizePlanBase = (plan: string | undefined | null): 'basico' | 'pro' | 'copilot' => {
  const p = (plan || '').toLowerCase();
  if (['glow_pro', 'automatico', 'pro', 'korat'].includes(p)) return 'pro';
  if (['glow_elite', 'copilot', 'nilah_copilot', 'vip', 'premium'].includes(p)) return 'copilot';
  return 'basico';
};

const readModuleActive = (modulos: Record<string, any>, moduleName: string): boolean => {
  const mod = modulos?.[moduleName];
  if (mod === undefined || mod === null) return false;
  if (typeof mod === 'boolean') return mod;
  if (typeof mod === 'object') return mod.activo ?? false;
  return false;
};

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
  if (typeof data === 'object') return deepMerge(fallback, data);
  try {
    const parsed = JSON.parse(data);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return deepMerge(fallback, parsed);
  } catch { return fallback; }
};

const getDefaultFeaturesByPlan = (plan: User['plan']): UserFeatures => {
  switch (plan) {
    case 'Glow Elite':
    case 'Copilot':
      return DEFAULT_COPILOT_FEATURES;
    case 'Glow Pro':
    case 'Pro':
      return DEFAULT_PRO_FEATURES;
    default:
      return DEFAULT_STARTER_FEATURES;
  }
};

// ===========================================
// Types
// ===========================================

const STORAGE_KEYS = {
  RECURSOS: 'korat_recursos_saas',
} as const;

interface AuthContextType {
  user: User | null;
  features: UserFeatures | null;
  recursosSaaS: RecursosSaaS;
  permisosModulos: PermisosModulosUsuario;
  tipoFidelizacion: 'global' | 'staff';
  nombreNegocio: string;
  destellosUsuario: number;
  avatarId: string | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isPro: boolean;
  isCopilot: boolean;
  isLoading: boolean;
  error: string | null;
  session: Session | null;
  login: (credentials: { email: string; password: string }) => Promise<boolean>;
  loginMock: (email: string) => void;
  logout: () => Promise<void>;
  clearError: () => void;
  hasFeature: (featureName: keyof UserFeatures) => boolean;
  hasStaffPermission: (permission: keyof StaffPermissions) => boolean;
  hasSaaSModule: (moduleName: string) => boolean;
  /** Checks a specific sub-feature within a module, e.g. hasSaaSFeature('finanzas', 'nomina') */
  hasSaaSFeature: (moduleName: string, featureName: string) => boolean;
  refreshNegocioInfo: () => Promise<void>;
  updateAvatarId: (newAvatarId: string) => Promise<void>;
  /** Re-fetches only the destellos balance from Supabase and updates the global counter */
  refreshDestellos: () => Promise<void>;
  /** Re-loads the user profile and session state */
  refreshAuth: () => Promise<void>;
  /** True if the user is authenticated but has no record in the Usuarios table */
  isOrphaned: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===========================================
// Provider Component
// ===========================================

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [features, setFeatures] = useState<UserFeatures | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [recursosSaaS, setRecursosSaaS] = useState<RecursosSaaS>(DEFAULT_RECURSOS);
  const [permisosModulos, setPermisosModulos] = useState<PermisosModulosUsuario>({});
  const [tipoFidelizacion, setTipoFidelizacion] = useState<'global' | 'staff'>('global');
  const [nombreNegocio, setNombreNegocio] = useState<string>('Tu Salón');
  const [destellosUsuario, setDestellosUsuario] = useState<number>(0);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isOrphaned, setIsOrphaned] = useState<boolean>(false);
  // Store current Supabase user id for avatar updates
  const currentSupabaseUidRef = React.useRef<string | null>(null);

  // ─── Carga de perfil completo del usuario ─────────────────────────────────

  const loadingProfileRef = useRef<string | null>(null);
  // Track whether we've already loaded the profile for the current session
  const profileLoadedRef = useRef<string | null>(null);

  const loadUserProfile = useCallback(async (supabaseUser: SupabaseUser) => {
    // Evitar múltiples cargas simultáneas para el mismo ID
    if (loadingProfileRef.current === supabaseUser.id) return;
    loadingProfileRef.current = supabaseUser.id;
    currentSupabaseUidRef.current = supabaseUser.id;

    try {
      // 1. Cargar perfil desde tabla Usuarios usando auth_uid
      // Lo hacemos primero porque necesitamos el business_id para el resto
      const { data: usuarioData, error: uErr } = await supabase
        .from('Usuarios')
        .select('*')
        .eq('auth_uid', supabaseUser.id)
        .maybeSingle();

      if (uErr || !usuarioData) {
        // Durante onboarding es normal no tener perfil aún en la tabla Usuarios
        if (uErr) console.warn('[Auth] No se pudo cargar el perfil extendido:', uErr.message);
        
        // Si no hay perfil, el usuario está "huérfano" (tiene auth pero no datos en Usuarios)
        setIsOrphaned(true);
        loadingProfileRef.current = null;
        return;
      }

      // Si llegamos aquí, el perfil existe
      setIsOrphaned(false);

      // 2. Cargar datos del negocio y recursos en paralelo
      const [negocioRes, recursosRes] = await Promise.all([
        supabase
          .from('negocios')
          .select('nombre, timezone')
          .eq('id', usuarioData.business_id)
          .maybeSingle(),
        supabase.rpc('get_recursos_saas', { b_id: usuarioData.business_id })
      ]);

      const negocioData = negocioRes.data;
      const recursosData = recursosRes.data;

      // 3. Sincronizar localStorage para compatibilidad
      if (usuarioData.business_id) {
        localStorage.setItem('korat_business_id', usuarioData.business_id);
      }
      if (negocioData?.timezone) {
        localStorage.setItem('korat_business_timezone', negocioData.timezone);
      }

      // 4. Actualizar estados
      if (negocioData?.nombre) setNombreNegocio(negocioData.nombre);
      if (usuarioData.destellos !== undefined) setDestellosUsuario(usuarioData.destellos);

      // Avatar: load from DB or assign a random one if missing
      if (usuarioData.avatar_id) {
        setAvatarId(usuarioData.avatar_id);
      } else {
        // Assign a random avatar for first-time users
        const { getRandomAvatar } = await import('../constants/avatars');
        const randomAv = getRandomAvatar();
        setAvatarId(randomAv.id);
        // Persist it silently
        supabase.from('Usuarios').update({ avatar_id: randomAv.id }).eq('auth_uid', supabaseUser.id).then(() => {});
      }

      // Recursos SaaS
      let parsedRecursos = DEFAULT_RECURSOS;
      if (recursosData) {
        parsedRecursos = safeParseJSON(recursosData, DEFAULT_RECURSOS);
        setRecursosSaaS(parsedRecursos);
        localStorage.setItem(STORAGE_KEYS.RECURSOS, JSON.stringify(parsedRecursos));
        if (parsedRecursos?.tipo_fidelizacion) {
          setTipoFidelizacion(parsedRecursos.tipo_fidelizacion);
        }
      }

      // Permisos de módulos por usuario
      if (usuarioData.permisos_modulos) {
        const parsed = typeof usuarioData.permisos_modulos === 'string'
          ? JSON.parse(usuarioData.permisos_modulos)
          : usuarioData.permisos_modulos;
        setPermisosModulos(parsed || {});
      }

      // Normalizar plan
      // NOTA: El campo canónico es `plan_base` dentro del JSON de recursos_saas.
      // El SuperAdmin guarda el plan en la columna `plan_suscripcion` de negocios,
      // y la RPC `get_recursos_saas` lo expone como `plan` en el JSON raíz.
      // Por compatibilidad, usamos `plan_base` si existe, sino caemos en `plan`.
      const planRaw = parsedRecursos.plan_base || parsedRecursos.plan || null;
      const normalizedPlan = normalizePlanBase(planRaw);
      const plan: User['plan'] = normalizedPlan === 'copilot' ? 'Glow Elite'
        : normalizedPlan === 'pro' ? 'Glow Pro' : 'Glow';

      const mappedUser: User = {
        name: usuarioData.nombre_persona || usuarioData.nombre_negocio || 'Usuario',
        email: usuarioData.email,
        role: usuarioData.role || 'Admin',
        plan,
        business_id: usuarioData.business_id,
        staffPermissions: usuarioData.staff_permissions // Asegurar que pasamos permisos de staff si existen
      };

      const userFeatures = getDefaultFeaturesByPlan(plan);
      setUser(mappedUser);
      setFeatures(userFeatures);

    } catch (err) {
      console.error('Error en loadUserProfile:', err);
    } finally {
      // No seteamos isLoading(false) aquí, lo hace el llamador (useEffect o login)
      // para asegurar que el skeleton cubra todo el proceso.
      loadingProfileRef.current = null;
    }
  }, []);

  const refreshAuth = useCallback(async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      // Clear cache ref to force a re-load
      profileLoadedRef.current = null;
      await loadUserProfile(supabaseUser);
    }
  }, [loadUserProfile]);

  // ─── Inicialización: escuchar cambios de sesión de Supabase Auth ──────────
  //
  // CRITICAL: Supabase runs onAuthStateChange callbacks inside an internal lock.
  // Using async/await here to call loadUserProfile (which makes Supabase queries
  // needing the same lock) creates a DEADLOCK — isLoading never resolves.
  // FIX: Use setTimeout(0) to schedule profile loading OUTSIDE the lock scope.

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      // Always update session reference synchronously (safe, no Supabase calls)
      setSession(newSession);

      if (event === 'INITIAL_SESSION') {
        // Page load / refresh — restore session from storage
        if (newSession?.user) {
          if (profileLoadedRef.current !== newSession.user.id) {
            profileLoadedRef.current = newSession.user.id;
            // Schedule outside the lock to avoid deadlock
            setTimeout(() => {
              if (!mounted) return;
              loadUserProfile(newSession.user!).finally(() => {
                if (mounted) setIsLoading(false);
              });
            }, 0);
          } else {
            setIsLoading(false);
          }
        } else {
          setIsLoading(false);
        }

      } else if (event === 'SIGNED_IN' && newSession?.user) {
        // Fresh login
        if (profileLoadedRef.current !== newSession.user.id) {
          profileLoadedRef.current = newSession.user.id;
          setIsLoading(true);
          setTimeout(() => {
            if (!mounted) return;
            loadUserProfile(newSession.user!).finally(() => {
              if (mounted) setIsLoading(false);
            });
          }, 0);
        }

      } else if (event === 'TOKEN_REFRESHED') {
        // Silent token refresh — profile already loaded, nothing to do

      } else if (event === 'SIGNED_OUT') {
        profileLoadedRef.current = null;
        loadingProfileRef.current = null;
        setUser(null);
        setFeatures(null);
        setRecursosSaaS(DEFAULT_RECURSOS);
        setNombreNegocio('Tu Salón');
        setDestellosUsuario(0);
        setIsDemoMode(false);
        localStorage.removeItem('korat_business_id');
        localStorage.removeItem(STORAGE_KEYS.RECURSOS);
        setIsLoading(false);

      } else if (!newSession) {
        // Session expired or cleared
        profileLoadedRef.current = null;
        setUser(null);
        setFeatures(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);  // ← EMPTY deps: only run once on mount. loadUserProfile is stable via useCallback([]).

  // ─── Login ─────────────────────────────────────────────────────────────────

  const login = useCallback(async (credentials: { email: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    // DEMO INTERCEPT
    if (credentials.email === 'demo@brillastudio.com' && credentials.password === 'korat123') {
      setIsDemoMode(true);
      setUser({
        name: 'Dueño',
        email: credentials.email,
        role: 'Admin',
        plan: 'Glow Elite',
        business_id: 'demo-brillastudio',
      });
      setFeatures(DEFAULT_COPILOT_FEATURES);
      setNombreNegocio('Brilla Studio');
      setIsLoading(false);
      window.location.hash = '#/nilah/app';
      return true;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (authError || !data.session) {
        setError('Email o contraseña incorrectos. Por favor intenta de nuevo.');
        setIsLoading(false);
        return false;
      }

      // El perfil se carga automáticamente por onAuthStateChange
      window.location.hash = '#/nilah/app';
      return true;

    } catch (err) {
      console.error('Error en login:', err);
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setIsLoading(false);
      return false;
    }
  }, []);

  // ─── Login Mock (solo DEV) ─────────────────────────────────────────────────

  const loginMock = useCallback((email: string): void => {
    if (!import.meta.env.DEV) {
      console.error('loginMock está deshabilitado en producción.');
      return;
    }
    // En dev, usar Supabase Auth igual para consistencia
    login({ email, password: email.includes('staff') ? 'staff123' : 'pro123' });
  }, [login]);

  // ─── Logout ────────────────────────────────────────────────────────────────

  const logout = useCallback(async (): Promise<void> => {
    await supabase.auth.signOut();
    // onAuthStateChange limpia el estado automáticamente
    window.location.hash = '#/nilah/login';
  }, []);

  // ─── Refresh manual de info del negocio ───────────────────────────────────

  const refreshNegocioInfo = useCallback(async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession?.user) {
      await loadUserProfile(currentSession.user);
    }
  }, [loadUserProfile]);

  /** Lightweight refresh — only re-fetches the destellos field, does not reload the full profile */
  const refreshDestellos = useCallback(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.user) return;
      const { data, error } = await supabase
        .from('Usuarios')
        .select('destellos')
        .eq('auth_uid', currentSession.user.id)
        .maybeSingle();
      if (!error && data && typeof data.destellos === 'number') {
        setDestellosUsuario(data.destellos);
      }
    } catch (err) {
      console.error('[AuthContext] Error refreshing destellos:', err);
    }
  }, []);

  const updateAvatarId = useCallback(async (newAvatarId: string) => {
    setAvatarId(newAvatarId);
    const uid = currentSupabaseUidRef.current;
    if (uid) {
      await supabase.from('Usuarios').update({ avatar_id: newAvatarId }).eq('auth_uid', uid);
    }
  }, []);

  // ─── Helpers de permisos ───────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  const hasFeature = useCallback((featureName: keyof UserFeatures): boolean => {
    return features?.[featureName] ?? false;
  }, [features]);

  const hasStaffPermission = useCallback((permission: keyof StaffPermissions): boolean => {
    const role = user?.role?.toLowerCase();
    if (role === 'admin' || role === 'dueño' || role === 'dueno') return true;
    const permissions = user?.staffPermissions || DEFAULT_STAFF_PERMISSIONS;
    return permissions[permission] ?? false;
  }, [user]);

  const hasSaaSModule = useCallback((moduleName: string): boolean => {
    const modulos = recursosSaaS?.modulos || {};
    const modulosLoaded = Object.keys(modulos).length > 0;
    let negocioTieneModulo = false;

    const defaultBasic = ['dashboard', 'agenda', 'inbox', 'configuracion', 'crm', 'finanzas'];

    if (modulosLoaded && moduleName in modulos) {
      negocioTieneModulo = readModuleActive(modulos, moduleName);
    } else if (modulosLoaded) {
      negocioTieneModulo = defaultBasic.includes(moduleName);
    } else {
      const planNorm = normalizePlanBase(user?.plan);
      if (planNorm === 'copilot') negocioTieneModulo = true;
      else if (planNorm === 'pro') negocioTieneModulo = moduleName !== 'copilot';
      else negocioTieneModulo = defaultBasic.includes(moduleName) || moduleName === 'engagement';
    }

    const isOwnerOrAdmin = ['admin', 'dueño', 'dueno'].includes(user?.role?.toLowerCase() || '');
    const isCoreModule = ['dashboard', 'agenda', 'inbox', 'configuracion', 'crm', 'finanzas', 'settings'].includes(moduleName);
    if (isOwnerOrAdmin && isCoreModule) return true;
    if (!negocioTieneModulo) return false;

    if (Object.keys(permisosModulos).length > 0) {
      if (moduleName in permisosModulos) return permisosModulos[moduleName] === true;
      return true;
    }

    return true;
  }, [recursosSaaS, permisosModulos, user]);

  /**
   * hasSaaSFeature — reads a specific sub-feature within a module.
   * E.g. hasSaaSFeature('finanzas', 'nomina') reads modulos.finanzas.sub_pestanas.nomina
   *      hasSaaSFeature('dashboard', 'trabajo_nilah') reads modulos.dashboard.widgets.trabajo_nilah
   */
  const hasSaaSFeature = useCallback((moduleName: string, featureName: string): boolean => {
    const modulos = recursosSaaS?.modulos || {};
    const mod = modulos[moduleName];
    if (!mod || typeof mod !== 'object') return true; // si no hay config, permitir por defecto
    // Buscar en sub_pestanas primero, luego en widgets
    if (mod.sub_pestanas && featureName in mod.sub_pestanas) {
      return mod.sub_pestanas[featureName] === true;
    }
    if (mod.widgets && featureName in mod.widgets) {
      return mod.widgets[featureName] === true;
    }
    return true; // si la key no existe, asumir habilitado (seguro para planes legacy)
  }, [recursosSaaS]);

  // ─── Computed values ───────────────────────────────────────────────────────

  // isAuthenticated depende de la sesión de Supabase Auth o si está en Modo Demo
  const isAuthenticated = !!session || isDemoMode;
  const userRoleRaw = user?.role?.toLowerCase() || '';
  const isAdmin = ['admin', 'dueño', 'dueno', 'owner', 'propietario'].includes(userRoleRaw);
  const isStaff = userRoleRaw === 'staff';
  // Use plan_base (injected by RPC) with fallback to plan (legacy JSON field)
  const normalizedPlan = normalizePlanBase(recursosSaaS.plan_base || recursosSaaS.plan);
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
        isDemoMode,
        isAdmin,
        isStaff,
        isPro,
        isCopilot,
        isLoading,
        error,
        session,
        login,
        loginMock,
        logout,
        clearError,
        hasFeature,
        hasStaffPermission,
        hasSaaSModule,
        hasSaaSFeature,
        nombreNegocio,
        destellosUsuario,
        avatarId,
        refreshNegocioInfo,
        refreshDestellos,
        refreshAuth,
        isOrphaned,
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