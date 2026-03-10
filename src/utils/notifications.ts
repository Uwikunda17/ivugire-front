/**
 * Browser Notification Utilities
 */

export async function requestNotificationPermission(): Promise<boolean> {
  // Check if the browser supports notifications
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications')
    return false
  }

  // Check current permission
  if (Notification.permission === 'granted') {
    return true
  }

  // Request permission if not already denied
  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    } catch (error) {
      console.error('Failed to request notification permission:', error)
      return false
    }
  }

  return false
}

export function sendBrowserNotification(
  title: string,
  options?: NotificationOptions,
): Notification | null {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications')
    return null
  }

  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted')
    return null
  }

  return new Notification(title, {
    icon: '/favicon.ico',
    ...options,
  })
}

export function setupNotificationListeners(
  socket: any,
  onNotification?: (data: any) => void,
): () => void {
  if (!socket) return () => {}

  const handleNotification = async (data: any) => {
    // Prepare notification
    const title = `${data.actor?.name || 'Someone'} ${
      data.type === 'follow' ? 'followed you' : 'liked your post'
    }`

    const options: NotificationOptions = {
      body: data.text || title,
      icon: data.actor?.avatarUrl,
      tag: data.notificationId || data.id, // Prevent duplicate notifications
      requireInteraction: false,
    }

    sendBrowserNotification(title, options)

    if (onNotification) {
      onNotification(data)
    }
  }

  socket.on('notification', handleNotification)

  // Return cleanup function
  return () => {
    socket.off('notification', handleNotification)
  }
}
