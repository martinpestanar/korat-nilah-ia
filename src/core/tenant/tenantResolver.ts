/**
 * ============================================================
 * CORE FOUNDATION: Tenant & Impersonation Resolver
 * ============================================================
 * Única fuente de verdad para resolver el salón activo (business_id),
 * el Modo Espejo (Impersonación desde el Árbol SuperAdmin) y el retorno
 * exacto al nodo del árbol donde estaba el administrador.
 */

const STORAGE_KEYS = {
  BUSINESS_ID: 'korat_business_id',
  USER: 'korat_user',
  IMPERSONATED_BIZ_ID: 'korat_impersonated_business_id',
  IMPERSONATED_BIZ_NAME: 'korat_impersonated_business_name',
  SUPERADMIN_RETURN_URL: 'korat_superadmin_return_url',
  SUPERADMIN_SESSION: 'korat_super_admin',
  TIMEZONE: 'korat_business_timezone',
  PAIS: 'korat_business_pais',
  IDIOMA: 'korat_business_idioma',
  MODO_FIDELIZACION: 'korat_modo_fidelizacion',
} as const;

export interface SuperAdminSession {
  id?: string | number;
  email: string;
  nombre: string;
  loginAt: string;
}

/**
 * Resuelve el business_id activo priorizando:
 * 1. Modo Espejo (sessionStorage) si el SuperAdmin está auditando un salón.
 * 2. El business_id pasado explícitamente desde el contexto de autenticación.
 * 3. El business_id persistido en localStorage.
 */
export function resolveActiveBusinessId(explicitBusinessId?: string | null): string | null {
  if (typeof window === 'undefined') return explicitBusinessId || null;

  const impersonated = sessionStorage.getItem(STORAGE_KEYS.IMPERSONATED_BIZ_ID);
  if (impersonated && impersonated.trim() !== '') {
    return impersonated.trim();
  }

  if (explicitBusinessId && explicitBusinessId.trim() !== '') {
    return explicitBusinessId.trim();
  }

  const stored = localStorage.getItem(STORAGE_KEYS.BUSINESS_ID);
  if (stored && stored.trim() !== '' && stored !== 'default-korat-business-id') {
    return stored.trim();
  }

  const rawUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (rawUser) {
    try {
      const parsed = JSON.parse(rawUser);
      if (parsed?.business_id && parsed.business_id !== 'default-korat-business-id') {
        localStorage.setItem(STORAGE_KEYS.BUSINESS_ID, parsed.business_id);
        return parsed.business_id;
      }
    } catch {
      // Ignorar JSON corrupto
    }
  }

  return null;
}

/**
 * Sincroniza el contexto del salón en almacenamiento local para compatibilidad
 * con servicios existentes.
 */
export function syncTenantStorage(params: {
  businessId?: string | null;
  timezone?: string | null;
  pais?: string | null;
  idioma?: string | null;
  modoFidelizacion?: string | null;
}): void {
  if (typeof window === 'undefined') return;

  if (params.businessId) {
    localStorage.setItem(STORAGE_KEYS.BUSINESS_ID, params.businessId);
  }
  if (params.timezone) {
    localStorage.setItem(STORAGE_KEYS.TIMEZONE, params.timezone);
  }
  if (params.pais) {
    localStorage.setItem(STORAGE_KEYS.PAIS, params.pais);
  }
  if (params.idioma) {
    localStorage.setItem(STORAGE_KEYS.IDIOMA, params.idioma);
  }
  if (params.modoFidelizacion) {
    localStorage.setItem(STORAGE_KEYS.MODO_FIDELIZACION, params.modoFidelizacion);
  }
}

// ─── Modo Espejo (Impersonación desde SuperAdmin Árbol) ─────────────────────

export function isSuperAdminImpersonating(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem(STORAGE_KEYS.IMPERSONATED_BIZ_ID));
}

export function getImpersonatedBusinessInfo(): { id: string | null; name: string | null } {
  if (typeof window === 'undefined') return { id: null, name: null };
  return {
    id: sessionStorage.getItem(STORAGE_KEYS.IMPERSONATED_BIZ_ID),
    name: sessionStorage.getItem(STORAGE_KEYS.IMPERSONATED_BIZ_NAME),
  };
}

/**
 * Inicia el Modo Espejo guardando la URL exacta del nodo del árbol de SuperAdmin
 * para que al salir ("← Volver a SuperAdmin") regrese exactamente al mismo lugar.
 */
export function startSalonImpersonation(
  businessId: string,
  businessName?: string,
  openInNewTab = false
): void {
  if (typeof window === 'undefined') return;

  const currentUrl = `${window.location.pathname}${window.location.search}`;
  sessionStorage.setItem(STORAGE_KEYS.IMPERSONATED_BIZ_ID, businessId);
  if (businessName) {
    sessionStorage.setItem(STORAGE_KEYS.IMPERSONATED_BIZ_NAME, businessName);
  }
  if (currentUrl.startsWith('/god-mode')) {
    sessionStorage.setItem(STORAGE_KEYS.SUPERADMIN_RETURN_URL, currentUrl);
  } else {
    sessionStorage.setItem(
      STORAGE_KEYS.SUPERADMIN_RETURN_URL,
      `/god-mode/dashboard?tab=clientes&salon=${businessId}`
    );
  }

  if (openInNewTab) {
    window.open('/nilah/app', '_blank');
  } else {
    window.location.href = '/nilah/app';
  }
}

/**
 * Finaliza el Modo Espejo y devuelve al SuperAdmin exactamente al nodo del árbol
 * donde estaba antes de impersonar.
 */
export function stopSalonImpersonation(): void {
  if (typeof window === 'undefined') return;

  const returnUrl =
    sessionStorage.getItem(STORAGE_KEYS.SUPERADMIN_RETURN_URL) ||
    '/god-mode/dashboard?tab=clientes';

  sessionStorage.removeItem(STORAGE_KEYS.IMPERSONATED_BIZ_ID);
  sessionStorage.removeItem(STORAGE_KEYS.IMPERSONATED_BIZ_NAME);
  sessionStorage.removeItem(STORAGE_KEYS.SUPERADMIN_RETURN_URL);

  window.location.href = returnUrl;
}

// ─── Sesión SuperAdmin ──────────────────────────────────────────────────────

export function getSuperAdminSession(): SuperAdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(STORAGE_KEYS.SUPERADMIN_SESSION);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.email && parsed?.loginAt) {
      return parsed as SuperAdminSession;
    }
    return null;
  } catch {
    return null;
  }
}
