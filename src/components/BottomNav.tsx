import { Home, MessageCircle, Plus, UserRound, Video } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/create', label: 'Create', icon: Plus },
  { to: '/reels', label: 'Reels', icon: Video },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[#e8efed]/95 backdrop-blur-xl border-t border-slate-200 grid grid-cols-5">
      {items.map(({ to, label, icon: Icon }) => {
        const active = pathname === to
        return (
          <NavLink
            key={to}
            to={to}
            className="flex flex-col items-center justify-center gap-1 text-xs"
          >
            <Icon size={22} className={clsx(active ? 'text-slate-900 drop-shadow' : 'text-slate-500', 'transition')} />
            <span className={active ? 'text-slate-900 font-medium' : 'text-slate-500'}>{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav
