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
