import CreateCandidateForm from './CreateCandidateForm'
import { UpdateResume, UpdateSkills, UpdatePortfolio } from './CandidateActions'
import MatchScore from './MatchScore'

function CandidatesPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <CreateCandidateForm />
      <UpdateResume />
      <UpdateSkills />
      <UpdatePortfolio />
      <MatchScore />
    </div>
  )
}

export default CandidatesPanel
