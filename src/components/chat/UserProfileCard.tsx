import { useEffect, useState } from 'react'
import { UserPlus, UserCheck, Phone, Video, X } from 'lucide-react'
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
        push({
          tone: 'error',
          title: 'Error',
          message: `Failed to load profile: ${(error as Error).message}`,
        })
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
      push({
        tone: 'success',
        title: 'Success',
        message: result.following ? 'Following user' : 'Unfollowed user',
      })
    } catch (error) {
      push({
        tone: 'error',
        title: 'Error',
        message: `Failed to update follow: ${(error as Error).message}`,
      })
    }
  }

  if (loading) {
    return (
      <div className="user-profile-card loading">
        <div className="profile-skeleton" />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="user-profile-card">
      <button className="profile-close-btn" onClick={onClose}>
        <X size={20} />
      </button>

      <div className="profile-header">
        {profile.avatarUrl ? (
          <img src={profile.avatarUrl} alt={profile.name} className="profile-avatar-large" />
        ) : (
          <div className="profile-avatar-large profile-avatar-fallback">
            {(profile.name || '?').slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className="profile-info">
        <h2 className="profile-name">{profile.name}</h2>
        {profile.username && <p className="profile-username">@{profile.username}</p>}

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <div className="profile-stats">
          <div className="stat">
            <strong>{profile.followerCount || 0}</strong>
            <span>Followers</span>
          </div>
          <div className="stat">
            <strong>{profile.followingCount || 0}</strong>
            <span>Following</span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="action-btn follow-btn" onClick={handleToggleFollow}>
            {isFollowing ? (
              <>
                <UserCheck size={18} />
                Following
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Follow
              </>
            )}
          </button>

          {profile.isMutualFollow && (
            <>
              <button className="action-btn call-btn audio">
                <Phone size={18} />
                Call
              </button>
              <button className="action-btn call-btn video">
                <Video size={18} />
                Video
              </button>
            </>
          )}

          {!profile.isMutualFollow && (
            <p className="text-sm text-gray-500 text-center">
              Follow each other to start calling
            </p>
          )}
        </div>

        {profile.location && (
          <div className="profile-location">
            📍 {profile.location}
          </div>
        )}

        {profile.website && (
          <div className="profile-website">
            🔗{' '}
            <a href={profile.website} target="_blank" rel="noopener noreferrer">
              {profile.website}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
