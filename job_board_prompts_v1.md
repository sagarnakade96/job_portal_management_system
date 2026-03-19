# 🤖 Job Board — Vibe Coding Prompt Guide
> Feed these prompts one at a time to your AI coding agent (Copilot, Cursor, Windsurf, etc.)
> **Rule:** Complete + verify each prompt before moving to the next.

---

## 📌 How to Use This Guide

| Term | Meaning |
|---|---|
| `> YOU:` | Action YOU need to take (not for the agent) |
| `> VERIFY:` | Check this passes before next prompt |
| `📋 PROMPT [ID]` | Copy everything inside the code block and paste to agent |

**Recommended agents (in order of preference):**
- **Cursor** — open project folder, use Agent mode (`Ctrl+Shift+P` → "Cursor: New Chat", toggle to Agent)
- **GitHub Copilot (VS Code)** — open project folder, use Copilot Chat (`Ctrl+Shift+I`), click the `#` icon to attach workspace context
- **Windsurf** — open project folder, use Cascade panel

> ⚠️ Always open the `job-board/` folder as the workspace root before feeding any prompt.
> ⚠️ Feed ONE prompt at a time. Wait for agent to finish before the next.

---

## 🧠 SYSTEM PROMPT
> **YOU:** Feed this FIRST in a fresh chat session before any task prompt.
> In Cursor/Copilot: paste this as the first message or set as custom instructions.
> In Cursor: Settings → Rules for AI → paste here for persistent context.

```
You are a senior full-stack engineer working on a project called "Job Board Platform".

## Project Stack
- 3 microservices: Jobs Service (FastAPI + MongoDB), Candidates Service (Express.js + MongoDB), Applications Service (FastAPI + PostgreSQL)
- Infrastructure: PostgreSQL 16, MongoDB 7, Redis 7 — all running as Docker containers
- Containerization: Docker + Docker Compose v2
- Message Queue: Redis Queue (RQ) with rq-scheduler
- Frontend: Single dashboard.html — vanilla JS only, no frameworks

## Absolute Rules
1. Never generate docker-compose infra services for postgres, mongo, or redis — they are handled separately
2. All Python services use Python 3.12, FastAPI, Pydantic v2, uvicorn
3. All environment variables come from .env at project root via env_file in docker-compose
4. MongoDB host inside docker network = `mongo`, PostgreSQL host = `postgres`, Redis host = `redis`
5. Never use docker-compose v1 syntax — always use Compose v2 (no `version:` key needed but keep it for compatibility)
6. One task at a time — create only the files I ask for in each prompt, nothing extra
7. When I say "create file X with content Y", write the EXACT content specified
8. Never add placeholder TODOs unless the plan specifies them

## Project Root
~/job-board/

## Current Phase
Phase 1 — Scaffold & Docker Infra
```

---

## PHASE 1 — Project Scaffold & Docker Infra

---

### PROMPT 1.1 — Root Scaffold

> **YOU:** Open terminal, `cd ~`. This prompt creates the root project directory, git init, and .gitignore.
> **Feed to:** Agent (Cursor/Copilot) OR just run the commands yourself in terminal — this one is pure shell.
> **VERIFY:** `ls ~/job-board` shows `.git` and `.gitignore`

```
I am starting a new project. Run the following shell commands to scaffold the root:

1. Create the project directory and initialize git:
mkdir -p ~/job-board
cd ~/job-board
git init

2. Create ~/job-board/.gitignore with exactly this content:
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

Do not create any other files. Confirm when done.
```

---

### PROMPT 1.2 — Folder Structure

> **YOU:** Make sure you're in `~/job-board/` as workspace root.
> **VERIFY:** Run `find ~/job-board -not -path '*/.git/*' | sort` — should match the expected tree in the plan.

