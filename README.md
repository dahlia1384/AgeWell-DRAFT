# AgeWell

**AI-assisted care support for older adults in retirement and group homes.**

AgeWell uses facility-provided data to give an AI agent accurate, per-resident context — so every alert, summary, and flag is based on that individual's personal baseline, not a population average. A resident who normally sleeps 9 hours dropping to 6 hours is a much stronger signal than any generic threshold could capture.

> Research project — ISDP Lab · MIT License

---

## Who it serves

| Audience | What they get |
|---|---|
| **Care staff** | Risk flags, end-of-shift summaries, pre-filled care note drafts |
| **Residents** | Morning check-ins, medication reminders, companionship conversations |
| **Families** | Weekly wellness digests, real-time alerts on significant events |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AgeWell System                       │
│                                                         │
│  ┌──────────────┐    REST API    ┌──────────────────┐  │
│  │  Staff       │ ◄────────────► │  Node.js +       │  │
│  │  Dashboard   │                │  Express API     │  │
│  │  (React)     │                │  (TypeScript)    │  │
│  └──────────────┘                └────────┬─────────┘  │
│                                           │             │
│  ┌──────────────┐                ┌────────▼─────────┐  │
│  │  Resident    │   (Phase 3)    │  SQLite           │  │
│  │  Tablet UI   │                │  (11 tables)      │  │
│  └──────────────┘                └──────────────────┘  │
│                                                         │
│  ┌──────────────┐                ┌──────────────────┐  │
│  │  Family      │   (Phase 4)    │  Claude AI       │  │
│  │  Portal      │                │  (Phase 2)        │  │
│  └──────────────┘                └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Tech stack

| Layer | Technology |
|---|---|
| API server | Node.js · Express · TypeScript |
| Database | SQLite via `node:sqlite` (built-in, zero native deps) |
| Staff dashboard | React 18 · Vite · TypeScript · Tailwind CSS |
| AI agent *(Phase 2)* | Claude API — per-resident system prompts, 7-day rolling context |
| Resident UI *(Phase 3)* | Tablet-first · large fonts · voice input · high contrast |
| Family portal *(Phase 4)* | Read-only web view + weekly digest email |

---

## Database schema

11 tables covering the full care data model:

| Table | Purpose |
|---|---|
| `facilities` | Facility metadata |
| `staff` | Care staff accounts and roles |
| `residents` | Demographics, diagnoses, medications, preferences, baselines |
| `consent_records` | Per-resident consent state, type, and guardian info |
| `meal_logs` | Served meals and estimated intake % |
| `sleep_logs` | Hours slept, quality score, notes |
| `mood_checkins` | 1–5 scale daily mood with staff observations |
| `medication_records` | Administered medications, refusals, timestamps |
| `activity_logs` | Activity participation levels |
| `incidents` | Falls, near-falls, behavioral and medical events |
| `alerts` | Risk flags with severity, status, and resolution tracking |

---

## API reference

### Residents
```
GET    /api/residents           List all active residents
POST   /api/residents           Create a resident
GET    /api/residents/:id       Full profile + today's logs + active alerts
PUT    /api/residents/:id       Update resident record
```

### Daily logs
```
POST   /api/logs/meal           Log a meal (meal type, intake %, food items)
POST   /api/logs/sleep          Log sleep (hours, quality 1–5)
POST   /api/logs/mood           Log mood check-in (1–5 scale)
POST   /api/logs/medication     Log medication administration or refusal
POST   /api/logs/activity       Log activity participation
POST   /api/logs/incident       Log incident (auto-creates high-severity alert)
GET    /api/logs/:residentId    History window (default: 7 days)
```

### Alerts
```
GET    /api/alerts              Alert feed (filter by status or facility)
POST   /api/alerts              Create manual alert
PUT    /api/alerts/:id/acknowledge    Acknowledge an open alert
PUT    /api/alerts/:id/resolve        Resolve with optional notes
```

### Staff
```
GET    /api/staff               List staff
POST   /api/staff               Create staff member
```

---

## Dashboard pages

