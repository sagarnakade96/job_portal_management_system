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
