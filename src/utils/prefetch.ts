/**
 * Prefetch predictivo de rutas para aceleración instantánea en Mobile / SPA.
 * Descarga los chunks de JavaScript en memoria antes de que el usuario haga clic.
 */

const prefetchedRoutes = new Set<string>();

export const prefetchRoute = (route: string) => {
  if (typeof window === 'undefined') return;
  
  const cleanRoute = route.split('?')[0].split('#')[0];
  if (prefetchedRoutes.has(cleanRoute)) return;

  prefetchedRoutes.add(cleanRoute);

  try {
    switch (cleanRoute) {
      case '/nilah/app':
      case '/nilah/app/dashboard':
        import('../pages/Dashboard');
        break;
      case '/nilah/app/calendar':
      case '/nilah/app/agenda':
        import('../pages/Calendar');
        break;
      case '/nilah/app/clients':
      case '/nilah/app/crm':
        import('../pages/CRM');
        break;
      case '/nilah/app/inbox':
        import('../pages/Inbox');
        break;
      case '/nilah/app/marketing':
        import('../pages/Marketing');
        break;
      case '/nilah/app/automatizaciones':
        import('../pages/Automatizaciones');
        break;
      case '/nilah/app/finances':
      case '/nilah/app/finanzas':
        import('../pages/Finances');
        break;
      case '/nilah/app/settings':
      case '/nilah/app/ajustes':
        import('../pages/Settings');
        break;
      case '/nilah/app/creative':
        import('../pages/NilahCreative');
        break;
      case '/nilah/app/growth':
        import('../pages/Growth');
        break;
      case '/nilah/app/loyalty':
        import('../pages/Loyalty');
        break;
      case '/nilah/app/store':
        import('../pages/Store');
        break;
      case '/nilah/app/pos-express':
        import('../pages/KoratPosExpress');
        break;
      default:
        break;
    }
  } catch (err) {
    // Ignorar silenciosamente si ya se está cargando
  }
};

/**
 * Precarga de rutas prioritarias en momentos ociosos del navegador (Idle Time)
 */
export const prefetchCoreModules = () => {
  if (typeof window === 'undefined') return;

  const loadCore = () => {
    prefetchRoute('/nilah/app/calendar');
    prefetchRoute('/nilah/app/clients');
    prefetchRoute('/nilah/app/inbox');
    prefetchRoute('/nilah/app/marketing');
    prefetchRoute('/nilah/app/automatizaciones');
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(loadCore, { timeout: 3000 });
  } else {
    setTimeout(loadCore, 1200);
  }
};
