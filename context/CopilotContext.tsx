import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
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

export const CopilotProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([initialWelcomeMessage()]);
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
        ? `Listo. ${action.actionLabel} completado en ${result.latencyMs} ms.`
        : `No pude completar la accion: ${result.message}`,
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
  }, [appendMessage, conversationId, identityPayload.business_id, identityPayload.ownerName, pendingAction, user?.email]);

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
