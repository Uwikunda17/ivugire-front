import { Search } from 'lucide-react'

export default function Explore() {
  return (
    <section className="workspace-page space-y-4">
      <div className="workspace-panel">
        <h2 className="workspace-title">Explore</h2>
        <p className="workspace-muted text-sm">Discover people, companies, hashtags, and trending media.</p>
      </div>
      <div className="workspace-panel">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              className="w-full bg-white border border-slate-300 rounded-xl py-3 pl-10 pr-3 text-sm text-slate-700 focus:border-slate-500 focus:outline-none"
              placeholder="Search people, companies, hashtags"
            />
          </div>
          <button className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-700">
            Filters
          </button>
        </div>
      </div>
      <div className="workspace-panel workspace-muted">
        Explore feed will populate as users and companies post content.
      </div>
    </section>
  )
}
