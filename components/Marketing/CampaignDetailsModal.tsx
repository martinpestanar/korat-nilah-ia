import React, { useState } from 'react';
import {
    X,
    Calendar,
    Users,
    DollarSign,
    Target,
    MessageCircle,
    Image as ImageIcon,
    Video,
    Lightbulb,
    CheckCircle2,
    Clock,
    AlertTriangle,
    BarChart3,
    Edit3,
    Trash2,
    Send,
    Copy,
    ExternalLink
} from 'lucide-react';
import { GeneratedCampaign, OBJECTIVE_TO_LABEL } from '../../types/campaignBuilderTypes';
import { formatMessage } from '../../utils/textFormatter';

interface CampaignDetailsModalProps {
    campaign: GeneratedCampaign;
    isOpen: boolean;
    onClose: () => void;
    currencySymbol: string;
    onDelete?: (id: string) => void;
    onLaunch?: (id: string) => void;
}

const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
    campaign,
    isOpen,
    onClose,
    currencySymbol,
    onDelete,
    onLaunch
}) => {
    const [activeTab, setActiveTab] = useState<'resumen' | 'estrategia' | 'creatividad'>('resumen');
    const [isCopied, setIsCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyMessage = async () => {
        await navigator.clipboard.writeText(campaign.message);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // Parsear datos de IA si vienen como strings JSON (caso común en Supabase)
    const parseAIField = (field: any) => {
        if (!field) return null;
        if (typeof field === 'string') {
            try {
                return JSON.parse(field);
            } catch (e) {
                return field; // Retornar como string si no es JSON válido
            }
        }
        return field;
    };

    const aiImageIdea = parseAIField(campaign.aiImageIdea);
    const aiVideoIdea = parseAIField(campaign.aiVideoIdea);
    const aiTipsWhatsApp = parseAIField(campaign.aiTipsWhatsApp);

    // Mapeo seguro de etiquetas
    // @ts-ignore
    const objectiveLabel = OBJECTIVE_TO_LABEL?.[campaign.choices.objective] || campaign.choices.objective || 'Campaña';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-dark-card rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border bg-gradient-to-r from-gray-50 to-white dark:from-dark-bg dark:to-dark-card">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${campaign.status === 'active' ? 'bg-green-100 text-green-600' :
                            campaign.status === 'enviada' ? 'bg-blue-100 text-blue-600' :
                                campaign.status === 'scheduled' ? 'bg-amber-100 text-amber-600' :
                                    'bg-gray-100 text-gray-600'
                            }`}>
                            {campaign.status === 'active' ? <Send size={24} /> :
                                campaign.status === 'enviada' ? <CheckCircle2 size={24} /> :
                                    campaign.status === 'scheduled' ? <Calendar size={24} /> :
                                        <Edit3 size={24} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">
                                {campaign.title}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                                    campaign.status === 'enviada' ? 'bg-blue-100 text-blue-700' :
                                        campaign.status === 'scheduled' ? 'bg-amber-100 text-amber-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {campaign.status === 'active' ? 'Activa' :
                                        campaign.status === 'enviada' ? '✅ Enviada' :
                                            campaign.status === 'scheduled' ? 'Programada' : 'Borrador'}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Creada el {new Date(campaign.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onDelete && (
                            <button
                                onClick={() => {
                                    if (window.confirm('¿Eliminar campaña?')) {
                                        onDelete(campaign.id);
                                        onClose();
                                    }
                                }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button onClick={onClose} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-lg transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 dark:border-dark-border px-6">
                    {[
                        { id: 'resumen', label: 'Resumen y Resultados', icon: BarChart3 },
                        { id: 'estrategia', label: 'Estrategia', icon: Target },
                        { id: 'creatividad', label: 'Guía Creativa', icon: Lightbulb },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-dark-bg/50">

                    {/* TAB: RESUMEN */}
                    {activeTab === 'resumen' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <Users size={16} className="text-blue-500" />
                                        <span className="text-xs font-bold uppercase">Alcance</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {campaign.estimatedReach} <span className="text-sm font-normal text-gray-400">clientes</span>
                                    </p>
                                </div>
                                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <DollarSign size={16} className="text-emerald-500" />
                                        <span className="text-xs font-bold uppercase">Ingreso Estimado</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {currencySymbol}{campaign.estimatedRevenue}
                                    </p>
                                </div>
                                <div className="p-4 bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                                        <CheckCircle2 size={16} className="text-purple-500" />
                                        <span className="text-xs font-bold uppercase">Conversión Esp.</span>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        15% <span className="text-sm font-normal text-gray-400">estimado</span>
                                    </p>
                                </div>
                            </div>

                            {/* Message Preview */}
                            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden">
                                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-dark-border">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <MessageCircle size={18} className="text-green-500" />
                                        Mensaje Enviado
                                    </h3>
                                    <button
                                        onClick={handleCopyMessage}
                                        className="text-xs flex items-center gap-1 text-primary hover:text-primary-dark font-medium"
                                    >
                                        {isCopied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                        {isCopied ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-dark-bg/30">
                                    <div className="bg-white dark:bg-[#202c33] p-4 rounded-lg rounded-tl-none shadow-sm max-w-lg border border-gray-100 dark:border-gray-800">
                                        <p className="whitespace-pre-line text-sm text-gray-800 dark:text-gray-100">
                                            {formatMessage(campaign.message)}
                                        </p>
                                        <span className="text-[10px] text-gray-400 block text-right mt-2">
                                            {new Date(campaign.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: ESTRATEGIA */}
                    {activeTab === 'estrategia' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="bg-white dark:bg-dark-card p-5 rounded-xl border border-gray-200 dark:border-dark-border">
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Target size={18} className="text-primary" />
                                            Objetivo de Negocio
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Objetivo Principal</p>
                                                <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                                                    {objectiveLabel.replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Segmento Apuntado</p>
                                                <p className="text-base text-gray-900 dark:text-white capitalize">
                                                    {(campaign.choices.segment || 'Todos').replace(/_/g, ' ')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Oferta / Gancho</p>
                                                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary-dark text-sm font-bold">
                                                    {(campaign.choices.promo || 'Descuento').replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                                    <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                                        <Lightbulb size={18} />
                                        ¿Por qué esta estrategia?
                                    </h3>
                                    <p className="text-indigo-800 dark:text-indigo-200 text-sm leading-relaxed">
                                        Esta campaña está diseñada para atacar el disparador emocional de
                                        <strong> {(campaign.choices.emotionalTrigger || 'oportunidad').toUpperCase()}</strong>.
                                    </p>
                                    <div className="mt-4 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                                        <p className="text-xs text-indigo-800 dark:text-indigo-300 italic">
                                            "Al dirigirte específicamente a {campaign.choices.segment || 'tus clientes'},
                                            aumentas la relevancia del mensaje. La oferta combinada con el tono
                                            {campaign.choices.tone || 'amigable'} reduce la fricción de compra."
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: CREATIVIDAD */}
                    {activeTab === 'creatividad' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {/* AI TIPS SECTION */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 p-4 rounded-xl mb-6">
                                <div className="flex items-start gap-3">
                                    <Lightbulb className="text-amber-500 mt-1" size={20} />
                                    <div>
                                        <h4 className="font-bold text-amber-800 dark:text-amber-500">Recursos Creativos de IA</h4>
                                        <p className="text-sm text-amber-700 dark:text-amber-600">
                                            Estos son los recursos generados para acompañar tu campaña. Úsalos para crear tus estados o reels.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* IMAGE IDEA */}
                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                                    <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border-b border-rose-100 dark:border-rose-800/30 flex items-center gap-2">
                                        <ImageIcon size={18} className="text-rose-500" />
                                        <h3 className="font-bold text-rose-700 dark:text-rose-400">Idea para Imagen/Estado</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {aiImageIdea ? (
                                            <>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Descripción Visual</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{aiImageIdea.descripcion || aiImageIdea}</p>
                                                </div>
                                                {aiImageIdea.textoSugerido && (
                                                    <div className="bg-gray-50 dark:bg-dark-bg p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Texto superpuesto</p>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">"{aiImageIdea.textoSugerido}"</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No hay sugerencias de imagen para esta campaña.</p>
                                        )}
                                    </div>
                                </div>

                                {/* VIDEO IDEA */}
                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                                    <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-100 dark:border-purple-800/30 flex items-center gap-2">
                                        <Video size={18} className="text-purple-500" />
                                        <h3 className="font-bold text-purple-700 dark:text-purple-400">Guion para Reel/TikTok</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {aiVideoIdea ? (
                                            <>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase font-bold mb-1">Concepto</p>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{aiVideoIdea.titulo || 'Video Promocional'}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{aiVideoIdea.concepto}</p>
                                                </div>
                                                <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-lg">
                                                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mb-1">Estructura Sugerida</p>
                                                    <p className="text-sm text-purple-800 dark:text-purple-300">{aiVideoIdea.estructura}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">No hay sugerencias de video para esta campaña.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* WHATSAPP TIPS */}
                            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                                <div className="p-4 bg-green-50 dark:bg-green-900/10 border-b border-green-100 dark:border-green-800/30 flex items-center gap-2">
                                    <MessageCircle size={18} className="text-green-500" />
                                    <h3 className="font-bold text-green-700 dark:text-green-400">Tips de Envío WhatsApp</h3>
                                </div>
                                <div className="p-5">
                                    {aiTipsWhatsApp && Array.isArray(aiTipsWhatsApp) ? (
                                        <ul className="space-y-2">
                                            {aiTipsWhatsApp.map((tip: string, i: number) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">Envía esta campaña entre Martes y Jueves a las 10:00 AM para mejor apertura.</p>
                                    )}
                                </div>
                            </div>

                            {/* KORATFLOW TIP */}
                            {(campaign as any).koratFlowTip && (
                                <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-200 dark:border-dark-border overflow-hidden">
                                    <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10 border-b border-violet-100 dark:border-violet-800/30 flex items-center gap-2">
                                        <Lightbulb size={18} className="text-violet-500" />
                                        <h3 className="font-bold text-violet-700 dark:text-violet-400">Tip de Koratflow</h3>
                                        <span className="text-[10px] bg-gradient-to-r from-violet-500 to-indigo-500 text-white px-2 py-0.5 rounded-full font-bold">PRO</span>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {(campaign as any).koratFlowTip}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-200 dark:hover:bg-dark-card rounded-lg transition-colors"
                    >
                        Cerrar
                    </button>
                    {campaign.status !== 'active' && onLaunch && (
                        <button
                            onClick={() => {
                                if (window.confirm('¿Estás seguro de que deseas lanzar esta campaña ahora?')) {
                                    onLaunch(campaign.id);
                                    onClose();
                                }
                            }}
                            className="px-4 py-2 bg-primary text-white font-bold rounded-lg hover:opacity-90 flex items-center gap-2"
                        >
                            <Send size={16} />
                            Lanzar Ahora
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CampaignDetailsModal;
