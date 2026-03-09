import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, FormEvent } from 'react'
import {
  ArrowLeft,
  AudioLines,
  CirclePlus,
  Compass,
  CornerUpLeft,
  FileText,
  Home,
  ImagePlus,
  MessageSquare,
  Mic,
  Pause,
  Paperclip,
  Play,
  Search,
  SendHorizonal,
  Settings,
  Smile,
  SmilePlus,
  Square,
  Trash2,
  UserRound,
  Video,
  X,
} from 'lucide-react'
import { io, type Socket } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import {
  API_URL,
  api,
  type ChatAttachment,
  type ChatItem,
  type ChatMessage,
  type ChatReplyReference,
  type ChatSharedContent,
  type UserSearchResult,
} from '../api/client'
import { useAuth } from '../state/AuthContext'
import { useToast } from '../state/ToastContext'
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react'
import GifPicker, { Theme as GifTheme } from 'gif-picker-react'
import './chat.css'

function formatTime(isoTime?: string | null) {
  if (!isoTime) return ''
  return new Date(isoTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function resolveMediaUrl(url: string) {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}

function isGifUrl(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed.startsWith('http')) return false
  return /\.(gif)(\?.*)?$/i.test(trimmed) || /media\.tenor\.com\//i.test(trimmed)
}

function isAudioAttachment(attachment: ChatAttachment) {
  if (attachment.fileType === 'audio') return true
  const source = `${attachment.fileName || ''} ${attachment.fileUrl || ''}`.toLowerCase()
  return /\.(mp3|wav|ogg|aac|m4a|flac|webm)\b/.test(source)
}

function isVideoAttachment(attachment: ChatAttachment) {
  if (attachment.fileType === 'video') return true
  const source = `${attachment.fileName || ''} ${attachment.fileUrl || ''}`.toLowerCase()
  return /\.(mp4|webm|mov|mkv|avi|m4v)\b/.test(source)
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

function singleAttachmentLabel(attachment: ChatAttachment) {
  if (isAudioAttachment(attachment)) return 'Voice message'
  if (attachment.fileType === 'image') return 'Photo'
  if (isVideoAttachment(attachment)) return 'Video'
  if (attachment.fileType === 'document') return 'Document'
  return 'Attachment'
}

function previewText(message: {
  body?: string | null
  attachments?: ChatAttachment[]
  attachmentLabel?: string | null
  isDeleted?: boolean
  sharedContent?: ChatSharedContent | null
}) {
  if (message.isDeleted) return 'Message unsent'
  if (message.body?.trim()) return message.body
  if (message.sharedContent?.title) return message.sharedContent.title
  if (message.attachmentLabel) return message.attachmentLabel
  const attachments = message.attachments || []
  const count = attachments.length
  if (count === 0) return 'New message'
  if (count === 1) {
    return singleAttachmentLabel(attachments[0])
  }
  return `${count} attachments`
}

function messagePreview(message: ChatMessage) {
  return previewText(message)
}

function replyPreview(reply?: ChatReplyReference | null) {
  if (!reply) return 'Original message'
  return previewText(reply)
}

function formatSharedTimestamp(isoTime?: string) {
  if (!isoTime) return ''
  return new Date(isoTime).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function unreadStorageKey(userId?: string | null) {
  return userId ? `ivugire-chat-unread:${userId}` : 'ivugire-chat-unread:guest'
}

function appendUniqueMessage(existing: ChatMessage[], message: ChatMessage) {
  if (existing.some((entry) => entry.id === message.id)) return existing
  return [...existing, message].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )
}

function replaceMessage(existing: ChatMessage[], message: ChatMessage) {
  return existing.map((entry) => (entry.id === message.id ? message : entry))
}

function updateChatPreview(
  chats: ChatItem[],
  chatId: string,
  message: ChatMessage,
  { reorder = true, updatePreview = true }: { reorder?: boolean; updatePreview?: boolean } = {},
) {
  const targetIndex = chats.findIndex((chat) => chat.id === chatId)
  if (targetIndex === -1) return chats

  const updated = updatePreview
    ? {
        ...chats[targetIndex],
        lastMessage: messagePreview(message),
        lastMessageAt: message.createdAt,
      }
    : chats[targetIndex]

  if (!reorder) {
    return chats.map((chat, index) => (index === targetIndex ? updated : chat))
  }

  return [updated, ...chats.filter((_, index) => index !== targetIndex)]
}

const QUICK_REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '😢']

function createWaveform(seed: string, count = 28) {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0
  }

  return Array.from({ length: count }, (_, index) => {
    const value = (hash >> (index % 16)) & 15
    return 18 + ((value + index * 3) % 22)
  })
}

