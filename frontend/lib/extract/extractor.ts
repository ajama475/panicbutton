import { findDateMatches } from "./datePatterns";
import type { ExtractionResult, DeadlineCandidate, DeadlineType } from "./models";
import { findKeywordHits, scoreCandidate } from "./scoring";

function makeId(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return `cand_${h.toString(16)}`;
}

function normalizeNewlines(rawText: string): string {
  return rawText.replace(/\r\n/g, "\n");
}

function getLineContainingIndex(text: string, indexStart: number): { line: string; lineStart: number } {
  const start = text.lastIndexOf("\n", indexStart);
  const end = text.indexOf("\n", indexStart);
  const lineStart = start === -1 ? 0 : start + 1;
  const lineEnd = end === -1 ? text.length : end;
  return { line: text.slice(lineStart, lineEnd), lineStart };
}


function splitIntoAssessmentChunks(line: string): Array<{ chunk: string; start: number; end: number }> {
  const rx =
    /\b(assignment\s*\d+|assignment|midterm|final\s*exam|final|quiz\s*\d+|quiz|test|project|lab|homework|hw|exam)\b/gi;

  const matches: Array<{ idx: number }> = [];
  rx.lastIndex = 0;

  let m: RegExpExecArray | null;
  while ((m = rx.exec(line)) !== null) {
    matches.push({ idx: m.index });
  }

  if (matches.length === 0) {
    return [{ chunk: line.trim(), start: 0, end: line.length }];
  }

  const chunks: Array<{ chunk: string; start: number; end: number }> = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].idx;
    const end = i + 1 < matches.length ? matches[i + 1].idx : line.length;
    const chunk = line.slice(start, end).trim();
    if (chunk) chunks.push({ chunk, start, end });
  }

  // Safety fallback
  if (chunks.length === 0) return [{ chunk: line.trim(), start: 0, end: line.length }];

  return chunks;
}

function pickChunkContainingDate(
  chunks: Array<{ chunk: string; start: number; end: number }>,
  dateRaw: string
) {
  const needle = dateRaw.toLowerCase();
  for (const c of chunks) {
    if (c.chunk.toLowerCase().includes(needle)) return c;
  }
  return null;
}

function inferTypeFromChunk(chunk: string): DeadlineType {
  const s = chunk.toLowerCase();
  if (s.includes("midterm") || s.includes("mid-term")) return "midterm";
  if (s.includes("final")) return "final";
  if (s.includes("assignment") || s.includes("homework") || /\bhw\b/.test(s)) return "assignment";
  if (s.includes("quiz")) return "quiz";
  if (s.includes("lab")) return "lab";
  if (s.includes("project") || s.includes("proposal") || s.includes("presentation")) return "project";
  if (s.includes("reading") || s.includes("chapter")) return "reading";
  return "other";
}

function inferTitleFromChunk(chunk: string, type: DeadlineType): string {
  const am = /\bassignment\s*(\d{1,2})\b/i.exec(chunk);
  if (am) return `Assignment ${am[1]}`;

  const qm = /\bquiz\s*(\d{1,2})\b/i.exec(chunk);
  if (qm) return `Quiz ${qm[1]}`;

  if (type === "midterm") return "Midterm";
  if (type === "final") return "Final Exam";
  if (type === "lab") return "Lab";
  if (type === "project") return "Project";
  if (type === "reading") return "Reading";

  return "Deadline";
}

function takeSnippet(text: string, indexStart: number, indexEnd: number): string {
  const radius = 120;
  const s = Math.max(0, indexStart - radius);
  const e = Math.min(text.length, indexEnd + radius);
  return text.slice(s, e).replace(/\s+/g, " ").trim();
}

function detectConditional(chunk: string): string[] {
  const s = chunk.toLowerCase();
  const flags: string[] = [];
  if (s.includes("if granted") || s.includes("deferred") || s.includes("make-up") || s.includes("make up")) {
    flags.push("conditional_event");
  }
  return flags;
}

function parseTime24h(chunk: string): string | undefined {
  const s = chunk.toLowerCase();

  // 23:59
  const t24 = /\b([01]?\d|2[0-3]):([0-5]\d)\b/.exec(s);
  if (t24) return `${String(t24[1]).padStart(2, "0")}:${t24[2]}`;

  // 11 AM / 11:30 PM (optional @ prefix)
  const t12 = /@?\s*\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/.exec(s);
  if (t12) {
    let hour = Number(t12[1]);
    const min = Number(t12[2] ?? "0");
    const ap = t12[3];

    if (ap === "pm" && hour !== 12) hour += 12;
    if (ap === "am" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  return undefined;
}

export function extractDeadlines(rawText: string, defaultYear?: number): ExtractionResult {
  const text = normalizeNewlines(rawText);
  const dateMatches = findDateMatches(text, defaultYear);

  let totalDatesFound = 0;
  let candidates: DeadlineCandidate[] = [];

  for (const dm of dateMatches) {
    totalDatesFound += 1;
    if (!dm.dateISO) continue;

    const { line, lineStart } = getLineContainingIndex(text, dm.indexStart);

    const chunks = splitIntoAssessmentChunks(line);
    const chosen = pickChunkContainingDate(chunks, dm.raw);

    const chunk = chosen?.chunk ?? line;
    const chunkStartInLine = chosen?.start ?? 0;

    const dateIndexInLine = dm.indexStart - lineStart;
    const dateIndexInChunk = dateIndexInLine - chunkStartInLine;
    const safeDateIndexInChunk = Math.max(0, Math.min(chunk.length, dateIndexInChunk));

    const keywordHits = findKeywordHits(chunk);
    const scored = scoreCandidate({
      context: chunk,
      dateIndexInContext: safeDateIndexInChunk,
      keywordHits,
      dateFlags: dm.flags,
    });

    const typeFromChunk = inferTypeFromChunk(chunk);
    const type: DeadlineType = typeFromChunk !== "other" ? typeFromChunk : scored.typeGuess;
    const title = inferTitleFromChunk(chunk, type);

    const shouldEmit = scored.confidence >= 40 && !scored.flags.includes("no_deadline_keyword_in_chunk");
    if (!shouldEmit) continue;

    const conditionalFlags = detectConditional(chunk);

    const flags = Array.from(new Set([...(scored.flags ?? []), ...conditionalFlags]));

    let confidence = scored.confidence;
    if (conditionalFlags.includes("conditional_event")) confidence = Math.max(0, confidence - 15);

    const snippet = takeSnippet(text, dm.indexStart, dm.indexEnd);
    const time24h = parseTime24h(chunk);

    const seed = `${dm.dateISO}|${type}|${dm.indexStart}`;

    candidates.push({
      id: makeId(seed),
      title,
      type,
      dateISO: dm.dateISO,
      time24h, 
      confidence,
      evidence: {
        snippet,
        context: chunk,
        indexStart: dm.indexStart,
        indexEnd: dm.indexEnd,
        matchedDateText: dm.raw,
        matchedKeywords: scored.matchedKeywords,
      },
      flags,
    });
  }

  candidates = candidates.filter((c, index) => {
    return (
      candidates.findIndex(
        (other) => other.dateISO === c.dateISO && Math.abs(other.evidence.indexStart - c.evidence.indexStart) < 5
      ) === index
    );
  });

  candidates.sort((a, b) => a.dateISO.localeCompare(b.dateISO) || b.confidence - a.confidence);

  return {
    candidates,
    stats: {
      totalDatesFound,
      candidatesEmitted: candidates.length,
      lowConfidence: candidates.filter((c) => c.confidence < 55).length,
    },
  };
}
