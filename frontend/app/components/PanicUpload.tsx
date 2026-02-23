"use client";

import { useMemo, useRef, useState } from "react";
import { parsePDF } from "@/lib/parser/pdfParser";
import { extractDeadlines } from "@/lib/extract/extractor";
import type { DeadlineCandidate } from "@/lib/extract/models";
import { Inspector } from "./Inspector";
import { Download, Upload } from "lucide-react";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function PanicUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string>("");
  const [pages, setPages] = useState<number | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [defaultYear, setDefaultYear] = useState<number>(() => new Date().getFullYear());
  const [minConfidence, setMinConfidence] = useState<number>(45);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"date-asc" | "date-desc" | "confidence-desc">("date-asc");

  const [manualEdits, setManualEdits] = useState<Record<string, Partial<DeadlineCandidate>>>({});
  const [manualCandidates, setManualCandidates] = useState<DeadlineCandidate[]>([]);

  async function onFileChange(file: File) {
    setLoading(true);
    setStatus("Reading PDF…");
    setPages(null);
    setRawText("");
    setSelectedId(null);
    setManualEdits({});
    setManualCandidates([]);

    try {
      const result = await parsePDF(file);
      setPages(result.metadata.pages);
      setRawText(result.text);
      setStatus("Done");
    } catch (err) {
      console.error(err);
      setStatus("Could not read this PDF.");
    } finally {
      setLoading(false);
    }
  }

  const extraction = useMemo(() => {
    if (!rawText) return null;
    try {
      return extractDeadlines(rawText, defaultYear);
    } catch (e) {
      console.error("Extraction error:", e);
      return null;
    }
  }, [rawText, defaultYear]);

  const mergedCandidates: DeadlineCandidate[] = useMemo(() => {
    const base = [...(extraction?.candidates ?? []), ...manualCandidates];

    return base.map((c) => ({
      ...c,
      ...(manualEdits[c.id] ?? {}),
      evidence: {
        ...c.evidence,
        ...((manualEdits[c.id]?.evidence as Partial<DeadlineCandidate["evidence"]>) ?? {}),
      },
      flags: (manualEdits[c.id]?.flags as string[] | undefined) ?? c.flags,
    }));
  }, [extraction, manualCandidates, manualEdits]);

  const filteredCandidates = useMemo(() => {
    return mergedCandidates.filter((c) => c.confidence >= minConfidence);
  }, [mergedCandidates, minConfidence]);

  const visibleCandidates = useMemo(() => filteredCandidates.filter((c) => c.confidence >= 0), [filteredCandidates]);

  const displayCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = !q
      ? visibleCandidates
      : visibleCandidates.filter((c) =>
          [c.title, c.dateISO, c.type].filter(Boolean).join(" ").toLowerCase().includes(q)
        );

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      if (sort === "confidence-desc") return b.confidence - a.confidence;
      if (sort === "date-desc") return b.dateISO.localeCompare(a.dateISO);
      return a.dateISO.localeCompare(b.dateISO);
    });

    return sorted;
  }, [visibleCandidates, query, sort]);

  const selected = useMemo(() => {
    if (!selectedId) return null;
    return mergedCandidates.find((c) => c.id === selectedId) ?? null;
  }, [mergedCandidates, selectedId]);

  function updateCandidate(id: string, patch: Partial<DeadlineCandidate>) {
    setManualEdits((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {}),
        ...patch,
      },
    }));
  }

  function addManualDeadline() {
    const today = new Date().toISOString().slice(0, 10);
    const id = `manual_${Date.now()}`;

    const newCandidate: DeadlineCandidate = {
      id,
      title: "Manual deadline",
      type: "other",
      dateISO: today,
      time24h: undefined,
      confidence: 100,
      flags: ["manual_entry"],
      evidence: {
        snippet: "Manually added by user",
        context: "",
        indexStart: 0,
        indexEnd: 0,
        matchedDateText: "",
        matchedKeywords: [],
      },
    };

    setManualCandidates((prev) => [...prev, newCandidate]);
    setSelectedId(id);
  }

  function removeCandidate(id: string) {
    setManualCandidates((prev) => prev.filter((c) => c.id !== id));
    updateCandidate(id, { confidence: -1 });
    if (selectedId === id) setSelectedId(null);
  }

  function exportCSV() {
    const exportables = displayCandidates.filter(
      (c) => /^\d{4}-\d{2}-\d{2}$/.test(c.dateISO) && c.confidence >= 0
    );
    const lines = [
      ["title", "type", "dateISO", "time24h", "confidence"].join(","),
      ...exportables.map((c) =>
        [
          c.title ?? "",
          c.type,
          c.dateISO,
          c.time24h ?? "",
          String(c.confidence),
        ]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "panicbutton-deadlines.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      className="relative rounded-2xl border border-zinc-800 bg-[#0b1120]"
      style={{
        border: "1px solid #1f2937",
        borderRadius: 18,
        background: "#0b1120",
      }}
    >
      <div
        className="flex items-center justify-between p-6"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 24px",
        }}
      >
        <div className="flex items-center gap-3" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-400"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 12,
              border: "none",
              background: "#3b82f6",
              color: "#ffffff",
              padding: "10px 18px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Upload className="h-5 w-5" />
            Upload PDF
          </button>

          {rawText && (
            <button
              onClick={addManualDeadline}
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm text-zinc-200 transition-colors hover:bg-zinc-800"
              style={{
                borderRadius: 12,
                border: "1px solid #374151",
                background: "transparent",
                color: "#d1d5db",
                padding: "12px 16px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              + Manual
            </button>
          )}
        </div>

        <button
          onClick={exportCSV}
          disabled={displayCandidates.length === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 bg-transparent px-6 py-3 text-lg font-semibold text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:text-zinc-600"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 14,
            border: "1px solid #374151",
            background: "transparent",
            color: displayCandidates.length === 0 ? "#4b5563" : "#e5e7eb",
            padding: "10px 18px",
            fontSize: 16,
            fontWeight: 600,
            cursor: displayCandidates.length === 0 ? "not-allowed" : "pointer",
          }}
        >
          <Download className="h-5 w-5" />
          Export to CSV
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="sr-only"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileChange(file);
        }}
      />

      <div className="min-h-[70vh] p-6" style={{ minHeight: "72vh", padding: 24 }}>
        {!rawText ? (
          <div
            className="flex h-[60vh] flex-col items-center justify-center text-center"
            style={{
              height: "60vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <h2 className="text-6xl font-bold text-zinc-100" style={{ color: "#e5e7eb", fontSize: 72, fontWeight: 700 }}>
              Panic Button
            </h2>
            <p
              style={{
                marginTop: 12,
                maxWidth: 860,
                color: "#a5b4c9",
                fontSize: 22,
                lineHeight: 1.45,
              }}
            >
              Upload your syllabus and we will quietly surface likely deadlines for review.
              You stay in control before exporting anything.
            </p>
            {(loading || status) && (
              <p className="mt-3 text-3xl text-zinc-400" style={{ marginTop: 12, color: "#8fa3bd", fontSize: 28 }}>
                {loading ? "Reading PDF..." : status}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className="flex flex-wrap gap-2"
              style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deadlines..."
                className="w-64 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                style={{
                  width: 300,
                  borderRadius: 8,
                  border: "1px solid #374151",
                  background: "#111827",
                  color: "#e5e7eb",
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as "date-asc" | "date-desc" | "confidence-desc")}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
                style={{
                  borderRadius: 8,
                  border: "1px solid #374151",
                  background: "#111827",
                  color: "#e5e7eb",
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              >
                <option value="date-asc">Date (earliest)</option>
                <option value="date-desc">Date (latest)</option>
                <option value="confidence-desc">Confidence (high)</option>
              </select>
              <label
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
                style={{
                  borderRadius: 8,
                  border: "1px solid #374151",
                  background: "#111827",
                  color: "#d1d5db",
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              >
                Min confidence: {minConfidence}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={minConfidence}
                onChange={(e) => setMinConfidence(clamp(Number(e.target.value), 0, 100))}
                className="w-40 accent-blue-500"
                style={{ width: 180 }}
              />
              <input
                type="number"
                value={defaultYear}
                onChange={(e) => setDefaultYear(clamp(Number(e.target.value || defaultYear), 1900, 2100))}
                className="w-32 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 outline-none"
                style={{
                  width: 140,
                  borderRadius: 8,
                  border: "1px solid #374151",
                  background: "#111827",
                  color: "#e5e7eb",
                  padding: "10px 12px",
                  fontSize: 14,
                }}
              />
            </div>

            {displayCandidates.length === 0 ? (
              <div
                className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-8 text-center text-zinc-500"
                style={{
                  borderRadius: 12,
                  border: "1px dashed #374151",
                  background: "rgba(17,24,39,0.5)",
                  color: "#6b7280",
                  padding: 24,
                  textAlign: "center",
                }}
              >
                No deadlines matched current filters.
              </div>
            ) : (
              <div
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
                style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))" }}
              >
                {displayCandidates.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selectedId === c.id
                        ? "border-blue-400/60 bg-zinc-800"
                        : "border-zinc-700 bg-zinc-900/70 hover:bg-zinc-800/80"
                    }`}
                    style={{
                      borderRadius: 12,
                      border: selectedId === c.id ? "1px solid rgba(96,165,250,0.7)" : "1px solid #374151",
                      background: selectedId === c.id ? "#1f2937" : "rgba(17,24,39,0.75)",
                      padding: 16,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    <div className="mb-2 text-sm font-semibold text-zinc-100" style={{ marginBottom: 8, color: "#f3f4f6", fontSize: 16, fontWeight: 600 }}>
                      {c.title || "Untitled"}
                    </div>
                    <div className="text-xs text-zinc-400" style={{ color: "#9ca3af", fontSize: 13 }}>{c.type}</div>
                    <div className="mt-3 flex items-center justify-between" style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span className="font-mono text-sm text-zinc-200" style={{ color: "#e5e7eb", fontSize: 15 }}>{c.dateISO}</span>
                      <span
                        className="rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300"
                        style={{
                          borderRadius: 8,
                          border: "1px solid #374151",
                          background: "#1f2937",
                          color: "#d1d5db",
                          padding: "4px 8px",
                          fontSize: 12,
                        }}
                      >
                        {c.confidence}% match
                      </span>
                    </div>
                    {pages !== null && (
                      <div className="mt-2 text-[11px] text-zinc-500" style={{ marginTop: 8, color: "#6b7280", fontSize: 11 }}>
                        {status === "Done" ? `${pages} pages parsed` : status}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Overlay / Inspector */}
      <Inspector
        selected={selected}
        onUpdate={updateCandidate}
        onRemove={removeCandidate}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
