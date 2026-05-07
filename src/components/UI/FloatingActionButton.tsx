/**
 * FloatingActionButton Component
 * Botón flotante con acciones rápidas más usadas
 */

import React, { useState } from 'react';
import { Plus, X, Calendar, UserPlus, Send, MessageCircle, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FABAction {
    id: string;
    label: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
}

interface FloatingActionButtonProps {
    className?: string;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const actions: FABAction[] = [
        {
            id: 'appointment',
            label: 'Nueva Cita',
            icon: <Calendar size={20} />,
            color: 'bg-blue-500 hover:bg-blue-600',
            onClick: () => {
                navigate('/nilah/app/calendar');
                setIsOpen(false);
            }
        },
        {
            id: 'client',
            label: 'Nuevo Cliente',
            icon: <UserPlus size={20} />,
            color: 'bg-green-500 hover:bg-green-600',
            onClick: () => {
                navigate('/nilah/app/clients');
                setIsOpen(false);
            }
        },
        {
            id: 'campaign',
            label: 'Campaña Rápida',
            icon: <Send size={20} />,
            color: 'bg-purple-500 hover:bg-purple-600',
            onClick: () => {
                navigate('/nilah/app/marketing');
                setIsOpen(false);
            }
        },
        {
            id: 'message',
            label: 'Enviar Mensaje',
            icon: <MessageCircle size={20} />,
            color: 'bg-emerald-500 hover:bg-emerald-600',
            onClick: () => {
                navigate('/nilah/app/engagement');
                setIsOpen(false);
            }
        },
        {
            id: 'reward',
            label: 'Canjear Premio',
            icon: <Gift size={20} />,
            color: 'bg-amber-500 hover:bg-amber-600',
            onClick: () => {
                navigate('/nilah/app/loyalty');
                setIsOpen(false);
            }
        }
    ];

    return (
        <div className={`fixed bottom-20 right-6 z-50 ${className}`}>
            {/* Action Buttons */}
            <div className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                {actions.map((action, index) => (
                    <div
                        key={action.id}
                        className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Label */}
                        <span className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium shadow-lg whitespace-nowrap">
                            {action.label}
                        </span>

                        {/* Button */}
                        <button
                            onClick={action.onClick}
                            className={`w-12 h-12 rounded-full ${action.color} text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95`}
                        >
                            {action.icon}
                        </button>
                    </div>
                ))}
            </div>

            {/* Main FAB Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 text-white shadow-xl flex items-center justify-center transition-all duration-300 hover:shadow-2xl hover:scale-105 active:scale-95 ${isOpen ? 'rotate-45' : ''}`}
            >
                {isOpen ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

export default FloatingActionButton;
