import React from "react";

export interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    actions,
    className = "",
}) => {
    return (
        <header
            className={[
                "flex flex-wrap items-center justify-between gap-3",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)] flex items-center gap-2 truncate">
                    {title}
                </h1>
                {subtitle && (
                    <div className="mt-0.5 text-xs sm:text-sm text-[var(--text-secondary)] truncate">
                        {subtitle}
                    </div>
                )}
            </div>

            {actions && (
                <div className="flex items-center gap-2 shrink-0">
                    {actions}
                </div>
            )}
        </header>
    );
};

export default PageHeader;
