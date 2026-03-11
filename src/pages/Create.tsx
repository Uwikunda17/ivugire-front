import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { api } from '../api/client'
import { useToast } from '../state/ToastContext'

type PostKind = 'post' | 'reel'

type MediaFileWithDuration = {
  file: File
  duration: number | null
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

const TrashIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
)

async function readVideoDuration(file: File): Promise<number | null> {
  if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) return null
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
  const [mediaFiles, setMediaFiles] = useState<MediaFileWithDuration[]>([])
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const PHOTO_LIMIT = 10
  const VIDEO_LIMIT = 3

  const photoCount = mediaFiles.filter((m) => m.file.type.startsWith('image/')).length
  const videoCount = mediaFiles.filter((m) => m.file.type.startsWith('video/') || m.file.type.startsWith('audio/')).length
  
  const canAddPhotos = photoCount < PHOTO_LIMIT
  const canAddVideos = videoCount < VIDEO_LIMIT

  const currentMedia = mediaFiles[currentMediaIndex]

  const videoWillTrim = useMemo(() => {
    return !!(currentMedia && currentMedia.file.type.startsWith('video/') && (currentMedia.duration || 0) > 300)
  }, [currentMedia])

  async function onMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || [])
    
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/') || file.type.startsWith('audio/')

      if (!isImage && !isVideo) {
        setStatus(`${file.name} is not a valid image or video file.`)
        continue
      }

      if (isImage && photoCount >= PHOTO_LIMIT) {
        setStatus(`Maximum ${PHOTO_LIMIT} photos allowed.`)
        break
      }

      if (isVideo && videoCount >= VIDEO_LIMIT) {
        setStatus(`Maximum ${VIDEO_LIMIT} videos allowed.`)
        break
      }

      const duration = await readVideoDuration(file)
      setMediaFiles((prev) => [...prev, { file, duration }])
    }

    // Reset input
    event.target.value = ''
  }

  function removeMedia(index: number) {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index))
    if (currentMediaIndex >= mediaFiles.length - 1) {
      setCurrentMediaIndex(Math.max(0, mediaFiles.length - 2))
    }
  }

  function navigateMedia(direction: 'next' | 'prev') {
    if (direction === 'next' && currentMediaIndex < mediaFiles.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1)
    } else if (direction === 'prev' && currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1)
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus(null)

    if (mediaFiles.length === 0) {
      setStatus('Please add at least one media file.')
      return
    }

    if (postKind === 'reel' && mediaFiles.some((m) => !m.file.type.startsWith('video/'))) {
      setStatus('Reels only support video files.')
      return
    }

    const form = new FormData()
    form.append('caption', caption)
    form.append('postKind', postKind)
    
    mediaFiles.forEach((media) => {
      form.append('media', media.file)
      if (media.duration) {
        form.append(`mediaDurationSeconds`, String(media.duration))
      }
    })

    setLoading(true)
    try {
      const created = await api.createPost(form)
      setCaption('')
      setMediaFiles([])
      setCurrentMediaIndex(0)
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
        <p className="workspace-muted text-sm">Upload up to {PHOTO_LIMIT} photos and {VIDEO_LIMIT} videos as a single post.</p>
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

        {/* Media Preview with Navigation */}
        {mediaFiles.length > 0 && (
          <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-slate-900">
                Media Preview ({currentMediaIndex + 1} of {mediaFiles.length})
              </h3>
              <span className="text-xs text-slate-500">
                Photos: {photoCount}/{PHOTO_LIMIT} | Videos: {videoCount}/{VIDEO_LIMIT}
              </span>
            </div>

            {/* Media Display with Navigation */}
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              {currentMedia.file.type.startsWith('image/') && (
                <img
                  src={URL.createObjectURL(currentMedia.file)}
                  alt={`Preview ${currentMediaIndex + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
              {(currentMedia.file.type.startsWith('video/') || currentMedia.file.type.startsWith('audio/')) && (
                <video
                  src={URL.createObjectURL(currentMedia.file)}
                  className="w-full h-full object-cover"
                  controls
                />
              )}

              {/* Navigation Arrows */}
              {mediaFiles.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateMedia('prev')}
                    disabled={currentMediaIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30 transition text-white"
                    aria-label="Previous media"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateMedia('next')}
                    disabled={currentMediaIndex === mediaFiles.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-30 transition text-white"
                    aria-label="Next media"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeMedia(currentMediaIndex)}
                className="absolute top-3 right-3 p-2 rounded-full bg-red-500/80 hover:bg-red-600 transition text-white"
                aria-label="Remove this media"
              >
                <TrashIcon />
              </button>
            </div>

            {/* File Info */}
            <div className="text-xs text-slate-600 space-y-1">
              <div>File: {currentMedia.file.name}</div>
              <div>Type: {currentMedia.file.type || 'Unknown'}</div>
              {currentMedia.duration ? (
                <div>Duration: {currentMedia.duration}s</div>
              ) : null}
              {videoWillTrim ? (
                <div className="text-amber-700 font-medium">
                  ⚠️ Video is over 5 minutes and will be automatically trimmed to 5:00.
                </div>
              ) : null}
            </div>

            {/* Thumbnails */}
            {mediaFiles.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {mediaFiles.map((media, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentMediaIndex(index)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition ${
                      index === currentMediaIndex
                        ? 'border-purple-600 ring-2 ring-purple-300'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {media.file.type.startsWith('image/') && (
                      <img
                        src={URL.createObjectURL(media.file)}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {(media.file.type.startsWith('video/') || media.file.type.startsWith('audio/')) && (
                      <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">🎬</span>
                      </div>
                    )}
                    <span className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                      {index + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* File Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Add Media</label>
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={onMediaChange}
            disabled={!canAddPhotos && !canAddVideos}
            multiple
            className="w-full rounded-xl bg-white border border-slate-300 p-3 text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-200 file:px-3 file:py-2 file:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {!canAddPhotos && !canAddVideos && (
            <p className="text-xs text-red-600">Maximum media limit reached (10 photos, 3 videos)</p>
          )}
          {!canAddPhotos && canAddVideos && (
            <p className="text-xs text-amber-600">Maximum photos reached. You can still add {VIDEO_LIMIT - videoCount} video(s).</p>
          )}
          {canAddPhotos && !canAddVideos && (
            <p className="text-xs text-amber-600">Maximum videos reached. You can still add {PHOTO_LIMIT - photoCount} photo(s).</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || mediaFiles.length === 0}
          className="w-full py-3 rounded-xl bg-black text-white font-semibold disabled:opacity-60"
        >
          {loading ? 'Uploading...' : `Publish Post`}
        </button>

        {status && (
          <div className={`text-sm p-3 rounded-lg ${status.startsWith('Maximum') || status.startsWith('Please') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {status}
          </div>
        )}
      </form>
    </section>
  )
}
