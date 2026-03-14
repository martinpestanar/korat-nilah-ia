import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Check } from 'lucide-react';

const ConfettiPiece: React.FC<{ color: string; delay: number }> = ({ color, delay }) => (
    <motion.div
        initial={{ y: -20, x: Math.random() * 40 - 20, opacity: 1, scale: Math.random() * 0.5 + 0.5, rotate: 0 }}
        animate={{
            y: 800,
            x: Math.random() * 200 - 100,
            opacity: 0,
            rotate: Math.random() * 360 * 5
        }}
        transition={{ duration: 2.5 + Math.random(), delay, ease: 'easeOut' }}
        className={`fixed top-0 w-3 h-3 ${color} rounded-sm z-[2000]`}
        style={{ left: `${Math.random() * 100}%` }}
    />
);

const ConfettiShower = () => (
    <div className="fixed inset-0 pointer-events-none z-[2000] overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
            <ConfettiPiece
                key={i}
                color={['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'][i % 6]}
                delay={Math.random() * 0.2}
            />
        ))}
    </div>
);

interface Step {
    targetId?: string;
    title: string;
    message: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: Step[] = [
    {
        title: "¡Hola! Soy Nilah ✨",
        message: "Tu nueva business coach e inteligencia artificial. Acabamos de conectar los datos de tu salón. Déjame mostrarte dónde está el dinero en 3 simples pasos.",
        placement: 'center',
    },
    {
        targetId: 'tour-revenue',
        title: "Inteligencia Financiera",
        message: "Aquí verás el pulso real de tu negocio y la tendencia de tus ingresos. Olvídate del Excel, yo hago los números por ti.",
        placement: 'bottom'
    },
    {
        targetId: 'tour-risk',
        title: "Clientes en Riesgo",
        message: "Estos clientes están a punto de irse a la competencia. En Korat podrás rescatarlos con un clic antes de que sea tarde.",
        placement: 'bottom'
    },
    {
        targetId: 'tour-academy',
        title: "Estrategia Activa",
        message: "Y si alguna vez te pierdes o quieres aprender a subir tu ticket promedio, búscame aquí en el Centro de Ayuda.",
        placement: 'bottom'
    }
];

interface Props {
    onComplete: () => void;
}

const OnboardingTour: React.FC<Props> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

