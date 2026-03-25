# Job Board Platform

A production-style microservices application with 3 independent backend services, 3 databases, Redis caching, a message queue with scheduled cron jobs, and a React dashboard. Everything runs inside Docker Compose.

---

## Table of Contents

1. [What This Project Does](#1-what-this-project-does)
2. [Architecture Overview](#2-architecture-overview)
3. [Project Structure](#3-project-structure)
4. [Tech Stack](#4-tech-stack)
5. [Prerequisites](#5-prerequisites)
6. [Environment Configuration](#6-environment-configuration)
7. [How to Run](#7-how-to-run)
8. [React Dashboard](#8-react-dashboard)
9. [Service Reference](#9-service-reference)
10. [API Endpoints](#10-api-endpoints)
11. [Redis Caching](#11-redis-caching)
12. [Message Queue & Cron Jobs](#12-message-queue--cron-jobs)
13. [Ports Reference](#13-ports-reference)
14. [Common Commands](#14-common-commands)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. What This Project Does

Job Board Platform is a microservices backend system that simulates a real-world job listing and hiring pipeline. It is split into three independent services that communicate over a shared Docker network:

- **Jobs Service** — manages job postings with search, filtering, and featured listings. Redis caching is applied to all read endpoints.
- **Candidates Service** — manages candidate profiles including skills, resume URLs, portfolio links, and a match-score algorithm that compares candidate skills against job tags.
- **Applications Service** — manages the full hiring pipeline. Candidates apply for jobs; recruiters can shortlist or reject applications and view a pipeline breakdown by status per job.
- **React Dashboard** — a Vite + React + Tailwind CSS SPA served by nginx inside Docker. Provides a tab-based UI to interact with all three services.

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│              jb_dashboard  (nginx · :5173)                        │
│         React SPA — Vite build, served by nginx:1.27             │
│              Calls backend APIs from the browser                  │
└───────────────┬──────────────┬──────────────────────────────────┘
                │              │                    │
        :8001   │      :8002   │            :3000   │
 ┌──────────────▼──┐  ┌────────▼────────┐  ┌───────▼────────┐
 │  Applications   │  │  Jobs Service   │  │   Candidates   │
 │   (Python-A)    │  │   (Python-B)    │  │    (Node.js)   │
 │   FastAPI       │  │   FastAPI       │  │   Express      │
 └──────┬──────────┘  └───────┬─────────┘  └───────┬────────┘
        │                     │                     │
        │                     └──────────┬──────────┘
        │                                │
 ┌──────▼────────┐              ┌────────▼────────┐
 │  PostgreSQL   │              │    MongoDB      │
 │   :5432       │              │    :27017       │
 └──────┬────────┘              └─────────────────┘
        │
 ┌──────▼────────┐
 │    Redis      │◄─── Caching (Jobs Service)
 │    :6379      │◄─── Session Cache (Applications)
 │               │◄─── MQ Broker (RQ Worker + Scheduler)
 └───────────────┘
        │
 ┌──────▼────────────────┐
 │   RQ Worker           │
 │   (inside apps svc)   │
 │   - job_expiry_cleanup│
 │   - daily_digest      │
 │   - app_summary       │
 └───────────────────────┘
```

All services run inside a single Docker bridge network called `jobboard_net`. Services communicate using their Docker service names as hostnames (e.g., `mongo`, `postgres`, `redis`, `jobs`).

The React dashboard runs in the browser — API calls go directly from the browser to the backend services on their published host ports.

---

## 3. Project Structure

```
job-board/
├── .env                           # All environment variables (never commit this)
├── .gitignore
├── docker-compose.yml             # Master orchestration file (8 services)
│
├── job-board-dashboard/           # React Dashboard (Vite + Tailwind + nginx)
│   ├── Dockerfile                 # Multi-stage: Node 20 builder → nginx 1.27 runner
│   ├── nginx.conf                 # SPA routing, gzip, cache headers
│   ├── .env.example               # Copy to .env before running dev server
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── constants/index.js
│       ├── services/api.js        # All 15 API functions — reads VITE_* env vars
│       └── components/
│           ├── ui/                # Button, Input, Textarea, Card, Badge, DataTable, TabBar
│           ├── jobs/              # PostJobForm, BrowseJobs, CloseJob, JobsPanel
│           ├── applications/      # ApplyForm, ApplicationStatus, HiringPipeline
│           └── candidates/        # CreateCandidateForm, CandidateActions, MatchScore
│
├── services/
│   ├── jobs/                      # Jobs Service — FastAPI + MongoDB
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── redis_client.py
│   │   └── routers/jobs.py
│   │
│   ├── candidates/                # Candidates Service — Express.js + MongoDB
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── db.js
│   │       ├── models/candidate.js
│   │       └── routes/candidates.js
│   │
│   └── applications/              # Applications Service — FastAPI + PostgreSQL
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── main.py
│       ├── database.py
│       ├── models.py
│       ├── schemas.py
│       ├── redis_client.py
│       ├── worker.py
│       └── routers/applications.py
│
└── infra/
    ├── postgres/init.sql
    └── redis/redis.conf
```

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Jobs Service | Python 3.12, FastAPI 0.111, Beanie ODM, Motor (async MongoDB driver) |
| Candidates Service | Node.js 20, Express.js, Mongoose |
| Applications Service | Python 3.12, FastAPI 0.111, SQLAlchemy 2.0 (async), asyncpg |
| React Dashboard | React 19, Vite 8, Tailwind CSS v3, served by nginx 1.27 |
| Job Queue | Redis Queue (RQ) + rq-scheduler |
| Databases | PostgreSQL 16, MongoDB 7.0 |
| Cache / Broker | Redis 7.2 |
| Containerisation | Docker + Docker Compose v2 |

---

## 5. Prerequisites

```bash
docker --version          # 24.x or higher
docker compose version    # v2.x  (not legacy docker-compose v1)
```

> No local Python, Node, or database installation is required. Everything runs inside Docker.

**Port availability** — these ports must be free on your host machine:

| Port | Used By |
|---|---|
| `5432` | PostgreSQL |
| `27017` | MongoDB |
| `6379` | Redis |
| `8001` | Applications Service |
| `8002` | Jobs Service |
| `3000` | Candidates Service |
| `5173` | React Dashboard (nginx) |

Check for conflicts:

```bash
lsof -i :5432 && lsof -i :27017 && lsof -i :6379
lsof -i :8001 && lsof -i :8002 && lsof -i :3000 && lsof -i :5173
```

---

## 6. Environment Configuration

All backend configuration lives in a single `.env` file at the project root. The React dashboard API URLs can optionally be added to the same file — they are passed as Docker build args.

```env
# PostgreSQL
POSTGRES_USER=jobboard
POSTGRES_PASSWORD=jobboard123
POSTGRES_DB=jobboard_db
POSTGRES_HOST=postgres
POSTGRES_PORT=5432

# MongoDB
MONGO_URI=mongodb://mongo:27017
MONGO_DB_JOBS=jobsdb
MONGO_DB_CANDIDATES=candidatesdb

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Service Ports
APPLICATIONS_PORT=8001
JOBS_PORT=8002
CANDIDATES_PORT=3000

# React Dashboard — API URLs baked into the JS bundle at build time.
# These must be reachable from the browser (host machine), not from inside Docker.
VITE_JOBS_URL=http://localhost:8002
VITE_APPLICATIONS_URL=http://localhost:8001
VITE_CANDIDATES_URL=http://localhost:3000
```

> `POSTGRES_HOST`, `MONGO_URI`, and `REDIS_HOST` use Docker internal service names (`postgres`, `mongo`, `redis`). These only resolve inside the Docker network — do not change them to `localhost`.

> `VITE_*` vars are browser-facing. Keep them as `localhost:*` when running locally. Change them to your server's public IP or domain when deploying remotely.

> `.env` is in `.gitignore` and must never be committed.

---

## 7. How to Run

### Step 1 — Clone and create the `.env` file

```bash
git clone <repo-url>
cd job-board
cp .env.example .env   # or create manually — see Section 6 for full contents
```

### Step 2 — Start infrastructure

```bash
docker compose up postgres mongo redis -d
```

Wait ~15 seconds, then verify all 3 are healthy:

```bash
docker compose ps
```

Expected:

```
NAME          STATUS
jb_postgres   running (healthy)
jb_mongo      running (healthy)
jb_redis      running (healthy)
```

### Step 3 — Start all application services + dashboard

```bash
docker compose up jobs candidates applications rq_worker dashboard --build -d
```

> Use `--build` on first run or after any code changes.

### Step 4 — Verify everything is up

```bash
docker compose ps

curl http://localhost:8002/health   # Jobs
curl http://localhost:8001/health   # Applications
curl http://localhost:3000/health   # Candidates
```

Each backend should return:

```json
{"status": "ok", "service": "<service-name>"}
```

### Step 5 — Open the dashboard

```
http://localhost:5173
```

---

### Start Everything at Once (after first build)

```bash
docker compose up -d
```

### Stop Everything

```bash
docker compose down
```

### Stop and Remove All Data Volumes (full reset)

```bash
docker compose down -v
```

---

## 8. React Dashboard

The dashboard is a single-page React application (Vite + Tailwind CSS) served by nginx inside Docker. It runs in the browser and calls all three backend services directly via `fetch`.

### Container

| Property | Value |
|---|---|
| Container name | `jb_dashboard` |
| Host port | `5173` |
| Internal port | `80` (nginx) |
| Image base | `nginx:1.27-alpine` |

### How Environment Variables Work

Vite bakes `VITE_*` variables into the JavaScript bundle **at build time**. The `Dockerfile` accepts them as `ARG` values and sets them as `ENV` before running `npm run build`.

```dockerfile
ARG VITE_JOBS_URL=http://localhost:8002
ARG VITE_APPLICATIONS_URL=http://localhost:8001
ARG VITE_CANDIDATES_URL=http://localhost:3000
```

`docker-compose.yml` reads these from the root `.env` file with `localhost` fallbacks:

```yaml
args:
  VITE_JOBS_URL: ${VITE_JOBS_URL:-http://localhost:8002}
  VITE_APPLICATIONS_URL: ${VITE_APPLICATIONS_URL:-http://localhost:8001}
  VITE_CANDIDATES_URL: ${VITE_CANDIDATES_URL:-http://localhost:3000}
```

To change the API URLs, edit the root `.env` file and rebuild:

```bash
docker compose up dashboard --build -d
```

### Rebuild the Dashboard Only

```bash
docker compose up dashboard --build --force-recreate -d
```

### Local Development (without Docker)

```bash
cd job-board-dashboard
cp .env.example .env     # copy and edit API URLs if needed
npm install
npm run dev              # hot-reload at http://localhost:5173
```

---

## 9. Service Reference

### Jobs Service
- **Port:** `8002`
- **Language:** Python 3.12 / FastAPI
- **Database:** MongoDB (`jobsdb`)
- **Cache:** Redis — all 3 read endpoints cached with TTLs
- **Entry point:** `services/jobs/main.py`

### Candidates Service
- **Port:** `3000`
- **Language:** Node.js 20 / Express.js
- **Database:** MongoDB (`candidatesdb`)
- **Entry point:** `services/candidates/src/index.js`

**Match Score algorithm:** fetches all jobs from the Jobs service via internal HTTP (`http://jobs:8002/jobs`), finds the requested job by ID, then computes the percentage of candidate skills that match the job's tags.

### Applications Service
- **Port:** `8001`
- **Language:** Python 3.12 / FastAPI
- **Database:** PostgreSQL (`jobboard_db`)
- **Cache:** Redis session cache
- **Queue:** RQ Worker (`worker.py`) runs as a separate container
- **Entry point:** `services/applications/main.py`

### React Dashboard
- **Port:** `5173`
- **Build:** Vite 8 + React 19 + Tailwind CSS v3
- **Runtime:** nginx 1.27-alpine
- **Entry point:** `job-board-dashboard/src/App.jsx`

---

## 10. API Endpoints

### Jobs Service — `http://localhost:8002`

| Method | Endpoint | Description | Cache |
|---|---|---|---|
| `POST` | `/jobs` | Create a new job posting | Invalidates `jobs:list` |
| `GET` | `/jobs` | List all open jobs | Cached 5 min (`jobs:list`) |
| `GET` | `/jobs/search?q=<term>` | Search by title, location, or tag | Cached 2 min per query |
| `GET` | `/jobs/featured` | List featured open jobs | Cached 10 min (`jobs:featured`) |
| `PATCH` | `/jobs/{id}/close` | Close a job listing | Invalidates list + featured |
| `GET` | `/health` | Health check | — |

**POST `/jobs` request body:**
```json
{
  "title": "Backend Engineer",
  "company": "Acme Corp",
  "location": "Remote",
  "description": "FastAPI role with MongoDB experience",
  "tags": ["python", "fastapi", "mongodb"],
  "is_featured": true,
  "salary_range": "80k-100k",
  "expires_at": "2026-12-31T00:00:00"
}
```

---

### Candidates Service — `http://localhost:3000`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/candidates` | Create a candidate profile |
| `PUT` | `/candidates/:id/resume` | Update resume URL |
| `PUT` | `/candidates/:id/skills` | Replace skills list |
| `PUT` | `/candidates/:id/portfolio` | Replace portfolio links |
| `GET` | `/candidates/:id/match/:job_id` | Calculate match score vs a job |
| `GET` | `/health` | Health check |

**GET `/candidates/:id/match/:job_id` response:**
```json
{
  "candidate_id": "...",
  "job_id": "...",
  "match_score": 75,
  "matched_skills": ["python", "fastapi", "mongodb"],
  "total_job_tags": 4
}
```

---

### Applications Service — `http://localhost:8001`

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/applications/apply` | Submit a job application |
| `GET` | `/applications/{id}/status` | Get application status |
| `PATCH` | `/applications/{id}/shortlist` | Move to shortlisted |
| `PATCH` | `/applications/{id}/reject` | Move to rejected |
| `GET` | `/applications/pipeline/{job_id}` | Status breakdown for a job |
| `GET` | `/health` | Health check |

> **Application IDs are integers** (PostgreSQL `SERIAL`). Use the `id` field from the `POST /apply` response — not a MongoDB ObjectId.

---

## 11. Redis Caching

### Cache Keys (Jobs Service)

| Key | TTL | Invalidated By |
|---|---|---|
| `jobs:list` | 5 min | `POST /jobs`, `PATCH /jobs/{id}/close` |
| `jobs:featured` | 10 min | `PATCH /jobs/{id}/close` |
| `jobs:search:{term}` | 2 min | TTL expiry only |

### Session Keys (Applications Service)

| Key Pattern | TTL | Purpose |
|---|---|---|
| `session:{candidate_id}` | 30 min | Candidate session data |

### Inspecting Redis Live

```bash
docker exec -it jb_redis redis-cli

> KEYS *
> TTL jobs:list
> GET jobs:featured
> KEYS rq:scheduler:*
```

---

## 12. Message Queue & Cron Jobs

The RQ worker runs as a separate Docker container (`jb_rq_worker`) built from the same image as the Applications service.

| Cron Job | Schedule | What It Does |
|---|---|---|
| `job_expiry_cleanup` | Every midnight (UTC) | Fetches all jobs from Jobs service, closes any where `expires_at` is past |
| `daily_job_digest` | Every day at 8AM (UTC) | Fetches featured jobs and logs a digest |
| `application_summary` | Every Sunday midnight (UTC) | Logs a weekly summary of application pipeline |

**Check worker logs:**
```bash
docker logs jb_rq_worker -f
```

Expected on startup:
```
[SCHEDULER] 3 cron jobs scheduled
```

---

## 13. Ports Reference

| Container | Host Port | Service |
|---|---|---|
| `jb_postgres` | `5432` | PostgreSQL 16 |
| `jb_mongo` | `27017` | MongoDB 7.0 |
| `jb_redis` | `6379` | Redis 7.2 |
| `jb_jobs` | `8002` | Jobs Service (FastAPI) |
| `jb_candidates` | `3000` | Candidates Service (Express) |
| `jb_applications` | `8001` | Applications Service (FastAPI) |
| `jb_rq_worker` | — | RQ Worker (no external port) |
| `jb_dashboard` | `5173` | React Dashboard (nginx) |

---

## 14. Common Commands

```bash
# Start everything
docker compose up -d

# Start only infra
docker compose up postgres mongo redis -d

# Start a specific service with rebuild
docker compose up jobs --build -d

# Rebuild and force-recreate a service
docker compose up dashboard --build --force-recreate -d

# View logs for a service
docker logs jb_jobs -f
docker logs jb_applications --tail 30
docker logs jb_rq_worker -f
docker logs jb_dashboard -f

# Check all container statuses
docker compose ps

# Stop all containers (keep volumes)
docker compose down

# Full reset — stop containers + delete all data
docker compose down -v

# Open PostgreSQL shell
docker exec -it jb_postgres psql -U jobboard -d jobboard_db

# List tables in PostgreSQL
docker exec -it jb_postgres psql -U jobboard -d jobboard_db -c "\dt"

# Open MongoDB shell
docker exec -it jb_mongo mongosh

# Open Redis CLI
docker exec -it jb_redis redis-cli
```

---

## 15. Troubleshooting

### Service crashed immediately after starting

Check container logs:
```bash
docker logs jb_jobs --tail 30
```

Common causes:
- **`ImportError: cannot import name '_QUERY_OPTIONS'`** — motor version conflict. Ensure `requirements.txt` uses `motor==3.6.0`.
- **`Cannot find module './routes/candidates'`** — route file missing. Check `ls services/candidates/src/routes/`.
- **DB connection error on startup** — infra containers not healthy yet. Run `docker compose ps` and wait for all 3 to show `(healthy)`.

---

### `Failed to fetch` in dashboard browser

CORS is missing from the service. Verify:
```bash
docker exec -it jb_jobs cat /app/main.py | grep CORS
docker exec -it jb_applications cat /app/main.py | grep CORS
docker exec -it jb_candidates cat /app/src/index.js | grep cors
```

If missing, add the middleware and rebuild with `--force-recreate`.

---

### Dashboard shows the right page but all API calls fail

The `VITE_*` URLs were baked in as `localhost` but the browser cannot reach the services. Verify:

1. All backend containers are running: `docker compose ps`
2. Backend ports are published to the host (`8001`, `8002`, `3000`)
3. Check the URL in the dashboard header matches the running ports

If you changed API ports, update `.env`, then rebuild the dashboard:
```bash
docker compose up dashboard --build --force-recreate -d
```

---

### `HTTP 422: Unprocessable Entity` on Applications endpoints

The Application ID expects an **integer** (e.g., `1`, `2`, `3`) from PostgreSQL — not a MongoDB ObjectId. Use the `id` field from the `POST /apply` response.

---

### `OPTIONS ... 405 Method Not Allowed` in browser console

The CORS preflight request is failing. `CORSMiddleware` is not configured on the service. See the CORS fix above.

---

### Port already in use on startup

A native service is running on your machine and occupying the port. Stop it:
```bash
sudo systemctl stop postgresql mongodb redis
```

---

### Full Clean Rebuild After Code Changes

```bash
docker compose down
docker compose up --build -d
```

---

## Notes on Database Persistence

All three databases use named Docker volumes (`pg_data`, `mongo_data`, `redis_data`) so data persists across `docker compose down` / `docker compose up` cycles.

To wipe all data and start fresh:
```bash
docker compose down -v
docker compose up postgres mongo redis -d
# Wait for healthy, then:
docker compose up jobs candidates applications rq_worker dashboard --build -d
```
