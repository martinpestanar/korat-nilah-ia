/**
 * SuccessAnimation Component
 * Animaciones de celebración para acciones exitosas
 */

import React, { useEffect, useState } from 'react';
import { Check, Sparkles, Send, Gift } from 'lucide-react';

type AnimationType = 'success' | 'send' | 'confetti' | 'gift';

interface SuccessAnimationProps {
    type: AnimationType;
    show: boolean;
    onComplete?: () => void;
    duration?: number;
    message?: string;
}

const SuccessAnimation: React.FC<SuccessAnimationProps> = ({
    type,
    show,
    onComplete,
    duration = 2000,
    message
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string }>>([]);

    useEffect(() => {
        if (show) {
            setIsVisible(true);

            // Generate confetti particles
            if (type === 'confetti' || type === 'success') {
                const newParticles = Array.from({ length: 20 }, (_, i) => ({
                    id: i,
                    x: Math.random() * 100,
                    y: Math.random() * 100,
                    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][Math.floor(Math.random() * 6)]
                }));
                setParticles(newParticles);
            }

            const timer = setTimeout(() => {
                setIsVisible(false);
                setParticles([]);
                onComplete?.();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [show, duration, onComplete, type]);

    if (!isVisible) return null;

    const renderAnimation = () => {
        switch (type) {
            case 'success':
                return (
                    <div className="relative">
                        {/* Central Icon */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center animate-bounce shadow-2xl shadow-primary/30">\n                            <Check className="w-10 h-10 text-white" strokeWidth={3} />
                        </div>

                        {/* Ripple Effect */}
                        <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
                        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDelay: '150ms' }} />

                        {/* Sparkles */}
                        <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                        <Sparkles className="absolute -bottom-1 -left-1 w-4 h-4 text-yellow-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                    </div>
                );

            case 'send':
                return (
                    <div className="relative">
                        {/* Paper Plane Animation */}
                        <div className="relative">
                            <Send
                                className="w-16 h-16 text-primary animate-[fly_1s_ease-out_forwards]"
                                style={{
                                    animation: 'fly 1s ease-out forwards',
                                }}
                            />

                            {/* Trail */}
                            <div className="absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent animate-pulse" />
                        </div>

                        {/* Particles */}
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-2 h-2 rounded-full bg-primary/60"
                                style={{
                                    left: `${20 + i * 15}%`,
                                    top: `${40 + Math.random() * 20}%`,
                                    animation: `fadeOut 0.5s ease-out forwards`,
                                    animationDelay: `${i * 100}ms`
                                }}
                            />
                        ))}
                    </div>
                );

            case 'gift':
                return (
                    <div className="relative">
                        {/* Gift Icon */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center animate-bounce shadow-2xl">
                            <Gift className="w-10 h-10 text-white" />
                        </div>

                        {/* Sparkles Around */}
                        {[...Array(6)].map((_, i) => (
                            <Sparkles
                                key={i}
                                className="absolute w-4 h-4 text-yellow-400 animate-ping"
                                style={{
                                    left: `${50 + 40 * Math.cos(i * 60 * Math.PI / 180)}%`,
                                    top: `${50 + 40 * Math.sin(i * 60 * Math.PI / 180)}%`,
                                    transform: 'translate(-50%, -50%)',
                                    animationDelay: `${i * 100}ms`
                                }}
                            />
                        ))}
                    </div>
                );

            case 'confetti':
            default:
                return (
                    <>
                        {particles.map((particle) => (
                            <div
                                key={particle.id}
                                className="absolute w-2 h-2 rounded-full"
                                style={{
                                    left: `${particle.x}%`,
                                    top: `${particle.y}%`,
                                    backgroundColor: particle.color,
                                    animation: `confettiFall ${1 + Math.random()}s ease-out forwards`,
                                    animationDelay: `${Math.random() * 200}ms`
                                }}
                            />
                        ))}
                    </>
                );
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/10 backdrop-blur-sm animate-in fade-in duration-200"
                style={{ pointerEvents: 'none' }}
            />

            {/* Animation Container */}
            <div className="relative flex flex-col items-center gap-4 animate-in zoom-in-50 duration-300">
                {renderAnimation()}

                {/* Message */}
                {message && (
                    <p className="text-lg font-bold text-gray-900 dark:text-white animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {message}
                    </p>
                )}
            </div>

            {/* CSS Animations */}
            <style>{`
                @keyframes fly {
                    0% { transform: translateX(0) translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateX(100px) translateY(-100px) rotate(45deg); opacity: 0; }
                }
                
                @keyframes fadeOut {
                    0% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.5); }
                }
                
                @keyframes confettiFall {
                    0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100px) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default SuccessAnimation;
