import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
    primary:
        "bg-[var(--color-brand)] text-white border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:opacity-95 active:scale-[0.98] dark:shadow-none",
    secondary:
        "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-strong)] shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-[var(--bg-subtle)] active:scale-[0.98] dark:shadow-none",
    ghost:
        "bg-transparent text-[var(--text-secondary)] border border-transparent hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] active:scale-[0.98]",
    danger:
        "bg-red-600 text-white border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.08)] hover:bg-red-700 active:scale-[0.98] dark:bg-red-600 dark:hover:bg-red-500",
};

const sizeClasses: Record<ButtonSize, string> = {
    sm: "min-h-[40px] sm:min-h-[34px] px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "min-h-[44px] sm:min-h-[40px] px-4 py-2 text-sm rounded-xl gap-2",
    lg: "min-h-[48px] sm:min-h-[44px] px-5 py-2.5 text-sm rounded-xl gap-2",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = "primary",
            size = "md",
            loading = false,
            disabled,
            leftIcon,
            rightIcon,
            fullWidth = false,
            className = "",
            children,
            type = "button",
            ...props
        },
        ref
    ) => {
        const isDisabled = disabled || loading;

        return (
            <button
                ref={ref}
                type={type}
                disabled={isDisabled}
                aria-busy={loading || undefined}
                className={[
                    "inline-flex items-center justify-center font-medium select-none transition-all duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-app)]",
                    "disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
                    variantClasses[variant],
                    sizeClasses[size],
                    fullWidth ? "w-full" : "",
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
                {...props}
            >
                {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
                ) : (
                    leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
                )}
                {children && <span className="truncate">{children}</span>}
                {!loading && rightIcon && (
                    <span className="inline-flex shrink-0">{rightIcon}</span>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
