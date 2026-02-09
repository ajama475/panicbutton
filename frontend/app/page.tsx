import dynamic from "next/dynamic";
import { Sparkles, Shield, Rocket } from "lucide-react";

const PanicUpload = dynamic(() => import("./components/PanicUpload"), {
  ssr: false,
  loading: () => (
    <div className="grid md:grid-cols-3 gap-4 animate-pulse">
      <div className="md:col-span-2 h-[300px] bg-white/5 rounded-3xl" />
      <div className="md:col-span-1 h-[300px] bg-white/5 rounded-3xl" />
      <div className="md:col-span-2 h-[600px] bg-white/5 rounded-3xl" />
      <div className="md:col-span-1 h-[300px] bg-white/5 rounded-3xl" />
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-12 md:py-20 lg:px-8">
        {/* Header Section */}
        <header className="mb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-500">
            <Sparkles className="w-3 h-3" />
            Do it yourself
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-2xl">
              Panic<span className="text-accent underline decoration-primary decoration-8">Button</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              Tailored for excellence. Turn your syllabus into a high-octane
              Green & Gold productivity strategy.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 pt-4">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Shield className="w-4 h-4 text-accent" />
              LOCAL-ONLY PROCESSING
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              <Rocket className="w-4 h-4 text-accent" />
              INSTANT EXTRACTION
            </div>
          </div>
        </header>

        {/* Bento Grid Application */}
        <div className="animate-in fade-in zoom-in-95 duration-700 delay-200 fill-mode-both">
          <PanicUpload />
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-600">
          <div className="flex gap-8">
            <span>Privacy: Client-Side Only</span>
            <span> Security: No Cloud Storage</span>
          </div>
          <div className="flex gap-4">
            <span className="text-slate-400">PanicButton &copy; 2026</span>
            <span className="text-blue-500/50"> Built for Excellence</span>
          </div>
        </footer>
      </div>
    </main>
  );
}



