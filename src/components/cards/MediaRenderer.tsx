import { useEffect, useRef, useState } from 'react'
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

// ─── Audio Player ────────────────────────────────────────────────────────────
function AudioPlayer({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [dragging, setDragging] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  function togglePlay() {
    const el = audioRef.current
    if (!el) return
    if (playing) { el.pause() } else { el.play() }
    setPlaying(!playing)
  }

  function onTimeUpdate() {
    if (!dragging) setCurrentTime(audioRef.current?.currentTime ?? 0)
  }

  function onLoadedMetadata() {
    setDuration(audioRef.current?.duration ?? 0)
  }

  function onEnded() { setPlaying(false); setCurrentTime(0) }

  function seek(clientX: number) {
    const bar = progressRef.current
    const el = audioRef.current
    if (!bar || !el || !duration) return
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    el.currentTime = ratio * duration
    setCurrentTime(el.currentTime)
  }

  function formatTime(s: number) {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Generate fake-but-stable waveform bars from src hash
  const bars = Array.from({ length: 48 }, (_, i) => {
    const seed = (src.charCodeAt(i % src.length) * 17 + i * 31) % 100
    return 15 + (seed % 70)
  })

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400&family=Syne:wght@500;600&display=swap');

        .mr-audio {
          background: #0f1114;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 20px 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          position: relative;
          overflow: hidden;
          font-family: 'DM Mono', monospace;
        }

        /* Ambient glow behind waveform */
        .mr-audio::before {
          content: '';
          position: absolute;
          bottom: 0; left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 60%;
          background: radial-gradient(ellipse at center bottom, rgba(14,212,148,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        .mr-audio__top {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        /* Play/pause button */
        .mr-play-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #0ed494, #0891b2);
          color: #0b0c0e;
          display: grid;
          place-items: center;
          cursor: pointer;
          flex-shrink: 0;
          box-shadow: 0 4px 16px rgba(14,212,148,0.3);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .mr-play-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 6px 20px rgba(14,212,148,0.4);
        }
        .mr-play-btn:active { transform: scale(0.95); }

        /* Time display */
        .mr-times {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex-shrink: 0;
        }
        .mr-time-current {
          font-size: 18px;
          font-weight: 400;
          color: rgba(255,255,255,0.9);
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .mr-time-total {
          font-size: 11px;
          color: rgba(255,255,255,0.22);
          letter-spacing: 0.02em;
        }

        /* Waveform */
        .mr-waveform {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 2px;
          height: 44px;
          cursor: pointer;
          position: relative;
        }
        .mr-bar {
          flex: 1;
          border-radius: 2px;
          transition: background 0.1s;
          min-width: 2px;
        }
        .mr-bar.played {
          background: #0ed494;
        }
        .mr-bar.unplayed {
          background: rgba(255,255,255,0.1);
        }
        .mr-bar.playing-now {
          background: #0ed494;
          animation: barPulse 0.5s ease infinite alternate;
        }
        @keyframes barPulse {
          from { opacity: 0.7; }
          to   { opacity: 1; filter: brightness(1.2); }
        }

        /* Seekbar */
        .mr-seekbar-wrap {
          position: relative;
          height: 3px;
          border-radius: 3px;
          background: rgba(255,255,255,0.07);
          cursor: pointer;
        }
        .mr-seekbar-fill {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #0ed494, #0891b2);
          transition: width 0.1s linear;
          pointer-events: none;
        }
        .mr-seekbar-thumb {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 11px;
          height: 11px;
          border-radius: 50%;
          background: #0ed494;
          box-shadow: 0 0 8px rgba(14,212,148,0.6);
          pointer-events: none;
          transition: left 0.1s linear;
        }
      `}</style>

      <div className="mr-audio">
        <audio
          ref={audioRef}
          src={src}
          preload="metadata"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
        />

        <div className="mr-audio__top">
          {/* Play button */}
          <button type="button" className="mr-play-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              // Pause icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1.5" />
                <rect x="9" y="2" width="4" height="12" rx="1.5" />
              </svg>
            ) : (
              // Play icon
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
              </svg>
            )}
          </button>

          {/* Waveform */}
          <div
            className="mr-waveform"
            ref={progressRef}
            onMouseDown={(e) => { setDragging(true); seek(e.clientX) }}
            onMouseMove={(e) => { if (dragging) seek(e.clientX) }}
            onMouseUp={() => setDragging(false)}
            onMouseLeave={() => setDragging(false)}
            onTouchStart={(e) => { setDragging(true); seek(e.touches[0].clientX) }}
            onTouchMove={(e) => { if (dragging) seek(e.touches[0].clientX) }}
            onTouchEnd={() => setDragging(false)}
          >
            {bars.map((h, i) => {
              const barProgress = (i / bars.length) * 100
              const isPlayingNow = playing && Math.abs(barProgress - progress) < (100 / bars.length) * 1.5
              const isPlayed = barProgress <= progress
              return (
                <div
                  key={i}
                  className={`mr-bar ${isPlayingNow ? 'playing-now' : isPlayed ? 'played' : 'unplayed'}`}
                  style={{ height: `${h}%` }}
                />
              )
            })}
          </div>

          {/* Times */}
          <div className="mr-times">
            <div className="mr-time-current">{formatTime(currentTime)}</div>
            <div className="mr-time-total">{formatTime(duration)}</div>
          </div>
        </div>

        {/* Seekbar */}
        <div
          className="mr-seekbar-wrap"
          onClick={(e) => seek(e.clientX)}
        >
          <div className="mr-seekbar-fill" style={{ width: `${progress}%` }} />
          <div className="mr-seekbar-thumb" style={{ left: `${progress}%` }} />
        </div>
      </div>
    </>
  )
}

// ─── Video Player ─────────────────────────────────────────────────────────────
function VideoPlayer({
  src,
  trimEndSeconds,
  className,
}: {
  src: string
  trimEndSeconds?: number | null
  className?: string
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [muted, setMuted] = useState(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  const limit = trimEndSeconds ?? null

  function scheduleHide() {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setShowControls(true)
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false) }, 2500)
  }

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current) }, [])

  function togglePlay() {
    const el = videoRef.current
    if (!el) return
    if (playing) { el.pause(); setShowControls(true) }
    else { el.play(); scheduleHide() }
    setPlaying(!playing)
  }

  function onTimeUpdate() {
    const el = videoRef.current
    if (!el) return
    setCurrentTime(el.currentTime)
    if (limit && el.currentTime >= limit) {
      el.pause(); el.currentTime = 0
      setPlaying(false); setCurrentTime(0); setShowControls(true)
    }
  }

  function onLoadedMetadata() { setDuration(videoRef.current?.duration ?? 0) }
  function onEnded() { setPlaying(false); setCurrentTime(0); setShowControls(true) }

  function seek(clientX: number) {
    const bar = progressRef.current
    const el = videoRef.current
    if (!bar || !el) return
    const max = limit ?? duration
    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    el.currentTime = ratio * max
    setCurrentTime(el.currentTime)
  }

  function formatTime(s: number) {
    if (!isFinite(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const max = limit ?? duration
  const progress = max > 0 ? (currentTime / max) * 100 : 0

  return (
    <>
      <style>{`
        .mr-video-wrap {
          position: relative;
          overflow: hidden;
          background: #000;
          border-radius: 0;
        }
        .mr-video-el {
          width: 100%;
          display: block;
          object-fit: cover;
        }
        .mr-video-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: opacity 0.25s ease;
        }
        .mr-video-overlay.hidden { opacity: 0; pointer-events: none; }

        /* Big center play button */
        .mr-video-center {
          flex: 1;
          display: grid;
          place-items: center;
          cursor: pointer;
        }
        .mr-video-bigbtn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(8px);
          border: 1.5px solid rgba(255,255,255,0.2);
          display: grid;
          place-items: center;
          color: #fff;
          transition: transform 0.15s, background 0.15s;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .mr-video-bigbtn:hover {
          transform: scale(1.1);
          background: rgba(14,212,148,0.25);
          border-color: rgba(14,212,148,0.5);
        }
        .mr-video-bigbtn.hidden-btn { opacity: 0; pointer-events: none; }

        /* Bottom bar */
        .mr-video-bar {
          padding: 0 14px 12px;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .mr-video-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .mr-video-ctrl-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.85);
          cursor: pointer;
          display: grid;
          place-items: center;
          padding: 2px;
          transition: color 0.15s, transform 0.15s;
          flex-shrink: 0;
        }
        .mr-video-ctrl-btn:hover { color: #0ed494; transform: scale(1.1); }

        .mr-video-time {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.02em;
          margin-left: auto;
        }

        /* Trim badge */
        .mr-trim-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(0,0,0,0.55);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(251,191,36,0.3);
          border-radius: 20px;
          padding: 3px 9px;
          font-size: 10px;
          font-weight: 500;
          color: #fbbf24;
          letter-spacing: 0.04em;
          font-family: 'DM Mono', monospace;
        }

        /* Progress bar */
        .mr-video-progress {
          height: 3px;
          border-radius: 3px;
          background: rgba(255,255,255,0.15);
          cursor: pointer;
          position: relative;
        }
        .mr-video-progress-fill {
          position: absolute;
          top: 0; left: 0;
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #0ed494, #0891b2);
          pointer-events: none;
          transition: width 0.1s linear;
        }
        .mr-video-progress-thumb {
          position: absolute;
          top: 50%; left: 0;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #0ed494;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 6px rgba(14,212,148,0.6);
          pointer-events: none;
          transition: left 0.1s linear;
        }
      `}</style>

      <div
        className={`mr-video-wrap ${className || ''}`}
        onMouseMove={scheduleHide}
        onMouseEnter={scheduleHide}
      >
        <video
          ref={videoRef}
          src={src}
          preload="metadata"
          muted={muted}
          className="mr-video-el"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onEnded}
          onClick={togglePlay}
          style={{ cursor: 'pointer' }}
        />

        {limit && <div className="mr-trim-badge">⏱ 5:00 limit</div>}

        <div className={`mr-video-overlay${showControls ? '' : ' hidden'}`}>
          {/* Center play/pause */}
          <div className="mr-video-center" onClick={togglePlay}>
            <div className={`mr-video-bigbtn${playing ? ' hidden-btn' : ''}`}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
                <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
              </svg>
            </div>
          </div>

          {/* Bottom controls */}
          <div className="mr-video-bar">
            <div
              className="mr-video-progress"
              ref={progressRef}
              onClick={(e) => seek(e.clientX)}
            >
              <div className="mr-video-progress-fill" style={{ width: `${progress}%` }} />
              <div className="mr-video-progress-thumb" style={{ left: `${progress}%` }} />
            </div>

            <div className="mr-video-controls">
              {/* Play/pause */}
              <button type="button" className="mr-video-ctrl-btn" onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="2" width="4" height="12" rx="1.5" />
                    <rect x="9" y="2" width="4" height="12" rx="1.5" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 2.5l10 5.5-10 5.5V2.5z" />
                  </svg>
                )}
              </button>

              {/* Mute */}
              <button
                type="button"
                className="mr-video-ctrl-btn"
                onClick={() => { setMuted((m) => !m) }}
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>

              {/* Time */}
              <span className="mr-video-time">{formatTime(currentTime)} / {formatTime(max)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function MediaRenderer({ mediaUrl, mediaType, trimEndSeconds, className }: Props) {
  const src = resolveMediaUrl(mediaUrl)

  if (mediaType === 'image') {
    return (
      <img
        src={src}
        alt=""
        className={className || 'w-full h-72 object-cover'}
        style={{ display: 'block' }}
      />
    )
  }

  if (mediaType === 'audio') {
    return (
      <div className={className} style={className ? undefined : { padding: '16px', background: 'rgba(15,17,20,0.9)' }}>
        <AudioPlayer src={src} />
      </div>
    )
  }

  return (
    <VideoPlayer
      src={src}
      trimEndSeconds={trimEndSeconds}
      className={className}
    />
  )
}