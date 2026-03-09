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
  if (tone === 'success') return <CheckCircle2 size={18} />
  if (tone === 'error') return <TriangleAlert size={18} />
  return <Info size={18} />
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timersRef = useRef<Record<number, number>>({})

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
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
    const nextToast = { id, tone, title, message }
    setToasts((prev) => [...prev.slice(-3), nextToast])
    timersRef.current[id] = window.setTimeout(() => dismiss(id), durationMs)
  }, [dismiss])

  useEffect(() => {
    return () => {
      for (const timer of Object.values(timersRef.current)) {
        window.clearTimeout(timer)
      }
      timersRef.current = {}
    }
  }, [])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast-card pointer-events-auto ${
              toast.tone === 'success'
                ? 'toast-card-success'
                : toast.tone === 'error'
                  ? 'toast-card-error'
                  : 'toast-card-info'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <ToastIcon tone={toast.tone} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{toast.title}</div>
                {toast.message ? <div className="mt-1 text-xs leading-5 opacity-80">{toast.message}</div> : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
              >
                <X size={14} />
              </button>
            </div>
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
