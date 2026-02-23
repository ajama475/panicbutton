"use client";

import React, { useMemo, useState } from "react";
import { ArrowUpDown, Calendar, MousePointer2, Search } from "lucide-react";
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
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<"date-asc" | "date-desc" | "confidence-asc" | "confidence-desc">("date-asc");

    const visibleCandidates = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = !q
            ? candidates
            : candidates.filter((c) =>
                [c.title, c.dateISO, c.type].filter(Boolean).join(" ").toLowerCase().includes(q)
            );

        const sorted = [...filtered];
        sorted.sort((a, b) => {
            if (sort === "confidence-asc") return a.confidence - b.confidence;
            if (sort === "confidence-desc") return b.confidence - a.confidence;
            if (sort === "date-desc") return b.dateISO.localeCompare(a.dateISO);
            return a.dateISO.localeCompare(b.dateISO);
        });
        return sorted;
    }, [candidates, search, sort]);

    return (
        <div className={cn("flex h-full flex-col", className)}>
            <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                    <Calendar className="h-4 w-4" />
                    Extracted deadlines
                </h3>
                <button
                    onClick={onAdd}
                    className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
                >
                    + Manual Entry
                </button>
            </div>

            <div className="mb-4 grid gap-2 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
                    <Search className="h-3.5 w-3.5" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search deadlines..."
                        className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-500 outline-none"
                    />
                </label>
                <label className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-400">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <select
                        value={sort}
                        onChange={(e) => setSort(e.target.value as "date-asc" | "date-desc" | "confidence-asc" | "confidence-desc")}
                        className="w-full bg-transparent text-zinc-200 outline-none"
                    >
                        <option value="date-asc" className="bg-zinc-900">Date (earliest)</option>
                        <option value="date-desc" className="bg-zinc-900">Date (latest)</option>
                        <option value="confidence-desc" className="bg-zinc-900">Confidence (high)</option>
                        <option value="confidence-asc" className="bg-zinc-900">Confidence (low)</option>
                    </select>
                </label>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
                {visibleCandidates.length === 0 ? (
                    <div className="flex h-40 flex-col items-center justify-center space-y-2 rounded-lg border border-dashed border-zinc-700 bg-zinc-900/60 text-center text-zinc-500">
                        <MousePointer2 className="h-8 w-8 opacity-20" />
                        <p className="text-xs">No candidates available</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {visibleCandidates.map((c) => (
                            <DeadlineCard
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

interface DeadlineCardProps {
    candidate: DeadlineCandidate;
    isActive: boolean;
    onClick: () => void;
}

const DeadlineCard = ({ candidate: c, isActive, onClick }: DeadlineCardProps) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full rounded-lg border p-4 text-left transition-colors",
                isActive
                    ? "border-blue-500/40 bg-zinc-800"
                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/70"
            )}
        >
            <div className="mb-3 flex items-center gap-2">
                <div className={cn(
                    "h-2 w-2 rounded-full shrink-0",
                    isActive ? "bg-blue-400" : "bg-zinc-500"
                )} />
                <span className="truncate text-sm font-medium text-zinc-100">
                    {c.title || "Untitled"}
                </span>
            </div>
            <div className="space-y-2">
                <div className="text-[11px] text-zinc-500">Date</div>
                <div className="font-mono text-xs text-zinc-200">{c.dateISO}</div>
            </div>
            <div className="mt-3 flex justify-end">
                <ConfidenceIndicator confidence={c.confidence} />
            </div>
        </button>
    );
};

const ConfidenceIndicator = ({ confidence }: { confidence: number }) => {
    const color = confidence >= 80 ? "text-green-400" : confidence >= 50 ? "text-zinc-200" : "text-red-400";
    return (
        <div className={cn("inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1", color)}>
            <div className="h-1 w-1 rounded-full bg-current" />
            <span className="text-[10px] font-semibold">{confidence}% match</span>
        </div>
    );
};
