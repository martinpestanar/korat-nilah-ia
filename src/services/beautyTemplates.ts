/**
 * beautyTemplates.ts
 * Plantillas inteligentes multi-tenant para salones de belleza (Korat Flow).
 * Provee imágenes temáticas HD (Unsplash curadas de estética salón) y descripciones
 * profesionales por defecto para:
 * - Pestañas (Lifting, 1x1 Clásicas, Volumen Ruso, Híbridas, Mega Volumen, Wispy, Cat Eye, etc.)
 * - Manos / Uñas (Acrílicas, Soft Gel, Polygel, Manicure Rusa, Rubber Base, etc.)
 * - Pies / Pedicure (Pedicure Spa, Express, Tradicional, Semipermanente)
 * - Cejas (Laminado, Diseño, Henna, Pigmentación, Depilación con Cera)
 * - Rostro / Facial (Limpieza Profunda, Dermaplaning, Hidratación, Depilación)
 * - Cabello (Balayage, Baby Lights, Botox Capilar, Alisado Orgánico, Keratina, etc.)
 */

export interface ServiceTemplate {
  keywords: string[];
  categoriaKey: 'pestanas' | 'manos' | 'pies' | 'cejas' | 'facial' | 'cabello' | 'general';
  descripcion: string;
  imagen: string;
}

// Catálogo de imágenes optimizadas HD Unsplash
export const CATEGORY_DEFAULT_IMAGES = {
  pestanas: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=600&q=80',
  cejas: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80',
  manos: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80',
  pies: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=600&q=80',
  facial: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80',
  cabello: 'https://images.unsplash.com/photo-1560869713-7d0a49430803?auto=format&fit=crop&w=600&q=80',
  general: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=600&q=80',
};

// Descripciones base por categoría
export const CATEGORY_DEFAULT_DESCRIPTIONS = {
  pestanas: 'Tratamiento profesional para realzar y definir tu mirada con curvatura, volumen y máxima ligereza.',
  cejas: 'Diseño y perfeccionamiento de cejas adaptado a la morfología de tu rostro para una mirada armónica.',
  manos: 'Cuidado integral de uñas y cutículas con acabados impecables, resistentes y esmaltado de alta duración.',
  pies: 'Ritual relajante y estético de pedicura para consentir, exfoliar y dejar tus pies suaves y renovados.',
  facial: 'Tratamiento facial especializado para purificar, hidratar y devolver la luminosidad y frescura a tu piel.',
  cabello: 'Transformación y cuidado capilar con técnicas avanzadas para nutrir, dar brillo y estilo a tu melena.',
  general: 'Servicio profesional personalizado con productos de primera calidad para resaltar tu mejor versión.',
};

