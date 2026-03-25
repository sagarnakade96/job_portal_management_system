import { TABS, TAB_LABELS } from '../../constants'

function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="flex gap-3 flex-wrap mb-6">
      {Object.values(TABS).map(tab => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`
            px-5 py-2.5 rounded-full text-sm font-semibold
            border transition-all duration-200 cursor-pointer
            ${activeTab === tab
              ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
              : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200'
            }
          `}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </nav>
  )
}

export default TabBar
