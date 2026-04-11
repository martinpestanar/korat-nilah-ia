import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, Sparkles, X } from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import CopilotActionCard from './CopilotActionCard';
import VoiceInputBar from './VoiceInputBar';

// ── Pattern ───────────────────────────────────────────────────────
const DOODLE_PATTERN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='none' stroke='%239E8070' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' opacity='0.13'%3E%3Cg transform='translate(25,30) rotate(25)'%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Cline x1='4' y1='0' x2='22' y2='12'/%3E%3Ccircle cx='0' cy='8' r='4'/%3E%3Cline x1='4' y1='8' x2='22' y2='-4'/%3E%3C/g%3E%3Cpath d='M80,15 C80,15 77,9 72,9 C67,9 64,14 64,18 C64,28 80,37 80,37 C80,37 96,28 96,18 C96,14 93,9 88,9 C83,9 80,15 80,15Z'/%3E%3Cg transform='translate(200,40)'%3E%3Crect x='0' y='0' width='40' height='7' rx='2'/%3E%3Cline x1='5' y1='7' x2='5' y2='17'/%3E%3Cline x1='10' y1='7' x2='10' y2='20'/%3E%3Cline x1='15' y1='7' x2='15' y2='17'/%3E%3Cline x1='20' y1='7' x2='20' y2='20'/%3E%3Cline x1='25' y1='7' x2='25' y2='17'/%3E%3Cline x1='30' y1='7' x2='30' y2='20'/%3E%3Cline x1='35' y1='7' x2='35' y2='17'/%3E%3C/g%3E%3Cg transform='translate(140,110)'%3E%3Ccircle cx='0' cy='-12' r='7'/%3E%3Ccircle cx='11' cy='-6' r='7'/%3E%3Ccircle cx='11' cy='6' r='7'/%3E%3Ccircle cx='0' cy='12' r='7'/%3E%3Ccircle cx='-11' cy='6' r='7'/%3E%3Ccircle cx='-11' cy='-6' r='7'/%3E%3Ccircle cx='0' cy='0' r='5'/%3E%3C/g%3E%3Cpath d='M265,85 L268,76 L271,85 L280,85 L273,91 L276,100 L268,94 L261,100 L264,91 L257,85Z'/%3E%3Cg transform='translate(40,160) rotate(-10)'%3E%3Crect x='4' y='12' width='13' height='18' rx='1'/%3E%3Cpath d='M4,12 L10,2 L17,12Z'/%3E%3Crect x='1' y='28' width='19' height='7' rx='2'/%3E%3C/g%3E%3Cpath d='M235,155 Q255,135 250,150 Q245,165 230,160 Q215,155 220,140 Q225,125 245,125'/%3E%3Cpath d='M80,240 L83,231 L86,240 L95,240 L88,246 L91,255 L83,249 L76,255 L79,246 L72,240Z'/%3E%3Cpath d='M200,210 C200,210 197,204 192,204 C187,204 184,209 184,213 C184,223 200,232 200,232 C200,232 216,223 216,213 C216,209 213,204 208,204 C203,204 200,210 200,210Z'/%3E%3Cg transform='translate(248,242) rotate(-15)'%3E%3Ccircle cx='0' cy='0' r='4'/%3E%3Cline x1='4' y1='0' x2='20' y2='11'/%3E%3Ccircle cx='0' cy='8' r='4'/%3E%3Cline x1='4' y1='8' x2='20' y2='-3'/%3E%3C/g%3E%3Cpath d='M10,278 Q25,263 40,278 T70,278'/%3E%3Cpath d='M198,268 Q213,253 228,268 T258,268'/%3E%3Cpath d='M35,85 L38,76 L41,85 L50,85 L43,91 L46,100 L38,94 L31,100 L34,91 L27,85Z'/%3E%3Ccircle cx='128' cy='58' r='3' fill='%239E8070'/%3E%3Ccircle cx='28' cy='118' r='2' fill='%239E8070'/%3E%3Ccircle cx='268' cy='188' r='2.5' fill='%239E8070'/%3E%3Ccircle cx='143' cy='278' r='3' fill='%239E8070'/%3E%3Ccircle cx='175' cy='170' r='2' fill='%239E8070'/%3E%3C/svg%3E")`;

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
        <span key={index} className="font-bold text-violet-700 dark:text-violet-400 drop-shadow-sm">
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
            className="absolute inset-0 bg-gray-900/40 dark:bg-black/65 backdrop-blur-[2px]"
          />

          <motion.section
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 140 }}
            className="absolute inset-x-0 bottom-0 top-10 mx-auto flex max-w-4xl flex-col rounded-t-3xl border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0B0B12]/95 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.15)] dark:shadow-2xl sm:top-8 sm:rounded-3xl overflow-hidden"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-gray-300 dark:bg-white/25 sm:hidden absolute left-1/2 -translate-x-1/2 z-20" />

            {/* ── HEADER ── */}
            <header className="flex items-center justify-between border-b border-gray-100 dark:border-[#2A2640] bg-white/80 dark:bg-[#1A1825]/90 backdrop-blur-md px-4 py-3 sm:py-4 z-10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20">
                  <Bot size={20} />
                </span>
                <div>
                  <h3 className="text-[15px] font-black text-gray-900 dark:text-white leading-tight">{title}</h3>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Asistente ejecutiva para ingresos, operación y retención</p>
                </div>
              </div>
              <button
                onClick={closeCopilot}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors shadow-sm"
              >
                <X size={18} />
              </button>
            </header>

            {/* ── CHAT AREA ── */}
            <div 
              ref={listRef} 
              className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 sm:px-4 py-4 bg-repeat relative"
              style={{
                backgroundColor: 'var(--color-chat-bg, #E9EDEF)',
                backgroundImage: DOODLE_PATTERN,
                backgroundSize: '300px 300px',
              }}
            >
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className={`group flex relative z-10 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-1.5 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] text-[14.5px] leading-[1.45] ${
                      m.role === 'user'
                        ? 'bg-bubble-out-bg text-bubble-out-text rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-[4px]'
                        : 'bg-bubble-in-bg text-bubble-in-text rounded-tl-[4px] rounded-tr-2xl rounded-bl-2xl rounded-br-2xl'
                    }`}
                  >
                     <p className="whitespace-pre-wrap px-1">{renderFormattedContent(m.role === 'nilah' ? replaceAudienceIds(m.content) : m.content)}</p>
                    {m.actionCard && (
                      <div className="mt-2">
                        <CopilotActionCard data={m.actionCard} onAction={requestActionExecution} />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isProcessing && (
                <div className="flex justify-start relative z-10">
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-violet-100 dark:border-violet-500/30 bg-violet-50 dark:bg-violet-500/10 px-4 py-2.5 text-[13px] font-medium text-violet-700 dark:text-violet-300 shadow-sm rounded-bl-sm">
                    <Sparkles size={16} className="animate-pulse text-violet-500" />
                    Nilah está construyendo la mejor jugada para hoy...
                  </div>
                </div>
              )}
            </div>

            {/* ── ACTION CONFIRMATION ── */}
            {pendingAction && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-4 mb-3 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 text-[13px] text-amber-900 dark:text-amber-100 shadow-sm relative z-10"
              >
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-500/30 flex items-center justify-center"><Sparkles size={12} className="text-amber-700 dark:text-amber-300" /></div>
                    <p className="font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Confirmar acción</p>
                </div>
                <p className="mt-1 font-medium leading-relaxed">Vas a ejecutar: <strong className="font-black text-amber-900 dark:text-amber-100">{pendingAction.title}</strong></p>
                <div className="mt-4 flex gap-2">
                  <button onClick={cancelPendingAction} className="flex-1 rounded-xl border border-gray-300 dark:border-white/20 px-3 py-2.5 font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                    Descartar
                  </button>
                  <button onClick={confirmAndExecuteAction} className="flex-1 rounded-xl bg-amber-400 hover:bg-amber-500 px-3 py-2.5 font-black text-amber-950 transition-colors shadow-sm">
                    Confirmar y ejecutar
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── INPUT ── */}
            <div className="border-t border-gray-100 dark:border-[#2A2640] p-3 sm:p-4 bg-white/90 dark:bg-[#1A1825]/90 backdrop-blur-md relative z-10">
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
