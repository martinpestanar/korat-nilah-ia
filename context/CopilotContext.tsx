import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CopilotActionCardData,
  CopilotMessage,
  CopilotTextRequest,
  CopilotVoiceRequestMetadata,
} from '../types/copilot';
import { executeAction, sendTextMessage, sendVoiceMessage } from '../services/copilot';
import { useAuth } from './AuthContext';

interface OpenCopilotContext {
  sourceContext?: string;
  seedPrompt?: string;
}

interface CopilotContextType {
  isOpen: boolean;
  isListening: boolean;
  isProcessing: boolean;
  messages: CopilotMessage[];
  pendingAction: CopilotActionCardData | null;
  openCopilot: (context?: OpenCopilotContext) => void;
  closeCopilot: () => void;
  sendText: (text: string, sourceContext?: string) => Promise<void>;
  sendVoice: (audioBlob: Blob, transcriptHint?: string, sourceContext?: string) => Promise<void>;
  requestActionExecution: (actionCard: CopilotActionCardData) => void;
  cancelPendingAction: () => void;
  confirmAndExecuteAction: () => Promise<void>;
  setListening: (value: boolean) => void;
}

const CopilotContext = createContext<CopilotContextType | undefined>(undefined);

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const initialWelcomeMessage = (): CopilotMessage => ({
  id: makeId(),
  role: 'nilah',
  content: 'Soy Nilah Copilot. Te ayudo a mantener tu salon saludable y ejecutar acciones concretas en un clic.',
  timestamp: new Date().toISOString(),
});

const LOCAL_STORAGE_KEY = 'korat_copilot_history_v2';
const MAX_HISTORY = 40;
const EXPIRATION_HOURS = 12;

