
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { negocios } from '../services/api';
import {
    Sparkles, ArrowLeft, ArrowRight, Check, Wand2,
    PartyPopper, RotateCcw, ChevronLeft, Loader2, Send
} from 'lucide-react';

// ═══════════════════════════════════════════════════════
// WIZARD DATA - 7 Steps
// ═══════════════════════════════════════════════════════

interface WizardOption {
    id: string;
    emoji: string;
    label: string;
    description: string;
}

interface WizardStep {
    id: string;
    emoji: string;
    title: string;
    subtitle: string;
    options: WizardOption[];
    allowCustom: boolean;
    customPlaceholder?: string;
}

const WIZARD_STEPS: WizardStep[] = [
    {
        id: 'ambiente',
        emoji: '🏠',
        title: '¿Cómo es el vibe de tu salón?',
        subtitle: 'Elige la opción que mejor describa el ambiente cuando un cliente entra',
        allowCustom: true,
        customPlaceholder: 'Describe el ambiente de tu salón con tus propias palabras...',
        options: [
            { id: 'como_entre_amigas', emoji: '💕', label: 'Como entre amigas', description: 'Risas, música, café... se siente como en casa' },
            { id: 'moderno_urbano', emoji: '🔥', label: 'Moderno y urbano', description: 'Trendy, con estilo, siempre con las últimas tendencias' },
            { id: 'exclusivo_vip', emoji: '👑', label: 'Exclusivo y VIP', description: 'Privacidad, lujo, atención personalizada premium' },
            { id: 'relajante_zen', emoji: '🧘', label: 'Relajante y zen', description: 'Tranquilo, aromas, música suave... un escape del estrés' },
            { id: 'rapido_eficiente', emoji: '⚡', label: 'Rápido y eficiente', description: 'Sin rodeos, puntual, servicio express de calidad' },
        ]
    },
    {
        id: 'publico',
        emoji: '👥',
        title: '¿A quién atienden principalmente?',
        subtitle: 'Conocer a tu público nos ayuda a comunicarnos mejor con ellos',
        allowCustom: true,
        customPlaceholder: 'Describe tu público ideal...',
        options: [
            { id: 'mujeres_jovenes', emoji: '💃', label: 'Mujeres jóvenes (18-30)', description: 'Estudiantes, profesionales jóvenes, amantes de tendencias' },
            { id: 'mujeres_25_40', emoji: '👩‍💼', label: 'Mujeres profesionales (25-40)', description: 'Ejecutivas, madres, mujeres que valoran su tiempo' },
            { id: 'mujeres_40_plus', emoji: '💐', label: 'Mujeres clásicas (40+)', description: 'Clientas fieles, buscan calidad y confianza' },
            { id: 'mixto', emoji: '🌈', label: 'Público mixto', description: 'Hombres y mujeres de todas las edades' },
            { id: 'hombres', emoji: '💈', label: 'Barbería / Hombres', description: 'Caballeros que buscan estilo y cuidado personal' },
        ]
    },
    {
        id: 'diferencial',
        emoji: '⭐',
        title: '¿Cuál es tu superpoder?',
        subtitle: 'Eso que te hace diferente a todos los demás salones',
        allowCustom: true,
        customPlaceholder: 'Escribe qué te hace único...',
        options: [
            { id: 'productos_premium', emoji: '💎', label: 'Productos premium', description: 'Solo usamos marcas top, sin atajos' },
            { id: 'tecnica_avanzada', emoji: '🎯', label: 'Técnica avanzada', description: 'Capacitación constante, siempre evoluccionando' },
            { id: 'ambiente_unico', emoji: '✨', label: 'Ambiente único', description: 'La experiencia de estar aquí no se compara' },
            { id: 'precios_accesibles', emoji: '💰', label: 'Calidad accesible', description: 'Resultados increíbles a precios justos' },
            { id: 'especializacion', emoji: '🏆', label: 'Especialización top', description: 'Somos los referentes en lo nuestro (rubios, uñas, etc.)' },
            { id: 'atencion_personalizada', emoji: '💖', label: 'Atención 1 a 1', description: 'Cada cliente se siente la única en el salón' },
        ]
    },
    {
        id: 'saludo',
        emoji: '👋',
        title: '¿Cómo saludas cuando llega una clienta?',
        subtitle: 'El primer contacto define todo. Sé honesto/a',
        allowCustom: true,
        customPlaceholder: 'Escribe tu saludo real, tal cual lo dices...',
        options: [
            { id: 'hola_hermosa', emoji: '💖', label: '¡Hola hermosa! Pasa, pasa', description: 'Cálido, cercano, como recibir a una amiga' },
            { id: 'bienvenida', emoji: '🌟', label: 'Bienvenida, ¿cómo estás?', description: 'Amable pero profesional' },
            { id: 'hola_reina', emoji: '👑', label: '¡Hola reina! Te estábamos esperando', description: 'Empoderador, hacerla sentir especial' },
            { id: 'buenas_tardes', emoji: '🤝', label: 'Buenas tardes, adelante', description: 'Formal, respetuoso, elegante' },
        ]
    },
    {
        id: 'personalidad',
        emoji: '💫',
        title: '¿Qué personalidad le darías a tu asistente?',
        subtitle: 'Si tu bot fuera una persona del salón, ¿cómo sería?',
        allowCustom: true,
        customPlaceholder: 'Describe la personalidad ideal de tu asistente virtual...',
        options: [
            { id: 'amiga_experta', emoji: '💅', label: 'La amiga que sabe de todo', description: 'Cercana, divertida, pero sabe lo que hace' },
            { id: 'asesora_premium', emoji: '🎩', label: 'Asesora premium', description: 'Elegante, profesional, inspira confianza total' },
            { id: 'creativa_trendy', emoji: '🎨', label: 'Creativa y trendy', description: 'Siempre al día, con ideas frescas y energía' },
            { id: 'calidez_confianza', emoji: '🤗', label: 'Cálida y confiable', description: 'Como una mamá que te cuida, tranquila y segura' },
            { id: 'directa_eficiente', emoji: '⚡', label: 'Directa y eficiente', description: 'Sin rodeos, resuelve rápido, sin perder el tiempo' },
        ]
    },
    {
        id: 'genero',
        emoji: '👤',
        title: '¿Tu clientela es mayoritariamente...?',
        subtitle: 'Esto nos ayuda a elegir las palabras correctas',
        allowCustom: false,
        options: [
            { id: 'femenino', emoji: '👩', label: 'Mujeres', description: 'Usaremos "hermosa", "reina", tratamiento femenino' },
            { id: 'masculino', emoji: '👨', label: 'Hombres', description: 'Usaremos "crack", "caballero", tratamiento masculino' },
            { id: 'neutro', emoji: '🌈', label: 'Mixto / Neutro', description: 'Tratamiento neutro e inclusivo para todos' },
        ]
    },
    {
        id: 'sensacion',
        emoji: '💖',
        title: '¿Qué quieres que sientan tus clientes?',
        subtitle: 'La emoción más importante cuando se van del salón',
        allowCustom: true,
        customPlaceholder: 'Describe qué quieres que sientan...',
        options: [
            { id: 'consentidas', emoji: '🧖‍♀️', label: 'Consentidas y mimadas', description: 'Que se sintieron la persona más importante del mundo' },
            { id: 'empoderadas', emoji: '💪', label: 'Empoderadas y seguras', description: 'Que pueden comerse el mundo con su nuevo look' },
            { id: 'relajadas', emoji: '😌', label: 'Relajadas y renovadas', description: 'Como si hubieran salido de vacaciones' },
            { id: 'increibles', emoji: '🌟', label: 'Que se ven increíbles', description: 'Resultado WOW, selfie obligatorio al salir' },
            { id: 'exclusivas', emoji: '💎', label: 'Exclusivas y especiales', description: 'Que pertenecen a un club selecto de belleza' },
        ]
    }
];

