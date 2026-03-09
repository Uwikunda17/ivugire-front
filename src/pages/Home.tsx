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
  return new Date(isoTime).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function filterClass(filter?: string | null) {
  return `story-filter-${filter || 'none'}`
}

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
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Math.floor(video.duration || 0))
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
  })
}

function StoryCard({ story, onOpen, isOwner }: { story: StoryItem; onOpen: () => void; isOwner: boolean }) {
  const avatar = resolveMediaUrl(story.authorAvatarUrl)
  const repostAvatar = resolveMediaUrl(story.repostFromUserAvatarUrl)
  const viewed = !!story.viewedByMe || isOwner

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-w-[78px] max-w-[78px] flex-col items-center text-center transition hover:-translate-y-0.5"
    >
      <div className="relative mb-2 h-[72px] w-[72px]">
        <div
          className={`h-full w-full rounded-full p-[3px] ${
            viewed
              ? 'border border-dashed border-slate-300 bg-white'
              : 'bg-[conic-gradient(from_220deg,#f59e0b_0deg,#f43f5e_110deg,#a855f7_220deg,#f59e0b_360deg)]'
          }`}
        >
          {avatar ? (
            <img
              src={avatar}
              alt={story.authorName || 'Story'}
              className="h-full w-full rounded-full border-[3px] border-white object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center rounded-full border-[3px] border-white bg-slate-200 text-sm font-semibold text-slate-700">
              {(story.authorName || story.authorUsername || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        {repostAvatar ? (
          <img
            src={repostAvatar}
            alt={story.repostFromUserName || 'Shared from'}
            className="absolute bottom-0 right-0 h-6 w-6 rounded-full border-2 border-white object-cover shadow-md"
          />
        ) : null}
      </div>
      <div className="w-full truncate text-[11px] font-medium text-slate-700">
        {story.authorUsername || story.authorName || 'Story'}
      </div>
    </button>
  )
}

function AddStoryTile({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-w-[78px] max-w-[78px] flex-col items-center text-center transition hover:-translate-y-0.5"
    >
      <div className="mb-2 grid h-[72px] w-[72px] place-items-center rounded-full border-2 border-dashed border-slate-300 bg-white text-slate-400 transition group-hover:border-slate-400 group-hover:text-slate-600">
        <CirclePlus size={24} />
      </div>
      <div className="w-full truncate text-[11px] font-medium text-slate-700">Add Story</div>
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
      setLoading(true)
      setError(null)
      const [feedResult, storiesResult] = await Promise.allSettled([api.feed(), api.activeStories()])

      if (feedResult.status === 'fulfilled') {
        setPosts(ensureArray<FeedItem>(feedResult.value))
      } else {
        const message = (feedResult.reason as Error).message
        setError(message)
        push({ tone: 'error', title: 'Feed unavailable', message })
      }

      if (storiesResult.status === 'fulfilled') {
        setStories(ensureArray<StoryItem>(storiesResult.value))
      } else {
        push({ tone: 'info', title: 'Stories unavailable', message: (storiesResult.reason as Error).message })
        setStories([])
      }

      setLoading(false)
    }

    void loadHome()
  }, [push])

  useEffect(() => {
    if (!storyFile) {
      setStoryPreviewUrl(null)
      return
    }
    const previewUrl = URL.createObjectURL(storyFile)
    setStoryPreviewUrl(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [storyFile])

  useEffect(() => {
    if (!composerOpen || composerStep !== 'details') {
      setTagResults([])
      return
    }

    const trimmed = tagQuery.trim()
    if (trimmed.length < 2) {
      setTagResults([])
      return
    }

    const timer = window.setTimeout(() => {
      void api.searchUsers(trimmed)
        .then((results) => {
          const selectedIds = new Set(taggedUsers.map((entry) => entry.id))
          setTagResults(results.filter((entry) => !selectedIds.has(entry.id)))
        })
        .catch((err) => {
          push({ tone: 'error', title: 'Search failed', message: (err as Error).message })
          setTagResults([])
        })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [composerOpen, composerStep, tagQuery, taggedUsers, push])

  function resetComposer() {
    setComposerOpen(false)
    setComposerStep('upload')
    setStoryFile(null)
    setStoryPreviewUrl(null)
    setStoryDuration(null)
    setStoryCaption('')
    setStoryStickerText('')
    setStoryAnimationPreset('none')
    setStoryMediaFilter('none')
    setStoryWordFilter('none')
    setTagQuery('')
    setTagResults([])
    setTaggedUsers([])
  }

  function handleMetricsChange(postId: string, changes: Partial<FeedItem>) {
    setPosts((prev) => prev.map((post) => (post.id === postId ? { ...post, ...changes } : post)))
  }

  async function onStoryMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setStoryFile(file)
    if (!file) {
      setStoryDuration(null)
      setComposerStep('upload')
      return
    }
    const duration = await readVideoDuration(file)
    setStoryDuration(duration)
    setComposerStep('details')
  }

  function addTaggedUser(entry: UserSearchResult) {
    setTaggedUsers((prev) => [...prev, entry])
    setTagResults((prev) => prev.filter((result) => result.id !== entry.id))
    setTagQuery('')
  }

  function removeTaggedUser(userId: string) {
    setTaggedUsers((prev) => prev.filter((entry) => entry.id !== userId))
  }

  async function publishStory(event: FormEvent) {
    event.preventDefault()
    if (!storyFile) {
      push({ tone: 'error', title: 'No media selected', message: 'Choose a file first.' })
      return
    }

    setPublishingStory(true)
    try {
      const form = new FormData()
      form.append('media', storyFile)
      form.append('caption', storyCaption)
      form.append('stickerText', storyStickerText)
      form.append('animationPreset', storyAnimationPreset)
      form.append('mediaFilter', storyMediaFilter)
      form.append('wordFilterLevel', storyWordFilter)
      form.append('taggedUserIds', JSON.stringify(taggedUsers.map((entry) => entry.id)))
      if (storyDuration) form.append('mediaDurationSeconds', String(storyDuration))

      const created = await api.createStory(form)
      setStories((prev) => [created, ...ensureArray<StoryItem>(prev)])
      resetComposer()
      push({
        tone: 'success',
        title: 'Story published',
        message: created.isTrimmed ? 'Video was trimmed to 5 minutes automatically.' : 'Story is live for 24 hours.',
      })
    } catch (err) {
      push({ tone: 'error', title: 'Publish failed', message: (err as Error).message })
    } finally {
      setPublishingStory(false)
    }
  }

  async function openStory(story: StoryItem) {
    setSelectedStory(story)
    if (story.authorId && story.authorId !== user?.id && !story.viewedByMe) {
      try {
        await api.viewStory(story.id)
        setStories((prev) =>
          ensureArray<StoryItem>(prev).map((entry) =>
            entry.id === story.id
              ? { ...entry, viewedByMe: true, viewerCount: (entry.viewerCount || 0) + 1 }
              : entry,
          ),
        )
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
    } finally {
      setRepostingStoryId(null)
    }
  }

  if (loading) return <div className="text-muted">Loading feed...</div>

  const storyList = ensureArray<StoryItem>(stories)
  const postList = ensureArray<FeedItem>(posts)

  return (
    <section className="space-y-4">
      {error ? <div className="workspace-panel text-red-500">{error}</div> : null}
      <div className="workspace-panel">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="workspace-title">Stories</h2>
            <p className="mt-1 text-sm text-slate-500">Tap your circle to upload, then style and publish.</p>
          </div>
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">24h</div>
        </div>

        <div className="mt-5 rounded-[28px] border border-slate-200/80 bg-white/80 px-4 py-4">
          <div className="flex gap-4 overflow-x-auto pb-1">
            <AddStoryTile
              onOpen={() => {
                resetComposer()
                setComposerOpen(true)
              }}
            />
          {storyList.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              isOwner={story.authorId === user?.id}
              onOpen={() => void openStory(story)}
            />
          ))}
          </div>
        </div>

        {storyList.length === 0 ? (
          <div className="mt-3 text-sm text-slate-500">
            No active stories yet. Start the first one from the add circle.
          </div>
        ) : null}
      </div>

      <div className="workspace-panel">
        <h2 className="workspace-title">Feed</h2>
        <p className="workspace-muted mt-1 text-sm">Posts are interactive with likes, comments, and shares.</p>
      </div>

      {postList.length === 0 ? (
        <div className="workspace-panel workspace-muted">
          {error ? 'Feed is temporarily unavailable. Restart the backend and refresh.' : 'Feed is empty. Upload your first image, video, or audio post from the Create tab.'}
        </div>
      ) : (
        postList.map((post) => <PostCard key={post.id} post={post} onMetricsChange={handleMetricsChange} />)
      )}

      {composerOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/30 bg-[linear-gradient(135deg,rgba(247,250,249,0.98),rgba(227,238,236,0.96))] shadow-[0_34px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
              <div>
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Story Studio</div>
                <div className="mt-1 font-heading text-2xl text-slate-900">
                  {composerStep === 'upload' ? 'Choose Media' : 'Style And Publish'}
                </div>
              </div>
              <button type="button" onClick={resetComposer} className="rounded-full border border-slate-200 bg-white p-2 text-slate-500">
                <X size={18} />
              </button>
            </div>

            {composerStep === 'upload' ? (
              <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[28px] bg-[linear-gradient(145deg,#0f172a,#111827)] p-6 text-slate-100">
                  <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Step 1</div>
                  <div className="mt-3 text-3xl font-heading">Upload the story media first.</div>
                  <div className="mt-4 text-sm leading-6 text-slate-300">
                    After upload you can write the caption, add sticker text, choose animation, apply filters, tag users, and publish.
                  </div>
                </div>

                <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/90 p-6 text-center">
                  <input
                    ref={uploadInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*"
                    onChange={onStoryMediaChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                    className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-black text-white shadow-lg"
                  >
                    <Upload size={30} />
                  </button>
                  <div className="mt-5 text-lg font-heading text-slate-900">Upload Story Media</div>
                  <div className="mt-2 text-sm text-slate-500">Supported: image, video, audio.</div>
                </div>
              </div>
            ) : (
              <form onSubmit={publishStory} className="grid gap-6 p-6 lg:grid-cols-[1.06fr_0.94fr]">
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-[30px] border border-white/30 bg-slate-950">
                    {storyPreviewUrl && storyFile ? (
                      <>
                        {storyFile.type.startsWith('image/') ? (
                          <img
                            src={storyPreviewUrl}
                            alt={storyFile.name}
                            className={`h-[420px] w-full object-cover ${filterClass(storyMediaFilter)} ${animationClass(storyAnimationPreset)}`}
                          />
                        ) : storyFile.type.startsWith('video/') ? (
                          <video
                            src={storyPreviewUrl}
                            controls
                            className={`h-[420px] w-full object-cover ${filterClass(storyMediaFilter)} ${animationClass(storyAnimationPreset)}`}
                          />
                        ) : (
                          <div className={`grid h-[420px] place-items-center bg-slate-900 text-slate-100 ${animationClass(storyAnimationPreset)}`}>
                            <div className="text-center">
                              <div className="text-xs uppercase tracking-[0.24em] text-cyan-300">Audio Story</div>
                              <div className="mt-3 text-2xl font-heading">{storyCaption || 'Voice moment'}</div>
                              <audio controls preload="metadata" className="mt-5 w-[min(320px,80vw)]">
                                <source src={storyPreviewUrl} />
                              </audio>
                            </div>
                          </div>
                        )}
                        {storyStickerText ? (
                          <div className="absolute left-5 top-5 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                            {storyStickerText}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  <div className="grid gap-3 rounded-[22px] border border-slate-200 bg-white/92 p-4 md:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-800">
                      {storyFile?.name}
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-800">
                      {storyDuration ? `${storyDuration}s` : 'No duration'}
                    </div>
                    <div className={`rounded-2xl bg-slate-50 p-3 text-sm font-semibold ${(storyDuration || 0) > 300 ? 'text-amber-700' : 'text-slate-800'}`}>
                      {(storyDuration || 0) > 300 ? 'Auto-trim to 5:00' : 'Ready'}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-white/94 p-5">
                    <textarea
                      value={storyCaption}
                      onChange={(event) => setStoryCaption(event.target.value)}
                      placeholder="Write the story caption"
                      className="min-h-[110px] w-full rounded-2xl border border-slate-300 bg-slate-50 p-3 text-sm text-slate-700 outline-none focus:border-slate-500"
                    />
                    <input
                      value={storyStickerText}
                      onChange={(event) => setStoryStickerText(event.target.value)}
                      placeholder="Sticker text"
                      className="mt-3 h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-500"
                    />
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <select
                        value={storyAnimationPreset}
                        onChange={(event) => setStoryAnimationPreset(event.target.value as StoryAnimationPreset)}
                        className="h-12 rounded-2xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                      >
                        {animationChoices.map((choice) => (
                          <option key={choice} value={choice}>
                            animation: {choice}
                          </option>
                        ))}
                      </select>
                      <select
                        value={storyMediaFilter}
                        onChange={(event) => setStoryMediaFilter(event.target.value as StoryMediaFilter)}
                        className="h-12 rounded-2xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                      >
                        {filterChoices.map((choice) => (
                          <option key={choice} value={choice}>
                            filter: {choice}
                          </option>
                        ))}
                      </select>
                    </div>
                    <select
                      value={storyWordFilter}
                      onChange={(event) => setStoryWordFilter(event.target.value as StoryWordFilter)}
                      className="mt-3 h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                    >
                      {wordFilterChoices.map((choice) => (
                        <option key={choice} value={choice}>
                          word filter: {choice}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-white/94 p-5">
                    <input
                      value={tagQuery}
                      onChange={(event) => setTagQuery(event.target.value)}
                      placeholder="Search username or email to tag"
                      className="h-12 w-full rounded-2xl border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none"
                    />

                    {tagResults.length > 0 ? (
                      <div className="mt-3 max-h-36 space-y-2 overflow-y-auto">
                        {tagResults.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => addTaggedUser(entry)}
                            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left"
                          >
                            <div>
                              <div className="text-sm font-semibold text-slate-800">{entry.name}</div>
                              <div className="text-xs text-slate-500">@{entry.username}</div>
                            </div>
                            <UserPlus size={16} className="text-slate-500" />
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap gap-2">
                      {taggedUsers.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => removeTaggedUser(entry.id)}
                          className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-800"
                        >
                          @{entry.username} x
                        </button>
                      ))}
                      {taggedUsers.length === 0 ? <div className="text-sm text-slate-500">No tagged users.</div> : null}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setComposerStep('upload')}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                    >
                      Change upload
                    </button>
                    <button
                      type="submit"
                      disabled={publishingStory}
                      className="rounded-full bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {publishingStory ? 'Publishing...' : 'Publish Story'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}

      {selectedStory ? (
        <div className="fixed inset-0 z-[72] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/20 bg-[linear-gradient(140deg,#0f172a,#111827)] text-white shadow-[0_30px_80px_rgba(0,0,0,0.4)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-semibold">{selectedStory.authorName || selectedStory.authorUsername || 'Story'}</div>
                <div className="text-xs text-slate-300">{formatStoryTime(selectedStory.createdAt)}</div>
                {selectedStory.repostFromUserUsername ? (
                  <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-cyan-300">
                    Shared from @{selectedStory.repostFromUserUsername}
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShareStoryOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white"
                >
                  <SendHorizontal size={14} />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => void repostStory(selectedStory)}
                  disabled={repostingStoryId === selectedStory.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <RefreshCcw size={14} />
                  {repostingStoryId === selectedStory.id ? 'Reposting...' : 'Repost'}
                </button>
                <button type="button" onClick={() => setSelectedStory(null)} className="rounded-full border border-white/15 bg-white/10 p-2">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className={`overflow-hidden ${filterClass(selectedStory.mediaFilter)} ${animationClass(selectedStory.animationPreset)}`}>
              <MediaRenderer
                mediaUrl={selectedStory.mediaUrl}
                mediaType={selectedStory.mediaType}
                trimEndSeconds={selectedStory.trimEndSeconds}
                className={selectedStory.mediaType === 'audio' ? 'p-8 bg-slate-900' : 'h-[72vh] w-full object-contain bg-black'}
              />
            </div>
            <div className="border-t border-white/10 px-5 py-4 text-sm text-slate-200">
              {selectedStory.caption || 'No caption'}
            </div>
          </div>
        </div>
      ) : null}
      <ShareToChatModal
        open={shareStoryOpen && !!selectedStory}
        onClose={() => setShareStoryOpen(false)}
        shareType="story"
        shareItemId={selectedStory?.id || ''}
        title="Share Story"
      />
    </section>
  )
}
