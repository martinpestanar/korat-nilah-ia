import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Palette, Check, ChevronRight, RotateCcw, Wand2, Sliders } from 'lucide-react';
import {
  BRAND_PALETTES,
  BrandPalette,
  hexToRgbString,
  darkenHex,
  lightenHex,
  useTheme,
} from '../../context/ThemeContext';

// ════════════════════════════════════════════════════════════
// QUIZ DATA
// ════════════════════════════════════════════════════════════
interface QuizOption {
  id: string;
  label: string;
  emoji: string;
  hue: number;
  satBonus: number;
  lightBonus: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  subtitle: string;
  options: QuizOption[];
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'vibe',
    question: '¿Cuál es el vibe de tu salón?',
    subtitle: 'La personalidad que sientes cuando entras',
    options: [
      { id: 'coquette', label: 'Coquette & Delicado', emoji: '🎀', hue: 340, satBonus: 20, lightBonus: 5 },
      { id: 'lux',      label: 'Lujoso & Exclusivo',  emoji: '💎', hue: 270, satBonus: 15, lightBonus: -5 },
      { id: 'fresh',    label: 'Fresco & Moderno',    emoji: '🍑', hue: 20,  satBonus: 25, lightBonus: 10 },
      { id: 'bold',     label: 'Atrevido & Glam',     emoji: '🔥', hue: 350, satBonus: 30, lightBonus: 0 },
    ],
  },
  {
    id: 'specialty',
    question: '¿En qué te especializas principalmente?',
    subtitle: 'Tu servicio estrella que te define',
    options: [
      { id: 'nails',  label: 'Nails & Manicure',      emoji: '💅',    hue: 330, satBonus: 20, lightBonus: 8 },
      { id: 'lashes', label: 'Lash & Cejas',           emoji: '✨',    hue: 280, satBonus: 10, lightBonus: -8 },
      { id: 'hair',   label: 'Cabello & Color',        emoji: '💇‍♀️', hue: 35,  satBonus: 15, lightBonus: 5 },
      { id: 'full',   label: 'Beauty Bar Completo',    emoji: '🌸',    hue: 310, satBonus: 25, lightBonus: 3 },
    ],
  },
  {
    id: 'palette',
    question: '¿Qué paleta te enamora?',
    subtitle: 'Elige la que más representa tu estética',
    options: [
      { id: 'pinks',   label: 'Rosados & Fucsia',     emoji: '🌸', hue: 330, satBonus: 30, lightBonus: 0 },
      { id: 'purples', label: 'Violetas & Lavanda',   emoji: '💜', hue: 270, satBonus: 20, lightBonus: 0 },
      { id: 'warm',    label: 'Melocotón & Coral',    emoji: '🍑', hue: 20,  satBonus: 25, lightBonus: 5 },
      { id: 'gold',    label: 'Dorado & Canela',      emoji: '✨', hue: 38,  satBonus: 35, lightBonus: -10 },
    ],
  },
];

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function calculateColorFromQuiz(answers: Record<string, QuizOption>): string {
  const opts = Object.values(answers);
  const avgHue       = opts.reduce((s, o) => s + o.hue,        0) / opts.length;
  const avgSatBonus  = opts.reduce((s, o) => s + o.satBonus,   0) / opts.length;
  const avgLightBonus= opts.reduce((s, o) => s + o.lightBonus, 0) / opts.length;
  return hslToHex(
    Math.round(avgHue),
    Math.min(95, Math.max(50, 70 + avgSatBonus)),
    Math.min(60, Math.max(30, 45 + avgLightBonus)),
  );
}

function buildPaletteFromHex(primary: string, id = 'custom', name = 'Mi Marca'): BrandPalette {
  return {
    id, name, emoji: '🎨',
    description: 'Mi color de marca personalizado.',
    primary,
    primaryLight: lightenHex(primary, 0.3),
    primaryDark:  darkenHex(primary,  0.25),
    gradientFrom: primary,
    gradientTo:   darkenHex(primary,  0.2),
    shadowRgb:    hexToRgbString(primary),
  };
}

