import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Loader2, Users, Calendar, MessageSquare, Edit3, CheckCircle, AlertTriangle } from 'lucide-react';
import { retention } from '../../services/api';

interface RescuePlanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AISuggestion {
    analisis: string;
    clientesObjetivo: number;
    clientesIds: string[];
    mensajeSugerido: string;
    estrategia: string;
    impactoEstimado: string;
    mejorHorario: string;
}

const RescuePlanModal: React.FC<RescuePlanModalProps> = ({ isOpen, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
    const [customMessage, setCustomMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [result, setResult] = useState<{ success: boolean; count: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadAISuggestion();
        }
    }, [isOpen]);

    // Fallback por defecto cuando IA no responde
    const getDefaultSuggestion = (): AISuggestion => ({
        analisis: "Tienes clientes que no han visitado en más de 30 días. Un mensaje personalizado puede traerlos de vuelta.",
        clientesObjetivo: 5,
        clientesIds: [],
        mensajeSugerido: "¡Hola {nombre}! 💅 Te extrañamos en el salón. Esta semana tenemos un 15% de descuento especial para ti. ¿Te gustaría agendar?",
        estrategia: "Promo Flash",
        impactoEstimado: "+3 citas esta semana",
        mejorHorario: "Entre 10:00 y 12:00"
    });

    const loadAISuggestion = async () => {
        setIsLoading(true);
        setError(null);
        setResult(null);

        // Timeout de 30 segundos - si la IA tarda más, usamos fallback
        const timeoutPromise = new Promise<null>((resolve) => {
            setTimeout(() => resolve(null), 30000);
        });

        try {
            const result = await Promise.race([
                retention.getPlanSuggestion(),
                timeoutPromise
            ]);

            if (result === null) {
                // Timeout - usar fallback
                console.warn('⏱️ Timeout esperando IA, usando sugerencia por defecto');
                const fallback = getDefaultSuggestion();
                setSuggestion(fallback);
                setCustomMessage(fallback.mensajeSugerido);
            } else if (result && result.analisis) {
                setSuggestion(result);
                setCustomMessage(result.mensajeSugerido || '');
            } else {
                // Respuesta inválida - usar fallback
                const fallback = getDefaultSuggestion();
                setSuggestion(fallback);
                setCustomMessage(fallback.mensajeSugerido);
            }
        } catch (err) {
            console.error('Error loading AI suggestion:', err);
            // En caso de error, usar fallback en lugar de mostrar error
            const fallback = getDefaultSuggestion();
            setSuggestion(fallback);
            setCustomMessage(fallback.mensajeSugerido);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRescue = async () => {
        if (!suggestion) return;

        setIsSending(true);
        setError(null);

        try {
            // Enviar a todos los clientes objetivo
            const response = await retention.executePlan({
                clientIds: suggestion.clientesIds,
                mensaje: customMessage,
                estrategia: suggestion.estrategia,
                limite: suggestion.clientesObjetivo  // Limitar a la cantidad mostrada
            });

            setResult({
                success: true,
                count: response?.enviados || suggestion.clientesObjetivo
            });

            // Cerrar después de 3 segundos
            setTimeout(() => {
                onClose();
                setResult(null);
            }, 3000);

        } catch (err) {
            console.error('Error sending rescue:', err);
            setError('Error al enviar. Intenta de nuevo.');
        } finally {
            setIsSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-700 shadow-2xl overflow-hidden">
                {/* Header con gradiente */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <Sparkles className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">Nilah IA Sugiere...</h2>
                                <p className="text-xs text-white/70">Plan de rescate inteligente</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <X className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-10 w-10 animate-spin text-purple-500 mb-4" />
                            <p className="text-gray-400 text-sm">Analizando tu negocio...</p>
                            <p className="text-gray-500 text-xs mt-1">Nilah está revisando clientes y agenda</p>
                        </div>
                    ) : error && !suggestion ? (
                        <div className="text-center py-8">
                            <AlertTriangle className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
                            <p className="text-gray-300">{error}</p>
                            <button
                                onClick={loadAISuggestion}
                                className="mt-4 px-4 py-2 bg-purple-600 rounded-lg text-white text-sm hover:bg-purple-500"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : result ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">¡Plan Activado!</h3>
                            <p className="text-gray-400">
                                Se enviaron mensajes a <span className="text-green-400 font-bold">{result.count} clientes</span>
                            </p>
                            <p className="text-gray-500 text-xs mt-2">Revisa el historial de rescates para ver el progreso</p>
                        </div>
                    ) : suggestion && (
                        <>
                            {/* Análisis de IA */}
                            <div className="bg-gray-800/50 rounded-xl p-4 mb-4 border border-gray-700">
                                <p className="text-gray-300 text-sm leading-relaxed">
                                    "{suggestion.analisis}"
                                </p>
                            </div>

                            {/* Stats rápidos */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-purple-500/10 rounded-lg p-3 text-center border border-purple-500/20">
                                    <Users className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                                    <p className="text-lg font-bold text-white">{suggestion.clientesObjetivo}</p>
                                    <p className="text-[10px] text-purple-400">Clientes objetivo</p>
                                </div>
                                <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/20">
                                    <Calendar className="h-4 w-4 text-green-400 mx-auto mb-1" />
                                    <p className="text-sm font-bold text-white">{suggestion.impactoEstimado}</p>
                                    <p className="text-[10px] text-green-400">Impacto estimado</p>
                                </div>
                                <div className="bg-blue-500/10 rounded-lg p-3 text-center border border-blue-500/20">
                                    <MessageSquare className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                                    <p className="text-sm font-bold text-white">{suggestion.mejorHorario}</p>
                                    <p className="text-[10px] text-blue-400">Mejor horario</p>
                                </div>
                            </div>

                            {/* Mensaje sugerido */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-300">Mensaje a enviar:</label>
                                    <button
                                        onClick={() => setIsEditing(!isEditing)}
                                        className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                                    >
                                        <Edit3 className="h-3 w-3" />
                                        {isEditing ? 'Guardar' : 'Personalizar'}
                                    </button>
                                </div>
                                {isEditing ? (
                                    <textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        className="w-full h-24 bg-gray-800 border border-gray-600 rounded-lg p-3 text-white text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Escribe tu mensaje personalizado..."
                                    />
                                ) : (
                                    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                                        <p className="text-sm text-gray-300 whitespace-pre-wrap">{customMessage}</p>
                                    </div>
                                )}
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Usa {'{nombre}'} para personalizar con el nombre del cliente
                                </p>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                    <p className="text-sm text-red-400">{error}</p>
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSendRescue}
                                    disabled={isSending || !customMessage.trim()}
                                    className="flex-[2] px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
                                >
                                    {isSending ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-4 w-4" />
                                            Enviar a {suggestion.clientesObjetivo} clientes
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RescuePlanModal;
