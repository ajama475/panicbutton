# Vision Document: QuadNet 
## "The Campus Operating System"

## 1. The Executive Summary
**QuadNet** is the definitive digital layer for the University of Alberta. It is a unified event-aggregation engine designed to solve the campus "information silos." By crawling, syncing, and normalizing data from every major university source, QuadNet provides students with a single, high-fidelity interface to discover their campus life.

## 2. The Problem: "The Fragmented Campus"
U of A students currently suffer from "platform fatigue." Vital information is scattered across:
* **Cascade** (Admin/Academic)
* **Engage/BearsDen** (Clubs/Student Orgs)
* **UASU** (Social/Life)
* **Faculty Sites** (Career/Niche)

This fragmentation results in low engagement, missed opportunities, and a disconnected student body.

## 3. The Solution: QuadNet
QuadNet acts as the **Central Nervous System** for U of A events. It isn't just a list; it is a synchronized "Grid" that treats the campus like a single, live ecosystem.

### Core Pillars:
* **Unified Sync:** Automatically pulls from 5+ disparate data sources.
* **The "Campus OS" UI:** A minimalist, dark-mode-first, Notion-inspired calendar grid.
* **Intelligence:** Smart-tagging for "Free Food," "Industry Credit," and "Career Prep."

---

## 4. The "God-Tier" Feature Set

### ⚡ The Master Grid
A high-performance calendar view with sub-millisecond filtering. Users can toggle between "Academic Stress," "Social Life," and "Professional Growth" with one click.

### 🍕 The "Free Food" Radar
An automated keyword-scraping engine that identifies and highlights events offering free catering, pizza, or refreshments.

### 📍 Precise Geo-Linking
Every event location is parsed and linked directly to its specific room on the U of A Campus Map API, eliminating the "Where is CCIS L1-160?" problem.

### 🔄 The Subscription API
Users don't just visit QuadNet; they subscribe to it. QuadNet generates a personalized `.ics` feed that students can plug into Google Calendar, syncing campus life with their personal schedules.

---

## 5. Technical Architecture (The QuadNet Stack)

* **Scraper Engine:** Python (Playwright/BeautifulSoup) running on GitHub Actions.
* **Database:** Supabase (PostgreSQL) for real-time data storage and "normalized" event schemas.
* **Frontend:** Next.js + Tailwind CSS + FullCalendar.io.
* **Deployment:** Vercel (Edge Functions for global speed).

---

## 6. Brand Identity
* **Name:** QuadNet
* **Tagline:** The Campus Operating System.
* **Visual Identity:** Tech-focused, using "Cyber-Green" and "UofA Gold" against a deep slate/charcoal background to differentiate from the physical Quad.

---

> "Don't just walk the Quad. Connect to it."
