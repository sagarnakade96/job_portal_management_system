import { useState } from 'react'
import Card from '../ui/Card'
import Input from '../ui/Input'
import Button from '../ui/Button'
import DataTable from '../ui/DataTable'
import { jobsApi } from '../../services/api'

function BrowseJobs() {
  const [rows, setRows] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const run = async (apiFn) => {
    setLoading(true)
    setError(null)
    setRows([])
    try {
      const result = await apiFn()
      setRows(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Browse Jobs" description="List, search, and view featured jobs." className="col-span-full">
      <div className="flex flex-wrap gap-3 items-end mb-5">
        <Button onClick={() => run(jobsApi.list)} disabled={loading}>
          List All Jobs
        </Button>
        <div className="flex gap-2 flex-1 min-w-[220px]">
          <Input
            placeholder="Search by title, location or tag"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="secondary"
            onClick={() => searchQuery.trim() && run(() => jobsApi.search(searchQuery.trim()))}
            disabled={loading}
          >
            Search
          </Button>
        </div>
        <Button variant="secondary" onClick={() => run(jobsApi.featured)} disabled={loading}>
          Featured Jobs
        </Button>
      </div>

      {loading && <p className="text-slate-400 text-sm mb-3">Loading...</p>}
      {error && <p className="text-red-300 text-sm mb-3">{error}</p>}
      <DataTable rows={rows} />
    </Card>
  )
}

export default BrowseJobs
