/**
 * useRealtimeUpdates Hook
 * 
 * Hook para integrar actualizaciones en tiempo real en componentes React.
 * Conecta automáticamente con el WebSocket al montar y desconecta al desmontar.
 * 
 * Uso:
 * ```tsx
 * const { status, lastMessage } = useRealtimeUpdates({
 *   onCitaNueva: (data) => console.log('Nueva cita:', data),
 *   onClienteRescatado: (data) => refresh()
 * });
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { websocketService, WebSocketMessage, WebSocketStatus, WebSocketEventType } from '../services/websocket';

// ===========================================
// Types
// ===========================================

export interface RealtimeEventHandlers {
    onCitaNueva?: (payload: any) => void;
    onCitaActualizada?: (payload: any) => void;
    onClienteNuevo?: (payload: any) => void;
    onClienteRescatado?: (payload: any) => void;
    onCanjeNuevo?: (payload: any) => void;
    onCanjeEntregado?: (payload: any) => void;
    onRecordatorioEnviado?: (payload: any) => void;
    onDashboardRefresh?: () => void;
    onAnyMessage?: (message: WebSocketMessage) => void;
}

interface UseRealtimeUpdatesResult {
    status: WebSocketStatus;
    lastMessage: WebSocketMessage | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
}

// ===========================================
// Event Type to Handler Mapping
// ===========================================

const eventTypeToHandler: Record<WebSocketEventType, keyof RealtimeEventHandlers> = {
    'cita_nueva': 'onCitaNueva',
    'cita_actualizada': 'onCitaActualizada',
    'cliente_nuevo': 'onClienteNuevo',
    'cliente_rescatado': 'onClienteRescatado',
    'canje_nuevo': 'onCanjeNuevo',
    'canje_entregado': 'onCanjeEntregado',
    'recordatorio_enviado': 'onRecordatorioEnviado',
    'dashboard_refresh': 'onDashboardRefresh',
    'connection_status': 'onAnyMessage'
};

// ===========================================
// Hook Implementation
// ===========================================

export function useRealtimeUpdates(handlers: RealtimeEventHandlers = {}): UseRealtimeUpdatesResult {
    const [status, setStatus] = useState<WebSocketStatus>('disconnected');
    const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

    // Usar ref para los handlers para evitar re-suscripción en cada render
    const handlersRef = useRef(handlers);
    handlersRef.current = handlers;

    // Handler de mensajes
    const handleMessage = useCallback((message: WebSocketMessage) => {
        setLastMessage(message);

        // Llamar al handler específico del tipo de evento
        const handlerKey = eventTypeToHandler[message.type];
        if (handlerKey && handlersRef.current[handlerKey]) {
            const handler = handlersRef.current[handlerKey];
            if (handler) {
                if (handlerKey === 'onDashboardRefresh') {
                    (handler as () => void)();
                } else {
                    (handler as (payload: any) => void)(message.payload);
                }
            }
        }

        // Siempre llamar onAnyMessage si está definido
        if (handlersRef.current.onAnyMessage) {
            handlersRef.current.onAnyMessage(message);
        }
    }, []);

    // Conectar y configurar suscripciones al montar
    useEffect(() => {
        // Suscribirse a cambios de estado
        const unsubscribeStatus = websocketService.onStatusChange(setStatus);

        // Suscribirse a mensajes
        const unsubscribeMessages = websocketService.subscribe(handleMessage);

        // Conectar
        websocketService.connect();

        // Cleanup al desmontar
        return () => {
            unsubscribeStatus();
            unsubscribeMessages();
            // No desconectamos aquí porque otros componentes podrían estar usando el WebSocket
        };
    }, [handleMessage]);

    const connect = useCallback(() => {
        websocketService.connect();
    }, []);

    const disconnect = useCallback(() => {
        websocketService.disconnect();
    }, []);

    return {
        status,
        lastMessage,
        isConnected: status === 'connected',
        connect,
        disconnect
    };
}

// ===========================================
// Simple Connection Hook (sin handlers)
// ===========================================

export function useWebSocketStatus(): WebSocketStatus {
    const [status, setStatus] = useState<WebSocketStatus>('disconnected');

    useEffect(() => {
        const unsubscribe = websocketService.onStatusChange(setStatus);
        return unsubscribe;
    }, []);

    return status;
}

// ===========================================
// Export Default
// ===========================================

export default useRealtimeUpdates;
