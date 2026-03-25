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
