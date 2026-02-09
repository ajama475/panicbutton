"use client";

import { useMemo, useState } from "react";
import { parsePDF } from "../../lib/parser/pdfParser";
import { extractDeadlines } from "../../lib/extract/extractor";
import type { DeadlineCandidate } from "../../lib/extract/models";
import { buildICS, downloadICS } from "../../lib/calendar/ics";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatCandidateLabel(c: DeadlineCandidate) {
  const type = c.type === "other" ? "deadline" : c.type;
  return `${c.title || "Deadline"} • ${type}`;
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "yellow" | "blue";
}) {
  const tones: Record<string, string> = {
    neutral:
      "border-neutral-200 bg-white text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200",
    green:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200",
    yellow:
      "border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-100",
    blue:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function PanicUpload() {
  const [status, setStatus] = useState<string>("");
  const [pages, setPages] = useState<number | null>(null);
  const [rawText, setRawText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [defaultYear, setDefaultYear] = useState<number>(() => new Date().getFullYear());
  const [minConfidence, setMinConfidence] = useState<number>(45);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [manualEdits, setManualEdits] = useState<Record<string, Partial<DeadlineCandidate>>>({});
  const [manualCandidates, setManualCandidates] = useState<DeadlineCandidate[]>([]);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const isError = status === "Could not read this PDF.";

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

  const visibleCandidates = useMemo(() => {
    return filteredCandidates.filter((c) => c.confidence >= 0);
  }, [filteredCandidates]);

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

  const rawPreview = useMemo(() => {
    if (!rawText) return "";
    return rawText.slice(0, 2000); // tighter preview for “modern” feel
  }, [rawText]);

  function exportICS() {
    const exportables = visibleCandidates.filter(
      (c) => /^\d{4}-\d{2}-\d{2}$/.test(c.dateISO) && c.confidence >= 0
    );
    const ics = buildICS(exportables);
    downloadICS("panicbutton-deadlines.ics", ics);
  }

  return (
    <section className="space-y-6">
      {/* Modern intro / steps */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Upload your syllabus</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              PanicButton extracts likely deadlines and shows you the evidence before you export.
            </p>
          </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">1 · Upload</Badge>
              <span className="text-neutral-400">→</span>
              <Badge tone="neutral">2 · Review</Badge>
              <span className="text-neutral-400">→</span>
              <Badge tone="neutral">3 · Export</Badge>
          </div>
        </div>

        <div className="mt-4">
          <label className="group relative block">
            <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 transition group-hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-200/70 dark:bg-neutral-800" />
                <div>
                  <div className="text-sm font-medium">Drop a PDF or click to choose</div>
                  <div className="text-xs text-neutral-500">Your file stays in your browser.</div>
                </div>
              </div>

              <div className="text-xs text-neutral-500">{loading ? "Working…" : "PDF only"}</div>
            </div>

            <input
              type="file"
              accept="application/pdf"
              onChange={onFileChange}
              disabled={loading}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </label>

          {status && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              {isError ? <Badge tone="yellow">Error</Badge> : <Badge tone="green">Ready</Badge>}
              <span className={isError ? "text-red-600 dark:text-red-300" : "text-neutral-700 dark:text-neutral-200"}>
                {status}
              </span>
              {pages !== null && <span className="text-neutral-500">• {pages} pages</span>}
            </div>
          )}
        </div>
      </div>

      {/* Controls + export */}
      {rawText && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Extraction controls
              </div>
              <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Adjust strictness, then export when it looks right.
              </div>

              <div className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                {extraction ? (
                  <>
                    Found <b>{extraction.stats.totalDatesFound}</b> date-like strings → showing{" "}
                    <b>{visibleCandidates.length}</b> candidates (min confidence: <b>{minConfidence}</b>).
                  </>
                ) : (
                  <>No extraction result.</>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone="blue">Explainable rules</Badge>
                <Badge tone="neutral">Evidence shown</Badge>
                <Badge tone="neutral">Editable</Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="text-sm">
                <span className="block text-xs text-neutral-500 mb-1">Assume year</span>
                <input
                  type="number"
                  value={defaultYear}
                  onChange={(e) => setDefaultYear(clamp(Number(e.target.value || defaultYear), 1900, 2100))}
                  className="w-28 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                />
              </label>

              <label className="text-sm">
                <span className="block text-xs text-neutral-500 mb-1">Min confidence</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-48"
                />
                <div className="text-xs text-neutral-500 mt-1">{minConfidence}+</div>
              </label>

              <button
                type="button"
                onClick={exportICS}
                className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                disabled={visibleCandidates.length === 0}
              >
                Export .ics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {rawText && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* List */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Deadlines</h3>

              <button
                type="button"
                onClick={addManualDeadline}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
              >
                + Add
              </button>
            </div>

            {visibleCandidates.length === 0 ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Nothing meets your threshold. Lower “Min confidence.”
              </p>
            ) : (
              <ul className="space-y-2">
                {visibleCandidates.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(c.id)}
                        className={[
                          "w-full text-left rounded-2xl border p-4 transition shadow-sm",
                          active
                            ? "border-blue-300 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/20"
                            : "border-neutral-200 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900",
                        ].join(" ")}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-sm font-medium">{formatCandidateLabel(c)}</div>

                              {c.flags?.includes("conditional_event") && <Badge tone="yellow">Conditional</Badge>}
                              {c.time24h && <Badge tone="neutral">{c.time24h}</Badge>}
                              {c.flags?.includes("manual_entry") && <Badge tone="blue">Manual</Badge>}
                            </div>

                            <div className="mt-1 text-xs text-neutral-500">
                              {c.dateISO} • confidence {c.confidence}
                            </div>
                          </div>

                          {c.flags?.includes("low_confidence") ? (
                            <Badge tone="yellow">review</Badge>
                          ) : (
                            <Badge tone="green">ok</Badge>
                          )}
                        </div>

                        <div className="mt-3 text-[12px] text-neutral-600 dark:text-neutral-300 line-clamp-2">
                          “{c.evidence.snippet}”
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Detail */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
            <h3 className="text-sm font-semibold mb-3">Review</h3>

            {!selected ? (
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Select a deadline to edit it.
              </p>
            ) : (
              <div className="space-y-4">
                {selected.flags?.includes("conditional_event") && (
                  <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-100">
                    This looks conditional (e.g., “deferred / if granted”). Verify in Canvas/BearTracks.
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-sm">
                    <span className="block text-xs text-neutral-500 mb-1">Title</span>
                    <input
                      value={selected.title}
                      onChange={(e) => updateCandidate(selected.id, { title: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="block text-xs text-neutral-500 mb-1">Type</span>
                    <select
                      value={selected.type}
                      onChange={(e) =>
                        updateCandidate(selected.id, { type: e.target.value as DeadlineCandidate["type"] })
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    >
                      <option value="midterm">midterm</option>
                      <option value="final">final</option>
                      <option value="quiz">quiz</option>
                      <option value="assignment">assignment</option>
                      <option value="lab">lab</option>
                      <option value="project">project</option>
                      <option value="reading">reading</option>
                      <option value="other">other</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="block text-xs text-neutral-500 mb-1">Date</span>
                    <input
                      value={selected.dateISO}
                      onChange={(e) => updateCandidate(selected.id, { dateISO: e.target.value })}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="block text-xs text-neutral-500 mb-1">Time (optional)</span>
                    <input
                      value={selected.time24h ?? ""}
                      onChange={(e) =>
                        updateCandidate(selected.id, {
                          time24h: e.target.value.trim() ? e.target.value : undefined,
                        })
                      }
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                      placeholder="11:00"
                    />
                  </label>

                  <label className="text-sm">
                    <span className="block text-xs text-neutral-500 mb-1">Confidence</span>
                    <input
                      type="number"
                      value={selected.confidence}
                      onChange={(e) => updateCandidate(selected.id, { confidence: Number(e.target.value) })}
                      className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
                    />
                  </label>
                </div>

                <div>
                  <div className="text-xs text-neutral-500 mb-2">Evidence</div>
                  <pre className="max-h-[240px] overflow-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-[11px] font-mono leading-relaxed whitespace-pre-wrap dark:border-neutral-800 dark:bg-neutral-900">
                    {selected.evidence.snippet}
                  </pre>
                  <div className="mt-2 text-xs text-neutral-500">
                    Matched: <b>{selected.evidence.matchedDateText}</b> • Keywords:{" "}
                    <b>{(selected.evidence.matchedKeywords ?? []).join(", ") || "none"}</b>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => removeCandidate(selected.id)}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow-sm hover:bg-red-100 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Raw text preview */}
      {rawPreview && (
        <details className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
          <summary className="cursor-pointer text-sm font-semibold">
            Raw text preview (debug)
            <span className="ml-2 text-xs font-normal text-neutral-500">(first 2,000 chars)</span>
          </summary>
          <pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-[10px] font-mono leading-relaxed whitespace-pre-wrap dark:border-neutral-800 dark:bg-neutral-900">
            {rawPreview}
          </pre>
        </details>
      )}
    </section>
  );
}