function ChatAudioPlayer({ attachment }: { attachment: ChatAttachment }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const bars = useMemo(
    () => createWaveform(`${attachment.id}:${attachment.fileName}:${attachment.fileUrl}`),
    [attachment.fileName, attachment.fileUrl, attachment.id],
  )

  useEffect(() => {
    const element = audioRef.current
    if (!element) return

    function handleLoadedMetadata() {
      const audio = audioRef.current
      if (!audio) return
      setDuration(audio.duration || 0)
      setCurrentTime(audio.currentTime || 0)
    }

    function handleTimeUpdate() {
      const audio = audioRef.current
      if (!audio) return
      setCurrentTime(audio.currentTime || 0)
    }

    function handlePlay() {
      setIsPlaying(true)
    }

    function handlePause() {
      setIsPlaying(false)
    }

    function handleEnded() {
      const audio = audioRef.current
      setIsPlaying(false)
      setCurrentTime(audio?.duration || 0)
    }

    element.addEventListener('loadedmetadata', handleLoadedMetadata)
    element.addEventListener('play', handlePlay)
    element.addEventListener('pause', handlePause)
    element.addEventListener('timeupdate', handleTimeUpdate)
    element.addEventListener('ended', handleEnded)

    return () => {
      element.removeEventListener('loadedmetadata', handleLoadedMetadata)
      element.removeEventListener('play', handlePlay)
      element.removeEventListener('pause', handlePause)
      element.removeEventListener('timeupdate', handleTimeUpdate)
      element.removeEventListener('ended', handleEnded)
    }
  }, [])

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      return
    }

    try {
      if (duration > 0 && audio.currentTime >= duration) {
        audio.currentTime = 0
        setCurrentTime(0)
      }
      await audio.play()
    } catch {
      setIsPlaying(false)
    }
  }

  const progress = duration > 0 ? currentTime / duration : 0

  return (
    <div className="chat-audio-card">
      <audio ref={audioRef} preload="metadata">
        <source src={resolveMediaUrl(attachment.fileUrl)} />
      </audio>
      <button type="button" onClick={togglePlayback} className="chat-audio-play-btn">
        {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="chat-audio-wave" aria-label={attachment.fileName}>
        {bars.map((height, index) => {
          const active = index / bars.length <= progress
          return (
            <span
              key={`${attachment.id}-${index}`}
              className={`chat-audio-bar ${active ? 'chat-audio-bar-active' : ''} ${isPlaying ? 'chat-audio-bar-live' : ''}`}
              style={
                {
                  height: `${height}px`,
                  '--bar-delay': `${(index % 8) * 0.07}s`,
                  '--bar-duration': `${0.72 + ((height + index) % 6) * 0.11}s`,
                } as CSSProperties
              }
            />
          )
        })}
      </div>
      <div className="chat-audio-meta">
        <span>{singleAttachmentLabel(attachment)}</span>
        <span>
          {formatDuration(Math.floor(currentTime || 0))} /{' '}
          {duration ? formatDuration(Math.floor(duration)) : '--:--'}
        </span>
      </div>
    </div>
  )
}