// Plantillas por servicio específico
export const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // ─── PESTAÑAS ─────────────────────────────────────────────────────────────
  {
    keywords: ['lifting de pestanas', 'lifting de pestañas', 'lash lift'],
    categoriaKey: 'pestanas',
    descripcion: 'Levantamiento y curvado natural de tus pestañas desde la raíz con nutrición de keratina. Mirada abierta y descansada hasta por 6 a 8 semanas.',
    imagen: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['lifting + tinte', 'lifting con tinte'],
    categoriaKey: 'pestanas',
    descripcion: 'Combo completo de elevación natural y pigmentación intensa efecto rímel permanente. Resalta el largo y volumen de tus pestañas naturales.',
    imagen: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['extensiones clasicas', 'extensiones clásicas', 'pestañas 1x1', '1 a 1'],
    categoriaKey: 'pestanas',
    descripcion: 'Aplicación minuciosa de una extensión sobre cada pestaña natural. Brinda un acabado sutil, elegante y natural perfecto para el día a día.',
    imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['extensiones hibridas', 'extensiones híbridas'],
    categoriaKey: 'pestanas',
    descripcion: 'Fusión perfecta entre técnica clásica y volumen suave. Textura moderna con densidad y definición equilibrada.',
    imagen: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['extensiones volumen ruso', 'volumen ruso', 'russian volume'],
    categoriaKey: 'pestanas',
    descripcion: 'Abanicos ultra ligeros hechos a mano para lograr un efecto tupido, denso y sofisticado sin sobrecargar tus pestañas naturales.',
    imagen: 'https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['mega volumen', 'mega volume'],
    categoriaKey: 'pestanas',
    descripcion: 'Máxima densidad e intensidad para una mirada dramática e impactante. Fibras ultra finas que aportan abundancia y suavidad total.',
    imagen: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['wispy', 'efecto wispy', 'kim k'],
    categoriaKey: 'pestanas',
    descripcion: 'Diseño texturizado en espigas con diferentes longitudes para un efecto sensual y deslumbrante inspirado en las tendencias de alfombra roja.',
    imagen: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['cat eye', 'efecto cat eye', 'ojo de gato'],
    categoriaKey: 'pestanas',
    descripcion: 'Diseño en degradé que alarga la esquina exterior del ojo para una mirada felina, estilizada y sumamente seductora.',
    imagen: 'https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['fox eye', 'efecto fox eye'],
    categoriaKey: 'pestanas',
    descripcion: 'Efecto lifting rasgado que estiliza el contorno del ojo dando una mirada sensual y rejuvenecida de tendencia internacional.',
    imagen: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['tinte de pestanas', 'tinte de pestañas'],
    categoriaKey: 'pestanas',
    descripcion: 'Intensifica el color de tus pestañas con pigmentos especiales hipoalergénicos, aportando profundidad y brillo a tu mirada.',
    imagen: 'https://images.unsplash.com/photo-1500917293891-ef795e70e1f6?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['retiro de extensiones', 'remocion de pestañas'],
    categoriaKey: 'pestanas',
    descripcion: 'Remoción segura con gel removedor profesional que disuelve el adhesivo sin dañar tus pestañas naturales.',
    imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['retoque 2 semanas', 'relleno 2 semanas', 'mantenimiento 2 semanas'],
    categoriaKey: 'pestanas',
    descripcion: 'Relleno de extensiones a los 14 días para reponer pestañas caídas y mantener tu set tan tupido y perfecto como el primer día.',
    imagen: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['relleno 3 semanas', 'retoque 3 semanas'],
    categoriaKey: 'pestanas',
    descripcion: 'Limpieza profunda de extensiones, retiro de piezas crecidas y colocación de nuevos abanicos para restaurar la plenitud de tu set.',
    imagen: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['extensiones de colores'],
    categoriaKey: 'pestanas',
    descripcion: 'Toques de color personalizados (azul, violeta, café o destellos) para un look creativo y glamuroso.',
    imagen: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['patch test', 'prueba alergia'],
    categoriaKey: 'pestanas',
    descripcion: 'Test preventivo con aplicación de pocas extensiones para asegurar tolerancia y bienestar ante el adhesivo.',
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
  },

  // ─── MANOS & UÑAS ─────────────────────────────────────────────────────────
  {
    keywords: ['unas acrilicas', 'uñas acrilicas', 'acrílicas', 'uñas acrílicas'],
    categoriaKey: 'manos',
    descripcion: 'Extensión y esculpido de uñas en acrílico de alta resistencia con largo y forma a tu gusto (coffin, almendra, cuadradas o stiletto).',
    imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['gel soft', 'soft gel', 'tips gel'],
    categoriaKey: 'manos',
    descripcion: 'Sistema express en tips 100% de gel que se adhieren a tu uña natural. Ultraligeras, flexibles y con apariencia súper natural.',
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['polygel', 'sistema polygel'],
    categoriaKey: 'manos',
    descripcion: 'La combinación perfecta entre la fuerza del acrílico y la ligereza del gel. Cero olor, flexibilidad y máxima duración sin quiebres.',
    imagen: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['manicura rusa', 'manicure rusa'],
    categoriaKey: 'manos',
    descripcion: 'Técnica de precisión en seco con torno que limpia meticulosamente la cutícula para un esmaltado bajo cutícula impecable y duradero.',
    imagen: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['rubber base', 'kapping', 'baño de gel'],
    categoriaKey: 'manos',
    descripcion: 'Base elástica reforzada que nivela la uña natural, aportando resistencia contra golpes y ayudándola a crecer sana y fuerte.',
    imagen: 'https://images.unsplash.com/photo-1519014816548-bf7851545880?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['esmaltado semipermanente', 'gelish', 'uñas gel'],
    categoriaKey: 'manos',
    descripcion: 'Esmaltado secado en lámpara LED con brillo espejo impecable que se mantiene intacto y sin descascararse por más de 21 días.',
    imagen: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['manicura tradicional', 'manicure tradicional'],
    categoriaKey: 'manos',
    descripcion: 'Cuidado clásico de manos: limado, tratamiento suave de cutículas, masaje relajante con crema hidratante y esmalte tradicional.',
    imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['retoque acrilico', 'retoque acrílico', 'retoque polygel'],
    categoriaKey: 'manos',
    descripcion: 'Mantenimiento del crecimiento en tu set de uñas para balancear el ápice, renovar el color y prevenir desprendimientos.',
    imagen: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['retiro de sistema', 'retiro de acrilico'],
    categoriaKey: 'manos',
    descripcion: 'Retiro cuidadoso de uñas acrílicas o gel protegiendo la lámina natural, seguido de hidratación intensiva de cutículas.',
    imagen: 'https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['remocion semipermanente', 'retiro de semipermanente'],
    categoriaKey: 'manos',
    descripcion: 'Remoción rápida y no agresiva de esmalte semipermanente con pulido y nutrición de queratina.',
    imagen: 'https://images.unsplash.com/photo-1519014816548-bf7851545880?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['reparacion de una', 'reparación de uña'],
    categoriaKey: 'manos',
    descripcion: 'Reconstrucción o refuerzo de uña rota o agrietada para que tu set luzca nuevamente uniforme y perfecto.',
    imagen: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=600&q=80'
  },

  // ─── PIES & PEDICURE ──────────────────────────────────────────────────────
  {
    keywords: ['pedicura spa', 'pedicure spa'],
    categoriaKey: 'pies',
    descripcion: 'Experiencia relajante con tina de hidromasaje, exfoliación de sales marinas, mascarilla nutritiva, eliminación de durezas y esmaltado.',
    imagen: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['pedicura tradicional', 'pedicure tradicional'],
    categoriaKey: 'pies',
    descripcion: 'Limpieza completa de uñas y talones, limado anatómico, hidratación con crema emoliente y esmaltado clásico.',
    imagen: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['pedicura express', 'pedicure express'],
    categoriaKey: 'pies',
    descripcion: 'Tratamiento rápido y efectivo para cuando tienes poco tiempo: corte, limado de uñas, retiro de cutículas y esmaltado.',
    imagen: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['esmaltado semipermanente pies', 'semipermanente pies'],
    categoriaKey: 'pies',
    descripcion: 'Color de alta durabilidad en tus pies con secado instantáneo en cabina LED. ¡Sal de tu cita lista con zapatos cerrados sin arruinar el esmalte!',
    imagen: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['esmaltado tradicional pies'],
    categoriaKey: 'pies',
    descripcion: 'Esmaltado clásico con base fortalecedora, color de temporada y capa selladora de secado rápido.',
    imagen: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=600&q=80'
  },

  // ─── CEJAS & ROSTRO ───────────────────────────────────────────────────────
  {
    keywords: ['laminado de cejas', 'brow lamination'],
    categoriaKey: 'cejas',
    descripcion: 'Tratamiento semipermanente que alisa y direcciona el vello de las cejas para un efecto de cejas peinadas, rellenas y voluminosas.',
    imagen: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['diseno de cejas', 'diseño de cejas', 'visagismo'],
    categoriaKey: 'cejas',
    descripcion: 'Mapeo y diseño personalizado según las proporciones de tu rostro para lograr la simetría y arco ideal.',
    imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['laminado + diseno', 'laminado + diseño'],
    categoriaKey: 'cejas',
    descripcion: 'El dúo favorito para unas cejas de portada: visagismo de precisión más laminado disciplinante para máxima definición.',
    imagen: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['laminado + tinte'],
    categoriaKey: 'cejas',
    descripcion: 'Laminado disciplinante acompañado de tinte vegetal para rellenar sombras y dar un tono uniforme de mayor densidad.',
    imagen: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['pigmentacion de cejas', 'henna de cejas', 'henna'],
    categoriaKey: 'cejas',
    descripcion: 'Pigmentación semipermanente a base de extractos naturales que sombrea la piel y vello, disimulando espacios vacíos.',
    imagen: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['tinte de cejas'],
    categoriaKey: 'cejas',
    descripcion: 'Aporta color vibrante y brillo al vello de tus cejas, armonizando perfectamente con tu tono de cabello.',
    imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['depilacion de cejas con cera', 'depilación de cejas'],
    categoriaKey: 'cejas',
    descripcion: 'Depilación suave con cera elástica de baja temperatura para retirar vellos indeseados respetando la piel sensible.',
    imagen: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['depilacion labio superior', 'bozo'],
    categoriaKey: 'facial',
    descripcion: 'Eliminación rápida y delicada del vello en la zona del bigote con cera hipoalergénica y loción calmante.',
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['depilacion menton', 'depilación mentón'],
    categoriaKey: 'facial',
    descripcion: 'Retiro del vello en el área del mentón dejando la piel tersa y libre de irritación.',
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['depilacion rostro completo', 'depilación rostro completo'],
    categoriaKey: 'facial',
    descripcion: 'Depilación integral (frente, patillas, mejillas, labio y mentón) con acabado suave y porcelanizado.',
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['dermaplaning'],
    categoriaKey: 'facial',
    descripcion: 'Exfoliación física con bisturí dermatológico que retira células muertas y vello facial (pelusa). Piel ultra suave, luminosa y receptiva al maquillaje.',
    imagen: 'https://images.unsplash.com/photo-1512290900672-1f5572a15c32?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['limpieza facial profunda'],
    categoriaKey: 'facial',
    descripcion: 'Higiene facial exhaustiva con vapor de ozono, desincrustación de puntos negros, alta frecuencia antibacteriana y mascarilla descongestiva.',
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['limpieza facial basica', 'limpieza facial básica'],
    categoriaKey: 'facial',
    descripcion: 'Limpieza, tónico calmante, exfoliación enzimática suave e hidratación para devolver el balance natural a tu cutis.',
    imagen: 'https://images.unsplash.com/photo-1512290900672-1f5572a15c32?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['limpieza facial express'],
    categoriaKey: 'facial',
    descripcion: 'Tratamiento express de hidratación y luminosidad instantánea ideal antes de un evento especial.',
    imagen: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['hidratacion facial', 'hidratación facial'],
    categoriaKey: 'facial',
    descripcion: 'Shot intensivo de ácido hialurónico y vitaminas para nutrir la barrera cutánea y atenuar líneas de deshidratación.',
    imagen: 'https://images.unsplash.com/photo-1512290900672-1f5572a15c32?auto=format&fit=crop&w=600&q=80'
  },

  // ─── CABELLO & PELUQUERÍA ─────────────────────────────────────────────────
  {
    keywords: ['balayage'],
    categoriaKey: 'cabello',
    descripcion: 'Técnica francesa de barrido a mano alzada que crea un degradé luminoso y natural sin efecto raíz marcado.',
    imagen: 'https://images.unsplash.com/photo-1560869713-7d0a49430803?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['baby lights', 'babylights'],
    categoriaKey: 'cabello',
    descripcion: 'Mechas ultra finas desde la raíz que imitan los reflejos dorados naturales del sol, aportando brillo multidimensional.',
    imagen: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['mechas/highlights', 'mechas', 'highlights'],
    categoriaKey: 'cabello',
    descripcion: 'Aclaración estratégica con papel aluminio para aportar contraste, profundidad y luz a tu corte de cabello.',
    imagen: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['alisado organico', 'alisado orgánico', 'nanoplastia'],
    categoriaKey: 'cabello',
    descripcion: 'Alisado termoactivo 100% libre de formol a base de aminoácidos y aceites naturales. Cabello liso, brillante y sedoso hasta por 5 meses.',
    imagen: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['keratina brasilena', 'keratina brasileña', 'keratina'],
    categoriaKey: 'cabello',
    descripcion: 'Tratamiento restaurador que sella la cutícula, elimina el frizz al 100% y aporta suavidad extrema con brillo cristalino.',
    imagen: 'https://images.unsplash.com/photo-1560869713-7d0a49430803?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['botox capilar'],
    categoriaKey: 'cabello',
    descripcion: 'Cóctel regenerador intensivo de colágeno y vitaminas que repara hebras dañadas por decoloración, devolviendo cuerpo y elasticidad.',
    imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['hidratacion profunda', 'hidratación profunda'],
    categoriaKey: 'cabello',
    descripcion: 'Baño de nutrición con ampolla y mascarilla profesional sellada con vapor para revivir cabellos secos o maltratados.',
    imagen: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['color fantasia', 'color fantasía'],
    categoriaKey: 'cabello',
    descripcion: 'Decoloración previa y aplicación de tonos de fantasía (rosas, pasteles, azules, cobrizos intensos) de alta pigmentación.',
    imagen: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['decoloracion', 'decoloración'],
    categoriaKey: 'cabello',
    descripcion: 'Proceso de aclaración con protectores plex para cuidar la fibra capilar y preparar la base para el color deseado.',
    imagen: 'https://images.unsplash.com/photo-1560869713-7d0a49430803?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['ombre', 'ombré'],
    categoriaKey: 'cabello',
    descripcion: 'Transición elegante de color oscuro en raíces hacia puntas luminosas y claras, creando un contraste sofisticado.',
    imagen: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['tinte completo cabello corto'],
    categoriaKey: 'cabello',
    descripcion: 'Coloración total de raíz a puntas con cobertura 100% de canas y pigmentos duraderos para cabellos cortos o media melena.',
    imagen: 'https://images.unsplash.com/photo-1560869713-7d0a49430803?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['tinte completo cabello largo'],
    categoriaKey: 'cabello',
    descripcion: 'Coloración uniforme en melenas largas con brillo intenso y sellado de cutícula con mascarilla post-color.',
    imagen: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['peinado novia'],
    categoriaKey: 'cabello',
    descripcion: 'Peinado de ensueño para novias: recogido pulido, ondas románticas o semirrecogido con fijación de larga duración.',
    imagen: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['peinado de evento', 'peinado'],
    categoriaKey: 'cabello',
    descripcion: 'Estilizado profesional para graduaciones, galas o fiestas: recogidos modernos, trenzas o peinados de alfombra roja.',
    imagen: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['permanente de rizos'],
    categoriaKey: 'cabello',
    descripcion: 'Definición permanente de ondas o rulos con fórmulas modernas que respetan la suavidad y movimiento natural del cabello.',
    imagen: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['definicion de rizos', 'definición de rizos', 'metodo curly'],
    categoriaKey: 'cabello',
    descripcion: 'Lavado especial, nutrición profunda y técnica de encogimiento mechón a mechón para unos rizos definidos y sin frizz.',
    imagen: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['planchado'],
    categoriaKey: 'cabello',
    descripcion: 'Alisado térmico con plancha de titanio/cerámica y termoprotector de lujo para un efecto liso espejo.',
    imagen: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['secado/brushing', 'brushing', 'secado'],
    categoriaKey: 'cabello',
    descripcion: 'Moldeado con secador profesional y cepillo redondo para dar volumen, forma y movimiento natural.',
    imagen: 'https://images.unsplash.com/photo-1560869713-7d0a49430803?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['recogido'],
    categoriaKey: 'cabello',
    descripcion: 'Moño bajo o alto elegante, trenzado o messy bun estructurado para lucir sofisticada en toda ocasión.',
    imagen: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=600&q=80'
  },
  {
    keywords: ['trenzas'],
    categoriaKey: 'cabello',
    descripcion: 'Diseño de trenzas africanas, holandesas, cascada o trenzas pegadas de alta fijación y estilo moderno.',
    imagen: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=600&q=80'
  },
];

