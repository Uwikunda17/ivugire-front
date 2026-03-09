import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api } from '../api/client'
import { useToast } from '../state/ToastContext'

type PostKind = 'post' | 'reel'

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

export default function Create() {
  const { push } = useToast()
  const [caption, setCaption] = useState('')
  const [postKind, setPostKind] = useState<PostKind>('post')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const videoWillTrim = useMemo(() => {
    return !!(mediaFile && mediaFile.type.startsWith('video/') && (videoDuration || 0) > 300)
  }, [mediaFile, videoDuration])

  async function onMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setMediaFile(file)
    setStatus(null)
    if (!file) {
      setVideoDuration(null)
      return
    }

    const duration = await readVideoDuration(file)
    setVideoDuration(duration)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus(null)

    if (!mediaFile) {
      setStatus('Please choose a media file.')
      return
    }

    if (postKind === 'reel' && !mediaFile.type.startsWith('video/')) {
      setStatus('Reels only support video files.')
      return
    }

    const form = new FormData()
    form.append('caption', caption)
    form.append('postKind', postKind)
    form.append('media', mediaFile)
    if (videoDuration) form.append('mediaDurationSeconds', String(videoDuration))

    setLoading(true)
    try {
      const created = await api.createPost(form)
      setCaption('')
      setMediaFile(null)
      setVideoDuration(null)
      setStatus(
        created.isTrimmed
          ? 'Uploaded. Video was automatically limited to 5:00.'
          : 'Uploaded successfully.',
      )
      push({
        tone: 'success',
        title: 'Post published',
        message: created.isTrimmed ? 'Video was trimmed to 5 minutes.' : 'Your media is now live.',
      })
    } catch (err) {
      setStatus((err as Error).message)
      push({ tone: 'error', title: 'Publish failed', message: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="workspace-page space-y-4">
      <div className="workspace-panel">
        <h2 className="workspace-title">Create Post</h2>
        <p className="workspace-muted text-sm">Upload image, audio, or video. Reels auto-limit to 5 minutes.</p>
      </div>
      <form onSubmit={handleSubmit} className="workspace-panel space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setPostKind('post')}
            className={`rounded-xl py-2 border ${postKind === 'post' ? 'border-slate-700 text-slate-900 bg-slate-100' : 'border-slate-300 text-slate-500 bg-white'}`}
          >
            Post
          </button>
          <button
            type="button"
            onClick={() => setPostKind('reel')}
            className={`rounded-xl py-2 border ${postKind === 'reel' ? 'border-slate-700 text-slate-900 bg-slate-100' : 'border-slate-300 text-slate-500 bg-white'}`}
          >
            Reel
          </button>
        </div>

        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-slate-700 min-h-[120px] focus:border-slate-500 outline-none"
          placeholder="Write a caption..."
        />

        <input
          type="file"
          accept="image/*,video/*,audio/*"
          onChange={onMediaChange}
          className="w-full rounded-xl bg-white border border-slate-300 p-3 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-slate-700"
        />

        {mediaFile && (
          <div className="text-sm text-slate-500 space-y-1">
            <div>Selected: {mediaFile.name}</div>
            <div>Type: {mediaFile.type}</div>
            {videoDuration ? <div>Video length: {videoDuration}s</div> : null}
            {videoWillTrim ? (
              <div className="text-amber-700">
                Video is over 5 minutes and will be automatically trimmed to 5:00.
              </div>
            ) : null}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-60"
        >
          {loading ? 'Uploading...' : 'Publish'}
        </button>

        {status && <div className="text-sm text-slate-600">{status}</div>}
      </form>
    </section>
  )
}
