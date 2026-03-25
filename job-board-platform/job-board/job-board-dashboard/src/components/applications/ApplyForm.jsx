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
