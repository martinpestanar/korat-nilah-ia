import React from "react";

export interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className = "",
}) => {
    return (
        <div
            className={[
                "flex flex-col items-center justify-center text-center px-6 py-10",
                "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]",
                "shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                {icon}
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {title}
            </h3>
            {description && (
                <p className="mt-1 max-w-sm text-xs text-[var(--text-secondary)] leading-relaxed">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
};

export default EmptyState;
