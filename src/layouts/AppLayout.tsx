import { Outlet, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'
import NotificationPanel from '../components/NotificationPanel'
import { useAuth } from '../state/AuthContext'
import { useSocket } from '../hooks/useSocket'
import { api } from '../api/client'
import { requestNotificationPermission } from '../utils/notifications'

export default function AppLayout() {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const socket = useSocket()
  const isChatPage = pathname.startsWith('/chat')

  const [notificationOpen, setNotificationOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Request browser notification permission on first user login
  useEffect(() => {
    if (user && !localStorage.getItem('notification-permission-asked')) {
      requestNotificationPermission()
      localStorage.setItem('notification-permission-asked', 'true')
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    // Load initial unread count
    const loadUnreadCount = async () => {
      try {
        const { unread } = await api.getUnreadNotificationCount()
        setUnreadCount(unread)
      } catch (error) {
        console.error('Failed to load unread count:', error)
      }
    }

    loadUnreadCount()

    // Listen for new notifications
    let cleanup: (() => void) | undefined

    if (socket) {
      const handleNewNotification = () => {
        setUnreadCount((prev) => prev + 1)
      }

      socket.on('notification', handleNewNotification)
      cleanup = () => socket.off('notification', handleNewNotification)
    }

    return cleanup
  }, [user, socket])

  return (
    <div className={`min-h-screen bg-[#d9e5e3] text-slate-900 flex flex-col pb-16 md:pb-0 md:ml-16 ${isChatPage ? '' : ''}`}>
      {isChatPage ? null : (
        <TopBar
          onNotificationOpen={() => setNotificationOpen(true)}
          unreadCount={unreadCount}
        />
      )}
      <main className={`flex-1 w-full mx-auto ${isChatPage ? 'max-w-none p-0' : 'max-w-5xl px-4 py-4'}`}>
        <Outlet />
      </main>
      <BottomNav
        unreadNotifications={unreadCount}
        onNotificationsOpen={() => setNotificationOpen(true)}
      />

      <NotificationPanel
        isOpen={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        socket={socket}
      />
    </div>
  )
}