```
Inside the project root ~/job-board/, create the following folder structure by running shell commands:

mkdir -p services/applications/routers
mkdir -p services/jobs/routers
mkdir -p services/candidates/src/routes
mkdir -p services/candidates/src/models
mkdir -p infra/postgres
mkdir -p infra/redis

Then create these placeholder files so git tracks the empty directories:
touch services/applications/routers/.gitkeep
touch services/jobs/routers/.gitkeep
touch services/candidates/src/routes/.gitkeep
touch services/candidates/src/models/.gitkeep

Then create these empty top-level files:
touch docker-compose.yml
touch dashboard.html
touch .env

Do not add any content to these files yet. Confirm with the final folder tree output.
```

---

### PROMPT 1.3 — Environment File

> **YOU:** This creates the master `.env`. All services read from this.
> **VERIFY:** `cat ~/job-board/.env` shows all 12 variables.

```
Create the file ~/job-board/.env with exactly this content:

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

Do not modify .gitignore or any other file. Only create .env.
```

---

### PROMPT 1.4 — PostgreSQL Init Script

> **YOU:** This SQL runs automatically when the postgres container first starts.
> **VERIFY:** File exists at `infra/postgres/init.sql` with the CREATE TABLE statement.

```
Create the file ~/job-board/infra/postgres/init.sql with exactly this content:

-- Runs automatically when the postgres container starts for the first time

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(100) NOT NULL,
    candidate_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'applied',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

Only create this one file. Nothing else.
```

---

### PROMPT 1.5 — Redis Config

> **YOU:** This config file gets mounted into the Redis container.
> **VERIFY:** File exists at `infra/redis/redis.conf`.

```
Create the file ~/job-board/infra/redis/redis.conf with exactly this content:

# Redis config for development

bind 0.0.0.0
maxmemory 256mb
maxmemory-policy allkeys-lru

save 900 1
save 300 10
save 60 10000

loglevel notice

Only create this one file. Nothing else.
```

---

### PROMPT 1.6 — docker-compose.yml

> **YOU:** This is the master compose file. App services are commented out — they get uncommented phase by phase.
> **VERIFY:** `docker compose config` from `~/job-board/` shows no errors.

```
Create the file ~/job-board/docker-compose.yml with exactly this content:

version: "3.9"

services:

  # ── INFRASTRUCTURE ──────────────────────────────────────────────

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

  # ── APP SERVICES (uncomment in later phases) ────────────────────

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
  #   command: python worker.py
  #   depends_on:
  #     redis:
  #       condition: service_healthy
  #     postgres:
  #       condition: service_healthy
  #   networks:
  #     - jobboard_net

# ── VOLUMES ───────────────────────────────────────────────────────
volumes:
  pg_data:
  mongo_data:
  redis_data:

# ── NETWORKS ──────────────────────────────────────────────────────
networks:
  jobboard_net:
    driver: bridge

Only write this file. Do not modify any other file.
```

---

### PROMPT 1.7 — Start & Verify Infra

> **YOU:** Run this yourself in terminal. No agent needed here.
> **VERIFY:** All 3 containers show `(healthy)` in `docker compose ps`.

```
Run these commands from ~/job-board/ to start and verify infra:

# Start infra containers
docker compose up postgres mongo redis -d

# Wait ~15 seconds then check health
docker compose ps

# Verify PostgreSQL — should show the applications table
docker exec -it jb_postgres psql -U jobboard -d jobboard_db -c "\dt"

# Verify MongoDB — should return { ok: 1 }
docker exec -it jb_mongo mongosh --eval "db.adminCommand('ping')"

# Verify Redis — should return PONG
docker exec -it jb_redis redis-cli ping

Report the output of each command.
```

---

## PHASE 2 — Jobs Service (FastAPI + MongoDB)

> **YOU:** Phase 1 must be complete and all 3 infra containers healthy before starting Phase 2.

---

### PROMPT 2.1 — Jobs Service File Scaffold

> **YOU:** Creates all empty files for the jobs service.
> **VERIFY:** `ls services/jobs/` and `ls services/jobs/routers/` show all files.

```
Inside ~/job-board/, create these empty files for the Jobs microservice:

touch services/jobs/Dockerfile
touch services/jobs/requirements.txt
touch services/jobs/main.py
touch services/jobs/database.py
touch services/jobs/models.py
touch services/jobs/schemas.py
touch services/jobs/redis_client.py
touch services/jobs/routers/jobs.py

Remove the existing .gitkeep from services/jobs/routers/ after creating routers/jobs.py.

Only create these files. Do not add content yet.
```

