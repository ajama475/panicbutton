import dynamic from "next/dynamic";

const PanicUpload = dynamic(() => import("./components/PanicUpload"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-zinc-800 bg-[#0b1120] p-6">
      <div className="h-[70vh] animate-pulse rounded-xl bg-zinc-900/60" />
    </div>
  ),
});

export default function Home() {
  return (
    <main
      className="min-h-screen bg-zinc-950 p-6 text-zinc-100"
      style={{ minHeight: "100vh", background: "#0a0f1c", padding: 8, color: "#f3f4f6" }}
    >
      <div className="mx-auto max-w-[1500px]" style={{ margin: "0 auto", maxWidth: 1500 }}>
        <PanicUpload />
      </div>
    </main>
  );
}
