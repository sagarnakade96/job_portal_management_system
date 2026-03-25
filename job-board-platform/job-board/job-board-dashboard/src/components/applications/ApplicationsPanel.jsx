import ApplyForm from './ApplyForm'
import ApplicationStatus from './ApplicationStatus'
import HiringPipeline from './HiringPipeline'

function ApplicationsPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ApplyForm />
      <ApplicationStatus />
      <HiringPipeline />
    </div>
  )
}

export default ApplicationsPanel
