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
