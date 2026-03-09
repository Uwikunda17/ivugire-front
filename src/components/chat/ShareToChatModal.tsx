import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Search, Send, X } from 'lucide-react'
import { API_URL, api, type ChatItem, type UserSearchResult } from '../../api/client'
import { useToast } from '../../state/ToastContext'

type ShareType = 'post' | 'reel' | 'story'

type Props = {
  open: boolean
  onClose: () => void
  shareType: ShareType
  shareItemId: string
  title?: string
  onDelivered?: (count: number) => void | Promise<void>
}

type ShareTarget = {
  key: string
  label: string
  subtitle: string
  avatarUrl?: string | null
  chatId?: string
  recipientId?: string
  recipientEmail?: string | null
}

function resolveAvatar(url?: string | null) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}

function chatToTarget(chat: ChatItem): ShareTarget {
  return {
    key: `chat:${chat.id}`,
    label: chat.title,
    subtitle: chat.isGroup ? 'Group' : chat.username ? `@${chat.username}` : chat.email || 'Chat',
    avatarUrl: chat.avatarUrl,
    chatId: chat.id,
    recipientEmail: chat.email || null,
  }
}

function userToTarget(user: UserSearchResult): ShareTarget {
  return {
    key: `user:${user.id}`,
    label: user.name,
    subtitle: `@${user.username}`,
    avatarUrl: user.avatarUrl,
    recipientId: user.id,
    recipientEmail: user.email,
  }
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#0ed494,#0891b2)',
  'linear-gradient(135deg,#d4870e,#dc2626)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#f59e0b,#84cc16)',
  'linear-gradient(135deg,#f472b6,#a855f7)',
]

