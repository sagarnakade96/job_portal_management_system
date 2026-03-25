import PostJobForm from './PostJobForm'
import BrowseJobs from './BrowseJobs'
import CloseJob from './CloseJob'

function JobsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <PostJobForm />
      <CloseJob />
      <BrowseJobs />
    </div>
  )
}

export default JobsPanel
