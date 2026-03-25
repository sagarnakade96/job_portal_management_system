# ⚛️ Job Board — React Dashboard Prompt Guide
> Vite + React + Tailwind CSS
> Project location: WSL Ubuntu, accessed from Windows via \\wsl$
> Feed ONE prompt at a time. Verify before moving to the next.

---

## 📌 How to Use This Guide

| Term | Meaning |
|---|---|
| `> YOU:` | Action YOU take manually |
| `> VERIFY:` | Check this before next prompt |
| `📋 PROMPT [ID]` | Copy full block → paste to Cursor/Copilot agent |

**WSL + Windows Setup Notes:**
- Your project lives at: `\\wsl$\Ubuntu\home\sagar\job-board\`
- Open VS Code on Windows → Remote WSL extension → open `job-board/` folder
- Run ALL terminal commands inside the **WSL terminal** (not Windows CMD/PowerShell)
- The dev server runs inside WSL — access it at `http://localhost:5173` from Windows browser
- If `localhost:5173` doesn't open, try `http://127.0.0.1:5173`

---

## 📐 API Response Shapes (Source of Truth)

These are the exact shapes your backend returns. Every component is built against these.

```
JOBS SERVICE (http://localhost:8002)

POST /jobs → { id: string, message: string }

GET /jobs → Array of:
  { id: string, title: string, company: string, location: string,
    tags: string[], is_featured: boolean }

GET /jobs/search?q= → Array of:
  { id: string, title: string, company: string, location: string }

GET /jobs/featured → Array of:
  { id: string, title: string, company: string, location: string }

PATCH /jobs/{id}/close → { message: string }

---

CANDIDATES SERVICE (http://localhost:3000)

POST /candidates → { id: string, message: string }

PUT /candidates/:id/resume → { message: string, resume_url: string }

PUT /candidates/:id/skills → { message: string, skills: string[] }

PUT /candidates/:id/portfolio → { message: string, links: string[] }

GET /candidates/:id/match/:job_id →
  { candidate_id: string, job_id: string, match_score: number,
    matched_skills: string[], total_job_tags: number }

---

APPLICATIONS SERVICE (http://localhost:8001)

POST /applications/apply →
  { id: number, job_id: string, candidate_id: string,
    status: string, applied_at: string, notes: string | null }

GET /applications/{id}/status →
  { id: number, job_id: string, candidate_id: string,
    status: string, applied_at: string, notes: string | null }

PATCH /applications/{id}/shortlist → same shape, status: "shortlisted"
PATCH /applications/{id}/reject → same shape, status: "rejected"

GET /applications/pipeline/{job_id} → Array of:
  { status: string, count: number }
```

---

## PHASE 1 — Project Setup

---

### PROMPT 1.1 — Create Vite + React Project

> **YOU:** Open WSL terminal. Navigate to your project root first.
> **VERIFY:** `http://localhost:5173` opens in Windows browser showing Vite default page.

```
I am setting up a new React project inside an existing monorepo.
The monorepo root is at ~/job-board/ on WSL Ubuntu.

Run these commands in WSL terminal:

cd ~/job-board
npm create vite@latest job-board-dashboard -- --template react
cd job-board-dashboard
npm install
npm run dev

The dev server should start on http://localhost:5173
This is running inside WSL and will be accessible from Windows browser at http://localhost:5173

Do not modify any files yet. Just confirm the dev server is running.
```

---

### PROMPT 1.2 — Install Tailwind CSS

> **YOU:** Keep the dev server running in one terminal. Open a second WSL terminal for this.
> **VERIFY:** `tailwind.config.js` exists. `npm run dev` still works after changes.

```
Inside ~/job-board/job-board-dashboard/, install and configure Tailwind CSS v3 for Vite + React.

Run in WSL terminal (inside job-board-dashboard/):

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

Now update tailwind.config.js with exactly this content:

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0b1120',
          panel: '#0f172a',
          border: '#1e293b',
          accent: '#38bdf8',
          'accent-strong': '#0ea5e9',
          success: '#22c55e',
          danger: '#f87171',
          warning: '#f59e0b',
          muted: '#94a3b8',
          text: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}

Now replace the entire content of src/index.css with:

@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
}

body {
  background-color: #0b1120;
  color: #e2e8f0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
}

Only modify these 2 files. Confirm when done.
```

---

### PROMPT 1.3 — Clean Up Boilerplate + Create Folder Structure

> **YOU:** This cleans Vite's default files and creates the component folder structure.
> **VERIFY:** `ls src/` shows the folders. Browser shows "Job Board" on dark background.

