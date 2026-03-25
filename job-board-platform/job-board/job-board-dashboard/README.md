# Job Board Dashboard — React

A React operations dashboard for the Job Board Platform microservices. Built with Vite + React 19 + Tailwind CSS v3. Calls all three backend services directly from the browser via `fetch`.

---

## What This App Does

Provides a tab-based UI to interact with all three microservices:

| Tab | Actions |
|---|---|
| **Jobs** | Post a job, list all jobs, search jobs, view featured jobs, close a job |
| **Applications** | Apply for a job, get/shortlist/reject an application, view hiring pipeline |
| **Candidates** | Create a profile, update resume URL, update skills, update portfolio links, calculate match score |

All responses are displayed inline — no page reloads, no separate API client needed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v3 |
| Containerisation | Docker (multi-stage) + nginx 1.27 |
| HTTP | Native `fetch` (no axios) |
| Language | JavaScript (JSX) |

---

## Environment Variables

API base URLs are configured via environment variables with `VITE_` prefix (Vite bakes them into the JS bundle at build time).

**Step 1 — copy the example file:**

```bash
# From this directory (job-board-dashboard/)
cp .env.example .env
```

**`.env.example` contents:**

```env
VITE_JOBS_URL=http://localhost:8002
VITE_APPLICATIONS_URL=http://localhost:8001
VITE_CANDIDATES_URL=http://localhost:3000
```

Edit `.env` if your services run on different ports or hosts. The `.env` file is gitignored — never commit it.

> **Docker note:** when building the Docker image the URLs are injected as build args (see the Docker section below). The browser still needs to reach those addresses from the host machine, so keep `localhost` unless you are deploying to a remote server.

---

## Backend Services Required

The dashboard expects these services reachable from the browser:

| Service | Default URL | Stack |
|---|---|---|
| Jobs | `http://localhost:8002` | FastAPI + MongoDB |
| Applications | `http://localhost:8001` | FastAPI + PostgreSQL |
| Candidates | `http://localhost:3000` | Express + MongoDB |

Start all backend services from the `job-board/` directory:

```bash
# From job-board/
docker compose up postgres mongo redis -d
# Wait ~15s for healthy status, then:
docker compose up jobs candidates applications rq_worker --build -d
```

Verify all services are up:

```bash
curl http://localhost:8002/health   # {"status":"ok","service":"jobs"}
curl http://localhost:8001/health   # {"status":"ok","service":"applications"}
curl http://localhost:3000/health   # {"status":"ok","service":"candidates"}
```

---

## Prerequisites

- Node.js 20+ (install via [nvm](https://github.com/nvm-sh/nvm)) — for local dev only
- Docker + Docker Compose v2

---

## Local Development

```bash
# 1. Copy env file
cp .env.example .env

# 2. Install dependencies
npm install

# 3. Start dev server (hot-reload)
npm run dev
```

Open `http://localhost:5173` in your browser.

To expose on the local network (useful in WSL):

```bash
npm run dev -- --host
```

---

## Other npm Commands

```bash
# Production build (outputs to dist/)
npm run build

# Preview the production build locally
npm run preview

# Lint
npm run lint
```

---

## Docker

### Build & run the dashboard container standalone

```bash
# From job-board-dashboard/
docker build \
  --build-arg VITE_JOBS_URL=http://localhost:8002 \
  --build-arg VITE_APPLICATIONS_URL=http://localhost:8001 \
  --build-arg VITE_CANDIDATES_URL=http://localhost:3000 \
  -t jb_dashboard .

docker run -p 5173:80 jb_dashboard
```

Open `http://localhost:5173`.

### Run via Docker Compose (recommended)

The dashboard is included in the root `docker-compose.yml` as the `dashboard` service. From the `job-board/` directory:

```bash
# Start everything (infra + all services + dashboard)
docker compose up --build -d

# Start only the dashboard (assuming other services are already up)
docker compose up dashboard --build -d
```

The dashboard is served by nginx on port `5173` → `http://localhost:5173`.

Custom API URLs can be set in the root `.env` file before building:

```env
VITE_JOBS_URL=http://localhost:8002
VITE_APPLICATIONS_URL=http://localhost:8001
VITE_CANDIDATES_URL=http://localhost:3000
```

> **How env injection works:** Vite reads `VITE_*` variables at **build time** and bakes them into the JS bundle. The Dockerfile accepts them as `ARG` values and sets them as `ENV` before running `npm run build`. If the vars are not set, the defaults (`localhost:*`) are used.

---

## Project Structure

```
job-board-dashboard/
├── Dockerfile              # Multi-stage: Node 20 builder → nginx 1.27 runner
├── nginx.conf              # SPA routing + gzip + cache headers
├── .env.example            # Copy to .env before running
├── tailwind.config.js      # Tailwind v3 with brand colour palette
├── vite.config.js
└── src/
    ├── App.jsx                        # Root — tab state + layout
    ├── main.jsx                       # React entry point
    ├── index.css                      # Tailwind directives + base styles
    │
    ├── constants/
    │   └── index.js                   # TABS, TAB_LABELS, STATUS_COLORS, STATUS_LABELS
    │
    ├── services/
    │   └── api.js                     # All 15 API functions — reads from import.meta.env
    │
    └── components/
        ├── ui/                        # Reusable primitives
        │   ├── Button.jsx             # 5 variants: primary, secondary, warning, danger, ghost
        │   ├── Input.jsx
        │   ├── Textarea.jsx
        │   ├── Card.jsx
        │   ├── Badge.jsx              # Status badge (applied / shortlisted / rejected)
        │   ├── ResponseBlock.jsx      # Formatted JSON output block
        │   ├── DataTable.jsx          # Auto-column table from array of objects
        │   └── TabBar.jsx             # Jobs / Applications / Candidates tabs
        │
        ├── jobs/
        │   ├── PostJobForm.jsx        # POST /jobs
        │   ├── BrowseJobs.jsx         # GET /jobs, /jobs/search, /jobs/featured
        │   ├── CloseJob.jsx           # PATCH /jobs/{id}/close
        │   └── JobsPanel.jsx          # Assembles the Jobs tab
        │
        ├── applications/
        │   ├── ApplyForm.jsx          # POST /applications/apply
        │   ├── ApplicationStatus.jsx  # GET status, PATCH shortlist/reject
        │   ├── HiringPipeline.jsx     # GET /applications/pipeline/{job_id}
        │   └── ApplicationsPanel.jsx  # Assembles the Applications tab
        │
        └── candidates/
            ├── CreateCandidateForm.jsx  # POST /candidates
            ├── CandidateActions.jsx     # PUT resume, skills, portfolio (3 named exports)
            ├── MatchScore.jsx           # GET /candidates/:id/match/:job_id
            └── CandidatesPanel.jsx      # Assembles the Candidates tab
```

---

## Notes

- Application IDs in the Applications tab are **integers** (PostgreSQL `SERIAL`) — use the `id` field from the Apply response, not a MongoDB ObjectId.
- Job IDs and Candidate IDs are **MongoDB ObjectId strings** (24-char hex).
- CORS is enabled on all three backend services (`allow_origins: ["*"]`), so the browser can call them directly.
