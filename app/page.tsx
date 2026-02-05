import dynamic from 'next/dynamic';

// We MUST use dynamic with ssr: false because PDF.js only works in the browser
const PanicUpload = dynamic(() => import("./components/PanicUpload"), { 
  ssr: false,
  loading: () => (
    <div className="p-6 border rounded-xl animate-pulse bg-gray-50 dark:bg-neutral-900">
      Loading interface...
    </div>
  )
});

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

        <PanicUpload />

        <footer className="mt-10 text-sm text-gray-600 dark:text-neutral-400">
          <p>
            Phase 1: PDF → raw text → observation → then candidate extraction.
          </p>
        </footer>
      </div>
    </main>
  );
}

