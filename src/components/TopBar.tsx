import { Bell, MessageSquare, Search } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useNavigate } from 'react-router-dom'

export function TopBar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-[#e8efed]/95 px-4 py-3 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-black text-white grid place-items-center font-bold">
          IV
        </div>
        <div>
          <div className="font-heading text-lg text-slate-900">Ivugire</div>
          <div className="text-xs text-slate-500">{user ? user.email : 'Welcome'}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="h-10 w-10 grid place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-400 transition"
          aria-label="Search"
          onClick={() => navigate('/explore')}
        >
          <Search size={18} />
        </button>
        <button
          type="button"
          className="h-10 w-10 grid place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-400 transition"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>
        <button
          type="button"
          className="h-10 w-10 grid place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-400 transition"
          aria-label="Messages"
          onClick={() => navigate('/chat')}
        >
          <MessageSquare size={18} />
        </button>
      </div>
    </header>
  )
}

export default TopBar