function MessageAttachmentStack({ attachments }: { attachments: ChatAttachment[] }) {
  const [expanded, setExpanded] = useState(false)
  const leaveTimer = useRef<number | null>(null)

  if (attachments.length === 0) return null

  const audioAttachments = attachments.filter((attachment) => isAudioAttachment(attachment))
  const previews = attachments.filter((attachment) => !isAudioAttachment(attachment)).slice(0, 4)

  function handleEnter() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
    setExpanded(true)
  }

  function handleLeave() {
    leaveTimer.current = window.setTimeout(() => setExpanded(false), 200)
  }

  return (
    <>
      {audioAttachments.length > 0 ? (
        <div className="chat-audio-list">
          {audioAttachments.map((attachment) => (
            <ChatAudioPlayer key={attachment.id} attachment={attachment} />
          ))}
        </div>
      ) : null}

      {previews.length > 0 ? (
        <div
          className="chat-attachment-stack"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {previews.map((attachment, index) => (
            <a
              key={attachment.id}
              href={resolveMediaUrl(attachment.fileUrl)}
              target="_blank"
              rel="noreferrer"
              className="chat-attachment-card"
              style={{ '--stack-index': index } as CSSProperties}
            >
              {attachment.fileType === 'image' ? (
                <img src={resolveMediaUrl(attachment.fileUrl)} alt={attachment.fileName} />
              ) : isVideoAttachment(attachment) ? (
                <div className="chat-doc-card">
                  <Video size={16} />
                  <span>{attachment.fileName}</span>
                </div>
              ) : (
                <div className="chat-doc-card">
                  <FileText size={16} />
                  <span>{attachment.fileName}</span>
                </div>
              )}
            </a>
          ))}
          {attachments.length > 4 ? <div className="chat-attachment-more">+{attachments.length - 4}</div> : null}
        </div>
      ) : null}

      {expanded && previews.length > 0
        ? createPortal(
            <div
              className="chat-lightbox-overlay"
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
              onClick={() => setExpanded(false)}
            >
              <div className="chat-lightbox-gallery">
                {previews.map((attachment, index) => (
                  <a
                    key={attachment.id}
                    href={resolveMediaUrl(attachment.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="chat-lightbox-card"
                    style={{ '--lb-index': index, '--lb-total': previews.length } as CSSProperties}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {attachment.fileType === 'image' ? (
                      <img src={resolveMediaUrl(attachment.fileUrl)} alt={attachment.fileName} />
                    ) : isVideoAttachment(attachment) ? (
                      <div className="chat-doc-card">
                        <Video size={24} />
                        <span>{attachment.fileName}</span>
                      </div>
                    ) : (
                      <div className="chat-doc-card">
                        <FileText size={24} />
                        <span>{attachment.fileName}</span>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function SharedContentCard({ content }: { content: ChatSharedContent }) {
  const authorAvatar = content.authorAvatarUrl ? resolveMediaUrl(content.authorAvatarUrl) : null
  const repostAvatar = content.repostFromUserAvatarUrl ? resolveMediaUrl(content.repostFromUserAvatarUrl) : null
  const mediaUrl = resolveMediaUrl(content.mediaUrl)

  return (
    <div className="chat-shared-card">
      <div className="chat-shared-head">
        <div className="chat-shared-author">
          {authorAvatar ? (
            <img src={authorAvatar} alt={content.authorName || content.title} className="chat-shared-avatar" />
          ) : (
            <div className="chat-shared-avatar chat-shared-avatar-fallback">
              {(content.authorName || content.title || '?').slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="chat-shared-author-copy">
            <div className="chat-shared-author-line">
              <strong>{content.authorName || content.authorUsername || content.title}</strong>
              <span>{content.title}</span>
            </div>
            <div className="chat-shared-meta">
              {content.authorUsername ? `@${content.authorUsername}` : 'Shared in chat'}
              {content.createdAt ? ` · ${formatSharedTimestamp(content.createdAt)}` : ''}
            </div>
          </div>
          {repostAvatar ? <img src={repostAvatar} alt="Repost source" className="chat-shared-repost" /> : null}
        </div>
      </div>

      <div className="chat-shared-media">
        {content.mediaType === 'image' ? (
          <img src={mediaUrl} alt={content.caption || content.title} className="chat-shared-media-image" />
        ) : content.mediaType === 'video' ? (
          <video src={mediaUrl} className="chat-shared-media-video" muted playsInline controls />
        ) : (
          <div className="chat-shared-audio">
            <AudioLines size={18} />
            <span>Audio story</span>
          </div>
        )}
      </div>

      {content.caption ? <div className="chat-shared-caption">{content.caption}</div> : null}
      {content.isTrimmed ? <div className="chat-shared-badge">Auto-trimmed to 5:00</div> : null}
      {content.type === 'story' && content.repostFromUserUsername ? (
        <div className="chat-shared-source">Shared from @{content.repostFromUserUsername}</div>
      ) : null}
    </div>
  )
}

function MessageAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    return <img src={resolveMediaUrl(avatarUrl)} alt={name} className="chat-message-avatar" />
  }
  return <div className="chat-message-avatar chat-message-avatar-fallback">{name.slice(0, 1).toUpperCase()}</div>
}

function PendingAttachmentStack({ files }: { files: File[] }) {
  const previews = useMemo(
    () =>
      files.slice(0, 5).map((file) => ({
        file,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      })),
    [files],
  )

  useEffect(() => {
    return () => {
      for (const preview of previews) {
        if (preview.previewUrl) URL.revokeObjectURL(preview.previewUrl)
      }
    }
  }, [previews])

  return (
    <div className="chat-pending-stack">
      {previews.map((preview, idx) => (
        <div
          key={`${preview.file.name}-${preview.file.lastModified}-${idx}`}
          className="chat-pending-card"
          style={{ '--stack-index': idx } as CSSProperties}
        >
          {preview.previewUrl ? (
            <img src={preview.previewUrl} alt={preview.file.name} />
          ) : preview.file.type.startsWith('audio/') ? (
            <div className="chat-doc-card">
              <AudioLines size={14} />
              <span>{preview.file.name}</span>
            </div>
          ) : preview.file.type.startsWith('video/') ? (
            <div className="chat-doc-card">
              <Video size={14} />
              <span>{preview.file.name}</span>
            </div>
          ) : (
            <div className="chat-doc-card">
              <FileText size={14} />
              <span>{preview.file.name}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default function Chat() {
  const { user, token } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()
  const [chats, setChats] = useState<ChatItem[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [unreadByChat, setUnreadByChat] = useState<Record<string, number>>({})
  const [newMessage, setNewMessage] = useState('')
  const [newMediaFiles, setNewMediaFiles] = useState<File[]>([])
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null)
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [userResults, setUserResults] = useState<UserSearchResult[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const activeChatIdRef = useRef<string | null>(null)
  const typingTimeoutRef = useRef<number | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const composeInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<number | null>(null)
  const recordingStreamRef = useRef<MediaStream | null>(null)
  const [activePicker, setActivePicker] = useState<'emoji' | 'gif' | null>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const [mobileShowConvo, setMobileShowConvo] = useState(false)

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [chats, activeChatId],
  )

  const filteredChats = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return chats
    return chats.filter((chat) =>
      `${chat.title} ${chat.username || ''} ${chat.email || ''}`.toLowerCase().includes(q),
    )
  }, [chats, searchText])

  useEffect(() => {
    activeChatIdRef.current = activeChatId
  }, [activeChatId])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activePicker && pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setActivePicker(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activePicker])

  async function loadChats(selectLatest = false) {
    const data = await api.listChats()
    setChats(data)
    if (selectLatest && data.length > 0) {
      setActiveChatId(data[0].id)
      return
    }
    if (!activeChatId && data.length > 0) {
      setActiveChatId(data[0].id)
    }
  }

  async function loadMessages(chatId: string) {
    const data = await api.listMessages(chatId)
    setMessages(data)
    setReactionPickerFor(null)
    setTypingUsers([])
    setUnreadByChat((prev) => ({ ...prev, [chatId]: 0 }))
  }

  useEffect(() => {
    async function bootstrap() {
      setLoading(true)
      setStatus(null)
      try {
        const data = await api.listChats()
        setChats(data)
        if (data.length > 0) {
          setActiveChatId(data[0].id)
        }
      } catch (error) {
        setStatus((error as Error).message)
      } finally {
        setLoading(false)
      }
    }

    void bootstrap()
  }, [])

  useEffect(() => {
    if (!activeChatId) {
      setMessages([])
      setReplyingTo(null)
      setReactionPickerFor(null)
      return
    }
    setReplyingTo(null)
    setReactionPickerFor(null)
    void loadMessages(activeChatId).catch((error) => setStatus((error as Error).message))
  }, [activeChatId])

  useEffect(() => {
    if (!user?.id) {
      setUnreadByChat({})
      return
    }

    try {
      const raw = localStorage.getItem(unreadStorageKey(user.id))
      setUnreadByChat(raw ? (JSON.parse(raw) as Record<string, number>) : {})
    } catch {
      setUnreadByChat({})
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    localStorage.setItem(unreadStorageKey(user.id), JSON.stringify(unreadByChat))
  }, [unreadByChat, user?.id])

  useEffect(() => {
    const q = searchText.trim()
    if (q.length < 2) {
      setUserResults([])
      return
    }

    const timer = window.setTimeout(() => {
      void api.searchUsers(q).then(setUserResults).catch(() => setUserResults([]))
    }, 260)

    return () => window.clearTimeout(timer)
  }, [searchText])

  useEffect(() => {
    if (!token) return

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    })

    socketRef.current = socket

    const handleMessage = (payload: { chatId: string; message: ChatMessage }) => {
      if (!payload?.chatId || !payload?.message) return
      const { chatId, message } = payload

      setChats((prev) => updateChatPreview(prev, chatId, message))

      if (activeChatIdRef.current === chatId) {
        setMessages((prev) => appendUniqueMessage(prev, message))
        setUnreadByChat((prev) => ({ ...prev, [chatId]: 0 }))
      } else if (message.senderId !== user?.id) {
        setUnreadByChat((prev) => ({ ...prev, [chatId]: (prev[chatId] || 0) + 1 }))
        push({
          tone: 'info',
          title: activeChatIdRef.current ? 'New message received' : 'Incoming message',
          message: `${message.senderName || 'Someone'}: ${messagePreview(message)}`,
        })
      }
    }

    const handleMessageUpdated = (payload: { chatId: string; message: ChatMessage }) => {
      if (!payload?.chatId || !payload?.message) return
      const { chatId, message } = payload

      setChats((prev) =>
        updateChatPreview(
          prev,
          chatId,
          message,
          {
            reorder: prev.some((chat) => chat.id === chatId && chat.lastMessageAt === message.createdAt),
            updatePreview: prev.some((chat) => chat.id === chatId && chat.lastMessageAt === message.createdAt),
          },
        ),
      )

      if (activeChatIdRef.current === chatId) {
        setMessages((prev) => replaceMessage(prev, message))
        setReplyingTo((prev) => (prev?.id === message.id ? message : prev))
      }
    }

    const handleTyping = (payload: { chatId: string; userId: string; typing: boolean }) => {
      if (!payload?.chatId || !payload?.userId) return
      if (payload.userId === user?.id) return
      if (payload.chatId !== activeChatIdRef.current) return

      setTypingUsers((prev) => {
        if (payload.typing) {
          if (prev.includes(payload.userId)) return prev
          return [...prev, payload.userId]
        }
        return prev.filter((id) => id !== payload.userId)
      })
    }

    socket.on('chat:message', handleMessage)
    socket.on('chat:message_updated', handleMessageUpdated)
    socket.on('chat:typing', handleTyping)

    return () => {
      socket.off('chat:message', handleMessage)
      socket.off('chat:message_updated', handleMessageUpdated)
      socket.off('chat:typing', handleTyping)
      socket.disconnect()
      socketRef.current = null
    }
  }, [push, token, user?.id])

  useEffect(() => {
    const socket = socketRef.current
    if (!socket || !activeChatId) return

    socket.emit('chat:join', { chatId: activeChatId })
    return () => {
      socket.emit('chat:leave', { chatId: activeChatId })
    }
  }, [activeChatId])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
      if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      if (recordingStreamRef.current) {
        for (const track of recordingStreamRef.current.getTracks()) track.stop()
      }
    }
  }, [])

  function emitTyping(typing: boolean) {
    if (!activeChatId) return
    socketRef.current?.emit('chat:typing', { chatId: activeChatId, typing })
  }

  function onMessageInputChange(value: string) {
    setNewMessage(value)
    const typing = value.trim().length > 0
    emitTyping(typing)
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = window.setTimeout(() => emitTyping(false), 1200)
  }

  function resetRecorderTimer() {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current)
    recordingTimerRef.current = null
    setRecordingSeconds(0)
  }

  function cleanupRecordingStream() {
    if (recordingStreamRef.current) {
      for (const track of recordingStreamRef.current.getTracks()) track.stop()
      recordingStreamRef.current = null
    }
  }

  async function startVoiceRecording() {
    if (isRecording) return
    setStatus(null)

    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('Audio recording is not supported in this browser.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recordingChunksRef.current = []
      recordingStreamRef.current = stream
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) recordingChunksRef.current.push(event.data)
      }

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(recordingChunksRef.current, { type: mimeType })
        if (blob.size > 0) {
          const extension = mimeType.includes('ogg')
            ? 'ogg'
            : mimeType.includes('mp4')
              ? 'm4a'
              : 'webm'
          const file = new File([blob], `voice-${Date.now()}.${extension}`, { type: mimeType })
          setNewMediaFiles((prev) => [...prev, file])
        }
        cleanupRecordingStream()
        resetRecorderTimer()
        setIsRecording(false)
      }

      recorder.start(250)
      setIsRecording(true)
      setRecordingSeconds(0)
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1)
      }, 1000)
    } catch {
      cleanupRecordingStream()
      resetRecorderTimer()
      setIsRecording(false)
      setStatus('Microphone access denied or unavailable.')
    }
  }

  function stopVoiceRecording() {
    if (!isRecording) return
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    } else {
      cleanupRecordingStream()
      resetRecorderTimer()
      setIsRecording(false)
    }
  }

  async function startChatWithUser(userResult: UserSearchResult) {
    setStatus(null)
    try {
      const result = await api.createDirectChat({ recipientId: userResult.id })
      await loadChats(true)
      setActiveChatId(result.chatId)
      setSearchText('')
      setUserResults([])
      setMobileShowConvo(true)
      push({
        tone: 'success',
        title: result.created ? 'Conversation created' : 'Conversation opened',
        message: `Chat with ${userResult.name} is ready.`,
      })
    } catch (error) {
      setStatus((error as Error).message)
      push({ tone: 'error', title: 'Chat could not be opened', message: (error as Error).message })
    }
  }

  async function createDirectChat(event: FormEvent) {
    event.preventDefault()
    if (!searchText.trim()) return
    setStatus(null)
    try {
      const result = await api.createDirectChat({ recipientEmail: searchText.trim() })
      await loadChats(true)
      setActiveChatId(result.chatId)
      setSearchText('')
      setUserResults([])
      setMobileShowConvo(true)
      push({
        tone: 'success',
        title: result.created ? 'Conversation created' : 'Conversation opened',
        message: 'Direct chat is ready.',
      })
    } catch (error) {
      setStatus((error as Error).message)
      push({ tone: 'error', title: 'Chat search failed', message: (error as Error).message })
      if (activeChatId) {
        void loadMessages(activeChatId).catch(() => {})
      }
      void loadChats(false).catch(() => {})
    }
  }

  async function doSend(body: string, media: File[]) {
    if (!activeChatId) return
    if (!body.trim() && media.length === 0) return

    setStatus(null)
    try {
      const sent = await api.sendMessage(activeChatId, {
        body,
        media,
        replyToMessageId: replyingTo?.id,
      })
      setMessages((prev) => appendUniqueMessage(prev, sent))
      setChats((prev) => {
        const targetIndex = prev.findIndex((chat) => chat.id === activeChatId)
        if (targetIndex === -1) return prev
        const updated = {
          ...prev[targetIndex],
          lastMessage: messagePreview(sent),
          lastMessageAt: sent.createdAt,
        }
        return [updated, ...prev.filter((_, index) => index !== targetIndex)]
      })
      setNewMessage('')
      setNewMediaFiles([])
      setReplyingTo(null)
      emitTyping(false)
      setTypingUsers([])
      setUnreadByChat((prev) => ({ ...prev, [activeChatId]: 0 }))
    } catch (error) {
      setStatus((error as Error).message)
      push({ tone: 'error', title: 'Message not sent', message: (error as Error).message })
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    await doSend(newMessage.trim(), newMediaFiles)
  }

  function handleEmojiSelect(emojiData: { emoji: string }) {
    const cursor = composeInputRef.current?.selectionStart ?? newMessage.length
    const before = newMessage.slice(0, cursor)
    const after = newMessage.slice(cursor)
    const updated = before + emojiData.emoji + after
    setNewMessage(updated)
    setTimeout(() => {
      const pos = cursor + emojiData.emoji.length
      composeInputRef.current?.focus()
      composeInputRef.current?.setSelectionRange(pos, pos)
    }, 0)
  }

  async function handleGifSelect(gif: { url: string }) {
    setActivePicker(null)
    await doSend(gif.url, [])
  }

  async function handleToggleReaction(message: ChatMessage, emoji: string) {
    if (!activeChatId || message.isDeleted) return
    setStatus(null)

    try {
      const updated = await api.toggleMessageReaction(activeChatId, message.id, emoji)
      setMessages((prev) => replaceMessage(prev, updated))
      setReplyingTo((prev) => (prev?.id === updated.id ? updated : prev))
      setReactionPickerFor(null)
    } catch (error) {
      setStatus((error as Error).message)
      push({ tone: 'error', title: 'Reaction failed', message: (error as Error).message })
    }
  }

  async function handleDeleteMessage(message: ChatMessage) {
    if (!activeChatId || message.senderId !== user?.id || message.isDeleted) return
    if (!window.confirm('Unsend this message for everyone?')) return

    setStatus(null)
    try {
      const updated = await api.deleteMessage(activeChatId, message.id)
      setMessages((prev) => replaceMessage(prev, updated))
      setReplyingTo((prev) => (prev?.id === updated.id ? updated : prev))
      setReactionPickerFor(null)
    } catch (error) {
      setStatus((error as Error).message)
      push({ tone: 'error', title: 'Message not deleted', message: (error as Error).message })
    }
  }

  if (loading) return <div className="text-muted">Loading chats...</div>

  return (
    <section className="chat-screen">
      <div className="chat-shell">
        <div className="chat-grid">
          <aside className="chat-rail">
            <div className="chat-rail-top">
              <div className="chat-logo">
                <MessageSquare size={18} />
              </div>
              <div className="chat-rail-group">
                <button type="button" className="chat-rail-btn" onClick={() => navigate('/')}>
                  <Home size={17} />
                </button>
                <button type="button" className="chat-rail-btn" onClick={() => navigate('/create')}>
                  <CirclePlus size={17} />
                </button>
                <button type="button" className="chat-rail-btn chat-rail-btn-active">
                  <MessageSquare size={17} />
                </button>
                <button type="button" className="chat-rail-btn" onClick={() => navigate('/reels')}>
                  <Video size={17} />
                </button>
                <button type="button" className="chat-rail-btn" onClick={() => navigate('/explore')}>
                  <Compass size={17} />
                </button>
              </div>
            </div>
            <div className="chat-rail-bottom">
              <button type="button" className="chat-rail-btn" onClick={() => navigate('/profile/edit')}>
                <Settings size={17} />
              </button>
              <button type="button" className="chat-rail-btn chat-rail-btn-active" onClick={() => navigate('/profile')}>
                <UserRound size={17} />
              </button>
            </div>
          </aside>

          <aside className={`chat-list-panel ${mobileShowConvo ? 'chat-mobile-hidden' : ''}`}>
            <form onSubmit={createDirectChat} className="chat-search-row">
              <Search size={16} className="chat-icon-muted" />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search by username or email"
                className="chat-search-input"
              />
              <button type="submit" className="chat-add-btn">
                <CirclePlus size={15} />
              </button>
            </form>

            {userResults.length > 0 ? (
              <div className="chat-search-results">
                {userResults.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="chat-search-item"
                    onClick={() => startChatWithUser(entry)}
                  >
                    {entry.avatarUrl ? (
                      <img src={resolveMediaUrl(entry.avatarUrl)} alt={entry.name} className="chat-search-avatar" />
                    ) : (
                      <div className="chat-search-avatar chat-search-avatar-fallback">
                        {entry.name.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="chat-search-meta">
                      <div>{entry.name}</div>
                      <span>
                        @{entry.username} - {entry.email}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            <div className="chat-list-header">
              <h2>Messages</h2>
              <span>{filteredChats.length}</span>
            </div>

            <div className="chat-list-scroll">
              {filteredChats.length === 0 ? (
                <div className="chat-empty-card">No conversations yet.</div>
              ) : (
                filteredChats.map((chat) => {
                  const active = activeChatId === chat.id
                  const unreadCount = unreadByChat[chat.id] || 0
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => { setActiveChatId(chat.id); setMobileShowConvo(true) }}
                      className={`chat-list-item ${active ? 'chat-list-item-active' : ''}`}
                    >
                      {chat.avatarUrl ? (
                        <img src={resolveMediaUrl(chat.avatarUrl)} alt={chat.title} className="chat-avatar-img" />
                      ) : (
                        <div className="chat-avatar">{(chat.title || '?').slice(0, 1).toUpperCase()}</div>
                      )}
                      <div className="chat-list-content">
                        <div className="chat-list-row">
                          <div className="chat-list-title">{chat.title}</div>
                          <div className="chat-list-meta">
                            {unreadCount > 0 ? <span className="chat-unread-badge">{unreadCount}</span> : null}
                            <span>{formatTime(chat.lastMessageAt)}</span>
                          </div>
                        </div>
                        <p className={unreadCount > 0 ? 'chat-list-text-unread' : ''}>{chat.lastMessage || 'No messages yet'}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          <div className={`chat-conversation ${mobileShowConvo ? 'chat-mobile-visible' : ''}`}>
            <div className="chat-conversation-header">
              <div className="chat-conversation-user">
                <button
                  type="button"
                  className="chat-back-btn"
                  onClick={() => setMobileShowConvo(false)}
                >
                  <ArrowLeft size={18} />
                </button>
                {activeChat?.avatarUrl ? (
                  <img src={resolveMediaUrl(activeChat.avatarUrl)} alt={activeChat.title} className="chat-avatar-img" />
                ) : (
                  <div className="chat-avatar">{(activeChat?.title || '?').slice(0, 1).toUpperCase()}</div>
                )}
                <div>
                  <div className="chat-title">{activeChat?.title || 'Select a chat'}</div>
                  <div className="chat-online">
                    <span />
                    Online
                  </div>
                </div>
              </div>
              <div className="chat-header-actions">
                <button type="button" className="chat-round-action">
                  <Video size={16} />
                </button>
                <button type="button" className="chat-round-action">
                  <ImagePlus size={16} />
                </button>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty-card">No messages in this chat yet.</div>
              ) : (
                messages.map((message) => {
                  const mine = message.senderId === user?.id
                  const reactions = message.reactions || []
                  return (
                    <div key={message.id} className={`chat-message-row ${mine ? 'chat-message-row-mine' : ''}`}>
                      {!mine ? (
                        <MessageAvatar
                          name={message.senderName || 'User'}
                          avatarUrl={message.senderAvatarUrl}
                        />
                      ) : null}
                      <div className={`chat-bubble ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                        {!mine ? <div className="chat-sender">{message.senderName || 'User'}</div> : null}
                        {message.replyTo ? (
                          <div className="chat-reply-preview">
                            <strong>{message.replyTo.senderId === user?.id ? 'You' : message.replyTo.senderName || 'User'}</strong>
                            <span>{replyPreview(message.replyTo)}</span>
                          </div>
                        ) : null}
                        {message.sharedContent ? <SharedContentCard content={message.sharedContent} /> : null}
                        {message.isDeleted ? (
                          <div className="chat-message-deleted">{mine ? 'You unsent a message.' : 'This message was unsent.'}</div>
                        ) : message.body ? (
                          isGifUrl(message.body)
                            ? <div className="chat-message-gif">
                                <img src={message.body.trim()} alt="GIF" loading="lazy" />
                              </div>
                            : <div className="chat-message-body">{message.body}</div>
                        ) : null}
                        {!message.isDeleted ? <MessageAttachmentStack attachments={message.attachments || []} /> : null}
                        {reactions.length > 0 ? (
                          <div className="chat-reaction-list">
                            {reactions.map((reaction) => (
                              <button
                                key={`${message.id}-${reaction.emoji}`}
                                type="button"
                                className={`chat-reaction-chip ${reaction.reactedByMe ? 'chat-reaction-chip-active' : ''}`}
                                onClick={() => handleToggleReaction(message, reaction.emoji)}
                              >
                                <span>{reaction.emoji}</span>
                                <strong>{reaction.count}</strong>
                              </button>
                            ))}
                          </div>
                        ) : null}
                        {reactionPickerFor === message.id && !message.isDeleted ? (
                          <div className="chat-reaction-picker">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={`${message.id}-${emoji}`}
                                type="button"
                                className="chat-reaction-option"
                                onClick={() => handleToggleReaction(message, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        ) : null}
                        <div className="chat-bubble-footer">
                          <div className="chat-time">{formatTime(message.createdAt)}</div>
                          <div className="chat-message-actions">
                            {!message.isDeleted ? (
                              <>
                                <button
                                  type="button"
                                  className="chat-reply-btn"
                                  onClick={() => {
                                    setReplyingTo(message)
                                    composeInputRef.current?.focus()
                                  }}
                                >
                                  <CornerUpLeft size={12} />
                                  Reply
                                </button>
                                <button
                                  type="button"
                                  className="chat-reply-btn"
                                  onClick={() =>
                                    setReactionPickerFor((prev) => (prev === message.id ? null : message.id))
                                  }
                                >
                                  <SmilePlus size={12} />
                                  React
                                </button>
                              </>
                            ) : null}
                            {mine && !message.isDeleted ? (
                              <button
                                type="button"
                                className="chat-reply-btn chat-delete-btn"
                                onClick={() => handleDeleteMessage(message)}
                              >
                                <Trash2 size={12} />
                                Unsend
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              {typingUsers.length > 0 ? (
                <div className="chat-typing-indicator">
                  {activeChat?.isGroup
                    ? `${typingUsers.length} user${typingUsers.length > 1 ? 's are' : ' is'} typing...`
                    : `${activeChat?.title || 'Someone'} is typing...`}
                </div>
              ) : null}
            </div>

            <div className="chat-compose-shell">
              {activePicker ? (
                <div ref={pickerRef} className="chat-picker-popover">
                  {activePicker === 'emoji' && (
                    <EmojiPicker
                      theme={EmojiTheme.DARK}
                      onEmojiClick={handleEmojiSelect}
                      width={350}
                      height={400}
                      searchPlaceholder="Search emoji..."
                      previewConfig={{ showPreview: false }}
                    />
                  )}
                  {activePicker === 'gif' && (
                    <GifPicker
                      tenorApiKey={import.meta.env.VITE_TENOR_API_KEY}
                      theme={GifTheme.DARK}
                      onGifClick={handleGifSelect}
                      width={350}
                      height={400}
                    />
                  )}
                </div>
              ) : null}

              {replyingTo ? (
                <div className="chat-compose-reply">
                  <div className="chat-compose-reply-copy">
                    <strong>{replyingTo.senderId === user?.id ? 'Replying to yourself' : `Replying to ${replyingTo.senderName || 'User'}`}</strong>
                    <span>{messagePreview(replyingTo)}</span>
                  </div>
                  <button type="button" className="chat-compose-reply-close" onClick={() => setReplyingTo(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : null}

              <form onSubmit={sendMessage} className="chat-compose">
                <label className="chat-attach-btn">
                  <Paperclip size={15} />
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
                    onChange={(event) => setNewMediaFiles(Array.from(event.target.files || []))}
                    className="chat-hidden-input"
                  />
                </label>
                <button
                  type="button"
                  onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                  className={`chat-record-btn ${isRecording ? 'chat-record-btn-active' : ''}`}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                >
                  {isRecording ? <Square size={14} /> : <Mic size={15} />}
                </button>
                <button
                  type="button"
                  className={`chat-picker-btn ${activePicker === 'emoji' ? 'chat-picker-btn-active' : ''}`}
                  onClick={() => setActivePicker((p) => (p === 'emoji' ? null : 'emoji'))}
                  title="Emoji"
                >
                  <Smile size={15} />
                </button>
                <button
                  type="button"
                  className={`chat-picker-btn ${activePicker === 'gif' ? 'chat-picker-btn-active' : ''}`}
                  onClick={() => setActivePicker((p) => (p === 'gif' ? null : 'gif'))}
                  title="GIF"
                >
                  <span className="chat-gif-label">GIF</span>
                </button>
                <input
                  ref={composeInputRef}
                  value={newMessage}
                  onChange={(event) => onMessageInputChange(event.target.value)}
                  placeholder="Write a message"
                  className="chat-compose-input"
                />
                <button
                  type="submit"
                  disabled={!activeChatId || (!newMessage.trim() && newMediaFiles.length === 0)}
                  className="chat-send-btn"
                >
                  <SendHorizonal size={15} />
                </button>
              </form>
            </div>
            {isRecording ? <div className="chat-recording-note">Recording voice: {formatDuration(recordingSeconds)}</div> : null}
            {newMediaFiles.length > 0 ? (
              <div className="chat-attach-note">
                Attached: {newMediaFiles.length} file(s)
                <PendingAttachmentStack files={newMediaFiles} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {status ? <p className="chat-status">{status}</p> : null}
    </section>
  )
}
