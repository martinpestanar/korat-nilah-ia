import React, { useState } from 'react';
import {
    Sparkles,
    Edit3,
    Calendar,
    Send,
    Copy,
    Check,
    Users,
    TrendingUp,
    MessageCircle,
    Image,
    Lightbulb,
    Zap,
    ChevronDown,
    ChevronUp,
    Eye,
    EyeOff
} from 'lucide-react';
import { CampaignChoices, KeyDate } from '../../types/campaignBuilderTypes';
import { MONTH_NAMES } from '../../services/campaignMockData';
import WhatsAppPreview from '../UI/WhatsAppPreview';
import { formatMessage } from '../../utils/textFormatter';


// Nuevas interfaces para los datos de IA
interface IdeaImagen {
    descripcion: string;
    elementosClaves: string;
    textoSugerido: string;
}

interface IdeaVideo {
    titulo: string;
    concepto: string;
    estructura: string;
    porqueCrearlo: string;
}

interface CampaignSummaryProps {
    choices: CampaignChoices;
    generatedMessage: string;
    estimatedReach: number;
    estimatedRevenue: number;
    keyDate: KeyDate | null;
    monthYear: { month: number; year: number };
    onEdit: () => void;
    onSchedule: () => void;
    onLaunch: () => void;
    onEditMessage: (newMessage: string) => void;
    currencySymbol: string;
    // Props de IA - Nueva estructura
    aiImageIdea?: string | IdeaImagen | null;
    aiTipsWhatsApp?: string[] | null;
    aiVideoIdea?: IdeaVideo | null;
    koratFlowTip?: string | null;
    // Props para regenerar
    onRegenerate?: () => void;
    isRegenerating?: boolean;
}

const choiceLabels: Record<string, Record<string, { label: string; icon: string }>> = {
    objective: {
        sales: { label: 'Más Ventas', icon: '💰' },
        new_clients: { label: 'Nuevos Clientes', icon: '👥' },
        recover_inactive: { label: 'Recuperar Inactivos', icon: '🔄' },
    },
    tone: {
        fun: { label: 'Divertido', icon: '🎉' },
        elegant: { label: 'Elegante', icon: '💎' },
        emotional: { label: 'Emocional', icon: '❤️' },
    },
    promo: {
        discount: { label: 'Descuento %', icon: '🏷️' },
        bundle: { label: '2x1 / Paquete', icon: '🎁' },
        flash_sale: { label: 'Flash Sale', icon: '⏰' },
    },
    channel: {
        whatsapp: { label: 'WhatsApp', icon: '📱' },
    },
};

