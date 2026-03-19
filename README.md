# 🏢 Job Board Platform

A production-style microservices application with 3 independent backend services, 3 databases, Redis caching, a message queue with scheduled cron jobs, and a single-file vanilla JS dashboard. Built entirely with Docker Compose.

---

## 📋 Table of Contents

1. [What This Project Does](#1-what-this-project-does)
2. [Architecture Overview](#2-architecture-overview)
3. [Project Structure](#3-project-structure)
4. [Tech Stack](#4-tech-stack)
5. [Prerequisites](#5-prerequisites)
6. [Environment Configuration](#6-environment-configuration)
7. [How to Run](#7-how-to-run)
8. [Service Reference](#8-service-reference)
9. [API Endpoints](#9-api-endpoints)
10. [Dashboard](#10-dashboard)
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

A standalone `dashboard.html` file provides a browser-based UI to interact with all three services without any build tools.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      dashboard.html                          │
│            (Vanilla JS fetch → all 3 services)               │
└───────────────┬──────────────┬──────────────────────────────┘
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

---

## 3. Project Structure

```
job-board/
├── .env                          # All environment variables (never commit this)
├── .gitignore
├── docker-compose.yml            # Master orchestration file
├── dashboard.html                # Single-file browser dashboard (no build needed)
│
├── services/
│   ├── jobs/                     # Jobs Service — FastAPI + MongoDB
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── main.py               # FastAPI app entry, CORS, lifespan
│   │   ├── database.py           # Beanie + Motor MongoDB connection
│   │   ├── models.py             # Job document (Beanie ODM)
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── redis_client.py       # Redis connection singleton
│   │   └── routers/
│   │       └── jobs.py           # All 5 job endpoints
│   │
│   ├── candidates/               # Candidates Service — Express.js + MongoDB
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js          # Express app entry, CORS, routes mount
│   │       ├── db.js             # Mongoose connection
│   │       ├── models/
│   │       │   └── candidate.js  # Candidate schema (Mongoose)
│   │       └── routes/
│   │           └── candidates.js # All 5 candidate endpoints
│   │
│   └── applications/             # Applications Service — FastAPI + PostgreSQL
│       ├── Dockerfile
│       ├── requirements.txt
│       ├── main.py               # FastAPI app entry, CORS, lifespan
│       ├── database.py           # SQLAlchemy async engine + session
│       ├── models.py             # Application table (SQLAlchemy ORM)
│       ├── schemas.py            # Pydantic request/response schemas
│       ├── redis_client.py       # Session cache helpers (set/get/delete)
│       ├── worker.py             # RQ scheduler + 3 cron job functions
│       └── routers/
│           └── applications.py   # All 5 application endpoints
│
└── infra/
    ├── postgres/
    │   └── init.sql              # Auto-runs on first PG container start
    └── redis/
        └── redis.conf            # Redis config (maxmemory, persistence, bind)
```

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Jobs Service | Python 3.12, FastAPI 0.111, Beanie ODM, Motor (async MongoDB driver) |
| Candidates Service | Node.js 20, Express.js, Mongoose |
| Applications Service | Python 3.12, FastAPI 0.111, SQLAlchemy 2.0 (async), asyncpg |
| Job Queue | Redis Queue (RQ) + rq-scheduler |
| Databases | PostgreSQL 16, MongoDB 7.0 |
| Cache / Broker | Redis 7.2 |
| Frontend | Vanilla HTML/CSS/JS (no framework, no build step) |
| Containerization | Docker + Docker Compose v2 |

---

## 5. Prerequisites

Ensure all of the following are installed before running the project:

```bash
docker --version          # 24.x or higher
docker compose version    # v2.x  (not legacy docker-compose v1)
```

> No local Python, Node, or database installation is required. Everything runs inside Docker.

**Port availability** — these ports must be free on your host machine before starting:

| Port | Used By |
|---|---|
| `5432` | PostgreSQL |
| `27017` | MongoDB |
| `6379` | Redis |
| `8001` | Applications Service |
| `8002` | Jobs Service |
| `3000` | Candidates Service |

Check for conflicts:
```bash
lsof -i :5432 && lsof -i :27017 && lsof -i :6379
lsof -i :8001 && lsof -i :8002 && lsof -i :3000
```

If you have PostgreSQL, MongoDB, or Redis running natively on your machine, stop them first:
```bash
sudo systemctl stop postgresql mongodb redis
```

---

## 6. Environment Configuration

All configuration lives in a single `.env` file at the project root. This file is loaded by Docker Compose and injected into every service container via `env_file: .env`.

```env
# PostgreSQL
POSTGRES_USER=jobboard
POSTGRES_PASSWORD=jobboard123
POSTGRES_DB=jobboard_db
POSTGRES_HOST=postgres         # Docker service name — do not change
POSTGRES_PORT=5432

# MongoDB
MONGO_URI=mongodb://mongo:27017  # Docker service name — do not change
MONGO_DB_JOBS=jobsdb
MONGO_DB_CANDIDATES=candidatesdb

# Redis
REDIS_HOST=redis               # Docker service name — do not change
REDIS_PORT=6379

# Service Ports
APPLICATIONS_PORT=8001
JOBS_PORT=8002
CANDIDATES_PORT=3000
```

> ⚠️ `POSTGRES_HOST`, `MONGO_URI`, and `REDIS_HOST` use Docker internal service names (`postgres`, `mongo`, `redis`). These only resolve inside the Docker network. Do not change them to `localhost`.

> ⚠️ `.env` is in `.gitignore` and must never be committed to version control.

---

### Where Each Variable Is Used

| Variable | Used In |
|---|---|
| `POSTGRES_*` | `services/applications/database.py` — builds the SQLAlchemy connection URL |
| `MONGO_URI` | `services/jobs/database.py` and `services/candidates/src/db.js` |
| `MONGO_DB_JOBS` | `services/jobs/database.py` — selects the `jobsdb` database |
| `MONGO_DB_CANDIDATES` | `services/candidates/src/db.js` — selects the `candidatesdb` database |
| `REDIS_HOST` / `REDIS_PORT` | `services/jobs/redis_client.py`, `services/applications/redis_client.py`, `services/applications/worker.py` |
| `JOBS_SERVICE_URL` | Set directly in `docker-compose.yml` under `candidates` environment — used by the match score endpoint to call the Jobs service |

---

## 7. How to Run

### Step 1 — Clone the repository

```bash
git clone <repo-url>
cd job-board
```

### Step 2 — Create the `.env` file

```bash
cp .env.example .env   # if .env.example exists
# OR create it manually — see Section 6 above for the full contents
```

### Step 3 — Start infrastructure first

```bash
docker compose up postgres mongo redis -d
```

Wait ~15 seconds, then verify all 3 are healthy:

```bash
docker compose ps
```

Expected output:
```
NAME          STATUS
jb_postgres   running (healthy)
jb_mongo      running (healthy)
jb_redis      running (healthy)
```

### Step 4 — Start all application services

```bash
docker compose up jobs candidates applications rq_worker --build -d
```

> Use `--build` on first run or after any code changes.

### Step 5 — Verify all services are up

```bash
docker compose ps

curl http://localhost:8002/health   # Jobs
curl http://localhost:8001/health   # Applications
curl http://localhost:3000/health   # Candidates
```

Each should return:
```json
{"status": "ok", "service": "<service-name>"}
```

### Step 6 — Open the dashboard

Open `dashboard.html` directly in your browser:
```bash
xdg-open ~/job-board/dashboard.html   # Linux
open ~/job-board/dashboard.html        # macOS
```

Or navigate to the file path manually in your browser.

---

### Starting Everything at Once (after first build)

```bash
docker compose up -d
```

### Stopping Everything

```bash
docker compose down
```

### Stopping and removing all data volumes (full reset)

```bash
docker compose down -v
```

> `-v` removes named volumes (`pg_data`, `mongo_data`, `redis_data`) — all database data will be lost.

---

## 8. Service Reference

### Jobs Service
- **Port:** `8002`
- **Language:** Python 3.12
- **Framework:** FastAPI
- **Database:** MongoDB (`jobsdb` database, `jobs` collection)
- **Cache:** Redis — all 3 read endpoints are cached with TTLs
- **Entry point:** `services/jobs/main.py`
- **ODM:** Beanie (built on Motor for async MongoDB access)

**Key files:**
| File | Purpose |
|---|---|
| `main.py` | App factory, lifespan (DB init on startup), CORS middleware |
| `database.py` | Creates `AsyncIOMotorClient`, initialises Beanie with the `Job` document |
| `models.py` | `Job` Beanie document — maps to the MongoDB `jobs` collection |
| `schemas.py` | `JobCreate` (request body), `JobResponse` (response serialisation) |
| `redis_client.py` | Creates a single `redis.Redis` instance, exposes `get_redis()` |
| `routers/jobs.py` | All 5 endpoint handlers with inline Redis cache logic |

---

### Candidates Service
- **Port:** `3000`
- **Language:** Node.js 20
- **Framework:** Express.js
- **Database:** MongoDB (`candidatesdb` database, `candidates` collection)
- **Entry point:** `services/candidates/src/index.js`
- **ODM:** Mongoose

**Key files:**
| File | Purpose |
|---|---|
| `src/index.js` | Express app, CORS, JSON middleware, mounts `/candidates` router |
| `src/db.js` | Mongoose connection using `MONGO_URI` + `MONGO_DB_CANDIDATES` env vars |
| `src/models/candidate.js` | Mongoose schema — name, email, skills, resume_url, portfolio_links, experience_years |
| `src/routes/candidates.js` | All 5 endpoint handlers including the match score algorithm |

**Match Score algorithm** (endpoint 5): fetches all jobs from the Jobs service via internal HTTP (`http://jobs:8002/jobs`), finds the requested job by ID, then computes the percentage of candidate skills that match the job's tags.

---

### Applications Service
- **Port:** `8001`
- **Language:** Python 3.12
- **Framework:** FastAPI
- **Database:** PostgreSQL (`jobboard_db` database, `applications` table)
- **Cache:** Redis — session cache helpers in `redis_client.py`
- **Queue:** RQ Worker (`worker.py`) runs as a separate container
- **Entry point:** `services/applications/main.py`
- **ORM:** SQLAlchemy 2.0 async with asyncpg driver

**Key files:**
| File | Purpose |
|---|---|
| `main.py` | App factory, CORS middleware |
| `database.py` | Async SQLAlchemy engine, `AsyncSessionLocal`, `get_db()` dependency |
| `models.py` | `Application` ORM model — maps to the `applications` PostgreSQL table |
| `schemas.py` | `ApplicationCreate`, `ApplicationResponse`, `PipelineEntry` Pydantic models |
| `redis_client.py` | Session cache helpers: `set_session`, `get_session`, `delete_session` |
| `worker.py` | RQ Scheduler setup + 3 cron job functions |
| `routers/applications.py` | All 5 endpoint handlers |

---

## 9. API Endpoints

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

**POST `/candidates` request body:**
```json
{
  "name": "Sagar Patil",
  "email": "sagar@example.com",
  "skills": ["python", "fastapi", "docker", "mongodb"],
  "experience_years": 3
}
```

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

> ⚠️ **Application IDs are integers** (PostgreSQL `SERIAL`). Use the `id` field from the `POST /apply` response — not the MongoDB job_id.

**POST `/applications/apply` request body:**
```json
{
  "job_id": "69baee1ec9ef63bdafcd5edc",
  "candidate_id": "69bafdabb759915a589db048",
  "notes": "Strong Python background, 3 years FastAPI"
}
```

**GET `/applications/pipeline/{job_id}` response:**
```json
[
  {"status": "applied", "count": 5},
  {"status": "shortlisted", "count": 2},
  {"status": "rejected", "count": 1}
]
```

---

## 10. Dashboard

`dashboard.html` is a single self-contained file — no server required, no build step. Open it directly in any browser.

**Tabs:**

- **Jobs tab** — Post Job form, List All Jobs, Search Jobs, Featured Jobs, Close Job
- **Applications tab** — Apply for Job, Get Status, Shortlist, Reject, Hiring Pipeline
- **Candidates tab** — Create Profile, Update Resume, Update Skills, Update Portfolio, Match Score

**Service URLs** are hardcoded at the top of the script block:

```javascript
const CONFIG = {
  JOBS_URL: "http://localhost:8002",
  APPLICATIONS_URL: "http://localhost:8001",
  CANDIDATES_URL: "http://localhost:3000"
};
```

Change these if you deploy the services to a different host or port.

> The dashboard uses `fetch()` from the browser, which requires CORS to be enabled on all services. All three services have `CORSMiddleware` (FastAPI) or `cors()` (Express) configured with `allow_origins: ["*"]`.

---

## 11. Redis Caching

Redis caches are managed inside `services/jobs/routers/jobs.py` and session state in `services/applications/redis_client.py`.

### Cache Keys (Jobs Service)

| Key | TTL | Invalidated By |
|---|---|---|
| `jobs:list` | 5 min | `POST /jobs`, `PATCH /jobs/{id}/close` |
| `jobs:featured` | 10 min | `PATCH /jobs/{id}/close` |
| `jobs:search:{term}` | 2 min | Not explicitly invalidated (TTL expiry only) |

### Session Keys (Applications Service)

| Key Pattern | TTL | Purpose |
|---|---|---|
| `session:{candidate_id}` | 30 min | Candidate session data |

### Inspecting Redis live

```bash
docker exec -it jb_redis redis-cli

> KEYS *                   # List all keys
> TTL jobs:list            # Check TTL on list cache
> GET jobs:featured        # Read featured cache value
> KEYS rq:scheduler:*      # List scheduled RQ jobs
```

---

## 12. Message Queue & Cron Jobs

The RQ worker runs as a separate Docker container (`jb_rq_worker`) built from the same image as the Applications service. It executes `worker.py` on startup, which schedules 3 cron jobs using `rq-scheduler` and Redis as the broker.

**File:** `services/applications/worker.py`

| Cron Job | Schedule | What It Does |
|---|---|---|
| `job_expiry_cleanup` | Every midnight (UTC) | Fetches all jobs from Jobs service, closes any where `expires_at` is past |
| `daily_job_digest` | Every day at 8AM (UTC) | Fetches featured jobs and logs a digest (SendGrid integration point) |
| `application_summary` | Every Sunday midnight (UTC) | Logs a weekly summary of application pipeline (email report integration point) |

**Check worker logs:**
```bash
docker logs jb_rq_worker -f
```

Expected on startup:
```
[SCHEDULER] 3 cron jobs scheduled
```

**Check scheduled jobs in Redis:**
```bash
docker exec -it jb_redis redis-cli KEYS "rq:scheduler:*"
```

---

## 13. Ports Reference

| Container | Host Port | Internal Port | Service |
|---|---|---|---|
| `jb_postgres` | `5432` | `5432` | PostgreSQL 16 |
| `jb_mongo` | `27017` | `27017` | MongoDB 7.0 |
| `jb_redis` | `6379` | `6379` | Redis 7.2 |
| `jb_jobs` | `8002` | `8002` | Jobs Service (FastAPI) |
| `jb_candidates` | `3000` | `3000` | Candidates Service (Express) |
| `jb_applications` | `8001` | `8001` | Applications Service (FastAPI) |
| `jb_rq_worker` | — | — | RQ Worker (no external port) |

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
docker compose up applications --build --force-recreate -d

# View logs for a service
docker logs jb_jobs -f
docker logs jb_applications --tail 30
docker logs jb_rq_worker -f

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

# Inspect what's inside a running container
docker exec -it jb_applications cat /app/main.py
```

---

## 15. Troubleshooting

### `curl: (56) Connection reset by peer` — service crashed immediately after starting

Check container logs:
```bash
docker logs jb_jobs --tail 30
```

Common causes:
- **`ImportError: cannot import name '_QUERY_OPTIONS'`** — motor version conflict. Ensure `requirements.txt` uses `motor==3.6.0`, not `3.4.0`.
- **`Cannot find module './routes/candidates'`** — the route file wasn't created. Verify: `ls services/candidates/src/routes/` — if only `.gitkeep` exists, delete it and recreate the file.
- **DB connection error on startup** — infra containers not healthy yet. Run `docker compose ps` and wait for all 3 to show `(healthy)` before starting app services.

---

### `Failed to fetch` in dashboard browser

CORS is missing from the service. Verify `main.py` includes `CORSMiddleware`:
```bash
docker exec -it jb_jobs cat /app/main.py | grep CORS
docker exec -it jb_applications cat /app/main.py | grep CORS
```

And for candidates:
```bash
docker exec -it jb_candidates cat /app/src/index.js | grep cors
```

If missing, add the middleware and rebuild with `--force-recreate`.

---

### `HTTP 422: Unprocessable Entity` on Applications endpoints

The Application ID field expects the **integer** `id` from PostgreSQL (e.g. `1`, `2`, `3`) — not the MongoDB ObjectId. Use the `id` field from the `POST /apply` response.

---

### `OPTIONS ... 405 Method Not Allowed` in browser console

The preflight CORS request is failing. The service is running but `CORSMiddleware` is not configured. See the CORS fix above.

---

### Port already in use on startup

A native service (PostgreSQL, MongoDB, or Redis) is running on your machine and occupying the port. Stop it:
```bash
sudo systemctl stop postgresql mongodb redis
```

---

### Full clean rebuild after code changes

```bash
docker compose down
docker compose up --build -d
```

---

## Notes on Database Persistence

All three databases use named Docker volumes (`pg_data`, `mongo_data`, `redis_data`) so data persists across `docker compose down` / `docker compose up` cycles.

To wipe all data and start fresh (useful in development):
```bash
docker compose down -v
docker compose up postgres mongo redis -d
# Wait for healthy, then:
docker compose up jobs candidates applications rq_worker --build -d
```

---

*Last updated: Phase 7 complete — all services running, dashboard operational.*