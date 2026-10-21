/**
 * AppPurgeRecovery.ts
 * 
 * Sistema de Autocuración y Purga Remota de Emergencia:
 * 1. Escucha en Supabase Realtime el canal global 'app_emergency_broadcast'
 * 2. Si el SuperAdmin emite un comando de 'PURGE_CACHE_AND_RELOAD', ejecuta:
 *    - Limpieza de Service Workers obsoletos
 *    - Limpieza de Caches del navegador (caches.keys() -> delete)
 *    - Limpieza de marcas temporales de lazy load en sessionStorage
 *    - Preservación sagrada de tokens de autenticación de Supabase en localStorage
 *    - Recarga limpia con cache-buster
 * 3. Comprobación pasiva de epoch (marca temporal) en superadmin_config al iniciar sesión.
 */

import { supabase } from './supabase';

const PURGE_EPOCH_STORAGE_KEY = 'nilah_app_last_purged_epoch';

/**
 * Ejecuta la purga limpia del cliente y recarga
 */
export async function executeClientPurgeAndReload(reason?: string) {
  console.warn(`[Emergency Purge] Ejecutando purga de emergencia. Razón: ${reason || 'Comando remoto'}`);

  try {
    // 1. Limpiar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
    }

    // 2. Limpiar Caches de Workbox / Browser
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }

    // Limpiar sessionStorage sin bucles
    sessionStorage.clear();

    // 4. Limpiar localStorage respetando la sesión de usuario y la marca de epoch
    // Guardamos claves críticas de Supabase auth y el epoch
    const preservedItems: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('sb-') ||
          key.includes('supabase.auth.token') ||
          key === 'nilah_theme' ||
          key === PURGE_EPOCH_STORAGE_KEY)
      ) {
        preservedItems[key] = localStorage.getItem(key) || '';
      }
    }

    localStorage.clear();

    // Restaurar sesión, tema y marca de epoch
    Object.entries(preservedItems).forEach(([k, v]) => {
      localStorage.setItem(k, v);
    });

  } catch (err) {
    console.error('[Emergency Purge] Error durante limpieza parcial:', err);
  } finally {
    // Recarga limpia asegurando no leer caché pero limpiando el parámetro de query
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('__purge_ts');
    window.location.replace(cleanUrl.toString());
  }
}

/**
 * Inicia el escucha en tiempo real de comandos de emergencia del SuperAdmin
 */
export function initEmergencyPurgeListener() {
  if (typeof window === 'undefined') return () => {};

  try {
    // Escucha en canal Realtime Broadcast
    const emergencyChannel = supabase.channel('nilah_app_emergency_channel', {
      config: { broadcast: { self: false } }
    });

    emergencyChannel
      .on('broadcast', { event: 'EMERGENCY_APP_PURGE' }, async (payload) => {
        console.warn('🚨 [Realtime Emergency] Señal de purga global recibida del SuperAdmin:', payload);
        const purgeEpoch = payload?.payload?.epoch || Date.now();
        localStorage.setItem(PURGE_EPOCH_STORAGE_KEY, purgeEpoch.toString());
        await executeClientPurgeAndReload('SuperAdmin Realtime Broadcast Signal');
      })
      .subscribe();

    // Comprobación pasiva de epoch remoto en superadmin_config
    checkRemotePurgeEpoch();

    return () => {
      supabase.removeChannel(emergencyChannel);
    };
  } catch (e) {
    console.warn('[Emergency Purge] No se pudo inicializar listener:', e);
    return () => {};
  }
}

/**
 * Comprobación pasiva para clientes que estuvieron offline o acaban de abrir la app
 */
async function checkRemotePurgeEpoch() {
  try {
    const { data } = await supabase.rpc('get_superadmin_config', { p_clave: 'app_purge_epoch' });
    if (data && typeof data === 'object' && 'epoch' in data) {
      const remoteEpoch = Number((data as any).epoch);
      const localEpoch = Number(localStorage.getItem(PURGE_EPOCH_STORAGE_KEY) || '0');

      if (remoteEpoch > localEpoch && (Date.now() - remoteEpoch) < (7 * 24 * 60 * 60 * 1000)) {
        // El SuperAdmin emitió una purga más reciente que nuestra última purga
        localStorage.setItem(PURGE_EPOCH_STORAGE_KEY, remoteEpoch.toString());
        await executeClientPurgeAndReload(`Epoch desfasado (Local: ${localEpoch}, Remoto: ${remoteEpoch})`);
      }
    }
  } catch {
    // Silencioso en caso de error de red
  }
}
