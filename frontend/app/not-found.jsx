import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-page">
      <div className="system-card">
        <span className="system-card__eyebrow">Page not found</span>
        <h1>That page is not part of your semester</h1>
        <p>The link may be outdated. Your saved courses and tasks have not been changed.</p>
        <Link className="btn-primary" href="/dashboard">Return to dashboard</Link>
      </div>
    </main>
  );
}
