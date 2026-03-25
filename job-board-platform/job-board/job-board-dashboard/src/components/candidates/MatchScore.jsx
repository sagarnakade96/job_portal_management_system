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
