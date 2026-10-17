/**
 * ================================================================
 * SERVICIO: GESTOR DE TARJETAS GLOBALES CLUB GLOW (12 SELLOS)
 * Soporta almacenamiento en Supabase Storage (nilah_assets / brand_assets)
 * con fallback a URLs públicas o DataURLs para envío por WhatsApp / Evolution API
 * ================================================================
 */
import { supabase } from '@/services/supabase';
import { optimizeImageClient } from '@/utils/clientImageOptimizer';

export interface TarjetaSelloConfig {
  sello: number; // 1 a 12
  nombre_hito: string; // ej: "Bienvenida", "Meta 1: Spa Cutículas", etc.
  imagen_url: string; // URL pública en Supabase Storage o asset por defecto
  titulo_notificacion: string;
  copy_sugerido: string;
  es_premio: boolean;
}

// Configuración por defecto con las 12 etapas dopamínicas del Club Glow (UX Cálido y Enlaces Estratégicos)
export const CONFIG_SELLOS_DEFAULT: TarjetaSelloConfig[] = [
  {
    sello: 1,
    nombre_hito: 'Sello 1 • ¡Bienvenida al Club Glow!',
    imagen_url: '',
    titulo_notificacion: '✨ ¡Bienvenida al Club!',
    copy_sugerido: '¡Bienvenida al Club {salon}, {nombre}! 🎁\n\nTe regalamos 1 sello por unirte y hoy sumaste otro: ya llevas *2 de 12*.\n\nTe faltan solo *2 sellos* para tu primer regalo: *Spa Cutículas & Hidratación Express*.\n\n📲 *Descubre todos los regalos y mira tu tarjeta:* {link_tarjeta}',
    es_premio: false,
  },
  {
    sello: 2,
    nombre_hito: 'Sello 2 • Constancia & Brillo',
    imagen_url: '',
    titulo_notificacion: '💕 Sello 2 sumado',
    copy_sugerido: '¡Qué lindo verte hoy, {nombre}! 💕\n\nSumaste tu sello de hoy y ya tienes *2 de 12*.\n\nEstás a solo 2 visitas de tu primer regalo: *Spa Cutículas & Hidratación Express* ✨',
    es_premio: false,
  },
  {
    sello: 3,
    nombre_hito: 'Sello 3 • A un paso de la Meta 1',
    imagen_url: '',
    titulo_notificacion: '🌸 ¡A 1 paso de tu regalo!',
    copy_sugerido: '¡Casi lo tienes, {nombre}! 🌸\n\nHoy sumaste tu *sello 3 de 12*.\n\nEn tu próxima visita desbloqueas tu primer regalo: *Spa Cutículas & Hidratación Express* 🎁\n\n📲 *Mira qué poquito te falta:* {link_tarjeta}',
    es_premio: false,
  },
  {
    sello: 4,
    nombre_hito: 'Sello 4 🎁 META 1: Primer Mimo Desbloqueado',
    imagen_url: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_4.jpg',
    titulo_notificacion: '🎉 ¡Primer Regalo Desbloqueado!',
    copy_sugerido: '¡Lo lograste, {nombre}! 🎉\n\nLlegaste al *sello 4 de 12* en el Club {salon} y ganaste tu:\n🎁 *Spa Cutículas & Hidratación Express*\n\nMuéstrale este mensaje a recepción y dile tu código: `{codigo}`\n\n📲 *Ver tu tarjeta:* {link_tarjeta}',
    es_premio: true,
  },
  {
    sello: 5,
    nombre_hito: 'Sello 5 • Nivel Bronce Consolidado',
    imagen_url: '',
    titulo_notificacion: '✨ Sumaste otro sello',
    copy_sugerido: '¡Qué lindo consentirte hoy, {nombre}! ✨\n\nSumaste otro sellito a tu tarjeta y ya llevas *5 de 12*.\n\nCada visita te acerca más a tu siguiente regalo: *Tratamiento Capilar Profundo o Manicure* 💎',
    es_premio: false,
  },
  {
    sello: 6,
    nombre_hito: 'Sello 6 • Mitad de Camino',
    imagen_url: '',
    titulo_notificacion: '💖 Mitad de camino cumplida',
    copy_sugerido: '¡Llegaste a la mitad del camino, {nombre}! 💖\n\nYa tienes *6 de 12 sellos* y tu constancia se nota.\n\nEstás a solo 2 visitas de ganar tu *Tratamiento Capilar Profundo* ✨',
    es_premio: false,
  },
  {
    sello: 7,
    nombre_hito: 'Sello 7 • A un paso de la Meta 2',
    imagen_url: '',
    titulo_notificacion: '🌸 ¡A 1 paso de tu Meta 8!',
    copy_sugerido: '¡Estás a un solo pasito, {nombre}! 🌸\n\nHoy sumaste tu *sello 7 de 12*.\n\nEn tu próxima visita te llevas tu regalo: *Tratamiento Capilar Profundo o Manicure* 🎁\n\n📲 *Mira tu tarjeta casi lista:* {link_tarjeta}',
    es_premio: false,
  },
  {
    sello: 8,
    nombre_hito: 'Sello 8 🎁 META 2: Tratamiento VIP Desbloqueado',
    imagen_url: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_8.jpg',
    titulo_notificacion: '🎉 ¡Segundo Regalo Desbloqueado!',
    copy_sugerido: '¡Vas increíble, {nombre}! 🎉\n\nLlegaste al *sello 8 de 12* y ganaste tu:\n🎁 *Tratamiento Capilar Profundo o Manicure Semipermanente*\n\nMuéstrale este mensaje a recepción y dile tu código: `{codigo}`\n\nTe faltan solo 4 sellos para tu premio grande: *Servicio Completo Estrella* 👑\n\n📲 *Ver tu tarjeta:* {link_tarjeta}',
    es_premio: true,
  },
  {
    sello: 9,
    nombre_hito: 'Sello 9 • Nivel Glow Diamond',
    imagen_url: '',
    titulo_notificacion: '✨ Recta final',
    copy_sugerido: '¡Bienvenida a la recta final, {nombre}! ✨\n\nHoy sumaste tu *sello 9 de 12*.\n\nSolo 3 visitas te separan de tu premio máximo 👑',
    es_premio: false,
  },
  {
    sello: 10,
    nombre_hito: 'Sello 10 • Clienta Embajadora',
    imagen_url: '',
    titulo_notificacion: '💕 10 sellos acumulados',
    copy_sugerido: '¡Nos encanta tenerte siempre aquí, {nombre}! 💕\n\nYa sumaste *10 de 12 sellos*.\n\nEstás muy cerquita de tu gran graduación y tu premio estrella 🌟',
    es_premio: false,
  },
  {
    sello: 11,
    nombre_hito: 'Sello 11 • A 1 Sello de la Corona Final',
    imagen_url: '',
    titulo_notificacion: '👑 ¡A 1 paso de la Gran Corona!',
    copy_sugerido: '¡Solo una visita más, {nombre}! 👑✨\n\nTienes *11 de 12 sellos* en tu tarjeta.\n\nEn tu próxima visita completas todo el camino y tu premio grande es todo tuyo 🎁\n\n📲 *Mira tu tarjeta a punto de brillar:* {link_tarjeta}',
    es_premio: false,
  },
  {
    sello: 12,
    nombre_hito: 'Sello 12 👑 META 3 FINAL: Tarjeta Dorada Coronada',
    imagen_url: 'https://cfggpqpbqqeavdbdzwoz.supabase.co/storage/v1/object/public/nilah_assets/club-glow-prizes/premio_hito_12.jpg',
    titulo_notificacion: '🏆 ¡TARJETA 100% COMPLETADA!',
    copy_sugerido: '¡Completaste el camino, {nombre}! 🏆\n\nLlegaste al *sello 12 de 12* y ganaste tu:\n🎁 *Servicio Completo Estrella Totalmente Gratis*\n\nMuéstrale este mensaje a recepción y dile tu código: `{codigo}`\n\nTu nueva tarjeta ya empezó con *2 sellos de regalo* ✨\n\n📲 *Ver tu tarjeta:* {link_tarjeta}',
    es_premio: true,
  },
];