---

### PROMPT 2.2 — Jobs Service: requirements.txt + Dockerfile

> **VERIFY:** Both files exist with correct content.

```
Working in ~/job-board/services/jobs/:

1. Write services/jobs/requirements.txt with exactly:

fastapi==0.111.0
uvicorn[standard]==0.29.0
motor==3.4.0
beanie==1.26.0
pydantic==2.7.1
redis==5.0.4
python-dotenv==1.0.1
httpx==0.27.0

2. Write services/jobs/Dockerfile with exactly:

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002", "--reload"]

Only write these 2 files.
```

---

### PROMPT 2.3 — Jobs Service: database.py + models.py + schemas.py

> **VERIFY:** All 3 files have correct content. Check Beanie imports are correct.

```
Working in ~/job-board/services/jobs/, write these 3 files:

1. services/jobs/database.py:

import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from models import Job

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB_JOBS", "jobsdb")

async def init_db():
    client = AsyncIOMotorClient(MONGO_URI)
    await init_beanie(database=client[MONGO_DB], document_models=[Job])


2. services/jobs/models.py:

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
        name = "jobs"


3. services/jobs/schemas.py:

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

Only write these 3 files.
```

---

### PROMPT 2.4 — Jobs Service: redis_client.py + routers/jobs.py

> **VERIFY:** Router has all 5 endpoints: POST /jobs, GET /jobs, GET /jobs/search, PATCH /jobs/{id}/close, GET /jobs/featured

```
Working in ~/job-board/services/jobs/, write these 2 files:

1. services/jobs/redis_client.py:

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


2. services/jobs/routers/jobs.py:

import json
from fastapi import APIRouter, HTTPException, Query
from models import Job
from schemas import JobCreate, JobResponse
from redis_client import get_redis
from typing import List

router = APIRouter(prefix="/jobs", tags=["Jobs"])
redis = get_redis()

TTL_LIST = 300
TTL_FEATURED = 600
TTL_SEARCH = 120


@router.post("", status_code=201)
async def create_job(payload: JobCreate):
    job = Job(**payload.model_dump())
    await job.insert()
    redis.delete("jobs:list")
    return {"id": str(job.id), "message": "Job posted successfully"}


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


@router.patch("/{job_id}/close")
async def close_job(job_id: str):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.is_closed = True
    await job.save()
    redis.delete("jobs:list")
    redis.delete("jobs:featured")
    return {"message": f"Job {job_id} closed"}


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

Only write these 2 files.
```

---

### PROMPT 2.5 — Jobs Service: main.py + Uncomment in Compose

> **VERIFY:** `docker compose config` shows `jobs` service block active (not commented).

```
Working in ~/job-board/, do 2 things:

1. Write services/jobs/main.py with exactly:

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


2. In docker-compose.yml, uncomment the `jobs:` service block by removing the `#` from all lines of that block. The block starts at `# jobs:` and ends before `# candidates:`. Keep candidates, applications, and rq_worker commented.

Only modify these 2 files.
```

---

### PROMPT 2.6 — Build & Verify Jobs Service

> **YOU:** Run this in terminal yourself.
> **VERIFY:** All 5 curl commands return valid JSON.

```
Run these commands from ~/job-board/ to build and verify the Jobs service:

docker compose up jobs --build -d

# Wait for it to start, then verify:

curl http://localhost:8002/health

curl -X POST http://localhost:8002/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"Backend Engineer","company":"Acme Corp","location":"Remote","description":"FastAPI role","tags":["python","fastapi"],"is_featured":true}'

curl http://localhost:8002/jobs

curl "http://localhost:8002/jobs/search?q=python"

curl http://localhost:8002/jobs/featured

Report the output of each command.
```

---

## PHASE 3 — Candidates Service (Express.js + MongoDB)

> **YOU:** Phase 2 must be complete before starting Phase 3.

---

### PROMPT 3.1 — Candidates: npm init + Dockerfile

> **YOU:** Run npm commands in terminal. Then let agent write Dockerfile.
> **VERIFY:** `package.json` exists in `services/candidates/` with express + mongoose + node-fetch.

```
Do the following for the Candidates service:

