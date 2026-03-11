import { Home, MessageCircle, Plus, UserRound, Video, Bell } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

type BottomNavProps = {
  unreadNotifications?: number
  unreadChat?: number
}

const items = (unreadChat?: number, unreadNotifications?: number) => [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageCircle, badge: unreadChat },
  { to: '/create', label: 'Create', icon: Plus, isCreate: true },
  { to: '/reels', label: 'Reels', icon: Video },
  { to: '/notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav({ unreadNotifications = 0, unreadChat = 0 }: BottomNavProps) {
  const { pathname } = useLocation()
  const navItems = items(unreadChat, unreadNotifications)

  return (
    <>
      <style>{styles}</style>
      <nav className="bn-rail">
        {navItems.map(({ to, icon: Icon, badge, isCreate }) => {
          const active = pathname === to
          return (
            <NavLink key={to} to={to} className={`bn-rail-btn ${active ? 'bn-rail-btn-active' : ''}`}>
              <Icon size={18} />
              {badge && badge > 0 ? <span className="bn-rail-badge">{badge > 99 ? '99+' : badge}</span> : null}
              {active ? <span className="bn-rail-dot" /> : null}
              {isCreate ? <span className="bn-rail-plus" /> : null}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}

export default BottomNav

const styles = `
  .bn-rail {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 64px;
    background: #fff;
    border-right: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 0;
    gap: 14px;
    z-index: 45;
  }

  .bn-rail-btn {
    position: relative;
    width: 42px;
    height: 42px;
    border-radius: 14px;
    border: 0;
    background: transparent;
    color: #0f172a;
    display: grid;
    place-items: center;
    transition: transform 120ms ease, background 120ms ease, color 120ms ease;
    -webkit-tap-highlight-color: transparent;
  }

  .bn-rail-btn:hover {
    transform: translateY(-2px);
    background: #f8fafc;
  }

  .bn-rail-btn-active {
    background: #111827;
    color: #fff;
  }

  .bn-rail-badge {
    position: absolute;
    top: -6px;
    right: -6px;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    border-radius: 999px;
    background: #ff3b5f;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: grid;
    place-items: center;
    box-shadow: 0 6px 12px rgba(255, 59, 95, 0.35);
  }

  .bn-rail-dot {
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, #ff3b5f, #ff8da1);
    box-shadow: 0 0 10px rgba(255, 59, 95, 0.4);
  }

  .bn-rail-plus {
    position: absolute;
    bottom: -6px;
    right: -6px;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: #ff9bd7;
    box-shadow: 0 4px 8px rgba(255, 155, 215, 0.3);
  }

  @media (max-width: 767px) {
    .bn-rail {
      flex-direction: row;
      width: 100%;
      height: 64px;
      bottom: 0;
      top: auto;
      border-right: 0;
      border-top: 1px solid #e2e8f0;
      padding: 0 12px;
      justify-content: space-around;
    }

    .bn-rail-dot {
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      width: 4px;
      height: 8px;
    }
  }
`
