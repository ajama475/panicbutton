import dynamic from "next/dynamic";

const PanicUpload = dynamic(() => import("./components/PanicUpload"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-24 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  ),
});

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
      {children}
    </span>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen relative">
      {/* Background layers */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-950" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(59,130,246,0.12),transparent_60%)]" />

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <Pill>Beta</Pill>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            PanicButton
          </h1>

          <p className="mt-3 text-base text-neutral-600 dark:text-neutral-300">
            Upload a syllabus PDF, quickly verify the deadlines, then export them to your calendar.
          </p>

          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
            <div className="flex flex-col gap-1">
              <div>
                <span className="font-medium">How it works:</span>{" "}
                PDF → extracted dates → you review → calendar export.
              </div>
              <div className="text-neutral-500 dark:text-neutral-400">
                Always verify official dates in Canvas/BearTracks.
              </div>
            </div>
          </div>
        </header>

        {/* Main card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-6">
          <PanicUpload />
        </div>

        {/* Footer */}
        <footer className="mt-6 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex flex-col gap-1">
            <div>Privacy: your PDF stays on your device (no file storage server-side).</div>
            <div>Built for speed and clarity — not as an official source of truth.</div>
          </div>
        </footer>
      </div>
    </main>
  );
}



