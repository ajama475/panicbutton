import React from "react";
import { cn } from "@/lib/utils";

export const BentoGrid = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "grid grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3 max-w-7xl mx-auto",
                className
            )}
        >
            {children}
        </div>
    );
};

export const BentoGridItem = ({
    className,
    title,
    description,
    header,
    icon,
}: {
    className?: string;
    title?: string | React.ReactNode;
    description?: string | React.ReactNode;
    header?: React.ReactNode;
    icon?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "row-span-1 flex flex-col justify-between space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition",
                className
            )}
        >
            {header}
            <div>
                {icon}
                <div className="mb-2 mt-2 text-sm font-semibold text-zinc-100">
                    {title}
                </div>
                <div className="text-xs text-zinc-400">
                    {description}
                </div>
            </div>
        </div>
    );
};
