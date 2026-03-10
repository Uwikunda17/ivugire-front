import { Home, MessageCircle, Plus, UserRound, Video } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

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
    <>
      <style>{styles}</style>
      <nav className="bn-nav">
        <div className="bn-track">
          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            const isCreate = to === '/create'
            return (
              <NavLink
                key={to}
                to={to}
                className={`bn-item ${active ? 'bn-active' : ''} ${isCreate ? 'bn-create' : ''}`}
              >
                {isCreate ? (
                  <span className="bn-create-btn">
                    <Icon size={20} />
                  </span>
                ) : (
                  <>
                    <span className="bn-icon-wrap">
                      {active && <span className="bn-pip" />}
                      <Icon size={20} />
                    </span>
                    <span className="bn-label">{label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}

export default BottomNav

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

  .bn-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 50;
    padding: 0 12px env(safe-area-inset-bottom, 12px);
    background: linear-gradient(to top, #090910 60%, transparent);
    pointer-events: none;
  }

  .bn-track {
    pointer-events: auto;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    align-items: center;
    background: rgba(14, 14, 18, 0.85);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 8px 4px;
    margin-bottom: 12px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03),
      0 -4px 32px rgba(0,0,0,0.5),
      0 8px 32px rgba(0,0,0,0.6);
  }

  .bn-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 4px;
    text-decoration: none;
    transition: opacity 0.18s;
    -webkit-tap-highlight-color: transparent;
  }

  .bn-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px; height: 36px;
    border-radius: 10px;
    color: rgba(255,255,255,0.32);
    transition: color 0.2s, background 0.2s;
  }
  .bn-active .bn-icon-wrap {
    color: #f0eee8;
    background: rgba(124,58,237,0.15);
  }

  /* Active indicator pip above icon */
  .bn-pip {
    position: absolute;
    top: -10px;
    left: 50%; transform: translateX(-50%);
    width: 16px; height: 3px;
    border-radius: 0 0 3px 3px;
    background: linear-gradient(90deg, #7c3aed, #2dd4bf);
    box-shadow: 0 0 8px rgba(124,58,237,0.6);
  }

  .bn-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10.5px;
    font-weight: 400;
    color: rgba(255,255,255,0.28);
    letter-spacing: 0.2px;
    transition: color 0.2s;
  }
  .bn-active .bn-label {
    color: rgba(255,255,255,0.75);
    font-weight: 500;
  }

  /* Create button — center pill */
  .bn-create {
    padding: 4px;
  }
  .bn-create-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 46px; height: 46px;
    border-radius: 14px;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    color: #fff;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.1),
      0 4px 16px rgba(124,58,237,0.45);
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .bn-create:active .bn-create-btn {
    transform: scale(0.93);
    box-shadow: 0 2px 8px rgba(124,58,237,0.3);
  }
  @media (hover: hover) {
    .bn-create:hover .bn-create-btn {
      transform: translateY(-2px) scale(1.04);
      box-shadow: 0 6px 22px rgba(124,58,237,0.55);
    }
  }
`