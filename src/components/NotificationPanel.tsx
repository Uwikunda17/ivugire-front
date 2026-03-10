import { useCallback, useEffect, useState } from 'react'
import { X, Heart, Users, MessageCircle, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { API_URL, api } from '../api/client'
import { useToast } from '../state/ToastContext'
import { useAuth } from '../state/AuthContext'

function resolveMediaUrl(url?: string | null) {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_URL}${url}`
}

type Notification = {
  id: string
  userId: string
  actorId: string
  notificationType: string
  relatedPostId?: string
  relatedStoryId?: string
  relatedChatId?: string
  text: string
  isRead: boolean
  createdAt: string
  actor?: {
    id: string
    name: string
    username: string
    avatarUrl?: string | null
  }
}

export default function NotificationPanel({
  isOpen,
  onClose,
  socket,
}: {
  isOpen: boolean
  onClose: () => void
  socket?: any
}) {
  const { push } = useToast()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getNotifications(50, 0, filter === 'unread')
      setNotifications(data as unknown as Notification[])

      // Load unread count
      const { unread } = await api.getUnreadNotificationCount()
      setUnreadCount(unread)
    } catch (error) {
      push({
        tone: 'error',
        title: 'Error',
        message: `Failed to load notifications: ${(error as Error).message}`,
      })
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    if (isOpen) {
      loadNotifications()
    }
  }, [isOpen, filter])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (data: any) => {
      // Add to top of notifications
      const newNotification: Notification = {
        id: data.notificationId || data.id,
        userId: currentUser?.id || '',
        actorId: data.actorId,
        notificationType: data.type,
        relatedPostId: data.relatedPostId,
        relatedStoryId: data.relatedStoryId,
        relatedChatId: data.relatedChatId,
        text: data.text || '',
        isRead: false,
        createdAt: new Date().toISOString(),
        actor: data.actor,
      }

      setNotifications((prev) => [newNotification, ...prev])
      setUnreadCount((prev) => prev + 1)

      if (Notification.permission === 'granted') {
        new Notification(`${data.actor?.name || 'Someone'} ${data.text || 'did something'}`, {
          icon: data.actor?.avatarUrl,
        })
      }
    }

    socket.on('notification', handleNewNotification)
    return () => socket.off('notification', handleNewNotification)
  }, [socket, currentUser])

  async function handleMarkAsRead(notificationId: string) {
    try {
      await api.markNotificationAsRead(notificationId)
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n)),
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      push({
        tone: 'error',
        title: 'Error',
        message: `Failed to mark as read: ${(error as Error).message}`,
      })
    }
  }

  async function handleDelete(notificationId: string) {
    try {
      await api.deleteNotification(notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      push({
        tone: 'error',
        title: 'Error',
        message: `Failed to delete notification: ${(error as Error).message}`,
      })
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api.markAllNotificationsAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      push({
        tone: 'error',
        title: 'Error',
        message: `Failed to mark all as read: ${(error as Error).message}`,
      })
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return <Users size={16} className="notification-icon follow" />
      case 'like':
        return <Heart size={16} className="notification-icon like" />
      case 'comment':
        return <MessageCircle size={16} className="notification-icon comment" />
      default:
        return <MessageCircle size={16} className="notification-icon" />
    }
  }

  const handleActorClick = (username?: string) => {
    if (username) {
      navigate(`/${username}`)
      onClose()
    }
  }

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications

  if (!isOpen) return null

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-panel-header">
          <h2 className="notification-panel-title">Notifications</h2>
          <button className="notification-panel-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="notification-panel-controls">
          <div className="notification-filter-tabs">
            <button
              className={`notification-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`notification-filter-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
            </button>
          </div>

          {filteredNotifications.length > 0 && unreadCount > 0 && (
            <button className="notification-mark-all-btn" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>

        <div className="notification-panel-content">
          {loading ? (
            <div className="notification-loading">
              <div className="spinner" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notification-empty">
              <MessageCircle size={40} />
              <p>No {filter === 'unread' ? 'unread' : ''} notifications</p>
            </div>
          ) : (
            <div className="notification-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-item-avatar">
                    {notification.actor?.avatarUrl ? (
                      <img
                        src={resolveMediaUrl(notification.actor.avatarUrl)}
                        alt={notification.actor?.name}
                        className="avatar-img"
                      />
                    ) : (
                      <div className="avatar-fallback">
                        {(notification.actor?.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="notification-item-content">
                    <div className="notification-item-header">
                      {getNotificationIcon(notification.notificationType)}
                      <button
                        className="notification-item-text-btn"
                        onClick={() => handleActorClick(notification.actor?.username)}
                      >
                        <span className="notification-actor-name">
                          {notification.actor?.name || 'Someone'}
                        </span>
                        {' '}
                        <span className="notification-action-text">
                          {notification.notificationType === 'follow' ? 'followed you' : 'liked your post'}
                        </span>
                      </button>
                    </div>
                    <p className="notification-item-time">
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </p>
                  </div>

                  <div className="notification-item-actions">
                    {!notification.isRead && (
                      <button
                        className="notification-action-btn"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        ●
                      </button>
                    )}
                    <button
                      className="notification-action-btn delete"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
