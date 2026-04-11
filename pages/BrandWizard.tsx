
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { negocios } from '../services/api';
import './BrandWizard.css';
import {
  Sparkles, ArrowLeft, ArrowRight, Check, Wand2,
  PartyPopper, RotateCcw, ChevronLeft, Loader2, Send,
  Edit2, Eye, Bot, RefreshCw, Mic2
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// WIZARD DATA - 7 Steps
// ═══════════════════════════════════════════════════════

interface WizardOption {
  id: string;
  emoji: string;
  label: string;
  description: string;
  ai_instructions: string;
}

interface WizardStep {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  options: WizardOption[];
  allowCustom: boolean;
  allowMultiple?: boolean;
  maxSelections?: number;
  isNameInput?: boolean;
  customPlaceholder?: string;
}

const WIZARD_STEPS: WizardStep[] = [
  // ── PASO 1: Identidad Base ──
  {
    id: 'identidad_base',
    emoji: '✨',
    title: '¿Qué tipo de asistente será tu bot?',
    subtitle: 'La personalidad base que definirá cómo habla con cada cliente.',
    allowCustom: false,
    isNameInput: true,
    options: [
      { id: 'chica_experta', emoji: '💅', label: 'La Asesora Chica', description: 'Amigable, tutea, entusiasta. Como tu BFF que sabe todo de belleza.', ai_instructions: 'Tono femenino, tuteo, alta energía. Usa lenguaje de complicidad y celebra cada decisión de la clienta.' },
      { id: 'profesional_elegante', emoji: '💎', label: 'La Experta Premium', description: 'Sofisticada, formal-cálida. Inspira confianza y exclusividad.', ai_instructions: 'Tono: usted o nombre propio, vocabulario selecto, sin jerga. Proyecta expertise y exclusividad en cada mensaje.' },
      { id: 'hermano_barbero', emoji: '✂️', label: 'El Compañero Barbero', description: 'Casual y con actitud cool. Perfecto para barberías y salones mixtos.', ai_instructions: 'Tono bro, coloquial, directo. Humor sutil. Habla de estilo y actitud, nunca de servicios como lista.' },
      { id: 'mama_consejera', emoji: '🤍', label: 'La Consejera Cálida', description: 'Materna, contenedora, muy paciente. Ideal para spas y estética integral.', ai_instructions: 'Tono muy cálido y comprensivo, sin prisa. Preguntar cómo se siente el cliente antes de ofrecer cualquier servicio.' },
      { id: 'tech_trendy', emoji: '🚀', label: 'La Techie Trendy', description: 'Moderna, rápida, usa emojis actuales. Para negocios con audiencia joven.', ai_instructions: 'Tono Gen Z friendly, rápido y directo. Usa abreviaciones naturales. Energía alta sin ser molesta.' }
    ]
  },
  // ── PASO 2: Tipo de Negocio ──
  {
    id: 'tipo_negocio',
    emoji: '🏠',
    title: '¿Qué tipo de espacio es tu salón?',
    subtitle: 'Esto define el vocabulario y el contexto de tu bot.',
    allowCustom: false,
    options: [
      { id: 'salon_fem_premium', emoji: '💆‍♀️', label: 'Salón Femenino', description: 'Cabello, uñas, faciales. Enfoque en experiencia y bienestar.', ai_instructions: 'Prioriza bienestar y autoestima. Vocabulario: mimarte, lucir radiante, sentirte reina.' },
      { id: 'barberia_masculina', emoji: '💈', label: 'Barbería / Salón Masculino', description: 'Corte, barba, grooming. Cultura de barbería urbana.', ai_instructions: 'Tono de hermandad. Vocabulario: estilo propio, quedar impecable, la rutina del crack.' },
      { id: 'spa_bienestar', emoji: '🌿', label: 'Spa & Bienestar', description: 'Masajes, tratamientos corporales, relajación profunda.', ai_instructions: 'Prioriza salud mental y física. Vocabulario: reconectar contigo, descanso profundo, merecerlo.' },
      { id: 'estudio_unas', emoji: '💅', label: 'Studio de Uñas', description: 'Nail art, manicure, pedicure. El arte en tus manos.', ai_instructions: 'Lenguaje de arte y estética. Vocabulario: diseño exclusivo, tus uñas cuentan tu historia.' },
      { id: 'salon_mixto', emoji: '✂️', label: 'Salón Integral / Mixto', description: 'Atiende hombres y mujeres, varios servicios.', ai_instructions: 'Adaptable al cliente. Detectar género por nombre y ajustar tono automáticamente.' },
      { id: 'cejas_pestanas', emoji: '👁️', label: 'Studio Cejas & Pestañas', description: 'Microblading, lifting, laminado. Alta especialización.', ai_instructions: 'Enfatizar precisión técnica. Vocabulario: resultado natural, permanencia, técnica certificada.' }
    ]
  },
  // ── PASO 3: Propuesta de Valor ──
  {
    id: 'propuesta_valor',
    emoji: '⭐',
    title: '¿Por qué tus clientes te eligen a ti?',
    subtitle: 'La razón real que los hace volver una y otra vez.',
    allowCustom: true,
    customPlaceholder: 'Ej: Somos el único salón en la zona con técnica balayage certificada...',
    options: [
      { id: 'resultado_garantizado', emoji: '✅', label: 'Resultados que se notan', description: 'Mis clientes salen y la gente se los nota. Técnica precisa.', ai_instructions: 'Enfatizar resultado visible en cada propuesta. Frases como "vas a quedar perfecta/o" al describir servicios.' },
      { id: 'experiencia_consentir', emoji: '💆‍♀️', label: 'Experiencia de consentirte', description: 'El servicio en sí es el regalo. Ambiente y trato únicos.', ai_instructions: 'Vender la experiencia antes que el precio. Describir cómo se sentirá el cliente, no solo qué recibirá.' },
      { id: 'asesoramiento_experto', emoji: '🧠', label: 'Asesoramiento personalizado', description: 'Analizamos tu caso y te recomendamos lo ideal para ti.', ai_instructions: 'Hacer preguntas antes de recomendar. Proyectar conocimiento real. El bot asesora, no vende.' },
      { id: 'rapidez_calidad', emoji: '⚡', label: 'Rapidez sin sacrificar calidad', description: 'Mismo resultado top, en menos tiempo. Para agendas ocupadas.', ai_instructions: 'Resaltar eficiencia: "en menos de X minutos". Mencionar cuando el cliente parece apurado o con poco tiempo.' },
      { id: 'productos_premium', emoji: '🌟', label: 'Productos de alta gama', description: 'Usamos marcas reconocidas que cuidan tu cabello y piel.', ai_instructions: 'Mencionar tipo de producto cuando sea relevante. Enfatizar: "productos que cuidan, no dañan".' },
      { id: 'precio_justo_valor', emoji: '💚', label: 'Mejor valor de la zona', description: 'Calidad accesible. La opción más inteligente del mercado.', ai_instructions: 'Nunca decir barato. Siempre: "excelente relación valor-precio" o "la mejor inversión que puedes hacer".' }
    ]
  },
  // ── PASO 4: Vocabulario Activo (selección múltiple) ──
  {
    id: 'vocabulario_activo',
    emoji: '📝',
    title: 'El vocabulario de tu marca',
    subtitle: 'Elige hasta 2 packs de palabras que tu bot usará naturalmente.',
    allowCustom: true,
    allowMultiple: true,
    maxSelections: 2,
    customPlaceholder: 'Ej: genial, top, increíble, de primera, te luciste...',
    options: [
      { id: 'vocab_reina', emoji: '👑', label: 'El Pack Reina', description: 'reina, divina, radiante, espectacular, de lujo', ai_instructions: 'Integrar naturalmente en saludos y confirmaciones. Especialmente al dar bienvenida o confirmar cita.' },
      { id: 'vocab_carinoso', emoji: '💕', label: 'El Pack Cariñoso', description: 'amor, linda, hermosa, consentirte, mimarte, te cuido yo', ai_instructions: 'Usar con clientes frecuentes o en mensajes de retorno. Genera apego emocional y fidelización.' },
      { id: 'vocab_moderno', emoji: '✨', label: 'El Pack Moderno', description: 'brutal, increíble, top, de 10, sin filtro, vibes', ai_instructions: 'Para audiencias jóvenes (18-35). Evitar con clientes adultos mayores. Calibrar por contexto.' },
      { id: 'vocab_premium', emoji: '🥂', label: 'El Pack Premium', description: 'exclusivo, impecable, a tu medida, experiencia, curated', ai_instructions: 'Para salones con precios altos. Proyecta sofisticación. Cada mensaje debe sentirse personalizado.' },
      { id: 'vocab_barberia', emoji: '💈', label: 'El Pack Barbería', description: 'crack, bro, luce top, tu mejor versión, estilo propio', ai_instructions: 'Solo para barberías o salones mixtos. Tono fraternal y de camaradería masculina.' },
      { id: 'vocab_spa', emoji: '🌿', label: 'El Pack Bienestar', description: 'reconéctate, mereces esto, respira, fluye, equilibrio', ai_instructions: 'Para servicios de relajación. Activar registro de calma y autocuidado antes de ofrecer citas.' }
    ]
  },
  // ── PASO 5: Palabras Prohibidas (selección múltiple) ──
  {
    id: 'palabras_prohibidas',
    emoji: '🚫',
    title: 'Lo que tu bot NUNCA dirá',
    subtitle: 'Elige hasta 3 packs de palabras completamente prohibidas.',
    allowCustom: true,
    allowMultiple: true,
    maxSelections: 3,
    customPlaceholder: 'Ej: competencia, oferta, urgente, problema, queja...',
    options: [
      { id: 'prohib_robot', emoji: '🤖', label: 'Sin lenguaje de robot', description: 'Evitar: bot, IA, sistema, automático, menú, opción 1', ai_instructions: 'Si preguntan si es bot, responder: "Soy [nombre_bot], tu asistente de [negocio]. ¿En qué puedo ayudarte?"' },
      { id: 'prohib_barato', emoji: '💸', label: 'Sin "barato" ni remates', description: 'Evitar: barato, liquidación, precio de regalo, tiramos el precio', ai_instructions: 'Sustituir por: relación valor-precio, inversión, precio accesible, lo mejor dentro de tu presupuesto.' },
      { id: 'prohib_frio', emoji: '🧊', label: 'Sin trato corporativo', description: 'Evitar: estimado/a, usuario/a, a continuación, procederemos', ai_instructions: 'Hablar siempre como persona real. Sin voz pasiva corporativa. Natural y directa.' },
      { id: 'prohib_negativo', emoji: '❌', label: 'Sin lenguaje limitante', description: 'Evitar: no podemos, lamentablemente, imposible, desafortundamente', ai_instructions: 'Reformular siempre en positivo: "Lo que sí puedo hacer es...", "Tenemos disponible..."' },
      { id: 'prohib_presion', emoji: '⏰', label: 'Sin presionar al cliente', description: 'Evitar: última oportunidad, tienes que decidir ya, pierdes el turno', ai_instructions: 'El bot nunca crea ansiedad artificial. Invitar con calidez, nunca con urgencia falsa.' },
      { id: 'prohib_precio_directo', emoji: '💰', label: 'Nunca precio sin valor primero', description: 'No dar precio sin antes mostrar los beneficios del servicio', ai_instructions: 'Al responder preguntas de precio: "Incluye [beneficios]. La inversión es de [precio]."' }
    ]
  },
  // ── PASO 6: Trato Personalizado ──
  {
    id: 'trato_personalizado',
    emoji: '👋',
    title: '¿Cómo llama tu bot a quienes te escriben?',
    subtitle: 'El apelativo que usa según el género detectado.',
    allowCustom: true,
    customPlaceholder: 'Ej: Mujer: preciosa, Hombre: campeón, Neutro: [nombre]...',
    options: [
      { id: 'trato_reina', emoji: '👑', label: 'Reinas y Campeones', description: 'Mujer: mi reina / hermosa · Hombre: crack / campeón · Neutro: [nombre]', ai_instructions: 'Detectar género por nombre. Si ambiguo, usar nombre directamente. Nunca apelativo genérico.' },
      { id: 'trato_amigos', emoji: '🤗', label: 'Amigos de confianza', description: 'Mujer: linda / amor · Hombre: bro / amigo · Neutro: hola, [nombre]', ai_instructions: 'Tono de amistad cercana pero no invasiva. Preguntar por el cliente como persona, no solo como comprador.' },
      { id: 'trato_formal_calidez', emoji: '🤝', label: 'Formal pero cercano', description: 'Mujer: señorita / señora · Hombre: caballero · Neutro: con mucho gusto', ai_instructions: 'Profesional sin frialdad. "Con gusto la/lo atiendo" es siempre mejor que "Claro que sí".' },
      { id: 'trato_nombre_siempre', emoji: '📛', label: 'Siempre por nombre propio', description: 'Sin importar el género, siempre usa el nombre del cliente.', ai_instructions: 'Priorizar nombre propio sobre cualquier apelativo. "Hola María, ¿cómo puedo ayudarte hoy?"' },
      { id: 'trato_creativo', emoji: '🎨', label: 'El dueño lo define', description: 'Escribe exactamente cómo quieres que se dirija a tus clientes.', ai_instructions: 'Usar exactamente los apelativos especificados por el dueño según el contexto y género detectado.' }
    ]
  },
  // ── PASO 7: Cierre y Agenda ──
  {
    id: 'cierre_agenda',
    emoji: '📅',
    title: '¿Cómo invita tu bot a agendar una cita?',
    subtitle: 'El momento del cierre es clave para la conversión.',
    allowCustom: true,
    customPlaceholder: 'Ej: ¿Cuándo puedo separarte un espacio esta semana?',
    options: [
      { id: 'cierre_entusiasta', emoji: '🤩', label: 'Con mucha emoción', description: '"¡Me encanta! ¿Cuándo te consentimos? 💖"', ai_instructions: 'Alta energía al confirmar interés del cliente. Crear anticipación hacia la visita con entusiasmo genuino.' },
      { id: 'cierre_consultivo', emoji: '🧠', label: 'Orientado a elegir bien', description: '"¿Qué día de la semana te viene mejor? Busco el horario perfecto."', ai_instructions: 'Hacer preguntas antes de proponer horarios. Personalizar la propuesta según contexto del cliente.' },
      { id: 'cierre_elegante', emoji: '☕', label: 'Elegante y sutil', description: '"Excelente elección. ¿Qué fecha prefiere para su visita?"', ai_instructions: 'Sin exclamaciones. Tono refinado. Confirmar como reserva de restaurant premium. Nunca apresurar.' },
      { id: 'cierre_urgencia_suave', emoji: '⏱️', label: 'Urgencia natural', description: '"Los espacios de esta semana se están llenando. ¿Aseguramos el tuyo?"', ai_instructions: 'Solo usar urgencia basada en disponibilidad real que el bot conozca. Nunca falsa escasez.' },
      { id: 'cierre_recordatorio', emoji: '📲', label: 'Con seguimiento incluido', description: '"Te agendo y te recuerdo el día antes. ¿Te parece bien?"', ai_instructions: 'Mencionar recordatorio automático en el cierre. Reduce no-shows y genera confianza en el sistema.' }
    ]
  },
  // ── PASO 8: Manejo de Situaciones Difíciles ──
  {
    id: 'manejo_dificultades',
    emoji: '🫂',
    title: '¿Cómo reacciona cuando algo se complica?',
    subtitle: 'Quejas, precios, disponibilidad limitada. ¿Cuál es el estilo de tu bot?',
    allowCustom: false,
    options: [
      { id: 'manejo_empatico', emoji: '💛', label: 'Primero validar, luego resolver', description: 'Entiende la emoción del cliente antes de dar soluciones.', ai_instructions: 'Si el cliente está molesto: "Entiendo cómo te sientes, eso no debería pasarte." Luego ofrecer solución concreta.' },
      { id: 'manejo_soluciones', emoji: '✅', label: 'Directo a las soluciones', description: 'Va al grano. Lo que importa es resolver, no hablar mucho.', ai_instructions: 'Ante problema: ir directo a opciones de solución sin rodeos emocionales. Eficiente y práctico siempre.' },
      { id: 'manejo_escalada', emoji: '📞', label: 'Escalar a humano rápido', description: 'Si no puede resolver solo, transfiere al dueño sin rodeos.', ai_instructions: 'Detectar frustración y decir: "Deja que te conecte directamente con [nombre del negocio]."' },
      { id: 'manejo_positivo', emoji: '🌟', label: 'Reformular siempre en positivo', description: 'Nunca da malas noticias directo. Siempre busca el ángulo bueno.', ai_instructions: 'Transformar "no hay disponibilidad" en "el próximo espacio disponible es...". Nunca cerrar sin alternativa.' },
      { id: 'manejo_transparente', emoji: '🤝', label: 'Honestidad directa', description: 'Si no sabe, lo dice. Si no puede, lo aclara. Confianza real.', ai_instructions: '"No tengo esa información ahora mismo, pero puedo consultarlo por ti." Proyectar honestidad como valor de marca.' }
    ]
  },
  // ── PASO 9: Estilo Visual ──
  {
    id: 'estilo_visual',
    emoji: '🌸',
    title: '¿Qué estilo visual tendrán los mensajes?',
    subtitle: 'Emojis, densidad y energía visual de cada mensaje.',
    allowCustom: false,
    options: [
      { id: 'visual_fem_vibrante', emoji: '💖', label: 'Femenino Vibrante', description: 'Alta densidad de emojis. Expresivo y vivo. 💖✨💅🌸', ai_instructions: 'Emojis firma: 💖✨💅🌸. Usar 2-4 emojis por mensaje. Abrir y cerrar mensajes con emoji siempre.' },
      { id: 'visual_elegante', emoji: '✨', label: 'Elegante y Sobrio', description: 'Muy pocos emojis, curados al máximo. Sofisticación pura.', ai_instructions: 'Emojis firma: ✨🤍. Máximo 1 emoji por mensaje, al final. Nunca en medio del texto.' },
      { id: 'visual_barberia', emoji: '🔥', label: 'Barbería Urbana', description: 'Emojis masculinos con actitud. Moderado. 🔥💈✂️💯', ai_instructions: 'Emojis firma: 🔥💈✂️. 1-2 por mensaje, solo cuando refuerzan el mensaje. Nada florido.' },
      { id: 'visual_spa', emoji: '🌿', label: 'Spa & Zen', description: 'Muy baja densidad. Solo emojis de naturaleza y calma. 🌿🍃🌙', ai_instructions: 'Emojis firma: 🌿🍃. Solo en saludos y despedida. Mensajes limpios y espaciados. Sin emojis de colores.' },
      { id: 'visual_gen_z', emoji: '🚀', label: 'Moderno Gen Z', description: 'Alta densidad variada. Energía y espontaneidad máxima. 🔥✨💫🙌', ai_instructions: 'Emojis firma: 🔥✨💫🙌. Variar emojis en cada mensaje. Reflejar energía y espontaneidad joven.' },
      { id: 'visual_sin_emojis', emoji: '📋', label: 'Sin emojis (Máxima formalidad)', description: 'Solo texto limpio. Compensado con vocabulario más expresivo.', ai_instructions: 'No usar emojis en ningún caso. Compensar calidez con oraciones más personales y vocabulario expresivo.' }
    ]
  }
];

// ═══════════════════════════════════════════════════════
// WIZARD PAGE COMPONENT
// ═══════════════════════════════════════════════════════

const BrandWizard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  // Para pasos de selección única
  const [answers, setAnswers] = useState<Record<string, string>>({});
  // Para pasos de selección múltiple (allowMultiple)
  const [multiAnswers, setMultiAnswers] = useState<Record<string, string[]>>({});
  // Nombre del bot (paso 1 isNameInput)
  const [nombreBot, setNombreBot] = useState('');
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Vista de perfil guardado ──
  type ViewMode = 'loading' | 'profile' | 'wizard';
  const [viewMode, setViewMode] = useState<ViewMode>('loading');
  const [existingProfile, setExistingProfile] = useState<Record<string, string | string[] | null> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false); // true = PUT, false = POST

  // Cargar perfil guardado al montar
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await negocios.getBrandWizardAnswers();

        // n8n debería devolver { respuestas: {...} } o [{respuestas: {...}}] o null/error
        let rawMarca = null;
        if (Array.isArray(data) && data.length > 0) {
          rawMarca = data[0].respuestas ?? data[0].marca_identidad ?? null;
        } else {
          rawMarca = data?.respuestas ?? data?.body?.respuestas ?? data?.marca_identidad ?? null;
        }

        // Si la base de datos guardó { respuestas: {...}, adn_json: {...} }, extraemos solo 'respuestas'
        let respuestas = null;
        if (rawMarca) {
          respuestas = rawMarca.respuestas ? rawMarca.respuestas : rawMarca;
        }

        if (respuestas && Object.keys(respuestas).length > 1) {
          setExistingProfile(respuestas);
          setViewMode('profile');
        } else {
          setViewMode('wizard');
        }
      } catch (error) {
        console.error('❌ Error en loadProfile:', error);
        setViewMode('wizard');
      }
    };
    loadProfile();
  }, []);

  // Mapear respuestas guardadas → estados del wizard (para edición)
  const loadProfileIntoWizard = (respuestas: Record<string, string | string[] | null>) => {
    const newAnswers: Record<string, string> = {};
    const newMultiAnswers: Record<string, string[]> = {};
    Object.entries(respuestas).forEach(([key, value]) => {
      if (key === 'nombre_bot') {
        setNombreBot(typeof value === 'string' ? value : '');
      } else if (Array.isArray(value)) {
        newMultiAnswers[key] = value.filter((v): v is string => typeof v === 'string' && !v.startsWith('custom:'));
        const customItem = value.find(v => typeof v === 'string' && v.startsWith('custom:'));
        if (customItem) newAnswers[key] = customItem;
      } else if (typeof value === 'string') {
        newAnswers[key] = value;
      }
    });
    setAnswers(newAnswers);
    setMultiAnswers(newMultiAnswers);
  };

  const step = WIZARD_STEPS[currentStep];
  const totalSteps = WIZARD_STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Scroll to top on step change
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // ── Selección simple ──
  const handleSelect = (optionId: string) => {
    if (step.allowMultiple) {
      // Multi-select logic
      const current = multiAnswers[step.id] || [];
      const max = step.maxSelections || 99;
      if (current.includes(optionId)) {
        setMultiAnswers(prev => ({ ...prev, [step.id]: current.filter(id => id !== optionId) }));
      } else if (current.length < max) {
        setMultiAnswers(prev => ({ ...prev, [step.id]: [...current, optionId] }));
      }
      return; // No auto-advance on multi-select
    }
    setAnswers(prev => ({ ...prev, [step.id]: optionId }));
    setShowCustom(prev => ({ ...prev, [step.id]: false }));
    // Auto-advance after a brief delay for feedback
    if (currentStep < totalSteps - 1) {
      setTimeout(() => handleNext(), 400);
    }
  };

  const handleCustomToggle = () => {
    setShowCustom(prev => ({ ...prev, [step.id]: !prev[step.id] }));
    if (showCustom[step.id]) {
      setCustomInputs(prev => ({ ...prev, [step.id]: '' }));
    } else {
      setAnswers(prev => { const copy = { ...prev }; delete copy[step.id]; return copy; });
      setMultiAnswers(prev => { const copy = { ...prev }; delete copy[step.id]; return copy; });
    }
  };

  const handleCustomSave = () => {
    const text = customInputs[step.id]?.trim();
    if (text) {
      setAnswers(prev => ({ ...prev, [step.id]: `custom:${text}` }));
      if (currentStep < totalSteps - 1) {
        setTimeout(() => handleNext(), 300);
      }
    }
  };

  // ── canProceed por paso ──
  const canProceedForStep = (s: WizardStep): boolean => {
    if (s.allowMultiple) return (multiAnswers[s.id] || []).length > 0;
    return !!answers[s.id];
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1 && canProceedForStep(step)) {
      setDirection('next');
      setIsAnimating(true);
      setTimeout(() => { setCurrentStep(prev => prev + 1); setIsAnimating(false); }, 250);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('prev');
      setIsAnimating(true);
      setTimeout(() => { setCurrentStep(prev => prev - 1); setIsAnimating(false); }, 250);
    }
  };

  const handleFinish = async () => {
    setIsComplete(true);
  };

  // ── BUILD RICH JSON v2.0 ──
  const buildRichPayload = () => {
    const getOption = (stepId: string) => {
      const s = WIZARD_STEPS.find(st => st.id === stepId);
      const ans = answers[stepId];
      if (!s || !ans) return null;
      if (ans.startsWith('custom:')) return { id: 'custom', label: 'Personalizado', ai_instructions: ans.replace('custom:', '') };
      return s.options.find(o => o.id === ans) || null;
    };

    const getMultiOptions = (stepId: string) => {
      const s = WIZARD_STEPS.find(st => st.id === stepId);
      const selected = multiAnswers[stepId] || [];
      if (!s) return [];
      const packs = selected.map(id => s.options.find(o => o.id === id)).filter(Boolean);
      // Custom text appended if exists
      const customText = answers[stepId];
      if (customText?.startsWith('custom:')) {
        packs.push({ id: 'custom', emoji: '✏️', label: 'Personalizado', description: customText.replace('custom:', ''), ai_instructions: customText.replace('custom:', '') });
      }
      return packs;
    };

    const identidad = getOption('identidad_base');
    const tipoNegocio = getOption('tipo_negocio');
    const propuestaValor = getOption('propuesta_valor');
    const trato = getOption('trato_personalizado');
    const cierreAgenda = getOption('cierre_agenda');
    const manejoOpt = getOption('manejo_dificultades');
    const estiloVisual = getOption('estilo_visual');
    const vocabPacks = getMultiOptions('vocabulario_activo');
    const prohibPacks = getMultiOptions('palabras_prohibidas');

    return {
      wizard_version: '2.0',
      fecha_completado: new Date().toISOString(),
      nombre_bot: nombreBot.trim() || 'Asistente',
      perfil_bot: {
        identidad_base: identidad ? { id: identidad.id, label: identidad.label, ai_instructions: identidad.ai_instructions } : null,
        tipo_negocio: tipoNegocio ? { id: tipoNegocio.id, label: tipoNegocio.label, ai_instructions: tipoNegocio.ai_instructions } : null,
        propuesta_valor: propuestaValor ? { id: propuestaValor.id, label: propuestaValor.label, ai_instructions: propuestaValor.ai_instructions } : null,
      },
      voz_marca: {
        vocabulario_activo: vocabPacks.map(p => ({ pack_id: p!.id, palabras: p!.description, ai_instructions: p!.ai_instructions })),
        palabras_prohibidas: prohibPacks.map(p => ({ pack_id: p!.id, evitar: p!.description, ai_instructions: p!.ai_instructions })),
        trato_personalizado: trato ? { id: trato.id, label: trato.label, ai_instructions: trato.ai_instructions } : null,
        estilo_visual: estiloVisual ? { id: estiloVisual.id, label: estiloVisual.label, ai_instructions: estiloVisual.ai_instructions } : null,
      },
      comportamiento_conversacional: {
        cierre_agenda: cierreAgenda ? { id: cierreAgenda.id, frase_ejemplo: (cierreAgenda as WizardOption).description ?? cierreAgenda.label, ai_instructions: cierreAgenda.ai_instructions } : null,
        manejo_dificultades: manejoOpt ? { id: manejoOpt.id, ai_instructions: manejoOpt.ai_instructions } : null,
      },
      meta: {
        pasos_completados: totalSteps,
        completado: true,
      }
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const respuestasPlanas: Record<string, string | string[] | null> = {};
      if (nombreBot.trim()) {
        respuestasPlanas['nombre_bot'] = nombreBot.trim();
      } else {
        respuestasPlanas['nombre_bot'] = null;
      }
      WIZARD_STEPS.forEach(s => {
        if (s.allowMultiple) {
          const selected = multiAnswers[s.id] || [];
          const customText = answers[s.id];
          const final: string[] = [...selected];
          if (customText?.startsWith('custom:')) final.push(customText);
          if (final.length > 0) respuestasPlanas[s.id] = final;
        } else {
          const ans = answers[s.id];
          if (ans) respuestasPlanas[s.id] = ans;
        }
      });
      const saveResponse = await negocios.saveBrandWizardAnswers(respuestasPlanas, isEditMode);
      setExistingProfile(respuestasPlanas);
      setSaveSuccess(true);
    } catch (error) {
      console.error('Error guardando identidad:', error);
      // Don't show false success - just log the error
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setMultiAnswers({});
    setNombreBot('');
    setCustomInputs({});
    setShowCustom({});
    setIsComplete(false);
    setSaveSuccess(false);
  };

  const handleEditProfile = () => {
    if (existingProfile) {
      loadProfileIntoWizard(existingProfile);
      setIsEditMode(true);
    }
    setIsComplete(false);
    setSaveSuccess(false);
    setCurrentStep(0);
    setViewMode('wizard');
  };

  const handleReturnToProfile = () => {
    if (existingProfile) {
      setViewMode('profile');
    }
  };

  const canProceed = canProceedForStep(step);
  const isLastStep = currentStep === totalSteps - 1;

  // ═══════════ LOADING SCREEN ═══════════
  if (viewMode === 'loading') {
    return (
      <div className="bw-page bw-loading-screen">
        <Loader2 size={32} className="bw-spin bw-loading-icon" />
        <p className="bw-loading-text">Cargando tu perfil...</p>
      </div>
    );
  }

  // ═══════════ PROFILE VIEW SCREEN ═══════════
  if (viewMode === 'profile' && existingProfile) {
    // Helper para obtener la opción de un step por ID
    const getStepOption = (stepId: string, answerId: string | null) => {
      if (!answerId) return null;
      const s = WIZARD_STEPS.find(st => st.id === stepId);
      if (!s) return null;
      if (answerId.startsWith('custom:')) return { emoji: '✏️', label: answerId.replace('custom:', '') };
      return s.options.find(o => o.id === answerId) || null;
    };

    const botName = typeof existingProfile.nombre_bot === 'string' ? existingProfile.nombre_bot : null;

    // Perfil por secciones
    const PROFILE_SECTIONS = [
      {
        sectionTitle: 'Personalidad del bot',
        sectionEmoji: '✨',
        items: [
          { stepId: 'identidad_base', label: 'Identidad base' },
          { stepId: 'tipo_negocio', label: 'Tipo de negocio' },
          { stepId: 'propuesta_valor', label: 'Propuesta de valor' },
        ]
      },
      {
        sectionTitle: 'Voz de marca',
        sectionEmoji: '🎙️',
        items: [
          { stepId: 'trato_personalizado', label: 'Trato con clientes' },
          { stepId: 'estilo_visual', label: 'Estilo visual' },
        ]
      },
      {
        sectionTitle: 'Comportamiento conversacional',
        sectionEmoji: '💬',
        items: [
          { stepId: 'cierre_agenda', label: 'Cierre para agendar' },
          { stepId: 'manejo_dificultades', label: 'Situaciones difíciles' },
        ]
      },
    ];

    return (
      <div className="bw-page" ref={containerRef}>
        <div className="bw-container bw-profile-container">

          {/* Header nav */}
          <div className="bw-header">
            <button onClick={() => navigate(-1)} className="bw-back-btn">
              <ChevronLeft size={20} />
            </button>
            <div className="bw-header-brand">
              <Wand2 size={18} className="bw-wand-icon" /> Nilah IA
            </div>
            <button onClick={handleEditProfile} className="bw-profile-edit-btn-header">
              <Edit2 size={15} /> Editar
            </button>
          </div>

          {/* Hero card del bot */}
          <div className="bw-profile-hero">
            <div className="bw-profile-avatar">
              <Bot size={40} />
            </div>
            <div className="bw-profile-hero-info">
              {botName ? (
                <>
                  <h1 className="bw-profile-bot-name">{botName}</h1>
                  <span className="bw-profile-bot-sub">Tu asistente de WhatsApp</span>
                </>
              ) : (
                <>
                  <h1 className="bw-profile-bot-name">Sin nombre</h1>
                  <span className="bw-profile-bot-sub">El bot no se presentará con nombre</span>
                </>
              )}
            </div>
            <span className="bw-profile-active-badge">
              <span className="bw-profile-active-dot" /> Activo
            </span>
          </div>

          {/* Secciones de configuración */}
          {PROFILE_SECTIONS.map(section => (
            <div key={section.sectionTitle} className="bw-profile-section">
              <h2 className="bw-profile-section-title">
                <span>{section.sectionEmoji}</span> {section.sectionTitle}
              </h2>
              <div className="bw-profile-cards">
                {section.items.map(({ stepId, label }) => {
                  const val = existingProfile[stepId];

                  // Multi-select
                  const s = WIZARD_STEPS.find(st => st.id === stepId);
                  if (s?.allowMultiple) {
                    const ids = Array.isArray(val) ? val : [];
                    const labels = ids.map(id => {
                      if (typeof id !== 'string') return null;
                      if (id.startsWith('custom:')) return { emoji: '✏️', label: id.replace('custom:', '') };
                      return s.options.find(o => o.id === id);
                    }).filter(Boolean);
                    return (
                      <div key={stepId} className="bw-profile-card">
                        <span className="bw-profile-card-label">{label}</span>
                        <div className="bw-profile-multi-tags">
                          {labels.length === 0
                            ? <span className="bw-profile-card-empty">No configurado</span>
                            : labels.map((opt, i) => (
                              <span key={i} className="bw-profile-tag">
                                {opt!.emoji} {opt!.label}
                              </span>
                            ))
                          }
                        </div>
                      </div>
                    );
                  }

                  // Single select
                  const opt = getStepOption(stepId, typeof val === 'string' ? val : null);
                  return (
                    <div key={stepId} className="bw-profile-card">
                      <span className="bw-profile-card-label">{label}</span>
                      {opt ? (
                        <span className="bw-profile-card-value">
                          {opt.emoji} {opt.label}
                        </span>
                      ) : (
                        <span className="bw-profile-card-empty">No configurado</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Vocabulario & Prohibidas (multi-select especiales) */}
          {(['vocabulario_activo', 'palabras_prohibidas'] as const).map(stepId => {
            const s = WIZARD_STEPS.find(st => st.id === stepId)!;
            const val = existingProfile[stepId];
            const ids = Array.isArray(val) ? val : [];
            const opts = ids.map(id => {
              if (typeof id !== 'string') return null;
              if (id.startsWith('custom:')) return { emoji: '✏️', label: id.replace('custom:', '') };
              return s.options.find(o => o.id === id);
            }).filter(Boolean);
            return (
              <div key={stepId} className="bw-profile-section">
                <h2 className="bw-profile-section-title">
                  <span>{stepId === 'vocabulario_activo' ? '💬' : '🚫'}</span>
                  {stepId === 'vocabulario_activo' ? 'Vocabulario de marca' : 'Palabras prohibidas'}
                </h2>
                <div className="bw-profile-cards">
                  <div className="bw-profile-card bw-profile-card-full">
                    <div className="bw-profile-multi-tags">
                      {opts.length === 0
                        ? <span className="bw-profile-card-empty">No configurado</span>
                        : opts.map((opt, i) => (
                          <span key={i} className={`bw-profile-tag ${stepId === 'palabras_prohibidas' ? 'bw-profile-tag-red' : ''}`}>
                            {opt!.emoji} {opt!.label}
                          </span>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* CTA bottom */}
          <div className="bw-profile-actions">
            <button onClick={handleEditProfile} className="bw-btn-primary bw-profile-edit-btn">
              <Edit2 size={18} /> Editar personalidad
            </button>
            <button onClick={() => navigate('/nilah/app/settings')} className="bw-btn-ghost">
              <Eye size={16} /> Ver en Configuración
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ═══════════ COMPLETION SCREEN ═══════════
  if (isComplete) {

    return (
      <div className="bw-page" ref={containerRef}>
        <div className="bw-container">
          {/* Confetti Animation */}
          <div className="bw-confetti-container">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="bw-confetti-piece"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  backgroundColor: ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#f97316'][i % 6],
                }}
              />
            ))}
          </div>

          <div className="bw-complete-card">
            <div className="bw-complete-icon">
              {saveSuccess ? (
                <div className="bw-success-ring">
                  <Check size={48} />
                </div>
              ) : (
                <div className="bw-party-icon">
                  <PartyPopper size={48} />
                </div>
              )}
            </div>

            <h1 className="bw-complete-title">
              {saveSuccess ? '¡Identidad Guardada!' : '¡Perfecto! 🎉'}
            </h1>

            <p className="bw-complete-subtitle">
              {saveSuccess
                ? 'Tu IA generará la personalidad del bot con tus respuestas. Podrás verla en Configuración → Nilah IA.'
                : 'Ya tenemos todo lo que necesitamos para darle personalidad única a tu chatbot.'
              }
            </p>

            {/* Answers Summary */}
            {!saveSuccess && (
              <div className="bw-summary">
                <h3 className="bw-summary-title">Tu Perfil de Marca ✨</h3>

                {/* Nombre del bot */}
                {nombreBot.trim() && (
                  <div className="bw-summary-row">
                    <span className="bw-summary-label">🤖 Nombre del asistente</span>
                    <span className="bw-summary-value">{nombreBot}</span>
                  </div>
                )}

                {WIZARD_STEPS.map(s => {
                  // Multi-select steps
                  if (s.allowMultiple) {
                    const selected = multiAnswers[s.id] || [];
                    const customText = answers[s.id];
                    if (selected.length === 0 && !customText) return null;
                    const labels = selected.map(id => s.options.find(o => o.id === id)?.label).filter(Boolean).join(', ');
                    return (
                      <div key={s.id} className="bw-summary-row">
                        <span className="bw-summary-label">{s.emoji} {s.title.replace('¿', '').replace('?', '').replace('Lo que tu bot NUNCA dirá', 'Palabras prohibidas').replace('El vocabulario de tu marca', 'Vocabulario')}</span>
                        <span className="bw-summary-value">
                          {labels}{customText?.startsWith('custom:') ? (labels ? ` · ✏️ ${customText.replace('custom:', '')}` : `✏️ ${customText.replace('custom:', '')}`) : ''}
                        </span>
                      </div>
                    );
                  }
                  // Single select steps
                  const answer = answers[s.id];
                  if (!answer) return null;
                  const isCustom = answer.startsWith('custom:');
                  const option = s.options.find(o => o.id === answer);
                  return (
                    <div key={s.id} className="bw-summary-row">
                      <span className="bw-summary-label">{s.emoji} {s.title.replace('¿', '').replace('?', '')}</span>
                      <span className="bw-summary-value">
                        {isCustom ? `✏️ ${answer.replace('custom:', '')}` : `${option?.emoji} ${option?.label}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="bw-complete-actions">
              {!saveSuccess ? (
                <>
                  <button onClick={handleSave} className="bw-btn-primary" disabled={isSaving}>
                    {isSaving ? (
                      <><Loader2 size={18} className="bw-spin" /> Guardando...</>
                    ) : (
                      <><Send size={18} /> Generar Personalidad con IA</>
                    )}
                  </button>
                  <button onClick={handleRestart} className="bw-btn-ghost">
                    <RotateCcw size={16} /> Empezar de nuevo
                  </button>
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <button onClick={() => { setIsComplete(false); setViewMode('profile'); }} className="bw-btn-primary">
                      <Eye size={18} /> Ver mi perfil
                    </button>
                  ) : (
                    <button onClick={() => navigate('/nilah/app/settings')} className="bw-btn-primary">
                      <Sparkles size={18} /> Ir a Configuración
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <BrandWizardStyles />
      </div>
    );
  }

  // ═══════════ WIZARD STEPS ═══════════
  return (
    <div className="bw-page" ref={containerRef}>
      <div className="bw-container">
        {/* Header */}
        <div className="bw-header">
          <button
            onClick={() => currentStep === 0 ? navigate(-1) : handlePrev()}
            className="bw-back-btn"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="bw-header-brand">
            <Wand2 size={18} className="bw-wand-icon" />
            <span>Brand Wizard</span>
          </div>
          <span className="bw-step-counter">{currentStep + 1}/{totalSteps}</span>
        </div>

        {/* Progress Bar */}
        <div className="bw-progress-track">
          <div
            className="bw-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Content */}
        <div
          className={`bw-step-content ${isAnimating ? (direction === 'next' ? 'bw-slide-out-left' : 'bw-slide-out-right') : 'bw-slide-in'}`}
        >
          {/* Step Header */}
          <div className="bw-step-header">
            <div className="bw-step-emoji">{step.emoji}</div>
            <h2 className="bw-step-title">{step.title}</h2>
            <p className="bw-step-subtitle">{step.subtitle}</p>
          </div>

          {/* Nombre del Bot Input — opcional */}
          {step.isNameInput && (
            <div className="bw-name-input-section">
              <p className="bw-name-input-label">
                ✨ Ponle nombre a tu asistente
                <span className="bw-name-optional-badge">opcional</span>
              </p>
              <input
                type="text"
                value={nombreBot}
                onChange={(e) => setNombreBot(e.target.value)}
                placeholder="Ej: Luna, Stella, Maya... (o déjalo en blanco)"
                className="bw-name-input"
                maxLength={30}
              />
              <p className="bw-name-input-hint">
                {nombreBot.trim()
                  ? `Tu bot se presentará como "${nombreBot.trim()}".`
                  : 'Sin nombre: el bot no se presentará con ningún nombre propio.'}
              </p>
            </div>
          )}

          {/* Multi-select counter badge */}
          {step.allowMultiple && (
            <div className="bw-multiselect-counter">
              <span className={`bw-multiselect-badge ${(multiAnswers[step.id] || []).length > 0 ? 'bw-multiselect-badge-active' : ''}`}>
                {(multiAnswers[step.id] || []).length} / {step.maxSelections} seleccionados
              </span>
            </div>
          )}

          {/* Options */}
          <div className="bw-options-grid">
            {step.options.map((option, idx) => {
              const isSelected = step.allowMultiple
                ? (multiAnswers[step.id] || []).includes(option.id)
                : answers[step.id] === option.id;
              const isDisabled = step.allowMultiple && !isSelected &&
                (multiAnswers[step.id] || []).length >= (step.maxSelections || 99);
              return (
                <button
                  key={option.id}
                  onClick={() => handleSelect(option.id)}
                  className={`bw-option-card ${isSelected ? 'bw-option-selected' : ''} ${isDisabled ? 'bw-option-disabled' : ''}`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  disabled={isDisabled}
                >
                  <div className="bw-option-emoji">{option.emoji}</div>
                  <div className="bw-option-text">
                    <span className="bw-option-label">{option.label}</span>
                    <span className="bw-option-desc">{option.description}</span>
                  </div>
                  {isSelected && (
                    <div className="bw-option-check">
                      <Check size={16} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Input Toggle */}
          {step.allowCustom && (
            <div className="bw-custom-section">
              <button
                onClick={handleCustomToggle}
                className={`bw-custom-toggle ${showCustom[step.id] ? 'bw-custom-toggle-active' : ''}`}
              >
                ✏️ {showCustom[step.id] ? 'Cancelar' : 'Prefiero escribirlo yo'}
              </button>

              {showCustom[step.id] && (
                <div className="bw-custom-input-area">
                  <textarea
                    value={customInputs[step.id] || ''}
                    onChange={(e) => setCustomInputs(prev => ({ ...prev, [step.id]: e.target.value }))}
                    placeholder={step.customPlaceholder}
                    className="bw-custom-textarea"
                    rows={3}
                    autoFocus
                  />
                  <button
                    onClick={handleCustomSave}
                    disabled={!customInputs[step.id]?.trim()}
                    className="bw-btn-primary bw-btn-sm"
                  >
                    <Check size={16} /> Usar esta respuesta
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="bw-footer">
          {currentStep > 0 && (
            <button onClick={handlePrev} className="bw-btn-ghost">
              <ArrowLeft size={16} /> Anterior
            </button>
          )}
          <div className="bw-footer-spacer" />
          {isLastStep ? (
            <button
              onClick={handleFinish}
              disabled={!canProceed}
              className="bw-btn-primary"
            >
              Ver Resultado <Sparkles size={16} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed}
              className="bw-btn-primary"
            >
              Siguiente <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════ EMBEDDED STYLES ═══════════ */}
      <BrandWizardStyles />
    </div>
  );
};

const BrandWizardStyles = () => (
  <style>{`
        /* ======= Page Layout ======= */
        .bw-page {
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #e0f2fe 100%);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .dark .bw-page {
          background: linear-gradient(135deg, #1a0a1e 0%, #0f0a1e 50%, #0a0f1e 100%);
        }

        .bw-container {
          max-width: 480px;
          margin: 0 auto;
          padding: 16px 16px 100px;
          position: relative;
        }

        /* ======= Header ======= */
        .bw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 16px;
        }
        .bw-back-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.7);
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .dark .bw-back-btn {
          background: rgba(255,255,255,0.08);
          color: #d1d5db;
        }
        .bw-back-btn:active {
          transform: scale(0.9);
        }
        .bw-header-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 15px;
          color: #7c3aed;
        }
        .dark .bw-header-brand {
          color: #a78bfa;
        }
        .bw-wand-icon {
          animation: bw-wiggle 2s ease-in-out infinite;
        }
        @keyframes bw-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .bw-step-counter {
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af;
          background: rgba(255,255,255,0.7);
          padding: 4px 12px;
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }
        .dark .bw-step-counter {
          background: rgba(255,255,255,0.06);
          color: #6b7280;
        }

        /* ======= Progress Bar ======= */
        .bw-progress-track {
          height: 6px;
          background: rgba(0,0,0,0.06);
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .dark .bw-progress-track {
          background: rgba(255,255,255,0.06);
        }
        .bw-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ec4899, #8b5cf6, #6366f1);
          border-radius: 100px;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* ======= Step Content ======= */
        .bw-step-content {
          animation: bw-fade-in 0.35s ease-out;
        }
        .bw-slide-in {
          animation: bw-slide-in 0.35s ease-out;
        }
        .bw-slide-out-left {
          animation: bw-slide-out-left 0.25s ease-in forwards;
        }
        .bw-slide-out-right {
          animation: bw-slide-out-right 0.25s ease-in forwards;
        }

        @keyframes bw-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bw-slide-in {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bw-slide-out-left {
          to { opacity: 0; transform: translateX(-30px); }
        }
        @keyframes bw-slide-out-right {
          to { opacity: 0; transform: translateX(30px); }
        }

        /* ======= Step Header ======= */
        .bw-step-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .bw-step-emoji {
          font-size: 48px;
          margin-bottom: 12px;
          animation: bw-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes bw-bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .bw-step-title {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .dark .bw-step-title {
          color: #f3f4f6;
        }
        .bw-step-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
        .dark .bw-step-subtitle {
          color: #9ca3af;
        }

        /* ======= Option Cards ======= */
        .bw-options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bw-option-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 2px solid rgba(0,0,0,0.06);
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: left;
          width: 100%;
          animation: bw-card-in 0.4s ease-out both;
          -webkit-tap-highlight-color: transparent;
        }
        .dark .bw-option-card {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
        }
        @keyframes bw-card-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bw-option-card:hover {
          border-color: rgba(139,92,246,0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(139,92,246,0.1);
        }
        .bw-option-card:active {
          transform: scale(0.98);
        }
        .bw-option-selected {
          border-color: #8b5cf6 !important;
          background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06)) !important;
          box-shadow: 0 4px 20px rgba(139,92,246,0.15), inset 0 0 0 1px rgba(139,92,246,0.1);
        }
        .dark .bw-option-selected {
          background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08)) !important;
          border-color: #a78bfa !important;
        }
        .bw-option-emoji {
          font-size: 28px;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(139,92,246,0.06);
          border-radius: 12px;
        }
        .dark .bw-option-emoji {
          background: rgba(139,92,246,0.1);
        }
        .bw-option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .bw-option-label {
          font-weight: 700;
          font-size: 15px;
          color: #111827;
        }
        .dark .bw-option-label {
          color: #f3f4f6;
        }
        .bw-option-desc {
          font-size: 12.5px;
          color: #6b7280;
          line-height: 1.3;
        }
        .dark .bw-option-desc {
          color: #9ca3af;
        }
        .bw-option-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          animation: bw-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes bw-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        /* ======= Custom Input Section ======= */
        .bw-custom-section {
          margin-top: 16px;
          text-align: center;
        }
        .bw-custom-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 20px;
          border: 1.5px dashed rgba(139,92,246,0.3);
          background: transparent;
          color: #7c3aed;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dark .bw-custom-toggle {
          border-color: rgba(167,139,250,0.3);
          color: #a78bfa;
        }
        .bw-custom-toggle:hover, .bw-custom-toggle-active {
          background: rgba(139,92,246,0.06);
          border-color: #8b5cf6;
        }
        .bw-custom-input-area {
          margin-top: 12px;
          animation: bw-fade-in 0.3s ease-out;
        }
        .bw-custom-textarea {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: 2px solid rgba(139,92,246,0.2);
          background: rgba(255,255,255,0.8);
          font-size: 14px;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          color: #111827;
        }
        .dark .bw-custom-textarea {
          background: rgba(255,255,255,0.04);
          border-color: rgba(167,139,250,0.2);
          color: #f3f4f6;
        }
        .bw-custom-textarea:focus {
          border-color: #8b5cf6;
        }
        .bw-custom-textarea::placeholder {
          color: #9ca3af;
        }

        /* ======= Buttons ======= */
        .bw-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 14px rgba(139,92,246,0.3);
          -webkit-tap-highlight-color: transparent;
        }
        .bw-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(139,92,246,0.4);
        }
        .bw-btn-primary:active:not(:disabled) {
          transform: scale(0.97);
        }
        .bw-btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .bw-btn-sm {
          padding: 10px 18px;
          font-size: 14px;
          margin-top: 10px;
        }
        .bw-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dark .bw-btn-ghost {
          color: #9ca3af;
        }
        .bw-btn-ghost:hover {
          background: rgba(0,0,0,0.04);
          color: #374151;
        }
        .dark .bw-btn-ghost:hover {
          background: rgba(255,255,255,0.06);
          color: #d1d5db;
        }

        /* ======= Footer Navigation ======= */
        .bw-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(0,0,0,0.06);
          z-index: 50;
          max-width: 480px;
          margin: 0 auto;
        }
        .dark .bw-footer {
          background: rgba(15,15,20,0.9);
          border-top-color: rgba(255,255,255,0.06);
        }
        .bw-footer-spacer {
          flex: 1;
        }

        /* ======= Completion Screen ======= */
        .bw-complete-card {
          text-align: center;
          padding: 32px 0 24px;
          position: relative;
          z-index: 2;
        }
        .bw-complete-icon {
          margin-bottom: 20px;
          animation: bw-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bw-party-icon, .bw-success-ring {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .bw-party-icon {
          background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1));
          color: #8b5cf6;
        }
        .dark .bw-party-icon {
          background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15));
          color: #a78bfa;
        }
        .bw-success-ring {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          animation: bw-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bw-complete-title {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px;
        }
        .dark .bw-complete-title {
          color: #f3f4f6;
        }
        .bw-complete-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 28px;
          line-height: 1.5;
          max-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }
        .dark .bw-complete-subtitle {
          color: #9ca3af;
        }

        /* ======= Summary ======= */
        .bw-summary {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 28px;
          border: 1px solid rgba(0,0,0,0.06);
          text-align: left;
        }
        .dark .bw-summary {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
        }
        .bw-summary-title {
          font-size: 15px;
          font-weight: 700;
          color: #8b5cf6;
          margin: 0 0 16px;
          text-align: center;
        }
        .bw-summary-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .dark .bw-summary-row {
          border-bottom-color: rgba(255,255,255,0.04);
        }
        .bw-summary-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .bw-summary-label {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bw-summary-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .dark .bw-summary-value {
          color: #f3f4f6;
        }

        .bw-complete-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        /* ======= Confetti ======= */
        .bw-confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }
        .bw-confetti-piece {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          opacity: 0.8;
          animation: bw-confetti-fall linear forwards;
        }
        @keyframes bw-confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        /* ======= Spinner ======= */
        .bw-spin {
          animation: bw-spin 1s linear infinite;
        }
        @keyframes bw-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
);

export default BrandWizard;
