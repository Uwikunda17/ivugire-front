import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { CirclePlus, RefreshCcw, SendHorizontal, Upload, UserPlus, X } from 'lucide-react'
import { API_URL, api, type FeedItem, type StoryItem, type UserSearchResult } from '../api/client'
import ShareToChatModal from '../components/chat/ShareToChatModal'
import MediaRenderer from '../components/cards/MediaRenderer'
import PostCard from '../components/cards/PostCard'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'

type StoryComposerStep = 'upload' | 'details'
type StoryAnimationPreset = 'none' | 'pulse' | 'float' | 'glow' | 'wave'
type StoryMediaFilter = 'none' | 'grayscale' | 'warm' | 'cool' | 'vivid'
type StoryWordFilter = 'none' | 'mild' | 'strict'

const animationChoices: StoryAnimationPreset[] = ['none', 'pulse', 'float', 'glow', 'wave']
const filterChoices: StoryMediaFilter[] = ['none', 'grayscale', 'warm', 'cool', 'vivid']
const wordFilterChoices: StoryWordFilter[] = ['none', 'mild', 'strict']

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}
function resolveMediaUrl(url?: string | null) {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}
function formatStoryTime(isoTime: string) {
  return new Date(isoTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function filterClass(filter?: string | null) { return `story-filter-${filter || 'none'}` }
function animationClass(animation?: string | null) {
  if (animation === 'pulse') return 'animate-pulse'
  if (animation === 'glow') return 'shadow-[0_0_36px_rgba(34,211,238,0.28)]'
  return `story-animate-${animation || 'none'}`
}
async function readVideoDuration(file: File): Promise<number | null> {
  if (!file.type.startsWith('video/')) return null
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.src = url
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(Math.floor(video.duration || 0)) }
    video.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
  })
}

function StoryCard({ story, onOpen, isOwner }: { story: StoryItem; onOpen: () => void; isOwner: boolean }) {
  const avatar = resolveMediaUrl(story.authorAvatarUrl)
  const repostAvatar = resolveMediaUrl(story.repostFromUserAvatarUrl)
  const viewed = !!story.viewedByMe || isOwner

  return (
    <button type="button" onClick={onOpen} className="hm-story-btn">
      <div className="hm-story-ring-wrap">
        <div className={`hm-story-ring ${viewed ? 'hm-ring-viewed' : 'hm-ring-unseen'}`}>
          {avatar
            ? <img src={avatar} alt={story.authorName || 'Story'} className="hm-story-avatar" />
            : <div className="hm-story-avatar hm-story-avatar-fallback">{(story.authorName || story.authorUsername || '?').slice(0, 1).toUpperCase()}</div>
          }
        </div>
        {repostAvatar && (
          <img src={repostAvatar} alt={story.repostFromUserName || ''} className="hm-story-repost-badge" />
        )}
      </div>
      <span className="hm-story-label">{story.authorUsername || story.authorName || 'Story'}</span>
    </button>
  )
}

function AddStoryTile({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="hm-story-btn">
      <div className="hm-story-ring-wrap">
        <div className="hm-add-ring">
          <CirclePlus size={22} />
        </div>
      </div>
      <span className="hm-story-label">Add Story</span>
    </button>
  )
}

