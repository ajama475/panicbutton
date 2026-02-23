"use client";

import React from "react";
import { X, Trash2, ShieldCheck, AlertCircle, ExternalLink, Calendar as CalendarIcon, Type, Clock, Info } from "lucide-react";
import { DeadlineCandidate, DeadlineType } from "@/lib/extract/models";
import { cn } from "@/lib/utils";

interface InspectorProps {
    selected: DeadlineCandidate | null;
    onUpdate: (id: string, patch: Partial<DeadlineCandidate>) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
    className?: string;
}

export const Inspector = ({
    selected,
    onUpdate,
    onRemove,
    onClose,
    className,
}: InspectorProps) => {
    if (!selected) return null;

    const isLowConfidence = selected.confidence < 60;

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-zinc-800 bg-zinc-950 shadow-xl sm:w-[400px]",
            className
        )}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 p-6">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Inspector</h2>
                    <p className="text-xs text-zinc-400">Verify and refine</p>
                </div>
                <button
                    onClick={onClose}
                    className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
                {isLowConfidence && (
                    <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <AlertCircle className="h-5 w-5 shrink-0 text-amber-300" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-amber-300">Manual Review Recommended</p>
                            <p className="text-xs text-amber-200/90">Our AI is not fully sure about this date. Please double-check with your syllabus.</p>
                        </div>
                    </div>
                )}

                {/* Title & Type */}
                <section className="space-y-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                            <Type className="w-3 h-3" />
                            Event Title
                        </label>
                        <input
                            value={selected.title}
                            onChange={(e) => onUpdate(selected.id, { title: e.target.value })}
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-zinc-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                            <ShieldCheck className="w-3 h-3" />
                            Category
                        </label>
                        <select
                            value={selected.type}
                            onChange={(e) => onUpdate(selected.id, { type: e.target.value as DeadlineType })}
                            className="w-full appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-zinc-500"
                        >
                            {[
                                "midterm", "final", "quiz", "assignment", "lab", "project", "reading", "other"
                            ].map(t => (
                                <option key={t} value={t} className="bg-zinc-900">{t.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Date & Time */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                            <CalendarIcon className="w-3 h-3" />
                            Date (ISO)
                        </label>
                        <input
                            value={selected.dateISO}
                            onChange={(e) => onUpdate(selected.id, { dateISO: e.target.value })}
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-zinc-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                            <Clock className="w-3 h-3" />
                            Time
                        </label>
                        <input
                            value={selected.time24h ?? ""}
                            onChange={(e) => onUpdate(selected.id, { time24h: e.target.value || undefined })}
                            placeholder="e.g. 23:59"
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 outline-none transition focus:border-zinc-500"
                        />
                    </div>
                </section>

                {/* Evidence */}
                <section className="space-y-3">
                    <label className="flex items-center gap-2 text-[11px] font-medium text-zinc-400">
                        <Info className="w-3 h-3" />
                        Found Evidence
                    </label>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-[11px] leading-relaxed text-zinc-400">
                        {selected.evidence.snippet}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-400">
                            MATCHED: <span className="text-zinc-200">{selected.evidence.matchedDateText}</span>
                        </span>
                        {selected.evidence.matchedKeywords.map(kw => (
                            <span key={kw} className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-200">
                                {kw.toUpperCase()}
                            </span>
                        ))}
                    </div>
                </section>
            </div>

            {/* Actions */}
            <div className="flex gap-3 border-t border-zinc-800 p-6">
                <button
                    onClick={() => onRemove(selected.id)}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                    <Trash2 className="w-4 h-4" />
                    Remove
                </button>
                <button
                    onClick={onClose}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700"
                >
                    <ExternalLink className="w-4 h-4" />
                    Save
                </button>
            </div>
        </div>
    );
};