| Route | Description |
|---|---|
| `/dashboard` | Overview — resident count, open alert count, critical alerts, resident list |
| `/residents` | Searchable resident list with per-resident alert badges |
| `/residents/:id` | Full resident profile: diagnoses, allergies, standing medications, emergency contact, active alerts, and tabbed daily log entry |
| `/alerts` | Filterable alert feed (open / acknowledged / resolved / all) with inline acknowledge and resolve actions |

**Resident detail tabs:** Meals · Sleep · Mood · Medications · Activity · Incidents

Each tab shows today's existing entries and a form to add a new one.

---

## Getting started

**Prerequisites:** Node.js v22 or higher (uses `node:sqlite` built-in)

```bash
# Clone the repo
git clone https://github.com/dahlia1384/AgeWell-DRAFT.git
cd AgeWell-DRAFT

# Install dependencies
cd src/api && npm install
cd ../dashboard && npm install

# Seed the database
# Creates: 1 facility, 3 staff, 3 residents, sample logs, 2 open alerts
cd ../api && npm run db:seed

# Start the API (terminal 1)
npm run dev        # → http://localhost:3001

# Start the dashboard (terminal 2)
cd ../dashboard && npm run dev  # → http://localhost:5173
```

The seed script creates three realistic residents with diagnoses, standing medications, allergies, and emergency contacts — ready to explore all dashboard features immediately.

---

## Roadmap

### Phase 1 — Staff dashboard ✅ *current*
Manual data entry, resident profiles, alert management. No AI yet.

### Phase 2 — Claude AI integration
- Per-resident system prompt with 7-day rolling context window
- Daily care summaries generated each morning
- AI-drafted care notes (staff must review before filing)
- Deviation detection against individual baselines (sleep, mood, intake)

### Phase 3 — Resident tablet UI
- Morning check-in flow (large fonts, voice input, 48×48px touch targets)
- Medication reminders
- Companionship conversations (AI identifies itself at all times)
- High-contrast mode, tested with mild cognitive impairment users

### Phase 4 — Family portal + compliance
- Read-only family view with weekly digest emails
- Real-time alerts pushed to family on significant events
- Full PIPEDA (Canada) / HIPAA (US) audit
- Data retention enforcement (raw: 30 days · summaries: 2 years)

---

## Ethics & consent

This system collects sensitive health data for a vulnerable population. The following constraints are non-negotiable:

- **Explicit consent** — every resident must give revocable, informed consent before any data collection begins
- **AI transparency** — AI must always identify itself as AI; it may never impersonate a human caregiver
- **Human escalation** — any expression of pain, confusion, or safety risk immediately escalates to a human staff member; AI does not handle emergencies
- **Minimum data** — only collect what is necessary for care; no surveillance beyond the care context
- **Role-based access** — five roles with strict data boundaries: `resident`, `family`, `caregiver`, `admin`, `researcher`
- **No patient data in version control** — the `.gitignore` excludes all database files

Full guidelines: [docs/ethical-guidelines.md](docs/ethical-guidelines.md)

---

## Project structure

```
AgeWell-DRAFT/
├── src/
│   ├── api/                    Node.js + Express backend
│   │   └── src/
│   │       ├── index.ts        Server entry point
│   │       ├── types.ts        Shared TypeScript interfaces
│   │       ├── db/
│   │       │   ├── schema.sql  Database schema (11 tables)
│   │       │   ├── client.ts   SQLite connection
│   │       │   └── seed.ts     Sample data
│   │       └── routes/
│   │           ├── residents.ts
│   │           ├── logs.ts
│   │           ├── alerts.ts
│   │           └── staff.ts
│   └── dashboard/              React staff dashboard
│       └── src/
│           ├── App.tsx         Router + layout
│           ├── types.ts        Frontend TypeScript types
│           ├── api/client.ts   Typed API wrapper
│           ├── components/     Sidebar, cards, stat blocks
│           └── pages/          Dashboard, ResidentList, ResidentDetail, AlertsFeed
├── docs/
│   └── ethical-guidelines.md
├── .gitignore
└── README.md
```
