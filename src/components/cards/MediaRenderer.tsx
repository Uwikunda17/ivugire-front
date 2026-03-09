import { API_URL } from '../../api/client'

type Props = {
  mediaUrl: string
  mediaType: 'image' | 'video' | 'audio'
  trimEndSeconds?: number | null
  className?: string
}

function resolveMediaUrl(mediaUrl: string) {
  if (!mediaUrl) return ''
  if (mediaUrl.startsWith('http://') || mediaUrl.startsWith('https://')) return mediaUrl
  return `${API_URL}${mediaUrl}`
}

export default function MediaRenderer({ mediaUrl, mediaType, trimEndSeconds, className }: Props) {
  const src = resolveMediaUrl(mediaUrl)
  if (mediaType === 'image') {
    return <img src={src} alt="" className={className || 'w-full h-72 object-cover'} />
  }

  if (mediaType === 'audio') {
    return (
      <div className={className || 'p-4 bg-surface/80'}>
        <audio controls preload="metadata" className="w-full">
          <source src={src} />
        </audio>
      </div>
    )
  }

  return (
    <video
      controls
      preload="metadata"
      className={className || 'w-full h-72 object-cover bg-black'}
      onTimeUpdate={(event) => {
        const limit = trimEndSeconds || null
        if (!limit) return
        const element = event.currentTarget
        if (element.currentTime >= limit) {
          element.pause()
          element.currentTime = 0
        }
      }}
    >
      <source src={src} />
    </video>
  )
}
