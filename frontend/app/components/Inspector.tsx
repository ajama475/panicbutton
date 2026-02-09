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
            "fixed inset-y-0 right-0 w-full sm:w-[400px] glass shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300",
            className
        )}>
            {/* Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold tracking-tight">Inspector</h2>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Verify & Refine</p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-none">
                {isLowConfidence && (
                    <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-yellow-500">Manual Review Recommended</p>
                            <p className="text-xs text-yellow-500/70">Our AI isn't 100% sure about this date. Please double-check with your syllabus.</p>
                        </div>
                    </div>
                )}

                {/* Title & Type */}
                <section className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Type className="w-3 h-3" />
                            Event Title
                        </label>
                        <input
                            value={selected.title}
                            onChange={(e) => onUpdate(selected.id, { title: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            < ShieldCheck className="w-3 h-3" />
                            Category
                        </label>
                        <select
                            value={selected.type}
                            onChange={(e) => onUpdate(selected.id, { type: e.target.value as DeadlineType })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none transition-all appearance-none"
                        >
                            {[
                                "midterm", "final", "quiz", "assignment", "lab", "project", "reading", "other"
                            ].map(t => (
                                <option key={t} value={t} className="bg-background">{t.toUpperCase()}</option>
                            ))}
                        </select>
                    </div>
                </section>

                {/* Date & Time */}
                <section className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3" />
                            Date (ISO)
                        </label>
                        <input
                            value={selected.dateISO}
                            onChange={(e) => onUpdate(selected.id, { dateISO: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            Time
                        </label>
                        <input
                            value={selected.time24h ?? ""}
                            onChange={(e) => onUpdate(selected.id, { time24h: e.target.value || undefined })}
                            placeholder="e.g. 23:59"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent outline-none transition-all"
                        />
                    </div>
                </section>

                {/* Evidence */}
                <section className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Info className="w-3 h-3" />
                        Found Evidence
                    </label>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-purple-500/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                        <div className="relative p-4 rounded-2xl bg-black/40 border border-white/5 text-[11px] font-mono leading-relaxed text-blue-100/70 italic">
                            {selected.evidence.snippet}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-[9px] px-2 py-1 rounded-full bg-white/5 text-muted-foreground border border-white/5">
                            MATCHED: <span className="text-foreground">{selected.evidence.matchedDateText}</span>
                        </span>
                        {selected.evidence.matchedKeywords.map(kw => (
                            <span key={kw} className="text-[9px] px-2 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                                {kw.toUpperCase()}
                            </span>
                        ))}
                    </div>
                </section>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                    onClick={() => onRemove(selected.id)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all text-sm font-semibold"
                >
                    <Trash2 className="w-4 h-4" />
                    Remove
                </button>
                <button
                    onClick={onClose}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent text-white shadow-lg shadow-accent/20 hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm font-semibold"
                >
                    <ExternalLink className="w-4 h-4" />
                    Save
                </button>
            </div>
        </div>
    );
};