```
Inside ~/job-board/job-board-dashboard/src/, do the following:

1. Delete these:
   rm src/App.css
   rm -rf src/assets/

2. Create this folder structure:
   mkdir -p src/components/ui
   mkdir -p src/components/jobs
   mkdir -p src/components/candidates
   mkdir -p src/components/applications
   mkdir -p src/hooks
   mkdir -p src/services
   mkdir -p src/constants

3. Replace src/App.jsx with exactly:

import { useState } from 'react'

function App() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Job Board Dashboard
        </h1>
        <p className="text-slate-400">
          React version — Vite + Tailwind CSS
        </p>
      </div>
    </div>
  )
}

export default App

4. Replace src/main.jsx with exactly:

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

Confirm with the final src/ folder tree output.
```

---

### PROMPT 1.4 — API Service Layer

> **YOU:** This is the central file all components use to call your backend. No fetch calls scattered in components.
> **VERIFY:** `cat src/services/api.js` shows all 3 base URLs and all 15 functions.

```
Create the file ~/job-board/job-board-dashboard/src/services/api.js with exactly this content:

const BASE = {
  jobs: 'http://localhost:8002',
  candidates: 'http://localhost:3000',
  applications: 'http://localhost:8001',
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await response.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = text
  }
  if (!response.ok) {
    const message = typeof data === 'string'
      ? data
      : (data.detail || data.error || JSON.stringify(data))
    throw new Error(`HTTP ${response.status}: ${message}`)
  }
  return data
}

// ── Jobs ──────────────────────────────────────────────────────────
export const jobsApi = {
  create: (payload) =>
    request(`${BASE.jobs}/jobs`, { method: 'POST', body: JSON.stringify(payload) }),

  list: () =>
    request(`${BASE.jobs}/jobs`),

  search: (q) =>
    request(`${BASE.jobs}/jobs/search?q=${encodeURIComponent(q)}`),

  featured: () =>
    request(`${BASE.jobs}/jobs/featured`),

  close: (id) =>
    request(`${BASE.jobs}/jobs/${encodeURIComponent(id)}/close`, { method: 'PATCH' }),
}

// ── Candidates ────────────────────────────────────────────────────
export const candidatesApi = {
  create: (payload) =>
    request(`${BASE.candidates}/candidates`, { method: 'POST', body: JSON.stringify(payload) }),

  updateResume: (id, resume_url) =>
    request(`${BASE.candidates}/candidates/${encodeURIComponent(id)}/resume`,
      { method: 'PUT', body: JSON.stringify({ resume_url }) }),

  updateSkills: (id, skills) =>
    request(`${BASE.candidates}/candidates/${encodeURIComponent(id)}/skills`,
      { method: 'PUT', body: JSON.stringify({ skills }) }),

  updatePortfolio: (id, portfolio_links) =>
    request(`${BASE.candidates}/candidates/${encodeURIComponent(id)}/portfolio`,
      { method: 'PUT', body: JSON.stringify({ portfolio_links }) }),

  matchScore: (id, jobId) =>
    request(`${BASE.candidates}/candidates/${encodeURIComponent(id)}/match/${encodeURIComponent(jobId)}`),
}

// ── Applications ──────────────────────────────────────────────────
export const applicationsApi = {
  apply: (payload) =>
    request(`${BASE.applications}/applications/apply`,
      { method: 'POST', body: JSON.stringify(payload) }),

  status: (id) =>
    request(`${BASE.applications}/applications/${encodeURIComponent(id)}/status`),

  shortlist: (id) =>
    request(`${BASE.applications}/applications/${encodeURIComponent(id)}/shortlist`,
      { method: 'PATCH' }),

  reject: (id) =>
    request(`${BASE.applications}/applications/${encodeURIComponent(id)}/reject`,
      { method: 'PATCH' }),

  pipeline: (jobId) =>
    request(`${BASE.applications}/applications/pipeline/${encodeURIComponent(jobId)}`),
}

Only create this one file.
```

---

### PROMPT 1.5 — Constants File

> **VERIFY:** `cat src/constants/index.js` shows TABS, TAB_LABELS and STATUS_COLORS.

```
Create the file ~/job-board/job-board-dashboard/src/constants/index.js with exactly:

export const TABS = {
  JOBS: 'jobs',
  APPLICATIONS: 'applications',
  CANDIDATES: 'candidates',
}

export const TAB_LABELS = {
  [TABS.JOBS]: 'Jobs',
  [TABS.APPLICATIONS]: 'Applications',
  [TABS.CANDIDATES]: 'Candidates',
}

export const STATUS_COLORS = {
  applied: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  shortlisted: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  rejected: 'bg-red-500/20 text-red-300 border border-red-500/30',
}

export const STATUS_LABELS = {
  applied: 'Applied',
  shortlisted: 'Shortlisted',
  rejected: 'Rejected',
}

Only create this one file.
```