export default function Home() {
  const { user } = useAuth()
  const { push } = useToast()
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const [posts, setPosts] = useState<FeedItem[]>([])
  const [stories, setStories] = useState<StoryItem[]>([])
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null)
  const [shareStoryOpen, setShareStoryOpen] = useState(false)
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerStep, setComposerStep] = useState<StoryComposerStep>('upload')
  const [storyFile, setStoryFile] = useState<File | null>(null)
  const [storyPreviewUrl, setStoryPreviewUrl] = useState<string | null>(null)
  const [storyDuration, setStoryDuration] = useState<number | null>(null)
  const [storyCaption, setStoryCaption] = useState('')
  const [storyStickerText, setStoryStickerText] = useState('')
  const [storyAnimationPreset, setStoryAnimationPreset] = useState<StoryAnimationPreset>('none')
  const [storyMediaFilter, setStoryMediaFilter] = useState<StoryMediaFilter>('none')
  const [storyWordFilter, setStoryWordFilter] = useState<StoryWordFilter>('none')
  const [tagQuery, setTagQuery] = useState('')
  const [tagResults, setTagResults] = useState<UserSearchResult[]>([])
  const [taggedUsers, setTaggedUsers] = useState<UserSearchResult[]>([])
  const [publishingStory, setPublishingStory] = useState(false)
  const [repostingStoryId, setRepostingStoryId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHome() {
      setLoading(true); setError(null)
      const [feedResult, storiesResult] = await Promise.allSettled([api.feed(), api.activeStories()])
      if (feedResult.status === 'fulfilled') setPosts(ensureArray<FeedItem>(feedResult.value))
      else { setError((feedResult.reason as Error).message); push({ tone: 'error', title: 'Feed unavailable', message: (feedResult.reason as Error).message }) }
      if (storiesResult.status === 'fulfilled') setStories(ensureArray<StoryItem>(storiesResult.value))
      else { push({ tone: 'info', title: 'Stories unavailable', message: (storiesResult.reason as Error).message }); setStories([]) }
      setLoading(false)
    }
    void loadHome()
  }, [push])

  useEffect(() => {
    if (!storyFile) { setStoryPreviewUrl(null); return }
    const url = URL.createObjectURL(storyFile)
    setStoryPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [storyFile])

  useEffect(() => {
    if (!composerOpen || composerStep !== 'details') { setTagResults([]); return }
    const trimmed = tagQuery.trim()
    if (trimmed.length < 2) { setTagResults([]); return }
    const timer = window.setTimeout(() => {
      void api.searchUsers(trimmed).then((results) => {
        const ids = new Set(taggedUsers.map((e) => e.id))
        setTagResults(results.filter((e) => !ids.has(e.id)))
      }).catch((err) => { push({ tone: 'error', title: 'Search failed', message: (err as Error).message }); setTagResults([]) })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [composerOpen, composerStep, tagQuery, taggedUsers, push])

  function resetComposer() {
    setComposerOpen(false); setComposerStep('upload'); setStoryFile(null)
    setStoryPreviewUrl(null); setStoryDuration(null); setStoryCaption('')
    setStoryStickerText(''); setStoryAnimationPreset('none'); setStoryMediaFilter('none')
    setStoryWordFilter('none'); setTagQuery(''); setTagResults([]); setTaggedUsers([])
  }

  function handleMetricsChange(postId: string, changes: Partial<FeedItem>) {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...changes } : post)))
  }

  async function onStoryMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setStoryFile(file)
    if (!file) { setStoryDuration(null); setComposerStep('upload'); return }
    const duration = await readVideoDuration(file)
    setStoryDuration(duration)
    setComposerStep('details')
  }

  function addTaggedUser(entry: UserSearchResult) {
    setTaggedUsers((prev) => [...prev, entry])
    setTagResults((prev) => prev.filter((r) => r.id !== entry.id))
    setTagQuery('')
  }

  async function publishStory(event: FormEvent) {
    event.preventDefault()
    if (!storyFile) { push({ tone: 'error', title: 'No media selected', message: 'Choose a file first.' }); return }
    setPublishingStory(true)
    try {
      const form = new FormData()
      form.append('media', storyFile)
      form.append('caption', storyCaption)
      form.append('stickerText', storyStickerText)
      form.append('animationPreset', storyAnimationPreset)
      form.append('mediaFilter', storyMediaFilter)
      form.append('wordFilterLevel', storyWordFilter)
      form.append('taggedUserIds', JSON.stringify(taggedUsers.map((e) => e.id)))
      if (storyDuration) form.append('mediaDurationSeconds', String(storyDuration))
      const created = await api.createStory(form)
      setStories((prev) => [created, ...ensureArray<StoryItem>(prev)])
      resetComposer()
      push({ tone: 'success', title: 'Story published', message: created.isTrimmed ? 'Video was trimmed to 5 minutes.' : 'Story is live for 24 hours.' })
    } catch (err) {
      push({ tone: 'error', title: 'Publish failed', message: (err as Error).message })
    } finally { setPublishingStory(false) }
  }

  async function openStory(story: StoryItem) {
    setSelectedStory(story)
    if (story.authorId && story.authorId !== user?.id && !story.viewedByMe) {
      try {
        await api.viewStory(story.id)
        setStories((prev) => ensureArray<StoryItem>(prev).map((e) =>
          e.id === story.id ? { ...e, viewedByMe: true, viewerCount: (e.viewerCount || 0) + 1 } : e
        ))
      } catch (err) {
        push({ tone: 'info', title: 'Opened story', message: (err as Error).message })
      }
    }
  }

  async function repostStory(story: StoryItem) {
    setRepostingStoryId(story.id)
    try {
      const reposted = await api.repostStory(story.id, { caption: story.caption })
      setStories((prev) => [reposted, ...ensureArray<StoryItem>(prev)])
      push({ tone: 'success', title: 'Story reposted', message: 'The original author is marked on the card.' })
    } catch (err) {
      push({ tone: 'error', title: 'Repost failed', message: (err as Error).message })
    } finally { setRepostingStoryId(null) }
  }

  if (loading) return <div className="hm-state">Loading feed…</div>

  const storyList = ensureArray<StoryItem>(stories)
  const postList = ensureArray<FeedItem>(posts)

  return (
    <>
      <style>{styles}</style>
      <div className="hm-root">
        {error && <div className="hm-error">{error}</div>}

        {/* ── Stories strip ── */}
        <div className="hm-panel">
          <div className="hm-panel-header">
            <div>
              <h2 className="hm-panel-title">Stories</h2>
              <p className="hm-panel-sub">Tap your circle to upload · live for 24h</p>
            </div>
            <span className="hm-badge-24">24h</span>
          </div>
          <div className="hm-stories-track">
            <AddStoryTile onOpen={() => { resetComposer(); setComposerOpen(true) }} />
            {storyList.map((story) => (
              <StoryCard key={story.id} story={story} isOwner={story.authorId === user?.id} onOpen={() => void openStory(story)} />
            ))}
            {storyList.length === 0 && (
              <p className="hm-stories-empty">No active stories yet — start the first one.</p>
            )}
          </div>
        </div>

        {/* ── Feed ── */}
        <div className="hm-panel hm-feed-header">
          <h2 className="hm-panel-title">Feed</h2>
          <p className="hm-panel-sub">Posts with likes, comments, and shares.</p>
        </div>

        {postList.length === 0 ? (
          <div className="hm-panel hm-empty">
            {error ? 'Feed temporarily unavailable. Restart the backend and refresh.' : 'Feed is empty. Upload your first post from the Create tab.'}
          </div>
        ) : (
          postList.map((post) => <PostCard key={post.id} post={post} onMetricsChange={handleMetricsChange} />)
        )}

        {/* ── Story Composer Modal ── */}
        {composerOpen && (
          <div className="hm-overlay">
            <div className="hm-modal hm-composer-modal">
              {/* Modal header */}
              <div className="hm-modal-header">
                <div>
                  <span className="hm-modal-eyebrow">Story Studio</span>
                  <h3 className="hm-modal-title">{composerStep === 'upload' ? 'Choose Media' : 'Style & Publish'}</h3>
                </div>
                <button className="hm-close-btn" onClick={resetComposer}><X size={16} /></button>
              </div>

              {composerStep === 'upload' ? (
                <div className="hm-upload-grid">
                  <div className="hm-upload-hero">
                    <span className="hm-upload-step">Step 1</span>
                    <h4 className="hm-upload-heading">Upload your story media first.</h4>
                    <p className="hm-upload-desc">After uploading you can style, caption, tag users, and publish.</p>
                  </div>
                  <div className="hm-upload-drop">
                    <input ref={uploadInputRef} type="file" accept="image/*,video/*,audio/*" onChange={onStoryMediaChange} className="hidden" />
                    <button type="button" onClick={() => uploadInputRef.current?.click()} className="hm-upload-btn">
                      <Upload size={26} />
                    </button>
                    <p className="hm-upload-label">Upload Story Media</p>
                    <p className="hm-upload-hint">Image · Video · Audio</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={publishStory} className="hm-details-grid">
                  {/* Preview */}
                  <div className="hm-preview-col">
                    <div className="hm-preview-frame">
                      {storyPreviewUrl && storyFile ? (
                        <>
                          {storyFile.type.startsWith('image/') && (
                            <img src={storyPreviewUrl} alt={storyFile.name} className={`hm-preview-media ${filterClass(storyMediaFilter)} ${animationClass(storyAnimationPreset)}`} />
                          )}
                          {storyFile.type.startsWith('video/') && (
                            <video src={storyPreviewUrl} controls className={`hm-preview-media ${filterClass(storyMediaFilter)} ${animationClass(storyAnimationPreset)}`} />
                          )}
                          {!storyFile.type.startsWith('image/') && !storyFile.type.startsWith('video/') && (
                            <div className={`hm-preview-audio ${animationClass(storyAnimationPreset)}`}>
                              <span className="hm-preview-audio-label">Audio Story</span>
                              <p className="hm-preview-audio-caption">{storyCaption || 'Voice moment'}</p>
                              <audio controls preload="metadata" style={{ width: 'min(320px,80vw)' }}>
                                <source src={storyPreviewUrl} />
                              </audio>
                            </div>
                          )}
                          {storyStickerText && (
                            <div className="hm-sticker">{storyStickerText}</div>
                          )}
                        </>
                      ) : null}
                    </div>
                    <div className="hm-file-meta">
                      <span className="hm-meta-chip">{storyFile?.name}</span>
                      <span className="hm-meta-chip">{storyDuration ? `${storyDuration}s` : 'No duration'}</span>
                      <span className={`hm-meta-chip ${(storyDuration || 0) > 300 ? 'hm-meta-warn' : ''}`}>
                        {(storyDuration || 0) > 300 ? 'Auto-trim 5:00' : 'Ready'}
                      </span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="hm-controls-col">
                    <div className="hm-ctrl-panel">
                      <textarea value={storyCaption} onChange={(e) => setStoryCaption(e.target.value)} placeholder="Write the story caption…" className="hm-textarea" />
                      <input value={storyStickerText} onChange={(e) => setStoryStickerText(e.target.value)} placeholder="Sticker text" className="hm-input" />
                      <div className="hm-selects-row">
                        <select value={storyAnimationPreset} onChange={(e) => setStoryAnimationPreset(e.target.value as StoryAnimationPreset)} className="hm-select">
                          {animationChoices.map((c) => <option key={c} value={c}>animation: {c}</option>)}
                        </select>
                        <select value={storyMediaFilter} onChange={(e) => setStoryMediaFilter(e.target.value as StoryMediaFilter)} className="hm-select">
                          {filterChoices.map((c) => <option key={c} value={c}>filter: {c}</option>)}
                        </select>
                      </div>
                      <select value={storyWordFilter} onChange={(e) => setStoryWordFilter(e.target.value as StoryWordFilter)} className="hm-select hm-select-full">
                        {wordFilterChoices.map((c) => <option key={c} value={c}>word filter: {c}</option>)}
                      </select>
                    </div>

                    <div className="hm-ctrl-panel">
                      <input value={tagQuery} onChange={(e) => setTagQuery(e.target.value)} placeholder="Search to tag users…" className="hm-input" />
                      {tagResults.length > 0 && (
                        <div className="hm-tag-results">
                          {tagResults.map((entry) => (
                            <button key={entry.id} type="button" onClick={() => addTaggedUser(entry)} className="hm-tag-result-item">
                              <div>
                                <div className="hm-tag-name">{entry.name}</div>
                                <div className="hm-tag-handle">@{entry.username}</div>
                              </div>
                              <UserPlus size={15} />
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="hm-tagged-list">
                        {taggedUsers.length === 0
                          ? <span className="hm-no-tags">No tagged users.</span>
                          : taggedUsers.map((entry) => (
                            <button key={entry.id} type="button" onClick={() => setTaggedUsers((p) => p.filter((e) => e.id !== entry.id))} className="hm-tag-chip">
                              @{entry.username} <X size={10} />
                            </button>
                          ))
                        }
                      </div>
                    </div>

                    <div className="hm-composer-footer">
                      <button type="button" onClick={() => setComposerStep('upload')} className="hm-ghost-btn">
                        Change upload
                      </button>
                      <button type="submit" disabled={publishingStory} className="hm-publish-btn">
                        {publishingStory ? 'Publishing…' : 'Publish Story'}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── Story Viewer Modal ── */}
        {selectedStory && (
          <div className="hm-overlay">
            <div className="hm-modal hm-viewer-modal">
              <div className="hm-modal-header">
                <div>
                  <p className="hm-viewer-name">{selectedStory.authorName || selectedStory.authorUsername || 'Story'}</p>
                  <p className="hm-viewer-time">{formatStoryTime(selectedStory.createdAt)}</p>
                  {selectedStory.repostFromUserUsername && (
                    <p className="hm-viewer-repost">Shared from @{selectedStory.repostFromUserUsername}</p>
                  )}
                </div>
                <div className="hm-viewer-actions">
                  <button className="hm-viewer-btn" onClick={() => setShareStoryOpen(true)}>
                    <SendHorizontal size={14} /> Share
                  </button>
                  <button className="hm-viewer-btn" onClick={() => void repostStory(selectedStory)} disabled={repostingStoryId === selectedStory.id}>
                    <RefreshCcw size={14} /> {repostingStoryId === selectedStory.id ? 'Reposting…' : 'Repost'}
                  </button>
                  <button className="hm-close-btn" onClick={() => setSelectedStory(null)}><X size={16} /></button>
                </div>
              </div>
              <div className={`${filterClass(selectedStory.mediaFilter)} ${animationClass(selectedStory.animationPreset)}`}>
                <MediaRenderer
                  mediaUrl={selectedStory.mediaUrl}
                  mediaType={selectedStory.mediaType}
                  trimEndSeconds={selectedStory.trimEndSeconds}
                  className={selectedStory.mediaType === 'audio' ? 'p-8 bg-slate-900' : 'h-[72vh] w-full object-contain bg-black'}
                />
              </div>
              {selectedStory.caption && (
                <div className="hm-viewer-caption">{selectedStory.caption}</div>
              )}
            </div>
          </div>
        )}

        <ShareToChatModal
          open={shareStoryOpen && !!selectedStory}
          onClose={() => setShareStoryOpen(false)}
          shareType="story"
          shareItemId={selectedStory?.id || ''}
          title="Share Story"
        />
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .hm-root {
    font-family: 'DM Sans', sans-serif;
    color: #f0eee8;
    display: flex; flex-direction: column; gap: 16px;
    padding-bottom: 32px;
  }

  .hm-state {
    padding: 48px; text-align: center;
    color: rgba(240,238,232,0.4); font-size: 14px;
  }
  .hm-error {
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    border-radius: 14px; padding: 14px 18px;
    font-size: 13.5px; color: #f87171;
  }

  /* ── Panel ── */
  .hm-panel {
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 20px 20px 18px;
  }
  .hm-panel-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 18px;
  }
  .hm-panel-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 17px;
    letter-spacing: -0.3px; color: #f5f3ee; margin: 0 0 4px;
  }
  .hm-panel-sub {
    font-size: 12.5px; font-weight: 300;
    color: rgba(255,255,255,0.35); margin: 0;
  }
  .hm-badge-24 {
    font-family: 'Syne', sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 1.5px; color: #22d3a0;
    background: rgba(34,211,160,0.1);
    border: 1px solid rgba(34,211,160,0.2);
    border-radius: 6px; padding: 3px 8px;
  }
  .hm-feed-header { padding-bottom: 16px; }
  .hm-empty {
    font-size: 13.5px; font-weight: 300;
    color: rgba(255,255,255,0.35); line-height: 1.6;
  }

  /* ── Stories track ── */
  .hm-stories-track {
    display: flex; gap: 14px;
    overflow-x: auto; padding-bottom: 4px;
    scrollbar-width: none;
  }
  .hm-stories-track::-webkit-scrollbar { display: none; }
  .hm-stories-empty {
    font-size: 12.5px; color: rgba(255,255,255,0.28);
    font-weight: 300; padding: 8px 0; white-space: nowrap;
  }

  /* Story tiles */
  .hm-story-btn {
    display: flex; flex-direction: column; align-items: center;
    gap: 7px; flex-shrink: 0;
    background: none; border: none; cursor: pointer;
    padding: 0; transition: transform 0.18s;
    -webkit-tap-highlight-color: transparent;
  }
  .hm-story-btn:hover { transform: translateY(-2px); }
  .hm-story-ring-wrap { position: relative; width: 68px; height: 68px; }
  .hm-story-ring {
    width: 100%; height: 100%; border-radius: 50%;
    padding: 3px; display: block;
  }
  .hm-ring-unseen {
    background: conic-gradient(from 220deg, #7c3aed 0deg, #2dd4bf 160deg, #7c3aed 360deg);
  }
  .hm-ring-viewed {
    background: rgba(255,255,255,0.08);
    border: 1.5px dashed rgba(255,255,255,0.2);
  }
  .hm-story-avatar {
    width: 100%; height: 100%;
    border-radius: 50%; object-fit: cover;
    border: 3px solid #0e0e12; display: block;
  }
  .hm-story-avatar-fallback {
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #7c3aed, #2dd4bf);
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 20px; color: #fff;
  }
  .hm-story-repost-badge {
    position: absolute; bottom: 0; right: 0;
    width: 22px; height: 22px; border-radius: 50%;
    border: 2px solid #0e0e12; object-fit: cover;
  }
  .hm-add-ring {
    width: 100%; height: 100%; border-radius: 50%;
    background: rgba(255,255,255,0.05);
    border: 1.5px dashed rgba(255,255,255,0.18);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.4);
    transition: border-color 0.18s, color 0.18s;
  }
  .hm-story-btn:hover .hm-add-ring {
    border-color: rgba(124,58,237,0.5); color: #c4b5fd;
  }
  .hm-story-label {
    font-size: 10.5px; font-weight: 400;
    color: rgba(255,255,255,0.45);
    max-width: 68px; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap;
    text-align: center;
  }

  /* ── Overlay ── */
  .hm-overlay {
    position: fixed; inset: 0; z-index: 70;
    display: grid; place-items: center;
    background: rgba(0,0,0,0.72);
    backdrop-filter: blur(12px);
    padding: 16px;
  }
  .hm-modal {
    width: 100%; background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: 0 32px 80px rgba(0,0,0,0.7);
    max-height: 92vh; overflow-y: auto;
  }
  .hm-composer-modal { max-width: 960px; }
  .hm-viewer-modal { max-width: 800px; }

  .hm-modal-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  .hm-modal-eyebrow {
    font-size: 10.5px; font-weight: 500;
    letter-spacing: 1.8px; text-transform: uppercase;
    color: #22d3a0; display: block; margin-bottom: 5px;
  }
  .hm-modal-title {
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 20px;
    color: #f5f3ee; margin: 0; letter-spacing: -0.4px;
  }
  .hm-close-btn {
    width: 34px; height: 34px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: background 0.18s, color 0.18s;
  }
  .hm-close-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

  /* ── Upload step ── */
  .hm-upload-grid {
    display: grid; gap: 20px; padding: 24px;
  }
  @media (min-width: 640px) { .hm-upload-grid { grid-template-columns: 1.1fr 0.9fr; } }
  .hm-upload-hero {
    background: linear-gradient(140deg, #1a0a2e, #0d1a3a);
    border-radius: 18px; padding: 28px;
    border: 1px solid rgba(124,58,237,0.2);
  }
  .hm-upload-step {
    font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase;
    color: #22d3a0; font-weight: 600;
  }
  .hm-upload-heading {
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 22px;
    color: #f5f3ee; margin: 10px 0 14px;
    letter-spacing: -0.4px; line-height: 1.25;
  }
  .hm-upload-desc {
    font-size: 13.5px; font-weight: 300;
    color: rgba(240,238,232,0.5); line-height: 1.7; margin: 0;
  }
  .hm-upload-drop {
    background: rgba(255,255,255,0.03);
    border: 1.5px dashed rgba(255,255,255,0.12);
    border-radius: 18px; padding: 36px 24px;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
    transition: border-color 0.18s;
  }
  .hm-upload-drop:hover { border-color: rgba(124,58,237,0.4); }
  .hm-upload-btn {
    width: 72px; height: 72px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    display: flex; align-items: center; justify-content: center;
    color: #fff; border: none; cursor: pointer;
    box-shadow: 0 4px 20px rgba(124,58,237,0.4);
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .hm-upload-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(124,58,237,0.5); }
  .hm-upload-label {
    font-family: 'Syne', sans-serif;
    font-weight: 600; font-size: 15px; color: #f0eee8; margin: 0;
  }
  .hm-upload-hint { font-size: 12px; color: rgba(255,255,255,0.3); margin: 0; }

  /* ── Details step ── */
  .hm-details-grid {
    display: grid; gap: 20px; padding: 24px;
  }
  @media (min-width: 768px) { .hm-details-grid { grid-template-columns: 1.05fr 0.95fr; } }

  .hm-preview-col { display: flex; flex-direction: column; gap: 12px; }
  .hm-preview-frame {
    position: relative; background: #060608;
    border-radius: 18px; overflow: hidden;
    min-height: 300px;
  }
  .hm-preview-media {
    height: 400px; width: 100%; object-fit: cover; display: block;
  }
  .hm-preview-audio {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; padding: 40px 24px; min-height: 300px;
    background: #0d0d14;
  }
  .hm-preview-audio-label {
    font-size: 10.5px; letter-spacing: 2px; text-transform: uppercase; color: #22d3a0;
  }
  .hm-preview-audio-caption {
    font-family: 'Syne', sans-serif; font-weight: 600; font-size: 18px;
    color: #f0eee8; text-align: center; margin: 0;
  }
  .hm-sticker {
    position: absolute; top: 14px; left: 14px;
    background: rgba(255,255,255,0.12); backdrop-filter: blur(8px);
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 20px; padding: 6px 14px;
    font-size: 13px; font-weight: 500; color: #fff;
  }
  .hm-file-meta {
    display: flex; gap: 8px; flex-wrap: wrap;
  }
  .hm-meta-chip {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px; padding: 6px 12px;
    font-size: 12px; color: rgba(255,255,255,0.5);
    flex: 1; min-width: 80px; text-align: center;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .hm-meta-warn { color: #fbbf24; border-color: rgba(251,191,36,0.25); }

  .hm-controls-col { display: flex; flex-direction: column; gap: 14px; }
  .hm-ctrl-panel {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 16px; padding: 16px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .hm-textarea {
    width: 100%; min-height: 100px; resize: vertical;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px; padding: 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px; font-weight: 300;
    color: #f0eee8; outline: none; line-height: 1.6;
    transition: border-color 0.18s;
    box-sizing: border-box;
  }
  .hm-textarea::placeholder { color: rgba(255,255,255,0.25); }
  .hm-textarea:focus { border-color: rgba(124,58,237,0.4); }
  .hm-input {
    width: 100%; height: 44px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px; padding: 0 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13.5px;
    color: #f0eee8; outline: none;
    transition: border-color 0.18s; box-sizing: border-box;
  }
  .hm-input::placeholder { color: rgba(255,255,255,0.25); }
  .hm-input:focus { border-color: rgba(124,58,237,0.4); }
  .hm-selects-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .hm-select {
    height: 44px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 12px; padding: 0 12px;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    color: rgba(255,255,255,0.6); outline: none;
    cursor: pointer;
  }
  .hm-select-full { width: 100%; }
  .hm-select option { background: #1a1a22; color: #f0eee8; }

  .hm-tag-results {
    display: flex; flex-direction: column; gap: 6px;
    max-height: 150px; overflow-y: auto;
  }
  .hm-tag-result-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 10px; cursor: pointer;
    color: rgba(255,255,255,0.6);
    transition: background 0.15s, border-color 0.15s;
    text-align: left;
  }
  .hm-tag-result-item:hover { background: rgba(124,58,237,0.12); border-color: rgba(124,58,237,0.25); color: #c4b5fd; }
  .hm-tag-name { font-size: 13px; font-weight: 500; color: #f0eee8; }
  .hm-tag-handle { font-size: 11.5px; color: rgba(255,255,255,0.35); }
  .hm-tagged-list { display: flex; flex-wrap: wrap; gap: 6px; min-height: 28px; }
  .hm-no-tags { font-size: 12.5px; color: rgba(255,255,255,0.28); font-weight: 300; }
  .hm-tag-chip {
    display: flex; align-items: center; gap: 5px;
    padding: 5px 12px;
    background: rgba(124,58,237,0.12);
    border: 1px solid rgba(124,58,237,0.25);
    border-radius: 20px; color: #c4b5fd;
    font-size: 12px; font-weight: 500; cursor: pointer;
    transition: background 0.15s;
  }
  .hm-tag-chip:hover { background: rgba(248,113,113,0.12); border-color: rgba(248,113,113,0.25); color: #f87171; }

  .hm-composer-footer {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .hm-ghost-btn {
    padding: 10px 18px; border-radius: 10px;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.5);
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.18s;
  }
  .hm-ghost-btn:hover { background: rgba(255,255,255,0.09); color: rgba(255,255,255,0.75); }
  .hm-publish-btn {
    padding: 11px 24px; border-radius: 10px;
    background: linear-gradient(135deg, #7c3aed, #5b21b6);
    border: none; color: #fff;
    font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13.5px;
    cursor: pointer; box-shadow: 0 4px 16px rgba(124,58,237,0.35);
    transition: all 0.18s; letter-spacing: 0.1px;
  }
  .hm-publish-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(124,58,237,0.5); }
  .hm-publish-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

  /* ── Viewer modal ── */
  .hm-viewer-name {
    font-family: 'Syne', sans-serif;
    font-weight: 600; font-size: 15px; color: #f0eee8; margin: 0 0 3px;
  }
  .hm-viewer-time { font-size: 12px; color: rgba(255,255,255,0.35); margin: 0; }
  .hm-viewer-repost {
    font-size: 10.5px; letter-spacing: 1.5px; text-transform: uppercase;
    color: #22d3a0; margin: 5px 0 0;
  }
  .hm-viewer-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .hm-viewer-btn {
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 10px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.7);
    font-family: 'DM Sans', sans-serif; font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.18s;
  }
  .hm-viewer-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .hm-viewer-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .hm-viewer-caption {
    padding: 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.07);
    font-size: 13.5px; font-weight: 300;
    color: rgba(240,238,232,0.6); line-height: 1.6;
  }
`