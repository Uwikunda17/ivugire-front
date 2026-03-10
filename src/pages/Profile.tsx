import { useEffect, useState } from 'react'
import { Eye, Heart, MessageCircle, SendHorizontal, Trash2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { API_URL, api, type FeedItem, type StoryItem, type StoryViewer, type UserProfile } from '../api/client'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'

function resolveAsset(url?: string | null) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}

function formatDate(isoTime: string) {
  return new Date(isoTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

type StoryScope = 'active' | 'archived'

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function StoryMediaPreview({ story }: { story: StoryItem }) {
  const src = resolveAsset(story.mediaUrl)
  if (!src) return <div className="h-full w-full bg-slate-200" />

  if (story.mediaType === 'image') {
    return <img src={src} alt={story.caption || 'Story'} className="h-full w-full object-cover" />
  }
  if (story.mediaType === 'video') {
    return <video src={src} muted playsInline className="h-full w-full object-cover bg-black" />
  }
  return (
    <div className="h-full w-full bg-slate-100 grid place-items-center text-slate-600 text-xs px-2 text-center">
      Audio story
    </div>
  )
}

function PostPreview({ post }: { post: FeedItem }) {
  const src = resolveAsset(post.mediaUrl)
  if (!src) return <div className="h-full w-full bg-slate-200" />
  if (post.mediaType === 'image') {
    return <img src={src} alt={post.caption || 'Post'} className="h-full w-full object-cover" />
  }
  if (post.mediaType === 'video') {
    return <video src={src} muted playsInline className="h-full w-full object-cover bg-black" />
  }
  return (
    <div className="h-full w-full bg-slate-100 grid place-items-center px-3 text-center">
      <div className="space-y-2">
        <div className="text-sm font-semibold text-slate-700">Audio Post</div>
        <audio controls preload="metadata" className="w-full max-w-[220px]">
          <source src={src} />
        </audio>
      </div>
    </div>
  )
}

export default function Profile() {
  const { logout } = useAuth()
  const { push } = useToast()
  const { username: usernameParam } = useParams<{ username?: string }>()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [myPosts, setMyPosts] = useState<FeedItem[]>([])
  const [stories, setStories] = useState<StoryItem[]>([])
  const [storyScope, setStoryScope] = useState<StoryScope>('active')
  const [storyViewersById, setStoryViewersById] = useState<Record<string, StoryViewer[]>>({})
  const [openedStoryViewersId, setOpenedStoryViewersId] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const isOwnProfile = !usernameParam

  useEffect(() => {
    async function loadProfilePage() {
      setLoading(true)
      setError(null)
      try {
        if (isOwnProfile) {
          // Load current user's profile
          const [profileResult, postsResult] = await Promise.allSettled([api.getProfile(), api.myPosts()])

          if (profileResult.status === 'fulfilled') {
            setProfile(profileResult.value)
          } else {
            setError((profileResult.reason as Error).message)
            push({ tone: 'error', title: 'Profile unavailable', message: (profileResult.reason as Error).message })
          }

          if (postsResult.status === 'fulfilled') {
            setMyPosts(ensureArray<FeedItem>(postsResult.value))
          } else {
            setStatus((postsResult.reason as Error).message)
            setMyPosts([])
          }
        } else {
          // Load other user's profile - posts not yet available
          if (!usernameParam) return
          const profileResult = await Promise.allSettled([api.getUserProfileByUsername(usernameParam)])

          if (profileResult[0].status === 'fulfilled') {
            setProfile(profileResult[0].value)
          } else {
            setError((profileResult[0].reason as Error).message)
            push({ tone: 'error', title: 'Profile unavailable', message: (profileResult[0].reason as Error).message })
          }

          setMyPosts([])
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
    void loadProfilePage()
  }, [usernameParam, isOwnProfile, push])

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await api.myStories(storyScope)
        setStories(ensureArray<StoryItem>(data))
      } catch (err) {
        setStatus((err as Error).message)
        push({ tone: 'error', title: 'Stories unavailable', message: (err as Error).message })
      }
    }
    void loadStories()
  }, [push, storyScope])

  async function toggleStoryViewers(storyId: string) {
    if (openedStoryViewersId === storyId) {
      setOpenedStoryViewersId(null)
      return
    }

    if (!storyViewersById[storyId]) {
      try {
        const viewers = await api.storyViewers(storyId)
        setStoryViewersById((prev) => ({ ...prev, [storyId]: ensureArray<StoryViewer>(viewers) }))
      } catch (err) {
        setStatus((err as Error).message)
        push({ tone: 'error', title: 'Viewer list failed', message: (err as Error).message })
        return
      }
    }

    setOpenedStoryViewersId(storyId)
  }

  async function removeMyPost(postId: string) {
    const shouldDelete = window.confirm('Delete this post? This cannot be undone.')
    if (!shouldDelete) return

    setDeletingPostId(postId)
    setStatus(null)
    try {
      await api.deletePost(postId)
      setMyPosts((prev) => ensureArray<FeedItem>(prev).filter((post) => post.id !== postId))
      setStatus('Post deleted.')
      push({ tone: 'success', title: 'Post deleted', message: 'The post has been removed from your profile.' })
    } catch (err) {
      setStatus((err as Error).message)
      push({ tone: 'error', title: 'Delete failed', message: (err as Error).message })
    } finally {
      setDeletingPostId(null)
    }
  }

  if (loading) return <div className="text-muted">Loading profile...</div>
  if (error) return <div className="text-red-400">{error}</div>
  if (!profile) return <div className="text-muted">Profile not found.</div>

  const avatarSrc = resolveAsset(profile.avatarUrl)
  const storyList = ensureArray<StoryItem>(stories)
  const postList = ensureArray<FeedItem>(myPosts)

  return (
    <section className="workspace-page space-y-4">
      <div className="workspace-panel flex items-center gap-4">
        {avatarSrc ? (
          <img src={avatarSrc} alt={profile.name} className="h-16 w-16 rounded-full object-cover border border-slate-300" />
        ) : (
          <div className="h-16 w-16 rounded-full bg-slate-200 text-slate-700 grid place-items-center text-xl font-bold">
            {profile.name?.[0] || profile.email[0]}
          </div>
        )}
        <div className="space-y-1">
          <div className="text-lg font-heading text-slate-900">{profile.name}</div>
          <div className="text-slate-500">@{profile.username}</div>
          <div className="text-sm text-slate-500">{profile.email}</div>
        </div>
        {isOwnProfile && (
          <button
            onClick={logout}
            className="ml-auto px-4 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200"
          >
            Logout
          </button>
        )}
      </div>

      <div className="workspace-panel space-y-3">
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">Bio</div>
          <div className="text-slate-800">{profile.bio || 'No bio yet'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">Location</div>
          <div className="text-slate-800">{profile.location || 'Not set'}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">Website</div>
          <div className="text-slate-800">{profile.website || 'Not set'}</div>
        </div>
      </div>

      <div className="workspace-panel space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="workspace-title">Stories</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStoryScope('active')}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                storyScope === 'active'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStoryScope('archived')}
              className={`px-3 py-1.5 rounded-lg text-xs border ${
                storyScope === 'archived'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-slate-600 border-slate-300'
              }`}
            >
              Archived
            </button>
          </div>
        </div>

        {storyList.length === 0 ? (
          <div className="text-sm text-slate-500">No {storyScope} stories.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {storyList.map((story) => (
              <div key={story.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="h-40 bg-slate-100">
                  <StoryMediaPreview story={story} />
                </div>
                <div className="p-3 space-y-2">
                  <div className="text-sm font-semibold text-slate-800">{story.caption || 'Story'}</div>
                  <div className="text-xs text-slate-500">Posted: {formatDate(story.createdAt)}</div>
                  <div className="text-xs text-slate-500">Expires: {formatDate(story.expiresAt)}</div>
                  <div className="text-xs text-slate-600">Viewers: {story.viewerCount || 0}</div>
                  <button
                    type="button"
                    onClick={() => toggleStoryViewers(story.id)}
                    className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-700"
                  >
                    {openedStoryViewersId === story.id ? 'Hide viewers' : 'View viewers'}
                  </button>

                  {openedStoryViewersId === story.id ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2 max-h-44 overflow-y-auto space-y-2">
                      {ensureArray<StoryViewer>(storyViewersById[story.id]).length === 0 ? (
                        <div className="text-xs text-slate-500">No viewers yet.</div>
                      ) : (
                        ensureArray<StoryViewer>(storyViewersById[story.id]).map((viewer) => (
                          <div key={`${viewer.id}-${viewer.viewedAt}`} className="flex items-center gap-2">
                            {viewer.avatarUrl ? (
                              <img
                                src={resolveAsset(viewer.avatarUrl) || undefined}
                                alt={viewer.name}
                                className="h-7 w-7 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-slate-200 text-slate-600 text-[10px] font-semibold grid place-items-center">
                                {viewer.name.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs text-slate-700 truncate">
                                {viewer.name} @{viewer.username}
                              </div>
                              <div className="text-[11px] text-slate-500">{formatDate(viewer.viewedAt)}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="workspace-panel space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="workspace-title">My Posts</h3>
          <span className="text-xs text-slate-500">Hover to see stats and delete</span>
        </div>

        {postList.length === 0 ? (
          <div className="text-sm text-slate-500">You have not posted anything yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {postList.map((post) => (
              <article key={post.id} className="group relative h-64 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <PostPreview post={post} />
                <div className="absolute inset-0 bg-black/60 text-white p-3 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between">
                  <div className="space-y-2 text-sm">
                    <div className="text-xs leading-5 max-h-10 overflow-hidden">{post.caption || 'No caption'}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Heart size={13} />
                        {post.likeCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye size={13} />
                        {post.viewerCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle size={13} />
                        {post.commentCount || 0}
                      </div>
                      <div className="flex items-center gap-1">
                        <SendHorizontal size={13} />
                        {post.shareCount || 0}
                      </div>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => removeMyPost(post.id)}
                      disabled={deletingPostId === post.id}
                      className="self-end rounded-lg bg-red-600/90 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 flex items-center gap-1"
                    >
                      <Trash2 size={13} />
                      {deletingPostId === post.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {isOwnProfile && (
        <Link
          to="/profile/edit"
          className="block text-center py-3 rounded-xl bg-black text-white font-semibold"
        >
          Update Profile
        </Link>
      )}

      {status ? <p className="text-sm text-slate-600">{status}</p> : null}
    </section>
  )
}
