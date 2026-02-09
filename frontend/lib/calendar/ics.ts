
import type { DeadlineCandidate } from "../extract/models";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toICSDate(dateISO: string): string {
  const [y, m, d] = dateISO.split("-").map(Number);
  return `${y}${pad2(m)}${pad2(d)}`;
}

function escapeICSText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldLine(line: string): string {
  const limit = 75;
  if (line.length <= limit) return line;

  let out = "";
  let i = 0;
  while (i < line.length) {
    const chunk = line.slice(i, i + limit);
    out += i === 0 ? chunk : "\r\n " + chunk;
    i += limit;
  }
  return out;
}

function uidFor(c: DeadlineCandidate): string {
  return `${c.id}@panicbutton.local`;
}

function isValidISODate(dateISO: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateISO);
}

function isValidTime24h(time24h: string): boolean {
  return /^\d{2}:\d{2}$/.test(time24h);
}

export function buildICS(candidates: DeadlineCandidate[]): string {
  const now = new Date();
  const dtstamp =
    `${now.getUTCFullYear()}${pad2(now.getUTCMonth() + 1)}${pad2(now.getUTCDate())}` +
    `T${pad2(now.getUTCHours())}${pad2(now.getUTCMinutes())}${pad2(now.getUTCSeconds())}Z`;

  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("PRODID:-//PanicButton//Syllabus Deadlines//EN");
  lines.push("CALSCALE:GREGORIAN");
  lines.push("METHOD:PUBLISH");

  for (const c of candidates) {
    if (!c.dateISO || !isValidISODate(c.dateISO)) continue;
    if (c.confidence < 0) continue;

    const date = toICSDate(c.dateISO);

    const summary = `${c.title || "Deadline"} (${c.type})`;

    const descriptionParts: string[] = [];
    descriptionParts.push(`Type: ${c.type}`);
    descriptionParts.push(`Confidence: ${c.confidence}`);
    if (c.flags?.length) descriptionParts.push(`Flags: ${c.flags.join(", ")}`);
    if (c.time24h) descriptionParts.push(`Time: ${c.time24h}`);
    if (c.evidence?.matchedDateText) descriptionParts.push(`Matched date text: ${c.evidence.matchedDateText}`);
    if (c.evidence?.matchedKeywords?.length) descriptionParts.push(`Matched keywords: ${c.evidence.matchedKeywords.join(", ")}`);
    if (c.evidence?.snippet) descriptionParts.push(`Snippet: ${c.evidence.snippet}`);

    const description = descriptionParts.join("\n");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeICSText(uidFor(c))}`);
    lines.push(`DTSTAMP:${dtstamp}`);

    if (c.time24h && isValidTime24h(c.time24h)) {
      const [hh, mm] = c.time24h.split(":").map(Number);
      const dtstart = `${date}T${pad2(hh)}${pad2(mm)}00`;

      const [y, m, d] = c.dateISO.split("-").map(Number);
      const startLocal = new Date(y, m - 1, d, hh, mm, 0);
      const endLocal = new Date(startLocal.getTime() + 60 * 60 * 1000);

      const endDate = `${endLocal.getFullYear()}${pad2(endLocal.getMonth() + 1)}${pad2(endLocal.getDate())}`;
      const endTime = `${pad2(endLocal.getHours())}${pad2(endLocal.getMinutes())}00`;
      const dtend = `${endDate}T${endTime}`;

      lines.push(`DTSTART:${dtstart}`);
      lines.push(`DTEND:${dtend}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${date}`);

      const [y, m, d] = c.dateISO.split("-").map(Number);
      const next = new Date(Date.UTC(y, m - 1, d));
      next.setUTCDate(next.getUTCDate() + 1);
      const dtend = `${next.getUTCFullYear()}${pad2(next.getUTCMonth() + 1)}${pad2(next.getUTCDate())}`;

      lines.push(`DTEND;VALUE=DATE:${dtend}`);
    }

    lines.push(foldLine(`SUMMARY:${escapeICSText(summary)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeICSText(description)}`));
    lines.push("TRANSP:TRANSPARENT");
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export function downloadICS(filename: string, icsContent: string) {
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

