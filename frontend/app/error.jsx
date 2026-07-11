"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }) {
  useEffect(() => {
    console.error("Sync Your Semester encountered an error.", error);
  }, [error]);

  return (
    <main className="system-page">
      <div className="system-card" role="alert">
        <span className="system-card__eyebrow">Something went wrong</span>
        <h1>Your plan is still on this device</h1>
        <p>
          This screen could not be opened. Try it again; refreshing the app will not erase your local semester data.
        </p>
        <button className="btn-primary" type="button" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
