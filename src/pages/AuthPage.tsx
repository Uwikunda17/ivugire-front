import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function AuthPage() {
  const { login, register, token, loading } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [emailOrUsername, setEmailOrUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (token) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    try {
      if (mode === 'login') {
        await login(emailOrUsername, password)
      } else {
        await register(name, emailOrUsername, password)
      }
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .auth-root {
          min-height: 100vh;
          display: flex;
          font-family: 'DM Sans', sans-serif;
          background: radial-gradient(circle at 20% 20%, rgba(0,212,255,0.08) 0%, transparent 32%),
            radial-gradient(circle at 80% 0%, rgba(255,179,71,0.10) 0%, transparent 40%),
            linear-gradient(135deg, #d9e5e3 0%, #cddbd7 50%, #dbe7e5 100%);
          color: #0f172a;
        }

        /* -- LEFT BRAND PANEL -- */
        .auth-brand {
          flex: 1;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, #0d0f14 0%, #101724 40%, #0d0f14 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          color: #f7f9f8;
        }
        @media (min-width: 900px) { .auth-brand { display: flex; } }

        .auth-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(0,212,255,0.28) 0%, transparent 60%),
            radial-gradient(ellipse 60% 70% at 80% 80%, rgba(255,179,71,0.25) 0%, transparent 55%),
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(14,110,80,0.35) 0%, transparent 70%);
          z-index: 0;
        }

        .auth-brand::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          z-index: 1;
          pointer-events: none;
          opacity: 0.35;
        }

        .auth-brand__content { position: relative; z-index: 2; display: flex; flex-direction: column; justify-content: space-between; height: 100%; }

        .auth-brand__logo { display: flex; align-items: center; gap: 12px; }
        .auth-brand__logo-mark {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #00d4ff, #ffb347);
          display: grid;
          place-items: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 600;
          color: #0d0f14;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 20px rgba(0,212,255,0.35);
        }
        .auth-brand__logo-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 400;
          color: rgba(247,249,248,0.92);
          letter-spacing: 0.06em;
        }

        .auth-brand__headline { flex: 1; display: flex; align-items: center; }
        .auth-brand__headline-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 5vw, 68px);
          font-weight: 300;
          line-height: 1.1;
          color: rgba(247,249,248,0.96);
          letter-spacing: -0.01em;
        }
        .auth-brand__headline-text em { font-style: italic; color: #00d4ff; }
        .auth-brand__headline-text strong { font-weight: 600; display: block; }

        .auth-brand__footer { display: flex; align-items: center; justify-content: space-between; }
        .auth-brand__tagline {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 300;
        }
        .auth-brand__dots { display: flex; gap: 6px; }
        .auth-brand__dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); }
        .auth-brand__dot:first-child { background: #00d4ff; box-shadow: 0 0 8px rgba(0,212,255,0.6); }

        .auth-brand__line {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(0,212,255,0.15) 40%, rgba(255,179,71,0.1) 70%, transparent);
          z-index: 2;
        }

        /* -- RIGHT FORM PANEL -- */
        .auth-form-panel {
          width: 100%;
          max-width: 480px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 56px 44px;
          background: #fdfdfc;
          position: relative;
          border-left: 1px solid #e1e8e5;
        }
        @media (max-width: 899px) { .auth-form-panel { max-width: 100%; } }

        .auth-form-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(180px 180px at 85% 5%, rgba(0,212,255,0.12), transparent 60%),
            radial-gradient(200px 200px at 5% 15%, rgba(255,179,71,0.10), transparent 55%);
          pointer-events: none;
          z-index: 0;
        }

        .auth-mobile-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
        @media (min-width: 900px) { .auth-mobile-logo { display: none; } }
        .auth-mobile-logo__mark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: linear-gradient(135deg, #00d4ff, #ffb347);
          display: grid;
          place-items: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 16px;
          font-weight: 600;
          color: #0d0f14;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 18px rgba(0,212,255,0.25);
        }
        .auth-mobile-logo__name { color: #0f172a; font-weight: 600; letter-spacing: 0.03em; }

        .auth-form-header { position: relative; z-index: 1; display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
        .auth-form-header__greeting { color: #0f172a; font-weight: 500; font-size: 13px; letter-spacing: 0.03em; text-transform: uppercase; }
        .auth-form-header__greeting::before { content: '-'; margin-right: 6px; color: #00d4ff; }
        .auth-form-header__title { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 3vw, 36px); color: #0d0f14; font-weight: 600; line-height: 1.15; }
        .auth-form-header__title em { font-style: italic; color: #00b8e6; }

        .auth-form { position: relative; display: flex; flex-direction: column; gap: 14px; width: 100%; }

        .auth-field { display: flex; flex-direction: column; gap: 6px; }
        .auth-field__label { color: #0f172a; font-size: 13px; letter-spacing: 0.01em; }
        .auth-field__input {
          width: 100%;
          background: #f6f8f7;
          border: 1px solid #d8e1de;
          color: #0f172a;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(15,23,42,0.05);
        }
        .auth-field__input::placeholder { color: #94a3b8; }
        .auth-field__input:focus { border-color: #00d4ff; box-shadow: 0 0 0 4px rgba(0,212,255,0.18); background: #fff; }

        .auth-error {
          position: relative;
          background: rgba(248,113,113,0.12);
          border: 1px solid rgba(248,113,113,0.35);
          color: #b91c1c;
          border-radius: 12px;
          padding: 12px 12px 12px 36px;
          font-size: 13px;
        }
        .auth-error::before {
          content: '!';
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(248,113,113,0.8);
          color: #fff;
          font-weight: 700;
          font-size: 12px;
        }

        .auth-submit {
          position: relative;
          z-index: 1;
          width: 100%;
          padding: 13px 14px;
          border-radius: 14px;
          border: 1px solid #cde3de;
          background: linear-gradient(135deg, #00d4ff, #ffb347);
          color: #0d0f14;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .auth-submit:hover:not(:disabled) { filter: brightness(1.03); transform: translateY(-1px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); }
        .auth-submit:active:not(:disabled) { transform: translateY(0); }
        .auth-submit:disabled { cursor: not-allowed; opacity: 0.65; }
        .auth-submit::after {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(180px 180px at 80% 0%, rgba(255,255,255,0.35), transparent 60%);
          opacity: 0.9;
          z-index: -1;
          pointer-events: none;
        }

        .auth-switch { margin-top: 12px; text-align: center; color: #0f172a; font-size: 13px; letter-spacing: 0.01em; }
        .auth-switch__btn { color: #00a6d1; font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; transition: color 0.15s; }
        .auth-switch__btn:hover { color: #008bb0; }

        .auth-mode-bar {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: rgba(255,255,255,0.85);
          border: 1px solid #d6e2df;
          border-radius: 18px;
          padding: 5px;
          gap: 6px;
          box-shadow: 0 8px 20px rgba(15,23,42,0.06);
          position: relative;
          margin-bottom: 26px;
        }
        .auth-mode-tab {
          position: relative;
          background: transparent;
          color: #0f172a;
          border: 0;
          border-radius: 12px;
          padding: 11px 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .auth-mode-tab:hover { background: rgba(0,0,0,0.035); }
        .auth-mode-tab.active {
          background: linear-gradient(135deg, #00d4ff, #ffb347);
          color: #0d0f14;
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          border: 1px solid rgba(255,255,255,0.35);
        }
      `}</style>

      <div className="auth-root">
        {/* ── Brand panel (desktop only) ── */}
        <div className="auth-brand">
          <div className="auth-brand__content">
            <div className="auth-brand__logo">
              <div className="auth-brand__logo-mark">IV</div>
              <span className="auth-brand__logo-name">Ivugire</span>
            </div>

            <div className="auth-brand__headline">
              <h1 className="auth-brand__headline-text">
                <em>Share</em> what<br />
                <strong>moves you.</strong>
              </h1>
            </div>

            <div className="auth-brand__footer">
              <span className="auth-brand__tagline">Stories worth telling</span>
              <div className="auth-brand__dots">
                <div className="auth-brand__dot" />
                <div className="auth-brand__dot" />
                <div className="auth-brand__dot" />
              </div>
            </div>
          </div>
          <div className="auth-brand__line" />
        </div>

        {/* ── Form panel ── */}
        <div className="auth-form-panel">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="auth-mobile-logo__mark">IV</div>
            <span className="auth-mobile-logo__name">Ivugire</span>
          </div>

          {/* Mode switcher tabs */}
          <div className="auth-mode-bar">
            <button
              type="button"
              className={`auth-mode-tab${mode === 'login' ? ' active' : ''}`}
              onClick={() => { setMode('login'); setError(null) }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-mode-tab${mode === 'register' ? ' active' : ''}`}
              onClick={() => { setMode('register'); setError(null) }}
            >
              Create Account
            </button>
          </div>

          {/* Header */}
          <div className="auth-form-header">
            <div className="auth-form-header__greeting">
              {mode === 'login' ? 'Welcome back' : 'Get started'}
            </div>
            <h2 className="auth-form-header__title">
              {mode === 'login' ? (
                <>Sign in to<br /><em>your account</em></>
              ) : (
                <>Join<br /><em>Ivugire today</em></>
              )}
            </h2>
          </div>

          {/* Form fields */}
          <form onSubmit={handleSubmit} className="auth-form">
            {mode === 'register' && (
              <div className="auth-field">
                <label className="auth-field__label">Full name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="auth-field__input"
                />
              </div>
            )}

            <div className="auth-field">
              <label className="auth-field__label">{mode === 'login' ? 'Email or username' : 'Email address'}</label>
              <input
                required
                type={mode === 'login' ? 'text' : 'email'}
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder={mode === 'login' ? 'you@example.com or username' : 'you@example.com'}
                className="auth-field__input"
              />
            </div>

            <div className="auth-field">
              <label className="auth-field__label">Password</label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                className="auth-field__input"
              />
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-switch">
            {mode === 'login' ? 'No account yet? ' : 'Already have an account? '}
            <button
              type="button"
              className="auth-switch__btn"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
