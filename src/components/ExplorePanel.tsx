import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Users, TrendingUp, UserCheck, UserPlus } from 'lucide-react'
import { api } from '../api/client'
import { useToast } from '../state/ToastContext'

type UserItem = {
  id: string
  name: string
  username: string
  bio?: string | null
  avatarUrl?: string | null
  email: string
  isFollowing: boolean
  followerCount: number
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

export default function ExplorePanel() {
  const { push } = useToast()
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<UserItem[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'search' | 'trending'>('trending')
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})

  const loadTrending = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.exploreTrending('users', 20)
      setTrending(data)
    } catch (error) {
      push({ tone: 'error', title: 'Error', message: `Failed to load trending: ${(error as Error).message}` })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setUsers([]); return }
    try {
      setLoading(true)
      const data = await api.exploreSearch(query, 20)
      setUsers(data)
      const states: Record<string, boolean> = {}
      data.forEach((user: UserItem) => { states[user.id] = user.isFollowing })
      setFollowingStates(states)
    } catch (error) {
      push({ tone: 'error', title: 'Error', message: `Search failed: ${(error as Error).message}` })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (tab === 'trending') loadTrending() }, [tab])

  const debouncedSearch = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return (query: string) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => { setTab('search'); handleSearch(query) }, 300)
    }
  }, [handleSearch])

  async function handleToggleFollow(userId: string) {
    const wasFollowing = followingStates[userId]
    setFollowingStates((prev) => ({ ...prev, [userId]: !prev[userId] }))
    try {
      await api.toggleFollow(userId)
      push({ tone: 'success', title: wasFollowing ? 'Unfollowed' : 'Now following', message: undefined })
    } catch (error) {
      setFollowingStates((prev) => ({ ...prev, [userId]: wasFollowing }))
      push({ tone: 'error', title: 'Error', message: `Failed to update follow: ${(error as Error).message}` })
    }
  }

  const displayUsers = tab === 'trending' ? (trending as UserItem[]) : users

  return (
    <>
      <style>{styles}</style>
      <div className="ex-root">

        {/* Header */}
        <div className="ex-header">
          <div className="ex-header-orb ex-orb-a" />
          <div className="ex-header-orb ex-orb-b" />
          <div className="ex-header-noise" />
          <h1 className="ex-title">Explore</h1>
          <p className="ex-subtitle">Discover people to follow</p>
        </div>

        {/* Search */}
        <div className="ex-search-wrap">
          <Search size={15} className="ex-search-icon" />
          <input
            type="text"
            placeholder="Search users…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); debouncedSearch(e.target.value) }}
            className="ex-search-input"
          />
          {search && (
            <button className="ex-search-clear" onClick={() => { setSearch(''); setUsers([]); setTab('trending') }}>
              ×
            </button>
          )}
        </div>

        {/* Tabs */}
        {!search && (
          <div className="ex-tabs">
            <button className={`ex-tab ${tab === 'trending' ? 'active' : ''}`} onClick={() => setTab('trending')}>
              <TrendingUp size={14} /> Trending
            </button>
            <button className={`ex-tab ${tab === 'search' ? 'active' : ''}`} disabled={!search}>
              <Users size={14} /> Results
            </button>
          </div>
        )}

        {/* Content */}
        <div className="ex-content">
          {loading ? (
            <div className="ex-loading">
              <div className="ex-spinner" />
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="ex-empty">
              <div className="ex-empty-icon">
                {tab === 'trending' ? <TrendingUp size={28} /> : <Users size={28} />}
              </div>
              <p>{tab === 'trending' ? 'No trending users yet' : 'No users found'}</p>
            </div>
          ) : (
            <div className="ex-list">
              {displayUsers.map((user, i) => {
                const isFollowing = followingStates[user.id] ?? user.isFollowing
                const initials = (user.name || '?').slice(0, 2).toUpperCase()
                return (
                  <div key={user.id} className="ex-user-card" style={{ '--i': i } as React.CSSProperties}>
                    {/* Rank badge for trending */}
                    {tab === 'trending' && (
                      <span className="ex-rank">#{i + 1}</span>
                    )}

                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="ex-avatar" />
                    ) : (
                      <div className="ex-avatar ex-avatar-fallback">{initials}</div>
                    )}

                    <div className="ex-user-info">
                      <span className="ex-user-name">{user.name}</span>
                      <span className="ex-user-handle">@{user.username}</span>
                      {user.bio && <span className="ex-user-bio">{user.bio}</span>}
                      <span className="ex-user-followers">
                        <Users size={11} /> {fmt(user.followerCount)} followers
                      </span>
                    </div>

                    <button
                      className={`ex-follow-btn ${isFollowing ? 'following' : ''}`}
                      onClick={() => handleToggleFollow(user.id)}
                    >
                      {isFollowing
                        ? <><UserCheck size={13} /> Following</>
                        : <><UserPlus size={13} /> Follow</>
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .ex-root {
    font-family: 'DM Sans', sans-serif;
    color: #f0eee8;
    max-width: 640px;
    margin: 0 auto;
    padding: 24px 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  /* ── Header ── */
  .ex-header {
    position: relative;
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 20px;
    padding: 28px 24px 24px;
    overflow: hidden;
  }
  .ex-header-orb {
    position: absolute; border-radius: 50%;
    filter: blur(55px); pointer-events: none;
  }
  .ex-orb-a {
    width: 240px; height: 240px; top: -100px; left: -50px;
    background: radial-gradient(circle, rgba(124,58,237,0.28) 0%, transparent 70%);
  }
  .ex-orb-b {
    width: 180px; height: 180px; top: -70px; right: 10px;
    background: radial-gradient(circle, rgba(34,211,152,0.2) 0%, transparent 70%);
  }
  .ex-header-noise {
    position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
    background-size: 160px; opacity: 0.3; pointer-events: none;
  }
  .ex-title {
    position: relative; z-index: 2;
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 26px;
    letter-spacing: -0.6px; color: #f5f3ee;
    margin: 0 0 4px;
  }
  .ex-subtitle {
    position: relative; z-index: 2;
    font-size: 13px; font-weight: 300;
    color: rgba(255,255,255,0.35);
    margin: 0;
  }

  /* ── Search ── */
  .ex-search-wrap {
    position: relative;
    display: flex; align-items: center;
  }
  .ex-search-icon {
    position: absolute; left: 14px;
    color: rgba(255,255,255,0.3);
    pointer-events: none;
  }
  .ex-search-input {
    width: 100%;
    padding: 12px 40px 12px 42px;
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    color: #f0eee8;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 400;
    outline: none;
    transition: border-color 0.18s, box-shadow 0.18s;
  }
  .ex-search-input::placeholder { color: rgba(255,255,255,0.25); }
  .ex-search-input:focus {
    border-color: rgba(124,58,237,0.5);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }
  .ex-search-clear {
    position: absolute; right: 12px;
    width: 22px; height: 22px; border-radius: 50%;
    background: rgba(255,255,255,0.08); border: none;
    color: rgba(255,255,255,0.5); font-size: 16px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; padding: 0; line-height: 1;
  }
  .ex-search-clear:hover { background: rgba(255,255,255,0.14); color: #fff; }

  /* ── Tabs ── */
  .ex-tabs {
    display: flex;
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 12px;
    padding: 4px; gap: 4px;
  }
  .ex-tab {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 9px 14px;
    border-radius: 9px; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px; font-weight: 500;
    color: rgba(255,255,255,0.38);
    background: transparent; cursor: pointer;
    transition: all 0.18s;
  }
  .ex-tab:disabled { opacity: 0.25; cursor: not-allowed; }
  .ex-tab.active {
    background: #7c3aed; color: #fff;
    box-shadow: 0 2px 12px rgba(124,58,237,0.3);
  }
  .ex-tab:not(.active):not(:disabled):hover {
    background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.65);
  }

  /* ── Content ── */
  .ex-content {
    min-height: 120px;
  }
  .ex-loading {
    display: flex; align-items: center; justify-content: center;
    padding: 48px;
  }
  .ex-spinner {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.08);
    border-top-color: #7c3aed;
    animation: ex-spin 0.7s linear infinite;
  }
  @keyframes ex-spin { to { transform: rotate(360deg); } }
  .ex-empty {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 48px 24px; text-align: center;
  }
  .ex-empty-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.25);
  }
  .ex-empty p {
    font-size: 13.5px; color: rgba(255,255,255,0.3);
    font-weight: 300; margin: 0;
  }

  /* ── User list ── */
  .ex-list {
    display: flex; flex-direction: column; gap: 8px;
  }
  .ex-user-card {
    position: relative;
    display: flex; align-items: center; gap: 14px;
    padding: 14px 16px;
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 14px;
    transition: border-color 0.18s, background 0.18s;
    animation: ex-fade-in 0.25s ease both;
    animation-delay: calc(var(--i, 0) * 30ms);
  }
  .ex-user-card:hover {
    border-color: rgba(124,58,237,0.25);
    background: #131318;
  }
  @keyframes ex-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .ex-rank {
    position: absolute; top: 10px; right: 14px;
    font-family: 'Syne', sans-serif;
    font-weight: 700; font-size: 11px;
    color: rgba(255,255,255,0.18);
    letter-spacing: 0.3px;
  }

  /* Avatar */
  .ex-avatar {
    width: 46px; height: 46px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
    border: 2px solid rgba(255,255,255,0.08);
    display: block;
  }
  .ex-avatar-fallback {
    background: linear-gradient(135deg, #7c3aed, #2dd4bf);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800; font-size: 16px; color: #fff;
  }

  /* User info */
  .ex-user-info {
    flex: 1; min-width: 0;
    display: flex; flex-direction: column; gap: 2px;
  }
  .ex-user-name {
    font-family: 'Syne', sans-serif;
    font-weight: 600; font-size: 14px;
    color: #f0eee8; letter-spacing: -0.1px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ex-user-handle {
    font-size: 12px; color: rgba(255,255,255,0.35);
  }
  .ex-user-bio {
    font-size: 12.5px; font-weight: 300;
    color: rgba(255,255,255,0.45);
    line-height: 1.4;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 2px;
  }
  .ex-user-followers {
    display: flex; align-items: center; gap: 4px;
    font-size: 11.5px; color: rgba(255,255,255,0.28);
    margin-top: 3px;
  }

  /* Follow button */
  .ex-follow-btn {
    flex-shrink: 0;
    display: flex; align-items: center; gap: 6px;
    padding: 8px 14px;
    border-radius: 9px; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 12.5px; font-weight: 500;
    cursor: pointer; transition: all 0.18s;
    background: #7c3aed; color: #fff;
    box-shadow: 0 2px 10px rgba(124,58,237,0.25);
  }
  .ex-follow-btn:hover {
    background: #6d28d9;
    box-shadow: 0 3px 14px rgba(124,58,237,0.4);
    transform: translateY(-1px);
  }
  .ex-follow-btn.following {
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.5);
    border: 1px solid rgba(255,255,255,0.09);
    box-shadow: none;
  }
  .ex-follow-btn.following:hover {
    background: rgba(248,113,113,0.1);
    color: #f87171;
    border-color: rgba(248,113,113,0.25);
    transform: none;
  }
`