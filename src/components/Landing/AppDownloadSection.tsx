import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Share2, Apple, Bot, CheckCircle2 } from 'lucide-react';

type OS = 'ios' | 'android' | 'unknown';

function detectOS(): OS {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'unknown';
}

// ─── iOS Step-by-step guide ────────────────────────────────────────────────
const iosSteps = [
  {
    icon: '🌐',
    title: 'Abre esta página en Safari',
    desc: 'Asegúrate de estar en Safari (no Chrome ni otro navegador).',
  },
  {
    icon: '📤',
    title: 'Toca el botón Compartir',
    desc: 'Es el ícono de cajita con flecha arriba, en la barra inferior de Safari.',
  },
  {
    icon: '➕',
    title: 'Selecciona "Añadir a pantalla de inicio"',
    desc: 'Desplázate en el menú hasta encontrar esta opción.',
  },
  {
    icon: '✅',
    title: '¡Listo! Nilah aparece como app nativa',
    desc: 'Sin App Store. Sin pasos extra. Abre Nilah desde tu pantalla de inicio.',
  },
];

const IOSGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s + 1) % iosSteps.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="flex items-center justify-center gap-2 mb-6">
        {iosSteps.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`transition-all duration-300 rounded-full ${
              i === activeStep ? 'w-6 h-2 bg-violet-500' : 'w-2 h-2 bg-gray-300 dark:bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 p-6 min-h-[160px]">
        <div key={activeStep} className="flex flex-col items-center text-center gap-3">
          <span className="text-5xl">{iosSteps[activeStep].icon}</span>
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            Paso {activeStep + 1} de {iosSteps.length}
          </p>
          <h4 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
            {iosSteps[activeStep].title}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {iosSteps[activeStep].desc}
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-white/5">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-[2800ms] ease-linear"
            style={{ width: `${((activeStep + 1) / iosSteps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {iosSteps.map((step, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
              i === activeStep
                ? 'bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30'
                : 'hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <span
              className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < activeStep
                  ? 'bg-emerald-500 text-white'
                  : i === activeStep
                  ? 'bg-violet-500 text-white'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
              }`}
            >
              {i < activeStep ? '✓' : i + 1}
            </span>
            <span
              className={`text-sm font-medium ${
                i === activeStep
                  ? 'text-violet-700 dark:text-violet-300'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {step.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Android APK block ─────────────────────────────────────────────────────
// Replace with your actual APK URL once generated via pwabuilder.com
const APK_DOWNLOAD_URL = '/nilah-app.apk';

const AndroidDownload: React.FC = () => {
  const [tapped, setTapped] = useState(false);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-violet-500/30">
          <Bot size={48} className="text-white" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
          <CheckCircle2 size={18} className="text-white" />
        </div>
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-gray-900 dark:text-white">Nilah IA</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Versión Android · ~3 MB</p>
      </div>

      <a
        href={APK_DOWNLOAD_URL}
        download="nilah-ia.apk"
        onClick={() => { setTapped(true); setTimeout(() => setTapped(false), 3000); }}
        className="w-full flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 px-6 text-white font-bold shadow-lg shadow-violet-500/30 active:scale-95 transition-transform"
      >
        <Download size={20} />
        {tapped ? 'Descargando…' : 'Descargar para Android'}
      </a>

      <div className="w-full space-y-2.5">
        {[
          { n: '1', text: 'Toca el botón de descarga' },
          { n: '2', text: 'Abre el archivo .apk descargado' },
          { n: '3', text: 'Toca "Instalar" (puede pedir permiso una vez)' },
          { n: '4', text: '¡Listo! Abre Nilah desde tu pantalla de inicio' },
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {s.n}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{s.text}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Android permite instalar apps directamente sin Play Store. Seguro y sin pasos extra.
      </p>
    </div>
  );
};

// ─── Main exported section ─────────────────────────────────────────────────
const AppDownloadSection: React.FC = () => {
  const [os, setOS] = useState<OS>('unknown');
  const [tab, setTab] = useState<'android' | 'ios'>('android');

  useEffect(() => {
    const detected = detectOS();
    setOS(detected);
    setTab(detected === 'ios' ? 'ios' : 'android');
  }, []);

  return (
    <section id="descargar-app" className="py-24 bg-white dark:bg-[#0A0A0A] overflow-hidden">
      <div className="mx-auto max-w-5xl px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-violet-200/50 bg-violet-50 dark:border-violet-500/30 dark:bg-violet-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            <Smartphone size={14} />
            Descarga la App
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
            Lleva Nilah en tu bolsillo
          </h2>
          <p className="mt-3 text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Sin App Store. Sin esperar aprobaciones. Instálala en segundos directamente en tu celular.
          </p>
        </div>

        {/* OS Tabs */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/5 p-1">
            <button
              onClick={() => setTab('android')}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                tab === 'android'
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">🤖</span> Android
              {os === 'android' && (
                <span className="ml-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Tu dispositivo
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('ios')}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                tab === 'ios'
                  ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Apple size={15} /> iPhone
              {os === 'ios' && (
                <span className="ml-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Tu dispositivo
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content card */}
        <div className="relative rounded-3xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-8 md:p-12 overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 w-64 h-64 rounded-full bg-violet-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="relative z-10">
            {tab === 'android' ? <AndroidDownload /> : <IOSGuide />}
          </div>
        </div>

        {/* WhatsApp fallback */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            ¿Prefieres que te enviemos el link de instalación por WhatsApp?
          </p>
          <a
            href="https://wa.me/51999999999?text=Hola!%20Por%20favor%20env%C3%ADame%20el%20link%20para%20instalar%20Nilah%20IA%20en%20mi%20celular"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-6 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm"
          >
            <Share2 size={16} />
            Enviarme el link por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
};

export default AppDownloadSection;
