import { Home, Menu, MessageCircle, Plus, UserRound, Video, X, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

const items = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/create', label: 'Create', icon: Plus },
  { to: '/reels', label: 'Reels', icon: Video },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavClick = () => {
    // Close menu on small screens after navigation
    if (window.innerWidth < 768) {
      setIsMenuOpen(false)
    }
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <>
      <style>{styles}</style>
      {/* Menu toggle button for small screens */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="bn-menu-toggle"
        aria-label="Toggle navigation menu"
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`bn-nav ${isMenuOpen ? 'bn-nav-open' : ''}`}>
        <div className="bn-track">
          {/* Back button for small screens */}
          <button
            onClick={handleBack}
            className="bn-back-btn"
            aria-label="Go back"
          >
            <ArrowLeft size={20} />
          </button>

          {items.map(({ to, label, icon: Icon }) => {
            const active = pathname === to
            const isCreate = to === '/create'
            return (
              <NavLink
                key={to}
                to={to}
                onClick={handleNavClick}
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

  /* Back button */
  .bn-back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    transition: color 0.2s, background 0.2s;
    -webkit-tap-highlight-color: transparent;
  }

  .bn-back-btn:active {
    color: rgba(255,255,255,0.8);
    background: rgba(124,58,237,0.15);
  }

  @media (hover: hover) {
    .bn-back-btn:hover {
      color: rgba(255,255,255,0.8);
      background: rgba(124,58,237,0.1);
    }
  }

  /* Menu toggle button */
  .bn-menu-toggle {
    display: none;
    position: fixed;
    top: 16px;
    left: 16px;
    z-index: 60;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    cursor: pointer;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(124,58,237,0.45);
  }

  .bn-menu-toggle:active {
    transform: scale(0.93);
  }

  /* Navigation */
  .bn-nav {
    position: fixed;
    z-index: 50;
    padding: 0;
    background: none;
    pointer-events: none;
  }

  .bn-track {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(14, 14, 18, 0.85);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255,255,255,0.07);
    padding: 20px 12px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03);
    overflow-y: auto;
  }

  .bn-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 6px;
    text-decoration: none;
    transition: opacity 0.18s;
    -webkit-tap-highlight-color: transparent;
  }

  .bn-icon-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px; 
    height: 40px;
    border-radius: 8px;
    color: rgba(255,255,255,0.32);
    transition: color 0.2s, background 0.2s;
  }

  .bn-active .bn-icon-wrap {
    color: #f0eee8;
    background: rgba(124,58,237,0.15);
  }

  /* Active indicator pip */
  .bn-pip {
    position: absolute;
    width: 2px; 
    height: 12px;
    border-radius: 2px;
    background: linear-gradient(180deg, #7c3aed, #2dd4bf);
    box-shadow: 0 0 8px rgba(124,58,237,0.6);
  }

  .bn-label {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 400;
    color: rgba(255,255,255,0.28);
    letter-spacing: 0.2px;
    transition: color 0.2s;
    text-align: center;
  }

  .bn-active .bn-label {
    color: rgba(255,255,255,0.75);
    font-weight: 500;
  }

  /* Create button */
  .bn-create {
    padding: 2px;
  }

  .bn-create-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px; 
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    color: #fff;
    border: none;
    cursor: pointer;
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
      transform: scale(1.04);
      box-shadow: 0 6px 22px rgba(124,58,237,0.55);
    }
  }

  /* Small screens: bottom navigation bar */
  @media (max-width: 767px) {
    .bn-nav {
      bottom: 0;
      left: 0;
      right: 0;
      width: 100%;
      height: auto;
    }

    .bn-track {
      flex-direction: row;
      justify-content: center;
      width: 100%;
      height: auto;
      border-radius: 16px 16px 0 0;
      padding: 6px 3px;
      margin: 0;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.03),
        0 -4px 32px rgba(0,0,0,0.5);
    }

    .bn-item {
      flex-direction: column;
    }

    .bn-pip {
      top: -8px;
      left: 50%;
      transform: translateX(-50%);
    }

    .bn-back-btn {
      display: none;
    }

    .bn-menu-toggle {
      display: none !important;
    }
  }

  /* Large screens: left sidebar */
  @media (min-width: 768px) {
    .bn-nav {
      left: 0;
      top: 0;
      width: 100%;
      height: 100vh;
    }

    .bn-track {
      flex-direction: column;
      justify-content: flex-start;
      height: 100vh;
      width: auto;
      min-width: 100px;
      max-width: 120px;
      border-radius: 0 16px 16px 0;
      padding: 20px 12px;
      margin: 0;
      box-shadow:
        0 0 0 1px rgba(255,255,255,0.03),
        4px 0 32px rgba(0,0,0,0.5);
    }

    .bn-item {
      flex-direction: column;
      width: 100%;
    }

    .bn-pip {
      left: -8px;
      top: 50%;
      transform: translateY(-50%);
    }

    .bn-back-btn {
      display: flex;
    }

    .bn-menu-toggle {
      display: none !important;
    }
  }
`