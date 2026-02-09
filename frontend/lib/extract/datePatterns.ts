export const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};


export const DATE_REGEXES: RegExp[] = [
  // Pattern 0: Month DD, YYYY (February 7, 2026 / Feb 7)
  /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,\s*(\d{4}))?\b/gi,

  // Pattern 1: DD Month YYYY (7 February 2026 / 7 Feb)
  /\b(\d{1,2})\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\s+(\d{4}))?\b/gi,

  // Pattern 2: ISO (2026-02-07)
  /\b(\d{4})-(\d{2})-(\d{2})\b/g,

  // Pattern 3: Slash (MM/DD/YYYY or DD/MM/YYYY)
  /\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/g,
];

export interface DateMatch {
  raw: string;
  indexStart: number;
  indexEnd: number;
  dateISO: string | null;
  flags: string[];
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;
  if (y < 1900 || y > 2100) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function findDateMatches(text: string, defaultYear?: number): DateMatch[] {
  let allMatches: DateMatch[] = [];
  const currentYear = defaultYear ?? new Date().getFullYear();

  DATE_REGEXES.forEach((rx, patternIndex) => {
    rx.lastIndex = 0; 
    let m: RegExpExecArray | null;

    while ((m = rx.exec(text)) !== null) {
      const raw = m[0];
      const indexStart = m.index;
      const indexEnd = m.index + raw.length;
      const flags: string[] = [];
      let dateISO: string | null = null;

      if (patternIndex === 2) { 
        // ISO: YYYY-MM-DD
        dateISO = toISO(Number(m[1]), Number(m[2]), Number(m[3]));
      } 
      else if (patternIndex === 3) { 
        const a = Number(m[1]);
        const b = Number(m[2]);
        const yRaw = m[3];
        const y = Number(yRaw.length === 2 ? `20${yRaw}` : yRaw);

        if (a <= 12 && b <= 12) {
          flags.push("ambiguous_slash_format");
          dateISO = toISO(y, a, b); 
        } else if (a > 12 && b <= 12) {
          dateISO = toISO(y, b, a); 
          flags.push("slash_format_interpreted_as_dd_mm");
        } else {
          dateISO = toISO(y, a, b); // Likely MM/DD
        }
      } 
      else { 
        const hasMonthFirst = isNaN(Number(m[1]));
        const monthToken = hasMonthFirst ? m[1] : m[2];
        const dayToken = hasMonthFirst ? m[2] : m[1];
        const yearToken = m[3];

        const mo = MONTHS[monthToken.toLowerCase().replace('.', '')]; // handle "Sept."
        const d = Number(dayToken);
        const y = yearToken ? Number(yearToken) : currentYear;

        if (!yearToken) flags.push("year_missing_assumed_default");
        dateISO = toISO(y, mo, d);
      }

      allMatches.push({ raw, indexStart, indexEnd, dateISO, flags });
    }
  });

  allMatches.sort((a, b) => a.indexStart - b.indexStart || b.raw.length - a.raw.length);
  
  return allMatches.filter((match, i) => {
    if (i === 0) return true;
    const prev = allMatches[i - 1];
    return match.indexStart >= prev.indexEnd;
  });
}