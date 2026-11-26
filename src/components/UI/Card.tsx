import React from "react";

export type CardPadding = "none" | "sm" | "md" | "lg";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    padding?: CardPadding;
    children: React.ReactNode;
}

const paddingClasses: Record<CardPadding, string> = {
    none: "p-0",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-5",
    lg: "p-5 sm:p-6",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ padding = "md", className = "", children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={[
                    "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]",
                    "shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none",
                    "transition-colors duration-150",
                    paddingClasses[padding],
                    className,
                ]
                    .filter(Boolean)
                    .join(" ")}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";

export interface StatTileProps {
    label: string;
    value: React.ReactNode;
    hint?: string;
    delta?: {
        value: string;
        tone?: "positive" | "negative" | "neutral";
    };
    icon?: React.ReactNode;
    className?: string;
}

const deltaToneClasses: Record<"positive" | "negative" | "neutral", string> = {
    positive:
        "text-emerald-700 bg-emerald-50 border-emerald-200/70 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/50",
    negative:
        "text-red-700 bg-red-50 border-red-200/70 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800/50",
    neutral:
        "text-[var(--text-secondary)] bg-[var(--bg-subtle)] border-[var(--border-subtle)]",
};

export const StatTile: React.FC<StatTileProps> = ({
    label,
    value,
    hint,
    delta,
    icon,
    className = "",
}) => {
    return (
        <Card padding="md" className={`flex flex-col justify-between gap-2 ${className}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                    {label}
                </span>
                {icon && (
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                        {icon}
                    </span>
                )}
            </div>

            <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)] tabular-nums">
                    {value}
                </div>
                {delta && (
                    <span
                        className={[
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border tabular-nums shrink-0",
                            deltaToneClasses[delta.tone ?? "neutral"],
                        ].join(" ")}
                    >
                        {delta.value}
                    </span>
                )}
            </div>

            {hint && (
                <p className="text-[11px] text-[var(--text-muted)] truncate">{hint}</p>
            )}
        </Card>
    );
};

export default Card;
