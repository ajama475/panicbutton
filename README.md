# Sync Your Semester

Sync Your Semester is a local-first academic planning app for university students who want clarity without building a whole productivity system. It turns syllabus deadlines and manually entered work into a practical weekly plan, a semester forecast, and one focused next action.

The product goal is simple: help students upload their syllabi, verify what matters, and see the semester clearly before deadlines sneak up on them.

## Product Direction

- Relief and clarity first
- Proof over automation theater
- Academic-specific planning, not a generic task manager
- Minimal setup and fast review
- Weekly usefulness after syllabus week

## What Ships

- Guided semester setup with on-device draft saving
- Editable course and semester details without deleting student work
- Local PDF syllabus parsing with a verification queue
- Manual and recurring tasks
- An Unscheduled inbox so captured work never disappears
- Study-session planning from Today, Tasks, and Calendar
- Calendar-day creation for deadlines and study sessions
- A guided semester-launch checklist
- Portable JSON backup and restore for planning data
- A deadline ledger, calendar, workload forecast, and focused planning mode
- Responsive navigation, dark and light themes, and accessible recovery states
- Static export for low-cost hosting; no account or backend is required

Syllabi, extracted tasks, and planning data stay in the browser's local storage and IndexedDB. Clearing site data or changing browsers removes access to that local data unless the student restores a downloaded backup. Backups include extracted syllabus data and review decisions, but not the original PDF files.

## Local Development

```bash
cd frontend
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Release Check

```bash
cd frontend
npm ci
npm run check
npm audit --audit-level=moderate
```

`npm run check` runs the planning-logic tests and creates the production static export in `frontend/out`.

## Deploy

The root `wrangler.toml` serves the static export with Cloudflare Workers Assets:

```bash
cd frontend && npm run build
cd ..
npx wrangler deploy
```
