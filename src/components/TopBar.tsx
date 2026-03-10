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
    <>
      <style>{styles}</style>
      <header className="tb-bar">
        <div className="tb-noise" />

        {/* Brand */}
        <div className="tb-brand">
          <div className="tb-logo">
            <span>IV</span>
            <div className="tb-logo-glow" />
          </div>
          <div className="tb-brand-text">
            <span className="tb-app-name">Ivugire</span>
            <span className="tb-user-email">{user ? user.email : 'Welcome'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="tb-actions">
          <button className="tb-btn" aria-label="Search" onClick={() => navigate('/explore')}>
            <Search size={17} />
          </button>

          <button className="tb-btn" aria-label="Messages" onClick={() => navigate('/chat')}>
            <MessageSquare size={17} />
          </button>

          <button className="tb-btn tb-btn-notif" aria-label="Notifications" onClick={onNotificationOpen}>
            <Bell size={17} />
            {unreadCount && unreadCount > 0 ? (
              <span className="tb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            ) : null}
          </button>
        </div>
      </header>
    </>
  )
}

export default TopBar

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .tb-bar {
    position: sticky;
    top: 0; z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: rgba(14,14,18,0.82);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255,255,255,0.07);
    box-shadow: 0 1px 24px rgba(0,0,0,0.4);
    overflow: hidden;
  }

  /* Subtle noise texture */
  .tb-noise {
    position: absolute; inset: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
    background-size: 120px; opacity: 0.35;
  }

  /* Brand */
  .tb-brand {
    display: flex; align-items: center; gap: 11px;
    position: relative; z-index: 2;
  }
  .tb-logo {
    position: relative;
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 12px rgba(124,58,237,0.35);
    overflow: hidden;
  }
  .tb-logo span {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 12px;
    color: #fff; letter-spacing: 0.5px;
    position: relative; z-index: 2;
  }
  .tb-logo-glow {
    position: absolute; inset: -4px;
    background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.25), transparent 60%);
  }

  .tb-brand-text {
    display: flex; flex-direction: column; gap: 1px;
  }
  .tb-app-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 16px;
    color: #f5f3ee; letter-spacing: -0.3px;
    line-height: 1.2;
  }
  .tb-user-email {
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 300;
    color: rgba(255,255,255,0.32);
    letter-spacing: 0.1px;
    max-width: 160px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* Action buttons */
  .tb-actions {
    display: flex; align-items: center; gap: 6px;
    position: relative; z-index: 2;
  }
  .tb-btn {
    position: relative;
    width: 38px; height: 38px;
    border-radius: 11px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.5);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, border-color 0.18s, transform 0.15s;
    -webkit-tap-highlight-color: transparent;
  }
  .tb-btn:hover {
    background: rgba(124,58,237,0.15);
    border-color: rgba(124,58,237,0.3);
    color: #c4b5fd;
    transform: translateY(-1px);
  }
  .tb-btn:active { transform: scale(0.93); }

  /* Notification badge */
  .tb-badge {
    position: absolute;
    top: -4px; right: -4px;
    min-width: 17px; height: 17px;
    border-radius: 9px;
    padding: 0 4px;
    background: #f87171;
    border: 2px solid #0e0e12;
    font-family: 'DM Sans', sans-serif;
    font-size: 9.5px; font-weight: 700;
    color: #fff;
    display: flex; align-items: center; justify-content: center;
    line-height: 1;
    box-shadow: 0 0 8px rgba(248,113,113,0.5);
  }
`