function avatarColor(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function ShareToChatModal({
  open,
  onClose,
  shareType,
  shareItemId,
  title,
  onDelivered,
}: Props) {
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [note, setNote] = useState('')
  const [recentChats, setRecentChats] = useState<ShareTarget[]>([])
  const [searchResults, setSearchResults] = useState<ShareTarget[]>([])
  const [selectedTargets, setSelectedTargets] = useState<ShareTarget[]>([])
  const [loadingTargets, setLoadingTargets] = useState(false)
  const [sending, setSending] = useState(false)

  function resetModalState() {
    setSearch('')
    setNote('')
    setSearchResults([])
    setSelectedTargets([])
    setSending(false)
  }

  const loadRecentTargets = useCallback(async () => {
    setLoadingTargets(true)
    try {
      const items = await api.listChats()
      setRecentChats(items.map(chatToTarget))
    } catch (error) {
      push({ tone: 'info', title: 'Recent chats unavailable', message: (error as Error).message })
      setRecentChats([])
    } finally {
      setLoadingTargets(false)
    }
  }, [push])

  useEffect(() => {
    if (!open) return
    void loadRecentTargets()
  }, [loadRecentTargets, open])

  useEffect(() => {
    if (!open) return
    const trimmed = search.trim()
    if (trimmed.length < 2) { setSearchResults([]); return }
    const timer = window.setTimeout(() => {
      void api.searchUsers(trimmed)
        .then((r) => setSearchResults(r.map(userToTarget)))
        .catch(() => setSearchResults([]))
    }, 220)
    return () => window.clearTimeout(timer)
  }, [open, search])

  useEffect(() => { if (!open) resetModalState() }, [open])

  const visibleTargets = useMemo(() => {
    const source = search.trim().length >= 2 ? searchResults : recentChats
    const seen = new Set<string>()
    return source.filter((t) => { if (seen.has(t.key)) return false; seen.add(t.key); return true })
  }, [recentChats, search, searchResults])

  function toggleTarget(target: ShareTarget) {
    setSelectedTargets((prev) =>
      prev.some((e) => e.key === target.key)
        ? prev.filter((e) => e.key !== target.key)
        : [...prev, target],
    )
  }

  async function handleSend() {
    if (selectedTargets.length === 0) {
      push({ tone: 'info', title: 'Choose recipients', message: 'Select at least one user or chat.' })
      return
    }
    setSending(true)
    let sentCount = 0
    let failureCount = 0
    for (const target of selectedTargets) {
      try {
        let chatId = target.chatId
        if (!chatId) {
          const result = await api.createDirectChat(
            target.recipientId ? { recipientId: target.recipientId } : { recipientEmail: target.recipientEmail || '' },
          )
          chatId = result.chatId
        }
        await api.sendMessage(chatId, { body: note.trim(), sharedType: shareType, sharedItemId: shareItemId })
        sentCount += 1
      } catch { failureCount += 1 }
    }
    setSending(false)
    if (sentCount > 0) {
      await onDelivered?.(sentCount)
      push({
        tone: failureCount > 0 ? 'info' : 'success',
        title: failureCount > 0 ? 'Partial success' : 'Sent!',
        message: failureCount > 0
          ? `Sent to ${sentCount}, ${failureCount} failed.`
          : `Delivered to ${sentCount} recipient${sentCount > 1 ? 's' : ''}.`,
      })
      onClose()
      return
    }
    push({ tone: 'error', title: 'Share failed', message: 'No recipient received the content.' })
  }

  if (!open) return null

  const shareLabel = title || `Share ${shareType}`

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        .sm-backdrop {
          position: fixed;
          inset: 0;
          z-index: 85;
          background: rgba(5,8,12,0.72);
          backdrop-filter: blur(6px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding: 0;
          animation: smBackdropIn 0.25s ease;
        }
        @keyframes smBackdropIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .sm-sheet {
          font-family: 'DM Sans', sans-serif;
          width: 100%;
          max-width: 560px;
          background: #0f1114;
          border-top: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px 28px 0 0;
          overflow: hidden;
          box-shadow: 0 -24px 80px rgba(0,0,0,0.7);
          animation: smSheetUp 0.32s cubic-bezier(0.4,0,0.2,1);
          display: flex;
          flex-direction: column;
          max-height: 92vh;
        }
        @keyframes smSheetUp {
          from { transform: translateY(100%); opacity: 0.4; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        /* Drag handle */
        .sm-handle {
          width: 36px;
          height: 4px;
          border-radius: 2px;
          background: rgba(255,255,255,0.12);
          margin: 12px auto 0;
          flex-shrink: 0;
        }

        /* Header */
        .sm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .sm-header__title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.01em;
        }
        .sm-header__subtitle {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          font-weight: 300;
          margin-top: 2px;
          letter-spacing: 0.02em;
        }
        .sm-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          display: grid;
          place-items: center;
          cursor: pointer;
          color: rgba(255,255,255,0.5);
          transition: background 0.15s, color 0.15s;
          flex-shrink: 0;
        }
        .sm-close:hover {
          background: rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
        }
        .sm-header__badge {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #0ed494;
          background: rgba(14,212,148,0.1);
          border: 1px solid rgba(14,212,148,0.2);
          border-radius: 20px;
          padding: 2px 9px;
        }

        /* Body */
        .sm-body {
          padding: 16px 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          overflow-y: auto;
          scrollbar-width: none;
        }
        .sm-body::-webkit-scrollbar { display: none; }

        /* Search */
        .sm-search {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 0 14px;
          height: 44px;
          transition: border-color 0.2s, background 0.2s;
        }
        .sm-search:focus-within {
          border-color: rgba(14,212,148,0.35);
          background: rgba(14,212,148,0.03);
        }
        .sm-search__icon {
          color: rgba(255,255,255,0.25);
          flex-shrink: 0;
          transition: color 0.2s;
        }
        .sm-search:focus-within .sm-search__icon {
          color: #0ed494;
        }
        .sm-search__input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: rgba(255,255,255,0.85);
          font-weight: 300;
          caret-color: #0ed494;
        }
        .sm-search__input::placeholder {
          color: rgba(255,255,255,0.2);
        }

        /* Selected pills */
        .sm-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          animation: fadeIn 0.2s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sm-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(14,212,148,0.1);
          border: 1px solid rgba(14,212,148,0.22);
          border-radius: 20px;
          padding: 4px 10px 4px 6px;
          font-size: 12px;
          font-weight: 500;
          color: #0ed494;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }
        .sm-pill:hover {
          background: rgba(14,212,148,0.16);
        }
        .sm-pill__avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
        }
        .sm-pill__avatar-fb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 9px;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .sm-pill__x {
          opacity: 0.55;
          font-size: 11px;
          line-height: 1;
        }

        /* Recipients grid */
        .sm-section-label {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.25);
          padding-bottom: 2px;
        }

        .sm-grid-wrap {
          overflow-x: auto;
          scrollbar-width: none;
          margin: 0 -4px;
          padding: 4px 4px 6px;
        }
        .sm-grid-wrap::-webkit-scrollbar { display: none; }

        .sm-grid {
          display: flex;
          gap: 10px;
          width: max-content;
        }

        .sm-target {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          width: 68px;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0;
          flex-shrink: 0;
          transition: transform 0.15s;
        }
        .sm-target:hover { transform: translateY(-2px); }
        .sm-target:active { transform: scale(0.96); }

        .sm-target__ring {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          padding: 2.5px;
          position: relative;
          transition: box-shadow 0.2s;
        }
        .sm-target__ring.selected {
          box-shadow: 0 0 0 2px rgba(14,212,148,0.5), 0 4px 16px rgba(14,212,148,0.2);
        }
        .sm-target__ring-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          border: 2.5px solid #0f1114;
          position: relative;
        }
        .sm-target__img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .sm-target__fb {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 18px;
          font-weight: 700;
          color: #fff;
          font-family: 'Syne', sans-serif;
        }
        .sm-target__check {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #0ed494;
          border: 2px solid #0f1114;
          display: grid;
          place-items: center;
          box-shadow: 0 2px 8px rgba(14,212,148,0.4);
          animation: checkPop 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes checkPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        .sm-target__name {
          font-size: 11px;
          font-weight: 400;
          color: rgba(255,255,255,0.7);
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sm-target__sub {
          font-size: 10px;
          color: rgba(255,255,255,0.28);
          text-align: center;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-top: -4px;
        }

        /* Empty / loading */
        .sm-empty {
          text-align: center;
          padding: 20px 0;
          font-size: 13px;
          color: rgba(255,255,255,0.2);
          font-style: italic;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
        }
        .sm-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px 0;
          font-size: 12px;
          color: rgba(255,255,255,0.25);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .sm-loading__dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(14,212,148,0.5);
          animation: loadPulse 1.2s ease infinite;
        }
        .sm-loading__dot:nth-child(2) { animation-delay: 0.2s; }
        .sm-loading__dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes loadPulse {
          0%,100% { opacity: 0.3; transform: scale(0.7); }
          50%      { opacity: 1;   transform: scale(1); }
        }

        /* Note textarea */
        .sm-note-wrap {
          position: relative;
        }
        .sm-note {
          width: 100%;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 12px 16px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
          color: rgba(255,255,255,0.8);
          resize: none;
          outline: none;
          line-height: 1.55;
          caret-color: #0ed494;
          transition: border-color 0.2s, background 0.2s;
          min-height: 72px;
        }
        .sm-note::placeholder { color: rgba(255,255,255,0.18); }
        .sm-note:focus {
          border-color: rgba(14,212,148,0.3);
          background: rgba(14,212,148,0.02);
        }

        /* Send button */
        .sm-send {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(105deg, #0ed494 0%, #d4870e 100%);
          color: #0b0c0e;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.04em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          overflow: hidden;
          transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 6px 28px rgba(14,212,148,0.22);
        }
        .sm-send:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 36px rgba(14,212,148,0.32);
        }
        .sm-send:active:not(:disabled) { transform: translateY(0); }
        .sm-send:disabled { opacity: 0.45; cursor: not-allowed; }
        .sm-send::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transition: left 0.5s ease;
        }
        .sm-send:hover:not(:disabled)::after { left: 150%; }

        .sm-send__count {
          background: rgba(0,0,0,0.18);
          border-radius: 20px;
          padding: 1px 7px;
          font-size: 11px;
          font-weight: 600;
        }
      `}</style>

      <div className="sm-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="sm-sheet">
          <div className="sm-handle" />

          {/* Header */}
          <div className="sm-header">
            <button type="button" className="sm-close" onClick={onClose} aria-label="Close">
              <X size={15} />
            </button>
            <div style={{ textAlign: 'center' }}>
              <div className="sm-header__title">{shareLabel}</div>
              <div className="sm-header__subtitle">Send to chats or people</div>
            </div>
            <div className="sm-header__badge">{shareType}</div>
          </div>

          {/* Body */}
          <div className="sm-body">
            {/* Search */}
            <div className="sm-search">
              <Search size={15} className="sm-search__icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or username…"
                className="sm-search__input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.25)', display: 'grid', placeItems: 'center' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Selected pills */}
            {selectedTargets.length > 0 && (
              <div className="sm-pills">
                {selectedTargets.map((t) => {
                  const av = resolveAvatar(t.avatarUrl)
                  return (
                    <button key={t.key} type="button" className="sm-pill" onClick={() => toggleTarget(t)}>
                      {av
                        ? <img src={av} alt={t.label} className="sm-pill__avatar" />
                        : <div className="sm-pill__avatar-fb" style={{ background: avatarColor(t.key) }}>{t.label[0].toUpperCase()}</div>
                      }
                      {t.label}
                      <span className="sm-pill__x">✕</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Recipient grid */}
            <div>
              <div className="sm-section-label">
                {search.trim().length >= 2 ? 'Search results' : 'Recent'}
              </div>

              {loadingTargets ? (
                <div className="sm-loading">
                  <div className="sm-loading__dot" />
                  <div className="sm-loading__dot" />
                  <div className="sm-loading__dot" />
                </div>
              ) : visibleTargets.length === 0 ? (
                <div className="sm-empty">
                  {search.trim().length >= 2 ? 'No users found' : 'No recent chats yet'}
                </div>
              ) : (
                <div className="sm-grid-wrap">
                  <div className="sm-grid">
                    {visibleTargets.map((target) => {
                      const active = selectedTargets.some((e) => e.key === target.key)
                      const av = resolveAvatar(target.avatarUrl)
                      const color = avatarColor(target.key)
                      return (
                        <button
                          key={target.key}
                          type="button"
                          className="sm-target"
                          onClick={() => toggleTarget(target)}
                          aria-label={`${active ? 'Deselect' : 'Select'} ${target.label}`}
                        >
                          <div
                            className={`sm-target__ring${active ? ' selected' : ''}`}
                            style={{ background: active ? 'rgba(14,212,148,0.25)' : color }}
                          >
                            <div className="sm-target__ring-inner">
                              {av
                                ? <img src={av} alt={target.label} className="sm-target__img" />
                                : <div className="sm-target__fb" style={{ background: color }}>{target.label[0].toUpperCase()}</div>
                              }
                            </div>
                            {active && (
                              <div className="sm-target__check">
                                <Check size={11} color="#0b0c0e" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div className="sm-target__name">{target.label}</div>
                          <div className="sm-target__sub">{target.subtitle}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Note */}
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a message… (optional)"
              rows={3}
              className="sm-note"
            />

            {/* Send */}
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || selectedTargets.length === 0}
              className="sm-send"
            >
              <Send size={15} />
              {sending ? 'Sending…' : 'Send'}
              {selectedTargets.length > 0 && !sending && (
                <span className="sm-send__count">{selectedTargets.length}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}