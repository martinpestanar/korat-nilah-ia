
import React from 'react';
import { Sparkles, Lock, Crown, ShieldAlert, Zap, TrendingUp, Users, CheckCircle } from 'lucide-react';

interface UpgradePromptProps {
    reason?: 'plan' | 'role' | 'permission';
    message?: string;
    compact?: boolean;
    featureName?: string;
    targetPlan?: 'pro' | 'elite';
    onUpgradeClick?: () => void;
}

const GLOW_PRO_BENEFITS = [
    { icon: '🤖', text: 'Nilah responde 24/7 en WhatsApp — sin que toques nada' },
    { icon: '📣', text: 'Campañas de marketing masivo con IA que vende por ti' },
    { icon: '💸', text: 'Rescata clientas ausentes a los 35, 60 y 90 días automáticamente' },
    { icon: '📊', text: 'Proyección financiera: sabe cuánto vas a ganar este mes' },
];

const GLOW_ELITE_BENEFITS = [
    { icon: '🧠', text: 'Copilot ejecutivo: la IA que piensa por ti cada mañana' },
    { icon: '🎙️', text: 'Control total por voz — gestiona tu salón hands-free' },
    { icon: '♾️', text: 'Staff y usuarios ilimitados para toda tu red de salones' },
    { icon: '🛡️', text: 'Rescate VIP de clientas premium con planes personalizados' },
];

