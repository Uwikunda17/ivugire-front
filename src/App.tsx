import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Reels from './pages/Reels'
import Profile from './pages/Profile'
import Create from './pages/Create'
import AuthPage from './pages/AuthPage'
import Chat from './pages/Chat'
import UpdateProfile from './pages/UpdateProfile'
import { AuthProvider, useAuth } from './state/AuthContext'
import { ToastProvider } from './state/ToastContext'

function Protected({ children }: { children: ReactElement }) {
  const { token, loading } = useAuth()
  if (loading) return <div className="p-6 text-muted">Checking session...</div>
  if (!token) return <Navigate to="/auth" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route
              element={
                <Protected>
                  <AppLayout />
                </Protected>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/profile" element={<Profile />} />            <Route path="/:username" element={<Profile />} />              <Route path="/profile/edit" element={<UpdateProfile />} />
              <Route path="/create" element={<Create />} />
            </Route>
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
