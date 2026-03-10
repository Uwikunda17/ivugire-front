const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export type UserProfile = {
  id: string
  email: string
  name: string
  username: string
  bio?: string | null
  location?: string | null
  website?: string | null
  avatarUrl?: string | null
  createdAt?: string
}

export type FeedItem = {
  id: string
  caption: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'audio'
  mediaDurationSeconds?: number | null
  trimEndSeconds?: number | null
  isTrimmed: boolean
  postKind: 'post' | 'reel'
  createdAt: string
  authorId: string
  authorName: string
  authorUsername: string
  authorEmail: string
  authorAvatarUrl?: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  viewerCount: number
  likedByMe: boolean
}

export type PostComment = {
  id: string
  body: string
  createdAt: string
  userId: string
  userName: string
  username: string
  avatarUrl?: string | null
}

export type StoryItem = {
  id: string
  caption: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'audio'
  mediaDurationSeconds?: number | null
  trimEndSeconds?: number | null
  isTrimmed?: boolean
  stickerText?: string | null
  animationPreset?: 'none' | 'pulse' | 'float' | 'glow' | 'wave' | null
  mediaFilter?: 'none' | 'grayscale' | 'warm' | 'cool' | 'vivid' | null
  wordFilterLevel?: 'none' | 'mild' | 'strict' | null
  createdAt: string
  expiresAt: string
  authorId?: string
  authorName?: string
  authorUsername?: string
  authorAvatarUrl?: string | null
  repostFromStoryId?: string | null
  repostFromUserId?: string | null
  repostFromUserName?: string | null
  repostFromUserUsername?: string | null
  repostFromUserAvatarUrl?: string | null
  taggedUsers?: StoryTaggedUser[]
  viewerCount: number
  viewedByMe?: boolean
}

export type StoryTaggedUser = {
  id: string
  name: string
  username: string
  avatarUrl?: string | null
}

export type StoryViewer = {
  id: string
  name: string
  username: string
  email: string
  avatarUrl?: string | null
  viewedAt: string
}

export type ChatItem = {
  id: string
  title: string
  isGroup: boolean
  username?: string | null
  email?: string | null
  avatarUrl?: string | null
  lastMessage?: string | null
  lastMessageAt?: string | null
}

export type ChatAttachment = {
  id: string
  fileUrl: string
  fileType: 'image' | 'video' | 'audio' | 'document' | 'file'
  fileName: string
  fileSize: number
}

export type ChatReplyReference = {
  id: string
  body: string
  senderId: string
  senderName?: string
  attachmentLabel?: string | null
  isDeleted?: boolean
}

export type ChatReaction = {
  emoji: string
  count: number
  reactedByMe: boolean
}

export type ChatSharedContent = {
  type: 'post' | 'reel' | 'story'
  id: string
  title: string
  caption: string
  mediaUrl: string
  mediaType: 'image' | 'video' | 'audio'
  trimEndSeconds?: number | null
  isTrimmed?: boolean
  createdAt: string
  expiresAt?: string
  authorId?: string
  authorName?: string
  authorUsername?: string
  authorAvatarUrl?: string | null
  repostFromUserId?: string | null
  repostFromUserName?: string | null
  repostFromUserUsername?: string | null
  repostFromUserAvatarUrl?: string | null
}

export type ChatMessage = {
  id: string
  body: string
  senderId: string
  senderName?: string
  senderAvatarUrl?: string | null
  createdAt: string
  isDeleted?: boolean
  deletedAt?: string | null
  replyTo?: ChatReplyReference | null
  reactions?: ChatReaction[]
  sharedContent?: ChatSharedContent | null
  attachments: ChatAttachment[]
}

export type UserSearchResult = {
  id: string
  name: string
  username: string
  email: string
  avatarUrl?: string | null
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: Record<string, unknown> | FormData
}

function normalizeErrorMessage(response: Response, payload: Record<string, unknown>, raw: string) {
  if (payload.error || payload.message) {
    return String(payload.error || payload.message)
  }

  const cannotGetMatch = raw.match(/Cannot GET ([^\s<]+)/i)
  if (cannotGetMatch) {
    return `backend_route_missing:${cannotGetMatch[1]}`
  }

  const cleaned = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  if (cleaned) return cleaned

  return `${response.status}_${response.statusText || 'request_failed'}`
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('token')
  const headers: Record<string, string> = {}
  const isFormData = options.body instanceof FormData

  if (!isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body
      ? isFormData
        ? (options.body as FormData)
        : JSON.stringify(options.body)
      : undefined,
  })

  const raw = await response.text().catch(() => '')
  let payload: Record<string, unknown> = {}
  if (raw) {
    try {
      payload = JSON.parse(raw) as Record<string, unknown>
    } catch {
      payload = {}
    }
  }

  if (!response.ok) {
    throw new Error(normalizeErrorMessage(response, payload, raw))
  }

  if (!raw) {
    return {} as T
  }

  if (Object.keys(payload).length > 0) {
    return payload as T
  }

  return raw as T
}

