# 🏢 Job Board Platform — Master Build Plan
> Source of Truth. Update this file as each step is completed.
> **Rule:** Do not jump ahead. Complete each step, verify it, then move on.

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Architecture Reference](#2-architecture-reference)
3. [Prerequisites](#3-prerequisites)
4. [Phase 1 — Project Scaffold & Docker Infra](#phase-1--project-scaffold--docker-infra)
5. [Phase 2 — Jobs Service (Python-B + MongoDB)](#phase-2--jobs-service-python-b--mongodb)
6. [Phase 3 — Candidates Service (Node + MongoDB)](#phase-3--candidates-service-node--mongodb)
7. [Phase 4 — Applications Service (Python-A + PostgreSQL)](#phase-4--applications-service-python-a--postgresql)
8. [Phase 5 — Redis Caching](#phase-5--redis-caching)
9. [Phase 6 — Message Queue + Cron Jobs (RQ)](#phase-6--message-queue--cron-jobs-rq)
10. [Phase 7 — Dashboard HTML](#phase-7--dashboard-html)
11. [Checklist Tracker](#checklist-tracker)

---

## 1. Project Overview

| Item | Detail |
|---|---|
| Project Name | Job Board Platform |
| Services | 3 microservices (2 Python, 1 Node) |
| Databases | PostgreSQL (Applications), MongoDB (Jobs + Candidates) |
| Caching | Redis |
| Message Queue | Redis Queue (RQ) — uses Redis as broker |
| Cron Jobs | 3 scheduled jobs via rq-scheduler |
| Frontend | Single `dashboard.html` — no framework |
| Containerization | Docker + Docker Compose |

---

## 2. Architecture Reference

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

---

## 3. Prerequisites

### 3.1 Software Requirements

Verify each before starting:

```bash
docker --version          # Docker 24.x or higher
docker compose version    # Docker Compose v2.x (not v1 docker-compose)
python3 --version         # Python 3.11+
node --version            # Node 20.x LTS
npm --version             # npm 10.x
git --version             # any recent version
```

### 3.2 Port Availability Check

Make sure these ports are free on your machine:

```bash
# Check if ports are in use (Linux/Mac)
lsof -i :8001    # Applications service
lsof -i :8002    # Jobs service
lsof -i :3000    # Candidates service
lsof -i :5432    # PostgreSQL
lsof -i :27017   # MongoDB
lsof -i :6379    # Redis
```

If any port is occupied, either stop the conflicting process or change the port mapping in `docker-compose.yml`.

### 3.3 Recommended VS Code Extensions

- Docker (ms-azuretools.vscode-docker)
- Python (ms-python.python)
- Pylance
- ESLint
- REST Client (humao.rest-client) — for testing endpoints without Postman

---

## Phase 1 — Project Scaffold & Docker Infra

> **Goal:** Create the full folder structure and get all infra containers (PG, Mongo, Redis) running.
> **Verify:** `docker compose up infra` shows all 3 infra services healthy.

---

### Step 1.1 — Create Root Project Directory

```bash
mkdir job-board
cd job-board
git init
```

Create a `.gitignore` at root:

```
# Python
__pycache__/
*.pyc
*.pyo
.env
venv/
.venv/
*.egg-info/

# Node
node_modules/
npm-debug.log

# Docker
*.log

# OS
.DS_Store
Thumbs.db
```

---

### Step 1.2 — Create Full Folder Structure

Run this entire block from the `job-board/` root:

```bash
mkdir -p services/applications/routers
mkdir -p services/jobs/routers
mkdir -p services/candidates/src/routes
mkdir -p services/candidates/src/models
mkdir -p infra/postgres
mkdir -p infra/redis

# Create placeholder files so git tracks empty dirs
touch services/applications/routers/.gitkeep
touch services/jobs/routers/.gitkeep
touch services/candidates/src/routes/.gitkeep
touch services/candidates/src/models/.gitkeep

# Create top-level files
touch docker-compose.yml
touch dashboard.html
touch .env
```

**Expected structure after this step:**

```
job-board/
├── .env
├── .gitignore
├── docker-compose.yml
├── dashboard.html
├── services/
│   ├── applications/
│   │   └── routers/
│   ├── jobs/
│   │   └── routers/
│   └── candidates/
│       └── src/
│           ├── routes/
│           └── models/
└── infra/
    ├── postgres/
    └── redis/
```

---

### Step 1.3 — Create the `.env` File

Populate `job-board/.env` with all environment variables used across services:

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

# Applications Service
APPLICATIONS_PORT=8001

# Jobs Service
JOBS_PORT=8002

# Candidates Service
CANDIDATES_PORT=3000
```

> ⚠️ Never commit `.env` to git. It is already in `.gitignore`.

---

### Step 1.4 — Create PostgreSQL Init Script

Create `infra/postgres/init.sql`:

```sql
-- This runs automatically when the postgres container starts for the first time

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) NOT NULL,
    candidate_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'applied',  -- applied | shortlisted | rejected
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- Index for fast lookups by job
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);

-- Index for fast lookups by candidate
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);

-- Index for pipeline queries by status
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
```

---

### Step 1.5 — Create Redis Config

Create `infra/redis/redis.conf`:

```conf
# Basic Redis config for development

# Allow connections from all interfaces inside Docker network
bind 0.0.0.0

# No password for local dev (add requirepass in production)
# requirepass yourpassword

# Max memory policy for cache eviction
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence (disable for pure cache, enable for MQ reliability)
save 900 1
save 300 10
save 60 10000

# Log level
loglevel notice
```

---

### Step 1.6 — Write `docker-compose.yml`

This is the master compose file. Write it carefully:

```yaml
version: "3.9"

services:

  # ─────────────────────────────────────────
  # INFRASTRUCTURE SERVICES
  # ─────────────────────────────────────────

  postgres:
    image: postgres:16-alpine
    container_name: jb_postgres
    restart: unless-stopped
    env_file: .env
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
      - ./infra/postgres/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jobboard_net

  mongo:
    image: mongo:7.0
    container_name: jb_mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jobboard_net

  redis:
    image: redis:7.2-alpine
    container_name: jb_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./infra/redis/redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jobboard_net

  # ─────────────────────────────────────────
  # APPLICATION SERVICES (added in later phases)
  # Uncomment each service as you build it
  # ─────────────────────────────────────────

  # jobs:
  #   build: ./services/jobs
  #   container_name: jb_jobs
  #   restart: unless-stopped
  #   env_file: .env
  #   ports:
  #     - "8002:8002"
  #   depends_on:
  #     mongo:
  #       condition: service_healthy
  #     redis:
  #       condition: service_healthy
  #   networks:
  #     - jobboard_net

  # candidates:
  #   build: ./services/candidates
  #   container_name: jb_candidates
  #   restart: unless-stopped
  #   env_file: .env
  #   ports:
  #     - "3000:3000"
  #   depends_on:
  #     mongo:
  #       condition: service_healthy
  #   networks:
  #     - jobboard_net

  # applications:
  #   build: ./services/applications
  #   container_name: jb_applications
  #   restart: unless-stopped
  #   env_file: .env
  #   ports:
  #     - "8001:8001"
  #   depends_on:
  #     postgres:
  #       condition: service_healthy
  #     redis:
  #       condition: service_healthy
  #   networks:
  #     - jobboard_net

  # rq_worker:
  #   build: ./services/applications
  #   container_name: jb_rq_worker
  #   restart: unless-stopped
  #   env_file: .env
  #   command: rq worker --with-scheduler
  #   depends_on:
  #     redis:
  #       condition: service_healthy
  #     postgres:
  #       condition: service_healthy
  #   networks:
  #     - jobboard_net

# ─────────────────────────────────────────
# VOLUMES
# ─────────────────────────────────────────
volumes:
  pg_data:
  mongo_data:
  redis_data:

# ─────────────────────────────────────────
# NETWORKS
# ─────────────────────────────────────────
networks:
  jobboard_net:
    driver: bridge
```

---

### Step 1.7 — Start & Verify Infra

```bash
# From job-board/ root
docker compose up postgres mongo redis -d
```

**Verify each container is healthy:**

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

**Verify PostgreSQL:**
```bash
docker exec -it jb_postgres psql -U jobboard -d jobboard_db -c "\dt"
# Should show the applications table
```

**Verify MongoDB:**
```bash
docker exec -it jb_mongo mongosh --eval "db.adminCommand('ping')"
# Should return { ok: 1 }
```

**Verify Redis:**
```bash
docker exec -it jb_redis redis-cli ping
# Should return PONG
```

> ✅ **Phase 1 Complete** when all 3 infra services show `(healthy)` and manual checks pass.

---

## Phase 2 — Jobs Service (Python-B + MongoDB)

> **Goal:** FastAPI service with 5 endpoints connected to MongoDB. Redis caching on list/search/featured.
> **Port:** 8002
> **Verify:** All 5 endpoints return correct responses via curl or REST Client.

---

### Step 2.1 — Create Service Files

```bash
touch services/jobs/Dockerfile
touch services/jobs/requirements.txt
touch services/jobs/main.py
touch services/jobs/database.py
touch services/jobs/models.py
touch services/jobs/schemas.py
touch services/jobs/redis_client.py
touch services/jobs/routers/jobs.py
```

---

### Step 2.2 — `requirements.txt`

```txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
motor==3.4.0          # Async MongoDB driver
beanie==1.26.0        # MongoDB ODM built on motor
pydantic==2.7.1
redis==5.0.4
python-dotenv==1.0.1
httpx==0.27.0         # For inter-service calls in cron
```

---

### Step 2.3 — `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]
```

---

### Step 2.4 — `database.py` (MongoDB connection)

```python
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models import Job

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB_JOBS", "jobsdb")

async def init_db():
    client = AsyncIOMotorClient(MONGO_URI)
    await init_beanie(database=client[MONGO_DB], document_models=[Job])
```

---

### Step 2.5 — `models.py` (Beanie Document)

```python
from beanie import Document
from pydantic import Field
from typing import List, Optional
from datetime import datetime

class Job(Document):
    title: str
    company: str
    location: str
    description: str
    salary_range: Optional[str] = None
    tags: List[str] = []
    is_featured: bool = False
    is_closed: bool = False
    expires_at: Optional[datetime] = None
    posted_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "jobs"       # MongoDB collection name
```

---

### Step 2.6 — `schemas.py` (Pydantic request/response)

```python
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    company: str
    location: str
    description: str
    salary_range: Optional[str] = None
    tags: List[str] = []
    is_featured: bool = False
    expires_at: Optional[datetime] = None

class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    location: str
    description: str
    salary_range: Optional[str]
    tags: List[str]
    is_featured: bool
    is_closed: bool
    posted_at: datetime
```

---

### Step 2.7 — `redis_client.py`

```python
import os
import redis

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    decode_responses=True
)

def get_redis():
    return redis_client
```

---

### Step 2.8 — `routers/jobs.py` (All 5 Endpoints)

```python
import json
from fastapi import APIRouter, HTTPException, Query
from models import Job
from schemas import JobCreate, JobResponse
from redis_client import get_redis
from typing import List

router = APIRouter(prefix="/jobs", tags=["Jobs"])
redis = get_redis()

# TTLs (seconds)
TTL_LIST = 300      # 5 min
TTL_FEATURED = 600  # 10 min
TTL_SEARCH = 120    # 2 min


# ── 1. POST /jobs — Post a new job ──────────────────────────────
@router.post("", status_code=201)
async def create_job(payload: JobCreate):
    job = Job(**payload.model_dump())
    await job.insert()
    # Invalidate cached list
    redis.delete("jobs:list")
    return {"id": str(job.id), "message": "Job posted successfully"}


# ── 2. GET /jobs — List all jobs (Redis cached) ──────────────────
@router.get("", response_model=List[dict])
async def list_jobs():
    cached = redis.get("jobs:list")
    if cached:
        return json.loads(cached)

    jobs = await Job.find(Job.is_closed == False).to_list()
    result = [
        {"id": str(j.id), "title": j.title, "company": j.company,
         "location": j.location, "tags": j.tags, "is_featured": j.is_featured}
        for j in jobs
    ]
    redis.setex("jobs:list", TTL_LIST, json.dumps(result))
    return result


# ── 3. GET /jobs/search — Search by title/location ───────────────
@router.get("/search")
async def search_jobs(q: str = Query(..., description="Search term")):
    cache_key = f"jobs:search:{q.lower()}"
    cached = redis.get(cache_key)
    if cached:
        return json.loads(cached)

    jobs = await Job.find(
        {"$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}}
        ]}
    ).to_list()

    result = [
        {"id": str(j.id), "title": j.title, "company": j.company, "location": j.location}
        for j in jobs
    ]
    redis.setex(cache_key, TTL_SEARCH, json.dumps(result))
    return result


# ── 4. PATCH /jobs/{id}/close — Close a listing ──────────────────
@router.patch("/{job_id}/close")
async def close_job(job_id: str):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_closed = True
    await job.save()
    # Invalidate caches
    redis.delete("jobs:list")
    redis.delete("jobs:featured")
    return {"message": f"Job {job_id} closed"}


# ── 5. GET /jobs/featured — Get featured jobs (Redis cached) ─────
@router.get("/featured")
async def featured_jobs():
    cached = redis.get("jobs:featured")
    if cached:
        return json.loads(cached)

    jobs = await Job.find(
        Job.is_featured == True, Job.is_closed == False
    ).to_list()

    result = [
        {"id": str(j.id), "title": j.title, "company": j.company, "location": j.location}
        for j in jobs
    ]
    redis.setex("jobs:featured", TTL_FEATURED, json.dumps(result))
    return result
```

---

### Step 2.9 — `main.py`

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import init_db
from routers.jobs import router as jobs_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title="Jobs Service",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(jobs_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "jobs"}
```

---

### Step 2.10 — Uncomment Jobs Service in `docker-compose.yml`

In `docker-compose.yml`, uncomment the `jobs:` block (remove `#` from all lines).

---

### Step 2.11 — Build & Run

```bash
docker compose up jobs --build -d
```

**Verify:**
```bash
# Health check
curl http://localhost:8002/health

# Post a job
curl -X POST http://localhost:8002/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Engineer","company":"Acme","location":"Remote","description":"FastAPI role","tags":["python","fastapi"],"is_featured":true}'

# List jobs
curl http://localhost:8002/jobs

# Search
curl "http://localhost:8002/jobs/search?q=python"

# Featured
curl http://localhost:8002/jobs/featured
```

> ✅ **Phase 2 Complete** when all 5 endpoints return valid responses.

---

## Phase 3 — Candidates Service (Node + MongoDB)

> **Goal:** Express.js service with 5 endpoints connected to MongoDB.
> **Port:** 3000

---

### Step 3.1 — Create Service Files

```bash
cd services/candidates
npm init -y
npm install express mongoose dotenv
npm install --save-dev nodemon
cd ../../
```

Files to create:
```bash
touch services/candidates/Dockerfile
touch services/candidates/src/index.js
touch services/candidates/src/db.js
touch services/candidates/src/models/candidate.js
touch services/candidates/src/routes/candidates.js
```

---

### Step 3.2 — `Dockerfile`

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]
```

---

### Step 3.3 — `package.json` scripts section

Add to `package.json`:
```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js"
}
```

---

### Step 3.4 — `src/db.js`

```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const db = process.env.MONGO_DB_CANDIDATES || 'candidatesdb';

  await mongoose.connect(`${uri}/${db}`);
  console.log(`MongoDB connected: ${db}`);
};

module.exports = connectDB;
```

---

### Step 3.5 — `src/models/candidate.js`

```javascript
const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  skills: [String],
  resume_url: { type: String, default: null },
  portfolio_links: [String],
  experience_years: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', CandidateSchema);
```

---

### Step 3.6 — `src/routes/candidates.js` (All 5 Endpoints)

```javascript
const express = require('express');
const router = express.Router();
const Candidate = require('../models/candidate');

// ── 1. POST /candidates — Create profile ───────────────────────
router.post('/', async (req, res) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();
    res.status(201).json({ id: candidate._id, message: 'Profile created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── 2. PUT /candidates/:id/resume — Update resume ──────────────
router.put('/:id/resume', async (req, res) => {
  try {
    const { resume_url } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { resume_url, updated_at: new Date() },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Resume updated', resume_url: candidate.resume_url });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── 3. PUT /candidates/:id/skills — Update skills ──────────────
router.put('/:id/skills', async (req, res) => {
  try {
    const { skills } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { skills, updated_at: new Date() },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Skills updated', skills: candidate.skills });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── 4. PUT /candidates/:id/portfolio — Update portfolio ─────────
router.put('/:id/portfolio', async (req, res) => {
  try {
    const { portfolio_links } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { portfolio_links, updated_at: new Date() },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json({ message: 'Portfolio updated', links: candidate.portfolio_links });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ── 5. GET /candidates/:id/match/:job_id — Match score ──────────
// Simple scoring: count matching skills vs job tags
// In a real system, this would call the Jobs service to get tags
router.get('/:id/match/:job_id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    // Fetch job from Jobs service to compare tags
    const jobsUrl = process.env.JOBS_SERVICE_URL || 'http://jobs:8002';
    const fetch = (await import('node-fetch')).default;
    const jobsRes = await fetch(`${jobsUrl}/jobs`);
    const jobs = await jobsRes.json();

    const job = jobs.find(j => j.id === req.params.job_id);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const candidateSkills = candidate.skills.map(s => s.toLowerCase());
    const jobTags = job.tags.map(t => t.toLowerCase());
    const matched = candidateSkills.filter(s => jobTags.includes(s));
    const score = jobTags.length > 0
      ? Math.round((matched.length / jobTags.length) * 100)
      : 0;

    res.json({
      candidate_id: candidate._id,
      job_id: req.params.job_id,
      match_score: score,
      matched_skills: matched,
      total_job_tags: jobTags.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
```

---

### Step 3.7 — `src/index.js`

```javascript
require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const candidateRoutes = require('./routes/candidates');

const app = express();
const PORT = process.env.CANDIDATES_PORT || 3000;

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'candidates' });
});

app.use('/candidates', candidateRoutes);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Candidates service running on port ${PORT}`);
  });
};

start();
```

---

### Step 3.8 — Add `node-fetch` dependency

```bash
cd services/candidates
npm install node-fetch
cd ../../
```

---

### Step 3.9 — Uncomment Candidates in `docker-compose.yml`

Also add `JOBS_SERVICE_URL` under candidates environment:
```yaml
environment:
  JOBS_SERVICE_URL: http://jobs:8002
```

---

### Step 3.10 — Build & Verify

```bash
docker compose up candidates --build -d

# Health check
curl http://localhost:3000/health

# Create candidate
curl -X POST http://localhost:3000/candidates \
  -H "Content-Type: application/json" \
  -d '{"name":"Sagar Patil","email":"sagar@example.com","skills":["python","fastapi","docker"],"experience_years":3}'

# Update skills (use id from above response)
curl -X PUT http://localhost:3000/candidates/<ID>/skills \
  -H "Content-Type: application/json" \
  -d '{"skills":["python","fastapi","docker","mongodb"]}'
```

> ✅ **Phase 3 Complete** when all 5 endpoints respond correctly.

---

## Phase 4 — Applications Service (Python-A + PostgreSQL)

> **Goal:** FastAPI service with 5 endpoints connected to PostgreSQL.
> **Port:** 8001

---

### Step 4.1 — Create Service Files

```bash
touch services/applications/Dockerfile
touch services/applications/requirements.txt
touch services/applications/main.py
touch services/applications/database.py
touch services/applications/models.py
touch services/applications/schemas.py
touch services/applications/redis_client.py
touch services/applications/routers/applications.py
touch services/applications/worker.py
```

---

### Step 4.2 — `requirements.txt`

```txt
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
asyncpg==0.29.0            # Async PG driver
alembic==1.13.1
pydantic==2.7.1
redis==5.0.4
rq==1.16.2
rq-scheduler==0.13.1
python-dotenv==1.0.1
httpx==0.27.0
```

---

### Step 4.3 — `Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
```

---

### Step 4.4 — `database.py`

```python
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase

PG_USER = os.getenv("POSTGRES_USER", "jobboard")
PG_PASS = os.getenv("POSTGRES_PASSWORD", "jobboard123")
PG_HOST = os.getenv("POSTGRES_HOST", "localhost")
PG_PORT = os.getenv("POSTGRES_PORT", "5432")
PG_DB   = os.getenv("POSTGRES_DB", "jobboard_db")

DATABASE_URL = f"postgresql+asyncpg://{PG_USER}:{PG_PASS}@{PG_HOST}:{PG_PORT}/{PG_DB}"

engine = create_async_engine(DATABASE_URL, echo=True)

AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
```

---

### Step 4.5 — `models.py`

```python
from sqlalchemy import Column, Integer, String, Text, DateTime, func
from database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), nullable=False, index=True)
    candidate_id = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="applied")   # applied | shortlisted | rejected
    applied_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    notes = Column(Text, nullable=True)
```

---

### Step 4.6 — `schemas.py`

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ApplicationCreate(BaseModel):
    job_id: str
    candidate_id: str
    notes: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    job_id: str
    candidate_id: str
    status: str
    applied_at: datetime
    updated_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True
```

---

### Step 4.7 — `routers/applications.py` (All 5 Endpoints)

```python
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database import get_db
from models import Application
from schemas import ApplicationCreate, ApplicationResponse
from typing import List

router = APIRouter(prefix="/applications", tags=["Applications"])


# ── 1. POST /applications/apply ─────────────────────────────────
@router.post("/apply", status_code=201)
async def apply_for_job(payload: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    application = Application(**payload.model_dump())
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return {"id": application.id, "message": "Application submitted"}


# ── 2. GET /applications/{id}/status ────────────────────────────
@router.get("/{app_id}/status", response_model=ApplicationResponse)
async def get_status(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


# ── 3. PATCH /applications/{id}/shortlist ───────────────────────
@router.patch("/{app_id}/shortlist")
async def shortlist(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "shortlisted"
    await db.commit()
    return {"message": f"Application {app_id} shortlisted"}


# ── 4. PATCH /applications/{id}/reject ──────────────────────────
@router.patch("/{app_id}/reject")
async def reject(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "rejected"
    await db.commit()
    return {"message": f"Application {app_id} rejected"}


# ── 5. GET /applications/pipeline/{job_id} ──────────────────────
@router.get("/pipeline/{job_id}")
async def hiring_pipeline(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Application).where(Application.job_id == job_id)
    )
    apps = result.scalars().all()
    return {
        "job_id": job_id,
        "total": len(apps),
        "applied": [a.id for a in apps if a.status == "applied"],
        "shortlisted": [a.id for a in apps if a.status == "shortlisted"],
        "rejected": [a.id for a in apps if a.status == "rejected"],
    }
```

---

### Step 4.8 — `main.py`

```python
from fastapi import FastAPI
from routers.applications import router as app_router

app = FastAPI(title="Applications Service", version="1.0.0")
app.include_router(app_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "applications"}
```

---

### Step 4.9 — Uncomment Applications in `docker-compose.yml`

---

### Step 4.10 — Build & Verify

```bash
docker compose up applications --build -d

curl http://localhost:8001/health

# Apply for a job (use a real job_id from jobs service)
curl -X POST http://localhost:8001/applications/apply \
  -H "Content-Type: application/json" \
  -d '{"job_id":"abc123","candidate_id":"cand001","notes":"Strong match"}'

# Check status
curl http://localhost:8001/applications/1/status

# Shortlist
curl -X PATCH http://localhost:8001/applications/1/shortlist

# Pipeline
curl http://localhost:8001/applications/pipeline/abc123
```

> ✅ **Phase 4 Complete** when all 5 endpoints respond correctly against PostgreSQL.

---

## Phase 5 — Redis Caching

> Redis caching is already wired into Phase 2 (Jobs service).
> This phase adds session caching to the Applications service.

### Step 5.1 — `redis_client.py` in Applications Service

```python
import os
import redis

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

SESSION_TTL = 1800  # 30 minutes

def set_session(candidate_id: str, data: dict):
    import json
    redis_client.setex(f"session:{candidate_id}", SESSION_TTL, json.dumps(data))

def get_session(candidate_id: str):
    import json
    val = redis_client.get(f"session:{candidate_id}")
    return json.loads(val) if val else None

def delete_session(candidate_id: str):
    redis_client.delete(f"session:{candidate_id}")
```

### Step 5.2 — Verify Redis Keys

After running services, inspect cached keys:

```bash
docker exec -it jb_redis redis-cli
> KEYS *
> TTL jobs:list
> GET jobs:featured
```

---

## Phase 6 — Message Queue + Cron Jobs (RQ)

> **Goal:** 3 cron jobs running inside an RQ worker container.

---

### Step 6.1 — `worker.py` in Applications Service

```python
import os
import json
import logging
from datetime import datetime, timedelta
from redis import Redis
from rq import Queue
from rq_scheduler import Scheduler
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

redis_conn = Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379))
)
scheduler = Scheduler(connection=redis_conn)
queue = Queue(connection=redis_conn)

JOBS_SERVICE_URL = os.getenv("JOBS_SERVICE_URL", "http://jobs:8002")


# ── Cron Job 1: Job Expiry Cleanup (runs every midnight) ─────────
def job_expiry_cleanup():
    logger.info(f"[CRON] job_expiry_cleanup started at {datetime.utcnow()}")
    try:
        response = httpx.get(f"{JOBS_SERVICE_URL}/jobs")
        jobs = response.json()
        now = datetime.utcnow()
        expired = [j for j in jobs if j.get("expires_at") and
                   datetime.fromisoformat(j["expires_at"]) < now]

        for job in expired:
            httpx.patch(f"{JOBS_SERVICE_URL}/jobs/{job['id']}/close")
            logger.info(f"  Closed expired job: {job['id']} - {job['title']}")

        logger.info(f"[CRON] Closed {len(expired)} expired jobs")
    except Exception as e:
        logger.error(f"[CRON] job_expiry_cleanup failed: {e}")


# ── Cron Job 2: Daily Job Digest Email (runs every 8AM) ──────────
def daily_job_digest():
    logger.info(f"[CRON] daily_job_digest started at {datetime.utcnow()}")
    try:
        response = httpx.get(f"{JOBS_SERVICE_URL}/jobs/featured")
        featured = response.json()
        logger.info(f"[CRON] Daily digest: {len(featured)} featured jobs")
        for job in featured:
            logger.info(f"  - {job['title']} at {job['company']} ({job['location']})")
        # TODO: integrate SendGrid for actual email dispatch
    except Exception as e:
        logger.error(f"[CRON] daily_job_digest failed: {e}")


# ── Cron Job 3: Application Summary Report (runs every Sunday) ───
def application_summary():
    logger.info(f"[CRON] application_summary started at {datetime.utcnow()}")
    try:
        # Direct DB query would go here for production
        # For now log a summary stub
        logger.info("[CRON] Weekly application summary generated")
        # TODO: query applications table, group by status, log/email report
    except Exception as e:
        logger.error(f"[CRON] application_summary failed: {e}")


# ── Schedule all jobs ─────────────────────────────────────────────
def schedule_jobs():
    # Clear existing scheduled jobs to avoid duplicates on restart
    for job in scheduler.get_jobs():
        scheduler.cancel(job)

    now = datetime.utcnow()

    # Midnight daily
    scheduler.cron(
        "0 0 * * *",
        func=job_expiry_cleanup,
        id="job_expiry_cleanup",
        use_local_timezone=False
    )

    # 8AM daily
    scheduler.cron(
        "0 8 * * *",
        func=daily_job_digest,
        id="daily_job_digest",
        use_local_timezone=False
    )

    # Every Sunday midnight
    scheduler.cron(
        "0 0 * * 0",
        func=application_summary,
        id="application_summary",
        use_local_timezone=False
    )

    logger.info("[SCHEDULER] 3 cron jobs scheduled")


if __name__ == "__main__":
    schedule_jobs()
    scheduler.run()
```

---

### Step 6.2 — Uncomment `rq_worker` in `docker-compose.yml`

---

### Step 6.3 — Build & Verify

```bash
docker compose up rq_worker --build -d

# Check worker logs
docker logs jb_rq_worker -f

# Inspect scheduled jobs in Redis
docker exec -it jb_redis redis-cli
> KEYS rq:scheduler:*
```

---

## Phase 7 — Dashboard HTML

> **Goal:** Single HTML file with tabs for all 3 services, forms for POST/PATCH, tables for GET.
> No frameworks. Vanilla JS only.

---

### Step 7.1 — Structure of `dashboard.html`

```
Tabs: [ Jobs ] [ Applications ] [ Candidates ]

Jobs tab:
  - Post Job (form)
  - List All Jobs (button → table)
  - Search Jobs (input + button → table)
  - Featured Jobs (button → table)
  - Close Job (input + button)

Applications tab:
  - Apply for Job (form)
  - Get Status (input + button)
  - Shortlist / Reject (input + buttons)
  - Hiring Pipeline (input + button → breakdown)

Candidates tab:
  - Create Profile (form)
  - Update Resume URL (input + button)
  - Update Skills (input + button)
  - Update Portfolio (input + button)
  - Match Score (inputs + button)
```

---

### Step 7.2 — Config at top of `dashboard.html`

```html
<script>
const CONFIG = {
  JOBS_URL: "http://localhost:8002",
  APPLICATIONS_URL: "http://localhost:8001",
  CANDIDATES_URL: "http://localhost:3000"
};
</script>
```

> Full HTML implementation will be written in this phase.

> ✅ **Phase 7 Complete** when all endpoints are accessible from the HTML file.

---

## Checklist Tracker

Use this to track progress. Update as you go.

### Phase 1 — Infra
- [ ] 1.1 Root directory + git init
- [ ] 1.2 Folder structure created
- [ ] 1.3 `.env` file populated
- [ ] 1.4 `infra/postgres/init.sql` created
- [ ] 1.5 `infra/redis/redis.conf` created
- [ ] 1.6 `docker-compose.yml` written
- [ ] 1.7 Infra containers healthy (PG + Mongo + Redis)

### Phase 2 — Jobs Service
- [ ] 2.1–2.9 All files created
- [ ] 2.10 Uncommented in compose
- [ ] 2.11 All 5 endpoints verified

### Phase 3 — Candidates Service
- [ ] 3.1–3.8 All files created
- [ ] 3.9 Uncommented in compose
- [ ] 3.10 All 5 endpoints verified

### Phase 4 — Applications Service
- [ ] 4.1–4.8 All files created
- [ ] 4.9 Uncommented in compose
- [ ] 4.10 All 5 endpoints verified

### Phase 5 — Redis
- [ ] 5.1 Session caching in applications service
- [ ] 5.2 Redis key inspection verified

### Phase 6 — MQ + Crons
- [ ] 6.1 `worker.py` written
- [ ] 6.2 `rq_worker` uncommented in compose
- [ ] 6.3 Worker logs show scheduled jobs

### Phase 7 — Dashboard
- [ ] 7.1 HTML structure planned
- [ ] 7.2 All endpoints reachable from browser

---

## Quick Reference — Ports & Services

| Service | Port | Tech | DB |
|---|---|---|---|
| Applications | 8001 | FastAPI | PostgreSQL |
| Jobs | 8002 | FastAPI | MongoDB |
| Candidates | 3000 | Express | MongoDB |
| PostgreSQL | 5432 | — | — |
| MongoDB | 27017 | — | — |
| Redis | 6379 | — | — |

## Quick Reference — All Endpoints

| Service | Method | Endpoint |
|---|---|---|
| Jobs | POST | `/jobs` |
| Jobs | GET | `/jobs` |
| Jobs | GET | `/jobs/search?q=` |
| Jobs | PATCH | `/jobs/{id}/close` |
| Jobs | GET | `/jobs/featured` |
| Applications | POST | `/applications/apply` |
| Applications | GET | `/applications/{id}/status` |
| Applications | PATCH | `/applications/{id}/shortlist` |
| Applications | PATCH | `/applications/{id}/reject` |
| Applications | GET | `/applications/pipeline/{job_id}` |
| Candidates | POST | `/candidates` |
| Candidates | PUT | `/candidates/:id/resume` |
| Candidates | PUT | `/candidates/:id/skills` |
| Candidates | PUT | `/candidates/:id/portfolio` |
| Candidates | GET | `/candidates/:id/match/:job_id` |

---

*Last updated: Phase 0 — Plan created. Start with Phase 1.*
