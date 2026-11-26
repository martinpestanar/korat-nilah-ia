import React from "react";

export interface SegmentedTabItem<T extends string = string> {
    id: T;
    label: string;
    icon?: React.ReactNode;
    badge?: string | number;
    hidden?: boolean;
}

export interface SegmentedTabsProps<T extends string = string> {
    tabs: SegmentedTabItem<T>[];
    activeId: T;
    onChange: (id: T) => void;
    fullWidth?: boolean;
    size?: "sm" | "md";
    className?: string;
    ariaLabel?: string;
}

export function SegmentedTabs<T extends string = string>({
    tabs,
    activeId,
    onChange,
    fullWidth = false,
    size = "md",
    className = "",
    ariaLabel = "Secciones",
}: SegmentedTabsProps<T>) {
    const visibleTabs = tabs.filter((t) => !t.hidden);

    if (visibleTabs.length === 0) return null;

    const sizePad =
        size === "sm"
            ? "min-h-[36px] sm:min-h-[32px] px-2.5 py-1 text-xs"
            : "min-h-[42px] sm:min-h-[36px] px-3 py-1.5 text-xs sm:text-sm";

    return (
        <div
            role="tablist"
            aria-label={ariaLabel}
            className={[
                "items-center gap-1 p-1 rounded-xl max-w-full",
                "bg-[var(--bg-subtle)] border border-[var(--border-subtle)]",
                fullWidth
                    ? "flex w-full overflow-x-auto no-scrollbar"
                    : "inline-flex overflow-x-auto no-scrollbar",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {visibleTabs.map((tab) => {
                const isActive = tab.id === activeId;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => onChange(tab.id)}
                        className={[
                            "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 select-none cursor-pointer",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]",
                            fullWidth ? "flex-1 min-w-fit whitespace-nowrap" : "shrink-0 whitespace-nowrap",
                            sizePad,
                            isActive
                                ? "text-[var(--color-brand)] font-semibold shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-[var(--color-brand)]/25 dark:shadow-none"
                                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent",
                        ].join(" ")}
                        style={
                            isActive
                                ? { backgroundColor: "color-mix(in srgb, var(--color-brand) 7%, var(--bg-surface))" }
                                : undefined
                        }
                    >
                        {tab.icon && (
                            <span className="inline-flex items-center shrink-0 text-sm leading-none">
                                {tab.icon}
                            </span>
                        )}
                        <span className="truncate">{tab.label}</span>
                        {tab.badge !== undefined && tab.badge !== null && (
                            <span
                                className={[
                                    "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold tabular-nums leading-none shrink-0",
                                    isActive
                                        ? "bg-[var(--bg-subtle)] text-[var(--text-primary)]"
                                        : "bg-[var(--bg-surface)] text-[var(--text-muted)]",
                                ].join(" ")}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default SegmentedTabs;