// ════════════════════════════════════════════════════════════
// SUB-COMPONENT: PaletteCard
// ════════════════════════════════════════════════════════════
interface PaletteCardProps {
  palette: BrandPalette;
  isActive: boolean;
  onClick: () => void;
}

const PaletteCard: React.FC<PaletteCardProps> = ({ palette, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`group relative flex flex-col gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
      isActive
        ? 'border-transparent shadow-lg'
        : 'border-gray-100 bg-white/70 dark:border-white/8 dark:bg-white/[0.03] hover:border-gray-200 dark:hover:border-white/15'
    }`}
    style={isActive ? {
      background:  `linear-gradient(135deg, ${palette.gradientFrom}18, ${palette.gradientTo}10)`,
      borderColor: palette.primary,
      boxShadow:   `0 8px 24px rgba(${palette.shadowRgb},0.2)`,
      outline:     `2px solid ${palette.primary}`,
      outlineOffset: '2px',
    } : undefined}
  >
    {/* Color swatches */}
    <div className="flex gap-1.5">
      <div className="h-8 w-8 rounded-xl shadow-sm" style={{ background: palette.primary }} />
      <div className="h-8 w-8 rounded-xl shadow-sm" style={{ background: palette.gradientTo }} />
      <div className="h-8 w-8 rounded-xl shadow-sm opacity-60" style={{ background: palette.primaryLight }} />
    </div>

    <div className="flex-1">
      <p className="flex items-center gap-1 text-sm font-bold text-gray-900 dark:text-white">
        <span>{palette.emoji}</span> {palette.name}
      </p>
      <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-gray-500 dark:text-gray-400">
        {palette.description}
      </p>
    </div>

    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-white"
          style={{ background: palette.primary }}
        >
          <Check size={13} strokeWidth={3} />
        </motion.div>
      )}
    </AnimatePresence>
  </button>
);

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
type PickerMode = 'choose' | 'quiz' | 'advanced';

interface BrandThemePickerProps {
  onSave?: (paletteId: string, customPalette?: BrandPalette) => void;
}

