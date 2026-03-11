import { Home, MessageCircle, Plus, UserRound, Video, Bell } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

type BottomNavProps = {
  unreadNotifications?: number
  unreadChat?: number
  onNotificationsOpen?: () => void
}

const items = (
  unreadChat?: number,
  unreadNotifications?: number,
  onNotificationsOpen?: () => void,
) => [
  { id: 'home', to: '/', label: 'Home', icon: Home },
  { id: 'chat', to: '/chat', label: 'Chat', icon: MessageCircle, badge: unreadChat },
  { id: 'create', to: '/create', label: 'Create', icon: Plus, isCreate: true },
  { id: 'reels', to: '/reels', label: 'Reels', icon: Video },
  // Notifications opens the panel instead of navigating to /notifications (which collides with /:username route)
  { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications, onClick: onNotificationsOpen },
  { id: 'profile', to: '/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav({
  unreadNotifications = 0,
  unreadChat = 0,
  onNotificationsOpen,
}: BottomNavProps) {
  const { pathname } = useLocation()
  const navItems = items(unreadChat, unreadNotifications, onNotificationsOpen)

  return (
    <>
      <style>{styles}</style>
      <nav className="bn-rail">
        {navItems.map(({ id, to, icon: Icon, label, badge, isCreate, onClick }) => {
          const active = pathname === to
          const content = (
            <>
              <Icon size={18} />
              <span className="bn-rail-label">{label}</span>
              {badge && badge > 0 ? <span className="bn-rail-badge">{badge > 99 ? '99+' : badge}</span> : null}
              {active ? <span className="bn-rail-dot" /> : null}
              {isCreate ? <span className="bn-rail-plus" /> : null}
            </>
          )

          if (onClick && !to) {
            return (
              <button
                key={id}
                type="button"
                className="bn-rail-btn"
                onClick={(event) => {
                  event.preventDefault()
                  onClick()
                }}
              >
                {content}
              </button>
            )
          }

          return (
            <NavLink key={id} to={to!} className={`bn-rail-btn ${active ? 'bn-rail-btn-active' : ''}`}>
              {content}
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

  /* Tooltip label */
  .bn-rail-label {
    position: absolute;
    left: calc(100% + 14px);
    top: 50%;
    transform: translateY(-50%) translateX(-6px);
    background: #111827;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    padding: 5px 10px;
    border-radius: 8px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 150ms ease, transform 150ms ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  /* Arrow pointing left toward the icon */
  .bn-rail-label::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: #111827;
  }

  .bn-rail-btn:hover .bn-rail-label {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
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

    /* On mobile, show label above the icon */
    .bn-rail-label {
      left: 50%;
      top: auto;
      bottom: calc(100% + 10px);
      transform: translateX(-50%) translateY(4px);
    }

    .bn-rail-label::before {
      right: auto;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border-right-color: transparent;
      border-top-color: #111827;
    }

    .bn-rail-btn:hover .bn-rail-label {
      transform: translateX(-50%) translateY(0);
    }
  }
`
