import { useEffect, useRef, useState } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX } from 'lucide-react'

type Props = {
  callType: 'audio' | 'video'
  recipientName: string
  recipientAvatar?: string | null
  onEnd: () => void
  onAnswer: (stream: MediaStream) => void
  onReject: () => void
  isIncoming: boolean
}

export default function CallModal({
  callType,
  recipientName,
  recipientAvatar,
  onEnd,
  onAnswer,
  onReject,
  isIncoming,
}: Props) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isSpeakerOff, setIsSpeakerOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState<'ringing' | 'accepted' | 'ended'>(
    isIncoming ? 'ringing' : 'ringing',
  )
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (callDuration > 0) {
      const timer = setInterval(() => setCallDuration((d) => d + 1), 1000)
      return () => clearInterval(timer)
    }
  }, [callDuration])

  async function startLocalStream() {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream

      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream
      }

      return stream
    } catch (error) {
      console.error('Failed to get local stream:', error)
      return null
    }
  }

  async function handleAnswer() {
    const stream = await startLocalStream()
    if (stream) {
      onAnswer(stream)
      setCallStatus('accepted')
      setCallDuration(0)
    }
  }

  function handleReject() {
    stopStreams()
    onReject()
  }

  function handleEnd() {
    stopStreams()
    onEnd()
  }

  function stopStreams() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
  }

  function toggleMute() {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks()
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsMuted(!isMuted)
    }
  }

  function toggleCamera() {
    if (localStreamRef.current && callType === 'video') {
      const videoTracks = localStreamRef.current.getVideoTracks()
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      setIsCameraOff(!isCameraOff)
    }
  }

  function toggleSpeaker() {
    if (remoteVideoRef.current) {
      const audioContext = remoteVideoRef.current
      if (audioContext && 'volume' in audioContext) {
        const currentVolume = (audioContext as any).volume
        ;(audioContext as any).volume = currentVolume === 0 ? 1 : 0
      }
      setIsSpeakerOff(!isSpeakerOff)
    }
  }

  function formatTime(seconds: number) {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className="call-modal">
      <div className="call-container">
        {callType === 'video' ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="call-video remote"
              style={{ display: callStatus === 'accepted' ? 'block' : 'none' }}
            />

            <div className="call-video-local-container">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="call-video local"
                style={{ display: isCameraOff && callStatus === 'accepted' ? 'none' : 'block' }}
              />
              {isCameraOff && callStatus === 'accepted' && (
                <div className="call-video-off">
                  <VideoOff size={32} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="call-audio-container">
            {recipientAvatar ? (
              <img src={recipientAvatar} alt={recipientName} className="call-avatar" />
            ) : (
              <div className="call-avatar-fallback">{(recipientName || '?').slice(0, 1).toUpperCase()}</div>
            )}
          </div>
        )}

        <div className="call-info">
          <h3 className="call-recipient-name">{recipientName}</h3>
          <p className="call-status">
            {callStatus === 'ringing' && (
              isIncoming ? 'Incoming call...' : 'Calling...'
            )}
            {callStatus === 'accepted' && <span className="call-duration">{formatTime(callDuration)}</span>}
          </p>
        </div>

        <div className="call-controls">
          {callStatus === 'ringing' && isIncoming && (
            <>
              <button className="control-btn answer-btn" onClick={handleAnswer}>
                <Phone size={20} />
              </button>
              <button className="control-btn reject-btn" onClick={handleReject}>
                <PhoneOff size={20} />
              </button>
            </>
          )}

          {callStatus === 'ringing' && !isIncoming && (
            <button className="control-btn reject-btn" onClick={handleEnd}>
              <PhoneOff size={20} />
            </button>
          )}

          {callStatus === 'accepted' && (
            <>
              <button className={`control-btn ${isMuted ? 'inactive' : ''}`} onClick={toggleMute} title="Mute">
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {callType === 'video' && (
                <button className={`control-btn ${isCameraOff ? 'inactive' : ''}`} onClick={toggleCamera} title="Camera">
                  {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
                </button>
              )}

              <button className={`control-btn ${isSpeakerOff ? 'inactive' : ''}`} onClick={toggleSpeaker} title="Speaker">
                {isSpeakerOff ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button className="control-btn end-call-btn" onClick={handleEnd}>
                <PhoneOff size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