const CampaignSummary: React.FC<CampaignSummaryProps> = ({
    choices,
    generatedMessage,
    estimatedReach,
    estimatedRevenue,
    keyDate,
    monthYear,
    onEdit,
    onSchedule,
    onLaunch,
    onEditMessage,
    currencySymbol,
    aiImageIdea,
    aiTipsWhatsApp,
    aiVideoIdea,
    koratFlowTip,
    onRegenerate,
    isRegenerating = false,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedMessage, setEditedMessage] = useState(generatedMessage);
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedMessage);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSaveMessage = () => {
        onEditMessage(editedMessage);
        setIsEditing(false);
    };

    const ChannelIcon = MessageCircle;

    const [showCreativeTips, setShowCreativeTips] = useState(true);
    const [showWhatsAppPreview, setShowWhatsAppPreview] = useState(false);

    return (
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Success Header */}
            <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center animate-bounce">
                    <Check className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    ¡Tu campaña está lista! 🎉
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    {MONTH_NAMES[monthYear.month]} {monthYear.year}
                    {keyDate && ` · ${keyDate.name}`}
                </p>
            </div>

            {/* Choices Summary */}
            <div className="grid grid-cols-4 gap-2 mb-6">
                {Object.entries(choiceLabels).map(([key, values]) => {
                    const choiceValue = choices[key as keyof typeof choices] as string | null;
                    if (!choiceValue || !values[choiceValue]) return null;
                    const { label, icon } = values[choiceValue];

                    return (
                        <div
                            key={key}
                            className="flex flex-col items-center p-3 rounded-xl bg-gray-50 dark:bg-dark-bg/50"
                        >
                            <span className="text-xl mb-1">{icon}</span>
                            <span className="text-[10px] uppercase text-gray-400 mb-0.5">{key}</span>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-center">
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Generated Message */}
            <div className="flex-1 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" />
                        Mensaje Generado por Nilah
                    </h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                            title="Copiar mensaje"
                        >
                            {isCopied ? (
                                <Check size={16} className="text-primary" />
                            ) : (
                                <Copy size={16} className="text-gray-400" />
                            )}
                        </button>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                            title="Editar mensaje"
                        >
                            <Edit3 size={16} className="text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    {isEditing ? (
                        <div className="space-y-3">
                            <textarea
                                value={editedMessage}
                                onChange={(e) => setEditedMessage(e.target.value)}
                                className="w-full h-40 p-4 rounded-xl border-2 border-primary bg-white dark:bg-dark-card text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setEditedMessage(generatedMessage);
                                        setIsEditing(false);
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveMessage}
                                    className="px-4 py-2 text-sm bg-primary text-black font-bold rounded-lg hover:opacity-90"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark-bg dark:to-dark-card border border-gray-200 dark:border-dark-border">
                            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-dark-border">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500">
                                    <ChannelIcon size={16} className="text-white" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Mensaje de WhatsApp
                                </span>
                            </div>
                            <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                                {formatMessage(generatedMessage)}
                            </div>

                            {/* Botón de copiar grande y visible */}
                            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-dark-border flex gap-2">
                                <button
                                    onClick={handleCopy}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${isCopied
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-dark-bg dark:hover:bg-dark-border text-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    {isCopied ? (
                                        <>
                                            <Check size={16} />
                                            ¡Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={16} />
                                            Copiar Mensaje
                                        </>
                                    )}
                                </button>

                                {/* Botón de regenerar */}
                                {onRegenerate && (
                                    <button
                                        onClick={onRegenerate}
                                        disabled={isRegenerating}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Generar otra opción"
                                    >
                                        {isRegenerating ? (
                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                        <span className="hidden sm:inline">{isRegenerating ? 'Generando...' : 'Otra Opción'}</span>
                                    </button>
                                )}

                                {/* Botón de Preview WhatsApp */}
                                <button
                                    onClick={() => setShowWhatsAppPreview(!showWhatsAppPreview)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 font-medium transition-all"
                                    title="Ver preview de WhatsApp"
                                >
                                    {showWhatsAppPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                                    <span className="hidden sm:inline">{showWhatsAppPreview ? 'Ocultar' : 'Preview'}</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* WhatsApp Preview Modal */}
                    {showWhatsAppPreview && (
                        <div className="mt-4 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <WhatsAppPreview
                                message={generatedMessage}
                                senderName="Tu Negocio"
                                status="delivered"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                    <div className="flex items-center gap-2 mb-1">
                        <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 uppercase font-medium">
                            Alcance Estimado
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                        {estimatedReach} <span className="text-sm font-normal">clientes</span>
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30">
                    <div className="flex items-center gap-2 mb-1">
                        <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-medium">
                            Retorno Estimado
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {currencySymbol}{estimatedRevenue.toLocaleString()}
                    </p>
                </div>
            </div>


            {/* CREATIVE RECOMMENDATIONS SECTION - Powered by AI */}
            <div className="mb-6">
                <button
                    onClick={() => setShowCreativeTips(!showCreativeTips)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700/30 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 transition-all"
                >
                    <div className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-amber-600 dark:text-amber-400" />
                        <span className="font-bold text-amber-800 dark:text-amber-300">🤖 Recomendaciones de Nilah</span>
                        <span className="text-xs bg-gradient-to-r from-primary to-emerald-400 text-black px-2 py-0.5 rounded-full font-medium">IA</span>
                    </div>
                    {showCreativeTips ? <ChevronUp size={18} className="text-amber-600" /> : <ChevronDown size={18} className="text-amber-600" />}
                </button>

                {showCreativeTips && (
                    <div className="mt-3 p-4 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border space-y-4">

                        {/* 1. IDEA DE IMAGEN/FLYER */}
                        <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-800/30 flex items-center justify-center flex-shrink-0">
                                    <Image size={20} className="text-rose-600 dark:text-rose-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-rose-800 dark:text-rose-300 text-sm mb-2">📸 Idea para tu Imagen/Flyer</h4>
                                    {typeof aiImageIdea === 'object' && aiImageIdea ? (
                                        <div className="space-y-2">
                                            <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                                                <strong>Descripción:</strong> {aiImageIdea.descripcion}
                                            </p>
                                            <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                                                <strong>Elementos clave:</strong> {aiImageIdea.elementosClaves}
                                            </p>
                                            <p className="text-xs text-rose-600 dark:text-rose-300 font-medium bg-rose-100 dark:bg-rose-800/40 p-2 rounded-lg">
                                                💬 Texto sugerido: "{aiImageIdea.textoSugerido}"
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-rose-700 dark:text-rose-400 leading-relaxed">
                                            {typeof aiImageIdea === 'string' ? aiImageIdea : 'Foto de tu mejor trabajo con la promoción visible. Incluye logo y número de WhatsApp.'}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1 text-[10px] text-rose-600 dark:text-rose-400 mt-2">
                                        <Zap size={10} />
                                        <span>Las imágenes con personas reales generan 38% más interacción.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. TIPS DE WHATSAPP */}
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-800/30 flex items-center justify-center flex-shrink-0">
                                    <MessageCircle size={20} className="text-green-600 dark:text-green-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-green-800 dark:text-green-300 text-sm mb-2">📱 Tips para tu campaña de WhatsApp</h4>
                                    <ul className="space-y-1.5">
                                        {(aiTipsWhatsApp && aiTipsWhatsApp.length > 0 ? aiTipsWhatsApp : [
                                            '📱 Envía entre 10-11 AM o 7-8 PM para mejor respuesta',
                                            '⏰ Da seguimiento en 24h si no responden',
                                            '📸 Adjunta una imagen junto con el mensaje'
                                        ]).map((tip, index) => (
                                            <li key={index} className="text-xs text-green-700 dark:text-green-400 leading-relaxed flex items-start gap-1">
                                                <span className="mt-0.5">•</span>
                                                <span>{tip}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* 3. IDEA DE VIDEO/REEL */}
                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center flex-shrink-0">
                                    <Sparkles size={20} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm mb-2">🎬 Tip: Crea un Video Reel (15-30 seg)</h4>
                                    {aiVideoIdea ? (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                                                🎯 "{aiVideoIdea.titulo}"
                                            </p>
                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                <strong>Concepto:</strong> {aiVideoIdea.concepto}
                                            </p>
                                            <div className="text-xs text-indigo-700 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-800/40 p-2 rounded-lg">
                                                <strong>Estructura:</strong> {aiVideoIdea.estructura}
                                            </div>
                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                                                💡 {aiVideoIdea.porqueCrearlo}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                <strong>Concepto:</strong> Muestra tu servicio en acción con música trending.
                                            </p>
                                            <p className="text-xs text-indigo-700 dark:text-indigo-400">
                                                <strong>Estructura:</strong> HOOK (pregunta intrigante) → Proceso del servicio → CTA
                                            </p>
                                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 italic">
                                                💡 Los videos tienen 3x más engagement que las imágenes.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. KORAT FLOW TIP - Mención sutil */}
                        {koratFlowTip && (
                            <div className="pt-3 border-t border-gray-100 dark:border-dark-border">
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {koratFlowTip}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={onEdit}
                    className="flex flex-col items-center gap-1 py-3 px-4 rounded-xl border-2 border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                >
                    <Edit3 size={20} className="text-gray-600 dark:text-gray-400" />
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Editar</span>
                </button>

                <button
                    onClick={onSchedule}
                    className="flex flex-col items-center gap-1 py-3 px-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
                >
                    <Calendar size={20} className="text-indigo-600 dark:text-indigo-400" />
                    <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Programar</span>
                </button>

                <button
                    onClick={onLaunch}
                    className="flex flex-col items-center gap-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-emerald-400 hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                    <Send size={20} className="text-black" />
                    <span className="text-xs font-bold text-black">Lanzar Ahora</span>
                </button>
            </div>
        </div>
    );
};

export default CampaignSummary;
