# AgeWell

AI-assisted care support system for older adults in retirement and group homes.
Research project — ISDP Lab.

## What's built

### Phase 1 — Staff Dashboard

| Layer | Stack |
|---|---|
| API | Node.js · Express · TypeScript · SQLite (better-sqlite3) |
| Dashboard | React 18 · Vite · TypeScript · Tailwind CSS |

**API routes**
- `GET/POST /api/residents` — list and create residents
- `GET/PUT  /api/residents/:id` — detail (includes today's logs + active alerts)
- `POST /api/logs/{meal,sleep,mood,medication,activity,incident}` — log daily data
- `GET  /api/logs/:residentId?days=7` — history window
- `GET/POST /api/alerts` — alert feed and manual alert creation
- `PUT  /api/alerts/:id/acknowledge` · `/resolve`
- `GET/POST /api/staff`

**Dashboard pages**
- `/dashboard` — overview: resident count, open alerts, quick resident list
- `/residents` — searchable resident list with alert badges
- `/residents/:id` — full resident profile + tabbed daily log entry (meals, sleep, mood, medications, activity, incidents)
- `/alerts` — filterable alert feed with acknowledge/resolve actions

## Getting started

```bash
# 1. Install dependencies
cd src/api && npm install
cd ../dashboard && npm install

# 2. Seed the database (creates 3 sample residents + staff)
cd src/api && npm run db:seed

# 3. Start the API (terminal 1)
cd src/api && npm run dev        # → http://localhost:3001

# 4. Start the dashboard (terminal 2)
cd src/dashboard && npm run dev  # → http://localhost:5173
```

## Roadmap

- **Phase 2** — Claude API integration: per-resident system prompts, daily summaries, care note drafts
- **Phase 3** — Resident tablet UI (morning check-in, medication reminders, voice input)
- **Phase 4** — Family portal, real-time alerts, PIPEDA/HIPAA audit

## Ethics & consent

Key constraints:
- Explicit, revocable consent required before any data collection
- AI must always identify itself as AI in the UI
- Any distress signal escalates immediately to a human
- Role-based access control (resident · family · staff · admin · researcher)
- PIPEDA (Canada) / HIPAA (US) compliance required