---

## PHASE 2 — Reusable UI Components

> These are building blocks used across all 3 service panels. Build them all before any feature components.

---

### PROMPT 2.1 — Button Component

> **VERIFY:** File exists. No errors in browser console after save.

```
Create the file ~/job-board/job-board-dashboard/src/components/ui/Button.jsx with exactly:

const VARIANTS = {
  primary: 'bg-gradient-to-r from-sky-400 to-cyan-300 text-slate-900 hover:from-sky-500 hover:to-cyan-400 shadow-lg shadow-sky-500/20',
  secondary: 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600',
  warning: 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-900 hover:from-amber-600 hover:to-yellow-500',
  danger: 'bg-gradient-to-r from-rose-500 to-red-400 text-slate-900 hover:from-rose-600 hover:to-red-500',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 border border-slate-700',
}

function Button({ children, variant = 'primary', onClick, type = 'button', disabled = false, className = '' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2.5 rounded-xl font-semibold text-sm
        transition-all duration-200 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]}
        ${className}
      `}
    >
      {children}
    </button>
  )
}

export default Button

Only create this one file.
```

---

### PROMPT 2.2 — Input + Textarea Components

> **VERIFY:** Both files exist in `src/components/ui/`

```
Create these 2 files:

1. ~/job-board/job-board-dashboard/src/components/ui/Input.jsx:

function Input({ label, id, value, onChange, placeholder = '', type = 'text', required = false, className = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-slate-300 font-medium">
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`
          w-full bg-slate-900/60 border border-slate-700 text-slate-200
          rounded-xl px-4 py-2.5 text-sm outline-none
          placeholder:text-slate-500
          focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20
          transition-all duration-200
          ${className}
        `}
      />
    </div>
  )
}

export default Input


2. ~/job-board/job-board-dashboard/src/components/ui/Textarea.jsx:

function Textarea({ label, id, value, onChange, placeholder = '', rows = 4, className = '' }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm text-slate-300 font-medium">
          {label}
        </label>
      )}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`
          w-full bg-slate-900/60 border border-slate-700 text-slate-200
          rounded-xl px-4 py-2.5 text-sm outline-none resize-vertical
          placeholder:text-slate-500
          focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20
          transition-all duration-200
          ${className}
        `}
      />
    </div>
  )
}

export default Textarea

Only create these 2 files.
```

---

### PROMPT 2.3 — Card + ResponseBlock + Badge Components

> **VERIFY:** All 3 files exist in `src/components/ui/`

```
Create these 3 files:

1. ~/job-board/job-board-dashboard/src/components/ui/Card.jsx:

function Card({ title, description, children, className = '' }) {
  return (
    <div className={`
      bg-gradient-to-b from-slate-900 to-slate-900/80
      border border-slate-800 rounded-2xl p-6 shadow-xl
      ${className}
    `}>
      {title && (
        <h2 className="text-lg font-bold text-white mb-1 tracking-tight">{title}</h2>
      )}
      {description && (
        <p className="text-sm text-slate-400 mb-5 leading-relaxed">{description}</p>
      )}
      {children}
    </div>
  )
}

export default Card


2. ~/job-board/job-board-dashboard/src/components/ui/ResponseBlock.jsx:

function ResponseBlock({ data, error, loading, emptyMessage = 'Awaiting action.' }) {
  const content = () => {
    if (loading) return { text: 'Loading...', color: 'text-slate-400' }
    if (error)   return { text: error, color: 'text-red-300' }
    if (data === null || data === undefined) return { text: emptyMessage, color: 'text-slate-500' }
    return {
      text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      color: 'text-blue-200'
    }
  }

  const { text, color } = content()

  return (
    <div className="mt-4">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-2 font-medium">Response</p>
      <pre className={`
        text-sm leading-relaxed whitespace-pre-wrap break-words
        bg-slate-950/80 border border-slate-800 rounded-xl
        p-4 min-h-[80px] overflow-auto
        ${color}
      `}>
        {text}
      </pre>
    </div>
  )
}

export default ResponseBlock


3. ~/job-board/job-board-dashboard/src/components/ui/Badge.jsx:

