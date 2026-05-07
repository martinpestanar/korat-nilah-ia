export interface StandardService {
  nombre: string;
  subcategoria: string;
  tagsDefault: string;
}

// Servicios ordenados de más a menos popular dentro de cada categoría.
// Cubre el 90%+ del catálogo estándar en salones de belleza especializados.
export const SERVICIOS_PREDEFINIDOS: Record<string, StandardService[]> = {

  // ─── MANOS Y UÑAS (Especializado) ─────────────────────────────────────────
  Manos: [
    // Sistemas Modernos (Más pedidos)
    { nombre: 'Esmaltado Semipermanente', subcategoria: 'Esmaltado', tagsDefault: 'gel, color, semi, permanente, esmalte gel' },
    { nombre: 'Kapping / Baño de Acrílico', subcategoria: 'Sistemas', tagsDefault: 'kapping, recubrimiento, baño de gel, enchape, protección' },
    { nombre: 'Sistema Rubber Base', subcategoria: 'Sistemas', tagsDefault: 'rubber, base caucho, nivelación, refuerzo, uña natural' },
    { nombre: 'Sistema Soft Gel', subcategoria: 'Sistemas', tagsDefault: 'soft gel, gel suave, extensión rápida, tips gel' },
    { nombre: 'Sistema Polygel', subcategoria: 'Sistemas', tagsDefault: 'polygel, acrygel, extensión poligel, acrigel' },
    { nombre: 'Sistema Acrílico', subcategoria: 'Sistemas', tagsDefault: 'acrílico, esculpidas, polvo, monómero, extensión acrílica' },
    { nombre: 'Sistema Builder Gel (BIAB)', subcategoria: 'Sistemas', tagsDefault: 'builder, biab, construcción gel, gel duro, esculpida gel' },
    { nombre: 'Baño en Gel / Capping Gel', subcategoria: 'Sistemas', tagsDefault: 'capping gel, baño gel, protección gel' },
    { nombre: 'Uñas Esculpidas (Molde)', subcategoria: 'Sistemas', tagsDefault: 'esculpidas, molde papel, uñas largas' },

    // Nail Art & Diseños
    { nombre: 'Nail Art Básico (Puntos, Líneas)', subcategoria: 'Nail Art', tagsDefault: 'nail art, líneas, minimalista' },
    { nombre: 'Nail Art Avanzado (Mano Alzada)', subcategoria: 'Nail Art', tagsDefault: 'dibujo, mano alzada, diseño complejo' },
    { nombre: 'Encapsulado / 3D', subcategoria: 'Nail Art', tagsDefault: 'encapsulado, flores 3d, relieve' },
    { nombre: 'Efecto Espejo / Chrome', subcategoria: 'Nail Art', tagsDefault: 'chrome, espejo, polvo cromado, metálico' },
    { nombre: 'Efecto Magnético / Cat Eye', subcategoria: 'Nail Art', tagsDefault: 'ojo de gato, magnético, cat eye, aurora' },
    { nombre: 'Stamping / Stickers', subcategoria: 'Nail Art', tagsDefault: 'sellos, estampado, decals' },
    { nombre: 'Baby Boomer / Ombré', subcategoria: 'Nail Art', tagsDefault: 'baby boomer, francés difuminado, fade' },

    // Retiros y Mantenimientos
    { nombre: 'Mantenimiento / Retoque (Sistemas)', subcategoria: 'Mantenimiento', tagsDefault: 'retoque, relleno, service, mantto' },
    { nombre: 'Retiro Definitivo + Limpieza', subcategoria: 'Retiro', tagsDefault: 'retiro acrílico, retiro gel, remover sistema' },
    { nombre: 'Retiro + Nuevo Sistema', subcategoria: 'Retiro', tagsDefault: 'retiro y colocación, cambio de sistema' },
    { nombre: 'Reparación de Uña', subcategoria: 'Mantenimiento', tagsDefault: 'arreglo uña, fix, uña rota' },

    // Manicura Tradicional y Spa
    { nombre: 'Manicura Rusa / Combinada', subcategoria: 'Manicura Premium', tagsDefault: 'torno, seca, cutícula perfecta, hardware' },
    { nombre: 'Manicura Spa', subcategoria: 'Manicura Premium', tagsDefault: 'spa manos, masaje, exfoliación' },
    { nombre: 'Manicura Clásica', subcategoria: 'Manicura Clásica', tagsDefault: 'tradicional, limpieza, esmalte común' },
    { nombre: 'Manicura Express', subcategoria: 'Manicura Clásica', tagsDefault: 'rápida, solo limar y pintar' },
    { nombre: 'Tratamiento Endurecedor / IBX', subcategoria: 'Tratamiento', tagsDefault: 'ibx, fortalecedor, uñas débiles' },
    { nombre: 'Parafina Manos', subcategoria: 'Tratamiento', tagsDefault: 'parafina, cera tibia, hidratación intensa' },

    // Novedades
    { nombre: 'Postizas / Press On (Custom)', subcategoria: 'Press On', tagsDefault: 'press on, uñas postizas, medida' },
  ],

  // ─── PIES ─────────────────────────────────────────────────────────────────
  Pies: [
    { nombre: 'Pedicura Spa Completa', subcategoria: 'Pedicura Spa', tagsDefault: 'spa pies, pedicure completo, masaje, mascarilla' },
    { nombre: 'Esmaltado Semipermanente Pies', subcategoria: 'Esmaltado', tagsDefault: 'gel pies, semipermanente pies, color gel pies' },
    { nombre: 'Pedicura Clásica + Esmaltado', subcategoria: 'Pedicura Clásica', tagsDefault: 'pedicure clásico, esmalte, limpieza pies' },
    { nombre: 'Pedicura Rusa', subcategoria: 'Pedicura Premium', tagsDefault: 'torno pies, pedicure eléctrica, e-file pies' },
    { nombre: 'Pedicura Medicinal', subcategoria: 'Pedicura Medicinal', tagsDefault: 'callicida, callos, durezas, hongos, podología' },
    { nombre: 'Retiro de Semipermanente Pies', subcategoria: 'Retiro', tagsDefault: 'remover gel pies, sacar semipermanente' },
    { nombre: 'Tratamiento Callicida + Exfoliación', subcategoria: 'Tratamiento', tagsDefault: 'callicida, lijar, suavizar, exfoliar pies' },
    { nombre: 'Parafina de Pies', subcategoria: 'Tratamiento', tagsDefault: 'parafina pies, cera pies, hidratación talones' },
    { nombre: 'Nail Art Pies', subcategoria: 'Nail Art', tagsDefault: 'diseño pies, arte pies, decoración pies' },
    { nombre: 'Sistemas en Pies', subcategoria: 'Sistemas', tagsDefault: 'acrílico pies, gel pies, poligel pies' },
  ],

  // ─── PESTAÑAS ─────────────────────────────────────────────────────────────
  Pestañas: [
    { nombre: 'Extensiones Clásicas (1x1)', subcategoria: 'Extensiones', tagsDefault: 'pelo a pelo, naturales, clásicas, 1 a 1' },
    { nombre: 'Extensiones Hybridass', subcategoria: 'Extensiones', tagsDefault: 'híbridas, wispy, sirena, mixtas' },
    { nombre: 'Volumen Ruso', subcategoria: 'Extensiones', tagsDefault: 'volumen, ruso, 2d, 3d, russian volume' },
    { nombre: 'Megavolumen', subcategoria: 'Extensiones', tagsDefault: 'megavolumen, mega volume, 4d, 5d, 6d' },
    { nombre: 'Volumen Ligero', subcategoria: 'Extensiones', tagsDefault: 'volumen suave, kim k, light volume' },
    { nombre: 'Freestyle / Wispy', subcategoria: 'Extensiones', tagsDefault: 'freestyle, fluffy, wispy, cat eye lashes' },
    { nombre: 'Mantenimiento de Extensiones', subcategoria: 'Retoque', tagsDefault: 'relleno, retoque, service, refill' },
    { nombre: 'Retiro de Extensiones', subcategoria: 'Retiro', tagsDefault: 'sacar pestañas, remover, retirar extensiones' },
    { nombre: 'Lifting de Pestañas', subcategoria: 'Lifting', tagsDefault: 'lash lift, rizado, lifting, curvado permanente' },
    { nombre: 'Laminado de Pestañas', subcategoria: 'Lifting', tagsDefault: 'laminado, planchado, lifting + laminado' },
    { nombre: 'Tinte de Pestañas', subcategoria: 'Tinte', tagsDefault: 'tinte, coloración, tintura pestañas, keratina pestañas' },
    { nombre: 'Lifting + Tinte', subcategoria: 'Lifting', tagsDefault: 'lifting completo, lash lift con tinte, paquete lifting' },
  ],

  // ─── CEJAS ────────────────────────────────────────────────────────────────
  Cejas: [
    { nombre: 'Diseño y Depilación de Cejas', subcategoria: 'Diseño', tagsDefault: 'cejas, hilo, cera, pinza, perfilado, forma' },
    { nombre: 'Laminado de Cejas', subcategoria: 'Laminado', tagsDefault: 'brow lamination, laminado, peinado de cejas' },
    { nombre: 'Henna de Cejas', subcategoria: 'Tinte', tagsDefault: 'henna, tinte, cejas tintadas, pigmento natural' },
    { nombre: 'Tinte de Cejas', subcategoria: 'Tinte', tagsDefault: 'tinte cejas, coloración cejas, tintura' },
    { nombre: 'Laminado + Diseño', subcategoria: 'Laminado', tagsDefault: 'laminado completo, paquete cejas, combo cejas' },
    { nombre: 'Microblading', subcategoria: 'Micropigmentación', tagsDefault: 'microblading, pelo a pelo, tatuaje cejas, semipermanente' },
    { nombre: 'Micropigmentación Shading / Ombre', subcategoria: 'Micropigmentación', tagsDefault: 'shading, ombre cejas, efecto polvo, sombra' },
    { nombre: 'Micropigmentación Combinada', subcategoria: 'Micropigmentación', tagsDefault: 'combinada, pelo a pelo + sombra, hybrid brows' },
    { nombre: 'Retoque de Micropigmentación', subcategoria: 'Micropigmentación', tagsDefault: 'retoque microblading, touch up, mantenimiento tatuaje' },
    { nombre: 'Cejas Arquitectónicas', subcategoria: 'Diseño', tagsDefault: 'arquitectura cejas, mapeo, marcado profesional' },
  ],

  // ─── CABELLO ──────────────────────────────────────────────────────────────
  Cabello: [
    { nombre: 'Tinte Completo (Coloración)', subcategoria: 'Colorimetría', tagsDefault: 'color, tinte, canas, retoque raíz, coloración' },
    { nombre: 'Retoque de Raíz', subcategoria: 'Colorimetría', tagsDefault: 'retoque, raíz, canas, growth' },
    { nombre: 'Balayage', subcategoria: 'Colorimetría', tagsDefault: 'balayage, degradado, californiano, mechas naturales' },
    { nombre: 'Mechas / Iluminaciones', subcategoria: 'Colorimetría', tagsDefault: 'mechas, iluminaciones, highlights, lowlights' },
    { nombre: 'Decoloración', subcategoria: 'Colorimetría', tagsDefault: 'decolorar, platinado, rubio, blanquear' },
    { nombre: 'Corrección de Color', subcategoria: 'Colorimetría', tagsDefault: 'corrección, matizador, color fix, neutralizar' },
    { nombre: 'Matizado / Toner', subcategoria: 'Colorimetría', tagsDefault: 'matiz, toner, violeta, azul, matizar' },
    { nombre: 'Corte de Mujer', subcategoria: 'Corte', tagsDefault: 'corte, puntas, capas, flequillo, bob, midi' },
    { nombre: 'Corte Estructurado', subcategoria: 'Corte', tagsDefault: 'corte exacto, degradado, undercut, desfilado' },
    { nombre: 'Keratina Brasileña', subcategoria: 'Alisado', tagsDefault: 'keratina, alisado, anti-frizz, lacio, queratina' },
    { nombre: 'Nanoplastia', subcategoria: 'Alisado', tagsDefault: 'nanoplastia, nano, alisado orgánico, sin formol' },
    { nombre: 'Alisado Permanente', subcategoria: 'Alisado', tagsDefault: 'alisado permanente, japonés, relax, lacio permanente' },
    { nombre: 'Botox Capilar', subcategoria: 'Tratamiento', tagsDefault: 'botox capilar, filler, hidratación profunda, nutrición' },
    { nombre: 'Hidratación Profunda', subcategoria: 'Tratamiento', tagsDefault: 'hidratación, mascarilla, nutrición, tratamiento' },
    { nombre: 'Reconstrucción Capilar', subcategoria: 'Tratamiento', tagsDefault: 'reconstrucción, proteína, queratina, reparo' },
    { nombre: 'Ondas con Plancha / Ruleros', subcategoria: 'Peinado', tagsDefault: 'ondas, rulos, beach waves, styling' },
    { nombre: 'Peinado de Fiesta / Recogido', subcategoria: 'Peinado', tagsDefault: 'recogido, novia, fiesta, gala, updo' },
    { nombre: 'Blow Dry / Brushing', subcategoria: 'Peinado', tagsDefault: 'planchado, brushing, secado con forma, blow out' },
    { nombre: 'Extensiones de Cabello', subcategoria: 'Extensiones', tagsDefault: 'extensiones, largo, volumen, cabello natural' },
    { nombre: 'Permanente / Rizado', subcategoria: 'Rizado', tagsDefault: 'permanente, rizado, rizos, curly, espiral' },
  ],

  // ─── ROSTRO ───────────────────────────────────────────────────────────────
  Rostro: [
    { nombre: 'Limpieza Facial Profunda', subcategoria: 'Limpieza Facial', tagsDefault: 'limpieza, puntos negros, extraction, acné, poros' },
    { nombre: 'Limpieza Facial Básica', subcategoria: 'Limpieza Facial', tagsDefault: 'limpieza suave, facial básico, hidratación' },
    { nombre: 'Hidratación Facial', subcategoria: 'Hidratación', tagsDefault: 'hidratación, mascarilla, sérum, nutrición facial' },
    { nombre: 'Peeling Químico', subcategoria: 'Tratamiento', tagsDefault: 'peeling, AHA, BHA, exfoliación química, ácidos' },
    { nombre: 'Dermaplaning', subcategoria: 'Tratamiento', tagsDefault: 'dermaplaning, bisturí, exfoliación, vello, peach fuzz' },
    { nombre: 'Tratamiento Anti-acné', subcategoria: 'Tratamiento', tagsDefault: 'acné, piel grasa, antibacterial, seborrea' },
    { nombre: 'Tratamiento Antiedad', subcategoria: 'Tratamiento', tagsDefault: 'antiedad, lifting facial, arrugas, flacidez' },
    { nombre: 'Radiofrecuencia Facial', subcategoria: 'Estética Avanzada', tagsDefault: 'radiofrecuencia, tensado, rejuvenecimiento, RF' },
    { nombre: 'Microdermabrasión', subcategoria: 'Estética Avanzada', tagsDefault: 'microdermabrasión, cristales, punta diamante, exfoliación' },
    { nombre: 'LED Terapia Facial', subcategoria: 'Estética Avanzada', tagsDefault: 'LED, fototerapia, luz azul, luz roja, colágeno' },
    { nombre: 'Masaje Facial / Kobido', subcategoria: 'Masaje Facial', tagsDefault: 'masaje facial, kobido, lifting manual, drenaje' },
    { nombre: 'Depilación Facial (Bozo / Mentón)', subcategoria: 'Depilación Facial', tagsDefault: 'bozo, cera facial, hilo, mentón, depilación cara' },
    { nombre: 'Maquillaje Social', subcategoria: 'Maquillaje', tagsDefault: 'maquillaje, evento, fiesta, noche, social' },
    { nombre: 'Maquillaje de Novia', subcategoria: 'Maquillaje', tagsDefault: 'novia, bridal, wedding, maquillaje boda' },
    { nombre: 'Maquillaje Airbrush', subcategoria: 'Maquillaje', tagsDefault: 'airbrush, aerógrafo, alta cobertura, fotogénico' },
    { nombre: 'Micropigmentación Facial', subcategoria: 'Micropigmentación', tagsDefault: 'micropigmentación labios, semipermanente facial' },
  ],

  // ─── MASAJES / CUERPO ─────────────────────────────────────────────────────
  Masajes: [
    { nombre: 'Masaje Relajante (1 hora)', subcategoria: 'Masajes Terapéuticos', tagsDefault: 'relajante, spa, antiestres, cuerpo completo' },
    { nombre: 'Masaje Relajante (30 min)', subcategoria: 'Masajes Terapéuticos', tagsDefault: 'relajante express, espalda, cuello' },
    { nombre: 'Masaje Descontracturante', subcategoria: 'Masajes Terapéuticos', tagsDefault: 'descontracturante, tensión, nudos, contractura' },
    { nombre: 'Masaje Deportivo', subcategoria: 'Masajes Terapéuticos', tagsDefault: 'deportivo, muscular, recuperación, rendimiento' },
    { nombre: 'Masaje Reductivo / Moldeador', subcategoria: 'Masajes Estéticos', tagsDefault: 'reductivo, moldeador, celulitis, anticelulitis' },
    { nombre: 'Maderoterapia', subcategoria: 'Masajes Estéticos', tagsDefault: 'maderoterapia, madera, rollos, moldear, guatero' },
    { nombre: 'Drenaje Linfático', subcategoria: 'Masajes Estéticos', tagsDefault: 'drenaje, linfático, retención, inflamación' },
    { nombre: 'Masaje con Piedras Calientes', subcategoria: 'Masajes Especiales', tagsDefault: 'piedras calientes, basalto, hot stones, termal' },
    { nombre: 'Masaje con Velas Aromáticas', subcategoria: 'Masajes Especiales', tagsDefault: 'velas, aromaterapia, aceites, candle massage' },
    { nombre: 'Reflexología Podal', subcategoria: 'Reflexología', tagsDefault: 'reflexología, pies, puntos de presión, zonas reflejas' },
    { nombre: 'Masaje de Espalda y Cuello', subcategoria: 'Masajes Terapéuticos', tagsDefault: 'espalda, cuello, hombros, espalda completa' },
    { nombre: 'Ultrasonido Reductivo', subcategoria: 'Estética Corporal', tagsDefault: 'ultrasonido, cavitación, grasa localizada' },
    { nombre: 'Presoterapia', subcategoria: 'Estética Corporal', tagsDefault: 'presoterapia, compresión, circulación, retención' },
  ],

  // ─── DEPILACIÓN ───────────────────────────────────────────────────────────
  Depilación: [
    { nombre: 'Depilación Piernas Completas', subcategoria: 'Depilación Corporal', tagsDefault: 'piernas, cera, depilación piernas, muslos' },
    { nombre: 'Depilación Medias Piernas', subcategoria: 'Depilación Corporal', tagsDefault: 'medias piernas, pantorrillas, mitad pierna' },
    { nombre: 'Depilación Axilas', subcategoria: 'Depilación Corporal', tagsDefault: 'axilas, underarm, axila' },
    { nombre: 'Depilación Brazos', subcategoria: 'Depilación Corporal', tagsDefault: 'brazos, antebrazos, vellos brazos' },
    { nombre: 'Depilación Espalda (Mujer)', subcategoria: 'Depilación Corporal', tagsDefault: 'espalda, lomo, depilación espalda' },
    { nombre: 'Depilación Bikini / Cavado', subcategoria: 'Depilación Zona Íntima', tagsDefault: 'bikini, cavado, tanga, zona íntima' },
    { nombre: 'Depilación Brasileña Completa', subcategoria: 'Depilación Zona Íntima', tagsDefault: 'brasileña, zona completa, intima full' },
    { nombre: 'Depilación Glúteos', subcategoria: 'Depilación Zona Íntima', tagsDefault: 'glúteos, inter glúteos, parte posterior' },
    { nombre: 'Depilación Cejas (Cera/Hilo)', subcategoria: 'Depilación Facial', tagsDefault: 'cejas, cera, hilo, perfilado, design' },
    { nombre: 'Depilación Bozo', subcategoria: 'Depilación Facial', tagsDefault: 'bozo, labio superior, bigote' },
    { nombre: 'Depilación Mentón y Rostro', subcategoria: 'Depilación Facial', tagsDefault: 'mentón, rostro, facial, hilo facial' },
    { nombre: 'Depilación Corporal Completa', subcategoria: 'Depilación Corporal', tagsDefault: 'body full, cuerpo completo, full depilación' },
    { nombre: 'Micropigmentación de Cejas', subcategoria: 'Micropigmentación', tagsDefault: 'microblading, tatoo cejas, semipermanente cejas' },
    { nombre: 'Micropigmentación de Labios', subcategoria: 'Micropigmentación', tagsDefault: 'labios perfilados, aquarelle, semipermanente labios' },
    { nombre: 'Micropigmentación de Eyeliner', subcategoria: 'Micropigmentación', tagsDefault: 'eyeliner, delineado permanente, ojos' },
  ],

  // ─── MAQUILLAJE ───────────────────────────────────────────────────────────
  Maquillaje: [
    { nombre: 'Maquillaje Social', subcategoria: 'Maquillaje Social', tagsDefault: 'social, evento, noche, fiesta, salida' },
    { nombre: 'Maquillaje de Novia', subcategoria: 'Maquillaje Novia', tagsDefault: 'novia, bridal, wedding, boda, iglesia' },
    { nombre: 'Maquillaje de Quinceañera', subcategoria: 'Maquillaje Social', tagsDefault: 'quince, quinceañera, sweet 15, 15 años' },
    { nombre: 'Maquillaje Artístico / FX', subcategoria: 'Maquillaje Artístico', tagsDefault: 'artístico, fantasy, editorial, efectos' },
    { nombre: 'Maquillaje Airbrush', subcategoria: 'Maquillaje Premium', tagsDefault: 'airbrush, aerógrafo, cobertura total' },
    { nombre: 'Prueba de Maquillaje (Ensayo)', subcategoria: 'Maquillaje Premium', tagsDefault: 'prueba, ensayo, trial, prueba maquillaje' },
    { nombre: 'Microblading de Cejas', subcategoria: 'Micropigmentación', tagsDefault: 'microblading, tatuaje cejas, pelo a pelo' },
    { nombre: 'Micropigmentación Labios', subcategoria: 'Micropigmentación', tagsDefault: 'labios, aquarelle, blushed lips, labios permanentes' },
    { nombre: 'Micropigmentación Eyeliner', subcategoria: 'Micropigmentación', tagsDefault: 'eyeliner, delineado, ojos permanentes' },
    { nombre: 'Maquillaje Express / Diario', subcategoria: 'Maquillaje Exprés', tagsDefault: 'diario, natural, día, express, rápido' },
    { nombre: 'Retoque de Micropigmentación', subcategoria: 'Micropigmentación', tagsDefault: 'retoque, touch up, mantenimiento micropigmentación' },
  ],
};
