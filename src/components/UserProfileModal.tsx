import { useEffect, useState } from 'react'
import { X, MapPin, Globe, Mail } from 'lucide-react'
import { api, type UserProfile, type StoryItem } from '../api/client'
import { API_URL } from '../api/client'
import StoryViewer from './StoryViewer'

type Props = {
  username: string
  isOpen: boolean
  onClose: () => void
}

export default function UserProfileModal({ username, isOpen, onClose }: Props) {
  const [profile, setProfile] = useState<UserProfile & {
    followerCount: number
    followingCount: number
    isFollowing: boolean
    isFollowedBy: boolean
    isMutualFollow: boolean
  } | null>(null)
  const [userStories, setUserStories] = useState<StoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedStory, setSelectedStory] = useState<StoryItem | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  useEffect(() => {
    if (!isOpen || !username) return

    async function loadProfile() {
      setLoading(true)
      setError(null)
      try {
        const profileData = await api.getUserProfileByUsername(username)
        setProfile(profileData)
        setIsFollowing(profileData.isFollowing)

        // Load user's stories
        try {
          const stories = await api.getUserStories(profileData.id)
          setUserStories(Array.isArray(stories) ? stories : [])
        } catch (err) {
          console.error('Failed to load user stories:', err)
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [isOpen, username])

  const handleFollow = async () => {
    if (!profile) return
    try {
      const result = await api.toggleFollow(profile.id)
      setIsFollowing(result.following)
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              isFollowing: result.following,
              followerCount: result.following ? prev.followerCount + 1 : prev.followerCount - 1,
            }
          : null,
      )
    } catch (err) {
      console.error('Failed to follow:', err)
    }
  }

  const handleMessage = async () => {
    if (!profile) return
    try {
      const result = await api.createDirectChat({recipientId: profile.id})
      // Navigate to message - you might want to use a router here
      window.location.href = `/chat?chatId=${result.chatId}`
    } catch (err) {
      console.error('Failed to create chat:', err)
    }
  }

  if (!isOpen) return null

  const avatarUrl = profile?.avatarUrl
    ? profile.avatarUrl.startsWith('http')
      ? profile.avatarUrl
      : `${API_URL}${profile.avatarUrl}`
    : null

  if (selectedStory) {
    return (
      <StoryViewer
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
        onNavigate={(direction: 'next' | 'prev') => {
          const currentIndex = userStories.findIndex((s) => s.id === selectedStory.id)
          if (direction === 'next' && currentIndex < userStories.length - 1) {
            setSelectedStory(userStories[currentIndex + 1])
          } else if (direction === 'prev' && currentIndex > 0) {
            setSelectedStory(userStories[currentIndex - 1])
          }
        }}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-lg font-bold text-slate-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
                  <p className="text-slate-600">@{profile.username}</p>
                  {profile.bio && (
                    <p className="text-slate-700 mt-2 text-sm">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="font-bold text-slate-900">{profile.followerCount}</p>
                  <p className="text-slate-600">Followers</p>
                </div>
                <div>
                  <p className="font-bold text-slate-900">{profile.followingCount}</p>
                  <p className="text-slate-600">Following</p>
                </div>
              </div>

              {/* Info */}
              <div className="space-y-2 text-sm">
                {profile.location && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={16} />
                    {profile.location}
                  </div>
                )}
                {profile.website && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Globe size={16} />
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {profile.website}
                    </a>
                  </div>
                )}
                {profile.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={16} />
                    {profile.email}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded-lg font-semibold transition ${
                    isFollowing
                      ? 'border-2 border-slate-300 text-slate-900 hover:bg-slate-50'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button
                  onClick={handleMessage}
                  className="px-4 py-2 border-2 border-slate-300 text-slate-900 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Message
                </button>
              </div>

              {/* Stories Section */}
              {userStories.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-4">Stories</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {userStories.map((story) => (
                      <button
                        key={story.id}
                        onClick={() => setSelectedStory(story)}
                        className="aspect-square bg-slate-200 rounded-lg overflow-hidden group cursor-pointer"
                      >
                        {story.mediaUrl && story.mediaType === 'image' && (
                          <img
                            src={
                              story.mediaUrl.startsWith('http')
                                ? story.mediaUrl
                                : `${API_URL}${story.mediaUrl}`
                            }
                            alt={story.caption}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        )}
                        {story.mediaUrl && story.mediaType === 'video' && (
                          <video
                            src={
                              story.mediaUrl.startsWith('http')
                                ? story.mediaUrl
                                : `${API_URL}${story.mediaUrl}`
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                          />
                        )}
                        {!story.mediaUrl && (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-300 to-slate-400 text-white text-xs text-center p-2">
                            Story
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
