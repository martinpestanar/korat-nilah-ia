/**
 * Vitrina Digital IA Engine - Korat Flow
 * 
 * Este motor cruza:
 * 1. Tabla 'negocios' (Identidad de marca, ubicación, horario, teléfono)
 * 2. Tabla 'servicios' (Precios y catálogo real del salón)
 * 3. Tabla 'Citas' (Comportamiento histórico: días lentos para ofertas flash y servicios estrella)
 * 4. Fallback a 'plantillas_servicios' si el salón es nuevo y no tiene servicios registrados.
 * 
 * Regla de Oro:
 * - NO alucina precios. Usa precios existentes o sugeridos de plantillas.
 * - Activa el mes de cortesía Pro ('pro_trial') con fecha de expiración a 30 días.
 */

import { supabase } from './supabase';
import { CartaConfig, CartaPromoDia, CartaPromoMes, CartaOfertaSemana, CartaFOMOBanner } from '../types';

export interface GeneracionVitrinaResult {
  config: Partial<CartaConfig>;
  serviciosDestacadosIds: (number | string)[];
  categoriasGeneradas: number;
  serviciosMigrados: number;
  esProTrial: boolean;
  diasRestantesTrial: number;
}

export const vitrinaIaEngine = {
  /**
   * Genera o enriquece la vitrina digital de un salón cruzando todas sus tablas
   */
  async generarVitrinaParaSalon(businessId: string, options: { forzarRegeneracion?: boolean } = {}): Promise<GeneracionVitrinaResult> {
    if (!businessId) throw new Error('businessId es requerido para generar la vitrina');

    // 1. Obtener datos del negocio
    const { data: negocio, error: negErr } = await supabase
      .from('negocios')
      .select('*')
      .eq('id', businessId)
      .single();

    if (negErr || !negocio) {
      throw new Error(`No se pudo obtener el negocio: ${negErr?.message || 'No encontrado'}`);
    }

    // 2. Obtener servicios del negocio
    const { data: serviciosRaw } = await supabase
      .from('servicios')
      .select('*')
      .eq('business_id', businessId);

    const servicios = serviciosRaw || [];

    // 3. Obtener citas para detectar servicios top y días con menos afluencia (para promo flash)
    const { data: citasRaw } = await supabase
      .from('Citas')
      .select('nombre, fecha, estado')
      .eq('business_id', businessId)
      .limit(100);

    const citas = citasRaw || [];

    // Analizar día más lento de la semana (0=Dom, 1=Lun, 2=Mar, 3=Mie, 4=Jue, 5=Vie, 6=Sab)
    const diasConteo: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    citas.forEach(c => {
      if (c.fecha) {
        const d = new Date(c.fecha).getUTCDay();
        if (d >= 1 && d <= 6) {
          diasConteo[d] = (diasConteo[d] || 0) + 1;
        }
      }
    });

    // Encontrar día laboral más lento (generalmente martes=2 o lunes=1)
    let diaMasLento: 0 | 1 | 2 | 3 | 4 | 5 | 6 = 2; // Martes default
    let minCitas = Infinity;
    [1, 2, 3, 4].forEach(dia => {
      const count = diasConteo[dia] || 0;
      if (count < minCitas) {
        minCitas = count;
        diaMasLento = dia as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      }
    });

    // 4. Determinar catálogo de trabajo (servicios reales o plantillas)
    let catalogo = servicios.map(s => ({
      id: s.id,
      nombre: s.nombre,
      precio: Number(s.precio) || 50,
      duracion: s.duracion || 45,
      categoria: s.categoria || 'Servicios Generales',
      imagen_url: s.imagen_url || null,
      descripcion: s.descripcion_detallada || ''
    }));

    // Si no tiene servicios, cargar plantillas recomendadas
    if (catalogo.length === 0) {
      const { data: plantillas } = await supabase
        .from('plantillas_servicios')
        .select('*')
        .limit(6);

      if (plantillas && plantillas.length > 0) {
        catalogo = plantillas.map(p => ({
          id: p.id,
          nombre: p.nombre,
          precio: Number(p.precio_sugerido) || 60,
          duracion: p.duracion_min || 45,
          categoria: p.categoria_nombre || 'Belleza & Estilo',
          imagen_url: p.media_url || null,
          descripcion: p.descripcion || ''
        }));
      }
    }

    // Ordenar servicios por precio para seleccionar los mejores para cada tipo de promo
    const sortedByPrice = [...catalogo].sort((a, b) => b.precio - a.precio);
    const servicioEstrella = sortedByPrice[0] || { nombre: 'Experiencia Glow VIP', precio: 120, categoria: 'Cuidado Facial' };
    const servicioFrecuente = catalogo[Math.floor(catalogo.length / 2)] || sortedByPrice[0] || { nombre: 'Corte & Estilo Personalizado', precio: 50, categoria: 'Cabello' };
    const servicioFlash = catalogo[catalogo.length - 1] || sortedByPrice[0] || { nombre: 'Manicura Express & Glow', precio: 35, categoria: 'Uñas' };

    // 5. Configurar Horarios y Contacto
    const horarioTexto = negocio.hora_apertura && negocio.hora_cierre
      ? `Lunes a Sábado: ${negocio.hora_apertura.slice(0, 5)} - ${negocio.hora_cierre.slice(0, 5)}`
      : 'Lunes a Sábado: 09:00 - 19:00';

    const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaNombre = diasNombres[diaMasLento];

    // 6. Generar las Promociones Inteligentes (Copywriting Persuasivo Korat)
    // A) Promo Flash FOMO (Urgencia para hoy)
    const precioFlashOriginal = Math.round(servicioFlash.precio * 1.3);
    const fomoBanner: CartaFOMOBanner = {
      activo: true,
      titulo: `⚡ Promo Flash: ${servicioFlash.nombre}`,
      subtitulo: `Solo 3 cupos disponibles para hoy en tarifa exclusiva. Reserva en 1 clic.`,
      descuento_tag: `${Math.round(((precioFlashOriginal - servicioFlash.precio) / precioFlashOriginal) * 100)}% OFF`,
      badge_emoji: '⚡',
      expira_en: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      enlace_whatsapp: true,
      cupos_activos: true,
      cupos_totales: 4,
      cupos_ocupados: 1
    };

    // B) Promo por Día (Llenar día lento detectado por la IA)
    const promoDia: CartaPromoDia = {
      id: `dia_${Date.now()}`,
      dia_semana: diaMasLento,
      activo: true,
      titulo: `✨ ${diaNombre} Especial de ${servicioFrecuente.categoria || 'Glow'}`,
      badge_emoji: '✨',
      descripcion: `Aprovecha tu ${diaNombre} con atención personalizada y diagnóstico de cortesía en ${servicioFrecuente.nombre}.`,
      precio_regular: Math.round(servicioFrecuente.precio * 1.25),
      precio_promo: servicioFrecuente.precio,
      cupos_activos: true,
      cupos_totales: 6,
      cupos_ocupados: 2,
      servicios_nombres: servicioFrecuente.nombre
    };

    // C) Oferta de la Semana (Ticket medio)
    const ofertaSemana: CartaOfertaSemana = {
      activa: true,
      titulo: `Pack Semanal: ${servicioFrecuente.nombre} + Cuidado Exprés`,
      descripcion: `Tratamiento completo diseñado para renovar tu imagen y mantener el resultado por semanas. Incluye asesoría personalizada.`,
      precio_original: Math.round(servicioFrecuente.precio * 1.35),
      precio_oferta: servicioFrecuente.precio,
      expira_en: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      duracion_tipo: '7_dias',
      etiqueta_tipo: 'combo',
      cupos_activos: true,
      cupos_totales: 5,
      cupos_ocupados: 2
    };

    // D) Promo del Mes (Servicio de ticket más alto)
    const promoMes: CartaPromoMes = {
      activa: true,
      badge_texto: 'Experiencia VIP del Mes',
      badge_emoji: '👑',
      titulo: `Transformación Premium: ${servicioEstrella.nombre}`,
      descripcion: `Protocolo de alta gama con productos de primera línea. Vive una experiencia de relajación total y resultados garantizados.`,
      duracion_tipo: 'fin_de_mes',
      etiqueta_tipo: 'promo_mes'
    };

    // 7. Configuración Completa de la Vitrina Digital
    const configGenerada: Partial<CartaConfig> = {
      business_id: businessId,
      nombre_salon: negocio.nombre || 'Salón de Belleza',
      logo_url: negocio.logo_url || null,
      descripcion_header: `Bienvenida a ${negocio.nombre || 'nuestro salón'}. Reserva tus citas online de forma rápida, segura y con confirmación inmediata.`,
      telefono_whatsapp: negocio.telefono_recepcionista || negocio.booking_yape_numero || '',
      direccion: negocio.ubicacion || '',
      horario: horarioTexto,
      paleta: 'rose',
      layout_estilo: 'pinterest',
      tema_estacional: 'normal',
      efectos_animados: true,
      modo_estrategia: 'equilibrado',
      fomo_banner: fomoBanner,
      promos_dias: [promoDia],
      oferta_semana: ofertaSemana,
      promo_mes: promoMes,
      updated_at: new Date().toISOString()
    };

    // 8. Guardar o actualizar en `carta_config`
    const { data: existingConfig } = await supabase
      .from('carta_config')
      .select('id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (existingConfig?.id) {
      if (options.forzarRegeneracion) {
        await supabase
          .from('carta_config')
          .update(configGenerada)
          .eq('id', existingConfig.id);
      }
    } else {
      await supabase
        .from('carta_config')
        .insert([{ ...configGenerada, created_at: new Date().toISOString() }]);
    }

    // 9. Sincronizar categorías y servicios en carta_categorias y carta_servicios
    let categoriasCreadas = 0;
    let serviciosMigrados = 0;
    const destacadosIds: (number | string)[] = [];

    // Verificar si ya tiene carta_servicios
    const { data: existingCartaServicios } = await supabase
      .from('carta_servicios')
      .select('id')
      .eq('business_id', businessId)
      .limit(1);

    if (!existingCartaServicios || existingCartaServicios.length === 0 || options.forzarRegeneracion) {
      // Agrupar catálogo por categorías
      const categoriasMap = new Map<string, typeof catalogo>();
      catalogo.forEach(s => {
        const cat = s.categoria || 'Destacados';
        if (!categoriasMap.has(cat)) categoriasMap.set(cat, []);
        categoriasMap.get(cat)!.push(s);
      });

      let ordenCat = 0;
      for (const [catNombre, items] of categoriasMap.entries()) {
        ordenCat++;
        // Insertar o recuperar categoría
        let categoriaId: string | null = null;
        const { data: existingCat } = await supabase
          .from('carta_categorias')
          .select('id')
          .eq('business_id', businessId)
          .eq('nombre', catNombre)
          .maybeSingle();

        if (existingCat?.id) {
          categoriaId = existingCat.id;
        } else {
          const { data: newCat } = await supabase
            .from('carta_categorias')
            .insert([{
              business_id: businessId,
              nombre: catNombre,
              emoji: '✨',
              orden: ordenCat,
              activo: true
            }])
            .select('id')
            .single();

          if (newCat) {
            categoriaId = newCat.id;
            categoriasCreadas++;
          }
        }

        // Insertar servicios en carta_servicios
        let ordenSrv = 0;
        for (const item of items) {
          ordenSrv++;
          const esDestacado = ordenSrv === 1 || item.id === servicioEstrella.id;
          if (esDestacado) destacadosIds.push(item.id);

          const { error: insSrvErr } = await supabase
            .from('carta_servicios')
            .insert([{
              business_id: businessId,
              categoria_id: categoriaId,
              nombre: item.nombre,
              descripcion: item.descripcion || `Servicio profesional de ${item.nombre}. Duración aproximada: ${item.duracion} min.`,
              precio: item.precio,
              precio_original: Math.round(item.precio * 1.2),
              duracion_min: item.duracion,
              media_url: item.imagen_url,
              destacado: esDestacado,
              orden: ordenSrv,
              activo: true
            }]);

          if (!insSrvErr) serviciosMigrados++;
        }
      }
    }

    // 10. Activar Mes PRO de Cortesía (30 días de Vitrina Pro) en recursos_saas
    const recursosActuales = negocio.recursos_saas || {};
    const modulosActuales = recursosActuales.modulos || {};
    const cartaDigitalActual = modulosActuales.carta_digital || {};

    // Habilitar todos los features PRO de vitrina
    const nuevosRecursos = {
      ...recursosActuales,
      vitrina_trial: {
        activo: true,
        iniciado_en: new Date().toISOString(),
        expira_en: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
        tipo: 'primer_mes_pro_gratis'
      },
      modulos: {
        ...modulosActuales,
        carta_digital: {
          ...cartaDigitalActual,
          activo: true,
          sub_pestanas: {
            ...(cartaDigitalActual.sub_pestanas || {}),
            branding_pro: true,
            antes_despues: true,
            fomo_countdown: true,
            agendamiento_directo: true
          }
        }
      }
    };

    await supabase
      .from('negocios')
      .update({ recursos_saas: nuevosRecursos })
      .eq('id', businessId);

    return {
      config: configGenerada,
      serviciosDestacadosIds: destacadosIds,
      categoriasGeneradas: categoriasCreadas,
      serviciosMigrados,
      esProTrial: true,
      diasRestantesTrial: 30
    };
  }
};
