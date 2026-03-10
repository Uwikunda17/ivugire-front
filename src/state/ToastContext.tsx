/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

type ToastTone = 'success' | 'error' | 'info'

type ToastItem = {
  id: number
  tone: ToastTone
  title: string
  message?: string
}

type ToastContextShape = {
  push: (toast: { tone?: ToastTone; title: string; message?: string; durationMs?: number }) => void
}

const ToastContext = createContext<ToastContextShape | undefined>(undefined)

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === 'success') return <CheckCircle2 size={16} />
  if (tone === 'error') return <TriangleAlert size={16} />
  return <Info size={16} />
}

const toastStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500&display=swap');

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateX(calc(100% + 1rem));
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes toast-progress {
    from { transform: scaleX(1); }
    to   { transform: scaleX(0); }
  }

  .toast-item {
    position: relative;
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 14px;
    background: #131318;
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03),
      0 8px 32px rgba(0,0,0,0.55),
      0 2px 8px rgba(0,0,0,0.3);
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    animation: toast-in 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    backdrop-filter: blur(16px);
  }

  /* Tone accent bar (left edge) */
  .toast-item::before {
    content: '';
    position: absolute;
    left: 0; top: 12%; bottom: 12%;
    width: 3px;
    border-radius: 0 2px 2px 0;
  }
  .toast-success::before { background: #22d3a0; }
  .toast-error::before   { background: #f87171; }
  .toast-info::before    { background: #818cf8; }

  /* Progress bar */
  .toast-item::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 2px;
    transform-origin: left;
    animation: toast-progress var(--duration, 3600ms) linear forwards;
  }
  .toast-success::after { background: linear-gradient(90deg, #22d3a0, rgba(34,211,160,0.2)); }
  .toast-error::after   { background: linear-gradient(90deg, #f87171, rgba(248,113,113,0.2)); }
  .toast-info::after    { background: linear-gradient(90deg, #818cf8, rgba(129,140,248,0.2)); }

  /* Icon wrapper */
  .toast-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    margin-top: 1px;
  }
  .toast-success .toast-icon { background: rgba(34,211,160,0.12); color: #22d3a0; }
  .toast-error   .toast-icon { background: rgba(248,113,113,0.12); color: #f87171; }
  .toast-info    .toast-icon { background: rgba(129,140,248,0.12); color: #818cf8; }

  .toast-content {
    flex: 1;
    min-width: 0;
  }
  .toast-title {
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 13.5px;
    color: #f0eee8;
    letter-spacing: -0.1px;
    line-height: 1.3;
  }
  .toast-message {
    margin-top: 3px;
    font-size: 12.5px;
    font-weight: 300;
    color: rgba(240,238,232,0.5);
    line-height: 1.5;
  }

  .toast-dismiss {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.28);
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
    margin-top: 2px;
    padding: 0;
  }
  .toast-dismiss:hover {
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
  }
`

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timersRef = useRef<Record<number, number>>({})

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current[id]
    if (timer) {
      window.clearTimeout(timer)
      delete timersRef.current[id]
    }
  }, [])

  const push = useCallback(({
    tone = 'info',
    title,
    message,
    durationMs = 3600,
  }: {
    tone?: ToastTone
    title: string
    message?: string
    durationMs?: number
  }) => {
    idRef.current += 1
    const id = idRef.current
    setToasts((prev) => [...prev.slice(-3), { id, tone, title, message }])
    timersRef.current[id] = window.setTimeout(() => dismiss(id), durationMs)
  }, [dismiss])

  useEffect(() => {
    return () => {
      for (const timer of Object.values(timersRef.current)) window.clearTimeout(timer)
      timersRef.current = {}
    }
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      <style>{toastStyles}</style>
      {children}
      <div
        style={{
          pointerEvents: 'none',
          position: 'fixed',
          right: '1rem',
          top: '1rem',
          zIndex: 80,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          width: 'min(340px, calc(100vw - 2rem))',
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{ pointerEvents: 'auto', '--duration': `${3600}ms` } as React.CSSProperties}
            className={`toast-item toast-${toast.tone}`}
          >
            <div className="toast-icon">
              <ToastIcon tone={toast.tone} />
            </div>
            <div className="toast-content">
              <div className="toast-title">{toast.title}</div>
              {toast.message && <div className="toast-message">{toast.message}</div>}
            </div>
            <button className="toast-dismiss" onClick={() => dismiss(toast.id)} aria-label="Dismiss">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}