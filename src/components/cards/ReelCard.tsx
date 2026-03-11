import { useState } from 'react'
import { Heart, MessageCircle, Share2, X, Send } from 'lucide-react'
import type { FeedItem, PostComment } from '../../api/client'
import MediaRenderer from './MediaRenderer'
import { API_URL, api } from '../../api/client'
import ShareToChatModal from '../chat/ShareToChatModal'

type Props = {
  reel: FeedItem
  onMetricsChange?: (postId: string, changes: Partial<FeedItem>) => void
}

const ChevronLeft = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
)

const ChevronRight = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export default function ReelCard({ reel, onMetricsChange }: Props) {
  const [liked, setLiked] = useState(reel.likedByMe)
  const [likeCount, setLikeCount] = useState(reel.likeCount || 0)
  const [shareCount, setShareCount] = useState(reel.shareCount || 0)
  const [commentCount, setCommentCount] = useState(reel.commentCount || 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [likeAnimating, setLikeAnimating] = useState(false)
  const [shared, setShared] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)

  // Support both old format (single media) and new format (mediaItems array)
  const mediaItems = reel.mediaItems && reel.mediaItems.length > 0 
    ? reel.mediaItems 
    : [{ 
        id: reel.id,
        mediaUrl: reel.mediaUrl,
        mediaType: reel.mediaType,
        mediaDurationSeconds: reel.mediaDurationSeconds,
        trimEndSeconds: reel.trimEndSeconds,
        isTrimmed: reel.isTrimmed,
        sequenceOrder: 1
      }]
  
  const currentMedia = mediaItems[currentMediaIndex]

  async function handleLike() {
    setLikeAnimating(true)
    setTimeout(() => setLikeAnimating(false), 700)
    const result = await api.toggleLike(reel.id)
    setLiked(result.liked)
    setLikeCount(result.likeCount)
    onMetricsChange?.(reel.id, { likedByMe: result.liked, likeCount: result.likeCount })
  }

  async function handleShare() {
    setShareOpen(true)
  }

  async function toggleComments() {
    const nextOpen = !commentsOpen
    setCommentsOpen(nextOpen)
    if (!nextOpen || comments.length > 0) return
    const loaded = await api.listComments(reel.id)
    setComments(loaded)
  }

  async function submitComment() {
    const body = newComment.trim()
    if (!body) return
    const saved = await api.addComment(reel.id, body)
    setComments((prev) => [
      ...prev,
      { id: saved.id, body: saved.body, createdAt: saved.createdAt, userId: 'me', userName: 'You', username: 'you' },
    ])
    setCommentCount(saved.commentCount)
    onMetricsChange?.(reel.id, { commentCount: saved.commentCount })
    setNewComment('')
  }

  const avatarUrl = reel.authorAvatarUrl
    ? reel.authorAvatarUrl.startsWith('http://') || reel.authorAvatarUrl.startsWith('https://')
      ? reel.authorAvatarUrl
      : `${API_URL}${reel.authorAvatarUrl}`
    : null

  function formatCount(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return `${n}`
  }

  function navigateMedia(direction: 'next' | 'prev') {
    if (direction === 'next' && currentMediaIndex < mediaItems.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1)
    } else if (direction === 'prev' && currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=Instrument+Sans:wght@300;400;500&display=swap');

        .reel-card {
          font-family: 'Instrument Sans', sans-serif;
          position: relative;
          width: 100%;
          max-width: 400px;
          margin: 0 auto;
          border-radius: 24px;
          overflow: hidden;
          background: #000;
          aspect-ratio: 9/16;
          box-shadow: 0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06);
        }

        /* ── Media fills entire card ── */
        .reel-card__media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* ── Full gradient overlay: top fade + heavy bottom fade ── */
        .reel-card__overlay {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 22%),
            linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 28%, transparent 55%);
          pointer-events: none;
          z-index: 1;
        }

        /* ── Right action sidebar ── */
        .reel-card__actions {
          position: absolute;
          right: 14px;
          bottom: 100px;
          z-index: 3;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .reel-action-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          color: #fff;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .reel-action-btn:hover {
          transform: scale(1.12);
        }
        .reel-action-btn:active {
          transform: scale(0.95);
        }

        .reel-action-btn__icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.18);
          display: grid;
          place-items: center;
          transition: background 0.2s, border-color 0.2s;
        }
        .reel-action-btn:hover .reel-action-btn__icon {
          background: rgba(255,255,255,0.2);
        }
        .reel-action-btn__icon.liked {
          background: rgba(239,68,68,0.25);
          border-color: rgba(239,68,68,0.5);
        }
        .reel-action-btn__icon.shared {
          background: rgba(34,197,94,0.25);
          border-color: rgba(34,197,94,0.5);
        }
        .reel-action-btn__icon.comments-open {
          background: rgba(99,179,237,0.2);
          border-color: rgba(99,179,237,0.4);
        }

        .reel-action-btn__label {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255,255,255,0.9);
          letter-spacing: 0.02em;
          font-family: 'Syne', sans-serif;
          text-shadow: 0 1px 4px rgba(0,0,0,0.6);
        }

        .heart-icon {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s;
        }
        .heart-icon.pop {
          animation: heartBurst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes heartBurst {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.6); }
          60%  { transform: scale(0.88); }
          80%  { transform: scale(1.1); }
          100% { transform: scale(1); }
        }

        /* ── Bottom info bar ── */
        .reel-card__info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 68px;
          z-index: 3;
          padding: 0 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .reel-card__author {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .reel-card__avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid rgba(255,255,255,0.6);
          flex-shrink: 0;
        }
        .reel-card__avatar-fallback {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: 2px solid rgba(255,255,255,0.5);
          display: grid;
          place-items: center;
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          font-family: 'Syne', sans-serif;
          flex-shrink: 0;
        }
        .reel-card__author-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: #fff;
          line-height: 1.2;
          text-shadow: 0 1px 6px rgba(0,0,0,0.5);
        }
        .reel-card__author-handle {
          font-size: 12px;
          color: rgba(255,255,255,0.6);
          font-weight: 400;
        }

        .reel-card__caption {
          font-size: 13px;
          line-height: 1.55;
          color: rgba(255,255,255,0.88);
          font-weight: 300;
          text-shadow: 0 1px 4px rgba(0,0,0,0.5);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: 0.01em;
        }

        .reel-card__trimmed {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,180,0,0.3);
          border-radius: 20px;
          padding: 3px 9px;
          font-size: 10px;
          font-weight: 500;
          color: #fbbf24;
          letter-spacing: 0.04em;
          width: fit-content;
        }

        /* ── Comments drawer slides up from bottom ── */
        .reel-card__comments-drawer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 10;
          background: rgba(12,12,14,0.96);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px 20px 0 0;
          padding: 16px 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: drawerUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 70%;
        }
        @keyframes drawerUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        .reel-card__drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .reel-card__drawer-title {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.85);
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .reel-card__drawer-close {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          cursor: pointer;
          color: rgba(255,255,255,0.6);
          transition: background 0.15s;
        }
        .reel-card__drawer-close:hover {
          background: rgba(255,255,255,0.14);
          color: #fff;
        }

        .reel-card__comment-list {
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 240px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }
        .reel-card__comment-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: fadeSlide 0.2s ease;
        }
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reel-card__comment-author {
          font-family: 'Syne', sans-serif;
          font-size: 11px;
          font-weight: 600;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.03em;
        }
        .reel-card__comment-body {
          font-size: 13px;
          color: rgba(255,255,255,0.8);
          line-height: 1.45;
          font-weight: 300;
        }
        .reel-card__comment-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin-top: 4px;
        }
        .reel-card__empty {
          font-size: 13px;
          color: rgba(255,255,255,0.25);
          text-align: center;
          padding: 16px 0;
          font-style: italic;
        }

        .reel-card__comment-input-row {
          display: flex;
          gap: 8px;
          align-items: center;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 10px;
        }
        .reel-card__comment-input {
          flex: 1;
          height: 38px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 20px;
          padding: 0 14px;
          font-size: 13px;
          font-family: 'Instrument Sans', sans-serif;
          color: rgba(255,255,255,0.9);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .reel-card__comment-input::placeholder {
          color: rgba(255,255,255,0.25);
        }
        .reel-card__comment-input:focus {
          border-color: rgba(255,255,255,0.25);
          background: rgba(255,255,255,0.1);
        }
        .reel-card__comment-send {
          width: 38px;
          height: 38px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 50%;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s ease;
          box-shadow: 0 2px 12px rgba(255,255,255,0.2);
        }
        .reel-card__comment-send:hover {
          background: #f0f0f0;
          transform: scale(1.08);
        }
        .reel-card__comment-send:active {
          transform: scale(0.95);
        }
      `}</style>

      <article className="reel-card">
        {/* Full-bleed media */}
        <MediaRenderer
          mediaUrl={currentMedia.mediaUrl}
          mediaType={currentMedia.mediaType}
          trimEndSeconds={currentMedia.trimEndSeconds}
          className="reel-card__media"
        />

        {/* Gradient overlay */}
        <div className="reel-card__overlay" />

        {/* Media Counter */}
        {mediaItems.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
            {currentMediaIndex + 1}/{mediaItems.length}
          </div>
        )}

        {/* Navigation Arrows */}
        {mediaItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => navigateMedia('prev')}
              disabled={currentMediaIndex === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30 transition text-white z-10"
              aria-label="Previous media"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => navigateMedia('next')}
              disabled={currentMediaIndex === mediaItems.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30 transition text-white z-10"
              aria-label="Next media"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Right action sidebar */}
        <div className="reel-card__actions">
          {/* Like */}
          <button type="button" onClick={handleLike} className="reel-action-btn" aria-label="Like">
            <div className={`reel-action-btn__icon${liked ? ' liked' : ''}`}>
              <Heart
                size={20}
                fill={liked ? '#f87171' : 'none'}
                stroke={liked ? '#f87171' : '#fff'}
                className={`heart-icon${likeAnimating ? ' pop' : ''}`}
              />
            </div>
            <span className="reel-action-btn__label">{formatCount(likeCount)}</span>
          </button>

          {/* Comments */}
          <button type="button" onClick={toggleComments} className="reel-action-btn" aria-label="Comments">
            <div className={`reel-action-btn__icon${commentsOpen ? ' comments-open' : ''}`}>
              <MessageCircle size={20} stroke={commentsOpen ? '#90cdf4' : '#fff'} fill="none" />
            </div>
            <span className="reel-action-btn__label">{formatCount(commentCount)}</span>
          </button>

          {/* Share */}
          <button type="button" onClick={handleShare} className="reel-action-btn" aria-label="Share">
            <div className={`reel-action-btn__icon${shared ? ' shared' : ''}`}>
              <Share2 size={20} stroke={shared ? '#4ade80' : '#fff'} fill="none" />
            </div>
            <span className="reel-action-btn__label">{formatCount(shareCount)}</span>
          </button>
        </div>

        {/* Bottom info: author + caption */}
        <div className="reel-card__info">
          {currentMedia.isTrimmed && (
            <div className="reel-card__trimmed">⏱ Trimmed to 5:00</div>
          )}
          <div className="reel-card__author">
            {avatarUrl ? (
              <img src={avatarUrl} alt={reel.authorName} className="reel-card__avatar" />
            ) : (
              <div className="reel-card__avatar-fallback">
                {reel.authorName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="reel-card__author-name">{reel.authorName}</div>
              <div className="reel-card__author-handle">@{reel.authorUsername || reel.authorEmail}</div>
            </div>
          </div>
          {reel.caption ? (
            <p className="reel-card__caption">{reel.caption}</p>
          ) : null}
        </div>

        {/* Comments drawer */}
        {commentsOpen && (
          <div className="reel-card__comments-drawer">
            <div className="reel-card__drawer-header">
              <span className="reel-card__drawer-title">Comments · {formatCount(commentCount)}</span>
              <button
                type="button"
                className="reel-card__drawer-close"
                onClick={() => setCommentsOpen(false)}
                aria-label="Close comments"
              >
                <X size={14} />
              </button>
            </div>

            <div className="reel-card__comment-list">
              {comments.length === 0 ? (
                <div className="reel-card__empty">No comments yet — be first ✦</div>
              ) : (
                comments.map((comment, i) => (
                  <div key={comment.id}>
                    <div className="reel-card__comment-item">
                      <div className="reel-card__comment-author">
                        {comment.userName} · @{comment.username}
                      </div>
                      <div className="reel-card__comment-body">{comment.body}</div>
                    </div>
                    {i < comments.length - 1 && <div className="reel-card__comment-divider" />}
                  </div>
                ))
              )}
            </div>

            <div className="reel-card__comment-input-row">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Add a comment…"
                className="reel-card__comment-input"
              />
              <button
                type="button"
                onClick={submitComment}
                className="reel-card__comment-send"
                aria-label="Send comment"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        )}
      </article>
      <ShareToChatModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareType="reel"
        shareItemId={reel.id}
        title="Share Reel"
        onDelivered={(count) => {
          setShareCount((prev) => {
            const next = prev + count
            onMetricsChange?.(reel.id, { shareCount: next })
            return next
          })
          setShared(true)
          setTimeout(() => setShared(false), 2000)
        }}
      />
    </>
  )
}
