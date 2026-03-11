import { useEffect, useState } from 'react'
import { Eye, Heart, MessageCircle, SendHorizontal, Trash2, MapPin, Globe, Mail, LogOut } from 'lucide-react'
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
  if (!src) return <div className="pf-media-blank" />
  if (story.mediaType === 'image') return <img src={src} alt={story.caption || 'Story'} className="pf-media-fill" />
  if (story.mediaType === 'video') return <video src={src} muted playsInline className="pf-media-fill pf-media-dark" />
  return <div className="pf-media-audio">Audio story</div>
}

function PostPreview({ post }: { post: FeedItem }) {
  const src = resolveAsset(post.mediaUrl)
  if (!src) return <div className="pf-media-blank" />
  if (post.mediaType === 'image') return <img src={src} alt={post.caption || 'Post'} className="pf-media-fill" />
  if (post.mediaType === 'video') return <video src={src} muted playsInline className="pf-media-fill pf-media-dark" />
  return (
    <div className="pf-media-audio">
      <span className="pf-audio-label">Audio Post</span>
      <audio controls preload="metadata" style={{ width: '100%', maxWidth: 200 }}>
        <source src={src} />
      </audio>
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
      setLoading(true); setError(null)
      try {
        if (isOwnProfile) {
          const [profileResult, postsResult] = await Promise.allSettled([api.getProfile(), api.myPosts()])
          if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
          else { setError((profileResult.reason as Error).message); push({ tone: 'error', title: 'Profile unavailable', message: (profileResult.reason as Error).message }) }
          if (postsResult.status === 'fulfilled') setMyPosts(ensureArray<FeedItem>(postsResult.value))
          else { setStatus((postsResult.reason as Error).message); setMyPosts([]) }
        } else {
          if (!usernameParam) return
          const [profileResult] = await Promise.allSettled([api.getUserProfileByUsername(usernameParam)])
          if (profileResult.status === 'fulfilled') setProfile(profileResult.value)
          else { setError((profileResult.reason as Error).message); push({ tone: 'error', title: 'Profile unavailable', message: (profileResult.reason as Error).message }) }
          setMyPosts([])
        }
      } catch (err) { setError((err as Error).message) }
      finally { setLoading(false) }
    }
    void loadProfilePage()
  }, [usernameParam, isOwnProfile, push])

  useEffect(() => {
    async function loadStories() {
      try {
        const data = await api.myStories(storyScope)
        setStories(ensureArray<StoryItem>(data))
      } catch (err) {
        push({ tone: 'error', title: 'Stories unavailable', message: (err as Error).message })
      }
    }
    void loadStories()
  }, [push, storyScope])

  async function toggleStoryViewers(storyId: string) {
    if (openedStoryViewersId === storyId) { setOpenedStoryViewersId(null); return }
    if (!storyViewersById[storyId]) {
      try {
        const viewers = await api.storyViewers(storyId)
        setStoryViewersById((prev) => ({ ...prev, [storyId]: ensureArray<StoryViewer>(viewers) }))
      } catch (err) {
        push({ tone: 'error', title: 'Viewer list failed', message: (err as Error).message }); return
      }
    }
    setOpenedStoryViewersId(storyId)
  }

  async function removeMyPost(postId: string) {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setDeletingPostId(postId); setStatus(null)
    try {
      await api.deletePost(postId)
      setMyPosts((prev) => ensureArray<FeedItem>(prev).filter((p) => p.id !== postId))
      push({ tone: 'success', title: 'Post deleted', message: 'The post has been removed from your profile.' })
    } catch (err) {
      push({ tone: 'error', title: 'Delete failed', message: (err as Error).message })
    } finally { setDeletingPostId(null) }
  }

  if (loading) return <div className="pf-state">Loading profile…</div>
  if (error) return <div className="pf-state pf-state-error">{error}</div>
  if (!profile) return <div className="pf-state">Profile not found.</div>

  const avatarSrc = resolveAsset(profile.avatarUrl)
  const storyList = ensureArray<StoryItem>(stories)
  const postList = ensureArray<FeedItem>(myPosts)
  const initials = (profile.name || profile.email || '?').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{styles}</style>
      <div className="pf-root">

        {/* ── Hero header ── */}
        <div className="pf-hero">
          <div className="pf-hero-orb pf-orb-a" />
          <div className="pf-hero-orb pf-orb-b" />
          <div className="pf-hero-noise" />

          <div className="pf-hero-inner">
            <div className="pf-avatar-wrap">
              {avatarSrc
                ? <img src={avatarSrc} alt={profile.name} className="pf-avatar" />
                : <div className="pf-avatar pf-avatar-fallback">{initials}</div>
              }
            </div>

            <div className="pf-hero-info">
              <h1 className="pf-name">{profile.name}</h1>
              <span className="pf-handle">@{profile.username}</span>

              <div className="pf-meta-row">
                {profile.email && <span className="pf-meta-item"><Mail size={12} />{profile.email}</span>}
                {profile.location && <span className="pf-meta-item"><MapPin size={12} />{profile.location}</span>}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="pf-meta-item pf-meta-link">
                    <Globe size={12} />{profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>

            {isOwnProfile && (
              <button className="pf-logout-btn" onClick={logout}>
                <LogOut size={15} />
                Logout
              </button>
            )}
          </div>

          {profile.bio && (
            <p className="pf-bio">{profile.bio}</p>
          )}
        </div>

        {/* ── Stories ── */}
        <div className="pf-section">
          <div className="pf-section-header">
            <h2 className="pf-section-title">Stories</h2>
            <div className="pf-scope-toggle">
              <button
                className={`pf-scope-btn ${storyScope === 'active' ? 'active' : ''}`}
                onClick={() => setStoryScope('active')}
              >Active</button>
              <button
                className={`pf-scope-btn ${storyScope === 'archived' ? 'active' : ''}`}
                onClick={() => setStoryScope('archived')}
              >Archived</button>
            </div>
          </div>

          {storyList.length === 0 ? (
            <p className="pf-empty">No {storyScope} stories.</p>
          ) : (
            <div className="pf-grid pf-grid-stories">
              {storyList.map((story) => (
                <div key={story.id} className="pf-story-card">
                  <div className="pf-card-media">
                    <StoryMediaPreview story={story} />
                  </div>
                  <div className="pf-card-body">
                    <p className="pf-card-title">{story.caption || 'Story'}</p>
                    <div className="pf-card-dates">
                      <span>Posted {formatDate(story.createdAt)}</span>
                      <span>Expires {formatDate(story.expiresAt)}</span>
                    </div>
                    <div className="pf-viewer-row">
                      <span className="pf-viewer-count"><Eye size={12} /> {story.viewerCount || 0} viewers</span>
                      <button
                        className="pf-toggle-viewers-btn"
                        onClick={() => toggleStoryViewers(story.id)}
                      >
                        {openedStoryViewersId === story.id ? 'Hide' : 'Show'} viewers
                      </button>
                    </div>

                    {openedStoryViewersId === story.id && (
                      <div className="pf-viewers-list">
                        {ensureArray<StoryViewer>(storyViewersById[story.id]).length === 0
                          ? <span className="pf-viewers-empty">No viewers yet.</span>
                          : ensureArray<StoryViewer>(storyViewersById[story.id]).map((viewer) => (
                            <div key={`${viewer.id}-${viewer.viewedAt}`} className="pf-viewer-item">
                              {viewer.avatarUrl
                                ? <img src={resolveAsset(viewer.avatarUrl) || undefined} alt={viewer.name} className="pf-viewer-avatar" />
                                : <div className="pf-viewer-avatar pf-viewer-avatar-fallback">{viewer.name.slice(0, 1).toUpperCase()}</div>
                              }
                              <div className="pf-viewer-info">
                                <span className="pf-viewer-name">{viewer.name} <span className="pf-viewer-handle">@{viewer.username}</span></span>
                                <span className="pf-viewer-time">{formatDate(viewer.viewedAt)}</span>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Posts ── */}
        <div className="pf-section">
          <div className="pf-section-header">
            <h2 className="pf-section-title">Posts</h2>
            <span className="pf-hint">Hover for details</span>
          </div>

          {postList.length === 0 ? (
            <p className="pf-empty">No posts yet.</p>
          ) : (
            <div className="pf-grid pf-grid-posts">
              {postList.map((post) => (
                <article key={post.id} className="pf-post-card">
                  <PostPreview post={post} />
                  <div className="pf-post-overlay">
                    <p className="pf-post-caption">{post.caption || 'No caption'}</p>
                    <div className="pf-post-stats">
                      <span><Heart size={13} /> {post.likeCount || 0}</span>
                      <span><Eye size={13} /> {post.viewerCount || 0}</span>
                      <span><MessageCircle size={13} /> {post.commentCount || 0}</span>
                      <span><SendHorizontal size={13} /> {post.shareCount || 0}</span>
                    </div>
                    {isOwnProfile && (
                      <button
                        className="pf-delete-btn"
                        onClick={() => removeMyPost(post.id)}
                        disabled={deletingPostId === post.id}
                      >
                        <Trash2 size={13} />
                        {deletingPostId === post.id ? 'Deleting…' : 'Delete'}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer CTA ── */}
        {isOwnProfile && (
          <Link to="/profile/edit" className="pf-edit-link">
            Update Profile
          </Link>
        )}

        {status && <p className="pf-status">{status}</p>}
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .pf-root {
    font-family: 'DM Sans', sans-serif;
    color: #f0eee8;
    max-width: 960px;
    margin: 0 auto;
    padding: 24px 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* ── States ── */
  .pf-state {
    padding: 48px;
    text-align: center;
    color: rgba(240,238,232,0.4);
    font-size: 14px;
  }
  .pf-state-error { color: #f87171; }

  /* ── Hero ── */
  .pf-hero {
    position: relative;
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    overflow: hidden;
    padding: 32px 28px 24px;
  }
  .pf-hero-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
  }
  .pf-orb-a {
    width: 280px; height: 280px;
    top: -100px; left: -60px;
    background: radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%);
  }
  .pf-orb-b {
    width: 220px; height: 220px;
    top: -80px; right: 0;
    background: radial-gradient(circle, rgba(34,211,152,0.18) 0%, transparent 70%);
  }
  .pf-hero-noise {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
    background-size: 160px;
    opacity: 0.3; pointer-events: none;
  }
  .pf-hero-inner {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }
  .pf-avatar-wrap { flex-shrink: 0; }
  .pf-avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    border: 3px solid rgba(255,255,255,0.1);
    object-fit: cover;
    display: block;
  }
  .pf-avatar-fallback {
    background: linear-gradient(135deg, #7c3aed, #2dd4bf);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 26px; color: #fff;
  }
  .pf-hero-info { flex: 1; min-width: 0; }
  .pf-name {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 22px;
    letter-spacing: -0.5px; color: #f5f3ee;
    margin: 0 0 4px;
  }
  .pf-handle {
    font-size: 13px; color: rgba(255,255,255,0.38);
    display: block; margin-bottom: 10px;
  }
  .pf-meta-row {
    display: flex; flex-wrap: wrap; gap: 12px;
  }
  .pf-meta-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: rgba(255,255,255,0.38);
  }
  .pf-meta-link {
    color: rgba(139,92,246,0.7);
    text-decoration: none;
    transition: color 0.15s;
  }
  .pf-meta-link:hover { color: #a78bfa; }
  .pf-bio {
    position: relative; z-index: 2;
    margin: 20px 0 0;
    font-size: 14px; font-weight: 300;
    color: rgba(240,238,232,0.55);
    line-height: 1.7;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .pf-logout-btn {
    display: flex; align-items: center; gap: 7px;
    padding: 9px 16px;
    border-radius: 10px;
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.2);
    color: #f87171;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
    margin-left: auto;
  }
  .pf-logout-btn:hover {
    background: rgba(248,113,113,0.18);
    border-color: rgba(248,113,113,0.4);
  }

  /* ── Sections ── */
  .pf-section {
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 24px;
  }
  .pf-section-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .pf-section-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 16px;
    letter-spacing: -0.2px; color: #f5f3ee;
    margin: 0;
  }
  .pf-hint {
    font-size: 11.5px; color: rgba(255,255,255,0.25);
  }
  .pf-empty {
    font-size: 13.5px; color: rgba(255,255,255,0.3);
    font-weight: 300; padding: 8px 0;
  }

  /* ── Scope toggle ── */
  .pf-scope-toggle {
    display: flex;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 8px;
    padding: 3px;
    gap: 2px;
  }
  .pf-scope-btn {
    padding: 5px 14px;
    border-radius: 6px;
    background: transparent;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.4);
    cursor: pointer;
    transition: all 0.18s;
  }
  .pf-scope-btn.active {
    background: #7c3aed;
    color: #fff;
    box-shadow: 0 2px 8px rgba(124,58,237,0.3);
  }

  /* ── Grid ── */
  .pf-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
  }
  .pf-grid-stories { margin-top: 8px; }
  .pf-grid-posts { margin-top: 8px; }

  /* ── Story card ── */
  .pf-story-card {
    background: #131318;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    overflow: hidden;
  }
  .pf-card-media {
    height: 160px;
    background: #1a1a22;
    overflow: hidden;
  }
  .pf-card-body {
    padding: 14px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .pf-card-title {
    font-family: 'Syne', sans-serif;
    font-weight: 600; font-size: 13.5px;
    color: #f0eee8; margin: 0;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pf-card-dates {
    display: flex; flex-direction: column; gap: 2px;
    font-size: 11.5px; color: rgba(255,255,255,0.28);
  }
  .pf-viewer-row {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 6px;
    border-top: 1px solid rgba(255,255,255,0.05);
  }
  .pf-viewer-count {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: rgba(255,255,255,0.35);
  }
  .pf-toggle-viewers-btn {
    font-size: 11.5px; font-weight: 500;
    color: rgba(139,92,246,0.8);
    background: none; border: none; cursor: pointer;
    padding: 0; transition: color 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .pf-toggle-viewers-btn:hover { color: #a78bfa; }
  .pf-viewers-list {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 10px;
    max-height: 180px;
    overflow-y: auto;
    display: flex; flex-direction: column; gap: 10px;
  }
  .pf-viewers-empty { font-size: 12px; color: rgba(255,255,255,0.3); }
  .pf-viewer-item {
    display: flex; align-items: center; gap: 10px;
  }
  .pf-viewer-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.1);
    display: block;
  }
  .pf-viewer-avatar-fallback {
    background: linear-gradient(135deg, #7c3aed, #2dd4bf);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }
  .pf-viewer-info {
    display: flex; flex-direction: column; gap: 1px; min-width: 0;
  }
  .pf-viewer-name {
    font-size: 12px; color: rgba(255,255,255,0.7);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .pf-viewer-handle { color: rgba(255,255,255,0.35); }
  .pf-viewer-time { font-size: 11px; color: rgba(255,255,255,0.28); }

  /* ── Post card ── */
  .pf-post-card {
    position: relative;
    height: 240px;
    border-radius: 14px;
    overflow: hidden;
    background: #1a1a22;
    border: 1px solid rgba(255,255,255,0.07);
  }
  .pf-post-overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 50%, transparent 100%);
    padding: 14px;
    display: flex; flex-direction: column; justify-content: flex-end; gap: 10px;
    opacity: 0;
    transition: opacity 0.22s ease;
  }
  .pf-post-card:hover .pf-post-overlay { opacity: 1; }
  .pf-post-caption {
    font-size: 12.5px; font-weight: 300;
    color: rgba(255,255,255,0.75);
    line-height: 1.5;
    max-height: 40px; overflow: hidden;
    margin: 0;
  }
  .pf-post-stats {
    display: grid; grid-template-columns: 1fr 1fr 1fr 1fr;
    gap: 6px;
  }
  .pf-post-stats span {
    display: flex; align-items: center; gap: 5px;
    font-size: 12px; color: rgba(255,255,255,0.6);
  }
  .pf-delete-btn {
    display: flex; align-items: center; gap: 6px;
    align-self: flex-end;
    padding: 7px 14px;
    border-radius: 8px;
    background: rgba(248,113,113,0.15);
    border: 1px solid rgba(248,113,113,0.3);
    color: #f87171;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px; font-weight: 500;
    cursor: pointer;
    transition: all 0.18s;
  }
  .pf-delete-btn:hover { background: rgba(248,113,113,0.25); }
  .pf-delete-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Media helpers ── */
  .pf-media-blank { width: 100%; height: 100%; background: #1a1a22; }
  .pf-media-fill { width: 100%; height: 100%; object-fit: cover; display: block; }
  .pf-media-dark { background: #000; }
  .pf-media-audio {
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 10px; padding: 12px;
    background: #131318;
  }
  .pf-audio-label {
    font-size: 12px; font-weight: 500;
    color: rgba(255,255,255,0.4);
  }

  /* ── Edit link ── */
  .pf-edit-link {
    display: block; text-align: center;
    padding: 14px;
    border-radius: 14px;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    color: #fff;
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 14px;
    letter-spacing: 0.2px;
    text-decoration: none;
    box-shadow: 0 4px 20px rgba(124,58,237,0.3);
    transition: all 0.18s;
  }
  .pf-edit-link:hover {
    background: linear-gradient(135deg, #6d28d9, #5b21b6);
    box-shadow: 0 6px 28px rgba(124,58,237,0.45);
    transform: translateY(-1px);
  }

  /* ── Status ── */
  .pf-status {
    font-size: 12.5px; color: rgba(255,255,255,0.35);
    text-align: center; padding: 4px 0;
  }

  /* ── Mobile tweaks ── */
  @media (max-width: 640px) {
    .pf-root { padding: 12px 10px 80px; gap: 16px; }
    .pf-hero { padding: 22px 18px 18px; border-radius: 16px; }
    .pf-hero-inner { align-items: flex-start; }
    .pf-avatar { width: 70px; height: 70px; }
    .pf-name { font-size: 18px; }
    .pf-handle { font-size: 12px; }
    .pf-meta-row { gap: 8px; }

    /* Stories: horizontal strip */
    .pf-grid-stories {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding: 6px 2px 4px;
      scrollbar-width: none;
    }
    .pf-grid-stories::-webkit-scrollbar { display: none; }
    .pf-story-card {
      min-width: 96px;
      max-width: 110px;
      border-radius: 14px;
      background: #111115;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .pf-card-media { height: 96px; border-bottom: 0; }
    .pf-card-body { padding: 10px; gap: 6px; }
    .pf-card-title { font-size: 12px; }
    .pf-card-dates { display: none; }
    .pf-viewer-row { display: none; }

    /* Posts: 3-up square grid */
    .pf-grid { gap: 6px; }
    .pf-grid-posts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .pf-post-card { height: 120px; border-radius: 10px; }
    .pf-post-overlay {
      background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.35));
      padding: 10px;
    }
    .pf-post-caption { font-size: 11px; max-height: 34px; }
    .pf-post-stats { grid-template-columns: repeat(2, 1fr); }
    .pf-post-stats span { font-size: 11px; }
    .pf-delete-btn { font-size: 11px; padding: 6px 10px; }
  }
`
