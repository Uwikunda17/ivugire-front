import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../state/AuthContext'

let globalSocket: Socket | null = null

export function useSocket(): Socket | null {
  const { user } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!user) {
      if (globalSocket) {
        globalSocket.disconnect()
        globalSocket = null
      }
      setSocket(null)
      return
    }

    // Reuse existing socket if available
    if (globalSocket && globalSocket.connected) {
      setSocket(globalSocket)
      return
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
    const newSocket = io(apiUrl, {
      auth: {
        token: localStorage.getItem('token') || '',
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    newSocket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    globalSocket = newSocket
    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      // Don't disconnect on unmount - keep the socket alive
      // This allows other components to use the same socket
    }
  }, [user])

  return socket || globalSocket
}

export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect()
    globalSocket = null
  }
}
