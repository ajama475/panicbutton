export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen bg-zinc-950 text-zinc-100"
      style={{ minHeight: "100vh", background: "#0a0f1c", color: "#f3f4f6" }}
    >
      <main className="mx-auto max-w-[1500px] p-6" style={{ margin: "0 auto", maxWidth: 1500, padding: 8 }}>
        {children}
      </main>
    </div>
  );
}