/**
 * Normaliza texto eliminando acentos y caracteres especiales para comparaciones seguras.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Detecta la categoría de un servicio a partir de su nombre o categoría asignada.
 */
export function detectCategoryKey(nombre: string, categoriaNombre?: string | null): keyof typeof CATEGORY_DEFAULT_IMAGES {
  const text = normalizeText(`${nombre} ${categoriaNombre || ''}`);

  if (text.includes('pestaña') || text.includes('pestana') || text.includes('lash') || text.includes('ojo')) {
    return 'pestanas';
  }
  if (text.includes('ceja') || text.includes('brow') || text.includes('laminado')) {
    return 'cejas';
  }
  if (text.includes('uña') || text.includes('una') || text.includes('manic') || text.includes('manos') || text.includes('gel') || text.includes('acrilic') || text.includes('polygel')) {
    return 'manos';
  }
  if (text.includes('pie') || text.includes('pedic')) {
    return 'pies';
  }
  if (text.includes('facial') || text.includes('rostro') || text.includes('cutis') || text.includes('dermaplaning') || text.includes('menton') || text.includes('bozo') || text.includes('labio')) {
    return 'facial';
  }
  if (text.includes('cabello') || text.includes('pelo') || text.includes('balayage') || text.includes('tinte') || text.includes('corte') || text.includes('peinado') || text.includes('alisado') || text.includes('keratina') || text.includes('botox') || text.includes('rizo')) {
    return 'cabello';
  }

  return 'general';
}