export const api = {
  register(payload: { name: string; email: string; password: string }) {
    return request<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: payload,
    })
  },
  login(payload: { email: string; password: string }) {
    return request<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: payload,
    })
  },
  me() {
    return request<UserProfile>('/api/auth/me')
  },
  feed() {
    return request<FeedItem[]>('/api/feed')
  },
  reels() {
    return request<FeedItem[]>('/api/reels')
  },
  myPosts() {
    return request<FeedItem[]>('/api/posts/me')
  },
  createPost(formData: FormData) {
    return request<FeedItem>('/api/posts', {
      method: 'POST',
      body: formData,
    })
  },
  deletePost(postId: string) {
    return request<{ deleted: boolean; postId: string }>(`/api/posts/${postId}`, {
      method: 'DELETE',
    })
  },
  toggleLike(postId: string) {
    return request<{ liked: boolean; likeCount: number }>(`/api/posts/${postId}/like`, {
      method: 'POST',
    })
  },
  sharePost(postId: string) {
    return request<{ shareCount: number }>(`/api/posts/${postId}/share`, {
      method: 'POST',
    })
  },
  listComments(postId: string) {
    return request<PostComment[]>(`/api/posts/${postId}/comments`)
  },
  addComment(postId: string, body: string) {
    return request<{ id: string; body: string; createdAt: string; commentCount: number }>(
      `/api/posts/${postId}/comments`,
      {
        method: 'POST',
        body: { body },
      },
    )
  },
  activeStories() {
    return request<StoryItem[]>('/api/stories/active')
  },
  myStories(scope: 'active' | 'archived') {
    return request<StoryItem[]>(`/api/stories/me?scope=${scope}`)
  },
  createStory(formData: FormData) {
    return request<StoryItem>('/api/stories', {
      method: 'POST',
      body: formData,
    })
  },
  repostStory(
    storyId: string,
    payload: {
      caption?: string
      stickerText?: string
      animationPreset?: 'none' | 'pulse' | 'float' | 'glow' | 'wave'
      mediaFilter?: 'none' | 'grayscale' | 'warm' | 'cool' | 'vivid'
      wordFilterLevel?: 'none' | 'mild' | 'strict'
      taggedUserIds?: string[]
    } = {},
  ) {
    return request<StoryItem>(`/api/stories/${storyId}/repost`, {
      method: 'POST',
      body: payload,
    })
  },
  viewStory(storyId: string) {
    return request<{ viewed: boolean }>(`/api/stories/${storyId}/view`, {
      method: 'POST',
    })
  },
  storyViewers(storyId: string) {
    return request<StoryViewer[]>(`/api/stories/${storyId}/viewers`)
  },
  getProfile() {
    return request<UserProfile>('/api/profile')
  },
  updateProfile(payload: {
    name: string
    username: string
    bio?: string
    location?: string
    website?: string
    avatarUrl?: string
  }) {
    return request<UserProfile>('/api/profile', {
      method: 'PUT',
      body: payload,
    })
  },
  listChats() {
    return request<ChatItem[]>('/api/chats')
  },
  searchUsers(query: string) {
    return request<UserSearchResult[]>(`/api/users/search?q=${encodeURIComponent(query)}`)
  },
  createDirectChat(payload: { recipientEmail?: string; recipientId?: string }) {
    return request<{ chatId: string; created: boolean }>('/api/chats/direct', {
      method: 'POST',
      body: payload,
    })
  },
  listMessages(chatId: string) {
    return request<ChatMessage[]>(`/api/chats/${chatId}/messages`)
  },
  sendMessage(chatId: string, payload: {
    body?: string
    media?: File[]
    replyToMessageId?: string
    sharedType?: 'post' | 'reel' | 'story'
    sharedItemId?: string
  }) {
    const formData = new FormData()
    if (payload.body) formData.append('body', payload.body)
    if (payload.replyToMessageId) formData.append('replyToMessageId', payload.replyToMessageId)
    if (payload.sharedType) formData.append('sharedType', payload.sharedType)
    if (payload.sharedItemId) formData.append('sharedItemId', payload.sharedItemId)
    if (payload.media) {
      for (const file of payload.media) formData.append('media', file)
    }
    return request<ChatMessage>(`/api/chats/${chatId}/messages`, {
      method: 'POST',
      body: formData,
    })
  },
  toggleMessageReaction(chatId: string, messageId: string, emoji: string) {
    return request<ChatMessage>(`/api/chats/${chatId}/messages/${messageId}/reactions`, {
      method: 'POST',
      body: { emoji },
    })
  },
  deleteMessage(chatId: string, messageId: string) {
    return request<ChatMessage>(`/api/chats/${chatId}/messages/${messageId}`, {
      method: 'DELETE',
    })
  },
  // Follow endpoints
  toggleFollow(userId: string) {
    return request<{ following: boolean }>(`/api/users/${userId}/follow`, {
      method: 'POST',
    })
  },
  getFollowStatus(userId: string) {
    return request<{ isFollowing: boolean; isFollowedBy: boolean; isMutualFollow: boolean }>(
      `/api/users/${userId}/follow-status`,
    )
  },
  // User profile endpoints
  getUserProfile(userId: string) {
    return request<UserProfile & {
      followerCount: number
      followingCount: number
      isFollowing: boolean
      isFollowedBy: boolean
      isMutualFollow: boolean
    }>(`/api/users/${userId}/profile`)
  },
  getFollowers(userId: string) {
    return request<UserSearchResult[]>(`/api/users/${userId}/followers`)
  },
  getFollowing(userId: string) {
    return request<UserSearchResult[]>(`/api/users/${userId}/following`)
  },
  // Message requests
  getMessageRequests() {
    return request<Array<{
      id: string
      chatId: string
      senderId: string
      senderName: string
      senderUsername: string
      senderAvatarUrl?: string | null
      messageCount: number
      status: string
      createdAt: string
    }>>('/api/message-requests')
  },
  acceptMessageRequest(requestId: string) {
    return request<{ status: string }>(`/api/message-requests/${requestId}/accept`, {
      method: 'POST',
    })
  },
  declineMessageRequest(requestId: string) {
    return request<{ status: string }>(`/api/message-requests/${requestId}/decline`, {
      method: 'POST',
    })
  },
  // Call endpoints
  getActiveCalls() {
    return request<Array<{
      id: string
      chatId: string
      initiatorId: string
      initiatorName: string
      initiatorUsername: string
      initiatorAvatarUrl?: string | null
      recipientId?: string | null
      recipientName?: string | null
      recipientUsername?: string | null
      recipientAvatarUrl?: string | null
      callType: 'audio' | 'video'
      status: 'ringing' | 'accepted' | 'declined' | 'ended'
      startedAt?: string | null
      createdAt: string
    }>>('/api/calls/active')
  },
  getCallHistory(chatId: string) {
    return request<Array<{
      id: string
      initiatorId: string
      initiatorName: string
      recipientId?: string | null
      recipientName?: string | null
      callType: 'audio' | 'video'
      status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed'
      startedAt?: string | null
      endedAt?: string | null
      durationSeconds?: number | null
      createdAt: string
    }>>(`/api/chats/${chatId}/call-history`)
  },
  // Notification endpoints
  getNotifications(limit: number = 20, offset: number = 0, unreadOnly: boolean = false) {
    return request<Array<{
      id: string
      notificationType: 'follow' | 'like' | 'comment' | 'share' | 'message' | 'mention'
      isRead: boolean
      createdAt: string
      text?: string | null
      relatedPostId?: string | null
      relatedStoryId?: string | null
      relatedChatId?: string | null
      actorId: string
      actorName: string
      actorUsername: string
      actorAvatarUrl?: string | null
    }>>(`/api/notifications?limit=${limit}&offset=${offset}&unreadOnly=${unreadOnly}`)
  },
  getUnreadNotificationCount() {
    return request<{ unread: number }>('/api/notifications/unread/count')
  },
  markNotificationAsRead(notificationId: string) {
    return request<{ status: string }>(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
    })
  },
  markAllNotificationsAsRead() {
    return request<{ status: string }>('/api/notifications/mark-all-read', {
      method: 'POST',
    })
  },
  deleteNotification(notificationId: string) {
    return request<{ status: string }>(`/api/notifications/${notificationId}`, {
      method: 'DELETE',
    })
  },
  // Explore endpoints
  exploreSearch(query: string = '', limit: number = 20) {
    return request<Array<{
      id: string
      name: string
      username: string
      bio?: string | null
      avatarUrl?: string | null
      email: string
      isFollowing: boolean
      followerCount: number
    }>>(`/api/explore/search?q=${encodeURIComponent(query)}&limit=${limit}`)
  },
  exploreTrending(type: 'users' | 'hashtags' = 'users', limit: number = 10) {
    return request<
      Array<{
        id?: string
        name?: string
        username?: string
        bio?: string | null
        avatarUrl?: string | null
        followerCount?: number
        isFollowing?: boolean
        tag?: string
        count?: number
      }>
    >(`/api/explore/trending?type=${type}&limit=${limit}`)
  },
}

export { API_URL }