1. Run these shell commands:
cd ~/job-board/services/candidates
npm init -y
npm install express mongoose dotenv node-fetch
npm install --save-dev nodemon
cd ~/job-board

2. In services/candidates/package.json, update the "scripts" section to:
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js"
}

3. Create services/candidates/Dockerfile with exactly:

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "src/index.js"]

Only do these 3 things.
```

---

### PROMPT 3.2 — Candidates: db.js + model

> **VERIFY:** Both files exist with correct Mongoose schema.

```
Working in ~/job-board/services/candidates/src/, write these 2 files:

1. src/db.js:

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
  const db = process.env.MONGO_DB_CANDIDATES || 'candidatesdb';
  await mongoose.connect(`${uri}/${db}`);
  console.log(`MongoDB connected: ${db}`);
};

module.exports = connectDB;


2. src/models/candidate.js:

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

Only write these 2 files.
```

---

### PROMPT 3.3 — Candidates: routes/candidates.js

> **VERIFY:** 5 endpoints exist: POST /, PUT /:id/resume, PUT /:id/skills, PUT /:id/portfolio, GET /:id/match/:job_id

```
Write the file ~/job-board/services/candidates/src/routes/candidates.js with exactly this content:

const express = require('express');
const router = express.Router();
const Candidate = require('../models/candidate');