const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    reason = 'plan',
    message,
    compact = false,
    featureName,
    targetPlan = 'pro',
    onUpgradeClick,
}) => {
    const handleUpgradeClick = () => {
        if (onUpgradeClick) {
            onUpgradeClick();
        } else {
            window.location.hash = '#/nilah/app/settings';
        }
    };

    // Role restriction
    if (reason === 'role') {
        if (compact) {
            return (
                <div className="text-center p-4">
                    <ShieldAlert className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Solo administradores</p>
                </div>
            );
        }
        return (
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#141414] p-6 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-gray-100 dark:bg-white/5 mb-4">
                    <Lock className="h-7 w-7 text-gray-400" />
                </div>
                <h3 className="font-bold text-lg mb-2">Acceso Restringido</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                    {message || 'Esta función está disponible solo para administradores. Contacta al dueño del salón si necesitas acceso.'}
                </p>
            </div>
        );
    }

    // Permission restriction
    if (reason === 'permission') {
        if (compact) {
            return (
                <div className="text-center p-4">
                    <Lock className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Permiso requerido</p>
                </div>
            );
        }
        return (
            <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-6 text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-500/10 mb-4">
                    <Lock className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="font-bold text-lg mb-2">Permiso No Habilitado</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {message || 'Tu administrador no ha habilitado esta función para tu cuenta. Solicita acceso si lo necesitas.'}
                </p>
            </div>
        );
    }

    // ─── COMPACT mode ──────────────────────────────────────────────────────────
    if (compact) {
        const isElite = targetPlan === 'elite';
        return (
            <div className="text-center p-4">
                <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full mb-2 ${
                    isElite ? 'bg-emerald-500/15' : 'bg-violet-500/15'
                }`}>
                    <Crown className={`h-5 w-5 ${isElite ? 'text-emerald-400' : 'text-violet-500'}`} />
                </div>
                <p className={`text-sm font-bold mb-0.5 ${isElite ? 'text-emerald-400' : 'text-violet-600 dark:text-violet-400'}`}>
                    {isElite ? '💎 Exclusivo Glow Elite' : '⭐ Exclusivo Glow Pro'}
                </p>
                <p className="text-xs text-gray-500 mb-2">{featureName || 'Esta función'} no está en tu plan actual</p>
                <button
                    onClick={handleUpgradeClick}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg text-white ${
                        isElite
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-r from-violet-500 to-violet-700'
                    }`}
                >
                    Desbloquear ahora →
                </button>
            </div>
        );
    }

    // ─── FULL mode — GLOW PRO ──────────────────────────────────────────────────
    if (targetPlan !== 'elite') {
        return (
            <div className="rounded-2xl overflow-hidden border border-violet-200 dark:border-violet-500/20">
                {/* Hero banner */}
                <div className="bg-gradient-to-br from-violet-600 via-purple-600 to-violet-800 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)' }}
                    />
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-white text-xs font-bold mb-4 border border-white/20">
                            <Sparkles className="h-3.5 w-3.5" />
                            GLOW PRO
                        </div>
                        <h3 className="font-black text-2xl text-white mb-2">
                            {featureName ? `${featureName} requiere Glow Pro` : 'Tu salón merece trabajar solo'}
                        </h3>
                        <p className="text-violet-200 text-sm max-w-sm mx-auto">
                            {message || 'Mientras tú atiendes a una clienta, Nilah Pro está agendando 3 más, enviando recordatorios y rescatando las que no han vuelto en semanas.'}
                        </p>
                    </div>
                </div>

                {/* Benefits list */}
                <div className="bg-white dark:bg-[#0f0f1a] p-6">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                        Lo que desbloqueas con Glow Pro:
                    </p>
                    <div className="space-y-3 mb-6">
                        {GLOW_PRO_BENEFITS.map((b, i) => (
                            <div key={i} className="flex items-start gap-3">
                                <span className="text-lg leading-none flex-shrink-0">{b.icon}</span>
                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{b.text}</p>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="bg-violet-50 dark:bg-violet-500/5 border border-violet-100 dark:border-violet-500/15 rounded-xl p-3.5 mb-5 flex items-center gap-3">
                        <TrendingUp className="h-5 w-5 text-violet-500 flex-shrink-0" />
                        <p className="text-sm text-violet-800 dark:text-violet-300">
                            <strong>Los salones con Glow Pro</strong> captan en promedio{' '}
                            <strong className="text-violet-600 dark:text-violet-400">+8 citas nuevas al mes</strong>{' '}
                            gracias al sistema de rescate automático.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleUpgradeClick}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-700 px-6 py-3.5 font-bold text-white hover:from-violet-600 hover:to-violet-800 shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02] active:scale-100"
                        >
                            <Crown size={18} />
                            Actualizar a Glow Pro
                        </button>
                        <a
                            href="https://wa.me/51999999999?text=Quiero%20saber%20m%C3%A1s%20sobre%20Glow%20Pro%20de%20Nilah"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-6 py-3.5 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm"
                        >
                            💬 Hablar con ventas
                        </a>
                    </div>

                    <p className="mt-4 text-center text-xs text-gray-400">
                        ✅ Sin contratos · Cancela cuando quieras · Setup incluido
                    </p>
                </div>
            </div>
        );
    }

    // ─── FULL mode — GLOW ELITE ───────────────────────────────────────────────
    return (
        <div className="rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-500/20">
            <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, white 0%, transparent 50%)' }}
                />
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-white text-xs font-bold mb-4 border border-white/20">
                        <Zap className="h-3.5 w-3.5" />
                        GLOW ELITE
                    </div>
                    <h3 className="font-black text-2xl text-white mb-2">
                        {featureName ? `${featureName} es exclusivo Elite` : 'La experiencia Nilah sin límites'}
                    </h3>
                    <p className="text-emerald-100 text-sm max-w-sm mx-auto">
                        {message || 'Glow Elite es para las dueñas que quieren que su salón opere como una empresa — con un copiloto de IA que piensa y toma decisiones contigo.'}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0f0f1a] p-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                    El poder completo de Nilah:
                </p>
                <div className="space-y-3 mb-6">
                    {GLOW_ELITE_BENEFITS.map((b, i) => (
                        <div key={i} className="flex items-start gap-3">
                            <span className="text-lg leading-none flex-shrink-0">{b.icon}</span>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{b.text}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/15 rounded-xl p-3.5 mb-5 flex items-center gap-3">
                    <Users className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    <p className="text-sm text-emerald-800 dark:text-emerald-300">
                        <strong>Glow Elite</strong> incluye staff y usuarios ilimitados — perfecto para{' '}
                        <strong>cadenas de salones y franquicias.</strong>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleUpgradeClick}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-3.5 font-bold text-white hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-100"
                    >
                        <Crown size={18} />
                        Actualizar a Glow Elite
                    </button>
                    <a
                        href="https://wa.me/51999999999?text=Quiero%20saber%20m%C3%A1s%20sobre%20Glow%20Elite%20de%20Nilah"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-6 py-3.5 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-sm"
                    >
                        💬 Hablar con ventas
                    </a>
                </div>
                <p className="mt-4 text-center text-xs text-gray-400">
                    💎 Acceso prioritario · Onboarding personalizado · Soporte VIP 24/7
                </p>
            </div>
        </div>
    );
};

export default UpgradePrompt;
