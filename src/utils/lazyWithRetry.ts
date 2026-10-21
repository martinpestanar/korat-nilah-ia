import React, { ComponentType, lazy } from 'react';

/**
 * lazyWithRetry
 * 
 * En aplicaciones Single Page Apps (SPA) con Service Worker y despliegues continuos,
 * cuando se compila un nuevo bundle, los hashes de los chunks cambian (ej. Calendar-Abc123.js -> Calendar-Xyz789.js).
 * Si un usuario intenta navegar a una pantalla cuyo archivo anterior ya no existe en el servidor,
 * el navegador arroja 'Failed to fetch dynamically imported module' o 'ChunkLoadError'.
 * 
 * Esta función intercepta ese fallo, comprueba si no se ha recargado ya en esta sesión para esa página,
 * y fuerza un refresco limpio de la ventana para descargar los nuevos chunks de producción.
 * Si después del refresco sigue fallando, escala el error al ErrorBoundary sin entrar en bucle infinito.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  componentName?: string
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem(`retry-lazy-refreshed:${componentName || 'chunk'}`) || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem(`retry-lazy-refreshed:${componentName || 'chunk'}`, 'false');
      return component;
    } catch (error: any) {
      const isChunkLoadError =
        error?.message?.includes('Failed to fetch dynamically imported module') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.name === 'ChunkLoadError';

      if (isChunkLoadError && !pageHasAlreadyBeenForceRefreshed) {
        // Marcamos que ya forzamos refresco para este componente para evitar bucles
        window.sessionStorage.setItem(`retry-lazy-refreshed:${componentName || 'chunk'}`, 'true');
        console.warn(`[PWA Auto-Heal] Chunk desactualizado detectado para ${componentName || 'componente'}. Recargando aplicación...`);
        window.location.reload();
        // Retornamos una promesa pendiente mientras la página se recarga
        return new Promise<{ default: T }>(() => {});
      }

      // Si no es un ChunkLoadError o ya se había intentado recargar, dejamos fluir el error hacia el ErrorBoundary
      throw error;
    }
  });
}
