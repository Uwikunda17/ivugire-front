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
          background: #0b0c0e;
        }

        /* ── LEFT BRAND PANEL ── */
        .auth-brand {
          flex: 1;
          display: none;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
          background: #0f1a16;
        }
        @media (min-width: 900px) {
          .auth-brand { display: flex; }
        }

        /* Mesh gradient background */
        .auth-brand::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(14,110,80,0.45) 0%, transparent 60%),
            radial-gradient(ellipse 60% 70% at 80% 80%, rgba(192,120,20,0.3) 0%, transparent 55%),
            radial-gradient(ellipse 50% 50% at 50% 50%, rgba(8,60,45,0.6) 0%, transparent 70%);
          z-index: 0;
        }

        /* Subtle grain texture */
        .auth-brand::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
          background-size: 200px 200px;
          z-index: 1;
          pointer-events: none;
          opacity: 0.6;
        }

        .auth-brand__content {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
        }

        .auth-brand__logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .auth-brand__logo-mark {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, #0ed494, #d4870e);
          display: grid;
          place-items: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 18px;
          font-weight: 600;
          color: #0b0c0e;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 20px rgba(14,212,148,0.3);
        }
        .auth-brand__logo-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 400;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.06em;
        }

        .auth-brand__headline {
          flex: 1;
          display: flex;
          align-items: center;
        }
        .auth-brand__headline-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 5vw, 68px);
          font-weight: 300;
          line-height: 1.1;
          color: rgba(255,255,255,0.92);
          letter-spacing: -0.01em;
        }
        .auth-brand__headline-text em {
          font-style: italic;
          color: #0ed494;
        }
        .auth-brand__headline-text strong {
          font-weight: 600;
          display: block;
        }

        .auth-brand__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .auth-brand__tagline {
          font-size: 12px;
          color: rgba(255,255,255,0.28);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 300;
        }
        .auth-brand__dots {
          display: flex;
          gap: 6px;
        }
        .auth-brand__dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
        }
        .auth-brand__dot:first-child {
          background: #0ed494;
          box-shadow: 0 0 8px rgba(14,212,148,0.6);
        }

        /* Decorative diagonal line */
        .auth-brand__line {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 1px;
          height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(14,212,148,0.15) 40%, rgba(212,135,14,0.1) 70%, transparent);
          z-index: 2;
        }

        /* ── RIGHT FORM PANEL ── */
        .auth-form-panel {
          width: 100%;
          max-width: 480px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 48px 40px;
          background: #0b0c0e;
          position: relative;
        }
        @media (max-width: 899px) {
          .auth-form-panel {
            max-width: 100%;
          }
        }

        /* Subtle top-right glow on form panel */
        .auth-form-panel::before {
          content: '';
          position: absolute;
          top: -80px;
          right: -80px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(212,135,14,0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Mobile logo (hidden on desktop) */
        .auth-mobile-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 40px;
        }
        @media (min-width: 900px) {
          .auth-mobile-logo { display: none; }
        }
        .auth-mobile-logo__mark {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, #0ed494, #d4870e);
          display: grid;
          place-items: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 15px;
          font-weight: 600;
          color: #0b0c0e;
        }
        .auth-mobile-logo__name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 20px;
          color: rgba(255,255,255,0.9);
        }

        .auth-form-header {
          margin-bottom: 36px;
          animation: fadeUp 0.5s ease both;
        }
        .auth-form-header__greeting {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0ed494;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .auth-form-header__greeting::before {
          content: '';
          display: block;
          width: 24px;
          height: 1px;
          background: #0ed494;
          opacity: 0.7;
        }
        .auth-form-header__title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px;
          font-weight: 400;
          color: rgba(255,255,255,0.95);
          line-height: 1.15;
          letter-spacing: -0.01em;
        }
        .auth-form-header__title em {
          font-style: italic;
          color: rgba(255,255,255,0.55);
        }

        /* Form */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
          animation: fadeUp 0.5s 0.1s ease both;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-field__label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.35);
        }
        .auth-field__input {
          width: 100%;
          height: 50px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 0 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: rgba(255,255,255,0.9);
          outline: none;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
          caret-color: #0ed494;
        }
        .auth-field__input::placeholder {
          color: rgba(255,255,255,0.18);
        }
        .auth-field__input:focus {
          border-color: rgba(14,212,148,0.4);
          background: rgba(14,212,148,0.03);
          box-shadow: 0 0 0 3px rgba(14,212,148,0.06);
        }

        .auth-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          font-size: 13px;
          color: #fca5a5;
          animation: shake 0.3s ease;
        }
        .auth-error::before {
          content: '⚠';
          font-size: 12px;
          opacity: 0.8;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25%       { transform: translateX(-4px); }
          75%       { transform: translateX(4px); }
        }

        .auth-submit {
          margin-top: 6px;
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(105deg, #0ed494 0%, #d4870e 100%);
          color: #0b0c0e;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(14,212,148,0.2);
        }
        .auth-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(14,212,148,0.3);
        }
        .auth-submit:active:not(:disabled) {
          transform: translateY(0);
        }
        .auth-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        /* Shimmer on hover */
        .auth-submit::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s ease;
        }
        .auth-submit:hover:not(:disabled)::after {
          left: 150%;
        }

        .auth-switch {
          margin-top: 28px;
          text-align: center;
          font-size: 13px;
          color: rgba(255,255,255,0.3);
          font-weight: 300;
          animation: fadeUp 0.5s 0.2s ease both;
        }
        .auth-switch__btn {
          background: none;
          border: none;
          cursor: pointer;
          color: #0ed494;
          font-size: 13px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          padding: 0 2px;
          transition: opacity 0.15s;
          text-decoration: underline;
          text-underline-offset: 3px;
          text-decoration-color: rgba(14,212,148,0.3);
        }
        .auth-switch__btn:hover {
          opacity: 0.8;
        }

        .auth-mode-bar {
          display: flex;
          gap: 0;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 10px;
          padding: 3px;
          margin-bottom: 32px;
          animation: fadeUp 0.5s ease both;
        }
        .auth-mode-tab {
          flex: 1;
          height: 36px;
          border: none;
          border-radius: 8px;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,0.35);
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
        }
        .auth-mode-tab.active {
          background: rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
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
                placeholder="••••••••"
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