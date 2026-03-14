export type CopilotActionType = 'SEND_SMS_CAMPAIGN' | 'EXECUTE_RESCUE_PLAN' | 'SEND_REMINDER';

export interface CopilotActionCardData {
  type: 'marketing' | 'alert' | 'goal' | 'retention' | 'engagement';
  title: string;
  description: string;
  actionLabel: string;
  triggerActionType: CopilotActionType;
  payload?: Record<string, any>;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'nilah';
  content: string;
  timestamp: string;
  actionCard?: CopilotActionCardData;
  sourceContext?: string;
}

export interface CopilotGoal {
  type: 'revenue' | 'appointments' | 'retention';
  target: number;
  current: number;
}

export interface CopilotBusinessContext {
  todaysAppointments: number;
  lastWeekRevenue: number;
  clientsAtRisk: number;
}

export interface CopilotIdentityContext {
  business_id: string;
  // Keep legacy field for compatibility while backend transitions.
  salonId?: string;
  user_id?: string;
  ownerName: string;
  currentGoal: CopilotGoal;
  businessContext: CopilotBusinessContext;
  conversationId?: string | null;
}

export interface CopilotTextRequest extends CopilotIdentityContext {
  userInput: string;
  interactionType: 'text';
}

export interface CopilotVoiceRequestMetadata extends CopilotIdentityContext {
  interactionType: 'voice';
  audioFormat?: string;
  durationMs?: number;
  transcriptHint?: string;
}

export interface CopilotExecuteRequest extends CopilotIdentityContext {
  triggerActionType: CopilotActionType;
  payload?: Record<string, any>;
  requestedBy?: string;
}

export interface CopilotConversationState {
  conversationId?: string;
  intent?: string;
  confidence?: number;
  [key: string]: any;
}

export interface CopilotResponse {
  message: string;
  actionCard?: CopilotActionCardData;
  conversationState?: CopilotConversationState;
  debug?: Record<string, any>;
}

export interface CopilotActionExecutionResult {
  success: boolean;
  message: string;
  data?: any;
  latencyMs: number;
}
