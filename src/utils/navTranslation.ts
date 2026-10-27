/**
 * Mapeo canónico de rutas de navegación a claves de i18n
 */
export const NAV_TRANSLATION_KEYS: Record<string, string> = {
  '/nilah/app': 'nav.dashboard',
  '/nilah/app/calendar': 'nav.calendar',
  '/nilah/app/inbox': 'nav.inbox',
  '/nilah/app/clients': 'nav.clients',
  '/nilah/app/marketing': 'nav.marketing',
  '/nilah/app/automatizaciones': 'nav.automations',
  '/nilah/app/creative': 'nav.creative',
  '/nilah/app/finances': 'nav.finances',
  '/nilah/app/store': 'nav.store',
  '/nilah/app/carta': 'nav.digital_menu',
  '/nilah/app/club-glow': 'nav.loyalty',
  '/nilah/app/settings': 'nav.settings',
  '/nilah/app/resenas': 'nav.reviews',
  '/nilah/app/pos': 'nav.pos',
};

export function getNavTranslationKey(path: string): string | undefined {
  if (NAV_TRANSLATION_KEYS[path]) return NAV_TRANSLATION_KEYS[path];
  const matched = Object.keys(NAV_TRANSLATION_KEYS).find(key => 
    key !== '/nilah/app' && path.startsWith(key)
  );
  return matched ? NAV_TRANSLATION_KEYS[matched] : undefined;
}
