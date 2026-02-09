"use client";

import React from "react";
import { Calendar, Clock, AlertTriangle, CheckCircle2, MoreHorizontal, MousePointer2 } from "lucide-react";
import { DeadlineCandidate } from "@/lib/extract/models";
import { cn } from "@/lib/utils";

interface DeadlineListProps {
    candidates: DeadlineCandidate[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onAdd: () => void;
    className?: string;
}

export const DeadlineList = ({
    candidates,
    selectedId,
    onSelect,
    onAdd,
    className,
}: DeadlineListProps) => {
    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-accent flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Extraction Grid
                </h3>
                <button
                    onClick={onAdd}
                    className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full bg-accent text-accent-foreground hover:scale-105 transition-transform"
                >
                    + Manual Entry
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-none">
                {candidates.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center space-y-2 text-muted-foreground bg-muted/30 rounded-3xl border border-dashed border-border">
                        <MousePointer2 className="w-8 h-8 opacity-20" />
                        <p className="text-xs font-medium uppercase tracking-widest">No candidates available</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b border-border mb-2">
                            <div className="col-span-6">Assignment / Event</div>
                            <div className="col-span-3 text-center">Date</div>
                            <div className="col-span-3 text-right">Match</div>
                        </div>

                        {candidates.map((c) => (
                            <DeadlineRow
                                key={c.id}
                                candidate={c}
                                isActive={c.id === selectedId}
                                onClick={() => onSelect(c.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface DeadlineRowProps {
    candidate: DeadlineCandidate;
    isActive: boolean;
    onClick: () => void;
}

const DeadlineRow = ({ candidate: c, isActive, onClick }: DeadlineRowProps) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full grid grid-cols-12 gap-4 items-center px-4 py-3 rounded-xl transition-all duration-200 border border-transparent",
                isActive
                    ? "bg-accent/10 border-accent/20 translate-x-1"
                    : "hover:bg-white/5 hover:border-white/5"
            )}
        >
            <div className="col-span-6 flex items-center gap-3 min-w-0">
                <div className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    isActive ? "bg-accent animate-pulse" : "bg-muted-foreground/30"
                )} />
                <span className="text-sm font-bold truncate tracking-tight text-foreground uppercase">
                    {c.title || "Untitled"}
                </span>
            </div>

            <div className="col-span-3 text-center">
                <span className="text-xs font-medium text-accent font-mono">
                    {c.dateISO}
                </span>
            </div>

            <div className="col-span-3 text-right">
                <ConfidenceIndicator confidence={c.confidence} />
            </div>
        </button>
    );
};

const ConfidenceIndicator = ({ confidence }: { confidence: number }) => {
    const color = confidence >= 80 ? "text-green-500" : confidence >= 50 ? "text-accent" : "text-destructive";
    return (
        <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/20 border border-white/5", color)}>
            <div className={cn("w-1 h-1 rounded-full bg-current")} />
            <span className="text-[10px] font-black">{confidence}%</span>
        </div>
    );
};
