/**
 * Utilidad Multitenant de Moneda y Conversión por País
 * 
 * Regla de Oro:
 * - Si el negocio tiene país configurado, se resuelve su moneda local.
 * - Si no tiene país o no tiene moneda configurada, el valor por defecto estándar es 'USD' ($).
 * - Provee tasas de cambio aproximadas de referencia (USD base) para conversiones automáticas
 *   de tickets sugeridos entre dólares y la moneda local de cada país.
 */

export interface PaisMonedaInfo {
  pais: string;
  codigoMoneda: string; // ISO 4217 (USD, PEN, COP, etc.)
  simbolo: string;
  tasaCambioAproxUsd: number; // Cantidad de moneda local por 1 USD
  idiomaLocale: string;
}

export const PAISES_MONEDAS_CONFIG: Record<string, PaisMonedaInfo> = {
  'Perú': {
    pais: 'Perú',
    codigoMoneda: 'PEN',
    simbolo: 'S/.',
    tasaCambioAproxUsd: 3.75,
    idiomaLocale: 'es-PE'
  },
  'Colombia': {
    pais: 'Colombia',
    codigoMoneda: 'COP',
    simbolo: '$',
    tasaCambioAproxUsd: 4100,
    idiomaLocale: 'es-CO'
  },
  'México': {
    pais: 'México',
    codigoMoneda: 'MXN',
    simbolo: '$',
    tasaCambioAproxUsd: 19.5,
    idiomaLocale: 'es-MX'
  },
  'Chile': {
    pais: 'Chile',
    codigoMoneda: 'CLP',
    simbolo: '$',
    tasaCambioAproxUsd: 940,
    idiomaLocale: 'es-CL'
  },
  'Argentina': {
    pais: 'Argentina',
    codigoMoneda: 'ARS',
    simbolo: '$',
    tasaCambioAproxUsd: 1200,
    idiomaLocale: 'es-AR'
  },
  'Ecuador': {
    pais: 'Ecuador',
    codigoMoneda: 'USD',
    simbolo: '$',
    tasaCambioAproxUsd: 1.0,
    idiomaLocale: 'es-EC'
  },
  'Bolivia': {
    pais: 'Bolivia',
    codigoMoneda: 'BOB',
    simbolo: 'Bs',
    tasaCambioAproxUsd: 6.96,
    idiomaLocale: 'es-BO'
  },
  'Venezuela': {
    pais: 'Venezuela',
    codigoMoneda: 'USD', // Mayormente transaccionado en USD
    simbolo: '$',
    tasaCambioAproxUsd: 1.0,
    idiomaLocale: 'es-VE'
  },
  'España': {
    pais: 'España',
    codigoMoneda: 'EUR',
    simbolo: '€',
    tasaCambioAproxUsd: 0.92,
    idiomaLocale: 'es-ES'
  },
  'Estados Unidos': {
    pais: 'Estados Unidos',
    codigoMoneda: 'USD',
    simbolo: '$',
    tasaCambioAproxUsd: 1.0,
    idiomaLocale: 'en-US'
  }
};

export const DEFAULT_MONEDA_USD: PaisMonedaInfo = {
  pais: 'Internacional',
  codigoMoneda: 'USD',
  simbolo: '$',
  tasaCambioAproxUsd: 1.0,
  idiomaLocale: 'en-US'
};

/**
 * Resuelve la moneda de un negocio según su país y campo de moneda guardado.
 * Si no hay país ni moneda, retorna USD por defecto.
 */
export function resolverMonedaNegocio(pais?: string | null, monedaGuardada?: string | null): PaisMonedaInfo {
  // Función para normalizar texto quitando acentos y espacios
  const normalizar = (txt: string) =>
    txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // 1. Si hay país registrado, EL PAÍS ES LA FUENTE PRIMARIA DE LA VERDAD
  if (pais && pais.trim()) {
    const pNorm = normalizar(pais);
    const matched = Object.values(PAISES_MONEDAS_CONFIG).find(
      p => normalizar(p.pais) === pNorm
    );
    if (matched) {
      return matched;
    }
  }

  // 2. Si no hay país pero hay un código/símbolo de moneda guardado
  if (monedaGuardada && monedaGuardada.trim()) {
    const raw = monedaGuardada.trim().toUpperCase();
    if (raw === 'PEN' || raw === 'S/.' || raw === 'S/') {
      return PAISES_MONEDAS_CONFIG['Perú'];
    }
    if (raw === 'COP') return PAISES_MONEDAS_CONFIG['Colombia'];
    if (raw === 'MXN') return PAISES_MONEDAS_CONFIG['México'];
    if (raw === 'CLP') return PAISES_MONEDAS_CONFIG['Chile'];
    if (raw === 'ARS') return PAISES_MONEDAS_CONFIG['Argentina'];
    if (raw === 'EUR' || raw === '€') return PAISES_MONEDAS_CONFIG['España'];
    if (raw === 'USD' || raw === '$') return DEFAULT_MONEDA_USD;

    // Moneda desconocida pero especificada
    return {
      pais: 'Personalizado',
      codigoMoneda: raw,
      simbolo: raw,
      tasaCambioAproxUsd: 1.0,
      idiomaLocale: 'es-ES'
    };
  }

  // 3. Fallback multitenant internacional: Dólares (USD)
  return DEFAULT_MONEDA_USD;
}

/**
 * Convierte un monto en Dólares (USD) a la moneda local de destino
 */
export function convertirUsdAMonedaLocal(montoUsd: number, info: PaisMonedaInfo): number {
  if (info.codigoMoneda === 'USD') return Math.round(montoUsd * 10) / 10;
  const convertido = montoUsd * info.tasaCambioAproxUsd;
  // Redondeo amigable según escala de moneda (COP/CLP redondean a 1000s, PEN/MXN a enteros)
  if (info.tasaCambioAproxUsd > 100) {
    return Math.round(convertido / 1000) * 1000;
  }
  return Math.round(convertido);
}