export const CopilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  
  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    if (typeof window === 'undefined') return [initialWelcomeMessage()];
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.data && Array.isArray(parsed.data)) {
          const hoursPassed = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
          if (hoursPassed < EXPIRATION_HOURS) {
            return parsed.data;
          }
        }
      }
    } catch (e) {
      console.warn('Error load copilot history', e);
    }
    return [initialWelcomeMessage()];
  });

  useEffect(() => {
    if (messages.length > 0) {
      const toSave = messages.slice(-MAX_HISTORY);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        data: toSave,
        timestamp: Date.now()
      }));
    }
  }, [messages]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingAction, setPendingAction] = useState<CopilotActionCardData | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const identityPayload = useMemo<Omit<CopilotTextRequest, 'userInput' | 'interactionType'>>(() => {
    const fallbackBusinessId = localStorage.getItem('korat_business_id') || 'unknown-business';
    const business_id = user?.business_id || fallbackBusinessId;

    return {
      business_id,
      salonId: business_id,
      user_id: user?.id ? String(user.id) : user?.email,
      ownerName: user?.name || 'Duena',
      currentGoal: { type: 'revenue', target: 5000, current: 3200 },
      businessContext: {
        todaysAppointments: 5,
        lastWeekRevenue: 4800,
        clientsAtRisk: 24,
      },
      conversationId,
    };
  }, [conversationId, user]);

  const appendMessage = useCallback((message: CopilotMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const openCopilot = useCallback((context?: OpenCopilotContext) => {
    setIsOpen(true);

    if (context?.seedPrompt) {
      appendMessage({
        id: makeId(),
        role: 'nilah',
        content: context.seedPrompt,
        timestamp: new Date().toISOString(),
        sourceContext: context.sourceContext,
      });
    }
  }, [appendMessage]);

  const closeCopilot = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  const sendText = useCallback(async (text: string, sourceContext?: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage({
      id: makeId(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
      sourceContext,
    });

    setIsProcessing(true);
    try {
      const response = await sendTextMessage({
        ...identityPayload,
        userInput: trimmed,
        interactionType: 'text',
      });

      if (response.conversationState?.conversationId) {
        setConversationId(response.conversationState.conversationId);
      }

      appendMessage({
        id: makeId(),
        role: 'nilah',
        content: response.message,
        timestamp: new Date().toISOString(),
        actionCard: response.actionCard,
        sourceContext,
      });
    } catch (error: any) {
      appendMessage({
        id: makeId(),
        role: 'nilah',
        content: `No pude responder en este momento: ${error?.message || 'error desconocido'}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [appendMessage, identityPayload]);

  const sendVoice = useCallback(async (audioBlob: Blob, transcriptHint?: string, sourceContext?: string) => {
    setIsProcessing(true);
    try {
      const metadata: CopilotVoiceRequestMetadata = {
        ...identityPayload,
        interactionType: 'voice',
        transcriptHint,
        audioFormat: audioBlob.type || 'audio/webm',
      };

      const response = await sendVoiceMessage(audioBlob, metadata);

      if (response.conversationState?.conversationId) {
        setConversationId(response.conversationState.conversationId);
      }

      if (transcriptHint) {
        appendMessage({
          id: makeId(),
          role: 'user',
          content: transcriptHint,
          timestamp: new Date().toISOString(),
          sourceContext,
        });
      }

      appendMessage({
        id: makeId(),
        role: 'nilah',
        content: response.message,
        timestamp: new Date().toISOString(),
        actionCard: response.actionCard,
        sourceContext,
      });
    } catch (error: any) {
      appendMessage({
        id: makeId(),
        role: 'nilah',
        content: `No pude procesar el audio: ${error?.message || 'error desconocido'}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsProcessing(false);
      setIsListening(false);
    }
  }, [appendMessage, identityPayload]);

  const requestActionExecution = useCallback((actionCard: CopilotActionCardData) => {
    setPendingAction(actionCard);
  }, []);

  const cancelPendingAction = useCallback(() => {
    setPendingAction(null);
  }, []);

  const confirmAndExecuteAction = useCallback(async () => {
    if (!pendingAction) return;

    setIsProcessing(true);
    const action = pendingAction;
    setPendingAction(null);

    // Interceptar generación de campañas para pasarlas por Tuning Studio
    if (action.triggerActionType === 'SEND_SMS_CAMPAIGN' || action.triggerActionType === 'SEND_FLASH_CAMPAIGN' || action.triggerActionType === 'marketing') {
      setIsProcessing(false);
      setIsOpen(false);
      
      appendMessage({
        id: makeId(),
        role: 'nilah',
        content: '¡Excelente elección! Redirigiéndote al área de Marketing para que revisemos el copy final antes de enviar ✨',
        timestamp: new Date().toISOString(),
      });

      navigate('/nilah/app/marketing', {
        state: {
          openTuningModal: true,
          tuningPayload: action.payload,
          tuningTitle: action.title
        }
      });
      return;
    }

    const result = await executeAction(action.triggerActionType, action.payload || {}, {
      business_id: identityPayload.business_id,
      conversationId,
      requestedBy: user?.email,
      ownerName: identityPayload.ownerName,
    });

    appendMessage({
      id: makeId(),
      role: 'nilah',
      content: result.success
        ? `¡Hecho! ✨ **${action.actionLabel}** ejecutada exitosamente.`
        : `Uy, tuve un problema al completar la acción: ${result.message}`,
      timestamp: new Date().toISOString(),
    });

    console.log('[Nilah Copilot] action execution telemetry', {
      action: action.triggerActionType,
      success: result.success,
      latencyMs: result.latencyMs,
      conversationId,
      business_id: identityPayload.business_id,
    });

    setIsProcessing(false);
  }, [appendMessage, conversationId, identityPayload.business_id, identityPayload.ownerName, pendingAction, user?.email, navigate]);

  const value = useMemo(() => ({
    isOpen,
    isListening,
    isProcessing,
    messages,
    pendingAction,
    openCopilot,
    closeCopilot,
    sendText,
    sendVoice,
    requestActionExecution,
    cancelPendingAction,
    confirmAndExecuteAction,
    setListening: setIsListening,
  }), [
    isOpen,
    isListening,
    isProcessing,
    messages,
    pendingAction,
    openCopilot,
    closeCopilot,
    sendText,
    sendVoice,
    requestActionExecution,
    cancelPendingAction,
    confirmAndExecuteAction,
  ]);

  return <CopilotContext.Provider value={value}>{children}</CopilotContext.Provider>;
};

export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within CopilotProvider');
  }
  return context;
};
