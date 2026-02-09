"use client";

import React, { useState } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadCardProps {
    onFileChange: (file: File) => void;
    loading: boolean;
    status: string;
    pages: number | null;
    className?: string;
}

export const UploadCard = ({
    onFileChange,
    loading,
    status,
    pages,
    className,
}: UploadCardProps) => {
    const [isDragActive, setIsDragActive] = useState(false);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileChange(file);
    };

    const isError = status.toLowerCase().includes("could not") || status.toLowerCase().includes("error");
    const isDone = status.toLowerCase() === "done" || status.toLowerCase() === "ready";

    return (
        <div
            className={cn(
                "bento-card group flex flex-col justify-center items-center text-center space-y-4 min-h-[300px]",
                isDragActive && "upload-zone-active",
                className
            )}
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragActive(true);
            }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsDragActive(false);
                const file = e.dataTransfer.files?.[0];
                if (file && file.type === "application/pdf") {
                    onFileChange(file);
                }
            }}
        >
            <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />
                {loading ? (
                    <Loader2 className="w-12 h-12 text-accent animate-spin relative" />
                ) : isDone ? (
                    <CheckCircle2 className="w-12 h-12 text-green-500 relative transition-transform group-hover:scale-110" />
                ) : isError ? (
                    <AlertCircle className="w-12 h-12 text-destructive relative transition-transform group-hover:grow" />
                ) : (
                    <Upload className="w-12 h-12 text-accent relative transition-transform group-hover:-translate-y-1" />
                )}
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight">
                    {loading ? "Analyzing Syllabus..." : isDone ? "Extraction Ready" : "Upload Syllabus"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[200px]">
                    {loading
                        ? "We're identifying dates and deadlines using AI."
                        : isError
                            ? "Something went wrong. Please try another PDF."
                            : "Drag and drop your course syllabus PDF here."}
                </p>
            </div>

            <div className="pt-2">
                <label className="relative">
                    <span className="cursor-pointer inline-flex h-10 items-center justify-center rounded-full bg-accent px-6 text-sm font-medium text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90 hover:shadow-accent/40 active:scale-95">
                        Choose File
                    </span>
                    <input
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        onChange={handleFile}
                        disabled={loading}
                    />
                </label>
            </div>

            {status && (
                <div className="flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
                    <span className={cn(
                        "h-2 w-2 rounded-full",
                        isDone ? "bg-green-500" : isError ? "bg-destructive" : "bg-accent animate-pulse"
                    )} />
                    <span className="text-muted-foreground uppercase tracking-wider">{status}</span>
                    {pages !== null && <span className="text-muted-foreground/50 truncate">• {pages} PAGES</span>}
                </div>
            )}
        </div>
    );
};