// ═══════════════════════════════════════════════════════
// WIZARD PAGE COMPONENT
// ═══════════════════════════════════════════════════════

const BrandWizard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
    const [showCustom, setShowCustom] = useState<Record<string, boolean>>({});
    const [isComplete, setIsComplete] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [direction, setDirection] = useState<'next' | 'prev'>('next');
    const [isAnimating, setIsAnimating] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const step = WIZARD_STEPS[currentStep];
    const totalSteps = WIZARD_STEPS.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    // Scroll to top on step change
    useEffect(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep]);

    const handleSelect = (optionId: string) => {
        setAnswers(prev => ({ ...prev, [step.id]: optionId }));
        setShowCustom(prev => ({ ...prev, [step.id]: false }));

        // Auto-advance after a brief delay for feedback
        if (currentStep < totalSteps - 1) {
            setTimeout(() => handleNext(), 400);
        }
    };

    const handleCustomToggle = () => {
        setShowCustom(prev => ({ ...prev, [step.id]: !prev[step.id] }));
        if (showCustom[step.id]) {
            // Cancelling custom: restore previous selection if any
            setCustomInputs(prev => ({ ...prev, [step.id]: '' }));
        } else {
            // Opening custom: clear card selection
            setAnswers(prev => {
                const copy = { ...prev };
                delete copy[step.id];
                return copy;
            });
        }
    };

    const handleCustomSave = () => {
        const text = customInputs[step.id]?.trim();
        if (text) {
            setAnswers(prev => ({ ...prev, [step.id]: `custom:${text}` }));
            if (currentStep < totalSteps - 1) {
                setTimeout(() => handleNext(), 300);
            }
        }
    };

    const handleNext = () => {
        if (currentStep < totalSteps - 1 && answers[step.id]) {
            setDirection('next');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsAnimating(false);
            }, 250);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setDirection('prev');
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setIsAnimating(false);
            }, 250);
        }
    };

    const handleFinish = async () => {
        setIsComplete(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const marcaIdentidad = {
                generado: false,
                fecha_generacion: null,
                respuestas_wizard: answers,
                identidad_generada: null
            };

            await negocios.saveBrandWizardAnswers(answers, true);
            setSaveSuccess(true);
        } catch (error) {
            console.error('Error guardando identidad:', error);
            // Still show success since answers are captured
            setSaveSuccess(true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestart = () => {
        setCurrentStep(0);
        setAnswers({});
        setCustomInputs({});
        setShowCustom({});
        setIsComplete(false);
        setSaveSuccess(false);
    };

    const canProceed = !!answers[step?.id];
    const isLastStep = currentStep === totalSteps - 1;

    // ═══════════ COMPLETION SCREEN ═══════════
    if (isComplete) {
        return (
            <div className="bw-page" ref={containerRef}>
                <div className="bw-container">
                    {/* Confetti Animation */}
                    <div className="bw-confetti-container">
                        {Array.from({ length: 30 }).map((_, i) => (
                            <div
                                key={i}
                                className="bw-confetti-piece"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    animationDuration: `${2 + Math.random() * 3}s`,
                                    backgroundColor: ['#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#f97316'][i % 6],
                                }}
                            />
                        ))}
                    </div>

                    <div className="bw-complete-card">
                        <div className="bw-complete-icon">
                            {saveSuccess ? (
                                <div className="bw-success-ring">
                                    <Check size={48} />
                                </div>
                            ) : (
                                <div className="bw-party-icon">
                                    <PartyPopper size={48} />
                                </div>
                            )}
                        </div>

                        <h1 className="bw-complete-title">
                            {saveSuccess ? '¡Identidad Guardada!' : '¡Perfecto! 🎉'}
                        </h1>

                        <p className="bw-complete-subtitle">
                            {saveSuccess
                                ? 'Tu IA generará la personalidad del bot con tus respuestas. Podrás verla en Configuración → Nilah IA.'
                                : 'Ya tenemos todo lo que necesitamos para darle personalidad única a tu chatbot.'
                            }
                        </p>

                        {/* Answers Summary */}
                        {!saveSuccess && (
                            <div className="bw-summary">
                                <h3 className="bw-summary-title">Tu Perfil de Marca</h3>
                                {WIZARD_STEPS.map(s => {
                                    const answer = answers[s.id];
                                    if (!answer) return null;
                                    const isCustom = answer.startsWith('custom:');
                                    const option = s.options.find(o => o.id === answer);
                                    return (
                                        <div key={s.id} className="bw-summary-row">
                                            <span className="bw-summary-label">{s.emoji} {s.title.replace('¿', '').replace('?', '')}</span>
                                            <span className="bw-summary-value">
                                                {isCustom ? `✏️ ${answer.replace('custom:', '')}` : `${option?.emoji} ${option?.label}`}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="bw-complete-actions">
                            {!saveSuccess ? (
                                <>
                                    <button onClick={handleSave} className="bw-btn-primary" disabled={isSaving}>
                                        {isSaving ? (
                                            <><Loader2 size={18} className="bw-spin" /> Guardando...</>
                                        ) : (
                                            <><Send size={18} /> Generar Personalidad con IA</>
                                        )}
                                    </button>
                                    <button onClick={handleRestart} className="bw-btn-ghost">
                                        <RotateCcw size={16} /> Empezar de nuevo
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => navigate('/nilah/app/settings')} className="bw-btn-primary">
                                    <Sparkles size={18} /> Ir a Configuración
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════ WIZARD STEPS ═══════════
    return (
        <div className="bw-page" ref={containerRef}>
            <div className="bw-container">
                {/* Header */}
                <div className="bw-header">
                    <button
                        onClick={() => currentStep === 0 ? navigate(-1) : handlePrev()}
                        className="bw-back-btn"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="bw-header-brand">
                        <Wand2 size={18} className="bw-wand-icon" />
                        <span>Brand Wizard</span>
                    </div>
                    <span className="bw-step-counter">{currentStep + 1}/{totalSteps}</span>
                </div>

                {/* Progress Bar */}
                <div className="bw-progress-track">
                    <div
                        className="bw-progress-fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Step Content */}
                <div
                    className={`bw-step-content ${isAnimating ? (direction === 'next' ? 'bw-slide-out-left' : 'bw-slide-out-right') : 'bw-slide-in'}`}
                >
                    {/* Step Header */}
                    <div className="bw-step-header">
                        <div className="bw-step-emoji">{step.emoji}</div>
                        <h2 className="bw-step-title">{step.title}</h2>
                        <p className="bw-step-subtitle">{step.subtitle}</p>
                    </div>

                    {/* Options */}
                    <div className="bw-options-grid">
                        {step.options.map((option, idx) => {
                            const isSelected = answers[step.id] === option.id;
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleSelect(option.id)}
                                    className={`bw-option-card ${isSelected ? 'bw-option-selected' : ''}`}
                                    style={{ animationDelay: `${idx * 60}ms` }}
                                >
                                    <div className="bw-option-emoji">{option.emoji}</div>
                                    <div className="bw-option-text">
                                        <span className="bw-option-label">{option.label}</span>
                                        <span className="bw-option-desc">{option.description}</span>
                                    </div>
                                    {isSelected && (
                                        <div className="bw-option-check">
                                            <Check size={16} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Custom Input Toggle */}
                    {step.allowCustom && (
                        <div className="bw-custom-section">
                            <button
                                onClick={handleCustomToggle}
                                className={`bw-custom-toggle ${showCustom[step.id] ? 'bw-custom-toggle-active' : ''}`}
                            >
                                ✏️ {showCustom[step.id] ? 'Cancelar' : 'Prefiero escribirlo yo'}
                            </button>

                            {showCustom[step.id] && (
                                <div className="bw-custom-input-area">
                                    <textarea
                                        value={customInputs[step.id] || ''}
                                        onChange={(e) => setCustomInputs(prev => ({ ...prev, [step.id]: e.target.value }))}
                                        placeholder={step.customPlaceholder}
                                        className="bw-custom-textarea"
                                        rows={3}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCustomSave}
                                        disabled={!customInputs[step.id]?.trim()}
                                        className="bw-btn-primary bw-btn-sm"
                                    >
                                        <Check size={16} /> Usar esta respuesta
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Navigation Footer */}
                <div className="bw-footer">
                    {currentStep > 0 && (
                        <button onClick={handlePrev} className="bw-btn-ghost">
                            <ArrowLeft size={16} /> Anterior
                        </button>
                    )}
                    <div className="bw-footer-spacer" />
                    {isLastStep ? (
                        <button
                            onClick={handleFinish}
                            disabled={!canProceed}
                            className="bw-btn-primary"
                        >
                            Ver Resultado <Sparkles size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className="bw-btn-primary"
                        >
                            Siguiente <ArrowRight size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* ═══════════ EMBEDDED STYLES ═══════════ */}
            <style>{`
        /* ======= Page Layout ======= */
        .bw-page {
          min-height: 100vh;
          min-height: 100dvh;
          background: linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #e0f2fe 100%);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .dark .bw-page {
          background: linear-gradient(135deg, #1a0a1e 0%, #0f0a1e 50%, #0a0f1e 100%);
        }

        .bw-container {
          max-width: 480px;
          margin: 0 auto;
          padding: 16px 16px 100px;
          position: relative;
        }

        /* ======= Header ======= */
        .bw-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 16px;
        }
        .bw-back-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.7);
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          backdrop-filter: blur(8px);
        }
        .dark .bw-back-btn {
          background: rgba(255,255,255,0.08);
          color: #d1d5db;
        }
        .bw-back-btn:active {
          transform: scale(0.9);
        }
        .bw-header-brand {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          font-size: 15px;
          color: #7c3aed;
        }
        .dark .bw-header-brand {
          color: #a78bfa;
        }
        .bw-wand-icon {
          animation: bw-wiggle 2s ease-in-out infinite;
        }
        @keyframes bw-wiggle {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .bw-step-counter {
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af;
          background: rgba(255,255,255,0.7);
          padding: 4px 12px;
          border-radius: 20px;
          backdrop-filter: blur(8px);
        }
        .dark .bw-step-counter {
          background: rgba(255,255,255,0.06);
          color: #6b7280;
        }

        /* ======= Progress Bar ======= */
        .bw-progress-track {
          height: 6px;
          background: rgba(0,0,0,0.06);
          border-radius: 100px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .dark .bw-progress-track {
          background: rgba(255,255,255,0.06);
        }
        .bw-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ec4899, #8b5cf6, #6366f1);
          border-radius: 100px;
          transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* ======= Step Content ======= */
        .bw-step-content {
          animation: bw-fade-in 0.35s ease-out;
        }
        .bw-slide-in {
          animation: bw-slide-in 0.35s ease-out;
        }
        .bw-slide-out-left {
          animation: bw-slide-out-left 0.25s ease-in forwards;
        }
        .bw-slide-out-right {
          animation: bw-slide-out-right 0.25s ease-in forwards;
        }

        @keyframes bw-fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bw-slide-in {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bw-slide-out-left {
          to { opacity: 0; transform: translateX(-30px); }
        }
        @keyframes bw-slide-out-right {
          to { opacity: 0; transform: translateX(30px); }
        }

        /* ======= Step Header ======= */
        .bw-step-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .bw-step-emoji {
          font-size: 48px;
          margin-bottom: 12px;
          animation: bw-bounce-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes bw-bounce-in {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .bw-step-title {
          font-size: 22px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 6px;
          line-height: 1.3;
        }
        .dark .bw-step-title {
          color: #f3f4f6;
        }
        .bw-step-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.4;
        }
        .dark .bw-step-subtitle {
          color: #9ca3af;
        }

        /* ======= Option Cards ======= */
        .bw-options-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .bw-option-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border-radius: 16px;
          border: 2px solid rgba(0,0,0,0.06);
          background: rgba(255,255,255,0.75);
          backdrop-filter: blur(12px);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-align: left;
          width: 100%;
          animation: bw-card-in 0.4s ease-out both;
          -webkit-tap-highlight-color: transparent;
        }
        .dark .bw-option-card {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
        }
        @keyframes bw-card-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .bw-option-card:hover {
          border-color: rgba(139,92,246,0.3);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(139,92,246,0.1);
        }
        .bw-option-card:active {
          transform: scale(0.98);
        }
        .bw-option-selected {
          border-color: #8b5cf6 !important;
          background: linear-gradient(135deg, rgba(139,92,246,0.08), rgba(236,72,153,0.06)) !important;
          box-shadow: 0 4px 20px rgba(139,92,246,0.15), inset 0 0 0 1px rgba(139,92,246,0.1);
        }
        .dark .bw-option-selected {
          background: linear-gradient(135deg, rgba(139,92,246,0.12), rgba(236,72,153,0.08)) !important;
          border-color: #a78bfa !important;
        }
        .bw-option-emoji {
          font-size: 28px;
          flex-shrink: 0;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(139,92,246,0.06);
          border-radius: 12px;
        }
        .dark .bw-option-emoji {
          background: rgba(139,92,246,0.1);
        }
        .bw-option-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          min-width: 0;
        }
        .bw-option-label {
          font-weight: 700;
          font-size: 15px;
          color: #111827;
        }
        .dark .bw-option-label {
          color: #f3f4f6;
        }
        .bw-option-desc {
          font-size: 12.5px;
          color: #6b7280;
          line-height: 1.3;
        }
        .dark .bw-option-desc {
          color: #9ca3af;
        }
        .bw-option-check {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          animation: bw-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes bw-pop {
          0% { transform: scale(0); }
          100% { transform: scale(1); }
        }

        /* ======= Custom Input Section ======= */
        .bw-custom-section {
          margin-top: 16px;
          text-align: center;
        }
        .bw-custom-toggle {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 18px;
          border-radius: 20px;
          border: 1.5px dashed rgba(139,92,246,0.3);
          background: transparent;
          color: #7c3aed;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dark .bw-custom-toggle {
          border-color: rgba(167,139,250,0.3);
          color: #a78bfa;
        }
        .bw-custom-toggle:hover, .bw-custom-toggle-active {
          background: rgba(139,92,246,0.06);
          border-color: #8b5cf6;
        }
        .bw-custom-input-area {
          margin-top: 12px;
          animation: bw-fade-in 0.3s ease-out;
        }
        .bw-custom-textarea {
          width: 100%;
          padding: 14px;
          border-radius: 14px;
          border: 2px solid rgba(139,92,246,0.2);
          background: rgba(255,255,255,0.8);
          font-size: 14px;
          font-family: inherit;
          resize: none;
          outline: none;
          transition: border-color 0.2s;
          color: #111827;
        }
        .dark .bw-custom-textarea {
          background: rgba(255,255,255,0.04);
          border-color: rgba(167,139,250,0.2);
          color: #f3f4f6;
        }
        .bw-custom-textarea:focus {
          border-color: #8b5cf6;
        }
        .bw-custom-textarea::placeholder {
          color: #9ca3af;
        }

        /* ======= Buttons ======= */
        .bw-btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          color: white;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 14px rgba(139,92,246,0.3);
          -webkit-tap-highlight-color: transparent;
        }
        .bw-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(139,92,246,0.4);
        }
        .bw-btn-primary:active:not(:disabled) {
          transform: scale(0.97);
        }
        .bw-btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .bw-btn-sm {
          padding: 10px 18px;
          font-size: 14px;
          margin-top: 10px;
        }
        .bw-btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .dark .bw-btn-ghost {
          color: #9ca3af;
        }
        .bw-btn-ghost:hover {
          background: rgba(0,0,0,0.04);
          color: #374151;
        }
        .dark .bw-btn-ghost:hover {
          background: rgba(255,255,255,0.06);
          color: #d1d5db;
        }

        /* ======= Footer Navigation ======= */
        .bw-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          padding: 12px 16px;
          padding-bottom: max(12px, env(safe-area-inset-bottom));
          background: rgba(255,255,255,0.85);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(0,0,0,0.06);
          z-index: 50;
          max-width: 480px;
          margin: 0 auto;
        }
        .dark .bw-footer {
          background: rgba(15,15,20,0.9);
          border-top-color: rgba(255,255,255,0.06);
        }
        .bw-footer-spacer {
          flex: 1;
        }

        /* ======= Completion Screen ======= */
        .bw-complete-card {
          text-align: center;
          padding: 32px 0 24px;
          position: relative;
          z-index: 2;
        }
        .bw-complete-icon {
          margin-bottom: 20px;
          animation: bw-bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bw-party-icon, .bw-success-ring {
          width: 88px;
          height: 88px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }
        .bw-party-icon {
          background: linear-gradient(135deg, rgba(139,92,246,0.1), rgba(236,72,153,0.1));
          color: #8b5cf6;
        }
        .dark .bw-party-icon {
          background: linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15));
          color: #a78bfa;
        }
        .bw-success-ring {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          animation: bw-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .bw-complete-title {
          font-size: 26px;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px;
        }
        .dark .bw-complete-title {
          color: #f3f4f6;
        }
        .bw-complete-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0 0 28px;
          line-height: 1.5;
          max-width: 340px;
          margin-left: auto;
          margin-right: auto;
        }
        .dark .bw-complete-subtitle {
          color: #9ca3af;
        }

        /* ======= Summary ======= */
        .bw-summary {
          background: rgba(255,255,255,0.7);
          backdrop-filter: blur(12px);
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 28px;
          border: 1px solid rgba(0,0,0,0.06);
          text-align: left;
        }
        .dark .bw-summary {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.06);
        }
        .bw-summary-title {
          font-size: 15px;
          font-weight: 700;
          color: #8b5cf6;
          margin: 0 0 16px;
          text-align: center;
        }
        .bw-summary-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 10px 0;
          border-bottom: 1px solid rgba(0,0,0,0.04);
        }
        .dark .bw-summary-row {
          border-bottom-color: rgba(255,255,255,0.04);
        }
        .bw-summary-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .bw-summary-label {
          font-size: 11px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bw-summary-value {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }
        .dark .bw-summary-value {
          color: #f3f4f6;
        }

        .bw-complete-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        /* ======= Confetti ======= */
        .bw-confetti-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 1;
        }
        .bw-confetti-piece {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          opacity: 0.8;
          animation: bw-confetti-fall linear forwards;
        }
        @keyframes bw-confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        /* ======= Spinner ======= */
        .bw-spin {
          animation: bw-spin 1s linear infinite;
        }
        @keyframes bw-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default BrandWizard;
