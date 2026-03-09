import { useMemo, useState } from 'react'
import { Heart, MessageCircle, SendHorizontal } from 'lucide-react'
import { api, type FeedItem, type PostComment } from '../../api/client'
import ShareToChatModal from '../chat/ShareToChatModal'
import MediaRenderer from './MediaRenderer'
import { API_URL } from '../../api/client'

type Props = {
  post: FeedItem
  onMetricsChange?: (postId: string, changes: Partial<FeedItem>) => void
}

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString()
}

function extractTopKeyword(comments: PostComment[]) {
  const stop = new Set(['this', 'that', 'with', 'have', 'your', 'from', 'they', 'were', 'just', 'what', 'when'])
  const counts = new Map<string, number>()
  for (const c of comments) {
    const words = c.body.toLowerCase().match(/[a-z]{4,}/g) || []
    for (const w of words) {
      if (stop.has(w)) continue
      counts.set(w, (counts.get(w) || 0) + 1)
    }
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return top ? top[0] : null
}

function resolveAvatar(url?: string | null) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}

export default function PostCard({ post, onMetricsChange }: Props) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [shareCount, setShareCount] = useState(post.shareCount || 0)
  const [commentCount, setCommentCount] = useState(post.commentCount || 0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)
  const [shareOpen, setShareOpen] = useState(false)

  const topKeyword = useMemo(() => extractTopKeyword(comments), [comments])
  const avatarUrl = resolveAvatar(post.authorAvatarUrl)

  async function handleLike() {
    const result = await api.toggleLike(post.id)
    setLiked(result.liked)
    setLikeCount(result.likeCount)
    onMetricsChange?.(post.id, { likedByMe: result.liked, likeCount: result.likeCount })
  }

  async function toggleComments() {
    const nextOpen = !commentsOpen
    setCommentsOpen(nextOpen)
    if (!nextOpen || comments.length > 0) return

    setCommentLoading(true)
    setCommentError(null)
    try {
      const list = await api.listComments(post.id)
      setComments(list)
    } catch (error) {
      setCommentError((error as Error).message)
    } finally {
      setCommentLoading(false)
    }
  }

  async function submitComment() {
    const content = newComment.trim()
    if (!content) return
    setCommentError(null)
    try {
      const saved = await api.addComment(post.id, content)
      const temp: PostComment = {
        id: saved.id,
        body: saved.body,
        createdAt: saved.createdAt,
        userId: 'me',
        userName: 'You',
        username: 'you',
      }
      setComments((prev) => [...prev, temp])
      setCommentCount(saved.commentCount)
      onMetricsChange?.(post.id, { commentCount: saved.commentCount })
      setNewComment('')
    } catch (error) {
      setCommentError((error as Error).message)
    }
  }

  return (
    <article className="w-full max-w-[560px] mx-auto rounded-2xl overflow-hidden shadow-xl border border-slate-200/80 bg-white">
      <MediaRenderer
        mediaUrl={post.mediaUrl}
        mediaType={post.mediaType}
        trimEndSeconds={post.trimEndSeconds}
        className="w-full h-[520px] object-cover bg-black"
      />
      <div className="p-4 space-y-3 text-slate-800">
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            {avatarUrl ? (
              <img src={avatarUrl} alt={post.authorName} className="h-9 w-9 rounded-full object-cover border border-slate-200" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold grid place-items-center">
                {post.authorName.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold text-slate-900">{post.authorName}</div>
              <div>@{post.authorUsername || post.authorEmail}</div>
            </div>
          </div>
          <div>{formatDate(post.createdAt)}</div>
        </div>

        <p className="text-slate-800 whitespace-pre-wrap">{post.caption || 'No caption'}</p>

        {post.isTrimmed ? (
          <div className="text-xs text-amber-700 bg-amber-50 rounded-lg px-2 py-1 inline-block">
            Long video automatically limited to 5:00
          </div>
        ) : null}

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-2 transition ${liked ? 'text-rose-600' : 'text-slate-500 hover:text-rose-600'}`}
          >
            <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            {likeCount}
          </button>
          <button
            type="button"
            onClick={toggleComments}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition"
          >
            <MessageCircle size={16} />
            {commentCount}
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition"
          >
            <SendHorizontal size={16} />
            {shareCount}
          </button>
        </div>

        {commentsOpen ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Quick Interpreter</div>
            <div className="text-xs text-slate-600">
              Media: <span className="font-semibold">{post.mediaType}</span> | Comments:{' '}
              <span className="font-semibold">{commentCount}</span>{' '}
              {topKeyword ? (
                <>
                  | Top keyword: <span className="font-semibold">{topKeyword}</span>
                </>
              ) : null}
            </div>

            {commentLoading ? <div className="text-xs text-slate-500">Loading comments...</div> : null}
            {commentError ? <div className="text-xs text-red-600">{commentError}</div> : null}

            <div className="max-h-52 overflow-y-auto space-y-2">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-lg bg-white border border-slate-200 px-2 py-2">
                  <div className="text-xs font-semibold text-slate-700">
                    {comment.userName} @{comment.username}
                  </div>
                  <div className="text-sm text-slate-700">{comment.body}</div>
                </div>
              ))}
              {!commentLoading && comments.length === 0 ? (
                <div className="text-xs text-slate-500">No comments yet.</div>
              ) : null}
            </div>

            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="Add a comment"
                className="flex-1 h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700 outline-none focus:border-slate-500"
              />
              <button
                type="button"
                onClick={submitComment}
                className="rounded-lg bg-black text-white px-3 text-sm"
              >
                Send
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <ShareToChatModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        shareType={post.postKind === 'reel' ? 'reel' : 'post'}
        shareItemId={post.id}
        title={`Share ${post.postKind === 'reel' ? 'Reel' : 'Post'}`}
        onDelivered={(count) => {
          setShareCount((prev) => {
            const next = prev + count
            onMetricsChange?.(post.id, { shareCount: next })
            return next
          })
        }}
      />
    </article>
  )
}
