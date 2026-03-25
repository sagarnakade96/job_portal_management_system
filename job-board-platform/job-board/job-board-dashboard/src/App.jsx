import { useState } from 'react'
import TabBar from './components/ui/TabBar'
import JobsPanel from './components/jobs/JobsPanel'
import ApplicationsPanel from './components/applications/ApplicationsPanel'
import CandidatesPanel from './components/candidates/CandidatesPanel'
import { TABS } from './constants'

const SERVICE_BADGES = [
  { label: 'Jobs',         url: 'localhost:8002', color: 'bg-sky-500/20    text-sky-300    border-sky-500/30'    },
  { label: 'Applications', url: 'localhost:8001', color: 'bg-green-500/20  text-green-300  border-green-500/30'  },
  { label: 'Candidates',   url: 'localhost:3000', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
]

function App() {
  const [activeTab, setActiveTab] = useState(TABS.JOBS)

  const renderPanel = () => {
    switch (activeTab) {
      case TABS.JOBS:         return <JobsPanel />
      case TABS.APPLICATIONS: return <ApplicationsPanel />
      case TABS.CANDIDATES:   return <CandidatesPanel />
      default:                return null
    }
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-8">

        <header className="mb-8 p-7 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-900/60 shadow-2xl">
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            Job Board Dashboard
          </h1>
          <p className="text-slate-400 max-w-2xl leading-relaxed">
            React operations dashboard. All actions call the live microservices directly via fetch.
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
            {SERVICE_BADGES.map(s => (
              <span key={s.label} className={`text-xs px-3 py-1.5 rounded-full border font-mono ${s.color}`}>
                {s.label} · {s.url}
              </span>
            ))}
          </div>
        </header>

        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

        <main>
          {renderPanel()}
        </main>

      </div>
    </div>
  )
}

export default App
