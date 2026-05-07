/**
 * Korat MVP - Real-time WebSocket Service
 * 
 * Servicio para actualizaciones en tiempo real via WebSocket.
 * Permite recibir notificaciones instantáneas sobre:
 * - Nuevas citas
 * - Cambios de estado de citas
 * - Nuevos clientes
 * - Mensajes de rescate enviados
 * - Canjes de premios
 */

// ===========================================
// Types
// ===========================================

export type WebSocketEventType =
    | 'cita_nueva'
    | 'cita_actualizada'
    | 'cliente_nuevo'
    | 'cliente_rescatado'
    | 'canje_nuevo'
    | 'canje_entregado'
    | 'recordatorio_enviado'
    | 'dashboard_refresh'
    | 'connection_status';

export interface WebSocketMessage {
    type: WebSocketEventType;
    payload: any;
    timestamp: string;
}

export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (status: WebSocketStatus) => void;

// ===========================================
// WebSocket Manager Class
// ===========================================

class WebSocketManager {
    private ws: WebSocket | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    private statusHandlers: Set<StatusHandler> = new Set();
    private status: WebSocketStatus = 'disconnected';
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000; // 3 segundos
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    // URL del WebSocket (configurable vía .env)
    private wsUrl: string;

    constructor() {
        // Usar el mismo dominio que la API, pero con protocolo ws/wss
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
        const domain = apiUrl.replace(/^https?:\/\//, '').replace('/webhook', '');
        this.wsUrl = import.meta.env.VITE_WS_URL || `${wsProtocol}://${domain}/ws/realtime`;


    }

    // ===========================================
    // Connection Management
    // ===========================================

    connect(): void {
        if (this.ws?.readyState === WebSocket.OPEN) {

            return;
        }

        if (this.ws?.readyState === WebSocket.CONNECTING) {

            return;
        }

        this.updateStatus('connecting');


        try {
            this.ws = new WebSocket(this.wsUrl);

            this.ws.onopen = () => {

                this.updateStatus('connected');
                this.reconnectAttempts = 0;
                this.startHeartbeat();
            };

            this.ws.onmessage = (event) => {
                try {
                    const message: WebSocketMessage = JSON.parse(event.data);

                    this.notifyHandlers(message);
                } catch (error) {
                    console.warn('⚠️ Error parseando mensaje WebSocket:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateStatus('error');
            };

            this.ws.onclose = (event) => {

                this.updateStatus('disconnected');
                this.stopHeartbeat();
                this.scheduleReconnect();
            };

        } catch (error) {
            console.error('❌ Error creando WebSocket:', error);
            this.updateStatus('error');
            this.scheduleReconnect();
        }
    }

    disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopHeartbeat();

        if (this.ws) {
            this.ws.close(1000, 'Desconexión manual');
            this.ws = null;
        }
        this.updateStatus('disconnected');

    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {

            return;
        }

        if (this.reconnectTimer) return;

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);



        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, delay);
    }

    // ===========================================
    // Heartbeat (Keep Alive)
    // ===========================================

    private startHeartbeat(): void {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ type: 'ping' }));
            }
        }, 30000); // Cada 30 segundos
    }

    private stopHeartbeat(): void {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // ===========================================
    // Status Management
    // ===========================================

    private updateStatus(status: WebSocketStatus): void {
        this.status = status;
        this.statusHandlers.forEach(handler => handler(status));
    }

    getStatus(): WebSocketStatus {
        return this.status;
    }

    // ===========================================
    // Message Handling
    // ===========================================

    private notifyHandlers(message: WebSocketMessage): void {
        this.messageHandlers.forEach(handler => {
            try {
                handler(message);
            } catch (error) {
                console.error('Error en handler de WebSocket:', error);
            }
        });
    }

    // ===========================================
    // Public Subscription API
    // ===========================================

    subscribe(handler: MessageHandler): () => void {
        this.messageHandlers.add(handler);


        // Retornar función de unsuscribe
        return () => {
            this.messageHandlers.delete(handler);

        };
    }

    onStatusChange(handler: StatusHandler): () => void {
        this.statusHandlers.add(handler);
        // Notificar el estado actual inmediatamente
        handler(this.status);

        return () => {
            this.statusHandlers.delete(handler);
        };
    }

    // ===========================================
    // Send Messages
    // ===========================================

    send(type: string, payload: any): boolean {
        if (this.ws?.readyState !== WebSocket.OPEN) {
            console.warn('⚠️ WebSocket no conectado, no se puede enviar mensaje');
            return false;
        }

        try {
            this.ws.send(JSON.stringify({
                type,
                payload,
                timestamp: new Date().toISOString()
            }));
            return true;
        } catch (error) {
            console.error('❌ Error enviando mensaje WebSocket:', error);
            return false;
        }
    }
}

// ===========================================
// Singleton Instance
// ===========================================

export const websocketService = new WebSocketManager();

// ===========================================
// Export Default
// ===========================================

export default websocketService;
