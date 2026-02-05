"use client";

import { useState } from "react";
import { parsePDF } from "../../lib/parser/pdfParser";

export default function PanicUpload() {
  const [status, setStatus] = useState<string>("");
  const [pages, setPages] = useState<number | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus("Reading PDF…");
    setPages(null);
    setText("");

    try {
      const result = await parsePDF(file);
      setPages(result.metadata.pages);

      // Cap at 4000 chars to keep the DOM responsive
      setText(result.text.slice(0, 4000));

      setStatus("Done");
    } catch (err) {
      console.error(err);
      setStatus("Could not read this PDF.");
    } finally {
      setLoading(false);
    }
  }

  const isError = status === "Could not read this PDF.";

  return (
    <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
      <h2 className="text-xl font-medium mb-2">Upload syllabus</h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-neutral-400">
        Stage 1: Raw PDF → text extraction (observation only)
      </p>

      <input
        type="file"
        accept="application/pdf"
        onChange={onFileChange}
        disabled={loading}
        className="block w-full text-sm
          file:mr-4 file:py-2 file:px-4
          file:rounded-full file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          dark:file:bg-neutral-800
          dark:file:text-neutral-200"
      />

      {status && (
        <div className="mt-4 text-sm">
          <span className={isError ? "text-red-500" : "text-green-600"}>
            {status}
          </span>
          {pages !== null && (
            <span className="text-neutral-500"> • {pages} pages detected</span>
          )}
        </div>
      )}

      {text && (
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
            Raw text output (first 4,000 characters)
          </h3>
          <pre className="max-h-[400px] overflow-auto rounded-lg border border-gray-200 bg-white p-4 text-[10px] font-mono leading-relaxed whitespace-pre-wrap dark:border-neutral-800 dark:bg-black">
            {text}
          </pre>
        </div>
      )}
    </section>
  );
}
