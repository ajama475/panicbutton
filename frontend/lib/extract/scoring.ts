import type { DeadlineType } from "./models";

export const KEYWORDS: Array<{ type: DeadlineType; words: string[] }> = [
  { type: "midterm", words: ["midterm", "mid-term"] },
  { type: "final", words: ["final", "final exam", "deferred final", "make-up final"] },
  { type: "quiz", words: ["quiz", "test"] },
  { type: "assignment", words: ["assignment", "hw", "homework", "problem set", "pset"] },
  { type: "lab", words: ["lab", "laboratory"] },
  { type: "project", words: ["project", "presentation", "proposal"] },
  { type: "reading", words: ["reading", "read", "chapter"] },
];

const STRONG_SIGNAL = ["due", "deadline", "submit", "submission", "by"];
const WEIGHT_SIGNAL = ["weight", "%", "worth"];

export interface KeywordHit {
  type: DeadlineType;
  matched: string;
  index: number; 
}

export function findKeywordHits(haystack: string): KeywordHit[] {
  const lower = haystack.toLowerCase();
  const hits: KeywordHit[] = [];

  for (const bucket of KEYWORDS) {
    for (const w of bucket.words) {
      let idx = lower.indexOf(w);
      while (idx !== -1) {
        hits.push({ type: bucket.type, matched: w, index: idx });
        idx = lower.indexOf(w, idx + w.length);
      }
    }
  }

  return hits.sort((a, b) => a.index - b.index);
}

export function scoreCandidate(params: {
  context: string;
  dateIndexInContext: number;
  keywordHits: KeywordHit[];
  dateFlags: string[];
}): { confidence: number; flags: string[]; matchedKeywords: string[]; typeGuess: DeadlineType } {
  const { context, dateIndexInContext, keywordHits, dateFlags } = params;
  const lower = context.toLowerCase();

  const flags: string[] = [...dateFlags];
  let score = 25;

  for (const s of STRONG_SIGNAL) if (lower.includes(s)) score += 8;
  for (const w of WEIGHT_SIGNAL) if (lower.includes(w)) score += 6;

  let bestType: DeadlineType = "other";
  let bestProximity = Number.POSITIVE_INFINITY;

  for (const hit of keywordHits) {
    const dist = Math.abs(hit.index - dateIndexInContext);
    if (dist < bestProximity) {
      bestProximity = dist;
      bestType = hit.type;
    }
  }

  if (keywordHits.length > 0) {
    score += 22;
    if (bestProximity <= 30) score += 28;
    else if (bestProximity <= 80) score += 18;
    else score += 8;
  } else {
    flags.push("no_deadline_keyword_in_chunk");
    score -= 15;
  }

  if (dateFlags.includes("ambiguous_slash_format")) score -= 18;

  score = Math.max(0, Math.min(100, score));
  if (score < 55) flags.push("low_confidence");

  const matchedKeywords = Array.from(
    new Set(keywordHits.filter(h => h.type === bestType).map(h => h.matched))
  );

  return { confidence: score, flags, matchedKeywords, typeGuess: bestType };
}

