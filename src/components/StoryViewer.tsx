import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { API_URL } from '../api/client'

type StoryMedia = {
  id: string
  mediaType: 'image' | 'video' | 'audio'
  mediaUrl: string
  caption?: string
  authorName?: string
  authorUsername?: string
  authorAvatarUrl?: string | null
  likesCount?: number
  commentsCount?: number
  createdAt?: string
}

type StoryViewerProps = {
  story?: StoryMedia
  previousStory?: StoryMedia | null
  nextStory?: StoryMedia | null
  onClose?: () => void
  onNavigate?: (direction: 'next' | 'prev') => void
}

const mockStories: StoryMedia[] = [
  {
    id: '1',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80',
    caption: 'Sunset on film',
    authorName: 'Nora Blake',
    authorUsername: 'nora.blake',
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=12',
    likesCount: 182,
  },
  {
    id: '2',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
    caption: 'Ocean air',
    authorName: 'Kai',
    authorUsername: 'kai.wave',
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=33',
    likesCount: 245,
  },
  {
    id: '3',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=900&q=80',
    caption: 'Forest path',
    authorName: 'Ivy',
    authorUsername: 'ivy.walks',
    authorAvatarUrl: 'https://i.pravatar.cc/150?img=45',
    likesCount: 98,
  },
]

function Avatar({ src, name, size = 38, className, style }: { src?: string | null; name?: string; size?: number; className?: string; style?: CSSProperties }) {
  const initials = (name || '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const colors = ['#fbbf24', '#22d3ee', '#c084fc', '#34d399', '#f472b6']
  const bg = colors[(name || '').length % colors.length]
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...style }}
      />
    )
  }
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'grid',
        placeItems: 'center',
        color: '#0f172a',
        fontWeight: 800,
        fontSize: size * 0.36,
        ...style,
      }}
    >
      {initials}
    </div>
  )
}

const HeartIcon = ({ filled, size = 18 }: { filled?: boolean; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const ChatIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
)

const CloseIcon = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const SendIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
)