function Badge({ children, className = '' }) {
  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5
      rounded-full text-xs font-medium
      ${className}
    `}>
      {children}
    </span>
  )
}

export default Badge

Only create these 3 files.
```

---

### PROMPT 2.4 — DataTable Component

> **VERIFY:** File exists. No console errors.

```
Create the file ~/job-board/job-board-dashboard/src/components/ui/DataTable.jsx with exactly:

function DataTable({ rows = [] }) {
  if (!rows.length) {
    return (
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 text-center text-slate-500 text-sm italic">
        No records found.
      </div>
    )
  }

  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach(k => set.add(k))
      return set
    }, new Set())
  )

  return (
    <div className="overflow-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="bg-slate-950/90">
            {columns.map(col => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold text-sky-400 uppercase tracking-wider border-b border-slate-800"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
            >
              {columns.map(col => (
                <td key={col} className="px-4 py-3 text-slate-300 align-top">
                  {Array.isArray(row[col])
                    ? row[col].join(', ')
                    : typeof row[col] === 'boolean'
                    ? row[col] ? '✓' : '—'
                    : row[col] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable

Only create this one file.
```

---

### PROMPT 2.5 — TabBar Component

> **VERIFY:** File exists at `src/components/ui/TabBar.jsx`

```
Create the file ~/job-board/job-board-dashboard/src/components/ui/TabBar.jsx with exactly:

import { TABS, TAB_LABELS } from '../../constants'

function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="flex gap-3 flex-wrap mb-6">
      {Object.values(TABS).map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            px-5 py-2.5 rounded-full text-sm font-semibold
            border transition-all duration-200 cursor-pointer
            ${activeTab === tab
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }
          `}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </nav>
  )
}

export default TabBar

Only create this one file.
```

---

## PHASE 3 — Jobs Service Components

---

### PROMPT 3.1 — PostJobForm Component

> **VERIFY:** File exists. No import errors in console.

```
Create the file ~/job-board/job-board-dashboard/src/components/jobs/PostJobForm.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import { jobsApi } from '../../services/api'

const EMPTY = { title: '', company: '', location: '', description: '', tags: '', is_featured: false }

