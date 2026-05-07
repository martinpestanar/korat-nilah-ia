import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Scissors, Users, Target, Sparkles, Loader2, Save,
  Check, ChevronRight, ChevronLeft, Zap, TrendingUp, Heart,
  Star, RefreshCw, ShoppingBag
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────
interface BriefWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  briefData: any;
  handleBriefField: (field: string, value: string) => void;
  handleSaveBrief: () => Promise<void>;
  savingBrief: boolean;
  briefError: string | null;
  briefId: number | null;
  handleDeleteBrief: () => Promise<void>;
}

// ─── Option Chip ─────────────────────────────────────────────────
function Chip({
  label, emoji, selected, onClick, color = 'violet'
}: { label: string; emoji?: string; selected: boolean; onClick: () => void; color?: string }) {
  const colors: Record<string, string> = {
    violet: 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    rose:   'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    emerald:'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber:  'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    sky:    'border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  };
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.04, y: -1 }}
      onClick={onClick}
      className={`relative flex cursor-pointer items-center gap-1.5 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition-all duration-200 select-none
        ${selected
          ? colors[color]
          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:border-white/20'
        }`}
    >
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      {label}
      {selected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-1"
        >
          <Check size={13} strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}

// ─── Day Button ───────────────────────────────────────────────────
const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
function DayPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? value.split(',').map(d => d.trim()) : [];
  const toggle = (d: string) => {
    const next = selected.includes(d) ? selected.filter(x => x !== d) : [...selected, d];
    onChange(next.join(', '));
  };
  return (
    <div className="flex flex-wrap gap-2">
      {DAYS.map(d => (
        <motion.button
          key={d}
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={() => toggle(d)}
          className={`h-10 w-12 rounded-xl text-sm font-bold transition-all duration-200
            ${selected.includes(d)
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/30'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10'
            }`}
        >
          {d}
        </motion.button>
      ))}
    </div>
  );
}

// ─── Color Swatch ─────────────────────────────────────────────────
const BRAND_COLORS = [
  { label: 'Rosa Perlado', value: '#F9A8D4', hex: '#F9A8D4' },
  { label: 'Lila Bruma',   value: '#C4B5FD', hex: '#C4B5FD' },
  { label: 'Mint Fresco',  value: '#6EE7B7', hex: '#6EE7B7' },
  { label: 'Dorado Miel',  value: '#FCD34D', hex: '#FCD34D' },
  { label: 'Coral Vivo',   value: '#FCA5A5', hex: '#FCA5A5' },
  { label: 'Cielo Suave',  value: '#7DD3FC', hex: '#7DD3FC' },
  { label: 'Vino Oscuro',  value: '#9F1239', hex: '#9F1239' },
  { label: 'Negro Lujo',   value: '#1C1C1E', hex: '#1C1C1E' },
];

// ─── Step config ──────────────────────────────────────────────────
const STEPS = [
  { id: 1, emoji: '✂️', title: 'Tu Negocio',       color: 'from-violet-500 to-purple-600' },
  { id: 2, emoji: '⭐', title: 'Tus Servicios',    color: 'from-rose-500 to-pink-600' },
  { id: 3, emoji: '👥', title: 'Tu Cliente',       color: 'from-emerald-500 to-teal-600' },
  { id: 4, emoji: '🎯', title: 'Tu Objetivo',      color: 'from-amber-500 to-orange-600' },
];

