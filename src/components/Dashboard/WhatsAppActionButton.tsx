import React from "react";
import { MessageCircle, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface WhatsAppActionButtonProps {
    label: string;
    sublabel?: string;
    count?: number;
    /** Si true, el usuario ya tiene WhatsApp activo y puede ejecutar la acción */
    isActive?: boolean;
    /** Callback cuando el plan está activo */
    onAction?: () => void;
    variant?: "primary" | "secondary" | "ghost";
    className?: string;
}

/**
 * WhatsAppActionButton
 *
 * CTA reutilizable para acciones de WhatsApp automation.
 * - Si el plan está activo: ejecuta onAction()
 * - Si NO está activo: navega al flujo de activación (gancho de venta)
 */
const WhatsAppActionButton: React.FC<WhatsAppActionButtonProps> = ({
    label,
    sublabel,
    count,
    isActive = false,
    onAction,
    variant = "primary",
    className = "",
}) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (isActive && onAction) {
            onAction();
        } else {
            // Navegar al flujo de activación / settings de WhatsApp
            navigate("/settings?tab=whatsapp&source=dashboard_cta");
        }
    };

    if (variant === "ghost") {
        return (
            <button
                onClick={handleClick}
                className={`group flex items-center gap-2 text-sm font-semibold transition-all active:scale-95 ${className}`}
            >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 group-hover:underline">{label}</span>
                {count !== undefined && count > 0 && (
                    <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {count}
                    </span>
                )}
            </button>
        );
    }

    if (variant === "secondary") {
        return (
            <button
                onClick={handleClick}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-400 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-[0.98] min-h-[44px] ${className}`}
            >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                    <span className="ml-1 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {count}
                    </span>
                )}
                {!isActive && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        <Zap className="h-2.5 w-2.5" />
                        Activar
                    </span>
                )}
            </button>
        );
    }

    // primary (default)
    return (
        <div className={`flex flex-col gap-1 ${className}`}>
            <button
                onClick={handleClick}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-green-600 hover:shadow-emerald-500/40 active:scale-[0.98] min-h-[48px]"
            >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {count !== undefined && count > 0 && (
                    <span className="rounded-full bg-white/30 px-2 py-0.5 text-[11px] font-black">
                        {count}
                    </span>
                )}
            </button>
            {!isActive && sublabel && (
                <p className="text-center text-[10px] text-gray-400 dark:text-gray-500">{sublabel}</p>
            )}
        </div>
    );
};

export default WhatsAppActionButton;
