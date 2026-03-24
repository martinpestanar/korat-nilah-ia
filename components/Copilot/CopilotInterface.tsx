import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles, X } from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import CopilotActionCard from './CopilotActionCard';
import VoiceInputBar from './VoiceInputBar';

// Map of internal audience IDs → user-friendly names
// When the n8n AI returns audience IDs in text, we replace them for the user.
const AUDIENCE_ID_MAP: Record<string, string> = {
  'crm-vip': 'Clientas VIP 👑',
  'crm-fiel': 'Clientas Fieles 💎',
  'crm-regular': 'Regulares ⭐',
  'crm-casual': 'Casuales 💅',
  'crm-nuevas': 'Nuevas 🌱',
  'crm-nuevas-recientes': 'Nuevas Recientes',
  'crm-30': 'Ausentes 30 Días',
  'crm-perdidas': 'Clientas Perdidas',
  'crm-cumples': 'Cumpleañeras 🎂',
  'crm-resenas': 'Embajadoras 5★',
  'mkt-overdue': 'Retoques Vencidos ⏰',
  'mkt-points': 'Puntos Dormidos 🎁',
  'mkt-early': 'Early Adopters 🚀',
  'mkt-discount': 'Cazadoras de Ofertas 🏷️',
  'mkt-slowdays': 'Flexibles (Días Lentos) 📉',
  'mkt-churn': 'Riesgo de Fuga 🚨',
  'mkt-morning': 'Público Mañanero ☕',
  'mkt-afternoon': 'Público de Tarde ☀️',
  'mkt-night': 'After-Office 🌙',
  'mkt-tue-wed': 'Fieles Martes/Mier 📅',
  'mkt-primera-vez-facial': '1ª Vez Facial 🧖',
  'srv-cabello': 'Clientas de Cabello',
  'srv-cejas': 'Clientas de Cejas',
  'srv-facial': 'Clientas de Facial',
  'srv-pestanas': 'Clientas de Pestañas',
  'srv-manos': 'Clientas de Manos/Uñas',
  'srv-pies': 'Clientas de Pies/Pedicure',
};

const replaceAudienceIds = (text: string): string => {
  let result = text;
  Object.entries(AUDIENCE_ID_MAP).forEach(([id, name]) => {
    // Replace the ID when it appears as a standalone word (not part of a longer string)
    result = result.replace(new RegExp(`\\b${id.replace(/-/g, '[\\-]')}\\b`, 'gi'), name);
  });
  return result;
};

const renderFormattedContent = (content: string) => {
  if (!content) return null;
  // Normalize markdown **bold** to <b>bold</b>
  const normalized = content.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  
  // Split by <b> tag
  const parts = normalized.split(/(<b>.*?<\/b>)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('<b>') && part.endsWith('</b>')) {
      const innerText = part.slice(3, -4);
      return (
        <span key={index} className="font-bold text-amber-300 dark:text-amber-400 drop-shadow-md">
          {innerText}
        </span>
      );
    }
    // Handle <br> tags
    const subParts = part.split(/(<br\s*\/?>)/gi);
    return subParts.map((sub, subIdx) => {
      if (/^<br\s*\/?>$/i.test(sub)) return <br key={`${index}-${subIdx}`} />;
      return <span key={`${index}-${subIdx}`}>{sub}</span>;
    });
  });
};

const CopilotInterface: React.FC = () => {
  const {
    isOpen,
    closeCopilot,
    messages,
    sendText,
    sendVoice,
    requestActionExecution,
    pendingAction,
    cancelPendingAction,
    confirmAndExecuteAction,
    isProcessing,
    isListening,
    setListening,
  } = useCopilot();

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  const title = useMemo(() => (isProcessing ? 'Nilah analizando...' : 'Nilah Copilot'), [isProcessing]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCopilot}
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
          />

          <motion.section
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 140 }}
            className="absolute inset-x-0 bottom-0 top-10 mx-auto flex max-w-4xl flex-col rounded-t-3xl border border-white/15 bg-[#080A12]/95 shadow-2xl sm:top-8 sm:rounded-3xl"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              backgroundImage:
                'radial-gradient(circle at 15% -20%, rgba(120,119,198,0.28), transparent 40%), radial-gradient(circle at 100% 0%, rgba(56,189,248,0.20), transparent 35%)',
            }}
          >
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-white/25 sm:hidden" />

            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30">
                  <Bot size={18} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-white">{title}</h3>
                  <p className="text-[11px] text-gray-300">Asistente ejecutiva para ingresos, operacion y retencion</p>
                </div>
              </div>
              <button
                onClick={closeCopilot}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-300 hover:bg-white/20"
              >
                <X size={16} />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4">
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                      m.role === 'user'
                        ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25'
                        : 'border border-white/10 bg-white/5 text-gray-100'
                    }`}
                  >
                     <p className="whitespace-pre-wrap">{renderFormattedContent(m.role === 'nilah' ? replaceAudienceIds(m.content) : m.content)}</p>
                    {m.actionCard && (
                      <CopilotActionCard data={m.actionCard} onAction={requestActionExecution} />
                    )}
                  </div>
                </motion.div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-violet-200">
                    <Sparkles size={14} className="animate-pulse" />
                    Nilah esta construyendo la mejor jugada para hoy...
                  </div>
                </div>
              )}
            </div>

            {pendingAction && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mb-3 rounded-2xl border border-amber-300/25 bg-amber-500/10 p-3 text-xs text-amber-100"
              >
                <p className="font-semibold">Confirmar accion</p>
                <p className="mt-1">Vas a ejecutar: {pendingAction.title}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={cancelPendingAction} className="rounded-lg border border-white/20 px-3 py-1.5 text-gray-200">
                    Cancelar
                  </button>
                  <button onClick={confirmAndExecuteAction} className="rounded-lg bg-amber-400 px-3 py-1.5 font-bold text-black">
                    Confirmar y ejecutar
                  </button>
                </div>
              </motion.div>
            )}

            <div className="border-t border-white/10 p-3">
              <VoiceInputBar
                onSendText={async (text) => sendText(text, 'copilot_interface')}
                onSendVoice={async (blob, transcriptHint) => sendVoice(blob, transcriptHint, 'copilot_interface')}
                disabled={isProcessing}
                isProcessing={isProcessing}
                isListening={isListening}
                onListeningChange={setListening}
              />
            </div>
          </motion.section>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default CopilotInterface;
