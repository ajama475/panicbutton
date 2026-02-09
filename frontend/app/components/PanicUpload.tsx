"use client";

import { useMemo, useState } from "react";
import { parsePDF } from "@/lib/parser/pdfParser";
import { extractDeadlines } from "@/lib/extract/extractor";
import type { DeadlineCandidate } from "@/lib/extract/models";
import { buildICS, downloadICS } from "@/lib/calendar/ics";
import { UploadCard } from "./UploadCard";
import { DeadlineList } from "./DeadlineList";
import { Inspector } from "./Inspector";
import { BentoGrid, BentoGridItem } from "./BentoGrid";
import { Settings, Download, Info, LayoutGrid, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

  function exportICS() {
    const exportables = visibleCandidates.filter(
      (c) => /^\d{4}-\d{2}-\d{2}$/.test(c.dateISO) && c.confidence >= 0
    );
    const ics = buildICS(exportables);
    downloadICS("panicbutton-deadlines.ics", ics);
  }

  return (
    <div className="relative">
      <BentoGrid className="max-w-none">
        {/* Step 1: Upload */}
        <UploadCard
          onFileChange={onFileChange}
          loading={loading}
          status={status}
          pages={pages}
          className="md:col-span-2"
        />

        {/* Step 2: Stats / Control */}
        <BentoGridItem
          title="Analysis Insights"
          description={extraction ? `${extraction.stats.totalDatesFound} dates detected. ${visibleCandidates.length} passed threshold.` : "Upload a syllabus to see insights."}
          icon={<Info className="w-5 h-5 text-accent" />}
          header={
            <div className="flex-1 flex flex-col justify-center items-center bg-primary/10 rounded-2xl border border-primary/20">
              <div className="text-4xl font-black text-accent">{visibleCandidates.length}</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent/60">Verified Targets</div>
            </div>
          }
          className="md:col-span-1"
        />

        {/* Step 3: List (The Meat) */}
        <BentoGridItem
          className="md:col-span-2 md:row-span-2"
          header={
            <DeadlineList
              candidates={visibleCandidates}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addManualDeadline}
            />
          }
        />

        {/* Step 4: Configuration */}
        <BentoGridItem
          title="Global Parameters"
          description="Refine extraction strictness and year bias."
          icon={<Settings className="w-5 h-5 text-accent" />}
          header={
            <div className="space-y-4 p-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Base Year</label>
                <input
                  type="number"
                  value={defaultYear}
                  onChange={(e) => setDefaultYear(clamp(Number(e.target.value || defaultYear), 1900, 2100))}
                  className="w-full bg-muted/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-accent outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex justify-between">
                  <span>Confidence</span>
                  <span>{minConfidence}%</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={minConfidence}
                  onChange={(e) => setMinConfidence(Number(e.target.value))}
                  className="w-full accent-accent"
                />
              </div>
            </div>
          }
        />

        {/* Step 5: Export */}
        <BentoGridItem
          title="Calendar Sync"
          description="Export verified deadlines to .ics format."
          icon={<Download className="w-5 h-5 text-accent" />}
          header={
            <div className="flex-1 flex items-center justify-center">
              <button
                onClick={exportICS}
                disabled={visibleCandidates.length === 0}
                className="w-full h-full rounded-2xl bg-accent text-white font-bold flex flex-col items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 disabled:grayscale disabled:opacity-50"
              >
                <Download className="w-8 h-8" />
                <span>DOWNLOAD .ICS</span>
              </button>
            </div>
          }
        />
      </BentoGrid>

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
