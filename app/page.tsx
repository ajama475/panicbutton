export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="p-8 max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">PanicButton</h1>
          <p className="mt-2 text-lg text-gray-700 dark:text-neutral-300">
            Emergency clarity for academic panic moments.
          </p>
        </header>

        <section className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-xl font-medium mb-2">Upload your syllabus</h2>
          <p className="mb-4 text-gray-700 dark:text-neutral-300">
            Get a reviewable list of deadlines with source snippets and confidence scores.
          </p>

          <button
            className="px-5 py-3 rounded-lg font-medium bg-gray-900 text-white dark:bg-white dark:text-black opacity-60 cursor-not-allowed"
            disabled
          >
            Upload PDF (coming soon)
          </button>

          <p className="mt-4 text-sm text-gray-600 dark:text-neutral-400">
            Phase 1: PDF → reviewed deadlines → .ics export (under 90 seconds)
          </p>
        </section>

        <footer className="mt-10 text-sm text-gray-600 dark:text-neutral-400">
          <p><strong>Status:</strong> Active development</p>
        </footer>
      </div>
    </main>
  );
}

