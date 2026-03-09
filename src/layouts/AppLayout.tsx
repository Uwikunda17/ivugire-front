import { Outlet, useLocation } from 'react-router-dom'
import TopBar from '../components/TopBar'
import BottomNav from '../components/BottomNav'

export default function AppLayout() {
  const { pathname } = useLocation()
  const isChatPage = pathname.startsWith('/chat')

  return (
    <div className={`min-h-screen bg-[#d9e5e3] text-slate-900 flex flex-col ${isChatPage ? '' : 'pb-16'}`}>
      {isChatPage ? null : <TopBar />}
      <main className={`flex-1 w-full mx-auto ${isChatPage ? 'max-w-none p-0' : 'max-w-5xl px-4 py-4'}`}>
        <Outlet />
      </main>
      {isChatPage ? null : <BottomNav />}
    </div>
  )
}