// 1. POST /candidates — Create profile
router.post('/', async (req, res) => {
  try {
    const candidate = new Candidate(req.body);
    await candidate.save();
    res.status(201).json({ id: candidate._id, message: 'Profile created' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. PUT /candidates/:id/resume — Update resume URL
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

// 3. PUT /candidates/:id/skills — Update skills
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

// 4. PUT /candidates/:id/portfolio — Update portfolio
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

// 5. GET /candidates/:id/match/:job_id — Match score
router.get('/:id/match/:job_id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

    const jobsUrl = process.env.JOBS_SERVICE_URL || 'http://jobs:8002';
    const { default: fetch } = await import('node-fetch');
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

Only write this one file.
```

---

### PROMPT 3.4 — Candidates: index.js + Uncomment in Compose

> **VERIFY:** `docker compose config` shows `candidates` service active.

```
Working in ~/job-board/, do 2 things:

1. Write services/candidates/src/index.js with exactly:

require('dotenv').config();
const express = require('express');
const connectDB = require('./db');
const candidateRoutes = require('./routes/candidates');

const app = express();
const PORT = process.env.CANDIDATES_PORT || 3000;

app.use(express.json());

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


2. In docker-compose.yml, uncomment the `candidates:` service block AND add an environment section to it with JOBS_SERVICE_URL. The uncommented block should look like:

  candidates:
    build: ./services/candidates
    container_name: jb_candidates
    restart: unless-stopped
    env_file: .env
    environment:
      JOBS_SERVICE_URL: http://jobs:8002
    ports:
      - "3000:3000"
    depends_on:
      mongo:
        condition: service_healthy
    networks:
      - jobboard_net

Keep applications and rq_worker commented.
```

---

### PROMPT 3.5 — Build & Verify Candidates Service

> **YOU:** Run in terminal.
> **VERIFY:** Health check passes. Create candidate returns an id.

```
Run these commands from ~/job-board/ to build and verify the Candidates service:

docker compose up candidates --build -d

curl http://localhost:3000/health

curl -X POST http://localhost:3000/candidates \
  -H "Content-Type: application/json" \
  -d '{"name":"Sagar Patil","email":"sagar@example.com","skills":["python","fastapi","docker"],"experience_years":3}'

# Use the _id from the response above in place of <CANDIDATE_ID>
curl -X PUT http://localhost:3000/candidates/<CANDIDATE_ID>/skills \
  -H "Content-Type: application/json" \
  -d '{"skills":["python","fastapi","docker","mongodb","redis"]}'

Report all outputs.
```

---

## PHASE 4 — Applications Service (FastAPI + PostgreSQL)

> **YOU:** Phase 3 must be complete before starting Phase 4.

---

### PROMPT 4.1 — Applications Service File Scaffold

> **VERIFY:** All files exist in `services/applications/`

```
Inside ~/job-board/, create these empty files for the Applications microservice:

touch services/applications/Dockerfile
touch services/applications/requirements.txt
touch services/applications/main.py
touch services/applications/database.py
touch services/applications/models.py
touch services/applications/schemas.py
touch services/applications/redis_client.py
touch services/applications/routers/applications.py

Remove services/applications/routers/.gitkeep after creating routers/applications.py.

Do not add content yet.
```

---

### PROMPT 4.2 — Applications: requirements.txt + Dockerfile

> **VERIFY:** requirements.txt includes asyncpg and sqlalchemy.

```
Working in ~/job-board/services/applications/, write these 2 files:

1. services/applications/requirements.txt:

fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
asyncpg==0.29.0
pydantic==2.7.1
redis==5.0.4
python-dotenv==1.0.1
httpx==0.27.0
rq==1.16.2
rq-scheduler==0.13.1
alembic==1.13.1


2. services/applications/Dockerfile:

FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

Only write these 2 files.
```

---

### PROMPT 4.3 — Applications: database.py + models.py + schemas.py

> **VERIFY:** Uses async SQLAlchemy with asyncpg. Table name is `applications`.

```
Working in ~/job-board/services/applications/, write these 3 files:

1. services/applications/database.py:

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

POSTGRES_USER = os.getenv("POSTGRES_USER", "jobboard")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "jobboard123")
POSTGRES_HOST = os.getenv("POSTGRES_HOST", "postgres")
POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
POSTGRES_DB = os.getenv("POSTGRES_DB", "jobboard_db")

DATABASE_URL = f"postgresql+asyncpg://{POSTGRES_USER}:{POSTGRES_PASSWORD}@{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


2. services/applications/models.py:

from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(100), nullable=False, index=True)
    candidate_id = Column(String(100), nullable=False, index=True)
    status = Column(String(50), default="applied")
    applied_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    notes = Column(Text, nullable=True)


3. services/applications/schemas.py:

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
    notes: Optional[str]

    model_config = {"from_attributes": True}

class PipelineEntry(BaseModel):
    status: str
    count: int

Only write these 3 files.
```

---

### PROMPT 4.4 — Applications: redis_client.py + routers/applications.py

> **VERIFY:** 5 endpoints: POST /apply, GET /{id}/status, PATCH /{id}/shortlist, PATCH /{id}/reject, GET /pipeline/{job_id}

```
Working in ~/job-board/services/applications/, write these 2 files:

1. services/applications/redis_client.py:

import os
import json
import redis

redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

SESSION_TTL = 1800

def set_session(candidate_id: str, data: dict):
    redis_client.setex(f"session:{candidate_id}", SESSION_TTL, json.dumps(data))

def get_session(candidate_id: str):
    val = redis_client.get(f"session:{candidate_id}")
    return json.loads(val) if val else None

def delete_session(candidate_id: str):
    redis_client.delete(f"session:{candidate_id}")


2. services/applications/routers/applications.py:

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models import Application
from schemas import ApplicationCreate, ApplicationResponse, PipelineEntry
from database import get_db
from typing import List

router = APIRouter(prefix="/applications", tags=["Applications"])


# 1. POST /applications/apply
@router.post("/apply", status_code=201, response_model=ApplicationResponse)
async def apply_for_job(payload: ApplicationCreate, db: AsyncSession = Depends(get_db)):
    app = Application(**payload.model_dump())
    db.add(app)
    await db.commit()
    await db.refresh(app)
    return app


# 2. GET /applications/{id}/status
@router.get("/{app_id}/status", response_model=ApplicationResponse)
async def get_status(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app


# 3. PATCH /applications/{id}/shortlist
@router.patch("/{app_id}/shortlist", response_model=ApplicationResponse)
async def shortlist(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "shortlisted"
    await db.commit()
    await db.refresh(app)
    return app


# 4. PATCH /applications/{id}/reject
@router.patch("/{app_id}/reject", response_model=ApplicationResponse)
async def reject(app_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Application).where(Application.id == app_id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = "rejected"
    await db.commit()
    await db.refresh(app)
    return app


# 5. GET /applications/pipeline/{job_id}
@router.get("/pipeline/{job_id}", response_model=List[PipelineEntry])
async def pipeline(job_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Application.status, func.count(Application.id).label("count"))
        .where(Application.job_id == job_id)
        .group_by(Application.status)
    )
    rows = result.all()
    return [{"status": row.status, "count": row.count} for row in rows]

Only write these 2 files.
```

---

### PROMPT 4.5 — Applications: main.py + Uncomment in Compose

> **VERIFY:** `docker compose config` shows all 3 app services active.

```
Working in ~/job-board/, do 2 things:

1. Write services/applications/main.py with exactly:

from fastapi import FastAPI
from contextlib import asynccontextmanager
from routers.applications import router as applications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(
    title="Applications Service",
    version="1.0.0",
    lifespan=lifespan
)

app.include_router(applications_router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "applications"}


2. In docker-compose.yml, uncomment the `applications:` service block. The final uncommented block should be:

  applications:
    build: ./services/applications
    container_name: jb_applications
    restart: unless-stopped
    env_file: .env
    ports:
      - "8001:8001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - jobboard_net

Keep rq_worker commented.
```

---

### PROMPT 4.6 — Build & Verify Applications Service

> **YOU:** Run in terminal.
> **VERIFY:** POST /apply returns an application object with id.

```
Run these commands from ~/job-board/ to build and verify the Applications service:

docker compose up applications --build -d

curl http://localhost:8001/health

# Replace <JOB_ID> with a job id from Phase 2 and <CANDIDATE_ID> with one from Phase 3
curl -X POST http://localhost:8001/applications/apply \
  -H "Content-Type: application/json" \
  -d '{"job_id":"<JOB_ID>","candidate_id":"<CANDIDATE_ID>","notes":"Strong Python background"}'

# Use the id from above
curl http://localhost:8001/applications/1/status

curl -X PATCH http://localhost:8001/applications/1/shortlist

curl http://localhost:8001/applications/pipeline/<JOB_ID>

Report all outputs.
```

---

## PHASE 5 — Redis Caching (already wired in Phase 2)

> **YOU:** Redis caching is already active in the Jobs service from Phase 2.
> This phase only verifies keys exist and adds session caching awareness to Applications.
> No new files needed — redis_client.py was already written in Prompt 4.4.

### PROMPT 5.1 — Verify Redis Keys

> **YOU:** Run in terminal after hitting a few Jobs endpoints.

```
Run these to inspect Redis keys in the running container:

docker exec -it jb_redis redis-cli KEYS "*"
docker exec -it jb_redis redis-cli TTL jobs:list
docker exec -it jb_redis redis-cli GET jobs:featured

Report the output. Expected: jobs:list and/or jobs:featured keys present with TTL > 0.
```

---

## PHASE 6 — RQ Worker + Cron Jobs

> **YOU:** Phase 5 must be verified before starting Phase 6.

---

### PROMPT 6.1 — worker.py

> **VERIFY:** File exists at `services/applications/worker.py` with 3 cron functions.

```
Create the file ~/job-board/services/applications/worker.py with exactly this content:

import os
import logging
from datetime import datetime
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


def daily_job_digest():
    logger.info(f"[CRON] daily_job_digest started at {datetime.utcnow()}")
    try:
        response = httpx.get(f"{JOBS_SERVICE_URL}/jobs/featured")
        featured = response.json()
        logger.info(f"[CRON] Daily digest: {len(featured)} featured jobs")
        for job in featured:
            logger.info(f"  - {job['title']} at {job['company']} ({job['location']})")
    except Exception as e:
        logger.error(f"[CRON] daily_job_digest failed: {e}")


def application_summary():
    logger.info(f"[CRON] application_summary started at {datetime.utcnow()}")
    try:
        logger.info("[CRON] Weekly application summary generated")
    except Exception as e:
        logger.error(f"[CRON] application_summary failed: {e}")


def schedule_jobs():
    for job in scheduler.get_jobs():
        scheduler.cancel(job)

    scheduler.cron("0 0 * * *", func=job_expiry_cleanup, id="job_expiry_cleanup", use_local_timezone=False)
    scheduler.cron("0 8 * * *", func=daily_job_digest, id="daily_job_digest", use_local_timezone=False)
    scheduler.cron("0 0 * * 0", func=application_summary, id="application_summary", use_local_timezone=False)

    logger.info("[SCHEDULER] 3 cron jobs scheduled")


if __name__ == "__main__":
    schedule_jobs()
    scheduler.run()

Only create this one file.
```

---

### PROMPT 6.2 — Uncomment rq_worker in Compose + Build

> **VERIFY:** `docker logs jb_rq_worker` shows "[SCHEDULER] 3 cron jobs scheduled"

```
Working in ~/job-board/:

1. In docker-compose.yml, uncomment the rq_worker service block. Change the command line to `python worker.py` (not `rq worker --with-scheduler`). The final uncommented block should be:

  rq_worker:
    build: ./services/applications
    container_name: jb_rq_worker
    restart: unless-stopped
    env_file: .env
    environment:
      JOBS_SERVICE_URL: http://jobs:8002
    command: python worker.py
    depends_on:
      redis:
        condition: service_healthy
      postgres:
        condition: service_healthy
    networks:
      - jobboard_net

2. Then run:
docker compose up rq_worker --build -d
docker logs jb_rq_worker -f

Wait 10 seconds and confirm the scheduler log line appears.
```

---

## PHASE 7 — Dashboard HTML

> **YOU:** All 3 services and the worker must be running before this phase.

---

### PROMPT 7.1 — dashboard.html

> **VERIFY:** Open `dashboard.html` in browser. All 3 tabs load. POST/GET actions return data.

```
Write the complete file ~/job-board/dashboard.html — a single-file vanilla JS dashboard with tabs for all 3 services.

Requirements:
- No frameworks. Pure HTML + CSS + vanilla JS only.
- 3 tabs: Jobs | Applications | Candidates
- Config block at top with service URLs:
  const CONFIG = {
    JOBS_URL: "http://localhost:8002",
    APPLICATIONS_URL: "http://localhost:8001",
    CANDIDATES_URL: "http://localhost:3000"
  };

Jobs tab must have:
- Post Job form (title, company, location, description, tags, is_featured checkbox)
- List All Jobs button → renders results as a table
- Search Jobs input + button → renders results as a table
- Featured Jobs button → renders results as a table
- Close Job input (job id) + button

Applications tab must have:
- Apply for Job form (job_id, candidate_id, notes)
- Get Status input (app id) + button → shows status
- Shortlist button (app id input)
- Reject button (app id input)
- Hiring Pipeline input (job_id) + button → shows status breakdown

Candidates tab must have:
- Create Profile form (name, email, skills comma-separated, experience_years)
- Update Resume URL (candidate id + url inputs + button)
- Update Skills (candidate id + skills input + button)
- Update Portfolio (candidate id + links input + button)
- Match Score (candidate id + job id inputs + button → shows score)

Style requirements:
- Clean, dark-mode professional look
- Each tab section clearly separated
- Response output shown below each action in a styled <pre> block
- All fetch calls use async/await with try/catch, display errors clearly

Write the complete, working HTML file.
```

---

## ✅ Final Verification Checklist

> **YOU:** Run this after all phases are complete.

```
Run a final end-to-end check of all services:

docker compose ps
# Expected: jb_postgres, jb_mongo, jb_redis, jb_jobs, jb_candidates, jb_applications, jb_rq_worker — all running

curl http://localhost:8002/health
curl http://localhost:8001/health
curl http://localhost:3000/health
docker logs jb_rq_worker --tail 20

Report any service not running or health check failing.
```

---

*Prompt Guide — Job Board Platform | Generated from JOB_BOARD_PLAN.md*