/**
 * WhatsAppPreview Component
 * Preview realista de cómo se verá un mensaje en WhatsApp
 */

import React from 'react';
import { Check } from 'lucide-react';
import { formatMessage } from '../../utils/textFormatter';

interface WhatsAppPreviewProps {
    message: string;
    senderName?: string;
    time?: string;
    status?: 'sent' | 'delivered' | 'read';
    className?: string;
}

const WhatsAppPreview: React.FC<WhatsAppPreviewProps> = ({
    message,
    senderName = 'Tu Negocio',
    time,
    status = 'delivered',
    className = ''
}) => {
    const currentTime = time || new Date().toLocaleTimeString('es-PE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const getCheckColor = () => {
        switch (status) {
            case 'read': return 'text-blue-500';
            case 'delivered': return 'text-gray-400';
            default: return 'text-gray-300';
        }
    };

    return (
        <div className={`max-w-sm ${className}`}>
            {/* Phone Frame */}
            <div className="bg-[#0B141A] rounded-2xl p-2 shadow-xl">
                {/* Status Bar */}
                <div className="flex items-center justify-between px-4 py-2 text-white text-xs">
                    <span>{currentTime.split(':').slice(0, 2).join(':')}</span>
                    <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12.33 4.67L20 12l-7.67 7.33V4.67z" opacity="0.3" />
                            <path d="M4 12l8-7.33v14.66L4 12z" />
                        </svg>
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2 22h20V2z" opacity="0.3" />
                        </svg>
                    </div>
                </div>

                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-[#1F2C34]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                        {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-white font-medium text-sm">{senderName}</p>
                        <p className="text-[10px] text-gray-400">en línea</p>
                    </div>
                </div>

                {/* Chat Background */}
                <div
                    className="p-4 min-h-[200px]"
                    style={{
                        backgroundColor: '#0B141A',
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}
                >
                    {/* Message Bubble */}
                    <div className="max-w-[85%] ml-auto">
                        <div className="bg-[#005C4B] rounded-lg rounded-tr-sm p-3 shadow-md relative">
                            {/* Tail */}
                            <div
                                className="absolute -right-2 top-0 w-4 h-4"
                                style={{
                                    background: '#005C4B',
                                    clipPath: 'polygon(0 0, 0% 100%, 100% 0)'
                                }}
                            />

                            {/* Message Text */}
                            <div className="text-[#E9EDEF] text-sm leading-relaxed">
                                {formatMessage(message)}
                            </div>

                            {/* Time and Status */}
                            <div className="flex items-center justify-end gap-1 mt-1">
                                <span className="text-[10px] text-[#8696A0]">{currentTime}</span>
                                <div className={`flex ${getCheckColor()}`}>
                                    <Check size={12} strokeWidth={3} />
                                    {status !== 'sent' && (
                                        <Check size={12} strokeWidth={3} className="-ml-1.5" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Input Bar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#1F2C34]">
                    <div className="flex-1 flex items-center gap-2 bg-[#2A3942] rounded-full px-4 py-2">
                        <span className="text-[#8696A0] text-sm flex-1">Mensaje</span>
                        <svg className="w-5 h-5 text-[#8696A0]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[#00A884] flex items-center justify-center">
                        <svg className="w-5 h-5 text-[#111B21]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 14.5c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Label */}
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
                Vista previa de WhatsApp
            </p>
        </div>
    );
};

export default WhatsAppPreview;
