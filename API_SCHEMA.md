# Job Board Platform API & Schema Documentation

## 1. Applications Service

### Schemas

- **ApplicationCreate**
  - `job_id`: string
  - `candidate_id`: string
  - `notes`: string | null

- **ApplicationResponse**
  - `id`: int
  - `job_id`: string
  - `candidate_id`: string
  - `status`: string
  - `applied_at`: datetime
  - `notes`: string | null

- **PipelineEntry**
  - `status`: string
  - `count`: int

### APIs

| Endpoint                              | Method | Request Body           | Response (Status)         | Response Schema         |
|----------------------------------------|--------|------------------------|---------------------------|------------------------|
| /applications/apply                    | POST   | ApplicationCreate      | 201 Created               | ApplicationResponse    |
| /applications/{id}/status              | GET    | -                      | 200 OK / 404 Not Found    | ApplicationResponse    |
| /applications/{id}/shortlist           | PATCH  | -                      | 200 OK / 404 Not Found    | ApplicationResponse    |
| /applications/{id}/reject              | PATCH  | -                      | 200 OK / 404 Not Found    | ApplicationResponse    |
| /applications/pipeline/{job_id}        | GET    | -                      | 200 OK                    | List<PipelineEntry>    |

---

## 2. Candidates Service

### Schema

- **Candidate**
  - `name`: string
  - `email`: string
  - `skills`: [string]
  - `resume_url`: string | null
  - `portfolio_links`: [string]
  - `experience_years`: number
  - `created_at`: date
  - `updated_at`: date

### APIs

| Endpoint                              | Method | Request Body           | Response (Status)         | Response Schema         |
|----------------------------------------|--------|------------------------|---------------------------|------------------------|
| /candidates/                           | POST   | Candidate              | 201 Created / 400 Error   | { id, message } or { error } |
| /candidates/:id/resume                 | PUT    | { resume_url }         | 200 OK / 404/400 Error    | { message, resume_url } or { error } |
| /candidates/:id/skills                 | PUT    | { skills }             | 200 OK / 404/400 Error    | { message, skills } or { error } |
| /candidates/:id/portfolio              | PUT    | { portfolio_links }    | 200 OK / 404/400 Error    | { message, links } or { error } |
| /candidates/:id/match/:job_id          | GET    | -                      | 200 OK / 404 Error        | { match_score, ... } or { error } |

---

## 3. Jobs Service

### Schemas

- **JobCreate**
  - `title`: string
  - `company`: string
  - `location`: string
  - `description`: string
  - `salary_range`: string | null
  - `tags`: [string]
  - `is_featured`: bool
  - `expires_at`: datetime | null

- **JobResponse**
  - `id`: string
  - `title`: string
  - `company`: string
  - `location`: string
  - `description`: string
  - `salary_range`: string | null
  - `tags`: [string]
  - `is_featured`: bool
  - `is_closed`: bool
  - `posted_at`: datetime

### APIs

| Endpoint                              | Method | Request Body           | Response (Status)         | Response Schema         |
|----------------------------------------|--------|------------------------|---------------------------|------------------------|
| /jobs                                 | POST   | JobCreate              | 201 Created               | { id, message }        |
| /jobs                                 | GET    | -                      | 200 OK                    | List<JobSummary>       |
| /jobs/search                          | GET    | q (query param)        | 200 OK                    | List<JobSummary>       |
| /jobs/{job_id}/close                  | PATCH  | -                      | 200 OK / 404 Not Found    | { message }            |
| /jobs/featured                        | GET    | -                      | 200 OK                    | List<JobSummary>       |

- **JobSummary** (used in lists/search/featured):
  - `id`: string
  - `title`: string
  - `company`: string
  - `location`: string
  - `tags`: [string]
  - `is_featured`: bool

---

All response schemas are strictly typed and validated using Pydantic (Python) or Mongoose (Node.js). Error responses are always in the form `{ error: string }` with appropriate HTTP status codes.

If you need example payloads or want to test specific endpoints, see the service code or request further details.
