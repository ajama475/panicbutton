"use client";

import React, { useState } from "react";
import { Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
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
                "group flex min-h-[300px] flex-col items-center justify-center space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center",
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
                {loading ? (
                    <Loader2 className="relative h-10 w-10 animate-spin text-blue-400" />
                ) : isDone ? (
                    <CheckCircle2 className="relative h-10 w-10 text-green-400" />
                ) : isError ? (
                    <AlertCircle className="relative h-10 w-10 text-red-400" />
                ) : (
                    <Upload className="relative h-10 w-10 text-zinc-200" />
                )}
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight text-zinc-100">
                    {loading ? "Analyzing Syllabus..." : isDone ? "Extraction Ready" : "Upload Syllabus"}
                </h3>
                <p className="max-w-[240px] text-sm text-zinc-400">
                    {loading
                        ? "We're identifying dates and deadlines using AI."
                        : isError
                            ? "Something went wrong. Please try another PDF."
                            : "Drag and drop your course syllabus PDF here."}
                </p>
            </div>

            <div className="pt-2">
                <label className="relative">
                    <span className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-zinc-800 px-6 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700">
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
                <div className="flex items-center gap-2 text-xs font-medium">
                    <span className={cn(
                        "h-2 w-2 rounded-full",
                        isDone ? "bg-green-400" : isError ? "bg-red-400" : "bg-blue-400"
                    )} />
                    <span className="text-zinc-400">{status}</span>
                    {pages !== null && <span className="truncate text-zinc-500">• {pages} pages</span>}
                </div>
            )}
        </div>
    );
};