/**
 * Resuelve imagen y descripción inteligente para cualquier servicio.
 * Si el servicio ya tiene foto o descripción, se respeta la original.
 */
export function resolveServiceMediaAndDesc(
  nombre: string,
  descripcionActual?: string | null,
  mediaUrlActual?: string | null,
  categoriaNombre?: string | null
): { mediaUrl: string; descripcion: string; isFallback: boolean } {
  const normNombre = normalizeText(nombre);

  // 1. Buscar coincidencia exacta o por keywords en el catálogo de plantillas
  const matchedTemplate = SERVICE_TEMPLATES.find(t =>
    t.keywords.some(k => normNombre.includes(normalizeText(k)))
  );

  const catKey = matchedTemplate ? matchedTemplate.categoriaKey : detectCategoryKey(nombre, categoriaNombre);

  const finalMediaUrl = mediaUrlActual && mediaUrlActual.trim() !== ''
    ? mediaUrlActual
    : matchedTemplate?.imagen || CATEGORY_DEFAULT_IMAGES[catKey] || CATEGORY_DEFAULT_IMAGES.general;

  const finalDescripcion = descripcionActual && descripcionActual.trim() !== ''
    ? descripcionActual
    : matchedTemplate?.descripcion || CATEGORY_DEFAULT_DESCRIPTIONS[catKey] || CATEGORY_DEFAULT_DESCRIPTIONS.general;

  const isFallback = !mediaUrlActual || !descripcionActual;

  return {
    mediaUrl: finalMediaUrl,
    descripcion: finalDescripcion,
    isFallback,
  };
}

/**
 * Plantilla por defecto para Promo del Mes
 */
export const DEFAULT_PROMO_MES = {
  activa: true,
  badge_emoji: '🌸',
  badge_texto: 'Promo del Mes',
  titulo: 'Pestañas Volumen Ruso + Manicure Rusa VIP',
  descripcion: 'Consiéntete con el combo top del mes: abanicos de volumen liviano y definición perfecta en tus manos con esmaltado semipermanente de larga duración.',
};

/**
 * Plantilla por defecto para Combo de la Semana
 */
export const DEFAULT_OFERTA_SEMANA = {
  activa: true,
  titulo: 'Lifting de Pestañas + Laminado de Cejas HD',
  descripcion: '¡Dúo mirada perfecta! Curvatura natural de pestañas con keratina más visagismo y laminado de cejas peinadas y tupidas.',
  precio_oferta: 129.00,
  precio_original: 180.00,
  expira_en: '',
};