// ─── Main Component ───────────────────────────────────────────────
export const BriefWizardModal: React.FC<BriefWizardModalProps> = ({
  isOpen, onClose, briefData, handleBriefField,
  handleSaveBrief, savingBrief, briefError, briefId, handleDeleteBrief
}) => {
  const [step, setStep] = useState(1);

  if (!isOpen) return null;

  const set = (field: string, val: string) => handleBriefField(field, val);
  const is = (field: string, val: string) => briefData[field] === val;
  const prev = () => setStep(s => Math.max(1, s - 1));
  const next = () => setStep(s => Math.min(STEPS.length, s + 1));
  const isLast = step === STEPS.length;

  const onSave = async () => { await handleSaveBrief(); onClose(); setStep(1); };

  const stepColors = [
    'bg-gradient-to-br from-violet-500 to-purple-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-0 sm:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => { onClose(); setStep(1); }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#18181b] shadow-2xl"
        style={{ maxHeight: '92vh' }}
      >
        {/* Coloured header bar */}
        <div className={`${stepColors[step - 1]} px-6 pt-6 pb-8 transition-all duration-500`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                Paso {step} de {STEPS.length}
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-white">
                {STEPS[step - 1].emoji} {STEPS[step - 1].title}
              </h2>
            </div>
            <button
              onClick={() => { onClose(); setStep(1); }}
              className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Step dots */}
          <div className="mt-5 flex gap-2">
            {STEPS.map(s => (
              <motion.button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                animate={{ width: s.id === step ? 28 : 8 }}
                className={`h-2 rounded-full transition-all duration-300 ${s.id === step ? 'bg-white' : 'bg-white/30'}`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {briefError && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-900/20 dark:text-red-400">
              {briefError}
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-6"
            >

              {/* ── STEP 1: Negocio ─────────────────────────────── */}
              {step === 1 && (
                <>
                  <Section title="¿Qué tipo de lugar es?" hint="Nilah adaptará su forma de hablar según el ambiente de tu negocio">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: 'salon',  e: '💇‍♀️', l: 'Salón de Belleza' },
                        { v: 'barber', e: '💈', l: 'Barbería' },
                        { v: 'spa',    e: '🧖‍♀️', l: 'Spa & Wellness' },
                        { v: 'nails',  e: '💅', l: 'Uñas & Nail Art' },
                        { v: 'lashes', e: '👁️', l: 'Pestañas & Cejas' },
                        { v: 'hair',   e: '✂️', l: 'Cabello Especializado' },
                      ].map(({ v, e, l }) => (
                        <Chip key={v} emoji={e} label={l} selected={is('business_type', v)} onClick={() => set('business_type', v)} color="violet" />
                      ))}
                    </div>
                  </Section>

                  <Section title="¿Cuánto tiempo llevas operando?" hint="Ayuda a comunicar tu experiencia y confianza">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: '0', l: 'Recién abrimos 🌱' },
                        { v: '1', l: '1-2 años' },
                        { v: '3', l: '3-5 años' },
                        { v: '6', l: '6-10 años' },
                        { v: '11', l: '+10 años 🏆' },
                      ].map(({ v, l }) => (
                        <Chip key={v} label={l} selected={briefData.years_operating == v} onClick={() => set('years_operating', v)} color="violet" />
                      ))}
                    </div>
                  </Section>
                </>
              )}

              {/* ── STEP 2: Servicios ───────────────────────────── */}
              {step === 2 && (
                <>
                  <Section title="¿Cuál es tu servicio más popular?" hint="El que piden más tus clientes. Nilah lo promoverá activamente">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: 'Tintura y color', e: '🎨' },
                        { v: 'Corte de cabello', e: '✂️' },
                        { v: 'Keratina / alisado', e: '✨' },
                        { v: 'Manicure & pedicure', e: '💅' },
                        { v: 'Extensiones de pestañas', e: '👁️' },
                        { v: 'Balayage / mechas', e: '🌟' },
                        { v: 'Masajes & spa', e: '🧖‍♀️' },
                        { v: 'Depilación', e: '🪶' },
                      ].map(({ v, e }) => (
                        <Chip key={v} emoji={e} label={v}
                          selected={briefData.top_service_1 === v || briefData.top_service_2 === v}
                          onClick={() => {
                            if (briefData.top_service_1 === v) { set('top_service_1', ''); }
                            else if (briefData.top_service_2 === v) { set('top_service_2', ''); }
                            else if (!briefData.top_service_1) { set('top_service_1', v); }
                            else if (!briefData.top_service_2) { set('top_service_2', v); }
                          }}
                          color="rose"
                        />
                      ))}
                    </div>
                    <CustomInput field="top_service_1" placeholder="Otro servicio personalizado…" briefData={briefData} set={set} />
                  </Section>

                  <Section title="Tu servicio estrella 💎" hint="El más rentable o exclusivo. Nilah lo destacará en campañas premium">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: 'Tratamiento de Keratina completa', e: '💎' },
                        { v: 'Coloración completa', e: '🎨' },
                        { v: 'Set de uñas acrílicas', e: '💅' },
                        { v: 'Ritual spa completo', e: '🧖‍♀️' },
                        { v: 'Lifting de pestañas', e: '✨' },
                        { v: 'Diseño de cejas premium', e: '👁️' },
                      ].map(({ v, e }) => (
                        <Chip key={v} emoji={e} label={v} selected={is('premium_service', v)} onClick={() => set('premium_service', v)} color="rose" />
                      ))}
                    </div>
                    <CustomInput field="premium_service" placeholder="Otro servicio estrella…" briefData={briefData} set={set} />
                  </Section>
                </>
              )}

              {/* ── STEP 3: Cliente ─────────────────────────────── */}
              {step === 3 && (
                <>
                  <Section title="¿Quiénes son tus clientes?" hint="Nilah usará el tono correcto para conectar con ellos">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: 'Mayormente mujeres', e: '👩' },
                        { v: 'Mayormente hombres', e: '👨' },
                        { v: 'Mixto, todo tipo', e: '👫' },
                        { v: 'Familias completas', e: '👨‍👩‍👧' },
                      ].map(({ v, e }) => (
                        <Chip key={v} emoji={e} label={v} selected={is('target_gender', v)} onClick={() => set('target_gender', v)} color="emerald" />
                      ))}
                    </div>
                  </Section>

                  <Section title="¿Qué edad tienen principalmente?" hint="Ajusta el vocabulario y ejemplos que usa Nilah">
                    <div className="flex flex-wrap gap-2">
                      {[
                        { v: 'Jóvenes 18-25', e: '🧑' },
                        { v: 'Adultos 25-40', e: '👩‍💼' },
                        { v: 'Maduros 40-60', e: '🧑‍🦳' },
                        { v: 'Todos los rangos', e: '🌈' },
                      ].map(({ v, e }) => (
                        <Chip key={v} emoji={e} label={v} selected={is('target_age', v)} onClick={() => set('target_age', v)} color="emerald" />
                      ))}
                    </div>
                  </Section>

                  <Section title="¿Cuáles son tus días más lentos? 📉" hint="Nilah creará campañas específicas para reactivar esos días">
                    <DayPicker value={briefData.weak_day || ''} onChange={v => set('weak_day', v)} />
                  </Section>
                </>
              )}

              {/* ── STEP 4: Objetivo ────────────────────────────── */}
              {step === 4 && (
                <>
                  <Section title="¿Cuál es tu mayor reto ahora mismo?" hint="Dile a Nilah en qué enfocarse para tus campañas">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { v: 'Atraer clientes nuevos que no me conocen', icon: <Zap size={18}/>, color: 'violet' },
                        { v: 'Recuperar clientes que dejaron de venir', icon: <RefreshCw size={18}/>, color: 'rose' },
                        { v: 'Vender más a los clientes que ya tengo', icon: <TrendingUp size={18}/>, color: 'emerald' },
                        { v: 'Fidelizar y crear clientes frecuentes', icon: <Heart size={18}/>, color: 'amber' },
                        { v: 'Llenar mi agenda en días tranquilos', icon: <Star size={18}/>, color: 'sky' },
                        { v: 'Vender servicios o productos específicos', icon: <ShoppingBag size={18}/>, color: 'sky' },
                      ].map(({ v, icon, color }) => {
                        const cardColors: Record<string, string> = {
                          violet: 'border-violet-200 bg-violet-50/60 dark:border-violet-500/20 dark:bg-violet-500/5',
                          rose:   'border-rose-200 bg-rose-50/60 dark:border-rose-500/20 dark:bg-rose-500/5',
                          emerald:'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/20 dark:bg-emerald-500/5',
                          amber:  'border-amber-200 bg-amber-50/60 dark:border-amber-500/20 dark:bg-amber-500/5',
                          sky:    'border-sky-200 bg-sky-50/60 dark:border-sky-500/20 dark:bg-sky-500/5',
                        };
                        const iconColors: Record<string, string> = {
                          violet: 'text-violet-600 dark:text-violet-400',
                          rose:   'text-rose-600 dark:text-rose-400',
                          emerald:'text-emerald-600 dark:text-emerald-400',
                          amber:  'text-amber-600 dark:text-amber-400',
                          sky:    'text-sky-600 dark:text-sky-400',
                        };
                        const active = is('main_challenge', v);
                        return (
                          <motion.button
                            key={v} type="button"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => set('main_challenge', v)}
                            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${active ? cardColors[color] + ' ring-2 ring-offset-1 ring-' + color + '-400' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-white/10 dark:bg-white/5'}`}
                          >
                            <span className={`mt-0.5 ${active ? iconColors[color] : 'text-gray-400'}`}>{icon}</span>
                            <span className={`text-sm font-semibold leading-snug ${active ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>{v}</span>
                            {active && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto shrink-0 text-green-500"><Check size={16} strokeWidth={3} /></motion.span>}
                          </motion.button>
                        );
                      })}
                    </div>
                    <CustomInput field="main_challenge" placeholder="O escribe tu reto personalizado…" briefData={briefData} set={set} textarea />
                  </Section>

                  <Section title="¿Cómo es la personalidad de tu marca? ✨" hint="Estas palabras definen el tono de los mensajes de Nilah">
                    <div className="flex flex-wrap gap-2">
                      {['Glamorosa', 'Natural & Eco', 'Moderna & Trendy', 'Relajante & Zen', 'Profesional', 'Divertida & Fresca', 'Exclusiva & Premium', 'Familiar & Cercana'].map(v => (
                        <Chip key={v} label={v}
                          selected={(briefData.brand_words || '').includes(v)}
                          onClick={() => {
                            const tags = briefData.brand_words ? briefData.brand_words.split(', ').filter(Boolean) : [];
                            const next = tags.includes(v) ? tags.filter((t: string) => t !== v) : [...tags, v];
                            set('brand_words', next.join(', '));
                          }}
                          color="sky"
                        />
                      ))}
                    </div>
                  </Section>

                  <Section title="Color predominante de tu marca 🎨" hint="Nilah lo usará como referencia visual en sus recomendaciones">
                    <div className="flex flex-wrap gap-3">
                      {BRAND_COLORS.map(({ label, value, hex }) => (
                        <motion.button
                          key={value}
                          type="button"
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => set('brand_color', value)}
                          title={label}
                          className={`relative h-10 w-10 rounded-2xl shadow-md transition-all duration-200 ${briefData.brand_color === value ? 'ring-2 ring-offset-2 ring-gray-700 dark:ring-white scale-110' : ''}`}
                          style={{ backgroundColor: hex }}
                        >
                          {briefData.brand_color === value && (
                            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
                              <Check size={16} strokeWidth={3} className={hex === '#1C1C1E' ? 'text-white' : 'text-gray-900'} />
                            </motion.span>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </Section>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 dark:border-white/5 dark:bg-[#18181b]">
          <button
            onClick={prev}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 ${step === 1 ? 'invisible' : ''}`}
          >
            <ChevronLeft size={16} /> Atrás
          </button>

          <div className="flex gap-2">
            {briefId && isLast && (
              <button
                disabled={savingBrief}
                onClick={async () => { await handleDeleteBrief(); onClose(); }}
                className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Eliminar
              </button>
            )}
            {isLast ? (
              <button
                onClick={onSave}
                disabled={savingBrief}
                className={`flex items-center gap-2 rounded-xl px-7 py-2.5 text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 ${stepColors[step - 1]}`}
              >
                {savingBrief ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {briefId ? 'Guardar' : 'Activar Nilah'}
              </button>
            ) : (
              <button
                onClick={next}
                className={`flex items-center gap-2 rounded-xl px-7 py-2.5 text-sm font-bold text-white shadow-lg transition-all ${stepColors[step - 1]}`}
              >
                Siguiente <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Helper Components ────────────────────────────────────────────
function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-base font-bold text-gray-900 dark:text-white">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function CustomInput({
  field, placeholder, briefData, set, textarea = false
}: { field: string; placeholder: string; briefData: any; set: (f: string, v: string) => void; textarea?: boolean }) {
  const cls = "mt-2 w-full rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-[#1a1a2e]";
  return textarea
    ? <textarea rows={2} className={cls} placeholder={placeholder} value={briefData[field] || ''} onChange={e => set(field, e.target.value)} />
    : <input className={cls} placeholder={placeholder} value={briefData[field] || ''} onChange={e => set(field, e.target.value)} />;
}
