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
