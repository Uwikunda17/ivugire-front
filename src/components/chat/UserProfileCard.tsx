import { useEffect, useState } from 'react'
import { UserPlus, UserCheck, Phone, Video, X, MapPin, Globe } from 'lucide-react'
import { api } from '../../api/client'
import { useToast } from '../../state/ToastContext'

type Props = {
  userId: string
  onClose?: () => void
}

export default function UserProfileCard({ userId, onClose }: Props) {
  const { push } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    async function loadProfile() {
      try {
        setLoading(true)
        const data = await api.getUserProfile(userId)
        setProfile(data)
        setIsFollowing(data.isFollowing)
      } catch (error) {
        push({ tone: 'error', title: 'Error', message: `Failed to load profile: ${(error as Error).message}` })
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [userId])

  async function handleToggleFollow() {
    try {
      const result = await api.toggleFollow(userId)
      setIsFollowing(result.following)
      push({ tone: 'success', title: 'Success', message: result.following ? 'Following user' : 'Unfollowed user' })
    } catch (error) {
      push({ tone: 'error', title: 'Error', message: `Failed to update follow: ${(error as Error).message}` })
    }
  }

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="upc-card">
          <div className="upc-skeleton-shimmer" />
          <div className="upc-skeleton-avatar" />
          <div className="upc-skeleton-line long" />
          <div className="upc-skeleton-line short" />
          <div className="upc-skeleton-line medium" />
        </div>
      </>
    )
  }

  if (!profile) return null

  const initials = (profile.name || '?').slice(0, 2).toUpperCase()

  return (
    <>
      <style>{styles}</style>
      <div className="upc-card">
        {/* Close */}
        <button className="upc-close" onClick={onClose} aria-label="Close">
          <X size={16} />
        </button>

        {/* Banner / avatar section */}
        <div className="upc-banner">
          <div className="upc-banner-noise" />
          <div className="upc-banner-orb upc-orb-1" />
          <div className="upc-banner-orb upc-orb-2" />
        </div>

        <div className="upc-avatar-wrap">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.name} className="upc-avatar" />
          ) : (
            <div className="upc-avatar upc-avatar-fallback">{initials}</div>
          )}
          {isFollowing && <span className="upc-following-badge">✓</span>}
        </div>

        {/* Body */}
        <div className="upc-body">
          <div className="upc-identity">
            <h2 className="upc-name">{profile.name}</h2>
            {profile.username && <span className="upc-handle">@{profile.username}</span>}
          </div>

          {profile.bio && <p className="upc-bio">{profile.bio}</p>}

          {/* Stats */}
          <div className="upc-stats">
            <div className="upc-stat">
              <span className="upc-stat-num">{fmt(profile.followerCount)}</span>
              <span className="upc-stat-label">Followers</span>
            </div>
            <div className="upc-stat-divider" />
            <div className="upc-stat">
              <span className="upc-stat-num">{fmt(profile.followingCount)}</span>
              <span className="upc-stat-label">Following</span>
            </div>
          </div>

          {/* Actions */}
          <div className="upc-actions">
            <button
              className={`upc-btn upc-btn-follow ${isFollowing ? 'is-following' : ''}`}
              onClick={handleToggleFollow}
            >
              {isFollowing ? <><UserCheck size={16} /> Following</> : <><UserPlus size={16} /> Follow</>}
            </button>

            {profile.isMutualFollow ? (
              <div className="upc-call-btns">
                <button className="upc-btn upc-btn-icon" title="Voice call">
                  <Phone size={16} />
                </button>
                <button className="upc-btn upc-btn-icon" title="Video call">
                  <Video size={16} />
                </button>
              </div>
            ) : (
              <span className="upc-mutual-hint">Follow each other to call</span>
            )}
          </div>

          {/* Meta */}
          {(profile.location || profile.website) && (
            <div className="upc-meta">
              {profile.location && (
                <div className="upc-meta-row">
                  <MapPin size={13} />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <div className="upc-meta-row">
                  <Globe size={13} />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="upc-link">
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function fmt(n: number | undefined) {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .upc-card {
    position: relative;
    width: 320px;
    background: #0e0e12;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    color: #f0eee8;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.04),
      0 24px 64px rgba(0,0,0,0.6),
      0 4px 16px rgba(0,0,0,0.4);
  }

  /* Close button */
  .upc-close {
    position: absolute;
    top: 14px;
    right: 14px;
    z-index: 20;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: rgba(0,0,0,0.4);
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(255,255,255,0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    backdrop-filter: blur(8px);
  }
  .upc-close:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
    transform: scale(1.05);
  }

  /* Banner */
  .upc-banner {
    position: relative;
    height: 110px;
    background: linear-gradient(135deg, #1a0a2e 0%, #0d1a3a 50%, #0a2218 100%);
    overflow: hidden;
  }
  .upc-banner-noise {
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E");
    background-size: 160px;
    opacity: 0.4;
  }
  .upc-banner-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(40px);
  }
  .upc-orb-1 {
    width: 160px; height: 160px;
    top: -60px; left: -30px;
    background: radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%);
  }
  .upc-orb-2 {
    width: 120px; height: 120px;
    top: -40px; right: 20px;
    background: radial-gradient(circle, rgba(34,211,152,0.25) 0%, transparent 70%);
  }

  /* Avatar */
  .upc-avatar-wrap {
    position: relative;
    margin: -42px 0 0 24px;
    display: inline-block;
    z-index: 10;
  }
  .upc-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    border: 3px solid #0e0e12;
    object-fit: cover;
    display: block;
  }
  .upc-avatar-fallback {
    background: linear-gradient(135deg, #7c3aed, #2dd4bf);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    font-size: 26px;
    color: #fff;
    letter-spacing: -0.5px;
  }
  .upc-following-badge {
    position: absolute;
    bottom: 2px;
    right: 2px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #22d3a0;
    border: 2px solid #0e0e12;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
    color: #0e0e12;
  }

  /* Body */
  .upc-body {
    padding: 12px 24px 24px;
  }
  .upc-identity {
    margin-bottom: 10px;
  }
  .upc-name {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 20px;
    letter-spacing: -0.4px;
    color: #f5f3ee;
    margin: 0 0 3px;
    line-height: 1.2;
  }
  .upc-handle {
    font-size: 13px;
    color: rgba(255,255,255,0.38);
    font-weight: 400;
    letter-spacing: 0.2px;
  }
  .upc-bio {
    font-size: 13.5px;
    line-height: 1.6;
    color: rgba(240,238,232,0.62);
    margin: 0 0 18px;
    font-weight: 300;
  }

  /* Stats */
  .upc-stats {
    display: flex;
    align-items: center;
    gap: 0;
    margin-bottom: 20px;
    padding: 14px 0;
    border-top: 1px solid rgba(255,255,255,0.06);
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .upc-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }
  .upc-stat-num {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 18px;
    color: #f5f3ee;
    letter-spacing: -0.5px;
  }
  .upc-stat-label {
    font-size: 11px;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-weight: 500;
  }
  .upc-stat-divider {
    width: 1px;
    height: 28px;
    background: rgba(255,255,255,0.08);
  }

  /* Actions */
  .upc-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 18px;
  }
  .upc-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 13.5px;
    font-weight: 500;
    transition: all 0.18s ease;
  }
  .upc-btn-follow {
    flex: 1;
    padding: 10px 16px;
    background: #7c3aed;
    color: #fff;
    letter-spacing: 0.1px;
    box-shadow: 0 2px 16px rgba(124,58,237,0.3);
  }
  .upc-btn-follow:hover {
    background: #6d28d9;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(124,58,237,0.4);
  }
  .upc-btn-follow.is-following {
    background: rgba(255,255,255,0.07);
    color: rgba(255,255,255,0.6);
    box-shadow: none;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .upc-btn-follow.is-following:hover {
    background: rgba(255,80,80,0.12);
    color: #f87171;
    border-color: rgba(248,113,113,0.3);
    box-shadow: none;
  }
  .upc-call-btns {
    display: flex;
    gap: 8px;
  }
  .upc-btn-icon {
    width: 40px;
    height: 40px;
    padding: 0;
    background: rgba(255,255,255,0.06);
    color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.09);
  }
  .upc-btn-icon:hover {
    background: rgba(34,211,160,0.12);
    color: #22d3a0;
    border-color: rgba(34,211,160,0.3);
    transform: translateY(-1px);
  }
  .upc-mutual-hint {
    font-size: 12px;
    color: rgba(255,255,255,0.28);
    line-height: 1.4;
    flex: 1;
    text-align: right;
  }

  /* Meta */
  .upc-meta {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .upc-meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255,255,255,0.38);
    font-size: 12.5px;
  }
  .upc-meta-row svg {
    flex-shrink: 0;
    opacity: 0.6;
  }
  .upc-link {
    color: rgba(139,92,246,0.8);
    text-decoration: none;
    transition: color 0.15s;
  }
  .upc-link:hover {
    color: #a78bfa;
  }

  /* Skeleton */
  .upc-skeleton-shimmer {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg,
      rgba(255,255,255,0) 0%,
      rgba(255,255,255,0.04) 50%,
      rgba(255,255,255,0) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    z-index: 5;
  }
  .upc-skeleton-avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    margin: 24px 0 16px 24px;
  }
  .upc-skeleton-line {
    height: 12px;
    border-radius: 6px;
    background: rgba(255,255,255,0.05);
    margin: 10px 24px;
  }
  .upc-skeleton-line.long { width: calc(100% - 48px); }
  .upc-skeleton-line.medium { width: 60%; }
  .upc-skeleton-line.short { width: 40%; }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`