const ChevronLeft = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRight = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default function StoryViewer({
  story: injectedStory,
  previousStory,
  nextStory,
  onClose,
  onNavigate,
}: StoryViewerProps = {}) {
  const [storyIndex, setStoryIndex] = useState(0)
  const [liked, setLiked] = useState<Record<string, boolean>>({})
  const [reply, setReply] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  // Fallback carousel when no external story list provided
  const resolveMediaUrl = (url?: string | null) => {
    if (!url) return ''
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    return `${API_URL}${url}`
  }

  const activeStory: StoryMedia | undefined = injectedStory || mockStories[storyIndex]
  const prevStory = injectedStory ? previousStory : mockStories[storyIndex - 1] || null
  const nextStoryItem = injectedStory ? nextStory : mockStories[storyIndex + 1] || null

  useEffect(() => {
    setReply('')
    inputRef.current?.focus()
  }, [activeStory?.id])

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (injectedStory) {
      onNavigate?.(direction)
      return
    }
    if (direction === 'next' && storyIndex < mockStories.length - 1) setStoryIndex((i) => i + 1)
    if (direction === 'prev' && storyIndex > 0) setStoryIndex((i) => i - 1)
  }

  const handleSend = () => {
    const text = reply.trim()
    if (!text) return
    // send logic handled upstream; here we just clear for UI responsiveness
    setReply('')
  }

  const isLiked = activeStory ? liked[activeStory.id] : false
  const likeCount = (activeStory?.likesCount || 0) + (isLiked ? 1 : 0)

  if (!activeStory) return null
  const mediaSrc = resolveMediaUrl(activeStory.mediaUrl)

  return (
    <>
      <style>{styles}</style>
      <div className="sv-root">
        <div className="sv-stage">
          <div className="sv-side">
            {prevStory ? (
              <>
                <button className="sv-nav-btn" onClick={() => handleNavigate('prev')} aria-label="Previous story">
                  <ChevronLeft />
                </button>
                <button className="sv-thumb-btn" onClick={() => handleNavigate('prev')}>
                  <div className="sv-thumb">
                    {prevStory.mediaType === 'video' && resolveMediaUrl(prevStory.mediaUrl) ? (
                      <video src={resolveMediaUrl(prevStory.mediaUrl)} muted playsInline />
                    ) : prevStory.mediaType === 'image' && resolveMediaUrl(prevStory.mediaUrl) ? (
                      <img src={resolveMediaUrl(prevStory.mediaUrl)} alt={prevStory.caption} />
                    ) : (
                      <div className="sv-thumb-fallback">No media</div>
                    )}
                    <div className="sv-thumb-ring" />
                    <div className="sv-thumb-meta">
                      <Avatar src={resolveMediaUrl(prevStory.authorAvatarUrl)} name={prevStory.authorName} size={26} />
                      <span>{prevStory.authorUsername || prevStory.authorName || 'Story'}</span>
                    </div>
                  </div>
                </button>
              </>
            ) : null}
          </div>

          <div className="sv-center">
            <button className="sv-close" onClick={() => onClose?.()} aria-label="Close story">
              <CloseIcon size={16} />
            </button>

            <div className="sv-progress">
              <span className="active" />
              <span />
              <span />
            </div>

            <div className="sv-header">
              <Avatar src={resolveMediaUrl(activeStory.authorAvatarUrl)} name={activeStory.authorName} size={38} />
              <div className="sv-header-text">
                <div className="sv-header-name">{activeStory.authorName || 'Story'}</div>
                <div className="sv-header-meta">@{activeStory.authorUsername || 'username'} · {activeStory.createdAt || '5h'}</div>
              </div>
              <div className="sv-header-actions">
                <button className="sv-icon-btn" onClick={() => setLiked((prev) => ({ ...prev, [activeStory.id]: !prev[activeStory.id] }))}>
                  <HeartIcon filled={isLiked} />
                </button>
                <button className="sv-icon-btn">
                  <ChatIcon />
                </button>
              </div>
            </div>

              {likeCount > 0 ? (
                <div className="sv-like-pill">
                  <HeartIcon size={14} filled />
                  {likeCount} likes
                </div>
              ) : null}

            <div className="sv-media">
              {activeStory.mediaType === 'video' && mediaSrc ? (
                <video src={mediaSrc} controls autoPlay muted />
              ) : activeStory.mediaType === 'audio' && mediaSrc ? (
                <div className="sv-audio-tile">Audio story</div>
              ) : activeStory.mediaType === 'image' && mediaSrc ? (
                <img src={mediaSrc} alt={activeStory.caption} />
              ) : (
                <div className="sv-audio-tile" style={{ background: 'rgba(0,0,0,0.2)', color: '#e5e7eb' }}>No media available</div>
              )}
            </div>

            <div className="sv-reply">
              <div className="sv-reply-box">
                <input
                  ref={inputRef}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="sv-reply-input"
                  placeholder={`Reply to ${activeStory.authorUsername ?? 'story'}…`}
                />
                <button className="sv-send-btn" onClick={handleSend} aria-label="Send reply">
                  <SendIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="sv-side">
            {nextStoryItem ? (
              <>
                <button className="sv-nav-btn" onClick={() => handleNavigate('next')} aria-label="Next story">
                  <ChevronRight />
                </button>
                <button className="sv-thumb-btn" onClick={() => handleNavigate('next')}>
                  <div className="sv-thumb">
                    {nextStoryItem.mediaType === 'video' && resolveMediaUrl(nextStoryItem.mediaUrl) ? (
                      <video src={resolveMediaUrl(nextStoryItem.mediaUrl)} muted playsInline />
                    ) : nextStoryItem.mediaType === 'image' && resolveMediaUrl(nextStoryItem.mediaUrl) ? (
                      <img src={resolveMediaUrl(nextStoryItem.mediaUrl)} alt={nextStoryItem.caption} />
                    ) : (
                      <div className="sv-thumb-fallback">No media</div>
                    )}
                    <div className="sv-thumb-ring" />
                    <div className="sv-thumb-meta">
                      <Avatar src={resolveMediaUrl(nextStoryItem.authorAvatarUrl)} name={nextStoryItem.authorName} size={26} />
                      <span>{nextStoryItem.authorUsername || nextStoryItem.authorName || 'Story'}</span>
                    </div>
                  </div>
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap');
  * { box-sizing: border-box; }
  .sv-root {
    position: fixed; inset: 0; z-index: 1000;
    background: radial-gradient(circle at center, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.92) 55%);
    display: flex; align-items: center; justify-content: center;
    padding: clamp(12px, 4vw, 32px);
  }
  .sv-stage {
    width: min(1200px, 100%);
    height: min(88vh, 780px);
    display: grid;
    grid-template-columns: 1fr min(440px, 52vw) 1fr;
    gap: clamp(14px, 2vw, 28px);
    align-items: center;
  }
  .sv-side {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    min-height: 0;
  }
  .sv-nav-btn {
    width: 44px; height: 44px;
    border-radius: 50%;
    border: none;
    background: rgba(255,255,255,0.14);
    color: #fff;
    display: grid; place-items: center;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
  }
  .sv-thumb-btn { background: none; border: none; cursor: pointer; padding: 0; }
  .sv-thumb {
    width: 170px; height: 270px;
    border-radius: 18px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 18px 48px rgba(0,0,0,0.35);
  }
  .sv-thumb-fallback {
    width: 170px; height: 270px;
    border-radius: 18px;
    background: rgba(255,255,255,0.06);
    border: 1px dashed rgba(255,255,255,0.2);
    display: grid; place-items: center;
    color: rgba(255,255,255,0.6);
    font-size: 12px;
  }
  .sv-thumb img, .sv-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sv-thumb::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%);
  }
  .sv-thumb-ring {
    position: absolute; inset: 6px;
    border-radius: 14px;
    border: 2px solid rgba(255,255,255,0.35);
    pointer-events: none;
  }
  .sv-thumb-meta {
    position: absolute; bottom: 12px; left: 12px; right: 12px;
    display: flex; align-items: center; gap: 8px;
    color: #fff; font-size: 12px; z-index: 2;
  }

  .sv-center {
    position: relative;
    height: 100%;
    border-radius: 20px;
    overflow: hidden;
    background: linear-gradient(180deg, #161616 0%, #0c0c0c 100%);
    box-shadow: 0 28px 80px rgba(0,0,0,0.55);
    display: flex; flex-direction: column;
  }
  .sv-close {
    position: absolute; top: 12px; right: 12px;
    width: 38px; height: 38px; border-radius: 50%;
    border: none; background: rgba(0,0,0,0.5); color: #fff;
    display: grid; place-items: center; cursor: pointer; z-index: 5;
  }
  .sv-progress {
    display: flex; gap: 6px;
    padding: 14px 16px 6px;
  }
  .sv-progress span {
    flex: 1; height: 3px; border-radius: 999px; background: rgba(255,255,255,0.25); overflow: hidden;
  }
  .sv-progress span.active::after {
    content: ''; display: block; width: 100%; height: 100%; background: #fff;
    animation: storyProgress 6s linear forwards;
  }
  @keyframes storyProgress { from { transform: translateX(-100%); } to { transform: translateX(0); } }

  .sv-header {
    display: flex; align-items: center; gap: 10px;
    padding: 0 16px;
    color: #fff;
    font-family: 'DM Sans', sans-serif;
  }
  .sv-header-text { display: flex; flex-direction: column; gap: 2px; }
  .sv-header-name { font-weight: 700; font-size: 14px; line-height: 1.1; }
  .sv-header-meta { font-size: 12px; opacity: 0.78; }
  .sv-header-actions { margin-left: auto; display: flex; gap: 10px; }
  .sv-icon-btn {
    width: 34px; height: 34px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.08);
    color: #fff; display: grid; place-items: center; cursor: pointer;
  }

  .sv-like-pill {
    position: absolute; top: 16px; right: 60px;
    background: rgba(0,0,0,0.45);
    border: 1px solid rgba(255,255,255,0.12);
    color: #fff; padding: 6px 10px;
    border-radius: 999px;
    display: flex; align-items: center; gap: 6px;
    font-size: 12px;
  }

  .sv-media {
    flex: 1;
    display: grid; place-items: center;
    padding: 18px 18px 96px;
  }
  .sv-media img, .sv-media video {
    width: 100%; height: 100%;
    object-fit: contain;
    border-radius: 12px;
    background: #0f0f0f;
  }
  .sv-audio-tile {
    width: 100%; max-width: 420px;
    border-radius: 14px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(14,165,233,0.25));
    color: #fff;
    text-align: center;
  }

  .sv-reply {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 14px 16px 16px;
    background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%);
  }
  .sv-reply-box {
    display: flex; align-items: center; gap: 10px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 18px;
    padding: 8px 10px 8px 14px;
  }
  .sv-reply-input {
    flex: 1;
    background: transparent;
    border: none;
    color: #fff;
    font-size: 13px;
    outline: none;
  }
  .sv-send-btn {
    width: 34px; height: 34px; border-radius: 50%;
    border: none; background: #fff; color: #0f0f0f; display: grid; place-items: center; cursor: pointer;
  }

  @media (max-width: 960px) {
    .sv-stage { grid-template-columns: 1fr; height: 92vh; }
    .sv-side { display: none; }
    .sv-progress { padding-top: 18px; }
    .sv-media { padding-bottom: 110px; }
  }
`
