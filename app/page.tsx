import dynamic from 'next/dynamic';

// We load the component only on the client because PDF.js needs the browser 'window'
const PanicUpload = dynamic(() => import("@/app/components/PanicUpload"), { 
  ssr: false,
  loading: () => <div className="p-6 border rounded-xl animate-pulse bg-gray-50">Loading interface...</div>
});

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="p-8 max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">PanicButton</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-neutral-400">
            Rapid de-escalation through syllabus clarity.
          </p>
        </header>

        <PanicUpload />

        <footer className="mt-12 pt-8 border-t border-gray-100 dark:border-neutral-800 text-xs text-gray-400">
          <p>PanicButton Build 0.1 • Personal Student Project • All processing stays in-browser.</p>
        </footer>
      </div>
    </main>
  );
}
