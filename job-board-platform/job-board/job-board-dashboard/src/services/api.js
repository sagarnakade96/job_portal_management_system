const BASE = {
  jobs:         import.meta.env.VITE_JOBS_URL         || 'http://localhost:8002',
  candidates:   import.meta.env.VITE_CANDIDATES_URL   || 'http://localhost:3000',
  applications: import.meta.env.VITE_APPLICATIONS_URL || 'http://localhost:8001',
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
