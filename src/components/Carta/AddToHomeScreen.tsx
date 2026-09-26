/**
 * AddToHomeScreen.tsx
 * "App Silenciosa" — Guarda la Carta Interactiva en tu Pantalla de Inicio.
 *
 * Flujo:
 *  - Aparece como bottom-sheet elegante tras 15s de visita.
 *  - Detecta iOS (Safari) vs Android/Chrome para instrucciones nativas correctas.
 *  - Desktop: ofrece copiar el link.
 *  - Incentivo: S/. 10 de bono al mostrar la carta guardada en la próxima cita.
 *  - Se puede descartar; no vuelve a aparecer en 7 días (localStorage).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check, Copy, MessageCircle } from 'lucide-react';

type DeviceType = 'ios' | 'android' | 'desktop' | 'pwa';

interface Props {
  salonNombre: string;
  colorPrimario?: string;
  businessId?: string;
}

const STORAGE_KEY = 'nilah_aths_dismissed_until';

const detectDevice = (): DeviceType => {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia('(display-mode: standalone)').matches) return 'pwa';
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
};

const shouldShow = (): boolean => {
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (!val) return true;
    return Date.now() > Number(val);
  } catch { return true; }
};

const markDismissed = () => {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
  } catch {/* ignore */}
};

export const AddToHomeScreen: React.FC<Props> = ({
  salonNombre,
  colorPrimario = '#f43f5e',
  businessId,
}) => {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<DeviceType>('desktop');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'prompt' | 'ios_guide' | 'android_guide'>('prompt');

  useEffect(() => {
    if (!businessId) return;
    const dev = detectDevice();
    setDevice(dev);
    if (dev === 'pwa') return;
    if (!shouldShow()) return;
    const timer = setTimeout(() => setVisible(true), 15_000);
    return () => clearTimeout(timer);
  }, [businessId]);

  const dismiss = useCallback(() => {
    setVisible(false);
    markDismissed();
  }, []);

  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(pageUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsAppSave = () => {
    const text = `📲 Guardé la carta de *${salonNombre}* para ver sus promos y precios cuando quiera:\n${pageUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    dismiss();
  };

  const IOSGuide = () => (
    <motion.div key="ios" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pasos en Safari (iPhone/iPad)</p>
      {[
        { n: 1, e: '📤', t: 'Toca el ícono de Compartir (cuadrito con flecha) en la barra inferior de Safari.' },
        { n: 2, e: '⬇️', t: 'Desliza hacia abajo y toca "Añadir a la pantalla de inicio".' },
        { n: 3, e: '✏️', t: `Confirma el nombre "${salonNombre}" y toca "Añadir".` },
        { n: 4, e: '🎉', t: '¡Listo! Tendrás el ícono del salón en tu pantalla de inicio.' },
      ].map(s => (
        <div key={s.n} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: colorPrimario }}>
            {s.n}
          </div>
          <p className="text-xs text-gray-700 leading-relaxed pt-0.5"><span className="mr-1">{s.e}</span>{s.t}</p>
        </div>
      ))}
      <button onClick={dismiss} className="w-full py-2.5 rounded-2xl text-xs font-black text-white transition-all active:scale-95" style={{ background: colorPrimario }}>
        ¡Entendido, ya lo guardé! ✓
      </button>
    </motion.div>
  );

  const AndroidGuide = () => (
    <motion.div key="android" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pasos en Chrome (Android)</p>
      {[
        { n: 1, e: '⋮', t: 'Toca el menú de 3 puntos en la esquina superior derecha de Chrome.' },
        { n: 2, e: '📲', t: 'Toca "Añadir a pantalla de inicio" o "Instalar app".' },
        { n: 3, e: '✓', t: 'Confirma en el popup y listo.' },
        { n: 4, e: '🎉', t: '¡El ícono del salón aparece en tu pantalla principal!' },
      ].map(s => (
        <div key={s.n} className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0" style={{ background: colorPrimario }}>
            {s.n}
          </div>
          <p className="text-xs text-gray-700 leading-relaxed pt-0.5"><span className="mr-1 font-bold">{s.e}</span>{s.t}</p>
        </div>
      ))}
      <button onClick={dismiss} className="w-full py-2.5 rounded-2xl text-xs font-black text-white transition-all active:scale-95" style={{ background: colorPrimario }}>
        ¡Entendido, ya lo guardé! ✓
      </button>
    </motion.div>
  );

  const MainPrompt = () => (
    <motion.div key="prompt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-2xl shadow-md shrink-0" style={{ background: colorPrimario }}>
          📲
        </div>
        <div>
          <p className="text-sm font-black text-gray-900 leading-tight">¡Ten las promos a 1 toque!</p>
          <p className="text-xs text-gray-500 mt-0.5 leading-snug">
            Guarda la carta de <span className="font-bold text-gray-700">{salonNombre}</span> en tu pantalla y consulta ofertas, precios y citas cuando quieras.
          </p>
        </div>
      </div>

      {/* Badge de incentivo */}
      <div className="flex items-center gap-2 p-3 rounded-2xl border" style={{ background: `${colorPrimario}12`, borderColor: `${colorPrimario}35` }}>
        <span className="text-xl shrink-0">🎁</span>
        <p className="text-xs text-gray-700 leading-snug">
          <span className="font-black" style={{ color: colorPrimario }}>Bono exclusiva:</span>{' '}
          Guarda la carta y muéstrasela a tu estilista para recibir{' '}
          <span className="font-black">S/. 10 de descuento</span> en tu próxima cita.
        </p>
      </div>

      <div className="space-y-2">
        {(device === 'ios' || device === 'android') && (
          <button
            onClick={() => setStep(device === 'ios' ? 'ios_guide' : 'android_guide')}
            className="w-full py-3 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            style={{ background: colorPrimario }}
          >
            <Plus size={15} />
            Guardar en mi pantalla de inicio
          </button>
        )}

        {device === 'desktop' && (
          <button
            onClick={handleCopyLink}
            className="w-full py-3 rounded-2xl text-xs font-black text-white flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
            style={{ background: colorPrimario }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? '¡Link copiado!' : 'Copiar link de la carta'}
          </button>
        )}

        <button
          onClick={handleWhatsAppSave}
          className="w-full py-3 rounded-2xl text-xs font-black border flex items-center justify-center gap-2 active:scale-95 transition-all"
          style={{ borderColor: '#25D366', color: '#128C7E', background: '#f0fdf4' }}
        >
          <MessageCircle size={15} className="text-green-600" />
          Enviarme el link a mi WhatsApp
        </button>

        <button onClick={dismiss} className="w-full py-2 text-[11px] font-bold text-gray-400 hover:text-gray-600 transition-colors text-center">
          Ahora no, gracias
        </button>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            key="aths-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
          />
          <motion.div
            key="aths-sheet"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 inset-x-0 z-[70] max-w-lg mx-auto"
          >
            <div className="bg-white rounded-t-[32px] shadow-2xl px-5 pt-5 pb-8 relative border-t border-gray-100">
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
              <button onClick={dismiss} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all">
                <X size={16} />
              </button>
              <AnimatePresence mode="wait">
                {step === 'prompt' && <MainPrompt key="p" />}
                {step === 'ios_guide' && <IOSGuide key="i" />}
                {step === 'android_guide' && <AndroidGuide key="a" />}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AddToHomeScreen;
