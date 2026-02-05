# 🟢 QuadNet: The Campus Operating System

**QuadNet** is a high-performance event aggregation platform for the University of Alberta. It centralizes fragmented data from the Students' Union (UASU), BearsDen (Clubs), and University Administrations into a single, "God-tier" calendar interface.



## 🚀 The Mission
To eliminate "platform fatigue" at the U of A by providing a single source of truth for every lecture, party, workshop, and club meeting happening on campus.

## 🛠 Tech Stack
* **Frontend:** [Next.js](https://nextjs.org/) (React) + [Tailwind CSS](https://tailwindcss.com/)
* **Calendar Engine:** [FullCalendar.io](https://fullcalendar.io/)
* **Backend/Database:** [Supabase](https://supabase.com/) (PostgreSQL + Auth)
* **Scrapers:** Python ([Playwright](https://playwright.dev/) / [BeautifulSoup](https://www.crummy.com/software/BeautifulSoup/))
* **Automation:** GitHub Actions (Cron-job triggers)

## 📦 Project Structure
```text
├── scrapers/           # Python scripts for data extraction
│   ├── bearsden.py     # Scrapes Engage/BearsDen API/RSS
│   ├── ualberta.py     # Scrapes official UofA events (Cascade)
│   └── uasu.py         # Scrapes Students' Union events
├── web/                # Next.js frontend application
│   ├── components/     # Calendar, Filters, and Navigation
│   └── lib/            # Supabase client and utility functions
└── docs/               # vision.md and brand assets
