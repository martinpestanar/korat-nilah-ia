
import React from 'react';
import { Sparkles, Lock, Crown, ShieldAlert } from 'lucide-react';

interface UpgradePromptProps {
    // Reason for showing the prompt
    reason?: 'plan' | 'role' | 'permission';

    // Custom message
    message?: string;

    // Compact mode (for overlays)
    compact?: boolean;

    // Feature name to display
    featureName?: string;

    // Custom CTA action
    onUpgradeClick?: () => void;
}

/**
 * UpgradePrompt Component
 * 
 * Shows a prompt when user doesn't have access to a feature.
 * Different messages based on reason (plan upgrade vs role restriction)
 */
const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    reason = 'plan',
    message,
    compact = false,
    featureName,
    onUpgradeClick,
}) => {
    const handleUpgradeClick = () => {
        if (onUpgradeClick) {
            onUpgradeClick();
        } else {
            // Scroll to pricing or open upgrade modal
            window.location.hash = '#/nilah/app/settings';
        }
    };

    // Role restriction message (Staff trying to access Admin features)
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

    // Permission restriction (Staff without specific permission)
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

    // Plan upgrade prompt (Starter trying to access Pro features)
    if (compact) {
        return (
            <div className="text-center p-4">
                <Crown className="h-8 w-8 text-violet-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Función Pro</p>
                <button
                    onClick={handleUpgradeClick}
                    className="mt-2 text-xs text-violet-500 hover:underline"
                >
                    Ver planes
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-500/5 dark:to-pink-500/5 p-8 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-violet-100 to-pink-100 dark:from-violet-500/20 dark:to-pink-500/20 mb-4">
                <Sparkles className="h-8 w-8 text-violet-500" />
            </div>

            <h3 className="font-bold text-xl mb-2">
                {featureName ? `${featureName} es Pro` : 'Funcionalidad Pro'}
            </h3>

            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                {message || 'Esta función está disponible en el plan Pro. Actualiza para desbloquear AI Marketing, rescate de clientas, pronóstico financiero y más.'}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                    onClick={handleUpgradeClick}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 px-6 py-3 font-bold text-white hover:from-violet-600 hover:to-violet-700 shadow-lg shadow-violet-500/25 transition-all hover:scale-105"
                >
                    <Crown size={18} />
                    Actualizar a Pro
                </button>
                <a
                    href="https://wa.me/51999999999?text=Quiero%20saber%20más%20sobre%20el%20plan%20Pro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-white/10 px-6 py-3 font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Hablar con ventas
                </a>
            </div>

            <p className="mt-4 text-xs text-gray-400">
                💡 El 80% de nuestros clientes eligen Pro
            </p>
        </div>
    );
};

export default UpgradePrompt;
