/**
 * Validador de números telefónicos y detección de patrones falsos/secuencias.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  isSuspicious: boolean;
  cleanPhone: string;
  errorMessage?: string;
  suspiciousReason?: string;
}

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  expectedLength: number; // longitud del número nacional
  prefixPattern?: RegExp; // prefijo habitual
}

export const COUNTRIES: CountryCode[] = [
  { name: 'Perú', code: 'PE', dialCode: '+51', flag: '🇵🇪', expectedLength: 9, prefixPattern: /^9\d{8}$/ },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴', expectedLength: 10, prefixPattern: /^3\d{9}$/ },
  { name: 'México', code: 'MX', dialCode: '+52', flag: '🇲🇽', expectedLength: 10 },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷', expectedLength: 10 },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱', expectedLength: 9, prefixPattern: /^9\d{8}$/ },
  { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: '🇪🇨', expectedLength: 9, prefixPattern: /^9\d{8}$/ },
  { name: 'Bolivia', code: 'BO', dialCode: '+591', flag: '🇧🇴', expectedLength: 8, prefixPattern: /^[67]\d{7}$/ },
  { name: 'España', code: 'ES', dialCode: '+34', flag: '🇪🇸', expectedLength: 9, prefixPattern: /^[67]\d{8}$/ },
  { name: 'Estados Unidos', code: 'US', dialCode: '+1', flag: '🇺🇸', expectedLength: 10 },
  { name: 'Otro', code: 'OTHER', dialCode: '+', flag: '🌐', expectedLength: 8 },
];

/**
 * Detecta números secuenciales (ej. 12345678, 98765432)
 */
function isSequential(str: string): boolean {
  if (str.length < 5) return false;
  let ascending = true;
  let descending = true;

  for (let i = 0; i < str.length - 1; i++) {
    const curr = parseInt(str[i], 10);
    const next = parseInt(str[i + 1], 10);
    if (next !== (curr + 1) % 10) ascending = false;
    if (next !== (curr - 1 + 10) % 10) descending = false;
  }
  return ascending || descending;
}

/**
 * Detecta dígitos repetidos en exceso (ej. 11111111, 99999999) o con más de 70% del mismo dígito
 */
function isExcessivelyRepeated(str: string): boolean {
  if (str.length < 5) return false;
  // Todos idénticos
  if (/^(\d)\1+$/.test(str)) return true;

  // Repite el mismo carácter 5 o más veces seguidas
  if (/(\d)\1{4,}/.test(str)) return true;

  // Un solo dígito compone más del 70% del número
  const counts: Record<string, number> = {};
  for (const ch of str) {
    counts[ch] = (counts[ch] || 0) + 1;
    if (counts[ch] >= str.length * 0.7) return true;
  }

  return false;
}

/**
 * Lista negra de números comunes de prueba
 */
const BLACKLISTED_NUMBERS = new Set([
  '123456789',
  '987654321',
  '12345678',
  '87654321',
  '0123456789',
  '999999999',
  '9876543210',
  '1122334455',
  '1212121212',
]);

/**
 * Valida un número telefónico completo o con código de país.
 */
export function validateWhatsAppNumber(
  rawPhone: string,
  countryDialCode: string = '+51'
): PhoneValidationResult {
  const digitsOnly = rawPhone.replace(/\D/g, '');

  if (!digitsOnly || digitsOnly.length < 7) {
    return {
      isValid: false,
      isSuspicious: false,
      cleanPhone: '',
      errorMessage: 'El número de WhatsApp es demasiado corto.',
    };
  }

  // Verificar si es falso / sospechoso
  if (BLACKLISTED_NUMBERS.has(digitsOnly)) {
    return {
      isValid: false,
      isSuspicious: true,
      cleanPhone: '',
      errorMessage: 'Por favor ingresa un número de WhatsApp real para poder darte soporte directo.',
      suspiciousReason: 'Número de prueba genérico detectado',
    };
  }

  if (isExcessivelyRepeated(digitsOnly)) {
    return {
      isValid: false,
      isSuspicious: true,
      cleanPhone: '',
      errorMessage: 'El número parece no ser válido (dígitos repetidos). Ingresa tu WhatsApp activo.',
      suspiciousReason: 'Dígitos repetidos en exceso',
    };
  }

  if (isSequential(digitsOnly)) {
    return {
      isValid: false,
      isSuspicious: true,
      cleanPhone: '',
      errorMessage: 'Ingresa un número real de WhatsApp. Este canal es para brindarte ayuda si la necesitas.',
      suspiciousReason: 'Secuencia numérica obvia',
    };
  }

  // Reglas según el país seleccionado
  const country = COUNTRIES.find((c) => c.dialCode === countryDialCode);
  if (country && country.code !== 'OTHER') {
    if (digitsOnly.length !== country.expectedLength) {
      return {
        isValid: false,
        isSuspicious: false,
        cleanPhone: '',
        errorMessage: `En ${country.name} el número debe tener ${country.expectedLength} dígitos (ingresaste ${digitsOnly.length}).`,
      };
    }

    if (country.prefixPattern && !country.prefixPattern.test(digitsOnly)) {
      return {
        isValid: false,
        isSuspicious: true,
        cleanPhone: '',
        errorMessage: `El número para ${country.name} no coincide con el formato celular habitual.`,
        suspiciousReason: 'Prefijo inválido para el país',
      };
    }
  }

  const cleanFull = `${countryDialCode.replace(/\+/, '')}${digitsOnly}`;

  return {
    isValid: true,
    isSuspicious: false,
    cleanPhone: `+${cleanFull}`,
  };
}
