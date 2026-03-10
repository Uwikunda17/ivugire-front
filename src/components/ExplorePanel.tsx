import { useCallback, useEffect, useMemo, useState } from 'react'
import { Search, Users, TrendingUp } from 'lucide-react'
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
      push({
        tone: 'error',
        title: 'Error',
        message: `Failed to load trending: ${(error as Error).message}`,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setUsers([])
      return
    }

    try {
      setLoading(true)
      const data = await api.exploreSearch(query, 20)
      setUsers(data)
      
      // Initialize following states
      const states: Record<string, boolean> = {}
      data.forEach((user: UserItem) => {
        states[user.id] = user.isFollowing
      })
      setFollowingStates(states)
    } catch (error) {
      push({
        tone: 'error',
        title: 'Error',
        message: `Search failed: ${(error as Error).message}`,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (tab === 'trending') {
      loadTrending()
    }
  }, [tab])

  const debouncedSearch = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null
    return (query: string) => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        setTab('search')
        handleSearch(query)
      }, 300)
    }
  }, [handleSearch])

  async function handleToggleFollow(userId: string) {
    try {
      await api.toggleFollow(userId)
      setFollowingStates((prev) => ({
        ...prev,
        [userId]: !prev[userId],
      }))
      push({
        tone: 'success',
        title: 'Success',
        message: followingStates[userId] ? 'Unfollowed' : 'Following',
      })
    } catch (error) {
      push({
        tone: 'error',
        title: 'Error',
        message: `Failed to update follow: ${(error as Error).message}`,
      })
    }
  }

  const displayUsers = tab === 'trending' ? (trending as UserItem[]) : users

  return (
    <div className="explore-panel">
      <div className="explore-header">
        <h1 className="explore-title">Explore</h1>
      </div>

      <div className="explore-search-container">
        <div className="explore-search-box">
          <Search size={18} className="explore-search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              debouncedSearch(e.target.value)
            }}
            className="explore-search-input"
          />
        </div>
      </div>

      {!search && (
        <div className="explore-tabs">
          <button
            className={`explore-tab ${tab === 'trending' ? 'active' : ''}`}
            onClick={() => setTab('trending')}
          >
            <TrendingUp size={16} />
            Trending
          </button>
          <button className={`explore-tab ${tab === 'search' ? 'active' : ''}`} disabled={!search}>
            <Users size={16} />
            Results
          </button>
        </div>
      )}

      <div className="explore-content">
        {loading ? (
          <div className="explore-loading">
            <div className="spinner" />
          </div>
        ) : displayUsers.length === 0 ? (
          <div className="explore-empty">
            <Users size={40} />
            <p>{tab === 'trending' ? 'No trending users yet' : 'No users found'}</p>
          </div>
        ) : (
          <div className="explore-users-list">
            {displayUsers.map((user) => (
              <div key={user.id} className="explore-user-card">
                <div className="user-card-header">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="user-card-avatar" />
                  ) : (
                    <div className="user-card-avatar user-card-avatar-fallback">
                      {(user.name || '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="user-card-info">
                    <h3 className="user-card-name">{user.name}</h3>
                    <p className="user-card-username">@{user.username}</p>
                    {user.bio && <p className="user-card-bio">{user.bio}</p>}
                    <div className="user-card-followers">{user.followerCount} followers</div>
                  </div>
                </div>

                <button
                  className={`user-card-action-btn ${followingStates[user.id] ? 'following' : ''}`}
                  onClick={() => handleToggleFollow(user.id)}
                >
                  {followingStates[user.id] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