function PostJobForm() {
  const [form, setForm] = useState(EMPTY)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(prev => ({
    ...prev,
    [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value
  }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await jobsApi.create({
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      setData(result)
      setForm(EMPTY)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Post Job" description="Create a new job listing in MongoDB.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Title" id="title" value={form.title} onChange={set('title')} placeholder="Backend Engineer" required />
        <Input label="Company" id="company" value={form.company} onChange={set('company')} placeholder="Acme Corp" required />
        <Input label="Location" id="location" value={form.location} onChange={set('location')} placeholder="Remote" required />
        <Textarea label="Description" id="description" value={form.description} onChange={set('description')} placeholder="Role overview..." />
        <Input label="Tags (comma-separated)" id="tags" value={form.tags} onChange={set('tags')} placeholder="python, fastapi, docker" />
        <label className="flex items-center gap-2.5 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_featured}
            onChange={set('is_featured')}
            className="w-4 h-4 rounded accent-sky-500"
          />
          Featured Job
        </label>
        <Button type="submit" disabled={loading}>
          {loading ? 'Posting...' : 'Post Job'}
        </Button>
      </form>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export default PostJobForm

Only create this one file.
```

---

### PROMPT 3.2 — BrowseJobs Component

> **VERIFY:** File exists. No import errors.

```
Create the file ~/job-board/job-board-dashboard/src/components/jobs/BrowseJobs.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import DataTable from '../ui/DataTable'
import { jobsApi } from '../../services/api'

function BrowseJobs() {
  const [rows, setRows] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async (apiFn) => {
    setLoading(true)
    setError(null)
    setRows([])
    try {
      const result = await apiFn()
      setRows(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Browse Jobs" description="List, search, and view featured jobs." className="col-span-full">
      <div className="flex flex-wrap gap-3 items-end mb-5">
        <Button onClick={() => run(jobsApi.list)} disabled={loading}>
          List All Jobs
        </Button>
        <div className="flex gap-2 flex-1 min-w-[220px]">
          <Input
            placeholder="Search by title, location or tag"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => searchQuery.trim() && run(() => jobsApi.search(searchQuery.trim()))}
            disabled={loading}
          >
            Search
          </Button>
        </div>
        <Button variant="secondary" onClick={() => run(jobsApi.featured)} disabled={loading}>
          Featured Jobs
        </Button>
      </div>

      {loading && <p className="text-slate-400 text-sm mb-3">Loading...</p>}
      {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
      <DataTable rows={rows} />
    </Card>
  )
}

export default BrowseJobs

Only create this one file.
```

---

### PROMPT 3.3 — CloseJob Component

> **VERIFY:** File exists at `src/components/jobs/CloseJob.jsx`

```
Create the file ~/job-board/job-board-dashboard/src/components/jobs/CloseJob.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import { jobsApi } from '../../services/api'

function CloseJob() {
  const [jobId, setJobId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleClose = async () => {
    if (!jobId.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await jobsApi.close(jobId.trim())
      setData(result)
      setJobId('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Close Job" description="Mark a job listing as closed by its ID.">
      <div className="flex flex-col gap-4">
        <Input
          label="Job ID"
          value={jobId}
          onChange={e => setJobId(e.target.value)}
          placeholder="Paste MongoDB job id"
        />
        <Button variant="danger" onClick={handleClose} disabled={loading || !jobId.trim()}>
          {loading ? 'Closing...' : 'Close Job'}
        </Button>
      </div>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export default CloseJob

Only create this one file.
```

---

### PROMPT 3.4 — JobsPanel

> **VERIFY:** File exists at `src/components/jobs/JobsPanel.jsx`

```
Create the file ~/job-board/job-board-dashboard/src/components/jobs/JobsPanel.jsx with exactly:

import PostJobForm from './PostJobForm'
import BrowseJobs from './BrowseJobs'
import CloseJob from './CloseJob'

function JobsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <PostJobForm />
      <CloseJob />
      <BrowseJobs />
    </div>
  )
}

export default JobsPanel

Only create this one file.
```

---

## PHASE 4 — Applications Service Components

---

### PROMPT 4.1 — ApplyForm Component

> **VERIFY:** File exists. No import errors.

```
Create the file ~/job-board/job-board-dashboard/src/components/applications/ApplyForm.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import { applicationsApi } from '../../services/api'

const EMPTY = { job_id: '', candidate_id: '', notes: '' }

function ApplyForm() {
  const [form, setForm] = useState(EMPTY)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await applicationsApi.apply({
        job_id: form.job_id.trim(),
        candidate_id: form.candidate_id.trim(),
        notes: form.notes || null,
      })
      setData(result)
      setForm(EMPTY)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="Apply for Job"
      description="Submit a new application. The integer ID returned is used for status/shortlist/reject."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Job ID (MongoDB)" id="job_id" value={form.job_id} onChange={set('job_id')} placeholder="69baee1ec9ef63bdafcd5edc" required />
        <Input label="Candidate ID (MongoDB)" id="candidate_id" value={form.candidate_id} onChange={set('candidate_id')} placeholder="69bafdabb759915a589db048" required />
        <Textarea label="Notes" id="notes" value={form.notes} onChange={set('notes')} placeholder="Strong Python background..." rows={3} />
        <Button type="submit" disabled={loading}>
          {loading ? 'Applying...' : 'Apply'}
        </Button>
      </form>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export default ApplyForm

Only create this one file.
```

---

### PROMPT 4.2 — ApplicationStatus Component

> **VERIFY:** File exists. Shortlist/Reject/Get Status buttons all present.

```
Create the file ~/job-board/job-board-dashboard/src/components/applications/ApplicationStatus.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import Badge from '../ui/Badge'
import { applicationsApi } from '../../services/api'
import { STATUS_COLORS, STATUS_LABELS } from '../../constants'

function ApplicationStatus() {
  const [appId, setAppId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async (apiFn) => {
    if (!appId.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await apiFn(appId.trim())
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card
      title="Application Status"
      description="Use the integer ID from Apply. Fetch status or move the application through the pipeline."
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Application ID (integer)"
          value={appId}
          onChange={e => setAppId(e.target.value)}
          placeholder="1"
          type="number"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => run(applicationsApi.status)} disabled={loading}>
            Get Status
          </Button>
          <Button variant="warning" onClick={() => run(applicationsApi.shortlist)} disabled={loading}>
            Shortlist
          </Button>
          <Button variant="danger" onClick={() => run(applicationsApi.reject)} disabled={loading}>
            Reject
          </Button>
        </div>
        {data?.status && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status:</span>
            <Badge className={STATUS_COLORS[data.status] || 'bg-slate-700 text-slate-300'}>
              {STATUS_LABELS[data.status] || data.status}
            </Badge>
          </div>
        )}
      </div>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export default ApplicationStatus

Only create this one file.
```

---

### PROMPT 4.3 — HiringPipeline Component

> **VERIFY:** File exists at `src/components/applications/HiringPipeline.jsx`

```
Create the file ~/job-board/job-board-dashboard/src/components/applications/HiringPipeline.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import Badge from '../ui/Badge'
import { applicationsApi } from '../../services/api'
import { STATUS_COLORS, STATUS_LABELS } from '../../constants'

function HiringPipeline() {
  const [jobId, setJobId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    if (!jobId.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await applicationsApi.pipeline(jobId.trim())
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Hiring Pipeline" description="Status breakdown for all applications on a job.">
      <div className="flex flex-col gap-4">
        <Input
          label="Job ID (MongoDB)"
          value={jobId}
          onChange={e => setJobId(e.target.value)}
          placeholder="69baee1ec9ef63bdafcd5edc"
        />
        <Button variant="secondary" onClick={handleFetch} disabled={loading || !jobId.trim()}>
          {loading ? 'Loading...' : 'Get Hiring Pipeline'}
        </Button>
        {Array.isArray(data) && data.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-1">
            {data.map(entry => (
              <div key={entry.status} className="flex items-center gap-2 bg-slate-800/60 rounded-xl px-4 py-2.5">
                <Badge className={STATUS_COLORS[entry.status] || 'bg-slate-700 text-slate-300'}>
                  {STATUS_LABELS[entry.status] || entry.status}
                </Badge>
                <span className="text-white font-bold text-lg">{entry.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export default HiringPipeline

Only create this one file.
```

---

### PROMPT 4.4 — ApplicationsPanel

> **VERIFY:** File exists at `src/components/applications/ApplicationsPanel.jsx`

```
Create the file ~/job-board/job-board-dashboard/src/components/applications/ApplicationsPanel.jsx with exactly:

import ApplyForm from './ApplyForm'
import ApplicationStatus from './ApplicationStatus'
import HiringPipeline from './HiringPipeline'

function ApplicationsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ApplyForm />
      <ApplicationStatus />
      <HiringPipeline />
    </div>
  )
}

export default ApplicationsPanel

Only create this one file.
```

---

## PHASE 5 — Candidates Service Components

---

### PROMPT 5.1 — CreateCandidateForm

> **VERIFY:** File exists. No import errors.

```
Create the file ~/job-board/job-board-dashboard/src/components/candidates/CreateCandidateForm.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import { candidatesApi } from '../../services/api'

const EMPTY = { name: '', email: '', skills: '', experience_years: 0 }

function CreateCandidateForm() {
  const [form, setForm] = useState(EMPTY)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await candidatesApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience_years: Number(form.experience_years) || 0,
      })
      setData(result)
      setForm(EMPTY)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Create Profile" description="Create a new candidate profile in MongoDB.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Name" value={form.name} onChange={set('name')} placeholder="Sagar Patil" required />
        <Input label="Email" value={form.email} onChange={set('email')} type="email" placeholder="sagar@example.com" required />
        <Input label="Skills (comma-separated)" value={form.skills} onChange={set('skills')} placeholder="python, fastapi, docker" />
        <Input label="Experience (years)" value={form.experience_years} onChange={set('experience_years')} type="number" />
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Profile'}
        </Button>
      </form>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export default CreateCandidateForm

Only create this one file.
```

---

### PROMPT 5.2 — CandidateActions (Resume, Skills, Portfolio)

> **VERIFY:** File exists. Exports UpdateResume, UpdateSkills, UpdatePortfolio.

```
Create the file ~/job-board/job-board-dashboard/src/components/candidates/CandidateActions.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import { candidatesApi } from '../../services/api'

function useAction(apiFn) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async (...args) => {
    setLoading(true); setError(null); setData(null)
    try { setData(await apiFn(...args)) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return { data, error, loading, run }
}

export function UpdateResume() {
  const [candidateId, setCandidateId] = useState('')
  const [resumeUrl, setResumeUrl] = useState('')
  const { data, error, loading, run } = useAction(candidatesApi.updateResume)

  return (
    <Card title="Update Resume" description="Attach or replace resume URL for a candidate.">
      <div className="flex flex-col gap-4">
        <Input label="Candidate ID" value={candidateId} onChange={e => setCandidateId(e.target.value)} placeholder="MongoDB id" />
        <Input label="Resume URL" value={resumeUrl} onChange={e => setResumeUrl(e.target.value)} placeholder="https://example.com/resume.pdf" />
        <Button onClick={() => run(candidateId.trim(), resumeUrl.trim())} disabled={loading || !candidateId.trim() || !resumeUrl.trim()}>
          {loading ? 'Updating...' : 'Update Resume'}
        </Button>
      </div>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export function UpdateSkills() {
  const [candidateId, setCandidateId] = useState('')
  const [skills, setSkills] = useState('')
  const { data, error, loading, run } = useAction(candidatesApi.updateSkills)

  return (
    <Card title="Update Skills" description="Replace the full skill list for a candidate.">
      <div className="flex flex-col gap-4">
        <Input label="Candidate ID" value={candidateId} onChange={e => setCandidateId(e.target.value)} placeholder="MongoDB id" />
        <Input label="Skills (comma-separated)" value={skills} onChange={e => setSkills(e.target.value)} placeholder="react, typescript, node" />
        <Button variant="secondary" onClick={() => run(candidateId.trim(), skills.split(',').map(s => s.trim()).filter(Boolean))} disabled={loading || !candidateId.trim()}>
          {loading ? 'Updating...' : 'Update Skills'}
        </Button>
      </div>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export function UpdatePortfolio() {
  const [candidateId, setCandidateId] = useState('')
  const [links, setLinks] = useState('')
  const { data, error, loading, run } = useAction(candidatesApi.updatePortfolio)

  return (
    <Card title="Update Portfolio" description="Replace portfolio links for a candidate.">
      <div className="flex flex-col gap-4">
        <Input label="Candidate ID" value={candidateId} onChange={e => setCandidateId(e.target.value)} placeholder="MongoDB id" />
        <Input label="Portfolio Links (comma-separated)" value={links} onChange={e => setLinks(e.target.value)} placeholder="https://site1.dev, https://github.com/user" />
        <Button variant="secondary" onClick={() => run(candidateId.trim(), links.split(',').map(l => l.trim()).filter(Boolean))} disabled={loading || !candidateId.trim()}>
          {loading ? 'Updating...' : 'Update Portfolio'}
        </Button>
      </div>
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

Only create this one file.
```

---

### PROMPT 5.3 — MatchScore Component

> **VERIFY:** File exists. Score displays in green/yellow/red based on percentage.

```
Create the file ~/job-board/job-board-dashboard/src/components/candidates/MatchScore.jsx with exactly:

import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import ResponseBlock from '../ui/ResponseBlock'
import { candidatesApi } from '../../services/api'

function ScoreRing({ score }) {
  const color = score >= 75 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="flex items-center gap-3 bg-slate-800/60 rounded-xl px-4 py-3 mt-3">
      <span className="text-slate-400 text-sm">Match Score</span>
      <span className={`text-3xl font-bold tabular-nums ${color}`}>{score}%</span>
    </div>
  )
}

function MatchScore() {
  const [candidateId, setCandidateId] = useState('')
  const [jobId, setJobId] = useState('')
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleMatch = async () => {
    if (!candidateId.trim() || !jobId.trim()) return
    setLoading(true); setError(null); setData(null)
    try { setData(await candidatesApi.matchScore(candidateId.trim(), jobId.trim())) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <Card title="Match Score" description="Compare a candidate's skills against a job's required tags." className="lg:col-span-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Input label="Candidate ID (MongoDB)" value={candidateId} onChange={e => setCandidateId(e.target.value)} placeholder="69bafdabb759915a589db048" />
        <Input label="Job ID (MongoDB)" value={jobId} onChange={e => setJobId(e.target.value)} placeholder="69baee1ec9ef63bdafcd5edc" />
      </div>
      <Button onClick={handleMatch} disabled={loading || !candidateId.trim() || !jobId.trim()}>
        {loading ? 'Calculating...' : 'Get Match Score'}
      </Button>
      {data?.match_score !== undefined && <ScoreRing score={data.match_score} />}
      {data?.matched_skills?.length > 0 && (
        <p className="text-sm text-slate-400 mt-2">
          Matched skills: <span className="text-slate-200">{data.matched_skills.join(', ')}</span>
        </p>
      )}
      <ResponseBlock data={data} error={error} loading={loading} />
    </Card>
  )
}

export default MatchScore

Only create this one file.
```

---

### PROMPT 5.4 — CandidatesPanel

> **VERIFY:** File exists at `src/components/candidates/CandidatesPanel.jsx`

```
Create the file ~/job-board/job-board-dashboard/src/components/candidates/CandidatesPanel.jsx with exactly:

import CreateCandidateForm from './CreateCandidateForm'
import { UpdateResume, UpdateSkills, UpdatePortfolio } from './CandidateActions'
import MatchScore from './MatchScore'

function CandidatesPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <CreateCandidateForm />
      <UpdateResume />
      <UpdateSkills />
      <UpdatePortfolio />
      <MatchScore />
    </div>
  )
}

export default CandidatesPanel

Only create this one file.
```

---

## PHASE 6 — Wire Everything Together

---

### PROMPT 6.1 — Final App.jsx

> **YOU:** This is the final step — assembles all panels with tab switching state.
> **VERIFY:** All 3 tabs switch. All API calls return data. `npm run build` passes with no errors.

```
Replace the entire content of ~/job-board/job-board-dashboard/src/App.jsx with exactly:

import { useState } from 'react'
import TabBar from './components/ui/TabBar'
import JobsPanel from './components/jobs/JobsPanel'
import ApplicationsPanel from './components/applications/ApplicationsPanel'
import CandidatesPanel from './components/candidates/CandidatesPanel'
import { TABS } from './constants'

const SERVICE_BADGES = [
  { label: 'Jobs',         url: 'localhost:8002', color: 'bg-sky-500/20    text-sky-300    border-sky-500/30'    },
  { label: 'Applications', url: 'localhost:8001', color: 'bg-green-500/20  text-green-300  border-green-500/30'  },
  { label: 'Candidates',   url: 'localhost:3000', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
]

function App() {
  const [activeTab, setActiveTab] = useState(TABS.JOBS)

  const renderPanel = () => {
    switch (activeTab) {
      case TABS.JOBS:         return <JobsPanel />
      case TABS.APPLICATIONS: return <ApplicationsPanel />
      case TABS.CANDIDATES:   return <CandidatesPanel />
      default:                return null
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <header className="mb-8 p-7 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 shadow-2xl">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            Job Board Dashboard
          </h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            React operations dashboard. All actions call the live microservices directly via fetch.
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
            {SERVICE_BADGES.map(s => (
              <span key={s.label} className={`text-xs px-3 py-1.5 rounded-full border font-mono ${s.color}`}>
                {s.label} · {s.url}
              </span>
            ))}
          </div>
        </header>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <main>
          {renderPanel()}
        </main>

      </div>
    </div>
  )
}

export default App

Only modify this one file.
```

---

## PHASE 7 — Final Verification

### PROMPT 7.1 — Verify Build + Services

> **YOU:** Run in WSL terminal.

```
Run these from ~/job-board/job-board-dashboard/ in WSL:

# Check for any build errors (catches import mistakes before you deploy)
npm run build

# Start dev server if not running
npm run dev

# In a separate WSL terminal check all backend services are up
cd ~/job-board && docker compose ps
```

Expected:
- npm run build completes with no errors
- http://localhost:5173 shows the dashboard in Windows browser
- Jobs, Applications, Candidates tabs all switch panels
- Post Job → returns { id, message }
- List All Jobs → table renders with data
- Apply for Job → returns application with integer id
- Get Status with integer id → returns status object

Report any build errors or console errors.
```

---

## ⚠️ WSL + Windows Gotchas

| Issue | Fix |
|---|---|
| `localhost:5173` not loading in Windows browser | Try `127.0.0.1:5173` instead |
| Hot reload not working after file changes | Add to `vite.config.js`: `server: { watch: { usePolling: true } }` |
| Port 5173 already in use | Run `npm run dev -- --port 5174` |
| `EACCES` permission on npm install | Run from WSL terminal only — never from Windows terminal |
| Tailwind classes not applying | Check `tailwind.config.js` content array includes `./src/**/*.{js,ts,jsx,tsx}` |
| White screen, no error shown | Open browser DevTools → Console tab for the actual error |

---

## 📁 Final File Tree

```
job-board/
└── job-board-dashboard/
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── constants/
        │   └── index.js
        ├── services/
        │   └── api.js
        └── components/
            ├── ui/
            │   ├── Button.jsx
            │   ├── Input.jsx
            │   ├── Textarea.jsx
            │   ├── Card.jsx
            │   ├── Badge.jsx
            │   ├── ResponseBlock.jsx
            │   ├── DataTable.jsx
            │   └── TabBar.jsx
            ├── jobs/
            │   ├── PostJobForm.jsx
            │   ├── BrowseJobs.jsx
            │   ├── CloseJob.jsx
            │   └── JobsPanel.jsx
            ├── applications/
            │   ├── ApplyForm.jsx
            │   ├── ApplicationStatus.jsx
            │   ├── HiringPipeline.jsx
            │   └── ApplicationsPanel.jsx
            └── candidates/
                ├── CreateCandidateForm.jsx
                ├── CandidateActions.jsx
                ├── MatchScore.jsx
                └── CandidatesPanel.jsx
```

Total: 7 phases · 21 prompts · 20 components

---

*React Dashboard Prompt Guide — Job Board Platform*
*Stack: Vite + React 18 + Tailwind CSS v3 | WSL Ubuntu + Windows via Remote WSL*
