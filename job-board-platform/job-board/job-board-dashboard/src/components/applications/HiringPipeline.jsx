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