const LOCAL_STORAGE_KEY = 'korat_club_glow_tarjetas_globales_v1';

/**
 * Obtiene la configuración de las 12 tarjetas globales
 * Intenta leer desde nilah_config (JSONB) o localStorage como fallback resiliente
 */
export async function fetchTarjetasClubGlowGlobales(): Promise<TarjetaSelloConfig[]> {
  try {
    const { data, error } = await supabase
      .from('nilah_config')
      .select('tarjetas_club_glow')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!error && data?.tarjetas_club_glow && Array.isArray(data.tarjetas_club_glow) && data.tarjetas_club_glow.length === 12) {
      return data.tarjetas_club_glow as TarjetaSelloConfig[];
    }
  } catch (err) {
    console.warn('nilah_config.tarjetas_club_glow not accessible, fallback to storage:', err);
  }

  // Fallback local
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length === 12) return parsed;
    }
  } catch (e) {
    /* ignore */
  }

  return CONFIG_SELLOS_DEFAULT;
}

/**
 * Guarda las 12 tarjetas en nilah_config y en localStorage
 */
export async function saveTarjetasClubGlowGlobales(tarjetas: TarjetaSelloConfig[]): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Guardar en localStorage para disponibilidad offline instantánea
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(tarjetas));

    // 2. Intentar guardar en nilah_config en Supabase
    const { error } = await supabase
      .from('nilah_config')
      .update({
        tarjetas_club_glow: tarjetas,
        updated_at: new Date().toISOString(),
      })
      .gte('id', 1);

    if (error) {
      console.warn('Error saving to nilah_config, saved to localStorage fallback:', error.message);
      // Retornar éxito true porque el localStorage y la sesión actual quedaron actualizados
      return { success: true, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sube una imagen individual (1 a 12) a Supabase Storage con compresión
 * y recorte/centrado inteligente a proporción 4:3 (HD ligera para WhatsApp)
 */
export async function uploadTarjetaSelloImage(
  sello: number,
  file: File
): Promise<{ success: boolean; publicUrl?: string; error?: string; sizeKb?: number }> {
  try {
    // 1. Optimización en el cliente: formato 4:3, ancho máx 960px, JPEG ligero (< 120KB)
    let fileToUpload: File = file;
    let dataUrlFallback: string = '';

    try {
      const optimized = await optimizeImageClient(file, {
        aspectRatio: '4:3',
        maxWidth: 960,
        quality: 0.85,
        format: 'jpeg',
      });
      fileToUpload = optimized.file;
      dataUrlFallback = optimized.dataUrl;
    } catch (optErr) {
      console.warn('Advertencia optimizando imagen 4:3, usando archivo original:', optErr);
    }

    const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
    const filePath = `club-glow-cards/tarjeta_sello_${sello}_${Date.now()}.${fileExt}`;
    const calculatedSizeKb = Math.round(fileToUpload.size / 1024);

    // Intentar subir a 'nilah_assets'
    let uploadResult = await supabase.storage.from('nilah_assets').upload(filePath, fileToUpload, {
      upsert: true,
      contentType: 'image/jpeg',
    });
    let bucket = 'nilah_assets';

    if (uploadResult.error) {
      // Fallback a 'brand_assets'
      uploadResult = await supabase.storage.from('brand_assets').upload(filePath, fileToUpload, {
        upsert: true,
        contentType: 'image/jpeg',
      });
      bucket = 'brand_assets';
    }

    if (uploadResult.error) {
      // Si falla storage por permisos de bucket, usamos la DataURL optimizada ultraligera
      if (dataUrlFallback) {
        return { success: true, publicUrl: dataUrlFallback, sizeKb: calculatedSizeKb };
      }
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(fileToUpload);
      });
      return { success: true, publicUrl: dataUrl, sizeKb: calculatedSizeKb };
    }

    const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { success: true, publicUrl: publicData.publicUrl, sizeKb: calculatedSizeKb };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Limpia y humaniza el nombre de la clienta para WhatsApp:
 * - Elimina emojis y símbolos raros (ej: '🌷🌷 Mk 🌷🌷' -> descartado)
 * - Valida longitud mínima (>= 3 letras) y presencia de vocales
 * - Descarta nombres basura ('Cliente', 'Usuario', 'S/N')
 * - Si no es un nombre real y pronunciable, devuelve 'bella'
 * - Si es válido, devuelve el primer nombre capitalizado ('Camila')
 */
export function formatearNombreClienta(nombreRaw?: string | null): string {
  if (!nombreRaw) return 'bella';

  // 1. Quitar emojis, números y símbolos especiales dejando solo letras
  const soloLetras = nombreRaw
    .replace(/[^\p{L}\s]/gu, '')
    .trim();

  // 2. Extraer primera palabra
  const primeraPalabra = soloLetras.split(/\s+/)[0] || '';

  // 3. Reglas de descarte
  const tieneVocales = /[aeiouáéíóúü]/i.test(primeraPalabra);
  const esGenerico = /^(cliente|usuario|user|clienta|null|undefined|admin|salon|prueba)$/i.test(primeraPalabra);

  if (primeraPalabra.length < 3 || !tieneVocales || esGenerico) {
    return 'bella';
  }

  // 4. Formatear Capitalizado: "cAmILa" -> "Camila"
  return primeraPalabra.charAt(0).toUpperCase() + primeraPalabra.slice(1).toLowerCase();
}

/**
 * Helper para Evolution API / WhatsApp n8n:
 * Devuelve la URL de imagen y el copy según el número de sellos que tiene la clienta
 */
export function resolverImagenYTextoParaSello(
  sellosCount: number,
  catalogoTarjetas: TarjetaSelloConfig[],
  variables: { nombre: string; salon: string; link_tarjeta?: string }
): { imagen_url: string; copy_final: string; es_premio: boolean; hito: string } {
  // Extraer nombre formateado inteligente (si es raro como '🌷🌷 Mk 🌷🌷' -> 'bella')
  const primerNombre = formatearNombreClienta(variables.nombre);

  // Si la clienta empieza en el club (tenía 0 sellos al iniciar la visita o es nueva clienta)
  // Regla de Negocio: Se le regala 1 sello de bienvenida por unirse + 1 sello por la cita de hoy = ya lleva 2 de 12
  if (sellosCount === 0 || sellosCount === 1) {
    let copyZero = `¡Bienvenida al Club {salon}, {nombre}! 🎁\n\nTe regalamos 1 sello por unirte y hoy sumaste otro: ya llevas *2 de 12*.\n\nTe faltan *2 sellos* para tu primer regalo: *Spa Cutículas & Hidratación Express*.\n\n📲 *Mira tu tarjeta:* {link_tarjeta}`;

    copyZero = copyZero
      .replace(/{nombre}/g, primerNombre)
      .replace(/{salon}/g, variables.salon);

    if (variables.link_tarjeta) {
      copyZero = copyZero.replace(/{link_tarjeta}/g, variables.link_tarjeta);
    }

    return {
      imagen_url: '',
      copy_final: copyZero,
      es_premio: false,
      hito: 'Bienvenida (1 Sello Regalo + 1 Visita = 2 de 12)'
    };
  }

  const selloClamped = Math.min(Math.max(sellosCount, 1), 12);
  const config = catalogoTarjetas.find((c) => c.sello === selloClamped) || CONFIG_SELLOS_DEFAULT[selloClamped - 1];

  let copy = config.copy_sugerido
    .replace(/{nombre}/g, primerNombre)
    .replace(/{salon}/g, variables.salon)
    .replace(/{sello_actual}/g, String(selloClamped));

  if (variables.link_tarjeta) {
    if (copy.includes('{link_tarjeta}')) {
      copy = copy.replace(/{link_tarjeta}/g, variables.link_tarjeta);
    } else if (!copy.includes('https://') && !copy.includes(variables.link_tarjeta)) {
      copy += `\n\n📲 *Ver tu tarjeta digital en vivo:* ${variables.link_tarjeta}`;
    }
  }

  return {
    imagen_url: config.imagen_url,
    copy_final: copy,
    es_premio: config.es_premio,
    hito: config.nombre_hito,
  };
}