    // Update window size
    useEffect(() => {
        const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect to find the target element, measure it, and smoothly track it during scroll
    useEffect(() => {
        const step = TOUR_STEPS[currentStep];
        if (!step.targetId) {
            setTargetRect(null);
            return;
        }

        let lastRectStr = '';

        const updateRect = () => {
            const element = document.getElementById(step.targetId!);
            if (element) {
                const rect = element.getBoundingClientRect();
                const rectStr = `${Math.round(rect.top)},${Math.round(rect.left)},${Math.round(rect.width)},${Math.round(rect.height)}`;
                if (rectStr !== lastRectStr) {
                    lastRectStr = rectStr;
                    setTargetRect(rect);
                }
            } else {
                if (lastRectStr !== 'null') {
                    lastRectStr = 'null';
                    setTargetRect(null);
                }
            }
        };

        const timer = setTimeout(() => {
            const element = document.getElementById(step.targetId!);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                updateRect();
            }
        }, 100);

        // Track the element at 60fps. Only updates React state when rect changes.
        // This flawlessly handles smooth scrolling in any container.
        const interval = setInterval(updateRect, 16);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [currentStep, windowSize]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            setShowConfetti(true);
            setTimeout(() => {
                setShowConfetti(false);
                onComplete();
            }, 3000);
        }
    };

    const step = TOUR_STEPS[currentStep];
    const isCenter = !targetRect || step.placement === 'center';

    // Calculate Nilah Dialog Position
    let dialogStyles: React.CSSProperties = {};
    if (!isCenter && targetRect) {
        // Just place it below or above the target slightly centered
        if (step.placement === 'bottom') {
            dialogStyles = { top: targetRect.bottom + 20, left: Math.max(20, targetRect.left + (targetRect.width / 2) - 150) };
        } else {
            // Default bottom
            dialogStyles = { top: targetRect.bottom + 20, left: Math.max(20, targetRect.left + (targetRect.width / 2) - 150) };
        }
    }

    // Protect from going offscreen
    if (!isCenter && dialogStyles.left !== undefined) {
        let left = dialogStyles.left as number;
        if (left + 350 > window.innerWidth) { // 350 is max width approx
            left = window.innerWidth - 370;
        }
        if (left < 10) left = 10;
        dialogStyles.left = left;

        // Prevent going off bottom/top screen
        let top = dialogStyles.top as number;
        if (top + 200 > window.innerHeight) {
            top = targetRect!.top - 220; // Put above the element instead
        }
        if (top < 10) top = 10;
        dialogStyles.top = top;
    }


    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[1000] pointer-events-auto">
                {showConfetti && <ConfettiShower />}

                {/* The Overlay */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 z-[1000] pointer-events-none transition-all duration-500`}
                >
                    {isCenter && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
                    )}
                </motion.div>

                {/* The Highlight Border + Spotlight Box Shadow */}
                {!isCenter && targetRect && (
                    <motion.div
                        layout
                        initial={false}
                        animate={{
                            top: targetRect.top - 10,
                            left: targetRect.left - 10,
                            width: targetRect.width + 20,
                            height: targetRect.height + 20,
                        }}
                        transition={{ type: "spring", damping: 25, stiffness: 120 }}
                        className="fixed border-[3px] sm:border-4 border-violet-500 rounded-2xl pointer-events-none z-[1001]"
                        style={{
                            // The massive box-shadow is the key technique to mask everything outside the rounded rectangle perfectly
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 30px rgba(139,92,246,0.6)'
                        }}
                    />
                )}

                {/* Dialog Box */}
                <motion.div
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        x: isCenter ? '-50%' : 0,
                        y: isCenter ? '-50%' : 0
                    }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className={`fixed z-[1002] flex flex-col sm:flex-row gap-4 sm:gap-6 bg-white dark:bg-dark-card p-5 sm:p-8 rounded-[2rem] shadow-2xl w-[calc(100vw-32px)] sm:w-auto sm:max-w-md md:max-w-lg border border-violet-100 dark:border-violet-500/20 ${isCenter ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`}
                    style={!isCenter ? { top: dialogStyles.top, left: dialogStyles.left } : {}}
                >
                    {/* Nilah 3D Avatar (Mock using CSS gradients for now, or use your existing logic) */}
                    <div className="shrink-0 mx-auto sm:mx-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[1.5rem] bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-900/40 dark:to-pink-900/40 border-4 border-white dark:border-dark-card shadow-lg flex items-center justify-center overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/20 to-pink-500/20 animate-pulse"></div>
                            {/* Simple abstract face representing Nilah IA */}
                            <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-violet-500 to-pink-500 rounded-full flex items-center justify-center shadow-inner">
                                <Sparkles className="text-white w-6 h-6 animate-pulse" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <div className="text-[10px] font-black tracking-widest text-violet-500 dark:text-violet-400 uppercase mb-1.5 opacity-80">
                            {currentStep === 0 ? 'Bienvenida' : `Paso ${currentStep} de ${TOUR_STEPS.length - 1}`}
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                            {step.title}
                        </h2>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed font-medium">
                            {step.message}
                        </p>

                        <div className="flex flex-col-reverse sm:flex-row items-center justify-between sm:justify-start gap-4">
                            {/* Saltar en mobile va abajo, en desktop va a la derecha */}
                            {currentStep > 0 && currentStep < TOUR_STEPS.length - 1 && (
                                <button
                                    onClick={onComplete}
                                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 uppercase font-semibold tracking-wider p-2 w-full sm:w-auto"
                                >
                                    Saltar Tour
                                </button>
                            )}

                            <button
                                onClick={handleNext}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-bold shadow-md transition-all active:scale-95"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? (
                                    <>¡Terminar y Vender! <Check className="w-4 h-4 ml-1" /></>
                                ) : (
                                    <>{currentStep === 0 ? 'Empezar recorrido' : 'Siguiente paso'} <ArrowRight className="w-4 h-4 ml-1" /></>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default OnboardingTour;