export const BrandThemePicker: React.FC<BrandThemePickerProps> = ({ onSave }) => {
  const {
    activePaletteId, activePalette,
    setActivePalette, customPalette, setCustomPalette,
  } = useTheme();

  const [pickerMode, setPickerMode] = useState<PickerMode>('choose');
  const [quizStep,   setQuizStep]   = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, QuizOption>>({});
  const [quizResult,  setQuizResult]  = useState<BrandPalette | null>(null);
  const [customHex,   setCustomHex]   = useState(customPalette.primary);
  const [savedOk,     setSavedOk]     = useState(false);

  const flashSaved = () => { setSavedOk(true); setTimeout(() => setSavedOk(false), 2500); };

  const resetQuiz = () => { setQuizStep(0); setQuizAnswers({}); setQuizResult(null); };

  // ── Quiz ──────────────────────────────────────────────────
  const handleQuizAnswer = useCallback((option: QuizOption) => {
    const q = QUIZ_QUESTIONS[quizStep];
    const newAnswers = { ...quizAnswers, [q.id]: option };
    setQuizAnswers(newAnswers);
    if (quizStep < QUIZ_QUESTIONS.length - 1) {
      setQuizStep(p => p + 1);
    } else {
      setQuizResult(buildPaletteFromHex(calculateColorFromQuiz(newAnswers), 'custom', 'Mi Firma Personal'));
    }
  }, [quizStep, quizAnswers]);

  const applyQuizResult = useCallback(() => {
    if (!quizResult) return;
    setCustomPalette(quizResult);
    setActivePalette('custom', quizResult);
    onSave?.('custom', quizResult);
    flashSaved();
    setPickerMode('choose');
    resetQuiz();
  }, [quizResult, setCustomPalette, setActivePalette, onSave]);

  // ── Advanced ─────────────────────────────────────────────
  const applyCustomHex = useCallback(() => {
    const p = buildPaletteFromHex(customHex, 'custom', 'Mi Color Personalizado');
    setCustomPalette(p);
    setActivePalette('custom', p);
    onSave?.('custom', p);
    flashSaved();
  }, [customHex, setCustomPalette, setActivePalette, onSave]);

  // ── Predefined ────────────────────────────────────────────
  const applyPredefined = useCallback((palette: BrandPalette) => {
    setActivePalette(palette.id);
    onSave?.(palette.id);
    flashSaved();
  }, [setActivePalette, onSave]);

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════
  return (
    <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/8 dark:bg-[#161622]/90">
      {/* Glow de marca */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-52 w-52 rounded-full blur-3xl opacity-10 dark:opacity-15"
        style={{ background: activePalette.primary }}
      />

      {/* ── Header ──────────────────────────────────────── */}
      <div className="relative flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-white/8">
        <div className="flex items-center gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${activePalette.gradientFrom}, ${activePalette.gradientTo})`,
              boxShadow:  `0 8px 24px rgba(${activePalette.shadowRgb},0.3)`,
            }}
          >
            <Palette size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Identidad de Color</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">El color de tu marca en toda la app</p>
          </div>
        </div>

        {/* Badge activo */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-gray-100 bg-white px-4 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="h-3.5 w-3.5 rounded-full" style={{ background: activePalette.primary }} />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {activePalette.emoji} {activePalette.name}
          </span>
        </div>
      </div>

      <div className="p-6">

        {/* ════ MODE: choose ════════════════════════════════ */}
        {pickerMode === 'choose' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Action cards */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => { resetQuiz(); setPickerMode('quiz'); }}
                className="group flex flex-1 items-center gap-3 rounded-2xl border-2 border-dashed p-4 text-left transition-all hover:border-solid"
                style={{ borderColor: `${activePalette.primary}55` }}
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                  style={{ background: `linear-gradient(135deg, ${activePalette.gradientFrom}, ${activePalette.gradientTo})` }}
                >
                  <Wand2 size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">✨ Brand Quiz Mágico</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">3 preguntas → tu color perfecto</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-gray-400 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => setPickerMode('advanced')}
                className="group flex flex-1 items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 p-4 text-left transition-all hover:border-solid hover:border-gray-300 dark:border-white/10 dark:hover:border-white/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                  <Sliders size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">🎨 Modo Avanzado</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Elige tu color exacto</p>
                </div>
                <ChevronRight size={16} className="ml-auto text-gray-400 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* Predefined palettes grid */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Temas predefinidos
              </p>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {BRAND_PALETTES.map(palette => (
                  <PaletteCard
                    key={palette.id}
                    palette={palette}
                    isActive={activePaletteId === palette.id}
                    onClick={() => applyPredefined(palette)}
                  />
                ))}
                {activePaletteId === 'custom' && (
                  <PaletteCard
                    key="custom"
                    palette={customPalette}
                    isActive={true}
                    onClick={() => {}}
                  />
                )}
              </div>
            </div>

            {/* Save feedback */}
            <AnimatePresence>
              {savedOk && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${activePalette.gradientFrom}, ${activePalette.gradientTo})` }}
                >
                  <Check size={16} strokeWidth={3} />
                  ¡Paleta aplicada a toda la app! ✨
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ════ MODE: quiz (questions) ══════════════════════ */}
        {pickerMode === 'quiz' && !quizResult && (
          <motion.div
            key={`quiz-step-${quizStep}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => quizStep > 0 ? setQuizStep(s => s - 1) : setPickerMode('choose')}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ← Atrás
              </button>
              <div className="flex flex-1 gap-1.5">
                {QUIZ_QUESTIONS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all duration-500"
                    style={{ background: i <= quizStep ? activePalette.primary : 'rgba(156,163,175,0.3)' }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-gray-400">{quizStep + 1}/{QUIZ_QUESTIONS.length}</span>
            </div>

            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {QUIZ_QUESTIONS[quizStep].question}
              </h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {QUIZ_QUESTIONS[quizStep].subtitle}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {QUIZ_QUESTIONS[quizStep].options.map(option => (
                <button
                  key={option.id}
                  onClick={() => handleQuizAnswer(option)}
                  className="group flex flex-col items-start gap-2 rounded-2xl border-2 border-gray-100 bg-white p-5 text-left transition-all hover:border-gray-300 hover:shadow-md active:scale-95 dark:border-white/8 dark:bg-white/[0.03] dark:hover:border-white/20"
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{option.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ════ MODE: quiz result ═══════════════════════════ */}
        {pickerMode === 'quiz' && quizResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="text-center">
              <div
                className="mx-auto mb-4 h-20 w-20 rounded-3xl shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, ${quizResult.gradientFrom}, ${quizResult.gradientTo})`,
                  boxShadow:  `0 16px 40px rgba(${quizResult.shadowRgb},0.4)`,
                }}
              />
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">✨ ¡Tu firma de color está lista!</h4>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Nilah calculó el color perfecto para tu salón</p>
              <p className="mt-2 font-mono text-lg font-bold" style={{ color: quizResult.primary }}>
                {quizResult.primary.toUpperCase()}
              </p>
            </div>

            <div className="flex justify-center gap-3">
              {[quizResult.primaryLight, quizResult.primary, quizResult.gradientTo, quizResult.primaryDark].map((c, i) => (
                <div key={i} className="h-10 w-10 rounded-xl shadow-sm" style={{ background: c }} title={c} />
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { resetQuiz(); setPickerMode('choose'); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <RotateCcw size={15} /> Reintentar
              </button>
              <button
                onClick={applyQuizResult}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${quizResult.gradientFrom}, ${quizResult.gradientTo})`,
                  boxShadow:  `0 6px 20px rgba(${quizResult.shadowRgb},0.3)`,
                }}
              >
                <Sparkles size={16} /> Aplicar este color
              </button>
            </div>
          </motion.div>
        )}

        {/* ════ MODE: advanced ══════════════════════════════ */}
        {pickerMode === 'advanced' && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <button
              onClick={() => setPickerMode('choose')}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ← Volver
            </button>

            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white">Elige tu color exacto</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Selecciona el color principal de tu marca y Nilah calculará el resto automáticamente.
              </p>
            </div>

            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* Color input */}
              <div className="flex flex-col items-center gap-2">
                <input
                  type="color"
                  value={customHex}
                  onChange={e => setCustomHex(e.target.value)}
                  className="h-24 w-24 cursor-pointer rounded-2xl border-0 bg-transparent p-0"
                  style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.2))' }}
                />
                <p className="font-mono text-xs font-bold text-gray-500 dark:text-gray-400">
                  {customHex.toUpperCase()}
                </p>
              </div>

              {/* Auto-calculated variants */}
              <div className="flex-1 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Variantes calculadas
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Principal',       color: customHex },
                    { label: 'Claro (hover)',    color: lightenHex(customHex, 0.3) },
                    { label: 'Gradiente',        color: darkenHex(customHex, 0.2) },
                    { label: 'Oscuro (pressed)', color: darkenHex(customHex, 0.25) },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2 rounded-xl bg-gray-50 p-2.5 dark:bg-white/5">
                      <div className="h-6 w-6 shrink-0 rounded-lg shadow-sm" style={{ background: color }} />
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{label}</p>
                        <p className="font-mono text-[11px] text-gray-800 dark:text-gray-200">{color.toUpperCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Button preview */}
                <div
                  className="w-full rounded-xl py-2.5 text-center text-sm font-bold text-white select-none"
                  style={{
                    background: `linear-gradient(135deg, ${customHex}, ${darkenHex(customHex, 0.2)})`,
                    boxShadow:  `0 4px 16px rgba(${hexToRgbString(customHex)},0.3)`,
                  }}
                >
                  Vista previa del botón ✨
                </div>
              </div>
            </div>

            <button
              onClick={applyCustomHex}
              className="w-full rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${customHex}, ${darkenHex(customHex, 0.2)})`,
                boxShadow:  `0 6px 20px rgba(${hexToRgbString(customHex)},0.3)`,
              }}
            >
              Aplicar mi color de marca
            </button>

            <AnimatePresence>
              {savedOk && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white"
                  style={{ background: `linear-gradient(135deg, ${customHex}, ${darkenHex(customHex, 0.2)})` }}
                >
                  <Check size={16} strokeWidth={3} />
                  ¡Color aplicado a toda la app! ✨
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </section>
  );
};
