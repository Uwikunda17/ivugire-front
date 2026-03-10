import { Bell, MessageSquare, Search } from 'lucide-react'
import { useAuth } from '../state/AuthContext'
import { useNavigate } from 'react-router-dom'

export function TopBar({
  onNotificationOpen,
  unreadCount,
}: {
  onNotificationOpen?: () => void
  unreadCount?: number
}) {
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
          className="relative h-10 w-10 grid place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:border-slate-400 transition"
          aria-label="Notifications"
          onClick={onNotificationOpen}
        >
          <Bell size={18} />
          {unreadCount && unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
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
